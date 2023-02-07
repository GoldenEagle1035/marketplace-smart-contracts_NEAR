
//* near sdk imports
use std::collections::HashMap;

use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LazyOption, LookupMap, UnorderedSet, UnorderedMap};
use near_sdk::json_types::{Base64VecU8, ValidAccountId, U128};
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{
    env, near_bindgen, Gas, AccountId, CryptoHash, Balance, PanicOnDefault, log, ext_contract,
};
use near_sdk::BorshStorageKey;

//* Re-exports
pub use crate::nft_core::*;
pub use crate::token::*;
pub use crate::mint::*;
use crate::internal::*;
pub use crate::metadata::*;
pub use crate::events::*;

mod nft_core;
mod token;
mod mint;
mod internal;
mod metadata;
mod enumeration;
mod events;

//* Constants
pub type AlbumHash = String;
pub type SongHash = String;
pub type CoverHash = String;

const GAS_FOR_ALBUM_APPROVE: Gas = 30_000_000_000_000;
/// This spec can be treated like a version of the standard.
pub const NFT_METADATA_SPEC: &str = "1.0.0";
/// This is the name of the NFT standard we're using
pub const NFT_STANDARD_NAME: &str = "nep171";
//* Boilerplate for setting up allocator used in Wasm binary.
near_sdk::setup_alloc!();

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Contract {
    pub owner_id: AccountId,
    pub market_contract: AccountId,
    pub bundles_bought_per_album_type: LookupMap<AlbumHash,u32>,
    pub album_to_album_bundle_data: LookupMap<String, Vec<AccountId>>,
    pub metadata: LazyOption<NFTMetadata>,
    pub album_to_album_data: LookupMap<String, AlbumData>,
    pub tokens_per_owner: LookupMap<AccountId, UnorderedSet<TokenId>>,
    pub token_metadata_by_id: UnorderedMap<TokenId, TokenMetadata>,
}

//* Helper structure to for keys of the persistent collections.
#[derive(BorshStorageKey, BorshSerialize)]
pub enum StorageKey {
    BundleBoughtPerAlbumType,
    AlbumToAlbumBundleData,
    AlbumToAlbumData,
    NftMetadata,
    TokensPerOwner,
    TokenPerOwnerInner { account_id_hash: CryptoHash },
    TokenMetadataById,
}

#[near_bindgen]
impl Contract {
    //#[init(ignore_state)]
    #[init]
    pub fn new(owner_id: ValidAccountId, metadata: NFTMetadata, market_contract_id: ValidAccountId) -> Self {
        
        let this = Self {
            
            owner_id: owner_id.into(),
            market_contract: market_contract_id.into(),
            bundles_bought_per_album_type: LookupMap::new(StorageKey::BundleBoughtPerAlbumType.try_to_vec().unwrap()),
            album_to_album_bundle_data: LookupMap::new(StorageKey::AlbumToAlbumBundleData.try_to_vec().unwrap()),
            album_to_album_data: LookupMap::new(StorageKey::AlbumToAlbumData.try_to_vec().unwrap()),
            metadata: LazyOption::new(
                StorageKey::NftMetadata.try_to_vec().unwrap(),
                Some(&metadata),
            ),  
            tokens_per_owner: LookupMap::new(StorageKey::TokensPerOwner.try_to_vec().unwrap()),
            token_metadata_by_id: UnorderedMap::new(
                StorageKey::TokenMetadataById.try_to_vec().unwrap(),
            ),   
        };

        this
    }

    //* Storing the token types / Album, Listing the Album on the Market Cross Contract
    #[payable]
    pub fn add_token_types(&mut self,
        album_hash: AlbumHash,
        cover_songslist: Vec<SongHash>,
        songs_metadatalist: Vec<TokenMetadata>,
        number_of_album_copies:u32,
        price: U128,
    ){

        assert_at_least_one_yocto();
        
        let initial_storage_usage = env::storage_usage();

        if number_of_album_copies <= 0 {
            log!("{{\"success\":\"{}\",\"message\":\"{}\",\"error_type\":\"{}\"}}",false,"incorrect number of copies","INCORRECT_NO_OF_COPIES");
            panic!("incorrect number of copies");
        };

        let v: Vec<u32> = (0..number_of_album_copies).collect();

        self.album_to_album_data.insert(
            &album_hash,
            &AlbumData {
                copies_per_album_type: v.clone(),
                album_to_creator: env::predecessor_account_id().clone(),
                cover_and_song_per_album_type: cover_songslist.clone(),
            },
        );

        if (self.bundles_bought_per_album_type.insert(&album_hash, &0).is_none()) == false {
            log!("{{\"token_type\":\"{}\",\"success\":\"{}\",\"message\":\"{}\",\"error_type\":\"{}\"}}", &album_hash,false, "album type exists", "ALBUM_TYPE_EXISTS");
            panic!("Album Already exists");
        };

        for (_index, album_copie) in (0..number_of_album_copies.clone()).enumerate() {
            let mut i = 0;
            while i < cover_songslist.len() {
                let token_id:TokenId = format!("{}:{}:{}", &album_hash, album_copie + 1, cover_songslist[i]);
                self.token_metadata_by_id.insert(&token_id, &songs_metadatalist[i]);
                i += 1;
            }
        }

        let storage_cost = env::storage_byte_cost() * Balance::from(env::storage_usage() - initial_storage_usage);
        
        //* Cross Contract Call to Market Contract Call
        ext_non_fungible_album_approval_receiver::album_on_approve(
            album_hash,
            env::signer_account_id(),
            price,
            &self.market_contract,
            env::attached_deposit()
            .checked_sub(storage_cost)
            .expect("Deposit not enough for approval"),
            env::prepaid_gas() - GAS_FOR_ALBUM_APPROVE,
        );
        
    }

    pub fn get_album_bundle_owners(&self, album_hash_copy: String) -> Option<Vec<AccountId>> {
        self.album_to_album_bundle_data.get(&album_hash_copy)
    }

}

#[ext_contract(ext_non_fungible_album_approval_receiver)]
trait NonFungibleAlbumApprovalReceiver {
    fn album_on_approve(&mut self, album_hash: AlbumHash, owner_id: AccountId, price: U128);
}

#[cfg(not(target_arch = "wasm32"))]
#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::MockedBlockchain;
    use near_sdk::{testing_env, VMContext};

    use super::*;
    use near_sdk::json_types::ValidAccountId;
    use std::convert::TryFrom;

    fn alice() -> ValidAccountId {
        ValidAccountId::try_from("alice.near").unwrap()
    }
    fn bob() -> ValidAccountId {
        ValidAccountId::try_from("bob.near").unwrap()
    }
    fn carol() -> ValidAccountId {
        ValidAccountId::try_from("carol.near").unwrap()
    }
    fn dex() -> ValidAccountId {
        ValidAccountId::try_from("dex.near").unwrap()
    }
    fn get_market_contract_id() -> ValidAccountId {
        ValidAccountId::try_from("market.amplifytest.testnet").unwrap()
    }
    fn get_context() -> VMContext {
        VMContext {
            predecessor_account_id: "alice.testnet".to_string(),
            current_account_id: "alice.testnet".to_string(),
            signer_account_id: "bob.testnet".to_string(),
            signer_account_pk: vec![0],
            input: vec![],
            block_index: 0,
            block_timestamp: 0,
            account_balance: 0,
            account_locked_balance: 0,
            attached_deposit: 0,
            prepaid_gas: 10u64.pow(18),
            random_seed: vec![0, 1, 2],
            is_view: false,
            output_data_receivers: vec![],
            epoch_height: 19,
            storage_usage: 1000
        }
    }
        
    #[test]
    fn test_new() {
        let mut context = get_context();
        //let mut contract = Contract::new(dex(), get_market_contract_id());
        // testing_env!(context.is_view(true).build());
        // assert_eq!(contract.nft_token("1".to_string()), None);
    }

}
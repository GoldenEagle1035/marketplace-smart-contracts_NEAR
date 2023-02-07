
// NEAR SDK Imports
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::json_types::{ValidAccountId};
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::json_types::{Base64VecU8, U128, U64};
use near_sdk::collections::{LookupMap};
use near_sdk::{
    env, ext_contract, near_bindgen, AccountId, Balance, Gas,
    BorshStorageKey, PanicOnDefault, Promise,log, 
};

// Rust Std Library Imports
use std::collections::HashMap;

// Re-export of modules
pub use crate::sale::*;
pub use crate::external::*;
mod sale;
mod external;
mod nft_callbacks;

// Type Declarations
pub type ContractAndTokenId = String;
pub type TokenId = String;
pub type AlbumHash = String;

// Constants
const NO_DEPOSIT: Balance = 0;

// Payout determines who gets what after 
pub type Payout = HashMap<AccountId, U128>;

// Boilerplate for setting up allocator used in Wasm binary.
near_sdk::setup_alloc!();

//* Contract Struct Declaration for NEAR collections
#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Contract {
    pub owner_id: AccountId,
    pub sales: LookupMap<ContractAndTokenId, Sale>,
    pub song_sales: LookupMap<ContractAndTokenId, SaleSong>,
    pub nft_contract_id: AccountId,
}

//* Helper structure to for keys of the persistent collections.
#[derive(BorshStorageKey, BorshSerialize)]
pub enum StorageKey {
    Sales,
    SongSales,
}

#[near_bindgen]
impl Contract {
    
    //* Contract Initializer Method
    #[init]
    //#[init(ignore_state)]
    pub fn new(owner_id: ValidAccountId, nft_contract_id: ValidAccountId ) -> Self {

        let this = Self {

            //* Owner of the contract
            owner_id: owner_id.into(),

            //* Album Sales
            sales: LookupMap::new(StorageKey::Sales.try_to_vec().unwrap()),
            
            //* Song Sales
            song_sales: LookupMap::new(StorageKey::SongSales.try_to_vec().unwrap()),
                
            //* Album
            nft_contract_id: nft_contract_id.into(),
        };

        this
    }

    pub fn get_album_sale(&self, nft_contract_id: AccountId, album_hash: String) -> Option<Sale> {
        let nft_contract_token = format!("{}{}{}", nft_contract_id,":", album_hash);
        self.sales.get(&nft_contract_token)
    }

    pub fn get_song_sale(&self, nft_contract_id: AccountId, song_token_id: String) -> Option<SaleSong> {
        let nft_contract_token = format!("{}{}{}", nft_contract_id,":", song_token_id);
        self.song_sales.get(&nft_contract_token)
    }
    
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
    fn get_nft_contract_id() -> ValidAccountId {
        ValidAccountId::try_from("nft.amplifytest.testnet").unwrap()
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
        let mut contract = Contract::new(dex(), get_nft_contract_id());
        // testing_env!(context.is_view(true).build());
        // assert_eq!(contract.nft_token("1".to_string()), None);
    }

}
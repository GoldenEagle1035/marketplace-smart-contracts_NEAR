use crate::*;
use near_sdk::json_types::{ValidAccountId, U64};
use near_sdk::{ext_contract, log, Gas};

//* CONSTANTS
//* This is good. Finally the promises will be better
const GAS_FOR_NFT_APPROVE: Gas = 60_000_000_000_000;

//? Why dont we need this constants now
//// const GAS_FOR_RESOLVE_TRANSFER: Gas = 10_000_000_000_000;
///// const GAS_FOR_NFT_TRANSFER_CALL: Gas = 25_000_000_000_000 + GAS_FOR_RESOLVE_TRANSFER;
///// const NO_DEPOSIT: Balance = 0;
//* These are all NFT standards, need to make the contract as compatible to NEP-171 contract as possible.

pub trait NonFungibleTokenCore {
    
    //* Transfer Album Bundle and generates a payout variable which Market acts on
    fn nft_transfer_payout(
        &mut self,
        album_hash: String,
        balance:Option<U128>,
    ) -> Option<Payout>;

    //* Transfer Song NFT and generates a payout variable which Market acts on
    fn nft_transfer_payout_song(
        &mut self,
        song_token_id: String,
        receiver_id: ValidAccountId,
        balance:Option<U128>,
    ) -> Option<Payout>;

    //* Approve the marketplace for sale of the song NFT
    fn nft_approve(&mut self, token_id: TokenId, account_id: ValidAccountId, price: U128);

    //* View Method to know the owner and metadata of a particular token
    fn nft_token(&self, token_id: TokenId) -> Option<JsonToken>;

}

#[ext_contract(ext_non_fungible_token_receiver)]
trait NonFungibleTokenReceiver {
    /// Returns `true` if the token should be returned back to the sender.
    fn nft_on_transfer(
        &mut self,
        sender_id: AccountId,
        previous_owner_id: AccountId,
        token_id: TokenId,
        msg: String,
    ) -> Promise;
}

#[ext_contract(ext_non_fungible_approval_receiver)]
trait NonFungibleTokenApprovalsReceiver {
    fn nft_on_approve(
        &mut self,
        token_id: TokenId,
        owner_id: AccountId,
        price: U128,
    );
}

#[ext_contract(ext_non_fungibles_approval_receiver)]
trait NonFungibleTokensApprovalsReceiver {
    fn nft_on_approve_bulk(
        &mut self,
        tokens: Vec<TokenId>,
        owner_id: AccountId,
    );
}

#[ext_contract(ext_self)]
trait NonFungibleTokenResolver {
    fn nft_resolve_transfer(
        &mut self,
        owner_id: AccountId,
        receiver_id: AccountId,
        approved_account_ids: HashMap<AccountId, U64>,
        token_id: TokenId,
    ) -> bool;
}

trait NonFungibleTokenResolver {
    fn nft_resolve_transfer(
        &mut self,
        owner_id: AccountId,
        receiver_id: AccountId,
        approved_account_ids: HashMap<AccountId, U64>,
        token_id: TokenId,
    ) -> bool;
}

#[near_bindgen]
impl NonFungibleTokenCore for Contract {

    //* Royalty Support    
    //* Meant for Album Bundle Royalty Support
    //* original sell [97% to seller, 3% to platform]
    #[payable]
    fn nft_transfer_payout(
        &mut self,
        album_hash_copy: String,
        balance: Option<U128>,
    ) -> Option<Payout> {
        
        let owner_id = self.nft_mint(album_hash_copy.clone());

        let payout = if let Some(balance) = balance {

            let complete_royalty = 10_000u128;
            let balance_piece = u128::from(balance) / complete_royalty;
            let mut payout: Payout = HashMap::new();

            // Payout to Platform
            payout.insert(self.owner_id.clone(), U128(300 as u128 * balance_piece));
          
            // payout to Seller
            payout.insert(owner_id, U128(9700 as u128 * balance_piece));

            Some(payout)
            
        } else {
            None
        };

        payout

    }

    //* secondary sell [95% to seller, 2% to platform, 3% to original artist]
    #[payable]
    fn nft_transfer_payout_song(
        &mut self,
        song_token_id: String,
        receiver_id: ValidAccountId,
        balance: Option<U128>,
    ) -> Option<Payout> {
    
        let sender_id = env::predecessor_account_id();

        // First transfer the song token
        let owner_id = self.internal_transfer(&sender_id, receiver_id.as_ref(), &song_token_id);

        let mut split = song_token_id.split(":");
        
        if split.clone().count() != 3 {
            log!("{{\"success\":\"{}\",\"message\":\"{}\",\"error_type\":\"{}\"}}",false,"incorrect token id","INCORRECT_TOKEN_ID");
            panic!("Incorrect Token ID")
        } 

        let (album_id, _copy_no, _song_id) = (split.next().unwrap(), split.next().unwrap(),split.next().unwrap());
        // let artist = self.album_to_creator.get(&album_id.to_string()).unwrap();
        let album_data = self.album_to_album_data.get(&album_id.to_string()).unwrap();
        let artist = album_data.album_to_creator;

        // Get the album royalty structure
        let payout = if let Some(balance) = balance {

            let complete_royalty = 10_000u128;
            let balance_piece = u128::from(balance) / complete_royalty;
            let mut payout: Payout = HashMap::new();

            // Payout to Platform
            payout.insert(self.owner_id.clone(), U128(200 as u128 * balance_piece));
          
            // Payout to Artist
            payout.insert(artist, U128(300 as u128 * balance_piece));

            // payout to Seller
            payout.insert(owner_id, U128(9500 as u128 * balance_piece));


            Some(payout)

        } else {
            None
        };

        payout
    }

    #[payable]
    fn nft_approve(&mut self, token_id: TokenId, account_id: ValidAccountId, price: U128) {
        assert_at_least_one_yocto();
        
        let initial_storage_usage = env::storage_usage();
        let account_id: AccountId = account_id.into();
        
        if &account_id != &self.market_contract{
            
            log!("{{\"success\":\"{}\",\"message\":\"{}\",\"error_type\":\"{}\"}}",false,"wrong market","WRONG_MARKET_ID");
            panic!("wrong market id");

        }
        // ALbum1:1:song1

        let mut split = token_id.split(":");

        if split.clone().count() != 3 {
            log!("{{\"success\":\"{}\",\"message\":\"{}\",\"error_type\":\"{}\"}}",false,"incorrect token id","INCORRECT_TOKEN_ID");
            panic!("Incorrect Token ID")
        } 

        let (album_id, copy_no, song_id) = (split.next().unwrap(), split.next().unwrap(), split.next().unwrap());

        // let (album_id, copy_no, song_id) = (split.next().unwrap(), split.next().unwrap(),split.next().unwrap());
        //Eg album:1
        let final_album_id = format!("{}:{}", album_id, copy_no);
        let owner_vectors = self.album_to_album_bundle_data.get(&final_album_id).unwrap();
        let album_data = self.album_to_album_data.get(&album_id.to_string()).unwrap();
        let song_vectors = album_data.cover_and_song_per_album_type;

        let index = song_vectors.iter().position(|r| r == song_id).unwrap();

        if &env::predecessor_account_id() != &owner_vectors[index] {
            
            log!("{{\"token_id\":\"{}\",\"predecessor\":\"{}\",\"token_owner\":\"{}\", \"success\":\"{}\",\"message\":\"{}\",\"error_type\":\"{}\"}}",token_id,&env::predecessor_account_id(), &owner_vectors[index], false,"Predecessor must be the token owner","PREDECESSOR_NOT_TOKEN_OWNER");
            panic!("Predecessor must be the token owner");
        
        }

        let storage_cost = env::storage_byte_cost() * Balance::from(env::storage_usage() - initial_storage_usage);

        ext_non_fungible_approval_receiver::nft_on_approve(
            token_id.clone(),
            env::signer_account_id(),
            price,
            &account_id,
            env::attached_deposit()
                    .checked_sub(storage_cost)
                    .expect("Deposit not enough for approval"),
            env::prepaid_gas() - GAS_FOR_NFT_APPROVE,
        );

    }

    fn nft_token(&self, token_id: TokenId) -> Option<JsonToken> {
        
        let metadata = self.token_metadata_by_id.get(&token_id).unwrap();
        let mut split = token_id.split(":");
        let (album_id, copy_no, song_id) = (split.next().unwrap(), split.next().unwrap(),split.next().unwrap());
        // let album_data = self.album_to_album_data.get(&album_id.to_string()).unwrap();
        let album_data_option = self.album_to_album_data.get(&album_id.to_string());
        if album_data_option.is_none() {
            return None
        }
        let album_data = album_data_option.unwrap();
        let final_album_id = format!("{}:{}", album_id, copy_no);
        let owner_vector_option = self.album_to_album_bundle_data.get(&final_album_id);
        if owner_vector_option.is_none() {
            
            return Some(JsonToken {
                token_id:token_id.clone(),
                owner_id:album_data.album_to_creator.clone(),
                //album: final_album_id.clone(),
                metadata,
            })
        
        }

        let owner_vectors = owner_vector_option.unwrap();
        let song_vectors = album_data.cover_and_song_per_album_type;

        let index = song_vectors.iter().position(|r| r == song_id).unwrap();
        let owner_id = owner_vectors[index].clone();
        
        Some(JsonToken {
            token_id: token_id.clone(),
            owner_id: owner_id.clone(),
            metadata,
        })
    }
}
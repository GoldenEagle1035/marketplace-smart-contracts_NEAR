
use crate::*;
use near_sdk::{log, CryptoHash, utils};

    pub(crate) fn assert_at_least_one_yocto() {

        if (env::attached_deposit() >= 1) == false {
            log!("{{\"success\":\"{}\",\"message\":\"{}\",\"error_type\":\"{}\"}}",false,"Requires attached deposit of at least 1 yoctoNEAR","ATTACHED_DEPOSIT_ATLEAST_1_YOCTO_REQUIRED");
            panic!("Requires attached deposit of at least 1 yoctoNEAR");
        }
        
    }

    //used to generate a unique prefix in our storage collections (this is to avoid data collisions)
    pub(crate) fn hash_account_id(account_id: &AccountId) -> CryptoHash {
        //get the default hash
        let mut hash = CryptoHash::default();
        //we hash the account ID and return it
        hash.copy_from_slice(&env::sha256(account_id.as_bytes()));
        hash
    }

impl Contract {

    //add a token to the set of tokens an owner has
    pub(crate) fn internal_add_token_to_owner(
        &mut self,
        account_id: &AccountId,
        token_id: &TokenId,
    ) {
        //get the set of tokens for the given account
        let mut tokens_set = self.tokens_per_owner.get(account_id).unwrap_or_else(|| {
            //if the account doesn't have any tokens, we create a new unordered set
            UnorderedSet::new(
                StorageKey::TokenPerOwnerInner {
                    //we get a new unique prefix for the collection
                    account_id_hash: hash_account_id(&account_id),
                }
                .try_to_vec()
                .unwrap(),
            )
        });

        //we insert the token ID into the set
        tokens_set.insert(token_id);

        //we insert that set for the given account ID. 
        self.tokens_per_owner.insert(account_id, &tokens_set);
    }

    //remove a token from an owner (internal method and can't be called directly via CLI).
    pub(crate) fn internal_remove_token_from_owner(
        &mut self,
        account_id: &AccountId,
        token_id: &TokenId,
    ) {
        //we get the set of tokens that the owner has
        let mut tokens_set = self
            .tokens_per_owner
            .get(account_id)
            //if there is no set of tokens for the owner, we panic with the following message:
            .expect("Token should be owned by the sender");

        //we remove the the token_id from the set of tokens
        tokens_set.remove(token_id);

        //if the token set is now empty, we remove the owner from the tokens_per_owner collection
        if tokens_set.is_empty() {
            self.tokens_per_owner.remove(account_id);
        } else {
        //if the token set is not empty, we simply insert it back for the account ID. 
            self.tokens_per_owner.insert(account_id, &tokens_set);
        }
    }

    pub(crate) fn internal_transfer(
        &mut self,
        sender_id: &AccountId,
        receiver_id: &AccountId,
        token_id: &TokenId,
    ) -> AccountId {

        let mut split = token_id.split(":");
  
        if  split.clone().count() != 3 {
            log!("{{\"success\":\"{}\",\"message\":\"{}\",\"error_type\":\"{}\"}}",false,"incorrect token id","INCORRECT_TOKEN_ID");
            panic!("Incorrect ID");
        }
        
        let (album_id, copy_no, song_id) = (split.next().unwrap(), split.next().unwrap(),split.next().unwrap());
        
        let final_album_id = format!("{}:{}", album_id, copy_no);
        
        let mut owner_vectors = self.album_to_album_bundle_data.get(&final_album_id).unwrap();
        let album_data = self.album_to_album_data.get(&album_id.to_string()).unwrap();
        let song_vectors = album_data.cover_and_song_per_album_type;    
        let index = song_vectors.iter().position(|r| r == song_id).unwrap();
        let prev_owner_id = owner_vectors[index].clone();
    
        if sender_id != &self.market_contract {
            log!("{{\"success\":\"{}\",\"message\":\"{}\",\"error_type\":\"{}\"}}",false,"unauthorized call","UNAUTHORISED_CALL");
            panic!("Unauthorized");
        }
        
        let _got = std::mem::replace(&mut owner_vectors[index], receiver_id.clone());
    
        log!(
            "Transfer {} from @{} to @{}",
            token_id,
            &prev_owner_id,
            receiver_id.clone()
        );

        //we remove the token from it's current owner's set
        self.internal_remove_token_from_owner(&prev_owner_id.to_string(), token_id);
        //we then add the token to the receiver_id's set
        self.internal_add_token_to_owner(receiver_id, token_id);

        self.album_to_album_bundle_data.insert(&final_album_id, &owner_vectors);

        prev_owner_id

    }
}

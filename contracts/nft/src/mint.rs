use crate::*;

const GAS_FOR_NFT_APPROVE: Gas = 30_000_000_000_000;

#[near_bindgen]
impl Contract {

    #[payable]
    pub fn nft_mint(
        &mut self,
        album_hash_copy: String,//Album:1//Album:2//Album:3
    ) -> AccountId {
        assert_at_least_one_yocto();
        let initial_storage_usage = env::storage_usage();

        let mut split = album_hash_copy.split(":");
        
        if split.clone().count() != 2 {
            
            log!("{{\"success\":\"{}\",\"message\":\"{}\",\"error_type\":\"{}\"}}",false,"incorrect bundle id","INCORRECT_BUNDLE_ID");
            panic!("Incorrect Bundle ID");
        
        }

        let (album_id, copy_no) = (split.next().unwrap(), split.next().unwrap());

        //* Called when offer is called to set owner of the album bundle song NFTs  
        if &env::predecessor_account_id() != &self.market_contract {
            
            log!("{{\"success\":\"{}\",\"message\":\"{}\",\"error_type\":\"{}\"}}",false,"unauthorized call","UNAUTHORISED_CALL");
            panic!("predecessor_account_id (market?) not approved")
        
        }

        let album_data = self.album_to_album_data.get(&album_id.to_string()).unwrap();

        let number_of_max_copies = album_data.copies_per_album_type.len();

        let v = self.bundles_bought_per_album_type.get(&album_id.to_string());//1,2,3

        let v_1 = v.unwrap() + 1;

        let no = copy_no.parse::<u32>().unwrap();
        //album:2 cannot be bought befroe album:1
        //Serial buy
        if v_1 != no {
            
            if no > v_1 {

                log!("{{\"album_type\":\"{}\",\"success\":\"{}\",\"message\":\"{}\",\"error_type\":\"{}\"}}",album_hash_copy,false,"album already bought","ALBUM_SERIAL_BUY_ERROR");
                panic!("album serial buy error");

            }

            if no < v_1 {

                log!("{{\"album_type\":\"{}\",\"success\":\"{}\",\"message\":\"{}\",\"error_type\":\"{}\"}}",album_hash_copy,false,"album already bought","ALBUM_ALREADY_BOUGHT");
                panic!("album already bought");

            }
        }
    
        //* If greater than number of copies, don't mint.
        if v_1 > number_of_max_copies as u32 {

            log!("{{\"album_type\":\"{}\",\"success\":\"{}\",\"message\":\"{}\",\"error_type\":\"{}\"}}",album_hash_copy,false,"Cant buy more album bundles","NO_MORE_BUNDLES");
            panic!("No more album bundles available");

        }
        
        self.bundles_bought_per_album_type.insert(&album_id.to_string(), &v_1);

        let owner_id = env::signer_account_id();

        let final_album_id = format!("{}", album_hash_copy);

        let number_of_songs = album_data.cover_and_song_per_album_type;

        let mut cc: Vec<String> = vec![];

        let mut tokens: Vec<TokenId> = vec![];
       
        //Get tokens_per_owner populated by data
        let mut tokens_set = self.tokens_per_owner.get(&env::signer_account_id().to_string()).unwrap_or_else(|| {
            //if the account doesn't have any tokens, we create a new unordered set
            UnorderedSet::new(
                StorageKey::TokenPerOwnerInner {
                    //we get a new unique prefix for the collection
                    account_id_hash: hash_account_id(&env::signer_account_id().to_string()),
                }
                .try_to_vec()
                .unwrap(),
            )
        });

        for _x in number_of_songs.clone() {

            cc.push(owner_id.clone());

            let token_id:TokenId = format!("{}:{}", album_hash_copy, _x);

            //Get tokens_per_owner populated by data
            tokens_set.insert(&token_id);

            //insert the token ID and metadata
            //self.token_metadata_by_id.insert(&token_id, &metadata);

            tokens.push(token_id);
        }
        
        let storage_cost = env::storage_byte_cost() * Balance::from(env::storage_usage() - initial_storage_usage);

        ext_non_fungibles_approval_receiver::nft_on_approve_bulk(
            tokens.clone(),
            env::signer_account_id(),
            &self.market_contract,
            env::attached_deposit()
                .checked_sub(storage_cost)
                .expect("Deposit not enough for approval"),
            env::prepaid_gas() - GAS_FOR_NFT_APPROVE,
        );
        
        // SongIPFSHash1, SongIPFSHash2 // Struct Values
        // Owner 1, Owner 1 // Vector with all the owners
        // Album:1 --> Song1, song2, song3
        //Album:1 --> Owner1, Owner2, Owner3
        self.album_to_album_bundle_data.insert(&final_album_id, &cc);
        
        //Get tokens_per_owner populated by data
        self.tokens_per_owner.insert(&env::signer_account_id().to_string(), &tokens_set);

        // Construct the mint log as per the events standard.
        let nft_mint_log: EventLog = EventLog {
            // Standard name ("nep171").
            standard: NFT_STANDARD_NAME.to_string(),
            // Version of the standard ("nft-1.0.0").
            version: NFT_METADATA_SPEC.to_string(),
            // The data related with the event stored in a vector.
            event: EventLogVariant::NftMint(vec![NftMintLog {
                // Owner of the token.
                owner_id: env::signer_account_id().to_string(),
                // Vector of token IDs that were minted.
                token_ids: tokens,
                // An optional memo to include.
                memo: None,
            }]),
        };

        // Log the serialized json.
        log!("{}", &nft_mint_log.to_string());

        //* Return to nft_transfer_payout in nft_core.rs
        album_data.album_to_creator
        
    }

}

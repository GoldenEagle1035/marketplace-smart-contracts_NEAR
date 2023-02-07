use crate::*;

/// approval callbacks from NFT Contracts

// Trait Declaration for Song NFT Approval
//? do we need more params for some reason
trait NonFungibleTokenApprovalsReceiver {
    fn nft_on_approve(&mut self, token_id: TokenId, owner_id: ValidAccountId, price: U128);
}

trait NonFungibleTokensApprovalsReceiver {
    fn nft_on_approve_bulk(&mut self, tokens: Vec<TokenId>, owner_id: ValidAccountId);
}

// Trait Declaration for Album NFT Approval
//? do we need more params for some reason
trait NonFungibleAlbumApprovalReceiver {
    fn album_on_approve(&mut self, album_hash: AlbumHash, owner_id: ValidAccountId, price: U128);
}

#[near_bindgen]
impl NonFungibleTokenApprovalsReceiver for Contract {
    // For a Song NFT Approval on the marketplace
    #[payable]
    fn nft_on_approve(&mut self, token_id: TokenId, owner_id: ValidAccountId, price: U128) {
        self.check_valid_callback(owner_id.clone());

        let nft_contract_id = env::predecessor_account_id();

        let contract_and_token_id = format!("{}{}{}", nft_contract_id, ":", token_id);
        log!("{:?} contract_and_token_id", contract_and_token_id);

        let existing = self.song_sales.get(&contract_and_token_id);
        if existing.is_some() {
            panic!("Song is already in sale");
        }
        self.song_sales.insert(
            &contract_and_token_id,
            &SaleSong {
                owner_id: owner_id.clone().into(),
                token_id: token_id.clone().into(),
                price,
                created_at: env::block_timestamp().into(),
            },
        );
    }
}

#[near_bindgen]
impl NonFungibleTokensApprovalsReceiver for Contract {
    // For a Song NFT Approval on the marketplace
    #[payable]
    fn nft_on_approve_bulk(&mut self, tokens: Vec<TokenId>, owner_id: ValidAccountId) {
        self.check_valid_callback(owner_id.clone());

        let nft_contract_id = env::predecessor_account_id();
        for token_id in tokens {
            let contract_and_token_id = format!("{}{}{}", nft_contract_id, ":", token_id);
            log!("{:?} contract_and_token_id", contract_and_token_id);
            self.song_sales.insert(
                &contract_and_token_id,
                &SaleSong {
                    owner_id: owner_id.clone().into(),
                    token_id: token_id.clone().into(),
                    price: U128(0),
                    created_at: env::block_timestamp().into(),
                },
            );
        }
    }
}

#[near_bindgen]
impl NonFungibleAlbumApprovalReceiver for Contract {
    //* Adds a sale for particular Album Series
    //* Call from the NFT Contract
    #[payable]
    fn album_on_approve(&mut self, album_hash: AlbumHash, owner_id: ValidAccountId, price: U128) {
        self.check_valid_callback(owner_id.clone());

        let nft_contract_id = env::predecessor_account_id();
        if nft_contract_id != self.nft_contract_id {
            log!(
                "{{\"success\":\"{}\",\"message\":\"{}\",\"error_type\":\"{}\"}}",
                false,
                "unauthorized call",
                "UNAUTHORISED_CALL"
            );
            panic!("Unauthorized");
        }

        let contract_and_token_id = format!("{}{}{}", nft_contract_id, ":", album_hash);
        self.sales.insert(
            &contract_and_token_id,
            &Sale {
                owner_id: owner_id.clone().into(),
                created_at: env::block_timestamp().into(),
                album_name: album_hash.clone(),
                price,
                is_album: Some(true),
            },
        );
    }
}

//? why is this needed
#[near_bindgen]
impl Contract {
    #[private]
    pub fn check_valid_callback(&mut self, owner_id: ValidAccountId) {
        // enforce cross contract calls and owner_id is signer

        let nft_contract_id = env::predecessor_account_id();
        let signer_id = env::signer_account_id();
        assert_ne!(
            nft_contract_id, signer_id,
            "nft_on_approve should only be called via cross-contract call"
        );

        assert_eq!(
            owner_id.as_ref(),
            &signer_id,
            "owner_id should be signer_id"
        );
    }
}

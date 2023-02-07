use crate::*;

const GAS_FOR_MINT: Gas = 40_000_000_000_000;
const GAS_FOR_ROYALTIES: Gas = 120_000_000_000_000;
use near_sdk::promise_result_as_success;
use near_sdk::utils;

//* Sale Structure for Album Sales
#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct Sale {
    pub owner_id: AccountId,
    pub created_at: U64,
    pub album_name: String,
    pub price: U128, // required
    pub is_album: Option<bool>,
}

//* Sale Structure for
#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct SaleSong {
    pub owner_id: AccountId,
    pub token_id: String,
    pub price: U128,
    pub created_at: U64, // required
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct TokenMetadata {
    pub title: Option<String>, // ex. "Arch Nemesis: Mail Carrier" or "Parcel #5055"
    pub description: Option<String>, // free-form description
    pub media: Option<String>, // URL to associated media, preferably to decentralized, content-addressed storage
    pub media_hash: Option<Base64VecU8>, // Base64-encoded sha256 hash of content referenced by the `media` field. Required if `media` is included.
    pub copies: Option<u64>, // number of copies of this set of metadata in existence when token was minted.
    pub issued_at: Option<u64>, // When token was issued or minted, Unix epoch in milliseconds
    pub expires_at: Option<u64>, // When token expires, Unix epoch in milliseconds
    pub starts_at: Option<u64>, // When token starts being valid, Unix epoch in milliseconds
    pub updated_at: Option<u64>, // When token was last updated, Unix epoch in milliseconds
    pub extra: Option<String>, // anything extra the NFT wants to store on-chain. Can be stringified JSON.
    pub reference: Option<String>, // URL to an off-chain JSON file with more info.
    pub reference_hash: Option<Base64VecU8>, // Base64-encoded sha256 hash of JSON from reference field. Required if `reference` is included.
}

//? Why is this here, when we have price as param in Sales
#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct Price {
    pub price: Option<U128>,
}

#[near_bindgen]
impl Contract {
    //* Buy Method for Album
    #[payable]
    pub fn offer_album(&mut self, nft_contract_id: ValidAccountId, albumipfs_hash_copy: String) {
        let contract_id: AccountId = nft_contract_id.clone().into();

        if &contract_id != &self.nft_contract_id {
            log!(
                "{{\"success\":\"{}\",\"message\":\"{}\",\"error_type\":\"{}\"}}",
                false,
                "wrong nft id",
                "WRONG_NFT_ID"
            );
            panic!("wrong nft id");
        }

        let mut split = albumipfs_hash_copy.split(":");

        if split.clone().count() != 2 {
            log!(
                "{{\"success\":\"{}\",\"message\":\"{}\",\"error_type\":\"{}\"}}",
                false,
                "incorrect bundle id",
                "INCORRECT_BUNDLE_ID"
            );
            panic!("Incorrect Bundle ID")
        }

        let (album_id, _copy_no) = (split.next().unwrap(), split.next().unwrap());
        let contract_and_token_id = format!("{}{}{}", contract_id, ":", album_id);
        //* No need to actually remove sale for now if album are greater than, as the thing will fail anyway
        //* But removing sale will help in saving storage
        let v = self.sales.get(&contract_and_token_id);

        let sale = if v.is_some() {
            v.unwrap()
        } else {
            log!(
                "{{\"success\":\"{}\",\"message\":\"{}\",\"error_type\":\"{}\"}}",
                false,
                "No sale",
                "NO_SUCH_SALE"
            );
            panic!("No sale");
        };
        let buyer_id = env::predecessor_account_id();

        if (sale.owner_id == buyer_id) == true {
            log!(
                "{{\"success\":\"{}\",\"message\":\"{}\",\"error_type\":\"{}\"}}",
                false,
                "Cannot buy on your own sale",
                "CANNOT_BUY_ON_OWN_SALE"
            );
            panic!("Cannot buy on your own sale");
        }

        let deposit = env::attached_deposit();
        let price = sale.price;

        if (deposit > 0) == false {
            log!(
                "{{\"success\":\"{}\",\"message\":\"{}\",\"error_type\":\"{}\"}}",
                false,
                "Attached deposit must be greater than 0",
                "DEPOSIT_NOT_GREATER_THAN_0"
            );
            panic!("Attached deposit must be greater than 0");
        }

        if deposit >= price.0 {
            ext_contract::nft_transfer_payout(
                albumipfs_hash_copy,
                Some(U128::from(deposit)),
                &nft_contract_id,
                env::attached_deposit(),
                GAS_FOR_MINT,
            )
            .then(ext_self::resolve_purchase(
                env::signer_account_id(),
                U128::from(deposit),
                price,
                Some(contract_and_token_id),
                &env::current_account_id(),
                NO_DEPOSIT,
                GAS_FOR_ROYALTIES,
            ));
        } else {
            //* If the deposit is less then panic and give error in Logs
            log!(
                "{{\"success\":\"{}\",\"message\":\"{}\",\"error_type\":\"{}\"}}",
                false,
                "deposit is not equal to sale price",
                "DEPOSIT_NOT_EQUAL_TO_SALE_PRICE"
            );
            panic!("deposit is not equal to sale price");
        }
    }

    #[payable]
    pub fn offer(
        &mut self,
        nft_contract_id: ValidAccountId,
        receiver_id: ValidAccountId,
        song_token_id: String,
    ) {
        let deposit = env::attached_deposit();
        let contract_id: AccountId = nft_contract_id.clone().into();
        if &contract_id != &self.nft_contract_id {
            log!(
                "{{\"success\":\"{}\",\"message\":\"{}\",\"error_type\":\"{}\"}}",
                false,
                "wrong nft id",
                "WRONG_NFT_ID"
            );
            panic!("wrong nft id");
        }

        let contract_and_token_id = format!("{}{}{}", contract_id, ":", song_token_id);
        let v = self.song_sales.get(&contract_and_token_id);

        let sale = if v.is_some() {
            v.unwrap()
        } else {
            log!(
                "{{\"success\":\"{}\",\"message\":\"{}\",\"error_type\":\"{}\"}}",
                false,
                "No sale",
                "NO_SUCH_SONG_SALE"
            );
            panic!("No sale");
        };

        let price = sale.price;

        if deposit >= price.0 {
            ext_contract::nft_transfer_payout_song(
                song_token_id,
                receiver_id,
                Some(U128::from(deposit)),
                &nft_contract_id,
                1,
                GAS_FOR_MINT,
            )
            .then(ext_self::resolve_purchase(
                env::signer_account_id(),
                U128::from(deposit),
                price,
                Some(contract_and_token_id),
                &env::current_account_id(),
                NO_DEPOSIT,
                GAS_FOR_ROYALTIES,
            ));
        } else {
            //* If the deposit is less then panic and give error in Logs
            log!(
                "{{\"success\":\"{}\",\"message\":\"{}\",\"error_type\":\"{}\"}}",
                false,
                "deposit is not equal to sale price",
                "DEPOSIT_NOT_EQUAL_TO_SALE_PRICE"
            );
            panic!("deposit is not equal to sale price");
        }
    }
    //* Suited for Amplify Art Purposes
    //* original sell [97% to seller, 3% to platform]
    //* secondary sell [95% to seller, 2% to platform, 3% to original artist]

    #[private]
    pub fn resolve_purchase(
        &mut self,
        buyer_id: AccountId,
        paid: U128,
        price: U128,
        contract_and_token_id: Option<String>,
    ) -> Option<U128> {
        //* Convert Promise to Value
        let payout_option = promise_result_as_success().and_then(|value| {
            //* None means a bad payout from bad NFT contract

            near_sdk::serde_json::from_slice::<Payout>(&value)
                .ok()
                .and_then(|payout| {
                    if payout.len() > 3 || payout.is_empty() {
                        log!("Cannot have more than 3 royalties or no royalties");
                        None
                    } else {
                        let mut remainder = price.0;
                        for &value in payout.values() {
                            remainder = remainder.checked_sub(value.0)?;
                        }
                        if remainder == 0 || remainder == 1 {
                            Some(payout)
                        } else {
                            None
                        }
                    }
                })
        });

        //* is payout option valid?
        let payout = if let Some(payout_option) = payout_option {
            // Only if the payout is valid remove the sale, else dont
            if contract_and_token_id.is_some() {
                self.song_sales
                    .remove(&contract_and_token_id.unwrap())
                    .expect("Not able to remove sale for some reason");

                //self.tokens_per_owner.remove();
            } else {
                panic!("Can not find contract_and_token_id");
            }
            payout_option
        } else {
            //* pay back the deposit for minting the token if this was a series purchase and unsuccessful
            Promise::new(buyer_id).transfer(u128::from(paid));
            return None;
        };
        // NEAR payouts
        for (receiver_id, amount) in payout {
            Promise::new(receiver_id).transfer(amount.0);
        }

        Some(price)
    }
    #[payable]
    pub fn remove_song_sale(&mut self, nft_contract_id: ValidAccountId, token_id: String) {
        // utils::assert_one_yocto();
        let contract_and_token_id = format!("{}{}{}", &nft_contract_id, ":", token_id);
        let signer_id = env::predecessor_account_id();
        let current_owner = self.song_sales.get(&contract_and_token_id.clone()).unwrap();
        assert_eq!(
            signer_id, current_owner.owner_id,
            "Only token owner can delist"
        );
        log!(
            "{:?} {:?} {:?}",
            current_owner.owner_id,
            current_owner.token_id,
            signer_id
        );
        self.song_sales
            .remove(&contract_and_token_id)
            .expect("Not able to remove sale for some reason");
    }
}

/// self call

#[ext_contract(ext_self)]
trait ExtSelf {
    fn resolve_purchase(
        &mut self,
        buyer_id: AccountId,
        paid: U128,
        price: U128,
        contract_and_token_id: Option<String>,
    ) -> Promise;
}

use crate::*;

pub type TokenId = String;
pub type Payout = HashMap<AccountId, U128>;


//? Do we use it anywhere, since we have changed the design
#[derive(BorshDeserialize, BorshSerialize)]
pub struct Token {
    pub owner_id: AccountId,
}

//* Useful for Read Method
// #[derive(Serialize, Deserialize)]
// #[serde(crate = "near_sdk::serde")]
// pub struct JsonToken {
//     pub token_id: TokenId,
//     pub owner_id: AccountId,
//     pub album: AlbumHash,
// }

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct AlbumData {
   
    pub copies_per_album_type: Vec<u32>,
    pub cover_and_song_per_album_type: Vec<String>,
    pub album_to_creator: AccountId,

}


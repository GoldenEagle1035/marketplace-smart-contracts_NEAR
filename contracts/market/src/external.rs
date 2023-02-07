use crate::*;

//* external contract calls
//* Useful for calling the NFT contract functions

#[ext_contract(ext_contract)]
trait ExtContract {

    //* Cross Contract Call Interface to NFT contract 
    //* for minting a new album bundle and assign ownership of it to the users
    fn nft_transfer_payout(
        &mut self,
        album_hash_copy: String,
        balance: Option<U128>,
    );
    
    //* Cross Contract Call Interface to NFT contract 
    //* To transfer ownership to the buyer of the song on sale
    fn nft_transfer_payout_song(
        &mut self,
        song_token_id: String,
        receiver_id: ValidAccountId,
        balance: Option<U128>,
    );

}
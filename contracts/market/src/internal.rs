use crate::*;

impl Contract {
    //Delist song from sale list
    pub(crate) fn internal_remove_song_sale(
        &mut self, 
        nft_contract_id: ValidAccountId, 
        token_id: TokenId
    ) {

        let contract_and_token_id = format!("{}{}{}", &nft_contract_id, ":", token_id);

        let sale_song = self.song_sales.remove(key: &contract_and_token_id).expect("No sale");


    }
}
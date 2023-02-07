// Load environment variables
require("dotenv").config();
const path = require("path");

// Load NEAR Javascript API components
const near = require("near-api-js");
const { transactions } = require("near-api-js");
 const { 
		Contract, KeyPair, Account,
		utils: { format: { parseNearAmount }},
		transactions: { deployContract, functionCall },
	} = near;

const homedir = require("os").homedir();

const CREDENTIALS_DIR = ".near-credentials";
const credentialsPath = path.join(homedir, CREDENTIALS_DIR);
const UnencryptedFileSystemKeyStore = near.keyStores.UnencryptedFileSystemKeyStore;
const keyStore = new UnencryptedFileSystemKeyStore(credentialsPath)

const now = Date.now();

// Setup default client options
const options = {
  networkId:   `testnet`,
  nodeUrl:     `https://rpc.testnet.near.org`,
  walletUrl:   `https://wallet.${process.env.NEAR_NETWORK}.near.org`,
  helperUrl:   `https://helper.${process.env.NEAR_NETWORK}.near.org`,
  explorerUrl: `https://explorer.${process.env.NEAR_NETWORK}.near.org`,
  accountId:   "dev-1625057166863-88051363268524",
  keyStore: keyStore
}



async function main() {
  // Configure the client with options and our local key store
    const client = await near.connect(options);
  
  //Minter account
    const account = await client.account(options.accountId);

  //Buyer Account
    const account_2 = await client.account("dev-1625072038241-90221386101668");
  
  //Where NFT is deployed
    const contract_account = await client.account("dev-1623229186642-77647971299977");

    const account_3 = await client.account("dev-1625071653611-35981054215498");

    // A simple example for tokentypes an tokenID generator
    //   const tokenTypes = [
    // 	// one unique type
    // 	`test:QmNdF6fEHci2gjQTDne1vKKk7pn2bvBEQjU75ThtySCSSv1L1`,
    // 	`test:QmNdF6fEHci2gjQTDne1vKKk7pn2bvBEQjU75ThtySCSSvl1`
    //     ];
    // 	const tokenIds = tokenTypes.map((type, i) => `${type}:${i}`);

    let contractId = "dev-1626006665148-21315355628435";
    let marketContractId = "market."+contractId;

    // const token_id = "test:QmehoXtWCjjCazuC9NGuhn6RmuWWuvd1AEc6tFULxzrZNU:107"
    const token_id = "test:"+now.toString();
    
    console.log("Starting Minting Album and Songs")
    let result = await account.functionCall(
        contractId,
        'nft_mint',
        {
            token_id:token_id,
            metadata:{},
            token_type:"test",
            perpetual_royalties:{
            },
            songslist:['QmaTBCqWQyywTj3CBDkLfMsLcX7XCgxED3fvhV4BgfEQ7w1','QmP1A9fF4jWB2LgwzYiweMbaeKsYtdU1dSkQAg2sgEyve2']
        },
        200000000000000,
        parseNearAmount('1')
    );
    console.log("Finished Minting Album and Songs")
    
    console.log("Starting Approving the Market for Sale of the album NFT for fixed amount of NEAR" )
      
    result = await account.functionCall(
        	marketContractId,
        	'storage_deposit',
        	{},
        	200000000000000,
        	parseNearAmount('5')
    );
    
    result = await account_2.functionCall(
        marketContractId,
        'storage_deposit',
        {},
        200000000000000,
        parseNearAmount('5')
    );
    
    const price = parseNearAmount('1');          
    let sale_conditions = [
        {
            ft_token_id: 'near',
            price 
        }
    ];

    result = await account.functionCall(
    			contractId,
    			'nft_approve',
    			{
    				token_id: token_id,
    				account_id: marketContractId,
    				msg: JSON.stringify({ sale_conditions })
    			},
    			200000000000000,
    			parseNearAmount('0.01')
    	);
        
// 	// console.log(result)
    console.log("Stopped Approving")

    console.log("Starting Unlocking")
    
    // const tokenLocked = await contract_account.viewFunction("dev-1623229186642-77647971299977", 'is_token_locked', { token_id });
    // console.log(tokenLocked);

    result = await contract_account.functionCall(
        contractId,
        'unlock_token_types',
        {
            token_types: [`test`, token_id]
        },
        200000000000000
    );

    // const tokenLocked1 = await contract_account.viewFunction("dev-1623229186642-77647971299977", 'is_token_locked', { token_id });
    // console.log(tokenLocked1);
    
    console.log("Stopped Unlocking")
    
    console.log("Started offer")
    result = await account_2.functionCall(
        marketContractId,
        "offer_album",
        {
        nft_contract_id: contractId,
        token_id: token_id
        },
        300000000000000,
        parseNearAmount('1')
    )
    console.log("Finished offer");
   
    
    let one_of_the_song_tokens = token_id+":"+"QmaTBCqWQyywTj3CBDkLfMsLcX7XCgxED3fvhV4BgfEQ7w1"; 
    // const tokens = await account.viewFunction(contractId, 'nft_tokens_for_owner', {
	// 		account_id:account_2.accountId,
	// 		from_index: '0',
	// 		limit: '100'
	// });
    // console.log(tokens);
    
    console.log("Approving after buying")
    result = await account_2.functionCall(
        contractId,
        'nft_approve',
        {
            token_id: one_of_the_song_tokens,
            account_id: marketContractId,
            msg: JSON.stringify({ sale_conditions })
        },
        200000000000000,
        parseNearAmount('0.01')
    );
    console.log("Finished Approving after buying")
    
    console.log("Started offer for secondary market song")
    result = await account_3.functionCall(
        marketContractId,
        "offer",
        {
        nft_contract_id: contractId,
        token_id: one_of_the_song_tokens
        },
        300000000000000,
        parseNearAmount('1')
    )
    console.log("Finished offer for secondary market song");
    
    const token = await account_3.functionCall(
        contractId,
        "nft_token",
        { token_id: token_id }
        
    )
    // Contains the txn hash where you can find the owner_id
    console.log(token)
    
};

main();


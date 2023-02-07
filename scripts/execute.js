// Load environment variables
require("dotenv").config();
const path = require("path");
// Load NEAR Javascript API components
const near = require("near-api-js");
 const { 
		Contract, KeyPair, Account,
		utils: { format: { parseNearAmount }},
		transactions: { deployContract, functionCall },
	} = near;
const homedir = require("os").homedir();

const CREDENTIALS_DIR = ".near-credentials";
// Directory where NEAR credentials are going to be stored
// const credentialsPath = "";
const credentialsPath = path.join(homedir, CREDENTIALS_DIR);
// Configure the keyStore to be used with the NEAR Javascript API
const UnencryptedFileSystemKeyStore = near.keyStores.UnencryptedFileSystemKeyStore;
const keyStore = new UnencryptedFileSystemKeyStore(credentialsPath)

// Setup default client options
const options = {
  networkId:   `testnet`,
  nodeUrl:     `https://rpc.testnet.near.org`,
  walletUrl:   `https://wallet.${process.env.NEAR_NETWORK}.near.org`,
  helperUrl:   `https://helper.${process.env.NEAR_NETWORK}.near.org`,
  explorerUrl: `https://explorer.${process.env.NEAR_NETWORK}.near.org`,
  accountId:   "rahulsoshte.testnet",
  keyStore: keyStore
}


async function main() {
  // Configure the client with options and our local key store
  const client = await near.connect(options);
  const account = await client.account(options.accountId);
  
//   // We'are using the same contract name, feel free to create a different one.
//   const contractName = options.accountId;

//   // Construct a new contract object, we'll be using it to perform calls
//   const contract = new near.Contract(account, contractName, {
//     viewMethods: ["get_token_owner"],   // our read function
//     changeMethods: ["nft_approve", "new"], // our write function
//     sender: options.accountId,   // account used to sign contract call transactions
//   });

  // const value = "ipfs://io3";
  // // await contract.new({owner_id: "dev-1622649845327-24859001153459"})
  // // const don1 = await contract.mint_token({ token_id: value, owner_id:"rahulsoshte.testnet" })
  // // const don = await contract.get_token_owner({token_id: "ipfs://io1"})
  // // console.log(don1.transaction);
  // result = await account.functionCall(
  //   options.accountId,
  //   "mint_token",
  //   { token_id:value, owner_id: "rahulsoshte.testnet"}
  // );
  // console.log(result);


  			// await alice.functionCall({
    		// 	contractId: marketId,
    		// 	methodName: 'storage_deposit',
    		// 	args: {},
    		// 	gas: GAS,
    		// 	attachedDeposit: 10000000000000000000000
    		// });

    		// await alice.functionCall({
    		// 	contractId: contractId,
    		// 	methodName: 'nft_mint',
    		// 	args: {
    		// 		token_id,
    		// 		metadata,
    		// 		token_type: tokenTypes[0],
    		// 		perpetual_royalties: {
    		// 			'a1.testnet': 500,
    		// 			'a2.testnet': 250,
    		// 			'a3.testnet': 250,
    		// 			'a4.testnet': 250,
    		// 			'a5.testnet': 250,
    		// 			// 'a6.testnet': 250,
    		// 			// 'a7.testnet': 250,
    		// 		},
    		// 	},
    		// 	gas: GAS,
    		// 	attachedDeposit: parseNearAmount('1')
    		// });
    
    		const price = parseNearAmount('1');
    		
			let sale_conditions = [
    			{
    				ft_token_id: 'near',
    				price 
    			}
    		];
			
		// const token_id = "";
		
			console.log(JSON.stringify({
				sale_conditions: [
					{ ft_token_id: "near", price: parseNearAmount('1')}
				]
			}))
	// 
	const tokenTypes = [
	// one unique type
	`test:QmNdF6fEHci2gjQTDne1vKKk7pn2bvBEQjU75ThtySCSSv1L1`,
	`test:QmNdF6fEHci2gjQTDne1vKKk7pn2bvBEQjU75ThtySCSSvl1`
	];

	const tokenIds = tokenTypes.map((type, i) => `${type}:${i}`);
    console.log(tokenIds)

	const token_id = tokenIds[0];

	
	// console.log(typeof token_id)

	// let result = await account.functionCall({
    // 			contractId: "dev-1622649845327-24859001153459",
    // 			methodName: 'nft_approve',
    // 			args: {
    // 				token_id: "test:QmNdF6fEHci2gjQTDne1vKKk7pn2bvBEQjU75ThtySCSSv1:0",
    // 				account_id: "market.dev-1622649845327-24859001153459",
    // 				msg: JSON.stringify({ sale_conditions })
    // 			},
    // 			gas: 200000000000000,
    // 			attachedDeposit: parseNearAmount('0.01')
    // 	});

	// 	console.log(result);

	// await A.functionCall({
	// 	contractId: marketId,
	// 	methodName: 'storage_deposit',
	// 	args: {},
	// 	gas:200000000000000,
	// 	attachedDeposit: parseNearAmount('0.01')
	// });

	let result = await account.functionCall({
		contractId: "dev-1622649845327-24859001153459",
		methodName: 'nft_mint',
		args: {
			token_id: token_id.toString("binary"),
			metadata: {"name":"Test"},
			token_type: tokenTypes[0],
			perpetual_royalties: {
				'a1.testnet': 500,
				'a2.testnet': 250,
				'a3.testnet': 250,
				'a4.testnet': 250,
				'a5.testnet': 250,
				// 'a6.testnet': 250,
				// 'a7.testnet': 250,
			},
		},
		gas:200000000000000,
		attachedDeposit: parseNearAmount('1')
	});

	console.log(result)

};

main();
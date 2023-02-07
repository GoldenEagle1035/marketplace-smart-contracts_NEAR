const fs = require('fs');
const testUtils = require('./tutils.js');
const nearAPI = require('near-api-js');
const getConfig = require('./config');

const { 
	GAS, private_key, contractName, market_private_key
} = getConfig(true);

const { 
	createOrInitAccount,
	createOrInitAccount2,
	createOrInitAccount3,
	initAccount
} = testUtils;

const { 
	Contract, KeyPair, Account,
	utils: { format: { parseNearAmount }},
	transactions: { deployContract, functionCall },
} = nearAPI;


// require("dotenv").config();
require('dotenv').config({path:__dirname+'/./../neardev/dev-account.env'}) 
// console.log(process.env.CONTRACT_NAME);

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}
  
async function main(){

	const acct ="nft."+ process.env.CONTRACT_NAME;
	const macct2 = "market"+"." + process.env.CONTRACT_NAME;

	var marketAccount;

	marketAccount = await createOrInitAccount(macct2, market_private_key);
	await marketAccount.deleteAccount(process.env.CONTRACT_NAME);
	marketAccount = await createOrInitAccount(macct2, market_private_key);

    const marketContractBytes = fs.readFileSync('.././out/music_market.wasm');
    console.log('\n\n deploying marketAccount contractBytes:', marketContractBytes.length, '\n\n');
    const newMarketArgs = {
        owner_id: process.env.CONTRACT_NAME,
		nft_contract_id: acct,
    };

    const actions1 = [
        deployContract(marketContractBytes),
        functionCall('new', newMarketArgs, GAS)
    ];

	await sleep(1000);
	await marketAccount.signAndSendTransaction(macct2, actions1);

	// }

}

main();

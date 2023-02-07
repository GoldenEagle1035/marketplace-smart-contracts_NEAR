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

	var deployAccount;

	// await sleep(3000);
	deployAccount = await createOrInitAccount(acct, private_key);
	// await sleep(3000);

	const contractBytes = fs.readFileSync('.././out/music_nft.wasm');
	console.log('\n\n Deploying NFT Contract \n\n');
	
	const actions = [
    	deployContract(contractBytes)
	];

	// await sleep(1000);
	await deployAccount.signAndSendTransaction(acct, actions);

}

main();

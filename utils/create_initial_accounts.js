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

    console.log(process.env.CONTRACT_NAME);
	// const acct ="nft."+ process.env.CONTRACT_NAME;
	// var deployAccount;
	// deployAccount = await createOrInitAccount2(acct);
	const macct2 = "market"+"." + process.env.CONTRACT_NAME;
	var marketAccount;
	marketAccount = await createOrInitAccount3(macct2);
	
}

main();

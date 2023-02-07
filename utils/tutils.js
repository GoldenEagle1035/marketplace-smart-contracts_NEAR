const BN = require('bn.js');
const fetch = require('node-fetch');
const nearAPI = require('near-api-js');
const { KeyPair, Account, Contract, utils: { format: { parseNearAmount } } } = nearAPI;
const { near, connection, keyStore, contract, contractAccount } = require('./near-utils');
const getConfig = require('./config');
const {
	networkId, contractName, contractMethods,
	DEFAULT_NEW_ACCOUNT_AMOUNT, 
	DEFAULT_NEW_CONTRACT_AMOUNT,
} = getConfig();
const path = './config.js'
const fs = require('fs');

const TEST_HOST = 'http://localhost:3000';
// /// exports
async function initContract() {
// 	/// try to call new on contract, swallow e if already initialized
	try {
		const newArgs = {
			owner_id: contractAccount.accountId,
			metadata: {
				spec: '0.3.0',
				name: 'Amplify Art',
				symbol: 'Amplify Art',
			},
			supply_cap_by_type: {
				test: '1000000',
			},
			unlocked: true
		};
		await contract.new(newArgs);
	} catch (e) {
		if (!/initialized/.test(e.toString())) {
			throw e;
		}
	}
	return { contract, contractName };
}
const getAccountBalance = async (accountId) => (new nearAPI.Account(connection, accountId)).getAccountBalance();

const createOrInitAccount = async(accountId, secret) => {
	let account;
	// console.log('Creating account');
	try {
		account = await createAccount(accountId, DEFAULT_NEW_CONTRACT_AMOUNT, secret);
	} catch (e) {
		
		if (!/because it already exists/.test(e.toString())) {
			throw e;
		}
		console.log("Hello Sir");
		// console.log()
		account = new nearAPI.Account(connection, accountId);

		console.log(await getAccountBalance(accountId));

		const newKeyPair = KeyPair.fromString(secret);
		keyStore.setKey(networkId, accountId, newKeyPair);

	}
	return account;
};

const createOrInitAccount2 = async(accountId) => {
	let account;
	try {
		account = await createAccountCredentials(accountId, DEFAULT_NEW_CONTRACT_AMOUNT);
	} catch (e) {
		if (!/because it already exists/.test(e.toString())) {
			throw e;
		}
		account = new nearAPI.Account(connection, accountId);

		console.log(await getAccountBalance(accountId));
	
	}
	return account;
};

const createOrInitAccount3 = async(accountId) => {
	let account;
	try {
		account = await createAccountCredentials1(accountId, DEFAULT_NEW_CONTRACT_AMOUNT);
	} catch (e) {
		if (!/because it already exists/.test(e.toString())) {
			throw e;
		}
		account = new nearAPI.Account(connection, accountId);

		console.log(await getAccountBalance(accountId));
	
	}
	return account;
};

const initAccount = async(accountId) => {
	let account;
	account = new nearAPI.Account(connection, accountId);
	console.log(await getAccountBalance(accountId));
	return account;
};

async function getAccount(accountId, fundingAmount = DEFAULT_NEW_ACCOUNT_AMOUNT) {
	accountId = accountId || generateUniqueSubAccount();
	const account = new nearAPI.Account(connection, accountId);
	try {
		await account.state();
		return account;
	} catch(e) {
		if (!/does not exist/.test(e.toString())) {
			throw e;
		}
	}
	return await createAccount(accountId, fundingAmount);
};


async function getContract(account) {
	return new Contract(account || contractAccount, contractName, {
		...contractMethods,
		signer: account || undefined
	});
}


const createAccessKeyAccount = (key) => {
	connection.signer.keyStore.setKey(networkId, contractName, key);
	return new Account(connection, contractName);
};

const postSignedJson = async ({ account, contractName, url, data = {} }) => {
	return await fetch(url, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			...data,
			accountId: account.accountId,
			contractName,
			...(await getSignature(account))
		})
	}).then((res) => {
		// console.log(res)
		return res.json();
	});
};

const postJson = async ({ url, data = {} }) => {
	return await fetch(url, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ ...data })
	}).then((res) => {
		console.log(res);
		return res.json();
	});
};

function generateUniqueSubAccount() {
	return `t${Date.now()}.${contractName}`;
}

/// internal
async function createAccount(accountId, fundingAmount = DEFAULT_NEW_ACCOUNT_AMOUNT, secret) {
	const contractAccount = new Account(connection, contractName);
	const newKeyPair = secret ? KeyPair.fromString(secret) : KeyPair.fromRandom('ed25519');
	await contractAccount.createAccount(accountId, newKeyPair.publicKey, new BN(parseNearAmount(fundingAmount)));
	keyStore.setKey(networkId, accountId, newKeyPair);
	return new nearAPI.Account(connection, accountId);
}

//internal
async function createAccountCredentials(accountId, fundingAmount = DEFAULT_NEW_ACCOUNT_AMOUNT) {
	const contractAccount = new Account(connection, contractName);
	const newKeyPair = KeyPair.fromRandom('ed25519');
	// console.log(newKeyPair);
	await contractAccount.createAccount(accountId, newKeyPair.publicKey, new BN(parseNearAmount(fundingAmount)));
	// keyStore.setKey(networkId, accountId, newKeyPair);
	await contractAccount.connection.signer.keyStore.setKey(networkId, accountId, newKeyPair);
	const nft_privateKey = newKeyPair.secretKey;
	 
	fs.readFile(path, 'utf-8', function(err, data) {
		if (err) throw err;
	 
		data = data.replace(/.*const private_key.*/gim, `const private_key = '${nft_privateKey}';`);
	 
		fs.writeFile(path, data, 'utf-8', function(err) {
			if (err) throw err;
			console.log('Done!');
		})
	})
	
	return new nearAPI.Account(connection, accountId);
}


async function createAccountCredentials1(accountId, fundingAmount = DEFAULT_NEW_ACCOUNT_AMOUNT) {
	const contractAccount = new Account(connection, contractName);
	const newKeyPair = KeyPair.fromRandom('ed25519');
	// console.log(newKeyPair);
	await contractAccount.createAccount(accountId, newKeyPair.publicKey, new BN(parseNearAmount(fundingAmount)));
	// keyStore.setKey(networkId, accountId, newKeyPair);
	await contractAccount.connection.signer.keyStore.setKey(networkId, accountId, newKeyPair);
	
	const nft_privateKey = newKeyPair.secretKey;
	 
	fs.readFile(path, 'utf-8', function(err, data) {
		if (err) throw err;
	 
		data = data.replace(/.*const market_private_key.*/gim, `const market_private_key = '${newKeyPair}';`);
	 
		fs.writeFile(path, data, 'utf-8', function(err) {
			if (err) throw err;
			console.log('Done!');
		})
	})
	
	return new nearAPI.Account(connection, accountId);
}

const getSignature = async (account) => {
	const { accountId } = account;
	const block = await account.connection.provider.block({ finality: 'final' });
	const blockNumber = block.header.height.toString();
	const signer = account.inMemorySigner || account.connection.signer;
	const signed = await signer.signMessage(Buffer.from(blockNumber), accountId, networkId);
	const blockNumberSignature = Buffer.from(signed.signature).toString('base64');
	return { blockNumber, blockNumberSignature };
};

module.exports = { 
	TEST_HOST,
	near,
	connection,
	keyStore,
	getContract,
	getAccountBalance,
	contract,
	contractName,
	contractMethods,
	contractAccount,
	createOrInitAccount,
	createOrInitAccount2,
	createOrInitAccount3,
	initAccount,
	createAccessKeyAccount,
	initContract, getAccount, postSignedJson, postJson,
};
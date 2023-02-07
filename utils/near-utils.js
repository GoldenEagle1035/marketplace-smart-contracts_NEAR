const fs = require("fs");
const nearAPI = require("near-api-js");
const getConfig = require("./config");
const { nodeUrl, networkId, contractName, contractMethods, private_key } = getConfig(true);
const {
	keyStores: { InMemoryKeyStore },
	Near,
	Account,
	Contract,
	KeyPair,
	utils: {
		format: { parseNearAmount },
	},
} = nearAPI;

// console.log(
// 	"Loading Credentials:\n",
// 	`keys/${networkId}/${contractName}.json`
// );
// const credentials = JSON.parse(
// 	fs.readFileSync(
// 		`keys/${networkId}/${networkId}/${contractName}.json`
// 	)
// );

// const UnencryptedFileSystemKeyStore = nearAPI.keyStores.UnencryptedFileSystemKeyStore;
// const keyStore = new UnencryptedFileSystemKeyStore("/home/hunter/.near-credentials");

const keyStore = new InMemoryKeyStore();
keyStore.setKey(
	networkId,
	contractName,
	KeyPair.fromString("ed25519:5DURCxXJ8CVCfBP9ppNdW2NGzWtw9h48er3wCNq9X71GgUgasHgvb2AHLoFmgiBhMwLA28jFNFmFf3HXzkca2MZ1")
);


const near = new Near({
	networkId,
	nodeUrl,
	deps: { keyStore },
});
const { connection } = near;
const contractAccount = new Account(connection, contractName);
contractAccount.addAccessKey = (publicKey) =>
	contractAccount.addKey(
		publicKey,
		contractName,
		contractMethods.changeMethods,
		parseNearAmount("0.1")
	);
const contract = new Contract(contractAccount, contractName, contractMethods);

module.exports = {
	near,
	keyStore,
	connection,
	contract,
	contractName,
	contractAccount,
	contractMethods,
};

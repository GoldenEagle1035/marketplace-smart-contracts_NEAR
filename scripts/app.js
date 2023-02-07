const { connect, KeyPair, keyStores, utils } = require("near-api-js");
const path = require("path");
const homedir = require("os").homedir();

const CREDENTIALS_DIR = ".near-credentials";

const config = {
  networkId: "testnet",
  nodeUrl: "https://rpc.testnet.near.org",
  walletUrl: "https://wallet.testnet.near.org",
  helperUrl: "https://helper.testnet.near.org",
};

// if (process.argv.length !== 5) {
//   console.info(
//     "Please run command in the following format: \n node create-account CREATOR_ACCOUNT.testnet NEW_ACCOUNT.testnet AMOUNT"
//   );
//   process.exit(1);
// }

createAccount(process.argv[2], process.argv[3], process.argv[4]);

async function createAccount(creatorAccountId, newAccountId, amount) {
  const credentialsPath = path.join(homedir, CREDENTIALS_DIR);
  const keyStore = new keyStores.UnencryptedFileSystemKeyStore(credentialsPath);
  const near = await connect({ ...config, keyStore });
  const creatorAccount = await near.account(creatorAccountId);
  const keyPair = KeyPair.fromRandom("ed25519");
  const publicKey = keyPair.publicKey.toString();
  await keyStore.setKey(config.networkId, newAccountId, keyPair);

  return await creatorAccount.functionCall({
    contractId: "testnet",
    methodName: "create_account",
    args: {
      new_account_id: newAccountId,
      new_public_key: publicKey,
    },
    gas: "300000000000000",
    attachedDeposit: utils.format.parseNearAmount(amount),
  });
}
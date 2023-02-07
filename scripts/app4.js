// Load environment variables
require("dotenv").config();
const path = require("path");
const crypto = require('crypto');
const bs58 = require('bs58')

// const IPFS = require('ipfs-core')
// const now = Date.now();

// Load NEAR Javascript API components
const near = require("near-api-js");
const { transactions } = require("near-api-js");
const { contract, contractMethods } = require("../utils/near-utils");
const { error } = require("console");
 const { 
		Contract, KeyPair, Account,
		utils: { format: { parseNearAmount }},
		transactions: { deployContract, functionCall },
	} = near;

var arr = [];

while(arr.length < 5){
    // var r = Math.floor(Math.random() * 100) + 1;
    var current_date = (new Date()).valueOf().toString();
    var random = Math.random().toString();
    let r = crypto.createHash('sha1').update(current_date + random).digest('hex');

    if(arr.indexOf(r) === -1) arr.push(r);
}

const fs = require('fs');
const contractId = fs.readFileSync('./../neardev/dev-account').toString()

const homedir = require("os").homedir();

const CREDENTIALS_DIR = ".near-credentials/testnet";
const credentialsPath = path.join(homedir, CREDENTIALS_DIR);
const UnencryptedFileSystemKeyStore = near.keyStores.UnencryptedFileSystemKeyStore;
const keyStore1 = new UnencryptedFileSystemKeyStore(credentialsPath)

const now = Date.now();

// Setup default client options
const options = {
  networkId:   `testnet`,
  nodeUrl:     `https://rpc.testnet.near.org`,
  walletUrl:   `https://wallet.${process.env.NEAR_NETWORK}.near.org`,
  helperUrl:   `https://helper.${process.env.NEAR_NETWORK}.near.org`,
  explorerUrl: `https://explorer.${process.env.NEAR_NETWORK}.near.org`,
  accountId:   "dev-1625057166863-88051363268524",
  keyStore: keyStore1
}

// let contractId = "dev-1628448071974-77438826237855";

let marketContractId = "market."+contractId;

let albumhash = "fu012d11211";


let songslisthash = ['35e3de8bf884a57cb24a3c4ab188da2a','281b3d4d3b4ca68c987bf897a83a66a0'];

//Album Hash : f8d7bd28b526864cf358256ca7b041c6
// No of copies : 2
// Song 1 hash: 35e3de8bf884a57cb24a3c4ab188da2a
// Song 2 hash : 281b3d4d3b4ca68c987bf897a83a66a0

async function create_album_token_type(owner_account, client){

    console.log("Inside the function")
    const supply_cap_by_type = {
        // [albumhash]: "2",
        [albumhash]:"1",
    };

    try {
        let result = await owner_account.functionCall(
            contractId,
            'add_token_types',
            { supply_cap_by_type },
            200000000000000
        )
        
    
    } catch (error) {

        const response = await client.connection.provider.txStatus(
            bs58.decode(error.transaction_outcome.id.toString('utf-8')),
            "rahulsoshte.testnet"
        );
        
        console.log(response.receipts_outcome[0].outcome.logs);
        const obj = JSON.parse(response.receipts_outcome[0].outcome.logs[0]);
        console.log(obj);
    }
    
    console.log("Ending the function")

}

async function mint_album_copy(minteraccount, copy_no, client) {
    const token_id = albumhash+":"+copy_no;
    
    try {
        let result = await minteraccount.functionCall(
            contractId,
            'nft_mint',
            {
                token_id:token_id,
                metadata:{},
                token_type:albumhash,
                perpetual_royalties:{
                },
                songslist:songslisthash,
            },
            300000000000000,
            parseNearAmount('1')
        );
        console.log(result);

    } catch(error){
        
        const response = await client.connection.provider.txStatus(
            bs58.decode(error.transaction_outcome.id.toString('utf-8')),
            minteraccount.accountId
        );
        
        const obj = JSON.parse(response.receipts_outcome[0].outcome.logs[0]);
        console.log(obj);
        

    }
}

async function unlock_album_token_type(owner_account){
        
    result = await owner_account.functionCall(
        contractId,
        'unlock_token_types',
        {
            token_types: [albumhash]
        },
        200000000000000
    );

}

async function unlock_album_copy_token_type(owner_account, album){
        
    result = await owner_account.functionCall(
        contractId,
        'unlock_token_types',
        {
            token_types: [album]
        },
        200000000000000
    );

}

async function approving_album_for_sale(minter, copy_no, price_arg, client){
    const price = parseNearAmount(price_arg);
    const token_id = albumhash+":"+copy_no;

    try {
    result = await minter.functionCall(
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

    } catch(error) {
        
        const response = await client.connection.provider.txStatus(
            bs58.decode(error.transaction_outcome.id.toString('utf-8')),
            minter.accountId
        );
        
        const obj = JSON.parse(response.receipts_outcome[0].outcome.logs[0]);
        console.log(obj);
        
    }

}

async function buy_album_nft(buyer, copy_no, price,client){

    const token_id = albumhash+":"+copy_no;
    
    try {
        result = await buyer.functionCall(
            marketContractId,
            "offer_album",
            {
            nft_contract_id: contractId,
            token_id: token_id
            },
            300000000000000,
            parseNearAmount(price)
        )
    } catch(error) {

        const response = await client.connection.provider.txStatus(
            bs58.decode(error.transaction_outcome.id.toString('utf-8')),
            buyer.accountId
        );
        
        const obj = JSON.parse(response.receipts_outcome[0].outcome.logs[0]);
        console.log(obj);
    }

}

async function put_song_up_for_selling(account_which_bought_the_album, songtokenid, price_arg ){
    
    const price = parseNearAmount(price_arg);

    let sale_conditions = [
        {
            ft_token_id: 'near',
            price
        }
    ];

    let result = await account_which_bought_the_album.functionCall(
        marketContractId,
        'storage_deposit',
        {},
        200000000000000,
        parseNearAmount('3')
    );
    
    result = await account_which_bought_the_album.functionCall(
        contractId,
        'nft_approve',
        {
            token_id: songtokenid,
            account_id: marketContractId,
            msg: JSON.stringify({ sale_conditions })
        },
        200000000000000,
        parseNearAmount('0.01')
    );

}

async function buy_song_nft(anotheraccount, price_arg, songtokenid, client){
    try {
    result = await anotheraccount.functionCall(
        marketContractId,
        "offer",
        {
        nft_contract_id: contractId,
        token_id: songtokenid
        },
        300000000000000,
        parseNearAmount(price_arg)
    )} catch(error) {
        const response = await client.connection.provider.txStatus(
            bs58.decode(error.transaction_outcome.id.toString('utf-8')),
            anotheraccount.accountId
        );
        
        const obj = JSON.parse(response.receipts_outcome[0].outcome.logs[0]);
        console.log(obj);
    }
}

async function main() {
    // const ipfs = await IPFS.create()
    // const { cid } = await ipfs.add(now.toString())
    // albumhash = cid.toString();

    const client = await near.connect(options);
    const account = await client.account(options.accountId);
    const account_2 = await client.account("dev-1625072038241-90221386101668");
    const contract_account = await client.account(contractId);
    const owner_account = await client.account("rahulsoshte.testnet");
    const account_3 = await client.account("dev-1625071653611-35981054215498");
    const account_4 = await client.account("dev-1625074608971-76452383946912");

    console.log("Creating the album token type");
    // await create_album_token_type(owner_account, client);
    console.log("Finished creating the album token type");

    console.log("Starting Minting Album and Songs")
    // await mint_album_copy(account_2,"1",client);
    // await mint_album_copy(account_2,"2",client);
    console.log("Finished Minting Album and Songs")

    console.log("Starting Approving the Market for Sale of the album NFT for fixed amount of NEAR" )
    // await approving_album_for_sale(account_2, "1", "3", client);
    console.log("Stopped Approving")

    console.log("started Unlock token types");
    // await unlock_album_token_type(owner_account);
    console.log("Finished Unlock token types");
                       
    console.log("Buying the album nft") 
    // await buy_album_nft(account_3, "1", "3",client);
    console.log("Finished buying the album nft")         
     
    console.log("Putting up the 1st song 35e3de8bf884a57cb24a3c4ab188da2a of the 1st album copy f8d7bd28b526864cf358256ca7b041c6:1 for selling")
    // let songtokenid = albumhash+":1:35e3de8bf884a57cb24a3c4ab188da2a";
    // await put_song_up_for_selling(account_3, albumhash+":1", "1" );
    console.log("Finished Putting up the 1st song 35e3de8bf884a57cb24a3c4ab188da2a of the 1st album copy f8d7bd28b526864cf358256ca7b041c6:1 for selling")
    
    console.log("Another party buying this song f8d7bd28b526864cf358256ca7b041c6:1:35e3de8bf884a57cb24a3c4ab188da2a listed by account_3")
    // await unlock_album_copy_token_type(owner_account, albumhash+":1" )
    await buy_song_nft(account_4, "1", albumhash+":1", client);
    console.log("Finished Another party buying this song listed by account_3")

    // console.log("buyAnother party buying this song f8d7bd28b526864cf358256ca7b041c6:1:35e3de8bf884a57cb24a3c4ab188da2a listed by account_3")
    // await unlock_album_copy_token_type(owner_account, albumhash+":1" )
    // await buy_song_nft(account_4, "1", songtokenid);
    // console.log("Finished Another party buying this song listed by account_3")

    
	// const token = await account_3.functionCall(
    //     contractId,
    //     "nft_token",
    //     { token_id: "QmRwFRQMeTN3cjCC9topw9dnRcyZY1gHduCDdzH6YhAsCL:2"},
		
    // )

	// const jsjd = Buffer.from(token?.status?.SuccessValue, 'base64').toString('utf-8');
	
	// const obj = JSON.parse(jsjd);

	// console.log(obj.owner_id);

	// const contract_1 = new Contract(contract_account, contractId, contractMethods);
	// const contract_1 = new Contract(contract_account, contractId, {
	// viewMethods: ["get_token_ids", "nft_token", "get_sale"],});

	// const token = await contract_1.nft_token({ token_id:"QmRwFRQMeTN3cjCC9topw9dnRcyZY1gHduCDdzH6YhAsCL:1" });
    // console.log(token.owner_id);
	
	    // Contains the txn hash where you can find the owner_id

	// {
	// 	// name of contract you're connecting to
	// 	viewMethods: ["getMessages"], // view methods do not change state but usually return a value
	// 	changeMethods: ["addMessage"], // change methods modify state
	// 	sender: account, // account object to initialize and sign transactions.
	//   }

    // const token = await account_3.functionCall(
    //     contractId,
    //     "nft_token",
    //     { token_id: albumhash+":"+"1:"+"35e3de8bf884a57cb24a3c4ab188da2a" }
        
    // )
    // // Contains the txn hash where you can find the owner_id
    // console.log(token)
    
};

main();


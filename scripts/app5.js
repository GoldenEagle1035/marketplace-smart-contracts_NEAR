// Load environment variables
require("dotenv").config();
const path = require("path");
const crypto = require('crypto');
const bs58 = require('bs58')
const near = require("near-api-js");
const { transactions } = require("near-api-js");
const { contract, contractMethods } = require("../utils/near-utils");
const { error } = require("console");
const { 
		Contract, KeyPair, Account,
		utils: { format: { parseNearAmount }},
		transactions: { deployContract, functionCall },
} = near;

const fs = require('fs');
const contractId = fs.readFileSync('./../neardev/dev-account').toString()
const homedir = require("os").homedir();

const CREDENTIALS_DIR = ".near-credentials";
const credentialsPath = path.join(homedir, CREDENTIALS_DIR);
const UnencryptedFileSystemKeyStore = near.keyStores.UnencryptedFileSystemKeyStore;
const keyStore1 = new UnencryptedFileSystemKeyStore(credentialsPath)

const now = Date.now();

// Setup default client options
const options = {
  networkId:   `testnet`,
  nodeUrl:     `https://archival-rpc.testnet.near.org`,
  walletUrl:   `https://wallet.${process.env.NEAR_NETWORK}.near.org`,
  helperUrl:   `https://helper.${process.env.NEAR_NETWORK}.near.org`,
  explorerUrl: `https://explorer.${process.env.NEAR_NETWORK}.near.org`,
  accountId:   "dev-1629347195077-55896395664466",
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

async function create_album_token_type_approve_for_sale(owner_account, client){

    console.log("Inside the function")
    let accoff = owner_account.accountId;

    try {

        let result = await owner_account.functionCall(
            "nft." + "dev-1633963337441-72420501486968",
            'add_token_types',
            { album_hash: "f8d7bd28b526864cf358256ca7b041c61",
            cover_songslist:['f8d7bd28b526864cf358256ca71','35e3de8bf884a57cb24a3c4ab188da2a1', '281b3d4d3b4ca68c987bf897a83a66a01'],
            number_of_album_copies: 10,
            price: parseNearAmount('1'),   
        },
            200000000000000,
            parseNearAmount('1'),
        )
        
    
    } catch (error) {

        const response = await client.connection.provider.txStatus(
            bs58.decode(error.transaction_outcome.id.toString('utf-8')),
            owner_account.accountId
        );
        
        console.log(response.receipts_outcome[0].outcome.logs);
        const obj = JSON.parse(response.receipts_outcome[0].outcome.logs[0]);
        console.log(obj);
        // console.log(error)
    }
    
    console.log("Ending the function")

}

async function buy_album_bundle(buyer, copy_no, price,client){

    const token_id = "f8d7bd28b526864cf358256ca7b041c6"+":"+copy_no;
    console.log(price);

    try {
        await buyer.functionCall(
            "market.dev-1633963337441-72420501486968",
            "offer_album",
            {
            nft_contract_id: "nft.dev-1633963337441-72420501486968", 
            albumipfs_hash_copy: "f8d7bd28b526864cf358256ca7b041c61:1",
            },
            300000000000000,
            parseNearAmount(price),
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

async function approve_song_for_sale(account_which_bought_the_album, songtokenid, price_arg ){
    
    const price = parseNearAmount(price_arg);
    
    result = await account_which_bought_the_album.functionCall(
        "nft.dev-1633963337441-72420501486968",
        'nft_approve',
        {
            token_id: songtokenid,
            account_id: "market.dev-1633963337441-72420501486968",
            price: price,
        },
        300000000000000,
        parseNearAmount('0.01')
    );

}

async function buy_song_nft(anotheraccount, price_arg, songtokenid, client){
    try {
    result = await anotheraccount.functionCall(
        "market.dev-1633963337441-72420501486968",
        "offer",
        {
        nft_contract_id: "nft.dev-1633963337441-72420501486968",
        receiver_id: anotheraccount.accountId,
        song_token_id: songtokenid
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

// TODO: Make sure all the test pass, I think we must believe in Rust, than in ourselves. I dont think Rust 
// will allow us to have race conditions
// https://www.near-sdk.io/testing/simulation-tests#helpful-snippets



async function main() {
    // const ipfs = await IPFS.create()
    // const { cid } = await ipfs.add(now.toString())
    // albumhash = cid.toString();
    const client = await near.connect(options);
    const account = await client.account(options.accountId);
    const account_2 = await client.account("dev-1629380376321-33090015362981");
    // const contract_account = await client.account(contractId);
    // const owner_account = await client.account("rahulsoshte.testnet");
    const account_3 = await client.account("dev-1629388705488-74235831867416");
    const account_4 = await client.account("dev-1629705968328-38910598243699");
    const account_5 = await client.account("dev-1629386507988-35890115858726")
    // Add Album Data and Upload for Sale
    // await create_album_token_type_approve_for_sale(account, client);

    // Offer for the price
    // await buy_album_bundle(account_2, "2", "1", client);
    
    // await buy_album_bundle(account_2, "2", "1", client);
    // await buy_album_bundle(account_2, "2", "1", client);

    // Approve a song on the marketplace

    // await approve_song_for_sale(account_2, "f8d7bd28b526864cf358256ca7b041c61:1:35e3de8bf884a57cb24a3c4ab188da2a1","1",marketContractId);
    // await approve_song_for_sale(account_2, "f8d7bd28b526864cf358256ca7b041c61:1:281b3d4d3b4ca68c987bf897a83a66a01","1",marketContractId);

    // // Buy Song from the market
    // let songtokenid_1 = "f8d7bd28b526864cf358256ca7b041c61:1:35e3de8bf884a57cb24a3c4ab188da2a1";
    // let songtokenid = "f8d7bd28b526864cf358256ca7b041c61:1:281b3d4d3b4ca68c987bf897a83a66a01";
    //Duplic
    // await buy_song_nft(account_3, "1", songtokenid_1, client); // This worked
    // buy_song_nft(account_4, "1", songtokenid_1, client); // This worked
    // buy_song_nft(account_5, "1", songtokenid_1, client); // These all didnt work at all 
    // buy_song_nft(account_4, "1", songtokenid_1, client); // These all didnt work at all 
    // await buy_song_nft(account_4, "0.1", songtokenid, client); // These all didnt work at all

    const token = await account_3.functionCall(
        "nft.dev-1633963337441-72420501486968",
        "nft_token",
        { token_id: "f8d7bd28b526864cf358256ca7b041c61:1:35e3de8bf884a57cb24a3c4ab188da2a1"},	
    );


    // const token = await account_3.functionCall(
    //     "market."+ contractId,
    //     "get_song_sale",
    //     { nft_contract_id: "nft." + contractId, song_token_id: "QmbvXWy7WE3aFabf1TStLGPzrM8qh9FsGSQWakefLvCQvM:1:QmXFQGq94BAN1KpyHj7bGk5qdWv3PW1PRDeaNvqGWnzH93"},	
    // );



};

main();


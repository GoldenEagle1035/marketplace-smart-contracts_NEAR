Amplify Art Music NFT & Marketplace Contract
==========================

Modules:
1) Market
2) NFTs

## Work Item: Show List of nfts in User's wallet
function nft_tokens_for_owner implementation is in progress.

These are old docs, but useful for understanding how it proceeded.

## Doc v0.5 ( Resolved Gas Errors + Fixed Design to suit Album Songs)
This is for the current implementation

A) Album & song uploads & to list all album bundle copies on market
1) add_token_types

B) To Buy a album Bundle on teh marketplace
1) offer_album

C) To list song on the marketplace
1) nft_approve

D) To Buy the song on the marketplace 
1) offer
2) nft_token(to check if the owner has it now )

## Doc v0.4
Was about series minting

## Doc v0.3 Error Handling
Error can be found in Logs of the transaction failed / succeeded otherwise

## Doc v0.2 (Mint + Price Setting + Purchase)
1) Deploy NFT Contract
`near dev-deploy --accountId=dev-1623229186642-77647971299977 --wasmFile=./out/music_nft.wasm`

2) Create a Market Account
`near create_account market.dev-1623229186642-77647971299977 --masterAccount=dev-1623227573802-45982734932448 --initial-balance 50`

3) Deploy the Music contracts
`near deploy --accountId=market.dev-1623229186642-77647971299977 --wasmFile=./out/music_market.wasm`

4) New Function
`near call market.dev-1623229186642-77647971299977 new '{"owner_id": "dev-1623229186642-77647971299977", "nft_contract_id": "dev-1623229186642-77647971299977"}' --accountId=dev-1623229186642-77647971299977`

`near call dev-1623229186642-77647971299977 new '{"owner_id":"dev-1623229186642-77647971299977","metadata":{"spec":"music-nft-0.2.0","name":"AmplifyArt","symbol":"AMPLIFY"},"supply_cap_by_type":{"test": "1000000"}}' --accountId=dev-1623229186642-77647971299977`

7) Storage Cost Call for the Minter
`near call --accountId=rahulsoshte.testnet market.dev-1623229186642-77647971299977 storage_deposit --gas 200000000000000 --amount 20`

8) For further steps follow scripts/app2.js

## Doc v0.1 (Simple Mint function)

1) Copy the WASM File into your machine 
<br>

2) Install Near CLI (https://docs.near.org/docs/tools/near-cli#windows )
<br>

3) Deploy the WASM file on Testnet <br>
`near deploy --wasmFile target/wasm32-unknown-unknown/release/rust_counter_tutorial.wasm --accountId YOUR_ACCOUNT_HERE`
<br>
4) For Quick Testing - CLI Arguments ( Will work on WSL ) <br>
`near login`
`near call YOUR_ACCOUNT_HERE increment --accountId YOUR_ACCOUNT_HERE`
`near call --accountId CALLER-ID RECEIVER-ID new '{"owner_id": "OWNER-ID"}'` ( Have to only call once )
`near call --accountId dev-1622112382753-68159924582656 dev-1622112382753-68159924582656 mint_token '{"token_id":"IPFS_METADATA_LINk", "owner_id": "dev-1622112382753-68159924582656"}'`
<br>
5) For testing with the NEAR API
You need to take reference of near-api-js documentation
https://docs.near.org/docs/api/naj-quick-reference#contract

So the TokenID can be a IPFS CID of the Metadata (Content ID, a unique hash) & the Metadata's structure can be, For example let's say <b>"21 Guns"</b> song

```
Metadata {

  "name": "21 Guns",
  "album": "21st Century Breakdown",
  "description": "The song is about fighting a good fight, but not the fights unworthy of fighting for. You only got one life, and just one 21 gun salute, avail of it. Live your life an honorable life and give up the petty things.",
  "audio_file_ipfs_link": "https://ipfs.io/ipfs/QmQvx9dxYNA4kp1ZDzC1jd2LyYgwhffwK3TfBRv7QNqGd8?filename=21guns.mp3",
  "singer":"Green Day",
  "genre":"Alternative Rock",
  "song_writers":"Billie, Mike, Tre",
  "released_date":"2009"
}
```

This whole metadata can be represented by a unique hash ( IPFS Content ID / IPFS URL ) which will be used as the tokenID / unique identifier of the NFT on the blockchain.

What happends with using HTTPS URL with AWS S3 as the unique identifier for the NFT is that the links can possibly break, and the TokenID on the blockchain for the NFT becomes a little useless.



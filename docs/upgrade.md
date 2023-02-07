While upgrading you need to test the contract upgrade on Testnet first and then Mainnet.
If upgrade fails, there is huge risk losing all data.

Upgrade may fail for many reasons
1) You rearranged the Contract Storage State.
2) When you changed the state you didnt migrate to the newer state.

The upgrade will never fail if you just change the code except if you change the Contract Storage State code without migrate call.

Never commit until functionality/upgrade is tested on Testnet after the ugrade happens. If somehow the upgrade fails on the testnet, remove every change and go to the last change and try fresh deployment using testnet-2/deploy-nft-testnet and upgrading again.

Reference:
https://www.near-sdk.io/upgrading/production-basics

Each new upgrade gets a new Branch as upgrading is to be a little careful.

For upgrading on Mainnet use deploy-nft-mainnet-upgrade.js to upgrade NFT contract and deploy-market-mainnet-upgrade.js for Market in mainnet/
or for Testnet use deploy-nft-testnet-upgrade.js or deploy-market-testnet-upgrade.js

please read NEAR Docs well as well ask on the Discord Channel.
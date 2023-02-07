const contractName = 'dev-1631962167293-57148505657038';
const private_key = '3qjktzrnN3xLEw7bLczLFBaA6Bvo9xYhEnj2RfHeyMwsatWurUh1B4zApY2pgzbgkbnEQqYnkCxdTopB9GqzNSQf';
const market_private_key = 'ed25519:DvT8BanvAijUvptnTm9eaH37fkq8DoWrgxeZBPaUq2ZTDz5iZYAQZEuxp2ZEZtkkjRzxK8Qp84Ur2SdRUSvchVV';

module.exports = function getConfig() {
	
    let config = {
		networkId: "mainnet",
		nodeUrl: "https://rpc.testnet.near.org",
		// walletUrl: 'http://localhost:1234',
		walletUrl: "https://wallet.testnet.near.org",
		helperUrl: "https://helper.testnet.near.org",
		contractName,
		private_key,
		market_private_key,
        explorerUrl: "https://explorer.testnet.near.org",
		GAS: "200000000000000",
		DEFAULT_NEW_ACCOUNT_AMOUNT: "5",
		DEFAULT_NEW_CONTRACT_AMOUNT: "5",
		contractMethods: {
			changeMethods: [
				"new",
				"storage_deposit",
				"nft_mint",
				"nft_approve",
				"offer",
				],
				viewMethods: ["get_token_ids", "nft_token", "get_sale"],
			},
			marketDeposit: "100000000000000000000000",
			marketId: "market." + contractName,
	};

	return config;
};

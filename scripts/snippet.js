const token_id = "test:QmehoXtWCjjCazuC9NGuhn6RmuWWuvd1AEc6tFULxzrZNU:24"

const price = parseNearAmount('1');          
let sale_conditions = [
    {
        ft_token_id: 'near',
        price 
    }
];

result = await account.signAndSendTransaction(
    "dev-1623229186642-77647971299977",
    [
      transactions.functionCall(
        'nft_mint',
      {
          token_id:token_id,
          metadata:{},
          token_type:"test",
          perpetual_royalties:{
              'a1.testnet': 500,
              'a2.testnet': 250,
              'a3.testnet': 250,
              'a4.testnet': 250,
              'a5.testnet': 250,
              // 'a6.testnet': 250,
              // 'a7.testnet': 250,
          },
      },
      50000000000000,
      parseNearAmount('1')
      ),
      transactions.functionCall(
        'nft_approve',
                        {
                            token_id: token_id,
                            account_id: "market.dev-1623229186642-77647971299977",
                            msg: JSON.stringify({ sale_conditions })
                        },
                        50000000000000,
                        parseNearAmount('0.01')
      ),
    ],
  );



  console.log(result)

// console.log("Finished Adding token types")
    // console.log("Added Token Types Transaction " + result)

    // result = await account.signAndSendTransaction(
    //   "dev-1625743122506-94648200703093",
    //   [
    //     transactions.functionCall(
    //       'nft_mint',
    //     {
    //         token_id:token_id,
    //         metadata:{},
    //         token_type:"test",
    //         perpetual_royalties:{
    //         },
    //         songslist:['QmehoXtWCjjCazuC9NGuhn6RmuWWuvd1AEc6tFULxzrZNU','QmehoXtWCjjCazuC9NGuhn6RmuWWuvd1AEc6tFULxzrZNU','QmehoXtWCjjCazuC9NGuhn6RmuWWuvd1AEc6tFULxzrZNU']
    //     },
    //     100000000000000,
    //     parseNearAmount('1')
    //     ),
    //     transactions.functionCall(
    //       'nft_approve',
    //           			{
    //           				token_id: token_id,
    //           				account_id: "market.dev-1625743122506-94648200703093",
    //           				msg: JSON.stringify({ sale_conditions })
    //           			},
    //           			100000000000000,
    //           			parseNearAmount('0.01')
    //     ),
    //   ],
    // );

    
     // const token = await account.functionCall(
    //     "dev-1625057166863-88051363268524",
    //     "nft_token",
    //     { token_id: "test:QmehoXtWCjjCazuC9NGuhn6RmuWWuvd1AEc6tFULxzrZNU:104" }
    //   )
    // // Contains the txn hash where you can find the owner_id
    // console.log(token)

    // const tokens = await account.viewFunction(contractId, 'nft_tokens_for_owner', {
		// 	account_id:"dev-1625057166863-88051363268524",
		// 	from_index: '0',
		// 	limit: '100'
		// });

    // console.log(tokens);


    //     console.log("Getting Sale on the Smart Contract")
//     const DELIMETER = '||';

//     const sale = await account.viewFunction("market.dev-1623229186642-77647971299977", 
//     'get_sale',
//      { nft_contract_token: "dev-1623229186642-77647971299977" + DELIMETER + token_id}
//     );

//     console.log('\n\n get_sale result for nft', sale, '\n\n');
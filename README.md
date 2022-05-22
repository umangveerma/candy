##  Deployment Instructions
   1. `yarn install` & `yarn build`
   
   2. Add these under in `.env`
      ``` 
      REACT_APP_SOLANA_NETWORK='devnet'
      REACT_APP_SOLANA_RPC_HOST= 'https://psytrbhymqlkfrhudd.dev.genesysgo.net:8899/'
      REACT_APP_CANDY_MACHINE_ID='your Candy Machine Id'
      REACT_APP_PRIVATE_KEYS= 'your private keys'
      ```
      
   3. `yarn start`

##  What it does? 
   Mint NFTs from Candy Machine directly passing private keys, without any need for external wallet signers.

##  Deployment Instructions
   1. `yarn install` & `yarn build`
   
   2. Add these under in `.env`
      ``` 
      REACT_APP_SOLANA_NETWORK='devnet'
      REACT_APP_SOLANA_RPC_HOST= 'https://psytrbhymqlkfrhudd.dev.genesysgo.net:8899/'
      REACT_APP_CANDY_MACHINE_ID='5jZnZE3o2L2Hv4bjJEDapErBDfgb7g9JS4hFKgyxNi5c'
      ```
      
   3. Add PublicKey for payer wallet under `/page/Home/index.js` at line- 197 & PrivateKey for Payer wallet under `./mint.ts` at line- 217
    
   4. `yarn start`

## Currently facing errs  
   1. `Wallet` param incorrect under 'MintNftInstructionAccounts' in `./mint.ts`, this needs to be coming from CandyMachine State account. 
   2.  Minting ain't working with a custom `0x7d1` err. Most probably due to err in instructions, still need to be checked again. Err image below


       ![err image]( https://cdn.discordapp.com/attachments/973890557439004682/977277724357959791/0x71.PNG)

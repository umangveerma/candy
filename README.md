###  Deployment Instructions
   1. `yarn install` & `yarn build`
   
   2. Add these under in `.env`
      ``` 
      REACT_APP_SOLANA_NETWORK='devnet'
      REACT_APP_SOLANA_RPC_HOST= 'https://psytrbhymqlkfrhudd.dev.genesysgo.net:8899/'
      REACT_APP_CANDY_MACHINE_ID='5jZnZE3o2L2Hv4bjJEDapErBDfgb7g9JS4hFKgyxNi5c'
      ```
      
   3. Add PublicKey for payer wallet under `/page/Home/index.js` at line- 197 & PrivateKey for Payer wallet under `./mint.ts` at line- 217
    
   4. `yarn start`

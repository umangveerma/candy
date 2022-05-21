const axios = require('axios'); 
const anchor = require('@project-serum/anchor'); 
const solanaWeb3 = require('@solana/web3.js'); 
// Connect to devbet for testing 
var conn = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('devnet')); 
// User wallet keypair. Replace this with real one. 
var userWalletKeypair = solanaWeb3.Keypair.generate(); 
var wallet = new anchor.Wallet(userWalletKeypair); 
var provider = new anchor.Provider(conn, wallet, anchor.Provider.defaultOpt 
// Airdrop one SOL for demo purpose. 
var airdropSignature = conn.requestAirdrop( 
    userWalletKeypair.publicKey, 
    solanaWeb3.LAMPORTS_PER_SOL, 
).then(_ => { 
    // Get buy instruction 
    axios.get('https://api-devnet.magiceden.dev/v2/instructions/buy', { params: { 
        buyer: wallet.publicKey.toBase58(), 
        auctionHouseAddress: 'E8cU1WiRWjanGxmn96ewBgk9vPTcL6AEZ1t6F6fkgUWe', tokenMint: 'AnfUJkHhQncsdBcrKHk8EhUa3ss3W4ahz3VdA2LC276m', price: 0.2, 
    }
}).then(response => { 
    var tx = response.data.tx;
    provider.send( 
        anchor.web3.Transaction.populate( 
        anchor.web3.Message.from(Buffer.from(tx.data)), 
    ),
).then(sigature => { 
        // Success 
        console.log(sigature); 
    }); 
}).catch(error => { 
        // handle error 
        console.log(error); 
    }); 
});

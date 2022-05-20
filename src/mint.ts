import { CandyMachineProgram } from '@metaplex-foundation/mpl-candy-machine';
import * as web3 from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import { Buffer } from "buffer";
import {
  Connection,
  Transaction,
  SystemProgram,
  PublicKey,
  Keypair,
  sendAndConfirmTransaction,
  SYSVAR_SLOT_HASHES_PUBKEY,
} from "@solana/web3.js";
import bs58 from 'bs58';

const CANDY_MACHINE_PROGRAM = new anchor.web3.PublicKey(
    'cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ',
);

const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
    'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
);


interface CandyMachineAccount {
    id: anchor.web3.PublicKey;
    program: anchor.Program;
    state: CandyMachineState;
}

interface CandyMachineState {
    authority: anchor.web3.PublicKey;
    itemsAvailable: number;
    itemsRedeemed: number;
    itemsRemaining: number;
    treasury: anchor.web3.PublicKey;
    tokenMint: anchor.web3.PublicKey;
    isSoldOut: boolean;
    isActive: boolean;
    isPresale: boolean;
    isWhitelistOnly: boolean;
    goLiveDate: anchor.BN;
    price: anchor.BN;
    gatekeeper: null | {
        expireOnUse: boolean;
        gatekeeperNetwork: anchor.web3.PublicKey;
    };
    endSettings: null | {
        number: anchor.BN;
        endSettingType: any;
    };
    whitelistMintSettings: null | {
        mode: any;
        mint: anchor.web3.PublicKey;
        presale: boolean;
        discountPrice: null | anchor.BN;
    };
    hiddenSettings: null | {
        name: string;
        uri: string;
        hash: Uint8Array;
    };
    retainAuthority: boolean;
}

type MintNftInstructionArgs = {
    creatorBump: number;
};
type MintNftInstructionAccounts = {
    candyMachine: web3.PublicKey;
    candyMachineCreator: web3.PublicKey;
    payer: web3.PublicKey;
    wallet: web3.PublicKey;
    metadata: web3.PublicKey;
    mint: web3.PublicKey;
    mintAuthority: web3.PublicKey;
    updateAuthority: web3.PublicKey;
    masterEdition: web3.PublicKey;
    tokenMetadataProgram: web3.PublicKey;
    clock: web3.PublicKey;
    recentBlockhashes: web3.PublicKey;
    instructionSysvarAccount: web3.PublicKey;
};


const getCandyMachineCreator = async (
    candyMachine: anchor.web3.PublicKey,
): Promise<[anchor.web3.PublicKey, number]> => {
    return await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from('candy_machine'), candyMachine.toBuffer()],
        CANDY_MACHINE_PROGRAM,
    );
};

const getMasterEdition = async (
    mint: anchor.web3.PublicKey,
): Promise<anchor.web3.PublicKey> => {
    return (
        await anchor.web3.PublicKey.findProgramAddress(
            [
                Buffer.from('metadata'),
                TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                mint.toBuffer(),
                Buffer.from('edition'),
            ],
            TOKEN_METADATA_PROGRAM_ID,
        )
    )[0];
};

const getCandyMachineState = async (
    anchorWallet: anchor.Wallet,
    candyMachineId: anchor.web3.PublicKey,
    connection: anchor.web3.Connection,
): Promise<CandyMachineAccount> => {
    const provider = new anchor.Provider(connection, anchorWallet, {
        preflightCommitment: 'processed',
    });
    const idl = await anchor.Program.fetchIdl(CANDY_MACHINE_PROGRAM, provider);

    const program = new anchor.Program(idl!, CANDY_MACHINE_PROGRAM, provider);

    const state: any = await program.account.candyMachine.fetch(candyMachineId);
    const itemsAvailable = state.data.itemsAvailable.toNumber();
    const itemsRedeemed = state.itemsRedeemed.toNumber();
    const itemsRemaining = itemsAvailable - itemsRedeemed;

    return {
        id: candyMachineId,
        program,
        state: {
            authority: state.authority,
            itemsAvailable,
            itemsRedeemed,
            itemsRemaining,
            isSoldOut: itemsRemaining === 0,
            isActive: false,
            isPresale: false,
            isWhitelistOnly: false,
            goLiveDate: state.data.goLiveDate,
            treasury: state.wallet,
            tokenMint: state.tokenMint,
            gatekeeper: state.data.gatekeeper,
            endSettings: state.data.endSettings,
            whitelistMintSettings: state.data.whitelistMintSettings,
            hiddenSettings: state.data.hiddenSettings,
            price: state.data.price,
            retainAuthority: state.data.retainAuthority,
        },
    };
};

const getMetadata = async (
    mint: anchor.web3.PublicKey,

): Promise<anchor.web3.PublicKey> => {
    return (
        await anchor.web3.PublicKey.findProgramAddress(
            [
                Buffer.from('metadata'),
                TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                mint.toBuffer(),
            ],
            TOKEN_METADATA_PROGRAM_ID,
        )
    )[0];
};

export async function mintOne(
    candyMachineId: anchor.web3.PublicKey,
    payer: anchor.web3.PublicKey,
) {
    const { createMintNftInstruction } = CandyMachineProgram.instructions;

    const mint = anchor.web3.Keypair.generate();

    const [candyMachineCreator, creatorBump] = await getCandyMachineCreator(
        candyMachineId,
    );

    const metadataAddress = await getMetadata(mint.publicKey);
    const masterEdition = await getMasterEdition(mint.publicKey);


    const accounts: MintNftInstructionAccounts = {
        candyMachine: candyMachineId,
        candyMachineCreator,
        payer,
        wallet: payer,  // need to pass 'candyMachine.state.treasury' here where this 'candyMachine' is the whole candyMachine account and not only id
        mint: mint.publicKey,
        metadata: metadataAddress,
        masterEdition,
        mintAuthority: payer,
        updateAuthority: payer,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
        recentBlockhashes: SYSVAR_SLOT_HASHES_PUBKEY,
        instructionSysvarAccount: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
    };

    const args: MintNftInstructionArgs = {
        creatorBump
    };

    const ix = createMintNftInstruction(accounts, args);

    console.log(ix)

    const network = `https://api.devnet.solana.com`;
    const connection = new Connection(network);
    const transaction = new Transaction().add(ix);

    const { blockhash } = await connection.getRecentBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = new PublicKey(payer);
    const pvkey: string =
      ""; //private key of payer address
    const buf = bs58.decode(pvkey);
    const secretKey: Uint8Array = buf;

    const signers = [
        {
          publicKey: new PublicKey(payer),
          secretKey,
        },
      ];
  
      if (transaction) {
        try {
          console.log("Doing transaction");
          const confirmation = await sendAndConfirmTransaction(
            connection,
            transaction,
            signers
          );
          console.log(`https://solscan.io/tx/${confirmation}?cluster=devnet`);
        } catch (error) {
          console.log(error);
        }
      } else {
        console.log("No Transaction found!");
      }

}
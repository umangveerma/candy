import {
    Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY,
    TransactionInstruction, Blockhash,
    Commitment,
    Connection,
    FeeCalculator,
    RpcResponseAndContext,
    SignatureStatus,
    SimulatedTransactionResponse,
    Transaction,
    TransactionSignature,
} from '@solana/web3.js';
import * as web3 from '@solana/web3.js';
import { MintLayout, Token } from '@solana/spl-token';
import * as anchor from '@project-serum/anchor';
import bs58 from 'bs58';

export const CANDY_MACHINE_PROGRAM = new anchor.web3.PublicKey(
    'cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ',
);

export const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
    'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
);

export  const CANDY_MACHINE_PROGRAM_V2_ID = new PublicKey(
    'cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ',
  );

export const TOKEN_PROGRAM_ID = new PublicKey(
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
);
export const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new PublicKey(
    'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
);
export const DEFAULT_TIMEOUT = 30000;

export const getUnixTs = () => {
    return new Date().getTime() / 1000;
};

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export interface CandyMachineAccount {
    id: anchor.web3.PublicKey;
    program: anchor.Program;
    state: CandyMachineState;
}

export interface CandyMachine {
    authority: anchor.web3.PublicKey;
    wallet: anchor.web3.PublicKey;
    tokenMint: null | anchor.web3.PublicKey;
    itemsRedeemed: anchor.BN;
    data: CandyMachineData;
  }

export interface CandyMachineData {
    itemsAvailable: anchor.BN;
    uuid: null | string;
    symbol: string;
    sellerFeeBasisPoints: number;
    isMutable: boolean;
    maxSupply: anchor.BN;
    price: anchor.BN;
    retainAuthority: boolean;
    gatekeeper: null | {
      expireOnUse: boolean;
      gatekeeperNetwork: web3.PublicKey;
    };
    goLiveDate: null | anchor.BN;
    endSettings: null | [number, anchor.BN];
    whitelistMintSettings: null | {
      mode: WhitelistMintMode;
      mint: anchor.web3.PublicKey;
      presale: boolean;
      discountPrice: null | anchor.BN;
    };
    hiddenSettings: null | {
      name: string;
      uri: string;
      hash: Uint8Array;
    };
    creators: {
      address: PublicKey;
      verified: boolean;
      share: number;
    }[];
  }

export interface WhitelistMintMode {
    neverBurn: undefined | boolean;
    burnEveryTime: undefined | boolean;
  }

export interface CandyMachineState {
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


export interface BlockhashAndFeeCalculator {
    blockhash: Blockhash;
    feeCalculator: FeeCalculator;
}

export const getCollectionPDA = async (
    candyMachineAddress: anchor.web3.PublicKey,
): Promise<[anchor.web3.PublicKey, number]> => {
    return await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from('collection'), candyMachineAddress.toBuffer()],
        CANDY_MACHINE_PROGRAM_V2_ID,
    );
};

export const getCandyMachineCreator = async (
    candyMachine: anchor.web3.PublicKey,
): Promise<[anchor.web3.PublicKey, number]> => {
    return await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from('candy_machine'), candyMachine.toBuffer()],
        CANDY_MACHINE_PROGRAM,
    );
};

export const getMasterEdition = async (
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

export const getMetadata = async (
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

export function loadWalletKey(keypair : string): Keypair {
    if (!keypair) {
        throw new Error('Keypair is required!');
    }
    const key: string =
      keypair; //private key of payer address
    const buf = bs58.decode(key);
    const secretKey: Uint8Array = buf;
    
    const loaded = Keypair.fromSecretKey(secretKey)
    return loaded
}

 export async function loadCandyProgramV2(
    walletKeyPair: Keypair,
    env: string,
    customRpcUrl?: string,
  ) {
    if (customRpcUrl) console.log('USING CUSTOM URL', customRpcUrl);
  
    // @ts-ignore
    const solConnection = new anchor.web3.Connection(
      //@ts-ignore
      customRpcUrl || getCluster(env),
    );
  
    const walletWrapper = new anchor.Wallet(walletKeyPair);
    const provider = new anchor.Provider(solConnection, walletWrapper, {
      preflightCommitment: 'recent',
    });
    const idl = await anchor.Program.fetchIdl(
      CANDY_MACHINE_PROGRAM_V2_ID,
      provider,
    );
    if (!idl) return;
    const program = new anchor.Program(
      idl,
      CANDY_MACHINE_PROGRAM_V2_ID,
      provider,
    );
    console.log('program id from anchor', program.programId.toBase58());
    return program;
  }


export const sendTransactionWithRetryWithKeypair = async (
    connection: Connection,
    wallet: Keypair,
    instructions: TransactionInstruction[],
    signers: Keypair[],
    commitment: Commitment = 'singleGossip',
    includesFeePayer: boolean = false,
    block?: BlockhashAndFeeCalculator,
    beforeSend?: () => void,
) => {
    const transaction = new Transaction();
    instructions.forEach(instruction => transaction.add(instruction));
    transaction.recentBlockhash = (
        block || (await connection.getRecentBlockhash(commitment))
    ).blockhash;

    if (includesFeePayer) {
        transaction.setSigners(...signers.map(s => s.publicKey));
    } else {
        transaction.setSigners(
            // fee payed by the wallet owner
            wallet.publicKey,
            ...signers.map(s => s.publicKey),
        );
    }

    if (signers.length > 0) {
        transaction.sign(...[wallet, ...signers]);
    } else {
        transaction.sign(wallet);
    }

    if (beforeSend) {
        beforeSend();
    }

    const { txid, slot } = await sendSignedTransaction({
        connection,
        signedTransaction: transaction,
    });

    return { txid, slot };
};

export async function sendSignedTransaction({
    signedTransaction,
    connection,
    timeout = DEFAULT_TIMEOUT,
}: {
    signedTransaction: Transaction;
    connection: Connection;
    sendingMessage?: string;
    sentMessage?: string;
    successMessage?: string;
    timeout?: number;
}): Promise<{ txid: string; slot: number }> {
    const rawTransaction = signedTransaction.serialize();
    const startTime = getUnixTs();
    let slot = 0;
    const txid: TransactionSignature = await connection.sendRawTransaction(
        rawTransaction,
        {
            skipPreflight: true,
        },
    );

    console.log('Started awaiting confirmation for', txid);

    let done = false;
    (async () => {
        while (!done && getUnixTs() - startTime < timeout) {
            connection.sendRawTransaction(rawTransaction, {
                skipPreflight: true,
            });
            await sleep(500);
        }
    })();
    try {
        const confirmation = await awaitTransactionSignatureConfirmation(
            txid,
            timeout,
            connection,
            'confirmed',
            true,
        );

        if (!confirmation)
            throw new Error('Timed out awaiting confirmation on transaction');

        if (confirmation.err) {
            console.log(confirmation.err);
            throw new Error('Transaction failed: Custom instruction error');
        }

        slot = confirmation?.slot || 0;
    } catch (err) {
        console.log('Timeout Error caught', err);
        if (err) {
            throw new Error('Timed out awaiting confirmation on transaction');
        }
        let simulateResult: SimulatedTransactionResponse | null = null;
        try {
            simulateResult = (
                await simulateTransaction(connection, signedTransaction, 'single')
            ).value;
        } catch (e) {
            console.log('Simulate Transaction error', e);
        }
        if (simulateResult && simulateResult.err) {
            if (simulateResult.logs) {
                for (let i = simulateResult.logs.length - 1; i >= 0; --i) {
                    const line = simulateResult.logs[i];
                    if (line.startsWith('Program log: ')) {
                        throw new Error(
                            'Transaction failed: ' + line.slice('Program log: '.length),
                        );
                    }
                }
            }
            throw new Error(JSON.stringify(simulateResult.err));
        }
        console.log('Got this far.');
        // throw new Error('Transaction failed');
    } finally {
        done = true;
    }

    console.log('Latency (ms)', txid, getUnixTs() - startTime);
    return { txid, slot };
}

async function simulateTransaction(
    connection: Connection,
    transaction: Transaction,
    commitment: Commitment,
): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
    // @ts-ignore
    transaction.recentBlockhash = await connection._recentBlockhash(
        // @ts-ignore
        connection._disableBlockhashCaching,
    );

    const signData = transaction.serializeMessage();
    // @ts-ignore
    const wireTransaction = transaction._serialize(signData);
    const encodedTransaction = wireTransaction.toString('base64');
    const config: any = { encoding: 'base64', commitment };
    const args = [encodedTransaction, config];

    // @ts-ignore
    const res = await connection._rpcRequest('simulateTransaction', args);
    if (res.error) {
        throw new Error('failed to simulate transaction: ' + res.error.message);
    }
    return res.result;
}

async function awaitTransactionSignatureConfirmation(
    txid: TransactionSignature,
    timeout: number,
    connection: Connection,
    commitment: Commitment = 'recent',
    queryStatus = false,
): Promise<SignatureStatus | null | void> {
    let done = false;
    let status: SignatureStatus | null | void = {
        slot: 0,
        confirmations: 0,
        err: null,
    };
    let subId = 0;
    // eslint-disable-next-line no-async-promise-executor
    status = await new Promise(async (resolve, reject) => {
        setTimeout(() => {
            if (done) {
                return;
            }
            done = true;
            console.log('Rejecting for timeout...');
            reject({ timeout: true });
        }, timeout);
        try {
            subId = connection.onSignature(
                txid,
                (result, context) => {
                    done = true;
                    status = {
                        err: result.err,
                        slot: context.slot,
                        confirmations: 0,
                    };
                    if (result.err) {
                        console.log('Rejected via websocket', result.err);
                        reject(status);
                    } else {
                        console.log('Resolved via websocket', result);
                        resolve(status);
                    }
                },
                commitment,
            );
        } catch (e) {
            done = true;
            console.log('WS error in setup', txid, e);
        }
        while (!done && queryStatus) {
            // eslint-disable-next-line no-loop-func
            (async () => {
                try {
                    const signatureStatuses = await connection.getSignatureStatuses([
                        txid,
                    ]);
                    status = signatureStatuses && signatureStatuses.value[0];
                    if (!done) {
                        if (!status) {
                            console.log('REST null result for', txid, status);
                        } else if (status.err) {
                            console.log('REST error for', txid, status);
                            done = true;
                            reject(status.err);
                        } else if (!status.confirmations) {
                            console.log('REST no confirmations for', txid, status);
                        } else {
                            console.log('REST confirmation for', txid, status);
                            done = true;
                            resolve(status);
                        }
                    }
                } catch (e) {
                    if (!done) {
                        console.log('REST connection error: txid', txid, e);
                    }
                }
            })();
            await sleep(2000);
        }
    });

    //@ts-ignore
    if (connection._signatureSubscriptions[subId])
        connection.removeSignatureListener(subId);
    done = true;
    console.log('Returning status', status);
    return status;
}

export const getCollectionAuthorityRecordPDA = async (
    mint: anchor.web3.PublicKey,
    newAuthority: anchor.web3.PublicKey,
): Promise<[anchor.web3.PublicKey, number]> => {
    return await anchor.web3.PublicKey.findProgramAddress(
        [
            Buffer.from('metadata'),
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
            mint.toBuffer(),
            Buffer.from('collection_authority'),
            newAuthority.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID,
    );
};

export const getTokenWallet = async function (
    wallet: PublicKey,
    mint: PublicKey,
) {
    return (
        await PublicKey.findProgramAddress(
            [wallet.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
            SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
        )
    )[0];
};

export const getAtaForMint = async (
    mint: anchor.web3.PublicKey,
    buyer: anchor.web3.PublicKey,
): Promise<[anchor.web3.PublicKey, number]> => {
    return await anchor.web3.PublicKey.findProgramAddress(
        [buyer.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
        SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
    );
};

export function createAssociatedTokenAccountInstruction(
    associatedTokenAddress: PublicKey,
    payer: PublicKey,
    walletAddress: PublicKey,
    splTokenMintAddress: PublicKey,
) {
    const keys = [
        {
            pubkey: payer,
            isSigner: true,
            isWritable: true,
        },
        {
            pubkey: associatedTokenAddress,
            isSigner: false,
            isWritable: true,
        },
        {
            pubkey: walletAddress,
            isSigner: false,
            isWritable: false,
        },
        {
            pubkey: splTokenMintAddress,
            isSigner: false,
            isWritable: false,
        },
        {
            pubkey: SystemProgram.programId,
            isSigner: false,
            isWritable: false,
        },
        {
            pubkey: TOKEN_PROGRAM_ID,
            isSigner: false,
            isWritable: false,
        },
        {
            pubkey: SYSVAR_RENT_PUBKEY,
            isSigner: false,
            isWritable: false,
        },
    ];
    return new TransactionInstruction({
        keys,
        programId: SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
        data: Buffer.from([]),
    });
}


export async function mintV2(
    keypair: string,
    env: string,
    candyMachineAddress: PublicKey,
    rpcUrl: string,
): Promise<string> {
    const mint = Keypair.generate();

    const userKeyPair = loadWalletKey(keypair);
    const anchorProgram: any = await loadCandyProgramV2(userKeyPair, env, rpcUrl);
    const userTokenAccountAddress = await getTokenWallet(
        userKeyPair.publicKey,
        mint.publicKey,
    );

    const candyMachine: CandyMachine = await anchorProgram.account.candyMachine.fetch(candyMachineAddress);

    const remainingAccounts = [];
    const signers = [mint, userKeyPair];
    const cleanupInstructions = [];
    const instructions = [
        anchor.web3.SystemProgram.createAccount({
            fromPubkey: userKeyPair.publicKey,
            newAccountPubkey: mint.publicKey,
            space: MintLayout.span,
            lamports:
                await anchorProgram.provider.connection.getMinimumBalanceForRentExemption(
                    MintLayout.span,
                ),
            programId: TOKEN_PROGRAM_ID,
        }),
        Token.createInitMintInstruction(
            TOKEN_PROGRAM_ID,
            mint.publicKey,
            0,
            userKeyPair.publicKey,
            userKeyPair.publicKey,
        ),
        createAssociatedTokenAccountInstruction(
            userTokenAccountAddress,
            userKeyPair.publicKey,
            userKeyPair.publicKey,
            mint.publicKey,
        ),
        Token.createMintToInstruction(
            TOKEN_PROGRAM_ID,
            mint.publicKey,
            userTokenAccountAddress,
            userKeyPair.publicKey,
            [],
            1,
        ),
    ];

    if (candyMachine.data.whitelistMintSettings) {
        const mint = new anchor.web3.PublicKey(
            candyMachine.data.whitelistMintSettings.mint,
        );

        const whitelistToken = (
            await getAtaForMint(mint, userKeyPair.publicKey)
        )[0];
        remainingAccounts.push({
            pubkey: whitelistToken,
            isWritable: true,
            isSigner: false,
        });

        if (candyMachine.data.whitelistMintSettings.mode.burnEveryTime) {
            const whitelistBurnAuthority = anchor.web3.Keypair.generate();

            remainingAccounts.push({
                pubkey: mint,
                isWritable: true,
                isSigner: false,
            });
            remainingAccounts.push({
                pubkey: whitelistBurnAuthority.publicKey,
                isWritable: false,
                isSigner: true,
            });
            signers.push(whitelistBurnAuthority);
            const exists = await anchorProgram.provider.connection.getAccountInfo(
                whitelistToken,
            );
            if (exists) {
                instructions.push(
                    Token.createApproveInstruction(
                        TOKEN_PROGRAM_ID,
                        whitelistToken,
                        whitelistBurnAuthority.publicKey,
                        userKeyPair.publicKey,
                        [],
                        1,
                    ),
                );
                cleanupInstructions.push(
                    Token.createRevokeInstruction(
                        TOKEN_PROGRAM_ID,
                        whitelistToken,
                        userKeyPair.publicKey,
                        [],
                    ),
                );
            }
        }
    }

    let tokenAccount;
    if (candyMachine.tokenMint) {
        const transferAuthority = anchor.web3.Keypair.generate();

        tokenAccount = await getTokenWallet(
            userKeyPair.publicKey,
            candyMachine.tokenMint,
        );

        remainingAccounts.push({
            pubkey: tokenAccount,
            isWritable: true,
            isSigner: false,
        });
        remainingAccounts.push({
            pubkey: transferAuthority.publicKey,
            isWritable: false,
            isSigner: true,
        });

        instructions.push(
            Token.createApproveInstruction(
                TOKEN_PROGRAM_ID,
                tokenAccount,
                transferAuthority.publicKey,
                userKeyPair.publicKey,
                [],
                candyMachine.data.price.toNumber(),
            ),
        );
        signers.push(transferAuthority);
        cleanupInstructions.push(
            Token.createRevokeInstruction(
                TOKEN_PROGRAM_ID,
                tokenAccount,
                userKeyPair.publicKey,
                [],
            ),
        );
    }
    const metadataAddress = await getMetadata(mint.publicKey);
    const masterEdition = await getMasterEdition(mint.publicKey);

    console.log(
        'Remaining accounts: ',
        remainingAccounts.map(i => i.pubkey.toBase58()),
    );
    const [candyMachineCreator, creatorBump] = await getCandyMachineCreator(
        candyMachineAddress,
    );
    instructions.push(
        await anchorProgram.instruction.mintNft(creatorBump, {
            accounts: {
                candyMachine: candyMachineAddress,
                candyMachineCreator,
                payer: userKeyPair.publicKey,
                //@ts-ignore
                wallet: candyMachine.wallet,
                mint: mint.publicKey,
                metadata: metadataAddress,
                masterEdition,
                mintAuthority: userKeyPair.publicKey,
                updateAuthority: userKeyPair.publicKey,
                tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
                recentBlockhashes: anchor.web3.SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
                instructionSysvarAccount: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
            },
            remainingAccounts:
                remainingAccounts.length > 0 ? remainingAccounts : undefined,
        }),
    );

    const collectionPDA = (await getCollectionPDA(candyMachineAddress))[0];
    const collectionPDAAccount =
        await anchorProgram.provider.connection.getAccountInfo(collectionPDA);

    if (collectionPDAAccount && candyMachine.data.retainAuthority) {
        try {
            const collectionPdaData =
                (await anchorProgram.account.collectionPda.fetch(collectionPDA)) as {
                    mint: PublicKey;
                };
            const collectionMint = collectionPdaData.mint;
            const collectionAuthorityRecord = (
                await getCollectionAuthorityRecordPDA(collectionMint, collectionPDA)
            )[0];

            if (collectionMint) {
                const collectionMetadata = await getMetadata(collectionMint);
                const collectionMasterEdition = await getMasterEdition(collectionMint);
                console.log('Collection PDA: ', collectionPDA.toBase58());
                console.log('Authority: ', candyMachine.authority.toBase58());

                instructions.push(
                    await anchorProgram.instruction.setCollectionDuringMint({
                        accounts: {
                            candyMachine: candyMachineAddress,
                            metadata: metadataAddress,
                            payer: userKeyPair.publicKey,
                            collectionPda: collectionPDA,
                            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
                            instructions: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
                            collectionMint: collectionMint,
                            collectionMetadata,
                            collectionMasterEdition,
                            authority: candyMachine.authority,
                            collectionAuthorityRecord,
                        },
                    }),
                );
            }
        } catch (error) {
            console.error(error);
        }
    }
    const data = candyMachine.data;
    const txnEstimate =
        892 +
        (collectionPDAAccount && data.retainAuthority ? 182 : 0) +
        (candyMachine.tokenMint ? 177 : 0) +
        (data.whitelistMintSettings ? 33 : 0) +
        (data.whitelistMintSettings?.mode?.burnEveryTime ? 145 : 0) +
        (data.gatekeeper ? 33 : 0) +
        (data.gatekeeper?.expireOnUse ? 66 : 0);

    console.log('Transaction size estimate: ', txnEstimate);
    const INIT_INSTRUCTIONS_LENGTH = 4;
    const INIT_SIGNERS_LENGTH = 1;
    let initInstructions: anchor.web3.TransactionInstruction[] = [];
    let initSigners: Keypair[] = [];

    if (txnEstimate > 1230) {
        initInstructions = instructions.splice(0, INIT_INSTRUCTIONS_LENGTH);
        initSigners = signers.splice(0, INIT_SIGNERS_LENGTH);
    }

    if (initInstructions.length > 0) {
        await sendTransactionWithRetryWithKeypair(
            anchorProgram.provider.connection,
            userKeyPair,
            initInstructions,
            initSigners,
        );
    }

    const mainInstructions = (
        await sendTransactionWithRetryWithKeypair(
            anchorProgram.provider.connection,
            userKeyPair,
            instructions,
            signers,
        )
    ).txid;

    if (cleanupInstructions.length > 0) {
        await sendTransactionWithRetryWithKeypair(
            anchorProgram.provider.connection,
            userKeyPair,
            cleanupInstructions,
            [],
        );
    }

    return mainInstructions;
}

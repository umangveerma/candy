import styled from "styled-components";
import { MintButton } from "../MintButton";
import { GatewayProvider } from "@civic/solana-gateway-react";
import { sendTransaction } from "../../lib/connection";
import { PublicKey, Transaction } from "@solana/web3.js";
import {
  awaitTransactionSignatureConfirmation,
  CandyMachineAccount,
  CANDY_MACHINE_PROGRAM,
  mintOneToken,
} from "../../lib/candy-machine";
import * as anchor from "@project-serum/anchor";
const Container = styled.div``; // add your owns styles here
interface Props {
  candyMachine?: CandyMachineAccount;
  wallet?: anchor.Wallet;
  connection: anchor.web3.Connection;
  rpcUrl: string;
  itemsRemaining?: number;
  txTimeout: number;
  isUserMinting: boolean;
  isActive: boolean;
  isPresale: boolean;
  isWhitelistUser: boolean;
  isWalletConnected: boolean;
  setIsActive: Function;
  setIsUserMinting: Function;
  setAlertState: Function;
  setItemsRemaining: Function;
  refreshCandyMachineState: Function;
}

const MintContainer = (props: Props) => {
  const {
    candyMachine,
    wallet,
    rpcUrl,
    setIsUserMinting,
    setAlertState,
    isUserMinting,
    isActive,
    isPresale,
    connection,
    isWhitelistUser,
    itemsRemaining,
    setItemsRemaining,
    setIsActive,
    txTimeout,
    refreshCandyMachineState,
    isWalletConnected
  } = props;

  const onMint = async (
    beforeTransactions: Transaction[] = [],
    afterTransactions: Transaction[] = []
  ) => {
    try {
      setIsUserMinting(true);
      document.getElementById("#identity")?.click();
      if (isWalletConnected && candyMachine?.program && wallet?.publicKey) {
        let mintOne = await mintOneToken(
          candyMachine,
          wallet?.publicKey,
          beforeTransactions,
          afterTransactions
        );

        const mintTxId = mintOne[0];

        let status: any = { err: true };
        if (mintTxId) {
          status = await awaitTransactionSignatureConfirmation(
            mintTxId,
            txTimeout,
            connection,
            true
          );
        }

        if (status && !status.err) {
          // manual update since the refresh might not detect
          // the change immediately
          let remaining = itemsRemaining! - 1;
          setItemsRemaining(remaining);
          setIsActive((candyMachine.state.isActive = remaining > 0));
          candyMachine.state.isSoldOut = remaining === 0;
          setAlertState({
            open: true,
            message: "Congratulations! Mint succeeded!",
            severity: "success",
          });
        } else {
          setAlertState({
            open: true,
            message: "Mint failed! Please try again!",
            severity: "error",
          });
        }
      }
    } catch (error: any) {
      let message = error.msg || "Minting failed! Please try again!";
      if (!error.msg) {
        if (!error.message) {
          message = "Transaction Timeout! Please try again.";
        } else if (error.message.indexOf("0x137")) {
          console.log(error);
          message = `SOLD OUT!`;
        } else if (error.message.indexOf("0x135")) {
          message = `Insufficient funds to mint. Please fund your wallet?.`;
        }
      } else {
        if (error.code === 311) {
          console.log(error);
          message = `SOLD OUT!`;
          window.location.reload();
        } else if (error.code === 312) {
          message = `Minting period hasn't started yet.`;
        }
      }

      setAlertState({
        open: true,
        message,
        severity: "error",
      });
      // updates the candy machine state to reflect the lastest
      // information on chain
      refreshCandyMachineState();
    } finally {
      setIsUserMinting(false);
    }
  };

  const handleTransaction = async (transaction: Transaction) => {
    setIsUserMinting(true);
    const userMustSign = transaction.signatures.find((sig) =>
      sig.publicKey.equals(wallet?.publicKey!)
    );
    if (userMustSign) {
      setAlertState({
        open: true,
        message: "Please sign one-time Civic Pass issuance",
        severity: "info",
      });
      try {
        transaction = await (wallet?.signTransaction!(transaction)) as Transaction;
      } catch (e) {
        setAlertState({
          open: true,
          message: "User cancelled signing",
          severity: "error",
        });
        // setTimeout(() => window.location.reload(), 2000);
        setIsUserMinting(false);
        throw e;
      }
    } else {
      setAlertState({
        open: true,
        message: "Refreshing Civic Pass",
        severity: "info",
      });
    }
    try {
      await sendTransaction(
        connection,
        wallet,
        transaction,
        [],
        true,
        "confirmed"
      );
      setAlertState({
        open: true,
        message: "Please sign minting",
        severity: "info",
      });
    } catch (e) {
      setAlertState({
        open: true,
        message: "Solana dropped the transaction, please try again",
        severity: "warning",
      });
      console.error(e);
      // setTimeout(() => window.location.reload(), 2000);
      setIsUserMinting(false);
      throw e;
    }
    await onMint();
  };

  return (
    <Container>
      {candyMachine?.state.isActive &&
      candyMachine?.state.gatekeeper &&
      wallet?.publicKey &&
      wallet?.signTransaction ? (
        <GatewayProvider
          wallet={{
            publicKey: wallet?.publicKey || new PublicKey(CANDY_MACHINE_PROGRAM),
            //@ts-ignore
            signTransaction: wallet?.signTransaction,
          }}
          gatekeeperNetwork={candyMachine?.state?.gatekeeper?.gatekeeperNetwork}
          clusterUrl={rpcUrl}
          handleTransaction={(transaction: Transaction) =>
            handleTransaction(transaction)
          }
          broadcastTransaction={false}
          options={{ autoShowModal: false }}
        >
          <MintButton
            candyMachine={candyMachine}
            isMinting={isUserMinting}
            setIsMinting={(val) => setIsUserMinting(val)}
            onMint={onMint}
            isActive={isActive || (isPresale && isWhitelistUser)}
          />
        </GatewayProvider>
      ) : (
        <MintButton
          candyMachine={candyMachine}
          isMinting={isUserMinting}
          setIsMinting={(val) => setIsUserMinting(val)}
          onMint={onMint}
          isActive={isActive || (isPresale && isWhitelistUser)}
        />
      )}
    </Container>
  );
};

export default MintContainer;

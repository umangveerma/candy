import "./App.css";
import { useMemo } from "react";
import * as anchor from "@project-serum/anchor";
import Home from "./pages/Home";

import { WalletDialogProvider } from "@solana/wallet-adapter-material-ui";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { ThemeProvider, createTheme } from "@material-ui/core";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { clusterApiUrl } from "@solana/web3.js";
import { getCandyMachineId } from "./utils";
import useConnectWallet from "./hooks/useConnectWallet";
const theme = createTheme({
  palette: {
    type: "dark",
  },
});

const network = process.env.REACT_APP_SOLANA_NETWORK as WalletAdapterNetwork;
const rpcHost = process.env.REACT_APP_SOLANA_RPC_HOST!;
const connection = new anchor.web3.Connection(
  rpcHost ? rpcHost : anchor.web3.clusterApiUrl("devnet")
);

const txTimeoutInMilliseconds = 30000;

const App = () => {
  const wallets = useConnectWallet({ network });
  const candyMachineId = getCandyMachineId();
  const endpoint = useMemo(() => clusterApiUrl(network), []);
  return (
    <ThemeProvider theme={theme}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletDialogProvider>
            <Home
              candyMachineId={candyMachineId}
              connection={connection}
              txTimeout={txTimeoutInMilliseconds}
              rpcHost={rpcHost}
            />
          </WalletDialogProvider>
        </WalletProvider>
      </ConnectionProvider>
    </ThemeProvider>
  );
};

export default App;

import { useMemo } from "react";

import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  getPhantomWallet,
  getSlopeWallet,
  getSolflareWallet,
  getSolletWallet,
  getSolletExtensionWallet,
} from "@solana/wallet-adapter-wallets";

export interface Props {
  network: WalletAdapterNetwork;
}

const useConnectWallet = (props: Props) => {
  const network = props.network;
  const wallets = useMemo(
    () => [
      getPhantomWallet(),
      getSolflareWallet(),
      getSlopeWallet(),
      getSolletWallet({ network }),
      getSolletExtensionWallet({ network }),
    ],
    []
  );
  return wallets;
};

export default useConnectWallet;

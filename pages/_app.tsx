import "@rainbow-me/rainbowkit/styles.css";

import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { OverviewProvider } from "../components/contextOverview"; // Adjust path as necessary
import "../styles/globals.css";
import "../styles/table.css";

import {
  getDefaultConfig,
  getDefaultWallets,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import type { AppProps } from "next/app";
// import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { optimism, mainnet, arbitrum, base, scroll } from "wagmi/chains";
import {
  braveWallet,
  coinbaseWallet,
  injectedWallet,
  metaMaskWallet,
  okxWallet,
  rabbyWallet,
  rainbowWallet,
  safeWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";

let WALLET_CONNECT_KEY: string = "";
if (process.env.NEXT_PUBLIC_WALLET_CONNECT) {
  WALLET_CONNECT_KEY = process.env.NEXT_PUBLIC_WALLET_CONNECT;
}
const config = getDefaultConfig({
  appName: "Pooltime",
  projectId: WALLET_CONNECT_KEY,
  chains: [
    {
      ...optimism,
      iconWidth: "15px",
      iconHeight: "15px",
    },
    base,
    arbitrum,
    mainnet,
    {...scroll,
      iconBackground: '#ff0000',
      iconURL: "https://global.discourse-cdn.com/standard11/uploads/scroll2/original/2X/3/3bc70fd653f9c50abbb41b7568e549535f768fcc.png"}
  ],
  ssr: true, // If your dApp uses server side rendering (SSR)
});
// const connectors = connectorsForWallets(
//   [
//     {
//       groupName: 'Suggested',
//       wallets: [
//         braveWallet,
//         coinbaseWallet,
//         injectedWallet,
//         metaMaskWallet,
//         okxWallet,
//         rabbyWallet,
//         rainbowWallet,
//         safeWallet,
//         walletConnectWallet,
//       ],
//     },
//   ],
//   { appName: 'Pooltime', projectId: WALLET_CONNECT_KEY },
// );

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <OverviewProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <Component {...pageProps} />
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </OverviewProvider>
  );
}

export default MyApp;

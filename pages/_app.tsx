import "@rainbow-me/rainbowkit/styles.css";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { OverviewProvider } from "../components/contextOverview";
import "../styles/globals.css";
import "../styles/table.css";
import type { AppProps } from "next/app";
import { config as fontawesomeConfig } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
fontawesomeConfig.autoAddCss = false


import {
  getDefaultConfig,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { optimism, mainnet, arbitrum, base } from "wagmi/chains";
import { http } from "viem";
import { ENDPOINTS } from "../constants/providers";
import { defineChain } from "viem";

let WALLET_CONNECT_KEY: string = "";
if (process.env.NEXT_PUBLIC_WALLET_CONNECT) {
  WALLET_CONNECT_KEY = process.env.NEXT_PUBLIC_WALLET_CONNECT;
}

// Define viem chains for static clients with chain-specific RPC URLs
const scrollViem = defineChain({
  id: 534352, // Fixed: Scroll mainnet chain ID
  name: 'Scroll',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [ENDPOINTS.ALCHEMY.SCROLL] },
  },
  blockExplorers: {
    default: { name: 'ScrollScan', url: 'https://scrollscan.com' },
  },
  contracts: {
    multicall3: {
      address: '0x74CAE2839919f0493E7f3a53A284C42197dF9616',
      blockCreated: 3512,
    },
  },
});

const worldViem = defineChain({
  id: 480,
  name: 'World',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [ENDPOINTS.ALCHEMY.WORLD] },
  },
  blockExplorers: {
    default: { name: 'WorldScan', url: 'https://worldscan.org/' },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 1,
    },
  },
});

const gnosisViem = defineChain({
  id: 100,
  name: 'Gnosis',
  nativeCurrency: {
    name: 'XDAI',
    symbol: 'XDAI',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [ENDPOINTS.ALCHEMY.GNOSIS] },
  },
  blockExplorers: {
    default: { name: 'GnosisScan', url: 'https://gnosisscan.io/' },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 21022491,
    },
  },
});

// Create wagmi config with static transports
// Using getDefaultConfig from RainbowKit which properly handles wallet connectors
// The transports are pre-configured with chain-specific RPC URLs
const config = getDefaultConfig({
  appName: "Pooltime",
  projectId: WALLET_CONNECT_KEY,
  chains: [optimism, mainnet, arbitrum, base, scrollViem, gnosisViem, worldViem],
  ssr: true,
  transports: {
    [optimism.id]: http(ENDPOINTS.ALCHEMY.OPTIMISM),
    [mainnet.id]: http(ENDPOINTS.ALCHEMY.MAINNET),
    [arbitrum.id]: http(ENDPOINTS.ALCHEMY.ARBITRUM),
    [base.id]: http(ENDPOINTS.ALCHEMY.BASE),
    [scrollViem.id]: http(ENDPOINTS.ALCHEMY.SCROLL),
    [gnosisViem.id]: http(ENDPOINTS.ALCHEMY.GNOSIS),
    [worldViem.id]: http(ENDPOINTS.ALCHEMY.WORLD),
  },
});

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

import "@rainbow-me/rainbowkit/styles.css";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { OverviewProvider } from "../components/contextOverview";
import "../styles/globals.css";
import "../styles/table.css";
import type { AppProps } from "next/app";

import { useEffect, useState } from 'react';

import {
  getDefaultConfig,
  RainbowKitProvider,
  Chain,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider, createConfig } from "wagmi";
import { optimism, mainnet, arbitrum, base } from "wagmi/chains";

import { connect } from 'wagmi/actions';
import { http } from "viem";

// Define Scroll as a custom chain
const scroll:Chain = {
  id: 534352, // Replace with Scroll's actual chain ID
  name: 'Scroll',
  iconUrl: '/images/scroll2.webp',  // Ensure this path is correct and accessible
  iconBackground: 'transparent', 
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://scroll.drpc.org'] }, // Replace with actual Scroll RPC URL
  },
  blockExplorers: {
    default: { name: 'ScrollScan', url: 'https://scrollscan.com' }, // Replace with actual block explorer if available
  },
  contracts: {
    multicall3: {
      address: '0x74CAE2839919f0493E7f3a53A284C42197dF9616', 
      blockCreated: 3512, // Replace with actual block number if needed
    },
  },
} 
const gnosis:Chain = {
  id: 100, // Replace with Scroll's actual chain ID
  name: 'Gnosis',
  iconUrl: '/images/gnosis2.webp',  // Ensure this path is correct and accessible
  iconBackground: 'transparent', // Red background for Scroll icon
  nativeCurrency: {
    name: 'XDAI',
    symbol: 'XDAI',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://1rpc.io/gnosis'] }, // Replace with actual Scroll RPC URL
  },
  blockExplorers: {
    default: { name: 'GnosisScan', url: 'https://gnosisscan.io/' }, // Replace with actual block explorer if available
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11', 
      blockCreated: 21022491, // Replace with actual block number if needed
    },
  },
} 

let WALLET_CONNECT_KEY: string = "";
if (process.env.NEXT_PUBLIC_WALLET_CONNECT) {
  WALLET_CONNECT_KEY = process.env.NEXT_PUBLIC_WALLET_CONNECT;
}

// Customize optimism chain
const customOptimism = {
  ...optimism,
  iconUrl: '/images/optimism.svg#svgView(preserveAspectRatio(none))',
  iconBackground: 'transparent',
}

// Config setup with Scroll as a custom chain
const rainbowConfig = getDefaultConfig({
  appName: "Pooltime",
  projectId: WALLET_CONNECT_KEY,
  chains: [customOptimism, mainnet, arbitrum, base, scroll, gnosis],
  ssr: true,
});

const config = createConfig({
  chains: [customOptimism, mainnet, arbitrum, base, scroll, gnosis],
  transports: {
    [customOptimism.id]: http(customOptimism.rpcUrls.default.http[0]),
    [mainnet.id]: http(mainnet.rpcUrls.default.http[0]),
    [arbitrum.id]: http(arbitrum.rpcUrls.default.http[0]),
    [base.id]: http(base.rpcUrls.default.http[0]),
    [scroll.id]: http(scroll.rpcUrls.default.http[0]),
    [gnosis.id]: http(gnosis.rpcUrls.default.http[0]),
  },
  connectors: [],
});

const queryClient = new QueryClient();

function FarcasterFrameProvider({ children }: React.PropsWithChildren<{}>) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Only run on client-side
    if (typeof window !== 'undefined') {
      const initFarcaster = async () => {
        try {
          // Dynamically import the Farcaster modules
          const FrameSDK = (await import('@farcaster/frame-sdk')).default;
          const farcasterFrame = (await import('@farcaster/frame-wagmi-connector')).default;
          
          const context = await FrameSDK.context;
          
          // Autoconnect if running in a frame
          if (context?.client.clientFid) {
            connect(config, { connector: farcasterFrame() });
          }
          
          // Hide splash screen after UI renders
          setTimeout(() => {
            FrameSDK.actions.ready();
          }, 500);
        } catch (error) {
          console.error("Error initializing Farcaster Frame:", error);
        }
      };
      
      initFarcaster();
    }
  }, []);

  // Only render children on client-side
  if (!isClient) return null;
  return <>{children}</>;
}

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <OverviewProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <Component {...pageProps} />
            <FarcasterFrameProvider>
             </FarcasterFrameProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </OverviewProvider>
  );
}

export default MyApp;

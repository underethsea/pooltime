import { providers } from "ethers";
import { ADDRESS } from "./address";
// import {mainnet, goerli, sepolia, polygonMumbai} from "viem/chains"
// import { http, createPublicClient } from 'viem'

// toggle from alchemy to infura
const infura = false;

interface ChainEndpoints {
  [key: string]: {
    [key: string]: string | string[];
  };
}

const ALCHEMY_KEY=process.env.NEXT_PUBLIC_ALCHEMY_KEY

// Define backup RPC endpoints for each chain
// Format: [primary, backup1, backup2, ...]
const getChainEndpoints = (chainName: string): string[] => {
  const endpoints: Record<string, string[]> = {
    SCROLL: [
      `https://scroll-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
      "https://rpc.scroll.io",
      "https://scroll.drpc.org",
      "https://1rpc.io/scroll",
    ],
    OPTIMISM: [
      `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
      "https://mainnet.optimism.io",
      "https://optimism.publicnode.com",
      "https://1rpc.io/op",
    ],
    MAINNET: [
      `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
      "https://eth.llamarpc.com",
      "https://rpc.ankr.com/eth",
      "https://ethereum.publicnode.com",
      "https://1rpc.io/eth",
    ],
    ETHEREUM: [
      `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
      "https://eth.llamarpc.com",
      "https://rpc.ankr.com/eth",
      "https://ethereum.publicnode.com",
      "https://1rpc.io/eth",
    ],
    POLYGON: [
      `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
      "https://polygon.llamarpc.com",
      "https://rpc.ankr.com/polygon",
      "https://polygon-rpc.com",
      "https://1rpc.io/matic",
    ],
    BASE: [
      `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
      "https://mainnet.base.org",
      "https://base.llamarpc.com",
      "https://1rpc.io/base",
    ],
    ARBITRUM: [
      `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
      "https://arb1.arbitrum.io/rpc",
      "https://arbitrum.llamarpc.com",
      "https://1rpc.io/arb",
    ],
    GNOSIS: [
      `https://gnosis-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
      "https://rpc.gnosischain.com",
      "https://gnosis.publicnode.com",
      "https://1rpc.io/gnosis",
    ],
    WORLD: [
      `https://worldchain-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
      "https://worldchain-mainnet.g.alchemy.com/public",
      "https://rpc.worldchain.org",
    ],
    SEPOLIA: [
      `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`,
      "https://rpc.sepolia.org",
      "https://sepolia.infura.io/v3/a86edca6bd3040689463a58672d7d8e5",
      "https://ethereum-sepolia.publicnode.com",
    ],
    OPSEPOLIA: [
      `https://opt-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`,
      "https://sepolia.optimism.io",
      "https://optimism-sepolia.publicnode.com",
    ],
    BASESEPOLIA: [
      "https://sepolia.base.org",
      "https://base-sepolia.publicnode.com",
    ],
    ARBSEPOLIA: [
      `https://arb-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`,
      "https://sepolia-rollup.arbitrum.io/rpc",
    ],
  };
  
  return endpoints[chainName] || [`https://${chainName.toLowerCase()}-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`];
};

const ENDPOINTS : ChainEndpoints= {
  "ALCHEMY": {
    "SCROLL": getChainEndpoints("SCROLL"),
    "OPTIMISM": getChainEndpoints("OPTIMISM"),
    "GOERLI": `https://eth-goerli.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    "MUMBAI": `https://polygon-mumbai.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    "SEPOLIA": getChainEndpoints("SEPOLIA"),
    "MAINNET": getChainEndpoints("MAINNET"),
    "ETHEREUM": getChainEndpoints("ETHEREUM"),
    "OPGOERLI": `https://opt-goerli.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    "POLYGON": getChainEndpoints("POLYGON"),
    "AVALANCHE": "https://avalanche.public-rpc.com",
    "OPSEPOLIA": getChainEndpoints("OPSEPOLIA"),
    "BASESEPOLIA": getChainEndpoints("BASESEPOLIA"),
    "BASE": getChainEndpoints("BASE"),
    "ARBSEPOLIA": getChainEndpoints("ARBSEPOLIA"),
    "ARBITRUM": getChainEndpoints("ARBITRUM"),
    "GNOSIS": getChainEndpoints("GNOSIS"),
    "WORLD": getChainEndpoints("WORLD"),
  },
  "INFURA": {
    "SEPOLIA": "https://sepolia.infura.io/v3/a86edca6bd3040689463a58672d7d8e5",
    "GOERLI": "https://goerli.infura.io/v3/a86edca6bd3040689463a58672d7d8e5",
    "MAINNET": "https://mainnet.infura.io/v3/a86edca6bd3040689463a58672d7d8e5",
    "MUMBAI": "https://rpc-mumbai.matic.today",
  },
} 

// Create a provider with failover support
function createProviderWithFailover(urls: string | string[], chainId: number, name: string): providers.JsonRpcProvider {
  const urlArray = Array.isArray(urls) ? urls : [urls];
  let currentProviderIndex = 0;
  let providerInstances: providers.JsonRpcProvider[] = [];
  
  // Create all provider instances
  urlArray.forEach(url => {
    const provider = new providers.StaticJsonRpcProvider(url, { chainId, name });
    providerInstances.push(provider);
  });
  
  // Create a wrapper provider that handles failover
  const wrapper = new providers.JsonRpcProvider(urlArray[0], { chainId, name });
  
  const originalSend = wrapper.send.bind(wrapper);
  
  wrapper.send = async function(method: string, params?: any[]): Promise<any> {
    // Handle chain ID methods without RPC call
    if (method === 'eth_chainId' || method === 'net_version') {
      if (method === 'net_version') {
        return Promise.resolve(chainId.toString());
      }
      return Promise.resolve(`0x${chainId.toString(16)}`);
    }
    
    // Try each provider in order until one succeeds
    let lastError: Error | null = null;
    for (let i = 0; i < providerInstances.length; i++) {
      const index = (currentProviderIndex + i) % providerInstances.length;
      const provider = providerInstances[index];
      
      try {
        const result = await provider.send(method, params || []);
        // If successful, update current provider index for next time
        if (index !== currentProviderIndex) {
          console.log(`[RPC Failover] Switched to backup provider ${index + 1}/${providerInstances.length} for ${name}`);
          currentProviderIndex = index;
        }
        return result;
      } catch (error: any) {
        lastError = error;
        // Log the failure but continue to next provider
        if (i < providerInstances.length - 1) {
          console.warn(`[RPC Failover] Provider ${index + 1}/${providerInstances.length} failed for ${name}, trying next...`, error.message);
        }
      }
    }
    
    // All providers failed
    console.error(`[RPC Failover] All ${providerInstances.length} providers failed for ${name}`);
    throw lastError || new Error(`All RPC providers failed for ${name}`);
  };
  
  // Override getBlockNumber with failover
  const originalGetBlockNumber = wrapper.getBlockNumber.bind(wrapper);
  wrapper.getBlockNumber = async function(): Promise<number> {
    let lastError: Error | null = null;
    for (let i = 0; i < providerInstances.length; i++) {
      const index = (currentProviderIndex + i) % providerInstances.length;
      try {
        const result = await providerInstances[index].getBlockNumber();
        if (index !== currentProviderIndex) {
          console.log(`[RPC Failover] Switched to backup provider ${index + 1}/${providerInstances.length} for ${name} (getBlockNumber)`);
          currentProviderIndex = index;
        }
        return result;
      } catch (error: any) {
        lastError = error;
        if (i < providerInstances.length - 1) {
          console.warn(`[RPC Failover] Provider ${index + 1}/${providerInstances.length} failed for ${name} (getBlockNumber), trying next...`);
        }
      }
    }
    throw lastError || new Error(`All RPC providers failed for ${name} (getBlockNumber)`);
  };
  
  // Override getLogs with failover
  const originalGetLogs = wrapper.getLogs.bind(wrapper);
  wrapper.getLogs = async function(filter: providers.Filter): Promise<providers.Log[]> {
    let lastError: Error | null = null;
    for (let i = 0; i < providerInstances.length; i++) {
      const index = (currentProviderIndex + i) % providerInstances.length;
      try {
        const result = await providerInstances[index].getLogs(filter);
        if (index !== currentProviderIndex) {
          console.log(`[RPC Failover] Switched to backup provider ${index + 1}/${providerInstances.length} for ${name} (getLogs)`);
          currentProviderIndex = index;
        }
        return result;
      } catch (error: any) {
        lastError = error;
        if (i < providerInstances.length - 1) {
          console.warn(`[RPC Failover] Provider ${index + 1}/${providerInstances.length} failed for ${name} (getLogs), trying next...`);
        }
      }
    }
    throw lastError || new Error(`All RPC providers failed for ${name} (getLogs)`);
  };
  
  return wrapper;
}

// Legacy function for single URL (backward compatibility)
function createStaticProvider(url: string, chainId: number, name: string): providers.JsonRpcProvider {
  return createProviderWithFailover([url], chainId, name);
}

// Helper to get endpoint URL(s) - handles both string and string[]
const getEndpointUrl = (endpoint: string | string[] | undefined): string | string[] => {
  if (!endpoint) {
    throw new Error('Endpoint not found');
  }
  return endpoint;
};

let PROVIDERS: Record<string, providers.JsonRpcProvider> = {};
let rpc: keyof typeof ENDPOINTS = "INFURA";
infura ? (rpc = "INFURA") : (rpc = "ALCHEMY");

PROVIDERS = {
  GNOSIS: createProviderWithFailover(getEndpointUrl(ENDPOINTS[rpc].GNOSIS), ADDRESS.GNOSIS.CHAINID, 'gnosis'),
  // GOERLI: createProviderWithFailover(getEndpointUrl(ENDPOINTS[rpc].GOERLI), 5, 'goerli'),
  // MUMBAI: createProviderWithFailover(getEndpointUrl(ENDPOINTS[rpc].MUMBAI), 80001, 'maticmum'),
  SEPOLIA: createProviderWithFailover(getEndpointUrl(ENDPOINTS[rpc].SEPOLIA), 11155111, 'sepolia'),
  // OPGOERLI: createProviderWithFailover(getEndpointUrl(ENDPOINTS[rpc].OPGOERLI), 420, 'optimism-goerli'),
  OPTIMISM: createProviderWithFailover(getEndpointUrl(ENDPOINTS[rpc].OPTIMISM), ADDRESS.OPTIMISM.CHAINID, 'optimism'),
  MAINNET: createProviderWithFailover(getEndpointUrl(ENDPOINTS[rpc].MAINNET), ADDRESS.ETHEREUM.CHAINID, 'homestead'),
  POLYGON: createProviderWithFailover(getEndpointUrl(ENDPOINTS[rpc].POLYGON), 137, 'matic'),
  WORLD: createProviderWithFailover(getEndpointUrl(ENDPOINTS[rpc].WORLD), ADDRESS.WORLD.CHAINID, 'world'),
  // AVALANCHE: createProviderWithFailover(getEndpointUrl(ENDPOINTS[rpc].AVALANCHE), 43114, 'avalanche'),
  OPSEPOLIA: createProviderWithFailover(getEndpointUrl(ENDPOINTS[rpc].OPSEPOLIA), 11155420, 'optimism-sepolia'),
  BASE: createProviderWithFailover(getEndpointUrl(ENDPOINTS[rpc].BASE), ADDRESS.BASE.CHAINID, 'base'),
  BASESEPOLIA: createProviderWithFailover(getEndpointUrl(ENDPOINTS[rpc].BASESEPOLIA), 84532, 'base-sepolia'),
  ARBSEPOLIA: createProviderWithFailover(getEndpointUrl(ENDPOINTS[rpc].ARBSEPOLIA), 421614, 'arbitrum-sepolia'),
  ARBITRUM: createProviderWithFailover(getEndpointUrl(ENDPOINTS[rpc].ARBITRUM), ADDRESS.ARBITRUM.CHAINID, 'arbitrum'),
  ETHEREUM: createProviderWithFailover(getEndpointUrl(ENDPOINTS[rpc].MAINNET), ADDRESS.ETHEREUM.CHAINID, 'homestead'),
  SCROLL: createProviderWithFailover(getEndpointUrl(ENDPOINTS[rpc].SCROLL), ADDRESS.SCROLL.CHAINID, 'scroll')
}
// };
// let VIEMPROVIDERS: Record<string, ReturnType<typeof createPublicClient>> = {};
// VIEMPROVIDERS = {
//   GOERLI: createPublicClient({
//     chain: goerli,
//     transport: 
//       http(ENDPOINTS[rpc].GOERLI),
//   }),
//   MUMBAI: createPublicClient({
//     chain: polygonMumbai,
//     transport: http(ENDPOINTS[rpc].MUMBAI)
//   }),
//   SEPOLIA: createPublicClient({
//     chain: sepolia,
//     transport: http(ENDPOINTS[rpc].SEPOLIA),
//   }),
//   MAINNET: createPublicClient({
//     chain: mainnet,
//     transport: http(ENDPOINTS[rpc].MAINNET),
//   }),
// };


export { PROVIDERS, ENDPOINTS };


// const ethereumEndpoint = "https://mainnet.infura.io/v3/" + process.env.ETHEREUM_KEY;
// const ethereumEndpoint = "https://eth-mainnet.alchemyapi.io/v2/IoY2MivSyvhBktzHoyto2ZqUsG2BEWth"

// const ethereumEndpoint = "https://eth-mainnet.alchemyapi.io/v2/" + process.env.POLYGON_KEY;
// const polygonEndpoint = "https://polygon-mainnet.g.alchemy.com/v2/" + process.env.POLYGON_KEY;
// const avalancheEndpoint = "https://api.avax.network/ext/bc/C/rpc";
// const avalancheEndpoint = "https://avalanche-mainnet.infura.io/v3/" + process.env.INFURA_KEY;
// const optimismEndpoint = "https://opt-mainnet.g.alchemy.com/v2/" + process.env.POLYGON_KEY;
// const avalancheEndpoint = "https://rpc.ankr.com/avalanche";

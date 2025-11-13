import { providers } from "ethers";
import { ADDRESS } from "./address";
// import {mainnet, goerli, sepolia, polygonMumbai} from "viem/chains"
// import { http, createPublicClient } from 'viem'

// toggle from alchemy to infura
const infura = false;
interface ChainEndpoints {
  [key: string]: {
    [key: string]: string;
  };
}
const ALCHEMY_KEY=process.env.NEXT_PUBLIC_ALCHEMY_KEY
const ENDPOINTS : ChainEndpoints= {
  "ALCHEMY": {
    "SCROLL":
    "https://rpc.scroll.io",
    "OPTIMISM":
    "https://opt-mainnet.g.alchemy.com/v2/" +
    ALCHEMY_KEY,
    "GOERLI":
      "https://eth-goerli.g.alchemy.com/v2/" +
      ALCHEMY_KEY,
      "MUMBAI":
      "https://polygon-mumbai.g.alchemy.com/v2/" +
      ALCHEMY_KEY,
      "SEPOLIA":
      "https://eth-sepolia.g.alchemy.com/v2/" +
      ALCHEMY_KEY,
      "MAINNET":
      "https://eth-mainnet.g.alchemy.com/v2/" +
      ALCHEMY_KEY,
      "ETHEREUM":
      "https://eth-mainnet.g.alchemy.com/v2/" +
      ALCHEMY_KEY,
      "OPGOERLI":
      "https://opt-goerli.g.alchemy.com/v2/"+
      ALCHEMY_KEY,
      "POLYGON":
      "https://polygon-mainnet.g.alchemy.com/v2/"+ALCHEMY_KEY,
      "AVALANCHE":
      "https://avalanche.public-rpc.com",
      "OPSEPOLIA":
      // "https://sepolia.optimism.io/",
      "https://opt-sepolia.g.alchemy.com/v2/"+ALCHEMY_KEY,
      BASESEPOLIA: 
      "https://sepolia.base.org",
      BASE: "https://base-mainnet.g.alchemy.com/v2/" + ALCHEMY_KEY,
      ARBSEPOLIA: "https://arb-sepolia.g.alchemy.com/v2/" + ALCHEMY_KEY,

      ARBITRUM: "https://arb-mainnet.g.alchemy.com/v2/" + ALCHEMY_KEY,
      GNOSIS: "https://gnosis-mainnet.g.alchemy.com/v2/" + ALCHEMY_KEY,
      WORLD: "https://worldchain-mainnet.g.alchemy.com/v2/" + ALCHEMY_KEY,
    },
  "INFURA": {
    "SEPOLIA": "https://sepolia.infura.io/v3/a86edca6bd3040689463a58672d7d8e5",
    "GOERLI": "https://goerli.infura.io/v3/a86edca6bd3040689463a58672d7d8e5",
    "MAINNET": "https://mainnet.infura.io/v3/a86edca6bd3040689463a58672d7d8e5",
    "MUMBAI": "https://rpc-mumbai.matic.today",
  },
} 

function createStaticProvider(url: string, chainId: number, name: string): providers.JsonRpcProvider {
  const provider = new providers.StaticJsonRpcProvider(url, { chainId, name });
  
  const originalSend = provider.send.bind(provider);
  provider.send = function(method: string, params?: any[]): Promise<any> {
    if (method === 'eth_chainId' || method === 'net_version') {
      if (method === 'net_version') {
        return Promise.resolve(chainId.toString());
      }
      return Promise.resolve(`0x${chainId.toString(16)}`);
    }
    return originalSend(method, params || []);
  };
  
  return provider;
}

let PROVIDERS: Record<string, providers.JsonRpcProvider> = {};
let rpc: keyof typeof ENDPOINTS = "INFURA";
infura ? (rpc = "INFURA") : (rpc = "ALCHEMY");
PROVIDERS = {
  GNOSIS: createStaticProvider(ENDPOINTS[rpc].GNOSIS, ADDRESS.GNOSIS.CHAINID, 'gnosis'),
  // GOERLI: createStaticProvider(ENDPOINTS[rpc].GOERLI, 5, 'goerli'),
  // MUMBAI: createStaticProvider(ENDPOINTS[rpc].MUMBAI, 80001, 'maticmum'),
  SEPOLIA: createStaticProvider(ENDPOINTS[rpc].SEPOLIA, 11155111, 'sepolia'),
  // OPGOERLI: createStaticProvider(ENDPOINTS[rpc].OPGOERLI, 420, 'optimism-goerli'),
  OPTIMISM: createStaticProvider(ENDPOINTS[rpc].OPTIMISM, ADDRESS.OPTIMISM.CHAINID, 'optimism'),
  MAINNET: createStaticProvider(ENDPOINTS[rpc].MAINNET, ADDRESS.ETHEREUM.CHAINID, 'homestead'),
  POLYGON: createStaticProvider(ENDPOINTS[rpc].POLYGON, 137, 'matic'),
  WORLD: createStaticProvider(ENDPOINTS[rpc].WORLD, ADDRESS.WORLD.CHAINID, 'world'),
  // AVALANCHE: createStaticProvider(ENDPOINTS[rpc].AVALANCHE, 43114, 'avalanche'),
  OPSEPOLIA: createStaticProvider(ENDPOINTS[rpc].OPSEPOLIA, 11155420, 'optimism-sepolia'),
  BASE: createStaticProvider(ENDPOINTS[rpc].BASE, ADDRESS.BASE.CHAINID, 'base'),
  BASESEPOLIA: createStaticProvider(ENDPOINTS[rpc].BASESEPOLIA, 84532, 'base-sepolia'),
  ARBSEPOLIA: createStaticProvider(ENDPOINTS[rpc].ARBSEPOLIA, 421614, 'arbitrum-sepolia'),
  ARBITRUM: createStaticProvider(ENDPOINTS[rpc].ARBITRUM, ADDRESS.ARBITRUM.CHAINID, 'arbitrum'),
  ETHEREUM: createStaticProvider(ENDPOINTS[rpc].MAINNET, ADDRESS.ETHEREUM.CHAINID, 'homestead'),
  SCROLL: createStaticProvider(ENDPOINTS[rpc].SCROLL, ADDRESS.SCROLL.CHAINID, 'scroll')




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

import { providers } from "ethers";
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
    },
  "INFURA": {
    "SEPOLIA": "https://sepolia.infura.io/v3/a86edca6bd3040689463a58672d7d8e5",
    "GOERLI": "https://goerli.infura.io/v3/a86edca6bd3040689463a58672d7d8e5",
    "MAINNET": "https://mainnet.infura.io/v3/a86edca6bd3040689463a58672d7d8e5",
    "MUMBAI": "https://rpc-mumbai.matic.today",
  },
} 

let PROVIDERS: Record<string, providers.JsonRpcProvider> = {};
let rpc: keyof typeof ENDPOINTS = "INFURA";
infura ? (rpc = "INFURA") : (rpc = "ALCHEMY");
PROVIDERS = {
  // GOERLI: new providers.JsonRpcProvider(ENDPOINTS[rpc].GOERLI),
  // MUMBAI: new providers.JsonRpcProvider(ENDPOINTS[rpc].MUMBAI),
  SEPOLIA: new providers.JsonRpcProvider(ENDPOINTS[rpc].SEPOLIA),
  // OPGOERLI: new providers.JsonRpcProvider(ENDPOINTS[rpc].OPGOERLI),
  OPTIMISM: new providers.JsonRpcProvider(ENDPOINTS[rpc].OPTIMISM),
  MAINNET: new providers.JsonRpcProvider(ENDPOINTS[rpc].MAINNET),
  POLYGON: new providers.JsonRpcProvider(ENDPOINTS[rpc].POLYGON),
  // AVALANCHE: new providers.JsonRpcProvider(ENDPOINTS[rpc].AVALANCHE),
  OPSEPOLIA: new providers.JsonRpcProvider(ENDPOINTS[rpc].OPSEPOLIA),
  BASE: new providers.JsonRpcProvider(ENDPOINTS[rpc].BASE),
  BASESEPOLIA: new providers.JsonRpcProvider(ENDPOINTS[rpc].BASESEPOLIA),
  ARBSEPOLIA: new providers.JsonRpcProvider(ENDPOINTS[rpc].ARBSEPOLIA),
  ARBITRUM: new providers.JsonRpcProvider(ENDPOINTS[rpc].ARBITRUM),
  ETHEREUM: new providers.JsonRpcProvider(ENDPOINTS[rpc].MAINNET),
  SCROLL: new providers.JsonRpcProvider(ENDPOINTS[rpc].SCROLL)




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

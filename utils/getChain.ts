import { CONFIG } from "../constants/config";
import { ADDRESS } from "../constants";
export const GetChainName = (id: number) => {
  // console.log("chain number is what??",id)
  if (id === 80001) {
    return "MUMBAI";
  } else if (id === 5) {
    return "GOERLI";
  } else if (id === 420) {
    return "OPGOERLI";
  } else if (id === 10) {
    return "OPTIMISM";
  } else if (id === 11155420) {
    return "OPSEPOLIA";
  } else if (id === 84532) {
    return "BASESEPOLIA";
  } else if (id === 8453) {
    return "BASE";
  } else if (id === 421614) {
    return "ARBSEPOLIA";
  } else if (id === 42161) {
    return "ARBITRUM";
  } 
  else if (id === 1) {
    return "ETHEREUM";
  }else {
    return CONFIG.CHAINNAME;
  }
};

// export const GetChainIcon = (id: number) => {
//   if (id === 10) {
//     return "https://assets.coingecko.com/coins/images/25244/standard/Optimism.png?1696524385";
//   } else if (id === 11155420) {
//     return "/images/op.png";
//   } else return "/images/optimism.webp";
// };

export const GetChainIcon = (id: number) => {
  const chainNames = Object.keys(ADDRESS);
  for (const chainName of chainNames) {
    if (ADDRESS[chainName].CHAINID === id) {
      return ADDRESS[chainName].ICON;
    }
  }
  return undefined;
}

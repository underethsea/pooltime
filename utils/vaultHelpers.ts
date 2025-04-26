// utils/vaultHelpers.ts
import { ethers } from "ethers";
import { ADDRESS } from "../constants/address";
import { GetChainName } from "./getChain";

export type VaultData = {
  name: string;
  poolers: number;
  totalSupply: string;
  depositsDollarValue?: string;
  depositsEthValue?: string;
  vault: string;
  decimals: number;
  symbol: string;
  contributed7d: string; // add this line
  contributed24h: string;
  apr: number;
  vaultAPR?: string;
  won7d: string;
  asset: string;
  assetBalance: ethers.BigNumber;
  vaultBalance: ethers.BigNumber;
  assetSymbol: string;
  status?: number;
  c: number;
  formattedAssetBalance?: string;
  numericAssetBalance?: number;
  formattedVaultBalance?: string;
  numericVaultBalance?: number;
  depositsEthBigInt: number;
};

export function getTVLPerChain(vaults: VaultData[]) {
  return vaults.reduce((acc: any, vault: any) => {
    const chainId = vault.c;
    const rawValue = vault.depositsEthValue;
    if (rawValue) {
      const parsedValue = parseFloat(rawValue);
      if (!isNaN(parsedValue)) {
        if (!acc[chainId]) acc[chainId] = 0;
        acc[chainId] += parsedValue;
      }
    }
    return acc;
  }, {});
}

export const calculateTotalAndPerChainTVL = (vaults: VaultData[]) => {
    // Extract chain IDs from ADDRESS
    const chainIds = Object.values(ADDRESS).map((chain) => chain.CHAINID);
  
    // Calculate TVL per chain
    const tvlPerChain: any = getTVLPerChain(vaults);
  
    // Filter TVL per chain to include only those in ADDRESS
    const filteredTVLPerChain: any = {};
    for (const chainId of chainIds) {
      if (tvlPerChain[chainId] !== undefined) {
        filteredTVLPerChain[chainId] = tvlPerChain[chainId];
      }
    }
  
    // Calculate total TVL
    const totalTVL = Object.values(filteredTVLPerChain).reduce(
      (total: any, tvl: any) => total + tvl,
      0
    );
  
    return { totalTVL, tvlPerChain: filteredTVLPerChain };
  };

  type VaultsByChain = {
    chainId: number;
    vaults: VaultData[];
  };

 export function groupVaultsByChain(vaultData: VaultData[]): VaultsByChain[] {
    const groupedByChain: { [chainId: number]: VaultData[] } = {};

    vaultData.forEach((vault: VaultData) => {
      const chainId = vault.c;
      if (!groupedByChain[chainId]) {
        groupedByChain[chainId] = [];
      }
      groupedByChain[chainId].push(vault);
    });

    return Object.entries(groupedByChain).map(([chainId, vaults]) => ({
      chainId: Number(chainId), // Convert chainId to number
      vaults,
    }));
  }

 export const sortData = (data: any, geckoPrices: any, assetPrices: any) => {
    if (!assetPrices) return data;

    const dataWithValues = data.map((vault: any) => {
      const chainName = GetChainName(vault.c);
      const price = assetPrices[chainName]?.[vault.asset.toLowerCase()] ?? 0;

      const tokenBalance =
        vault.assetBalance && vault.status !== 1
          ? vault.formattedAssetBalance
          : 0;

      const ticketBalance = vault.vaultBalance
        ? vault.formattedVaultBalance
        : 0;

      return {
        ...vault,
        tokenValue:
          tokenBalance > 0 && price === 0
            ? Number.EPSILON
            : tokenBalance * price,
        ticketValue:
          ticketBalance > 0 && price === 0
            ? Number.EPSILON
            : ticketBalance * price,
      };
    });

    const sortedByContributed = dataWithValues.sort((a: any, b: any) => {
      const chainNameA = GetChainName(a.c);
      const chainNameB = GetChainName(b.c);
      const prizeTokenGeckoA =
        ADDRESS[chainNameA]?.PRIZETOKEN?.GECKO || "ethereum";
      const prizeTokenGeckoB =
        ADDRESS[chainNameB]?.PRIZETOKEN?.GECKO || "ethereum";
      const prizeTokenPriceA =
        geckoPrices[prizeTokenGeckoA] || geckoPrices["ethereum"];
      const prizeTokenPriceB =
        geckoPrices[prizeTokenGeckoB] || geckoPrices["ethereum"];
      return (
        parseFloat(b.contributed7d) * prizeTokenPriceB -
        parseFloat(a.contributed7d) * prizeTokenPriceA
      );
    });

    const sortedByTokenValue = sortedByContributed.sort(
      (a: any, b: any) => b.tokenValue - a.tokenValue
    );

    const sortedByTicketValue = sortedByTokenValue.sort(
      (a: any, b: any) => b.ticketValue - a.ticketValue
    );

    return sortedByTicketValue;
  };


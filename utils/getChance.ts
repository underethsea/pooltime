import { ethers } from "ethers";
import { GetChainName } from "./getChain";
import { Multicall } from "./multicall";
import { ABI, ADDRESS, PROVIDERS } from "../constants/";

interface UserBalanceTotalSupplyTwab {
  twab: ethers.BigNumber;
  twabTotalSupply: ethers.BigNumber;
}

interface Tier {
  odds: number;
  duration: number;
  vaultPortion: number;
}

export const GetChance = async (
  chainId: number,
  vault: string,
  pooler: string,
  numberOfTiers: number
) => {
  const chainName = GetChainName(chainId);
  const prizePoolContract = new ethers.Contract(
    ADDRESS[chainName].PRIZEPOOL,
    ABI.PRIZEPOOL,
    PROVIDERS[chainName]
  );
  const historyUrl = `https://poolexplorer.xyz/${chainId}-${ADDRESS[chainName].PRIZEPOOL}-history`;

  const tierAccrualCalls = [];
  for (let i = 0; i < numberOfTiers; i++) {
    tierAccrualCalls.push(prizePoolContract.getTierAccrualDurationInDraws(i));
  }

  const initialCalls = [
    prizePoolContract.getLastAwardedDrawId(),
    ...tierAccrualCalls,
  ];

  const [historyResponse, multicallResponse] = await Promise.all([
    fetch(historyUrl),
    Multicall(initialCalls, chainName),
  ]);

  let historyData;
  try {
    historyData = await historyResponse.json();
  } catch (e) {
    console.error("Failed to parse history response:", e);
    historyData = []; // Default to an empty array on failure
  }

  const [lastDrawId, ...tierDurations] =
    multicallResponse as unknown as [ethers.BigNumber, ...ethers.BigNumber[]];

  const twabAndPortionCalls = [];
  for (let i = 0; i < numberOfTiers; i++) {
    const startDraw =
      Math.max(0, Number(lastDrawId) - Number(tierDurations[i])) + 1;
    twabAndPortionCalls.push(
      prizePoolContract.getVaultUserBalanceAndTotalSupplyTwab(
        vault,
        pooler,
        startDraw,
        Number(lastDrawId)
      )
    );
    twabAndPortionCalls.push(
      prizePoolContract.getVaultPortion(vault, startDraw, lastDrawId)
    );
  }
  twabAndPortionCalls.push(
    prizePoolContract.getVaultPortion(vault, Number(lastDrawId) - 7, lastDrawId)
  );

  const subsequentMulticallResponse = (await Multicall(
    twabAndPortionCalls,
    chainName
  )) as any[];

  const tiers: Tier[] = [];
  for (let i = 0; i < numberOfTiers; i++) {
    const userBalanceTotalSupplyTwab =
      subsequentMulticallResponse[i * 2] as UserBalanceTotalSupplyTwab;
    const vaultPortion = subsequentMulticallResponse[
      i * 2 + 1
    ] as ethers.BigNumber;

    const odds =
      (Number(userBalanceTotalSupplyTwab.twab) /
        Number(userBalanceTotalSupplyTwab.twabTotalSupply)) *
      (Number(vaultPortion) / 1e18);

    tiers.push({
      odds: 1 / odds,
      duration: Number(tierDurations[i]),
      vaultPortion: Number(vaultPortion) / 1e18,
    });
  }

  const sevenDrawVaultPortion = subsequentMulticallResponse[
    numberOfTiers * 2
  ] as ethers.BigNumber;

  const winsPerDraw = getWinsPerDraw(historyData);
  const { winsPerDraw7d, winsPerDraw30d, winsPerDraw90d } = winsPerDraw;

  const chance = {
    winsPerDraw7d: winsPerDraw7d,
    winsPerDraw30d: winsPerDraw30d,
    winsPerDraw90d: winsPerDraw90d,
    sevenDrawVaultPortion: Number(sevenDrawVaultPortion) / 1e18,
    tiers: tiers,
  };

  return chance;
};

function getWinsPerDraw(historyData: Array<{ draw: string; wins: number }>) {
  // Sort the data by draw number in descending order to get the most recent draws first
  historyData.sort((a, b) => Number(b.draw) - Number(a.draw));

  // Function to calculate the average number of wins for a given number of draws
  function calculateAverageWins(draws: Array<{wins: number}>, numDraws: number) {
    if (draws.length < numDraws) {
      return 0;
    }
    
    let totalWins = 0;
    for (let i = 0; i < numDraws; i++) {
      totalWins += draws[i].wins;
    }
    return totalWins / numDraws;
  }

  // console.log("average wins",calculateAverageWins(historyData, 7))
  return {
    winsPerDraw7d: calculateAverageWins(historyData, 7),
    winsPerDraw30d: calculateAverageWins(historyData, 30),
    winsPerDraw90d: calculateAverageWins(historyData, 90)
  };

}

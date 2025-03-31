import { ethers } from "ethers";
import { GetChainName } from "./getChain";
import { Multicall } from "./multicall";
import { ABI, ADDRESS, PROVIDERS } from "../constants/";

interface UserBalanceTotalSupplyTwab {
  twab: ethers.BigNumber;
  twabTotalSupply: ethers.BigNumber;
}

export const GetChance = async (
  chainId: number,
  vault: string,
  pooler: string
) => {
  const chainName = GetChainName(chainId);
  const prizePoolContract = new ethers.Contract(
    ADDRESS[chainName].PRIZEPOOL,
    ABI.PRIZEPOOL,
    PROVIDERS[chainName]
  );
  const historyUrl = `https://poolexplorer.xyz/${chainId}-${ADDRESS[chainName].PRIZEPOOL}-history`;
// console.log("history url",historyUrl)
  const calls = [
    prizePoolContract.getLastAwardedDrawId(),
    prizePoolContract.getTierAccrualDurationInDraws(0),
    prizePoolContract.getTierAccrualDurationInDraws(1),
  ];

  const [historyResponse, multicallResponse] = await Promise.all([
    fetch(historyUrl),
    Multicall(calls, chainName)
  ]);

  const historyData = await historyResponse.json();

  // console.log("history data", historyData);
  const [lastDrawId, grandPrizeDuration, firstTierDuration] = multicallResponse as unknown as [ethers.BigNumber, ethers.BigNumber, ethers.BigNumber];

  const grandPrizeStartDraw =
    Math.max(0, Number(lastDrawId) - Number(grandPrizeDuration)) + 1;
  const firstTierStartDraw =
    Math.max(0, Number(lastDrawId) - Number(firstTierDuration)) + 1;

    const [
      userGrandPrizeBalanceTotalSupplyTwab,
      userFirstTierBalanceTotalSupplyTwab,
      grandPrizeVaultPortion,
      firstTierVaultPortion,
      sevenDrawVaultPortion
    ] = (await Multicall(
      [
        prizePoolContract.getVaultUserBalanceAndTotalSupplyTwab(
          vault,
          pooler,
          grandPrizeStartDraw,
          Number(lastDrawId)
        ),
        prizePoolContract.getVaultUserBalanceAndTotalSupplyTwab(
          vault,
          pooler,
          firstTierStartDraw,
          lastDrawId
        ),
        prizePoolContract.getVaultPortion(vault, grandPrizeStartDraw, lastDrawId),
        prizePoolContract.getVaultPortion(vault, firstTierStartDraw, lastDrawId),
        prizePoolContract.getVaultPortion(vault, Number(lastDrawId) - 7, lastDrawId),
      ],
      chainName
    )) as unknown as [
      UserBalanceTotalSupplyTwab,
      UserBalanceTotalSupplyTwab,
      ethers.BigNumber,
      ethers.BigNumber,
      ethers.BigNumber
    ];

  // console.log(
  //   "chance calc",
  //   Number(userGrandPrizeBalanceTotalSupplyTwab.twab),
  //   Number(userGrandPrizeBalanceTotalSupplyTwab.twabTotalSupply),
  //   Number(grandPrizeVaultPortion)
  // );
  const grandPrizeOdds =
    (Number(userGrandPrizeBalanceTotalSupplyTwab.twab) /
      Number(userGrandPrizeBalanceTotalSupplyTwab.twabTotalSupply)) *
    (Number(grandPrizeVaultPortion) / 1e18);

  const firstTierOdds =
    (Number(userFirstTierBalanceTotalSupplyTwab.twab) /
      Number(userFirstTierBalanceTotalSupplyTwab.twabTotalSupply)) *
    (Number(firstTierVaultPortion) / 1e18);

  const winsPerDraw = getWinsPerDraw(historyData);
  // console.log("wins per draw",winsPerDraw)
const {winsPerDraw7d,winsPerDraw30d,winsPerDraw90d} = winsPerDraw
  const chance = {
    winsPerDraw7d:winsPerDraw7d,
    winsPerDraw30d:winsPerDraw30d,
    winsPerDraw90d:winsPerDraw90d,
    grandPrize: 1 / grandPrizeOdds,
    grandPrizeDuration: Number(grandPrizeDuration),
    grandPrizeVaultPortion: Number(grandPrizeVaultPortion) / 1e18,
    sevenDrawVaultPortion: Number(sevenDrawVaultPortion) / 1e18,
    firstTier: 1 / firstTierOdds / 4,
    firstTierDuration: Number(firstTierDuration),
    firstTierVaultPortion: Number(firstTierVaultPortion) / 1e18
  };
  // console.log("chance", chance);
  return chance;
};

function getWinsPerDraw(historyData: Array<{draw: string, wins: number}>) {
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

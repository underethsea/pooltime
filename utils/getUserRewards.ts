import { GetActivePromotionsForVaults } from "./getActivePromotions";
import { Multicall } from "./multicall";
import { ethers } from "ethers";
import { ADDRESS } from "../constants/address";
import { ABI } from "../constants/abi";
import { PROVIDERS } from "../constants/providers";

interface Reward {
  promotionId: number;
  rewardAmount: number;
}

interface ActiveReward {
  token: string;
  decimals: number;
  price: any;
  epochStarted: number;
  epochDuration: number;
  vault: string;
  promotionId: number;
  accumulatedReward: any;
}

interface UserRewards {
  completed: Reward[];
  active: ActiveReward[];
}

export async function GetUsersAwards(
  chainName: string,
  userAddress: any,
  vaults: any,
  prices:any,
  whitelist = true
) {
  if (!chainName) {
    console.log("no chain for rewards");
  } else {
    let vaultAddresses;
    if (vaults.length > 0) {
      vaultAddresses = vaults;
    } else {
      const vaultsResponse = await fetch(`https://poolexplorer.xyz/vaults`);
      let vaults = await vaultsResponse.json();
      vaultAddresses = vaults.map((vault: any) => vault.vault);
    }

    const activePromotions = await GetActivePromotionsForVaults(vaultAddresses,false,prices);

    let completedEpochCalls = [];
    let activeEpochCalls = [];
    let completedPromotions = [];
    let activePromotionsData = [];

    for (let address in activePromotions) {
      let promotions = activePromotions[address];

      for (let promo of promotions) {
        let epochStartedAt = parseInt(promo.epochStartedAt);
        let startTimestamp = parseInt(promo.startTimestamp);
        let epochDuration = parseInt(promo.epochDuration);
        let numberOfEpochs = parseInt(promo.initialNumberOfEpochs);
        let currentTime = Date.now() / 1000;
        let currentEpoch = getCurrentEpoch(
          startTimestamp,
          epochDuration,
          currentTime
        );

        if (startTimestamp + epochDuration < currentTime) {
          let completedEpochs = getCompletedEpochs(
            startTimestamp,
            epochDuration,
            numberOfEpochs,
            currentTime
          );
          if (completedEpochs.length > 0) {
            promo.completedEpochs = completedEpochs;
            const twabRewardsContract = new ethers.Contract(
              ADDRESS[chainName].TWABREWARDS,
              ABI.TWABREWARDS,
              PROVIDERS[chainName]
            );
            completedEpochCalls.push(
              twabRewardsContract.getRewardsAmount(
                userAddress,
                promo.promotionId,
                completedEpochs
              )
            );
            completedPromotions.push(promo);
          }
        }

        if (
          currentTime > startTimestamp &&
          currentTime < epochStartedAt + epochDuration
        ) {
          let nowTimeAdjusted = currentTime - 4000;
          let endTimestamp = Math.floor(
            Math.min(epochStartedAt + epochDuration, nowTimeAdjusted)
          );

          if (epochStartedAt < endTimestamp) {
            const twabControllerContract = new ethers.Contract(
              ADDRESS[chainName].TWABCONTROLLER,
              ABI.TWABCONTROLLER,
              PROVIDERS[chainName]
            );
            activeEpochCalls.push(
              twabControllerContract.getTwabBetween(
                address,
                userAddress,
                epochStartedAt,
                endTimestamp
              ),
              twabControllerContract.getTotalSupplyTwabBetween(
                address,
                epochStartedAt,
                endTimestamp
              )
            );
            activePromotionsData.push(promo);
          }
        }
      }
    }

    let completedRewards = await Multicall(completedEpochCalls, chainName);
    let activeRewardsData = await Multicall(activeEpochCalls, chainName);

    let userRewards = calculateRewards(
      completedPromotions,
      completedRewards,
      activePromotionsData,
      activeRewardsData
    );

    return userRewards;
  }
}

function getCurrentEpoch(
  startTimestamp: any,
  epochDuration: any,
  currentTime: any
) {
  if (currentTime < startTimestamp) {
    return 0;
  }

  const timeDifference = currentTime - startTimestamp;
  return Math.floor(timeDifference / epochDuration) + 1;
}

function getCompletedEpochs(
  startTimestamp: any,
  epochDuration: any,
  numberOfEpochs: any,
  currentTimestamp: any
) {
  let completedEpochs = [];

  for (let epoch = 0; epoch < numberOfEpochs; epoch++) {
    let epochEndTime = startTimestamp + (epoch + 1) * epochDuration;

    if (epochEndTime <= currentTimestamp) {
      completedEpochs.push(epoch);
    } else {
      break;
    }
  }

  return completedEpochs;
}

function calculateRewards(
  completedPromotions: any,
  completedRewards: any,
  activePromotionsData: any,
  activeRewardsData: any
) {
  let userRewards: UserRewards = {
    completed: [],
    active: [],
  };

  completedPromotions.forEach((promo: any, index: any) => {
    let reward: {
      completedEpochs: any;
      token: any;
      decimals: any;
      vault: any;
      price: any;
      promotionId: any;
      rewardAmount: any;
      totalRewards: any;
    };

    let filteredCompletedEpochs = [];
    let filteredRewardAmounts = [];
    let totalRewards = ethers.BigNumber.from(0);

    for (let i = 0; i < promo.completedEpochs.length; i++) {
      if (completedRewards[index][i].gt(ethers.BigNumber.from(0))) {
        filteredCompletedEpochs.push(promo.completedEpochs[i]);
        filteredRewardAmounts.push(completedRewards[index][i]);
        totalRewards = totalRewards.add(completedRewards[index][i]);
      }
    }
    if (filteredCompletedEpochs.length > 0) {
      reward = {
        completedEpochs: filteredCompletedEpochs,
        token: promo.token,
        decimals: promo.decimals,
        price: promo.price,
        vault: promo.vault,
        promotionId: promo.promotionId,
        rewardAmount: filteredRewardAmounts,
        totalRewards: totalRewards,
      };
      userRewards.completed.push(reward);
    }
  });

  activePromotionsData.forEach((promo: any, index: any) => {
    let userTwab = activeRewardsData[index * 2];
    let totalTwab = activeRewardsData[index * 2 + 1];

    let currentTime = Math.floor(Date.now() / 1000);
    let nowTimeAdjusted = currentTime - 4000;
    let epochEndTime = Math.floor(
      Math.min(promo.epochStartedAt + promo.epochDuration, nowTimeAdjusted)
    );
    let timeActive = epochEndTime - promo.epochStartedAt;

    let rewardsForEpoch = (promo.tokensPerSecond / 1e18) * timeActive;

    let userShare = userTwab / totalTwab;

    let accumulatedReward = rewardsForEpoch * userShare;
    if (accumulatedReward > 0) {
      let reward: ActiveReward = {
        token: promo.token,
        decimals: promo.decimals,
        price: promo.price,
        epochStarted: promo.epochStartedAt,
        epochDuration: promo.epochDuration,
        vault: promo.vault,
        promotionId: promo.promotionId,
        accumulatedReward: accumulatedReward,
      };
      userRewards.active.push(reward);
    }
  });

  return userRewards;
}

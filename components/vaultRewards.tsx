import React, { useEffect, useState } from "react";
import { GetUsersAwards } from "../utils/getUserRewards";
import Timer from "./timer";
import { CropDecimals } from "../utils/tokenMaths";
import Image from "next/image";
import { ethers } from "ethers";
import { ADDRESS, CONFIG, ABI, WHITELIST_REWARDS } from "../constants";
import { useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from "wagmi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useChainId } from "wagmi";

interface Reward {
  promotionId: number;
  rewardAmount: number;
}

interface ActiveReward {
  token: string;
  price: any;
  epochStarted: number;
  epochDuration: number;
  vault: string;
  promotionId: number;
  accumulatedReward: number;
  decimals: number;
}

interface UserRewards {
  completed: Reward[];
  active: ActiveReward[];
}

interface VaultRewardsProps {
  chainName: string;
  chainId: number;
  address: string;
  vaults: string[];
  prices: any;
}

export const VaultRewards: React.FC<VaultRewardsProps> = ({
  chainName,
  chainId,
  address,
  vaults,
  prices,
}) => {
  const { chains, switchChain } = useSwitchChain();

  const {
    data: claimData,
    isPending: claimIsLoading,
    isSuccess: claimIsSuccess,
    writeContract: claimWrite,
  } = useWriteContract({
    mutation: {
      onSuccess: () => {
        toast("Claiming!", {
          position: toast.POSITION.BOTTOM_LEFT,
        });
      },
    },
  });

  const { isLoading: claimWaitLoading, isSuccess: claimWaitSuccess } =
    useWaitForTransactionReceipt({
      hash: claimData,
    });

  const [refresh, setRefresh] = useState(true);

  const [rewards, setRewards] = useState<UserRewards>({
    completed: [],
    active: [],
  });

  const chainIdConnected = useChainId();
  useEffect(() => {
    if (claimWaitSuccess) {
      const toastId = "claim-success";
      if (!toast.isActive(toastId)) {
        toast("Claim success!", {
          position: toast.POSITION.BOTTOM_LEFT,
          toastId: toastId,
        });
      }
    }
  }, [claimWaitSuccess]);
  useEffect(() => {}, [chainIdConnected]);

  useEffect(() => {
    fetchPromotions();
  }, [address, claimWaitSuccess, refresh, chainName]);

  const fetchPromotions = async () => {
    const userAwards = await GetUsersAwards(chainName, address, vaults, prices);
    setRewards(userAwards as any);
  };

  function getPromoTokenInfo(address: string) {
    for (const chain in WHITELIST_REWARDS) {
      const tokens = WHITELIST_REWARDS[chain];
      const tokenInfo = tokens.find(
        (token) => token.TOKEN.toLowerCase() === address.toLowerCase()
      );
      if (tokenInfo) {
        return {
          chain,
          symbol: tokenInfo.SYMBOL,
          icon: tokenInfo.ICON,
        };
      }
    }
    return null; // Return null if the token is not found
  }

  return (
    <>
      {/* TODO code for rewards.completed */}
      {rewards &&
        rewards.completed &&
        rewards.completed.map((promo: any, index) => {
          const tokenInfo = getPromoTokenInfo(promo.token);

          if (!tokenInfo) {
            return null; // Skip rendering if token info is not found
          }

          const { chain, symbol, icon } = tokenInfo;

          return (
            <div
            className="claim-animated claimWin"
            key={index}
            style={{
              backgroundColor: "#e5f3f5",
              color: "black",
              borderRadius: "6px",
              display: "inline-flex",
              flexDirection: "column",
              padding: "10px",
              alignItems: "flex-end",
              maxWidth: "250px",
            }}
            onClick={() => {
              if (chainId !== chainIdConnected) {
                console.log(`Switching to the correct chain: ${chainId}`);
                switchChain({ chainId: chainId });
                return;
              }
              console.log("claiming on vault", promo.vault);
              claimWrite({
                address: ADDRESS[chainName].TWABREWARDS as any,
                abi: ABI.TWABREWARDS,
                functionName: "claimRewards",
                args: [address, promo.promotionId, promo.completedEpochs],
              });
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                width: "100%",
                alignItems: "center",
                marginBottom: "4px",
              }}
            >
              <Image
                src={icon}
                className="emoji"
                alt={symbol}
                width={15}
                height={15}
                layout="fixed"
                objectFit="contain"
              />
              &nbsp;
              {CropDecimals(
                ethers.utils.formatUnits(promo.totalRewards, promo.decimals)
              )}
              &nbsp;
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                width: "100%",
                fontSize: "10px",
              }}
            >
              {chainId === chainIdConnected ? (
                <>Claim Now</>
              ) : (
                <>Switch Chains</>
              )}
            </div>
          </div>
          
          );
        })}

      {rewards &&
        rewards.active &&
        rewards.active.map((epoch, index) => {
          const tokenInfo = getPromoTokenInfo(epoch.token);

          if (!tokenInfo) {
            return null; // Skip rendering if token info is not found
          }

          const { chain, symbol, icon } = tokenInfo;

          return (
            <div
              key={index}
              style={{
                backgroundColor: "#f3fdfd",
                color: "black",
                borderRadius: "6px",
                display: "inline-flex",
                flexDirection: "column",
                padding: "10px",
                marginLeft: "5px",
                alignItems: "flex-end",
                maxWidth: "250px",
              }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  width: "100%",
                  alignItems: "center",
                  marginBottom: "4px",
                }}>
                <Image
                  src={icon}
                  className="emoji"
                  alt={symbol}
                  width={15}
                  height={15}
                  layout="fixed"
                  objectFit="contain"
                />
                &nbsp;{CropDecimals(epoch.accumulatedReward)}&nbsp;
                <div className="tooltipContainer">
                  <Image
                    src="/images/moreInfo.svg"
                    alt="i"
                    width={13}
                    height={13}
                  />
                  <span className="tooltipText">
                    Your rewards are building up! Claim them after the timer
                    ends. Current value $
                    {CropDecimals(epoch.price * epoch.accumulatedReward)}
                  </span>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  width: "100%",
                  fontSize: "10px",
                }}>
                Claim in &nbsp;
                <Timer
                  seconds={+epoch.epochStarted + +epoch.epochDuration}
                  shortForm={true}
                  onEnd={() => {
                    setTimeout(() => {
                      setRefresh((prevRefresh) => !prevRefresh);
                    }, 3000);
                  }}
                  openAward={() => {}}
                />
              </div>
            </div>
          );
        })}
    </>
  );
};

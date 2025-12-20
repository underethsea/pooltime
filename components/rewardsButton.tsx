import React, { useEffect, useState, useMemo } from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { useOverview } from "./contextOverview";
import { vaultsAPIFormatted } from "../utils/vaultsFromConstantsAdapter";
import { VaultData, groupVaultsByChain } from "../utils/vaultHelpers";
import { GetChainName } from "../utils/getChain";
import { GetVaultBalances } from "../utils/getVaultBalances";
import { GetActivePromotionsForVaults } from "../utils/getActivePromotions";
import { GetUsersAwards } from "../utils/getUserRewards";
import { WHITELIST_REWARDS } from "../constants/address";
import { CropDecimals, NumberWithCommas } from "../utils/tokenMaths";
import RewardsModal from "./rewardsModal";

interface RewardsButtonProps {
  address: string;
}

const RewardsButton: React.FC<RewardsButtonProps> = ({ address }) => {
  const { overview } = useOverview();
  const [vaults, setVaults] = useState<VaultData[]>([]);
  const [ticketVaults, setTicketVaults] = useState<VaultData[]>([]);
  const [claimableByVault, setClaimableByVault] = useState<
    Record<
      string,
      {
        token: string;
        symbol: string;
        amount: string;
        decimals: number;
        promotionId: number;
        completedEpochs: number[];
        chainId: number;
        meta?: boolean;
      }[]
    >
  >({});
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch vault list once
  useEffect(() => {
    let cancelled = false;
    const fetchVaults = async () => {
      let vaultList: VaultData[] = vaultsAPIFormatted as any;
      try {
        const resp = await fetch("https://poolexplorer.xyz/vaults");
        if (resp.ok) {
          vaultList = await resp.json();
        }
      } catch (err) {
        console.error("Failed to fetch vault list for rewards button", err);
      } finally {
        if (!cancelled) {
          setVaults(vaultList);
        }
      }
    };
    fetchVaults();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch balances for the address to determine ticket holdings
  useEffect(() => {
    let cancelled = false;
    const loadBalances = async () => {
      if (!address || vaults.length === 0) {
        setTicketVaults([]);
        return;
      }

      try {
        const grouped = groupVaultsByChain(vaults);
        const balanceResults = await Promise.all(
          grouped.map(async ({ chainId, vaults: chainVaults }) => {
            const vaultAddresses = chainVaults.map((vault) => vault.vault);
            const assetAddresses = chainVaults.map((vault) => vault.asset);
            const balances = await GetVaultBalances(
              address,
              vaultAddresses,
              assetAddresses,
              GetChainName(chainId)
            );
            return { chainVaults, balances };
          })
        );

        const flattened = balanceResults.flatMap(({ chainVaults, balances }) =>
          chainVaults.map((vault) => {
            const balance = balances[vault.vault.toLowerCase()];
            const formattedVaultBalance = balance?.vaultBalance
              ? ethers.utils.formatUnits(balance.vaultBalance, vault.decimals)
              : "0";
            const numericVaultBalance = parseFloat(formattedVaultBalance);

            return {
              ...vault,
              vaultBalance: balance?.vaultBalance,
              formattedVaultBalance,
              numericVaultBalance,
            };
          })
        );

        const filtered = flattened
          .filter(
            (vault) => vault.vaultBalance && !vault.vaultBalance.isZero()
          )
          .sort(
            (a, b) => (b.numericVaultBalance || 0) - (a.numericVaultBalance || 0)
          );

        if (!cancelled) {
          setTicketVaults(filtered);
        }
      } catch (err) {
        console.error("Failed to load ticket balances for rewards button", err);
        if (!cancelled) {
          setTicketVaults([]);
        }
      }
    };

    loadBalances();
    return () => {
      cancelled = true;
    };
  }, [address, vaults]);

  // Fetch claimable rewards
  useEffect(() => {
    let cancelled = false;
    const fetchRewards = async () => {
      if (
        !address ||
        ticketVaults.length === 0 ||
        !overview?.prices
      ) {
        setClaimableByVault({});
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const grouped = groupVaultsByChain(ticketVaults);
        const tokenSymbolMap = Object.values(WHITELIST_REWARDS)
          .flat()
          .reduce((acc: any, tokenObj: any) => {
            acc[tokenObj.TOKEN.toLowerCase()] = tokenObj.SYMBOL;
            return acc;
          }, {});

        const rewardPromises = grouped.map(async ({ chainId, vaults: chainVaults }) => {
          const chainName = GetChainName(chainId);
          const vaultAddrs = chainVaults.map((v) => v.vault);
          try {
            const rewards = await GetUsersAwards(
              chainName,
              address,
              vaultAddrs,
              overview.prices,
              true
            );
            return { chainId, rewards, chainVaults };
          } catch (err) {
            console.error("Failed to fetch user rewards for chain", chainName, err);
            return { chainId, rewards: { completed: [] }, chainVaults };
          }
        });

        const rewardResults = await Promise.all(rewardPromises);
        const claimables: Record<
          string,
          {
            token: string;
            symbol: string;
            amount: string;
            decimals: number;
            promotionId: number;
            completedEpochs: number[];
            chainId: number;
            meta?: boolean;
          }[]
        > = {};

        rewardResults.forEach(({ chainId, rewards, chainVaults }) => {
          rewards.completed.forEach((reward: any) => {
            const tokenAddr = reward.token?.toLowerCase();
            if (!tokenAddr) return;
            let amountBN: any =
              reward.totalRewards ?? reward.rewardAmount ?? 0;

            if (Array.isArray(amountBN)) {
              amountBN = amountBN.reduce((acc: any, val: any) => {
                try {
                  return acc.add(val);
                } catch {
                  return acc;
                }
              }, ethers.BigNumber.from(0));
            }

            try {
              amountBN = ethers.BigNumber.from(amountBN);
            } catch {
              amountBN = ethers.BigNumber.from(0);
            }

            const amountStr = ethers.utils.formatUnits(
              amountBN,
              reward.decimals ?? 18
            );
            if (parseFloat(amountStr) <= 0) return;
            const vaultKey = reward.vault.toLowerCase();
            if (!claimables[vaultKey]) claimables[vaultKey] = [];
            claimables[vaultKey].push({
              token: tokenAddr,
              symbol:
                tokenSymbolMap[tokenAddr] ||
                `${tokenAddr.slice(0, 4)}...${tokenAddr.slice(-4)}`,
              amount: amountStr,
              decimals: reward.decimals ?? 18,
              promotionId: reward.promotionId,
              completedEpochs: reward.completedEpochs || [],
              chainId,
              meta: reward.meta,
            });
          });
        });

        if (!cancelled) {
          setClaimableByVault(claimables);
        }
      } catch (err) {
        console.error("Failed to fetch rewards for button", err);
        if (!cancelled) {
          setClaimableByVault({});
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };
    fetchRewards();
    return () => {
      cancelled = true;
    };
  }, [address, ticketVaults, overview?.prices]);

  // Calculate total value of all claimable rewards
  const totalClaimableValue = useMemo(() => {
    if (!overview?.prices?.assets) return 0;
    
    let total = 0;
    Object.values(claimableByVault).forEach((rewards) => {
      rewards.forEach((reward) => {
        const chainName = GetChainName(reward.chainId);
        const tokenPrice = overview.prices.assets[chainName]?.[reward.token.toLowerCase()] || 0;
        const amount = parseFloat(reward.amount) || 0;
        total += amount * tokenPrice;
      });
    });
    return total;
  }, [claimableByVault, overview?.prices]);

  if (isLoading || totalClaimableValue <= 0) {
    return null;
  }

  return (
    <>
      <div
        className="box-header custom-link win-bubble"
        style={{ width: "fit-content", padding: "5px 10px", display: "flex", alignItems: "center", marginTop: "8px" }}
        onClick={() => setShowModal(true)}
      >
        &nbsp;REWARDS&nbsp;
        ${NumberWithCommas(CropDecimals(totalClaimableValue.toFixed(2)))}
      </div>
      {showModal && (
        <RewardsModal address={address} onClose={() => setShowModal(false)} />
      )}
    </>
  );
};

export default RewardsButton;


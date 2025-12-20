import React, { useEffect, useState, useMemo } from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import AccountRewards from "./account/AccountRewards";
import { useOverview } from "./contextOverview";
import { vaultsAPIFormatted } from "../utils/vaultsFromConstantsAdapter";
import { VaultData, groupVaultsByChain } from "../utils/vaultHelpers";
import { GetChainName } from "../utils/getChain";
import { GetVaultBalances } from "../utils/getVaultBalances";
import { GetActivePromotionsForVaults } from "../utils/getActivePromotions";
import { GetUsersAwards } from "../utils/getUserRewards";
import { WHITELIST_REWARDS } from "../constants/address";
import { CropDecimals, NumberWithCommas } from "../utils/tokenMaths";

interface RewardsModalProps {
  address: string;
  onClose: () => void;
}

const RewardsModal: React.FC<RewardsModalProps> = ({ address, onClose }) => {
  const { overview } = useOverview();
  const [vaults, setVaults] = useState<VaultData[]>([]);
  const [ticketVaults, setTicketVaults] = useState<VaultData[]>([]);
  const [vaultsLoading, setVaultsLoading] = useState(false);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [rewardsLoading, setRewardsLoading] = useState(false);
  const [promotionsByVault, setPromotionsByVault] = useState<
    Record<string, any[]>
  >({});
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

  // Fetch vault list once
  useEffect(() => {
    let cancelled = false;
    const fetchVaults = async () => {
      setVaultsLoading(true);
      let vaultList: VaultData[] = vaultsAPIFormatted as any;
      try {
        const resp = await fetch("https://poolexplorer.xyz/vaults");
        if (resp.ok) {
          vaultList = await resp.json();
        }
      } catch (err) {
        console.error("Failed to fetch vault list for rewards modal", err);
      } finally {
        if (!cancelled) {
          setVaults(vaultList);
          setVaultsLoading(false);
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
        setTicketLoading(false);
        return;
      }

      setTicketLoading(true);
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
        console.error("Failed to load account ticket balances", err);
        if (!cancelled) {
          setTicketVaults([]);
        }
      } finally {
        if (!cancelled) {
          setTicketLoading(false);
        }
      }
    };

    loadBalances();
    return () => {
      cancelled = true;
    };
  }, [address, vaults]);

  // Fetch active promotions only for vaults the user holds tickets in
  useEffect(() => {
    let cancelled = false;
    const fetchPromotions = async () => {
      if (
        !address ||
        ticketVaults.length === 0 ||
        !overview?.prices
      ) {
        setPromotionsByVault({});
        setClaimableByVault({});
        setRewardsLoading(false);
        return;
      }

      setRewardsLoading(true);
      try {
        const vaultAddresses = ticketVaults.map((v) => v.vault);
        const promosResult = await GetActivePromotionsForVaults(
          vaultAddresses,
          true,
          overview.prices,
          false,
          ""
        );
        const promos = (promosResult as unknown) as Record<string, any[]>;
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

        // Fetch claimable rewards per chain for the user's ticketed vaults - PARALLELIZED
        const grouped = groupVaultsByChain(ticketVaults);
        const tokenSymbolMap = Object.values(WHITELIST_REWARDS)
          .flat()
          .reduce((acc: any, tokenObj: any) => {
            acc[tokenObj.TOKEN.toLowerCase()] = tokenObj.SYMBOL;
            return acc;
          }, {});

        // Process all chains in parallel instead of sequentially
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

        // Wait for all chains to complete in parallel
        const rewardResults = await Promise.all(rewardPromises);

        // Process results and build claimables
        rewardResults.forEach(({ chainId, rewards, chainVaults }) => {
          rewards.completed.forEach((reward: any) => {
            const tokenAddr = reward.token?.toLowerCase();
            if (!tokenAddr) return;
            let amountBN: any =
              reward.totalRewards ?? reward.rewardAmount ?? 0;

            // Handle rewardAmount arrays
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
          setPromotionsByVault(promos || {});
          setClaimableByVault(claimables);
        }
      } catch (err) {
        console.error("Failed to fetch promotions for rewards modal", err);
        if (!cancelled) {
          setPromotionsByVault({});
          setClaimableByVault({});
        }
      } finally {
        if (!cancelled) {
          setRewardsLoading(false);
        }
      }
    };
    fetchPromotions();
    return () => {
      cancelled = true;
    };
  }, [address, ticketVaults, overview?.prices]);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  }, []);

  const modalContentStyle = isMobile
    ? { ...styles.modalContent, ...styles.modalContentMobile }
    : styles.modalContent;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        {isMobile && (
          <button onClick={onClose} style={styles.closeButton}>
            &times;
          </button>
        )}
        <div style={{ backgroundColor: "#030526", paddingTop: isMobile ? "0" : "0" }}>
          <AccountRewards
            address={address}
            ticketVaults={ticketVaults}
            promotionsByVault={promotionsByVault}
            claimableByVault={claimableByVault}
            loading={rewardsLoading || vaultsLoading || ticketLoading}
            canClaim={true}
            isModal={true}
            isMobile={isMobile}
          />
        </div>
      </div>
    </div>
  );
};

const styles: any = {
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    color: "white",
    maxWidth: "500px",
    border: "3px solid #fbf9fd",
    width: "75%",
    backgroundColor: "#030526",
    padding: "20px 20px 20px 20px",
    margin: "10px 10px 10px 10px",
    borderRadius: "25px",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
    position: "relative",
    textAlign: "center",
    maxHeight: "85%",
    overflow: "auto",
    scrollbarWidth: "none", 
    msOverflowStyle: "none",
  },
  modalContentMobile: {
    width: "100%",
    height: "100%",
    maxWidth: "100vw",
    maxHeight: "100vh",
    margin: 0,
    borderRadius: 0,
    border: "none",
    padding: "50px 15px 20px 15px",
  },
  closeButton: {
    position: "fixed",
    top: "15px",
    right: "15px",
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: "30px",
    cursor: "pointer",
    zIndex: 1002,
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};

export default RewardsModal;


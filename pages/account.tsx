import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import AccountWins from "../components/account/AccountWins";
import AccountTickets from "../components/account/AccountTickets";
import AccountRewards from "../components/account/AccountRewards";
import { useOverview } from "../components/contextOverview";
import { vaultsAPIFormatted } from "../utils/vaultsFromConstantsAdapter";
import { VaultData, groupVaultsByChain } from "../utils/vaultHelpers";
import { GetChainName } from "../utils/getChain";
import { GetVaultBalances } from "../utils/getVaultBalances";
import { GetActivePromotionsForVaults } from "../utils/getActivePromotions";
import { GetUsersAwards } from "../utils/getUserRewards";
import { WHITELIST_REWARDS } from "../constants/address";
import Layout from "./index";

const AccountPage: React.FC = () => {
  const { address, isConnected, status } = useAccount();
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
        console.error("Failed to fetch vault list for account page", err);
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

  // Fetch balances for the connected address to determine ticket holdings
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

        // Fetch claimable rewards per chain for the user's ticketed vaults
        const grouped = groupVaultsByChain(ticketVaults);
        for (const { chainId, vaults: chainVaults } of grouped) {
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
            const tokenSymbolMap = Object.values(WHITELIST_REWARDS)
              .flat()
              .reduce((acc: any, tokenObj: any) => {
                acc[tokenObj.TOKEN.toLowerCase()] = tokenObj.SYMBOL;
                return acc;
              }, {});

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
          } catch (err) {
            console.error("Failed to fetch user rewards for chain", chainName, err);
          }
        }

        if (!cancelled) {
          setPromotionsByVault(promos || {});
          setClaimableByVault(claimables);
        }
      } catch (err) {
        console.error("Failed to fetch promotions for account rewards", err);
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

  return (
    <Layout>
      <div style={styles.page}>
        <div style={styles.pageHeader}>
          <h1 style={styles.title}>Account</h1>
          <p style={styles.subtitle}>
            Track your wins, tickets, and upcoming rewards.
          </p>
        </div>

        {status === "disconnected" ? (
          <div style={styles.notice}>
            Connect your wallet to see personalized stats.
          </div>
        ) : status === "connecting" || status === "reconnecting" ? (
          <div style={styles.notice}>
            Connecting to your wallet...
          </div>
        ) : isConnected && address ? (
          <div style={styles.grid}>
            <AccountWins address={address ?? undefined} />
            <AccountTickets
              address={address ?? undefined}
              prefetchedVaults={vaults}
              prefetchedTicketVaults={ticketVaults}
              loadingOverride={vaultsLoading || ticketLoading}
            />
            <AccountRewards
              address={address ?? undefined}
              ticketVaults={ticketVaults}
              promotionsByVault={promotionsByVault}
              claimableByVault={claimableByVault}
              loading={rewardsLoading}
            />
          </div>
        ) : (
          <div style={styles.notice}>
            Connect your wallet to see personalized stats.
          </div>
        )}
      </div>
    </Layout>
  );
};

const styles: any = {
  page: {
    padding: "24px",
    color: "#ffffff",
    minHeight: "100vh",
  },
  pageHeader: {
    marginBottom: "18px",
  },
  title: {
    margin: 0,
    fontSize: "28px",
  },
  subtitle: {
    margin: "6px 0 0 0",
    color: "#9fb6cb",
  },
  notice: {
    backgroundColor: "#132337",
    border: "1px solid #28405c",
    borderRadius: "12px",
    padding: "12px 14px",
    marginBottom: "14px",
    color: "#cdd7e4",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "16px",
  },
  placeholderCard: {
    backgroundColor: "#0b1a2a",
    border: "1px solid #24364c",
    borderRadius: "12px",
    padding: "18px",
  },
  cardHeader: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    marginBottom: "12px",
  },
  cardTitle: {
    margin: 0,
    fontSize: "20px",
  },
  cardCaption: {
    color: "#96b0c8",
    fontSize: "13px",
  },
  bodyText: {
    color: "#cdd7e4",
    margin: 0,
  },
};

export default AccountPage;


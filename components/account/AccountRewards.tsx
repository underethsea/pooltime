import React, { useState, useEffect } from "react";
import {
  useAccount,
  useChainId,
  useSwitchChain,
  useWriteContract,
  useSendCalls,
  useCallsStatus,
  useCapabilities,
} from "wagmi";
import { encodeFunctionData } from "viem";
import IconDisplay from "../icons";
import { GetChainName, GetChainIcon } from "../../utils/getChain";
import { VaultData } from "../../utils/vaultHelpers";
import { WHITELIST_REWARDS } from "../../constants/address";
import { CropDecimals, NumberWithCommas } from "../../utils/tokenMaths";
import Image from "next/image";
import { ADDRESS, ABI } from "../../constants";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type Promotion = {
  token: string;
  tokenDecimals: number;
  price: string;
  tokensPerSecond: string;
};

interface AccountRewardsProps {
  address?: string;
  ticketVaults: VaultData[];
  promotionsByVault: Record<string, Promotion[]>;
  claimableByVault?: Record<
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
  >;
  loading?: boolean;
}

const AccountRewards: React.FC<AccountRewardsProps> = ({
  address,
  ticketVaults,
  promotionsByVault,
  claimableByVault = {},
  loading = false,
}) => {
  const { address: connectedAddress } = useAccount();
  const chainIdConnected = useChainId();
  const { switchChain } = useSwitchChain();
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [batchClaimingChain, setBatchClaimingChain] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  const activeAddress = address || connectedAddress;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { data: capabilities } = useCapabilities({
    account: activeAddress,
  });

  const { writeContract: claimWrite } = useWriteContract({
    mutation: {
      onSuccess: () => {
        toast("Claiming!", {
          position: toast.POSITION.BOTTOM_LEFT,
        });
      },
    },
  });

  const { sendCalls, data: batchCallData } = useSendCalls();

  const canBatchTransactions = (chainId: number) => {
    return (
      capabilities?.[chainId]?.atomic?.status === "ready" ||
      capabilities?.[chainId]?.atomic?.status === "supported"
    );
  };

  const { data: callStatusData } = useCallsStatus({
    id: batchCallData?.id?.id || "",
    query: {
      enabled: !!batchCallData?.id,
      refetchInterval: (data) =>
        data?.state?.data?.status === "success" || data?.state?.data?.status === "failed"
          ? false
          : 1000,
    },
  });

  useEffect(() => {
    if (callStatusData?.status === "success") {
      toast("All claims successful!", {
        position: toast.POSITION.BOTTOM_LEFT,
      });
      setBatchClaimingChain(null);
    } else if (callStatusData?.status === "failed") {
      toast("Batch claim failed", {
        position: toast.POSITION.BOTTOM_LEFT,
      });
      setBatchClaimingChain(null);
    }
  }, [callStatusData]);

  // Map token address to symbol when possible
  const tokenSymbolMap: Record<string, { symbol: string; icon?: string }> = Object.values(
    WHITELIST_REWARDS
  )
    .flat()
    .reduce((acc, tokenObj) => {
      acc[tokenObj.TOKEN.toLowerCase()] = {
        symbol: tokenObj.SYMBOL,
        icon: tokenObj.ICON,
      };
      return acc;
    }, {} as Record<string, { symbol: string; icon?: string }>);

  const chainGroups = Object.values(
    ticketVaults.reduce((acc: any, vault) => {
      const claims = claimableByVault[vault.vault.toLowerCase()] || [];
      if (claims.length === 0) return acc;
      const chainId = vault.c;
      if (!acc[chainId]) {
        acc[chainId] = {
          chainId,
          chainName: GetChainName(chainId),
          chainIcon: GetChainIcon(chainId),
          vaults: [] as any[],
        };
      }
      acc[chainId].vaults.push({ ...vault, claims });
      return acc;
    }, {})
  );

  const handleClaim = (reward: any, vaultAddress: string) => {
    if (!activeAddress) return;
    const chainName = GetChainName(reward.chainId);
    const targetChainId = reward.chainId;

    const claimPayload = reward.meta
      ? {
          address: ADDRESS[chainName].METAREWARDS as any,
          abi: ABI.METAREWARDS,
          functionName: "claimRewards",
          args: [
            vaultAddress,
            activeAddress,
            reward.promotionId,
            reward.completedEpochs,
          ],
        }
      : {
          address: ADDRESS[chainName].TWABREWARDS as any,
          abi: ABI.TWABREWARDS,
          functionName: "claimRewards",
          args: [activeAddress, reward.promotionId, reward.completedEpochs],
        };

    const doClaim = () => {
      setClaimingId(`${vaultAddress}-${reward.promotionId}-${reward.token}`);
      claimWrite(claimPayload as any, {
        onSettled: () => setClaimingId(null),
        onError: () => setClaimingId(null),
      });
    };

    if (chainIdConnected !== targetChainId) {
      switchChain?.({ chainId: targetChainId });
      return;
    }

    doClaim();
  };

  const handleBatchClaim = (chainId: number, chainName: string) => {
    if (!activeAddress || !sendCalls) return;

    if (!canBatchTransactions(chainId)) {
      toast("Batch transactions not supported by your wallet", {
        position: toast.POSITION.BOTTOM_LEFT,
      });
      return;
    }

    if (chainIdConnected !== chainId) {
      switchChain?.({ chainId });
      return;
    }

    // Collect all claims for this chain
    const allClaims: Array<{ reward: any; vaultAddress: string }> = [];
    chainGroups.forEach((group: any) => {
      if (group.chainId === chainId) {
        group.vaults.forEach((vault: any) => {
          vault.claims.forEach((reward: any) => {
            allClaims.push({ reward, vaultAddress: vault.vault });
          });
        });
      }
    });

    if (allClaims.length === 0) return;

    try {
      setBatchClaimingChain(chainId);
      const calls = allClaims.map(({ reward, vaultAddress }) => {
        const chainName = GetChainName(reward.chainId);
        if (reward.meta) {
          return {
            to: ADDRESS[chainName].METAREWARDS as `0x${string}`,
            data: encodeFunctionData({
              abi: ABI.METAREWARDS,
              functionName: "claimRewards",
              args: [
                vaultAddress,
                activeAddress,
                reward.promotionId,
                reward.completedEpochs,
              ],
            }),
          };
        } else {
          return {
            to: ADDRESS[chainName].TWABREWARDS as `0x${string}`,
            data: encodeFunctionData({
              abi: ABI.TWABREWARDS,
              functionName: "claimRewards",
              args: [activeAddress, reward.promotionId, reward.completedEpochs],
            }),
          };
        }
      });

      sendCalls({
        account: activeAddress as `0x${string}`,
        chainId: chainId,
        calls: calls,
      });

      toast(`Batching ${allClaims.length} claims...`, {
        position: toast.POSITION.BOTTOM_LEFT,
      });
    } catch (error) {
      console.error("Batch claim error:", error);
      toast("Batch claim failed", {
        position: toast.POSITION.BOTTOM_LEFT,
      });
      setBatchClaimingChain(null);
    }
  };

  const renderBody = () => {
    if (!activeAddress) {
      return <p style={styles.bodyText}>Connect a wallet to view rewards.</p>;
    }

    if (loading) {
      return <p style={styles.bodyText}>Loading rewards...</p>;
    }

    if (chainGroups.length === 0) {
      return (
        <p style={styles.bodyText}>No active rewards on your positions yet.</p>
      );
    }

    return (
      <div style={styles.list}>
        {chainGroups.map((group: any) => {
          const totalClaims = group.vaults.reduce(
            (sum: number, vault: any) => sum + vault.claims.length,
            0
          );
          const canBatchClaim = totalClaims > 1 && canBatchTransactions(group.chainId);
          const isBatchClaiming = batchClaimingChain === group.chainId;

          return (
            <div key={group.chainId} style={styles.chainSection}>
              <div style={styles.chainHeader}>
                {group.chainIcon && (
                  <Image
                    src={group.chainIcon}
                    alt={group.chainName}
                    width={18}
                    height={18}
                    style={{ borderRadius: "50%" }}
                  />
                )}
                <span>{group.chainName}</span>
                {canBatchClaim && (
                  <button
                    style={{
                      ...styles.claimAllButton,
                      cursor: isBatchClaiming ? "wait" : "pointer",
                      opacity: isBatchClaiming ? 0.7 : 1,
                    }}
                    disabled={isBatchClaiming}
                    onClick={() => handleBatchClaim(group.chainId, group.chainName)}
                  >
                    {chainIdConnected !== group.chainId
                      ? "Switch Chain"
                      : isBatchClaiming
                      ? "Claiming All..."
                      : `Claim All (${totalClaims})`}
                  </button>
                )}
              </div>
            {group.vaults.map((vault: any) => (
              <div
                key={`${vault.vault}-${vault.c}`}
                style={styles.row}>
                <div style={styles.left}>
                  <IconDisplay name={vault.assetSymbol} size={22} />
                  <div style={styles.vaultName}>
                    <span>{vault.name}</span>
                  </div>
                </div>
                <div style={styles.claimables}>
                  {vault.claims.map((reward: any, idx: number) => {
                    const tokenMeta =
                      tokenSymbolMap[reward.token.toLowerCase()] || {};
                    const icon = tokenMeta.icon;
                    const symbol =
                      tokenMeta.symbol ||
                      `${reward.token.slice(0, 4)}...${reward.token.slice(-4)}`;
                    const claimKey = `${vault.vault}-${reward.promotionId}-${reward.token}`;
                    const isClaiming = claimingId === claimKey;
                    return (
                      <div key={idx} style={{
                        ...styles.claimCard,
                        padding: isMobile ? "6px 8px" : "8px 10px",
                      }}>
                        <div style={{
                          ...styles.claimLine,
                          gap: isMobile ? "8px" : "12px",
                        }}>
                          <div style={{
                            ...styles.claimLeft,
                            flexWrap: isMobile ? "nowrap" : "wrap",
                            gap: isMobile ? "4px" : "8px",
                          }}>
                            {icon && (
                              <Image
                                src={icon}
                                alt={symbol}
                                width={isMobile ? 12 : 16}
                                height={isMobile ? 12 : 16}
                                style={{ borderRadius: "4px", flexShrink: 0 }}
                              />
                            )}
                            <span style={{
                              ...styles.claimText,
                              fontSize: isMobile ? "12px" : "inherit",
                            }}>
                              {NumberWithCommas(CropDecimals(reward.amount))}
                            </span>
                          </div>
                          <button
                            style={{
                              ...styles.claimAction,
                              cursor: isClaiming ? "wait" : "pointer",
                              opacity: isClaiming ? 0.7 : 1,
                              padding: isMobile ? "4px 8px" : "6px 10px",
                              fontSize: isMobile ? "11px" : "12px",
                              flexShrink: 0,
                            }}
                            disabled={isClaiming}
                            onClick={() => handleClaim(reward, vault.vault)}
                          >
                            {chainIdConnected !== reward.chainId
                              ? "Switch Chain"
                              : isClaiming
                              ? "Claiming..."
                              : "Claim Now"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h2 style={styles.title}>Rewards</h2>
        <span style={styles.caption}>Active incentives on your tickets</span>
      </div>
      {renderBody()}
    </div>
  );
};

const styles: any = {
  card: {
    backgroundColor: "#0b1a2a",
    border: "1px solid #24364c",
    borderRadius: "12px",
    padding: "18px",
    color: "#ffffff",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    marginBottom: "12px",
  },
  title: {
    margin: 0,
    fontSize: "20px",
  },
  caption: {
    color: "#96b0c8",
    fontSize: "13px",
  },
  bodyText: {
    color: "#cdd7e4",
    margin: 0,
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#112538",
    border: "1px solid #213349",
    borderRadius: "10px",
    padding: "10px 12px",
    cursor: "pointer",
  },
  left: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  vaultName: {
    display: "flex",
    flexDirection: "column",
    fontSize: "14px",
  },
  chainName: {
    color: "#7ca1c2",
    fontSize: "12px",
  },
  claimables: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    alignItems: "flex-end",
  },
  chainSection: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  chainHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: 700,
    color: "#d6e7f5",
    padding: "4px 0",
  },
  claimCard: {
    backgroundColor: "#112538",
    border: "1px solid #213349",
    borderRadius: "10px",
    padding: "8px 10px",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    alignItems: "stretch",
    cursor: "pointer",
  },
  claimLine: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "12px",
    width: "100%",
  },
  claimLeft: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: 600,
    color: "#e8f4ff",
  },
  claimText: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
  },
  chainPill: {
    backgroundColor: "#1c3550",
    color: "#b7d3ef",
    padding: "4px 8px",
    borderRadius: "8px",
    fontSize: "12px",
    letterSpacing: "0.01em",
  },
  claimAction: {
    padding: "6px 10px",
    backgroundColor: "#1f4b6e",
    color: "#e8f4ff",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: 600,
    border: "1px solid #2f6b99",
    textDecoration: "none",
  },
  claimAllButton: {
    marginLeft: "auto",
    padding: "6px 12px",
    backgroundColor: "#2d5a7e",
    color: "#e8f4ff",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: 600,
    border: "1px solid #3d6a9e",
    textDecoration: "none",
  },
};

export default AccountRewards;


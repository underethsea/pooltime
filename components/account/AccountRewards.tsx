import React, { useState, useEffect, useMemo } from "react";
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
import { useOverview } from "../contextOverview";
import { useRewards } from "../contextRewards";

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
  canClaim?: boolean;
  isModal?: boolean;
  isMobile?: boolean;
}

const AccountRewards: React.FC<AccountRewardsProps> = ({
  address,
  ticketVaults,
  promotionsByVault,
  claimableByVault = {},
  loading = false,
  canClaim = true,
  isModal = false,
  isMobile: isMobileProp,
}) => {
  const { address: connectedAddress } = useAccount();
  const chainIdConnected = useChainId();
  const { switchChain } = useSwitchChain();
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [batchClaimingChain, setBatchClaimingChain] = useState<number | null>(null);
  const [pendingClaim, setPendingClaim] = useState<{ reward: any; vaultAddress: string; targetChainId: number } | null>(null);
  const [pendingBatchClaim, setPendingBatchClaim] = useState<{ chainId: number; chainName: string } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [minLoadingTimePassed, setMinLoadingTimePassed] = useState(false);
  const { overview } = useOverview();
  const { invalidateRewards } = useRewards();
  
  const activeAddress = address || connectedAddress;
  
  // Use prop if provided, otherwise use internal state
  const mobileState = isMobileProp !== undefined ? isMobileProp : isMobile;

  // Ensure skeleton shows for at least 2 seconds
  useEffect(() => {
    if (loading) {
      setMinLoadingTimePassed(false);
      const timer = setTimeout(() => {
        setMinLoadingTimePassed(true);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setMinLoadingTimePassed(true);
    }
  }, [loading]);

  useEffect(() => {
    if (isMobileProp === undefined) {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
    }
  }, [isMobileProp]);

  const { data: capabilities } = useCapabilities({
    account: activeAddress as `0x${string}` | undefined,
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

  const { sendCalls, data: batchCallId } = useSendCalls();

  const canBatchTransactions = (chainId: number) => {
    return (
      capabilities?.[chainId]?.atomic?.status === "ready" ||
      capabilities?.[chainId]?.atomic?.status === "supported"
    );
  };

  const { data: callStatusData } = useCallsStatus({
    id: batchCallId?.id || "",
    query: {
      enabled: !!batchCallId,
      refetchInterval: (data) =>
        data?.state?.data?.status === "success" || data?.state?.data?.status === "failure"
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
      setPendingBatchClaim(null);
      // Invalidate cache to refresh rewards
      if (activeAddress) {
        invalidateRewards(activeAddress);
      }
    } else if (callStatusData?.status === "failure") {
      toast("Batch claim failed", {
        position: toast.POSITION.BOTTOM_LEFT,
      });
      setBatchClaimingChain(null);
      setPendingBatchClaim(null);
    }
  }, [callStatusData, activeAddress, invalidateRewards]);

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

  const executeClaim = (reward: any, vaultAddress: string) => {
    if (!activeAddress || !canClaim) return;
    const chainName = GetChainName(reward.chainId);
    
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

      setClaimingId(`${vaultAddress}-${reward.promotionId}-${reward.token}`);
      claimWrite(claimPayload as any, {
        onSuccess: () => {
          // Invalidate cache to refresh rewards after successful claim
          if (activeAddress) {
            invalidateRewards(activeAddress);
          }
        },
        onSettled: () => {
          setClaimingId(null);
          setPendingClaim(null);
        },
        onError: () => {
          setClaimingId(null);
          setPendingClaim(null);
        },
      });
  };

  const handleClaim = (reward: any, vaultAddress: string) => {
    if (!activeAddress || !canClaim) return;
    const targetChainId = reward.chainId;

    // If on wrong chain, switch chain first and store pending claim
    if (chainIdConnected !== targetChainId) {
      setPendingClaim({ reward, vaultAddress, targetChainId });
      switchChain?.({ chainId: targetChainId });
      return;
    }

    // Otherwise, proceed with claim immediately
    executeClaim(reward, vaultAddress);
  };

  const executeBatchClaim = (chainId: number, chainName: string) => {
    if (!activeAddress || !sendCalls || !canClaim) return;

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
      setPendingBatchClaim(null);
    }
  };

  const handleBatchClaim = (chainId: number, chainName: string) => {
    if (!activeAddress || !sendCalls || !canClaim) return;

    if (!canBatchTransactions(chainId)) {
      toast("Batch transactions not supported by your wallet", {
        position: toast.POSITION.BOTTOM_LEFT,
      });
      return;
    }

    if (chainIdConnected !== chainId) {
      setPendingBatchClaim({ chainId, chainName });
      switchChain?.({ chainId });
      return;
    }

    executeBatchClaim(chainId, chainName);
  };

  // Auto-execute pending claim after chain switch
  useEffect(() => {
    if (pendingClaim && chainIdConnected === pendingClaim.targetChainId && !claimingId) {
      // Chain has switched, execute the claim
      executeClaim(pendingClaim.reward, pendingClaim.vaultAddress);
    }
  }, [chainIdConnected, pendingClaim, claimingId]);

  // Auto-execute pending batch claim after chain switch
  useEffect(() => {
    if (pendingBatchClaim && chainIdConnected === pendingBatchClaim.chainId && !batchClaimingChain) {
      // Chain has switched, execute the batch claim
      executeBatchClaim(pendingBatchClaim.chainId, pendingBatchClaim.chainName);
    }
  }, [chainIdConnected, pendingBatchClaim, batchClaimingChain]);

  const renderBody = () => {
    if (!activeAddress) {
      return <p style={{
        ...styles.bodyText,
        ...(isModal ? styles.bodyTextModal : {}),
      }}>Connect a wallet to view rewards.</p>;
    }

    if (loading || !minLoadingTimePassed) {
      return (
        <div style={{ width: '100%', padding: isModal ? '0' : '8px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="skeleton-item" style={{ width: '100%', height: '20px' }}></div>
          <div className="skeleton-item" style={{ width: '100%', height: '20px' }}></div>
          <div className="skeleton-item" style={{ width: '100%', height: '20px' }}></div>
        </div>
      );
    }

    if (chainGroups.length === 0) {
      return (
        <p style={{
          ...styles.bodyText,
          ...(isModal ? styles.bodyTextModal : {}),
        }}>No active rewards on your positions yet.</p>
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
              <div style={{
                ...styles.chainHeader,
                ...(isModal ? styles.chainHeaderModal : {}),
              }}>
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
                {canBatchClaim && canClaim && (
                  <button
                    style={{
                      ...styles.claimAllButton,
                      cursor: isBatchClaiming ? "wait" : "pointer",
                      opacity: isBatchClaiming ? 0.7 : 1,
                    }}
                    disabled={isBatchClaiming}
                    onClick={() => handleBatchClaim(group.chainId, group.chainName)}
                  >
                    {isBatchClaiming
                      ? "Claiming All..."
                      : `Claim All (${totalClaims})`}
                  </button>
                )}
              </div>
              <div className="vault-table-body">
            {group.vaults.map((vault: any) => (
              <div
                key={`${vault.vault}-${vault.c}`}
                className="vault-row"
                style={{ 
                  gridTemplateColumns: "1fr auto", 
                  gap: mobileState ? "12px" : "16px", 
                  alignItems: "center",
                  ...(isModal ? { backgroundColor: "transparent", boxShadow: "none", padding: mobileState ? "12px 0" : "8px 0" } : {})
                }}>
                <div className="vault-cell vault-left-align" style={styles.rewardCell}>
                  <div style={styles.left}>
                    <IconDisplay name={vault.assetSymbol} size={mobileState ? 18 : 22} />
                    <div style={{
                      ...styles.vaultName,
                      ...(isModal ? styles.vaultNameModal : {}),
                    }}>
                      <span style={{ 
                        overflow: "hidden", 
                        textOverflow: "ellipsis", 
                        whiteSpace: "nowrap",
                        display: "block",
                        width: "100%"
                      }}>{vault.name}</span>
                    </div>
                  </div>
                </div>
                <div className="vault-cell vault-deposits-tvl" style={styles.rewardCellRight}>
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
                          ...styles.claimLine,
                          ...(isModal ? styles.claimLineModal : {}),
                          gap: mobileState ? "8px" : "14px",
                          marginBottom: idx < vault.claims.length - 1 ? "8px" : "0",
                        }}>
                          <div style={{
                            ...styles.claimLeft,
                            flexWrap: "nowrap",
                            gap: mobileState ? "4px" : "8px",
                          }}>
                            {icon && (
                              <Image
                                src={icon}
                                alt={symbol}
                                width={mobileState ? 14 : 16}
                                height={mobileState ? 14 : 16}
                                style={{ borderRadius: "4px", flexShrink: 0 }}
                              />
                            )}
                              <span style={{
                                ...styles.claimText,
                                fontSize: mobileState ? "14px" : "19px",
                                ...(isModal ? styles.claimTextModal : {}),
                              }}>
                                {NumberWithCommas(CropDecimals(reward.amount))}
                              </span>
                          </div>
                          <button
                            style={{
                              ...styles.claimAction,
                              cursor: isClaiming || !canClaim ? "not-allowed" : "pointer",
                              opacity: isClaiming || !canClaim ? 0.5 : 1,
                              padding: mobileState ? "4px 8px" : "6px 10px",
                              flexShrink: 0,
                            }}
                            disabled={isClaiming || !canClaim}
                            onClick={() => handleClaim(reward, vault.vault)}
                            title={!canClaim ? "Connect with this address to claim" : undefined}
                          >
                            {isClaiming ? "Claiming..." : "Claim"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{
      ...styles.card,
      ...(isModal ? styles.cardModal : {}),
    }}>
      <div style={{
        ...styles.header,
        ...(isModal && mobileState ? styles.headerModalMobile : {}),
      }}>
        <div style={{
          ...styles.titleRow,
              ...(isModal && mobileState ? styles.titleRowModalMobile : {}),
        }}>
          <div>
            <h2 style={{
              ...styles.title,
              ...(isModal ? styles.titleModal : {}),
              ...(isModal && mobileState ? styles.titleModalMobile : {}),
            }}>Rewards</h2>
            {!mobileState && (
              <span style={{
                ...styles.caption,
                ...(isModal ? styles.captionModal : {}),
              }}></span>
            )}
          </div>
          {totalClaimableValue > 0 && (
            <div style={{
              ...styles.totalValue,
              alignItems: mobileState ? "flex-start" : "flex-end",
              ...(isModal && mobileState ? styles.totalValueModalMobile : {}),
            }}>
              <span style={{
                ...styles.totalLabel,
                ...(isModal ? styles.totalLabelModal : {}),
                ...(isModal && mobileState ? styles.totalLabelModalMobile : {}),
              }}>Total Claimable:</span>
              <span style={{
                ...styles.totalAmount,
                fontSize: isMobile ? "16px" : "20px",
                ...(isModal ? styles.totalAmountModal : {}),
                ...(isModal && isMobile ? styles.totalAmountModalMobile : {}),
              }}>
                ${NumberWithCommas(CropDecimals(totalClaimableValue.toFixed(2)))}
              </span>
            </div>
          )}
        </div>
      </div>
      {renderBody()}
    </div>
  );
};

const styles: any = {
  card: {
    backgroundColor: "#ffffff",
    border: "1px solid #ebebeb",
    borderRadius: "12px",
    padding: "18px",
    color: "#1a405d",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    marginBottom: "12px",
  },
  titleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
  },
  totalValue: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "2px",
  },
  totalLabel: {
    fontSize: "12px",
    color: "#7b68c4",
  },
  totalAmount: {
    fontSize: "20px",
    fontWeight: 700,
    color: "#1a405d",
  },
  title: {
    margin: 0,
    fontSize: "19px",
    color: "#1a405d",
    fontWeight: 600,
  },
  caption: {
    color: "#7b68c4",
    fontSize: "14px",
  },
  bodyText: {
    color: "#1a405d",
    margin: 0,
    fontSize: "19px",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  rewardCell: {
    display: "flex",
    alignItems: "center",
    minWidth: 0,
    overflow: "hidden",
  },
  rewardCellRight: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    width: "auto",
    minWidth: "fit-content",
    flexShrink: 0,
  },
  left: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: 0,
    flex: 1,
    overflow: "hidden",
  },
  vaultName: {
    display: "flex",
    flexDirection: "column",
    fontSize: "19px",
    color: "#1a405d",
    minWidth: 0,
    flex: 1,
    overflow: "hidden",
  },
  chainName: {
    color: "#7b68c4",
    fontSize: "14px",
  },
  claimables: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    alignItems: "flex-end",
    width: "auto",
    maxWidth: "none",
    minWidth: "fit-content",
    flexShrink: 0,
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
    color: "#1a405d",
    padding: "4px 0",
    fontSize: "19px",
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
    color: "#1a405d",
    fontSize: "19px",
    flexShrink: 0,
  },
  claimText: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    whiteSpace: "nowrap",
    overflow: "visible",
  },
  chainPill: {
    backgroundColor: "#f7f7f7",
    color: "#7b68c4",
    padding: "4px 8px",
    borderRadius: "8px",
    fontSize: "14px",
    letterSpacing: "0.01em",
  },
  claimAction: {
    padding: "6px 10px",
    backgroundColor: "#7b68c4",
    color: "#ffffff",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 600,
    border: "none",
    textDecoration: "none",
  },
  claimAllButton: {
    marginLeft: "auto",
    marginRight: "0px",
    padding: "6px 8px",
    backgroundColor: "#7b68c4",
    color: "#ffffff",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 600,
    border: "none",
    textDecoration: "none",
  },
  cardModal: {
    backgroundColor: "transparent",
    border: "none",
    padding: "0",
  },
  claimLineModal: {
    backgroundColor: "transparent",
  },
  titleModal: {
    color: "white",
    fontSize: "23px",
  },
  captionModal: {
    color: "white",
  },
  totalLabelModal: {
    color: "white",
  },
  totalAmountModal: {
    color: "white",
  },
  bodyTextModal: {
    color: "white",
  },
  vaultNameModal: {
    color: "white",
  },
  chainHeaderModal: {
    color: "white",
  },
  claimTextModal: {
    color: "white",
  },
  headerModalMobile: {
    paddingTop: "0",
    marginBottom: "16px",
  },
  titleRowModalMobile: {
    flexDirection: "column",
    gap: "12px",
    alignItems: "flex-start",
  },
  titleModalMobile: {
    fontSize: "20px",
    marginBottom: "4px",
  },
  totalValueModalMobile: {
    alignItems: "flex-start",
    width: "100%",
  },
  totalLabelModalMobile: {
    fontSize: "14px",
  },
  totalAmountModalMobile: {
    fontSize: "18px",
  },
  rewardCellModalMobile: {
    width: "100%",
  },
  rewardCellRightModalMobile: {
    width: "100%",
    justifyContent: "flex-start",
  },
  claimablesModalMobile: {
    width: "100%",
    alignItems: "flex-start",
  },
  claimLineModalMobile: {
    flexDirection: "column",
    alignItems: "flex-start",
    width: "100%",
    gap: "8px",
  },
  claimLeftModalMobile: {
    width: "100%",
  },
  claimActionModalMobile: {
    width: "100%",
    justifyContent: "center",
  },
  vaultNameModalMobile: {
    fontSize: "16px",
  },
};

export default AccountRewards;


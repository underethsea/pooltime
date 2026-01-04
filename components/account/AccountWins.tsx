import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { ADDRESS } from "../../constants";
import { GetChainName, GetChainIcon } from "../../utils/getChain";
import IconDisplay from "../icons";
import PrizeValue from "../prizeValue";
import PrizeValueIcon from "../prizeValueIcon";
import { timeAgo, getMidDrawTime } from "../winsListModalLeaderboard";
import { useOverview } from "../contextOverview";

interface AggregateWin {
  network: number;
  draw: number;
  totalPayout: string;
  tiers: number[];
  prizes: number;
  claim_time: string;
  vault: string;
}

interface AccountWinsProps {
  address?: string;
}

function getVaultName(vaultAddress: string, vaults: any[]) {
  const vault = vaults.find(
    (v) => v.vault.toLowerCase() === vaultAddress.toLowerCase()
  );
  return vault ? vault.name : "";
}

const AccountWins: React.FC<AccountWinsProps> = ({ address: addressProp }) => {
  const { address: connectedAddress } = useAccount();
  const address = addressProp || connectedAddress;
  const { overview } = useOverview();

  const [wins, setWins] = useState<AggregateWin[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [vaults, setVaults] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const winsPerPage = 10;

  useEffect(() => {
    const fetchVaults = async () => {
      try {
        const response = await fetch("https://poolexplorer.xyz/vaults");
        const data = await response.json();
        setVaults(data);
      } catch (error) {
        console.error("Error fetching vault data:", error);
      }
    };

    fetchVaults();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchWins = async () => {
      if (!address) {
        setWins([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          "https://poolexplorer.xyz/player-claims?address=" + address
        );
        let fetchedPlayer = await response.json();

        const allPrizePools = Object.values(ADDRESS).map((chain) =>
          chain.PRIZEPOOL.toLowerCase()
        );

        fetchedPlayer = fetchedPlayer.filter((player: any) =>
          allPrizePools.includes(player.prizepool.toLowerCase())
        );

        fetchedPlayer = fetchedPlayer.filter(
          (player: any) => player.payout !== "0"
        );

        const aggregatedWins: { [key: string]: AggregateWin } = {};
        fetchedPlayer.forEach((win: any) => {
          const key = `${win.network}-${win.draw}`;
          if (!aggregatedWins[key]) {
            aggregatedWins[key] = {
              network: win.network,
              draw: win.draw,
              totalPayout: "0",
              vault: win.vault,
              tiers: [],
              prizes: 0,
              claim_time: win.claim_time,
            };
          }

          aggregatedWins[key].totalPayout = (
            BigInt(aggregatedWins[key].totalPayout) + BigInt(win.payout)
          ).toString();

          if (!aggregatedWins[key].tiers.includes(win.tier)) {
            aggregatedWins[key].tiers.push(win.tier);
            aggregatedWins[key].tiers.sort((a, b) => a - b);
          }

          aggregatedWins[key].prizes += 1;

          const winClaimTime = new Date(win.claim_time).getTime();
          const aggregatedClaimTime = new Date(
            aggregatedWins[key].claim_time
          ).getTime();
          if (winClaimTime > aggregatedClaimTime) {
            aggregatedWins[key].claim_time = new Date(winClaimTime).toISOString();
          }
        });

        const flattenedWins: AggregateWin[] = Object.values(aggregatedWins)
          .map((win) => ({
            ...win,
            claim_time: new Date(win.claim_time).toISOString(),
          }))
          .sort(
            (a: AggregateWin, b: AggregateWin) => {
              // Sort by getMidDrawTime to match wins modal
              const timeA = getMidDrawTime(a.network, a.draw).getTime();
              const timeB = getMidDrawTime(b.network, b.draw).getTime();
              return timeB - timeA;
            }
          );

        if (!cancelled) {
          setWins(flattenedWins);
          setCurrentPage(1); // Reset to first page when wins change
        }
      } catch (error) {
        console.error("Error fetching wins:", error);
        if (!cancelled) {
          setWins([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchWins();

    return () => {
      cancelled = true;
    };
  }, [address]);

  const renderBody = () => {
    if (!address) {
      return <p style={styles.bodyText}>Connect a wallet to see wins.</p>;
    }

    if (loading) {
      return (
        <div className="vault-table-body">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="vault-row" style={{ gridTemplateColumns: "1fr auto" }}>
              <div className="vault-cell vault-left-align">
                <div className="skeleton-item" style={{ width: '70%', height: '20px' }}></div>
              </div>
              <div className="vault-cell vault-deposits-tvl">
                <div className="skeleton-item" style={{ width: '100px', height: '20px', marginLeft: 'auto' }}></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (wins.length === 0) {
      return <p style={styles.bodyText}>No wins yet.</p>;
    }

    // Calculate total won properly with chainname for each win, converting non-WETH to ETH equivalent
    const totalAmountWon = wins.reduce((acc: bigint, win: AggregateWin) => {
      const chainName = GetChainName(win.network);
      const prizeToken = ADDRESS[chainName]?.PRIZETOKEN || { SYMBOL: "weth" };
      
      let payout = BigInt(win.totalPayout);
      
      if (prizeToken.SYMBOL.toLowerCase() !== "weth" && overview?.prices?.geckos) {
        const ethPrice = overview.prices.geckos["ethereum"] || 1;
        const prizeTokenPrice = overview.prices.geckos[prizeToken.GECKO];
        
        if (prizeTokenPrice && ethPrice) {
          // Convert non-WETH prize value to ETH equivalent
          payout = (payout * BigInt(Math.floor((prizeTokenPrice / ethPrice) * 1e18))) / BigInt(1e18);
        }
      }

      return acc + payout;
    }, BigInt(0));
    
    const chainName = wins.length > 0 ? GetChainName(wins[0].network) : undefined;

    // Pagination calculations
    const totalPages = Math.ceil(wins.length / winsPerPage);
    const startIndex = (currentPage - 1) * winsPerPage;
    const endIndex = startIndex + winsPerPage;
    const currentWins = wins.slice(startIndex, endIndex);

    const handlePreviousPage = () => {
      if (currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    };

    const handleNextPage = () => {
      if (currentPage < totalPages) {
        setCurrentPage(currentPage + 1);
      }
    };

    return (
      <div style={styles.list}>
        <div style={styles.summaryContainer}>
          <div style={styles.summaryBox}>
            <span style={styles.summaryLabel}>Total wins</span>
            <span style={styles.summaryValue}>{wins.length}</span>
          </div>
          <div style={styles.summaryBox}>
            <span style={styles.summaryLabel}>Total won</span>
            <span style={styles.summaryValueTotal}>
              <PrizeValueIcon size={16} />
              <PrizeValue amount={totalAmountWon} size={16} chainname={chainName} />
            </span>
          </div>
        </div>
        <div className="vault-table-body">
          {currentWins.map((win, idx) => {
            const winChainName = GetChainName(win.network);
            const vaultName = getVaultName(win.vault, vaults) || winChainName;
            return (
              <div key={idx} className="vault-row" style={styles.winRow}>
                <div className="vault-cell vault-left-align" style={styles.winCell}>
                  <div style={styles.winLeft}>
                    <IconDisplay
                      name={vaultName}
                      size={22}
                      fallbackSrc={GetChainIcon(win.network)}
                    />
                    <div style={styles.winMeta}>
                      <span style={styles.winVault}>{vaultName}</span>
                      <span style={styles.winTime}>
                        {timeAgo(getMidDrawTime(win.network, win.draw))}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="vault-cell vault-deposits-tvl" style={styles.winCell}>
                  <div style={styles.winRight}>
                    <PrizeValueIcon size={18} chainname={winChainName} />
                    <PrizeValue amount={BigInt(win.totalPayout)} size={18} chainname={winChainName} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {wins.length > winsPerPage && (
          <div style={styles.paginationContainer}>
            <button
              style={{
                ...styles.paginationButton,
                opacity: currentPage === 1 ? 0.5 : 1,
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
              }}
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span style={styles.pageInfo}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              style={{
                ...styles.paginationButton,
                opacity: currentPage === totalPages ? 0.5 : 1,
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              }}
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h2 style={styles.title}>Wins</h2>
        <span style={styles.caption}>Your win history</span>
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
  summaryContainer: {
    display: "flex",
    gap: "10px",
    marginBottom: "10px",
  },
  summaryBox: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f7f7f7",
    border: "1px solid #ebebeb",
    borderRadius: "10px",
    padding: "12px",
    gap: "6px",
  },
  summaryRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    color: "#1a405d",
    fontSize: "19px",
  },
  summaryRowTotal: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    color: "#1a405d",
    fontSize: "19px",
    paddingRight: "10px",
  },
  summaryLabel: {
    color: "#7b68c4",
  },
  summaryValue: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontWeight: 600,
    color: "#1a405d",
  },
  summaryValueTotal: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontWeight: 600,
    color: "#1a405d",
    paddingRight: "10px",
  },
  winRow: {
    gridTemplateColumns: "1fr auto",
  },
  winCell: {
    display: "flex",
    alignItems: "center",
  },
  winLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  winMeta: {
    display: "flex",
    flexDirection: "column",
    fontSize: "19px",
  },
  winVault: {
    color: "#1a405d",
    fontWeight: 600,
  },
  winTime: {
    color: "#7b68c4",
    fontSize: "14px",
  },
  winRight: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontWeight: 600,
  },
  moreText: {
    color: "#7b68c4",
    margin: "4px 0 0 0",
    fontSize: "14px",
  },
  paginationContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    marginTop: "10px",
  },
  paginationButton: {
    padding: "6px 12px",
    backgroundColor: "#7b68c4",
    color: "#ffffff",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 600,
    border: "none",
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
  pageInfo: {
    color: "#1a405d",
    fontSize: "14px",
    fontWeight: 500,
    minWidth: "80px",
    textAlign: "center",
  },
};

export default AccountWins;


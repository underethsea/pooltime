import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { ADDRESS } from "../../constants";
import { GetChainName, GetChainIcon } from "../../utils/getChain";
import IconDisplay from "../icons";
import PrizeValue from "../prizeValue";
import PrizeValueIcon from "../prizeValueIcon";
import { timeAgo, getMidDrawTime } from "../winsListModalLeaderboard";

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

const AccountWins: React.FC<AccountWinsProps> = ({ address: addressProp }) => {
  const { address: connectedAddress } = useAccount();
  const address = addressProp || connectedAddress;

  const [wins, setWins] = useState<AggregateWin[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

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
            (a: AggregateWin, b: AggregateWin) =>
              new Date(b.claim_time).getTime() - new Date(a.claim_time).getTime()
          );

        if (!cancelled) {
          setWins(flattenedWins);
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
        <div style={styles.skeletonContainer}>
          <div style={styles.skeletonSummary}>
            <div style={styles.skeletonBar}></div>
            <div style={styles.skeletonBar}></div>
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} style={styles.skeletonRow}>
              <div style={styles.skeletonLeft}>
                <div style={styles.skeletonIcon}></div>
                <div style={styles.skeletonText}></div>
              </div>
              <div style={styles.skeletonRight}></div>
            </div>
          ))}
        </div>
      );
    }

    if (wins.length === 0) {
      return <p style={styles.bodyText}>No wins yet.</p>;
    }

    const totalAmountWon = wins.reduce(
      (acc, win) => acc + BigInt(win.totalPayout),
      BigInt(0)
    );

    return (
      <div style={styles.list}>
        <div style={styles.summary}>
          <div style={styles.summaryRow}>
            <span style={styles.summaryLabel}>Total wins</span>
            <span style={styles.summaryValue}>{wins.length}</span>
          </div>
          <div style={styles.summaryRow}>
            <span style={styles.summaryLabel}>Total won</span>
            <span style={styles.summaryValue}>
              <PrizeValueIcon size={16} />
              <PrizeValue amount={totalAmountWon} size={16} />
            </span>
          </div>
        </div>
        {wins.slice(0, 10).map((win, idx) => (
          <div key={idx} style={styles.row}>
            <div style={styles.left}>
              <IconDisplay
                name={GetChainName(win.network)}
                size={22}
                fallbackSrc={GetChainIcon(win.network)}
              />
              <div style={styles.winMeta}>
                <span style={styles.winChain}>{GetChainName(win.network)}</span>
              <span style={styles.winTime}>
                {timeAgo(getMidDrawTime(win.network, win.draw))}
              </span>
              </div>
            </div>
            <div style={styles.right}>
              <PrizeValueIcon size={18} />
              <PrizeValue amount={BigInt(win.totalPayout)} size={18} />
            </div>
          </div>
        ))}
        {wins.length > 10 && (
          <p style={styles.moreText}>Showing latest 10 wins</p>
        )}
      </div>
    );
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h2 style={styles.title}>Wins</h2>
        <span style={styles.caption}>Recent prizes you claimed</span>
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
  summary: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    backgroundColor: "#112538",
    border: "1px solid #213349",
    borderRadius: "10px",
    padding: "10px 12px",
  },
  summaryRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    color: "#d3e4f2",
    fontSize: "13px",
  },
  summaryLabel: {
    color: "#8ea8c5",
  },
  summaryValue: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontWeight: 600,
  },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#112538",
    border: "1px solid #213349",
    borderRadius: "10px",
    padding: "10px 12px",
  },
  left: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  winMeta: {
    display: "flex",
    flexDirection: "column",
    fontSize: "13px",
  },
  winChain: {
    color: "#d6e7f5",
    fontWeight: 600,
  },
  winTime: {
    color: "#8ea8c5",
    fontSize: "12px",
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontWeight: 600,
  },
  moreText: {
    color: "#8ea8c5",
    margin: "4px 0 0 0",
    fontSize: "12px",
  },
  skeletonContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  skeletonSummary: {
    display: "flex",
    gap: "20px",
    padding: "12px",
    backgroundColor: "#112538",
    borderRadius: "10px",
    marginBottom: "8px",
  },
  skeletonBar: {
    width: "100px",
    height: "16px",
    borderRadius: "4px",
    background: "linear-gradient(90deg, #2a4a5f 25%, #3a5a6f 50%, #2a4a5f 75%)",
    backgroundSize: "200% 100%",
    animation: "skeleton-loading 1.5s infinite",
  },
  skeletonRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#112538",
    border: "1px solid #213349",
    borderRadius: "10px",
    padding: "10px 12px",
  },
  skeletonLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flex: 1,
  },
  skeletonIcon: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    background: "linear-gradient(90deg, #2a4a5f 25%, #3a5a6f 50%, #2a4a5f 75%)",
    backgroundSize: "200% 100%",
    animation: "skeleton-loading 1.5s infinite",
  },
  skeletonText: {
    width: "100px",
    height: "14px",
    borderRadius: "4px",
    background: "linear-gradient(90deg, #2a4a5f 25%, #3a5a6f 50%, #2a4a5f 75%)",
    backgroundSize: "200% 100%",
    animation: "skeleton-loading 1.5s infinite",
  },
  skeletonRight: {
    width: "60px",
    height: "16px",
    borderRadius: "4px",
    background: "linear-gradient(90deg, #2a4a5f 25%, #3a5a6f 50%, #2a4a5f 75%)",
    backgroundSize: "200% 100%",
    animation: "skeleton-loading 1.5s infinite",
  },
};

export default AccountWins;


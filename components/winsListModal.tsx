import React, { useEffect, useRef, useState } from "react";
import { GetChainName } from "../utils/getChain";
import Image from "next/image";
import { ADDRESS } from "../constants";
import PrizeValueIcon from "./prizeValueIcon";
import PrizeValue from "./prizeValue";
import IconDisplay from "./icons";
import { useOverview } from './contextOverview'; // Assuming pricing context is here


function getVaultName(vaultAddress: string, vaults: any[]) {
  const vault = vaults.find(
    (v) => v.vault.toLowerCase() === vaultAddress.toLowerCase()
  );
  return vault ? vault.name : "";
}

interface AggregateWin {
  network: number;
  draw: number;
  totalPayout: string;
  tiers: number[];
  prizes: number;
}

interface WinsModalProps {
  showModal: boolean;
  onClose: () => void;
  wins: AggregateWin[];
  address: string;
}
const calculateTotalAmountWon = (flatWins: any, overview: any) => {
  return flatWins
    .reduce((acc: any, win: any) => {
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
    }, BigInt(0))
    .toString();
};


function timeAgo(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInSeconds < 60) {
    return "just now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  } else if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  } else if (diffInMonths < 1) {
    return `1m ago`;
  } else if (diffInMonths < 12) {
    return `${diffInMonths}m ago`;
  } else {
    return `${diffInYears}yr ago`;
  }
}

function getMidDrawTime(chainId: number, drawId: number) {
  if (!ADDRESS[GetChainName(chainId)]) {
    throw new Error(`Unsupported chainId: ${chainId}`);
  }

  const { FIRSTDRAWOPENEDAT, DRAWPERIODSECONDS } =
    ADDRESS[GetChainName(chainId)];

  if (drawId < 1) {
    throw new Error(`Invalid drawId: ${drawId}`);
  }

  const drawStartTime =
    FIRSTDRAWOPENEDAT +
    (drawId - 1) * DRAWPERIODSECONDS +
    DRAWPERIODSECONDS / 2;

  return new Date(drawStartTime * 1000); // Convert seconds to milliseconds and return a Date object
}

const WinsListModal: React.FC<WinsModalProps> = ({
  showModal,
  onClose,
  wins,
  address,
}) => {
  const [vaults, setVaults] = useState<any[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);
  const { overview } = useOverview();

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

  const closeModal = (e: React.MouseEvent) => {
    if (modalRef.current === e.target) {
      onClose();
    }
  };

  const sortedWins = wins.sort((a, b) => {
    const timeA = getMidDrawTime(a.network, a.draw).getTime();
    const timeB = getMidDrawTime(b.network, b.draw).getTime();
    return timeB - timeA;
  });

  const limitedWins = sortedWins;

  return showModal ? (
    <div style={styles.modalOverlay} onClick={closeModal} ref={modalRef}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={{ backgroundColor: "#030526" }}>
          <center>
            <h2>
              <span
                style={{
                  display: "inline-block",
                  verticalAlign: "middle",
                  lineHeight: "1",
                }}
              >
                <Image
                  src="/images/pttrophy.svg"
                  width={26}
                  height={40}
                  style={{ verticalAlign: "middle" }}
                  alt="trophy"
                />{" "}
              </span>
              &nbsp;&nbsp;&nbsp;{sortedWins.length} WIN
              {sortedWins.length > 1 ? "S" : ""}&nbsp;&nbsp;&nbsp;
              <div style={styles.prizeContainer}>
              <PrizeValueIcon size={26} />
              <PrizeValue
                amount={calculateTotalAmountWon(sortedWins,overview)}
                size={28}
              />
              </div>
            </h2>

            <h5 style={{ color: "#ffffff", wordWrap: "break-word", }}>

            {/* {address && `${address.slice(0, 6)}...${address.slice(address.length - 4)}`} */}

            </h5>
            <div>
              {limitedWins.map((win: any, index: any) => (
                <div key={index} style={styles.row}>
                  <div style={styles.cellLeftAlign}>
                  <span className="hidden-mobile"><span style={{ fontSize: "14px" }}>
                      {GetChainName(win.network)}{" "}
                    </span></span>
                    &nbsp;&nbsp;
                    <IconDisplay
                      name={getVaultName(win.vault, vaults)}
                      size={18}
                    />
                  </div>
                  <div style={styles.cellCenterAlign}>
                    {timeAgo(getMidDrawTime(win.network, win.draw))}
                  </div>
                  <div style={styles.cellRightAlign}>
                    <PrizeValueIcon size={19}  chainname={GetChainName(win.network)}/>
                    <PrizeValue amount={BigInt(win.totalPayout)} size={19} chainname={GetChainName(win.network)}/>
                  </div>
                </div>
              ))}
              {/* {sortedWins.length > 12 && "and more..."} */}
            </div>
          </center>
        </div>
      </div>
    </div>
  ) : null;
};

export default WinsListModal;

const styles: any = {
  prizeContainer: {
    display: "inline-flex",
    alignItems: "center",
  },
  '@media (max-width: 600px)': {
    prizeContainer: {
      flexDirection: "column",
    },
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "20px",
    alignItems: "center",
    padding: "11px 0",
    whiteSpace: "nowrap",
  },
  cell: {
    textAlign: "center",
  },
  cellLeftAlign: {
    textAlign: "left",
  },
  cellCenterAlign: {
    textAlign: "center",
  },
  cellRightAlign: {
    textAlign: "right",
  },
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
};

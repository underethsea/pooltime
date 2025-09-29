import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import PrizeValueIcon from "./prizeValueIcon";
import PrizeValue from "./prizeValue";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { GetChainName, GetChainIcon } from "../utils/getChain";
import { useOverview } from "./contextOverview";

interface TvlModalProps {
  isOpen: boolean;
  onClose: () => void;
  tvl: {
    totalTVL: BigInt;
    tvlPerChain: { [chainId: number]: number };
  };
}

const TvlModal: React.FC<TvlModalProps> = ({ isOpen, onClose, tvl }) => {
  const { overview } = useOverview();
  const [isMobile, setIsMobile] = useState(false);

  // Format pricing timestamp for display
  const pricingTimestamp = useMemo(() => {
    if (!overview?.prices?.timestamp) return null;
    try {
      const date = new Date(overview.prices.timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return null;
    }
  }, [overview?.prices?.timestamp]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  if (!isOpen) {
    return null;
  }

  const closeModal = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const sortedTvlPerChain = Object.entries(tvl.tvlPerChain).sort(
    ([, a], [, b]) => b - a
  );

  return (
    <>
      <div className="modal" onClick={closeModal}>
        <div className="modal-content">
          <div className="close-button-container">
            <button className="close-button" onClick={onClose}>
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
          <div className="prize-header">
            <span className="prize-header-title">Total Value Locked</span>
            <div>
              <PrizeValueIcon size={isMobile ? 26 : 32} />
              <PrizeValue
                amount={BigInt(Math.round(Number(tvl.totalTVL)))}
                size={isMobile ? 24 : 40}
                rounded={true}
              />
            </div>
          </div>
          <div className="grid-container">
            <div className="grid-header">
              <div></div>
              <div style={{ textAlign: "right" }}>TVL&nbsp;&nbsp;</div>
            </div>
            {sortedTvlPerChain.map(([chainId, chainTvl]) => {
              const chainName = GetChainName(Number(chainId));
              const icon = GetChainIcon(Number(chainId));
              return (
                <div key={chainId} className="grid-row">
                  <div style={{ fontSize: "14px" }}>
                    {icon && <Image src={icon} alt={chainName} width={24} height={24} />}
                    <span style={{ marginLeft: "10px" }}>{chainName}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <PrizeValueIcon
                      size={isMobile ? 18 : 24}
                      chainname={GetChainName(Number(chainId)).toUpperCase()}
                    />
                    <PrizeValue
                      amount={BigInt(chainTvl)}
                      size={isMobile ? 20 : 28}
                      rounded={true}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <style jsx>{`
        .modal {
          display: flex;
          justify-content: center;
          align-items: center;
          position: fixed;
          z-index: 5000000;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.4);
        }
        .prize-header {
          margin-bottom: 20px;
          justify-content: center;
          display: flex;
          font-size: 32px;
          align-items: center;
          flex-direction: column;
        }
        .prize-header-title {
          text-transform: uppercase;
          font-size: 18px;
          margin-bottom: 10px;
        }
        .modal-content {
          width: 620px;
          position: relative;
          background-color: #030526;
          padding: 30px;
          border: 1px solid #888;
          color: white;
          border-radius: 25px;
          border: 3px solid white;
          box-shadow: rgba(0, 0, 0, 0.2) 0px 4px 15px;
        }
        .grid-container {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 17px;
        }
        .close-button {
          display: none;
        }
        @media (max-width: 768px) {
          .modal {
            display: block;
          }
          .prize-header {
            font-size: 18px;
          }
          .prize-header-title {
            font-size: 14px;
          }
          .grid-container {
            grid-template-columns: 1fr 1.5fr;
          }
          .grid-header div {
            font-size: 13px;
          }
          .grid-row div:first-child {
            font-size: 12px;
          }
          .grid-row .prize-value {
            font-size: 22px !important;
          }
          .modal-content {
            width: 100%;
            height: 100%;
            border-radius: 0;
            border: none;
            padding-top: 60px;
            max-height: 100vh;
            overflow-y: auto;
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .modal-content::-webkit-scrollbar {
            display: none;
          }
          .close-button-container {
            position: absolute;
            top: 20px;
            right: 20px;
            z-index: 10;
          }
          .close-button {
            display: flex;
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            justify-content: flex-end;
          }
        }
        .grid-header {
          display: contents;
          font-size: 15px;
          border-bottom: 1px solid #ccc;
          padding-bottom: 10px;
          margin-bottom: 10px;
        }
        .grid-row {
          display: contents;
          padding: 10px 0;
          border-bottom: 1px solid #eee;
        }
        .grid-row div {
          padding: 5px;
        }
        .grid-row div:first-child {
          display: flex;
          align-items: center;
        }
        .grid-row div:last-child {
          text-align: right;
        }
      `}</style>
    </>
  );
};

export default TvlModal; 
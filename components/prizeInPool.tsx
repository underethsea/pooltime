import React, { useEffect, useState } from "react";
import { useOverview } from "./contextOverview";
import Image from "next/image";
import PrizeValueIcon from "./prizeValueIcon";
import PrizeValue from "./prizeValue";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";

interface PrizeData {
  [key: string]: {
    total: string;
    prizes: {
      drawPeriodSeconds: number;
      nextDrawId: number;
      numberOfTiers: number;
      prizePoolPrizeBalance: string;
      tierData: {
        tier: number;
        value: number;
        count: number;
        liquidity: number;
      }[];
    };
  };
}

const PrizeInPool: React.FC = () => {
  const [prizes, setPrizes] = useState<PrizeData>({});
  const [totalPrize, setTotalPrize] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const overviewFromContext = useOverview();

  useEffect(() => {
    const fetchPrizes = async () => {
      try {
        const response = await fetch("https://poolexplorer.xyz/overview");
        const data = await response.json();
        // console.log("prize data", data);
        const prizeData: PrizeData = data.pendingPrize;

        // Calculate total prize in Ether
        const total = Object.values(prizeData).reduce((acc, prize) => {
          return acc + parseInt(prize.total) / 1e18;
        }, 0);

        setPrizes(prizeData);
        setTotalPrize(total);
      } catch (error) {
        console.error("Error fetching prize data:", error);
      }
    };

    fetchPrizes();
  }, []);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const closeModal = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (e.target === e.currentTarget) {
      setIsModalOpen(false);
    }
  };

  // console.log("overview from", overviewFromContext);
  // Ensure overviewFromContext and ethereumPrice are defined before use
  if (
    !overviewFromContext ||
    !overviewFromContext.overview ||
    !overviewFromContext.overview.prices ||
    !overviewFromContext.overview.prices.geckos
  ) {
    return <div></div>;
  }

  const ethereumPrice = overviewFromContext.overview.prices.geckos.ethereum;
  const totalPrizeInDollars = totalPrize * ethereumPrice;

  const sortedPrizes = Object.entries(prizes).sort(
    ([, a], [, b]) => parseInt(b.total) - parseInt(a.total)
  );

  return (
    <>
      {totalPrizeInDollars > 0 && (
        <div style={{ fontSize: "22px", display: "inline-block" }}>
          PRIZES&nbsp;&nbsp;
          <span
            style={{
              margin: "0",
              fontSize: "27px",
              display: "inline-block",
              color: "white",
              textShadow: "0 0 5px #a3a7ea",
            }}
            onClick={toggleModal}
          >
            <PrizeValueIcon size={22} />
            <PrizeValue amount={BigInt(totalPrize * 1e18)} size={30} rounded={true}/>
          </span>
          &nbsp;
          <FontAwesomeIcon
      icon={faCircleInfo}
      style={{ color: "#ebeeef", height: "16px", cursor: "pointer", }}
      onClick={toggleModal}
    />
          {/* <Image
            src="/images/moreInfo.svg"
            alt="i"
            width={19}
            height={19}
            onClick={toggleModal}
            style={{ cursor: "pointer" }}
          /> */}
          
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        </div>
      )}

      {isModalOpen && (
        <div className="modal" onClick={closeModal}>
          
          <div className="modal-content">
            <div className="prize-header" style={{ display: "flex", fontSize:"32px", alignItems: "center" }}>
              <Image
                src="/images/pttrophy.svg"
                width={26}
                height={40}
                alt="trophy"
              />
              &nbsp;&nbsp;&nbsp;Prizes&nbsp;&nbsp; <PrizeValueIcon size={32} />
              <PrizeValue amount={BigInt(totalPrize * 1e18)} size={40} rounded={true}/>
            </div>
            <div className="total-prize"></div>  
            <div className="grid-container">
              <div className="grid-header">
                <div></div>
                <div style={{ textAlign: "right" }}>Prizes&nbsp;&nbsp;</div>
                <div style={{ textAlign: "right", color:"#f0c8f9" }}>Jackpot&nbsp;&nbsp;</div>
                <div style={{ textAlign: "right" }} className="hidden-mobile">Tier 1&nbsp;&nbsp;</div>
              </div>
              {sortedPrizes.map(([chain, prizeData]) => {
                const tier0 = prizeData.prizes.tierData.find(
                  (tier) => tier.tier === 0
                );
                const tier1 = prizeData.prizes.tierData.find(
                  (tier) => tier.tier === 1
                );
                return (
                  <div key={chain} className="grid-row">
                    <div style={{ textAlign: "left", fontSize: "14px" }}>
                      <span className="hidden-mobile">
                        {chain}
                        </span>
                        <span className="hidden-desktop">
                          {chain==="OPTIMISM" ? "OP" : chain === "ARBITRUM" ? "ARB" : chain}
                        </span>
                    </div>
                    
                    <div style={{ textAlign: "right" }}>
                      <PrizeValueIcon size={24} />
                      <PrizeValue amount={BigInt(prizeData.total)} size={28}  rounded={true}/>
                    </div>
                    <div style={{ textAlign: "right",color:"#e9aaf7" }}>
                      {tier0 && tier0.value > 0.01 && (
                        <>
                          <PrizeValueIcon size={24} />
                          <PrizeValue amount={BigInt(Math.round(tier0.value * 1e18))} size={28}  rounded={true}/>
                        </>
                      )}
                    </div>
                    <div style={{ textAlign: "right" }} className="hidden-mobile">
                      {tier1 && tier1.value > 0.01 && (
                        <>
                          <PrizeValueIcon size={24} />
                          <PrizeValue amount={BigInt(Math.round(tier1.value * 1e18))} size={28}  rounded={true}/>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
}
        .modal-content {
          
          background-color: #030526;
          padding: 30px;
          border: 1px solid #888;
          color: white;
          border-radius: 25px;
          border: 3px solid white;
          box-shadow: rgba(0, 0, 0, 0.2) 0px 4px 15px;
        }

        .total-prize {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
        }
        .grid-container {
          display: grid;
          grid-template-columns: 0.8fr 1fr 1fr 1fr;
          gap: 17px;
        }
        
        @media (max-width: 768px) { 
          .grid-container {
            grid-template-columns: 0.6fr 1.8fr 1.5fr;
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

export default PrizeInPool;

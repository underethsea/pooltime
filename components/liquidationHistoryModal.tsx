import { ethers } from "ethers";
import { ADDRESS, CONFIG } from "../constants";
import { PrizeToke, Dec, CropDecimals } from "../utils/tokenMaths";
import React from "react";
import Image from "next/image";

function dec(input: any, significantFigures = 3) {
  if (typeof input !== "number" && typeof input !== "string") {
    console.error("dec received a non-numeric input:", input);
    return "Invalid Input";
  }
}
export const LiquidationHistoryModal: React.FC<{
  liquidations: any[];
  historyPair: any;
  chain: any;
}> = ({ liquidations, historyPair, chain }) => {
  // console.log("liquidations",liquidations)
  // console.log("history pair in history",historyPair)
  // console.log("chain",chain)
  const totalAmountIn = liquidations.reduce(
    (acc: any, curr: any) =>
      acc +
      Number(
        ethers.utils.formatUnits(
          curr.amountIn,
          ADDRESS[chain].PRIZETOKEN.DECIMALS
        )
      ),
    0
  );
  const totalAmountOut = liquidations.reduce(
    (acc: number, curr: any) =>
      acc + Number(ethers.utils.formatUnits(curr.amountOut, historyPair.DECIMALS)),
    0
  );
  
  const linkStyle = {
    textDecoration: 'none', // or any other style for links
    color: 'blue', // example link color
  };

  const flexCellStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '0 25px 0 10px',
    flex: '0 1 auto', // Don't grow, allow shrink, base size auto
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
  // console.log("liquidations", liquidations);
  return (
    <div className="history-modal-content" style={{ width: '100%' }}>
      <div className="stats-container margin-top-bottom-20">
        <strong>Total ({liquidations.length})</strong>
        <span style={{ marginLeft: '20px' }}>
          <strong>{totalAmountIn.toFixed(2)} {ADDRESS[CONFIG.CHAINNAME].PRIZETOKEN.SYMBOL}</strong>
        </span>
        <span style={{ marginLeft: '20px' }}>
          <strong>{totalAmountOut.toFixed(2)} {historyPair.SYMBOL}</strong>
        </span>
      </div>
      {liquidations.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'auto auto auto auto', gridRowGap: '12px', gridColumnGap: '45px', alignItems: 'center' }}>
          {/* Header */}
          <div><strong>Tx</strong></div>
          <div><strong>Prize</strong></div>
          <div style={{ textAlign: 'right' }}><strong>Yield</strong></div>
          <div><strong>Actor</strong></div>
          {/* <div><strong>Profit</strong></div> */}
          {/* Rows */}
          {liquidations.map((liquidation, index) => (
            <React.Fragment key={index}>
              <div style={{ textAlign: 'center' }}>
              <a
                        href={
                          ADDRESS[CONFIG.CHAINNAME].ETHERSCAN + "/tx/" +
                          liquidation.transactionHash
                        }
                        target="_blank"
                        rel="noreferrer">
                        <Image
                          src="/images/etherscan.svg"
                          height={18}
                          width={18}
                          alt="etherscan"
                        />
                      </a>
              </div>
              <div>{PrizeToke(liquidation.amountIn)} {ADDRESS[CONFIG.CHAINNAME].PRIZETOKEN.SYMBOL}</div>
              <div style={{ textAlign: 'right' }}>
                {CropDecimals(Dec(liquidation.amountOut, historyPair.DECIMALS))} {historyPair.SYMBOL}
              </div>
              <div>
                <a href={`${ADDRESS[CONFIG.CHAINNAME].ETHERSCAN}/address/${liquidation.receiver}`}>
                  {liquidation.receiver.substring(0, 6)}
                </a>
              </div>
              {/* <div style={{ textAlign: 'center' }}>20%</div> */}
            </React.Fragment>
          ))}
        </div>
      ) : (
        <div>No recent history found</div>
      )}
    </div>
  );
};
import { PrizeToke } from "../utils/tokenMaths";
import PrizeIcon from "./prizeIcon";
import { CSSProperties } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCirclePlus, faCircleMinus } from "@fortawesome/free-solid-svg-icons";
import { PrizeAsNumber, Dec } from "../utils/tokenMaths";
import Image from "next/image";
import { useState } from "react";
import { ADDRESS, CONFIG } from "../constants/";
import LoadGrid from "./loadGrid";

const tdCellStyle = {
  padding: "12px",
};
const tdCellStyleRight = {
  padding: "12px",
  textAlign: "right",
};

const thCell = {
  paddingRight: "14px",
  // paddingLeft: "14px",
  paddingTop: "14px",
};

const thCellRight = {
  paddingTop: "14px",
  paddingRight: "14px",
  paddingLeft: "14px",
  textAlign: "right",
};

interface ClaimProps {
  groupedByDraw: {
    drawId: string;
    fee: bigint;
    payout: bigint;
    // claimCount: number;
    canaryClaimCount: number;
    awardedPrizes: number;
    canaryPrizes: number;
    expanded: boolean;
    claims: any[];
    txHash: string;
  }[];
  totalFees: any;
  highestFee: any;
  minerWithMostFees: any;
}

// Apply the interface to your component props
const Claims: React.FC<ClaimProps> = ({
  groupedByDraw,
  totalFees,
  highestFee,
  minerWithMostFees,
}) => {
  console.log("grouped by draw??", groupedByDraw);
  //     const [groupedByDraw, setGroupedByDraw] = useState<
  //     {
  //       drawId: string;
  //       fee: bigint;
  //       payout: bigint;
  //       claimCount: number;
  //       canaryClaimCount: number;
  //       awardedPrizes: number;
  //       canaryPrizes: number;
  //       expanded: boolean;
  //       claims: any[];
  //       txHash: string;
  //     }[]
  //   >([]);

  // const handleExpandCollapse = (drawId: string) => {
  //         setGroupedByDraw((prevGroupedByDraw) =>
  //           prevGroupedByDraw.map((group) => {
  //             if (group.drawId === drawId) {
  //               return {
  //                 ...group,
  //                 expanded: !group.expanded,
  //               };
  //             }
  //             return group;
  //           })
  //         );
  //       };

  const [expandedDrawId, setExpandedDrawId] = useState<string | null>(null);
  const handleExpandCollapse = (drawId: string) => {
    console.log("handling expander");
    // Toggle the expanded drawId. If it's already expanded, collapse it, otherwise set the new drawId.
    setExpandedDrawId((current) => (current === drawId ? null : drawId));
  };

  //  const handleExpandCollapse = (drawId: string) => {}
  console.log("expanded draw id", expandedDrawId);
  return (
    <>
      <br></br>
      <div className="stats-container">
        <div className="vault-name">
          {/* {selectedVaultDetails.NAME.replace(
            /PoolTogether|Prize Token/g,
            ""
          ).trim()}{" "}
          Vault */}
        </div>

        {totalFees > 0 && (
          <div className="stats" style={{ color: "white" }}>
            {/* <div className="stats hidden-mobile" style={{ color: "white" }}> */}

            <div className="stat">
              <div className="stat-details">
                Total Fees<br></br>
                <span className="stat-value">
                  <PrizeIcon size={18} />
                  &nbsp;{PrizeToke(BigInt(totalFees))}
                </span>
              </div>
            </div>
          </div>
        )}
        {highestFee > 0 && (
          <div className="stats" style={{ color: "white" }}>
            {/* <div className="stats hidden-mobile" style={{ color: "white" }}> */}

            <div className="stat hidden-mobile">
              <div className="stat-details">
                Highest Fee<br></br>
                <span className="stat-value">
                  <PrizeIcon size={18} />
                  &nbsp;{PrizeToke(highestFee)}
                </span>
              </div>
            </div>
          </div>
        )}
        {minerWithMostFees && (
          <div className="stats " style={{ color: "white" }}>
            {/* <div className="stats hidden-mobile" style={{ color: "white" }}> */}

            <div className="stat">
              <div className="stat-details">
                Top Miner<br></br>
                <span className="stat-value">
                  {minerWithMostFees.substring(0, 8)}
                </span>
              </div>
            </div>
          </div>
        )}
        {/* {averageFeePercentage  && (
        //   <div className="stats hidden-mobile" style={{ color: "white" }}>
         <div className="stats" style={{ color: "white" }}>

            <div className="stat">
              <div className="stat-details">
                Average Fees&nbsp;&nbsp;
                
                <span className="stat-value">
                  {averageFeePercentage.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        )} */}
      </div>

      {groupedByDraw.length > 0 ? (
        <div>
          <div style={{ maxWidth: "980px" }}>
            <table className="draw-table wide-table claims-table">
              <thead>
                <tr>
                  <th></th>
                  <th style={thCell as React.CSSProperties}>Draw&nbsp;</th>
                  <th
                    className="hidden-mobile"
                    style={thCellRight as React.CSSProperties}>
                    &nbsp;&nbsp;Prizes
                  </th>
                  <th
                    className="hidden-mobile"
                    style={thCellRight as React.CSSProperties}>
                    &nbsp;&nbsp;Canary
                  </th>
                  <th style={thCellRight as React.CSSProperties}>
                    &nbsp;&nbsp;Winners&apos;{" "}
                    {ADDRESS[CONFIG.CHAINNAME].PRIZETOKEN.SYMBOL}
                  </th>
                  <th style={thCellRight as React.CSSProperties}>
                    &nbsp;&nbsp;Miner Fees
                  </th>
                  <th style={thCellRight as React.CSSProperties}>Fee %</th>
                </tr>
              </thead>
              <tbody>
                {groupedByDraw.map(
                  ({
                    drawId,
                    fee,
                    payout,
                    canaryClaimCount,
                    awardedPrizes,
                    canaryPrizes,
                    // expanded,
                    claims,
                    txHash,
                  }) => (
                    <>
                      {/* <tr>
                    <td colSpan={6}>
                      <hr
                        style={{
                          borderColor: "rgb(196, 216, 216)",
                          borderStyle: "solid",
                          borderWidth: "1px 0px 0px",
                          height: "1px",
                          margin: "0",
                          padding: "0",
                        }}
                      />
                    </td>
                  </tr> */}

                      <tr
                        onClick={() => handleExpandCollapse(drawId)}
                        style={{ cursor: "pointer" }}>
                        <td>
                          {expandedDrawId === drawId ? (
                            <FontAwesomeIcon
                              icon={faCircleMinus}
                              size="sm"
                              style={{
                                color: "#1a4160",
                                height: "15px",
                                paddingLeft: "15px",
                              }}
                            />
                          ) : (
                            <FontAwesomeIcon
                              icon={faCirclePlus}
                              size="sm"
                              style={{
                                color: "#1a4160",
                                height: "15px",
                                paddingLeft: "15px",
                              }}
                            />
                          )}
                          &nbsp;&nbsp;&nbsp;
                        </td>
                        <td style={tdCellStyle}>{drawId}</td>
                        <td
                          className="hidden-mobile"
                          style={tdCellStyleRight as React.CSSProperties}>
                          {claims.length} / {awardedPrizes}
                        </td>
                        <td
                          className="hidden-mobile"
                          style={tdCellStyleRight as React.CSSProperties}>
                          {canaryClaimCount} / {canaryPrizes}
                        </td>
                        <td style={tdCellStyleRight as React.CSSProperties}>
                          {payout > 0 && (
                            <>
                              <PrizeIcon size={14} />
                              &nbsp;{PrizeToke(payout)}
                            </>
                          )}{" "}
                        </td>
                        <td style={tdCellStyleRight as React.CSSProperties}>
                          <PrizeIcon size={14} /> {PrizeToke(fee)}
                        </td>
                        <td style={tdCellStyleRight as React.CSSProperties}>
                          {(
                            (Number(Dec(fee, 18)) /
                              (Number(Dec(payout, 18)) +
                                Number(Dec(fee, 18)))) *
                            100
                          ).toFixed(2)}
                          %{" "}
                        </td>
                      </tr>
                      {expandedDrawId === drawId && (
                        <tr>
                          <td colSpan={7}>
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "8px",
                                // maxWidth: "980px",
                                width: "100%",
                                borderRadius: "5px",
                                backgroundColor: "#3f658f",
                              }}>
                              <div
                                style={{
                                  display: "table-cell",
                                  borderCollapse: "collapse",
                                  paddingTop: "10px",
                                  paddingLeft: "10px",
                                  paddingBottom: "10px",
                                }}>
                                <table
                                  style={{
                                    borderCollapse: "collapse",
                                    width: "100%",
                                  }}>
                                  <tbody>
                                    <tr style={{ fontSize: "12px" }}>
                                      <td>
                                        <span
                                          style={{
                                            marginLeft: "10px",
                                          }}>
                                          Prize
                                        </span>
                                      </td>
                                      <td>
                                        <span
                                          style={{
                                            marginLeft: "10px",
                                          }}>
                                          Fee
                                        </span>
                                      </td>
                                      <td>
                                        <span
                                          style={{
                                            marginLeft: "11px",
                                          }}>
                                          Winner
                                        </span>
                                      </td>
                                      <td>
                                        <span
                                          style={{
                                            marginLeft: "11px",
                                          }}>
                                          Miner
                                        </span>
                                      </td>
                                    </tr>
                                    {claims
                                      .slice(0, Math.ceil(claims.length / 2))
                                      .map((claim: any, index: number) => (
                                        <tr
                                          key={claim.claimId}
                                          style={{
                                            borderBottom:
                                              index ===
                                              Math.ceil(claims.length / 2) - 1
                                                ? "none"
                                                : "1px solid #ccc",
                                          }}>
                                          <td style={{ padding: "8px" }}>
                                            <div
                                              style={{
                                                display: "flex",
                                                alignItems: "center",
                                              }}>
                                              <a
                                                href={
                                                  ADDRESS[CONFIG.CHAINNAME]
                                                    .ETHERSCAN +
                                                  "/tx/" +
                                                  claim.txHash
                                                }>
                                                <Image
                                                  src="/images/etherscan.svg"
                                                  height={14}
                                                  width={14}
                                                  alt="etherscan"
                                                />
                                              </a>
                                              &nbsp;&nbsp;&nbsp;&nbsp;
                                              {claim.payout > 0 && (
                                                <>
                                                  <PrizeIcon size={14} />
                                                  <span
                                                    style={{
                                                      marginLeft: "4px",
                                                      fontSize: "12px",
                                                    }}>
                                                    {PrizeToke(claim.payout)}
                                                  </span>
                                                </>
                                              )}
                                            </div>
                                          </td>
                                          <td style={{ padding: "8px" }}>
                                            <div
                                              style={{
                                                display: "flex",
                                                alignItems: "center",
                                              }}>
                                              <PrizeIcon size={14} />
                                              <span
                                                style={{
                                                  marginLeft: "4px",
                                                  fontSize: "12px",
                                                }}>
                                                {(
                                                  parseInt(claim.fee) / 1e18
                                                ).toFixed(2)}
                                                &nbsp;
                                                {(PrizeAsNumber(claim.fee) /
                                                  (PrizeAsNumber(claim.fee) +
                                                    PrizeAsNumber(
                                                      claim.payout
                                                    ))) *
                                                  100 <
                                                1
                                                  ? "(<1%)"
                                                  : `(${(
                                                      (PrizeAsNumber(
                                                        claim.fee
                                                      ) /
                                                        (PrizeAsNumber(
                                                          claim.fee
                                                        ) +
                                                          PrizeAsNumber(
                                                            claim.payout
                                                          ))) *
                                                      100
                                                    ).toFixed(0)}%)`}
                                              </span>
                                            </div>
                                          </td>
                                          <td style={{ padding: "8px" }}>
                                            <div
                                              style={{
                                                display: "flex",
                                                alignItems: "center",
                                              }}>
                                              <span
                                                style={{
                                                  marginLeft: "11px",
                                                  fontSize: "12px",
                                                }}>
                                                {claim.winner.substring(0, 6)}
                                              </span>
                                            </div>
                                          </td>
                                          <td style={{ padding: "8px" }}>
                                            <div
                                              style={{
                                                display: "flex",
                                                alignItems: "center",
                                              }}>
                                              <span
                                                style={{
                                                  marginLeft: "11px",
                                                  fontSize: "12px",
                                                }}>
                                                {claim.feeRecipient.substring(
                                                  0,
                                                  6
                                                )}
                                              </span>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                  </tbody>
                                </table>
                              </div>
                              <div
                                style={{
                                  display: "table-cell",
                                  borderCollapse: "collapse",
                                  paddingTop: "10px",
                                  paddingLeft: "10px",
                                  paddingBottom: "10px",
                                  paddingRight: "10px",
                                }}>
                                {claims.length > 1 && (
                                  <table
                                    style={{
                                      borderCollapse: "collapse",
                                      width: "100%",
                                    }}>
                                    <tbody>
                                      <tr style={{ fontSize: "12px" }}>
                                        <td>
                                          <span
                                            style={{
                                              marginLeft: "10px",
                                            }}>
                                            Prize
                                          </span>
                                        </td>
                                        <td>
                                          <span
                                            style={{
                                              marginLeft: "10px",
                                            }}>
                                            Fee
                                          </span>
                                        </td>
                                        <td>
                                          <span
                                            style={{
                                              marginLeft: "11px",
                                            }}>
                                            Winner
                                          </span>
                                        </td>
                                        <td>
                                          <span
                                            style={{
                                              marginLeft: "11px",
                                            }}>
                                            Miner
                                          </span>
                                        </td>
                                      </tr>
                                      {claims
                                        .slice(Math.ceil(claims.length / 2))
                                        .map((claim: any, index: number) => (
                                          <tr
                                            key={claim.claimId}
                                            style={{
                                              borderBottom:
                                                index ===
                                                claims.length -
                                                  Math.ceil(claims.length / 2) -
                                                  1
                                                  ? "none"
                                                  : "1px solid #ccc",
                                            }}>
                                            <td
                                              style={{
                                                padding: "8px",
                                              }}>
                                              <div
                                                style={{
                                                  display: "flex",
                                                  alignItems: "center",
                                                }}>
                                                <a
                                                  href={
                                                    ADDRESS[CONFIG.CHAINNAME]
                                                      .ETHERSCAN +
                                                    "/tx/" +
                                                    claim.txHash
                                                  }>
                                                  <Image
                                                    src="/images/etherscan.svg"
                                                    height={14}
                                                    width={14}
                                                    alt="etherscan"
                                                  />
                                                </a>
                                                &nbsp;&nbsp;&nbsp;&nbsp;
                                                {claim.payout > 0 && (
                                                  <>
                                                    <PrizeIcon size={14} />
                                                    <span
                                                      style={{
                                                        marginLeft: "4px",
                                                        fontSize: "12px",
                                                      }}>
                                                      {PrizeToke(claim.payout)}
                                                    </span>
                                                  </>
                                                )}
                                              </div>
                                            </td>
                                            <td
                                              style={{
                                                padding: "8px",
                                              }}>
                                              <div
                                                style={{
                                                  display: "flex",
                                                  alignItems: "center",
                                                }}>
                                                <PrizeIcon size={14} />
                                                <span
                                                  style={{
                                                    marginLeft: "4px",
                                                    fontSize: "12px",
                                                  }}>
                                                  {(
                                                    parseInt(claim.fee) / 1e18
                                                  ).toFixed(4)}
                                                  &nbsp;
                                                  {(PrizeAsNumber(claim.fee) /
                                                    (PrizeAsNumber(claim.fee) +
                                                      PrizeAsNumber(
                                                        claim.payout
                                                      ))) *
                                                    100 <
                                                  1
                                                    ? "(<1%)"
                                                    : `(${(
                                                        (PrizeAsNumber(
                                                          claim.fee
                                                        ) /
                                                          (PrizeAsNumber(
                                                            claim.fee
                                                          ) +
                                                            PrizeAsNumber(
                                                              claim.payout
                                                            ))) *
                                                        100
                                                      ).toFixed(0)}%)`}
                                                </span>
                                              </div>
                                            </td>
                                            <td
                                              style={{
                                                padding: "8px",
                                              }}>
                                              <div
                                                style={{
                                                  display: "flex",
                                                  alignItems: "center",
                                                }}>
                                                <span
                                                  style={{
                                                    marginLeft: "11px",
                                                    fontSize: "12px",
                                                  }}>
                                                  {claim.winner.substring(0, 6)}
                                                </span>
                                              </div>
                                            </td>
                                            <td
                                              style={{
                                                padding: "8px",
                                              }}>
                                              <div
                                                style={{
                                                  display: "flex",
                                                  alignItems: "center",
                                                }}>
                                                <span
                                                  style={{
                                                    marginLeft: "11px",
                                                    fontSize: "12px",
                                                  }}>
                                                  {claim.feeRecipient.substring(
                                                    0,
                                                    6
                                                  )}
                                                </span>
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // (
        //   <div className="loading-animation">
        //     <div className="loading-image">
        //       <Image src={donut} alt="Loading" priority={true} />
        //     </div>
        //   </div>
        // )
        <LoadGrid />
      )}
    </>
  );
};
export default Claims;

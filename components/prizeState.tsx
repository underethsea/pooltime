// import { CONTRACTS } from "../constants/contracts";
import { useState, useEffect } from "react";
import { CONFIG, ADDRESS } from "../constants";
// import { Multicall } from "../utils/multicall";
// import { ethers } from "ethers";
import { PrizeToke, CropDecimals } from "../utils/tokenMaths";
import PrizeIcon from "./prizeIcon";
import { TierColors } from "../constants/constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAward } from "@fortawesome/free-solid-svg-icons";
// import { ethers } from "ethers";
import LoadGrid from "./loadGrid";
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active: any;
  payload: any;
  label: any;
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload; // The full data of the hovered point
    return (
      <div
        style={{
          background: "rgba(255, 255, 255, 0.9)",
          padding: "3px 4px",
          border: "1px solid #ddd",
          borderRadius: "5px",
          color: "#000",
          fontSize: "13px",
        }}>
        <p>{`Draw ${data.drawId} | ${data.amount} ${ADDRESS[CONFIG.CHAINNAME].PRIZETOKEN.SYMBOL}`}</p>
      </div>
    );
  }

  return null;
};
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   Title,
//   Tooltip,
//   Legend,
//   LineController,
// } from "chart.js";
// import { Line } from "react-chartjs-2";
// const chartOptions = {
//   scales: {
//     x: {
//       grid: {
//         display: false,
//       },
//       ticks: {
//         color: "white", // Set color to white to match your theme
//         maxTicksLimit: 5, // Limit the number of ticks to 5
//         // You may also need to use an autoSkip property to ensure that skipping is enforced
//         autoSkip: true,
//         display: false,
//       },
//     },
//     y: {
//       grid: {
//         display: false,
//       },
//       ticks: {
//         color: "white", // Set color to white to match your theme
//         // Include a callback here if you want to format the y-axis ticks
//       },
//     },
//   },
//   elements: {
//     point: {
//       radius: 0, // Completely removes points from the line
//     },
//     line: {
//       tension: 0, // Straight lines, no curves
//     },
//   },
//   plugins: {
//     legend: {
//       display: false, // Completely removes legend
//     },
//     tooltip: {
//       enabled: false, // Disables tooltips
//     },
//   },
//   animation: {
//     duration: 0, // Disable all animations
//   },
//   maintainAspectRatio: false,
//   responsive: true,
// };
interface PrizeStateProps {
  tierRemainingLiquidities: BigInt[]; // Replace 'number' with the correct type
  prizeSizes: BigInt[]; // Replace 'number' with the correct type
  chartData: any;
  highestDraw: any;
  // reserve: any;
}
// Apply the interface to your component props
const PrizeState: React.FC<PrizeStateProps> = ({
  tierRemainingLiquidities,
  prizeSizes,
  chartData,
  highestDraw,
  // reserve,
}) => {
  console.log("highest draw in prize state",highestDraw)
  const totalLiquidity = tierRemainingLiquidities.reduce(
    (acc: any, val: any) => acc + BigInt(val),
    BigInt(0)
  );

  // console.log("highest draw", highestDraw);

  // console.log("tier liquidit", tierRemainingLiquidities);
  const [totalPrizesAwarded, setTotalPrizesAwarded] = useState(0);
  const [totalPrizesClaimed, setTotalPrizesClaimed] = useState(0);
  // const PrizeState = ({ tierRemainingLiquidities, prizeSizes, chartData }) => {
  // const [prizesForTier, setPrizesForTier] = useState([])
  // const [tierRemainingLiquidites,setTierRemainingLiquidities] = useState([])
  // const [prizeSizes, setPrizeSizes] = useState([])
  // const [chartData, setChartData] = useState({ labels: [], datasets: [] });

  //     const fetchData = async () => {
  //       const [lastDrawId, numberOfTiers] = (await Multicall([
  //         CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].getLastAwardedDrawId(),
  //         CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].numberOfTiers(),
  //       ], CONFIG.CHAINNAME)) as any[];

  // let multicallRequests = []

  //     for (let tier = 0; tier < numberOfTiers; tier++) {
  //         // multicallRequests.push(CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].calculateTierTwabTimestamps(tier, { blockTag: block }));
  //         multicallRequests.push(CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].getTierAccrualDurationInDraws(tier))
  //         multicallRequests.push(CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].getTierPrizeSize(tier));
  //         // multicallRequests.push(CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].getTierPrizeCount(tier));
  //         // multicallRequests.push(CONTRACTS.CLAIMER[CONFIG.CHAINNAME].computeMaxFee(tier));
  //          multicallRequests.push(CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].getTierRemainingLiquidity(tier));

  //       }
  //     //   let tierTimestamps = []
  //       let prizeSizes = []
  //       // let prizesForTier = []
  //       let maxFee = []
  //       let tierRemainingLiquidites = []
  //       // Make the multicall
  //       const historyUrl = `https://poolexplorer.xyz/${CONFIG.CHAINID}-drawHistory`
  //       const [history,multicallResult] = await Promise.all([fetch(historyUrl),Multicall(multicallRequests,CONFIG.CHAINNAME)])

  //       const historyResult = await history.json()

  //     //   const drawClosesAt = await CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].drawClosesAt(lastDrawId);
  //       for (let i = 0; i < numberOfTiers; i++) {

  //         const startIndex = i * 3;

  //   // Adjust the indices to correctly map to the multicall results
  //   const prizeSize = multicallResult[startIndex + 1];
  // //   const prizeCount = multicallResult[startIndex + 2];
  // //   const tierMaxClaimFee = multicallResult[startIndex + 3];
  //   const tierRemainingLiquidity = multicallResult[startIndex + 2];
  //         // console.log("tier ", i, " prize size ", (Number(prizeSize) / 1e18).toFixed(4), " remaining liquidity ", (Number(tierRemainingLiquidity)/ 1e18).toFixed(4));

  //         // tierTimestamps.push({ startTimestamp, endTimestamp });
  //         prizeSizes.push(prizeSize)
  //         // prizesForTier.push(prizeCount)
  //         // maxFee.push(tierMaxClaimFee)
  //         tierRemainingLiquidites.push(tierRemainingLiquidity)
  //       }

  //       const lineChartData = historyResult.map(({ draw, tiervalues }: { draw: any; tiervalues: any }) => ({
  //         draw,
  //         tierValue: (tiervalues[0]/1e18).toFixed(0), // Assuming tiervalues is an array and you need the first value
  //       }));

  //       // Format data for the line chart
  //       const newChartData = {
  //         labels: lineChartData.map((item:any) => `Draw ${item.draw}`),
  //         datasets: [
  //           {
  //             type: 'line',
  //             label: '',
  //             data: lineChartData.map((item:any) => item.tierValue),
  //             borderColor: '#31fad9',
  //             borderWidth: 1,
  //             fill: false,
  //           }
  //         ],
  //       };

  //       // Set the new chart data
  //       setChartData(newChartData as any);

  //       setPrizeSizes(prizeSizes as any)
  //       setTierRemainingLiquidities(tierRemainingLiquidites as any)
  //       // setPrizesForTier(prizesTier)
  //     //   const poolResults = {
  //     //     // tierTimestamps: tierTimestamps,
  //     //     prizeSizes: prizeSizes,
  //     //     prizesForTier: prizesForTier,
  //     //     maxFee: maxFee,
  //     //     tierRemainingLiquidites: tierRemainingLiquidites,
  //     //   }

  //     // setPrizePoolData(poolResults);
  //   }

  //   // useEffect(() => {
  //   //   fetchData();

  //   // }, []);
 


  console.log("highest",highestDraw)
  useEffect(() => {
    let totalAwarded = 0;
    let totalClaimed = 0;
  
    if (highestDraw && highestDraw.tiers) {
      Object.values(highestDraw.tiers).forEach((tierData:any) => {
        if (tierData) {
          totalAwarded += tierData.totalWins ? parseInt(tierData.totalWins) : 0;
          totalClaimed += tierData.totalClaims ? parseInt(tierData.totalClaims) : 0;
        }
      });
    }
  
    setTotalPrizesAwarded(totalAwarded);
    setTotalPrizesClaimed(totalClaimed);
  }, [highestDraw]);
  


  return (
    <>
  
      <br></br>
      {!highestDraw.draw && <><center><br></br>
      
     <LoadGrid />
        </center></>}
      <div className="prize-state-container" style={{ color: "white" }}>
        {highestDraw.draw > 0 && (
          <div className="prize-bubble prize-state-div" style={{fontSize:"23px"}}>
            Draw #{highestDraw.draw}
            <br />
            <br />
            <span style={{ fontSize: "16px", marginTop: "16px" }}>
              {/* <PrizeIcon size={17} /> {PrizeToke(reserve)}&nbsp;Reserve<br></br><br></br> */}
              <div style={{ fontSize: "14px"}}>{totalPrizesClaimed} / {totalPrizesAwarded} claimed</div>

              {/* <div style={{ fontSize: "14px"}}>  prizes awarded</div> */}
              {/* <PrizeIcon size={17} /> {PrizeToke(totalLiquidity)}&nbsp;Prize
              Liquidity */}
            </span>{" "}
          </div>
        )}

        {prizeSizes[0] && (
          <div className="prize-bubble grand-prize-div">
            <div style={{ marginBottom: "10px", marginTop: "10px",fontSize:"24px" }}>
              <PrizeIcon size={20} />
              {/* @ts-ignore */}
              &nbsp;{PrizeToke(prizeSizes[0])}&nbsp;Grand Prize{" "}
            </div>
            {/* @ts-ignore */}
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <XAxis
                  dataKey="drawId"
                  // label={{ value: 'Draw', position: 'insideBottom', offset: -5 }}
                  interval={Math.floor(chartData.length / 6)} // Skip ticks based on data length
                  tickCount={6}
                />
                <YAxis />
                {/* @ts-ignore */}
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#31fad9"
                  dot={false} // This will remove the dots from the line
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {tierRemainingLiquidities &&
          tierRemainingLiquidities.map((liquidity: any, index: any) => {
            if (index === 0) {
              // This skips the first item (Tier 0)
              return null;
            }

            // Check if highestDraw.tiers[index] exists and has totalWins and totalClaims
            const tierData = highestDraw.tiers[index];
            const totalClaims =
              tierData && tierData.totalClaims ? tierData.totalClaims : 0;
            const totalWins =
              tierData && tierData.totalWins ? tierData.totalWins : 0;

            // Calculate the claimed percentage, ensuring no division by zero
            const claimedPercentage =
              totalWins > 0 ? (totalClaims / totalWins) * 100 : 0;
console.log("keys",tierRemainingLiquidities.length,"index",index)
              const isCanary = index >  tierRemainingLiquidities.length-3
            return (
              <>
                <div
                  key={index}
                  className="prize-bubble prize-state-div"
                  style={{ color: "white", fontSize:"24px"
                }}>
                  {!isCanary && <>
                  <FontAwesomeIcon
                    icon={faAward}
                    size="sm"
                    style={{
                      color: TierColors[index], // Set color based on the tier
                      height: "20px",
                      marginRight: "8px",
                      paddingTop: "4px",
                    }}
                  />
                 
                  Tier {index}&nbsp;&nbsp;&nbsp;&nbsp;</>} <PrizeIcon size={18} />
                  &nbsp;
                  {CropDecimals(
                    parseFloat(prizeSizes[index].toString()) / 1e18
                  )}
                  <br />
                  {totalWins > 0 && (
                    <div
                      style={{
                        height: "8px",
                        width: "90%",
                        backgroundColor: "#ddd",
                        margin: "10px 0",
                        borderRadius: "4px", // Rounded corners for the container
                        overflow: "hidden", // Ensures that the inner div does not spill outside the border radius
                      }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${claimedPercentage}%`,
                          backgroundColor: isCanary ? "#6c99fc" : "#986cfc", // Updated progress color
                          borderRadius: "0", // Only apply rounded corners to the left side
                          textAlign: "left", // Ensures that the content starts from the left
                        }}></div>
                    </div>
                  )}
                  <span style={{ fontSize: "14px", marginTop: "14px" }}>
                    {highestDraw && highestDraw.tiers[index] ? (
                      <>
                        {highestDraw.tiers[index].totalClaims > 0 && (
                          <>
                                                      <PrizeIcon size={12} />
&nbsp;
                            {CropDecimals(
                              highestDraw.tiers[index].totalClaims *
                                (parseFloat(prizeSizes[index].toString()) /
                                  1e18)
                            )}&nbsp;-&nbsp; 
                          {highestDraw.tiers[index].totalClaims} 

                            {isCanary ? " canaries claimed " : ` prizes claimed `}
                            {" "}
                            <br />{" "}
                          </>
                        )}
                        {highestDraw.tiers[index].totalWins > 0 && (
                          <>
                          <PrizeIcon size={12} />
                            &nbsp;
                            {CropDecimals(
                              highestDraw.tiers[index].totalWins *
                                (parseFloat(prizeSizes[index].toString()) /
                                  1e18)
                            )}&nbsp;-&nbsp;
                          {highestDraw.tiers[index].totalWins} 
                           {isCanary ? " canaries created " : ` prizes awarded `}

                            {/* {highestDraw.tiers[index].totalWins} prizes
                            awarded&nbsp; */}
                            {" "}
                            <br />
                          </>
                        )}
                      </>
                    ) : (
                      <span
                        className="remaining-liquidity"
                        style={{ color: "#dddddd" }}>
                        <br></br>
                        <i>No prizes awarded for current draw</i><br></br>  
                      </span>
                    )}
                    <br />      <div className="flex-grow"></div>

                    {liquidity.gt(0) ? (
                      <>
                        <PrizeIcon size={12} />
                        &nbsp;{PrizeToke(liquidity)}
                      </>
                    ) : (
                      "No"
                    )}{" "}
                    Remaining Liquidity
                    <br />
                  </span>
                </div>
              </>
            );
          })}
      </div>
    </>
  );
};
export default PrizeState;

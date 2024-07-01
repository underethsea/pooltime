import React, { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import "chart.js/auto";
// import { Multicall } from "../utils/multicall";
import { NumberWithCommas } from "../utils/tokenMaths";
import { TierColors } from "../constants/constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAward } from "@fortawesome/free-solid-svg-icons";
// import { CONTRACTS } from "../constants/contracts";
import { CONFIG, ADDRESS } from "../constants";
// import { ethers } from "ethers";
import ChartDataLabels from "chartjs-plugin-datalabels";
import {
  Chart as ChartJS,
  Tooltip,
  Legend,
  ArcElement,
  ChartOptions,
} from "chart.js";
import { CSSProperties } from "react";
import PrizeIcon from "./prizeIcon";

interface TierData {
  value: string;
  totalWins: string;
  totalClaims: string;
}

interface DrawData {
  draw: number;
  tiers: { [key: string]: TierData };
}

interface TierStats {
  averageWon: number;
  medianWon: number;
  totalWon: number;
  averageClaimed: number;
  medianClaimed: number;
  totalClaimed: number;
  totalWins: number;
  totalClaims: number;
  valuesWon: number[];
  valuesClaimed: number[];
  highestWon: number;
  lowestWon: number;
  highestClaimed: number;
  lowestClaimed: number;
}

function formater(number:any, threshold = 99) {
    const formattedNumber = number > threshold ? number.toFixed(0) : number.toFixed(4);
    return NumberWithCommas(formattedNumber);
  }

const fetchData = async (): Promise<DrawData[]> => {
  let result;
  try {
    const response = await fetch("https://poolexplorer.xyz/"+CONFIG.CHAINID+"-"+ADDRESS[CONFIG.CHAINNAME].PRIZEPOOL+"-prizeresults");
    result = await response.json();
  } catch (error) {
    console.error("Error fetching data:", error);
  }
  return result;
};

const WEI_TO_ETHER = 1e18; // Use floating point for conversion
const purplePalette = [
  "#6a0dad", // Rich purple
  "#9b30ff", // Lighter purple
  "#bf94e4", // Lilac
  "#d8bfd8", // Thistle
  "#dda0dd", // Plum
  // Add more shades if needed
];

// Pie.register(ChartDataLabels);
ChartJS.register(Tooltip, Legend, ArcElement, ChartDataLabels);
const chartOptions = {
  maintainAspectRatio: true,
  responsive: true,
  aspectRatio: 1.5, // Adjust the aspect ratio as needed

  plugins: {
    legend: {
      display: false, // Hides the legend
    },
    datalabels: {
      color: "black",
      font: {
        weight: "bold",
        size: 18,
      },
      formatter: (value: any, context: any) => {
        const total = context.dataset.data.reduce(
          (sum: any, val: any) => sum + val,
          0
        );
        const percentage = ((value / total) * 100).toFixed(1);
        return `Tier ${context.dataIndex + 1}\n${percentage}%`;
      },
      anchor: "end",
      align: "end",
      offset: 8,
      labels: {
        title: {
          color: "black",
          font: {
            size: 14,
          },
        },
      },
    },
  },
  layout: {
    padding: {
      top: 100,
      right: 20,
      bottom: 20,
      left: 20,
    },
  },
  tooltips: {
    titleFontColor: "black",
    bodyFontColor: "black",
    callbacks: {
      label: function (tooltipItem: any, data: any) {
        const label = data.labels[tooltipItem.index] || "";
        const value =
          data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
        const total = data.datasets[0].data.reduce(
          (sum: any, val: any) => sum + val,
          0
        );
        const percentage = ((value / total) * 100).toFixed(1) + "%";
        return label + ": " + value + " (" + percentage + ")";
      },
    },
  },
};

const calculateTotals = (tierStats: { [key: string]: TierStats }) => {
  // Initialize totals object
  const totals = {
    averageWon: 0,
    medianWon: 0,
    totalWon: 0,
    averageClaimed: 0,
    medianClaimed: 0,
    totalClaimed: 0,
    countWon: 0,
    countClaimed: 0,
  };

  // Aggregate values from each tier
  Object.values(tierStats).forEach((stats) => {
    totals.totalWon += stats.totalWon;
    totals.totalClaimed += stats.totalClaimed;
    totals.countWon += stats.totalWins;
    totals.countClaimed += stats.totalClaims;
  });

  // Calculate averages and medians
  totals.averageWon = totals.totalWon / totals.countWon;
  totals.averageClaimed = totals.totalClaimed / totals.countClaimed;

  // Sort the values to calculate medians
  let wonValues = ([] as number[]).concat(
    ...Object.values(tierStats).map((stats) => stats.valuesWon)
  );
  let claimedValues = ([] as number[]).concat(
    ...Object.values(tierStats).map((stats) => stats.valuesClaimed)
  );
  
  wonValues.sort((a, b) => a - b);
  claimedValues.sort((a, b) => a - b);
  totals.medianWon = calculateMedian(wonValues);
  totals.medianClaimed = calculateMedian(claimedValues);

  return totals;
};

function calculateStats(data: DrawData[]): { [key: string]: TierStats } {
  const tierStats: { [key: string]: TierStats } = {};

  data.forEach((draw) => {
    // Sort tiers by their keys and remove the last two tiers
    const sortedTiers = Object.keys(draw.tiers).sort((a, b) => Number(a) - Number(b));
    const tiersToConsider = sortedTiers.slice(0, -2); // Remove last two tiers

    tiersToConsider.forEach((tier) => {
      const tierData = draw.tiers[tier];
      if (!tierStats[tier]) {
        tierStats[tier] = {
          averageWon: 0,
          medianWon: 0,
          totalWon: 0,
          averageClaimed: 0,
          medianClaimed: 0,
          totalClaimed: 0,
          totalWins: 0,
          totalClaims: 0,
          valuesWon: [],
          valuesClaimed: [],
          highestWon: 0,
          lowestWon: Number.MAX_VALUE,
          highestClaimed: 0,
          lowestClaimed: Number.MAX_VALUE,
        };
      }

      const value = parseInt(tierData.value) / WEI_TO_ETHER; // Convert to Ether
      const wins = parseInt(tierData.totalWins, 10);
      const claims = parseInt(tierData.totalClaims, 10);

      tierStats[tier].highestWon = Math.max(tierStats[tier].highestWon, value);
      tierStats[tier].lowestWon = Math.min(tierStats[tier].lowestWon, value);
      tierStats[tier].highestClaimed = Math.max(tierStats[tier].highestClaimed, value);
      tierStats[tier].lowestClaimed = Math.min(tierStats[tier].lowestClaimed, value);
      
      tierStats[tier].totalWins += wins;
      tierStats[tier].totalClaims += claims;
      tierStats[tier].totalWon += value * wins;
      tierStats[tier].totalClaimed += value * claims;

      for (let i = 0; i < wins; i++) {
        tierStats[tier].valuesWon.push(value);
      }
      for (let i = 0; i < claims; i++) {
        tierStats[tier].valuesClaimed.push(value);
      }
    });
  });

  Object.keys(tierStats).forEach((tier) => {
    const stats = tierStats[tier];
    stats.averageWon = calculateAverage(stats.valuesWon);
    stats.medianWon = calculateMedian(stats.valuesWon);
    stats.averageClaimed = calculateAverage(stats.valuesClaimed);
    stats.medianClaimed = calculateMedian(stats.valuesClaimed);
    stats.totalWon = stats.valuesWon.reduce((acc, val) => acc + val, 0);
    stats.totalClaimed = stats.valuesClaimed.reduce((acc, val) => acc + val, 0);
  });

  return tierStats;
}

  
function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  values.sort((a, b) => a - b);
  const half = Math.floor(values.length / 2);
  if (values.length % 2) {
    return values[half];
  }
  return (values[half - 1] + values[half]) / 2.0;
}
export const PrizeTierResults = () => {
    const [isMobile, setIsMobile] = useState(false);
    const [isDataLoaded, setIsDataLoaded] = useState(false);


    useEffect(() => {
      // Update the state based on window width
      const handleResize = () => {
        setIsMobile(window.innerWidth <= 768); // Adjust 768px based on your mobile breakpoint
      };
  
      // Set the initial value
      handleResize();
  
      // Add event listener
      window.addEventListener('resize', handleResize);
  
      // Remove event listener on cleanup
      return () => window.removeEventListener('resize', handleResize);
    }, []);
  const [tierStats, setTierStats] = useState<{ [key: string]: TierStats }>({});
  // Initialize the chart data states with the correct format
  const [awardedChartData, setAwardedChartData] = useState({
    labels: [],
    datasets: [
      { label: "Total Awarded by Tier", data: [], backgroundColor: [] },
    ],
  });

  const [claimedChartData, setClaimedChartData] = useState({
    labels: [],
    datasets: [
      { label: "Total Claimed by Tier", data: [], backgroundColor: [] },
    ],
  });

  // const [tierLiquidity, setTierLiquidity] = useState<{
  //   [tier: string]: number;
  // }>({});
  // const fetchTierLiquidity = async (tiers: string[]) => {
  //   // Ensure Tier 0 is always included
  //   if (!tiers.includes("0")) {
  //     tiers = ["0", ...tiers];
  //   }

  //   const multicallRequests = tiers.map((tier) =>
  //     CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].getTierRemainingLiquidity(
  //       parseInt(tier)
  //     )
  //   );

  //   const results = await Multicall(multicallRequests, CONFIG.CHAINNAME);
  //   const liquidityData = results.map((result) =>
  //     ethers.utils.formatEther(result)
  //   );

  //   // Update state with liquidity data
  //   const liquidityObject = tiers.reduce((obj: any, tier, index) => {
  //     obj[tier] = liquidityData[index];
  //     return obj;
  //   }, {});

  //   console.log("liquidity", liquidityObject);
  //   setTierLiquidity(liquidityObject);
  // };

  useEffect(() => {
    fetchData().then((data) => {
      const stats = calculateStats(data);
      setTierStats(stats);
      updateChartData(stats);

      // Derive number of tiers and fetch liquidity
      // fetchTierLiquidity(Object.keys(stats));
      setIsDataLoaded(true); // Set to true once data is ready

    });
  }, []);
  const updateChartData = (stats: { [key: string]: TierStats }) => {
    const labels = Object.keys(stats);
    const totalAwardedData = labels.map((label) => stats[label].totalWon);
    const totalClaimedData = labels.map((label) => stats[label].totalClaimed);

    // setAwardedChartData({
    //   labels,
    //   datasets: [
    //     {
    //       label: "Total Awarded by Tier",
    //       data: totalAwardedData,
    //       color: "black",
    //       backgroundColor: purplePalette,
    //     },
    //   ],
    // });

    // setClaimedChartData({
    //   labels,
    //   datasets: [
    //     {
    //       label: "Total Claimed by Tier",
    //       data: totalClaimedData,
    //       backgroundColor: purplePalette,
    //     },
    //   ],
    // });
  };
  const totals = calculateTotals(tierStats);


  return (
    <div      className="draw-table wide-table claims-table"

 
    style={{ maxWidth:"640px",padding: "15px 10px 15px 10px",marginTop:"15px", backgroundColor: "white", fontSize: isMobile ? "11px":"19px" }}>
    {isDataLoaded ? (

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          maxWidth: "640px",
          margin: "auto",
        }}>
        <div style={styles.tableHeader}>
        <div style={{ minWidth: isMobile ? "90px" : "130px" }}></div>{" "}

          {/* Placeholder for 'Tier' label */}
          {/* <div style={styles.statCell}>High</div>
          <div style={styles.statCell}>Low</div> */}
      
      <div style={styles.statCell}>Prizes</div>

          <div style={styles.statCell}>Average</div>
          <div className="hidden-mobile" style={styles.statCell}>Median</div>
          <div style={styles.totalCell}>Total</div>
        </div>
       
        {Object.entries(tierStats)
          .filter(([tier]) => tier !== "null") // Add this line to filter out the 'null' tier
          .map(([tier, stats]) => (
            <div
              key={tier}
              style={{
                display: "flex",
                flexDirection: "column",
                padding: "10px 12px 0px 12px",
              }}>
              <div
                style={{
                    textAlign: "left",
                 
                  paddingBottom: "5px",
                }}><FontAwesomeIcon
                icon={faAward}
                size="sm"
                style={{
                  color: TierColors[tier], // Set color based on the tier
                  height: "18px",
                  marginRight: "8px",
                  paddingTop: "4px"
                }}
              />
                    <span style={{ fontWeight: "bold",}}>{`Tier ${tier}`}</span>&nbsp;<span style={{fontSize:'13px'}}>({(stats.totalClaimed/totals.totalClaimed*100).toFixed(2)}%)</span> 
                    </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {/* <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "5px 0",
                  }}>
                 <div style={{ textAlign: "left",minWidth: isMobile ? "90px" : "130px" }}>Awarded</div>
                  <div style={styles.statCell}>{NumberWithCommas(stats.totalWins.toString())}</div> */}

                  {/* <div style={styles.statCell}>
                    <PrizeIcon size={isMobile?12:15}/>
                    &nbsp;
                    {stats.highestWon > 99
                      ? stats.highestWon.toFixed(0)
                      : stats.highestWon.toFixed(2)}
                  </div>
                  <div style={styles.statCell}>
                    <PrizeIcon size={isMobile?12:15}/>
                    &nbsp;
                    {stats.lowestWon > 99
                      ? stats.lowestWon.toFixed(0)
                      : stats.lowestWon.toFixed(2)}
                  </div> */}
                  {/* <div style={styles.statCell}>
                    <PrizeIcon size={isMobile?12:15}/>
                    &nbsp;
                    {formater(stats.averageWon)}
                  </div>
                  <div className="hidden-mobile" style={styles.statCell}>
                    <PrizeIcon size={isMobile?12:15}/>
                    &nbsp;
                    {formater(stats.medianWon)}
                  </div>
                  <div style={styles.totalCell}>
                    <PrizeIcon size={isMobile?12:15}/>
                    &nbsp;{formater(stats.totalWon)}
                  </div>
                </div> */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "5px 0px 22px 0px",
                    
                    borderBottom: "1px solid #ccc",

                  }}>
                 <div style={{ textAlign: "left",minWidth: isMobile ? "90px" : "130px", fontSize: "16px" }}>&nbsp;&nbsp;&nbsp;
                 {((stats.totalClaimed / stats.totalWon) * 100).toFixed(0)}%
                    Claimed
                  </div>
                  <div style={styles.statCell}>{NumberWithCommas(stats.totalClaims.toString())} </div>

                  {/* <div style={styles.statCell}>
                    <PrizeIcon size={isMobile?12:15}/>
                    &nbsp;
                    {stats.highestClaimed > 99
                      ? stats.highestClaimed.toFixed(0)
                      : stats.highestClaimed.toFixed(2)}
                  </div>
                  <div style={styles.statCell}>
                    <PrizeIcon size={isMobile?12:15}/>
                    &nbsp;
                    {stats.lowestClaimed > 99
                      ? stats.lowestClaimed.toFixed(0)
                      : stats.lowestClaimed.toFixed(2)}
                  </div> */}
                  <div style={styles.statCell}>
                    <PrizeIcon size={isMobile?12:15}/>
                    &nbsp;
                    {formater(stats.averageClaimed)}
                  </div>
                  <div className="hidden-mobile" style={styles.statCell}>
                    <PrizeIcon size={isMobile?12:15}/>
                    &nbsp;
                    {formater(stats.medianClaimed)}
                  </div>
                  <div style={styles.totalCell}>
                    <PrizeIcon size={isMobile?12:15}/>
                    &nbsp;{formater(stats.totalClaimed)}
                    
                  </div>
                </div>
              </div>
            </div>
          ))}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "10px 12px 0px 12px",
          }}>
          <div style={{ textAlign: "left",fontWeight: "bold", paddingBottom: "5px" }}>Totals</div>
          {/* <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "5px 0",
            }}>
           <div style={{ textAlign: "left",minWidth: isMobile ? "90px" : "130px" }}>Awarded</div>
            <div style={styles.statCell}>{formater(totals.countWon)}</div>

            <div style={styles.statCell}>
            <PrizeIcon size={isMobile?12:15}/>
              &nbsp;
              {totals.averageWon.toFixed(4)}
            </div>
            <div className="hidden-mobile" style={styles.statCell}>
              {" "}
              <PrizeIcon size={isMobile?12:15}/>
              &nbsp;
              {totals.medianWon.toFixed(4)}
            </div>
            <div style={styles.totalCell}>
              {" "}
              <PrizeIcon size={isMobile?12:15}/>
              &nbsp;
              {formater(totals.totalWon)}            </div>
          </div> */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "5px 0",
            }}>
            <div style={{ textAlign: "left",minWidth: isMobile ? "90px" : "130px", fontSize: "16px" }}>&nbsp;&nbsp;&nbsp;
            {((totals.totalClaimed / totals.totalWon) * 100).toFixed(0)}%
              Claimed
              
            </div>
            <div style={styles.statCell}>{formater(totals.countClaimed)}</div>

            <div style={styles.statCell}>
              {" "}
              <PrizeIcon size={isMobile?12:15}/>
              &nbsp;
              {totals.averageClaimed.toFixed(4)}
            </div>
            <div className="hidden-mobile" style={styles.statCell}>
              {" "}
              <PrizeIcon size={isMobile?12:15}/>
              &nbsp;
              {totals.medianClaimed.toFixed(4)}
            </div>
            <div style={styles.totalCell}>
              {" "}
              <PrizeIcon size={isMobile?12:15}/>
              &nbsp;
              {formater(totals.totalClaimed)}
            </div>
          </div>
        </div>
      </div>
     
    
   
    ) : (
      <div></div>  // Loading indicator
    )}
  </div>)
};
const styles: { [key: string]: CSSProperties } = {
  pieChartContainer: {
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    flexWrap: "wrap",
    maxWidth: "1000px", // Max width for the container
    margin: "auto",
  },
  pieChart: {
    width: "100%", // Full width on small screens
    maxWidth: "500px", // Half of the container's max width
    margin: "20px 0", // Margin for spacing between charts
  },
  tableContainer: {
    display: "flex",
    flexDirection: "column",
    maxWidth: "600px", // or the width you prefer
    margin: "auto", // to center the table on the page
  },
  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    padding: "5px 15px 10px 15px",
    borderBottom: "1px solid #ccc",
    
    fontWeight: "bold",
  },

  tierContainer: {
    display: "flex",
    flexDirection: "column",
    padding: "10px 10px 0px 10px",

  },
  tierLabel: {
    fontWeight: "bold",
    paddingBottom: "5px",
  },
  statsContainer: {
    display: "flex",
    flexDirection: "column",
  },
  statRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "2px 10px 0px 10px",
  },
  centered: {
    textAlign: "center",
    flex: 1, // This ensures that each flex item can grow equally
  },
  rightAligned: {
    textAlign: "right",
    flex: 1, // This also can grow equally but the text will be aligned to the right
  },
  statLabel: {
    minWidth: "60px", // Ensure enough space for 'Won' and 'Claimed' labels
  },
  statCell: {
    flex: 1,
    textAlign: "center", // This will center the text in the cells
    // padding: '5px 0', // Add padding for better spacing
  },
  totalCell: {
    flex: 1,
    textAlign: "right", // This will right-align the text in the cells
    // padding: '5px 10px', // Add padding for better spacing, extra on the right
  },
};


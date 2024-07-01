import React, { useEffect, useState } from "react";
import { CropDecimals } from "../utils/tokenMaths";
import Layout from "./index";
import { NumberWithCommas } from "../utils/tokenMaths";
import Link from 'next/link';
import {CONFIG} from "../constants/config"
import {ADDRESS} from "../constants/address"
import {ethers} from "ethers"
import { PrizeToke } from "../utils/tokenMaths";
import PrizeIcon from "../components/prizeIcon";

import Image
 from "next/image";
interface Draw {
  draw: string;
  indicesWonPerTier: { [tier: string]: number };
  totalValue: number;
  prizeWins: number;
  totalValueClaimed: number;
  totalPayout: string;
  totalFee: string;
  wins: number;
  tiersWon: [number];
  uniqueWinners: number;
}

const chainNumber = CONFIG.CHAINID;

const History: React.FC = () => {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [totalIndicesWon, setTotalIndicesWon] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<ethers.BigNumber>(ethers.BigNumber.from("0"));
  const [totalPrizesWon, setTotalPrizesWon] = useState<number>(0);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `https://poolexplorer.xyz/${chainNumber}-${ADDRESS[CONFIG.CHAINNAME].PRIZEPOOL}-history`
        );
        const data: Draw[] = await response.json();
        // console.log("history fetched",data)
        const sortedDraws = data.sort((a, b) => +b.draw - +a.draw); // Sort draws by draw number descending
        setDraws(sortedDraws);
        calculateTotals(sortedDraws);
      } catch (error) {
        console.error("Error fetching draw history:", error);
      }
    };

    fetchData();
  }, []);

  const calculateTotals = (draws: Draw[]) => {
    let totalPrizes = 0;
    let totalValue = ethers.BigNumber.from("0");
    
    draws.forEach((draw) => {
       
        if (draw.totalPayout) {
          totalPrizes += draw.wins
            totalValue = totalValue.add(ethers.BigNumber.from(draw.totalPayout));
        }
    });
    
    // console.log("total prizes", totalPrizes.toString());
    setTotalPrizesWon(totalPrizes);
    
    // setTotalIndicesWon(totalIndices);
    setTotalAmount(totalValue);
  };

  // const calculateTotalIndices = (indicesWonPerTier: { [tier: string]: number }) => {
  //   let totalIndices = 0;
  //   for (const tier in indicesWonPerTier) {
  //     totalIndices += indicesWonPerTier[tier];
  //   }
  //   return totalIndices;
  // };

  return (<Layout>
     <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
        <Image
            src={`/images/divingboard.png`}
            height={100}
            width={100}
            alt="liquidator"
            style={{ verticalAlign: "middle" }}
          />
          <h1 style={{ margin: "0 0 0 10px", lineHeight: "50px" }}>
            HISTORY
          </h1></div>
<center>
  <div className="stats-container">
    {totalPrizesWon > 0 && <>
      <div className="stats" style={{color:"white"}}>
        <div className="stat">
        Total Prizes<br></br>
        <span className="stat-value">{NumberWithCommas(totalPrizesWon.toString())}</span>
        </div>
      </div></>
    }
      {/* {totalIndicesWon > 0 &&
      <div className="stats hidden-mobile" style={{color:"white"}}>
        <div className="stat">
        Total Indices<br></br>
        <span className="stat-value">{NumberWithCommas(totalIndicesWon.toString())}</span>
        </div>
      </div>} */}
      {totalAmount.gt(0) && <>
      <div className="stats" style={{color:"white"}}>
        <div className="stat">
        Total Won<br></br>
        <span className="stat-value"><PrizeIcon size={26}/>&nbsp;{PrizeToke(BigInt(totalAmount.toString()))}</span>
        </div>
      </div>
<div className="hidden-mobile">
<div className="stats" style={{color:"white"}}>
<div className="stat">
Average Per Draw<br></br>
<span className="stat-value"><PrizeIcon size={28}/>&nbsp;
<span>{PrizeToke(BigInt(totalAmount.div(ethers.BigNumber.from(draws.length.toString())).toString()))}</span>

</span>
</div>
</div></div>

</>
      
      }
      </div>
      </center>

      <div className="draw-history">

      <table className="draw-table">
        <thead>
          <tr>
            <th>Draw</th>
            <th className="hidden-mobile">Tiers Won</th>
            <th className="hidden-mobile">Unique Winners</th>
            <th>Prizes Won</th>
            {/* <th className="hidden-mobile">Indices</th> */}
            <th className="amount-header">Amount</th>
          </tr>
        </thead>
        <tbody>
        {draws.map((draw) => (
    <tr 
        key={draw.draw} 
        className="row-link" 
        onClick={() => window.location.href=`/winners?draw=${draw.draw}&chain=${CONFIG.CHAINID}`}
    >
        <td><span className="hidden-mobile">Draw&nbsp;</span><span className="hidden-desktop">#</span>{draw.draw}</td>
        <td className="hidden-mobile">
          &nbsp;&nbsp;&nbsp;{draw.tiersWon.length > 0 ? draw.tiersWon.join(", ") :""}
          </td>
          <td className="hidden-mobile">&nbsp;&nbsp;&nbsp;
{draw.uniqueWinners > 0 && draw.uniqueWinners}
</td>
        <td>
          &nbsp;&nbsp;{draw.wins > 0 && NumberWithCommas(draw.wins.toString())}
</td>
        {/* <td className="hidden-mobile">{calculateTotalIndices(draw.indicesWonPerTier)}</td> */}
        <td className="amount">
            {parseInt(draw.totalPayout) > 0 && <><PrizeIcon size={16}/>
            &nbsp;{NumberWithCommas(CropDecimals(Number(draw.totalPayout)/1e18))}</>}
        </td>
    </tr>
))}

</tbody>

      </table>
      <style jsx>{`
    .draw-history {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-top: 10px;
    }

    .stats {
        margin-bottom: 20px;
        display: inline-block;
        padding-bottom: 20px;
        margin-left: 20px;
    }
    .stats-container {
      display: flex;
      justify-content: center;// Align items to the start of the container
      align-items: flex-end; // Vertically align items to the bottom
      flex-wrap: no-wrap; // Keep items on the same row
      padding-top: 15px;
    }

    .amount-header,
    .amount {
        white-space: nowrap;
        min-width: 100px; // Adjust this value as needed
        text-align: right!important;
    }

    .draw-table tr.row-link {
        cursor: pointer;
        color: inherit; // Make sure the text color does not change
        text-decoration: none;
    }

    .draw-table tr.row-link:hover {
        background-color: #f0f0f0; // Change to your preferred hover color
    }
`}</style>


    </div></Layout>
  );
};

export default History;

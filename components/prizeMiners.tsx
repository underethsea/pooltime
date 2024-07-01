import React from 'react';
import { NumberWithCommas } from '../utils/tokenMaths';
import PrizeIcon from './prizeIcon';
import { PrizeToke } from '../utils/tokenMaths';
interface MinerData {
  miner: string;
  claimedPrizesCount: number;
  totalClaimedPrizeValue: bigint;
  totalFees: bigint;
}

interface MinersProps {
  minersData: MinerData[];
}

const PrizeMiners: React.FC<MinersProps> = ({ minersData }) => {
    console.log("got data in component",minersData)
  return (
    <div className="win-container">
              <div style={{ maxWidth: "950px" }}>
                <table className="claims-table">
      <thead>
        <tr><th className="hidden-mobile"></th>
          <th>Miner</th>
          <th className="hidden-mobile">Claims</th>
          <th className="hidden-mobile">Value</th>
          <th>Fees</th>
        </tr>
      </thead>
      <tbody>
        {minersData.map((miner, index) => (
          <tr key={index}>
            <td className="hidden-mobile" style={{fontSize:"25px"}}>{index === 0 && <>🥇</>}
                {index === 1 && <>🥈</>}
                {index === 2 && <>🥉</>}
            </td>
            <td><span style={{fontSize:"14px"}}>{miner.miner}</span></td>
            <td className="hidden-mobile">{NumberWithCommas(miner.claimedPrizesCount.toString())}</td>
            <td className="hidden-mobile"><PrizeIcon size={16}/>&nbsp;{PrizeToke(miner.totalClaimedPrizeValue)}</td>
            <td><PrizeIcon size={16}/>&nbsp;{PrizeToke(miner.totalFees)}</td>
          </tr>
        ))}
      </tbody>
    </table></div></div>
  );
};

export default PrizeMiners;

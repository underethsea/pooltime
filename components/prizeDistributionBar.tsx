import React, { useState } from "react";
import { ethers } from "ethers";
import { GetChainName } from "../utils/getChain";
import PrizeValue from "./prizeValue";
import PrizeValueIcon from "./prizeValueIcon";

interface PrizeDistributionBarProps {
  tierData: any[];
  chainName: string;
  isModal?: boolean;
  chance?: any;
  overviewFromContext?: any;
}

const PrizeDistributionBar: React.FC<PrizeDistributionBarProps> = ({
  tierData,
  chainName,
  isModal = false,
  chance,
  overviewFromContext,
}) => {
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);

  if (!tierData || tierData.length === 0) {
    return null;
  }

  // Filter out last 2 tiers (canaries) to match chances vault behavior
  const filteredTierData = tierData.slice(0, tierData.length - 2);
  
  // Get draw period for duration calculation
  const drawPeriodSeconds = overviewFromContext?.overview?.pendingPrize?.[chainName]?.prizes?.drawPeriodSeconds || 86400; // Default to 1 day
  
  // Get duration from chance data if available
  const getDuration = (tierIndex: number) => {
    if (chance && chance.tiers && chance.tiers[tierIndex]) {
      const duration = chance.tiers[tierIndex].duration;
      // Duration from API is in "draws", convert to days
      const durationInDays = Math.round((duration * drawPeriodSeconds) / 86400);
      return durationInDays;
    }
    return null;
  };

  // Calculate normalized distribution using the formula: prize_value * no_of_days * (gp_days / tier_days)
  const segments = filteredTierData.map((tier, index) => {
    const tierDuration = getDuration(index);
    const jackpotDuration = getDuration(0); // GP duration
    
    let normalizedValue = tier.value * tier.count; // Default to original calculation
    
    if (tierDuration && jackpotDuration && jackpotDuration > 0) {
      // Apply the normalization formula: prize_value * no_of_days * (gp_days / tier_days)
      normalizedValue = tier.value * tier.count * (jackpotDuration / tierDuration);
    }
    
    return {
      tierIndex: index,
      value: normalizedValue,
      tierValue: tier.value,
      count: tier.count,
      tierName: index === 0 ? "Jackpot" : `Tier ${index + 1}`,
      duration: tierDuration,
    };
  });

  // Calculate total normalized distribution value
  const totalDistributionValue = segments.reduce((total, segment) => {
    return total + segment.value;
  }, 0);

  // Calculate percentages based on normalized values
  const segmentsWithPercentage = segments.map(segment => ({
    ...segment,
    percentage: totalDistributionValue > 0 ? (segment.value / totalDistributionValue) * 100 : 0,
  }));

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  return (
    <div className={`prize-distribution-container ${isModal ? 'modal-version' : ''}`}>
      <div className="distribution-heading">Distribution</div>
      <div className="distribution-bar" onMouseMove={handleMouseMove}>
        {segmentsWithPercentage.map((segment, index) => (
          <div
            key={index}
            className={`distribution-segment tier-${segment.tierIndex + 1}`}
            style={{ width: `${segment.percentage}%` }}
            onMouseEnter={() => setHoveredSegment(index)}
            onMouseLeave={() => {
              setHoveredSegment(null);
              setMousePosition(null);
            }}
            onClick={() => setHoveredSegment(hoveredSegment === index ? null : index)}
          />
        ))}
      </div>

      {/* Tooltip */}
      {hoveredSegment !== null && mousePosition && (
        <div 
          className="distribution-tooltip"
          style={{
            left: `${mousePosition.x}px`,
            top: `${mousePosition.y - 50}px`,
          }}
        >
          <div className="tooltip-content">
            <div className="tooltip-tier-value">
              <PrizeValueIcon
                size={16}
                chainname={chainName}
              />
              <PrizeValue
                amount={BigInt((segmentsWithPercentage[hoveredSegment].tierValue * 1e18).toFixed(0))}
                size={14}
                chainname={chainName}
              />
            </div>
            <div className="tooltip-percentage">
              {segmentsWithPercentage[hoveredSegment].percentage.toFixed(1)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrizeDistributionBar;

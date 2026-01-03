import React, { useEffect, useState, useMemo } from "react";
import { useAccount } from "wagmi";
import { useOverview } from "./contextOverview";
import { useRewards } from "./contextRewards";
import { GetChainName } from "../utils/getChain";
import { CropDecimals, NumberWithCommas } from "../utils/tokenMaths";
import RewardsModal from "./rewardsModal";

interface RewardsButtonProps {
  address: string;
}

const RewardsButton: React.FC<RewardsButtonProps> = ({ address }) => {
  const { overview } = useOverview();
  const { fetchRewards, getRewardsForAddress } = useRewards();
  const [showModal, setShowModal] = useState(false);

  // Get cached rewards data or trigger fetch
  const rewardsData = getRewardsForAddress(address);

  useEffect(() => {
    if (address && overview?.prices) {
      fetchRewards(address, overview);
    }
  }, [address, overview?.prices, fetchRewards]);

  const claimableByVault = rewardsData?.claimableByVault || {};
  const isLoading = rewardsData?.isLoading ?? true;

  // Calculate total value of all claimable rewards
  const totalClaimableValue = useMemo(() => {
    if (!overview?.prices?.assets || !claimableByVault) return 0;
    
    let total = 0;
    Object.values(claimableByVault).forEach((rewards) => {
      rewards.forEach((reward) => {
        const chainName = GetChainName(reward.chainId);
        const tokenPrice = overview.prices.assets[chainName]?.[reward.token.toLowerCase()] || 0;
        const amount = parseFloat(reward.amount) || 0;
        total += amount * tokenPrice;
      });
    });
    return total;
  }, [claimableByVault, overview?.prices]);

  // Always show the button - users should be able to check rewards even if loading or value is 0
  // Only hide if we have confirmed there are no rewards AND we're not loading AND modal is not open
  const hasNoRewards = !isLoading && totalClaimableValue <= 0 && Object.keys(claimableByVault).length === 0;
  if (hasNoRewards && !showModal) {
    return null;
  }

  return (
    <>
      <div
        className="box-header custom-link win-bubble"
        style={{ width: "fit-content", padding: "5px 10px", display: "flex", alignItems: "center", marginTop: "8px" }}
        onClick={() => setShowModal(true)}
      >
        &nbsp;REWARDS&nbsp;
        {totalClaimableValue > 0 && (
          <>${NumberWithCommas(CropDecimals(totalClaimableValue.toFixed(2)))}</>
        )}
      </div>
      {showModal && (
        <RewardsModal address={address} onClose={() => setShowModal(false)} />
      )}
    </>
  );
};

export default RewardsButton;


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

  if (isLoading || totalClaimableValue <= 0) {
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
        ${NumberWithCommas(CropDecimals(totalClaimableValue.toFixed(2)))}
      </div>
      {showModal && (
        <RewardsModal address={address} onClose={() => setShowModal(false)} />
      )}
    </>
  );
};

export default RewardsButton;


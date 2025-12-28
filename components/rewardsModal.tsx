import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import AccountRewards from "./account/AccountRewards";
import { useOverview } from "./contextOverview";
import { useRewards } from "./contextRewards";

interface RewardsModalProps {
  address: string;
  onClose: () => void;
}

const RewardsModal: React.FC<RewardsModalProps> = ({ address, onClose }) => {
  const { overview } = useOverview();
  const { fetchRewards, getRewardsForAddress } = useRewards();

  // Get cached rewards data or trigger fetch
  const rewardsData = getRewardsForAddress(address);

  useEffect(() => {
    if (address && overview?.prices) {
      fetchRewards(address, overview);
    }
  }, [address, overview?.prices, fetchRewards]);

  const vaults = rewardsData?.vaults || [];
  const ticketVaults = rewardsData?.ticketVaults || [];
  const promotionsByVault = rewardsData?.promotionsByVault || {};
  const claimableByVault = rewardsData?.claimableByVault || {};
  const isLoading = rewardsData?.isLoading ?? true;

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  }, []);

  const modalContentStyle = isMobile
    ? { ...styles.modalContent, ...styles.modalContentMobile }
    : styles.modalContent;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        {isMobile && (
          <button onClick={onClose} style={styles.closeButton}>
            &times;
          </button>
        )}
        <div style={{ backgroundColor: "#030526", paddingTop: isMobile ? "0" : "0" }}>
          <AccountRewards
            address={address}
            ticketVaults={ticketVaults}
            promotionsByVault={promotionsByVault}
            claimableByVault={claimableByVault}
            loading={isLoading}
            canClaim={true}
            isModal={true}
            isMobile={isMobile}
          />
        </div>
      </div>
    </div>
  );
};

const styles: any = {
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    color: "white",
    maxWidth: "500px",
    border: "3px solid #fbf9fd",
    width: "75%",
    backgroundColor: "#030526",
    padding: "20px 20px 20px 20px",
    margin: "10px 10px 10px 10px",
    borderRadius: "25px",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
    position: "relative",
    textAlign: "center",
    maxHeight: "85%",
    overflow: "auto",
    scrollbarWidth: "none", 
    msOverflowStyle: "none",
  },
  modalContentMobile: {
    width: "100%",
    height: "100%",
    maxWidth: "100vw",
    maxHeight: "100vh",
    margin: 0,
    borderRadius: 0,
    border: "none",
    padding: "50px 15px 20px 15px",
  },
  closeButton: {
    position: "fixed",
    top: "15px",
    right: "15px",
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: "30px",
    cursor: "pointer",
    zIndex: 1002,
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};

export default RewardsModal;


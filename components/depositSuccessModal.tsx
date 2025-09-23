import React, { useState, useEffect } from "react";
import {
  TwitterShareButton,
  WarpShareButton,
  HeyShareButton,
} from "./socialShareButtons";
import Image from "next/image";

import { NumberWithCommas, CropDecimals } from "../utils/tokenMaths";
interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  amount: string;
  hash: string;
}

const messageOptions = [
  "I made the decision I want to win and deposited my tokens to {handle} with https://pooltime.app",
  "Just joined the party at {handle} using https://pooltime.app",
  "No reason to leave tokens idle in my wallet, I've deposited to {handle} for a chance to win using https://pooltime.app",
];

export const DepositSuccessModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  symbol,
  amount,
  hash,
}) => {
  const [randomMessage, setRandomMessage] = useState("");

  useEffect(() => {
    // Randomize the message when the modal opens
    if (isOpen) {
      const randomIndex = Math.floor(Math.random() * messageOptions.length);
      setRandomMessage(messageOptions[randomIndex]);
    }
  }, [isOpen]);

  const customizeMessage = (platform: string) => {
    let handle = "";
    switch (platform) {
      case "twitter":
        handle = "@pooltogether_";
        break;
      case "warpcast":
        handle = "Pooltogether";
        break;
      case "hey":
        handle = "@pooltogether";
        break;
      default:
        handle = "@pooltogether";
    }
    return randomMessage.replace("{handle}", handle);
  };
  if (!isOpen) return null;

  return (
    <>
      <div style={styles.modalOverlay} onClick={onClose}>
        <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div style={styles.modalHeader}>
            <Image
              src={"/images/poolerson.png"}
              className="emoji"
              alt="r"
              width={40}
              height={50}
            />
            <div style={styles.headerText}>
              <span>
                DEPOSIT SUCCESS
                {/* {hash.length>0 &&  
<a
                            href={`${ADDRESS[CONFIG.CHAINNAME].ETHERSCAN}/tx/${hash}`}
                            target="_blank"
                            rel="noreferrer">&nbsp;<Image
            src="/images/etherscan.svg"
            height={18}
            width={18}
            alt="etherscan"
          /></a>} */}
              </span>
              {/* {selectedWinValue && GetChainName(Number(selectedWinValue.network))} */}
            </div>

            <button style={styles.closeModalButton} onClick={onClose}>×</button>
          </div>

          <p>
            {/* <Image
src={"/images/pool.png"}
className="emoji"
alt="r"
width={44}
height={44}
/> */}
            &nbsp;
            {Number(amount) > 0 && (
              <span style={styles.winValue}>
                {NumberWithCommas(CropDecimals(parseFloat(amount)))}
              </span>
            )}{" "}
            {symbol}
          </p>
          <p>
            <span style={styles.modalTier}>
              {/* DRAW #{selectedWinValue ? selectedWinValue.draw : 'N/A'} &nbsp;&nbsp;&nbsp; */}
              {/* <FontAwesomeIcon
                icon={faAward}
                size="sm"
                style={{
                  color: 'white',
                  height: "20px",
                  marginRight: "8px",
                }}
              />  */}
              {/* {selectedWinValue ? selectedWinValue.prizes > 1 ? <>{selectedWinValue.prizes} prizes</> : <>{selectedWinValue.prizes} prize</> :'N/A'}  */}
              &nbsp;&nbsp;&nbsp;
              {/* {selectedWinValue && selectedWinValue.tiers.length === 1 ? 
  `Tier ${selectedWinValue.tiers[0]}` : selectedWinValue &&
  `Tiers ${selectedWinValue.tiers.join(', ')}`} */}
              <br></br>
              <TwitterShareButton message={customizeMessage("twitter")} />
              &nbsp;&nbsp;&nbsp;&nbsp;
              <HeyShareButton message={customizeMessage("hey")} />
              &nbsp;&nbsp;&nbsp;&nbsp;
              <WarpShareButton message={customizeMessage("warpcast")} />
            </span>
          </p>
        </div>
      </div>
    </>
  );
};
const styles: { [key: string]: React.CSSProperties } = {
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
    width: "85%",
    backgroundColor: "#FFFFFF",
    padding: "20px 20px 0px 20px",
    borderRadius: "25px",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
    position: "relative",
    textAlign: "center",
    backgroundImage:
      "linear-gradient(120deg, rgb(147 168 251) 0%, rgb(134 106 219) 100%)",
    overflow: "hidden", // to hide the confetti that falls out of the modal
  },
  modalHeader: {
    position: "relative",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: "10px",
    marginBottom: "20px",
    fontSize: "23px",
    color: "#ceedeb",
  },
  headerText: {
    backgroundColor: "#362448",
    borderRadius: "8px",
    padding: "11px",
  },
  closeModalButton: {
    background: "none",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    color: "#FFF",
    padding: "8px",
    marginLeft: "10px", // give a little space from the text
    marginTop: "0px",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "color 0.2s ease",
  },
  modalTier: {
    fontSize: "19px",
  },
  winValue: {
    fontSize: "58px",
  },
};
const modalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000, // High z-index to be above everything else
  backdropFilter: "blur(2px)", // Blurs the background
};

const modalStyle: React.CSSProperties = {
  width: "300px",
  height: "220px",
  backgroundColor: "#fff",
  padding: "20px",
  borderRadius: "15px", // Rounded border
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "space-around",
};


import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWallet } from "@fortawesome/free-solid-svg-icons";
import { CONTRACTS } from "../constants/contracts";
import { ethers } from "ethers";
import React, { useState, useEffect } from "react";
import { CropDecimals, NumberWithCommas } from "../utils/tokenMaths";
import { GetChainName } from "../utils/getChain";

interface UserProps {
    chain: number;
    address: string;
  }
  
const PrizeTokenBalance: React.FC<UserProps>  = ({ chain,address }) => {
    const chainName = GetChainName(chain);


  const [prizeTokenBalance, setPrizeTokenBalance] = useState<number>(0);
  useEffect(() => {
    async function getBal() {
      try {
        const prizeToken = await CONTRACTS.PRIZETOKEN[chainName].balanceOf(address);
        const formattedBalance = ethers.utils.formatUnits(prizeToken, 18);
        setPrizeTokenBalance(parseFloat(formattedBalance));
      } catch (error) {
        console.error("Error fetching prize token balance:", error);
        setPrizeTokenBalance(0);
      }
    }
  
    getBal();
  }, [chain, address]);
  
  return (
    <>
      {prizeTokenBalance > 0.1 && (
        <span>
          <div className="awesome-icon">
            <FontAwesomeIcon
              icon={faWallet}
              size="sm"
              style={{ color: "#fcfcfd" }}
            />
          </div>

          <span className="awesome-text">
            {NumberWithCommas(CropDecimals(prizeTokenBalance))}{" "}
            POOL
          </span>
        </span>
      )}
    </>
  );
};

export default PrizeTokenBalance;

import React from "react";
import Image from "next/image";
import { useOverview } from "./contextOverview";
import { ADDRESS } from "../constants/address"; // Assuming ADDRESS is imported

interface PrizeValueIconProps {
  size: number;
  chainname?: string; // Optional chainname parameter
}

const PrizeValueIcon: React.FC<PrizeValueIconProps> = ({ size, chainname }) => {
  const { currency, overview } = useOverview();

  // Default values for WETH
  const defaultIcon = "/images/eth.png";
  const defaultSymbol = "weth";

  // Get token details based on chainname (default to WETH if chainname is not provided)
  const prizeTokenSymbol = chainname ? ADDRESS[chainname]?.PRIZETOKEN?.SYMBOL : defaultSymbol;
  const prizeTokenIcon = chainname ? ADDRESS[chainname]?.PRIZETOKEN?.ICON : defaultIcon;

  // Check if the prize token is WETH
  const isWeth = prizeTokenSymbol?.toLowerCase() === "weth";

  // Determine the image source and rendering
  const imageSrc = isWeth ? defaultIcon : prizeTokenIcon;

  // If the currency is ETH, show the prize token icon, otherwise show "$"
  return currency === "ETH" ? (
    <span style={{ marginRight: "5px" }}>
      <Image
        src={imageSrc}
        alt={prizeTokenSymbol?.toUpperCase() || "ETH"}
        width={Math.round(size * 0.75)}
        height={Math.round(size * 0.75)}
      />
    </span>
  ) : (
    <span style={{ fontSize: size.toString() + "px" }}>$</span>
  );
};

export default PrizeValueIcon;

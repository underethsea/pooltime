import React from "react";

type ChainTagProps = {
  chainId: number;
};

const getChainDetails = (chainId: number) => {
  switch (chainId) {
    case 10:
      return { name: "OPTIMISM", bgColor: "#f64154" }; // Red background
    case 8453:
      return { name: "BASE", bgColor: "#437bf6" }; // Blue background
    case 42161:
      return { name: "ARBITRUM", bgColor: "#203147" };
    case 1:
      return { name: "ETHEREUM", bgColor: "black" }
    default:
      return { name: "UNKNOWN", bgColor: "#pink" }; // Default grey background
  }
};

const ChainTag: React.FC<ChainTagProps> = ({ chainId }) => {
  const { name, bgColor } = getChainDetails(chainId);

  return (
    <div
      style={{ display: "inline-block", minWidth: "36px", maxWidth: "36px" }}>
      <span
        style={{
          display: "inline-block",
          backgroundColor: bgColor,
          color: "white",
          padding: "2px 8px",
          borderRadius: "3px",
          transform: "rotate(-90deg)",
          transformOrigin: "center",
          whiteSpace: "nowrap",
          fontSize: "6px",
          lineHeight: "1",
          minWidth: "48px",
          textAlign: "center",
          marginLeft: "-25px",
        }}>
        {name}
      </span>
    </div>
  );
};

export default ChainTag;

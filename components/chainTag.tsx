import React from "react";

type ChainTagProps = {
  chainId: number;
  horizontal?: boolean; // Optional prop for horizontal orientation
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
      return { name: "ETHEREUM", bgColor: "#6e6d70" };
    case 534352: 
    return {name: "SCROLL", bgColor: "#f8cfa0"};
    default:
      return { name: "UNKNOWN", bgColor: "grey" }; // Default grey background
  }
};

const ChainTag: React.FC<ChainTagProps> = ({ chainId, horizontal = false }) => {
  const { name, bgColor } = getChainDetails(chainId);

  const tagStyle: React.CSSProperties = {
    display: "inline-block",
    backgroundColor: bgColor,
    color: "white",
    padding: "2px 8px",
    borderRadius: "3px",
    whiteSpace: "nowrap",
    fontSize: "6px",
    lineHeight: "1",
    textAlign: "center",
    transform: horizontal ? "rotate(0deg)" : "rotate(-90deg)",
    transformOrigin: "center",
    marginLeft: horizontal ? "0" : "-25px",
    minWidth: horizontal ? "auto" : "48px",
  };

  return (
    <div style={{ display: "inline-block" }}>
      <span style={tagStyle}>{name}</span>
    </div>
  );
};

export default ChainTag;

import React from "react";
import { ADDRESS } from "../constants";

type ChainTagProps = {
  chainId: number;
  horizontal?: boolean; // Optional prop for horizontal orientation
};

const getChainDetails = (chainId: number) => {
  const chain = Object.keys(ADDRESS).find(
    (key) => ADDRESS[key].CHAINID === chainId
  );

  if (chain) {
    return {
      name: chain.toUpperCase(),
      bgColor: ADDRESS[chain].COLOR,
    };
  }

  return { name: "UNKNOWN", bgColor: "grey" }; // Default grey background
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

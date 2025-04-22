// components/vaults/VaultRow.tsx
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSquareArrowUpRight } from "@fortawesome/free-solid-svg-icons";
import ChainTag from "../chainTag";
import IconDisplay from "../icons";

type VaultRowProps = {
  name: string;
  poolers: number;
  chainId: number;
  vaultAPR?: string;
  apr?: number;
  showStats: boolean;
};

const VaultRow: React.FC<VaultRowProps> = ({
  name,
  poolers,
  chainId,
  vaultAPR,
  apr,
  showStats,
}) => {
  const isPrizeOrPool = name.startsWith("Prize ") || name.startsWith("PoolTogether");
  const labelOffset = name.startsWith("Prize ") ? 6 : 13;

  const displayName = name.substring(labelOffset);
  const displayValue = displayName.length > 24 ? displayName.slice(0, 22) + "…" : displayName;
  const mobileDisplayValue = displayName.length > 15 ? displayName.slice(0, 24) : displayName;

  return (
    <div>
      <ChainTag chainId={chainId} />
      {isPrizeOrPool ? (
        <>
          &nbsp;
          <span style={{ marginLeft: "-15px" }}>
            <IconDisplay name={displayName} />&nbsp;
          </span>
          <span className="hidden-mobile">{displayValue}</span>
          <span className="hidden-desktop">{mobileDisplayValue}</span>
          <FontAwesomeIcon
            icon={faSquareArrowUpRight}
            size="sm"
            style={{ color: "#1a4160", height: "15px", paddingLeft: "9px" }}
            className="hidden-mobile"
          />
          <span className="hidden-desktop">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "3px",
                paddingLeft: "15px",
              }}
            >
              <div className="vaults-font-small">{poolers} poolers</div>
              <span>
                {vaultAPR && apr !== undefined && (
                  <>
                    {(Number(vaultAPR || 0) + Number(apr * 100)).toFixed(1)}%&nbsp;APR
                  </>
                )}
              </span>
            </div>
          </span>
        </>
      ) : (
        <span>
          <span className="hidden-mobile">{name}</span>
          <span className="hidden-desktop">{mobileDisplayValue}</span>
          <FontAwesomeIcon
            icon={faSquareArrowUpRight}
            size="sm"
            style={{ color: "#1a4160", height: "15px", paddingLeft: "9px" }}
            className="hidden-mobile"
          />
        </span>
      )}
      {showStats && (
        <div className="vaults-font-small hidden-mobile">
          &nbsp;&nbsp;&nbsp;
          <span style={{ verticalAlign: "middle", marginLeft: "30px" }}>
            {poolers > 0 && <>{poolers} poolers</>}
          </span>
        </div>
      )}
    </div>
  );
};

export default React.memo(VaultRow);

import React from "react";
import { Column } from "react-table";
import IconDisplay from "../icons";
import { CropDecimals, NumberWithCommas } from "../../utils/tokenMaths";
import { ethers } from "ethers";
import PrizeValueIcon from "../prizeValueIcon";
import PrizeValue from "../prizeValue";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleInfo,
  faStar,
  faTicket,
} from "@fortawesome/free-solid-svg-icons";
import VaultRow from "./vaultRow";

interface YieldTooltipProps {
  vaultAPR?: number;
  apr?: number;
  total?: number;
  symbol?: string;
}
type VaultData = {
  name: string;
  poolers: number;
  totalSupply: string;
  depositsDollarValue?: string;
  depositsEthValue?: string;
  vault: string;
  decimals: number;
  symbol: string;
  contributed7d: string; // add this line
  contributed24h: string;
  apr: number;
  vaultAPR?: string;
  won7d: string;
  asset: string;
  assetBalance: ethers.BigNumber;
  vaultBalance: ethers.BigNumber;
  assetSymbol: string;
  status?: number;
  c: number;
  formattedAssetBalance?: string;
  numericAssetBalance?: number;
  formattedVaultBalance?: string;
  numericVaultBalance?: number;
  depositsEthBigInt: number;
};
const VaultYieldTooltip: React.FC<YieldTooltipProps> = ({
  vaultAPR,
  apr,
  total,
  symbol,
}) => {
  return total && total > 0 && isFinite(total) && total < 1000000 ? (
    <>
      <div className="vault-tooltip-container">
        <span className="mobile-vault-header">
          APR
          <br />
        </span>
        {total > 0.01 && (
          <>
            {total.toFixed(1)}%&nbsp;
            {apr && apr > 0.0001 ? (
              <FontAwesomeIcon
                icon={faStar}
                style={{ color: "#1a4160", height: "16px" }}
              />
            ) : (
              <FontAwesomeIcon
                icon={faCircleInfo}
                style={{ color: "#1a4160", height: "16px" }}
              />
            )}
            <div className="vault-tooltip-text">
              {vaultAPR && vaultAPR > 0.001 && (
                <div className="vault-tooltip-row">
                  <div>{Number(vaultAPR).toFixed(1)}%</div>
                  <div>Avg Prize Yield</div>
                </div>
              )}
              {apr && apr > 0.0001 && (
                <div className="vault-tooltip-row">
                  <div>{(apr * 100).toFixed(1)}%</div>
                  <div>{symbol} Incentives</div>
                </div>
              )}
              {apr && apr > 0.0001 && vaultAPR && vaultAPR > 0.001 && (
                <>
                  <hr className="vault-tooltip-hr" />
                  <div className="vault-tooltip-row">
                    <div>{total.toFixed(1)}%</div>
                    <div>Total</div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </>
  ) : (
    ""
  );
};

export const getVaultColumns = (showStats: boolean): Column<VaultData>[] => [
  {
    Header: "Vault",
    id: "vaults",
    accessor: "name",
    Cell: ({ row }) => {
      const { name, poolers, c, vaultAPR, apr } = row.original;
      return (
        <VaultRow
          name={name}
          poolers={poolers}
          chainId={c}
          vaultAPR={vaultAPR}
          apr={apr}
          showStats={showStats}
        />
      );
    },
  },
  {
    Header: <div style={{ margin: "0px 0px 0px 30px" }}>Your Tokens</div>,
    id: "tokens",
    accessor: "apr",
    Cell: ({ row }) => {
      const { assetBalance, decimals, assetSymbol, status, formattedAssetBalance } = row.original;
      const assetBalanceDisplay =
        assetBalance && assetBalance.gt(0) && status !== 1 ? (
          <div className="token-container-outer">
            <span className="hidden-mobile">
              <div className="token-container">
                <div className="token-icon-box">
                  <IconDisplay name={assetSymbol} size={20} />
                  {NumberWithCommas(
                    CropDecimals(formattedAssetBalance as string)
                  )}
                </div>
                &nbsp;<div className="animated deposit-button">DEPOSIT</div>
              </div>
            </span>
            <span className="hidden-desktop">
              <div className="token-container-mobile">
                <div className="animated deposit-button-mobile">DEPOSIT</div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                  }}
                  className="hidden-desktop">
                  <span style={{ textAlign: "right" }}>
                    <div className="token-icon-box hidden-desktop">
                      <IconDisplay name={assetSymbol} size={20} />
                      &nbsp;
                      {NumberWithCommas(
                        formattedAssetBalance as string
                        
                      )}
                    </div>
                  </span>
                </div>
              </div>
            </span>
          </div>
        ) : (
          ""
        );
      return (
        <div>
          <div className="token-cell">
            {assetBalance && assetBalance.gt(0) && <>{assetBalanceDisplay}</>}
          </div>
        </div>
      );
    },
  },
  {
    Header: <div style={{ margin: "0px 0px 0px 30px" }}>Your Tickets</div>,
    id: "tickets",
    accessor: (row) =>
      row.vaultBalance?.gt(0) ? row.formattedVaultBalance : 0,
    Cell: ({ value, row }: any) => {
        let display =
        value > 0 ? (
          <>
            <span className="mobile-vault-header">
              Your Tickets
              <br />
            </span>
            <div style={{ display: "flex" }} className="tickets-container">
              <span className="column-tickets" style={{ textAlign: "right" }}>
                <FontAwesomeIcon
                  icon={faTicket}
                  size="sm"
                  style={{
                    color: "#1a4160",
                    height: "17px",
                    marginRight: "3px",
                  }}
                />
                &nbsp;
                {NumberWithCommas(
                  CropDecimals(row.original.formattedVaultBalance)
                )}
              </span>
            </div>
          </>
        ) : (
          ""
        );
      return <div>{display}</div>;
    },
  },
  {
    Header: <div style={{ margin: "0px 30px 0px 0px" }}>Yield</div>,
    id: "yieldAndVaultAPR",
    accessor: (row) => (Number(row.vaultAPR) || 0) + (row.apr || 0) * 100,
    Cell: ({ cell: { value }, row: { original } }: any) => {
        const { vaultAPR, apr, incentiveSymbol } = original;
      return (
        <div className="hidden-mobile">
          <VaultYieldTooltip
            vaultAPR={vaultAPR}
            apr={apr}
            total={value}
            symbol={incentiveSymbol}
          />
        </div>
      );
    },
  },
  {
    Header: "Deposits & TVL",
    id: "depositsAndTVL",
    accessor: (row) => row,
    Cell: ({ value }: { value: any }) => {
        const { totalSupply, depositsEthValue, depositsEthBigInt } = value;
      return (
        <div style={{ textAlign: "right" }}>
          <div>
            {totalSupply || "0"}
          </div>
          <div className="vaults-font-small">
            {depositsEthValue > 0 && (
              <>
                <PrizeValueIcon size={16} />
                <PrizeValue
                  amount={BigInt(depositsEthBigInt)}
                  size={16}
                  rounded={true}
                />
              </>
            )}
          </div>
        </div>
      );
    },
  }
  ,
];

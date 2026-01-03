import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import LoadGrid from "../components/loadGrid";
import TableSkeleton from "../components/tableSkeleton";
import { vaultsAPIFormatted } from "../utils/vaultsFromConstantsAdapter";
// import { useRouter } from "next/router";
import { ethers } from "ethers";
import { useTable, useSortBy, useGlobalFilter } from "react-table";
import { PROVIDERS } from "../constants/providers";
import { ABI } from "../constants/constants";
import { Multicall } from "../utils/multicall";
import { CropDecimals, NumberWithCommas } from "../utils/tokenMaths";
import { getVaultColumns } from "../components/vaults/vaultColumns";
import { useOverview } from "../components/contextOverview";
import { debounce } from "../utils/debounce";
// import VaultModal from "../components/vaultModal.tsx.OLD";
// import Layout from ".";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleInfo,
  faSquareArrowUpRight,
  faArrowAltCircleUp,
  faArrowAltCircleDown,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
// import { FetchPriceForAsset } from "../utils/tokenPrices";
import { GetActivePromotionsForVaults } from "../utils/getActivePromotions";
import { ADDRESS } from "../constants/address";
import { GetVaultBalances } from "../utils/getVaultBalances";
import { useAccount } from "wagmi";
import { GetChainName } from "../utils/getChain";
import PrizeIcon from "../components/prizeIcon";
import IconDisplay from "../components/icons";
import PrizeInPool from "../components/prizeInPool";
// import ChainTag from "../components/chainTag";
import PrizeValueIcon from "../components/prizeValueIcon";
import PrizeValue from "../components/prizeValue";
import Link from "next/link";
import { GetChainIcon } from "../utils/getChain";
import { WHITELIST_REWARDS, WHITELIST_VAULTS } from "../constants/address";
import {
  VaultData,
  sortData,
  getTVLPerChain,
  calculateTotalAndPerChainTVL,
  groupVaultsByChain,
} from "../utils/vaultHelpers";
import TvlModal from "../components/TvlModal";

interface YieldTooltipProps {
  vaultAPR?: number; // Optional number
  apr?: number; // Optional number
  total?: number; // Optional number
  symbol?: string;
}
type VaultsByChain = {
  chainId: number;
  vaults: VaultData[];
};

type ChainTagProps = {
  chainId: number;
};

interface TVL {
  totalTVL: BigInt;
  tvlPerChain: { [chainId: number]: number };
}

// const initialChains = [
//   { chainId: 10, name: "Optimism", active: true, color: "#f1091e" },
//   { chainId: 8453, name: "Base", active: true, color: "#0d59ff" },
//   { chainId: 42161, name: "Arbitrum", active: true, color: "orange" },
//   { chainId: 1, name:"Ethereum", active: true, color: "black"},
//   { chainId: 534352,name:"Scroll",active: true, color: "#f8cfa0"}
//   // { chainId: 421614, name: 'Arbitrum Test', active: true }
// ];

const initialChains = Object.keys(ADDRESS).map((chainName) => {
  const chainData = ADDRESS[chainName];
  return {
    chainId: chainData.CHAINID,
    name: chainName,
    active: chainData.ACTIVE !== undefined ? chainData.ACTIVE : true, // If ACTIVE is not present, default to true
    color: chainData.COLOR,
  };
});

const hasTokens = (vaults: VaultData[]) => {
  return vaults.some(
    (vault) => vault.assetBalance && !vault.assetBalance.isZero()
  );
};

const hasTickets = (vaults: VaultData[]) => {
  return vaults.some(
    (vault) => vault.vaultBalance && !vault.vaultBalance.isZero()
  );
};

// Memoized table row component to prevent unnecessary re-renders
const VaultTableRow = React.memo(({ row, showStats }: { row: any; showStats: boolean }) => {
  return (
    <Link
      href={`/vault?chain=${row.original.c}&address=${row.original.vault}`}
      style={{ textDecoration: "none", color: "inherit" }}>
      <div
        className={`vault-row ${
          !showStats ? "vault-row-tvl-hidden" : ""
        }`}>
        {row.cells.map((cell: any, index: number) => {
          if (
            cell.column.id === "depositsAndTVL" &&
            !showStats
          ) {
            return null;
          } else {
            return (
              <div
                {...cell.getCellProps()}
                data-label={`${cell.column.Header} `}
                key={`${row.original.vault}-${cell.column.id}`}
                className={`vault-cell ${
                  cell.column.id === "depositsAndTVL"
                    ? "vault-deposits-tvl"
                    : cell.column.id === "yieldAndVaultAPR"
                    ? "vault-yield-tvl"
                    : "vault-left-align"
                }`}>
                {cell.column.id === "contributed7d" ? (
                  <>
                    {parseFloat(cell.value) > 0 ? (
                      <>
                        <PrizeIcon size={17} />
                        &nbsp;
                        {NumberWithCommas(
                          CropDecimals(cell.value)
                        )}
                      </>
                    ) : null}
                    {index === 0 && (
                      <span className="vault-hidden-mobile">
                        <FontAwesomeIcon
                          icon={faSquareArrowUpRight}
                          size="sm"
                          style={{
                            color: "#1a4160",
                            height: "15px",
                            paddingLeft: "9px",
                          }}
                        />
                      </span>
                    )}
                  </>
                ) : (
                  <span style={{ width: "100%" }}>
                    {cell.render("Cell")}
                  </span>
                )}
              </div>
            );
          }
        })}
      </div>
    </Link>
  );
});

VaultTableRow.displayName = 'VaultTableRow';

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
          APR<br></br>
        </span>
        {total > 0.01 && (
          <>
            {total.toFixed(1)}%&nbsp;
            {apr && apr > 0.0001 ? (
              <>
                <FontAwesomeIcon
                  icon={faStar}
                  style={{
                    color: "#1a4160",
                    height: "16px",
                    marginRight: "0px",
                  }}
                />
              </>
            ) : (
              <FontAwesomeIcon
                icon={faCircleInfo}
                style={{ color: "#1a4160", height: "16px" }}
              />
            )}
            <div className="vault-tooltip-text">
              {(() => {
                const vaultAPRNum = vaultAPR ? Number(vaultAPR) : 0;
                return vaultAPRNum > 0.001 && isFinite(vaultAPRNum) ? (
                  <div className="vault-tooltip-row">
                    <div>{vaultAPRNum.toFixed(1)}%</div>
                    <div>Avg Prize Yield</div>
                  </div>
                ) : null;
              })()}
              {(() => {
                const aprNum = apr ? Number(apr) : 0;
                return aprNum > 0.0001 && isFinite(aprNum) ? (
                  <div className="vault-tooltip-row">
                    <div>{(aprNum * 100).toFixed(1)}%</div>
                    <div>{symbol} Incentives</div>
                  </div>
                ) : null;
              })()}
              {(() => {
                const vaultAPRNum = vaultAPR ? Number(vaultAPR) : 0;
                const aprNum = apr ? Number(apr) : 0;
                return aprNum > 0.0001 && vaultAPRNum > 0.001 && isFinite(aprNum) && isFinite(vaultAPRNum) ? (
                  <>
                    <hr className="vault-tooltip-hr" />
                    <div className="vault-tooltip-row">
                      <div>{total.toFixed(1)}%</div>
                      <div>Total</div>
                    </div>
                  </>
                ) : null;
              })()}
            </div>
          </>
        )}
      </div>
    </>
  ) : (
    ""
  );
};

function AllVaults() {
  const { overview } = useOverview();
  const [showStats, setShowStats] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 501;
    }
    return false;
  });
  const [data, setData] = useState<VaultData[]>([]);
  const [searchInput, setSearchInput] = useState(() => {
    // Initialize from sessionStorage if available
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('allvaults-search') || "";
    }
    return "";
  });
  // const [poolPrice, setPoolPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Start with false to show UI immediately
  const [tvl, setTvl] = useState<TVL | null>(null);
  const [allVaults, setAllVaults] = useState<VaultData[]>([]);
  const [filteredVaults, setFilteredVaults] = useState<VaultData[]>([]);
  const [chains, setChains] = useState(initialChains);
  const [showAllVaults, setShowAllVaults] = useState(false);
  const [isVaultsLoaded, setIsVaultsLoaded] = useState(0);
  const [showPrzPOOLVaults, setShowPrzPOOLVaults] = useState(false);
  const [isTvlModalOpen, setIsTvlModalOpen] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true); // Track data loading separately


  const { address } = useAccount();
  
  // Memoize the filter function to avoid recreating it on every render
  const filterVaultsByChainAndSearch = useCallback((
    vaults: any,
    activeChains: any,
    searchInput: string,
    przPOOLActive: boolean
  ) => {
    if (przPOOLActive) {
      // Only show vaults with "pool" in the name if the przPOOL toggle is active
      return vaults.filter(
        (vault: any) =>
          vault.name.toLowerCase().includes("pool") &&
          !vault.name.toLowerCase().startsWith("pooltogether")
      );
    }

    // Otherwise, apply normal chain and search filters
    const activeChainIds = activeChains
      .filter((chain: any) => chain.active)
      .map((chain: any) => chain.chainId);

    const searchLower = searchInput.toLowerCase();
    return vaults.filter(
      (vault: any) =>
        activeChainIds.includes(vault.c) &&
        vault.name.toLowerCase().includes(searchLower)
    );
  }, []);

  const toggleChain = (chainId: number) => {
    if (showPrzPOOLVaults) {
      // If przPOOL toggle is active, turn it off and re-enable all chains first
      setShowPrzPOOLVaults(false);
      const updatedChains = chains.map((chain) => ({ ...chain, active: true }));
      setChains(updatedChains);

      // Set filtered vaults to include all vaults since all chains are active
      const filtered = filterVaultsByChainAndSearch(
        allVaults,
        updatedChains,
        searchInput,
        false
      );
      setFilteredVaults(filtered);
    } else {
      // Proceed with regular chain toggling if przPOOL is not active
      const activeChains = chains.filter((chain) => chain.active);

      // If all chains are active, deactivate all except the clicked one
      if (activeChains.length === chains.length) {
        const updatedChains = chains.map((chain) =>
          chain.chainId === chainId
            ? { ...chain, active: true }
            : { ...chain, active: false }
        );
        setChains(updatedChains);
        const filtered = filterVaultsByChainAndSearch(
          allVaults,
          updatedChains,
          searchInput,
          false
        );
        setFilteredVaults(filtered);
      } else {
        // Otherwise, toggle the clicked chain
        const updatedChains = chains.map((chain) =>
          chain.chainId === chainId
            ? { ...chain, active: !chain.active }
            : chain
        );
        setChains(updatedChains);
        const filtered = filterVaultsByChainAndSearch(
          allVaults,
          updatedChains,
          searchInput,
          false
        );
        setFilteredVaults(filtered);
      }
    }
  };

  // const toggleChain = (chainId: number) => {
  //   const activeChains = chains.filter((chain) => chain.active);

  //   // If all chains are active, deactivate all except the clicked one
  //   if (activeChains.length === chains.length) {
  //     const updatedChains = chains.map((chain) =>
  //       chain.chainId === chainId
  //         ? { ...chain, active: true }
  //         : { ...chain, active: false }
  //     );
  //     setChains(updatedChains);
  //     const filtered = filterVaultsByChainAndSearch(
  //       allVaults,
  //       updatedChains,
  //       searchInput
  //     );
  //     setFilteredVaults(filtered);
  //   } else {
  //     // Otherwise, toggle the clicked chain
  //     const updatedChains = chains.map((chain) =>
  //       chain.chainId === chainId ? { ...chain, active: !chain.active } : chain
  //     );
  //     setChains(updatedChains);
  //     const filtered = filterVaultsByChainAndSearch(
  //       allVaults,
  //       updatedChains,
  //       searchInput
  //     );
  //     setFilteredVaults(filtered);
  //   }
  // };

  // const filterVaultsByChainAndSearch = (
  //   vaults: any,
  //   activeChains: any,
  //   searchInput: string
  // ) => {
  //   const activeChainIds = activeChains
  //     .filter((chain: any) => chain.active)
  //     .map((chain: any) => chain.chainId);

  //   return vaults.filter(
  //     (vault: any) =>
  //       activeChainIds.includes(vault.c) &&
  //       vault.name.toLowerCase().includes(searchInput.toLowerCase())
  //   );
  // };
  const togglePrzPOOLVaults = useCallback(() => {
    if (!showPrzPOOLVaults) {
      // Disable all chain toggles and show only "pool" vaults
      const updatedChains = chains.map((chain) => ({ ...chain, active: false }));
      setChains(updatedChains);
      const filtered = filterVaultsByChainAndSearch(
        allVaults,
        updatedChains,
        searchInput,
        true
      );
      setFilteredVaults(filtered);
    } else {
      // Re-enable all chain toggles
      const updatedChains = chains.map((chain) => ({ ...chain, active: true }));
      setChains(updatedChains);
      const filtered = filterVaultsByChainAndSearch(
        allVaults,
        updatedChains,
        searchInput,
        false
      );
      setFilteredVaults(filtered);
    }
    setShowPrzPOOLVaults(!showPrzPOOLVaults);
  }, [showPrzPOOLVaults, chains, allVaults, searchInput, filterVaultsByChainAndSearch]);

  const depositsTVLHeader = useMemo(() => {
    return (
      <div style={{ textAlign: "right" }}>
        Deposits & TVL
        {/* {tvl > 0 && <div>${NumberWithCommas(CropDecimals(tvl))}</div>} */}
      </div>
    );
  }, []);
  const columns = useMemo(() => getVaultColumns(showStats), [showStats]);

  // Memoize table instance to prevent unnecessary recalculations
  const tableInstance = useTable<VaultData>(
    { 
      columns, 
      data: filteredVaults,
    },
    useGlobalFilter,
    useSortBy
  );

  const { setGlobalFilter }: any = tableInstance;
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    tableInstance;

  // Format pricing timestamp for display
  const pricingTimestamp = useMemo(() => {
    if (!overview?.prices?.timestamp) return null;
    try {
      const date = new Date(overview.prices.timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return null;
    }
  }, [overview?.prices?.timestamp]);

  useEffect(() => {
    const fetchData = async () => {
      // Only fetch if overview is available
      if (!overview?.prices) {
        console.log("Waiting for overview prices...");
        return;
      }

      try {
        setIsDataLoading(true);
        const secondsInAYear = 31536000; // 60 * 60 * 24 * 365
        let vaultsResponse: Response | null = null;
        let prices = { geckos: {}, assets: {} };
        let vaults: VaultData[] = vaultsAPIFormatted as any; // Default to static data

        try {
          // Fetch vaults only (prices come from context)
          vaultsResponse = await fetch(`https://poolexplorer.xyz/vaults`);
        } catch (error) {
          console.error("Error during API fetch:", error);
        }

        // Use prices from context overview
        prices = overview.prices;
        const geckoPrices: any = prices.geckos;
        const assetPrices: any = prices.assets;
        // Handle `vaultsResponse` response
        if (vaultsResponse && vaultsResponse.ok) {
          try {
            vaults = await vaultsResponse.json();
          } catch (error) {
            console.error("Failed to parse vaults response:", error);
          }
        } else {
          console.log(
            `Failed to fetch vaults. ${
              vaultsResponse
                ? `Status: ${vaultsResponse.status}`
                : "No response"
            }. Using static data.`
          );
        }
        if (true) {
          const tvlApiValues = vaults.reduce((acc: any, vault: any) => {
            acc[vault.vault] = parseFloat(vault.tvl);
            return acc;
          }, {});

          // Extract vault addresses
          const vaultAddresses = vaults.map((vault: any) => vault.vault);
          // console.log("vault addresses", vaultAddresses);
          const [promotionsResult, multicallResults] = await Promise.allSettled(
            [
              GetActivePromotionsForVaults(
                vaultAddresses,
                true,
                prices,
                false,
                ""
              ),
              Promise.all(
                groupVaultsByChain(vaults).map(
                  async ({
                    chainId,
                    vaults: chainVaults,
                  }: {
                    chainId: number;
                    vaults: VaultData[];
                  }) => {
                    const chainName = GetChainName(Number(chainId));

                    const multicallArray = chainVaults.map(
                      (vault: VaultData) => {
                        // const contract = new ethers.Contract(
                        //   vault.vault,
                        //   ABI.VAULT,
                        //   PROVIDERS[chainName]
                        // );
                        const twabController = new ethers.Contract(
                          ADDRESS[chainName].TWABCONTROLLER,
                          ABI.TWABCONTROLLER,
                          PROVIDERS[chainName]
                        );
                        return twabController.totalSupplyDelegateBalance(
                          vault.vault
                        );
                      }
                    );

                    const totalSupplies = await Multicall(
                      multicallArray,
                      chainName
                    );

                    return { chainId, totalSupplies, chainVaults };
                  }
                )
              ),
            ]
          );

          let activePromotions = [] as any;
          if (promotionsResult.status === "fulfilled") {
            activePromotions = promotionsResult.value;
          } else {
            console.error(
              "Failed to fetch active promotions:",
              promotionsResult.reason
            );
          }

          // Map active promotions back onto the corresponding vaults
          vaults = vaults.map((vault: any) => {
            const vaultAddress = vault.vault.toLowerCase();
            return {
              ...vault,
              activePromotions: activePromotions[vaultAddress] || [],
            };
          });
          // console.log("multicall results", multicallResults);
          const allResults =
            multicallResults.status === "fulfilled"
              ? multicallResults.value
              : [];

          const flattenedVaults = allResults.flatMap(
            ({ chainVaults, totalSupplies }: any) =>
              chainVaults.map((vault: VaultData, index: number) => {
                const totalSupplyDelegate = ethers.BigNumber.from(
                  totalSupplies[index]
                );

                // Convert scientific notation to string (e.g., "4.352277561912243e+21" to "4352277561912243000000")
                const tvlFromApiString =
                  tvlApiValues[vault.vault]?.toString() || "0";
                const tvlFromApi = ethers.BigNumber.from(
                  parseFloat(tvlFromApiString).toLocaleString("fullwide", {
                    useGrouping: false,
                  }) // Convert to string without grouping
                );

                // Compare the API TVL with totalSupplyDelegateBalance using BigNumber's gt() method
                const totalSupplyValue = totalSupplyDelegate.gt(tvlFromApi)
                  ? totalSupplyDelegate
                  : tvlFromApi;

                return {
                  ...vault,
                  totalSupply: totalSupplyValue, // This is used for TVL display
                  totalSupplyDelegate, // This is used for yield/APR calculations
                };
              })
          );

          // Enrich vaults with totalSupplies and other calculations
          const enrichedVaults = flattenedVaults.map((vault) => {
            const chainName = GetChainName(vault.c);
            const totalSupplyDelegateValue = ethers.utils.formatUnits(
              vault.totalSupplyDelegate,
              vault.decimals
            );
            const totalSupplyValue = ethers.utils.formatUnits(
              vault.totalSupply,
              vault.decimals
            );

            const contributed7d = parseFloat(vault.contributed7d);
            const contributed24h = parseFloat(vault.contributed24h);
            const contributed28d = parseFloat(vault.contributed28d);

            // Calculate Prize APR here
            let prizeTokenPriceValue = 0;
            if (
              ADDRESS[chainName] &&
              ADDRESS[chainName].PRIZETOKEN &&
              ADDRESS[chainName].PRIZETOKEN.GECKO
            ) {
              prizeTokenPriceValue = parseFloat(
                geckoPrices[ADDRESS[chainName].PRIZETOKEN.GECKO]?.toString() ||
                  "0"
              );
            }

            let dollarValue = null;
            let ethValue = null;
            let assetPrice: any;
            if (
              assetPrices[chainName] &&
              assetPrices[chainName][vault.asset.toLowerCase()]
            ) {
              assetPrice = assetPrices[chainName][vault.asset.toLowerCase()];
            } else {
              assetPrice = 0;
              // console.log(assetPrices);
              // console.error(
              //   "Asset not found for chain:",
              //   chainName,
              //   "Asset:",
              //   vault.asset.toLowerCase()
              // );
            }
            // const assetPrice = assetPrices[chainName][vault.asset.toLowerCase()];
            if (assetPrice > 0) {
              dollarValue = parseFloat(totalSupplyValue) * assetPrice;
              ethValue = dollarValue / geckoPrices["ethereum"];
            } else {
              dollarValue = 0;
              ethValue = 0;
            }

            let delegateDollarValue = null;
            let delegateEthValue = null;
            if (assetPrice > 0) {
              delegateDollarValue =
                parseFloat(totalSupplyDelegateValue) * assetPrice;
              delegateEthValue = delegateDollarValue / geckoPrices["ethereum"];
            }

            let vaultAPR = null;
            let won7d = null;

            if (
              dollarValue &&
              delegateDollarValue &&
              prizeTokenPriceValue > 0
            ) {
              const depositsDollarValue = parseFloat(
                dollarValue.toString().replace("$", "")
              );

              const depositsDelegateDollarvalue = parseFloat(
                delegateDollarValue.toString().replace("$", "")
              );

              const effectiveContribution =
                contributed7d === 0 && contributed24h === 0
                  ? contributed28d / 4 // Fallback to 28d / 4 if both 7d and 24h contributions are 0
                  : contributed7d === 0
                  ? contributed24h * 7 // Use 24h contribution annualized
                  : contributed24h > contributed7d / 3
                  ? contributed24h * 7 // Use 24h contribution if it's significantly higher than 7d
                  : contributed7d; // Otherwise, use the 7d contribution

              // console.log(
              //   "vault",
              //   vault.vault,
              //   "effective contribution",
              //   effectiveContribution,
              //   "prize token price",
              //   prizeTokenPriceValue,
              //   "deposits delegeate dollar value",
              //   depositsDelegateDollarvalue
              // );
              if (depositsDollarValue > 0 && effectiveContribution > 0) {
                const calculatedAPR =
                  (((365 / 7) * effectiveContribution * prizeTokenPriceValue) /
                    depositsDelegateDollarvalue) *
                  100;

                // Only set vaultAPR if it's a finite number and not too large
                vaultAPR =
                  isFinite(calculatedAPR) && calculatedAPR < 1000000
                    ? calculatedAPR.toFixed(2)
                    : null;
              }
            }
            won7d = vault.won7d;

            const vaultPromotions =
              activePromotions[vault.vault.toLowerCase()] || [];

            let whitelistedPromotions;
            const whitelistedTokens = Object.values(WHITELIST_REWARDS)
              .flat()
              .map((tokenObj) => tokenObj.TOKEN.toLowerCase());

            whitelistedPromotions = vaultPromotions.filter((promo: any) =>
              whitelistedTokens.includes(promo.token.toLowerCase())
            );

            type TokenSymbolMap = {
              [key: string]: string;
            };
            const tokenSymbolMap: TokenSymbolMap = Object.values(
              WHITELIST_REWARDS
            )
              .flat()
              .reduce(
                (
                  acc: TokenSymbolMap,
                  tokenObj: { TOKEN: string; SYMBOL: string }
                ) => {
                  acc[tokenObj.TOKEN.toLowerCase()] = tokenObj.SYMBOL;
                  return acc;
                },
                {}
              );
            let promoTokenSymbol;
            const apr = whitelistedPromotions.reduce((acc: any, promo: any) => {
              const tokensPerSecond = parseFloat(promo.tokensPerSecond);
              const promoTokenPrice = parseFloat(promo.price);
              promoTokenSymbol = tokenSymbolMap[promo.token.toLowerCase()];

              const aprForPromo =
                (tokensPerSecond * secondsInAYear * promoTokenPrice) /
                Math.pow(10, promo.tokenDecimals) /
                (parseFloat(totalSupplyDelegateValue) * parseFloat(assetPrice));
              return acc + aprForPromo;
            }, 0);

            return {
              ...vault,
              activePromotions: vaultPromotions,
              apr: apr || 0,
              totalSupply:
                parseFloat(totalSupplyValue) > 0 ? (
                  <>
                    <IconDisplay name={vault.assetSymbol} />
                    &nbsp;{NumberWithCommas(CropDecimals(totalSupplyValue))}
                  </>
                ) : (
                  ""
                ),
              depositsDollarValue:
                dollarValue && dollarValue > 0
                  ? "$" + NumberWithCommas(CropDecimals(dollarValue))
                  : null,
              depositsEthValue: ethValue
                ? Math.round(ethValue * 1e18).toString()
                : "0",
              depositsEthBigInt: Math.round(
                parseFloat(
                  ethValue ? Math.round(ethValue * 1e18).toString() : "0"
                )
              ),

              contributed7d,
              contributed24h,
              won7d,
              vaultAPR,
              incentiveSymbol: promoTokenSymbol,
            };
          });
          // console.log("enriched vaults", enrichedVaults);
          vaults = sortData(enrichedVaults, geckoPrices, assetPrices);

          setData((prevData) => {
            const newData = vaults;
            if (JSON.stringify(newData) !== JSON.stringify(prevData)) {
              setAllVaults(vaults); // Set the full vault data
              setFilteredVaults(vaults); //
              const tvlData = calculateTotalAndPerChainTVL(newData);
              setTvl(tvlData as TVL);
              if (isVaultsLoaded === 0) {
                setIsVaultsLoaded(1);
              } else {
                setIsVaultsLoaded(2);
              }
              return newData;
            }
            return prevData;
          });
          setIsDataLoading(false);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsDataLoading(false);
      }
    };

    fetchData();
  }, [overview?.prices]);

  useEffect(() => {
    const filtered = filterVaultsByChainAndSearch(
      allVaults,
      chains,
      searchInput,
      showPrzPOOLVaults
    );
    setFilteredVaults(filtered);
  }, [showPrzPOOLVaults, allVaults, chains, searchInput, filterVaultsByChainAndSearch]);

  useEffect(() => {
    const fetchBalances = async (userAddress: any) => {
      // Group vaults by chain
      const vaultsByChain = groupVaultsByChain(allVaults);

      // Create promises for fetching balances for each chain
      const balancePromises = vaultsByChain.map(
        async ({ chainId, vaults: chainVaults }) => {
          const vaultAddresses = chainVaults.map((vault) => vault.vault);
          const assetAddresses = chainVaults.map((vault) => vault.asset);
          const chainName = GetChainName(chainId);

          // Fetch balances for this chain
          const balances = await GetVaultBalances(
            userAddress,
            vaultAddresses,
            assetAddresses,
            chainName
          );

          return { chainId, balances, chainVaults };
        }
      );

      // Fetch all balance results
      const allBalanceResults = await Promise.all(balancePromises);

      // Flatten the results
      const flattenedVaults = allBalanceResults.flatMap(
        ({ balances, chainVaults }) =>
          chainVaults.map((vault) => {
            const balance = balances[vault.vault.toLowerCase()];
            const formattedAssetBalance = balance.tokenBalance
              ? ethers.utils.formatUnits(balance.tokenBalance, vault.decimals)
              : "0";
            const numericAssetBalance = parseFloat(formattedAssetBalance);

            const formattedVaultBalance = balance.vaultBalance
              ? ethers.utils.formatUnits(balance.vaultBalance, vault.decimals)
              : "0";
            const numericVaultBalance = parseFloat(formattedVaultBalance);
            return {
              ...vault,
              assetBalance: balance ? balance.tokenBalance : null, // Add token balance
              vaultBalance: balance ? balance.vaultBalance : null, // Add vault balance
              formattedAssetBalance,
              formattedVaultBalance,
            };
          })
      );

      // Update the state with the new enriched data array
      // console.log("overview for sort", overview);
      let sortedVaults;
      if (
        overview === null ||
        overview.prices === null
      ) {
        console.log("overview is null");
      } else {
        sortedVaults = sortData(
          flattenedVaults,
          overview.prices.geckos,
          overview.prices.assets
        );
        // console.log("sort vaults", sortedVaults);
        setAllVaults(sortedVaults);
      }

      // Apply filtering after updating all vaults
      const filtered = filterVaultsByChainAndSearch(
        sortedVaults,
        chains,
        searchInput,
        showPrzPOOLVaults
      );
      setFilteredVaults(filtered);
    };

    if (address && allVaults.length > 0 && isVaultsLoaded === 1) {
      fetchBalances(address);
    }
  }, [address, isVaultsLoaded]);
  // Memoize filtered vaults to avoid recalculating on every render
  const memoizedFilteredVaults = useMemo(() => {
    return filterVaultsByChainAndSearch(
      allVaults,
      chains,
      searchInput,
      showPrzPOOLVaults
    );
  }, [allVaults, chains, searchInput, showPrzPOOLVaults, filterVaultsByChainAndSearch]);

  useEffect(() => {
    setFilteredVaults(memoizedFilteredVaults);
  }, [memoizedFilteredVaults]);

  // Debounced search handler
  const debouncedSearch = useRef(
    debounce((value: string) => {
      // Turn off przPOOL toggle and reactivate all chains if it was active
      if (showPrzPOOLVaults) {
        setShowPrzPOOLVaults(false);
        setChains(chains.map((chain) => ({ ...chain, active: true })));
      }

      // Cache the search input in sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('allvaults-search', value);
      }
    }, 300)
  ).current;

  const handleSearch = useCallback((event: any) => {
    const value = event.target.value.toLowerCase();
    setSearchInput(value);
    debouncedSearch(value);
  }, [debouncedSearch, showPrzPOOLVaults, chains]);
  return (
    <center>
      <div className="hidden-mobile">
        <div
          className="vault-header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
          <Image
            src={`/images/squarepool.png`}
            height={90}
            width={90}
            alt="pool party"
          />
          &nbsp;&nbsp;
          <h1 style={{ margin: "0 0 0 10px", lineHeight: "120px" }}>
            POOLTIME
          </h1>
        </div>
      </div>
      <br></br>
      <div>
        <div className="vaults-header-container">
          <div className="hidden-mobile-vault-header">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <input
                  value={searchInput}
                  className="vaultsearch"
                  onChange={handleSearch}
                  placeholder="Search..."
                />
                <div className="vaults-chain-toggle">
                  {chains.map((chain) => {
                    const icon = GetChainIcon(chain.chainId);
                    return (
                      <div
                        key={chain.chainId}
                        className={`vaults-chain-option ${
                          chain.active ? "active" : ""
                        }`}
                        onClick={() => toggleChain(chain.chainId)}>
                        {icon && (
                          <Image
                            src={icon}
                            alt={chain.name}
                            width={24}
                            height={24}
                          />
                        )}
                      </div>
                    );
                  })}
                  &nbsp;
                  {/* przPOOL toggle */}
                  <div
                    className={`vaults-chain-option ${
                      showPrzPOOLVaults ? "active" : ""
                    }`}
                    onClick={togglePrzPOOLVaults}>
                    <Image
                      src="/images/pool.png"
                      alt="przPOOL Vaults"
                      width={24}
                      height={24}
                    />
                  </div>
                </div>
              </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0rem",
                  }}>
                  <PrizeInPool compactSize={showStats} />
                {showStats && tvl && parseInt(tvl.totalTVL.toString()) > 0 ? (
              <div
                style={{
                      fontSize: "19px",
                      display: "inline-flex",
                  alignItems: "center",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      color: "white",
                      }}
                      onClick={() => {
                        setShowStats(false);
                      }}>
                    TVL&nbsp;&nbsp;
                    <PrizeValueIcon size={19} />
                      <PrizeValue
                        amount={BigInt(
                          Math.round(Number(tvl.totalTVL))
                        )}
                      size={19}
                        rounded={false}
                      />
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsTvlModalOpen(true);
                        }}
                        style={{
                          cursor: "pointer",
                        marginLeft: "4px",
                        }}>
                        <FontAwesomeIcon
                          icon={faCircleInfo}
                          style={{
                            color: "#ebeeef",
                          height: "14px",
                          }}
                        />
                      </span>
                    </div>
                ) : (
                  tvl && !showStats && (
                    <div className="more">
                      <span
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          setShowStats(true);
                        }}>
                        <a className="custom-link">+nerd data</a>
                      </span>
              </div>
                  )
            )}
              </div>
            </div>
          </div>

          <div className="hidden-desktop-vault-header">
            <div
              className="tvl"
              style={{
                textAlign: "left",
                // backgroundColor: "#e5f3f5",
                color: "white",
                borderRadius: "10px",
                padding: "0px 8px 5px 8px",
                width: "100%",
              }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: '10px', width: 'calc(100% + 16px)', margin: '5px -8px 0' }}>
              <PrizeInPool />

              {tvl &&
              parseInt(tvl.totalTVL.toString()) > 0 &&
              showStats ? (
                <>
                  <div
                    style={{
                      backgroundColor: "#315672",
                      borderRadius: "10px",
                      padding: "10px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                    onClick={() => setIsTvlModalOpen(true)}
                  >
                    <div style={{ fontSize: "14px", marginBottom: '5px', display: 'inline-flex', alignItems: 'center', color: "#afcde4" }}>
                      Total Saved
                    </div>
                    <span>
                      <PrizeValueIcon size={22} />
                      {/* mobile tvl */}
                      <PrizeValue
                        amount={BigInt(Math.round(Number(tvl.totalTVL)))}
                        size={24}
                        rounded={true}
                      />
                    </span>
                  </div>
                </>
              ) : (
                <span style={{ width: "140px" }}></span>
              )}
              </div>
            </div>
            <div
              className="vault-search-container"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                // gap: "1rem",
              }}
            >
              <div className="vaults-chain-toggle">
                {chains.map((chain) => {
                  const icon = GetChainIcon(chain.chainId);
                  return (
                    <div
                      key={chain.chainId}
                      className={`vaults-chain-option ${
                        chain.active ? "active" : ""
                      }`}
                      onClick={() => toggleChain(chain.chainId)}>
                      {icon && (
                        <Image
                          src={icon}
                          alt={chain.name}
                          width={24}
                          height={24}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              <input
                value={searchInput}
                className="vaultsearch"
                onChange={handleSearch}
                placeholder="Search..."
                // style={{ flex: 1 }}
              />
            </div>
            {tvl && !showStats && (
              <div className="more">
                <span
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    setShowStats(true);
                  }}>
                  <a className="custom-link">+ data</a>
                </span>
              </div>
            )}
          </div>
        </div>
        {/* <SortingSelector selectedSort={selectedSort} handleSortChange={handleSortChange} /> */}
        <br></br>
        <div className="vault-table-container">
          <>
            {headerGroups.map((headerGroup: any, index: any) => (
              <div
                className={`vault-table-header-row ${
                  !showStats ? "vault-table-header-tvl-hidden" : ""
                }`}
                key={`header-group-${index}`}>
                {headerGroup.headers.map((column: any) => {
                  if (column.id === "depositsAndTVL" && !showStats) {
                    return null;
                  } else {
                    return (
                      <div
                        {...column.getHeaderProps(
                          column.getSortByToggleProps()
                        )}
                        key={column.id}
                        className={`vault-header ${
                          column.id === "depositsAndTVL"
                            ? "vault-deposits-tvl"
                            : column.id === "yieldAndVaultAPR"
                            ? "vault-yield-tvl"
                            : column.id === "vaults"
                            ? "vaults-header"
                            : "vault-left-align"
                        }`}>
                        {(column.id === "tokens" &&
                          hasTokens(filteredVaults)) ||
                        (column.id === "tickets" &&
                          hasTickets(filteredVaults)) ||
                        (column.id !== "tokens" &&
                          column.id !== "tickets") ? (
                          <>
                            <span className="hidden-mobile">
                              {column.render("Header")}
                            </span>
                            <span>
                              {column.isSorted ? (
                                column.isSortedDesc ? (
                                  <FontAwesomeIcon
                                    icon={faArrowAltCircleUp}
                                    size="sm"
                                    style={{
                                      display: "inline",
                                      color: "#1a4160",
                                      height: "15px",
                                      paddingLeft: "5px",
                                    }}
                                  />
                                ) : (
                                  <FontAwesomeIcon
                                    icon={faArrowAltCircleDown}
                                    size="sm"
                                    style={{
                                      display: "inline",
                                      color: "#1a4160",
                                      height: "15px",
                                      paddingLeft: "5px",
                                    }}
                                  />
                                )
                              ) : (
                                ""
                              )}
                            </span>
                          </>
                        ) : null}
                      </div>
                    );
                  }
                })}
              </div>
            ))}
          </>

          {isDataLoading ? (
            <TableSkeleton showStats={showStats} rowCount={8} />
          ) : (
            <div className="vault-table-body">
              <>
                {rows.map((row: any) => {
                  prepareRow(row);
                  const shouldShowVault =
                    WHITELIST_VAULTS.map((vault) =>
                      vault.toLowerCase()
                    ).includes(row.original.vault.toLowerCase()) ||
                    (row.original.vaultBalance &&
                      !row.original.vaultBalance.isZero());

                  if (shouldShowVault || showAllVaults) {
                    return (
                      <VaultTableRow
                        key={row.original.vault}
                        row={row}
                        showStats={showStats}
                      />
                    );
                  }
                  return null;
                })}
              </>
            </div>
          )}
          <br></br>
          <div
            style={{ color: "black", fontSize: "12px", cursor: "pointer" }}
            onClick={() => setShowAllVaults(!showAllVaults)}>
            {showAllVaults
              ? "Show Only Popular Vaults"
              : "Show Any and All Vaults"}
          </div>
        </div>
        <br></br>
        <br></br>
        <br></br>
        <br></br>
        <br></br>
        <br></br>
      </div>
      {tvl && (
        <TvlModal
          isOpen={isTvlModalOpen}
          onClose={() => setIsTvlModalOpen(false)}
          tvl={tvl}
        />
      )}
    </center>
  );
}
export default AllVaults;

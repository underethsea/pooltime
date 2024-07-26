
import React, { useEffect, useMemo, useState } from "react";
import LoadGrid from "../components/loadGrid";
// import { useRouter } from "next/router";
import { ethers } from "ethers";
import { useTable, useSortBy, useGlobalFilter } from "react-table";
import { Column } from "react-table";
import { PROVIDERS } from "../constants/providers";
import { ABI } from "../constants/constants";
import { Multicall } from "../utils/multicall";
import { CropDecimals, NumberWithCommas } from "../utils/tokenMaths";
// import VaultModal from "../components/vaultModal.tsx.OLD";
// import Layout from ".";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleInfo,
  faTicket,
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
import ChainTag from "../components/chainTag";
import PrizeValueIcon from "../components/prizeValueIcon";
import PrizeValue from "../components/prizeValue";
import Link from "next/link";
import { GetChainIcon } from "../utils/getChain";
import { WHITELIST_REWARDS, WHITELIST_VAULTS } from "../constants/address";

interface YieldTooltipProps {
  vaultAPR?: number; // Optional number
  apr?: number; // Optional number
  total?: number; // Optional number
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
};

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

const initialChains = [
  { chainId: 10, name: "Optimism", active: true, color: "#f1091e" },
  { chainId: 8453, name: "Base", active: true, color: "#0d59ff" },
  { chainId: 42161, name: "Arbitrum", active: true, color: "orange" },
  // { chainId: 421614, name: 'Arbitrum Test', active: true }
];

const getTVLPerChain = (vaults: VaultData[]) => {
  return vaults.reduce((acc: any, vault: any) => {
    const chainId = vault.c;
    const rawValue = vault.depositsEthValue;
    if (rawValue) {
      // const cleanedValue = rawValue.replace(/[$,]/g, ""); // Remove $ and commas
      const parsedValue = parseFloat(rawValue);
      if (!isNaN(parsedValue)) {
        if (!acc[chainId]) {
          acc[chainId] = 0;
        }
        acc[chainId] += parsedValue;
      }
    }
    return acc;
  }, {});
};

const calculateTotalAndPerChainTVL = (vaults: VaultData[]) => {
  // Extract chain IDs from ADDRESS
  const chainIds = Object.values(ADDRESS).map((chain) => chain.CHAINID);

  // Calculate TVL per chain
  const tvlPerChain: any = getTVLPerChain(vaults);

  // Filter TVL per chain to include only those in ADDRESS
  const filteredTVLPerChain: any = {};
  for (const chainId of chainIds) {
    if (tvlPerChain[chainId] !== undefined) {
      filteredTVLPerChain[chainId] = tvlPerChain[chainId];
    }
  }

  // Calculate total TVL
  const totalTVL = Object.values(filteredTVLPerChain).reduce(
    (total: any, tvl: any) => total + tvl,
    0
  );

  return { totalTVL, tvlPerChain: filteredTVLPerChain };
};

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

function groupVaultsByChain(vaultData: VaultData[]): VaultsByChain[] {
  const groupedByChain: { [chainId: number]: VaultData[] } = {};

  vaultData.forEach((vault: VaultData) => {
    const chainId = vault.c;
    if (!groupedByChain[chainId]) {
      groupedByChain[chainId] = [];
    }
    groupedByChain[chainId].push(vault);
  });

  return Object.entries(groupedByChain).map(([chainId, vaults]) => ({
    chainId: Number(chainId), // Convert chainId to number
    vaults,
  }));
}

const VaultYieldTooltip: React.FC<YieldTooltipProps> = ({ vaultAPR, apr, total, symbol }) => {
  return total && total > 0 ? (
    <>
      <div className="vault-tooltip-container">
        <span className="mobile-vault-header">
          APR<br></br>
        </span>
        {total > 0.01 && (
          <>{apr && apr > 0.0001 ? <><FontAwesomeIcon
            icon={faStar}
            style={{ color: "#1a4160", height: "16px",marginRight:"6px" }}
          /></> : ""}
            {total.toFixed(1)}%&nbsp;
            <FontAwesomeIcon
              icon={faCircleInfo}
              style={{ color: "#1a4160", height: "16px" }}
            />
            <div className="vault-tooltip-text">
              {vaultAPR && vaultAPR > 0.001 && (
                <div className="vault-tooltip-row">
                  <div>{Number(vaultAPR).toFixed(1)}%</div>
                  <div>Avg Prize Yield</div>
                </div>
              )}
              {apr && apr > 0.0001 ? (
                <>
                  <div className="vault-tooltip-row">
                    <div>{(apr * 100).toFixed(1)}%</div>
                    <div>{symbol} Incentives</div>
                  </div>
                </>
              ) : (
                ""
              )}
              {apr && apr > 0.0001 && vaultAPR && vaultAPR > 0.001 ? (
                <>
                  <hr className="vault-tooltip-hr" />
                  <div className="vault-tooltip-row">
                    <div>{total.toFixed(1)}%</div>
                    <div>Total</div>
                  </div>
                </>
              ) : (
                ""
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

const sortData = (data: any) => {
  // First sort by contributed
  let sortedData: any = data.sort((a: any, b: any) => {
    const contributedDiff =
      parseFloat(b.contributed7d) - parseFloat(a.contributed7d);
    return contributedDiff;
  });

  // Then sort by tokens, ignoring vaults with status === 1 (withdraw only)
  sortedData = sortedData.sort((a: any, b: any) => {
    const aTokens =
      a.assetBalance && a.status !== 1
        ? parseFloat(ethers.utils.formatUnits(a.assetBalance, a.decimals))
        : 0;
    const bTokens =
      b.assetBalance && b.status !== 1
        ? parseFloat(ethers.utils.formatUnits(b.assetBalance, b.decimals))
        : 0;
    return bTokens - aTokens;
  });
  // Then sort the already sorted data by tickets
  sortedData = sortedData.sort((a: any, b: any) => {
    const aTickets = a.vaultBalance
      ? parseFloat(ethers.utils.formatUnits(a.vaultBalance, a.decimals))
      : 0;
    const bTickets = b.vaultBalance
      ? parseFloat(ethers.utils.formatUnits(b.vaultBalance, b.decimals))
      : 0;
    return bTickets - aTickets;
  });

  return sortedData;
};

function AllVaults() {
  const [showStats, setShowStats] = useState(false);
  const [data, setData] = useState<VaultData[]>([]);
  const [searchInput, setSearchInput] = useState("");
  // const [poolPrice, setPoolPrice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [tvl, setTvl] = useState<TVL | null>(null);
  const [allVaults, setAllVaults] = useState<VaultData[]>([]);
  const [filteredVaults, setFilteredVaults] = useState<VaultData[]>([]);
  const [chains, setChains] = useState(initialChains);
  const [showAllVaults, setShowAllVaults] = useState(false);
  const [isVaultsLoaded, setIsVaultsLoaded] = useState(0);


  const { address } = useAccount();

  const toggleChain = (chainId: number) => {
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
        searchInput
      );
      setFilteredVaults(filtered);
    } else {
      // Otherwise, toggle the clicked chain
      const updatedChains = chains.map((chain) =>
        chain.chainId === chainId ? { ...chain, active: !chain.active } : chain
      );
      setChains(updatedChains);
      const filtered = filterVaultsByChainAndSearch(
        allVaults,
        updatedChains,
        searchInput
      );
      setFilteredVaults(filtered);
    }
  };

  const filterVaultsByChainAndSearch = (
    vaults: any,
    activeChains: any,
    searchInput: string
  ) => {
    const activeChainIds = activeChains
      .filter((chain: any) => chain.active)
      .map((chain: any) => chain.chainId);

    return vaults.filter(
      (vault: any) =>
        activeChainIds.includes(vault.c) &&
        vault.name.toLowerCase().includes(searchInput.toLowerCase())
    );
  };

 
  const depositsTVLHeader = useMemo(() => {
    return (
      <div style={{ textAlign: "right" }}>
        Deposits & TVL
        {/* {tvl > 0 && <div>${NumberWithCommas(CropDecimals(tvl))}</div>} */}
      </div>
    );
  }, []);

  const columns: Column<VaultData>[] = useMemo(
    () => [
      {
        Header: "Vault",
        id: "vaults",
        accessor: "name",
        Cell: ({ row }) => {
          const { name, poolers, c, vaultAPR, apr } = row.original;
          // value now directly contains the totalYield computed by the accessor
          // original contains the full data of the row
          const displayValue =
            name.length > 25
              ? name.substring(0, 22) + "..."
              : name.substring(0, 28);
          const mobileDisplayValue =
            name.length > 25
              ? name.substring(0, 12) + "..."
              : name.substring(0, 15);

          return (
            <div>
              {/* <ChainTag chainId={c}/>&nbsp; */}
              <ChainTag chainId={c} />
              {name.startsWith("Prize ") ? (
                <>
                  &nbsp;
                  <span style={{ marginLeft: "-15px" }}>
                    <IconDisplay name={name.substring(6)} />
                  </span>{" "}
                  <span className="hidden-mobile">
                    {displayValue.substring(6)}
                  </span>
                  <span className="hidden-desktop">
                    {mobileDisplayValue.substring(6)}
                  </span>
                  <FontAwesomeIcon
                    icon={faSquareArrowUpRight}
                    size="sm"
                    style={{
                      color: "#1a4160",
                      height: "15px",
                      paddingLeft: "9px",
                    }}
                    // className="hidden-mobile"
                  />
                  <span className="hidden-desktop">
                    &nbsp;&nbsp;&nbsp;&nbsp;
                    {/* Pass the correct props to Tooltip */}
                    {vaultAPR && (
                      <>{(Number(vaultAPR) + Number(apr * 100)).toFixed(1)}%</>
                    )}
                  </span>
                </>
              ) : (
                <span>
                  <span className="hidden-mobile">{displayValue}</span>
                  <span className="hidden-desktop">{mobileDisplayValue}</span>
                  <FontAwesomeIcon
                    icon={faSquareArrowUpRight}
                    size="sm"
                    style={{
                      color: "#1a4160",
                      height: "15px",
                      paddingLeft: "9px",
                    }}
                  />
                  {/* {!showStats && <>&nbsp;&nbsp;&nbsp;&nbsp;<ChainTag chainId={c} /></>} */}
                </span>
              )}
              {showStats && (
                <div className="vaults-font-small">
                  &nbsp;&nbsp;&nbsp;
                  {/* <ChainTag chainId={c} /> */}
                  <span style={{ verticalAlign: "middle", marginLeft: "50px" }}>
                    {poolers} poolers
                  </span>
                </div>
              )}
            </div>
          );
        },
      },

      {
        Header: "Your Tokens",
        id: "tokens",
        accessor: "apr",
        Cell: ({ row }) => {
          const { assetBalance, vaultBalance, decimals, assetSymbol, status } =
            row.original;
          // Convert BigNumber to string for display
          let assetBalanceDisplay =
            assetBalance && assetBalance.gt(0) && status !== 1 ? (
              <div className="animated deposit-button">
                <IconDisplay name={assetSymbol} size={20} />
                &nbsp;
                {NumberWithCommas(
                  CropDecimals(ethers.utils.formatUnits(assetBalance, decimals))
                )}
                &nbsp; DEPOSIT
              </div>
            ) : (
              ""
            );

          return (
            <div>
              <div>
                {assetBalance && assetBalance.gt(0) && (
                  <>
                    <span>{assetBalanceDisplay}</span>
                  </>
                )}
              </div>
            </div>
          );
        },
      },
      {
        Header: "Your Tickets",
        id: "tickets",
        accessor: (row) => {
          // Convert BigNumber to a sortable format (number or string)
          // Assuming row.vaultBalance is a BigNumber and row.decimals is an integer
          if (
            typeof row.vaultBalance === "object" &&
            typeof row.vaultBalance.gt === "function"
          ) {
            return row.vaultBalance.gt(0)
              ? parseFloat(
                  ethers.utils.formatUnits(row.vaultBalance, row.decimals)
                )
              : 0;
          }
        },
        // @ts-ignore
        Cell: ({ value, row }) => {
          const { decimals, assetSymbol } = row.original;
          let display =
            value > 0 ? ( // Since value is now a number, compare with 0
              <>
                <span className="mobile-vault-header">
                  Your Tickets<br></br>
                </span>
                <span className="column-tickets">
                <FontAwesomeIcon
                  icon={faTicket}
                  size="sm"
                  style={{
                    color: "#1a4160",
                    height: "17px",
                    marginRight: "3px",
                  }}
                /></span>
                &nbsp;
                {NumberWithCommas(
                  CropDecimals(
                    ethers.utils.formatUnits(
                      row.original.vaultBalance,
                      decimals
                    )
                  )
                )}
              </>
            ) : (
              ""
            );
          return <div>{display}</div>;
        },
      },

      {
        Header: "Yield",
        id: "yieldAndVaultAPR",
        accessor: (row) => (Number(row.vaultAPR) || 0) + (row.apr || 0) * 100, // Directly return the computed number
        // screw you typescript
        // @ts-ignore
        Cell: ({ cell: { value }, row: { original } }) => {
          // value now directly contains the totalYield computed by the accessor
          // original contains the full data of the row
          const { vaultAPR, apr, incentiveSymbol } = original; // Getting vaultAPR and apr from the original row data

          return (
            <div className="hidden-mobile">
              {/* Pass the correct props to Tooltip */}
              <VaultYieldTooltip
                vaultAPR={vaultAPR}
                apr={apr}
                total={value}
                symbol={incentiveSymbol} />
            </div>
          );
        },
      },

      {
        Header: "Deposits & TVL",
        id: "depositsAndTVL",
        accessor: (row) => row,
        Cell: ({ value }: { value: any }) => {
          const { totalSupply, depositsDollarValue, depositsEthValue } = value;
          return (
            <div style={{ textAlign: "right" }}>
              <div>{totalSupply}</div>
              <div className="vaults-font-small">
                {depositsEthValue > 0 && (
                  <>
                    <PrizeValueIcon size={16} />
                    <PrizeValue amount={BigInt(depositsEthValue)} size={16} />
                  </>
                )}
                <span style={{ color: "rgba(0, 0, 0, 0)" }}>-</span>
              </div>
            </div>
          );
        },
      },
    ],
    [showStats]
  );



  const tableInstance = useTable<VaultData>(
    { columns, data: filteredVaults },
    useGlobalFilter,
    useSortBy
  );

  const { setGlobalFilter }: any = tableInstance;
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    tableInstance;
    useEffect(() => {
      const fetchData = async () => {
        try {
          setIsLoading(true);
          const secondsInAYear = 31536000; // 60 * 60 * 24 * 365
    
          const [vaultsResponse, pricesFetch]: [any, any] = await Promise.all([
            fetch(`https://poolexplorer.xyz/vaults`),
            fetch(`https://poolexplorer.xyz/prices`),
          ]);
    
          let prices = await pricesFetch.json();
          const geckoPrices = prices.geckos;
          const assetPrices = prices.assets;
    
          let vaults: VaultData[] = await vaultsResponse.json();
    
          // Extract vault addresses
          const vaultAddresses = vaults.map((vault: any) => vault.vault);
    
          const [promotionsResult, multicallResults] = await Promise.allSettled([
            GetActivePromotionsForVaults(vaultAddresses, true, prices),
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
    
                  const multicallArray = chainVaults.map((vault: VaultData) => {
                    const contract = new ethers.Contract(
                      vault.vault,
                      ABI.VAULT,
                      PROVIDERS[chainName]
                    );
                    return contract.totalAssets();
                  });
    
                  const totalSupplies = await Multicall(multicallArray, chainName);
    
                  return { chainId, totalSupplies, chainVaults };
                }
              )
            ),
          ]);
    
          let activePromotions = [] as any;
          if (promotionsResult.status === "fulfilled") {
            activePromotions = promotionsResult.value;
          } else {
            console.error("Failed to fetch active promotions:", promotionsResult.reason);
          }
    
          // Map active promotions back onto the corresponding vaults
          vaults = vaults.map((vault: any) => {
            const vaultAddress = vault.vault.toLowerCase();
            return {
              ...vault,
              activePromotions: activePromotions[vaultAddress] || [],
            };
          });
    
          const allResults = multicallResults.status === "fulfilled" ? multicallResults.value : [];
    
          // Flatten the results
          const flattenedVaults = allResults.flatMap(
            ({ chainVaults, totalSupplies }: any) =>
              chainVaults.map((vault: VaultData, index: number) => ({
                ...vault,
                totalSupply: totalSupplies[index],
              }))
          );
    
          // Enrich vaults with totalSupplies and other calculations
          const enrichedVaults = flattenedVaults.map((vault) => {
            const chainName = GetChainName(vault.c);
            const totalSupplyValue = ethers.utils.formatUnits(
              vault.totalSupply,
              vault.decimals
            );
    
            const contributed7d = parseFloat(vault.contributed7d);
            const contributed24h = parseFloat(vault.contributed24h);
    
            // Calculate Prize APR here
            let prizeTokenPriceValue = 0;
            if (
              ADDRESS[chainName] &&
              ADDRESS[chainName].PRIZETOKEN &&
              ADDRESS[chainName].PRIZETOKEN.GECKO
            ) {
              prizeTokenPriceValue = parseFloat(
                geckoPrices[ADDRESS[chainName].PRIZETOKEN.GECKO]?.toString() || "0"
              );
            }
    
            let dollarValue = null;
            let ethValue = null;
            const assetPrice = assetPrices[chainName][vault.asset.toLowerCase()];
            if (assetPrice > 0) {
              dollarValue = parseFloat(totalSupplyValue) * assetPrice;
              ethValue = dollarValue / geckoPrices["ethereum"];
            }
    
            let vaultAPR = null;
            let won7d = null;
    
            if (dollarValue && prizeTokenPriceValue > 0) {
              const depositsDollarValue = parseFloat(
                dollarValue.toString().replace("$", "")
              );
    
              const effectiveContribution =
                contributed7d === 0
                  ? contributed24h * 7
                  : contributed24h > contributed7d / 3
                  ? contributed24h * 7
                  : contributed7d;
    
              if (depositsDollarValue > 0 && effectiveContribution > 0) {
                vaultAPR = (
                  (((365 / 7) * effectiveContribution * prizeTokenPriceValue) /
                    depositsDollarValue) *
                  100
                ).toFixed(2);
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
                (parseFloat(totalSupplyValue) * parseFloat(assetPrice));
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
              contributed7d,
              contributed24h,
              won7d,
              vaultAPR,
              incentiveSymbol: promoTokenSymbol,
            };
          });
    
          vaults = sortData(enrichedVaults);
    
          setData((prevData) => {
            const newData = vaults;
            if (JSON.stringify(newData) !== JSON.stringify(prevData)) {
              setAllVaults(vaults); // Set the full vault data
              setFilteredVaults(vaults); //
              const tvlData = calculateTotalAndPerChainTVL(newData);
              setTvl(tvlData as TVL);
              if(isVaultsLoaded===0) {setIsVaultsLoaded(1)}else{setIsVaultsLoaded(2)}
              return newData;
            }
            return prevData;
          });
          setIsLoading(false);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      };
    
      fetchData();
    }, []);
    

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
            return {
              ...vault,
              assetBalance: balance ? balance.tokenBalance : null, // Add token balance
              vaultBalance: balance ? balance.vaultBalance : null, // Add vault balance
            };
          })
      );

      // Update the state with the new enriched data array
      const sortedVaults = sortData(flattenedVaults);
      setAllVaults(sortedVaults);

      // Apply filtering after updating all vaults
      const filtered = filterVaultsByChainAndSearch(
        sortedVaults,
        chains,
        searchInput
      );
      setFilteredVaults(filtered);
    };

    if (address && allVaults.length > 0 && isVaultsLoaded===1) {
      fetchBalances(address);
    }
  }, [address, isVaultsLoaded]);
  useEffect(() => {
    const filtered = filterVaultsByChainAndSearch(allVaults, chains, searchInput);
    setFilteredVaults(filtered);
  }, [searchInput]);

  const handleSearch = (event: any) => {
    const value = event.target.value.toLowerCase();
    setSearchInput(value);

    // const filtered = filterVaultsByChainAndSearch(allVaults, chains, value);
    // setFilteredVaults(filtered);
  };

  return (
    <center>
      <div
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
        <h1 style={{ margin: "0 0 0 10px", lineHeight: "120px" }}>POOLTIME</h1>
      </div>
      <br></br>
      <div>
        <div className="vaults-header-container">
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
            {!isLoading && (
              <>
                <div
                  className="vault-search-container"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    // width: "450px",
                  }}>
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
                  </div>
                </div>
              </>
            )}
            <div
              className="tvl"
              style={{
                textAlign: "left",
                marginTop: "10px",
                // backgroundColor: "#e5f3f5",
                color: "white",
                borderRadius: "10px",
                padding: "5px 8px 5px 8px",
              }}>
              {!isLoading && <PrizeInPool />}
              {tvl && !isLoading && !showStats && (
                <div className="more">
                  <span
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      setShowStats(true);
                    }}>
                    <a className="custom-link">+nerd data</a>
                  </span>
                </div>
              )}

              {tvl &&
              parseInt(tvl.totalTVL.toString()) > 0 &&
              !isLoading &&
              showStats ? (
                <>
                  <div style={{ fontSize: "22px", display: "inline-block" }}>
                    TVL&nbsp;&nbsp;
                    <PrizeValueIcon size={22} />
                    <PrizeValue
                      amount={BigInt(Math.round(Number(tvl.totalTVL)))}
                      size={22}
                    />
                  </div>
                  &nbsp;
                  <div className="tooltipContainer">
                    <FontAwesomeIcon
                      icon={faCircleInfo}
                      style={{ color: "#ebeeef", height: "16px" }}
                    />
                    <span className="tooltipText">
                      <div>Total Value Locked</div>
                      {Object.entries(tvl.tvlPerChain).map(([chainId, tvl]) => (
                        <div key={chainId}>
                          {GetChainName(Number(chainId))}&nbsp;&nbsp;
                          <PrizeValueIcon size={15} />
                          <PrizeValue amount={BigInt(tvl)} size={15} />
                          {/* $ {NumberWithCommas(tvl.toFixed(0))} */}
                        </div>
                      ))}
                    </span>
                  </div>
                </>
              ) : (
                <span style={{ width: "140px" }}></span>
              )}
            </div>
          </div>
        </div>
        {/* <SortingSelector selectedSort={selectedSort} handleSortChange={handleSortChange} /> */}
        <br></br>
        {!isLoading && (
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

            <div className="vault-table-body">
              <>
                {rows.map((row: any) => {
                  prepareRow(row);
                  const shouldShowVault = WHITELIST_VAULTS.map((vault) =>
                    vault.toLowerCase()
                  ).includes(row.original.vault.toLowerCase());

                  if (shouldShowVault || showAllVaults) {
                    return (
                      <Link
                        key={row.original.vault}
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
                  }
                })}
              </>
            </div>
            <br></br>
            <div
              style={{ color: "black", fontSize: "12px", cursor: "pointer" }}
              onClick={() => setShowAllVaults(!showAllVaults)}>
              {showAllVaults
                ? "Show Only Popular Vaults"
                : "Show Any and All Vaults"}
            </div>
          </div>
        )}{" "}
        <br></br>
        <br></br>
        <br></br>
        <br></br>
        <br></br>
        <br></br>
       
        {isLoading && <LoadGrid />}
      </div>
    </center>
  );
}
export default AllVaults;


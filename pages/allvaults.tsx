import React, { useEffect, useMemo, useState } from "react";
import LoadGrid from "../components/loadGrid";
// import { useRouter } from "next/router";
import { ethers } from "ethers";
import { useTable, useSortBy, useGlobalFilter } from "react-table";
import { Column } from "react-table";
import IconDisplay from "../components/icons";
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
} from "@fortawesome/free-solid-svg-icons";
// import { FetchPriceForAsset } from "../utils/tokenPrices";
import { GetActivePromotionsForVaults } from "../utils/getActivePromotions";
import { ADDRESS } from "../constants/address";
import PrizeIcon from "../components/prizeIcon";
import { GetVaultBalances } from "../utils/getVaultBalances";
import { useAccount } from "wagmi";
import { GetChainName } from "../utils/getChain";
import PrizeInPool from "../components/prizeInPool";
import ChainTag from "../components/chainTag";
import PrizeValueIcon from "../components/prizeValueIcon";
import PrizeValue from "../components/prizeValue";
import Link from "next/link";
import { GetChainIcon } from "../utils/getChain";
import { WHITELIST_REWARDS } from "../constants/address";

interface TooltipProps {
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

// const hideVaults = [
//   "0xa46de5b77dbe59a7b9213f3dd1634da25e7e3bfb",
//   "0x4b9a4edbdb67ee8d880964732c1f56e4c13f2c04",
//   "0xe5f8c4e783839e14080daf3e28d64e3140596989".toLowerCase(),
//   "0x1e56e11bf011b46546540036dbee8820ddce5cdf",
//   "0x3d87b066dcf93661c66cd5158a449483259a3bc1",
//   "0x37e49c9dbf195f5d436c7a7610fe703cdcd8147b",
//   "0x182d3050f7261494757638ff3345c7163e5990f3",
// ];

const showVaults = [
  "0x1f16d3ccf568e96019cedc8a2c79d2ca6257894e",
  "0x03d3ce84279cb6f54f5e6074ff0f8319d830dafe",
  "0xa52e38a9147f5ea9e0c5547376c21c9e3f3e5e1f",
  "0x2998c1685e308661123f64b333767266035f5020",
  "0x3e8dbe51da479f7e8ac46307af99ad5b4b5b41dc",
  "0xf1d934d5a3c6e530ac1450c92af5ba01eb90d4de",
  "0x9b53ef6f13077727d22cb4acad1119c79a97be17",
  "0x6b5a5c55e9dd4bb502ce25bbfbaa49b69cf7e4dd",
  "0x7f5c2b379b88499ac2b997db583f8079503f25b9",
  "0x8d1322cabe5ef2949f6bf4941cc7765187c1091a",
  "0x75d700f4c21528a2bb603b6ed899acfde5c4b086",
  "0x850ec48d2605aad9c3de345a6a357a9a14b8cf1b",
  "0x5b623c127254c6fec04b492ecdf4b11c45fbb9d5",
  "0x3c72a2a78c29d1f6454caa1bcb17a7792a180a2e",
  "0x7b0949204e7da1b0bed6d4ccb68497f51621b574",
  "0xcacba8be4bc225fb8d15a9a3b702f84ca3eba991",
  "0x97a9c02cfbbf0332d8172331461ab476df1e8c95",
  "0x8653084e01Bd8c9e24B9a8fEb2036251Ee0C16A9", // angle stUSD arbitrum
  "0x6Bb041d7E70b7040611ef688b5e707a799ADe60A", // angle stUSD base
];

// const getChainColor = (chainId: number) => {
//   const chain = initialChains.find((chain) => chain.chainId === chainId);
//   return chain ? chain.color : "#ccc"; // default color if not found
// };

// const calculateTVL = (vaults: VaultData[]) => {
//   return vaults.reduce((total: number, vault: any) => {
//     const rawValue = vault.depositsDollarValue;
//     if (rawValue) {
//       const cleanedValue = rawValue.replace(/[$,]/g, ""); // Remove $ and commas
//       const parsedValue = parseFloat(cleanedValue);
//       return total + (isNaN(parsedValue) ? 0 : parsedValue);
//     } else {
//       return total;
//     }
//   }, 0);
// };

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

const Tooltip: React.FC<TooltipProps> = ({ vaultAPR, apr, total, symbol }) => {
  return total && total > 0 ? (
    <>
      <div className="vault-tooltip-container">
        <span className="mobile-vault-header">
          APR<br></br>
        </span>
        {total > 0.01 && (
          <>
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
    const aTokens = a.assetBalance && a.status !== 1
      ? parseFloat(ethers.utils.formatUnits(a.assetBalance, a.decimals))
      : 0;
    const bTokens = b.assetBalance && b.status !== 1
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
  const [newVaultData, setNewVaultData] = useState(false);

  // const [vaultPropData, setVaultPropData] = useState();
  const [searchInput, setSearchInput] = useState("");
  // const [isModalOpen, setIsModalOpen] = useState(false);
  // const [selectedVault, setSelectedVault] = useState("");
  // const [poolPrice, setPoolPrice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  // const [selectedSort, setSelectedSort] = useState("tvl"); // Add selected sort state
  const [tvl, setTvl] = useState<TVL | null>(null);
  const [allVaults, setAllVaults] = useState<VaultData[]>([]);
  const [filteredVaults, setFilteredVaults] = useState<VaultData[]>([]);
  const [chains, setChains] = useState(initialChains);
  const [showAllVaults, setShowAllVaults] = useState(false);

  const { address } = useAccount();
  // console.log("adddress?", address);
  // const router = useRouter();
  // const queriedVaultAddress = router.isReady
  //   ? (router.query.address as string)
  //   : null;
  // const queriedChain = router.isReady ? (router.query.chain as string) : null;
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
      const filtered = filterVaultsByChain(allVaults, updatedChains);
      setFilteredVaults(filtered);
    } else {
      // Otherwise, toggle the clicked chain
      const updatedChains = chains.map((chain) =>
        chain.chainId === chainId ? { ...chain, active: !chain.active } : chain
      );
      setChains(updatedChains);
      const filtered = filterVaultsByChain(allVaults, updatedChains);
      setFilteredVaults(filtered);
    }
  };

  const filterVaultsByChain = (vaults: any, activeChains: any) => {
    const activeChainIds = activeChains
      .filter((chain: any) => chain.active)
      .map((chain: any) => chain.chainId);
    return vaults.filter((vault: any) => activeChainIds.includes(vault.c));
  };

  // const closeModal = () => {
  //   setIsModalOpen(false);
  //   router.push({ pathname: router.pathname }, undefined, { shallow: true });
  // };
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
      // {
      //   Header: "",
      //   id: "chain",
      //   accessor: "name", // Ensure the accessor correctly retrieves the chain ID
      //   Cell: ({ row }) => {
      //     const { c } = row.original;
      //     return <ChainTag chainId={c} />;
      //   },
      //   disableSortBy: true, // Disable sorting for this column if needed
      // },
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
              {vaultAPR &&
        <>{(Number(vaultAPR)+Number(apr*100)).toFixed(1)}%</>}
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
            assetBalance && assetBalance.gt(0) && status!==1 ? (
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
              <Tooltip
                vaultAPR={vaultAPR}
                apr={apr}
                total={value}
                symbol={incentiveSymbol}></Tooltip>
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

  const sortedData = useMemo(() => sortData(filteredVaults), [filteredVaults]);

  const tableInstance = useTable<VaultData>(
    { columns, data: sortedData },
    useGlobalFilter,
    useSortBy
  );

  const { setGlobalFilter }: any = tableInstance;
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    tableInstance;

  // useEffect(() => {
  //   const fetchVaultData = async () => {
  //     // console.log("vault address in url",queriedVaultAddress,"chain",queriedChain)
  //     if (
  //       queriedVaultAddress &&
  //       queriedVaultAddress.length > 0 &&
  //       queriedChain &&
  //       queriedChain.length > 0
  //     ) {
  //       // console.log("searching foer queried vault")
  //       // Find the vault data from the data array using the queried address and chain
  //       console.log("vault data",data)
  //       const vaultInfo: any = data.find(
  //         (vault) =>
  //           vault.vault.toLowerCase() === queriedVaultAddress.toLowerCase() &&
  //           GetChainName(vault.c) === queriedChain
  //       );
  //       // console.log("found queried vault?",vaultInfo)

  //       if (vaultInfo) {
  //         setVaultPropData(vaultInfo);
  //         setSelectedVault(queriedVaultAddress);
  //         setIsModalOpen(true);
  //       }
  //     }
  //   };

  //   fetchVaultData();
  // }, [queriedVaultAddress, queriedChain, data]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const opTokenAddress = "0x4200000000000000000000000000000000000042";
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

        // Get active promotions for each vault
        let activePromotions = [] as any;
      
        try {
          activePromotions = await GetActivePromotionsForVaults(
            vaultAddresses,
            true,
            prices
          );
        } catch (error) {
          console.error("Failed to fetch active promotions:", error);
        }

        // Map active promotions back onto the corresponding vaults
        vaults = vaults.map((vault: any) => {
          const vaultAddress = vault.vault.toLowerCase();
          return {
            ...vault,
            activePromotions: activePromotions[vaultAddress] || [],
          };
        });
        const vaultsByChain: VaultsByChain[] = groupVaultsByChain(vaults);
        // console.log("vaults by chain", vaultsByChain);

        // Create multicall promises for each chain
        const multicallPromises = vaultsByChain.map(
          async ({
            chainId,
            vaults: chainVaults,
          }: {
            chainId: number;
            vaults: VaultData[];
          }) => {
            const chainName = GetChainName(Number(chainId));
            // console.log("chain ", chainId, "name", chainName);

            // Create multicall array for this chain
            const multicallArray = chainVaults.map((vault: VaultData) => {
              // console.log("Adding ", chainName, ", vault", vault.vault);
              const contract = new ethers.Contract(
                vault.vault,
                ABI.VAULT,
                PROVIDERS[chainName]
              );
              return contract.totalAssets();
            });

            // Perform multicall for this chain
            const totalSupplies = await Multicall(multicallArray, chainName);

            // Return the total supplies and chain vaults for updating
            return { chainId, totalSupplies, chainVaults };
          }
        );

        // Fetch all multicall results
        const allResults = await Promise.all(multicallPromises);
        // console.log("all results", allResults);

        // Flatten the results
        const flattenedVaults = allResults.flatMap(
          ({ chainVaults, totalSupplies }) =>
            chainVaults.map((vault, index) => ({
              ...vault,
              totalSupply: totalSupplies[index],
            }))
        );

        // console.log("flattenedVaults", flattenedVaults);

        // Enrich vaults with totalSupplies and other calculations
        const enrichedVaults = flattenedVaults.map((vault) => {
          const chainName = GetChainName(vault.c);
          const totalSupplyValue = ethers.utils.formatUnits(
            vault.totalSupply,
            vault.decimals
          );
          // console.log("looking for vaults for chain", chainName);
          // const geckoId = ADDRESS[chainName].VAULTS.find(
          //   (v) => v.VAULT.toLowerCase() === vault.vault.toLowerCase()
          // )?.GECKO;

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
              geckoPrices[ADDRESS[chainName].PRIZETOKEN.GECKO]?.toString() ||
                "0"
            );
          }

          // const ethPrice = parseFloat(geckoPrices['ethereum'].toString());
          let dollarValue = null;
          let ethValue = null;
          // console.log("looking for price on ",chainName,"asset",vault.asset.toLowerCase())
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

            // Determine which contribution value to use for APR calculation
            // Scale contributed24h by 7 to estimate a week's contribution at the current rate
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
          // Check if WHITELIST_REWARDS is defined and an object
          // Extract all whitelisted tokens
          const whitelistedTokens = Object.values(WHITELIST_REWARDS)
            .flat()
            .map((tokenObj) => tokenObj.TOKEN.toLowerCase());

          // Ensure whitelistedTokens is an array before filtering
          // Filter for whitelisted token promotions and calculate APR
          whitelistedPromotions = vaultPromotions.filter((promo: any) =>
            whitelistedTokens.includes(promo.token.toLowerCase())
          );

          // console.log(whitelistedPromotions);

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
// console.log("tokens per second",tokensPerSecond)
// console.log("promo token price",promoTokenPrice)
// console.log("total supply value",totalSupplyValue)
// console.log("asset price",assetPrice)
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

        // console.log("enriched vaultsssss", enrichedVaults);
        vaults = sortData(enrichedVaults);
        // console.log("ok ok", vaults);

        setData((prevData) => {
          const newData = vaults;
          if (JSON.stringify(newData) !== JSON.stringify(prevData)) {
            setNewVaultData((prev) => !prev);
            setAllVaults(vaults); // Set the full vault data
            setFilteredVaults(vaults); //
            const tvlData = calculateTotalAndPerChainTVL(newData);
            // console.log("tvl info", tvlData);
            setTvl(tvlData as TVL);
            // console.log("data", tvlData);
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
      const filtered = filterVaultsByChain(sortedVaults, chains);
      setFilteredVaults(filtered);
    };
  
    if (address && allVaults.length > 0) {
      fetchBalances(address);
    }
  }, [address, allVaults, chains]);
  

  const handleSearch = (event: any) => {
    const value = event.target.value || undefined;
    setGlobalFilter(value); // set global filter value
    setSearchInput(value);
  };

  //   const handleSortChange = (event:any) => {
  //     const value = event.target.value;
  //     setSortBy([{ id: value, desc: false }]);
  //   };
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
                  const shouldShowVault = showVaults.map(vault => vault.toLowerCase()).includes(
                    row.original.vault.toLowerCase()
                  );
                  
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
        {/* {isModalOpen && selectedVault && (
          <VaultModal
            vaultAddress={selectedVault}
            isOpen={isModalOpen}
            onClose={closeModal}
            vaultPropData={vaultPropData}
          />
        )} */}
        {isLoading && <LoadGrid />}
      </div>
    </center>
  );
}
export default AllVaults;

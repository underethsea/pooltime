// vault.tsx
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { ABI, ADDRESS, PROVIDERS, CONFIG } from "../constants";
import { MyConnect } from "./connectButton";
import { Multicall } from "../utils/multicall";
import { useAccount, useSimulateContract } from "wagmi";
import { NumberWithCommas, CropDecimals } from "../utils/tokenMaths";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
} from "wagmi";
// usewitchnetwork
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PrizeIcon from "./prizeIcon";
import {
  faCopy,
  faTicket,
  faWallet,
  faExclamationCircle,
} from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/router";
import { GetActivePromotionsForVaults } from "../utils/getActivePromotions";
import { DepositSuccessModal } from "./depositSuccessModal";
import { TokenToGeckoId } from "../constants/tokenGeckoId";
import { VaultRewards } from "./vaultRewards";
import { getGeckoPriceForTokenAddress } from "../utils/tokenPrices";
import { GetChainName } from "../utils/getChain";
import { GetAssetPrice } from "../utils/getAssetPrice";
import Layout from "../pages";
import { useOverview } from "./contextOverview";

// import Drip from "./drip";

interface vaultApi {
  name: string;
  vault: string;
  poolers: number;
  symbol: string;
  decimals: number;
  asset: string;
  owner: string;
  liquidationPair: string;
  assetSymbol: string;
  price: number;
  contributed7d: string;
  contributed24h: string;
  status?: number;
}
interface VaultProps {
  vAddress: string;
  vaultChainId: number;
  vaultPropData: Partial<vaultApi>;
}

interface GnosisInfo {
  required: number;
  total: number;
  // Add other relevant properties here, if any
}

interface VaultData {
  name: string;
  address: string;
  symbol: string;
  decimals: number;
  asset: string;
  liquidationPair: string;
  totalAssets: ethers.BigNumber;
  assetName: string;
  assetSymbol: string;
  owner: string;
  userAssetBalance: ethers.BigNumber;
  userDelegatedBalance: ethers.BigNumber;
  userAssetAllowance: ethers.BigNumber;
  userVaultBalance: ethers.BigNumber;
  price: number;
  contributed7d: string;
  contributed24h: string;
  poolers: number;
  yieldFeePercentage: ethers.BigNumber;
  gnosis?: GnosisInfo; // gnosis is optional and conforms to GnosisInfo interface
  status?: number;
}

const dripUpdate = () => {
  return 1;
};

function getVaultIcon(vaultAddress: string, chainName: string) {
  const chain = ADDRESS[chainName];
  if (!chain || !chain.VAULTS) {
    console.error("Invalid chain name or no vaults available for this chain.");
    return null;
  }

  const vault = chain.VAULTS.find(
    (v) => v.VAULT.toLowerCase() === vaultAddress.toLowerCase()
  );
  return vault ? vault.VAULTICON : null;
}

function CopyToClipboardButton(text: any) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      console.log("Text successfully copied to clipboard");
    })
    .catch((err) => {
      console.error("Could not copy text: ", err);
    });
}

const Vault: React.FC<VaultProps> = ({
  vaultChainId,
  vAddress = "0x29Cb69D4780B53c1e5CD4D2B817142D2e9890715",
  vaultPropData,
}) => {
  const { chains, switchChain } = useSwitchChain();
   const overviewFromContext  = useOverview()

  //   const { chains, error, isLoading, pendingChainId, switchNetwork } = useSwitchNetwork();
  // console.log("switch networks chains",chains)
  // console.log("vault prop data",vaultPropData)
  const router = useRouter();
  const queriedVaultAddress = router.isReady
    ? (router.query.address as string)
    : vAddress;
  const queriedChainId = router.isReady
    ? (router.query.chain as string)
    : vaultChainId;

  // Use the queriedVaultAddress if it exists, otherwise fallback to the default prop.
  const activeVaultAddress = queriedVaultAddress || vAddress;
  const activeVaultChain: number =
    Number(queriedChainId) || Number(vaultChainId);
  const [vaultData, setVaultData] = useState<VaultData | null>(null);
  const [isInvalidVault, setIsInvalidVault] = useState<boolean>(false);
  const [buyAmount, setBuyAmount] = useState<string>("");
  const [redeemAmount, setRedeemAmount] = useState<string>("");
  const [seeAddresses, setSeeAddresses] = useState<boolean>(false);
  // const [urlChain, setUrlChain] = useState<string>("");
  // const chainId = useChainId();
  const { address, chainId } = useAccount();
  // console.log("chain id",chainId)

  const [isDepositSuccessModalOpen, setIsDepositSuccessModalOpen] =
    useState(false);
  const [depositHash, setDepositHash] = useState("");
  const [activePromos, setActivePromos] = useState({});
  const [actionCompleted, setActionCompleted] = useState({
    approve: false,
    buy: false,
    redeem: false,
  });
  const [lastActionShown, setLastActionShown] = useState("");
  const [refreshData, setRefreshData] = useState(0);
  const [apiPricing, setApiPricing] = useState();
  const [assetPrice, setAssetPrice] = useState(0);
  // const [ vaultChainId, setVaultChainId] = useState()

  const handleCloseModal = () => {
    setIsDepositSuccessModalOpen(false);
  };

  const handleShowToast = (action: any) => {
    toast.dismiss();
    // Prevent showing the same toast for the same action again
    if (action === lastActionShown) return;

    switch (action) {
      case "approve":
        toast("Approve success!", { position: toast.POSITION.BOTTOM_LEFT });
        break;
      case "buy":
        toast("Deposit success!", { position: toast.POSITION.BOTTOM_LEFT });
        setIsDepositSuccessModalOpen(true);
        break;
      case "redeem":
        toast("Redeem success!", { position: toast.POSITION.BOTTOM_LEFT });
        break;
      default:
      // No default action
    }

    // Update the last action shown
    setLastActionShown(action);
  };

  const handleBuyAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Check if the new input value is either empty or a valid number format
    if (inputValue === "" || /^\d*\.?\d*$/.test(inputValue)) {
      setBuyAmount(inputValue);
    }
  };

  const handleRedeemAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Check if the new input value is either empty or a valid number format
    if (inputValue === "" || /^\d*\.?\d*$/.test(inputValue)) {
      setRedeemAmount(inputValue);
    }
  };

  const {
    data: buyData,
    isPending: buyIsLoading,
    // isSuccess: buyIsSuccess,
    // isError: buyIsError,
    writeContract: writeBuy,
  } = useWriteContract({
    mutation: {
      onSuccess: () => {
        toast("Depositing!", {
          position: toast.POSITION.BOTTOM_LEFT,
        });
      },
    },
  });

  const { data: redeemSimulate } = useSimulateContract({
    chainId: chainId,
    address: vaultData?.address as any,
    abi: ABI.VAULT,
    functionName: "withdraw",

    args: [
      // "1",
      redeemAmount &&
        parseFloat(redeemAmount) > 0 &&
        ethers.utils.parseUnits(redeemAmount, vaultData?.decimals).toString(),
      address as any,
      address as any,
      redeemAmount &&
        parseFloat(redeemAmount) > 0 &&
        ethers.utils.parseUnits(redeemAmount, vaultData?.decimals).toString(),
    ],
  });
  // console.log("redeem sim",redeemSimulate)
  const {
    data: redeemData,
    isPending: redeemIsLoading,
    // isSuccess: redeemIsSuccess,
    // isError: redeemIsError,
    writeContract: writeRedeem,
  } = useWriteContract({
    mutation: {
      onSuccess: () => {
        toast("Redeeming!", {
          position: toast.POSITION.BOTTOM_LEFT,
        });
      },
    },
  });

  const {
    // isLoading: buyWaitIsLoading,
    isSuccess: buyWaitIsSuccess,
    isFetching: buyWaitIsFetching,
  } = useWaitForTransactionReceipt(
    { hash: buyData }
    // onSuccess(data) {
    //   //   setRefreshTickets((prevKey) => prevKey + 1);
    //   // toast("You have new tickets!", {
    //   //   position: toast.POSITION.BOTTOM_LEFT,
    //   // });
    //   if (buyData) {
    //     setDepositHash(buyData?.hash);
    //   }
    //   setIsDepositSuccessModalOpen(true);
    // },
  );

  // console.log("Redeem transaction hash:", redeemData?.hash);

  const {
    // isLoading: redeemWaitIsLoading,
    isSuccess: redeemWaitIsSuccess,
    isFetching: redeemWaitIsFetching,
  } = useWaitForTransactionReceipt(
    { hash: redeemData }
    // onSuccess(data) {
    //   console.log("Redeem success callback triggered");
    //   //   setRefreshTickets((prevKey) => prevKey + 1);
    //   toast("Redeem success!", {
    //     position: toast.POSITION.BOTTOM_LEFT,
    //   });
    // },
  );

  const {
    data: approveData,
    isPending: approveIsLoading,
    // isSuccess: approveIsSuccess,
    writeContract: writeApprove,
  } = useWriteContract({
    mutation: {
      onSuccess: () => {
        toast("Approving!", {
          position: toast.POSITION.BOTTOM_LEFT,
        });
      },
    },
  });

  const {
    isLoading: approveWaitIsLoading,
    isSuccess: approveWaitIsSuccess,
    isFetching: approveWaitIsFetching,
  } = useWaitForTransactionReceipt(
    { hash: approveData }
    // onSuccess(data) {
    //   toast("approve success!", {
    //     position: toast.POSITION.BOTTOM_LEFT,
    //   });
    // },
  );

  //   const handleUpdateBalances = () => {
  //     setUpdateBalances((prev) => !prev);
  //   };

  const handleRedeem = async () => {
    try {
      console.log("handling redeem");
      if (!chainId || !address) {
        toast("error, see console", {
          position: toast.POSITION.BOTTOM_LEFT,
        });
        console.log("error deposit / redeem, wrong chain or address ");
        return;
      }
      if (parseFloat(redeemAmount) > 0) {
        if (chainId === activeVaultChain && vaultData) {
          // console.log("trying here ya")
          const vaultContract = new ethers.Contract(
            vaultData.address,
            ABI.VAULT,
            PROVIDERS[GetChainName(activeVaultChain)]
          );
          // const amountToCheck = ethers.utils
          //   .parseUnits(redeemAmount, vaultData?.decimals)
          //   .toString();
          // const redeemPreview = await vaultContract.previewRedeem(
          //   amountToCheck
          // );
          // console.log("redeem preview",redeemPreview.toString())
          // if (redeemPreview.lt(amountToCheck)) {
          //   toast("temporary aave utilization issue", {
          //     position: toast.POSITION.BOTTOM_LEFT,
          //   });
          // }
          // else {
          if (!writeRedeem) {
            console.log("writeRedeem is not defined");
            toast("write error, see console", {
              position: toast.POSITION.BOTTOM_LEFT,
            });
          } else if (!redeemSimulate) {
            console.log(
              "redeemSimulate is not defined",
              "vault data",
              vaultData,
              "redeem amt",
              redeemAmount,
              "simulation",
              redeemSimulate
            );

            toast("simulation error, retry or see console", {
              position: toast.POSITION.BOTTOM_LEFT,
            });
          } else {
            writeRedeem(redeemSimulate.request);
          }
        } else {
          toast("wrong chain", {
            position: toast.POSITION.BOTTOM_LEFT,
          });
          console.log("invalid redeem, wrong chain");
        }
      } else {
        console.log("invalid redeem amount");
      }
    } catch (err) {
      console.log("error on redeem", err);
      toast("error on redeem, see console", {
        position: toast.POSITION.BOTTOM_LEFT,
      });
    }
  };

  const handleBuy = () => {
    try {
      if (!chainId || !address) {
        toast("error, see console", {
          position: toast.POSITION.BOTTOM_LEFT,
        });
        console.log("error deposit , undefined chain or address ");
        return;
      }
      if (parseFloat(buyAmount) > 0) {
        // console.log("active vault chain", activeVaultChain);
        if (chainId === activeVaultChain) {
          if (writeBuy) {
            // use to block vaults
            if (
              vaultData?.address.toLowerCase() ===
              "0x77935f2c72b5eb814753a05921ae495aa283906b"
            ) {
              toast("utilization is too high for new deposits", {
                position: toast.POSITION.BOTTOM_LEFT,
              });
            } else {
              console.log(
                "Trying write",
                buyAmount &&
                  parseFloat(buyAmount) > 0 &&
                  ethers.utils
                    .parseUnits(buyAmount, vaultData?.decimals)
                    .toString(),
                address
              );
              writeBuy({
                chainId: chainId,
                address: vaultData?.address as any,
                abi: ABI.VAULT,
                functionName: "deposit",

                args: [
                  buyAmount &&
                    parseFloat(buyAmount) > 0 &&
                    ethers.utils
                      .parseUnits(buyAmount, vaultData?.decimals)
                      .toString(),
                  address,
                ],

                // onSuccess(data) {
                //   toast("Buying tickets!", {
                //     position: toast.POSITION.BOTTOM_LEFT,
                //   });
                // },
              });
            }
          } else {
            console.log("writeBuy is not defined");
            toast("error, see console", {
              position: toast.POSITION.BOTTOM_LEFT,
            });
          }
        } else {
          toast("wrong chain", {
            position: toast.POSITION.BOTTOM_LEFT,
          });
          console.log("invalid deposit, wrong chain");
        }
      } else {
        console.log("invalid deposit amount");
      }
    } catch (err) {
      console.log("error on deposit", err);
      toast("error on deposit, see console", {
        position: toast.POSITION.BOTTOM_LEFT,
      });
    }
  };

  useEffect(() => {
    if (approveWaitIsSuccess && !actionCompleted.approve) {
      setActionCompleted((prev) => ({ ...prev, approve: true }));
      handleShowToast("approve");
      setRefreshData((refresh) => refresh + 1);
    }

    if (buyWaitIsSuccess && !actionCompleted.buy) {
      setActionCompleted((prev) => ({ ...prev, buy: true }));
      handleShowToast("buy");
      setRefreshData((refresh) => refresh + 1);
    }

    if (redeemWaitIsSuccess && !actionCompleted.redeem) {
      setActionCompleted((prev) => ({ ...prev, redeem: true }));
      handleShowToast("redeem");
      setRefreshData((refresh) => refresh + 1);
    }
  }, [approveWaitIsSuccess, buyWaitIsSuccess, redeemWaitIsSuccess]);

  useEffect(() => {
    async function fetchData() {
      let priceResponse;

      // console.log("fetching data");
      try {
        // const queriedChain = router.isReady
        //   ? (router.query.chain as string)
        //   : "";
        // setUrlChain(queriedChain);

        const normalizedActiveVaultAddress = activeVaultAddress.toLowerCase();
        const contract = new ethers.Contract(
          activeVaultAddress,
          ABI.VAULT,
          PROVIDERS[GetChainName(activeVaultChain)]
        );
        const userAddress = address || "";

        let name,
          symbol,
          decimals,
          asset,
          liquidationPair,
          owner,
          price,
          contributed7d,
          contributed24h,
          poolers,
          gnosis,
          status;

        if (vaultPropData && Object.keys(vaultPropData).length > 0) {
          ({
            name,
            symbol,
            decimals,
            asset,
            liquidationPair,
            owner,
            price,
            contributed7d,
            contributed24h,
            poolers,
            status
          } = vaultPropData);
          // console.log("using vault prop", price);
        } else {
          // Check the API first
          try {
            const apiResponse = await fetch(
              `https://poolexplorer.xyz/${activeVaultChain}-${
                ADDRESS[GetChainName(activeVaultChain)].PRIZEPOOL
              }`
            );

            if (apiResponse.ok) {
              const apiData: any[] = await apiResponse.json();
              const vaultData = apiData.find(
                (vault) =>
                  vault.vault.toLowerCase() === normalizedActiveVaultAddress
              );
              if (vaultData) {
                // console.log("API Gnosis Data:", gnosis);

                ({
                  name,
                  symbol,
                  decimals,
                  asset,
                  liquidationPair,
                  owner,
                  price,
                  contributed7d,
                  contributed24h,
                  poolers,
                  gnosis,
                  status
                } = vaultData);
              }
            }
          } catch (apiError) {
            console.error("Error fetching data from API:", apiError);
          }
        }

        // If any of these values are not set, fetch them from the contract
        const vaultCalls = [];
        if (!name) vaultCalls.push(contract.name());
        if (!symbol) vaultCalls.push(contract.symbol());
        if (!decimals) vaultCalls.push(contract.decimals());
        if (!asset) vaultCalls.push(contract.asset());
        if (!liquidationPair) vaultCalls.push(contract.liquidationPair());
        if (!owner) vaultCalls.push(contract.owner());
        const vaultResults =
          vaultCalls.length > 0
            ? await Multicall(vaultCalls, GetChainName(activeVaultChain))
            : [];
        if (!name) [name] = vaultResults.splice(0, 1);
        if (!symbol) [symbol] = vaultResults.splice(0, 1);
        if (!decimals) [decimals] = vaultResults.splice(0, 1);
        if (!asset) [asset] = vaultResults.splice(0, 1);
        if (!liquidationPair) [liquidationPair] = vaultResults.splice(0, 1);
        if (!owner) [owner] = vaultResults;

        // Fetch user-specific and asset-specific data

        const assetContract = new ethers.Contract(
          asset.toString(),
          ABI.ERC20,
          PROVIDERS[GetChainName(activeVaultChain)]
        );
        const twabControllerContract = new ethers.Contract(
          ADDRESS[GetChainName(activeVaultChain)].TWABCONTROLLER,
          ABI.TWABCONTROLLER,
          PROVIDERS[GetChainName(activeVaultChain)]
        );
        const assetCalls = [
          assetContract.name(),
          assetContract.symbol(),
          contract.totalAssets(),
          contract.yieldFeePercentage(),
        ];

        if (userAddress) {
          assetCalls.push(
            assetContract.balanceOf(userAddress),
            assetContract.allowance(userAddress, activeVaultAddress),
            contract.balanceOf(userAddress),
            twabControllerContract.delegateBalanceOf(
              activeVaultAddress,
              userAddress
            )
          );
        }

        const assetResults = await Multicall(
          assetCalls,
          GetChainName(activeVaultChain)
        );
        const assetPrice = await GetAssetPrice(
          GetChainName(activeVaultChain),
          asset
        );
        setAssetPrice(assetPrice as any);
        // console.log("gecko price", assetPrice);
        const assetName = assetResults[0].toString();
        const assetSymbol = assetResults[1].toString();
        const totalAssets = ethers.BigNumber.from(assetResults[2].toString());
        const yieldFeePercentage = ethers.BigNumber.from(
          assetResults[3].toString()
        );
        // console.log("yield free?!",yieldFeePercentage)

        let userAssetBalance = ethers.BigNumber.from(0);
        let userAssetAllowance = ethers.BigNumber.from(0);
        let userVaultBalance = ethers.BigNumber.from(0);
        let userDelegatedBalance = ethers.BigNumber.from(0);
        if (userAddress) {
          userAssetBalance = ethers.BigNumber.from(assetResults[4].toString());
          userAssetAllowance = ethers.BigNumber.from(
            assetResults[5].toString()
          );
          userVaultBalance = ethers.BigNumber.from(assetResults[6].toString());
          userDelegatedBalance = ethers.BigNumber.from(
            assetResults[7].toString()
          );
        }
        const fetchedData = {
          name: name.toString(),
          address: activeVaultAddress,
          symbol: symbol.toString(),
          decimals: Number(decimals),
          asset: asset.toString(),
          liquidationPair: liquidationPair.toString(),
          totalAssets: totalAssets, // This needs to be fetched from contract if required
          assetName: assetName.toString(),
          assetSymbol: assetSymbol.toString(),
          userVaultBalance,
          userDelegatedBalance,
          userAssetBalance,
          userAssetAllowance,
          owner: owner.toString(),
          price,
          contributed7d,
          contributed24h,
          poolers,
          yieldFeePercentage: yieldFeePercentage,
          gnosis,
          status
        };

        if (JSON.stringify(fetchedData) !== JSON.stringify(vaultData)) {
          setVaultData(fetchedData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsInvalidVault(true);
      }
    }

    fetchData();
  }, [
    activeVaultAddress,
    address,
    router.isReady,
    // dripUpdate,
    refreshData,
  ]);

  useEffect(() => {
    async function getApr() {
      if(overviewFromContext.overview){
      const promos = await GetActivePromotionsForVaults(
        [activeVaultAddress],
        true,
        overviewFromContext.overview
      );
      // console.log("vault promos", promos);
      setActivePromos(promos);}
    }
    getApr();
  }, [activeVaultAddress, address, router.isReady]);

  // vaultData && console.log("contributed",vaultData?.contributed7d, typeof vaultData.contributed7d);
  // console.log("active promos here", activePromos);
  // console.log("active vault here", activeVaultAddress);
  // console.log("vault data",vaultData)
  return (
    <Layout>
      {/* {vaultData && <h3>{vaultData.name}</h3>} */}
      <div style={{ paddingBottom: "18px" }}>
        {vaultData && (
          <span
            style={{
              fontSize: "26px",
              color: "rgb(225, 245, 249)",
              display: "flex",
              alignItems: "center",
            }}>
            {getVaultIcon(
              activeVaultAddress,
              GetChainName(activeVaultChain)
            ) ? (
              <>
                <Image
                  src={
                    getVaultIcon(
                      activeVaultAddress,
                      GetChainName(activeVaultChain)
                    ) as string
                  }
                  alt="icon"
                  width={26}
                  height={26}
                  layout="fixed"
                  style={{ verticalAlign: "middle" }} // Apply vertical alignment
                />
                &nbsp;&nbsp;
              </>
            ) : null}
            {vaultData.name}
            <div className="chain-bubble">
              {GetChainName(activeVaultChain)}&nbsp;
            </div>{" "}
            &nbsp;&nbsp;
            {/* {vaultData && chainId === 84532 && <Drip chainProp={"BASESEPOLIA"} addressProp={vaultData.asset} updateNow={dripUpdate}></Drip> } */}
          </span>
        )}
      </div>

      <div className="vault-container">
        <div className="vault-content">
          {vaultData && vaultData.status === 0 && <div><FontAwesomeIcon
                              icon={faExclamationCircle}
                              size="sm"
                              style={{
                                color: "#f24444",
                                height: "18px",
                                marginRight: "8px",
                                marginLeft: "5px",
                              }}
                            />Deposits and withdraws are deprecated</div>} 
          {vaultData && vaultData.status === 1 && <div><FontAwesomeIcon
                              icon={faExclamationCircle}
                              size="sm"
                              style={{
                                color: "#f87806",
                                height: "18px",
                                marginRight: "8px",
                                marginLeft: "5px",
                              }}
                            />This vault is withdraw only</div>} 

          {isInvalidVault ? (
            <div className="error-message">Invalid Vault Address</div>
          ) : (
            <>
              {vaultData ? (
                <>
                  {/* DEPOSIT AND WITHDRAW */}

                  {vaultData.userVaultBalance &&
                    vaultData.userVaultBalance.gt(0) && vaultData.status !== 0 && (
                      <>
                        <br></br>
                        <div className="balance-data-row">
                          <span className="vault-label vault-balance">
                            <FontAwesomeIcon
                              icon={faTicket}
                              size="sm"
                              style={{
                                cursor: "pointer",
                                color: "#21325c",
                                height: "18px",
                                marginRight: "10px",
                                marginLeft: "5px",
                              }}
                              onClick={() =>
                                CopyToClipboardButton(activeVaultAddress)
                              }
                            />
                            <span style={{fontSize:"19px"}}>Your Tickets</span>
                          </span>
                          <span className="vault-balance">
                            {NumberWithCommas(
                              CropDecimals(
                                ethers.utils.formatUnits(
                                  vaultData.userVaultBalance,
                                  vaultData.decimals
                                )
                              )
                            )}{" "}
                            {vaultData.symbol}{" "}
                            <button
                              className="max-small"
                              onClick={() =>
                                setRedeemAmount(
                                  ethers.utils.formatUnits(
                                    vaultData.userVaultBalance,
                                    vaultData.decimals
                                  )
                                )
                              }>
                              max
                            </button>
                          </span>
                        </div>
                      </>
                    )}

                  <div className="vault-input-container">
                    {vaultData && vaultData.userVaultBalance.gt(0) && vaultData.status !== 0  && (
                      <div className="input-button-group">
                        <input
                          type="text"
                          placeholder="Amount"
                          className="vault-input-field"
                          onChange={handleRedeemAmountChange}
                          value={redeemAmount}
                        />
                        {/* <button className="vault-button">REDEEM TICKETS</button> */}

                        <>
                          {vaultData.userVaultBalance && !chainId ? (
                            <button className="button no-cursor">
                              CONNECT WALLET
                            </button>
                          ) : chainId !== activeVaultChain ? (
                            <button
                              className="vault-button pointer"
                              disabled={!switchChain}
                              onClick={() =>
                                switchChain({ chainId: activeVaultChain })
                              }>
                              SWITCH NETWORKS
                            </button>
                          ) : redeemIsLoading ? (
                            <button className="vault-button">
                              <div className="spinner-small"></div>
                              SEE WALLET
                            </button>
                          ) : parseFloat(redeemAmount) >
                            parseFloat(
                              ethers.utils.formatUnits(
                                vaultData.userVaultBalance || 0,
                                vaultData?.decimals || 0
                              )
                            ) ? (
                            <button className="vault-button">
                              INSUFFICIENT BALANCE
                            </button>
                          ) : redeemWaitIsFetching ? (
                            <button className="vault-button">
                              <div className="spinner-small"></div>
                              PROCESSING
                            </button>
                          ) : parseFloat(
                              ethers.utils.formatUnits(
                                vaultData.userVaultBalance || 0,
                                vaultData.decimals || 0
                              )
                            ) >= parseFloat(redeemAmount) ? (
                            <button
                              onClick={handleRedeem}
                              className="vault-button">
                              REDEEM
                            </button>
                          ) : (
                            <button
                              onClick={handleRedeem}
                              className="vault-button no-cursor">
                              REDEEM
                            </button>
                          )}
                        </>
                      </div>
                    )}
                  </div>

                  {vaultData.userAssetBalance &&
                    vaultData.userAssetBalance.gt(0) && vaultData.status !== 0 && vaultData.status !== 1 && (
                      <div className="balance-data-row">
                        <span className="vault-label vault-balance">
                          <FontAwesomeIcon
                            icon={faWallet}
                            size="sm"
                            style={{
                              cursor: "pointer",
                              color: "#21325c",
                              height: "18px",
                              marginRight: "10px",
                              marginLeft: "5px",
                            }}
                            onClick={() =>
                              CopyToClipboardButton(activeVaultAddress)
                            }
                          />
                         <span style={{fontSize:"19px"}}>Your Deposit Tokens</span>
                        </span>
                        <span className="vault-balance">
                          {NumberWithCommas(
                            CropDecimals(
                              ethers.utils.formatUnits(
                                vaultData.userAssetBalance,
                                vaultData.decimals
                              )
                            )
                          )}{" "}
                          {vaultData.assetSymbol}{" "}
                          <button
                            className="max-small"
                            onClick={() =>
                              setBuyAmount(
                                ethers.utils.formatUnits(
                                  vaultData.userAssetBalance,
                                  vaultData.decimals
                                )
                              )
                            }>
                            max
                          </button>
                        </span>
                      </div>
                    )}

                  <div className="vault-input-container">
                    {vaultData && vaultData.userAssetBalance.gt(0)  && vaultData.status !== 0 && vaultData.status !== 1 && (
                      <div className="input-button-group">
                        <input
                          type="text"
                          placeholder="Amount"
                          className="vault-input-field"
                          value={buyAmount}
                          onChange={handleBuyAmountChange}
                        />
                        {/* <button className="vault-button">BUY TICKETS</button> */}

                        {!chainId ? (
                          <button className="vault-button no-cursor">
                            CONNECT WALLET
                          </button>
                        ) : chainId !== activeVaultChain ? (
                          <button
                            className="vault-button pointer"
                            disabled={!switchChain}
                            onClick={() =>
                              switchChain({ chainId: activeVaultChain })
                            }>
                            SWITCH NETWORKS
                          </button>
                        ) : buyIsLoading ? (
                          <button className="vault-button">
                            <div className="spinner-small"></div>
                            SEE WALLET
                          </button>
                        ) : approveIsLoading ? (
                          <button className="vault-button">
                            <div className="spinner-small"></div>
                            SEE WALLET
                          </button>
                        ) : buyWaitIsFetching || approveWaitIsFetching ? (
                          <button className="vault-button">
                            <div className="spinner-small"></div>
                            PROCESSING
                          </button>
                        ) : vaultData.userAssetBalance === undefined ? (
                          ""
                        ) : parseFloat(buyAmount) >
                          parseFloat(
                            ethers.utils.formatUnits(
                              vaultData.userAssetBalance,
                              vaultData.decimals || 0
                            )
                          ) ? (
                          <button className="vault-button hover-button no-cursor">
                            INSUFFICIENT BALANCE
                          </button>
                        ) : vaultData.userAssetAllowance &&
                          vaultData.decimals !== undefined &&
                          parseFloat(
                            ethers.utils.formatUnits(
                              vaultData.userAssetAllowance,
                              vaultData.decimals
                            )
                          ) >= parseFloat(buyAmount) ? (
                          <button onClick={handleBuy} className="vault-button">
                            DEPOSIT FOR TICKETS
                          </button>
                        ) : parseFloat(buyAmount) > 0 ? (
                          <button
                            onClick={() => {
                              // console.log("CHAIN ID",chainId,"CONFIG",CONFIG.CHAINID)
                              if (chainId === activeVaultChain) {
                                if (
                                  vaultData?.address.toLowerCase() ===
                                    "0x77935f2c72b5eb814753a05921ae495aa283906b" ||
                                  vaultData?.address.toLowerCase() ===
                                    "0xce8293f586091d48a0ce761bbf85d5bcaa1b8d2b"
                                ) {
                                  toast(
                                    "aave utilization is too high for new deposits",
                                    {
                                      position: toast.POSITION.BOTTOM_LEFT,
                                    }
                                  );
                                } else {
                                  toast.dismiss();

                                  writeApprove({
                                    address: `0x${vaultData?.asset.substring(
                                      2
                                    )}`,
                                    abi: ABI.ERC20,
                                    functionName: "approve",

                                    args: [
                                      vaultData.address as any,
                                      ethers.utils.parseUnits(
                                        buyAmount,
                                        vaultData.decimals
                                      ),
                                    ],
                                  });
                                }
                              } else {
                                toast(
                                  "please switch to " +
                                    GetChainName(activeVaultChain)
                                );
                              }
                            }}
                            className="vault-button">
                            APPROVE
                          </button>
                        ) : (
                          <button className="vault-button no-cursor">
                            DEPOSIT FOR TICKETS
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {vaultData &&
                    vaultData.userAssetBalance.eq(0) &&
                    vaultData.userVaultBalance.eq(0) &&
                    (address ? (
                      <>
                        <div style={{ textAlign: "center" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                            }}>
                            <FontAwesomeIcon
                              icon={faExclamationCircle}
                              size="sm"
                              style={{
                                color: "#21325c",
                                height: "18px",
                                marginRight: "8px",
                                marginLeft: "5px",
                              }}
                            />
                            To play in this pool you need{" "}
                            {vaultData.assetSymbol} tokens
                          </span>
                        </div>
                        <br></br>
                      </>
                    ) : (
                      <>
                        {/* <button onClick={openConnectModal} type="button" className="hover-button"> */}
                        <MyConnect connectText={"CONNECT WALLET TO WIN"} /><br></br>
                      </>
                    ))}

                  {vaultData.userDelegatedBalance &&
                    vaultData.userDelegatedBalance.gt(
                      vaultData.userVaultBalance
                    ) && (
                      <div className="data-row">
                        <span className="vault-label">Delegated To You</span>
                        <span className="vault-data">
                          <Image
                            src={
                              getVaultIcon(
                                activeVaultAddress,
                                GetChainName(activeVaultChain)
                              ) as string
                            }
                            alt="icon"
                            width={16}
                            height={16}
                            layout="fixed"
                            style={{ verticalAlign: "middle" }} // Apply vertical alignment
                          />
                          &nbsp;
                          {NumberWithCommas(
                            CropDecimals(
                              ethers.utils.formatUnits(
                                vaultData.userDelegatedBalance.sub(
                                  vaultData.userVaultBalance
                                ),
                                vaultData.decimals
                              )
                            )
                          )}
                        </span>
                      </div>
                    )}
                
                  {address && activeVaultAddress && (
                    <div className="data-row">
                      <span className="vault-two">
                        <VaultRewards
                        chainId = {activeVaultChain}
                          chainName={GetChainName(activeVaultChain)}
                          address={address}
                          vaults={[activeVaultAddress]}
                          prices={[]}
                        />
                      </span>
                    </div>
                  )}
                  <div className="data-row">
                    <span className="vault-label">Total Deposits (TVL)</span>
                    <span className="vault-data">
                      {NumberWithCommas(
                        CropDecimals(
                          ethers.utils.formatUnits(
                            vaultData.totalAssets,
                            vaultData.decimals
                          )
                        )
                      )}{" "}
                      {vaultData.assetSymbol}
                    </span>
                  </div>
                  {!seeAddresses && (
                    <>
                      {vaultData.poolers && (
                        <div className="data-row">
                          <span className="vault-label">Poolers</span>
                          <span className="vault-data">
                            {NumberWithCommas(vaultData.poolers.toFixed(0))}
                          </span>
                        </div>
                      )}
                      {parseFloat(vaultData.contributed7d) !== 0 &&
                        parseFloat(vaultData.contributed7d) > 0 && (
                          <div className="data-row hidden-mobile">
                            <span className="vault-label">7d Vault Yield</span>
                            <span className="vault-data">
                              <PrizeIcon size={15} />
                              &nbsp;
                              {NumberWithCommas(
                                CropDecimals(vaultData.contributed7d)
                              )}
                            </span>
                          </div>
                        )}

                      {vaultData.yieldFeePercentage.gt(0) && (
                        <div className="data-row">
                          <span className="vault-label">Vault Fee</span>
                          <span className="vault-data">
                            {NumberWithCommas(
                              CropDecimals(
                                parseFloat(
                                  ethers.utils.formatUnits(
                                    vaultData.yieldFeePercentage,
                                    7
                                  )
                                ).toFixed(2)
                              )
                            )}
                            %
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {/* TWAB REWARDS  */}

                  {/* {console.log("promos?", activePromos)} */}
                  {/* // rewards per second * seconds in year / total assets * assets price */}
                  {activePromos &&
                    (activePromos as { [key: string]: any[] })[
                      activeVaultAddress.toLowerCase()
                    ] &&
                    (activePromos as { [key: string]: any[] })[
                      activeVaultAddress.toLowerCase()
                    ].length > 0 &&
                    vaultData && (
                      <>
                        {(activePromos as { [key: string]: any[] })[
                          activeVaultAddress.toLowerCase()
                        ]
                          .filter((activePromo) => activePromo.whitelist) // Filter to only include whitelisted promotions
                          .map((activePromo, index) => {
                            const tokensPerSecond = Number(
                              ethers.utils.formatUnits(
                                Math.round(activePromo.tokensPerSecond),
                                activePromo.decimals
                              )
                            );
                            const annualTokens =
                              tokensPerSecond * 60 * 60 * 24 * 365;
                            const totalAssetsInVault = Number(
                              ethers.utils.formatUnits(
                                vaultData.totalAssets,
                                vaultData.decimals
                              )
                            );
                            const promoTokenPrice = activePromo.price;
                            const vaultTokenPrice = assetPrice;
                            const annualYieldPercentage =
                              ((annualTokens * promoTokenPrice) /
                                (totalAssetsInVault * vaultTokenPrice)) *
                              100;

                            return (
                              <div key={index} className="data-row">
                                <span className="vault-label">Rewards</span>
                                <span className="vault-data">
                                  <Image
                                    src="/images/optimism.webp"
                                    width={15}
                                    height={15}
                                    alt="OP"
                                  />
                                  &nbsp;
                                  {NumberWithCommas(
                                    CropDecimals(annualYieldPercentage)
                                  )}
                                  %
                                </span>
                              </div>
                            );
                          })}
                      </>
                    )}

                  {seeAddresses && (
                    <span
                      className="vault-two small-font pointer"
                      onClick={() => setSeeAddresses(false)}>
                      - Close more info
                    </span>
                  )}
                  {!seeAddresses ? (
                    <div className="data-row">
                      <span
                        className="vault-two small-font pointer"
                        onClick={() => setSeeAddresses(true)}>
                        <>
                          <br></br>
                          {!vaultData.gnosis
                            ? "+ Click for more info"
                            : vaultData.gnosis.required === -1
                            ? "+ Yield is governed by EOA wallet, click for more info"
                            : vaultData.gnosis.total === 0 &&
                              vaultData.gnosis.required === 0
                            ? "+ This vault is immutable! Click for more info"
                            : `+ Yield is governed by a ${vaultData.gnosis.required} of ${vaultData.gnosis.total} Gnosis Safe, click for more info`}
                        </>
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="data-row">
                        <span className="address-label">Vault Address </span>
                        <span className="address-data small-font">
                          <span className="hidden-mobile">
                            {activeVaultAddress}{" "}
                          </span>
                          <span className="hidden-desktop">
                            {activeVaultAddress.substring(0, 12)}...{" "}
                          </span>

                          <FontAwesomeIcon
                            icon={faCopy}
                            size="sm"
                            style={{
                              cursor: "pointer",
                              color: "#21325c",
                              height: "14px",
                              marginRight: "5px",
                              marginLeft: "5px",
                            }}
                            onClick={() =>
                              CopyToClipboardButton(activeVaultAddress)
                            }
                          />
                          <a
                            href={
                              ADDRESS[GetChainName(activeVaultChain)]
                                .ETHERSCAN +
                              "address/" +
                              activeVaultAddress
                            }
                            target="_blank"
                            rel="noreferrer">
                            <Image
                              src="/images/etherscan.svg"
                              height={14}
                              width={14}
                              alt="etherscan"
                            />
                          </a>
                        </span>
                      </div>
                      <hr className="condensed-hr" />
                      <div className="address-row">
                        <span className="address-label">Owner</span>
                        <span className="address-data small-font">
                          <span className="hidden-mobile">
                            {vaultData.owner}{" "}
                          </span>
                          <span className="hidden-desktop">
                            {vaultData.owner.substring(0, 12)}...{" "}
                          </span>

                          <FontAwesomeIcon
                            icon={faCopy}
                            size="sm"
                            style={{
                              cursor: "pointer",
                              color: "#21325c",
                              height: "14px",
                              marginRight: "5px",
                              marginLeft: "5px",
                            }}
                            onClick={() =>
                              CopyToClipboardButton(vaultData.owner)
                            }
                          />
                          <a
                            href={
                              ADDRESS[GetChainName(activeVaultChain)]
                                .ETHERSCAN +
                              "address/" +
                              vaultData.owner
                            }
                            target="_blank"
                            rel="noreferrer">
                            <Image
                              src="/images/etherscan.svg"
                              height={14}
                              width={14}
                              alt="etherscan"
                            />
                          </a>
                        </span>
                      </div>
                      <hr className="condensed-hr" />

                      {/* <div className="data-row">
                                    <span className="vault-label">Decimals</span>
                                    <span className="vault-data">{vaultData.decimals}</span>
                                </div> */}

                      {/* <div className="address-row">
    <span className="address-label">Asset</span>
    <span className="address-data small-font">
        {vaultData.asset} &nbsp; &nbsp;
        <a href={"https://optimistic.etherscan.io/address/"+vaultData.asset} target="_blank" rel="noreferrer"><Image src="/images/etherscan.svg" height={14} width={14} alt="etherscan" /></a>
    </span>
</div> */}
                      {/* <hr className="condensed-hr"/> */}

                      <div className="address-row">
                        <span className="address-label">Liquidation Pair</span>
                        <span className="address-data small-font">
                          <span className="hidden-mobile">
                            {vaultData.liquidationPair}{" "}
                          </span>
                          <span className="hidden-desktop">
                            {vaultData.liquidationPair.substring(0, 12)}...{" "}
                          </span>

                          <FontAwesomeIcon
                            icon={faCopy}
                            size="sm"
                            style={{
                              cursor: "pointer",
                              color: "#21325c",
                              height: "14px",
                              marginRight: "5px",
                              marginLeft: "5px",
                            }}
                            onClick={() =>
                              CopyToClipboardButton(vaultData.liquidationPair)
                            }
                          />
                          <a
                            href={
                              ADDRESS[GetChainName(activeVaultChain)]
                                .ETHERSCAN +
                              "address/" +
                              vaultData.liquidationPair
                            }
                            target="_blank"
                            rel="noreferrer">
                            <Image
                              src="/images/etherscan.svg"
                              height={14}
                              width={14}
                              alt="etherscan"
                            />
                          </a>
                        </span>
                      </div>
                      <hr className="condensed-hr" />

                      <div className="address-row">
                        <span className="address-label">Deposit Token</span>
                        <span className="address-data small-font">
                          <span className="hidden-mobile">
                            {vaultData.asset}{" "}
                          </span>
                          <span className="hidden-desktop">
                            {vaultData.asset.substring(0, 12)}...{" "}
                          </span>

                          <FontAwesomeIcon
                            icon={faCopy}
                            size="sm"
                            style={{
                              cursor: "pointer",
                              color: "#21325c",
                              height: "14px",
                              marginRight: "5px",
                              marginLeft: "5px",
                            }}
                            onClick={() =>
                              CopyToClipboardButton(vaultData.asset)
                            }
                          />
                          <a
                            href={
                              ADDRESS[GetChainName(activeVaultChain)]
                                .ETHERSCAN +
                              "address/" +
                              vaultData.asset
                            }
                            target="_blank"
                            rel="noreferrer">
                            <Image
                              src="/images/etherscan.svg"
                              height={14}
                              width={14}
                              alt="etherscan"
                            />
                          </a>
                        </span>
                      </div>
                    </>
                  )}
                  {/* <div className="data-row">
                                    <span className="vault-label">Asset Symbol</span>
                                    <span className="vault-data"></span>
                                </div> */}

                  {/* <div className="data-row">
                                    <span className="vault-label">Balance</span>
                                    <span className="vault-data">{vaultData.balance}</span>
                                </div> */}
                </>
              ) : (
                <center>
                  <div className="spinner-large" />
                </center>
              )}
            </>
          )}
        </div>
      </div>
      <ToastContainer style={{ zIndex: 9999 }} />
      {vaultData && (
        <DepositSuccessModal
          isOpen={isDepositSuccessModalOpen}
          onClose={handleCloseModal}
          symbol={vaultData.assetSymbol}
          amount={buyAmount}
          hash={depositHash}
        />
      )}
    </Layout>
  );
};

export default Vault;

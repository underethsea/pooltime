import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { ABI, ADDRESS, PROVIDERS, CONFIG } from "../constants";
import { MyConnect } from "../components/connectButton";
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
import PrizeIcon from "../components/prizeIcon";
import PrizeValueIcon from "../components/prizeValueIcon";
import PrizeValue from "../components/prizeValue";
import {
  faCopy,
  faTicket,
  faWallet,
  faExclamationCircle,
  faArrowLeft,
  faGreaterThan,
} from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/router";
import { GetActivePromotionsForVaults } from "../utils/getActivePromotions";
import { DepositSuccessModal } from "../components/depositSuccessModal";
import { VaultRewards } from "../components/vaultRewards";
import { getGeckoPriceForTokenAddress } from "../utils/tokenPrices";
import { GetChainName } from "../utils/getChain";
import { GetAssetPrice } from "../utils/getAssetPrice";
import Layout from "../pages";
import Link from "next/link";
import IconDisplay from "../components/icons";
import { useOverview } from "../components/contextOverview";
import { WHITELIST_REWARDS } from "../constants/address";

import { GetChance } from "../utils/getChance";
import { GetChainIcon } from "../utils/getChain";

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
  won7d: string;
  prizes7d: string;
  prizesPerDraw7d: string;
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
  won7d: string;
  prizes7d: string;
  prizesPerDraw7d: string;
  contributed24h: string;
  poolers: number;
  yieldFeePercentage: ethers.BigNumber;
  gnosis?: GnosisInfo; // gnosis is optional and conforms to GnosisInfo interface
  status?: number;
}

interface Chance {
  winsPerDraw7d: number;
  winsPerDraw30d: number;
  grandPrize: number;
  grandPrizeDuration: number;
  grandPrizeVaultPortion: number;
  sevenDrawVaultPortion: number;
  firstTier: number;
  firstTierDuration: number;
  firstTierVaultPortion: number;
}

const dripUpdate = () => {
  return 1;
};

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
  vAddress,
  vaultPropData,
}) => {
  const { chains, switchChain } = useSwitchChain();

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
  // console.log("active vault chain", activeVaultChain);
  // console.log("active vualt address", activeVaultAddress);
  const [vaultData, setVaultData] = useState<VaultData | null>(null);
  const [isInvalidVault, setIsInvalidVault] = useState<boolean>(false);
  const [buyAmount, setBuyAmount] = useState<string>("");
  const [redeemAmount, setRedeemAmount] = useState<string>("");
  const [seeAddresses, setSeeAddresses] = useState<boolean>(false);
  const [seeChance, setSeeChance] = useState<boolean>(false);

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
  // const [apiPricing, setApiPricing] = useState();
  const [assetPrice, setAssetPrice] = useState(0);
  const [ethPrice, setEthPrice] = useState(0);
  const [chance, setChance] = useState<Chance | null>(null);
  // const [ vaultChainId, setVaultChainId] = useState()

  const overviewFromContext = useOverview();

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
  } = useWaitForTransactionReceipt({ hash: buyData });

  // console.log("Redeem transaction hash:", redeemData?.hash);

  const {
    // isLoading: redeemWaitIsLoading,
    isSuccess: redeemWaitIsSuccess,
    isFetching: redeemWaitIsFetching,
  } = useWaitForTransactionReceipt({ hash: redeemData });

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
  } = useWaitForTransactionReceipt({ hash: approveData });

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
        console.log("active vault chain", activeVaultChain);
        if (chainId === activeVaultChain) {
          console.log("Chain ids match");
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
      if (activeVaultAddress) {
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
            won7d,
            prizes7d,
            prizesPerDraw7d,
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
              won7d,
              prizes7d,
              prizesPerDraw7d,
              poolers,
              status,
            } = vaultPropData);
            console.log("using vault prop", price);
          } else {
            // Check the API first
            try {
              // console.log(
              //   "using API for vault data",
              //   activeVaultChain,
              //   activeVaultAddress
              // );
              const apiResponse = await fetch(
                `https://poolexplorer.xyz/vaults`
              );

              if (apiResponse.ok) {
                const apiData: any[] = await apiResponse.json();
                const vaultData = apiData.find(
                  (vault) =>
                    vault.vault.toLowerCase() === normalizedActiveVaultAddress
                );
                // console.log("vault data found", vaultData);
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
                    won7d,
                    prizes7d,
                    poolers,
                    gnosis,
                    status,
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
          const [assetResults, assetPrice] = await Promise.all([
            Multicall(assetCalls, GetChainName(activeVaultChain)),
            GetAssetPrice(GetChainName(activeVaultChain), asset),
          ]);

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
            userAssetBalance = ethers.BigNumber.from(
              assetResults[4].toString()
            );
            userAssetAllowance = ethers.BigNumber.from(
              assetResults[5].toString()
            );
            userVaultBalance = ethers.BigNumber.from(
              assetResults[6].toString()
            );
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
            won7d,
            prizes7d,
            poolers,
            yieldFeePercentage: yieldFeePercentage,
            gnosis,
            status,
          };

          if (JSON.stringify(fetchedData) !== JSON.stringify(vaultData)) {
            setVaultData(fetchedData as any);
          }
        } catch (error) {
          console.error("Error fetching data:", error);
          setIsInvalidVault(true);
        }
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
    if (overviewFromContext?.overview?.prices?.geckos?.ethereum) {
      setEthPrice(overviewFromContext?.overview?.prices?.geckos?.ethereum);
    } else {
      // console.log("no overview");
    }
  }, [assetPrice]);
  useEffect(() => {
    async function fetchData() {
      const promises = [];

      if (
        overviewFromContext &&
        overviewFromContext.overview &&
        overviewFromContext.overview.prices
      ) {
        if (activeVaultAddress) {
          const promoPromise = GetActivePromotionsForVaults(
            [activeVaultAddress],
            true,
            overviewFromContext.overview.prices
          ).then((promos) => {
            setActivePromos(promos);
          });
          promises.push(promoPromise);
        }
      }

      if (activeVaultAddress && address) {
        const chancePromise = GetChance(
          activeVaultChain,
          activeVaultAddress,
          address
        ).then((chance) => {
          setChance(chance);
        });
        promises.push(chancePromise);
      }

      await Promise.all(promises);
    }

    if (activeVaultAddress && router.isReady) {
      fetchData();
    }
  }, [activeVaultAddress, address, router.isReady]);

  // vaultData && console.log("contributed",vaultData?.contributed7d, typeof vaultData.contributed7d);
  // console.log("active promos here", activePromos);
  // console.log("active vault here", activeVaultAddress);
  // console.log("vault data", vaultData);
  function averageDaysToWin() {
    if (chance && vaultData) {
      const winsPerDraw7d = chance.winsPerDraw7d;
      const winsPerDraw30d = chance.winsPerDraw30d;

      const userVaultBalance = Number(vaultData.userVaultBalance);
      const totalAssets = Number(vaultData.totalAssets);

      // Calculate the average number of prizes per draw for this vault portion
      const averagePrizesPerDraw =
        winsPerDraw30d > 0 ? winsPerDraw30d : winsPerDraw7d;
      const vaultPortion = chance.sevenDrawVaultPortion;
      // Calculate the probability of winning in a single draw
      const probabilityOfWinningPerDraw =
        (userVaultBalance / totalAssets) * vaultPortion * averagePrizesPerDraw;
      // Ensure probability is within valid range [0, 1]
      if (probabilityOfWinningPerDraw > 1) {
        return 1;
      }
      if (probabilityOfWinningPerDraw <= 0) {
        // console.log(
        //   "Invalid probability of winning per draw:",
        //   probabilityOfWinningPerDraw
        // );
        return null;
      }

      // Calculate the expected number of draws until the user wins
      const estimatedDrawsUntilWin = 1 / probabilityOfWinningPerDraw;

      // console.log("estimated days to win", estimatedDrawsUntilWin);
      return estimatedDrawsUntilWin;
    }
  }

  const userWinChance = averageDaysToWin();
  // console.log("user win chance",userWinChance)
  return (
    <Layout>
      <center>
        {/* <div
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
        </div> */}
        {/* <div className="vault-modal-overlay"> */}
        <Link href="/">
          <div className="back-to-vaults" style={{ marginTop: "10px" }}>
            <FontAwesomeIcon
              icon={faArrowLeft}
              size="sm"
              style={{
                color: "white",
                height: "16px",
                marginRight: "8px",
                marginLeft: "5px",
              }}
            />{" "}
            Back to all vaults
          </div>
        </Link>
        <div className="vault-view-bubble">
          {/* <button className="modal-close-button">
          &times;
        </button>      */}
          {/* {vaultData && <h3>{vaultData.name}</h3>} */}
          <div style={{ paddingBottom: "18px" }}>
            {vaultData && (
              <>
                <div>
                  <span
                    className="vault-header"
                    style={{
                      // marginLeft: "45px",
                      // fontSize: "26px",
                      color: "rgb(225, 245, 249)",
                      display: "flex",
                      alignItems: "center",
                    }}>
                    {/* <span className="hidden-desktop">
                      {activeVaultChain !== undefined && (
                        <Image
                          src={GetChainIcon(activeVaultChain) as any}
                          alt={GetChainIcon(activeVaultChain)}
                          width={24}
                          height={24}
                          style={{ marginRight: "8px" }}
                        />
                      )}
                    </span> */}

                    <IconDisplay name={vaultData.name} size={24} />
                    {/* 
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
            ) : null} */}
                    <span className="vault-header-name">{vaultData.name}</span>
                    <div className="chain-bubble hidden-mobile">
                      {GetChainName(activeVaultChain)}&nbsp;
                    </div>{" "}
                    {/* {vaultData && chainId === 84532 && <Drip chainProp={"BASESEPOLIA"} addressProp={vaultData.asset} updateNow={dripUpdate}></Drip> } */}
                  </span>{" "}
                </div>
              </>
            )}
          </div>

          <div className="vault-container">
            <div className="vault-content">
              {vaultData && vaultData.status === 0 && (
                <div>
                  <FontAwesomeIcon
                    icon={faExclamationCircle}
                    size="sm"
                    style={{
                      color: "#f24444",
                      height: "18px",
                      marginRight: "8px",
                      marginLeft: "5px",
                    }}
                  />
                  Deposits and withdraws are deprecated
                </div>
              )}
              {vaultData && vaultData.status === 1 && (
                <div>
                  <FontAwesomeIcon
                    icon={faExclamationCircle}
                    size="sm"
                    style={{
                      color: "#f87806",
                      height: "18px",
                      marginRight: "8px",
                      marginLeft: "5px",
                    }}
                  />
                  This vault is withdraw only
                </div>
              )}

              {isInvalidVault ? (
                <div className="error-message">Invalid Vault Address</div>
              ) : (
                <>
                  {vaultData ? (
                    <>
                      {/* DEPOSIT AND WITHDRAW */}

                      {vaultData.userVaultBalance &&
                        vaultData.userVaultBalance.gt(0) &&
                        vaultData.status !== 0 && (
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
                                <span style={{ fontSize: "19px" }}>
                                  Your Tickets
                                </span>
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
                        {vaultData &&
                          vaultData.userVaultBalance.gt(0) &&
                          vaultData.status !== 0 && (
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
                        {userWinChance && userWinChance !== null && (
                          <>
                            On average you will win{" "}
                            {userWinChance === 1 ? (
                              <>every day</>
                            ) : (
                              <>every {userWinChance.toFixed(0)} days</>
                            )}
                            &nbsp;
                            {chance &&
                              (chance.winsPerDraw7d ||
                                chance.winsPerDraw30d ||
                                chance.sevenDrawVaultPortion) && (
                                <div className="tooltipContainer">
                                  <Image
                                    src="/images/moreInfo.svg"
                                    alt="i"
                                    width={16}
                                    height={16}
                                  />
                                  <span className="tooltipText">
                                    {chance.winsPerDraw30d &&
                                    chance.winsPerDraw30d > 0
                                      ? chance.winsPerDraw30d.toFixed(0)
                                      : chance.winsPerDraw7d.toFixed(0)}{" "}
                                    prizes per draw
                                    <br />
                                    {(
                                      chance?.sevenDrawVaultPortion * 100
                                    ).toFixed(1)}
                                    % vault portion
                                    <br />
                                    {(
                                      100 *
                                      (Number(vaultData.userVaultBalance) /
                                        Number(vaultData.totalAssets))
                                    ).toFixed(1)}
                                    % your portion
                                  </span>
                                </div>
                              )}{" "}
                            <br></br>
                            <br></br>
                          </>
                        )}

                        {chance &&
                          chance.grandPrize > 0 &&
                          chance.grandPrize !== Infinity &&
                          vaultData &&
                          vaultData.userVaultBalance.gt(0) && (
                            <>
                              <div
                                style={{
                                  textAlign: "center",
                                  marginBottom: "10px",
                                }}
                                className="chance-progress">
                                <div className="chance-header">
                                  {overviewFromContext &&
                                    overviewFromContext.overview && (
                                      <>
                                        {" "}
                                        Your Chance <PrizeValueIcon size={15} />
                                        <PrizeValue
                                          amount={BigInt(
                                            (
                                              1e18 *
                                              overviewFromContext.overview
                                                .pendingPrize[
                                                GetChainName(activeVaultChain)
                                              ].prizes.tierData[0].value
                                            ).toFixed(0)
                                          )}
                                          size={15}
                                        />
                                      </>
                                    )}{" "}
                                  Jackpot (
                                  {chance.grandPrizeDuration.toString()}d)
                                </div>

                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    marginBottom: "5px",
                                  }}>
                                  <div
                                    style={{
                                      flex: 1,
                                      height: "20px",
                                      background: "#1F4C70",
                                      borderRadius: "10px",
                                      position: "relative",
                                    }}>
                                    <div
                                      style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        height: "100%",
                                        width: `${Math.min(
                                          (1 /
                                            ((Number(
                                              vaultData.userVaultBalance
                                            ) /
                                              Number(vaultData.totalAssets)) *
                                              chance.grandPrizeVaultPortion) /
                                            chance.grandPrize) *
                                            100,
                                          100
                                        )}%`,
                                        background: "#b09ec5",
                                        borderRadius: "10px",
                                      }}
                                    />
                                  </div>
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                  }}>
                                  <span className="chances">
                                    Current 1 in{" "}
                                    {NumberWithCommas(
                                      chance.grandPrize.toFixed(0)
                                    )}
                                  </span>
                                  <span className="chances">
                                    Projected 1 in{" "}
                                    {NumberWithCommas(
                                      (
                                        1 /
                                        ((Number(vaultData.userVaultBalance) /
                                          Number(vaultData.totalAssets)) *
                                          chance.grandPrizeVaultPortion)
                                      ).toFixed(0)
                                    )}
                                  </span>
                                </div>
                              </div>
                            </>
                          )}
                        {chance &&
                          chance.grandPrize > 0 &&
                          chance.grandPrize !== Infinity &&
                          vaultData &&
                          vaultData.userVaultBalance.gt(0) && (
                            <>
                              <div
                                style={{
                                  textAlign: "center",
                                  marginBottom: "10px",
                                }}
                                className="chance-progress">
                                <div className="chance-header">
                                  {overviewFromContext &&
                                    overviewFromContext.overview && (
                                      <>
                                        {" "}
                                        Your Chance <PrizeValueIcon size={15} />
                                        <PrizeValue
                                          amount={BigInt(
                                            (
                                              1e18 *
                                              overviewFromContext.overview
                                                .pendingPrize[
                                                GetChainName(activeVaultChain)
                                              ].prizes.tierData[1].value
                                            ).toFixed(0)
                                          )}
                                          size={15}
                                        />
                                      </>
                                    )}{" "}
                                  Prize ({chance.firstTierDuration.toString()}d)
                                </div>

                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    marginBottom: "5px",
                                  }}>
                                  <div
                                    style={{
                                      flex: 1,
                                      height: "20px",
                                      background: "#1F4C70",
                                      borderRadius: "10px",
                                      position: "relative",
                                    }}>
                                    <div
                                      style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        height: "100%",
                                        width: `${Math.min(
                                          (1 /
                                            ((Number(
                                              vaultData.userVaultBalance
                                            ) /
                                              Number(vaultData.totalAssets)) *
                                              chance.firstTierVaultPortion) /
                                            4 /
                                            chance.firstTier) *
                                            100,
                                          100
                                        )}%`,
                                        background: "#b09ec5",
                                        borderRadius: "10px",
                                      }}
                                    />
                                  </div>
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                  }}>
                                  <span className="chances">
                                    Current 1 in{" "}
                                    {NumberWithCommas(
                                      chance.firstTier.toFixed(0)
                                    )}
                                  </span>
                                  <span className="chances">
                                    Projected 1 in{" "}
                                    {NumberWithCommas(
                                      (
                                        1 /
                                        ((Number(vaultData.userVaultBalance) /
                                          Number(vaultData.totalAssets)) *
                                          chance.firstTierVaultPortion) /
                                        4
                                      ).toFixed(0)
                                    )}
                                  </span>
                                </div>
                              </div>
                            </>
                          )}
                      </div>

                      {vaultData.userAssetBalance &&
                        vaultData.userAssetBalance.gt(0) &&
                        vaultData.status !== 0 &&
                        vaultData.status !== 1 && (
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
                              <span style={{ fontSize: "19px" }}>
                                Your Deposit Tokens
                              </span>
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
                              {/* <IconDisplay
                                name={vaultData.assetSymbol}
                                size={20}
                              /> */}
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
                        {vaultData &&
                          vaultData.userAssetBalance.gt(0) &&
                          vaultData.status !== 0 &&
                          vaultData.status !== 1 && (
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
                                <>
                                  <button
                                    onClick={handleBuy}
                                    className="vault-button hidden-mobile">
                                    DEPOSIT FOR TICKETS
                                  </button>
                                  <button
                                    onClick={handleBuy}
                                    className="vault-button hidden-desktop">
                                    DEPOSIT
                                  </button>
                                </>
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
                                            position:
                                              toast.POSITION.BOTTOM_LEFT,
                                          }
                                        );
                                      } else {
                                        toast.dismiss();
                                        const args: [string, string] = [
                                          vaultData.address,
                                          ethers.utils
                                            .parseUnits(
                                              buyAmount,
                                              vaultData.decimals
                                            )
                                            .toString(),
                                        ];
                                        writeApprove({
                                          address: `0x${vaultData?.asset.substring(
                                            2
                                          )}`,
                                          abi: ABI.ERC20,
                                          functionName: "approve",

                                          args: args,
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
                                <>
                                  <button
                                    onClick={handleBuy}
                                    className="vault-button hidden-mobile">
                                    DEPOSIT FOR TICKETS
                                  </button>
                                  <button
                                    onClick={handleBuy}
                                    className="vault-button hidden-desktop">
                                    DEPOSIT
                                  </button>
                                </>
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
                            <MyConnect connectText={"CONNECT TO WIN"} />
                            <br></br>
                          </>
                        ))}

                      {vaultData.userDelegatedBalance &&
                        vaultData.userDelegatedBalance.gt(
                          vaultData.userVaultBalance
                        ) && (
                          <div className="data-row">
                            <span className="vault-label">
                              Delegated To You
                            </span>
                            <span className="vault-data">
                              <IconDisplay name={vaultData.name} size={20} />
                              {/* <Image
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
                          /> */}
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

                      {address &&
                        activeVaultAddress &&
                        overviewFromContext &&
                        overviewFromContext.overview && (
                          <div className="data-row">
                            <span className="vault-two">
                              <VaultRewards
                                chainName={GetChainName(activeVaultChain)}
                                chainId={activeVaultChain}
                                address={address}
                                vaults={[activeVaultAddress]}
                                prices={overviewFromContext.overview.prices}
                              />
                            </span>
                          </div>
                        )}

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

                                type TokenInfo = {
                                  chain: string;
                                  symbol: string;
                                  icon: string;
                                } | null;
                                function getPromoTokenInfo(address: string) {
                                  for (const chain in WHITELIST_REWARDS) {
                                    const tokens = WHITELIST_REWARDS[chain];
                                    const tokenInfo = tokens.find(
                                      (token) =>
                                        token.TOKEN.toLowerCase() ===
                                        address.toLowerCase()
                                    );
                                    if (tokenInfo) {
                                      return {
                                        chain,
                                        symbol: tokenInfo.SYMBOL,
                                        icon: tokenInfo.ICON,
                                      };
                                    }
                                  }
                                  return null; // Return null if the token is not found
                                }

                                const tokenInfo = getPromoTokenInfo(
                                  activePromo.token
                                );
                                let symbol, icon;

                                if (tokenInfo) {
                                  ({ symbol, icon } = tokenInfo);
                                } else {
                                  // Handle the case where tokenInfo is null, if necessary
                                  console.error(
                                    "Token info not found for the address:",
                                    activePromo.token
                                  );
                                }

                                return (
                                  <div key={index} className="data-row">
                                    <span className="vault-label">Rewards</span>
                                    <span className="vault-data">
                                      {icon && symbol && (
                                        <Image
                                          src={icon}
                                          width={15}
                                          height={15}
                                          alt={symbol}
                                        />
                                      )}
                                      &nbsp;
                                      {NumberWithCommas(
                                        annualYieldPercentage.toFixed(1)
                                      )}
                                      %
                                    </span>
                                  </div>
                                );
                              })}
                          </>
                        )}

                      <div className="data-row">
                        <span className="vault-label">
                          Total Deposits{" "}
                          <span className="hidden-mobile">(TVL)</span>
                        </span>
                        
                        <span className="vault-data">
                          <IconDisplay name={vaultData.assetSymbol} size={18} />
                          &nbsp;
                          {NumberWithCommas(
                            CropDecimals(
                              ethers.utils.formatUnits(
                                vaultData.totalAssets,
                                vaultData.decimals
                              )
                            )
                          )}{" "}
                          {/* {vaultData.assetSymbol} */}
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
                                <span className="vault-label">
                                  7d Vault Yield
                                </span>
                                <span className="vault-data">
                                  <PrizeValueIcon size={20} />

                                  <PrizeValue
                                    amount={BigInt(
                                      Math.round(
                                        Number(vaultData.contributed7d) * 1e18
                                      )
                                    )}
                                    size={20}
                                  />
                                  {ethPrice > 0 && assetPrice > 0 && (
                                    <>
                                      {(() => {
                                        const contributed7d = Number(
                                          vaultData.contributed7d
                                        );
                                        const totalAssets = Number(
                                          ethers.utils.formatUnits(
                                            vaultData.totalAssets,
                                            vaultData.decimals
                                          )
                                        );
                                        const annualContribution =
                                          contributed7d * 52;
                                        const contributionValue =
                                          annualContribution * ethPrice;
                                        const totalAssetsValue =
                                          totalAssets * assetPrice;
                                        const percentage =
                                          (contributionValue /
                                            totalAssetsValue) *
                                          100;

                                        return (
                                          <> ({percentage.toFixed(1)}% APR)</>
                                        );
                                      })()}
                                    </>
                                  )}
                                </span>
                              </div>
                            )}
                          {parseFloat(vaultData.won7d) !== 0 &&
                            parseFloat(vaultData.won7d) > 0 && (
                              <div className="data-row hidden-mobile">
                                <span className="vault-label">
                                  7d{" "}
                                  <span className="hidden-mobile">Vault</span>{" "}
                                  Prize Won
                                </span>
                                <span className="vault-data">
                                  <PrizeValueIcon size={20} />
                                  <PrizeValue
                                    amount={BigInt(
                                      Math.round(Number(vaultData.won7d) * 1e18)
                                    )}
                                    size={20}
                                  />
                                  {/* {" "}
                                  ({vaultData.prizesPerDraw7d}) */}
                                </span>
                              </div>
                            )}
                          {parseFloat(vaultData.contributed7d) === 0 &&
                            parseFloat(vaultData.contributed24h) > 0 && (
                              <div className="data-row hidden-mobile">
                                <span className="vault-label">
                                  24h Vault Yield
                                </span>
                                <span className="vault-data">
                                  <PrizeValueIcon size={15} />

                                  <PrizeValue
                                    amount={BigInt(
                                      Math.round(
                                        Number(vaultData.contributed24h) * 1e18
                                      )
                                    )}
                                    size={17}
                                  />
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
                      <br></br>
                      {seeAddresses && (
                        <span
                          className="vault-two small-font pointer"
                          onClick={() => setSeeAddresses(false)}>
                          - Close contract info
                        </span>
                      )}
                      {!seeAddresses ? (
                          <span
                            className="vault-two small-font pointer"
                            onClick={() => setSeeAddresses(true)}>
                            <>
                              
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
                      ) : (
                        <>
                          <div className="data-row">
                            <span className="address-label">
                              Vault Address{" "}
                            </span>
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
                            <span className="address-label">
                              Liquidation Pair
                            </span>
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
                                  CopyToClipboardButton(
                                    vaultData.liquidationPair
                                  )
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
        </div>
        {/* </div> */}
      </center>
    </Layout>
  );
};

export default Vault;

import { PROVIDERS, ENDPOINTS } from "../constants/providers";
import { ADDRESS, ABI, CONFIG } from "../constants/";

import { CONTRACTS } from "../constants/contracts";
import {
  FetchPricesForChain,
  FetchPriceForAsset,
  TokenPrice,
} from "../utils/tokenPrices";
import React, { useState, useEffect, useRef } from "react";
import { ethers, providers } from "ethers";
import { GetTokenImageFilename } from "../utils/tokenImages";
import { Multicall } from "../utils/multicall";
import { GetChainName } from "../utils/getChain";
// import { multicall } from "viem/dist/types/actions/public/multicall";
import { CropDecimals, NumberWithCommas } from "../utils/tokenMaths";
import Layout from "./index";
// import LiquidationModal from "../components/liquidationModal";

import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
  useSimulateContract
} from "wagmi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWallet } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
// import donut from "public/images/pooldonut.png";
// import donut from "public/images/pooltogether.png";
// import Drip from "../components/drip";
import Approve from "../components/approve";
// import LiquidationModal from "../components/liquidationModal";

const defaultChain = CONFIG.CHAINNAME;

interface Result {
  pair: string;
  maxAmountOut: ethers.BigNumber;
  virtualReserveIn: ethers.BigNumber;
  virtualReserveOut: ethers.BigNumber;
  name: string;
  symbol: string;
  decimals: number;
  amountInEstimate: ethers.BigNumber;
  inRequired?: ethers.BigNumber;
  liquidationPair: string;
  assetSymbol: string;
}

interface ToggleSwitchProps {
  toggled: boolean;
  onToggle: () => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ toggled, onToggle }) => {
  return (
    <label className="switch">
      <input type="checkbox" checked={toggled} onChange={onToggle} />
      <span className="switch-slider"></span>
    </label>
  );
};
function withSlippage(amount: ethers.BigNumber | undefined) {
  const slippagePercentage = 1; // % slippage
  const slippageFactor = ethers.utils.parseUnits(
    (100 + slippagePercentage).toString(),
    2
  );
  if (amount) {
    return amount.mul(slippageFactor).div(100);
  } else {
    return ethers.BigNumber.from(0);
  }
}

function findMatchingTokenPrice(
  symbol: string,
  tokenPricing: TokenPrice[]
): number | undefined {
  const matchingToken = tokenPricing.find(
    (token) => token.assetSymbol === symbol
  );
  // console.log("found matching price?", matchingToken);
  return matchingToken ? matchingToken.price : undefined;
}

function OneMinuteFromNow() {
  const now = new Date();
  const oneMinuteFromNow = new Date(now.getTime() + 60000); // Add 60,000 milliseconds (1 minute)
  const unixTimestamp = Math.floor(oneMinuteFromNow.getTime() / 1000); // Convert to UNIX timestamp
  return unixTimestamp;
}
const LiquidationData = () => {
  const chainId  = useChainId();
  const { address, isConnecting, isDisconnected } = useAccount();

  const [isToggled, setIsToggled] = useState(false);

  const [currentChain, setCurrentChain] = useState<string>(defaultChain);
  const [results, setResults] = useState<Result[]>([]);
  const [prizeTokenBalance, setPrizeTokenBalance] = useState<number>(0);
  const [gasPrice, setGasPrice] = useState<string>();
  const [tokenPricing, setTokenPricing] = useState<TokenPrice[]>([]);
  const [hasApproval, setHasApproval] = useState<ethers.BigNumber>();
  // const [contracts, setContracts] = useState(CONTRACTS[currentChain]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pricing, setPricing] = useState<string>("usd");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentPair, setCurrentPair] = useState<string>("");
  const [router, setRouter] = useState<{}>({});
  const [isHistoryModal, setIsHistoryModal] = useState<boolean>(false);

  const firstUpdate = useRef(true);

  //   const [refresh, setRefresh] = useState<boolean>(true)

  const { data: swapSimulate } = useSimulateContract({
    chainId,
    address: currentChain && ADDRESS[currentChain].LIQUIDATIONROUTER as any,
    abi: ABI.LIQUIDATIONROUTER,
    functionName: "swapExactAmountOut",
  
  })

  const {
    data: swapData,
    isPending: swapIsLoading,
    isSuccess: swapIsSuccess,
    writeContract: write,
  } = useWriteContract({});


  const changeCurrency = (denomination: string) => {
    setPricing(denomination);
  };

  const { isLoading: swapWaitLoading, isSuccess: swapWaitSuccess } = useWaitForTransactionReceipt({hash:swapData})
 
  useEffect(() => {
    if (swapWaitSuccess) {
      const toastId = "swap-success";
      if (!toast.isActive(toastId)) {
        toast("Swap success!", {
          position: toast.POSITION.BOTTOM_LEFT,
          toastId: toastId,
        });
      }
    }
  }, [swapWaitSuccess]);

  useEffect(() => {
    if (firstUpdate.current) {
      firstUpdate.current = false;
      return;
    }
    if (chainId) {
      const name = GetChainName(chainId);
      setCurrentChain(name);
      // setContracts(CONTRACTS[name]);
    }
  }, [chainId]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      let chainEffect = currentChain;
      try {
        if (chainId) {
          chainEffect = GetChainName(chainId);
          setCurrentChain(chainEffect);
        }
        console.log("UPDATING PRIMARY DATA",chainId);
        if (address && chainId) {
          const allowancePromise = CONTRACTS.PRIZETOKEN[chainEffect].allowance(
            address,
            ADDRESS[chainEffect].LIQUIDATIONROUTER
          );
          const prizeTokenBalancePromise = CONTRACTS.PRIZETOKEN[chainEffect]
            .balanceOf(address)
            .then((prizeToken: any) => {
              const formattedBalance = ethers.utils.formatUnits(prizeToken, 18);
              return parseFloat(formattedBalance);
            })
            .catch((error: any) => {
              console.error("Error fetching prize token balance:", error);
              return 0;
            });

          // const gasPricePromise = PROVIDERS.OPTIMISM.getGasPrice().then(
          //   (gas) => {
          //     const formattedGasPrice = ethers.utils.formatUnits(gas, "gwei");
          //     setGasPrice(formattedGasPrice);
          //   }
          // );

          await Promise.all([allowancePromise, prizeTokenBalancePromise]).then(
            ([allowance, prizeTokenBalance]) => {
              setHasApproval(allowance);
              setPrizeTokenBalance(prizeTokenBalance);
            }
          );
        }
        // const tokenPricesPromise = FetchPricesForChain(
        //   defaultChain,
        //   pricing
        // ).catch((error: any) => {
        //   console.error("Error fetching token prices:", error);
        //   return [];
        // });
        // const prices = await tokenPricesPromise;
        // console.log("liq ", prices);

        // setTokenPricing(prices as any);
        // console.log("booost contracts",CONTRACTS.BOOSTS[chainEffect].length,CONTRACTS.BOOSTS[chainEffect])
        // const vaultContracts = contracts.VAULTS[chainEffect]

        // combine vaults and boosts
        const combinedVaultContracts = [
          ...CONTRACTS.VAULTS[chainEffect],
          ...CONTRACTS.BOOSTS[chainEffect],
        ];

        const vaultContracts = combinedVaultContracts.filter(vault => 
          vault.LIQUIDATIONPAIR.address !== ethers.constants.AddressZero
        );
        const promises: any = [];
        const liquidationPairContracts: any[] = []; // Declare this array to store the contracts for later use

        let vaultInfo: any = [];
        vaultContracts.forEach((vault, index) => {
          const liquidationPairContract = vault.LIQUIDATIONPAIR;

          if (index >= CONTRACTS.VAULTS[chainEffect].length) {
            vaultInfo.push(
              ADDRESS[chainEffect].BOOSTERS[
                index - CONTRACTS.VAULTS[chainEffect].length
              ]
            );
          } else {
            vaultInfo.push(ADDRESS[chainEffect].VAULTS[index]);
          }

          // console.log("got vault info for index", index, "info", vaultInfo[index]);
          liquidationPairContracts.push(liquidationPairContract);

          promises.push(
            liquidationPairContract.callStatic.maxAmountOut()
            // liquidationPairContract.callStatic.virtualReserveIn(),
            // liquidationPairContract.callStatic.virtualReserveOut()
          );
        });
        vaultContracts.forEach((vault, index) => {
          const liquidationPairContract = vault.LIQUIDATIONPAIR;

          if (index >= CONTRACTS.VAULTS[chainEffect].length) {
            vaultInfo.push(
              ADDRESS[chainEffect].BOOSTERS[
                index - CONTRACTS.VAULTS[chainEffect].length
              ]
            );
          } else {
            vaultInfo.push(ADDRESS[chainEffect].VAULTS[index]);
          }

          // console.log("got vault info for index", index, "info", vaultInfo[index]);
          liquidationPairContracts.push(liquidationPairContract);

          promises.push(
            liquidationPairContract.compu
            // liquidationPairContract.callStatic.virtualReserveIn(),
            // liquidationPairContract.callStatic.virtualReserveOut()
          );
        });
        let resolvedResults: any = [];
        try {
          resolvedResults = await Multicall(promises, chainEffect);
        } catch (error) {
          console.log(error);
        }
        const transformedResults: any = [];

        for (let i = 0; i < resolvedResults.length; i++) {
          const maxAmountOut = resolvedResults[i];

          transformedResults.push({
            liquidationPair: vaultContracts[i].LIQUIDATIONPAIR.address,
            maxAmountOut: maxAmountOut,
            name: vaultInfo[i].NAME,
            symbol: vaultInfo[i].SYMBOL,
            assetSymbol: vaultInfo[i].ASSETSYMBOL,
            decimals: vaultInfo[i].DECIMALS,
          });
        }
        // console.log("transformed results",transformedResults)
        let liquidationPairData: any = [];
        resolvedResults.forEach;
        resolvedResults = resolvedResults.map(
          (result: any, index: number) => {}
        );

        const routerContract = CONTRACTS.LIQUIDATIONROUTER;

        setRouter(routerContract);

        // const inRequiredPromises: any[] = [];
        // transformedResults.map((result: any, index: number) => {
        //   console.log(
        //     "chain",
        //     chainEffect,
        //     "pariaddy",
        //     result.liquidationPair,
        //     "from",
        //     CONFIG.WALLET,
        //     "maxout",
        //     result.maxAmountOut.toString()
        //   );

        // if (!result.maxAmountOut.isZero()) {
        //   inRequiredPromises.push(
        //     liquidationPairContracts[index].callStatic.computeExactAmountIn(
        //       result.maxAmountOut,
        //       { from: CONFIG.WALLET }
        //     )
        //   );
        // } else {
        //   inRequiredPromises.push(null); // amount out is zero so stuff a null in there
        // }
        // });
        // let go = await inRequiredPromises[0];
        // const inRequiredResults = await Multicall(
        //   inRequiredPromises,
        //   defaultChain
        // ).catch((error) => {
        //   console.error("Promise.all failed:", error);
        //   return [];
        // });

        // console.log("in required results", inRequiredResults);

        // inRequiredResults.forEach((result: any, index) => {
        //   if (result === null) {
        //     transformedResults[index].inRequired = ethers.BigNumber.from(0);
        //   } else {
        //     transformedResults[index].inRequired = inRequiredResults[index];
        //   }
        // });

        // console.log("results", transformedResults);
        setResults(transformedResults);

        //  if(address){
        //         await GetVaultTokenBalances(chainEffect,address)}
      } catch (error) {
        console.log(error);
      }
      setLoading(false);
    };

    fetchData();
  }, [ pricing, swapWaitSuccess, address]);
  const dripUpdated = () => {
    return "1";
  };

  const openModal = (pair: string) => {
    // console.log("pair in parent", pair);
    setIsHistoryModal(false);
    setCurrentPair(pair);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const openHistoryModal = (pair: string) => {
    setIsHistoryModal(true);
    setCurrentPair(pair);
    setIsModalOpen(true);
  };
  // console.log("is modal open", isModalOpen);
  // const currentVaultDetails = (pair: string) => {
  //   const pairInfo = results.find((result) => result.liquidationPair === pair);
  //   return pairInfo;
  // };

  return (
    <Layout>
      <center>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
          <Image
            src={`/images/liquidator.png`}
            height={120}
            width={120}
            alt="liquidator"
            style={{ verticalAlign: "middle" }}
          />
          <h1 style={{ margin: "0 0 0 10px", lineHeight: "50px" }}>
            LIQUIDATOR
          </h1>
        </div>

        {!loading ? (
          <>
            <br></br>
            {prizeTokenBalance > 0 && (
              <span>
                <div className="awesome-icon">
                  <FontAwesomeIcon
                    icon={faWallet}
                    size="sm"
                    style={{ color: "#fcfcfd" }}
                  />
                </div>

                <span className="awesome-text">
                  {NumberWithCommas(CropDecimals(prizeTokenBalance))}{" "}
                  {ADDRESS[currentChain].PRIZETOKEN.SYMBOL}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                </span>
              </span>
            )}
            <ToggleSwitch
              toggled={isToggled}
              onToggle={() => setIsToggled(!isToggled)}
            />
            &nbsp;&nbsp;<span style={{ color: "white" }}>Show All Pairs</span>
            <div className="tools">
              {/* <Drip
                chainProp={currentChain}
                addressProp={ADDRESS[currentChain].PRIZETOKEN.ADDRESS}
                updateNow={dripUpdated}
              /> */}
              <span
                className="currency"
                onClick={() =>
                  changeCurrency(pricing === "eth" ? "usd" : "eth")
                }>
                {pricing === "eth" ? "$" : "E"}
              </span>
            </div>
            {/* 
            <span>
              {gasPrice && parseFloat(gasPrice) > 0 && (
                <div className="gas">
                  <div className="awesome-icon">
                    <FontAwesomeIcon
                      icon={faGasPump}
                      size="sm"
                      style={{ color: "#fcfcfd" }}
                    />
                  </div>
                  <span className="awesome-text">
                    {" " + CropDecimals(gasPrice)}
                  </span>
                </div>
              )}
            </span> */}
            <div className="bubble-container">
              {results.map((result, index) => {
                // if (result.inRequired === undefined || result.maxAmountOut.isZero()) return null;
                // const inRequired = parseFloat(
                //   ethers.utils.formatUnits(result.inRequired, 18)
                // );
                const maxOut = parseFloat(
                  ethers.utils.formatUnits(result.maxAmountOut, result.decimals)
                );
                if (isToggled || (!isToggled && maxOut > 0)) {
                  // console.log("searching for ",result.assetSymbol," in ",tokenPricing)
                  const tokenPrice =
                    findMatchingTokenPrice(result.assetSymbol, tokenPricing) ??
                    0;

                  const receiveValue = maxOut * tokenPrice;
                  // console.log("pricing pool?",tokenPricing)
                  // console.log("pt price problem??",FetchPriceForAsset("pooltogether","usd"))
                  const prizeTokenPrice = 0.5;
                  // const payValue = inRequired * prizeTokenPrice;
                  // const difference = receiveValue - payValue;
                  // console.log(
                  //   "payvalu ",
                  //   payValue,
                  //   " receiving value ",
                  //   receiveValue,
                  //   " in required ",
                  //   inRequired,
                  //   " pool price ",
                  //   prizeTokenPrice
                  // );

                  return (
                    <div key={index} className="bubble">
                      <div className="vault-name">
                        {result.name.replace(/PoolTogether|Prize Token/g, "")}
                        <br />
                      </div>
                      {result.liquidationPair && (
                        <div className="pay-receive-smaller">
                          <a
                            href={
                              ADDRESS[currentChain].ETHERSCAN + "/address/" +
                              result.liquidationPair
                            }>
                            {result.liquidationPair.substring(0, 10)}
                          </a>
                        </div>
                      )}
                      <div className="pay-receive-container">
                        {result.maxAmountOut && (
                          <>
                            <br></br>
                            {/* <span className="pay-receive-number">
                            <span className="pay-receive">
                              <Image
                                src={`/images/pool.png`}
                                className="token"
                                alt="Token Image"
                                width={16}
                                height={16}
                              />{" "}
                              {NumberWithCommas(CropDecimals(inRequired))}
                            </span>
                          </span>

                          <FontAwesomeIcon
                            icon={faExchange}
                            className="swap-awesome"
                            style={{ color: "black" }}
                          /> */}
                            <br></br>
                            <span className="pay-receive">
                              {maxOut > 0 ? (
                                <>
                                  Yield&nbsp;
                                  <Image
                                    src={`/images/${GetTokenImageFilename(
                                      result.symbol
                                    )}`}
                                    className="token"
                                    alt="Token Image"
                                    width={16}
                                    height={16}
                                  />{" "}
                                  {NumberWithCommas(CropDecimals(maxOut))}
                                </>
                              ) : (
                                "No yield avail"
                              )}{" "}
                            </span>
                          </>
                        )}
                      </div>

                      {/* 
                    <div className="eth-pricing">
                      {pricing === "eth" ? (
                        <span>
                          <Image
                            src="/images/eth.png"
                            alt="Token Image"
                            width={10}
                            height={10}
                          />{" "}
                        </span>
                      ) : (
                        "$"
                      )}
                      <span className="pay-receive-smaller">
                        {NumberWithCommas(CropDecimals(payValue))}
                      </span>

                      <FontAwesomeIcon
                        icon={faExchange}
                        className="swap-awesome-smaller"
                        style={{ color: "black" }}
                      />

                      <span className="eth-pricing">
                        {pricing === "eth" ? (
                          <>
                            <Image
                              src="/images/eth.png"
                              alt="Token Image"
                              width={10}
                              height={10}
                            />{" "}
                          </>
                        ) : (
                          "$"
                        )}{" "}
                        <span className="pay-receive-smaller">
                          {NumberWithCommas(CropDecimals(receiveValue))}
                        </span>
                      </span>
                    </div> */}

                      <br />

                      {/* {difference > 0 ? (
                      <span>
                        <span className="pay-receive">
                          {pricing === "eth" ? (
                            <>
                              <Image
                                src="/images/eth.png"
                                className="token"
                                alt="Token Image"
                                width={16}
                                height={16}
                              />{" "}
                            </>
                          ) : (
                            "+ $"
                          )}
                          {pricing === "eth" ? (
                            <span className="plus-sign">+</span>
                          ) : (
                            ""
                          )}
                          {NumberWithCommas(CropDecimals(difference))}
                        </span>
                      </span>
                    ) : (
                      <span>
                        <span className="pay-receive dollar">
                          {pricing === "eth" ? (
                            <>
                              <Image
                                src="/images/eth.png"
                                className="token"
                                alt="Token Image"
                                width={16}
                                height={16}
                              />{" "}
                            </>
                          ) : (
                            " $"
                          )}
                        </span>
                        {NumberWithCommas(CropDecimals(difference))}
                        {/* <span className="pay-receive">ETH</span> 
                      </span>
                    )} */}

                      {/* {hasApproval &&
                    hasApproval.gte(withSlippage(result.inRequired)) ? (
                      <> */}
                      <div className="button-container">
                        {result.maxAmountOut.gt(0) && (
                          <button
                            className="button button--block"
                            onClick={() => openModal(result.liquidationPair)}>
                            Swaps
                          </button>
                        )}
                        <button
                          className="button button--block"
                          onClick={() =>
                            openHistoryModal(result.liquidationPair)
                          }>
                          History
                        </button>
                      </div>
                      {/* <button
                          className={
                            swapIsLoading || swapIsFetching
                              ? "button no-cursor"
                              : "button"
                          }
                          style={styles.button}
                          disabled={!write || !address}
                          onClick={() => {
                            console.log("pair",result.liquidationPair)
                            console.log("my address",address)
                            console.log("exact out",result.maxAmountOut)
                            console.log("in",result.inRequired)
                            console.log("one min from now",OneMinuteFromNow())
                            chain?.id === CONFIG.CHAINID
                              ? write({
                                  args: [
                                    result.liquidationPair,
                                    address,
                                    result.maxAmountOut,
                                    withSlippage(result.inRequired),
                                    OneMinuteFromNow(),
                                  ],
                                  // from: `0x${address?.toString().substring(2)}`,
                                })
                              : console.log("wrong chain");
                          }}>
                          {swapIsLoading ? (
                            <>
                              <span className="spinner-small"></span>SEE WALLET
                            </>
                          ) : swapIsFetching ? (
                            <>
                              <span className="spinner-small"></span>LIQUIDATING
                            </>
                          ) : (
                            "SWAP"
                          )}
                        </button> */}
                      {/* </>
                    ) : (
                      // <Approve chainProp={currentChain} />
                    )} */}
                    </div>
                  );
                }
              })}
            </div>
          </>
        ) : (
          <>
            <div className="loading-animation">
              <div className="loading-image">
                {/* <Image src={donut} alt="Loading" priority={true} /> */}
              </div>
            </div>
          </>
        )}
        {isModalOpen && (
          <>
            {/* <LiquidationModal
              address={address}
              chain={currentChain}
              currentPair={currentPair}
              contracts={CONTRACTS}
              pricing={pricing}
              router={router}
              onClose={closeModal}
              isHistoryModal={isHistoryModal}
              hasApproval={hasApproval}
            /> */}
          </>
        )}
        <ToastContainer />
      </center>
    </Layout>
  );
};

const styles = {
  button: { display: "flex", alignItems: "center", justifyContent: "center" },
};

export default LiquidationData;

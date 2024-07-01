import { CONTRACTS } from "../constants/contracts";
import PrizeIcon from "../components/prizeIcon";
import { parseEther, parseGwei } from 'viem'

import {
  CONFIG,
  PROVIDERS,
  ADDRESS,
  ABI,
} from "../constants";
import { ethers } from "ethers";
import { useEffect } from "react";
import { FetchPriceForAsset } from "../utils/tokenPrices";
import { getGasPrice } from '@wagmi/core'
import { optimismSepolia } from "viem/chains"
import { http, createConfig } from '@wagmi/core'

import {
  useWriteContract,
  useSimulateContract,
  useAccount,
  useWaitForTransactionReceipt,
  useChainId,
} from "wagmi";
import { CropDecimals, PrizeToke, PrizeToker } from "../utils/tokenMaths";
import { Multicall } from "../utils/multicall";
import { useState } from "react";
import Layout from "./index";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Timer from "../components/timer";
// import RelayAuction from "../components/relayAuction";
import Image from "next/image";
import {
  faRefresh,
  faUpRightFromSquare,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { GetRngAuctionCompletedEvents } from "../utils/rngAuctionEvents";
import RngHistoryComponent from "../components/rngHistory";
import {GetDrawEvents} from "../utils/getDrawEvents"

const config = createConfig({
  chains: [optimismSepolia],
  transports: {
    [optimismSepolia.id]: http(),
  },
})


interface ProtocolStatus {
  gasPrice: ethers.BigNumber;
  openDrawId: string;
  isLastDrawFinalized: boolean;
  lastAwardedDrawId: string;
  currentDrawEnds: Number;
  reserve: ethers.BigNumber;
  pendingReserve: ethers.BigNumber;
  drawOpensAt: number;
  drawClosesAt: number;
  canStartDraw: boolean;
  canFinishDraw: boolean;
  startDrawReward: ethers.BigNumber;
  finishDrawReward: ethers.BigNumber;
  randomizeFee: ethers.BigNumber;
  events: [],
}
async function status(chainId:number) {
  const combinedContractCalls = [
    CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].reserve(),
    CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].pendingReserveContributions(),
    CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].getOpenDrawId(),
    CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].getLastAwardedDrawId(),

    CONTRACTS.DRAWMANAGER[CONFIG.CHAINNAME].canStartDraw(),
    
  ];

  const [mResults, events, gasPrice] = await Promise.all([
    Multicall(combinedContractCalls, CONFIG.CHAINNAME),
    GetDrawEvents(chainId),
    PROVIDERS[CONFIG.CHAINNAME].getGasPrice()
  ]);
  console.log("draw events in component",events)
  console.log("GAS",gasPrice.toString())

  // Destructure the results to extract each individual response
  const [reserve, reserveForOpenDraw, drawId,lastAwardedDrawId, canStartDraw] = mResults;

  let conditionalCalls = [];
    let conditionalCallTypes = []; // To keep track of the type of calls added

    if (!canStartDraw && drawId !== lastAwardedDrawId) {
        // Finish draw zone
        conditionalCalls.push(
            CONTRACTS.DRAWMANAGER[CONFIG.CHAINNAME].canFinishDraw(),
            CONTRACTS.DRAWMANAGER[CONFIG.CHAINNAME].finishDrawReward(),
        );
        conditionalCallTypes.push('canFinishDraw', 'finishDrawReward');
    }

    if (canStartDraw) {
        // Start draw zone
        conditionalCalls.push(
            CONTRACTS.DRAWMANAGER[CONFIG.CHAINNAME].startDrawReward(),
            CONTRACTS.RNG[CONFIG.CHAINNAME].estimateRandomizeFee(gasPrice),
        );
        conditionalCallTypes.push('startDrawReward', 'estimateRandomizeFee');
    }

    let alwaysIncludedCalls = [
        CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].drawOpensAt(drawId),
        CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].drawClosesAt(drawId),
        CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].isDrawFinalized(Number(drawId) - 1),
    ];

    let combinedCalls = conditionalCalls.concat(alwaysIncludedCalls);
    let cResults = await Multicall(combinedCalls, CONFIG.CHAINNAME);
    console.log('Multicall Results:', mResults);
console.log('Conditional Multicall Results:', cResults);

  // mResults.forEach((result, index) => {
  //     console.log(`Result at index ${index}:`, result, `Type: ${typeof result}`);
  // });



  // cResults.forEach((result, index) => {
  //     console.log(`Result at index ${index}:`, result, `Type: ${typeof result}`);
  // });

//   conditionalCallTypes.forEach((type, index) => {
//     console.log(`Attempting to extract ${type} at index ${index}`);
//     let value = cResults[index];
//     console.log(`${type} result:`, value);
//     // ... your switch case logic goes here
// });

// Initialize your variables outside the scope, so they're defined regardless
let randomizeFee, canFinishDraw, finishDrawReward, startDrawReward;

// Assume cResults contains your conditional results, and alwaysIncludedCalls results follow.
// Map each conditional call result based on the type
conditionalCallTypes.forEach((type, index) => {
    const result = cResults[index];
    switch (type) {
        case 'canFinishDraw':
            canFinishDraw = result;
            break;
        case 'finishDrawReward':
            finishDrawReward = result;
            break;
        case 'startDrawReward':
            startDrawReward = result;
            break;
        case 'estimateRandomizeFee':
            randomizeFee = result;
            break;
    }
});

// Process alwaysIncludedCalls results, which start from the end of the conditional results
const alwaysIncludedStartIndex = conditionalCalls.length;
const drawOpensAt = cResults[alwaysIncludedStartIndex];
const drawClosesAt = cResults[alwaysIncludedStartIndex + 1];
const isDrawFinalized = cResults[alwaysIncludedStartIndex + 2];

// Now randomizeFee and other variables should be correctly assigned
// console.log("Randomize Fee:", randomizeFee?.toString());

//     // Initialize variables
//     let drawOpensAt, drawClosesAt, isDrawFinalized;
//     let randomizeFee, canFinishDraw, finishDrawReward, startDrawReward;

//     // Extract always included results
//     let resultIndex = conditionalCalls.length; // Start index for always included results
//     drawOpensAt = cResults[resultIndex];
//     drawClosesAt = cResults[resultIndex + 1];
//     isDrawFinalized = cResults[resultIndex + 2];

    
//     // Extract conditional results
//     conditionalCallTypes.forEach((type, index) => {
//         switch (type) {
//             case 'canFinishDraw':
//                 canFinishDraw = cResults[index];
//                 break;
//             case 'finishDrawReward':
//                 finishDrawReward = cResults[index];
//                 break;
//             case 'startDrawReward':
//                 startDrawReward = cResults[index];
//                 break;
//             case 'estimateRandomizeFee':
//                 randomizeFee = cResults[index];
//                 break;
//         }
//     });
// console.log("random fee",randomizeFee)
  if(gasPrice){
    console.log("gas price",gasPrice.toString())}
    const ZERO = ethers.BigNumber.from(0)
  const statusResults: ProtocolStatus = {
    randomizeFee: randomizeFee ? ethers.BigNumber.from(randomizeFee) : ZERO,
    gasPrice: gasPrice,
    openDrawId: drawId.toString(),
    isLastDrawFinalized: Boolean(isDrawFinalized),
    lastAwardedDrawId: lastAwardedDrawId as any,
    drawOpensAt: Number(drawOpensAt),
    drawClosesAt: Number(drawClosesAt),
    currentDrawEnds: Number(drawClosesAt),
    reserve: ethers.BigNumber.from(reserve),
    pendingReserve: ethers.BigNumber.from(reserveForOpenDraw),
    canStartDraw: Boolean(canStartDraw),
    canFinishDraw: Boolean(canFinishDraw),
    startDrawReward: startDrawReward ? ethers.BigNumber.from(startDrawReward) : ZERO,
    finishDrawReward: finishDrawReward ? ethers.BigNumber.from(finishDrawReward) : ZERO,
    events: events as any,
  };

  console.log(statusResults)
  return statusResults;
}


export const Auction = () => {
  const { address } = useAccount();
  const chainId = useChainId();
  const [protocolStatus, setProtocolStatus] = useState<ProtocolStatus>();
  // const [nextDrawEndsAt, setNextDrawEndsAt] = useState<Number>(0);
  const [refresh, setRefresh] = useState(true)
  const [drawEvents, setDrawEvents] = useState()
console.log(parseEther("0.000375989"))
console.log("Address",address,"manager",ADDRESS[CONFIG.CHAINNAME].DRAWMANAGER)
  const { data: startDrawSimulate } = useSimulateContract({
    chainId,
    address: ADDRESS[CONFIG.CHAINNAME].RNG as any,
    abi: ABI.RNG,
    functionName: "startDraw",

    args: [
      // protocolStatus && protocolStatus.randomizeFee,
      parseEther(".005"),
      ADDRESS[CONFIG.CHAINNAME].DRAWMANAGER,
      address ? address: "",
    ],
    value: parseEther(".005")
    // value: protocolStatus && protocolStatus?.randomizeFee,
    // query: { enabled }
    // maxPriorityFeePerGas: parseGwei(".003"), 

  })
  if(startDrawSimulate){
console.log("simulate",startDrawSimulate.request)}
  const {
    data: startDrawData,
    // isSuccess: startDrawIsSuccess,
    // isError: startDrawIsError,
    isPending: isStartDrawWaiting,
    isError: isStartDrawError,
    isSuccess: isStartDrawSuccess,
    writeContract: writeStartDraw,
  } = useWriteContract()
  
  // {mutation:{onSuccess: ()=>{
  //   toast("Draw started!", {
  //     position: toast.POSITION.BOTTOM_LEFT,
  //   });
  //   // updateNow()}
  // }}});
console.log("params",address)
  const { data: finishDrawSimulate } = useSimulateContract({
    chainId,
    address: ADDRESS[CONFIG.CHAINNAME].DRAWMANAGER as any,
    abi: ABI.DRAWMANAGER,
    functionName: "finishDraw",

    args: [
      address ? address : ""
    ],
    // query: { enabled }
  })

  const {
    data: finishDrawData,
    isPending: finishDrawPending,
    // isSuccess: startDrawIsSuccess,
    // isError: startDrawIsError,
    isPending: isFinishDrawWaiting,
    isError: isFinishDrawError,
    isSuccess: isFinishDrawSuccess,
    writeContract: writeFinishDraw,
  } = useWriteContract({mutation:{onSuccess: ()=>{
    toast("Draw completed!", {
      position: toast.POSITION.BOTTOM_LEFT,
    });
    // updateNow()}
  }}});

if(protocolStatus && protocolStatus.drawClosesAt){
console.log("date now",protocolStatus.drawClosesAt*1000)}
  useEffect(() => {
    async function update() {
      const protocolStatus = await status(chainId);
      setDrawEvents(protocolStatus.events as any)
      console.log("events",protocolStatus.events)
      setProtocolStatus(protocolStatus);
    }
    update();
  }, [address, chainId, refresh]);
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
            src={`/images/cog.png`}
            height={120}
            width={120}
            alt="cog"
            layout="fixed"
          />
          <h1 style={{ margin: "0 0 0 10px", lineHeight: "120px" }}>
            DRAW MACHINE
          </h1>
        </div>
        <center>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
            }}>
            <div
              style={{
                flex: 1,
                padding: "10px",
              }}>
              
              {/* <span style={{color:"white"}}>until the next RNG Auction begins</span><br></br> */}
              <br></br>
              {protocolStatus && parseInt(protocolStatus.openDrawId) > 0 && (
                <>
                  <div className="stats" style={{ color: "white" }}>
                    <div className="stat">
                      Open Draw <br></br>
                      <span className="stat-value">
                        #<span>{protocolStatus.openDrawId}</span>
                      </span>
                    </div>
                  </div>
                </>
              )}
              {/* {protocolStatus && protocolStatus.reserve.gt(0) && (
                
                  <div
                    className="stats hidden-mobile"
                    style={{ color: "white" }}>
                    <div className="stat">
                      Prize Pool Reserve <br></br>
                      <span className="stat-value">
                        <PrizeIcon size={28}/>{" "}
                        &nbsp;
                        <span>
                          {PrizeToke(
                              protocolStatus.reserve,
                              ADDRESS[CONFIG.CHAINNAME].PRIZETOKEN.DECIMALS
                            )
                          }
                        </span>
                      </span>
                    </div>
                  </div>)} */}
                  {protocolStatus && protocolStatus.pendingReserve.gt(0) && (<>
                  <div
                    className="stats-noright hidden-mobile"
                    style={{ color: "white" }}>
                    <div className="stat">
                      Pending Reserve <br></br>
                      <span className="stat-value">
                        <PrizeIcon size={28}/>{" "}
                        &nbsp;
                        <span>
                          {PrizeToker(protocolStatus.pendingReserve)
                        }
                        </span>
                      </span>
                    </div>
                  </div>

                  <div
                    className="stats-noright hidden-desktop"
                    style={{ color: "white" }}>
                    <div className="stat">
                      Prize Pool Reserve <br></br>
                      <span className="stat-value">
                        <PrizeIcon size={28}/>

                        &nbsp;
                        <span>
                          {PrizeToker(protocolStatus.pendingReserve) }
                        </span>
                      </span>
                    </div>
                  </div>
                  </>
              )}
              <br></br>
              <br></br>
              {/* {Math.round(((Date.now()/1000) - Number(openDrawStartedAt))) < drawPeriodSeconds &&  */}
              {protocolStatus && parseInt(protocolStatus.openDrawId) > 0 &&
            
                !protocolStatus.canFinishDraw && !protocolStatus.canStartDraw && (
                  <div
                    style={{
                      maxWidth: "400px",
                      backgroundColor: "#e9effb",
                      color: "black",
                      padding: "16px",
                      borderRadius: "10px",
                    }}>
                      
                      {/* {protocolStatus && protocolStatus.drawClosesAt && protocolStatus.drawClosesAt.valueOf() > 0 && */}
                     {protocolStatus && protocolStatus.drawClosesAt &&
                     (<>Next Draw<br></br> 

<Timer
  seconds={protocolStatus.drawClosesAt} 
  onEnd={() => {
    setTimeout(() => {
      setRefresh((prevRefresh) => !prevRefresh);
    }, 3000); // 3000 milliseconds = 3 seconds
  }} 
  openAward={()=>{}}
  shortForm={false}
/>
                    <br></br></>
                    )}
                    Every day, prizes are distributed based on the yield from
                    deposits. Your chance to win is based on a random number
                    provided by Witnet. To cover the
                    costs of fetching this number and completing a draw, we hold two
                    daily auctions. With time the rewards for completing the
                    auctions grow until someone finds it worth the gas cost to
                    execute. 
                    {/* When
                    the auctions are happening, you will see them
                    here. */}
                  </div>
                      )}
                    {/* {((Date.now()/1000) - Number(openDrawStartedAt)) > drawPeriodSeconds &&  */}
                    {/* {protocolStatus &&
                    protocolStatus.canStartDraw  (<>GAS {ethers.utils.formatUnits(protocolStatus.gasPrice,9)}
                    <button
                    className="button"
                    onClick={() => {console.log("writing?")
                    try{
                      writeStartDraw({
                        chainId,
                        address: ADDRESS[CONFIG.CHAINNAME].RNG as any,
                        abi: ABI.RNG,
                        functionName: "startDraw",
                    
                        args: [
                          // protocolStatus && protocolStatus.randomizeFee,
                          parseEther(".005"),
                          ADDRESS[CONFIG.CHAINNAME].DRAWMANAGER,
                          address ? address: "",
                        ],
                        value: parseEther(".005")
                        // value: protocolStatus && protocolStatus?.randomizeFee,
                        // query: { enabled }
                        // maxPriorityFeePerGas: parseGwei(".003"), 
                    
                      })}catch(e){console.log("error writing?",e)}}
                      // writeStartDraw(startDrawSimulate!.request)
                    }>Start Draw {PrizeToker(protocolStatus.startDrawReward)}</button></>
                      )}
                      {protocolStatus &&
                    protocolStatus.canFinishDraw  (<button
                      className="button"
                      onClick={() =>
                        writeFinishDraw(finishDrawSimulate!.request)
                      }>Finish Draw {PrizeToker(protocolStatus.finishDrawReward)}</button>
                        // <RelayAuction reserve={Number(reserve)} />
                      )} */}
                    </div>
                    <div><RngHistoryComponent events={drawEvents as any}/></div>
            </div>
        </center>
        <ToastContainer />
      </center>
    </Layout>
  );
};

export default Auction;




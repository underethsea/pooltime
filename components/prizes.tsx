import { ADDRESS, CONFIG } from "../constants/";
import { CONTRACTS } from "../constants/contracts";
import { useOverview } from './contextOverview'; // Adjust the path as necessary

// import { GetContributePrizeTokenEvents } from "../utils/getContributePrizeTokenEvents";
// import Timer from "../components/timer"
import { Multicall } from "../utils/multicall";
import React, {
  useState,
  useEffect,
  CSSProperties,
  useLayoutEffect,
} from "react";
// import { useRouter } from 'next/router';
import Image from "next/image";
import { ethers } from "ethers";
import { NumberWithCommas, CropDecimals, PrizeToke } from "../utils/tokenMaths";
import { FetchPriceForAsset } from "../utils/tokenPrices";
import PrizeIcon from "./prizeIcon";
import { useAccount } from "wagmi";
import TopWinners from "./topWinners";
import { MyConnect } from "./connectButton";
import Notifications from "./notifications";
import Link from "next/link";

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

interface TierData {
  // tier: number;
  value: number;
  // frequency: string;
  // count: number;
  // liquidity: number;
}
interface IData {
  maxFee: ethers.BigNumber | null;
  // nextDrawEndsAt: ethers.BigNumber | null;
  drawPeriodSeconds: ethers.BigNumber | null;
  nextDrawId: ethers.BigNumber | null;
  // numberOfTiers: ethers.BigNumber | null;
  // grandPrizePeriod: ethers.BigNumber | null;
  prizePoolPOOLBalance: ethers.BigNumber | null;
  accountedBalance: ethers.BigNumber | null;
  reserve: ethers.BigNumber | null;
  // tierData: TierData[] | null,
  grandPrize: number | null;
  timeLeft: number | null;
  error: Error | null;
  prizeTokenPrice: number | null;
}

const calculateTierFrequency = (t: number, n: number, g: number) => {
  const e = Math.E;
  const odds = e ** ((t - n + 1) * Math.log(1 / g)) / (1 - n);
  return odds;
};
async function getMostRecentDrawPrize(chain: number) {
  try {
    const fetchUrl = await fetch(
      `https://poolexplorer.xyz/${chain}-${ADDRESS[CONFIG.CHAINNAME].PRIZEPOOL}-history`
    );
    const drawResult = await fetchUrl.json();
    
// Filter draws with a prize value greater than 0 first
const drawsWithPrizes = drawResult.filter((draw:any) => parseInt(draw.totalPayout) > 0);

// Sort the filtered draws in descending order based on draw IDs
const sortedDrawsWithPrizes = drawsWithPrizes.sort((a:any, b:any) => parseInt(b.draw) - parseInt(a.draw));

      // Get the second most recent draw with prizes, if available
      if (sortedDrawsWithPrizes.length < 2) {
        console.error("Insufficient data for finding yesterday's draw with prizes");
        return "";
      }
  
      const yesterdayDrawWithPrizes = sortedDrawsWithPrizes[1]; // This is the second most recent draw with prizes
  
      console.log("Yesterday's draw with prizes total payout: ", yesterdayDrawWithPrizes.totalPayout);
      return yesterdayDrawWithPrizes.totalPayout;

  
  } catch (e) {
    console.error("Error fetching the most recent prize draw: ", e);
  }
}

interface TierData {
  // tier: number;
  value: number;
  // count: number;
  // liquidity: number;
}

interface PrizeData {
  drawPeriodSeconds: number;
  nextDrawId: number;
  numberOfTiers: number;
  prizePoolPOOLBalance: string;
  tierData: TierData[];
}

// interface PrizeProps {
//   overview: {
//     poolers: number;
//     poolPrice: number;
//     prizeData: PrizeData;
//   };
// }
const Prizes = () => {
  const overviewFromContext = useOverview();

  const { address } = useAccount();

  const [data, setData] = useState<IData>({
    maxFee: null,
    // nextDrawEndsAt: null,
    drawPeriodSeconds: null,
    nextDrawId: null,
    // numberOfTiers: null,
    // grandPrizePeriod: null,
    prizePoolPOOLBalance: null,
    prizeTokenPrice: null,
    accountedBalance: null,
    reserve: null,
    // tierData: null,
    grandPrize: null,
    timeLeft: null,
    error: null,
  });
  const [yesterdaysPrize, setYesterdaysPrize] = useState<string>("");
  // const router = useRouter();
  // console.log("yesterdays prize", yesterdaysPrize);

  useEffect(() => {
    const fetchData = async () => {
      const yestoPrize = await getMostRecentDrawPrize(CONFIG.CHAINID);
      setYesterdaysPrize(yestoPrize);
      // console.log("overview",overview)
      if (overviewFromContext && overviewFromContext.overview) {
        // console.log("using overview");
        const transformedData = {
          ...data, // keep the existing data
          // transform and set properties from overview.prizeData as needed
          drawPeriodSeconds: ethers.BigNumber.from(
            overviewFromContext.overview.pendingPrize["OPTIMISM"].prizes.drawPeriodSeconds
          ),
          nextDrawId: ethers.BigNumber.from(overviewFromContext.overview.pendingPrize["OPTIMISM"].prizes.nextDrawId),
          // numberOfTiers: ethers.BigNumber.from(overviewFromContext.prizeData.numberOfTiers),
          prizePoolPOOLBalance: ethers.BigNumber.from(
            overviewFromContext.overview.pendingPrize["OPTIMISM"].prizes.prizePoolPrizeBalance
          ),
          tierData: overviewFromContext.overview.pendingPrize["OPTIMISM"].prizes.tierData,
          // add other fields as needed
        };
        setData(transformedData);
      }
      // console.log("fetching prizes")
      try {
        const [
          // maxFee,
          // nextDrawEndsAt,
          drawPeriodSeconds,
          // nextDrawId,
          // numberOfTiers,
          // grandPrizePeriod,
          prizePoolPOOLBalance,
          // accountedBalance,
          // reserve
          // liquidationEvents,
          // canaryShares,
          // reserveShares,
          // tierShares,
          prizeAssetPrice,
          grandPrizeSize,
        ] = await Multicall(
          [
            // CONTRACTS.CLAIMER[CONFIG.CHAINNAME].computeMaxFee(),
            // CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].openDrawEndsAt(),
            CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].drawPeriodSeconds(),
            // CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].getOpenDrawId(),
            // CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].numberOfTiers(),
            CONTRACTS.PRIZETOKEN[CONFIG.CHAINNAME].balanceOf(
              ADDRESS[CONFIG.CHAINNAME].PRIZEPOOL
            ),

            // GetContributePrizeTokenEvents(CONFIG.CHAINID),
            // CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].canaryShares(),
            // CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].reserveShares(),
            // CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].tierShares(),
            FetchPriceForAsset(ADDRESS[CONFIG.CHAINNAME].PRIZETOKEN.GECKO),
            // CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].grandPrizePeriodDraws(),
            // CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].accountedBalance(),
            // CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].reserve(),
            CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].getTierPrizeSize(0),
          ],
          CONFIG.CHAINNAME
        );

        //   const thisDrawLiquidationEvents = liquidationEvents.filter((event) => event.drawId === nextDrawId)
        //   console.log("liquidation events",thisDrawLiquidationEvents)
        //   const summedLiquidationEvents = thisDrawLiquidationEvents.reduce((acc, item) => {
        //     return parseInt(acc) + parseInt(item.amount);
        // },0);
        // console.log("summed liq events",summedLiquidationEvents/1e18)

        // console.log("reserve shares",reserveShares)
        // console.log("canary shares",canaryShares)
        // console.log("tier shares",tierShares)

        // let tierPrizeValues = [];
        // const multicallData = [];

        //   const numberOfTotalTiers : number = Number(numberOfTiers) || 0
        //   for (let q = 0; q < numberOfTotalTiers; q++) {
        //     // let tierFrequency = Math.abs(calculateTierFrequency(q, numberOfTotalTiers, Number(grandPrizePeriod)));
        //     let frequency = "";

        //     // if (tierFrequency < 1) {
        //     //   frequency = cropDecimals(1 / tierFrequency) + " times per draw";
        //     // } else {
        //     //   frequency = "Once every " + cropDecimals(tierFrequency) + " draws";
        //     // }

        // //  console.log("tier size for ",q)
        //     multicallData.push(CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].getTierPrizeSize(q));
        //     multicallData.push(CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].functions['getTierPrizeCount(uint8)'](q)), // indices
        //     multicallData.push(CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].getTierRemainingLiquidity(q))

        //     const tierObj = {
        //       tier: q,
        //       value: 0, // Initialize with a default value
        //       frequency: frequency,
        //       count: 0,
        //       liquidity: 0
        //     };

        //     tierData.push(tierObj);
        //   }

        //   const results = await Multicall(multicallData, CONFIG.CHAINNAME);
        // console.log("multicall results",results)

        // for (let i = 0; i < numberOfTotalTiers; i++) {
        //   const index = i*3
        //   const tierValue = results[index];
        //   const prizeCount = results[index+1]
        //   const tierLiquidity = results[index+2]

        //   tierData[i].value = parseFloat(ethers.utils.formatUnits(tierValue,ADDRESS[CONFIG.CHAINNAME].PRIZETOKEN.DECIMALS))
        //   tierData[i].count = parseFloat(prizeCount.toString())
        //   tierData[i].liquidity = parseFloat(ethers.utils.formatUnits(tierLiquidity,ADDRESS[CONFIG.CHAINNAME].PRIZETOKEN.DECIMALS))

        //   // console.log("tier data",tierData[i]);
        // }

        // let timeLeft = Math.round(parseInt(nextDrawEndsAt) - (Date.now()/1000))
        // console.log("timeleft",timeLeft)
        setData({
          maxFee: null,
          // nextDrawEndsAt: ethers.BigNumber.from(nextDrawEndsAt),
          drawPeriodSeconds: ethers.BigNumber.from(drawPeriodSeconds),
          // nextDrawId: ethers.BigNumber.from(nextDrawId),
          nextDrawId: null,
          // numberOfTiers: ethers.BigNumber.from(numberOfTiers),
          // grandPrizePeriod: ethers.BigNumber.from(grandPrizePeriod),
          prizePoolPOOLBalance: ethers.BigNumber.from(prizePoolPOOLBalance),
          accountedBalance: null,
          reserve: null,
          grandPrize: parseFloat(
            ethers.utils.formatUnits(
              grandPrizeSize,
              ADDRESS[CONFIG.CHAINNAME].PRIZETOKEN.DECIMALS
            )
          ),
          timeLeft: null,
          error: null,
          prizeTokenPrice: Number((prizeAssetPrice as any).price),
        });
      } catch (error) {
        console.log(error);
        // setData(prevState);
      }
    };

    fetchData();
  }, []);
// console.log("data",data)
  return (
    data.drawPeriodSeconds && (
      <>
      <>
        {/* <div style={styles.container} className="app-container-desktop"> */}
          {/* <div className="hidden-mobile"><br></br></div> */}
          <div className="box-header" style={{ width: "190px" }}>
            <Link href="/prizes">
              <a className="custom-link">PRIZES EVERY DAY</a>
            </Link>
            {/* {data.nextDrawId ? "DRAW #"+ data.nextDrawId.toString() : ""} */}
            {/* <br></br>
          <Timer seconds={Number(data.nextDrawEndsAt)}/> */}
          </div>
          {/* <div style={styles.contentContainer}> */}
          {/* <div style={styles.vaultGrid}></div> */}
          {data.error ? (
            // <p>Error: {data.error.message}</p>
            <p>Data Not Available</p>
          ) : data.drawPeriodSeconds ? (
            <div style={styles.vaultCard}>
              {/*         
          <table>
            <tbody> */}
              {/* <tr>
                <td>Max fee:</td>
                <td>{data.maxFee.toString()}</td>
              </tr>
              <tr>
                <td>Last completed draw started at:</td>
                <td>{data.nextDrawEndsAt?.toString()}</td>
              </tr>
              <tr>
                <td>Draw period seconds:</td>
                <td>{data.drawPeriodSeconds?.toString()}</td>
              </tr> */}
              {/* <tr>
                <td>Last completed draw ID:</td>
                <td>{data.nextDrawId?.toString()}</td>
              </tr>
              <tr>
                <td>Number of tiers:</td>
                <td>{data.numberOfTiers?.toString()}</td>
              </tr>
              <tr>
                <td>Grand prize period draws:</td>
                <td>{data.grandPrizePeriod?.toString()}</td>
              </tr> */}
              {/* <tr>
                <td>Prize pool POOL balance:</td>
                <td>{data.prizePoolPOOLBalance ? parseFloat(data.prizePoolPOOLBalance.div(ethers.constants.WeiPerEther).toString()).toFixed(2) : "-"}</td>
              </tr>
              <tr>
                <td>Accounted balance:</td>
                <td>{data.accountedBalance ?  cropDecimals(parseFloat(ethers.utils.formatUnits(data.accountedBalance,18))) : "-"}</td>
              </tr>
              <tr>
                <td>Reserve:</td>
                <td>{data.reserve ?  cropDecimals(parseFloat(ethers.utils.formatUnits(data.reserve,18))) : "-"}</td>
              </tr> */}
              {/* </tbody>
          </table> */}
              <table style={{ width: "100%" }}>
                <tbody>
                  <tr>
                    {/* <th>Tier</th> */}
                    {/* <th colSpan={2}>{data.nextDrawId ? "Draw #"+ data.nextDrawId.toString() : ""}</th> */}
                  </tr>
                  <tr>
                    <td>
                      <span style={styles.font16}>Total Prize Pool</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                        }}>
                        <PrizeIcon size={16} />
                        &nbsp;
                        {data.prizePoolPOOLBalance ? (
                          parseInt(data.prizePoolPOOLBalance.toString()) ===
                          0 ? (
                            <>
                              New &nbsp;
                              <div className="tooltipContainer">
                                <Image
                                  src="/images/moreInfo.svg"
                                  alt="i"
                                  width={16}
                                  height={16}
                                />
                                <span className="tooltipText">
                                  This prize party is just getting started
                                </span>
                              </div>
                            </>
                          ) : (
                            <>{PrizeToke(data.prizePoolPOOLBalance as any)}
                             
                              &nbsp;
                              <div className="tooltipContainer">
                                <Image
                                  src="/images/moreInfo.svg"
                                  alt="i"
                                  width={16}
                                  height={16}
                                />
                                <span className="tooltipText">
                                  The amount of prize generated and ready to
                                  be awarded<br></br> USD =
                                  {data.prizeTokenPrice &&
                                  data.prizePoolPOOLBalance
                                    ? "$" +
                                      NumberWithCommas(
                                        CropDecimals(
                                          (
                                            data.prizeTokenPrice *
                                            Number(
                                              ethers.utils.formatUnits(
                                                data.prizePoolPOOLBalance,
                                                ADDRESS[CONFIG.CHAINNAME]
                                                  .PRIZETOKEN.DECIMALS
                                              )
                                            )
                                          ).toFixed(0)
                                        ).toString()
                                      )
                                    : ""}
                                </span>
                              </div>
                            </>
                          )
                        ) : (
                          "-"
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* <tr>
                  <td><span style={styles.font16}></span></td>
                  <td style={{ textAlign: 'right' }}>
                  <div style={{ display: "flex", alignItems: "center" ,justifyContent: "flex-end" }}>
                  <span style={styles.font16}>${
                      data.prizeTokenPrice && data.prizePoolPOOLBalance 
                        ? NumberWithCommas(
                            CropDecimals(
                              (data.prizeTokenPrice * Number(ethers.utils.formatUnits(data.prizePoolPOOLBalance, ADDRESS[CONFIG.CHAINNAME].PRIZETOKEN.DECIMALS))).toFixed(0)
                            ).toString()
                          )
                        : " -"
                    }        </span>            </div></td>
                </tr> */}
                  <tr>
                    <td>
                      <span style={styles.font16}>Grand Prize</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                        }}>
                        <PrizeIcon size={16} />
                        &nbsp;
                        {typeof data.grandPrize !== 'undefined' && data.grandPrize !== null ? (
                          <>
                            {data.grandPrize === 0 ? (
                              <>New</>
                            ) : (
                              <>
                                {NumberWithCommas(
                                  CropDecimals(data.grandPrize)
                                )}
                              </>
                            )}
                            &nbsp;
                            <div className="tooltipContainer hidden-mobile">
                              <Image
                                src="/images/moreInfo.svg"
                                alt="i"
                                width={16}
                                height={16}
                              />
                              <span className="tooltipText">
                                {data.grandPrize === 0 ? (
                                  "This prize party is just getting started"
                                ) : (
                                  <>
                                    The largest prize up for grabs in the pool
                                    <br></br> USD =
                                    {data.prizeTokenPrice && data.grandPrize ? (
                                      <>
                                        $
                                        {NumberWithCommas(
                                          CropDecimals(
                                            data.prizeTokenPrice *
                                              data.grandPrize
                                          )
                                        )}
                                      </>
                                    ) : (
                                      ""
                                    )}
                                  </>
                                )}
                              </span>
                            </div>
                          </>
                        ) : (
                          "-"
                        )}
                      </div>
                    </td>
                  </tr>

                  {yesterdaysPrize !== "" && yesterdaysPrize !== undefined && (
                    <tr>
                      <td>
                        <span style={styles.font16}>Recent Daily Draw</span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                          }}>
                          <PrizeIcon size={16} />
                          &nbsp;{PrizeToke(BigInt(yesterdaysPrize))}&nbsp;
                          <div className="tooltipContainer hidden-mobile">
                            <Image
                              src="/images/moreInfo.svg"
                              alt="i"
                              width={16}
                              height={16}
                            />
                            <span className="tooltipText">
                              {yesterdaysPrize.length > 0 ? (
                                <>
                                  The amount of prize won in the most recent
                                  daily draw<br></br> USD =
                                  {data.prizeTokenPrice &&
                                  yesterdaysPrize.length > 0 ? (
                                    <>
                                      $
                                      {NumberWithCommas(
                                        CropDecimals(
                                          data.prizeTokenPrice *
                                            (Number(yesterdaysPrize) / 1e18)
                                        )
                                      )}
                                    </>
                                  ) : (
                                    ""
                                  )}
                                </>
                              ) : (
                                "This prize party is just getting started"
                              )}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  {/* <tr>
                  <td></td>
                  <td style={{ textAlign: 'right' }}>
                  <div style={{ display: "flex", alignItems: "center" ,justifyContent: "flex-end" }}>
                  <span style={styles.font16}>{data.prizeTokenPrice && data.tierData ? <>${NumberWithCommas(CropDecimals(data.prizeTokenPrice * (data.tierData[0]?.liquidity/data.tierData[0]?.count)))}</> : "-"}</span></div></td>
                </tr>
               */}

                  {/* {data.tierData?.map(({ tier, value, frequency, count, liquidity }) => (
                <tr key={tier}> */}
                  {/* <td>{tier}</td> */}
                  {/*                   
                  <td><span style={styles.font16}>{tier === 0 ? "Grand Prize" : "Tier "+tier}</span></td>
                  <td style={{ textAlign: 'right' }}>
                  <div style={{ display: "flex", alignItems: "center" ,justifyContent: "flex-end" }}>
                    <Image
                      src={"/images/pool.png"}
                      className="emoji"
                      alt="r"
                      width={17}
                      height={17}
                    />&nbsp;{NumberWithCommas(CropDecimals(liquidity/count))}</div></td>
                </tr>
              ))} */}
                </tbody>
              </table>
            </div>
          ) : (
            <></>
          )}{" "}
          <></>
          {/* {address && <Notifications/>} */}
        {/* </div> */}
        </>
      </>
    )
  );
};

const styles: { [key: string]: CSSProperties } = {
  container: {
    marginTop: "10px",
    backgroundColor: "#b4ccd1",
    padding: "20px",
    borderRadius: "10px",
    width: "350px",
    display: "inline-block",
    // ...({ '@media (minWidth: 768px)': { display: 'inline-flex', minWidth: 'auto', height:'900px' } } as Partial<CSSProperties>),
  },

  vaultGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "10px",
    maxWidth: "300px",
    margin: "0 auto",
  },

  vaultCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: "10px",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    width: "100%",
    minWidth: "280px",
  },
  font16: {
    fontSize: "16px",
  },
};
export default Prizes;

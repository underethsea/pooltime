import React, { useState, useEffect } from "react";
import Select, { ActionMeta } from "react-select";
import { useRouter } from "next/router";
import { ethers } from "ethers";
import Image from "next/image";
import Layout from "./index";
// import { GetClaimEvents } from "../utils/getClaimEvents";
import { TierColors } from "../constants/constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAward, faSadTear } from "@fortawesome/free-solid-svg-icons";
import donut from "/public/images/pooltogether.png";
import { NumberWithCommas, CropDecimals } from "../utils/tokenMaths";

import { CONFIG, ADDRESS } from "../constants/"
import PrizeIcon from "../components/prizeIcon";
import { PrizeToke } from "../utils/tokenMaths";
import PrizeValueIcon from "../components/prizeValueIcon";
import PrizeValue from "../components/prizeValue";
import Wins from "../components/leaderboardWins";


interface Transaction {
  n: number | string;
  p: string;
  v: string;
  t: string[];
  w: string;
}

const explorerURL = "https://poolexplorer.xyz";

function Winners(): JSX.Element {
  const router = useRouter();

  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  const handleAddressClick = (address: string) => {
    setSelectedAddress(address);
};

const handleCloseModal = () => {
    setSelectedAddress(null);
};


  const [totalPrizeValueCounter, setTotalPrizeValueCounter] =
    useState<ethers.BigNumber>(ethers.BigNumber.from(0));
  const [popup, setPopup] = useState<boolean>(true);
  const [options, setOptions] = useState<{ label: number; value: number }[]>([]);
  const [draw, setDraw] = useState<{ label: number; value: number }>({
    label: 0,
    value: 0,
  });
  const [unique, setUnique] = useState<number>(0);
  const [uniqueVaults, setUniqueVaults] = useState<number>(0);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tierValues, setTierValues] = useState<Record<number, number[]>>({});
  const [chain, setChain] = useState<{ label: string; value: number }>();
  const [chainOptions, setChainOptions] = useState<
    {
      label: string;
      value: number;
    }[]
  >([]);
  const [firstRender, setFirstRender] = useState<boolean>(true);
  const [prizeCount, setPrizeCount] = useState<number>(0);

  const onChange = (
    newValue: any,
    actionMeta: ActionMeta<{ label: number; value: number }>
  ) => {
    if (newValue) {
      const selectedOption = newValue as { label: number; value: number };
      setDraw(selectedOption);
      
    }
  };

  const fetchDrawsForChain = async (chainName: string) => {
    const chainId = ADDRESS[chainName].CHAINID;
    const drawsFetch = await fetch(
      `${explorerURL}/claimeddraws-${chainId}-${ADDRESS[chainName].PRIZEPOOL}`
    );
    const drawsData = await drawsFetch.json();
    return drawsData[0].draws.map(Number);
  };
  
  const onChangeChain = async (
    selectedOption: any,
    actionMeta: ActionMeta<{ label: string; value: number }>
  ) => {
    setChain(selectedOption as { label: string; value: number });
    const newDraws = await fetchDrawsForChain(selectedOption.label);
    setOptions(
      newDraws.map((number: number) => ({ label: number, value: number })).reverse()
    );
    if (newDraws.length > 0) {
      const latestDraw = Math.max(...newDraws);
      setDraw({ label: latestDraw, value: latestDraw });
      await fetchWins(selectedOption.value, latestDraw);
      
    }
  };
  const fetchWins = async (
    fetchChain: number,
    fetchDraw: number
  ): Promise<void> => {
    console.log("fetching wins")
    try {
      const winsURL = `${explorerURL}/${fetchChain}-${ADDRESS[chain?.label || CONFIG.CHAINNAME].PRIZEPOOL}-draw${fetchDraw}`;
      const claimsURL = `${explorerURL}/claims-${fetchChain}-${ADDRESS[chain?.label || CONFIG.CHAINNAME].PRIZEPOOL}-draw${fetchDraw}`;
  
      console.log("Fetching wins from URL:", winsURL);
      console.log("Fetching claims from URL:", claimsURL);
  
      const [currentWinsFetch, currentClaimFetch] = await Promise.all([
        fetch(winsURL),
        fetch(claimsURL)
      ]);
  
  
      let currentClaimResult;
      let currentWinsResult;
  
      try {
        currentClaimResult = await currentClaimFetch.json();
        currentWinsResult = await currentWinsFetch.json();
      } catch (jsonError) {
        throw new Error('Failed to parse JSON response');
      }
  
      // remove canary wins
      currentClaimResult = currentClaimResult.filter((item: any) => item.p !== "0");
      setPrizeCount(currentClaimResult.length);
  
      if (fetchChain) {
        let total = ethers.BigNumber.from(0);
        const consolidatedRows: any = {};
  
        for (const win of currentClaimResult) {
          const key = `${win.n}-${win.w}-${win.v}`;
          total = total.add(ethers.BigNumber.from(win.p));
  
          if (consolidatedRows.hasOwnProperty(key)) {
            consolidatedRows[key].p = ethers.BigNumber.from(consolidatedRows[key].p)
              .add(ethers.BigNumber.from(win.p))
              .toString();
  
            if (!consolidatedRows[key].t.includes(win.t)) {
              consolidatedRows[key].t.push(win.t);
            }
          } else {
            consolidatedRows[key] = {
              n: win.n,
              w: win.w,
              v: win.v,
              p: win.p,
              t: [win.t],
            };
          }
        }
  
        const consolidatedWins: any = Object.values(consolidatedRows);
        consolidatedWins.sort((a: any, b: any) => {
          const diff = ethers.BigNumber.from(b.p).sub(ethers.BigNumber.from(a.p));
  
          if (diff.isZero()) return 0; // if they are equal
          if (diff.lt(0)) return -1; // if a is less than b
          return 1; // if a is greater than b
        });
  
        setTotalPrizeValueCounter(total);
        setTransactions(consolidatedWins);
  
        const uniqueAddresses = new Set(currentClaimResult.map((obj: any) => obj.w));
        setUnique(uniqueAddresses.size);
  
        const uniqueVaults = new Set(currentClaimResult.map((obj: any) => obj.v));
        setUniqueVaults(uniqueVaults.size);
  
        // Count the number of prizes claimed (all tiers)
        const prizesClaimedCount = currentClaimResult.length;
  
        // Count the number of prizes won excluding the last two tiers
        const tiers = currentWinsResult.wins.map((win: any) => win.t);
        const highestTier = Math.max(...tiers);
        const validTiers = tiers.filter((tier: number) => tier < highestTier - 1);
        const prizesWonCount = currentWinsResult.wins
          .filter((win: any) => validTiers.includes(win.t))
          .reduce((acc: number, win: any) => acc + win.i.length, 0);
  
        // console.log(`Prizes Claimed: ${prizesClaimedCount}`);
        // console.log(`Prizes Won: ${prizesWonCount}`);
  
        // Do something with the prizesWonCount and prizesClaimedCount, e.g., set them in state if needed
        // setPrizesWon(prizesWonCount); // Uncomment if you need to store it in state
        // setPrizesClaimed(prizesClaimedCount); // Uncomment if you need to store it in state
  
      } else {
        console.log("no chain selected");
      }
    } catch (error) {
      console.log("fetch error", error);
    }
  };
  
  
  useEffect(() => {
    setPopup(true);

    const fetchInitialData = async () => {
      try {
        let initialChainName = CONFIG.CHAINNAME;
        const initialDraws = await fetchDrawsForChain(initialChainName);
    
        const chainList = Object.keys(ADDRESS).map((chainName) => ({
          label: chainName,
          value: ADDRESS[chainName].CHAINID,
        }));
    
        let initialDrawValue: number | undefined = Math.max(...initialDraws);
        let initialChainValue: number | undefined = ADDRESS[initialChainName].CHAINID;
    
        if (router.query.draw) {
          initialDrawValue = parseInt(
            Array.isArray(router.query.draw) ? router.query.draw[0] : router.query.draw,
            10
          );
        }
    
        if (router.query.chain) {
          initialChainValue = parseInt(
            Array.isArray(router.query.chain) ? router.query.chain[0] : router.query.chain,
            10
          );
          initialChainName = Object.keys(ADDRESS).find(
            (chainName) => ADDRESS[chainName].CHAINID === initialChainValue
          ) as any;
        }
    
        if (initialDrawValue !== undefined && initialChainValue !== undefined) {
          setChain({
            label: initialChainName || CONFIG.CHAINNAME,
            value: initialChainValue,
          });
          setDraw({ label: initialDrawValue, value: initialDrawValue });
    
          setChainOptions(chainList);
          setOptions(
            initialDraws
              .map((number: number) => ({ label: number, value: number }))
              .reverse()
          );
    
          await fetchWins(initialChainValue, initialDrawValue);
          setFirstRender(false);
          setPopup(false);
        } else {
          console.error("Initial values are not set");
        }
      } catch (error) {
        console.log(error);
      }
    };
    
    fetchInitialData();
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!firstRender && draw && chain && draw.value && chain.value) {
        // console.log("fetch not first render")
        setPopup(true);
        await fetchWins(chain.value, draw.value);
        setPopup(false);
      }
    };
    fetchData();
  }, [draw, chain]);

  const customStyles = {
    control: (provided: any) => ({
      ...provided,
      borderRadius: "10px",
    }),
  };

  return (
    <Layout>
      <center>
        {!popup ? (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
              <Image
                src={`/images/net.png`}
                height={90}
                width={105}
                alt="liquidator"
                style={{ verticalAlign: "middle" }}
              />
              <h1 style={{ margin: "0 0 0 10px", lineHeight: "120px" }}>
                WINS
              </h1>
            </div>

            <div
              className="clear-container padding-top-bottom-20 border-radius-20"
              style={{ backgroundColor: "white" }}>
              <div style={{ padding: "5px 0px 5px 0px" }}>
                <div
                  style={{
                    width: "200px",
                    display: "inline-block",
                    paddingRight: "10px",
                  }}>
                  <Select
                    styles={customStyles}
                    options={chainOptions}
                    className="select-testnet-chain"
                    onChange={onChangeChain}
                    value={chain}
                  />
                </div>
                &nbsp;&nbsp;&nbsp;&nbsp;
                <div style={{ width: "95px", display: "inline-block" }}>
                  <Select
                    styles={customStyles}
                    options={options}
                    onChange={onChange}
                    className="select-draw"
                    value={draw}
                  />
                </div>
              </div>
            </div>
            {transactions.length > 0 && (
              <div className="stats-container">
                <div className="vault-name">
                </div>
                {uniqueVaults > 0 && (
                  <div className="stats hidden-mobile" style={{ color: "white" }}>
                    <div className="stat">
                      <div className="stat-details">
                        Vaults&nbsp;&nbsp;
                        <span className="stat-value-poolers">
                          {NumberWithCommas(uniqueVaults.toString())}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                {uniqueVaults > 0 && (
                  <div className="stats " style={{ color: "white" }}>
                    <div className="stat">
                      <div className="stat-details">
                        Unique Winners&nbsp;&nbsp;
                        <span className="stat-value-poolers">
                          {NumberWithCommas(unique.toString())}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                {totalPrizeValueCounter.gt(0) && (
                  <div className="stats" style={{ color: "white" }}>
                    <div className="stat">
                      <div className="stat-details">
                        Total&nbsp;&nbsp;
                        {/* <PrizeIcon size={17} />
                        &nbsp; */}{chain && <>
                        <PrizeValueIcon size={25}  chainname={chain.label}/>
                        <span className="stat-value-poolers">
                          <PrizeValue amount={BigInt(totalPrizeValueCounter.toString())} size={25} chainname={chain.label}/>
                          {/* {PrizeToke(BigInt(totalPrizeValueCounter.toString()))} */}
                        </span></>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {transactions.length > 0 ? (
              <div className="win-container">
                <div style={{ maxWidth: "1100px" }}>
                  <table className="claims-table">
                    <thead>
                      <tr>
                        <th className="hidden-mobile">Tier</th>
                        <th>Address</th>
                        <th className="hidden-mobile">Vault</th>
                        <th style={{ textAlign: "right" }}>
                          Amount&nbsp;&nbsp;&nbsp;&nbsp;
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                    {transactions.map((item, index) => (
    <tr key={index} onClick={() => handleAddressClick(item.w)} style={{ cursor: "pointer" }}>
        <td className="hidden-mobile">
            {item.t.map((tier, index) => (
                <FontAwesomeIcon
                    key={index}
                    icon={faAward}
                    size="sm"
                    style={{
                        color: TierColors[tier],
                        height: "20px",
                        marginRight: "8px",
                    }}
                />
            ))}
        </td>
        <td>
            <div className="addressText">
                <span>
                    <div className="inlineDiv">
                        {item.n === "11155111" && (
                            <Image
                                src="/images/sepolia.png"
                                className="emoji"
                                alt="Sepolia"
                                width={20}
                                height={19}
                            />
                        )}
                        {item.n === "420" && "OP"}
                        {item.n === "10" && "OP"}
                        <span className="hidden-desktop">
                            {item.w.substring(0, 6)}{"..."}{item.w.substring(item.w.length - 4)}
                        </span>
                        <span className="hidden-mobile">
                            {item.w === "0x327b2ea9668a552fe5dec8e3c6e47e540a0a58c6" || item.w === "0xdeef914a2ee2f2014ce401dcb4e13f6540d20ba7" || item.w === "0x1dcfb8b47c2f05ce86c21580c167485de1202e12" 
                            || item.w === "0x65f3aea2594d82024b7ee98ddcf08f991ab1c626" || item.w === "0x2d3ad415198d7156e8c112a508b8306699f6e4cc" || item.w === "0x6be9c23aa3c2cfeff92d884e20d1ec9e134ab076" ? "Grand Prize Boost" : item.w}
                        </span>
                        {item.p === "0xb37b3b78022e6964fe80030c9161525880274010" && (
                            <Image
                                src="/images/ukraine.png"
                                className="emoji"
                                alt="Ukraine"
                                width={20}
                                height={19}
                            />
                        )}
                    </div>
                </span>
            </div>
        </td>
        <td className="hidden-mobile">
            {chain &&
                ADDRESS[chain.label].VAULTS.find(
                    (findVault) =>
                        findVault.VAULT.toLowerCase() === item.v.toLowerCase()
                )?.NAME.replace(/PoolTogether|Prize Token/g, "").trim()}
        </td>
        <td className="amount" style={{ textAlign: "right" }}>
          {chain && <>
            <PrizeValueIcon size={20}  chainname={chain.label}/>
            <PrizeValue amount={BigInt(item.p)} size={20} chainname={chain.label}/></>}
            &nbsp;&nbsp;&nbsp;
        </td>
    </tr>
))}

                    </tbody>
                  </table>
                </div>
              </div>
            ) : <div style={{
              paddingTop: "80px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}>
              <div style={{
                maxWidth: "800px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <div className="box-header" style={{
                  padding: "16px 14px",
                  display: "flex",
                  alignItems: "center"
                }}>
                  <FontAwesomeIcon icon={faSadTear} width={30} height={30} />&nbsp;&nbsp; No prizes. See history page for prize overview.
                </div>
              </div>
            </div>
            }
            {selectedAddress && (
    <div style={styles.modalOverlay} onClick={handleCloseModal}>
        <Wins addressProp={selectedAddress} />
    </div>
)}


            <style jsx>{`
              .stat-details {
                display: flex;
                align-items: center;
              }
              .stat-value-poolers {
                font-size: 28px;
              }
              .stat-value {
                margin-right: 10px;
              }
              .stats-container {
                display: flex;
                justify-content: center;
                align-items: flex-end;
                flex-wrap: no-wrap;
                padding-top: 15px;
              }
              .amount {
                white-space: nowrap;
              }
              .win-container {
                margin-top: 20px;
              }

              .claims-table {
                border-collapse: collapse;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                width: 100%;
                max-width: 1500px;
              }

              .claims-table th,
              .claims-table td {
                padding: 16px;
                text-align: left;
                background-color: #f7f7f7;
                border-bottom: 1px solid #ebebeb;
              }

              .claims-table th:first-child,
              .claims-table td:first-child {
                padding-left: 24px;
              }

              .claims-table th:last-child,
              .claims-table td:last-child {
                padding-right: 24px;
                @media (max-width: 400px) {
                    padding-right: 0px;
                }
              }
              .claims-table td:nth-child(2):hover {
                color: #1a405d;
                cursor: pointer;
              }
              .claims-table td:nth-child(2) {
                color: #7b68c4;
              }

              .amount-header,
              .amount {
                text-align: right;
              }
            `}</style>
          </>
        ) : (
          <div className="loading-animation">
            <div className="loading-image">
              <Image src={donut} alt="Loading" priority={true} />
            </div>
          </div>
        )}
      </center>
    </Layout>
  );
}
const styles: any = {
  modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
  },
  modalContent: {
      position: "relative",
      backgroundColor: "#fff",
      padding: "20px",
      borderRadius: "10px",
      width: "80%",
      maxWidth: "600px",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
      zIndex: 1001,
      overflow: "auto",
  },
};


export default Winners;

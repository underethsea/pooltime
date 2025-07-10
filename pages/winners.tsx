import React, { useState, useEffect, useCallback } from "react";
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
      setPopup(true);
      const selectedOption = newValue as { label: number; value: number };
      console.log("onChange (draw selected):", selectedOption);
      setDraw(selectedOption);
      
    }
  };

  const fetchDrawsForChain = useCallback(async (chainName: string) => {
    console.log(`fetchDrawsForChain: Fetching draws for chain ${chainName}`);
    const chainId = ADDRESS[chainName]?.CHAINID;
    if (!chainId) {
        console.error(`fetchDrawsForChain: ChainId not found for chain name ${chainName}`);
        return [];
    }
    const prizePoolAddress = ADDRESS[chainName]?.PRIZEPOOL;
    if (!prizePoolAddress) {
        console.error(`fetchDrawsForChain: Prize pool address not found for chain name ${chainName}`);
        return [];
    }
    const drawsFetch = await fetch(
      `${explorerURL}/claimeddraws-${chainId}-${prizePoolAddress}`
    );
    if (!drawsFetch.ok) {
        console.error(`fetchDrawsForChain: Failed to fetch draws for ${chainName}, status: ${drawsFetch.status}`);
        return [];
    }
    try {
    const drawsData = await drawsFetch.json();
        const result = drawsData[0]?.draws?.map(Number) || [];
        console.log(`fetchDrawsForChain: Found ${result.length} draws for ${chainName}`);
        return result;
    } catch (e) {
        console.error(`fetchDrawsForChain: Error parsing draws JSON for ${chainName}`, e);
        return [];
    }
  }, []);
  
  const onChangeChain = async (
    selectedOption: any,
    actionMeta: ActionMeta<{ label: string; value: number }>
  ) => {
    console.log("onChangeChain: selectedOption", selectedOption);
    if (!selectedOption) return;
    setPopup(true);

    const newChain = selectedOption as { label: string; value: number };
    const newDraws = await fetchDrawsForChain(newChain.label);
    console.log(`onChangeChain: Fetched ${newDraws.length} draws for chain ${newChain.label}`);
    const newOptions = newDraws.map((number: number) => ({ label: number, value: number })).reverse();
    setOptions(newOptions);

    if (newDraws.length > 0) {
      const latestDrawForNewChain = Math.max(...newDraws);
      console.log(`onChangeChain: Setting chain to ${newChain.label} and draw to ${latestDrawForNewChain}`);
      setChain(newChain);
      setDraw({ label: latestDrawForNewChain, value: latestDrawForNewChain });
      
    } else {
      console.warn(`onChangeChain: No draws found for new chain ${newChain.label}. Setting chain, but draw to 0.`);
      setChain(newChain);
      setDraw({label: 0, value: 0}); 
      setOptions([]);
      setTransactions([]);
      setTotalPrizeValueCounter(ethers.BigNumber.from(0));
      setUnique(0);
      setUniqueVaults(0);
      setPrizeCount(0);
    }
  };

  const fetchWins = useCallback(async (
    fetchChainId: number,
    fetchDraw: number
  ): Promise<void> => {
    console.log(`fetchWins: Called for chainId ${fetchChainId}, draw ${fetchDraw}`);
    
    const chainNameForAPI = Object.keys(ADDRESS).find(name => ADDRESS[name].CHAINID === fetchChainId);

    if (!chainNameForAPI) {
        console.error(`fetchWins: Could not find chain name for CHAINID ${fetchChainId}. Clearing data.`);
        setTransactions([]);
        setTotalPrizeValueCounter(ethers.BigNumber.from(0));
        setUnique(0);
        setUniqueVaults(0);
        setPrizeCount(0);
        return;
    }
    const prizePoolAddress = ADDRESS[chainNameForAPI]?.PRIZEPOOL;
    if (!prizePoolAddress) {
        console.error(`fetchWins: PRIZEPOOL not found for chain name ${chainNameForAPI}. Clearing data.`);
        setTransactions([]);
        setTotalPrizeValueCounter(ethers.BigNumber.from(0));
        setUnique(0);
        setUniqueVaults(0);
        setPrizeCount(0);
        return;
    }

    if (fetchDraw === 0) {
        console.warn(`fetchWins: fetchDraw is 0 for chainId ${fetchChainId}. Clearing data and not fetching.`);
        setTransactions([]);
        setTotalPrizeValueCounter(ethers.BigNumber.from(0));
        setUnique(0);
        setUniqueVaults(0);
        setPrizeCount(0);
        return;
    }

    try {
      const claimsURL = `${explorerURL}/claims-${fetchChainId}-${prizePoolAddress}-draw${fetchDraw}`;
  
      console.log("fetchWins: Fetching claims from URL:", claimsURL);
  
      const currentClaimFetch = await fetch(claimsURL);
  
  
      let currentClaimResult;
  
      try {
        currentClaimResult = await currentClaimFetch.json();
        console.log("fetchWins: Successfully fetched and parsed claims JSON.");
      } catch (jsonError: any) {
        console.error('fetchWins: Failed to parse JSON response from claimsURL', claimsURL, jsonError);
        setTransactions([]);
        setTotalPrizeValueCounter(ethers.BigNumber.from(0));
        setUnique(0);
        setUniqueVaults(0);
        setPrizeCount(0);
        throw new Error(`Failed to parse JSON response: ${jsonError.message}`);
      }
  
      currentClaimResult = currentClaimResult.filter((item: any) => item.p !== "0");
      console.log(`fetchWins: Filtered claims (removed canary wins), count: ${currentClaimResult.length}`);
      setPrizeCount(currentClaimResult.length);
  
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
  
        if (diff.isZero()) return 0; 
        if (diff.lt(0)) return -1; 
        return 1; 
      });
  
      console.log(`fetchWins: Processed ${consolidatedWins.length} consolidated wins.`);
        setTotalPrizeValueCounter(total);
        setTransactions(consolidatedWins);
  
        const uniqueAddresses = new Set(currentClaimResult.map((obj: any) => obj.w));
        setUnique(uniqueAddresses.size);
      console.log(`fetchWins: Unique winners: ${uniqueAddresses.size}`);
  
        const uniqueVaults = new Set(currentClaimResult.map((obj: any) => obj.v));
        setUniqueVaults(uniqueVaults.size);
      console.log(`fetchWins: Unique vaults: ${uniqueVaults.size}`);
  
      console.log(`fetchWins: Prize count (from claims): ${currentClaimResult.length}`);
      
    } catch (error: any) {
      console.error("fetchWins: General fetch error", error.message, error);
      setTransactions([]);
      setTotalPrizeValueCounter(ethers.BigNumber.from(0));
      setUnique(0);
      setUniqueVaults(0);
      setPrizeCount(0);
    }
  }, [setTransactions, setTotalPrizeValueCounter, setUnique, setUniqueVaults, setPrizeCount]);
  
  
  useEffect(() => {
    const init = async () => {
      console.log("Initial useEffect [router.isReady, router.asPath]: Triggered. Router.isReady:", router.isReady, "Router.asPath:", router.asPath);
      if (!router.isReady) {
        console.log("Initial useEffect: Router not ready, waiting.");
    setPopup(true);
        return;
      }

      const chainList = Object.keys(ADDRESS).map((name) => ({
        label: name,
        value: ADDRESS[name].CHAINID,
      }));
      setChainOptions(chainList);

      let qChainIdStr: string | undefined = undefined;
      let qDrawIdStr: string | undefined = undefined;

      if(router.query.chain) qChainIdStr = Array.isArray(router.query.chain) ? router.query.chain[0] : router.query.chain;
      if(router.query.draw) qDrawIdStr = Array.isArray(router.query.draw) ? router.query.draw[0] : router.query.draw;
      
      console.log(`Initial useEffect: Parsed from query - qChainIdStr: ${qChainIdStr}, qDrawIdStr: ${qDrawIdStr}`);

      let targetChainId: number | undefined;
      let targetDrawId: number | undefined;
      let targetChainName: string | undefined;

      if (qChainIdStr) {
        const parsedChainId = parseInt(qChainIdStr, 10);
        const foundChainName = Object.keys(ADDRESS).find(name => ADDRESS[name].CHAINID === parsedChainId);

        if (foundChainName && !isNaN(parsedChainId)) {
          console.log(`Initial useEffect: Valid chain found in query: ${foundChainName} (${parsedChainId})`);
          const drawsForQueryChain = await fetchDrawsForChain(foundChainName);

          if (drawsForQueryChain.length === 0) {
            console.warn(`Initial useEffect: Chain ${foundChainName} from query has no draws. Setting chain, draw to 0. URL will be /chain=${parsedChainId}`);
            targetChainId = parsedChainId;
            targetChainName = foundChainName;
            targetDrawId = 0;
            const targetUrl = `/winners?chain=${targetChainId}`;
            if (router.asPath !== targetUrl) {
                console.log(`Initial useEffect: Redirecting to ${targetUrl} (chain with no draws).`);
                router.push(targetUrl);
                return;
            }
          } else if (qDrawIdStr) {
            const parsedDrawId = parseInt(qDrawIdStr, 10);
            if (!isNaN(parsedDrawId) && parsedDrawId > 0 && drawsForQueryChain.includes(parsedDrawId)) {
              targetChainId = parsedChainId;
              targetDrawId = parsedDrawId;
              targetChainName = foundChainName;
              console.log(`Initial useEffect: Using valid query params - Chain: ${targetChainName} (${targetChainId}), Draw: ${targetDrawId}`);
            } else {
              console.warn(`Initial useEffect: Draw ${parsedDrawId} from query invalid or not found for chain ${foundChainName}. Redirecting to latest draw for this chain.`);
              const latestDraw = Math.max(...drawsForQueryChain);
              router.push(`/winners?chain=${parsedChainId}&draw=${latestDraw}`);
              return;
            }
          } else {
            console.warn(`Initial useEffect: Chain ${foundChainName} in query, but no draw ID. Redirecting to latest draw for this chain.`);
            const latestDraw = Math.max(...drawsForQueryChain);
            router.push(`/winners?chain=${parsedChainId}&draw=${latestDraw}`);
            return;
          }
        } else {
          console.warn(`Initial useEffect: chainId ${qChainIdStr} from query is invalid. Will use defaults and redirect.`);
        }
      }
      
      if (!targetChainId) {
        console.log("Initial useEffect: No valid chain/draw from query. Determining defaults for redirect.");
        const defaultChainName = CONFIG.CHAINNAME;
        const defaultChainId = ADDRESS[defaultChainName]?.CHAINID;

        if (!defaultChainId || !defaultChainName) {
          console.error("Initial useEffect: Default chain name or ID is invalid in CONFIG/ADDRESS. Cannot proceed.");
          setPopup(false); return;
        }
        
        const defaultDraws = await fetchDrawsForChain(defaultChainName);
        let defaultDrawId = 0;
        let targetUrl = `/winners?chain=${defaultChainId}`;

        if (defaultDraws.length > 0) {
          defaultDrawId = Math.max(...defaultDraws);
          targetUrl = `/winners?chain=${defaultChainId}&draw=${defaultDrawId}`;
          console.log(`Initial useEffect: Defaulting to Chain: ${defaultChainName} (${defaultChainId}), Draw: ${defaultDrawId}.`);
        } else {
          console.warn(`Initial useEffect: No draws found for default chain ${defaultChainName}. Defaulting to chain only URL.`);
        }
        
        if (router.asPath !== targetUrl) {
          console.log(`Initial useEffect: Redirecting to default/fallback URL: ${targetUrl}`);
          router.push(targetUrl);
        } else {
          console.log(`Initial useEffect: Already at target URL ${targetUrl}. Setting state for this scenario.`);
          targetChainId = defaultChainId;
          targetChainName = defaultChainName;
          targetDrawId = defaultDrawId;
        }
        if (router.asPath !== targetUrl) return;
      }

      console.log(`Initial useEffect: Proceeding to load data/state for Chain: ${targetChainName} (${targetChainId}), Draw: ${targetDrawId}`);
      setPopup(true);

      setChain({ label: targetChainName!, value: targetChainId! });
      setDraw({ label: targetDrawId!, value: targetDrawId! });

      const drawsToSetForOptions = await fetchDrawsForChain(targetChainName!);
      setOptions(
        drawsToSetForOptions.map((d: number) => ({ label: d, value: d })).reverse()
      );
      
      if (targetDrawId! > 0) {
        console.log(`Initial useEffect: Calling fetchWins for chain ${targetChainId!}, draw ${targetDrawId!}`);
        await fetchWins(targetChainId!, targetDrawId!);
      } else {
        console.log(`Initial useEffect: Draw is ${targetDrawId}, not calling fetchWins. Clearing transaction data.`);
        setTransactions([]);
        setTotalPrizeValueCounter(ethers.BigNumber.from(0));
        setUnique(0);
        setUniqueVaults(0);
        setPrizeCount(0);
      }
      
      setFirstRender(false);
      setPopup(false);
      console.log("Initial useEffect: Load complete. firstRender=false, popup=false.");
    };

    init().catch(err => {
            console.error("Error in init useEffect:", err);
            setPopup(false);
        });
  }, [router.isReady, router.asPath, fetchDrawsForChain, fetchWins, router.query]);

  useEffect(() => {
    const fetchDataAndUpdateURL = async () => {
      if (firstRender) {
        console.log("useEffect[draw, chain]: firstRender is true, skipping update.");
        return;
      }
      if (draw && chain && chain.value) {
        console.log(`useEffect[draw, chain]: Detected change. New Chain: ${chain.label} (${chain.value}), New Draw: ${draw.value}.`);
        // popup should have been set to true by onChange or onChangeChain

        const targetPath = draw.value > 0 
            ? `/winners?chain=${chain.value}&draw=${draw.value}`
            : `/winners?chain=${chain.value}`;

        if (router.asPath !== targetPath) {
            console.log(`useEffect[draw, chain]: URL needs update. Current: ${router.asPath}, Target: ${targetPath}. Pushing URL.`);
            // Data fetching for the new URL will be handled by the initial useEffect.
            // The popup should remain true (set by onChange/onChangeChain) until the initial useEffect completes.
            router.push(targetPath, undefined, { shallow: true });
            // DO NOT setPopup(false) here; the initial useEffect (reacting to asPath change) will handle it.
        } else {
            // URL is already up-to-date with the selected chain/draw.
            // This means either the initial useEffect already handled this state, or it's a redundant update.
            // We need to fetch data for the current state as the initial useEffect might not re-run if asPath didn't change.
            // Then, turn off the popup that was presumably set by onChange/onChangeChain.
            console.log("useEffect[draw, chain]: URL is already up-to-date. Fetching data for current state and turning off loader.");
            if (draw.value > 0) {
                console.log(`Fetching wins for current state: chain ${chain.value}, draw ${draw.value}`);
                await fetchWins(chain.value, draw.value);
            } else {
                console.warn(`useEffect[draw, chain]: Draw is ${draw.value}. Clearing transaction data.`);
                setTransactions([]);
                setTotalPrizeValueCounter(ethers.BigNumber.from(0));
                setUnique(0);
                setUniqueVaults(0);
                setPrizeCount(0);
            }
            setPopup(false); // Turn off loader as this effect is handling the final state for an unchanged URL.
        }
      } else {
        console.log("useEffect[draw, chain]: draw or chain is not fully set, skipping update.", {draw, chain, firstRender});
      }
    };
    fetchDataAndUpdateURL().catch(err => {
        console.error("Error in useEffect[draw,chain]:", err);
        setPopup(false); // Ensure popup is off on error.
    });
  }, [draw, chain, firstRender, router, fetchWins]);

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
                paddingTop: "20px",
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

            <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
              <div
                className="clear-container padding-top-bottom-20 border-radius-20"
                style={{ backgroundColor: "white", marginTop: "20px" }}>
                <div style={{ padding: "5px 10px 5px 0px", display: "flex", justifyContent: "center", gap: "20px" }}>
                  <div
                    style={{
                      width: "200px",
                      display: "inline-block",
                    }}>
                    <Select
                      styles={customStyles}
                      options={chainOptions}
                      className="select-testnet-chain"
                      onChange={onChangeChain}
                      value={chain}
                    />
                  </div>
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
                  {unique > 0 && (
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
                  <div style={{ maxWidth: "1100px", margin: '0 auto' }}>
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
                              {item.w === "0x327b2ea9668a552fe5dec8e3c6e47e540a0a58c6" || item.w === "0xdeef914a2ee2f2014ce401dcb4e13f6540d20ba7" || item.w === "0x1dcfb8b47c2f05ce86c21580c167485de1202e12" || item.w === "0xdd315e449bead6e65b30920a3050550292eac3d4" 
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
            </div>
            {selectedAddress && (
    <div style={styles.modalOverlay} onClick={handleCloseModal}>
        <Wins addressProp={selectedAddress} onClose={handleCloseModal}/>
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
                padding-top: 30px;
                gap: 0px;
              }
              .amount {
                white-space: nowrap;
              }
              .win-container {
                margin-top: 10px;
              }

              @media (max-width: 768px) {
                .stats-container {
                  gap: 20px;
                  padding: 0 0px;
                  margin-top: 20px;
                  margin-bottom: 0px;
                }
                .stats {
                  flex: 1;
                  min-width: 0;
                  text-align: center;
                }
                .stat-details {
                  justify-content: center;
                }
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

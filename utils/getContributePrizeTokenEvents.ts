import { PROVIDERS, ADDRESS, CONFIG, INTERVAL } from "../constants/";
import { GetChainName } from "./getChain";
import { TOPICS } from "../constants/";
import { STARTBLOCK, ABI } from "../constants/";
import { ethers } from "ethers";

export async function GetContributePrizeTokenEvents(chain: number) {
  const chainName = GetChainName(chain);
  console.log("chain check", chainName);
  // Function to fetch logs for a given block range
  const fetchLogs = async (fromBlock: any, toBlock: any) => {
    const contributeFilter = {
      address: ADDRESS[chainName].PRIZEPOOL,
      topics: [TOPICS.CONTRIBUTEPRIZETOKENS],
      fromBlock,
      toBlock,
    };

    const contributeLogs = await PROVIDERS[chainName].getLogs(contributeFilter);
    console.log("logs", chainName, contributeLogs);
    const prizePool = new ethers.Contract(
      ADDRESS[chainName].PRIZEPOOL,
      ABI.PRIZEPOOL,
      PROVIDERS[chainName]
    );
    return contributeLogs.map((contribute) => {
      const decodedLog = prizePool.interface.parseLog(contribute);
      const args = decodedLog.args;
      return {
        vault: args.vault,
        drawId: args.drawId,
        amount: args.amount,
      };
    });
  };

  let currentBlock = await PROVIDERS[chainName].getBlockNumber();
  console.log("current block", currentBlock);
  console.log("start block for prize pool", STARTBLOCK[chainName].PRIZEPOOL);
  const blockRanges: [number, number][] = [];
  for (
    let fromBlock = STARTBLOCK[chainName].PRIZEPOOL;
    fromBlock < currentBlock;
    fromBlock += INTERVAL
  ) {
    let toBlock = Math.min(fromBlock + INTERVAL - 1, currentBlock);
    blockRanges.push([fromBlock, toBlock]);
  }
  console.log("Block Ranges:", blockRanges);

  // Create promises for each block range
  const logPromises = blockRanges.map((range: [number, number]) =>
    fetchLogs(...range)
  );

  try {
    // Resolve all promises concurrently
    const allLogs = await Promise.all(logPromises);

    // Combine and flatten logs
    return allLogs.flat();
  } catch (error) {
    console.error("Error fetching logs:", error);
    return [];
  }
}

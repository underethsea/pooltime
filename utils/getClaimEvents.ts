import {
  PROVIDERS,
  ADDRESS,
  STARTBLOCK,
  TOPICS,
  INTERVAL,
  CONFIG,
} from "../constants/";
import { GetChainName } from "./getChain";
import existingEvents from "../constants/claimEvents.json";
import { CONTRACTS } from "../constants/contracts";

// Function to convert BigNumber format to BigInt
// @ts-ignore
const convertBigNumberToBigInt = (bigNumberObject) => {
  return BigInt(bigNumberObject.hex);
};

export async function GetClaimEvents(chain: number) {
  const chainName = GetChainName(chain);

  // Function to fetch logs for a given block range
  const fetchLogs = async (fromBlock: any, toBlock: any) => {
    const claimFilter = {
      address: ADDRESS[chainName].PRIZEPOOL,
      topics: [TOPICS.CLAIMEDPRIZE],
      fromBlock,
      toBlock,
    };

    const claimLogs = await PROVIDERS[chainName].getLogs(claimFilter);
    return claimLogs.map((claim) => {
      const decodedLog =
        CONTRACTS.PRIZEPOOL[chainName].interface.parseLog(claim);
      const args = decodedLog.args;
      return {
        drawId: args.drawId,
        vault: args.vault,
        winner: args.winner,
        tier: args.tier,
        payout: args.payout,
        fee: args.claimReward,
        feeRecipient: args.claimRewardRecipient,
        index: args.prizeIndex,
        txHash: claim.transactionHash,
      };
    });
  };

  console.log("existing events", existingEvents);
  // Determine the most recent block number
  const mostRecentBlock = existingEvents.reduce(
    (max: any, event: any) => Math.max(max, event.blockNumber),
    STARTBLOCK[CONFIG.CHAINNAME].PRIZEPOOL
  );
  console.log("most recent block", mostRecentBlock);

  // Fetch new events starting from the next block after the most recent block
  let currentBlock = await PROVIDERS[chainName].getBlockNumber();

  let blockRanges = [];
  for (
    let fromBlock = mostRecentBlock + 1;
    fromBlock < currentBlock;
    fromBlock += INTERVAL
  ) {
    let toBlock = Math.min(fromBlock + INTERVAL - 1, currentBlock);
    blockRanges.push([fromBlock, toBlock]);
  }
  console.log("Block Ranges:", blockRanges);

  // Create promises for each block range
  // @ts-ignore
  const logPromises = blockRanges.map((range) => fetchLogs(...range));

  try {
    // Resolve all promises concurrently and combine with existing events
    const newLogs = await Promise.all(logPromises);

    console.log("claim events", newLogs);
    // todo temp return new logs
    return newLogs[0];
    console.log("new logs", newLogs.length, newLogs);
    console.log("old logs", existingEvents.length, existingEvents[0]);

    // Convert BigNumber objects in existing events to BigInt
    const updatedExistingEvents = existingEvents.map((event: any) => ({
      ...event,
      payout: convertBigNumberToBigInt(event.payout),
      fee: convertBigNumberToBigInt(event.fee),
    }));

    // @ts-ignore
    let combinedLogs = updatedExistingEvents.concat(newLogs.flat());
    console.log("combined logs", combinedLogs);
    return combinedLogs;
  } catch (error) {
    console.error("Error fetching logs:", error);
    return existingEvents; // Return existing events in case of an error
  }
}

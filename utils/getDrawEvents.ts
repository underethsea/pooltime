import { ethers } from "ethers";
import { ABI, PROVIDERS, ADDRESS, CONFIG, STARTBLOCK, TOPICS } from "../constants/";
import { GetChainName } from "./getChain";
const INTERVAL = 100000
const drawManagerInterface = new ethers.utils.Interface(ABI.DRAWMANAGER);

const tempSTARTBLOCK = STARTBLOCK[CONFIG.CHAINNAME].PRIZEPOOL
console.log("temp stat block",tempSTARTBLOCK)

export async function GetDrawEvents(chain: number) {
    console.log("EVENTS, fetching getdrawevent")
    const chainName = GetChainName(chain);

    const fetchLogs = async (fromBlock:any, toBlock:any) => {
        console.log("EVENTS FETCHING??")
        const drawStartedFilter = {
            address: ADDRESS[chainName].DRAWMANAGER,
            topics: [TOPICS.DRAWSTARTED],
            fromBlock,
            toBlock,
        };
        const drawFinishedFilter = {
            address: ADDRESS[chainName].DRAWMANAGER,
            topics: [TOPICS.DRAWFINISHED],
            fromBlock,
            toBlock,
        };

        const [drawStartedLogs, drawFinishedLogs] = await Promise.all([
            PROVIDERS[chainName].getLogs(drawStartedFilter),
            PROVIDERS[chainName].getLogs(drawFinishedFilter),
        ]);

        console.log("EVENTS FETCHED",drawStartedLogs.length,drawFinishedLogs.length)
        const processLogs = (logs:any, eventType:any) => logs.map((log:any) => {
            const decoded = drawManagerInterface.parseLog(log);
            console.log("log",log)
            return {
                transactionHash: log.transactionHash,
                // sender: log.sender,
                eventType,
                drawId: decoded.args.drawId.toString(),
                reward: decoded.args.reward.toString(),
                elapsedTime: decoded.args.elapsedTime
                // ...(eventType === 'DrawFinished' && { gasCost: log.gasUsed }), // Example: Add conditional property
                // Include other properties as needed
            };
        });

        return [...processLogs(drawStartedLogs, 'DrawStarted'), ...processLogs(drawFinishedLogs, 'DrawFinished')];
    };

    let currentBlock = await PROVIDERS[chainName].getBlockNumber();
    console.log("Current block",currentBlock)
    const blockRanges = [];
    for (let fromBlock = Number(tempSTARTBLOCK); fromBlock < currentBlock; fromBlock += INTERVAL) {
        console.log("loooping through blcoks")
        let toBlock = Math.min(fromBlock + INTERVAL - 1, currentBlock);
        blockRanges.push([fromBlock, toBlock]);
    }

    const logPromises = blockRanges.map(range => fetchLogs(...range as [number, number]));

    try {
        const allLogsArray = await Promise.all(logPromises);
        const allLogs = allLogsArray.flat();

        const combinedLogs = allLogs.reduce((acc, log) => {
            if (!acc[log.drawId]) {
                acc[log.drawId] = { drawStarted: {}, drawFinished: {} };
            }

            if (log.eventType === 'DrawStarted') {
                acc[log.drawId].drawStarted = { ...log };
            } else if (log.eventType === 'DrawFinished') {
                acc[log.drawId].drawFinished = { ...log };
            }

            return acc;
        }, {});

        return Object.entries(combinedLogs).map(([drawId, logs]:[any,any]) => ({
            drawId,
            drawStarted: logs.drawStarted,
            drawFinished: logs.drawFinished,
        }));
    } catch (error) {
        console.error("Error fetching logs:", error);
        return [];
    }
}

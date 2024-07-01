
import { PROVIDERS, ADDRESS } from "../constants/";
import { CONTRACTS} from "../constants/contracts"


export async function GetLiquidationEvents(address:string,chain:string) {
    const chainName = chain
    const liquidationFilter = {
      address: ADDRESS[chainName].LIQUIDATIONROUTER,
      topics: [
        // "0xe62c0dd6407b614f9e385cec5ea620558665f5a7f749e562236fd929f79e69f5",
        // newer?
        // "0x6abc2d6699315cdd965afdaa01e9bfd32b512397f6ed431a17b64af87b2c3555" // liq pair event
        "0xc3e764298a9fad13823b73a0d08df8366d14e2b62920b94b42c635f0ddd0d7b4", // liq router
      ],
      fromBlock: -1000000,
      toBlock: "latest",
    };
  try{    
    const liquidationLogs = await PROVIDERS[chainName].getLogs(liquidationFilter);
// console.log("liquidation logs", liquidationLogs)

const decodedClaimLogs = liquidationLogs.map((liquidation, index) => {
  // Decode the log
  const decodedLog = CONTRACTS.LIQUIDATIONROUTER[chainName].interface.parseLog(liquidation);

  // Check if this log matches the filter condition
  if (decodedLog.args.liquidationPair.toLowerCase() !== address.toLowerCase()) {
    return null;
  }

  // Extract args for easier access
  const args = decodedLog.args;

  // Return an object that includes the transaction hash
  return {
    sender: args.sender,
    receiver: args.receiver,
    amountOut: args.amountOut,
    amountInMax: args.amountInMax,
    amountIn: args.amountIn,
    transactionHash: liquidation.transactionHash,  // include the transaction hash here
  };
}).filter(log => log !== null);  // Remove null entries



    return decodedClaimLogs.reverse();
  }catch(e){console.log("error getting liquidation events from router",e)}

  //
    
  }
  

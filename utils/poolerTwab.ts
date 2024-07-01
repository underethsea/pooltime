import { CONTRACTS } from "../constants/contracts";
import { CONFIG } from "../constants/config";
import { Multicall } from "./multicall";
// Define the structure of the API response
interface PoolerVaultResponse {
  vault: string;
}

// Define your TypeScript function
export async function GetPoolerTwabAllVaults(
  userAddress: string,
  duration: number
): Promise<any> {
  try {
    // Fetch data from the API
    const response = await fetch(
      "https://poolexplorer.xyz/poolerVaults?address=" + userAddress
    );
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data: PoolerVaultResponse[] = await response.json();

    // Create contract calls for each vault
    const calls = data.map((vaultInfo) =>
      CONTRACTS.PRIZEPOOL[
        CONFIG.CHAINNAME
      ].getVaultUserBalanceAndTotalSupplyTwab(
        vaultInfo.vault,
        userAddress,
        duration
      )
    );

    // Use Multicall
    return Multicall(calls, CONFIG.CHAINNAME);
  } catch (error) {
    console.error("Error fetching vault balances:", error);
    throw error; // Re-throw the error for further handling, if needed
  }
}

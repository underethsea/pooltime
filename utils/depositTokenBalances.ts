
import { Multicall } from "./multicall";
import { CONTRACTS } from "../constants/contracts";
import { GetChainName } from "./getChain";
import { ADDRESS } from "../constants/address";

// might be nice if this didn't call the same deposit token balance twice like if two vaults both take usdc
// might need to adapt to batch for calling lotsa vaults
type VaultBalance = {
    depositTokenBalance: bigint;
    vaultTokenBalance: bigint;
    depositTokenAddress: string;
    vaultTokenAddress: string;
    decimals: number;
    symbol: string;
    name: string;
  };
    export async function GetDepositTokenBalances(chainNumber: number, pooler: string) {
        const chain = GetChainName(chainNumber)
        let calls: any[] = []
        const vaultContracts = CONTRACTS.VAULTS[chain]
    
        vaultContracts.forEach((vault: any, index: number) => {
            console.log("vault",ADDRESS[chain].VAULTS[index].VAULT)
            calls.push(vault.ASSET.balanceOf(pooler))
            // calls.push(vault.VAULT.balanceOf(pooler))
            calls.push(vault.ASSET.allowance(pooler,ADDRESS[chain].VAULTS[index].VAULT))
        })
    
        const results  = await Multicall(calls, chain)
    
        const addressData = ADDRESS[chain].VAULTS
        let balanceIndex = 0
    
        const combinedResults  = []
    
        for (let index = 0; index < vaultContracts.length; index++) {
            const vault = vaultContracts[index]
            const address = addressData[index]
            const decimals = address.DECIMALS
            const symbol = address.SYMBOL
            const name = address.NAME
            const icon = address.ICON
    
            const depositTokenBalance  = results[balanceIndex]
            // const vaultTokenBalance = results[balanceIndex + 1]
            const approvalAmount = results[balanceIndex +1 ]

    
            balanceIndex += 2
    
            combinedResults.push({
                approvalAmount,
                depositTokenBalance,
                // vaultTokenBalance,
                depositTokenAddress: address.ASSET,
                vaultTokenAddress: address.VAULT,
                decimals,
                symbol,
                name,
                icon,
                assetSymbol: address.ASSETSYMBOL
            })
        }
    
        return combinedResults;
    }
    





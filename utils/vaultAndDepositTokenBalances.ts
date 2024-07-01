

import { Multicall } from "./multicall";
import { GetChainName } from "./getChain";
import { ADDRESS } from "../constants/address";
import { CONTRACTS } from "../constants/contracts";
import { FetchPricesForChain } from "../utils/tokenPrices"


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
    assetSymbol: string;
  };
    export async function GetVaultAndDepositTokenBalances(chainNumber: number, pooler: string) {
        const chain = GetChainName(chainNumber)
        const denomination = "usd"; // or whatever denomination you are using

        const vaultPrices = await FetchPricesForChain(chain, denomination);  // Fetch the prices

        let calls: any[] = []
        const vaultContracts = CONTRACTS.VAULTS[chain]
    
        vaultContracts.forEach((vault: any, index: number) => {
            console.log("pooler",pooler,"vault here",ADDRESS[chain].VAULTS[index].VAULT)
            calls.push(vault.ASSET.balanceOf(pooler))
            calls.push(vault.VAULT.balanceOf(pooler))
            // calls.push(vault.ASSET.allowance(pooler,ADDRESS[chain].VAULTS[index].VAULT))
        })
   
        const results  = await Multicall(calls, chain)
         
        console.log("results",results)
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
            const assetSymbol = address.ASSETSYMBOL
    
            const depositTokenBalance  = results[balanceIndex]
            const vaultTokenBalance = results[balanceIndex + 1]
            // const approvalAmount = results[balanceIndex +2 ]
    
            balanceIndex += 2
            const priceInfo = vaultPrices.find(vp => vp.vaultAddress === address.VAULT);

            combinedResults.push({
                // approvalAmount,
                depositTokenBalance,
                vaultTokenBalance,
                depositTokenAddress: address.ASSET,
                vaultTokenAddress: address.VAULT,
                decimals,
                symbol,
                assetSymbol,
                name,
                icon,
                price: priceInfo ? priceInfo.price : 0  // If not found, default to 0 or handle accordingly

            })
        }
    
        return combinedResults;
    }
    
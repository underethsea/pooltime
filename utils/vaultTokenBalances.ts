
// import { VIEMPROVIDERS } from '../constants/providers'
// import { ADDRESS } from '../constants/address'
// import {ABI} from '../constants/abi'
// import { MulticallContracts } from 'viem';

// export async function GetVaultTokenBalances(chain: string, pooler: string) {
//     const multicallPromises: MulticallContracts<[{ address: string; abi: any }]> = [];

//     ADDRESS[chain].VAULTS.map(async (vault, index) => {
//         const contract : MulticallContracts<[{ address: string; abi: any }]> = {address:vault,abi:ABI.VAULT}
//     multicallPromises.push({...contract,functionName:"balanceOf",args:[pooler]})
//     const results = await VIEMPROVIDERS[chain].multicall({
//         contracts: multicallPromises
//       })
//       return results
// })}

// todo search all networks, not config.chainname

import { Multicall } from "./multicall";
import { ADDRESS } from "../constants/address";
import { CONTRACTS } from "../constants/contracts"
import { CONFIG } from "../constants/config"

export async function GetVaultTokenBalances( pooler: string) {
    let calls: any = [];
    const chain = CONFIG.CHAINNAME
    const vaultContracts = CONTRACTS.VAULTS[chain];

    vaultContracts.map((vault: any, index:any) => {
        calls.push(vault.VAULT.balanceOf(pooler));
        calls.push(CONTRACTS.TWABCONTROLLER[chain].delegateBalanceOf(ADDRESS[chain].VAULTS[index].VAULT, pooler));
    });

    const multicallResults = await Multicall(calls, chain);
    // console.log("ticket balances",multicallResults)

    let results = vaultContracts.map((vault: any, index: number) => {
        const balanceOfResult = multicallResults[2 * index];  // even indices
        const delegateBalanceOfResult = multicallResults[2 * index + 1]; // odd indices

        const address = ADDRESS[chain].VAULTS[index];
        return {
            balance: balanceOfResult,
            delegatedBalance: delegateBalanceOfResult,
            vault: address.VAULT,
            decimals: address.DECIMALS,
            symbol: address.SYMBOL,
            name: address.NAME,
            icon: address.ICON
        };
    });

    return results;
}






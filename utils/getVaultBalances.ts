import { Multicall } from "./multicall";
import { ABI } from "../constants/abi"
import { ethers } from "ethers"
import { PROVIDERS } from "../constants/providers"

interface VaultBalances {
    vaultBalance: any;
    tokenBalance: any;
}

export async function GetVaultBalances(userAddress: string, vaultAddresses: string[], depositTokenAddresses: string[], chainName: string) {
    const provider = PROVIDERS[chainName];
    let calls = [];
    let balances: { [address: string]: VaultBalances } = {};

    await Promise.all(vaultAddresses.map(async (address, index) => {
        const vaultContract = new ethers.Contract(address, ABI.VAULT, provider);
        const depositTokenContract = new ethers.Contract(depositTokenAddresses[index], ABI.ERC20, provider);

        // Execute calls for balances asynchronously
        const [vaultBalance, tokenBalance] = await Multicall([
            vaultContract.balanceOf(userAddress),
            depositTokenContract.balanceOf(userAddress)
        ], chainName);

        // Map results to respective vault address
        balances[address] = {
            vaultBalance,
            tokenBalance
        };
    }));

    return balances;
}

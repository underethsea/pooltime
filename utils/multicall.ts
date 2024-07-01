import { PROVIDERS } from "../constants/providers";
import { MulticallWrapper } from "ethers-multicall-provider";

export async function Multicall(calls: any[][], chain: string) {
  const provider = MulticallWrapper.wrap(PROVIDERS[chain]);
  const results = await Promise.all(calls);
  return (await results).map((result) => result);
}



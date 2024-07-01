
import { formatUnits } from 'viem'
export const PrizeTokenDecimals = 18
import {ethers} from 'ethers'

export function NumberWithCommas(number: string) {
    const parts = number.split(".");
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.length > 1 ? `${integerPart}.${parts[1]}` : integerPart;
  }
  
  export function CropDecimals(num: string | number): string {
    const absNum = Math.abs(Number(num));
     if(absNum === 0 || isNaN(absNum)){return "0"}
    else if (absNum > 99) {
      return Number(num).toFixed(0);
    }
    else if (absNum >= 0.1) {
      return Number(num).toFixed(2);
    } else if (absNum >= 0.001) {
      return Number(num).toFixed(4);
    } else if (absNum >= 0.00001) {
      return Number(num).toFixed(6);
    } else if (absNum >= 0.000001) {
      return Number(num).toFixed(7); // Updated to handle 7 decimal place numbers
    } else if (absNum >= 0.0000001) {
      return Number(num).toFixed(8); // Updated to handle 7 decimal place numbers
    } else {
      return "DUST";
    }
}

  export function Dec(number:bigint ,decimals:number){
    const formatted = formatUnits(number,decimals)
    return formatted
  }

  export function PrizeToker(number:ethers.BigNumber) {
    return NumberWithCommas(CropDecimals(ethers.utils.formatUnits(number,PrizeTokenDecimals)))
  }
  export function PrizeToke(number:bigint) {
    return NumberWithCommas(CropDecimals(Dec(number,PrizeTokenDecimals)))
  }
   
  export function Eighteener(number:ethers.BigNumber) {
    return NumberWithCommas(CropDecimals(ethers.utils.formatUnits(number,18)))
  }

  export function PrizeAsNumber(number:bigint) {
    return Number(formatUnits(number,PrizeTokenDecimals))
  }
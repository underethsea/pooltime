
import { formatUnits } from 'viem'
export const PrizeTokenDecimals = 18
import {ethers} from 'ethers'

export function NumberWithCommas(number: string) {
    const parts = number.split(".");
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.length > 1 ? `${integerPart}.${parts[1]}` : integerPart;
  }
  export function CropDecimals(num: string | number, compact: boolean = false): string {
    const absNum = Math.abs(Number(num));
    if (absNum === 0 || isNaN(absNum)) {
        return "0";
    }

    function addCommas(x: number): string {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    if (compact) {
        if (absNum >= 1e6) {
            if (absNum < 1e8) {
                return (absNum / 1e6).toFixed(1) + "M"; // One decimal for under 100M
            } else {
                return addCommas(Math.floor(absNum / 1e6)) + "M"; // No decimals for 100M or more
            }
        } else if (absNum >= 1e3) {
            return addCommas(Math.floor(absNum / 1e3)) + "k";
        } else if (absNum >= 100) {
            return addCommas(Math.floor(absNum)); // No decimals for 100 or more
        } else if (absNum >= 1) {
            return Number(absNum.toFixed(1)).toString(); // One decimal for 1 to 99.9
        } else if (absNum >= 0.1) {
            return Number(absNum.toFixed(1)).toString(); // One decimal for 0.1 to 0.99
        } else if (absNum >= 0.01) {
            return Number(absNum.toFixed(2)).toString(); // Two decimals for 0.01 to 0.099
        } else {
            return "<0.01"; // Less than 0.01
        }
    } else {
        if (absNum > 99) {
            return addCommas(Math.floor(Number(num))); // No decimals for 100 or more
        } else if (absNum >= 0.1) {
            return Number(num).toFixed(2);
        } else if (absNum >= 0.001) {
            return Number(num).toFixed(4);
        } else if (absNum >= 0.00001) {
            return Number(num).toFixed(6);
        } else if (absNum >= 0.000001) {
            return Number(num).toFixed(7); // Handles 7 decimal place numbers
        } else if (absNum >= 0.0000001) {
            return Number(num).toFixed(8); // Handles 8 decimal place numbers
        } else {
            return "DUST";
        }
    }

    return absNum.toString(); // Fallback to the original number as a string
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
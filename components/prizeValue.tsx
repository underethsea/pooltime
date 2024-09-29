// src/components/PrizeToken.tsx
import React from 'react';
import { useOverview } from './contextOverview';
import { NumberWithCommas, CropDecimals, Dec } from '../utils/tokenMaths';
import { ADDRESS } from '../constants/address'; // Assuming ADDRESS is imported from constants

interface PrizeTokenProps {
  amount?: bigint;
  size?: number; // Optional textSize parameter
  rounded?: boolean;
  chainname?: string; // Made chainname optional
}

const PrizeValue: React.FC<PrizeTokenProps> = ({ amount = BigInt(0), size = 16, rounded = false, chainname }) => {
  const { currency, overview } = useOverview();

  const ethPrice = overview?.prices.geckos.ethereum || 1; // Default ETH price to 1 if not available

  // Fallback to default ETH and USD if chainname is not provided
  const prizeTokenSymbol = chainname ? ADDRESS[chainname]?.PRIZETOKEN?.SYMBOL : 'WETH';
  const prizeTokenGeckoId = chainname ? ADDRESS[chainname]?.PRIZETOKEN?.GECKO : 'ethereum';
  const PrizeTokenDecimals = chainname ? ADDRESS[chainname]?.PRIZETOKEN?.DECIMALS : 18

  // Check if the prize token is WETH (case-insensitive)
  const isWeth = prizeTokenSymbol?.toLowerCase() === 'weth';

  // Helper function to format the token value
  const formatToken = (num: bigint) => {
    const tokenValue = Dec(num, PrizeTokenDecimals);

    // // If currency is ETH
    // if (currency === 'ETH') {
    //   if (isWeth || !chainname) {
    //     // Handle WETH token or default ETH if no chainname
    //     return rounded
    //       ? `${CropDecimals(tokenValue, true)}`
    //       : `${NumberWithCommas(CropDecimals(tokenValue))}`;
    //   } else if (prizeTokenGeckoId) {
    //     // Handle non-WETH token, use Gecko ID to get USD price
    //     const tokenUsdPrice = overview?.prices.geckos[prizeTokenGeckoId] || 0;
    //     const ethValue = parseFloat(tokenValue) * (tokenUsdPrice / ethPrice);
    //     return rounded
    //       ? `${CropDecimals(ethValue, true)} ETH`
    //       : `${NumberWithCommas(CropDecimals(ethValue))} ETH`;
    //   }
    // }
    // If currency is ETH
if (currency === 'ETH') {
  // Return the parsed value directly without conversion
  return rounded
    ? `${CropDecimals(tokenValue, true)}`
    : `${NumberWithCommas(CropDecimals(tokenValue))}`;
}


    // If currency is USD
    if (currency === 'USD') {
      const usdValue = parseFloat(tokenValue) * (isWeth || !chainname ? ethPrice : (overview?.prices.geckos[prizeTokenGeckoId] || 0));
      return rounded
        ? `${CropDecimals(usdValue, true)} USD`
        : `${NumberWithCommas(CropDecimals(usdValue))} USD`;
    }

    // Default formatting
    return NumberWithCommas(CropDecimals(tokenValue));
  };

  return (
    <span style={{ display: "inline-block", fontSize: size.toString() + "px" }}>
      {formatToken(amount)}
    </span>
  );
};

export default PrizeValue;

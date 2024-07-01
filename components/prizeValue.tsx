// src/components/PrizeToken.tsx
import React from 'react';
import { useOverview } from './contextOverview';
import { NumberWithCommas, CropDecimals, Dec } from '../utils/tokenMaths';

interface PrizeTokenProps {
  amount?: bigint;
  size?: number; // Optional textSize parameter
}

const PrizeValue: React.FC<PrizeTokenProps> = ({ amount = BigInt(0), size = 16 }) => {
    const { currency, overview } = useOverview();

    // console.log("prize token amount",amount,amount.toString())

  const ethPrice = overview?.prices.geckos.ethereum || 1; // Default ETH price to 1 if not available
  const PrizeTokenDecimals = 18; // Adjust according to your token decimals

  // console.log("overview",overview)
  const formatToken = (num: bigint) => {
    const tokenValue = Dec(num, PrizeTokenDecimals);
    if (currency === 'ETH') {
      return `${NumberWithCommas(CropDecimals(tokenValue))}`;
    } else if (currency === 'USD') {
      const usdValue = parseFloat(tokenValue) * ethPrice;
      return `${NumberWithCommas(CropDecimals(usdValue))}`;
    }
    return NumberWithCommas(CropDecimals(tokenValue));
  };

  return (
    <span style={{ display: "inline-block", fontSize: size.toString()+"px" }}>
      {formatToken(amount)}
    </span>
  );
};

export default PrizeValue;

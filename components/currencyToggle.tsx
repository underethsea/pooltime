// src/components/CurrencyToggle.tsx
import React from 'react';
import { useOverview } from './contextOverview';
import Image from 'next/image';
const CurrencyToggle: React.FC = () => {
const { currency, toggleCurrency } = useOverview();

  return (

    <div className="currency-toggle-button" onClick={toggleCurrency}>
      {currency === 'USD' ? '$' : <Image
      src="/images/eth.png"
      alt="ETH"
      width={18}
      height={18}
    />}
    </div>
   
  );
};

export default CurrencyToggle;

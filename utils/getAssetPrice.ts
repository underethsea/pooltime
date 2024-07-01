interface PriceData {
    [chain: string]: {
      [address: string]: number;
    };
  }
  
  interface ApiResponse {
    assets: PriceData;
    geckos: { [key: string]: number };
    timestamp: string;
  }
  
  export const GetAssetPrice = async (chainName: string, assetAddress: string): Promise<number> => {
    const url = 'https://poolexplorer.xyz/prices';
  
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      const data: ApiResponse = await response.json();
  
      // Normalize the input
      const normalizedChainName = chainName.toUpperCase();
      const normalizedAssetAddress = assetAddress.toLowerCase();
  
      // Check if the chain and asset address exist in the response data
      if (data.assets[normalizedChainName] && data.assets[normalizedChainName][normalizedAssetAddress] !== undefined) {
        return data.assets[normalizedChainName][normalizedAssetAddress];
      }
  
      return 0;
    } catch (error) {
      console.error('Error fetching price data:', error);
      return 0;
    }
  };
  
//   // Example usage:
//   (async () => {
//     const price = await fetchPrice('OPTIMISM', '0x0b2c639c533813f4aa9d7837caf62653d097ff85');
//     console.log('Price:', price); // Outputs the price or 0 if not found
//   })();
  
import { ADDRESS } from "../constants/address";
import { useOverview } from "../components/contextOverview";
// import { COINGECKO_TICKERS } from "../constants/constants";

export interface TokenPrice {
  symbol: string;
  price: number;
  assetSymbol: string;
}

export interface SingleTokenPrice {
  geckoID: string;
  price: number;
}

const chainToCoinGeckoId: Record<string, string> = {
  ETHEREUM: "ethereum",
  BINANCE: "binance-smart-chain",
  OPTIMISM: "optimistic-ethereum",
  // Add other chains here...
};

export async function getGeckoPriceForTokenAddress(chain: string, tokenAddress: string): Promise<number | null> {
  const geckoChainId = chainToCoinGeckoId[chain];
  if (!geckoChainId) {
    console.error("Unsupported chain:", chain);
    return null;
  }

  const coingeckoUrl = `https://api.coingecko.com/api/v3/simple/token_price/${geckoChainId}?contract_addresses=${tokenAddress}&vs_currencies=usd`;
console.log("gecko url",coingeckoUrl)
  try {
    const response = await fetch(coingeckoUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch price data from CoinGecko for ${tokenAddress} on ${chain}`);
    }
    const data = await response.json();
    const price = data[tokenAddress.toLowerCase()]?.usd;
    if (price === undefined) {
      throw new Error(`Price data not found for ${tokenAddress} on ${chain}`);
    }
    return price;
  } catch (error) {
    console.error("Error fetching token price:", error);
    return null;
  }
}


export const FetchPriceForAsset = async (
  geckoIDs: string | string[], 
  denomination: string = "usd",
  // pricesFromOverview: any
): Promise<SingleTokenPrice | SingleTokenPrice[]> => {

  // Convert single geckoID to an array for uniform processing
  const geckoIDsArray = Array.isArray(geckoIDs) ? geckoIDs : [geckoIDs];
  const customPricesUrl = `https://poolexplorer.xyz/prices`;
  const coingeckoUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${geckoIDsArray.join(",")}&vs_currencies=${denomination}`;

  let data: any= {};
  try {
    // First try fetching from the custom URL
    const response = await fetch(customPricesUrl);
    if (response.ok) {
      console.log("prices fetched from local api")
      let customData = await response.json();
      customData = customData.geckos
      // Check if all prices are available
      const allPricesAvailable = geckoIDsArray.every(id => customData.hasOwnProperty(id));
      if (allPricesAvailable) {
        data = customData;
      } else {
        throw new Error('Not all prices are available in custom data');
      }
    } else {
      throw new Error('Failed to fetch from custom URL');
    }
  } catch (error) {
    console.log('prices for asset, Error fetching from custom URL, falling back to CoinGecko:', error);
    // Fallback to CoinGecko API
    const response = await fetch(coingeckoUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch price data from CoinGecko for ${geckoIDs}`);
    }
    data = await response.json();
  }

  // Map over the geckoIDs to extract the price information
  const prices = geckoIDsArray.map(id => {
    const priceData = data[id] ? data[id][denomination] || data[id] : null;
    if (priceData === null) {
      throw new Error(`Failed to fetch price data for ${id}`);
    }
    return {
      geckoID: id,
      price: priceData
    };
  });

  // If the original input was a single string, return a single object, else return an array
  return Array.isArray(geckoIDs) ? prices : prices[0];
};


export const FetchPricesForChain = async (chain: string, denomination: string) => {
  const vaults = ADDRESS[chain].VAULTS;
  const geckoIDs = vaults.filter(vault => vault.GECKO).map(vault => vault.GECKO);
  const univ2Assets = vaults.filter(vault => vault.UNIV2).map(vault => vault.ASSET);

  const customPricesUrl = `https://poolexplorer.xyz/prices`;
  const coingeckoUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${geckoIDs.concat(['ethereum']).join(",")}&vs_currencies=${denomination}`;
  console.log("gecko url", coingeckoUrl);

  let data: any = {};

  try {
    // Fetching from the custom URL for UNIV2 assets
    const customResponse = await fetch(customPricesUrl);
    let customData: any = {};

    if (customResponse.ok) {
      customData = await customResponse.json();
      customData = customData.assets;  // Assume assets is an array with one object as shown
    } else {
      throw new Error('Failed to fetch from custom URL');
    }

    // Fetching from CoinGecko for assets with GECKO identifiers
    const geckoResponse = await fetch(coingeckoUrl);
    const geckoData = geckoResponse.ok ? await geckoResponse.json() : {};

    // Integrating both data sources
    vaults.forEach(vault => {
      if (vault.GECKO && geckoData[vault.GECKO]) {
        data[vault.ASSET] = geckoData[vault.GECKO][denomination];
        // console.log("got price for ",vault.ASSET,geckoData[vault.GECKO][denomination])
      } else if (vault.UNIV2 && customData[chain] && customData[chain][vault.ASSET.toLowerCase()]) {
        const assetPriceInWETH = customData[chain][vault.ASSET.toLowerCase()];
        const ethereumPriceInUSD = geckoData['ethereum'][denomination];
        data[vault.ASSET] = assetPriceInWETH * ethereumPriceInUSD;
      }
    });
  } catch (error) {
    console.error('Error fetching prices:', error);
    throw new Error('Failed to fetch prices');
  }

  // Format the prices
  const prices = vaults.map(vault => ({
    vaultAddress: vault.VAULT,
    assetSymbol: vault.ASSETSYMBOL,
    price: data[vault.ASSET] ? data[vault.ASSET] : null,
  }));

  return prices;
};
// export async function FetchTokenPrices(denomination: string): Promise<TokenPrice[]> {
//   let data;

//   try {
//     const ids = COINGECKO_TICKERS.map(ticker => ticker.id).join(",");
//     const coingeckoUrl =
//     `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${denomination}`;

//     const response = await fetch(coingeckoUrl);

//     if (!response.ok) {
//       throw new Error("Failed to fetch from CoinGecko");
//     }

//     data = await response.json();
//   } catch (error) {
//     console.error("Error fetching token prices from CoinGecko:", error);
//     console.log("Fetching token prices from CoinMarketCap...");

//     const coinmarketcapSymbols = COINGECKO_TICKERS.map(ticker => ticker.symbol.toUpperCase()).join(",");
//     const coinmarketcapUrl =
//       `https://api.coinmarketcap.com/data/pricemulti?fsyms=${coinmarketcapSymbols}&tsyms=${denomination}`;

//     const response = await fetch(coinmarketcapUrl);
//     if (!response.ok) {
//       console.log("Failed to fetch token prices from CoinMarketCap");
//       return [];
//     }

//     data = await response.json();
//   }

//   // Construct the tokenPrices array
//   const tokenPrices: TokenPrice[] = COINGECKO_TICKERS.map(ticker => {
//     return {
//       symbol: ticker.symbol,
//       price: data[ticker.id] ? data[ticker.id][denomination] : data[ticker.symbol.toUpperCase()][denomination]
//     };
//   });

//   return tokenPrices;
// }

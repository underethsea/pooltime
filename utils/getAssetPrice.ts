// Types reflect the real /overview payload shape
interface PriceData {
  [chain: string]: {
    [address: string]: number;
  };
}

interface Prices {
  assets: PriceData;
  geckos: Record<string, number>;
  timestamp?: string;
}

interface OverviewResponse {
  prices: Prices;
  // pendingPrize exists too, but we don't need it here
}

export const GetAssetPrice = async (
  chainName: string,
  assetAddress: string
): Promise<number> => {
  const url = 'https://poolexplorer.xyz/overview';

  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error('Network response was not ok');

    const overview: OverviewResponse = await response.json();
    const prices = overview?.prices;
    if (!prices?.assets) return 0;

    // Normalize inputs
    const normalizedChainName = (chainName || '').toUpperCase();
    const normalizedAssetAddress = (assetAddress || '').toLowerCase();

    // Lookup (USD)
    const chainMap = prices.assets[normalizedChainName];
    if (chainMap && typeof chainMap[normalizedAssetAddress] === 'number') {
      return chainMap[normalizedAssetAddress];
    }

    return 0;
  } catch (error) {
    console.error('Error fetching price data:', error);
    return 0;
  }
};

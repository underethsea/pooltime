// import { CONFIG, ADDRESS } from "../constants/";
// import { FetchPriceForAsset } from "./tokenPrices";
// import { useOverview } from "../components/contextOverview";

async function fetchPromotions(): Promise<any> {
  try {
    const fetchUrl = "https://poolexplorer.xyz/twabrewards";
    const response = await fetch(fetchUrl);

    if (!response.ok) {
      throw new Error("failed to fetch twab rewards from api");
    }
    const result = await response.json();
    // console.log("OK result",result)
    return result;
  } catch (e) {
    console.log(e);
    return [];
  }
}

function calculateTokensPerSecond(
  tokensPerEpoch: string,
  epochDuration: string
): number {
  return parseInt(tokensPerEpoch) / parseInt(epochDuration);
}

// async function fetchPricesForTokens(tokenIds: string[]): Promise<Record<string, any>> {
//     if (tokenIds.length === 0) {
//         return {};
//     }
//     const url = `https://api.coingecko.com/api/v3/simple/price?ids=${tokenIds.join(',')}&vs_currencies=usd`;
//     const response = await fetch(url);
//     const prices: Record<string, any> = await response.json();
//     return prices;
// }

export async function GetActivePromotionsForVaults(
  vaults: any[],
  active = false,
  priceData: any
): Promise<any[]> {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const data = await fetchPromotions();
  // const overviewFromContext = useOverview();
  // let priceData
  // if(overviewFromContext.overview){ priceData = overviewFromContext.overview.prices}
  // const priceData :any = {"geckos":{"arbitrum":1.081,"tether":0.999225,"pooltogether":0.548429,"dai":0.999196,"usd-coin":0.999396,"weth":3797.04,"ethereum":3794.04,"optimism":2.46,"liquity-usd":0.998116,"wrapped-bitcoin":70660,"gemini-dollar":0.998934,"coinbase-wrapped-staked-eth":4065.75,"aerodrome-finance":1.046,"wrapped-steth":4432.35,"angle-usd":1.005},"assets":{"ARBITRUM":{"0x0000206329b97db379d5e1bf586bbdb969c63274":1.005,"0xcf934e2402a5e072928a39a956964eb8f2b5b79c":0.548429,"0xaf88d065e77c8cc2239327c5edb3a432268e5831":0.999396,"0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9":0.999225,"0x82af49447d8a07e3bd95bd0d56f35241523fbab1":3794.04,"0x912ce59144191c1204e64559fe8253a0e49e6548":1.081},"BASE":{"0xd652c5425aea2afd5fb142e120fecf79e18fafc3":0.548429,"0x833589fcd6edb6e08f4c7c32d4f71b54bda02913":0.999396,"0x940181a94a35a4569e4529a3cdfb74e38fd98631":1.046,"0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22":4065.75,"0xc1cba3fcea344f92d9239c08c0568f6f2f0ee452":4432.35},"OPTIMISM":{"0x0b2c639c533813f4aa9d7837caf62653d097ff85":0.999396,"0x395ae52bb17aef68c2888d941736a71dc6d4e125":0.548429,"0xda10009cbd5d07dd0cecc66161fc93d7c9000da1":0.999196,"0xc40f949f8a4e094d1b49a23ea9241d289b7b2819":0.998116,"0x4200000000000000000000000000000000000006":3794.04,"0x4200000000000000000000000000000000000042":2.46,"0xdb1fe6da83698885104da02a6e0b3b65c0b0de80":90.48609016447462},"BASESEPOLIA":{"0x71b271952c3335e7258fbdcae5cd3a57e76b5b51":0.548429,"0x82557c5157fcbeddd80ae09647ec018a0083a638":0.999196,"0xc88130e55db4a3ba162984d6efe4ff982bc0e227":0.999396,"0x41d7ddf285a08c74a4cb9fdc979c703b10c30ab1":3794.04,"0x431bf0fe8acb5c79c4f4fbc63f6de0756e928dd3":0.998934,"0x214e35ca60a828cc44fae2f2b97d37c116b02229":70660},"ARBSEPOLIA":{"0xe02919b18388c666297d24d56cb794c440d33245":0.548429,"0x837f6ec55793c49b2994ba703a3d2331649b09ea":0.999196,"0x45b32d0c3cf487e11c3b80af564878bea83cce67":0.999396,"0x1a586a874f7c6ca5c3220c434fb5096dde2ec3f0":3794.04}},"timestamp":"2024-06-07T02:44:54.139Z"}

  let allPromotions: any = [];

  // Iterate over each chain in the data
  for (const chain in data) {
    if (data.hasOwnProperty(chain) && data[chain].length > 0) {
      const promotions = data[chain];
      let lowercaseVaultAddresses = vaults.map((vault) => vault.toLowerCase());

      // Filter active promotions based on currentTimestamp and vault addresses
      const activePromotionsWithTokens = promotions.filter((promo: any) => {
        const promoStart = parseInt(promo.startTimestamp);
        const promoEnd =
          promoStart +
          parseInt(promo.epochDuration) * parseInt(promo.initialNumberOfEpochs);
        return (
          lowercaseVaultAddresses.includes(promo.vault.toLowerCase()) &&
          currentTimestamp >= promoStart &&
          (!active || currentTimestamp < promoEnd)
        ); // Add the condition for live here
      });

      // Filter promotions with valid prices from the new price data
      const validPromotionsWithPrices = activePromotionsWithTokens
        .map((promo: any) => {
          const price = priceData.assets[chain]?.[promo.token.toLowerCase()];
          if (price) {
            return {
              ...promo,
              tokenDecimals: promo.tokenDecimals,
              tokensPerSecond: calculateTokensPerSecond(
                promo.tokensPerEpoch,
                promo.epochDuration
              ),
              price: price,
              epochStartedAt: determineEpochStatus(currentTimestamp, promo),
              chain: chain, // Add chain information to the promotion
            };
          }
          return null;
        })
        .filter((promo: any) => promo !== null);

      allPromotions = allPromotions.concat(validPromotionsWithPrices);
    }
  }

  // Group promotions by vault addresses
  const promotionsByVault = vaults.reduce((acc, vaultAddress) => {
    const vaultPromotions = allPromotions.filter(
      (promo: any) => promo.vault.toLowerCase() === vaultAddress.toLowerCase()
    );
    if (vaultPromotions.length > 0) {
      acc[vaultAddress.toLowerCase()] = vaultPromotions;
    }
    return acc;
  }, {});
  // console.log("promotions by vault",promotionsByVault)
  return promotionsByVault;
}

// Helper function to determine the status of the epoch as a Unix timestamp
function determineEpochStatus(currentTimestamp: any, promo: any) {
  const promoStart = parseInt(promo.startTimestamp);
  const epochDuration = parseInt(promo.epochDuration);
  const promoEnd =
    promoStart + epochDuration * parseInt(promo.initialNumberOfEpochs);

  let currentEpochStart;
  // Check if the current epoch is the first epoch
  if (currentTimestamp < promoStart + epochDuration) {
    currentEpochStart = promoStart; // Return start timestamp for the first epoch
  } else if (currentTimestamp >= promoEnd) {
    currentEpochStart = promoEnd - epochDuration; // Return end timestamp if all epochs are finished
  } else {
    // Calculate the start of the current epoch
    const elapsed = currentTimestamp - promoStart;
    const currentEpochNumber = Math.floor(elapsed / epochDuration);
    currentEpochStart = promoStart + currentEpochNumber * epochDuration;
  }
  // console.log("determine status",promo,currentTimestamp,"epoch start",currentEpochStart)

  return currentEpochStart;
}

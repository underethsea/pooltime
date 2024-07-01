interface Addresses {
    [key: string]: ChainAddresses;
  }
  interface ChainAddresses {
    [key: string]: string}

export const TokenToGeckoId : Addresses = {"OPTIMISM":{
    '0x4200000000000000000000000000000000000042': 'optimism',
    '0x395ae52bb17aef68c2888d941736a71dc6d4e125': 'pooltogether',
    '0x0b2c639c533813f4aa9d7837caf62653d097ff85': 'usd-coin',
    '0xaf88d065e77c8cc2239327c5edb3a432268e5831': 'usd-coin'}
    // Add other mappings as needed
};
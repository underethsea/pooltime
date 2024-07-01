
interface TokenImageMapping {
    [symbol: string]: string;
  }
  
  const tokenImageMapping: TokenImageMapping = {
    gusd: "gusd.png",
    usdc: "usdc.png",
    dai: "dai.png",
    wbtc: "wbtc.png",
    eth: "eth.png",
    pool: "pool.png",
  };
  
  export function GetTokenImageFilename(tokenSymbol: string): string {
    const lowercaseSymbol = tokenSymbol.toLowerCase();
  
    for (const symbol in tokenImageMapping) {
      if (lowercaseSymbol.includes(symbol)) {
        return tokenImageMapping[symbol];
      }
    }
    return "default.png";
  }
import React, { useEffect, useState, useMemo, useRef } from "react";
import { ethers } from "ethers";
import { ABI, ADDRESS, PROVIDERS } from "../constants";
import Layout from "./index";
import { NumberWithCommas, CropDecimals } from "../utils/tokenMaths";
import { GetChainName } from "../utils/getChain";
import { useOverview } from "../components/contextOverview";
import { Multicall } from "../utils/multicall";
import ChainTag from "../components/chainTag";
import IconDisplay from "../components/icons";

interface LiquidationPairData {
  chainName: string;
  chainId: number;
  vaultAddress: string;
  liquidationPairAddress: string;
  vaultName: string;
  vaultSymbol: string;
  assetSymbol: string;
  assetAddress: string;
  decimals: number;
  maxOut: ethers.BigNumber;
  amountInRequired: ethers.BigNumber | null;
  tokenInPrice: number;
  tokenOutPrice: number;
  profitability: number;
  isProfitable: boolean;
}

interface ERC20Meta {
  address: string;
  symbol: string;
  decimals: number;
}

const LiquidationPairsPage: React.FC = () => {
  const [pairsData, setPairsData] = useState<LiquidationPairData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);
  
  const overviewFromContext = useOverview();

  // Helper function to load ERC20 metadata
  const loadERC20Meta = async (
    provider: ethers.providers.Provider,
    address: string
  ): Promise<ERC20Meta> => {
    const erc = new ethers.Contract(address, ABI.ERC20 as any, provider);
    const [symbol, decimals] = await Promise.all([
      erc.symbol().catch(() => "TKN"),
      erc.decimals().catch(() => 18),
    ]);
    return { address, symbol: String(symbol), decimals: Number(decimals) };
  };

  // Helper function to get token price from context
  const getTokenPrice = (chainName: string, tokenAddress: string): number => {
    if (!overviewFromContext?.overview?.prices?.assets?.[chainName]) {
      return 0;
    }
    return overviewFromContext.overview.prices.assets[chainName][tokenAddress.toLowerCase()] || 0;
  };

  // Helper function to get prize token price
  const getPrizeTokenPrice = (chainName: string): number => {
    const prizeTokenGecko = ADDRESS[chainName]?.PRIZETOKEN?.GECKO;
    if (!prizeTokenGecko || !overviewFromContext?.overview?.prices?.geckos) {
      return 0;
    }
    return overviewFromContext.overview.prices.geckos[prizeTokenGecko] || 0;
  };

  // Main function to fetch all liquidation pairs data
  const fetchLiquidationPairsData = async () => {
    console.log("🚀 Starting liquidation pairs data fetch...");
    setLoading(true);
    setError(null);
    
    try {
      const allPairsData: LiquidationPairData[] = [];
      const chainNames = Object.keys(ADDRESS);
      
      // STEP 1: Collect ALL liquidation pairs from ALL chains
      const allLiquidationPairs: Array<{
        chainName: string;
        chainConfig: any;
        vault: any;
        contract: ethers.Contract;
      }> = [];
      
      for (const chainName of chainNames) {
        const chainConfig = ADDRESS[chainName];
        if (!chainConfig?.VAULTS || !PROVIDERS[chainName]) continue;
        
        const provider = PROVIDERS[chainName];
        const vaults = chainConfig.VAULTS;
        
        // Filter vaults that have liquidation pairs
        const vaultsWithPairs = vaults.filter(vault => 
          vault.LIQUIDATIONPAIR && 
          vault.LIQUIDATIONPAIR !== "0x0000000000000000000000000000000000000000"
        );
        
        // Add to global list
        vaultsWithPairs.forEach(vault => {
          const contract = new ethers.Contract(vault.LIQUIDATIONPAIR, ABI.LIQUIDATIONPAIR as any, provider);
          allLiquidationPairs.push({ chainName, chainConfig, vault, contract });
        });
      }
      
      if (allLiquidationPairs.length === 0) {
        setPairsData([]);
        return;
      }
      
      // STEP 2: Call 1 - Get maxAmountOut for ALL pairs in parallel
      console.log(`Making Call 1: ${allLiquidationPairs.length} maxAmountOut calls across all chains`);
      const maxOutCalls = allLiquidationPairs.map(({ contract }) => 
        contract.callStatic.maxAmountOut().catch(() => ethers.BigNumber.from(0))
      );
      
      const maxOuts = await Promise.all(maxOutCalls);
      
      // STEP 3: Filter pairs with maxOut > 0
      const pairsWithMaxOut = allLiquidationPairs
        .map((pair, index) => ({ ...pair, maxOut: maxOuts[index] }))
        .filter(({ maxOut }) => !maxOut.eq(0));
      
      if (pairsWithMaxOut.length === 0) {
        setPairsData([]);
        return;
      }
      
      // STEP 4: Call 2 - Get computeExactAmountIn for pairs with maxOut > 0
      console.log(`Making Call 2: ${pairsWithMaxOut.length} computeExactAmountIn calls`);
      const computeCalls = pairsWithMaxOut.map(({ contract, maxOut }) => 
        contract.callStatic.computeExactAmountIn(maxOut).catch(() => null)
      );
      
      const amountsIn = await Promise.all(computeCalls);
      
      // STEP 5: Batch token metadata calls to minimize RPC calls
      const tokenMetadataCache = new Map<string, ERC20Meta>();
      const uniqueTokens = new Set<string>();
      
      // Collect all unique token addresses
      pairsWithMaxOut.forEach(({ chainName, chainConfig, vault }) => {
        uniqueTokens.add(`${chainName}-${chainConfig.PRIZETOKEN.ADDRESS}`);
        uniqueTokens.add(`${chainName}-${vault.ASSET}`);
      });
      
      // Batch load all token metadata
      console.log(`Making Call 3: ${uniqueTokens.size} token metadata calls (batched)`);
      const tokenMetadataPromises = Array.from(uniqueTokens).map(async (tokenKey) => {
        const [chainName, tokenAddress] = tokenKey.split('-');
        const metadata = await loadERC20Meta(PROVIDERS[chainName], tokenAddress);
        return { tokenKey, metadata };
      });
      
      const tokenMetadataResults = await Promise.all(tokenMetadataPromises);
      tokenMetadataResults.forEach(({ tokenKey, metadata }) => {
        tokenMetadataCache.set(tokenKey, metadata);
      });
      
      // STEP 6: Process results and calculate profitability using context prices
      const pairsData: LiquidationPairData[] = [];
      
      for (let i = 0; i < pairsWithMaxOut.length; i++) {
        const { chainName, chainConfig, vault, contract, maxOut } = pairsWithMaxOut[i];
        const amountInRequired = amountsIn[i];
        
        try {
          // Get token metadata from cache
          const prizeTokenMeta = tokenMetadataCache.get(`${chainName}-${chainConfig.PRIZETOKEN.ADDRESS}`)!;
          const assetMeta = tokenMetadataCache.get(`${chainName}-${vault.ASSET}`)!;
          
          // Get prices from context
          const tokenInPrice = getPrizeTokenPrice(chainName) || 0;
          const tokenOutPrice = getTokenPrice(chainName, vault.ASSET) || 0;
          
          // Calculate profitability
          let profitability = 0;
          let isProfitable = false;
          
          if (amountInRequired && tokenInPrice > 0 && tokenOutPrice > 0) {
            const amountInTokens = Number(ethers.utils.formatUnits(amountInRequired, prizeTokenMeta.decimals));
            const amountOutTokens = Number(ethers.utils.formatUnits(maxOut, assetMeta.decimals));
            
            const valueInUSD = amountInTokens * tokenInPrice;
            const valueOutUSD = amountOutTokens * tokenOutPrice;
            
            profitability = valueOutUSD - valueInUSD;
            isProfitable = valueOutUSD >= valueInUSD;
          }
          
          pairsData.push({
            chainName,
            chainId: chainConfig.CHAINID,
            vaultAddress: vault.VAULT,
            liquidationPairAddress: vault.LIQUIDATIONPAIR,
            vaultName: vault.NAME,
            vaultSymbol: vault.SYMBOL,
            assetSymbol: vault.ASSETSYMBOL,
            assetAddress: vault.ASSET,
            decimals: assetMeta.decimals,
            maxOut,
            amountInRequired,
            tokenInPrice,
            tokenOutPrice,
            profitability,
            isProfitable,
          });
          
        } catch (err) {
          console.warn(`Failed to process vault ${vault.VAULT}:`, err);
        }
      }
      
      // Sort by profitability (most profitable first)
      pairsData.sort((a, b) => b.profitability - a.profitability);
      setPairsData(pairsData);
      
      
    } catch (err) {
      console.error("Error fetching liquidation pairs data:", err);
      setError("Failed to load liquidation pairs data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch once when overview is available
    if (!hasFetched.current && overviewFromContext?.overview) {
      hasFetched.current = true;
      fetchLiquidationPairsData();
    }
  }, [overviewFromContext?.overview]);

  const formatAmount = (amount: ethers.BigNumber, decimals: number): string => {
    return NumberWithCommas(CropDecimals(ethers.utils.formatUnits(amount, decimals)));
  };

  const formatUSD = (amount: number): string => {
    return `$${NumberWithCommas(CropDecimals(amount.toFixed(2)))}`;
  };

  // Format pricing timestamp for display
  const pricingTimestamp = useMemo(() => {
    if (!overviewFromContext?.overview?.prices?.timestamp) return null;
    try {
      const date = new Date(overviewFromContext.overview.prices.timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return null;
    }
  }, [overviewFromContext?.overview?.prices?.timestamp]);

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div className="spinner-large" />
          <p style={{ color: "#fff", fontSize: "16px", marginTop: "20px" }}>Loading liquidation pairs...</p>
          <p style={{ color: "#ccc", fontSize: "12px", marginTop: "10px" }}>
            Fetching data from all chains and calculating profitability
          </p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "red" }}>{error}</p>
          <button onClick={fetchLiquidationPairsData}>Retry</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        <div style={{ marginBottom: "30px", textAlign: "center" }}>
          <h1 style={{ 
            color: "#f0f9fa",
            fontSize: "3rem",
            textAlign: "center",
            marginTop: "20px",
            textTransform: "uppercase",
            letterSpacing: "3px",
            textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)",
            marginBottom: "20px"
          }}
          className="hidden-mobile">
            Liquidation Pairs
          </h1>
          <h1 style={{ 
            color: "#f0f9fa",
            fontSize: "2rem",
            textAlign: "center",
            marginTop: "20px",
            textTransform: "uppercase",
            letterSpacing: "2px",
            textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)",
            marginBottom: "20px"
          }}
          className="hidden-desktop">
            Liquidation Pairs
          </h1>
        </div>
        
        <div style={{ marginBottom: "20px", textAlign: "center" }}>
          <p style={{ color: "#fff", fontSize: "14px" }} className="hidden-mobile">
            Showing all liquidation pairs with available maxOut across all chains ({pairsData.length} pairs found)
          </p>
          <p style={{ color: "#fff", fontSize: "12px" }} className="hidden-desktop">
            {pairsData.length} pairs found
          </p>
          {pricingTimestamp && (
            <p style={{ color: "#ccc", fontSize: "12px", marginTop: "5px" }}>
              Prices updated {pricingTimestamp}
            </p>
          )}
          <p style={{ color: "#f24444", fontSize: "12px", marginTop: "10px", fontWeight: "bold" }}>
            This application is for expert operators only, use at your own risk.
          </p>
        </div>

        {pairsData.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p style={{ color: "#fff" }}>No liquidation pairs with available maxOut found.</p>
          </div>
        ) : (
          <>
          <div style={{ 
            backgroundColor: "#ecf0f6", 
            borderRadius: "12px", 
            padding: "20px",
            overflowX: "auto"
          }}
          className="hidden-mobile">
            {/* Header */}
            <div className="vault-table-header-row" style={{ 
              display: "grid", 
              gridTemplateColumns: "auto 2fr 1fr 1fr 1fr 1fr 1fr",
              gap: "6px",
              padding: "12px",
            }}>
              <div></div>
              <div>Asset</div>
              <div style={{ textAlign: "right" }}>Max Out</div>
              <div style={{ textAlign: "right" }}>Amount In</div>
              <div style={{ textAlign: "right" }}>Value Out</div>
              <div style={{ textAlign: "right" }}>Value In</div>
              <div style={{ textAlign: "right" }}>Profitability</div>
            </div>
            
            {/* Rows */}
            {pairsData.map((pair, index) => {
              const amountInTokens = pair.amountInRequired 
                ? Number(ethers.utils.formatUnits(pair.amountInRequired, 18)) // Prize tokens are typically 18 decimals
                : 0;
              const amountOutTokens = Number(ethers.utils.formatUnits(pair.maxOut, pair.decimals));
              
              const valueInUSD = amountInTokens * pair.tokenInPrice;
              const valueOutUSD = amountOutTokens * pair.tokenOutPrice;
              
              return (
                <div 
                  key={`${pair.chainName}-${pair.vaultAddress}`}
                  style={{ 
                    display: "grid", 
                    gridTemplateColumns: "auto 2fr 1fr 1fr 1fr 1fr 1fr",
                    gap: "6px",
                    backgroundColor: "white",
                    borderRadius: "20px",
                    padding: "12px",
                    marginBottom: "16px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, .1)",
                    cursor: "pointer",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease"
                  }}
                  onClick={() => window.open(`/liquidate?chain=${pair.chainId}&pair=${pair.liquidationPairAddress}`, '_blank')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 12px rgba(0, 0, 0, .15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 0, 0, .1)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", marginRight: "-8px", marginBottom: "10px" }}>
                    <ChainTag chainId={pair.chainId} horizontal={false} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "40px", display: "flex", alignItems: "center", justifyContent: "flex-start" }}>
                        <IconDisplay name={pair.assetSymbol} size={20} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "bold", color: "#173d5a", fontSize: "15px" }}>{pair.vaultName}</div>
                        <div style={{ fontSize: "14px", color: "#666" }}>
                          {pair.assetSymbol}
                        </div>
                        <div style={{ fontSize: "12px", color: "#888" }}>
                          <a 
                            href={`/liquidate?chain=${pair.chainId}&pair=${pair.liquidationPairAddress}`}
                            style={{ color: "#007bff", textDecoration: "none" }}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Liquidate →
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", color: "#173d5a", fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                    {formatAmount(pair.maxOut, pair.decimals)} {pair.assetSymbol}
                  </div>
                  <div style={{ textAlign: "right", color: "#173d5a", fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                    {pair.amountInRequired ? (
                      <div>{formatAmount(pair.amountInRequired, 18)} PRIZE</div>
                    ) : (
                      <span style={{ color: "#999" }}>N/A</span>
                    )}
                  </div>
                  <div style={{ textAlign: "right", color: "#173d5a", fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                    {formatUSD(valueOutUSD)}
                  </div>
                  <div style={{ textAlign: "right", color: "#173d5a", fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                    {formatUSD(valueInUSD)}
                  </div>
                  <div style={{ 
                    textAlign: "right",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end"
                  }}>
                    <div style={{ 
                      color: pair.isProfitable ? "#28a745" : "#dc3545",
                      fontWeight: "bold",
                      fontSize: "15px"
                    }}>
                      {pair.profitability >= 0 ? "+" : ""}{formatUSD(pair.profitability)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Mobile Layout */}
          <div className="hidden-desktop" style={{ 
            backgroundColor: "#ecf0f6", 
            borderRadius: "12px", 
            padding: "15px"
          }}>
            {pairsData.map((pair, index) => {
              const amountInTokens = pair.amountInRequired 
                ? Number(ethers.utils.formatUnits(pair.amountInRequired, 18))
                : 0;
              const amountOutTokens = Number(ethers.utils.formatUnits(pair.maxOut, pair.decimals));
              
              const valueInUSD = amountInTokens * pair.tokenInPrice;
              const valueOutUSD = amountOutTokens * pair.tokenOutPrice;
              
              return (
                <div 
                  key={`${pair.chainName}-${pair.vaultAddress}`}
                  style={{ 
                    backgroundColor: "white",
                    borderRadius: "16px",
                    padding: "16px",
                    marginBottom: "12px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, .1)",
                    cursor: "pointer",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease"
                  }}
                  onClick={() => window.open(`/liquidate?chain=${pair.chainId}&pair=${pair.liquidationPairAddress}`, '_blank')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 12px rgba(0, 0, 0, .15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 0, 0, .1)";
                  }}
                >
                  {/* Mobile Header */}
                  <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
                    <ChainTag chainId={pair.chainId} horizontal={false} />
                    <div style={{ marginLeft: "-15px", flex: 1, display: "flex", alignItems: "center", gap: "4px" }}>
                      <IconDisplay name={pair.assetSymbol} size={16} />
                      <div>
                        <div style={{ fontWeight: "bold", color: "#173d5a", fontSize: "14px" }}>
                          {pair.vaultName}
                        </div>
                        <div style={{ fontSize: "12px", color: "#666" }}>
                          {pair.assetSymbol}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Mobile Data Grid */}
                  <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "1fr 1fr",
                    gap: "8px",
                    fontSize: "12px",
                    marginTop: "20px",
                    textAlign: "center"
                  }}>
                    <div>
                      <div style={{ color: "#666", marginBottom: "2px" }}>Max Out</div>
                      <div style={{ color: "#173d5a", fontWeight: "500" }}>
                        {formatAmount(pair.maxOut, pair.decimals)} {pair.assetSymbol}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: "#666", marginBottom: "2px" }}>Amount In</div>
                      <div style={{ color: "#173d5a", fontWeight: "500" }}>
                        {pair.amountInRequired ? (
                          formatAmount(pair.amountInRequired, 18) + " PRIZE"
                        ) : (
                          <span style={{ color: "#999" }}>N/A</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: "#666", marginBottom: "2px" }}>Value Out</div>
                      <div style={{ color: "#173d5a", fontWeight: "500" }}>
                        {formatUSD(valueOutUSD)}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: "#666", marginBottom: "2px" }}>Value In</div>
                      <div style={{ color: "#173d5a", fontWeight: "500" }}>
                        {formatUSD(valueInUSD)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Mobile Profitability and Action */}
                  <div style={{ 
                    textAlign: "center", 
                    marginTop: "16px",
                    padding: "8px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "8px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <div style={{ 
                      color: pair.isProfitable ? "#28a745" : "#dc3545",
                      fontWeight: "bold",
                      fontSize: "14px",
                      marginLeft: "8px"
                    }}>
                      {pair.profitability >= 0 ? "+" : ""}{formatUSD(pair.profitability)}
                    </div>
                    <a 
                      href={`/liquidate?chain=${pair.chainId}&pair=${pair.liquidationPairAddress}`}
                      style={{ 
                        color: "#007bff", 
                        textDecoration: "none",
                        fontSize: "12px",
                        fontWeight: "500",
                        marginRight: "8px"
                      }}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Liquidate →
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default LiquidationPairsPage;

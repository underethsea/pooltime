import React from "react";
import { ethers } from "ethers";
import Image from "next/image";
import { CropDecimals } from "../utils/tokenMaths";
import { GetChainName } from "../utils/getChain";
import PrizeValueIcon from "./prizeValueIcon";
import PrizeValue from "./prizeValue";
import PrizeDistributionBar from "./prizeDistributionBar";
import { useOverview } from "./contextOverview";

interface Chance {
  winsPerDraw7d: number;
  winsPerDraw30d: number;
  sevenDrawVaultPortion: number;
  tiers: Tier[];
}

interface Tier {
  odds: number;
  duration: number;
  vaultPortion: number;
}

interface VaultData {
  userVaultBalance: ethers.BigNumber;
  totalAssets: ethers.BigNumber;
  assetSymbol: string;
}

interface VaultChanceInfoProps {
  chance: Chance | null;
  vaultData: VaultData | null;
  activeVaultChain: number | null | undefined;
  userWinChance: number | null | undefined;
  overviewFromContext: any;
  isModal?: boolean;
}

const VaultChanceInfo: React.FC<VaultChanceInfoProps> = ({
  chance,
  vaultData,
  activeVaultChain,
  userWinChance,
  overviewFromContext,
  isModal,
}) => {
  if (
    !vaultData ||
    !activeVaultChain ||
    !overviewFromContext?.overview?.pendingPrize
  ) {
    return null;
  }

  const chainId = activeVaultChain; // Now we know it's defined
  const hasBalance = vaultData && vaultData.userVaultBalance.gt(0);
  const chainName = GetChainName(chainId);
  const tierData =
    overviewFromContext.overview.pendingPrize[chainName]?.prizes?.tierData;

  // If user has no balance, show available prizes regardless of chance data
  if (!hasBalance && tierData) {
    // Filter out last 2 tiers (canaries) to match chances vault behavior
    const filteredTierData = tierData.slice(0, tierData.length - 2);

    // Separate jackpot from other tiers
    const jackpotTier = filteredTierData[0];
    const otherTiers = filteredTierData.slice(1);

    // Get draw period for duration calculation
    const drawPeriodSeconds =
      overviewFromContext.overview.pendingPrize[chainName]?.prizes
        ?.drawPeriodSeconds || 86400; // Default to 1 day

    // Get duration from chance data if available, otherwise return null
    const getDuration = (tierIndex: number) => {
      if (chance && (chance as any).tiers && (chance as any).tiers[tierIndex]) {
        const duration = (chance as any).tiers[tierIndex].duration;
        // Duration from API is in "draws", convert to days
        const durationInDays = Math.round(
          (duration * drawPeriodSeconds) / 86400
        );
        return durationInDays;
      }
      // No fallback - return null if no API data
      return null;
    };

    return (
      <div className="vault-chance-info available-prizes-layout">
        {/* Jackpot - Special center box */}
        {jackpotTier && jackpotTier.value > 0 && (
          <div className="jackpot-container">
            <div className="jackpot-card">
              <div className="jackpot-duration">
                {(() => {
                  const jackpotDuration = getDuration(0);
                  return jackpotDuration ? `${jackpotDuration}d` : "";
                })()}
              </div>
              <div className="jackpot-header">
                <div className="prize-value-container jackpot-value">
                  <PrizeValueIcon size={24} chainname={chainName} />
                  <PrizeValue
                    amount={BigInt((1e18 * jackpotTier.value).toFixed(0))}
                    size={24}
                    chainname={chainName}
                  />
                </div>
                <div className="jackpot-label">Jackpot</div>
              </div>
            </div>
          </div>
        )}

        {/* Prize Distribution Bar */}
        <PrizeDistributionBar
          tierData={tierData}
          chainName={chainName}
          isModal={isModal}
          chance={chance}
          overviewFromContext={overviewFromContext}
        />

        {/* Other tiers - 2x2 grid */}
        {otherTiers.length > 0 && (
          <div className="other-tiers-grid">
            {otherTiers.map((tier: any, index: number) => {
              if (tier.value > 0) {
                // Get duration from API data
                const durationDays = getDuration(index + 1);

                return (
                  <div
                    className={`prize-card tier-${index + 1}`}
                    key={index + 1}>
                    <div className="prize-card-header">
                      <div className="prize-value-container">
                        <PrizeValueIcon size={18} chainname={chainName} />
                        <PrizeValue
                          amount={BigInt((1e18 * tier.value).toFixed(0))}
                          size={18}
                          chainname={chainName}
                        />
                      </div>
                      <div className="prize-duration">
                        {durationDays ? `${durationDays}d` : ""}
                      </div>
                    </div>
                    <div className="prize-count-badge">
                      {tier.count} prize{tier.count !== 1 ? "s" : ""}
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>
        )}
      </div>
    );
  }

  // If no chance data but we have tier data, show available prizes
  if (!chance && tierData) {
    // Filter out last 2 tiers (canaries) to match chances vault behavior
    const filteredTierData = tierData.slice(0, tierData.length - 2);

    // Separate jackpot from other tiers
    const jackpotTier = filteredTierData[0];
    const otherTiers = filteredTierData.slice(1);

    // Get draw period for duration calculation
    const drawPeriodSeconds =
      overviewFromContext.overview.pendingPrize[chainName]?.prizes
        ?.drawPeriodSeconds || 86400; // Default to 1 day

    // Get duration from chance data if available, otherwise return null
    const getDuration = (tierIndex: number) => {
      if (chance && (chance as any).tiers && (chance as any).tiers[tierIndex]) {
        const duration = (chance as any).tiers[tierIndex].duration;
        // Duration from API is in "draws", convert to days
        const durationInDays = Math.round(
          (duration * drawPeriodSeconds) / 86400
        );
        return durationInDays;
      }
      // No fallback - return null if no API data
      return null;
    };

    return (
      <div className="vault-chance-info available-prizes-layout">
        {/* Jackpot - Special center box */}
        {jackpotTier && jackpotTier.value > 0 && (
          <div className="jackpot-container">
            <div className="jackpot-card">
              <div className="jackpot-duration">
                {(() => {
                  const jackpotDuration = getDuration(0);
                  return jackpotDuration ? `${jackpotDuration}d` : "";
                })()}
              </div>
              <div className="jackpot-header">
                <div className="prize-value-container jackpot-value">
                  <PrizeValueIcon size={24} chainname={chainName} />
                  <PrizeValue
                    amount={BigInt((1e18 * jackpotTier.value).toFixed(0))}
                    size={24}
                    chainname={chainName}
                  />
                </div>
                <div className="jackpot-label">Jackpot</div>
              </div>
            </div>
          </div>
        )}

        {/* Prize Distribution Bar */}
        <PrizeDistributionBar
          tierData={tierData}
          chainName={chainName}
          isModal={isModal}
          chance={chance}
          overviewFromContext={overviewFromContext}
        />

        {/* Other tiers - 2x2 grid */}
        {otherTiers.length > 0 && (
          <div className="other-tiers-grid">
            {otherTiers.map((tier: any, index: number) => {
              if (tier.value > 0) {
                // Get duration from API data
                const durationDays = getDuration(index + 1);

                return (
                  <div
                    className={`prize-card tier-${index + 1}`}
                    key={index + 1}>
                    <div className="prize-card-header">
                      <div className="prize-value-container">
                        <PrizeValueIcon size={18} chainname={chainName} />
                        <PrizeValue
                          amount={BigInt((1e18 * tier.value).toFixed(0))}
                          size={18}
                          chainname={chainName}
                        />
                      </div>
                      <div className="prize-duration">
                        {durationDays ? `${durationDays}d` : ""}
                      </div>
                    </div>
                    <div className="prize-count-badge">
                      {tier.count} prize{tier.count !== 1 ? "s" : ""}
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>
        )}
      </div>
    );
  }

  // Original logic for when we have chance data
  if (!chance) {
    return null;
  }

  return (
    <div className="vault-chance-info">
      {/* Win frequency info */}
      {hasBalance && userWinChance && userWinChance !== null && (
        <div className="win-frequency-info">
          <p>
            On average you will win{" "}
            {userWinChance === 1 ? (
              <>every day</>
            ) : (
              <>
                every {userWinChance.toFixed(0)} day
                {userWinChance !== 1 ? "s" : ""}
              </>
            )}
            &nbsp;
            {chance &&
              (chance.winsPerDraw7d ||
                chance.winsPerDraw30d ||
                chance.sevenDrawVaultPortion) && (
                <div className="tooltipContainer">
                  <Image
                    src="/images/moreInfo.svg"
                    alt="i"
                    width={16}
                    height={16}
                  />
                  <span className="tooltipText">
                    {chance.winsPerDraw30d && chance.winsPerDraw30d > 0
                      ? chance.winsPerDraw30d.toFixed(0)
                      : chance.winsPerDraw7d.toFixed(0)}{" "}
                    prizes per draw
                    <br />
                    {(chance?.sevenDrawVaultPortion * 100).toFixed(1)}
                    % vault portion
                    <br />
                    {(
                      100 *
                      (Number(vaultData.userVaultBalance) /
                        Number(vaultData.totalAssets))
                    ).toFixed(1)}
                    % your portion
                  </span>
                </div>
              )}
          </p>
        </div>
      )}

      {/* Prize Tiers */}
      {chance.tiers?.map((tier, index) => {
        if (tier.odds > 0 && tier.odds !== Infinity) {
          const tierData =
            overviewFromContext?.overview?.pendingPrize?.[GetChainName(chainId)]
              ?.prizes?.tierData?.[index];
          if (!tierData) return null;

          // Prize counts per tier (fixed ladder is OK)
          const prizeCountsPerTier = [
            1, 4, 16, 64, 256, 1024, 4096, 16384, 65536,
          ];
          const prizeCount = prizeCountsPerTier[index] || 1;

          // ---- helpers (inline) ----
          const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
          const ratioBN = (
            num: ethers.BigNumber,
            den: ethers.BigNumber
          ): number => {
            if (!den || den.isZero()) return 0;
            const SCALE = ethers.BigNumber.from("1000000000"); // 1e9
            return Number(num.mul(SCALE).div(den).toString()) / 1e9;
          };
          // If tier.vaultPortion is 1e18-scaled, normalize; if it’s already 0..1 this leaves it alone
          const normalizeVaultPortion = (vp: number) =>
            vp > 1 ? vp / 1e18 : vp;
          // --------------------------

          // BN-safe user share
          const userPortion = ratioBN(
            vaultData.userVaultBalance,
            vaultData.totalAssets
          );
          const vaultPortion = normalizeVaultPortion(tier.vaultPortion);

          // Per-prize hit prob and “at least one” probability
          const p_share = clamp01(userPortion * vaultPortion);
          const p_win = 1 - Math.pow(1 - p_share, prizeCount);

          // one-in-X figures
          const projectedOneInX = p_win > 0 ? 1 / p_win : Infinity;

          // If API sent a bogus <1 number, fall back to our computed value
          const apiOneInX = tier.odds;
          const currentOneInX =
            Number.isFinite(apiOneInX) && apiOneInX >= 1
              ? apiOneInX
              : projectedOneInX;

          // progress bar improvement
          const improvementPct =
            isFinite(projectedOneInX) &&
            isFinite(currentOneInX) &&
            currentOneInX > 0
              ? Math.min((currentOneInX / projectedOneInX) * 100, 100)
              : 0;

          return (
            <div className="chance-progress" key={index}>
              <div className="chance-header">
                <div className="prize-value-container">
                  <PrizeValueIcon size={15} chainname={GetChainName(chainId)} />
                  <PrizeValue
                    amount={BigInt((1e18 * tierData.value).toFixed(0))}
                    size={15}
                    chainname={GetChainName(chainId)}
                  />
                </div>
                <span className="prize-name">
                  {index === 0 ? "Jackpot" : "Prize"} (
                  {tier.duration.toString()}d)
                </span>
              </div>

              {hasBalance ? (
                <>
                  <div className="progress-bar-container">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${improvementPct}%` }}
                      />
                    </div>
                  </div>
                  <div className="chance-stats">
                    <span className="chance-stat">
                      Current 1 in {CropDecimals(currentOneInX, true)}
                    </span>
                    <span className="chance-stat">
                      Projected 1 in {CropDecimals(projectedOneInX, true)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="prize-info">
                  <span className="prize-count">
                    {tierData.count} prize{tierData.count !== 1 ? "s" : ""}{" "}
                    available
                  </span>
                </div>
              )}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};

export default VaultChanceInfo;

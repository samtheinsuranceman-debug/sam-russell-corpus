/**
 * SISTER INVENTION SI-018: Dynamic Commission Optimization Router
 * Patent Reference: Extends PAT-015 (Practice Management Platform)
 * 
 * Models product placement across carriers to maximize advisor
 * compensation while maintaining client suitability.
 */

export interface ProductPlacement {
  productType: "iul" | "fia" | "myga" | "term" | "whole_life" | "ltc" | "disability" | "annuity";
  carrier: string;
  premium: number;
  firstYearCommission: number;    // As %
  renewalCommission: number;      // As %
  renewalYears: number;
  bonusThreshold: number;         // Premium volume for bonus
  bonusRate: number;              // Additional % above threshold
  suitabilityScore: number;       // 0-100 for this client
  persistencyRequirement: number; // Months policy must stay in force
}

export interface ClientProfile {
  age: number;
  income: number;
  netWorth: number;
  riskTolerance: "conservative" | "moderate" | "aggressive";
  needs: string[];
  existingProducts: string[];
}

export interface OptimizedPlacement {
  product: ProductPlacement;
  firstYearEarnings: number;
  totalEarnings10Year: number;
  suitabilityRating: string;
  complianceFlags: string[];
  rank: number;
}

export interface CommissionOptResult {
  placements: OptimizedPlacement[];
  totalFirstYearCommission: number;
  total10YearCommission: number;
  avgSuitabilityScore: number;
  complianceStatus: "clear" | "review" | "flag";
  recommendations: string[];
  volumeBonusOpportunities: VolumeBonusOpp[];
}

export interface VolumeBonusOpp {
  carrier: string;
  currentVolume: number;
  thresholdVolume: number;
  additionalPremiumNeeded: number;
  bonusEarnings: number;
  roi: number;
}

/**
 * Optimize commission placement while maintaining suitability
 */
export function optimizeCommissions(
  products: ProductPlacement[],
  client: ClientProfile
): CommissionOptResult {
  // Score each product
  const scored = products.map(product => {
    const firstYearEarnings = product.premium * product.firstYearCommission;
    const renewalEarnings = product.premium * product.renewalCommission * product.renewalYears;
    const total10Year = firstYearEarnings + renewalEarnings;

    // Suitability check
    const flags: string[] = [];
    let suitability = product.suitabilityScore;

    // Age-based suitability
    if (client.age > 70 && product.productType === "iul") {
      suitability -= 15;
      flags.push("Age concern: IUL may not be suitable for clients over 70");
    }
    if (client.age < 30 && product.productType === "ltc") {
      suitability -= 10;
      flags.push("Age concern: LTC may be premature for clients under 30");
    }

    // Risk tolerance alignment
    if (client.riskTolerance === "conservative" && product.productType === "iul") {
      suitability -= 5;
    }
    if (client.riskTolerance === "aggressive" && product.productType === "myga") {
      suitability -= 5;
    }

    // Premium-to-income ratio
    const premiumRatio = product.premium / Math.max(client.income, 1);
    if (premiumRatio > 0.15) {
      suitability -= 10;
      flags.push(`Premium exceeds 15% of income ($${product.premium.toLocaleString()} / $${client.income.toLocaleString()})`);
    }

    // Needs alignment
    if (client.needs.includes("retirement_income") && ["fia", "myga", "annuity"].includes(product.productType)) {
      suitability += 10;
    }
    if (client.needs.includes("death_benefit") && ["iul", "whole_life", "term"].includes(product.productType)) {
      suitability += 10;
    }

    suitability = Math.max(0, Math.min(100, suitability));

    const rating = suitability >= 80 ? "Excellent" : suitability >= 60 ? "Good" : suitability >= 40 ? "Fair" : "Poor";

    return {
      product,
      firstYearEarnings: Math.round(firstYearEarnings),
      totalEarnings10Year: Math.round(total10Year),
      suitabilityRating: rating,
      complianceFlags: flags,
      rank: 0,
    };
  });

  // Rank by combined score (60% suitability + 40% earnings)
  scored.sort((a, b) => {
    const scoreA = a.product.suitabilityScore * 0.6 + (a.totalEarnings10Year / 10000) * 0.4;
    const scoreB = b.product.suitabilityScore * 0.6 + (b.totalEarnings10Year / 10000) * 0.4;
    return scoreB - scoreA;
  });
  scored.forEach((s, i) => s.rank = i + 1);

  const totalFY = scored.reduce((s, p) => s + p.firstYearEarnings, 0);
  const total10Y = scored.reduce((s, p) => s + p.totalEarnings10Year, 0);
  const avgSuit = scored.reduce((s, p) => s + p.product.suitabilityScore, 0) / Math.max(scored.length, 1);

  // Volume bonus opportunities
  const carrierVolumes: Record<string, number> = {};
  products.forEach(p => {
    carrierVolumes[p.carrier] = (carrierVolumes[p.carrier] ?? 0) + p.premium;
  });

  const volumeBonuses: VolumeBonusOpp[] = products
    .filter(p => p.bonusThreshold > 0)
    .reduce((acc: VolumeBonusOpp[], p) => {
      const current = carrierVolumes[p.carrier] ?? 0;
      if (current < p.bonusThreshold && !acc.find(a => a.carrier === p.carrier)) {
        const needed = p.bonusThreshold - current;
        const bonusEarnings = p.bonusThreshold * p.bonusRate;
        acc.push({
          carrier: p.carrier,
          currentVolume: current,
          thresholdVolume: p.bonusThreshold,
          additionalPremiumNeeded: needed,
          bonusEarnings: Math.round(bonusEarnings),
          roi: needed > 0 ? Math.round((bonusEarnings / needed) * 100) : 0,
        });
      }
      return acc;
    }, []);

  const hasFlags = scored.some(s => s.complianceFlags.length > 0);
  const hasPoorSuitability = scored.some(s => s.product.suitabilityScore < 40);

  const recommendations: string[] = [];
  if (volumeBonuses.length > 0) {
    const bestBonus = volumeBonuses.sort((a, b) => b.roi - a.roi)[0];
    recommendations.push(`Volume bonus opportunity: $${bestBonus.additionalPremiumNeeded.toLocaleString()} more with ${bestBonus.carrier} unlocks $${bestBonus.bonusEarnings.toLocaleString()} bonus`);
  }
  if (hasPoorSuitability) {
    recommendations.push("Review low-suitability placements — consider alternative products");
  }
  recommendations.push(`Total 10-year commission projection: $${total10Y.toLocaleString()}`);

  return {
    placements: scored,
    totalFirstYearCommission: totalFY,
    total10YearCommission: total10Y,
    avgSuitabilityScore: Math.round(avgSuit),
    complianceStatus: hasPoorSuitability ? "flag" : hasFlags ? "review" : "clear",
    recommendations,
    volumeBonusOpportunities: volumeBonuses,
  };
}

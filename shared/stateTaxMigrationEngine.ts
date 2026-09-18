/**
 * SISTER INVENTION SI-010: State Tax Arbitrage Migration Planner
 * Patent Reference: Extends PAT-007 (Tax Bracket Optimization)
 * 
 * Models net financial benefit of state residency changes considering
 * income tax, capital gains, estate tax, property tax, cost of living,
 * and retirement-specific implications.
 */

export interface StateTaxProfile {
  state: string;
  abbrev: string;
  incomeTaxRate: number;       // Top marginal rate
  capitalGainsRate: number;    // State CG rate
  estateTaxRate: number;       // State estate tax rate
  estateExemption: number;     // State estate tax exemption
  propertyTaxRate: number;     // Effective rate as % of home value
  salesTaxRate: number;
  costOfLivingIndex: number;   // 100 = national average
  retirementIncomeTaxed: boolean;
  socialSecurityTaxed: boolean;
  noIncomeTax: boolean;
}

export interface MigrationInput {
  currentState: string;
  targetStates: string[];
  annualIncome: number;
  capitalGainsPerYear: number;
  estateValue: number;
  homeValue: number;
  annualSpending: number;
  retirementIncome: number;
  socialSecurityIncome: number;
  projectionYears: number;
  age: number;
}

export interface MigrationYearResult {
  year: number;
  currentStateTax: number;
  targetStateTax: number;
  annualSavings: number;
  cumulativeSavings: number;
  colAdjustedSavings: number;
}

export interface MigrationComparison {
  targetState: string;
  targetAbbrev: string;
  years: MigrationYearResult[];
  totalTaxSavings: number;
  totalColAdjustedSavings: number;
  estateTaxSavings: number;
  effectiveSavingsRate: number;
  breakEvenYear: number | null;
  movingCostEstimate: number;
  qualityOfLifeScore: number;  // 1-100
  recommendation: string;
}

export interface MigrationResult {
  currentState: StateTaxProfile;
  comparisons: MigrationComparison[];
  bestState: string;
  maxLifetimeSavings: number;
  maxEstateSavings: number;
}

// Comprehensive state tax data (top 15 most relevant migration targets + current)
const STATE_PROFILES: Record<string, StateTaxProfile> = {
  FL: { state: "Florida", abbrev: "FL", incomeTaxRate: 0, capitalGainsRate: 0, estateTaxRate: 0, estateExemption: Infinity, propertyTaxRate: 0.0089, salesTaxRate: 0.06, costOfLivingIndex: 101, retirementIncomeTaxed: false, socialSecurityTaxed: false, noIncomeTax: true },
  TX: { state: "Texas", abbrev: "TX", incomeTaxRate: 0, capitalGainsRate: 0, estateTaxRate: 0, estateExemption: Infinity, propertyTaxRate: 0.0180, salesTaxRate: 0.0625, costOfLivingIndex: 92, retirementIncomeTaxed: false, socialSecurityTaxed: false, noIncomeTax: true },
  NV: { state: "Nevada", abbrev: "NV", incomeTaxRate: 0, capitalGainsRate: 0, estateTaxRate: 0, estateExemption: Infinity, propertyTaxRate: 0.0060, salesTaxRate: 0.0685, costOfLivingIndex: 104, retirementIncomeTaxed: false, socialSecurityTaxed: false, noIncomeTax: true },
  WY: { state: "Wyoming", abbrev: "WY", incomeTaxRate: 0, capitalGainsRate: 0, estateTaxRate: 0, estateExemption: Infinity, propertyTaxRate: 0.0057, salesTaxRate: 0.04, costOfLivingIndex: 95, retirementIncomeTaxed: false, socialSecurityTaxed: false, noIncomeTax: true },
  SD: { state: "South Dakota", abbrev: "SD", incomeTaxRate: 0, capitalGainsRate: 0, estateTaxRate: 0, estateExemption: Infinity, propertyTaxRate: 0.0131, salesTaxRate: 0.045, costOfLivingIndex: 90, retirementIncomeTaxed: false, socialSecurityTaxed: false, noIncomeTax: true },
  TN: { state: "Tennessee", abbrev: "TN", incomeTaxRate: 0, capitalGainsRate: 0, estateTaxRate: 0, estateExemption: Infinity, propertyTaxRate: 0.0064, salesTaxRate: 0.07, costOfLivingIndex: 89, retirementIncomeTaxed: false, socialSecurityTaxed: false, noIncomeTax: true },
  NH: { state: "New Hampshire", abbrev: "NH", incomeTaxRate: 0, capitalGainsRate: 0.05, estateTaxRate: 0, estateExemption: Infinity, propertyTaxRate: 0.0186, salesTaxRate: 0, costOfLivingIndex: 113, retirementIncomeTaxed: false, socialSecurityTaxed: false, noIncomeTax: true },
  AK: { state: "Alaska", abbrev: "AK", incomeTaxRate: 0, capitalGainsRate: 0, estateTaxRate: 0, estateExemption: Infinity, propertyTaxRate: 0.0119, salesTaxRate: 0, costOfLivingIndex: 127, retirementIncomeTaxed: false, socialSecurityTaxed: false, noIncomeTax: true },
  WA: { state: "Washington", abbrev: "WA", incomeTaxRate: 0, capitalGainsRate: 0.07, estateTaxRate: 0.20, estateExemption: 2193000, propertyTaxRate: 0.0093, salesTaxRate: 0.065, costOfLivingIndex: 111, retirementIncomeTaxed: false, socialSecurityTaxed: false, noIncomeTax: true },
  CA: { state: "California", abbrev: "CA", incomeTaxRate: 0.133, capitalGainsRate: 0.133, estateTaxRate: 0, estateExemption: Infinity, propertyTaxRate: 0.0073, salesTaxRate: 0.0725, costOfLivingIndex: 142, retirementIncomeTaxed: true, socialSecurityTaxed: false, noIncomeTax: false },
  NY: { state: "New York", abbrev: "NY", incomeTaxRate: 0.109, capitalGainsRate: 0.109, estateTaxRate: 0.16, estateExemption: 6940000, propertyTaxRate: 0.0172, salesTaxRate: 0.04, costOfLivingIndex: 139, retirementIncomeTaxed: true, socialSecurityTaxed: false, noIncomeTax: false },
  NJ: { state: "New Jersey", abbrev: "NJ", incomeTaxRate: 0.1075, capitalGainsRate: 0.1075, estateTaxRate: 0.16, estateExemption: 0, propertyTaxRate: 0.0249, salesTaxRate: 0.0663, costOfLivingIndex: 120, retirementIncomeTaxed: true, socialSecurityTaxed: false, noIncomeTax: false },
  CT: { state: "Connecticut", abbrev: "CT", incomeTaxRate: 0.0699, capitalGainsRate: 0.0699, estateTaxRate: 0.12, estateExemption: 13610000, propertyTaxRate: 0.0215, salesTaxRate: 0.0635, costOfLivingIndex: 118, retirementIncomeTaxed: true, socialSecurityTaxed: true, noIncomeTax: false },
  IL: { state: "Illinois", abbrev: "IL", incomeTaxRate: 0.0495, capitalGainsRate: 0.0495, estateTaxRate: 0.16, estateExemption: 4000000, propertyTaxRate: 0.0227, salesTaxRate: 0.0625, costOfLivingIndex: 96, retirementIncomeTaxed: false, socialSecurityTaxed: false, noIncomeTax: false },
  MA: { state: "Massachusetts", abbrev: "MA", incomeTaxRate: 0.09, capitalGainsRate: 0.09, estateTaxRate: 0.16, estateExemption: 2000000, propertyTaxRate: 0.0123, salesTaxRate: 0.0625, costOfLivingIndex: 135, retirementIncomeTaxed: true, socialSecurityTaxed: false, noIncomeTax: false },
  VA: { state: "Virginia", abbrev: "VA", incomeTaxRate: 0.0575, capitalGainsRate: 0.0575, estateTaxRate: 0, estateExemption: Infinity, propertyTaxRate: 0.0082, salesTaxRate: 0.053, costOfLivingIndex: 104, retirementIncomeTaxed: true, socialSecurityTaxed: false, noIncomeTax: false },
  MD: { state: "Maryland", abbrev: "MD", incomeTaxRate: 0.0575, capitalGainsRate: 0.0575, estateTaxRate: 0.16, estateExemption: 5000000, propertyTaxRate: 0.0109, salesTaxRate: 0.06, costOfLivingIndex: 116, retirementIncomeTaxed: true, socialSecurityTaxed: false, noIncomeTax: false },
  PA: { state: "Pennsylvania", abbrev: "PA", incomeTaxRate: 0.0307, capitalGainsRate: 0.0307, estateTaxRate: 0.15, estateExemption: 0, propertyTaxRate: 0.0153, salesTaxRate: 0.06, costOfLivingIndex: 97, retirementIncomeTaxed: false, socialSecurityTaxed: false, noIncomeTax: false },
  AZ: { state: "Arizona", abbrev: "AZ", incomeTaxRate: 0.025, capitalGainsRate: 0.025, estateTaxRate: 0, estateExemption: Infinity, propertyTaxRate: 0.0063, salesTaxRate: 0.056, costOfLivingIndex: 103, retirementIncomeTaxed: true, socialSecurityTaxed: false, noIncomeTax: false },
  NC: { state: "North Carolina", abbrev: "NC", incomeTaxRate: 0.0475, capitalGainsRate: 0.0475, estateTaxRate: 0, estateExemption: Infinity, propertyTaxRate: 0.0084, salesTaxRate: 0.0475, costOfLivingIndex: 95, retirementIncomeTaxed: true, socialSecurityTaxed: false, noIncomeTax: false },
};

export function getStateProfile(abbrev: string): StateTaxProfile | undefined {
  return STATE_PROFILES[abbrev.toUpperCase()];
}

export function getAllStates(): StateTaxProfile[] {
  return Object.values(STATE_PROFILES);
}

export function getNoIncomeTaxStates(): StateTaxProfile[] {
  return Object.values(STATE_PROFILES).filter(s => s.noIncomeTax);
}

/**
 * Calculate migration benefit across multiple target states
 */
export function calculateMigration(input: MigrationInput): MigrationResult {
  const currentProfile = STATE_PROFILES[input.currentState];
  if (!currentProfile) throw new Error(`Unknown state: ${input.currentState}`);

  const comparisons: MigrationComparison[] = input.targetStates
    .map(ts => STATE_PROFILES[ts])
    .filter((p): p is StateTaxProfile => !!p)
    .map(targetProfile => {
      const years: MigrationYearResult[] = [];
      let cumulativeSavings = 0;
      let breakEvenYear: number | null = null;

      // Estimated moving cost
      const movingCost = input.homeValue * 0.08 + 15000; // 8% selling costs + moving

      for (let y = 1; y <= input.projectionYears; y++) {
        const income = input.annualIncome * Math.pow(1.03, y - 1); // 3% annual raise
        const cg = input.capitalGainsPerYear * Math.pow(1.02, y - 1);

        // Current state taxes
        const currentIncomeTax = income * currentProfile.incomeTaxRate;
        const currentCGTax = cg * currentProfile.capitalGainsRate;
        const currentPropertyTax = input.homeValue * currentProfile.propertyTaxRate;
        const currentRetTax = currentProfile.retirementIncomeTaxed ? input.retirementIncome * currentProfile.incomeTaxRate : 0;
        const currentSSTax = currentProfile.socialSecurityTaxed ? input.socialSecurityIncome * currentProfile.incomeTaxRate * 0.85 : 0;
        const currentTotal = currentIncomeTax + currentCGTax + currentPropertyTax + currentRetTax + currentSSTax;

        // Target state taxes
        const targetIncomeTax = income * targetProfile.incomeTaxRate;
        const targetCGTax = cg * targetProfile.capitalGainsRate;
        const targetPropertyTax = input.homeValue * targetProfile.propertyTaxRate;
        const targetRetTax = targetProfile.retirementIncomeTaxed ? input.retirementIncome * targetProfile.incomeTaxRate : 0;
        const targetSSTax = targetProfile.socialSecurityTaxed ? input.socialSecurityIncome * targetProfile.incomeTaxRate * 0.85 : 0;
        const targetTotal = targetIncomeTax + targetCGTax + targetPropertyTax + targetRetTax + targetSSTax;

        const annualSavings = currentTotal - targetTotal;
        cumulativeSavings += annualSavings;

        // COL adjustment
        const colRatio = targetProfile.costOfLivingIndex / currentProfile.costOfLivingIndex;
        const colAdjustedSavings = annualSavings - (input.annualSpending * (colRatio - 1));

        if (breakEvenYear === null && cumulativeSavings > movingCost) {
          breakEvenYear = y;
        }

        years.push({
          year: y,
          currentStateTax: Math.round(currentTotal),
          targetStateTax: Math.round(targetTotal),
          annualSavings: Math.round(annualSavings),
          cumulativeSavings: Math.round(cumulativeSavings),
          colAdjustedSavings: Math.round(colAdjustedSavings),
        });
      }

      // Estate tax savings
      const currentEstateTax = input.estateValue > currentProfile.estateExemption
        ? (input.estateValue - currentProfile.estateExemption) * currentProfile.estateTaxRate : 0;
      const targetEstateTax = input.estateValue > targetProfile.estateExemption
        ? (input.estateValue - targetProfile.estateExemption) * targetProfile.estateTaxRate : 0;
      const estateSavings = currentEstateTax - targetEstateTax;

      const totalSavings = cumulativeSavings;
      const colAdjTotal = years.reduce((s, y) => s + y.colAdjustedSavings, 0);
      const effectiveRate = input.annualIncome > 0
        ? (years[0]?.annualSavings ?? 0) / input.annualIncome * 100 : 0;

      // Quality of life score (simplified)
      const qol = Math.max(10, Math.min(100, Math.round(
        80 - (targetProfile.costOfLivingIndex - 100) * 0.3 +
        (targetProfile.noIncomeTax ? 10 : 0) -
        (targetProfile.propertyTaxRate > 0.015 ? 10 : 0)
      )));

      const recommendation = totalSavings > 500000
        ? `Strong migration candidate — ${targetProfile.state} saves $${(totalSavings / 1000).toFixed(0)}K+ over ${input.projectionYears} years`
        : totalSavings > 100000
        ? `Moderate benefit — consider ${targetProfile.state} if lifestyle aligns`
        : totalSavings > 0
        ? `Marginal benefit — savings may not justify relocation costs`
        : `Not recommended — ${targetProfile.state} would increase your tax burden`;

      return {
        targetState: targetProfile.state,
        targetAbbrev: targetProfile.abbrev,
        years,
        totalTaxSavings: Math.round(totalSavings),
        totalColAdjustedSavings: Math.round(colAdjTotal),
        estateTaxSavings: Math.round(estateSavings),
        effectiveSavingsRate: Math.round(effectiveRate * 100) / 100,
        breakEvenYear,
        movingCostEstimate: Math.round(movingCost),
        qualityOfLifeScore: qol,
        recommendation,
      };
    });

  const best = comparisons.reduce((b, c) =>
    c.totalTaxSavings > b.totalTaxSavings ? c : b, comparisons[0]);

  return {
    currentState: currentProfile,
    comparisons,
    bestState: best?.targetState ?? "N/A",
    maxLifetimeSavings: best?.totalTaxSavings ?? 0,
    maxEstateSavings: Math.max(...comparisons.map(c => c.estateTaxSavings), 0),
  };
}

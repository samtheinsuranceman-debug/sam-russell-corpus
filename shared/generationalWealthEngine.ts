import { TAX_RULES_2026 } from "./taxRules";
/**
 * SISTER INVENTION SI-015: Multi-Generational Wealth Transfer Simulation
 * Patent Reference: Extends PAT-004 (Household Wealth Engine)
 * 
 * Simulates wealth transfer across 3+ generations with
 * tax optimization and dynasty trust modeling.
 */

export interface GenerationConfig {
  name: string;
  currentAge: number;
  netWorth: number;
  annualIncome: number;
  savingsRate: number;
  investmentReturn: number;
  taxBracket: number;
  lifeExpectancy: number;
  hasIUL: boolean;
  iulDeathBenefit: number;
  hasILIT: boolean;
  childrenCount: number;
}

export interface TransferEvent {
  year: number;
  fromGeneration: string;
  toGeneration: string;
  amount: number;
  method: string;
  taxPaid: number;
  netTransfer: number;
  irsReference: string;
}

export interface GenerationYear {
  year: number;
  gen1Wealth: number;
  gen2Wealth: number;
  gen3Wealth: number;
  totalFamilyWealth: number;
  transferEvents: TransferEvent[];
}

export interface GenWealthResult {
  projections: GenerationYear[];
  totalFamilyWealthFinal: number;
  totalTaxesPaid: number;
  totalTaxesSaved: number;
  wealthMultiplier: number;
  transferEvents: TransferEvent[];
  strategies: string[];
  dynastyTrustValue: number;
}

/**
 * Simulate multi-generational wealth transfer
 */
export function simulateGenerationalWealth(
  gen1: GenerationConfig,
  gen2: GenerationConfig,
  gen3: GenerationConfig,
  projectionYears: number = 50,
  useDynastyTrust: boolean = true
): GenWealthResult {
  const projections: GenerationYear[] = [];
  const allTransfers: TransferEvent[] = [];

  let g1Wealth = gen1.netWorth;
  let g2Wealth = gen2.netWorth;
  let g3Wealth = gen3.netWorth;
  let dynastyTrust = 0;
  let totalTaxPaid = 0;
  let totalTaxSaved = 0;

  // Federal basic exclusion amount, 2026: $15,000,000 per person (Rev. Proc. 2025-32; IRC §2010(c)(3) as amended by
  // P.L. 119-21 §70106), read from shared/taxRules.ts. Was 13,610,000, the 2024 figure (Rev. Proc. 2023-34).
  const federalExemption = TAX_RULES_2026.estateBasicExclusion;
  // Annual gift exclusion per donee, 2026: $19,000 (IRC §2503(b); Rev. Proc. 2025-32), shared/taxRules.ts. Was 18,000 (2024).
  const annualExclusion = TAX_RULES_2026.annualGiftExclusion;

  for (let y = 1; y <= projectionYears; y++) {
    const yearTransfers: TransferEvent[] = [];
    const g1Age = gen1.currentAge + y;
    const g2Age = gen2.currentAge + y;
    const g3Age = gen3.currentAge + y;

    // Gen 1 growth (if alive)
    if (g1Age <= gen1.lifeExpectancy) {
      g1Wealth += gen1.annualIncome * gen1.savingsRate;
      g1Wealth *= (1 + gen1.investmentReturn);

      // Annual gifting to Gen 2
      const annualGift = annualExclusion * gen2.childrenCount;
      g1Wealth -= annualGift;
      g2Wealth += annualGift;
      totalTaxSaved += annualGift * 0.40;
    }

    // Gen 1 death event
    if (g1Age === gen1.lifeExpectancy) {
      // IUL death benefit (tax-free via ILIT)
      if (gen1.hasIUL && gen1.hasILIT) {
        const dbTransfer = gen1.iulDeathBenefit;
        if (useDynastyTrust) {
          dynastyTrust += dbTransfer;
        } else {
          g2Wealth += dbTransfer;
        }
        totalTaxSaved += dbTransfer * 0.40;
        yearTransfers.push({
          year: y, fromGeneration: gen1.name, toGeneration: useDynastyTrust ? "Dynasty Trust" : gen2.name,
          amount: dbTransfer, method: "ILIT Death Benefit", taxPaid: 0, netTransfer: dbTransfer,
          irsReference: "IRC §2042 — Life insurance excluded from estate via ILIT",
        });
      }

      // Estate transfer
      const taxableEstate = Math.max(0, g1Wealth - federalExemption);
      const estateTax = taxableEstate * 0.40;
      const netEstate = g1Wealth - estateTax;
      totalTaxPaid += estateTax;

      if (useDynastyTrust) {
        dynastyTrust += netEstate * 0.6;
        g2Wealth += netEstate * 0.4;
      } else {
        g2Wealth += netEstate;
      }

      yearTransfers.push({
        year: y, fromGeneration: gen1.name, toGeneration: gen2.name,
        amount: g1Wealth, method: "Estate Transfer", taxPaid: estateTax, netTransfer: netEstate,
        irsReference: "IRC §2001 — Estate tax on transfers at death",
      });

      g1Wealth = 0;
    }

    // Gen 2 growth
    if (g2Age <= gen2.lifeExpectancy && g2Age >= 25) {
      g2Wealth += gen2.annualIncome * gen2.savingsRate;
      g2Wealth *= (1 + gen2.investmentReturn);

      // Annual gifting to Gen 3 (once Gen 3 is born)
      if (g3Age >= 0) {
        const gift = annualExclusion;
        g2Wealth -= gift;
        g3Wealth += gift;
      }
    }

    // Gen 2 death event
    if (g2Age === gen2.lifeExpectancy) {
      const taxableEstate = Math.max(0, g2Wealth - federalExemption);
      const estateTax = taxableEstate * 0.40;
      const netEstate = g2Wealth - estateTax;
      totalTaxPaid += estateTax;
      g3Wealth += netEstate;

      yearTransfers.push({
        year: y, fromGeneration: gen2.name, toGeneration: gen3.name,
        amount: g2Wealth, method: "Estate Transfer", taxPaid: estateTax, netTransfer: netEstate,
        irsReference: "IRC §2001 — Estate tax on transfers at death",
      });

      g2Wealth = 0;
    }

    // Gen 3 growth
    if (g3Age >= 25 && g3Age <= gen3.lifeExpectancy) {
      g3Wealth += gen3.annualIncome * gen3.savingsRate;
      g3Wealth *= (1 + gen3.investmentReturn);
    }

    // Dynasty trust growth (tax-free)
    if (useDynastyTrust && dynastyTrust > 0) {
      dynastyTrust *= (1 + 0.07); // Trust investment return
      totalTaxSaved += dynastyTrust * 0.07 * 0.37; // Tax saved on growth
    }

    allTransfers.push(...yearTransfers);

    projections.push({
      year: y,
      gen1Wealth: Math.round(g1Wealth),
      gen2Wealth: Math.round(g2Wealth),
      gen3Wealth: Math.round(g3Wealth),
      totalFamilyWealth: Math.round(g1Wealth + g2Wealth + g3Wealth + dynastyTrust),
      transferEvents: yearTransfers,
    });
  }

  const finalWealth = g1Wealth + g2Wealth + g3Wealth + dynastyTrust;
  const initialWealth = gen1.netWorth + gen2.netWorth + gen3.netWorth;
  const multiplier = initialWealth > 0 ? finalWealth / initialWealth : 0;

  const strategies: string[] = [
    "Establish ILIT with IUL for tax-free death benefit transfer",
    `Maximize annual exclusion gifts ($${(TAX_RULES_2026.annualGiftExclusion / 1000).toFixed(0)}K/person/year in 2026, Rev. Proc. 2025-32)`,
    useDynastyTrust ? "Dynasty trust shields multi-generational growth from estate tax" : "Consider dynasty trust for additional tax protection",
    "Use GRAT for appreciated assets to freeze estate value",
    "529 superfunding for grandchildren's education ($90K per grandchild)",
    "Coordinate lifetime exemption usage across both spouses",
    "Review and update estate documents every 3-5 years",
  ];

  return {
    projections,
    totalFamilyWealthFinal: Math.round(finalWealth),
    totalTaxesPaid: Math.round(totalTaxPaid),
    totalTaxesSaved: Math.round(totalTaxSaved),
    wealthMultiplier: Math.round(multiplier * 100) / 100,
    transferEvents: allTransfers,
    strategies,
    dynastyTrustValue: Math.round(dynastyTrust),
  };
}

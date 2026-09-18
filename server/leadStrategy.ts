// ============================================================
// LEAD STRATEGY ENGINE — turns a homepage fact-finder into an
// ILLUSTRATIVE, assumption-based analysis for the advisor's lead file.
//
// HONESTY CONTRACT:
// - Every figure here is illustrative and assumption-based, for a
//   licensed advisor to review with the client — NOT a projection,
//   guarantee, or promise of savings.
// - A Roth conversion is TAXABLE in the year it is performed. It is
//   NOT "tax-free." The illustrative Roth figure is a gross reference
//   value for advisor discussion only; see `rothCaveat`.
// - None of these numbers are ever returned to the public visitor.
//   The visitor sees only the qualitative `teaser`.
// ============================================================
import type { LeadAnalysis, LeadFactFinder } from "@shared/leadTypes";

const num = (v: number | undefined): number => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : 0);
const round = (v: number): number => Math.round(v);

// Blended effective rate from the household's own stated taxes, when we
// have them; otherwise a conservative high-earner default. Never below a
// floor so the illustration is not absurdly low.
function blendedRate(ff: LeadFactFinder): number {
  const income = num(ff.w2Income) + num(ff.spouseIncome);
  const taxes = num(ff.estimatedTaxes) + num(ff.spouseTaxes);
  if (income > 0 && taxes > 0) {
    const r = taxes / income;
    return Math.min(0.5, Math.max(0.22, r));
  }
  return 0.37;
}

export function computeLeadAnalysis(ff: LeadFactFinder): LeadAnalysis {
  const rate = blendedRate(ff);

  // Roth-conversion reference: tax-deferred balances plus any taxable
  // liquid dollars the advisor might sequence into conversions.
  const taxableLiquid = ff.liquidTaxability === "nontaxable" ? 0 : num(ff.liquidInvestments);
  const rothConversionBase = num(ff.taxDeferredSelf) + num(ff.taxDeferredSpouse) + taxableLiquid;
  // Illustrative gross reference (owner's 47% frame). This is NOT a saving
  // — a conversion is taxed the year it is done; see rothCaveat.
  const illustrativeRothTaxValue = round(rothConversionBase * 0.47);

  // Mortgage interest-only exposure and accelerated-payoff illustration.
  const ioMonthly = num(ff.mortgageInterestOnlyMonthly);
  const yearsLeft = num(ff.mortgageYearsRemaining);
  const lifetimeInterestOnlyExposure = round(ioMonthly * 12 * yearsLeft);
  const acceleratedPayoffYearsLow = 5;
  const acceleratedPayoffYearsHigh = 7;
  // If the recycling plan retires principal in ~6 years, the interest-only
  // years beyond that window are the illustrative avoided exposure.
  const avoidedYears = Math.max(0, yearsLeft - acceleratedPayoffYearsHigh);
  const illustrativeInterestPotentiallySaved = round(ioMonthly * 12 * avoidedYears);
  // First step of the equity plan: half of 50% of equity into year-one IUL.
  const equityDeployedFirstStep = round(num(ff.homeEquity) * 0.5 * 0.5);

  // Oil & gas drilling deduction (owner's fixed $150k / 95% assumption).
  const oilGasInvestmentAssumed = 150_000;
  const oilGasDeduction = round(oilGasInvestmentAssumed * 0.95);
  const illustrativeOilGasTaxOffset = round(oilGasDeduction * rate);

  return {
    teaser: {
      headline: "Accelerated mortgage payoff + low tax liability + Roth conversion + oil & gas drilling + trust-owned Index Universal Life — combined to help make your money divorce-proof.",
      pillars: [
        "Accelerated mortgage payoff",
        "Lower tax liability",
        "Roth-conversion sequencing",
        "Oil & gas drilling deduction",
        "Trust-owned Index Universal Life",
      ],
      note: "General concepts and sequence only — the specific numbers, timing, and structure are worked out with a licensed advisor in your evaluation.",
    },
    advisorFigures: {
      rothConversionBase,
      illustrativeRothTaxValue,
      lifetimeInterestOnlyExposure,
      illustrativeInterestPotentiallySaved,
      acceleratedPayoffYearsLow,
      acceleratedPayoffYearsHigh,
      equityDeployedFirstStep,
      oilGasInvestmentAssumed,
      oilGasDeduction,
      illustrativeOilGasTaxOffset,
      blendedTaxRateUsed: Math.round(rate * 1000) / 1000,
    },
    assumptions: [
      "Illustrative only — assumption-based reference figures for advisor review, not projections or guarantees.",
      "Roth reference uses the owner's 47% frame applied to tax-deferred plus taxable-liquid balances.",
      "Mortgage figures assume the stated interest-only payment continues for the stated remaining years; the recycling plan targets principal payoff in 5–7 years.",
      "Equity plan illustrates deploying 50% of stated home equity, split across two years into a trust-owned IUL.",
      "Oil & gas assumes a $150,000 working interest with a 95% first-year deduction; tax offset uses the household's blended effective rate.",
    ],
    disclaimer: "Illustrative and assumption-based. Not tax, legal, or investment advice, and not a projection or guarantee. Every specific must be confirmed by a licensed professional.",
    rothCaveat: "A Roth conversion is TAXABLE in the year it is performed — it is not tax-free. The Roth figure above is a gross reference value for advisor discussion, not a saving. The benefit is future tax-free growth and withdrawals, weighed against the tax paid at conversion.",
    computedAt: new Date().toISOString(),
  };
}

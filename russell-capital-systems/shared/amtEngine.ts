// ============================================================
// ALTERNATIVE MINIMUM TAX — IRC §55, Form 6251 shape
//
// This platform asks two separate questionnaires whether the client is subject
// to AMT (`onboardingQuestions` #67, `clientFactFinder.amtExposure`) and, until
// now, had no way to answer the question it asked. The figures were already in
// `taxRules.ts`; nothing computed with them.
//
// Who this is for: the site's stated audience is physicians, psychiatrists and
// surgeons. That is close to the centre of the AMT population — high wage
// income, large state tax bills, and, for anyone at a startup or a practice
// with equity, incentive stock options. The ISO bargain element is the single
// most common way a household with no AMT history suddenly owes it.
//
// ─── WHAT THIS DOES NOT DO ──────────────────────────────────────────────────
//
// This is not a tax return. It models the main path of Form 6251: the common
// add-backs, the exemption and its phaseout, the two-rate tentative minimum
// tax, and the comparison against regular tax. It deliberately omits the AMT
// foreign tax credit, the §53 minimum tax credit carryforward, depletion and
// intangible drilling adjustments, long-term contract accounting, and the
// separate AMT treatment of capital gains and qualified dividends.
//
// Those omissions matter most for the oil-and-gas and passive-activity cases
// this platform also covers, so `caveats` on the result names the ones that
// apply to the input given. Nothing here should be presented as a filing
// position; it is a planning estimate, and `AMT_IS_AN_ESTIMATE` exists so a
// page cannot render a number from this file without saying so.
// ============================================================
import { TAX_RULES_2026, type TaxRuleSet, type AmtKey } from "./taxRules";

/** No page should display output from this module as a filed or final figure. */
export const AMT_IS_AN_ESTIMATE = true;

export type AmtInput = {
  filingStatus: AmtKey;
  /** Regular taxable income — after the deduction actually taken. */
  regularTaxableIncome: number;
  /** Regular federal tax on that income, for the comparison at the end. */
  regularTax: number;
  /**
   * The deduction taken for regular tax that AMT disallows. For a standard
   * deduction filer that is the whole standard deduction; for an itemiser it
   * is the SALT deduction claimed. Both are added back the same way.
   */
  disallowedDeduction?: number;
  /**
   * Fair market value at exercise minus strike price, on ISOs exercised and
   * still held at year end. Zero if sold in the same calendar year, which
   * converts it to ordinary income and removes it from AMTI entirely.
   */
  isoBargainElement?: number;
  /** Interest on private-activity municipal bonds — §57(a)(5). */
  privateActivityBondInterest?: number;
  /** Any other §56–§58 preference or adjustment, entered deliberately. */
  otherPreferences?: number;
};

export type AmtResult = {
  amti: number;
  /** Exemption after phaseout. */
  exemption: number;
  exemptionBeforePhaseOut: number;
  exemptionLostToPhaseOut: number;
  amtBase: number;
  tentativeMinimumTax: number;
  regularTax: number;
  /** What AMT actually adds. Zero when regular tax already exceeds TMT. */
  amtOwed: number;
  owesAmt: boolean;
  /** True while each extra dollar of AMTI also erodes the exemption. */
  inPhaseOut: boolean;
  /**
   * Effective AMT rate on the next dollar of AMTI. Inside the phaseout each
   * dollar raises the AMT base by 1 + phaseOutRate, so 28% becomes 42%.
   */
  amtMarginalRate: number;
  caveats: string[];
};

const clamp0 = (n: number) => (n > 0 ? n : 0);
const round2 = (n: number) => Math.round(n * 100) / 100;

function amtRules(rules: TaxRuleSet) {
  if (!rules.amt) {
    throw new Error(
      `Tax rule set ${rules.version} publishes no AMT figures, so AMT cannot be computed against it. ` +
        `Add an \`amt\` block sourced to that year's revenue procedure first.`,
    );
  }
  return rules.amt;
}

/**
 * Tentative minimum tax on an AMT base — the two-rate step of §55(b)(1).
 * Separated out because the ISO solver below needs it on its own.
 */
function tentativeMinimumTax(amtBase: number, filingStatus: AmtKey, rules: TaxRuleSet): number {
  const a = amtRules(rules);
  const threshold = filingStatus === "separate" ? a.rate28Threshold.separate : a.rate28Threshold.other;
  const low = Math.min(amtBase, threshold);
  const high = clamp0(amtBase - threshold);
  return low * a.rates.low + high * a.rates.high;
}

export function calculateAmt(input: AmtInput, rules: TaxRuleSet = TAX_RULES_2026): AmtResult {
  const a = amtRules(rules);
  const {
    filingStatus,
    regularTaxableIncome,
    regularTax,
    disallowedDeduction = 0,
    isoBargainElement = 0,
    privateActivityBondInterest = 0,
    otherPreferences = 0,
  } = input;

  const amti = clamp0(
    regularTaxableIncome + disallowedDeduction + isoBargainElement + privateActivityBondInterest + otherPreferences,
  );

  const exemptionBeforePhaseOut = a.exemption[filingStatus];
  const excess = clamp0(amti - a.phaseOutStart[filingStatus]);
  const exemptionLostToPhaseOut = Math.min(exemptionBeforePhaseOut, excess * a.phaseOutRate);
  const exemption = exemptionBeforePhaseOut - exemptionLostToPhaseOut;

  const amtBase = clamp0(amti - exemption);
  const tmt = tentativeMinimumTax(amtBase, filingStatus, rules);
  const amtOwed = clamp0(tmt - regularTax);

  // Still inside the phaseout only while exemption remains to be lost.
  const inPhaseOut = excess > 0 && exemption > 0;
  const threshold = filingStatus === "separate" ? a.rate28Threshold.separate : a.rate28Threshold.other;
  const baseRate = amtBase > threshold ? a.rates.high : a.rates.low;
  const amtMarginalRate = inPhaseOut ? baseRate * (1 + a.phaseOutRate) : baseRate;

  const caveats: string[] = [];
  if (isoBargainElement > 0) {
    caveats.push(
      "ISO bargain element is included in AMTI but creates a §53 minimum tax credit that can be recovered in later years. " +
        "This estimate does not model that recovery, so it overstates the lifetime cost.",
    );
  }
  if (inPhaseOut) {
    caveats.push(
      `Inside the exemption phaseout: each additional dollar of AMT income raises the AMT base by ` +
        `$${(1 + a.phaseOutRate).toFixed(2)}, so the effective rate on the next dollar is ` +
        `${(amtMarginalRate * 100).toFixed(0)}%, above the top regular bracket.`,
    );
  }
  if (otherPreferences > 0) {
    caveats.push(
      "Other preferences were entered as a lump sum. Depletion, intangible drilling costs and passive activity " +
        "adjustments each have their own limits that this estimate does not apply.",
    );
  }
  caveats.push(
    "Capital gains and qualified dividends keep their preferential rates under AMT; this model taxes the whole " +
      "AMT base at 26/28%, so it overstates AMT for a return where those are a large share of income.",
  );

  return {
    amti: round2(amti),
    exemption: round2(exemption),
    exemptionBeforePhaseOut,
    exemptionLostToPhaseOut: round2(exemptionLostToPhaseOut),
    amtBase: round2(amtBase),
    tentativeMinimumTax: round2(tmt),
    regularTax: round2(regularTax),
    amtOwed: round2(amtOwed),
    owesAmt: amtOwed > 0,
    inPhaseOut,
    amtMarginalRate: Math.round(amtMarginalRate * 10_000) / 10_000,
    caveats,
  };
}

/**
 * The largest ISO bargain element that can be exercised before AMT starts to
 * bite — the number a planner actually wants, because exercising up to it and
 * no further is free.
 *
 * Solved by bisection rather than algebraically: the relationship has two
 * kinks (the exemption phaseout starting, and the 26%→28% step), so a closed
 * form is three cases that are easy to get subtly wrong. 60 halvings takes the
 * interval below a cent on any realistic ceiling.
 */
export function maxIsoExerciseBeforeAmt(
  base: Omit<AmtInput, "isoBargainElement">,
  rules: TaxRuleSet = TAX_RULES_2026,
): number {
  const owes = (iso: number) => calculateAmt({ ...base, isoBargainElement: iso }, rules).owesAmt;

  // Already in AMT with no exercise at all: there is no room.
  if (owes(0)) return 0;

  // Expand until AMT is triggered, so bisection has a bracket it can trust.
  let hi = 10_000;
  for (let i = 0; i < 40 && !owes(hi); i++) hi *= 2;
  if (!owes(hi)) return hi; // Pathological input; report the range searched.

  let lo = 0;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (owes(mid)) hi = mid;
    else lo = mid;
  }
  return Math.floor(lo * 100) / 100;
}

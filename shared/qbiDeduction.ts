// ============================================================
// SECTION 199A — the qualified business income deduction.
//
// The largest deduction available to a practice owner, and the one with the
// most moving parts: the SSTB cliff, the W-2 wage limit, the UBIA property
// prong, and the phase-in band between the two worlds. A surgeon with an
// S-corp who gets this wrong overpays by five figures a year, every year.
//
// SOURCES — every figure and every rule below traces to one of these. Nothing
// is typed from memory.
//
//   26 U.S.C. § 199A — the statute itself.
//     (a)    deduction = lesser of (combined QBI amount) or 20% of (taxable
//            income − net capital gain)
//     (b)(2) per-business amount = lesser of 20% of QBI, or the WAGE LIMIT
//     (b)(2)(B) wage limit = GREATER of 50% of W-2 wages, or
//            (25% of W-2 wages + 2.5% of UBIA of qualified property)
//     (b)(3)(A) below the threshold the wage limit does not apply at all
//     (b)(3)(B) between threshold and threshold + $75,000 ($150,000 joint)
//            the limit phases in proportionally
//     (d)(3)(A) the same band phases OUT an SSTB's QBI, wages and UBIA
//     (e)(2) the threshold amount, inflation adjusted
//
//   Rev. Proc. 2025-32 § 3.26 (IR-2025-103, 9 October 2025) — the 2026
//     threshold and phase-in range amounts, reproduced verbatim below.
//
//   OBBBA § 70105 (P.L. 119-21, 4 July 2025) amended § 199A(i) to add a
//     minimum deduction of $400 for a taxpayer with at least $1,000 of QBI
//     from an active trade or business, effective for taxable years beginning
//     after 31 December 2025. The $400 and $1,000 are themselves inflation
//     adjusted for years after 2026.
//
// WHAT THIS IS NOT. It computes the deduction from figures the client gives
// it. It does not file anything, does not decide entity structure, and does
// not replace a CPA. Every output carries that, and the page says it too.
// ============================================================

export type FilingStatus = "single" | "mfj" | "mfs" | "hoh";

/**
 * Threshold and phase-in top by filing status.
 *
 * VERBATIM from Rev. Proc. 2025-32 § 3.26, the table titled "Qualified
 * Business Income ... For taxable years beginning in 2026, the threshold
 * amounts under § 199A(e)(2) and phase-in range amounts under
 * § 199A(b)(3)(B) and § 199A(d)(3)(A) are:"
 *
 *   Married Individuals Filing Joint Returns   $403,500   $553,500
 *   Married Individuals Filing Separate Returns $201,775  $276,775
 *   All Other Returns                           $201,750  $276,750
 *
 * Head of household falls under "All Other Returns". Single likewise.
 */
export type ThresholdRow = { threshold: number; phaseInTop: number };

export const QBI_THRESHOLDS_2026: Record<FilingStatus, ThresholdRow> = {
  mfj: { threshold: 403_500, phaseInTop: 553_500 },
  mfs: { threshold: 201_775, phaseInTop: 276_775 },
  single: { threshold: 201_750, phaseInTop: 276_750 },
  hoh: { threshold: 201_750, phaseInTop: 276_750 },
};

export const QBI_SOURCE = {
  taxYear: 2026,
  thresholds: "IRS Rev. Proc. 2025-32 § 3.26 (IR-2025-103, 9 October 2025)",
  statute: "26 U.S.C. § 199A",
  minimumDeduction: "OBBBA § 70105 (P.L. 119-21), amending § 199A(i), effective for taxable years beginning after 31 December 2025",
  url: "https://www.irs.gov/pub/irs-drop/rp-25-32.pdf",
} as const;

/** § 199A(i) as amended by OBBBA § 70105. Inflation adjusted only for years after 2026. */
export const MINIMUM_DEDUCTION_2026 = 400;
export const MINIMUM_QBI_FOR_MINIMUM_DEDUCTION_2026 = 1_000;

export type Business = {
  name: string;
  /** Qualified business income. Negative QBI is allowed and nets against other businesses. */
  qbi: number;
  /** W-2 wages paid by the business, § 199A(b)(4). */
  w2Wages: number;
  /** Unadjusted basis immediately after acquisition of qualified property, § 199A(b)(6). */
  ubia: number;
  /**
   * Specified service trade or business, § 199A(d)(2): health, law, accounting,
   * actuarial science, performing arts, consulting, athletics, financial
   * services, brokerage, and any trade or business whose principal asset is
   * the reputation or skill of one or more of its employees or owners.
   *
   * A medical or dental practice IS an SSTB. This is the single field that
   * most changes the answer for this firm's client base.
   */
  isSSTB: boolean;
};

export type QbiInput = {
  filingStatus: FilingStatus;
  /** Taxable income BEFORE the § 199A deduction — that is what § 199A(e)(1) uses. */
  taxableIncomeBeforeQbi: number;
  /** Net capital gain as defined in § 1(h), subtracted in the § 199A(a)(2) overall cap. */
  netCapitalGain: number;
  businesses: readonly Business[];
  /** Qualified REIT dividends and PTP income, § 199A(b)(1)(B). 20% of these is added in and is NOT wage limited. */
  qualifiedReitAndPtpIncome?: number;
  /** Marginal federal rate, used only to express the deduction in dollars saved. Not part of § 199A. */
  marginalRate?: number;
};

export type BusinessResult = {
  name: string;
  isSSTB: boolean;
  /** How much of the QBI, wages and UBIA survive the SSTB phase-out. 1 = all, 0 = none. */
  sstbApplicablePercentage: number;
  appliedQbi: number;
  appliedWages: number;
  appliedUbia: number;
  /** 20% of applied QBI, before any wage limit. */
  tentative: number;
  /** The § 199A(b)(2)(B) wage limit: greater of the two prongs. */
  wageLimit: number;
  wageLimitProng: "50% of wages" | "25% of wages + 2.5% of property";
  /** What the deduction for this business ends up being. */
  amount: number;
  /** Which rule actually bound it — the most useful single output on the page. */
  binding: "below threshold — no limit" | "wage limit" | "phase-in reduction" | "SSTB fully phased out" | "no QBI";
  /** Plain-language note about what would change this business's answer. */
  lever: string;
};

export type QbiResult = {
  taxYear: number;
  filingStatus: FilingStatus;
  threshold: number;
  phaseInTop: number;
  /** 0 below the threshold, 1 at or above the top, proportional between. */
  phaseInFraction: number;
  band: "below" | "phase-in" | "above";
  businesses: BusinessResult[];
  /** Sum of the per-business amounts, plus 20% of REIT/PTP income. § 199A(b)(1). */
  combinedQbiAmount: number;
  /** The § 199A(a)(2) overall cap: 20% of (taxable income − net capital gain). */
  overallCap: number;
  /** The deduction before the § 199A(i) minimum is considered. */
  deductionBeforeMinimum: number;
  /** Whether § 199A(i) raised the result. */
  minimumApplied: boolean;
  deduction: number;
  /** Which of the two § 199A(a) limbs bound the final figure. */
  boundBy: "combined QBI amount" | "20% of taxable income less capital gain" | "§ 199A(i) minimum";
  /** Deduction × marginal rate. Illustrative only; the real saving depends on the whole return. */
  estimatedTaxSaved: number | null;
  notes: string[];
  source: typeof QBI_SOURCE;
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

export function thresholdsFor(filingStatus: FilingStatus): ThresholdRow {
  return QBI_THRESHOLDS_2026[filingStatus];
}

/**
 * Where in the band the taxpayer sits.
 *
 * 0 at or below the threshold — § 199A(b)(3)(A), no wage limit, no SSTB
 * haircut. 1 at or above the phase-in top — full wage limit, SSTB gets
 * nothing. Proportional between, per § 199A(b)(3)(B)(ii) and (d)(3)(A).
 */
export function phaseInFraction(taxableIncomeBeforeQbi: number, filingStatus: FilingStatus): number {
  const { threshold, phaseInTop } = thresholdsFor(filingStatus);
  if (taxableIncomeBeforeQbi <= threshold) return 0;
  if (taxableIncomeBeforeQbi >= phaseInTop) return 1;
  return clamp01((taxableIncomeBeforeQbi - threshold) / (phaseInTop - threshold));
}

/** § 199A(b)(2)(B): the greater of the two prongs. */
export function wageLimitFor(w2Wages: number, ubia: number): { limit: number; prong: BusinessResult["wageLimitProng"] } {
  const half = 0.5 * w2Wages;
  const quarterPlusProperty = 0.25 * w2Wages + 0.025 * ubia;
  return quarterPlusProperty > half
    ? { limit: quarterPlusProperty, prong: "25% of wages + 2.5% of property" }
    : { limit: half, prong: "50% of wages" };
}

function evaluateBusiness(b: Business, fraction: number): BusinessResult {
  // § 199A(d)(3)(A): inside the band an SSTB keeps only the applicable
  // percentage of its QBI, wages and UBIA; above the top it keeps none.
  const applicable = b.isSSTB ? 1 - fraction : 1;
  const appliedQbi = b.qbi * applicable;
  const appliedWages = b.w2Wages * applicable;
  const appliedUbia = b.ubia * applicable;

  const { limit: wageLimit, prong } = wageLimitFor(appliedWages, appliedUbia);
  const tentative = 0.2 * appliedQbi;

  const base = {
    name: b.name, isSSTB: b.isSSTB, sstbApplicablePercentage: applicable,
    appliedQbi, appliedWages, appliedUbia, tentative, wageLimit, wageLimitProng: prong,
  };

  if (b.isSSTB && fraction >= 1) {
    return { ...base, amount: 0, binding: "SSTB fully phased out",
      lever: `A specified service business gets no deduction once taxable income reaches ${money(thresholdsFor("mfj").phaseInTop)} joint. The lever here is taxable income, not the business.` };
  }
  if (appliedQbi <= 0) {
    return { ...base, amount: tentative, binding: "no QBI",
      lever: "A loss year. The negative amount carries against other qualified businesses and, under § 199A(c)(2), into the following year." };
  }

  // § 199A(b)(3)(A): below the threshold the wage limit simply does not apply.
  if (fraction <= 0) {
    return { ...base, amount: tentative, binding: "below threshold — no limit",
      lever: "Below the threshold the full 20% is available regardless of wages or property. Keeping taxable income under the threshold is worth more here than any other move." };
  }

  // § 199A(b)(3)(B)(ii): the excess over the wage limit is reduced
  // proportionally across the band rather than applying all at once.
  if (tentative <= wageLimit) {
    return { ...base, amount: tentative, binding: "below threshold — no limit",
      lever: "Wages and property already cover the full 20%. The wage limit is not costing anything at this income." };
  }
  const excess = tentative - wageLimit;
  const reduction = excess * fraction;
  const amount = tentative - reduction;

  if (fraction >= 1) {
    return { ...base, amount: wageLimit, binding: "wage limit",
      lever: prong === "50% of wages"
        ? `Fully wage limited. Every additional ${money(2)} of W-2 wages buys about ${money(1)} of deduction, up to 20% of QBI.`
        : `Fully limited, and the property prong is the one that binds. Qualified property with basis still inside its depreciable period raises the limit by 2.5% of that basis.` };
  }
  return { ...base, amount, binding: "phase-in reduction",
    lever: `Inside the phase-in band. ${Math.round(fraction * 100)}% of the wage limit is currently applied; each dollar of taxable income reduction relaxes it.` };
}

export function computeQbiDeduction(input: QbiInput): QbiResult {
  const { threshold, phaseInTop } = thresholdsFor(input.filingStatus);
  const fraction = phaseInFraction(input.taxableIncomeBeforeQbi, input.filingStatus);
  const band: QbiResult["band"] = fraction <= 0 ? "below" : fraction >= 1 ? "above" : "phase-in";

  const businesses = input.businesses.map((b) => evaluateBusiness(b, fraction));
  const reitPtp = input.qualifiedReitAndPtpIncome ?? 0;

  // § 199A(b)(1): the combined amount is the sum of the per-business amounts
  // plus 20% of REIT dividends and PTP income, which carry no wage limit.
  // It cannot go below zero.
  const combinedQbiAmount = Math.max(0, businesses.reduce((s, b) => s + b.amount, 0) + 0.2 * reitPtp);

  // § 199A(a)(2): the overall cap.
  const overallCap = Math.max(0, 0.2 * (input.taxableIncomeBeforeQbi - input.netCapitalGain));

  const deductionBeforeMinimum = Math.min(combinedQbiAmount, overallCap);

  // § 199A(i) as amended by OBBBA § 70105.
  const totalQbi = input.businesses.reduce((s, b) => s + b.qbi, 0);
  const eligibleForMinimum = totalQbi >= MINIMUM_QBI_FOR_MINIMUM_DEDUCTION_2026;
  const minimumApplied = eligibleForMinimum && deductionBeforeMinimum < MINIMUM_DEDUCTION_2026;
  const deduction = minimumApplied ? MINIMUM_DEDUCTION_2026 : deductionBeforeMinimum;

  const boundBy: QbiResult["boundBy"] = minimumApplied
    ? "§ 199A(i) minimum"
    : combinedQbiAmount <= overallCap ? "combined QBI amount" : "20% of taxable income less capital gain";

  const notes: string[] = [];
  notes.push(`Taxable income before this deduction is ${money(input.taxableIncomeBeforeQbi)}; the ${input.filingStatus.toUpperCase()} threshold for ${QBI_SOURCE.taxYear} is ${money(threshold)} and the phase-in completes at ${money(phaseInTop)}.`);
  if (band === "below") notes.push("Below the threshold: no wage limit and no specified-service haircut. This is the band worth defending.");
  if (band === "phase-in") notes.push(`Inside the phase-in band, ${Math.round(fraction * 100)}% of the way through. Every dollar of taxable income removed here is worth more than a dollar removed anywhere else on the return.`);
  if (band === "above") {
    const anySstb = input.businesses.some((b) => b.isSSTB);
    notes.push(anySstb
      ? "Above the phase-in top. Any specified service business — which includes a medical or dental practice — is out entirely; only non-SSTB income can still qualify."
      : "Above the phase-in top. The wage and property limit applies in full.");
  }
  if (input.netCapitalGain > 0) notes.push(`Net capital gain of ${money(input.netCapitalGain)} is removed before the 20% overall cap, which is why a large gain year can shrink this deduction even when the business did well.`);
  if (minimumApplied) notes.push(`The § 199A(i) minimum of ${money(MINIMUM_DEDUCTION_2026)} applies because there is at least ${money(MINIMUM_QBI_FOR_MINIMUM_DEDUCTION_2026)} of qualified business income.`);
  notes.push("This is a projection from the figures entered, not a filing position. A CPA confirms the wage figures, the property basis and whether each activity is a specified service trade or business before anything is relied on.");

  return {
    taxYear: QBI_SOURCE.taxYear,
    filingStatus: input.filingStatus,
    threshold, phaseInTop, phaseInFraction: fraction, band,
    businesses, combinedQbiAmount, overallCap, deductionBeforeMinimum,
    minimumApplied, deduction, boundBy,
    estimatedTaxSaved: input.marginalRate != null ? deduction * input.marginalRate : null,
    notes, source: QBI_SOURCE,
  };
}

/**
 * How much taxable income would have to come off to reach the threshold.
 *
 * This is the number the whole page exists to produce. For a practice owner
 * inside the band it is usually achievable with a retirement plan
 * contribution, and the deduction recovered can exceed the contribution's own
 * tax saving — which is the finding that pays for the visit.
 */
export function distanceToThreshold(input: QbiInput): {
  toThreshold: number;
  toPhaseInTop: number;
  deductionAtThreshold: number;
  deductionNow: number;
  gainFromReaching: number;
} {
  const { threshold, phaseInTop } = thresholdsFor(input.filingStatus);
  const now = computeQbiDeduction(input);
  const atThreshold = computeQbiDeduction({ ...input, taxableIncomeBeforeQbi: Math.min(input.taxableIncomeBeforeQbi, threshold) });
  return {
    toThreshold: Math.max(0, input.taxableIncomeBeforeQbi - threshold),
    toPhaseInTop: Math.max(0, input.taxableIncomeBeforeQbi - phaseInTop),
    deductionAtThreshold: atThreshold.deduction,
    deductionNow: now.deduction,
    gainFromReaching: Math.max(0, atThreshold.deduction - now.deduction),
  };
}

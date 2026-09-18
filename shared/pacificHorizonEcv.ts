/**
 * Pacific Horizon ECV IUL — the first carrier on this platform with real terms.
 *
 * Everything here is transcribed from two Pacific Life documents held in the
 * owner's Drive. Nothing is inferred, and the fields those documents do not
 * contain are marked absent rather than filled in.
 *
 * Sources:
 *   - IUF3957-00 9/25 (22-VER-87E), "Pacific Horizon ECV IUL" description page.
 *     Charges, loan rates, rider factors, account list. For financial
 *     professional use only.
 *   - IUC4009-1124-WH 11/24 E1127 (22-VER-104D), "Understanding Your Account
 *     Choices". Caps, participation rates, floors, and Pacific Life's own
 *     published hypothetical crediting rates.
 *   - Form series P21IUL, S22ECV. Issued by Pacific Life Insurance Company,
 *     Omaha NE; licensed in all states except New York.
 *
 * ## Why this one matters more than a rate guide
 *
 * The Nationwide document gave crediting and nothing else. This one gives the
 * charges too — the premium load, the administrative charge, the shape of the
 * cost of insurance and the coverage charge — and the loan rates. Those were
 * the two numbers the loan engine was waiting on, and they turn out to be the
 * most interesting thing in the file.
 *
 * ## The standard loan becomes a wash loan in year six
 *
 * Charged 2.25% in all years. Credited 2.00% in policy years 1-5 and 2.25% in
 * years 6 and later, on a current basis. So the current net cost of borrowing
 * is 0.25% for five years and then **exactly zero** — a contractual wash loan,
 * not a declared practice.
 *
 * On a guaranteed basis the credited rate drops to 1.00% in all years, so the
 * guaranteed net cost is 1.25% every year. Both numbers are real and they are
 * a factor of five apart. An illustration run on the current basis and a
 * policy that performs on the guaranteed basis are different products.
 *
 * ## The alternate loan is the participating loan, and Pacific Life says so
 *
 * "Charge a current annual interest rate (guaranteed maximum of 7.5%); Credit
 * one-year indexed accounts' interest earned on maturing segments. Alternate
 * Loans may result in lower or higher net loan costs, are more volatile, and
 * carry greater risk than Standard Loans."
 *
 * That is the carrier's own description of the mechanism shared/
 * policyLoanMechanics.ts models: in a year the index credits nothing, the
 * alternate loan is charged its full rate against a credit of zero. The
 * guaranteed maximum charge is 7.5%.
 *
 * ## The Enhanced Performance Factor Rider is the multiplier
 *
 * Segment's Indexed Interest Credit x Segment's Performance Factor = total
 * credit. Three designs, and the charges are not small — the Performance Plus
 * design costs 7.50% annualized of the segment balance. shared/
 * policyMultiplier.ts already models the trade; these are the first real
 * factors to put into it.
 *
 * ## What these documents do NOT contain
 *
 * - The cost of insurance table. The description page gives the mechanic
 *   ("Rate per $1,000 of Net Amount at Risk, applies up to age 121") and
 *   confirms the engine is charging it the right way, but not one rate.
 * - The coverage charge rates. Shape is given — per $1,000 of initial coverage
 *   plus a flat rate on the basic layer, for the first 10 coverage years on a
 *   current basis — but no figures.
 * - The surrender charge schedule. Duration is given: within 10 years of any
 *   basic coverage layer issue date. No percentages.
 * - The current declared rate on the fixed account, or the current alternate
 *   loan rate. Only the guaranteed minimums and maximums are published.
 *
 * All four are on an illustration. See docs/carriers/WHAT_TO_UPLOAD.md.
 */

/**
 * Facts established by the three Corrales illustrations run 16 September 2026.
 *
 * These are the four things the description page and the account-choices guide
 * did NOT contain, now partly closed. What is still missing is listed below and
 * is missing because Design A illustrations cannot supply it.
 */
export const HORIZON_ILLUSTRATION_FACTS = {
  runDate: '2026-09-16',
  producer: 'Samuel A Russell',
  formSeries: 'ICC21 P21IUL or P21IUL, with S22ECV',
  taxTest: 'GPT (Guideline Premium Test)',
  rider: 'NLG (No-Lapse Guarantee)',
  /**
   * The AG 49-A maximum illustrated rate for this product, off the illustration's
   * own account table: "1-Year Indexed Account 0 6.35% 6.35% 100.00%" — illustrated
   * rate and maximum illustrated rate both 6.35%, 100% allocation.
   *
   * This is the ceiling a projection may use. It is NOT a rate the Time Machine
   * produces or consumes; see shared/timeMachine30.ts.
   */
  maximumIllustratedRatePct: 6.35,
  illustratedRatePct: 6.35,
  illustratedAccountId: 'ph-1yr',
  /** "the surrender charge reaches zero 120 policy months after the later of the
   *  issue date or the last increase in Basic Coverage face amount." */
  surrenderChargeZeroAtMonths: 120,
  /** All three uploaded illustrations ran Design A: every EPFR credit and charge column is zero. */
  epfrDesignIllustrated: 'Classic (Design A)',
  stillMissing: [
    'The cost-of-insurance rate table. The mechanic is confirmed (rate per $1,000 of net amount at risk, to age 121) but no rates are printed.',
    'The coverage charge rates.',
    'The surrender charge percentages. Only the 120-month duration is given.',
    'The Enhanced Performance Factor Rider performance factors for Designs B and C. All three illustrations ran Design A, so the uploaded set establishes the mechanism and the design names and no factors.',
    'The Design B charge percentage.',
  ],
} as const;

export const PACIFIC_HORIZON_ECV = {
  carrier: 'Pacific Life Insurance Company',
  product: 'Pacific Horizon ECV IUL',
  formSeries: 'P21IUL, S22ECV',
  sources: [
    'IUF3957-00 9/25 (22-VER-87E) — description page',
    'IUC4009-1124-WH 11/24 E1127 (22-VER-104D) — Understanding Your Account Choices',
  ],
  ratesAsOf: 'May 2025 (rider performance factors); 11/24 and 9/25 document dates',
} as const;

export interface HorizonAccount {
  readonly id: string;
  readonly name: string;
  readonly index: 'SP500_EX_DIV' | 'INVESCO_QQQ' | 'BLACKROCK_ENDURA' | 'FIXED';
  readonly termYears: number;
  /** Current growth cap as a percentage over the segment term. Null = uncapped. */
  readonly currentCapPct: number | null;
  /** Guaranteed minimum cap over the segment term. Null where uncapped is guaranteed. */
  readonly guaranteedCapPct: number | null;
  readonly currentParticipationPct: number;
  readonly guaranteedParticipationPct: number;
  readonly floorPct: number;
  /** Annual account charge as a percentage of accumulated value in the account. */
  readonly accountChargePctAnnual: number;
  /** An extra credit the account receives, as a percentage. */
  readonly accountBenefitPctCurrent?: number;
  readonly accountBenefitPctGuaranteed?: number;
  readonly note?: string;
}

/**
 * One fixed account and eight indexed accounts.
 *
 * A discrepancy worth recording: the description page (9/25) says eight indexed
 * accounts and lists eight. The account-choices brochure (11/24) opens by
 * saying six, then describes seven, and separately tables the two volatility
 * control accounts. The eight-account list from the newer document is used
 * here; the older one appears to predate or exclude the volatility control
 * pair from its headline count.
 */
export const HORIZON_ACCOUNTS: readonly HorizonAccount[] = [
  {
    id: 'ph-fixed',
    name: 'Fixed Account',
    index: 'FIXED',
    termYears: 1,
    currentCapPct: null,
    guaranteedCapPct: null,
    currentParticipationPct: 100,
    guaranteedParticipationPct: 100,
    floorPct: 1.0,
    accountChargePctAnnual: 0,
    note: 'Credits the current declared rate, guaranteed for the first policy year. Guaranteed minimum 1.0%. The current declared rate is not published in the held documents.',
  },
  {
    id: 'ph-1yr',
    name: '1-Year Indexed Account',
    index: 'SP500_EX_DIV',
    termYears: 1,
    currentCapPct: 10.0,
    guaranteedCapPct: 2.0,
    currentParticipationPct: 100,
    guaranteedParticipationPct: 100,
    floorPct: 0,
    accountChargePctAnnual: 0,
  },
  {
    id: 'ph-1yr-high-cap',
    name: '1-Year High Cap Indexed Account',
    index: 'SP500_EX_DIV',
    termYears: 1,
    currentCapPct: 12.0,
    guaranteedCapPct: 4.0,
    currentParticipationPct: 100,
    guaranteedParticipationPct: 100,
    floorPct: 0,
    accountChargePctAnnual: 0.80,
    note: 'Monthly charge of 0.067% (0.80% annualized) of accumulated value in the account, taken as part of the policy\'s monthly charges — not netted out of the crediting rate.',
  },
  {
    id: 'ph-1yr-nocap-dynamic-par',
    name: '1-Year No Cap Dynamic Par Indexed Account',
    index: 'SP500_EX_DIV',
    termYears: 1,
    currentCapPct: null,
    guaranteedCapPct: null,
    // Pacific Life's own illustration assumes 50%; the guaranteed floor on the
    // participation rate is 5%. That is a tenfold gap between the illustrated
    // assumption and the contractual minimum, and it is the whole risk of this
    // account.
    currentParticipationPct: 50,
    guaranteedParticipationPct: 5,
    floorPct: 0,
    accountChargePctAnnual: 0,
    note: 'Illustration assumes a 50% participation rate; the actual current rate is declared as frequently as monthly and the guaranteed minimum is 5%.',
  },
  {
    id: 'ph-1yr-qqq',
    name: '1-Year Invesco QQQ Indexed Account',
    index: 'INVESCO_QQQ',
    termYears: 1,
    currentCapPct: 10.5,
    guaranteedCapPct: 1.0,
    currentParticipationPct: 100,
    guaranteedParticipationPct: 100,
    floorPct: 0,
    accountChargePctAnnual: 0,
  },
  {
    id: 'ph-2yr',
    name: '2-Year Indexed Account',
    index: 'SP500_EX_DIV',
    termYears: 2,
    currentCapPct: 24.0,
    guaranteedCapPct: 6.0,
    currentParticipationPct: 100,
    guaranteedParticipationPct: 100,
    floorPct: 0,
    accountChargePctAnnual: 0,
    note: 'Cap is over the full 2-year segment term, not per year.',
  },
  {
    id: 'ph-5yr-high-par',
    name: 'High Par 5-Year Indexed Account',
    index: 'SP500_EX_DIV',
    termYears: 5,
    currentCapPct: null,
    guaranteedCapPct: 10.0,
    currentParticipationPct: 110,
    guaranteedParticipationPct: 105,
    floorPct: 0,
    accountChargePctAnnual: 0,
    note: 'No current growth cap; guaranteed minimum cap of 10% over the 5-year term.',
  },
  {
    id: 'ph-1yr-vol-control',
    name: '1-Year Volatility Control Indexed Account',
    index: 'BLACKROCK_ENDURA',
    termYears: 1,
    currentCapPct: null,
    guaranteedCapPct: null,
    currentParticipationPct: 100,
    guaranteedParticipationPct: 100,
    floorPct: 0,
    accountChargePctAnnual: 0,
    accountBenefitPctCurrent: 0.40,
    accountBenefitPctGuaranteed: 0.01,
    note: 'The only account eligible for the Eligible Account Benefit Rider, which adds 0.40% current (0.01% guaranteed) at no cost. Participation rate is not published in the held documents.',
  },
  {
    id: 'ph-1yr-high-par-vol-control',
    name: '1-Year High Par Volatility Control Indexed Account',
    index: 'BLACKROCK_ENDURA',
    termYears: 1,
    currentCapPct: null,
    guaranteedCapPct: null,
    currentParticipationPct: 100,
    guaranteedParticipationPct: 100,
    floorPct: 0,
    accountChargePctAnnual: 0,
    note: 'Participation rate is not published in the held documents — "High Par" implies above 100% but the figure is absent.',
  },
];

/**
 * Policy charges, verbatim from IUF3957-00 9/25.
 *
 * Two of the four are complete numbers. The other two are shapes with the
 * rates withheld, which is what a description page does — the figures are on
 * the illustration.
 */
export const HORIZON_CHARGES = {
  /** Deducted from each premium payment. Complete. */
  premiumLoad: {
    nonQualifiedPct: 5.20,
    qualifiedPct: 4.20,
    internalNonQualifiedPct: 3.25,
    internalQualifiedPct: 2.25,
    guaranteedMaximumPct: 6.20,
  },
  /** Monthly administrative charge to age 121. Complete. */
  monthlyAdministrativeCharge: 10,
  /** Applies only in policy year 1, above the lesser of 16x target, $3m, or face. */
  surplusPremiumLoad: {
    currentPct: 0,
    guaranteedPct: 20,
    thresholdDescription: 'premium above the lesser of 16x Target Premium, $3 million, or the policy\'s initial face amount',
  },
  /** Shape known, rates absent. */
  costOfInsurance: {
    basis: 'Rate per $1,000 of Net Amount at Risk',
    throughAge: 121,
    ratesHeld: false,
  },
  /** Shape known, rates absent. This is the per-unit charge. */
  coverageCharge: {
    basis: 'Rate per $1,000 of initial Basic, ARTR and SVER-3 coverage, plus a flat rate on the initial Basic Coverage layer only',
    currentYears: 10,
    throughAge: 121,
    ratesHeld: false,
  },
  /** Duration known, schedule absent. */
  surrenderCharge: {
    appliesWithinYears: 10,
    basis: 'within 10 years of any Basic Coverage layer issue date',
    scheduleHeld: false,
  },
} as const;

/**
 * Loan terms. The two numbers the loan engine was waiting for.
 *
 * The standard loan is a contractual wash from policy year 6 on a current
 * basis, and costs 1.25% a year on a guaranteed basis. Both are real.
 */
export const HORIZON_LOANS = {
  standard: {
    chargedRatePct: 2.25,
    creditedRatePctGuaranteedAllYears: 1.00,
    creditedRatePctCurrentYears1to5: 2.00,
    creditedRatePctCurrentYears6Plus: 2.25,
    /** Current net cost: 0.25% for five years, then zero. */
    netCostCurrentYears1to5Pct: 0.25,
    netCostCurrentYears6PlusPct: 0,
    /** Guaranteed net cost, every year. */
    netCostGuaranteedPct: 1.25,
  },
  alternate: {
    /** The current charged rate is not published; only the guaranteed maximum. */
    chargedRatePctCurrent: null,
    chargedRatePctGuaranteedMaximum: 7.5,
    collateralCredit: "one-year indexed accounts' interest earned on maturing segments",
    carrierWarning:
      'Alternate Loans may result in lower or higher net loan costs, are more volatile, and carry greater risk than Standard Loans.',
  },
} as const;

/**
 * Enhanced Performance Factor Rider — the multiplier, with real factors.
 *
 * Factors shown are for policy years 10-20, as of May 2025. The charge is
 * assessed monthly as a percentage of each segment's balance, in all years
 * from policy year 2. Note the asymmetry: the Performance Plus design pays a
 * 7.50% annual charge to lift the credit by a factor of 2.36 — so in a year
 * the index credits nothing, the multiplier multiplies nothing and the charge
 * runs anyway. That is the trade shared/policyMultiplier.ts exists to show.
 */
export interface EpfrDesign {
  readonly id: string;
  readonly name: string;
  readonly currentFactor: number;
  readonly guaranteedFactor: number;
  readonly monthlyChargePct: number;
  readonly annualChargePct: number;
}

export const EPFR_DESIGNS: readonly EpfrDesign[] = [
  { id: 'classic', name: 'Classic (A)', currentFactor: 1.0, guaranteedFactor: 1.0, monthlyChargePct: 0, annualChargePct: 0 },
  { id: 'performance', name: 'Performance (B)', currentFactor: 1.91, guaranteedFactor: 1.49, monthlyChargePct: 0.415, annualChargePct: 4.98 },
  { id: 'performance-plus', name: 'Performance Plus (C)', currentFactor: 2.36, guaranteedFactor: 1.72, monthlyChargePct: 0.625, annualChargePct: 7.50 },
];

/**
 * Pacific Life's own published hypothetical crediting rates — their answer to
 * the question our Time Machine also answers, so a benchmark for our model.
 *
 * METHOD, which is not ours: "indexed segments are created monthly and
 * reallocated in the same account" for 20-year holding periods (S&P accounts),
 * with the monthly crediting rates annualized. Our engine runs annual
 * point-to-point on calendar years. Those are different mechanics and will not
 * agree; the difference is not an error in either.
 */
export interface HorizonLookback {
  readonly accountId: string;
  readonly period: string;
  readonly bestPct: number;
  readonly worstPct: number;
  readonly averagePct: number;
}

export const HORIZON_PUBLISHED_LOOKBACKS: readonly HorizonLookback[] = [
  { accountId: 'ph-1yr', period: '1988-2023', bestPct: 6.73, worstPct: 6.00, averagePct: 6.40 },
  { accountId: 'ph-1yr-nocap-dynamic-par', period: '1988-2023', bestPct: 6.48, worstPct: 4.75, averagePct: 5.70 },
  { accountId: 'ph-1yr-high-cap', period: '1988-2023', bestPct: 6.97, worstPct: 6.02, averagePct: 6.51 },
  { accountId: 'ph-2yr', period: '1988-2023', bestPct: 7.82, worstPct: 6.03, averagePct: 6.89 },
  { accountId: 'ph-5yr-high-par', period: '1988-2023', bestPct: 9.24, worstPct: 5.30, averagePct: 7.16 },
  { accountId: 'ph-1yr-qqq', period: '2003-2023', bestPct: 9.85, worstPct: 4.92, averagePct: 7.71 },
  { accountId: 'ph-1yr-high-par-vol-control', period: '2004-2023', bestPct: 13.55, worstPct: 5.02, averagePct: 10.09 },
  { accountId: 'ph-1yr-vol-control', period: '2004-2023', bestPct: 12.21, worstPct: 4.53, averagePct: 9.10 },
];

/** The raw index results Pacific Life printed beside their accounts. */
export const HORIZON_INDEX_BENCHMARKS = [
  { index: 'S&P 500 (excluding dividends)', period: '1988-2023', bestPct: 7.85, worstPct: 4.01, averagePct: 6.18 },
  { index: 'Invesco QQQ ETF', period: '2003-2023', bestPct: 25.95, worstPct: -0.17, averagePct: 13.49 },
  { index: 'BlackRock Endura Index', period: '2004-2023', bestPct: 6.80, worstPct: 1.71, averagePct: 4.67 },
] as const;

export function accountById(id: string): HorizonAccount | null {
  return HORIZON_ACCOUNTS.find((a) => a.id === id) ?? null;
}

/**
 * Accounts whose terms are complete enough to model without a gap.
 *
 * Defined as "cannotModel returns null" rather than as its own list of
 * exclusions, so the two can never drift apart — an earlier version kept a
 * separate filter here and silently admitted the QQQ account that cannotModel
 * refuses.
 */
export function modellableAccounts(): readonly HorizonAccount[] {
  return HORIZON_ACCOUNTS.filter((a) => cannotModel(a) === null);
}

/**
 * Why an account cannot be modelled, or null when it can.
 *
 * The volatility control accounts are refused for two reasons at once: we hold
 * no BlackRock Endura series, and their participation rates are not published.
 * The fixed account is refused because the current declared rate is not
 * published either — only the 1% guaranteed minimum.
 */
export function cannotModel(a: HorizonAccount): string | null {
  if (a.index === 'FIXED') {
    return 'The current declared rate is not published in the held documents; only the 1.0% guaranteed minimum.';
  }
  if (a.index === 'BLACKROCK_ENDURA') {
    return 'No BlackRock iBLD Endura VC 5.5 ER series is held, and the account\'s participation rate is not published.';
  }
  if (a.index === 'INVESCO_QQQ') {
    return 'No Invesco QQQ ETF series is held. The Nasdaq-100 series we hold is the index, not the ETF, and they differ by the ETF\'s own fees and tracking.';
  }
  return null;
}

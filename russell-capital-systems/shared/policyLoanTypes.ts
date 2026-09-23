// ============================================================
// POLICY LOAN TYPES — the declared-rate loan, the participating loan, and what
// actually happens to borrowed money while it is out.
//
// ## What I had wrong, and why it matters
//
// Earlier work on this platform modelled only the DECLARED RATE loan and called
// it "the wash". That is one of two loan types and it is the conservative one.
// It is not what a distribution strategy is usually built on, and treating it
// as the only option understates the design by several points a year.
//
// ## The two loans, from Nationwide's own narrative summary
//
// DECLARED RATE LOAN. The borrowed amount is moved out of the index strategies
// and credited a declared rate.
//     charged     3.90% years 1-10, 3.00% years 11+ (current); 3.90% guaranteed
//     credited    3.00% current; 1.00% guaranteed
//     net         -0.90% early, 0.00% from year 11, -2.90% guaranteed worst case
// Bounded both ways. It cannot help you and it cannot really hurt you.
//
// ALTERNATIVE POLICY LOAN — the participating or indexed loan. Nationwide:
//
//   "A Loan option under which the money borrowed REMAINS ALLOCATED to the
//    selected interest crediting strategies and CONTINUES TO RECEIVE the
//    interest credited to those strategies."
//
//     charged     5.00% current; 8.00% guaranteed maximum; set quarterly,
//                 declared in advance
//     credited    whatever the index strategy credits — 0% floor, 12% cap on
//                 High-Cap S&P 500
//
// So the collateral never leaves the market. THAT is the mechanism, and it is
// the thing I missed. In a 12% year the borrowed money earns 12% while costing
// 5%: a net +7.00% on money already spent. Over decades the credits on the
// collateral genuinely can exceed the loan itself, because the collateral
// compounds at the index rate while the loan compounds at the charged rate,
// and the first is usually the larger of the two.
//
// ## Why it is not arbitrage, whatever the brochures say
//
// Arbitrage means a locked spread. This is a directional bet that credited will
// beat charged, and Nationwide says so plainly in the same paragraph:
//
//   "IMPORTANT NOTE: Alternative Loans are MORE VOLATILE than Declared Rate
//    Loans because the interest charged and credited both can vary more."
//
// A 0% index year costs 5.00% on the whole loan balance. At the guaranteed
// maximum it costs 8.00%. And the charged rate resets quarterly at the
// carrier's discretion, so the cost side is not fixed either.
//
// ## Loans are settled from the death benefit, not repaid in life
//
// This is correct and it is the design. Interest is added to the loan rather
// than billed — every illustration here shows "Loan Interest Payment Method:
// Borrow". Nothing is due on a schedule. At death the loan is netted against
// the death benefit and the rest passes to the beneficiary, and the loan was
// never a taxable distribution because it was a loan.
//
// ## The one way it goes badly, which is the whole reason this file exists
//
// The loan balance compounds at the charged rate every year, including years
// the index credits zero. The account value compounds at the credited rate,
// which is zero in those years. Two exponentials, and in a bad run the loan's
// grows faster.
//
// If the loan balance overtakes the account value the policy LAPSES, and on
// lapse the entire gain becomes ordinary income in one year:
//
//     taxable = (loan balance + any cash received) - cost basis
//
// The policyholder receives nothing and owes tax on decades of gain. That is
// the phantom income event. It is the specific failure mode behind the IUL
// lapse litigation, and it is worst for exactly the person this strategy suits
// best — the one who borrowed the most for the longest.
//
// ## The backstop, and its asterisk
//
// Nationwide's Overloan Lapse Protection Rider II (Form ICC20-NWLA-594) turns
// a heavily-loaned policy into guaranteed paid-up insurance rather than letting
// it lapse. No charge until invoked. But all three must be true:
//
//     the insured is at least age 65
//     the policy has reached its 15th anniversary
//     indebtedness passes a trigger point that varies by attained age
//
// Before age 65 or before year 15 the backstop does not exist. And the
// illustration carries this, which belongs on any page that mentions the rider:
//
//   "Neither the IRS nor the courts have ruled on the [treatment] ... could
//    assert that the Indebtedness should be treated as a distribution, all or
//    a portion of which could be [taxable]."
//
// The rider is the carrier's best answer to the tax bomb and its own paperwork
// says the answer is untested.
// ============================================================

export type LoanType = "declared" | "participating";

export interface LoanTerms {
  readonly type: LoanType;
  /** Charged rate by policy year, percent. */
  chargedCurrent: (policyYear: number) => number;
  /** Guaranteed maximum charged rate, percent. */
  readonly chargedGuaranteedMax: number;
  /** Credited on the loaned collateral, percent. null = it tracks the index. */
  readonly creditedCurrent: number | null;
  readonly creditedGuaranteed: number;
  /** True when the collateral stays in the index strategies. */
  readonly collateralStaysIndexed: boolean;
  readonly source: string;
  readonly asOf: string;
}

/** Nationwide Accumulator III, Declared Rate Loan. */
export const DECLARED_RATE: LoanTerms = {
  type: "declared",
  chargedCurrent: (y) => (y <= 10 ? 3.90 : 3.00),
  chargedGuaranteedMax: 3.90,
  creditedCurrent: 3.00,
  creditedGuaranteed: 1.00,
  collateralStaysIndexed: false,
  source: "Nationwide Indexed UL Accumulator III illustration — 'Any Policy Loan will be charged interest at the following rates' and 'The loaned portion of the Accumulated Value will be credited interest at the following rates'",
  asOf: "2026-03-19",
};

/** Nationwide Accumulator III, Alternative Policy Loan. */
export const PARTICIPATING: LoanTerms = {
  type: "participating",
  chargedCurrent: () => 5.00,
  chargedGuaranteedMax: 8.00,
  creditedCurrent: null,              // tracks the index strategy
  creditedGuaranteed: 0,              // the floor, which is 0%
  collateralStaysIndexed: true,
  source: "Nationwide Indexed UL Accumulator III illustration — 'Alternative Policy Loans ... the money borrowed remains allocated to the selected interest crediting strategies and continues to receive the interest credited to those strategies', charged Current 5.00% / Guaranteed Maximum 8.00%",
  asOf: "2026-03-19",
};

export interface LoanYear {
  policyYear: number;
  indexCredit: number;
  chargedRate: number;
  creditedOnCollateral: number;
  /** creditedOnCollateral − chargedRate. The number that decides everything. */
  netSpread: number;
  loanBalance: number;
  accountValue: number;
  /** accountValue − loanBalance. Below zero means the policy has lapsed. */
  equity: number;
  lapsed: boolean;
}

export interface LoanRunInput {
  /** Index credits by policy year, percent. Already capped and floored. */
  indexCredits: readonly number[];
  startingAccountValue: number;
  /** Drawn each year from the first draw year. */
  annualDraw: number;
  firstDrawYear: number;
  /** Total premium paid in. Cost basis for the tax-at-lapse calculation. */
  costBasis: number;
  /** Annual policy charges as a percent of account value. */
  policyChargePct: number;
  loanType: LoanType;
  /** Run the guaranteed column instead of current. */
  guaranteed?: boolean;
  /** Age at issue, for the overloan rider gate. */
  issueAge: number;
}

export interface LoanRunResult {
  years: LoanYear[];
  lapseYear: number | null;
  /** Ordinary income assessed in the lapse year. Zero if it never lapses. */
  phantomIncomeAtLapse: number;
  /** Total credited on collateral less total charged. Positive = the bet paid. */
  lifetimeNetOnLoan: number;
  /** Death benefit outcome: loan is netted, never taxed as income. */
  survivedToDeathBenefit: boolean;
  /** First year all three overloan-rider conditions are met, or null. */
  overloanEligibleYear: number | null;
  warnings: string[];
}

export function termsFor(t: LoanType): LoanTerms {
  return t === "declared" ? DECLARED_RATE : PARTICIPATING;
}

/**
 * Overloan Lapse Protection Rider II gate: age 65 AND policy year 15.
 *
 * Returned as a year rather than a boolean because the gap is the point — a
 * plan that borrows from year 2 has no backstop for thirteen years minimum,
 * and longer if the insured is under 50 at issue.
 */
export function overloanEligibleYear(issueAge: number, years: number): number | null {
  for (let y = 1; y <= years; y++) {
    if (issueAge + y - 1 >= 65 && y >= 15) return y;
  }
  return null;
}

export function runLoan(input: LoanRunInput): LoanRunResult {
  const terms = termsFor(input.loanType);
  const rows: LoanYear[] = [];
  const warnings: string[] = [];
  let av = input.startingAccountValue;
  let collateral = 0;   // only used by the declared loan, which moves money out
  let loan = 0;
  let lapseYear: number | null = null;
  let totalCredited = 0, totalCharged = 0;

  for (let i = 0; i < input.indexCredits.length; i++) {
    const y = i + 1;
    const indexCredit = input.indexCredits[i];

    const chargedRate = input.guaranteed ? terms.chargedGuaranteedMax : terms.chargedCurrent(y);
    // The whole distinction in one line: participating collateral tracks the
    // index, declared collateral gets a flat declared rate.
    const creditedOnCollateral = terms.collateralStaysIndexed
      ? (input.guaranteed ? terms.creditedGuaranteed : indexCredit)
      : (input.guaranteed ? terms.creditedGuaranteed : (terms.creditedCurrent ?? 0));

    if (y >= input.firstDrawYear && !lapseYear) {
      loan += input.annualDraw;
      // THE DIFFERENCE BETWEEN THE TWO LOANS, IN ONE LINE.
      //
      // Participating: the money comes from the carrier's general account and
      // the policy's own value is untouched — "remains allocated to the
      // selected interest crediting strategies". Nothing leaves the market.
      //
      // Declared: the borrowed amount is moved out of the index strategies
      // into a loan-collateral account paying the declared rate. It leaves.
      if (!terms.collateralStaysIndexed) {
        av -= input.annualDraw;
        collateral += input.annualDraw;
      }
    }

    // Interest is added to the loan, never billed. "Loan Interest Payment
    // Method: Borrow" on every illustration in this set.
    const chargeThisYear = loan * (chargedRate / 100);
    loan += chargeThisYear;
    totalCharged += chargeThisYear;

    // Account value earns the index credit on whatever is still in the index.
    // Under a participating loan that is everything, which is the whole point.
    const indexCreditDollars = av * (indexCredit / 100);
    av += indexCreditDollars;

    // Collateral moved out under a declared loan earns the declared rate.
    const collateralCredit = collateral * (creditedOnCollateral / 100);
    collateral += collateralCredit;

    // What the collateral earned BECAUSE it was borrowed against, for the
    // lifetime-net figure: under a participating loan the borrowed amount is
    // still earning the index credit, and that is the credit being compared
    // against the charge.
    totalCredited += terms.collateralStaysIndexed
      ? loan * (indexCredit / 100)
      : collateralCredit;

    av -= av * (input.policyChargePct / 100);

    const equity = av + collateral - loan;
    if (equity <= 0 && !lapseYear) {
      lapseYear = y;
      warnings.push(
        `Policy lapses in year ${y}. The loan balance overtook the account value. ` +
        `Everything below this line is what happens next, not a projection of recovery.`,
      );
    }

    rows.push({
      policyYear: y, indexCredit, chargedRate, creditedOnCollateral,
      netSpread: Number((creditedOnCollateral - chargedRate).toFixed(2)),
      loanBalance: loan, accountValue: av + collateral, equity, lapsed: lapseYear !== null && y >= lapseYear,
    });
  }

  const elig = overloanEligibleYear(input.issueAge, input.indexCredits.length);
  // Tax at lapse: the loan balance is deemed distributed. Basis comes off; the
  // rest is ordinary income, in one year, with no cash arriving to pay it.
  const phantom = lapseYear ? Math.max(0, rows[lapseYear - 1].loanBalance - input.costBasis) : 0;

  if (lapseYear && elig !== null && lapseYear < elig) {
    warnings.push(
      `The lapse lands in year ${lapseYear}, before the Overloan Lapse Protection Rider II can be invoked in year ${elig} ` +
      `(it requires age 65 AND the 15th policy anniversary). The backstop does not exist yet when it is needed.`,
    );
  }
  if (phantom > 0) {
    warnings.push(
      `Phantom income of $${Math.round(phantom).toLocaleString()} assessed as ordinary income in year ${lapseYear}. ` +
      `The policyholder receives nothing and owes tax on it.`,
    );
  }
  if (input.loanType === "participating") {
    warnings.push(
      "Alternative Loans are more volatile than Declared Rate Loans — Nationwide's own wording. The charged rate is set quarterly at the carrier's discretion and the credited side can be 0%.",
    );
  }
  if (elig !== null) {
    warnings.push(
      "Overloan rider tax treatment is unsettled: the illustration states neither the IRS nor the courts have ruled, and that the indebtedness could be treated as a taxable distribution.",
    );
  }

  return {
    years: rows, lapseYear,
    phantomIncomeAtLapse: phantom,
    lifetimeNetOnLoan: Number((totalCredited - totalCharged).toFixed(2)),
    survivedToDeathBenefit: lapseYear === null,
    overloanEligibleYear: elig,
    warnings,
  };
}

/** Run both loan types on the same credits and report the difference. */
export function compareLoanTypes(input: Omit<LoanRunInput, "loanType">) {
  const declared = runLoan({ ...input, loanType: "declared" });
  const participating = runLoan({ ...input, loanType: "participating" });
  return {
    declared, participating,
    spreadAdvantage: Number((participating.lifetimeNetOnLoan - declared.lifetimeNetOnLoan).toFixed(2)),
    bothSurvive: declared.survivedToDeathBenefit && participating.survivedToDeathBenefit,
    /** The honest summary: participating wins on expectation and loses on variance. */
    verdict:
      participating.lifetimeNetOnLoan > declared.lifetimeNetOnLoan
        ? "The participating loan earned more on the collateral than the declared loan over this exact sequence. It would have lost more over a worse one — same mechanism, opposite sign."
        : "Over this sequence the declared loan did better. The participating loan's floor is 0% credited against a rate still charged, and this run found that.",
  };
}

export const LOAN_DISCLOSURE =
  "Loan terms are transcribed from Nationwide Indexed UL Accumulator III illustrations. " +
  "Declared Rate: charged 3.90% years 1-10 / 3.00% years 11+, credited 3.00% (guaranteed 3.90% charged / 1.00% credited). " +
  "Alternative (participating): charged 5.00% current, 8.00% guaranteed maximum, set quarterly by Nationwide in advance, " +
  "with the borrowed amount remaining allocated to the index strategies. Neither rate is fixed for the life of the policy.";

// ============================================================
// CARRIER REGISTRY — three carriers, three different machines.
//
// Transcribed 23 September 2026 from illustrations supplied by the operator.
// Where a figure is not in the document it is `null` and says so. Nothing here
// is filled in from memory or from a competitor's terms.
// ============================================================

export interface CarrierLoanProfile {
  carrier: string;
  product: string;
  kind: "iul" | "whole_life";
  /** The conservative loan: what it charges and what it credits back. */
  declaredCharged: string;
  declaredCredited: string;
  /** The participating loan, where the collateral keeps index exposure. */
  participatingCharged: string | null;
  participatingCredited: string | null;
  /** True when the carrier can move the goalposts on which accounts qualify. */
  carrierMayChangeEligibleAccounts: boolean;
  notes: readonly string[];
  source: string;
  asOf: string;
}

export const CARRIER_LOAN_PROFILES: readonly CarrierLoanProfile[] = [
  {
    carrier: "Nationwide",
    product: "Indexed UL Accumulator III",
    kind: "iul",
    declaredCharged: "3.90% years 1–10, 3.00% years 11+ (current); 3.90% guaranteed",
    declaredCredited: "3.00% current; 1.00% guaranteed",
    participatingCharged: "5.00% current; 8.00% guaranteed maximum; set quarterly, declared in advance",
    participatingCredited: "the index strategy's own credit — 0% floor",
    carrierMayChangeEligibleAccounts: true,
    notes: [
      "'Alternative Policy Loans — the money borrowed remains allocated to the selected interest crediting strategies and continues to receive the interest credited to those strategies.'",
      "'Nationwide reserves the right to designate which indexed interest strategies are available for new alternative loans in the future.'",
      "'Alternative Loans are more volatile than Declared Rate Loans because the interest charged and credited both can vary more.'",
      "Overloan Lapse Protection Rider II gate: age 65 AND 15th anniversary AND a trigger point by attained age. Neither the IRS nor the courts have ruled on its treatment.",
    ],
    source: "Nationwide Indexed UL Accumulator III illustration, Form ICC25-NWLA-692, prepared 19 Mar 2026",
    asOf: "2026-03-19",
  },
  {
    carrier: "Pacific Life",
    product: "Pacific Horizon ECV IUL (GPT)",
    kind: "iul",
    declaredCharged: null as unknown as string,
    declaredCredited: null as unknown as string,
    participatingCharged: null,
    participatingCredited: null,
    carrierMayChangeEligibleAccounts: true,
    notes: [
      "RATES NOT IN THE DOCUMENT. This illustration runs 'Policy Distributions 0' — no loans are illustrated — so no loan rate table is populated. The same gap appeared on the Securian BGA III run for this client.",
      "Loan types exist and are configurable: 'Switch Loan Debt from Standard to Alternate' and back, both set to No here.",
      "'All policy charges, Standard Policy Loans and Withdrawals will be deducted from the Fixed Account. If the Fixed Account is depleted, any remaining deductions are taken proportionate to each Segment Value across all segments in the Indexed Accounts.' — a standard loan pulls money OUT of the index.",
      "'The Alternate Interest Rate applies only to eligible accounts ... Pacific Life Insurance Company may change the eligible accounts at any time.'",
      "Illustrated interest rate 4.50% years 1–52; guaranteed 1.00%.",
      "Carries SVER coverage and a year-8 conversion rider at no cost, surrender charges waived, no evidence of insurability.",
    ],
    source: "Pacific Horizon ECV IUL illustration, Form Series ICC21 P21IUL, run 16 Sep 2026 for M. Corrales",
    asOf: "2026-09-16",
  },
  {
    carrier: "Lafayette Life",
    product: "Patriot 2022 Level Premium Whole Life",
    kind: "whole_life",
    declaredCharged: "adjustable, changed year to year by the carrier; minimum 0.00%, maximum 8.00%",
    declaredCredited: "none — 'Interest that you pay to us is not credited to the cash value of the policy and it does not increase the cash value of the policy.'",
    participatingCharged: null,
    participatingCredited: null,
    carrierMayChangeEligibleAccounts: false,
    notes: [
      "Whole life, not IUL. There is no index, no cap and no floor — growth comes from guaranteed cash value plus a dividend that is NOT guaranteed.",
      "No participating-loan mechanism. The IUL arbitrage does not exist on this product.",
      "'Any interest that is not paid at the end of a policy year is added to the loan balance, which will also be charged interest.'",
      "'A policy dividend, if any, may not be sufficient to pay loan interest.'",
      "Illustrated at 100% of the current dividend scale — the top of the range, and the scale can fall.",
    ],
    source: "Lafayette Life Patriot 2022 illustration, Policy Form LL-01 2104 CA",
    asOf: "2026-09-23",
  },
];

/** Carriers whose participating-loan terms are documented well enough to model. */
export function modellableCarriers(): CarrierLoanProfile[] {
  return CARRIER_LOAN_PROFILES.filter((c) => c.participatingCharged !== null);
}

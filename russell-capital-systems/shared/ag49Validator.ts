/**
 * SI-001 — the IUL illustration compliance engine, aimed the other way.
 *
 * The version of SI-001 that the portfolio review dropped was described as
 * "maximize persuasive impact within AG49", and it was dropped for a good
 * reason: AG 49-A already prescribes the benchmark, and a claim phrased as
 * working the edges of a consumer-protection rule reads badly in a published
 * application and worse in a deposition.
 *
 * This is the same subject matter pointed at the opposite outcome. It does not
 * help an illustration get closer to the line. It takes a finished exhibit and
 * says which rules it breaks, in the regulator's own terms, before anyone
 * shows it to a client. That is a tool a carrier's compliance desk can buy,
 * which the other version never was.
 *
 * ## What it checks
 *
 * The amendment adopted 21 November 2025, binding on policies sold on or after
 * 1 April 2026, plus the standing AG 49 / 49-A / 49-B constraints:
 *
 *   - illustrated rate above the maximum illustrated rate
 *   - historical window shorter than 25 years
 *   - a table built from fewer than 10 years of index history
 *   - backtested performance for an index under 10 years old
 *   - a geometric average credited rate above the maximum illustrated rate
 *   - the mandated notice missing, paraphrased, or placed in a footnote
 *   - a constructed comparison presenting history as the expected outcome
 *
 * The last one is the only judgement call in the list, and it is passed in
 * rather than inferred: whether an exhibit is the disclosure AG 49 requires or
 * a marketing comparison built on top of it is a question about intent, and
 * this module will not pretend to read intent from a data structure.
 */

export type Severity = 'violation' | 'warning';

export interface Finding {
  readonly rule: string;
  readonly severity: Severity;
  /** What is wrong, in words a compliance reviewer would use. */
  readonly detail: string;
  /** The authority, so a reviewer can go and read it. */
  readonly authority: string;
}

export interface IllustrationExhibit {
  /** The rate illustrated forward, as a percentage. */
  readonly illustratedRate: number;
  /** The carrier's AG 49 maximum illustrated rate, as a percentage. */
  readonly maximumIllustratedRate: number;
  /** Years of history shown in the disclosure. */
  readonly historicalYearsShown: number;
  /** Age of the index itself, in years. */
  readonly indexAgeYears: number;
  /** A geometric average credited rate printed on the exhibit, if any. */
  readonly geometricAverageShown?: number;
  /** The exact notice text as it appears on the exhibit. */
  readonly noticeText?: string;
  /** Whether that notice sits at the top of the data section. */
  readonly noticeAtTopOfData?: boolean;
  /**
   * True when the exhibit is a marketer-built comparison presenting the
   * historical result as what the buyer should expect — not merely the
   * disclosure AG 49 prescribes. Supplied by the reviewer, never guessed.
   */
  readonly constructedComparison?: boolean;
  /**
   * The loan the illustration shows, where it shows one.
   *
   * Added because loan arbitrage is the most heavily scrutinised practice in the
   * whole IUL category — it is the reason AG 49-A exists — and this validator
   * had no rule about it. An exhibit could illustrate a credited rate far above
   * its loan charge, compound the difference for thirty years, and clear every
   * check in this file. That gap mattered more than any of the ones it did
   * catch, because the arbitrage story is the one a client remembers.
   */
  readonly loan?: LoanIllustration;
}

export interface LoanIllustration {
  /**
   * Which instrument. These are different products on the same page and the
   * differences are usually what is being glossed over: a fixed or indexed loan
   * moves the borrowed money out to a loan account at a stated charge, while a
   * variable loan leaves it in the indexed account still earning, at a charge
   * that floats.
   */
  readonly type: 'fixed' | 'indexed' | 'variable' | 'wash';
  /** Credited rate the illustration applies to loaned value, as a percentage. */
  readonly creditedRateOnLoanedValue: number;
  /** Loan charge the illustration applies, as a percentage. */
  readonly loanChargeRate: number;
  /**
   * True when the illustration holds the charge constant for the whole
   * projection. For a variable loan that is a statement about the future cost
   * of money, not a policy term.
   */
  readonly chargeIllustratedAsConstant?: boolean;
}

/** Verbatim. A paraphrase does not satisfy the amendment. */
export const MANDATED_NOTICE =
  'Historical index changes shown in this illustration are not indicative of future returns.';

export const MIN_INDEX_HISTORY_YEARS = 10;
export const REQUIRED_HISTORICAL_PERIOD_YEARS = 25;

/**
 * The most an illustration may show credited on loaned value above what it
 * charges for the loan, in percentage points.
 *
 * AG 49-A caps illustrated loan arbitrage at 50 basis points. A spread wider
 * than that is not an aggressive assumption; it is a non-compliant illustration,
 * and it is the specific abuse the guideline was written to stop. The real
 * mechanism can still be described — a participating loan genuinely leaves the
 * money invested — but an ILLUSTRATION may not project the spread.
 */
export const MAX_ILLUSTRATED_LOAN_ARBITRAGE_PP = 0.5;

const AG49A_2025 = 'NAIC AG 49-A, amendment adopted 21 November 2025';
const AG49 = 'NAIC AG 49 (2015), as amended by AG 49-A (2020) and AG 49-B (2023)';

/**
 * Check an exhibit. Returns every finding rather than the first, because a
 * reviewer fixing one violation wants to know about the other three now, not
 * on the next pass.
 */
export function validateExhibit(x: IllustrationExhibit): readonly Finding[] {
  const out: Finding[] = [];

  if (x.illustratedRate > x.maximumIllustratedRate) {
    out.push({
      rule: 'illustrated_rate_above_maximum',
      severity: 'violation',
      detail: `The illustration credits ${x.illustratedRate.toFixed(2)}% against a maximum illustrated rate of ${x.maximumIllustratedRate.toFixed(2)}%.`,
      authority: AG49,
    });
  }

  if (x.indexAgeYears < MIN_INDEX_HISTORY_YEARS) {
    out.push({
      rule: 'index_too_young_to_backtest',
      severity: 'violation',
      detail: `The index has ${x.indexAgeYears} years of history. Backtested performance may not be shown for an index under ${MIN_INDEX_HISTORY_YEARS} years old.`,
      authority: AG49A_2025,
    });
  }

  if (x.historicalYearsShown < MIN_INDEX_HISTORY_YEARS) {
    out.push({
      rule: 'table_below_minimum_history',
      severity: 'violation',
      detail: `The disclosure shows ${x.historicalYearsShown} years. A historical table requires at least ${MIN_INDEX_HISTORY_YEARS}.`,
      authority: AG49A_2025,
    });
  } else if (x.historicalYearsShown < REQUIRED_HISTORICAL_PERIOD_YEARS) {
    out.push({
      rule: 'historical_period_below_25_years',
      severity: 'violation',
      detail: `The disclosure shows ${x.historicalYearsShown} years. The period rose from 20 to ${REQUIRED_HISTORICAL_PERIOD_YEARS} years for policies sold on or after 1 April 2026.`,
      authority: AG49A_2025,
    });
  }

  if (typeof x.geometricAverageShown === 'number' && x.geometricAverageShown > x.maximumIllustratedRate) {
    out.push({
      rule: 'geometric_average_above_maximum',
      severity: 'violation',
      detail: `A geometric average credited rate of ${x.geometricAverageShown.toFixed(2)}% is shown against a maximum illustrated rate of ${x.maximumIllustratedRate.toFixed(2)}%. Show year-by-year credited values instead.`,
      authority: AG49A_2025,
    });
  }

  const notice = (x.noticeText ?? '').trim();
  if (!notice) {
    out.push({
      rule: 'mandated_notice_missing',
      severity: 'violation',
      detail: `The required notice is absent. It must read, verbatim: "${MANDATED_NOTICE}"`,
      authority: AG49A_2025,
    });
  } else if (notice !== MANDATED_NOTICE) {
    out.push({
      rule: 'mandated_notice_paraphrased',
      severity: 'violation',
      detail: `The notice is paraphrased. Required verbatim: "${MANDATED_NOTICE}" — found: "${notice}"`,
      authority: AG49A_2025,
    });
  } else if (x.noticeAtTopOfData === false) {
    out.push({
      rule: 'mandated_notice_in_footnote',
      severity: 'violation',
      detail: 'The notice is correct but placed below the data. It belongs at the top of the data section; a footnote does not satisfy the requirement.',
      authority: AG49A_2025,
    });
  }

  if (x.constructedComparison) {
    out.push({
      rule: 'constructed_comparison',
      severity: 'violation',
      detail: 'A comparison presenting historical results as the expected outcome of an illustrated policy is prohibited. The prescribed historical disclosure is unaffected and should still be shown.',
      authority: AG49A_2025,
    });
  }

  if (x.loan) {
    const spread = x.loan.creditedRateOnLoanedValue - x.loan.loanChargeRate;

    if (spread > MAX_ILLUSTRATED_LOAN_ARBITRAGE_PP) {
      out.push({
        rule: 'illustrated_loan_arbitrage_above_limit',
        severity: 'violation',
        detail:
          `The illustration credits ${x.loan.creditedRateOnLoanedValue.toFixed(2)}% on loaned value against a ` +
          `${x.loan.loanChargeRate.toFixed(2)}% loan charge — a spread of ${spread.toFixed(2)} percentage points, ` +
          `against a limit of ${MAX_ILLUSTRATED_LOAN_ARBITRAGE_PP.toFixed(2)}. Illustrated loan arbitrage above that ` +
          `limit is the practice AG 49-A was written to stop. The participating-loan mechanism may still be ` +
          `described in words; it may not be projected as a spread.`,
        authority: AG49,
      });
    }

    if (x.loan.type === 'variable' && x.loan.chargeIllustratedAsConstant) {
      out.push({
        rule: 'variable_loan_charge_illustrated_as_constant',
        severity: 'violation',
        detail:
          'A variable loan charge is held constant for the whole projection. The charge floats with an external ' +
          'rate, so holding it flat converts an assumption about the future cost of money into what reads as a ' +
          'policy term. Illustrate it at its current level and show the effect of it rising, or use the fixed or ' +
          'indexed loan, whose charges are contractual.',
        authority: AG49,
      });
    }

    if (x.loan.type === 'wash' && spread > 0) {
      out.push({
        rule: 'wash_loan_illustrated_with_positive_spread',
        severity: 'violation',
        detail:
          `A wash loan credits and charges the same rate by definition; this exhibit shows a ${spread.toFixed(2)} ` +
          `percentage point spread on one. Either the loan is not a wash loan or the rates are wrong.`,
        authority: AG49,
      });
    }

    // Not a violation, but the single most common conflation in this category,
    // and the one that turns a defensible case into an indefensible one.
    if (x.loan.type === 'variable' && x.loan.loanChargeRate === 4.75) {
      out.push({
        rule: 'indexed_loan_charge_paired_with_variable_loan',
        severity: 'warning',
        detail:
          'A variable loan is shown at 4.75%, which is a constant indexed-loan charge on several carriers\' ' +
          'pages. The variable loan is the one that leaves the money earning, and it is also the one whose charge ' +
          'floats; pairing its crediting feature with the indexed loan\'s fixed charge describes a product that ' +
          'does not exist. Confirm which instrument this is against the carrier\'s loan page.',
        authority: AG49,
      });
    }
  }

  return out;
}

export function passes(x: IllustrationExhibit): boolean {
  return validateExhibit(x).every((f) => f.severity !== 'violation');
}

/** One line for a reviewer's log. */
export function summarise(x: IllustrationExhibit): string {
  const f = validateExhibit(x);
  const v = f.filter((i) => i.severity === 'violation').length;
  if (v === 0) return 'No violations found against AG 49-A as amended 21 November 2025.';
  return `${v} violation${v === 1 ? '' : 's'}: ${f.map((i) => i.rule).join(', ')}.`;
}

/**
 * Credit unions as lenders, and the difference between a published rate
 * assumption and an actual underwriting criterion.
 *
 * ## The distinction this module exists to enforce
 *
 * Ask what a credit union's underwriting criteria are and the internet will
 * hand you a credit score and an LTV. Almost always those numbers came off a
 * rate sheet, and a rate sheet is not an underwriting guideline. SchoolsFirst
 * FCU says so on its own page, in bold, directly under the figures:
 *
 *     "Rates reflect the following loan assumptions BUT ARE NOT REQUIREMENTS
 *      TO APPLY: ... A 740 credit score for conventional loans and 620 for FHA
 *      loans ... A 97% loan-to-value for SchoolsFirst FCU HomeAccess, 96.50%
 *      for FHA, 80.01% for the No PMI programs and 60% for all others."
 *
 * A 740 there means "this is the borrower we priced" — not "below this we
 * decline". Encoding it as a minimum would tell an advisor to stop a client
 * who would in fact be approved, and there is no way to recover a client you
 * told not to apply.
 *
 * So every figure here is tagged `requirement` or `rateAssumption`, and the
 * two are never mixed in a comparison. USALLIANCE states the same thing from
 * the other side: "Not all applicants will qualify for the maximum credit
 * line, the advertised rate, or the maximum combined loan-to-value amount."
 *
 * ## What credit unions actually publish
 *
 * Reliably: membership eligibility, product maximums and minimums, maximum
 * CLTV for a named product, whether investment property is eligible, and rate
 * tiers.
 *
 * Almost never: the debt-to-income cap, the minimum score at which the file
 * is declined, reserve requirements, overlays. Those are internal credit
 * policy. Where a field below is null it is null because nobody published it,
 * and the reason is recorded rather than the gap being filled with a number
 * that looks plausible.
 *
 * ## Why this matters to the rest of the platform
 *
 * The rental-enterprise and mortgage paths assume a lender exists. Two of the
 * ten here exclude investment property from their equity products outright,
 * which is the kind of fact that ends a strategy before it starts and is
 * cheaper to learn here than at application.
 *
 * ## Provenance
 *
 * Every entry carries the URL it was read from and the date it was read.
 * Credit-union terms change without notice; anything past its recheck date
 * should be treated as stale rather than current. `stale()` computes it.
 */

export type FigureKind =
  /**
   * The institution states this as a condition. Failing it means the product
   * is not available on those terms.
   */
  | 'requirement'
  /**
   * The institution used this to compute an advertised rate and, in most
   * cases, says explicitly that it is not a condition of applying.
   */
  | 'rateAssumption';

export interface SourcedFigure<T> {
  readonly value: T;
  readonly kind: FigureKind;
  /** Quoted or closely paraphrased from the page. */
  readonly asPublished: string;
}

export interface CreditUnion {
  readonly id: string;
  readonly name: string;
  /** Where lending is offered, as the institution states it. */
  readonly footprint: string;
  /**
   * Who may join. The first gate on every credit union product, and the one
   * most often missed when a strategy is designed before a lender is chosen.
   */
  readonly membership: string;
  /** True only when the institution offers a path open to the general public. */
  readonly openToAnyone: boolean;

  /** Maximum combined loan-to-value on the named equity product. */
  readonly maxCltvPct: SourcedFigure<number> | null;
  /** Minimum credit score, where the institution publishes one. */
  readonly minCreditScore: SourcedFigure<number> | null;
  /** Debt-to-income ceiling, where published. */
  readonly maxDtiPct: SourcedFigure<number> | null;
  readonly minLoanUsd: SourcedFigure<number> | null;
  readonly maxLoanUsd: SourcedFigure<number> | null;

  /**
   * Whether an investment or rental property is eligible for the equity
   * product. Null where the page is silent — silence is not a yes.
   */
  readonly investmentPropertyEligible: boolean | null;
  readonly investmentPropertyNote: string;

  /** Fields the institution does not publish, and so cannot be filled in. */
  readonly notPublished: readonly string[];

  readonly sourceUrl: string;
  /** ISO date the page was read. */
  readonly readOn: string;
  readonly note?: string;
}

/** How long a published lending term is treated as current. */
export const RECHECK_AFTER_DAYS = 90;

/**
 * Ten credit unions, carrying only what their own pages actually said.
 *
 * Chosen for range rather than size: two national, several regional, one
 * employer-tied, one university-tied — because the binding constraint on a
 * credit union is usually membership rather than credit, and a list of ten
 * giants would hide that.
 */
export const CREDIT_UNIONS: readonly CreditUnion[] = [
  {
    id: 'navy-federal',
    name: 'Navy Federal Credit Union',
    footprint: 'Nationwide',
    membership:
      'Active duty, retired and veteran military; DoD civilians, contractors, retirees and annuitants; immediate family and household members of any of those.',
    openToAnyone: false,
    maxCltvPct: null,
    minCreditScore: null,
    maxDtiPct: null,
    minLoanUsd: null,
    maxLoanUsd: null,
    investmentPropertyEligible: null,
    investmentPropertyNote: 'Not addressed on the membership page read.',
    notPublished: ['maxCltvPct', 'minCreditScore', 'maxDtiPct', 'investment property eligibility'],
    sourceUrl: 'https://navyfederal.org/membership/become-a-member.html',
    readOn: '2026-09-17',
    note:
      'Largest US credit union by assets and members. Membership is the binding constraint: there is no general-public path, so for a non-military client this institution is out before any credit question is reached. A $5 minimum share establishes membership.',
  },
  {
    id: 'schoolsfirst',
    name: 'SchoolsFirst Federal Credit Union',
    footprint: 'California',
    membership: 'School employees in California and their immediate family.',
    openToAnyone: false,
    maxCltvPct: {
      value: 97,
      kind: 'rateAssumption',
      asPublished:
        '97% LTV for SchoolsFirst FCU HomeAccess, 96.50% for FHA, 80.01% for the No PMI programs and 60% for all others — stated as a rate assumption, explicitly "not requirements to apply".',
    },
    minCreditScore: {
      value: 740,
      kind: 'rateAssumption',
      asPublished:
        'A 740 credit score for conventional loans and 620 for FHA loans — stated as a rate assumption, explicitly "not requirements to apply".',
    },
    maxDtiPct: null,
    minLoanUsd: null,
    maxLoanUsd: null,
    investmentPropertyEligible: null,
    investmentPropertyNote: 'Rates page is written for a primary residence; investment property not addressed.',
    notPublished: ['maxDtiPct', 'actual minimum score', 'actual maximum LTV'],
    sourceUrl: 'https://www.schoolsfirstfcu.org/rates/mortgage-purchase',
    readOn: '2026-09-17',
    note:
      'The clearest example on this list of why the requirement/assumption distinction is enforced. Both figures here are pricing inputs and the page says so in bold. Rates stated effective 3 September 2026.',
  },
  {
    id: 'cu-socal',
    name: 'Credit Union of Southern California',
    footprint: 'Southern California',
    membership: 'Open — the institution states that anyone can become a member.',
    openToAnyone: true,
    maxCltvPct: {
      value: 80,
      kind: 'requirement',
      asPublished: 'Up to 80% Loan-to-Value.',
    },
    minCreditScore: {
      value: 660,
      kind: 'requirement',
      asPublished: 'A minimum credit score of 660.',
    },
    maxDtiPct: null,
    minLoanUsd: null,
    maxLoanUsd: null,
    investmentPropertyEligible: null,
    investmentPropertyNote: 'Not addressed on the page read.',
    notPublished: ['maxDtiPct', 'investment property eligibility'],
    sourceUrl: 'https://www.cusocal.org/resources/blog/what-is-a-heloc-and-how-does-it-work/',
    readOn: '2026-09-17',
    note:
      'States a minimum score as an eligibility requirement rather than a pricing input, which is unusual and worth relying on more heavily than a rate-sheet figure.',
  },
  {
    id: 'usalliance',
    name: 'USALLIANCE Financial',
    footprint: 'Multi-state',
    membership:
      'NOT RETRIEVED. The HELOC page was read; the membership page was not. Do not assume a general-public path exists here.',
    // Set false deliberately. I did not read this institution's eligibility
    // page, and inferring "open to anyone" from the fact that it is a
    // multi-state credit union would be exactly the kind of plausible guess
    // this registry exists to keep out.
    openToAnyone: false,
    maxCltvPct: {
      value: 90,
      kind: 'rateAssumption',
      asPublished:
        'Borrow up to 90% of the home\'s value, qualified by: "Not all applicants will qualify for the maximum credit line, the advertised rate, or the maximum combined loan-to-value amount."',
    },
    minCreditScore: null,
    maxDtiPct: null,
    minLoanUsd: null,
    maxLoanUsd: null,
    investmentPropertyEligible: null,
    investmentPropertyNote: 'Not addressed on the page read.',
    notPublished: [
      'minCreditScore',
      'maxDtiPct',
      'investment property eligibility',
      'membership eligibility — not retrieved, so reachability here is unknown rather than restricted',
    ],
    sourceUrl: 'https://www.usalliance.org/home-lending-center/heloc',
    readOn: '2026-09-17',
    note:
      'The 90% is the top of a range, not a line anyone is entitled to. Rates quoted from Prime + 0.250%; a 10-year draw followed by a 20-year repayment.',
  },
  {
    id: 'first-city',
    name: 'First City Credit Union',
    footprint: 'Los Angeles County, California',
    membership: 'Los Angeles County ties; primary-member products.',
    openToAnyone: false,
    maxCltvPct: {
      value: 80,
      kind: 'requirement',
      asPublished: 'The maximum combined loan-to-value is 80%.',
    },
    minCreditScore: null,
    maxDtiPct: null,
    minLoanUsd: {
      value: 25_000,
      kind: 'requirement',
      asPublished: 'The minimum credit limit is $25,000.',
    },
    maxLoanUsd: {
      value: 399_000,
      kind: 'requirement',
      asPublished: 'The maximum is $399,000.',
    },
    investmentPropertyEligible: null,
    investmentPropertyNote: 'Not addressed on the page read.',
    notPublished: ['minCreditScore', 'maxDtiPct', 'investment property eligibility'],
    sourceUrl: 'https://www.firstcitycu.org/loans-credit/home-equity-loans-lines-of-credit',
    readOn: '2026-09-17',
    note:
      'A hard floor of $25,000 as well as a ceiling. A floor rules out the small draw a client may actually want, and is the kind of limit that only appears at application.',
  },
  {
    id: 'monterra',
    name: 'Monterra Credit Union',
    footprint: 'California',
    membership: 'California ties, formerly San Mateo Credit Union.',
    openToAnyone: false,
    maxCltvPct: {
      value: 75,
      kind: 'requirement',
      asPublished:
        'The 30-Due-in-15 Home Equity loan maximum combined loan-to-value is 75%.',
    },
    minCreditScore: null,
    maxDtiPct: null,
    minLoanUsd: {
      value: 25_000,
      kind: 'requirement',
      asPublished: 'Borrowing amounts from $25,000.',
    },
    maxLoanUsd: {
      value: 600_000,
      kind: 'requirement',
      asPublished: 'The 30-Due-in-15 Home Equity loan maximum loan amount is $600,000.',
    },
    investmentPropertyEligible: false,
    investmentPropertyNote: 'Stated outright: "Investment properties are not eligible."',
    notPublished: ['minCreditScore', 'maxDtiPct'],
    sourceUrl: 'https://www.monterra.org/personal/mortgage-home-equity/home-equity-loans-and-lines-of-credit',
    readOn: '2026-09-17',
    note:
      'The tightest CLTV on this list at 75%, and an explicit exclusion of investment property. For the rental-enterprise path this institution is ruled out on the product page rather than at underwriting.',
  },
  {
    id: 'members-1st',
    name: 'Members 1st Federal Credit Union',
    footprint: 'Pennsylvania, Maryland and New Jersey residents only',
    membership: 'Regional; non-members must join to meet eligibility.',
    openToAnyone: false,
    maxCltvPct: {
      value: 100,
      kind: 'rateAssumption',
      asPublished: 'Borrow up to 100% of home equity — excluding rental properties.',
    },
    minCreditScore: null,
    maxDtiPct: null,
    minLoanUsd: null,
    maxLoanUsd: null,
    investmentPropertyEligible: false,
    investmentPropertyNote: 'Rental properties are excluded from the equity line.',
    notPublished: ['minCreditScore', 'maxDtiPct'],
    sourceUrl: 'https://www.members1st.org/personal/borrow/home-equity-freedom-line-of-credit',
    readOn: '2026-09-17',
    note:
      'The most generous headline CLTV here and the narrowest footprint — three states. Introductory 1.99% APR for six months, then from 6.75%. Approval quoted at two to six weeks, which matters when a strategy has a funding date.',
  },
  {
    id: 'university-cu',
    name: 'University Credit Union',
    footprint: 'California and named universities nationally',
    membership:
      'Employees, students, alumni and direct family of named universities — UCLA, Pepperdine, Loyola Marymount, Saint Mary\'s, UC Davis, UC San Diego, Georgia Tech and others.',
    openToAnyone: false,
    maxCltvPct: {
      value: 80,
      kind: 'requirement',
      asPublished: 'Members can borrow up to 80% of appraised value, the combined loan-to-value ratio.',
    },
    minCreditScore: {
      value: 620,
      kind: 'rateAssumption',
      asPublished:
        'Described among "typical requirements" in an explanatory article — a minimum credit score of 620 — rather than on a product page.',
    },
    maxDtiPct: {
      value: 43,
      kind: 'rateAssumption',
      asPublished:
        'Described among "typical requirements" — a debt-to-income ratio of 43% or less. General guidance, not stated as this institution\'s credit policy.',
    },
    minLoanUsd: null,
    maxLoanUsd: null,
    notPublished: ['this institution\'s own credit policy, as distinct from general guidance'],
    investmentPropertyEligible: null,
    investmentPropertyNote: 'Not addressed in the article read.',
    sourceUrl: 'https://www.ucu.org/blog/understanding-heloc-requirements',
    readOn: '2026-09-17',
    note:
      'The only DTI figure on this list, and it comes from an explanatory blog post describing what lenders generally want rather than from a product page. Graded as an assumption for that reason — a number found in an article about the industry is not a commitment by the institution that published the article.',
  },
  {
    id: 'penfed',
    name: 'PenFed Credit Union',
    footprint: 'Nationwide',
    membership:
      'Open to anyone — one of the few large credit unions with a general-public path.',
    openToAnyone: true,
    maxCltvPct: null,
    minCreditScore: null,
    maxDtiPct: null,
    minLoanUsd: null,
    maxLoanUsd: null,
    investmentPropertyEligible: null,
    investmentPropertyNote: 'Not retrieved.',
    notPublished: [
      'Nothing was retrieved for this institution beyond membership. The lending pages were not reached in this pass, so every lending field is absent rather than absent-from-publication.',
    ],
    sourceUrl: 'https://www.bankrate.com/banking/biggest-credit-unions-in-america',
    readOn: '2026-09-17',
    note:
      'Membership is third-party sourced and the asset figures on that page are dated December 2025. Included because the open-to-anyone path makes it reachable for any client, and flagged because its terms have not been read from the institution itself.',
  },
  {
    id: 'alliant',
    name: 'Alliant Credit Union',
    footprint: 'Nationwide, digital-first',
    membership:
      'Open to anyone — joins via a partner-charity donation where no other eligibility applies.',
    openToAnyone: true,
    maxCltvPct: null,
    minCreditScore: null,
    maxDtiPct: null,
    minLoanUsd: null,
    maxLoanUsd: null,
    investmentPropertyEligible: null,
    investmentPropertyNote: 'Not retrieved.',
    notPublished: [
      'Nothing was retrieved for this institution beyond membership. The lending pages were not reached in this pass, so every lending field is absent rather than absent-from-publication.',
    ],
    sourceUrl: 'https://www.bankrate.com/banking/biggest-credit-unions-in-america',
    readOn: '2026-09-17',
    note:
      'Same status as PenFed: reachable by anyone, terms not yet read from the source. Both are the highest-value entries to complete next precisely because membership does not rule anybody out.',
  },
];

// ─── Reading the registry ────────────────────────────────────────────────────

/** Whether a published term has passed its recheck date. */
export function stale(cu: CreditUnion, today = new Date()): boolean {
  const read = new Date(cu.readOn + 'T00:00:00Z');
  const days = (today.getTime() - read.getTime()) / 86_400_000;
  return days > RECHECK_AFTER_DAYS;
}

/**
 * Figures safe to rely on as conditions — requirements only.
 *
 * Any comparison across institutions must run on this and not on the raw
 * fields, because a 97% rate assumption and a 75% requirement are not
 * comparable quantities and putting them in one column implies they are.
 */
export function requirementsOnly(cu: CreditUnion): {
  maxCltvPct: number | null;
  minCreditScore: number | null;
  maxDtiPct: number | null;
  minLoanUsd: number | null;
  maxLoanUsd: number | null;
} {
  const only = <T>(f: SourcedFigure<T> | null): T | null =>
    f && f.kind === 'requirement' ? f.value : null;
  return {
    maxCltvPct: only(cu.maxCltvPct),
    minCreditScore: only(cu.minCreditScore),
    maxDtiPct: only(cu.maxDtiPct),
    minLoanUsd: only(cu.minLoanUsd),
    maxLoanUsd: only(cu.maxLoanUsd),
  };
}

export interface Reachability {
  readonly id: string;
  readonly name: string;
  readonly reachable: boolean;
  readonly reason: string;
}

/**
 * Which institutions a person could actually approach, membership first.
 *
 * Membership is checked before anything else because it is absolute: no
 * credit profile overcomes not being eligible to join, and an advisor who
 * compares rates before checking eligibility has wasted the client's time.
 */
export function reachableFor(
  opts: { military?: boolean; state?: string; californiaSchoolEmployee?: boolean } = {}
): readonly Reachability[] {
  return CREDIT_UNIONS.map((cu) => {
    if (cu.openToAnyone) {
      return { id: cu.id, name: cu.name, reachable: true, reason: 'Open to anyone.' };
    }
    if (cu.id === 'navy-federal') {
      return {
        id: cu.id,
        name: cu.name,
        reachable: Boolean(opts.military),
        reason: opts.military
          ? 'Military, DoD or family eligibility.'
          : 'No general-public path; military, DoD or family eligibility required.',
      };
    }
    if (cu.id === 'schoolsfirst') {
      return {
        id: cu.id,
        name: cu.name,
        reachable: Boolean(opts.californiaSchoolEmployee),
        reason: opts.californiaSchoolEmployee
          ? 'California school employee or immediate family.'
          : 'Restricted to California school employees and their families.',
      };
    }
    if (cu.id === 'members-1st') {
      const ok = ['PA', 'MD', 'NJ'].includes((opts.state ?? '').toUpperCase());
      return {
        id: cu.id,
        name: cu.name,
        reachable: ok,
        reason: ok ? 'Resident of PA, MD or NJ.' : 'Pennsylvania, Maryland and New Jersey residents only.',
      };
    }
    return {
      id: cu.id,
      name: cu.name,
      reachable: false,
      reason: `Membership is restricted: ${cu.membership}`,
    };
  });
}

/** Institutions whose equity products exclude investment property. */
export function excludesInvestmentProperty(): readonly CreditUnion[] {
  return CREDIT_UNIONS.filter((cu) => cu.investmentPropertyEligible === false);
}

export interface RegistryGaps {
  readonly totalInstitutions: number;
  readonly withAnyRequirement: number;
  readonly withNoLendingTermsRetrieved: readonly string[];
  readonly dtiPublishedBy: readonly string[];
  readonly staleEntries: readonly string[];
  readonly note: string;
}

/** What the registry does not know, stated rather than implied. */
export function registryGaps(today = new Date()): RegistryGaps {
  const withNone = CREDIT_UNIONS.filter(
    (cu) => !cu.maxCltvPct && !cu.minCreditScore && !cu.maxDtiPct && !cu.minLoanUsd && !cu.maxLoanUsd
  );
  const withAnyRequirement = CREDIT_UNIONS.filter((cu) => {
    const r = requirementsOnly(cu);
    return Object.values(r).some((v) => v !== null);
  });
  const dti = CREDIT_UNIONS.filter((cu) => cu.maxDtiPct !== null);

  return {
    totalInstitutions: CREDIT_UNIONS.length,
    withAnyRequirement: withAnyRequirement.length,
    withNoLendingTermsRetrieved: withNone.map((c) => c.name),
    dtiPublishedBy: dti.map((c) => c.name),
    staleEntries: CREDIT_UNIONS.filter((cu) => stale(cu, today)).map((c) => c.name),
    note:
      'Debt-to-income caps and declination thresholds are internal credit policy at every institution here. Where they appear at all they come from explanatory articles describing the industry rather than from a product page, and they are graded as assumptions for that reason. An advisor who needs a real answer has to ask the institution, and this registry exists partly to make that gap visible rather than to paper over it.',
  };
}

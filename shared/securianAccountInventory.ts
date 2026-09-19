/**
 * Every Securian / Minnesota Life index allocation observed in this session,
 * with what is known about each one and — just as important — what is not.
 *
 * Assembled from four independent sources: a BGA3 portal segment ledger, a
 * BGA3 annual policy review, a BGA II annual policy review on a different
 * policy, and the BGA II product flier already in this repository. Where those
 * sources disagree, both readings are recorded and the disagreement is the
 * finding.
 *
 * ## The one rule this file exists to enforce
 *
 * Securian prints a participation rate on statements and portal modals that
 * does not determine the credit. It has now been caught being wrong in both
 * directions on four different accounts:
 *
 *   Balanced Indexed 2 (BGA II)   printed 110%   operative 0.84x   OVERSTATES
 *   Balanced Indexed 2 (BGA3)     printed 105%   struck at three rates
 *   Balanced Indexed 8 (PRISM)    printed 105%   operative 1.71x   UNDERSTATES
 *   Indexed Loan Account          printed 105%   operative 1.47x   UNDERSTATES
 *
 * CORRECTED since first written: Balanced Indexed 6 (PRISM 1-year) is the
 * counter-example. Its printed 105% reproduces its printed crediting rate on
 * all four segments exactly, so the field is NOT meaningless everywhere. It is
 * confirmed on one account and contradicted on three, which means it cannot be
 * assumed - a weaker and more accurate claim than the one above.
 *
 * So `participationPrintedPct` in this file means "the number on the page" and
 * nothing more. `observed` is what the account was caught doing. They are
 * different fields because they are different claims.
 *
 * ## On renaming
 *
 * The house names below cover generic point-to-point structures. Nobody owns
 * "1-year point-to-point on the S&P 500 with a cap", so renaming the shape is
 * free. What is NOT free is attaching a carrier's specific parameters to a
 * house name and quoting it to someone who will buy a different policy — the
 * numbers will not match theirs. Every row therefore keeps its carrier label
 * internally, and `houseName` is a presentation layer over a shape, never a
 * substitute for saying which product a client is actually being sold.
 */

export type EvidenceStrength =
  /** Fitted to multiple paid credits. The strongest thing here. */
  | 'solved'
  /** One paid credit observed. Suggestive, not a model. */
  | 'single-observation'
  /** Parameters transcribed from a carrier document, never checked against a credit. */
  | 'document-only'
  /** Name and one or two fields seen. Mostly unknown. */
  | 'sighting';

export interface SecurianAccount {
  readonly id: string;
  /** How the carrier labels it on statements. Kept for internal matching. */
  readonly carrierLabel: string;
  /** Which product generation it was seen on. */
  readonly product: 'BGA3' | 'BGA II' | 'both' | 'unknown';
  /** The house name for the shape. Presentation only. */
  readonly houseName: string;
  /** The index it tracks, where the carrier names it. */
  readonly index: string | 'unknown';
  /** Segment length in years, or null where never seen. */
  readonly termYears: number | null;
  /** What the statement or modal prints in the participation column. */
  readonly participationPrintedPct: number | null;
  /** Cap across the segment, as printed. 'Unlimited', 'N/A', or a percent. */
  readonly capPrinted: string | null;
  readonly floorPct: number | null;
  /**
   * Annual charge levied on this account specifically. Null where none has
   * been seen — which is every account but one. On both policies audited the
   * deductions were POLICY-level monthly charges spread pro rata across funded
   * accounts, not per-account asset charges.
   */
  readonly accountChargeAnnualPct: number | null;
  /** What the account was caught actually doing, where anything was. */
  readonly observed: {
    readonly multiplier: number | null;
    readonly deductionPointsPerSegment: number | null;
    readonly segmentsObserved: number;
    readonly note: string;
  } | null;
  readonly evidence: EvidenceStrength;
  readonly source: string;
  /** Everything about this account that is not known. Never empty by accident. */
  readonly unknown: readonly string[];
}

export const SECURIAN_ACCOUNTS: readonly SecurianAccount[] = [
  {
    id: 'bia2-bga2',
    carrierLabel: 'Balanced Indexed Account 2',
    product: 'BGA II',
    houseName: '2-Year S&P 500 (X Formation)',
    index: 'S&P 500',
    termYears: 2,
    participationPrintedPct: 110,
    capPrinted: 'Unlimited',
    floorPct: 0,
    accountChargeAnnualPct: null,
    observed: {
      multiplier: 0.84,
      deductionPointsPerSegment: 5.25,
      segmentsObserved: 6,
      note: 'Least squares slope 0.840000, intercept -5.250003, maximum residual 0.00000 points across six matured segments. Every dollar credit reconciles to the cent, and three of the six appear again by name in the transaction ledger. The best-evidenced account in this file.',
    },
    evidence: 'solved',
    source:
      'Annual Policy Review 08/28/2025-08/28/2026, Growth Rate and Index Credit Detail; see shared/securianBGA2Statement.ts',
    unknown: [
      'What 0.84 and 5.25 decompose into. 0.84 = 0.80 x 1.05 exactly, which would mean an 80% index allocation at the flier\'s 105% participation, and 5.25 points over two years is 2.625% a year of spread. That is a fit of two parameters to two constants, not an identification. The account factsheet would settle it.',
    ],
  },
  {
    id: 'bia2-bga3',
    carrierLabel: 'Balanced Indexed Account 2',
    product: 'BGA3',
    houseName: '2-Year S&P 500 (X Formation)',
    index: 'S&P 500',
    termYears: 2,
    participationPrintedPct: 105,
    capPrinted: null,
    floorPct: 0,
    accountChargeAnnualPct: null,
    observed: {
      multiplier: null,
      deductionPointsPerSegment: 4.0939,
      segmentsObserved: 12,
      note: 'Same functional form as the BGA II account, different coefficients. The multiplier is not a constant here: twelve segments solve to three declared participation groups - 94.49% (Feb-Apr), 105.00% (Jan, May-Aug), 110.25% (Sep-Dec) - each internally tight to about two hundredths of a point, against a fixed 4.0939 point deduction.',
    },
    evidence: 'solved',
    source: 'Twelve portal segment modals, 2019-2021; see shared/segmentAudit.ts',
    unknown: [
      'Whether this is the same account as bia2-bga2 under a different product generation, or a genuinely different account. The coefficients differ and nothing reconciles them.',
      'The size of the additional deduction on the 26.96% subject segment. It depends which participation group that segment was struck at, and the portal field that would say is the constant.',
    ],
  },
  {
    id: 'bia6',
    carrierLabel: 'Balanced Indexed Account 6',
    product: 'BGA3',
    houseName: '1-Year Risk-Controlled (P Formation, uncapped)',
    index: 'S&P PRISM',
    termYears: 1,
    participationPrintedPct: 105,
    capPrinted: 'Unlimited',
    floorPct: 0,
    accountChargeAnnualPct: null,
    observed: {
      multiplier: 1.3125,
      deductionPointsPerSegment: null,
      segmentsObserved: 6,
      note: 'SOLVED on nine modals, and it corrects the file. The printed participation IS operative here - it reproduces the printed crediting rate on all nine segments, at 105% on eight and 100% on one. But the dollar credit is that times a further multiplier: 1.25 on the 105% tier (six credited segments) and 1.60 on the 100% tier (one), every one reconciling to under half a cent. The crediting rate the page shows understates the money it pays by 25% and 60% respectively. Segments D and H are consecutive - D ends where H starts - confirming one rolling annual account.',
    },
    evidence: 'solved',
    source:
      'Four portal Index credit details modals; see shared/prismAccountSolve.ts. Cap sentinel printed as 10000000000.00%.',
    unknown: [
      'What the 1.25 is called. No carrier document in hand names a credit multiplier, so 1.25 is fitted, not a contract term.',
      'Whether Account 8, which tracks the same index on the same term, shares a tier. Its single observed segment reads 1.71x, and neither 1.71 / 1.05 = 1.6286 nor 1.71 / 1.00 is a round multiplier.',
      'Which account the 100% / 1.60 tier belongs to. It is not the capped Index A account - that one is capped at 8.50% and this modal prints the uncapped sentinel.',
      'Why segment F paid nothing on positive growth. Either it had not matured or value left it early; the modal does not say.',
    ],
  },
  {
    id: 'bia7-bga2',
    carrierLabel: 'Balanced Indexed Account 7',
    product: 'BGA II',
    houseName: '3-Year S&P 500 (X Formation, long)',
    index: 'S&P 500',
    termYears: 3,
    participationPrintedPct: 115,
    capPrinted: 'Unlimited',
    floorPct: 0,
    accountChargeAnnualPct: null,
    observed: null,
    evidence: 'document-only',
    source:
      'Accumulation Value Detail page, Annual Policy Review 08/28/2025-08/28/2026. Terms and printed participation read directly.',
    unknown: [
      'Everything about its behaviour. Not one of its segments has matured - the earliest starts 05/2024 and comes due 05/2027 - so there is no paid credit to fit anything to.',
      'Its deduction. Given the printed participation was wrong on every other account it appeared on, 115% should not be assumed operative.',
    ],
  },
  {
    id: 'bia8',
    carrierLabel: 'Balanced Indexed Account 8',
    product: 'BGA3',
    houseName: '1-Year Risk-Controlled (P Formation)',
    index: 'S&P PRISM',
    termYears: 1,
    participationPrintedPct: 105,
    capPrinted: 'N/A',
    floorPct: 0,
    accountChargeAnnualPct: null,
    observed: {
      multiplier: 1.71,
      deductionPointsPerSegment: null,
      segmentsObserved: 1,
      note: 'Credited 17.11% on 10.03% index growth over its Dec 2020 - Dec 2021 segment: 1.71 times the index, while its modal printed 105.00%. At 105% the most it could have credited is 10.53%. Separately, a 12/16/22 segment grew -0.17157% and credited 0.00000%, confirming the floor holds.',
    },
    evidence: 'single-observation',
    source:
      'Portal segment modal (Dec 2020 - Dec 2021) and the BGA3 Annual Policy Review 11/27/2023-11/27/2024, page 9.',
    unknown: [
      'The participation rate. 1.71x is a single ratio and cannot be split into participation and spread: 171% with no spread, 175% less a small spread and 180% less 1.5% all fit it equally.',
      'Whether 1.71x is stable. One segment is an anecdote. The BGA3 Account 2 audit found participation redeclared across three groups inside a single year, so there is positive reason to expect this moves too.',
    ],
  },
  {
    id: 'bia9',
    carrierLabel: 'Balanced Indexed Account 9',
    product: 'BGA II',
    houseName: 'unnamed - shape unknown',
    index: 'unknown',
    termYears: null,
    participationPrintedPct: null,
    capPrinted: 'N/A',
    floorPct: null,
    accountChargeAnnualPct: null,
    observed: null,
    evidence: 'sighting',
    source: 'Listed on the Current Growth Caps page of the BGA II annual review. Nothing else.',
    unknown: [
      'The index, the term, the participation, the floor and the behaviour. Only the name and a cap of "N/A" are known, and "N/A" on that page may mean uncapped or may mean not applicable to an unfunded account.',
    ],
  },
  {
    id: 'index-a-sp500-100',
    carrierLabel: 'Index A - S&P 500 100% Participation',
    product: 'BGA II',
    houseName: 'S&P 500 (Z Formation)',
    index: 'S&P 500',
    termYears: 1,
    participationPrintedPct: 100,
    capPrinted: '8.50%',
    floorPct: 0,
    accountChargeAnnualPct: null,
    observed: null,
    evidence: 'document-only',
    source: 'Current Growth Caps page, Annual Policy Review 08/28/2025-08/28/2026.',
    unknown: [
      'Its behaviour. Never funded on either policy audited, so never observed.',
      'Whether its printed 100% is operative. It is the only account whose name contains its participation rate, which is weak evidence that this one means something - but it is still the same printed field.',
    ],
  },
  {
    id: 'indexed-loan-account',
    carrierLabel: 'Indexed Loan Account',
    product: 'both',
    houseName: 'Participating Loan Account (L Formation)',
    index: 'S&P 500',
    termYears: 1,
    participationPrintedPct: 105,
    capPrinted: 'Unlimited',
    floorPct: 0,
    /** The only account-level charge published anywhere in this inventory. */
    accountChargeAnnualPct: 4.75,
    observed: {
      multiplier: 1.47,
      deductionPointsPerSegment: null,
      segmentsObserved: 2,
      note: 'Two credited segments reproduce exactly at 1.47x - 8.10527% to 11.91475% and 6.91480% to 10.16478% - and both dollar credits reconcile to the cent against the transaction ledger. A third segment grew -0.64175% and credited zero. Credits post to the Interim Account, not back into the segment, so the crediting detail table shows $0.00 for them.',
    },
    evidence: 'solved',
    source:
      'Annual Policy Review 11/27/2023-11/27/2024, page 9 and page 20; see shared/securianAnnualPolicyReview.ts. The 4.75% charge is the carrier\'s published indexed loan charge.',
    unknown: [
      'Whether the 1.47x is net or gross of the 4.75% charge. The two credited segments reconcile to the cent without applying it, which suggests the charge is levied elsewhere - but that has not been traced through the ledger.',
      'The variable policy loan rate is a separate quantity and IS known: 4.00% rising to 4.25% effective 10/01/2024.',
    ],
  },
];

/* ------------------------------------------------------------------ *
 * PRISM, specifically
 * ------------------------------------------------------------------ */

/**
 * What the PRISM accounts actually credit, and the caveat that matters more
 * than the number.
 *
 * The headline is real: Account 8 credited 1.71 times its index on the one
 * segment ever observed, while its modal printed 105%. On that account the
 * printed field understates severely, and a client reading the statement would
 * conclude their best account was their worst.
 *
 * The caveat is that 1.71x of PRISM is not 1.71x of the S&P 500, and the
 * difference is the entire product design. S&P PRISM is a risk-controlled,
 * volatility-targeted multi-asset index. Such indices are built to be damped:
 * they move less than an equity index in both directions, and that is precisely
 * why a carrier can afford to offer 150-200% participation with no cap. The
 * high participation is compensation for a smaller number to participate in,
 * not a gift.
 *
 * So "171% participation, uncapped" is an ordinary structure, not a loophole,
 * and presenting it as one is how a product gets sold and then underdelivers.
 * The honest comparison is not participation against participation; it is what
 * each account actually credited over the same calendar period, which requires
 * PRISM index history this repository does not have.
 */
export const PRISM_FINDING = {
  accounts: ['Balanced Indexed Account 6', 'Balanced Indexed Account 8'],
  index: 'S&P PRISM',
  observedMultiple: 1.71,
  segmentsObserved: 1,
  printedParticipationPct: 105,
  maximumPossibleAtPrintedRate: 10.53,
  actuallyCredited: 17.11,
  onIndexGrowth: 10.03,
  direction: 'the printed rate understates what this account paid',
  whyNotAWindfall:
    'S&P PRISM is a volatility-controlled multi-asset index, designed to move less than an equity index in both directions. High uncapped participation is the standard compensation for a damped index, not an edge. 1.71x of PRISM is not comparable to 1.71x of the S&P 500.',
  whatWouldSettleIt:
    'PRISM index history over the same segments as the S&P 500 accounts, so the two can be compared on credited dollars rather than on participation rates. Failing that, more PRISM segment modals - one observation cannot separate participation from spread, nor show whether the rate is redeclared.',
  doNotQuote:
    '171% as a participation rate. It is a ratio inferred from one segment, not a declared term, and it may fold a spread and a redeclaration into one number.',
} as const;

/* ------------------------------------------------------------------ *
 * Readers
 * ------------------------------------------------------------------ */

export function accountById(id: string): SecurianAccount | null {
  const hit = SECURIAN_ACCOUNTS.filter((a) => a.id === id);
  return hit.length ? hit[0] : null;
}

/** Accounts fitted to more than one paid credit. Safe to model on. */
export function solvedAccounts(): readonly SecurianAccount[] {
  return SECURIAN_ACCOUNTS.filter((a) => a.evidence === 'solved');
}

/** Accounts where the printed participation is known NOT to be operative. */
export function accountsWithContradictedParticipation(): readonly SecurianAccount[] {
  return SECURIAN_ACCOUNTS.filter(
    (a) =>
      a.observed !== null &&
      a.observed.multiplier !== null &&
      a.participationPrintedPct !== null &&
      Math.abs(a.observed.multiplier - a.participationPrintedPct / 100) > 0.05,
  );
}

/** Whether the printed rate flatters the account or shortchanges it. */
export function printedRateDirection(
  account: SecurianAccount,
): 'overstates' | 'understates' | 'unknown' {
  if (!account.observed || account.observed.multiplier === null) return 'unknown';
  if (account.participationPrintedPct === null) return 'unknown';
  const printed = account.participationPrintedPct / 100;
  if (Math.abs(account.observed.multiplier - printed) <= 0.05) return 'unknown';
  return account.observed.multiplier < printed ? 'overstates' : 'understates';
}

/** Every open question across the inventory, flattened, for a work queue. */
export function openQuestions(): readonly { account: string; question: string }[] {
  const out: { account: string; question: string }[] = [];
  for (const a of SECURIAN_ACCOUNTS) {
    for (const u of a.unknown) out.push({ account: a.carrierLabel, question: u });
  }
  return out;
}

/**
 * The documents that would close the most open questions per request, in order.
 * A shopping list for the carrier rep, rather than more statements.
 */
export const DOCUMENTS_THAT_WOULD_CLOSE_THIS = [
  'The BGA II and BGA3 indexed account factsheets. These print the index allocation, the declared-rate allocation and the segment spread per account, which is exactly the decomposition that no number of statements can supply.',
  'The current rate sheet for both products, showing declared participation by account and by segment vintage. The BGA3 audit found three different rates inside one year; nothing here can tell which applies today.',
  'S&P PRISM index history. Two of the six accounts track it and neither can be compared to anything without it.',
  'The BGA II maximum illustrated rate from the carrier illustration actuary. Nothing in this repository may be illustrated on that product until it exists.',
] as const;

export const INVENTORY_RULES = {
  version: '2026.09.1',
  accountsKnown: SECURIAN_ACCOUNTS.length,
  neverPrinted: [
    'A participation rate from the `participationPrintedPct` field, described as what an account pays. That field has been caught wrong in both directions on four accounts.',
    'An `observed` multiplier as a participation rate. It is fitted, not declared, and AG 49-A governs what may be illustrated.',
    'A `single-observation` or `sighting` account modelled as though it were solved. Two of the six accounts here have never been seen crediting anything.',
    'A house name in place of the carrier and product a client is actually buying. Renaming a generic shape is fine; anonymising the policy someone is purchasing is not.',
    'PRISM participation compared against S&P 500 participation. Different indices, different volatility, not comparable quantities.',
  ],
} as const;

// ─── Index account shapes ───────────────────────────────────────────────────
// What an indexed account can actually be, and what each one credits.
//
// ## Why this exists
//
// The illustration path modelled one shape: a single cap, a single floor, 100%
// participation, one year at a time. Real products are not that, and the gap
// costs real sales. Pacific Horizon ECV IUL alone carries eight indexed
// accounts — a 200%-participation uncapped volatility-control account, a
// five-year account at 110%, a two-year account whose cap is quoted over the
// whole two years, one whose participation rate is redeclared as often as
// monthly, and one that charges 0.80% a year for a higher cap. An engine that
// can only express "100% participation, one cap, one year" cannot show six of
// the eight, so the conversation defaults to the plainest account on the page.
//
// That is the honest version of "more flexibility". Not a higher cap — a wider
// vocabulary. Every shape here is read off a carrier document, every one
// carries its own AG 49-A maximum illustrated rate where the carrier has
// published one, and nothing may be illustrated on a shape without one.
//
// ## The arithmetic, stated once
//
// Capped point-to-point:      credited = clamp(index × participation, floor, cap)
// Uncapped with a spread:     credited = max(floor, index × participation − spread)
//
// Then, in order: the account benefit is added, and the account charge is
// deducted. Both are annual rates and both scale with the segment length.
//
// Four details decide whether the result is right or wrong by several
// percentage points, so none of them is inferred:
//
//   `segmentYears` — a 2-year segment credits once, at the end, on the index's
//   movement across the whole two years. Treating that as an annual rate
//   roughly doubles it. Annualising is a separate, explicit, geometric call.
//
//   `capBasis` — Pacific's 2-Year account quotes "24% current growth cap over
//   2 years". Read as an annual cap that is 24% a year; read correctly it is
//   24% across the segment, about 11.4% a year. The field makes the reading
//   explicit rather than leaving it to whoever writes the next caller.
//
//   `spreadBasis` — same problem on the spread. On a 2-year segment at 2.50%,
//   per-segment and per-year differ by 250 basis points on the credited result.
//
//   `participationDeclared` — Pacific's No Cap Dynamic Par account has no fixed
//   participation rate; the carrier redeclares it as often as monthly and the
//   illustration simply assumes 50%. Modelling that assumption as though it
//   were a term is the same error as quoting a current cap as guaranteed.
//
// ## What this file will not do
//
// It will not compute a maximum illustrated rate. Under AG 49-A that is the
// carrier illustration actuary's figure, derived from the product's own
// parameters against the benchmark index account, and a shape with no published
// maximum is a refusal — never a shape whose maximum is calculated here from
// its cap and participation. That inversion is the single most common way an
// illustration ends up above the line.
//
// It also will not treat the carrier's hypothetical backtests as maxima. Those
// are recorded, because they are the most persuasive honest figures available
// and they are the carrier's own — but a backtest is what the account would
// have done, and a maximum illustrated rate is what it may be shown doing.

export type CreditingMethod = 'point-to-point-capped' | 'point-to-point-uncapped-spread';

/** A carrier's own published backtest for an account. Not a maximum, not a forecast. */
export interface CarrierBacktest {
  /** Best annualised crediting rate over the window, as a decimal. */
  readonly best: number;
  readonly worst: number;
  readonly average: number;
  /** e.g. "1988-2023, monthly segments, 20-year holding periods". */
  readonly window: string;
  readonly source: string;
  readonly note?: string;
}

export interface IndexAccountShape {
  /** Stable id, referenced by illustrations and by the rules registry. */
  readonly id: string;
  readonly productId: string;
  readonly label: string;
  /** The index the account tracks, as the carrier names it. */
  readonly index: string;
  readonly method: CreditingMethod;
  /** Length of one crediting segment, in years. 1 for annual point-to-point. */
  readonly segmentYears: number;

  /** Participation rate as a decimal. 1.10 = 110%. */
  readonly participation: number;
  /** Contractual minimum participation, where the carrier states one. */
  readonly participationGuaranteedMin?: number;
  /**
   * True where the carrier redeclares participation rather than fixing it. The
   * `participation` field is then the illustration's assumption, not a term.
   */
  readonly participationDeclared?: boolean;

  /** Floor as a decimal. 0 = a 0% floor. Guaranteed on every account here. */
  readonly floor: number;
  /** Cap as a decimal, or null for an uncapped account. */
  readonly cap: number | null;
  /** Whether `cap` applies across the segment or per year of it. */
  readonly capBasis?: 'per-segment' | 'per-year';
  /** Contractual minimum cap, where the carrier states one. */
  readonly capGuaranteedMin?: number;

  /** Spread as a decimal, or null where none applies. */
  readonly spread: number | null;
  /** Whether `spread` is charged once per segment or once per year of it. */
  readonly spreadBasis: 'per-segment' | 'per-year' | null;

  /**
   * Annual charge levied on accumulated value in this account, as a decimal.
   * Pacific's 1-Year High Cap charges 0.80% a year for its higher cap — the
   * higher cap is bought, not given, and an account comparison that ignores the
   * charge flatters it.
   */
  readonly accountChargeAnnual?: number;
  /** Annual credit added to this account, as a decimal. */
  readonly accountBenefitAnnual?: number;

  /**
   * The AG 49-A maximum illustrated rate for THIS account, as the carrier
   * published it. Decimal. Never computed here. Null where the carrier's figure
   * has not been read — such an account may be described but not illustrated.
   */
  readonly maxIllustratedRate: number | null;

  /** The carrier's own backtest for this account, where published. */
  readonly backtest?: CarrierBacktest;

  /** The carrier document this row was read from. */
  readonly source: string;
  readonly readOn: string;
  /**
   * Anything in this row inferred from the document's wording rather than
   * stated outright. Present means: confirm before illustrating.
   */
  readonly inferred?: string;
}

const IUC4009 =
  'Pacific Life IUC4009-1124 (11/24), "Understanding Your Account Choices in Pacific Horizon ECV IUL and Pacific Horizon Survivorship IUL"';
const PL_ILLUSTRATION =
  'Pacific Horizon ECV IUL illustration, form ICC21 P21IUL / S22ECV, run 16 September 2026, account table and Maximum Illustrated Rates page';
const MN_ILLUSTRATION =
  'Minnesota Life Balanced Growth Accumulator III illustration, Case ID 29335303, prepared 15 September 2026';

/**
 * Verified shapes only.
 *
 * Read off carrier documents held in this corpus; nothing here came from memory
 * or from a secondary summary, because a stale index parameter is worse than an
 * absent one — it looks current.
 *
 * A caution that applies to the whole Pacific block: the account parameters were
 * read from a November 2024 document and the maximum illustrated rate from a
 * September 2026 illustration. Caps and participation rates are redeclared. The
 * 2026 illustration confirms the 1-Year account's maximum but does not reprint
 * the other seven accounts' current parameters, so those carry their 2024 date
 * and should be refreshed from a current rate sheet before they are quoted.
 */
export const INDEX_ACCOUNT_SHAPES: readonly IndexAccountShape[] = [
  // ══ Pacific Life — Pacific Horizon ECV IUL ══════════════════════════════
  {
    id: 'pacific-horizon-ecv-1yr',
    productId: 'pacific-horizon-ecv',
    label: '1-Year Indexed Account',
    index: 'S&P 500 (excluding dividends)',
    method: 'point-to-point-capped',
    segmentYears: 1,
    participation: 1.0,
    participationGuaranteedMin: 1.0,
    floor: 0,
    cap: 0.1,
    capBasis: 'per-segment',
    capGuaranteedMin: 0.02,
    spread: null,
    spreadBasis: null,
    maxIllustratedRate: 0.0635,
    backtest: {
      best: 0.0673,
      worst: 0.06,
      average: 0.064,
      window: '1988-2023, monthly segments, 20-year holding periods, annualised',
      source: IUC4009,
    },
    source: `${IUC4009}; maximum illustrated rate from ${PL_ILLUSTRATION}`,
    readOn: '2026-09-19',
    // The cap was recorded as null here until the account-choices document was
    // read. It is the benchmark account: the carrier derives the product's whole
    // maximum illustrated rate from this account's lookback.
  },
  {
    id: 'pacific-horizon-ecv-1yr-no-cap-dynamic-par',
    productId: 'pacific-horizon-ecv',
    label: '1-Year No Cap Dynamic Par Indexed Account',
    index: 'S&P 500 (excluding dividends)',
    method: 'point-to-point-capped',
    segmentYears: 1,
    participation: 0.5,
    participationGuaranteedMin: 0.05,
    participationDeclared: true,
    floor: 0,
    cap: null,
    spread: null,
    spreadBasis: null,
    maxIllustratedRate: null,
    backtest: {
      best: 0.0648,
      worst: 0.0475,
      average: 0.057,
      window: '1988-2023, monthly segments, 20-year holding periods, annualised',
      source: IUC4009,
      note: 'Computed at the illustration\'s assumed 50% participation, not at a contractual rate.',
    },
    source: IUC4009,
    readOn: '2026-09-19',
    inferred:
      'The 50% participation rate is the illustration\'s assumption, not a term. The carrier declares it as often as monthly and guarantees only 5%. Quoting 50% as though it were fixed is the same error as quoting a current cap as guaranteed — check the current declared rate on the carrier\'s rate website before using this account.',
  },
  {
    id: 'pacific-horizon-ecv-1yr-qqq',
    productId: 'pacific-horizon-ecv',
    label: '1-Year Invesco QQQ Indexed Account',
    index: 'Invesco QQQ ETF (tracks the Nasdaq-100 Index)',
    method: 'point-to-point-capped',
    segmentYears: 1,
    participation: 1.0,
    participationGuaranteedMin: 1.0,
    floor: 0,
    cap: 0.105,
    capBasis: 'per-segment',
    capGuaranteedMin: 0.01,
    spread: null,
    spreadBasis: null,
    maxIllustratedRate: null,
    backtest: {
      best: 0.0985,
      worst: 0.0492,
      average: 0.0771,
      window: '2003-2023, monthly segments, 5-year holding periods, annualised',
      source: IUC4009,
      note: 'The underlying ETF returned 25.95% best / -0.17% worst / 13.49% average over the same window. The gap between the two rows is what the cap and the floor together cost and pay.',
    },
    source: IUC4009,
    readOn: '2026-09-19',
  },
  {
    id: 'pacific-horizon-ecv-1yr-high-cap',
    productId: 'pacific-horizon-ecv',
    label: '1-Year High Cap Indexed Account',
    index: 'S&P 500 (excluding dividends)',
    method: 'point-to-point-capped',
    segmentYears: 1,
    participation: 1.0,
    participationGuaranteedMin: 1.0,
    floor: 0,
    cap: 0.12,
    capBasis: 'per-segment',
    capGuaranteedMin: 0.04,
    spread: null,
    spreadBasis: null,
    accountChargeAnnual: 0.008,
    maxIllustratedRate: null,
    backtest: {
      best: 0.0697,
      worst: 0.0602,
      average: 0.0651,
      window: '1988-2023, monthly segments, 20-year holding periods, annualised',
      source: IUC4009,
      note: 'The carrier simulates the 0.80% account charge by subtracting it from the crediting rate. On a real policy the charge sits in the monthly deduction, so the credited rate is not itself reduced — the two arrive at the same place by different routes.',
    },
    source: IUC4009,
    readOn: '2026-09-19',
    inferred:
      'Whether to net the 0.80% account charge inside the credited rate or take it in the monthly deduction. The carrier does the first in its own chart and the second on a real policy. creditFor deducts it, matching the chart, so a figure from here is comparable to the carrier\'s table and is NOT the raw credited rate the policy would show.',
  },
  {
    id: 'pacific-horizon-ecv-1yr-high-par-vc',
    productId: 'pacific-horizon-ecv',
    label: '1-Year High Par Volatility Control Indexed Account',
    index: 'BlackRock iBLD Endura VC 5.5 ER Index',
    method: 'point-to-point-capped',
    segmentYears: 1,
    participation: 2.0,
    participationGuaranteedMin: 0.25,
    floor: 0,
    cap: null,
    spread: null,
    spreadBasis: null,
    maxIllustratedRate: null,
    backtest: {
      best: 0.1355,
      worst: 0.0502,
      average: 0.1009,
      window: '2004-2023, monthly segments, 5-year holding periods, annualised',
      source: IUC4009,
      note: 'The Endura index itself returned 6.80% / 1.71% / 4.67% over the same window. 200% participation on a volatility-controlled index is the mechanism: a lower-volatility index geared up, rather than a higher-volatility one capped.',
    },
    source: IUC4009,
    readOn: '2026-09-19',
    inferred:
      'The index inception date. BlackRock Endura was founded 14 June 2016 and everything before that in the carrier\'s table is a hypothetical lookback BlackRock supplied. ag49Validator refuses backtested performance for an index under ten years old — this index reached ten years in June 2026, so the margin is thin and the lookback is mostly synthetic. Check before showing the 2004-2023 row to a client.',
  },
  {
    id: 'pacific-horizon-ecv-1yr-vc',
    productId: 'pacific-horizon-ecv',
    label: '1-Year Volatility Control Indexed Account',
    index: 'BlackRock iBLD Endura VC 5.5 ER Index',
    method: 'point-to-point-capped',
    segmentYears: 1,
    participation: 1.8,
    participationGuaranteedMin: 0.2,
    floor: 0,
    cap: null,
    spread: null,
    spreadBasis: null,
    accountBenefitAnnual: 0.004,
    maxIllustratedRate: null,
    backtest: {
      best: 0.1221,
      worst: 0.0453,
      average: 0.091,
      window: '2004-2023, monthly segments, 5-year holding periods, annualised',
      source: IUC4009,
      note: 'The carrier states this table EXCLUDES the 0.40% account benefit, so the account\'s own figures are higher than the row shows. creditFor adds the benefit, so it will not reproduce this table exactly — that is the table being conservative, not a disagreement.',
    },
    source: IUC4009,
    readOn: '2026-09-19',
  },
  {
    id: 'pacific-horizon-ecv-2yr',
    productId: 'pacific-horizon-ecv',
    label: '2-Year Indexed Account',
    index: 'S&P 500 (excluding dividends)',
    method: 'point-to-point-capped',
    segmentYears: 2,
    participation: 1.0,
    participationGuaranteedMin: 1.0,
    floor: 0,
    cap: 0.24,
    capBasis: 'per-segment',
    capGuaranteedMin: 0.06,
    spread: null,
    spreadBasis: null,
    maxIllustratedRate: null,
    backtest: {
      best: 0.0782,
      worst: 0.0603,
      average: 0.0689,
      window: '1988-2023, monthly segments, 20-year holding periods, annualised',
      source: IUC4009,
    },
    source: IUC4009,
    readOn: '2026-09-19',
    // The carrier quotes this cap as "24% over 2 years", and the guaranteed
    // minimum as "6% growth cap over 2 years" — both per segment, stated in
    // those words. capBasis records it so nobody reads 24% as an annual cap.
  },
  {
    id: 'pacific-horizon-ecv-high-par-5yr',
    productId: 'pacific-horizon-ecv',
    label: 'High Par 5-Year Indexed Account',
    index: 'S&P 500 (excluding dividends)',
    method: 'point-to-point-capped',
    segmentYears: 5,
    participation: 1.1,
    participationGuaranteedMin: 1.05,
    floor: 0,
    cap: null,
    capGuaranteedMin: 0.1,
    spread: null,
    spreadBasis: null,
    maxIllustratedRate: null,
    backtest: {
      best: 0.0924,
      worst: 0.053,
      average: 0.0716,
      window: '1988-2023, monthly segments, 20-year holding periods, annualised',
      source: IUC4009,
      note: 'The highest average of any S&P-based account on this product, and the highest best-case. Five years of lock-up is what buys it.',
    },
    source: IUC4009,
    readOn: '2026-09-19',
  },

  // ══ Minnesota Life — Balanced Growth Accumulator III ═════════════════════
  {
    id: 'mn-bga3-indexed-a',
    productId: 'mn-life-bga3',
    label: 'Indexed Account A',
    index: 'S&P 500 (excluding dividends)',
    method: 'point-to-point-capped',
    segmentYears: 1,
    participation: 1.0,
    floor: 0,
    cap: 0.105,
    capBasis: 'per-segment',
    spread: null,
    spreadBasis: null,
    maxIllustratedRate: 0.0662,
    backtest: {
      best: 0.0821,
      worst: 0.0416,
      average: 0.0662,
      window: 'rolling 25-year periods since 1949',
      source: `${MN_ILLUSTRATION} — carrier-published range for the 100% / 10.50% / 0% structure`,
      note: 'The average of the range equals the maximum illustrated rate, which is how AG 49-A lookbacks are constructed — the same pattern as Pacific\'s 4.36 / 6.35 / 7.79.',
    },
    source: `${MN_ILLUSTRATION} — account table`,
    readOn: '2026-09-19',
  },
  {
    id: 'mn-bga3-balanced-2',
    productId: 'mn-life-bga3',
    label: 'Balanced Indexed Account 2',
    index: 'S&P 500 (excluding dividends)',
    method: 'point-to-point-uncapped-spread',
    segmentYears: 2,
    participation: 1.1,
    floor: 0,
    cap: null,
    spread: 0.025,
    spreadBasis: 'per-segment',
    maxIllustratedRate: 0.0662,
    source: `${MN_ILLUSTRATION} — Balanced Indexed Account 2: uncapped, 110% participation, 2.50% segment spread, 2-year segment`,
    readOn: '2026-09-19',
    inferred:
      'spreadBasis. The disclosure calls it a "segment spread", which reads as once per segment, but does not say so in those words. On a 2-year segment the two readings differ by 250 basis points on the credited result. Confirm with the carrier before illustrating this account.',
  },
];

/** Every shape on a product, or an empty list where none is verified. */
export function shapesFor(productId: string): readonly IndexAccountShape[] {
  const out: IndexAccountShape[] = [];
  for (let i = 0; i < INDEX_ACCOUNT_SHAPES.length; i++) {
    if (INDEX_ACCOUNT_SHAPES[i].productId === productId) out.push(INDEX_ACCOUNT_SHAPES[i]);
  }
  return out;
}

export function shapeById(id: string): IndexAccountShape | null {
  for (let i = 0; i < INDEX_ACCOUNT_SHAPES.length; i++) {
    if (INDEX_ACCOUNT_SHAPES[i].id === id) return INDEX_ACCOUNT_SHAPES[i];
  }
  return null;
}

/** Accounts that may be described but not illustrated: no carrier maximum on file. */
export function shapesWithoutMaximum(): readonly IndexAccountShape[] {
  return INDEX_ACCOUNT_SHAPES.filter((s) => s.maxIllustratedRate === null);
}

export type CreditResult =
  | {
      readonly ok: true;
      /** Credited rate for the whole segment, as a decimal. */
      readonly segmentCredited: number;
      /** The same result expressed per year, for comparing unlike segments. */
      readonly annualised: number;
      readonly segmentYears: number;
      /** How the number was reached, in words, for a reviewer's log. */
      readonly working: string;
    }
  | { readonly ok: false; readonly reason: string };

/**
 * What a shape credits on a given index movement.
 *
 * `indexReturn` is the index's movement across the WHOLE segment, as a decimal,
 * price return — index crediting uses price return, and passing a total return
 * here overstates the result by roughly the dividend yield per year.
 *
 * Refuses rather than approximating where a parameter the arithmetic needs is
 * not on file.
 */
export function creditFor(shape: IndexAccountShape, indexReturn: number): CreditResult {
  if (!Number.isFinite(indexReturn)) {
    return { ok: false, reason: 'The index return is not a finite number.' };
  }

  const participated = indexReturn * shape.participation;
  const parts: string[] = [
    `${(indexReturn * 100).toFixed(2)}% index over ${shape.segmentYears} year${shape.segmentYears === 1 ? '' : 's'} × ` +
      `${(shape.participation * 100).toFixed(0)}% participation${shape.participationDeclared ? ' (assumed — the carrier redeclares it)' : ''} = ` +
      `${(participated * 100).toFixed(2)}%`,
  ];

  let credited: number;

  if (shape.method === 'point-to-point-capped') {
    if (shape.cap === null) {
      // Uncapped in practice: participation and the floor are the whole story.
      credited = Math.max(participated, shape.floor);
      parts.push(`no cap, floored at ${(shape.floor * 100).toFixed(0)}% → ${(credited * 100).toFixed(2)}%`);
    } else {
      const segmentCap = shape.capBasis === 'per-year' ? shape.cap * shape.segmentYears : shape.cap;
      credited = Math.min(Math.max(participated, shape.floor), segmentCap);
      parts.push(
        `bounded by a ${(shape.floor * 100).toFixed(0)}% floor and a ${(shape.cap * 100).toFixed(2)}% cap ` +
          `${shape.capBasis === 'per-year' ? `per year (${(segmentCap * 100).toFixed(2)}% across the segment)` : 'across the segment'} → ` +
          `${(credited * 100).toFixed(2)}%`
      );
    }
  } else {
    if (shape.spread === null || shape.spreadBasis === null) {
      return {
        ok: false,
        reason: `${shape.label} is an uncapped account, so its credited value depends entirely on the spread and how the spread is charged. Neither is on file.`,
      };
    }
    const totalSpread = shape.spreadBasis === 'per-year' ? shape.spread * shape.segmentYears : shape.spread;
    credited = Math.max(shape.floor, participated - totalSpread);
    parts.push(
      `less a ${(shape.spread * 100).toFixed(2)}% spread charged ${shape.spreadBasis} (${(totalSpread * 100).toFixed(2)}% total), ` +
        `floored at ${(shape.floor * 100).toFixed(0)}% → ${(credited * 100).toFixed(2)}%`
    );
  }

  // Account benefit, then account charge. Both annual, both scaled by segment.
  if (shape.accountBenefitAnnual) {
    const benefit = shape.accountBenefitAnnual * shape.segmentYears;
    credited += benefit;
    parts.push(`plus a ${(shape.accountBenefitAnnual * 100).toFixed(2)}% account benefit a year (${(benefit * 100).toFixed(2)}% over the segment)`);
  }
  if (shape.accountChargeAnnual) {
    const charge = shape.accountChargeAnnual * shape.segmentYears;
    credited -= charge;
    parts.push(
      `less a ${(shape.accountChargeAnnual * 100).toFixed(2)}% account charge a year (${(charge * 100).toFixed(2)}% over the segment) — ` +
        `the higher cap on this account is bought, not given`
    );
  }

  const ann = annualise(credited, shape.segmentYears);
  if (shape.segmentYears > 1) parts.push(`${(ann * 100).toFixed(2)}% a year`);

  return {
    ok: true,
    segmentCredited: credited,
    annualised: ann,
    segmentYears: shape.segmentYears,
    working: parts.join(', ') + '.',
  };
}

/** A segment result expressed per year. Geometric, not divided. */
export function annualise(segmentCredited: number, segmentYears: number): number {
  if (segmentYears <= 1) return segmentCredited;
  if (1 + segmentCredited <= 0) return -1;
  return Math.pow(1 + segmentCredited, 1 / segmentYears) - 1;
}

/**
 * Shapes whose recorded parameters were inferred from wording rather than
 * stated. Surfaced deliberately: these are the rows to confirm before an
 * illustration leaves the building.
 */
export function shapesNeedingConfirmation(): readonly IndexAccountShape[] {
  return INDEX_ACCOUNT_SHAPES.filter((s) => Boolean(s.inferred));
}

export const SHAPES_VERSION = {
  version: '2026.09.2',
  compiledOn: '2026-09-19',
  neverPrinted: [
    'A maximum illustrated rate computed from a cap and a participation rate. Under AG 49-A that figure is the carrier illustration actuary\'s, and deriving it here is how an illustration ends up above the line.',
    'A segment credited rate presented as an annual rate. A 2-year segment credits once; calling that an annual figure roughly doubles it.',
    'A multi-year cap read as an annual cap. Pacific\'s 2-Year account is capped at 24% ACROSS the segment, which is about 11.4% a year, not 24% a year.',
    'A declared participation rate quoted as a term. The No Cap Dynamic Par account\'s 50% is the illustration\'s assumption; the carrier guarantees 5% and redeclares the rest as often as monthly.',
    'A credited value for an uncapped account whose spread or spread basis is not on file.',
    'A credited value computed from a total-return index series. Index crediting uses price return.',
    'A carrier backtest described as a maximum illustrated rate, an expected return, or a projection. It is what an account would have done under current assumptions applied retroactively, on a product that did not exist for most of the window.',
    'That a participation rate above 100% means the account outperforms. Above 100% participation on a volatility-controlled index is a lower-volatility index geared up, not a higher return; and 200% participation with a 0.80% charge can finish below 100% participation with a cap.',
  ],
} as const;

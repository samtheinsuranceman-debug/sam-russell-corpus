// ─── Index account shapes ───────────────────────────────────────────────────
// What an indexed account can actually be, and what each one credits.
//
// ## Why this exists
//
// The illustration path modelled one shape: a single cap, a single floor, 100%
// participation, one year at a time. Real products are not that, and the gap
// costs real sales. The Minnesota Life illustration in the corpus carries seven
// accounts on one page — one capped 1-year point-to-point and six uncapped
// multi-year accounts with participation rates above 100% and a segment spread.
// An engine that can only express the first cannot show the structure the
// carrier is actually selling, so the conversation defaults to the least
// interesting account on the page.
//
// That is the honest version of "more flexibility". Not a higher cap — a wider
// vocabulary. Every shape here is read off a carrier document, every one carries
// its own AG 49-A maximum illustrated rate as the carrier published it, and
// nothing may be illustrated on a shape with no sourced maximum.
//
// ## The arithmetic, stated once
//
// Capped point-to-point:      credited = clamp(index × participation, floor, cap)
// Uncapped with a spread:     credited = max(floor, index × participation − spread)
//
// Two details decide whether the second one is right or wrong by several
// percentage points, so neither is inferred:
//
//   `segmentYears` — a 2-year segment credits once, at the end, on the index's
//   movement across the whole two years. Treating that as an annual rate
//   roughly doubles it. Annualising is a separate, explicit call.
//
//   `spreadBasis` — whether the spread is deducted once per segment or once per
//   year of it. On a 2-year segment at 2.50%, the two readings differ by 250
//   basis points on the credited result. The Minnesota accounts are recorded as
//   per-segment because the disclosure calls them "segment spreads", and that
//   reading is flagged below as the one figure in this file inferred from
//   wording rather than stated outright. It is the first thing to confirm
//   against the carrier before an illustration goes out on a Balanced account.
//
// ## What this file will not do
//
// It will not compute a maximum illustrated rate. Under AG 49-A that is the
// carrier illustration actuary's figure, derived from the product's own
// parameters against the benchmark index account, and a shape with no published
// maximum is a refusal — never a shape whose maximum is calculated here from its
// cap and participation. That inversion is the single most common way an
// illustration ends up above the line.

export type CreditingMethod = 'point-to-point-capped' | 'point-to-point-uncapped-spread';

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
  /** Floor as a decimal. 0 = a 0% floor. */
  readonly floor: number;
  /** Cap as a decimal, or null for an uncapped account. */
  readonly cap: number | null;
  /** Spread as a decimal, or null where none applies. */
  readonly spread: number | null;
  /** Whether `spread` is charged once per segment or once per year of it. */
  readonly spreadBasis: 'per-segment' | 'per-year' | null;
  /**
   * The AG 49-A maximum illustrated rate for THIS account, as the carrier
   * published it. Decimal. Never computed here.
   */
  readonly maxIllustratedRate: number;
  /** The carrier document this row was read from. */
  readonly source: string;
  readonly readOn: string;
  /**
   * Anything in this row inferred from the document's wording rather than
   * stated outright. Present means: confirm before illustrating.
   */
  readonly inferred?: string;
}

/**
 * Verified shapes only.
 *
 * Two products. Both read off a carrier document held in this corpus; nothing
 * here came from memory or from a secondary summary, because a stale index
 * parameter is worse than an absent one — it looks current.
 */
export const INDEX_ACCOUNT_SHAPES: readonly IndexAccountShape[] = [
  // ── Pacific Life — Pacific Horizon IUL, Enhanced Cash Value ──────────────
  {
    id: 'pacific-horizon-ecv-1yr',
    productId: 'pacific-horizon-ecv',
    label: '1-Year Indexed Account',
    index: 'S&P 500 (excluding dividends)',
    method: 'point-to-point-capped',
    segmentYears: 1,
    participation: 1.0,
    floor: 0,
    cap: null,
    spread: null,
    spreadBasis: null,
    maxIllustratedRate: 0.0635,
    source: 'Carrier illustration, 1-Year Indexed Account line: 0 / 6.35% / 6.35% / 100.00%',
    readOn: '2026-09-18',
    inferred:
      'The account line gives floor, illustrated rate, maximum illustrated rate and allocation, but not the cap. Recorded as null rather than guessed; a capped account with no cap on file cannot have its credited value computed, only its illustrated rate used.',
  },

  // ── Minnesota Life — Balanced Growth Accumulator III ─────────────────────
  // Read from the illustration prepared 15 September 2026, Case ID 29335303.
  // This is the product that makes the uncapped shapes worth modelling.
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
    spread: null,
    spreadBasis: null,
    maxIllustratedRate: 0.0662,
    source: 'Minnesota Life Balanced Growth Accumulator III illustration, Case ID 29335303, prepared 15 September 2026 — account table',
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
    source: 'Minnesota Life Balanced Growth Accumulator III illustration, Case ID 29335303 — Balanced Indexed Account 2: uncapped, 110% participation, 2.50% segment spread, 2-year segment',
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

  if (shape.method === 'point-to-point-capped') {
    if (shape.cap === null) {
      return {
        ok: false,
        reason: `${shape.label} is a capped account but no cap is on file. The illustrated rate may still be used; a credited value cannot be computed without the cap.`,
      };
    }
    const credited = Math.min(Math.max(participated, shape.floor), shape.cap);
    return {
      ok: true,
      segmentCredited: credited,
      annualised: annualise(credited, shape.segmentYears),
      segmentYears: shape.segmentYears,
      working:
        `${(indexReturn * 100).toFixed(2)}% index × ${(shape.participation * 100).toFixed(0)}% participation = ` +
        `${(participated * 100).toFixed(2)}%, then bounded by a ${(shape.floor * 100).toFixed(0)}% floor and a ` +
        `${(shape.cap * 100).toFixed(2)}% cap → ${(credited * 100).toFixed(2)}% credited over ${shape.segmentYears} year${shape.segmentYears === 1 ? '' : 's'}.`,
    };
  }

  // Uncapped with a spread.
  if (shape.spread === null || shape.spreadBasis === null) {
    return {
      ok: false,
      reason: `${shape.label} is an uncapped account, so its credited value depends entirely on the spread and how the spread is charged. Neither is on file.`,
    };
  }
  const totalSpread = shape.spreadBasis === 'per-year' ? shape.spread * shape.segmentYears : shape.spread;
  const credited = Math.max(shape.floor, participated - totalSpread);
  return {
    ok: true,
    segmentCredited: credited,
    annualised: annualise(credited, shape.segmentYears),
    segmentYears: shape.segmentYears,
    working:
      `${(indexReturn * 100).toFixed(2)}% index over ${shape.segmentYears} years × ${(shape.participation * 100).toFixed(0)}% participation = ` +
      `${(participated * 100).toFixed(2)}%, less a ${(shape.spread * 100).toFixed(2)}% spread charged ${shape.spreadBasis} ` +
      `(${(totalSpread * 100).toFixed(2)}% total), floored at ${(shape.floor * 100).toFixed(0)}% → ` +
      `${(credited * 100).toFixed(2)}% credited over the segment, ${(annualise(credited, shape.segmentYears) * 100).toFixed(2)}% a year.`,
  };
}

/** A segment result expressed per year. Geometric, not divided. */
export function annualise(segmentCredited: number, segmentYears: number): number {
  if (segmentYears <= 1) return segmentCredited;
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
  version: '2026.09.1',
  compiledOn: '2026-09-19',
  neverPrinted: [
    'A maximum illustrated rate computed from a cap and a participation rate. Under AG 49-A that figure is the carrier illustration actuary\'s, and deriving it here is how an illustration ends up above the line.',
    'A segment credited rate presented as an annual rate. A 2-year segment credits once; calling that an annual figure roughly doubles it.',
    'A credited value for an uncapped account whose spread or spread basis is not on file.',
    'A credited value computed from a total-return index series. Index crediting uses price return.',
    'That a participation rate above 100% means the account outperforms. Above 100% participation with a spread can credit less than 100% participation with a cap, and which wins depends entirely on the index movement.',
  ],
} as const;

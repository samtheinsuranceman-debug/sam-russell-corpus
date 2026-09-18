// ─── AG 49-A maximum illustrated rates, per product ─────────────────────────
//
// ## Why this table exists
//
// `mortgageKiller.ts` defaulted its crediting rate to 7.5% and a header comment
// asserted "AG 49 Compliance: 7.5% max illustrated rate". The illustrated
// product's actual maximum illustrated rate is 6.35%, recorded correctly in
// `pacificHorizonEcv.ts`. Both cannot be right, and the reason they conflict is
// a category error worth stating plainly:
//
//   **There is no industry-wide AG 49-A maximum illustrated rate.**
//
// Under Actuarial Guideline 49-A the maximum illustrated rate is computed by
// each carrier's illustration actuary from THAT product's own index
// parameters — its cap, participation rate, floor, asset-charge structure and
// the benchmark index account. Two products from the same carrier can carry
// different maxima, and a product's maximum moves when the carrier re-rates it.
//
// So a global constant cannot be correct for any product except by accident,
// and illustrating above a product's own maximum is a compliance problem rather
// than an aggressive assumption.
//
// ## The rule this table enforces
//
// A product with no row here cannot be illustrated. `capFor` returns null and
// the caller must refuse rather than fall back to a default — because the
// fallback is exactly the error this table exists to remove.
//
// ## Filling it
//
// Each row needs the carrier's own disclosure or illustration, the rate as
// published, and the date it was read. `data/questions.csv` Q-03 is the
// research job. A row must not be added from memory or from a secondary
// summary: the figure moves, and a stale maximum is worse than an absent one
// because it looks current.

export interface Ag49Product {
  /** Stable id, referenced by engines and by the rules registry. */
  readonly id: string;
  readonly carrier: string;
  readonly product: string;
  /** The AG 49-A maximum illustrated rate, as a decimal. 0.0635 = 6.35%. */
  readonly maxIllustratedRate: number;
  /** The rate the carrier's own illustration runs at, where it differs from the maximum. */
  readonly illustratedRate: number;
  /** Allocation to the indexed account the maximum was computed for, as a decimal. */
  readonly allocation: number;
  /** The carrier document the figure was read from. */
  readonly disclosureUrl: string;
  /** The date the disclosure states it is effective from. */
  readonly effectiveDate: string;
  /** When we read it. */
  readonly readOn: string;
  readonly note?: string;
}

/**
 * Verified products only.
 *
 * One row today. That is not an oversight — it is the only product for which a
 * carrier figure has actually been read. The rest arrive with Q-03.
 */
export const AG49_PRODUCTS: readonly Ag49Product[] = [
  {
    id: "pacific-horizon-ecv",
    carrier: "Pacific Life",
    product: "Pacific Horizon IUL — Enhanced Cash Value",
    maxIllustratedRate: 0.0635,
    illustratedRate: 0.0635,
    allocation: 1.0,
    disclosureUrl: "carrier illustration, 1-Year Indexed Account line: 0 / 6.35% / 6.35% / 100.00%",
    effectiveDate: "2026",
    readOn: "2026-09-18",
    note: "Read off the illustration's own account table, where the illustrated rate and the maximum illustrated rate are both 6.35% at 100% allocation. Mirrors shared/pacificHorizonEcv.ts.",
  },
];

export const AG49_VERSION = {
  version: "2026.09.1",
  compiledOn: "2026-09-18",
  neverPrinted: [
    "An industry-wide maximum illustrated rate. AG 49-A computes the maximum per product, from that product's own index parameters.",
    "A maximum for a product with no row in this table. An absent product is a refusal, never a default.",
    "That the maximum illustrated rate is an expected return. It is the ceiling a projection may use, not a forecast.",
    "A maximum read from a secondary summary rather than the carrier's own disclosure.",
  ],
} as const;

/** The product's maximum illustrated rate, or null where none has been verified. */
export function capFor(productId: string): number | null {
  for (let i = 0; i < AG49_PRODUCTS.length; i++) {
    if (AG49_PRODUCTS[i].id === productId) return AG49_PRODUCTS[i].maxIllustratedRate;
  }
  return null;
}

export function productFor(productId: string): Ag49Product | null {
  for (let i = 0; i < AG49_PRODUCTS.length; i++) {
    if (AG49_PRODUCTS[i].id === productId) return AG49_PRODUCTS[i];
  }
  return null;
}

export type CapCheck =
  | { readonly ok: true; readonly rate: number; readonly cap: number; readonly product: Ag49Product }
  | { readonly ok: false; readonly reason: string; readonly cap: number | null };

/**
 * Check a proposed crediting rate against a product's maximum.
 *
 * Returns a refusal rather than silently clamping. Clamping would produce a
 * compliant number from a non-compliant request without telling anyone the
 * request was made, and the request is the thing worth knowing about.
 */
export function checkRate(productId: string | null | undefined, rate: number): CapCheck {
  if (!productId) {
    return {
      ok: false,
      cap: null,
      reason: "No product was named. AG 49-A maxima are product-specific, so a rate cannot be validated without one.",
    };
  }
  const p = productFor(productId);
  if (!p) {
    return {
      ok: false,
      cap: null,
      reason: `No verified AG 49-A maximum is on file for "${productId}". Read it from the carrier's disclosure before illustrating this product.`,
    };
  }
  if (rate > p.maxIllustratedRate + 1e-9) {
    return {
      ok: false,
      cap: p.maxIllustratedRate,
      reason: `${(rate * 100).toFixed(2)}% exceeds the AG 49-A maximum illustrated rate of ${(p.maxIllustratedRate * 100).toFixed(2)}% for ${p.carrier} ${p.product}.`,
    };
  }
  return { ok: true, rate, cap: p.maxIllustratedRate, product: p };
}

export const AG49_DISCLOSURE =
  "The maximum illustrated rate under AG 49-A is computed per product by the carrier's illustration actuary. " +
  "It is a ceiling on what may be illustrated, not a projection, an expectation, or a guarantee.";

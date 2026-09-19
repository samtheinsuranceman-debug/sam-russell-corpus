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
 * Two rows. Both were read off a carrier document held in this corpus. The list
 * grows only that way — each addition widens what may be illustrated at all,
 * which is where flexibility in this product legitimately comes from, and none
 * of it comes from memory or a secondary summary. The rest arrive with Q-03.
 */
export const AG49_PRODUCTS: readonly Ag49Product[] = [
  {
    id: "pacific-horizon-ecv",
    carrier: "Pacific Life",
    product: "Pacific Horizon IUL — Enhanced Cash Value",
    maxIllustratedRate: 0.0635,
    illustratedRate: 0.0635,
    allocation: 1.0,
    disclosureUrl:
      "Pacific Horizon ECV IUL illustration, form ICC21 P21IUL / S22ECV, run 16 September 2026 — account table `1-Year Indexed Account | 0 | 6.35% | 6.35% | 100.00%` (floor / illustrated / maximum illustrated / allocation), and the Maximum Illustrated Rates page",
    effectiveDate: "2026",
    readOn: "2026-09-19",
    note:
      "Read off the illustration's own account table, where the illustrated rate and the maximum illustrated rate are both 6.35% at 100% allocation. Mirrors shared/pacificHorizonEcv.ts. The illustration also states how the carrier derives the figure, which is worth keeping because it is the clearest statement of an AG 49 lookback in this corpus: the maximum illustrated rates for indexed accounts are based on a hypothetical lookback for the 1-Year Indexed Account, equal to the arithmetic mean of the geometric average annual credited rates for each 25-year period from 12/31/1960 to 12/31/2025, using actual S&P 500 data and the CURRENT growth cap. The carrier prints the distribution alongside it — lowest 25-year period 4.36%, mean 6.35%, highest 7.79% — so the maximum illustrated rate is the middle of that range, not the top. Two consequences follow. The figure moves when the carrier re-rates the cap, because the lookback is recomputed on the current cap. And the product's eight indexed accounts are in shared/indexAccountShapes.ts, but only this one has a maximum on file; the carrier derives the product's whole maximum from this account, which does not make it the maximum for the others.",
  },
  {
    id: "mn-life-bga3",
    carrier: "Minnesota Life",
    product: "Balanced Growth Accumulator III",
    maxIllustratedRate: 0.0662,
    illustratedRate: 0.0662,
    allocation: 1.0,
    disclosureUrl:
      "Minnesota Life Balanced Growth Accumulator III illustration, Case ID 29335303, prepared 15 September 2026 — account table and AG 49 statement",
    effectiveDate: "2026",
    readOn: "2026-09-19",
    note:
      "The second verified product, and the one that makes the uncapped account shapes worth modelling: seven accounts on one page — one capped 1-year point-to-point at 100% participation / 10.50% cap / 0% floor, and six uncapped multi-year accounts with participation of 100%-115% and segment spreads of 1.00%-2.50%. Per-account maxima run 6.57%-6.62%; recorded here is the product's highest, 6.62%, computed by the carrier on the S&P 500 excluding dividends. Per-account index parameters are in shared/indexAccountShapes.ts. The carrier also publishes a 25-year rolling range for the 100%/10.50%/0% structure since 1949 — 4.16% low, 8.21% high. That is a carrier-published historical figure rather than a projection, which is precisely why it is the strongest number on the page.",
  },
];

/**
 * Products known to exist, with no maximum illustrated rate on file.
 *
 * Deliberately a separate list rather than rows with a null rate, because the
 * distinction is the whole discipline: AG49_PRODUCTS is what may be
 * illustrated, and this is a research queue. Nothing here may reach an
 * illustration, and each row says exactly what document would move it across.
 *
 * Compiled from Pacific Life IUF3969-00 (8/26), "Our Suite of Indexed Universal
 * Life Insurance Products", which names the suite and each product's accounts
 * but prints no maxima — a maximum illustrated rate lives on an illustration,
 * not in a brochure.
 */
export interface ProductAwaitingMaximum {
  readonly id: string;
  readonly carrier: string;
  readonly product: string;
  readonly formSeries: string;
  /** Accounts the carrier lists for it. */
  readonly accounts: readonly string[];
  /** What is needed to promote it into AG49_PRODUCTS. */
  readonly needs: string;
  readonly source: string;
  readonly readOn: string;
  readonly note?: string;
}

export const PRODUCTS_AWAITING_MAXIMUM: readonly ProductAwaitingMaximum[] = [
  {
    id: "pacific-horizon-iul-21",
    carrier: "Pacific Life",
    product: "Pacific Horizon IUL 21",
    formSeries: "P21IUL",
    accounts: [
      "1-Year", "1-Year High Cap", "1-Year No Cap Dynamic Par", "1-Year Invesco QQQ",
      "1-Year High Par Volatility Control", "2-Year", "High Par 5-Year",
      "Loaned 1-Year Volatility Control",
    ],
    needs: "A run illustration for this product, read at its account table for the per-account maximum illustrated rate.",
    source: "Pacific Life IUF3969-00 (8/26), suite comparison",
    readOn: "2026-09-19",
    note:
      "Carries a Loaned 1-Year Volatility Control account, which the ECV product does not. A loaned indexed account is the participating-loan mechanism as a named account rather than a loan election, so it belongs in any loan comparison once its parameters are read. Current premium load 5.90% non-qualified / 4.90% qualified, guaranteed 6.90%.",
  },
  {
    id: "pacific-horizon-survivorship-iul",
    carrier: "Pacific Life",
    product: "Pacific Horizon Survivorship IUL 2/3",
    formSeries: "P15SIL / P26SIL, S22SHZN / S26SHZN",
    accounts: [
      "1-Year", "1-Year High Cap", "1-Year Invesco QQQ", "2-Year", "High Par 5-Year",
      "1-Year Barclays Large Cap Intraday VC10", "1-Year SG Nasdaq-100 Edge VC10",
      "Loaned 1-Year Barclays Large Cap Intraday VC10", "Loaned 1-Year SG Nasdaq-100 Edge VC10",
    ],
    needs: "A run illustration for this product, read at its account table.",
    source: "Pacific Life IUF3969-00 (8/26), suite comparison",
    readOn: "2026-09-19",
    note:
      "Nine accounts, the widest in the suite, and the only one covering two lives — which makes it the product for a couple with a large age or health difference. Current premium load 6.80% non-qualified / 5.80% qualified, guaranteed 7.80%. Note that IUC4009, the account-parameter document read for ECV, covers this product too, so its account parameters are obtainable from a document already in the corpus; only the maxima are missing.",
  },
  {
    id: "pacific-trident-iul",
    carrier: "Pacific Life",
    product: "Pacific Trident IUL",
    formSeries: "S20TRI",
    accounts: [
      "1-Year", "1-Year High Cap Flex", "1-Year High Cap Plus", "1-Year International",
      "1-Year No Cap Flex", "1-Year Plus", "2-Year", "High Par 5-Year",
    ],
    needs: "A run illustration, plus an account-parameter document — IUC4009 does not cover Trident, so its caps and participation rates are not in this corpus at all.",
    source: "Pacific Life IUF3969-00 (8/26), suite comparison",
    readOn: "2026-09-19",
    note:
      "The one product in the suite with NO premium load, guaranteed — against 5.20% to 6.80% current on the others. For a premium-financing or accumulation design that difference compounds from the first dollar and is contractual rather than current, which makes it the strongest single fact about any product in this queue. It also offers a Lapse Return of Premium Guarantee rider returning up to 85% of premiums on surrender in the first ten policy years. It has no Enhanced Performance Factor Rider, which is the trade.",
  },
];

/** Nothing in the queue may be illustrated. This is the guard callers use. */
export function awaitingMaximum(productId: string): ProductAwaitingMaximum | null {
  for (let i = 0; i < PRODUCTS_AWAITING_MAXIMUM.length; i++) {
    if (PRODUCTS_AWAITING_MAXIMUM[i].id === productId) return PRODUCTS_AWAITING_MAXIMUM[i];
  }
  return null;
}

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

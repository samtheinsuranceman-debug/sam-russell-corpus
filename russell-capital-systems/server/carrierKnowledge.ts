/**
 * Carrier Knowledge — the advisor's access to the platform's own product data.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * THE PROBLEM THIS SOLVES
 *
 * The platform holds real numbers: IUL cap rates, participation rates, floors,
 * loan rates, cost-of-insurance charges, thirty years of index returns, carrier
 * financial-strength ratings, annuity products by state. Until now the advisor
 * could not see any of it, so a question like "what is Nationwide's cap?" was
 * answered from whatever the model absorbed during training — which is to say,
 * guessed.
 *
 * A guessed cap rate is the single most dangerous output this platform can
 * produce. Somebody repeats it to a client, the client plans around it, and it
 * was never true. Every other quality problem is recoverable; that one is not.
 *
 * So the advisor now reads from these tables. Two mechanisms:
 *
 *   1. A compact summary injected into every conversation, so he knows what he
 *      has and never invents a carrier that is not in the book.
 *   2. `lookupCarrier` for the detail — full parameters, ratings, and the
 *      backtested crediting history for a specific product.
 *
 * ─── AND THE PART THAT MATTERS MORE ─────────────────────────────────────────
 *
 * He is also told, explicitly, what this data is NOT. It is the platform's
 * stored reference, not a live carrier feed. Rates change; a cap recorded here
 * may have moved. Anything a client will act on gets verified against the
 * carrier's current illustration. The advisor states the figure AND its
 * provenance, every time — "the platform's stored rate, which needs confirming
 * against a current illustration" — because a number delivered without its
 * provenance is a number somebody will treat as gospel.
 */
import { IUL_CARRIERS, IUL_DATA_IS_SAMPLE, type IULCarrier } from "@shared/iulCarriers";
import {
  ALL_INDEX_OPTIONS,
  INDEX_RETURNS_ARE_VERIFIED,
  INDEX_RETURN_SOURCES,
  RAW_INDEX_RETURNS,
  getCreditedRate,
  type IndexOption,
} from "@shared/indexCreditingData";
import { CARRIER_RATINGS, type CarrierRating } from "@shared/carrierRatings";
import { ALL_ANNUITY_PRODUCTS } from "@shared/annuityData";

const pct = (decimal: number) => `${(decimal * 100).toFixed(2)}%`;

/**
 * The always-on summary. Kept deliberately short — it rides along on every
 * turn, so it names what exists and leaves the detail to the lookup.
 */
/**
 * Real carrier sheets the owner has entered, loaded once and cached.
 *
 * The moment one real sheet exists, the advisor's summary leads with the real
 * carriers and demotes the placeholders to a footnote rather than the headline.
 * The sample warning does NOT disappear while placeholders remain — a half
 * migrated book is the most dangerous state, because the real and the fake sit
 * side by side looking identical.
 */
export type RealCarrier = {
  carrierSlug: string;
  carrierName: string;
  productName: string;
  capRate: number | null;
  participationRate: number | null;
  floorRate: number | null;
  loanRate: number | null;
  loadFee: number | null;
  coiRate: number | null;
  amBestRating: string | null;
  isMutual: boolean;
  acceptsCreditCard: boolean;
  creditCardMonthlyCap: number | null;
  sourceNote: string | null;
  asOfDate: string;
};

let realCache: RealCarrier[] = [];
let realCacheAt = 0;
const REAL_CACHE_TTL_MS = 60_000;

export async function loadRealCarriers(): Promise<RealCarrier[]> {
  if (Date.now() - realCacheAt < REAL_CACHE_TTL_MS) return realCache;
  try {
    const { getDb } = await import("./db");
    const db = await getDb();
    if (!db) return realCache;
    const { carrierRateSheets } = await import("../drizzle/schema");
    const { isNull } = await import("drizzle-orm");
    const rows = await db.select().from(carrierRateSheets).where(isNull(carrierRateSheets.supersededAt));
    const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));
    realCache = rows.map(r => ({
      carrierSlug: r.carrierSlug,
      carrierName: r.carrierName,
      productName: r.productName,
      capRate: num(r.capRate),
      participationRate: num(r.participationRate),
      floorRate: num(r.floorRate),
      loanRate: num(r.loanRate),
      loadFee: num(r.loadFee),
      coiRate: num(r.coiRate),
      amBestRating: r.amBestRating,
      isMutual: r.isMutual,
      acceptsCreditCard: r.acceptsCreditCard,
      creditCardMonthlyCap: r.creditCardMonthlyCap,
      sourceNote: r.sourceNote,
      asOfDate: r.asOfDate,
    }));
    realCacheAt = Date.now();
  } catch {
    // A database hiccup must not take the advisor down; he just runs without
    // the real sheets and keeps the sample warning up, which is the safe side.
  }
  return realCache;
}

/** Drop the cache after a sheet is saved. */
export function invalidateRealCarriers() {
  realCacheAt = 0;
}

/** Render the real carriers for the advisor's prompt. */
export function realCarrierBlock(real: RealCarrier[]): string {
  if (real.length === 0) return "";
  const pctOrNull = (v: number | null) => (v === null ? "not on file" : pct(v));
  const lines = real.map(c => {
    const cc = c.acceptsCreditCard
      ? ` | accepts credit card${c.creditCardMonthlyCap ? ` up to $${c.creditCardMonthlyCap.toLocaleString()}/mo` : ""}`
      : "";
    return (
      `  ${c.carrierName} — ${c.productName} | cap ${pctOrNull(c.capRate)} | par ${pctOrNull(c.participationRate)} | ` +
      `floor ${pctOrNull(c.floorRate)} | loan ${pctOrNull(c.loanRate)} | load ${pctOrNull(c.loadFee)} | ` +
      `COI ${pctOrNull(c.coiRate)}${c.amBestRating ? ` | AM Best ${c.amBestRating}` : ""}` +
      `${c.isMutual ? " | mutual" : ""}${cc}\n` +
      `      as of ${c.asOfDate}${c.sourceNote ? ` — ${c.sourceNote}` : ""}`
    );
  });

  return [
    "═══ REAL CARRIER TERMS ON FILE ═══",
    "",
    `${real.length} real product${real.length === 1 ? "" : "s"}, entered from carrier rate sheets:`,
    ...lines,
    "",
    "THESE are the figures to quote. Always give the AS-OF DATE with the number —",
    "\"their stored cap is X as of <date>, from <source>; confirm against a current",
    "illustration before anyone acts on it.\" A rate with no date behind it is a",
    "rate nobody can defend twelve months from now.",
    "",
    "A field marked 'not on file' is genuinely unknown. Say so. Do not fill it",
    "from the sample table below, and do not fill it from memory.",
    "",
  ].join("\n");
}

export function buildCarrierSummary(real: RealCarrier[] = []): string {
  const carrierLines = IUL_CARRIERS.map(c => {
    const rating = CARRIER_RATINGS.find(r => r.carrierId === c.id);
    return `  ${c.name} — ${c.product} | cap ${pct(c.capRate)} | par ${pct(c.participationRate)} | floor ${pct(c.floorRate)} | loan ${pct(c.loanRate)} | load ${pct(c.loadFee)} | COI ${pct(c.coiRate)} | AM Best ${c.amBestRating}${rating ? ` | Comdex ${rating.financials.comdexScore}` : ""}`;
  });

  const indices = Object.keys(RAW_INDEX_RETURNS);
  const years = Object.keys(RAW_INDEX_RETURNS[indices[0]] ?? {});
  const firstYear = years[0];
  const lastYear = years[years.length - 1];

  // The provenance warnings come FIRST, before any number. A caveat that
  // arrives after the figure is a caveat nobody reads.
  const provenanceWarning: string[] = [];

  if (IUL_DATA_IS_SAMPLE) {
    provenanceWarning.push(
      "⚠ CRITICAL — THESE ARE NOT REAL CARRIERS ⚠",
      "",
      "Every product below is SAMPLE DATA. The names are placeholders built around",
      "rating tiers ('AAA+ Mutual', 'BBB Mutual'). None of them is Nationwide,",
      "Allianz, Pacific Life, Penn Mutual or any other real company, and the caps and",
      "participation rates are industry-typical illustrations rather than any real",
      "product's contract terms.",
      "",
      "You must therefore:",
      "  • Say so, unprompted, the first time you quote any figure from this data.",
      "    The correct form is: \"these are the platform's sample figures, not a real",
      "    carrier's — real numbers have to come off that carrier's current rate",
      "    sheet.\" Never present a number here as a real product's terms.",
      "  • NEVER attach one of these figures to a real carrier's name, even if the",
      "    client names that carrier first. If you are asked what Nationwide caps at,",
      "    the answer is that the platform does not hold Nationwide's real figures —",
      "    not a number from this table.",
      "  • Refuse outright to let any of this go into a client-facing illustration,",
      "    proposal or filing, and say plainly why.",
      "",
    );
  }

  if (!INDEX_RETURNS_ARE_VERIFIED) {
    provenanceWarning.push(
      "⚠ THE INDEX RETURN HISTORY IS UNVERIFIED ⚠",
      "",
      "The annual index returns behind every backtest below have not been reconciled",
      "against the published record. Any backtested average you quote is ILLUSTRATIVE",
      "ARITHMETIC, not history. Say that whenever you give one, and never describe it",
      "as what a strategy 'would have returned'.",
      "",
    );
  } else {
    // The index history IS real, and the advisor should be able to say where
    // it came from — a sourced figure is worth far more than a hedged one.
    provenanceWarning.push(
      "INDEX HISTORY — THIS PART IS REAL AND SOURCED",
      "",
      `The annual index returns behind every backtest are ${INDEX_RETURN_SOURCES.basis},`,
      `covering ${INDEX_RETURN_SOURCES.firstYear}–${INDEX_RETURN_SOURCES.lastYear}, each series checked against two`,
      `independent published sources (verified ${INDEX_RETURN_SOURCES.verifiedOn}). You may cite`,
      "these as real index history.",
      "",
      "Price return means DIVIDENDS EXCLUDED, and that is correct rather than a",
      "shortcut: the carrier hedges with options on the index and never receives the",
      "dividends, so the index's price movement is what a policy actually credits off.",
      "If someone compares a backtest here to a stock-market return they saw quoted",
      "elsewhere, that difference is almost always dividends — say so.",
      "",
      "What a backtest still is NOT: a projection. It is what these contract terms",
      "would have credited against past index movement. AG 49-B limits what may be",
      "illustrated, and past index behaviour does not bind the future.",
      "",
    );
  }

  return [
    "═══ PLATFORM CARRIER DATA ═══",
    "",
    // Real terms lead. Everything below them is explicitly demoted.
    realCarrierBlock(real),
    ...provenanceWarning,
    real.length > 0
      ? `SAMPLE PRODUCTS (for demonstrating the math only — never quote these to anyone). ${IUL_CARRIERS.length} on file:`
      : `You have ${IUL_CARRIERS.length} IUL products on file with these parameters:`,
    ...carrierLines,
    "",
    `You also have ${ALL_INDEX_OPTIONS.length} index crediting strategies with their caps, floors, participation rates, spreads and strategy charges, and raw annual returns for ${indices.join(", ")} from ${firstYear} to ${lastYear}. That means you can backtest an actual crediting history rather than assuming an average.`,
    "",
    `And ${CARRIER_RATINGS.length} carrier financial-strength records (AM Best, S&P, Moody's, Fitch, Comdex, surplus ratio, years in business), plus ${ALL_ANNUITY_PRODUCTS.length} annuity products with state availability and guaranty-association limits.`,
    "",
    "HOW TO USE IT",
    "",
    "To pull full detail on one carrier — every index option, the rating record,",
    "and a backtested crediting history — emit exactly this and nothing else:",
    "",
    '  CARRIER_LOOKUP: {"carrier": "<name or id>"}',
    "",
    "RULES, AND THESE ARE NOT OPTIONAL:",
    "",
    "1. NEVER state a cap, participation rate, floor, loan rate, COI or credited",
    "   rate from memory. If it is not in the data above or returned by a lookup,",
    "   say you do not have it and that it needs to come from the carrier's",
    "   current illustration.",
    "2. NEVER invent a carrier. If a client names one not on this list, say it is",
    "   not in the platform's book rather than describing it from training data.",
    "3. ALWAYS give the figure with its provenance. The correct form is: \"the",
    "   platform's stored rate for this product is X — confirm against a current",
    "   illustration before anyone acts on it.\" Not just \"X\".",
    "4. These are stored reference figures, not a live feed. Carriers move caps",
    "   and participation rates. Treat every number here as accurate as of when",
    "   it was recorded, and say so.",
    "",
  ].join("\n");
}

export type CarrierDetail = {
  found: boolean;
  text: string;
};

/** Match on id, full name, product name, or a distinctive fragment. */
function findCarrier(query: string): IULCarrier | undefined {
  const q = query.toLowerCase().trim();
  return (
    IUL_CARRIERS.find(c => c.id.toLowerCase() === q) ??
    IUL_CARRIERS.find(c => c.name.toLowerCase() === q) ??
    IUL_CARRIERS.find(c => c.name.toLowerCase().includes(q) || q.includes(c.name.toLowerCase())) ??
    IUL_CARRIERS.find(c => c.product.toLowerCase().includes(q))
  );
}

/** Backtest one index option across every year we hold returns for. */
function backtestOption(option: IndexOption): { years: number[]; rates: number[]; average: number; zeroYears: number } {
  const raw = RAW_INDEX_RETURNS[option.index] ?? {};
  const years = Object.keys(raw)
    .map(Number)
    .filter(y => y >= (option.availableFrom ?? 0))
    .sort((a, b) => a - b);

  const rates = years.map(y => {
    try {
      return getCreditedRate(option, y);
    } catch {
      return 0;
    }
  });

  const average = rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
  // Years the floor did the work. This is the number that tells you what the
  // strategy actually does in a bad decade, and it is routinely left out.
  const zeroYears = rates.filter(r => r <= option.floor + 0.001).length;

  return { years, rates, average, zeroYears };
}

/**
 * Full detail for one carrier: contract parameters, every index strategy with
 * a real backtest, and the financial-strength record.
 */
export function lookupCarrier(query: string): CarrierDetail {
  const carrier = findCarrier(query);

  if (!carrier) {
    return {
      found: false,
      text: `No carrier matching "${query}" is in the platform's book. Available: ${IUL_CARRIERS.map(c => c.name).join(", ")}. Do not describe a carrier that is not on this list from memory — say it is not on file.`,
    };
  }

  const rating = CARRIER_RATINGS.find(r => r.carrierId === carrier.id);
  const options = ALL_INDEX_OPTIONS.filter(o => o.carrier === carrier.id);

  const lines: string[] = [
    `═══ ${carrier.name} — ${carrier.product} ═══`,
    "",
    ...(IUL_DATA_IS_SAMPLE
      ? [
          "⚠ SAMPLE PRODUCT — NOT A REAL CARRIER. This is a placeholder built around a",
          "rating tier. Do not attach these figures to any real company's name, and say",
          "they are sample figures whenever you quote one.",
          "",
        ]
      : []),
    "CONTRACT PARAMETERS (platform's stored figures)",
    `  S&P 500 cap:          ${pct(carrier.capRate)}`,
    `  Participation rate:   ${pct(carrier.participationRate)}`,
    `  Floor:                ${pct(carrier.floorRate)}`,
    `  Policy loan rate:     ${pct(carrier.loanRate)}`,
    `  Premium load:         ${pct(carrier.loadFee)}`,
    `  Cost of insurance:    ${pct(carrier.coiRate)}`,
    `  Avg illustrated rate: ${pct(carrier.avgIllustratedRate)}`,
    `  AM Best:              ${carrier.amBestRating}`,
    "",
    carrier.description,
    "",
  ];

  if (rating) {
    lines.push(
      "FINANCIAL STRENGTH",
      `  AM Best ${rating.amBest.rating} (${rating.amBest.outlook}) · S&P ${rating.sp.rating} · Moody's ${rating.moodys.rating} · Fitch ${rating.fitch.rating}`,
      `  Comdex ${rating.financials.comdexScore}/100 · surplus ratio ${rating.financials.surplusRatio}% · ${rating.financials.yearsInBusiness} years in business`,
      `  Total assets ${rating.financials.totalAssets} · policyholder surplus ${rating.financials.policyholderSurplus}`,
      `  Claims-paying ability: ${rating.financials.claimsPayingAbility}`,
      "",
    );
  }

  if (options.length > 0) {
    lines.push(`INDEX STRATEGIES — ${options.length} on file, each backtested against actual index returns`, "");
    for (const option of options) {
      const bt = backtestOption(option);
      const params = [
        // An uncapped strategy stores null rather than 0 — worth distinguishing,
        // since "uncapped" and "capped at zero" are opposite products.
        option.cap && option.cap > 0 ? `cap ${option.cap}%` : "uncapped",
        `floor ${option.floor}%`,
        `par ${option.participation}%`,
        option.spread > 0 ? `spread ${option.spread}%` : null,
        option.strategyCharge > 0 ? `charge ${option.strategyCharge}%` : null,
        option.bonus > 0 ? `bonus ${option.bonus}%` : null,
      ].filter(Boolean).join(" · ");

      lines.push(
        `  ${option.name} (${option.index})`,
        `    ${params}`,
        `    Backtest ${bt.years[0]}–${bt.years[bt.years.length - 1]}: average credited ${bt.average.toFixed(2)}% across ${bt.years.length} years, ${bt.zeroYears} of them at or near the floor.`,
        `    ${option.description}`,
        "",
      );
    }
  }

  lines.push(
    "PROVENANCE — STATE THIS WITH THE NUMBERS",
    IUL_DATA_IS_SAMPLE
      ? "These are SAMPLE figures for a placeholder product, not a real carrier's contract terms. Say so before quoting any of them."
      : "These are the platform's stored figures, not a live carrier feed. Carriers change caps and participation rates.",
    !INDEX_RETURNS_ARE_VERIFIED
      ? "The backtested averages run on an index history that has not been reconciled against the published record, so they are illustrative arithmetic and not what any strategy would have credited."
      : "Backtested averages are what this strategy WOULD have credited against historical index returns — not a projection.",
    "AG 49-B limits what may be illustrated. Anything a client will act on gets",
    "confirmed against the carrier's current illustration.",
  );

  return { found: true, text: lines.join("\n") };
}

/** Matches a CARRIER_LOOKUP directive from the advisor. */
const LOOKUP_RE = /CARRIER_LOOKUP:\s*(\{[\s\S]*?\})/;

export function parseCarrierLookup(reply: string): string | null {
  const match = reply.match(LOOKUP_RE);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1]);
    const carrier = String(parsed?.carrier ?? "").trim();
    return carrier || null;
  } catch {
    return null;
  }
}

/** Strip an unanswered directive so it never reaches the client as prose. */
export function stripCarrierLookup(reply: string): string {
  return reply.replace(LOOKUP_RE, "").trim();
}

/** Counts for the UI, so the advisor page can show what he is grounded on. */
export function carrierDataStats() {
  const indices = Object.keys(RAW_INDEX_RETURNS);
  const years = Object.keys(RAW_INDEX_RETURNS[indices[0]] ?? {}).map(Number);
  return {
    // Surfaced in the UI so the page cannot show a confident "grounded on 10
    // carriers" badge over data that is not real.
    isSample: IUL_DATA_IS_SAMPLE,
    indexReturnsVerified: INDEX_RETURNS_ARE_VERIFIED,
    carriers: IUL_CARRIERS.length,
    indexStrategies: ALL_INDEX_OPTIONS.length,
    indices: indices.length,
    yearsOfReturns: years.length,
    firstYear: Math.min(...years),
    lastYear: Math.max(...years),
    ratedCarriers: CARRIER_RATINGS.length,
    annuityProducts: ALL_ANNUITY_PRODUCTS.length,
  };
}

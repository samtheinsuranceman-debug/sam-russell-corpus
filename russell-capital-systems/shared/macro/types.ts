/**
 * Global Macro Intelligence — shared types.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The one invariant every figure in this layer honours: **a number without a
 * source and a date is not a number.** Every observation carries `{ sourceId,
 * asOf }`, every estimate carries a `confidence`, and anything that could not
 * be established renders as `null` with a reason rather than a guess.
 *
 * This is the same rule the carrier rate sheets and the statutory layer use,
 * applied to sovereign debt, Treasury holdings, oil settlement and war risk.
 */

/** ISO date, YYYY-MM-DD. Strings so they survive JSON and the database intact. */
export type IsoDate = string;

/** Who produced a figure and how much weight it earns before corroboration. */
export type SourceTier =
  /** The entity that owns the fact: a treasury, central bank, statistics bureau. */
  | "primary-official"
  /** IMF, BIS, World Bank, OECD, IEA — compiled from officials, audited. */
  | "multilateral"
  /** Reuters, Bloomberg, FT, WSJ, Nikkei — reported, attributed, corrected. */
  | "wire-service"
  /** Think tanks and bank research: Rhodium, CSIS, Carnegie, JPMorgan. */
  | "research"
  /** State media: Xinhua, People's Daily, Global Times. Declared positions, not facts. */
  | "state-media"
  /** Trade press, aggregators, commentary. Lead, never confirm. */
  | "secondary";

/** How a source is reached. Drives the connector and the freshness expectation. */
export type AccessMode =
  /** Machine-readable, no key needed (CSV, JSON, RSS). */
  | "open-api"
  /** Machine-readable, free key required. */
  | "keyed-api"
  /** Paid API. */
  | "paid-api"
  /** HTML page that must be parsed. Fragile; connector records the parse date. */
  | "page"
  /** Read by a person or by Thomas via a search tool; entered by hand. */
  | "manual";

export type Cadence = "realtime" | "daily" | "weekly" | "monthly" | "quarterly" | "semiannual" | "annual" | "irregular";

export type Jurisdiction =
  | "JP" | "CN" | "US" | "TW" | "HK" | "SA" | "AE" | "RU" | "IN" | "BR" | "EU" | "GB" | "INTL"
  | "KR" | "DE" | "FR" | "IT" | "TR" | "MX" | "ZA" | "ID" | "CL" | "EG" | "PK" | "AR" | "NG" | "NO" | "SG" | "CH" | "CA" | "AU" | "UA" | "IR" | "QA" | "KW";

/**
 * The first eight domains are the original models. The twenty-five that
 * follow are the expansion recorded in `docs/synthesis/12_MACRO_DOMAIN_EXPANSION.md`;
 * each has its own block in `sourcesExpansion.ts` and its own statement
 * categories in `statementFollowThrough.ts`.
 */
export type Domain =
  | "treasury-holdings"
  | "japan-policy"
  | "china-policy"
  | "oil-settlement"
  | "sovereign-debt"
  | "taiwan-risk"
  | "reserves-fx"
  | "rates-markets"
  // ── expansion, in build order ──
  | "fed"                // 1  Federal Reserve communications and balance sheet
  | "bis"                // 4  Bank for International Settlements
  | "imf"                // 5  IMF beyond the WEO
  | "summits"            // 10 G7 / G20 / BRICS / NATO communiqués with compliance
  | "us-fiscal"          // 12 U.S. fiscal, legislative, presidential record
  | "opec"               // 15 OPEC+ decisions and follow-through
  | "sanctions"          // 16 sanctions regimes and evasion
  | "trade-shipping"     // 19 global trade and shipping
  | "fin-stability"      // 23 leverage and shadow banking
  | "political-risk"     // 24 elections, conflict, base rates
  | "ecb"                // 2  ECB and euro-area institutions
  | "oecd"               // 7  OECD
  | "un"                 // 9  United Nations system
  | "china-party"        // 13 party-state economic signalling, deeper
  | "food"               // 20 food and agricultural security
  | "boe"                // 3  Bank of England and UK fiscal
  | "mdb"                // 6  World Bank and development banks
  | "swf"                // 11 sovereign wealth funds
  | "nea-allies"         // 14 Korea and Taiwan economics
  | "india"              // 17 India
  | "em-central-banks"   // 18 emerging-market central banks
  | "minerals"           // 21 energy transition and critical minerals
  | "demographics"       // 22 demographics, pensions, migration
  | "catastrophe"        // 25 catastrophe, climate, insurance
  | "wef"                // 8  World Economic Forum and elite consensus
  // ── household layer (owner's ask, 22 Sep 2026): what families actually pay and do ──
  | "cost-of-living"     // houses, cars, tuition, food, fuel, rent, health: 40-year price records
  | "household";         // behaviour and balance sheet: saving, credit, delinquency, where people eat and shop, net worth by age and profession

export type MacroSource = {
  /** Stable slug; the database key. Never renumber. */
  id: string;
  name: string;
  /** Owning entity as a client would recognise it. */
  entity: string;
  jurisdiction: Jurisdiction;
  tier: SourceTier;
  access: AccessMode;
  cadence: Cadence;
  domains: Domain[];
  /** Human landing page. */
  url: string;
  /** Machine endpoint, when one exists. `{KEY}` marks where a key goes. */
  apiUrl?: string;
  /** Name of the environment variable that holds the key, if any. */
  keyEnv?: string;
  /** What it gives us, in one line. */
  provides: string;
  /** Known limits: revisions, opacity, lag. */
  caveat?: string;
  /** Data language, when not English. Connector may need a translation step. */
  language?: "en" | "ja" | "zh";
};

/** A value with its provenance. `null` value must carry a reason. */
export type Sourced<T> =
  | { value: T; asOf: IsoDate; sourceId: string; note?: string }
  | { value: null; asOf: IsoDate | null; sourceId: string | null; reason: string };

export function sourced<T>(value: T, asOf: IsoDate, sourceId: string, note?: string): Sourced<T> {
  return note === undefined ? { value, asOf, sourceId } : { value, asOf, sourceId, note };
}

export function unknown<T = never>(reason: string, sourceId: string | null = null): Sourced<T> {
  return { value: null, asOf: null, sourceId, reason };
}

export function isKnown<T>(s: Sourced<T>): s is { value: T; asOf: IsoDate; sourceId: string; note?: string } {
  return s.value !== null;
}

/** A single dated reading of an indicator. */
export type Observation = {
  indicatorId: string;
  asOf: IsoDate;
  value: number;
  sourceId: string;
  /** Free text: "TIC Table 5, end-July", "MOF reserve release". */
  note?: string;
};

export type Direction = "risk-up" | "risk-down";

/**
 * An indicator is a named, sourced, directional signal that feeds one or more
 * models. `weight` is its prior importance (0–1). `direction` says which way a
 * rise in the value moves the risk being modelled.
 */
export type Indicator = {
  id: string;
  name: string;
  domain: Domain;
  /** What a rise in this value does to the modelled risk. */
  direction: Direction;
  /** Prior weight 0–1; the confidence engine rescales within a model. */
  weight: number;
  /** Which sources can supply it, best first. */
  sourceIds: string[];
  unit: string;
  cadence: Cadence;
  /**
   * "visible" — anyone watching the news would name it.
   * "structural" — analysts track it; the public does not.
   * "latent" — a second-order or lagged relationship that is not part of the
   *   public conversation at all. These are what the emergent-pattern detector
   *   promotes when the data supports them.
   */
  awareness: "visible" | "structural" | "latent";
  /** Why it matters, one line. */
  rationale: string;
  /** Present on factor rows (W8): the series, the transform, the target and the rules-table ids. */
  factor?: FactorSpec;
};

/**
 * A factor is an indicator that also names the series it is read from, how a
 * raw reading becomes a signal, and what it claims to lead over what horizon.
 * It is data, not an engine (packet W8): the arithmetic is one function in
 * `emergentPatterns.ts`, the numbers are rows in `assumptions.ts`, and the
 * verdict (signal or context) is measured by the backtest, never typed.
 */
export type FactorSpec = {
  /** Connector series key: "fred:T10Y3M", "fiscaldata:avg_interest_rates", "nyfed:acm", "nyfed:soma", "worldbank:NY.GDP.MKTP.KD.ZG". */
  series: string;
  /** How the stored series becomes the factor value. */
  transform: "level" | "yoy" | "sahm" | "ratio-pct";
  /** Second series key for "ratio-pct" (numerator is `series`). */
  denominator?: string;
  /** Outcome indicator id the factor claims to lead. */
  target: string;
  /** Months ahead at which the claim is scored. */
  horizonMonths: number;
  /** Whether the target is a 0/1 series (NBER recession) or a level. */
  targetKind: "level" | "binary";
  /** Rules-table prefix: `${prefix}.neutral`, `.span`, `.min`, `.max` live in assumptions.ts. */
  assumptionPrefix: string;
  neutral: number;
  span: number;
  /** Plausibility bounds on the raw stored series; readings outside are dropped and counted. */
  min: number;
  max: number;
  /** Earliest observation the publisher offers, as the publisher states it. */
  publishedFrom: IsoDate;
};

/** What the backtest decided about a factor, and on how much data. */
export type FactorVerdict = {
  indicatorId: string;
  /** signal: measurable lead at the stated horizon; context: none measured (weight 0); pending: no history yet. */
  verdict: "signal" | "context" | "pending";
  /** Pearson r between the factor signal at t and the target change over t..t+h. */
  leadR: number | null;
  /** Share of non-neutral signals whose sign matched the target's move. */
  hitRate: number | null;
  /** Contemporaneous r, for comparison. */
  r0: number | null;
  n: number;
  horizonMonths: number;
  reason: string;
  asOf: IsoDate | null;
};

/** Coverage and health of one stored series. The brief prints earliestAsOf and coverageYears. */
export type SeriesMeta = {
  indicatorId: string;
  sourceId: string;
  earliestAsOf: IsoDate | null;
  latestAsOf: IsoDate | null;
  coverageYears: number;
  points: number;
  /** live: answered this run; cached: last-good rows in use; unavailable: nothing usable, `reason` says why. */
  status: "live" | "cached" | "unavailable";
  reason?: string;
};

/**
 * Evidence is an observation joined to its indicator, scored for the
 * confidence engine: how fresh, how authoritative, how corroborated.
 */
export type Evidence = {
  indicatorId: string;
  /** Normalised signal in [-1, 1]: positive pushes the modelled risk up. */
  signal: number;
  /** Prior weight from the indicator. */
  weight: number;
  tier: SourceTier;
  asOf: IsoDate;
  /** Independent sources agreeing with this reading. 1 = only itself. */
  corroboration: number;
  note?: string;
};

export type ConfidenceBand = {
  /** Point estimate, 0–1. */
  probability: number;
  /** 80% interval. */
  low: number;
  high: number;
  /**
   * How much to trust the point estimate, 0–100. Driven by evidence
   * coverage, freshness and corroboration — not by the probability itself.
   * A 5% probability can be held with 90 confidence; a 50% with 20.
   */
  confidence: number;
  /** Plain-language grade of the confidence score. */
  grade: "A" | "B" | "C" | "D" | "F";
};

export type ScoredDriver = {
  indicatorId: string;
  name: string;
  /** Signed contribution to the log-odds. */
  contribution: number;
  signal: number;
  effectiveWeight: number;
  asOf: IsoDate;
  stale: boolean;
  awareness: Indicator["awareness"];
};

export type ConfidenceAssessment = {
  modelId: string;
  asOf: IsoDate;
  band: ConfidenceBand;
  drivers: ScoredDriver[];
  /** Indicators the model wanted but had no evidence for. */
  missing: string[];
  /** Share of prior weight covered by fresh evidence, 0–1. */
  coverage: number;
  /** Sources actually used, for the citation footer. */
  sourceIds: string[];
};

/** Toggle state a calculator passes in to get macro-adjusted assumptions. */
export type MacroToggles = {
  /** Treasury liquidation by Japan or China, sell fraction of current holdings. */
  treasuryLiquidation?: { holder: "JP" | "CN" | "BOTH"; fraction: number; months: number } | null;
  /** Oil trade moving out of the dollar: target non-USD share by horizon end. */
  petrodollarErosion?: { targetNonUsdShare: number; years: number } | null;
  /** Sovereign stress: which economies default or restructure in the horizon. */
  sovereignStress?: { countries: string[] } | null;
  /** Taiwan: the scenario to price in. */
  taiwan?: { scenario: "gray-zone" | "quarantine" | "blockade" | "war"; probability?: number } | null;
};

/**
 * What a toggle set does to the assumptions a calculator already uses. All
 * values are additive deltas unless named as a multiplier. Zero means "no
 * change from the calculator's own assumption".
 */
export type MacroAdjustments = {
  /** Change in the 10-year Treasury yield, percentage points. */
  tenYearYieldDelta: number;
  /** Change in the 30-year fixed mortgage rate, percentage points. */
  mortgageRateDelta: number;
  /** Change in annual CPI inflation, percentage points. */
  inflationDelta: number;
  /** Multiplier on expected equity return (1.0 = unchanged). */
  equityReturnMultiplier: number;
  /** Multiplier on equity volatility. */
  equityVolMultiplier: number;
  /** Change in the dollar index, percent. */
  dollarIndexPct: number;
  /** Change in gold, percent. */
  goldPct: number;
  /** One-year recession probability, 0–1, after the shock. */
  recessionProbability: number;
  /** What produced these numbers, for the evidence ledger. */
  rationale: string[];
  sourceIds: string[];
  confidence: number;
};

/**
 * Global Debt Tracker — country by country, with a default-risk score and a
 * contagion model.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The debt-to-GDP ratio alone is a poor predictor of default: Japan at 204 %
 * has never missed a payment; Argentina at 80 % has missed nine. What
 * predicts distress is the *combination* of ratio, interest burden, currency
 * of the debt, reserve cover and market pricing. The score below is the
 * IMF DSA logic reduced to five factors, each documented, so a reader can
 * argue with one factor at a time.
 *
 * Contagion: when a country restructures, its creditors, trading partners and
 * peers with the same rating bucket are marked, using a simple exposure graph.
 * The global effect is expressed as a change in the risk premium on emerging
 * market debt and an equity-volatility multiplier that calculators can take
 * through `MacroAdjustments`.
 */
import type { IsoDate } from "./types";
import { DEBT_TABLE, DEBT_TABLE_ASOF, DEBT_TABLE_SOURCE, type DebtRow } from "./snapshot";
import { A } from "./assumptions";

export type RiskFactor = { name: string; value: number | null; score: number; weight: number; note: string };

export type SovereignRisk = {
  iso3: string;
  name: string;
  region: DebtRow["region"];
  debt2026: number;
  debt2031: number | null;
  /** 0–100; higher is worse. */
  score: number;
  /** Two-year restructuring / default probability, 0–1 (calibrated to rating bucket base rates). */
  twoYearDefaultProbability: number;
  bucket: "safe" | "watch" | "stressed" | "distressed" | "in-default";
  factors: RiskFactor[];
  estimate: boolean;
  asOf: IsoDate;
  sourceId: string;
  note?: string;
};

/** Two-year cumulative default rates by rating bucket (rules table `debt.base2y.*`: S&P 2024 sovereign transition study). */
const BUCKET_BASE_RATE: Record<DebtRow["rating"], number> = {
  AAA: A("debt.base2y.AAA"),
  AA: A("debt.base2y.AA"),
  A: A("debt.base2y.A"),
  BBB: A("debt.base2y.BBB"),
  BB: A("debt.base2y.BB"),
  B: A("debt.base2y.B"),
  CCC: A("debt.base2y.CCC"),
  D: 1.0,
};

function scoreDebt(ratio: number, fxShare: number | null): number {
  // Local-currency debt tolerates a far higher ratio (Japan). Scale the ratio by currency mix:
  // 100 % of GDP for fully foreign-currency debt up to `debt.threshold.localCurrencyTolerance` for fully local.
  const fx = (fxShare ?? 20) / 100;
  const tolerant = 100 + (A("debt.threshold.localCurrencyTolerance") - 100) * (1 - fx);
  return clamp((ratio / tolerant) * 60, 0, 100);
}
function scoreInterest(itr: number | null): number {
  if (itr === null) return 30;
  // Full score at the Fiscal Monitor's distress line [debt.threshold.interestToRevenueDistress].
  return clamp((itr / A("debt.threshold.interestToRevenueDistress")) * 100, 0, 100);
}
function scoreFx(fxShare: number | null): number {
  return fxShare === null ? 30 : clamp(fxShare, 0, 100);
}
function scoreReserves(cover: number | null, fxShare: number | null): number {
  // Only matters when there is foreign-currency debt to cover.
  if ((fxShare ?? 0) < 5) return 0;
  if (cover === null) return 40;
  // Greenspan–Guidotti: cover ≥ 1 is adequate [debt.threshold.reserveCoverAdequate]; zero score at the scale [debt.threshold.reserveCoverScale].
  const scale = A("debt.threshold.reserveCoverScale");
  return clamp(((scale - cover) / scale) * 100, 0, 100);
}
function scoreMarket(cds: number | null, rating: DebtRow["rating"]): number {
  if (rating === "D") return 100;
  if (cds === null) return rating === "CCC" ? 90 : rating === "B" ? 65 : rating === "BB" ? 45 : 20;
  // Log-scaled to full score at [debt.threshold.cdsFullScoreBp]: 100 bp ≈ 20; 500 bp ≈ 80.
  return clamp((Math.log10(1 + cds) / Math.log10(1 + A("debt.threshold.cdsFullScoreBp"))) * 100, 0, 100);
}

export function assessSovereign(row: DebtRow): SovereignRisk {
  const factors: RiskFactor[] = [
    { name: "Debt / GDP, currency-adjusted", value: row.debt2026, score: scoreDebt(row.debt2026, row.fxDebtShare), weight: A("debt.weight.ratio"), note: "Ratio scaled by the share of debt in foreign currency; local-currency debt tolerates ~2× the ratio [debt.threshold.localCurrencyTolerance]." },
    { name: "Interest / revenue", value: row.interestToRevenue, score: scoreInterest(row.interestToRevenue), weight: A("debt.weight.interest"), note: "Fiscal Monitor stress line 20 %; distress 40 % [debt.threshold.interestToRevenueDistress]." },
    { name: "Foreign-currency share of debt", value: row.fxDebtShare, score: scoreFx(row.fxDebtShare), weight: A("debt.weight.fx"), note: "Original-sin exposure." },
    { name: "Reserve cover of short-term external debt", value: row.reserveCover, score: scoreReserves(row.reserveCover, row.fxDebtShare), weight: A("debt.weight.reserves"), note: "Greenspan–Guidotti ≥ 1.0 adequate [debt.threshold.reserveCover*]." },
    { name: "Market pricing (5y CDS / rating)", value: row.cds5y, score: scoreMarket(row.cds5y, row.rating), weight: A("debt.weight.market"), note: "Log-scaled; 500 bp ≈ 80 [debt.threshold.cdsFullScoreBp]." },
  ];
  const score = round1(factors.reduce((s, f) => s + f.score * f.weight, 0));
  const base = BUCKET_BASE_RATE[row.rating];
  // Blend the rating base rate with the fundamental score: a country scoring far above its bucket is under-rated.
  const fundamentalP = clamp(Math.pow(score / 100, 2.2), 0, 1);
  const p = row.rating === "D" ? 1 : clamp(0.5 * base + 0.5 * fundamentalP, 0, 1);
  const bucket: SovereignRisk["bucket"] =
    row.rating === "D" ? "in-default" : score >= 70 ? "distressed" : score >= 50 ? "stressed" : score >= 30 ? "watch" : "safe";
  return {
    iso3: row.iso3,
    name: row.name,
    region: row.region,
    debt2026: row.debt2026,
    debt2031: row.debt2031,
    score,
    twoYearDefaultProbability: round4(p),
    bucket,
    factors,
    estimate: Boolean(row.estimate),
    asOf: DEBT_TABLE_ASOF,
    sourceId: DEBT_TABLE_SOURCE,
    note: row.note,
  };
}

export function assessAll(rows: DebtRow[] = DEBT_TABLE): SovereignRisk[] {
  return rows.filter(r => r.iso3 !== "WLD").map(assessSovereign).sort((a, b) => b.score - a.score);
}

/** The watch-list: everything at "stressed" or worse, plus the large economies whatever their score. */
export function watchList(rows: DebtRow[] = DEBT_TABLE): SovereignRisk[] {
  const all = assessAll(rows);
  const systemic = new Set(["USA", "JPN", "CHN", "ITA", "FRA", "GBR", "DEU"]);
  return all.filter(r => r.bucket !== "safe" && r.bucket !== "watch" || systemic.has(r.iso3));
}

export type ContagionInput = {
  /** Countries assumed to restructure or default in the horizon. */
  countries: string[];
  rows?: DebtRow[];
};

export type ContagionResult = {
  triggers: string[];
  /** Share of world GDP (PPP, IMF 2025 weights, approximate) in the trigger set. */
  triggerGdpShare: number;
  /** Countries marked as secondary risk, with the reason. */
  secondary: Array<{ iso3: string; name: string; reason: string; addedProbability: number }>;
  /** System effects for calculators. */
  effects: {
    emSpreadDeltaBp: number;
    equityVolMultiplier: number;
    equityReturnMultiplier: number;
    usTreasuryFlightBp: number;
    recessionProbabilityDelta: number;
    dollarIndexPct: number;
  };
  rationale: string[];
  sourceIds: string[];
};

/** Approximate PPP GDP shares, %, IMF WEO April 2026 Table A. */
const GDP_SHARE: Record<string, number> = {
  USA: 14.6, CHN: 18.5, JPN: 3.3, DEU: 3.0, IND: 8.0, GBR: 2.2, FRA: 2.2, ITA: 1.8, BRA: 2.3, CAN: 1.3, RUS: 3.4, KOR: 1.6, MEX: 1.8, ESP: 1.4, IDN: 2.4, TUR: 2.0, SAU: 1.4, ARG: 0.7, EGY: 1.2, PAK: 0.9, NGA: 0.8, ZAF: 0.5, GRC: 0.2, PRT: 0.3, UKR: 0.3, VEN: 0.1, LBN: 0.05, LKA: 0.2, GHA: 0.2, KEN: 0.2, ETH: 0.3, ZMB: 0.05, BOL: 0.1, MDV: 0.01, TUN: 0.1, COL: 0.6, CHL: 0.4, PHL: 0.9, VNM: 0.9, MYS: 0.8, THA: 0.9, HUN: 0.3, ROU: 0.4, IRL: 0.4, AUT: 0.4, FIN: 0.2, NZL: 0.2, CHE: 0.5, NOR: 0.3, QAT: 0.2, KWT: 0.2, ARE: 0.6, ISR: 0.4, IRN: 1.0, TWN: 1.0, SGP: 0.5, NLD: 0.8, BEL: 0.5, POL: 1.0, AUS: 1.0,
};

export function contagion(input: ContagionInput): ContagionResult {
  const rows = input.rows ?? DEBT_TABLE;
  const byIso = new Map(rows.map(r => [r.iso3, r]));
  const triggers = input.countries.filter(c => byIso.has(c));
  const gdp = triggers.reduce((s, c) => s + (GDP_SHARE[c] ?? 0), 0);
  const secondary: ContagionResult["secondary"] = [];
  const triggerRegions = new Set(triggers.map(c => byIso.get(c)!.region));
  const triggerRatings = new Set(triggers.map(c => byIso.get(c)!.rating));
  for (const r of rows) {
    if (r.iso3 === "WLD" || triggers.includes(r.iso3)) continue;
    const reasons: string[] = [];
    let added = 0;
    if (triggerRegions.has(r.region) && (r.rating === "BB" || r.rating === "B" || r.rating === "CCC")) {
      reasons.push("same region, sub-investment grade");
      added += A("debt.contagion.secondary.sameRegionSubIG");
    }
    if (triggerRatings.has(r.rating) && r.rating !== "AAA" && r.rating !== "AA") {
      reasons.push("same rating bucket — index selling");
      added += A("debt.contagion.secondary.sameBucket");
    }
    if ((r.fxDebtShare ?? 0) > 40 && gdp > 1) {
      reasons.push("high foreign-currency debt into a dollar squeeze");
      added += A("debt.contagion.secondary.fxDebt");
    }
    if (reasons.length) secondary.push({ iso3: r.iso3, name: r.name, reason: reasons.join("; "), addedProbability: round4(added) });
  }
  secondary.sort((a, b) => b.addedProbability - a.addedProbability);

  // System effects scale with the GDP share of the trigger set. A frontier
  // default (Zambia, 0.05 %) is noise globally; Italy (1.8 %) is a euro event;
  // the U.S. or China is a regime change and is capped rather than modelled here.
  const systemic = Math.min(gdp, 20);
  const emSpread = clamp(A("debt.contagion.emSpreadFloorBp") + systemic * A("debt.contagion.emSpreadBpPerGdpPt"), A("debt.contagion.emSpreadFloorBp"), 600);
  const vol = clamp(1 + systemic * A("debt.contagion.volPerGdpPt"), 1, 2.2);
  const ret = clamp(1 - systemic * A("debt.contagion.returnPerGdpPt"), 0.4, 1);
  // Flight to Treasuries lowers U.S. yields unless the U.S. itself is the trigger.
  const flight = triggers.includes("USA") ? A("debt.contagion.usTriggerFlightBp") : clamp(systemic * A("debt.contagion.flightBpPerGdpPt"), -80, 0);
  const recession = clamp(systemic * A("debt.contagion.recessionPtsPerGdpPt"), 0, 40);
  const dollar = triggers.includes("USA") ? -10 : clamp(systemic * A("debt.contagion.dollarPctPerGdpPt"), 0, 8);

  return {
    triggers,
    triggerGdpShare: round1(gdp),
    secondary: secondary.slice(0, 15),
    effects: {
      emSpreadDeltaBp: round1(emSpread),
      equityVolMultiplier: round2(vol),
      equityReturnMultiplier: round2(ret),
      usTreasuryFlightBp: round1(flight),
      recessionProbabilityDelta: round1(recession),
      dollarIndexPct: round1(dollar),
    },
    rationale: [
      `Trigger set is ${gdp.toFixed(1)} % of world GDP (PPP, IMF 2025 weights).`,
      `EM spread +${A("debt.contagion.emSpreadFloorBp")} bp floor plus ${A("debt.contagion.emSpreadBpPerGdpPt")} bp per point of world GDP in default [debt.contagion.emSpread*: EMBI 1998, 2001, 2022].`,
      `Equity volatility ×(1 + ${A("debt.contagion.volPerGdpPt")} per GDP point); returns ×(1 − ${A("debt.contagion.returnPerGdpPt")} per point) [debt.contagion.vol*, return*].`,
      triggers.includes("USA") ? `U.S. in the trigger set: flight-to-safety inverts; Treasuries sell off (+${A("debt.contagion.usTriggerFlightBp")} bp) and the dollar falls [debt.contagion.usTriggerFlightBp].` : `Flight to Treasuries: ${A("debt.contagion.flightBpPerGdpPt")} bp per GDP point [debt.contagion.flightBpPerGdpPt].`,
      `Secondary marks: same-region sub-IG +${Math.round(A("debt.contagion.secondary.sameRegionSubIG") * 100)} pts, same-bucket index selling +${Math.round(A("debt.contagion.secondary.sameBucket") * 100)} pts, FX-debt > 40 % +${Math.round(A("debt.contagion.secondary.fxDebt") * 100)} pts [debt.contagion.secondary.*].`,
    ],
    sourceIds: [DEBT_TABLE_SOURCE, "imf-fiscal-monitor", "cds-markit", "ratings-fitch-moodys-sp"],
  };
}

/** Aggregate view for the dashboard header. */
export function debtOverview(rows: DebtRow[] = DEBT_TABLE) {
  const world = rows.find(r => r.iso3 === "WLD");
  const risks = assessAll(rows);
  const counts = { safe: 0, watch: 0, stressed: 0, distressed: 0, "in-default": 0 } as Record<SovereignRisk["bucket"], number>;
  for (const r of risks) counts[r.bucket]++;
  const gdpInDistress = risks.filter(r => r.bucket === "distressed" || r.bucket === "in-default").reduce((s, r) => s + (GDP_SHARE[r.iso3] ?? 0), 0);
  return {
    asOf: DEBT_TABLE_ASOF,
    sourceId: DEBT_TABLE_SOURCE,
    world: world ? { debt2025: world.debt2025, debt2026: world.debt2026, debt2031: world.debt2031 } : null,
    countries: risks.length,
    estimatedRows: rows.filter(r => r.estimate).length,
    counts,
    gdpShareInDistress: round1(gdpInDistress),
    top10: risks.slice(0, 10).map(r => ({ iso3: r.iso3, name: r.name, score: r.score, p2y: r.twoYearDefaultProbability, bucket: r.bucket })),
  };
}

function clamp(x: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, x));
}
function round1(x: number) {
  return Math.round(x * 10) / 10;
}
function round2(x: number) {
  return Math.round(x * 100) / 100;
}
function round4(x: number) {
  return Math.round(x * 10_000) / 10_000;
}

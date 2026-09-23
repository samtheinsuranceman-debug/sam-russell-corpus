/**
 * Projection horizon — how far the platform can project with confidence, and
 * what each projected year does to a calculator's assumptions.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The owner's ask (23 Sep 2026): "build in a predictive engine and a toggle
 * on every single calculator that's optional … based on how long you think
 * you can project with confidence … reports with how confident your
 * assessment is and always cite your references."
 *
 * The honest answer to "how long" is short and it is measured, not asserted:
 *
 *   • The twenty-five macro factors and the twenty-five household factors are
 *     backtested at horizons of 3–12 months. A factor graded "signal" has a
 *     measured lead at its horizon; that is the only skill the platform can
 *     prove, and it reaches one year at most.
 *   • The scenario engines (Treasury liquidation, oil settlement, sovereign
 *     stress, Taiwan) are structural: they say what a stated shock does over
 *     12–24 months from documented episodes, with their own confidence
 *     (40–70).
 *   • Beyond that the platform has no measured skill. Confidence decays with a
 *     stated half-life, and a year whose confidence falls below the "apply"
 *     threshold uses the calculator's own long-run assumptions untouched.
 *
 * So the path is: year 1 confidence = the lower of the measured-state
 * confidence and the scenario confidence; each later year decays by the
 * half-life; the scenario's deltas are applied in proportion to that
 * confidence and fade to nothing where it is not earned. Every constant is a
 * rules-table row (`proj.*`) with a source and a basis; every result carries
 * its rationale, method and source ids so the report can cite them.
 *
 * Pure: no fetch, no database, no `process`. Drops into the corpus trunk with
 * the rest of `shared/macro/` (port steps in `index.ts`).
 */
import type { IsoDate, MacroAdjustments, ConfidenceBand } from "./types";
import { NEUTRAL_ADJUSTMENTS } from "./adjustments";
import { A } from "./assumptions";
import { gradeFor } from "./confidence";
import { SOURCE_BY_ID } from "./sources";

/** What the server measured before the projection was asked for. */
export type ProjectionEvidence = {
  /** Factors graded signal / context / pending by the backtest (macro + household). */
  signalFactors: number;
  contextFactors: number;
  pendingFactors: number;
  /** Longest backtest horizon among the signal factors, months (0 when none). */
  longestSignalHorizonMonths: number;
  /** The Treasury pool's dry-up regime, when the history has been scanned. */
  dryUpRegime?: "abundant" | "normal" | "tightening" | "draining" | "dried-up" | null;
  /** Measured lead-lag findings at or above the pattern threshold (0 when the scan has not run). */
  measuredLeads?: number;
  /** Stored history coverage in years for the longest pool series (0 when nothing is stored). */
  storedCoverageYears?: number;
};

export const NO_EVIDENCE: ProjectionEvidence = { signalFactors: 0, contextFactors: 0, pendingFactors: 50, longestSignalHorizonMonths: 0, dryUpRegime: null, measuredLeads: 0, storedCoverageYears: 0 };

export type ProjectionYear = {
  /** 1 = the first projected year. */
  year: number;
  /** 0–100: how much to trust the platform's view of this year. */
  confidence: number;
  grade: ConfidenceBand["grade"];
  /** 0–1: the share of the scenario's deltas applied in this year. */
  weight: number;
  /** Whether the calculator's own assumptions are overridden at all in this year. */
  applied: boolean;
  adjustments: MacroAdjustments;
  basis: string;
};

export type ProjectionHorizon = {
  asOf: IsoDate;
  years: number;
  /** Years whose confidence is at or above the apply threshold. */
  confidentYears: number;
  /** Year-1 confidence and its two components. */
  year1: { confidence: number; measured: number; scenario: number; grade: ConfidenceBand["grade"] };
  path: ProjectionYear[];
  evidence: ProjectionEvidence;
  rationale: string[];
  method: string[];
  sourceIds: string[];
  assumptionIds: string[];
};

/**
 * Measured-state confidence: what the stored history and the backtests have
 * earned, independent of any scenario. Nothing measured → the floor the rules
 * table states for a platform running on documented episodes alone.
 */
export function measuredConfidence(ev: ProjectionEvidence): { value: number; lines: string[] } {
  const lines: string[] = [];
  let c = A("proj.measured.noHistory");
  lines.push(`Base ${c} with no measured history (documented episodes and the scenario engines only) [proj.measured.noHistory].`);
  if (ev.signalFactors > 0) {
    const add = Math.min(A("proj.measured.perSignalFactor") * ev.signalFactors, A("proj.measured.signalCap"));
    c += add;
    lines.push(`+${add} for ${ev.signalFactors} factor${ev.signalFactors === 1 ? "" : "s"} graded signal by the backtest (capped at ${A("proj.measured.signalCap")}) [proj.measured.perSignalFactor].`);
  }
  if ((ev.measuredLeads ?? 0) > 0) {
    const add = Math.min(A("proj.measured.perMeasuredLead") * (ev.measuredLeads ?? 0), A("proj.measured.leadCap"));
    c += add;
    lines.push(`+${add} for ${ev.measuredLeads} measured lead-lag findings above threshold (capped at ${A("proj.measured.leadCap")}) [proj.measured.perMeasuredLead].`);
  }
  if ((ev.storedCoverageYears ?? 0) >= A("proj.measured.longHistoryYears")) {
    c += A("proj.measured.longHistoryBonus");
    lines.push(`+${A("proj.measured.longHistoryBonus")} for stored history of ${ev.storedCoverageYears} years or more [proj.measured.longHistoryBonus].`);
  }
  if (ev.dryUpRegime === "draining" || ev.dryUpRegime === "dried-up") {
    c -= A("proj.measured.stressPenalty");
    lines.push(`−${A("proj.measured.stressPenalty")} because the Treasury pool reads "${ev.dryUpRegime}": regime changes are when measured leads fail [proj.measured.stressPenalty].`);
  }
  const value = Math.max(0, Math.min(A("proj.measured.cap"), Math.round(c)));
  lines.push(`Measured-state confidence ${value} (capped at ${A("proj.measured.cap")}: the platform never claims more than its backtests reach).`);
  return { value, lines };
}

/** The confidence that a scenario's deltas still describe year `t` (1-based). */
export function decayedConfidence(year1: number, year: number, ev: ProjectionEvidence): number {
  // The measured horizon (in years, at least the scenario engines' first year) holds year-1 confidence; decay starts after it.
  const measuredYears = Math.max(1, ev.longestSignalHorizonMonths / 12);
  const beyond = Math.max(0, year - measuredYears);
  const halfLife = A("proj.halfLifeYears");
  const floor = A("proj.floorConfidence");
  const c = floor + (year1 - floor) * Math.pow(0.5, beyond / halfLife);
  return Math.round(Math.max(floor, Math.min(year1, c)));
}

/** Scale a scenario's deltas by a weight in [0, 1]; weight 0 is the calculator's own assumptions. */
export function scaleAdjustments(adj: MacroAdjustments, w: number): MacroAdjustments {
  const k = Math.max(0, Math.min(1, w));
  const r4 = (x: number) => Math.round(x * 10_000) / 10_000;
  return {
    tenYearYieldDelta: r4(adj.tenYearYieldDelta * k),
    mortgageRateDelta: r4(adj.mortgageRateDelta * k),
    inflationDelta: r4(adj.inflationDelta * k),
    equityReturnMultiplier: r4(1 + (adj.equityReturnMultiplier - 1) * k),
    equityVolMultiplier: r4(1 + (adj.equityVolMultiplier - 1) * k),
    dollarIndexPct: r4(adj.dollarIndexPct * k),
    goldPct: r4(adj.goldPct * k),
    recessionProbability: r4(NEUTRAL_ADJUSTMENTS.recessionProbability + (adj.recessionProbability - NEUTRAL_ADJUSTMENTS.recessionProbability) * k),
    rationale: adj.rationale,
    sourceIds: adj.sourceIds,
    confidence: adj.confidence,
  };
}

/** Whether a scenario is toggled at all (neutral adjustments carry no deltas). */
export function isNeutral(adj: MacroAdjustments): boolean {
  return adj.tenYearYieldDelta === 0 && adj.mortgageRateDelta === 0 && adj.inflationDelta === 0 && adj.equityReturnMultiplier === 1 && adj.equityVolMultiplier === 1 && adj.dollarIndexPct === 0 && adj.goldPct === 0 && adj.recessionProbability === NEUTRAL_ADJUSTMENTS.recessionProbability;
}

/**
 * The projection path over `years`. With a neutral scenario every year is
 * "not applied" and the path only reports how far the measured state reaches;
 * with a scenario, each year applies the deltas in proportion to its
 * confidence above the apply threshold.
 */
export function projectionHorizon(adj: MacroAdjustments, ev: ProjectionEvidence, years: number, asOf: IsoDate): ProjectionHorizon {
  const n = Math.max(1, Math.min(A("proj.maxYears"), Math.round(years)));
  const measured = measuredConfidence(ev);
  const scenario = isNeutral(adj) ? 100 : adj.confidence;
  const year1 = Math.min(measured.value, scenario);
  const apply = A("proj.applyThreshold");
  const floor = A("proj.floorConfidence");
  const neutral = isNeutral(adj);
  const path: ProjectionYear[] = [];
  for (let y = 1; y <= n; y++) {
    const c = decayedConfidence(year1, y, ev);
    const applied = !neutral && c >= apply;
    // Weight: full at year-1 confidence, zero at the apply threshold, linear between — so a D-grade year applies almost nothing.
    const w = applied && year1 > apply ? Math.max(0, Math.min(1, (c - apply) / (year1 - apply))) : applied ? 1 : 0;
    const basis = neutral
      ? `No scenario toggled: the calculator's own assumptions; measured-state confidence ${c}.`
      : applied
        ? `Confidence ${c} ≥ apply threshold ${apply}: ${Math.round(w * 100)} % of the scenario's deltas applied.`
        : `Confidence ${c} < apply threshold ${apply}: the calculator's own long-run assumptions; the scenario is not projected this far.`;
    path.push({ year: y, confidence: c, grade: gradeFor(c), weight: Math.round(w * 1000) / 1000, applied, adjustments: applied ? scaleAdjustments(adj, w) : { ...NEUTRAL_ADJUSTMENTS, rationale: [...NEUTRAL_ADJUSTMENTS.rationale], sourceIds: [] }, basis });
  }
  const confidentYears = path.filter(p => p.confidence >= apply).length;
  const rationale: string[] = [
    ...measured.lines,
    neutral ? "No scenario toggled; scenario confidence is not a constraint." : `Scenario confidence ${scenario} (the mean of the toggled engines' stated confidences).`,
    `Year-1 confidence ${year1} = min(measured ${measured.value}, scenario ${scenario}).`,
    `Confidence holds through the measured horizon (${Math.max(12, ev.longestSignalHorizonMonths)} months), then halves every ${A("proj.halfLifeYears")} years toward a floor of ${floor} [proj.halfLifeYears, proj.floorConfidence].`,
    `Years at or above ${apply} (grade ${gradeFor(apply)}) are projected: ${confidentYears} of ${n}.` + (neutral ? "" : ` Deltas fade linearly from full at year 1 to nothing at the threshold.`),
  ];
  const method = [
    "The platform's only measured skill is the factor backtests at 3–12 months; the scenario engines are structural over 12–24 months; nothing beyond is claimed, only decayed.",
    "A year the platform cannot project with confidence uses the calculator's own assumptions unchanged; the toggle is optional and off by default.",
    "Every constant is a rules-table row (proj.*) with a source and a basis; every projected number carries the engines' source ids.",
  ];
  const assumptionIds = ["proj.measured.noHistory", "proj.measured.perSignalFactor", "proj.measured.signalCap", "proj.measured.perMeasuredLead", "proj.measured.leadCap", "proj.measured.longHistoryYears", "proj.measured.longHistoryBonus", "proj.measured.stressPenalty", "proj.measured.cap", "proj.halfLifeYears", "proj.floorConfidence", "proj.applyThreshold", "proj.maxYears"];
  return { asOf, years: n, confidentYears, year1: { confidence: year1, measured: measured.value, scenario, grade: gradeFor(year1) }, path, evidence: ev, rationale, method, sourceIds: Array.from(new Set(adj.sourceIds)), assumptionIds };
}

/** Apply the projected year's adjustments to a calculator's base assumptions (year is 1-based; beyond the path → the last year). */
export function applyMacroYear<T extends { expectedReturn?: number; volatility?: number; inflationRate?: number; mortgageRate?: number; tenYearYield?: number }>(base: T, horizon: ProjectionHorizon, year: number): T {
  const p = horizon.path[Math.max(0, Math.min(horizon.path.length - 1, Math.round(year) - 1))];
  const adj = p ? p.adjustments : NEUTRAL_ADJUSTMENTS;
  const out = { ...base };
  if (typeof base.expectedReturn === "number") out.expectedReturn = base.expectedReturn * adj.equityReturnMultiplier;
  if (typeof base.volatility === "number") out.volatility = base.volatility * adj.equityVolMultiplier;
  if (typeof base.inflationRate === "number") out.inflationRate = base.inflationRate + adj.inflationDelta / 100;
  if (typeof base.mortgageRate === "number") out.mortgageRate = base.mortgageRate + adj.mortgageRateDelta / 100;
  if (typeof base.tenYearYield === "number") out.tenYearYield = base.tenYearYield + adj.tenYearYieldDelta / 100;
  return out;
}

// sliceProjection and averageAdjustments live in a leaf module so the app shell can
// import them without this file's rules-table imports; re-exported here unchanged.
export { sliceProjection, averageAdjustments } from "./projectionSlice";

/**
 * The projection report: what was projected, how confident each year is,
 * why, and the references. Markdown; every figure and constant is cited.
 */
export function projectionReport(h: ProjectionHorizon, opts: { title?: string; calculator?: string; baseAssumptions?: Record<string, number | string> } = {}): string {
  const out: string[] = [];
  const pp = (x: number) => `${x >= 0 ? "+" : ""}${x.toFixed(2)} pp`;
  const pct = (x: number) => `${x >= 0 ? "+" : ""}${x.toFixed(1)} %`;
  out.push(`# ${opts.title ?? "Projection confidence report"}`);
  out.push("");
  out.push(`_${opts.calculator ? `Calculator: ${opts.calculator}. ` : ""}As of ${h.asOf}. Horizon ${h.years} years; projected with confidence for ${h.confidentYears}. Year-1 confidence ${h.year1.confidence} (grade ${h.year1.grade}) = min(measured state ${h.year1.measured}, scenario ${h.year1.scenario})._`);
  out.push("");
  out.push("## What this report is");
  out.push("");
  out.push("A statement of how far the platform is willing to project a macro scenario into this calculator, and how much it trusts each year. Confidence is earned from measured backtests and the scenario engines' own stated confidence, then decays; it is never asserted from the size of the scenario. A year below the apply threshold leaves the calculator's own assumptions untouched. Every constant below is a rules-table row with a source and a basis; every engine result carries the source ids listed at the end.");
  out.push("");
  if (opts.baseAssumptions && Object.keys(opts.baseAssumptions).length) {
    out.push("## The calculator's own assumptions");
    out.push("");
    out.push("| assumption | value |");
    out.push("|---|---|");
    for (const [k, v] of Object.entries(opts.baseAssumptions)) out.push(`| ${k} | ${v} |`);
    out.push("");
  }
  out.push("## Confidence by year");
  out.push("");
  out.push("| year | confidence | grade | applied | share of deltas | 10-yr | mortgage | inflation | equity return × | equity vol × | dollar | gold | recession (1 yr) | basis |");
  out.push("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
  for (const p of h.path) {
    const a = p.adjustments;
    out.push(`| ${p.year} | ${p.confidence} | ${p.grade} | ${p.applied ? "yes" : "no"} | ${Math.round(p.weight * 100)} % | ${pp(a.tenYearYieldDelta)} | ${pp(a.mortgageRateDelta)} | ${pp(a.inflationDelta)} | ${a.equityReturnMultiplier.toFixed(3)} | ${a.equityVolMultiplier.toFixed(3)} | ${pct(a.dollarIndexPct)} | ${pct(a.goldPct)} | ${Math.round(a.recessionProbability * 100)} % | ${p.basis} |`);
  }
  out.push("");
  out.push("## How the confidence was formed");
  out.push("");
  for (const r of h.rationale) out.push(`- ${r}`);
  out.push("");
  out.push("## The scenario's own reasoning");
  out.push("");
  const first = h.path[0]?.adjustments;
  for (const r of first?.rationale ?? NEUTRAL_ADJUSTMENTS.rationale) out.push(`- ${r}`);
  out.push("");
  out.push("## Evidence the projection stands on");
  out.push("");
  out.push(`- Factors graded signal / context / pending: ${h.evidence.signalFactors} / ${h.evidence.contextFactors} / ${h.evidence.pendingFactors}${h.evidence.pendingFactors > 0 && h.evidence.signalFactors === 0 ? " — no backtest has run in this deployment yet; the measured-state confidence is the no-history base." : ""}`);
  out.push(`- Longest measured signal horizon: ${h.evidence.longestSignalHorizonMonths} months.`);
  out.push(`- Measured lead-lag findings above threshold: ${h.evidence.measuredLeads ?? 0}.`);
  out.push(`- Stored history: ${h.evidence.storedCoverageYears ?? 0} years on the longest pool series.`);
  out.push(`- Treasury pool dry-up regime: ${h.evidence.dryUpRegime ?? "not yet measured"}.`);
  out.push("");
  out.push("## Method");
  out.push("");
  for (const m of h.method) out.push(`- ${m}`);
  out.push("");
  out.push("## Rules-table rows used");
  out.push("");
  out.push(h.assumptionIds.map(id => `\`${id}\` = ${A(id)}`).join("; "));
  out.push("");
  out.push("## References");
  out.push("");
  const refs = h.sourceIds.map(id => SOURCE_BY_ID.get(id)).filter((s): s is NonNullable<typeof s> => Boolean(s));
  if (!refs.length) out.push("_No scenario toggled, so no engine sources were consulted; the rules-table rows above are the only inputs._");
  for (const s of refs) out.push(`- ${s.name} — ${s.entity} (${s.tier}, ${s.cadence}): ${s.url}`);
  out.push("");
  out.push("_The platform's measured skill reaches 3–12 months (factor backtests) and 12–24 months (scenario engines). Everything beyond is the calculator's own long-run assumption, shown here so the reader can see exactly where the projection stops being evidence and starts being assumption._");
  return out.join("\n") + "\n";
}

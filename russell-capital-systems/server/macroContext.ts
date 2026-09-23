/**
 * Macro Context for Thomas Goldman — the brief he reads before he answers.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * One function builds a compact, dated, sourced paragraph set from the
 * engines. It goes into the advisor's system prompt after the carrier
 * summary, so any client question about rates, inflation, "what if China
 * dumps Treasuries", or a Taiwan headline gets the platform's own numbers
 * rather than the model's memory.
 *
 * W8 adds a SINCE YESTERDAY block — top movers, new statements, sources that
 * went dark, the running accuracy line — under a fixed character budget
 * (`brief.maxChars` in the rules table). The block is trimmed first when the
 * budget is tight; the model lines are never trimmed. The block's inputs are
 * read by the router (`currentObservations()` calls `setBriefExtras`) so the
 * Thomas router's one-line call, `buildMacroBrief(observations)`, needs no
 * change: it picks up whatever the last read cached in this module.
 *
 * Also exposes `MACRO_LOOKUP` — the directive Thomas can emit mid-answer to
 * pull a specific engine result the same way he pulls a carrier record.
 * Kinds: liquidation, debt, and (W8) factor and statement. All in-process;
 * no network from a lookup.
 */
import {
  A,
  assessLiquidation,
  assessTaiwan,
  settlementBreakdown,
  debtOverview,
  followThroughReport,
  simulateLiquidation,
  assessSovereign,
  DEBT_TABLE,
  TREASURY_HOLDINGS,
  SEED_OBSERVATIONS,
  SOURCE_BY_ID,
  FACTOR_BY_ID,
  MACRO_FACTORS,
  STATEMENT_LEDGER,
  type Observation,
} from "@shared/macro";

export type MacroBrief = {
  text: string;
  asOf: string;
  sourceIds: string[];
  /** Characters used against `brief.maxChars`, and whether the since-yesterday block was trimmed. */
  chars: number;
  trimmed: boolean;
};

export type BriefExtras = {
  asOf: string;
  /** Indicators whose latest stored reading differs from the previous one by more than `brief.moverThresholdPct`. */
  movers: Array<{ indicatorId: string; name: string; previous: number; latest: number; changePct: number; asOf: string; unit: string }>;
  /** Statements that landed in the ledger since the previous day. */
  newStatements: Array<{ speaker: string; office?: string | null; claim: string; date: string; sourceUrl?: string | null; category: string }>;
  /** Sources with a failure streak of three or more. */
  darkSources: Array<{ sourceId: string; failStreak: number; lastSuccessAt: string | null; lastDetail: string | null }>;
  /** One line from shared/macro/scoring.ts `accuracyLine`. */
  accuracy: string;
  /** Per-factor state for the FACTORS line and factor lookups. */
  factors: Array<{ id: string; verdict: "signal" | "context" | "pending"; leadR: number | null; hitRate: number | null; coverageYears: number; earliestAsOf: string | null; status: string; latestValue: number | null; latestAsOf: string | null; signal: number | null; meanBrier: number | null; liveN: number }>;
  /** Recent ledger rows for statement lookups (newest first, capped). */
  recentStatements: Array<{ id: string; date: string; speaker: string; office?: string | null; claim: string; outcome: string; sourceUrl?: string | null; outcomeSourceUrl?: string | null; category: string }>;
};

let latestExtras: BriefExtras | null = null;

/** The router calls this after each observation read; the brief uses it when no extras are passed. */
export function setBriefExtras(extras: BriefExtras | null): void {
  latestExtras = extras;
}

export function getBriefExtras(): BriefExtras | null {
  return latestExtras;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

function sinceYesterdayLines(x: BriefExtras): string[] {
  const lines: string[] = [`SINCE YESTERDAY (${x.asOf}):`];
  if (x.movers.length) {
    lines.push(`Movers: ${x.movers.slice(0, 8).map(m => `${m.name} ${m.previous} → ${m.latest} ${m.unit} (${m.changePct > 0 ? "+" : ""}${m.changePct}%, ${m.asOf}, ${m.indicatorId})`).join("; ")}.`);
  } else lines.push("Movers: none above the threshold.");
  if (x.newStatements.length) {
    lines.push(`New statements (${x.newStatements.length}): ${x.newStatements.slice(0, 6).map(s => `${s.date} ${s.speaker}${s.office ? ` [${s.office}]` : ""}: "${s.claim.slice(0, 120)}"${s.sourceUrl ? ` <${s.sourceUrl}>` : ""}`).join(" | ")}.`);
  } else lines.push("New statements: none.");
  if (x.darkSources.length) {
    lines.push(`Sources dark (${x.darkSources.length}): ${x.darkSources.slice(0, 8).map(d => `${d.sourceId} ×${d.failStreak}${d.lastSuccessAt ? ` (last ok ${d.lastSuccessAt.slice(0, 10)})` : ""}`).join(", ")} — their indicators run on cached rows; say so if you use one.`);
  } else lines.push("Sources dark: none.");
  lines.push(x.accuracy);
  const sig = x.factors.filter(f => f.verdict === "signal");
  const ctx = x.factors.filter(f => f.verdict === "context");
  const pend = x.factors.filter(f => f.verdict === "pending");
  const cov = x.factors.filter(f => f.coverageYears > 0).sort((a, b) => b.coverageYears - a.coverageYears).slice(0, 5).map(f => `${f.id} ${f.coverageYears}y from ${f.earliestAsOf}`);
  lines.push(`FACTORS: ${sig.length} signal (measured lead), ${ctx.length} context (no lead measured; weight 0), ${pend.length} pending backtest.${sig.length ? ` Signals: ${sig.slice(0, 6).map(f => `${f.id} r ${f.leadR} hit ${f.hitRate === null ? "n/a" : pct(f.hitRate)}`).join("; ")}.` : ""}${cov.length ? ` Coverage: ${cov.join(", ")}.` : " Coverage: no history stored yet."}`);
  return lines;
}

export function buildMacroBrief(observations: Observation[] = SEED_OBSERVATIONS, today: string = new Date().toISOString().slice(0, 10), extras: BriefExtras | null = latestExtras): MacroBrief {
  const jp = assessLiquidation("JP", observations, today);
  const cn = assessLiquidation("CN", observations, today);
  const tw = assessTaiwan(observations, today);
  const oil = settlementBreakdown();
  const debt = debtOverview();
  const ft = followThroughReport();
  const sources = new Set<string>([...jp.stress.sourceIds, ...cn.stress.sourceIds, ...tw.sourceIds, ...oil.sourceIds, debt.sourceId]);

  const head = [
    `--- GLOBAL MACRO INTELLIGENCE (platform models, ${today}; every figure below is dated and sourced — cite the source id when you use one) ---`,
    `TREASURY HOLDINGS (TIC Table 5, ${TREASURY_HOLDINGS.asOf}, us-tic-mfh): Japan $${TREASURY_HOLDINGS.japan} bn (peak $${TREASURY_HOLDINGS.japanPeak} bn, Nov 2021); China $${TREASURY_HOLDINGS.chinaMainland} bn (lowest since 2008); all foreign $${TREASURY_HOLDINGS.totalForeign.toLocaleString()} bn.`,
    `JAPAN LIQUIDATION: ${pct(jp.stress.band.probability)} probability of selling ≥10% of holdings within 24 months (80% band ${pct(jp.stress.band.low)}–${pct(jp.stress.band.high)}), confidence ${jp.stress.band.confidence}/100 grade ${jp.stress.band.grade}. Median 24-month net sale $${jp.forecast.horizons[3].sold.p50.toFixed(0)} bn (p90 $${jp.forecast.horizons[3].sold.p90.toFixed(0)} bn). Top drivers: ${jp.stress.drivers.slice(0, 3).map(d => d.name).join("; ")}.`,
    `CHINA LIQUIDATION: ${pct(cn.stress.band.probability)} (band ${pct(cn.stress.band.low)}–${pct(cn.stress.band.high)}), confidence ${cn.stress.band.confidence}/100 grade ${cn.stress.band.grade}. Median 24-month net sale $${cn.forecast.horizons[3].sold.p50.toFixed(0)} bn (p90 $${cn.forecast.horizons[3].sold.p90.toFixed(0)} bn). State-media 'dump Treasuries' threats are weighted at ${cn.statementWeights.find(w => w.indicatorId === "cn-state-media-threat")?.multiplier ?? "n/a"} by the 1979–2026 follow-through ledger (financial threats followed through ${pct(ft.byCategory.find(c => c.category === "financial-retaliation")?.rate.rate ?? 0)}; announced military exercises ${pct(ft.byCategory.find(c => c.category === "taiwan-military")?.rate.rate ?? 0)}).`,
    `TAIWAN: 12-month probabilities — gray-zone ${pct(tw.scenarios[0].twelveMonthProbability)}, quarantine ${pct(tw.scenarios[1].twelveMonthProbability)}, blockade ${pct(tw.scenarios[2].twelveMonthProbability)}, war ${pct(tw.scenarios[3].twelveMonthProbability)}; blockade-or-worse within 24 months ${pct(tw.blockadeOrWorse24m)}, confidence grade ${tw.grade}. First-year world GDP impact if it happens: blockade −5.3%, war −9.6% ($10.6 tn) (bloomberg-economics-taiwan).`,
    `OIL SETTLEMENT (${oil.asOf}): ~${Math.round(oil.nonUsdShare * 100)}% of global crude trade settles outside the dollar (range ${Math.round(oil.nonUsdLow * 100)}–${Math.round(oil.nonUsdHigh * 100)}%); CNY ~${Math.round((oil.byCurrency.find(c => c.currency === "CNY")?.share ?? 0) * 100)}%. Largest corridors: ${oil.concentration.slice(0, 4).join(", ")}.`,
    `SOVEREIGN DEBT (IMF WEO Apr 2026, imf-weo): world ${debt.world?.debt2026}% of GDP (2026), ${debt.world?.debt2031}% by 2031. ${debt.countries} economies tracked; ${debt.counts.distressed} distressed, ${debt.counts["in-default"]} in default; ${debt.gdpShareInDistress}% of world GDP in distress. Worst: ${debt.top10.slice(0, 5).map(t => `${t.iso3} ${t.score}`).join(", ")}.`,
  ];
  const tail = [
    `RULES: (1) Quote the probability AND the confidence grade together; never one without the other; for a factor, quote its verdict (signal/context) and its Brier score with it. (2) These are model outputs from stated assumptions, not predictions of fact; say so when a client might act on them. (3) For a scenario, a debt row, a factor or a statement, emit exactly one line and wait: MACRO_LOOKUP: {"kind":"liquidation","holder":"JP|CN|BOTH","fraction":0.5,"months":6} · MACRO_LOOKUP: {"kind":"debt","iso3":"ITA"} · MACRO_LOOKUP: {"kind":"factor","id":"f-curve-10y3m"} · MACRO_LOOKUP: {"kind":"statement","query":"Fed chair"}. (4) When a calculator result is being discussed, ask whether the client wants the macro toggles applied. (5) A source marked dark means the number is cached; say how old it is.`,
    `--- END MACRO INTELLIGENCE ---`,
  ];

  const budget = A("brief.maxChars");
  const fixed = [...head, ...tail].join("\n").length + 1;
  let middle = extras ? sinceYesterdayLines(extras) : ["SINCE YESTERDAY: no stored history read yet (first refresh pending); factors all pending backtest."];
  let trimmed = false;
  // Trim the since-yesterday block from the end until the whole brief fits; the model lines are never touched.
  while (middle.length && fixed + middle.join("\n").length > budget) {
    middle = middle.slice(0, -1);
    trimmed = true;
  }
  if (trimmed && middle.length) middle.push("(since-yesterday block trimmed to budget; MACRO_LOOKUP reaches the rest)");
  const text = [...head, ...middle, ...tail].join("\n");
  return { text, asOf: today, sourceIds: Array.from(sources), chars: text.length, trimmed };
}

/**
 * The two W8 kinds declare `iso3?: undefined` so the Thomas router's existing
 * consultation label (`debt ${q.iso3}`, a file outside packet W8's allow-list)
 * keeps compiling; `describeMacroLookup()` below is the label it should use.
 */
export type MacroLookup =
  | { kind: "liquidation"; holder: "JP" | "CN" | "BOTH"; fraction: number; months: number }
  | { kind: "debt"; iso3: string }
  | { kind: "factor"; id: string; iso3?: undefined }
  | { kind: "statement"; query: string; iso3?: undefined };

export function parseMacroLookup(reply: string): MacroLookup | null {
  const m = reply.match(/MACRO_LOOKUP:\s*(\{[\s\S]*?\})/);
  if (!m) return null;
  try {
    const obj = JSON.parse(m[1]) as Partial<MacroLookup> & Record<string, unknown>;
    if (obj.kind === "liquidation" && (obj.holder === "JP" || obj.holder === "CN" || obj.holder === "BOTH")) {
      const fraction = Math.min(1, Math.max(0, Number(obj.fraction ?? 0.5)));
      const months = Math.max(1, Math.min(60, Math.round(Number(obj.months ?? 12))));
      return { kind: "liquidation", holder: obj.holder, fraction, months };
    }
    if (obj.kind === "debt" && typeof obj.iso3 === "string") return { kind: "debt", iso3: obj.iso3.toUpperCase().slice(0, 3) };
    if (obj.kind === "factor" && typeof obj.id === "string") return { kind: "factor", id: obj.id.trim().slice(0, 80) };
    if (obj.kind === "statement" && typeof obj.query === "string" && obj.query.trim()) return { kind: "statement", query: obj.query.trim().slice(0, 120) };
  } catch {
    /* malformed directive: ignore */
  }
  return null;
}

export function stripMacroLookup(reply: string): string {
  return reply.replace(/MACRO_LOOKUP:\s*\{[\s\S]*?\}/g, "").trim();
}

/** Short label for the consultation log; kinds the Thomas router does not special-case fall through here. */
export function describeMacroLookup(q: MacroLookup): string {
  if (q.kind === "liquidation") return `liquidation ${q.holder} ${Math.round(q.fraction * 100)}%/${q.months}m`;
  if (q.kind === "debt") return `debt ${q.iso3}`;
  if (q.kind === "factor") return `factor ${q.id}`;
  return `statement "${q.query}"`;
}

export function executeMacroLookup(q: MacroLookup, extras: BriefExtras | null = latestExtras): string {
  if (q.kind === "liquidation") {
    const r = simulateLiquidation({ holder: q.holder, fraction: q.fraction, months: q.months, runs: 2000 });
    return [
      `MACRO RESULT — Treasury liquidation scenario (${r.asOf} holdings; 2,000 paths):`,
      `Sell ${Math.round(q.fraction * 100)}% of ${q.holder === "BOTH" ? "Japan + China" : q.holder === "JP" ? "Japan" : "China"} = $${r.soldUsdBn.toLocaleString()} bn over ${q.months} months = ${(r.shareOfMarketable * 100).toFixed(1)}% of marketable Treasuries.`,
      `10-year yield: peak +${r.peakTenYearDeltaBp.p50.toFixed(0)} bp median (p10 +${r.peakTenYearDeltaBp.p10.toFixed(0)}, p90 +${r.peakTenYearDeltaBp.p90.toFixed(0)}); at month 12 +${r.twelveMonthTenYearDeltaBp.p50.toFixed(0)} bp. Fed responded in ${pct(r.fedResponded)} of paths.`,
      `Transmission at the central peak: mortgage +${r.transmission.mortgageRateDeltaBp} bp; equities ${r.transmission.equityIndexPct}%; dollar ${r.transmission.dollarIndexPct}%; gold +${r.transmission.goldPct}%; recession probability +${r.transmission.recessionProbabilityDelta} pts; federal interest +$${r.transmission.federalInterestCostUsdBnPerYear} bn/yr; seller's own mark-to-market loss $${r.transmission.holderMarkToMarketLossUsdBn} bn.`,
      `Assumptions: ${r.assumptions.join(" ")}`,
      `Sources: ${r.sourceIds.map(id => `${id} (${SOURCE_BY_ID.get(id)?.name ?? id})`).join("; ")}.`,
    ].join("\n");
  }
  if (q.kind === "factor") {
    const row = FACTOR_BY_ID.get(q.id);
    if (!row || !row.factor) return `MACRO RESULT — no factor "${q.id}". Known factors: ${MACRO_FACTORS.map(f => f.id).join(", ")}. Say so; do not estimate.`;
    const st = extras?.factors.find(f => f.id === q.id);
    const src = SOURCE_BY_ID.get(row.sourceIds[0]);
    return [
      `MACRO RESULT — factor ${row.id}: ${row.name} (${src?.name ?? row.sourceIds[0]}, series ${row.factor.series}, ${row.cadence}).`,
      `Claim: leads ${row.factor.target} by ${row.factor.horizonMonths} months; a rise in the factor moves the target ${row.direction === "risk-up" ? "up" : "down"}. Neutral ${row.factor.neutral} ${row.unit}, span ${row.factor.span} (${row.factor.assumptionPrefix}.*).`,
      st
        ? `Verdict: ${st.verdict}${st.verdict === "signal" ? " (measured lead)" : st.verdict === "context" ? " (no lead measured; weight 0 in any model)" : " (backtest pending: no stored history yet)"}; lead r ${st.leadR ?? "n/a"}, hit rate ${st.hitRate === null ? "n/a" : pct(st.hitRate)}; coverage ${st.coverageYears} years from ${st.earliestAsOf ?? "n/a"} (${st.status}). Latest ${st.latestValue ?? "n/a"} ${row.unit} at ${st.latestAsOf ?? "n/a"}, signal ${st.signal ?? "n/a"}; live Brier ${st.meanBrier ?? "n/a"} over ${st.liveN} matured forecasts.`
        : `Verdict: pending — no history stored yet (first refresh not run in this process). Coverage as published: from ${row.factor.publishedFrom}.`,
      `Rationale: ${row.rationale}`,
      `Quote the verdict with any number from this factor.`,
    ].join("\n");
  }
  if (q.kind === "statement") {
    const needle = q.query.toLowerCase();
    const match = (s: { speaker: string; claim: string; office?: string | null }) => s.speaker.toLowerCase().includes(needle) || s.claim.toLowerCase().includes(needle) || (s.office ?? "").toLowerCase().includes(needle);
    const recent = (extras?.recentStatements ?? []).filter(match).slice(0, 6);
    const seed = STATEMENT_LEDGER.filter(s => match(s)).slice(-4).reverse();
    if (!recent.length && !seed.length) return `MACRO RESULT — no ledger statement matches "${q.query}". Say so; do not invent a quotation.`;
    return [
      `MACRO RESULT — follow-through ledger, statements matching "${q.query}" (newest first; every row carries its citation):`,
      ...recent.map(s => `${s.date} ${s.speaker}${s.office ? ` [${s.office}]` : ""}: "${s.claim}" — outcome ${s.outcome}${s.sourceUrl ? ` <${s.sourceUrl}>` : ""}${s.outcomeSourceUrl ? ` outcome <${s.outcomeSourceUrl}>` : ""}`),
      ...seed.map(s => `${s.date} ${s.speaker} (${s.channel}): "${s.claim}" — outcome ${s.outcome}${s.outcomeNote ? ` (${s.outcomeNote})` : ""} [${s.sourceId}]`),
      `An outcome of "pending" means no cited resolution yet; do not guess one.`,
    ].join("\n");
  }
  const row = DEBT_TABLE.find(r => r.iso3 === q.iso3);
  if (!row) return `MACRO RESULT — no debt row for ${q.iso3}. Say so; do not estimate.`;
  const a = assessSovereign(row);
  return [
    `MACRO RESULT — ${a.name} (${a.iso3}), IMF WEO Apr 2026${a.estimate ? " [row marked ESTIMATE pending connector confirmation]" : ""}:`,
    `Gross debt ${row.debt2025}% (2025) → ${row.debt2026}% (2026) → ${row.debt2031 ?? "n/a"}% (2031). Risk score ${a.score}/100, bucket ${a.bucket}, two-year default probability ${pct(a.twoYearDefaultProbability)}.`,
    `Factors: ${a.factors.map(f => `${f.name} = ${f.value ?? "n/a"} (score ${f.score.toFixed(0)}, weight ${f.weight})`).join("; ")}.`,
    row.note ? `Note: ${row.note}` : "",
    `Source: imf-weo (International Monetary Fund, World Economic Outlook April 2026).`,
  ].filter(Boolean).join("\n");
}

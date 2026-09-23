/**
 * FACTORS.md renderer (W8) — the factor table as a document, from the code.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * `docs/macro/FACTORS.md` is generated from the factor rows so the document
 * cannot drift from the panel. A test renders the pending state and compares
 * it with the committed file; after the first history pull the refresh can
 * re-render with live verdicts through the `factors` procedure's data.
 */
import { MACRO_FACTORS, HOUSEHOLD_FACTORS, FACTOR_TARGET_SERIES, SOURCE_BY_ID, MACRO_LAYER_VERSION, HOUSEHOLD_SIGNALS, HOUSEHOLD_IDEAS, type FactorVerdict, type SeriesMeta, type Indicator } from "@shared/macro";

export type FactorDocRow = { verdict?: FactorVerdict | null; meta?: SeriesMeta | null };

function coverageAsPublished(publishedFrom: string, today: string): number {
  return Math.round(((Date.parse(today) - Date.parse(publishedFrom)) / (365.25 * 86_400_000)) * 10) / 10;
}

/** The household layer as a document: fifty signals, twenty-five factor rows, twenty-five ideas. */
export function renderHouseholdMarkdown(state: Record<string, FactorDocRow>, today: string): string {
  const groups = Array.from(new Set(HOUSEHOLD_SIGNALS.map(s => s.group)));
  const signalRows = HOUSEHOLD_SIGNALS.map((s, i) => {
    const src = SOURCE_BY_ID.get(s.sourceId);
    const state0 = s.factorId ? state[s.factorId] : undefined;
    const verdict = state0?.verdict?.verdict ?? (s.factorId ? "pending" : "—");
    return `| ${i + 1} | ${s.name} | ${s.group} | ${src?.entity ?? s.sourceId} (${s.sourceId}) | ${s.publishedFrom.slice(0, 4)} (${coverageAsPublished(s.publishedFrom, today)} y) | ${s.cadence} | ${s.access} | ${s.direction} | ${s.factorId ? `\`${s.factorId}\` · ${verdict}` : "review"} | ${s.signals} | ${s.reasoning} |`;
  });
  const factorTable = renderFactorsMarkdown(state, today, HOUSEHOLD_FACTORS, "Household factors — the twenty-five that are backtested", "docs/macro/HOUSEHOLD_SIGNALS.md").split("\n").filter(l => l.startsWith("| ") || l.startsWith("|---"));
  return [
    `# Household signals — what families pay and do, wired into the platform`,
    ``,
    `Generated from \`shared/macro/household.ts\` by \`server/macroFactorsDoc.ts\`; macro layer ${MACRO_LAYER_VERSION}; rendered ${today}. Do not edit by hand — \`server/macroHousehold.test.ts\` compares this file with the renderer's output.`,
    ``,
    `**Counts:** ${HOUSEHOLD_SIGNALS.length} signals in ${groups.length} groups (${groups.join(", ")}) · ${HOUSEHOLD_SIGNALS.filter(s => s.access !== "page").length} keyless · ${HOUSEHOLD_SIGNALS.filter(s => s.factorId).length} backtested as factors · ${HOUSEHOLD_IDEAS.length} further ideas.`,
    ``,
    `The owner asked (22 Sep 2026) for car sales and house purchases as economic indicators, forty-year price records for mortgages, cars and college (tuition, books, room and board, and the loan and opportunity cost of paying for it), the fast-food and low-end-grocer tells, the saving-rate tell, and a relative-wealth module by age and profession. This document is the catalogue that answers it. Every row states what it signals and why; "risk-up" means a rise is bad news for the household economy, "risk-down" the reverse, "cost" a price record. Twenty-five rows are factor rows and earn a verdict from the backtest like every other factor; the rest are pages for the 36-hour review or connectors for the next pass.`,
    ``,
    `## The fifty signals`,
    ``,
    `| # | Signal | Group | Publisher (source id) | From (years) | Cadence | Access | Direction | Factor · verdict | What it signals | Why |`,
    `|---|---|---|---|---|---|---|---|---|---|---|`,
    ...signalRows,
    ``,
    `## The twenty-five household factors`,
    ``,
    ...factorTable,
    ``,
    `## Twenty-five ideas: what else to wire in, and why`,
    ``,
    `| # | Idea | What | Reasoning | Sources | Effort |`,
    `|---|---|---|---|---|---|`,
    ...HOUSEHOLD_IDEAS.map(i => `| ${i.n} | **${i.title}** | ${i.what} | ${i.reasoning} | ${i.sources.join(", ")} | ${i.effort} |`),
    ``,
    `## Two engines built with this catalogue`,
    ``,
    `- **College cost** (\`collegeCostProjection\`, \`macro.collegeCost\`): the package for a child by school type, grown to the start year at the tuition and room-and-board rates, four years of it, the loan on the borrowed share at the current federal rate with its fee, the monthly payment and total interest over the standard term, and two opportunity costs at the owner's stated rate: what the payments would have grown to if invested, and what the package would have grown to. Every baseline is a rules-table row flagged VERIFY until the review re-enters it from the publisher's release. The 529 planner reads it with one click.`,
    `- **Relative wealth** (\`relativeWealth\`, \`macro.relativeWealth\`): a client's net worth against households of the same age (SCF 2022 median and mean, log-normal percentile, the nine deciles and the gap to the next one), against all households, and against a profession peer (peer median income × the bracket's net-worth-to-income multiple × an experience scale). The method lines say what is a measurement and what is a model; the reference rows are flagged VERIFY.`,
    ``,
  ].join("\n");
}

export function renderFactorsMarkdown(state: Record<string, FactorDocRow>, today: string, panel: Indicator[] = MACRO_FACTORS, title = "Macro factors — the twenty-five, with source, coverage and verdict", docPath = "docs/macro/FACTORS.md"): string {
  void docPath;
  const rows = panel.map(f => {
    const s = state[f.id] ?? {};
    const v = s.verdict ?? null;
    const m = s.meta ?? null;
    const src = SOURCE_BY_ID.get(f.sourceIds[0]);
    const verdict = v ? v.verdict : "pending";
    const verdictText = verdict === "signal" ? `**signal** (r ${v!.leadR}, hit ${Math.round((v!.hitRate ?? 0) * 100)}%, n ${v!.n})` : verdict === "context" ? `context (r ${v!.leadR ?? "n/a"}, hit ${v!.hitRate === null ? "n/a" : Math.round(v!.hitRate * 100) + "%"}, n ${v!.n}; weight 0)` : "pending (no history stored)";
    const coverage = m && m.points > 0 ? `${m.coverageYears} (stored from ${m.earliestAsOf})` : `${coverageAsPublished(f.factor!.publishedFrom, today)} as published (from ${f.factor!.publishedFrom}); 0 stored`;
    return `| ${f.id} | ${f.name} | ${f.sourceIds[0]} (${src?.access ?? "?"}) | \`${f.factor!.series}\`${f.factor!.denominator ? ` / \`${f.factor!.denominator}\`` : ""} | ${f.factor!.transform} | ${f.cadence} | ${f.factor!.target} @ ${f.factor!.horizonMonths}m | ${f.direction === "risk-up" ? "↑" : "↓"} | ${coverage} | ${verdictText} |`;
  });
  const counts = { signal: 0, context: 0, pending: 0 };
  for (const f of panel) counts[(state[f.id]?.verdict?.verdict ?? "pending") as keyof typeof counts]++;
  const sources = new Set(panel.map(f => f.sourceIds[0]));
  return [
    `# ${title}`,
    ``,
    `Generated from \`shared/macro/indicators.ts\` (\`${panel === HOUSEHOLD_FACTORS ? "HOUSEHOLD_FACTORS" : "MACRO_FACTORS"}\`) by \`server/macroFactorsDoc.ts\`; macro layer ${MACRO_LAYER_VERSION}; rendered ${today}. Do not edit by hand — the test \`server/macroW8.test.ts\` compares this file with the renderer's output.`,
    ``,
    `**Counts:** ${panel.length} factors · ${sources.size} keyless sources (${Array.from(sources).join(", ")}) · verdicts: ${counts.signal} signal, ${counts.context} context, ${counts.pending} pending.`,
    ``,
    `A factor is a data row: the series it is read from, a transform, the target it claims to lead and the horizon. Neutral point, span and plausibility bounds are rows in \`assumptions.ts\` (\`factor.<id>.*\`). The verdict is measured by \`backtestFactor()\` in \`emergentPatterns.ts\` over the stored history: **signal** means a lead correlation of at least ${0.2} at the stated horizon and a directional hit rate of at least 55 % over at least 60 months; **context** means no such lead was measured and the row carries weight 0 in any model; **pending** means fewer than 60 months are stored (or none). "Coverage" is the span of stored rows, or the span the publisher offers when nothing is stored yet. Direction: ↑ a rise in the factor moves the target up; ↓ down.`,
    ``,
    `| Factor | Name | Source (access) | Series | Transform | Cadence | Target @ horizon | Dir | Coverage, years | Backtest verdict |`,
    `|---|---|---|---|---|---|---|---|---|---|`,
    ...rows,
    ``,
    `## Targets`,
    ``,
    `| Indicator | Series | Source | Published from | Plausible range |`,
    `|---|---|---|---|---|`,
    ...FACTOR_TARGET_SERIES.map(t => `| ${t.indicatorId} | \`${t.series}\` | ${t.sourceId} | ${t.publishedFrom} | ${t.min}–${t.max} |`),
    `| f-cpi-yoy, f-indpro-yoy, f-interest-outlays-gdp | (factor rows above, used as targets) | fred | — | — |`,
    ``,
    `## How a verdict is earned`,
    ``,
    `1. The daily refresh pulls each series in full (\`fredgraph.csv\`, the NY Fed CSV and JSON, Fiscal Data, the World Bank API, the TIC history file), drops readings outside the plausibility bounds, and stores month-end points plus the latest reading. If more than 5 % of readings fail the bounds the pull is refused as a format change and nothing is stored.`,
    `2. \`backtestFactor()\` aligns factor and target on a monthly grid; for each month it takes the factor's signal and the target's move over the horizon (level) or whether it fired inside the window (binary); it reports Pearson r at the horizon, the same r against the preceding window (does it lead or follow), and the directional hit rate outside the ±0.1 neutral band.`,
    `3. Signal or context is written to \`macro_factor_scores\`; \`applyFactorVerdicts()\` zeroes the weight of anything that is not a signal before a model consumes the row.`,
    `4. Every refresh logs one forecast per factor; when its horizon passes it is scored (Brier) against the stored target and the running score joins the verdict. Thomas quotes both.`,
    ``,
    `_A factor with no measurable lead is kept as context, not signal. That is what makes "predictive" a measured word._`,
    ``,
  ].join("\n");
}

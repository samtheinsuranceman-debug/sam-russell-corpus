// Writes docs/INTEGRATION_SCORECARD.md from the live audit and the hand
// ratings. Run: npx tsx server/integrationScorecard.script.ts
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { auditCatalogue, auditSummary, DIMENSION_LABEL, DIMENSION_WEIGHT, type DimensionId } from "./integrationAudit";
import { PAGE_RATINGS } from "@shared/pageRatings";

const audits = auditCatalogue();
const s = auditSummary(audits);
const ratings = new Map(PAGE_RATINGS.map((r) => [r.path, r]));
const dims = Object.keys(DIMENSION_WEIGHT) as DimensionId[];
const today = new Date().toISOString().slice(0, 10);

const out: string[] = [];
out.push(`# Integration Scorecard`, `## Every page, ten wiring dimensions read from the code, beside value and frequency`, ``, `Generated ${today} by \`server/integrationScorecard.script.ts\`. Wiring is computed; value and frequency are judgements from \`shared/pageRatings.ts\`. The gap (value − wiring) is the work list.`, ``);
out.push(`## Summary`, ``, `| Pages | Mean wiring | At 10 | Below 5 |`, `|---|---|---|---|`, `| ${s.pages} | ${s.mean} | ${s.perfect} | ${s.below5} |`, ``);
out.push(`### System-wide gaps (pages missing each dimension)`, ``, `| Dimension | Weight | Pages missing |`, `|---|---|---|`);
for (const d of dims) out.push(`| ${DIMENSION_LABEL[d]} | ${DIMENSION_WEIGHT[d]} | ${s.gaps[d]} |`);
out.push(``, `Routers fetching external data: ${s.dataRouters.join(", ")}`, ``);

out.push(`## The rated pages, by gap`, ``);
const rated = audits.filter((a) => ratings.has(a.path)).sort((a, b) => (ratings.get(b.path)!.value - b.score) - (ratings.get(a.path)!.value - a.score));
out.push(`| Page | Wiring | Value | Freq | Gap | Missing |`, `|---|---|---|---|---|---|`);
for (const a of rated) { const r = ratings.get(a.path)!; out.push(`| ${a.name} \`${a.path}\` | ${a.score} | ${r.value} | ${r.frequency} | ${(r.value - a.score).toFixed(1)} | ${dims.filter((d) => !a.dims[d]).map((d) => DIMENSION_LABEL[d]).join(", ") || "—"} |`); }
out.push(``);

out.push(`## Page by page`, ``);
for (const a of rated) {
  const r = ratings.get(a.path)!;
  out.push(`### ${a.name} — \`${a.path}\``, ``, `**Wiring ${a.score}/10 · Value ${r.value}/10 · Frequency ${r.frequency}/10**`, ``, `*Right page when:* ${r.conditions}`, ``);
  if (a.missing.length) { out.push(`**To reach ten — from the code:**`); for (const m of a.missing) out.push(`- ${m}`); out.push(``); }
  out.push(`**Connections that would take it to ten — by judgement:**`); for (const c of r.connectTo) out.push(`- ${c}`); out.push(``);
}

out.push(`## Every other catalogue page (unrated), by wiring`, ``, `| Page | Wiring | Missing |`, `|---|---|---|`);
for (const a of audits.filter((a) => !ratings.has(a.path))) out.push(`| ${a.name} \`${a.path}\` | ${a.score} | ${dims.filter((d) => !a.dims[d]).map((d) => DIMENSION_LABEL[d]).join(", ") || "—"} |`);

const here = (import.meta as { dirname?: string }).dirname ?? (typeof __dirname !== "undefined" ? __dirname : join(process.cwd(), "server"));
const target = join(here, "..", "docs", "INTEGRATION_SCORECARD.md");
writeFileSync(target, out.join("\n"));
console.log(`wrote ${target}: ${audits.length} pages, ${rated.length} rated, mean ${s.mean}`);

// ============================================================
// THE INHERITANCE ENGINE — tRPC. The client's expected inheritances from the
// Fact Finder, the CPI ladder and the erosion trajectory from the hosts that
// already read them, the report, and the save back to the Fact Finder. The
// gentle follow-up and the partner copy ride along as text; the partner's
// figure is withheld until the owner approves it.
// ============================================================
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getFactFinderForUser, saveFactFinderForUser } from "./factFinderDb";
import { inflationLadder } from "./inflation";
import { weightedClaims } from "./forecastSources";
import { powerInput } from "./erosionRouter";
import { taxTrajectory, type CategoryRates, type TrajectoryPoint } from "@shared/erosion";
import { ASSET_CLASSES, FEDERAL_ESTATE_EXCLUSION, FEDERAL_ESTATE_SOURCE, FOLLOW_UP, INHERITANCE_SOURCES, PARTNER_COPY, inheritanceReport, type InheritanceItem } from "@shared/inheritanceEngine";
import type { ClientFactFinder, ListRow } from "@shared/clientFactFinder";

const num = (v: unknown) => { const n = Number(String(v ?? "").replace(/[^0-9.-]/g, "")); return Number.isFinite(n) ? n : 0; };
const itemSchema = z.object({
  id: z.string().max(40), label: z.string().max(120), assetClass: z.string().max(40), amount: z.number().min(0).max(1e10), expectedYear: z.number().int().min(2000).max(2126),
  from: z.string().max(40), likelihood: z.number().int().min(1).max(5), taxableSharePct: z.number().min(0).max(100).nullable().optional(), notes: z.string().max(400).optional(),
});

/** Fact Finder rows → items; blanks get the plain defaults and nothing is invented. */
export function itemsFromRows(rows: ListRow[] | undefined, thisYear: number): InheritanceItem[] {
  return (rows ?? []).map((r, i) => ({
    id: String(r.id ?? i + 1), label: String(r.label ?? "").trim() || `Item ${i + 1}`, assetClass: String(r.assetClass ?? "cash"), amount: num(r.amount),
    expectedYear: num(r.expectedYear) || thisYear + 10, from: String(r.from ?? "Parent"), likelihood: Math.max(1, Math.min(5, num(r.likelihood) || 3)),
    taxableSharePct: r.taxableSharePct == null || r.taxableSharePct === "" ? null : num(r.taxableSharePct), notes: r.notes == null ? undefined : String(r.notes),
  }));
}
export function marginalFromBracket(v: unknown): number | null { const m = /^(\d{2})%/.exec(String(v ?? "")); return m ? Number(m[1]) / 100 : null; }

async function hostContext(): Promise<{ cpi: CategoryRates | null; trajectory: TrajectoryPoint[]; thisYear: number }> {
  const thisYear = new Date().getFullYear();
  const ladder = await inflationLadder().catch(() => []);
  const all = ladder.find((c) => c.id === "all");
  const cpi = all && Object.keys(all.rates).length ? { id: all.id, label: all.label, asOf: all.asOf, rates: all.rates } : null;
  let trajectory: TrajectoryPoint[] = [];
  try {
    const [{ claims, totalPanelWeight, allPanelWeight }, pw] = await Promise.all([weightedClaims(), powerInput()]);
    trajectory = taxTrajectory({ startYear: thisYear, claims, totalPanelWeight, allPanelWeight, power: pw.input });
  } catch { trajectory = []; }
  return { cpi, trajectory, thisYear };
}

export const inheritanceRouter = router({
  /** What the Fact Finder holds, what the host can read, and the text the page prints. */
  context: protectedProcedure.query(async ({ ctx }) => {
    const ff = await getFactFinderForUser(ctx.user.id).catch(() => null);
    const data = ff?.data as ClientFactFinder | undefined;
    const host = await hostContext();
    const estate = data?.sections?.estate ?? {};
    const items = itemsFromRows(data?.lists?.inheritances, host.thisYear);
    const fallback = num(estate.inheritanceExpected);
    return {
      items, fallbackExpected: fallback > 0 && !items.length ? fallback : null,
      marginalRate: marginalFromBracket(data?.sections?.taxes?.marginalBracket), benefactorEstate: num(estate.benefactorEstateEstimate) || null,
      thisYear: host.thisYear, cpi: host.cpi, trajectory: host.trajectory.map((p) => ({ horizonYears: p.horizonYears, pHigher: p.pHigher, burdenMultiplier: p.burdenMultiplier, confidence: p.confidence })),
      classes: ASSET_CLASSES, exclusion: FEDERAL_ESTATE_EXCLUSION, exclusionSource: FEDERAL_ESTATE_SOURCE, sources: INHERITANCE_SOURCES,
      followUp: FOLLOW_UP,
      partner: { ...PARTNER_COPY, quote: PARTNER_COPY.quote.approved ? PARTNER_COPY.quote : null },
    };
  }),

  /** The report on the items as typed; pure arithmetic on the host's readings. */
  report: protectedProcedure.input(z.object({ items: z.array(itemSchema).max(40), marginalRate: z.number().min(0).max(0.6), stateRate: z.number().min(0).max(0.2).default(0), benefactorEstate: z.number().min(0).max(1e11).nullable().optional() })).query(async ({ input }) => {
    const host = await hostContext();
    return inheritanceReport(input.items, { thisYear: host.thisYear, marginalRate: input.marginalRate, stateRate: input.stateRate, cpi: host.cpi, trajectory: host.trajectory, benefactorEstate: input.benefactorEstate ?? null });
  }),

  /** Write the items back to the Fact Finder's estate section so every other engine sees them. */
  saveItems: protectedProcedure.input(z.object({ items: z.array(itemSchema).max(40), benefactorEstate: z.number().min(0).max(1e11).nullable().optional() })).mutation(async ({ ctx, input }) => {
    const existing = await getFactFinderForUser(ctx.user.id).catch(() => null);
    const data: ClientFactFinder = (existing?.data as ClientFactFinder | undefined) ?? { version: 1, sections: {}, lists: {} };
    const next: ClientFactFinder = { ...data, sections: { ...data.sections, estate: { ...(data.sections.estate ?? {}), ...(input.benefactorEstate != null ? { benefactorEstateEstimate: input.benefactorEstate } : {}) } }, lists: { ...data.lists, inheritances: input.items.map((i) => ({ id: i.id, label: i.label, assetClass: i.assetClass, amount: i.amount, expectedYear: i.expectedYear, from: i.from, likelihood: i.likelihood, taxableSharePct: i.taxableSharePct ?? null, notes: i.notes ?? "" })) } };
    const saved = await saveFactFinderForUser(ctx.user.id, next);
    return { ok: !!saved, count: input.items.length };
  }),
});

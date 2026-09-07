// ============================================================
// THE ZIP ENGINE — tRPC. What the record says about the client's own zip
// codes for the window they chose, the cohort of zips like theirs, and the
// true cost of the loan year by year. Sources and as-of dates ride along
// with every answer.
// ============================================================
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { ENV } from "./_core/env";
import { getFactFinderForUser } from "./factFinderDb";
import { COHORT_THRESHOLDS, DEFAULT_THRESHOLD, ZIP_SOURCES, interestSheet } from "@shared/zipEngine";
import { cohortFor, pmms, reportFor, yearRange, zipStatus, zipSweep } from "./zipData";

const isOwner = (ctx: { user: { openId: string; role: string } }) => ctx.user.openId === ENV.ownerOpenId || ctx.user.role === "admin";
const zipList = z.array(z.string().regex(/^\d{5}$/)).min(1).max(12);

/** The client's own zips from the Fact Finder: the primary home and every additional property that carries one. */
export function zipsFromFactFinder(ff: { sections: Record<string, Record<string, unknown>>; lists: Record<string, Array<Record<string, unknown>>> } | null | undefined): Array<{ zip: string; label: string }> {
  if (!ff) return [];
  const out: Array<{ zip: string; label: string }> = [];
  const five = (v: unknown) => { const s = String(v ?? "").trim(); return /^\d{5}$/.test(s) ? s : null; };
  const home = five(ff.sections?.realEstate?.primaryHomeZip);
  if (home) out.push({ zip: home, label: "Primary home" });
  (ff.lists?.properties ?? []).forEach((p, i) => { const zp = five(p.zip); if (zp) out.push({ zip: zp, label: `${String(p.type ?? "Property")} ${i + 1}` }); });
  return out;
}

export const zipRouter = router({
  /** Which files have been read, how many zips each covers, and their as-of dates. Public: no client data. */
  status: publicProcedure.query(async () => ({ ...(await zipStatus()), range: await yearRange(), thresholds: COHORT_THRESHOLDS, defaultThreshold: DEFAULT_THRESHOLD, sources: ZIP_SOURCES })),

  /** The signed-in client's zips from their Fact Finder, so the page opens on their own record. */
  mine: protectedProcedure.query(async ({ ctx }) => {
    const ff = await getFactFinderForUser(ctx.user.id).catch(() => null);
    return { zips: zipsFromFactFinder(ff?.data as Parameters<typeof zipsFromFactFinder>[0]) };
  }),

  /** One report per zip for the chosen window and threshold, the cohort beside them, and the loan sheet at each year's rate. */
  report: protectedProcedure.input(z.object({ zips: zipList, startYear: z.number().int().min(1975).max(2100), threshold: z.number().min(0).max(50_000_000).default(DEFAULT_THRESHOLD), yearsAhead: z.number().int().min(1).max(40).default(10), downPct: z.number().min(0).max(100).default(20) })).query(async ({ input }) => {
    const rate = await pmms();
    const answers = await Promise.all(input.zips.map(async (zip) => {
      const a = await reportFor(zip, { startYear: input.startYear, threshold: input.threshold, yearsAhead: input.yearsAhead });
      const sheet = a.report.levels && rate ? interestSheet(a.report.levels, rate.data, { fromYear: input.startYear, downPct: input.downPct, backcastThrough: a.report.backcastThrough }) : [];
      return { ...a, sheet };
    }));
    const cohort = await cohortFor(input.threshold, input.startYear);
    return { answers, cohort, pmms: rate ? { asOf: rate.asOf, url: ZIP_SOURCES.find((s) => s.id === "pmms")!.url } : null, window: { from: input.startYear }, method: { backcast: "Dollar levels before Zillow's first year are the FHFA index scaled to Zillow's first-year value: level(y) = level(anchor) × HPI(y) ÷ HPI(anchor).", annual: "A year's home value or rent is the last month Zillow published in that year; a year's mortgage rate is the average of Freddie Mac's weekly readings." } };
  }),

  /** Owner: read every source now. */
  refresh: protectedProcedure.mutation(async ({ ctx }) => {
    if (!isOwner(ctx)) throw new TRPCError({ code: "FORBIDDEN" });
    return zipSweep();
  }),
});

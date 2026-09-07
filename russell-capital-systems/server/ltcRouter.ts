// ============================================================
// THE LONG-TERM CARE ENGINE — tRPC. The survey's national medians and the
// federal need figures as text; the CPI medical-care ladder for escalation;
// the coverage report for each person in the family; the owner's registry
// of standalone premium-increase filings, each with its filing URL.
// ============================================================
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import { ltcRateFilings } from "../drizzle/schema";
import { inflationLadder } from "./inflation";
import { CARE_SETTINGS, LTC_SOURCES, NEED_STATS, STATE_FIGURE_PROTOCOL, coverageFor, premiumCompare } from "@shared/ltcEngine";

const isOwner = (ctx: { user: { openId: string; role: string } }) => ctx.user.openId === ENV.ownerOpenId || ctx.user.role === "admin";
const settingIds = CARE_SETTINGS.map((s) => s.id) as [string, ...string[]];
const riderSchema = z.object({ deathBenefit: z.number().min(0).max(1e9), monthlyPctOfDeathBenefit: z.number().min(0).max(100), maxMonths: z.number().int().min(1).max(600).nullable(), eliminationDays: z.number().int().min(0).max(365), riderChargePerYear: z.number().min(0).max(1e6).nullable(), formName: z.string().max(160), asOf: z.string().max(20) });
const personSchema = z.object({ label: z.string().max(80), sex: z.enum(["female", "male", "unspecified"]), yearsUntilCare: z.number().min(0).max(60), yearsOfNeed: z.number().min(0).max(30).nullable(), rider: riderSchema.nullable(), stateMonthly: z.record(z.enum(settingIds), z.number().min(0).max(1e6)).default({}) });

/** The yearly escalation the page uses: the CPI medical-care ladder's 10-year rate when the host has it, else the survey's own year-over-year for the setting is shown per row and 3% is the default. */
async function escalation(): Promise<{ rate: number; source: string; asOf: string | null }> {
  try {
    const ladder = await inflationLadder();
    const health = ladder.find((c) => c.group === "health" && c.rates[10] != null) ?? ladder.find((c) => c.group === "health" && c.rates[5] != null);
    if (health) { const r = health.rates[10] ?? health.rates[5]!; return { rate: r, source: `${health.label} (FRED ${health.series}), ${health.rates[10] != null ? "ten" : "five"}-year annualised`, asOf: health.asOf }; }
  } catch { /* absent */ }
  return { rate: 0.03, source: "default 3% a year (no CPI medical-care reading on this host)", asOf: null };
}

export const ltcRouter = router({
  /** The survey, the need figures, the law, the escalation rate, and the protocol. Public: no client data. */
  context: publicProcedure.query(async () => ({ settings: CARE_SETTINGS, need: NEED_STATS, sources: LTC_SOURCES, protocol: STATE_FIGURE_PROTOCOL, escalation: await escalation() })),

  /** The family's coverage: each person against each setting, and the premium comparison when both quotes are typed. */
  report: protectedProcedure.input(z.object({ people: z.array(personSchema).min(1).max(8), compare: z.object({ standalonePremiumPerYear: z.number().min(0).max(1e6).nullable(), standaloneBenefitMonthly: z.number().min(0).max(1e6).nullable(), standaloneBenefitMonths: z.number().int().min(0).max(600).nullable() }).nullable() })).query(async ({ input }) => {
    const esc = await escalation();
    const people = input.people.map((p) => ({ person: p, lines: coverageFor(p, esc.rate) }));
    const first = input.people[0]!;
    const rb = people[0]!.lines[0]!;
    const compare = input.compare ? premiumCompare({ ...input.compare, riderChargePerYear: first.rider?.riderChargePerYear ?? null, riderMonthly: rb.riderMonthly, riderMonths: rb.riderMonths }) : null;
    return { escalation: esc, people, compare, assumptions: [
      `Costs start from the 2025 national medians unless a state figure was typed (marked on the row), and grow ${(esc.rate * 100).toFixed(2)}% a year (${esc.source}) until care begins.`,
      `Years of need default to the federal page's averages (women ${NEED_STATS.yearsWomen}, men ${NEED_STATS.yearsMen}) unless typed.`,
      "The rider pays the form's monthly percentage of the death benefit for the months the form allows; each dollar paid reduces the death benefit. The elimination period and any cap on the total are the form's.",
    ] };
  }),

  /** The owner's registry of standalone premium-increase filings; empty until rows with filing URLs are added. */
  filings: publicProcedure.input(z.object({ state: z.string().regex(/^[A-Za-z]{2}$/).optional(), carrier: z.string().max(120).optional() }).default({})).query(async ({ input }) => {
    const db = await getDb(); if (!db) return { rows: [] as Array<typeof ltcRateFilings.$inferSelect> };
    let rows = await db.select().from(ltcRateFilings).orderBy(desc(ltcRateFilings.year));
    if (input.state) rows = rows.filter((r) => r.stateAbbr === input.state!.toUpperCase());
    if (input.carrier) rows = rows.filter((r) => r.carrier.toLowerCase().includes(input.carrier!.toLowerCase()));
    return { rows };
  }),
  addFiling: protectedProcedure.input(z.object({ carrier: z.string().min(2).max(120), product: z.string().max(160).optional(), stateAbbr: z.string().regex(/^[A-Za-z]{2}$/), year: z.number().int().min(1985).max(2100), increasePct: z.number().min(0).max(1000), filingUrl: z.string().url().max(400), note: z.string().max(2000).optional() })).mutation(async ({ ctx, input }) => {
    if (!isOwner(ctx)) throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb(); if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "no database" });
    await db.insert(ltcRateFilings).values({ carrier: input.carrier, product: input.product, stateAbbr: input.stateAbbr.toUpperCase(), year: input.year, increasePct: String(input.increasePct), filingUrl: input.filingUrl, note: input.note, addedBy: ctx.user.id });
    return { ok: true };
  }),
  removeFiling: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    if (!isOwner(ctx)) throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb(); if (db) await db.delete(ltcRateFilings).where(eq(ltcRateFilings.id, input.id));
    return { ok: true };
  }),
});

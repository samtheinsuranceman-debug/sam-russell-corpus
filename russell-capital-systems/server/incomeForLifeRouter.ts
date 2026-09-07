// ============================================================
// TAX-FREE INCOME FOR LIFE + THE LONGEVITY ENGINE — tRPC. The studies and
// the rules as text (public, no client data); the Fact Finder's ages,
// balances and marginal bracket for the signed-in client; the plan
// (conversion, sheet bonus, payout, expected years from the life table);
// the survival table for one life or two; and the owner's registry of
// rate-sheet rows, each with the sheet's URL and date.
// ============================================================
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import { incomeRateSheets } from "../drizzle/schema";
import { getFactFinderForUser } from "./factFinderDb";
import { marginalFromBracket } from "./inheritanceRouter";
import type { ClientFactFinder } from "@shared/clientFactFinder";
import { FLOW_THROUGH, INCOME_PLAN_RULES, INCOME_SOURCES, STUDIES_FRAMING, WELLBEING_STUDIES, incomePlan } from "@shared/incomeForLife";
import { LIFE_TABLE_SOURCE, LONGEVITY_SOURCES, TABLE_FIRST_AGE, TABLE_LAST_AGE, expectedRemainingYears, survivalTable, type Person } from "@shared/longevityEngine";

const isOwner = (ctx: { user: { openId: string; role: string } }) => ctx.user.openId === ENV.ownerOpenId || ctx.user.role === "admin";
const num = (v: unknown) => { const n = Number(String(v ?? "").replace(/[^0-9.-]/g, "")); return Number.isFinite(n) ? n : 0; };
const personSchema = z.object({ age: z.number().min(TABLE_FIRST_AGE).max(TABLE_LAST_AGE), sex: z.enum(["male", "female"]) });

/** Age in whole years from a date-of-birth string, or null when it is not a date. */
export function ageFrom(dob: unknown, today = new Date()): number | null {
  const d = new Date(String(dob ?? ""));
  if (Number.isNaN(d.getTime())) return null;
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age >= 0 && age < 130 ? age : null;
}

export const incomeForLifeRouter = router({
  /** The studies, the framing, the rules, the flow-through questions and the sources. Public: no client data. */
  context: publicProcedure.query(() => ({
    studies: WELLBEING_STUDIES, framing: STUDIES_FRAMING, rules: INCOME_PLAN_RULES, flowThrough: FLOW_THROUGH,
    sources: INCOME_SOURCES, longevitySources: LONGEVITY_SOURCES, lifeTable: LIFE_TABLE_SOURCE, tableAges: { first: TABLE_FIRST_AGE, last: TABLE_LAST_AGE },
  })),

  /** What the Fact Finder holds for the signed-in client: ages from the dates of birth, the balances by tax character, the marginal bracket. */
  factFinder: protectedProcedure.query(async ({ ctx }) => {
    const ff = await getFactFinderForUser(ctx.user.id).catch(() => null);
    const data = ff?.data as ClientFactFinder | undefined;
    const s = data?.sections ?? {};
    const household = (s.household ?? {}) as Record<string, unknown>;
    const inv = (s.investments ?? {}) as Record<string, unknown>;
    const pretax = num(inv.employerPlanBalance) + num(inv.traditionalIra) + num(inv.spouseEmployerPlanBalance);
    return {
      clientAge: ageFrom(household.dateOfBirth), spouseAge: ageFrom(household.spouseDateOfBirth),
      spouseName: String(household.spouseFirstName ?? "").trim() || null,
      balances: { pretax, roth: num(inv.rothIra), taxable: num(inv.taxableBrokerage) },
      marginalRate: marginalFromBracket((s.taxes as Record<string, unknown> | undefined)?.marginalBracket),
    };
  }),

  /** The survival table for one life or two, from the SSA table: milestone ages with "either" and "both" for a couple, and expected remaining years. */
  longevity: publicProcedure.input(z.object({ first: personSchema, second: personSchema.nullable(), milestones: z.array(z.number().int().min(51).max(TABLE_LAST_AGE)).max(12).optional() })).query(({ input }) => {
    const first: Person = input.first; const second: Person | null = input.second;
    return {
      table: survivalTable(first, second, input.milestones),
      expectedFirst: expectedRemainingYears(first.sex, first.age),
      expectedSecond: second ? expectedRemainingYears(second.sex, second.age) : null,
      source: LIFE_TABLE_SOURCE,
    };
  }),

  /** The plan: refuses taxable money, otherwise converts, applies the sheet's bonus and payout, and sizes the years with the life table. */
  plan: protectedProcedure.input(z.object({
    balance: z.number().min(0).max(1e9), accountKind: z.enum(["pretax", "roth", "taxable"]), conversionTaxPct: z.number().min(0).max(60),
    payoutPct: z.number().min(0).max(30), bonusPct: z.number().min(0).max(100), deferralYears: z.number().int().min(0).max(30),
    startAge: z.number().min(TABLE_FIRST_AGE).max(100), sex: z.enum(["male", "female"]), spouse: personSchema.nullable(), marginalRatePct: z.number().min(0).max(60),
  })).query(({ input }) => incomePlan(input)),

  /** The owner's registry of rate-sheet rows; empty until rows with sheet URLs are added. Never a rate typed from memory. */
  rateSheets: publicProcedure.input(z.object({ age: z.number().int().min(TABLE_FIRST_AGE).max(100).optional(), single: z.boolean().optional() }).default({})).query(async ({ input }) => {
    const db = await getDb(); if (!db) return { rows: [] as Array<typeof incomeRateSheets.$inferSelect> };
    let rows = await db.select().from(incomeRateSheets).orderBy(desc(incomeRateSheets.payoutPct));
    if (input.age != null) rows = rows.filter((r) => r.ageFrom <= input.age! && r.ageTo >= input.age!);
    if (input.single != null) rows = rows.filter((r) => r.single === input.single);
    return { rows };
  }),
  addRateSheet: protectedProcedure.input(z.object({
    carrier: z.string().min(2).max(120), product: z.string().min(1).max(160), ageFrom: z.number().int().min(TABLE_FIRST_AGE).max(100), ageTo: z.number().int().min(TABLE_FIRST_AGE).max(100),
    single: z.boolean().default(true), payoutPct: z.number().min(0).max(30), bonusPct: z.number().min(0).max(100).nullable().default(null), deferralYears: z.number().int().min(0).max(30).default(0),
    principalContinuesToGrow: z.boolean().nullable().default(null), exitAfterYears: z.number().int().min(0).max(30).nullable().default(null), surrenderYears: z.number().int().min(0).max(30).nullable().default(null),
    rateSheetUrl: z.string().url().max(400), asOf: z.string().max(20), note: z.string().max(2000).optional(),
  })).mutation(async ({ ctx, input }) => {
    if (!isOwner(ctx)) throw new TRPCError({ code: "FORBIDDEN" });
    if (input.ageTo < input.ageFrom) throw new TRPCError({ code: "BAD_REQUEST", message: "ageTo before ageFrom" });
    const db = await getDb(); if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "no database" });
    await db.insert(incomeRateSheets).values({
      carrier: input.carrier, product: input.product, ageFrom: input.ageFrom, ageTo: input.ageTo, single: input.single,
      payoutPct: String(input.payoutPct), bonusPct: input.bonusPct == null ? null : String(input.bonusPct), deferralYears: input.deferralYears,
      principalContinuesToGrow: input.principalContinuesToGrow, exitAfterYears: input.exitAfterYears, surrenderYears: input.surrenderYears,
      rateSheetUrl: input.rateSheetUrl, asOf: input.asOf, note: input.note, addedBy: ctx.user.id,
    });
    return { ok: true };
  }),
  removeRateSheet: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    if (!isOwner(ctx)) throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb(); if (db) await db.delete(incomeRateSheets).where(eq(incomeRateSheets.id, input.id));
    return { ok: true };
  }),
});

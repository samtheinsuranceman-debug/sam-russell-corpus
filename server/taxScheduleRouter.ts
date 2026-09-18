// ============================================================
// THE TAX OPTIMISATION SCHEDULE — tRPC. The catalogue (families with their
// cited 2026 parameters, and which of the site's hundred named combinations
// draw on each), the authority panel, and one client's year-by-year
// schedule from their profile and goals, sealed on the ledger.
// ============================================================
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { ENV } from "./_core/env";
import { recordEvent } from "./ledger";
import { getFactFinderForUser } from "./factFinderDb";
import { filingKeyFromLabel } from "@shared/taxRules";
import { AUTHORITY_TIERS, FAMILIES, familiesForTitle } from "@shared/taxStrategies";
import { buildSchedule, type ClientTaxProfile } from "@shared/taxSchedule";
import { TAX_CLAIM_SEEDS, TAX_SOURCES } from "./taxSources";
import { harvestSource, listClaims, listSources } from "./forecastSources";
import combos from "../client/src/data/strategies.json";

const isOwner = (ctx: { user: { openId: string; role: string } }) => ctx.user.openId === ENV.ownerOpenId || ctx.user.role === "admin";
type Combo = { id: number; title: string; ircCodes?: string[]; totalTaxSaved?: number };

export const taxScheduleRouter = router({
  /** The catalogue and the map from the site's named combinations to families. Public, no client data. */
  catalogue: publicProcedure.query(() => ({
    families: FAMILIES,
    tiers: AUTHORITY_TIERS,
    combinations: (combos as Combo[]).map((c) => ({ id: c.id, title: c.title, families: familiesForTitle(c.title).map((f) => f.id) })),
  })),

  panel: protectedProcedure.query(async () => {
    const [sources, claims] = await Promise.all([listSources(TAX_SOURCES), listClaims(TAX_SOURCES, TAX_CLAIM_SEEDS)]);
    return { sources, claims, totalPanelWeight: sources.reduce((s, x) => s + x.weight, 0) };
  }),

  harvestSource: protectedProcedure.input(z.object({ id: z.string().max(40), url: z.string().url().max(500).optional() })).mutation(async ({ ctx, input }) => {
    if (!isOwner(ctx)) throw new TRPCError({ code: "FORBIDDEN" });
    const src = TAX_SOURCES.find((s) => s.id === input.id);
    if (!src) throw new TRPCError({ code: "NOT_FOUND" });
    return harvestSource(src, { url: input.url });
  }),

  /** One client's schedule. Defaults come from the assessment where it has them; every input is printed back. */
  schedule: protectedProcedure.input(z.object({
    filing: z.enum(["single", "joint", "hoh", "separate"]).optional(), state: z.string().length(2).toUpperCase().default("WV"), age: z.number().int().min(18).max(100).default(45), spouseAge: z.number().int().min(18).max(100).optional(),
    children: z.number().int().min(0).max(12).default(0), childrenUnder18: z.number().int().min(0).max(12).default(0),
    w2Income: z.number().nonnegative().optional(), practiceIncome: z.number().nonnegative().default(0), otherIncome: z.number().nonnegative().default(0), incomeGrowth: z.number().min(-0.1).max(0.2).default(0.03),
    entity: z.enum(["none", "sole_prop", "partnership", "s_corp", "c_corp"]).default("none"),
    hasHdhp: z.boolean().default(false), employerPlanDeferralRoom: z.number().nonnegative().default(0), ownsPractice: z.boolean().default(false),
    homeEquity: z.number().nonnegative().default(0), mortgageRate: z.number().min(0).max(0.2).default(0.065), rentalProperties: z.number().int().min(0).max(50).default(0), canRunShortTermRental: z.boolean().default(false),
    taxableInvestments: z.number().nonnegative().default(0), unrealizedGains: z.number().nonnegative().default(0), plannedSaleGain: z.number().nonnegative().default(0), saleYear: z.number().int().min(2026).max(2080).optional(),
    pretaxRetirement: z.number().nonnegative().default(0), rothBalances: z.number().nonnegative().default(0), cashValueLife: z.number().nonnegative().default(0),
    charitableIntentPerYear: z.number().nonnegative().default(0), liquidityReserveMonths: z.number().min(0).max(60).default(6), riskCapacity: z.enum(["low", "medium", "high"]).default("medium"),
    netWorth: z.number().nonnegative().default(0),
    goals: z.array(z.enum(["lower_this_year", "zero_federal_this_year", "lower_lifetime", "tax_free_retirement", "capital_gain_event", "estate", "charity", "real_estate", "exit"])).min(1),
    years: z.number().int().min(1).max(40).default(10), targetBracket: z.union([z.literal(0.24), z.literal(0.32), z.literal(0.35), z.literal(0.37)]).default(0.24),
    seal: z.boolean().default(false),
  })).mutation(async ({ ctx, input }) => {
    const stored = await getFactFinderForUser(ctx.user.id);
    const t = stored?.data?.sections?.taxes ?? {}, inc = stored?.data?.sections?.income ?? {};
    const n = (v: unknown) => (typeof v === "number" ? v : 0);
    const w2Income = input.w2Income ?? (n(t.adjustedGrossIncome) || n(inc.w2Income) + n(inc.bonusIncome) + n(inc.spouseIncome));
    if (!w2Income && !input.practiceIncome && !input.otherIncome) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Enter income (or complete the Income section of the assessment) first" });
    const filing = input.filing ?? filingKeyFromLabel(t.filingStatus);
    const profile: ClientTaxProfile = { ...input, w2Income, filing };
    const schedule = buildSchedule(profile);
    if (input.seal) {
      const fmt = (v: number) => v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
      await recordEvent({ kind: "scenario", source: "client", key: "tax.schedule", label: "Tax optimisation schedule", value: { inputs: profile, totals: schedule.totals, years: schedule.years.map((y) => ({ year: y.year, plannedTax: y.plannedTax, baselineTax: y.baselineTax, steps: y.steps.map((s) => ({ family: s.familyId, amount: s.amount, taxSaved: s.taxSaved })) })) },
        summary: `Tax schedule over ${input.years} years for goals ${input.goals.join(", ")}: ${fmt(schedule.totals.saved)} of federal tax saved against a ${fmt(schedule.totals.baselineTax)} baseline, ${fmt(schedule.totals.deployed)} deployed across ${schedule.years.reduce((s, y) => s + y.steps.length, 0)} steps`, actorName: ctx.user.name ?? null, userId: ctx.user.id });
    }
    return { profile, schedule };
  }),
});

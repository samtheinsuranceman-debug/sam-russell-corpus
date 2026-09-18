// ============================================================
// THE FORGIVENESS ENGINE — tRPC. The record (programs, events, the political
// correlation), the weighted authority panel, and one borrower's outlook:
// every path with its eligibility, wait, amount, tax, odds, confidence and
// references, plus what the freed payment becomes if invested.
// ============================================================
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { ENV } from "./_core/env";
import { recordEvent } from "./ledger";
import { getFactFinderForUser } from "./factFinderDb";
import { filingKeyFromLabel } from "@shared/taxRules";
import { EVENTS, PROGRAMS, forgivenessOutlook, politicalCorrelation, type BorrowerProfile } from "@shared/forgiveness";
import { longRunLeverShare, expectedShareOver } from "@shared/erosion";
import { FORGIVENESS_CLAIM_SEEDS, FORGIVENESS_METRIC_READING, FORGIVENESS_SOURCES } from "./forgivenessSources";
import { harvestSource, listClaims, listSources } from "./forecastSources";
import { powerNow } from "./power";
import { nextSeatedYear } from "./erosionRouter";

const isOwner = (ctx: { user: { openId: string; role: string } }) => ctx.user.openId === ENV.ownerOpenId || ctx.user.role === "admin";

export const forgivenessRouter = router({
  /** The record: every program with its authority, terms, window and outcomes; the events; the computed political correlation. Public, no client data. */
  record: publicProcedure.query(() => ({ programs: PROGRAMS, events: EVENTS, correlation: politicalCorrelation() })),

  panel: protectedProcedure.query(async () => {
    const [sources, claims] = await Promise.all([listSources(FORGIVENESS_SOURCES), listClaims(FORGIVENESS_SOURCES, FORGIVENESS_CLAIM_SEEDS)]);
    return { sources, claims: claims.map((c) => ({ ...c, reading: FORGIVENESS_METRIC_READING[c.metric] ?? null })), totalPanelWeight: sources.reduce((s, x) => s + x.weight, 0) };
  }),

  harvestSource: protectedProcedure.input(z.object({ id: z.string().max(40), url: z.string().url().max(500).optional() })).mutation(async ({ ctx, input }) => {
    if (!isOwner(ctx)) throw new TRPCError({ code: "FORBIDDEN" });
    const src = FORGIVENESS_SOURCES.find((s) => s.id === input.id);
    if (!src) throw new TRPCError({ code: "NOT_FOUND" });
    return harvestSource(src, { url: input.url });
  }),

  /** One borrower's outlook. Defaults come from the assessment where it has them; every input is printed back. */
  outlook: protectedProcedure.input(z.object({
    balance: z.number().nonnegative().optional(), annualRate: z.number().min(0).max(0.2).default(0.08),
    loans: z.enum(["direct", "ffel_unconsolidated", "private", "mixed"]).default("direct"), firstLoanBefore2014: z.boolean().default(false), anyLoanAfterJuly2026: z.boolean().default(false),
    employer: z.enum(["government", "nonprofit_501c3", "other_nonprofit", "for_profit", "unknown"]).default("unknown"), qualifyingPaymentsMade: z.number().int().min(0).max(360).default(0),
    residencyMonthsLeft: z.number().int().min(0).max(120).default(0), residencyStipend: z.number().nonnegative().default(65_100),
    attendingIncome: z.number().nonnegative().optional(), incomeGrowth: z.number().min(-0.1).max(0.2).default(0.03),
    householdSize: z.number().int().min(1).max(12).default(1), dependents: z.number().int().min(0).max(10).default(0), filing: z.enum(["single", "joint", "hoh", "separate"]).optional(),
    plan: z.enum(["ibr", "ibr_old", "paye", "rap", "standard"]).default("ibr"),
    primaryCare: z.boolean().default(false), willingHPSA: z.boolean().default(false), willingIHS: z.boolean().default(false), willingVA: z.boolean().default(false), research: z.boolean().default(false), disciplined: z.boolean().default(true), state: z.string().length(2).toUpperCase().optional(),
    nominalReturn: z.number().min(-0.2).max(0.3).default(0.07), taxDrag: z.number().min(0).max(0.6).default(0.25), wrapperCost: z.number().min(0).max(0.1).default(0.01),
    seal: z.boolean().default(false),
  })).mutation(async ({ ctx, input }) => {
    const stored = await getFactFinderForUser(ctx.user.id);
    const t = stored?.data?.sections?.taxes ?? {}, inc = stored?.data?.sections?.income ?? {}, debt = stored?.data?.sections?.debts ?? {};
    const n = (v: unknown) => (typeof v === "number" ? v : 0);
    const balance = input.balance ?? n(debt.studentLoanBalance);
    if (!balance) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Enter the student loan balance (or complete the Debts section of the assessment) first" });
    const attendingIncome = input.attendingIncome ?? (n(t.adjustedGrossIncome) || n(inc.w2Income) + n(inc.practiceDistributions));
    if (!attendingIncome) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Enter the post-training income (or complete the Income section of the assessment) first" });
    const filing = input.filing ?? filingKeyFromLabel(t.filingStatus);
    const profile: BorrowerProfile = { ...input, balance, attendingIncome, filing };
    // The political term from the power layer: the expected Democratic lever share over the pursuit period.
    let expectedLeverShare = 0.5, powerNote = "power layer unavailable; 0.5 assumed";
    try { const pw = await powerNow(); const years = Math.max(1, Math.ceil((120 - input.qualifyingPaymentsMade) / 12)); expectedLeverShare = expectedShareOver({ shareToday: pw.today.leverShare, expectedShareNext: pw.expectedShareNext, seatedYear: nextSeatedYear(), longRunShare: longRunLeverShare() }, new Date().getFullYear(), years); powerNote = `expected Democratic lever share over the next ${years} years ${(expectedLeverShare * 100).toFixed(0)}% (today ${(pw.today.leverShare * 100).toFixed(0)}%, after the ${nextSeatedYear()} seating ${(pw.expectedShareNext * 100).toFixed(0)}% per the markets, long run ${(longRunLeverShare() * 100).toFixed(0)}%)`; } catch { /* keep default */ }
    const out = forgivenessOutlook(profile, { expectedLeverShare }, new Date(), { nominalReturn: input.nominalReturn, taxDrag: input.taxDrag, wrapperCost: input.wrapperCost });
    if (input.seal && out.best) {
      const fmt = (v: number) => v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
      await recordEvent({ kind: "scenario", source: "client", key: "forgiveness.outlook", label: "Student loan forgiveness outlook", value: { inputs: profile, best: { programId: out.best.programId, forgivenessDate: out.best.forgivenessDate, forgivenAmount: out.best.forgivenAmount, taxOnForgiveness: out.best.taxOnForgiveness, probability: out.best.probability, confidence: out.best.confidence }, alternative: out.alternative && { taxable30: out.alternative.taxable.value30, taxFree30: out.alternative.taxFree.value30 }, expectedLeverShare },
        summary: `Forgiveness outlook: ${out.best.programId.toUpperCase()} forgives ${fmt(out.best.forgivenAmount)} on ${out.best.forgivenessDate} (tax ${fmt(out.best.taxOnForgiveness)}), odds ${Math.round((out.best.probability ?? 0) * 100)}% at confidence ${Math.round(out.best.confidence * 100)}%; the freed payments become ${fmt(out.alternative?.taxFree.value30 ?? 0)} in 30 years tax-free`, actorName: ctx.user.name ?? null, userId: ctx.user.id });
    }
    return { ...out, powerNote, expectedLeverShare };
  }),
});

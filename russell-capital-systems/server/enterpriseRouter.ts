// ============================================================
// THE RENTAL ENTERPRISE — tRPC. Capacity from the Fact Finder and the
// lender's published rules; candidates from the Zip Engine's store with
// each county's hazard record; the plan (one property or several, staggered,
// each loan written, the trust loop on the tax saved); the mutual-only
// carrier registry; the owner's vetted attorneys.
// ============================================================
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { ENV } from "./_core/env";
import { getFactFinderForUser } from "./factFinderDb";
import { MATERIAL_PARTICIPATION_HOURS, PARTICIPATION_LOG, PARTICIPATION_SOURCES, purchasingPower } from "@shared/rentalEnterprise";
import { CARRIER_READ_PROTOCOL, MUTUAL_IUL_CARRIERS, RATING_SCALES } from "@shared/mutualIulCarriers";
import { ALL_INDEX_OPTIONS, CARRIERS, MAX_YEAR, MIN_YEAR } from "@shared/indexCreditingData";
import { ATTORNEY_SOURCES, LENDER_RULES, NRI, TRUST_NOTES, addAttorney, buildEnterprise, capacityFromFactFinder, enterpriseCandidates, hazardStatus, hazardSweep, listAttorneys, proposePlans, rateContext, removeAttorney, type PlanRequest } from "./rentalEnterprise";
import { zipsFromFactFinder } from "./zipRouter";
import { stateAbbr } from "./careerData";

const isOwner = (ctx: { user: { openId: string; role: string } }) => ctx.user.openId === ENV.ownerOpenId || ctx.user.role === "admin";
const pct = (max = 100) => z.number().min(0).max(max);
const overrides = z.object({
  annualIncome: z.number().min(0).max(1e9).optional(), cashAvailable: z.number().min(0).max(1e9).optional(), monthlyDebts: z.number().min(0).max(1e7).optional(), creditScore: z.number().int().min(300).max(850).nullable().optional(),
  maxDti: z.number().min(0.1).max(0.6).optional(), minDownPct: pct(100).optional(), closingPct: pct(15).optional(), reservesMonths: z.number().int().min(0).max(24).optional(), ratePct: pct(25).optional(), termYears: z.number().int().min(5).max(40).optional(),
});
const capacitySchema = z.object({
  annualIncome: z.number().min(0).max(1e9), cashAvailable: z.number().min(0).max(1e9), monthlyDebts: z.number().min(0).max(1e7), creditScore: z.number().int().min(300).max(850).nullable(),
  maxDti: z.number().min(0.1).max(0.6), minDownPct: pct(100), closingPct: pct(15), reservesMonths: z.number().int().min(0).max(24), ratePct: pct(25), termYears: z.number().int().min(5).max(40),
});
const planSchema = z.object({
  capacity: capacitySchema,
  picks: z.array(z.object({ zip: z.string().regex(/^\d{5}$/), price: z.number().min(10_000).max(5e7), label: z.string().max(80).optional(), monthlyRent: z.number().min(0).max(1e6).nullable().optional(), appreciationPct: z.number().min(-50).max(50).nullable().optional(), rentGrowthPct: z.number().min(-50).max(50).nullable().optional() })).min(1).max(6),
  startYear: z.number().int().min(2020).max(2100), startMonth: z.number().int().min(1).max(12), staggerMonths: z.number().int().min(0).max(60),
  horizonYears: z.union([z.literal(20), z.literal(30)]), termYears: z.union([z.literal(20), z.literal(30)]), interestOnlyYears: z.number().int().min(0).max(10), investorSpreadPct: z.number().min(-5).max(10), rateShiftPct: z.number().min(-10).max(10),
  furnishing: z.number().min(0).max(5e6),
  income: z.object({ kind: z.enum(["ltr", "str"]), nightlyRate: z.number().min(0).max(1e5).optional(), occupancyPct: pct(100).optional(), source: z.string().max(200), asOf: z.string().max(20) }),
  costs: z.object({ propertyTaxPct: pct(10), insurancePerYear: z.number().min(0).max(1e6), hoaPerYear: z.number().min(0).max(1e6), maintenancePct: pct(20), managementPct: pct(100), utilitiesPerYear: z.number().min(0).max(1e6), platformFeePct: pct(50), cleaningPerYear: z.number().min(0).max(1e6) }),
  tax: z.object({ buildingSharePct: pct(100), costSegSharePct: pct(100), bonusPct: pct(100), marginalRatePct: pct(60), depreciationYears: z.number().min(1).max(40) }),
  growth: z.object({ expenseGrowthPct: z.number().min(-20).max(30).nullable(), appreciationPct: z.number().min(-50).max(50).nullable(), rentGrowthPct: z.number().min(-50).max(50).nullable() }),
  iul: z.object({ optionId: z.string().max(60), startYear: z.number().int().min(MIN_YEAR).max(MAX_YEAR), premiumLoadPct: pct(30), annualChargePctOfValue: pct(10), loanRatePct: pct(15), firstLoanYear: z.number().int().min(1).max(10), maxLoanPctOfValue: pct(100), newPolicyThreshold: z.number().min(0).max(1e8) }).nullable(),
  assignAfterTaxCashPct: pct(100),
});

export const enterpriseRouter = router({
  /** Which records this host holds and the rates of the day. Public: no client data. */
  status: publicProcedure.query(async () => ({ hazards: await hazardStatus(), rates: await rateContext(), nri: NRI, lenderRules: LENDER_RULES, hours: MATERIAL_PARTICIPATION_HOURS, log: PARTICIPATION_LOG, sources: PARTICIPATION_SOURCES })),

  /** The client's capacity from the Fact Finder (income lines, cash on hand, mortgage and student-loan payments, credit score) under the lender's published rules, with any override typed on the page. */
  capacity: protectedProcedure.input(overrides.default({})).query(async ({ ctx, input }) => {
    const ff = await getFactFinderForUser(ctx.user.id).catch(() => null);
    const data = ff?.data as Parameters<typeof capacityFromFactFinder>[0];
    const rates = await rateContext();
    const { capacity, readFrom } = capacityFromFactFinder(data, rates, input);
    const residence = String((data?.sections?.household as Record<string, unknown> | undefined)?.stateOfResidence ?? "");
    return { capacity, readFrom, power: purchasingPower(capacity), zips: zipsFromFactFinder(data as Parameters<typeof zipsFromFactFinder>[0]), state: residence ? stateAbbr(residence) : null };
  }),

  /** Candidates from the Zip Engine's store, ranked; Plan A (one) and Plan B (several) at the given purchasing power. */
  candidates: protectedProcedure.input(z.object({ states: z.array(z.string().regex(/^[A-Za-z]{2}$/)).max(10).optional(), zips: z.array(z.string().regex(/^\d{5}$/)).max(50).optional(), metros: z.array(z.string().max(60)).max(5).optional(), windowYears: z.number().int().min(1).max(60).default(6), budget: z.number().min(0).max(1e9), count: z.number().int().min(2).max(6).default(4), limit: z.number().int().min(5).max(200).default(40) })).query(async ({ input }) => {
    const r = await enterpriseCandidates({ states: input.states, zips: input.zips, metros: input.metros, windowYears: input.windowYears, limit: input.limit, minValue: input.budget > 0 ? input.budget / input.count * 0.5 : undefined, maxValue: input.budget > 0 ? input.budget * 1.4 : undefined });
    const plans = input.budget > 0 ? proposePlans(r.candidates, input.budget, input.count) : { one: null, several: [], note: "" };
    return { ...r, plans };
  }),

  /** The plan: every loan written, the 20- or 30-year pro-forma per property and for the enterprise, and the trust loop on the tax saved. Pure arithmetic on the request. */
  plan: protectedProcedure.input(planSchema).query(async ({ input }) => buildEnterprise(input as PlanRequest, await rateContext())),

  /** The mutual-only carrier registry, the backtester's index accounts (anonymised keys), the rating scales, and the reading the client does before choosing. Public: no client data. */
  carriers: publicProcedure.query(() => ({
    carriers: MUTUAL_IUL_CARRIERS, scales: RATING_SCALES, protocol: CARRIER_READ_PROTOCOL,
    indexOptions: ALL_INDEX_OPTIONS.map((o) => ({ id: o.id, name: o.name, carrier: o.carrier, index: o.index, cap: o.cap, floor: o.floor, participation: o.participation, spread: o.spread, bonus: o.bonus, availableFrom: o.availableFrom, description: o.description })),
    backtestCarriers: CARRIERS, years: { from: MIN_YEAR, to: MAX_YEAR },
  })),

  /** The trust and asset-protection notes with their authorities. Public. */
  trust: publicProcedure.query(() => ({ notes: TRUST_NOTES, attorneySources: ATTORNEY_SOURCES })),

  /** The owner's vetted attorneys for a state; empty until the owner adds rows. */
  attorneys: protectedProcedure.input(z.object({ state: z.string().regex(/^[A-Za-z]{2}$/).optional() })).query(async ({ input }) => ({ rows: await listAttorneys(input.state), sources: ATTORNEY_SOURCES })),
  addAttorney: protectedProcedure.input(z.object({ name: z.string().min(2).max(120), firm: z.string().max(160).optional(), city: z.string().max(80).optional(), stateAbbr: z.string().regex(/^[A-Za-z]{2}$/), credentials: z.string().max(200).optional(), website: z.string().url().max(300).optional(), phone: z.string().max(40).optional(), email: z.string().email().max(160).optional(), note: z.string().max(2000).optional() })).mutation(async ({ ctx, input }) => {
    if (!isOwner(ctx)) throw new TRPCError({ code: "FORBIDDEN" });
    return { id: await addAttorney({ ...input, addedBy: ctx.user.id }) };
  }),
  removeAttorney: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    if (!isOwner(ctx)) throw new TRPCError({ code: "FORBIDDEN" });
    await removeAttorney(input.id);
    return { ok: true };
  }),

  /** Owner: read FEMA's county file now. */
  refreshHazards: protectedProcedure.mutation(async ({ ctx }) => {
    if (!isOwner(ctx)) throw new TRPCError({ code: "FORBIDDEN" });
    return hazardSweep();
  }),
});

// Calculator Chain — run a row of calculators with hand-offs, deterministically
// or across 10,000 sampled paths. Pure compute over the shared engines; the
// server exists so the 10,000-run job does not block a phone's browser.
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { CHAIN_CALCULATORS, runChain, runChainMonteCarlo, type ChainStep } from "../shared/chainEngine";
import { defaultMacro, M2_PRESETS, MACRO_SOURCES, type MacroAssumptions } from "../shared/macroEngine";
import { defaultModules, type UltraModules } from "../shared/ultraEngine";

const profileSchema = z.object({
  clientAge: z.number().min(18).max(100),
  spouseAge: z.number().min(0).max(100).nullable().optional(),
  incomeSelfAnnual: z.number().min(0),
  incomeSpouseAnnual: z.number().min(0),
  otherIncomeAnnual: z.number().min(0),
  incomeGrowthPct: z.number().min(-20).max(30),
  baseHouseholdExpensesAnnual: z.number().min(0),
  expenseChanges: z.array(z.object({ atYear: z.number().int().min(1), newAnnualExpenses: z.number().min(0) })).max(20),
  effectiveTaxRatePct: z.number().min(0).max(60),
  taxableAssets: z.number().min(0),
  qualifiedAssets: z.number().min(0),
  cashReserves: z.number().min(0),
  home: z.object({ value: z.number().min(0), mortgageBalance: z.number().min(0), mortgageRatePct: z.number().min(0).max(30), mortgagePaymentAnnual: z.number().min(0) }),
  otherDebts: z.array(z.object({ name: z.string().max(60), balance: z.number().min(0), ratePct: z.number().min(0).max(60), paymentAnnual: z.number().min(0) })).max(20),
});

const transferSource = z.enum(["iulCashValue", "taxableAssets", "qualifiedAssets", "cashReserves", "homeEquity", "realEstateValue", "cryptoValue"]);
const transferTarget = z.enum(["trustIUL", "incomeAnnuity", "taxableAssets", "cashReserves", "realEstateProperty", "cryptoValue", "mortgagePaydown"]);
void transferSource;

const calculatorId = z.enum(CHAIN_CALCULATORS.map((c) => c.id) as [string, ...string[]]);

const moduleParams = z.object({
  investmentGrowth: z.object({ enabled: z.boolean(), growthPct: z.number().min(-50).max(50), savingsRatePctOfNetCash: z.number().min(0).max(100) }).partial().optional(),
  mortgageKiller: z.object({ enabled: z.boolean(), cycleYears: z.number().min(1).max(30), extraPrincipalPctOfNetCash: z.number().min(0).max(100) }).partial().optional(),
  realEstate: z.object({ enabled: z.boolean(), appreciationPctDefault: z.number().min(-30).max(40), appreciationPctPerCycle: z.array(z.number()).max(20), rentalMode: z.enum(["str", "ltr", "live"]), strGrossReceiptsPctOfValue: z.number().min(0).max(100), strExpenseRatioPct: z.number().min(0).max(100), ltrNetYieldPctOfValue: z.number().min(0).max(50) }).partial().optional(),
  equityDeployment: z.object({ enabled: z.boolean(), pctOfHomeEquityDeployed: z.number().min(0).max(100), flowsThroughTrustIUL: z.boolean() }).partial().optional(),
  trustIUL: z.object({ enabled: z.boolean(), premiumAnnual: z.number().min(0), premiumYears: z.number().min(0).max(60), creditRatePct: z.number().min(-10).max(30), incomeRatePct: z.union([z.literal(2), z.literal(4)]), incomeStartYear: z.number().min(1).max(200), chronicIllnessMultiple: z.number().min(0).max(50) }).partial().optional(),
  incomeAnnuity: z.object({ enabled: z.boolean(), premium: z.number().min(0), payoutRatePct: z.number().min(0).max(30), startYear: z.number().min(1).max(200) }).partial().optional(),
  crypto: z.object({ enabled: z.boolean(), allocationPctOfTaxable: z.number().min(0).max(100), contributionPctOfNetCash: z.number().min(0).max(100), expectedReturnPct: z.number().min(-100).max(300), volatilityPct: z.number().min(0).max(300) }).partial().optional(),
});

const stepSchema = z.object({
  id: z.string().max(60),
  calculator: calculatorId,
  years: z.number().int().min(1).max(60),
  goal: z.string().max(200).optional(),
  params: moduleParams.optional(),
  handoff: z.object({ enabled: z.boolean(), atYear: z.number().int().min(1).max(60).nullable(), pctOfCashValue: z.number().min(0).max(100), target: transferTarget.nullable() }),
  zip: z.object({ zip: z.string().regex(/^\d{5}$/), fromYear: z.number().int(), toYear: z.number().int(), appreciationPct: z.number().nullable(), rentGrowthPct: z.number().nullable() }).nullable().optional(),
});

const macroSchema = z.object({
  startYear: z.number().int().min(1990).max(2100),
  baselineCpiPct: z.number().min(-5).max(30),
  moneyPrinting: z.object({ enabled: z.boolean(), preset: z.enum(["history-1960-2025", "decade-2010s", "print-2020-2021", "tightening-2022-2023", "custom"]), m2GrowthPct: z.number().min(-30).max(60), m2VolPct: z.number().min(0).max(30), trendM2GrowthPct: z.number().min(-10).max(30), passThrough: z.number().min(0).max(1), lagYears: z.number().int().min(0).max(5) }),
  hardAssets: z.object({ enabled: z.boolean(), betaRealEstate: z.number().min(-3).max(5), betaEquities: z.number().min(-3).max(5), betaCrypto: z.number().min(-10).max(20) }),
  credit: z.object({ enabled: z.boolean(), baseMortgageRatePct: z.number().min(0).max(25), rateSensitivityPer10: z.number().min(-10).max(10), availabilityFloor: z.number().min(0).max(1), availabilityCeiling: z.number().min(1).max(3) }),
  futureTaxation: z.object({ enabled: z.boolean(), startEffectiveRatePct: z.number().min(0).max(60), driftPctPointsPerYear: z.number().min(-5).max(5), capPct: z.number().min(0).max(70) }),
});

const runInput = z.object({
  profile: profileSchema,
  steps: z.array(stepSchema).min(1).max(12),
  macro: macroSchema.optional(),
});

export const chainRouter = router({
  catalog: publicProcedure.query(() => ({ calculators: CHAIN_CALCULATORS, macroDefaults: defaultMacro(), m2Presets: M2_PRESETS, macroSources: MACRO_SOURCES, moduleDefaults: defaultModules() as UltraModules })),

  run: publicProcedure.input(runInput).mutation(({ input }) => {
    const macro = (input.macro ?? defaultMacro()) as MacroAssumptions;
    const res = runChain({ ...input.profile, spouseAge: input.profile.spouseAge ?? null }, input.steps as ChainStep[], macro);
    // Rows are large; keep the per-step rows (the UI shows them) but drop the duplicate copy inside `ultra`.
    return { steps: res.steps, aggregate: res.aggregate, macro: res.macro, transfers: res.ultra.transfers, moduleNotes: res.ultra.moduleNotes, narrative: res.narrative, disclosure: res.disclosure };
  }),

  monteCarlo: publicProcedure.input(runInput.extend({ simulations: z.number().int().min(100).max(20_000).default(10_000), seed: z.number().int().min(0).max(2_147_483_647).default(42) })).mutation(({ input }) => {
    const macro = (input.macro ?? defaultMacro()) as MacroAssumptions;
    return runChainMonteCarlo({ ...input.profile, spouseAge: input.profile.spouseAge ?? null }, input.steps as ChainStep[], macro, { simulations: input.simulations, seed: input.seed, samplePaths: 12 });
  }),
});

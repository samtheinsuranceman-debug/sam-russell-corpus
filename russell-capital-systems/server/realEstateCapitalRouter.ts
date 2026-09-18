/**
 * Real Estate Capital Router
 *
 * tRPC surface over the capital stack, stress, and findings engines. The
 * engines themselves live in shared/ and are pure — this file is validation,
 * composition, and guardrails, nothing more.
 *
 * Monte Carlo is capped and defaults off on the combined `underwrite` call:
 * a few thousand runs is milliseconds, but an unbounded `runs` from the client
 * is a trivially cheap way to pin a server core.
 */
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  analyzeCapitalStack,
  debtConstant,
  goingInCapRate,
  STANDARD_WATERFALL,
  weightedAverageDebtCost,
} from "@shared/realEstateDealModel";
import {
  DEFAULT_STRESS_SCENARIOS,
  findBreakEvens,
  runMonteCarlo,
  runScenarios,
  runStressTest,
} from "@shared/realEstateStressEngine";
import { generateFindings } from "@shared/realEstateFindings";
import {
  analyzeRealEstateCapitalScenario,
  compareStrategies,
  computeSaleAnalysis,
  getDefaultScenarioAssumptions,
} from "@shared/realEstateCapacityEngine";
import {
  allInSubordinateCost,
  classifyCarveouts,
  compareSubordinateCapital,
  scoreCmbsFlexibility,
  scoreControlAsymmetry,
  subordinateTaxFlags,
  type CmbsTerms,
  type SubordinateCapitalTerms,
} from "@shared/realEstateStructuredFinanceEngine";
import { channelStatus, EXCLUDED_PRACTICES } from "./realEstateDataAdapters";
import {
  clientReleaseGate,
  groupByReviewer,
  prioritizeReviewQueue,
  type ReviewableFinding,
} from "./realEstateSourceLedger";
import { DEFAULT_REAL_ESTATE_POLICY } from "@shared/realEstateCapitalTypes";
import type {
  CapitalStackInput,
  RealEstateCapitalScenarioInput,
} from "@shared/realEstateCapitalTypes";

/* ═══ Input validation ═════════════════════════════════════════════════════ */

const MAX_MC_RUNS = 10_000;

const rate = z.number().min(-1).max(5);
const positiveMoney = z.number().min(0).max(1e12);

const debtLayerSchema = z.object({
  id: z.string().min(1).max(64),
  kind: z.enum(["senior_debt", "mezzanine"]),
  principal: positiveMoney,
  rate,
  rateType: z.enum(["fixed", "floating"]),
  floatingSpread: rate.optional(),
  amortization: z.enum(["interest_only", "amortizing", "io_then_amortizing"]),
  amortYears: z.number().min(1).max(50),
  ioYears: z.number().min(0).max(50),
  termYears: z.number().min(1).max(50),
  originationFeePct: z.number().min(0).max(0.2),
  dscrCovenant: z.number().min(0).max(10).optional(),
  prepaymentPenaltyPct: z.number().min(0).max(0.5).optional(),
});

const propertySchema = z.object({
  purchasePrice: positiveMoney,
  closingCostsPct: z.number().min(0).max(0.25),
  capexBudget: positiveMoney,
  year1NOI: z.number().min(-1e9).max(1e12),
  noiGrowthRate: z.number().min(-0.5).max(0.5),
  capexReservePctOfNOI: z.number().min(0).max(0.5),
  // A cap rate at or below zero implies infinite value.
  exitCapRate: z.number().gt(0.001).max(0.5),
  saleCostPct: z.number().min(0).max(0.2),
  holdYears: z.number().int().min(1).max(40),
});

const waterfallTierSchema = z.object({
  // Infinity does not survive JSON, so the residual tier is expressed as a
  // large finite hurdle by clients; both are accepted.
  irrHurdle: z.number().min(0).max(100),
  lpShare: z.number().min(0).max(1),
  gpShare: z.number().min(0).max(1),
});

const capitalStackInputSchema = z
  .object({
    property: propertySchema,
    debt: z.array(debtLayerSchema).max(5),
    preferredEquity: z
      .object({
        id: z.string().min(1).max(64),
        kind: z.literal("preferred_equity"),
        contribution: positiveMoney,
        rate,
        compounding: z.boolean(),
        currentPayRate: rate,
      })
      .optional(),
    commonEquity: z.object({
      lpContribution: positiveMoney,
      gpContribution: positiveMoney,
    }),
    waterfall: z.array(waterfallTierSchema).min(1).max(8),
  })
  .superRefine((val, ctx) => {
    val.waterfall.forEach((tier, i) => {
      if (Math.abs(tier.lpShare + tier.gpShare - 1) > 1e-6) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["waterfall", i],
          message: "lpShare and gpShare must sum to 1",
        });
      }
    });
    if (val.commonEquity.lpContribution + val.commonEquity.gpContribution <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["commonEquity"],
        message: "Common equity must be greater than zero",
      });
    }
    if (val.preferredEquity && val.preferredEquity.currentPayRate > val.preferredEquity.rate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["preferredEquity", "currentPayRate"],
        message: "Current-pay rate cannot exceed the total preferred rate",
      });
    }
  });

const stressScenarioSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(200),
  noiShockPct: z.number().min(-1).max(5).optional(),
  noiGrowthShift: z.number().min(-0.5).max(0.5).optional(),
  exitCapShiftBps: z.number().min(-2000).max(5000).optional(),
  rateShiftBps: z.number().min(-2000).max(5000).optional(),
  holdExtensionYears: z.number().int().min(0).max(20).optional(),
  capexReserveMultiplier: z.number().min(0).max(10).optional(),
});

const monteCarloSchema = z.object({
  runs: z.number().int().min(100).max(MAX_MC_RUNS).default(2000),
  rateVolBps: z.number().min(0).max(1000).default(150),
  capVolBps: z.number().min(0).max(1000).default(75),
  growthVol: z.number().min(0).max(0.2).default(0.015),
  rateCapCorrelation: z.number().min(-1).max(1).default(0.6),
  rateGrowthCorrelation: z.number().min(-1).max(1).default(0.35),
  seed: z.number().int().default(42),
});

/** JSON has no Infinity; treat a very large hurdle as the residual tier. */
function normalizeInput(input: z.infer<typeof capitalStackInputSchema>): CapitalStackInput {
  return {
    ...input,
    waterfall: input.waterfall.map((t) =>
      t.irrHurdle >= 99 ? { ...t, irrHurdle: Infinity } : t,
    ),
  } as CapitalStackInput;
}

/* ═══ RECIN capacity schemas ═══════════════════════════════════════════════ */

const ratio = z.number().min(0).max(1);

const existingLienSchema = z.object({
  id: z.string().min(1).max(64),
  lienPosition: z.number().int().min(1).max(10),
  currentBalance: positiveMoney,
  availableLine: positiveMoney.optional(),
  rate,
  rateType: z.enum(["fixed", "floating", "variable", "hybrid"]),
  annualDebtService: positiveMoney,
  category: z.enum([
    "heloc", "home_equity_loan", "dscr", "bridge", "hard_money", "blanket_dscr",
    "commercial_bank", "cmbs", "mezzanine", "preferred_equity", "seller_finance",
  ]),
  crossCollateralized: z.boolean().optional(),
});

const propertyInputSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(200),
  value: positiveMoney,
  valueAsOf: z.string().max(32).optional(),
  valueSource: z
    .enum(["appraisal", "avm", "assessment", "user_estimate", "broker_opinion"])
    .optional(),
  annualGrossRent: positiveMoney,
  annualOperatingExpenses: positiveMoney,
  annualTaxes: positiveMoney,
  annualInsurance: positiveMoney,
  annualHoa: positiveMoney.optional(),
  annualManagement: positiveMoney.optional(),
  annualMaintenanceReserve: positiveMoney.optional(),
  occupancy: ratio,
  ownershipType: z.enum(["personal", "llc", "trust", "partnership", "corporation"]),
  useType: z.enum([
    "primary", "second_home", "rental_1_4", "multifamily_5_plus", "commercial",
  ]),
  liens: z.array(existingLienSchema).max(10),
  adjustedBasis: positiveMoney.optional(),
  accumulatedDepreciation: positiveMoney.optional(),
  earmarkedForSuccession: z.boolean().optional(),
});

const debtOptionSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().max(120).optional(),
  category: z.enum([
    "heloc", "home_equity_loan", "dscr", "bridge", "hard_money", "blanket_dscr",
    "commercial_bank", "cmbs", "mezzanine", "preferred_equity", "seller_finance",
  ]),
  rate,
  rateType: z.enum(["fixed", "floating", "variable", "hybrid"]),
  marginToIndex: rate.optional(),
  termMonths: z.number().int().min(1).max(600),
  amortizationMonths: z.number().int().min(1).max(600).optional(),
  interestOnlyMonths: z.number().int().min(0).max(600).optional(),
  maxLtv: ratio.optional(),
  maxCltv: ratio.optional(),
  maxLtc: ratio.optional(),
  maxArv: ratio.optional(),
  minDscr: z.number().min(0).max(10).optional(),
  minimumDebtYield: ratio.optional(),
  pointsPct: z.number().min(0).max(0.2).optional(),
  closingCostsPct: z.number().min(0).max(0.2).optional(),
  prepayment: z.object({
    kind: z.enum([
      "none", "flat_pct", "step_down", "yield_maintenance", "defeasance", "lockout",
    ]),
    flatPct: z.number().min(0).max(0.5).optional(),
    stepDownPctByYear: z.array(z.number().min(0).max(0.5)).max(30).optional(),
    lockoutMonths: z.number().int().min(0).max(600).optional(),
  }),
  recourse: z.enum(["full", "limited", "nonrecourse_carveout"]),
  collateralMode: z.enum([
    "single", "cross_collateralized", "blanket", "entity_interest_pledge", "equity_interest",
  ]),
  paymentMode: z.enum(["amortizing", "interest_only", "deferred", "cash_flow_waterfall"]),
  termsSource: z
    .object({
      provider: z.string().max(120).optional(),
      asOf: z.string().max(32).optional(),
      // Terms without a live source are illustrative, never quotes.
      status: z.enum(["illustrative", "indicative", "quoted"]),
    })
    .optional(),
});

const scenarioAssumptionsSchema = z.object({
  vacancyRate: ratio,
  rentGrowth: z.number().min(-0.5).max(0.5),
  expenseGrowth: z.number().min(-0.5).max(0.5),
  propertyValueGrowth: z.number().min(-0.5).max(0.5),
  rateShockBps: z.number().min(-2000).max(5000),
  exitMonths: z.number().int().min(1).max(600).optional(),
  saleCostPct: z.number().min(0).max(0.3),
  refinanceRate: rate,
  refinanceMaxLtv: ratio,
  refinanceMinDscr: z.number().min(0).max(10),
  taxReviewRequired: z.boolean(),
});

const capacityScenarioSchema = z.object({
  scenarioId: z.string().max(64).optional(),
  properties: z.array(propertyInputSchema).min(1).max(50),
  debtOptions: z.array(debtOptionSchema).min(1).max(12),
  assumptions: scenarioAssumptionsSchema,
  liquidity: z.object({
    totalLiquidReserves: positiveMoney,
    earmarkedVacancyReserve: positiveMoney.optional(),
    earmarkedBridgeInterestReserve: positiveMoney.optional(),
    earmarkedInsuranceReserve: positiveMoney.optional(),
    earmarkedRetirementBuffer: positiveMoney.optional(),
    monthlyFixedCostsOutsideProperty: positiveMoney.optional(),
  }),
  requestedProceeds: positiveMoney.optional(),
  acquisition: z
    .object({
      purchasePrice: positiveMoney,
      verifiedRehab: positiveMoney.optional(),
      eligibleClosingCosts: positiveMoney.optional(),
      afterRepairValue: positiveMoney.optional(),
      projectedAnnualGrossRent: positiveMoney.optional(),
      projectedAnnualOperatingExpenses: positiveMoney.optional(),
    })
    .optional(),
  policy: z
    .object({
      targetMinimumDscr: z.number().min(0).max(10),
      minimumDebtYield: ratio,
      targetReserveMonths: z.number().min(0).max(120),
      maxPrudentPortfolioLtv: ratio,
      minimumBridgeExitCoverage: z.number().min(0).max(5),
      rateShockBpsConservative: z.number().min(0).max(5000),
      rateShockBpsSevere: z.number().min(0).max(5000),
      valueDeclineConservative: ratio,
      valueDeclineSevere: ratio,
      vacancyRateConservative: ratio,
      vacancyRateSevere: ratio,
      expenseIncreaseConservative: z.number().min(0).max(5),
      expenseIncreaseSevere: z.number().min(0).max(5),
    })
    .partial()
    .optional(),
});

const prepaymentSchema = z.object({
  kind: z.enum(["none", "flat_pct", "step_down", "yield_maintenance", "defeasance", "lockout"]),
  flatPct: z.number().min(0).max(0.5).optional(),
  stepDownPctByYear: z.array(z.number().min(0).max(0.5)).max(30).optional(),
  lockoutMonths: z.number().int().min(0).max(600).optional(),
});

const cmbsTermsSchema = z.object({
  lockoutMonths: z.number().int().min(0).max(600),
  prepayment: prepaymentSchema,
  termMonths: z.number().int().min(1).max(600),
  expectedHoldMonths: z.number().int().min(1).max(600),
  requiresSpe: z.boolean(),
  requiresIndependentManager: z.boolean(),
  cashManagement: z.enum(["none", "springing", "hard"]),
  transferRestrictions: z.enum(["none", "consent_required", "prohibited"]),
  additionalDebtPermitted: z.boolean(),
  reserveRequirements: z.array(z.string().max(60)).max(20),
  tenantConcentrationPct: ratio.optional(),
  leaseRolloverPctDuringTerm: ratio.optional(),
  nonrecourseCarveouts: z.array(z.string().max(300)).max(40),
  assumable: z.boolean(),
});

const subordinateTermsSchema = z.object({
  instrument: z.enum(["mezzanine", "preferred_equity"]),
  amount: positiveMoney,
  rate,
  accrualKind: z.enum(["current_pay", "accrual", "hybrid"]),
  currentPayRate: rate.optional(),
  termMonths: z.number().int().min(1).max(600),
  originationFeePct: z.number().min(0).max(0.2).optional(),
  exitFeePct: z.number().min(0).max(0.2).optional(),
  upsideParticipationPct: ratio.optional(),
  uccEquityPledge: z.boolean().optional(),
  intercreditorCureRights: z.boolean().optional(),
  standstillMonths: z.number().int().min(0).max(120).optional(),
  canRemoveManager: z.boolean().optional(),
  canForceSale: z.boolean().optional(),
  forcedRedemptionMonths: z.number().int().min(0).max(600).optional(),
  consentRightsOver: z
    .array(z.enum(["sale", "refinance", "budget", "capex", "leasing", "distributions"]))
    .max(6),
});

const reviewableFindingSchema = z.object({
  id: z.string().max(64),
  scenarioRunId: z.string().max(64),
  findingCode: z.string().max(80),
  severity: z.enum(["critical", "high", "medium", "low", "info"]),
  title: z.string().max(300),
  confidence: ratio,
  materiality: ratio,
  requiredReviewer: z.enum(["advisor", "cpa", "attorney", "lender", "compliance", "insurance"]),
  advisorStatus: z.enum(["pending", "accepted", "rejected", "annotated", "escalated"]),
  advisorNote: z.string().max(2000).optional(),
});

/* ═══ Router ═══════════════════════════════════════════════════════════════ */

export const realEstateCapitalRouter = router({
  /** Reference data for building a deal in the UI. */
  defaults: protectedProcedure.query(() => ({
    standardWaterfall: STANDARD_WATERFALL.map((t: typeof STANDARD_WATERFALL[number]) => ({
      ...t,
      irrHurdle: Number.isFinite(t.irrHurdle) ? t.irrHurdle : 99,
    })),
    stressScenarios: DEFAULT_STRESS_SCENARIOS,
    monteCarloDefaults: {
      runs: 2000,
      rateVolBps: 150,
      capVolBps: 75,
      growthVol: 0.015,
      rateCapCorrelation: 0.6,
      rateGrowthCorrelation: 0.35,
      maxRuns: MAX_MC_RUNS,
    },
  })),

  /** Model the stack: sources and uses, schedules, exit, returns, waterfall. */
  analyze: protectedProcedure
    .input(capitalStackInputSchema)
    .mutation(({ input }) => {
      const normalized = normalizeInput(input);
      const result = analyzeCapitalStack(normalized);
      return {
        result,
        metrics: {
          goingInCapRate: goingInCapRate(normalized),
          debtConstant: debtConstant(normalized.debt),
          weightedAverageDebtCost: weightedAverageDebtCost(normalized.debt),
        },
      };
    }),

  /** Named scenarios only — fast, no simulation. */
  scenarios: protectedProcedure
    .input(
      z.object({
        stack: capitalStackInputSchema,
        scenarios: z.array(stressScenarioSchema).max(25).optional(),
      }),
    )
    .mutation(({ input }) =>
      runScenarios(normalizeInput(input.stack), input.scenarios ?? DEFAULT_STRESS_SCENARIOS),
    ),

  /** Solved break-even thresholds. */
  breakEvens: protectedProcedure
    .input(capitalStackInputSchema)
    .mutation(({ input }) => findBreakEvens(normalizeInput(input))),

  /** Correlated Monte Carlo distribution. */
  monteCarlo: protectedProcedure
    .input(
      z.object({
        stack: capitalStackInputSchema,
        config: monteCarloSchema.partial().optional(),
      }),
    )
    .mutation(({ input }) =>
      runMonteCarlo(normalizeInput(input.stack), input.config ?? {}),
    ),

  /** Full stress run: scenarios + break-evens + optional simulation. */
  stress: protectedProcedure
    .input(
      z.object({
        stack: capitalStackInputSchema,
        scenarios: z.array(stressScenarioSchema).max(25).optional(),
        monteCarlo: z.union([monteCarloSchema.partial(), z.literal(false)]).optional(),
      }),
    )
    .mutation(({ input }) =>
      runStressTest(normalizeInput(input.stack), {
        scenarios: input.scenarios,
        monteCarlo: input.monteCarlo,
      }),
    ),

  /** Deterministic diagnostics over a modelled stack. */
  findings: protectedProcedure
    .input(
      z.object({
        stack: capitalStackInputSchema,
        includeStress: z.boolean().default(true),
        monteCarloRuns: z.number().int().min(0).max(MAX_MC_RUNS).default(1000),
      }),
    )
    .mutation(({ input }) => {
      const normalized = normalizeInput(input.stack);
      const stack = analyzeCapitalStack(normalized);
      const stress = input.includeStress
        ? runStressTest(normalized, {
            monteCarlo: input.monteCarloRuns > 0 ? { runs: input.monteCarloRuns } : false,
          })
        : undefined;
      return generateFindings(normalized, stack, stress);
    }),

  /* ── RECIN: borrower-side capacity ──────────────────────────────────────
     Distinct from the syndication procedures above: these answer "how much
     can this client prudently borrow", not "how does this deal split". */

  /** Policy thresholds and default assumptions, for display in any report
   *  that relies on them. A finding is only defensible if its threshold is
   *  visible to the person reading it. */
  capacityDefaults: protectedProcedure.query(() => ({
    policy: DEFAULT_REAL_ESTATE_POLICY,
    assumptions: getDefaultScenarioAssumptions(),
  })),

  /** The §15 workflow: model every instrument against the same properties. */
  analyzeScenario: protectedProcedure
    .input(capacityScenarioSchema)
    .mutation(({ input }) =>
      analyzeRealEstateCapitalScenario(input as RealEstateCapitalScenarioInput),
    ),

  /** Ranked comparison — least fragile first, never "borrow the most" first. */
  compareStrategies: protectedProcedure
    .input(capacityScenarioSchema)
    .mutation(({ input }) => {
      const result = analyzeRealEstateCapitalScenario(
        input as RealEstateCapitalScenarioInput,
      );
      return { ranked: compareStrategies(result), result };
    }),

  /** Sale economics with cash and tax as separate, never-netted columns. */
  saleAnalysis: protectedProcedure
    .input(
      z.object({
        property: propertyInputSchema,
        assumptions: scenarioAssumptionsSchema,
        salePriceOverride: positiveMoney.optional(),
      }),
    )
    .mutation(({ input }) =>
      computeSaleAnalysis(
        input.property as RealEstateCapitalScenarioInput["properties"][number],
        input.assumptions,
        input.salePriceOverride,
      ),
    ),

  /* ── Sprint B: structured finance ───────────────────────────────────────── */

  /** Flexibility cost of a CMBS loan — what changing course actually costs. */
  cmbsFlexibility: protectedProcedure
    .input(cmbsTermsSchema)
    .mutation(({ input }) => ({
      flexibility: scoreCmbsFlexibility(input as CmbsTerms),
      carveouts: classifyCarveouts(input.nonrecourseCarveouts),
    })),

  /** Control ceded to subordinate capital, scored separately from its cost. */
  subordinateCapital: protectedProcedure
    .input(
      z.object({
        terms: subordinateTermsSchema,
        holdMonths: z.number().int().min(1).max(600),
        projectedProfit: positiveMoney.default(0),
      }),
    )
    .mutation(({ input }) => {
      const terms = input.terms as SubordinateCapitalTerms;
      return {
        control: scoreControlAsymmetry(terms),
        cost: allInSubordinateCost(terms, input.holdMonths, input.projectedProfit),
        taxFlags: subordinateTaxFlags(terms),
      };
    }),

  /** Mezzanine vs preferred, reported on both dimensions without a winner. */
  compareSubordinate: protectedProcedure
    .input(
      z.object({
        options: z.array(subordinateTermsSchema).min(1).max(6),
        holdMonths: z.number().int().min(1).max(600),
        projectedProfit: positiveMoney.default(0),
      }),
    )
    .mutation(({ input }) =>
      compareSubordinateCapital(
        input.options as SubordinateCapitalTerms[],
        input.holdMonths,
        input.projectedProfit,
      ),
    ),

  /* ── Sprint D: what is actually wired ───────────────────────────────────── */

  /** Which external channels could possibly be live, and which are hand-entered. */
  dataChannels: protectedProcedure.query(() => ({
    channels: channelStatus(),
    excludedPractices: EXCLUDED_PRACTICES,
  })),

  /* ── Sprint C: advisor review queue ─────────────────────────────────────── */

  reviewQueue: protectedProcedure
    .input(z.object({ findings: z.array(reviewableFindingSchema).max(500) }))
    .mutation(({ input }) => {
      const findings = input.findings as ReviewableFinding[];
      return {
        queue: prioritizeReviewQueue(findings),
        byReviewer: groupByReviewer(findings),
        releaseGate: clientReleaseGate(findings),
      };
    }),

  /**
   * One call for the whole underwrite — what the UI actually wants.
   * Simulation is opt-in so the interactive path stays instant.
   */
  underwrite: protectedProcedure
    .input(
      z.object({
        stack: capitalStackInputSchema,
        monteCarloRuns: z.number().int().min(0).max(MAX_MC_RUNS).default(0),
      }),
    )
    .mutation(({ input }) => {
      const normalized = normalizeInput(input.stack);
      const stack = analyzeCapitalStack(normalized);
      const stress = runStressTest(normalized, {
        monteCarlo: input.monteCarloRuns > 0 ? { runs: input.monteCarloRuns } : false,
      });
      const findings = generateFindings(normalized, stack, stress);
      return {
        stack,
        stress,
        findings,
        metrics: {
          goingInCapRate: goingInCapRate(normalized),
          debtConstant: debtConstant(normalized.debt),
          weightedAverageDebtCost: weightedAverageDebtCost(normalized.debt),
        },
      };
    }),
});

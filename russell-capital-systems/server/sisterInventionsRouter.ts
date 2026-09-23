/**
 * Sister Inventions tRPC Router
 * Connects all 27 proprietary shared engines to server-side procedures.
 * Each procedure validates input via Zod, calls the shared engine, and returns typed results.
 */
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";

// ─── SI-001: IUL Compliance Engine ──────────────────────────────────────────
import { generateCompliantIllustration } from "@shared/iulComplianceEngine";
// ─── SI-002: Multi-Carrier IUL Optimizer ────────────────────────────────────
import { compareCarriers, getDefaultCarriers } from "@shared/multiCarrierIULOptimizer";
// ─── SI-003: Policy Replacement Analyzer ────────────────────────────────────
import { analyzeReplacement } from "@shared/policyReplacementAnalyzer";
// ─── SI-004: Premium Financing Arbitrage ────────────────────────────────────
import { calculateArbitrage, getDefaultArbitrageScenarios } from "@shared/premiumFinancingArbitrage";
// ─── SI-005: Living Benefits Probability ────────────────────────────────────
import { calculateLivingBenefits } from "@shared/livingBenefitsProbabilityEngine";
// ─── SI-006: Tax Code Change Simulator ──────────────────────────────────────
import { simulateTaxChanges, getBuiltInScenarios } from "@shared/taxCodeChangeSimulator";
// ─── SI-007: Behavioral Bias Detection ──────────────────────────────────────
import { detectBiases } from "@shared/behavioralBiasEngine";
// ─── SI-008: CRT Wealth Replacement ─────────────────────────────────────────
import { calculateCRTStrategy } from "@shared/crtWealthReplacementEngine";
// ─── SI-009: Social Security Bridge ─────────────────────────────────────────
import { calculateSSBridge } from "@shared/socialSecurityBridgeEngine";
// ─── SI-010: State Tax Migration ────────────────────────────────────────────
import { calculateMigration, getAllStates, getNoIncomeTaxStates } from "@shared/stateTaxMigrationEngine";
// ─── SI-011: Captive Insurance + IUL ────────────────────────────────────────
import { calculateCaptiveStrategy } from "@shared/captiveInsuranceEngine";
// ─── SI-012: Divorce Financial Impact ───────────────────────────────────────
import { modelDivorceImpact } from "@shared/divorceFinancialEngine";
// ─── SI-013: Disability Gap Analysis ────────────────────────────────────────
import { analyzeDisabilityGap } from "@shared/disabilityGapEngine";
// ─── SI-015: Generational Wealth Transfer ───────────────────────────────────
import { simulateGenerationalWealth } from "@shared/generationalWealthEngine";
// ─── SI-016: Carrier Strength Monitor ───────────────────────────────────────
import { monitorCarriers, getDefaultCarrierProfiles } from "@shared/carrierStrengthMonitorEngine";
// ─── SI-017: Succession Valuation ───────────────────────────────────────────
import { valuatePractice } from "@shared/successionValuationEngine";
// ─── SI-018: Commission Optimizer ───────────────────────────────────────────
import { optimizeCommissions } from "@shared/commissionOptimizerEngine";
// ─── SI-019: Peer Benchmarking ──────────────────────────────────────────────
import { calculateBenchmarks } from "@shared/peerBenchmarkingEngine";
// ─── SI-020: CE Credit Tracker ──────────────────────────────────────────────
import { trackCECredits } from "@shared/ceCreditTrackerEngine";
// ─── SI-022: Client Retention ───────────────────────────────────────────────
import { predictChurn } from "@shared/clientRetentionEngine";
// ─── SI-023: Prospect Qualification ─────────────────────────────────────────
import { qualifyProspects } from "@shared/prospectQualificationEngine";
// ─── SI-025: Annuity Fee Detection ──────────────────────────────────────────
import { analyzeAnnuity } from "@shared/annuityFeeDetectionEngine";
// ─── SI-027: Retirement Gap ─────────────────────────────────────────────────
import { calculateRetirementGap } from "@shared/retirementGapEngine";
// ─── SI-028: Physician Loan Refinancing Optimizer (PLRO) ────────────────────
import { optimizePhysicianLoanRefi } from "@shared/physicianLoanRefiEngine";
// ─── SI-029: IUL Policy Loan Optimization (IPLOE) ───────────────────────────
import { optimizeIULLoans } from "@shared/iulLoanOptimizationEngine";
// ─── SI-030: Hybrid Annuity + IUL Income Floor (IAIUL) ──────────────────────
import { buildHybridIncomeFloor } from "@shared/hybridIncomeFloorEngine";
// ─── SI-031: Disability Insurance Gap Analyzer (DIGA) ───────────────────────
import { analyzeDisabilityGapAdvanced, OCCUPATION_CATEGORIES } from "@shared/disabilityGapAnalyzerEngine";
// ─── SI-032: Multi-Generational Wealth Transfer (MGWTSE) ────────────────────
import { simulateMultiGenerationalTransfer } from "@shared/multiGenTransferEngine";
// ─── SI-033: Practice Acquisition Due Diligence (PADDA) ─────────────────────
import { evaluatePracticeAcquisition } from "@shared/practiceAcquisitionEngine";
// ─── SI-034: 1031 Exchange Chain Optimization (1031COE) ─────────────────────
import { optimizeExchangeChain } from "@shared/exchangeChainEngine";
// ─── SI-035: Key Person Insurance Valuation (KPIVE) ─────────────────────────
import { valuateKeyPersonCoverage } from "@shared/keyPersonValuationEngine";

export const sisterInventionsRouter = router({
  // ─── SI-001 ───────────────────────────────────────────────────────────────
  iulCompliance: protectedProcedure
    .input(z.object({
      state: z.string(),
      carrierName: z.string(),
      productName: z.string(),
      currentAge: z.number(),
      gender: z.enum(["male", "female"]),
      healthClass: z.string(),
      annualPremium: z.number(),
      deathBenefit: z.number(),
      illustratedRate: z.number(),
      currentBenchmarkRate: z.number(),
      indexStrategy: z.string(),
      capRate: z.number(),
      floorRate: z.number(),
      participationRate: z.number(),
    }))
    .mutation(({ input }) => generateCompliantIllustration(input as any)),

  // ─── SI-002 ───────────────────────────────────────────────────────────────
  multiCarrierCompare: protectedProcedure
    .input(z.object({
      clientAge: z.number(),
      gender: z.enum(["male", "female"]),
      healthClass: z.string(),
      annualPremium: z.number(),
      deathBenefitTarget: z.number(),
      projectionYears: z.number(),
      riskTolerance: z.enum(["conservative", "moderate", "aggressive"]),
    }))
    .mutation(({ input }) => compareCarriers(input as any)),

  getDefaultCarriers: protectedProcedure.query(() => getDefaultCarriers()),

  // ─── SI-003 ───────────────────────────────────────────────────────────────
  policyReplacement: protectedProcedure
    .input(z.object({
      existing: z.object({
        carrierName: z.string(),
        productType: z.string(),
        issueDate: z.string(),
        annualPremium: z.number(),
        deathBenefit: z.number(),
        currentCashValue: z.number(),
        surrenderCharge: z.number(),
        loanBalance: z.number(),
        currentCOI: z.number(),
      }),
      replacement: z.object({
        carrierName: z.string(),
        productType: z.string(),
        annualPremium: z.number(),
        deathBenefit: z.number(),
        projectedCashValue10yr: z.number(),
        projectedCashValue20yr: z.number(),
        capRate: z.number(),
        floorRate: z.number(),
        participationRate: z.number(),
      }),
    }))
    .mutation(({ input }) => analyzeReplacement(input.existing as any, input.replacement as any)),

  // ─── SI-004 ───────────────────────────────────────────────────────────────
  premiumFinancingArbitrage: protectedProcedure
    .input(z.object({
      clientAge: z.number(),
      healthClass: z.string(),
      deathBenefit: z.number(),
      annualPremium: z.number(),
      loanRate: z.number(),
      iulCapRate: z.number(),
      iulFloor: z.number(),
      iulParticipationRate: z.number(),
      collateralPercent: z.number(),
      termYears: z.number(),
    }))
    .mutation(({ input }) => calculateArbitrage(input as any)),

  getArbitrageScenarios: protectedProcedure.query(() => getDefaultArbitrageScenarios()),

  // ─── SI-005 ───────────────────────────────────────────────────────────────
  livingBenefits: protectedProcedure
    .input(z.object({
      currentAge: z.number(),
      gender: z.enum(["male", "female"]),
      healthClass: z.string(),
      smoker: z.boolean(),
      familyHistory: z.object({
        cancer: z.boolean(),
        heart: z.boolean(),
        stroke: z.boolean(),
        diabetes: z.boolean(),
      }),
      bmi: z.number(),
      deathBenefit: z.number(),
      chronicIllnessRider: z.boolean(),
      criticalIllnessRider: z.boolean(),
      terminalIllnessRider: z.boolean(),
    }))
    .mutation(({ input }) => calculateLivingBenefits(input as any)),

  // ─── SI-006 ───────────────────────────────────────────────────────────────
  taxCodeSimulator: protectedProcedure
    .input(z.object({
      scenarioIndex: z.number(),
      profile: z.object({
        filingStatus: z.string(),
        w2Income: z.number(),
        passThrough: z.number(),
        capitalGains: z.number(),
        qualifiedDividends: z.number(),
        state: z.string(),
        age: z.number(),
      }),
    }))
    .mutation(({ input }) => {
      const scenarios = getBuiltInScenarios();
      const scenario = scenarios[input.scenarioIndex] || scenarios[0];
      return simulateTaxChanges(scenario as any, input.profile as any);
    }),

  getTaxScenarios: protectedProcedure.query(() => getBuiltInScenarios()),

  // ─── SI-007 ───────────────────────────────────────────────────────────────
  behavioralBias: protectedProcedure
    .input(z.object({
      clientAge: z.number(),
      riskToleranceStated: z.string(),
      currentAllocation: z.object({
        stocks: z.number(),
        bonds: z.number(),
        cash: z.number(),
      }),
      recentTrades: z.array(z.object({
        action: z.string(),
        amount: z.number(),
        reason: z.string(),
        date: z.string(),
      })),
      anchors: z.array(z.object({
        metric: z.string(),
        value: z.number(),
        currentValue: z.number(),
      })),
      holdingPeriods: z.array(z.object({
        asset: z.string(),
        boughtAt: z.number(),
        currentPrice: z.number(),
        holdingMonths: z.number(),
      })),
    }))
    .mutation(({ input }) => detectBiases(input as any)),

  // ─── SI-008 ───────────────────────────────────────────────────────────────
  crtWealthReplacement: protectedProcedure
    .input(z.object({
      assetValue: z.number(),
      assetBasis: z.number(),
      assetType: z.string(),
      crtType: z.string(),
      payoutRate: z.number(),
      trustTermYears: z.number(),
      taxBracket: z.number(),
      stateRate: z.number(),
      capitalGainsRate: z.number(),
      iulPremium: z.number(),
      iulCapRate: z.number(),
      iulFloor: z.number(),
      clientAge: z.number(),
    }))
    .mutation(({ input }) => calculateCRTStrategy(input as any)),

  // ─── SI-009 ───────────────────────────────────────────────────────────────
  socialSecurityBridge: protectedProcedure
    .input(z.object({
      currentAge: z.number(),
      ssAt62: z.number(),
      ssAt67: z.number(),
      ssAt70: z.number(),
      spouseAge: z.number().optional(),
      spouseSsAt62: z.number().optional(),
      spouseSsAt67: z.number().optional(),
      spouseSsAt70: z.number().optional(),
      iulCashValue: z.number(),
      iulDistributionRate: z.number(),
      monthlyExpenses: z.number(),
      otherIncome: z.number(),
      lifeExpectancy: z.number(),
    }))
    .mutation(({ input }) => calculateSSBridge(input as any)),

  // ─── SI-010 ───────────────────────────────────────────────────────────────
  stateTaxMigration: protectedProcedure
    .input(z.object({
      currentState: z.string(),
      targetState: z.string(),
      w2Income: z.number(),
      passThrough: z.number(),
      capitalGains: z.number(),
      dividends: z.number(),
      propertyValue: z.number(),
      retirementIncome: z.number(),
    }))
    .mutation(({ input }) => calculateMigration(input as any)),

  getAllStates: protectedProcedure.query(() => getAllStates()),
  getNoIncomeTaxStates: protectedProcedure.query(() => getNoIncomeTaxStates()),

  // ─── SI-011 ───────────────────────────────────────────────────────────────
  captiveInsurance: protectedProcedure
    .input(z.object({
      businessRevenue: z.number(),
      businessType: z.string(),
      ownerAge: z.number(),
      taxBracket: z.number(),
      stateRate: z.number(),
      captivePremium: z.number(),
      investmentReturnRate: z.number(),
      iulPremium: z.number(),
      iulCapRate: z.number(),
      iulFloor: z.number(),
      projectionYears: z.number(),
    }))
    .mutation(({ input }) => calculateCaptiveStrategy(input as any)),

  // ─── SI-012 ───────────────────────────────────────────────────────────────
  divorceImpact: protectedProcedure
    .input(z.object({
      totalMaritalAssets: z.number(),
      totalDebts: z.number(),
      annualIncomeSpouse1: z.number(),
      annualIncomeSpouse2: z.number(),
      childrenCount: z.number(),
      childrenAges: z.array(z.number()),
      state: z.string(),
      yearsMarried: z.number(),
      policies: z.array(z.object({
        type: z.string(),
        owner: z.string(),
        deathBenefit: z.number(),
        cashValue: z.number(),
        annualPremium: z.number(),
      })),
      retirementAccounts: z.array(z.object({
        type: z.string(),
        owner: z.string(),
        balance: z.number(),
      })),
    }))
    .mutation(({ input }) => modelDivorceImpact(input as any)),

  // ─── SI-013 ───────────────────────────────────────────────────────────────
  disabilityGap: protectedProcedure
    .input(z.object({
      occupation: z.string(),
      specialty: z.string().optional(),
      annualIncome: z.number(),
      monthlyExpenses: z.number(),
      existingGroupDI: z.object({
        monthlyBenefit: z.number(),
        eliminationPeriod: z.number(),
        benefitPeriod: z.number(),
        ownOccupation: z.boolean(),
      }).optional(),
      age: z.number(),
      state: z.string(),
    }))
    .mutation(({ input }) => analyzeDisabilityGap(input as any)),

  // ─── SI-015 ───────────────────────────────────────────────────────────────
  generationalWealth: protectedProcedure
    .input(z.object({
      initialWealth: z.number(),
      generations: z.number(),
      inflationRate: z.number(),
      investmentReturn: z.number(),
      estateTaxExemption: z.number(),
      estateTaxRate: z.number(),
      gstTaxRate: z.number(),
      familyTree: z.array(z.object({
        generation: z.number(),
        members: z.number(),
        spendingRate: z.number(),
      })),
      strategies: z.array(z.string()),
    }))
    .mutation(({ input }) => {
      const gen1 = input.familyTree[0] || { generation: 1, members: 2, spendingRate: 0.04 };
      const gen2 = input.familyTree[1] || { generation: 2, members: 4, spendingRate: 0.05 };
      const gen3 = input.familyTree[2] || { generation: 3, members: 8, spendingRate: 0.06 };
      return simulateGenerationalWealth(
        { ...gen1, initialWealth: input.initialWealth, investmentReturn: input.investmentReturn, inflationRate: input.inflationRate, estateTaxRate: input.estateTaxRate } as any,
        { ...gen2, initialWealth: 0, investmentReturn: input.investmentReturn, inflationRate: input.inflationRate, estateTaxRate: input.estateTaxRate } as any,
        { ...gen3, initialWealth: 0, investmentReturn: input.investmentReturn, inflationRate: input.inflationRate, estateTaxRate: input.estateTaxRate } as any,
        50,
        input.strategies.includes('dynasty_trust')
      );
    }),

  // ─── SI-016 ───────────────────────────────────────────────────────────────
  carrierStrength: protectedProcedure
    .input(z.object({
      carrierNames: z.array(z.string()).optional(),
    }))
    .query(({ input }) => {
      const all = getDefaultCarrierProfiles();
      const selected = input.carrierNames?.length
        ? all.filter(c => input.carrierNames!.includes(c.name))
        : all;
      return monitorCarriers(selected as any);
    }),

  getDefaultCarrierProfiles: protectedProcedure.query(() => getDefaultCarrierProfiles()),

  // ─── SI-017 ───────────────────────────────────────────────────────────────
  successionValuation: protectedProcedure
    .input(z.object({
      annualRevenue: z.number(),
      recurringRevenuePercent: z.number(),
      aum: z.number(),
      clientCount: z.number(),
      avgClientAge: z.number(),
      growthRate: z.number(),
      profitMargin: z.number(),
      yearsInBusiness: z.number(),
      ownerAge: z.number(),
      staffCount: z.number(),
      hasSuccessor: z.boolean(),
    }))
    .mutation(({ input }) => valuatePractice(input as any)),

  // ─── SI-018 ───────────────────────────────────────────────────────────────
  commissionOptimizer: protectedProcedure
    .input(z.object({
      client: z.object({
        clientAge: z.number(),
        clientHealth: z.string(),
        annualPremium: z.number(),
        productNeed: z.string(),
        suitabilityScore: z.number(),
      }),
      products: z.array(z.object({
        carrierName: z.string(),
        productName: z.string(),
        commissionRate: z.number(),
        persistencyBonus: z.number(),
        trailRate: z.number(),
        suitabilityFit: z.number(),
      })),
    }))
    .mutation(({ input }) => optimizeCommissions(input.products as any, input.client as any)),

  // ─── SI-019 ───────────────────────────────────────────────────────────────
  peerBenchmarking: protectedProcedure
    .input(z.object({
      aum: z.number(),
      clientCount: z.number(),
      annualRevenue: z.number(),
      revenuePerClient: z.number(),
      closeRate: z.number(),
      retentionRate: z.number(),
      yearsExperience: z.number(),
      productMix: z.object({
        iul: z.number(),
        annuity: z.number(),
        term: z.number(),
        whole: z.number(),
        other: z.number(),
      }),
    }))
    .mutation(({ input }) => calculateBenchmarks(input as any)),

  // ─── SI-020 ───────────────────────────────────────────────────────────────
  ceCredits: protectedProcedure
    .input(z.object({
      licenses: z.array(z.object({
        state: z.string(),
        licenseType: z.string(),
        totalRequired: z.number(),
        ethicsRequired: z.number(),
        completedGeneral: z.number(),
        completedEthics: z.number(),
        renewalDate: z.string(),
      })),
    }))
    .mutation(({ input }) => trackCECredits(input.licenses as any)),

  // ─── SI-022 ───────────────────────────────────────────────────────────────
  clientRetention: protectedProcedure
    .input(z.object({
      clients: z.array(z.object({
        clientId: z.string(),
        yearsAsClient: z.number(),
        aum: z.number(),
        meetingsPerYear: z.number(),
        emailResponseRate: z.number(),
        portfolioReturn: z.number(),
        benchmarkReturn: z.number(),
        lifeEvents: z.array(z.string()),
        lastContactDays: z.number(),
        nps: z.number(),
      })),
    }))
    .mutation(({ input }) => predictChurn(input.clients as any)),

  // ─── SI-023 ───────────────────────────────────────────────────────────────
  prospectQualification: protectedProcedure
    .input(z.object({
      prospects: z.array(z.object({
        name: z.string(),
        age: z.number(),
        income: z.number(),
        netWorth: z.number(),
        occupation: z.string(),
        hasLifeInsurance: z.boolean(),
        hasDisability: z.boolean(),
        familySize: z.number(),
        referralSource: z.string(),
      })),
    }))
    .mutation(({ input }) => qualifyProspects(input.prospects as any)),

  // ─── SI-025 ───────────────────────────────────────────────────────────────
  annuityFeeDetection: protectedProcedure
    .input(z.object({
      carrierName: z.string(),
      productName: z.string(),
      contractValue: z.number(),
      purchaseDate: z.string(),
      annuitizationDate: z.string(),
      mortalityExpenseRate: z.number(),
      adminFeeAnnual: z.number(),
      fundExpenseRatios: z.array(z.number()),
      surrenderSchedule: z.array(z.number()),
      riders: z.array(z.object({
        name: z.string(),
        annualCostPercent: z.number(),
        benefitBase: z.number(),
      })),
    }))
    .mutation(({ input }) => analyzeAnnuity(input as any)),

  // ─── SI-027 ───────────────────────────────────────────────────────────────
  retirementGap: protectedProcedure
    .input(z.object({
      currentAge: z.number(),
      retirementAge: z.number(),
      lifeExpectancy: z.number(),
      currentIncome: z.number(),
      desiredReplacementRate: z.number(),
      inflationRate: z.number(),
      socialSecurityMonthly: z.number(),
      pensionMonthly: z.number(),
      currentSavings: z.number(),
      annualContribution: z.number(),
      expectedReturn: z.number(),
      iulCashValue: z.number(),
      iulDistributionRate: z.number(),
    }))
    .mutation(({ input }) => calculateRetirementGap(input as any)),

  // ─── Dashboard Metadata ───────────────────────────────────────────────────
  getInventionsList: protectedProcedure.query(() => {
    return [
      { id: "SI-001", name: "IUL Compliance Engine", route: "/portal/iul-compliance-engine", category: "Compliance", status: "active", patentScore: 85 },
      { id: "SI-002", name: "Multi-Carrier IUL Optimizer", route: "/portal/multi-carrier-iul-optimizer", category: "Product Analysis", status: "active", patentScore: 88 },
      { id: "SI-003", name: "Policy Replacement Analyzer", route: "/portal/policy-replacement-analyzer", category: "Product Analysis", status: "active", patentScore: 82 },
      { id: "SI-004", name: "Premium Financing Arbitrage", route: "/portal/premium-financing-arbitrage", category: "Advanced Strategy", status: "active", patentScore: 78 },
      { id: "SI-005", name: "Living Benefits Probability", route: "/portal/living-benefits-probability", category: "Risk Analysis", status: "active", patentScore: 80 },
      { id: "SI-006", name: "Tax Code Change Simulator", route: "/portal/tax-code-change-simulator", category: "Tax Strategy", status: "active", patentScore: 72 },
      { id: "SI-007", name: "Behavioral Bias Detector", route: "/portal/behavioral-bias-detector", category: "Client Intelligence", status: "active", patentScore: 75 },
      { id: "SI-008", name: "CRT Wealth Replacement", route: "/portal/crt-wealth-replacement", category: "Estate Planning", status: "active", patentScore: 83 },
      { id: "SI-009", name: "Social Security Bridge", route: "/portal/social-security-bridge", category: "Retirement", status: "active", patentScore: 86 },
      { id: "SI-010", name: "State Tax Migration Planner", route: "/portal/state-tax-migration", category: "Tax Strategy", status: "active", patentScore: 74 },
      { id: "SI-011", name: "Captive Insurance + IUL", route: "/portal/captive-insurance-iul", category: "Advanced Strategy", status: "active", patentScore: 80 },
      { id: "SI-012", name: "Divorce Financial Impact", route: "/portal/divorce-financial-impact", category: "Life Events", status: "active", patentScore: 77 },
      { id: "SI-013", name: "Disability Gap Analysis", route: "/portal/disability-gap-analysis", category: "Risk Analysis", status: "active", patentScore: 75 },
      { id: "SI-014", name: "Family Tree Financial Map", route: "/portal/family-tree-financial", category: "Estate Planning", status: "active", patentScore: 72 },
      { id: "SI-015", name: "Generational Wealth Sim", route: "/portal/generational-wealth-sim", category: "Estate Planning", status: "active", patentScore: 68 },
      { id: "SI-016", name: "Carrier Strength Monitor", route: "/portal/carrier-strength-monitor", category: "Product Analysis", status: "active", patentScore: 76 },
      { id: "SI-017", name: "Succession Valuation", route: "/portal/succession-valuation", category: "Practice Management", status: "active", patentScore: 79 },
      { id: "SI-018", name: "Commission Optimizer", route: "/portal/commission-optimizer", category: "Practice Management", status: "active", patentScore: 75 },
      { id: "SI-019", name: "Peer Benchmarking Intel", route: "/portal/peer-benchmarking-intel", category: "Practice Management", status: "active", patentScore: 79 },
      { id: "SI-020", name: "CE Credit Tracker", route: "/portal/ce-credit-tracker", category: "Compliance", status: "active", patentScore: 80 },
      { id: "SI-021", name: "Compliance Doc Generator", route: "/portal/compliance-doc-generator", category: "Compliance", status: "active", patentScore: 77 },
      { id: "SI-022", name: "Client Retention Predictor", route: "/portal/client-retention-predictor", category: "Client Intelligence", status: "active", patentScore: 74 },
      { id: "SI-023", name: "Prospect Qualification", route: "/portal/prospect-qualification", category: "Client Intelligence", status: "active", patentScore: 76 },
      { id: "SI-024", name: "Multi-Currency Wealth", route: "/portal/multi-currency-wealth", category: "Advanced Strategy", status: "active", patentScore: 72 },
      { id: "SI-025", name: "Annuity Hidden Fee Detector", route: "/portal/annuity-hidden-fee", category: "Product Analysis", status: "active", patentScore: 70 },
      { id: "SI-026", name: "Client Onboarding Workflow", route: "/portal/client-onboarding-workflow", category: "Practice Management", status: "active", patentScore: 70 },
      { id: "SI-027", name: "Retirement Gap Analyzer", route: "/portal/retirement-gap-inflation", category: "Retirement", status: "active", patentScore: 70 },
      { id: "SI-028", name: "Physician Loan Refi Optimizer (PLRO)", route: "/portal/physician-loan-refi", category: "Tax Strategy", status: "active", patentScore: 99 },
      { id: "SI-029", name: "IUL Policy Loan Optimizer (IPLOE)", route: "/portal/iul-loan-optimizer", category: "Product Analysis", status: "active", patentScore: 99 },
      { id: "SI-030", name: "Hybrid Income Floor (IAIUL)", route: "/portal/hybrid-income-floor", category: "Retirement", status: "active", patentScore: 99 },
      { id: "SI-031", name: "Disability Gap Analyzer (DIGA)", route: "/portal/disability-gap-analyzer", category: "Risk Analysis", status: "active", patentScore: 99 },
      { id: "SI-032", name: "Multi-Gen Wealth Transfer (MGWTSE)", route: "/portal/multi-gen-transfer", category: "Estate Planning", status: "active", patentScore: 99 },
      { id: "SI-033", name: "Practice Acquisition Diligence (PADDA)", route: "/portal/practice-acquisition", category: "Practice Management", status: "active", patentScore: 99 },
      { id: "SI-034", name: "1031 Exchange Chain Optimizer (1031COE)", route: "/portal/exchange-chain", category: "Tax Strategy", status: "active", patentScore: 99 },
      { id: "SI-035", name: "Key Person Valuation (KPIVE)", route: "/portal/key-person-valuation", category: "Practice Management", status: "active", patentScore: 99 },
    ];
  }),

  // ─── SI-028: Physician Loan Refinancing Optimizer (PLRO) ───────────────────
  physicianLoanRefi: protectedProcedure
    .input(z.object({
      loanBalance: z.number().min(0),
      currentRate: z.number().min(0).max(0.5),
      annualIncome: z.number().min(0),
      incomeGrowthRate: z.number().min(-0.5).max(0.5),
      marginalTaxRate: z.number().min(0).max(0.7),
      householdSize: z.number().min(1).max(15),
      paymentsAlreadyMade: z.number().min(0).max(120),
      inQualifyingEmployment: z.boolean(),
      employmentContinuityProbability: z.number().min(0).max(1),
      programContinuationProbability: z.number().min(0).max(1),
      certificationComplianceProbability: z.number().min(0).max(1),
      refinanceRate: z.number().min(0).max(0.5),
      refinanceTermYears: z.number().min(1).max(30),
      iulCashValue: z.number().min(0),
      iulCreditingRate: z.number().min(0).max(0.2),
      discountRate: z.number().min(0).max(0.3),
    }))
    .mutation(({ input }) => optimizePhysicianLoanRefi(input)),

  // ─── SI-029: IUL Policy Loan Optimization (IPLOE) ──────────────────────────
  iulLoanOptimizer: protectedProcedure
    .input(z.object({
      policies: z.array(z.object({
        id: z.string(),
        label: z.string(),
        carrier: z.string(),
        cashValue: z.number().min(0),
        deathBenefit: z.number().min(0),
        creditingRate: z.number().min(0).max(0.3),
        loanRate: z.number().min(0).max(0.3),
        loanType: z.enum(["fixed", "variable", "wash"]),
        hasWashProvision: z.boolean(),
        washAvailableAtYear: z.number().min(0).max(50).optional(),
        policyYear: z.number().min(0).max(100),
        maxLoanToValue: z.number().min(0).max(1),
        existingLoanBalance: z.number().min(0),
        annualPremium: z.number().min(0),
      })).min(1),
      currentAge: z.number().min(18).max(100),
      retirementAge: z.number().min(40).max(100),
      annualIncomeNeeded: z.number().min(0),
      projectionYears: z.number().min(1).max(60),
      marginalTaxRate: z.number().min(0).max(0.7),
      rateCycleAmplitude: z.number().min(0).max(0.2),
      rateCycleYears: z.number().min(1).max(30),
    }))
    .mutation(({ input }) => optimizeIULLoans(input)),

  // ─── SI-030: Hybrid Annuity + IUL Income Floor (IAIUL) ─────────────────────
  hybridIncomeFloor: protectedProcedure
    .input(z.object({
      currentAge: z.number().min(18).max(100),
      retirementAge: z.number().min(40).max(100),
      lifeExpectancyAge: z.number().min(50).max(120),
      totalAssets: z.number().positive(),
      essentialExpenses: z.number().min(0),
      discretionaryExpenses: z.number().min(0),
      legacyTarget: z.number().min(0),
      annuityPayoutRate: z.number().min(0).max(0.2),
      annuityRollupRate: z.number().min(0).max(0.2),
      annuityRiderFee: z.number().min(0).max(0.1),
      annuityExclusionRatio: z.number().min(0).max(1),
      iulCreditingRate: z.number().min(0).max(0.3),
      iulCap: z.number().min(0).max(0.5),
      iulFloor: z.number().min(0).max(0.1),
      iulPolicyCharges: z.number().min(0).max(0.1),
      qualifiedBalance: z.number().min(0),
      marginalTaxRate: z.number().min(0).max(0.7),
      inflationRate: z.number().min(0).max(0.2),
    }))
    .mutation(({ input }) => buildHybridIncomeFloor(input)),

  // ─── SI-031: Disability Insurance Gap Analyzer (DIGA) ──────────────────────
  /** Reference list for the occupation selector — 25 categories with risk class. */
  digaOccupations: protectedProcedure.query(() =>
    OCCUPATION_CATEGORIES.map(o => ({ key: o.key, label: o.label, occupationClass: o.occupationClass })),
  ),

  disabilityGapAdvanced: protectedProcedure
    .input(z.object({
      annualIncome: z.number().positive(),
      age: z.number().min(18).max(75),
      occupationKey: z.string(),
      healthStatus: z.enum(["excellent", "good", "fair", "poor"]),
      marginalTaxRate: z.number().min(0).max(0.7),
      monthlyExpenses: z.number().min(0),
      retirementAge: z.number().min(40).max(80),
      groupPolicy: z.object({
        replacementPercent: z.number().min(0).max(1),
        monthlyCap: z.number().min(0),
        definition: z.enum(["own_occupation", "modified_own_occupation", "any_occupation"]),
        eliminationPeriodDays: z.number().min(0),
        benefitPeriodMonths: z.number().min(0),
        employerPaid: z.boolean(),
      }).optional(),
      individualPolicy: z.object({
        monthlyBenefit: z.number().min(0),
        definition: z.enum(["own_occupation", "modified_own_occupation", "any_occupation"]),
        eliminationPeriodDays: z.number().min(0),
        benefitPeriodMonths: z.number().min(0),
        afterTaxPremium: z.boolean(),
        annualPremium: z.number().min(0),
      }).optional(),
      iulRider: z.object({
        maxAcceleratedBenefit: z.number().min(0),
        monthlyBenefit: z.number().min(0),
        benefitPeriodMonths: z.number().min(0),
        eliminationPeriodDays: z.number().min(0),
      }).optional(),
    }))
    .mutation(({ input }) => analyzeDisabilityGapAdvanced(input)),

  // ─── SI-032: Multi-Generational Wealth Transfer (MGWTSE) ───────────────────
  multiGenTransfer: protectedProcedure
    .input(z.object({
      familyName: z.string(),
      netWorth: z.number().positive(),
      trusts: z.array(z.object({
        id: z.string(),
        label: z.string(),
        fundingAmount: z.number().min(0),
        trusteeType: z.enum(["individual_family", "corporate", "directed_with_advisor", "private_family_trust_company"]),
        distributionPolicy: z.enum(["income_only", "haircut_principal", "ascertainable_standard", "full_discretion"]),
        grossReturn: z.number().min(-0.5).max(0.5),
        gstEligible: z.boolean(),
        generationSpan: z.number().min(1).max(10),
      })).min(1),
      gstExemptionAvailable: z.number().min(0),
      exemptionHolders: z.number().min(1).max(2),
      generationLength: z.number().min(15).max(40),
      horizonYears: z.number().min(10).max(150),
      inflationRate: z.number().min(0).max(0.2),
      annualFamilySpending: z.number().min(0),
      successionScenarios: z.array(z.object({
        label: z.string(),
        atGeneration: z.number().min(1),
        successorType: z.enum(["individual_family", "corporate", "directed_with_advisor", "private_family_trust_company"]),
      })).optional(),
    }))
    .mutation(({ input }) => simulateMultiGenerationalTransfer(input)),

  // ─── SI-033: Practice Acquisition Due Diligence (PADDA) ────────────────────
  practiceAcquisition: protectedProcedure
    .input(z.object({
      practice: z.object({
        name: z.string(),
        clients: z.array(z.object({
          id: z.string(),
          age: z.number().min(0).max(120),
          annualRevenue: z.number().min(0),
          tenureYears: z.number().min(0),
          products: z.array(z.string()),
          persistency: z.number().min(0).max(1),
          referralsLast12Months: z.number().min(0),
          satisfactionScore: z.number().min(0).max(100),
        })).min(1),
        annualRevenue: z.number().positive(),
        trailRevenuePercent: z.number().min(0).max(1),
        yearsInOperation: z.number().min(0),
        principalAge: z.number().min(18).max(100),
        principalRetained: z.boolean(),
        principalTransitionMonths: z.number().min(0),
        russellNumber: z.number().min(0).max(100),
        askingPrice: z.number().min(0),
      }),
      acquirer: z.object({
        technologyPlatform: z.string(),
        targetTechnologyPlatform: z.string(),
        serviceModel: z.enum(["high_touch", "hybrid", "digital_first"]),
        targetServiceModel: z.enum(["high_touch", "hybrid", "digital_first"]),
        compensationStructure: z.enum(["salary", "commission", "hybrid"]),
        targetCompensationStructure: z.enum(["salary", "commission", "hybrid"]),
        geographicOverlap: z.number().min(0).max(1),
        integrationExperience: z.number().min(0).max(1),
      }),
      discountRate: z.number().min(0).max(0.5).default(0.12),
    }))
    .mutation(({ input }) => evaluatePracticeAcquisition(input.practice, input.acquirer, input.discountRate)),

  // ─── SI-034: 1031 Exchange Chain Optimization (1031COE) ────────────────────
  exchangeChain: protectedProcedure
    .input(z.object({
      properties: z.array(z.object({
        id: z.string(),
        label: z.string(),
        type: z.enum(["residential", "commercial"]),
        marketValue: z.number().min(0),
        purchasePrice: z.number().min(0),
        landAllocationPercent: z.number().min(0).max(1),
        yearsHeld: z.number().min(0),
        appreciationRate: z.number().min(-0.5).max(0.5),
        mortgageBalance: z.number().min(0),
        capitalImprovements: z.number().min(0).optional(),
      })).min(1),
      capitalGainsRate: z.number().min(0).max(0.6),
      stateRate: z.number().min(0).max(0.2),
      subjectToNIIT: z.boolean(),
      horizonYears: z.number().min(1).max(60),
      currentAge: z.number().min(18).max(110),
      lifeExpectancyAge: z.number().min(19).max(120),
    }))
    .mutation(({ input }) => optimizeExchangeChain(input)),

  // ─── SI-035: Key Person Insurance Valuation (KPIVE) ────────────────────────
  keyPersonValuation: protectedProcedure
    .input(z.object({
      name: z.string(),
      physicians: z.array(z.object({
        id: z.string(),
        name: z.string(),
        directBillings: z.number().min(0),
        patientPanelSize: z.number().min(0),
        procedureMix: z.enum(["primary_care", "mixed", "procedural", "surgical"]),
        payerMix: z.object({
          commercial: z.number().min(0).max(1),
          medicare: z.number().min(0).max(1),
          medicaid: z.number().min(0).max(1),
          selfPay: z.number().min(0).max(1),
        }),
        referralsGeneratedPerYear: z.number().min(0),
        avgRevenuePerReferral: z.number().min(0),
        ancillaryRevenue: z.number().min(0),
        tenureYears: z.number().min(0),
        ownershipPercent: z.number().min(0).max(1),
        age: z.number().min(18).max(100),
      })).min(1),
      totalCollections: z.number().min(0),
      annualFixedOverhead: z.number().min(0),
      ebitdaMultiple: z.number().min(0).max(20),
      annualEbitda: z.number().min(0),
      specialty: z.string(),
      recruitmentDifficulty: z.number().min(0).max(1),
    }))
    .mutation(({ input }) => valuateKeyPersonCoverage(input)),
});

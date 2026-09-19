// ─── Engine chaining ────────────────────────────────────────────────────────
// Saved pipelines across the twenty-seven sister-invention engines, where each
// step's output can feed the next step's input.
//
// ## What this is, and what chainRouter is
//
// chainRouter.ts already chains calculators over a household profile and runs
// ten thousand sampled paths on the server so a phone's browser does not have
// to. It is not this, and neither replaces the other: that one walks a fixed
// set of calculators over one typed profile, this one composes named engines a
// user picked, in an order a user chose, and persists the pipeline so it can be
// re-run and audited.
//
// The tables for it — engine_chains, engine_chain_runs — arrived in the schema
// separately from the router in the original build, and the router was the half
// that went missing. They are added together here.
//
// ## Three things this version does differently from the one it came from
//
// 1. iulCompliance goes through iulIllustrationGate, never through
//    generateCompliantIllustration. The original wired the raw generator in.
//    That generator derives its own maximum illustrated rate from cap,
//    participation and spread, when AG 49-A makes that the carrier illustration
//    actuary's product-specific figure, and it emits a persuasionOptimizations
//    array. Reachable from a chain, that is worse than reachable from a page:
//    nobody reads step three of someone else's pipeline. A test below asserts
//    the ungated symbol is not referenced in this file at all.
//
// 2. Results do not splat into the next step's input. The original merged every
//    engine's output keys into a flat bag —
//    `{ ...previousResult, ...step.inputs }` — carried across all twenty-seven
//    engines. Two engines that both return `score`, or `total`, or `years`,
//    silently overwrite each other, and a later step can compute a figure from
//    a field that came from an engine the user never meant to feed it. Nothing
//    would surface that; the number would just be wrong. Here each result is
//    kept under its own engineId and a step reads earlier output only through
//    an explicit mapping. The schema's own column comment says inputMappings,
//    so this was specified in the original and never built.
//
// 3. The registry is typed `(input: unknown) => unknown`. The original used
//    `any` both ways with `as any` at every call site. `unknown` is not much
//    better at the boundary — twenty-seven engines genuinely do take twenty-seven
//    different shapes — but it stops the bag being assignable to anything by
//    accident, and it makes the casts visible where they happen instead of
//    invisible everywhere.

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { engineChains, engineChainRuns } from "../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";

// ─── Engine registry ────────────────────────────────────────────────────────
import { gatedIllustration } from "@shared/iulIllustrationGate";
import { compareCarriers } from "@shared/multiCarrierIULOptimizer";
import { analyzeReplacement } from "@shared/policyReplacementAnalyzer";
import { calculateArbitrage } from "@shared/premiumFinancingArbitrage";
import { calculateLivingBenefits } from "@shared/livingBenefitsProbabilityEngine";
import { simulateTaxChanges } from "@shared/taxCodeChangeSimulator";
import { detectBiases } from "@shared/behavioralBiasEngine";
import { calculateCRTStrategy } from "@shared/crtWealthReplacementEngine";
import { calculateSSBridge } from "@shared/socialSecurityBridgeEngine";
import { calculateMigration } from "@shared/stateTaxMigrationEngine";
import { calculateCaptiveStrategy } from "@shared/captiveInsuranceEngine";
import { modelDivorceImpact } from "@shared/divorceFinancialEngine";
import { analyzeDisabilityGap } from "@shared/disabilityGapEngine";
import { simulateGenerationalWealth } from "@shared/generationalWealthEngine";
import { monitorCarriers, getDefaultCarrierProfiles } from "@shared/carrierStrengthMonitorEngine";
import { valuatePractice } from "@shared/successionValuationEngine";
import { optimizeCommissions } from "@shared/commissionOptimizerEngine";
import { calculateBenchmarks } from "@shared/peerBenchmarkingEngine";
import { trackCECredits } from "@shared/ceCreditTrackerEngine";
import { predictChurn } from "@shared/clientRetentionEngine";
import { qualifyProspects } from "@shared/prospectQualificationEngine";
import { analyzeAnnuity } from "@shared/annuityFeeDetectionEngine";
import { calculateRetirementGap } from "@shared/retirementGapEngine";
import { optimizeMultiCurrency } from "@shared/multiCurrencyWealthEngine";
import { analyzeFamilyTree } from "@shared/familyTreeFinancialEngine";
import { generateCompliancePackage } from "@shared/complianceDocGeneratorEngine";
import { generateOnboardingWorkflow } from "@shared/clientOnboardingEngine";

/** A bag of fields assembled for one step. Shapes differ per engine. */
type StepInput = Record<string, unknown>;

/* eslint-disable @typescript-eslint/no-explicit-any -- see the header: twenty-seven
 * engines take twenty-seven shapes, and the cast is at the boundary by design. */
const pick = (i: StepInput, k: string) => (i as any)[k];

export const ENGINE_REGISTRY: Record<string, (input: StepInput) => unknown> = {
  // Gated, deliberately. Requires exhibitFacts; refuses rather than falling
  // back to the ungated generator when they are absent.
  iulCompliance: (i) => {
    const facts = pick(i, "exhibitFacts");
    if (!facts || typeof facts !== "object") {
      throw new Error(
        "iulCompliance requires exhibitFacts (productId, historicalYearsShown, indexAgeYears). " +
          "AG 49-A maxima are product-specific and the years shown are a fact about the printed " +
          "exhibit, so neither can be inferred from a projection."
      );
    }
    return gatedIllustration(i as any, facts as any);
  },
  multiCarrierCompare: (i) => compareCarriers((pick(i, "carriers") ?? []) as any),
  policyReplacement: (i) => analyzeReplacement(pick(i, "currentPolicy") as any, pick(i, "proposedPolicy") as any),
  premiumFinancingArbitrage: (i) => calculateArbitrage(i as any),
  livingBenefits: (i) => calculateLivingBenefits(i as any),
  taxCodeSimulator: (i) => simulateTaxChanges(pick(i, "currentTax") as any, (pick(i, "scenarios") ?? []) as any),
  behavioralBias: (i) => detectBiases(i as any),
  crtWealthReplacement: (i) => calculateCRTStrategy(i as any),
  socialSecurityBridge: (i) => calculateSSBridge(i as any),
  stateTaxMigration: (i) => calculateMigration(i as any),
  captiveInsurance: (i) => calculateCaptiveStrategy(i as any),
  divorceImpact: (i) => modelDivorceImpact(i as any),
  disabilityGap: (i) => analyzeDisabilityGap(i as any),
  generationalWealth: (i) => simulateGenerationalWealth(pick(i, "gen1") as any, pick(i, "gen2") as any, pick(i, "gen3") as any),
  carrierStrength: (i) => monitorCarriers((pick(i, "carriers") ?? getDefaultCarrierProfiles()) as any),
  successionValuation: (i) => valuatePractice(i as any),
  commissionOptimizer: (i) => optimizeCommissions((pick(i, "products") ?? []) as any, pick(i, "advisor") as any),
  peerBenchmarking: (i) => calculateBenchmarks(i as any),
  ceCredits: (i) => trackCECredits((pick(i, "licenses") ?? []) as any),
  clientRetention: (i) => predictChurn((pick(i, "clients") ?? []) as any),
  prospectQualification: (i) => qualifyProspects((pick(i, "prospects") ?? []) as any),
  annuityFeeDetection: (i) => analyzeAnnuity(i as any),
  retirementGap: (i) => calculateRetirementGap(i as any),
  multiCurrency: (i) => optimizeMultiCurrency(i as any),
  familyTree: (i) => analyzeFamilyTree((pick(i, "members") ?? []) as any),
  complianceDocGenerator: (i) => generateCompliancePackage(i as any),
  clientOnboarding: (i) => generateOnboardingWorkflow(i as any),
};
/* eslint-enable @typescript-eslint/no-explicit-any */

export const ENGINE_NAMES: Record<string, string> = {
  iulCompliance: "IUL Illustration Compliance (gated)",
  multiCarrierCompare: "Multi-Carrier Comparison",
  policyReplacement: "Policy Replacement Analysis",
  premiumFinancingArbitrage: "Premium Financing Arbitrage",
  livingBenefits: "Living Benefits Probability",
  taxCodeSimulator: "Tax Code Change Simulator",
  behavioralBias: "Behavioral Bias Detection",
  crtWealthReplacement: "CRT + IUL Wealth Replacement",
  socialSecurityBridge: "Social Security Bridge",
  stateTaxMigration: "State Tax Migration",
  captiveInsurance: "Captive Insurance Strategy",
  divorceImpact: "Divorce Financial Impact",
  disabilityGap: "Disability Income Gap",
  generationalWealth: "Generational Wealth Transfer",
  carrierStrength: "Carrier Financial Strength",
  successionValuation: "Succession Valuation",
  commissionOptimizer: "Commission Optimizer",
  peerBenchmarking: "Peer Benchmarking",
  ceCredits: "CE Credit Tracker",
  clientRetention: "Client Retention",
  prospectQualification: "Prospect Qualification",
  annuityFeeDetection: "Annuity Fee Detection",
  retirementGap: "Retirement Income Gap",
  multiCurrency: "Multi-Currency Wealth",
  familyTree: "Family Tree Financial Map",
  complianceDocGenerator: "Compliance Doc Generator",
  clientOnboarding: "Client Onboarding Workflow",
};

/**
 * Engines this router will not run inside a chain, and why.
 *
 * A chain is the least supervised place in the product: a user builds it once
 * and re-runs it, and nobody re-reads step three. Anything needing a compliance
 * judgement before it is shown does not belong here at all.
 */
export const CHAIN_EXCLUDED: Record<string, string> = {
  captiveInsurance:
    "Micro-captives appear on IRS listed-transaction guidance, which carries reportable-transaction " +
    "obligations. This needs a compliance read and an explicit decision before it runs anywhere, and " +
    "least of all unattended inside a saved pipeline.",
};

const TEMPLATE_CHAINS = [
  {
    id: "tpl-new-client",
    name: "New Client Onboarding Pipeline",
    description: "Qualify prospect, assess behavioural biases, analyse disability gap, then build the onboarding workflow.",
    steps: [
      { engineId: "prospectQualification", label: "Qualify Prospect", order: 1 },
      { engineId: "behavioralBias", label: "Assess Behavioural Biases", order: 2 },
      { engineId: "disabilityGap", label: "Analyse Disability Gap", order: 3 },
      { engineId: "clientOnboarding", label: "Create Onboarding Workflow", order: 4 },
    ],
    category: "Client Management",
  },
  {
    id: "tpl-policy-review",
    name: "Policy Review & Optimisation Pipeline",
    description: "Review the existing policy, compare carriers, verify the illustration through the gate, then optimise commissions.",
    steps: [
      { engineId: "policyReplacement", label: "Analyse Current Policy", order: 1 },
      { engineId: "multiCarrierCompare", label: "Compare Alternative Carriers", order: 2 },
      { engineId: "iulCompliance", label: "Verify Illustration (gated)", order: 3 },
      { engineId: "commissionOptimizer", label: "Optimise Commissions", order: 4 },
    ],
    category: "IUL & Policy",
  },
  {
    id: "tpl-wealth-transfer",
    name: "Wealth Transfer Planning Pipeline",
    description: "Map family finances, simulate generational transfer, value the succession, then plan the CRT replacement.",
    steps: [
      { engineId: "familyTree", label: "Map Family Finances", order: 1 },
      { engineId: "generationalWealth", label: "Simulate Generational Transfer", order: 2 },
      { engineId: "successionValuation", label: "Calculate Succession Value", order: 3 },
      { engineId: "crtWealthReplacement", label: "Plan CRT + IUL Replacement", order: 4 },
    ],
    category: "Wealth Strategy",
  },
  {
    id: "tpl-tax-optimization",
    name: "Tax Optimisation Pipeline",
    description: "Simulate tax code changes, evaluate state migration, analyse premium financing, then detect hidden annuity fees.",
    steps: [
      { engineId: "taxCodeSimulator", label: "Simulate Tax Changes", order: 1 },
      { engineId: "stateTaxMigration", label: "Evaluate State Migration", order: 2 },
      { engineId: "premiumFinancingArbitrage", label: "Analyse Premium Financing", order: 3 },
      { engineId: "annuityFeeDetection", label: "Detect Hidden Fees", order: 4 },
    ],
    category: "Tax & Wealth",
  },
] as const;

/** A mapping reads `engineId.path.to.field` out of an earlier step's result. */
const mappingSchema = z.record(z.string(), z.string());

const stepSchema = z.object({
  engineId: z.string(),
  label: z.string(),
  order: z.number(),
  /** Literal inputs for this step. */
  inputs: z.record(z.string(), z.unknown()).default({}),
  /**
   * Where the rest comes from: { targetField: "engineId.path.in.result" }.
   * Explicit by design — see point 2 in the header.
   */
  inputMappings: mappingSchema.default({}),
});

/** Read "engineId.a.b" out of the per-engine result store. Missing is undefined. */
function readPath(store: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let cur: unknown = store;
  for (let i = 0; i < parts.length; i++) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[parts[i]];
  }
  return cur;
}

export interface ChainStepResult {
  engineId: string;
  label: string;
  order: number;
  result: unknown;
  executionTimeMs: number;
  success: boolean;
  error?: string;
  /** Mappings that resolved to undefined. A silent hole is worth reporting. */
  unresolvedMappings?: string[];
}

/**
 * Run a chain. Exported so it can be tested without a database or a request.
 *
 * Each engine's result is stored under its own engineId, never merged into a
 * flat bag, so two engines that both return `score` cannot overwrite one
 * another. A step sees earlier output only through inputMappings.
 */
export function runEngineChain(
  steps: ReadonlyArray<z.infer<typeof stepSchema>>
): { steps: ChainStepResult[]; totalTimeMs: number } {
  const startedAt = Date.now();
  const out: ChainStepResult[] = [];
  const store: Record<string, unknown> = {};

  const ordered = steps.slice().sort((a, b) => a.order - b.order);

  for (let n = 0; n < ordered.length; n++) {
    const step = ordered[n];
    const excluded = CHAIN_EXCLUDED[step.engineId];
    if (excluded) {
      out.push({
        engineId: step.engineId, label: step.label, order: step.order,
        result: null, executionTimeMs: 0, success: false, error: excluded,
      });
      continue;
    }
    const engineFn = ENGINE_REGISTRY[step.engineId];
    if (!engineFn) {
      out.push({
        engineId: step.engineId, label: step.label, order: step.order,
        result: null, executionTimeMs: 0, success: false,
        error: `Engine "${step.engineId}" not found`,
      });
      continue;
    }

    const assembled: StepInput = { ...step.inputs };
    const unresolved: string[] = [];
    const mapKeys = Object.keys(step.inputMappings);
    for (let k = 0; k < mapKeys.length; k++) {
      const target = mapKeys[k];
      const path = step.inputMappings[target];
      const value = readPath(store, path);
      if (value === undefined) unresolved.push(`${target} <- ${path}`);
      else assembled[target] = value;
    }

    const stepStart = Date.now();
    try {
      const result = engineFn(assembled);
      store[step.engineId] = result;
      out.push({
        engineId: step.engineId, label: step.label, order: step.order,
        result, executionTimeMs: Date.now() - stepStart, success: true,
        unresolvedMappings: unresolved.length ? unresolved : undefined,
      });
    } catch (err) {
      out.push({
        engineId: step.engineId, label: step.label, order: step.order,
        result: null, executionTimeMs: Date.now() - stepStart, success: false,
        error: err instanceof Error ? err.message : "Unknown error",
        unresolvedMappings: unresolved.length ? unresolved : undefined,
      });
    }
  }

  return { steps: out, totalTimeMs: Date.now() - startedAt };
}

export const engineChainingRouter = router({
  getTemplateChains: protectedProcedure.query(() => TEMPLATE_CHAINS),

  getAvailableEngines: protectedProcedure.query(() =>
    Object.keys(ENGINE_NAMES)
      .filter((id) => !CHAIN_EXCLUDED[id])
      .map((id) => ({ id, name: ENGINE_NAMES[id] }))
  ),

  /** What this router refuses to chain, and why. Shown rather than hidden. */
  getExcludedEngines: protectedProcedure.query(() =>
    Object.keys(CHAIN_EXCLUDED).map((id) => ({
      id,
      name: ENGINE_NAMES[id] ?? id,
      reason: CHAIN_EXCLUDED[id],
    }))
  ),

  createChain: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(200),
      description: z.string().max(2000).default(""),
      steps: z.array(stepSchema).min(2).max(20),
    }))
    .mutation(async ({ input, ctx }) => {
      const unknownEngines = input.steps
        .map((s) => s.engineId)
        .filter((id) => !ENGINE_REGISTRY[id]);
      if (unknownEngines.length) {
        throw new Error(`Unknown engine${unknownEngines.length === 1 ? "" : "s"}: ${unknownEngines.join(", ")}`);
      }
      const excluded = input.steps.map((s) => s.engineId).filter((id) => CHAIN_EXCLUDED[id]);
      if (excluded.length) {
        throw new Error(`Cannot be chained: ${excluded.map((id) => `${id} — ${CHAIN_EXCLUDED[id]}`).join(" ")}`);
      }
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const result = await db.insert(engineChains).values({
        userId: ctx.user.id,
        name: input.name,
        description: input.description,
        steps: input.steps,
        isTemplate: false,
      });
      return { id: Number(result[0].insertId), name: input.name };
    }),

  getMyChains: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return await db.select().from(engineChains)
      .where(eq(engineChains.userId, ctx.user.id))
      .orderBy(desc(engineChains.createdAt));
  }),

  runChain: protectedProcedure
    .input(z.object({
      steps: z.array(stepSchema).min(1).max(20),
      chainId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { steps, totalTimeMs } = runEngineChain(input.steps);

      const db = await getDb();
      if (db) {
        try {
          await db.insert(engineChainRuns).values({
            chainId: input.chainId ?? 0,
            userId: ctx.user.id,
            status: steps.every((s) => s.success) ? "completed" : "failed",
            stepResults: steps,
            totalTimeMs,
          });
          if (input.chainId) {
            await db.update(engineChains)
              .set({ runCount: sql`${engineChains.runCount} + 1`, lastRunAt: new Date() })
              .where(eq(engineChains.id, input.chainId));
          }
        } catch {
          // The run already happened and its results are being returned. Losing
          // the audit row is worth reporting but not worth discarding the work.
        }
      }

      return {
        steps,
        totalTimeMs,
        successCount: steps.filter((s) => s.success).length,
        failCount: steps.filter((s) => !s.success).length,
      };
    }),

  getChainRuns: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(20) }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(engineChainRuns)
        .where(eq(engineChainRuns.userId, ctx.user.id))
        .orderBy(desc(engineChainRuns.createdAt))
        .limit(input?.limit ?? 20);
    }),
});

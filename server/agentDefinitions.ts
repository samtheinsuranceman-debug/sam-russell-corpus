/**
 * Agent Definitions
 *
 * The roster of specialist agents the orchestrator can run over a shared
 * working memory. Definitions are DATA, not behaviour: an agent is a system
 * prompt, a declared set of memory kinds it reads and writes, an output
 * schema, and a set of guardrails. The orchestrator owns execution.
 *
 * ── The grounding rule ──────────────────────────────────────────────────────
 * This platform makes financial statements to advisors and their clients, so
 * every agent here is constrained to reason ONLY over the deterministic
 * engine output placed in working memory. Numbers are computed by the engines
 * in shared/ and cited by the agents; they are never produced by the model.
 * `citesOnly: true` makes that contractual — the orchestrator verifies that
 * every figure an agent emits traces back to a memory item, and flags the ones
 * that do not. A model that invents a DSCR is worse than useless here.
 */
import type { OutputSchema } from "./_core/llm";

export type AgentId =
  // The blueprint's 12-perspective deliberation roster (§6)
  | "household_balance_sheet"
  | "underwriter"
  | "capital_markets"
  | "exit_refinance"
  | "tax_entity"
  | "insurance_liquidity"
  | "retirement_cashflow"
  | "estate_succession"
  | "macro_stress"
  | "behavioral_complexity"
  | "compliance_reviewer"
  | "contrarian_correlation"
  // Additional perspectives retained alongside the 12
  | "risk_officer"
  | "investor_narrative";

/** Kinds of item that can live in working memory. */
export type MemoryKind =
  | "deal_input" // the raw CapitalStackInput
  | "stack_result" // CapitalStackResult
  | "stress_result" // StressResult
  | "findings" // FindingsReport
  | "client_profile" // who this is for
  | "liquidity_profile" // household reserves, broken out by commitment
  | "capacity_result" // RealEstateCapitalScenarioResult
  | "structured_finance" // CMBS flexibility / control asymmetry
  | "underwriting_opinion"
  | "risk_assessment"
  | "financing_alternatives"
  | "investor_summary"
  | "compliance_review"
  | "balance_sheet_assessment"
  | "exit_assessment"
  | "tax_boundary_assessment"
  | "insurance_liquidity_assessment"
  | "retirement_assessment"
  | "estate_assessment"
  | "macro_assessment"
  | "behavioral_assessment"
  | "correlation_assessment";

export interface AgentDefinition {
  id: AgentId;
  name: string;
  role: string;
  /** One line used for routing and for explaining the roster to a user. */
  purpose: string;
  systemPrompt: string;
  /** Memory kinds this agent needs. Missing required kinds block the run. */
  requires: MemoryKind[];
  /**
   * At least ONE of these must be present.
   *
   * Exists because several agents are engine-agnostic: an underwriter can form
   * a view from either a sponsor-side stack result or a borrower-side capacity
   * result, and demanding a specific one would wrongly block it in half the
   * pipelines it legitimately belongs to.
   */
  requiresOneOf?: MemoryKind[];
  /** Kinds it may read if present, but can work without. */
  optional: MemoryKind[];
  /** The single kind it writes back. */
  produces: MemoryKind;
  outputSchema: OutputSchema;
  maxTokens: number;
  /** Lower runs first. Agents that consume another's output sort after it. */
  order: number;
  /** Enforced by the orchestrator, not merely requested in the prompt. */
  citesOnly: boolean;
  guardrails: string[];
}

/* ═══ Shared prompt scaffolding ════════════════════════════════════════════ */

const GROUNDING_CLAUSE = `
You are reasoning over a deterministic financial model. Every number you state
must come from the WORKING MEMORY provided to you. Do not calculate new figures,
do not estimate, and do not recall market data from memory. If the answer to a
question is not in working memory, say that it is not available and name the
input that would be needed. Reference findings by their code (for example
NEGATIVE_LEVERAGE) so a reader can trace your reasoning to the model.
`.trim();

const NO_ADVICE_CLAUSE = `
You are writing for a licensed financial professional, not for a consumer. Do
not issue a recommendation to buy or sell a security, and do not characterise
any projection as guaranteed. Projections are model output under stated
assumptions.
`.trim();

/* ═══ Output schemas ═══════════════════════════════════════════════════════ */

const underwritingSchema: OutputSchema = {
  name: "underwriting_opinion",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["verdict", "rationale", "keyStrengths", "keyConcerns", "citedFindingCodes"],
    properties: {
      verdict: {
        type: "string",
        enum: ["proceed", "proceed_with_conditions", "restructure", "decline"],
      },
      rationale: { type: "string" },
      keyStrengths: { type: "array", items: { type: "string" } },
      keyConcerns: { type: "array", items: { type: "string" } },
      conditions: { type: "array", items: { type: "string" } },
      citedFindingCodes: { type: "array", items: { type: "string" } },
    },
  },
};

const riskSchema: OutputSchema = {
  name: "risk_assessment",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["bindingConstraint", "challenges", "overlookedRisks", "citedFindingCodes"],
    properties: {
      bindingConstraint: { type: "string" },
      challenges: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["assumption", "why", "testThatWouldSettleIt"],
          properties: {
            assumption: { type: "string" },
            why: { type: "string" },
            testThatWouldSettleIt: { type: "string" },
          },
        },
      },
      overlookedRisks: { type: "array", items: { type: "string" } },
      citedFindingCodes: { type: "array", items: { type: "string" } },
    },
  },
};

const financingSchema: OutputSchema = {
  name: "financing_alternatives",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["alternatives", "citedFindingCodes"],
    properties: {
      alternatives: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["label", "change", "expectedEffect", "tradeoff"],
          properties: {
            label: { type: "string" },
            change: { type: "string" },
            expectedEffect: { type: "string" },
            tradeoff: { type: "string" },
          },
        },
      },
      citedFindingCodes: { type: "array", items: { type: "string" } },
    },
  },
};

const narrativeSchema: OutputSchema = {
  name: "investor_summary",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["headline", "summary", "whatCouldGoWrong", "questionsToAsk"],
    properties: {
      headline: { type: "string" },
      summary: { type: "string" },
      whatCouldGoWrong: { type: "array", items: { type: "string" } },
      questionsToAsk: { type: "array", items: { type: "string" } },
    },
  },
};

const complianceSchema: OutputSchema = {
  name: "compliance_review",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["approved", "issues", "requiredDisclosures"],
    properties: {
      approved: { type: "boolean" },
      issues: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["quote", "problem", "suggestedRewrite"],
          properties: {
            quote: { type: "string" },
            problem: { type: "string" },
            suggestedRewrite: { type: "string" },
          },
        },
      },
      requiredDisclosures: { type: "array", items: { type: "string" } },
    },
  },
};

/**
 * Most of the twelve perspectives answer the same SHAPE of question — "what,
 * in my domain, is wrong here and how sure am I" — so they share one schema.
 * Eight bespoke schemas saying the same thing would be eight places to drift.
 */
function perspectiveSchema(name: string): OutputSchema {
  return {
    name,
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["headline", "findings", "citedFindingCodes"],
      properties: {
        headline: { type: "string" },
        findings: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["claim", "severity", "why", "confidence", "recommendedAction"],
            properties: {
              claim: { type: "string" },
              severity: {
                type: "string",
                enum: ["critical", "high", "medium", "low", "info"],
              },
              why: { type: "string" },
              confidence: { type: "number" },
              recommendedAction: { type: "string" },
              requiredReviewer: {
                type: "string",
                enum: ["advisor", "cpa", "attorney", "lender", "compliance", "insurance"],
              },
            },
          },
        },
        /** Contradictions are preserved, not averaged away (blueprint §6.2.5). */
        disagreementsWithOtherAgents: { type: "array", items: { type: "string" } },
        citedFindingCodes: { type: "array", items: { type: "string" } },
      },
    },
  };
}

/** Builds one of the shared-shape perspectives. */
function perspective(cfg: {
  id: AgentId;
  name: string;
  role: string;
  purpose: string;
  brief: string;
  requires: MemoryKind[];
  requiresOneOf?: MemoryKind[];
  optional: MemoryKind[];
  produces: MemoryKind;
  order: number;
  guardrails: string[];
  citesOnly?: boolean;
}): AgentDefinition {
  return {
    id: cfg.id,
    name: cfg.name,
    role: cfg.role,
    purpose: cfg.purpose,
    systemPrompt: `You are the ${cfg.name} on a real estate capital review panel.

${GROUNDING_CLAUSE}

${cfg.brief}

Report only what your domain actually shows. If another agent's conclusion
contradicts yours, say so in disagreementsWithOtherAgents rather than softening
your own — a panel that converges by deferring is worth less than one agent.
If your domain has nothing material to report, say that plainly and return an
empty findings list.

${NO_ADVICE_CLAUSE}`,
    requires: cfg.requires,
    requiresOneOf: cfg.requiresOneOf,
    optional: cfg.optional,
    produces: cfg.produces,
    outputSchema: perspectiveSchema(cfg.produces),
    maxTokens: 1400,
    order: cfg.order,
    citesOnly: cfg.citesOnly ?? true,
    guardrails: [
      "Never state a figure absent from working memory.",
      "Never describe a projection as guaranteed.",
      ...cfg.guardrails,
    ],
  };
}

/* ═══ The roster ═══════════════════════════════════════════════════════════ */

export const AGENT_DEFINITIONS: Record<AgentId, AgentDefinition> = {
  underwriter: {
    id: "underwriter",
    name: "Underwriter",
    role: "Real estate credit underwriting",
    purpose:
      "Forms a reasoned verdict on whether the deal should proceed as structured.",
    systemPrompt: `You are a senior real estate underwriter reviewing a modelled capital stack.

${GROUNDING_CLAUSE}

Weigh the deal on coverage, leverage, structure, and the realism of its
assumptions — in that order. A deal that clears its hurdles only through exit
cap compression is a market bet, and you should name it as one. State your
verdict plainly and make the conditions specific enough to act on.

${NO_ADVICE_CLAUSE}`,
    requires: ["findings"],
    requiresOneOf: ["stack_result", "capacity_result"],
    optional: ["stress_result", "deal_input"],
    produces: "underwriting_opinion",
    outputSchema: underwritingSchema,
    maxTokens: 1600,
    order: 10,
    citesOnly: true,
    guardrails: [
      "Never state a figure absent from working memory.",
      "Never describe a projection as guaranteed.",
      "A base-case covenant breach forbids a 'proceed' verdict.",
    ],
  },

  risk_officer: {
    id: "risk_officer",
    name: "Risk Officer",
    role: "Adversarial review",
    purpose:
      "Attacks the underwriting: finds the assumption the deal actually rests on.",
    systemPrompt: `You are a risk officer whose job is to find what breaks this deal.

${GROUNDING_CLAUSE}

You are deliberately adversarial. Identify the single binding constraint — the
assumption that, if wrong, costs the most — and say why. Challenge the inputs
themselves, not only the outputs: NOI growth and exit cap assumptions drive
more of the result than the capital structure does. Use the break-even
thresholds in memory; they are the sharpest evidence available to you.

Do not soften findings to be agreeable. An underwriter who is wrong and
unchallenged is the expensive failure mode here.

${NO_ADVICE_CLAUSE}`,
    requires: ["stack_result", "stress_result", "findings"],
    optional: ["underwriting_opinion", "deal_input"],
    produces: "risk_assessment",
    outputSchema: riskSchema,
    maxTokens: 1600,
    order: 20,
    citesOnly: true,
    guardrails: [
      "Never state a figure absent from working memory.",
      "Must name exactly one binding constraint.",
      "Never suppress a critical finding to agree with the underwriter.",
    ],
  },

  capital_markets: {
    id: "capital_markets",
    name: "Capital Markets",
    role: "Debt and equity structuring",
    purpose:
      "Proposes concrete structural alternatives that address the findings.",
    systemPrompt: `You are a capital markets specialist structuring the financing.

${GROUNDING_CLAUSE}

Propose specific, testable structural changes — proceeds, interest-only term,
amortization, a preferred slice in place of the top of the debt stack, rate
protection. For each, state the expected effect and the trade-off honestly;
every one of them costs something. Frame each alternative so it can be re-run
through the model rather than argued about.

${NO_ADVICE_CLAUSE}`,
    requires: ["findings"],
    requiresOneOf: ["stack_result", "capacity_result"],
    optional: ["stress_result", "risk_assessment"],
    produces: "financing_alternatives",
    outputSchema: financingSchema,
    maxTokens: 1600,
    order: 30,
    citesOnly: true,
    guardrails: [
      "Never state a figure absent from working memory.",
      "Every alternative must state its trade-off.",
      "Never quote a rate or term as currently available in the market.",
    ],
  },

  investor_narrative: {
    id: "investor_narrative",
    name: "Investor Narrative",
    role: "Plain-language explanation",
    purpose:
      "Translates the analysis into language an investor can actually follow.",
    systemPrompt: `You translate a technical underwriting into plain language.

${GROUNDING_CLAUSE}

Write for an intelligent reader who does not know what a debt yield is. Explain
in ordinary words, define a term the first time you use it, and keep the
downside as prominent as the upside — a summary that buries the risk is a
failure, not a style choice. Short sentences. No salesmanship.

${NO_ADVICE_CLAUSE}`,
    requires: ["stack_result", "findings"],
    optional: ["underwriting_opinion", "risk_assessment", "client_profile"],
    produces: "investor_summary",
    outputSchema: narrativeSchema,
    maxTokens: 1400,
    order: 40,
    citesOnly: true,
    guardrails: [
      "Never state a figure absent from working memory.",
      "Downside must be given comparable weight to upside.",
      "No promotional language; no 'guaranteed', 'safe', or 'risk-free'.",
    ],
  },

  compliance_reviewer: {
    id: "compliance_reviewer",
    name: "Compliance Reviewer",
    role: "Suitability and disclosure review",
    purpose:
      "Reviews generated client-facing language for compliance problems.",
    systemPrompt: `You review client-facing financial language for compliance problems.

${GROUNDING_CLAUSE}

Flag: performance presented as guaranteed or assured; projections stated as
fact; omitted material risk; comparative claims without basis; anything that
reads as a recommendation of a specific security to a specific person. Quote
the exact offending text, explain the problem, and supply a compliant rewrite
that preserves the author's meaning.

Approve only when you would sign your name to the document.`,
    requires: [],
    // It reviews whatever prose the pipeline actually produced: a client
    // summary where one exists, otherwise the underwriting opinion.
    requiresOneOf: ["investor_summary", "underwriting_opinion"],
    optional: ["findings", "risk_assessment"],
    produces: "compliance_review",
    outputSchema: complianceSchema,
    maxTokens: 1400,
    order: 50,
    citesOnly: false, // it reviews prose rather than restating figures
    guardrails: [
      "Quote offending text verbatim.",
      "Every issue must carry a suggested rewrite.",
      "Do not approve a summary that omits a critical finding.",
    ],
  },

  /* ── The remaining blueprint perspectives ──────────────────────────────── */

  household_balance_sheet: perspective({
    id: "household_balance_sheet",
    name: "Household Balance Sheet Agent",
    role: "Total liquidity, debt and concentration",
    purpose: "Establishes what the household can actually absorb before anything else is judged.",
    brief: `Your question: what is the total liquidity, debt load, asset concentration and
survival runway? You run FIRST because every other perspective is conditional on
the answer. Pay particular attention to reserves counted more than once — a
balance serving four purposes is one balance, not four.`,
    requires: ["capacity_result"],
    optional: ["liquidity_profile", "deal_input", "findings"],
    produces: "balance_sheet_assessment",
    order: 5,
    guardrails: ["Never count an earmarked reserve toward more than one purpose."],
  }),

  exit_refinance: perspective({
    id: "exit_refinance",
    name: "Exit and Refinance Analyst",
    role: "Repayment path",
    purpose: "Tests whether the debt can actually be repaid by sale or refinance.",
    brief: `Your question: under CONSERVATIVE assumptions, can this be repaid at maturity?
Test the take-out on its own terms — its LTV, its DSCR, its debt yield, its
seasoning — not on the assumption that today's market persists. A plan that is
solvent only because it assumes a future refinance has an untested assumption at
its centre, and naming that is your job.`,
    requires: ["capacity_result"],
    optional: ["stress_result", "findings", "structured_finance"],
    produces: "exit_assessment",
    order: 15,
    guardrails: [
      "Never treat a refinance as available without stating the assumptions it requires.",
      "An untested exit is a finding, not an omission.",
    ],
  }),

  tax_entity: perspective({
    id: "tax_entity",
    name: "Tax and Entity Boundary Agent",
    role: "What must be verified, and what may never be claimed",
    purpose: "Marks the boundary between modelled assumption and tax conclusion.",
    brief: `Your question: which tax treatments here are ASSUMPTIONS requiring CPA
confirmation, and which statements would be impermissible to make at all?

Three things are always true and you must enforce them: interest is a deduction
and never a credit; deductibility follows the USE of proceeds rather than the
collateral; and debt payoff does NOT reduce taxable gain. Flag any language that
blurs these. You identify what needs verification — you never supply the
verification yourself.`,
    requires: ["capacity_result"],
    optional: ["deal_input", "findings"],
    produces: "tax_boundary_assessment",
    order: 25,
    guardrails: [
      "Never state that anything is deductible, tax-free, or tax-advantaged.",
      "Every tax observation must be marked as requiring CPA review.",
      "Never model debt payoff as reducing taxable gain.",
    ],
  }),

  insurance_liquidity: perspective({
    id: "insurance_liquidity",
    name: "Insurance Liquidity Agent",
    role: "Policy and property liquidity collisions",
    purpose: "Finds where insurance obligations and property debt draw on the same cash.",
    brief: `Your question: does this debt plan collide with policy loans, premium finance or
living benefits? Both can look survivable modelled alone and fail in the same
month modelled together, because they draw on one balance sheet and often depend
on similar forward assumptions. Never treat policy cash value as free liquidity
without a lapse and loan-recognition stress.`,
    requires: ["capacity_result"],
    optional: ["liquidity_profile", "client_profile", "findings"],
    produces: "insurance_liquidity_assessment",
    order: 30,
    guardrails: [
      "Never treat policy cash value as unconditionally available liquidity.",
      "Never assume a policy loan can be serviced without stressing lapse risk.",
    ],
  }),

  retirement_cashflow: perspective({
    id: "retirement_cashflow",
    name: "Retirement Cash-Flow Agent",
    role: "Recurring debt service against retirement objectives",
    purpose: "Judges whether new debt service can coexist with retirement income needs.",
    brief: `Your question: can this recurring debt service coexist with the client's
retirement and income objectives? Treat debt service as a retirement cash-flow
LIABILITY, not merely a property expense. A property that pencils can still
weaken the household's income resilience, particularly where the debt outlives
the earning years.`,
    requires: ["capacity_result"],
    optional: ["client_profile", "liquidity_profile", "findings"],
    produces: "retirement_assessment",
    order: 35,
    guardrails: ["Never treat rental income as equivalent in reliability to guaranteed income."],
  }),

  estate_succession: perspective({
    id: "estate_succession",
    name: "Estate and Succession Agent",
    role: "Ownership, trust and transfer constraints",
    purpose: "Finds where collateral conflicts with the estate and succession plan.",
    brief: `Your question: does collateralizing this impair a trust, entity, succession or
estate plan? Lender transfer restrictions and due-on-sale provisions can sit
directly across the transfer the estate plan depends on, and the conflict
usually surfaces at the worst possible moment. Also consider liquidity for
estate taxes and concentration risk in a single illiquid asset.`,
    requires: ["capacity_result"],
    optional: ["deal_input", "client_profile", "findings"],
    produces: "estate_assessment",
    order: 40,
    guardrails: [
      "Never conclude on the legal effect of a document — route to attorney review.",
    ],
  }),

  macro_stress: perspective({
    id: "macro_stress",
    name: "Market and Macro Stress Agent",
    role: "Adverse conditions",
    purpose: "Reports what happens to rates, values, rents, insurance and liquidity under stress.",
    brief: `Your question: what happens under adverse conditions? Work from the stress
results in memory — base, conservative and severe — and report the percentile
outcomes rather than a single number. Correlated shocks matter more than
individual ones: rates up, caps out and growth gone is ONE event, not three
independent ones, and modelling them separately understates the joint tail.`,
    requires: ["capacity_result"],
    optional: ["stress_result", "findings"],
    produces: "macro_assessment",
    order: 45,
    guardrails: [
      "Never present a market forecast as a prediction.",
      "Never cite market data that is not in working memory.",
    ],
  }),

  behavioral_complexity: perspective({
    id: "behavioral_complexity",
    name: "Behavioral and Complexity Agent",
    role: "Operability and behavioral fit",
    purpose: "Judges whether the plan is administrable by the people who must run it.",
    brief: `Your question: is this too complex, leveraged, illiquid or behaviorally
mismatched for this household? Count entities, maturities, rate resets, lenders
and conditional exits. A theoretically superior structure is inferior in
practice if it exceeds what the household and advisor can administer — missed
maturities and lapsed covenants are administration failures, not market
failures. Also name leverage optimism, recency bias from recent appreciation,
and concentration blind spots where the evidence supports them.`,
    requires: ["capacity_result"],
    optional: ["client_profile", "findings"],
    produces: "behavioral_assessment",
    order: 50,
    guardrails: [
      "Never infer a psychological trait from demographic information.",
      "Bias observations must cite specific evidence in memory, not speculation.",
    ],
  }),

  contrarian_correlation: perspective({
    id: "contrarian_correlation",
    name: "Contrarian and Correlation Agent",
    role: "What the panel missed",
    purpose: "Surfaces high-impact cross-domain relationships the other agents did not raise.",
    brief: `Your question: what high-impact relationship has every other agent missed? You
run LAST and you read their conclusions.

Correlation is a HYPOTHESIS GENERATOR, not a prediction. Any relationship you
raise must state the direction of time (what precedes what), name the plausible
confounders, and carry an honest confidence. Present observations as
cross-domain dependency signals requiring human review — never as emergent
predictive properties, and never as certainty.

You may not infer anything from protected characteristics, and you may not
propose anything whose effect would be discriminatory.`,
    requires: ["capacity_result", "findings"],
    optional: [
      "balance_sheet_assessment",
      "exit_assessment",
      "tax_boundary_assessment",
      "insurance_liquidity_assessment",
      "retirement_assessment",
      "estate_assessment",
      "macro_assessment",
      "behavioral_assessment",
      "underwriting_opinion",
    ],
    produces: "correlation_assessment",
    order: 60,
    guardrails: [
      "Correlation is never presented as causation.",
      "Every relationship must state time ordering and plausible confounders.",
      "Never infer from protected-class characteristics.",
      "Confidence above 0.7 requires explicit evidence in working memory.",
    ],
  }),
};

/* ═══ Helpers ══════════════════════════════════════════════════════════════ */

export const ALL_AGENT_IDS = Object.keys(AGENT_DEFINITIONS) as AgentId[];

export function getAgent(id: AgentId): AgentDefinition {
  const agent = AGENT_DEFINITIONS[id];
  if (!agent) throw new Error(`Unknown agent: ${id}`);
  return agent;
}

/**
 * Agents sorted into a runnable sequence. Sorting by `order` alone is not
 * enough — an agent must also come after whoever produces what it reads — so
 * this resolves the dependency graph and uses `order` only to break ties.
 *
 * Throws on a dependency cycle rather than silently emitting a bad order.
 */
export function resolveRunOrder(ids: AgentId[]): AgentId[] {
  // Array.from rather than spread: the project compiles without
  // downlevelIteration, so spreading a Set is a compile error here.
  const selected: AgentId[] = Array.from(new Set(ids));
  const producedBy = new Map<MemoryKind, AgentId>();
  for (const id of selected) producedBy.set(AGENT_DEFINITIONS[id].produces, id);

  const resolved: AgentId[] = [];
  const visiting = new Set<AgentId>();
  const done = new Set<AgentId>();

  const visit = (id: AgentId, trail: AgentId[]) => {
    if (done.has(id)) return;
    if (visiting.has(id)) {
      throw new Error(`Agent dependency cycle: ${[...trail, id].join(" → ")}`);
    }
    visiting.add(id);

    const def = AGENT_DEFINITIONS[id];
    const deps = [...def.requires, ...(def.requiresOneOf ?? []), ...def.optional]
      .map((kind) => producedBy.get(kind))
      .filter((dep): dep is AgentId => dep !== undefined && dep !== id)
      .sort((a, b) => AGENT_DEFINITIONS[a].order - AGENT_DEFINITIONS[b].order);

    for (const dep of deps) visit(dep, [...trail, id]);

    visiting.delete(id);
    done.add(id);
    resolved.push(id);
  };

  for (const id of [...selected].sort(
    (a, b) => AGENT_DEFINITIONS[a].order - AGENT_DEFINITIONS[b].order,
  )) {
    visit(id, []);
  }
  return resolved;
}

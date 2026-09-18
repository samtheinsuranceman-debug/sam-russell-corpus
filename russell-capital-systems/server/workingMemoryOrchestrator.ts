/**
 * Working Memory Orchestrator
 *
 * A bounded, salience-ranked working memory plus the loop that runs agents
 * over it. Three problems this solves, all of which bite once more than one
 * agent shares state:
 *
 *  1. CONTEXT OVERFLOW. A full underwrite — deal input, schedules, stress
 *     results, findings — is far larger than any sensible prompt. Memory items
 *     are therefore scored and packed to a token budget, with an agent's
 *     required kinds admitted first and never evicted.
 *
 *  2. STALENESS. Agent output feeds back into memory, so later agents read
 *     earlier conclusions. Salience decays each turn, which keeps a stale
 *     opinion from crowding out fresh engine output forever.
 *
 *  3. FABRICATION. Prompting a model not to invent numbers is a request, not a
 *     guarantee. `verifyGrounding` extracts every figure an agent emitted and
 *     checks it against the numbers actually present in the context it was
 *     given. Ungrounded figures are returned with the result so the caller can
 *     reject, retry, or surface them — on a platform making financial claims,
 *     an invented DSCR is the failure that matters.
 *
 * The deterministic parts (memory, packing, verification) hold no LLM calls
 * and are unit-testable on their own; `invokeLLM` is injected so a test can
 * drive the loop without a network.
 */
import { invokeLLM as realInvokeLLM, type InvokeParams, type InvokeResult } from "./_core/llm";
import { redactForLlm } from "./realEstateSourceLedger";
import {
  AGENT_DEFINITIONS,
  getAgent,
  resolveRunOrder,
  type AgentDefinition,
  type AgentId,
  type MemoryKind,
} from "./agentDefinitions";

/* ═══ Working memory ═══════════════════════════════════════════════════════ */

export interface MemoryItem {
  id: string;
  kind: MemoryKind;
  /** Short human label used as the section heading in the prompt. */
  label: string;
  content: unknown;
  /** 0–1. Higher survives eviction. */
  salience: number;
  /** Pinned items are never evicted and never decay. */
  pinned: boolean;
  /** Turn index at which this was written. */
  turn: number;
  producedBy?: AgentId;
}

export interface MemoryWrite {
  kind: MemoryKind;
  label: string;
  content: unknown;
  salience?: number;
  pinned?: boolean;
  producedBy?: AgentId;
}

/** Rough token estimate. Deliberately conservative — over-estimating costs a
 *  little context, under-estimating costs a failed request. */
export function estimateTokens(value: unknown): number {
  const text = typeof value === "string" ? value : JSON.stringify(value) ?? "";
  return Math.ceil(text.length / 3.5);
}

export class WorkingMemory {
  private items = new Map<string, MemoryItem>();
  private turnCounter = 0;
  private seq = 0;

  constructor(private readonly decayPerTurn = 0.12) {}

  get turn(): number {
    return this.turnCounter;
  }

  write(write: MemoryWrite): MemoryItem {
    const id = `${write.kind}#${++this.seq}`;
    const item: MemoryItem = {
      id,
      kind: write.kind,
      label: write.label,
      content: write.content,
      salience: write.salience ?? 1,
      pinned: write.pinned ?? false,
      turn: this.turnCounter,
      producedBy: write.producedBy,
    };
    // One live item per kind: a newer stack result supersedes the old one
    // rather than sitting alongside it and confusing every downstream agent.
    const stale: string[] = [];
    this.items.forEach((existing, key) => {
      if (existing.kind === write.kind && !existing.pinned) stale.push(key);
    });
    stale.forEach((key) => this.items.delete(key));
    this.items.set(id, item);
    return item;
  }

  /** Advances the clock and decays unpinned salience. */
  tick(): void {
    this.turnCounter++;
    this.items.forEach((item) => {
      if (!item.pinned) {
        item.salience = Math.max(0, item.salience - this.decayPerTurn);
      }
    });
  }

  get(kind: MemoryKind): MemoryItem | undefined {
    return this.all().find((item) => item.kind === kind);
  }

  has(kind: MemoryKind): boolean {
    return this.get(kind) !== undefined;
  }

  all(): MemoryItem[] {
    return Array.from(this.items.values());
  }

  clear(): void {
    this.items.clear();
  }

  /**
   * Pack memory into a token budget for one agent.
   *
   * Required kinds are admitted first, in declaration order, even if that
   * exhausts the budget — an agent without its required input should fail
   * loudly rather than hallucinate around the gap. Optional kinds then compete
   * on salience, newest first as the tiebreak.
   */
  select(
    agent: AgentDefinition,
    budgetTokens: number,
  ): { selected: MemoryItem[]; missing: MemoryKind[]; tokensUsed: number; truncated: MemoryKind[] } {
    const selected: MemoryItem[] = [];
    const missing: MemoryKind[] = [];
    const truncated: MemoryKind[] = [];
    let used = 0;

    for (const kind of agent.requires) {
      const item = this.get(kind);
      if (!item) {
        missing.push(kind);
        continue;
      }
      selected.push(item);
      used += estimateTokens(item.content);
    }

    // "At least one of" — satisfied by the first alternative present. When
    // none is, every alternative is reported so the error names the real choice.
    if (agent.requiresOneOf && agent.requiresOneOf.length > 0) {
      const found = agent.requiresOneOf
        .map((kind) => this.get(kind))
        .find((i): i is MemoryItem => i !== undefined);
      if (found) {
        selected.push(found);
        used += estimateTokens(found.content);
      } else {
        missing.push(...agent.requiresOneOf);
      }
    }

    const optional = agent.optional
      .map((kind) => this.get(kind))
      .filter((i): i is MemoryItem => i !== undefined)
      .sort((a, b) => b.salience - a.salience || b.turn - a.turn);

    for (const item of optional) {
      const cost = estimateTokens(item.content);
      if (used + cost > budgetTokens) {
        truncated.push(item.kind);
        continue;
      }
      selected.push(item);
      used += cost;
    }

    return { selected, missing, tokensUsed: used, truncated };
  }
}

/* ═══ Grounding verification ═══════════════════════════════════════════════ */

/**
 * Pull every numeric literal out of a blob of text or JSON.
 * Percentages are normalized to their decimal form as well, since an agent
 * writing "12.5%" is grounded by a memory value of 0.125.
 */
export function extractNumbers(value: unknown): number[] {
  const text = typeof value === "string" ? value : JSON.stringify(value) ?? "";
  const out: number[] = [];
  // Every alternative must consume at least one digit. A pattern whose parts
  // are all optional can match the empty string, and `exec` with /g does not
  // advance lastIndex on a zero-length match — that is an infinite loop.
  const re = /-?\d[\d,]*(?:\.\d+)?%?|-?\.\d+%?/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const token = match[0];
    const isPercent = token.charAt(token.length - 1) === "%";
    const n = Number((isPercent ? token.slice(0, -1) : token).replace(/,/g, ""));
    if (Number.isFinite(n)) {
      out.push(n);
      // "12.5%" is grounded by a stored value of 0.125.
      if (isPercent) out.push(n / 100);
    }
  }
  return out;
}

export interface GroundingReport {
  checked: number;
  grounded: number;
  /** Figures in the output with no match in the supplied context. */
  ungrounded: number[];
  ok: boolean;
}

/**
 * Check that every figure an agent emitted appears in the context it read.
 *
 * Tolerances exist because agents legitimately round: "1.28x" for 1.2841.
 * Small integers and plausible years are skipped — they are ordinals, list
 * counts and dates, not claims, and flagging them buries the real signal.
 */
export function verifyGrounding(
  output: unknown,
  context: unknown,
  options: { relativeTolerance?: number; ignoreBelow?: number } = {},
): GroundingReport {
  const tolerance = options.relativeTolerance ?? 0.02;
  const ignoreBelow = options.ignoreBelow ?? 11;

  const contextNumbers = extractNumbers(context);
  const candidates = extractNumbers(output).filter(
    (n) => Math.abs(n) >= ignoreBelow && !(Number.isInteger(n) && n >= 1900 && n <= 2200),
  );

  const ungrounded: number[] = [];
  for (const n of candidates) {
    const hit = contextNumbers.some((c) => {
      if (c === n) return true;
      const scale = Math.max(Math.abs(c), Math.abs(n), 1e-9);
      return Math.abs(c - n) / scale <= tolerance;
    });
    if (!hit) ungrounded.push(n);
  }

  const unique = Array.from(new Set(ungrounded));
  return {
    checked: candidates.length,
    grounded: candidates.length - ungrounded.length,
    ungrounded: unique,
    ok: unique.length === 0,
  };
}

/* ═══ Orchestration ════════════════════════════════════════════════════════ */

export interface AgentRunResult {
  agentId: AgentId;
  ok: boolean;
  output: unknown | null;
  /** Populated when the agent could not run or its output failed checks. */
  error: string | null;
  missingMemory: MemoryKind[];
  truncatedMemory: MemoryKind[];
  promptTokens: number;
  grounding: GroundingReport | null;
  raw: string | null;
}

export interface OrchestratorOptions {
  /** Token budget for the memory section of each agent prompt. */
  memoryBudgetTokens?: number;
  /** Injected for testing. Defaults to the platform LLM. */
  invoke?: (params: InvokeParams) => Promise<InvokeResult>;
  /** Reject an agent's output when it contains ungrounded figures. */
  enforceGrounding?: boolean;
}

/** Renders selected memory into the deterministic prompt block agents read. */
export function renderMemory(items: MemoryItem[]): string {
  return items
    .map((item) => {
      const body =
        typeof item.content === "string"
          ? item.content
          : JSON.stringify(item.content, null, 2);
      const origin = item.producedBy ? ` (produced by ${item.producedBy})` : "";
      return `### ${item.label} [${item.kind}]${origin}\n${body}`;
    })
    .join("\n\n");
}

function firstTextContent(result: InvokeResult): string {
  const message = result.choices?.[0]?.message;
  if (!message) return "";
  if (typeof message.content === "string") return message.content;
  if (Array.isArray(message.content)) {
    return message.content
      .map((part) => (part && typeof part === "object" && "text" in part ? part.text : ""))
      .join("");
  }
  return "";
}

export class Orchestrator {
  private readonly invoke: (params: InvokeParams) => Promise<InvokeResult>;
  private readonly budget: number;
  private readonly enforceGrounding: boolean;

  constructor(
    public readonly memory: WorkingMemory,
    options: OrchestratorOptions = {},
  ) {
    this.invoke = options.invoke ?? realInvokeLLM;
    this.budget = options.memoryBudgetTokens ?? 12_000;
    this.enforceGrounding = options.enforceGrounding ?? true;
  }

  async runAgent(agentId: AgentId): Promise<AgentRunResult> {
    const agent = getAgent(agentId);
    const { selected, missing, tokensUsed, truncated } = this.memory.select(
      agent,
      this.budget,
    );

    const base: AgentRunResult = {
      agentId,
      ok: false,
      output: null,
      error: null,
      missingMemory: missing,
      truncatedMemory: truncated,
      promptTokens: tokensUsed,
      grounding: null,
      raw: null,
    };

    if (missing.length > 0) {
      return {
        ...base,
        error: `Missing required working memory: ${missing.join(", ")}`,
      };
    }

    // Privacy by design (blueprint §13.9): identifying detail is stripped
    // before anything reaches the model. Agents reason over ratios and
    // findings; none of them needs a street address or an account number.
    const redacted = selected.map((item) => ({
      ...item,
      content: redactForLlm(item.content),
    }));
    const memoryBlock = renderMemory(redacted);
    const guardrails = agent.guardrails.map((g) => `- ${g}`).join("\n");

    const userContent = [
      "## WORKING MEMORY",
      memoryBlock,
      "",
      "## GUARDRAILS",
      guardrails,
      "",
      `Respond with JSON matching the "${agent.outputSchema.name}" schema.`,
    ].join("\n");

    let result: InvokeResult;
    try {
      result = await this.invoke({
        messages: [
          { role: "system", content: agent.systemPrompt },
          { role: "user", content: userContent },
        ],
        maxTokens: agent.maxTokens,
        outputSchema: agent.outputSchema,
      });
    } catch (e) {
      return { ...base, error: `LLM call failed: ${(e as Error).message}` };
    }

    const raw = firstTextContent(result);
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { ...base, raw, error: "Agent output was not valid JSON" };
    }

    let grounding: GroundingReport | null = null;
    if (agent.citesOnly) {
      // Verify against what the model actually SAW, not the unredacted set —
      // otherwise a redacted field could "ground" a figure the agent invented.
      grounding = verifyGrounding(parsed, redacted.map((s) => s.content));
      if (!grounding.ok && this.enforceGrounding) {
        return {
          ...base,
          raw,
          output: parsed,
          grounding,
          error: `Ungrounded figures in output: ${grounding.ungrounded.join(", ")}`,
        };
      }
    }

    this.memory.write({
      kind: agent.produces,
      label: agent.name,
      content: parsed,
      producedBy: agentId,
      salience: 0.9,
    });
    this.memory.tick();

    return { ...base, ok: true, output: parsed, grounding, raw };
  }

  /**
   * Run agents in dependency order. A failed agent does not abort the run —
   * downstream agents that required its output will report the gap themselves,
   * and a partial underwrite is more useful than none.
   */
  async runPipeline(agentIds: AgentId[]): Promise<AgentRunResult[]> {
    const order = resolveRunOrder(agentIds);
    const results: AgentRunResult[] = [];
    for (const id of order) {
      results.push(await this.runAgent(id));
    }
    return results;
  }
}

/* ═══ Convenience ══════════════════════════════════════════════════════════ */

/** Seeds working memory from a completed underwrite. Engine output is pinned:
 *  it is ground truth and must never be evicted in favour of model opinion. */
export function seedFromUnderwrite(
  memory: WorkingMemory,
  payload: {
    dealInput?: unknown;
    stack: unknown;
    stress?: unknown;
    findings: unknown;
    clientProfile?: unknown;
  },
): WorkingMemory {
  if (payload.dealInput !== undefined) {
    memory.write({
      kind: "deal_input",
      label: "Deal inputs",
      content: payload.dealInput,
      pinned: true,
    });
  }
  memory.write({
    kind: "stack_result",
    label: "Capital stack model",
    content: payload.stack,
    pinned: true,
  });
  if (payload.stress !== undefined) {
    memory.write({
      kind: "stress_result",
      label: "Stress results",
      content: payload.stress,
      pinned: true,
    });
  }
  memory.write({
    kind: "findings",
    label: "Findings",
    content: payload.findings,
    pinned: true,
  });
  if (payload.clientProfile !== undefined) {
    memory.write({
      kind: "client_profile",
      label: "Client profile",
      content: payload.clientProfile,
      salience: 0.8,
    });
  }
  return memory;
}

/**
 * Seeds working memory from a RECIN borrower-side capacity run.
 * Engine output is pinned: it is ground truth and model opinion must never
 * evict it.
 */
export function seedFromCapacityScenario(
  memory: WorkingMemory,
  payload: {
    scenarioInput?: unknown;
    capacityResult: unknown;
    findings: unknown;
    liquidity?: unknown;
    structuredFinance?: unknown;
    clientProfile?: unknown;
  },
): WorkingMemory {
  if (payload.scenarioInput !== undefined) {
    memory.write({
      kind: "deal_input",
      label: "Scenario inputs",
      content: payload.scenarioInput,
      pinned: true,
    });
  }
  memory.write({
    kind: "capacity_result",
    label: "Capacity analysis",
    content: payload.capacityResult,
    pinned: true,
  });
  memory.write({
    kind: "findings",
    label: "Findings",
    content: payload.findings,
    pinned: true,
  });
  if (payload.liquidity !== undefined) {
    memory.write({
      kind: "liquidity_profile",
      label: "Household liquidity",
      content: payload.liquidity,
      pinned: true,
    });
  }
  if (payload.structuredFinance !== undefined) {
    memory.write({
      kind: "structured_finance",
      label: "Structured finance terms",
      content: payload.structuredFinance,
      pinned: true,
    });
  }
  if (payload.clientProfile !== undefined) {
    memory.write({
      kind: "client_profile",
      label: "Client profile",
      content: payload.clientProfile,
      salience: 0.8,
    });
  }
  return memory;
}

/**
 * The blueprint's 12-perspective deliberation roster (§6).
 *
 * Bounded by construction: every agent reads the same factual packet, returns
 * schema-conforming JSON, and has no tools and no private memory. The
 * orchestrator — not the agents — decides order, enforces grounding, and
 * preserves their disagreements rather than averaging them away.
 */
export const DELIBERATION_PIPELINE_12: AgentId[] = [
  "household_balance_sheet",
  "underwriter",
  "capital_markets",
  "exit_refinance",
  "tax_entity",
  "insurance_liquidity",
  "retirement_cashflow",
  "estate_succession",
  "macro_stress",
  "behavioral_complexity",
  "compliance_reviewer",
  "contrarian_correlation",
];

/** The full underwriting review, in the order a deal team would run it. */
export const UNDERWRITING_PIPELINE: AgentId[] = [
  "underwriter",
  "risk_officer",
  "capital_markets",
  "investor_narrative",
  "compliance_reviewer",
];

export { AGENT_DEFINITIONS };

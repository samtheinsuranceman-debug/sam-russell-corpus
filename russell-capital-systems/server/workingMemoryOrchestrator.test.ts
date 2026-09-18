import { describe, it, expect, vi } from "vitest";
import {
  estimateTokens,
  extractNumbers,
  Orchestrator,
  renderMemory,
  seedFromUnderwrite,
  UNDERWRITING_PIPELINE,
  verifyGrounding,
  WorkingMemory,
} from "./workingMemoryOrchestrator";
import {
  AGENT_DEFINITIONS,
  ALL_AGENT_IDS,
  getAgent,
  resolveRunOrder,
  type AgentId,
} from "./agentDefinitions";
import type { InvokeParams, InvokeResult } from "./_core/llm";

/** Minimal InvokeResult wrapper around a canned payload. */
const reply = (payload: unknown): InvokeResult => ({
  id: "test",
  created: Date.now(),
  model: "test-model",
  choices: [
    {
      index: 0,
      message: { role: "assistant", content: JSON.stringify(payload) },
      finish_reason: "stop",
    },
  ],
});

describe("agent definitions", () => {
  it("keeps ids consistent with their map keys", () => {
    for (const id of ALL_AGENT_IDS) {
      expect(AGENT_DEFINITIONS[id].id).toBe(id);
    }
  });

  it("gives every agent a schema, guardrails and a distinct output kind", () => {
    const kinds = new Set<string>();
    for (const id of ALL_AGENT_IDS) {
      const a = AGENT_DEFINITIONS[id];
      expect(a.outputSchema.schema).toBeTruthy();
      expect(a.guardrails.length).toBeGreaterThan(0);
      expect(a.systemPrompt.length).toBeGreaterThan(100);
      expect(kinds.has(a.produces)).toBe(false);
      kinds.add(a.produces);
    }
  });

  it("throws on an unknown agent", () => {
    expect(() => getAgent("nope" as AgentId)).toThrow(/Unknown agent/);
  });
});

describe("resolveRunOrder", () => {
  it("places producers before the agents that read them", () => {
    const order = resolveRunOrder(UNDERWRITING_PIPELINE);
    // compliance_reviewer requires investor_summary
    expect(order.indexOf("investor_narrative")).toBeLessThan(
      order.indexOf("compliance_reviewer"),
    );
    // risk_officer's output is read by capital_markets
    expect(order.indexOf("risk_officer")).toBeLessThan(order.indexOf("capital_markets"));
  });

  it("returns every requested agent exactly once", () => {
    const order = resolveRunOrder(UNDERWRITING_PIPELINE);
    expect(order).toHaveLength(UNDERWRITING_PIPELINE.length);
    expect(new Set(order).size).toBe(UNDERWRITING_PIPELINE.length);
  });

  it("orders correctly even when handed a reversed list", () => {
    const order = resolveRunOrder([...UNDERWRITING_PIPELINE].reverse());
    expect(order.indexOf("investor_narrative")).toBeLessThan(
      order.indexOf("compliance_reviewer"),
    );
  });

  it("deduplicates", () => {
    expect(resolveRunOrder(["underwriter", "underwriter"])).toEqual(["underwriter"]);
  });
});

describe("estimateTokens", () => {
  it("scales with content size", () => {
    expect(estimateTokens("")).toBe(0);
    expect(estimateTokens("a".repeat(350))).toBe(100);
    expect(estimateTokens({ a: 1 })).toBeGreaterThan(0);
  });
});

describe("extractNumbers", () => {
  it("terminates on pathological input", () => {
    // The original pattern could match the empty string, which hangs exec().
    const start = Date.now();
    extractNumbers("-".repeat(2000) + "...%%%" + "x".repeat(2000));
    expect(Date.now() - start).toBeLessThan(1000);
  });

  it("parses plain, grouped and decimal numbers", () => {
    const n = extractNumbers("DSCR 1.28x on $6,500,000 of debt");
    expect(n).toContain(1.28);
    expect(n).toContain(6_500_000);
  });

  it("emits both the literal and decimal form of a percentage", () => {
    const n = extractNumbers("returns 12.5%");
    expect(n).toContain(12.5);
    expect(n).toContain(0.125);
  });

  it("handles negatives and leading-dot decimals", () => {
    const n = extractNumbers("delta -3.4 and .25 of capital");
    expect(n).toContain(-3.4);
    expect(n).toContain(0.25);
  });

  it("reads numbers out of structured objects", () => {
    expect(extractNumbers({ minDscr: 1.42 })).toContain(1.42);
  });
});

describe("verifyGrounding", () => {
  const context = { minDscr: 1.2841, maxLtv: 0.6712, debt: 6_500_000 };

  it("accepts figures present in context", () => {
    const r = verifyGrounding({ note: "debt of 6,500,000" }, context);
    expect(r.ok).toBe(true);
    expect(r.ungrounded).toHaveLength(0);
  });

  it("accepts sensible rounding", () => {
    // 1.28 vs 1.2841 is inside the 2% tolerance.
    const r = verifyGrounding({ note: "coverage of 1.28x" }, context);
    expect(r.ok).toBe(true);
  });

  it("flags an invented figure", () => {
    const r = verifyGrounding({ note: "debt yield of 9,400,000" }, context);
    expect(r.ok).toBe(false);
    expect(r.ungrounded).toContain(9_400_000);
  });

  it("ignores small integers and years", () => {
    const r = verifyGrounding({ note: "3 concerns, as of 2026, item 2" }, context);
    expect(r.ok).toBe(true);
  });

  it("counts what it checked", () => {
    const r = verifyGrounding({ a: "6,500,000 and 12,345,678" }, context);
    expect(r.checked).toBeGreaterThanOrEqual(2);
    expect(r.grounded).toBeLessThan(r.checked);
  });
});

describe("WorkingMemory", () => {
  it("stores and retrieves by kind", () => {
    const m = new WorkingMemory();
    m.write({ kind: "findings", label: "Findings", content: { a: 1 } });
    expect(m.has("findings")).toBe(true);
    expect(m.get("findings")?.content).toEqual({ a: 1 });
  });

  it("supersedes an unpinned item of the same kind", () => {
    const m = new WorkingMemory();
    m.write({ kind: "findings", label: "v1", content: { v: 1 } });
    m.write({ kind: "findings", label: "v2", content: { v: 2 } });
    expect(m.all().filter((i) => i.kind === "findings")).toHaveLength(1);
    expect(m.get("findings")?.content).toEqual({ v: 2 });
  });

  it("decays unpinned salience but never pinned", () => {
    const m = new WorkingMemory(0.5);
    m.write({ kind: "findings", label: "f", content: {}, salience: 1 });
    m.write({ kind: "stack_result", label: "s", content: {}, salience: 1, pinned: true });
    m.tick();
    expect(m.get("findings")!.salience).toBeCloseTo(0.5, 6);
    expect(m.get("stack_result")!.salience).toBe(1);
  });

  it("reports missing required memory rather than guessing", () => {
    const m = new WorkingMemory();
    const { missing } = m.select(getAgent("underwriter"), 10_000);
    expect(missing).toContain("stack_result");
    expect(missing).toContain("findings");
  });

  it("admits required memory even when it blows the budget", () => {
    const m = new WorkingMemory();
    m.write({ kind: "stack_result", label: "s", content: "x".repeat(40_000), pinned: true });
    m.write({ kind: "findings", label: "f", content: "y".repeat(40_000), pinned: true });
    const { selected, missing, tokensUsed } = m.select(getAgent("underwriter"), 100);
    expect(missing).toHaveLength(0);
    expect(selected).toHaveLength(2);
    expect(tokensUsed).toBeGreaterThan(100);
  });

  it("drops optional memory that will not fit, and says so", () => {
    const m = new WorkingMemory();
    m.write({ kind: "stack_result", label: "s", content: { a: 1 } });
    m.write({ kind: "findings", label: "f", content: { b: 2 } });
    m.write({ kind: "stress_result", label: "st", content: "z".repeat(40_000) });
    const { selected, truncated } = m.select(getAgent("underwriter"), 200);
    expect(truncated).toContain("stress_result");
    expect(selected.map((s) => s.kind)).not.toContain("stress_result");
  });

  it("prefers higher-salience optional memory", () => {
    const m = new WorkingMemory();
    m.write({ kind: "stack_result", label: "s", content: { a: 1 } });
    m.write({ kind: "findings", label: "f", content: { b: 2 } });
    m.write({ kind: "deal_input", label: "d", content: { c: 3 }, salience: 0.9 });
    m.write({ kind: "stress_result", label: "st", content: { d: 4 }, salience: 0.1 });
    const { selected } = m.select(getAgent("underwriter"), 10_000);
    const optionalOrder = selected.slice(2).map((s) => s.kind);
    expect(optionalOrder[0]).toBe("deal_input");
  });
});

describe("renderMemory", () => {
  it("labels each section with its kind and producer", () => {
    const m = new WorkingMemory();
    m.write({ kind: "findings", label: "Findings", content: { riskScore: 72 } });
    m.write({
      kind: "underwriting_opinion",
      label: "Underwriter",
      content: { verdict: "proceed" },
      producedBy: "underwriter",
    });
    const text = renderMemory(m.all());
    expect(text).toContain("[findings]");
    expect(text).toContain("produced by underwriter");
    expect(text).toContain("riskScore");
  });
});

describe("Orchestrator", () => {
  const seed = () =>
    seedFromUnderwrite(new WorkingMemory(), {
      stack: { returns: { minDscr: 1.42, leveredIrr: 0.163 } },
      findings: { riskScore: 72, findings: [{ code: "HIGH_LEVERAGE" }] },
      stress: { base: { minDscr: 1.42 } },
    });

  it("refuses to run an agent whose required memory is absent", async () => {
    const invoke = vi.fn();
    const orch = new Orchestrator(new WorkingMemory(), { invoke });
    const r = await orch.runAgent("underwriter");
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/Missing required working memory/);
    expect(invoke).not.toHaveBeenCalled();
  });

  it("runs a grounded agent and writes its output back to memory", async () => {
    const memory = seed();
    const invoke = vi.fn(async () =>
      reply({
        verdict: "proceed_with_conditions",
        rationale: "Coverage holds at 1.42x.",
        keyStrengths: ["Coverage"],
        keyConcerns: ["Leverage"],
        citedFindingCodes: ["HIGH_LEVERAGE"],
      }),
    );
    const orch = new Orchestrator(memory, { invoke });
    const r = await orch.runAgent("underwriter");

    expect(r.ok).toBe(true);
    expect(r.grounding?.ok).toBe(true);
    expect(memory.has("underwriting_opinion")).toBe(true);
    expect((memory.get("underwriting_opinion")!.content as any).verdict).toBe(
      "proceed_with_conditions",
    );
  });

  it("rejects an agent that invents a figure", async () => {
    const memory = seed();
    const invoke = vi.fn(async () =>
      reply({
        verdict: "proceed",
        rationale: "Debt yield of 11.7% is comfortable.", // 11.7 is nowhere in memory
        keyStrengths: [],
        keyConcerns: [],
        citedFindingCodes: [],
      }),
    );
    const orch = new Orchestrator(memory, { invoke });
    const r = await orch.runAgent("underwriter");

    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/Ungrounded figures/);
    expect(r.grounding?.ungrounded).toContain(11.7);
    // A rejected opinion must not pollute memory.
    expect(memory.has("underwriting_opinion")).toBe(false);
  });

  it("can be configured to report rather than reject ungrounded output", async () => {
    const memory = seed();
    const invoke = vi.fn(async () =>
      reply({
        verdict: "proceed",
        rationale: "Debt yield of 11.7%.",
        keyStrengths: [],
        keyConcerns: [],
        citedFindingCodes: [],
      }),
    );
    const orch = new Orchestrator(memory, { invoke, enforceGrounding: false });
    const r = await orch.runAgent("underwriter");
    expect(r.ok).toBe(true);
    expect(r.grounding?.ok).toBe(false);
  });

  it("surfaces malformed JSON instead of throwing", async () => {
    const memory = seed();
    const invoke = vi.fn(
      async (): Promise<InvokeResult> => ({
        id: "t",
        created: 0,
        model: "m",
        choices: [
          { index: 0, message: { role: "assistant", content: "not json" }, finish_reason: "stop" },
        ],
      }),
    );
    const orch = new Orchestrator(memory, { invoke });
    const r = await orch.runAgent("underwriter");
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/not valid JSON/);
    expect(r.raw).toBe("not json");
  });

  it("surfaces an LLM failure instead of throwing", async () => {
    const memory = seed();
    const invoke = vi.fn(async () => {
      throw new Error("upstream 503");
    });
    const orch = new Orchestrator(memory, { invoke });
    const r = await orch.runAgent("underwriter");
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/upstream 503/);
  });

  it("passes the agent's schema and system prompt to the model", async () => {
    const memory = seed();
    let captured: InvokeParams | null = null;
    const invoke = vi.fn(async (p: InvokeParams) => {
      captured = p;
      return reply({
        verdict: "proceed",
        rationale: "ok",
        keyStrengths: [],
        keyConcerns: [],
        citedFindingCodes: [],
      });
    });
    await new Orchestrator(memory, { invoke }).runAgent("underwriter");

    expect(captured!.outputSchema?.name).toBe("underwriting_opinion");
    expect(captured!.messages[0].role).toBe("system");
    expect(String(captured!.messages[1].content)).toContain("WORKING MEMORY");
    expect(String(captured!.messages[1].content)).toContain("GUARDRAILS");
  });

  it("runs a pipeline in dependency order and keeps going after a failure", async () => {
    const memory = seed();
    const called: string[] = [];
    const invoke = vi.fn(async (p: InvokeParams) => {
      const name = p.outputSchema!.name;
      called.push(name);
      if (name === "risk_assessment") throw new Error("boom");
      // Echo back only grounded content.
      return reply({ ok: true, note: "no figures here" });
    });

    const orch = new Orchestrator(memory, { invoke, enforceGrounding: false });
    const results = await orch.runPipeline(UNDERWRITING_PIPELINE);

    expect(results).toHaveLength(UNDERWRITING_PIPELINE.length);
    expect(called.indexOf("underwriting_opinion")).toBeLessThan(
      called.indexOf("risk_assessment"),
    );
    const risk = results.find((r) => r.agentId === "risk_officer")!;
    expect(risk.ok).toBe(false);
    // The run continued past the failure.
    expect(results.filter((r) => r.ok).length).toBeGreaterThan(0);
  });

  it("pins engine output so model opinion can never evict it", () => {
    const memory = seed();
    for (let i = 0; i < 20; i++) memory.tick();
    expect(memory.get("stack_result")!.salience).toBe(1);
    expect(memory.get("findings")!.salience).toBe(1);
  });
});

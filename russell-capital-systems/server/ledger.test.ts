// ============================================================
// The Plan Ledger: diffing assessments into facts, replaying facts into an
// assessment, the hash chain, and the router — database mocked in memory.
// ============================================================
import { beforeEach, describe, expect, it, vi } from "vitest";
import { emptyFactFinder, type ClientFactFinder } from "@shared/clientFactFinder";
import { canonicalEvent, describeFact, diffFactFinder, groupByDay, ledgerSubject, replayFacts, type LedgerEvent, type LedgerEventInput } from "@shared/planLedger";

// In-memory ledger store standing in for plan_events.
const store: LedgerEvent[] = [];
vi.mock("./ledgerDb", async () => {
  const { createHash } = await import("node:crypto");
  const GENESIS = "0".repeat(64);
  const hash = (prev: string, e: Parameters<typeof canonicalEvent>[0]) => createHash("sha256").update(`${prev}|${canonicalEvent(e)}`).digest("hex");
  return {
    GENESIS_HASH: GENESIS,
    hashEvent: hash,
    appendEvents: vi.fn(async (inputs: LedgerEventInput[]) => {
      if (!inputs.length) return 0;
      const subject = ledgerSubject(inputs[0]!);
      const chain = store.filter((e) => e.subject === subject);
      let seq = chain.length ? Math.max(...chain.map((e) => e.seq)) : 0;
      let prevHash = chain.length ? chain.sort((a, b) => a.seq - b.seq).at(-1)!.hash : GENESIS;
      for (const e of inputs) {
        seq += 1;
        const occurredAt = e.occurredAt ?? new Date();
        const h = hash(prevHash, { subject, seq, kind: e.kind, source: e.source, key: e.key ?? null, value: e.value ?? null, prevValue: e.prevValue ?? null, summary: e.summary, occurredAt });
        store.push({ id: store.length + 1, subject, seq, kind: e.kind, source: e.source, key: e.key ?? null, label: e.label ?? null, value: e.value ?? null, prevValue: e.prevValue ?? null, summary: e.summary, actorName: e.actorName ?? null, occurredAt, userId: e.userId ?? null, clientId: e.clientId ?? null, leadId: e.leadId ?? null, workspaceId: e.workspaceId ?? null, prevHash, hash: h, createdAt: occurredAt });
        prevHash = h;
      }
      return inputs.length;
    }),
    listEvents: vi.fn(async (subject: string, opts: { kinds?: string[]; ascending?: boolean; limit?: number; beforeSeq?: number } = {}) => {
      let rows = store.filter((e) => e.subject === subject && (!opts.kinds || opts.kinds.includes(e.kind)) && (!opts.beforeSeq || e.seq < opts.beforeSeq));
      rows = rows.sort((a, b) => (opts.ascending ? a.seq - b.seq : b.seq - a.seq));
      return rows.slice(0, opts.limit ?? 200);
    }),
    countEvents: vi.fn(async (subject: string) => store.filter((e) => e.subject === subject).length),
    verifyChain: vi.fn(async (subject: string) => {
      const chain = store.filter((e) => e.subject === subject).sort((a, b) => a.seq - b.seq);
      let prev = GENESIS;
      for (const e of chain) {
        const h = hash(prev, { subject: e.subject, seq: e.seq, kind: e.kind, source: e.source, key: e.key, value: e.value, prevValue: e.prevValue, summary: e.summary, occurredAt: e.occurredAt });
        if (e.prevHash !== prev || e.hash !== h) return { ok: false, events: chain.length, brokenAtSeq: e.seq };
        prev = h;
      }
      return { ok: true, events: chain.length, brokenAtSeq: null };
    }),
  };
});
vi.mock("./db", () => ({
  getDb: vi.fn(async () => null),
  getWorkspaceByOwnerId: vi.fn(async () => ({ id: 9 })),
  getClientById: vi.fn(async (id: number) => (id === 3 ? { id: 3, workspaceId: 9, name: "Dana Client" } : null)),
  logClientActivity: vi.fn(async () => null),
}));

import { ledgerRouter } from "./ledgerRouter";
import { recordAssessmentChange, recordEvent, assessmentResetEvent } from "./ledger";
import { verifyChain } from "./ledgerDb";

const ctx = (id = 1) => ({ user: { id, openId: "u1", role: "user", name: "Dana" }, req: { headers: {} }, res: {} }) as never;
beforeEach(() => { store.length = 0; });

function ff(overrides: Record<string, Record<string, string | number | boolean | null>>, lists: ClientFactFinder["lists"] = {}): ClientFactFinder {
  const f = emptyFactFinder();
  for (const [s, v] of Object.entries(overrides)) Object.assign(f.sections[s]!, v);
  f.lists = lists;
  return f;
}

describe("diffing assessments into facts", () => {
  it("emits one fact per changed field, labelled, with previous and new value; nothing for unchanged", () => {
    const a = ff({ income: { w2Income: 500000 }, household: { firstName: "Dana" } });
    const b = ff({ income: { w2Income: 650000, spouseIncome: 0 }, household: { firstName: "Dana" } });
    const d = diffFactFinder(a, b);
    expect(d.map((e) => e.key)).toEqual(["income.spouseIncome", "income.w2Income"]);
    const w2 = d.find((e) => e.key === "income.w2Income")!;
    expect(w2).toMatchObject({ kind: "fact", source: "client", prevValue: 500000, value: 650000, label: expect.stringContaining("W-2") });
    expect(w2.summary).toBe(describeFact("income.w2Income", 500000, 650000));
    expect(w2.summary).toMatch(/500,000 → 650,000/);
    expect(diffFactFinder(b, b)).toEqual([]);
  });
  it("treats empty string and undefined as the same blank, and compares lists whole", () => {
    const a = ff({ household: { firstName: "" } }, { properties: [{ type: "Rental", value: 400000 }] });
    const b = ff({ household: {} }, { properties: [{ type: "Rental", value: 450000 }] });
    const d = diffFactFinder(a, b);
    expect(d).toHaveLength(1);
    expect(d[0]).toMatchObject({ key: "lists.properties", prevValue: [{ type: "Rental", value: 400000 }], value: [{ type: "Rental", value: 450000 }] });
  });
  it("starts from an empty assessment when there was none", () => {
    const d = diffFactFinder(null, ff({ taxes: { federalTaxPaid: 205000 } }));
    expect(d).toHaveLength(1);
    expect(d[0]!.summary).toMatch(/set to 205,000/);
  });
});

describe("replaying facts", () => {
  it("rebuilds the assessment at any moment, honours resets, and ignores non-fact events", () => {
    const t = (m: number) => new Date(Date.UTC(2026, 8, 6, 12, m));
    const events = [
      { seq: 1, kind: "fact" as const, key: "income.w2Income", value: 500000, occurredAt: t(0) },
      { seq: 2, kind: "message" as const, key: "check_in", value: null, occurredAt: t(1) },
      { seq: 3, kind: "fact" as const, key: "income.w2Income", value: 650000, occurredAt: t(2) },
      { seq: 4, kind: "fact" as const, key: "lists.properties", value: [{ type: "Rental" }], occurredAt: t(3) },
      { seq: 5, kind: "status" as const, key: "assessment.reset", value: null, occurredAt: t(4) },
      { seq: 6, kind: "fact" as const, key: "cash.savings", value: 15000, occurredAt: t(5) },
    ];
    expect(replayFacts(events, t(1)).sections.income!.w2Income).toBe(500000);
    expect(replayFacts(events, t(3)).sections.income!.w2Income).toBe(650000);
    expect(replayFacts(events, t(3)).lists.properties).toEqual([{ type: "Rental" }]);
    const after = replayFacts(events);
    expect(after.sections.income!.w2Income).toBeUndefined();
    expect(after.lists.properties).toBeUndefined();
    expect(after.sections.cash!.savings).toBe(15000);
  });
  it("groups a timeline by day, newest day first", () => {
    const g = groupByDay([{ occurredAt: new Date("2026-09-01T10:00:00Z") }, { occurredAt: new Date("2026-09-03T10:00:00Z") }, { occurredAt: new Date("2026-09-01T12:00:00Z") }]);
    expect(g.map((x) => x.day)).toEqual(["2026-09-03", "2026-09-01"]);
    expect(g[1]!.events).toHaveLength(2);
  });
});

describe("the chain and the router", () => {
  it("records assessment changes as chained facts and replays them through the router", async () => {
    await recordAssessmentChange({ userId: 1 }, null, ff({ income: { w2Income: 500000 } }));
    await recordAssessmentChange({ userId: 1 }, ff({ income: { w2Income: 500000 } }), ff({ income: { w2Income: 650000 }, cash: { savings: 15000 } }));
    const t = await ledgerRouter.createCaller(ctx()).timeline({ limit: 100 });
    expect(t.subject).toBe("u:1");
    expect(t.total).toBe(3);
    expect(t.events[0]!.seq).toBe(3);
    expect(t.events.map((e) => e.key).sort()).toEqual(["cash.savings", "income.w2Income", "income.w2Income"]);
    const r = await ledgerRouter.createCaller(ctx()).replay({});
    expect(r.data.sections.income!.w2Income).toBe(650000);
    expect(r.applied).toBe(3);
    const v = await ledgerRouter.createCaller(ctx()).verify({});
    expect(v).toMatchObject({ ok: true, events: 3 });
  });
  it("detects tampering", async () => {
    await recordEvent({ kind: "decision", source: "advisor", summary: "Start Roth conversions at $80k/yr", userId: 2 });
    await recordEvent({ kind: "decision", source: "advisor", summary: "Pay the mortgage on the 15-year schedule", userId: 2 });
    store.find((e) => e.subject === "u:2" && e.seq === 1)!.summary = "Start Roth conversions at $8k/yr";
    expect(await verifyChain("u:2")).toMatchObject({ ok: false, brokenAtSeq: 1 });
  });
  it("reset writes a status event that replay honours", async () => {
    await recordAssessmentChange({ userId: 1 }, null, ff({ income: { w2Income: 500000 } }));
    await recordEvent(assessmentResetEvent({ userId: 1 }));
    const r = await ledgerRouter.createCaller(ctx()).replay({});
    expect(r.data.sections.income!.w2Income).toBeUndefined();
  });
  it("lets the advisor append a decision to a client chain in their workspace, and refuses a client they do not own", async () => {
    const res = await ledgerRouter.createCaller(ctx()).append({ clientId: 3, kind: "decision", summary: "Fund the IUL from the HELOC in year one" });
    expect(res.recorded).toBe(true);
    const t = await ledgerRouter.createCaller(ctx()).timeline({ clientId: 3 });
    expect(t.subject).toBe("c:3");
    expect(t.events[0]).toMatchObject({ kind: "decision", source: "advisor", actorName: "Dana" });
    await expect(ledgerRouter.createCaller(ctx()).timeline({ clientId: 4 })).rejects.toThrow();
  });
  it("diffs two moments", async () => {
    const early = new Date(Date.now() - 60_000);
    await recordAssessmentChange({ userId: 1 }, null, ff({ income: { w2Income: 500000 } }));
    const d = await ledgerRouter.createCaller(ctx()).diff({ from: early.toISOString() });
    expect(d.changes).toHaveLength(1);
    expect(d.changes[0]).toMatchObject({ key: "income.w2Income", value: 500000 });
  });
});

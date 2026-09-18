import { describe, it, expect } from "vitest";
import {
  ageInDays,
  clientReleaseGate,
  groupByReviewer,
  hashContent,
  InMemoryLedgerStore,
  isStale,
  prioritizeReviewQueue,
  redactForLlm,
  SourceLedger,
  type ReviewableFinding,
} from "./realEstateSourceLedger";
import {
  channelStatus,
  CHANNELS,
  EXCLUDED_PRACTICES,
  fetchThroughChannel,
  hasCredential,
  isChannelEnabled,
  RateIndexAdapter,
} from "./realEstateDataAdapters";

/* ═══ Consent gate ═════════════════════════════════════════════════════════ */

describe("consent", () => {
  it("records a grant with the verbatim text", async () => {
    const ledger = new SourceLedger(new InMemoryLedgerStore());
    const c = await ledger.grantConsent({
      userId: 1,
      scope: "bank_aggregation",
      grantedBy: 1,
      consentText: "I authorize read-only access to my bank accounts.",
    });
    expect(c.consentText).toMatch(/read-only/);
    expect(await ledger.hasConsent(1, "bank_aggregation")).toBe(true);
  });

  it("refuses a grant with no consent text", async () => {
    const ledger = new SourceLedger(new InMemoryLedgerStore());
    await expect(
      ledger.grantConsent({ userId: 1, scope: "x", grantedBy: 1, consentText: "  " }),
    ).rejects.toThrow(/verbatim text/);
  });

  it("treats a revoked consent as absent", async () => {
    const ledger = new SourceLedger(new InMemoryLedgerStore());
    const c = await ledger.grantConsent({
      userId: 1,
      scope: "bank_aggregation",
      grantedBy: 1,
      consentText: "ok",
    });
    await ledger.revokeConsent(1, c.id);
    expect(await ledger.hasConsent(1, "bank_aggregation")).toBe(false);
  });

  it("treats an expired consent as absent", async () => {
    const ledger = new SourceLedger(new InMemoryLedgerStore());
    await ledger.grantConsent({
      userId: 1,
      scope: "credit_soft_pull",
      grantedBy: 1,
      consentText: "ok",
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    });
    expect(await ledger.hasConsent(1, "credit_soft_pull")).toBe(false);
  });

  it("scopes consent to the user who granted it", async () => {
    const ledger = new SourceLedger(new InMemoryLedgerStore());
    await ledger.grantConsent({ userId: 1, scope: "s", grantedBy: 1, consentText: "ok" });
    expect(await ledger.hasConsent(2, "s")).toBe(false);
  });
});

/* ═══ Source records ═══════════════════════════════════════════════════════ */

describe("source records", () => {
  it("records a user-supplied value without consent", async () => {
    const ledger = new SourceLedger(new InMemoryLedgerStore());
    const r = await ledger.record({
      userId: 1,
      sourceType: "user",
      sourceName: "Advisor-entered property value",
      asOf: "2026-08-01",
    });
    expect(r.retrievedAt).toBeTruthy();
    expect(r.confidence).toBeLessThan(1);
  });

  it("REFUSES an external value with no consent scope", async () => {
    const ledger = new SourceLedger(new InMemoryLedgerStore());
    await expect(
      ledger.record({ userId: 1, sourceType: "api", sourceName: "AVM provider" }),
    ).rejects.toThrow(/requires a consentScope/);
  });

  it("REFUSES an external value when no live consent exists", async () => {
    const ledger = new SourceLedger(new InMemoryLedgerStore());
    await expect(
      ledger.record({
        userId: 1,
        sourceType: "api",
        sourceName: "AVM provider",
        consentScope: "market_data",
      }),
    ).rejects.toThrow(/No live consent/);
  });

  it("accepts an external value once consent is granted, and links it", async () => {
    const ledger = new SourceLedger(new InMemoryLedgerStore());
    const c = await ledger.grantConsent({
      userId: 1,
      scope: "market_data",
      grantedBy: 1,
      consentText: "ok",
    });
    const r = await ledger.record({
      userId: 1,
      sourceType: "api",
      sourceName: "AVM provider",
      consentScope: "market_data",
      extraction: { estimate: 500_000 },
    });
    expect(r.consentId).toBe(c.id);
    expect(r.contentHash).toBeTruthy();
  });

  it("is append-only", async () => {
    const store = new InMemoryLedgerStore();
    const rec = {
      id: "src_fixed",
      userId: 1,
      sourceType: "user" as const,
      sourceName: "x",
      retrievedAt: new Date().toISOString(),
      sensitivity: "confidential" as const,
      confidence: 1,
    };
    await store.putSource(rec);
    await expect(store.putSource(rec)).rejects.toThrow(/append-only/);
  });

  it("hashes content stably", () => {
    expect(hashContent({ a: 1 })).toBe(hashContent({ a: 1 }));
    expect(hashContent({ a: 1 })).not.toBe(hashContent({ a: 2 }));
  });
});

/* ═══ Staleness ════════════════════════════════════════════════════════════ */

describe("staleness", () => {
  const record = (asOf?: string) => ({
    id: "s",
    userId: 1,
    sourceType: "api" as const,
    sourceName: "x",
    asOf,
    retrievedAt: new Date().toISOString(),
    sensitivity: "confidential" as const,
    confidence: 1,
  });

  it("measures age from asOf, not from when we fetched it", () => {
    const now = new Date("2026-09-18");
    const r = record("2026-03-18");
    // Fetched today, but the value is six months old.
    expect(ageInDays(r, now)).toBeCloseTo(184, 0);
  });

  it("applies a different threshold per kind", () => {
    const now = new Date("2026-09-18");
    const r = record("2026-08-18"); // 31 days old
    expect(isStale(r, "rate", now).stale).toBe(true); // 7-day threshold
    expect(isStale(r, "property_value", now).stale).toBe(false); // 180-day
  });

  it("reports no age when the source gave no asOf", () => {
    expect(ageInDays(record(undefined))).toBeNull();
    expect(isStale(record(undefined)).stale).toBe(false);
  });
});

/* ═══ Redaction ════════════════════════════════════════════════════════════ */

describe("redactForLlm", () => {
  it("strips identifying fields", () => {
    const out = redactForLlm({
      name: "Maple Duplex",
      address: "123 Real Street",
      ssn: "000-00-0000",
      accountNumber: "1234567890",
      noi: 26_240,
    }) as Record<string, unknown>;
    expect(out.address).toBe("[REDACTED]");
    expect(out.ssn).toBe("[REDACTED]");
    expect(out.accountNumber).toBe("[REDACTED]");
    // The numbers an agent actually reasons over survive.
    expect(out.noi).toBe(26_240);
    expect(out.name).toBe("Maple Duplex");
  });

  it("recurses through nested objects and arrays", () => {
    const out = redactForLlm({
      properties: [{ id: "a", address: "secret", dscr: 1.4 }],
    }) as any;
    expect(out.properties[0].address).toBe("[REDACTED]");
    expect(out.properties[0].dscr).toBe(1.4);
  });

  it("is case-insensitive on key names", () => {
    const out = redactForLlm({ Address: "x", SSN: "y" }) as Record<string, unknown>;
    expect(out.Address).toBe("[REDACTED]");
    expect(out.SSN).toBe("[REDACTED]");
  });

  it("does not hang on a circular structure", () => {
    const a: Record<string, unknown> = { noi: 1 };
    a.self = a;
    const out = redactForLlm(a) as Record<string, unknown>;
    expect(out.self).toBe("[CIRCULAR]");
  });

  it("passes primitives through", () => {
    expect(redactForLlm(42)).toBe(42);
    expect(redactForLlm("x")).toBe("x");
    expect(redactForLlm(null)).toBeNull();
  });
});

/* ═══ Advisor review queue ═════════════════════════════════════════════════ */

const finding = (o: Partial<ReviewableFinding>): ReviewableFinding => ({
  id: "f",
  scenarioRunId: "r",
  findingCode: "X",
  severity: "medium",
  title: "t",
  confidence: 1,
  materiality: 1,
  requiredReviewer: "advisor",
  advisorStatus: "pending",
  ...o,
});

describe("advisor review queue", () => {
  it("ranks by severity weighted by confidence and materiality", () => {
    const queue = prioritizeReviewQueue([
      finding({ id: "shaky-critical", severity: "critical", confidence: 0.3, materiality: 0.2 }),
      finding({ id: "solid-high", severity: "high", confidence: 1, materiality: 1 }),
    ]);
    // A certain, material high beats a speculative, immaterial critical.
    expect(queue[0].id).toBe("solid-high");
  });

  it("shows only pending items", () => {
    const queue = prioritizeReviewQueue([
      finding({ id: "done", advisorStatus: "accepted", severity: "critical" }),
      finding({ id: "todo", severity: "low" }),
    ]);
    expect(queue.map((f) => f.id)).toEqual(["todo"]);
  });

  it("groups by the professional who must sign off", () => {
    const grouped = groupByReviewer([
      finding({ id: "a", requiredReviewer: "cpa" }),
      finding({ id: "b", requiredReviewer: "cpa" }),
      finding({ id: "c", requiredReviewer: "attorney" }),
    ]);
    expect(grouped.cpa).toHaveLength(2);
    expect(grouped.attorney).toHaveLength(1);
  });
});

describe("client release gate", () => {
  it("blocks release while a critical finding is unreviewed", () => {
    const gate = clientReleaseGate([finding({ severity: "critical" })]);
    expect(gate.releasable).toBe(false);
    expect(gate.blockers).toHaveLength(1);
  });

  it("releases once material findings have a decision — including rejection", () => {
    const gate = clientReleaseGate([
      finding({ severity: "critical", advisorStatus: "rejected" }),
      finding({ severity: "high", advisorStatus: "annotated" }),
    ]);
    expect(gate.releasable).toBe(true);
  });

  it("does not block on unreviewed low-severity findings", () => {
    expect(clientReleaseGate([finding({ severity: "low" })]).releasable).toBe(true);
  });

  it("explains itself", () => {
    expect(clientReleaseGate([finding({ severity: "critical" })]).reason).toMatch(/must be reviewed/);
  });
});

/* ═══ External data adapters (Sprint D) ════════════════════════════════════ */

describe("data channels", () => {
  it("defines every channel with a permitted use and a phase", () => {
    for (const spec of Object.values(CHANNELS)) {
      expect(spec.permittedUse.length).toBeGreaterThan(0);
      expect([1, 2, 3, 4]).toContain(spec.phase);
    }
  });

  it("is disabled by default", () => {
    expect(isChannelEnabled("rate_index", {})).toBe(false);
    expect(isChannelEnabled("rate_index", { RECIN_CHANNEL_RATE_INDEX: "1" })).toBe(true);
  });

  it("detects a missing credential", () => {
    expect(hasCredential(CHANNELS.rate_index, {})).toBe(false);
    expect(hasCredential(CHANNELS.rate_index, { RECIN_RATE_API_KEY: "k" })).toBe(true);
    // A channel needing no credential is trivially satisfied.
    expect(hasCredential(CHANNELS.property_schedule, {})).toBe(true);
  });

  it("marks nothing operational with a bare environment", () => {
    expect(channelStatus({}).every((c) => !c.operational)).toBe(true);
  });

  it("records the prohibited uses that must survive a change of maintainer", () => {
    expect(CHANNELS.lender_product_matrix.prohibitedUse).toMatch(/never a promise to lend/i);
    expect(CHANNELS.credit_soft_pull.prohibitedUse).toMatch(/protected/i);
    expect(CHANNELS.valuation_avm.prohibitedUse).toMatch(/appraisal/i);
    expect(EXCLUDED_PRACTICES.length).toBeGreaterThan(0);
  });
});

describe("adapters refuse rather than fabricate", () => {
  it("reports disabled when the flag is off", async () => {
    const r = await new RateIndexAdapter().fetch(undefined as never, { userId: 1, env: {} });
    expect(r.available).toBe(false);
    if (!r.available) expect(r.reason).toBe("disabled");
  });

  it("reports not_configured when enabled without a credential", async () => {
    const r = await new RateIndexAdapter().fetch(undefined as never, {
      userId: 1,
      env: { RECIN_CHANNEL_RATE_INDEX: "1" },
    });
    expect(r.available).toBe(false);
    if (!r.available) expect(r.reason).toBe("not_configured");
  });

  it("reports not_implemented once fully gated — never a made-up rate", async () => {
    const r = await new RateIndexAdapter().fetch(undefined as never, {
      userId: 1,
      env: { RECIN_CHANNEL_RATE_INDEX: "1", RECIN_RATE_API_KEY: "k" },
    });
    expect(r.available).toBe(false);
    if (!r.available) {
      expect(r.reason).toBe("not_implemented");
      expect(r.detail).toMatch(/No provider is wired/);
    }
  });

  it("blocks a consent-gated channel without a live grant", async () => {
    const ledger = new SourceLedger(new InMemoryLedgerStore());
    const r = await fetchThroughChannel("market_rent", undefined as never, {
      userId: 1,
      ledger,
      env: { RECIN_CHANNEL_MARKET_RENT: "1", RECIN_RENT_API_KEY: "k" },
    });
    expect(r.available).toBe(false);
    if (!r.available) expect(r.reason).toBe("no_consent");
  });

  it("returns an unavailable result for an unregistered channel rather than throwing", async () => {
    const r = await fetchThroughChannel("crm", undefined as never, { userId: 1, env: {} });
    expect(r.available).toBe(false);
    if (!r.available) expect(r.reason).toBe("not_implemented");
  });
});

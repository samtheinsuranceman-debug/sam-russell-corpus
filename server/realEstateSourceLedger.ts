/**
 * RECIN Source Ledger (Sprint C)
 *
 * Provenance and consent for every value that enters the financial graph.
 *
 * The rule this enforces: **no external value without a source record.** Every
 * figure that reaches a calculation must carry where it came from, when the
 * source said it was true, who consented to it being fetched, how confident we
 * are in it, and how sensitive it is. A recommendation built on an unattributed
 * number cannot be defended in review, and on a platform making financial
 * claims that is the only kind of recommendation that matters.
 *
 * Two things are deliberately separated because they are separate facts:
 *
 *   · `asOf`       — when the SOURCE says the value was true
 *   · `retrievedAt` — when we fetched it
 *
 * A property value from an appraisal dated eight months ago that we pulled this
 * morning is fresh data about a stale fact. Collapsing them into one timestamp
 * is how stale valuations silently inflate capacity.
 *
 * The store is injectable so the logic is testable without a database, and so
 * the same rules apply whether records land in MySQL, memory, or a test double.
 */

import { createHash } from "crypto";

/* ═══ Types ════════════════════════════════════════════════════════════════ */

export type SourceType = "user" | "advisor" | "document" | "api" | "derived";
export type Sensitivity = "public" | "confidential" | "restricted";

export interface SourceRecord {
  id: string;
  householdId?: number;
  userId: number;
  sourceType: SourceType;
  sourceName: string;
  sourceUri?: string;
  /** When the source says the value was true. */
  asOf?: string;
  /** When we fetched it. */
  retrievedAt: string;
  consentId?: string;
  sensitivity: Sensitivity;
  /** 0..1 */
  confidence: number;
  contentHash?: string;
  extraction?: unknown;
}

export interface ConsentRecord {
  id: string;
  householdId?: number;
  userId: number;
  /** e.g. "bank_aggregation", "credit_soft_pull", "accounting_feed". */
  scope: string;
  provider?: string;
  grantedBy: number;
  grantedAt: string;
  expiresAt?: string;
  revokedAt?: string;
  /** Verbatim text the person agreed to. */
  consentText: string;
}

export interface LedgerStore {
  putSource(record: SourceRecord): Promise<void>;
  listSources(userId: number): Promise<SourceRecord[]>;
  getSource(id: string): Promise<SourceRecord | undefined>;
  putConsent(record: ConsentRecord): Promise<void>;
  listConsents(userId: number): Promise<ConsentRecord[]>;
}

/* ═══ In-memory store (default; swap for a DB-backed one) ══════════════════ */

export class InMemoryLedgerStore implements LedgerStore {
  private sources = new Map<string, SourceRecord>();
  private consents = new Map<string, ConsentRecord>();

  async putSource(record: SourceRecord): Promise<void> {
    // Append-only: a source record is a historical fact and is never edited.
    if (this.sources.has(record.id)) {
      throw new Error(`Source ${record.id} already exists — the ledger is append-only`);
    }
    this.sources.set(record.id, record);
  }
  async listSources(userId: number): Promise<SourceRecord[]> {
    return Array.from(this.sources.values()).filter((s) => s.userId === userId);
  }
  async getSource(id: string): Promise<SourceRecord | undefined> {
    return this.sources.get(id);
  }
  async putConsent(record: ConsentRecord): Promise<void> {
    this.consents.set(record.id, record);
  }
  async listConsents(userId: number): Promise<ConsentRecord[]> {
    return Array.from(this.consents.values()).filter((c) => c.userId === userId);
  }
}

/* ═══ Helpers ══════════════════════════════════════════════════════════════ */

let seq = 0;
const nextId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${(++seq).toString(36)}`;

/** Stable hash of extracted content, so a re-fetch of identical data is visible. */
export function hashContent(value: unknown): string {
  const text = typeof value === "string" ? value : JSON.stringify(value) ?? "";
  return createHash("sha256").update(text).digest("hex").slice(0, 32);
}

/** Age of a value in days, measured from `asOf` — not from when we fetched it. */
export function ageInDays(record: SourceRecord, now = new Date()): number | null {
  if (!record.asOf) return null;
  const asOf = new Date(record.asOf).getTime();
  if (!Number.isFinite(asOf)) return null;
  return Math.max(0, (now.getTime() - asOf) / 86_400_000);
}

/**
 * Staleness thresholds by what the value is. A property value ages fast; an
 * adjusted basis essentially does not age at all.
 */
export const STALENESS_DAYS: Record<string, number> = {
  property_value: 180,
  market_rent: 90,
  rate: 7,
  insurance_premium: 365,
  operating_statement: 120,
  lien_balance: 45,
  credit: 90,
  default: 365,
};

export function isStale(
  record: SourceRecord,
  kind = "default",
  now = new Date(),
): { stale: boolean; ageDays: number | null; thresholdDays: number } {
  const thresholdDays = STALENESS_DAYS[kind] ?? STALENESS_DAYS.default;
  const ageDays = ageInDays(record, now);
  return { stale: ageDays !== null && ageDays > thresholdDays, ageDays, thresholdDays };
}

/* ═══ Ledger ═══════════════════════════════════════════════════════════════ */

export class SourceLedger {
  constructor(private readonly store: LedgerStore = new InMemoryLedgerStore()) {}

  /** Record a consent grant. Required before any external channel is used. */
  async grantConsent(input: {
    userId: number;
    householdId?: number;
    scope: string;
    provider?: string;
    grantedBy: number;
    consentText: string;
    expiresAt?: string;
  }): Promise<ConsentRecord> {
    if (!input.consentText.trim()) {
      throw new Error("Consent requires the verbatim text the person agreed to");
    }
    const record: ConsentRecord = {
      id: nextId("consent"),
      householdId: input.householdId,
      userId: input.userId,
      scope: input.scope,
      provider: input.provider,
      grantedBy: input.grantedBy,
      grantedAt: new Date().toISOString(),
      expiresAt: input.expiresAt,
      consentText: input.consentText,
    };
    await this.store.putConsent(record);
    return record;
  }

  async revokeConsent(userId: number, consentId: string): Promise<boolean> {
    const all = await this.store.listConsents(userId);
    const found = all.find((c) => c.id === consentId);
    if (!found) return false;
    await this.store.putConsent({ ...found, revokedAt: new Date().toISOString() });
    return true;
  }

  /** Is there a live, unexpired, unrevoked consent for this scope? */
  async hasConsent(userId: number, scope: string, now = new Date()): Promise<boolean> {
    const all = await this.store.listConsents(userId);
    return all.some((c) => {
      if (c.scope !== scope) return false;
      if (c.revokedAt) return false;
      if (c.expiresAt && new Date(c.expiresAt).getTime() < now.getTime()) return false;
      return true;
    });
  }

  /**
   * Record a value's provenance.
   *
   * External channels (`api`, `document`) REQUIRE a live consent for their
   * scope. This is the gate, not a suggestion: without it the record is
   * refused and the value never reaches a calculation.
   */
  async record(input: {
    userId: number;
    householdId?: number;
    sourceType: SourceType;
    sourceName: string;
    sourceUri?: string;
    asOf?: string;
    sensitivity?: Sensitivity;
    confidence?: number;
    extraction?: unknown;
    /** Consent scope this fetch relies on. Required for api/document sources. */
    consentScope?: string;
  }): Promise<SourceRecord> {
    const needsConsent = input.sourceType === "api" || input.sourceType === "document";

    let consentId: string | undefined;
    if (needsConsent) {
      if (!input.consentScope) {
        throw new Error(
          `A ${input.sourceType} source requires a consentScope — external data cannot be ingested without recorded consent`,
        );
      }
      const consents = await this.store.listConsents(input.userId);
      const live = consents.find(
        (c) =>
          c.scope === input.consentScope &&
          !c.revokedAt &&
          (!c.expiresAt || new Date(c.expiresAt).getTime() >= Date.now()),
      );
      if (!live) {
        throw new Error(
          `No live consent for scope "${input.consentScope}" — refusing to record an external value`,
        );
      }
      consentId = live.id;
    }

    const confidence = Math.max(0, Math.min(1, input.confidence ?? defaultConfidence(input.sourceType)));

    const record: SourceRecord = {
      id: nextId("src"),
      householdId: input.householdId,
      userId: input.userId,
      sourceType: input.sourceType,
      sourceName: input.sourceName,
      sourceUri: input.sourceUri,
      asOf: input.asOf,
      retrievedAt: new Date().toISOString(),
      consentId,
      sensitivity: input.sensitivity ?? "confidential",
      confidence,
      contentHash: input.extraction !== undefined ? hashContent(input.extraction) : undefined,
      extraction: input.extraction,
    };
    await this.store.putSource(record);
    return record;
  }

  async list(userId: number): Promise<SourceRecord[]> {
    return this.store.listSources(userId);
  }

  async get(id: string): Promise<SourceRecord | undefined> {
    return this.store.getSource(id);
  }

  async consents(userId: number): Promise<ConsentRecord[]> {
    return this.store.listConsents(userId);
  }

  /**
   * The evidence-ledger view: every source with its age and staleness verdict.
   * This is what backs the "why this observation exists" panel.
   */
  async evidenceView(
    userId: number,
    kindByRecordId: Record<string, string> = {},
    now = new Date(),
  ): Promise<
    (SourceRecord & { ageDays: number | null; stale: boolean; thresholdDays: number })[]
  > {
    const sources = await this.store.listSources(userId);
    return sources.map((s) => {
      const { stale, ageDays, thresholdDays } = isStale(s, kindByRecordId[s.id] ?? "default", now);
      return { ...s, ageDays, stale, thresholdDays };
    });
  }
}

function defaultConfidence(type: SourceType): number {
  switch (type) {
    case "advisor":
      return 0.9;
    case "document":
      return 0.85;
    case "api":
      return 0.8;
    case "user":
      return 0.7;
    case "derived":
      return 0.75;
  }
}

/* ═══ Redaction ════════════════════════════════════════════════════════════ */

const REDACTED = "[REDACTED]";
const SENSITIVE_KEYS = [
  "address",
  "addressencrypted",
  "ssn",
  "taxid",
  "accountnumber",
  "routingnumber",
  "dob",
  "dateofbirth",
  "email",
  "phone",
  "fullname",
];

/**
 * Strip identifying detail before anything is handed to an LLM.
 *
 * Privacy by design, per blueprint §13.9: agents reason over ratios and
 * findings, and never need a street address or an account number to do it.
 * Recurses through objects and arrays, and refuses to follow cycles.
 */
export function redactForLlm<T>(value: T, seen = new WeakSet<object>()): T {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value as object)) return "[CIRCULAR]" as unknown as T;
  seen.add(value as object);

  if (Array.isArray(value)) {
    return value.map((v) => redactForLlm(v, seen)) as unknown as T;
  }

  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
      out[key] = REDACTED;
    } else {
      out[key] = redactForLlm(v, seen);
    }
  }
  return out as T;
}

/* ═══ Advisor review queue ═════════════════════════════════════════════════ */

export type AdvisorStatus = "pending" | "accepted" | "rejected" | "annotated" | "escalated";

export interface ReviewableFinding {
  id: string;
  scenarioRunId: string;
  findingCode: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  confidence: number;
  materiality: number;
  requiredReviewer: "advisor" | "cpa" | "attorney" | "lender" | "compliance" | "insurance";
  advisorStatus: AdvisorStatus;
  advisorNote?: string;
  reviewedBy?: number;
  reviewedAt?: string;
}

const SEVERITY_ORDER = { critical: 4, high: 3, medium: 2, low: 1, info: 0 } as const;

/**
 * Order the review queue by what actually needs a human first.
 *
 * Severity alone is the wrong sort: a critical finding with 0.3 confidence and
 * low materiality should not outrank a high-severity one that is certain and
 * moves the whole outcome. Priority multiplies severity by confidence and
 * materiality, so the queue surfaces what is both serious AND well-founded.
 */
export function prioritizeReviewQueue(findings: ReviewableFinding[]): ReviewableFinding[] {
  const pending = findings.filter((f) => f.advisorStatus === "pending");
  return [...pending].sort((a, b) => {
    const pa = SEVERITY_ORDER[a.severity] * a.confidence * a.materiality;
    const pb = SEVERITY_ORDER[b.severity] * b.confidence * b.materiality;
    if (pb !== pa) return pb - pa;
    return SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity];
  });
}

/** Findings grouped by the professional who has to sign them off. */
export function groupByReviewer(
  findings: ReviewableFinding[],
): Record<string, ReviewableFinding[]> {
  const out: Record<string, ReviewableFinding[]> = {};
  for (const f of findings) {
    (out[f.requiredReviewer] ??= []).push(f);
  }
  return out;
}

/**
 * Can this scenario be shown to a client yet?
 *
 * No, while any critical finding is still unreviewed. An advisor may reject or
 * annotate a finding — that is a decision on the record — but silence is not a
 * decision, and an unreviewed critical finding must not reach a client.
 */
export function clientReleaseGate(findings: ReviewableFinding[]): {
  releasable: boolean;
  blockers: ReviewableFinding[];
  reason: string;
} {
  const blockers = findings.filter(
    (f) =>
      (f.severity === "critical" || f.severity === "high") && f.advisorStatus === "pending",
  );
  return {
    releasable: blockers.length === 0,
    blockers,
    reason:
      blockers.length === 0
        ? "All material findings have been reviewed."
        : `${blockers.length} unreviewed ${blockers.length === 1 ? "finding" : "findings"} of high or critical severity must be reviewed before this reaches a client.`,
  };
}

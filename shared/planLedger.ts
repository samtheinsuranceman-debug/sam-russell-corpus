// ============================================================
// THE PLAN LEDGER — pure logic (no database, no crypto), shared by client
// and server.
//
// The Plan is a ledger, not a set of pages: one append-only record per
// household of every fact, assumption, decision, message, document, journey
// step and outcome, each with a time and a source. Pages, PDFs, journeys and
// messages are projections of it. This module knows how to:
//   - diff two assessments into fact events (one per changed field)
//   - replay fact events into the assessment as it stood at any moment
//   - describe an event in one human line
// Hashing and storage live in server/ledgerDb.ts.
// ============================================================
import { FACT_FINDER_SECTIONS, emptyFactFinder, type ClientFactFinder, type FieldValue } from "./clientFactFinder";

export const LEDGER_KINDS = ["fact", "assumption", "decision", "message", "document", "outcome", "scenario", "journey", "status", "note", "consent", "mandate", "advice", "control", "automation", "rules"] as const;
export type LedgerKind = (typeof LEDGER_KINDS)[number];
export const LEDGER_SOURCES = ["client", "advisor", "automation", "aggregator", "ai", "system"] as const;
export type LedgerSource = (typeof LEDGER_SOURCES)[number];

export type LedgerEventInput = {
  kind: LedgerKind;
  source: LedgerSource;
  /** dotted path for facts ("income.w2Income", "lists.properties") or a stable id for other kinds */
  key?: string | null;
  /** human label for the key (field label, page title, template name) */
  label?: string | null;
  value?: unknown;
  prevValue?: unknown;
  summary: string;
  actorName?: string | null;
  occurredAt?: Date;
  userId?: number | null;
  clientId?: number | null;
  leadId?: number | null;
  workspaceId?: number | null;
};

export type LedgerEvent = Required<Pick<LedgerEventInput, "kind" | "source" | "summary">> & {
  id: number;
  subject: string;
  seq: number;
  key: string | null;
  label: string | null;
  value: unknown;
  prevValue: unknown;
  actorName: string | null;
  occurredAt: Date;
  userId: number | null;
  clientId: number | null;
  leadId: number | null;
  workspaceId: number | null;
  prevHash: string;
  hash: string;
  createdAt: Date;
};

/** The chain a subject's events live on: a signed-in client, an advisor's client record, or a lead. */
export function ledgerSubject(ids: { userId?: number | null; clientId?: number | null; leadId?: number | null }): string {
  if (ids.clientId) return `c:${ids.clientId}`;
  if (ids.userId) return `u:${ids.userId}`;
  if (ids.leadId) return `l:${ids.leadId}`;
  return "system";
}

/** Deterministic string of the parts that matter, for hashing and equality. Key order is fixed. */
export function canonicalEvent(e: { subject: string; seq: number; kind: string; source: string; key: string | null; value: unknown; prevValue: unknown; summary: string; occurredAt: Date }): string {
  return JSON.stringify([e.subject, e.seq, e.kind, e.source, e.key ?? null, stable(e.value ?? null), stable(e.prevValue ?? null), e.summary, e.occurredAt.toISOString()]);
}
function stable(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(stable);
  if (v && typeof v === "object") return Object.fromEntries(Object.keys(v as Record<string, unknown>).sort().map((k) => [k, stable((v as Record<string, unknown>)[k])]));
  return v;
}

// ─── Facts: diff two assessments ────────────────────────────────────────────
const FIELD_LABELS: Record<string, string> = {};
for (const s of FACT_FINDER_SECTIONS) for (const f of s.fields) FIELD_LABELS[`${s.id}.${f.key}`] = `${s.title} · ${f.label}`;
const LIST_LABELS: Record<string, string> = {};
for (const s of FACT_FINDER_SECTIONS) if (s.list) LIST_LABELS[`lists.${s.list.key}`] = `${s.title} · ${s.list.label}`;

export function factLabel(key: string): string {
  return FIELD_LABELS[key] ?? LIST_LABELS[key] ?? key;
}

function normalize(v: FieldValue | undefined): FieldValue {
  if (v === undefined || v === "") return null;
  return v;
}

/**
 * One fact event per field whose value changed between two assessments.
 * Lists (properties, policies …) are compared whole. Nothing is emitted for
 * unchanged fields, so a save that changes nothing writes nothing.
 */
export function diffFactFinder(prev: ClientFactFinder | null | undefined, next: ClientFactFinder, source: LedgerSource = "client"): LedgerEventInput[] {
  const before = prev ?? emptyFactFinder();
  const out: LedgerEventInput[] = [];
  const sectionIds = new Set([...Object.keys(before.sections ?? {}), ...Object.keys(next.sections ?? {})]);
  for (const sid of Array.from(sectionIds).sort()) {
    const a = before.sections?.[sid] ?? {};
    const b = next.sections?.[sid] ?? {};
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of Array.from(keys).sort()) {
      const pv = normalize(a[k]);
      const nv = normalize(b[k]);
      if (pv === nv) continue;
      const key = `${sid}.${k}`;
      out.push({ kind: "fact", source, key, label: factLabel(key), value: nv, prevValue: pv, summary: describeFact(key, pv, nv) });
    }
  }
  const listKeys = new Set([...Object.keys(before.lists ?? {}), ...Object.keys(next.lists ?? {})]);
  for (const lk of Array.from(listKeys).sort()) {
    const a = before.lists?.[lk] ?? [];
    const b = next.lists?.[lk] ?? [];
    if (JSON.stringify(stable(a)) === JSON.stringify(stable(b))) continue;
    const key = `lists.${lk}`;
    out.push({ kind: "fact", source, key, label: factLabel(key), value: b, prevValue: a, summary: `${factLabel(key)}: ${a.length} → ${b.length} ${b.length === 1 ? "entry" : "entries"}` });
  }
  return out;
}

export function formatFactValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return Math.abs(v) >= 1000 ? v.toLocaleString("en-US") : String(v);
  if (Array.isArray(v)) return `${v.length} ${v.length === 1 ? "entry" : "entries"}`;
  if (typeof v === "object") return JSON.stringify(v);
  return String(v).length > 80 ? `${String(v).slice(0, 77)}…` : String(v);
}

export function describeFact(key: string, prev: unknown, next: unknown): string {
  const label = factLabel(key);
  if (prev === null || prev === undefined) return `${label} set to ${formatFactValue(next)}`;
  if (next === null || next === undefined) return `${label} cleared (was ${formatFactValue(prev)})`;
  return `${label}: ${formatFactValue(prev)} → ${formatFactValue(next)}`;
}

// ─── Replay: the assessment as it stood at any moment ───────────────────────
/**
 * Apply fact events in order (ascending seq) up to and including `asOf`
 * (or all of them). "assessment.reset" status events clear everything.
 */
export function replayFacts(events: Array<Pick<LedgerEvent, "kind" | "key" | "value" | "occurredAt" | "seq">>, asOf?: Date): ClientFactFinder {
  const ff = emptyFactFinder();
  const ordered = [...events].sort((a, b) => a.seq - b.seq);
  for (const e of ordered) {
    if (asOf && e.occurredAt.getTime() > asOf.getTime()) break;
    if (e.kind === "status" && e.key === "assessment.reset") {
      for (const k of Object.keys(ff.sections)) ff.sections[k] = {};
      ff.lists = {};
      continue;
    }
    if (e.kind !== "fact" || !e.key) continue;
    if (e.key.startsWith("lists.")) {
      const lk = e.key.slice("lists.".length);
      if (Array.isArray(e.value)) ff.lists[lk] = e.value as ClientFactFinder["lists"][string];
      else delete ff.lists[lk];
      continue;
    }
    const dot = e.key.indexOf(".");
    if (dot < 0) continue;
    const sid = e.key.slice(0, dot);
    const fk = e.key.slice(dot + 1);
    ff.sections[sid] ??= {};
    if (e.value === null || e.value === undefined) delete ff.sections[sid]![fk];
    else ff.sections[sid]![fk] = e.value as FieldValue;
  }
  return ff;
}

/** Group events by calendar day (local ISO date) for timelines. */
export function groupByDay<T extends { occurredAt: Date }>(events: T[]): Array<{ day: string; events: T[] }> {
  const map = new Map<string, T[]>();
  for (const e of events) {
    const d = e.occurredAt.toISOString().slice(0, 10);
    if (!map.has(d)) map.set(d, []);
    map.get(d)!.push(e);
  }
  return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([day, evs]) => ({ day, events: evs }));
}

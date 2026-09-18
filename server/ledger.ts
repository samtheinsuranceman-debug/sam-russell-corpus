// ============================================================
// THE PLAN LEDGER — writers. Every place the platform learns a fact, makes
// a decision, sends a message, builds a journey or changes a status calls
// one of these. They never throw: a ledger write must not break the action
// it records.
// ============================================================
import type { ClientFactFinder } from "@shared/clientFactFinder";
import { diffFactFinder, type LedgerEventInput, type LedgerSource } from "@shared/planLedger";
import { appendEvents } from "./ledgerDb";
import { fanOut } from "./eventBus";

type Ids = { userId?: number | null; clientId?: number | null; leadId?: number | null; workspaceId?: number | null };

async function safeAppend(events: LedgerEventInput[]): Promise<number> {
  let written = 0;
  try { written = await appendEvents(events); }
  catch (error) { console.warn("[Ledger] append failed:", String(error).slice(0, 200)); }
  // The outside world hears every event (Zapier, Make, n8n, Slack, any URL) —
  // fire-and-forget, so a slow receiver never slows the site.
  if (events.length) void fanOut(events).catch(() => undefined);
  // The plan runtime reacts to what just happened (imported lazily: the
  // runtime writes ledger events itself, so a static import would be a cycle).
  if (written > 0) void import("./automations").then((m) => m.runAutomations(events)).catch(() => undefined);
  return written;
}

/** Facts: the diff between the previous and the new assessment, one event per changed field. */
export async function recordAssessmentChange(ids: Ids, prev: ClientFactFinder | null | undefined, next: ClientFactFinder, source: LedgerSource = "client", actorName?: string | null): Promise<number> {
  const facts = diffFactFinder(prev, next, source).map((e) => ({ ...e, ...ids, actorName: actorName ?? null }));
  return safeAppend(facts);
}

export async function recordEvent(e: LedgerEventInput): Promise<number> {
  return safeAppend([e]);
}

export function assessmentResetEvent(ids: Ids, actorName?: string | null): LedgerEventInput {
  return { kind: "status", source: "client", key: "assessment.reset", label: "Financial Assessment", summary: "Financial Assessment reset — all answers cleared", actorName: actorName ?? null, ...ids };
}

// ============================================================
// EVENT-DRIVEN PLAN RUNTIME — the plan reacts to verified events.
//
// An automation says: when an event of this kind (and key, and source)
// lands on my ledger, do this action. Actions are authorised (money goes
// through the Fiduciary Transaction Firewall under the automation's own
// mandate), idempotent (one run per automation per event, keyed by the
// event's content hash), and reversible where the action allows it (a money
// movement inside its reversal window). Every run is itself an "automation"
// event on the ledger. Events written by automations never trigger
// automations, so a loop cannot form.
//
// Outside systems deliver verified events to POST /api/events/inbound,
// signed with EVENT_WEBHOOK_SECRET (or INBOUND_EVENT_SECRET) — cash received,
// claim approved, threshold crossed — and the runtime treats them like any
// other ledger event.
// ============================================================
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { Express, Request, Response } from "express";
import { canonicalEvent, ledgerSubject, type LedgerEventInput } from "@shared/planLedger";
import type { MovementAction } from "@shared/firewall";
import { insertRun, listAutomations, getRun, updateRun, type AutomationRow, type Ids } from "./controlsDb";
import { proposeMovement, reverseMovement } from "./firewall";
import { recordEvent } from "./ledger";
import { deliver } from "./messaging";

export type ActionType = "notify" | "propose_movement" | "append_status";

export type NotifyParams = { channel: "email" | "sms"; to: string; subject?: string; body: string };
export type MovementParams = { action: MovementAction; amountCents: number; fromAccount?: string; toAccount?: string; counterparty?: string; purpose: string; agentId?: string };
export type StatusParams = { key: string; summary: string };

/** Does this automation's trigger match the event? Keys support a trailing "*" wildcard. */
export function triggerMatches(a: Pick<AutomationRow, "triggerKind" | "triggerKey" | "triggerSource">, e: Pick<LedgerEventInput, "kind" | "key" | "source">): boolean {
  if (a.triggerKind !== e.kind) return false;
  if (a.triggerSource && a.triggerSource !== e.source) return false;
  if (!a.triggerKey) return true;
  const k = e.key ?? "";
  if (a.triggerKey.endsWith("*")) return k.startsWith(a.triggerKey.slice(0, -1));
  return k === a.triggerKey;
}

/** Substitute {{summary}}, {{key}}, {{value}}, {{label}} in action text. */
export function fillTemplate(text: string, e: LedgerEventInput): string {
  const val = e.value == null ? "" : typeof e.value === "object" ? JSON.stringify(e.value) : String(e.value);
  return text.replace(/\{\{\s*(summary|key|value|label|kind|source)\s*\}\}/g, (_, k: string) => ({ summary: e.summary, key: e.key ?? "", value: val, label: e.label ?? "", kind: e.kind, source: e.source }[k] ?? ""));
}

export function eventHash(e: LedgerEventInput): string {
  const subject = ledgerSubject(e);
  const occurredAt = new Date(Math.floor((e.occurredAt ?? new Date()).getTime() / 1000) * 1000);
  return createHash("sha256").update(canonicalEvent({ subject, seq: 0, kind: e.kind, source: e.source, key: e.key ?? null, value: e.value ?? null, prevValue: e.prevValue ?? null, summary: e.summary, occurredAt })).digest("hex");
}

export type RunOutcome = { automationId: number; status: "ran" | "skipped" | "failed"; reversible: boolean; detail: string; movementId: number | null };

/** Run every matching automation for these freshly appended events. Never throws. */
export async function runAutomations(events: LedgerEventInput[]): Promise<RunOutcome[]> {
  const out: RunOutcome[] = [];
  for (const e of events) {
    if (e.source === "automation" || e.kind === "automation") continue;
    const ids: Ids = { userId: e.userId ?? null, clientId: e.clientId ?? null, leadId: e.leadId ?? null, workspaceId: e.workspaceId ?? null };
    const subject = ledgerSubject(ids);
    let autos: AutomationRow[] = [];
    try { autos = await listAutomations(subject, { enabledOnly: true }); } catch { continue; }
    for (const a of autos.filter((x) => triggerMatches(x, e))) {
      const hash = eventHash(e);
      let runId: number | null = null;
      try { runId = await insertRun({ automationId: a.id, subject, eventHash: hash, status: "ran", reversible: false, movementId: null, result: null }); }
      catch { continue; }
      if (runId === null) { out.push({ automationId: a.id, status: "skipped", reversible: false, detail: "already ran for this event", movementId: null }); continue; }
      try {
        const r = await performAction(a, e, ids);
        await updateRun(runId, { status: "ran", reversible: r.reversible, movementId: r.movementId, result: { detail: r.detail } });
        await recordEvent({ kind: "automation", source: "automation", key: `automation.${a.id}.run`, label: a.name, value: { runId, automationId: a.id, trigger: { kind: e.kind, key: e.key ?? null }, action: a.actionType, reversible: r.reversible, movementId: r.movementId }, summary: `Automation "${a.name}" ran on ${e.kind}${e.key ? ` ${e.key}` : ""}: ${r.detail}`, ...ids });
        out.push({ automationId: a.id, status: "ran", reversible: r.reversible, detail: r.detail, movementId: r.movementId });
      } catch (err) {
        const detail = String(err).slice(0, 300);
        await updateRun(runId, { status: "failed", result: { error: detail } }).catch(() => undefined);
        await recordEvent({ kind: "automation", source: "automation", key: `automation.${a.id}.failed`, label: a.name, value: { runId, automationId: a.id, error: detail }, summary: `Automation "${a.name}" failed: ${detail}`, ...ids }).catch(() => undefined);
        out.push({ automationId: a.id, status: "failed", reversible: false, detail, movementId: null });
      }
    }
  }
  return out;
}

async function performAction(a: AutomationRow, e: LedgerEventInput, ids: Ids): Promise<{ detail: string; reversible: boolean; movementId: number | null }> {
  const params = (a.actionParams ?? {}) as Record<string, unknown>;
  if (a.actionType === "notify") {
    const p = params as unknown as NotifyParams;
    const to = p.to === "owner" ? (process.env.LEAD_NOTIFY_EMAIL || process.env.OWNER_EMAIL || "") : p.to;
    if (!to) return { detail: "no recipient configured", reversible: false, movementId: null };
    const r = await deliver({ channel: p.channel, to, subject: p.subject ? fillTemplate(p.subject, e) : `Plan update: ${e.summary.slice(0, 80)}`, body: fillTemplate(p.body, e), category: "transactional", template: `automation:${a.id}`, clientId: ids.clientId ?? null, leadId: ids.leadId ?? null, userId: ids.userId ?? null, workspaceId: ids.workspaceId ?? null, actorName: `automation:${a.name}` });
    return { detail: r.sent ? `notified ${p.channel} via ${r.via}` : `notification not sent (${r.reason ?? "unknown"})`, reversible: false, movementId: null };
  }
  if (a.actionType === "propose_movement") {
    const p = params as unknown as MovementParams;
    const r = await proposeMovement(ids, {
      proposedBy: `automation:${a.id}`, proposedByName: a.name, isAgent: true, agentId: p.agentId ?? `automation:${a.id}`,
      action: p.action, amountCents: Number(p.amountCents), fromAccount: p.fromAccount ?? null, toAccount: p.toAccount ?? null, counterparty: p.counterparty ?? null,
      purpose: fillTemplate(p.purpose, e), idempotencyKey: `auto:${a.id}:${eventHash(e).slice(0, 24)}`,
    });
    return { detail: `movement ${r.movementId ?? "(duplicate)"} ${r.status}: ${r.verdict.reasons.join("; ")}`, reversible: r.status === "executed", movementId: r.movementId };
  }
  const p = params as unknown as StatusParams;
  await recordEvent({ kind: "status", source: "automation", key: fillTemplate(p.key, e).slice(0, 120), label: a.name, summary: fillTemplate(p.summary, e).slice(0, 2000), ...ids });
  return { detail: "status appended", reversible: false, movementId: null };
}

/** Undo a run where the action allows it (a money movement inside its window). */
export async function reverseRun(ids: Ids, runId: number, byName: string | null, reason: string): Promise<{ ok: boolean; detail: string }> {
  const subject = ledgerSubject(ids);
  const run = await getRun(runId, subject);
  if (!run) return { ok: false, detail: "run not found" };
  if (run.status === "reversed") return { ok: false, detail: "already reversed" };
  if (!run.reversible || !run.movementId) return { ok: false, detail: "this action is not reversible (notifications and status entries cannot be unsent)" };
  await reverseMovement(ids, run.movementId, byName, reason);
  await updateRun(runId, { status: "reversed", reversedAt: new Date() });
  return { ok: true, detail: `movement ${run.movementId} reversed` };
}

// ─── Inbound verified events ─────────────────────────────────────────────────
export function inboundSecret(env: NodeJS.ProcessEnv = process.env): string {
  return env.INBOUND_EVENT_SECRET || env.EVENT_WEBHOOK_SECRET || "";
}

export function verifyInboundSignature(body: string, signature: string | undefined, secret: string): boolean {
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const a = Buffer.from(expected, "hex"), b = Buffer.from(signature.trim().toLowerCase(), "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function registerEventRoutes(app: Express): void {
  app.post("/api/events/inbound", async (req: Request, res: Response) => {
    const secret = inboundSecret();
    if (!secret) { res.status(404).json({ error: "Inbound events not enabled (set INBOUND_EVENT_SECRET or EVENT_WEBHOOK_SECRET)" }); return; }
    const raw = typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {});
    if (!verifyInboundSignature(raw, req.get("x-rcs-signature"), secret)) { res.status(401).json({ error: "Bad signature" }); return; }
    const b = (typeof req.body === "string" ? JSON.parse(req.body) : req.body ?? {}) as { subject?: { clientId?: number; userId?: number; leadId?: number; workspaceId?: number }; kind?: string; key?: string; summary?: string; value?: unknown; source?: string; occurredAt?: string };
    const ids: Ids = { clientId: b.subject?.clientId ?? null, userId: b.subject?.userId ?? null, leadId: b.subject?.leadId ?? null, workspaceId: b.subject?.workspaceId ?? null };
    if (!ids.clientId && !ids.userId && !ids.leadId) { res.status(400).json({ error: "subject.clientId, subject.userId or subject.leadId is required" }); return; }
    const kind = b.kind === "outcome" ? "outcome" : "status";
    const source = b.source === "aggregator" ? "aggregator" : "system";
    if (!b.key || !b.summary) { res.status(400).json({ error: "key and summary are required" }); return; }
    const occurredAt = b.occurredAt ? new Date(b.occurredAt) : new Date();
    await recordEvent({ kind, source, key: String(b.key).slice(0, 120), label: "Inbound event", value: b.value ?? null, summary: String(b.summary).slice(0, 2000), occurredAt: Number.isNaN(occurredAt.getTime()) ? new Date() : occurredAt, ...ids });
    res.json({ recorded: true });
  });
}

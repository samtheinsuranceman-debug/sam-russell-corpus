// ============================================================
// FIDUCIARY TRANSACTION FIREWALL — server side. Takes a proposed money
// movement, gathers the client's policy (the latest "policy.firewall"
// status event on their ledger), the proposer's mandate, what that agent has
// already moved this period and the payees already known, asks the pure
// evaluator, stores the movement with its verdict, and appends a "control"
// event. Allowed movements from mandated agents execute at once (ledger-
// recorded; live rails attach here later) inside a reversal window; held
// ones wait for a person; blocked ones never move.
// ============================================================
import { TRPCError } from "@trpc/server";
import { DEFAULT_POLICY, evaluateMovement, mergePolicy, describeVerdict, type FirewallPolicy, type MovementAction, type FirewallVerdict } from "@shared/firewall";
import { ledgerSubject } from "@shared/planLedger";
import { listEvents } from "./ledgerDb";
import { recordEvent } from "./ledger";
import { activeMandate, getMovement, insertMovement, knownPayees, listMovements, spentInPeriod, updateMovement, type Ids, type MovementRow } from "./controlsDb";

export const POLICY_KEY = "policy.firewall";

export async function currentPolicy(subject: string): Promise<FirewallPolicy> {
  const events = await listEvents(subject, { kinds: ["status"], limit: 2000 });
  const latest = events.find((e) => e.key === POLICY_KEY);
  return mergePolicy((latest?.value as Partial<FirewallPolicy> | null) ?? null);
}

export async function setPolicy(ids: Ids, policy: Partial<FirewallPolicy>, actorName?: string | null): Promise<FirewallPolicy> {
  const merged = mergePolicy(policy);
  await recordEvent({ kind: "status", source: "client", key: POLICY_KEY, label: "Transaction firewall policy", value: merged, prevValue: null, summary: `Firewall policy set: ${policySummary(merged)}`, actorName: actorName ?? null, ...ids });
  return merged;
}

export function policySummary(p: FirewallPolicy): string {
  const parts = [p.requireMandate ? "agents need a mandate" : "agents need no mandate"];
  if (p.holdAboveCents != null) parts.push(`hold above $${Math.round(p.holdAboveCents / 100).toLocaleString("en-US")}`);
  if (p.newPayeeCoolingHours) parts.push(`new payees wait ${p.newPayeeCoolingHours}h`);
  if (p.reserveFloorCents != null) parts.push(`reserve floor $${Math.round(p.reserveFloorCents / 100).toLocaleString("en-US")}`);
  if (p.blockedCounterparties.length) parts.push(`${p.blockedCounterparties.length} blocked`);
  if (p.conflictParties.length) parts.push(`${p.conflictParties.length} conflict-flagged`);
  parts.push(`${p.reversalWindowHours}h reversal window`);
  return parts.join(", ");
}

export type ProposeInput = {
  proposedBy: string;
  proposedByName?: string | null;
  isAgent: boolean;
  agentId?: string | null;
  action: MovementAction;
  amountCents: number;
  fromAccount?: string | null;
  toAccount?: string | null;
  counterparty?: string | null;
  purpose: string;
  idempotencyKey?: string | null;
  availableBalanceCents?: number | null;
};

export type ProposeResult = { movementId: number | null; verdict: FirewallVerdict; status: MovementRow["status"]; duplicate: boolean };

const money = (c: number) => (c / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export async function proposeMovement(ids: Ids, input: ProposeInput): Promise<ProposeResult> {
  const subject = ledgerSubject(ids);
  const now = new Date();
  const policy = await currentPolicy(subject);
  const agentId = input.isAgent ? (input.agentId ?? input.proposedBy) : null;
  const mandate = agentId ? await activeMandate(subject, agentId, input.action, now) : null;
  const spent = agentId && mandate?.periodDays ? await spentInPeriod(subject, agentId, mandate.periodDays, now) : 0;
  const payees = await knownPayees(subject);
  const verdict = evaluateMovement(
    { action: input.action, amountCents: input.amountCents, fromAccount: input.fromAccount, toAccount: input.toAccount, counterparty: input.counterparty, purpose: input.purpose, proposedBy: input.proposedBy, isAgent: input.isAgent },
    { policy, mandate, spentInPeriodCents: spent, knownPayees: payees, availableBalanceCents: input.availableBalanceCents ?? null, now },
  );
  const status: MovementRow["status"] = verdict.decision === "block" ? "blocked" : verdict.decision === "hold" ? "held" : input.isAgent ? "executed" : "approved";
  const id = await insertMovement({
    subject, userId: ids.userId ?? null, clientId: ids.clientId ?? null, workspaceId: ids.workspaceId ?? null,
    idempotencyKey: input.idempotencyKey ?? null, proposedBy: input.proposedBy, proposedByName: input.proposedByName ?? null, isAgent: input.isAgent, agentId,
    action: input.action, fromAccount: input.fromAccount ?? null, toAccount: input.toAccount ?? null, counterparty: input.counterparty ?? null,
    amountCents: Math.round(input.amountCents), purpose: input.purpose.slice(0, 500),
    decision: verdict.decision, reasons: verdict.reasons, requiredApprovals: verdict.requiredApprovals, status,
    mandateId: mandate?.id ?? null, executedAt: status === "executed" ? now : null, reversibleUntil: status === "executed" ? verdict.reversibleUntil : null, rail: status === "executed" ? "ledger" : null,
  });
  if (id === null) return { movementId: null, verdict, status, duplicate: true };
  const label = `${input.action} ${money(input.amountCents)}${input.counterparty ? ` to ${input.counterparty}` : ""}`;
  await recordEvent({
    kind: "control", source: input.isAgent ? "automation" : "client", key: `movement.${id}.${verdict.decision}`, label: "Transaction firewall",
    value: { movementId: id, action: input.action, amountCents: input.amountCents, counterparty: input.counterparty ?? null, decision: verdict.decision, status, reasons: verdict.reasons, mandateId: mandate?.id ?? null, proposedBy: input.proposedBy },
    summary: `${label} — ${describeVerdict(verdict)}${status === "executed" ? ` — executed (reversible until ${verdict.reversibleUntil.toISOString().slice(0, 16).replace("T", " ")} UTC)` : ""}`,
    actorName: input.proposedByName ?? input.proposedBy, ...ids,
  });
  return { movementId: id, verdict, status, duplicate: false };
}

async function transition(ids: Ids, id: number, from: MovementRow["status"][], to: MovementRow["status"], patch: Partial<MovementRow>, summary: (m: MovementRow) => string, actorName?: string | null, key?: string): Promise<MovementRow> {
  const subject = ledgerSubject(ids);
  const m = await getMovement(id, subject);
  if (!m) throw new TRPCError({ code: "NOT_FOUND", message: "movement not found" });
  if (!from.includes(m.status)) throw new TRPCError({ code: "BAD_REQUEST", message: `movement is ${m.status}; cannot move to ${to}` });
  await updateMovement(id, { ...patch, status: to });
  const next = { ...m, ...patch, status: to } as MovementRow;
  await recordEvent({ kind: "control", source: actorName ? "client" : "system", key: key ?? `movement.${id}.${to}`, label: "Transaction firewall", value: { movementId: id, status: to, amountCents: m.amountCents, action: m.action, counterparty: m.counterparty }, summary: summary(next), actorName: actorName ?? null, ...ids });
  return next;
}

export async function approveMovement(ids: Ids, id: number, byUserId: number, byName: string | null, executeNow = true): Promise<MovementRow> {
  const now = new Date();
  const policy = await currentPolicy(ledgerSubject(ids));
  const reversibleUntil = new Date(now.getTime() + policy.reversalWindowHours * 3_600_000);
  const approved = await transition(ids, id, ["held", "proposed"], executeNow ? "executed" : "approved",
    { approvedByUserId: byUserId, approvedAt: now, executedAt: executeNow ? now : null, reversibleUntil: executeNow ? reversibleUntil : null, rail: executeNow ? "ledger" : null },
    (m) => `${m.action} ${money(m.amountCents)}${m.counterparty ? ` to ${m.counterparty}` : ""} approved by ${byName ?? "a person"}${executeNow ? ` and executed (reversible until ${reversibleUntil.toISOString().slice(0, 16).replace("T", " ")} UTC)` : ""}`, byName);
  return approved;
}

export async function rejectMovement(ids: Ids, id: number, byName: string | null, reason: string): Promise<MovementRow> {
  return transition(ids, id, ["held", "proposed", "approved"], "rejected", { rejectedReason: reason.slice(0, 500) }, (m) => `${m.action} ${money(m.amountCents)}${m.counterparty ? ` to ${m.counterparty}` : ""} rejected by ${byName ?? "a person"}: ${reason}`, byName);
}

export async function executeMovement(ids: Ids, id: number, byName?: string | null): Promise<MovementRow> {
  const now = new Date();
  const policy = await currentPolicy(ledgerSubject(ids));
  const reversibleUntil = new Date(now.getTime() + policy.reversalWindowHours * 3_600_000);
  return transition(ids, id, ["approved"], "executed", { executedAt: now, reversibleUntil, rail: "ledger" }, (m) => `${m.action} ${money(m.amountCents)}${m.counterparty ? ` to ${m.counterparty}` : ""} executed (reversible until ${reversibleUntil.toISOString().slice(0, 16).replace("T", " ")} UTC)`, byName ?? null);
}

export async function reverseMovement(ids: Ids, id: number, byName: string | null, reason: string): Promise<MovementRow> {
  const subject = ledgerSubject(ids);
  const m = await getMovement(id, subject);
  if (!m) throw new TRPCError({ code: "NOT_FOUND", message: "movement not found" });
  if (m.status !== "executed") throw new TRPCError({ code: "BAD_REQUEST", message: `movement is ${m.status}; only executed movements reverse` });
  if (!m.reversibleUntil || m.reversibleUntil.getTime() < Date.now()) throw new TRPCError({ code: "BAD_REQUEST", message: "the reversal window has closed" });
  return transition(ids, id, ["executed"], "reversed", { reversedAt: new Date(), reversedReason: reason.slice(0, 500) }, (mm) => `${mm.action} ${money(mm.amountCents)}${mm.counterparty ? ` to ${mm.counterparty}` : ""} reversed by ${byName ?? "a person"}: ${reason}`, byName);
}

export async function movementQueue(ids: Ids, limit = 100): Promise<MovementRow[]> {
  return listMovements(ledgerSubject(ids), { limit });
}

export { DEFAULT_POLICY };

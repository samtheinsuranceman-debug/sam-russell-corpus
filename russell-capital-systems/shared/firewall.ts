// ============================================================
// FIDUCIARY TRANSACTION FIREWALL — pure policy evaluation.
//
// Every proposed money movement (from an agent, an automation, the advisor
// or the client) is evaluated against the client's policy, the proposer's
// mandate, the counterparties already known, and the reserve floor, before
// anything moves. The verdict is allow / hold (a person decides) / block,
// with every reason spelled out, and it is appended to the Plan Ledger as
// a "control" event. Nothing here touches a bank; the platform records the
// movement and, when live rails exist, executes inside the mandate.
// ============================================================
import { mandateAllows, type MandateLike } from "./mandates";

export type FirewallPolicy = {
  /** agents (automations, AI) must hold a mandate; people are judged by the other rules only */
  requireMandate: boolean;
  /** any movement above this is held for a person, mandate or not; null = off */
  holdAboveCents: number | null;
  /** counterparties that are never paid */
  blockedCounterparties: string[];
  /** counterparties with a declared conflict of interest: always held for a person */
  conflictParties: string[];
  /** first payment to a payee never paid before is held for this many hours; 0 = off */
  newPayeeCoolingHours: number;
  /** cash that must remain after the movement; null = off */
  reserveFloorCents: number | null;
  /** an executed movement can be reversed inside this window */
  reversalWindowHours: number;
};

export const DEFAULT_POLICY: FirewallPolicy = {
  requireMandate: true,
  holdAboveCents: null,
  blockedCounterparties: [],
  conflictParties: [],
  newPayeeCoolingHours: 24,
  reserveFloorCents: null,
  reversalWindowHours: 24,
};

export function mergePolicy(partial: Partial<FirewallPolicy> | null | undefined): FirewallPolicy {
  const p = { ...DEFAULT_POLICY, ...(partial ?? {}) };
  p.blockedCounterparties = (p.blockedCounterparties ?? []).map(norm);
  p.conflictParties = (p.conflictParties ?? []).map(norm);
  return p;
}

export const MOVEMENT_ACTIONS = ["transfer", "pay", "contribute", "withdraw"] as const;
export type MovementAction = (typeof MOVEMENT_ACTIONS)[number];

export type MovementProposal = {
  action: MovementAction;
  amountCents: number;
  fromAccount?: string | null;
  toAccount?: string | null;
  counterparty?: string | null;
  purpose: string;
  proposedBy: string;
  /** true for automations and AI agents; false for the advisor or the client */
  isAgent: boolean;
};

export type FirewallContext = {
  policy: FirewallPolicy;
  mandate: MandateLike | null;
  spentInPeriodCents: number;
  knownPayees: string[];
  availableBalanceCents: number | null;
  now: Date;
};

export type FirewallDecision = "allow" | "hold" | "block";
export type FirewallVerdict = { decision: FirewallDecision; reasons: string[]; requiredApprovals: string[]; reversibleUntil: Date };

function norm(s: string): string { return s.trim().toLowerCase(); }

export function evaluateMovement(p: MovementProposal, ctx: FirewallContext): FirewallVerdict {
  const policy = mergePolicy(ctx.policy);
  const reasons: string[] = [];
  const approvals = new Set<string>();
  const state: { decision: FirewallDecision } = { decision: "allow" };
  const hold = (why: string, who = "client or advisor") => { if (state.decision !== "block") state.decision = "hold"; reasons.push(why); approvals.add(who); };
  const block = (why: string) => { state.decision = "block"; reasons.push(why); };

  if (!Number.isFinite(p.amountCents) || p.amountCents <= 0) block("amount must be greater than zero");
  const payee = p.counterparty ? norm(p.counterparty) : null;
  if (payee && policy.blockedCounterparties.includes(payee)) block(`"${p.counterparty}" is on the blocked list`);
  if (payee && policy.conflictParties.includes(payee)) hold(`"${p.counterparty}" carries a declared conflict of interest`, "advisor");

  if (p.isAgent) {
    if (!ctx.mandate) {
      if (policy.requireMandate) hold(`${p.proposedBy} holds no mandate for this client; a person must approve`);
    } else {
      const v = mandateAllows(ctx.mandate, { action: p.action, amountCents: p.amountCents, account: p.fromAccount ?? p.toAccount ?? null, spentInPeriodCents: ctx.spentInPeriodCents, now: ctx.now });
      if (!v.ok) block(`outside the mandate: ${v.reasons.join("; ")}`);
      else if (v.needsApproval) hold(v.reasons.join("; "));
    }
  }

  if (policy.holdAboveCents != null && p.amountCents > policy.holdAboveCents) hold(`amount is above the client's hold line (${(policy.holdAboveCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })})`);
  if (payee && policy.newPayeeCoolingHours > 0 && !ctx.knownPayees.map(norm).includes(payee)) hold(`first payment to "${p.counterparty}": ${policy.newPayeeCoolingHours}-hour cooling-off, a person confirms the payee`);
  if (policy.reserveFloorCents != null && ctx.availableBalanceCents != null && (p.action === "pay" || p.action === "withdraw" || p.action === "transfer") && ctx.availableBalanceCents - p.amountCents < policy.reserveFloorCents) {
    hold("would take cash below the reserve floor");
  }

  const reversibleUntil = new Date(ctx.now.getTime() + policy.reversalWindowHours * 3_600_000);
  const decision = state.decision;
  if (decision === "allow") reasons.push(p.isAgent ? "inside the mandate and every policy rule" : "inside every policy rule");
  return { decision, reasons, requiredApprovals: decision === "hold" ? Array.from(approvals) : [], reversibleUntil };
}

export function describeVerdict(v: FirewallVerdict): string {
  const head = v.decision === "allow" ? "Allowed" : v.decision === "hold" ? "Held for approval" : "Blocked";
  return `${head}: ${v.reasons.join("; ")}`;
}

// ============================================================
// SCOPED AGENT MANDATES — pure logic.
//
// A mandate is the bounded authority a client gives an agent (the follow-up
// automation, a harvesting agent, a bill-pay agent, an outside automation):
// which actions, on which accounts, up to what amount per action and per
// period, for what purpose, until when. Above `approvalAboveCents` the
// action is held for a human. Nothing an agent does with money bypasses
// mandateAllows(), and the Fiduciary Transaction Firewall calls it.
// ============================================================

export const MANDATE_ACTIONS = ["transfer", "pay", "contribute", "withdraw", "notify"] as const;
export type MandateAction = (typeof MANDATE_ACTIONS)[number];

export type MandateLike = {
  id: number;
  agentId: string;
  label?: string | null;
  actions: string[];
  /** allowed account references; empty = any account */
  accounts: string[];
  purpose?: string | null;
  /** per-action ceiling; null = no per-action limit */
  ceilingCents: number | null;
  /** rolling ceiling over periodDays; null = none */
  periodCeilingCents: number | null;
  periodDays: number | null;
  /** above this amount a human must approve; null = never needs approval within the ceilings */
  approvalAboveCents: number | null;
  startsAt: Date;
  expiresAt: Date | null;
  revokedAt: Date | null;
};

export type MandateRequest = {
  action: string;
  amountCents: number;
  account?: string | null;
  /** what this agent has already moved inside the rolling period */
  spentInPeriodCents?: number;
  now?: Date;
};

export type MandateVerdict = { ok: boolean; needsApproval: boolean; reasons: string[] };

export function isMandateActive(m: Pick<MandateLike, "startsAt" | "expiresAt" | "revokedAt">, now: Date = new Date()): boolean {
  if (m.revokedAt && m.revokedAt.getTime() <= now.getTime()) return false;
  if (m.startsAt.getTime() > now.getTime()) return false;
  if (m.expiresAt && m.expiresAt.getTime() <= now.getTime()) return false;
  return true;
}

/** Does this mandate permit the request? `ok:false` means outside the mandate; `needsApproval` means inside it but above the human-approval line. */
export function mandateAllows(m: MandateLike, req: MandateRequest): MandateVerdict {
  const now = req.now ?? new Date();
  const reasons: string[] = [];
  if (!isMandateActive(m, now)) reasons.push("mandate is not active (not started, expired, or revoked)");
  if (!m.actions.includes(req.action)) reasons.push(`action "${req.action}" is not in the mandate (${m.actions.join(", ") || "none"})`);
  if (m.accounts.length && req.account && !m.accounts.includes(req.account)) reasons.push(`account "${req.account}" is not in the mandate`);
  if (!Number.isFinite(req.amountCents) || req.amountCents < 0) reasons.push("amount must be a non-negative number");
  if (m.ceilingCents != null && req.amountCents > m.ceilingCents) reasons.push(`amount exceeds the per-action ceiling (${fmtCents(m.ceilingCents)})`);
  if (m.periodCeilingCents != null) {
    const spent = req.spentInPeriodCents ?? 0;
    if (spent + req.amountCents > m.periodCeilingCents) reasons.push(`amount would exceed the ${m.periodDays ?? 30}-day ceiling (${fmtCents(m.periodCeilingCents)}, ${fmtCents(spent)} already used)`);
  }
  if (reasons.length) return { ok: false, needsApproval: false, reasons };
  const needsApproval = m.approvalAboveCents != null && req.amountCents > m.approvalAboveCents;
  return { ok: true, needsApproval, reasons: needsApproval ? [`amount is above the approval line (${fmtCents(m.approvalAboveCents!)}); a person must approve`] : [] };
}

export function fmtCents(c: number): string {
  return (c / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function describeMandate(m: MandateLike): string {
  const acts = m.actions.join(", ") || "no actions";
  const cap = m.ceilingCents != null ? ` up to ${fmtCents(m.ceilingCents)} each` : "";
  const period = m.periodCeilingCents != null ? `, ${fmtCents(m.periodCeilingCents)} per ${m.periodDays ?? 30} days` : "";
  const appr = m.approvalAboveCents != null ? `; approval above ${fmtCents(m.approvalAboveCents)}` : "";
  const until = m.expiresAt ? ` until ${m.expiresAt.toISOString().slice(0, 10)}` : " until revoked";
  return `${m.label ?? m.agentId} may ${acts}${cap}${period}${appr}${until}${m.purpose ? ` — ${m.purpose}` : ""}`;
}

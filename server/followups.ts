// ============================================================
// LEAD FOLLOW-UP SEQUENCE — automated, consent-based, figure-free.
//
// When a homepage lead is captured, a short sequence is scheduled (text an
// hour later, emails on days 1, 3 and 7, a text on day 5). The scheduler
// sends each step when due. The sequence stops the moment the advisor marks
// the lead contacted/qualified/client, or the person unsubscribes/STOPs.
//
// Runs two ways so it works on any host:
//   - in-process: startFollowupScheduler() ticks every minute while the
//     server is up (set FOLLOWUPS_DISABLED=1 to turn the automation off)
//   - external cron: POST /api/scheduled/followups with header
//     x-scheduler-token: $SCHEDULER_TOKEN (for hosts that sleep the process)
// ============================================================
import type { Express, Request, Response } from "express";
import type { PublicLead } from "../drizzle/schema";
import { publicBaseUrl } from "./_core/mailer";
import { deliver } from "./messaging";
import { getLeadById } from "./leadsDb";
import { dueFollowups, scheduleFollowups, settleFollowup, type FollowupPlanStep } from "./messagingDb";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export type FollowupStepDef = { step: string; channel: "email" | "sms"; afterMs: number };
export const FOLLOWUP_SEQUENCE: FollowupStepDef[] = [
  { step: "sms_1h", channel: "sms", afterMs: 1 * HOUR },
  { step: "email_day1", channel: "email", afterMs: 1 * DAY },
  { step: "email_day3", channel: "email", afterMs: 3 * DAY },
  { step: "sms_day5", channel: "sms", afterMs: 5 * DAY },
  { step: "email_day7", channel: "email", afterMs: 7 * DAY },
];

export function followupsEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.FOLLOWUPS_DISABLED !== "1" && env.FOLLOWUPS_DISABLED !== "true";
}

/** The steps this lead can actually receive: texts need a phone, emails need an address. */
export function planFollowupsFor(lead: Pick<PublicLead, "email" | "phone" | "consentedAt">, now = new Date()): FollowupPlanStep[] {
  if (!lead.consentedAt) return [];
  return FOLLOWUP_SEQUENCE
    .filter((s) => (s.channel === "sms" ? Boolean(lead.phone) : Boolean(lead.email)))
    .map((s) => ({ step: s.step, channel: s.channel, scheduledFor: new Date(now.getTime() + s.afterMs) }));
}

export async function scheduleLeadFollowups(lead: Pick<PublicLead, "id" | "email" | "phone" | "consentedAt">, now = new Date()): Promise<number> {
  if (!followupsEnabled()) return 0;
  return scheduleFollowups(lead.id, planFollowupsFor(lead, now));
}

// ─── Content (no figures, ever) ──────────────────────────────────────────────
export function followupContent(step: string, lead: Pick<PublicLead, "firstName">, baseUrl = publicBaseUrl(), booking = process.env.CALENDLY_URL || ""): { subject: string; body: string } {
  const name = (lead.firstName ?? "").trim() || "there";
  const pick = booking ? `Pick a time here: ${booking}` : "Reply with a couple of windows that work and we will set it up.";
  switch (step) {
    case "sms_1h":
      return { subject: "", body: `Hi ${name}, this is Russell Capital Systems. Thanks for requesting your planning estimate — an advisor will reach out to schedule your evaluation. Questions in the meantime? Reply here.` };
    case "email_day1":
      return {
        subject: "What happens next with your planning estimate",
        body: `Hi ${name},\n\nThank you again for requesting a planning estimate. Here is what happens next:\n\n1. An advisor reviews what you entered and prepares a thorough evaluation — not a sales pitch.\n2. We schedule a short call to walk through it and answer your questions.\n3. If it makes sense, we build the plan together, one variable at a time.\n\nIf you would rather pick a time now: ${pick}\n\nRussell Capital Systems`,
      };
    case "email_day3":
      return {
        subject: "Three questions worth asking before any strategy",
        body: `Hi ${name},\n\nBefore anyone recommends a strategy, three questions decide whether it fits:\n\n1. How much of your income is taxed, and which of that is optional?\n2. What is the interest on your debts actually worth over their life?\n3. Which variables do you control — and which does the plan need to survive?\n\nThe evaluation we prepare answers all three from your own numbers. ${pick}\n\nRussell Capital Systems`,
      };
    case "sms_day5":
      return { subject: "", body: `Hi ${name}, Russell Capital Systems here. Your evaluation is ready to walk through whenever you are. ${booking ? `Pick a time: ${booking}` : "Reply with a day and time that works."}` };
    case "email_day7":
      return {
        subject: "Still here when you are ready",
        body: `Hi ${name},\n\nNo pressure — your evaluation stays ready. When you would like to go through it, reply to this email or visit ${baseUrl} and use the contact form.\n\nIf now is not the time, that is completely fine; you will not hear from this sequence again.\n\nRussell Capital Systems`,
      };
    default:
      return { subject: "A note from Russell Capital Systems", body: `Hi ${name},\n\nAn advisor will be in touch shortly.\n\nRussell Capital Systems` };
  }
}

// ─── Runner ──────────────────────────────────────────────────────────────────
export type RunSummary = { checked: number; sent: number; skipped: number; failed: number };

export async function runDueFollowups(now = new Date()): Promise<RunSummary> {
  const summary: RunSummary = { checked: 0, sent: 0, skipped: 0, failed: 0 };
  if (!followupsEnabled()) return summary;
  const due = await dueFollowups(now);
  for (const row of due) {
    summary.checked++;
    const lead = await getLeadById(row.leadId);
    if (!lead) { if (await settleFollowup(row.id, "skipped", "lead no longer exists")) summary.skipped++; continue; }
    if (lead.status !== "new") { if (await settleFollowup(row.id, "skipped", `lead is ${lead.status}`)) summary.skipped++; continue; }
    const to = row.channel === "sms" ? lead.phone : lead.email;
    if (!to) { if (await settleFollowup(row.id, "skipped", `no ${row.channel} on file`)) summary.skipped++; continue; }
    const content = followupContent(row.step, lead);
    const r = await deliver({ channel: row.channel, to, subject: content.subject || undefined, body: content.body, category: "marketing", template: row.step, leadId: lead.id, actorName: "Follow-up sequence" });
    if (r.sent) { if (await settleFollowup(row.id, "sent")) summary.sent++; }
    else if (r.suppressed) { if (await settleFollowup(row.id, "skipped", r.reason ?? "opted out")) summary.skipped++; }
    else { if (await settleFollowup(row.id, "failed", r.reason ?? "delivery failed")) summary.failed++; }
  }
  return summary;
}

let _timer: NodeJS.Timeout | null = null;
let _running = false;
export function startFollowupScheduler(intervalMs = 60_000): void {
  if (_timer || !followupsEnabled()) return;
  const tick = async () => {
    if (_running) return;
    _running = true;
    try {
      const s = await runDueFollowups();
      if (s.checked > 0) console.info(`[Followups] checked ${s.checked}: sent ${s.sent}, skipped ${s.skipped}, failed ${s.failed}`);
    } catch (error) {
      console.warn("[Followups] tick failed:", String(error).slice(0, 200));
    } finally {
      _running = false;
    }
  };
  _timer = setInterval(() => void tick(), intervalMs);
  _timer.unref?.();
  setTimeout(() => void tick(), 5_000).unref?.();
}
export function stopFollowupScheduler(): void {
  if (_timer) clearInterval(_timer);
  _timer = null;
}

/** External-cron entry point. Requires SCHEDULER_TOKEN so nobody else can trigger sends. */
export function registerScheduledRoutes(app: Express): void {
  app.post("/api/scheduled/followups", async (req: Request, res: Response) => {
    const token = process.env.SCHEDULER_TOKEN;
    if (!token) { res.status(404).json({ error: "Scheduled endpoint not enabled (set SCHEDULER_TOKEN)" }); return; }
    const given = req.get("x-scheduler-token") ?? (req.query.token as string | undefined);
    if (given !== token) { res.status(401).json({ error: "Bad scheduler token" }); return; }
    const summary = await runDueFollowups();
    res.json(summary);
  });
}

/**
 * Scheduled Tracker Re-engagement Handler
 *
 * Runs on a heartbeat schedule (recommend ~twice a month). Emails the opted-in
 * users whose last nudge was more than `throttleDays` ago, inviting them to start
 * their next 30/60/90-day behavioral-tracker cycle. ONLY fires for users who chose
 * to be reminded (users.trackerReminderOptIn === true) — the opt-in is revocable
 * from the portal and re-offered on every login.
 *
 * Honest by construction: no send unless the user opted in; the email is a gentle
 * invitation, not a claim about their progress.
 */

import type { Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { getTrackerReengagementRecipients, markTrackerReminderSent } from "./db";
import { sendMarketingEmail } from "./marketingEmail";

const THROTTLE_DAYS = 14; // ~twice a month

function reengagementHtml(): string {
  return `
  <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#1a1a1a">
    <p style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#8a6d3b">AQAL Intelligence · Your next cycle</p>
    <h1 style="font-size:24px;font-weight:600;line-height:1.2;margin:8px 0 12px">Ready for the next cycle?</h1>
    <p style="font-size:15px;line-height:1.6">You asked us to nudge you. Here it is — kindly.</p>
    <p style="font-size:15px;line-height:1.6">Open your portal, download your tracker template, and speak a few minutes a day
      for the next cycle. When you upload the journal, we'll update your profile from what you report and refresh your Vision.
      Consistency, not intensity, is what moves the line.</p>
    <p style="font-size:15px;line-height:1.6"><a href="/portal" style="color:#8a6d3b">Start your next cycle →</a></p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
    <p style="font-size:12px;color:#888;line-height:1.5">You're getting this because you opted in to cycle reminders.
      You can turn them off any time from your portal — we ask again every time you log in.</p>
  </div>`;
}

export async function trackerReengagementHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }
    const recipients = await getTrackerReengagementRecipients(THROTTLE_DAYS);
    let sent = 0, failed = 0;
    for (const r of recipients) {
      const result = await sendMarketingEmail(r.email, "Ready for your next AQAL cycle?", reengagementHtml());
      if (result.skipped) { await markTrackerReminderSent(r.userId); continue; }
      if (result.ok) {
        await markTrackerReminderSent(r.userId);
        sent++;
      } else {
        failed++;
      }
    }
    return res.json({ ok: true, candidates: recipients.length, sent, failed });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : "tracker-reengagement failed" });
  }
}

/**
 * Scheduled "finish your assessment" nudge.
 *
 * Runs on a heartbeat schedule (recommend hourly or a few times a day). Sends a
 * ONE-TIME email to members who claimed a spot ~24h+ ago but haven't completed
 * the assessment yet — the biggest drop-off on a long voice test. Throttled by
 * users.finishNudgeSentAt so no one is nudged twice, and windowed (24–96h) so we
 * don't email people who literally just signed up or who abandoned long ago.
 *
 * Honest by construction: one gentle reminder, progress is genuinely saved, no
 * dark patterns.
 */

import type { Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { getUnfinishedAssessmentRecipients, markFinishNudgeSent } from "./db";
import { sendEmail } from "./platform/email";
import { unfinishedAssessmentEmailHtml } from "./platform/email";

const MIN_HOURS = 24;  // wait at least a day before nudging
const MAX_HOURS = 96;  // don't chase people who signed up >4 days ago

export async function finishNudgeHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }
    const appUrl = req.headers.origin as string | undefined;
    const recipients = await getUnfinishedAssessmentRecipients(MIN_HOURS, MAX_HOURS);
    let sent = 0, failed = 0;
    for (const r of recipients) {
      const result = await sendEmail(
        r.email,
        "Your AQAL map is half-drawn — finish it",
        unfinishedAssessmentEmailHtml({ name: r.name ?? undefined, appUrl }),
      );
      if (result.ok) {
        await markFinishNudgeSent(r.userId);
        sent++;
      } else {
        failed++;
      }
    }
    return res.json({ ok: true, candidates: recipients.length, sent, failed });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : "finish-nudge failed" });
  }
}

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
import { getUnfinishedAssessmentRecipients, markFinishNudgeSent } from "./db";
import { sendMarketingEmail } from "./marketingEmail";
import { unfinishedAssessmentEmailHtml } from "./platform/email";
import { requireScheduledCron, scheduledFailure } from "./scheduledAuth";

const MIN_HOURS = 24;  // wait at least a day before nudging
const MAX_HOURS = 96;  // don't chase people who signed up >4 days ago

export async function finishNudgeHandler(req: Request, res: Response) {
  let taskUid: string | undefined;
  try {
    const user = await requireScheduledCron(req, res);
    if (!user) return;
    taskUid = user.taskUid;
    const appUrl = req.headers.origin as string | undefined;
    const recipients = await getUnfinishedAssessmentRecipients(MIN_HOURS, MAX_HOURS);
    let sent = 0, failed = 0, skipped = 0;
    for (const r of recipients) {
      const result = await sendMarketingEmail(
        r.email,
        "Your AQAL map is half-drawn — finish it",
        unfinishedAssessmentEmailHtml({ name: r.name ?? undefined, appUrl }),
        appUrl,
      );
      if (result.skipped) {
        skipped++;
      } else if (result.ok) {
        await markFinishNudgeSent(r.userId);
        sent++;
      } else {
        failed++;
      }
    }
    return res.json({ ok: true, candidates: recipients.length, sent, skipped, failed });
  } catch (err) {
    return scheduledFailure(req, res, err, taskUid);
  }
}

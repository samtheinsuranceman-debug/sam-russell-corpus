/**
 * Scheduled job: the "before you quit" re-entry message.
 *
 * Members who started the assessment but have gone 30+ days without touching
 * it get ONE personalized re-entry email — not a guilt reminder: a 5-minute
 * way back in that doesn't restart anything. Sent once per member ever
 * (deduped via analytics events; no schema change needed).
 */

import type { Request, Response } from "express";
import { and, eq, lt, sql } from "drizzle-orm";
import { getDb } from "./db";
import { analyticsEvents, assessments, users } from "../drizzle/schema";
import { sendMarketingEmail } from "./marketingEmail";

const STALE_DAYS = 30;

function reentryHtml(opts: { name?: string | null; completed: number; total: number; appUrl: string }): string {
  const first = (opts.name || "").split(" ")[0].replace(/[<>&"]/g, "");
  const hi = first ? `${first}, your` : "Your";
  const left = Math.max(0, opts.total - opts.completed);
  return `<!doctype html><html><body style="margin:0;background:#161310;font-family:Georgia,serif;color:#efe9dc;">
  <div style="max-width:520px;margin:0 auto;padding:40px 28px;">
    <div style="font-family:monospace;font-size:11px;letter-spacing:.24em;color:#c9a24b;text-transform:uppercase;margin-bottom:18px;">AQAL · The 5-minute way back in</div>
    <h1 style="font-size:23px;font-weight:600;margin:0 0 14px;">${hi} map is still ${opts.completed > 0 ? `${opts.completed} answers deep` : "waiting"} — nothing was lost.</h1>
    <p style="color:#b9b2a6;font-size:15px;line-height:1.65;margin:0 0 16px;">
      Most people who stop here didn't quit — life just got loud. So here's the smallest possible restart:
      <b style="color:#e0c68c;">don't answer a question today.</b> Just open your assessment, reread the next
      question, and close it. That's it. Tomorrow, talk for five minutes. The rambling comes back on its own.
    </p>
    <p style="color:#b9b2a6;font-size:15px;line-height:1.65;margin:0 0 16px;">
      Your progress is exactly where you left it${left > 0 ? ` — ${left} question${left === 1 ? "" : "s"} between you and your complete 32-line map, your prescriptions, and your founding membership locked for life` : ""}.
      Nothing reset. Nothing expired quietly. Scores don't decay while you breathe.
    </p>
    <a href="${opts.appUrl}/welcome-back" style="display:inline-block;background:#e0c68c;color:#161310;font-family:monospace;font-size:12px;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;padding:13px 22px;border-radius:4px;font-weight:600;">Open it — just to look</a>
    <p style="color:#6f6a60;font-size:12px;margin-top:26px;">This is the only one of these we'll ever send. Come back when you're ready — even if it's just three minutes.</p>
  </div></body></html>`;
}

export async function reentryHandler(req: Request, res: Response) {
  const db = await getDb();
  if (!db) { res.json({ ok: false, reason: "no-db" }); return; }
  try {
    const cutoff = new Date(Date.now() - STALE_DAYS * 24 * 3600 * 1000);
    const stale = await db.select().from(assessments)
      .where(and(eq(assessments.status, "in_progress"), lt(assessments.updatedAt, cutoff)));

    let sent = 0;
    for (const a of stale) {
      if (a.completedQuestions === 0) continue; // never started answering — finish-nudge territory
      const [u] = await db.select().from(users).where(eq(users.id, a.userId));
      if (!u?.email) continue;
      // Once per member, ever — deduped via the analytics stream.
      const [{ n }] = await db.select({ n: sql<number>`COUNT(*)` }).from(analyticsEvents)
        .where(and(eq(analyticsEvents.type, "reentry_sent"), eq(analyticsEvents.userId, u.id)));
      if (Number(n) > 0) continue;
      const appUrl = ((req.headers.origin as string) || `https://${req.headers.host || "joinaqal.com"}`).replace(/\/$/, "");
      const result = await sendMarketingEmail(
        u.email,
        "Nothing was lost — here's the 5-minute way back in",
        reentryHtml({ name: u.name, completed: a.completedQuestions, total: a.totalQuestions, appUrl }),
        appUrl,
      );
      if (result.skipped) continue;
      if (result.ok) {
        await db.insert(analyticsEvents).values({ type: "reentry_sent", userId: u.id, ok: true });
        sent++;
      }
    }
    res.json({ ok: true, candidates: stale.length, sent });
  } catch (err) {
    console.error("[reentry] failed:", err);
    res.status(500).json({ ok: false });
  }
}

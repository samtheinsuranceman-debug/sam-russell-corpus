/**
 * Scheduled job: the Question-of-the-Day drip.
 *
 * The ritual is one question a day for a month — this delivers it. Every
 * morning, each member with an in-progress assessment who hasn't answered
 * TODAY gets one short email naming their next question. Max one per member
 * per day (analytics-deduped); stops automatically at completion.
 */

import type { Request, Response } from "express";
import { and, eq, gte, sql } from "drizzle-orm";
import { getDb } from "./db";
import { analyticsEvents, assessments, responses, users } from "../drizzle/schema";
import { sendEmail } from "./platform/email";
import { QUESTION_TITLES } from "@shared/questionTitles";

function qotdHtml(opts: { name?: string | null; n: number; title: string; streakLine: string; appUrl: string }): string {
  const first = (opts.name || "").split(" ")[0].replace(/[<>&"]/g, "");
  return `<!doctype html><html><body style="margin:0;background:#161310;font-family:Georgia,serif;color:#efe9dc;">
  <div style="max-width:520px;margin:0 auto;padding:40px 28px;">
    <div style="font-family:monospace;font-size:11px;letter-spacing:.24em;color:#c9a24b;text-transform:uppercase;margin-bottom:18px;">AQAL · Today's question</div>
    <h1 style="font-size:24px;font-weight:600;margin:0 0 6px;">${first ? first + ", question" : "Question"} ${opts.n} of 27 is waiting:</h1>
    <p style="font-family:'Georgia',serif;font-style:italic;font-size:28px;color:#e0c68c;margin:0 0 16px;">&ldquo;${opts.title}&rdquo;</p>
    <p style="color:#b9b2a6;font-size:15px;line-height:1.65;margin:0 0 16px;">
      Thirty minutes of talking, sometime today — on a walk, in the car, wherever you ramble best. Read it, get sucked
      in, make it personal. There are no right answers; there's only how deep you go.
    </p>
    ${opts.streakLine}
    <a href="${opts.appUrl}/assessment" style="display:inline-block;background:#e0c68c;color:#161310;font-family:monospace;font-size:12px;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;padding:13px 22px;border-radius:4px;font-weight:600;">Open today's question</a>
    <p style="color:#6f6a60;font-size:12px;margin-top:26px;">One of these per day while your assessment is in progress — they stop the moment you finish. Already answered today? Ignore us and be proud.</p>
  </div></body></html>`;
}

export async function questionOfDayHandler(req: Request, res: Response) {
  const db = await getDb();
  if (!db) { res.json({ ok: false, reason: "no-db" }); return; }
  try {
    const inProgress = await db.select().from(assessments).where(eq(assessments.status, "in_progress"));
    const todayStart = new Date(); todayStart.setUTCHours(0, 0, 0, 0);
    let sent = 0;
    for (const a of inProgress) {
      if (a.completedQuestions >= a.totalQuestions) continue;
      const [u] = await db.select().from(users).where(eq(users.id, a.userId));
      if (!u?.email) continue;

      // Skip if they already answered today (they're pacing themselves fine)
      const answered = await db.select({ questionIndex: responses.questionIndex, createdAt: responses.createdAt })
        .from(responses).where(eq(responses.assessmentId, a.id));
      if (answered.some((r) => new Date(r.createdAt) >= todayStart)) continue;

      // Max one drip per member per day
      const [{ n }] = await db.select({ n: sql<number>`COUNT(*)` }).from(analyticsEvents)
        .where(and(
          eq(analyticsEvents.type, "qotd_sent"),
          eq(analyticsEvents.userId, u.id),
          gte(analyticsEvents.createdAt, todayStart),
        ));
      if (Number(n) > 0) continue;

      const answeredSet = new Set(answered.map((r) => r.questionIndex));
      const nextIdx = QUESTION_TITLES.findIndex((_, i) => !answeredSet.has(i));
      if (nextIdx === -1) continue;

      // Streak line: consecutive answer days feed the flame in the email too.
      const days = new Set(answered.map((r) => new Date(r.createdAt).toISOString().slice(0, 10)));
      const streakLine = days.size >= 2
        ? `<p style="color:#e0c68c;font-family:monospace;font-size:12px;margin:0 0 16px;">🔥 ${days.size} answer days so far — today keeps the run alive.</p>`
        : "";

      const appUrl = ((req.headers.origin as string) || `https://${req.headers.host || "joinaqal.com"}`).replace(/\/$/, "");
      const result = await sendEmail(
        u.email,
        `Today's question: "${QUESTION_TITLES[nextIdx]}"`,
        qotdHtml({ name: u.name, n: nextIdx + 1, title: QUESTION_TITLES[nextIdx], streakLine, appUrl }),
      );
      if (result.ok) {
        await db.insert(analyticsEvents).values({ type: "qotd_sent", userId: u.id, ok: true });
        sent++;
      }
    }
    res.json({ ok: true, candidates: inProgress.length, sent });
  } catch (err) {
    console.error("[qotd] failed:", err);
    res.status(500).json({ ok: false });
  }
}

/**
 * Scheduled job: unread-messages email digest.
 *
 * Runs every 2 hours (see scheduledJobs.ts). For each member with unread
 * direct messages that have been sitting for 30+ minutes, sends ONE short
 * digest email ("You have N unread messages") — throttled to at most one
 * digest per member per 24h via users.message_digest_last_sent_at. Never
 * includes message CONTENT (Terms §8A: staff systems don't read messages;
 * this queries counts only).
 */

import type { Request, Response } from "express";
import { and, eq, isNull, lt, sql } from "drizzle-orm";
import { getDb } from "./db";
import { directMessages, users } from "../drizzle/schema";
import { sendMarketingEmail } from "./marketingEmail";

const MIN_AGE_MS = 30 * 60 * 1000; // unread for 30+ min (they're clearly away)
const THROTTLE_MS = 24 * 60 * 60 * 1000; // one digest per member per day

function digestHtml(opts: { name?: string | null; count: number; appUrl?: string }): string {
  const first = (opts.name || "").split(" ")[0];
  const hi = first ? `${first.replace(/[<>&"]/g, "")}, your` : "Your";
  const cta = (opts.appUrl || "").replace(/\/$/, "") + "/messages";
  const n = opts.count;
  return `<!doctype html><html><body style="margin:0;background:#161310;font-family:Georgia,serif;color:#efe9dc;">
  <div style="max-width:520px;margin:0 auto;padding:40px 28px;">
    <div style="font-family:monospace;font-size:11px;letter-spacing:.24em;color:#c9a24b;text-transform:uppercase;margin-bottom:18px;">AQAL · Your network</div>
    <h1 style="font-size:23px;font-weight:600;margin:0 0 14px;">${hi} connections wrote to you.</h1>
    <p style="color:#b9b2a6;font-size:15px;line-height:1.65;margin:0 0 18px;">
      You have <b style="color:#e0c68c;">${n} unread message${n === 1 ? "" : "s"}</b> waiting in your private AQAL
      inbox. We don't read your messages, so that count is all we know — the rest is between you and your people.
    </p>
    <a href="${cta}" style="display:inline-block;background:#e0c68c;color:#161310;font-family:monospace;font-size:12px;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;padding:13px 22px;border-radius:4px;font-weight:600;">Open your messages</a>
    <p style="color:#6f6a60;font-size:12px;margin-top:26px;">At most one of these per day. Shared files wipe 72 hours after upload — open anything important soon.</p>
  </div></body></html>`;
}

export async function messageDigestHandler(req: Request, res: Response) {
  const db = await getDb();
  if (!db) { res.json({ ok: false, reason: "no-db" }); return; }
  try {
    const cutoff = new Date(Date.now() - MIN_AGE_MS);
    const throttleCutoff = new Date(Date.now() - THROTTLE_MS);

    // Unread counts per recipient, only messages older than the age gate.
    const unread = await db
      .select({ toUserId: directMessages.toUserId, count: sql<number>`COUNT(*)` })
      .from(directMessages)
      .where(and(isNull(directMessages.readAt), lt(directMessages.createdAt, cutoff)))
      .groupBy(directMessages.toUserId);

    let sent = 0;
    for (const row of unread) {
      const [u] = await db.select().from(users).where(eq(users.id, row.toUserId));
      if (!u?.email) continue;
      if (u.messageDigestLastSentAt && new Date(u.messageDigestLastSentAt) > throttleCutoff) continue;
      const appUrl = (req.headers.origin as string) || `https://${req.headers.host || "joinaqal.com"}`;
      const result = await sendMarketingEmail(
        u.email,
        `You have ${row.count} unread message${Number(row.count) === 1 ? "" : "s"} on AQAL`,
        digestHtml({ name: u.name, count: Number(row.count), appUrl }),
        appUrl,
      );
      if (result.skipped) continue;
      if (result.ok) {
        await db.update(users).set({ messageDigestLastSentAt: new Date() }).where(eq(users.id, u.id));
        sent++;
      }
    }
    res.json({ ok: true, candidates: unread.length, sent });
  } catch (err) {
    console.error("[messageDigest] failed:", err);
    res.status(500).json({ ok: false });
  }
}

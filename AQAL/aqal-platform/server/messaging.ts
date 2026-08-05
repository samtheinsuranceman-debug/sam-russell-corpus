// ============================================================
// DIRECT MESSAGING — the communications grid (schematic §3–§4)
// ============================================================
// 1-to-1 messaging between MUTUALLY CONNECTED members only (accept a
// connection on /matches first — that's the membership moat). Text persists;
// attachment files are ephemeral: permanently purged from storage 72 hours
// after upload. No staff access, no third-party sharing — see Terms.
//
// Transport is plain tRPC + client polling (schematic Phase 2: "simple,
// reliable"). WebSockets are a Phase-3 upgrade once usage proves out.

import { and, desc, eq, isNull, lt, or, sql } from "drizzle-orm";
import { getDb } from "./db";
import { connectionRequests, directMessages, users } from "../drizzle/schema";
import { storagePut, storageGetSignedUrl, storageDelete } from "./platform/storage";

export const ATTACHMENT_TTL_HOURS = 72;

// Size ceilings by kind (schematic §4). Video is 30MB for now — base64 over
// the 50MB JSON body limit caps raw size ~35MB; Phase-3 presigned direct
// uploads lift it to the schematic's 50MB.
export const ATTACHMENT_LIMITS: { kind: string; test: (mime: string) => boolean; maxBytes: number }[] = [
  { kind: "image", test: (m) => m.startsWith("image/"), maxBytes: 10 * 1024 * 1024 },
  { kind: "voice note", test: (m) => m.startsWith("audio/"), maxBytes: 5 * 1024 * 1024 },
  { kind: "video", test: (m) => m.startsWith("video/"), maxBytes: 30 * 1024 * 1024 },
  {
    kind: "document",
    test: (m) =>
      m === "application/pdf" ||
      m.startsWith("text/") ||
      m.includes("word") ||
      m.includes("spreadsheet") ||
      m.includes("presentation"),
    maxBytes: 25 * 1024 * 1024,
  },
];

export function validateAttachment(mime: string, sizeBytes: number): { ok: true; kind: string } | { ok: false; error: string } {
  const rule = ATTACHMENT_LIMITS.find((r) => r.test(mime));
  if (!rule) return { ok: false, error: "That file type isn't supported. Images, PDFs/documents, voice notes, and short videos only." };
  if (sizeBytes > rule.maxBytes) {
    return { ok: false, error: `That ${rule.kind} is too large — the limit is ${Math.round(rule.maxBytes / (1024 * 1024))} MB.` };
  }
  return { ok: true, kind: rule.kind };
}

// ── Per-member upload quota (rolling 48h) ─────────────────────────────────
// Bounds worst-case storage so the wipe cycle can always keep up: even if every
// member maxed the quota, storage tops out at members × 250MB for ≤48h — and
// real usage is ~1% of that. attachmentSize survives the purge (only the file
// and key are deleted), so the quota can't be reset by waiting for the wipe...
// which doesn't matter anyway, because the window is time-based.
export const UPLOAD_WINDOW_HOURS = 48;
export const UPLOAD_QUOTA_BYTES = 250 * 1024 * 1024; // 250 MB per member per 48h
export const UPLOAD_QUOTA_FILES = 50; // and at most 50 files per 48h

export function checkUploadQuota(
  usedBytes: number,
  usedFiles: number,
  newBytes: number,
): { ok: true } | { ok: false; error: string } {
  if (usedFiles >= UPLOAD_QUOTA_FILES) {
    return { ok: false, error: `You've shared ${UPLOAD_QUOTA_FILES} files in the last ${UPLOAD_WINDOW_HOURS} hours — that's the cap. It rolls off as older uploads age out.` };
  }
  if (usedBytes + newBytes > UPLOAD_QUOTA_BYTES) {
    const leftMb = Math.max(0, Math.floor((UPLOAD_QUOTA_BYTES - usedBytes) / (1024 * 1024)));
    return { ok: false, error: `That file would exceed your ${Math.round(UPLOAD_QUOTA_BYTES / (1024 * 1024))} MB / ${UPLOAD_WINDOW_HOURS}-hour sharing allowance (about ${leftMb} MB left right now). It rolls off as older uploads age out.` };
  }
  return { ok: true };
}

// Mutually-accepted connection = allowed to message. The whole gate in one query.
export async function areConnected(a: number, b: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const [row] = await db
    .select({ id: connectionRequests.id })
    .from(connectionRequests)
    .where(
      and(
        eq(connectionRequests.status, "accepted"),
        or(
          and(eq(connectionRequests.fromUserId, a), eq(connectionRequests.toUserId, b)),
          and(eq(connectionRequests.fromUserId, b), eq(connectionRequests.toUserId, a)),
        ),
      ),
    )
    .limit(1);
  return !!row;
}

export async function sendMessage(
  fromUserId: number,
  toUserId: number,
  input: { content?: string; attachment?: { base64: string; name: string; type: string } },
): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
  const db = await getDb();
  if (!db) return { ok: false, error: "Messaging is unavailable right now." };
  if (!(await areConnected(fromUserId, toUserId))) {
    return { ok: false, error: "You can only message members you're connected with. Send a connection request from your Matches page first." };
  }
  const content = (input.content ?? "").trim();
  if (!content && !input.attachment) return { ok: false, error: "Nothing to send." };
  if (content.length > 10_000) return { ok: false, error: "That message is too long (10,000 characters max)." };

  let attachment: {
    attachmentKey: string;
    attachmentName: string;
    attachmentType: string;
    attachmentSize: number;
    attachmentExpiresAt: Date;
  } | null = null;

  if (input.attachment) {
    const buf = Buffer.from(input.attachment.base64, "base64");
    const check = validateAttachment(input.attachment.type, buf.length);
    if (!check.ok) return { ok: false, error: check.error };

    // Rolling 48h quota — sum of everything this member uploaded in the window.
    const windowStart = new Date(Date.now() - UPLOAD_WINDOW_HOURS * 3600 * 1000);
    const [usage] = await db
      .select({
        bytes: sql<number>`COALESCE(SUM(${directMessages.attachmentSize}), 0)`,
        files: sql<number>`COUNT(${directMessages.attachmentSize})`,
      })
      .from(directMessages)
      .where(and(eq(directMessages.fromUserId, fromUserId), sql`${directMessages.attachmentSize} IS NOT NULL`, sql`${directMessages.createdAt} > ${windowStart}`));
    const quota = checkUploadQuota(Number(usage?.bytes) || 0, Number(usage?.files) || 0, buf.length);
    if (!quota.ok) return { ok: false, error: quota.error };
    const safeName = input.attachment.name.replace(/[^\w.\-]+/g, "_").slice(0, 120) || "file";
    const pair = [fromUserId, toUserId].sort((x, y) => x - y).join("-");
    const { key } = await storagePut(`messages/${pair}/${safeName}`, buf, input.attachment.type);
    attachment = {
      attachmentKey: key,
      attachmentName: safeName,
      attachmentType: input.attachment.type,
      attachmentSize: buf.length,
      attachmentExpiresAt: new Date(Date.now() + ATTACHMENT_TTL_HOURS * 3600 * 1000),
    };
  }

  const [res] = await db.insert(directMessages).values({
    fromUserId,
    toUserId,
    content: content || null,
    ...(attachment ?? {}),
  });
  return { ok: true, id: res.insertId as number };
}

// The thread with one other member, oldest→newest, attachments resolved to
// signed URLs when still alive. Marks their messages to me as read.
export async function getThread(userId: number, otherUserId: number, limit = 200) {
  const db = await getDb();
  if (!db) return null;
  if (!(await areConnected(userId, otherUserId))) return null;
  await purgeExpiredAttachmentsThrottled();

  const rows = await db
    .select()
    .from(directMessages)
    .where(
      or(
        and(eq(directMessages.fromUserId, userId), eq(directMessages.toUserId, otherUserId)),
        and(eq(directMessages.fromUserId, otherUserId), eq(directMessages.toUserId, userId)),
      ),
    )
    .orderBy(desc(directMessages.id))
    .limit(limit);
  rows.reverse();

  await db
    .update(directMessages)
    .set({ readAt: new Date() })
    .where(and(eq(directMessages.fromUserId, otherUserId), eq(directMessages.toUserId, userId), isNull(directMessages.readAt)));

  return Promise.all(
    rows.map(async (m) => ({
      id: m.id,
      mine: m.fromUserId === userId,
      content: m.content,
      createdAt: m.createdAt,
      readAt: m.readAt,
      attachment: m.attachmentKey && !m.attachmentExpired
        ? {
            name: m.attachmentName,
            type: m.attachmentType,
            size: m.attachmentSize,
            url: await storageGetSignedUrl(m.attachmentKey),
            expiresAt: m.attachmentExpiresAt,
          }
        : m.attachmentExpired
          ? { name: m.attachmentName, type: null, size: null, url: null, expiresAt: null } // "[Attachment expired]"
          : null,
    })),
  );
}

// Sidebar: every accepted connection, with last message + unread count.
export async function listThreads(userId: number) {
  const db = await getDb();
  if (!db) return [];
  await purgeExpiredAttachmentsThrottled();

  const conns = await db
    .select()
    .from(connectionRequests)
    .where(
      and(
        eq(connectionRequests.status, "accepted"),
        or(eq(connectionRequests.fromUserId, userId), eq(connectionRequests.toUserId, userId)),
      ),
    );
  const otherIds = Array.from(new Set(conns.map((c) => (c.fromUserId === userId ? c.toUserId : c.fromUserId))));
  const out: { userId: number; name: string; lastMessage: string | null; lastAt: Date | null; unread: number }[] = [];
  for (const otherId of otherIds) {
    const [person] = await db.select({ name: users.name }).from(users).where(eq(users.id, otherId));
    const [last] = await db
      .select()
      .from(directMessages)
      .where(
        or(
          and(eq(directMessages.fromUserId, userId), eq(directMessages.toUserId, otherId)),
          and(eq(directMessages.fromUserId, otherId), eq(directMessages.toUserId, userId)),
        ),
      )
      .orderBy(desc(directMessages.id))
      .limit(1);
    const [{ count: unread }] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(directMessages)
      .where(and(eq(directMessages.fromUserId, otherId), eq(directMessages.toUserId, userId), isNull(directMessages.readAt)));
    out.push({
      userId: otherId,
      name: person?.name || "Member",
      lastMessage: last ? (last.content ?? (last.attachmentName ? `📎 ${last.attachmentName}` : null)) : null,
      lastAt: last?.createdAt ?? null,
      unread: Number(unread) || 0,
    });
  }
  return out.sort((a, b) => (b.lastAt?.getTime() ?? 0) - (a.lastAt?.getTime() ?? 0));
}

// ── The 72-hour purge ──────────────────────────────────────────────────────
// Deletes expired attachment FILES from storage permanently and flips the row
// to expired (text stays, name stays for the placeholder). Runs opportunistically
// (at most hourly) on messaging reads, so it needs no external cron — though a
// cron may also call purgeExpiredAttachments() directly.
let lastPurgeAt = 0;

export async function purgeExpiredAttachments(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const expired = await db
    .select({ id: directMessages.id, key: directMessages.attachmentKey })
    .from(directMessages)
    .where(and(lt(directMessages.attachmentExpiresAt, new Date()), eq(directMessages.attachmentExpired, false)));
  let purged = 0;
  for (const row of expired) {
    if (row.key) await storageDelete(row.key);
    await db
      .update(directMessages)
      .set({ attachmentExpired: true, attachmentKey: null })
      .where(eq(directMessages.id, row.id));
    purged++;
  }
  if (purged > 0) console.log(`[messaging] purged ${purged} expired attachment(s)`);
  return purged;
}

async function purgeExpiredAttachmentsThrottled() {
  if (Date.now() - lastPurgeAt < 3600 * 1000) return;
  lastPurgeAt = Date.now();
  purgeExpiredAttachments().catch((e) => console.error("[messaging] purge failed:", e));
}

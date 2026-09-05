// ============================================================
// COMPLEMENTARY MATCHING — server side
// ============================================================
// Builds each member's 32-line vector from their latest COMPLETE assessment,
// scores complementarity against every other completed member (shared/matching
// formula), and stores the top N above the quality floor. Refresh is lazy with
// a 24h TTL — no cron dependency, correct from member #2 onward.

import { and, desc, eq, inArray, or } from "drizzle-orm";
import { getDb } from "./db";
import { assessments, connectionRequests, matches, scores, users } from "../drizzle/schema";
import { ALL_AXES } from "@shared/axisModes";
import {
  complementarityScore,
  topComplementaryAxes,
  MATCH_FLOOR,
} from "@shared/matching";

const TOP_N = 50; // stored per member
const TTL_MS = 24 * 60 * 60 * 1000; // recompute when older than a day

type MemberVector = { userId: number; vector: number[] };

// Latest complete assessment per user, expanded to an ALL_AXES-aligned vector.
export async function getMemberVectors(): Promise<MemberVector[]> {
  const db = await getDb();
  if (!db) return [];
  const complete = await db
    .select({ id: assessments.id, userId: assessments.userId, createdAt: assessments.createdAt })
    .from(assessments)
    .where(eq(assessments.status, "complete"))
    .orderBy(desc(assessments.createdAt));

  // First (newest) complete assessment wins per user.
  const latestByUser = new Map<number, number>();
  for (const a of complete) {
    if (!latestByUser.has(a.userId)) latestByUser.set(a.userId, a.id);
  }
  if (latestByUser.size === 0) return [];

  const assessmentIds = Array.from(latestByUser.values());
  const rows = await db
    .select({ assessmentId: scores.assessmentId, axisIndex: scores.axisIndex, score: scores.score })
    .from(scores)
    .where(inArray(scores.assessmentId, assessmentIds));

  const byAssessment = new Map<number, number[]>();
  for (const r of rows) {
    let v = byAssessment.get(r.assessmentId);
    if (!v) {
      v = Array(ALL_AXES.length).fill(0);
      byAssessment.set(r.assessmentId, v);
    }
    if (r.axisIndex >= 0 && r.axisIndex < ALL_AXES.length) v[r.axisIndex] = r.score;
  }

  const out: MemberVector[] = [];
  latestByUser.forEach((assessmentId, userId) => {
    const vector = byAssessment.get(assessmentId);
    if (vector) out.push({ userId, vector });
  });
  return out;
}

// Recompute + store this member's top matches against all completed members.
export async function computeMatchesFor(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const members = await getMemberVectors();
  const me = members.find((m) => m.userId === userId);
  if (!me) return 0;

  const scored = members
    .filter((m) => m.userId !== userId)
    .map((other) => ({
      matchedUserId: other.userId,
      score: complementarityScore(me.vector, other.vector).score,
      topAxes: topComplementaryAxes(me.vector, other.vector, 3),
    }))
    .filter((s) => s.score >= MATCH_FLOOR)
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_N);

  await db.delete(matches).where(eq(matches.userId, userId));
  if (scored.length > 0) {
    await db.insert(matches).values(
      scored.map((s) => ({ userId, matchedUserId: s.matchedUserId, score: s.score, topAxes: s.topAxes })),
    );
  }
  return scored.length;
}

// Lazy freshness: recompute when stale or empty, then return stored matches
// joined with the matched member's display name.
export async function getFreshMatches(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const existing = await db
    .select()
    .from(matches)
    .where(eq(matches.userId, userId))
    .orderBy(desc(matches.score));
  const newest = existing[0]?.computedAt ? new Date(existing[0].computedAt).getTime() : 0;
  if (existing.length === 0 || Date.now() - newest > TTL_MS) {
    await computeMatchesFor(userId);
  }
  const rows = await db
    .select({
      matchedUserId: matches.matchedUserId,
      score: matches.score,
      topAxes: matches.topAxes,
      name: users.name,
    })
    .from(matches)
    .leftJoin(users, eq(users.id, matches.matchedUserId))
    .where(eq(matches.userId, userId))
    .orderBy(desc(matches.score));
  return rows;
}

// ── Connection requests (Phase 1 of messaging: mutual accept → reveal email) ──

export async function requestConnection(fromUserId: number, toUserId: number) {
  const db = await getDb();
  if (!db || fromUserId === toUserId) return { status: "invalid" as const };

  // If they already asked us, this "request" is an acceptance — mutual.
  const [reverse] = await db
    .select()
    .from(connectionRequests)
    .where(and(eq(connectionRequests.fromUserId, toUserId), eq(connectionRequests.toUserId, fromUserId)));
  if (reverse) {
    if (reverse.status !== "accepted") {
      await db
        .update(connectionRequests)
        .set({ status: "accepted", respondedAt: new Date() })
        .where(eq(connectionRequests.id, reverse.id));
    }
    return { status: "accepted" as const };
  }

  const [existing] = await db
    .select()
    .from(connectionRequests)
    .where(and(eq(connectionRequests.fromUserId, fromUserId), eq(connectionRequests.toUserId, toUserId)));
  if (existing) return { status: existing.status };

  await db.insert(connectionRequests).values({ fromUserId, toUserId });
  return { status: "pending" as const };
}

export async function respondToConnection(userId: number, requestId: number, accept: boolean) {
  const db = await getDb();
  if (!db) return false;
  const [req] = await db.select().from(connectionRequests).where(eq(connectionRequests.id, requestId));
  if (!req || req.toUserId !== userId || req.status !== "pending") return false;
  await db
    .update(connectionRequests)
    .set({ status: accept ? "accepted" : "declined", respondedAt: new Date() })
    .where(eq(connectionRequests.id, requestId));
  return true;
}

// Everything involving me: pending in/out + accepted (accepted rows include
// the other member's email — the mutual-accept reveal).
export async function getConnectionState(userId: number) {
  const db = await getDb();
  if (!db) return { incoming: [], outgoing: [], accepted: [] };
  const rows = await db
    .select()
    .from(connectionRequests)
    .where(or(eq(connectionRequests.fromUserId, userId), eq(connectionRequests.toUserId, userId)));

  const otherIds = Array.from(
    new Set(rows.map((r) => (r.fromUserId === userId ? r.toUserId : r.fromUserId))),
  );
  const people =
    otherIds.length > 0
      ? await db
          .select({ id: users.id, name: users.name, email: users.email })
          .from(users)
          .where(inArray(users.id, otherIds))
      : [];
  const person = (id: number) => people.find((p) => p.id === id);

  const incoming = rows
    .filter((r) => r.toUserId === userId && r.status === "pending")
    .map((r) => ({ requestId: r.id, userId: r.fromUserId, name: person(r.fromUserId)?.name ?? "Member" }));
  const outgoing = rows
    .filter((r) => r.fromUserId === userId && r.status === "pending")
    .map((r) => ({ requestId: r.id, userId: r.toUserId, name: person(r.toUserId)?.name ?? "Member" }));
  const accepted = rows
    .filter((r) => r.status === "accepted")
    .map((r) => {
      const otherId = r.fromUserId === userId ? r.toUserId : r.fromUserId;
      const p = person(otherId);
      return { userId: otherId, name: p?.name ?? "Member", email: p?.email ?? null };
    });
  return { incoming, outgoing, accepted };
}

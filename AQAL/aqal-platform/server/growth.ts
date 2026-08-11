// ============================================================
// GROWTH ENGINE — server side
// ============================================================
// Ratings, weekly pulse, what-changed comparison, streak data, and the
// crisis safety net (deterministic scan + flag queue + resources).

import { and, desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import { assessments, crisisFlags, protocolRatings, pulseChecks, responses, scores } from "../drizzle/schema";
import { scanForCrisis } from "@shared/growthEngine";
import { ALL_AXES } from "@shared/axisModes";

// ── Crisis safety net ────────────────────────────────────────────────────────
// Returns true when flagged so callers can surface the resources panel.
export async function crisisCheck(userId: number, source: string, text: string): Promise<boolean> {
  if (!scanForCrisis(text)) return false;
  try {
    const db = await getDb();
    if (db) {
      await db.insert(crisisFlags).values({
        userId, source,
        // Store a minimal excerpt for human review — not the whole document.
        excerpt: text.slice(0, 280),
      });
    }
  } catch (e) {
    console.error("[crisis] flag insert failed:", e);
  }
  return true;
}

// ── Protocol ratings (1-5 stars, per practice per month, upserted) ───────────
export async function rateProtocol(userId: number, practiceId: string, stars: number, month: string) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(protocolRatings).where(and(
    eq(protocolRatings.userId, userId),
    eq(protocolRatings.practiceId, practiceId),
    eq(protocolRatings.month, month),
  ));
  await db.insert(protocolRatings).values({ userId, practiceId, stars: Math.max(1, Math.min(5, Math.round(stars))), month });
  return true;
}

export async function myRatings(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(protocolRatings).where(eq(protocolRatings.userId, userId));
}

// ── Weekly pulse — one short check-in on the weakest line ────────────────────
export async function submitPulse(userId: number, line: string, text: string) {
  const db = await getDb();
  if (!db) return { ok: false as const, flagged: false };
  if (!ALL_AXES.includes(line)) return { ok: false as const, flagged: false };
  await db.insert(pulseChecks).values({ userId, line, text: text.slice(0, 20_000) });
  const flagged = await crisisCheck(userId, "pulse", text);
  return { ok: true as const, flagged };
}

export async function pulseHistory(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ line: pulseChecks.line, createdAt: pulseChecks.createdAt })
    .from(pulseChecks).where(eq(pulseChecks.userId, userId))
    .orderBy(desc(pulseChecks.createdAt)).limit(30);
  return rows;
}

// ── What Changed — latest two COMPLETE assessments, per-line deltas ──────────
export async function whatChanged(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const complete = await db.select({ id: assessments.id, createdAt: assessments.createdAt })
    .from(assessments)
    .where(and(eq(assessments.userId, userId), eq(assessments.status, "complete")))
    .orderBy(desc(assessments.createdAt))
    .limit(2);
  if (complete.length < 2) return null;
  const [latest, previous] = complete;
  const load = async (aid: number) => {
    const rows = await db.select().from(scores).where(eq(scores.assessmentId, aid));
    const v = new Map<string, number>();
    rows.forEach((r) => v.set(r.axisName, r.score));
    return v;
  };
  const [nv, pv] = await Promise.all([load(latest.id), load(previous.id)]);
  const deltas = ALL_AXES
    .map((axis) => {
      const now = nv.get(axis); const then = pv.get(axis);
      if (now === undefined || then === undefined) return null;
      return { axis, now, then, delta: now - then };
    })
    .filter((d): d is NonNullable<typeof d> => d !== null && Math.abs(d.delta) >= 0.02)
    .sort((a, b) => b.delta - a.delta);
  return {
    latestAt: latest.createdAt, previousAt: previous.createdAt,
    up: deltas.filter((d) => d.delta > 0).slice(0, 5),
    down: deltas.filter((d) => d.delta < 0).slice(-5).reverse(),
  };
}

// ── Assessment day streak — distinct answer days, from responses ─────────────
export async function answerDays(userId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const mine = await db.select({ id: assessments.id }).from(assessments).where(eq(assessments.userId, userId));
  if (mine.length === 0) return [];
  const days = new Set<string>();
  for (const a of mine) {
    const rows = await db.select({ createdAt: responses.createdAt }).from(responses).where(eq(responses.assessmentId, a.id));
    rows.forEach((r) => days.add(new Date(r.createdAt).toISOString().slice(0, 10)));
  }
  return Array.from(days);
}

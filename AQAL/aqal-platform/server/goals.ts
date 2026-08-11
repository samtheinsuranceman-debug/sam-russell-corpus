// ============================================================
// GOALS ENGINE — server side (dashboard of up to 10 active goals)
// ============================================================
// Create from a stated goal (template-matched staircase), toggle stages,
// log monthly effort (upsert per month), and read the computed clock.

import { and, desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import { goalLogs, goals } from "../drizzle/schema";
import { templateForGoal } from "@shared/goalTemplates";
import { readClock, type GoalStage } from "@shared/goalClock";

export const MAX_ACTIVE_GOALS = 10;

export async function createGoal(userId: number, title: string) {
  const db = await getDb();
  if (!db) return { ok: false as const, error: "Goals are unavailable right now." };
  const active = await db.select({ id: goals.id }).from(goals)
    .where(and(eq(goals.userId, userId), eq(goals.status, "active")));
  if (active.length >= MAX_ACTIVE_GOALS) {
    return { ok: false as const, error: `You're at ${MAX_ACTIVE_GOALS} active goals — retire or achieve one to add another. Focus is the feature.` };
  }
  const tpl = templateForGoal(title);
  const stages: GoalStage[] = tpl.stages.map((name) => ({ name, done: false }));
  const [res] = await db.insert(goals).values({
    userId, title: title.slice(0, 200), category: tpl.key,
    baselineMonths: tpl.baselineMonths, minMonthlyHours: tpl.minMonthlyHours,
    stages,
  });
  return { ok: true as const, goalId: Number(res.insertId), template: tpl.label };
}

export async function listGoals(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(goals)
    .where(eq(goals.userId, userId))
    .orderBy(desc(goals.createdAt));
  const logs = await db.select().from(goalLogs)
    .where(eq(goalLogs.userId, userId));

  return rows.map((g) => {
    const mine = logs
      .filter((l) => l.goalId === g.id)
      .sort((a, b) => a.month.localeCompare(b.month));
    const stages = (g.stages as GoalStage[] | null) ?? [];
    const clock = readClock({
      baselineMonths: g.baselineMonths,
      minMonthlyHours: g.minMonthlyHours,
      stages,
      monthlyHours: mine.map((l) => l.hours),
    });
    return {
      id: g.id, title: g.title, category: g.category, status: g.status,
      baselineMonths: g.baselineMonths, minMonthlyHours: g.minMonthlyHours,
      stages, clock,
      logs: mine.slice(-6).map((l) => ({ month: l.month, hours: l.hours, note: l.note })),
      createdAt: g.createdAt,
    };
  });
}

export async function toggleStage(userId: number, goalId: number, stageIndex: number) {
  const db = await getDb();
  if (!db) return false;
  const [g] = await db.select().from(goals).where(and(eq(goals.id, goalId), eq(goals.userId, userId)));
  if (!g) return false;
  const stages = ((g.stages as GoalStage[] | null) ?? []).slice();
  if (stageIndex < 0 || stageIndex >= stages.length) return false;
  stages[stageIndex] = { ...stages[stageIndex], done: !stages[stageIndex].done };
  const allDone = stages.length > 0 && stages.every((s) => s.done);
  await db.update(goals)
    .set({ stages, status: allDone ? "achieved" : "active" })
    .where(eq(goals.id, goalId));
  return true;
}

export async function logEffort(userId: number, goalId: number, month: string, hours: number, note?: string) {
  const db = await getDb();
  if (!db) return false;
  const [g] = await db.select({ id: goals.id }).from(goals)
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)));
  if (!g) return false;
  // Upsert per (goal, month): a re-log replaces the month's entry.
  await db.delete(goalLogs).where(and(eq(goalLogs.goalId, goalId), eq(goalLogs.month, month)));
  await db.insert(goalLogs).values({ goalId, userId, month, hours: Math.max(0, Math.min(744, hours)), note: note?.slice(0, 2000) ?? null });
  return true;
}

// ── The goals⇄assessment bridge ──────────────────────────────────────────────
// Members already SPOKE their goals in the goals-elicitation questions
// (positions in shared/goalsQuestions). Parse those transcripts into
// ready-to-add goal suggestions so the dashboard starts full, not empty.
export async function suggestGoalsFromAssessment(userId: number): Promise<{ available: boolean; suggestions: string[] }> {
  const db = await getDb();
  if (!db) return { available: false, suggestions: [] };
  const { llmProvider } = await import("./platform/config");
  if (llmProvider() === "mock") return { available: false, suggestions: [] };

  const { getLatestAssessment, getResponsesByAssessment } = await import("./db");
  const { GOALS_QUESTION_INDICES } = await import("@shared/goalsQuestions");
  const latest = await getLatestAssessment(userId);
  if (!latest) return { available: false, suggestions: [] };
  const rows = await getResponsesByAssessment(latest.id);
  const goalTexts = rows
    .filter((r) => (GOALS_QUESTION_INDICES as readonly number[]).includes(r.questionIndex) && r.transcript)
    .map((r) => r.transcript as string);
  if (goalTexts.length === 0) return { available: false, suggestions: [] };

  try {
    const { invokeLLM } = await import("./platform/llm");
    const result = await invokeLLM({
      messages: [
        { role: "system" as const, content: 'Extract the person\'s REAL stated life goals from these spoken answers. Respond ONLY with JSON: {"goals": [up to 8 short goal statements, each under 12 words, first person, e.g. "Start my own consulting business"]}. Only goals they actually stated or clearly implied — never invent.' },
        { role: "user" as const, content: goalTexts.join("\n\n---\n\n").slice(0, 24_000) },
      ],
      maxTokens: 400,
    } as import("./platform/llm").InvokeParams);
    const raw = (result as { content?: string; text?: string })?.content ?? (result as { text?: string })?.text ?? "";
    const m = String(raw).match(/\{[\s\S]*\}/);
    if (!m) return { available: false, suggestions: [] };
    const parsed = JSON.parse(m[0]) as { goals?: string[] };
    const suggestions = (parsed.goals ?? []).filter((g) => typeof g === "string" && g.length >= 3).slice(0, 8).map((g) => g.slice(0, 200));
    return { available: suggestions.length > 0, suggestions };
  } catch {
    return { available: false, suggestions: [] };
  }
}

export async function setGoalStatus(userId: number, goalId: number, status: "active" | "achieved" | "paused" | "retired") {
  const db = await getDb();
  if (!db) return false;
  await db.update(goals).set({ status })
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)));
  return true;
}

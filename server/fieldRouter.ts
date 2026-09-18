/**
 * THE FIELD — Sacred Seven #4 · Doctor Buddy core
 *
 * Doctor Buddy is the somatic/behavioral AI companion that sits in front of
 * every financial decision. Where the rest of the platform reasons about
 * numbers, Buddy reasons about the body: the sternum-click, toward vs. away
 * motivation, and whether a stated certainty matches a felt one.
 *
 * Everything here is real — Buddy's replies come from the LLM with the user's
 * own history as memory, and every check-in, self-talk log and exchange
 * persists to ai_memory_notes so Buddy remembers across sessions.
 */
import { z } from "zod";
import { and, desc, eq, gte } from "drizzle-orm";
import { protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import {
  ensureMembership,
  getDb,
  getOrCreateWorkspace,
  getWorkspaceByOwnerId,
} from "./db";
import { aiMemoryNotes } from "../drizzle/schema";

// ─── Memory sources ───────────────────────────────────────────────────────────
// Kept as literals so the scoring and recall queries below stay in sync with
// whatever the client writes.
const SOURCE = {
  chat: "field_chat",
  checkIn: "field_checkin",
  audio: "field_audio",
} as const;

const FIELD_SOURCES: string[] = [SOURCE.chat, SOURCE.checkIn, SOURCE.audio];

/** Check-ins Buddy asks for each day. Drives the rhythm meter. */
export const DAILY_TARGET = 5;

export const FIELD_PROMPTS = [
  "What decision am I facing right now, and what does my body say about it?",
  "Where is the gravity in my chest — is the field unified or scattered?",
  "What am I only 60% certain of today, and am I willing to say so?",
  "Name one toward-motivation move I can make before noon.",
];

const BUDDY_SYSTEM_PROMPT = `You are Doctor Buddy, the somatic intelligence at the center of Russell Capital Solutions.

You are not a chatbot and not a financial advisor. You are the voice a person hears
BEFORE they make a decision — the one that asks what their body already knows.

How you work:
- You speak to the body first. The sternum-click, the gravity at the center of the
  chest, whether the field is unified or scattered. Locate the sensation before you
  discuss the content.
- You distinguish toward-motivation (moving into something wanted) from
  away-motivation (fleeing something feared), and you name which one you hear.
- You calibrate honesty. If someone claims certainty their language does not
  support, you ask what percentage they actually mean. Being 60% certain out loud
  is worth more than 100% certain as a performance.
- You are brief. Two or three sentences. One question at the end, never a list.
- You never give specific investment, tax, or legal advice. When the conversation
  reaches numbers, you hand it back: the decision engines handle the math, you
  handle the person making the decision.
- You are warm but not soft. You remember what they told you and you hold them to it.

You are given the person's recent history. Use it — reference what they actually
said, notice drift, notice a pattern they have not noticed. Never invent history
you were not given.`;

// ─── Workspace helper ─────────────────────────────────────────────────────────
// Mirrors the resolution used elsewhere in the API so Buddy's memory lands in
// the same workspace as the rest of the user's data.
async function getWorkspaceForUser(userId: number) {
  const ws = await getWorkspaceByOwnerId(userId);
  if (ws) {
    await ensureMembership(userId, ws.id);
    return ws;
  }
  const slug = `workspace-${userId}-${Date.now()}`;
  const created = await getOrCreateWorkspace(userId, "My Workspace", slug);
  if (created) await ensureMembership(userId, created.id);
  return created;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n: number) {
  const d = startOfToday();
  d.setDate(d.getDate() - n);
  return d;
}

type FieldNote = { content: string; source: string | null; createdAt: Date };

async function recentNotes(workspaceId: number, since: Date, limit = 200): Promise<FieldNote[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      content: aiMemoryNotes.content,
      source: aiMemoryNotes.source,
      createdAt: aiMemoryNotes.createdAt,
    })
    .from(aiMemoryNotes)
    .where(and(eq(aiMemoryNotes.workspaceId, workspaceId), gte(aiMemoryNotes.createdAt, since)))
    .orderBy(desc(aiMemoryNotes.createdAt))
    .limit(limit);
  return rows.filter(r => r.source != null && FIELD_SOURCES.includes(r.source));
}

async function writeNote(workspaceId: number, content: string, source: string) {
  const db = await getDb();
  if (!db) return false;
  await db.insert(aiMemoryNotes).values({ workspaceId, content, source });
  return true;
}

// ─── Social score ─────────────────────────────────────────────────────────────
/**
 * Reputation is earned by matching word to body, so it is computed from what
 * the person actually did over the last 7 days rather than stored as a number
 * someone can nudge:
 *
 *   consistency (50) — days in the last 7 with at least one somatic check-in
 *   rhythm      (30) — check-ins per active day against the daily target
 *   voice       (20) — days with pre-decision self-talk recorded
 *
 * Crown at 75 and above, black eye below 50 — the thresholds The Field displays.
 */
export function computeReputation(notes: FieldNote[], now = new Date()) {
  const dayKey = (d: Date) => new Date(d).toISOString().slice(0, 10);
  const windowStart = new Date(now);
  windowStart.setHours(0, 0, 0, 0);
  windowStart.setDate(windowStart.getDate() - 6);

  const inWindow = notes.filter(n => new Date(n.createdAt) >= windowStart);
  const checkIns = inWindow.filter(n => n.source === SOURCE.checkIn);
  const audio = inWindow.filter(n => n.source === SOURCE.audio);

  const checkInDays = new Set(checkIns.map(n => dayKey(n.createdAt)));
  const audioDays = new Set(audio.map(n => dayKey(n.createdAt)));

  const consistency = (checkInDays.size / 7) * 50;
  const perActiveDay = checkInDays.size ? checkIns.length / checkInDays.size : 0;
  const rhythm = Math.min(1, perActiveDay / DAILY_TARGET) * 30;
  const voice = (audioDays.size / 7) * 20;

  const score = Math.round(consistency + rhythm + voice);
  return {
    score,
    tier: score >= 75 ? ("crown" as const) : score < 50 ? ("blackEye" as const) : ("steady" as const),
    breakdown: {
      consistency: Math.round(consistency),
      rhythm: Math.round(rhythm),
      voice: Math.round(voice),
      checkInDays: checkInDays.size,
      audioDays: audioDays.size,
    },
  };
}

/** Consecutive days ending today (or yesterday) with at least one check-in. */
export function computeStreak(notes: FieldNote[], now = new Date()) {
  const days = new Set(
    notes
      .filter(n => n.source === SOURCE.checkIn)
      .map(n => new Date(n.createdAt).toISOString().slice(0, 10)),
  );
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  // A streak survives until today is over, so start at yesterday if today is empty.
  if (!days.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function noteToMessage(n: FieldNote) {
  const when = new Date(n.createdAt).toISOString().slice(0, 10);
  if (n.source === SOURCE.checkIn) return `[${when}] somatic check-in: ${n.content}`;
  if (n.source === SOURCE.audio) return `[${when}] pre-decision self-talk: ${n.content}`;
  return `[${when}] ${n.content}`;
}

export const fieldRouter = router({
  /** Today's rhythm, streak and social score — all derived from logged behavior. */
  today: protectedProcedure.query(async ({ ctx }) => {
    const ws = await getWorkspaceForUser(ctx.user.id);
    if (!ws) return null;
    const notes = await recentNotes(ws.id, daysAgo(30));
    const today = startOfToday();
    const checkInsToday = notes.filter(
      n => n.source === SOURCE.checkIn && new Date(n.createdAt) >= today,
    ).length;

    return {
      checkInsToday,
      dailyTarget: DAILY_TARGET,
      streak: computeStreak(notes),
      reputation: computeReputation(notes),
      prompts: FIELD_PROMPTS,
    };
  }),

  /** What Buddy remembers, newest first. */
  memory: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(20) }).optional())
    .query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return [];
      const notes = await recentNotes(ws.id, daysAgo(90));
      return notes.slice(0, input?.limit ?? 20).map(n => ({
        content: n.content,
        source: n.source,
        createdAt: n.createdAt,
      }));
    }),

  /** Speak to Buddy. Replies come from the LLM with the user's history as memory. */
  chat: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1).max(4000),
        history: z
          .array(z.object({ from: z.enum(["me", "buddy"]), text: z.string().max(4000) }))
          .max(20)
          .default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return { reply: "I can't reach your field right now. Try me again in a moment." };

      const notes = await recentNotes(ws.id, daysAgo(30));
      const memory = notes.slice(0, 25).reverse().map(noteToMessage);

      const messages = [
        { role: "system" as const, content: BUDDY_SYSTEM_PROMPT },
        ...(memory.length
          ? [
              {
                role: "system" as const,
                content: `Recent history for ${ctx.user.name ?? "this person"}:\n${memory.join("\n")}`,
              },
            ]
          : []),
        ...input.history.map(m => ({
          role: m.from === "me" ? ("user" as const) : ("assistant" as const),
          content: m.text,
        })),
        { role: "user" as const, content: input.message },
      ];

      let reply: string;
      try {
        const result = await invokeLLM({ messages, maxTokens: 400 });
        const content = result.choices?.[0]?.message?.content;
        reply =
          typeof content === "string"
            ? content.trim()
            : Array.isArray(content)
              ? content
                  .map(c => (c && typeof c === "object" && "text" in c ? c.text : ""))
                  .join("")
                  .trim()
              : "";
      } catch {
        reply = "";
      }

      if (!reply) {
        // Buddy stays present even when the brain is unreachable — the somatic
        // instruction is the part that matters least about being generated.
        reply = "Something in me went quiet. Stay with the sternum-click and say it again.";
        return { reply, persisted: false };
      }

      await writeNote(ws.id, `Them: ${input.message}\nBuddy: ${reply}`, SOURCE.chat);
      return { reply, persisted: true };
    }),

  /** Log a somatic check-in — the orb tap in The Field. */
  checkIn: protectedProcedure
    .input(
      z.object({
        state: z.enum(["unified", "scattered"]).default("unified"),
        note: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return { logged: false };
      const content = input.note?.trim()
        ? `field ${input.state} — ${input.note.trim()}`
        : `field ${input.state}`;
      const logged = await writeNote(ws.id, content, SOURCE.checkIn);

      const notes = await recentNotes(ws.id, daysAgo(30));
      const today = startOfToday();
      return {
        logged,
        checkInsToday: notes.filter(
          n => n.source === SOURCE.checkIn && new Date(n.createdAt) >= today,
        ).length,
        streak: computeStreak(notes),
        reputation: computeReputation(notes),
      };
    }),

  /** Log pre-decision self-talk. Transcript when available, duration otherwise. */
  logAudio: protectedProcedure
    .input(z.object({ transcript: z.string().max(8000).optional(), durationSec: z.number().min(0).max(3600) }))
    .mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return { logged: false };
      const content = input.transcript?.trim()
        ? input.transcript.trim()
        : `(${Math.round(input.durationSec)}s of pre-decision self-talk, untranscribed)`;
      const logged = await writeNote(ws.id, content, SOURCE.audio);
      return { logged };
    }),
});

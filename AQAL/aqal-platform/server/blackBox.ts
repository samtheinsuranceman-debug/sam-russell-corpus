// ============================================================
// THE BLACK BOX — crash forensics engine (server side)
// ============================================================
// Members narrate 3–5 major life crashes or near-misses in their own
// words. The panel extracts AQAL's eight forensic layers per event,
// then synthesizes a cross-event Crash Signature + prevention
// architecture. Honest rules: crashes ANNOTATE, they never lower
// scores; mock provider → unavailable, never fabricated; crisis
// language triggers the safety net; "private" scope excludes an event
// from coaching entirely.

import { and, eq } from "drizzle-orm";
import { getDb } from "./db";
import { crashEvents, crashSignatures } from "../drizzle/schema";
import { scanForCrisis } from "@shared/growthEngine";

export const MAX_EVENTS = 7;
export const MIN_NARRATIVE_CHARS = 200; // an honest forensic read needs a real story

const EXTRACT_SYSTEM = `You are a failure-forensics analyst for the AQAL platform. The member has narrated a major life crash or near-miss. Extract AQAL's eight forensic layers FROM THEIR OWN WORDS — quote or closely paraphrase them; never invent facts they did not state. This is engineering, not judgment: identify mechanisms, not character flaws.

Respond ONLY with JSON:
{
 "expectedOutcome": "what was supposed to succeed and why it mattered (1-2 sentences)",
 "timeline": "first, second, third — and where it began deteriorating (2-3 sentences)",
 "internalState": "what they were thinking, feeling, fearing, craving, avoiding — incl. body signals if stated",
 "takeover": "the impulse or behavior that overtook better judgment; name the mechanism: avoidance | urgency | denial | overreach | collapse | impulsivity",
 "blindSpot": "what others could see that they could not; if unstated, what the narrative implies was invisible to them — label inference as inference",
 "consequences": "what it cost: financial, relational, physical, professional, spiritual",
 "counterfactual": "the ONE intervention, person, rule, or signal that might have changed the outcome",
 "recurrenceRisk": "where the same pattern could appear next (relationships, work, health, money)",
 "lines": ["1-3 intelligence-line names from this exact list that the failure ran through: Logical, Mathematical, Spatial, Linguistic, Volitional, Meta-Cognitive, Intrapersonal, Reflective, Existential, Philosophical, Integrative, Interpersonal, Empathic, Intuitive, Musical, Kinesthetic, Naturalistic, Strategic, Tactical, Adaptive, Resilient, Systematic, Architectural, Adversarial, Interoceptive, Aesthetic, Influence, Humor, Parenting, Seduction, Community-Founding, Financial-Self-Management"]
}`;

const SIGNATURE_SYSTEM = `You are synthesizing a member's crash forensics into their Crash Signature and prevention architecture. You have their extracted events. Find what RECURS — one crash is bad luck; the same mechanism across several is the fault line. Use their own language where possible. Never promise crashes can be eliminated; the honest goal is detect earlier, recover faster, lower the odds.

Respond ONLY with JSON:
{
 "signature": "one 'When X, I do Y, which causes Z' sentence in second person — the recurring mechanism, specific and recognizable",
 "recurringModes": ["1-3 mechanisms appearing across events"],
 "leadingIndicators": ["2-4 observable early-warning signs, from their narratives"],
 "triggerConditions": ["2-4 situations that precede the pattern (e.g. sleep loss, rejection, financial stress, novelty, conflict)"],
 "stopRules": ["2-3 concrete IF-THEN rules, e.g. 'Do not send the message for 24 hours', 'No money moves during emotional activation'"],
 "replacementBehavior": "one concrete alternative performable under pressure",
 "accountability": "who or what interrupts the pattern when self-control is weakest",
 "recoveryProtocol": "what to do after the FIRST slip, before it becomes the full crash",
 "recurringLines": ["1-2 line names recurring across events"],
 "cascade": ["trigger", "interpretation", "emotional state", "impulse", "behavior", "short-term reward", "delayed cost", "recovery opportunity"] — replace each generic stage with THEIR specific version from the events
}`;

async function llmJson(system: string, user: string, maxTokens: number): Promise<Record<string, unknown> | null> {
  const { llmProvider } = await import("./platform/config");
  if (llmProvider() === "mock") return null;
  try {
    const { invokeLLM } = await import("./platform/llm");
    const result = await invokeLLM({
      messages: [
        { role: "system" as const, content: system },
        { role: "user" as const, content: user.slice(0, 28_000) },
      ],
      maxTokens,
    } as import("./platform/llm").InvokeParams);
    const raw = (result as { content?: string; text?: string })?.content ?? (result as { text?: string })?.text ?? "";
    const m = String(raw).match(/\{[\s\S]*\}/);
    return m ? (JSON.parse(m[0]) as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function listEvents(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(crashEvents).where(eq(crashEvents.userId, userId));
}

export async function addEvent(userId: number, title: string, narrative: string, scope: "private" | "coaching") {
  const db = await getDb();
  if (!db) return { ok: false as const, error: "The Black Box is unavailable right now." };
  const mine = await listEvents(userId);
  if (mine.length >= MAX_EVENTS) return { ok: false as const, error: `The Black Box holds ${MAX_EVENTS} events — remove one to add another.` };
  if (narrative.trim().length < MIN_NARRATIVE_CHARS) {
    return { ok: false as const, error: "An honest forensic read needs the real story — a few more paragraphs. What happened first? What were you feeling? What did it cost?" };
  }
  const crisis = scanForCrisis(narrative);
  if (crisis) {
    try {
      const { crisisFlags } = await import("../drizzle/schema");
      await db.insert(crisisFlags).values({ userId, source: "black_box", excerpt: null });
    } catch { /* flag insert is best-effort */ }
  }
  const [res] = await db.insert(crashEvents).values({
    userId, title: title.slice(0, 200), narrative: narrative.slice(0, 30_000), scope,
  });
  return { ok: true as const, eventId: Number(res.insertId), crisis };
}

export async function removeEvent(userId: number, eventId: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(crashEvents).where(and(eq(crashEvents.id, eventId), eq(crashEvents.userId, userId)));
  return true;
}

export async function extractEvent(userId: number, eventId: number) {
  const db = await getDb();
  if (!db) return { ok: false as const, reason: "no-db" as const };
  const [ev] = await db.select().from(crashEvents).where(and(eq(crashEvents.id, eventId), eq(crashEvents.userId, userId)));
  if (!ev) return { ok: false as const, reason: "not-found" as const };
  const extraction = await llmJson(EXTRACT_SYSTEM, `TITLE: ${ev.title}\n\nNARRATIVE:\n${ev.narrative}`, 900);
  if (!extraction) return { ok: false as const, reason: "no-ai" as const };
  await db.update(crashEvents).set({ extraction }).where(eq(crashEvents.id, eventId));
  return { ok: true as const, extraction };
}

export async function buildSignature(userId: number) {
  const db = await getDb();
  if (!db) return { ok: false as const, reason: "no-db" as const };
  // "private"-scoped events are the member's alone — excluded from synthesis.
  const events = (await listEvents(userId)).filter((e) => e.scope === "coaching" && e.extraction);
  if (events.length < 2) return { ok: false as const, reason: "too-few" as const };
  const corpus = events.map((e, i) => `EVENT ${i + 1}: ${e.title}\n${JSON.stringify(e.extraction)}`).join("\n\n");
  const report = await llmJson(SIGNATURE_SYSTEM, corpus, 1100);
  if (!report) return { ok: false as const, reason: "no-ai" as const };
  const existing = await db.select({ id: crashSignatures.id }).from(crashSignatures).where(eq(crashSignatures.userId, userId));
  if (existing.length > 0) {
    await db.update(crashSignatures).set({ report, eventCount: events.length }).where(eq(crashSignatures.userId, userId));
  } else {
    await db.insert(crashSignatures).values({ userId, report, eventCount: events.length });
  }
  return { ok: true as const, report };
}

export async function getSignature(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(crashSignatures).where(eq(crashSignatures.userId, userId));
  return row ?? null;
}

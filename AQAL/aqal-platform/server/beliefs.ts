// ============================================================
// THE BELIEF PARADIGM — server side
// ============================================================
// The founder's spec: elicit the member's most formative beliefs from what
// they actually said, classify limiting vs. empowering, give research-
// grounded counter-evidence for the limiting ones and reinforcement for the
// empowering ones — and let the member decide for themselves. Beliefs are
// the second assessment, after the 32 lines.

import { and, desc, eq } from "drizzle-orm";
import { getDb, getLatestAssessment, getResponsesByAssessment } from "./db";
import { beliefs } from "../drizzle/schema";

const MAX_BELIEFS = 12;

export async function listBeliefs(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(beliefs).where(eq(beliefs.userId, userId)).orderBy(desc(beliefs.createdAt));
}

export async function setBeliefStatus(userId: number, beliefId: number, status: "active" | "revised" | "dismissed") {
  const db = await getDb();
  if (!db) return false;
  await db.update(beliefs).set({ status }).where(and(eq(beliefs.id, beliefId), eq(beliefs.userId, userId)));
  return true;
}

// Elicit beliefs from the member's own assessment transcripts. One panel-style
// LLM pass; results are stored so this is run on demand, not per page-view.
export async function elicitBeliefs(userId: number): Promise<{ ok: boolean; added: number; reason?: string }> {
  const db = await getDb();
  if (!db) return { ok: false, added: 0, reason: "unavailable" };
  const { llmProvider } = await import("./platform/config");
  if (llmProvider() === "mock") return { ok: false, added: 0, reason: "no-ai" };

  const latest = await getLatestAssessment(userId);
  if (!latest) return { ok: false, added: 0, reason: "no-assessment" };
  const rows = await getResponsesByAssessment(latest.id);
  const transcripts = rows.filter((r) => r.transcript).map((r) => r.transcript as string);
  if (transcripts.length < 3) return { ok: false, added: 0, reason: "too-few-answers" };

  const existing = await listBeliefs(userId);
  if (existing.length >= MAX_BELIEFS) return { ok: false, added: 0, reason: "full" };

  try {
    const { invokeLLM } = await import("./platform/llm");
    const result = await invokeLLM({
      messages: [
        {
          role: "system" as const,
          content: `You identify a person's FORMATIVE BELIEFS from their spoken answers — the operating assumptions underneath what they say, especially about money, capability, relationships, worthiness, and what's possible for them.

Respond ONLY with JSON:
{"beliefs": [{
  "text": the belief stated in first person, under 25 words, in their spirit ("People like me don't get to..."),
  "kind": "limiting" | "empowering",
  "evidence": for limiting - 2-3 sentences of honest, research-grounded counter-evidence (growth/trainability findings, base rates, documented counterexamples; never platitudes). For empowering - 1-2 sentences reinforcing it with what the research supports.
  "touches": comma-separated life areas this belief affects ("money, career")
}]}

Rules: 4-8 beliefs total, only beliefs genuinely evidenced in THEIR words (quote-level fidelity to their meaning, never invented), at least one empowering belief if any exist. Be respectful — these are read by the person themselves.`,
        },
        { role: "user" as const, content: transcripts.join("\n\n---\n\n").slice(0, 60_000) },
      ],
      maxTokens: 1400,
    } as import("./platform/llm").InvokeParams);
    const raw = (result as { content?: string; text?: string })?.content ?? (result as { text?: string })?.text ?? "";
    const m = String(raw).match(/\{[\s\S]*\}/);
    if (!m) return { ok: false, added: 0, reason: "parse" };
    const parsed = JSON.parse(m[0]) as { beliefs?: { text?: string; kind?: string; evidence?: string; touches?: string }[] };
    const clean = (parsed.beliefs ?? [])
      .filter((b) => b.text && (b.kind === "limiting" || b.kind === "empowering"))
      .slice(0, MAX_BELIEFS - existing.length);
    if (clean.length === 0) return { ok: false, added: 0, reason: "none-found" };

    // Skip near-duplicates of existing beliefs
    const have = new Set(existing.map((b) => b.text.toLowerCase().slice(0, 60)));
    let added = 0;
    for (const b of clean) {
      const key = (b.text as string).toLowerCase().slice(0, 60);
      if (have.has(key)) continue;
      await db.insert(beliefs).values({
        userId,
        text: (b.text as string).slice(0, 500),
        kind: b.kind as "limiting" | "empowering",
        evidence: b.evidence?.slice(0, 4000) ?? null,
        touches: b.touches?.slice(0, 300) ?? null,
      });
      added++;
    }
    return { ok: true, added };
  } catch (e) {
    console.error("[beliefs] elicit failed:", e);
    return { ok: false, added: 0, reason: "error" };
  }
}

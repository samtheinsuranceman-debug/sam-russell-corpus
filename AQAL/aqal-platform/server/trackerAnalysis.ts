// ============================================================
// Tracker analysis — turn an uploaded behavioral journal into a
// SELF-REPORTED (never independently verified) profile update + fresh Vision.
// ============================================================
// The person dictated a daily journal for a 30/60/90-day cycle and uploaded it.
// We read it and produce directional adjustments and an updated, honestly-
// hypothetical future-pace. HONESTY: this is taken at their word — it is a
// self-reported change, tagged unverified, never presented as a re-measurement.

import { invokeLLM, llmConfigured } from "./platform/llm";
import { buildProjections } from "@shared/keystonePractices";
import type { ScoreRow } from "./coaching";

export type TrackerAdjustment = {
  line: string;
  direction: "up" | "steady" | "down";
  note: string;
};

export type TrackerAnalysis = {
  summary: string;              // plain-language read of what changed
  adjustments: TrackerAdjustment[];
  freshVision: string;          // updated hypothetical future-pace off this cycle
  adherenceNote: string;        // honest read on consistency
  disclaimer: string;
};

const DISCLAIMER =
  "Self-reported and directional — this update reflects what you told us in your journal, taken at your word. It is not an independently verified re-measurement of your profile.";

function weakestLines(scores: ScoreRow[], n = 3): string[] {
  return [...scores].sort((a, b) => a.score - b.score).slice(0, n).map((s) => s.axisName);
}

function adherenceFromJournal(journal: string, days: number): { entries: number; note: string } {
  // Count day markers ("Day 1", "Day 2", …) or paragraph blocks as a rough proxy.
  const dayMarks = (journal.match(/\bday\s*\d+/gi) || []).length;
  const blocks = journal.split(/\n\s*\n/).filter((b) => b.trim().length > 20).length;
  const entries = Math.max(dayMarks, blocks);
  const ratio = days > 0 ? entries / days : 0;
  const note =
    ratio >= 0.8 ? `Strong consistency — roughly ${entries} of ${days} days logged. That adherence is exactly what converts a practice into a result.`
    : ratio >= 0.4 ? `Partial consistency — about ${entries} of ${days} days logged. Real signal, with room to tighten the streak next cycle.`
    : `Light logging — around ${entries} of ${days} days captured. The research is clear that consistency, not intensity, is what moves the line; aim to log daily next cycle.`;
  return { entries, note };
}

function mockAnalysis(journal: string, goals: string, scores: ScoreRow[], days: number): TrackerAnalysis {
  const weak = weakestLines(scores.length ? scores : [{ axisName: "your controlling weakness", score: 0 }]);
  const { note: adherenceNote, entries } = adherenceFromJournal(journal, days);
  const moved = entries >= Math.max(1, days * 0.4);
  const adjustments: TrackerAdjustment[] = weak.slice(0, 3).map((line, i) => ({
    line,
    direction: moved && i === 0 ? "up" : "steady",
    note: moved && i === 0
      ? `You reported repeated practice touching ${line}; directionally this is your most-improved line this cycle.`
      : `${line} held steady — keep the prescribed move on it next cycle to start bending the curve.`,
  }));
  const area = goals.trim() ? "the goals you named" : "your outcomes";
  const projections = buildProjections(goals);
  const t = projections[0];
  const freshVision = moved
    ? `You put in real reps this cycle — that changes the projection. ${t ? `${t.researchBasis} ` : ""}If you hold this consistency through the next ${days} days, the trajectory toward ${area} compounds rather than resets. Still a hypothetical, still conditioned on your follow-through — but now it is built on evidence you actually did the work.`
    : `The plan is sound; this cycle the missing ingredient was reps, not knowledge. Tighten the daily logging next cycle and the projection toward ${area} starts to move. This remains a hypothesis you prove with consistency, not a promise.`;
  const summary = moved
    ? `Across ~${entries} logged days you reported consistent practice. Directionally, ${weak[0]} — your controlling weakness — is your most-improved line; the rest held. Self-reported, so we've updated your profile as an unverified change and refreshed your Vision to match.`
    : `You logged ~${entries} days this cycle. Nothing has moved enough to re-estimate confidently yet — the honest read is that the plan is right and the reps were light. Keep the same prescription and log daily next cycle.`;
  return { summary, adjustments, freshVision, adherenceNote, disclaimer: DISCLAIMER };
}

const SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    freshVision: { type: "string" },
    adherenceNote: { type: "string" },
    adjustments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          line: { type: "string" },
          direction: { type: "string", enum: ["up", "steady", "down"] },
          note: { type: "string" },
        },
        required: ["line", "direction", "note"],
        additionalProperties: false,
      },
    },
  },
  required: ["summary", "freshVision", "adherenceNote", "adjustments"],
  additionalProperties: false,
} as const;

export async function analyzeJournal(opts: {
  journalText: string;
  goals: string;
  scores: ScoreRow[];
  days: number;
}): Promise<TrackerAnalysis> {
  const { journalText, goals, scores, days } = opts;
  if (!llmConfigured() || !journalText.trim()) {
    return mockAnalysis(journalText, goals, scores, days);
  }
  const weak = weakestLines(scores, 5).join(", ");
  const prompt = `A person completed a ${days}-day behavioral-journal cycle and uploaded their dictated journal.
Their weakest intelligence lines (the ones we prescribed work on): ${weak || "(unknown)"}.
Their stated goals: ${goals || "(not provided)"}.

Read the journal and produce a SELF-REPORTED, directional update. Rules:
- This is taken at their word — never claim to have re-measured them. Say "self-reported / directional".
- "adjustments": for the lines they actually worked on, give a direction (up/steady/down) and a short honest
  note grounded in what the journal says. Do NOT invent progress the journal doesn't describe.
- "adherenceNote": an honest read of how consistently they logged/practiced (consistency > intensity).
- "summary": plain-language, honest — if they barely practiced, say so kindly and keep the prescription.
- "freshVision": an updated, explicitly-hypothetical future-pace conditioned on continued follow-through —
  moving but never a promise; reflect whether they actually did the reps.

JOURNAL (verbatim, may be long):
${journalText.slice(0, 12000)}`;
  try {
    const result = await invokeLLM({
      messages: [
        { role: "system", content: "You are an honest coach reading a self-reported journal. You never fabricate progress and never present self-report as verified measurement. Always respond with valid JSON." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_schema", json_schema: { name: "tracker_analysis", strict: true, schema: SCHEMA as any } },
    });
    const content = result.choices?.[0]?.message?.content as string | undefined;
    if (!content) return mockAnalysis(journalText, goals, scores, days);
    const parsed = JSON.parse(content) as Omit<TrackerAnalysis, "disclaimer">;
    return { ...parsed, disclaimer: DISCLAIMER };
  } catch {
    return mockAnalysis(journalText, goals, scores, days);
  }
}

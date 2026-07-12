// ============================================================
// Outcome Engineering — goal-aligned coaching from scores + stated goals
// ============================================================
// The closed loop that makes the platform distinct: take a person's 32-line
// profile AND the goals they stated, then diagnose which weakness clusters most
// threaten those specific outcomes, prescribe research-backed moves, and project
// the directional uplift. LLM-driven with a strict schema; a representative mock
// runs when no model is configured.
//
// HONESTY: every number here is a DIRECTIONAL, model-based estimate — a coaching
// signal, not a guarantee or a clinical prediction. The prompt and the UI both
// say so.

import { invokeLLM, llmConfigured } from "./platform/llm";
import { ALL_AXES, axisFeedsRarity } from "@shared/axisModes";

export type ScoreRow = { axisName: string; score: number; confidence?: number | null };

export type OutcomeThreat = {
  weakness: string;
  goalArea: string;
  reasoning: string;
  risk: "Low" | "Moderate" | "High" | "Severe";
  derailmentLikelihood: number; // 0..100, directional
  move: string;                 // prescribed, research-grounded action
  libraryTopic: string;         // what to read in the Research Library
  upliftIfAddressed: number;    // 0..100, directional
};

export type OutcomeEnabler = { strength: string; goalArea: string; how: string };

export type OutcomeReport = {
  summary: string;
  keystoneMove: string;
  threats: OutcomeThreat[];
  enablers: OutcomeEnabler[];
  disclaimer: string;
};

const DISCLAIMER =
  "Directional, model-based coaching estimates — not guarantees or clinical predictions. Percentages express relative priority, not measured probabilities.";

function rank(scores: ScoreRow[]) {
  const feed = scores.filter((s) => axisFeedsRarity(s.axisName));
  const sorted = [...feed].sort((a, b) => a.score - b.score);
  const weaknesses = sorted.slice(0, 5).map((s) => s.axisName);
  const strengths = sorted.slice(-5).reverse().map((s) => s.axisName);
  return { strengths, weaknesses };
}

// Deterministic, representative report — used when no LLM is configured, so the
// UI and flow work end-to-end without credentials.
function mockReport(scores: ScoreRow[], goals: string): OutcomeReport {
  const { strengths, weaknesses } = rank(scores);
  const w = (i: number) => weaknesses[i] ?? ALL_AXES[i] ?? "a weakness line";
  const s = (i: number) => strengths[i] ?? ALL_AXES[i] ?? "a strength line";
  const area = goals.trim() ? "your stated goals" : "your outcomes";
  return {
    summary: `Your profile is carried by ${s(0)} and ${s(1)}, but ${w(0)} is the line most likely to create friction against ${area}. Engineering it first changes the odds more than adding to any strength.`,
    keystoneMove: `Bolster ${w(0)} — it is the most central of your weakness lines, so lifting it lifts the others with it.`,
    threats: [
      { weakness: w(0), goalArea: area, reasoning: `${w(0)} sits upstream of several of your goals; left unaddressed it quietly caps outcomes no matter how strong ${s(0)} is (weakest-link effect).`, risk: "High", derailmentLikelihood: 62, move: `Targeted, tracked practice on ${w(0)} with if-then plans (implementation intentions) to keep it from derailing goal pursuit.`, libraryTopic: "Leverage Points & Tracking", upliftIfAddressed: 28 },
      { weakness: w(1), goalArea: area, reasoning: `${w(1)} amplifies ${w(0)} under pressure — a bridge node that spreads friction across domains.`, risk: "Moderate", derailmentLikelihood: 41, move: `Compensate and route around ${w(1)} using ${s(0)} as scaffolding while you build it.`, libraryTopic: "The Weakest Link — Bottleneck & O-Ring", upliftIfAddressed: 17 },
    ],
    enablers: [
      { strength: s(0), goalArea: area, how: `${s(0)} is your keystone strength — deliberately point it at your #1 goal and it lifts the whole shape (mutualism effect).` },
      { strength: s(1), goalArea: area, how: `${s(1)} accelerates execution once ${w(0)} is shored up.` },
    ],
    disclaimer: DISCLAIMER,
  };
}

const REPORT_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    keystoneMove: { type: "string" },
    threats: {
      type: "array",
      items: {
        type: "object",
        properties: {
          weakness: { type: "string" },
          goalArea: { type: "string" },
          reasoning: { type: "string" },
          risk: { type: "string", enum: ["Low", "Moderate", "High", "Severe"] },
          derailmentLikelihood: { type: "number" },
          move: { type: "string" },
          libraryTopic: { type: "string" },
          upliftIfAddressed: { type: "number" },
        },
        required: ["weakness", "goalArea", "reasoning", "risk", "derailmentLikelihood", "move", "libraryTopic", "upliftIfAddressed"],
        additionalProperties: false,
      },
    },
    enablers: {
      type: "array",
      items: {
        type: "object",
        properties: { strength: { type: "string" }, goalArea: { type: "string" }, how: { type: "string" } },
        required: ["strength", "goalArea", "how"],
        additionalProperties: false,
      },
    },
  },
  required: ["summary", "keystoneMove", "threats", "enablers"],
  additionalProperties: false,
} as const;

export async function generateOutcomeReport(scores: ScoreRow[], goals: string): Promise<OutcomeReport> {
  if (!llmConfigured() || scores.length === 0) {
    return mockReport(scores, goals);
  }
  const { strengths, weaknesses } = rank(scores);
  const prompt = `You are an outcome-engineering coach grounded in network psychometrics (centrality),
weakest-link/bottleneck theory, keystone/mutualism effects, and leverage-point theory.

The person's strongest lines: ${strengths.join(", ")}.
Their weakest lines: ${weaknesses.join(", ")}.
Their stated goals (verbatim): ${goals || "(not provided — reason from the profile alone)"}.

Produce an outcome-engineering report:
- Identify the weakness clusters most likely to create friction, loss, or derailment against THESE goals,
  and explain WHY using the mechanisms above (which is most central/controlling, which is the weakest link).
- For each threat: a risk band, a DIRECTIONAL derailment likelihood (0-100, relative priority — not a measured
  probability), a prescribed research-grounded move (bolster the controlling weakness / detach or route around it /
  build the keystone strength), a Research Library topic to read, and a DIRECTIONAL uplift estimate if addressed.
- Identify the keystone strengths that most accelerate these goals and how to aim them.
- Name the single highest-leverage "keystone move".
Be honest and specific. Never promise outcomes. Keep every number directional.`;

  try {
    const result = await invokeLLM({
      messages: [
        { role: "system", content: "You are a rigorous, honest coach. You never promise outcomes; you give directional, mechanism-based guidance. Always respond with valid JSON." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_schema", json_schema: { name: "outcome_report", strict: true, schema: REPORT_SCHEMA as any } },
    });
    const content = result.choices?.[0]?.message?.content as string | undefined;
    if (!content) return mockReport(scores, goals);
    const parsed = JSON.parse(content) as OutcomeReport;
    return { ...parsed, disclaimer: DISCLAIMER };
  } catch {
    return mockReport(scores, goals);
  }
}

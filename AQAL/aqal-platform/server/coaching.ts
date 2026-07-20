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
import { bottleneckRole, MECHANISM_META } from "@shared/bottleneckRoles";
import { practicesForGoals, corePractices, buildProjections, type KeystonePractice, type OutcomeProjection } from "@shared/keystonePractices";

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
  // The Vision: honest, confidence-tiered projections of what implementing the
  // prescribed behaviors could produce — explicitly hypothetical, never a promise.
  vision: string;                    // the future-paced narrative (LLM or templated)
  projections: OutcomeProjection[];  // deterministic, research-grounded, confidence-tiered
  theGap: string;                    // the knowing-doing gap + the commitment move
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

function dedupePractices(list: KeystonePractice[]): KeystonePractice[] {
  const seen = new Set<string>();
  return list.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
}

// The knowing–doing gap + the commitment move. This is the urgency that's HONEST:
// the cost isn't ignorance, it's inaction — and the fix is a plan, not more reading.
function gapText(): string {
  return "Here is the pattern the research keeps proving: most people already know the answer — save more, sleep more, listen to their partner — and still don't do it. The gap is not knowing. It is DOING. Every month on the old trajectory is a month you don't get back. So turn each move into an if-then plan ('If it's Sunday at 8pm, then we watch our film'), stack it onto a habit you already have, and track it. Planning the exact when-and-where is what the evidence shows converts intention into action — it is the difference between reading this and living it.";
}

// The Vision: an explicitly hypothetical, confidence-tiered future-pace. Honest by
// construction — it states the research basis and the confidence, and conditions
// everything on the person's own follow-through.
function visionText(goals: string, projections: OutcomeProjection[]): string {
  const area = goals.trim() ? "the goals you named" : "your outcomes";
  if (projections.length === 0) {
    return `Commit to the prescribed moves consistently and the evidence points toward real, compounding progress on ${area}. This is a hypothetical projection, not a promise — your follow-through decides the magnitude.`;
  }
  const t = projections[0];
  return `Picture yourself ${t.horizon} from now — if you actually did this, immediately and consistently. ${t.researchBasis} That is the trajectory the research points toward for ${area}, at ${t.confidence.toLowerCase()} confidence. It is not a guarantee. It is a glimpse of what becomes possible the moment you commit and follow through — and of what stays out of reach if you don't.`;
}

// Deterministic, representative report — used when no LLM is configured, so the
// UI and flow work end-to-end without credentials.
function mockReport(scores: ScoreRow[], goals: string): OutcomeReport {
  const { strengths, weaknesses } = rank(scores);
  const w = (i: number) => weaknesses[i] ?? ALL_AXES[i] ?? "a weakness line";
  const s = (i: number) => strengths[i] ?? ALL_AXES[i] ?? "a strength line";
  const area = goals.trim() ? "your stated goals" : "your outcomes";
  // Prescribe a real, goal-matched practice where one applies; else a core one.
  const matched = dedupePractices([...practicesForGoals(goals), ...corePractices()]);
  const p0 = matched[0];
  const move0 = p0
    ? `${p0.prescription} (Research Library: "${p0.librarySection}".)`
    : `Targeted, tracked practice on ${w(0)} with if-then plans (implementation intentions) to keep it from derailing goal pursuit.`;
  const topic0 = p0 ? p0.librarySection : "Leverage Points & Tracking";
  return {
    summary: `Your profile is carried by ${s(0)} and ${s(1)}, but ${w(0)} is your controlling weakness — the single line most likely to create friction against ${area}. Engineering it first changes the odds more than adding to any strength.`,
    keystoneMove: `Bolster ${w(0)} — it is the controlling weakness (the most central of your weak lines), so lifting it lifts the others with it.`,
    threats: [
      { weakness: w(0), goalArea: area, reasoning: `Controlling weakness. ${w(0)} sits upstream of several of your goals; left unaddressed it quietly caps outcomes no matter how strong ${s(0)} is (weakest-link effect). The percentage is how predictably it creates friction against the goals you named — directional, not a measured probability.`, risk: "High", derailmentLikelihood: 62, move: move0, libraryTopic: topic0, upliftIfAddressed: 28 },
      { weakness: w(1), goalArea: area, reasoning: `${w(1)} amplifies ${w(0)} under pressure — a bridge node that spreads friction across domains.`, risk: "Moderate", derailmentLikelihood: 41, move: `Compensate and route around ${w(1)} using ${s(0)} as scaffolding while you build it.`, libraryTopic: "The Weakest Link — Bottleneck & O-Ring", upliftIfAddressed: 17 },
    ],
    enablers: [
      { strength: s(0), goalArea: area, how: `${s(0)} is your keystone strength — deliberately point it at your #1 goal and it lifts the whole shape (mutualism effect).` },
      { strength: s(1), goalArea: area, how: `${s(1)} accelerates execution once ${w(0)} is shored up.` },
    ],
    vision: visionText(goals, buildProjections(goals)),
    projections: buildProjections(goals),
    theGap: gapText(),
    disclaimer: DISCLAIMER,
  };
}

const REPORT_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    keystoneMove: { type: "string" },
    vision: { type: "string" },
    theGap: { type: "string" },
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
  required: ["summary", "keystoneMove", "vision", "theGap", "threats", "enablers"],
  additionalProperties: false,
} as const;

export async function generateOutcomeReport(scores: ScoreRow[], goals: string): Promise<OutcomeReport> {
  if (!llmConfigured() || scores.length === 0) {
    return mockReport(scores, goals);
  }
  const { strengths, weaknesses } = rank(scores);

  // Surface the research-backed practices relevant to THIS person's goals (plus a
  // universal core) so the coach prescribes specific, cited moves from the library.
  const menu = dedupePractices([...practicesForGoals(goals), ...corePractices()]);
  const practiceMenu = menu
    .map((p) => `- ${p.name} [${p.evidence}] — lifts: ${p.lifts.join(", ")}. ${p.prescription} (Library: "${p.librarySection}")`)
    .join("\n");

  const prompt = `You are an outcome-engineering coach grounded in network psychometrics (centrality),
weakest-link/bottleneck theory, keystone/mutualism effects, and leverage-point theory.

The person's strongest lines: ${strengths.join(", ")}.
Their weakest lines, each with its established bottleneck mechanism:
${weaknesses.map((w) => { const r = bottleneckRole(w); return `- ${w} — ${MECHANISM_META[r.mechanism].label} (${r.mechanism}): ${r.failureMode}`; }).join("\n")}
Their stated goals (verbatim): ${goals || "(not provided — reason from the profile alone)"}.

Research-backed practices you may prescribe (evidence tier in brackets; prefer these over generic advice,
and match them to the goals — e.g. marriage/parenting goals should draw on the relational practices):
${practiceMenu || "- (use the general mechanisms below)"}

Use each line's mechanism above when you explain WHY it threatens the goals: a Liebig stave caps sustained
output (raise it), an O-Ring multiplies failure across outputs (its quality gates everything downstream), a
throughput constraint strands capacity behind the slowest step (widen it). Stay consistent with these mechanisms.

Produce an outcome-engineering report:
- Identify the weakness clusters most likely to create friction, loss, or derailment against THESE goals,
  and explain WHY using the mechanisms above (which is most central/controlling, which is the weakest link).
- In the summary, explicitly NAME the single "controlling weakness" — the one line whose failure most
  predictably derails the stated goals — and make the first threat that line.
- For each threat: a risk band, a DIRECTIONAL derailment likelihood (0-100) framed as HOW PREDICTABLY that
  weakness creates friction against the goals the person named (relative priority — not a measured
  probability), a prescribed research-grounded move that draws on the practice menu where it fits (name the
  specific practice), the matching Research Library topic to read, and a DIRECTIONAL uplift estimate if addressed.
- Identify the keystone strengths that most accelerate these goals and how to aim them.
- Name the single highest-leverage "keystone move".
- Write "vision": a vivid, second-person, future-paced glimpse (3–5 sentences) of what THIS person's life could
  look like if they implement the prescribed practices consistently for the recommended time. Ground it in the
  practice menu's research. It MUST be explicitly hypothetical — say plainly it is a possibility conditioned on
  their follow-through, not a promise — while still being genuinely moving. Name the confidence honestly.
- Write "theGap": 2–4 sentences on the knowing-doing gap — that most people know the answer and fail to implement,
  that the cost is inaction not ignorance, and that turning each move into an if-then plan + habit + tracking is
  what closes it. Make it urgent and honest, not manipulative.
Honesty rules: never promise outcomes; keep every number directional; respect each practice's evidence tier
(do not present an Emerging practice as proven); never prescribe the psychedelic entry as an action; the vision
is a hypothetical projection, never a guarantee.`;

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
    // Projections are computed deterministically from real practice data (never
    // LLM-invented), so their confidence bands and research basis stay honest.
    const projections = buildProjections(goals);
    return {
      ...parsed,
      projections,
      vision: parsed.vision?.trim() || visionText(goals, projections),
      theGap: parsed.theGap?.trim() || gapText(),
      disclaimer: DISCLAIMER,
    };
  } catch {
    return mockReport(scores, goals);
  }
}

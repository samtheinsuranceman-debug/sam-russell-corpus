// ============================================================
// Goals / outcomes questions — single source of truth for their identity
// ============================================================
// The assessment includes two goals/outcomes questions (authored in
// client/src/pages/Assessment.tsx as QUESTIONS_SOURCE ids 33 & 34). Their spoken
// answers are the "declared outcomes" we align strength-scaffolding and
// weakness-patching to — the target the coaching engine engineers toward.
//
// Responses are stored with a `questionIndex` = the 0-based position in the
// display order (QUESTION_ORDER). The goals questions currently sit at positions
// 12 and 13. Previously the server matched those positions with a bare literal
// (`questionIndex === 12 || 13`), which would silently break if the order changed.
// This module centralizes the mapping so there is ONE place to update, and
// Assessment.tsx asserts (in dev) that the order still matches these values.

// Three goals/outcomes questions feed the coach: The Blueprint (broad chasing + why),
// The Seven Perfect Things (life vision), and The Goal Pre-Mortem (concrete goals +
// self-rated difficulty + the sabotage risks to engineer around).
export const GOALS_QUESTION_IDS = [13, 14, 20] as const;

/** 0-based positions of the goals questions within QUESTION_ORDER (display order). */
export const GOALS_QUESTION_INDICES = [12, 13, 19] as const;

/** True if a stored response (by its display-order index) is a goals/outcomes answer. */
export function isGoalsResponse(questionIndex: number | null | undefined): boolean {
  return questionIndex != null && (GOALS_QUESTION_INDICES as readonly number[]).includes(questionIndex);
}

/** Join the goals answers from a response list into the `goals` string the coach consumes. */
export function extractGoalsText(
  responses: Array<{ questionIndex?: number | null; transcript?: string | null }>,
): string {
  return responses
    .filter((r) => isGoalsResponse(r.questionIndex))
    .map((r) => r.transcript)
    .filter((t): t is string => !!t)
    .join("\n\n");
}

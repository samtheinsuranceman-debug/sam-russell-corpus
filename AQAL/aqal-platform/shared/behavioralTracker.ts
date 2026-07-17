// ============================================================
// Behavioral tracker — the daily dictation journal that closes the loop
// ============================================================
// Generated from a person's own prescribed practices (their projections). They
// dictate 5–7 minutes/day into any AI (Gemini/Claude/ChatGPT) instead of writing
// for an hour, then upload the journal each cycle so the platform can update their
// profile from self-reported practice. This is the "track it" step the
// implementation-science research prescribes — and the reason to keep coming back.

import type { OutcomeProjection } from "./keystonePractices";

export function buildTrackerMarkdown(opts: {
  projections: OutcomeProjection[];
  days?: number;
  goals?: string;
}): string {
  const days = Math.max(1, Math.min(opts.days ?? 30, 90));
  const goals = (opts.goals || "").trim();
  const practices = opts.projections.length
    ? opts.projections
    : [{ practice: "your prescribed keystone practice", horizon: "the recommended time", confidence: "Moderate", researchBasis: "", goalArea: "your goals", librarySection: "the Research Library" } as OutcomeProjection];

  const lines: string[] = [];
  lines.push(`# Your ${days}-Day Behavioral Tracker`);
  lines.push("");
  if (goals) lines.push(`**Your stated goals:** ${goals}`);
  lines.push("");
  lines.push("## How to use this (5–7 minutes a day)");
  lines.push("- Open your preferred AI (Gemini, Claude, or ChatGPT) and turn on voice/dictation.");
  lines.push("- Each day, SPEAK your entry using the prompts below — it takes minutes to talk what would take an hour to type.");
  lines.push("- Paste each day's transcript under that day's heading in this document.");
  lines.push(`- After ${days} days, upload this completed journal to your portal. We update your profile from what you report.`);
  lines.push("");
  lines.push("> Honest note: your uploaded journal is **self-reported** — we take it at your word. It updates your profile as a self-reported change, not an independently verified re-measurement.");
  lines.push("");
  lines.push("## Your prescribed practices this cycle");
  for (const p of practices) {
    lines.push(`- **${p.practice}** — run it for ${p.horizon}.${p.researchBasis ? ` (${p.researchBasis})` : ""}`);
  }
  lines.push("");
  lines.push("## Daily dictation prompts (speak these every day)");
  lines.push("1. Which prescribed practice(s) did I actually do today, and for how long?");
  lines.push("2. What procedure did I follow — exactly what did I do?");
  lines.push("3. Any noticeable effects — mood, energy, focus, connection, conflict, sleep?");
  lines.push("4. What got in the way, and what will I adjust tomorrow?");
  lines.push("5. On a 1–10, how consistent and enthusiastic was I today?");
  lines.push("");
  lines.push("---");
  lines.push("");
  for (let d = 1; d <= days; d++) {
    lines.push(`### Day ${d}`);
    lines.push("- Practices done + duration: ");
    lines.push("- Procedure followed: ");
    lines.push("- Noticeable effects: ");
    lines.push("- Obstacles / adjustment: ");
    lines.push("- Consistency (1–10): ");
    lines.push("");
  }
  lines.push("---");
  lines.push(`End of ${days}-day cycle. Upload this to your portal for your re-measurement.`);
  return lines.join("\n");
}

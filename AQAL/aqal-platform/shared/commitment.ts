// ============================================================
// Personal Commitment Agreement — the self-engineered dedication engine
// ============================================================
// After a person sees their assessment, their declared outcomes, and the honest
// gap between knowing and doing, we ask them to answer a small set of hard
// questions OUT LOUD (spoken into a microphone — never typed). Their own spoken
// words, transcribed and listed back to them bullet by bullet, become a private
// reference document they can revisit any time they falter — a way to re-induce
// the exact state of mind that answered these questions with precision.
//
// This is NOT a legal document. It is a personal, self-authored commitment.
// The words are theirs; we only structure and mirror them back.

export type CommitmentQuestion = {
  key: string;
  // The prompt they hear/read and speak an answer to.
  prompt: string;
  // A short framing line that primes the answer.
  helper: string;
  // How many distinct spoken reasons/points this question asks for (0 = open).
  wantReasons: number;
  // Short label for the section heading on the printed agreement.
  label: string;
};

// The question set. The first two demand five self-generated reasons each; the
// rest are open reflections. The last two are ones we add to deepen the anchor.
export const COMMITMENT_QUESTIONS: CommitmentQuestion[] = [
  {
    key: "why_now",
    label: "Why now is different",
    wantReasons: 5,
    helper: "Speak five reasons. Say what you see, hear, and feel right in front of you.",
    prompt:
      "Give me five reasons why now is different than yesterday. What do you see, hear, and feel right in front of you that just pushed you over the inertia line — that made you decide to fully and completely commit to this process?",
  },
  {
    key: "to_gain",
    label: "What you have to gain",
    wantReasons: 5,
    helper: "Speak five reasons. What would protecting and creating these outcomes mean to you?",
    prompt:
      "Tell me five reasons — what do you have to gain by committing? What would it mean to you personally to protect and create those outcomes?",
  },
  {
    key: "to_lose",
    label: "What you have to lose",
    wantReasons: 0,
    helper: "Speak freely. Name the real cost — emotional, relational, financial, experiential; health, freedom, autonomy.",
    prompt:
      "What do you have to lose by only casually looking at all this measurement data and these research-confirmed prescriptions — sequences no other platform has ever connected — and then never acting on them? What might the long-term consequences cost you emotionally, relationally, financially, and experientially? In terms of your health, your freedom, your autonomy?",
  },
  {
    key: "self_trust",
    label: "The perspective you've locked in",
    wantReasons: 0,
    helper: "Speak freely. What have you locked in that lets you trust yourself?",
    prompt:
      "What perspective have you locked in now — one that lets you trust yourself to follow through on these commitments on your own time, without someone constantly nagging and reminding you?",
  },
  {
    key: "inflection",
    label: "Why this is an inflection point",
    wantReasons: 0,
    helper: "Speak freely. How do you know this is a genuine turning point?",
    prompt:
      "How can you tell this has become a life inflection point — a moment where your future literally rests in the hands of the quality and the time you give, right now, to processing and pondering these variables and outcomes?",
  },
  {
    key: "milestones",
    label: "Milestone decisions this resembles",
    wantReasons: 0,
    helper: "Speak freely. Name the earlier decisions, and what they share.",
    prompt:
      "Does this emotional, cognitive decision point remind you of any other milestone decision points earlier in your life? Which ones? And what do they seem to have in common with one another?",
  },
  // Two we add to deepen the anchor:
  {
    key: "future_self",
    label: "The person you become",
    wantReasons: 0,
    helper: "Speak freely. Describe the version of you who kept every promise here.",
    prompt:
      "Describe the version of you, ninety days from now, who kept every promise in this letter. What are they doing, and how are they carrying themselves, that you are not doing today?",
  },
  {
    key: "recovery_line",
    label: "Your recovery line",
    wantReasons: 0,
    helper: "Speak one or two sentences. This is what we read back to you when you falter.",
    prompt:
      "When you falter — and you will, at least once — what is the one thing you want to hear yourself say that pulls you straight back to this moment and this decision?",
  },
];

export type CommitmentAnswer = {
  key: string;
  // The person's spoken words, transcribed. We store verbatim.
  transcript: string;
};

export type CommitmentReminderChannel = "none" | "email" | "text";

// The hour (local, 24h) we aim to deliver the daily check-in. "End of their day."
export const DAILY_CHECKIN_HOUR = 20; // 8 PM local
export const FALLBACK_TIMEZONE = "America/New_York"; // if the browser gave us nothing

// What the browser reports for the current device. Falls back to the fixed zone.
export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || FALLBACK_TIMEZONE;
  } catch {
    return FALLBACK_TIMEZONE;
  }
}

// The current hour (0–23) in a given IANA timezone. Returns null if the zone is
// invalid/unknown so callers can fall back deliberately.
export function localHourInZone(timeZone: string, date: Date): number | null {
  try {
    const s = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", hour12: false }).format(date);
    const h = parseInt(s, 10);
    return Number.isFinite(h) ? h % 24 : null;
  } catch {
    return null;
  }
}

// Should we send this person's daily check-in right now? True only when it's the
// target hour in THEIR timezone (falling back to Eastern if the zone is missing).
export function shouldSendCheckinNow(
  timeZone: string | null | undefined,
  now: Date,
  targetHour: number = DAILY_CHECKIN_HOUR,
): boolean {
  const tz = timeZone && timeZone.length ? timeZone : FALLBACK_TIMEZONE;
  const h = localHourInZone(tz, now) ?? localHourInZone(FALLBACK_TIMEZONE, now);
  return h === targetHour;
}

// A person's answers keyed by question. Missing keys = not yet answered.
export function answersByKey(answers: CommitmentAnswer[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const a of answers) {
    if (a && a.key && typeof a.transcript === "string") map[a.key] = a.transcript.trim();
  }
  return map;
}

// How many questions have a non-empty spoken answer.
export function answeredCount(answers: CommitmentAnswer[]): number {
  const map = answersByKey(answers);
  return COMMITMENT_QUESTIONS.filter((q) => (map[q.key] ?? "").length > 0).length;
}

// The agreement is "ready to sign" once every question has a spoken answer.
export function commitmentReady(answers: CommitmentAnswer[]): boolean {
  return answeredCount(answers) >= COMMITMENT_QUESTIONS.length;
}

// Split a spoken answer into bullet points. We keep it forgiving — people speak
// in run-ons — splitting on sentence enders and obvious "reason one / two" cues,
// then falling back to the whole utterance as a single bullet.
export function toBullets(transcript: string): string[] {
  const t = (transcript || "").trim();
  if (!t) return [];
  // Break on ordinal cues ("one,", "number two", "reason three") and sentence ends.
  const withBreaks = t
    .replace(/\b(number|reason|point)\s+(one|two|three|four|five|1|2|3|4|5)\b[.,:]?/gi, "\n")
    .replace(/([.!?])\s+(?=[A-Z0-9])/g, "$1\n");
  const parts = withBreaks
    .split(/\n+/)
    .map((s) => s.trim().replace(/^[-•,;:]+\s*/, ""))
    .filter((s) => s.length > 1);
  return parts.length ? parts : [t];
}

// Render the signed agreement as Markdown — the revisitable reference document.
// Everything below the person's name is their own spoken words, mirrored back.
export function buildCommitmentMarkdown(opts: {
  name?: string;
  goals?: string;
  answers: CommitmentAnswer[];
  signedName?: string;
  signedAtISO?: string;
  reminderChannel?: CommitmentReminderChannel;
}): string {
  const map = answersByKey(opts.answers);
  const name = (opts.name || "").trim();
  const lines: string[] = [];

  lines.push(`# My Personal Commitment Agreement`);
  lines.push("");
  if (name) lines.push(`**${name}**`);
  lines.push("");
  lines.push(
    "> This is not a legal document. It is my own commitment, in my own spoken words. " +
      "I wrote none of this by keyboard — I said it out loud, on purpose, at the moment I decided. " +
      "I keep it so I can return here and feel exactly what I felt when I chose to begin.",
  );
  lines.push("");

  if ((opts.goals || "").trim()) {
    lines.push("## The outcomes I declared");
    lines.push("");
    lines.push(opts.goals!.trim());
    lines.push("");
  }

  for (const q of COMMITMENT_QUESTIONS) {
    const ans = map[q.key] ?? "";
    lines.push(`## ${q.label}`);
    lines.push("");
    lines.push(`*${q.prompt}*`);
    lines.push("");
    if (!ans) {
      lines.push("_(not yet answered)_");
      lines.push("");
      continue;
    }
    for (const b of toBullets(ans)) lines.push(`- ${b}`);
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  if (opts.signedName && opts.signedAtISO) {
    const when = opts.signedAtISO.slice(0, 10);
    lines.push(`**Signed:** ${opts.signedName} — ${when}`);
  } else {
    lines.push("_Not yet signed._");
  }
  if (opts.reminderChannel && opts.reminderChannel !== "none") {
    lines.push("");
    lines.push(
      `_Daily check-ins: ${opts.reminderChannel === "text" ? "text message" : "email"} for the first 30 days. Reply Y or N._`,
    );
  }
  lines.push("");
  lines.push(
    "> When I falter, I read this back — especially my recovery line — until I remember who I decided to become.",
  );
  return lines.join("\n");
}

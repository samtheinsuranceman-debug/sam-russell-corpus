// ============================================================
// GROWTH ENGINE — the member's living month, in one module
// ============================================================
// Powers the Manus build-now set: quick-win starters, the protocol difficulty
// ladder, minimum-effective-dose curves, weekly strength-deployment challenges
// (all 32 lines), the What-Would-It-Take calculator, streak math, and the
// crisis-language safety net. Pure functions — testable, no server needed.

import { ALL_AXES } from "./axisModes";

// ─── QUICK WINS — do these while your assessment is still in progress ────────
// Universal, evidence-backed, profile-independent. The member starts improving
// in week one instead of waiting a month for their map.
export const QUICK_WINS = [
  {
    id: "qw-walk",
    name: "The Daily 20",
    dose: "20-minute brisk walk, outside if possible",
    why: "The best-evidenced all-purpose intervention there is — mood, energy, and cognition all respond within days.",
  },
  {
    id: "qw-sleep",
    name: "Anchor Your Wake Time",
    dose: "Same wake-up time every day, light within 30 minutes",
    why: "One anchor stabilizes the whole sleep system — and sleep gates every other line you're about to measure.",
  },
  {
    id: "qw-log",
    name: "The Three-Minute Log",
    dose: "Each evening: what you did, how it felt, one sentence each",
    why: "You're rehearsing the exact tracking habit the whole platform runs on — starting now makes month one effortless.",
  },
] as const;

// ─── THE DIFFICULTY LADDER — how prescriptions roll out ──────────────────────
// Members who try 5-7 new behaviors at once quit by day 9. The ladder starts
// with ONE and earns its way up.
export const LADDER_TIERS = [
  { tier: 1, window: "Weeks 1–2", rule: "ONE practice, small dose. Your only job is showing up.", count: 1 },
  { tier: 2, window: "Weeks 3–4", rule: "Add a second practice once the first survives two weeks.", count: 2 },
  { tier: 3, window: "Month 2+", rule: "Add this month's ecological driver. Three running, none heroic.", count: 3 },
] as const;

// ─── MINIMUM EFFECTIVE DOSE — something beats nothing, visibly ────────────────
// Honest framing of dose-response: benefits rise steeply then flatten. The
// numbers are illustrative of the typical curve shape, not per-study claims.
export const DOSE_CURVE = [
  { minutes: 7, effect: 40, label: "the floor that still works" },
  { minutes: 15, effect: 75, label: "the sweet spot" },
  { minutes: 30, effect: 95, label: "near-max — more is mostly polish" },
] as const;

// ─── STRENGTH-DEPLOYMENT CHALLENGES — one per line, rotating weekly ──────────
// Strengths grow through USE. Each challenge forces the line into the real
// world this week, in a way a member can actually finish.
export const STRENGTH_CHALLENGES: Record<string, string> = {
  Logical: "Find one decision you're avoiding and write the actual argument for each side — five premises each, then decide.",
  Mathematical: "Put numbers on something you've only felt: your real hourly cost of a habit, the compound value of a monthly saving.",
  Spatial: "Redesign one physical space you use daily — sketch it, then move three things. Live in the new layout a week.",
  Linguistic: "Write a 500-word letter to someone you've been meaning to thank. Send it.",
  Volitional: "Pick the task you've dodged longest. Do the first 25 minutes before noon, three days this week.",
  "Meta-Cognitive": "Predict how three decisions will turn out — write the predictions down. Score yourself at week's end.",
  Intrapersonal: "Fifteen minutes, three evenings: write what you actually felt today and what triggered it. No editing.",
  Reflective: "Reread something you wrote a year ago. Write one page on who's changed — you or your circumstances.",
  Existential: "Write your own obituary the way you hope it reads. Circle the one sentence you're not yet living.",
  Philosophical: "Take a belief you hold firmly and argue the opposite for one page — steelman, not strawman.",
  Integrative: "Take two unrelated ideas from your week and force a connection: one paragraph on what each teaches the other.",
  Interpersonal: "Have one conversation this week where your only job is questions. No stories of your own until they ask.",
  Empathic: "Pick someone who frustrated you. Write their side of it so well they'd say 'yes — exactly.'",
  Intuitive: "Before three meetings or calls, write one sentence predicting the mood you'll walk into. Check yourself after.",
  Musical: "Learn 60 seconds of a song — voice or any instrument. Play it for one human being.",
  Kinesthetic: "Learn one physical skill-bite this week: juggle two balls, hold a 60-second plank, land a dance step.",
  Naturalistic: "Spend one hour somewhere green with no phone. Name five living things you've never bothered to notice.",
  Strategic: "Map one goal three moves deep: your move, the world's likely response, your counter. Write it down.",
  Tactical: "Take something you've planned to death and ship the ugly version this week. Done teaches faster than perfect.",
  Adaptive: "Break one routine on purpose — new route, new tool, new order. Note what the friction teaches you.",
  Resilient: "Do one hard thing you'd normally avoid, then write down: it did not break me. Evidence accumulates.",
  Systematic: "Diagram one recurring mess in your life as a system: what feeds it, what it feeds. Find the loop.",
  Architectural: "Design something end-to-end on paper this week — a room, a course, a product — every layer labeled.",
  Adversarial: "Negotiate one real thing this week — a bill, a price, a deadline. Open with a number. Debrief in two lines.",
  Interoceptive: "Three times a day, pause: where is tension sitting in your body right now? Name the spot out loud.",
  Aesthetic: "Make one corner of your world deliberately beautiful this week — then notice who else notices.",
  Influence: "Pitch one idea to one person this week with a clear ask at the end. Count the yes.",
  Humor: "Collect three things that made you laugh this week and retell one — landing a laugh is a rep.",
  Parenting: "Give someone younger 30 undistracted minutes: their agenda, your full attention, zero advice unless asked.",
  Seduction: "Give three genuine, specific compliments to three different people this week. Specific beats smooth.",
  "Community-Founding": "Gather people once this week — a dinner, a game, a walk. You call it, you host it.",
  "Financial-Self-Management": "Automate one money move this week — a transfer, a payment, a rule — so future-you can't forget it.",
};

/** This week's challenge, rotating through the member's TOP lines (stable per ISO week). */
export function challengeForWeek(topLines: string[], date = new Date()): { line: string; challenge: string } | null {
  const pool = topLines.filter((l) => STRENGTH_CHALLENGES[l]);
  if (pool.length === 0) return null;
  const week = Math.floor((date.getTime() - Date.UTC(date.getUTCFullYear(), 0, 1)) / (7 * 24 * 3600 * 1000));
  const line = pool[week % pool.length];
  return { line, challenge: STRENGTH_CHALLENGES[line] };
}

// ─── WHAT WOULD IT TAKE — the honest price tag on a hard goal ────────────────
// Instead of "give up": here's the staircase, the months each step costs at
// real effort, and the total. Then it's the member's informed choice.
export type WWITRow = { stage: string; months: number };
export function whatWouldItTake(
  stages: { name: string; done: boolean }[],
  baselineMonths: number,
): { rows: WWITRow[]; totalMonths: number } {
  const remaining = stages.filter((s) => !s.done);
  if (remaining.length === 0) return { rows: [], totalMonths: 0 };
  const doneFrac = 1 - remaining.length / Math.max(1, stages.length);
  const totalMonths = baselineMonths * (1 - doneFrac);
  // Front-load slightly: earlier stages usually take longer (habit formation).
  const weights = remaining.map((_, i) => remaining.length - i * 0.5);
  const wSum = weights.reduce((s, w) => s + w, 0);
  const rows = remaining.map((s, i) => ({ stage: s.name, months: (weights[i] / wSum) * totalMonths }));
  return { rows, totalMonths };
}

// ─── STREAKS — visible momentum ──────────────────────────────────────────────
/** Consecutive-day streak ending today or yesterday, from ISO date strings (YYYY-MM-DD). */
export function dayStreak(dates: string[], today = new Date()): number {
  const set = new Set(dates);
  const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const iso = (x: Date) => x.toISOString().slice(0, 10);
  // A streak may end yesterday (today's rep not done yet) without resetting.
  if (!set.has(iso(d))) d.setUTCDate(d.getUTCDate() - 1);
  let streak = 0;
  while (set.has(iso(d))) { streak++; d.setUTCDate(d.getUTCDate() - 1); }
  return streak;
}

/** Consecutive-month streak ending this month or last, from YYYY-MM strings. */
export function monthStreak(months: string[], today = new Date()): number {
  const set = new Set(months);
  let y = today.getUTCFullYear();
  let m = today.getUTCMonth() + 1;
  const key = () => `${y}-${String(m).padStart(2, "0")}`;
  if (!set.has(key())) { m--; if (m === 0) { m = 12; y--; } }
  let streak = 0;
  while (set.has(key())) { streak++; m--; if (m === 0) { m = 12; y--; } }
  return streak;
}

// ─── CRISIS SAFETY NET ───────────────────────────────────────────────────────
// Deliberately deterministic (no AI in the loop for safety-critical detection).
// High-precision phrases only: a false negative is worse than a false positive,
// but flooding members with crisis banners over the word "kill" in a movie
// review destroys trust. Matches trigger the support resources panel and an
// admin-reviewable flag. This is a safety net, not surveillance: it runs on
// content members submit TO the platform (answers, logs), never private DMs.
const CRISIS_PATTERNS: RegExp[] = [
  /\b(kill(ing)? myself|end my (own )?life|suicid(e|al)|want to die|better off dead|no reason to (live|go on))\b/i,
  /\b(hurt(ing)? myself|self[- ]harm|cutting myself)\b/i,
  /\b(he|she|they|my (husband|wife|partner)) (hits?|beats?|chokes?) me\b/i,
  /\bafraid (for my life|he('|)ll kill me|she('|)ll kill me)\b/i,
  /\b(overdos(e|ing)|can('|)t stop (drinking|using))\b/i,
];

export function scanForCrisis(text: string): boolean {
  const t = (text || "").slice(0, 50_000);
  return CRISIS_PATTERNS.some((re) => re.test(t));
}

export const CRISIS_RESOURCES = [
  { name: "988 Suicide & Crisis Lifeline (US)", contact: "Call or text 988", url: "https://988lifeline.org" },
  { name: "Crisis Text Line", contact: "Text HOME to 741741", url: "https://www.crisistextline.org" },
  { name: "National Domestic Violence Hotline", contact: "1-800-799-7233", url: "https://www.thehotline.org" },
  { name: "SAMHSA Treatment Locator (substance use)", contact: "1-800-662-4357", url: "https://findtreatment.gov" },
  { name: "Outside the US", contact: "Find your country's helpline", url: "https://befrienders.org" },
] as const;

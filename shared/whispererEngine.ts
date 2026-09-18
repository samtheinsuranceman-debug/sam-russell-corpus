// ============================================================
// THE AI WHISPERER — the live sales-call coach.
//
// Pure functions, shared by client and server. Feed it the call so far
// (who said what, when), the signals the Zoom stream or the browser has
// read (tone of voice, body language, energy), and what is known about
// the client (profile, decision type, previous calls and objections).
// It returns the coaching for this moment: the talk ratio, whether to
// stop talking or ask now, five questions to choose from, the five
// objections most likely in the next five minutes with how to handle
// each, and the client's decision type with the evidence.
//
// Nothing here calls a model. The server layers a model on top for the
// wording of the reports; the judgement itself is deterministic so it
// can be tested and explained.
// ============================================================

export type Speaker = "advisor" | "client";

export type Turn = {
  /** Milliseconds since the call started. */
  at: number;
  speaker: Speaker;
  text: string;
  /** How long the turn took, when the source knows. */
  durationMs?: number;
  source?: "zoom" | "browser" | "manual";
};

export type SignalKind = "tone" | "body" | "energy" | "attention";

export type Signal = {
  at: number;
  kind: SignalKind;
  /** Plain words: "arms crossed, leaning back", "warm, quick to laugh", "flat, clipped". */
  value: string;
  /** −1 (closed, negative) to +1 (open, positive). */
  score: number;
  source?: "zoom-video" | "zoom-audio" | "browser-video" | "browser-audio" | "vision-model" | "manual";
};

export type DecisionType = "driver" | "analytical" | "amiable" | "expressive";

export type CallPhase = "opening" | "discovery" | "presentation" | "objections" | "close";

export type ClientMoney = {
  netWorth?: number;
  liquid?: number;
  cash?: number;
  homeEquity?: number;
  mortgage?: number;
  preTaxRetirement?: number;
  roth?: number;
  taxable?: number;
  annuity?: number;
  rentalEquity?: number;
  rentalMortgage?: number;
  crypto?: number;
  income?: number;
  age?: number;
  hasAdvisor?: boolean;
  advisorName?: string;
  hasSpouse?: boolean;
  spouseName?: string;
  specialty?: string;
};

export type ClientContext = {
  clientId?: number;
  name: string;
  firstName?: string;
  money?: ClientMoney;
  /** What earlier calls established, one line each. */
  priorCalls?: string[];
  /** Objections raised on earlier calls, by objection id or in words. */
  priorObjections?: string[];
  /** The decision type inferred on earlier calls, if any. */
  priorDecisionType?: DecisionType;
  /** Free-text personality notes from the advisor. */
  personalityNotes?: string;
};

export type Cue = {
  kind: "stop-talking" | "ask-now" | "slow-down" | "acknowledge" | "close" | "clarify" | "keep-going" | "re-engage";
  urgency: 1 | 2 | 3;
  text: string;
  why: string;
};

export type Question = {
  id: string;
  text: string;
  purpose: string;
  /** Which decision types this question lands best with. */
  fits: DecisionType[];
};

export type Objection = {
  id: string;
  title: string;
  /** 0 to 1: how likely it surfaces in the next five minutes. */
  likelihood: number;
  /** What in this call or this file points to it. */
  signals: string[];
  /** How to hear it and how to answer it. */
  handle: string;
  /** Words to use, first person. */
  talkTrack: string;
  /** Strategies in the operating system that answer it. */
  strategies: string[];
  /** Calculators that show it. */
  calculators: Array<{ label: string; path: string }>;
};

export type Coaching = {
  at: number;
  phase: CallPhase;
  talk: { advisorPct: number; clientPct: number; lastAdvisorMonologueSec: number; questionsAskedByAdvisor: number; clientQuestions: number };
  decision: { type: DecisionType; confidence: number; evidence: string[] };
  mood: { score: number; label: string; trend: "warming" | "cooling" | "steady"; latestSignals: string[] };
  cues: Cue[];
  questions: Question[];
  objections: Objection[];
  buyingSignals: string[];
  summary: string;
};

export type CoachInput = {
  turns: Turn[];
  signals: Signal[];
  client: ClientContext;
  /** Milliseconds since the call started, "now". */
  now: number;
};

// ─── helpers ──────────────────────────────────────────────────────────────

const WORDS_PER_SEC = 2.5;

function words(t: string): number {
  return t.trim() ? t.trim().split(/\s+/).length : 0;
}

function turnSeconds(t: Turn): number {
  return t.durationMs ? t.durationMs / 1000 : words(t.text) / WORDS_PER_SEC;
}

export function money(n: number | undefined): string {
  return (n ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function has(text: string, patterns: RegExp[]): number {
  let n = 0;
  for (const p of patterns) if (p.test(text)) n += 1;
  return n;
}

// ─── talk statistics ──────────────────────────────────────────────────────

export function talkStats(turns: Turn[], windowMs = 3 * 60_000, now?: number): Coaching["talk"] {
  const end = now ?? (turns.length ? turns[turns.length - 1].at + (turns[turns.length - 1].durationMs ?? 0) : 0);
  const recent = turns.filter((t) => t.at >= end - windowMs);
  const src = recent.length ? recent : turns;
  let adv = 0;
  let cli = 0;
  for (const t of src) {
    if (t.speaker === "advisor") adv += turnSeconds(t);
    else cli += turnSeconds(t);
  }
  const total = adv + cli;
  const advisorPct = total ? Math.round((adv / total) * 100) : 0;
  // The current advisor monologue: consecutive advisor turns at the tail.
  let mono = 0;
  for (let i = turns.length - 1; i >= 0; i--) {
    if (turns[i].speaker !== "advisor") break;
    mono += turnSeconds(turns[i]);
  }
  const questionsAskedByAdvisor = turns.filter((t) => t.speaker === "advisor" && /\?/.test(t.text)).length;
  const clientQuestions = turns.filter((t) => t.speaker === "client" && /\?/.test(t.text)).length;
  return { advisorPct, clientPct: total ? 100 - advisorPct : 0, lastAdvisorMonologueSec: Math.round(mono), questionsAskedByAdvisor, clientQuestions };
}

// ─── decision type ────────────────────────────────────────────────────────

const DECISION_CUES: Record<DecisionType, RegExp[]> = {
  driver: [/\bbottom line\b/i, /\bhow much\b/i, /\bjust tell me\b/i, /\bget to the point\b/i, /\bresults?\b/i, /\bwhat does it cost\b/i, /\bhow fast\b/i, /\bdecide\b/i, /\bnext steps?\b/i, /\bcut to\b/i, /\bwhat's the number\b/i],
  analytical: [/\bdata\b/i, /\bnumbers?\b/i, /\bshow me\b/i, /\bhow does (it|that) work\b/i, /\bassumptions?\b/i, /\bguarantee/i, /\brisks?\b/i, /\bhistor(y|ical)\b/i, /\bcompare/i, /\bpercent|%/i, /\bspreadsheet\b/i, /\bsource\b/i, /\bfees?\b/i, /\bwhat if\b/i, /\bexactly\b/i],
  amiable: [/\bfamily\b/i, /\b(my )?(wife|husband|spouse|kids|children)\b/i, /\bwe\b/i, /\bcomfortable\b/i, /\btrust\b/i, /\bfeel\b/i, /\bsafe\b/i, /\bworr(y|ied)\b/i, /\btake (our|my) time\b/i, /\btalk (it|this) over\b/i, /\bnot sure\b/i],
  expressive: [/\blove\b/i, /\bexcit/i, /\bvision\b/i, /\bdream\b/i, /\bamazing\b/i, /\bbig picture\b/i, /!$/, /\bstory\b/i, /\bimagine\b/i, /\bfreedom\b/i, /\blegacy\b/i],
};

export function inferDecisionType(turns: Turn[], prior?: DecisionType): Coaching["decision"] {
  const client = turns.filter((t) => t.speaker === "client");
  const scores: Record<DecisionType, number> = { driver: 0, analytical: 0, amiable: 0, expressive: 0 };
  const evidence: string[] = [];
  for (const t of client) {
    for (const type of Object.keys(DECISION_CUES) as DecisionType[]) {
      const n = has(t.text, DECISION_CUES[type]);
      if (n) { scores[type] += n; if (evidence.length < 6) evidence.push(`${type}: “${t.text.slice(0, 70)}${t.text.length > 70 ? "…" : ""}”`); }
    }
    // Short, declarative sentences lean driver; long, qualified ones lean analytical.
    const w = words(t.text);
    if (w > 0 && w <= 6) scores.driver += 0.3;
    if (w >= 35) scores.analytical += 0.3;
  }
  if (prior) scores[prior] += 1.5;
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const best = (Object.keys(scores) as DecisionType[]).sort((a, b) => scores[b] - scores[a])[0];
  const confidence = total ? Math.min(0.95, Math.round((scores[best] / total) * 100) / 100) : prior ? 0.5 : 0.25;
  if (prior && evidence.length === 0) evidence.push(`Earlier calls read as ${prior}.`);
  return { type: total || prior ? best : "analytical", confidence, evidence };
}

// ─── phase ────────────────────────────────────────────────────────────────

const PRESENT_CUES = [/\bstrateg/i, /\bplan\b/i, /\bwe would\b/i, /\bhere is how\b/i, /\bthe way (this|it) works\b/i, /\bstep (one|two|1|2)\b/i, /\bmortgage killer\b/i, /\bIUL\b/i, /\bRoth\b/i, /\bannuit/i];
const OBJECTION_CUES = [/\bbut\b/i, /\bconcern/i, /\bworr/i, /\bnot sure\b/i, /\bexpensive\b/i, /\bfees?\b/i, /\bthink about it\b/i, /\btalk to my\b/i, /\balready have\b/i, /\bwhat if\b/i, /\brisk/i, /\bscam|too good\b/i];
const CLOSE_CUES = [/\bnext steps?\b/i, /\bhow do we (start|begin|get started)\b/i, /\bwhen can\b/i, /\bsign\b/i, /\bpaperwork\b/i, /\bwhat do you need from me\b/i, /\blet's do it\b/i, /\bhow soon\b/i];

export function detectPhase(turns: Turn[], now: number): CallPhase {
  const last = turns.slice(-8);
  const lastClient = last.filter((t) => t.speaker === "client").map((t) => t.text).join(" ");
  const lastAll = last.map((t) => t.text).join(" ");
  if (has(lastClient, CLOSE_CUES) >= 1) return "close";
  if (has(lastClient, OBJECTION_CUES) >= 2) return "objections";
  if (has(lastAll, PRESENT_CUES) >= 2) return "presentation";
  if (now < 4 * 60_000 && turns.length < 8) return "opening";
  return "discovery";
}

// ─── mood ─────────────────────────────────────────────────────────────────

const POSITIVE = [/\bgreat\b/i, /\bgood\b/i, /\blove\b/i, /\bmakes sense\b/i, /\binteresting\b/i, /\bexactly\b/i, /\byes\b/i, /\bperfect\b/i, /\blike that\b/i, /\bthank/i, /\bhelpful\b/i];
const NEGATIVE = [/\bno\b/i, /\bnot\b/i, /\bworr/i, /\bconcern/i, /\bconfus/i, /\bexpensive\b/i, /\bdon't (know|think)\b/i, /\bhmm\b/i, /\bwait\b/i, /\bscam\b/i, /\bnever\b/i, /\bfrustrat/i];

export function moodFrom(signals: Signal[], turns: Turn[], now: number): Coaching["mood"] {
  const recentSignals = signals.filter((s) => s.at >= now - 5 * 60_000);
  const olderSignals = signals.filter((s) => s.at < now - 5 * 60_000 && s.at >= now - 10 * 60_000);
  const avg = (xs: Signal[]) => (xs.length ? xs.reduce((a, s) => a + s.score, 0) / xs.length : 0);
  const clientText = turns.filter((t) => t.speaker === "client" && t.at >= now - 3 * 60_000).map((t) => t.text).join(" ");
  const textScore = clientText ? Math.max(-1, Math.min(1, (has(clientText, POSITIVE) - has(clientText, NEGATIVE)) / 4)) : 0;
  const signalScore = avg(recentSignals);
  const score = recentSignals.length ? Math.round(((signalScore * 0.6 + textScore * 0.4) + Number.EPSILON) * 100) / 100 : Math.round(textScore * 100) / 100;
  const prev = olderSignals.length ? avg(olderSignals) : score;
  const trend: Coaching["mood"]["trend"] = score - prev > 0.15 ? "warming" : prev - score > 0.15 ? "cooling" : "steady";
  const label = score > 0.4 ? "open and engaged" : score > 0.1 ? "receptive" : score > -0.1 ? "neutral, weighing it" : score > -0.4 ? "guarded" : "closed or irritated";
  return { score, label, trend, latestSignals: recentSignals.slice(-3).map((s) => `${s.kind}: ${s.value}`) };
}

// ─── buying signals ───────────────────────────────────────────────────────

const BUYING = [/\bhow do we (start|begin|get started)\b/i, /\bwhen can\b/i, /\bnext steps?\b/i, /\bwhat would (it|that) (take|look like)\b/i, /\bmy (wife|husband|spouse) (would|will) (love|like)\b/i, /\bthat makes sense\b/i, /\bI like that\b/i, /\bhow soon\b/i, /\bcan we\b/i, /\bwhat do you need from me\b/i];

export function buyingSignals(turns: Turn[], now: number): string[] {
  return turns
    .filter((t) => t.speaker === "client" && t.at >= now - 6 * 60_000 && BUYING.some((p) => p.test(t.text)))
    .map((t) => t.text.slice(0, 90));
}

// ─── cues ─────────────────────────────────────────────────────────────────

export function buildCues(talk: Coaching["talk"], mood: Coaching["mood"], phase: CallPhase, turns: Turn[], buying: string[], now: number): Cue[] {
  const cues: Cue[] = [];
  const last = turns[turns.length - 1];
  const sinceLast = last ? now - (last.at + (last.durationMs ?? 0)) : 0;
  if (talk.lastAdvisorMonologueSec >= 60) cues.push({ kind: "stop-talking", urgency: 3, text: "Stop. Ask a question and let the silence work.", why: `You have been talking for ${talk.lastAdvisorMonologueSec} seconds without a pause.` });
  else if (talk.lastAdvisorMonologueSec >= 35) cues.push({ kind: "stop-talking", urgency: 2, text: "Land the point in one sentence, then ask.", why: `${talk.lastAdvisorMonologueSec} seconds into a monologue.` });
  if (talk.advisorPct >= 70 && turns.length >= 6) cues.push({ kind: "stop-talking", urgency: talk.advisorPct >= 80 ? 3 : 2, text: "You own the airtime. Hand it back.", why: `You have spoken ${talk.advisorPct}% of the last three minutes; the sale happens when they talk.` });
  if (mood.score <= -0.3) cues.push({ kind: "acknowledge", urgency: 3, text: "Name what you are seeing before you answer anything: “It sounds like something in this is not sitting right. What is it?”", why: `Mood reads ${mood.label}${mood.latestSignals.length ? ` (${mood.latestSignals[mood.latestSignals.length - 1]})` : ""}.` });
  if (mood.trend === "cooling" && mood.score > -0.3) cues.push({ kind: "slow-down", urgency: 2, text: "They are cooling. Slow down, drop the jargon, check in.", why: "Signals over the last five minutes are lower than the five before." });
  if (buying.length) cues.push({ kind: "close", urgency: 3, text: `Buying signal. Ask for the next step now: “Shall we set the review for this week?”`, why: `They said: “${buying[buying.length - 1]}”` });
  if (last?.speaker === "client" && /\?$/.test(last.text.trim()) && sinceLast > 8_000) cues.push({ kind: "clarify", urgency: 2, text: "They asked a question. Answer it in one sentence, then ask what is behind it.", why: `Their question has hung for ${Math.round(sinceLast / 1000)} seconds.` });
  if (last?.speaker === "client" && sinceLast > 12_000 && !/\?$/.test(last.text.trim())) cues.push({ kind: "ask-now", urgency: 2, text: "Silence after their statement. Ask the next question below; do not fill it with a pitch.", why: `${Math.round(sinceLast / 1000)} seconds of silence.` });
  if (phase === "discovery" && talk.questionsAskedByAdvisor < 3 && turns.length >= 8) cues.push({ kind: "ask-now", urgency: 2, text: "You are presenting before you have discovered. Ask two more questions first.", why: `Only ${talk.questionsAskedByAdvisor} questions asked so far.` });
  if (phase === "presentation" && mood.score >= 0.3 && talk.advisorPct <= 60) cues.push({ kind: "keep-going", urgency: 1, text: "This is landing. Keep the pace, one idea at a time.", why: `Mood ${mood.label}, airtime balanced.` });
  if (talk.clientPct <= 15 && turns.length >= 10 && !cues.some((c) => c.kind === "stop-talking")) cues.push({ kind: "re-engage", urgency: 2, text: "They have gone quiet. Ask them to tell you what they are thinking right now.", why: `Client airtime ${talk.clientPct}%.` });
  if (!cues.length) cues.push({ kind: "keep-going", urgency: 1, text: "Balanced so far. Stay curious.", why: `Airtime ${talk.advisorPct}/${talk.clientPct}, mood ${mood.label}.` });
  return cues.sort((a, b) => b.urgency - a.urgency).slice(0, 4);
}

// ─── questions ────────────────────────────────────────────────────────────

type QuestionTemplate = { id: string; phase: CallPhase[]; fits: DecisionType[]; purpose: string; text: (c: ClientContext) => string };

const first = (c: ClientContext) => c.firstName ?? c.name.split(" ")[0] ?? "";
const m = (c: ClientContext) => c.money ?? {};

const QUESTION_BANK: QuestionTemplate[] = [
  { id: "q-why-now", phase: ["opening", "discovery"], fits: ["driver", "analytical", "amiable", "expressive"], purpose: "Surfaces the real trigger for this call.", text: (c) => `${first(c)}, what made this the week to look at all of this?` },
  { id: "q-worst-year", phase: ["discovery"], fits: ["analytical", "driver"], purpose: "Reveals risk tolerance and the sequence-of-returns fear.", text: () => "If the market gave you a 2008 in the year you retire, what would you do the next morning?" },
  { id: "q-mortgage-plan", phase: ["discovery", "presentation"], fits: ["analytical", "amiable"], purpose: "Opens the Mortgage Killer conversation from their own plan.", text: (c) => m(c).mortgage ? `What is the plan for the ${money(m(c).mortgage)} on the house right now, other than paying it on schedule?` : "If you bought a rental next year, where would the down payment come from?" },
  { id: "q-cash-drag", phase: ["discovery", "presentation"], fits: ["driver", "analytical"], purpose: "Turns idle cash into a number they feel.", text: (c) => m(c).cash ? `The ${money(m(c).cash)} in cash, what is it earning, and what is it for?` : "How much of your money is sitting still right now, and why?" },
  { id: "q-advisor-value", phase: ["discovery", "objections"], fits: ["driver", "analytical"], purpose: "Tests the incumbent advisor without attacking them.", text: (c) => m(c).hasAdvisor ? `What has ${m(c).advisorName ?? "your advisor"} done in the last twelve months that you could not have done yourself?` : "Who do you call today when a money decision has real consequences?" },
  { id: "q-spouse", phase: ["discovery", "close"], fits: ["amiable", "expressive"], purpose: "Brings the second decision-maker in early.", text: (c) => m(c).hasSpouse ? `What would ${m(c).spouseName ?? "your spouse"} say matters most in this decision?` : "Who else needs to be comfortable with this before you move?" },
  { id: "q-tax-bill", phase: ["discovery", "presentation"], fits: ["analytical", "driver"], purpose: "Frames the pre-tax balance as a future tax bill.", text: (c) => m(c).preTaxRetirement ? `The ${money(m(c).preTaxRetirement)} in pre-tax accounts: whose money is it at the tax rate you expect in fifteen years?` : "What tax rate do you expect to pay in retirement, and who told you that?" },
  { id: "q-legacy", phase: ["discovery", "presentation"], fits: ["expressive", "amiable"], purpose: "Opens the multi-generational frame.", text: (c) => `${first(c)}, when your children inherit, do you want them to inherit a balance or an engine?` },
  { id: "q-protection", phase: ["discovery", "presentation"], fits: ["analytical", "amiable"], purpose: "Opens Divorce Shield and asset protection.", text: () => "Which of your assets is actually protected from a lawsuit or a divorce, and how do you know?" },
  { id: "q-magic", phase: ["discovery"], fits: ["expressive", "amiable"], purpose: "The three wishes, spoken.", text: () => "If one thing about your money could be different by this time next year, what would it be?" },
  { id: "q-decision", phase: ["presentation", "objections", "close"], fits: ["driver"], purpose: "Gets the decision process on the table.", text: () => "When you decide something like this, what do you need to see, and who else weighs in?" },
  { id: "q-assumption", phase: ["presentation", "objections"], fits: ["analytical"], purpose: "Invites the analytical client to attack the model with you.", text: () => "Which assumption in what I just showed you would you change first, and what do you think that does to the result?" },
  { id: "q-feel", phase: ["presentation", "objections"], fits: ["amiable", "expressive"], purpose: "Checks in on comfort before pressing on.", text: () => "How does this feel so far, honestly?" },
  { id: "q-objection-invite", phase: ["presentation", "objections"], fits: ["driver", "analytical", "amiable", "expressive"], purpose: "Pulls the objection out before it hardens.", text: () => "What is the part of this you are least sure about?" },
  { id: "q-cost-of-waiting", phase: ["objections", "close"], fits: ["driver", "analytical"], purpose: "Makes delay a decision with a price.", text: (c) => m(c).mortgage ? `If we do nothing for two years, what does that cost on the mortgage alone?` : "What does waiting a year cost, and who pays it?" },
  { id: "q-next-step", phase: ["close"], fits: ["driver", "amiable", "expressive", "analytical"], purpose: "The close, as a question.", text: () => "Shall we set the full review for this week, with the numbers built from your own statements?" },
  { id: "q-annuity", phase: ["discovery", "presentation"], fits: ["analytical", "amiable"], purpose: "Opens the income-floor conversation.", text: (c) => m(c).annuity ? "What was the annuity bought to do, and is it doing it?" : "How much of your retirement income would you want guaranteed no matter what the market does?" },
  { id: "q-rentals", phase: ["discovery", "presentation"], fits: ["driver", "analytical"], purpose: "Opens the rental recycling and 1031 conversation.", text: (c) => m(c).rentalMortgage ? `What happens to the rentals if rates are two points higher when the interest-only periods end?` : "Have you ever wanted rental income without being a landlord?" },
  { id: "q-crypto", phase: ["discovery"], fits: ["expressive", "driver"], purpose: "Puts a rule on the volatile asset.", text: (c) => m(c).crypto ? `What is the rule for the crypto when it drops 70%?` : "Is there any money you hold that you would call a bet rather than a plan?" },
];

export function pickQuestions(phase: CallPhase, decision: DecisionType, client: ClientContext, asked: string[] = []): Question[] {
  const askedText = asked.join(" ").toLowerCase();
  const ranked = QUESTION_BANK
    .map((q) => {
      let score = 0;
      if (q.phase.includes(phase)) score += 3;
      if (q.fits.includes(decision)) score += 2;
      if (q.fits.length === 4) score += 0.5;
      const text = q.text(client);
      // Skip questions that depend on a fact this client does not have.
      const mm = client.money ?? {};
      if (q.id === "q-advisor-value" && !mm.hasAdvisor) score -= 1;
      if (q.id === "q-crypto" && !mm.crypto) score -= 1.5;
      if (q.id === "q-rentals" && !mm.rentalMortgage) score -= 1;
      if (q.id === "q-annuity" && !mm.annuity) score -= 0.5;
      if (askedText.includes(text.toLowerCase().slice(0, 30))) score -= 5;
      return { q, text, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  return ranked.map(({ q, text }) => ({ id: q.id, text, purpose: q.purpose, fits: q.fits }));
}

// ─── objections ───────────────────────────────────────────────────────────

type ObjectionTemplate = {
  id: string;
  title: string;
  triggers: RegExp[];
  base: number;
  boost: (c: ClientContext, d: DecisionType, phase: CallPhase) => { score: number; why: string[] };
  handle: string;
  talkTrack: (c: ClientContext) => string;
  strategies: string[];
  calculators: Array<{ label: string; path: string }>;
};

const CHAIN = { label: "Calculator Chain", path: "/portal/chain" };

export const OBJECTION_LIBRARY: ObjectionTemplate[] = [
  {
    id: "think-about-it", title: "I need to think about it", base: 0.35,
    triggers: [/\bthink (about|on) it\b/i, /\bsleep on it\b/i, /\bget back to you\b/i, /\bnot today\b/i, /\btake (some|our|my) time\b/i],
    boost: (_c, d, p) => ({ score: (d === "amiable" ? 0.2 : 0) + (p === "close" ? 0.2 : 0), why: [d === "amiable" ? "Amiable clients avoid deciding in the room." : "", p === "close" ? "You are at the close; delay is the default no." : ""].filter(Boolean) }),
    handle: "Agree, then isolate: what specifically needs thinking, and what would make it a yes? Delay usually hides one of the other four objections.",
    talkTrack: (c) => `Of course, ${first(c)}. When you think it over tonight, what is the one question you will be asking yourself? Let's answer that one now so the thinking is easy.`,
    strategies: ["Cost of waiting (two-year delay on the mortgage cycle)", "LifeForge 10,000-scenario comparison of act-now vs wait", "Written next-step with a date"],
    calculators: [{ label: "Mortgage Killer", path: "/portal/mortgage-killer" }, CHAIN],
  },
  {
    id: "spouse", title: "I have to talk to my spouse", base: 0.3,
    triggers: [/\b(wife|husband|spouse|partner)\b/i, /\btalk (it|this) over\b/i, /\bwe decide together\b/i],
    boost: (c, d) => ({ score: (c.money?.hasSpouse ? 0.25 : -0.2) + (d === "amiable" ? 0.1 : 0), why: [c.money?.hasSpouse ? `${c.money?.spouseName ?? "The spouse"} is a decision-maker on file.` : ""].filter(Boolean) }),
    handle: "Never fight it; bring them in. Offer the joint review and send the one-page summary tonight so the spouse hears it from you, not a recap.",
    talkTrack: (c) => `That is exactly right, this is a household decision. Let's put ${c.money?.spouseName ?? "your spouse"} on the next call and I will build the numbers from both of your statements so nobody is translating.`,
    strategies: ["Joint fact finder with the spouse's accounts", "Divorce Shield framing: protection for both", "Spouse Social Security and retirement age alignment"],
    calculators: [{ label: "Financial Assessment", path: "/portal/financial-assessment" }, { label: "Social Security Optimizer", path: "/portal/social-security" }],
  },
  {
    id: "already-advisor", title: "I already have an advisor", base: 0.2,
    triggers: [/\balready (have|work with)\b/i, /\bmy (guy|advisor|adviser|broker|planner)\b/i, /\bedward jones|schwab|fidelity|merrill|morgan|ameriprise|northwestern\b/i],
    boost: (c) => ({ score: c.money?.hasAdvisor ? 0.4 : -0.1, why: [c.money?.hasAdvisor ? `On file: managed by ${c.money?.advisorName ?? "an advisor"}.` : ""].filter(Boolean) }),
    handle: "Do not compete on returns. Compete on the things the advisor has never done: mortgage recycling, tax sequencing, protection titling, the income floor. Ask what they did last year.",
    talkTrack: (c) => `Keep ${c.money?.advisorName ?? "your advisor"}; I am not asking you to fire anyone. What I do is the part between the accounts: the mortgage, the taxes, the protection. Has ${c.money?.advisorName ?? "your advisor"} ever shown you what the mortgage costs you in lost compounding?`,
    strategies: ["Advisory fee drag over 20 years", "Mortgage Killer cycle the advisor never models", "Tax Waterfall sequencing", "Policy-cost lab comparison"],
    calculators: [{ label: "Tax Waterfall", path: "/portal/tax-waterfall" }, { label: "Policy Cost Lab", path: "/portal/policy-cost-lab" }, CHAIN],
  },
  {
    id: "fees-cost", title: "It costs too much / the fees", base: 0.3,
    triggers: [/\bfees?\b/i, /\bcost/i, /\bexpensive\b/i, /\bcommission/i, /\bhow much do you (make|charge)\b/i, /\bload\b/i],
    boost: (_c, d) => ({ score: d === "analytical" ? 0.25 : d === "driver" ? 0.15 : 0, why: [d === "analytical" ? "Analytical clients test every cost." : ""].filter(Boolean) }),
    handle: "Put every cost on the table first, in dollars, next to the cost of doing nothing. Fees are only expensive when compared to zero; compare them to the tax bill and the interest.",
    talkTrack: (c) => `Fair question, and here is every dollar: the policy cost, the advisory cost, and what I earn. Now next to it, the ${money(c.money?.preTaxRetirement)} tax bill and the interest on the mortgage. Which column would you rather cut?`,
    strategies: ["Full cost disclosure table", "Cost of doing nothing (interest + tax drift)", "Policy cost lab: charges by year", "Fee comparison against the incumbent"],
    calculators: [{ label: "Policy Cost Lab", path: "/portal/policy-cost-lab" }, { label: "Tax Waterfall", path: "/portal/tax-waterfall" }],
  },
  {
    id: "too-good", title: "Sounds too good to be true / what is the catch", base: 0.25,
    triggers: [/\btoo good\b/i, /\bcatch\b/i, /\bscam\b/i, /\bwhat's the (risk|downside)\b/i, /\bif this works why\b/i, /\bsounds like\b/i],
    boost: (_c, d, p) => ({ score: (d === "analytical" ? 0.2 : 0) + (p === "presentation" ? 0.15 : 0), why: [p === "presentation" ? "You are presenting numbers; skepticism follows big numbers." : ""].filter(Boolean) }),
    handle: "Agree that it should sound that way, then hand them the downside yourself before they find it: the lien risk, the charge years, the assumptions that break it.",
    talkTrack: () => `It should sound that way, and I would be worried if you did not ask. Here is the catch, all of it: the equity we deploy is a lien on the house, the policy has charges in the first years, and if the assumptions are wrong the result is smaller. Let me show you the version where it goes badly.`,
    strategies: ["Monte Carlo downside band (10th percentile)", "Lien-risk disclosure on equity deployment", "Policy charge schedule", "Assumption sensitivity table"],
    calculators: [CHAIN, { label: "Policy Loans", path: "/portal/policy-loans" }, { label: "Outside Forces", path: "/portal/outside-forces" }],
  },
  {
    id: "liquidity", title: "I don't want my money tied up", base: 0.2,
    triggers: [/\btied up\b/i, /\bliquid/i, /\baccess\b/i, /\bget (my|the) money out\b/i, /\block(ed)? in\b/i, /\bsurrender\b/i, /\bpenalt/i],
    boost: (c, d) => ({ score: (d === "driver" ? 0.15 : 0) + ((c.money?.cash ?? 0) > 200_000 ? 0.15 : 0), why: [(c.money?.cash ?? 0) > 200_000 ? `${money(c.money?.cash)} in cash says liquidity is a felt need.` : ""].filter(Boolean) }),
    handle: "Separate the reserve from the engine. Show the policy-loan access and the HELOC line as liquidity that grows, then agree on a reserve number they never touch.",
    talkTrack: (c) => `Agreed, and we start by ringfencing the reserve: ${money(Math.max(50_000, (c.money?.cash ?? 100_000) * 0.4))} that never moves. Everything else stays reachable through the policy loan and the line, usually within days, without selling anything.`,
    strategies: ["Emergency reserve sizing", "Policy loans as a liquidity line", "HELOC availability under credit tightening", "Laddered liquidity by year"],
    calculators: [{ label: "Policy Loans", path: "/portal/policy-loans" }, { label: "Mortgage Killer", path: "/portal/mortgage-killer" }],
  },
  {
    id: "insurance-bad", title: "I've heard life insurance is a bad investment", base: 0.2,
    triggers: [/\blife insurance\b/i, /\bIUL\b/i, /\bwhole life\b/i, /\bdave ramsey|suze|buy term\b/i, /\bbad investment\b/i, /\binsurance (is|are) (a )?(rip|scam|bad)\b/i],
    boost: (_c, d, p) => ({ score: (d === "analytical" ? 0.15 : 0) + (p === "presentation" ? 0.1 : 0), why: [] }),
    handle: "Do not defend insurance. Agree that as an investment it loses to an index fund, then reposition it: it is the tax-free income layer and the protection wrapper, bought with money the mortgage cycle freed.",
    talkTrack: () => `You are right: as an investment against an index fund, it loses. That is not the job. The job is tax-free income in the years your other accounts are taxed hardest, and a wrapper a creditor cannot reach. Let me show you the year-by-year with and without it.`,
    strategies: ["IUL vs Roth comparison", "Time Machine policy design (AG-49 compliant)", "Trust-owned IUL for protection", "IUL historical index performance"],
    calculators: [{ label: "IUL vs Roth", path: "/portal/iul-vs-roth" }, { label: "IUL Historical Performance", path: "/portal/iul-historical" }, { label: "Time Machine Calculator", path: "/portal/time-machine-calculator" }],
  },
  {
    id: "taxes-down", title: "Taxes will be lower when I retire", base: 0.15,
    triggers: [/\btax(es)? (will|would|should) be lower\b/i, /\blower bracket\b/i, /\bless income (in|at) retirement\b/i],
    boost: (c, d) => ({ score: ((c.money?.preTaxRetirement ?? 0) > 500_000 ? 0.25 : 0) + (d === "analytical" ? 0.1 : 0), why: [(c.money?.preTaxRetirement ?? 0) > 500_000 ? `${money(c.money?.preTaxRetirement)} pre-tax makes future rates the whole question.` : ""].filter(Boolean) }),
    handle: "Do not predict rates. Show the drift model both ways and let them pick; then show that the sequencing wins under either.",
    talkTrack: (c) => `Maybe. Here is the plan with rates lower, and here it is with rates drifting up a quarter point a year. Converting the ${money(c.money?.preTaxRetirement)} in sequence wins in both, because the win is control, not a forecast.`,
    strategies: ["Future taxation drift model", "Roth conversion sequencing", "Tax Waterfall by year", "Required minimum distribution projection"],
    calculators: [{ label: "Tax Waterfall", path: "/portal/tax-waterfall" }, { label: "Roth Conversion", path: "/portal/roth-conversion" }],
  },
  {
    id: "market-beats", title: "The market will beat this", base: 0.2,
    triggers: [/\bS&P\b/i, /\bindex fund/i, /\bmarket (does|returns|averages)\b/i, /\b(ten|10) percent\b/i, /\bjust invest\b/i, /\bVanguard|Bogle/i],
    boost: (c, d) => ({ score: (d === "analytical" ? 0.15 : 0) + ((c.money?.taxable ?? 0) > 250_000 ? 0.15 : 0), why: [(c.money?.taxable ?? 0) > 250_000 ? "A large taxable portfolio says they believe in the market." : ""].filter(Boolean) }),
    handle: "Agree on the average, then show the sequence: the same average return in a different order retires them or ruins them. The plan is not against the market; it removes the years the market can hurt.",
    talkTrack: () => `On average, yes. Averages do not retire people; sequences do. Here are two thirty-year paths with the same average return, one that works and one that does not. The income floor and the policy loans take the bad years off the table.`,
    strategies: ["Sequence-of-returns simulation", "Income floor sizing", "Policy loans in down years", "Monte Carlo with money-printing volatility"],
    calculators: [CHAIN, { label: "Index Backtester", path: "/portal/index-backtester" }, { label: "Income for Life", path: "/portal/income-for-life" }],
  },
  {
    id: "rates-timing", title: "Rates are too high right now / wait for the market", base: 0.15,
    triggers: [/\brates? (are|is) (too )?high\b/i, /\bwait (for|until)\b/i, /\btiming\b/i, /\bwhen rates (drop|come down)\b/i, /\bbad time\b/i],
    boost: (c) => ({ score: (c.money?.mortgage ?? 0) > 300_000 ? 0.2 : 0, why: [(c.money?.mortgage ?? 0) > 300_000 ? "A large mortgage makes rate timing feel decisive." : ""].filter(Boolean) }),
    handle: "Show that the cycle is rate-agnostic: high rates make the payoff worth more, low rates make the deployment cheaper. Waiting is the one option that loses in both.",
    talkTrack: () => `If rates fall, we deploy cheaper. If they stay high, every dollar we put on the mortgage earns that rate guaranteed. The only losing move is the one where we wait for a number nobody can call.`,
    strategies: ["Loan availability under credit tightening", "Rate-scenario comparison", "Cost of waiting", "ZIP appreciation history through rate cycles"],
    calculators: [{ label: "Outside Forces", path: "/portal/outside-forces" }, { label: "Zip Engine", path: "/portal/zip-engine" }, { label: "Mortgage Killer", path: "/portal/mortgage-killer" }],
  },
  {
    id: "trust-who", title: "Who are you / why should I trust this", base: 0.15,
    triggers: [/\bwho are you\b/i, /\bhow long have you\b/i, /\bcredentials?\b/i, /\blicensed?\b/i, /\breviews?\b/i, /\bnever heard of\b/i],
    boost: (_c, d, p) => ({ score: (p === "opening" ? 0.2 : 0) + (d === "amiable" ? 0.1 : 0), why: [p === "opening" ? "Early in the call trust has not been earned yet." : ""].filter(Boolean) }),
    handle: "Answer briefly, then move the trust to the method: everything is shown from their own statements with sources named, and nothing is signed on a first call.",
    talkTrack: () => `Fair. Licenses, carriers and the compliance file are on the site, and I will send them. More important: nothing I show you is my opinion. It is your statements, public data with the source named, and the math you can check.`,
    strategies: ["Data provenance on every figure", "Compliance disclosures", "Carrier ratings", "No-signature first review"],
    calculators: [{ label: "Carrier Ratings", path: "/portal/carrier-ratings" }, { label: "Compliance Audit Center", path: "/portal/compliance-audit" }],
  },
  {
    id: "complexity", title: "This is too complicated", base: 0.15,
    triggers: [/\bcomplicated\b/i, /\bconfus/i, /\btoo many moving parts\b/i, /\bover my head\b/i, /\bsimple\b/i, /\bkeep it simple\b/i],
    boost: (_c, d) => ({ score: d === "amiable" ? 0.2 : d === "expressive" ? 0.1 : 0, why: [d === "amiable" ? "Amiable clients disengage when the picture gets busy." : ""].filter(Boolean) }),
    handle: "Collapse it to one sentence and one picture. Three steps, one at a time, each with a date. Complexity is your problem to carry, not theirs.",
    talkTrack: () => `Let me make it one sentence: the mortgage pays for the properties, the properties pay for the policy, the policy pays you tax-free. Three steps, one at a time, and you never see the machinery unless you ask.`,
    strategies: ["Three-step summary", "Calculator Chain as one row", "Cinematic vision board", "Plain-language recap"],
    calculators: [CHAIN, { label: "My Journey", path: "/portal/my-journey" }],
  },
  {
    id: "age", title: "I'm too old for this / too young for this", base: 0.1,
    triggers: [/\btoo (old|young|late|early)\b/i, /\bat my age\b/i, /\byears left\b/i],
    boost: (c) => ({ score: (c.money?.age ?? 45) >= 58 ? 0.25 : (c.money?.age ?? 45) <= 34 ? 0.15 : 0, why: [(c.money?.age ?? 45) >= 58 ? `Age ${c.money?.age} makes the horizon the objection.` : ""].filter(Boolean) }),
    handle: "Match the horizon to the plan: at 60 the income floor and the tax sequencing lead; at 32 the cycles lead. Show the version built for their age, not the brochure version.",
    talkTrack: (c) => `${(c.money?.age ?? 45) >= 58 ? "At your age the plan changes shape: fewer cycles, more income floor, and the tax sequencing matters more, not less." : "At your age the cycles have the most room to run; the first paid-off property comes before forty."} Let me show the version built for you.`,
    strategies: ["Age-matched plan windows", "Income floor timing", "Roth sequencing before RMD age", "Multi-generational transfer"],
    calculators: [{ label: "Retirement Income Projection", path: "/portal/retirement-projection" }, CHAIN],
  },
  {
    id: "real-estate-crash", title: "What if real estate crashes", base: 0.15,
    triggers: [/\bcrash/i, /\bbubble\b/i, /\b2008\b/i, /\bhousing (market )?(drops|falls)\b/i, /\bunderwater\b/i],
    boost: (c) => ({ score: ((c.money?.rentalEquity ?? 0) > 0 || (c.money?.homeEquity ?? 0) > 300_000 ? 0.2 : 0), why: [(c.money?.rentalEquity ?? 0) > 0 ? "Owns rentals; a crash is a lived fear." : ""].filter(Boolean) }),
    handle: "Show the ZIP's own history through 2008 and 2022, then the plan with a 25% drop in year three. The cycle pauses; it does not break, because the properties cash-flow.",
    talkTrack: (c) => `Let's look at ${c.money?.rentalEquity ? "your ZIP codes" : "your ZIP"} through 2008 and through 2022, then run the plan with a 25% drop in year three. The cycle pauses, the rents keep paying, and we buy the next one cheaper.`,
    strategies: ["ZIP appreciation and rent history, any window", "Crash scenario in the chain", "Rental cash-flow coverage", "Loan availability under tightening"],
    calculators: [{ label: "Zip Engine", path: "/portal/zip-engine" }, { label: "Real Estate Mogul", path: "/portal/real-estate-mogul" }, CHAIN],
  },
  {
    id: "commitment", title: "How long am I locked in", base: 0.15,
    triggers: [/\bhow long\b/i, /\bcommit/i, /\bcontract\b/i, /\bcancel\b/i, /\bwalk away\b/i, /\bexit\b/i],
    boost: (_c, d) => ({ score: d === "driver" ? 0.2 : 0, why: [d === "driver" ? "Drivers want the exit before the entrance." : ""].filter(Boolean) }),
    handle: "Give the exits by year in a table before they ask twice. Control is the driver's currency.",
    talkTrack: () => `Here is the exit at every year: what you get back, what it costs, and what you keep. You are never locked in; you are choosing when the numbers say leaving is smart.`,
    strategies: ["Surrender and exit schedule by year", "Policy loan access", "1035 exchange rights", "Written review cadence"],
    calculators: [{ label: "Policy Cost Lab", path: "/portal/policy-cost-lab" }, { label: "Existing Annuities", path: "/portal/existing-annuities" }],
  },
];

export function predictObjections(turns: Turn[], client: ClientContext, decision: DecisionType, phase: CallPhase, now: number): Objection[] {
  const recentClient = turns.filter((t) => t.speaker === "client" && t.at >= now - 6 * 60_000).map((t) => t.text).join(" ");
  const allClient = turns.filter((t) => t.speaker === "client").map((t) => t.text).join(" ");
  const prior = (client.priorObjections ?? []).map((p) => p.toLowerCase());
  const scored = OBJECTION_LIBRARY.map((o) => {
    const signals: string[] = [];
    let score = o.base;
    const recentHits = has(recentClient, o.triggers);
    const olderHits = has(allClient, o.triggers) - recentHits;
    if (recentHits) { score += 0.3 * Math.min(2, recentHits); signals.push(`Said in the last six minutes (${recentHits} cue${recentHits > 1 ? "s" : ""}).`); }
    else if (olderHits) { score += 0.1; signals.push("Raised earlier in this call."); }
    if (prior.some((p) => p.includes(o.id) || o.title.toLowerCase().includes(p) || p.includes(o.title.toLowerCase().split(" ")[0]))) { score += 0.2; signals.push("Raised on a previous call."); }
    const b = o.boost(client, decision, phase);
    score += b.score;
    signals.push(...b.why);
    return { o, score: Math.max(0.02, Math.min(0.98, score)), signals };
  }).sort((a, b) => b.score - a.score).slice(0, 5);
  return scored.map(({ o, score, signals }) => ({
    id: o.id, title: o.title, likelihood: Math.round(score * 100) / 100,
    signals: signals.length ? signals : ["Baseline for this phase of the call."],
    handle: o.handle, talkTrack: o.talkTrack(client), strategies: o.strategies, calculators: o.calculators,
  }));
}

export function objectionById(id: string): ObjectionTemplate | undefined {
  return OBJECTION_LIBRARY.find((o) => o.id === id);
}

// ─── the coach ────────────────────────────────────────────────────────────

export function coach(input: CoachInput): Coaching {
  const { turns, signals, client, now } = input;
  const phase = detectPhase(turns, now);
  const talk = talkStats(turns, 3 * 60_000, now);
  const decision = inferDecisionType(turns, client.priorDecisionType);
  const mood = moodFrom(signals, turns, now);
  const buying = buyingSignals(turns, now);
  const cues = buildCues(talk, mood, phase, turns, buying, now);
  const asked = turns.filter((t) => t.speaker === "advisor" && /\?/.test(t.text)).map((t) => t.text);
  const questions = pickQuestions(phase, decision.type, client, asked);
  const objections = predictObjections(turns, client, decision.type, phase, now);
  const summary =
    `${Math.round(now / 60_000)} min in, ${phase}. You ${talk.advisorPct}% / them ${talk.clientPct}%. ` +
    `${client.firstName ?? client.name} reads ${decision.type} (${Math.round(decision.confidence * 100)}%), mood ${mood.label}${mood.trend !== "steady" ? `, ${mood.trend}` : ""}. ` +
    `Top cue: ${cues[0]?.text ?? "keep going"} Most likely objection next: ${objections[0]?.title ?? "none"} (${Math.round((objections[0]?.likelihood ?? 0) * 100)}%).`;
  return { at: now, phase, talk, decision, mood, cues, questions, objections, buyingSignals: buying, summary };
}

/** The text message form of the coaching: short enough for a phone, complete enough to act on. */
export function coachingSms(c: Coaching, clientName: string): string {
  const cue = c.cues[0];
  const qs = c.questions.slice(0, 5).map((q, i) => `${i + 1}. ${q.text}`).join("\n");
  const obs = c.objections.slice(0, 5).map((o) => `• ${o.title} (${Math.round(o.likelihood * 100)}%)`).join("\n");
  return (
    `WHISPERER · ${clientName} · ${Math.round(c.at / 60_000)} min · ${c.phase}\n` +
    `You ${c.talk.advisorPct}% / them ${c.talk.clientPct}% · reads ${c.decision.type} · mood ${c.mood.label}\n` +
    `${cue ? `${cue.kind === "stop-talking" ? "STOP TALKING" : cue.kind === "close" ? "CLOSE NOW" : cue.kind === "ask-now" ? "ASK NOW" : cue.kind.toUpperCase()}: ${cue.text}` : ""}\n` +
    `Ask one:\n${qs}\n` +
    `Coming next 5 min:\n${obs}`
  ).slice(0, 1180);
}

/** Parse a Zoom VTT or plain transcript into turns. Speaker names that match the advisor become "advisor". */
export function parseTranscript(text: string, advisorNames: string[] = []): Turn[] {
  const adv = advisorNames.map((n) => n.toLowerCase());
  const turns: Turn[] = [];
  const lines = text.split(/\r?\n/);
  let at = 0;
  let pendingAt: number | null = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || /^WEBVTT/.test(line) || /^\d+$/.test(line)) continue;
    const ts = line.match(/^(\d{2}):(\d{2}):(\d{2})[.,](\d{3})\s*-->/);
    if (ts) { pendingAt = ((+ts[1] * 60 + +ts[2]) * 60 + +ts[3]) * 1000 + +ts[4]; continue; }
    const spk = line.match(/^([^:]{1,60}):\s*(.+)$/);
    if (spk) {
      const name = spk[1].trim().toLowerCase();
      const speaker: Speaker = adv.some((a) => name.includes(a) || a.includes(name)) ? "advisor" : "client";
      turns.push({ at: pendingAt ?? at, speaker, text: spk[2].trim(), source: "zoom" });
      at = (pendingAt ?? at) + words(spk[2]) / WORDS_PER_SEC * 1000;
      pendingAt = null;
    }
  }
  return turns;
}

/** One-line memory of a call for the next call's context. */
export function summarizeCallForMemory(turns: Turn[], coaching: Coaching): string {
  const dur = turns.length ? Math.round((turns[turns.length - 1].at) / 60_000) : 0;
  const obs = coaching.objections.filter((o) => o.signals.some((s) => /Said|Raised earlier/.test(s))).map((o) => o.title);
  return `${new Date().toISOString().slice(0, 10)}: ${dur} min call, ended in ${coaching.phase}; read as ${coaching.decision.type}; mood ${coaching.mood.label}; objections raised: ${obs.length ? obs.join(", ") : "none"}; buying signals: ${coaching.buyingSignals.length}.`;
}

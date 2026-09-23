// ============================================================
// CRISIS SCREEN for the Wealth Genome intake.
//
// Ported from Doctor Buddy (doctor-buddy/shared/engines/crisisDetection.ts,
// assessCSSRS and CRISIS_LIFELINE; tier-1 self-harm phrases from
// doctor-buddy/client/src/components/CrisisDetectionBanner.tsx). Only the
// lexical screen and the lifeline are taken. The telemetry fusion, the risk
// score, the forecast and the escalation cascade are clinical tools and are
// deliberately NOT part of this app.
//
// What it does here: any text a person types into a health-like room is
// screened before it is stored. A disclosure of self-harm or a wish to be
// dead stops the intake, deletes what was said, and puts the 988 Suicide &
// Crisis Lifeline on screen. It never labels the person, never stores the
// phrase, and never tells anyone what they "have".
//
// Tuned, like the original, to over-refer rather than under-refer: a false
// positive costs a stopped questionnaire; a false negative can cost a life.
// Ordinary money stress ("nothing left at the end of the month", "I'm
// exhausted") does not stop the intake.
// ============================================================

/** US 988 Suicide & Crisis Lifeline. Shown to the person; never auto-dialled. */
export const CRISIS_LIFELINE = {
  name: "988 Suicide & Crisis Lifeline",
  phone: "988",
  text: "Text 988",
  url: "https://988lifeline.org",
  available: "24/7",
} as const;

/** What the person sees when the screen fires. Plain, warm, no label. */
export const CRISIS_MESSAGE = [
  "Let's pause the questions. What you just shared matters more than any map.",
  "If you are thinking about harming yourself, you can call or text 988 to reach the 988 Suicide & Crisis Lifeline, any time, day or night.",
  "If you are in immediate danger, call 911.",
  "We have stopped here and deleted what you typed. A person from our team is glad to talk whenever you are ready.",
] as const;

/** Shown quietly on every health-like screen, whether or not anything fired. */
export const CRISIS_FOOTER = "If you are in crisis, call or text 988 (Suicide & Crisis Lifeline), 24/7. In immediate danger, call 911.";

/** Ideation markers (C-SSRS levels 1–5 in the original), strongest first. Patterns only; no level is shown. */
const IDEATION_PATTERNS: readonly RegExp[] = [
  /\bi (have|'ve got|got) a plan\b/i,
  /\b(going to (kill|end) (myself|my life))\b/i,
  /\b(tonight|tomorrow|this weekend).{0,30}\b(end it|kill myself|not be here)\b/i,
  /\b(wrote|writing|written) (a )?(suicide )?note\b/i,
  /\b(saved up|stockpil\w+|bought).{0,25}\b(pills|rounds|ammunition)\b/i,
  /\bi (intend|plan) to (die|kill myself|end my life)\b/i,
  /\bi('m| am) going to (die|do it)\b/i,
  /\bready to (die|end it)\b/i,
  /\b(thought about|thinking about|considered) (how|ways) (to )?(die|kill myself|end)\b/i,
  /\b(researching|looked up).{0,20}\b(overdose|lethal|methods)\b/i,
  /\b(want to die|wish i (was|were) dead|kill myself)\b/i,
  /\b(suicidal|suicide)\b/i,
  /\b(better off (dead|without me))\b/i,
  /\b(don'?t want to (be here|wake up|live)( anymore)?)\b/i,
  /\b(tired of (living|being alive))\b/i,
  /\b(no (point|reason) (in )?(living|going on))\b/i,
];

/** Self-harm phrases (the banner's tier-1 list, less the ones the patterns above already cover). */
const SELF_HARM_PHRASES: readonly string[] = [
  "end my life", "don't want to live", "no reason to live", "planning to hurt myself",
  "going to hurt myself", "overdose", "cut myself", "self-harm", "self harm", "hurting myself",
];

export type CrisisScreen = {
  /** True when the intake must stop and show the lifeline. */
  stop: boolean;
  /** How many markers fired. The phrases themselves are never returned or stored. */
  markers: number;
};

export function screenForCrisis(input: unknown): CrisisScreen {
  const text = typeof input === "string" ? input : "";
  if (!text.trim()) return { stop: false, markers: 0 };
  const lower = text.toLowerCase();
  let markers = 0;
  for (const p of IDEATION_PATTERNS) if (p.test(text)) markers++;
  for (const phrase of SELF_HARM_PHRASES) if (lower.includes(phrase)) markers++;
  return { stop: markers > 0, markers };
}

// ============================================================
// WEALTH GENOME INTAKE — first build (RCS-GENOME-INTAKE.md, "First build";
// RCS-FIRST-LOGIN-MANAGER.json genome.first_build_only; controls 36–41,
// 57, 59, 60, 68, 70, 71 of RCS-INTRO-75-CONTROLS.json).
//
//   consent → mind cluster → reflection → money cluster → reflection →
//   close: destroy the raw answers, keep the map.
//
// Retention is split by kind, and each question carries its class:
//   • retention "destroy" — the mind / health-like answers. They live only
//     in a short-lived table and are deleted at close and by a scheduled
//     sweep. The map keeps tendencies only.
//   • retention "profile" — the money answers (income, expenses, W-2,
//     taxes). They are the household's financial profile, which best-interest
//     record-keeping (NAIC Model #275 §9 as adopted by the states) can require
//     a firm to keep for any recommendation that relied on it. They go
//     straight into the household's existing fact-finder record, never into
//     the raw-answer table, and the consent screen says so.
// Counsel can move a question between classes with GENOME_RETENTION_OVERRIDES
// (see effectiveRetention); the consent text lists the classes as they
// stand, so a move changes the consent snapshot and older consents lapse.
//
// The KEPT map: tendencies on four pattern axes (control/drift, solo/shared,
// freeze/act, excite/lock), the durability reading the site's existing
// Wealth Genome engine makes from them, and
// approximate money bands. No quote, no number as typed, no diagnosis or
// condition label, no medication, no name (control 71: the flow never asks
// for a spouse's name, so none can be used).
//
// Reuse, with attribution:
//   • Durability axes: shared/wealthGenomeDurability.ts, already in this app
//     (the same module as doctor-buddy/shared/engines/wealthGenomeDurability.ts).
//     Tendencies enter it as `stated` evidence, as the engine requires for
//     self-report, and its own basis lines say how thin that is.
//   • The tendency → durability bridge follows doctor-buddy/shared/nlp/
//     genomeBridge.ts, minus its evidence quotes: nothing said is repeated.
//   • From doctor-buddy/shared/engines/psychFinancialBridge.ts, its design
//     rules only: deterministic, and every assumption named (the map's
//     `notObserved`). None of its clinical inputs (the DSM-5 item bank, risk
//     scores, condition labels) is ported, and — per the regulatory review —
//     nothing here gates or recommends a strategy. Tendencies only; the map
//     is context for the household and the advisor.
//   • Retention and deletion: mind answers are destroyed at close; the sweep
//     removes anything past its expiry and anything older than 24 hours; a
//     legal hold suspends deletion until it is released.
//   • Consent evidence follows doctor-buddy's hipaa_consents (version, text
//     snapshot, adult 18+, each acknowledgement recorded, withdrawal).
//
// Every spoken step carries a `speaker` — "john" or "judy", the two AI
// guides — so a later build can give each a voice. Nothing here renders an
// avatar.
// ============================================================
import { buildGenome, type DurabilityAxis, type Signal } from "./wealthGenomeDurability";

/** Bump the version whenever CONSENT_TEXT or CONSENT_ACKS change; server/genomeIntake.test.ts pins the pair. */
export const CONSENT_VERSION = "genome-consent-2026-09-23.6";

/** The promise, in writing, shown before any health-like question. */
export const CONSENT_TEXT: readonly string[] = [
  "This is optional and you can revoke it. You can stop at any time, skip any question, and later withdraw your consent, which deletes your map.",
  "Why we ask: to understand how you make money decisions, so the structure of your plan fits you, and to record approximate financial facts in your household file.",
  "The information you give may be used by a licensed insurance agent to discuss insurance and annuity options with you.",
  "We ask permission before every cluster of questions. If you say no, we skip it and mark that part of the map as unknown.",
  "We destroy your answers about how you think and feel. Financial facts you give us are kept in your household file so any recommendation can be checked later.",
  "Answers about how you think and feel are destroyed when we finish, and automatically within an hour if you leave part-way. The map keeps only tendencies and approximate money bands. No quotes, no diagnosis labels, no medication lists, no names.",
  "Your map is shown to you and to your advisor as background. For now, no product or strategy recommendation is based on it.",
  "If the law requires us to preserve records (a legal hold), deletion waits until the hold ends.",
  "The Wealth Genome is not a diagnosis. It is not medical or mental-health care, not therapy and not a clinic, and it is not a substitute for your physician or psychiatrist.",
  "John and Judy, who ask the questions, are AI guides: software, not people. Their questions are written in advance. No AI model reads, scores or rewrites your answers; the map is worked out by fixed rules, and a person reviews anything we suggest.",
  "Support here means being heard, a written map, and a human review of anything we suggest.",
  "This is not medical or mental-health care, and no sound or colour here is a treatment.",
  "Counsel reviews this room before it goes live.",
];

/** Each acknowledgement is recorded on the consent row. All three are required. */
export const CONSENT_ACKS = {
  adult18Plus: "I am 18 or older.",
  notDiagnosis: "I understand this is not a diagnosis, not therapy and not medical care.",
  destroyKeep: "I understand my answers about how I think and feel are destroyed at the end, and the financial facts I give are kept in my household file.",
} as const;
export type ConsentAcks = Record<keyof typeof CONSENT_ACKS, boolean>;

/** The consent lines, with the retention classes as they currently stand. */
export function consentLines(overrides: RetentionOverrides = {}): string[] {
  const kept = ALL_QUESTIONS.filter((q) => effectiveRetention(q.id, overrides) === "profile").map((q) => q.short);
  const destroyed = ALL_QUESTIONS.filter((q) => effectiveRetention(q.id, overrides) === "destroy").map((q) => q.short);
  return [
    ...CONSENT_TEXT,
    `Kept in your household file: ${kept.length ? kept.join(", ") : "nothing from this conversation"}.`,
    `Destroyed at the end: ${destroyed.length ? destroyed.join(", ") : "nothing"}.`,
  ];
}

/** The exact text the person agreed to, stored with the consent record (Doctor Buddy's consentTextSnapshot). */
export function consentSnapshot(overrides: RetentionOverrides = {}): string {
  return [...consentLines(overrides), ...Object.values(CONSENT_ACKS)].join("\n");
}

/** The spec's legal non-claims, shown in plain words on the consent screen. */
export const LEGAL_NONCLAIMS: readonly string[] = [
  "This is not medical or mental-health care, and no sound or colour here is a treatment.",
  "Binaural sound is a modest optional bed, not a medical device.",
  "The Wealth Genome is not a diagnosis.",
  "Answers about how you think and feel are destroyed. The map is kept. Counsel reviews before live.",
];

/** Control 60: support, not therapy. */
export const SUPPORT_NOT_THERAPY = "Support here means being heard, a map, and a human review. It is not therapy and not a clinic.";

/** The two permission lines, used exactly as written in the spec. */
export const PERMISSION_LINES = {
  mind: "May I ask a few questions about how your mind and energy work under pressure? You can skip any item. Raw answers are destroyed when we finish. We keep only the map.",
  money: "May I ask a financial question? Approximate numbers are enough.",
} as const;

export const CLOSE_LINE = "We are going to destroy the raw answers now. What remains is your wealth genome.";

export const WHY_LINE =
  "Ordinary advisors ask if you would sell after a twenty percent drop. That does not describe the mind that will actually move the money. We map how you get excited, how you stay disciplined, where you freeze, and who you become under pressure — as background for planning conversations, not to label you.";

export const PREVIEW_BADGE = "Preview — counsel review pending";

/** Shown under the map everywhere it appears. */
export const TENDENCY_NOTE = "Tendencies from your own answers, kept as background for you and your advisor. Not a diagnosis, not a score of you, and not the basis of any recommendation.";

export type ClusterId = "mind" | "money";
/** Mind first, then money: the interleave the spec asks for, never all health then all money. */
export const CLUSTER_ORDER: readonly ClusterId[] = ["mind", "money"];

/**
 * The two AI guides who ask the questions, alternating. Display names live
 * here, always shown with the label "AI guide". A later build may give each
 * a voice and a face and decide a different order; this one only names them.
 */
export type Speaker = "john" | "judy";
export const GUIDES: Readonly<Record<Speaker, { name: string; label: "AI guide" }>> = {
  john: { name: "John", label: "AI guide" },
  judy: { name: "Judy", label: "AI guide" },
};
/** Default order: john, judy, john, judy… */
export const SPEAKER_ORDER: readonly Speaker[] = ["john", "judy"];

export type Axis = "control_drift" | "solo_shared" | "freeze_act" | "excite_lock";
export type Pole = "control" | "drift" | "solo" | "shared" | "freeze" | "act" | "excite" | "lock";
export const AXES: Readonly<Record<Axis, { poles: readonly [Pole, Pole]; label: string }>> = {
  control_drift: { poles: ["control", "drift"], label: "Control / drift" },
  solo_shared: { poles: ["solo", "shared"], label: "Solo / shared" },
  freeze_act: { poles: ["freeze", "act"], label: "Freeze / act" },
  excite_lock: { poles: ["excite", "lock"], label: "Excite / lock" },
};

/** A choice's effect: poles on the pattern axes and, optionally, a nudge on a durability axis (-2..+2). */
export type ChoiceEffect = { poles: readonly Pole[]; durability?: Partial<Record<DurabilityAxis, number>> };

/** What happens to an answer: destroyed at close, or kept in the household's fact-finder record. */
export type Retention = "destroy" | "profile";
export type RetentionOverrides = Partial<Record<string, Retention>>;

export type MindQuestion = {
  id: string;
  cluster: "mind";
  retention: Retention;
  /** How the consent screen names this item. */
  short: string;
  /** A per-item permission, for the more personal items. */
  preface?: string;
  prompt: string;
  choices: ReadonlyArray<{ id: string; label: string } & ChoiceEffect>;
  /** Offer an optional "say more" box. Screened for crisis, never read into the map, destroyed at close. */
  sayMore: boolean;
};

/**
 * mind_questions_first_build, plus one conversational energy item. Each is
 * answered by choosing, so the map is read from choices, not from words.
 */
export const MIND_QUESTIONS: readonly MindQuestion[] = [
  {
    id: "mind.tired", cluster: "mind", retention: "destroy", short: "how you handle money when tired", sayMore: true,
    prompt: "When you are tired, do you tighten control of money or let it drift?",
    choices: [
      { id: "tighten", label: "I tighten control", poles: ["control"], durability: { emotional: 0.5 } },
      { id: "drift", label: "I let it drift", poles: ["drift"], durability: { income: -0.5 } },
      { id: "depends", label: "It depends", poles: [] },
    ],
  },
  {
    id: "mind.works", cluster: "mind", retention: "destroy", short: "what you do when something works", sayMore: true,
    prompt: "When something works, do you raise the bet or lock the gain?",
    choices: [
      { id: "raise", label: "Raise the bet", poles: ["excite"], durability: { emotional: -0.5 } },
      { id: "lock", label: "Lock the gain", poles: ["lock"], durability: { emotional: 0.5 } },
      { id: "depends", label: "It depends", poles: [] },
    ],
  },
  {
    id: "mind.fight", cluster: "mind", retention: "destroy", short: "who you become in a money fight", sayMore: true,
    prompt: "Who do you become in a fight about money with the person you love?",
    choices: [
      { id: "wheel", label: "I take the wheel", poles: ["control", "solo"], durability: { relational: -1 } },
      { id: "quiet", label: "I go quiet", poles: ["freeze"], durability: { relational: -0.5 } },
      { id: "give", label: "I give way", poles: ["drift", "shared"] },
      { id: "talk", label: "We talk it through", poles: ["shared", "act"], durability: { relational: 1 } },
    ],
  },
  {
    id: "mind.badly", cluster: "mind", retention: "destroy", short: "what you do when things go badly", sayMore: true,
    prompt: "When a case or a market goes badly, do you go quiet, go busy, or go to someone?",
    choices: [
      { id: "quiet", label: "Go quiet", poles: ["freeze"] },
      { id: "busy", label: "Go busy", poles: ["act", "solo"] },
      { id: "someone", label: "Go to someone", poles: ["act", "shared"], durability: { relational: 0.5 } },
    ],
  },
  {
    id: "mind.calm", cluster: "mind", retention: "destroy", short: "how calm or anxious you usually feel", sayMore: true,
    preface: "Do you mind if I ask a personal question?",
    prompt: "Do you ever feel a little anxious sometimes — or really anxious — or is everything usually calm for you?",
    // A tendency on the durability engine's emotional axis. Never shown back as a feeling or a condition.
    choices: [
      { id: "calm", label: "Usually calm", poles: [], durability: { emotional: 1 } },
      { id: "sometimes", label: "A little, sometimes", poles: [], durability: { emotional: 0 } },
      { id: "really", label: "Really, at times", poles: [], durability: { emotional: -1 } },
    ],
  },
];

export type W2Status = "w2" | "not_w2" | "both";
export type BandScale = "income" | "expenses" | "taxes";
type MoneyBase = { id: string; cluster: "money"; prompt: string; retention: Retention; short: string };
export type AmountQuestion = MoneyBase & { kind: "amount"; periods: readonly ("year" | "month")[]; band: BandScale };
export type MoneyChoiceQuestion = MoneyBase & { kind: "choice"; choices: ReadonlyArray<{ id: W2Status; label: string }> };
export type MoneyQuestion = AmountQuestion | MoneyChoiceQuestion;

/** money_questions_first_build. Approximate is enough; only the band survives. */
export const MONEY_QUESTIONS: readonly MoneyQuestion[] = [
  { id: "money.income", cluster: "money", retention: "profile", short: "approximate income", prompt: "Approximate household income, year or month?", kind: "amount", periods: ["year", "month"], band: "income" },
  { id: "money.expenses", cluster: "money", retention: "profile", short: "approximate expenses", prompt: "Approximate household expenses?", kind: "amount", periods: ["year", "month"], band: "expenses" },
  {
    id: "money.w2", cluster: "money", retention: "profile", short: "W-2 or not", prompt: "W-2 or not?", kind: "choice",
    choices: [{ id: "w2", label: "W-2" }, { id: "not_w2", label: "Not W-2" }, { id: "both", label: "Some of each" }],
  },
  { id: "money.taxes", cluster: "money", retention: "profile", short: "approximate taxes last year", prompt: "Approximate taxes last year?", kind: "amount", periods: ["year"], band: "taxes" },
];

export const ALL_QUESTIONS: ReadonlyArray<MindQuestion | MoneyQuestion> = [...MIND_QUESTIONS, ...MONEY_QUESTIONS];
export const ALL_QUESTION_IDS: readonly string[] = ALL_QUESTIONS.map((q) => q.id);

/** Parse "money.taxes=destroy,mind.calm=destroy" (GENOME_RETENTION_OVERRIDES). Unknown ids and classes are ignored. */
export function parseRetentionOverrides(raw: string | undefined | null): RetentionOverrides {
  const out: RetentionOverrides = {};
  for (const part of (raw ?? "").split(",")) {
    const [id, cls] = part.split("=").map((x) => x?.trim());
    if (id && ALL_QUESTION_IDS.includes(id) && (cls === "destroy" || cls === "profile")) out[id] = cls;
  }
  return out;
}

export function effectiveRetention(questionId: string, overrides: RetentionOverrides = {}): Retention {
  return overrides[questionId] ?? ALL_QUESTIONS.find((q) => q.id === questionId)?.retention ?? "destroy";
}

// ─── The household file (fact-finder) ─────────────────────────────────────

/** The fact-finder section the "profile" answers are kept in, beside the fifteen assessment sections. */
export const PROFILE_SECTION = "genomeIntake";
const PROFILE_KEY: Record<string, string> = {
  "money.income": "approxHouseholdIncome",
  "money.expenses": "approxHouseholdExpenses",
  "money.w2": "w2Status",
  "money.taxes": "approxTaxesLastYear",
};
export const profileKey = (questionId: string) => PROFILE_KEY[questionId] ?? questionId.replace(/[^A-Za-z0-9]+/g, "_");

/** Fields to merge into the fact-finder section for one kept answer. Free-text notes are never kept. */
export function profileFields(a: RawAnswer, now: Date): Record<string, string | number | null> {
  const k = profileKey(a.questionId);
  const at = { [`${k}RecordedAt`]: now.toISOString() };
  if (a.kind === "amount") return { [k]: a.amount, [`${k}Period`]: a.period, ...at };
  return { [k]: a.choiceId, ...at };
}

/** Read kept answers back out of the fact-finder section, with when each was recorded. */
export function answersFromProfile(section: Record<string, unknown> | null | undefined): Array<{ answer: RawAnswer; recordedAt: Date | null }> {
  if (!section) return [];
  const out: Array<{ answer: RawAnswer; recordedAt: Date | null }> = [];
  for (const q of ALL_QUESTIONS) {
    const k = profileKey(q.id);
    const v = section[k];
    if (v === undefined || v === null || v === "") continue;
    const when = typeof section[`${k}RecordedAt`] === "string" ? new Date(section[`${k}RecordedAt`] as string) : null;
    const recordedAt = when && !Number.isNaN(when.getTime()) ? when : null;
    if (q.cluster === "money" && q.kind === "amount") {
      const period = section[`${k}Period`] === "month" ? "month" : "year";
      if (typeof v === "number" && Number.isFinite(v)) out.push({ answer: { questionId: q.id, kind: "amount", amount: v, period }, recordedAt });
    } else if (typeof v === "string") {
      out.push({ answer: { questionId: q.id, kind: "choice", choiceId: v }, recordedAt });
    }
  }
  return out;
}
export const clusterOfQuestion = (id: string): ClusterId | null =>
  MIND_QUESTIONS.some((q) => q.id === id) ? "mind" : MONEY_QUESTIONS.some((q) => q.id === id) ? "money" : null;

// ─── The script: what is said, in order, and by whom ──────────────────────

export type ScriptStep =
  | { kind: "permission"; cluster: ClusterId; speaker: Speaker; line: string }
  | { kind: "question"; cluster: ClusterId; speaker: Speaker; questionId: string }
  | { kind: "reflection"; cluster: ClusterId; speaker: Speaker }
  | { kind: "close"; speaker: Speaker; line: string };

type Unspoken<T> = T extends unknown ? Omit<T, "speaker"> : never;

/** Consent comes first (its own screen); then the clusters in CLUSTER_ORDER, each asked, answered and reflected; then the close. */
export function buildIntakeScript(): ScriptStep[] {
  const steps: Array<Unspoken<ScriptStep>> = [];
  for (const cluster of CLUSTER_ORDER) {
    steps.push({ kind: "permission", cluster, line: PERMISSION_LINES[cluster] });
    const ids = cluster === "mind" ? MIND_QUESTIONS.map((q) => q.id) : MONEY_QUESTIONS.map((q) => q.id);
    for (const questionId of ids) steps.push({ kind: "question", cluster, questionId });
    steps.push({ kind: "reflection", cluster });
  }
  steps.push({ kind: "close", line: CLOSE_LINE });
  return steps.map((s, i) => ({ ...s, speaker: SPEAKER_ORDER[i % SPEAKER_ORDER.length]! }) as ScriptStep);
}

// ─── Money bands ──────────────────────────────────────────────────────────

/** Annual bands, lower bound inclusive. The kept map stores the band id only. */
export const BANDS: Readonly<Record<BandScale, ReadonlyArray<{ id: string; label: string; min: number }>>> = {
  income: [
    { id: "i0", label: "under $100k", min: 0 },
    { id: "i1", label: "$100k–$250k", min: 100_000 },
    { id: "i2", label: "$250k–$500k", min: 250_000 },
    { id: "i3", label: "$500k–$1M", min: 500_000 },
    { id: "i4", label: "$1M or more", min: 1_000_000 },
  ],
  expenses: [
    { id: "e0", label: "under $60k", min: 0 },
    { id: "e1", label: "$60k–$120k", min: 60_000 },
    { id: "e2", label: "$120k–$250k", min: 120_000 },
    { id: "e3", label: "$250k–$500k", min: 250_000 },
    { id: "e4", label: "$500k or more", min: 500_000 },
  ],
  taxes: [
    { id: "t0", label: "under $25k", min: 0 },
    { id: "t1", label: "$25k–$75k", min: 25_000 },
    { id: "t2", label: "$75k–$150k", min: 75_000 },
    { id: "t3", label: "$150k–$300k", min: 150_000 },
    { id: "t4", label: "$300k or more", min: 300_000 },
  ],
};

export function bandFor(scale: BandScale, annual: number): string | null {
  if (!Number.isFinite(annual) || annual < 0) return null;
  let id: string | null = null;
  for (const b of BANDS[scale]) if (annual >= b.min) id = b.id;
  return id;
}
export const bandLabel = (scale: BandScale, id: string | null): string | null => BANDS[scale].find((b) => b.id === id)?.label ?? null;
const bandIndex = (scale: BandScale, id: string | null) => BANDS[scale].findIndex((b) => b.id === id);

// ─── Raw answers (short-lived) ────────────────────────────────────────────

export type RawAnswer =
  | { questionId: string; kind: "choice"; choiceId: string; note?: string }
  | { questionId: string; kind: "amount"; amount: number; period: "year" | "month" };

export const MAX_NOTE_CHARS = 2_000;

/** Accept only an answer the question can have; anything else is refused before it is stored. */
export function validateRawAnswer(a: RawAnswer): string | null {
  const mind = MIND_QUESTIONS.find((q) => q.id === a.questionId);
  if (mind) {
    if (a.kind !== "choice" || !mind.choices.some((c) => c.id === a.choiceId)) return "not a choice this question offers";
    if (a.note !== undefined && (!mind.sayMore || a.note.length > MAX_NOTE_CHARS)) return "note not accepted";
    return null;
  }
  const money = MONEY_QUESTIONS.find((q) => q.id === a.questionId);
  if (!money) return "unknown question";
  if (money.kind === "choice") {
    if (a.kind !== "choice" || !money.choices.some((c) => c.id === a.choiceId)) return "not a choice this question offers";
    return a.note === undefined ? null : "note not accepted";
  }
  if (a.kind !== "amount") return "an approximate amount is expected";
  if (!Number.isFinite(a.amount) || a.amount < 0 || a.amount > 1e11) return "amount out of range";
  if (!money.periods.includes(a.period)) return "period not offered";
  return null;
}

// ─── The kept map ─────────────────────────────────────────────────────────

export type LimbStatus = "mapped" | "unknown";
export type AxisReading = { axis: Axis; lean: Pole | "mixed" | "unknown" };
export type DurabilitySummary = { score: number; confidence: number; insufficient: boolean };
export type GenomeMap = {
  version: 2;
  consentVersion: string;
  writtenAt: string;
  limbs: Record<ClusterId, LimbStatus>;
  axes: AxisReading[];
  /** The site's durability engine, read from these tendencies as `stated` evidence. */
  durability: Record<DurabilityAxis, DurabilitySummary>;
  money: { incomeBand: string | null; expenseBand: string | null; taxBand: string | null; w2: W2Status | null };
  /** What the map did not observe, named (psychFinancialBridge rule 3). */
  notObserved: string[];
};

export type ClusterDecision = "accepted" | "declined" | "pending";

function choiceOf(a: RawAnswer) {
  if (a.kind !== "choice") return null;
  return MIND_QUESTIONS.find((m) => m.id === a.questionId)?.choices.find((x) => x.id === a.choiceId) ?? null;
}

/** Pattern axes from the mind choices. A skipped question adds nothing; an even split reads "mixed". */
export function readAxes(answers: readonly RawAnswer[]): AxisReading[] {
  const tally: Record<Pole, number> = { control: 0, drift: 0, solo: 0, shared: 0, freeze: 0, act: 0, excite: 0, lock: 0 };
  for (const a of answers) for (const p of choiceOf(a)?.poles ?? []) tally[p] += 1;
  return (Object.keys(AXES) as Axis[]).map((axis) => {
    const [a, b] = AXES[axis].poles;
    const lean: AxisReading["lean"] = tally[a] === 0 && tally[b] === 0 ? "unknown" : tally[a] === tally[b] ? "mixed" : tally[a] > tally[b] ? a : b;
    return { axis, lean };
  });
}

const annualise = (a: Extract<RawAnswer, { kind: "amount" }>) => (a.period === "month" ? a.amount * 12 : a.amount);

export function readMoney(answers: readonly RawAnswer[]): GenomeMap["money"] {
  const amount = (id: string) => answers.find((a): a is Extract<RawAnswer, { kind: "amount" }> => a.questionId === id && a.kind === "amount");
  const inc = amount("money.income");
  const exp = amount("money.expenses");
  const tax = amount("money.taxes");
  const w2 = answers.find((a) => a.questionId === "money.w2" && a.kind === "choice");
  return {
    incomeBand: inc ? bandFor("income", annualise(inc)) : null,
    expenseBand: exp ? bandFor("expenses", annualise(exp)) : null,
    taxBand: tax ? bandFor("taxes", annualise(tax)) : null,
    w2: w2 && w2.kind === "choice" && ["w2", "not_w2", "both"].includes(w2.choiceId) ? (w2.choiceId as W2Status) : null,
  };
}

/**
 * Tendencies → durability signals, after doctor-buddy's genomeBridge: each
 * signal is `stated` (self-report, the engine's second-weakest rank) and its
 * note names the question, never the words used.
 */
export function durabilitySignals(mindAnswers: readonly RawAnswer[], money: GenomeMap["money"], asOfYear: number): Signal[] {
  const out: Signal[] = [];
  for (const a of mindAnswers) {
    const c = choiceOf(a);
    for (const [axis, direction] of Object.entries(c?.durability ?? {}) as Array<[DurabilityAxis, number]>) {
      out.push({ axis, direction, kind: "stated", note: `Tendency chosen on the genome intake (${a.questionId}). Self-report, not observed behaviour.`, asOfYear });
    }
  }
  // Money bands are facts about the plan, not the person: inferred, the weakest rank.
  const inc = bandIndex("income", money.incomeBand);
  const exp = bandIndex("expenses", money.expenseBand);
  if (inc >= 0 && exp >= 0) {
    out.push({ axis: "income", direction: exp >= inc + 1 ? -1 : inc >= exp + 2 ? 1 : 0, kind: "inferred", note: "Approximate income band against approximate expense band.", asOfYear });
  }
  if (money.w2) out.push({ axis: "income", direction: money.w2 === "w2" ? 0.5 : money.w2 === "not_w2" ? -0.5 : 0, kind: "inferred", note: "W-2 or not, as stated.", asOfYear });
  return out;
}

/**
 * Write the map from the raw answers and the cluster decisions. A declined
 * cluster is "unknown" and contributes nothing, whatever rows exist for it.
 */
export function buildGenomeMap(
  answers: readonly RawAnswer[],
  decisions: Record<ClusterId, ClusterDecision>,
  consentVersion: string,
  now: Date = new Date(),
): GenomeMap {
  const mindAnswers = decisions.mind === "accepted" ? answers.filter((a) => clusterOfQuestion(a.questionId) === "mind") : [];
  const moneyAnswers = decisions.money === "accepted" ? answers.filter((a) => clusterOfQuestion(a.questionId) === "money") : [];
  const axes = readAxes(mindAnswers);
  const money = readMoney(moneyAnswers);
  const genome = buildGenome(durabilitySignals(mindAnswers, money, now.getUTCFullYear()), now.getUTCFullYear());
  const durability = Object.fromEntries(
    Object.entries(genome.readings).map(([k, r]) => [k, { score: r.score, confidence: r.confidence, insufficient: r.insufficient }]),
  ) as GenomeMap["durability"];
  const mindMapped = axes.some((x) => x.lean !== "unknown") || mindAnswers.length > 0;
  const moneyMapped = Object.values(money).some((v) => v !== null);
  const notObserved = [
    ...axes.filter((a) => a.lean === "unknown").map((a) => AXES[a.axis].label),
    ...(money.incomeBand ? [] : ["Income band"]),
    ...(money.expenseBand ? [] : ["Expense band"]),
    ...(money.w2 ? [] : ["W-2 status"]),
    ...(money.taxBand ? [] : ["Tax band"]),
    "Behaviour in a real drawdown (only observed events count as strong evidence)",
  ];
  return {
    version: 2,
    consentVersion,
    writtenAt: now.toISOString(),
    limbs: { mind: mindMapped ? "mapped" : "unknown", money: moneyMapped ? "mapped" : "unknown" },
    axes,
    durability,
    money,
    notObserved,
  };
}

/** Parse a stored map defensively: anything unexpected reads as unknown, never as a guess. */
export function parseGenomeMap(raw: unknown): GenomeMap | null {
  if (!raw || typeof raw !== "object") return null;
  const m = raw as Partial<GenomeMap>;
  if (m.version !== 2 || !Array.isArray(m.axes) || !m.limbs || !m.money || !m.durability) return null;
  return m as GenomeMap;
}

// ─── Reflections: one line, from the pattern only ─────────────────────────

const POLE_PHRASE: Record<Pole, string> = {
  control: "under strain you tighten control",
  drift: "under strain you let things drift",
  solo: "you tend to carry decisions alone",
  shared: "you tend to decide with someone",
  freeze: "when it goes badly you go still",
  act: "when it goes badly you move",
  excite: "a win makes you want to raise the bet",
  lock: "a win makes you want to lock the gain",
};

/** "So the pattern I am hearing is…" — written from the axes, never from an answer's words. */
export function mindReflection(axes: readonly AxisReading[]): string {
  const said = axes.filter((a) => a.lean !== "unknown" && a.lean !== "mixed").map((a) => POLE_PHRASE[a.lean as Pole]);
  const mixed = axes.filter((a) => a.lean === "mixed").map((a) => AXES[a.axis].label.toLowerCase());
  if (!said.length && !mixed.length) return "Nothing to map from this cluster — that part of the genome stays unknown, and that is fine.";
  const parts = [...said];
  if (mixed.length) parts.push(`you sit in the middle on ${mixed.join(" and ")}`);
  return `So the pattern I am hearing is: ${joinList(parts)}.`;
}

export function moneyReflection(money: GenomeMap["money"]): string {
  const parts: string[] = [];
  const inc = bandLabel("income", money.incomeBand);
  const exp = bandLabel("expenses", money.expenseBand);
  const tax = bandLabel("taxes", money.taxBand);
  if (inc) parts.push(`income in the ${inc} band`);
  if (exp) parts.push(`expenses in the ${exp} band`);
  if (money.w2) parts.push(money.w2 === "w2" ? "W-2 pay" : money.w2 === "not_w2" ? "income that is not W-2" : "some W-2 and some not");
  if (tax) parts.push(`taxes last year in the ${tax} band`);
  if (!parts.length) return "No numbers to map from this cluster — that part of the genome stays unknown, and that is fine.";
  return `So the picture, approximately: ${joinList(parts)}.`;
}

function joinList(parts: readonly string[]): string {
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join("; ")}; and ${parts[parts.length - 1]}`;
}

/** How a durability reading is worded on screen: a tendency, never a label. */
export function durabilityWord(d: DurabilitySummary): string {
  if (d.insufficient) return "not enough to say";
  if (d.score >= 0.5) return "tends to hold steady";
  if (d.score <= -0.5) return "may wobble under strain";
  return "mixed";
}

/** Lines Goldman may read: tendencies, durability words and bands, labelled as such. */
export function genomeLinesForAdvisor(map: GenomeMap): string[] {
  const m = map.money;
  return [
    `Mind limb: ${map.limbs.mind}. Money limb: ${map.limbs.money}. ${TENDENCY_NOTE}`,
    ...map.axes.map((a) => `${AXES[a.axis].label}: ${a.lean}`),
    ...(Object.entries(map.durability) as Array<[DurabilityAxis, DurabilitySummary]>).map(([k, d]) => `Durability (${k}): ${durabilityWord(d)}`),
    `Income band: ${bandLabel("income", m.incomeBand) ?? "unknown"}; expenses band: ${bandLabel("expenses", m.expenseBand) ?? "unknown"}; W-2: ${m.w2 ?? "unknown"}; taxes band: ${bandLabel("taxes", m.taxBand) ?? "unknown"}.`,
  ];
}

/** Every sentence the intake screens print, for the copy guard test. */
export function intakeCopy(): string[] {
  return [
    ...consentLines(), ...Object.values(CONSENT_ACKS), ...LEGAL_NONCLAIMS, SUPPORT_NOT_THERAPY, PERMISSION_LINES.mind, PERMISSION_LINES.money,
    CLOSE_LINE, WHY_LINE, PREVIEW_BADGE, TENDENCY_NOTE,
    ...MIND_QUESTIONS.flatMap((q) => [q.preface ?? "", q.prompt, ...q.choices.map((c) => c.label)]),
    ...MONEY_QUESTIONS.flatMap((q) => [q.prompt, ...(q.kind === "choice" ? q.choices.map((c) => c.label) : [])]),
    ...Object.values(POLE_PHRASE),
    "tends to hold steady", "may wobble under strain", "not enough to say",
  ].filter(Boolean);
}

/** A session's raw answers expire this long after consent. */
export const RAW_ANSWER_TTL_MS = 60 * 60 * 1000;
/** Hard ceiling: the sweep deletes any raw answer older than this, whatever its expiry says (legal hold aside). */
export const RAW_ANSWER_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * The frozen basis of a recommendation, for best-interest record-keeping
 * (NAIC Model #275 §9 as adopted). Deliberately a hook only in this build.
 *
 * TODO(counsel review): when a licensed agent makes a recommendation, freeze
 * the household-file facts it relied on (the "profile" answers, never the
 * destroyed mind answers and never the tendency map) with the date, the
 * product, and the agent, and keep it for the retention period the state
 * requires. Nothing writes this record yet.
 */
export type RecommendationBasis = {
  userId: number;
  recommendedAt: string;
  agentUserId: number | null;
  product: string;
  /** Household-file facts as they stood when the recommendation was made. */
  profileFacts: Record<string, string | number | null>;
  /** Always false: the tendency map is not a basis for recommendations. */
  usedTendencyMap: false;
};

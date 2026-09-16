/**
 * The companion — Doctor Buddy's whisperer for the person.
 *
 * The RCS AI Whisperer coaches an advisor during a client call. This engine
 * sits on the other side of the table: it listens to the person, reads their
 * language (representational system, Meta-Model, meta-programs), their state
 * (valence, arousal, rumination loops, away-from spirals) and, when consented,
 * the tone and body-language signals a camera or microphone produce, and
 * decides WHETHER, WHEN and HOW to step in:
 *
 *   - It never talks over a sentence. It waits for a pause, or for a
 *     monologue to run long while a loop is running.
 *   - It asks permission before a question that steers ("May I ask you
 *     something?"), and honours a no for a while.
 *   - A pattern interrupt (Sourcebook #8) is used only for a genuine loop,
 *     and is followed by an outcome question (#1), never left hanging.
 *   - Safety overrides everything. Any suicidal-ideation level from the
 *     C-SSRS engine switches the companion to simple safety language and
 *     human support; no NLP question is asked in that state.
 *
 * The output is deterministic: a reading, a timing verdict, and one
 * intervention with fallback text. The server may hand the reading to the
 * language model to phrase the spoken line more naturally (companionPrompt),
 * but the decision to speak, and its kind, are made here, in code, where
 * they can be tested. In the public wellness edition the companion is a
 * reflection and education tool and says so; it does not assess, diagnose or
 * treat. Pure, no I/O.
 */

import { assessCSSRS, type CSSRSLevel } from "../engines/crisisDetection";
import { guideFor, mirrorOpener, readRepSystemOverTurns, repSystemPromptBlock, type LanguagingGuide, type RepReading } from "./repSystems";
import { loadBearing, metaModel, metaModelPromptBlock, metaModelSummary, type MetaModelFinding } from "./metaModel";
import { metaProgramsPromptBlock, readMetaPrograms, salientMetaPrograms, type MetaProgramReading } from "./metaPrograms";
import { patternsPromptBlock, sleightOfMouthLines, suggestPatterns, type PatternSuggestion } from "./patterns";

export type CompanionSpeaker = "person" | "companion";

export interface CompanionTurn {
  /** Milliseconds since the session started. */
  at: number;
  speaker: CompanionSpeaker;
  text: string;
  durationMs?: number;
}

export type CompanionSignalKind = "body" | "tone" | "energy" | "attention";

export interface CompanionSignal {
  at: number;
  kind: CompanionSignalKind;
  /** Plain words: "leaning back, arms crossed", "flat, quiet". */
  value: string;
  /** −1 closed/low … +1 open/high. */
  score: number;
  source?: "browser-video" | "browser-audio" | "vision-model" | "manual";
}

export type Permission = "unknown" | "asked" | "granted" | "declined";

export interface CompanionInput {
  turns: readonly CompanionTurn[];
  signals?: readonly CompanionSignal[];
  /** Milliseconds since the session started. */
  now: number;
  edition?: "public" | "clinical";
  consent?: { audio?: boolean; video?: boolean };
  /** When the companion last spoke an intervention (not a reflection). */
  lastInterventionAt?: number;
  permission?: Permission;
  /** When permission was last asked or declined. */
  permissionAt?: number;
  /** Pattern ids already offered this session, so they are not repeated. */
  offered?: readonly number[];
}

export interface StateReading {
  /** −1 … +1 from a small affect lexicon over the last two minutes. */
  valence: number;
  /** 0 … 1 from punctuation, intensifiers, speaking rate and tone signals. */
  arousal: number;
  loop: { ruminating: boolean; repeated: string[] };
  awayFromSpiral: boolean;
  safety: { level: CSSRSLevel; description: string };
  /** Latest body/tone signals in words, newest first. */
  signals: string[];
}

export interface CompanionReading {
  rep: RepReading;
  guide: LanguagingGuide;
  metaModel: MetaModelFinding[];
  metaModelSummary: ReturnType<typeof metaModelSummary>;
  metaPrograms: MetaProgramReading[];
  salientMetaPrograms: MetaProgramReading[];
  patterns: PatternSuggestion[];
  state: StateReading;
  /** The person's last utterance. */
  last: string;
}

export type InterventionKind = "listen" | "reflect" | "ask-permission" | "question" | "pattern-interrupt" | "offer-pattern" | "safety";

export interface Intervention {
  kind: InterventionKind;
  /** What the companion says, or null to stay silent. */
  say: string | null;
  why: string;
  /** For question / offer-pattern: the question or the pattern being offered. */
  question?: string;
  pattern?: { id: number; name: string; invitation: string; steps: readonly string[] };
  /** Suggested delay before speaking, so a pause can complete. */
  afterMs: number;
  /** The permission state the client should record after this. */
  permission: Permission;
}

export interface Timing {
  personTalkingMs: number;
  silenceMs: number;
  personIsMidSentence: boolean;
  canSpeak: boolean;
  reason: string;
}

export interface CompanionOutput { reading: CompanionReading; timing: Timing; intervention: Intervention }

// ─── Constants ───────────────────────────────────────────────────────────────

export const PAUSE_MS = 1_500;
export const REFLECT_AFTER_MS = 3_500;
export const MONOLOGUE_MS = 90_000;
export const COOLDOWN_MS = 60_000;
export const DECLINE_HOLD_MS = 180_000;
export const WINDOW_MS = 120_000;

const NEGATIVE = ["sad", "hopeless", "worthless", "useless", "tired", "exhausted", "angry", "furious", "scared", "afraid", "terrified", "anxious", "panic", "alone", "lonely", "hate", "awful", "terrible", "horrible", "worst", "miserable", "guilty", "ashamed", "stupid", "failure", "fail", "cry", "crying", "hurt", "pain", "stuck", "trapped", "numb", "empty", "overwhelmed", "can't", "never", "nothing", "nobody", "pointless", "broken", "drained", "sick of", "fed up", "depress", "dread", "worried", "worry", "lost"];
const POSITIVE = ["good", "better", "okay", "fine", "calm", "hope", "hopeful", "grateful", "thankful", "glad", "happy", "proud", "relieved", "relief", "love", "enjoy", "excited", "peace", "peaceful", "strong", "steady", "progress", "managed", "handled", "helped", "kind", "safe", "rested", "light", "lighter", "clear", "clearer", "laugh", "smile", "friend", "support"];
const YES = /\b(yes|yeah|yep|sure|okay|ok|go ahead|of course|fine|alright|all right|please do|ask away|i guess|go on|why not)\b/i;
const NO = /\b(no|nope|not now|not right now|later|don't|i'd rather not|please don't|stop|leave it|not really|let me finish|i'm not done)\b/i;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function words(t: string): string[] {
  return t.toLowerCase().replace(/[^a-z0-9' ]+/g, " ").split(/\s+/).filter(Boolean);
}

function estimateDuration(t: CompanionTurn): number {
  if (Number.isFinite(t.durationMs) && (t.durationMs as number) > 0) return t.durationMs as number;
  return Math.max(400, (words(t.text).length / 2.5) * 1000);
}

function personTurnsInWindow(turns: readonly CompanionTurn[], now: number, windowMs = WINDOW_MS): CompanionTurn[] {
  return turns.filter(t => t.speaker === "person" && t.at >= now - windowMs && t.at <= now);
}

/** Repeated trigrams across the last two minutes of the person's speech. */
export function detectRumination(texts: readonly string[]): { ruminating: boolean; repeated: string[] } {
  const seen = new Map<string, number>();
  for (const t of texts) {
    const w = words(String(t ?? ""));
    const local = new Set<string>();
    for (let i = 0; i + 2 < w.length; i++) {
      const g = `${w[i]} ${w[i + 1]} ${w[i + 2]}`;
      if (/^(?:the|a|an|and|i|it|to|of|in|that|is|was) (?:the|a|an|and|i|it|to|of|in|that|is|was) /.test(g)) continue;
      local.add(g);
    }
    for (const g of local) seen.set(g, (seen.get(g) ?? 0) + 1);
    // Repeats inside one long utterance count too.
    const counts = new Map<string, number>();
    for (let i = 0; i + 2 < w.length; i++) { const g = `${w[i]} ${w[i + 1]} ${w[i + 2]}`; counts.set(g, (counts.get(g) ?? 0) + 1); }
    for (const [g, c] of counts) if (c >= 3 && local.has(g)) seen.set(g, Math.max(seen.get(g) ?? 0, c));
  }
  const repeated = Array.from(seen.entries()).filter(([, c]) => c >= 3).sort((a, b) => b[1] - a[1]).map(([g]) => g).slice(0, 5);
  return { ruminating: repeated.length > 0, repeated };
}

export function readState(turns: readonly CompanionTurn[], signals: readonly CompanionSignal[], now: number): StateReading {
  const recent = personTurnsInWindow(turns, now);
  const texts = recent.map(t => t.text);
  const joined = texts.join(" ").toLowerCase();
  const w = words(joined);
  let neg = 0, pos = 0;
  for (const n of NEGATIVE) if (joined.includes(n)) neg += 1;
  for (const p of POSITIVE) if (joined.includes(p)) pos += 1;
  const valence = w.length === 0 ? 0 : Math.max(-1, Math.min(1, (pos - neg) / Math.max(4, Math.sqrt(w.length))));
  const exclam = (joined.match(/!/g) ?? []).length;
  const intens = (joined.match(/\b(so|really|extremely|totally|completely|absolutely|can't|never)\b/g) ?? []).length;
  let rate = 0;
  const timed = recent.filter(t => t.durationMs && t.durationMs > 0);
  if (timed.length) rate = timed.reduce((a, t) => a + words(t.text).length, 0) / (timed.reduce((a, t) => a + (t.durationMs as number), 0) / 1000);
  const toneScores = signals.filter(s => s.at >= now - WINDOW_MS && (s.kind === "tone" || s.kind === "energy")).map(s => s.score);
  const toneArousal = toneScores.length ? Math.abs(toneScores.reduce((a, b) => a + b, 0) / toneScores.length) : 0;
  const arousal = Math.max(0, Math.min(1, 0.15 * Math.min(4, exclam) + 0.06 * Math.min(8, intens) + (rate > 3.2 ? 0.25 : rate > 2.6 ? 0.1 : 0) + 0.3 * toneArousal));
  const loop = detectRumination(texts);
  const away = (joined.match(/\b(avoid|stop|get rid of|don't want|can't stand|never again|get away|escape|sick of|tired of|i hate|prevent)\b/g) ?? []).length;
  const awayFromSpiral = away >= 3 && valence < -0.15;
  const cs = assessCSSRS(texts.slice(-4).join(" "));
  const latest = [...signals].filter(s => s.at >= now - WINDOW_MS).sort((a, b) => b.at - a.at).slice(0, 3).map(s => s.value);
  return { valence: Math.round(valence * 100) / 100, arousal: Math.round(arousal * 100) / 100, loop, awayFromSpiral, safety: { level: cs.level, description: cs.description }, signals: latest };
}

export function readTiming(turns: readonly CompanionTurn[], now: number, lastInterventionAt?: number): Timing {
  const person = turns.filter(t => t.speaker === "person");
  const last = person[person.length - 1];
  if (!last) return { personTalkingMs: 0, silenceMs: 0, personIsMidSentence: false, canSpeak: false, reason: "nothing said yet" };
  const lastEnd = last.at + estimateDuration(last);
  const silenceMs = Math.max(0, now - lastEnd);
  // Continuous talking: walk back while gaps between person turns are under the pause threshold.
  let talkingStart = last.at;
  for (let i = person.length - 1; i > 0; i--) {
    const prev = person[i - 1];
    const gap = person[i].at - (prev.at + estimateDuration(prev));
    const companionBetween = turns.some(t => t.speaker === "companion" && t.at > prev.at && t.at < person[i].at);
    if (gap > PAUSE_MS * 3 || companionBetween) break;
    talkingStart = prev.at;
  }
  const personTalkingMs = Math.max(0, Math.min(now, lastEnd) - talkingStart);
  const trimmed = last.text.trim();
  const personIsMidSentence = silenceMs < PAUSE_MS && !/[.!?…]$/.test(trimmed);
  const cooling = lastInterventionAt !== undefined && now - lastInterventionAt < COOLDOWN_MS;
  let canSpeak = false;
  let reason = "";
  if (silenceMs >= PAUSE_MS) { canSpeak = true; reason = `pause of ${Math.round(silenceMs / 100) / 10}s`; }
  else if (personTalkingMs >= MONOLOGUE_MS) { canSpeak = true; reason = `talking for ${Math.round(personTalkingMs / 1000)}s without a pause`; }
  else { reason = "person is still talking"; }
  if (canSpeak && cooling) { canSpeak = false; reason = "cooling down after the last intervention"; }
  return { personTalkingMs, silenceMs, personIsMidSentence, canSpeak, reason };
}

function gist(text: string, max = 110): string {
  const t = text.trim().replace(/\s+/g, " ");
  const sentences = t.split(/(?<=[.!?])\s+/).filter(Boolean);
  const lastS = sentences[sentences.length - 1] ?? t;
  const s = lastS.length > max ? `${lastS.slice(0, max - 1).replace(/\s+\S*$/, "")}…` : lastS;
  return s.replace(/^i\b/i, "you").replace(/\bi'm\b/gi, "you're").replace(/\bi am\b/gi, "you are").replace(/\bmy\b/gi, "your").replace(/\bme\b/gi, "you").replace(/\bi\b/g, "you").replace(/\bi've\b/gi, "you've").replace(/\bi'd\b/gi, "you'd").replace(/\bi'll\b/gi, "you'll").replace(/\bmyself\b/gi, "yourself").replace(/[.!?]+$/, "");
}

function safetyLine(level: CSSRSLevel, edition: "public" | "clinical"): string {
  if (level >= 4) return "I'm going to stop everything else. What you just said matters more than anything we were doing. Are you safe right now? If you are in danger, call 911 or your local emergency number. In the U.S. you can call or text 988 any time and a person will answer. I'd like you to reach a person who can be with you, and I'll stay here while you do.";
  if (level >= 2) return "Thank you for saying that out loud; that took something. I want to slow down and just be here with this. You don't have to be alone with it: in the U.S., 988 is a person, by call or text, any hour. Would you be willing to reach someone today, and can we talk about who?";
  return edition === "public"
    ? "I heard that, and I'm not going to skip past it. I'm here. If it ever gets heavier, 988 is a person any time, day or night. What's it like right now, this minute?"
    : "I heard that, and I'm not going to skip past it. Let's stay with what's here before anything else. What's it like right now?";
}

// ─── Main ────────────────────────────────────────────────────────────────────

export function companion(input: CompanionInput): CompanionOutput {
  const edition = input.edition ?? "public";
  const turns = Array.isArray(input.turns) ? [...input.turns].filter(t => t && typeof t.text === "string").sort((a, b) => a.at - b.at) : [];
  const signals = Array.isArray(input.signals) ? input.signals.filter(s => s && Number.isFinite(s.score)) : [];
  const now = Number.isFinite(input.now) ? input.now : (turns[turns.length - 1]?.at ?? 0);
  const personTexts = personTurnsInWindow(turns, now, 10 * 60_000).map(t => t.text);
  const lastPersonTurn = [...turns].reverse().find(t => t.speaker === "person");
  const lastUtterance = lastPersonTurn?.text ?? "";
  // The Meta-Model and pattern reading use the last SUBSTANTIVE utterance: a
  // "yeah, go ahead" after "may I ask you something?" must not erase what the
  // question was about.
  const substantive = [...turns].reverse().find(t => t.speaker === "person" && words(t.text).length >= 5);
  const last = substantive?.text ?? lastUtterance;
  const lastCompanion = [...turns].reverse().find(t => t.speaker === "companion");

  const rep = readRepSystemOverTurns(personTexts);
  const guide = guideFor(rep);
  const findings = metaModel(last);
  const programs = readMetaPrograms(personTexts);
  const salient = salientMetaPrograms(programs);
  const state = readState(turns, signals, now);
  const opener = mirrorOpener(rep, turns.length);
  const patterns = suggestPatterns({ text: personTexts.slice(-3).join(" "), metaModel: findings, metaPrograms: programs, edition, opener })
    .filter(p => !(input.offered ?? []).includes(p.id));

  const reading: CompanionReading = { rep, guide, metaModel: findings, metaModelSummary: metaModelSummary(findings), metaPrograms: programs, salientMetaPrograms: salient, patterns, state, last };
  const timing = readTiming(turns, now, input.lastInterventionAt);

  const permission: Permission = input.permission ?? "unknown";
  const answeredAfterAsk = permission === "asked" && lastPersonTurn && lastCompanion && lastPersonTurn.at > lastCompanion.at;

  // 1. Safety overrides everything, including timing.
  if (state.safety.level >= 1 && lastUtterance) {
    return { reading, timing, intervention: { kind: "safety", say: safetyLine(state.safety.level, edition), why: `safety language: ${state.safety.description}`, afterMs: 0, permission: "unknown" } };
  }

  // 2. Nothing said yet.
  if (!lastUtterance) {
    return { reading, timing, intervention: { kind: "listen", say: null, why: "waiting for the person to begin", afterMs: 0, permission } };
  }

  // 3. An answer to "may I ask you something?"
  if (answeredAfterAsk) {
    const t = lastPersonTurn!.text;
    if (NO.test(t) && !YES.test(t)) {
      return { reading, timing, intervention: { kind: "listen", say: "Of course. Go on; I'm listening.", why: "permission declined; holding for a while", afterMs: 0, permission: "declined" } };
    }
    if (YES.test(t)) {
      const q = chooseQuestion(reading, guide);
      return { reading, timing, intervention: { kind: q.kind, say: q.say, why: `permission granted; ${q.why}`, question: q.question, pattern: q.pattern, afterMs: 300, permission: "granted" } };
    }
  }

  // 3b. After the companion speaks, it waits for the person: no second line
  //     on the same silence, whatever the timing says.
  if (lastCompanion && (!lastPersonTurn || lastPersonTurn.at <= lastCompanion.at)) {
    return { reading, timing, intervention: { kind: "listen", say: null, why: "waiting for them to respond", afterMs: 0, permission } };
  }

  // 4. Respect a recent no.
  if (permission === "declined" && input.permissionAt !== undefined && now - input.permissionAt < DECLINE_HOLD_MS) {
    return { reading, timing, intervention: { kind: "listen", say: null, why: "they asked for room; listening", afterMs: 0, permission } };
  }

  // 5. Don't talk over them.
  if (!timing.canSpeak) {
    return { reading, timing, intervention: { kind: "listen", say: null, why: timing.reason, afterMs: Math.max(0, PAUSE_MS - timing.silenceMs), permission } };
  }

  // 6. A running loop during a monologue: pattern interrupt, then an outcome question.
  if (state.loop.ruminating && (timing.personTalkingMs >= MONOLOGUE_MS || state.arousal >= 0.5)) {
    const interrupt = patterns.find(p => p.id === 8);
    return { reading, timing, intervention: {
      kind: "pattern-interrupt",
      say: `${interrupt?.invitation ?? "Can I stop you for one second? Before you go on: what colour is the nearest wall to you right now?"} … Thank you. Now, with that loop paused for a moment: if this were already better, what's the first small thing you'd notice?`,
      why: `loop running ("${state.loop.repeated[0]}") ${timing.personTalkingMs >= MONOLOGUE_MS ? "in a long monologue" : "with rising intensity"}; interrupt then outcome question (Sourcebook #8 then #1)`,
      pattern: { id: 8, name: "State Interrupt", invitation: interrupt?.invitation ?? "", steps: interrupt?.steps ?? [] },
      afterMs: 0, permission: "unknown",
    } };
  }

  // 7. Something worth a steering question: ask permission first.
  const lb = loadBearing(findings);
  const worthAsking = (lb && lb.severity >= 2) || state.awayFromSpiral || (patterns[0] && patterns[0].offerable && patterns[0].score >= 4);
  if (worthAsking && permission !== "asked") {
    const ask = guide.system === "kinesthetic" ? "Can I ask you something, if you're up for it?" : guide.system === "visual" ? "May I ask you something? I think I see something." : guide.system === "auditory" ? "May I ask you something? Something in how you said that." : "May I ask you something?";
    const say = timing.silenceMs >= REFLECT_AFTER_MS ? `${opener} ${gist(last)}. ${ask}` : ask;
    return { reading, timing, intervention: { kind: "ask-permission", say, why: lb && lb.severity >= 2 ? `${lb.name.toLowerCase()} in "${lb.match}"` : state.awayFromSpiral ? "an away-from spiral with negative valence" : `pattern #${patterns[0].id} fits (${patterns[0].because.join(", ")})`, afterMs: 200, permission: "asked" } };
  }

  // 8. A plain reflection after a longer pause; otherwise keep listening.
  if (timing.silenceMs >= REFLECT_AFTER_MS) {
    return { reading, timing, intervention: { kind: "reflect", say: `${opener} ${gist(last)}.`, why: "a pause after they spoke; reflecting in their own system", afterMs: 0, permission } };
  }
  return { reading, timing, intervention: { kind: "listen", say: null, why: "short pause; letting them continue", afterMs: REFLECT_AFTER_MS - timing.silenceMs, permission } };
}

function chooseQuestion(reading: CompanionReading, guide: LanguagingGuide): { kind: InterventionKind; say: string; why: string; question?: string; pattern?: Intervention["pattern"] } {
  const lb = loadBearing(reading.metaModel);
  // #8 is the pattern interrupt: used by the loop branch, never offered as an exercise.
  const offerable = reading.patterns.find(p => p.offerable && p.id !== 8);
  // A load-bearing distortion gets the recovery question, phrased for the system.
  if (lb && lb.severity >= 2 && (!offerable || offerable.score < 6 || lb.severity === 3)) {
    let q = lb.challenge;
    if (lb.pattern === "complexEquivalence" || lb.pattern === "causeEffect") {
      const som = sleightOfMouthLines(lb, reading.last);
      const counter = som.find(s => s.key === "counterExample");
      if (counter) q = counter.line;
    }
    return { kind: "question", say: q, why: `${lb.name.toLowerCase()}: ${lb.why}`, question: q };
  }
  if (reading.state.awayFromSpiral) {
    const q = guide.system === "visual" ? "You've painted what you don't want very clearly. If you looked at the picture of what you do want instead, what's in it?" : guide.system === "kinesthetic" ? "You know exactly what you want to get away from. What would you want to move toward instead; what would that feel like?" : "You've said what you don't want. What do you want instead?";
    return { kind: "question", say: q, why: "away-from spiral: turning toward an outcome (Sourcebook #1)", question: q };
  }
  if (offerable) {
    return { kind: "offer-pattern", say: offerable.invitation, why: `offering #${offerable.id} ${offerable.name} (${offerable.because.join(", ")})`, question: offerable.invitation, pattern: { id: offerable.id, name: offerable.name, invitation: offerable.invitation, steps: offerable.steps } };
  }
  const q = lb ? lb.challenge : guide.exampleQuestion;
  return { kind: "question", say: q, why: lb ? lb.name.toLowerCase() : "an open question in their system", question: q };
}

// ─── Prompt ──────────────────────────────────────────────────────────────────

/**
 * Everything the language model needs to phrase the companion's line in the
 * person's own system, with the decision already made in code.
 */
export function companionPromptBlock(out: CompanionOutput, edition: "public" | "clinical" = "public"): string {
  const r = out.reading;
  const st = r.state;
  const signalLine = st.signals.length ? `Recent body/tone signals (consented): ${st.signals.join("; ")}.` : "No body or tone signals (not consented or not available).";
  return [
    edition === "public"
      ? "COMPANION MODE (public wellness edition): you are a reflection and education companion, not a clinician. You never diagnose, assess or treat. You speak in the person's own sensory language, reflect before you ask, ask permission before you steer, and ask at most one question."
      : "COMPANION MODE (clinical edition): decision support for a licensed clinician's session; the clinician decides.",
    repSystemPromptBlock(r.rep),
    metaModelPromptBlock(r.metaModel),
    metaProgramsPromptBlock(r.metaPrograms),
    patternsPromptBlock(r.patterns, edition),
    `STATE: valence ${st.valence}, arousal ${st.arousal}${st.loop.ruminating ? `, a loop is running ("${st.loop.repeated[0]}")` : ""}${st.awayFromSpiral ? ", away-from spiral" : ""}. ${signalLine}`,
    `DECISION (made in code, do not override): ${out.intervention.kind} — ${out.intervention.why}. ${out.intervention.say ? `Say this, or a more natural version of it in the same system and at most the same length: "${out.intervention.say}"` : "Say nothing this turn."}`,
  ].join("\n\n");
}

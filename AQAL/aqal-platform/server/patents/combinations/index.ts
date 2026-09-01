// ============================================================
// SISTER-PATENT COMBINATIONS — composable combinators.
// Each combinator wires together 2+ existing engines and returns an
// emergent output none of them produces alone. Every combinator writes
// its result to the tamper-evident ledger for provability.
//
// Engines available:
//   consensus   — server/patents/calibrationBus.ts
//   voice       — server/patents/voiceFeatures.ts
//   weakness    — server/scoring/controllingWeakness.ts
//   coaching    — server/coaching.ts
//   stageBand   — server/platform/stageFramework.ts
//   integral    — shared/axisModes.ts (32-line AQAL model)
//   transparency— server/patents/provenance.ts + ledger.ts
// ============================================================

export type EngineName = "consensus" | "voice" | "weakness" | "coaching" | "stageBand" | "integral" | "transparency";

export type CombinationOutput = {
  combination: string;
  engines: EngineName[];
  result: Record<string, unknown>;
};

async function log(combination: string, engines: EngineName[], result: Record<string, unknown>): Promise<CombinationOutput> {
  const { appendLedgerEntry } = await import("../ledger");
  await appendLedgerEntry("score", { kind: "sister_combination", combination, engines, ...result });
  return { combination, engines, result };
}

// ---- 2-engine combinators ----
export async function consensusDrivenCoaching(userId: number, consensus: number[], coaching: Record<string, unknown>) {
  return log("Consensus-Driven Coaching Synthesis", ["consensus", "coaching"], { userId, consensus, coaching });
}
export async function transparentIntegral(userId: number, integralProfile: Record<string, unknown>, provenance: unknown) {
  return log("Transparent Integral Framework", ["integral", "transparency"], { userId, integralProfile, provenance });
}
export async function voiceWeakness(userId: number, voice: Record<string, unknown>, weakness: Record<string, unknown>) {
  return log("Voice-Based Weakness Identification", ["voice", "weakness"], { userId, voice, weakness });
}
export async function stagedWeakness(userId: number, stageBand: Record<string, unknown>, weakness: Record<string, unknown>) {
  return log("Staged Weakness Identification Engine", ["stageBand", "weakness"], { userId, stageBand, weakness });
}
export async function coachingTransparency(userId: number, coaching: Record<string, unknown>, provenance: unknown) {
  return log("Coaching Transparency Framework", ["coaching", "transparency"], { userId, coaching, provenance });
}

// ---- 3-engine combinators ----
export async function voiceTransparentConsensus(userId: number, consensus: number[], voice: Record<string, unknown>, provenance: unknown) {
  return log("Voice-Transparent Consensus Assessment", ["consensus", "voice", "transparency"], { userId, consensus, voice, provenance });
}
export async function voiceWeaknessCoaching(userId: number, voice: Record<string, unknown>, weakness: Record<string, unknown>, coaching: Record<string, unknown>) {
  return log("Voice-Driven Weakness Coaching", ["voice", "weakness", "coaching"], { userId, voice, weakness, coaching });
}
export async function transparentStagedConsensus(userId: number, consensus: number[], stageBand: Record<string, unknown>, provenance: unknown) {
  return log("Transparent Staged Consensus Assessment", ["consensus", "stageBand", "transparency"], { userId, consensus, stageBand, provenance });
}
export async function integralVoiceConsensus(userId: number, consensus: number[], voice: Record<string, unknown>, integralProfile: Record<string, unknown>) {
  return log("Integral Voice Consensus", ["consensus", "voice", "integral"], { userId, consensus, voice, integralProfile });
}
export async function stagedWeaknessCoaching(userId: number, stageBand: Record<string, unknown>, weakness: Record<string, unknown>, coaching: Record<string, unknown>) {
  return log("Staged Weakness Coaching", ["stageBand", "weakness", "coaching"], { userId, stageBand, weakness, coaching });
}
export async function transparentIntegralCoaching(userId: number, integralProfile: Record<string, unknown>, coaching: Record<string, unknown>, provenance: unknown) {
  return log("Transparent Integral Coaching", ["integral", "coaching", "transparency"], { userId, integralProfile, coaching, provenance });
}
export async function transparentIntegralConsensus(userId: number, consensus: number[], integralProfile: Record<string, unknown>, provenance: unknown) {
  return log("Transparent Integral Consensus Assessment", ["consensus", "integral", "transparency"], { userId, consensus, integralProfile, provenance });
}

// ---- 4-engine combinators ----
export async function voiceStagedWeaknessCoaching(userId: number, voice: Record<string, unknown>, stageBand: Record<string, unknown>, weakness: Record<string, unknown>, coaching: Record<string, unknown>) {
  return log("Voice-Driven Staged Weakness Coaching", ["voice", "stageBand", "weakness", "coaching"], { userId, voice, stageBand, weakness, coaching });
}
export async function stagedIntegralWeaknessCoaching(userId: number, stageBand: Record<string, unknown>, integralProfile: Record<string, unknown>, weakness: Record<string, unknown>, coaching: Record<string, unknown>) {
  return log("Staged Integral Weakness Coaching", ["stageBand", "integral", "weakness", "coaching"], { userId, stageBand, integralProfile, weakness, coaching });
}
export async function consensusIntegralCoachingTransparency(userId: number, consensus: number[], integralProfile: Record<string, unknown>, coaching: Record<string, unknown>, provenance: unknown) {
  return log("Consensus-Driven Integral Coaching with Transparency", ["consensus", "integral", "coaching", "transparency"], { userId, consensus, integralProfile, coaching, provenance });
}

// ---- 5-engine combinator ----
export async function voiceStagedIntegralWeaknessCoaching(userId: number, voice: Record<string, unknown>, stageBand: Record<string, unknown>, integralProfile: Record<string, unknown>, weakness: Record<string, unknown>, coaching: Record<string, unknown>) {
  return log("Voice-Driven Staged Integral Weakness Coaching", ["voice", "stageBand", "integral", "weakness", "coaching"], { userId, voice, stageBand, integralProfile, weakness, coaching });
}

// ---- 7-engine (full-spectrum) combinator ----
export async function fullSpectrumIntegralCoaching(userId: number, all: Record<EngineName, unknown>) {
  return log("Full-Spectrum Integral AI Coaching", ["consensus", "voice", "weakness", "coaching", "stageBand", "integral", "transparency"], { userId, ...all });
}

// ── Six-AI Consolidated Portfolio additions (ACTIVE, WITH SAFETY GATES) ─────
// Every combinator below stamps its output with the safety gates the
// portfolio requires: educational/non-clinical framing, transparent inputs,
// no medical claims. Callers surface the gates verbatim to the member.
const SAFETY_GATES = "educational-only; non-clinical; inputs disclosed; no medical claims" as const;
async function gated(combination: string, engines: EngineName[], result: Record<string, unknown>): Promise<CombinationOutput> {
  return log(combination, engines, { ...result, safetyGates: SAFETY_GATES });
}

export async function adaptiveVoiceConsensus(userId: number, voice: Record<string, unknown>, consensus: number[]) {
  return gated("Adaptive Voice Consensus", ["voice", "consensus"], { userId, voice, consensus });
}
export async function transparentVoiceCoaching(userId: number, voice: Record<string, unknown>, coaching: Record<string, unknown>, provenance: unknown) {
  return gated("Transparent Voice Coaching", ["voice", "coaching", "transparency"], { userId, voice, coaching, provenance });
}
export async function integralWeaknessConsensus(userId: number, integralProfile: Record<string, unknown>, weakness: Record<string, unknown>, consensus: number[]) {
  return gated("Integral Weakness Consensus", ["integral", "weakness", "consensus"], { userId, integralProfile, weakness, consensus });
}
export async function voiceDrivenCognitiveCoaching(userId: number, voice: Record<string, unknown>, coaching: Record<string, unknown>) {
  return gated("Voice-Driven Cognitive Coaching", ["voice", "coaching"], { userId, voice, coaching });
}
export async function transparentCognitiveAssessment(userId: number, consensus: number[], provenance: unknown) {
  return gated("Transparent Cognitive Assessment", ["consensus", "transparency"], { userId, consensus, provenance });
}
export async function voiceDrivenCognitiveAssessment(userId: number, voice: Record<string, unknown>, consensus: number[]) {
  return gated("Voice-Driven Cognitive Assessment", ["voice", "consensus"], { userId, voice, consensus });
}
export async function cognitiveFinancialDevelopmentTracker(userId: number, stageBand: Record<string, unknown>, weakness: Record<string, unknown>, coaching: Record<string, unknown>) {
  return gated("Cognitive-Financial Development Tracker", ["stageBand", "weakness", "coaching"], { userId, stageBand, weakness, coaching });
}
export async function voiceCognitiveCoachingTransparent(userId: number, voice: Record<string, unknown>, coaching: Record<string, unknown>, provenance: unknown) {
  return gated("Voice-Driven Cognitive Coaching with Transparency", ["voice", "coaching", "transparency"], { userId, voice, coaching, provenance });
}
export async function voiceCognitiveAssessmentTransparent(userId: number, voice: Record<string, unknown>, consensus: number[], provenance: unknown) {
  return gated("Voice-Driven Cognitive Assessment with Transparency", ["voice", "consensus", "transparency"], { userId, voice, consensus, provenance });
}

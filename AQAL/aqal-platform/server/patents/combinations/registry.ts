// ============================================================
// SISTER-PATENT COMBINATIONS REGISTRY
// Maps the ACTIVE sister-patent combinations to the engines they
// combine and the combinator that produces them — the single source
// of truth the filings reference. Ids 1-17 are the original sister
// set; ids 18-38 (sparse) follow the Six-AI Consolidated Portfolio
// (JQ numbering), which marked them ACTIVE WITH SAFETY GATES:
// educational/non-clinical outputs, transparency of inputs, no
// medical claims. The portfolio's 22 cross-company ideas remain
// DEFERRED and are intentionally absent here.
// ============================================================
import type { EngineName } from "./index";

export type SisterCombination = {
  id: number;
  name: string;
  engines: EngineName[];
  combinator: string; // exported function name in ./index
};

export const SISTER_COMBINATIONS: SisterCombination[] = [
  { id: 1,  name: "Consensus-Driven Coaching Synthesis",                 engines: ["consensus", "coaching"],                          combinator: "consensusDrivenCoaching" },
  { id: 2,  name: "Transparent Integral Framework",                      engines: ["integral", "transparency"],                       combinator: "transparentIntegral" },
  { id: 3,  name: "Voice-Based Weakness Identification",                 engines: ["voice", "weakness"],                              combinator: "voiceWeakness" },
  { id: 4,  name: "Voice-Transparent Consensus Assessment",              engines: ["consensus", "voice", "transparency"],             combinator: "voiceTransparentConsensus" },
  { id: 5,  name: "Staged Weakness Identification Engine",               engines: ["stageBand", "weakness"],                          combinator: "stagedWeakness" },
  { id: 6,  name: "Coaching Transparency Framework",                     engines: ["coaching", "transparency"],                       combinator: "coachingTransparency" },
  { id: 7,  name: "Voice-Driven Weakness Coaching",                      engines: ["voice", "weakness", "coaching"],                  combinator: "voiceWeaknessCoaching" },
  { id: 8,  name: "Transparent Staged Consensus Assessment",             engines: ["consensus", "stageBand", "transparency"],         combinator: "transparentStagedConsensus" },
  { id: 9,  name: "Integral Voice Consensus",                            engines: ["consensus", "voice", "integral"],                 combinator: "integralVoiceConsensus" },
  { id: 10, name: "Staged Weakness Coaching",                            engines: ["stageBand", "weakness", "coaching"],              combinator: "stagedWeaknessCoaching" },
  { id: 11, name: "Transparent Integral Coaching",                       engines: ["integral", "coaching", "transparency"],           combinator: "transparentIntegralCoaching" },
  { id: 12, name: "Voice-Driven Staged Weakness Coaching",               engines: ["voice", "stageBand", "weakness", "coaching"],     combinator: "voiceStagedWeaknessCoaching" },
  { id: 13, name: "Transparent Integral Consensus Assessment",           engines: ["consensus", "integral", "transparency"],          combinator: "transparentIntegralConsensus" },
  { id: 14, name: "Staged Integral Weakness Coaching",                   engines: ["stageBand", "integral", "weakness", "coaching"],  combinator: "stagedIntegralWeaknessCoaching" },
  { id: 15, name: "Consensus-Driven Integral Coaching with Transparency",engines: ["consensus", "integral", "coaching", "transparency"], combinator: "consensusIntegralCoachingTransparency" },
  { id: 16, name: "Voice-Driven Staged Integral Weakness Coaching",      engines: ["voice", "stageBand", "integral", "weakness", "coaching"], combinator: "voiceStagedIntegralWeaknessCoaching" },
  { id: 17, name: "Full-Spectrum Integral AI Coaching",                  engines: ["consensus", "voice", "weakness", "coaching", "stageBand", "integral", "transparency"], combinator: "fullSpectrumIntegralCoaching" },
  // ── Six-AI Consolidated Portfolio additions (ACTIVE, WITH SAFETY GATES) ──
  { id: 18, name: "Adaptive Voice Consensus",                             engines: ["voice", "consensus"],                             combinator: "adaptiveVoiceConsensus" },
  { id: 19, name: "Transparent Voice Coaching",                           engines: ["voice", "coaching", "transparency"],              combinator: "transparentVoiceCoaching" },
  { id: 20, name: "Integral Weakness Consensus",                          engines: ["integral", "weakness", "consensus"],              combinator: "integralWeaknessConsensus" },
  { id: 27, name: "Voice-Driven Cognitive Coaching",                      engines: ["voice", "coaching"],                              combinator: "voiceDrivenCognitiveCoaching" },
  { id: 28, name: "Transparent Cognitive Assessment",                     engines: ["consensus", "transparency"],                      combinator: "transparentCognitiveAssessment" },
  { id: 30, name: "Voice-Driven Cognitive Assessment",                    engines: ["voice", "consensus"],                             combinator: "voiceDrivenCognitiveAssessment" },
  { id: 34, name: "Cognitive-Financial Development Tracker",              engines: ["stageBand", "weakness", "coaching"],              combinator: "cognitiveFinancialDevelopmentTracker" },
  { id: 36, name: "Voice-Driven Cognitive Coaching with Transparency",    engines: ["voice", "coaching", "transparency"],              combinator: "voiceCognitiveCoachingTransparent" },
  { id: 38, name: "Voice-Driven Cognitive Assessment with Transparency",  engines: ["voice", "consensus", "transparency"],             combinator: "voiceCognitiveAssessmentTransparent" },
];

export function getCombination(id: number): SisterCombination | undefined {
  return SISTER_COMBINATIONS.find((c) => c.id === id);
}

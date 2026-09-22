/**
 * Bridge: meta-program readings (shared/nlp/metaPrograms.ts) → Wealth Genome
 * durability signals (shared/engines/wealthGenomeDurability.ts).
 *
 * The durability engine already knows which six meta-programs bear on the
 * four durability axes (META_PROGRAM_LINKS) and marks anything read from a
 * framework as `inferred`, the weakest evidence kind. This module only maps
 * this catalog's keys onto those links, so a live reading of how a person
 * sorts (from the companion or the AI chat) becomes weak, honestly labelled
 * evidence about what a financial strategy would demand of them.
 *
 * Nothing here is a measurement of the person, and a durability reading is
 * never a reason to decline to serve anyone (the engine's own rule).
 */

import { buildGenome, META_PROGRAM_LINKS, signalFromMetaProgram, wealthGenomeReport, type Genome, type GenomeReport, type Signal } from "../engines/wealthGenomeDurability";
import type { MetaProgramReading } from "./metaPrograms";

/** Link id → this catalog's key and the pole keys in the link's pole order. */
const LINK_KEYS: Record<number, { key: string; poles: readonly [string, string] }> = {
  8: { key: "perceptualDurability", poles: ["permeable", "impermeable"] },
  7: { key: "scenario", poles: ["bestCase", "worstCase"] },
  14: { key: "referenceFrame", poles: ["internal", "external"] },
  1: { key: "chunkSize", poles: ["global", "specific"] },
  20: { key: "direction", poles: ["toward", "awayFrom"] },
  27: { key: "responsibility", poles: ["over", "under"] },
};

export interface BridgedSignal { signal: Signal; program: string; pole: string; confidence: number }

/** Signals for every linked program that read with at least `minConfidence`. */
export function signalsFromMetaProgramReadings(readings: readonly MetaProgramReading[], minConfidence = 0.3, asOfYear?: number): BridgedSignal[] {
  const out: BridgedSignal[] = [];
  for (const link of META_PROGRAM_LINKS) {
    const map = LINK_KEYS[link.id];
    if (!map) continue;
    const r = readings.find(x => x.key === map.key);
    if (!r || !r.leading || r.confidence < minConfidence) continue;
    const poleIndex = map.poles.indexOf(r.leading.key);
    if (poleIndex !== 0 && poleIndex !== 1) continue; // e.g. a "balanced" responsibility reading has no link pole
    const note = `heard ${r.leading.evidence.map(e => `"${e}"`).join(", ")} (confidence ${r.confidence})`;
    out.push({ signal: signalFromMetaProgram(link, poleIndex as 0 | 1, note, asOfYear), program: r.name, pole: r.leading.label, confidence: r.confidence });
  }
  return out;
}

export function genomeFromMetaPrograms(readings: readonly MetaProgramReading[], currentYear = new Date().getFullYear()): { genome: Genome; bridged: BridgedSignal[] } {
  const bridged = signalsFromMetaProgramReadings(readings, 0.3, currentYear);
  return { genome: buildGenome(bridged.map(b => b.signal), currentYear), bridged };
}

/** The full report (strategy fits, next best question) from readings plus any other signals already on file. */
export function genomeReportFromMetaPrograms(readings: readonly MetaProgramReading[], otherSignals: readonly Signal[] = [], currentYear = new Date().getFullYear()): GenomeReport {
  const bridged = signalsFromMetaProgramReadings(readings, 0.3, currentYear);
  return wealthGenomeReport([...otherSignals, ...bridged.map(b => b.signal)], currentYear);
}

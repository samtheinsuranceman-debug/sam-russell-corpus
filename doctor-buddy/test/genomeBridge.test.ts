import { describe, expect, it } from "vitest";
import { readMetaPrograms } from "@shared/nlp/metaPrograms";
import { genomeFromMetaPrograms, genomeReportFromMetaPrograms, signalsFromMetaProgramReadings } from "@shared/nlp/genomeBridge";
import { META_PROGRAM_LINKS } from "@shared/engines/wealthGenomeDurability";

describe("meta-programs → Wealth Genome bridge", () => {
  it("turns linked readings into inferred signals and nothing else", () => {
    const readings = readMetaPrograms([
      "Worst case it all goes wrong, it's going to be a disaster, I just know it.",
      "What do you think? Everyone says I should, my wife said so, am I doing this right?",
      "Basically the big picture is what matters, overall, in general.",
      "I want to build something, my goal is to reach it, so that I can grow.",
    ]);
    const bridged = signalsFromMetaProgramReadings(readings);
    expect(bridged.length).toBeGreaterThanOrEqual(3);
    for (const b of bridged) {
      expect(b.signal.kind).toBe("inferred");
      expect(b.signal.note).toMatch(/Meta-program #\d+/);
      expect(b.signal.note).toMatch(/not a measurement/);
      expect(META_PROGRAM_LINKS.some(l => l.axis === b.signal.axis)).toBe(true);
    }
    expect(bridged.some(b => b.program === "Scenario thinking" && b.pole === "Worst case")).toBe(true);
    expect(bridged.some(b => b.program.startsWith("Frame of reference") && b.pole === "External")).toBe(true);
  });
  it("builds a genome that stays honest about thin evidence", () => {
    const { genome, bridged } = genomeFromMetaPrograms(readMetaPrograms("Worst case it all goes wrong, disaster, I just know it, bound to."));
    expect(bridged.length).toBeGreaterThanOrEqual(1);
    expect(bridged.some(b => b.program === "Scenario thinking")).toBe(true);
    expect(genome.coverage).toBeLessThan(0.5);
    expect(genome.unassessed.length).toBeGreaterThanOrEqual(3);
    expect(genome.readings.emotional.strongestEvidence === null || genome.readings.emotional.strongestEvidence === "inferred").toBe(true);
  });
  it("skips the balanced responsibility pole and empty readings", () => {
    expect(signalsFromMetaProgramReadings(readMetaPrograms("My part was small, we both did it, I own that."))).toEqual([]);
    expect(signalsFromMetaProgramReadings(readMetaPrograms([]))).toEqual([]);
    const report = genomeReportFromMetaPrograms(readMetaPrograms([]));
    expect(report.genome.coverage).toBe(0);
    expect(report.disclaimer.length).toBeGreaterThan(20);
  });
});

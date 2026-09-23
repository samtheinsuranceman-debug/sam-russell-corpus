/**
 * Provenance ratchet — the census's lists only shrink (board row 19, D46).
 *
 * The census is measured from the tree on every run. Each list is compared
 * with its allow-list in shared/provenanceRatchet.ts both ways: a new
 * unsourced engine, a new unseeded simulation or a new page printing no
 * source fails the build; a fixed one left on the list fails it too, so the
 * list stays the true remaining work.
 */
import { describe, expect, it } from "vitest";
import { resolve } from "node:path";
import { censusTree } from "./_core/provenanceCensus";
import {
  CATALOGUE_ENGINES_WITHOUT_SHELL_SOURCES,
  PAGES_PRINTING_NO_SOURCE,
  UNSEEDED_RANDOM_ENGINES,
  ZERO_SOURCE_ENGINES,
} from "../shared/provenanceRatchet";

const root = resolve(__dirname, "..");
const census = censusTree(root);

function ratchet(name: string, measured: readonly string[], allowed: readonly string[]) {
  const allow = new Set(allowed);
  const seen = new Set(measured);
  const newFailures = measured.filter(m => !allow.has(m));
  const stale = allowed.filter(a => !seen.has(a));
  expect(newFailures, `${name}: new entries the census found that are not on the allow-list. Source them, or add them with a reason.`).toEqual([]);
  expect(stale, `${name}: allow-list entries that no longer fail. Remove them from shared/provenanceRatchet.ts so the list stays true.`).toEqual([]);
}

describe("provenance census: the tree is measured, not described", () => {
  it("censuses every catalogue and memory-bank engine and finds each on disk", () => {
    expect(census.summary.engines).toBeGreaterThan(80);
    expect(census.summary.enginesMissingOnDisk).toEqual([]);
  });

  it("counts an exported *_SOURCES constant as a source", () => {
    const power = census.rows.find(r => r.engine === "shared/powerHistory.ts")!;
    expect(power.sourceExports).toContain("POWER_HISTORY_SOURCES");
    expect(power.sources.length).toBeGreaterThan(0);
  });

  it("credits the shell's source footer to every catalogue page whose engine has a loader", () => {
    const longevity = census.rows.find(r => r.engine === "shared/longevityEngine.ts")!;
    expect(longevity.shellSourced).toBe(true);
    // A page importing it counts as sourced through the shell even if the page file prints nothing itself.
    if (longevity.pages.length) expect(longevity.provenanceOnPage).toBe(true);
  });
});

describe("provenance ratchet: the allow-lists only shrink", () => {
  it("engines with zero sources", () => {
    ratchet("zero-source engines", census.summary.lists.enginesWithZeroSources, ZERO_SOURCE_ENGINES);
  });

  it("engines with unseeded randomness", () => {
    ratchet("unseeded engines", census.summary.lists.enginesWithUnseededRandomness, UNSEEDED_RANDOM_ENGINES);
    // D47: the one figure a client could see (retirementDNA cohortSize) is deterministic now.
    expect(UNSEEDED_RANDOM_ENGINES).not.toContain("shared/retirementDNA.ts");
  });

  it("catalogue engines the shell cannot print sources for", () => {
    ratchet("catalogue engines without shell sources", census.summary.lists.enginesWithoutShellSources, CATALOGUE_ENGINES_WITHOUT_SHELL_SOURCES);
  });

  it("pages that import an engine and print no source", () => {
    ratchet("pages printing no source", census.summary.lists.pagesImportingAnEngineWithNoProvenanceOnPage, PAGES_PRINTING_NO_SOURCE);
  });
});

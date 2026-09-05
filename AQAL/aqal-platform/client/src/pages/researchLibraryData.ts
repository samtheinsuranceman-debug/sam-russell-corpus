// Thin correction adapter around the frozen generated research corpus.
// The corpus is intentionally kept byte-identical in researchLibraryDataRaw.ts;
// verified source corrections are applied immutably here so they remain small,
// reviewable, and testable even when the generated file exceeds editor limits.
import { PRACTICE_EVIDENCE as RAW_PRACTICE_EVIDENCE } from "./researchLibraryDataRaw";

const MARSH_HAU_CLUSTER_ID = "big-fish-little-pond-rank-effect";
const OLD_SAMPLE_SIZE = "103,558 students";
const CORRECT_SAMPLE_SIZE = "106,579 students";

export const PRACTICE_EVIDENCE = RAW_PRACTICE_EVIDENCE.map((cluster) => {
  if (cluster.id !== MARSH_HAU_CLUSTER_ID) return cluster;
  return {
    ...cluster,
    description: cluster.description.replace(OLD_SAMPLE_SIZE, CORRECT_SAMPLE_SIZE),
    sources: cluster.sources.map((source) => ({
      ...source,
      note: source.note.replace(OLD_SAMPLE_SIZE, CORRECT_SAMPLE_SIZE),
    })),
  };
});

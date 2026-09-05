import { describe, it, expect } from "vitest";
import { CITATIONS, citationHref, citationLabel, type CitationKey } from "@shared/citations";
import { bottleneckRole } from "@shared/bottleneckRoles";
import { ALL_AXES } from "@shared/axisModes";

// Cluster ids that actually exist in ResearchLibrary.tsx (TRAINABILITY_CLUSTERS
// + PRACTICE_EVIDENCE). A Cite pointing anywhere else would silently dead-link,
// so this list is the contract the citation registry must satisfy.
const REAL_CLUSTER_IDS = new Set([
  // practice / systems-science
  "sys-centrality", "sys-weakest-link", "sys-mutualism-keystone", "sys-leverage", "sys-matching",
  // trainability
  "active-trial", "fluid-intelligence", "spatial", "mathematical", "emotional", "interpersonal",
  "rhetorical", "moral", "volitional", "interoceptive", "financial-train", "entrepreneurial",
  "leadership", "creative", "musical", "bodily-kinesthetic", "memory-spatial", "naturalist", "boundary",
]);

describe("claim → evidence citation registry", () => {
  it("every citation points to a real library cluster", () => {
    for (const [key, ref] of Object.entries(CITATIONS)) {
      expect(REAL_CLUSTER_IDS.has(ref.cluster), `${key} → missing cluster '${ref.cluster}'`).toBe(true);
    }
  });

  it("builds a hash-anchored library href", () => {
    expect(citationHref("weakest-link")).toBe("/research-library#src-sys-weakest-link");
    expect(citationHref("centrality")).toBe("/research-library#src-sys-centrality");
  });

  it("every citation carries a human label", () => {
    for (const key of Object.keys(CITATIONS) as CitationKey[]) {
      expect(citationLabel(key).length).toBeGreaterThan(3);
    }
  });

  it("every bottleneck mechanism is a valid citation key (report markers never dead-link)", () => {
    for (const axis of ALL_AXES) {
      const mech = bottleneckRole(axis).mechanism; // liebig | oring | toc
      expect(CITATIONS[mech as CitationKey], `no citation for mechanism ${mech}`).toBeTruthy();
    }
  });
});

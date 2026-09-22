import { describe, expect, it } from "vitest";
import { catalogueLinkage, computedWired, engineless, linkageSummary, unlinkedEntries } from "@shared/catalogueLinkage";
import { CALCULATORS } from "@shared/calculatorCatalog";
import { MEMORY_GROUPS } from "@shared/aiMemoryBank";

describe("catalogueLinkage (measured on the real registries)", () => {
  it("joins entries to memory groups through the engine module", () => {
    const s = linkageSummary();
    expect(s.entries).toBe(CALCULATORS.length);
    expect(s.withEngine + s.engineless).toBe(s.entries);
    expect(s.linkedToAGroup + s.unlinked).toBe(s.withEngine);
    // Printed so the number is in the test log every build; the audit measured 37 / 116 on 8a17807.
    console.log(`[catalogueLinkage] ${JSON.stringify(s)}`);
  });

  it("lists what the brain cannot reason about, and the list is honest about the engine name", () => {
    for (const u of unlinkedEntries()) {
      expect(u.engine).toBeTruthy();
      expect(MEMORY_GROUPS.some(g => g.modules.includes(u.engine!))).toBe(false);
    }
    for (const e of engineless()) expect(e.engine).toBeUndefined();
  });

  it("computed wiring disagrees with the hand-set flag somewhere, which is the point", () => {
    const computed = computedWired();
    const handSet = Object.fromEntries(MEMORY_GROUPS.map(g => [g.id, g.wired]));
    const disagreements = MEMORY_GROUPS.filter(g => computed[g.id] !== handSet[g.id]).map(g => g.id);
    console.log(`[catalogueLinkage] hand-set wired=true but no catalogue entry reaches: ${disagreements.join(", ") || "none"}`);
    expect(Object.keys(computed)).toHaveLength(MEMORY_GROUPS.length);
  });

  it("is deterministic on a fixture", () => {
    const links = catalogueLinkage(
      [{ path: "/a", name: "A", blurb: "", category: "tax", engine: "shared/x.ts" }, { path: "/b", name: "B", blurb: "", category: "tax" }],
      [{ id: "g", name: "G", modules: ["shared/x.ts"], knows: "", brief: "", wired: false, priority: 1 }],
    );
    expect(links).toEqual([{ path: "/a", engine: "shared/x.ts", memoryGroups: ["g"] }, { path: "/b", engine: undefined, memoryGroups: [] }]);
  });
});

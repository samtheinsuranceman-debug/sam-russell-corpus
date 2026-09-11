import { describe, expect, it } from "vitest";
import { PRACTICE_EVIDENCE } from "./researchLibraryData";
import { PRACTICE_EVIDENCE as RAW } from "./researchLibraryDataRaw";
import { LONGEVITY_EVIDENCE, LONGEVITY_SECTIONS, LONGEVITY_SECTION_ORDER, LONGEVITY_SECTION_SHORT } from "./researchLibraryLongevity";
import { KEYSTONE_PRACTICES, practicesForGoals } from "../../../shared/keystonePractices";
import { templateForGoal } from "../../../shared/goalTemplates";
import { GOAL_KEYWORDS } from "../../../shared/seo";
import { GOAL_EVIDENCE } from "../../../shared/goalShelves/index";

// The longevity shelf's verification contract, enforced: every source is a
// resolvable DOI (no Scholar fallbacks), every cluster sits in a registered
// section, hype is rated at the floor, and the goal path reaches the shelf.
describe("healthy aging & longevity shelf", () => {
  it("carries a substantial, DOI-only source ledger", () => {
    expect(LONGEVITY_EVIDENCE.length).toBeGreaterThanOrEqual(60);
    const sources = LONGEVITY_EVIDENCE.flatMap((c) => c.sources);
    expect(sources.length).toBeGreaterThanOrEqual(140);
    for (const s of sources) {
      expect(s.kind).toBe("doi");
      expect(s.link).toMatch(/^https:\/\/doi\.org\/10\.\d{4,9}\/\S+$/);
      expect(s.cite.length).toBeGreaterThan(40);
      expect(s.note.length).toBeGreaterThan(20);
    }
  });

  it("uses unique ids that do not collide with the frozen corpus", () => {
    const ids = LONGEVITY_EVIDENCE.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    const raw = new Set(RAW.map((c) => c.id));
    for (const id of ids) expect(raw.has(id), id).toBe(false);
    for (const id of ids) expect(id.startsWith("lv-"), id).toBe(true);
  });

  it("registers every section with a long and a short label, in order", () => {
    for (const c of LONGEVITY_EVIDENCE) {
      expect(LONGEVITY_SECTIONS[c.section], c.section).toBeDefined();
      expect(LONGEVITY_SECTION_SHORT[c.section], c.section).toBeDefined();
      expect(LONGEVITY_SECTION_ORDER).toContain(c.section);
      expect(Number(c.section)).toBeGreaterThanOrEqual(7000);
    }
    for (const key of LONGEVITY_SECTION_ORDER) expect(LONGEVITY_SECTIONS[key]).toMatch(new RegExp(`^${key} · Longevity`));
  });

  it("is merged into the library corpus after the frozen entries, before the goal shelves", () => {
    expect(PRACTICE_EVIDENCE.length).toBe(RAW.length + LONGEVITY_EVIDENCE.length + GOAL_EVIDENCE.length);
    expect(PRACTICE_EVIDENCE.slice(RAW.length, RAW.length + LONGEVITY_EVIDENCE.length).map((c) => c.id)).toEqual(LONGEVITY_EVIDENCE.map((c) => c.id));
    expect(PRACTICE_EVIDENCE.slice(RAW.length + LONGEVITY_EVIDENCE.length).map((c) => c.id)).toEqual(GOAL_EVIDENCE.map((c) => c.id));
  });

  it("rates every cluster and puts the unsupported claims at the floor with a callout", () => {
    const floor = LONGEVITY_EVIDENCE.filter((c) => c.impact?.magnitude === 1);
    expect(floor.map((c) => c.id).sort()).toEqual([
      "lv-antioxidant-megadose-resveratrol",
      "lv-aspirin-aspree",
      "lv-testosterone-gh-dhea",
      "lv-vitamin-d-trials",
      "lv-young-blood-plasma-hbot-stemcell-clinics",
    ]);
    for (const c of floor) expect(c.callout, c.id).toBeTruthy();
    for (const c of LONGEVITY_EVIDENCE) expect(c.impact, c.id).toBeDefined();
    // Animal-only work never carries a Strong tag.
    for (const c of LONGEVITY_EVIDENCE) {
      if (/animal only|in mice/i.test(c.title)) expect(c.evidenceTag, c.id).toBe("Emerging");
    }
  });

  it("is reachable from a member's longevity goal", () => {
    const tpl = templateForGoal("I want to live longer and healthier, to 100");
    expect(tpl.key).toBe("longevity");
    const practices = practicesForGoals("live longer, anti-aging, healthspan");
    const ids = practices.map((p) => p.id);
    for (const id of ["longevity-fitness", "longevity-strength", "longevity-lipids", "longevity-pressure", "longevity-sleep-steps"]) {
      expect(ids).toContain(id);
    }
    for (const p of KEYSTONE_PRACTICES.filter((p) => p.id.startsWith("longevity-"))) {
      expect(LONGEVITY_SECTIONS[p.section], p.id).toBeDefined();
    }
    expect(GOAL_KEYWORDS).toContain("longevity");
    expect(GOAL_KEYWORDS).toContain("live longer");
  });
});

import { describe, expect, it } from "vitest";
import { GOAL_EVIDENCE, GOAL_SECTIONS, GOAL_SECTION_ORDER, GOAL_SECTION_SHORT, GOAL_SECTION_GOAL, GOAL_SHELF_META, GOAL_SHELF_MODULES, shelfClusters } from "./goalShelves/index";
import { GOAL_TIERS } from "./goalShelves/types";
import { goalMenuForMonth, goalMenuForText, goalMenuLines, shelfForGoal } from "./goalProtocols";
import { templateForGoal } from "./goalTemplates";

// The goal shelves' contract, enforced: DOI-only sources, every cluster tiered
// with an action, sections registered under the shelf's base, floor-rated
// entries carry a callout, and the monthly menu is diverse and deterministic.
describe("goal shelves (sections 8000+)", () => {
  it("has fifteen shelves with distinct bases 100 apart", () => {
    expect(GOAL_SHELF_META.length).toBe(15);
    const bases = GOAL_SHELF_META.map((m) => m.base);
    expect(new Set(bases).size).toBe(bases.length);
    for (const m of GOAL_SHELF_META) expect(m.base % 100).toBe(0);
    for (const m of GOAL_SHELF_META) expect(m.base).toBeGreaterThanOrEqual(8000);
  });

  it("carries a DOI-only ledger with unique, prefixed ids", () => {
    const ids = GOAL_EVIDENCE.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of GOAL_EVIDENCE) {
      expect(c.id.startsWith(`gs-${c.goal}-`), c.id).toBe(true);
      expect(GOAL_TIERS).toContain(c.tier);
      expect(c.action.length, c.id).toBeGreaterThan(20);
      expect(c.impact, c.id).toBeDefined();
      if (c.impact?.magnitude === 1) expect(c.callout, c.id).toBeTruthy();
      if (!c.id.endsWith("-read-me-first")) expect(c.sources.length, c.id).toBeGreaterThanOrEqual(3);
      for (const s of c.sources) {
        expect(s.kind, c.id).toBe("doi");
        expect(s.link, c.id).toMatch(/^https:\/\/doi\.org\/10\.\d{4,9}\/\S+$/);
        expect(s.cite.length, c.id).toBeGreaterThan(40);
        expect(s.note.length, c.id).toBeGreaterThan(20);
      }
    }
  });

  it("registers every section under its shelf's base with long and short labels", () => {
    for (const m of GOAL_SHELF_META) {
      const mod = GOAL_SHELF_MODULES[m.key];
      for (const key of Object.keys(mod.SECTIONS)) {
        const n = Number(key);
        expect(n, key).toBeGreaterThanOrEqual(m.base);
        expect(n, key).toBeLessThan(m.base + 100);
        expect(GOAL_SECTIONS[key]).toMatch(new RegExp(`^${key} · ${m.short.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} — `));
        expect(GOAL_SECTION_SHORT[key]).toMatch(new RegExp(`^${m.short.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}: `));
        expect(GOAL_SECTION_ORDER).toContain(key);
        expect(GOAL_SECTION_GOAL[key]).toBe(m.key);
      }
      for (const c of mod.CLUSTERS) {
        expect(c.goal, c.id).toBe(m.key);
        expect(mod.SECTIONS[c.section], c.id).toBeDefined();
      }
      if (mod.CLUSTERS.length) expect(mod.SECTIONS[String(m.base)], m.key).toBeDefined();
    }
    expect(new Set(GOAL_SECTION_ORDER).size).toBe(GOAL_SECTION_ORDER.length);
  });

  it("every populated shelf spans all four tiers", () => {
    for (const m of GOAL_SHELF_META) {
      const cs = shelfClusters(m.key);
      if (cs.length < 8) continue; // stubs are allowed while a shelf is being researched
      for (const t of GOAL_TIERS) expect(cs.some((c) => c.tier === t), `${m.key}: ${t}`).toBe(true);
    }
  });

  it("selects a shelf from a stated goal and matches the goal template's intent", () => {
    expect(shelfForGoal("I want to be a better husband")).toBe("marriage");
    expect(shelfForGoal("get out of credit card debt")).toBe("debt");
    expect(shelfForGoal("buy a house for my family")).toBe("home");
    expect(shelfForGoal("")).toBeUndefined();
    expect(templateForGoal("get out of credit card debt").key).toBe("debt");
    expect(templateForGoal("I want to be happy").key).toBe("happiness");
  });

  it("builds a deterministic monthly menu with at most two picks per tier and never a floor-rated pick", () => {
    for (const m of GOAL_SHELF_META) {
      const cs = shelfClusters(m.key);
      if (cs.length < 8) continue;
      const a = goalMenuForMonth(m.key, new Date(Date.UTC(2026, 8, 15)));
      const b = goalMenuForMonth(m.key, new Date(Date.UTC(2026, 8, 28)));
      expect(a.picks.map((p) => p.id)).toEqual(b.picks.map((p) => p.id));
      expect(a.monthKey).toBe("2026-09");
      for (const t of GOAL_TIERS) {
        const n = a.picks.filter((p) => p.tier === t).length;
        expect(n, `${m.key}: ${t}`).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(2);
      }
      for (const p of a.picks) {
        expect(p.magnitude).toBeGreaterThan(1);
        expect(p.id.endsWith("-read-me-first")).toBe(false);
      }
      // The next month rotates within tiers that have more clusters than picks.
      const c = goalMenuForMonth(m.key, new Date(Date.UTC(2026, 9, 1)));
      const rotating = GOAL_TIERS.some((t) => cs.filter((x) => x.tier === t && x.impact!.magnitude > 1).length > 2);
      if (rotating) expect(c.picks.map((p) => p.id)).not.toEqual(a.picks.map((p) => p.id));
      expect(goalMenuLines(a)).toContain("[fundamental]");
    }
    const byText = goalMenuForText("be a better husband and father", new Date(Date.UTC(2026, 8, 1)));
    expect(byText?.goal).toBe("marriage");
  });
});

// ============================================================
// THE STANDING GUARANTEE, ENFORCED — every sitemap URL carries a
// unique short description under 60 characters. This test fails
// the build if a future page family forgets its branch in
// pageShorts.ts, which is what makes the upgrade automatic.
// ============================================================
import { describe, it, expect } from "vitest";
import { SITEMAP_PATHS } from "@shared/seo";
import { shortFor } from "./pageShorts";

describe("page short descriptions", () => {
  it("every sitemap page has one", () => {
    const missing = SITEMAP_PATHS.filter((p) => !shortFor(p));
    expect(missing).toEqual([]);
  });

  it("every one is under 60 characters", () => {
    const tooLong = SITEMAP_PATHS
      .map((p) => [p, shortFor(p) ?? ""] as const)
      .filter(([, s]) => s.length >= 60);
    expect(tooLong).toEqual([]);
  });

  it("every one is unique", () => {
    const seen = new Map<string, string>();
    const dupes: string[] = [];
    for (const p of SITEMAP_PATHS) {
      const s = shortFor(p)!;
      if (seen.has(s)) dupes.push(`${s} (${seen.get(s)} vs ${p})`);
      else seen.set(s, p);
    }
    expect(dupes).toEqual([]);
  });

  it("covers all 1,700+ pages", () => {
    expect(SITEMAP_PATHS.length).toBeGreaterThanOrEqual(1700);
  });
});

describe("myth museum sitemap sync", () => {
  it("MYTH_IDS mirror matches the museum exactly", async () => {
    const { MYTH_IDS } = await import("@shared/seo");
    const { MYTHS } = await import("./mythMuseum");
    expect(MYTH_IDS).toEqual(MYTHS.map((m) => m.id));
  });

  it("shared mirrors match their client sources (kinds, wings, verdicts, capacities)", async () => {
    const { KIND_IDS, WING_IDS, VERDICT_SLUGS, CAPACITY_ONLY_LINES, ENGINE_LINES, LINE_NAMES } = await import("@shared/seo");
    const { KIND_PROFILES } = await import("./therapyKinds");
    const { WING_PROFILES } = await import("./mythWings");
    const { MYTH_VERDICT_META } = await import("./mythMuseum");
    const { CAPACITY_AXES } = await import("./capacityAxes");
    expect([...KIND_IDS].sort()).toEqual(Object.keys(KIND_PROFILES).sort());
    expect([...WING_IDS].sort()).toEqual(Object.keys(WING_PROFILES).sort());
    expect([...VERDICT_SLUGS].sort()).toEqual(
      Object.keys(MYTH_VERDICT_META).map((v) => v.toLowerCase().replace(/ /g, "-")).sort(),
    );
    // Every capacity-only line has an authored axis, exists in the engine,
    // and is genuinely display-page-less.
    expect([...CAPACITY_ONLY_LINES].sort()).toEqual(Object.keys(CAPACITY_AXES).sort());
    for (const l of CAPACITY_ONLY_LINES) {
      expect(ENGINE_LINES).toContain(l);
      expect(LINE_NAMES).not.toContain(l);
    }
  });

  it("line and therapy meaning content covers every line and kind", async () => {
    const { LINE_NAMES, KIND_IDS } = await import("@shared/seo");
    const { LINE_MEANING } = await import("./lineMeaning");
    const { THERAPY_MEANING } = await import("./therapyMeaning");
    expect(LINE_NAMES.filter((n) => !(n in LINE_MEANING))).toEqual([]);
    expect(Object.keys(LINE_MEANING).filter((k) => !LINE_NAMES.includes(k))).toEqual([]);
    expect(KIND_IDS.filter((k) => !(k in THERAPY_MEANING))).toEqual([]);
    for (const m of Object.values(LINE_MEANING)) expect(m.personas.length).toBe(2);
  });

  it("every protocol kind has a full sub-page playbook", async () => {
    const { KIND_IDS } = await import("@shared/seo");
    const { KIND_PLAYBOOKS } = await import("./protocolSubpages");
    expect(KIND_IDS.filter((k) => !(k in KIND_PLAYBOOKS))).toEqual([]);
    for (const [id, p] of Object.entries(KIND_PLAYBOOKS)) {
      expect(KIND_IDS, `${id} is not a library kind`).toContain(id);
      expect(p.firstWeek.length, `${id} firstWeek`).toBeGreaterThanOrEqual(4);
      expect(p.mistakes.length, `${id} mistakes`).toBe(5);
      expect(p.results.length, `${id} results`).toBe(4);
      expect(p.caution.length, `${id} caution`).toBeGreaterThan(80);
    }
  });

  it("every exhibit belongs to a wing with a real profile", async () => {
    const { MYTHS } = await import("./mythMuseum");
    const { MYTH_WING, WING_PROFILES } = await import("./mythWings");
    const missing = MYTHS.filter((m) => !(m.id in MYTH_WING)).map((m) => m.id);
    expect(missing).toEqual([]);
    const badRefs = Object.entries(MYTH_WING).filter(([, w]) => !(w in WING_PROFILES));
    expect(badRefs).toEqual([]);
    const orphans = Object.keys(MYTH_WING).filter((k) => !MYTHS.some((m) => m.id === k));
    expect(orphans).toEqual([]);
  });
});

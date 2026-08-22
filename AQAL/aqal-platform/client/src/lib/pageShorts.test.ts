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
});

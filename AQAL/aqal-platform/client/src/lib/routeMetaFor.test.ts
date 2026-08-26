// ============================================================
// TITLE/DESCRIPTION HARD RULES, ENFORCED — search results lop
// titles at ~60 characters and descriptions at ~160, so every
// one of the 9,646 sitemap URLs must fit. This fails the build
// if any page family's formula (or any new page's static meta)
// runs long, which is what makes the guarantee automatic.
// ============================================================
import { describe, it, expect } from "vitest";
import { SITEMAP_PATHS, PAGE_META } from "@shared/seo";
import { routeMetaFor } from "./routeMetaFor";

describe("route meta", () => {
  it("every sitemap page resolves a title and description", () => {
    const missing = SITEMAP_PATHS.filter((p) => {
      const m = routeMetaFor(p);
      return !m || !m.title || !m.description;
    });
    expect(missing).toEqual([]);
  });

  it("every title is 60 characters or fewer", () => {
    const tooLong = SITEMAP_PATHS
      .map((p) => [p, routeMetaFor(p)?.title ?? ""] as const)
      .filter(([, t]) => t.length > 60);
    expect(tooLong).toEqual([]);
  });

  it("every title is unique", () => {
    const seen = new Map<string, string>();
    const dupes: string[] = [];
    for (const p of SITEMAP_PATHS) {
      const t = routeMetaFor(p)!.title;
      if (seen.has(t)) dupes.push(`${t} (${seen.get(t)} vs ${p})`);
      else seen.set(t, p);
    }
    expect(dupes).toEqual([]);
  });

  it("every description is 160 characters or fewer", () => {
    const tooLong = SITEMAP_PATHS
      .map((p) => [p, routeMetaFor(p)?.description ?? ""] as const)
      .filter(([, d]) => d.length > 160);
    expect(tooLong).toEqual([]);
  });

  it("static page descriptions sit in the 120–160 sweet spot", () => {
    const off = Object.entries(PAGE_META)
      .map(([p, m]) => [p, m.description.length] as const)
      .filter(([, n]) => n < 120 || n > 160);
    expect(off).toEqual([]);
  });
});

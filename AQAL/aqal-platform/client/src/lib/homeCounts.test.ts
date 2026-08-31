// The homepage "What's Inside" strip states hard numbers. This test makes
// each one build-enforced so the copy can never silently drift from reality.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SITEMAP_PATHS, ARCH_IDS } from "@shared/seo";
import { THERAPY_SCORES } from "@shared/therapyScores";

const homeSrc = readFileSync(join(__dirname, "..", "pages", "Home.tsx"), "utf-8");

describe("homepage what's-inside numbers", () => {
  it("page count in the strip equals the real sitemap size", () => {
    expect(SITEMAP_PATHS.length).toBe(11659);
    expect(homeSrc).toContain('"11,659"');
  });
  it("protocol count matches the ranked library", () => {
    expect(THERAPY_SCORES.length).toBe(156);
    expect(homeSrc).toContain('"156"');
  });
  it("archetype count matches the dossier library", () => {
    expect(ARCH_IDS.length).toBe(246);
    expect(homeSrc).toContain('"246"');
  });
});

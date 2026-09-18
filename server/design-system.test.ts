import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("unified visual system", () => {
  const landing = readFileSync(resolve("client/src/pages/Landing.tsx"), "utf8");
  const shell = readFileSync(resolve("client/src/components/AppShell.tsx"), "utf8");
  const css = readFileSync(resolve("client/src/index.css"), "utf8");

  it("uses a persistent high-resolution city hero instead of the broken external URL", () => {
    expect(landing).toContain('/rcs-neon-a.webp'); // persisted local hero, not an external URL
    expect(landing).not.toMatch(/https?:\/\/[^"']+\.(png|jpg|jpeg|webp)/);
    expect(landing).not.toContain("d2xsxph8kpxj0f.cloudfront.net");
    // the imagery ships with the app — every homepage image is a repo file
    for (const file of ["rcs-neon-a", "rcs-neon-b", "rcs-city-emerald", "rcs-city-bridge", "rcs-city-canyon", "rcs-city-interchange"]) {
      expect(existsSync(resolve(`client/public/${file}.webp`)), file).toBe(true);
    }
  });

  it("preserves the homepage emerald lighting and dark readability masks", () => {
    expect(landing).toContain("rgba(16,185,129,");
    expect(landing).toContain("rgba(3,9,10,"); // dark readability shades over the crisp imagery
    expect(landing).toContain("text-emerald-300");
  });

  it("scopes the emerald portal theme to AppShell interiors, with no purple left anywhere", () => {
    expect(shell).toContain('className="rc-portal-theme min-h-screen relative"');
    expect(css).toContain(".rc-portal-theme {");
    expect(css).toContain("--primary: oklch(0.67 0.22 160)");
    expect(css).toContain("linear-gradient(135deg, #059669, #10b981 58%, #34d399)");
    expect(css).not.toMatch(/#7c3aed|#8b5cf6|#a78bfa|violet|purple/i);
    expect(landing).not.toContain("rc-portal-theme");
  });
});

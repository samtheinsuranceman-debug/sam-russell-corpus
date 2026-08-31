import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("unified visual system", () => {
  const landing = readFileSync(resolve("client/src/pages/Landing.tsx"), "utf8");
  const shell = readFileSync(resolve("client/src/components/AppShell.tsx"), "utf8");
  const css = readFileSync(resolve("client/src/index.css"), "utf8");

  it("uses a persistent high-resolution city hero instead of the broken external URL", () => {
    expect(landing).toContain('/manus-storage/rcs-concept-16-clean-background_a6ddebf1.png');
    expect(landing).not.toContain("d2xsxph8kpxj0f.cloudfront.net");
    expect(existsSync("/home/ubuntu/webdev-static-assets/rcs-concept-16-clean-background.png")).toBe(true);
  });

  it("preserves the homepage emerald lighting and dark readability masks", () => {
    expect(landing).toContain("rgba(16,185,129,.17)");
    expect(landing).toContain("rgba(0,8,8,.96)");
    expect(landing).toContain("text-emerald-300");
  });

  it("scopes the purple visual system to AppShell portal interiors", () => {
    expect(shell).toContain('className="rc-portal-theme min-h-screen relative"');
    expect(css).toContain(".rc-portal-theme {");
    expect(css).toContain("--primary: oklch(0.67 0.22 295)");
    expect(css).toContain("linear-gradient(135deg, #7c3aed, #8b5cf6 58%, #a78bfa)");
    expect(landing).not.toContain("rc-portal-theme");
  });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("homepage 60 percent typography scale", () => {
  const landing = readFileSync("client/src/pages/Landing.tsx", "utf8");
  const css = readFileSync("client/src/index.css", "utf8");

  it("sets an exact 1.6 scale on the public homepage root", () => {
    expect(landing).toContain("rc-homepage rc-homepage-type-scale");
    expect(css).toContain("--rc-homepage-font-scale: 1.6");
    expect(css).toContain(".rc-homepage-type-scale .text-xs");
    expect(css).toContain(".rc-homepage-type-scale .text-5xl");
    expect(css).toContain(".rc-homepage-type-scale .md\\:text-7xl");
  });

  it("scales shared homepage controls and metrics without changing global rules", () => {
    expect(css).toContain(".rc-homepage-type-scale .rc-btn");
    expect(css).toContain(".rc-homepage-type-scale .rc-input");
    expect(css).toContain(".rc-homepage-type-scale .rc-stat-value");
    expect(css).toContain(".rc-homepage-type-scale .rc-stat-label");
    expect(css).not.toContain(":root {\n  --rc-homepage-font-scale");
  });

  it("includes dedicated desktop and mobile layout repairs", () => {
    expect(css).toContain("@media (min-width: 768px)");
    expect(css).toContain("@media (max-width: 767px)");
    expect(css).toContain(".rc-homepage-hero-content");
    expect(css).toContain("grid-template-columns: minmax(0, 1fr)");
  });
});

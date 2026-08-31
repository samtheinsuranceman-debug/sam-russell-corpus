import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const landing = readFileSync(resolve("client/src/pages/Landing.tsx"), "utf8");
const app = readFileSync(resolve("client/src/App.tsx"), "utf8");
const css = readFileSync(resolve("client/src/index.css"), "utf8");

describe("Concept 16 physician homepage", () => {
  it("uses the clean persistent background and selected command-center hierarchy", () => {
    expect(landing).toContain("/manus-storage/rcs-concept-16-clean-background_a6ddebf1.png");
    expect(landing).toContain("The Physician Wealth Command Center");
    expect(landing).toContain("Enter the Physician Portal");
    expect(landing).toContain("Start My Physician Plan");
    for (const label of ["Tax", "Practice", "Retirement", "Legacy", "Review", "Coordinate", "Implement", "Monitor"]) {
      expect(landing).toContain(label);
    }
  });

  it("keeps every public navigation anchor resolvable", () => {
    const anchors = Array.from(landing.matchAll(/href="#([a-z0-9-]+)"/g), match => match[1]);
    expect(anchors.length).toBeGreaterThan(0);
    for (const id of new Set(anchors)) expect(landing, id).toMatch(new RegExp(`id=["']${id}["']`));
  });

  it("exposes accessible mobile navigation and keyboard-capable command controls", () => {
    expect(landing).toContain('aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}');
    expect(landing).toContain("aria-expanded={menuOpen}");
    expect(landing).toContain('role="tablist"');
    expect(landing).toContain('role="tab"');
    expect(landing).toContain("aria-selected={activePillar === id}");
    expect(landing).toContain('aria-label="Annual income"');
    expect(landing).toContain('aria-label="Filing status"');
    expect(landing).toContain('aria-label="State"');
  });

  it("keeps all lower physician options linked to registered protected routes", () => {
    const expected = [
      "/portal/tax-opportunities",
      "/portal/business-owner",
      "/portal/policy-review",
      "/portal/retirement-projection",
      "/portal/estate-flow",
      "/portal/portfolio-drift",
      "/portal/planning-cases",
      "/portal/document-vault",
    ];
    for (const route of expected) {
      expect(landing).toContain(`href: "${route}"`);
      expect(app).toContain(`path="${route}"`);
    }
    expect(landing).toContain("Every planning area remains within reach");
    expect(landing).toContain("Client Portal Access");
    expect(landing).toContain("Book a Free Consultation");
  });

  it("retains bounded responsive component typography under the 1.6 homepage scale", () => {
    expect(css).toContain(".rc-homepage-type-scale .rc-command-center .text-sm");
    expect(css).toContain(".rc-homepage-type-scale .rc-command-center input");
    expect(css).toContain(".rc-homepage-type-scale .rc-command-center select");
    expect(landing).toContain("sm:grid-cols-4");
    expect(landing).toContain("lg:grid-cols-[.86fr_1.14fr]");
  });

  it("does not restore public AUM, demo, fake phone, or inactive pricing claims", () => {
    for (const prohibited of ["Assets Under Management", "Investor Demo Mode", "Seeded scenarios", "tel:+1", "Professional Plan", "Enterprise Plan"]) {
      expect(landing).not.toContain(prohibited);
    }
  });
});

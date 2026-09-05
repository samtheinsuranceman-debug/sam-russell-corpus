import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const landing = readFileSync(resolve("client/src/pages/Landing.tsx"), "utf8");
const app = readFileSync(resolve("client/src/App.tsx"), "utf8");
const css = readFileSync(resolve("client/src/index.css"), "utf8");

describe("Concept 16 physician homepage", () => {
  it("uses the clean persistent background and selected command-center hierarchy", () => {
    // Neon "Financial & Tax Relief and Recovery" rebrand — words rendered as
    // live text; the two images demoted to blurred atmospheric backgrounds.
    expect(landing).toContain("/rcs-neon-hero.webp");
    expect(landing).toContain("/rcs-neon-banner.webp");
    expect(landing).toContain("Financial &amp; Tax");
    expect(landing).toContain("Relief and Recovery");
    expect(landing).toContain("For Physicians, Psychiatrists, &amp; Surgeons");
    // Additional slogans
    expect(landing).toContain("Keep More of What You Earn.");
    expect(landing).toContain("Protect What You Built.");
    expect(landing).toContain("Relief today · Recovery for life");
    expect(landing).toContain("High-Income Medicine.");
    expect(landing).toContain("One Coordinated System.");
    // Multi-background scroll chapters (Concepts 06 / 23 / 25)
    expect(landing).toContain("/rcs-bg-06.webp");
    expect(landing).toContain("/rcs-bg-23.webp");
    expect(landing).toContain("/rcs-bg-25.webp");
    expect(landing).toContain("Tax Strategy for");
    expect(landing).toContain("Turn Capital Into Income");
    // War-chest phrase leads Chapter 2; the highlight word is wrapped in a span.
    expect(landing).toContain("Transform Debt Into a");
    expect(landing).toContain("Tax-Free Liquid War Chest");
    expect(landing).toContain("The Physician War-Chest Strategy");
    expect(landing).toContain("Design Your Physician Financial System");
    expect(landing).toContain("Plan Beyond the Practice");
    expect(landing).toContain("Book a Physician Planning Review");
    expect(landing).toContain("Tax &amp; Interest Savings Calculator");
    // Concept 10 five-pillar strip
    for (const pillar of ["Practice Economics", "Physician Tax Strategy", "Risk & Protection", "Retirement Income", "Succession & Legacy"]) {
      expect(landing).toContain(pillar);
    }
    // Retained command-center panel labels
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
    expect(landing).toContain("lg:grid-cols-5");
  });

  it("does not restore public AUM, demo, fake phone, or inactive pricing claims", () => {
    for (const prohibited of ["Assets Under Management", "Investor Demo Mode", "Seeded scenarios", "tel:+1", "Professional Plan", "Enterprise Plan"]) {
      expect(landing).not.toContain(prohibited);
    }
  });
});

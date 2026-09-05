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
    // Senior-partner credibility band (its own component, mounted before the estimator)
    expect(landing).toContain("SeniorPartnerBand");
    const band = readFileSync(resolve("client/src/components/SeniorPartnerBand.tsx"), "utf8");
    expect(band).toContain("Clients who stay for decades");
    expect(band).toContain("medical malpractice");
    expect(band).toContain("20 years or longer");
    // War-chest phrase leads Chapter 2; the highlight word is wrapped in a span.
    expect(landing).toContain("Transform Debt Into a");
    expect(landing).toContain("Tax-Free Liquid War Chest");
    expect(landing).toContain("The Physician War-Chest Strategy");
    expect(landing).toContain("We build the tailored");
    expect(landing).toContain("around that.");
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
    // Anchor targets may live in components the page mounts (e.g. the AI
    // concierge section), so resolve ids against the page plus those.
    const concierge = readFileSync(resolve("client/src/components/HomeAIConcierge.tsx"), "utf8");
    const factFinder = readFileSync(resolve("client/src/components/HomeLeadFactFinder.tsx"), "utf8");
    const tech = readFileSync(resolve("client/src/components/ProprietaryTech.tsx"), "utf8");
    const idSources = landing + concierge + factFinder + tech;
    const anchors = Array.from(landing.matchAll(/href="#([a-z0-9-]+)"/g), match => match[1]);
    expect(anchors.length).toBeGreaterThan(0);
    for (const id of new Set(anchors)) expect(idSources, id).toMatch(new RegExp(`id=["']${id}["']`));
  });

  it("mounts the homepage lead fact-finder wired to public lead capture", () => {
    expect(landing).toContain("HomeLeadFactFinder");
    const ff = readFileSync(resolve("client/src/components/HomeLeadFactFinder.tsx"), "utf8");
    expect(ff).toContain('id="planning-estimator"');
    expect(ff).toContain("trpc.leads.capture");
    expect(ff).toContain("trpc.leads.recognize");
    // Consent is required and no figures are shown to the visitor.
    expect(ff).toContain("consent");
    expect(ff).toContain("not tax, legal, or investment advice");
    // Collects the household picture (a representative field is present).
    expect(ff).toContain("Interest-only payment / month");
    expect(ff).toContain("tax-deferred (IRA/401k/403b/TSP)");
  });

  it("fills the long scroll with the proprietary technology showcase", () => {
    expect(landing).toContain("ProprietaryTech");
    expect(landing).toContain('href="#technology"');
    const tech = readFileSync(resolve("client/src/components/ProprietaryTech.tsx"), "utf8");
    expect(tech).toContain('id="technology"');
    // The two engines the owner named must be present.
    expect(tech).toContain("Optimized Tax Waterfall Engine");
    expect(tech).toContain("Mortgage Killer");
    // 14 engines shown (all core patents except the AI advisor-coaching one).
    expect((tech.match(/ref: "/g) ?? []).length).toBe(14);
    expect(tech).not.toContain("Whisper");
    // Benefit-oriented framing only — no "how it works" mechanics.
    expect(tech).toContain("What it means for you");
    expect(tech).not.toContain("How it works");
    // Patent-pending status + the 45-more / stay-tuned message.
    expect(tech).toContain("Patent-pending");
    expect(tech).toContain("15 patents in process");
    expect(tech).toContain("45 more unique patent-pending technologies");
    expect(tech).toContain("Stay tuned");
    // Not offered anywhere else.
    expect(tech).toContain("won't find them anywhere else");
    expect(tech).toContain("tax, legal, or investment advice");
  });

  it("mounts the AI Brain Trust concierge wired to the nine-AI panel", () => {
    expect(landing).toContain("HomeAIConcierge");
    expect(landing).toContain('href="#ai-brain-trust"');
    const concierge = readFileSync(resolve("client/src/components/HomeAIConcierge.tsx"), "utf8");
    expect(concierge).toContain("trpc.ultra.homepagePanel");
    expect(concierge).toContain('id="ai-brain-trust"');
    // No specific figures promised in the public concierge UI copy.
    expect(concierge).toContain("not tax, legal, or investment advice");
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

  it("mounts the trust sections (how we work, who we serve, FAQ) and the mobile CTA", () => {
    for (const c of ["HomeHowWeWork", "HomeFaq", "MobileStickyCta"]) expect(landing).toContain(`<${c}`);
    const trust = readFileSync(resolve("client/src/components/HomeTrustSections.tsx"), "utf8");
    for (const step of ["Review", "Coordinate", "Implement", "Monitor"]) expect(trust).toContain(`title: "${step}"`);
    expect(trust).toContain("Who we serve");
    expect(trust).toContain("Straight answers");
    expect((trust.match(/\{ q: "/g) ?? []).length).toBe(7);
    // FAQ stays compliance-safe: no guarantees, no figures on the public page.
    expect(trust).toContain("Neither.");
    expect(trust).toContain("prepared for your licensed advisor");
    // Copy-my-summary fallback on the estimator result.
    const ff = readFileSync(resolve("client/src/components/HomeLeadFactFinder.tsx"), "utf8");
    expect(ff).toContain("Copy my summary");
    expect(ff).toContain("navigator.clipboard");
  });
});

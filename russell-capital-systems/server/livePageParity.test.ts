// ============================================================
// LIVE PAGE ↔ REACT HOMEPAGE PARITY
// The published single-file homepage (live/ template → docs/index.html) and the
// React homepage are two renderings of the same content. This test fails the
// moment they drift: engine list/order, FAQ, headline copy, proof numbers —
// and it fails if docs/index.html is stale relative to the template.
// ============================================================
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const APP = path.resolve(__dirname, "..");
const REPO = path.resolve(APP, "..");
const read = (p: string) => readFileSync(p, "utf8");

const template = read(path.join(APP, "live/rcs-live-homepage.template.html"));
const landing = read(path.join(APP, "client/src/pages/Landing.tsx"));
const tech = read(path.join(APP, "client/src/components/ProprietaryTech.tsx"));
const trust = read(path.join(APP, "client/src/components/HomeTrustSections.tsx"));
const proof = read(path.join(APP, "client/src/components/SeniorPartnerBand.tsx"));
const react = landing + tech + trust + proof;

const block = (src: string, name: string) => {
  const start = src.indexOf(`const ${name} = [`);
  expect(start, `${name} array present`).toBeGreaterThan(-1);
  return src.slice(start, src.indexOf("\n  ];", start));
};
const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&trade;/g, "™");

describe("live page ↔ React homepage parity", () => {
  it("lists the same 14 engines in the same building order", () => {
    const live = [...block(template, "ENGINES").matchAll(/\["[a-z0-9]+","([^"]+)","/g)].map((m) => m[1]);
    const app = [...tech.matchAll(/name: "([^"]+)"/g)].map((m) => m[1]);
    expect(live).toHaveLength(14);
    expect(live).toEqual(app);
  });

  it("asks the same FAQ questions, in the same order", () => {
    const live = [...block(template, "FAQ").matchAll(/\["((?:[^"\\]|\\.)*)","/g)].map((m) => m[1].replace(/\\"/g, '"'));
    const app = [...trust.matchAll(/q: "((?:[^"\\]|\\.)*)"/g)].map((m) => m[1].replace(/\\"/g, '"'));
    expect(live.length).toBeGreaterThanOrEqual(7);
    expect(live).toEqual(app);
  });

  it("carries the same headline promises and proof numbers", () => {
    const phrases = [
      "Financial & Tax Relief and Recovery",
      "Tax-Free Liquid War Chest",
      "On Demand™",
      "We build the tailored",
      "Systems",
      "We Build the System Around It.",
      "High-Earning Physicians",
      "Turn Medical Income Into Lasting Wealth™",
      "Clients who stay for decades.",
      "60%",
      "69 years old",
      "medical malpractice",
      "20 years or longer",
      "15 patents in process",
      "45 more",
      "anywhere else",
    ];
    const liveText = decode(template);
    const appText = decode(react);
    for (const p of phrases) {
      expect(liveText, `live page has “${p}”`).toContain(p);
      expect(appText, `React homepage has “${p}”`).toContain(p);
    }
  });

  it("never shows figures to visitors on either rendering", () => {
    // Visitor-facing copy must not carry the advisor-only methodology numbers.
    for (const forbidden of ["47%", "$150k", "$150,000", "95% deduction", "5–7 year", "5-7 year"]) {
      expect(template).not.toContain(forbidden);
      expect(react).not.toContain(forbidden);
    }
  });

  it("uses every one of the six crisp images, and never blurs them", () => {
    for (const key of ["NEON_A", "NEON_B", "EMERALD", "BRIDGE", "CANYON", "INTERCHANGE"]) {
      expect(template).toContain(`__IMG_${key}__`);
    }
    for (const file of ["rcs-neon-a", "rcs-neon-b", "rcs-city-emerald", "rcs-city-bridge", "rcs-city-canyon", "rcs-city-interchange"]) {
      expect(react).toContain(`/${file}.webp`);
    }
    expect(template).not.toMatch(/\.pic\{[^}]*filter:[^}]*blur/);
    expect(landing).not.toMatch(/blur-\[/);
  });

  it("docs/index.html is the built form of the current template", () => {
    const built = path.join(REPO, "docs/index.html");
    expect(existsSync(built), "docs/index.html exists — run `pnpm live:build`").toBe(true);
    const normalize = (s: string) =>
      s.replace(/data:image\/webp;base64,[A-Za-z0-9+/=]+/g, "__IMG__").replace(/__IMG_[A-Z_]+__/g, "__IMG__");
    const expected = normalize(template)
      .replace(/__CALENDLY__/g, "https://calendly.com/samtheinsuranceman-1/30min")
      .replace(/__ADVISOR_EMAIL__/g, "samtheinsuranceman@gmail.com");
    expect(normalize(read(built))).toBe(expected);
  });
});

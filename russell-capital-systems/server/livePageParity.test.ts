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
const trust = read(path.join(APP, "client/src/components/HomeTrustSections.tsx"));
const manifestoText = read(path.join(APP, "shared/homeManifesto.json"));
const manifesto = JSON.parse(read(path.join(APP, "shared/homeManifesto.json"))) as {
  slogan: string;
  status: string;
  declarations: string[];
  expect: string[];
  claims: Array<{ ref: string; name: string; lead: string; detail: string }>;
  disclaimer: string;
};
const react = landing + trust + manifestoText;

describe("live page ↔ React homepage parity", () => {
  it("renders the shared manifesto source in both the live template and React homepage", () => {
    expect(template).toContain("__MANIFESTO_JSON__");
    expect(template).toContain('document.querySelectorAll("[data-slogan]")');
    expect(template).toContain('M.declarations.map');
    expect(template).toContain('M.claims.map');
    expect(template).toContain('M.expect.map');
    expect(template).toContain('M.disclaimer');

    expect(landing).toContain('import manifesto from "@shared/homeManifesto.json"');
    expect(landing).toContain("manifesto.slogan");
    expect(landing).toContain("manifesto.declarations.map");
    expect(landing).toContain("manifesto.status");
    expect(landing).toContain("manifesto.claims.map");
    expect(landing).toContain("manifesto.expect.map");
    expect(landing).toContain("manifesto.disclaimer");
  });

  it("keeps the homepage manifesto data complete for the current fifteen-claim layout", () => {
    expect(manifesto.slogan).toContain("war chest");
    expect(manifesto.declarations).toHaveLength(6);
    expect(manifesto.expect).toHaveLength(5);
    expect(manifesto.claims).toHaveLength(15);
    expect(manifesto.claims[0]).toMatchObject({ ref: "01", name: "Cascading Calculator Core" });
    expect(manifesto.claims.at(-1)).toMatchObject({ ref: "15", name: "The Russell Number and the Practice Platform" });
  });

  it("keeps the current FAQ set intact", () => {
    const app = [...trust.matchAll(/q: "((?:[^"\\]|\\.)*)"/g)].map((m) => m[1].replace(/\\"/g, '"'));
    const expected = [
      "Who is this for?",
      "Is the estimate a quote or a guarantee?",
      "Why don't you show me the numbers here?",
      "What happens after I submit the estimate?",
      "What does \"divorce-proof\" mean?",
      "What are the patent-pending engines?",
      "Is my information safe?",
    ];
    expect(app).toEqual(expected);
  });

  it("never shows figures to visitors on either rendering", () => {
    // Visitor-facing copy must not carry the advisor-only methodology numbers.
    for (const forbidden of ["47%", "$150k", "$150,000", "95% deduction", "5–7 year", "5-7 year"]) {
      expect(template).not.toContain(forbidden);
      expect(react).not.toContain(forbidden);
    }
  });

  it("uses the current crisp homepage image set, and never blurs it", () => {
    for (const key of ["NEON_A", "NEON_A_TALL", "HORIZON", "SKYWAY", "FLAGSHIP", "EXPRESSWAY", "GLASS", "NEON_B", "NEON_B_TALL"]) {
      expect(template).toContain(`__IMG_${key}__`);
    }
    for (const file of ["rcs-neon-a", "rcs-neon-a-tall", "rcs-city-horizon", "rcs-city-skyway", "rcs-city-flagship", "rcs-city-expressway", "rcs-city-glass", "rcs-neon-b", "rcs-neon-b-tall"]) {
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
      .replace(/__ADVISOR_EMAIL__/g, "samtheinsuranceman@gmail.com")
      .replace(/__APP_ORIGIN__/g, "https://web-production-4b215.up.railway.app")
      .replace(/__MANIFESTO_JSON__/g, manifestoText.trim().replace(/<\//g, "<\\/"));
    expect(normalize(read(built))).toBe(expected);
  });
});

// ============================================================
// LIVE PAGE ↔ REACT HOMEPAGE PARITY
// The published single-file homepage (live/ template → docs/index.html) and the
// React homepage are two renderings of the same content. Both read their words
// from shared/homeManifesto.json; this test fails the moment they drift — and
// it fails if docs/index.html is stale relative to the template.
// ============================================================
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import manifesto from "../shared/homeManifesto.json";

const APP = path.resolve(__dirname, "..");
const REPO = path.resolve(APP, "..");
const read = (p: string) => readFileSync(p, "utf8");

const template = read(path.join(APP, "live/rcs-live-homepage.template.html"));
const landing = read(path.join(APP, "client/src/pages/Landing.tsx"));
const builder = read(path.join(APP, "live/build_live_homepage.py"));

describe("live page ↔ React homepage parity", () => {
  it("both read the same manifesto", () => {
    expect(landing).toContain('from "@shared/homeManifesto.json"');
    expect(template).toContain("__MANIFESTO_JSON__");
    expect(builder).toContain('"shared" / "homeManifesto.json"');
    // The static page renders every list the React page renders.
    for (const key of ["M.slogan", "M.declarations", "M.claims", "M.expect", "M.status", "M.disclaimer"]) expect(template).toContain(key);
    for (const key of ["manifesto.slogan", "manifesto.declarations", "manifesto.claims", "manifesto.expect", "manifesto.status", "manifesto.disclaimer"]) expect(landing).toContain(key);
  });

  it("keeps the same nine-screen order and the same section ids", () => {
    const order = (src: string, marks: string[]) => marks.map((m) => src.indexOf(m));
    const liveOrder = order(template, ['id="top"', 'id="horizon"', 'id="manifesto"', "The skyway", 'id="claims"', "The expressway", 'id="expect"', "The sign at night", 'id="estimate"']);
    const appOrder = order(landing, ['id="top"', 'id="horizon"', 'id="manifesto"', "The skyway", 'id="claims"', "The expressway", 'id="expect"', "The sign at night", "<HomeLeadFactFinder />"]);
    for (const list of [liveOrder, appOrder]) {
      expect(list.every((i) => i > -1)).toBe(true);
      expect(list).toEqual(list.slice().sort((a, b) => a - b));
    }
  });

  it("carries the one slogan on two pictures, and the same headline promises", () => {
    expect((template.match(/class="slogan-line"/g) ?? []).length).toBe(2);
    expect((landing.match(/ slogan label=/g) ?? []).length).toBe(2);
    for (const p of ["Financial &amp; Tax Relief and Recovery", "Read them top to bottom", "Each one makes the next possible", "Only at RCS", "Hear it from Sam Russell"]) {
      expect(template, `live page has “${p}”`).toContain(p);
      expect(landing, `React homepage has “${p}”`).toContain(p);
    }
    expect(manifesto.claims).toHaveLength(15);
  });

  it("never shows figures to visitors on either rendering", () => {
    for (const forbidden of ["47%", "$150k", "$150,000", "95% deduction", "5–7 year", "5-7 year", "$2.8B", "98%", "27+"]) {
      expect(template).not.toContain(forbidden);
      expect(landing).not.toContain(forbidden);
      expect(JSON.stringify(manifesto)).not.toContain(forbidden);
    }
  });

  it("uses the same pictures on both, crisp, never blurred", () => {
    const pairs: Array<[string, string]> = [
      ["__IMG_NEON_A__", "/rcs-neon-a.webp"], ["__IMG_NEON_A_TALL__", "/rcs-neon-a-tall.webp"],
      ["__IMG_HORIZON__", "/rcs-city-horizon.webp"], ["__IMG_SKYWAY__", "/rcs-city-skyway.webp"], ["__IMG_FLAGSHIP__", "/rcs-city-flagship.webp"],
      ["__IMG_EXPRESSWAY__", "/rcs-city-expressway.webp"], ["__IMG_GLASS__", "/rcs-city-glass.webp"],
      ["__IMG_NEON_B__", "/rcs-neon-b.webp"], ["__IMG_NEON_B_TALL__", "/rcs-neon-b-tall.webp"],
    ];
    for (const [key, file] of pairs) {
      expect(template, key).toContain(key);
      expect(builder, key).toContain(key);
      expect(landing, file).toContain(file);
      expect(existsSync(path.join(APP, "client/public", file.slice(1))), file).toBe(true);
    }
    expect(template).not.toMatch(/\.pic\{[^}]*filter:[^}]*blur/);
    expect(landing).not.toMatch(/blur-\[/);
  });

  it("docs/index.html is the built form of the current template", () => {
    const built = path.join(REPO, "docs/index.html");
    expect(existsSync(built), "docs/index.html exists — run `pnpm live:build`").toBe(true);
    const normalize = (s: string) =>
      s.replace(/data:image\/webp;base64,[A-Za-z0-9+/=]+/g, "__IMG__").replace(/__IMG_[A-Z_]+__/g, "__IMG__")
        .replace(/<script id="manifesto-json" type="application\/json">[\s\S]*?<\/script>/, "__MANIFESTO__");
    const expected = normalize(template)
      .replace(/__CALENDLY__/g, "https://calendly.com/samtheinsuranceman-1/30min")
      .replace(/__ADVISOR_EMAIL__/g, "samtheinsuranceman@gmail.com")
      .replace(/__APP_ORIGIN__/g, "https://web-production-4b215.up.railway.app");
    expect(normalize(read(built))).toBe(expected);
    // and the embedded manifesto is the current one
    expect(read(built)).toContain(manifesto.claims[14].name);
    expect(read(built)).toContain(manifesto.slogan.slice(0, 40));
  });
});

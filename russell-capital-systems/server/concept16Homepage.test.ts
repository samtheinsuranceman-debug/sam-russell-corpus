import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import manifesto from "../shared/homeManifesto.json";

const landing = readFileSync(resolve("client/src/pages/Landing.tsx"), "utf8");
const css = readFileSync(resolve("client/src/index.css"), "utf8");
const template = readFileSync(resolve("live/rcs-live-homepage.template.html"), "utf8");
const builder = readFileSync(resolve("live/build_live_homepage.py"), "utf8");

describe("The homepage: clean pictures, one slogan, fifteen stacked claims, the lead card last", () => {
  it("shows the neon sign as the hero with its words as the only headline", () => {
    expect(landing).toContain("/rcs-neon-a.webp");
    expect(landing).toContain("/rcs-neon-a-tall.webp");
    expect(landing).toContain("Financial &amp; Tax Relief and Recovery");
    expect(landing).toContain("For Physicians, Psychiatrists, &amp; Surgeons");
    expect(landing).not.toMatch(/blur-\[/);
  });

  it("keeps the image pages clean: no headings, buttons, forms or selects on top of a picture", () => {
    // Every <ImagePage> renders only the picture and, optionally, the slogan line.
    const imagePage = landing.slice(landing.indexOf("function ImagePage"), landing.indexOf("function FounderVoice"));
    for (const forbidden of ["<h2", "<h3", "<button", "<form", "<select", "<input", "rc-btn"]) expect(imagePage).not.toContain(forbidden);
    // The hero carries the sign, the sr-only h1 and a scroll hint only.
    const hero = landing.slice(landing.indexOf('<header id="top"'), landing.indexOf("</header>"));
    for (const forbidden of ["<button", "<form", "<select", "rc-btn", "<h2"]) expect(hero).not.toContain(forbidden);
    // The old feature boxes, selectors, calculator and pillar strips are gone.
    for (const gone of ["COMMAND_PILLARS", "PLANNING_AREAS", "FEATURES", "Design Your Physician Financial System", "Tax &amp; Interest Savings Calculator", "Physician Tax-Planning Review", "ClientLoginSection", "ConsultationSection", "HomeHowWeWork", "HomeFaq", "SeniorPartnerBand", "HomeAIConcierge", "ProprietaryTech"]) {
      expect(landing, gone).not.toContain(gone);
    }
  });

  it("carries the one slogan, on one line, on exactly two image pages", () => {
    expect(manifesto.slogan).toMatch(/war chest/i);
    expect(manifesto.slogan).toMatch(/deploy/i);
    expect(landing).toContain("manifesto.slogan");
    expect((landing.match(/ slogan label=/g) ?? []).length).toBe(2);
    expect(landing).toContain("whitespace-nowrap");
    expect(css).toContain("rc-slogan-drift");
    expect(css).toContain("prefers-reduced-motion");
    // No other slogans survive.
    for (const gone of ["Turn Capital Into Income", "Turn Medical Income Into Lasting Wealth", "Keep More of What You Earn", "Relief today", "We Build the System Around It", "Tax-Free Liquid War Chest"]) {
      expect(landing, gone).not.toContain(gone);
    }
  });

  it("stacks fifteen patent-pending claims in building order, each a bold lead and a short detail", () => {
    expect(manifesto.claims.length).toBe(15);
    const refs = manifesto.claims.map((c) => c.ref);
    expect(refs).toEqual(refs.slice().sort());
    for (const claim of manifesto.claims) {
      const sentences = (s: string) => (s.match(/[.!?](\s|$)/g) ?? []).length;
      expect(sentences(claim.lead) + sentences(claim.detail), claim.name).toBeLessThanOrEqual(3);
      expect(sentences(claim.lead) + sentences(claim.detail), claim.name).toBeGreaterThanOrEqual(2);
      expect(claim.lead.length, claim.name).toBeLessThan(260);
    }
    expect(manifesto.claims.map((c) => c.name)).toContain("Optimized Tax Waterfall Engine");
    expect(manifesto.claims.map((c) => c.name)).toContain("Mortgage Killer");
    expect(landing).toContain('id="claims"');
    expect(landing).toContain("manifesto.claims.map");
    expect(landing).toContain("Only at RCS");
    // Patent honesty: pending, never granted.
    expect(manifesto.status).toMatch(/Patent-pending/);
    expect(manifesto.status).toMatch(/15 core applications/);
    expect(JSON.stringify(manifesto)).not.toMatch(/patent(ed| granted)/i);
    expect(manifesto.disclaimer).toContain("Not tax, legal or investment advice");
  });

  it("makes the declarations: nowhere else, the competitors, no clinical trials, speed of thought", () => {
    const all = manifesto.declarations.join(" ");
    expect(all).toMatch(/Nowhere else/);
    expect(all).toMatch(/MoneyGuidePro/);
    expect(all).toMatch(/eMoney/);
    expect(all).toMatch(/clinical trials/);
    expect(all).toMatch(/speed of thought/);
    expect(all).toMatch(/attorneys and the consultants/);
    expect(manifesto.expect.length).toBe(5);
    expect(landing).toContain('id="manifesto"');
    expect(landing).toContain('id="expect"');
    expect(manifesto.disclaimer).toMatch(/owner's opinion/);
  });

  it("offers the founder's voice only when the server can synthesise it", () => {
    expect(landing).toContain("/api/founder-message.mp3");
    expect(landing).toContain("loadedmetadata");
    const server = readFileSync(resolve("server/founderVoice.ts"), "utf8");
    expect(server).toContain("ELEVENLABS_API_KEY");
    expect(server).toContain("ELEVENLABS_VOICE_ID");
    expect(server).toContain("res.status(404)");
    expect(readFileSync(resolve("server/_core/index.ts"), "utf8")).toContain("registerFounderVoice(app)");
    expect(manifesto.founderMessage.length).toBeGreaterThan(200);
  });

  it("ends with the lead card wired to public lead capture, and nothing after it but the footer", () => {
    expect(landing).toContain("<HomeLeadFactFinder />");
    expect(landing.indexOf("<HomeLeadFactFinder />")).toBeLessThan(landing.indexOf("<footer"));
    expect(landing.slice(landing.indexOf("<HomeLeadFactFinder />"), landing.indexOf("<footer"))).not.toContain("<section");
    const ff = readFileSync(resolve("client/src/components/HomeLeadFactFinder.tsx"), "utf8");
    expect(ff).toContain('id="planning-estimator"');
    expect(ff).toContain("trpc.leads.capture");
    expect(ff).toContain("consent");
    expect(ff).toContain("not tax, legal, or investment advice");
  });

  it("keeps every public navigation anchor resolvable", () => {
    const factFinder = readFileSync(resolve("client/src/components/HomeLeadFactFinder.tsx"), "utf8");
    const idSources = landing + factFinder;
    const anchors = Array.from(landing.matchAll(/href(?:=|: )"#([a-z0-9-]+)"/g), (m) => m[1]);
    expect(anchors.length).toBeGreaterThan(0);
    for (const id of new Set(anchors)) expect(idSources, id).toMatch(new RegExp(`id=["']${id}["']`));
    expect(landing).toContain('aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}');
  });

  it("shows no purple anywhere in the client", () => {
    const { execSync } = require("node:child_process") as typeof import("node:child_process");
    const hits = execSync("grep -rlE 'violet-|purple-|#a78bfa|#8b5cf6|#7c3aed|rgba\\(124, ?58, ?237' client/src || true", { encoding: "utf8" }).trim();
    expect(hits, hits).toBe("");
  });

  it("does not restore public AUM, demo, fake phone, or inactive pricing claims", () => {
    for (const prohibited of ["Assets Under Management", "Investor Demo Mode", "Seeded scenarios", "tel:+1", "Professional Plan", "Enterprise Plan", "$2.8B", "98%"]) {
      expect(landing).not.toContain(prohibited);
    }
  });

  it("mirrors the same words and structure on the static homepage template", () => {
    expect(builder).toContain("__MANIFESTO_JSON__");
    expect(template).toContain("__MANIFESTO_JSON__");
    for (const key of ["__IMG_NEON_A__", "__IMG_NEON_A_TALL__", "__IMG_NEON_B__", "__IMG_NEON_B_TALL__", "__IMG_HORIZON__", "__IMG_SKYWAY__", "__IMG_EXPRESSWAY__"]) {
      expect(template, key).toContain(key);
      expect(builder, key).toContain(key);
    }
    expect(template).toContain('id="claims"');
    expect(template).toContain('id="manifesto"');
    expect(template).toContain('id="estimate"');
    expect((template.match(/class="slogan-line"/g) ?? []).length).toBe(2);
    for (const gone of ["Turn Capital Into Income", "Design Your Physician Financial System", "Clients who stay for decades", "$2.8B", "Physician Tax-Planning Review"]) {
      expect(template, gone).not.toContain(gone);
    }
  });
});

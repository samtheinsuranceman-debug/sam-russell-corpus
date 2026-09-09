import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  COPPER, NEEDLES, NEEDLE_HEX, SEAL_BROWN, THEMES, routeToTheme, roomAttributes, themedRouteInventory,
} from "../shared/themes";
import { FORBIDDEN_PHRASES, IVORY_MACRO, MASTER_MACRO, MASTER_MICRO, NEEDLE_REVEAL, PUBLIC_REVEAL, revealFor } from "../shared/revealCopy";

const css = readFileSync(resolve("client/src/index.css"), "utf8");
const html = readFileSync(resolve("client/index.html"), "utf8");

describe("the rooms — Grok's theme map on the route table", () => {
  it("keeps Theme 1 above the fold on / only", () => {
    expect(routeToTheme("/").theme).toBe("theme1");
    expect(routeToTheme("/?utm=x").theme).toBe("theme1");
    for (const p of ["/pricing", "/login", "/portal", "/portal/dashboard"]) expect(routeToTheme(p).theme).not.toBe("theme1");
  });

  it("puts the public house and the portal cockpit in Private Banking Navy", () => {
    for (const p of ["/pricing", "/support", "/trial", "/for/surgeons", "/portal", "/portal/dashboard", "/portal/advisory-summary", "/portal/command-center"]) {
      expect(routeToTheme(p).theme, p).toBe("theme2");
      expect(routeToTheme(p).quiet, p).toBe(false);
    }
  });

  it("keeps the quiet pages quiet: legal, auth, compliance, vault, health, 404", () => {
    for (const p of ["/privacy", "/terms", "/login", "/register", "/forgot-password", "/reset-password", "/invite", "/404",
      "/portal/billing", "/portal/compliance", "/portal/compliance-audit-trail", "/portal/document-vault", "/portal/site-health", "/portal/system-health"]) {
      const r = routeToTheme(p);
      expect(r.quiet, p).toBe(true);
      expect(r.theme, p).toBe("theme2");
    }
  });

  it("gives the three public calculators the carbon chassis with their own needles", () => {
    expect(routeToTheme("/calculators")).toMatchObject({ theme: "theme9", needle: "champagne", section: 3 });
    expect(routeToTheme("/ultra-calculator")).toMatchObject({ theme: "theme9", needle: "cyan" });
    expect(routeToTheme("/fact-finder")).toMatchObject({ theme: "theme9", needle: "steel" });
  });

  it("sends every tax page to the parchment sanctuary, estate-tax included", () => {
    for (const p of ["/portal/tax-brackets", "/portal/tax-combos", "/portal/tax-combos/7", "/portal/estate-tax", "/portal/charitable-giving",
      "/portal/str-strategy", "/portal/secret-secrets/3", "/portal/toilet", "/portal/physicians-edge", "/portal/tax-waterfall"]) {
      const r = routeToTheme(p);
      expect(r.theme, p).toBe("theme5");
      expect(THEMES[r.theme].light).toBe(true);
      expect(roomAttributes(p)["data-light"]).toBe("1");
      expect(THEMES.theme5.tokens.calculate).toBe(SEAL_BROWN);
    }
  });

  it("sends prediction and outside forces to the math wing", () => {
    for (const p of ["/portal/erosion", "/portal/inflation", "/portal/time-machine", "/portal/time-machine-ag49", "/portal/sphere", "/portal/ibbotson-charts", "/portal/zip-engine", "/portal/market-stress-test"]) {
      expect(routeToTheme(p).theme, p).toBe("theme6");
    }
  });

  it("drafting is oxblood, law is parchment", () => {
    for (const p of ["/portal/trusts", "/portal/will-writer", "/portal/succession-planning", "/portal/policy-review", "/portal/the-legacy"]) {
      expect(routeToTheme(p).theme, p).toBe("theme7");
    }
    expect(routeToTheme("/portal/estate-tax").theme).toBe("theme5");
  });

  it("journey rooms are horizon; the three mirrors and the AI advisor are indigo with gold dollars", () => {
    for (const p of ["/portal/welcome", "/portal/my-journey", "/portal/the-arrival", "/portal/the-map", "/portal/wealth-genome", "/portal/plan-ledger", "/portal/wrapped"]) {
      expect(routeToTheme(p).theme, p).toBe("theme8");
    }
    for (const p of ["/portal/the-mirror", "/portal/black-mirror", "/portal/avatar-twins", "/portal/ai-advisor", "/portal/patent-showcase"]) {
      expect(routeToTheme(p).theme, p).toBe("theme11");
    }
    expect(THEMES.theme11.tokens.money).toBe("#E6C36A");
  });

  it("clients, intake and the human tools sit in Quiet Luxury", () => {
    for (const p of ["/portal/clients", "/portal/clients/42", "/portal/leads", "/portal/client-intake", "/onboarding", "/portal/couples",
      "/portal/advisor-chat", "/portal/sales-story", "/portal/education", "/portal/video-library", "/portal/war-room"]) {
      expect(routeToTheme(p).theme, p).toBe("theme3");
    }
  });

  it("every engine shares the carbon chassis and changes only its needle", () => {
    const seen = new Set<string>();
    for (const [path, needle] of Object.entries(NEEDLES)) {
      const r = routeToTheme(path);
      expect(r.theme, path).toBe("theme9");
      expect(r.needle, path).toBe(needle);
      seen.add(needle);
    }
    expect([...seen].sort()).toEqual(["champagne", "cyan", "forest", "gold", "horizon", "oxblood", "steel"]);
    expect(routeToTheme("/portal/mortgage-killer").needle).toBe("steel");
    expect(routeToTheme("/portal/roth-conversion").needle).toBe("forest");
    expect(routeToTheme("/portal/russell-number").needle).toBe("gold");
    expect(routeToTheme("/portal/lifetime-income").needle).toBe("horizon");
    expect(routeToTheme("/portal/estate-flow").needle).toBe("oxblood");
    expect(routeToTheme("/portal/endgame").needle).toBe("cyan");
    expect(routeToTheme("/portal/the-brotherhood").needle).toBe("champagne");
  });

  it("everything a client receives by link is Ivory and quiet", () => {
    for (const p of ["/shared/abc", "/shared-slides/abc", "/video/abc", "/client-portal/abc"]) {
      expect(routeToTheme(p)).toMatchObject({ theme: "theme10", quiet: true, section: 12 });
    }
    expect(THEMES.theme10.tokens.calculate).not.toBe(COPPER); // no copper on a PDF or a client link
  });

  it("unknown portal rooms fall back to the navy cockpit", () => {
    expect(routeToTheme("/portal/some-new-page").theme).toBe("theme2");
  });

  it("carries the house invariants: copper Calculate everywhere but Tax and Ivory, gold-family money, no rename of the token roles", () => {
    for (const t of Object.values(THEMES)) {
      const roles = ["canvas", "surface", "tab", "tabActive", "text", "heading", "money", "line", "fill", "calculate", "grid", "muted", "danger", "hairline"];
      for (const role of roles) expect((t.tokens as any)[role], `${t.id}.${role}`).toBeTruthy();
      if (t.id !== "theme5" && t.id !== "theme10") expect(t.tokens.calculate, t.id).toBe(COPPER);
    }
    expect(NEEDLE_HEX.gold).toBe("#C9A227");
  });

  it("stylesheet and theme table agree on every room's canvas and Calculate", () => {
    for (const t of Object.values(THEMES)) {
      const block = css.match(new RegExp(`html\\[data-room="${t.id}"\\] \\{[^}]+\\}`));
      expect(block, t.id).toBeTruthy();
      expect(block![0]).toContain(`--room-canvas:${t.tokens.canvas}`);
      expect(block![0]).toContain(`--room-calculate:${t.tokens.calculate}`);
      expect(block![0]).toContain(`--room-money:${t.tokens.money}`);
    }
    for (const [needle, hex] of Object.entries(NEEDLE_HEX)) expect(css).toContain(`--needle-${needle}: ${hex}`);
    expect(css).not.toMatch(/violet|purple/i);
  });

  it("loads the four-file type rack and nothing more", () => {
    expect(html).toContain("family=Fraunces");
    expect(html).toContain("family=IBM+Plex+Sans");
    expect(html).toContain("family=IBM+Plex+Mono");
    expect(css).toContain('--font-display: "Fraunces"');
    expect(css).toContain('--font-ui: "IBM Plex Sans"');
    expect(css).toContain("tabular-nums lining-nums");
  });

  it("inventories the routes the map names", () => {
    const inv = themedRouteInventory();
    expect(inv.length).toBeGreaterThan(200);
    expect(inv.filter((r) => r.theme === "theme9").length).toBeGreaterThanOrEqual(60);
    expect(inv.filter((r) => r.theme === "theme5").length).toBe(15);
  });
});

describe("the reveal layer", () => {
  it("has a micro and a macro for all seven needles, the three public engines and the ivory form", () => {
    for (const n of Object.keys(NEEDLE_HEX)) {
      const c = NEEDLE_REVEAL[n as keyof typeof NEEDLE_REVEAL];
      expect(c.micro.split(/\s+/).length, n).toBeLessThanOrEqual(30);
      expect(c.macro.split(/\s+/).length, n).toBeLessThanOrEqual(60);
    }
    expect(Object.keys(PUBLIC_REVEAL).sort()).toEqual(["/calculators", "/fact-finder", "/ultra-calculator"]);
    expect(IVORY_MACRO).toContain("one household system");
    expect(revealFor("steel").micro).toContain("mortgage");
    expect(revealFor(null).macro).toBe(MASTER_MACRO);
    expect(revealFor(null, "/ultra-calculator").micro).toBe(NEEDLE_REVEAL.cyan.micro);
    expect(MASTER_MICRO.split(/\s+/).length).toBeLessThanOrEqual(30);
  });

  it("never uses the late-night-TV phrases", () => {
    const all = [MASTER_MICRO, MASTER_MACRO, IVORY_MACRO, ...Object.values(NEEDLE_REVEAL).flatMap((c) => [c.micro, c.macro]), ...Object.values(PUBLIC_REVEAL).flatMap((c) => [c.micro, c.macro])];
    for (const text of all) for (const bad of FORBIDDEN_PHRASES) expect(text.toLowerCase(), text).not.toContain(bad);
  });
});

// ============================================================
// INTERNAL LINKS RESOLVE
// The 2026-09-23 route audit found 245 internal link targets in client/src and
// shared/ that no route in App.tsx serves: /portal/ai-brain on 19 pages (the
// real route is /portal/ai-brain-hub), 157 dead cards on the Lab, 103 on the
// Calculator Hub, the /administrator and /executive entrance buttons, the
// command palette, the keyboard shortcuts and the onboarding tour. Every one
// of them was a click that ended on the 404 page.
//
// This test reads every string that sits in a link position (href, to,
// navigate(), setLocation(), window.location.href =, and the path / route /
// link / href / url fields of link lists and quoted-key path records) and
// requires it to match a <Route path> in App.tsx. `:param` segments match any
// single segment.
//
// Targets that are not React routes but are real (served by the server, or
// built at runtime) go in NOT_A_ROUTE below, each with the reason. Asset and
// API paths are skipped by prefix and extension.
// ============================================================
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const APP = path.resolve(__dirname, "..");
const appSrc = readFileSync(path.join(APP, "client/src/App.tsx"), "utf8");

/** Every path the router serves. */
export const ROUTES = Array.from(appSrc.matchAll(/<Route\s+path="([^"]+)"/g), (m) => m[1]!);
const ROUTE_RES = ROUTES.map((r) => new RegExp("^" + r.replace(/:[^/]+/g, "[^/]+").replace(/\*/g, ".*") + "$"));
export const matchesRoute = (p: string) => ROUTE_RES.some((re) => re.test(p));

/**
 * Link targets that are deliberately not client routes. Keep this short and give
 * the reason; a missing page belongs in App.tsx, not here.
 */
export const NOT_A_ROUTE: Record<string, string> = {};

/** Server endpoints and static files: never React routes. */
const SKIP_PREFIX = /^\/(api|trpc|assets|images|img|fonts|static|audio|videos?\/[^/]+\.|favicon|manifest|robots|sitemap|og|icons|logos?|media|docs|uploads|concepts|__)/;
const SKIP_EXT = /\.(png|jpe?g|svg|webp|avif|mp4|mp3|pdf|json|ico|txt|xml|css|js|woff2?|gif|wav|webm|csv|html)$/;

/** A string literal in a link position. The literal must start with "/" and contain no spaces. */
const LINK_RE =
  /(?:\bhref|\bto|\bnavigate|\bsetLocation|\bpath|\broute|\blink|\burl|window\.location\.href\s*=|location\.assign|location\.replace)\s*[=:(]?\s*\{?\s*(["'`])(\/[A-Za-z0-9_\-/:.?=&%#]*)\1/g;
/** Values of quoted-key path records, e.g. STRATEGY_PATHS: { "roth-conversion": "/portal/roth-conversion" }. */
const RECORD_RE = /"[\w-]+"\s*:\s*(["'])(\/portal\/[A-Za-z0-9_\-/]*)\1/g;

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full));
    else if (/\.(tsx?)$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(full);
  }
  return out;
}

/** Normalised link targets found in one source text. */
export function linkTargets(src: string): string[] {
  const out: string[] = [];
  for (const re of [LINK_RE, RECORD_RE]) {
    for (const m of src.matchAll(re)) {
      let t = m[2]!.split(/[?#]/)[0]!;
      if (t.length > 1) t = t.replace(/\/$/, "");
      if (t === "" || SKIP_PREFIX.test(t) || SKIP_EXT.test(t)) continue;
      out.push(t);
    }
  }
  return out;
}

const rel = (full: string) => path.relative(APP, full).split(path.sep).join("/");
const targets = new Map<string, Set<string>>();
for (const file of [...sourceFiles(path.join(APP, "client/src")), ...sourceFiles(path.join(APP, "shared"))]) {
  for (const t of linkTargets(readFileSync(file, "utf8"))) {
    if (!targets.has(t)) targets.set(t, new Set());
    targets.get(t)!.add(rel(file));
  }
}

describe("every internal link target is a route in App.tsx", () => {
  it("the extractor reads link positions and skips assets", () => {
    expect(linkTargets(`<Link href="/portal/clients">`)).toEqual(["/portal/clients"]);
    expect(linkTargets(`navigate("/portal/ai-brain-hub?x=1")`)).toEqual(["/portal/ai-brain-hub"]);
    expect(linkTargets(`{ path: "/pricing", label: "Pricing" }`)).toEqual(["/pricing"]);
    expect(linkTargets(`window.location.href = '/portal/billing'`)).toEqual(["/portal/billing"]);
    expect(linkTargets(`"roth": "/portal/roth-conversion"`)).toEqual(["/portal/roth-conversion"]);
    expect(linkTargets(`<img src="/rcs.webp"> fetch("/api/x") href="/og-card.jpg"`)).toEqual([]);
  });

  it("the route matcher handles params", () => {
    expect(matchesRoute("/portal/clients/42")).toBe(true);
    expect(matchesRoute("/for/family-medicine")).toBe(true);
    expect(matchesRoute("/portal/ai-brain")).toBe(false);
  });

  it("finds a sane number of routes and links", () => {
    expect(ROUTES.length).toBeGreaterThan(300);
    expect(targets.size).toBeGreaterThan(300);
  });

  it("has no link to a path the router does not serve", () => {
    const dead = [...targets.entries()]
      .filter(([t]) => !matchesRoute(t) && !(t in NOT_A_ROUTE))
      .map(([t, files]) => `${t}  <=  ${[...files].slice(0, 4).join(", ")}${files.size > 4 ? ` (+${files.size - 4})` : ""}`);
    expect(dead, `${dead.length} link target(s) have no route. Point them at the real route, remove them, or add the page to App.tsx`).toEqual([]);
  });

  it("NOT_A_ROUTE entries are really not routes, are still linked, and give a reason", () => {
    for (const [t, reason] of Object.entries(NOT_A_ROUTE)) {
      expect(matchesRoute(t), `${t} is a route now — remove it from NOT_A_ROUTE`).toBe(false);
      expect(targets.has(t), `${t} is no longer linked — remove it from NOT_A_ROUTE`).toBe(true);
      expect(reason.trim().length, t).toBeGreaterThan(10);
    }
  });
});

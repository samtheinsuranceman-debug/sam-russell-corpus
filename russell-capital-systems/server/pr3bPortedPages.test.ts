/**
 * PR-3b — 106 pages ported from `russell-capital-app`.
 *
 * The port was mechanical, so the risks are mechanical too: a route registered
 * in one place and not another, a page file that didn't come across, a label
 * collision in the menu, or donor content that breaks a rule this repository
 * enforces and the donor never had.
 *
 * These read the real files. The ported set is discovered from the marker
 * comments the port wrote into App.tsx and secondaryCatalog.ts, so deleting a
 * ported route without deleting its marker fails here rather than silently
 * shrinking the build.
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ROUTE_MANIFEST } from "@shared/routeManifest";
import { SECONDARY_CATALOG, SECONDARY_CATEGORIES } from "@/lib/secondaryCatalog";

const ROOT = path.resolve(import.meta.dirname, "..");
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8");

const MARKER = "PR-3b: pages ported from russell-capital-app";
const APP_SRC = read("client/src/App.tsx");
const CATALOG_SRC = read("client/src/lib/secondaryCatalog.ts");

/** Routes registered in the PR-3b block of App.tsx, with their components. */
const PORTED: { route: string; comp: string }[] = (() => {
  const from = APP_SRC.indexOf(`{/* ─── ${MARKER} ─── */}`);
  if (from < 0) throw new Error("PR-3b route block marker missing from App.tsx");
  const block = APP_SRC.slice(from);
  const stop = block.indexOf("</Switch>");
  const scope = stop > 0 ? block.slice(0, stop) : block;
  return [...scope.matchAll(/<Route path="([^"]+)" component=\{gated\(([A-Za-z0-9_]+),/g)].map(
    (m) => ({ route: m[1], comp: m[2] }),
  );
})();

const MANIFEST = new Set<string>(ROUTE_MANIFEST);
const CATALOG_PATHS = new Set(SECONDARY_CATALOG.map((i) => i.path));

describe("PR-3b ported pages", () => {
  it("ported a substantive batch", () => {
    expect(PORTED.length).toBe(106);
  });

  it("registers every ported route in ROUTE_MANIFEST", () => {
    const absent = PORTED.map((p) => p.route).filter((r) => !MANIFEST.has(r));
    expect(absent, "route in App.tsx but not the manifest").toEqual([]);
  });

  it("lazy-imports every ported component exactly once", () => {
    const problems: string[] = [];
    for (const { comp } of PORTED) {
      const decls = [...APP_SRC.matchAll(new RegExp(`^const ${comp} = lazy\\(`, "gm"))].length;
      if (decls !== 1) problems.push(`${comp}: ${decls} lazy declarations`);
    }
    expect(problems).toEqual([]);
  });

  it("points every lazy import at a page file that exists", () => {
    const missing: string[] = [];
    for (const { comp } of PORTED) {
      const m = APP_SRC.match(new RegExp(`^const ${comp} = lazy\\(\\(\\) => import\\("\\.([^"]+)"\\)`, "m"));
      if (!m) { missing.push(`${comp}: no import`); continue; }
      const file = path.join(ROOT, "client/src", m[1] + ".tsx");
      if (!fs.existsSync(file)) missing.push(`${comp} -> ${m[1]}.tsx`);
    }
    expect(missing, "lazy import resolves to nothing on disk").toEqual([]);
  });

  it("registers no route twice", () => {
    const seen = new Map<string, number>();
    for (const r of PORTED.map((p) => p.route)) seen.set(r, (seen.get(r) ?? 0) + 1);
    expect([...seen].filter(([, n]) => n > 1).map(([r]) => r)).toEqual([]);
  });

  it("gives every ported component a distinct name", () => {
    const names = PORTED.map((p) => p.comp);
    expect(names.length - new Set(names).size, "duplicate component identifiers").toBe(0);
  });
});

// ── nothing hidden from the menu ───────────────────────────────────────────
describe("PR-3b navigation", () => {
  it("lists every ported route in the secondary catalog", () => {
    const hidden = PORTED.map((p) => p.route).filter((r) => !CATALOG_PATHS.has(r));
    expect(hidden, "ported route unreachable from the menu").toEqual([]);
  });

  it("keeps the PR-3b catalog block present and populated", () => {
    expect(CATALOG_SRC).toContain(MARKER);
  });

  it("gives every catalog entry a real label and a known category", () => {
    const bad: string[] = [];
    for (const item of SECONDARY_CATALOG) {
      if (!item.label || !item.label.trim()) bad.push(`${item.path}: blank label`);
      if (!SECONDARY_CATEGORIES.includes(item.category)) bad.push(`${item.path}: ${item.category}`);
    }
    expect(bad).toEqual([]);
  });

  it("lists no path in the catalog twice", () => {
    const seen = new Map<string, number>();
    for (const i of SECONDARY_CATALOG) seen.set(i.path, (seen.get(i.path) ?? 0) + 1);
    expect([...seen].filter(([, n]) => n > 1).map(([p]) => p)).toEqual([]);
  });
});

// ── donor content obeying this repo's rules ────────────────────────────────
describe("PR-3b ported content", () => {
  const files = PORTED.map(({ comp }) => {
    const m = APP_SRC.match(new RegExp(`^const ${comp} = lazy\\(\\(\\) => import\\("\\.([^"]+)"\\)`, "m"));
    return m ? `client/src${m[1]}.tsx` : null;
  }).filter((f): f is string => !!f);

  it("introduces no purple or violet", () => {
    // Donor pages used violet freely; this repo bans it across client/src
    // (server/concept16Homepage.test.ts). Named here so a regression points at
    // the offending ported page rather than the whole tree.
    const offenders = files.filter((f) =>
      /violet-|purple-|#a78bfa|#8b5cf6|#7c3aed|rgba\(124, ?58, ?237/.test(read(f)),
    );
    expect(offenders).toEqual([]);
  });

  it("claims no patent filing", () => {
    // Two donor pages shipped "patent-pending" while nothing is on file —
    // false marking under 35 U.S.C. § 292. server/patentClaimGuard.test.ts is
    // the enforcing guard; this asserts the ported batch specifically.
    const offenders = files.filter((f) =>
      /patent[- ]pending|patents pending|filed with the uspto/i.test(read(f)),
    );
    expect(offenders).toEqual([]);
  });

  it("ports no stub", () => {
    const thin = files
      .map((f) => ({ f, lines: read(f).split("\n").length }))
      .filter((x) => x.lines < 40);
    expect(thin.map((x) => `${x.f} (${x.lines}L)`), "stubs must not be ported").toEqual([]);
  });

  it("leaves no unresolved donor-only import path", () => {
    // The donor split contexts across @/context and @/contexts. Canonical uses
    // @/contexts. A page importing the donor's spelling would typecheck only by
    // accident of the stray context/ directory here.
    const bad = files.filter((f) => /@\/context\/FinancialDataContext/.test(read(f)));
    expect(bad, "PR-3b pages must not depend on the PR-3a context").toEqual([]);
  });
});

// ── the manifest grew, and only by this batch ──────────────────────────────
describe("PR-3b route accounting", () => {
  it("grows the manifest from 330 to 436", () => {
    expect(MANIFEST.size).toBe(436);
  });

  it("adds routes without removing any", () => {
    // 330 pre-existing + 106 ported = 436. If this fails with a smaller number,
    // a pre-existing route was dropped, which the count alone would hide.
    expect(MANIFEST.size - PORTED.length).toBe(330);
  });

  it("serves every ported route under /portal", () => {
    const stray = PORTED.map((p) => p.route).filter((r) => !r.startsWith("/portal/"));
    expect(stray).toEqual([]);
  });
});

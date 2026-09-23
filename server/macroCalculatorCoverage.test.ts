/**
 * The optional macro scenario reaches every predictive calculator's math.
 *
 * Production port (A22, 2026-09-23) of the archive's coverage test. The
 * archive mounted `useMacroScenario()` and its panel on each of 106 pages; on
 * production the pattern is better and different: one `PredictiveProvider`
 * owns the scenario for the whole portal, `PredictiveFooter` renders the
 * panel under every path in `PREDICTIVE_CALCULATOR_PATHS`, and a page moves
 * its numbers by reading the context (`usePredictive()` or
 * `useCalculatorMacro({ years })`) and applying it (`applyMacro`,
 * `applyMacroYear`, `.averaged` or `.forYear(`).
 *
 * The test is a ratchet: every predictive page either applies the scenario or
 * is named in `MACRO_CALCULATOR_BACKLOG`, and a page that applies it must
 * leave the backlog. Wiring a page therefore means deleting one line from the
 * backlog; un-wiring one fails here. Static: reads source files only.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PREDICTIVE_CALCULATOR_PATHS } from "@shared/predictiveCalculators";
import { MACRO_CALCULATOR_BACKLOG } from "./macroCalculatorBacklog";

const client = join(__dirname, "..", "client", "src");
const read = (p: string) => readFileSync(p, "utf8");

/** route → page file, from `<Route path="…" component={gated(Comp, …)}>` (or `component={Comp}`) and `const Comp = lazy(() => import("…"))` or a static import. */
export function routeFiles(): Map<string, string | null> {
  const app = read(join(client, "App.tsx"));
  const imports = new Map<string, string>();
  for (const m of Array.from(app.matchAll(/const (\w+) = lazy\(\s*\(\) => import\("([^"]+)"\)\s*\)/g))) imports.set(m[1], m[2]);
  for (const m of Array.from(app.matchAll(/import (\w+) from "([^"]+)"/g))) imports.set(m[1], m[2]);
  const out = new Map<string, string | null>();
  for (const m of Array.from(app.matchAll(/<Route path="([^"]+)" component=\{(?:gated\()?(\w+)/g))) {
    if (out.has(m[1])) continue; // first match wins, as in wouter's <Switch>
    const rel = imports.get(m[2]);
    if (!rel) {
      out.set(m[1], null);
      continue;
    }
    const base = join(client, rel.replace(/^\.\//, "").replace(/^@\//, ""));
    const file = [base, base + ".tsx", base + ".ts", join(base, "index.tsx")].find(f => /\.tsx?$/.test(f) && existsSync(f)) ?? null;
    out.set(m[1], file);
  }
  return out;
}

/** Reads the portal scenario and applies it to its own numbers. */
export function appliesMacro(src: string): boolean {
  const reads = /\busePredictive\(|\buseCalculatorMacro\(/.test(src);
  const applies = /\bapplyMacro(Year)?\(|\.averaged\b|\.forYear\(/.test(src);
  return reads && applies;
}

export function coverage() {
  const files = routeFiles();
  const rows = PREDICTIVE_CALCULATOR_PATHS.map(path => {
    const file = files.get(path) ?? null;
    return { path, file, wired: file ? appliesMacro(read(file)) : false };
  });
  return rows;
}

describe("the optional macro scenario on every predictive calculator (ratchet)", () => {
  const rows = coverage();
  const backlog = new Set(MACRO_CALCULATOR_BACKLOG);

  it("every predictive path resolves to a page file through App.tsx", () => {
    expect(rows.length).toBeGreaterThanOrEqual(50);
    const missing = rows.filter(r => !r.file).map(r => r.path);
    expect(missing, `predictive paths without a page file: ${missing.join(", ")}`).toEqual([]);
  });

  it("every page that does not apply the scenario is on the backlog", () => {
    const bare = rows.filter(r => !r.wired && !backlog.has(r.path)).map(r => r.path);
    expect(bare, `apply the scenario or add to server/macroCalculatorBacklog.ts: ${bare.join(", ")}`).toEqual([]);
  });

  it("a page that applies the scenario has left the backlog, and the backlog names only predictive paths", () => {
    const done = rows.filter(r => r.wired && backlog.has(r.path)).map(r => r.path);
    expect(done, `wired — delete these lines from server/macroCalculatorBacklog.ts: ${done.join(", ")}`).toEqual([]);
    const known = new Set(PREDICTIVE_CALCULATOR_PATHS);
    const stale = MACRO_CALCULATOR_BACKLOG.filter(p => !known.has(p));
    expect(stale, `no longer predictive — delete from the backlog: ${stale.join(", ")}`).toEqual([]);
    expect(new Set(MACRO_CALCULATOR_BACKLOG).size).toBe(MACRO_CALCULATOR_BACKLOG.length);
  });

  it("Mortgage Killer, the reference page, applies it", () => {
    expect(rows.find(r => r.path === "/portal/mortgage-killer")?.wired).toBe(true);
  });

  it("the toggle stays optional: neutral outside the provider, collapsed and marked off until a scenario is chosen", () => {
    const hook = read(join(client, "components", "MacroScenarioToggle.tsx"));
    expect(hook).toMatch(/useMacroScenario\(initial: MacroToggles = \{\}/);
    expect(hook).toMatch(/compact=\{opts\.compact \?\? true\}/);
    expect(hook).toMatch(/optional · off/);
    const ctx = read(join(client, "contexts", "PredictiveContext.tsx"));
    expect(ctx).toMatch(/export function useCalculatorMacro\(/);
    expect(ctx).toMatch(/return ctx \?\? NEUTRAL_PREDICTIVE_STATE/);
  });
});

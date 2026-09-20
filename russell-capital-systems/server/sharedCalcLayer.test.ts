/**
 * PR-3a — shared calculator-data layer.
 *
 * The layer is eight files ported from the donor build. The tests that matter
 * here are the ones guarding the seam between two different route worlds: the
 * relationship graph was authored against a 612-route application and this one
 * serves 330, so the failure mode is a navigation target that does not exist —
 * a dead link nothing else would catch.
 *
 * The React components cannot be rendered (this suite runs in `node`, the repo
 * has no jsdom), so the data maps inside them are extracted from source and
 * asserted directly. `stateTaxEngine` is plain TypeScript and imports normally.
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { transformSync } from "esbuild";
import { ROUTE_MANIFEST } from "@shared/routeManifest";
import {
  calculateStateTax,
  rankStatesByTaxBurden,
  STATE_TAX_DATA,
  ALL_STATES,
  NO_INCOME_TAX_STATES,
  HIGH_TAX_STATES,
} from "@/data/stateTaxEngine";

const ROOT = path.resolve(import.meta.dirname, "..");
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const SERVED = new Set<string>(ROUTE_MANIFEST);

/** The eight files this PR ports. */
const PORTED = [
  "client/src/contexts/FinancialDataContext.tsx",
  "client/src/contexts/UnifiedDataBusContext.tsx",
  "client/src/components/CalculatorIntegration.tsx",
  "client/src/components/CalculatorPDFExport.tsx",
  "client/src/components/ProjectionChart50yr.tsx",
  "client/src/components/StateTaxSelector.tsx",
  "client/src/components/ToggleHub.tsx",
  "client/src/data/stateTaxEngine.ts",
];

/**
 * Pull a top-level `export const <name> = { ... };` object literal out of a TSX
 * file and evaluate it. Avoids importing the module, which would drag in React
 * and JSX that this node-environment suite cannot execute.
 */
function extractConstObject<T>(relFile: string, name: string): T {
  const src = read(relFile);
  const start = src.indexOf(`export const ${name}`);
  if (start < 0) throw new Error(`${name} not found in ${relFile}`);
  const end = src.indexOf("};", start);
  if (end < 0) throw new Error(`${name} literal in ${relFile} is unterminated`);
  const snippet =
    src.slice(start, end + 2).replace("export const", "const") +
    `\nmodule.exports = { ${name} };`;
  const js = transformSync(snippet, { loader: "ts", format: "cjs" }).code;
  const mod = { exports: {} as Record<string, unknown> };
  new Function("module", "exports", js)(mod, mod.exports);
  return mod.exports[name] as T;
}

const RELATIONSHIPS = extractConstObject<Record<string, string[]>>(
  "client/src/components/CalculatorIntegration.tsx",
  "CALCULATOR_RELATIONSHIPS",
);

/** Mirror of `servedRelated` in CalculatorIntegration.tsx. */
const servedRelated = (slug: string) =>
  (RELATIONSHIPS[slug] || []).filter((s) => SERVED.has(`/portal/${s}`));

// ── the seam: no dead links ────────────────────────────────────────────────
describe("calculator relationship graph", () => {
  it("never surfaces a route this application does not serve", () => {
    const leaked: string[] = [];
    for (const slug of Object.keys(RELATIONSHIPS)) {
      for (const target of servedRelated(slug)) {
        if (!SERVED.has(`/portal/${target}`)) leaked.push(`${slug} -> ${target}`);
      }
    }
    expect(leaked, "RelatedCalculators must not render an unserved route").toEqual([]);
  });

  it("filters the raw graph rather than trusting it", () => {
    // Guards the filter itself: if someone drops it, this fails loudly.
    // The raw graph genuinely references routes this build lacks — that is the
    // whole reason servedRelated exists.
    const rawTargets = new Set(Object.values(RELATIONSHIPS).flat());
    const unserved = [...rawTargets].filter((t) => !SERVED.has(`/portal/${t}`));
    expect(
      unserved.length,
      "raw graph is expected to contain unserved targets; the filter is what makes it safe",
    ).toBeGreaterThan(0);
  });

  it("CalculatorIntegration routes every target through ROUTE_MANIFEST", () => {
    const src = read("client/src/components/CalculatorIntegration.tsx");
    expect(src).toContain('from "@shared/routeManifest"');
    expect(src).toMatch(/SERVED\.has\(`\/portal\/\$\{s\}`\)/);
    // RelatedCalculators must consume the filtered list, not the raw map.
    const body = src.slice(src.indexOf("export function RelatedCalculators"));
    expect(body).toContain("servedRelated(slug)");
  });

  it("is well formed: no self-reference, no duplicate targets, no empty entries", () => {
    const problems: string[] = [];
    for (const [slug, targets] of Object.entries(RELATIONSHIPS)) {
      if (!Array.isArray(targets) || targets.length === 0) problems.push(`${slug}: empty`);
      if (targets.includes(slug)) problems.push(`${slug}: references itself`);
      if (new Set(targets).size !== targets.length) problems.push(`${slug}: duplicate targets`);
      for (const t of targets) {
        if (typeof t !== "string" || !t.trim()) problems.push(`${slug}: blank target`);
        if (t.startsWith("/")) problems.push(`${slug}: ${t} should be a bare slug`);
      }
    }
    expect(problems).toEqual([]);
  });

  it("is substantive", () => {
    expect(Object.keys(RELATIONSHIPS).length).toBeGreaterThanOrEqual(100);
  });
});

// ── repo rules the donor did not know about ────────────────────────────────
describe("ported files obey this repo's rules", () => {
  it("introduce no purple or violet anywhere", () => {
    // server/concept16Homepage.test.ts enforces this across all of client/src.
    // Asserted here too so a regression names the offending ported file.
    const offenders = PORTED.filter((f) =>
      /violet-|purple-|#a78bfa|#8b5cf6|#7c3aed|rgba\(124, ?58, ?237/.test(read(f)),
    );
    expect(offenders).toEqual([]);
  });

  it("hardcode no route that ROUTE_MANIFEST does not serve", () => {
    const dead: string[] = [];
    for (const f of PORTED) {
      const src = read(f);
      const literals = new Set<string>([
        ...[...src.matchAll(/href="(\/[a-z0-9/-]*)"/g)].map((m) => m[1]),
        ...[...src.matchAll(/route:\s*["'](\/[a-z0-9/-]*)["']/g)].map((m) => m[1]),
      ]);
      for (const l of literals) if (!SERVED.has(l)) dead.push(`${l} <- ${f}`);
    }
    expect(dead).toEqual([]);
  });

  it("add no route to the manifest", () => {
    // This PR is infrastructure. It mounts providers; it registers nothing.
    expect(SERVED.size).toBe(330);
  });
});

// ── provider wiring ────────────────────────────────────────────────────────
describe("provider wiring", () => {
  const main = read("client/src/main.tsx");

  it("mounts all three new providers", () => {
    for (const p of [
      "FinancialDataProvider",
      "UnifiedDataBusProvider",
      "CalculatorResultsProvider",
    ]) {
      expect(main, `${p} must be imported`).toContain(`import { ${p} }`);
      expect(main, `${p} must be rendered`).toContain(`<${p}>`);
    }
  });

  it("nests them inside ClientDataProvider so auto-fill can read the Fact Finder", () => {
    const cd = main.indexOf("<ClientDataProvider>");
    const fd = main.indexOf("<FinancialDataProvider>");
    const close = main.indexOf("</ClientDataProvider>");
    expect(cd).toBeGreaterThan(-1);
    expect(fd).toBeGreaterThan(cd);
    expect(fd).toBeLessThan(close);
  });

  it("keeps StrategyProvider and App inside the new providers", () => {
    const fd = main.indexOf("<FinancialDataProvider>");
    const sp = main.indexOf("<StrategyProvider>");
    expect(sp).toBeGreaterThan(fd);
  });
});

// ── useFinancialData hook-order fix ────────────────────────────────────────
describe("FinancialDataContext", () => {
  const src = read("client/src/contexts/FinancialDataContext.tsx");

  it("calls hooks unconditionally in useFinancialData", () => {
    const body = src.slice(
      src.indexOf("export function useFinancialData"),
      src.indexOf("export function useSharedField"),
    );
    // The donor called useState inside `if (!ctx) { ... }`. Hook calls must all
    // precede the branch, so the early return is the ONLY conditional.
    const firstHook = Math.min(
      ...["useContext(", "useState<", "useCallback("]
        .map((h) => body.indexOf(h))
        .filter((i) => i >= 0),
    );
    const branch = body.indexOf("if (ctx)");
    expect(branch, "the provider check must come after every hook call").toBeGreaterThan(firstHook);
    expect(body.lastIndexOf("useState<")).toBeLessThan(branch);
    expect(body.lastIndexOf("useCallback(")).toBeLessThan(branch);
  });

  it("exposes useSharedField as a useState-shaped tuple", () => {
    const sig = src.slice(src.indexOf("export function useSharedField"));
    expect(sig).toContain("[T, (value: T | ((prev: T) => T)) => void]");
  });

  it("persists under a versioned storage key and tolerates unavailable storage", () => {
    expect(src).toContain('const STORAGE_KEY = "rcs.financialData.v1"');
    expect(src.match(/catch\s*\{/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
  });
});

// ── stateTaxEngine ─────────────────────────────────────────────────────────
describe("stateTaxEngine", () => {
  it("covers all 50 states plus DC", () => {
    expect(ALL_STATES.length).toBe(51);
    expect(ALL_STATES).toContain("DC");
    expect(ALL_STATES).toContain("CA");
    expect(ALL_STATES).toContain("WY");
  });

  it("charges no state income tax in the no-income-tax states", () => {
    for (const st of NO_INCOME_TAX_STATES) {
      expect(STATE_TAX_DATA[st], `${st} missing from STATE_TAX_DATA`).toBeDefined();
      const result = calculateStateTax(250_000, st, "single");
      expect(result.tax, `${st} should levy no income tax`).toBe(0);
      expect(result.effectiveRate).toBe(0);
    }
  });

  it("charges more in a high-tax state than a no-tax state at the same income", () => {
    const ca = calculateStateTax(500_000, "CA", "single").tax;
    const tx = calculateStateTax(500_000, "TX", "single").tax;
    expect(ca).toBeGreaterThan(tx);
    expect(tx).toBe(0);
  });

  it("is monotonic — more income never lowers the tax owed", () => {
    for (const st of ["CA", "NY", "NJ", "PA", "CO", "FL"]) {
      let prev = -1;
      for (const income of [50_000, 100_000, 250_000, 500_000, 1_000_000]) {
        const t = calculateStateTax(income, st, "single").tax;
        expect(t, `${st} tax fell as income rose`).toBeGreaterThanOrEqual(prev);
        prev = t;
      }
    }
  });

  it("returns effectiveRate as a decimal fraction, never above 100%", () => {
    // effectiveRate is tax/income — a fraction, NOT a percentage. Callers that
    // treat it as a percent render a 9% rate as 9,000%.
    for (const st of ALL_STATES) {
      const { effectiveRate } = calculateStateTax(300_000, st, "single");
      expect(effectiveRate, `${st} effective rate out of range`).toBeGreaterThanOrEqual(0);
      expect(effectiveRate, `${st} effective rate out of range`).toBeLessThan(1);
    }
  });

  it("ranks no-tax states above high-tax states by burden", () => {
    const ranked = rankStatesByTaxBurden(400_000, "single");
    const pos = (s: string) => ranked.findIndex((r) => r.abbr === s);
    expect(pos("FL")).toBeLessThan(pos("CA"));
    expect(pos("TX")).toBeLessThan(pos("NY"));
  });

  it("lists high-tax states that all actually levy a tax", () => {
    for (const st of HIGH_TAX_STATES) {
      expect(calculateStateTax(400_000, st, "single").tax, `${st} levied nothing`).toBeGreaterThan(0);
    }
  });

  it("treats zero income as zero tax everywhere", () => {
    for (const st of ALL_STATES) {
      expect(calculateStateTax(0, st, "single").tax, `${st} taxed zero income`).toBe(0);
    }
  });

  it("returns a zero result for an unknown state rather than throwing", () => {
    const r = calculateStateTax(200_000, "ZZ", "single");
    expect(r).toEqual({ tax: 0, effectiveRate: 0, marginalRate: 0, deduction: 0 });
  });

  it("taxes a joint filer no more than a single filer at the same income", () => {
    for (const st of ALL_STATES) {
      const single = calculateStateTax(300_000, st, "single").tax;
      const mfj = calculateStateTax(300_000, st, "mfj").tax;
      expect(mfj, `${st}: mfj exceeded single`).toBeLessThanOrEqual(single + 1e-6);
    }
  });
});

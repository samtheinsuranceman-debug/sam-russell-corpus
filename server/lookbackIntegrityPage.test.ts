/**
 * /portal/lookback-integrity — wired where the owner's rules say every engine
 * page is: a route, the portal navigation, the catalogue (so the shell prints
 * the engine's sources), the policy disclosure, and a badge on the historical
 * page it checks.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { ROUTE_MANIFEST } from "../shared/routeManifest";
import { calculator } from "../shared/calculatorCatalog";
import { ENGINES_WITH_SOURCE_LOADERS, engineForPath } from "../shared/engineSources";
import { policyKindForPath } from "../shared/policyDisclosure";

const root = resolve(__dirname, "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");
const PATH = "/portal/lookback-integrity";

describe("look-back integrity page wiring", () => {
  it("is a route, in the manifest and in the portal navigation", () => {
    expect(read("client/src/App.tsx")).toContain(`<Route path="${PATH}" component={gated(LookbackIntegrity, "${PATH}")} />`);
    expect(ROUTE_MANIFEST).toContain(PATH);
    expect(read("client/src/components/AppShell.tsx")).toContain(`path: "${PATH}"`);
  });

  it("is a catalogue page bound to its engine, whose sources the shell can print", () => {
    expect(calculator(PATH)?.engine).toBe("shared/lookbackIntegrity.ts");
    expect(engineForPath(PATH)).toBe("shared/lookbackIntegrity.ts");
    expect(ENGINES_WITH_SOURCE_LOADERS).toContain("shared/lookbackIntegrity.ts");
  });

  it("carries the life-policy disclosure", () => {
    expect(policyKindForPath(PATH)).toBe("life");
  });

  it("computes nothing itself: every figure comes from the engine", () => {
    const page = read("client/src/pages/portal/LookbackIntegrity.tsx");
    expect(page).toContain('from "@shared/lookbackIntegrity"');
    expect(page).toContain("startYearIntegrity(");
    expect(page).toContain("nationwideIntegrity(");
    expect(page).not.toMatch(/Math\.random/);
  });

  it("puts the integrity badge on the IUL historical page", () => {
    const hist = read("client/src/pages/portal/IULHistoricalPerformance.tsx");
    expect(hist).toContain("<LookbackIntegrityBadge");
    expect(hist).toContain("creditedSeries(RAW_INDEX_RETURNS.SP500");
    const badge = read("client/src/components/LookbackIntegrityBadge.tsx");
    expect(badge).toContain("startYearIntegrity(");
    expect(badge).toContain(`href="${PATH}"`);
  });
});

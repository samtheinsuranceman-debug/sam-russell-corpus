/**
 * /portal/early-cash-value — the page is wired, shows which schedule governs
 * each way money comes out, and carries the disclosure and sources.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import EarlyCashValueView, { explainEarlyCashValue } from "@/components/engines/EarlyCashValueView";
import { EARLY_CASH_VALUE_SOURCES, compareEarlyCashValue, getDefaultEcvInput } from "@shared/earlyCashValue";
import { engineForPath, loadEngineSources } from "@shared/engineSources";
import { policyKindForPath } from "@shared/policyDisclosure";
import { ROUTE_MANIFEST } from "@shared/routeManifest";

const ROUTE = "/portal/early-cash-value";
const root = join(import.meta.dirname, "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");

describe("early cash value page: wiring", () => {
  it("is routed, in the manifest, in the portal menu", () => {
    expect(read("client/src/App.tsx")).toContain(`<Route path="${ROUTE}" component={gated(EarlyCashValue, "${ROUTE}")} />`);
    expect(ROUTE_MANIFEST).toContain(ROUTE);
    expect(read("client/src/components/AppShell.tsx")).toContain(`path: "${ROUTE}"`);
  });

  it("names its engine, and the shell can print that engine's sources", async () => {
    expect(engineForPath(ROUTE)).toBe("shared/earlyCashValue.ts");
    const sources = await loadEngineSources("shared/earlyCashValue.ts");
    expect(sources?.length).toBe(EARLY_CASH_VALUE_SOURCES.length);
    expect(sources!.some(s => s.label.includes("ICC18-NWLA-538"))).toBe(true);
    expect(sources!.some(s => (s.note ?? "").includes("Unverified"))).toBe(true);
  });

  it("carries the life-policy disclosure", () => {
    expect(policyKindForPath(ROUTE)).toBe("life");
  });
});

describe("early cash value page: render", () => {
  const html = renderToStaticMarkup(createElement(EarlyCashValueView));
  const c = compareEarlyCashValue(getDefaultEcvInput());

  it("renders the default loan plan's verdict: the rider changes nothing it does", () => {
    expect(c.riderHelpsThisPlan).toBe(false);
    expect(html).toContain("The rider changes nothing this plan does");
    expect(html).toContain(`$${Math.round(c.totalRiderCost).toLocaleString("en-US")}`);
  });

  it("maps all four ways out to their schedule, and only a non-1035 full surrender to the adjusted one", () => {
    const map = html.slice(html.indexOf('data-testid="ecv-schedule-map"'));
    for (const label of ["Policy loan", "Partial surrender", "Full surrender by 1035 exchange", "Full surrender (not a 1035)"]) expect(map).toContain(label);
    expect((map.match(/>adjusted</g) ?? []).length).toBe(1);
    expect((map.match(/>unadjusted</g) ?? []).length).toBe(3);
  });

  it("labels the rate an assumed crediting rate and prints its sources", () => {
    expect(html).toContain("Assumed crediting rate");
    expect(html).toContain("ICC18-NWLA-538");
  });
});

describe("early cash value page: plain English", () => {
  it("says which schedule governs and what the rider costs, from the engine", () => {
    const input = getDefaultEcvInput();
    const c = compareEarlyCashValue(input);
    const text = explainEarlyCashValue(input, c).join(" ");
    expect(text).toContain("unadjusted schedule governs it, with or without the rider");
    expect(text).toContain(`$${Math.round(c.totalRiderCost).toLocaleString("en-US")} over ${input.years} years`);
    expect(text).toContain("cannot be revoked");
  });

  it("says the rider does change a plain full surrender", () => {
    const input = { ...getDefaultEcvInput(), distributionType: "full_surrender" as const };
    const c = compareEarlyCashValue(input);
    expect(explainEarlyCashValue(input, c).join(" ")).toContain("adjusted schedule governs it and the rider does change it");
  });
});

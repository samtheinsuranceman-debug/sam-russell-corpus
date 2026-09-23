/**
 * /portal/credit-line-sequencing — the page is wired, renders the engine's
 * own numbers, explains them in words, and carries the disclosure and sources.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import CreditLineSequencingView, { explainCreditLineSequence, parseOpenings } from "@/components/engines/CreditLineSequencingView";
import { getDefaultCreditLineInput, runCreditLineSequence, CREDIT_LINE_SEQUENCING_SOURCES } from "@shared/creditLineSequencingEngine";
import { engineForPath, loadEngineSources } from "@shared/engineSources";
import { policyKindForPath } from "@shared/policyDisclosure";
import { ROUTE_MANIFEST } from "@shared/routeManifest";

const ROUTE = "/portal/credit-line-sequencing";
const root = join(import.meta.dirname, "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");

describe("credit-line sequencing page: wiring", () => {
  it("is routed, in the manifest, in the portal menu", () => {
    expect(read("client/src/App.tsx")).toContain(`<Route path="${ROUTE}" component={gated(CreditLineSequencing, "${ROUTE}")} />`);
    expect(ROUTE_MANIFEST).toContain(ROUTE);
    expect(read("client/src/components/AppShell.tsx")).toContain(`path: "${ROUTE}"`);
  });

  it("names its engine, and the shell can print that engine's sources", async () => {
    expect(engineForPath(ROUTE)).toBe("shared/creditLineSequencingEngine.ts");
    const sources = await loadEngineSources("shared/creditLineSequencingEngine.ts");
    expect(sources?.length).toBe(CREDIT_LINE_SEQUENCING_SOURCES.length);
    expect(sources!.every(s => s.label.length > 10 && /^\d{4}-\d{2}/.test(s.asOf ?? ""))).toBe(true);
  });

  it("carries the life-policy disclosure", () => {
    expect(policyKindForPath(ROUTE)).toBe("life");
  });
});

describe("credit-line sequencing page: render", () => {
  const html = renderToStaticMarkup(createElement(CreditLineSequencingView));
  const input = getDefaultCreditLineInput();
  const r = runCreditLineSequence(input);

  it("renders the default household's plan with the engine's own totals", () => {
    expect(r.suitability.suitable).toBe(true);
    expect(html).toContain("Credit-Line Sequencing");
    expect(html).toContain("Suitability gate: passes");
    expect(html).toContain(`$${Math.round(r.totals.aggregateLimit).toLocaleString("en-US")}`);
    expect(html).toContain(`$${Math.round(r.comparison!.peakMonthlyPayoff).toLocaleString("en-US")}`);
    for (const l of r.lines) expect(html).toContain(l.issuerName);
  });

  it("labels the rate an assumed crediting rate, and prints no AG 49 cap", () => {
    expect(html).toContain("Assumed crediting rate");
    expect(html).not.toMatch(/AG\s*49[^<]*max/i);
  });

  it("prints the rules' provenance", () => {
    expect(html).toContain(`Rules as of ${r.provenance.rulesVersion}`);
  });
});

describe("credit-line sequencing page: plain English", () => {
  it("says the burden before the benefit, with the engine's numbers", () => {
    const input = getDefaultCreditLineInput();
    const r = runCreditLineSequence(input);
    const text = explainCreditLineSequence(input, r);
    const burden = text.findIndex(s => s.includes("repaid from cash flow"));
    const benefit = text.findIndex(s => s.includes("policy side"));
    expect(burden).toBeGreaterThan(-1);
    expect(benefit).toBeGreaterThan(burden);
    expect(text.join(" ")).toContain(`${r.totals.hardInquiries} in all`);
    expect(text.join(" ")).toContain(`$${Math.round(r.totals.deployableGross).toLocaleString("en-US")}`);
  });

  it("names the failed checks and shows no sequence for an unsuitable household", () => {
    const input = { ...getDefaultCreditLineInput(), fico: 690 };
    const r = runCreditLineSequence(input);
    const text = explainCreditLineSequence(input, r);
    expect(text[0]).toContain("fails 1 of");
    expect(text[0]).toContain("fico");
    expect(text.join(" ")).toContain("No sequence is shown");
  });

  it("parses recent openings and ignores blanks and out-of-window months", () => {
    expect(parseOpenings("")).toEqual([]);
    expect(parseOpenings("3, 14,, 40, x")).toEqual([3, 14]);
  });
});

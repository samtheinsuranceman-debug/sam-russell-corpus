import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import React from "react";
import { renderToString } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { observable } from "@trpc/server/observable";
import { Router } from "wouter";

/**
 * The 28 routes that crashed on load on 23 Sep 2026 (02_GAP_AUDIT.md section 2),
 * 27 page files. For each page this checks that:
 *  1. type checking is on (no `// @ts-nocheck`), so `tsc` sees the whole file;
 *  2. no array literal has an empty slot (a stray "," line), which crashed two of these pages;
 *  3. the module loads (module-level ReferenceErrors, e.g. EnterpriseAdmin's icons);
 *  4. the page renders to HTML with the app's providers and no server data,
 *     without the error boundary text and without throwing.
 * Server calls never resolve here, so every page renders its loading / empty state.
 */

const PAGES: Array<{ file: string; routes: string[] }> = [
  { file: "EnterpriseAdmin", routes: ["/portal/admin", "/portal/enterprise"] },
  { file: "CollegeAidOptimizer", routes: ["/portal/college-aid"] },
  { file: "LongTermCareHybrid", routes: ["/portal/long-term-care-hybrid"] },
  { file: "PhilanthropyImpactDashboard", routes: ["/portal/philanthropy"] },
  { file: "PrivateCredit", routes: ["/portal/private-credit"] },
  { file: "QualifiedSmallBusinessStock", routes: ["/portal/qsbs"] },
  { file: "OnboardingWizardV2", routes: ["/portal/onboarding-v2"] },
  { file: "BatchIllustration", routes: ["/portal/batch-illustration"] },
  { file: "ReverseHeloc", routes: ["/portal/reverse-heloc"] },
  { file: "ClientSnapshotMap", routes: ["/portal/client-snapshot"] },
  { file: "TaxOpportunityDetector", routes: ["/portal/tax-opportunities"] },
  { file: "TaxReturnUpload", routes: ["/portal/tax-return-upload"] },
  { file: "BatchSlides", routes: ["/portal/batch-slides"] },
  { file: "FinancialVitalsScorecard", routes: ["/portal/financial-vitals"] },
  { file: "AthenePEPlus15", routes: ["/portal/athene-pe-plus15"] },
  { file: "EstateFlowChart", routes: ["/portal/estate-flow"] },
  { file: "FIACollateralStrategy", routes: ["/portal/fia-collateral"] },
  { file: "SalesStoryBuilder", routes: ["/portal/sales-story"] },
  { file: "AuditTimeline", routes: ["/portal/audit-timeline"] },
  { file: "RebalanceAlerts", routes: ["/portal/rebalance"] },
  { file: "StaleDigest", routes: ["/portal/stale-digest"] },
  { file: "CashFlowOptimizer", routes: ["/portal/cash-flow-optimizer"] },
  { file: "IULHistoricalPerformance", routes: ["/portal/iul-historical"] },
  { file: "WealthTransferScorecard", routes: ["/portal/wealth-transfer-scorecard"] },
  { file: "ClientReportGenerator", routes: ["/portal/client-report-generator"] },
  { file: "FBARFATCACompliance", routes: ["/portal/fbar-fatca"] },
  { file: "TimeMachineAG49", routes: ["/portal/time-machine-ag49"] },
];

const pagePath = (file: string) => resolve(__dirname, `../client/src/pages/portal/${file}.tsx`);

/** Minimal browser globals some shared components read during render. */
function installBrowserStubs() {
  const g = globalThis as any;
  // Vitest compiles JSX with the classic runtime; the production build injects React
  // the same way (scripts/react-runtime-inject.mjs).
  g.React ??= React;
  const store = new Map<string, string>();
  const storage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() { return store.size; },
  };
  g.localStorage ??= storage;
  g.sessionStorage ??= storage;
}

async function renderPage(file: string, route: string): Promise<string> {
  const [
    { trpc }, { ClientDataProvider }, { StrategyProvider }, { AccessProvider }, { DisclaimerProvider },
    { ThemeProvider }, { TooltipProvider }, { SiteMapProvider }, { PredictiveProvider }, mod,
  ] = await Promise.all([
    import("../client/src/lib/trpc"),
    import("../client/src/contexts/ClientDataContext"),
    import("../client/src/contexts/StrategyContext"),
    import("../client/src/contexts/AccessContext"),
    import("../client/src/contexts/DisclaimerContext"),
    import("../client/src/contexts/ThemeContext"),
    import("../client/src/components/ui/tooltip"),
    import("../client/src/contexts/SiteMapContext"),
    import("../client/src/contexts/PredictiveContext"),
    import(`../client/src/pages/portal/${file}.tsx`),
  ]);
  const url = new URL(route, "http://localhost");
  (globalThis as any).location = {
    href: url.href, origin: url.origin, pathname: url.pathname, search: url.search, hash: url.hash,
    host: url.host, hostname: url.hostname, protocol: url.protocol,
  };
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  // A link that never answers: every query stays loading, no network is touched.
  const trpcClient = trpc.createClient({ links: [() => () => observable(() => () => {})] });
  const Page = mod.default as React.ComponentType;
  const h = React.createElement;
  // The same provider stack main.tsx and App.tsx put around every route.
  const wrap = (el: React.ReactElement, ...layers: Array<[any, any]>) =>
    layers.reduceRight((child, [C, props]) => h(C, props, child), el);
  const tree = wrap(
    h(Router, { ssrPath: route }, h(Page)),
    [trpc.Provider, { client: trpcClient, queryClient }],
    [QueryClientProvider, { client: queryClient }],
    [AccessProvider, null],
    [DisclaimerProvider, null],
    [ClientDataProvider, null],
    [StrategyProvider, null],
    [ThemeProvider, { defaultTheme: "dark", switchable: true }],
    [TooltipProvider, null],
    [SiteMapProvider, null],
    [PredictiveProvider, null],
  );
  return renderToString(tree);
}

describe("crash pages: the 28 routes that crashed on load (A24)", () => {
  beforeAll(() => installBrowserStubs());

  for (const page of PAGES) {
    describe(`${page.file} (${page.routes.join(", ")})`, () => {
      const source = readFileSync(pagePath(page.file), "utf-8");

      it("is type-checked (no // @ts-nocheck)", () => {
        expect(source.split("\n")[0].trim()).not.toBe("// @ts-nocheck");
      });

      it("has no empty array slots (a line holding only a comma)", () => {
        expect(source.split("\n").filter((l) => l.trim() === ",")).toEqual([]);
      });

      it("loads and exports a component", async () => {
        const mod = await import(`../client/src/pages/portal/${page.file}.tsx`);
        expect(typeof mod.default).toBe("function");
      });

      it("renders without throwing and without the error screen", async () => {
        const html = await renderPage(page.file, page.routes[0]);
        expect(html.length).toBeGreaterThan(200);
        expect(html).not.toMatch(/Something went wrong/i);
      }, 60_000);
    });
  }

  it("the shared calculator hook calls procedures that exist", () => {
    const hook = readFileSync(resolve(__dirname, "../client/src/hooks/useCalculatorIntegration.ts"), "utf-8");
    expect(hook).not.toMatch(/trpc\.complianceAudit\??\.(getScenarios|saveScenario)/);
    expect(hook).toContain("trpc.scenarios.list");
    expect(hook).toContain("trpc.scenarios.save");
  });
});

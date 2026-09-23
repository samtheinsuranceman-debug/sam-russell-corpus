import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import React from "react";
import { renderToString } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { observable } from "@trpc/server/observable";
import { getQueryKey } from "@trpc/react-query";
import { Router } from "wouter";

/**
 * A25b (2026-09-23): the seven crash-list pages that still generated figures with a
 * random-number generator after A24's crash fixes. This checks that
 *  1. none of the seven files calls Math.random any more (code or comment);
 *  2. /portal/audit-timeline renders the workspace activity log (activity.getRecent)
 *     and, with no records, the "No audit entries yet" state;
 *  3. /portal/stale-digest renders the stale clients with their stored fields only
 *     (no invented tier/AUM/score), sums recorded net worth, and renders the same
 *     HTML twice (nothing random left in the render).
 * Query data is placed in the React Query cache before a server render, so the
 * pages render their data state without any network.
 */

const FILES = [
  "StaleDigest", "BatchIllustration", "EnterpriseAdmin", "RebalanceAlerts",
  "SalesStoryBuilder", "AuditTimeline", "FinancialVitalsScorecard",
];
const pagePath = (file: string) => resolve(__dirname, `../client/src/pages/portal/${file}.tsx`);

function installBrowserStubs() {
  const g = globalThis as any;
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

type Seed = (trpc: any, qc: QueryClient) => void;

async function renderPage(file: string, route: string, seed: Seed): Promise<string> {
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
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  seed(trpc, queryClient);
  const trpcClient = trpc.createClient({ links: [() => () => observable(() => () => {})] });
  const Page = mod.default as React.ComponentType;
  const h = React.createElement;
  const wrap = (el: React.ReactElement, ...layers: Array<[any, any]>) =>
    layers.reduceRight((child, [C, props]) => h(C, props, child), el);
  return renderToString(wrap(
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
  ));
}

const text = (html: string) => html.replace(/<!-- -->/g, "").replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ");

describe("A25b: no random figures on the seven crash-list pages", () => {
  beforeAll(() => installBrowserStubs());

  for (const file of FILES) {
    it(`${file}.tsx does not call Math.random`, () => {
      expect(readFileSync(pagePath(file), "utf-8")).not.toMatch(/Math\.random/);
    });
  }

  // Master (#195) rebuilt /portal/audit-timeline on the workspace activity log
  // (activity.getRecent) before this package landed; these two checks carry the
  // package's intent (recorded rows only, an honest empty state, nothing generated)
  // over to that page.
  describe("/portal/audit-timeline reads the workspace activity log", () => {
    const rows = [
      { id: 42, clientId: 7, action: "plan.updated", actorName: "Pat Adviser", summary: "Retirement age changed to 67",
        createdAt: new Date("2026-09-20T15:04:05Z"), clientName: "Avery Stone" },
      { id: 41, clientId: 9, action: "note.added", actorName: null, summary: null,
        createdAt: new Date("2026-09-19T09:00:00Z"), clientName: null },
    ];
    const seedRows = (data: unknown): Seed => (trpc, qc) => {
      qc.setQueryData(getQueryKey(trpc.activity.getRecent, { limit: 200 }, "query"), data);
      qc.setQueryData(getQueryKey(trpc.complianceAlerts.list, { limit: 50 }, "query"), []);
    };

    it("renders each recorded entry: action, client, actor, summary, and the count loaded", async () => {
      const html = text(await renderPage("AuditTimeline", "/portal/audit-timeline", seedRows(rows)));
      expect(html).toContain("plan.updated");
      expect(html).toContain("Avery Stone");
      expect(html).toContain("Pat Adviser");
      expect(html).toContain("Retirement age changed to 67");
      expect(html).toContain("note.added");
      expect(html).toContain("Client #9");
      expect(html).toContain("System");
      expect(html).toMatch(/\b2 Entries loaded\b/);
      // Nothing from the old generator survives.
      expect(html).not.toMatch(/John Doe|192\.168\.|Impact Score|DEV-[A-Z0-9]{4}/);
    }, 60_000);

    it("with no records, says no audit entries exist yet", async () => {
      const html = text(await renderPage("AuditTimeline", "/portal/audit-timeline", seedRows([])));
      expect(html).toContain("No audit entries yet");
      expect(html).toMatch(/\b0 Entries loaded\b/);
    }, 60_000);
  });

  describe("/portal/stale-digest shows stored client fields only", () => {
    const staleClients = [
      { id: 11, name: "Avery Stone", email: "avery@example.com", phone: "555-0101",
        createdAt: new Date("2025-01-02T00:00:00Z"), lastContact: new Date("2026-06-01T00:00:00Z"), daysSinceContact: 114 },
      { id: 12, name: "Blake Rivers", email: null, phone: null,
        createdAt: new Date("2025-03-04T00:00:00Z"), lastContact: new Date("2026-08-01T00:00:00Z"), daysSinceContact: 53 },
    ];
    const clientRecords = [
      { id: 11, name: "Avery Stone", riskTolerance: "moderate", state: "TX", totalNetWorth: "2500000.00" },
      { id: 12, name: "Blake Rivers", riskTolerance: null, state: null, totalNetWorth: null },
    ];
    const seed: Seed = (trpc, qc) => {
      qc.setQueryData(getQueryKey(trpc.staleDigest.preview, { staleDays: 30 }, "query"), { staleClients, staleDays: 30 });
      qc.setQueryData(getQueryKey(trpc.clients.list, undefined, "query"), clientRecords);
    };

    it("renders real rows and the recorded net worth, with no invented tier, AUM or trend", async () => {
      const html = text(await renderPage("StaleDigest", "/portal/stale-digest", seed));
      expect(html).toContain("Avery Stone");
      expect(html).toContain("Blake Rivers");
      expect(html).toContain("Email + phone");
      expect(html).toContain("Recorded Net Worth");
      expect(html).toContain("$2.5M");
      expect(html).toContain("Net worth on record for 1 of 2 stale clients");
      expect(html).not.toMatch(/Platinum|At Risk AUM|\+5\.2%|-2\.1%|\+8\.4%/);
    }, 60_000);

    it("renders the same HTML twice (nothing random in the render)", async () => {
      const a = await renderPage("StaleDigest", "/portal/stale-digest", seed);
      const b = await renderPage("StaleDigest", "/portal/stale-digest", seed);
      expect(a).toBe(b);
    }, 60_000);
  });
});

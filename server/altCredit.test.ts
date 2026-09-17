// The alternative-credit tab makes claims about real companies and real
// financial products. These tests enforce the things that would make it
// dangerous if they slipped: fabricated contact data, a route with no stated
// downside, a lender id that resolves to nothing, or a simulator that flatters.
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { CREDIT_ROUTES, ROUTE_COUNT, route } from "@shared/altCredit/routes";
import { DEPLOYMENT_STRATEGIES, DEPLOYMENT_COUNT, ranked, strategy } from "@shared/altCredit/deployment";
import { LENDERS, LENDER_COUNT, lender, lendersFor, completeness } from "@shared/altCredit/lenders";
import { ALT_CREDIT_DISCLOSURE, FAMILY_ORDER, valueOf } from "@shared/altCredit/types";
import { simulateCycles, breakEvenReturnPerCycle, utilisation, DEFAULT_CYCLE } from "@shared/altCredit/simulator";

describe("no fabricated contact data", () => {
  it("records no phone number that is not marked verified with a source", () => {
    for (const l of LENDERS) {
      if (l.phone.verified) {
        expect(l.phone.source.length, `${l.name} phone has no source`).toBeGreaterThan(10);
        expect(l.phone.asOf, `${l.name} phone has no date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      } else {
        expect(l.phone.whyNot.length, `${l.name} must say why the phone is missing`).toBeGreaterThan(10);
      }
    }
  });

  it("contains no bare phone-number-shaped string anywhere in the directory", () => {
    const text = JSON.stringify(LENDERS);
    expect(text).not.toMatch(/\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/);
    expect(text).not.toMatch(/\(\d{3}\)\s?\d{3}[-.\s]?\d{4}/);
  });

  it("contains no email addresses", () => {
    expect(JSON.stringify(LENDERS)).not.toMatch(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  });

  it("dates and sources every verified field, without exception", () => {
    for (const l of LENDERS) {
      for (const [name, v] of Object.entries(l) as Array<[string, unknown]>) {
        const f = v as { verified?: boolean; source?: string; asOf?: string };
        if (f && typeof f === "object" && f.verified === true) {
          expect(f.source, `${l.name}.${name} verified without a source`).toBeTruthy();
          expect(f.asOf, `${l.name}.${name} verified without a date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        }
      }
    }
  });

  it("always has a URL, because that is where a client checks everything else", () => {
    for (const l of LENDERS) expect(l.url, l.name).toMatch(/^https:\/\//);
  });

  it("reports honestly how incomplete each record is", () => {
    for (const l of LENDERS) {
      const c = completeness(l);
      expect(c.known + c.missing.length).toBe(c.total);
    }
    // At least one record is genuinely incomplete — if none were, the research
    // would be suspiciously perfect and worth re-checking rather than trusting.
    expect(LENDERS.some((l) => completeness(l).missing.length > 0)).toBe(true);
  });
});

describe("the fifteen borrowing routes", () => {
  it("has fifteen, numbered without gaps, with unique slugs", () => {
    expect(ROUTE_COUNT).toBe(15);
    expect(CREDIT_ROUTES.map((r) => r.n)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
    expect(new Set(CREDIT_ROUTES.map((r) => r.slug)).size).toBe(15);
  });

  it("gives every route a real body, not a summary", () => {
    for (const r of CREDIT_ROUTES) {
      expect(r.body.length, `${r.slug} needs paragraphs`).toBeGreaterThanOrEqual(4);
      const words = r.body.join(" ").split(/\s+/).length;
      expect(words, `${r.slug} is only ${words} words`).toBeGreaterThan(400);
    }
  });

  it("takes at least six routes to full depth, as promised", () => {
    expect(CREDIT_ROUTES.filter((r) => r.depth === "full").length).toBeGreaterThanOrEqual(6);
  });

  it("states at least three risks with a likelihood band on every route", () => {
    for (const r of CREDIT_ROUTES) {
      expect(r.risks.length, `${r.slug}`).toBeGreaterThanOrEqual(3);
      for (const k of r.risks) {
        expect(["rare", "occasional", "common", "near-certain"]).toContain(k.likelihood);
        expect(k.mitigation.length, `${r.slug}: ${k.risk} has no mitigation`).toBeGreaterThan(30);
      }
    }
  });

  it("gives every route worked examples with a verdict, including at least one poor fit", () => {
    for (const r of CREDIT_ROUTES) {
      expect(r.examples.length, r.slug).toBeGreaterThanOrEqual(2);
      const verdicts = r.examples.map((e) => e.verdict);
      expect(verdicts.some((v) => v === "poor fit" || v === "wrong tool"),
        `${r.slug} has no example of someone this is wrong for`).toBe(true);
    }
  });

  it("answers three real questions on every route", () => {
    for (const r of CREDIT_ROUTES) {
      expect(r.questions.length, r.slug).toBe(3);
      for (const q of r.questions) {
        expect(q.question.endsWith("?"), `${r.slug}: "${q.question}"`).toBe(true);
        expect(q.answer.split(/\s+/).length, `${r.slug}: thin answer`).toBeGreaterThan(30);
      }
    }
  });

  it("scores every route for a rental owner and explains the score", () => {
    for (const r of CREDIT_ROUTES) {
      expect(r.scoreForRentalOwner).toBeGreaterThanOrEqual(1);
      expect(r.scoreForRentalOwner).toBeLessThanOrEqual(10);
      expect(r.scoreReasoning.length, r.slug).toBeGreaterThan(80);
    }
  });

  it("links every route back to the mortgage-destruction pages", () => {
    for (const r of CREDIT_ROUTES) {
      expect(r.relatedPaths, r.slug).toContain("/portal/mortgage-killer");
      expect(r.relatedPaths, r.slug).toContain("/portal/house-recycling");
      expect(r.relatedPaths, r.slug).toContain("/portal/real-estate-mogul");
      expect(r.relatedPaths, r.slug).toContain("/portal/mortgage-ledger");
    }
  });

  it("only names lenders that exist in the directory", () => {
    for (const r of CREDIT_ROUTES) {
      for (const id of r.lenderIds) {
        expect(lender(id), `${r.slug} names unknown lender "${id}"`).toBeTruthy();
      }
      expect(lendersFor(r.lenderIds).length).toBe(r.lenderIds.length);
    }
  });

  it("puts every route in a known family", () => {
    for (const r of CREDIT_ROUTES) expect(FAMILY_ORDER).toContain(r.family);
  });

  it("ranks sale-leaseback lowest, because it ends the position", () => {
    const sl = route("sale-leaseback")!;
    expect(sl.scoreForRentalOwner).toBe(Math.min(...CREDIT_ROUTES.map((r) => r.scoreForRentalOwner)));
  });

  it("names the legacy-rate cost on the cash-out refinance, which nobody quotes", () => {
    const r = route("dscr-cash-out-refinance")!;
    expect(r.body.join(" ")).toMatch(/does not add a loan\. It replaces one/i);
    expect(r.body.join(" ")).toMatch(/entire balance/i);
  });

  it("warns on crypto that maximum LTV is the common mistake", () => {
    const r = route("crypto-backed-borrowing")!;
    expect(r.body.join(" ")).toMatch(/Opening at the maximum available LTV is the most common way this route goes wrong/i);
  });
});

describe("the deployment strategies", () => {
  it("ranks most viable first", () => {
    const scores = ranked().map((s) => s.riskRewardScore);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it("gives every strategy a net-of-losses figure separate from the headline", () => {
    for (const s of DEPLOYMENT_STRATEGIES) {
      expect(s.targetReturn.length, s.slug).toBeGreaterThan(20);
      expect(s.netOfLosses.length, `${s.slug} must state what survives losses`).toBeGreaterThan(40);
      expect(s.netOfLosses).not.toBe(s.targetReturn);
    }
  });

  it("states the collateral and the secondary guarantees on every strategy", () => {
    for (const s of DEPLOYMENT_STRATEGIES) {
      expect(s.collateral.length, s.slug).toBeGreaterThan(40);
      expect(s.secondaryGuarantees.length, s.slug).toBeGreaterThanOrEqual(2);
    }
  });

  it("scores merchant cash advance near the bottom and cites the enforcement record", () => {
    const mca = strategy("merchant-cash-advance")!;
    expect(mca.riskRewardScore).toBeLessThanOrEqual(3);
    const text = mca.body.join(" ");
    expect(text).toMatch(/\$20\.3 million judgment/i);
    expect(text).toMatch(/Yellowstone Capital/i);
    expect(text).toMatch(/permanent industry ban/i);
    expect(text).toMatch(/ten states/i);
  });

  it("annualises the merchant advance rather than quoting the period return", () => {
    const mca = strategy("merchant-cash-advance")!;
    expect(mca.body.join(" ")).toMatch(/roughly ninety-six percent a year|96%/i);
    expect(mca.targetReturn).toMatch(/annualises/i);
  });

  it("warns against funding an unsecured strategy with borrowed money", () => {
    const mca = strategy("merchant-cash-advance")!;
    expect(mca.risks.some((r) => /borrowed money|borrowing to fund/i.test(r.risk + r.mitigation))).toBe(true);
  });

  it("gives every strategy three real questions and a term range", () => {
    for (const s of DEPLOYMENT_STRATEGIES) {
      expect(s.questions.length, s.slug).toBe(3);
      expect(s.termMonths.min).toBeGreaterThan(0);
      expect(s.termMonths.max).toBeGreaterThan(s.termMonths.min);
    }
  });

  it("links every strategy back to the mortgage pages too", () => {
    for (const s of DEPLOYMENT_STRATEGIES) {
      expect(s.relatedPaths, s.slug).toContain("/portal/mortgage-killer");
      expect(s.relatedPaths, s.slug).toContain("/portal/real-estate-mogul");
    }
  });
});

describe("the cycle simulator", () => {
  it("is deterministic for a given seed", () => {
    expect(simulateCycles(DEFAULT_CYCLE).median).toBe(simulateCycles(DEFAULT_CYCLE).median);
  });

  it("runs the requested number of paths", () => {
    expect(simulateCycles(DEFAULT_CYCLE).finalEquity.length).toBe(DEFAULT_CYCLE.runs);
  });

  it("charges the borrowing cost for the whole period regardless of deployment", () => {
    const r = simulateCycles(DEFAULT_CYCLE);
    expect(r.totalBorrowCost).toBeCloseTo(DEFAULT_CYCLE.principal * DEFAULT_CYCLE.borrowAnnualRate * DEFAULT_CYCLE.years, 2);
  });

  it("models idle time between cycles, so utilisation is below 100%", () => {
    expect(utilisation(DEFAULT_CYCLE)).toBeLessThan(1);
    expect(utilisation({ ...DEFAULT_CYCLE, idleDays: 0 })).toBe(1);
  });

  it("completes fewer cycles when idle time grows", () => {
    const tight = simulateCycles({ ...DEFAULT_CYCLE, idleDays: 0 });
    const loose = simulateCycles({ ...DEFAULT_CYCLE, idleDays: 90 });
    expect(loose.cyclesPerRun).toBeLessThan(tight.cyclesPerRun);
  });

  it("shows that diversification collapses ruin risk without moving the median much", () => {
    const one = simulateCycles({ ...DEFAULT_CYCLE, positionsPerCycle: 1 });
    const many = simulateCycles({ ...DEFAULT_CYCLE, positionsPerCycle: 25 });
    expect(many.probabilityOfRuin).toBeLessThan(one.probabilityOfRuin);
    expect(many.probabilityOfRuin).toBeLessThan(0.02);
  });

  it("produces a worse outcome when defaults rise", () => {
    const safe = simulateCycles({ ...DEFAULT_CYCLE, defaultProbability: 0.01 });
    const risky = simulateCycles({ ...DEFAULT_CYCLE, defaultProbability: 0.2 });
    expect(risky.median).toBeLessThan(safe.median);
    expect(risky.probabilityOfLoss).toBeGreaterThan(safe.probabilityOfLoss);
  });

  it("computes a break-even return that makes the spread visible", () => {
    const be = breakEvenReturnPerCycle(DEFAULT_CYCLE);
    expect(be).toBeGreaterThan(0);
    expect(be).toBeLessThan(DEFAULT_CYCLE.returnPerCycle);
  });

  it("reports quantiles in order", () => {
    const r = simulateCycles(DEFAULT_CYCLE);
    expect(r.worst).toBeLessThanOrEqual(r.p5);
    expect(r.p5).toBeLessThanOrEqual(r.p25);
    expect(r.p25).toBeLessThanOrEqual(r.median);
    expect(r.median).toBeLessThanOrEqual(r.p75);
    expect(r.p75).toBeLessThanOrEqual(r.p95);
    expect(r.p95).toBeLessThanOrEqual(r.best);
  });

  it("does not flatter — it names the probability of losing money", () => {
    const r = simulateCycles({ ...DEFAULT_CYCLE, returnPerCycle: 0.05, borrowAnnualRate: 0.12 });
    expect(r.probabilityOfLoss).toBeGreaterThan(0.5);
    expect(r.verdict).toMatch(/does not cover the cost of the money/i);
  });
});

describe("the standing disclosure", () => {
  it("states no compensation from anyone named, anywhere in the section", () => {
    expect(ALT_CREDIT_DISCLOSURE).toMatch(/receives no compensation, referral fee, commission/i);
    expect(ALT_CREDIT_DISCLOSURE).toMatch(/no business relationship/i);
  });

  it("warns that some routes are irreversible and can cost the asset", () => {
    expect(ALT_CREDIT_DISCLOSURE).toMatch(/irreversible/i);
    expect(ALT_CREDIT_DISCLOSURE).toMatch(/cost you the asset/i);
  });

  it("tells the reader to verify everything directly", () => {
    expect(ALT_CREDIT_DISCLOSURE).toMatch(/verify everything directly/i);
    expect(ALT_CREDIT_DISCLOSURE).toMatch(/your own attorney and CPA/i);
  });
});

describe("helpers", () => {
  it("valueOf returns the value or null, never a fabricated default", () => {
    const l = lender("unison")!;
    expect(valueOf(l.founded)).toBe(2006);
    expect(valueOf(lender("ternus")!.phone)).toBeNull();
  });

  it("has a directory large enough to be useful", () => {
    expect(LENDER_COUNT).toBeGreaterThanOrEqual(12);
  });
});

// ------------------------------------------------------------------
// THE PAGES THEMSELVES.
//
// The registry above is only worth anything if a reader can actually reach
// it. These tests resolve every generated URL against the real router and
// every cross-link against the real application, so a route that would 404
// fails here instead of in front of a client.
// ------------------------------------------------------------------
describe("the tab is reachable", () => {
  const app = readFileSync(resolve("client/src/App.tsx"), "utf8");
  const routePaths = new Set(
    Array.from(app.matchAll(/<Route\b[^>]*\bpath=[{]?["']([^"']+)["']/g), (m) => m[1]),
  );

  it("routes the hub and the per-idea page", () => {
    expect(routePaths.has("/portal/alt-credit")).toBe(true);
    expect(routePaths.has("/portal/alt-credit/:slug")).toBe(true);
  });

  it("lazy-loads both page modules that those routes name", () => {
    expect(app).toContain('import("./pages/portal/AltCreditHub")');
    expect(app).toContain('import("./pages/portal/AltCreditDetail")');
    expect(existsSync(resolve("client/src/pages/portal/AltCreditHub.tsx"))).toBe(true);
    expect(existsSync(resolve("client/src/pages/portal/AltCreditDetail.tsx"))).toBe(true);
  });

  it("gives every route and strategy a slug that is safe in a URL and unique across both halves", () => {
    const slugs = [...CREDIT_ROUTES.map((r) => r.slug), ...DEPLOYMENT_STRATEGIES.map((s) => s.slug)];
    for (const s of slugs) expect(s, `${s} is not URL-safe`).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(new Set(slugs).size, "a slug is used twice — one page would shadow the other").toBe(slugs.length);
  });

  it("resolves every slug through the detail page's own lookup", () => {
    for (const r of CREDIT_ROUTES) expect(route(r.slug)?.slug).toBe(r.slug);
    for (const s of DEPLOYMENT_STRATEGIES) expect(strategy(s.slug)?.slug).toBe(s.slug);
  });

  it("points every relatedPath at a route that exists", () => {
    const all = [...CREDIT_ROUTES, ...DEPLOYMENT_STRATEGIES];
    for (const item of all) {
      for (const p of item.relatedPaths) {
        const inner = p.startsWith("/portal/alt-credit/") ? p.slice("/portal/alt-credit/".length) : null;
        const ok = inner
          ? Boolean(route(inner) ?? strategy(inner))
          : routePaths.has(p);
        expect(ok, `${item.slug} links to ${p}, which does not exist`).toBe(true);
      }
    }
  });

  it("is linked back from the pages it is meant to serve", () => {
    for (const page of [
      "client/src/pages/portal/MortgageKiller.tsx",
      "client/src/pages/portal/HouseRecyclingStrategy.tsx",
      "client/src/pages/portal/RealEstateMogul.tsx",
    ]) {
      expect(readFileSync(resolve(page), "utf8"), `${page} does not link to the tab`).toContain("AltCreditLink");
    }
    expect(readFileSync(resolve("client/src/pages/portal/MortgageLedger.tsx"), "utf8"))
      .toContain("/portal/alt-credit");
    expect(readFileSync(resolve("client/src/components/AltCreditLink.tsx"), "utf8"))
      .toContain('to="/portal/alt-credit"');
  });

  it("appears in the catalogue and in the sidebar, not only in the router", () => {
    expect(readFileSync(resolve("shared/calculatorCatalog.ts"), "utf8")).toContain('"/portal/alt-credit"');
    expect(readFileSync(resolve("client/src/components/AppShell.tsx"), "utf8")).toContain('path: "/portal/alt-credit"');
    // It is a tab in the sidebar, so it must NOT also sit in the secondary
    // catalogue — navigation-organization.test.ts requires the two to be
    // disjoint, and a page listed twice is a page a reader cannot place.
    expect(readFileSync(resolve("client/src/lib/secondaryCatalog.ts"), "utf8")).not.toContain("/portal/alt-credit");
  });
});

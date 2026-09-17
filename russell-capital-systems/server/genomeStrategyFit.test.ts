// The strategy-fit layer turns a genome into something a client acts on, which
// is exactly why it needs restraining. These tests enforce the four things
// that would make it dangerous: a signal on a factor that does not exist, a
// strategy that scores well because nobody asked the questions that would
// have sunk it, a product figure asserted without its status, and an entry
// that explains who it suits without explaining who it harms.
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  STRATEGIES, fitAll, fitStrategy, strategy, highestValueQuestions,
  FAMILY_ORDER, FAMILY_LABEL, FIT_DISCLOSURE, ANSWERED_THRESHOLD,
} from "@shared/genomeStrategyFit";
import { FACTORS, type FactorReading } from "@shared/wealthGenomeFactors";
import { MUTUAL_IUL_CARRIERS } from "@shared/mutualIulCarriers";

const FACTOR_IDS = new Set(FACTORS.map((f) => f.id));

describe("the registry", () => {
  it("carries the strategies the genome is meant to choose between", () => {
    expect(STRATEGIES.length).toBeGreaterThanOrEqual(24);
    const ids = STRATEGIES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id, `${id} is not URL-safe`).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("names a real factor on every single signal", () => {
    for (const s of STRATEGIES) {
      expect(s.signals.length, `${s.id} has no signals`).toBeGreaterThanOrEqual(4);
      for (const sig of s.signals) {
        expect(FACTOR_IDS.has(sig.factorId), `${s.id} signals on ${sig.factorId}, which is not a factor`).toBe(true);
        expect(sig.weight, `${s.id}/${sig.factorId}`).toBeGreaterThan(0);
        expect(sig.weight, `${s.id}/${sig.factorId}`).toBeLessThanOrEqual(1);
        expect(sig.why.length, `${s.id}/${sig.factorId} has no stated reason`).toBeGreaterThan(40);
      }
      const seen = s.signals.map((x) => x.factorId);
      expect(new Set(seen).size, `${s.id} signals twice on one factor`).toBe(seen.length);
    }
  });

  it("names a real factor on every gate that claims to test one", () => {
    for (const s of STRATEGIES) {
      for (const g of s.gates) {
        if (g.factorId) expect(FACTOR_IDS.has(g.factorId), `${s.id}/${g.id}`).toBe(true);
        // A gate with a factor must have a test, and a test must have a factor.
        expect(Boolean(g.factorId), `${s.id}/${g.id}: test without factor`).toBe(Boolean(g.test));
        expect(g.why.length, `${s.id}/${g.id} has no stated reason`).toBeGreaterThan(40);
        if (!g.factorId) expect(g.external, `${s.id}/${g.id} settles nothing and is not marked external`).toBe(true);
      }
    }
  });

  it("says who each strategy is wrong for, not only who it suits", () => {
    for (const s of STRATEGIES) {
      expect(s.whenItIsWrong.length, `${s.id} has no case against`).toBeGreaterThan(120);
      expect(s.whatItIs.length, `${s.id} is not explained`).toBeGreaterThanOrEqual(3);
      expect(s.whatItIs.join(" ").split(/\s+/).length, `${s.id} is too thin`).toBeGreaterThan(120);
      expect(s.oneLine.length, s.id).toBeGreaterThan(30);
    }
  });

  it("states the house position on every one, including the ones it declines", () => {
    for (const s of STRATEGIES) {
      expect(["implements", "implements-with-conditions", "declines", "refers-out"]).toContain(s.housePosition);
      expect(s.housePositionWhy.length, `${s.id} does not say why`).toBeGreaterThan(60);
    }
    // The point of recording a declined strategy is that some are declined.
    // A registry where the firm does everything is a brochure.
    const declined = STRATEGIES.filter((s) => s.housePosition === "declines" || s.housePosition === "refers-out");
    expect(declined.length, "no strategy is declined or referred out — that is not credible").toBeGreaterThanOrEqual(4);
  });

  it("puts every strategy in a family the page can render", () => {
    for (const s of STRATEGIES) {
      expect(FAMILY_ORDER).toContain(s.family);
      expect(FAMILY_LABEL[s.family]).toBeTruthy();
    }
    for (const f of FAMILY_ORDER) {
      expect(STRATEGIES.some((s) => s.family === f), `${f} is an empty family`).toBe(true);
    }
  });
});

describe("product claims are never asserted", () => {
  it("gives every claim a status, a note and, unless confirmed, what would settle it", () => {
    for (const s of STRATEGIES) {
      for (const c of s.claims) {
        expect(["confirmed", "unconfirmed", "needs-correction"]).toContain(c.status);
        expect(c.note.length, `${s.id}: "${c.claim}" has no note`).toBeGreaterThan(80);
        if (c.status !== "confirmed") {
          expect(c.settledBy, `${s.id}: "${c.claim}" is unconfirmed with no way to settle it`).toBeTruthy();
        }
      }
    }
  });

  it("records the figures that came in as sales numbers as unconfirmed rather than as facts", () => {
    const fia = strategy("bonus-fia-short-surrender")!;
    const statuses = fia.claims.map((c) => c.status);
    expect(statuses).not.toContain("confirmed");
    const all = JSON.stringify(fia.claims);
    expect(all).toMatch(/57%/);
    expect(all).toMatch(/not an annualised rate of return/i);
    // The ownership correction is the one that matters for a firm with a
    // mutual-only rule on indexed life, and it must be stated, not implied.
    expect(all).toMatch(/not a mutual company/i);
    expect(all).toMatch(/Apollo/);
  });

  it("marks the mirror account as unverified and refuses to implement it until read", () => {
    const m = strategy("mirror-deposit-account")!;
    expect(m.housePosition).toBe("refers-out");
    expect(m.claims.every((c) => c.status === "unconfirmed")).toBe(true);
    expect(JSON.stringify(m.claims)).toMatch(/must not be repeated to a client/i);
  });

  it("corrects the claims that overstate rather than quietly repeating them", () => {
    const corrected = STRATEGIES.flatMap((s) => s.claims.filter((c) => c.status === "needs-correction"));
    expect(corrected.length, "nothing was corrected, which is not plausible").toBeGreaterThanOrEqual(5);
    const text = JSON.stringify(corrected);
    expect(text).toMatch(/Nothing eliminates it/i);            // the 1031 claim
    expect(text).toMatch(/abusive transactions/i);             // the W-2 elimination claim
    expect(text).toMatch(/is the wrong word/i);                // the "guaranteed" payoff claim
  });

  it("names the mutual carriers the indexed-life strategy depends on, and they are in the registry", () => {
    const iul = strategy("cash-flowing-multiple-iul")!;
    const claim = iul.claims.find((c) => c.claim.includes("Mutual carriers only"))!;
    expect(claim.status).toBe("confirmed");
    expect(claim.settledBy).toContain("mutualIulCarriers");
    for (const name of ["Penn Mutual", "Ameritas", "Omaha", "National Life", "Columbus Life", "MassMutual", "Guardian"]) {
      expect(claim.note, `${name} is named nowhere`).toContain(name);
      expect(
        MUTUAL_IUL_CARRIERS.some((c) => c.name.includes(name.replace("MassMutual", "MassMutual"))),
        `${name} is claimed but absent from the registry`,
      ).toBe(true);
    }
  });
});

describe("scoring", () => {
  const strong: FactorReading[] = [
    { factorId: "time-horizon", score: 2, confidence: 0.9 },
    { factorId: "income-durability", score: 2, confidence: 0.9 },
    { factorId: "insurability", score: 2, confidence: 0.9 },
    { factorId: "tax-posture", score: -2, confidence: 0.9 },
    { factorId: "spending-elasticity", score: 2, confidence: 0.9 },
    { factorId: "cognitive-durability", score: 2, confidence: 0.9 },
    { factorId: "institutional-trust", score: 2, confidence: 0.9 },
    { factorId: "attention-budget", score: 2, confidence: 0.9 },
    { factorId: "liquidity-need", score: 2, confidence: 0.9 },
    { factorId: "longevity-expectation", score: 2, confidence: 0.9 },
    { factorId: "legacy-intent", score: -2, confidence: 0.9 },
  ];

  it("scores an unanswered genome at the midpoint with zero confidence", () => {
    for (const f of fitAll([])) {
      expect(f.fit, f.strategy.id).toBe(50);
      expect(f.confidence, f.strategy.id).toBe(0);
    }
  });

  it("does not let silence count as evidence", () => {
    // The whole integrity of the layer. A strategy must not score well because
    // the factors that argue against it were never asked about.
    const iul = strategy("cash-flowing-multiple-iul")!;
    const onlyFavourable = fitStrategy(iul, [{ factorId: "insurability", score: 2, confidence: 0.9 }]);
    expect(onlyFavourable.fit).toBeGreaterThan(80);
    // ...but it announces that it is built on almost nothing.
    expect(onlyFavourable.confidence).toBeLessThan(0.25);
    expect(onlyFavourable.unanswered.length).toBeGreaterThanOrEqual(6);
  });

  it("moves the fit when a factor the strategy wants is answered the other way", () => {
    const s = strategy("bitcoin-and-crypto")!;
    const calm = fitStrategy(s, [{ factorId: "emotional-durability", score: 2, confidence: 0.9 }]);
    const jumpy = fitStrategy(s, [{ factorId: "emotional-durability", score: -2, confidence: 0.9 }]);
    expect(calm.fit).toBeGreaterThan(jumpy.fit + 40);
  });

  it("reverses correctly for signals that want the low pole", () => {
    // Guaranteed income wants LOW emotional durability: somebody who sells in a
    // drawdown needs a floor more, not less. If this ever inverts, the engine
    // is recommending annuities to the people who least need them.
    const s = strategy("guaranteed-income-for-life-annuity")!;
    const sells = fitStrategy(s, [{ factorId: "emotional-durability", score: -2, confidence: 0.9 }]);
    const holds = fitStrategy(s, [{ factorId: "emotional-durability", score: 2, confidence: 0.9 }]);
    expect(sells.fit).toBeGreaterThan(holds.fit);
  });

  it("blocks on a gate regardless of how well the strategy scores", () => {
    const uninsurable: FactorReading[] = [...strong.filter((r) => r.factorId !== "insurability"),
      { factorId: "insurability", score: -2, confidence: 0.9 }];
    const f = fitStrategy(strategy("cash-flowing-multiple-iul")!, uninsurable);
    expect(f.blocked).toBe(true);
    expect(f.gates.some((g) => g.status === "blocked")).toBe(true);
  });

  it("leaves a gate unknown rather than assuming it, when nothing settles it", () => {
    const f = fitStrategy(strategy("oil-gas-drilling")!, strong);
    expect(f.gates.length).toBeGreaterThanOrEqual(3);
    expect(f.gates.every((g) => g.status === "unknown")).toBe(true);
    expect(f.blocked).toBe(false);
  });

  it("sorts blocked strategies to the end however well they fit", () => {
    const blockedIul: FactorReading[] = [...strong.filter((r) => r.factorId !== "insurability"),
      { factorId: "insurability", score: -2, confidence: 0.9 }];
    const all = fitAll(blockedIul);
    const firstBlocked = all.findIndex((f) => f.blocked);
    if (firstBlocked >= 0) {
      expect(all.slice(firstBlocked).every((f) => f.blocked)).toBe(true);
    }
  });

  it("keeps every fit and confidence inside its range, on every strategy, for every genome", () => {
    for (const readings of [[], strong, strong.map((r) => ({ ...r, score: -r.score }))]) {
      for (const f of fitAll(readings)) {
        expect(f.fit, f.strategy.id).toBeGreaterThanOrEqual(0);
        expect(f.fit, f.strategy.id).toBeLessThanOrEqual(100);
        expect(f.confidence, f.strategy.id).toBeGreaterThanOrEqual(0);
        expect(f.confidence, f.strategy.id).toBeLessThanOrEqual(1);
      }
    }
  });

  it("ignores a reading whose confidence is below the answered threshold", () => {
    const s = strategy("bitcoin-and-crypto")!;
    const whisper = fitStrategy(s, [{ factorId: "emotional-durability", score: 2, confidence: ANSWERED_THRESHOLD - 0.01 }]);
    expect(whisper.fit).toBe(50);
    expect(whisper.unanswered).toContain("Emotional durability");
  });

  it("explains every fit through the sentences that produced it", () => {
    const f = fitStrategy(strategy("alt-credit-arbitrage")!, strong);
    expect(f.drivers.length).toBeGreaterThan(0);
    for (const d of f.drivers) {
      expect(d.why.length).toBeGreaterThan(40);
      expect(d.name).toBeTruthy();
    }
    // Sorted by how much each one actually moved the number.
    const mags = f.drivers.map((d) => Math.abs(d.contribution));
    expect(mags).toEqual([...mags].sort((a, b) => b - a));
  });
});

describe("allocation bands", () => {
  it("answers 'how much' for the strategies where that is the real question", () => {
    const proportional = ["guaranteed-income-for-life-annuity", "guaranteed-tax-free-income-for-life",
      "bitcoin-and-crypto", "direct-equities", "bonds-and-fixed-income", "bonus-fia-short-surrender"];
    for (const id of proportional) {
      expect(strategy(id)!.allocation, `${id} should answer how much`).toBeTruthy();
    }
  });

  it("keeps every band ordered, bounded and explained", () => {
    for (const s of STRATEGIES) {
      if (!s.allocation) continue;
      for (const fit of [0, 25, 50, 75, 100]) {
        const band = s.allocation(fit);
        expect(band.minPct, `${s.id}@${fit}`).toBeGreaterThanOrEqual(0);
        expect(band.maxPct, `${s.id}@${fit}`).toBeGreaterThanOrEqual(band.minPct);
        expect(band.maxPct, `${s.id}@${fit}`).toBeLessThanOrEqual(100);
        expect(band.basis.length, `${s.id} band has no stated basis`).toBeGreaterThan(80);
      }
    }
  });

  it("never lets a volatile position grow into a large allocation at any fit", () => {
    // Bitcoin at a perfect fit is still capped in single digits, because the
    // sizing rule is "a total loss changes nothing structural" and no fit
    // score changes that.
    expect(strategy("bitcoin-and-crypto")!.allocation!(100).maxPct).toBeLessThanOrEqual(10);
    expect(strategy("direct-equities")!.allocation!(100).maxPct).toBeLessThanOrEqual(15);
  });
});

describe("the next question", () => {
  it("ranks the unanswered factor the most strategies are waiting on", () => {
    const qs = highestValueQuestions([], 5);
    expect(qs.length).toBe(5);
    for (const q of qs) {
      expect(q.question.length).toBeGreaterThan(20);
      expect(q.strategiesWaiting).toBeGreaterThan(0);
    }
    const lev = qs.map((q) => q.leverage);
    expect(lev).toEqual([...lev].sort((a, b) => b - a));
  });

  it("stops asking about a factor once it has been answered", () => {
    const top = highestValueQuestions([], 1)[0]!;
    const after = highestValueQuestions([{ factorId: top.factorId, score: 1, confidence: 0.9 }], 5);
    expect(after.some((q) => q.factorId === top.factorId)).toBe(false);
  });
});

describe("the page", () => {
  const app = readFileSync(resolve("client/src/App.tsx"), "utf8");
  const routes = new Set(Array.from(app.matchAll(/<Route\b[^>]*\bpath=[{]?["']([^"']+)["']/g), (m) => m[1]));

  it("is routed and lazy-loaded", () => {
    expect(routes.has("/portal/genome-strategies")).toBe(true);
    expect(app).toContain('import("./pages/portal/GenomeStrategies")');
    expect(existsSync(resolve("client/src/pages/portal/GenomeStrategies.tsx"))).toBe(true);
  });

  it("points every relatedPath at a route that exists", () => {
    for (const s of STRATEGIES) {
      for (const p of s.relatedPaths) {
        expect(routes.has(p), `${s.id} links to ${p}, which does not exist`).toBe(true);
      }
    }
  });

  it("carries the standing disclosure, and the disclosure says the thing that matters", () => {
    expect(FIT_DISCLOSURE).toMatch(/not a recommendation/i);
    expect(FIT_DISCLOSURE).toMatch(/confidence/i);
    expect(FIT_DISCLOSURE).toMatch(/unconfirmed figure is not a figure/i);
    const page = readFileSync(resolve("client/src/pages/portal/GenomeStrategies.tsx"), "utf8");
    expect(page).toContain("FIT_DISCLOSURE");
  });
});

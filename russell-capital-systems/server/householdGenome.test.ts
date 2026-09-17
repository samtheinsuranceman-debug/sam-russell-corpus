// A tool that blends two people's answers and prints an authoritative number is
// a tool one spouse can use to win an argument with the other. These tests
// enforce the four things that stop it being that: consent before output, a
// veto whose force scales with stake, combination rules that are not all
// averages, and a confidence that falls when only one person has answered.
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  ASSET_CLASSES, COMBINATIONS, RULE_LABEL, assetClass, influenceA, vetoStrength,
  pairFactors, pairedReadings, pairingConfidence, frictionPoints, complementarities,
  temperament, consentGiven, PAIRING_DISCLOSURE,
  type Household, type CombinationRule,
} from "@shared/householdGenome";
import { FACTORS, type FactorReading } from "@shared/wealthGenomeFactors";
import { fitAll } from "@shared/genomeStrategyFit";

const FACTOR_IDS = new Set(FACTORS.map((f) => f.id));

const A: FactorReading[] = [
  { factorId: "emotional-durability", score: 1.8, confidence: 0.85 },
  { factorId: "time-horizon", score: 1.5, confidence: 0.85 },
  { factorId: "liquidity-need", score: 1.5, confidence: 0.8 },
  { factorId: "numeracy", score: 2, confidence: 0.9 },
  { factorId: "institutional-trust", score: 1.2, confidence: 0.8 },
  { factorId: "attention-budget", score: 1.5, confidence: 0.85 },
  { factorId: "longevity-expectation", score: 0.5, confidence: 0.6 },
  { factorId: "income-durability", score: 1.5, confidence: 0.85 },
  { factorId: "insurability", score: 1.5, confidence: 0.8 },
];
const B: FactorReading[] = [
  { factorId: "emotional-durability", score: -1.5, confidence: 0.85 },
  { factorId: "time-horizon", score: 0.5, confidence: 0.8 },
  { factorId: "liquidity-need", score: -1.2, confidence: 0.85 },
  { factorId: "numeracy", score: -0.5, confidence: 0.8 },
  { factorId: "institutional-trust", score: -1.8, confidence: 0.85 },
  { factorId: "attention-budget", score: -1.0, confidence: 0.8 },
  { factorId: "longevity-expectation", score: 1.8, confidence: 0.7 },
  { factorId: "income-durability", score: 0.5, confidence: 0.8 },
  { factorId: "insurability", score: 0.5, confidence: 0.6 },
];

const household = (consents: Household["consents"]): Household => ({
  labelA: "Michael", labelB: "Dana", readingsA: A, readingsB: B, consents,
});
const ALL_CONSENTED: Household["consents"] = ASSET_CLASSES.map((a) => ({
  assetClassId: a.id, agreedByA: true, agreedByB: true, asOf: "2026-09-17",
}));

describe("consent is a gate, not a formality", () => {
  it("produces no paired readings at all without both signatures", () => {
    const h = household([]);
    for (const a of ASSET_CLASSES) expect(pairedReadings(h, a.id), a.id).toBeNull();
  });

  it("refuses on one signature as firmly as on none", () => {
    const onlyA = household([{ assetClassId: "home-equity", agreedByA: true, agreedByB: false }]);
    const onlyB = household([{ assetClassId: "home-equity", agreedByA: false, agreedByB: true }]);
    expect(pairedReadings(onlyA, "home-equity")).toBeNull();
    expect(pairedReadings(onlyB, "home-equity")).toBeNull();
    expect(consentGiven({ assetClassId: "x", agreedByA: true, agreedByB: false })).toBe(false);
  });

  it("produces readings once both have agreed", () => {
    const rs = pairedReadings(household(ALL_CONSENTED), "home-equity");
    expect(rs).not.toBeNull();
    expect(rs!.length).toBeGreaterThan(5);
    for (const r of rs!) expect(FACTOR_IDS.has(r.factorId), r.factorId).toBe(true);
  });

  it("honours a split the couple agreed instead of the derived one", () => {
    const h = household([{ assetClassId: "home-equity", agreedByA: true, agreedByB: true, agreedInfluenceA: 0.8 }]);
    expect(pairFactors(h, "home-equity").influence).toBe(0.8);
    expect(pairFactors(household(ALL_CONSENTED), "home-equity").influence).toBe(0.5);
  });
});

describe("influence is derived from title, exposure and dependence", () => {
  it("lands a titled retirement account at three-quarters to its holder", () => {
    // The number a couple usually reaches on their own, arrived at from a
    // principle rather than chosen to match it.
    expect(influenceA(assetClass("individual-retirement-a")!)).toBe(0.75);
    expect(influenceA(assetClass("individual-retirement-b")!)).toBe(0.25);
  });

  it("lands everything genuinely joint at exactly half", () => {
    for (const id of ["home-equity", "joint-cash", "joint-taxable", "rental-joint"]) {
      expect(influenceA(assetClass(id)!), id).toBe(0.5);
    }
  });

  it("weights an operated, personally guaranteed business above a retirement account", () => {
    expect(influenceA(assetClass("business-a")!)).toBeGreaterThan(influenceA(assetClass("individual-retirement-a")!));
  });

  it("pulls a life policy back toward the middle, because the beneficiary bears the loss", () => {
    const policy = influenceA(assetClass("policy-on-a")!);
    expect(policy).toBeGreaterThan(0.5);
    expect(policy).toBeLessThan(0.65);
  });

  it("keeps every class inside the range and explains itself", () => {
    for (const a of ASSET_CLASSES) {
      for (const v of [a.title, a.exposure, a.dependence]) {
        expect(v, a.id).toBeGreaterThanOrEqual(0);
        expect(v, a.id).toBeLessThanOrEqual(1);
      }
      expect(influenceA(a), a.id).toBeGreaterThanOrEqual(0);
      expect(influenceA(a), a.id).toBeLessThanOrEqual(1);
      expect(a.why.length, `${a.id} does not explain its split`).toBeGreaterThan(80);
      expect(a.what.length, a.id).toBeGreaterThan(20);
    }
  });
});

describe("a veto is as strong as the stake behind it", () => {
  it("is absolute on a joint account and partial on a titled one", () => {
    expect(vetoStrength(0.5)).toBe(1);
    expect(vetoStrength(0.75)).toBe(0.5);
    expect(vetoStrength(0.25)).toBe(0.5);
    expect(vetoStrength(1)).toBe(0);
  });

  it("gives the same couple a different reading on his IRA than on the joint account", () => {
    // The whole point of the asset-class layer. If these ever come out equal,
    // the influence weighting has stopped doing anything.
    const h = household(ALL_CONSENTED);
    const ira = pairFactors(h, "individual-retirement-a").paired.find((p) => p.factorId === "emotional-durability")!;
    const joint = pairFactors(h, "joint-cash").paired.find((p) => p.factorId === "emotional-durability")!;
    expect(joint.combined).toBe(-1.5);            // full weakest link
    expect(ira.combined).toBeGreaterThan(joint.combined);
    expect(ira.combined).toBeLessThan(1.8);       // but nowhere near his own reading
  });

  it("moves comfort and overreach with the asset class, not just the factor list", () => {
    const h = household(ALL_CONSENTED);
    const ira = temperament(h, "individual-retirement-a");
    const joint = temperament(h, "joint-cash");
    expect(ira.comfort).toBeGreaterThan(joint.comfort);
    expect(ira.overreach).toBeLessThan(joint.overreach);
  });

  it("never lets an owner's own score be exceeded by the blend on a weakest-link factor", () => {
    const h = household(ALL_CONSENTED);
    for (const a of ASSET_CLASSES) {
      const { paired, influence } = pairFactors(h, a.id);
      for (const p of paired) {
        if (p.rule !== "weakest-link" || p.scoreA === null || p.scoreB === null) continue;
        const owner = influence >= 0.5 ? p.scoreA : p.scoreB;
        const min = Math.min(p.scoreA, p.scoreB);
        expect(p.combined, `${a.id}/${p.factorId}`).toBeLessThanOrEqual(Math.max(owner, min) + 1e-9);
        expect(p.combined, `${a.id}/${p.factorId}`).toBeGreaterThanOrEqual(min - 1e-9);
      }
    }
  });
});

describe("the combination rules", () => {
  it("covers every factor exactly once with a stated reason", () => {
    expect(COMBINATIONS.length).toBe(FACTORS.length);
    const ids = COMBINATIONS.map((c) => c.factorId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of COMBINATIONS) {
      expect(FACTOR_IDS.has(c.factorId), `${c.factorId} is not a factor`).toBe(true);
      expect(RULE_LABEL[c.rule]).toBeTruthy();
      expect(c.why.length, `${c.factorId} does not justify its rule`).toBeGreaterThan(80);
    }
  });

  it("is mostly NOT averages, which is the entire argument of the file", () => {
    const notAveraged = COMBINATIONS.filter((c) => c.rule !== "weighted");
    expect(notAveraged.length).toBeGreaterThanOrEqual(11);
  });

  it("puts the factors that end a plan on weakest link", () => {
    const rule = (id: string): CombinationRule => COMBINATIONS.find((c) => c.factorId === id)!.rule;
    for (const id of ["emotional-durability", "institutional-trust", "liquidity-need", "spending-elasticity", "cognitive-durability"]) {
      expect(rule(id), id).toBe("weakest-link");
    }
  });

  it("puts survival on longest and capability on strongest", () => {
    const rule = (id: string): CombinationRule => COMBINATIONS.find((c) => c.factorId === id)!.rule;
    expect(rule("time-horizon")).toBe("longest");
    expect(rule("longevity-expectation")).toBe("longest");
    expect(rule("numeracy")).toBe("strongest");
    expect(rule("attention-budget")).toBe("strongest");
    expect(rule("insurability")).toBe("owner");
  });

  it("takes the longer horizon, because the money outlives one of them", () => {
    const h = household(ALL_CONSENTED);
    const th = pairFactors(h, "joint-cash").paired.find((p) => p.factorId === "longevity-expectation")!;
    expect(th.combined).toBe(1.8);   // Dana's, not Michael's, and not the mean
    expect(th.complementary).toBe(true);
  });

  it("pools two incomes above either alone without adding them", () => {
    const h = household(ALL_CONSENTED);
    const inc = pairFactors(h, "joint-cash").paired.find((p) => p.factorId === "income-durability")!;
    expect(inc.combined).toBeGreaterThan(1.5);
    expect(inc.combined).toBeLessThan(2.0);
  });
});

describe("friction and complementarity are different things", () => {
  it("ranks friction by what it costs, not by the size of the gap", () => {
    const fp = frictionPoints(household(ALL_CONSENTED), "joint-cash", 5);
    expect(fp.length).toBeGreaterThan(0);
    const sev = fp.map((f) => f.severity);
    expect(sev).toEqual([...sev].sort((a, b) => b - a));
    for (const f of fp) {
      expect(f.gap).toBeGreaterThanOrEqual(1);
      expect(f.conversation.length, `${f.factorId} has no question to put to them`).toBeGreaterThan(60);
      expect(f.reading.length).toBeGreaterThan(40);
    }
  });

  it("never files a complementary difference as friction", () => {
    const h = household(ALL_CONSENTED);
    const frictionIds = new Set(frictionPoints(h, "joint-cash", 21).map((f) => f.factorId));
    for (const c of complementarities(h, "joint-cash")) {
      expect(frictionIds.has(c.factorId), `${c.factorId} is both complementary and friction`).toBe(false);
    }
  });

  it("reads a numeracy gap as an asset and an emotional gap as a risk", () => {
    const h = household(ALL_CONSENTED);
    const paired = pairFactors(h, "joint-cash").paired;
    expect(paired.find((p) => p.factorId === "numeracy")!.complementary).toBe(true);
    expect(paired.find((p) => p.factorId === "emotional-durability")!.complementary).toBe(false);
  });

  it("classifies alignment honestly, including when it cannot", () => {
    const h = household(ALL_CONSENTED);
    for (const p of pairFactors(h, "joint-cash").paired) {
      if (p.scoreA === null || p.scoreB === null) {
        expect(p.alignment, p.factorId).toBe("unknown");
        expect(p.gap).toBeNull();
      } else {
        expect(["aligned", "divergent", "opposed"]).toContain(p.alignment);
      }
    }
  });
});

describe("confidence tells the truth about how much was read", () => {
  it("is zero on an empty household", () => {
    const empty: Household = { labelA: "A", labelB: "B", readingsA: [], readingsB: [], consents: ALL_CONSENTED };
    expect(pairingConfidence(empty).value).toBe(0);
    expect(pairingConfidence(empty).verdict).toMatch(/demonstration of the mechanism/i);
  });

  it("counts a one-sided answer for far less than a two-sided one", () => {
    const both: Household = { labelA: "A", labelB: "B", readingsA: A, readingsB: B, consents: ALL_CONSENTED };
    const oneSided: Household = { labelA: "A", labelB: "B", readingsA: A, readingsB: [], consents: ALL_CONSENTED };
    expect(pairingConfidence(both).value).toBeGreaterThan(pairingConfidence(oneSided).value * 2.5);
    expect(pairingConfidence(oneSided).answeredBoth).toBe(0);
  });

  it("halves the per-factor confidence where only one partner answered", () => {
    const oneSided: Household = { labelA: "A", labelB: "B", readingsA: A, readingsB: [], consents: ALL_CONSENTED };
    const p = pairFactors(oneSided, "joint-cash").paired.find((x) => x.factorId === "numeracy")!;
    expect(p.scoreB).toBeNull();
    expect(p.confidence).toBeCloseTo(0.45, 2);   // 0.9 halved
  });

  it("never reports a confidence outside its range on any household", () => {
    for (const h of [household([]), household(ALL_CONSENTED),
      { labelA: "A", labelB: "B", readingsA: [], readingsB: B, consents: ALL_CONSENTED }]) {
      const c = pairingConfidence(h);
      expect(c.value).toBeGreaterThanOrEqual(0);
      expect(c.value).toBeLessThanOrEqual(1);
      expect(c.verdict.length).toBeGreaterThan(40);
    }
  });
});

describe("it feeds the strategy engine, differently per pot", () => {
  it("scores the same strategies differently on his IRA than on the joint account", () => {
    const h = household(ALL_CONSENTED);
    const ira = fitAll(pairedReadings(h, "individual-retirement-a")!);
    const joint = fitAll(pairedReadings(h, "joint-cash")!);
    const byId = (list: typeof ira, id: string) => list.find((f) => f.strategy.id === id)!.fit;
    // At least one strategy must move, or the pot is not actually an input.
    const moved = ira.some((f) => f.fit !== byId(joint, f.strategy.id));
    expect(moved).toBe(true);
  });

  it("keeps every fit valid on every asset class", () => {
    const h = household(ALL_CONSENTED);
    for (const a of ASSET_CLASSES) {
      for (const f of fitAll(pairedReadings(h, a.id)!)) {
        expect(f.fit, `${a.id}/${f.strategy.id}`).toBeGreaterThanOrEqual(0);
        expect(f.fit, `${a.id}/${f.strategy.id}`).toBeLessThanOrEqual(100);
      }
    }
  });

  it("bounds comfort, appetite and overreach and always explains them", () => {
    const h = household(ALL_CONSENTED);
    for (const a of ASSET_CLASSES) {
      const t = temperament(h, a.id);
      for (const v of [t.comfort, t.appetite]) {
        expect(v, a.id).toBeGreaterThanOrEqual(0);
        expect(v, a.id).toBeLessThanOrEqual(100);
      }
      expect(t.overreach).toBe(Math.max(0, t.appetite - t.comfort));
      expect(t.verdict.length, a.id).toBeGreaterThan(80);
    }
  });
});

describe("the page", () => {
  const app = readFileSync(resolve("client/src/App.tsx"), "utf8");
  const routes = new Set(Array.from(app.matchAll(/<Route\b[^>]*\bpath=[{]?["']([^"']+)["']/g), (m) => m[1]));

  it("is routed and lazy-loaded", () => {
    expect(routes.has("/portal/household-genome")).toBe(true);
    expect(app).toContain('import("./pages/portal/HouseholdGenome")');
    expect(existsSync(resolve("client/src/pages/portal/HouseholdGenome.tsx"))).toBe(true);
  });

  it("carries the disclosure, and the disclosure says what this does not do", () => {
    expect(PAIRING_DISCLOSURE).toMatch(/not an arbitration/i);
    expect(PAIRING_DISCLOSURE).toMatch(/does not predict/i);
    expect(PAIRING_DISCLOSURE).toMatch(/win an argument/i);
    expect(PAIRING_DISCLOSURE).toMatch(/belongs.{0,20}with an attorney/i);
    expect(readFileSync(resolve("client/src/pages/portal/HouseholdGenome.tsx"), "utf8"))
      .toContain("PAIRING_DISCLOSURE");
  });
});

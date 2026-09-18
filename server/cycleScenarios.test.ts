// Eighty scenarios and a memory bank wired into the twelve channels. The risks
// are the same in both: an entry that points at something that does not exist,
// and a registry that quietly stops covering what it claims to cover.
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  SCENARIOS, SCENARIO_COUNT, TIER_ORDER, TIER_LABEL, byTier, scenario,
  usingMechanism, heaviestInfluences, type CombinationTier,
} from "@shared/cycleScenarios";
import { MECHANISM_ORDER, mechanism, INFINITE_BANKING_QUESTIONS, INFINITE_BANKING_DEFINITION } from "@shared/cycleEngine";
import { route } from "@shared/altCredit/routes";
import { strategy } from "@shared/altCredit/deployment";
import {
  MEMORY_GROUPS, MEMORY_GROUP_COUNT, memoryGroup, unwiredGroups,
  registeredModules, memoryBankBlock,
} from "@shared/aiMemoryBank";
import { compositeWorkingMemoryWithInstruments, compactWorkingMemoryWithKnowledge } from "@shared/compositeMind";

const EXPECTED_PER_TIER: Record<CombinationTier, number> = { pair: 20, triple: 20, quad: 20, full: 20 };

describe("the scenario library", () => {
  it("carries twenty scenarios in each of the four tiers", () => {
    expect(SCENARIO_COUNT).toBe(80);
    for (const t of TIER_ORDER) expect(byTier(t).length, t).toBe(EXPECTED_PER_TIER[t]);
  });

  it("gives every scenario a unique id and a real sequence", () => {
    const ids = SCENARIOS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of SCENARIOS) {
      expect(s.sequence.length, `${s.id} has no sequence`).toBeGreaterThanOrEqual(2);
      for (const m of s.sequence) {
        expect(MECHANISM_ORDER, `${s.id} names ${m}, which is not a mechanism`).toContain(m);
        expect(mechanism(m)).toBeTruthy();
      }
      expect(TIER_ORDER).toContain(s.tier);
      expect(TIER_LABEL[s.tier]).toBeTruthy();
    }
  });

  it("matches sequence length to the tier it claims", () => {
    for (const s of SCENARIOS) {
      const distinct = new Set(s.sequence).size;
      if (s.tier === "pair") expect(distinct, s.id).toBeLessThanOrEqual(2);
      if (s.tier === "triple") expect(distinct, s.id).toBeLessThanOrEqual(3);
      if (s.tier === "quad") expect(distinct, s.id).toBeLessThanOrEqual(4);
      if (s.tier === "full") expect(distinct, s.id).toBeGreaterThanOrEqual(4);
    }
  });

  it("explains every scenario rather than labelling it", () => {
    for (const s of SCENARIOS) {
      expect(s.who.length, `${s.id} who`).toBeGreaterThan(40);
      expect(s.bottleneck.length, `${s.id} bottleneck`).toBeGreaterThan(40);
      expect(s.relieves.length, `${s.id} relieves`).toBeGreaterThan(40);
      expect(s.whyThisOrder.length, `${s.id} whyThisOrder`).toBeGreaterThan(60);
      expect(s.interaction.length, `${s.id} interaction`).toBeGreaterThan(60);
      expect(s.emergent.length, `${s.id} emergent`).toBeGreaterThan(60);
      expect(s.watchFor.length, `${s.id} watchFor`).toBeGreaterThan(60);
    }
  });

  it("scores influences inside the scale, with a reason each", () => {
    for (const s of SCENARIOS) {
      expect(s.influences.length, `${s.id} has too few influences`).toBeGreaterThanOrEqual(4);
      for (const i of s.influences) {
        expect(i.score, `${s.id}/${i.factor}`).toBeGreaterThanOrEqual(1);
        expect(i.score, `${s.id}/${i.factor}`).toBeLessThanOrEqual(10);
        expect(i.why.length, `${s.id}/${i.factor} has no reason`).toBeGreaterThan(25);
      }
      const names = s.influences.map((i) => i.factor);
      expect(new Set(names).size, `${s.id} scores a factor twice`).toBe(names.length);
    }
  });

  it("ranks sequences, and includes worse orders rather than only the best", () => {
    // The point of sequenceRank is that people run the lower-ranked orders and
    // should see what they cost. A library of nothing but rank 1 is a brochure.
    const ranks = new Set(SCENARIOS.map((s) => s.sequenceRank));
    expect(ranks.has(1)).toBe(true);
    expect(ranks.size, "every scenario is the best possible order, which is not credible").toBeGreaterThanOrEqual(3);
    expect(byTier("pair")[0]!.sequenceRank).toBe(1);
  });

  it("covers every mechanism across the library", () => {
    for (const m of MECHANISM_ORDER) {
      expect(usingMechanism(m).length, `${m} appears in no scenario`).toBeGreaterThan(5);
    }
  });

  it("names the equity share honestly wherever it is the ignition", () => {
    // The mechanism most likely to be oversold. Every scenario using it must
    // say something about the settlement, because that is the part that gets
    // left out of the pitch.
    for (const s of usingMechanism("equity-share")) {
      const text = `${s.bottleneck} ${s.relieves} ${s.whyThisOrder} ${s.interaction} ${s.emergent} ${s.watchFor} ${s.influences.map((i) => i.why).join(" ")}`;
      expect(text, `${s.id} uses an equity share and never mentions the settlement`)
        .toMatch(/settle|balloon|lump|ten[- ]year|year ten/i);
    }
  });

  it("ranks the heaviest influences across the whole library", () => {
    const top = heaviestInfluences(8);
    expect(top.length).toBe(8);
    for (const t of top) {
      expect(t.appearances).toBeGreaterThan(0);
      expect(t.meanScore).toBeGreaterThanOrEqual(1);
      expect(t.meanScore).toBeLessThanOrEqual(10);
    }
    const weights = top.map((t) => t.appearances * t.meanScore);
    expect(weights).toEqual([...weights].sort((a, b) => b - a));
  });

  it("resolves a scenario by id", () => {
    expect(scenario("p01-velocity-brrrr")?.tier).toBe("pair");
    expect(scenario("nope")).toBeUndefined();
  });
});

describe("the searched questions", () => {
  it("keeps every question under 65 characters", () => {
    expect(INFINITE_BANKING_QUESTIONS.length).toBe(5);
    for (const q of INFINITE_BANKING_QUESTIONS) {
      expect(q.question.length, `"${q.question}" is ${q.question.length} characters`).toBeLessThanOrEqual(65);
      expect(q.question.endsWith("?")).toBe(true);
      expect(q.answer.length, q.question).toBeGreaterThan(200);
    }
  });

  it("makes the correction every reputable source makes", () => {
    const all = INFINITE_BANKING_QUESTIONS.map((q) => q.answer).join(" ");
    // The correction itself, however it is phrased: the counterparty is the
    // insurer and the interest leaves the household. An earlier version of this
    // test pinned one exact wording and failed on a synonym, which tested the
    // phrasing rather than the substance.
    expect(all).toMatch(/borrow(ing)? (from|against)/i);
    expect(all).toMatch(/insurance company|the insurer/i);
    expect(all).toMatch(/not.{0,30}borrowing from yourself|interest goes to the/i);
    expect(all).toMatch(/modified endowment|MEC/i);
    expect(INFINITE_BANKING_DEFINITION.length).toBeGreaterThan(80);
  });
});

describe("the memory bank", () => {
  it("registers the knowledge groups and points at files that exist", () => {
    expect(MEMORY_GROUP_COUNT).toBeGreaterThanOrEqual(24);
    for (const m of registeredModules()) {
      expect(existsSync(resolve(m)), `${m} is registered but not on disk`).toBe(true);
    }
  });

  it("gives every group a rule rather than a description", () => {
    for (const g of MEMORY_GROUPS) {
      expect(g.modules.length, `${g.id} covers no modules`).toBeGreaterThan(0);
      expect(g.knows.length, `${g.id} knows`).toBeGreaterThan(80);
      expect(g.brief.length, `${g.id} brief`).toBeGreaterThan(60);
      expect([1, 2, 3]).toContain(g.priority);
    }
    const ids = MEMORY_GROUPS.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("reports what is registered but not reaching the brain", () => {
    // The audit answer, computed rather than claimed. It is fine for this to be
    // non-empty — what is not fine is not knowing.
    for (const g of unwiredGroups()) expect(g.wired).toBe(false);
    expect(unwiredGroups().length).toBe(MEMORY_GROUPS.filter((g) => !g.wired).length);
  });

  it("covers the engines Sam named by name", () => {
    const wanted = ["nlp-patterns", "tax-engines", "tax-history", "inflation-erosion",
      "zip-appreciation", "cycle-engine", "instruments", "genome", "alt-credit"];
    for (const id of wanted) {
      const g = memoryGroup(id);
      expect(g, `${id} is not registered`).toBeTruthy();
      expect(g!.wired, `${id} is registered but not wired`).toBe(true);
    }
  });

  it("trims by priority rather than by accident", () => {
    const full = memoryBankBlock(3);
    const core = memoryBankBlock(1);
    expect(full.length).toBeGreaterThan(core.length);
    for (const g of MEMORY_GROUPS.filter((x) => x.wired && x.priority === 1)) {
      expect(core, `${g.id} is priority 1 and was trimmed`).toContain(g.name);
    }
    for (const g of MEMORY_GROUPS.filter((x) => x.wired && x.priority === 3)) {
      expect(core.includes(g.name), `${g.id} is priority 3 and survived the trim`).toBe(false);
    }
  });

  it("actually reaches the twelve channels", () => {
    // The whole point. If this ever stops being true the registry is a document
    // rather than a wiring.
    const wired = compositeWorkingMemoryWithInstruments({ text: "hello" }).text;
    expect(wired).toContain("WHAT YOU KNOW");
    for (const g of MEMORY_GROUPS.filter((x) => x.wired)) {
      expect(wired, `${g.id} never reaches the brain`).toContain(g.name);
    }
    const compact = compactWorkingMemoryWithKnowledge({ text: "hello" }).text;
    expect(compact).toContain("WHAT YOU KNOW");
    expect(compact.length).toBeLessThan(wired.length);
  });

  it("tells the channels what to do when a question falls outside everything", () => {
    expect(memoryBankBlock()).toMatch(/Do not fill the gap from memory/i);
  });
});

describe("the page", () => {
  const app = readFileSync(resolve("client/src/App.tsx"), "utf8");
  const routes = new Set(Array.from(app.matchAll(/<Route\b[^>]*\bpath=[{]?["']([^"']+)["']/g), (m) => m[1]));

  it("is routed at the URL people search for", () => {
    expect(routes.has("/portal/infinite-banking")).toBe(true);
    expect(app).toContain('import("./pages/portal/InfiniteBanking")');
    expect(existsSync(resolve("client/src/pages/portal/InfiniteBanking.tsx"))).toBe(true);
  });

  it("points every mechanism relatedPath at a route that exists", () => {
    // Alt-credit detail pages are served by one `:slug` route rather than by a
    // literal path each, so a deep link resolves against the registry instead
    // of against the route table.
    for (const m of MECHANISM_ORDER) {
      for (const p of mechanism(m)!.relatedPaths) {
        if (p.startsWith("/portal/alt-credit/")) {
          const slug = p.slice("/portal/alt-credit/".length);
          expect(routes.has("/portal/alt-credit/:slug"), "the slug route is missing").toBe(true);
          expect(Boolean(route(slug) ?? strategy(slug)), `${m} links to ${p}, which is not a known slug`).toBe(true);
        } else {
          expect(routes.has(p), `${m} links to ${p}, which does not exist`).toBe(true);
        }
      }
    }
  });
});

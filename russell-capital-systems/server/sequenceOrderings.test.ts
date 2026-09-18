// The ordering engine has to be checkable, or it is just an opinion with a
// number stapled to it. Three things are worth enforcing:
//
//   1. The hard rules actually prune. If legalOrderings() returns every
//      permutation, the contract terms are decorative.
//   2. Shares are honest. Annotated shares plus the declared residual must be
//      exactly 100, so the file cannot imply the list is exhaustive.
//   3. The hand-written judgement does not contradict the encoded rules. Each
//      combination's rank-1 pick is checked against plausibility(), which is
//      computed from role fitness and soft rules and never reads sharePct.
import { describe, it, expect } from "vitest";
import {
  COMBINATIONS, ALL_ORDERINGS, TRIPLE_ORDERINGS, QUAD_ORDERINGS, FULL_ORDERINGS,
  ORDER_RULES, ORDERING_COUNT, ROLE_FITNESS,
  orderingsFor, annotatedShare, legalOrderings, rankedOrderings, plausibility,
  isLegal, violations, roleAt, shortLabel, combination, mostLikelyOrderings,
} from "@shared/sequenceOrderings";
import { MECHANISMS, type MechanismId } from "@shared/cycleEngine";

const ALL: MechanismId[] = ["policy-loan", "velocity-heloc", "brrrr-dscr", "equity-share", "seller-wrap"];

describe("the hard rules are contract terms and they prune", () => {
  it("cuts the five-mechanism set from 120 permutations to 40", () => {
    expect(legalOrderings(ALL).length).toBe(40);
  });

  it("forbids a line of credit opened behind an equity-share agreement", () => {
    expect(isLegal(["velocity-heloc", "equity-share"])).toBe(false);
    expect(isLegal(["equity-share", "velocity-heloc"])).toBe(true);
  });

  it("forbids wrapping a property that carries an equity-share agreement", () => {
    expect(isLegal(["seller-wrap", "equity-share"])).toBe(false);
    expect(isLegal(["equity-share", "seller-wrap"])).toBe(true);
  });

  it("leaves combinations without an equity share completely open", () => {
    // No hard rule touches these three, so all six orderings survive. If a
    // future rule prunes one, this fails and the rule gets justified here.
    expect(legalOrderings(["policy-loan", "velocity-heloc", "brrrr-dscr"]).length).toBe(6);
  });

  it("scores an illegal ordering zero rather than ranking it low", () => {
    expect(plausibility(["velocity-heloc", "equity-share"])).toBe(0);
  });

  it("names the rule that an ordering breaks, so a page can explain the refusal", () => {
    const broken = violations(["velocity-heloc", "equity-share"]);
    expect(broken.map((r) => r.id)).toContain("hei-before-line");
    expect(broken[0].why.length).toBeGreaterThan(80);
  });
});

describe("position is a role", () => {
  it("reads first as source, last as sink, everything else as converter", () => {
    expect(roleAt(0, 3)).toBe("source");
    expect(roleAt(1, 3)).toBe("converter");
    expect(roleAt(2, 3)).toBe("sink");
    // A two-mechanism sequence has no middle at all.
    expect(roleAt(0, 2)).toBe("source");
    expect(roleAt(1, 2)).toBe("sink");
  });

  it("rates every mechanism in every role, with a reason for each", () => {
    for (const m of ALL) {
      for (const role of ["source", "converter", "sink"] as const) {
        const f = ROLE_FITNESS[m][role];
        expect(f.fit, `${m} as ${role}`).toBeGreaterThanOrEqual(0);
        expect(f.fit, `${m} as ${role}`).toBeLessThanOrEqual(10);
        expect(f.meaning.length, `${m} as ${role} has no explanation`).toBeGreaterThan(60);
      }
    }
  });

  it("holds the asymmetries that make reordering matter at all", () => {
    // If these ever equalise, order stops changing the answer and this whole
    // file is pointless — so they are asserted rather than assumed.
    expect(ROLE_FITNESS["velocity-heloc"].source.fit).toBeGreaterThan(ROLE_FITNESS["velocity-heloc"].sink.fit);
    expect(ROLE_FITNESS["equity-share"].source.fit).toBeGreaterThan(ROLE_FITNESS["equity-share"].sink.fit);
    expect(ROLE_FITNESS["policy-loan"].sink.fit).toBeGreaterThan(ROLE_FITNESS["policy-loan"].source.fit);
    expect(ROLE_FITNESS["brrrr-dscr"].converter.fit).toBeGreaterThan(ROLE_FITNESS["brrrr-dscr"].source.fit);
  });
});

describe("the annotated orderings", () => {
  it("covers 16 combinations with 42 orderings", () => {
    expect(COMBINATIONS.length).toBe(16);
    expect(ORDERING_COUNT).toBe(42);
    expect(ALL_ORDERINGS.length).toBe(TRIPLE_ORDERINGS.length + QUAD_ORDERINGS.length + FULL_ORDERINGS.length);
  });

  it("gives every combination at least one ordering", () => {
    const empty = COMBINATIONS.filter((c) => orderingsFor(c.id).length === 0);
    expect(empty.map((c) => c.id)).toEqual([]);
  });

  it("annotates only orderings the contract terms permit", () => {
    const illegal = ALL_ORDERINGS.filter((o) => !isLegal(o.order));
    expect(illegal.map((o) => `${o.comboId}: ${o.order.join(">")}`)).toEqual([]);
  });

  it("uses exactly the members of its combination, no more and no fewer", () => {
    for (const o of ALL_ORDERINGS) {
      const c = combination(o.comboId)!;
      expect([...o.order].sort(), `${o.comboId} ${o.order.join(">")}`).toEqual([...c.members].sort());
    }
  });

  it("sums annotated shares and the declared residual to exactly 100", () => {
    for (const c of COMBINATIONS) {
      expect(annotatedShare(c.id) + c.residualPct, `${c.id} (${c.name})`).toBe(100);
    }
  });

  it("declares a non-zero residual everywhere, because no list here is exhaustive", () => {
    for (const c of COMBINATIONS) expect(c.residualPct, c.id).toBeGreaterThan(0);
  });

  it("ranks contiguously from 1 within each combination", () => {
    for (const c of COMBINATIONS) {
      const ranks = orderingsFor(c.id).map((o) => o.rank);
      expect(ranks, c.id).toEqual(ranks.map((_, i) => i + 1));
    }
  });

  it("orders shares to agree with ranks — rank 1 cannot have the smallest share", () => {
    for (const c of COMBINATIONS) {
      const os = orderingsFor(c.id);
      for (let i = 1; i < os.length; i++) {
        expect(os[i - 1].sharePct, `${c.id} rank ${i} vs ${i + 1}`).toBeGreaterThanOrEqual(os[i].sharePct);
      }
    }
  });

  it("does not let the hand-written top pick contradict the encoded rules", () => {
    // plausibility() never reads sharePct. If a judgement call disagrees badly
    // with the role fitness and soft rules, one of the two is wrong and this
    // is where that argument has to be settled.
    for (const c of COMBINATIONS) {
      const top = orderingsFor(c.id).find((o) => o.rank === 1)!;
      const ranked = rankedOrderings(c.members);
      const index = ranked.findIndex((r) => r.order.join() === top.order.join());
      expect(index, `${c.id}: top pick ${top.order.join(">")} ranks ${index + 1}/${ranked.length} by the rules`)
        .toBeLessThan(Math.ceil(ranked.length / 2));
    }
  });

  it("keeps confidence and likelihood in range and separate", () => {
    for (const o of ALL_ORDERINGS) {
      expect(o.confidence).toBeGreaterThanOrEqual(1);
      expect(o.confidence).toBeLessThanOrEqual(10);
      expect(o.likelihood).toBeGreaterThanOrEqual(1);
      expect(o.likelihood).toBeLessThanOrEqual(10);
    }
    // The point of two numbers is that they differ. If they were always equal
    // we would have one number wearing two labels.
    expect(ALL_ORDERINGS.some((o) => o.confidence !== o.likelihood)).toBe(true);
  });

  it("carries a high-share, low-likelihood ordering, which is the shape marketing hides", () => {
    const shaped = ALL_ORDERINGS.filter((o) => o.sharePct >= 50 && o.likelihood <= 3);
    expect(shaped.length, "no 'right for its situation, rare situation' ordering exists").toBeGreaterThan(3);
  });

  it("writes real content into every field", () => {
    for (const o of ALL_ORDERINGS) {
      const where = `${o.comboId} ${o.order.join(">")}`;
      expect(o.shinesWhen.length, where).toBeGreaterThanOrEqual(1);
      for (const s of o.shinesWhen) expect(s.length, `${where} shinesWhen`).toBeGreaterThan(40);
      expect(o.failsWhen.length, `${where} failsWhen`).toBeGreaterThan(60);
      expect(o.emergent.length, `${where} emergent`).toBeGreaterThan(40);
    }
  });

  it("gives the top ordering of the full five-mechanism set five worked situations", () => {
    const top = orderingsFor("F1").find((o) => o.rank === 1)!;
    expect(top.shinesWhen.length).toBe(5);
  });
});

describe("helpers the pages depend on", () => {
  it("labels a sequence with the short names a reader recognises", () => {
    expect(shortLabel(["velocity-heloc", "brrrr-dscr"])).toBe("Velocity → BRRRR");
  });

  it("sorts most-likely by likelihood rather than by share", () => {
    const top = mostLikelyOrderings(5);
    for (let i = 1; i < top.length; i++) {
      expect(top[i - 1].likelihood).toBeGreaterThanOrEqual(top[i].likelihood);
    }
  });

  it("names only real mechanisms in every rule and combination", () => {
    const ids = new Set(MECHANISMS.map((m) => m.id));
    for (const r of ORDER_RULES) {
      expect(ids.has(r.before), r.id).toBe(true);
      expect(ids.has(r.after), r.id).toBe(true);
    }
    for (const c of COMBINATIONS) for (const m of c.members) expect(ids.has(m), c.id).toBe(true);
  });

  it("keeps every combination's id unique", () => {
    expect(new Set(COMBINATIONS.map((c) => c.id)).size).toBe(COMBINATIONS.length);
  });
});

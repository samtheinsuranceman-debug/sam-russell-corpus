// A registry that names real companies and describes real financial products
// has to be held to a higher standard than most files here: a missing weakness
// or an invented contact detail is a genuine harm, not a bug.
import { describe, it, expect } from "vitest";
import {
  LIQUIDITY_ROUTES, LIQUIDITY_ROUTE_COUNT, FAMILY_ORDER, FAMILY_LABELS, LIQUIDITY_DISCLOSURE,
  route, byFamily, noMonthlyPayment, preservesFirstMortgage,
} from "@shared/liquidityRoutes";

describe("the registry's shape", () => {
  it("carries more than the twelve asked for", () => {
    expect(LIQUIDITY_ROUTE_COUNT).toBeGreaterThanOrEqual(12);
    expect(LIQUIDITY_ROUTES.map((r) => r.n)).toEqual(Array.from({ length: LIQUIDITY_ROUTE_COUNT }, (_, i) => i + 1));
  });

  it("has unique ids and names", () => {
    expect(new Set(LIQUIDITY_ROUTES.map((r) => r.id)).size).toBe(LIQUIDITY_ROUTE_COUNT);
    expect(new Set(LIQUIDITY_ROUTES.map((r) => r.name)).size).toBe(LIQUIDITY_ROUTE_COUNT);
  });

  it("puts every route in a known family and leaves no family empty", () => {
    for (const r of LIQUIDITY_ROUTES) expect(FAMILY_ORDER).toContain(r.family);
    for (const f of FAMILY_ORDER) {
      expect(byFamily(f).length, f).toBeGreaterThan(0);
      expect(FAMILY_LABELS[f]).toBeTruthy();
    }
  });
});

describe("every route states its downside", () => {
  it("gives each route at least three weaknesses — a route with none has not been thought about", () => {
    for (const r of LIQUIDITY_ROUTES) {
      expect(r.weaknesses.length, `${r.name} needs weaknesses`).toBeGreaterThanOrEqual(3);
      for (const w of r.weaknesses) expect(w.length, `${r.name}: thin weakness`).toBeGreaterThan(40);
    }
  });

  it("gives each route at least three strengths, so the comparison is fair both ways", () => {
    for (const r of LIQUIDITY_ROUTES) expect(r.strengths.length, r.name).toBeGreaterThanOrEqual(3);
  });

  it("names who each route is WRONG for, as plainly as who it suits", () => {
    for (const r of LIQUIDITY_ROUTES) {
      expect(r.bestFor.length, r.name).toBeGreaterThan(40);
      expect(r.wrongFor.length, `${r.name} must say who should not do this`).toBeGreaterThan(30);
    }
  });

  it("gives each route a diligence question — the thing to ask before signing", () => {
    for (const r of LIQUIDITY_ROUTES) expect(r.diligence.length, r.name).toBeGreaterThan(40);
  });

  it("explains the mechanism and the steps rather than only naming the product", () => {
    for (const r of LIQUIDITY_ROUTES) {
      expect(r.mechanism.length, r.name).toBeGreaterThan(60);
      expect(r.howItWorks.length, r.name).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("the dangerous ones lead with the danger", () => {
  it("warns that a share-of-total-value agreement can cost more than it paid", () => {
    const r = route("home-equity-investment")!;
    expect(r.weaknesses[0]).toMatch(/owe substantially more than you received/i);
    expect(r.diligence).toMatch(/whole value of the home, or only to the change in value/i);
  });

  it("says plainly that a sale-leaseback ends ownership and is irreversible", () => {
    const r = route("sale-leaseback")!;
    expect(r.weaknesses.join(" ")).toMatch(/no longer the owner/i);
    expect(r.weaknesses.join(" ")).toMatch(/irreversible/i);
    expect(r.weaknesses.join(" ")).toMatch(/taxable event/i);
  });

  it("warns that a wraparound triggers the due-on-sale clause", () => {
    expect(route("seller-financing")!.weaknesses.join(" ")).toMatch(/due-on-sale clause/i);
  });

  it("warns that a prohibited transaction can disqualify an entire retirement account", () => {
    expect(route("self-directed-retirement")!.weaknesses.join(" ")).toMatch(/disqualify the entire account/i);
  });

  it("warns that a policy loan left unpaid can lapse the policy and tax gain never received", () => {
    expect(route("policy-loan")!.weaknesses.join(" ")).toMatch(/lapsed policy.*taxable event|taxable event.*never received/i);
  });

  it("warns that a securities line gets called exactly when markets are worst", () => {
    expect(route("securities-based")!.weaknesses[0]).toMatch(/maintenance call/i);
  });

  it("names the hidden cost of a cash-out refinance: the legacy rate surrendered", () => {
    const r = route("dscr-cash-out")!;
    expect(r.weaknesses.join(" ")).toMatch(/legacy rate/i);
    expect(r.wrongFor).toMatch(/sub-4 percent/i);
  });

  it("warns that a blanket loan puts every property at risk, not just one", () => {
    expect(route("blanket-portfolio")!.weaknesses[0]).toMatch(/every property in it at risk/i);
  });

  it("says hard money is the most expensive route on the list", () => {
    expect(route("private-hard-money")!.weaknesses[0]).toMatch(/most expensive/i);
  });
});

describe("providers are named honestly or not at all", () => {
  it("gives every named provider a real URL and a note about what it actually does", () => {
    for (const r of LIQUIDITY_ROUTES) {
      for (const p of r.providers) {
        expect(p.url, `${r.name}/${p.name}`).toMatch(/^https:\/\//);
        expect(p.note.length, `${r.name}/${p.name} needs a note`).toBeGreaterThan(40);
      }
    }
  });

  it("records NO phone numbers — an unverifiable number is worse than none", () => {
    const text = JSON.stringify(LIQUIDITY_ROUTES);
    expect(text).not.toMatch(/\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/);
    expect(text).not.toMatch(/\(\d{3}\)\s?\d{3}[-.\s]?\d{4}/);
  });

  it("records no email addresses either, for the same reason", () => {
    expect(JSON.stringify(LIQUIDITY_ROUTES)).not.toMatch(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  });

  it("leaves providers empty rather than inventing one where research found no specific firm", () => {
    // These four are categories rather than branded products; naming a single
    // company would misrepresent a market of thousands.
    for (const id of ["private-hard-money", "seller-financing", "self-directed-retirement", "note-hypothecation"]) {
      expect(route(id)!.providers.length, id).toBe(0);
    }
  });

  it("dates every route, so a stale description is visible rather than silent", () => {
    for (const r of LIQUIDITY_ROUTES) expect(r.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("uses null rather than a made-up figure where no cost or speed was published", () => {
    for (const r of LIQUIDITY_ROUTES) {
      if (r.typicalCost !== null) expect(typeof r.typicalCost).toBe("string");
      if (r.typicalSpeed !== null) expect(typeof r.typicalSpeed).toBe("string");
    }
    expect(LIQUIDITY_ROUTES.some((r) => r.typicalCost === null)).toBe(true);
  });
});

describe("the disclosure", () => {
  it("states there is no compensation from anyone named", () => {
    expect(LIQUIDITY_DISCLOSURE).toMatch(/receives no compensation, referral fee/i);
  });

  it("states it is not a recommendation and not an offer of credit", () => {
    expect(LIQUIDITY_DISCLOSURE).toMatch(/not a recommendation/i);
    expect(LIQUIDITY_DISCLOSURE).toMatch(/not an offer of credit/i);
  });

  it("tells the reader to confirm with their own attorney and CPA", () => {
    expect(LIQUIDITY_DISCLOSURE).toMatch(/your own attorney and CPA/i);
  });
});

describe("filtering for the question actually being asked", () => {
  it("finds the routes that create no monthly payment", () => {
    const ids = noMonthlyPayment().map((r) => r.id);
    expect(ids).toContain("home-equity-investment");
    expect(ids).toContain("policy-loan");
    expect(ids).not.toContain("dscr-cash-out");
  });

  it("finds the routes that leave a cheap first mortgage alone", () => {
    const ids = preservesFirstMortgage().map((r) => r.id);
    expect(ids).toContain("dscr-second");
    expect(ids).toContain("securities-based");
    expect(ids).not.toContain("dscr-cash-out");
  });

  it("returns undefined for an unknown id rather than a default route", () => {
    expect(route("nope")).toBeUndefined();
  });
});

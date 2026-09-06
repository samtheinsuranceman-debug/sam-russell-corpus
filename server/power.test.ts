// ============================================================
// The power layer: the verified control record, lever shares, the
// conditional base rates, the feed parsers (fixtures), the market readers,
// and the trajectory with the power term.
// ============================================================
import { describe, expect, it } from "vitest";
import { CONTROL, DEM_LEVER_SHARE, MIN_WINDOWS, baseRateFor, bucketOf, conditionalWindowStats, controlAt, demLeverShare } from "@shared/powerHistory";
import { TOP_MARGINAL_RATE, windowStats } from "@shared/taxHistory";
import { HORIZONS, conditionalOddsTable, expectedShareOver, longRunLeverShare, taxTrajectory } from "@shared/erosion";
import { parseCsv, parseJudges, parseKalshi, parseLegislators, parsePolymarket, inflationByControl } from "./power";

describe("the control record", () => {
  it("is continuous from 1945 to 2026 and matches the official record at the anchor years", () => {
    for (let i = 1; i < CONTROL.length; i += 1) expect(CONTROL[i]!.year - CONTROL[i - 1]!.year).toBe(1);
    expect(controlAt(1947)).toMatchObject({ president: "D", senate: "R", house: "R", trifecta: null }); // 80th Congress
    expect(controlAt(1953)).toMatchObject({ president: "R", senate: "R", house: "R", trifecta: "R" });  // 83rd
    expect(controlAt(1965)).toMatchObject({ president: "D", senate: "D", house: "D", trifecta: "D" });  // 89th
    expect(controlAt(1981)).toMatchObject({ president: "R", senate: "R", house: "D" });                 // 97th
    expect(controlAt(1993)).toMatchObject({ trifecta: "D" });
    expect(controlAt(1995)).toMatchObject({ president: "D", senate: "R", house: "R" });                 // 104th
    expect(controlAt(2001)).toMatchObject({ president: "R", senate: "D", house: "R" });                 // Jeffords, June 2001
    expect(controlAt(2003)).toMatchObject({ trifecta: "R" });
    expect(controlAt(2009)).toMatchObject({ trifecta: "D" });
    expect(controlAt(2011)).toMatchObject({ president: "D", senate: "D", house: "R" });
    expect(controlAt(2015)).toMatchObject({ senate: "R", house: "R" });
    expect(controlAt(2019)).toMatchObject({ president: "R", senate: "R", house: "D" });
    expect(controlAt(2021)).toMatchObject({ trifecta: "D" });                                            // 50–50 Senate, Democratic VP
    expect(controlAt(2023)).toMatchObject({ president: "D", senate: "D", house: "R" });
    expect(controlAt(2025)).toMatchObject({ trifecta: "R" });
    expect(controlAt(1900)).toBeNull();
  });
  it("scores the levers president ½, Senate ¼, House ¼", () => {
    expect(demLeverShare(2021)).toBe(1);
    expect(demLeverShare(2025)).toBe(0);
    expect(demLeverShare(2023)).toBe(0.75);
    expect(demLeverShare(1981)).toBe(0.25);
    expect(bucketOf(0.75)).toBe("left"); expect(bucketOf(0.5)).toBe("divided"); expect(bucketOf(0.25)).toBe("right");
    expect(DEM_LEVER_SHARE.length).toBe(CONTROL.length);
    const lr = longRunLeverShare();
    expect(lr).toBeGreaterThan(0.4); expect(lr).toBeLessThan(0.7);
  });
  it("partitions every window into left / divided / right and reproduces the unconditional rate for 'all'", () => {
    for (const h of HORIZONS) {
      const all = conditionalWindowStats(TOP_MARGINAL_RATE, h, "all");
      const u = windowStats(TOP_MARGINAL_RATE, h, 1946);
      expect(all.windows).toBe(u.windows); expect(all.pUp).toBe(u.pUp);
      const l = conditionalWindowStats(TOP_MARGINAL_RATE, h, "left"), d = conditionalWindowStats(TOP_MARGINAL_RATE, h, "divided"), r = conditionalWindowStats(TOP_MARGINAL_RATE, h, "right");
      expect(l.windows + d.windows + r.windows).toBe(all.windows);
      for (const x of [l, d, r]) { expect(x.pUp + x.pDown + x.pFlat).toBeCloseTo(x.windows ? 1 : 0, 2); expect(x.meanShare >= 0 && x.meanShare <= 1).toBe(true); }
    }
    const table = conditionalOddsTable();
    expect(table.length).toBe(HORIZONS.length);
    expect(table[0]!.minWindows).toBe(MIN_WINDOWS);
  });
  it("falls back to the unconditional rate when a bucket is thin, and reports which it used", () => {
    const thin = baseRateFor(TOP_MARGINAL_RATE, 40, 1); // 40-year windows fully left-held: few
    const wide = baseRateFor(TOP_MARGINAL_RATE, 5, 0.5);
    expect(thin.fellBack || thin.used.windows >= MIN_WINDOWS).toBe(true);
    if (thin.fellBack) expect(thin.used.bucket).toBe("all");
    expect(wide.bucket).toBe("divided");
  });
});

describe("the expected share and the trajectory with the power term", () => {
  const power = { shareToday: 0, expectedShareNext: 0.6, seatedYear: 2027, longRunShare: 0.5 };
  it("averages today's holders, the market-implied holders for one term, then the long run", () => {
    expect(expectedShareOver(power, 2026, 1)).toBe(0);                       // 2026 only: today's holders
    expect(expectedShareOver(power, 2026, 5)).toBeCloseTo((0 + 0.6 * 4) / 5, 6); // 2026 + 2027–30
    expect(expectedShareOver(power, 2026, 10)).toBeCloseTo((0 + 0.6 * 4 + 0.5 * 5) / 10, 6);
  });
  it("adds the power point to every horizon and the swing is left minus right", () => {
    const pts = taxTrajectory({ startYear: 2026, claims: [], totalPanelWeight: 0, power });
    for (const p of pts) {
      expect(p.power).not.toBeNull();
      expect(p.power!.powerSwing).toBeCloseTo(p.power!.pHigherIfLeft - p.power!.pHigherIfRight, 3);
      expect(p.pHigher).toBeGreaterThanOrEqual(0); expect(p.pHigher).toBeLessThanOrEqual(1);
      if (!p.power!.fellBack) expect(p.power!.windows).toBeGreaterThanOrEqual(MIN_WINDOWS);
    }
    const bare = taxTrajectory({ startYear: 2026, claims: [], totalPanelWeight: 0 });
    expect(bare[0]!.power).toBeNull();
  });
});

describe("feed parsers", () => {
  it("counts Congress by party from the current-members file", () => {
    const data = [
      { terms: [{ type: "rep", party: "Democrat", start: "2019-01-03" }, { type: "sen", party: "Democrat", start: "2025-01-03" }] },
      { terms: [{ type: "sen", party: "Republican" }] }, { terms: [{ type: "sen", party: "Independent" }] },
      { terms: [{ type: "rep", party: "Republican" }] }, { terms: [{ type: "rep", party: "Republican" }] }, { terms: [{ type: "rep", party: "Democrat" }] },
      { terms: [] }, {},
    ];
    expect(parseLegislators(data)).toEqual({ senate: { D: 1, R: 1, I: 1 }, house: { D: 1, R: 2, I: 0 } });
    expect(parseLegislators("junk")).toEqual({ senate: { D: 0, R: 0, I: 0 }, house: { D: 0, R: 0, I: 0 } });
  });
  it("counts sitting judges by the party of the appointing president from the FJC export", () => {
    const csv = [
      'nid,Last Name,First Name,Court Type (1),Court Name (1),Appointing President (1),Party of Appointing President (1),Commission Date (1),Termination Date (1),Court Type (2),Court Name (2),Appointing President (2),Party of Appointing President (2),Commission Date (2),Termination Date (2)',
      '1,"Doe, Jr.",Jane,U.S. District Court,"District of Columbia",Barack Obama,Democratic,2014-05-01,,U.S. Court of Appeals,"D.C. Circuit",Joseph Biden,Democratic,2022-06-01,',
      '2,Roe,Richard,U.S. District Court,"Southern District of New York",Ronald Reagan,Republican,1986-01-01,2001-03-03,,,,,,',
      '3,Poe,Pat,Supreme Court of the United States,Supreme Court,Donald Trump,Republican,2017-04-10,,,,,,,',
      '4,Loe,Lee,U.S. Court of Appeals,"Ninth Circuit",Jimmy Carter,Democratic,1979-09-01,,,,,,,',
    ].join("\r\n");
    expect(parseCsv('a,"b ""q"", c",d\n1,2,3')).toEqual([["a", 'b "q", c', "d"], ["1", "2", "3"]]);
    const c = parseJudges(csv);
    expect(c.district).toEqual({ D: 1, R: 0, other: 0 });   // Doe still sits on the district bench (no termination); Roe terminated
    expect(c.supreme).toEqual({ D: 0, R: 1, other: 0 });
    expect(c.appeals).toEqual({ D: 1, R: 0, other: 0 });
    expect(c.all).toEqual({ D: 2, R: 1, other: 0 });
  });
  it("reads the market-implied chance of Democratic control from both venues and flips Republican-framed questions", () => {
    const poly = { events: [{ title: "House control after the 2026 election", slug: "house-2026", markets: [
      { question: "Which party will control the House after the 2026 election?", outcomes: '["Democratic","Republican"]', outcomePrices: '["0.62","0.38"]', closed: false, updatedAt: "2026-09-01T12:00:00Z" },
    ] }] };
    expect(parsePolymarket(poly, "house")).toMatchObject({ venue: "polymarket", pDem: 0.62, asOf: "2026-09-01", url: "https://polymarket.com/event/house-2026" });
    expect(parsePolymarket(poly, "senate")).toBeNull();
    const polyRep = [{ question: "Will Republicans win the Senate in 2026?", outcomes: ["Yes", "No"], outcomePrices: ["0.7", "0.3"], closed: false }];
    expect(parsePolymarket(polyRep, "senate")).toMatchObject({ pDem: 0.3 });
    const kalshi = { markets: [
      { ticker: "KXSENATE-26-D", title: "Which party will control the Senate after the 2026 election?", yes_sub_title: "Democrats", last_price: 41, status: "open", updated_time: "2026-09-02T08:00:00Z" },
      { ticker: "X", title: "Will it rain in Boston?", yes_sub_title: "Yes", last_price: 50, status: "open" },
    ] };
    expect(parseKalshi(kalshi, "senate")).toMatchObject({ venue: "kalshi", pDem: 0.41, asOf: "2026-09-02" });
    expect(parseKalshi({ markets: [{ title: "Will Republicans control the House after 2026?", yes_sub_title: "Yes", last_price: 55, status: "open" }] }, "house")).toMatchObject({ pDem: 0.45 });
    expect(parseKalshi(kalshi, "president")).toBeNull();
  });
  it("averages CPI inflation under each control configuration from the series, as history only", async () => {
    const obs: Array<{ date: string; value: number }> = [];
    let v = 100;
    for (let y = 1946; y <= 2025; y += 1) { v *= 1.03; obs.push({ date: `${y}-12-01`, value: Number(v.toFixed(3)) }); }
    const r = await inflationByControl(async () => obs);
    expect(r).not.toBeNull();
    expect(r!.from).toBe(1947); expect(r!.to).toBe(2025);
    for (const b of Object.values(r!.byBucket)) { if (b.years) expect(b.meanInflation).toBeCloseTo(0.03, 3); }
    expect(r!.byBucket.left.years + r!.byBucket.divided.years + r!.byBucket.right.years).toBe(2025 - 1947 + 1);
    expect(r!.caveat).toMatch(/not a forecast/);
    expect(await inflationByControl(async () => { throw new Error("down"); })).toBeNull();
  });
});

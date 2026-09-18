import { describe, it, expect } from "vitest";
import { parseFmrHistory, parseSafmrRows, parseAcs, parseEvictionCounties, annualAverageFrom } from "../server/rentalData";

describe("HUD FMR history parser", () => {
  it("reads the wide form (fmrYY_B columns) into one series per area × bedroom, 1983 onward", () => {
    const csv = "fips2010,areaname,state_alpha,fmr83_0,fmr83_1,fmr83_2,fmr84_0,fmr84_1,fmr84_2,fmr26_2\n3712999999,New Hanover County,NC,250,300,350,260,312,364,1400\n";
    const rows = parseFmrHistory(csv); const two = rows.find((r) => r.config === "2")!;
    expect(rows).toHaveLength(3); expect(two.geo).toBe("37129"); expect(two.data.startYear).toBe(1983); expect(two.data.values[0]).toBe(350); expect(two.data.values[1]).toBe(364); expect(two.data.values[2026 - 1983]).toBe(1400); expect(two.data.values[1990 - 1983]).toBeNull(); expect(two.asOf).toBe("2026");
  });
  it("reads the long form (year column) as well", () => {
    const csv = "fips,areaname,state,year,fmr_0,fmr_1,fmr_2,fmr_3,fmr_4\n37129,New Hanover,NC,2000,400,450,520,700,800\n37129,New Hanover,NC,2001,410,460,530,710,810\n";
    const rows = parseFmrHistory(csv); const three = rows.find((r) => r.config === "3")!; expect(three.data).toEqual({ startYear: 2000, values: [700, 710] });
  });
});
describe("Small Area FMR parser", () => {
  it("reads zip rows with SAFMR 0BR..4BR", () => {
    const rows = parseSafmrRows([["HUD Area", "ZIP Code", "SAFMR 0BR", "SAFMR 1BR", "SAFMR 2BR", "SAFMR 3BR", "SAFMR 4BR"], ["Wilmington", "28429", 900, 950, 1100, 1450, 1700]], 2025);
    expect(rows).toHaveLength(5); expect(rows.find((r) => r.config === "2")!.data).toEqual({ startYear: 2025, values: [1100] }); expect(rows[0].geoType).toBe("zip");
  });
});
describe("ACS parser", () => {
  it("maps B25031 bedroom columns, B25103 tax and B25077 value per ZCTA", () => {
    const j = [["NAME", "B25031_002E", "B25031_003E", "B25031_004E", "B25031_005E", "B25031_006E", "B25031_007E", "B25103_001E", "B25077_001E", "zip code tabulation area"], ["ZCTA5 28429", "800", "950", "1200", "1500", "1800", "2100", "2150", "310000", "28429"]];
    const rows = parseAcs(j, 2023); expect(rows.filter((r) => r.series === "acs_rent")).toHaveLength(6); expect(rows.find((r) => r.series === "acs_tax")!.data.values).toEqual([2150]); expect(rows.find((r) => r.config === "5+")!.data.values).toEqual([2100]);
  });
});
describe("Eviction Lab parser", () => {
  it("folds county-year rows into one series per county × measure, keeping the undercount flag", () => {
    const est = "state,county,FIPS_state,FIPS_county,year,renting_hh,filings_estimate,filings_ci_95_lower,filings_ci_95_upper,ind_filings_court_issued,ind_filings_court_issued_LT,hh_threat_estimate,hh_threat_95_lower,hh_threat_95_upper,ind_hht_observed\nNorth Carolina,New Hanover County,37,37129,2000,30000,1500,1400,1600,1,0,1200,1100,1300,1\nNorth Carolina,New Hanover County,37,37129,2001,32000,1600,1500,1700,1,0,1280,1200,1360,1\n";
    const rows = parseEvictionCounties(est); const fr = rows.find((r) => r.series === "evict_filing_rate")!; expect(fr.data.startYear).toBe(2000); expect(fr.data.values[0]).toBeCloseTo(5.0); expect(fr.data.values[1]).toBeCloseTo(5.0); expect(fr.geoType).toBe("county"); expect(rows.map((r) => r.series).sort()).toEqual(["evict_filing_rate", "evict_filings", "evict_threat_rate", "renter_hh"]);
    const prop = "id,name,parent_location,year,type,filings,filing_rate,threatened,threatened_rate,judgements,judgement_rate\n37129,New Hanover County,North Carolina,2000,observed,1500,5.0,1200,4.0,600,2.0\n";
    const jr = parseEvictionCounties(prop).find((r) => r.series === "evict_rate")!; expect(jr.data).toEqual({ startYear: 2000, values: [2.0] }); expect(jr.meta?.note).toContain("observed");
  });
});
describe("annual average from monthly FRED observations", () => {
  it("averages within each year and leaves blank years null", () => { const s = annualAverageFrom([{ date: "2020-01-01", value: 2 }, { date: "2020-07-01", value: 4 }, { date: "2022-01-01", value: 10 }])!; expect(s).toEqual({ startYear: 2020, values: [3, null, 10] }); });
});

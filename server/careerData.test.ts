import { describe, expect, it } from "vitest";
import { KEPT_CODES, blsNumber, blsUrls, parseNces33010, parseNces33020, parseOews, stateAbbr, workbookFromZip } from "./careerData";

// A stored (uncompressed) zip container built by hand (same helper as the Zip Engine tests).
function storedZip(entries: Array<[string, string]>): Buffer {
  const parts: Buffer[] = [], central: Buffer[] = [];
  let offset = 0;
  for (const [name, text] of entries) {
    const data = Buffer.from(text, "utf8"), n = Buffer.from(name, "utf8");
    const local = Buffer.alloc(30); local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(0, 8); local.writeUInt32LE(data.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(n.length, 26);
    parts.push(local, n, data);
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(0, 10); c.writeUInt32LE(data.length, 20); c.writeUInt32LE(data.length, 24); c.writeUInt16LE(n.length, 28); c.writeUInt32LE(offset, 42);
    central.push(c, n);
    offset += 30 + n.length + data.length;
  }
  const cd = Buffer.concat(central);
  const eocd = Buffer.alloc(22); eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(entries.length, 8); eocd.writeUInt16LE(entries.length, 10); eocd.writeUInt32LE(cd.length, 12); eocd.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, cd, eocd]);
}
/** An xlsx with inline strings only, so no shared-strings table is needed. */
function xlsx(rows: Array<Array<string | number | null>>): Buffer {
  const body = rows.map((r, ri) => `<row r="${ri + 1}">${r.map((v, ci) => { const col = String.fromCharCode(65 + ci); if (v == null) return ""; return typeof v === "number" ? `<c r="${col}${ri + 1}"><v>${v}</v></c>` : `<c r="${col}${ri + 1}" t="inlineStr"><is><t>${v}</t></is></c>`; }).join("")}</row>`).join("");
  return storedZip([["xl/worksheets/sheet1.xml", `<worksheet><sheetData>${body}</sheetData></worksheet>`]]);
}

describe("BLS OEWS", () => {
  it("tries both path spellings and reads cells with commas, stars and the top-code mark", () => {
    expect(blsUrls(2024, "st")).toEqual(["https://www.bls.gov/oes/special-requests/oesm24st.zip", "https://www.bls.gov/oes/special.requests/oesm24st.zip"]);
    expect(blsNumber("239,200")).toEqual({ value: 239200, topCoded: false });
    expect(blsNumber("*")).toEqual({ value: null, topCoded: false });
    expect(blsNumber("#")).toEqual({ value: null, topCoded: true });
    expect(blsNumber(115.5)).toEqual({ value: 115.5, topCoded: false });
  });
  it("keeps the ledger's occupations in every state, flags top-coded rows, and ranks each state's fifteen best paid", () => {
    const header = ["AREA", "AREA_TITLE", "AREA_TYPE", "PRIM_STATE", "NAICS", "NAICS_TITLE", "I_GROUP", "OWN_CODE", "OCC_CODE", "OCC_TITLE", "O_GROUP", "TOT_EMP", "H_MEAN", "A_MEAN", "A_PCT10", "A_PCT25", "A_MEDIAN", "A_PCT75", "A_PCT90"];
    const row = (st: string, code: string, title: string, emp: number | string, mean: number | string, p: Array<number | string>, group = "detailed") => [Number(st === "NC" ? 37 : 6), st === "NC" ? "North Carolina" : "California", 2, st, "000000", "Cross-industry", "cross-industry", "1235", code, title, group, emp, typeof mean === "number" ? mean / 2080 : mean, mean, ...p];
    const rows: Array<Array<string | number | null>> = [["May 2024 State"], header,
      row("NC", "29-1223", "Psychiatrists", 1200, 280000, [150000, 200000, "#", "#", "#"]),
      row("NC", "29-1021", "Dentists, General", 3000, 190000, [90000, 130000, 175000, 230000, "#"]),
      row("NC", "11-1011", "Chief Executives", 5000, 260000, [100000, 150000, 210000, "#", "#"]),
      row("NC", "29-0000", "Healthcare Practitioners", 300000, 90000, [40000, 55000, 80000, 110000, 150000], "major"),
      row("CA", "29-1223", "Psychiatrists", 6000, 320000, ["*", "*", "#", "#", "#"]),
    ];
    const out = parseOews(xlsx(rows), 2024, "st", "https://example.test/oesm24st.zip");
    const ncPsych = out.find((r) => r.area === "NC" && r.occCode === "29-1223")!;
    expect(ncPsych.areaTitle).toBe("North Carolina");
    expect(ncPsych.annualMean).toBe(280000);
    expect(ncPsych.p25).toBe(200000);
    expect(ncPsych.p50).toBeNull();
    expect(ncPsych.topCoded).toBe(true);
    expect(ncPsych.hourlyMean).toBeCloseTo(280000 / 2080, 6);
    // Ranking by mean within NC: psychiatrists 280k (1), chief executives 260k (2), dentists 190k (3); the major group is skipped.
    expect(ncPsych.rankInArea).toBe(1);
    expect(out.find((r) => r.area === "NC" && r.occCode === "11-1011")!.rankInArea).toBe(2);
    expect(out.find((r) => r.area === "NC" && r.occCode === "29-1021")!.rankInArea).toBe(3);
    expect(out.some((r) => r.occCode === "29-0000")).toBe(false);
    expect(out.find((r) => r.area === "CA")!.p10).toBeNull();
    expect(KEPT_CODES.has("29-1223")).toBe(true);
    expect(KEPT_CODES.has("29-1066")).toBe(true); // the 2010 code psychiatrists carried before 2019
  });
  it("reads the older layout (ST / STATE / OCC_GROUP) and the national file", () => {
    const rows: Array<Array<string | number | null>> = [["AREA", "ST", "STATE", "OCC_CODE", "OCC_TITLE", "OCC_GROUP", "TOT_EMP", "H_MEAN", "A_MEAN", "A_PCT10", "A_PCT25", "A_MEDIAN", "A_PCT75", "A_PCT90"],
      [37, "NC", "North Carolina", "29-1066", "Psychiatrists", "detailed", 900, "95.10", "197,800", "80,000", "120,000", "190,000", "#", "#"]];
    const st = parseOews(xlsx(rows), 2016, "st", "u");
    expect(st).toHaveLength(1);
    expect(st[0]!.area).toBe("NC");
    expect(st[0]!.annualMean).toBe(197800);
    const nat = parseOews(xlsx([["OCC_CODE", "OCC_TITLE", "TOT_EMP", "A_MEAN", "A_MEDIAN"], ["29-1131", "Veterinarians", 80000, 125000, 110000]]), 2016, "nat", "u");
    expect(nat[0]).toMatchObject({ area: "US", areaTitle: "United States", occCode: "29-1131", annualMean: 125000, p50: 110000, rankInArea: 1 });
  });
  it("picks the workbook out of the zip and maps state names", () => {
    const wb = xlsx([["OCC_CODE", "OCC_TITLE", "A_MEAN"], ["23-1011", "Lawyers", 150000]]);
    const zip = storedZip([["oesm24nat/field_descriptions.xlsx", "x"], ["oesm24nat/national_M2024_dl.xlsx", wb.toString("latin1")]]);
    // The stored container carries the workbook bytes as latin1 text; compare by length after the round trip.
    expect(workbookFromZip(zip).length).toBe(Buffer.from(wb.toString("latin1"), "utf8").length);
    expect(stateAbbr("North Carolina")).toBe("NC");
    expect(stateAbbr("nc")).toBeNull();
    expect(stateAbbr("NC")).toBe("NC");
    expect(stateAbbr("Puerto Rico")).toBeNull();
  });
});

describe("NCES", () => {
  it("folds table 330.10 into one series per section and measure, four-year columns, with gaps left null", () => {
    // Rows copied from the published table (current dollars): year, total (all/4yr/2yr), tuition (all/4yr/2yr), room (…), board (…), then constant dollars.
    const rows: Array<Array<string | number | null>> = [
      ["Table 330.10. Average undergraduate tuition, fees, room, and board rates"], ["Year and control of institution", "Current dollars"],
      ["All institutions"],
      ["1989-90", 6207, 7212, 3705, 2839, 3800, 978, 1638, 1675, 1105, 1730, 1737, 1622, 14650],
      ["1990-91", 6562, 7602, 3930, 3016, 4009, 1087, 1743, 1782, 1182, 1802, 1811, 1660, 14684],
      ["1992-93", 7000, 8000, 4000, 3200, 4200, 1100, 1800, 1850, 1200, 1850, 1860, 1700, 15000],
      ["Public institutions"],
      ["1990-91", 4757, 5243, 3467, 1454, 1888, 824, 1612, 1657, 1050, 1691, 1698, 1594, 10645],
      ["2022-23", 20401, 22389, 11953, 7998, 9750, 3598, 7017, 7167, 4566, 5386, 5472, 3790, 20401],
      ["Private nonprofit and for-profit institutions"],
      ["1990-91", 12910, 13237, 9302, 8772, 9083, 5570, 2063, 2077, 1744, 2074, 2077, 1989, 28890],
    ];
    const out = parseNces33010(rows, "u");
    const allTotal = out.find((s) => s.series === "nces_all_total4")!;
    expect(allTotal.startYear).toBe(1989);
    expect(allTotal.values).toEqual([7212, 7602, null, 8000]); // 1991-92 is absent from this fixture
    expect(out.find((s) => s.series === "nces_pub_tuit4")!.values[0]).toBe(1888);
    expect(out.find((s) => s.series === "nces_pub_total4")!.asOf).toBe("2022");
    expect(out.find((s) => s.series === "nces_priv_board4")!.values).toEqual([2077]);
    expect(out.every((s) => s.area === "US")).toBe(true);
  });
  it("reads table 330.20 by state for the two years in its header", () => {
    const rows: Array<Array<string | number | null>> = [
      ["Table 330.20. Average undergraduate tuition, fees, room, and board charges … by control and level of institution and state: 2021-22 and 2022-23"],
      ["State", "Public 4-year", null, null, null, null, null, null, "Private 4-year"],
      ["", "In-state, 2021-22", null, "In-state, 2022-23", null, null, null, "Out-of-state 2022-23", "2021-22", null, "2022-23"],
      ["United States", 21337, 9375, 21500, 9400, 6800, 5300, 27100, 46313, 32825, 46500, 33000, 7700, 5900, 3501, 3600, 8300],
      ["North Carolina", 18000, 7000, 18200, 7100, 6000, 4800, 22000, 40000, 30000, 41000, 30500, 6500, 5000, 2500, 2600, 8000],
      ["Not a state", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    ];
    const out = parseNces33020(rows, "u");
    const nc = out.find((s) => s.area === "NC" && s.series === "nces_pub_total4")!;
    expect(nc.startYear).toBe(2021);
    expect(nc.values).toEqual([18000, 18200]);
    expect(out.find((s) => s.area === "NC" && s.series === "nces_priv_tuit4")!.values).toEqual([30000, 30500]);
    expect(out.find((s) => s.area === "US" && s.series === "nces_pub_room4")!.values).toEqual([null, 6800]);
    expect(out.some((s) => s.area === "Not a state")).toBe(false);
    expect(nc.asOf).toBe("2022");
  });
});

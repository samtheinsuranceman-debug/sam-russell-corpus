import { describe, expect, it } from "vitest";
import { parseFhfaZip5, parseZillowStream, parseZillowWide, splitCsvLine, unzipEntries, xlsxRows } from "./zipData";
import { zipsFromFactFinder } from "./zipRouter";

// A stored (uncompressed) zip container built by hand, so the XLSX reader is tested without any library.
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

const sharedStrings = `<sst><si><t>Five-Digit ZIP Code</t></si><si><t>Year</t></si><si><t>Annual Change (%)</t></si><si><t>HPI</t></si><si><t>HPI with 1990 base</t></si><si><t>HPI with 2000 base</t></si></sst>`;
const sheet = `<worksheet><sheetData>
<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c><c r="D1" t="s"><v>3</v></c><c r="E1" t="s"><v>4</v></c><c r="F1" t="s"><v>5</v></c></row>
<row r="2"><c r="A2"><v>28401</v></c><c r="B2"><v>1999</v></c><c r="C2"/><c r="D2"><v>140.1</v></c><c r="E2"><v>130</v></c><c r="F2"><v>95.5</v></c></row>
<row r="3"><c r="A3"><v>28401</v></c><c r="B3"><v>2000</v></c><c r="C3"><v>4.7</v></c><c r="D3"><v>146.7</v></c><c r="E3"><v>136</v></c><c r="F3"><v>100</v></c></row>
<row r="4"><c r="A4"><v>28401</v></c><c r="B4"><v>2002</v></c><c r="C4"><v>5</v></c><c r="D4"><v>160</v></c><c r="E4"><v>150</v></c><c r="F4"><v>110.2</v></c></row>
<row r="5"><c r="A5" t="inlineStr"><is><t>02134</t></is></c><c r="B5"><v>2000</v></c><c r="C5"/><c r="D5"><v>120</v></c><c r="E5"><v>110</v></c><c r="F5"><v>100</v></c></row>
</sheetData></worksheet>`;

describe("xlsx reader", () => {
  it("lists and inflates stored entries and reads shared and inline strings", () => {
    const buf = storedZip([["xl/sharedStrings.xml", sharedStrings], ["xl/worksheets/sheet1.xml", sheet], ["docProps/app.xml", "<x/>"]]);
    const entries = unzipEntries(buf, (n) => n.startsWith("xl/"));
    expect([...entries.keys()].sort()).toEqual(["xl/sharedStrings.xml", "xl/worksheets/sheet1.xml"]);
    const rows = xlsxRows(buf);
    expect(rows[0]).toEqual(["Five-Digit ZIP Code", "Year", "Annual Change (%)", "HPI", "HPI with 1990 base", "HPI with 2000 base"]);
    expect(rows[1]![0]).toBe(28401);
    expect(rows[4]![0]).toBe("02134");
  });
  it("folds the FHFA long file into one series per zip using the 2000-based index, blanks left null", () => {
    const parsed = parseFhfaZip5(xlsxRows(storedZip([["xl/sharedStrings.xml", sharedStrings], ["xl/worksheets/sheet1.xml", sheet]])));
    const wilmington = parsed.find((p) => p.zip === "28401")!;
    expect(wilmington.series).toBe("hpi");
    expect(wilmington.data).toEqual({ startYear: 1999, values: [95.5, 100, null, 110.2] });
    expect(wilmington.asOf).toBe("2002");
    expect(parsed.find((p) => p.zip === "02134")!.data).toEqual({ startYear: 2000, values: [100] }); // leading zero kept
  });
});

describe("zillow wide csv", () => {
  it("splits quoted fields", () => {
    expect(splitCsvLine('1,"Wilmington, NC",28401,"say ""hi""",')).toEqual(["1", "Wilmington, NC", "28401", 'say "hi"', ""]);
  });
  it("folds monthly columns to the last month of each year and keeps the region meta", () => {
    const csv = [
      "RegionID,SizeRank,RegionName,RegionType,StateName,State,City,Metro,CountyName,2019-11-30,2019-12-31,2020-01-31,2020-12-31,2021-06-30",
      '1,10,28401,zip,North Carolina,NC,Wilmington,"Wilmington, NC",New Hanover County,300000,305000,310000,340000,',
      "2,20,2134,zip,Massachusetts,MA,Boston,Boston,Suffolk County,,,,600000,650000",
      "3,30,99999,county,Nowhere,NW,,,,1,1,1,1,1",
    ].join("\n");
    const parsed = parseZillowWide(csv, "zhvi");
    expect(parsed.map((p) => p.zip)).toEqual(["28401", "02134"]); // the county row is skipped, the 4-digit zip is padded
    expect(parsed[0]!.data).toEqual({ startYear: 2019, values: [305000, 340000] }); // 2021 blank → the series stops
    expect(parsed[0]!.asOf).toBe("2021-06-30");
    expect(parsed[0]!.meta).toEqual({ state: "NC", city: "Wilmington", county: "New Hanover County", metro: "Wilmington, NC" });
    expect(parsed[1]!.data).toEqual({ startYear: 2020, values: [600000, 650000] });
  });
  it("streams a body in chunks that split lines anywhere and reaches the same answer", async () => {
    const csv = "RegionID,SizeRank,RegionName,RegionType,StateName,State,City,Metro,CountyName,2019-12-31,2020-12-31\n1,10,28401,zip,North Carolina,NC,Wilmington,\"Wilmington, NC\",New Hanover County,305000,340000\n2,20,2134,zip,MA,MA,Boston,Boston,Suffolk,600000,650000";
    const bytes = new TextEncoder().encode(csv);
    const chunks = [bytes.slice(0, 57), bytes.slice(57, 130), bytes.slice(130)];
    const body = new ReadableStream<Uint8Array>({ start(c) { chunks.forEach((x) => c.enqueue(x)); c.close(); } });
    const streamed = await parseZillowStream({ text: async () => csv, body }, "zori");
    expect(streamed).toEqual(parseZillowWide(csv, "zori"));
    expect(streamed.map((p) => p.zip)).toEqual(["28401", "02134"]);
  });
});

describe("the client's zips", () => {
  it("reads the primary home zip and every property zip from the Fact Finder", () => {
    const ff = { sections: { realEstate: { primaryHomeZip: "28401" } }, lists: { properties: [{ type: "Rental", zip: "33755" }, { type: "Land", zip: "" }, { type: "Vacation", zip: "2134" }] } };
    expect(zipsFromFactFinder(ff)).toEqual([{ zip: "28401", label: "Primary home" }, { zip: "33755", label: "Rental 1" }]);
    expect(zipsFromFactFinder(null)).toEqual([]);
  });
});

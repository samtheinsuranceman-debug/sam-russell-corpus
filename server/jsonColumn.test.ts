import { describe, expect, it } from "vitest";
import { jsonColumn } from "./_core/jsonColumn";

describe("jsonColumn (MySQL parses JSON columns, MariaDB returns text)", () => {
  it("passes parsed objects through untouched", () => {
    const obj = { a: 1 };
    expect(jsonColumn(obj, null)).toBe(obj);
  });
  it("parses JSON text from MariaDB", () => {
    expect(jsonColumn('{"version":1,"sections":{}}', null)).toEqual({ version: 1, sections: {} });
    expect(jsonColumn('["1.2.3.4"]', [])).toEqual(["1.2.3.4"]);
  });
  it("falls back on null, undefined, or corrupt text", () => {
    expect(jsonColumn(null, "fb")).toBe("fb");
    expect(jsonColumn(undefined, [])).toEqual([]);
    expect(jsonColumn("{not json", { ok: false })).toEqual({ ok: false });
  });
});

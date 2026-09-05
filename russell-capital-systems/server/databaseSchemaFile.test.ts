// ============================================================
// database/rcs-schema.sql must be the complete, current export of
// drizzle/schema.ts — it's what gets imported in phpMyAdmin on hosts without
// shell access. Regenerate with scripts/export_schema_sql.sh.
// ============================================================
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const APP = path.resolve(__dirname, "..");
const schemaTs = readFileSync(path.join(APP, "drizzle/schema.ts"), "utf8");
const sqlPath = path.join(APP, "database/rcs-schema.sql");

describe("database/rcs-schema.sql", () => {
  it("exists", () => {
    expect(existsSync(sqlPath), "run scripts/export_schema_sql.sh").toBe(true);
  });

  it("creates every table defined in drizzle/schema.ts, and nothing else", () => {
    const sql = readFileSync(sqlPath, "utf8");
    const defined = [...schemaTs.matchAll(/mysqlTable\("([^"]+)"/g)].map((m) => m[1]).sort();
    const created = [...sql.matchAll(/^CREATE TABLE `([^`]+)`/gm)].map((m) => m[1]).sort();
    expect(created).toEqual(defined);
    expect(created.length).toBeGreaterThan(100);
  });

  it("includes the homepage lead table with its key columns", () => {
    const sql = readFileSync(sqlPath, "utf8");
    const start = sql.indexOf("CREATE TABLE `public_leads`");
    expect(start).toBeGreaterThan(-1);
    const table = sql.slice(start, sql.indexOf(");", start));
    for (const col of ["publicId", "email", "phone", "bestTimeToContact", "consentedAt", "lastIp", "ipHistory", "factFinder", "analysis", "status"]) {
      expect(table).toContain(`\`${col}\``);
    }
  });

  it("is plain SQL an importer can run (no drizzle breakpoint markers)", () => {
    const sql = readFileSync(sqlPath, "utf8");
    expect(sql).not.toContain("statement-breakpoint");
    expect(sql).toContain("SET NAMES utf8mb4;");
  });
});

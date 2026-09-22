import { describe, expect, it } from "vitest";
import { listMigrations, splitStatements } from "./migrate";

describe("migration runner", () => {
  it("lists the thirteen drizzle migrations in order with checksums", () => {
    const list = listMigrations("drizzle");
    expect(list.length).toBeGreaterThanOrEqual(13);
    expect(list.map(m => m.name)).toEqual([...list.map(m => m.name)].sort());
    expect(list[0].name.startsWith("0000_")).toBe(true);
    expect(new Set(list.map(m => m.checksum)).size).toBe(list.length);
  });

  it("splits every migration into clean statements", () => {
    for (const m of listMigrations("drizzle")) {
      const statements = splitStatements(m.sql);
      expect(statements.length, m.name).toBeGreaterThan(0);
      for (const s of statements) {
        expect(s, m.name).not.toContain("statement-breakpoint");
        expect(s.trim().endsWith(";"), `${m.name}: ${s.slice(0, 40)}`).toBe(false);
        expect(/^(CREATE|ALTER|DROP|INSERT|UPDATE|RENAME|SET)\b/i.test(s), `${m.name}: ${s.slice(0, 60)}`).toBe(true);
      }
    }
  });

  it("handles both separator styles and ignores comments", () => {
    expect(splitStatements("CREATE TABLE a (x int);\n--> statement-breakpoint\nCREATE TABLE b (y int);")).toEqual(["CREATE TABLE a (x int)", "CREATE TABLE b (y int)"]);
    expect(splitStatements("-- note\nCREATE TABLE a (x int);\n\nALTER TABLE a ADD y int;\n")).toEqual(["CREATE TABLE a (x int)", "ALTER TABLE a ADD y int"]);
  });
});

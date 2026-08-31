import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  clients,
  clientNotes,
  pageAuditRecords,
  pageAuditRuns,
  planningCaseNotes,
  planningCases,
  savedScenarios,
  scenarioSnapshots,
  userPortalPreferences,
} from "../drizzle/schema";

describe("unified persistence schema", () => {
  it("reuses existing client, scenario, snapshot, and note models", () => {
    expect(clients).toBeDefined();
    expect(savedScenarios).toBeDefined();
    expect(scenarioSnapshots).toBeDefined();
    expect(clientNotes).toBeDefined();
  });

  it("adds durable planning workflow and audit models", () => {
    expect(planningCases).toBeDefined();
    expect(planningCaseNotes).toBeDefined();
    expect(pageAuditRuns).toBeDefined();
    expect(pageAuditRecords).toBeDefined();
    expect(userPortalPreferences).toBeDefined();
  });

  it("uses a creation-only migration with no destructive SQL", () => {
    const additiveSql = readFileSync("drizzle/0068_dark_invaders.sql", "utf8").toUpperCase();
    const coreSql = readFileSync("drizzle/0069_core_portal_bootstrap.sql", "utf8").toUpperCase();
    expect(additiveSql).toContain("CREATE TABLE `PLANNING_CASES`");
    expect(additiveSql).toContain("CREATE TABLE `PAGE_AUDIT_RECORDS`");
    expect(coreSql).toContain("CREATE TABLE `CLIENTS`");
    expect(coreSql).toContain("CREATE TABLE `WORKSPACES`");
    for (const sql of [additiveSql, coreSql]) {
      expect(sql).not.toContain("DROP TABLE");
      expect(sql).not.toContain("DROP COLUMN");
      expect(sql).not.toContain("TRUNCATE");
      expect(sql).not.toContain("DELETE FROM");
      expect(sql).not.toContain("ALTER TABLE");
    }
  });
});

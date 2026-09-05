import { readFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getDb } from "./db";

const EXPECTED_CORE_TABLES = [
  "audit_logs",
  "client_activity_log",
  "client_documents",
  "client_meetings",
  "client_notes",
  "client_portal_tokens",
  "client_tag_assignments",
  "client_tags",
  "clients",
  "dashboard_widget_configs",
  "deals",
  "error_logs",
  "in_app_notifications",
  "knowledge_documents",
  "memberships",
  "page_activity_logs",
  "saved_scenarios",
  "saved_strategies",
  "scenario_snapshots",
  "sidebar_favorites",
  "strategies",
  "workspace_invitations",
  "workspace_subscriptions",
  "workspaces",
] as const;

describe("core portal table bootstrap", () => {
  it("contains the exact reviewed 24-table creation list", () => {
    const migration = readFileSync("drizzle/0069_core_portal_bootstrap.sql", "utf8");
    const created = Array.from(migration.matchAll(/CREATE TABLE `([^`]+)`/g), match => match[1]).sort();
    expect(created).toEqual([...EXPECTED_CORE_TABLES].sort());
  });

  it("queries every bootstrapped table without inserting data", async () => {
    const db = await getDb();
    expect(db).toBeTruthy();

    for (const table of EXPECTED_CORE_TABLES) {
      const result = await db!.execute(sql.raw(`SELECT COUNT(*) AS row_count FROM \`${table}\``));
      expect(result, table).toBeTruthy();
    }
  }, 30_000);
});

import { describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * Data Isolation Security Tests
 * 
 * These tests verify that every tRPC procedure accessing client data
 * properly verifies workspace ownership before returning or modifying data.
 * 
 * Pattern: Any procedure that takes a `clientId` parameter MUST call
 * `getWorkspaceForUser` and verify the client belongs to that workspace
 * before performing any data operations.
 */

const routersSource = fs.readFileSync(
  path.join(__dirname, "routers.ts"),
  "utf-8"
);

// Extract all procedure blocks that accept clientId
function findClientIdProcedures(source: string): { line: number; text: string; hasWorkspaceCheck: boolean }[] {
  const lines = source.split("\n");
  const results: { line: number; text: string; hasWorkspaceCheck: boolean }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match procedures that take clientId as input
    if (line.includes("protectedProcedure") && line.includes("clientId")) {
      // Check the next 10 lines for workspace verification
      const nextLines = lines.slice(i, i + 12).join("\n");
      const hasWorkspaceCheck =
        nextLines.includes("getWorkspaceForUser") ||
        nextLines.includes("ws.id") ||
        nextLines.includes("workspaceId");

      results.push({
        line: i + 1,
        text: line.trim().substring(0, 120),
        hasWorkspaceCheck,
      });
    }
  }
  return results;
}

describe("Data Isolation: Workspace Ownership Verification", () => {
  const procedures = findClientIdProcedures(routersSource);

  it("should find client-accessing procedures in the codebase", () => {
    expect(procedures.length).toBeGreaterThan(0);
  });

  it("every procedure accessing clientId MUST verify workspace ownership", () => {
    const unprotected = procedures.filter((p) => !p.hasWorkspaceCheck);
    if (unprotected.length > 0) {
      const details = unprotected
        .map((p) => `  Line ${p.line}: ${p.text}`)
        .join("\n");
      throw new Error(
        `Found ${unprotected.length} procedure(s) accessing clientId without workspace verification:\n${details}`
      );
    }
    expect(unprotected).toHaveLength(0);
  });
});

describe("Data Isolation: No Direct DB Queries Without Workspace Filter", () => {
  it("should not have unscoped clientId queries in inline DB calls", () => {
    // Find inline db.select() calls that filter by clientId but NOT workspaceId
    const lines = routersSource.split("\n");
    const violations: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Look for inline db queries with clientId but no workspace filter
      if (
        line.includes("db.select()") &&
        line.includes("clientId") &&
        !line.includes("workspaceId") &&
        !line.includes("ws.id")
      ) {
        // Check surrounding context (5 lines before) for workspace check
        const context = lines.slice(Math.max(0, i - 8), i + 1).join("\n");
        if (!context.includes("getWorkspaceForUser") && !context.includes("ws.id")) {
          violations.push(`Line ${i + 1}: ${line.trim().substring(0, 120)}`);
        }
      }
    }

    if (violations.length > 0) {
      throw new Error(
        `Found ${violations.length} inline DB query(ies) accessing clientId without workspace filter:\n${violations.join("\n")}`
      );
    }
    expect(violations).toHaveLength(0);
  });
});

describe("Data Isolation: DB Helper Functions Accept Workspace Parameter", () => {
  const dbSource = fs.readFileSync(
    path.join(__dirname, "db.ts"),
    "utf-8"
  );

  const criticalFunctions = [
    "getStrategiesByClient",
    "acknowledgeRebalanceAlert",
    "resolveRebalanceAlert",
    "revokePortalToken",
    "dismissComplianceAlert",
    "resolveComplianceAlert",
  ];

  for (const fn of criticalFunctions) {
    it(`${fn} should accept workspaceId parameter`, () => {
      // Find the function signature
      const regex = new RegExp(`export async function ${fn}\\([^)]+\\)`, "g");
      const match = regex.exec(dbSource);
      expect(match).not.toBeNull();
      expect(match![0]).toContain("workspaceId");
    });
  }
});

describe("Data Isolation: Protected Procedures Use ctx.user", () => {
  it("procedures with alertId should verify workspace before modifying alerts", () => {
    const alertProcedures = routersSource.split("\n").filter(
      (line) => line.includes("protectedProcedure") && line.includes("alertId")
    );

    for (const proc of alertProcedures) {
      const lineIndex = routersSource.split("\n").indexOf(proc);
      const context = routersSource
        .split("\n")
        .slice(lineIndex, lineIndex + 8)
        .join("\n");
      
      const hasWorkspaceCheck =
        context.includes("getWorkspaceForUser") || context.includes("ws.id");
      
      expect(hasWorkspaceCheck).toBe(true);
    }
  });
});

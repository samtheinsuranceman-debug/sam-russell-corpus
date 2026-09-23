import { describe, expect, it } from "vitest";
import { informVerification, verificationEventsFromReport, type VitestJsonReport } from "./verificationInform";
import { HIVE_VERIFIERS } from "./hiveMind";
import { buildHiveContext } from "@shared/hiveContext";

const report: VitestJsonReport = {
  testResults: [
    { name: "/w/server/ag49Validator.test.ts", status: "passed", assertionResults: [{ status: "passed" }] },
    { name: "/w/server/routes.test.ts", status: "passed", assertionResults: [{ status: "passed" }, { status: "passed" }] },
    { name: "/w/server/databaseSchemaFile.test.ts", status: "failed", assertionResults: [{ status: "failed", fullName: "157 vs 159" }] },
    { name: "/w/server/somethingElse.test.ts", status: "passed" },
  ],
};

describe("verificationInform", () => {
  it("emits exactly one event per verifier in the roster", () => {
    const events = verificationEventsFromReport(report, "8a17807");
    expect(events).toHaveLength(HIVE_VERIFIERS.length);
    expect(new Set(events.map(e => e.engine))).toEqual(new Set(HIVE_VERIFIERS));
    expect(events.every(e => e.kind === "verification")).toBe(true);
  });

  it("maps pass / fail / unverified from the report", () => {
    const by = Object.fromEntries(verificationEventsFromReport(report, "8a17807").map(e => [e.engine, e.outcome]));
    expect(by.ag49Validator).toBe("pass");
    expect(by.routeManifest).toBe("pass");
    expect(by.databaseSchemaFile).toBe("fail");
    expect(by.patentStatus).toBe("unverified"); // no file for it in this report
  });

  it("records for the system user and the hive context keeps the latest outcome per engine", async () => {
    const stored: { userId: number; event: any }[] = [];
    const n = await informVerification(report, "8a17807", async (userId, event) => { stored.push({ userId, event }); });
    expect(n).toBe(HIVE_VERIFIERS.length);
    expect(stored.every(s => s.userId === 0)).toBe(true);
    const ctx = buildHiveContext(stored.map((s, i) => ({ ...s.event, id: i + 1, createdAt: new Date(2026, 8, 22, 12, i).toISOString() })));
    expect(ctx.verifications.find(v => v.engine === "databaseSchemaFile")?.outcome).toBe("fail");
    expect(ctx.text).toMatch(/databaseSchemaFile/);
  });
});

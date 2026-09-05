// Contract tests for the /api/v1/joinaqal/* integration surface.
// Requires the dev server on :3000 (same as landing.test.ts).
import { describe, expect, it } from "vitest";

const BASE = "http://localhost:3000/api/v1/joinaqal";

describe("integration API surface", () => {
  it("member-scoped endpoints fail closed for anonymous callers", async () => {
    for (const [method, path] of [
      ["POST", "/assessment"], ["GET", "/assessment/1"], ["POST", "/voice-analysis"],
      ["GET", "/development-tracking"], ["GET", "/weakness-identification"],
      ["POST", "/coaching"], ["GET", "/coaching/1"],
    ] as const) {
      const res = await fetch(`${BASE}${path}`, { method, headers: { "content-type": "application/json" }, body: method === "POST" ? "{}" : undefined });
      expect(res.status, `${method} ${path}`).toBe(401);
    }
  });

  it("transparency endpoint is public and complete", async () => {
    const res = await fetch(`${BASE}/transparency`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.norming.active).toBeTruthy();
    expect(Array.isArray(body.norming.versions)).toBe(true);
    expect(body).toHaveProperty("ledger");
    expect(Array.isArray(body.provenance)).toBe(true);
  });

  it("norms changelog and ledger verify are publicly reachable", async () => {
    const changelog = await fetch("http://localhost:3000/api/norms/changelog");
    expect(changelog.status).toBe(200);
    const verify = await fetch("http://localhost:3000/api/ledger/verify");
    expect([200, 503]).toContain(verify.status); // 503 = no database in dev, still fail-closed JSON
  });
});

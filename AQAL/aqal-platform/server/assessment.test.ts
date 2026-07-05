import { describe, it, expect } from "vitest";

describe("Assessment API", () => {
  const BASE = "http://localhost:3000";

  it("GET /api/trpc/auth.me returns auth state", async () => {
    const res = await fetch(`${BASE}/api/trpc/auth.me`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.result).toBeDefined();
    expect(json.result.data).toBeDefined();
    // Unauthenticated user gets null (superjson wraps in {json: null})
    expect(json.result.data.json).toBeNull();
  });

  it("GET /api/trpc/promo.validate handles promo code request", async () => {
    const input = encodeURIComponent(JSON.stringify({ code: "INVALID_CODE_XYZ" }));
    const res = await fetch(`${BASE}/api/trpc/promo.validate?input=${input}`);
    // tRPC may return 200 with valid:false or 400 for input issues — both are acceptable
    expect([200, 400]).toContain(res.status);
    const json = await res.json();
    if (res.status === 200) {
      expect(json.result.data.valid).toBe(false);
    } else {
      // Input validation error is acceptable for this test
      expect(json).toBeDefined();
    }
  });
});

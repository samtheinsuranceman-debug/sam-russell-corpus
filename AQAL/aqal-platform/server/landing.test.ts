import { describe, it, expect } from "vitest";

describe("AQAL Landing Page - Server Health", () => {
  it("should have the server running and responding", async () => {
    // Basic health check - the server should respond
    const response = await fetch("http://localhost:3000/");
    expect(response.status).toBe(200);
  });

  it("should serve the landing page HTML with correct title", async () => {
    const response = await fetch("http://localhost:3000/");
    const html = await response.text();
    expect(html).toContain("AQAL Intelligence Platform");
  });

  it("should have tRPC endpoint available", async () => {
    // tRPC health check - should return method not allowed for GET on mutation endpoints
    const response = await fetch("http://localhost:3000/api/trpc/auth.me");
    // Should not be 404 - endpoint exists
    expect(response.status).not.toBe(404);
  });
});

import { describe, expect, it } from "vitest";
import { canonicalRedirectLocation } from "./canonical";

describe("canonical production redirects", () => {
  it("redirects the bare production domain to canonical www", () => {
    expect(canonicalRedirectLocation({
      method: "GET",
      proto: "https",
      host: "joinaqal.com",
      originalUrl: "/assessment?step=1",
    })).toBe("https://www.joinaqal.com/assessment?step=1");
  });

  it("keeps the canonical www host directly reachable", () => {
    expect(canonicalRedirectLocation({
      method: "GET",
      proto: "https",
      host: "www.joinaqal.com",
      originalUrl: "/health",
    })).toBeNull();
  });

  it("keeps a managed deployment origin directly reachable over HTTPS", () => {
    expect(canonicalRedirectLocation({
      method: "GET",
      proto: "https",
      host: "aqalrebuild-zmxkzmjl.manus.space",
      originalUrl: "/health",
    })).toBeNull();
  });

  it("upgrades a managed deployment origin to HTTPS without changing hosts", () => {
    expect(canonicalRedirectLocation({
      method: "GET",
      proto: "http",
      host: "aqalrebuild-zmxkzmjl.manus.space",
      originalUrl: "/health",
    })).toBe("https://aqalrebuild-zmxkzmjl.manus.space/health");
  });

  it("does not redirect non-GET callbacks", () => {
    expect(canonicalRedirectLocation({
      method: "POST",
      proto: "http",
      host: "joinaqal.com",
      originalUrl: "/api/webhooks/twilio/inbound",
    })).toBeNull();
  });
});

import { describe, expect, it } from "vitest";

/**
 * Tests for the canonical domain redirect middleware in server/_core/index.ts.
 * The middleware redirects non-canonical hosts to https://www.russellcapitalsystems.com
 * with a 301 status. Allowed through without redirect:
 *   - canonical domain (www.russellcapitalsystems.com)
 *   - localhost / 127.* / empty host
 *   - *.manus.computer (dev preview proxy)
 *   - *.manus.space (published site)
 *   - 169.254.* (link-local)
 *   - NODE_ENV === "development"
 */

const CANONICAL_HOST = "www.russellcapitalsystems.com";

function domainRedirectMiddleware(
  host: string,
  originalUrl: string,
  nodeEnv = "production"
): { redirect: boolean; status?: number; location?: string } {
  const normalizedHost = (host || "").toLowerCase().replace(/:\d+$/, "");
  if (
    normalizedHost === CANONICAL_HOST ||
    normalizedHost === "localhost" ||
    normalizedHost.startsWith("127.") ||
    normalizedHost === "" ||
    normalizedHost.includes("manus.computer") ||
    normalizedHost.includes("manus.space") ||
    normalizedHost.startsWith("169.254.") ||
    nodeEnv === "development"
  ) {
    return { redirect: false };
  }
  return {
    redirect: true,
    status: 301,
    location: `https://${CANONICAL_HOST}${originalUrl}`,
  };
}

describe("Canonical Domain Redirect Middleware", () => {
  // ─── Should redirect ───
  it("redirects www.russellcap.com to canonical domain", () => {
    const result = domainRedirectMiddleware("www.russellcap.com", "/");
    expect(result.redirect).toBe(true);
    expect(result.status).toBe(301);
    expect(result.location).toBe(`https://${CANONICAL_HOST}/`);
  });

  it("redirects bare russellcap.com to canonical domain", () => {
    const result = domainRedirectMiddleware("russellcap.com", "/");
    expect(result.redirect).toBe(true);
  });

  it("redirects non-www russellcapitalsystems.com to canonical", () => {
    const result = domainRedirectMiddleware("russellcapitalsystems.com", "/");
    expect(result.redirect).toBe(true);
    expect(result.location).toBe(`https://${CANONICAL_HOST}/`);
  });

  it("redirects random third-party domain", () => {
    const result = domainRedirectMiddleware("myapp-xyz123.hostingplatform.io", "/");
    expect(result.redirect).toBe(true);
  });

  it("preserves URL path during redirect", () => {
    const result = domainRedirectMiddleware("russellcap.com", "/portal/dashboard");
    expect(result.redirect).toBe(true);
    expect(result.location).toBe(`https://${CANONICAL_HOST}/portal/dashboard`);
  });

  it("preserves query strings during redirect", () => {
    const result = domainRedirectMiddleware("russellcap.com", "/pricing?plan=enterprise&annual=true");
    expect(result.location).toBe(`https://${CANONICAL_HOST}/pricing?plan=enterprise&annual=true`);
  });

  it("handles host with port number", () => {
    const result = domainRedirectMiddleware("www.russellcap.com:443", "/");
    expect(result.redirect).toBe(true);
  });

  it("is case-insensitive", () => {
    const result = domainRedirectMiddleware("WWW.RUSSELLCAP.COM", "/");
    expect(result.redirect).toBe(true);
  });

  // ─── Should NOT redirect (allowed domains) ───
  it("does NOT redirect canonical domain", () => {
    expect(domainRedirectMiddleware("www.russellcapitalsystems.com", "/").redirect).toBe(false);
  });

  it("does NOT redirect localhost", () => {
    expect(domainRedirectMiddleware("localhost:3000", "/").redirect).toBe(false);
  });

  it("does NOT redirect 127.0.0.1", () => {
    expect(domainRedirectMiddleware("127.0.0.1:3000", "/").redirect).toBe(false);
  });

  it("does NOT redirect empty host", () => {
    expect(domainRedirectMiddleware("", "/").redirect).toBe(false);
  });

  it("does NOT redirect *.manus.computer (dev preview proxy)", () => {
    expect(domainRedirectMiddleware("3000-abc123.us2.manus.computer", "/portal/dashboard").redirect).toBe(false);
  });

  it("does NOT redirect *.manus.space (published site)", () => {
    expect(domainRedirectMiddleware("russellcap-llwzv8yr.manus.space", "/portal/dashboard").redirect).toBe(false);
  });

  it("does NOT redirect 169.254.* (link-local)", () => {
    expect(domainRedirectMiddleware("169.254.1.1", "/").redirect).toBe(false);
  });

  it("does NOT redirect in development mode", () => {
    expect(domainRedirectMiddleware("random-host.example.com", "/", "development").redirect).toBe(false);
  });
});

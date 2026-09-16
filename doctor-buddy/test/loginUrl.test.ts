/**
 * Regression tests for getLoginUrl.
 *
 * getLoginUrl used to call `new URL(`${oauthPortalUrl}/app-auth`)` with no
 * guard. With VITE_OAUTH_PORTAL_URL unset that is `new URL("undefined/app-auth")`,
 * which throws. useAuth called it from a *default parameter*, so it ran on every
 * render of every component using the hook — even when the value was never read.
 * The result was that every route in the app, including the unauthenticated
 * landing page, rendered the error boundary instead of the page.
 *
 * These tests pin the contract: getLoginUrl never throws, and with no OAuth
 * config it yields an in-app path rather than a broken URL.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/** Load const.ts fresh with a given set of Vite env vars and a window stub. */
async function loadConst(env: Record<string, string | undefined>, origin = "https://app.example.com") {
  vi.resetModules();
  vi.stubGlobal("window", { location: { origin, pathname: "/dashboard" } });
  vi.stubGlobal("btoa", (s: string) => Buffer.from(s, "binary").toString("base64"));
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) vi.stubEnv(k, "");
    else vi.stubEnv(k, v);
  }
  return await import("../client/src/const");
}

describe("getLoginUrl", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("does not throw when the OAuth portal is unconfigured", async () => {
    const { getLoginUrl, LOGIN_UNAVAILABLE_PATH } = await loadConst({
      VITE_OAUTH_PORTAL_URL: undefined,
      VITE_APP_ID: undefined,
      VITE_EMAIL_AUTH: undefined,
    });

    expect(() => getLoginUrl()).not.toThrow();
    expect(getLoginUrl()).toBe(LOGIN_UNAVAILABLE_PATH);
  });

  it("does not throw when the OAuth portal URL is malformed", async () => {
    // Sign-in starts on the server, which validates the portal URL itself, so
    // the browser only ever emits an in-app path.
    const { getLoginUrl } = await loadConst({
      VITE_OAUTH_PORTAL_URL: "not a url",
      VITE_APP_ID: "app_123",
    });

    expect(() => getLoginUrl()).not.toThrow();
    expect(getLoginUrl()).toMatch(/^\/api\/oauth\/start\?returnPath=/);
  });

  it("starts sign-in on the server with the requested return path when the portal is configured", async () => {
    const { getLoginUrl } = await loadConst({
      VITE_OAUTH_PORTAL_URL: "https://oauth.example.com",
      VITE_APP_ID: "app_123",
    });

    const url = new URL(getLoginUrl("/psychiatrist"), "https://app.example.com");
    expect(url.origin).toBe("https://app.example.com");
    expect(url.pathname).toBe("/api/oauth/start");
    // The return path must survive the round trip, or post-login lands the user
    // somewhere they never asked for. The browser never builds OAuth state.
    expect(url.searchParams.get("returnPath")).toBe("/psychiatrist");
    expect(url.searchParams.get("state")).toBeNull();
  });

  it("refuses protocol-relative and external return paths", async () => {
    const { getLoginUrl } = await loadConst({
      VITE_OAUTH_PORTAL_URL: "https://oauth.example.com",
      VITE_APP_ID: "app_123",
    });
    for (const bad of ["//evil.example", "https://evil.example/x", "javascript:alert(1)"]) {
      const url = new URL(getLoginUrl(bad), "https://app.example.com");
      expect(url.searchParams.get("returnPath")).toBe("/dashboard");
    }
  });

  it("falls back to the current pathname when no return path is given", async () => {
    const { getLoginUrl } = await loadConst({
      VITE_OAUTH_PORTAL_URL: "https://oauth.example.com",
      VITE_APP_ID: "app_123",
    });

    const url = new URL(getLoginUrl(), "https://app.example.com");
    expect(url.searchParams.get("returnPath")).toBe("/dashboard");
  });

  it("sends people to the email-link page when that provider is enabled", async () => {
    const { getLoginUrl, isLoginConfigured } = await loadConst({
      VITE_EMAIL_AUTH: "true",
      VITE_OAUTH_PORTAL_URL: undefined,
      VITE_APP_ID: undefined,
    });
    expect(isLoginConfigured()).toBe(true);
    const url = new URL(getLoginUrl("/finance"), "https://app.example.com");
    expect(url.pathname).toBe("/login");
    expect(url.searchParams.get("returnPath")).toBe("/finance");
    expect(new URL(getLoginUrl("//evil.example"), "https://app.example.com").searchParams.get("returnPath")).toBe("/dashboard");
  });

  it("reports whether sign-in is actually available", async () => {
    const configured = await loadConst({
      VITE_OAUTH_PORTAL_URL: "https://oauth.example.com",
      VITE_APP_ID: "app_123",
    });
    expect(configured.isLoginConfigured()).toBe(true);

    const unconfigured = await loadConst({
      VITE_OAUTH_PORTAL_URL: undefined,
      VITE_APP_ID: undefined,
      VITE_EMAIL_AUTH: undefined,
    });
    expect(unconfigured.isLoginConfigured()).toBe(false);
  });
});

describe("useAuth", () => {
  it("does not resolve the login URL in a default parameter", async () => {
    const fs = await import("fs");
    const src = fs.readFileSync("client/src/_core/hooks/useAuth.ts", "utf-8");

    // A default parameter runs getLoginUrl() on every render of every consumer,
    // whether or not a redirect will ever happen. Resolve it at redirect time.
    expect(src).not.toMatch(/redirectPath\s*=\s*getLoginUrl\(\)/);
    expect(src).toMatch(/redirectPath\s*\?\?\s*getLoginUrl\(\)/);
  });
});

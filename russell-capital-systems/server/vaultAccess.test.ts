/**
 * Vault access guards.
 *
 * The DB-backed paths (passphrase set, unlock, lockout) need a database and
 * are covered by the integration suite. What is tested here is the in-memory
 * grant lifecycle — the thing that actually decides, on every request, whether
 * a caller may touch a key.
 */
import { describe, it, expect } from "vitest";
import {
  LOCKOUT_MS,
  MAX_FAILED_ATTEMPTS,
  MIN_PASSPHRASE_LENGTH,
  UNLOCK_TTL_MS,
  VaultAccessError,
  isUnlocked,
  lock,
  requireUnlocked,
} from "./vaultAccess";

describe("Vault access — default state is locked", () => {
  it("treats an unknown session as locked", () => {
    expect(isUnlocked("session-that-never-unlocked")).toBe(false);
  });

  it("throws rather than returning false when a guarded path is reached locked", () => {
    // The guard has to throw. A guard that returns a boolean is a guard
    // somebody eventually forgets to check.
    expect(() => requireUnlocked("no-such-session")).toThrow(VaultAccessError);
    expect(() => requireUnlocked("no-such-session")).toThrow(/locked/i);
  });

  it("stays locked after an explicit lock on a session that was never open", () => {
    lock("no-such-session");
    expect(isUnlocked("no-such-session")).toBe(false);
  });
});

describe("Vault access — the policy constants are set to something defensible", () => {
  it("requires the 32-character minimum passphrase", () => {
    expect(MIN_PASSPHRASE_LENGTH).toBe(32);
  });

  it("expires an unlock rather than leaving it open indefinitely", () => {
    // An unattended laptop should stop being an unattended key store.
    expect(UNLOCK_TTL_MS).toBeGreaterThan(0);
    expect(UNLOCK_TTL_MS).toBeLessThanOrEqual(60 * 60 * 1000);
  });

  it("locks out after a small number of wrong attempts", () => {
    expect(MAX_FAILED_ATTEMPTS).toBeGreaterThan(0);
    expect(MAX_FAILED_ATTEMPTS).toBeLessThanOrEqual(10);
    expect(LOCKOUT_MS).toBeGreaterThanOrEqual(5 * 60 * 1000);
  });
});

describe("Provider registry — failure semantics", () => {
  it("reports no-provider distinctly from all-providers-failed", async () => {
    const { NoProviderAvailableError } = await import("./providerRegistry");

    const none = new NoProviderAvailableError([]);
    expect(none.message).toMatch(/no ai provider is configured/i);

    const allFailed = new NoProviderAvailableError([
      { providerId: "anthropic", error: "rate limited" },
      { providerId: "openai", error: "timeout" },
    ]);
    // Which providers were tried, and why each failed, has to survive into the
    // message — otherwise debugging a dead chain means reading server logs.
    expect(allFailed.message).toMatch(/anthropic: rate limited/);
    expect(allFailed.message).toMatch(/openai: timeout/);
  });
});

describe("Provider adapters — error classification", () => {
  it("exposes the kinds that drive the operator's next action", async () => {
    const { ProviderError } = await import("./aiProviderAdapters");
    const err = new ProviderError({
      kind: "auth",
      providerId: "anthropic",
      status: 401,
      message: "internal detail",
      userMessage: "Anthropic rejected the API key.",
    });
    expect(err.kind).toBe("auth");
    // The internal message may carry provider response text; only userMessage
    // is ever shown.
    expect(err.userMessage).not.toContain("internal detail");
  });
});

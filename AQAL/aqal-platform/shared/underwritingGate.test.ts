import { describe, it, expect } from "vitest";
import {
  underwrittenAccess,
  canAccessCertifiedReport,
  canContinueUnderwriting,
} from "./underwritingGate";
import { UNDERWRITTEN_TRIAL_DAYS } from "./giveawayLadder";

const DAY = 24 * 60 * 60 * 1000;
const NOW = 1_700_000_000_000;

describe("underwriting trial gate", () => {
  it("is not_started before any trial or unlock", () => {
    const a = underwrittenAccess({ trialStartedAt: null, unlockedAt: null, now: NOW });
    expect(a.state).toBe("not_started");
    expect(a.daysLeft).toBe(UNDERWRITTEN_TRIAL_DAYS);
    expect(a.unlocked).toBe(false);
  });

  it("is in trial within the window, counting whole days down", () => {
    const startedAt = NOW - 2 * DAY;
    const a = underwrittenAccess({ trialStartedAt: startedAt, unlockedAt: null, now: NOW });
    expect(a.state).toBe("trial");
    expect(a.daysLeft).toBe(UNDERWRITTEN_TRIAL_DAYS - 2);
    expect(a.expiresAtMs).toBe(startedAt + UNDERWRITTEN_TRIAL_DAYS * DAY);
  });

  it("expires exactly at the end of the window", () => {
    const startedAt = NOW - UNDERWRITTEN_TRIAL_DAYS * DAY;
    const a = underwrittenAccess({ trialStartedAt: startedAt, unlockedAt: null, now: NOW });
    expect(a.state).toBe("expired");
    expect(a.daysLeft).toBe(0);
  });

  it("is unlocked once paid, regardless of trial timing", () => {
    const a = underwrittenAccess({ trialStartedAt: NOW - 30 * DAY, unlockedAt: NOW - DAY, now: NOW });
    expect(a.state).toBe("unlocked");
    expect(a.unlocked).toBe(true);
    expect(a.daysLeft).toBeNull();
  });

  it("gates the certified report to unlocked only", () => {
    expect(canAccessCertifiedReport("unlocked")).toBe(true);
    for (const s of ["not_started", "trial", "expired"] as const) {
      expect(canAccessCertifiedReport(s)).toBe(false);
    }
  });

  it("lets underwriting continue during trial, blocks it only when expired", () => {
    expect(canContinueUnderwriting("trial")).toBe(true);
    expect(canContinueUnderwriting("not_started")).toBe(true);
    expect(canContinueUnderwriting("unlocked")).toBe(true);
    expect(canContinueUnderwriting("expired")).toBe(false);
  });

  it("accepts Date objects too", () => {
    const a = underwrittenAccess({ trialStartedAt: new Date(NOW - DAY), unlockedAt: null, now: NOW });
    expect(a.state).toBe("trial");
  });
});

// ============================================================
// UNDERWRITING TRIAL GATE
// ============================================================
// The fully-underwritten assessment is free to START for UNDERWRITTEN_TRIAL_DAYS
// (7): the member uploads evidence and the panel underwrites it. To KEEP/export
// the certified report they pay ($1,500) — which unlocks it permanently.
//
// This is the pure state machine both the server (enforcement) and client
// (banners) read from, so "how many days left / is it unlocked" is decided in
// exactly one place. `now` is passed in for testability.

import { UNDERWRITTEN_TRIAL_DAYS } from "./giveawayLadder";

export type UnderwrittenState = "not_started" | "trial" | "expired" | "unlocked";

export type UnderwrittenAccess = {
  state: UnderwrittenState;
  daysLeft: number | null;      // whole days remaining in the trial (null once unlocked)
  expiresAtMs: number | null;   // trial end timestamp (null if not started / unlocked)
  unlocked: boolean;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function underwrittenAccess(input: {
  trialStartedAt: Date | number | null;
  unlockedAt: Date | number | null;
  now: number;
}): UnderwrittenAccess {
  if (input.unlockedAt) {
    return { state: "unlocked", daysLeft: null, expiresAtMs: null, unlocked: true };
  }
  if (!input.trialStartedAt) {
    return { state: "not_started", daysLeft: UNDERWRITTEN_TRIAL_DAYS, expiresAtMs: null, unlocked: false };
  }
  const startMs = input.trialStartedAt instanceof Date ? input.trialStartedAt.getTime() : input.trialStartedAt;
  const expiresAtMs = startMs + UNDERWRITTEN_TRIAL_DAYS * DAY_MS;
  const msLeft = expiresAtMs - input.now;
  if (msLeft <= 0) {
    return { state: "expired", daysLeft: 0, expiresAtMs, unlocked: false };
  }
  return { state: "trial", daysLeft: Math.ceil(msLeft / DAY_MS), expiresAtMs, unlocked: false };
}

/** Can the member export / see the final certified underwritten report? Only once paid. */
export function canAccessCertifiedReport(state: UnderwrittenState): boolean {
  return state === "unlocked";
}

/** Can the member keep doing underwriting work (uploading evidence, running the panel)? */
export function canContinueUnderwriting(state: UnderwrittenState): boolean {
  return state === "not_started" || state === "trial" || state === "unlocked";
}

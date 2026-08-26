// ============================================================
// BOUNDED-RETRY CONTRACT — failed daily check-in delivery.
// At most one logical check-in per person per local day, with up
// to DAILY_ACCOUNTABILITY_MAX_ATTEMPTS provider attempts for it:
// the initial send plus same-day re-claims of FAILED sends, one
// per scheduled callback. Rows that are pending/sent, at the
// attempt cap, or carry any recorded reply (incl. STOP) are never
// re-claimed. The single-winner reclaim itself is a conditional
// SQL update in db.ts (needs a live database to race-test); these
// tests cover the orchestrator behavior around it and pin the SQL
// guard conditions at the source level.
// ============================================================
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getTargets: vi.fn(),
  claim: vi.fn(),
  finish: vi.fn(),
  recordEvent: vi.fn(),
  sendEmail: vi.fn(),
  sendSms: vi.fn(),
}));

vi.mock("./db", () => ({
  getActiveReminderCommitments: mocks.getTargets,
  claimDailyAccountabilitySend: mocks.claim,
  finishDailyAccountabilitySend: mocks.finish,
  recordEvent: mocks.recordEvent,
}));
vi.mock("./platform/email", () => ({
  sendEmail: mocks.sendEmail,
  dailyCheckinEmailHtml: ({ dayNumber }: { dayNumber?: number }) => `Day ${dayNumber}`,
}));
vi.mock("./platform/sms", () => ({
  sendSms: mocks.sendSms,
  dailyCheckinSms: () => "Y/N",
}));

import { runDailyAccountability } from "./accountability";

const target = {
  commitmentId: 41,
  userId: 9,
  email: "member@example.com",
  reminderChannel: "text" as const,
  reminderPhone: "+12125550199",
  reminderTimezone: "America/New_York",
  reminderConsentAt: new Date("2026-08-01T00:00:00Z"),
  reminderStartAt: new Date("2026-08-01T00:00:00Z"),
};
const now = new Date("2026-08-15T00:00:00Z"); // 8 PM Aug 14 in New York

describe("bounded retry of failed daily sends", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getTargets.mockResolvedValue([target]);
    mocks.finish.mockResolvedValue(undefined);
    mocks.recordEvent.mockResolvedValue(undefined);
  });

  it("retries on the next callback after a provider failure, then records the success", async () => {
    // Callback 1: claim wins, provider fails → row recorded as failed.
    mocks.claim.mockResolvedValueOnce(true);
    mocks.sendSms.mockResolvedValueOnce({ ok: false, mocked: false, error: "provider down" });
    const first = await runDailyAccountability({ now });
    expect(first).toMatchObject({ sent: 0, failed: 1 });
    expect(mocks.finish).toHaveBeenNthCalledWith(1, 41, "2026-08-14", "failed");

    // Callback 2 (same local day): the claim re-claims the FAILED row,
    // the provider recovers → the same logical check-in is delivered.
    mocks.claim.mockResolvedValueOnce(true);
    mocks.sendSms.mockResolvedValueOnce({ ok: true, mocked: false });
    const second = await runDailyAccountability({ now });
    expect(second).toMatchObject({ sent: 1, failed: 0, duplicates: 0 });
    expect(mocks.finish).toHaveBeenNthCalledWith(2, 41, "2026-08-14", "sent");
    expect(mocks.sendSms).toHaveBeenCalledTimes(2);
  });

  it("stops retrying once the claim refuses (sent, capped, or replied row)", async () => {
    mocks.claim.mockResolvedValue(false);
    const result = await runDailyAccountability({ now });
    expect(result).toMatchObject({ sent: 0, duplicates: 1, failed: 0 });
    expect(mocks.sendSms).not.toHaveBeenCalled();
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("db.ts pins the reclaim guards: failed-only, attempt cap, no recorded reply", () => {
    const src = readFileSync(join(__dirname, "db.ts"), "utf-8");
    expect(src).toMatch(/DAILY_ACCOUNTABILITY_MAX_ATTEMPTS = 3/);
    expect(src).toMatch(/eq\(dailyAccountability\.status, "failed"\)/);
    expect(src).toMatch(/lt\(dailyAccountability\.attemptCount, DAILY_ACCOUNTABILITY_MAX_ATTEMPTS\)/);
    expect(src).toMatch(/isNull\(dailyAccountability\.reply\)/);
    expect(src).toMatch(/attemptCount.*\+ 1/);
  });
});

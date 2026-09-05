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

import { localDateInZone, runDailyAccountability } from "./accountability";

const baseTarget = {
  commitmentId: 41,
  userId: 9,
  email: "member@example.com",
  reminderChannel: "text" as const,
  reminderPhone: "+12125550199",
  reminderTimezone: "America/New_York",
  reminderConsentAt: new Date("2026-08-01T00:00:00Z"),
  reminderStartAt: new Date("2026-08-01T00:00:00Z"),
};

describe("daily accountability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getTargets.mockResolvedValue([baseTarget]);
    mocks.claim.mockResolvedValue(true);
    mocks.finish.mockResolvedValue(undefined);
    mocks.recordEvent.mockResolvedValue(undefined);
    mocks.sendSms.mockResolvedValue({ ok: true, mocked: false });
    mocks.sendEmail.mockResolvedValue({ ok: true, mocked: false });
  });

  it("uses the member's timezone for the idempotency date", () => {
    const instant = new Date("2026-08-26T00:30:00Z");
    expect(localDateInZone("America/New_York", instant)).toBe("2026-08-25");
    expect(localDateInZone("Asia/Tokyo", instant)).toBe("2026-08-26");
  });

  it("sends once and records the local-date claim", async () => {
    const now = new Date("2026-08-15T00:00:00Z"); // 8 PM Aug 14 in New York
    const result = await runDailyAccountability({ now });
    expect(result).toMatchObject({ sent: 1, duplicates: 0, failed: 0 });
    expect(mocks.claim).toHaveBeenCalledWith(expect.objectContaining({ localDate: "2026-08-14" }));
    expect(mocks.sendSms).toHaveBeenCalledTimes(1);
    expect(mocks.finish).toHaveBeenCalledWith(41, "2026-08-14", "sent");
  });

  it("does not send again when the commitment/day claim already exists", async () => {
    mocks.claim.mockResolvedValue(false);
    const result = await runDailyAccountability({ now: new Date("2026-08-15T00:00:00Z") });
    expect(result).toMatchObject({ sent: 0, duplicates: 1 });
    expect(mocks.sendSms).not.toHaveBeenCalled();
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("records a failed channel result without reporting a send", async () => {
    mocks.sendSms.mockResolvedValue({ ok: false, mocked: false, error: "provider unavailable" });
    const result = await runDailyAccountability({ now: new Date("2026-08-15T00:00:00Z") });
    expect(result).toMatchObject({ sent: 0, failed: 1 });
    expect(mocks.finish).toHaveBeenCalledWith(41, "2026-08-14", "failed");
  });
});

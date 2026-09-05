import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  sendEmail: vi.fn(),
  unsubscribeUrl: vi.fn((base: string) => `${base.replace(/\/$/, "")}/api/unsubscribe?t=opaque-token`),
}));

vi.mock("./db", () => ({ getDb: mocks.getDb }));
vi.mock("./platform/email", () => ({
  sendEmail: mocks.sendEmail,
  unsubscribeUrl: mocks.unsubscribeUrl,
  withUnsubscribeFooter: (html: string, url: string) => `${html}<footer>${url}</footer>`,
}));

import { sendMarketingEmail } from "./marketingEmail";

function fakeDb(rows: Array<{ id: number }>) {
  return {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({ limit: vi.fn(async () => rows) })),
      })),
    })),
  };
}

describe("sendMarketingEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sendEmail.mockResolvedValue({ ok: true, mocked: false, id: "message-1" });
  });

  it("fails closed when suppression state cannot be loaded", async () => {
    mocks.getDb.mockResolvedValue(null);
    const result = await sendMarketingEmail("person@example.com", "Subject", "<p>Body</p>", "https://www.joinaqal.com");
    expect(result).toMatchObject({ ok: false, skipped: true, reason: "database-unavailable" });
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("skips opted-out recipients without sending", async () => {
    mocks.getDb.mockResolvedValue(fakeDb([{ id: 7 }]));
    const result = await sendMarketingEmail("Person@Example.com", "Subject", "<p>Body</p>", "https://www.joinaqal.com");
    expect(result).toMatchObject({ ok: false, skipped: true, reason: "opted-out" });
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("fails closed when the opt-out query throws", async () => {
    mocks.getDb.mockRejectedValue(new Error("database down"));
    const result = await sendMarketingEmail("person@example.com", "Subject", "<p>Body</p>", "https://www.joinaqal.com");
    expect(result).toMatchObject({ ok: false, skipped: true, reason: "opt-out-check-failed" });
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("adds an unsubscribe footer and RFC 8058 headers for eligible recipients", async () => {
    mocks.getDb.mockResolvedValue(fakeDb([]));
    const result = await sendMarketingEmail(" Person@Example.COM ", "Subject", "<p>Body</p>", "https://www.joinaqal.com/");
    expect(result).toMatchObject({ ok: true });
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      "person@example.com",
      "Subject",
      expect.stringContaining("/api/unsubscribe?t=opaque-token"),
      {
        headers: {
          "List-Unsubscribe": "<https://www.joinaqal.com/api/unsubscribe?t=opaque-token>",
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      },
    );
  });
});

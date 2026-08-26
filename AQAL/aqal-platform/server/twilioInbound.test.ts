import { createHmac } from "crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findTarget: vi.fn(),
  recordReply: vi.fn(),
  stop: vi.fn(),
}));

vi.mock("./platform/config", () => ({ TWILIO_AUTH_TOKEN: "test-token" }));
vi.mock("./db", () => ({
  getCurrentTextCommitmentByPhone: mocks.findTarget,
  recordDailyAccountabilityReply: mocks.recordReply,
  stopTextRemindersForCommitment: mocks.stop,
}));

import { normalizeAccountabilityReply, twilioInboundHandler, validateTwilioSignature } from "./twilioInbound";

const url = "https://www.joinaqal.com/api/webhooks/twilio/inbound";
function signature(params: Record<string, string>) {
  const payload = Object.keys(params).sort().reduce((out, key) => out + key + params[key], url);
  return createHmac("sha1", "test-token").update(payload).digest("base64");
}

function response() {
  const res: any = {
    code: 200,
    body: "",
    type: vi.fn(() => res),
    status: vi.fn((code: number) => { res.code = code; return res; }),
    send: vi.fn((body: string) => { res.body = body; return res; }),
  };
  return res;
}

describe("Twilio accountability webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findTarget.mockResolvedValue({ commitmentId: 41, userId: 9, reminderTimezone: "America/New_York" });
    mocks.recordReply.mockResolvedValue("recorded");
    mocks.stop.mockResolvedValue(undefined);
  });

  it("normalizes only Y, N, and STOP commands", () => {
    expect(normalizeAccountabilityReply(" yes ")).toBe("yes");
    expect(normalizeAccountabilityReply("N")).toBe("no");
    expect(normalizeAccountabilityReply("stop")).toBe("stop");
    expect(normalizeAccountabilityReply("my private journal text")).toBeNull();
  });

  it("validates the documented Twilio HMAC-SHA1 signature", () => {
    const params = { Body: "Y", From: "+12125550199", MessageSid: "SM123" };
    expect(validateTwilioSignature("test-token", signature(params), url, params)).toBe(true);
    expect(validateTwilioSignature("test-token", "wrong", url, params)).toBe(false);
  });

  it("rejects an invalid signature before reading member data", async () => {
    const params = { Body: "Y", From: "+12125550199", MessageSid: "SM123" };
    const req: any = { body: params, headers: { host: "www.joinaqal.com", "x-twilio-signature": "wrong" }, protocol: "https", originalUrl: "/api/webhooks/twilio/inbound" };
    const res = response();
    await twilioInboundHandler(req, res);
    expect(res.code).toBe(403);
    expect(mocks.findTarget).not.toHaveBeenCalled();
  });

  it("records STOP once and disables the current commitment's text channel", async () => {
    const params = { Body: "STOP", From: "+12125550199", MessageSid: "SM-stop-1" };
    const req: any = { body: params, headers: { host: "www.joinaqal.com", "x-twilio-signature": signature(params) }, protocol: "https", originalUrl: "/api/webhooks/twilio/inbound" };
    const res = response();
    await twilioInboundHandler(req, res);
    expect(res.code).toBe(200);
    expect(mocks.recordReply).toHaveBeenCalledWith(expect.objectContaining({ reply: "stop", sourceMessageSid: "SM-stop-1" }));
    expect(mocks.stop).toHaveBeenCalledWith(41);
    expect(res.body).toContain("now off");
  });
});

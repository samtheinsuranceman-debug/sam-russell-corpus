import { describe, expect, it } from "vitest";
import { buildObjectionReport } from "./whispererReports";
import { coach, type ClientContext, type Turn } from "@shared/whispererEngine";
import { parseVisionReply, toneFromEnergy } from "./whispererVision";
import { rtmsSignature, verifyZoomWebhook, zoomValidationResponse, pcmRms } from "./zoom";
import { createHmac } from "crypto";

const client: ClientContext = {
  name: "Dr. Elena Park", firstName: "Elena",
  money: { netWorth: 3_255_000, cash: 200_000, homeEquity: 500_000, mortgage: 400_000, preTaxRetirement: 1_250_000, roth: 60_000, taxable: 400_000, annuity: 250_000, income: 420_000, age: 47, hasAdvisor: true, advisorName: "Mark", hasSpouse: true, spouseName: "David" },
  priorCalls: ["2026-08-30: 40 min call; read as analytical; objections raised: fees"],
  priorObjections: ["fees-cost"],
  priorDecisionType: "analytical",
};

const turns: Turn[] = [
  { at: 0, speaker: "advisor", text: "Thanks for making the time, Elena. What made this the week?", durationMs: 4000 },
  { at: 6000, speaker: "client", text: "Honestly, my guy at Schwab already handles this and the fees on insurance products worry me. Show me the numbers.", durationMs: 9000 },
  { at: 20_000, speaker: "advisor", text: "Fair. Here is the plan: the Mortgage Killer cycle first, then the Roth sequencing.", durationMs: 8000 },
];

describe("objection reports", () => {
  it("builds a twenty-page-plus PDF from the client's own figures", async () => {
    const coaching = coach({ turns, signals: [], client, now: 40_000 });
    const o = coaching.objections[0];
    const r = await buildObjectionReport({ objection: o, client, coaching, turns, cycle: 1, advisorName: "Sam Russell", generatedAt: new Date("2026-09-16T12:00:00Z") });
    expect(r.pages).toBeGreaterThanOrEqual(20);
    expect(r.pdf.length).toBeGreaterThan(40_000);
    expect(r.pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(r.title).toBe(o.title);
  }, 60_000);
});

describe("vision and tone", () => {
  it("parses the model's JSON and reads energy history into tone", () => {
    expect(parseVisionReply('Sure: {"summary":"leaning in, nodding","score":0.7,"attention":0.9}')).toEqual({ summary: "leaning in, nodding", score: 0.7, attention: 0.9 });
    expect(parseVisionReply("no json here")).toBeNull();
    expect(toneFromEnergy([0.08, 0.09, 0.07, 0.08, 0.09, 0.08], 1000)?.value).toMatch(/steady/);
    expect(toneFromEnergy([0.001, 0.002, 0.001, 0.001, 0.002], 1000)?.value).toMatch(/silent/);
    expect(pcmRms(Buffer.alloc(0))).toBe(0);
  });
});

describe("zoom security", () => {
  it("validates the URL challenge and checks the event signature over the raw body", () => {
    const env = { ZOOM_WEBHOOK_SECRET_TOKEN: "s3cret", ZOOM_CLIENT_ID: "cid", ZOOM_CLIENT_SECRET: "csec" };
    expect(zoomValidationResponse("abc", env).encryptedToken).toBe(createHmac("sha256", "s3cret").update("abc").digest("hex"));
    const body = JSON.stringify({ event: "meeting.rtms_started" });
    const ts = "1700000000";
    const sig = `v0=${createHmac("sha256", "s3cret").update(`v0:${ts}:${body}`).digest("hex")}`;
    expect(verifyZoomWebhook({ "x-zm-request-timestamp": ts, "x-zm-signature": sig }, body, env)).toBe(true);
    expect(verifyZoomWebhook({ "x-zm-request-timestamp": ts, "x-zm-signature": "v0=bad" }, body, env)).toBe(false);
    expect(rtmsSignature("uuid", "stream", env)).toBe(createHmac("sha256", "csec").update("cid,uuid,stream").digest("hex"));
  });
});

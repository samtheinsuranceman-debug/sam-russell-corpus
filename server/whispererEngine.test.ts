import { describe, expect, it } from "vitest";
import {
  buildCues, coach, coachingSms, detectPhase, inferDecisionType, moodFrom, parseTranscript, pickQuestions, predictObjections, talkStats,
  type ClientContext, type Signal, type Turn,
} from "@shared/whispererEngine";

const client: ClientContext = {
  name: "Dr. Elena Park", firstName: "Elena",
  money: { netWorth: 3_255_000, cash: 200_000, homeEquity: 500_000, mortgage: 400_000, preTaxRetirement: 1_250_000, roth: 60_000, taxable: 400_000, annuity: 250_000, rentalEquity: 350_000, rentalMortgage: 600_000, crypto: 40_000, age: 47, hasAdvisor: true, advisorName: "Mark", hasSpouse: true, spouseName: "David" },
  priorCalls: ["2026-08-30: 40 min call, ended in presentation; read as analytical; objections raised: fees"],
  priorObjections: ["fees-cost"],
  priorDecisionType: "analytical",
};

function t(at: number, speaker: Turn["speaker"], text: string, durationMs?: number): Turn {
  return { at, speaker, text, durationMs };
}

describe("talk statistics and cues", () => {
  it("measures airtime and the running monologue", () => {
    const turns = [t(0, "client", "Hi, thanks for making time.", 3000), t(4000, "advisor", "x ".repeat(150), 70_000)];
    const s = talkStats(turns, 3 * 60_000, 80_000);
    expect(s.advisorPct).toBeGreaterThan(90);
    expect(s.lastAdvisorMonologueSec).toBe(70);
    const cues = buildCues(s, { score: 0, label: "neutral", trend: "steady", latestSignals: [] }, "presentation", turns, [], 80_000);
    expect(cues[0].kind).toBe("stop-talking");
    expect(cues[0].urgency).toBe(3);
  });
  it("tells the advisor to close on a buying signal and to acknowledge a sour mood", () => {
    const turns = [t(0, "advisor", "Here is the plan.", 5000), t(6000, "client", "That makes sense. How do we get started?", 4000)];
    const c = coach({ turns, signals: [], client, now: 12_000 });
    expect(c.cues.some((x) => x.kind === "close")).toBe(true);
    expect(c.buyingSignals.length).toBe(1);
    const sour: Signal[] = [{ at: 10_000, kind: "body", value: "arms crossed, leaning back, jaw tight", score: -0.7, source: "vision-model" }];
    const c2 = coach({ turns: [t(0, "advisor", "Here is the plan.", 5000), t(6000, "client", "Hmm. I'm not sure about that.", 3000)], signals: sour, client, now: 12_000 });
    expect(c2.mood.score).toBeLessThan(-0.2);
    expect(c2.cues[0].kind).toBe("acknowledge");
  });
});

describe("decision type, phase and mood", () => {
  it("reads an analytical client from the words and the prior", () => {
    const turns = [t(0, "client", "Show me the numbers and the assumptions behind the guarantee. What are the fees exactly?", 8000)];
    const d = inferDecisionType(turns, "analytical");
    expect(d.type).toBe("analytical");
    expect(d.confidence).toBeGreaterThan(0.5);
    expect(d.evidence.length).toBeGreaterThan(0);
  });
  it("reads a driver from short, bottom-line speech", () => {
    const d = inferDecisionType([t(0, "client", "Bottom line. How much?", 2000), t(3000, "client", "Just tell me the number.", 2000)]);
    expect(d.type).toBe("driver");
  });
  it("detects the phase from recent speech", () => {
    expect(detectPhase([t(0, "client", "Hello"), t(1000, "advisor", "Hi")], 30_000)).toBe("opening");
    expect(detectPhase([t(0, "advisor", "Here is the strategy: the Mortgage Killer plan, step one."), t(5000, "advisor", "The IUL then pays you.")], 600_000)).toBe("presentation");
    expect(detectPhase([t(0, "client", "But I'm not sure, the fees worry me and what if it drops?")], 600_000)).toBe("objections");
    expect(detectPhase([t(0, "client", "When can we start? What do you need from me?")], 600_000)).toBe("close");
  });
  it("blends signals and words into a mood with a trend", () => {
    const old: Signal[] = [{ at: 60_000, kind: "tone", value: "warm", score: 0.6 }];
    const recent: Signal[] = [{ at: 480_000, kind: "body", value: "leaning back", score: -0.4 }];
    const m = moodFrom([...old, ...recent], [t(470_000, "client", "I don't know, this is confusing.")], 500_000);
    expect(m.trend).toBe("cooling");
    expect(m.score).toBeLessThan(0);
  });
});

describe("questions and objections", () => {
  it("offers five questions that fit the phase and the client, personalised with their figures", () => {
    const qs = pickQuestions("discovery", "analytical", client);
    expect(qs).toHaveLength(5);
    expect(qs.some((q) => q.text.includes("$400,000") || q.text.includes("$200,000") || q.text.includes("$1,250,000"))).toBe(true);
    const asked = pickQuestions("discovery", "analytical", client, [qs[0].text]);
    expect(asked[0].id).not.toBe(qs[0].id);
  });
  it("predicts five objections, boosted by the file and by what was just said", () => {
    const turns = [t(0, "client", "My guy at Schwab already handles this. And honestly the fees on insurance products worry me.", 9000)];
    const obs = predictObjections(turns, client, "analytical", "presentation", 20_000);
    expect(obs).toHaveLength(5);
    const ids = obs.map((o) => o.id);
    expect(ids).toContain("already-advisor");
    expect(ids).toContain("fees-cost");
    expect(obs[0].likelihood).toBeGreaterThan(obs[4].likelihood);
    for (const o of obs) {
      expect(o.talkTrack.length).toBeGreaterThan(40);
      expect(o.strategies.length).toBeGreaterThanOrEqual(3);
      expect(o.calculators.length).toBeGreaterThanOrEqual(1);
    }
    expect(obs.find((o) => o.id === "already-advisor")!.talkTrack).toContain("Mark");
  });
  it("renders a phone-sized coaching text", () => {
    const c = coach({ turns: [t(0, "client", "Show me the numbers.")], signals: [], client, now: 90_000 });
    const sms = coachingSms(c, "Elena");
    expect(sms.length).toBeLessThanOrEqual(1200);
    expect(sms).toContain("Ask one:");
    expect(sms).toContain("Coming next 5 min:");
    expect(sms.split("\n").filter((l) => /^\d\. /.test(l))).toHaveLength(5);
  });
});

describe("transcripts", () => {
  it("parses a Zoom VTT into turns with the advisor identified", () => {
    const vtt = `WEBVTT\n\n1\n00:00:01.000 --> 00:00:04.000\nSam Russell: Thanks for joining, Elena.\n\n2\n00:00:05.000 --> 00:00:09.000\nElena Park: Happy to. Show me the numbers.\n`;
    const turns = parseTranscript(vtt, ["Sam Russell"]);
    expect(turns).toHaveLength(2);
    expect(turns[0].speaker).toBe("advisor");
    expect(turns[1].speaker).toBe("client");
    expect(turns[1].at).toBe(5000);
  });
});

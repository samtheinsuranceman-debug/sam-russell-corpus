import { describe, it, expect } from "vitest";
import {
  COMMITMENT_QUESTIONS,
  answeredCount,
  commitmentReady,
  toBullets,
  buildCommitmentMarkdown,
  localHourInZone,
  shouldSendCheckinNow,
  DAILY_CHECKIN_HOUR,
  type CommitmentAnswer,
} from "@shared/commitment";

const fullAnswers = (): CommitmentAnswer[] =>
  COMMITMENT_QUESTIONS.map((q) => ({ key: q.key, transcript: `A spoken answer for ${q.label}.` }));

describe("commitment agreement", () => {
  it("asks for five reasons on the first two questions", () => {
    expect(COMMITMENT_QUESTIONS[0].wantReasons).toBe(5);
    expect(COMMITMENT_QUESTIONS[1].wantReasons).toBe(5);
  });

  it("counts only non-empty spoken answers", () => {
    expect(answeredCount([])).toBe(0);
    const partial: CommitmentAnswer[] = [
      { key: "why_now", transcript: "Because I am done waiting." },
      { key: "to_gain", transcript: "   " }, // whitespace only → not counted
    ];
    expect(answeredCount(partial)).toBe(1);
  });

  it("is ready to sign only when every question is answered aloud", () => {
    expect(commitmentReady([])).toBe(false);
    expect(commitmentReady(fullAnswers())).toBe(true);
  });

  it("splits a run-on spoken answer into bullets", () => {
    const spoken =
      "Reason one, I am tired of feeling stuck. Number two, my kids are watching me. Three, I finally have the data.";
    const bullets = toBullets(spoken);
    expect(bullets.length).toBeGreaterThanOrEqual(3);
    expect(bullets.join(" ").toLowerCase()).toContain("kids are watching");
  });

  it("falls back to the whole utterance when there are no clear breaks", () => {
    expect(toBullets("i just know it is time")).toEqual(["i just know it is time"]);
    expect(toBullets("")).toEqual([]);
  });

  it("renders a markdown agreement with the person's words and signature", () => {
    const md = buildCommitmentMarkdown({
      name: "Sam",
      goals: "Save my marriage and be present for my kids.",
      answers: fullAnswers(),
      signedName: "Sam Russell",
      signedAtISO: "2026-07-17T12:00:00.000Z",
      reminderChannel: "text",
    });
    expect(md).toContain("My Personal Commitment Agreement");
    expect(md).toContain("The outcomes I declared");
    expect(md).toContain("Save my marriage");
    expect(md).toContain("Signed:");
    expect(md).toContain("Sam Russell");
    expect(md).toContain("2026-07-17");
    expect(md.toLowerCase()).toContain("text message");
    // Not a legal document — stated explicitly.
    expect(md.toLowerCase()).toContain("not a legal document");
  });

  it("marks unanswered questions and unsigned state honestly", () => {
    const md = buildCommitmentMarkdown({ answers: [] });
    expect(md).toContain("(not yet answered)");
    expect(md.toLowerCase()).toContain("not yet signed");
  });
});

describe("daily check-in timezone targeting", () => {
  // 2026-07-17T20:00:00Z is 20:00 UTC → 16:00 in New York (EDT, UTC-4).
  const utc8pm = new Date("2026-07-17T20:00:00Z");
  // 2026-07-18T00:00:00Z is 20:00 in New York (EDT).
  const ny8pm = new Date("2026-07-18T00:00:00Z");

  it("computes the local hour in an IANA zone", () => {
    expect(localHourInZone("UTC", utc8pm)).toBe(20);
    expect(localHourInZone("America/New_York", utc8pm)).toBe(16);
    expect(localHourInZone("America/New_York", ny8pm)).toBe(20);
  });

  it("returns null for an invalid zone so callers can fall back", () => {
    expect(localHourInZone("Not/AZone", utc8pm)).toBeNull();
  });

  it("sends only at 8 PM in the person's own timezone", () => {
    expect(shouldSendCheckinNow("America/New_York", ny8pm)).toBe(true);
    expect(shouldSendCheckinNow("America/New_York", utc8pm)).toBe(false);
    expect(shouldSendCheckinNow("UTC", utc8pm)).toBe(true);
  });

  it("falls back to Eastern when the timezone is missing/blank", () => {
    // ny8pm is 8 PM Eastern → a null zone falls back to Eastern and fires.
    expect(shouldSendCheckinNow(null, ny8pm)).toBe(true);
    expect(shouldSendCheckinNow("", utc8pm)).toBe(false);
  });

  it("targets 8 PM by default", () => {
    expect(DAILY_CHECKIN_HOUR).toBe(20);
  });
});

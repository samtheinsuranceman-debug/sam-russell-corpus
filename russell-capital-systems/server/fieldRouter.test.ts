import { describe, it, expect } from "vitest";
import { computeReputation, computeStreak, DAILY_TARGET } from "./fieldRouter";

const NOW = new Date("2026-09-13T18:00:00Z");

function at(daysBack: number, count = 1, source = "field_checkin") {
  const d = new Date(NOW);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysBack);
  d.setHours(9, 0, 0, 0);
  return Array.from({ length: count }, () => ({ content: "field unified", source, createdAt: new Date(d) }));
}

describe("The Field — social score", () => {
  it("scores an empty field at zero with a black eye", () => {
    const rep = computeReputation([], NOW);
    expect(rep.score).toBe(0);
    expect(rep.tier).toBe("blackEye");
  });

  it("awards a crown for a full week of complete rhythm plus self-talk", () => {
    const notes = [
      ...Array.from({ length: 7 }, (_, d) => at(d, DAILY_TARGET)).flat(),
      ...Array.from({ length: 7 }, (_, d) => at(d, 1, "field_audio")).flat(),
    ];
    const rep = computeReputation(notes, NOW);
    expect(rep.score).toBe(100);
    expect(rep.tier).toBe("crown");
    expect(rep.breakdown.checkInDays).toBe(7);
    expect(rep.breakdown.audioDays).toBe(7);
  });

  it("lands between the thresholds for a partial week", () => {
    // 4 of 7 days, 2 check-ins each, no self-talk.
    const notes = [0, 1, 2, 3].flatMap(d => at(d, 2));
    const rep = computeReputation(notes, NOW);
    expect(rep.score).toBeGreaterThan(0);
    expect(rep.score).toBeLessThan(75);
    expect(rep.breakdown.voice).toBe(0);
  });

  it("ignores activity older than the seven-day window", () => {
    const rep = computeReputation(at(30, DAILY_TARGET), NOW);
    expect(rep.score).toBe(0);
  });

  it("does not count chat alone as embodiment", () => {
    const notes = Array.from({ length: 7 }, (_, d) => at(d, 5, "field_chat")).flat();
    expect(computeReputation(notes, NOW).score).toBe(0);
  });
});

describe("The Field — streak", () => {
  it("counts consecutive days ending today", () => {
    const notes = [0, 1, 2].flatMap(d => at(d));
    expect(computeStreak(notes, NOW)).toBe(3);
  });

  it("survives a day that has not been checked in yet", () => {
    // Nothing today, but yesterday and the day before are logged.
    const notes = [1, 2].flatMap(d => at(d));
    expect(computeStreak(notes, NOW)).toBe(2);
  });

  it("breaks on a missed day", () => {
    const notes = [0, 1, 3, 4].flatMap(d => at(d));
    expect(computeStreak(notes, NOW)).toBe(2);
  });

  it("is zero with no check-ins", () => {
    expect(computeStreak([], NOW)).toBe(0);
    expect(computeStreak(at(0, 3, "field_chat"), NOW)).toBe(0);
  });
});

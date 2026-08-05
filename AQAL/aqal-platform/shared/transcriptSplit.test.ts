import { describe, it, expect } from "vitest";
import { splitTranscript } from "./transcriptSplit";

describe("splitTranscript", () => {
  it("splits on spoken digit markers", () => {
    const t = "Question 1. I would build a park with rides. Question 2: my superpower would be flight and more talking here.";
    const segs = splitTranscript(t);
    expect(segs.map((s) => s.question)).toEqual([1, 2]);
    expect(segs[0].text).toContain("park with rides");
    expect(segs[1].text).toContain("flight");
  });

  it("handles spelled-out numbers including compounds", () => {
    const t = "question one blah blah blah. Question twenty seven, at the end of my life I pass on courage.";
    const segs = splitTranscript(t);
    expect(segs.map((s) => s.question)).toEqual([1, 27]);
    expect(segs[1].text).toContain("courage");
  });

  it("handles 'question number seven' and Q-shorthand", () => {
    const t = "Question number seven: my seven perfect things are... Q8. the concert opens with...";
    const segs = splitTranscript(t);
    expect(segs.map((s) => s.question)).toEqual([7, 8]);
  });

  it("concatenates restarts of the same question", () => {
    const t = "Question 3 first attempt words here. Question 3 actually let me start over with better words.";
    const segs = splitTranscript(t);
    expect(segs.length).toBe(1);
    expect(segs[0].text).toContain("first attempt");
    expect(segs[0].text).toContain("start over");
  });

  it("ignores out-of-range numbers and returns [] with no markers", () => {
    expect(splitTranscript("Question 99 nope.")).toEqual([]);
    expect(splitTranscript("just a long ramble with no markers at all")).toEqual([]);
  });

  it("is case-insensitive and survives punctuation noise", () => {
    const t = "QUESTION FIVE, the zoo has a glass whale. question Six. my dreams are...";
    const segs = splitTranscript(t);
    expect(segs.map((s) => s.question)).toEqual([5, 6]);
  });

  it("counts words per segment", () => {
    const segs = splitTranscript("Question 1. one two three four five");
    expect(segs[0].words).toBe(5);
  });
});

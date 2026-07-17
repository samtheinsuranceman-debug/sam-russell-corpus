import { describe, it, expect } from "vitest";
import { buildTrackerMarkdown } from "@shared/behavioralTracker";
import { buildProjections } from "@shared/keystonePractices";

describe("behavioral tracker generation", () => {
  it("builds a 30-day tracker with a heading per day", () => {
    const md = buildTrackerMarkdown({ projections: buildProjections("save my marriage"), days: 30 });
    expect(md).toContain("30-Day Behavioral Tracker");
    expect(md).toContain("### Day 1");
    expect(md).toContain("### Day 30");
    expect(md).not.toContain("### Day 31");
  });

  it("includes the prescribed practices and the honest self-report note", () => {
    const md = buildTrackerMarkdown({ projections: buildProjections("save my marriage"), goals: "save my marriage" });
    expect(md.toLowerCase()).toContain("relationship media");
    expect(md.toLowerCase()).toContain("self-reported");
  });

  it("clamps day count into [1,90] and works with empty projections", () => {
    const big = buildTrackerMarkdown({ projections: [], days: 999 });
    expect(big).toContain("### Day 90");
    expect(big).not.toContain("### Day 91");
    const small = buildTrackerMarkdown({ projections: [], days: 0 });
    expect(small).toContain("### Day 1");
  });
});

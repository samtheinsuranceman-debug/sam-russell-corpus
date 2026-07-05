import { describe, it, expect, vi } from "vitest";

// Mock the db module
vi.mock("./db", () => ({
  getNlpProfile: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    assessmentId: 1,
    visualPercent: 45,
    auditoryPercent: 25,
    kinestheticPercent: 20,
    olfactoryGustatoryPercent: 10,
    primaryRepSystem: "visual",
    repSystemSequence: "V-K-A",
    towardAway: 0.7,
    internalExternal: 0.8,
    optionsProcedures: 0.6,
    bigPictureDetail: 0.75,
    proactiveReactive: 0.65,
    matcherMismatcher: 0.5,
    selfOther: 0.4,
    possibilityNecessity: 0.7,
    wordsPerMinute: 145,
    hesitationFrequency: 0.12,
    confidenceScore: 0.78,
    sensoryPredicates: {
      visual: ["see", "bright", "picture", "illuminate"],
      auditory: ["sounds like", "resonates"],
      kinesthetic: ["feel", "grasp"],
      olfactoryGustatory: ["taste"],
    },
  }),
  saveNlpProfile: vi.fn().mockResolvedValue(undefined),
  getCoachingLetters: vi.fn().mockResolvedValue([
    {
      id: 1,
      userId: 1,
      tier: "gold",
      subject: "Integrating Your Systems Thinking",
      body: "Dear friend, picture this...",
      repSystemUsed: "visual",
      sentAt: Date.now(),
      readAt: null,
    },
  ]),
  saveCoachingLetter: vi.fn().mockResolvedValue(1),
  markLetterRead: vi.fn().mockResolvedValue(undefined),
}));

describe("NLP Profile", () => {
  it("should have correct representational system structure", async () => {
    const { getNlpProfile } = await import("./db");
    const profile = await getNlpProfile(1);
    
    expect(profile).not.toBeNull();
    expect(profile!.primaryRepSystem).toBe("visual");
    expect(profile!.visualPercent + profile!.auditoryPercent + profile!.kinestheticPercent + profile!.olfactoryGustatoryPercent).toBe(100);
    expect(profile!.repSystemSequence).toMatch(/^[VAKO]-[VAKO]-[VAKO]$/);
  });

  it("should have meta-programs in valid range (0-1)", async () => {
    const { getNlpProfile } = await import("./db");
    const profile = await getNlpProfile(1);
    
    expect(profile!.towardAway).toBeGreaterThanOrEqual(0);
    expect(profile!.towardAway).toBeLessThanOrEqual(1);
    expect(profile!.internalExternal).toBeGreaterThanOrEqual(0);
    expect(profile!.internalExternal).toBeLessThanOrEqual(1);
    expect(profile!.bigPictureDetail).toBeGreaterThanOrEqual(0);
    expect(profile!.bigPictureDetail).toBeLessThanOrEqual(1);
  });

  it("should have sensory predicates categorized by system", async () => {
    const { getNlpProfile } = await import("./db");
    const profile = await getNlpProfile(1);
    const predicates = profile!.sensoryPredicates as any;
    
    expect(predicates.visual).toBeInstanceOf(Array);
    expect(predicates.auditory).toBeInstanceOf(Array);
    expect(predicates.kinesthetic).toBeInstanceOf(Array);
    expect(predicates.visual.length).toBeGreaterThan(0);
  });

  it("should have voice pattern metrics", async () => {
    const { getNlpProfile } = await import("./db");
    const profile = await getNlpProfile(1);
    
    expect(profile!.wordsPerMinute).toBeGreaterThan(0);
    expect(profile!.hesitationFrequency).toBeGreaterThanOrEqual(0);
    expect(profile!.hesitationFrequency).toBeLessThanOrEqual(1);
    expect(profile!.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(profile!.confidenceScore).toBeLessThanOrEqual(1);
  });
});

describe("Coaching Letters", () => {
  it("should return letters for a user", async () => {
    const { getCoachingLetters } = await import("./db");
    const letters = await getCoachingLetters(1);
    
    expect(letters.length).toBeGreaterThan(0);
    expect(letters[0].tier).toBe("gold");
    expect(letters[0].subject).toBeTruthy();
    expect(letters[0].body).toBeTruthy();
    expect(letters[0].repSystemUsed).toBe("visual");
  });

  it("should save a coaching letter and return an ID", async () => {
    const { saveCoachingLetter } = await import("./db");
    const id = await saveCoachingLetter({
      userId: 1,
      tier: "gold",
      subject: "Test Letter",
      body: "Dear friend...",
      repSystemUsed: "kinesthetic",
      sentAt: Date.now(),
    });
    
    expect(id).toBe(1);
    expect(saveCoachingLetter).toHaveBeenCalledWith(expect.objectContaining({
      tier: "gold",
      repSystemUsed: "kinesthetic",
    }));
  });

  it("should mark a letter as read", async () => {
    const { markLetterRead } = await import("./db");
    await markLetterRead(1);
    expect(markLetterRead).toHaveBeenCalledWith(1);
  });
});

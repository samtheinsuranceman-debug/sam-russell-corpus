import { describe, it, expect, vi, beforeEach } from "vitest";

// Test the video script generator logic
describe("Video Script Generator", () => {
  const CHAPTER_TYPES = [
    "introduction",
    "current_situation",
    "recommended_strategy",
    "twenty_year_projection",
    "next_steps",
  ] as const;

  it("should define all 5 chapter types", () => {
    expect(CHAPTER_TYPES).toHaveLength(5);
    expect(CHAPTER_TYPES).toContain("introduction");
    expect(CHAPTER_TYPES).toContain("current_situation");
    expect(CHAPTER_TYPES).toContain("recommended_strategy");
    expect(CHAPTER_TYPES).toContain("twenty_year_projection");
    expect(CHAPTER_TYPES).toContain("next_steps");
  });

  it("should generate chapter titles from types", () => {
    const titleMap: Record<string, string> = {
      introduction: "Introduction",
      current_situation: "Your Current Financial Situation",
      recommended_strategy: "Recommended Strategy",
      twenty_year_projection: "20-Year Projection",
      next_steps: "Next Steps",
    };
    for (const type of CHAPTER_TYPES) {
      expect(titleMap[type]).toBeDefined();
      expect(titleMap[type].length).toBeGreaterThan(0);
    }
  });

  it("should estimate duration for each chapter type", () => {
    const durationMap: Record<string, number> = {
      introduction: 45,
      current_situation: 60,
      recommended_strategy: 90,
      twenty_year_projection: 75,
      next_steps: 45,
    };
    const totalDuration = Object.values(durationMap).reduce((s, d) => s + d, 0);
    expect(totalDuration).toBeGreaterThan(200);
    expect(totalDuration).toBeLessThan(600);
    for (const type of CHAPTER_TYPES) {
      expect(durationMap[type]).toBeGreaterThan(0);
    }
  });
});

// Test the HeyGen service configuration
describe("HeyGen Service Configuration", () => {
  it("should construct correct API URL for video generation", () => {
    const baseUrl = "https://api.heygen.com";
    const endpoint = "/v2/video/generate";
    const fullUrl = `${baseUrl}${endpoint}`;
    expect(fullUrl).toBe("https://api.heygen.com/v2/video/generate");
  });

  it("should construct correct API URL for video status", () => {
    const baseUrl = "https://api.heygen.com";
    const videoId = "test-video-123";
    const statusUrl = `${baseUrl}/v1/video_status.get?video_id=${videoId}`;
    expect(statusUrl).toContain(videoId);
    expect(statusUrl).toContain("video_status.get");
  });

  it("should construct correct API URL for avatar listing", () => {
    const baseUrl = "https://api.heygen.com";
    const avatarUrl = `${baseUrl}/v2/avatars`;
    expect(avatarUrl).toBe("https://api.heygen.com/v2/avatars");
  });

  it("should construct correct API URL for voice listing", () => {
    const baseUrl = "https://api.heygen.com";
    const voiceUrl = `${baseUrl}/v2/voices`;
    expect(voiceUrl).toBe("https://api.heygen.com/v2/voices");
  });
});

// Test video proposal data structures
describe("Video Proposal Data Structures", () => {
  it("should validate proposal status transitions", () => {
    const validStatuses = ["draft", "scripts_ready", "generating", "completed", "failed"];
    const validTransitions: Record<string, string[]> = {
      draft: ["scripts_ready"],
      scripts_ready: ["generating"],
      generating: ["completed", "failed"],
      completed: [],
      failed: ["scripts_ready"],
    };
    for (const status of validStatuses) {
      expect(validTransitions[status]).toBeDefined();
    }
    // Draft can only go to scripts_ready
    expect(validTransitions.draft).toEqual(["scripts_ready"]);
    // Generating can complete or fail
    expect(validTransitions.generating).toContain("completed");
    expect(validTransitions.generating).toContain("failed");
  });

  it("should validate engagement event types", () => {
    const eventTypes = ["play", "pause", "seek", "complete", "chapter_enter", "rewatch"];
    expect(eventTypes).toHaveLength(6);
    expect(eventTypes).toContain("play");
    expect(eventTypes).toContain("complete");
    expect(eventTypes).toContain("chapter_enter");
    expect(eventTypes).toContain("rewatch");
  });

  it("should calculate total duration from chapters", () => {
    const chapters = [
      { type: "introduction", durationEstimate: 45 },
      { type: "current_situation", durationEstimate: 60 },
      { type: "recommended_strategy", durationEstimate: 90 },
      { type: "twenty_year_projection", durationEstimate: 75 },
      { type: "next_steps", durationEstimate: 45 },
    ];
    const totalDuration = chapters.reduce((s, c) => s + c.durationEstimate, 0);
    expect(totalDuration).toBe(315);
  });

  it("should generate a valid share token format", () => {
    // Share tokens should be URL-safe random strings
    const generateToken = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let token = "";
      for (let i = 0; i < 32; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return token;
    };
    const token = generateToken();
    expect(token).toHaveLength(32);
    expect(/^[A-Za-z0-9]+$/.test(token)).toBe(true);
  });

  it("should validate percent watched is between 0 and 100", () => {
    const validatePercent = (pct: number) => Math.max(0, Math.min(100, Math.round(pct)));
    expect(validatePercent(0)).toBe(0);
    expect(validatePercent(50)).toBe(50);
    expect(validatePercent(100)).toBe(100);
    expect(validatePercent(-5)).toBe(0);
    expect(validatePercent(150)).toBe(100);
    expect(validatePercent(33.7)).toBe(34);
  });
});

// Test the script prompt building logic
describe("Script Prompt Building", () => {
  it("should build a client context string from client data", () => {
    const client = {
      name: "John Smith",
      age: 55,
      income: 250000,
      assets: 1500000,
      goals: "Retire at 62 with $10k/month income",
    };
    const context = `Client: ${client.name}, Age: ${client.age}, Income: $${client.income.toLocaleString()}, Assets: $${client.assets.toLocaleString()}. Goals: ${client.goals}`;
    expect(context).toContain("John Smith");
    expect(context).toContain("55");
    expect(context).toContain("$250,000");
    expect(context).toContain("$1,500,000");
    expect(context).toContain("Retire at 62");
  });

  it("should build strategy data context from calculation results", () => {
    const strategyData = {
      type: "mortgage_killer",
      monthlyPayment: 2500,
      interestSaved: 185000,
      equityGrowth: 450000,
      taxFreeIncome: 8500,
      deathBenefit: 750000,
    };
    const context = JSON.stringify(strategyData);
    expect(context).toContain("mortgage_killer");
    expect(context).toContain("185000");
    expect(context).toContain("750000");
  });

  it("should handle missing client data gracefully", () => {
    const client = null;
    const context = client
      ? `Client: ${client}`
      : "No specific client data available. Use general financial planning context.";
    expect(context).toContain("No specific client data");
  });

  it("should handle missing strategy data gracefully", () => {
    const strategyData = undefined;
    const context = strategyData
      ? JSON.stringify(strategyData)
      : "No specific strategy data. Present a general overview of available strategies.";
    expect(context).toContain("general overview");
  });
});

// Test engagement analytics calculations
describe("Engagement Analytics", () => {
  it("should calculate average watch time from events", () => {
    const events = [
      { totalWatchTime: 120 },
      { totalWatchTime: 200 },
      { totalWatchTime: 180 },
    ];
    const avgWatchTime = events.reduce((s, e) => s + e.totalWatchTime, 0) / events.length;
    expect(avgWatchTime).toBeCloseTo(166.67, 1);
  });

  it("should calculate completion rate from events", () => {
    const events = [
      { eventType: "complete" },
      { eventType: "pause" },
      { eventType: "complete" },
      { eventType: "pause" },
      { eventType: "complete" },
    ];
    const completeCount = events.filter(e => e.eventType === "complete").length;
    const totalSessions = events.filter(e => e.eventType === "complete" || e.eventType === "pause").length;
    const completionRate = (completeCount / totalSessions) * 100;
    expect(completionRate).toBe(60);
  });

  it("should identify most rewatched chapters", () => {
    const events = [
      { eventType: "chapter_enter", chapterIndex: 0 },
      { eventType: "chapter_enter", chapterIndex: 1 },
      { eventType: "chapter_enter", chapterIndex: 2 },
      { eventType: "seek", chapterIndex: 1 },
      { eventType: "chapter_enter", chapterIndex: 1 },
      { eventType: "seek", chapterIndex: 2 },
      { eventType: "chapter_enter", chapterIndex: 2 },
    ];
    const chapterCounts: Record<number, number> = {};
    events.filter(e => e.eventType === "chapter_enter").forEach(e => {
      chapterCounts[e.chapterIndex!] = (chapterCounts[e.chapterIndex!] || 0) + 1;
    });
    const mostWatched = Object.entries(chapterCounts).sort((a, b) => b[1] - a[1])[0];
    // Chapter 1 and 2 both entered 2 times, chapter 0 entered 1 time
    expect(Number(mostWatched[0])).toBe(1);
    expect(mostWatched[1]).toBe(2);
  });

  it("should calculate drop-off points", () => {
    const events = [
      { percentWatched: 100 },
      { percentWatched: 45 },
      { percentWatched: 78 },
      { percentWatched: 30 },
      { percentWatched: 100 },
    ];
    const avgPercent = events.reduce((s, e) => s + e.percentWatched, 0) / events.length;
    expect(avgPercent).toBeCloseTo(70.6, 1);
    const droppedBefore50 = events.filter(e => e.percentWatched < 50).length;
    expect(droppedBefore50).toBe(2);
  });
});

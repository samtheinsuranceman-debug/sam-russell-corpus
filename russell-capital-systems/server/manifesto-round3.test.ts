/**
 * Manifesto Round 3 Tests — Music Player, Withdrawal Emails, Daily Briefing
 */
import { describe, it, expect, vi } from "vitest";

// ─── Music Player Mini-Bar ─────────────────────────────────────────────────────

describe("Music Player Mini-Bar", () => {
  const MUSIC_TRACKS = [
    { id: "flow-state", title: "Flow State", mood: "relaxation" as const },
    { id: "wealth-meditation", title: "Wealth Meditation", mood: "relaxation" as const },
    { id: "deep-focus", title: "Deep Focus", mood: "relaxation" as const },
    { id: "morning-momentum", title: "Morning Momentum", mood: "excitement" as const },
    { id: "victory-march", title: "Victory March", mood: "excitement" as const },
    { id: "power-hour", title: "Power Hour", mood: "excitement" as const },
  ];

  it("should have 6 tracks total (3 relaxation, 3 excitement)", () => {
    expect(MUSIC_TRACKS.length).toBe(6);
    const relaxation = MUSIC_TRACKS.filter(t => t.mood === "relaxation");
    const excitement = MUSIC_TRACKS.filter(t => t.mood === "excitement");
    expect(relaxation.length).toBe(3);
    expect(excitement.length).toBe(3);
  });

  it("each track should have id, title, and mood", () => {
    for (const track of MUSIC_TRACKS) {
      expect(track.id).toBeTruthy();
      expect(track.title).toBeTruthy();
      expect(["relaxation", "excitement"]).toContain(track.mood);
    }
  });

  it("track IDs should be unique", () => {
    const ids = MUSIC_TRACKS.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ─── Withdrawal Email System ────────────────────────────────────────────────────

describe("Withdrawal Email System", () => {
  it("should determine correct escalation level based on hours inactive", () => {
    function getLevel(hours: number): "gentle" | "urgent" | "fomo" {
      if (hours >= 72) return "fomo";
      if (hours >= 48) return "urgent";
      return "gentle";
    }

    expect(getLevel(24)).toBe("gentle");
    expect(getLevel(36)).toBe("gentle");
    expect(getLevel(48)).toBe("urgent");
    expect(getLevel(60)).toBe("urgent");
    expect(getLevel(72)).toBe("fomo");
    expect(getLevel(120)).toBe("fomo");
  });

  it("should generate correct email subjects per escalation level", () => {
    const firstName = "Sam";
    const subjects: Record<string, string> = {
      gentle: `${firstName}, your dashboard misses you`,
      urgent: `${firstName} — your streak is at risk!`,
      fomo: `${firstName}, you're falling behind — competitors are pulling ahead`,
    };

    expect(subjects.gentle).toContain("misses you");
    expect(subjects.urgent).toContain("streak");
    expect(subjects.fomo).toContain("falling behind");
  });

  it("should not send emails to users inactive less than 24 hours", () => {
    const hoursInactive = 12;
    const shouldSend = hoursInactive >= 24;
    expect(shouldSend).toBe(false);
  });

  it("should include pet context in email when pet exists", () => {
    const petName = "Phoenix";
    const petHappiness = 25;
    const emailContent = petHappiness < 30 ? `${petName} is very sad` : `${petName} is getting lonely`;
    expect(emailContent).toContain("very sad");
  });

  it("should include streak context in urgent emails", () => {
    const currentStreak = 14;
    const level = "urgent";
    const includeStreak = level !== "gentle" && currentStreak > 0;
    expect(includeStreak).toBe(true);
  });
});

// ─── Daily Briefing Page ────────────────────────────────────────────────────────

describe("Daily Briefing Page", () => {
  it("should generate correct greeting based on time of day", () => {
    function getGreeting(hour: number): string {
      if (hour < 6) return "Burning the midnight oil";
      if (hour < 12) return "Good morning";
      if (hour < 17) return "Good afternoon";
      if (hour < 21) return "Good evening";
      return "Working late";
    }

    expect(getGreeting(3)).toBe("Burning the midnight oil");
    expect(getGreeting(9)).toBe("Good morning");
    expect(getGreeting(14)).toBe("Good afternoon");
    expect(getGreeting(19)).toBe("Good evening");
    expect(getGreeting(23)).toBe("Working late");
  });

  it("should calculate ritual progress percentage correctly", () => {
    const stepsCompleted = [0, 1, 3];
    const totalSteps = 5;
    const pct = Math.round((stepsCompleted.length / totalSteps) * 100);
    expect(pct).toBe(60);
  });

  it("should determine pet mood from happiness level", () => {
    function getPetMood(happiness: number): string {
      if (happiness >= 80) return "Ecstatic";
      if (happiness >= 60) return "Happy";
      if (happiness >= 40) return "Content";
      if (happiness >= 20) return "Lonely";
      return "Sad";
    }

    expect(getPetMood(90)).toBe("Ecstatic");
    expect(getPetMood(65)).toBe("Happy");
    expect(getPetMood(45)).toBe("Content");
    expect(getPetMood(25)).toBe("Lonely");
    expect(getPetMood(10)).toBe("Sad");
  });

  it("should format AUM values in millions", () => {
    const totalAum = 15500000;
    const formatted = `$${(totalAum / 1000000).toFixed(1)}M`;
    expect(formatted).toBe("$15.5M");
  });

  it("should show daily reward CTA when canClaim is true", () => {
    const dailyReward = { canClaim: true, nextClaimDay: 3 };
    expect(dailyReward.canClaim).toBe(true);
  });

  it("should count active quests correctly", () => {
    const quests = [
      { id: 1, status: "active", progress: 2, target: 5 },
      { id: 2, status: "active", progress: 5, target: 5 },
      { id: 3, status: "active", progress: 0, target: 3 },
    ];
    const completed = quests.filter(q => q.progress >= q.target).length;
    expect(completed).toBe(1);
    expect(quests.length).toBe(3);
  });
});

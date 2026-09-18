/**
 * Manifesto Round 2 Tests — Sound of Money, Quest Progress, Music Player
 */
import { describe, it, expect } from "vitest";

describe("Sound of Money — Mutation Sound Mapping", () => {
  it("maps deal-related mutations to ka-ching/deal-closed sounds", async () => {
    const { MUTATION_SOUND_MAP } = await import("../client/src/hooks/useSoundOfMoney");
    expect(MUTATION_SOUND_MAP["deals.close"]).toBe("deal-closed");
    expect(MUTATION_SOUND_MAP["pipeline.updateStage"]).toBe("ka-ching");
    expect(MUTATION_SOUND_MAP["billing.createCheckout"]).toBe("ka-ching");
  });

  it("maps XP/quest mutations to correct sounds", async () => {
    const { MUTATION_SOUND_MAP } = await import("../client/src/hooks/useSoundOfMoney");
    expect(MUTATION_SOUND_MAP["experience.earnXp"]).toBe("xp-ping");
    expect(MUTATION_SOUND_MAP["experience.claimQuestReward"]).toBe("quest-complete");
  });

  it("maps client mutations to xp-ping sound", async () => {
    const { MUTATION_SOUND_MAP } = await import("../client/src/hooks/useSoundOfMoney");
    expect(MUTATION_SOUND_MAP["clients.create"]).toBe("xp-ping");
  });

  it("maps loot mutations to loot-reveal sound", async () => {
    const { MUTATION_SOUND_MAP } = await import("../client/src/hooks/useSoundOfMoney");
    expect(MUTATION_SOUND_MAP["experience.purchaseLoot"]).toBe("loot-reveal");
  });

  it("maps AI generation mutations to loot-reveal sound", async () => {
    const { MUTATION_SOUND_MAP } = await import("../client/src/hooks/useSoundOfMoney");
    expect(MUTATION_SOUND_MAP["ai.generate"]).toBe("loot-reveal");
    expect(MUTATION_SOUND_MAP["warStoryAI.generate"]).toBe("loot-reveal");
  });

  it("fallback getSoundForMutationPath handles unknown paths", async () => {
    const { getSoundForMutationPath } = await import("../client/src/hooks/useSoundOfMoney");
    expect(getSoundForMutationPath("something.close")).toBe("deal-closed");
    expect(getSoundForMutationPath("some.checkout")).toBe("ka-ching");
    expect(getSoundForMutationPath("some.generate")).toBe("loot-reveal");
    expect(getSoundForMutationPath("some.calculate")).toBe("xp-ping");
    expect(getSoundForMutationPath("zzz.zzz")).toBeNull();
  });
});

describe("Quest Progress — Category Mapping", () => {
  it("maps client mutations to client_contact category", async () => {
    const { MUTATION_QUEST_MAP } = await import("../client/src/hooks/useSoundOfMoney");
    expect(MUTATION_QUEST_MAP["clients.create"]).toBe("client_contact");
    expect(MUTATION_QUEST_MAP["clients.update"]).toBe("client_contact");
  });

  it("maps deal mutations to deal_movement category", async () => {
    const { MUTATION_QUEST_MAP } = await import("../client/src/hooks/useSoundOfMoney");
    expect(MUTATION_QUEST_MAP["pipeline.updateStage"]).toBe("deal_movement");
    expect(MUTATION_QUEST_MAP["deals.create"]).toBe("deal_movement");
    expect(MUTATION_QUEST_MAP["deals.close"]).toBe("deal_movement");
  });

  it("maps calculation mutations to calculation_run category", async () => {
    const { MUTATION_QUEST_MAP } = await import("../client/src/hooks/useSoundOfMoney");
    expect(MUTATION_QUEST_MAP["strategyLab.calculate"]).toBe("calculation_run");
    expect(MUTATION_QUEST_MAP["rothConversion.calculate"]).toBe("calculation_run");
  });

  it("maps AI mutations to ai_generation category", async () => {
    const { MUTATION_QUEST_MAP } = await import("../client/src/hooks/useSoundOfMoney");
    expect(MUTATION_QUEST_MAP["ai.generate"]).toBe("ai_generation");
    expect(MUTATION_QUEST_MAP["warStoryAI.generate"]).toBe("ai_generation");
  });

  it("fallback getQuestCategoryForPath handles unknown paths", async () => {
    const { getQuestCategoryForPath } = await import("../client/src/hooks/useSoundOfMoney");
    expect(getQuestCategoryForPath("clients.create")).toBe("client_contact");
    expect(getQuestCategoryForPath("deals.updateStage")).toBe("deal_movement");
    expect(getQuestCategoryForPath("some.calculate")).toBe("calculation_run");
    expect(getQuestCategoryForPath("ai.generateSomething")).toBe("ai_generation");
    expect(getQuestCategoryForPath("unknown.action")).toBe("tool_usage");
  });
});

describe("Ambient Music — Track Configuration", () => {
  it("has 6 tracks with valid CDN URLs", async () => {
    const { MUSIC_TRACKS } = await import("../client/src/contexts/EntrainmentEngine");
    const tracks = Object.entries(MUSIC_TRACKS);
    expect(tracks.length).toBe(6);
    for (const [, info] of tracks) {
      expect(info.url).toMatch(/^https:\/\/.*\.mp3$/);
      expect(info.mood).toMatch(/^(relaxation|excitement)$/);
      expect(info.title).toBeTruthy();
    }
  });

  it("has 3 relaxation and 3 excitement tracks", async () => {
    const { MUSIC_TRACKS } = await import("../client/src/contexts/EntrainmentEngine");
    const relaxation = Object.values(MUSIC_TRACKS).filter(t => t.mood === "relaxation");
    const excitement = Object.values(MUSIC_TRACKS).filter(t => t.mood === "excitement");
    expect(relaxation.length).toBe(3);
    expect(excitement.length).toBe(3);
  });

  it("track keys match expected names", async () => {
    const { MUSIC_TRACKS } = await import("../client/src/contexts/EntrainmentEngine");
    const keys = Object.keys(MUSIC_TRACKS);
    expect(keys).toContain("flow-state");
    expect(keys).toContain("wealth-meditation");
    expect(keys).toContain("morning-momentum");
    expect(keys).toContain("victory-march");
    expect(keys).toContain("deep-focus");
    expect(keys).toContain("power-hour");
  });
});

describe("Quest Progress — DB Helpers exist", () => {
  it("incrementQuestByCategory function exists", async () => {
    const mod = await import("./experienceDb");
    expect(typeof mod.incrementQuestByCategory).toBe("function");
  });

  it("getQuestProgressStats function exists", async () => {
    const mod = await import("./experienceDb");
    expect(typeof mod.getQuestProgressStats).toBe("function");
  });

  it("spawnWeeklyQuests function exists", async () => {
    const mod = await import("./experienceDb");
    expect(typeof mod.spawnWeeklyQuests).toBe("function");
  });
});

describe("Pet System — DB Helpers exist", () => {
  it("getUserPet function exists", async () => {
    const mod = await import("./experienceDb");
    expect(typeof mod.getUserPet).toBe("function");
  });

  it("adoptPet function exists", async () => {
    const mod = await import("./experienceDb");
    expect(typeof mod.adoptPet).toBe("function");
  });

  it("feedPet function exists", async () => {
    const mod = await import("./experienceDb");
    expect(typeof mod.feedPet).toBe("function");
  });
});

describe("Morning Ritual — DB Helpers exist", () => {
  it("getTodayRitual function exists", async () => {
    const mod = await import("./experienceDb");
    expect(typeof mod.getTodayRitual).toBe("function");
  });

  it("startMorningRitual function exists", async () => {
    const mod = await import("./experienceDb");
    expect(typeof mod.startMorningRitual).toBe("function");
  });

  it("completeRitualStep function exists", async () => {
    const mod = await import("./experienceDb");
    expect(typeof mod.completeRitualStep).toBe("function");
  });
});

describe("Revenue Guarantee — DB Helpers exist", () => {
  it("calculateRevenueGuarantee function exists", async () => {
    const mod = await import("./experienceDb");
    expect(typeof mod.calculateRevenueGuarantee).toBe("function");
  });

  it("getRevenueGuaranteeHistory function exists", async () => {
    const mod = await import("./experienceDb");
    expect(typeof mod.getRevenueGuaranteeHistory).toBe("function");
  });
});

describe("Withdrawal Triggers — DB Helpers exist", () => {
  it("createWithdrawalTrigger function exists", async () => {
    const mod = await import("./experienceDb");
    expect(typeof mod.createWithdrawalTrigger).toBe("function");
  });

  it("getUnreadTriggers function exists", async () => {
    const mod = await import("./experienceDb");
    expect(typeof mod.getUnreadTriggers).toBe("function");
  });

  it("generateWithdrawalTriggers function exists", async () => {
    const mod = await import("./experienceDb");
    expect(typeof mod.generateWithdrawalTriggers).toBe("function");
  });
});

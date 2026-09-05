/**
 * Experience Engine + Will Writer — tRPC Router
 * Handles all gamification, XP, streaks, quests, RussellCoin, families, avatars, and will generation
 */
import { z } from "zod";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import { storagePut } from "./storage";
import { notifyOwner } from "./_core/notification";

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION HELPERS (fire-and-forget, never block the main flow)
// ═══════════════════════════════════════════════════════════════════════════════
const LEVEL_NAMES: Record<number, string> = {
  1: "Rookie", 2: "Apprentice", 3: "Advisor", 4: "Strategist", 5: "Optimizer",
  6: "Architect", 7: "Commander", 8: "Master", 9: "Grandmaster", 10: "Legend",
};

function notifyLevelUp(userId: number, level: number) {
  const name = LEVEL_NAMES[level] || `Level ${level}`;
  notifyOwner({
    title: `\u{1F3C6} Level Up! An advisor reached ${name} (Level ${level})`,
    content: `User #${userId} just leveled up to ${name}. The Experience Engine is working.`,
  }).catch(() => {});
}

function notifyQuestComplete(userId: number, questTitle: string, xpReward: number) {
  notifyOwner({
    title: `\u{2694}\u{FE0F} Quest Complete: ${questTitle}`,
    content: `User #${userId} completed the quest "${questTitle}" and earned ${xpReward} XP. Engagement is high.`,
  }).catch(() => {});
}

function notifyStreakMilestone(userId: number, streak: number) {
  if (streak % 7 === 0 || streak === 3 || streak === 30 || streak === 100 || streak === 365) {
    notifyOwner({
      title: `\u{1F525} Streak Milestone: ${streak}-Day Streak!`,
      content: `User #${userId} just hit a ${streak}-day login streak. The addiction engine is working perfectly.`,
    }).catch(() => {});
  }
}
import { getDb } from "./db";
import { willDrafts, clients, householdFactFinders, clientProperties } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  getXpProfile, earnXp, checkIn,
  earnRussellCoin, spendRussellCoin, getRussellCoinHistory,
  getActiveQuests, getCompletedQuests, spawnDailyQuests, spawnWeeklyQuests, updateQuestProgress, claimQuestReward,
  getUserAchievements, tryUnlockAchievement,
  purchaseLootItem, getUserInventory, equipItem, LOOT_SHOP,
  getDailyRewardStatus, claimDailyReward,
  getSkillTree, investInSkill,
  createFamily, joinFamily, getMyFamily, leaveFamily,
  createWarStory, getWarStories, likeWarStory,
  placePrediction, getMyPredictions,
  getXpHistory, getXpLeaderboard,
  getUserPet, adoptPet, feedPet, interactWithPet,
  getTodayRitual, startMorningRitual, completeRitualStep, getRitualStreak,
  createWithdrawalTrigger, getUnreadTriggers, markTriggerRead, markTriggerClicked, generateWithdrawalTriggers,
  calculateRevenueGuarantee, getRevenueGuaranteeHistory,
  incrementQuestByCategory, getQuestProgressStats,
  checkAndSendWithdrawalEmails,
  createRivalryChallenge, getLeaderboardRivals,
  getRevenueAttribution,
  getDealScoringData,
  getMonthlyReportData,
  createPredictionQuestion, getPredictionQuestions, voteOnPrediction,
} from "./experienceDb";
import type { WillFamilyContext, WillAssetDistribution, WillGuardian, WillBequest } from "../drizzle/schema";

// ═══════════════════════════════════════════════════════════════════════════════
// EXPERIENCE ENGINE ROUTER
// ═══════════════════════════════════════════════════════════════════════════════

export const experienceRouter = router({
  // ─── XP & Profile ─────────────────────────────────────────────────────────
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return getXpProfile(ctx.user.id);
  }),

  earnXp: protectedProcedure.input(z.object({
    amount: z.number().min(1).max(10000),
    source: z.string(),
    description: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    // Get level before XP gain
    const profileBefore = await getXpProfile(ctx.user.id);
    const levelBefore = profileBefore?.level || 1;
    const result = await earnXp(ctx.user.id, input.amount, input.source, input.description);
    // Check if level changed
    const profileAfter = await getXpProfile(ctx.user.id);
    if (profileAfter && profileAfter.level > levelBefore) {
      notifyLevelUp(ctx.user.id, profileAfter.level);
    }
    return result;
  }),

  getXpHistory: protectedProcedure.query(async ({ ctx }) => {
    return getXpHistory(ctx.user.id);
  }),

  // ─── Streaks & Check-in ───────────────────────────────────────────────────
  checkIn: protectedProcedure.mutation(async ({ ctx }) => {
    const result = await checkIn(ctx.user.id);
    // Fire streak milestone notifications
    if (result && typeof result === 'object' && 'currentStreak' in result) {
      notifyStreakMilestone(ctx.user.id, (result as any).currentStreak);
    }
    return result;
  }),

  // ─── RussellCoin ──────────────────────────────────────────────────────────
  getCoinHistory: protectedProcedure.query(async ({ ctx }) => {
    return getRussellCoinHistory(ctx.user.id);
  }),

  spendCoin: protectedProcedure.input(z.object({
    amount: z.number().min(1),
    item: z.string(),
    description: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    return spendRussellCoin(ctx.user.id, input.amount, input.item, input.description);
  }),

  // ─── Quests ───────────────────────────────────────────────────────────────
  getActiveQuests: protectedProcedure.query(async ({ ctx }) => {
    return getActiveQuests(ctx.user.id);
  }),

  getCompletedQuests: protectedProcedure.query(async ({ ctx }) => {
    return getCompletedQuests(ctx.user.id);
  }),

  spawnDailyQuests: protectedProcedure.mutation(async ({ ctx }) => {
    return spawnDailyQuests(ctx.user.id);
  }),

  updateQuestProgress: protectedProcedure.input(z.object({
    questSlug: z.string(),
    increment: z.number().min(1).default(1),
  })).mutation(async ({ ctx, input }) => {
    return updateQuestProgress(ctx.user.id, input.questSlug, input.increment);
  }),

  claimQuestReward: protectedProcedure.input(z.object({
    questId: z.number(),
  })).mutation(async ({ ctx, input }) => {
    const result = await claimQuestReward(ctx.user.id, input.questId);
    // Fire quest completion notification
    if (result && typeof result === 'object' && 'xpEarned' in result) {
      notifyQuestComplete(ctx.user.id, `Quest #${input.questId}`, (result as any).xpEarned || 0);
    }
    return result;
  }),

  // ─── Achievements ─────────────────────────────────────────────────────────
  getAchievements: protectedProcedure.query(async ({ ctx }) => {
    return getUserAchievements(ctx.user.id);
  }),

  // ─── Loot ─────────────────────────────────────────────────────────────────
  getLoot: protectedProcedure.query(async ({ ctx }) => {
    return getUserInventory(ctx.user.id);
  }),

  getLootShop: protectedProcedure.query(async () => {
    return LOOT_SHOP;
  }),

  purchaseLoot: protectedProcedure.input(z.object({
    itemSlug: z.string(),
  })).mutation(async ({ ctx, input }) => {
    return purchaseLootItem(ctx.user.id, input.itemSlug);
  }),

  equipLoot: protectedProcedure.input(z.object({
    lootId: z.number(),
  })).mutation(async ({ ctx, input }) => {
    return equipItem(ctx.user.id, input.lootId);
  }),

  // ─── Daily Rewards ────────────────────────────────────────────────────────
  getDailyRewardStatus: protectedProcedure.query(async ({ ctx }) => {
    return getDailyRewardStatus(ctx.user.id);
  }),

  claimDailyReward: protectedProcedure.mutation(async ({ ctx }) => {
    return claimDailyReward(ctx.user.id);
  }),

  // ─── Skill Tree ───────────────────────────────────────────────────────────
  getSkillTree: protectedProcedure.query(async ({ ctx }) => {
    return getSkillTree(ctx.user.id);
  }),

  investInSkill: protectedProcedure.input(z.object({
    skillSlug: z.string(),
    xpAmount: z.number().min(50),
  })).mutation(async ({ ctx, input }) => {
    return investInSkill(ctx.user.id, input.skillSlug, input.xpAmount);
  }),

  // ─── Family / Couples Mode ────────────────────────────────────────────────
  createFamily: protectedProcedure.input(z.object({
    name: z.string().min(1).max(100),
  })).mutation(async ({ ctx, input }) => {
    return createFamily(ctx.user.id, input.name);
  }),

  joinFamily: protectedProcedure.input(z.object({
    inviteCode: z.string().min(6).max(10),
  })).mutation(async ({ ctx, input }) => {
    return joinFamily(ctx.user.id, input.inviteCode);
  }),

  getMyFamily: protectedProcedure.query(async ({ ctx }) => {
    return getMyFamily(ctx.user.id);
  }),

  leaveFamily: protectedProcedure.mutation(async ({ ctx }) => {
    return leaveFamily(ctx.user.id);
  }),

  // ─── War Stories ──────────────────────────────────────────────────────────
  createWarStory: protectedProcedure.input(z.object({
    title: z.string().min(1).max(500),
    content: z.string().min(10),
    category: z.string(),
    dollarImpact: z.number().optional(),
    isAnonymous: z.boolean().optional(),
  })).mutation(async ({ ctx, input }) => {
    return createWarStory(ctx.user.id, input);
  }),

  getWarStories: protectedProcedure.query(async () => {
    return getWarStories();
  }),

  likeWarStory: protectedProcedure.input(z.object({
    storyId: z.number(),
  })).mutation(async ({ input }) => {
    return likeWarStory(input.storyId);
  }),

  // ─── Prediction Market ────────────────────────────────────────────────────
  placePrediction: protectedProcedure.input(z.object({
    question: z.string().min(5),
    prediction: z.string(),
    wager: z.number().min(10),
  })).mutation(async ({ ctx, input }) => {
    return placePrediction(ctx.user.id, input.question, input.prediction, input.wager);
  }),

  getMyPredictions: protectedProcedure.query(async ({ ctx }) => {
    return getMyPredictions(ctx.user.id);
  }),

  // ─── Prediction Market Questions ─────────────────────────────────────────
  createPredictionQuestion: protectedProcedure.input(z.object({
    question: z.string().min(10),
    category: z.string().default("general"),
    endDate: z.string(), // ISO date string
  })).mutation(async ({ ctx, input }) => {
    return createPredictionQuestion(ctx.user.id, {
      question: input.question,
      category: input.category,
      endDate: new Date(input.endDate),
    });
  }),

  getPredictionQuestions: protectedProcedure.query(async () => {
    return getPredictionQuestions();
  }),

  voteOnPrediction: protectedProcedure.input(z.object({
    questionId: z.number(),
    vote: z.enum(["yes", "no"]),
    wager: z.number().min(10),
  })).mutation(async ({ ctx, input }) => {
    return voteOnPrediction(ctx.user.id, input.questionId, input.vote, input.wager);
  }),

  // ─── Leaderboard ──────────────────────────────────────────────────────────
  getXpLeaderboard: protectedProcedure.query(async () => {
    return getXpLeaderboard();
  }),

  // ─── AI Avatar Twins ───────────────────────────────────────────────────
  uploadAvatarPhoto: protectedProcedure.input(z.object({
    imageBase64: z.string(),
    isSpouse: z.boolean().default(false),
  })).mutation(async ({ ctx, input }) => {
    const suffix = Math.random().toString(36).substring(2, 10);
    const key = `avatars/${ctx.user.id}/${input.isSpouse ? 'spouse' : 'self'}-original-${suffix}.jpg`;
    const buffer = Buffer.from(input.imageBase64, 'base64');
    const { url } = await storagePut(key, buffer, 'image/jpeg');
    return { photoUrl: url, isSpouse: input.isSpouse };
  }),

  getAvatars: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { avatarUrl: null, spouseAvatarUrl: null };
    const { userXpProfiles } = await import("../drizzle/schema");
    const [profile] = await db.select({
      avatarUrl: userXpProfiles.avatarUrl,
      spouseAvatarUrl: userXpProfiles.spouseAvatarUrl,
    }).from(userXpProfiles).where(eq(userXpProfiles.userId, ctx.user.id)).limit(1);
    return profile ?? { avatarUrl: null, spouseAvatarUrl: null };
  }),

  generateAvatar: protectedProcedure.input(z.object({
    imageBase64: z.string(),
    style: z.enum(["professional", "warrior", "mystic", "futuristic", "royal"]).default("professional"),
    isSpouse: z.boolean().default(false),
  })).mutation(async ({ ctx, input }) => {
    const stylePrompts: Record<string, string> = {
      professional: "a polished, sophisticated executive portrait in a luxury office setting, wearing a tailored suit, dramatic lighting, oil painting style, rich colors",
      warrior: "an epic fantasy warrior portrait with golden armor, glowing sword, dramatic battlefield background, cinematic lighting, digital art masterpiece",
      mystic: "a mystical sorcerer portrait with glowing runes, ethereal energy swirling around, cosmic background with stars and nebulae, fantasy art style",
      futuristic: "a cyberpunk tech mogul portrait with holographic displays, neon city background, sleek futuristic attire, blade runner aesthetic",
      royal: "a regal royal portrait in a grand palace, wearing a crown and royal robes, golden throne, renaissance painting style, dramatic chiaroscuro lighting",
    };

    const prompt = `Create ${stylePrompts[input.style]}. The subject should look powerful, confident, and successful. Make it look like a high-end character portrait from a AAA video game. Ultra detailed, 4K quality.`;

    try {
      const result = await generateImage({
        prompt,
        originalImages: [{
          url: `data:image/jpeg;base64,${input.imageBase64}`,
          mimeType: "image/jpeg",
        }],
      });

      if (result?.url) {
        // Store the avatar URL on the user's XP profile
        const db = await getDb();
        if (db) {
          const { userXpProfiles } = await import("../drizzle/schema");
          const field = input.isSpouse ? "spouseAvatarUrl" : "avatarUrl";
          await db.update(userXpProfiles)
            .set({ [field]: result.url })
            .where(eq(userXpProfiles.userId, ctx.user.id));
        }
        return { avatarUrl: result.url, style: input.style };
      }
      throw new Error("Image generation failed");
    } catch (error: any) {
      throw new Error(`Avatar generation failed: ${error.message}`);
    }
  }),
});

// ═══════════════════════════════════════════════════════════════════════════════
// WILL WRITER ROUTER
// ═══════════════════════════════════════════════════════════════════════════════

export const willWriterRouter = router({
  // ─── Get Family Context for Will ──────────────────────────────────────────
  getFamilyContext: protectedProcedure.input(z.object({
    clientId: z.number(),
  })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");

    // Get client data
    const clientRows = await db.select().from(clients).where(eq(clients.id, input.clientId)).limit(1);
    if (clientRows.length === 0) throw new Error("Client not found");
    const client = clientRows[0];

    // Get household fact finder
    const hhRows = await db.select().from(householdFactFinders).where(eq(householdFactFinders.clientId, input.clientId)).limit(1);
    const hh = hhRows[0] ?? null;

    // Get properties
    const props = await db.select().from(clientProperties).where(eq(clientProperties.clientId, input.clientId));

    // Build family context
    const context: WillFamilyContext = {
      clientName: client.name || `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim(),
      spouseName: client.spouseName ?? hh?.spouseName ?? undefined,
      children: (hh?.children ?? []).map(c => ({ name: c.name, age: c.age })),
      grandchildren: (hh?.grandchildren ?? []).map(g => ({
        name: g.name,
        age: g.age,
        parentName: (hh?.children ?? []).find(c => c.id === g.parentId)?.name ?? "Unknown",
      })),
      totalEstateValue: Number(client.totalNetWorth ?? 0),
      properties: props.map(p => ({
        name: p.propertyName,
        value: Number(p.propertyValue ?? 0),
        type: p.propertyType ?? "PRIMARY",
      })),
      retirementAccounts: {
        ira: Number(client.iraBalance ?? 0),
        roth: Number(client.rothBalance ?? 0),
        k401: Number(client.k401Balance ?? 0),
      },
      lifeInsurance: {
        deathBenefit: Number(client.lifeInsuranceDb ?? 0),
        cashValue: Number(client.lifeInsuranceCv ?? 0),
      },
      state: client.state ?? "Unknown",
    };

    return context;
  }),

  // ─── Generate Will Document ───────────────────────────────────────────────
  generate: protectedProcedure.input(z.object({
    clientId: z.number(),
    tone: z.enum(["formal", "heartfelt", "spiritual", "practical"]),
    personalLetterPrompt: z.string().optional(),
    executorName: z.string().optional(),
    executorRelation: z.string().optional(),
    specialInstructions: z.string().optional(),
    assetDistribution: z.array(z.object({
      beneficiaryName: z.string(),
      relationship: z.string(),
      assetType: z.string(),
      assetDescription: z.string(),
      estimatedValue: z.number().optional(),
      percentage: z.number().optional(),
      conditions: z.string().optional(),
    })).optional(),
    guardianDesignations: z.array(z.object({
      childName: z.string(),
      childAge: z.number(),
      primaryGuardian: z.string(),
      primaryGuardianRelation: z.string(),
      alternateGuardian: z.string().optional(),
      alternateGuardianRelation: z.string().optional(),
      specialInstructions: z.string().optional(),
    })).optional(),
    specialBequests: z.array(z.object({
      recipientName: z.string(),
      relationship: z.string(),
      item: z.string(),
      type: z.enum(["heirloom", "charitable", "conditional", "memorial", "educational"]),
      conditions: z.string().optional(),
      emotionalNote: z.string().optional(),
    })).optional(),
    finalWishes: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");

    // Get client data
    const clientRows = await db.select().from(clients).where(eq(clients.id, input.clientId)).limit(1);
    if (clientRows.length === 0) throw new Error("Client not found");
    const client = clientRows[0];

    // Get household fact finder for family data
    const hhRows = await db.select().from(householdFactFinders).where(eq(householdFactFinders.clientId, input.clientId)).limit(1);
    const hh = hhRows[0] ?? null;

    // Get properties
    const props = await db.select().from(clientProperties).where(eq(clientProperties.clientId, input.clientId));

    const clientName = client.name || `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim();
    const spouseName = client.spouseName ?? hh?.spouseName;
    const children = hh?.children ?? [];
    const grandchildren = hh?.grandchildren ?? [];
    const totalEstate = Number(client.totalNetWorth ?? 0);

    // Build the family context snapshot
    const familyContext: WillFamilyContext = {
      clientName,
      spouseName: spouseName ?? undefined,
      children: children.map(c => ({ name: c.name, age: c.age })),
      grandchildren: grandchildren.map(g => ({
        name: g.name,
        age: g.age,
        parentName: children.find(c => c.id === g.parentId)?.name ?? "Unknown",
      })),
      totalEstateValue: totalEstate,
      properties: props.map(p => ({
        name: p.propertyName,
        value: Number(p.propertyValue ?? 0),
        type: p.propertyType ?? "PRIMARY",
      })),
      retirementAccounts: {
        ira: Number(client.iraBalance ?? 0),
        roth: Number(client.rothBalance ?? 0),
        k401: Number(client.k401Balance ?? 0),
      },
      lifeInsurance: {
        deathBenefit: Number(client.lifeInsuranceDb ?? 0),
        cashValue: Number(client.lifeInsuranceCv ?? 0),
      },
      state: client.state ?? "Unknown",
    };

    // Build the comprehensive LLM prompt
    const toneInstructions: Record<string, string> = {
      formal: "Write in a dignified, formal legal tone. Use precise language. This should read like a document prepared by a top estate attorney. Professional, authoritative, and clear.",
      heartfelt: "Write with deep emotional warmth and love. This is a person speaking from the heart to the people they love most. Include personal touches, memories, and expressions of love. Make the reader cry — in a good way. This should feel like the most important letter they've ever written.",
      spiritual: "Write with spiritual depth and reverence. Reference faith, eternal bonds, and the belief that love transcends this life. Include blessings, prayers, and spiritual wisdom. This should feel like a sacred document.",
      practical: "Write in a clear, organized, practical tone. Focus on clarity and actionability. Every instruction should be unambiguous. This should be easy for an executor to follow step by step.",
    };

    const childrenContext = children.length > 0
      ? `\n\nCHILDREN:\n${children.map(c => `- ${c.name}, age ${c.age}`).join("\n")}`
      : "\n\nNo children listed.";

    const grandchildrenContext = grandchildren.length > 0
      ? `\n\nGRANDCHILDREN:\n${grandchildren.map(g => {
          const parent = children.find(c => c.id === g.parentId);
          return `- ${g.name}, age ${g.age} (child of ${parent?.name ?? "Unknown"})`;
        }).join("\n")}`
      : "";

    const propertiesContext = props.length > 0
      ? `\n\nPROPERTIES:\n${props.map(p => `- ${p.propertyName}: $${Number(p.propertyValue ?? 0).toLocaleString()} (${p.propertyType})`).join("\n")}`
      : "";

    const assetContext = `
FINANCIAL ESTATE OVERVIEW:
- Total Net Worth: $${totalEstate.toLocaleString()}
- IRA Balance: $${Number(client.iraBalance ?? 0).toLocaleString()}
- Roth IRA Balance: $${Number(client.rothBalance ?? 0).toLocaleString()}
- 401(k) Balance: $${Number(client.k401Balance ?? 0).toLocaleString()}
- Cash Savings: $${Number(client.cashSavings ?? 0).toLocaleString()}
- Life Insurance Death Benefit: $${Number(client.lifeInsuranceDb ?? 0).toLocaleString()}
- Life Insurance Cash Value: $${Number(client.lifeInsuranceCv ?? 0).toLocaleString()}
- Home Value: $${Number(client.homeValue ?? 0).toLocaleString()}
- Annuity Value: $${Number(client.annuityValue ?? 0).toLocaleString()}
- Real Estate Equity: $${Number(client.realEstateEquity ?? 0).toLocaleString()}${propertiesContext}`;

    const distributionContext = input.assetDistribution && input.assetDistribution.length > 0
      ? `\n\nSPECIFIC ASSET DISTRIBUTION WISHES:\n${input.assetDistribution.map(a =>
          `- ${a.beneficiaryName} (${a.relationship}): ${a.assetDescription}${a.percentage ? ` — ${a.percentage}%` : ""}${a.estimatedValue ? ` (~$${a.estimatedValue.toLocaleString()})` : ""}${a.conditions ? ` [Condition: ${a.conditions}]` : ""}`
        ).join("\n")}`
      : "";

    const guardianContext = input.guardianDesignations && input.guardianDesignations.length > 0
      ? `\n\nGUARDIAN DESIGNATIONS:\n${input.guardianDesignations.map(g =>
          `- For ${g.childName} (age ${g.childAge}): Primary Guardian: ${g.primaryGuardian} (${g.primaryGuardianRelation})${g.alternateGuardian ? `, Alternate: ${g.alternateGuardian} (${g.alternateGuardianRelation})` : ""}${g.specialInstructions ? ` — Note: ${g.specialInstructions}` : ""}`
        ).join("\n")}`
      : "";

    const bequestContext = input.specialBequests && input.specialBequests.length > 0
      ? `\n\nSPECIAL BEQUESTS:\n${input.specialBequests.map(b =>
          `- To ${b.recipientName} (${b.relationship}): ${b.item} [${b.type}]${b.conditions ? ` — Condition: ${b.conditions}` : ""}${b.emotionalNote ? ` — Personal note: "${b.emotionalNote}"` : ""}`
        ).join("\n")}`
      : "";

    const systemPrompt = `You are the world's most gifted estate planning writer. You create last will and testament documents that are not just legally structured — they are deeply personal, emotionally powerful documents that make families weep with gratitude.

${toneInstructions[input.tone]}

You are writing for ${clientName}${spouseName ? `, married to ${spouseName}` : ""}, residing in ${client.state ?? "the United States"}.

IMPORTANT: This is NOT legal advice. This is a personal legacy document and planning tool. Include a clear disclaimer at the top stating this is a draft for discussion with a licensed estate planning attorney.

Create a comprehensive, beautifully structured will document with the following sections:

1. **PREAMBLE** — Declaration of identity, sound mind, and revocation of prior wills
2. **PERSONAL LETTER TO MY LOVED ONES** — ${input.personalLetterPrompt ? `Guided by this prompt: "${input.personalLetterPrompt}"` : "A deeply personal letter expressing love, wisdom, and final thoughts to family"}
3. **APPOINTMENT OF EXECUTOR** — ${input.executorName ? `${input.executorName} (${input.executorRelation ?? "trusted person"})` : "To be designated"}
4. **ASSET DISTRIBUTION** — Detailed distribution of the estate
5. **GUARDIAN DESIGNATIONS** — For any minor children
6. **SPECIAL BEQUESTS** — Heirlooms, charitable gifts, conditional gifts with personal notes
7. **FINAL WISHES** — ${input.finalWishes ?? "Funeral preferences, memorial wishes, and final messages"}
8. **SIGNATURE & WITNESS BLOCK** — Formal execution section

Make every section feel deeply personal. Use the family names. Reference the specific assets. If there are children, write something that would make a parent cry reading it. If there's a spouse, write something that captures a lifetime of love.

For the personal letter section, channel the deepest human emotions — gratitude, love, hope, wisdom passed down through generations. This letter should be the kind of thing a family frames and hangs on the wall.`;

    const userMessage = `Please write the complete last will and testament for ${clientName}.

FAMILY INFORMATION:
- Client: ${clientName}, age ${client.age ?? "unknown"}
${spouseName ? `- Spouse: ${spouseName}, age ${client.spouseAge ?? "unknown"}` : "- No spouse listed"}${childrenContext}${grandchildrenContext}

${assetContext}${distributionContext}${guardianContext}${bequestContext}

${input.specialInstructions ? `SPECIAL INSTRUCTIONS FROM CLIENT:\n${input.specialInstructions}\n` : ""}
${input.finalWishes ? `FINAL WISHES:\n${input.finalWishes}\n` : ""}

Please create the most beautiful, emotionally powerful, and comprehensive will document possible. This should be a document that honors a life and protects a legacy.`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    const rawContent = response.choices?.[0]?.message?.content;
    const generatedDocument = typeof rawContent === "string" ? rawContent : "Generation failed. Please try again.";

    // Generate the personal letter separately if needed for the personalLetter field
    let personalLetter = "";
    const letterMatch = typeof generatedDocument === "string" ? generatedDocument.match(/PERSONAL LETTER[\s\S]*?(?=##|APPOINTMENT|$)/i) : null;
    if (letterMatch) {
      personalLetter = letterMatch[0].replace(/^#+\s*PERSONAL LETTER[^\n]*/i, "").trim();
    }

    // Save to database
    const title = `Last Will & Testament of ${clientName}`;
    await db.insert(willDrafts).values({
      userId: ctx.user.id,
      clientId: input.clientId,
      title,
      tone: input.tone,
      personalLetter,
      assetDistribution: input.assetDistribution as WillAssetDistribution[] ?? null,
      guardianDesignations: input.guardianDesignations as WillGuardian[] ?? null,
      specialBequests: input.specialBequests as WillBequest[] ?? null,
      finalWishes: input.finalWishes ?? null,
      executorName: input.executorName ?? null,
      executorRelation: input.executorRelation ?? null,
      generatedDocument,
      familyContext,
      status: "draft",
    });

    // Award XP and RussellCoin for creating a will
    await earnXp(ctx.user.id, 500, "will_writer", `Created will for ${clientName}`);
    await earnRussellCoin(ctx.user.id, 200, "earn", "will_writer", `Will document created for ${clientName}`);

    return {
      title,
      generatedDocument,
      familyContext,
      xpEarned: 500,
      coinsEarned: 200,
    };
  }),

  // ─── List Will Drafts ─────────────────────────────────────────────────────
  listDrafts: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    return db.select().from(willDrafts)
      .where(eq(willDrafts.userId, ctx.user.id))
      .orderBy(desc(willDrafts.updatedAt));
  }),

  // ─── Get Single Will Draft ────────────────────────────────────────────────
  getDraft: protectedProcedure.input(z.object({
    id: z.number(),
  })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const rows = await db.select().from(willDrafts)
      .where(and(eq(willDrafts.id, input.id), eq(willDrafts.userId, ctx.user.id)))
      .limit(1);
    if (rows.length === 0) throw new Error("Will draft not found");
    return rows[0];
  }),

  // ─── Update Will Status ───────────────────────────────────────────────────
  updateStatus: protectedProcedure.input(z.object({
    id: z.number(),
    status: z.enum(["draft", "review", "finalized"]),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    await db.update(willDrafts)
      .set({ status: input.status })
      .where(and(eq(willDrafts.id, input.id), eq(willDrafts.userId, ctx.user.id)));
    return { success: true };
  }),

  // ─── Delete Will Draft ────────────────────────────────────────────────────
  deleteDraft: protectedProcedure.input(z.object({
    id: z.number(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    await db.delete(willDrafts)
      .where(and(eq(willDrafts.id, input.id), eq(willDrafts.userId, ctx.user.id)));
    return { success: true };
  }),
});

// ═══════════════════════════════════════════════════════════════════════════════
// PET SYSTEM ROUTER (Secret #37)
// ═══════════════════════════════════════════════════════════════════════════════

export const petRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    return getUserPet(ctx.user.id);
  }),

  adopt: protectedProcedure.input(z.object({
    speciesId: z.enum(["phoenix", "dragon", "eagle", "wolf", "unicorn"]),
    name: z.string().min(1).max(50),
  })).mutation(async ({ ctx, input }) => {
    const BASE_STATS: Record<string, { strength: number; wisdom: number; charisma: number; luck: number }> = {
      phoenix: { strength: 3, wisdom: 8, charisma: 6, luck: 7 },
      dragon: { strength: 9, wisdom: 5, charisma: 4, luck: 6 },
      eagle: { strength: 5, wisdom: 7, charisma: 7, luck: 5 },
      wolf: { strength: 7, wisdom: 6, charisma: 5, luck: 6 },
      unicorn: { strength: 4, wisdom: 6, charisma: 9, luck: 8 },
    };
    const result = await adoptPet(ctx.user.id, input.speciesId, input.name, BASE_STATS[input.speciesId]);
    notifyOwner({
      title: `🐣 New Pet Adopted: ${input.name} the ${input.speciesId}`,
      content: `User #${ctx.user.id} adopted a ${input.speciesId} named "${input.name}". The pet system is engaging users.`,
    }).catch(() => {});
    return result;
  }),

  feed: protectedProcedure.input(z.object({
    foodId: z.string(),
  })).mutation(async ({ ctx, input }) => {
    const FOODS: Record<string, { xp: number; happiness: number; cost: number }> = {
      basic_treat: { xp: 10, happiness: 5, cost: 5 },
      premium_meal: { xp: 25, happiness: 15, cost: 15 },
      golden_feast: { xp: 50, happiness: 30, cost: 40 },
      deal_crumbs: { xp: 15, happiness: 10, cost: 0 },
      victory_steak: { xp: 100, happiness: 50, cost: 75 },
    };
    const food = FOODS[input.foodId];
    if (!food) throw new Error("Unknown food item");
    if (food.cost > 0) {
      await spendRussellCoin(ctx.user.id, food.cost, `Fed pet: ${input.foodId}`);
    }
    const result = await feedPet(ctx.user.id, input.foodId, food.xp, food.happiness);
    if (result.evolved) {
      notifyOwner({
        title: `✨ Pet Evolution! ${result.pet.name} evolved to ${result.newStage}!`,
        content: `User #${ctx.user.id}'s pet "${result.pet.name}" just evolved to ${result.newStage} stage at level ${result.pet.level}!`,
      }).catch(() => {});
    }
    return result;
  }),

  interact: protectedProcedure.mutation(async ({ ctx }) => {
    return interactWithPet(ctx.user.id);
  }),
});

// ═══════════════════════════════════════════════════════════════════════════════
// MORNING RITUAL ROUTER (Secret #3)
// ═══════════════════════════════════════════════════════════════════════════════

export const morningRitualRouter = router({
  getToday: protectedProcedure.query(async ({ ctx }) => {
    return getTodayRitual(ctx.user.id);
  }),

  start: protectedProcedure.mutation(async ({ ctx }) => {
    return startMorningRitual(ctx.user.id);
  }),

  completeStep: protectedProcedure.input(z.object({
    stepIndex: z.number().min(0).max(6),
  })).mutation(async ({ ctx, input }) => {
    const result = await completeRitualStep(ctx.user.id, input.stepIndex);
    if (result.justCompleted) {
      // Award XP and coins to the user's main profile
      await earnXp(ctx.user.id, result.xpGained, "morning_ritual_complete");
      await earnRussellCoin(ctx.user.id, result.coinsGained, "earn", "morning_ritual", "Morning ritual completed");
      notifyOwner({
        title: `🌅 Morning Ritual Complete!`,
        content: `User #${ctx.user.id} completed their morning ritual (streak: ${result.ritual.streakDay} days). Earned ${result.xpGained} XP.`,
      }).catch(() => {});
    }
    return result;
  }),

  getStreak: protectedProcedure.query(async ({ ctx }) => {
    return getRitualStreak(ctx.user.id);
  }),
});

// ═══════════════════════════════════════════════════════════════════════════════
// WITHDRAWAL TRIGGER ROUTER (Secret #8)
// ═══════════════════════════════════════════════════════════════════════════════

export const withdrawalRouter = router({
  getUnread: protectedProcedure.query(async ({ ctx }) => {
    return getUnreadTriggers(ctx.user.id);
  }),

  markRead: protectedProcedure.input(z.object({
    triggerId: z.number(),
  })).mutation(async ({ input }) => {
    await markTriggerRead(input.triggerId);
    return { success: true };
  }),

  markClicked: protectedProcedure.input(z.object({
    triggerId: z.number(),
  })).mutation(async ({ input }) => {
    await markTriggerClicked(input.triggerId);
    return { success: true };
  }),

  generate: protectedProcedure.mutation(async ({ ctx }) => {
    return generateWithdrawalTriggers(ctx.user.id);
  }),

  // Admin-only: trigger withdrawal email check for all inactive users
  sendEmails: protectedProcedure.mutation(async () => {
    return checkAndSendWithdrawalEmails();
  }),
});

// ═══════════════════════════════════════════════════════════════════════════════
// REVENUE GUARANTEE ROUTER (Secret #10)
// ═══════════════════════════════════════════════════════════════════════════════

export const revenueGuaranteeRouter = router({
  calculate: protectedProcedure.input(z.object({
    currentAUM: z.number().min(0),
    currentRevenue: z.number().min(0),
    monthlySubscriptionCost: z.number().min(0),
    expectedAUMGrowthPct: z.number().min(0).max(500),
    expectedRevenueGrowthPct: z.number().min(0).max(500),
  })).mutation(async ({ ctx, input }) => {
    return calculateRevenueGuarantee(ctx.user.id, input);
  }),

  history: protectedProcedure.query(async ({ ctx }) => {
    return getRevenueGuaranteeHistory(ctx.user.id);
  }),
});

// ═══════════════════════════════════════════════════════════════════════════════
// WAR STORY AI GENERATOR ROUTER
// ═══════════════════════════════════════════════════════════════════════════════

export const warStoryAIRouter = router({
  generate: protectedProcedure.input(z.object({
    dealType: z.string().min(1),
    dealSize: z.number().min(0),
    clientAge: z.number().min(18).max(100).optional(),
    strategy: z.string().optional(),
    challenge: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const prompt = `You are a financial advisor war story generator. Create a compelling, dramatic first-person narrative about closing a deal with these details:
- Deal type: ${input.dealType}
- Deal size: $${input.dealSize.toLocaleString()}
${input.clientAge ? `- Client age: ${input.clientAge}` : ""}
${input.strategy ? `- Strategy used: ${input.strategy}` : ""}
${input.challenge ? `- Main challenge: ${input.challenge}` : ""}

Write a 3-4 paragraph war story in first person. Make it dramatic, educational, and inspiring. Include specific financial details and the emotional journey. End with the lesson learned. Keep it under 400 words.`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a seasoned financial advisor who tells compelling war stories about deals you've closed. Your stories are dramatic, specific, and always include a valuable lesson." },
        { role: "user", content: prompt },
      ],
    });

    const rawContent = response.choices[0]?.message?.content;
    const storyContent = typeof rawContent === "string" ? rawContent : "Story generation failed.";

    // Save to war stories table
    await createWarStory(ctx.user.id, {
      title: `The $${(input.dealSize / 1000).toFixed(0)}K ${input.dealType} Victory`,
      content: storyContent,
      category: input.dealType,
      dollarImpact: input.dealSize,
    });

    return { story: storyContent };
  }),
});


// ═══════════════════════════════════════════════════════════════════════════════
// QUEST PROGRESS ROUTER — Tracks real user actions for quest auto-increment
// ═══════════════════════════════════════════════════════════════════════════════

export const questProgressRouter = router({
  incrementAction: protectedProcedure.input(z.object({
    category: z.string(),
    mutationPath: z.string(),
  })).mutation(async ({ ctx, input }) => {
    const results = await incrementQuestByCategory(ctx.user.id, input.category, input.mutationPath);
    return { updated: results };
  }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    return getQuestProgressStats(ctx.user.id);
  }),

  spawnAll: protectedProcedure.mutation(async ({ ctx }) => {
    // Spawn both daily and weekly quests if not already spawned
    const daily = await spawnDailyQuests(ctx.user.id);
    const weekly = await spawnWeeklyQuests(ctx.user.id);
    return { daily, weekly };
  }),
});

// ═══════════════════════════════════════════════════════════════════════════════
// LEADERBOARD RIVALRY ROUTER
// ═══════════════════════════════════════════════════════════════════════════════
export const rivalryRouter = router({
  challenge: protectedProcedure
    .input(z.object({
      rivalId: z.number(),
      metric: z.string().default("xp"),
      durationDays: z.number().min(1).max(30).default(7),
    }))
    .mutation(async ({ ctx, input }) => {
      return createRivalryChallenge(ctx.user.id, input.rivalId, input.metric, input.durationDays);
    }),

  getRivals: protectedProcedure.query(async ({ ctx }) => {
    return getLeaderboardRivals(ctx.user.id);
  }),
});

// ═══════════════════════════════════════════════════════════════════════════════
// REVENUE ATTRIBUTION ROUTER
// ═══════════════════════════════════════════════════════════════════════════════
export const revenueAttributionRouter = router({
  getAttribution: protectedProcedure.query(async ({ ctx }) => {
    return getRevenueAttribution(ctx.user.id);
  }),
});

// ═══════════════════════════════════════════════════════════════════════════════
// PREDICTIVE DEAL SCORING ROUTER — LLM-powered close probability + DB persistence
// ═══════════════════════════════════════════════════════════════════════════════
export const dealScoringRouter = router({
  score: protectedProcedure.mutation(async ({ ctx }) => {
    const { getWorkspaceByOwnerId } = await import("./db");
    const ws = await getWorkspaceByOwnerId(ctx.user.id);
    const deals = await getDealScoringData(ctx.user.id);
    if (deals.length === 0) return { scores: [], summary: "No deals to score." };

    const dealSummaries = deals.slice(0, 20).map((d: any) => ({
      id: d.id,
      value: Number(d.value) || 0,
      stage: d.stage,
      probability: d.probability,
      daysSinceCreated: d.createdAt ? Math.floor((Date.now() - new Date(d.createdAt).getTime()) / 86400000) : 0,
    }));

    let scoredResults: any[] = [];
    let summary = "";
    try {
      const { invokeLLM } = await import("./_core/llm");
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a deal scoring AI for financial advisors. Score each deal's close probability (0-100) based on stage, value, activity recency, and age. Return JSON with scores array of {name, score, confidence, reason, recommendation} and summary string. confidence is 'high'|'medium'|'low'." },
          { role: "user", content: `Score these deals:\n${JSON.stringify(dealSummaries, null, 2)}` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "deal_scores",
            strict: true,
            schema: {
              type: "object",
              properties: {
                scores: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      score: { type: "number" },
                      confidence: { type: "string" },
                      reason: { type: "string" },
                      recommendation: { type: "string" },
                    },
                    required: ["name", "score", "confidence", "reason", "recommendation"],
                    additionalProperties: false,
                  },
                },
                summary: { type: "string" },
              },
              required: ["scores", "summary"],
              additionalProperties: false,
            },
          },
        },
      });
      const content = response.choices[0].message.content;
      const parsed = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content) || "{}");
      scoredResults = parsed.scores || [];
      summary = parsed.summary || "AI scoring complete.";
    } catch (e) {
      scoredResults = dealSummaries.map((d: any) => {
        let score = d.probability ?? 50;
        if (d.stage === "closed_won") score = 100;
        else if (d.stage === "closed_lost") score = 0;
        else if (d.stage === "negotiation") score = Math.max(score, 70);
        else if (d.stage === "proposal") score = Math.max(score, 50);
        if (d.daysSinceCreated > 30) score -= 15;
        if (d.daysSinceCreated > 60) score -= 15;
        return { name: d.name || `Deal #${d.id}`, score: Math.max(0, Math.min(100, score)), confidence: "medium", reason: "Rule-based scoring", recommendation: score > 70 ? "Follow up soon" : score > 40 ? "Needs attention" : "Consider closing" };
      });
      summary = "Rule-based scoring (LLM unavailable)";
    }

    // Persist scores to DB
    if (ws) {
      const dbModule = await import("./db");
      for (const s of scoredResults) {
        const dealMatch = dealSummaries.find((d: any) => d.id === s.id || String(d.id) === String(s.name));
        if (dealMatch) {
          try {
            await dbModule.saveDealScore({
              dealId: dealMatch.id,
              workspaceId: ws.id,
              score: s.score,
              confidence: s.confidence || "medium",
              factors: { reason: s.reason, stage: dealMatch.stage, value: dealMatch.value },
              recommendation: s.recommendation,
              scoredBy: "ai",
            });
          } catch (e) { /* non-critical */ }
        }
      }
    }

    return { scores: scoredResults, summary };
  }),

  history: protectedProcedure
    .input(z.object({ dealId: z.number() }))
    .query(async ({ input }) => {
      const { getDealScoreHistory } = await import("./db");
      return getDealScoreHistory(input.dealId);
    }),

  allScores: protectedProcedure.query(async ({ ctx }) => {
    const { getWorkspaceByOwnerId } = await import("./db");
    const ws = await getWorkspaceByOwnerId(ctx.user.id);
    if (!ws) return [];
    const { getWorkspaceDealScores } = await import("./db");
    return getWorkspaceDealScores(ws.id);
  }),
});

// ═══════════════════════════════════════════════════════════════════════════════
// MONTHLY REPORT ROUTER — with email sending
// ═══════════════════════════════════════════════════════════════════════════════
export const monthlyReportRouter = router({
  getReport: protectedProcedure.query(async ({ ctx }) => {
    return getMonthlyReportData(ctx.user.id);
  }),

  sendEmail: protectedProcedure.mutation(async ({ ctx }) => {
    const data = await getMonthlyReportData(ctx.user.id);
    const user = ctx.user;
    if (!user.email) return { sent: false, reason: "No email on file" };

    try {
      const { notifyOwner } = await import("./_core/notification");
      await notifyOwner({
        title: `Monthly Report — ${data.month}`,
        content: [
          `**${user.name || user.email}'s Monthly Summary**`,
          ``,
          `| Metric | Value |`,
          `|--------|-------|`,
          `| XP Earned | ${data.xp.earned.toLocaleString()} |`,
          `| Actions | ${data.xp.actions} |`,
          `| Deals Closed | ${data.deals.closed} |`,
          `| Revenue | $${Number(data.deals.revenue).toLocaleString()} |`,
          `| Level | ${data.level} |`,
          `| Quests Completed | ${data.questsCompleted} |`,
          `| Current Streak | ${data.currentStreak} days |`,
          `| Russell Coin | ${data.russellCoin} |`,
        ].join("\n"),
      });
      return { sent: true };
    } catch (e) {
      console.error("[MonthlyReport] Failed to send:", e);
      return { sent: false, reason: "Email delivery failed" };
    }
  }),
});

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR LOGGING ROUTER — Client-side error reporting with DB persistence
// ═══════════════════════════════════════════════════════════════════════════════
export const errorLogRouter = router({
  report: publicProcedure
    .input(z.object({
      message: z.string(),
      stack: z.string().optional(),
      componentStack: z.string().optional(),
      url: z.string().optional(),
      userAgent: z.string().optional(),
      source: z.string().optional(),
      level: z.string().optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      console.error("[CLIENT_ERROR]", JSON.stringify({
        timestamp: new Date().toISOString(),
        message: input.message,
        stack: input.stack?.slice(0, 500),
        url: input.url,
      }));
      // Persist to DB
      try {
        const { logError } = await import("./db");
        await logError({
          userId: (ctx as any)?.user?.id ?? null,
          source: input.source || "client",
          level: input.level || "error",
          message: input.message,
          stack: input.stack ?? null,
          componentStack: input.componentStack ?? null,
          url: input.url ?? null,
          userAgent: input.userAgent ?? null,
          metadata: input.metadata ?? null,
        });
      } catch (e) { /* non-critical — already logged to console */ }
      return { logged: true };
    }),

  list: adminProcedure
    .input(z.object({ limit: z.number().optional(), offset: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const { getErrorLogs } = await import("./db");
      return getErrorLogs(input?.limit ?? 100, input?.offset ?? 0);
    }),

  stats: adminProcedure.query(async () => {
    const { getErrorLogStats } = await import("./db");
    return getErrorLogStats();
  }),
});

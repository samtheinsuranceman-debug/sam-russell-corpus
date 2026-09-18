/**
 * Experience Engine — Database helpers for gamification, XP, streaks, quests, RussellCoin, families
 */
import { eq, and, desc, sql, gte, asc, lt, isNotNull } from "drizzle-orm";
import {
  userXpProfiles, xpTransactions, russellCoinTransactions,
  userQuests, userAchievements, userLoot, dailyRewardClaims,
  skillTreeProgress, familyGroups, familyMembers,
  predictionBets, warStories, predictionQuestions,
} from "../drizzle/schema";
import { userPets, morningRituals, withdrawalTriggers, revenueGuaranteeCalcs, users, deals, inAppNotifications } from "../drizzle/schema";
import { getDb } from "./db";
import { sendWithdrawalEmail } from "./email";

// ═══════════════════════════════════════════════════════════════════════════════
// LEVEL SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

const LEVELS = [
  { level: 1,  name: "Rookie",           xpRequired: 0 },
  { level: 2,  name: "Apprentice",       xpRequired: 500 },
  { level: 3,  name: "Practitioner",     xpRequired: 1500 },
  { level: 4,  name: "Specialist",       xpRequired: 3500 },
  { level: 5,  name: "Optimizer",        xpRequired: 6000 },
  { level: 6,  name: "Strategist",       xpRequired: 10000 },
  { level: 7,  name: "Expert",           xpRequired: 16000 },
  { level: 8,  name: "Master",           xpRequired: 25000 },
  { level: 9,  name: "Grand Master",     xpRequired: 40000 },
  { level: 10, name: "Legend",           xpRequired: 60000 },
  { level: 11, name: "Mythic",          xpRequired: 85000 },
  { level: 12, name: "Transcendent",    xpRequired: 120000 },
];

function getLevelForXp(totalXp: number) {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (totalXp >= lvl.xpRequired) current = lvl;
    else break;
  }
  const nextLevel = LEVELS.find(l => l.level === current.level + 1);
  return {
    level: current.level,
    levelName: current.name,
    xpForCurrentLevel: current.xpRequired,
    xpForNextLevel: nextLevel?.xpRequired ?? current.xpRequired,
    nextLevelName: nextLevel?.name ?? "MAX",
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// XP PROFILE
// ═══════════════════════════════════════════════════════════════════════════════

export async function getOrCreateXpProfile(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await db.select().from(userXpProfiles).where(eq(userXpProfiles.userId, userId)).limit(1);
  if (existing.length > 0) return existing[0];
  await db.insert(userXpProfiles).values({ userId });
  const created = await db.select().from(userXpProfiles).where(eq(userXpProfiles.userId, userId)).limit(1);
  return created[0];
}

export async function getXpProfile(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const profile = await getOrCreateXpProfile(userId);
  const levelInfo = getLevelForXp(profile.totalXp);
  return { ...profile, ...levelInfo };
}

export async function earnXp(userId: number, amount: number, source: string, description?: string, sourceId?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const profile = await getOrCreateXpProfile(userId);
  const newTotal = profile.totalXp + amount;
  const levelInfo = getLevelForXp(newTotal);
  const leveledUp = levelInfo.level > profile.level;

  await db.update(userXpProfiles)
    .set({ totalXp: newTotal, level: levelInfo.level, levelName: levelInfo.levelName })
    .where(eq(userXpProfiles.userId, userId));

  await db.insert(xpTransactions).values({
    userId, amount, source, sourceId: sourceId ?? null, description: description ?? `Earned ${amount} XP from ${source}`,
  });

  return { newTotal, level: levelInfo.level, levelName: levelInfo.levelName, leveledUp, xpEarned: amount };
}

// ═══════════════════════════════════════════════════════════════════════════════
// STREAKS
// ═══════════════════════════════════════════════════════════════════════════════

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}
function getYesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export async function checkIn(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const profile = await getOrCreateXpProfile(userId);
  const today = getTodayStr();

  if (profile.lastCheckInDate === today) {
    return { alreadyCheckedIn: true, streak: profile.currentStreak, totalCheckIns: profile.totalCheckIns };
  }

  const yesterday = getYesterdayStr();
  let newStreak = 1;
  let streakFrozen = false;
  if (profile.lastCheckInDate === yesterday) {
    newStreak = profile.currentStreak + 1;
  } else if (profile.currentStreak > 0) {
    // Missed a day — check for streak shield in inventory
    const shield = await db.select().from(userLoot)
      .where(and(eq(userLoot.userId, userId), eq(userLoot.itemSlug, "streak_shield")))
      .limit(1);
    if (shield.length > 0 && shield[0].quantity > 0) {
      // Consume the streak shield (reduce quantity or delete)
      if (shield[0].quantity > 1) {
        await db.update(userLoot).set({ quantity: shield[0].quantity - 1 }).where(eq(userLoot.id, shield[0].id));
      } else {
        await db.delete(userLoot).where(eq(userLoot.id, shield[0].id));
      }
      newStreak = profile.currentStreak + 1;
      streakFrozen = true;
    }
  }
  const newLongest = Math.max(newStreak, profile.longestStreak);

  await db.update(userXpProfiles).set({
    currentStreak: newStreak,
    longestStreak: newLongest,
    lastCheckInDate: today,
    totalCheckIns: profile.totalCheckIns + 1,
  }).where(eq(userXpProfiles.userId, userId));

  // Streak XP bonus: base 25 + 5 per streak day (capped at 200)
  const streakBonus = Math.min(25 + (newStreak * 5), 200);
  await earnXp(userId, streakBonus, "daily_checkin", `Day ${newStreak} streak check-in`);

  // Streak RussellCoin: 10 base + 2 per streak day
  const coinBonus = 10 + (newStreak * 2);
  await earnRussellCoin(userId, coinBonus, "earn", "daily_checkin", `Day ${newStreak} streak bonus`);

  return { alreadyCheckedIn: false, streak: newStreak, longestStreak: newLongest, totalCheckIns: profile.totalCheckIns + 1, xpEarned: streakBonus, coinsEarned: coinBonus, streakFrozen };
}

// ═══════════════════════════════════════════════════════════════════════════════
// RUSSELLCOIN
// ═══════════════════════════════════════════════════════════════════════════════

export async function earnRussellCoin(userId: number, amount: number, txType: "earn" | "bonus" | "refund", source: string, description?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const profile = await getOrCreateXpProfile(userId);
  const newBalance = profile.russellCoin + amount;

  await db.update(userXpProfiles).set({
    russellCoin: newBalance,
    lifetimeRussellCoin: profile.lifetimeRussellCoin + amount,
  }).where(eq(userXpProfiles.userId, userId));

  await db.insert(russellCoinTransactions).values({
    userId, amount, balance: newBalance, txType, source, description: description ?? `Earned ${amount} RC`,
  });

  return { newBalance, earned: amount };
}

export async function spendRussellCoin(userId: number, amount: number, source: string, description?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const profile = await getOrCreateXpProfile(userId);
  if (profile.russellCoin < amount) throw new Error("Insufficient RussellCoin balance");
  const newBalance = profile.russellCoin - amount;

  await db.update(userXpProfiles).set({ russellCoin: newBalance }).where(eq(userXpProfiles.userId, userId));

  await db.insert(russellCoinTransactions).values({
    userId, amount: -amount, balance: newBalance, txType: "spend", source, description: description ?? `Spent ${amount} RC`,
  });

  return { newBalance, spent: amount };
}

export async function getRussellCoinHistory(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.select().from(russellCoinTransactions)
    .where(eq(russellCoinTransactions.userId, userId))
    .orderBy(desc(russellCoinTransactions.createdAt))
    .limit(limit);
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUESTS
// ═══════════════════════════════════════════════════════════════════════════════

const QUEST_TEMPLATES = {
  daily: [
    { slug: "morning_warrior", title: "Morning Warrior", description: "Log in before 9 AM", xp: 50, coin: 15, target: 1 },
    { slug: "calculator_sprint", title: "Calculator Sprint", description: "Run 3 different calculators", xp: 75, coin: 20, target: 3 },
    { slug: "client_whisperer", title: "Client Whisperer", description: "View 5 client profiles", xp: 60, coin: 15, target: 5 },
    { slug: "note_taker", title: "Note Taker", description: "Add a client note", xp: 40, coin: 10, target: 1 },
    { slug: "number_cruncher", title: "Number Cruncher", description: "Save a scenario snapshot", xp: 65, coin: 20, target: 1 },
  ],
  weekly: [
    { slug: "deal_closer", title: "The Closer", description: "Close a deal this week", xp: 200, coin: 75, target: 1 },
    { slug: "knowledge_seeker", title: "Knowledge Seeker", description: "Visit 10 different calculator pages", xp: 150, coin: 50, target: 10 },
    { slug: "streak_keeper", title: "Streak Keeper", description: "Maintain a 7-day login streak", xp: 250, coin: 100, target: 7 },
    { slug: "social_butterfly", title: "Social Butterfly", description: "Share a war story", xp: 175, coin: 60, target: 1 },
  ],
  epic: [
    { slug: "million_dollar_quest", title: "Million Dollar Quest", description: "Discover $1M+ in client wealth", xp: 1000, coin: 500, target: 1 },
    { slug: "master_advisor", title: "Master Advisor", description: "Reach Level 8", xp: 750, coin: 300, target: 1 },
    { slug: "completionist", title: "Completionist", description: "Complete 50 daily quests", xp: 800, coin: 400, target: 50 },
  ],
  legendary: [
    { slug: "legendary_advisor", title: "Legendary Advisor", description: "Reach Level 10 and master 5 skill trees", xp: 5000, coin: 2000, target: 1 },
  ],
};

export async function getActiveQuests(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.select().from(userQuests)
    .where(and(eq(userQuests.userId, userId), eq(userQuests.status, "active")))
    .orderBy(asc(userQuests.questType));
}

export async function getCompletedQuests(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.select().from(userQuests)
    .where(and(eq(userQuests.userId, userId), eq(userQuests.status, "claimed")))
    .orderBy(desc(userQuests.claimedAt))
    .limit(50);
}

export async function spawnDailyQuests(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  // Check if user already has active daily quests for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const existing = await db.select().from(userQuests)
    .where(and(
      eq(userQuests.userId, userId),
      eq(userQuests.questType, "daily"),
      eq(userQuests.status, "active"),
      gte(userQuests.createdAt, today),
    ));
  if (existing.length > 0) return existing;

  // Expire old daily quests
  await db.update(userQuests).set({ status: "expired" })
    .where(and(eq(userQuests.userId, userId), eq(userQuests.questType, "daily"), eq(userQuests.status, "active")));

  // Pick 3 random daily quests
  const shuffled = [...QUEST_TEMPLATES.daily].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, 3);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  for (const q of picked) {
    await db.insert(userQuests).values({
      userId, questSlug: q.slug, questType: "daily", title: q.title,
      description: q.description, xpReward: q.xp, coinReward: q.coin,
      target: q.target, progress: 0, expiresAt: tomorrow,
    });
  }

  return db.select().from(userQuests)
    .where(and(eq(userQuests.userId, userId), eq(userQuests.questType, "daily"), eq(userQuests.status, "active")));
}

export async function spawnWeeklyQuests(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  // Check if user already has active weekly quests this week
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const existing = await db.select().from(userQuests)
    .where(and(
      eq(userQuests.userId, userId),
      eq(userQuests.questType, "weekly"),
      eq(userQuests.status, "active"),
      gte(userQuests.createdAt, weekStart),
    ));
  if (existing.length > 0) return existing;

  // Expire old weekly quests
  await db.update(userQuests).set({ status: "expired" })
    .where(and(eq(userQuests.userId, userId), eq(userQuests.questType, "weekly"), eq(userQuests.status, "active")));

  const nextWeek = new Date(weekStart);
  nextWeek.setDate(nextWeek.getDate() + 7);

  for (const q of QUEST_TEMPLATES.weekly) {
    await db.insert(userQuests).values({
      userId, questSlug: q.slug, questType: "weekly", title: q.title,
      description: q.description, xpReward: q.xp, coinReward: q.coin,
      target: q.target, progress: 0, expiresAt: nextWeek,
    });
  }

  return db.select().from(userQuests)
    .where(and(eq(userQuests.userId, userId), eq(userQuests.questType, "weekly"), eq(userQuests.status, "active")));
}

export async function updateQuestProgress(userId: number, questSlug: string, increment = 1) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const quest = await db.select().from(userQuests)
    .where(and(eq(userQuests.userId, userId), eq(userQuests.questSlug, questSlug), eq(userQuests.status, "active")))
    .limit(1);
  if (quest.length === 0) return null;

  const q = quest[0];
  const newProgress = Math.min(q.progress + increment, q.target);
  const completed = newProgress >= q.target;

  await db.update(userQuests).set({
    progress: newProgress,
    status: completed ? "completed" : "active",
    completedAt: completed ? new Date() : undefined,
  }).where(eq(userQuests.id, q.id));

  return { questId: q.id, slug: q.questSlug, progress: newProgress, target: q.target, completed };
}

export async function claimQuestReward(userId: number, questId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const quest = await db.select().from(userQuests)
    .where(and(eq(userQuests.id, questId), eq(userQuests.userId, userId), eq(userQuests.status, "completed")))
    .limit(1);
  if (quest.length === 0) throw new Error("Quest not found or not completed");

  const q = quest[0];
  await db.update(userQuests).set({ status: "claimed", claimedAt: new Date() }).where(eq(userQuests.id, q.id));

  const xpResult = await earnXp(userId, q.xpReward, "quest_complete", `Completed quest: ${q.title}`, String(q.id));
  const coinResult = await earnRussellCoin(userId, q.coinReward, "earn", "quest_complete", `Quest reward: ${q.title}`);

  return { xpEarned: q.xpReward, coinsEarned: q.coinReward, newTotal: xpResult.newTotal, level: xpResult.level, levelName: xpResult.levelName, leveledUp: xpResult.leveledUp, coinBalance: coinResult.newBalance };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACHIEVEMENTS
// ═══════════════════════════════════════════════════════════════════════════════

const ACHIEVEMENT_DEFS = [
  { slug: "first_login", title: "First Steps", description: "Log in for the first time", emoji: "👣", rarity: "common" as const, xp: 50, coin: 25 },
  { slug: "streak_7", title: "Week Warrior", description: "Maintain a 7-day streak", emoji: "🔥", rarity: "common" as const, xp: 100, coin: 50 },
  { slug: "streak_30", title: "Monthly Machine", description: "Maintain a 30-day streak", emoji: "⚡", rarity: "rare" as const, xp: 500, coin: 200 },
  { slug: "streak_100", title: "Century Club", description: "Maintain a 100-day streak", emoji: "💎", rarity: "epic" as const, xp: 2000, coin: 1000 },
  { slug: "level_5", title: "Rising Star", description: "Reach Level 5", emoji: "⭐", rarity: "common" as const, xp: 200, coin: 100 },
  { slug: "level_10", title: "Legend Status", description: "Reach Level 10", emoji: "👑", rarity: "legendary" as const, xp: 5000, coin: 2500 },
  { slug: "first_quest", title: "Quest Accepted", description: "Complete your first quest", emoji: "⚔️", rarity: "common" as const, xp: 75, coin: 30 },
  { slug: "quests_10", title: "Quest Hunter", description: "Complete 10 quests", emoji: "🏹", rarity: "rare" as const, xp: 300, coin: 150 },
  { slug: "quests_50", title: "Quest Master", description: "Complete 50 quests", emoji: "🗡️", rarity: "epic" as const, xp: 1500, coin: 750 },
  { slug: "first_war_story", title: "Storyteller", description: "Share your first war story", emoji: "📖", rarity: "common" as const, xp: 100, coin: 50 },
  { slug: "russellcoin_1000", title: "Coin Collector", description: "Earn 1,000 RussellCoin", emoji: "🪙", rarity: "common" as const, xp: 150, coin: 0 },
  { slug: "russellcoin_10000", title: "Coin Mogul", description: "Earn 10,000 RussellCoin", emoji: "💰", rarity: "rare" as const, xp: 500, coin: 0 },
  { slug: "skill_mastered", title: "Skill Master", description: "Master a skill tree branch", emoji: "🧠", rarity: "rare" as const, xp: 400, coin: 200 },
  { slug: "all_skills_mastered", title: "Omniscient", description: "Master all skill tree branches", emoji: "🌟", rarity: "legendary" as const, xp: 10000, coin: 5000 },
  { slug: "family_creator", title: "Family Founder", description: "Create a family group", emoji: "👨‍👩‍👧‍👦", rarity: "common" as const, xp: 100, coin: 50 },
  { slug: "prediction_winner", title: "Oracle", description: "Win 5 prediction bets", emoji: "🔮", rarity: "rare" as const, xp: 300, coin: 150 },
];

export async function getUserAchievements(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const unlocked = await db.select().from(userAchievements)
    .where(eq(userAchievements.userId, userId))
    .orderBy(desc(userAchievements.unlockedAt));
  return {
    unlocked,
    all: ACHIEVEMENT_DEFS.map(def => ({
      ...def,
      isUnlocked: unlocked.some(u => u.achievementSlug === def.slug),
      unlockedAt: unlocked.find(u => u.achievementSlug === def.slug)?.unlockedAt,
    })),
  };
}

export async function tryUnlockAchievement(userId: number, slug: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const def = ACHIEVEMENT_DEFS.find(a => a.slug === slug);
  if (!def) return null;

  // Check if already unlocked
  const existing = await db.select().from(userAchievements)
    .where(and(eq(userAchievements.userId, userId), eq(userAchievements.achievementSlug, slug)))
    .limit(1);
  if (existing.length > 0) return null;

  await db.insert(userAchievements).values({
    userId, achievementSlug: slug, title: def.title, description: def.description,
    emoji: def.emoji, rarity: def.rarity, xpReward: def.xp, coinReward: def.coin,
  });

  if (def.xp > 0) await earnXp(userId, def.xp, "achievement", `Achievement unlocked: ${def.title}`);
  if (def.coin > 0) await earnRussellCoin(userId, def.coin, "bonus", "achievement", `Achievement: ${def.title}`);

  return { slug, title: def.title, emoji: def.emoji, rarity: def.rarity, xpReward: def.xp, coinReward: def.coin };
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOOT & SHOP
// ═══════════════════════════════════════════════════════════════════════════════

export const LOOT_SHOP = [
  { slug: "xp_booster_2x", name: "2x XP Booster (1hr)", type: "booster" as const, rarity: "common" as const, price: 200, description: "Double XP for 1 hour" },
  { slug: "custom_title_color", name: "Custom Title Color", type: "cosmetic" as const, rarity: "rare" as const, price: 500, description: "Change your title color" },
  { slug: "profile_border_gold", name: "Gold Profile Border", type: "cosmetic" as const, rarity: "rare" as const, price: 750, description: "Gold border around your avatar" },
  { slug: "diamond_badge", name: "Diamond Badge", type: "cosmetic" as const, rarity: "epic" as const, price: 1500, description: "Exclusive diamond badge on your profile" },
  { slug: "strategy_template_pack", name: "Strategy Template Pack", type: "booster" as const, rarity: "rare" as const, price: 1000, description: "5 premium strategy templates" },
  { slug: "mystery_loot_box", name: "Mystery Loot Box", type: "cosmetic" as const, rarity: "epic" as const, price: 800, description: "Random rare or epic item" },
  { slug: "golden_eagle_pet", name: "Golden Eagle Pet", type: "pet" as const, rarity: "legendary" as const, price: 5000, description: "Legendary golden eagle companion" },
  { slug: "galaxy_theme", name: "Galaxy Theme", type: "theme" as const, rarity: "epic" as const, price: 2000, description: "Cosmic galaxy dashboard theme" },
  { slug: "cash_register_sound", name: "Cash Register Sounds", type: "sound" as const, rarity: "common" as const, price: 300, description: "Ka-ching sound effects on wins" },
  { slug: "streak_shield", name: "Streak Shield", type: "shield" as const, rarity: "rare" as const, price: 1200, description: "Protect your streak for 1 missed day" },
  { slug: "name_glow", name: "Name Glow Effect", type: "cosmetic" as const, rarity: "epic" as const, price: 1800, description: "Glowing name on leaderboards" },
  { slug: "platinum_crown", name: "Platinum Crown", type: "title" as const, rarity: "legendary" as const, price: 10000, description: "The ultimate status symbol" },
];

export async function purchaseLootItem(userId: number, itemSlug: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const item = LOOT_SHOP.find(i => i.slug === itemSlug);
  if (!item) throw new Error("Item not found");

  const profile = await getOrCreateXpProfile(userId);
  if (profile.russellCoin < item.price) throw new Error("Insufficient RussellCoin");

  await spendRussellCoin(userId, item.price, "loot_purchase", `Purchased: ${item.name}`);

  await db.insert(userLoot).values({
    userId, itemSlug: item.slug, itemName: item.name, itemType: item.type,
    rarity: item.rarity, acquiredVia: "purchase",
  });

  return { item: item.name, spent: item.price };
}

export async function getUserInventory(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.select().from(userLoot)
    .where(eq(userLoot.userId, userId))
    .orderBy(desc(userLoot.createdAt));
}

export async function equipItem(userId: number, lootId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const item = await db.select().from(userLoot)
    .where(and(eq(userLoot.id, lootId), eq(userLoot.userId, userId))).limit(1);
  if (item.length === 0) throw new Error("Item not found");

  // Unequip all items of same type
  await db.update(userLoot).set({ equipped: false })
    .where(and(eq(userLoot.userId, userId), eq(userLoot.itemType, item[0].itemType)));

  // Equip this one
  await db.update(userLoot).set({ equipped: true }).where(eq(userLoot.id, lootId));
  return { equipped: item[0].itemName };
}

// ═══════════════════════════════════════════════════════════════════════════════
// DAILY REWARDS
// ═══════════════════════════════════════════════════════════════════════════════

const DAILY_REWARDS = [
  { day: 1, type: "xp" as const, amount: 50, label: "50 XP" },
  { day: 2, type: "coin" as const, amount: 25, label: "25 RC" },
  { day: 3, type: "xp" as const, amount: 100, label: "100 XP" },
  { day: 4, type: "coin" as const, amount: 50, label: "50 RC" },
  { day: 5, type: "xp" as const, amount: 150, label: "150 XP" },
  { day: 6, type: "coin" as const, amount: 100, label: "100 RC" },
  { day: 7, type: "coin" as const, amount: 250, label: "250 RC JACKPOT" },
];

function getWeekStartStr() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + 1); // Monday
  return d.toISOString().slice(0, 10);
}

export async function getDailyRewardStatus(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const weekStart = getWeekStartStr();
  const claims = await db.select().from(dailyRewardClaims)
    .where(and(eq(dailyRewardClaims.userId, userId), eq(dailyRewardClaims.weekStart, weekStart)));

  const claimedDays = claims.map(c => c.dayNumber);
  const nextDay = claimedDays.length > 0 ? Math.max(...claimedDays) + 1 : 1;

  return {
    weekStart,
    rewards: DAILY_REWARDS.map(r => ({ ...r, claimed: claimedDays.includes(r.day) })),
    nextClaimDay: nextDay > 7 ? null : nextDay,
    canClaim: nextDay <= 7 && !claimedDays.includes(nextDay),
  };
}

export async function claimDailyReward(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const status = await getDailyRewardStatus(userId);
  if (!status.canClaim || !status.nextClaimDay) throw new Error("No reward available to claim");

  const reward = DAILY_REWARDS[status.nextClaimDay - 1];

  await db.insert(dailyRewardClaims).values({
    userId, dayNumber: status.nextClaimDay, weekStart: status.weekStart,
    rewardType: reward.type, rewardAmount: reward.amount,
  });

  if (reward.type === "xp") {
    await earnXp(userId, reward.amount, "daily_reward", `Day ${status.nextClaimDay} daily reward`);
  } else {
    await earnRussellCoin(userId, reward.amount, "earn", "daily_reward", `Day ${status.nextClaimDay} daily reward`);
  }

  return { day: status.nextClaimDay, reward: reward.label, type: reward.type, amount: reward.amount };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SKILL TREE
// ═══════════════════════════════════════════════════════════════════════════════

const SKILL_BRANCHES = [
  { slug: "myga_master", name: "MYGA Master", maxLevel: 5 },
  { slug: "iul_architect", name: "IUL Architect", maxLevel: 5 },
  { slug: "roth_alchemist", name: "Roth Alchemist", maxLevel: 5 },
  { slug: "tax_strategist", name: "Tax Strategist", maxLevel: 5 },
  { slug: "estate_guardian", name: "Estate Guardian", maxLevel: 5 },
  { slug: "real_estate_mogul", name: "Real Estate Mogul", maxLevel: 5 },
  { slug: "sales_warrior", name: "Sales Warrior", maxLevel: 5 },
  { slug: "ai_commander", name: "AI Commander", maxLevel: 5 },
  { slug: "compliance_shield", name: "Compliance Shield", maxLevel: 5 },
  { slug: "client_empath", name: "Client Empath", maxLevel: 5 },
];

export async function getSkillTree(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const progress = await db.select().from(skillTreeProgress)
    .where(eq(skillTreeProgress.userId, userId));

  return SKILL_BRANCHES.map(branch => {
    const p = progress.find(pr => pr.skillSlug === branch.slug);
    return {
      ...branch,
      currentLevel: p?.currentLevel ?? 0,
      xpInvested: p?.xpInvested ?? 0,
      mastered: p?.mastered ?? false,
      masteredAt: p?.masteredAt,
    };
  });
}

export async function investInSkill(userId: number, skillSlug: string, xpAmount: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const branch = SKILL_BRANCHES.find(b => b.slug === skillSlug);
  if (!branch) throw new Error("Skill not found");

  const profile = await getOrCreateXpProfile(userId);
  if (profile.totalXp < xpAmount) throw new Error("Not enough XP to invest");

  // Get or create skill progress
  let progress = await db.select().from(skillTreeProgress)
    .where(and(eq(skillTreeProgress.userId, userId), eq(skillTreeProgress.skillSlug, skillSlug)))
    .limit(1);

  if (progress.length === 0) {
    await db.insert(skillTreeProgress).values({
      userId, skillSlug, skillName: branch.name, maxLevel: branch.maxLevel,
    });
    progress = await db.select().from(skillTreeProgress)
      .where(and(eq(skillTreeProgress.userId, userId), eq(skillTreeProgress.skillSlug, skillSlug)))
      .limit(1);
  }

  const p = progress[0];
  if (p.mastered) throw new Error("Skill already mastered");

  const newXpInvested = p.xpInvested + xpAmount;
  const xpPerLevel = 500;
  const newLevel = Math.min(Math.floor(newXpInvested / xpPerLevel), branch.maxLevel);
  const mastered = newLevel >= branch.maxLevel;

  await db.update(skillTreeProgress).set({
    xpInvested: newXpInvested,
    currentLevel: newLevel,
    mastered,
    masteredAt: mastered ? new Date() : undefined,
  }).where(eq(skillTreeProgress.id, p.id));

  if (mastered) {
    await tryUnlockAchievement(userId, "skill_mastered");
  }

  return { skillSlug, newLevel, mastered, xpInvested: newXpInvested };
}

// ═══════════════════════════════════════════════════════════════════════════════
// FAMILY / COUPLES MODE
// ═══════════════════════════════════════════════════════════════════════════════

function generateInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function createFamily(userId: number, name: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  // Check if user already in a family
  const existing = await db.select().from(familyMembers).where(eq(familyMembers.userId, userId)).limit(1);
  if (existing.length > 0) throw new Error("You are already in a family group");

  const inviteCode = generateInviteCode();
  await db.insert(familyGroups).values({ name, inviteCode, createdBy: userId });

  const group = await db.select().from(familyGroups).where(eq(familyGroups.inviteCode, inviteCode)).limit(1);
  await db.insert(familyMembers).values({ familyId: group[0].id, userId, role: "leader" });

  return { familyId: group[0].id, inviteCode, name };
}

export async function joinFamily(userId: number, inviteCode: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await db.select().from(familyMembers).where(eq(familyMembers.userId, userId)).limit(1);
  if (existing.length > 0) throw new Error("You are already in a family group");

  const group = await db.select().from(familyGroups).where(eq(familyGroups.inviteCode, inviteCode.toUpperCase())).limit(1);
  if (group.length === 0) throw new Error("Invalid invite code");

  await db.insert(familyMembers).values({ familyId: group[0].id, userId, role: "member" });
  return { familyId: group[0].id, name: group[0].name };
}

export async function getMyFamily(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const membership = await db.select().from(familyMembers).where(eq(familyMembers.userId, userId)).limit(1);
  if (membership.length === 0) return null;

  const group = await db.select().from(familyGroups).where(eq(familyGroups.id, membership[0].familyId)).limit(1);
  if (group.length === 0) return null;

  const members = await db.select().from(familyMembers).where(eq(familyMembers.familyId, group[0].id));

  // Get XP profiles for all members
  const memberProfiles = [];
  for (const m of members) {
    const profile = await getOrCreateXpProfile(m.userId);
    const levelInfo = getLevelForXp(profile.totalXp);
    memberProfiles.push({
      userId: m.userId,
      role: m.role,
      joinedAt: m.joinedAt,
      totalXp: profile.totalXp,
      level: levelInfo.level,
      levelName: levelInfo.levelName,
      currentStreak: profile.currentStreak,
      russellCoin: profile.russellCoin,
    });
  }

  return {
    ...group[0],
    myRole: membership[0].role,
    members: memberProfiles.sort((a, b) => b.totalXp - a.totalXp),
    totalFamilyXp: memberProfiles.reduce((sum, m) => sum + m.totalXp, 0),
  };
}

export async function leaveFamily(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(familyMembers).where(eq(familyMembers.userId, userId));
  return { left: true };
}

// ═══════════════════════════════════════════════════════════════════════════════
// WAR STORIES
// ═══════════════════════════════════════════════════════════════════════════════

export async function createWarStory(userId: number, data: { title: string; content: string; category: string; dollarImpact?: number; isAnonymous?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(warStories).values({
    userId,
    title: data.title,
    content: data.content,
    category: data.category as any,
    dollarImpact: data.dollarImpact ? String(data.dollarImpact) as any : null,
    isAnonymous: data.isAnonymous ?? true,
  });
  await earnXp(userId, 100, "war_story", "Shared a war story");
  await earnRussellCoin(userId, 50, "earn", "war_story", "War story shared");
  await tryUnlockAchievement(userId, "first_war_story");
  return { success: true };
}

export async function getWarStories(limit = 20) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.select().from(warStories).orderBy(desc(warStories.createdAt)).limit(limit);
}

export async function likeWarStory(storyId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(warStories).set({ likes: sql`${warStories.likes} + 1` }).where(eq(warStories.id, storyId));
}

// ═══════════════════════════════════════════════════════════════════════════════
// PREDICTION MARKET
// ═══════════════════════════════════════════════════════════════════════════════

export async function placePrediction(userId: number, question: string, prediction: string, wager: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  if (wager < 10) throw new Error("Minimum wager is 10 RC");
  await spendRussellCoin(userId, wager, "prediction_bet", `Bet on: ${question}`);
  await db.insert(predictionBets).values({ userId, question, prediction, wager });
  return { success: true };
}

export async function getMyPredictions(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.select().from(predictionBets)
    .where(eq(predictionBets.userId, userId))
    .orderBy(desc(predictionBets.createdAt))
    .limit(50);
}

// ═══════════════════════════════════════════════════════════════════════════════
// XP HISTORY
// ═══════════════════════════════════════════════════════════════════════════════

export async function getXpHistory(userId: number, limit = 30) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.select().from(xpTransactions)
    .where(eq(xpTransactions.userId, userId))
    .orderBy(desc(xpTransactions.createdAt))
    .limit(limit);
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEADERBOARD (XP-based)
// ═══════════════════════════════════════════════════════════════════════════════

export async function getXpLeaderboard(limit = 25) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.select().from(userXpProfiles)
    .orderBy(desc(userXpProfiles.totalXp))
    .limit(limit);
}

// ═══════════════════════════════════════════════════════════════════════════════
// PET SYSTEM (Secret #37 — The Pet System)
// ═══════════════════════════════════════════════════════════════════════════════

const PET_EVOLUTION = [
  { stage: "hatchling" as const, minLevel: 1, xpToNext: 100 },
  { stage: "juvenile" as const, minLevel: 5, xpToNext: 250 },
  { stage: "adolescent" as const, minLevel: 10, xpToNext: 500 },
  { stage: "adult" as const, minLevel: 20, xpToNext: 1000 },
  { stage: "elder" as const, minLevel: 35, xpToNext: 2500 },
  { stage: "legendary" as const, minLevel: 50, xpToNext: 5000 },
];

function getEvolutionStage(level: number) {
  let stage = PET_EVOLUTION[0];
  for (const s of PET_EVOLUTION) {
    if (level >= s.minLevel) stage = s;
    else break;
  }
  return stage;
}

export async function getUserPet(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [pet] = await db.select().from(userPets)
    .where(and(eq(userPets.userId, userId), eq(userPets.isActive, true)))
    .limit(1);
  return pet ?? null;
}

export async function adoptPet(userId: number, speciesId: string, name: string, baseStats: { strength: number; wisdom: number; charisma: number; luck: number }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  // Check if user already has a pet
  const existing = await getUserPet(userId);
  if (existing) throw new Error("You already have a pet! You can only have one active pet.");
  const [result] = await db.insert(userPets).values({
    userId,
    speciesId,
    name,
    strength: baseStats.strength,
    wisdom: baseStats.wisdom,
    charisma: baseStats.charisma,
    luck: baseStats.luck,
    lastInteractedAt: new Date(),
  });
  return { id: result.insertId, speciesId, name };
}

export async function feedPet(userId: number, foodId: string, xpGain: number, happinessGain: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const pet = await getUserPet(userId);
  if (!pet) throw new Error("No pet found. Adopt a pet first!");

  const newXp = pet.xp + xpGain;
  const newHappiness = Math.min(100, pet.happiness + happinessGain);
  const newHunger = Math.min(100, pet.hunger + 20);
  const newFeedings = pet.totalFeedings + 1;

  // Check for level up
  let newLevel = pet.level;
  let newXpToNext = pet.xpToNext;
  let remainingXp = newXp;
  while (remainingXp >= newXpToNext) {
    remainingXp -= newXpToNext;
    newLevel++;
    const evo = getEvolutionStage(newLevel);
    newXpToNext = evo.xpToNext;
  }

  const evo = getEvolutionStage(newLevel);
  const newStage = evo.stage;

  // Stat gains on level up
  const levelUps = newLevel - pet.level;
  const newStrength = pet.strength + levelUps;
  const newWisdom = pet.wisdom + levelUps;
  const newCharisma = pet.charisma + levelUps;
  const newLuck = pet.luck + Math.floor(levelUps * 0.5);

  await db.update(userPets).set({
    xp: remainingXp,
    xpToNext: newXpToNext,
    level: newLevel,
    happiness: newHappiness,
    hunger: newHunger,
    totalFeedings: newFeedings,
    evolutionStage: newStage,
    strength: newStrength,
    wisdom: newWisdom,
    charisma: newCharisma,
    luck: newLuck,
    lastFedAt: new Date(),
    lastInteractedAt: new Date(),
  }).where(eq(userPets.id, pet.id));

  const evolved = newStage !== pet.evolutionStage;
  return {
    pet: { ...pet, xp: remainingXp, xpToNext: newXpToNext, level: newLevel, happiness: newHappiness, hunger: newHunger, totalFeedings: newFeedings, evolutionStage: newStage, strength: newStrength, wisdom: newWisdom, charisma: newCharisma, luck: newLuck },
    levelUps,
    evolved,
    newStage: evolved ? newStage : null,
  };
}

export async function interactWithPet(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const pet = await getUserPet(userId);
  if (!pet) throw new Error("No pet found");
  const newHappiness = Math.min(100, pet.happiness + 5);
  await db.update(userPets).set({
    happiness: newHappiness,
    lastInteractedAt: new Date(),
  }).where(eq(userPets.id, pet.id));
  return { ...pet, happiness: newHappiness };
}

export async function decayPetStats() {
  // Called periodically — reduces happiness/hunger for neglected pets
  const db = await getDb();
  if (!db) return;
  await db.execute(sql`
    UPDATE user_pets
    SET happiness = GREATEST(0, happiness - 5),
        hunger = GREATEST(0, hunger - 10)
    WHERE isActive = true
      AND lastInteractedAt < DATE_SUB(NOW(), INTERVAL 24 HOUR)
  `);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MORNING RITUAL (Secret #3 — The Morning Ritual)
// ═══════════════════════════════════════════════════════════════════════════════

export async function getTodayRitual(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const today = getTodayStr();
  const [ritual] = await db.select().from(morningRituals)
    .where(and(eq(morningRituals.userId, userId), eq(morningRituals.date, today)))
    .limit(1);
  return ritual ?? null;
}

export async function startMorningRitual(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const today = getTodayStr();
  const existing = await getTodayRitual(userId);
  if (existing) return existing;

  // Calculate streak
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  const [yesterdayRitual] = await db.select().from(morningRituals)
    .where(and(eq(morningRituals.userId, userId), eq(morningRituals.date, yesterdayStr)))
    .limit(1);
  const streakDay = (yesterdayRitual?.isComplete) ? (yesterdayRitual.streakDay + 1) : 1;

  const [result] = await db.insert(morningRituals).values({
    userId,
    date: today,
    stepsCompleted: [],
    startedAt: new Date(),
    streakDay,
  });
  return { id: result.insertId, userId, date: today, stepsCompleted: [] as number[], totalSteps: 7, isComplete: false, startedAt: new Date(), completedAt: null, streakDay, xpEarned: 0, coinsEarned: 0 };
}

export async function completeRitualStep(userId: number, stepIndex: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const ritual = await getTodayRitual(userId);
  if (!ritual) throw new Error("Start your morning ritual first!");
  if (ritual.isComplete) return { ritual, alreadyComplete: true };

  const steps: number[] = (ritual.stepsCompleted as number[]) || [];
  if (steps.includes(stepIndex)) return { ritual, alreadyComplete: true };
  steps.push(stepIndex);

  const isComplete = steps.length >= ritual.totalSteps;
  const xpPerStep = 25;
  const coinsPerStep = 10;
  const bonusXp = isComplete ? 100 : 0;
  const bonusCoins = isComplete ? 50 : 0;
  const xpEarned = ritual.xpEarned + xpPerStep + bonusXp;
  const coinsEarned = ritual.coinsEarned + coinsPerStep + bonusCoins;

  await db.update(morningRituals).set({
    stepsCompleted: steps,
    isComplete,
    completedAt: isComplete ? new Date() : null,
    xpEarned,
    coinsEarned,
  }).where(eq(morningRituals.id, ritual.id));

  return {
    ritual: { ...ritual, stepsCompleted: steps, isComplete, xpEarned, coinsEarned },
    alreadyComplete: false,
    justCompleted: isComplete,
    xpGained: xpPerStep + bonusXp,
    coinsGained: coinsPerStep + bonusCoins,
  };
}

export async function getRitualStreak(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const rituals = await db.select().from(morningRituals)
    .where(and(eq(morningRituals.userId, userId), eq(morningRituals.isComplete, true)))
    .orderBy(desc(morningRituals.date))
    .limit(30);
  return {
    currentStreak: rituals[0]?.streakDay ?? 0,
    totalCompleted: rituals.length,
    recentRituals: rituals,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// WITHDRAWAL TRIGGERS (Secret #8 — The Withdrawal Symptom)
// ═══════════════════════════════════════════════════════════════════════════════

export async function createWithdrawalTrigger(userId: number, data: {
  triggerType: "gentle_nudge" | "fomo_alert" | "pet_sad" | "streak_warning" | "loot_expiring" | "quest_expiring" | "rival_passed" | "market_move";
  title: string;
  message: string;
  urgency?: "low" | "medium" | "high" | "critical";
  channel?: "in_app" | "email" | "push" | "sms";
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(withdrawalTriggers).values({
    userId,
    triggerType: data.triggerType,
    title: data.title,
    message: data.message,
    urgency: data.urgency ?? "medium",
    channel: data.channel ?? "in_app",
    sentAt: new Date(),
  });
  return { id: result.insertId };
}

export async function getUnreadTriggers(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.select().from(withdrawalTriggers)
    .where(and(eq(withdrawalTriggers.userId, userId), eq(withdrawalTriggers.isRead, false)))
    .orderBy(desc(withdrawalTriggers.createdAt))
    .limit(20);
}

export async function markTriggerRead(triggerId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(withdrawalTriggers).set({
    isRead: true,
    openedAt: new Date(),
  }).where(eq(withdrawalTriggers.id, triggerId));
}

export async function markTriggerClicked(triggerId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(withdrawalTriggers).set({
    clickedAt: new Date(),
  }).where(eq(withdrawalTriggers.id, triggerId));
}

export async function generateWithdrawalTriggers(userId: number) {
  // Analyze user state and generate appropriate triggers
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const triggers: Array<{ triggerType: any; title: string; message: string; urgency: any }> = [];

  // Check pet happiness
  const pet = await getUserPet(userId);
  if (pet && pet.happiness < 40) {
    triggers.push({
      triggerType: "pet_sad" as const,
      title: `${pet.name} misses you!`,
      message: `Your ${pet.speciesId} ${pet.name} is feeling lonely (happiness: ${pet.happiness}%). Come back and feed them to keep their spirits up!`,
      urgency: pet.happiness < 20 ? "critical" as const : "high" as const,
    });
  }

  // Check streak
  const profile = await getXpProfile(userId);
  if (profile && profile.currentStreak > 0) {
    triggers.push({
      triggerType: "streak_warning" as const,
      title: `Don't lose your ${profile.currentStreak}-day streak!`,
      message: `You've been on fire for ${profile.currentStreak} days straight. Log in today to keep it going!`,
      urgency: profile.currentStreak > 7 ? "high" as const : "medium" as const,
    });
  }

  // Check expiring quests
  const quests = await getActiveQuests(userId);
  const expiringQuests = quests.filter(q => {
    if (!q.expiresAt) return false;
    const hoursLeft = (new Date(q.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursLeft < 6 && hoursLeft > 0;
  });
  for (const q of expiringQuests) {
    triggers.push({
      triggerType: "quest_expiring" as const,
      title: `Quest expiring: ${q.title}`,
      message: `Your quest "${q.title}" is about to expire! Complete it now to earn ${q.xpReward} XP and ${q.coinReward} RussellCoin.`,
      urgency: "high" as const,
    });
  }

  // Create triggers in DB
  for (const t of triggers) {
    await createWithdrawalTrigger(userId, t);
  }

  return triggers;
}

// ═══════════════════════════════════════════════════════════════════════════════
// REVENUE GUARANTEE (Secret #10 — The Revenue Guarantee)
// ═══════════════════════════════════════════════════════════════════════════════

export async function calculateRevenueGuarantee(userId: number, input: {
  currentAUM: number;
  currentRevenue: number;
  monthlySubscriptionCost: number;
  expectedAUMGrowthPct: number;
  expectedRevenueGrowthPct: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const projectedAUM = input.currentAUM * (1 + input.expectedAUMGrowthPct / 100);
  const projectedRevenue = input.currentRevenue * (1 + input.expectedRevenueGrowthPct / 100);
  const annualSubscriptionCost = input.monthlySubscriptionCost * 12;
  const revenueIncrease = projectedRevenue - input.currentRevenue;
  const roiMultiple = revenueIncrease > 0 ? revenueIncrease / annualSubscriptionCost : 0;
  const dailyRevenueIncrease = revenueIncrease / 365;
  const breakEvenDays = dailyRevenueIncrease > 0 ? Math.ceil(annualSubscriptionCost / dailyRevenueIncrease) : 999;

  let guaranteeTier: "bronze" | "silver" | "gold" | "platinum" = "bronze";
  if (roiMultiple >= 50) guaranteeTier = "platinum";
  else if (roiMultiple >= 20) guaranteeTier = "gold";
  else if (roiMultiple >= 10) guaranteeTier = "silver";

  const [result] = await db.insert(revenueGuaranteeCalcs).values({
    userId,
    currentAUM: String(input.currentAUM),
    currentRevenue: String(input.currentRevenue),
    projectedAUM: String(projectedAUM),
    projectedRevenue: String(projectedRevenue),
    subscriptionCost: String(annualSubscriptionCost),
    roiMultiple: String(roiMultiple),
    breakEvenDays,
    guaranteeTier,
  });

  return {
    id: result.insertId,
    currentAUM: input.currentAUM,
    currentRevenue: input.currentRevenue,
    projectedAUM,
    projectedRevenue,
    annualSubscriptionCost,
    revenueIncrease,
    roiMultiple: Math.round(roiMultiple * 100) / 100,
    breakEvenDays,
    guaranteeTier,
    monthlyROI: Math.round((revenueIncrease / 12) * 100) / 100,
    dailyROI: Math.round(dailyRevenueIncrease * 100) / 100,
  };
}

export async function getRevenueGuaranteeHistory(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.select().from(revenueGuaranteeCalcs)
    .where(eq(revenueGuaranteeCalcs.userId, userId))
    .orderBy(desc(revenueGuaranteeCalcs.createdAt))
    .limit(10);
}


// ═══════════════════════════════════════════════════════════════════════════════
// QUEST PROGRESS TRACKING — Maps real user actions to quest progress
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Category-to-quest-slug mapping.
 * When a user performs an action in a category, we increment progress
 * on ALL active quests whose slug matches that category.
 */
const CATEGORY_QUEST_SLUGS: Record<string, string[]> = {
  tool_usage: ["knowledge_seeker", "calculator_sprint"],
  client_contact: ["client_whisperer"],
  deal_movement: ["deal_closer"],
  calculation_run: ["calculator_sprint", "number_cruncher"],
  strategy_created: ["number_cruncher"],
  ai_generation: ["knowledge_seeker"],
  content_saved: ["note_taker"],
  login_streak: ["morning_warrior", "streak_keeper"],
};

/**
 * Increment quest progress for a user based on the action category.
 * This is called by the global quest tracker on every mutation success.
 */
export async function incrementQuestByCategory(
  userId: number,
  category: string,
  mutationPath: string,
): Promise<Array<{ questSlug: string; progress: number; target: number; completed: boolean }>> {
  const slugs = CATEGORY_QUEST_SLUGS[category] || [];
  const results: Array<{ questSlug: string; progress: number; target: number; completed: boolean }> = [];

  for (const slug of slugs) {
    const result = await updateQuestProgress(userId, slug, 1);
    if (result) {
      results.push({
        questSlug: result.slug,
        progress: result.progress,
        target: result.target,
        completed: result.completed,
      });
    }
  }

  return results;
}

/**
 * Get aggregated quest progress stats for a user.
 */
export async function getQuestProgressStats(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const active = await db.select().from(userQuests)
    .where(and(eq(userQuests.userId, userId), eq(userQuests.status, "active")));

  const completed = await db.select().from(userQuests)
    .where(and(eq(userQuests.userId, userId), eq(userQuests.status, "claimed")));

  const totalActive = active.length;
  const totalCompleted = completed.length;
  const totalXpEarned = completed.reduce((sum, q) => sum + q.xpReward, 0);
  const totalCoinsEarned = completed.reduce((sum, q) => sum + q.coinReward, 0);

  // Group active quests by type
  const byType = {
    daily: active.filter(q => q.questType === "daily"),
    weekly: active.filter(q => q.questType === "weekly"),
    epic: active.filter(q => q.questType === "epic"),
    legendary: active.filter(q => q.questType === "legendary"),
  };

  return {
    totalActive,
    totalCompleted,
    totalXpEarned,
    totalCoinsEarned,
    activeByType: {
      daily: byType.daily.map(q => ({ id: q.id, slug: q.questSlug, title: q.title, progress: q.progress, target: q.target, xpReward: q.xpReward, coinReward: q.coinReward, expiresAt: q.expiresAt })),
      weekly: byType.weekly.map(q => ({ id: q.id, slug: q.questSlug, title: q.title, progress: q.progress, target: q.target, xpReward: q.xpReward, coinReward: q.coinReward, expiresAt: q.expiresAt })),
      epic: byType.epic.map(q => ({ id: q.id, slug: q.questSlug, title: q.title, progress: q.progress, target: q.target, xpReward: q.xpReward, coinReward: q.coinReward })),
      legendary: byType.legendary.map(q => ({ id: q.id, slug: q.questSlug, title: q.title, progress: q.progress, target: q.target, xpReward: q.xpReward, coinReward: q.coinReward })),
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// WITHDRAWAL SYMPTOM EMAIL CRON — Checks inactive users and sends re-engagement
// ═══════════════════════════════════════════════════════════════════════════════
export async function checkAndSendWithdrawalEmails(): Promise<{ checked: number; sent: number; errors: number }> {
  const db = await getDb();
  if (!db) return { checked: 0, sent: 0, errors: 0 };

  const now = Date.now();
  const HOUR = 60 * 60 * 1000;

  // Find users inactive 24+ hours
  const cutoff24h = new Date(now - 24 * HOUR);
  const inactiveUsers = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    lastSignedIn: users.lastSignedIn,
  }).from(users).where(
    and(
      lt(users.lastSignedIn, cutoff24h),
      isNotNull(users.email),
    )
  ).limit(100);

  let checked = 0;
  let sent = 0;
  let errors = 0;

  for (const u of inactiveUsers) {
    if (!u.email) continue;
    checked++;

    const hoursInactive = (now - new Date(u.lastSignedIn).getTime()) / HOUR;

    // Determine escalation level
    let level: "gentle" | "urgent" | "fomo";
    if (hoursInactive >= 72) level = "fomo";
    else if (hoursInactive >= 48) level = "urgent";
    else level = "gentle";

    // Check if we already sent this level recently (last 24h)
    const existingTriggers = await db.select().from(withdrawalTriggers).where(
      and(
        eq(withdrawalTriggers.userId, u.id),
        eq(withdrawalTriggers.channel, "email"),
        gte(withdrawalTriggers.createdAt, new Date(now - 24 * HOUR)),
      )
    ).limit(1);

    if (existingTriggers.length > 0) continue; // Already sent recently

    // Gather context
    let petName: string | undefined;
    let petHappiness: number | undefined;
    let currentStreak: number | undefined;
    let expiringQuests: number | undefined;

    try {
      const pet = await getUserPet(u.id);
      if (pet) { petName = pet.name; petHappiness = pet.happiness; }
    } catch {}

    try {
      const profile = await getXpProfile(u.id);
      if (profile) currentStreak = profile.currentStreak;
    } catch {}

    try {
      const quests = await getActiveQuests(u.id);
      expiringQuests = quests.filter(q => {
        if (!q.expiresAt) return false;
        const hoursLeft = (new Date(q.expiresAt).getTime() - now) / HOUR;
        return hoursLeft < 12 && hoursLeft > 0;
      }).length || undefined;
    } catch {}

    // Send the email
    const result = await sendWithdrawalEmail({
      toEmail: u.email,
      userName: u.name || "Advisor",
      escalationLevel: level,
      hoursInactive,
      petName,
      petHappiness,
      currentStreak,
      expiringQuests,
    });

    if (result.sent) {
      sent++;
      // Record in withdrawal_triggers
      await createWithdrawalTrigger(u.id, {
        triggerType: level === "gentle" ? "gentle_nudge" : level === "urgent" ? "streak_warning" : "fomo_alert",
        title: `Re-engagement email (${level})`,
        message: `Sent ${level} withdrawal email after ${Math.round(hoursInactive)}h inactivity`,
        urgency: level === "gentle" ? "low" : level === "urgent" ? "medium" : "high",
      });
      // Mark as email channel
      const triggers = await getUnreadTriggers(u.id);
      if (triggers.length > 0) {
        await db.update(withdrawalTriggers).set({ channel: "email", sentAt: new Date() }).where(eq(withdrawalTriggers.id, triggers[0].id));
      }
    } else {
      errors++;
    }
  }

  console.log(`[Withdrawal Cron] Checked: ${checked}, Sent: ${sent}, Errors: ${errors}`);
  return { checked, sent, errors };
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEADERBOARD RIVALRY — Head-to-head challenges
// ═══════════════════════════════════════════════════════════════════════════════

export async function createRivalryChallenge(challengerId: number, rivalId: number, metric: string, durationDays: number = 7) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  if (challengerId === rivalId) throw new Error("Cannot challenge yourself");

  // Check if there's already an active challenge between these users
  const existing = await db.select().from(inAppNotifications)
    .where(and(
      eq(inAppNotifications.userId, rivalId),
      sql`${inAppNotifications.message} LIKE '%rivalry%'`,
      eq(inAppNotifications.read, false),
    ))
    .limit(1);
  if (existing.length > 0) throw new Error("Challenge already pending");

  const endsAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

  // Create notification for the rival
  await db.insert(inAppNotifications).values({
    workspaceId: rivalId,
    userId: rivalId,
    title: "Rivalry Challenge!",
    message: `You've been challenged to a ${metric} duel! ${durationDays}-day rivalry battle. Challenger: ${challengerId}`,
    type: "achievement",
  });

  return { challengerId, rivalId, metric, durationDays, endsAt };
}

export async function getLeaderboardRivals(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  // Get users with similar XP (within 20% range)
  const profile = await getOrCreateXpProfile(userId);
  const minXp = Math.floor(profile.totalXp * 0.8);
  const maxXp = Math.ceil(profile.totalXp * 1.2);

  const rivals = await db.select({
    id: users.id,
    name: users.name,
    xp: userXpProfiles.totalXp,
    level: userXpProfiles.level,
    streak: userXpProfiles.currentStreak,
  })
    .from(users)
    .innerJoin(userXpProfiles, eq(users.id, userXpProfiles.userId))
    .where(and(
      sql`${userXpProfiles.totalXp} BETWEEN ${minXp} AND ${maxXp}`,
      sql`${users.id} != ${userId}`,
    ))
    .orderBy(desc(userXpProfiles.totalXp))
    .limit(10);

  return rivals;
}

// ═══════════════════════════════════════════════════════════════════════════════
// REVENUE ATTRIBUTION — Tool usage → deal close correlation
// ═══════════════════════════════════════════════════════════════════════════════

export async function getRevenueAttribution(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  // Get closed deals with their values
  const closedDeals = await db.select({
    id: deals.id,
    value: deals.value,
    closedAt: deals.closedAt,
    clientId: deals.clientId,
  })
    .from(deals)
    .where(and(eq(deals.workspaceId, userId), eq(deals.stage, "CLOSED_WON")))
    .orderBy(desc(deals.closedAt))
    .limit(50);

  // Get tool usage from XP log (which tracks all actions)
  const toolUsage = await db.select({
    source: xpTransactions.source,
    count: sql<number>`COUNT(*)`.as("count"),
    totalXp: sql<number>`SUM(${xpTransactions.amount})`.as("totalXp"),
  })
    .from(xpTransactions)
    .where(eq(xpTransactions.userId, userId))
    .groupBy(xpTransactions.source)
    .orderBy(desc(sql`count`));

  // Calculate attribution: deals per tool category
  const totalRevenue = closedDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  const totalDeals = closedDeals.length;

  // Map tool usage to revenue impact
  const attribution = toolUsage.map(t => ({
    tool: t.source,
    usageCount: t.count,
    xpEarned: t.totalXp,
    // Estimated revenue impact based on usage proportion
    estimatedRevenue: totalRevenue > 0 ? Math.round(totalRevenue * (t.count / Math.max(toolUsage.reduce((s, u) => s + u.count, 0), 1))) : 0,
    revenuePerUse: t.count > 0 ? Math.round(totalRevenue / t.count) : 0,
  }));

  return {
    totalRevenue,
    totalDeals,
    toolAttribution: attribution,
    topCorrelations: attribution.slice(0, 5),
    avgDealValue: totalDeals > 0 ? Math.round(totalRevenue / totalDeals) : 0,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PREDICTIVE DEAL SCORING — LLM-powered deal close probability
// ═══════════════════════════════════════════════════════════════════════════════

export async function getDealScoringData(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const allDeals = await db.select({
    id: deals.id,
    value: deals.value,
    stage: deals.stage,
    probability: deals.probability,
    clientId: deals.clientId,
    createdAt: deals.createdAt,
    closedAt: deals.closedAt,
  })
    .from(deals)
    .where(eq(deals.workspaceId, userId))
    .orderBy(desc(deals.createdAt))
    .limit(100);

  return allDeals;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MONTHLY REPORT — Aggregate user stats for email
// ═══════════════════════════════════════════════════════════════════════════════

export async function getMonthlyReportData(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // XP earned this month
  const xpThisMonth = await db.select({
    total: sql<number>`COALESCE(SUM(${xpTransactions.amount}), 0)`.as("total"),
    count: sql<number>`COUNT(*)`.as("count"),
  })
    .from(xpTransactions)
    .where(and(eq(xpTransactions.userId, userId), gte(xpTransactions.createdAt, monthStart)));

  // Deals closed this month
  const dealsThisMonth = await db.select({
    count: sql<number>`COUNT(*)`.as("count"),
    totalValue: sql<number>`COALESCE(SUM(${deals.value}), 0)`.as("totalValue"),
  })
    .from(deals)
    .where(and(eq(deals.workspaceId, userId), eq(deals.stage, "CLOSED_WON"), gte(deals.closedAt, monthStart)));

  // Profile
  const profile = await getOrCreateXpProfile(userId);

  // Quests completed this month
  const questsCompleted = await db.select({
    count: sql<number>`COUNT(*)`.as("count"),
  })
    .from(userQuests)
    .where(and(eq(userQuests.userId, userId), eq(userQuests.status, "completed"), gte(userQuests.completedAt, monthStart)));

  return {
    month: monthStart.toISOString().slice(0, 7),
    xp: { earned: xpThisMonth[0]?.total ?? 0, actions: xpThisMonth[0]?.count ?? 0 },
    deals: { closed: dealsThisMonth[0]?.count ?? 0, revenue: dealsThisMonth[0]?.totalValue ?? 0 },
    level: profile.level,
    totalXp: profile.totalXp,
    currentStreak: profile.currentStreak,
    longestStreak: profile.longestStreak,
    questsCompleted: questsCompleted[0]?.count ?? 0,
    russellCoin: profile.russellCoin,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PREDICTION MARKET QUESTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export async function createPredictionQuestion(userId: number, data: { question: string; category: string; endDate: Date }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(predictionQuestions).values({
    createdBy: userId,
    question: data.question,
    category: data.category,
    endDate: data.endDate,
  });
  await earnXp(userId, 50, "prediction_question", "Created a prediction market question");
  return { success: true };
}

export async function getPredictionQuestions(limit = 30) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.select().from(predictionQuestions)
    .where(eq(predictionQuestions.status, "open"))
    .orderBy(desc(predictionQuestions.createdAt))
    .limit(limit);
}

export async function voteOnPrediction(userId: number, questionId: number, vote: "yes" | "no", wager: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  // Spend RussellCoin for the wager
  await spendRussellCoin(userId, wager, "prediction_bet", `Bet ${vote.toUpperCase()} on question #${questionId}`);
  // Record the bet
  const question = await db.select().from(predictionQuestions).where(eq(predictionQuestions.id, questionId)).limit(1);
  if (!question.length) throw new Error("Question not found");
  await db.insert(predictionBets).values({
    userId,
    question: question[0].question,
    prediction: vote,
    wager,
  });
  // Update vote counts
  if (vote === "yes") {
    await db.update(predictionQuestions).set({
      yesCount: sql`${predictionQuestions.yesCount} + 1`,
      totalWager: sql`${predictionQuestions.totalWager} + ${wager}`,
    }).where(eq(predictionQuestions.id, questionId));
  } else {
    await db.update(predictionQuestions).set({
      noCount: sql`${predictionQuestions.noCount} + 1`,
      totalWager: sql`${predictionQuestions.totalWager} + ${wager}`,
    }).where(eq(predictionQuestions.id, questionId));
  }
  await earnXp(userId, 25, "prediction_vote", `Voted on prediction #${questionId}`);
  return { success: true };
}

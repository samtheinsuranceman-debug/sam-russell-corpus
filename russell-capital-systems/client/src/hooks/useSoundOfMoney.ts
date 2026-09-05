/**
 * SOUND OF MONEY — Global Pavlovian Conditioning Layer
 * 
 * This hook intercepts tRPC mutation cache events globally and plays
 * the appropriate reward sound based on the mutation path/type.
 * 
 * Instead of editing 100+ files, we listen to the mutation cache
 * from React Query and trigger sounds automatically.
 */
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useEntrainment } from "@/contexts/EntrainmentEngine";

type SoundEffect = "ka-ching" | "xp-ping" | "level-up" | "loot-reveal" | "streak-hit" | "quest-complete" | "deal-closed";

// Map mutation paths to sound effects
const MUTATION_SOUND_MAP: Record<string, SoundEffect> = {
  // Deal / Pipeline / Revenue actions → ka-ching
  "billing.createCheckout": "ka-ching",
  "billing.createPortalSession": "ka-ching",
  "pipeline.updateStage": "ka-ching",
  "pipeline.create": "ka-ching",
  "pipeline.updateDeal": "ka-ching",
  "deals.create": "ka-ching",
  "deals.update": "ka-ching",
  "deals.updateStage": "ka-ching",
  "deals.close": "deal-closed",
  "referral.create": "ka-ching",
  "referral.convert": "deal-closed",
  
  // Client actions → xp-ping
  "clients.create": "xp-ping",
  "clients.update": "xp-ping",
  "properties.create": "xp-ping",
  "clientOnboarding.complete": "xp-ping",
  "clientOnboarding.completeStep": "xp-ping",
  "clientIntake.submit": "xp-ping",
  "clientEngagement.record": "xp-ping",
  
  // XP / Level / Achievement actions → level-up or xp-ping
  "experience.earnXp": "xp-ping",
  "experience.claimQuestReward": "quest-complete",
  "experience.investInSkill": "level-up",
  "experience.purchaseLoot": "loot-reveal",
  "experience.claimDailyReward": "streak-hit",
  "experience.checkIn": "streak-hit",
  
  // Pet system → xp-ping
  "pet.feed": "xp-ping",
  "pet.interact": "xp-ping",
  "pet.adopt": "loot-reveal",
  
  // Morning ritual → streak-hit
  "morningRitual.start": "xp-ping",
  "morningRitual.completeStep": "streak-hit",
  
  // Strategy / Calculation actions → xp-ping
  "strategyLab.calculate": "xp-ping",
  "strategyLab.save": "xp-ping",
  "rothConversion.calculate": "xp-ping",
  "taxBracket.calculate": "xp-ping",
  "incomeGap.analyze": "xp-ping",
  "mortgageKiller.calculate": "xp-ping",
  "premiumFinancing.calculate": "xp-ping",
  "annuity.calculate": "xp-ping",
  "iul.calculate": "xp-ping",
  "withdrawalSequencing.calculate": "xp-ping",
  "retirementGuardrails.calculate": "xp-ping",
  "charitableGiving.calculate": "xp-ping",
  "revenueGuarantee.calculate": "xp-ping",
  "indexBacktester.run": "xp-ping",
  "inflationAnalysis.calculate": "xp-ping",
  "householdWealth.calculate": "xp-ping",
  "policyLoans.calculate": "xp-ping",
  "successionPlanning.calculate": "xp-ping",
  "competitiveAnalysis.run": "xp-ping",
  "riskTolerance.calculate": "xp-ping",
  "advisorIncome.calculate": "xp-ping",
  "incomeTimeline.calculate": "xp-ping",
  "portfolioDrift.analyze": "xp-ping",
  "taxOpportunity.detect": "xp-ping",
  
  // AI / Generation actions → loot-reveal
  "ai.generate": "loot-reveal",
  "ai.generateSlides": "loot-reveal",
  "ai.generatePptx": "loot-reveal",
  "slides.batchGenerate": "loot-reveal",
  "bulkGeneration.run": "loot-reveal",
  "warStoryAI.generate": "loot-reveal",
  "experience.generateAvatar": "loot-reveal",
  "aiAssist.query": "xp-ping",
  "leadGenerator.generate": "loot-reveal",
  "seminarGenerator.generate": "loot-reveal",
  "emailCampaign.generate": "loot-reveal",
  "salesStory.generate": "loot-reveal",
  "clientReport.generate": "loot-reveal",
  "complianceReport.generate": "loot-reveal",
  "documentTemplates.generate": "loot-reveal",
  
  // Save / Export actions → xp-ping
  "savedStrategies.create": "xp-ping",
  "savedScenarios.save": "xp-ping",
  "strategyExport.generatePdf": "xp-ping",
  "complianceExport.generate": "xp-ping",
  "notes.add": "xp-ping",
  "favorites.save": "xp-ping",
  "documentVault.upload": "xp-ping",
  "clientFiles.upload": "xp-ping",
  
  // Rewards → streak-hit
  "rewards.claim": "streak-hit",
  "rewards.claimDaily": "streak-hit",
  "rewards.purchase": "ka-ching",
  
  // Compliance → xp-ping
  "complianceAlerts.acknowledge": "xp-ping",
  "auditTimeline.record": "xp-ping",
  
  // Team / Admin → xp-ping
  "team.invite": "xp-ping",
  "team.update": "xp-ping",
};

// Fallback: categorize by keyword patterns in mutation path
function getSoundForMutationPath(path: string): SoundEffect | null {
  const lower = path.toLowerCase();
  
  // High-value actions
  if (lower.includes("close") || lower.includes("won") || lower.includes("convert")) return "deal-closed";
  if (lower.includes("checkout") || lower.includes("payment") || lower.includes("purchase") || lower.includes("buy")) return "ka-ching";
  
  // Achievement actions
  if (lower.includes("claim") || lower.includes("reward") || lower.includes("complete")) return "quest-complete";
  if (lower.includes("levelup") || lower.includes("upgrade") || lower.includes("evolve")) return "level-up";
  if (lower.includes("streak") || lower.includes("checkin") || lower.includes("daily")) return "streak-hit";
  
  // Generation / Discovery
  if (lower.includes("generate") || lower.includes("create") || lower.includes("discover")) return "loot-reveal";
  
  // Calculations / Tool usage
  if (lower.includes("calculate") || lower.includes("analyze") || lower.includes("run") || lower.includes("compute")) return "xp-ping";
  
  // Save / Update actions
  if (lower.includes("save") || lower.includes("update") || lower.includes("add") || lower.includes("submit")) return "xp-ping";
  
  return null;
}

/**
 * Global hook that listens to ALL tRPC mutation successes and plays
 * the appropriate Pavlovian reward sound. Mount once in App.tsx.
 */
export function useSoundOfMoney() {
  const { playSoundEffect, soundEffectsEnabled } = useEntrainment();
  const lastPlayedRef = useRef<number>(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!soundEffectsEnabled) return;

    // Subscribe to the global mutation cache for Pavlovian conditioning
    const unsubscribe = queryClient.getMutationCache().subscribe((event: any) => {
      if (event?.type !== "updated" || event?.action?.type !== "success") return;
      
      // Throttle: don't play sounds more than once per 300ms
      const now = Date.now();
      if (now - lastPlayedRef.current < 300) return;
      
      // Extract mutation key/path
      const mutationKey = event?.mutation?.options?.mutationKey;
      const path = Array.isArray(mutationKey) 
        ? mutationKey.flat().join(".") 
        : String(mutationKey || "");
      
      if (!path) return;
      
      // Look up sound
      const sound = MUTATION_SOUND_MAP[path] || getSoundForMutationPath(path);
      
      if (sound) {
        lastPlayedRef.current = now;
        playSoundEffect(sound);
      }
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [soundEffectsEnabled, playSoundEffect, queryClient]);
}

/**
 * Quest action categories for tracking
 */
export type QuestActionCategory = 
  | "tool_usage"
  | "client_contact" 
  | "deal_movement"
  | "calculation_run"
  | "strategy_created"
  | "ai_generation"
  | "content_saved"
  | "login_streak";

// Map mutation paths to quest action categories
const MUTATION_QUEST_MAP: Record<string, QuestActionCategory> = {
  // Client contacts
  "clients.create": "client_contact",
  "clients.update": "client_contact",
  "clientOnboarding.complete": "client_contact",
  "clientIntake.submit": "client_contact",
  "clientEngagement.record": "client_contact",
  
  // Deal movements
  "pipeline.updateStage": "deal_movement",
  "pipeline.create": "deal_movement",
  "deals.create": "deal_movement",
  "deals.update": "deal_movement",
  "deals.updateStage": "deal_movement",
  "deals.close": "deal_movement",
  
  // Calculations
  "strategyLab.calculate": "calculation_run",
  "rothConversion.calculate": "calculation_run",
  "taxBracket.calculate": "calculation_run",
  "incomeGap.analyze": "calculation_run",
  "mortgageKiller.calculate": "calculation_run",
  "premiumFinancing.calculate": "calculation_run",
  "annuity.calculate": "calculation_run",
  "iul.calculate": "calculation_run",
  "withdrawalSequencing.calculate": "calculation_run",
  "retirementGuardrails.calculate": "calculation_run",
  "charitableGiving.calculate": "calculation_run",
  "revenueGuarantee.calculate": "calculation_run",
  "indexBacktester.run": "calculation_run",
  "inflationAnalysis.calculate": "calculation_run",
  "householdWealth.calculate": "calculation_run",
  "policyLoans.calculate": "calculation_run",
  "advisorIncome.calculate": "calculation_run",
  "incomeTimeline.calculate": "calculation_run",
  "portfolioDrift.analyze": "calculation_run",
  "taxOpportunity.detect": "calculation_run",
  "riskTolerance.calculate": "calculation_run",
  "competitiveAnalysis.run": "calculation_run",
  
  // AI generations
  "ai.generate": "ai_generation",
  "ai.generateSlides": "ai_generation",
  "warStoryAI.generate": "ai_generation",
  "experience.generateAvatar": "ai_generation",
  "leadGenerator.generate": "ai_generation",
  "seminarGenerator.generate": "ai_generation",
  "emailCampaign.generate": "ai_generation",
  "salesStory.generate": "ai_generation",
  "clientReport.generate": "ai_generation",
  
  // Strategy / Content saved
  "savedStrategies.create": "strategy_created",
  "savedScenarios.save": "content_saved",
  "notes.add": "content_saved",
  "favorites.save": "content_saved",
  "documentVault.upload": "content_saved",
};

function getQuestCategoryForPath(path: string): QuestActionCategory | null {
  const lower = path.toLowerCase();
  if (lower.includes("client") && (lower.includes("create") || lower.includes("add") || lower.includes("contact"))) return "client_contact";
  if (lower.includes("deal") || lower.includes("pipeline") || lower.includes("stage")) return "deal_movement";
  if (lower.includes("calculate") || lower.includes("analyze") || lower.includes("compute")) return "calculation_run";
  if (lower.includes("generate") || lower.includes("ai.")) return "ai_generation";
  if (lower.includes("save") || lower.includes("create") || lower.includes("strategy")) return "strategy_created";
  return "tool_usage"; // Default: any mutation counts as tool usage
}

export { MUTATION_SOUND_MAP, getSoundForMutationPath, MUTATION_QUEST_MAP, getQuestCategoryForPath };

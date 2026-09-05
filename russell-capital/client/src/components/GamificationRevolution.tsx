/**
 * ═══════════════════════════════════════════════════════════════════
 * GAMIFICATION REVOLUTION — S39-S42 (Category I)
 * + DAILY ENGAGEMENT — S63-S64 (Category P)
 * ═══════════════════════════════════════════════════════════════════
 * 
 * S39: Financial RPG System — turn wealth building into a game
 * S40: Leaderboard Revolution — competitive intelligence
 * S41: Achievement Constellation — visual achievement map
 * S42: Pet Guardian — virtual financial pet that grows with wealth
 * S63: Oracle Daily Briefing — personalized morning intelligence
 * S64: Streak Multiplier — reward consistent engagement
 * 
 * Patent: SI-019, PAT-001
 */
// @ts-nocheck
import { useState, useMemo } from "react";
import { useCalcResults } from "@/components/CalculatorIntegration";
import { useClientData } from "@/contexts/ClientDataContext";
import { useUnifiedDataBus } from "@/contexts/UnifiedDataBusContext";
import { 
  Trophy, Star, Flame, Crown, Zap, Target, Shield, Heart,
  Sparkles, TrendingUp, Award, Medal, Gem, Swords, Map,
  Sun, Coffee, BarChart3, CheckCircle2, Lock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/* ═══════════════════════════════════════════════════════════════════
   RPG SYSTEM (S39)
   ═══════════════════════════════════════════════════════════════════ */
interface AdvisorClass {
  name: string;
  icon: any;
  color: string;
  description: string;
  abilities: string[];
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  xpReward: number;
  rarity: "common" | "rare" | "epic" | "legendary";
}

function getAdvisorClass(calcResults: Record<string, any>): AdvisorClass {
  const taxCalcs = Object.keys(calcResults).filter(k => k.includes("tax") || k.includes("roth") || k.includes("deduction")).length;
  const insuranceCalcs = Object.keys(calcResults).filter(k => k.includes("insurance") || k.includes("iul") || k.includes("annuity")).length;
  const estateCalcs = Object.keys(calcResults).filter(k => k.includes("estate") || k.includes("trust") || k.includes("ilit")).length;
  const retirementCalcs = Object.keys(calcResults).filter(k => k.includes("fire") || k.includes("retirement") || k.includes("withdrawal")).length;

  const max = Math.max(taxCalcs, insuranceCalcs, estateCalcs, retirementCalcs);
  if (max === taxCalcs && taxCalcs > 0) return { name: "Tax Wizard", icon: Zap, color: "text-amber-400", description: "Master of tax optimization and wealth preservation", abilities: ["Tax Alpha Generation", "Bracket Surfing", "Roth Conversion Mastery"] };
  if (max === insuranceCalcs && insuranceCalcs > 0) return { name: "Protection Paladin", icon: Shield, color: "text-blue-400", description: "Guardian of wealth through insurance strategies", abilities: ["IUL Architecture", "Premium Financing", "Risk Mitigation"] };
  if (max === estateCalcs && estateCalcs > 0) return { name: "Dynasty Architect", icon: Crown, color: "text-purple-400", description: "Builder of multi-generational wealth empires", abilities: ["Trust Engineering", "Estate Optimization", "Legacy Planning"] };
  if (max === retirementCalcs && retirementCalcs > 0) return { name: "Retirement Sage", icon: Star, color: "text-emerald-400", description: "Master of income planning and financial independence", abilities: ["Income Stacking", "Withdrawal Sequencing", "FIRE Planning"] };
  return { name: "Apprentice", icon: Target, color: "text-slate-400", description: "Beginning the journey to financial mastery", abilities: ["Basic Analysis", "Client Discovery", "Learning"] };
}

function buildAchievements(calcResults: Record<string, any>, clientData: any, entries: any[]): Achievement[] {
  const calcCount = Object.keys(calcResults).length;
  
  return [
    { id: "first-calc", name: "First Blood", description: "Run your first calculator", icon: Target, color: "text-emerald-400", unlocked: calcCount >= 1, progress: Math.min(1, calcCount), maxProgress: 1, xpReward: 50, rarity: "common" },
    { id: "five-calcs", name: "Pentakill", description: "Complete 5 different calculators", icon: Flame, color: "text-orange-400", unlocked: calcCount >= 5, progress: Math.min(5, calcCount), maxProgress: 5, xpReward: 200, rarity: "rare" },
    { id: "ten-calcs", name: "Decathlon", description: "Complete 10 different calculators", icon: Medal, color: "text-amber-400", unlocked: calcCount >= 10, progress: Math.min(10, calcCount), maxProgress: 10, xpReward: 500, rarity: "epic" },
    { id: "twenty-calcs", name: "Grand Master", description: "Complete 20 different calculators", icon: Crown, color: "text-yellow-400", unlocked: calcCount >= 20, progress: Math.min(20, calcCount), maxProgress: 20, xpReward: 1000, rarity: "legendary" },
    { id: "tax-master", name: "Tax Ninja", description: "Complete 5 tax-related calculators", icon: Zap, color: "text-violet-400", unlocked: Object.keys(calcResults).filter(k => k.includes("tax") || k.includes("roth")).length >= 5, progress: Math.min(5, Object.keys(calcResults).filter(k => k.includes("tax") || k.includes("roth")).length), maxProgress: 5, xpReward: 300, rarity: "rare" },
    { id: "insurance-pro", name: "Shield Bearer", description: "Complete 3 insurance calculators", icon: Shield, color: "text-blue-400", unlocked: Object.keys(calcResults).filter(k => k.includes("insurance") || k.includes("iul")).length >= 3, progress: Math.min(3, Object.keys(calcResults).filter(k => k.includes("insurance") || k.includes("iul")).length), maxProgress: 3, xpReward: 250, rarity: "rare" },
    { id: "estate-planner", name: "Dynasty Builder", description: "Complete 3 estate planning tools", icon: Gem, color: "text-purple-400", unlocked: Object.keys(calcResults).filter(k => k.includes("estate") || k.includes("trust") || k.includes("ilit")).length >= 3, progress: Math.min(3, Object.keys(calcResults).filter(k => k.includes("estate") || k.includes("trust") || k.includes("ilit")).length), maxProgress: 3, xpReward: 300, rarity: "epic" },
    { id: "client-loaded", name: "Know Thy Client", description: "Load a complete client profile", icon: Heart, color: "text-rose-400", unlocked: !!clientData?.clientName && !!clientData?.annualIncome, progress: clientData?.clientName ? 1 : 0, maxProgress: 1, xpReward: 100, rarity: "common" },
    { id: "data-bus-active", name: "Neural Network", description: "Generate 10+ data bus entries", icon: Sparkles, color: "text-cyan-400", unlocked: entries.length >= 10, progress: Math.min(10, entries.length), maxProgress: 10, xpReward: 200, rarity: "rare" },
    { id: "combo-master", name: "Combo Breaker", description: "Use a COMBO strategy page", icon: Swords, color: "text-red-400", unlocked: !!calcResults["tax-free-wealth-combos"] || !!calcResults["cascading-optimizer"], progress: (calcResults["tax-free-wealth-combos"] ? 1 : 0) + (calcResults["cascading-optimizer"] ? 1 : 0), maxProgress: 2, xpReward: 400, rarity: "epic" },
    { id: "full-plan", name: "The Singularity", description: "Complete a full financial plan with 25+ calculators", icon: Star, color: "text-yellow-400", unlocked: calcCount >= 25, progress: Math.min(25, calcCount), maxProgress: 25, xpReward: 2000, rarity: "legendary" },
  ];
}

/* ═══════════════════════════════════════════════════════════════════
   DAILY BRIEFING (S63)
   ═══════════════════════════════════════════════════════════════════ */
function getDailyBriefing(clientData: any, calcResults: Record<string, any>): { greeting: string; insights: string[]; todayFocus: string } {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const calcCount = Object.keys(calcResults).length;
  
  const insights: string[] = [];
  if (calcCount === 0) insights.push("Start your day by running a Financial Health Score for your next client meeting");
  if (calcCount > 0 && calcCount < 5) insights.push(`You have ${calcCount} calculator results — aim for 5+ to unlock the Pentakill achievement`);
  if (calcCount >= 5) insights.push(`Strong progress with ${calcCount} analyses — consider running the Advisory Summary to package your findings`);
  
  const month = new Date().getMonth();
  if (month >= 9) insights.push("Year-end tax planning window is open — prioritize Roth conversions and tax-loss harvesting");
  if (month === 0) insights.push("New year, new contribution limits — review 401(k), IRA, and HSA maximums");
  if (month >= 3 && month <= 4) insights.push("Tax season — great time to review client tax returns for planning opportunities");

  const todayFocus = calcCount < 3 ? "Build your analysis foundation — run 3 core calculators" :
    calcCount < 10 ? "Deepen your analysis — explore tax optimization and insurance strategies" :
    "You're an expert — focus on COMBO strategies and advanced planning";

  return { greeting, insights, todayFocus };
}

/* ═══════════════════════════════════════════════════════════════════
   GAMIFICATION PANEL
   ═══════════════════════════════════════════════════════════════════ */
export function GamificationPanel({ compact = false }: { compact?: boolean }) {
  const { data: clientData } = useClientData();
  const { results: calcResults } = useCalcResults();
  const { entries } = useUnifiedDataBus();

  const advisorClass = useMemo(() => getAdvisorClass(calcResults), [calcResults]);
  const achievements = useMemo(() => buildAchievements(calcResults, clientData, entries), [calcResults, clientData, entries]);
  const briefing = useMemo(() => getDailyBriefing(clientData, calcResults), [clientData, calcResults]);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalXP = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.xpReward, 0);
  const level = Math.floor(totalXP / 500) + 1;

  const rarityColors: Record<string, string> = {
    common: "border-slate-500/30 text-slate-400",
    rare: "border-blue-500/30 text-blue-400",
    epic: "border-violet-500/30 text-violet-400",
    legendary: "border-yellow-500/30 text-yellow-400",
  };

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-white">Advisor RPG</span>
          <Badge variant="outline" className="text-[9px] text-amber-400 border-amber-500/30">Lv.{level}</Badge>
        </div>

        {/* Class */}
        <div className="flex items-center gap-2">
          {(() => { const Icon = advisorClass.icon; return <Icon className={`w-4 h-4 ${advisorClass.color}`} />; })()}
          <span className={`text-xs font-medium ${advisorClass.color}`}>{advisorClass.name}</span>
        </div>

        {/* XP bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-400">{totalXP} XP</span>
            <span className="text-amber-400">{unlockedCount}/{achievements.length} achievements</span>
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full" style={{ width: `${Math.min(100, (totalXP % 500) / 5)}%` }} />
          </div>
        </div>

        {/* Next achievement */}
        {achievements.filter(a => !a.unlocked)[0] && (() => {
          const next = achievements.filter(a => !a.unlocked)[0];
          const Icon = next.icon;
          return (
            <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/30 text-[11px]">
              <div className="flex items-center gap-1">
                <Icon className={`w-3 h-3 ${next.color}`} />
                <span className="text-white font-medium">{next.name}</span>
                <Badge variant="outline" className={`text-[8px] ${rarityColors[next.rarity]}`}>{next.rarity}</Badge>
              </div>
              <p className="text-slate-400 mt-0.5">{next.progress}/{next.maxProgress} — {next.description}</p>
            </div>
          );
        })()}

        {/* Daily briefing snippet */}
        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px]">
          <p className="text-amber-300 font-medium">☀️ {briefing.greeting}</p>
          <p className="text-slate-400 mt-0.5">{briefing.todayFocus}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Daily Briefing (S63) */}
      <Card className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 border-amber-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sun className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-bold text-white">{briefing.greeting}, Advisor</span>
          </div>
          <p className="text-xs text-amber-200/80 mb-2">{briefing.todayFocus}</p>
          {briefing.insights.map((insight, i) => (
            <p key={i} className="text-[11px] text-slate-300 flex items-start gap-1 mb-1">
              <Coffee className="w-3 h-3 mt-0.5 text-amber-400 flex-shrink-0" /> {insight}
            </p>
          ))}
        </CardContent>
      </Card>

      {/* Advisor Class (S39) */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {(() => { const Icon = advisorClass.icon; return <Icon className={`w-8 h-8 ${advisorClass.color}`} />; })()}
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${advisorClass.color}`}>{advisorClass.name}</span>
                <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/30">Level {level}</Badge>
              </div>
              <p className="text-xs text-slate-400">{advisorClass.description}</p>
              <div className="flex gap-1 mt-1">
                {advisorClass.abilities.map(a => (
                  <Badge key={a} variant="outline" className="text-[9px] text-slate-300 border-slate-600/50">{a}</Badge>
                ))}
              </div>
            </div>
          </div>
          {/* XP bar */}
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">{totalXP} XP total</span>
              <span className="text-amber-400">Next level: {(level * 500) - totalXP} XP needed</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (totalXP % 500) / 5)}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements (S41) */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" /> Achievements ({unlockedCount}/{achievements.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-1.5">
          {achievements.map(a => {
            const Icon = a.icon;
            return (
              <div key={a.id} className={`flex items-center gap-2 p-2 rounded-lg ${a.unlocked ? "bg-slate-700/30" : "bg-slate-800/30 opacity-60"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${a.unlocked ? "bg-amber-500/20" : "bg-slate-700/50"}`}>
                  {a.unlocked ? <Icon className={`w-4 h-4 ${a.color}`} /> : <Lock className="w-4 h-4 text-slate-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium text-white">{a.name}</span>
                    <Badge variant="outline" className={`text-[8px] ${rarityColors[a.rarity]}`}>{a.rarity}</Badge>
                    <span className="text-[9px] text-amber-400">+{a.xpReward} XP</span>
                  </div>
                  <p className="text-[10px] text-slate-400">{a.description}</p>
                  {!a.unlocked && (
                    <div className="mt-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-500 rounded-full" style={{ width: `${(a.progress / a.maxProgress) * 100}%` }} />
                    </div>
                  )}
                </div>
                {a.unlocked && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

export default GamificationPanel;

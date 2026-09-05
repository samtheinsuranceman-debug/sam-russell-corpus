/**
 * AdvisorCommandScore — Real-time aggregated score that shows how "in command"
 * the advisor is of their client's financial picture.  Combines:
 *   1. Financial Health Score (from CalcResults)
 *   2. AI Brain Confidence (from AIBrainContext)
 *   3. Data Completeness (from ClientDataContext)
 *   4. Platform Engagement (from experience system)
 *   5. Data Bus Coverage (from UnifiedDataBus)
 *
 * Appears on every COMBO page via <ComboPageWrapper>.
 */
import { useMemo } from "react";
import { useClientData } from "@/contexts/ClientDataContext";
import { useCalcResults } from "@/components/CalculatorIntegration";
import { useUnifiedDataBus } from "@/contexts/UnifiedDataBusContext";
import { useAIBrain } from "@/contexts/AIBrainContext";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Shield, TrendingUp } from "lucide-react";

interface ScoreDimension {
  label: string;
  score: number;
  color: string;
}

export function AdvisorCommandScore({ className = "" }: { className?: string }) {
  const { data: client } = useClientData();
  const { results, getFinancialHealthScore } = useCalcResults();
  const { getAllEntries, getTotalDataPoints } = useUnifiedDataBus();
  const { state: aiState } = useAIBrain();
  const { isAuthenticated } = useAuth();
  const { data: profile } = trpc.experience.getProfile.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const dimensions = useMemo<ScoreDimension[]>(() => {
    // 1. Financial Health (0-100)
    const healthScore = getFinancialHealthScore();
    const financialHealth = healthScore.overall;

    // 2. Data Completeness (0-100)
    let dataCompleteness = 0;
    if (client) {
      const fields = [
        client.annualIncome, client.age, client.state, client.homeValue,
        client.mortgageBalance, client.iraBalance, client.k401Balance,
        client.lifeInsuranceCv, client.retirementAge, client.riskTolerance,
        client.cashSavings, client.taxableInvestments, client.monthlyExpenses,
      ];
      const filled = fields.filter((f) => f && f !== 0).length;
      dataCompleteness = Math.round((filled / fields.length) * 100);
    }

    // 3. Calculator Coverage (0-100) — how many calculators have been run
    const calculatorsUsed = Object.keys(results).length;
    const calcCoverage = Math.min(100, Math.round((calculatorsUsed / 15) * 100)); // 15 = good coverage

    // 4. AI Brain Confidence (0-100)
    const aiConfidence = aiState.financialHealthScore || Math.min(100, (aiState.recommendations?.length || 0) * 15 + 30);

    // 5. Engagement Level (0-100)
    let engagement = 0;
    if (profile) {
      const levelScore = Math.min(50, profile.level * 5); // up to 50 from level
      const streakScore = Math.min(30, profile.currentStreak * 3); // up to 30 from streak
      const checkInScore = Math.min(20, (profile.totalCheckIns || 0) * 2); // up to 20 from check-ins
      engagement = levelScore + streakScore + checkInScore;
    }

    return [
      { label: "Financial Health", score: financialHealth, color: "text-emerald-400" },
      { label: "Data Completeness", score: dataCompleteness, color: "text-blue-400" },
      { label: "Calculator Coverage", score: calcCoverage, color: "text-purple-400" },
      { label: "AI Confidence", score: aiConfidence, color: "text-amber-400" },
      { label: "Engagement", score: engagement, color: "text-pink-400" },
    ];
  }, [client, results, aiState, profile, getFinancialHealthScore]);

  const commandScore = useMemo(() => {
    if (dimensions.length === 0) return 0;
    const weights = [0.30, 0.20, 0.20, 0.15, 0.15];
    return Math.round(dimensions.reduce((sum, d, i) => sum + d.score * weights[i], 0));
  }, [dimensions]);

  const commandGrade = useMemo(() => {
    if (commandScore >= 90) return { grade: "S", label: "Supreme Commander", color: "text-yellow-400" };
    if (commandScore >= 75) return { grade: "A", label: "Full Command", color: "text-emerald-400" };
    if (commandScore >= 60) return { grade: "B", label: "Strong Position", color: "text-blue-400" };
    if (commandScore >= 40) return { grade: "C", label: "Building", color: "text-amber-400" };
    return { grade: "D", label: "Getting Started", color: "text-red-400" };
  }, [commandScore]);

  return (
    <div className={`bg-slate-900/60 border border-white/10 rounded-xl overflow-hidden ${className}`}>
      {/* Header with big score */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
        <div className="relative">
          <Shield className="w-10 h-10 text-white/10" />
          <span className={`absolute inset-0 flex items-center justify-center text-sm font-black ${commandGrade.color}`}>
            {commandGrade.grade}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">Command Score</span>
            <span className={`text-lg font-black ${commandGrade.color}`}>{commandScore}</span>
          </div>
          <div className="text-[10px] text-white/40">{commandGrade.label}</div>
        </div>
        <TrendingUp className="w-4 h-4 text-white/20" />
      </div>

      {/* Dimension bars */}
      <div className="p-3 space-y-2">
        {dimensions.map((d) => (
          <div key={d.label}>
            <div className="flex justify-between text-[10px] mb-0.5">
              <span className="text-white/50">{d.label}</span>
              <span className={`font-bold ${d.color}`}>{d.score}</span>
            </div>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  d.score >= 70 ? "bg-emerald-500" : d.score >= 40 ? "bg-amber-500" : "bg-red-500"
                }`}
                style={{ width: `${d.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdvisorCommandScore;

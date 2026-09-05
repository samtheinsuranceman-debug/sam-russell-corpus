/**
 * NextBestAction — AI-driven recommendation panel that suggests the next
 * most impactful calculator or feature to run, based on:
 *   • Missing data gaps in the client profile
 *   • Calculators not yet run (from CalcResults)
 *   • AI Brain recommendations
 *   • Cross-feature relationships from the Data Bus
 *
 * Appears on every COMBO page via <ComboPageWrapper>.
 */
import { useMemo } from "react";
import { useLocation } from "wouter";
import { useClientData } from "@/contexts/ClientDataContext";
import { useCalcResults, CALCULATOR_RELATIONSHIPS } from "@/components/CalculatorIntegration";
import { useUnifiedDataBus } from "@/contexts/UnifiedDataBusContext";
import { useAIBrain } from "@/contexts/AIBrainContext";
import { ArrowRight, Lightbulb, Sparkles, Target, TrendingUp } from "lucide-react";

interface ActionItem {
  title: string;
  description: string;
  route: string;
  priority: "high" | "medium" | "low";
  reason: string;
}

const PRIORITY_COLORS = {
  high: "border-red-500/30 bg-red-500/5",
  medium: "border-amber-500/30 bg-amber-500/5",
  low: "border-blue-500/30 bg-blue-500/5",
};

const PRIORITY_BADGES = {
  high: "bg-red-500/20 text-red-400",
  medium: "bg-amber-500/20 text-amber-400",
  low: "bg-blue-500/20 text-blue-400",
};

export function NextBestAction({ pageContext = "", maxActions = 3 }: { pageContext?: string; maxActions?: number }) {
  const { data: client } = useClientData();
  const { results, getFinancialHealthScore } = useCalcResults();
  const { getCategoryData } = useUnifiedDataBus();
  const { state: aiState } = useAIBrain();
  const [, navigate] = useLocation();

  const actions = useMemo<ActionItem[]>(() => {
    const suggestions: ActionItem[] = [];
    const completedCalcs = new Set(Object.keys(results));
    const healthScore = getFinancialHealthScore();

    // 1. Check for critical data gaps
    if (client) {
      if (client.lifeInsuranceCv === 0 && client.lifeInsuranceDb === 0 && !completedCalcs.has("life-insurance")) {
        suggestions.push({
          title: "Run Life Insurance Analysis",
          description: "Client has no life insurance data — critical gap for estate & risk planning",
          route: "/portal/calculators/life-insurance",
          priority: "high",
          reason: "Missing protection data",
        });
      }

      if (client.iraBalance === 0 && client.k401Balance === 0 && !completedCalcs.has("retirement-income")) {
        suggestions.push({
          title: "Run Retirement Income Planner",
          description: "No retirement accounts detected — essential for long-term planning",
          route: "/portal/calculators/retirement-income",
          priority: "high",
          reason: "No retirement data",
        });
      }

      if (healthScore.categories.taxEfficiency < 40 && !completedCalcs.has("tax-combo")) {
        suggestions.push({
          title: "Run Tax Combo Optimizer",
          description: `Tax efficiency score is ${Math.round(healthScore.categories.taxEfficiency)}% — significant savings possible`,
          route: "/portal/calculators/tax-combo",
          priority: "high",
          reason: "Low tax efficiency",
        });
      }

      if (healthScore.categories.riskProtection < 50 && !completedCalcs.has("disability-gap")) {
        suggestions.push({
          title: "Run Disability Gap Analysis",
          description: `Risk protection score is ${Math.round(healthScore.categories.riskProtection)}% — coverage gaps detected`,
          route: "/portal/calculators/disability-gap",
          priority: "medium",
          reason: "Coverage gaps",
        });
      }

      if (healthScore.categories.estatePreparedness < 40 && !completedCalcs.has("estate-planning")) {
        suggestions.push({
          title: "Run Estate Planning Calculator",
          description: `Estate preparedness at ${Math.round(healthScore.categories.estatePreparedness)}% — needs attention`,
          route: "/portal/calculators/estate-planning",
          priority: "medium",
          reason: "Estate planning gap",
        });
      }
    }

    // 2. Check AI Brain recommendations
    if (aiState.recommendations && aiState.recommendations.length > 0) {
      aiState.recommendations.slice(0, 2).forEach((rec: any) => {
        if (rec.route && !suggestions.some((s) => s.route === rec.route)) {
          suggestions.push({
            title: rec.title || "AI Recommendation",
            description: rec.description || rec.reason || "AI Brain suggests this next action",
            route: rec.route,
            priority: "medium",
            reason: "AI Brain suggestion",
          });
        }
      });
    }

    // 3. Cross-feature suggestions based on current page context
    if (pageContext) {
      const related = (CALCULATOR_RELATIONSHIPS as Record<string, string[]>)[pageContext] || [];
      related.forEach((slug) => {
        if (!completedCalcs.has(slug) && !suggestions.some((s) => s.route.includes(slug))) {
          suggestions.push({
            title: `Run ${slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`,
            description: `Related to current feature — running this will enhance cross-tool intelligence`,
            route: `/portal/calculators/${slug}`,
            priority: "low",
            reason: "Cross-feature link",
          });
        }
      });
    }

    // 4. General suggestions if nothing specific
    if (suggestions.length === 0) {
      if (!completedCalcs.has("financial-dna")) {
        suggestions.push({
          title: "Complete Financial DNA Profile",
          description: "Personalize every feature with your financial personality analysis",
          route: "/portal/financial-dna",
          priority: "low",
          reason: "Personalization",
        });
      }
      if (completedCalcs.size < 3) {
        suggestions.push({
          title: "Explore AI Strategy Lab",
          description: "Chain multiple calculators together for comprehensive planning",
          route: "/portal/strategy-lab",
          priority: "low",
          reason: "Discover features",
        });
      }
    }

    // Sort by priority
    const order = { high: 0, medium: 1, low: 2 };
    return suggestions.sort((a, b) => order[a.priority] - order[b.priority]).slice(0, maxActions);
  }, [client, results, aiState.recommendations, pageContext, getFinancialHealthScore, getCategoryData, maxActions]);

  if (actions.length === 0) return null;

  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-400" />
        <h3 className="text-xs font-bold text-white">Next Best Actions</h3>
        <span className="ml-auto text-[10px] text-white/30">{actions.length} suggestions</span>
      </div>
      <div className="p-2 space-y-2">
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={() => navigate(action.route)}
            className={`w-full text-left border rounded-lg p-3 transition-all hover:scale-[1.01] hover:border-white/20 ${PRIORITY_COLORS[action.priority]}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${PRIORITY_BADGES[action.priority]}`}>
                    {action.priority}
                  </span>
                  <span className="text-[10px] text-white/30">{action.reason}</span>
                </div>
                <div className="text-xs font-semibold text-white truncate">{action.title}</div>
                <div className="text-[10px] text-white/40 mt-0.5 line-clamp-2">{action.description}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-white/30 shrink-0 mt-1" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default NextBestAction;

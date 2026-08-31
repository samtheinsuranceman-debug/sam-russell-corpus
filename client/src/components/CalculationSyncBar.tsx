// @ts-nocheck
import { useState } from "react";
import { useStrategy, STRATEGY_LABELS, STRATEGY_PATHS, type StrategyType } from "@/contexts/StrategyContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Activity,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Layers,
  RefreshCw,
  Trash2,
  GitCompare,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const fmt = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

const STRATEGY_ICONS: Partial<Record<StrategyType, string>> = {
  "mortgage-killer": "🏠",
  "iul-projection": "📊",
  "roth-conversion": "🔄",
  "myga-waterfall": "🏦",
  "tax-waterfall": "📉",
  "retirement-income": "🏖️",
  "premium-financing": "💎",
  "real-estate-mogul": "🏢",
  "inflation-analysis": "📈",
  "social-security": "🛡️",
  "annuity-income": "💰",
  "estate-tax": "🏛️",
  "fia-collateral": "🔗",
  "hot-income": "🔥",
  "time-machine": "⏰",
  "lifetime-income": "♾️",
  "black-mirror": "🪞",
  "endgame": "🎯",
  "dynamic-tax": "📊",
  "advisor-income": "💼",
};

/**
 * CalculationSyncBar — Floating bar showing all active calculator results
 * and enabling cross-calculator data push.
 *
 * Appears at the top of calculator pages when any strategies have published results.
 */
export function CalculationSyncBar() {
  const { activeStrategies, activeCount, results, clearAll, clearResult } = useStrategy();
  const [, navigate] = useLocation();
  const [expanded, setExpanded] = useState(false);

  if (activeCount === 0) return null;

  return (
    <div className="mb-4 rounded-xl border border-zinc-700/50 bg-gradient-to-r from-zinc-900/80 via-zinc-900/60 to-zinc-900/80 backdrop-blur-sm overflow-hidden">
      {/* Compact header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-emerald-500/30">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            Active Calculations
          </span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/40 text-emerald-400 bg-emerald-500/10">
            {activeCount} synced
          </Badge>
          {/* Mini strategy icons */}
          <div className="flex items-center gap-1 ml-1">
            {activeStrategies.slice(0, 6).map(st => (
              <TooltipProvider key={st}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs cursor-default">{STRATEGY_ICONS[st] ?? "📋"}</span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {STRATEGY_LABELS[st]}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
            {activeCount > 6 && (
              <span className="text-[10px] text-zinc-500">+{activeCount - 6}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-[10px] text-zinc-500 hover:text-cyan-400 px-2"
            onClick={(e) => {
              e.stopPropagation();
              navigate("/portal/comparison");
            }}
          >
            <GitCompare className="w-3 h-3 mr-1" />
            Compare
          </Button>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-zinc-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          )}
        </div>
      </button>

      {/* Expanded: show all active strategies */}
      {expanded && (
        <div className="px-4 pb-3 border-t border-zinc-700/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-3">
            {activeStrategies.map(st => {
              const data = results[st];
              const icon = STRATEGY_ICONS[st] ?? "📋";
              const path = STRATEGY_PATHS[st];

              // Extract a key metric from the data
              let keyMetric = "";
              if (data) {
                if ("interestSaved" in data) keyMetric = `Interest Saved: ${fmt(data.interestSaved)}`;
                else if ("cashValue" in data) keyMetric = `Cash Value: ${fmt(data.cashValue)}`;
                else if ("totalConverted" in data) keyMetric = `Converted: ${fmt(data.totalConverted)}`;
                else if ("netWealth" in data) keyMetric = `Net Wealth: ${fmt(data.netWealth)}`;
                else if ("totalTaxSaved" in data) keyMetric = `Tax Saved: ${fmt(data.totalTaxSaved)}`;
                else if ("annualIncome" in data) keyMetric = `Annual Income: ${fmt(data.annualIncome)}`;
                else if ("netBenefit" in data) keyMetric = `Net Benefit: ${fmt(data.netBenefit)}`;
                else if ("totalEquity" in data) keyMetric = `Total Equity: ${fmt(data.totalEquity)}`;
                else if ("monthlyBenefitFRA" in data) keyMetric = `FRA Benefit: ${fmt(data.monthlyBenefitFRA * 12)}/yr`;
                else if ("guaranteedAnnualIncome" in data) keyMetric = `Guaranteed: ${fmt(data.guaranteedAnnualIncome)}/yr`;
                else if ("estateTaxOwed" in data) keyMetric = `Tax Owed: ${fmt(data.estateTaxOwed)}`;
                else if ("totalAnnualIncome" in data) keyMetric = `HOT Income: ${fmt(data.totalAnnualIncome)}/yr`;
              }

              return (
                <div
                  key={st}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-800/40 border border-zinc-700/30 hover:border-zinc-600/50 transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm">{icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-zinc-200 truncate">
                        {STRATEGY_LABELS[st]}
                      </div>
                      {keyMetric && (
                        <div className="text-[10px] text-emerald-400/80 truncate">{keyMetric}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0 text-zinc-500 hover:text-blue-400"
                      onClick={() => navigate(path)}
                    >
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0 text-zinc-500 hover:text-red-400"
                      onClick={() => {
                        clearResult(st);
                        toast.info(`Cleared ${STRATEGY_LABELS[st]} results`);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-700/20">
            <span className="text-[10px] text-zinc-500">
              {activeCount} strategies synced — data flows automatically between tools
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-[10px] border-zinc-700/50 hover:border-cyan-500/40 hover:text-cyan-400 px-2"
                onClick={() => navigate("/portal/comparison")}
              >
                <Layers className="w-3 h-3 mr-1" />
                Side-by-Side Compare
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-[10px] text-zinc-500 hover:text-red-400 px-2"
                onClick={() => {
                  clearAll();
                  toast.info("All calculation results cleared");
                }}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear All
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

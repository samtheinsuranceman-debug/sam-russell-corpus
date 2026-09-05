import { useState, useEffect } from "react";
import { TAB_SUMMARIES, type TabSummary } from "@shared/advisorySummaryData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Lightbulb,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Target,
  Shield,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  X,
  BookOpen,
} from "lucide-react";

/**
 * PageInsights — A collapsible insights panel that can be added to any portal page.
 * Shows: use case, hidden advantages, alternative uses, risk factors, accuracy info,
 * and a "What This Means" plain-English summary.
 *
 * Usage: <PageInsights pageId="mortgage-killer" />
 * Or:    <PageInsights pageId="mortgage-killer" activeSubTab="Fact Finder" />
 */

interface PageInsightsProps {
  pageId: string;
  activeSubTab?: string;
  className?: string;
}

function getRatingColor(score: number): string {
  if (score >= 9) return "text-emerald-400";
  if (score >= 8) return "text-cyan-400";
  if (score >= 7) return "text-amber-400";
  return "text-red-400";
}

function getRatingBg(score: number): string {
  if (score >= 9) return "bg-emerald-500/20 border-emerald-500/30";
  if (score >= 8) return "bg-cyan-500/20 border-cyan-500/30";
  if (score >= 7) return "bg-amber-500/20 border-amber-500/30";
  return "bg-red-500/20 border-red-500/30";
}

function getAverage(r: { functionality: number; efficiency: number; predictability: number; complexity: number; comprehension: number; importance: number }): number {
  const vals = [r.functionality, r.efficiency, r.predictability, r.complexity, r.comprehension, r.importance];
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function RatingBadge({ label, score }: { label: string; score: number }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getRatingBg(score)}`}>
      <span className="text-xs text-zinc-400 uppercase tracking-wide">{label}</span>
      <span className={`text-sm font-bold ${getRatingColor(score)}`}>{score.toFixed(1)}</span>
    </div>
  );
}

export function PageInsights({ pageId, activeSubTab, className = "" }: PageInsightsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const tab = TAB_SUMMARIES.find((t) => t.id === pageId);
  if (!tab) return null;

  const ratings = tab.ratings;
  const avg = getAverage(ratings);

  // Find active sub-tab ratings if applicable
  const subTab = activeSubTab && tab.subTabs
    ? tab.subTabs.find((s) => s.name === activeSubTab)
    : null;

  const activeRatings = subTab ? subTab.ratings : ratings;
  const activeAvg = getAverage(activeRatings);

  return (
    <>
      {/* Floating insights toggle button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all hover:scale-105 ${className}`}
        >
          <Lightbulb className="w-4 h-4" />
          <span className="text-sm font-medium">Page Insights</span>
          <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${getRatingBg(activeAvg)} ${getRatingColor(activeAvg)}`}>
            {activeAvg.toFixed(1)}
          </span>
        </button>
      )}

      {/* Insights panel */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 z-50 w-full max-w-lg max-h-[80vh] overflow-y-auto bg-zinc-900/95 backdrop-blur-xl border-l border-t border-zinc-700/50 rounded-tl-2xl shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-3 bg-zinc-900/95 backdrop-blur-xl border-b border-zinc-700/50">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-purple-500/20">
                <Lightbulb className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">{tab.name}</h3>
                {subTab && (
                  <p className="text-xs text-zinc-400">Tab: {subTab.name}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowGuide(!showGuide)}
                className="p-1.5 rounded-lg hover:bg-zinc-700/50 text-zinc-400 hover:text-white transition-colors"
                title="Quick Guide"
              >
                <BookOpen className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-zinc-700/50 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Quick Guide overlay */}
            {showGuide && (
              <Card className="bg-indigo-500/10 border-indigo-500/30">
                <CardContent className="p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-indigo-300 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" /> Quick Guide
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">{tab.useCase}</p>
                  <div className="pt-2 border-t border-indigo-500/20">
                    <p className="text-xs text-zinc-400">
                      <strong className="text-zinc-300">Best for:</strong>{" "}
                      {tab.clientTypes.join(", ") || "All clients"}
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">
                      <strong className="text-zinc-300">Time needed:</strong>{" "}
                      ~{tab.estimatedTimeMinutes} minutes
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">
                      <strong className="text-zinc-300">Experience:</strong>{" "}
                      {tab.experienceLevel.join(", ")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Ratings grid */}
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Performance Ratings {subTab ? `— ${subTab.name}` : ""}
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <RatingBadge label="Function" score={activeRatings.functionality} />
                <RatingBadge label="Efficiency" score={activeRatings.efficiency} />
                <RatingBadge label="Predict" score={activeRatings.predictability} />
                <RatingBadge label="Complex" score={activeRatings.complexity} />
                <RatingBadge label="Compreh" score={activeRatings.comprehension} />
                <RatingBadge label="Import" score={activeRatings.importance} />
              </div>
              <div className={`mt-2 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border ${getRatingBg(activeAvg)}`}>
                <Sparkles className={`w-4 h-4 ${getRatingColor(activeAvg)}`} />
                <span className="text-xs text-zinc-400 uppercase tracking-wide">Overall Score</span>
                <span className={`text-lg font-bold ${getRatingColor(activeAvg)}`}>{activeAvg.toFixed(1)}</span>
              </div>
            </div>

            {/* What This Tool Does */}
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" /> What Problem It Solves
              </h4>
              <p className="text-xs text-zinc-300 leading-relaxed">{tab.uniqueProblem}</p>
            </div>

            {/* Hidden Advantages */}
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Hidden Advantages
              </h4>
              <ul className="space-y-1.5">
                {tab.hiddenAdvantages.map((adv, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                    <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    {adv}
                  </li>
                ))}
              </ul>
            </div>

            {/* Alternative Uses */}
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" /> Other Uses
              </h4>
              <ul className="space-y-1.5">
                {tab.alternativeUses.map((use, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                    <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                    {use}
                  </li>
                ))}
              </ul>
            </div>

            {/* Accuracy & Reliability */}
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-400" /> Real-Life Accuracy
              </h4>
              <p className="text-xs text-zinc-300 leading-relaxed">{tab.realLifeAccuracy}</p>
            </div>

            {/* Risk Factors */}
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Risk Factors
              </h4>
              <ul className="space-y-1.5">
                {tab.riskFactors.map((risk, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                    <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    {risk}
                  </li>
                ))}
              </ul>
            </div>

            {/* What Makes It Different */}
            <div className="pt-3 border-t border-zinc-700/50">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                What Makes It Different
              </h4>
              <p className="text-xs text-zinc-300 leading-relaxed italic">{tab.differentiation}</p>
            </div>

            {/* Sub-tabs overview if available */}
            {tab.subTabs && tab.subTabs.length > 0 && (
              <div className="pt-3 border-t border-zinc-700/50">
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Sub-Tab Scores
                </h4>
                <div className="space-y-1.5">
                  {tab.subTabs.map((st) => {
                    const stAvg = getAverage(st.ratings);
                    return (
                      <div
                        key={st.name}
                        className={`flex items-center justify-between px-3 py-1.5 rounded-lg border ${
                          activeSubTab === st.name
                            ? "bg-purple-500/10 border-purple-500/30"
                            : "bg-zinc-800/50 border-zinc-700/30"
                        }`}
                      >
                        <div>
                          <span className="text-xs font-medium text-zinc-300">{st.name}</span>
                          <p className="text-[10px] text-zinc-500">{st.description}</p>
                        </div>
                        <span className={`text-sm font-bold ${getRatingColor(stAvg)}`}>
                          {stAvg.toFixed(1)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

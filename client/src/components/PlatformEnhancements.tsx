/**
 * PlatformEnhancements — Single drop-in wrapper that adds all 5 platform improvements to any page.
 *
 * Usage:
 *   <PlatformEnhancements
 *     pageTitle="Tax Waterfall Analyzer"
 *     strategy="tax-waterfall"           // optional — enables cross-tool flow
 *     monteCarloConfig={{ years: 30, initialValue: 500000, preset: "balanced" }}
 *     reportSections={[{ id: "s", title: "Summary", items: [{ label: "X", value: "$1" }] }]}
 *     reportBullets={["Key insight here."]}
 *   />
 *
 * Features injected:
 *   #1 Cross-Tool Integration  — StrategyFlowBanner (if strategy prop given)
 *   #2 Monte Carlo             — Toggle button + chart panel
 *   #3 Guided Wizard           — Expert / Guided mode toggle
 *   #4 Real-Time Data Feeds    — Inline treasury + CPI ticker
 *   #5 Report Generation       — One-click PDF export button
 */

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity } from "lucide-react";
import { trpc } from "@/lib/trpc";

import { StrategyFlowBanner } from "@/components/StrategyFlowBanner";
import type { StrategyType } from "@/contexts/StrategyContext";
import { MonteCarloChart } from "@/components/MonteCarloChart";
import { runMonteCarlo, MONTE_CARLO_PRESETS } from "@shared/monteCarloEngine";
import type { MonteCarloResult } from "@shared/monteCarloEngine";
import { GuidedModeToggle } from "@/components/GuidedWizard";
import { DataFeedInline } from "@/components/DataFeedBadge";
import { ReportGenerator, type ReportSection } from "@/components/ReportGenerator";

// ── Props ───────────────────────────────────────────────────────────────────

type PresetKey = keyof typeof MONTE_CARLO_PRESETS;

interface MonteCarloConfig {
  years: number;
  initialValue: number;
  preset: PresetKey;
  annualContribution?: number;
}

export interface PlatformEnhancementsProps {
  /** Page title for reports and headers */
  pageTitle: string;
  /** Strategy type — enables cross-tool StrategyFlowBanner when set */
  strategy?: StrategyType;
  /** Monte Carlo config — enables MC toggle + chart when set */
  monteCarloConfig?: MonteCarloConfig;
  /** Report sections for PDF export */
  reportSections?: ReportSection[];
  /** Report bullet points */
  reportBullets?: string[];
  /** Callback when guided mode changes */
  onGuidedModeChange?: (guided: boolean) => void;
  /** Current guided mode state (controlled) */
  guidedMode?: boolean;
  /** Hide specific features */
  hide?: {
    strategyBanner?: boolean;
    monteCarlo?: boolean;
    guidedWizard?: boolean;
    dataFeeds?: boolean;
    reportGen?: boolean;
  };
}

// ── Component ───────────────────────────────────────────────────────────────

export function PlatformEnhancements({
  pageTitle,
  strategy,
  monteCarloConfig,
  reportSections = [],
  reportBullets = [],
  onGuidedModeChange,
  guidedMode: controlledGuided,
  hide = {},
}: PlatformEnhancementsProps) {
  // #2 Monte Carlo state
  const [showMC, setShowMC] = useState(false);
  const mcResult: MonteCarloResult | null = useMemo(() => {
    if (!monteCarloConfig || !showMC) return null;
    return runMonteCarlo({
      simulations: 1000,
      years: monteCarloConfig.years,
      initialValue: monteCarloConfig.initialValue,
      ...MONTE_CARLO_PRESETS[monteCarloConfig.preset],
      annualContribution: monteCarloConfig.annualContribution ?? 0,
    });
  }, [showMC, monteCarloConfig?.years, monteCarloConfig?.initialValue, monteCarloConfig?.preset]);

  // #3 Guided wizard (uncontrolled fallback)
  const [internalGuided, setInternalGuided] = useState(false);
  const isGuided = controlledGuided ?? internalGuided;
  const toggleGuided = useCallback(
    (v: boolean) => {
      setInternalGuided(v);
      onGuidedModeChange?.(v);
    },
    [onGuidedModeChange],
  );

  // #4 Data feeds
  const feedQuery = trpc.dataFeeds.snapshot.useQuery(undefined, { staleTime: 5 * 60_000 });
  const feedData = feedQuery.data;

  // #5 Report
  const getSections = useCallback(() => reportSections, [reportSections]);
  const getBullets = useCallback(() => reportBullets, [reportBullets]);

  return (
    <>
      {/* ── Toolbar row ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {!hide.guidedWizard && (
          <GuidedModeToggle isGuided={isGuided} onToggle={toggleGuided} />
        )}
        {!hide.monteCarlo && monteCarloConfig && (
          <Button variant="outline" size="sm" onClick={() => setShowMC((v) => !v)}>
            <Activity className="w-4 h-4 mr-1" />
            {showMC ? "Hide" : "Show"} Monte Carlo
          </Button>
        )}
        {!hide.reportGen && reportSections.length > 0 && (
          <ReportGenerator
            pageTitle={pageTitle}
            getSections={getSections}
            getBullets={getBullets}
            simple
          />
        )}
      </div>

      {/* ── #1 Cross-Tool Strategy Banner ────────────────────────────── */}
      {!hide.strategyBanner && strategy && (
        <StrategyFlowBanner currentStrategy={strategy} />
      )}

      {/* ── #4 Live Data Feed Ticker ─────────────────────────────────── */}
      {!hide.dataFeeds && feedData && (
        <DataFeedInline
          feeds={[
            ...(feedData.treasuryRates?.slice(0, 3).map((t: any) => ({
              name: t.term ?? t.name ?? "Treasury",
              value: `${(t.yield ?? t.value)?.toFixed(2)}%`,
              source: (t.source ?? "static") as "live" | "cached" | "static",
            })) ?? []),
            ...((feedData as any).cpi
              ? [
                  {
                    name: "CPI",
                    value: `${((feedData as any).cpi.annualRate ?? (feedData as any).cpi.value)?.toFixed(1)}%`,
                    source: ((feedData as any).cpi.source ?? "static") as "live" | "cached" | "static",
                  },
                ]
              : []),
            ...(feedData.commodities?.slice(0, 2).map((c: any) => ({
              name: c.name ?? "Commodity",
              value: `$${c.value?.toFixed(2)}`,
              source: (c.source ?? "static") as "live" | "cached" | "static",
            })) ?? []),
          ]}
        />
      )}

      {/* ── #2 Monte Carlo Chart Panel ───────────────────────────────── */}
      {showMC && mcResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" /> Monte Carlo — {monteCarloConfig!.years}-Year Projection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MonteCarloChart result={mcResult} title={`${pageTitle} Projected Outcomes`} />
          </CardContent>
        </Card>
      )}
    </>
  );
}

export default PlatformEnhancements;

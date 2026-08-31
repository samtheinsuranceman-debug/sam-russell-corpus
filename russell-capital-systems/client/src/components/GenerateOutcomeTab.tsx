// @ts-nocheck
import { useState, useMemo } from "react";
import { useStrategy, STRATEGY_LABELS, type StrategyType, type StrategyResult } from "@/contexts/StrategyContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play,
  Save,
  Share2,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Shield,
  BarChart3,
  ArrowUpRight,
  Zap,
  GitCompare,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const fmt = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
};

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

interface OutcomeMetric {
  label: string;
  value: number | string;
  format?: "currency" | "percent" | "years" | "number" | "text";
  color?: string;
  icon?: typeof TrendingUp;
  highlight?: boolean;
}

interface GenerateOutcomeTabProps {
  /** The strategy type for this calculator */
  strategyType: StrategyType;
  /** Whether the calculator has been run (results are available) */
  hasResults: boolean;
  /** The result data to publish to StrategyContext */
  resultData: any;
  /** Key outcome metrics to display */
  metrics: OutcomeMetric[];
  /** 20-year projection data (optional — will auto-generate from StrategyContext if not provided) */
  projectionData?: Array<{ year: number; [key: string]: number }>;
  /** Projection chart lines configuration */
  projectionLines?: Array<{ dataKey: string; name: string; color: string; dashed?: boolean }>;
  /** Callback to re-run the calculation */
  onRecalculate?: () => void;
  /** Additional content to render in the outcome tab */
  children?: React.ReactNode;
  /** Custom class name */
  className?: string;
}

/**
 * GenerateOutcomeTab — Universal outcome tab for all calculator pages.
 *
 * Features:
 * 1. Displays key outcome metrics in a grid
 * 2. Shows 20-year projection chart
 * 3. Publishes results to StrategyContext for cross-calculator sync
 * 4. Saves results to DB via complianceAudit.logCalculation
 * 5. Enables adding to comparison dashboard
 */
export function GenerateOutcomeTab({
  strategyType,
  hasResults,
  resultData,
  metrics,
  projectionData,
  projectionLines,
  onRecalculate,
  children,
  className = "",
}: GenerateOutcomeTabProps) {
  const { publishResult, hasResult, setComparisonSlot, comparisonSlots, activeCount } = useStrategy();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [published, setPublished] = useState(false);
  const [saved, setSaved] = useState(false);
  const [addedToComparison, setAddedToComparison] = useState(false);

  const logMutation = trpc.complianceAudit?.logCalculation?.useMutation?.() ?? null;

  const isPublished = hasResult(strategyType);

  // Find next available comparison slot
  const nextSlot = useMemo(() => {
    return comparisonSlots.find(s => s.strategyType === null);
  }, [comparisonSlots]);

  const handlePublish = () => {
    if (!resultData) return;
    publishResult({ type: strategyType, data: resultData } as StrategyResult);
    setPublished(true);
    toast.success(`${STRATEGY_LABELS[strategyType]} results synced`, {
      description: "Data is now available to other calculators.",
    });
  };

  const handleSave = () => {
    if (!resultData || !logMutation) return;
    try {
      logMutation.mutate({
        calculatorType: strategyType,
        inputSummary: JSON.stringify(resultData).slice(0, 500),
        outputSummary: metrics.map(m => `${m.label}: ${m.value}`).join("; ").slice(0, 500),
        complianceFlags: [],
      });
      setSaved(true);
      toast.success("Calculation saved to audit log");
    } catch {
      toast.error("Failed to save calculation");
    }
  };

  const handleAddToComparison = () => {
    if (!resultData || !nextSlot) {
      toast.error("All 5 comparison slots are full. Clear one first.");
      return;
    }
    // Publish first if not already
    if (!isPublished) {
      publishResult({ type: strategyType, data: resultData } as StrategyResult);
    }
    setComparisonSlot(nextSlot.id, strategyType);
    setAddedToComparison(true);
    toast.success(`Added to Comparison Slot ${nextSlot.id + 1}`, {
      description: "Go to Comparison Dashboard to view side-by-side.",
      action: {
        label: "Compare Now",
        onClick: () => navigate("/portal/comparison"),
      },
    });
  };

  if (!hasResults) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card className="bg-zinc-900/60 border-zinc-700/50">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-700 flex items-center justify-center">
              <Play className="w-7 h-7 text-zinc-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-300 mb-2">Run Calculator First</h3>
            <p className="text-sm text-zinc-500 max-w-md mx-auto">
              Enter your inputs and run the calculation to generate outcomes.
              Results will be available for cross-calculator sync and comparison.
            </p>
            {onRecalculate && (
              <Button
                onClick={onRecalculate}
                className="mt-4 bg-emerald-600 hover:bg-emerald-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Generate Outcome
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={handlePublish}
          disabled={published || isPublished}
          className={`text-xs ${
            published || isPublished
              ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/30"
              : "bg-emerald-600 hover:bg-emerald-700 text-white"
          }`}
          variant={published || isPublished ? "outline" : "default"}
        >
          {published || isPublished ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              Synced
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 mr-1.5" />
              Sync to Other Tools
            </>
          )}
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={handleSave}
          disabled={saved}
          className="text-xs border-zinc-700/50 hover:border-blue-500/40"
        >
          {saved ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
              Saved
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5 mr-1.5" />
              Save to Audit Log
            </>
          )}
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={handleAddToComparison}
          disabled={addedToComparison || !nextSlot}
          className="text-xs border-zinc-700/50 hover:border-purple-500/40"
        >
          {addedToComparison ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
              In Comparison
            </>
          ) : (
            <>
              <GitCompare className="w-3.5 h-3.5 mr-1.5" />
              Add to Comparison
            </>
          )}
        </Button>

        {onRecalculate && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setPublished(false);
              setSaved(false);
              setAddedToComparison(false);
              onRecalculate();
            }}
            className="text-xs text-zinc-500 hover:text-zinc-300"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Recalculate
          </Button>
        )}

        {activeCount > 0 && (
          <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-emerald-500/30 text-emerald-400 bg-emerald-500/10 ml-auto">
            <Zap className="w-3 h-3 mr-1" />
            {activeCount} tools synced
          </Badge>
        )}
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {metrics.map((metric, i) => {
          const Icon = metric.icon ?? DollarSign;
          const displayValue = typeof metric.value === "number"
            ? metric.format === "percent"
              ? pct(metric.value)
              : metric.format === "years"
                ? `${metric.value} yrs`
                : metric.format === "number"
                  ? metric.value.toLocaleString()
                  : fmt(metric.value)
            : metric.value;

          return (
            <Card
              key={i}
              className={`bg-zinc-900/60 border-zinc-700/50 ${
                metric.highlight ? "ring-1 ring-emerald-500/30" : ""
              }`}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className={`w-3.5 h-3.5 ${metric.color ?? "text-zinc-400"}`} />
                  <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider truncate">
                    {metric.label}
                  </span>
                </div>
                <div className={`text-lg font-bold ${metric.highlight ? "text-emerald-400" : "text-zinc-100"}`}>
                  {displayValue}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 20-Year Projection Chart */}
      {projectionData && projectionData.length > 0 && projectionLines && projectionLines.length > 0 && (
        <Card className="bg-zinc-900/60 border-zinc-700/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              20-Year Projection
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Year-over-year outcome trajectory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionData}>
                  <defs>
                    {projectionLines.map((line, i) => (
                      <linearGradient key={line.dataKey} id={`grad-${line.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={line.color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={line.color} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="year" stroke="#71717a" tick={{ fontSize: 10 }} />
                  <YAxis
                    stroke="#71717a"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => fmt(v)}
                  />
                  <RTooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid #3f3f46",
                      borderRadius: "8px",
                      fontSize: "11px",
                    }}
                    formatter={(value: number) => [fmt(value), ""]}
                    labelFormatter={(label) => `Year ${label}`}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  {projectionLines.map((line) => (
                    <Area
                      key={line.dataKey}
                      type="monotone"
                      dataKey={line.dataKey}
                      name={line.name}
                      stroke={line.color}
                      fill={`url(#grad-${line.dataKey})`}
                      strokeWidth={line.dashed ? 1.5 : 2}
                      strokeDasharray={line.dashed ? "5 5" : undefined}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom children content */}
      {children}

      {/* Navigation to comparison */}
      {addedToComparison && (
        <Card className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border-purple-500/30">
          <CardContent className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-zinc-300">
                Added to comparison dashboard — run other calculators to compare side-by-side.
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
              onClick={() => navigate("/portal/comparison")}
            >
              <ArrowUpRight className="w-3 h-3 mr-1" />
              Open Comparison
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

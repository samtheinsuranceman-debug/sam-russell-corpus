/**
 * TimeMachineToggle — Reusable component for embedding the Time Machine Method
 * into any IUL calculator. Provides:
 * - Toggle switch between "Standard" and "Time Machine" mode
 * - Index option selector (pick 1-3 historical indices)
 * - Historical start year picker
 * - Loan arbitrage display (5% stated vs +0.5% positive arbitrage)
 * - Side-by-side comparison overlay
 */
import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Clock, Zap, Info, TrendingUp, Shield, ChevronDown, ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

// Import the shared engine types
import type { IllustrationYear, PremiumSchedule } from "@shared/timeMachineEngine";
import {
  ALL_INDEX_OPTIONS,
  CARRIERS,
  getPopularIndexOptions,
  generateTimeMachineOverlay,
} from "@shared/timeMachineEngine";

interface TimeMachineToggleProps {
  /** Whether Time Machine mode is active */
  enabled: boolean;
  /** Callback when toggle changes */
  onToggle: (enabled: boolean) => void;
  /** Selected index option IDs */
  selectedOptions: string[];
  /** Callback when index selection changes */
  onOptionsChange: (options: string[]) => void;
  /** Historical start year */
  startYear: number;
  /** Callback when start year changes */
  onStartYearChange: (year: number) => void;
  /** Whether to show the compact version */
  compact?: boolean;
}

export function TimeMachineToggle({
  enabled,
  onToggle,
  selectedOptions,
  onOptionsChange,
  startYear,
  onStartYearChange,
  compact = false,
}: TimeMachineToggleProps) {
  const [showDetails, setShowDetails] = useState(false);
  const popularOptions = useMemo(() => getPopularIndexOptions(), []);

  const toggleOption = useCallback((optionId: string) => {
    if (selectedOptions.includes(optionId)) {
      onOptionsChange(selectedOptions.filter(id => id !== optionId));
    } else if (selectedOptions.length < 3) {
      onOptionsChange([...selectedOptions, optionId]);
    } else {
      toast.error("Maximum 3 index options allowed");
    }
  }, [selectedOptions, onOptionsChange]);

  const carrierGroups = useMemo(() => {
    const groups: Record<string, typeof popularOptions> = {};
    for (const opt of popularOptions) {
      if (!groups[opt.carrier]) groups[opt.carrier] = [];
      groups[opt.carrier].push(opt);
    }
    return groups;
  }, [popularOptions]);

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border bg-gradient-to-r from-amber-950/20 to-emerald-950/20 border-amber-800/30">
        <Clock className="w-5 h-5 text-amber-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-amber-200">Time Machine Mode</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-3.5 h-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Overlay 30-year historical index performance on top of the standard illustration to see what this policy would have produced using actual market data.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {enabled && selectedOptions.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {selectedOptions.length} index{selectedOptions.length > 1 ? "es" : ""} selected · Starting {startYear}
            </p>
          )}
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          className="data-[state=checked]:bg-amber-500"
        />
      </div>
    );
  }

  return (
    <Card className={`border-amber-800/30 ${enabled ? "bg-gradient-to-br from-amber-950/20 to-emerald-950/10" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <span className="text-amber-200">Time Machine Method</span>
            <Badge variant="outline" className="text-xs border-amber-600 text-amber-400">
              Historical
            </Badge>
          </CardTitle>
          <Switch
            checked={enabled}
            onCheckedChange={onToggle}
            className="data-[state=checked]:bg-amber-500"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Toggle to overlay 30-year historical index performance alongside the standard AG 49 illustration.
          See what this exact premium schedule would have produced using actual market data.
        </p>
      </CardHeader>

      {enabled && (
        <CardContent className="space-y-4 pt-0">
          {/* Historical Start Year */}
          <div>
            <Label className="text-xs text-muted-foreground">Historical Start Year</Label>
            <Select value={String(startYear)} onValueChange={v => onStartYearChange(Number(v))}>
              <SelectTrigger className="mt-1 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 2025 - 1994 + 1 }, (_, i) => 1994 + i).map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Index Option Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs text-muted-foreground">
                Select Index Options (up to 3)
              </Label>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                {showDetails ? "Hide" : "Show"} details
                {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            <div className="space-y-3">
              {Object.entries(carrierGroups).map(([carrierId, options]) => {
                const carrier = CARRIERS.find(c => c.id === carrierId);
                return (
                  <div key={carrierId}>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {carrier?.name ?? carrierId}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {options.map(opt => {
                        const isSelected = selectedOptions.includes(opt.id);
                        return (
                          <TooltipProvider key={opt.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => toggleOption(opt.id)}
                                  className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
                                    isSelected
                                      ? "bg-amber-600/30 border-amber-500 text-amber-200"
                                      : "bg-card border-border text-muted-foreground hover:border-amber-700 hover:text-amber-300"
                                  }`}
                                >
                                  {isSelected && <Zap className="w-3 h-3 inline mr-1" />}
                                  {opt.label.split(": ")[1] || opt.label}
                                </button>
                              </TooltipTrigger>
                              {showDetails && (
                                <TooltipContent className="max-w-xs">
                                  <p className="font-medium">{opt.label}</p>
                                  <p className="text-xs mt-1">{opt.description}</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedOptions.length === 0 && (
              <p className="text-xs text-amber-500 mt-2">
                <Info className="w-3 h-3 inline mr-1" />
                Select at least one index option to see historical performance
              </p>
            )}
          </div>

          {/* Loan Arbitrage Info */}
          <div className="p-3 rounded-lg bg-card/50 border border-border/50">
            <p className="text-xs font-medium text-muted-foreground mb-1">Loan Arbitrage Comparison</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-red-400">Stated Rate:</span>
                <span className="ml-1 font-mono">5.00%</span>
              </div>
              <div>
                <span className="text-emerald-400">Actual Spread:</span>
                <span className="ml-1 font-mono">0.50%</span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              The stated loan rate is 5%, but the cash value backing the loan continues to earn index credits.
              The net cost to the policyholder is only the spread — a positive arbitrage of +0.5%.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

/**
 * Hook for managing Time Machine state in any calculator.
 * Returns state + handlers ready to pass to TimeMachineToggle.
 */
export function useTimeMachine(defaults?: {
  enabled?: boolean;
  options?: string[];
  startYear?: number;
}) {
  const [enabled, setEnabled] = useState(defaults?.enabled ?? false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    defaults?.options ?? ["am-sp500-ptp"]
  );
  const [startYear, setStartYear] = useState(defaults?.startYear ?? 1994);

  const toggleProps = {
    enabled,
    onToggle: setEnabled,
    selectedOptions,
    onOptionsChange: setSelectedOptions,
    startYear,
    onStartYearChange: setStartYear,
  };

  return {
    enabled,
    selectedOptions,
    startYear,
    setEnabled,
    setSelectedOptions,
    setStartYear,
    toggleProps,
    /** Generate overlay rows for the current settings */
    generateOverlay: (
      premiumSchedule: PremiumSchedule,
      currentAge: number,
      projectionYears: number,
      loanStartYear?: number,
      annualLoanAmount?: number,
    ) => generateTimeMachineOverlay(
      selectedOptions,
      startYear,
      premiumSchedule,
      currentAge,
      projectionYears,
      0.05,
      0.005,
      loanStartYear,
      annualLoanAmount,
    ),
  };
}

export default TimeMachineToggle;

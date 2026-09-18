/**
 * IbbotsonYearSelector — Reusable component that provides a start-year
 * selector for Ibbotson-based IUL projections.
 *
 * Displays a compact control with:
 *   • Start year dropdown (1929–2025, default 2005)
 *   • Quick info about the Ibbotson model
 *   • Link to the full Ibbotson Charts page
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Info } from "lucide-react";
import { Link } from "wouter";
import { IBBOTSON_START_YEAR, IBBOTSON_END_YEAR, IBBOTSON_SHORT_DISCLAIMER } from "@shared/ibbotsonModel";

interface IbbotsonYearSelectorProps {
  startYear: number;
  onStartYearChange: (year: number) => void;
  capRate?: number;
  floorRate?: number;
  /** Show compact version (just the selector) */
  compact?: boolean;
  /** Additional CSS class */
  className?: string;
}

// Generate decade-based year options for quick selection
const QUICK_YEARS = [1929, 1940, 1950, 1960, 1970, 1980, 1990, 2000, 2005, 2010, 2015, 2020];

export function IbbotsonYearSelector({
  startYear,
  onStartYearChange,
  capRate = 0.075,
  floorRate = 0.0,
  compact = false,
  className = "",
}: IbbotsonYearSelectorProps) {
  const allYears: number[] = [];
  for (let y = IBBOTSON_START_YEAR; y <= IBBOTSON_END_YEAR; y++) allYears.push(y);

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <BarChart3 className="h-3.5 w-3.5 text-amber-400 shrink-0" />
        <span className="text-xs text-muted-foreground whitespace-nowrap">Ibbotson Start:</span>
        <Select value={String(startYear)} onValueChange={(v) => onStartYearChange(Number(v))}>
          <SelectTrigger className="h-7 w-[80px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {allYears.map((y) => (
              <SelectItem key={y} value={String(y)} className="text-xs">
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-semibold text-amber-400">Ibbotson Historical Model</span>
          <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">
            {(capRate * 100).toFixed(1)}% Cap / {(floorRate * 100).toFixed(0)}% Floor
          </Badge>
        </div>
        <Link href="/portal/ibbotson-charts" className="text-[10px] text-amber-400/70 hover:text-amber-400 underline">
          View Full Charts →
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">Start Year:</span>
        <div className="flex gap-1 flex-wrap">
          {QUICK_YEARS.map((y) => (
            <button
              key={y}
              onClick={() => onStartYearChange(y)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                startYear === y
                  ? "bg-amber-500 text-black font-bold"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
        <Select value={String(startYear)} onValueChange={(v) => onStartYearChange(Number(v))}>
          <SelectTrigger className="h-7 w-[80px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {allYears.map((y) => (
              <SelectItem key={y} value={String(y)} className="text-xs">
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-start gap-1.5">
        <Info className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          {IBBOTSON_SHORT_DISCLAIMER}
        </p>
      </div>
    </div>
  );
}

export default IbbotsonYearSelector;

import { useState } from "react";
import { useStrategy, STRATEGY_LABELS, STRATEGY_PATHS, type StrategyType, type DataFlowLink } from "@/contexts/StrategyContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Link2,
  ChevronDown,
  ChevronUp,
  Zap,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const fmt = (n: number) => `$${n.toLocaleString()}`;

/** Route map for "Use in [Tool]" navigation */
const STRATEGY_ROUTES = STRATEGY_PATHS;

interface StrategyFlowBannerProps {
  /** The current page's strategy type */
  currentStrategy: StrategyType;
  /** Callback when inbound flow data is applied */
  onApplyInbound?: (flowData: Record<string, any>, fromStrategy: StrategyType) => void;
  className?: string;
}

/**
 * StrategyFlowBanner — Shows available cross-tool data flows for the current page.
 *
 * Displays:
 * 1. Inbound flows: data available FROM other tools that ran previously
 * 2. Outbound flows: tools that can USE this tool's results
 * 3. "Apply" buttons for inbound data and "Use in [Tool]" for outbound navigation
 */
export function StrategyFlowBanner({ currentStrategy, onApplyInbound, className = "" }: StrategyFlowBannerProps) {
  const { getInboundFlows, getOutboundFlows, hasResult, results } = useStrategy();
  const [, navigate] = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [appliedFlows, setAppliedFlows] = useState<Set<string>>(new Set());

  const inbound = getInboundFlows(currentStrategy);
  const outbound = getOutboundFlows(currentStrategy).filter((f) => f.to !== currentStrategy);
  const hasCurrentResult = hasResult(currentStrategy);

  // Nothing to show if no connections exist
  if (inbound.length === 0 && outbound.length === 0) return null;

  const handleApply = (flow: typeof inbound[0]) => {
    if (onApplyInbound) {
      onApplyInbound(flow.mappedData, flow.from);
      setAppliedFlows((prev) => new Set(prev).add(`${flow.from}-${flow.to}`));
      toast.success(`Applied data from ${STRATEGY_LABELS[flow.from]}`, {
        description: flow.label,
      });
    }
  };

  const handleNavigate = (to: StrategyType) => {
    const route = STRATEGY_ROUTES[to];
    if (route) {
      navigate(route);
      toast.info(`Navigating to ${STRATEGY_LABELS[to]}`, {
        description: "Strategy data will be available automatically.",
      });
    }
  };

  return (
    <div className={`rounded-xl border border-zinc-700/50 bg-zinc-900/60 backdrop-blur-sm overflow-hidden ${className}`}>
      {/* Compact header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-zinc-800/40 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded-md bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30">
            <Link2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            Cross-Tool Integration
          </span>
          {inbound.length > 0 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/40 text-emerald-400 bg-emerald-500/10">
              {inbound.length} inbound
            </Badge>
          )}
          {hasCurrentResult && outbound.length > 0 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-cyan-500/40 text-cyan-400 bg-cyan-500/10">
              {outbound.length} outbound
            </Badge>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-zinc-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-500" />
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-zinc-700/30">
          {/* Inbound flows — data available from other tools */}
          {inbound.length > 0 && (
            <div className="pt-3">
              <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-emerald-400" />
                Available Data from Other Tools
              </h4>
              <div className="space-y-2">
                {inbound.map((flow) => {
                  const flowKey = `${flow.from}-${flow.to}`;
                  const isApplied = appliedFlows.has(flowKey);
                  return (
                    <div
                      key={flowKey}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-colors ${
                        isApplied
                          ? "bg-emerald-500/10 border-emerald-500/30"
                          : "bg-zinc-800/50 border-zinc-700/30 hover:border-zinc-600/50"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-zinc-200">
                            {STRATEGY_LABELS[flow.from]}
                          </span>
                          <ArrowRight className="w-3 h-3 text-zinc-500 shrink-0" />
                          <span className="text-xs text-emerald-400 font-medium truncate">
                            {flow.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">
                          {flow.description}
                        </p>
                        {/* Show mapped values */}
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {Object.entries(flow.mappedData)
                            .filter(([k]) => k !== "source" && k !== "taxFree" && k !== "guaranteed" && k !== "leveraged")
                            .map(([key, val]) => (
                              <span key={key} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-700/50 text-zinc-300">
                                {key.replace(/([A-Z])/g, " $1").trim()}: {typeof val === "number" ? fmt(Math.round(val as number)) : String(val)}
                              </span>
                            ))}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={isApplied ? "ghost" : "outline"}
                        className={`ml-3 shrink-0 text-xs h-7 ${isApplied ? "text-emerald-400" : ""}`}
                        onClick={() => handleApply(flow)}
                        disabled={isApplied}
                      >
                        {isApplied ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Applied
                          </>
                        ) : (
                          "Apply"
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Outbound flows — tools that can use this tool's results */}
          {outbound.length > 0 && (
            <div className="pt-3">
              <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ArrowUpRight className="w-3 h-3 text-cyan-400" />
                Use Results In
                {!hasCurrentResult && (
                  <span className="text-[10px] text-zinc-500 font-normal normal-case tracking-normal ml-1">
                    (run calculator first)
                  </span>
                )}
              </h4>
              <div className="flex flex-wrap gap-2">
                {outbound.map((flow) => (
                  <Button
                    key={`${flow.from}-${flow.to}`}
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 border-zinc-700/50 hover:border-cyan-500/40 hover:text-cyan-400"
                    disabled={!hasCurrentResult}
                    onClick={() => handleNavigate(flow.to)}
                  >
                    {STRATEGY_LABELS[flow.to]}
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* No data yet message */}
          {inbound.length === 0 && !hasCurrentResult && (
            <div className="pt-3">
              <p className="text-xs text-zinc-500 text-center py-2">
                Run this calculator to enable cross-tool data flows.
                Results will be available to{" "}
                {outbound.map((f) => STRATEGY_LABELS[f.to]).join(", ")}.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

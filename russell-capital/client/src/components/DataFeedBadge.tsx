import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Clock, RefreshCw } from "lucide-react";

interface DataFeedBadgeProps {
  source: "live" | "cached" | "static";
  lastUpdated?: string;
  onRefresh?: () => void;
  className?: string;
}

/**
 * DataFeedBadge — Shows data freshness and source for any live data feed.
 */
export function DataFeedBadge({ source, lastUpdated, onRefresh, className = "" }: DataFeedBadgeProps) {
  const config = {
    live: {
      icon: Wifi,
      label: "Live Data",
      className: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
    },
    cached: {
      icon: Clock,
      label: "Cached",
      className: "border-amber-500/40 text-amber-400 bg-amber-500/10",
    },
    static: {
      icon: WifiOff,
      label: "Static",
      className: "border-zinc-500/40 text-zinc-400 bg-zinc-500/10",
    },
  }[source];

  const Icon = config.icon;

  const timeAgo = lastUpdated ? getTimeAgo(lastUpdated) : null;

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${config.className}`}>
        <Icon className="w-2.5 h-2.5 mr-1" />
        {config.label}
        {timeAgo && <span className="ml-1 opacity-70">({timeAgo})</span>}
      </Badge>
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="p-0.5 rounded hover:bg-zinc-700/50 text-zinc-500 hover:text-zinc-300 transition-colors"
          title="Refresh data"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

function getTimeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ── Compact inline version ───────────────────────────────────────────────────

interface DataFeedInlineProps {
  feeds: Array<{ name: string; value: string | number; source: "live" | "cached" | "static"; change?: number }>;
  className?: string;
}

/**
 * DataFeedInline — Compact row of live data points for embedding in calculators.
 */
export function DataFeedInline({ feeds, className = "" }: DataFeedInlineProps) {
  return (
    <div className={`flex items-center gap-3 px-3 py-1.5 rounded-lg bg-zinc-800/50 border border-zinc-700/30 overflow-x-auto ${className}`}>
      {feeds.map((feed, i) => (
        <div key={feed.name} className="flex items-center gap-1.5 shrink-0">
          {i > 0 && <div className="h-3 w-px bg-zinc-700" />}
          <span className="text-[10px] text-zinc-500 uppercase">{feed.name}</span>
          <span className="text-xs font-medium text-zinc-200">
            {typeof feed.value === "number" ? feed.value.toLocaleString() : feed.value}
          </span>
          {feed.change !== undefined && (
            <span className={`text-[10px] ${feed.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {feed.change >= 0 ? "+" : ""}{feed.change.toFixed(2)}%
            </span>
          )}
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              feed.source === "live" ? "bg-emerald-400" : feed.source === "cached" ? "bg-amber-400" : "bg-zinc-500"
            }`}
            title={feed.source}
          />
        </div>
      ))}
    </div>
  );
}

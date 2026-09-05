import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, RefreshCw, WifiOff, CircleAlert } from "lucide-react";
import { useState } from "react";

interface MarketQuote {
  symbol: string;
  name: string;
  price: number | null;
  change: number | null;
  changePct: number | null;
  lastUpdated: string;
  source: "live" | "cached" | "static" | "unavailable";
  available: boolean;
  message?: string;
}

export default function MarketDataWidget({ compact = false }: { compact?: boolean }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, isLoading, isFetching, isError, error, refetch } = trpc.marketData.quotes.useQuery(
    { _refresh: refreshKey },
    { staleTime: 60_000, refetchInterval: 120_000 }
  );

  const quotes: MarketQuote[] = data ?? [];

  if (isLoading) {
    return (
      <div className={`grid ${compact ? "grid-cols-2 gap-2" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3"}`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-3 pb-2">
              <div className="h-3 bg-muted rounded w-16 mb-2" />
              <div className="h-5 bg-muted rounded w-24 mb-1" />
              <div className="h-3 bg-muted rounded w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-400/25 bg-red-950/30 p-4 text-sm text-red-100">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-2"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /><span>Market data could not be loaded. {error.message}</span></div>
          <button onClick={() => refetch()} className="flex items-center gap-1 text-xs font-medium"><RefreshCw className="h-3 w-3" /> Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Market data · each quote labels its source {quotes[0]?.lastUpdated ? `· Checked ${new Date(quotes[0].lastUpdated).toLocaleTimeString()}` : ""}
        </p>
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          disabled={isFetching}
        >
          <RefreshCw className={`w-3 h-3 ${isFetching ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>
      <div className={`grid ${compact ? "grid-cols-2 gap-2" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3"}`}>
        {quotes.map(q => {
          const isUp = (q.change ?? 0) >= 0;
          return (
            <Card key={q.symbol} className="overflow-hidden">
              <CardContent className="pt-3 pb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase">{q.symbol}</span>
                  {!q.available ? <WifiOff className="w-3 h-3 text-amber-400" /> : isUp ? (
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-400" />
                  )}
                </div>
                {q.available && q.price !== null ? <>
                  <p className="text-lg font-bold tabular-nums">
                    {q.symbol === "BTC" || q.symbol === "GOLD"
                      ? `$${q.price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
                      : `$${q.price.toFixed(2)}`}
                  </p>
                  {q.change !== null && q.changePct !== null && <div className={`text-xs font-medium ${isUp ? "text-emerald-400" : "text-red-400"}`}>
                    {isUp ? "+" : ""}{q.change.toFixed(2)} ({isUp ? "+" : ""}{q.changePct.toFixed(2)}%)
                  </div>}
                </> : <p className="py-1 text-sm font-semibold text-amber-300">Unavailable</p>}
                <p className="text-[10px] text-muted-foreground mt-0.5">{q.name}</p>
                <p className="mt-1 text-[9px] uppercase tracking-wide text-violet-300">{q.source === "static" ? "Reference" : q.source}</p>
                {q.message && <p className="mt-1 text-[9px] leading-3 text-muted-foreground">{q.message}</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

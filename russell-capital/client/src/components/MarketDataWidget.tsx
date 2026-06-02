import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { useState } from "react";

interface MarketQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  lastUpdated: string;
}

export default function MarketDataWidget({ compact = false }: { compact?: boolean }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, isLoading, isFetching } = trpc.marketData.quotes.useQuery(
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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Live Market Data {quotes[0]?.lastUpdated ? `· Updated ${new Date(quotes[0].lastUpdated).toLocaleTimeString()}` : ""}
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
          const isUp = q.change >= 0;
          return (
            <Card key={q.symbol} className="overflow-hidden">
              <CardContent className="pt-3 pb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase">{q.symbol}</span>
                  {isUp ? (
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-400" />
                  )}
                </div>
                <p className="text-lg font-bold tabular-nums">
                  {q.symbol === "BTC" || q.symbol === "GOLD"
                    ? `$${q.price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
                    : q.symbol === "SILVER"
                    ? `$${q.price.toFixed(2)}`
                    : `$${q.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`}
                </p>
                <div className={`text-xs font-medium ${isUp ? "text-emerald-400" : "text-red-400"}`}>
                  {isUp ? "+" : ""}{q.change.toFixed(2)} ({isUp ? "+" : ""}{q.changePct.toFixed(2)}%)
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{q.name}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

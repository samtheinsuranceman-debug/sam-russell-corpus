// @ts-nocheck
import { useState, useMemo, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  DollarSign,
  TrendingUp,
  Calendar,
  Zap,
  Share2,
  Eye,
} from "lucide-react";


function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

interface YearData {
  year: number;
  age: number;
  withStrategy: number;
  withoutStrategy: number;
  taxSaved: number;
  cumulativeTaxSaved: number;
  milestone?: string;
}

export default function TimeLapse() {
  const clientsQuery = trpc.clients.list.useQuery();
  const clients = clientsQuery.data as any[] | undefined;

  const [selectedClient, setSelectedClient] = useState<string>("demo");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentYear, setCurrentYear] = useState(0);
  const [speed, setSpeed] = useState(1);

  const client = clients?.find((c: any) => c.id?.toString() === selectedClient);
  const startAge = Number(client?.age ?? 55);
  const startNw = Number(client?.totalNetWorth ?? 500000);
  const ira = Number(client?.iraBalance ?? 200000);
  const name = client?.name || client?.firstName || "Client";

  const timeline: YearData[] = useMemo(() => {
    const years: YearData[] = [];
    let withStrategy = startNw;
    let withoutStrategy = startNw;
    let cumulativeTax = 0;

    for (let i = 0; i <= 30; i++) {
      const age = startAge + i;
      withStrategy = i === 0 ? startNw : withStrategy * 1.07;
      withoutStrategy = i === 0 ? startNw : withoutStrategy * 1.05;
      const taxThisYear = i > 0 ? (withStrategy - withoutStrategy) * 0.03 : 0;
      cumulativeTax += taxThisYear;

      let milestone: string | undefined;
      if (i === 0) milestone = "Starting Point";
      if (withStrategy >= 1_000_000 && years.length > 0 && years[years.length - 1].withStrategy < 1_000_000) milestone = "🎉 $1M Milestone!";
      if (withStrategy >= 2_000_000 && years.length > 0 && years[years.length - 1].withStrategy < 2_000_000) milestone = "🚀 $2M Milestone!";
      if (withStrategy >= 5_000_000 && years.length > 0 && years[years.length - 1].withStrategy < 5_000_000) milestone = "👑 $5M Milestone!";
      if (age === 65) milestone = "📋 Medicare Eligible";
      if (age === 67) milestone = "🏖️ Full Retirement Age";
      if (age === 70) milestone = "💰 Max Social Security";
      if (age === 72) milestone = "📊 RMDs Begin";

      years.push({ year: i, age, withStrategy, withoutStrategy, taxSaved: taxThisYear, cumulativeTaxSaved: cumulativeTax, milestone });
    }
    return years;
  }, [startAge, startNw]);

  const maxVal = Math.max(...timeline.map(t => t.withStrategy)) * 1.1;
  const currentData = timeline[currentYear] ?? timeline[0];
  const gap = currentData.withStrategy - currentData.withoutStrategy;

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentYear(prev => {
        if (prev >= timeline.length - 1) { setIsPlaying(false); return prev; }
        return prev + 1;
      });
    }, 1000 / speed);
    return () => clearInterval(interval);
  }, [isPlaying, speed, timeline.length]);

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <div className="border-b border-border/30 bg-gradient-to-r from-indigo-500/5 via-background to-purple-500/5">
          <div className="container py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Play className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Time-Lapse Simulator</h1>
                <p className="text-sm text-muted-foreground">Watch wealth grow year by year. The most powerful visual in financial planning.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container py-8 max-w-6xl mx-auto">
          {/* Client Selector */}
          <div className="mb-6">
            <Select value={selectedClient} onValueChange={(v) => { setSelectedClient(v); setCurrentYear(0); setIsPlaying(false); }}>
              <SelectTrigger className="w-64"><SelectValue placeholder="Select client..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="demo">Demo Client ($500K, Age 55)</SelectItem>
                {(clients ?? []).map((c: any) => (
                  <SelectItem key={c.id} value={c.id?.toString()}>
                    {c.name || `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim()} — {fmt(Number(c.totalNetWorth ?? 0))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Current Year Stats */}
          <div className="grid gap-4 sm:grid-cols-4 mb-6">
            <Card className="border-border/30">
              <CardContent className="p-4 text-center">
                <Calendar className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">Year {currentData.year}</p>
                <p className="text-xs text-muted-foreground">Age {currentData.age}</p>
              </CardContent>
            </Card>
            <Card className="border-emerald-500/30">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-emerald-400">{fmt(currentData.withStrategy)}</p>
                <p className="text-xs text-muted-foreground">With Strategy</p>
              </CardContent>
            </Card>
            <Card className="border-red-500/30">
              <CardContent className="p-4 text-center">
                <DollarSign className="w-5 h-5 text-red-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-red-400">{fmt(currentData.withoutStrategy)}</p>
                <p className="text-xs text-muted-foreground">Without Strategy</p>
              </CardContent>
            </Card>
            <Card className="border-amber-500/30">
              <CardContent className="p-4 text-center">
                <Zap className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-amber-400">{fmt(gap)}</p>
                <p className="text-xs text-muted-foreground">Advantage</p>
              </CardContent>
            </Card>
          </div>

          {/* Milestone Banner */}
          {currentData.milestone && (
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-center">
              <p className="text-lg font-bold text-amber-400">{currentData.milestone}</p>
            </div>
          )}

          {/* Chart */}
          <Card className="border-border/30 mb-6">
            <CardContent className="p-6">
              <div className="h-64 flex items-end gap-[2px] relative">
                {timeline.map((t, i) => {
                  const hWith = (t.withStrategy / maxVal) * 100;
                  const hWithout = (t.withoutStrategy / maxVal) * 100;
                  const isActive = i <= currentYear;
                  const isCurrent = i === currentYear;
                  return (
                    <div key={i} className="flex-1 flex gap-[1px] items-end cursor-pointer relative" onClick={() => { setCurrentYear(i); setIsPlaying(false); }}>
                      <div
                        className={`flex-1 rounded-t transition-all duration-300 ${isActive ? "bg-emerald-500" : "bg-emerald-500/15"} ${isCurrent ? "ring-2 ring-emerald-400 ring-offset-1 ring-offset-background" : ""}`}
                        style={{ height: `${isActive ? hWith : 0}%` }}
                      />
                      <div
                        className={`flex-1 rounded-t transition-all duration-300 ${isActive ? "bg-red-500/60" : "bg-red-500/10"}`}
                        style={{ height: `${isActive ? hWithout : 0}%` }}
                      />
                      {isCurrent && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-white font-bold bg-emerald-600 px-1.5 py-0.5 rounded whitespace-nowrap">
                          Yr {t.year}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>Age {startAge}</span>
                <div className="flex gap-4">
                  <span className="flex items-center gap-1"><span className="w-3 h-2 bg-emerald-500 rounded" /> With Strategy</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-2 bg-red-500/60 rounded" /> Without</span>
                </div>
                <span>Age {startAge + 30}</span>
              </div>
            </CardContent>
          </Card>

          {/* Playback Controls */}
          <Card className="border-border/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={() => { setCurrentYear(0); setIsPlaying(false); }}><RotateCcw className="w-4 h-4" /></Button>
                <Button
                  size="sm"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={isPlaying ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentYear(Math.min(timeline.length - 1, currentYear + 1))}><SkipForward className="w-4 h-4" /></Button>

                <div className="flex-1">
                  <Slider
                    value={[currentYear]}
                    onValueChange={([v]) => { setCurrentYear(v); setIsPlaying(false); }}
                    min={0}
                    max={timeline.length - 1}
                    step={1}
                  />
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Speed:</span>
                  {[1, 2, 4].map(s => (
                    <button
                      key={s}
                      onClick={() => setSpeed(s)}
                      className={`px-2 py-1 rounded ${speed === s ? "bg-white/10 text-white" : "hover:bg-white/5"}`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex gap-3 justify-center">
                <Button variant="outline" size="sm" onClick={() => {
                  const text = `Time-Lapse: ${name}'s wealth projection\nWith strategy: ${fmt(currentData.withStrategy)} by age ${currentData.age}\nWithout: ${fmt(currentData.withoutStrategy)}\nAdvantage: ${fmt(gap)}`;
                  navigator.clipboard.writeText(text);
                  toast.success("Copied! +25 XP");
                }}>
                  <Share2 className="w-4 h-4 mr-1" /> Share
                </Button>
                <Button variant="outline" size="sm" onClick={() => toast.success("Presentation mode coming soon!")}>
                  <Eye className="w-4 h-4 mr-1" /> Present
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

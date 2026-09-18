// @ts-nocheck
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Clock, AlertTriangle, ArrowRight, Zap, Calendar, Target, Share2 } from "lucide-react";


function formatDollars(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function compound(principal: number, rate: number, years: number): number {
  return principal * Math.pow(1 + rate, years);
}

export default function TimeMachine() {
  const clientsQuery = trpc.clients.list.useQuery();
  const clients = clientsQuery.data as any[] | undefined;

  const [selectedClient, setSelectedClient] = useState<string>("");
  const [delayYears, setDelayYears] = useState(3);
  const [scenario, setScenario] = useState<"roth" | "iul" | "myga" | "estate">("roth");

  const client = clients?.find((c: any) => c.id?.toString() === selectedClient);
  const nw = Number(client?.totalNetWorth ?? 500000);
  const ira = Number(client?.iraBalance ?? 200000);
  const age = Number(client?.age ?? 55);

  const analysis = useMemo(() => {
    const scenarios = {
      roth: {
        label: "Roth Conversion",
        actNow: {
          taxRate: 0.22,
          growthRate: 0.07,
          taxFreeYears: 30 - (age - 55),
          description: "Convert at today's lower tax bracket",
        },
        wait: {
          taxRate: 0.32,
          growthRate: 0.07,
          description: "Convert later at higher bracket (or never)",
        },
      },
      iul: {
        label: "IUL Policy",
        actNow: {
          taxRate: 0, growthRate: 0.065,
          taxFreeYears: 30,
          description: "Start accumulating tax-free cash value now",
        },
        wait: {
          taxRate: 0, growthRate: 0.065,
          description: "Fewer years of compounding, higher premiums",
        },
      },
      myga: {
        label: "MYGA Lock-In",
        actNow: {
          taxRate: 0, growthRate: 0.052,
          taxFreeYears: 5,
          description: "Lock in today's 5.2% rate",
        },
        wait: {
          taxRate: 0, growthRate: 0.035,
          description: "Rates may drop to 3.5% or lower",
        },
      },
      estate: {
        label: "Estate Planning",
        actNow: {
          taxRate: 0, growthRate: 0.06,
          taxFreeYears: 20,
          description: "Protect assets from estate tax now",
        },
        wait: {
          taxRate: 0.40,
          growthRate: 0.06,
          description: "Estate exposed to 40% tax on death",
        },
      },
    };

    const s = scenarios[scenario];
    const principal = scenario === "roth" ? ira : nw * 0.3;
    const yearsToGrow = Math.max(1, 25 - (age - 55));

    const actNowAfterTax = principal * (1 - s.actNow.taxRate);
    const actNowFinal = compound(actNowAfterTax, s.actNow.growthRate, yearsToGrow);

    const waitPrincipal = compound(principal, 0.04, delayYears); // grows slowly while waiting
    const waitAfterTax = waitPrincipal * (1 - s.wait.taxRate);
    const waitFinal = compound(waitAfterTax, s.wait.growthRate, Math.max(1, yearsToGrow - delayYears));

    const costOfWaiting = actNowFinal - waitFinal;
    const costPerDay = costOfWaiting / (delayYears * 365);
    const costPerMonth = costOfWaiting / (delayYears * 12);

    return {
      scenario: s,
      principal,
      actNowFinal,
      waitFinal,
      costOfWaiting,
      costPerDay,
      costPerMonth,
      yearsToGrow,
    };
  }, [scenario, selectedClient, delayYears, nw, ira, age]);

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <div className="border-b border-border/30 bg-gradient-to-r from-cyan-500/5 via-background to-blue-500/5">
          <div className="container py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">The Time Machine</h1>
                <p className="text-sm text-muted-foreground">See what waiting really costs. Eliminate "I'll think about it."</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container py-8 max-w-5xl mx-auto">
          {/* Controls */}
          <div className="grid gap-4 sm:grid-cols-3 mb-8">
            <Card className="border-border/30">
              <CardContent className="p-4">
                <label className="text-xs text-muted-foreground mb-2 block">Client</label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger><SelectValue placeholder="Select client..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="demo">Demo Client ($500K)</SelectItem>
                    {(clients ?? []).map((c: any) => (
                      <SelectItem key={c.id} value={c.id?.toString()}>
                        {c.name || `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            <Card className="border-border/30">
              <CardContent className="p-4">
                <label className="text-xs text-muted-foreground mb-2 block">Strategy</label>
                <Select value={scenario} onValueChange={(v: any) => setScenario(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="roth">Roth Conversion</SelectItem>
                    <SelectItem value="iul">IUL Policy</SelectItem>
                    <SelectItem value="myga">MYGA Lock-In</SelectItem>
                    <SelectItem value="estate">Estate Planning</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            <Card className="border-border/30">
              <CardContent className="p-4">
                <label className="text-xs text-muted-foreground mb-2 block">Delay: {delayYears} year{delayYears !== 1 ? "s" : ""}</label>
                <Slider value={[delayYears]} onValueChange={([v]) => setDelayYears(v)} min={1} max={10} step={1} className="mt-3" />
              </CardContent>
            </Card>
          </div>

          {/* The Big Cost */}
          <Card className="border-red-500/30 bg-gradient-to-r from-red-500/5 to-orange-500/5 mb-8">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <p className="text-sm text-red-400/80 uppercase tracking-widest mb-2">Cost of Waiting {delayYears} Year{delayYears !== 1 ? "s" : ""}</p>
              <p className="text-[64px] sm:text-[80px] font-black text-red-400 leading-none">{formatDollars(analysis.costOfWaiting)}</p>
              <p className="text-lg text-muted-foreground mt-3">
                That's <span className="text-red-400 font-bold">{formatDollars(analysis.costPerMonth)}/month</span> or <span className="text-red-400 font-bold">{formatDollars(analysis.costPerDay)}/day</span> lost
              </p>
            </CardContent>
          </Card>

          {/* Side by Side Comparison */}
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <Card className="border-emerald-500/30">
              <CardHeader className="bg-emerald-500/5">
                <CardTitle className="text-lg flex items-center gap-2 text-emerald-400">
                  <Zap className="w-5 h-5" /> Act Now
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Starting Amount</p>
                  <p className="text-xl font-bold text-white">{formatDollars(analysis.principal)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Strategy</p>
                  <p className="text-sm text-emerald-400">{analysis.scenario.actNow.description}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Growth Period</p>
                  <p className="text-sm text-white">{analysis.yearsToGrow} years</p>
                </div>
                <div className="pt-4 border-t border-border/30">
                  <p className="text-xs text-muted-foreground">Final Value</p>
                  <p className="text-3xl font-black text-emerald-400">{formatDollars(analysis.actNowFinal)}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-500/30">
              <CardHeader className="bg-red-500/5">
                <CardTitle className="text-lg flex items-center gap-2 text-red-400">
                  <Clock className="w-5 h-5" /> Wait {delayYears} Year{delayYears !== 1 ? "s" : ""}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Starting Amount</p>
                  <p className="text-xl font-bold text-white">{formatDollars(analysis.principal)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Strategy</p>
                  <p className="text-sm text-red-400">{analysis.scenario.wait.description}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Growth Period</p>
                  <p className="text-sm text-white">{Math.max(1, analysis.yearsToGrow - delayYears)} years (lost {delayYears})</p>
                </div>
                <div className="pt-4 border-t border-border/30">
                  <p className="text-xs text-muted-foreground">Final Value</p>
                  <p className="text-3xl font-black text-red-400">{formatDollars(analysis.waitFinal)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timeline Visualization */}
          <Card className="border-border/30 mb-8">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-400" /> Timeline Projection</CardTitle></CardHeader>
            <CardContent>
              <div className="h-48 flex items-end gap-1">
                {Array.from({ length: Math.min(25, analysis.yearsToGrow) }, (_, i) => {
                  const year = i + 1;
                  const actNow = compound(analysis.principal * (1 - analysis.scenario.actNow.taxRate), analysis.scenario.actNow.growthRate, year);
                  const wait = year <= delayYears ? analysis.principal : compound(analysis.principal * (1 - analysis.scenario.wait.taxRate), analysis.scenario.wait.growthRate, year - delayYears);
                  const maxVal = analysis.actNowFinal * 1.1;
                  const actH = (actNow / maxVal) * 100;
                  const waitH = (wait / maxVal) * 100;
                  return (
                    <div key={i} className="flex-1 flex gap-0.5 items-end" title={`Year ${year}`}>
                      <div className="flex-1 bg-emerald-500/60 rounded-t" style={{ height: `${actH}%` }} />
                      <div className="flex-1 bg-red-500/40 rounded-t" style={{ height: `${waitH}%` }} />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>Year 1</span>
                <div className="flex gap-4">
                  <span className="flex items-center gap-1"><span className="w-3 h-2 bg-emerald-500/60 rounded" /> Act Now</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-2 bg-red-500/40 rounded" /> Wait</span>
                </div>
                <span>Year {Math.min(25, analysis.yearsToGrow)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Closing Statement */}
          <Card className="border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-orange-500/5">
            <CardContent className="p-6 text-center">
              <Target className="w-8 h-8 text-amber-400 mx-auto mb-3" />
              <p className="text-lg font-bold text-white mb-2">Every Day You Wait Costs {formatDollars(analysis.costPerDay)}</p>
              <p className="text-muted-foreground mb-4">That's not a projection. That's money leaving the table right now.</p>
              <div className="flex gap-3 justify-center">
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => toast.success("Schedule sent! +50 XP")}>
                  Schedule Meeting <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
                <Button variant="outline" onClick={() => { navigator.clipboard.writeText(`The cost of waiting ${delayYears} years on a ${analysis.scenario.label}: ${formatDollars(analysis.costOfWaiting)}. That's ${formatDollars(analysis.costPerDay)} per day.`); toast.success("Copied!"); }}>
                  <Share2 className="w-4 h-4 mr-1.5" /> Share
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

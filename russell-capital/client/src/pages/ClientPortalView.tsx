import { trpc } from "@/lib/trpc";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User, FileText, Brain, MessageSquare, Lock, ExternalLink,
  Calendar, DollarSign, PieChart, Clock, MapPin, Video, Phone, Users,
  TrendingUp, Shield, ChevronDown, ChevronUp, BarChart3, Home,
  Target, Wallet, Activity,
} from "lucide-react";
import { useState, useMemo } from "react";

const CATEGORY_LABELS: Record<string, string> = {
  TAX_RETURN: "Tax Return",
  ESTATE_PLAN: "Estate Plan",
  INSURANCE_POLICY: "Insurance Policy",
  INVESTMENT_STATEMENT: "Investment Statement",
  TRUST_DOCUMENT: "Trust Document",
  LEGAL_AGREEMENT: "Legal Agreement",
  FINANCIAL_PLAN: "Financial Plan",
  OTHER: "Other",
};

const MEETING_TYPE_ICONS: Record<string, typeof Video> = {
  VIDEO: Video,
  PHONE: Phone,
  IN_PERSON: Users,
  OTHER: Calendar,
};

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

/* ── Saved Strategy Detail Component ── */
function SavedStrategiesSection({ strategies, primaryColor, accentColor }: {
  strategies: any[]; primaryColor: string; accentColor: string;
}) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fmtFull = (n: number) => `$${Math.round(n).toLocaleString()}`;
  const fmt = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M`
    : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K`
    : `$${Math.round(n).toLocaleString()}`;

  return (
    <div className="space-y-4">
      {strategies.map((ss: any) => {
        const summary = ss.summaryJson as any;
        const inputs = ss.inputsJson as any;
        const isExpanded = expandedId === ss.id;
        return (
          <Card key={ss.id} className="border-border/50">
            <CardContent className="pt-4">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : ss.id)}
              >
                <div>
                  <p className="font-medium text-sm">{ss.strategyName || "Roth Conversion Strategy"}</p>
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(ss.createdAt).toLocaleDateString()}
                    {inputs?.annualConversion && ` · $${Number(inputs.annualConversion).toLocaleString()}/yr conversion`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {summary?.totalTaxSavings && (
                    <Badge variant="outline" className="text-xs" style={{ borderColor: primaryColor, color: primaryColor }}>
                      {fmt(summary.totalTaxSavings)} tax savings
                    </Badge>
                  )}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
              {isExpanded && summary && (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {summary.year10CashValue && (
                      <div className="p-3 rounded-lg bg-muted/30 text-center">
                        <p className="text-[10px] text-muted-foreground">Year 10 Cash Value</p>
                        <p className="font-bold text-sm" style={{ color: primaryColor }}>{fmt(summary.year10CashValue)}</p>
                      </div>
                    )}
                    {summary.year20CashValue && (
                      <div className="p-3 rounded-lg bg-muted/30 text-center">
                        <p className="text-[10px] text-muted-foreground">Year 20 Cash Value</p>
                        <p className="font-bold text-sm" style={{ color: accentColor }}>{fmt(summary.year20CashValue)}</p>
                      </div>
                    )}
                    {summary.deathBenefit && (
                      <div className="p-3 rounded-lg bg-muted/30 text-center">
                        <p className="text-[10px] text-muted-foreground">Death Benefit</p>
                        <p className="font-bold text-sm">{fmt(summary.deathBenefit)}</p>
                      </div>
                    )}
                    {summary.totalTaxSavings && (
                      <div className="p-3 rounded-lg bg-muted/30 text-center">
                        <p className="text-[10px] text-muted-foreground">Total Tax Savings</p>
                        <p className="font-bold text-sm text-green-500">{fmt(summary.totalTaxSavings)}</p>
                      </div>
                    )}
                  </div>
                  {summary.iulProjection && summary.iulProjection.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border/30">
                            <th className="text-left py-1.5 px-2">Year</th>
                            <th className="text-right py-1.5 px-2">Premium</th>
                            <th className="text-right py-1.5 px-2">Cash Value</th>
                            <th className="text-right py-1.5 px-2">Death Benefit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.iulProjection.filter((_: any, i: number) => i % 5 === 0 || i === summary.iulProjection.length - 1).map((row: any) => (
                            <tr key={row.year} className="border-b border-border/10">
                              <td className="py-1 px-2">{row.year}</td>
                              <td className="py-1 px-2 text-right">{fmtFull(row.premium)}</td>
                              <td className="py-1 px-2 text-right" style={{ color: primaryColor }}>{fmtFull(row.netCashValue)}</td>
                              <td className="py-1 px-2 text-right">{fmtFull(row.deathBenefit)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <MonteCarloSummary iulProjection={summary.iulProjection ?? []} primaryColor={primaryColor} />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/* ── Monte Carlo Summary for Client Portal ── */
function MonteCarloSummary({ iulProjection, primaryColor }: { iulProjection: any[]; primaryColor: string }) {
  const mcData = useMemo(() => {
    if (!iulProjection || iulProjection.length === 0) return null;
    const SIMS = 300;
    const VOL = 0.15;
    const AVG_RETURN = 0.10;
    const LOAD_FEE = 0.06;
    const COI_RATE = 0.05;
    const years = iulProjection.length;
    const allFinals: number[] = [];

    for (let s = 0; s < SIMS; s++) {
      let av = 0;
      for (let y = 0; y < years; y++) {
        const premium = iulProjection[y].premium;
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        const randomReturn = Math.max(0, AVG_RETURN + VOL * z);
        av += premium * (1 - LOAD_FEE);
        av += av * randomReturn;
        av -= av * COI_RATE;
        av = Math.max(0, av);
      }
      const loanBal = iulProjection[years - 1]?.cumulativeLoanBalance ?? 0;
      allFinals.push(Math.max(0, av - loanBal));
    }
    allFinals.sort((a, b) => a - b);
    const pct = (p: number) => Math.round(allFinals[Math.floor(allFinals.length * p)]);
    return {
      p10: pct(0.10), p25: pct(0.25), p50: pct(0.50),
      p75: pct(0.75), p90: pct(0.90),
      actual: iulProjection[years - 1]?.netCashValue ?? 0,
    };
  }, [iulProjection]);

  if (!mcData) return null;

  const fmt = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M`
    : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K`
    : `$${Math.round(n).toLocaleString()}`;

  const items = [
    { label: "Worst Case (10th %ile)", value: mcData.p10, color: "#ef4444" },
    { label: "Below Avg (25th %ile)", value: mcData.p25, color: "#f59e0b" },
    { label: "Median (50th %ile)", value: mcData.p50, color: "#8b5cf6" },
    { label: "Above Avg (75th %ile)", value: mcData.p75, color: "#3b82f6" },
    { label: "Best Case (90th %ile)", value: mcData.p90, color: primaryColor },
  ];

  return (
    <div>
      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-purple-400" /> Monte Carlo Analysis
        <span className="text-xs text-muted-foreground font-normal">(300 simulations, 15% volatility)</span>
      </h4>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {items.map((item) => (
          <div key={item.label} className="p-2 rounded-lg bg-background border border-border/30 text-center">
            <div className="text-[10px] text-muted-foreground leading-tight">{item.label}</div>
            <div className="font-bold text-sm" style={{ color: item.color }}>{fmt(item.value)}</div>
          </div>
        ))}
      </div>
      <div className="mt-2 p-2 rounded bg-muted/20 border border-border/20 text-[10px] text-muted-foreground">
        Monte Carlo simulation models {iulProjection.length}-year IUL outcomes using 15% annual volatility (historical S&P 500). The IUL floor of 0% prevents negative returns. Base case uses a fixed 10% return: <strong style={{ color: primaryColor }}>{fmt(mcData.actual)}</strong>.
      </div>
    </div>
  );
}

/* ── Tab: Overview / Dashboard ── */
function OverviewTab({ client, portfolio, upcomingMeetings, scorecard, primaryColor, accentColor, firmName }: any) {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-xl border border-border/50" style={{ background: `linear-gradient(135deg, ${primaryColor}10, ${accentColor}10)` }}>
        <h2 className="text-xl font-semibold mb-1">Welcome back, {client.name?.split(" ")[0] || "Client"}</h2>
        <p className="text-sm text-muted-foreground">Here's a snapshot of your financial health and upcoming activities.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Portfolio Summary */}
        {portfolio && portfolio.totalAssets > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <PieChart className="h-4 w-4" style={{ color: accentColor }} />
                Portfolio Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-4" style={{ color: primaryColor }}>
                {formatCurrency(portfolio.totalAssets)}
              </p>
              <div className="space-y-2">
                {portfolio.breakdown.map((item: { label: string; value: number }) => {
                  const pct = (item.value / portfolio.totalAssets) * 100;
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-xs mb-0.5">
                        <span>{item.label}</span>
                        <span className="font-medium">{formatCurrency(item.value)} ({pct.toFixed(1)}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: primaryColor }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Financial Scorecard */}
        {scorecard && (
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" style={{ color: primaryColor }} />
                Financial Health Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-5 mb-4">
                <div className="relative w-20 h-20">
                  <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted/30" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={primaryColor} strokeWidth="2.5" strokeDasharray={`${scorecard.overallScore}, 100`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold" style={{ color: primaryColor }}>{scorecard.overallScore}</span>
                  </div>
                </div>
                <div>
                  <p className="font-semibold">
                    {scorecard.overallScore >= 80 ? "Excellent" : scorecard.overallScore >= 60 ? "Good" : "Needs Attention"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {scorecard.overallScore >= 80 ? "Your financial health is strong" : scorecard.overallScore >= 60 ? "Good progress, room to grow" : "Action needed in key areas"}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {scorecard.categories.map((cat: any) => (
                  <div key={cat.name} className="space-y-0.5">
                    <div className="flex items-center justify-between text-xs">
                      <span>{cat.name}</span>
                      <span className="text-muted-foreground">{cat.score}/100</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${cat.score}%`, backgroundColor: cat.score >= 70 ? primaryColor : cat.score >= 40 ? '#f59e0b' : '#ef4444' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upcoming Meetings */}
      {upcomingMeetings && upcomingMeetings.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-400" />
              Upcoming Meetings ({upcomingMeetings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingMeetings.map((meeting: any) => {
                const MeetingIcon = MEETING_TYPE_ICONS[meeting.meetingType] ?? Calendar;
                const meetingDate = new Date(meeting.scheduledAt);
                return (
                  <div key={meeting.id} className="flex items-start gap-4 p-3 rounded-lg bg-muted/30 border border-border/30">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${primaryColor}20` }}>
                      <MeetingIcon className="h-4 w-4" style={{ color: primaryColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{meeting.title}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {meetingDate.toLocaleDateString()} at {meetingDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span>{meeting.durationMin} min</span>
                        {meeting.location && (
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{meeting.location}</span>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">{meeting.meetingType.replace("_", " ")}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ── Tab: Income Timeline ── */
function IncomeTimelineTab({ incomeTimeline, primaryColor, accentColor }: any) {
  if (!incomeTimeline || incomeTimeline.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-12 text-center">
          <Wallet className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No income timeline data available yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Your advisor will configure your projected retirement income sources.</p>
        </CardContent>
      </Card>
    );
  }

  const maxTotal = Math.max(...incomeTimeline.map((r: any) => r.total || 0));

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" style={{ color: accentColor }} />
            Projected Retirement Income Timeline
          </CardTitle>
          <p className="text-sm text-muted-foreground">Estimated annual income from all sources by age</p>
        </CardHeader>
        <CardContent>
          {/* Visual Bar Chart */}
          <div className="space-y-1.5 mb-6">
            {incomeTimeline.filter((_: any, i: number) => i % 3 === 0).slice(0, 20).map((row: any) => (
              <div key={row.age} className="flex items-center gap-3">
                <span className="text-xs font-medium w-8 text-right">{row.age}</span>
                <div className="flex-1 h-5 bg-muted/30 rounded overflow-hidden flex">
                  {row.socialSecurity > 0 && (
                    <div className="h-full bg-blue-500" style={{ width: `${(row.socialSecurity / maxTotal) * 100}%` }} title={`SS: ${formatCurrency(row.socialSecurity)}`} />
                  )}
                  {row.rothDistributions > 0 && (
                    <div className="h-full bg-green-500" style={{ width: `${(row.rothDistributions / maxTotal) * 100}%` }} title={`Roth: ${formatCurrency(row.rothDistributions)}`} />
                  )}
                  {row.iulLoans > 0 && (
                    <div className="h-full bg-purple-500" style={{ width: `${(row.iulLoans / maxTotal) * 100}%` }} title={`IUL: ${formatCurrency(row.iulLoans)}`} />
                  )}
                  {row.iraRmd > 0 && (
                    <div className="h-full bg-amber-500" style={{ width: `${(row.iraRmd / maxTotal) * 100}%` }} title={`IRA: ${formatCurrency(row.iraRmd)}`} />
                  )}
                </div>
                <span className="text-xs font-medium w-16 text-right" style={{ color: row.total > 0 ? primaryColor : undefined }}>
                  {row.total > 0 ? formatCurrency(row.total) : '—'}
                </span>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-4 text-xs">
            <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-500" /> Social Security</span>
            <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-500" /> Roth Distributions</span>
            <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-purple-500" /> IUL Policy Loans</span>
            <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-500" /> IRA RMDs</span>
          </div>

          {/* Detailed Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-2 px-2">Age</th>
                  <th className="text-right py-2 px-2">Social Security</th>
                  <th className="text-right py-2 px-2">Roth</th>
                  <th className="text-right py-2 px-2">IUL Loans</th>
                  <th className="text-right py-2 px-2">IRA RMD</th>
                  <th className="text-right py-2 px-2 font-bold">Total</th>
                </tr>
              </thead>
              <tbody>
                {incomeTimeline.filter((_: any, i: number) => i % 5 === 0 || incomeTimeline[i]?.total > 0).slice(0, 15).map((row: any) => (
                  <tr key={row.age} className="border-b border-border/10 hover:bg-muted/20">
                    <td className="py-1.5 px-2 font-medium">{row.age}</td>
                    <td className="py-1.5 px-2 text-right">{row.socialSecurity > 0 ? formatCurrency(row.socialSecurity) : '—'}</td>
                    <td className="py-1.5 px-2 text-right">{row.rothDistributions > 0 ? formatCurrency(row.rothDistributions) : '—'}</td>
                    <td className="py-1.5 px-2 text-right">{row.iulLoans > 0 ? formatCurrency(row.iulLoans) : '—'}</td>
                    <td className="py-1.5 px-2 text-right">{row.iraRmd > 0 ? formatCurrency(row.iraRmd) : '—'}</td>
                    <td className="py-1.5 px-2 text-right font-bold" style={{ color: row.total > 0 ? primaryColor : undefined }}>
                      {row.total > 0 ? formatCurrency(row.total) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-muted-foreground mt-3">
            Projections are estimates based on current account balances and standard assumptions. Social Security begins at age 67. IRA RMDs begin at age 72. Actual results will vary.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Tab: Documents ── */
function DocumentsTab({ documents, primaryColor }: any) {
  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-400" />
            Your Documents ({documents.length})
          </CardTitle>
          <p className="text-sm text-muted-foreground">All documents shared by your advisor</p>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No documents available yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {CATEGORY_LABELS[doc.category] ?? doc.category} · {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-muted/50 transition-colors" style={{ color: primaryColor }}>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Tab: Strategies ── */
function StrategiesTab({ strategies, savedStrategies, notes, primaryColor, accentColor }: any) {
  return (
    <div className="space-y-6">
      {/* Saved Roth/IUL Strategies */}
      {savedStrategies && savedStrategies.length > 0 && (
        <div>
          <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" style={{ color: primaryColor }} />
            Roth Conversion Strategies ({savedStrategies.length})
          </h3>
          <SavedStrategiesSection strategies={savedStrategies} primaryColor={primaryColor} accentColor={accentColor} />
        </div>
      )}

      {/* Strategy Summaries */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-400" />
            Strategy Summaries ({strategies.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {strategies.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No strategies available yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {strategies.map((s: any) => (
                <div key={s.id} className="p-4 rounded-lg bg-muted/30 border border-border/30">
                  <p className="text-xs text-muted-foreground mb-2">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{s.summary ?? "No summary available."}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Notes */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-amber-400" />
            Recent Notes ({notes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notes.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No notes available.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((n: any) => (
                <div key={n.id} className="p-4 rounded-lg bg-muted/30 border border-border/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">{n.noteType}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {n.authorName} · {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{n.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Main Client Portal View ── */
export default function ClientPortalView() {
  const params = useParams<{ token: string }>();
  const token = params.token ?? "";

  const { data, isLoading, error } = trpc.clientPortal.view.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Loading your portal...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center space-y-4">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-semibold">Portal Access Denied</h2>
            <p className="text-muted-foreground">
              This link may have expired or been revoked. Please contact your financial advisor for a new portal link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { client, documents, strategies, notes, upcomingMeetings, portfolio, savedStrategies, branding, scorecard, incomeTimeline } = data as any;

  const primaryColor = branding?.primaryColor || "#10b981";
  const accentColor = branding?.accentColor || "#059669";
  const firmName = branding?.name || "Russell Capital Solutions™";
  const logoUrl = branding?.logoUrl;

  const tabCounts = {
    documents: documents?.length ?? 0,
    strategies: (strategies?.length ?? 0) + (savedStrategies?.length ?? 0),
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with branding */}
      <header
        className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-10"
        style={{ backgroundColor: `${primaryColor}10` }}
      >
        <div className="container max-w-5xl py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={firmName} className="h-10 w-10 rounded-lg object-cover" />
            ) : (
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}30` }}
              >
                <span style={{ color: primaryColor }} className="font-bold text-sm">
                  {firmName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h1 className="font-semibold">{firmName}</h1>
              <p className="text-xs text-muted-foreground">Client Portal — {client.name}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            <Lock className="h-3 w-3 mr-1" /> Read-Only Access
          </Badge>
        </div>
      </header>

      <main className="container max-w-5xl py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-11">
            <TabsTrigger value="overview" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Home className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">Home</span>
            </TabsTrigger>
            <TabsTrigger value="income" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Wallet className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Income Timeline</span>
              <span className="sm:hidden">Income</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <FileText className="h-3.5 w-3.5" />
              Documents
              {tabCounts.documents > 0 && (
                <Badge variant="secondary" className="h-4 px-1 text-[10px] ml-0.5">{tabCounts.documents}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="strategies" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Activity className="h-3.5 w-3.5" />
              Strategies
              {tabCounts.strategies > 0 && (
                <Badge variant="secondary" className="h-4 px-1 text-[10px] ml-0.5">{tabCounts.strategies}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab
              client={client}
              portfolio={portfolio}
              upcomingMeetings={upcomingMeetings}
              scorecard={scorecard}
              primaryColor={primaryColor}
              accentColor={accentColor}
              firmName={firmName}
            />
          </TabsContent>

          <TabsContent value="income">
            <IncomeTimelineTab
              incomeTimeline={incomeTimeline}
              primaryColor={primaryColor}
              accentColor={accentColor}
            />
          </TabsContent>

          <TabsContent value="documents">
            <DocumentsTab documents={documents} primaryColor={primaryColor} />
          </TabsContent>

          <TabsContent value="strategies">
            <StrategiesTab
              strategies={strategies}
              savedStrategies={savedStrategies}
              notes={notes}
              primaryColor={primaryColor}
              accentColor={accentColor}
            />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground py-6 mt-6 border-t border-border/30">
          <p>This portal provides read-only access to your financial information.</p>
          <p className="mt-1">For questions or changes, please contact your financial advisor at <strong>{firmName}</strong>.</p>
        </div>
      </main>
    </div>
  );
}

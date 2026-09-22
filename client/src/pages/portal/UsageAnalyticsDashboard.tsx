// @ts-nocheck
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Activity, Clock, CheckCircle, TrendingUp, Zap, RefreshCw } from 'lucide-react';
import { PageInsights } from "@/components/PageInsights";

export default function UsageAnalyticsDashboard() {
  const stats = trpc.analytics.getUsageStats.useQuery();
  const leaderboard = trpc.analytics.getEngineLeaderboard.useQuery();
  const activity = trpc.analytics.getUserActivity.useQuery({ limit: 30 });

  const categoryColors: Record<string, string> = {
    "IUL & Policy": "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "Tax & Wealth": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "Client Intelligence": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    "Practice Management": "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "Retirement": "bg-rose-500/10 text-rose-400 border-rose-500/20",
    "Wealth Strategy": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    "Compliance": "bg-gray-500/10 text-[#7a95b8] border-gray-500/20",
  };

  return (
    <AppShell title="Usage Analytics" subtitle="Track engine usage patterns and performance metrics">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20"><Activity className="h-5 w-5 text-blue-400" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Engine Runs</p>
                  <p className="text-2xl font-bold">{stats.data?.totalRuns ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20"><CheckCircle className="h-5 w-5 text-emerald-400" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">{stats.data?.successRate ?? 100}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20"><Clock className="h-5 w-5 text-amber-400" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Execution Time</p>
                  <p className="text-2xl font-bold">{stats.data?.avgExecutionTime ?? 0}ms</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border-indigo-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/20"><Zap className="h-5 w-5 text-indigo-400" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Unique Engines Used</p>
                  <p className="text-2xl font-bold">{stats.data?.topEngines?.length ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdown */}
        {stats.data?.categoryBreakdown && stats.data.categoryBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Usage by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.data.categoryBreakdown.map((cat: any) => {
                  const maxCount = Math.max(...stats.data!.categoryBreakdown!.map((c: any) => Number(c.count)));
                  const pct = maxCount > 0 ? (Number(cat.count) / maxCount) * 100 : 0;
                  return (
                    <div key={cat.category} className="flex items-center gap-3">
                      <span className="text-sm w-40 truncate">{cat.category}</span>
                      <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm font-mono w-12 text-right">{cat.count}</span>
      <PageInsights section="usage-analytics-dashboard" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Engine Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Engine Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard.data && leaderboard.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3">Rank</th>
                      <th className="text-left py-2 px-3">Engine</th>
                      <th className="text-left py-2 px-3">Category</th>
                      <th className="text-right py-2 px-3">Runs</th>
                      <th className="text-right py-2 px-3">Avg Time</th>
                      <th className="text-right py-2 px-3">Success</th>
                      <th className="text-right py-2 px-3">Last Used</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.data.map((engine: any, idx: number) => (
                      <tr key={engine.engineId} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 px-3">
                          {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                        </td>
                        <td className="py-2 px-3 font-medium">{engine.engineName}</td>
                        <td className="py-2 px-3">
                          <Badge variant="outline" className={categoryColors[engine.category] || ""}>{engine.category}</Badge>
                        </td>
                        <td className="py-2 px-3 text-right font-mono">{engine.totalRuns}</td>
                        <td className="py-2 px-3 text-right font-mono">{engine.avgTimeMs}ms</td>
                        <td className="py-2 px-3 text-right font-mono">{engine.successRate}%</td>
                        <td className="py-2 px-3 text-right text-muted-foreground text-xs">
                          {engine.lastUsed ? new Date(engine.lastUsed).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-lg font-medium">No usage data yet</p>
                <p className="text-sm">Run any sister invention engine to start tracking analytics</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><RefreshCw className="h-5 w-5" /> Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activity.data && activity.data.length > 0 ? (
              <div className="space-y-2">
                {activity.data.map((log: any) => (
                  <div key={log.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/30 border border-border/30">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${log.success ? "bg-emerald-400" : "bg-red-400"}`} />
                      <span className="font-medium text-sm">{log.engineName}</span>
                      <Badge variant="outline" className="text-xs">{log.category}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{log.executionTimeMs}ms</span>
                      <span>{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground text-sm">No activity recorded yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

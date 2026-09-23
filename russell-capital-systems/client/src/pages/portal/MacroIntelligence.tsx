/**
 * Global Macro Intelligence — the dashboard.
 *
 * Seven tabs, one question each:
 *   Liquidation   — will Japan or China sell Treasuries, how much, and what if
 *   Petrodollar   — how much oil settles outside the dollar, back twenty years, forward ten
 *   Debt          — every economy's ratio, who is near distress, what contagion does
 *   Taiwan        — four scenarios priced, fifty indicators, published impact ranges
 *   Statements    — forty years of what Beijing said versus what it did
 *   Patterns      — relationships below the level of the public conversation
 *   Sources       — the registry, which feeds answered today, which keys are set
 *
 * Every number on the page shows its as-of date and source id. Where a
 * figure is a seed value rather than a live pull, the header says so.
 */
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, AlertTriangle, Database, Globe, Landmark, RefreshCw, Ship, Flame, Radar, FileText } from "lucide-react";
import { useMacroScenario } from "@/components/MacroScenarioToggle";

const pct = (x: number, d = 0) => `${(x * 100).toFixed(d)}%`;
const bn = (x: number) => `$${x.toLocaleString(undefined, { maximumFractionDigits: 0 })} bn`;

function GradePill({ grade, confidence }: { grade: string; confidence: number }) {
  const tone = grade === "A" ? "bg-emerald-500/20 text-emerald-100" : grade === "B" ? "bg-cyan-500/20 text-cyan-100" : grade === "C" ? "bg-yellow-500/20 text-yellow-100" : "bg-rose-500/20 text-rose-100";
  return <Badge className={tone}>confidence {confidence}/100 · {grade}</Badge>;
}

function Provenance({ live, seed, latestFetch }: { live: number; seed: number; latestFetch: string | null }) {
  return (
    <p className="text-xs text-emerald-200/70">
      <Database className="mr-1 inline h-3 w-3" />
      {live > 0 ? `${live} live observation(s), last pull ${latestFetch?.slice(0, 16).replace("T", " ") ?? "—"} UTC; ` : "No live pull yet — "}
      {seed} dated seed readings underneath. Every figure carries its own as-of date.
    </p>
  );
}

export default function MacroIntelligence() {
  const status = trpc.macro.status.useQuery();
  const liq = trpc.macro.liquidationConfidence.useQuery();
  const refresh = trpc.macro.refresh.useMutation({
    onSuccess: r => {
      toast.success(`Refresh: ${r.okCount} source(s) answered, ${r.failCount} failed; ${r.stored.note}.`);
      status.refetch();
      liq.refetch();
    },
    onError: e => toast.error(e.message),
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-yellow-100"><Globe className="h-6 w-6" /> Global Macro Intelligence</h1>
            <p className="mt-1 max-w-3xl text-sm text-emerald-100/80">
              Treasury liquidation odds for Japan and China, oil leaving the dollar, sovereign debt country by country, Taiwan strike risk — scored every day from {status.data?.sources ?? "…"} named sources, with a confidence grade on every probability. Model outputs from stated assumptions, not predictions of fact.
            </p>
            {liq.data && <div className="mt-2"><Provenance {...liq.data.provenance} /></div>}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refresh.mutate({})} disabled={refresh.isPending}>
              <RefreshCw className={`mr-2 h-4 w-4 ${refresh.isPending ? "animate-spin" : ""}`} /> Pull all sources now
            </Button>
          </div>
        </header>

        <Tabs defaultValue="liquidation">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="liquidation"><Landmark className="mr-1 h-4 w-4" />Liquidation</TabsTrigger>
            <TabsTrigger value="petrodollar"><Ship className="mr-1 h-4 w-4" />Petrodollar</TabsTrigger>
            <TabsTrigger value="debt"><Activity className="mr-1 h-4 w-4" />Global debt</TabsTrigger>
            <TabsTrigger value="taiwan"><Flame className="mr-1 h-4 w-4" />Taiwan</TabsTrigger>
            <TabsTrigger value="statements"><FileText className="mr-1 h-4 w-4" />Statements</TabsTrigger>
            <TabsTrigger value="patterns"><Radar className="mr-1 h-4 w-4" />Patterns</TabsTrigger>
            <TabsTrigger value="factors"><Activity className="mr-1 h-4 w-4" />Factors</TabsTrigger>
            <TabsTrigger value="household"><Landmark className="mr-1 h-4 w-4" />Household</TabsTrigger>
            <TabsTrigger value="treasury"><Database className="mr-1 h-4 w-4" />Treasury</TabsTrigger>
            <TabsTrigger value="sources"><Database className="mr-1 h-4 w-4" />Sources</TabsTrigger>
          </TabsList>

          <TabsContent value="liquidation"><LiquidationTab /></TabsContent>
          <TabsContent value="petrodollar"><PetrodollarTab /></TabsContent>
          <TabsContent value="debt"><DebtTab /></TabsContent>
          <TabsContent value="taiwan"><TaiwanTab /></TabsContent>
          <TabsContent value="statements"><StatementsTab /></TabsContent>
          <TabsContent value="patterns"><PatternsTab /></TabsContent>
          <TabsContent value="factors"><FactorsTab /></TabsContent>
          <TabsContent value="household"><HouseholdTab /></TabsContent>
          <TabsContent value="treasury"><TreasuryTab /></TabsContent>
          <TabsContent value="sources"><SourcesTab /></TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

// ─── Liquidation ──────────────────────────────────────────────────────────────

function LiquidationTab() {
  const q = trpc.macro.liquidationConfidence.useQuery();
  const [holder, setHolder] = useState<"JP" | "CN" | "BOTH">("CN");
  const [fraction, setFraction] = useState(50);
  const [months, setMonths] = useState(12);
  const scenario = trpc.macro.liquidationScenario.useQuery({ holder, fraction: fraction / 100, months, runs: 4000 });
  const macro = useMacroScenario();

  if (!q.data) return <p className="p-6 text-sm text-emerald-200/70">Scoring…</p>;
  const { japan, china, snapshot } = q.data;

  return (
    <div className="space-y-6 pt-4">
      <div className="grid gap-4 md:grid-cols-2">
        {[japan, china].map(h => (
          <Card key={h.holder} className="border-yellow-400/20 bg-[#0b1410]/80">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-yellow-100">
                <span>{h.holder === "JP" ? "Japan" : "China"} — sells ≥ 10 % within 24 months</span>
                <GradePill grade={h.stress.band.grade} confidence={h.stress.band.confidence} />
              </CardTitle>
              <CardDescription className="text-emerald-100/70">{h.narrative}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-end gap-4">
                <div className="text-4xl font-semibold text-yellow-200">{pct(h.stress.band.probability)}</div>
                <div className="text-xs text-emerald-200/70">80 % band {pct(h.stress.band.low)}–{pct(h.stress.band.high)} · coverage {pct(h.stress.coverage)}</div>
              </div>
              <div>
                <div className="mb-1 text-xs uppercase tracking-wider text-emerald-200/60">24-month net sale (bn, median / p90)</div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  {h.forecast.horizons.map(hz => (
                    <div key={hz.months} className="rounded bg-emerald-950/40 p-2">
                      <div className="text-emerald-200/60">{hz.months} mo</div>
                      <div className="font-mono text-yellow-100">${hz.sold.p50.toFixed(0)}</div>
                      <div className="font-mono text-[10px] text-emerald-200/60">p90 ${hz.sold.p90.toFixed(0)}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1 text-xs uppercase tracking-wider text-emerald-200/60">Probability 24-month sale exceeds</div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {h.forecast.exceedance.map(e => (
                    <Badge key={e.share} variant="outline" className="border-emerald-400/30 text-emerald-100">{Math.round(e.share * 100)} % → {pct(e.probability)}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1 text-xs uppercase tracking-wider text-emerald-200/60">Top drivers</div>
                <ul className="space-y-1 text-xs">
                  {h.stress.drivers.slice(0, 6).map(d => (
                    <li key={d.indicatorId} className="flex justify-between gap-2">
                      <span className={d.awareness === "latent" ? "text-cyan-200" : "text-emerald-100/90"}>{d.name}{d.stale ? " (stale)" : ""}{d.awareness === "latent" ? " · below awareness" : ""}</span>
                      <span className="font-mono text-yellow-100">{d.contribution > 0 ? "+" : ""}{d.contribution.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
                {h.stress.missing.length > 0 && <p className="mt-1 text-[11px] text-emerald-200/50">{h.stress.missing.length} indicator(s) without a fresh reading: {h.stress.missing.slice(0, 5).join(", ")}{h.stress.missing.length > 5 ? "…" : ""}</p>}
              </div>
              <p className="text-[11px] text-emerald-200/50">Regimes: {h.forecast.regimes.baseline} {h.forecast.regimes.intervention} {h.forecast.regimes.stress}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-emerald-400/15 bg-[#0b1410]/80">
        <CardHeader>
          <CardTitle className="text-yellow-100">Holdings as measured</CardTitle>
          <CardDescription className="text-emerald-100/70">TIC Table 5, {snapshot.holdings.asOf} (source us-tic-mfh) · MOF Japan {snapshot.japan.reservesAsOf}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
          <Kpi label="Japan" value={bn(snapshot.holdings.japan)} sub={`peak ${bn(snapshot.holdings.japanPeak)} (Nov 2021)`} />
          <Kpi label="China" value={bn(snapshot.holdings.chinaMainland)} sub="lowest since Sep 2008" />
          <Kpi label="All foreign" value={bn(snapshot.holdings.totalForeign)} sub={`record ${bn(snapshot.holdings.totalForeignPeak)} (Feb 2026)`} />
          <Kpi label="Japan reserves" value={bn(snapshot.japan.reservesTotal)} sub={`foreign securities ${snapshot.japan.foreignSecuritiesChange} bn in Aug`} />
          <Kpi label="Aug intervention" value={`¥${snapshot.japan.interventionYenTn} tn`} sub={`$${snapshot.japan.interventionUsdBn} bn, record`} />
          <Kpi label="China, 3 months" value={`${snapshot.china.ticThreeMonthChange > 0 ? "+" : "−"}$${Math.abs(snapshot.china.ticThreeMonthChange)} bn`} sub={`TIC, to ${snapshot.china.ticAsOf}`} />
        </CardContent>
      </Card>

      <Card className="border-yellow-400/20 bg-[#0b1410]/80">
        <CardHeader>
          <CardTitle className="text-yellow-100">What if they sold — scenario engine</CardTitle>
          <CardDescription className="text-emerald-100/70">Any holder, any fraction, any pace. 4,000 paths here; the calculators run 10,000. Every coefficient is listed under the chart.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex gap-2">
              {(["JP", "CN", "BOTH"] as const).map(h => (
                <Button key={h} size="sm" variant={holder === h ? "default" : "outline"} onClick={() => setHolder(h)}>{h === "JP" ? "Japan" : h === "CN" ? "China" : "Both"}</Button>
              ))}
            </div>
            <label className="text-xs text-emerald-200/80">Sell {fraction} % of holdings<Slider className="mt-2" min={0} max={100} step={5} value={[fraction]} onValueChange={([v]) => setFraction(v)} /></label>
            <label className="text-xs text-emerald-200/80">Over {months} months<Slider className="mt-2" min={1} max={36} step={1} value={[months]} onValueChange={([v]) => setMonths(v)} /></label>
          </div>
          {scenario.data && (
            <>
              <div className="grid gap-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
                <Kpi label="Sold" value={bn(scenario.data.soldUsdBn)} sub={`${pct(scenario.data.shareOfMarketable, 1)} of marketable`} />
                <Kpi label="10-yr peak (median)" value={`+${scenario.data.peakTenYearDeltaBp.p50.toFixed(0)} bp`} sub={`p10 +${scenario.data.peakTenYearDeltaBp.p10.toFixed(0)} · p90 +${scenario.data.peakTenYearDeltaBp.p90.toFixed(0)}`} />
                <Kpi label="Mortgage" value={`+${scenario.data.transmission.mortgageRateDeltaBp} bp`} sub="0.9× pass-through" />
                <Kpi label="Equities" value={`${scenario.data.transmission.equityIndexPct} %`} sub="discount-rate channel" />
                <Kpi label="Gold / Dollar" value={`+${scenario.data.transmission.goldPct} % / ${scenario.data.transmission.dollarIndexPct} %`} sub="" />
                <Kpi label="Fed responded" value={pct(scenario.data.fedResponded)} sub={`federal interest +$${scenario.data.transmission.federalInterestCostUsdBnPerYear} bn/yr`} />
              </div>
              <div className="h-56">
                <ResponsiveContainer>
                  <AreaChart data={scenario.data.centralPath}>
                    <CartesianGrid stroke="#1f3a2e" strokeDasharray="3 3" />
                    <XAxis dataKey="month" stroke="#9fd3b8" fontSize={11} />
                    <YAxis stroke="#9fd3b8" fontSize={11} unit=" bp" />
                    <Tooltip contentStyle={{ background: "#0b1410", border: "1px solid #facc15" }} />
                    <Area type="monotone" dataKey="tenYearDeltaBp" stroke="#facc15" fill="#facc1533" name="10-yr Δ (bp)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-1 text-[11px] text-emerald-200/60">{scenario.data.assumptions.map((a, i) => <li key={i}>• {a}</li>)}</ul>
              <p className="text-[11px] text-emerald-200/50">Sources: {scenario.data.sourceIds.join(", ")}</p>
            </>
          )}
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-2 text-sm font-medium text-yellow-100">The same toggles every calculator carries</h3>
        {macro.panel}
      </div>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-md bg-emerald-950/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-emerald-200/60">{label}</div>
      <div className="font-mono text-lg text-yellow-100">{value}</div>
      {sub && <div className="text-[11px] text-emerald-200/60">{sub}</div>}
    </div>
  );
}

// ─── Petrodollar ──────────────────────────────────────────────────────────────

function PetrodollarTab() {
  const [rollup, setRollup] = useState<"monthly" | "quarterly" | "semiannual" | "annual">("quarterly");
  const q = trpc.macro.petrodollar.useQuery({ rollup, forecastYears: 10 });
  if (!q.data) return <p className="p-6 text-sm text-emerald-200/70">Loading…</p>;
  const { breakdown, corridors, history, forecast, snapshot } = q.data;
  const forecastData = forecast.path.map(p => ({ year: p.year, p50: p.share.p50, p10: p.share.p10, p90: p.share.p90 }));
  return (
    <div className="space-y-6 pt-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-yellow-400/20 bg-[#0b1410]/80 md:col-span-1">
          <CardHeader><CardTitle className="text-yellow-100">Settled outside the dollar</CardTitle><CardDescription className="text-emerald-100/70">Global crude trade, as of {breakdown.asOf}</CardDescription></CardHeader>
          <CardContent>
            <div className="text-4xl font-semibold text-yellow-200">{pct(breakdown.nonUsdShare)}</div>
            <div className="text-xs text-emerald-200/70">range {pct(breakdown.nonUsdLow)}–{pct(breakdown.nonUsdHigh)} · 2014: ~5 % · JPM 2023 benchmark 80 % USD</div>
            <ul className="mt-3 space-y-1 text-xs">
              {breakdown.byCurrency.map(c => <li key={c.currency} className="flex justify-between"><span>{c.currency}</span><span className="font-mono text-yellow-100">{pct(c.share, 1)} · {c.volumeMbd} mb/d</span></li>)}
            </ul>
            <p className="mt-2 text-[11px] text-emerald-200/50">Saudi crude in yuan {snapshot.saudiYuanExportShare.low}–{snapshot.saudiYuanExportShare.high} %; COFER USD reserve share {snapshot.coferUsdShare} %. Sources: {breakdown.sourceIds.slice(0, 6).join(", ")}…</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-400/15 bg-[#0b1410]/80 md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-yellow-100"><span>Twenty-year history</span>
              <div className="flex gap-1">{(["monthly", "quarterly", "semiannual", "annual"] as const).map(r => <Button key={r} size="sm" variant={rollup === r ? "default" : "outline"} onClick={() => setRollup(r)}>{r}</Button>)}</div>
            </CardTitle>
            <CardDescription className="text-emerald-100/70">Reconstructed from BIS invoicing surveys and JPM's series before 2022; consensus estimates after. Band = disagreement across sources.</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <AreaChart data={history}>
                <CartesianGrid stroke="#1f3a2e" strokeDasharray="3 3" />
                <XAxis dataKey="period" stroke="#9fd3b8" fontSize={10} interval={Math.max(0, Math.floor(history.length / 10))} />
                <YAxis stroke="#9fd3b8" fontSize={11} unit="%" />
                <Tooltip contentStyle={{ background: "#0b1410", border: "1px solid #facc15" }} />
                <Area type="monotone" dataKey="high" stroke="none" fill="#facc1522" />
                <Area type="monotone" dataKey="low" stroke="none" fill="#0b1410" />
                <Line type="monotone" dataKey="nonUsdShare" stroke="#facc15" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <Card className="border-emerald-400/15 bg-[#0b1410]/80">
        <CardHeader><CardTitle className="text-yellow-100">Ten-year forecast — {forecast.path[0].share.n.toLocaleString()} paths</CardTitle><CardDescription className="text-emerald-100/70">{forecast.assumptions.join(" ")}</CardDescription></CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={forecastData}>
                <CartesianGrid stroke="#1f3a2e" strokeDasharray="3 3" />
                <XAxis dataKey="year" stroke="#9fd3b8" fontSize={11} />
                <YAxis stroke="#9fd3b8" fontSize={11} unit="%" />
                <Tooltip contentStyle={{ background: "#0b1410", border: "1px solid #facc15" }} />
                <Line type="monotone" dataKey="p90" stroke="#facc1566" dot={false} name="p90" />
                <Line type="monotone" dataKey="p50" stroke="#facc15" dot={false} name="median" />
                <Line type="monotone" dataKey="p10" stroke="#facc1566" dot={false} name="p10" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">{forecast.exceedance.map(e => <Badge key={e.threshold} variant="outline" className="border-emerald-400/30 text-emerald-100">≥ {e.threshold} % by {2026 + forecast.years}: {pct(e.probability)}</Badge>)}</div>
        </CardContent>
      </Card>
      <Card className="border-emerald-400/15 bg-[#0b1410]/80">
        <CardHeader><CardTitle className="text-yellow-100">Corridor ledger — who trades oil with whom, in what</CardTitle><CardDescription className="text-emerald-100/70">Each row is a country pair, a currency, and the share of that pair's crude settled in it. The aggregate above is derived from this table, never typed in.</CardDescription></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Exporter</TableHead><TableHead>Importer</TableHead><TableHead>Currency</TableHead><TableHead>Share</TableHead><TableHead>Volume mb/d</TableHead><TableHead>Since</TableHead><TableHead>As of</TableHead><TableHead>Sources</TableHead></TableRow></TableHeader>
            <TableBody>
              {corridors.map(c => (
                <TableRow key={c.id}>
                  <TableCell>{c.exporter}</TableCell><TableCell>{c.importer}</TableCell><TableCell><Badge variant="outline">{c.currency}</Badge></TableCell>
                  <TableCell className="font-mono">{pct(c.share)} <span className="text-emerald-200/50">({pct(c.shareLow)}–{pct(c.shareHigh)})</span></TableCell>
                  <TableCell className="font-mono">{c.volumeMbd}</TableCell><TableCell>{c.since ?? "—"}</TableCell><TableCell>{c.asOf}</TableCell>
                  <TableCell className="text-[11px] text-emerald-200/60">{c.sourceIds.join(", ")}{c.note ? ` — ${c.note}` : ""}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Debt ─────────────────────────────────────────────────────────────────────

function DebtTab() {
  const q = trpc.macro.debt.useQuery();
  const [picked, setPicked] = useState<string[]>(["ITA"]);
  const cont = trpc.macro.contagion.useQuery({ countries: picked }, { enabled: picked.length > 0 });
  if (!q.data) return <p className="p-6 text-sm text-emerald-200/70">Loading…</p>;
  const { overview, risks } = q.data;
  const top = risks.slice(0, 25).map(r => ({ name: r.iso3, score: r.score }));
  return (
    <div className="space-y-6 pt-4">
      <div className="grid gap-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
        <Kpi label="World debt / GDP 2026" value={`${overview.world?.debt2026}%`} sub={`${overview.world?.debt2031}% by 2031 (IMF)`} />
        <Kpi label="Economies tracked" value={`${overview.countries}`} sub={`${overview.estimatedRows} rows pending connector confirmation`} />
        <Kpi label="Distressed" value={`${overview.counts.distressed}`} sub={`${overview.counts.stressed} stressed · ${overview.counts.watch} watch`} />
        <Kpi label="In default" value={`${overview.counts["in-default"]}`} sub="" />
        <Kpi label="World GDP in distress" value={`${overview.gdpShareInDistress}%`} sub="PPP weights" />
        <Kpi label="As of" value={overview.asOf} sub={overview.sourceId} />
      </div>
      <Card className="border-emerald-400/15 bg-[#0b1410]/80">
        <CardHeader><CardTitle className="text-yellow-100">Default-risk score — worst twenty-five</CardTitle><CardDescription className="text-emerald-100/70">Five factors: currency-adjusted ratio, interest/revenue, FX share of debt, reserve cover, market pricing. Japan at 204 % scores safer than Argentina at 72 % — the ratio alone predicts nothing.</CardDescription></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer>
            <BarChart data={top}><CartesianGrid stroke="#1f3a2e" strokeDasharray="3 3" /><XAxis dataKey="name" stroke="#9fd3b8" fontSize={10} /><YAxis stroke="#9fd3b8" fontSize={11} /><Tooltip contentStyle={{ background: "#0b1410", border: "1px solid #facc15" }} /><Bar dataKey="score" fill="#facc15" /></BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card className="border-emerald-400/15 bg-[#0b1410]/80">
        <CardHeader><CardTitle className="text-yellow-100">Country table</CardTitle><CardDescription className="text-emerald-100/70">Click a row to add it to the contagion set below.</CardDescription></CardHeader>
        <CardContent className="max-h-[480px] overflow-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Country</TableHead><TableHead>2025</TableHead><TableHead>2026</TableHead><TableHead>2031</TableHead><TableHead>Score</TableHead><TableHead>2-yr default</TableHead><TableHead>Bucket</TableHead><TableHead>Note</TableHead></TableRow></TableHeader>
            <TableBody>
              {risks.map(r => (
                <TableRow key={r.iso3} className={`cursor-pointer ${picked.includes(r.iso3) ? "bg-yellow-400/10" : ""}`} onClick={() => setPicked(p => (p.includes(r.iso3) ? p.filter(x => x !== r.iso3) : [...p, r.iso3]))}>
                  <TableCell>{r.name} <span className="text-emerald-200/50">{r.iso3}</span>{r.estimate && <span title="pending connector confirmation" className="ml-1 text-[10px] text-yellow-300">est.</span>}</TableCell>
                  <TableCell className="font-mono">{q.data!.table.find(t => t.iso3 === r.iso3)?.debt2025}%</TableCell>
                  <TableCell className="font-mono">{r.debt2026}%</TableCell>
                  <TableCell className="font-mono">{r.debt2031 ?? "—"}{r.debt2031 !== null ? "%" : ""}</TableCell>
                  <TableCell className="font-mono text-yellow-100">{r.score}</TableCell>
                  <TableCell className="font-mono">{pct(r.twoYearDefaultProbability, 1)}</TableCell>
                  <TableCell><Badge variant="outline" className={r.bucket === "in-default" || r.bucket === "distressed" ? "border-rose-400/40 text-rose-100" : r.bucket === "stressed" ? "border-yellow-400/40 text-yellow-100" : "border-emerald-400/30 text-emerald-100"}>{r.bucket}</Badge></TableCell>
                  <TableCell className="text-[11px] text-emerald-200/60">{r.note ?? ""}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card className="border-yellow-400/20 bg-[#0b1410]/80">
        <CardHeader><CardTitle className="text-yellow-100">Contagion — if {picked.join(", ") || "…"} restructure</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {cont.data && (
            <>
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <Kpi label="Trigger GDP share" value={`${cont.data.triggerGdpShare}%`} />
                <Kpi label="EM spreads" value={`+${cont.data.effects.emSpreadDeltaBp} bp`} />
                <Kpi label="Equity vol" value={`×${cont.data.effects.equityVolMultiplier}`} />
                <Kpi label="Equity return" value={`×${cont.data.effects.equityReturnMultiplier}`} />
                <Kpi label="US 10-yr" value={`${cont.data.effects.usTreasuryFlightBp > 0 ? "+" : ""}${cont.data.effects.usTreasuryFlightBp} bp`} />
                <Kpi label="Recession +" value={`${cont.data.effects.recessionProbabilityDelta} pts`} />
              </div>
              <ul className="text-xs text-emerald-100/80">{cont.data.secondary.slice(0, 8).map(s => <li key={s.iso3}>• {s.name}: {s.reason} (+{pct(s.addedProbability)})</li>)}</ul>
              <ul className="text-[11px] text-emerald-200/50">{cont.data.rationale.map((r, i) => <li key={i}>{r}</li>)}</ul>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Taiwan ───────────────────────────────────────────────────────────────────

function TaiwanTab() {
  const q = trpc.macro.taiwan.useQuery();
  const [scenario, setScenario] = useState<"gray-zone" | "quarantine" | "blockade" | "war">("blockade");
  const impact = trpc.macro.taiwanImpact.useQuery({ scenario, runs: 4000 });
  if (!q.data) return <p className="p-6 text-sm text-emerald-200/70">Scoring…</p>;
  return (
    <div className="space-y-6 pt-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-2xl font-semibold text-yellow-200">Blockade or worse within 24 months: {pct(q.data.blockadeOrWorse24m)}</div>
        <GradePill grade={q.data.grade} confidence={q.data.confidence} />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {q.data.scenarios.map(s => (
          <Card key={s.scenario} className={`bg-[#0b1410]/80 ${scenario === s.scenario ? "border-yellow-400/50" : "border-emerald-400/15"}`} onClick={() => setScenario(s.scenario)}>
            <CardHeader><CardTitle className="capitalize text-yellow-100">{s.scenario}</CardTitle><CardDescription className="text-emerald-100/70">{s.note}</CardDescription></CardHeader>
            <CardContent className="text-sm">
              <div className="text-3xl font-semibold text-yellow-200">{pct(s.twelveMonthProbability)}</div>
              <div className="text-xs text-emerald-200/70">12 months · {pct(s.twentyFourMonthProbability)} at 24 · band {pct(s.assessment.band.low)}–{pct(s.assessment.band.high)}</div>
              <div className="mt-2 text-xs">First-year world GDP: −{s.firstYearWorldGdpPct.mode}% (−{s.firstYearWorldGdpPct.low} to −{s.firstYearWorldGdpPct.high})</div>
              <div className="text-[11px] text-emerald-200/50">{s.sourceIds.join(", ")}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-emerald-400/15 bg-[#0b1410]/80">
          <CardHeader><CardTitle className="text-yellow-100">Top drivers</CardTitle></CardHeader>
          <CardContent><ul className="space-y-1 text-xs">{q.data.topDrivers.map(d => <li key={d.indicatorId} className="flex justify-between gap-2"><span>{d.name}{d.stale ? " (stale)" : ""}</span><span className="font-mono text-yellow-100">{d.contribution > 0 ? "+" : ""}{d.contribution.toFixed(2)}</span></li>)}</ul></CardContent>
        </Card>
        <Card className="border-cyan-400/20 bg-[#0b1410]/80">
          <CardHeader><CardTitle className="text-cyan-100">Below public awareness</CardTitle><CardDescription className="text-emerald-100/70">Indicators no one discusses on the news: reserve sanction-proofing, stockpiles, ferry mobilisation, the northern flank.</CardDescription></CardHeader>
          <CardContent><ul className="space-y-1 text-xs">{q.data.latentDrivers.map(d => <li key={d.indicatorId} className="flex justify-between gap-2"><span className="text-cyan-100">{d.name}</span><span className="font-mono text-yellow-100">{d.contribution > 0 ? "+" : ""}{d.contribution.toFixed(2)}</span></li>)}</ul></CardContent>
        </Card>
      </div>
      {impact.data && (
        <Card className="border-yellow-400/20 bg-[#0b1410]/80">
          <CardHeader><CardTitle className="text-yellow-100">If it happens — {scenario}, 4,000 paths</CardTitle><CardDescription className="text-emerald-100/70">{impact.data.assumptions.join(" ")}</CardDescription></CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
            <Kpi label="World GDP yr 1" value={`${impact.data.firstYearGdpPct.p50.toFixed(1)}%`} sub={`p10 ${impact.data.firstYearGdpPct.p10.toFixed(1)} · p90 ${impact.data.firstYearGdpPct.p90.toFixed(1)}`} />
            <Kpi label="Equities" value={`${impact.data.equityDrawdownPct.p50.toFixed(0)}%`} sub="peak to trough" />
            <Kpi label="US 10-yr" value={`${impact.data.tenYearDeltaBp.p50.toFixed(0)} bp`} sub="flight vs China sales" />
            <Kpi label="Gold" value={`+${impact.data.goldPct.p50.toFixed(0)}%`} />
            <Kpi label="Oil" value={`${impact.data.oilPct.p50.toFixed(0)}%`} />
            <Kpi label="Recession" value={pct(impact.data.recessionProbability)} sub={`chip supply loss ${Math.round(impact.data.chipSupplyLoss * 100)}%`} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Statements ───────────────────────────────────────────────────────────────

function StatementsTab() {
  const q = trpc.macro.statements.useQuery();
  if (!q.data) return <p className="p-6 text-sm text-emerald-200/70">Loading…</p>;
  const { ledger, report } = q.data;
  return (
    <div className="space-y-6 pt-4">
      <Card className="border-yellow-400/20 bg-[#0b1410]/80">
        <CardHeader><CardTitle className="text-yellow-100">Did they do what they said? {ledger.length} statements, {ledger[0]?.date.slice(0, 4)}–{ledger[ledger.length - 1]?.date.slice(0, 4)}</CardTitle><CardDescription className="text-emerald-100/70">Overall follow-through {pct(report.overall.rate)} (80 % interval {pct(report.overall.low)}–{pct(report.overall.high)}).</CardDescription></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div><h4 className="mb-1 text-xs uppercase tracking-wider text-emerald-200/60">By category</h4><ul className="space-y-1 text-xs">{report.byCategory.map(c => <li key={c.category} className="flex justify-between"><span>{c.category}</span><span className="font-mono text-yellow-100">{pct(c.rate.rate)} <span className="text-emerald-200/50">n={c.rate.n}</span></span></li>)}</ul></div>
          <div><h4 className="mb-1 text-xs uppercase tracking-wider text-emerald-200/60">By channel</h4><ul className="space-y-1 text-xs">{report.byChannel.map(c => <li key={c.channel} className="flex justify-between"><span>{c.channel}</span><span className="font-mono text-yellow-100">{pct(c.rate.rate)} <span className="text-emerald-200/50">n={c.rate.n}</span></span></li>)}</ul></div>
          <div><h4 className="mb-1 text-xs uppercase tracking-wider text-emerald-200/60">By environment</h4><ul className="space-y-1 text-xs">{report.byEnvironment.map(c => <li key={c.environment} className="flex justify-between"><span>{c.environment}</span><span className="font-mono text-yellow-100">{pct(c.rate.rate)} <span className="text-emerald-200/50">n={c.rate.n}</span></span></li>)}</ul></div>
          <div className="md:col-span-3"><h4 className="mb-1 text-xs uppercase tracking-wider text-emerald-200/60">Findings</h4><ul className="space-y-1 text-sm text-emerald-100/90">{report.findings.map((f, i) => <li key={i}>• {f}</li>)}</ul></div>
        </CardContent>
      </Card>
      <Card className="border-emerald-400/15 bg-[#0b1410]/80">
        <CardHeader><CardTitle className="text-yellow-100">Ledger</CardTitle></CardHeader>
        <CardContent className="max-h-[520px] overflow-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Speaker</TableHead><TableHead>Category</TableHead><TableHead>Severity</TableHead><TableHead>Claim</TableHead><TableHead>Outcome</TableHead><TableHead>Source</TableHead></TableRow></TableHeader>
            <TableBody>{ledger.map(s => (
              <TableRow key={s.id}>
                <TableCell className="font-mono text-xs">{s.date}</TableCell><TableCell className="text-xs">{s.speaker}</TableCell><TableCell className="text-xs">{s.category}</TableCell><TableCell className="text-xs">{s.severity}</TableCell>
                <TableCell className="text-xs">{s.claim}</TableCell>
                <TableCell><Badge variant="outline" className={s.outcome === "followed" ? "border-emerald-400/40 text-emerald-100" : s.outcome === "not-followed" || s.outcome === "reversed" ? "border-rose-400/40 text-rose-100" : "border-yellow-400/40 text-yellow-100"}>{s.outcome}</Badge>{s.outcomeNote && <div className="text-[10px] text-emerald-200/50">{s.outcomeNote}</div>}</TableCell>
                <TableCell className="text-[11px] text-emerald-200/60">{s.sourceId}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Patterns ─────────────────────────────────────────────────────────────────

function PatternsTab() {
  const [minAbsR, setMinAbsR] = useState(60);
  const q = trpc.macro.patterns.useQuery({ minAbsR: minAbsR / 100, maxLag: 6 });
  if (!q.data) return <p className="p-6 text-sm text-emerald-200/70">Scanning…</p>;
  const { illustrative, report } = q.data;
  return (
    <div className="space-y-6 pt-4">
      {illustrative && (
        <div className="flex items-start gap-2 rounded-lg border border-yellow-400/30 bg-yellow-400/10 p-3 text-sm text-yellow-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Illustrative series. The detector needs at least twelve months of stored observations from the daily refresh before it can report real relationships; until then it runs on a structured demo panel so the page shows what it will look like. Nothing below is a finding about the world yet.</span>
        </div>
      )}
      <div className="flex items-center gap-4 text-xs text-emerald-200/80"><span>Minimum |r| {minAbsR / 100}</span><Slider className="w-48" min={40} max={90} step={5} value={[minAbsR]} onValueChange={([v]) => setMinAbsR(v)} /><span>{report.seriesCount} series · {report.months} months</span></div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-cyan-400/20 bg-[#0b1410]/80">
          <CardHeader><CardTitle className="text-cyan-100">Below awareness — {report.belowAwareness.length}</CardTitle><CardDescription className="text-emerald-100/70">Relationships whose indicators are all structural or latent.</CardDescription></CardHeader>
          <CardContent><ul className="space-y-2 text-xs">{report.belowAwareness.slice(0, 15).map((f, i) => <li key={i} className="rounded bg-emerald-950/40 p-2"><div className="flex justify-between"><span className="text-cyan-100">{f.kind}</span><Badge variant="outline">conf {f.confidence} · {f.grade}</Badge></div><div className="mt-1 text-emerald-100/90">{f.reading}</div></li>)}</ul></CardContent>
        </Card>
        <Card className="border-emerald-400/15 bg-[#0b1410]/80">
          <CardHeader><CardTitle className="text-yellow-100">Lead–lag — {report.leads.length}</CardTitle><CardDescription className="text-emerald-100/70">X predicts Y months ahead, only where the lead beats moving together.</CardDescription></CardHeader>
          <CardContent><ul className="space-y-2 text-xs">{report.leads.slice(0, 15).map((f, i) => <li key={i} className="rounded bg-emerald-950/40 p-2"><div className="flex justify-between"><span>lag {f.lag}</span><Badge variant="outline">conf {f.confidence} · {f.grade}</Badge></div><div className="mt-1 text-emerald-100/90">{f.reading}</div></li>)}</ul></CardContent>
        </Card>
        <Card className="border-emerald-400/15 bg-[#0b1410]/80 md:col-span-2">
          <CardHeader><CardTitle className="text-yellow-100">Conditional triples — {report.conditionals.length}</CardTitle></CardHeader>
          <CardContent><ul className="space-y-2 text-xs">{report.conditionals.slice(0, 12).map((f, i) => <li key={i} className="rounded bg-emerald-950/40 p-2"><div className="flex justify-between"><span>lift {f.lift}×</span><Badge variant="outline">conf {f.confidence} · {f.grade}</Badge></div><div className="mt-1 text-emerald-100/90">{f.reading}</div></li>)}</ul></CardContent>
        </Card>
      </div>
      <ul className="text-[11px] text-emerald-200/50">{report.method.map((m, i) => <li key={i}>• {m}</li>)}</ul>
    </div>
  );
}

// ─── Factors (W8) ─────────────────────────────────────────────────────────────

function FactorsTab() {
  const q = trpc.macro.factors.useQuery();
  if (!q.data) return <p className="p-6 text-sm text-emerald-200/70">Loading…</p>;
  const { counts, factors } = q.data;
  return (
    <div className="space-y-4 pt-4">
      <p className="text-xs text-emerald-200/70">
        {factors.length} factors · <span className="text-emerald-100">{counts.signal} signal</span> (measured lead at the stated horizon) · {counts.context} context (no lead measured; weight 0 in every model) · {counts.pending} pending (fewer than 60 months stored). A factor earns "signal" from the stored history, never from a description. Coverage is the span of stored rows; before the first history pull it is what the publisher offers.
      </p>
      <Table>
        <TableHeader><TableRow><TableHead>Factor</TableHead><TableHead>Series</TableHead><TableHead>Claims to lead</TableHead><TableHead>Coverage</TableHead><TableHead>Verdict</TableHead><TableHead>Live score</TableHead></TableRow></TableHeader>
        <TableBody>{factors.map(f => {
          const v = f.verdict;
          const m = f.meta;
          const s = f.score;
          const tone = v?.verdict === "signal" ? "border-emerald-400/40 text-emerald-100" : v?.verdict === "context" ? "border-yellow-400/40 text-yellow-100" : "border-emerald-400/20 text-emerald-200/60";
          return (
            <TableRow key={f.id}>
              <TableCell><div className="text-yellow-100">{f.name}</div><div className="text-[10px] text-emerald-200/50">{f.id} · {f.sourceIds[0]} · weight {f.weight} → {f.effectiveWeight}</div></TableCell>
              <TableCell className="text-xs"><code>{f.factor?.series}</code>{f.factor?.denominator && <span> / <code>{f.factor.denominator}</code></span>}<div className="text-[10px] text-emerald-200/50">{f.factor?.transform} · {f.cadence}</div></TableCell>
              <TableCell className="text-xs">{f.factor?.target} at {f.factor?.horizonMonths} months, {f.direction === "risk-up" ? "same direction" : "opposite direction"}</TableCell>
              <TableCell className="text-xs">{m && m.points > 0 ? <span>{m.coverageYears} y from {m.earliestAsOf}<div className="text-[10px] text-emerald-200/50">{m.points} rows · {m.status}{m.reason ? ` · ${m.reason}` : ""}</div></span> : <span className="text-emerald-200/50">published from {f.factor?.publishedFrom}; nothing stored yet</span>}</TableCell>
              <TableCell><Badge variant="outline" className={tone}>{v?.verdict ?? "pending"}</Badge>{v && <div className="text-[10px] text-emerald-200/50">r {v.leadR ?? "n/a"} · hit {v.hitRate === null ? "n/a" : `${Math.round(v.hitRate * 100)}%`} · n {v.n}</div>}</TableCell>
              <TableCell className="text-xs">{s && s.running.n > 0 ? <span>Brier {s.meanBrier} · hit {s.liveHitRate === null ? "n/a" : `${Math.round(s.liveHitRate * 100)}%`} · n {s.running.n}</span> : <span className="text-emerald-200/50">no matured forecast</span>}</TableCell>
            </TableRow>
          );
        })}</TableBody>
      </Table>
    </div>
  );
}

// ─── Treasury pool (the daily watch, the archaeology, the grid) ───────────────

function TreasuryTab() {
  const q = trpc.macro.treasuryPool.useQuery({ archaeology: true });
  const g = trpc.macro.globalTreasuries.useQuery();
  if (!q.data) return <p className="p-6 text-sm text-emerald-200/70">Loading…</p>;
  const d = q.data;
  const regimeTone: Record<string, string> = { abundant: "border-emerald-400/40 text-emerald-100", normal: "border-emerald-400/20 text-emerald-200", tightening: "border-yellow-400/40 text-yellow-100", draining: "border-orange-400/50 text-orange-100", "dried-up": "border-rose-400/60 text-rose-100" };
  return (
    <div className="space-y-6 pt-4">
      {d.note && <p className="rounded border border-yellow-400/30 bg-yellow-950/20 p-3 text-xs text-yellow-100">{d.note}</p>}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-emerald-400/20 bg-emerald-950/30">
          <CardHeader><CardTitle className="text-yellow-100">Liquidity dry-up indicator</CardTitle><CardDescription>Is the pool draining? Eight readings, one score, a regime, and the playbook for it.</CardDescription></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-3"><span className="text-4xl text-yellow-100">{d.dryUp.score}</span><Badge variant="outline" className={regimeTone[d.dryUp.regime]}>{d.dryUp.regime}</Badge><span className="text-xs text-emerald-200/60">coverage {Math.round(d.dryUp.coverage * 100)}%</span></div>
            <ul className="text-xs">{d.dryUp.drivers.map(x => <li key={x.id} className="flex justify-between gap-2"><span className="text-emerald-100/90">{x.id}</span><span className="text-emerald-200/60">{x.reading === null ? "no reading" : `${x.reading} → ${x.points} pts`}</span></li>)}</ul>
            <ul className="text-[11px] text-emerald-200/50">{d.dryUp.method.map((m, i) => <li key={i}>• {m}</li>)}</ul>
          </CardContent>
        </Card>
        <Card className="border-emerald-400/20 bg-emerald-950/30 lg:col-span-2">
          <CardHeader><CardTitle className="text-yellow-100">Prediction grid</CardTitle><CardDescription>Target × horizon from measured leads and current z-scores. "pending" until the stored history has been scanned.</CardDescription></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Target</TableHead>{[3, 6, 12].map(h => <TableHead key={h}>{h} m</TableHead>)}</TableRow></TableHeader>
              <TableBody>{["tp-10y", "tp-foreign-total", "tp-prime", "tp-mortgage-30y", "tp-ci-loans", "tp-home-price"].map(t => (
                <TableRow key={t}><TableCell className="text-xs">{t}</TableCell>{[3, 6, 12].map(h => { const c = d.grid.find(x => x.target === t && x.horizonMonths === h); return <TableCell key={h} className="text-xs">{c ? (c.direction === "pending" ? <span className="text-emerald-200/40">pending</span> : <span>{c.direction} {c.score} <Badge variant="outline" className="ml-1">{c.grade}</Badge></span>) : "—"}</TableCell>; })}</TableRow>
              ))}</TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <Card className="border-emerald-400/20 bg-emerald-950/30">
        <CardHeader><CardTitle className="text-yellow-100">Playbook for the current regime: {d.dryUp.regime}</CardTitle><CardDescription>Considerations for the advisor to review with the client, by wealth tier. Never applied automatically.</CardDescription></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">{d.dryUp.playbook.map(p => <div key={p.tier} className="rounded bg-emerald-950/50 p-2 text-xs"><div className="mb-1 text-yellow-100">{p.tier}</div><ul>{p.considerations.map((c, i) => <li key={i}>• {c}</li>)}</ul></div>)}</CardContent>
      </Card>
      <Card className="border-emerald-400/20 bg-emerald-950/30">
        <CardHeader><CardTitle className="text-yellow-100">The fifty pool series</CardTitle><CardDescription>Latest stored reading, three-month change, coverage. {d.manifest} series in the daily pull.</CardDescription></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Series</TableHead><TableHead>Group · role</TableHead><TableHead>From</TableHead><TableHead>Latest</TableHead><TableHead>3-month</TableHead><TableHead>Coverage</TableHead></TableRow></TableHeader>
            <TableBody>{d.series.map(s => (
              <TableRow key={s.id}>
                <TableCell><div className="text-yellow-100">{s.name}</div><div className="text-[10px] text-emerald-200/50">{s.id} · <code>{s.series}</code> · {s.sourceId}</div></TableCell>
                <TableCell className="text-xs">{s.group} · {s.role}</TableCell>
                <TableCell className="text-xs">{s.publishedFrom.slice(0, 4)}</TableCell>
                <TableCell className="text-xs">{s.latest ? `${s.latest.value} ${s.unit} (${s.latest.asOf})` : <span className="text-emerald-200/40">not yet pulled</span>}</TableCell>
                <TableCell className="text-xs">{s.change3m === null || s.change3m === undefined ? "—" : `${s.change3m > 0 ? "+" : ""}${Math.round(s.change3m * 100) / 100}${s.role === "prices" || s.group === "yields" ? "" : "%"}`}</TableCell>
                <TableCell className="text-xs">{s.meta && s.meta.points > 0 ? `${s.meta.coverageYears} y · ${s.meta.status}` : <span className="text-emerald-200/40">pending</span>}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </CardContent>
      </Card>
      {d.archaeology && (
        <Card className="border-emerald-400/20 bg-emerald-950/30">
          <CardHeader><CardTitle className="text-yellow-100">Archaeology</CardTitle><CardDescription>{d.archaeology.seriesStored} of {d.archaeology.seriesTotal} series stored · {d.archaeology.months} months · {d.archaeology.patterns?.leads.length ?? 0} leads · {d.archaeology.dominoes.length} domino chains · {d.archaeology.loudest.length} turning points scanned</CardDescription></CardHeader>
          <CardContent className="space-y-3 text-xs">
            {d.archaeology.dominoes.slice(0, 8).map((c, i) => <div key={i} className="rounded bg-emerald-950/50 p-2">{c.reading} <span className="text-emerald-200/50">(strength {c.strength}, {c.totalLagMonths} m, conf {c.confidence})</span></div>)}
            {d.archaeology.loudest.slice(0, 6).map((l, i) => <div key={i} className="rounded bg-emerald-950/50 p-2"><span className="text-yellow-100">{l.turningPoint.kind} {l.turningPoint.asOf} ({l.turningPoint.value})</span>: {l.movers.slice(0, 5).map(m => `${m.name} z ${m.z} [${m.awareness}]`).join("; ")}</div>)}
            <Table>
              <TableHeader><TableRow><TableHead>Hypothesis</TableHead><TableHead>Kind</TableHead><TableHead>Claim</TableHead><TableHead>Measured</TableHead></TableRow></TableHeader>
              <TableBody>{d.archaeology.hypotheses.map(h => <TableRow key={h.id}><TableCell>{h.id}</TableCell><TableCell>{h.kind}</TableCell><TableCell>{h.claim}</TableCell><TableCell>{h.measured ? `r ${h.measured.r} lag ${h.measured.lag} · ${h.measured.grade} · ${h.measured.agrees ? "sign agrees" : "sign disagrees"}` : <span className="text-emerald-200/40">pending</span>}</TableCell></TableRow>)}</TableBody>
            </Table>
            <ul className="text-[11px] text-emerald-200/50">{d.archaeology.method.map((m, i) => <li key={i}>• {m}</li>)}</ul>
          </CardContent>
        </Card>
      )}
      {g.data && (
        <Card className="border-emerald-400/20 bg-emerald-950/30">
          <CardHeader><CardTitle className="text-yellow-100">Global treasuries — twenty-five countries</CardTitle><CardDescription>The flow calculus: positive fills the U.S. pool, negative drains it. {g.data.manifest} series in the daily pull.</CardDescription></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Country</TableHead><TableHead>Score</TableHead><TableHead>Direction</TableHead><TableHead>Top drivers</TableHead><TableHead>Why on the list</TableHead></TableRow></TableHeader>
              <TableBody>{g.data.countries.map(c => (
                <TableRow key={c.iso3}>
                  <TableCell className="text-yellow-100">{c.name}</TableCell>
                  <TableCell className="text-xs">{c.result ? c.result.score : <span className="text-emerald-200/40">pending</span>}</TableCell>
                  <TableCell className="text-xs">{c.result ? c.result.direction : "—"}</TableCell>
                  <TableCell className="text-xs">{c.result ? c.result.drivers.filter(x => x.reading !== null).slice(0, 3).map(x => `${x.name} ${x.contribution > 0 ? "+" : ""}${x.contribution}`).join("; ") || "no readings stored" : "—"}</TableCell>
                  <TableCell className="text-xs text-emerald-100/80">{c.why}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
            <ul className="mt-2 text-[11px] text-emerald-200/50">{g.data.method.map((m, i) => <li key={i}>• {m}</li>)}</ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Household (what families pay and do) ─────────────────────────────────────

const inputCls = "w-full rounded border border-emerald-400/30 bg-emerald-950/40 px-2 py-1 text-sm text-emerald-50";
const usd = (x: number) => `$${Math.round(x).toLocaleString()}`;

function HouseholdTab() {
  const [childAge, setChildAge] = useState(8);
  const [school, setSchool] = useState<"public-in-state" | "public-out-of-state" | "private-nonprofit">("public-in-state");
  const [borrowShare, setBorrowShare] = useState(50);
  const [opp, setOpp] = useState(6);
  const [age, setAge] = useState(42);
  const [netWorth, setNetWorth] = useState(350000);
  const [profession, setProfession] = useState("Physician");
  const [years, setYears] = useState(12);
  const [peerIncome, setPeerIncome] = useState(240000);
  const college = trpc.macro.collegeCost.useQuery({ childAge, school, borrowShare: borrowShare / 100, opportunityRatePct: opp });
  const wealth = trpc.macro.relativeWealth.useQuery({ age, netWorth, profession, yearsInProfession: years, peerMedianIncome: peerIncome });
  const hh = trpc.macro.household.useQuery();
  const c = college.data;
  const w = wealth.data;
  return (
    <div className="space-y-6 pt-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-emerald-400/20 bg-emerald-950/30">
          <CardHeader><CardTitle className="text-yellow-100">College: the total package</CardTitle><CardDescription>Sticker grown to the start year, four years, books and living, the loan, and the opportunity cost of every dollar sent to a lender.</CardDescription></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label>Child's age today<input className={inputCls} type="number" value={childAge} min={0} max={30} onChange={e => setChildAge(Number(e.target.value))} /></label>
              <label>School<select className={inputCls} value={school} onChange={e => setSchool(e.target.value as typeof school)}><option value="public-in-state">Public, in state</option><option value="public-out-of-state">Public, out of state</option><option value="private-nonprofit">Private nonprofit</option></select></label>
              <label>Share borrowed {borrowShare}%<Slider value={[borrowShare]} min={0} max={100} step={5} onValueChange={v => setBorrowShare(v[0])} /></label>
              <label>Opportunity rate {opp}%<Slider value={[opp]} min={0} max={12} step={0.5} onValueChange={v => setOpp(v[0])} /></label>
            </div>
            {c && (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <Stat label={`Today, ${c.input.years} years`} value={usd(c.todayPackage)} />
                  <Stat label={`Projected, starts in ${c.yearsUntilStart} y`} value={usd(c.projectedPackage)} />
                  <Stat label="Total economic cost" value={usd(c.totalEconomicCost)} accent />
                </div>
                <Table>
                  <TableHeader><TableRow><TableHead>Year</TableHead><TableHead>Tuition & fees</TableHead><TableHead>Room & board</TableHead><TableHead>Books</TableHead><TableHead>Other</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
                  <TableBody>{c.years.map(y => <TableRow key={y.year}><TableCell>{y.year} (+{y.calendarOffset} y)</TableCell><TableCell>{usd(y.tuitionFees)}</TableCell><TableCell>{usd(y.roomBoard)}</TableCell><TableCell>{usd(y.books)}</TableCell><TableCell>{usd(y.other)}</TableCell><TableCell className="text-yellow-100">{usd(y.total)}</TableCell></TableRow>)}</TableBody>
                </Table>
                <p className="text-xs text-emerald-100/90">Loan {usd(c.loan.principal)} at {c.loan.ratePct}% over {c.loan.termYears} years: {usd(c.loan.monthlyPayment)}/month, {usd(c.loan.totalInterest)} interest, {usd(c.loan.originationFee)} fee. Those payments invested at {c.input.opportunityRatePct}% instead would be worth {usd(c.opportunityCostOfPayments)} more; the whole package compounded at that rate for the term is {usd(c.opportunityCostOfPackage)} forgone.</p>
                <ul className="text-[11px] text-emerald-200/60">{c.assumptions.map((a, i) => <li key={i}>• {a}</li>)}</ul>
                {c.unverified.length > 0 && <p className="text-[11px] text-yellow-200/80">Flagged VERIFY: {c.unverified.join(", ")} — typed from the publisher's release; re-enter on the 36-hour review before quoting to a client.</p>}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border-emerald-400/20 bg-emerald-950/30">
          <CardHeader><CardTitle className="text-yellow-100">Relative wealth</CardTitle><CardDescription>Net worth against every American of the same age, against everyone, and against a peer in the same profession.</CardDescription></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label>Age<input className={inputCls} type="number" value={age} min={18} max={110} onChange={e => setAge(Number(e.target.value))} /></label>
              <label>Net worth<input className={inputCls} type="number" value={netWorth} step={1000} onChange={e => setNetWorth(Number(e.target.value))} /></label>
              <label>Profession<input className={inputCls} value={profession} onChange={e => setProfession(e.target.value)} /></label>
              <label>Years in profession<input className={inputCls} type="number" value={years} min={0} max={80} onChange={e => setYears(Number(e.target.value))} /></label>
              <label className="col-span-2">Peer median income (BLS OES for the occupation, or entered)<input className={inputCls} type="number" value={peerIncome} step={1000} onChange={e => setPeerIncome(Number(e.target.value))} /></label>
            </div>
            {w && (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <Stat label={`Percentile, age ${w.bracket}`} value={`${Math.round(w.vsAge.percentile * 100)}th`} accent />
                  <Stat label="× age-bracket median" value={`${w.vsAge.ratioToMedian}×`} />
                  <Stat label="Percentile, all households" value={`${Math.round(w.vsAll.percentile * 100)}th`} />
                </div>
                <p className="text-xs text-emerald-100/90">{w.vsAge.readout}</p>
                {w.vsPeer && <p className="text-xs text-emerald-100/90">{w.vsPeer.readout}</p>}
                {w.nextDecile && <p className="text-xs text-emerald-100/90">Next decile ({Math.round(w.nextDecile.percentile * 100)}th) at {usd(w.nextDecile.netWorth)}: {usd(w.nextDecile.gap)} to go.</p>}
                <div className="flex flex-wrap gap-1 text-[10px] text-emerald-200/60">{w.vsAge.deciles.map((d, i) => <span key={i} className="rounded bg-emerald-950/60 px-1">{(i + 1) * 10}th {usd(d)}</span>)}</div>
                <ul className="text-[11px] text-emerald-200/60">{w.method.map((m, i) => <li key={i}>• {m}</li>)}</ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {hh.data && (
        <Card className="border-emerald-400/20 bg-emerald-950/30">
          <CardHeader><CardTitle className="text-yellow-100">The fifty household signals</CardTitle><CardDescription>{hh.data.counts.signals} series · {hh.data.counts.keyless} keyless · {hh.data.counts.backtested} backtested as factors · {hh.data.counts.ideas} ideas queued. A rise in a "risk-up" series is bad news for the household economy; "cost" rows are price records.</CardDescription></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Signal</TableHead><TableHead>Group</TableHead><TableHead>From</TableHead><TableHead>Cadence</TableHead><TableHead>Latest stored</TableHead><TableHead>What it signals</TableHead></TableRow></TableHeader>
              <TableBody>{hh.data.signals.map((s, i) => (
                <TableRow key={s.id}>
                  <TableCell className="text-xs">{i + 1}</TableCell>
                  <TableCell><a className="text-yellow-100 underline-offset-2 hover:underline" href={s.url ?? "#"} target="_blank" rel="noreferrer">{s.name}</a><div className="text-[10px] text-emerald-200/50">{s.sourceId}{s.factorId ? ` · factor ${s.factorId}` : " · review"} · {s.access}</div></TableCell>
                  <TableCell className="text-xs">{s.group}</TableCell>
                  <TableCell className="text-xs">{s.publishedFrom.slice(0, 4)}</TableCell>
                  <TableCell className="text-xs">{s.cadence}</TableCell>
                  <TableCell className="text-xs">{s.latest ? `${s.latest.value} (${s.latest.asOf})` : s.meta && s.meta.points > 0 ? `${s.meta.points} rows from ${s.meta.earliestAsOf}` : <span className="text-emerald-200/40">not yet pulled</span>}</TableCell>
                  <TableCell className="text-xs text-emerald-100/80">{s.signals}<div className="text-[10px] text-emerald-200/50">{s.reasoning}</div></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return <div className="rounded bg-emerald-950/50 p-2"><div className="text-[10px] text-emerald-200/60">{label}</div><div className={accent ? "text-lg text-yellow-100" : "text-lg text-emerald-50"}>{value}</div></div>;
}

// ─── Sources ──────────────────────────────────────────────────────────────────

function SourcesTab() {
  const q = trpc.macro.sources.useQuery();
  const status = trpc.macro.status.useQuery();
  const [filter, setFilter] = useState<string>("all");
  const rows = useMemo(() => (q.data?.sources ?? []).filter(s => filter === "all" || s.jurisdiction === filter || s.domains.includes(filter as any)), [q.data, filter]);
  const health = new Map((status.data?.health ?? []).map(h => [h.sourceId, h]));
  if (!q.data) return <p className="p-6 text-sm text-emerald-200/70">Loading…</p>;
  const coreFilters = ["all", "JP", "CN", "US", "TW", "oil-settlement", "sovereign-debt", "taiwan-risk", "treasury-holdings"];
  const expansionFilters = (status.data?.buildOrder ?? []).map(b => b.domain);
  const counts = status.data;
  return (
    <div className="space-y-4 pt-4">
      {counts && (
        <p className="text-xs text-emerald-200/70">
          {counts.sources} sources across {counts.domains} domains · {counts.paidSources} paid · {counts.connectors.total} automatic connectors ({counts.connectors.core} core, {counts.connectors.expansionNumber} number feeds, {counts.connectors.expansionStatement} statement feeds) · every source not pulled automatically is on the 36-hour manual review.
        </p>
      )}
      <div className="flex flex-wrap gap-2 text-xs">
        {coreFilters.map(f => <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>{f}</Button>)}
        {status.data && <span className="ml-auto text-emerald-200/70">Keys: FRED {status.data.keys.FRED_API_KEY ? "set" : "missing"} · EIA {status.data.keys.EIA_API_KEY ? "set" : "missing"} · Comtrade {status.data.keys.COMTRADE_API_KEY ? "set" : "missing"} · CRON_SECRET {status.data.keys.CRON_SECRET ? "set" : "missing"}</span>}
      </div>
      {expansionFilters.length > 0 && (
        <div className="flex flex-wrap gap-1 text-[11px]">
          <span className="mr-1 self-center text-emerald-200/50">Expansion, in build order:</span>
          {expansionFilters.map((f, i) => <Button key={f} size="sm" variant={filter === f ? "default" : "ghost"} className="h-6 px-2" onClick={() => setFilter(f)}>{i + 1}. {f}</Button>)}
        </div>
      )}
      <Table>
        <TableHeader><TableRow><TableHead>Source</TableHead><TableHead>Entity</TableHead><TableHead>Tier</TableHead><TableHead>Access</TableHead><TableHead>Cadence</TableHead><TableHead>Provides</TableHead><TableHead>Health</TableHead></TableRow></TableHeader>
        <TableBody>{rows.map(s => {
          const h = health.get(s.id);
          return (
            <TableRow key={s.id}>
              <TableCell><a className="text-yellow-100 underline-offset-2 hover:underline" href={s.url} target="_blank" rel="noreferrer">{s.name}</a><div className="text-[10px] text-emerald-200/50">{s.id} · {s.jurisdiction}</div></TableCell>
              <TableCell className="text-xs">{s.entity}</TableCell>
              <TableCell><Badge variant="outline" className={s.tier === "state-media" ? "border-rose-400/40 text-rose-100" : "border-emerald-400/30 text-emerald-100"}>{s.tier}</Badge></TableCell>
              <TableCell className="text-xs">{s.access}{s.keyEnv ? ` (${s.keyEnv})` : ""}</TableCell>
              <TableCell className="text-xs">{s.cadence}</TableCell>
              <TableCell className="text-xs text-emerald-100/80">{s.provides}{s.caveat && <div className="text-[10px] text-yellow-200/70">{s.caveat}</div>}</TableCell>
              <TableCell className="text-xs">{h ? <span className={h.lastOk ? "text-emerald-200" : h.failStreak >= 7 ? "text-rose-300" : "text-yellow-200"}>{h.lastOk ? "ok" : `failing ×${h.failStreak}`}<div className="text-[10px] text-emerald-200/50">{h.lastSuccessAt?.slice(0, 10) ?? "never"} · {h.lastDetail}</div></span> : <span className="text-emerald-200/40">{s.access === "manual" ? "manual" : "not yet pulled"}</span>}</TableCell>
            </TableRow>
          );
        })}</TableBody>
      </Table>
    </div>
  );
}

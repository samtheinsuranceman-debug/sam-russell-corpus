// @ts-nocheck
import { useCalculatorIntegration } from "@/hooks/useCalculatorIntegration";
import { ClientSelectorBar } from "@/components/ClientSelectorBar";
import { NumberInput } from "@/components/NumberInput";
import { GenerateOutcomeTab } from "@/components/GenerateOutcomeTab";
import { CalculationSyncBar } from "@/components/CalculationSyncBar";
import { useStrategy } from "@/contexts/StrategyContext";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import {
  Shield,
  DollarSign,
  BarChart3,
  Lock,
  Building2,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  TrendingUp,
  Landmark,
  Scale,
  ArrowRight,
  Star,
  BadgeCheck,
  RefreshCw,
  Loader2,
  Droplets,
  Fuel,
  Zap,
  PiggyBank,
  Home,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell, ComposedChart, Line,
  ReferenceLine, ReferenceArea,
} from "recharts";
import {
  runMYGAWaterfall, getDefaultInput, runScenarioComparison,
  type MYGAWaterfallInput, type MYGAWaterfallResult, type TrancheInfo,
  type TaxDeploymentOption, type ScenarioComparison,
} from "@shared/mygaWaterfall";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import { MultiPropertyTab } from "@/components/MultiPropertyTab";
import {
  US_STATES, getTopProductsForState, getStateGuaranty, getStateName,
  getCarrierSplitRecommendation, type StateCode,
} from "@shared/annuityData";
import { PageInsights } from "@/components/PageInsights";
import { PlatformEnhancements } from "@/components/PlatformEnhancements";
import { ExportToSlides } from "@/components/ExportToSlides";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

/* ─── SENTINEL SECURITY ILLUSTRATION DATA ─── */
const BASE_PREMIUM = 4000000;
const GUARANTEED_RATE = 6.25;
const MIN_RATE = 2.40;
const GUARANTEE_PERIOD = 5;

function generateProjection(premium: number, guarRate: number, minRate: number, years: number) {
  const data = [];
  let currentValue = premium;
  let guarValue = premium;
  let minValue = premium;

  const surrenderCharges = [0, 9, 8, 7, 6, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  for (let y = 0; y <= years; y++) {
    if (y > 0) {
      currentValue *= (1 + guarRate / 100);
      if (y <= GUARANTEE_PERIOD) {
        guarValue *= (1 + guarRate / 100);
      } else {
        guarValue *= (1 + minRate / 100);
      }
      minValue *= (1 + minRate / 100);
    }

    const sc = surrenderCharges[y] || 0;
    data.push({
      year: y,
      age: 70 + y,
      contractValue: Math.round(currentValue),
      guaranteedValue: Math.round(guarValue),
      minimumValue: Math.round(minValue),
      surrenderCharge: sc,
      cashSurrender: Math.round(guarValue * (1 - sc / 100)),
      interestEarned: y === 0 ? 0 : Math.round(guarValue - premium),
    });
  }
  return data;
}

/* ─── FDIC vs STATE GUARANTY COMPARISON ─── */
const SAFETY_COMPARISON = [
  {
    feature: "Coverage Limit",
    fdic: "$250,000 per depositor, per bank, per ownership category",
    insurance: "$250,000–$500,000+ per policy depending on state (many states cover $300K–$500K for annuities)",
    winner: "insurance",
  },
  {
    feature: "What Backs the Guarantee",
    fdic: "Federal government (U.S. Treasury) — but only up to the $250K limit",
    insurance: "Insurance company's own reserves + state guaranty association + reinsurance treaties",
    winner: "insurance",
  },
  {
    feature: "Reserve Requirements",
    fdic: "Banks required to hold ~8-10% capital ratio. Remaining 90%+ is lent out or invested.",
    insurance: "Insurance companies must hold dollar-for-dollar reserves (100%+) for every policy obligation. Regulated by state insurance departments.",
    winner: "insurance",
  },
  {
    feature: "What Happens If Institution Fails",
    fdic: "FDIC pays up to $250K. Amounts above $250K may be lost entirely. Recovery can take weeks to months.",
    insurance: "State guaranty association steps in. Another insurance company typically assumes the policies. Policyholders rarely lose any money.",
    winner: "insurance",
  },
  {
    feature: "Historical Failures",
    fdic: "563 bank failures since 2001. Silicon Valley Bank ($209B), Signature Bank ($110B), First Republic ($229B) — all in 2023 alone.",
    insurance: "Extremely rare. When Executive Life failed (1991), policyholders recovered 70-100% of their money through guaranty associations.",
    winner: "insurance",
  },
];

/* ─── STATE GUARANTY LIMITS (Top 15 states) ─── */
/* STATE_LIMITS and MYGA_RATES now come from shared/annuityData.ts */

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const fmtPct = (n: number) => `${n.toFixed(2)}%`;

/* ─── S&P 500 HISTORICAL ANNUAL RETURNS (2001–2025) ─── */
const SP500_RETURNS = [
  { year: 2001, return: -13.04 },
  { year: 2002, return: -23.37 },
  { year: 2003, return: 26.38 },
  { year: 2004, return: 8.99 },
  { year: 2005, return: 3.00 },
  { year: 2006, return: 13.62 },
  { year: 2007, return: 3.53 },
  { year: 2008, return: -38.49 },
  { year: 2009, return: 23.45 },
  { year: 2010, return: 12.78 },
  { year: 2011, return: 0.00 },
  { year: 2012, return: 13.41 },
  { year: 2013, return: 29.60 },
  { year: 2014, return: 11.39 },
  { year: 2015, return: -0.73 },
  { year: 2016, return: 9.54 },
  { year: 2017, return: 19.42 },
  { year: 2018, return: -6.24 },
  { year: 2019, return: 28.88 },
  { year: 2020, return: 16.26 },
  { year: 2021, return: 26.89 },
  { year: 2022, return: -19.44 },
  { year: 2023, return: 24.23 },
  { year: 2024, return: 23.31 },
  { year: 2025, return: 8.50 },
];

function computeRollingAverages() {
  const windows = [5, 10, 15, 20];
  const results: Record<number, { avg: number; best: number; worst: number; periods: number; bestPeriod: string; worstPeriod: string }> = {};

  for (const w of windows) {
    let sum = 0;
    let count = 0;
    let best = -Infinity;
    let worst = Infinity;
    let bestPeriod = "";
    let worstPeriod = "";

    for (let i = 0; i <= SP500_RETURNS.length - w; i++) {
      const slice = SP500_RETURNS.slice(i, i + w);
      let product = 1;
      for (const yr of slice) product *= (1 + yr.return / 100);
      const annualized = (Math.pow(product, 1 / w) - 1) * 100;
      sum += annualized;
      count++;
      const period = `${slice[0].year}–${slice[slice.length - 1].year}`;
      if (annualized > best) { best = annualized; bestPeriod = period; }
      if (annualized < worst) { worst = annualized; worstPeriod = period; }
    }

    results[w] = { avg: sum / count, best, worst, periods: count, bestPeriod, worstPeriod };
  }
  return results;
}

const ROLLING_AVERAGES = computeRollingAverages();

/* ─── MYGA BENEFITS & FEATURES ─── */
const MYGA_BENEFITS = [
  { title: "100% Principal Protection", desc: "Your deposit can never lose value. The insurance company guarantees your principal regardless of market conditions.", icon: "shield" },
  { title: "Guaranteed Fixed Rate", desc: "Lock in a rate (currently 5.50%–6.25%) for the entire term. No surprises, no market dependency.", icon: "lock" },
  { title: "Tax-Deferred Growth", desc: "No annual taxes on interest earned. Your money compounds faster than taxable alternatives like CDs or savings accounts.", icon: "dollar" },
  { title: "Creditor Protection", desc: "In most states, annuities are shielded from lawsuits, judgments, and bankruptcy proceedings.", icon: "shield" },
  { title: "Probate Avoidance", desc: "Named beneficiaries receive funds directly — bypassing the costly and time-consuming probate process.", icon: "check" },
];

const MYGA_LIMITATIONS = [
  "Surrender charges apply for early withdrawal beyond 10% free amount (typically 5–9% declining over the guarantee period)",
  "Returns are capped at the guaranteed rate — you cannot earn more even if markets soar",
  "Withdrawals before age 59½ may incur a 10% IRS penalty in addition to income taxes",
  "Interest is taxed as ordinary income when withdrawn (not capital gains rates)",
  "Minimum deposits typically $10,000–$25,000 depending on carrier",
];

/* ─── S&P 500 BENEFITS & FEATURES ─── */
const SP500_BENEFITS = [
  { title: "Higher Long-Term Returns", desc: "The S&P 500 has averaged 9.8% annually over the last 25 years (2001–2025), significantly outpacing fixed-rate products.", icon: "trending" },
  { title: "Inflation Hedge", desc: "Equities historically outpace inflation over long periods, preserving and growing real purchasing power.", icon: "trending" },
  { title: "Dividend Income", desc: "S&P 500 companies pay dividends (currently ~1.3% yield), providing income on top of price appreciation.", icon: "dollar" },
  { title: "Full Liquidity", desc: "Buy or sell any trading day with no surrender charges, lock-up periods, or early withdrawal penalties.", icon: "check" },
  { title: "Capital Gains Tax Rates", desc: "Long-term gains (held 1+ year) are taxed at preferential rates (0%, 15%, or 20%) — lower than ordinary income rates.", icon: "dollar" },
];

const SP500_LIMITATIONS = [
  "No principal protection — you can lose 20%, 30%, even 38%+ in a single year (2008: -38.49%)",
  "Sequence of returns risk — a major crash early in retirement can devastate a portfolio",
  "Dividends and realized gains are taxable annually (no tax deferral without IRA/401k wrapper)",
  "Emotional risk — most investors panic-sell during downturns, locking in losses",
  "No creditor protection in most states — assets can be seized in lawsuits",
  "No guaranteed income — you must manage withdrawals carefully to avoid running out of money",
];

function MYGAvsSP500Section({ premium, mygaRate }: { premium: number; mygaRate: number }) {
  const horizons = [5, 10, 15, 20];

  const comparisonData = useMemo(() => {
    return horizons.map((years) => {
      const mygaValue = premium * Math.pow(1 + mygaRate / 100, years);
      const rolling = ROLLING_AVERAGES[years];
      const sp500Avg = rolling.avg;
      const sp500Value = premium * Math.pow(1 + sp500Avg / 100, years);
      const sp500Best = premium * Math.pow(1 + rolling.best / 100, years);
      const sp500Worst = premium * Math.pow(1 + rolling.worst / 100, years);

      return {
        years,
        mygaValue,
        mygaRate,
        sp500Avg,
        sp500Value,
        sp500Best,
        sp500Worst,
        sp500BestRate: rolling.best,
        sp500WorstRate: rolling.worst,
        bestPeriod: rolling.bestPeriod,
        worstPeriod: rolling.worstPeriod,
        mygaGain: mygaValue - premium,
        sp500AvgGain: sp500Value - premium,
        sp500BestGain: sp500Best - premium,
        sp500WorstGain: sp500Worst - premium,
      };
    });
  }, [premium, mygaRate]);

  const chartData = useMemo(() => {
    return comparisonData.map((d) => ({
      name: `${d.years}-Year`,
      "MYGA Guaranteed": Math.round(d.mygaValue),
      "S&P 500 Average": Math.round(d.sp500Value),
      "S&P 500 Best Case": Math.round(d.sp500Best),
      "S&P 500 Worst Case": Math.round(d.sp500Worst),
    }));
  }, [comparisonData]);

  const annualReturnsChart = useMemo(() => {
    return SP500_RETURNS.map((r) => ({
      year: r.year,
      return: r.return,
      fill: r.return >= 0 ? "#22c55e" : "#ef4444",
    }));
  }, []);

  return (
    <div className="space-y-6">

      {/* Backend Integration Bar */}
      <ClientSelectorBar
        clients={calcIntegration.clients}
        clientsLoading={calcIntegration.clientsLoading}
        selectedClientId={calcIntegration.selectedClientId}
        selectedClientName={calcIntegration.selectedClientName}
        onSelectClient={calcIntegration.selectClient}
        scenarios={calcIntegration.scenarios}
        scenariosLoading={calcIntegration.scenariosLoading}
        scenarioName={calcIntegration.scenarioName}
        onSetScenarioName={calcIntegration.setScenarioName}
        onSave={() => calcIntegration.saveScenario({}, {})}
        onLoad={(s) => calcIntegration.loadScenario(s)}
        isSaving={calcIntegration.isSaving}
        lastSavedAt={calcIntegration.lastSavedAt}
        calculatorName="MYGAFixedRate"
      />
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-blue-600" />
            MYGA Fixed Rate vs S&P 500: Comprehensive Comparison
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Compare the guaranteed safety of a MYGA against the historical performance of the S&P 500
            across 5, 10, 15, and 20-year horizons. Based on actual S&P 500 returns from 2001–2025.
          </p>
        </CardHeader>
      </Card>

      {/* ─── ROLLING AVERAGE RETURNS TABLE ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            S&P 500 Rolling Average Returns (2001–2025)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Annualized geometric returns across all rolling periods in the 25-year dataset.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-blue-600">
                  <th className="text-left p-2 font-semibold">Holding Period</th>
                  <th className="text-right p-2 font-semibold">Average Annual Return</th>
                  <th className="text-right p-2 font-semibold">Best Period</th>
                  <th className="text-right p-2 font-semibold">Worst Period</th>
                  <th className="text-center p-2 font-semibold">MYGA Rate</th>
                  <th className="text-center p-2 font-semibold">Advantage</th>
                </tr>
              </thead>
              <tbody>
                {horizons.map((w) => {
                  const r = ROLLING_AVERAGES[w];
                  const sp500Wins = r.avg > mygaRate;
                  return (
                    <tr key={w} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-semibold">{w}-Year</td>
                      <td className="p-2 text-right font-mono">
                        <span className={sp500Wins ? "text-green-600 font-bold" : "text-muted-foreground"}>
                          {fmtPct(r.avg)}
                        </span>
                      </td>
                      <td className="p-2 text-right">
                        <span className="text-green-600 font-mono">{fmtPct(r.best)}</span>
                        <span className="text-xs text-muted-foreground ml-1">({r.bestPeriod})</span>
                      </td>
                      <td className="p-2 text-right">
                        <span className={`font-mono ${r.worst < 0 ? "text-red-500" : "text-amber-600"}`}>{fmtPct(r.worst)}</span>
                        <span className="text-xs text-muted-foreground ml-1">({r.worstPeriod})</span>
                      </td>
                      <td className="p-2 text-center">
                        <Badge variant="outline" className="text-amber-600 border-amber-600 font-mono">
                          {fmtPct(mygaRate)}
                        </Badge>
                      </td>
                      <td className="p-2 text-center">
                        <Badge className={sp500Wins ? "bg-blue-500/10 text-blue-500 border-blue-500/30" : "bg-amber-500/10 text-amber-500 border-amber-500/30"} variant="outline">
                          {sp500Wins ? `S&P 500 +${fmtPct(r.avg - mygaRate)}` : `MYGA +${fmtPct(mygaRate - r.avg)}`}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 flex items-start gap-3 mt-4">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm">
              <strong>Key Insight:</strong> While the S&P 500 has historically delivered higher <em>average</em> returns,
              the worst-case scenarios show the risk. In the worst 5-year rolling period, the S&P 500 returned just
              <strong className="text-red-500"> {fmtPct(ROLLING_AVERAGES[5].worst)}</strong> annualized — meaning you could have
              <strong> lost money</strong> over 5 years. A MYGA guarantees <strong className="text-green-600">{fmtPct(mygaRate)}</strong> every year, no matter what.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── GROWTH COMPARISON CHART ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Projected Growth: {fmt(premium)} Over Time</CardTitle>
          <p className="text-sm text-muted-foreground">
            MYGA guaranteed value vs S&P 500 average, best, and worst historical outcomes.
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-80 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={v => `$${(v / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Bar dataKey="MYGA Guaranteed" fill="#f59e0b" opacity={0.8} />
                <Bar dataKey="S&P 500 Average" fill="#3b82f6" opacity={0.8} />
                <Line type="monotone" dataKey="S&P 500 Best Case" stroke="#22c55e" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="S&P 500 Worst Case" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Comparison table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-amber-600">
                  <th className="text-left p-2 font-semibold">Time Horizon</th>
                  <th className="text-right p-2 font-semibold text-amber-600">MYGA Guaranteed</th>
                  <th className="text-right p-2 font-semibold text-blue-600">S&P 500 Average</th>
                  <th className="text-right p-2 font-semibold text-green-600">S&P 500 Best</th>
                  <th className="text-right p-2 font-semibold text-red-500">S&P 500 Worst</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((d) => (
                  <tr key={d.years} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-semibold">{d.years}-Year</td>
                    <td className="p-2 text-right">
                      <div className="font-bold text-amber-600">{fmt(d.mygaValue)}</div>
                      <div className="text-xs text-muted-foreground">+{fmt(d.mygaGain)} guaranteed</div>
                    </td>
                    <td className="p-2 text-right">
                      <div className="font-bold text-blue-600">{fmt(d.sp500Value)}</div>
                      <div className="text-xs text-muted-foreground">+{fmt(d.sp500AvgGain)} avg</div>
                    </td>
                    <td className="p-2 text-right">
                      <div className="font-bold text-green-600">{fmt(d.sp500Best)}</div>
                      <div className="text-xs text-green-600">+{fmt(d.sp500BestGain)}</div>
                    </td>
                    <td className="p-2 text-right">
                      <div className={`font-bold ${d.sp500WorstGain < 0 ? "text-red-500" : "text-amber-600"}`}>{fmt(d.sp500Worst)}</div>
                      <div className={`text-xs ${d.sp500WorstGain < 0 ? "text-red-500" : "text-amber-600"}`}>
                        {d.sp500WorstGain < 0 ? "" : "+"}{fmt(d.sp500WorstGain)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ─── S&P 500 ANNUAL RETURNS CHART ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">S&P 500 Annual Returns (2001–2025)</CardTitle>
          <p className="text-sm text-muted-foreground">
            25 years of actual S&P 500 performance. Green bars = positive years, red bars = negative years.
            The dashed line shows the MYGA guaranteed rate for comparison.
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={annualReturnsChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(v: number) => `${v.toFixed(2)}%`} />
                <Bar dataKey="return" name="S&P 500 Return">
                  {annualReturnsChart.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Bar>
                <Line type="monotone" dataKey={() => mygaRate} name={`MYGA Rate (${fmtPct(mygaRate)})`} stroke="#f59e0b" strokeWidth={2} strokeDasharray="8 4" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 text-center">
              <p className="text-xs text-muted-foreground">Positive Years</p>
              <p className="text-xl font-bold text-green-600">{SP500_RETURNS.filter((r) => r.return > 0).length}</p>
              <p className="text-xs text-muted-foreground">of {SP500_RETURNS.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-center">
              <p className="text-xs text-muted-foreground">Negative Years</p>
              <p className="text-xl font-bold text-red-500">{SP500_RETURNS.filter((r) => r.return < 0).length}</p>
              <p className="text-xs text-muted-foreground">of {SP500_RETURNS.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-center">
              <p className="text-xs text-muted-foreground">Best Year</p>
              <p className="text-xl font-bold text-green-600">{fmtPct(Math.max(...SP500_RETURNS.map((r) => r.return)))}</p>
              <p className="text-xs text-muted-foreground">{SP500_RETURNS.find((r) => r.return === Math.max(...SP500_RETURNS.map((r2) => r2.return)))?.year}</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-center">
              <p className="text-xs text-muted-foreground">Worst Year</p>
              <p className="text-xl font-bold text-red-500">{fmtPct(Math.min(...SP500_RETURNS.map((r) => r.return)))}</p>
              <p className="text-xs text-muted-foreground">{SP500_RETURNS.find((r) => r.return === Math.min(...SP500_RETURNS.map((r2) => r2.return)))?.year}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── BENEFITS & FEATURES: SIDE BY SIDE ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MYGA Benefits */}
        <Card className="border-2 border-amber-200 dark:border-amber-800">
          <CardHeader className="bg-amber-50 dark:bg-amber-950/30">
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Lock className="w-5 h-5" /> MYGA Fixed Rate — Benefits & Features
            </CardTitle>
            <p className="text-sm text-muted-foreground">Guaranteed safety with predictable returns</p>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {MYGA_BENEFITS.map((b, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/10">
                <CheckCircle2 className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm">{b.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{b.desc}</p>
                </div>
              </div>
            ))}
            <div className="border-t pt-3 mt-3">
              <p className="font-semibold text-sm text-red-500 flex items-center gap-1 mb-2">
                <XCircle className="w-4 h-4" /> Limitations
              </p>
              {MYGA_LIMITATIONS.map((l, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground mb-1.5">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span>{l}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* S&P 500 Benefits */}
        <Card className="border-2 border-blue-200 dark:border-blue-800">
          <CardHeader className="bg-blue-50 dark:bg-blue-950/30">
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <TrendingUp className="w-5 h-5" /> S&P 500 Index — Benefits & Features
            </CardTitle>
            <p className="text-sm text-muted-foreground">Higher potential returns with market risk</p>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {SP500_BENEFITS.map((b, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/10">
                <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm">{b.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{b.desc}</p>
                </div>
              </div>
            ))}
            <div className="border-t pt-3 mt-3">
              <p className="font-semibold text-sm text-red-500 flex items-center gap-1 mb-2">
                <XCircle className="w-4 h-4" /> Limitations
              </p>
              {SP500_LIMITATIONS.map((l, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground mb-1.5">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span>{l}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── HEAD-TO-HEAD COMPARISON TABLE ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Scale className="w-5 h-5 text-purple-600" /> Head-to-Head: MYGA vs S&P 500
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-purple-600">
                  <th className="text-left p-2 font-semibold">Factor</th>
                  <th className="text-center p-2 font-semibold text-amber-600">MYGA Fixed Rate</th>
                  <th className="text-center p-2 font-semibold text-blue-600">S&P 500 Index</th>
                  <th className="text-center p-2 font-semibold">Winner</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { factor: "Principal Protection", myga: "100% guaranteed", sp500: "None — can lose 38%+ in a year", winner: "myga" },
                  { factor: "Average Annual Return", myga: `${fmtPct(mygaRate)} guaranteed`, sp500: `~${fmtPct(ROLLING_AVERAGES[20].avg)} historical avg`, winner: "sp500" },
                  { factor: "Worst 5-Year Outcome", myga: `+${fmtPct(mygaRate * 5)} total (guaranteed)`, sp500: `${fmtPct(ROLLING_AVERAGES[5].worst * 5)} total`, winner: "myga" },
                  { factor: "Tax Treatment", myga: "Tax-deferred growth", sp500: "Dividends & gains taxed annually", winner: "myga" },
                  { factor: "Liquidity", myga: "10% free/yr, surrender charges", sp500: "Fully liquid any trading day", winner: "sp500" },
                  { factor: "Creditor Protection", myga: "Yes (most states)", sp500: "No (except retirement accounts)", winner: "myga" },
                  { factor: "Fees", myga: "No ongoing fees", sp500: "0.03%–0.10% expense ratio", winner: "tie" },
                  { factor: "Inflation Protection", myga: "Limited — fixed rate may trail inflation", sp500: "Historically outpaces inflation", winner: "sp500" },
                  { factor: "Estate Transfer", myga: "Bypasses probate (named beneficiary)", sp500: "Step-up in basis at death", winner: "tie" },
                  { factor: "Emotional Stress", myga: "Zero — rate is guaranteed", sp500: "High — requires discipline in crashes", winner: "myga" },
                  { factor: "Income Predictability", myga: "100% predictable", sp500: "Variable — depends on market", winner: "myga" },
                  { factor: "Upside Potential", myga: "Capped at guaranteed rate", sp500: "Unlimited — 29%+ in strong years", winner: "sp500" },
                ].map((row, i) => (
                  <tr key={i} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{row.factor}</td>
                    <td className="p-2 text-center text-sm">
                      <span className={row.winner === "myga" ? "text-amber-600 font-semibold" : ""}>{row.myga}</span>
                    </td>
                    <td className="p-2 text-center text-sm">
                      <span className={row.winner === "sp500" ? "text-blue-600 font-semibold" : ""}>{row.sp500}</span>
                    </td>
                    <td className="p-2 text-center">
                      {row.winner === "myga" && <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30" variant="outline">MYGA</Badge>}
                      {row.winner === "sp500" && <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30" variant="outline">S&P 500</Badge>}
                      {row.winner === "tie" && <Badge variant="outline">Tie</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ─── SUITABILITY GUIDANCE ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Shield className="w-5 h-5" /> Choose MYGA When...
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              "You are within 5–10 years of retirement or already retired",
              "You need guaranteed income and cannot afford to lose principal",
              "You want a safe alternative to bank CDs with higher rates",
              "You need creditor protection for your assets",
              "You want tax-deferred growth without market anxiety",
              "You are building a retirement income floor or ladder",
              "You have a large lump sum from a home sale, inheritance, or business exit",
              "You prioritize sleep-at-night safety over maximum returns",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <ArrowRight className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <TrendingUp className="w-5 h-5" /> Choose S&P 500 When...
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              "You have a 15+ year time horizon before needing the money",
              "You can emotionally handle 20–40% drops without panic-selling",
              "You want maximum long-term growth and can accept volatility",
              "You are in a low tax bracket and can benefit from capital gains rates",
              "You need full liquidity with no surrender charges",
              "You are accumulating wealth in your 30s–50s with decades ahead",
              "You already have a guaranteed income floor (pension, Social Security, annuity)",
              "You have a diversified portfolio and this is your growth allocation",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <ArrowRight className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ─── THE HYBRID APPROACH ─── */}
      <Card className="border-2 border-purple-200 dark:border-purple-800">
        <CardHeader className="bg-purple-50 dark:bg-purple-950/30">
          <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
            <Star className="w-5 h-5" /> The Smart Approach: Use Both
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <p className="text-sm">
            The most successful retirement strategies don't choose one or the other — they use <strong>both</strong>.
            A well-designed portfolio allocates a portion to guaranteed instruments (MYGA) for safety and income,
            while maintaining equity exposure (S&P 500) for long-term growth and inflation protection.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-center">
              <p className="text-xs text-muted-foreground">Safety Bucket</p>
              <p className="text-2xl font-bold text-amber-600">40–60%</p>
              <p className="text-xs text-muted-foreground">MYGA + Fixed Annuities</p>
              <p className="text-xs text-amber-600 mt-1">Covers 5–10 years of income</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-center">
              <p className="text-xs text-muted-foreground">Growth Bucket</p>
              <p className="text-2xl font-bold text-blue-600">30–50%</p>
              <p className="text-xs text-muted-foreground">S&P 500 Index Funds</p>
              <p className="text-xs text-blue-600 mt-1">Long-term appreciation</p>
            </div>
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 text-center">
              <p className="text-xs text-muted-foreground">Income Bucket</p>
              <p className="text-2xl font-bold text-green-600">10–20%</p>
              <p className="text-xs text-muted-foreground">FIA with Income Rider</p>
              <p className="text-xs text-green-600 mt-1">Guaranteed lifetime income</p>
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              <strong>Example:</strong> A client with {fmt(premium)} could place {fmt(premium * 0.5)} in a 5-year MYGA at {fmtPct(mygaRate)}
              (earning {fmt(premium * 0.5 * (Math.pow(1 + mygaRate / 100, 5) - 1))} guaranteed over 5 years) and invest {fmt(premium * 0.5)} in
              an S&P 500 index fund for long-term growth. This provides both safety and upside.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Compliance */}
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-xs text-muted-foreground space-y-2">
              <p className="font-semibold text-amber-600">Important Disclosures</p>
              <p>
                S&P 500 returns shown are historical total returns (price appreciation + dividends) and do not account for
                taxes, fees, or inflation. Past performance does not guarantee future results. The S&P 500 is an unmanaged
                index and cannot be invested in directly. Index fund returns will differ due to fees and tracking error.
              </p>
              <p>
                MYGA rates shown are current as of the illustration date and are subject to change. Guarantees are backed
                by the financial strength and claims-paying ability of the issuing insurance company. Products may not be
                available in all states. This comparison is for educational purposes only and does not constitute investment advice.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function MYGAFixedRate() {
  const calcIntegration = useCalculatorIntegration({
    calculatorName: "MYGAFixedRate",
    strategyType: "annuity-income",
  });

  const [premium, setPremium] = useState(4000000);
  const [rate, setRate] = useState(6.25);
  const [years, setYears] = useState(20);
  const [stateCode, setStateCode] = useState<StateCode>("FL");
  const [pendingState, setPendingState] = useState<StateCode>("FL");
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [wfPremium, setWfPremium] = useState(500000);
  const [wfMygaRate, setWfMygaRate] = useState(7);
  const [wfBankLoanRate, setWfBankLoanRate] = useState(7);
  const [wfOilGasReturn, setWfOilGasReturn] = useState(15);
  const [wfOilGasTerm, setWfOilGasTerm] = useState(12);
  const [wfAdditional, setWfAdditional] = useState(0);
  const [wfProjectionYears, setWfProjectionYears] = useState(25);
  const [wfCds, setWfCds] = useState(0);
  const [wfMoneyMarkets, setWfMoneyMarkets] = useState(0);
  const [wfChecking, setWfChecking] = useState(0);
  const [wfSavings, setWfSavings] = useState(0);

  const [wfAnnualIncome, setWfAnnualIncome] = useState(0);
  const [wfFederalTaxRate, setWfFederalTaxRate] = useState(32);
  const [wfStateTaxRate, setWfStateTaxRate] = useState(5);
  const [wfHomeValue, setWfHomeValue] = useState(0);
  const [wfMortgageBalance, setWfMortgageBalance] = useState(0);
  const [wfHelocRate, setWfHelocRate] = useState(8.5);
  const [wfHelocMaxLtv, setWfHelocMaxLtv] = useState(0.80);
  const [wfTaxDeployment, setWfTaxDeployment] = useState<TaxDeploymentOption>("optimal_blend");
  const [showScenarioComparison, setShowScenarioComparison] = useState(false);

  const { data: clientData } = useClientData();
  useEffect(() => {
    if (!clientData) return;
    if (clientData.annualIncome) {
      setPremium(Math.round(clientData.annualIncome * 3));
      setWfAnnualIncome(clientData.annualIncome);
    }
    if (clientData.state) {
      setStateCode(clientData.state as StateCode);
      setPendingState(clientData.state as StateCode);
    }
    if (clientData.cashSavings) {
      const total = clientData.cashSavings;
      setWfCds(Math.round(total * 0.4));
      setWfMoneyMarkets(Math.round(total * 0.3));
      setWfChecking(Math.round(total * 0.2));
      setWfSavings(Math.round(total * 0.1));
      setWfPremium(Math.round(total * 0.5));
    }
    if (clientData.homeValue) setWfHomeValue(clientData.homeValue);
    if (clientData.mortgageBalance) setWfMortgageBalance(clientData.mortgageBalance);
    if (clientData.helocRate) setWfHelocRate(clientData.helocRate);
  }, [clientData]);

  const waterfallResult = useMemo(() => {
    const wfInput: MYGAWaterfallInput = {
      mygaPremium: wfPremium,
      mygaRate: wfMygaRate,
      mygaTerm: 5,
      bankLtv: 0.70,
      bankLoanRate: wfBankLoanRate,
      bankLoanTerm: 5,
      oilGasTerm: wfOilGasTerm,
      oilGasReturnRate: wfOilGasReturn,
      oilGasDepreciationY1: 80,
      oilGasDepreciationOngoing: 8,
      projectionYears: wfProjectionYears,
      cashEquivalents: { cds: wfCds, moneyMarkets: wfMoneyMarkets, checking: wfChecking, savings: wfSavings },
      additionalMygaPerCycle: wfAdditional,
      annualIncome: wfAnnualIncome,
      federalTaxRate: wfFederalTaxRate,
      stateTaxRate: wfStateTaxRate,
      homeValue: wfHomeValue,
      mortgageBalance: wfMortgageBalance,
      helocRate: wfHelocRate,
      helocMaxLtv: wfHelocMaxLtv,
      taxDeployment: wfTaxDeployment,
    };
    return runMYGAWaterfall(wfInput);
  }, [wfPremium, wfMygaRate, wfBankLoanRate, wfOilGasReturn, wfOilGasTerm, wfAdditional, wfProjectionYears, wfCds, wfMoneyMarkets, wfChecking, wfSavings, wfAnnualIncome, wfFederalTaxRate, wfStateTaxRate, wfHomeValue, wfMortgageBalance, wfHelocRate, wfHelocMaxLtv, wfTaxDeployment]);

  const scenarioComparison = useMemo<ScenarioComparison | null>(() => {
    if (!showScenarioComparison || wfAnnualIncome <= 0) return null;
    return runScenarioComparison({
      mygaPremium: wfPremium,
      mygaRate: wfMygaRate,
      mygaTerm: 5,
      bankLtv: 0.70,
      bankLoanRate: wfBankLoanRate,
      bankLoanTerm: 5,
      oilGasTerm: wfOilGasTerm,
      oilGasReturnRate: wfOilGasReturn,
      oilGasDepreciationY1: 80,
      oilGasDepreciationOngoing: 8,
      projectionYears: wfProjectionYears,
      cashEquivalents: { cds: wfCds, moneyMarkets: wfMoneyMarkets, checking: wfChecking, savings: wfSavings },
      additionalMygaPerCycle: wfAdditional,
      annualIncome: wfAnnualIncome,
      federalTaxRate: wfFederalTaxRate,
      stateTaxRate: wfStateTaxRate,
      homeValue: wfHomeValue,
      mortgageBalance: wfMortgageBalance,
      helocRate: wfHelocRate,
      helocMaxLtv: wfHelocMaxLtv,
      taxDeployment: wfTaxDeployment,
    });
  }, [showScenarioComparison, wfPremium, wfMygaRate, wfBankLoanRate, wfOilGasReturn, wfOilGasTerm, wfAdditional, wfProjectionYears, wfCds, wfMoneyMarkets, wfChecking, wfSavings, wfAnnualIncome, wfFederalTaxRate, wfStateTaxRate, wfHomeValue, wfMortgageBalance, wfHelocRate, wfHelocMaxLtv, wfTaxDeployment]);

  const stackedOGChartData = useMemo(() => {
    return waterfallResult.projection.map((row) => {
      const base: Record<string, number | string> = {
        year: row.year,
        label: `Yr ${row.year}`,
        bankLoanPayment: row.bankLoanTotalPayment,
        totalOGIncome: row.oilGasIncome,
      };
      for (const t of waterfallResult.trancheInfo) {
        base[t.trancheKey] = row.ogTrancheIncome[t.trancheKey] || 0;
      }
      return base;
    });
  }, [waterfallResult]);

  const mygaCascadeData = useMemo(() => {
    return waterfallResult.projection.map((row) => ({
      year: row.year,
      mygaValue: row.mygaEndValue,
      mygaInterest: row.mygaInterestEarned,
      rollover: row.mygaRolloverAmount > 0 ? row.mygaRolloverAmount : undefined,
      cycleStart: row.cycleYear === 1,
    }));
  }, [waterfallResult]);

  const loanWipeoutData = useMemo(() => {
    return waterfallResult.projection.map((row) => ({
      year: row.year,
      ogIncome: row.oilGasIncome,
      loanInterest: row.bankLoanInterestPaid,
      loanPayment: row.bankLoanTotalPayment,
      surplus: Math.max(0, row.oilGasIncome - row.bankLoanInterestPaid),
      deficit: Math.max(0, row.bankLoanInterestPaid - row.oilGasIncome),
      excessToPrincipal: row.excessOGToPrincipal,
      loanBalance: row.bankLoanEndBalance,
      netCashFlow: row.netCashFlow,
      cumPureProfit: row.cumulativeOGPureProfit,
      isMaturityYear: row.isMaturityYear,
      maturityPayoff: row.maturityPrincipalPayoff,
      maturityRedeploy: row.maturityRedeployAmount,
      taxSavingsReinvested: row.taxSavings,
      cumTaxReinvested: row.cumulativeTaxSavingsReinvested,
    }));
  }, [waterfallResult]);

  const mygaProducts = useMemo(() => getTopProductsForState(stateCode, "myga", 10), [stateCode]);
  const guaranty = useMemo(() => getStateGuaranty(stateCode), [stateCode]);
  const splitRec = useMemo(() => getCarrierSplitRecommendation(premium, stateCode), [premium, stateCode]);

  const handleUpdate = useCallback(() => {
    if (pendingState === stateCode && lastUpdated) {
      toast.info(`Already showing top 10 MYGAs for ${getStateName(pendingState)}`);
      return;
    }
    setIsUpdating(true);
    setTimeout(() => {
      setStateCode(pendingState);
      setIsUpdating(false);
      setLastUpdated(new Date());
      const newProducts = getTopProductsForState(pendingState, "myga", 10);
      toast.success(
        `Updated! Showing top ${newProducts.length} MYGAs for ${getStateName(pendingState)}`,
        {
          description: `Best 5-year rate: ${newProducts[0]?.term5yr?.toFixed(2) || "N/A"}% from ${newProducts[0]?.carrier || "N/A"} (${newProducts[0]?.amBest || "N/A"}, COMDEX ${newProducts[0]?.comdex || "N/A"})`,
          duration: 5000,
        }
      );
    }, 800);
  }, [pendingState, stateCode, lastUpdated]);

  const projection = useMemo(() => generateProjection(premium, rate, MIN_RATE, years), [premium, rate, years]);

  const chartData = useMemo(() => {
    return projection.map((row) => ({
      name: `Yr ${row.year}`,
      age: row.age,
      "If Rate Continues": row.contractValue,
      "Guaranteed (6.25% then 2.40%)": row.guaranteedValue,
      "Minimum (2.40% all years)": row.minimumValue,
    }));
  }, [projection]);

  const year5Value = projection[5]?.guaranteedValue || 0;
  const year10Value = projection[10]?.guaranteedValue || 0;
  const year20Value = projection[20]?.guaranteedValue || 0;

  return (
    <AppShell>
      <div className="container py-6 space-y-6" id="myga-fixed-rate">
        <CalculationSyncBar />
        <PlatformEnhancements
            pageTitle="MYGA Fixed Rate Waterfall"
            strategy="myga-waterfall"
            monteCarloConfig={{ years: 20, initialValue: 500000, preset: "mygaFixed" }}
        />

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="MYGAFixedRate" />

        <ExecutiveSummary
          pageTitle="MYGA Fixed Rate"
          whatItDoes="This financial analysis tool provides institutional-grade analysis of your financial situation, modeling multiple scenarios and projecting outcomes based on your specific inputs. It transforms complex financial analysis concepts into clear, actionable insights with dollar-quantified recommendations."
          opportunities="This tool reveals insights that most clients never see because they don\'t have access to institutional-grade analysis. The data here can change how you think about your entire financial picture."
          intent="To give you the same caliber of financial analysis analysis that institutional investors and ultra-high-net-worth families receive — now accessible to every client."
          takeaway="Understanding your financial analysis options with precise dollar amounts empowers you to make confident decisions that compound into significant wealth over time."
          callToAction="Enter your numbers and see exactly how financial analysis strategies can improve your financial outcome."
          followUpQuestions={[
            "How does this financial analysis strategy interact with my other financial plans?",
            "What\'s the single biggest financial analysis opportunity I\'m currently missing?",
            "How would my results change if I started this strategy 5 years earlier?",
          ]}
        />
        <GoalsAccelerator pageName="MYGA Fixed Rate" pageContext="MYGA Fixed Rate — financial analysis modeling with projections and scenario analysis" />
        <TaxBracketPanel grossIncome={clientData?.annualIncome || 150000} filingStatus={clientData?.filingStatus || "single"} stateCode={clientData?.state || "TX"} />
        <RecommendationSummary
          headline="This financial analysis strategy can significantly improve your financial outcome"
          detail="Based on your profile, implementing the recommended financial analysis approach could generate substantial savings and growth over your planning horizon."
          dollarBenefit={200000}
          timeHorizon="20 years"
          confidence="high"
          nextStep="Review with your advisor"
        />
        <DoNothingBaseline
          metrics={[
            { label: "Financial Clarity Score", doNothing: 40, recommended: 90, format: "percent" },
            { label: "Optimization Potential", doNothing: 0, recommended: 200000, format: "currency" },
            { label: "Decision Confidence", doNothing: 35, recommended: 92, format: "percent" },
          ]}
          summary="Without taking action on financial analysis, you leave significant value on the table that compounds into a major opportunity cost over time."
        />
        {/* ─── HEADER ─── */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="bg-gradient-to-r from-amber-600 to-yellow-500 text-white text-sm px-3 py-1">
                <Lock className="w-4 h-4 mr-1" /> Guaranteed Fixed Rate
              </Badge>
              <Badge variant="outline" className="text-green-600 border-green-600">
                <Shield className="w-3 h-3 mr-1" /> 100% Principal Protected
              </Badge>
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                <Star className="w-3 h-3 mr-1" /> 6.25% Guaranteed
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <ExportToSlides
                toolName="MYGA Fixed Rate Waterfall"
                getSections={() => [
                  {
                    title: "Illustration Details",
                    items: [
                      { label: "Premium Amount", value: fmt(premium) },
                      { label: "Guaranteed Rate", value: fmtPct(rate) },
                      { label: "Year 5 Guaranteed Value", value: fmt(year5Value) },
                      { label: "Interest Earned (5 Years)", value: fmt(year5Value - premium) },
                    ]
                  },
                  {
                    title: "State Guaranty",
                    items: [
                      { label: "State", value: getStateName(stateCode) },
                      { label: "Annuity Guaranty Limit", value: fmt(guaranty.annuityLimit) },
                      { label: "Guaranty Tier", value: guaranty.tier },
                      { label: "Recommended Carrier Split", value: String(splitRec.splitCount) },
                    ]
                  }
                ]}
              />
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">Amazing MYGA Waterfall</h1>
          <p className="text-muted-foreground max-w-3xl">
            The safest way to grow your money with a <strong>guaranteed fixed interest rate</strong>.
            Like a CD from a bank, but with <strong>higher rates, tax-deferred growth, and stronger protection</strong>.
            Your principal is 100% guaranteed by the insurance company — no market risk, no interest rate risk,
            no credit risk during the guarantee period.
          </p>
        </div>

        {/* ─── STATE SELECTOR + UPDATE BUTTON ─── */}
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="py-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs font-semibold flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-400" /> Client State of Residence
                </Label>
                <Select value={pendingState} onValueChange={v => setPendingState(v as StateCode)}>
                  <SelectTrigger className="mt-1 border-emerald-500/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((s) => (
                      <SelectItem key={s.code} value={s.code}>{s.name} ({s.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col justify-end">
                <Button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className={`${
                    pendingState !== stateCode
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30 animate-pulse"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                >
                  {isUpdating ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...</>
                  ) : (
                    <><RefreshCw className={`w-4 h-4 mr-2 ${pendingState !== stateCode ? "animate-spin" : ""}`} /> Update MYGAs</>
                  )}
                </Button>
                {pendingState !== stateCode && (
                  <p className="text-xs text-amber-400 mt-1 animate-pulse">
                    Press Update to load {getStateName(pendingState)} MYGAs
                  </p>
                )}
                {lastUpdated && pendingState === stateCode && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-muted/10">
                  <p className="text-xs text-muted-foreground">Annuity Guaranty</p>
                  <p className="text-lg font-bold text-emerald-400">{fmt(guaranty.annuityLimit)}</p>
                </div>
                <Badge variant="outline" className={`text-xs ${guaranty.tier === "Premium" ? "border-emerald-500/50 text-emerald-400" : guaranty.tier === "Enhanced" ? "border-blue-500/50 text-blue-400" : guaranty.tier === "Below Standard" ? "border-red-500/50 text-red-400" : "border-slate-500/50 text-slate-400"}`}>
                  {guaranty.tier}
                </Badge>
              </div>
              {splitRec.splitCount > 1 && (
                <div className="flex items-center">
                  <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-xs">
                    <AlertTriangle className="w-3 h-3 mr-1" /> Split across {splitRec.splitCount} carriers recommended
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ─── PREMIUM INPUT ─── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" /> Your MYGA Illustration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label>Premium Amount</Label>
                <NumberInput value={premium} onChange={setPremium} className="mt-1"/>
              </div>
              <div>
                <Label>Guaranteed Rate (%)</Label>
                <NumberInput value={rate} onChange={setRate} step={0.05} className="mt-1" />
              </div>
              <div className="flex flex-col justify-end">
                <Label className="text-muted-foreground text-xs">Year 5 Guaranteed Value</Label>
                <div className="text-xl font-bold text-green-600 mt-1">{fmt(year5Value)}</div>
                <div className="text-xs text-muted-foreground">
                  +{fmt(year5Value - premium)} earned ({fmtPct((year5Value / premium - 1) * 100)} total)
                </div>
              </div>
              <div className="flex flex-col justify-end">
                <Label className="text-muted-foreground text-xs">Interest Earned (5 Years)</Label>
                <div className="text-xl font-bold text-amber-600 mt-1">{fmt(year5Value - premium)}</div>
                <div className="text-xs text-muted-foreground">Tax-deferred — no annual taxes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── TABS ─── */}
        <Tabs defaultValue="what-is-myga" className="space-y-4">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1">
            <TabsTrigger value="what-is-myga" className="text-xs sm:text-sm">
              <Info className="w-4 h-4 mr-1" /> What Is a MYGA?
            </TabsTrigger>
            <TabsTrigger value="illustration" className="text-xs sm:text-sm">
              <BarChart3 className="w-4 h-4 mr-1" /> Growth Illustration
            </TabsTrigger>
            <TabsTrigger value="safety" className="text-xs sm:text-sm">
              <Shield className="w-4 h-4 mr-1" /> Insurance vs FDIC
            </TabsTrigger>
            <TabsTrigger value="guaranty" className="text-xs sm:text-sm">
              <Landmark className="w-4 h-4 mr-1" /> State Guaranty
            </TabsTrigger>
            <TabsTrigger value="rates" className="text-xs sm:text-sm">
              <TrendingUp className="w-4 h-4 mr-1" /> Current Rates
            </TabsTrigger>
            <TabsTrigger value="myga-vs-sp500" className="text-xs sm:text-sm">
              <Scale className="w-4 h-4 mr-1" /> MYGA vs S&P 500
            </TabsTrigger>
            <TabsTrigger value="waterfall" className="text-xs sm:text-sm bg-gradient-to-r from-amber-500/20 to-emerald-500/20 border border-amber-500/30 font-bold">
              <Zap className="w-4 h-4 mr-1 text-amber-400" /> Amazing MYGA Waterfall
            </TabsTrigger>
            <TabsTrigger value="multi-property" className="text-xs sm:text-sm bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 font-bold">
              <Home className="w-4 h-4 mr-1 text-purple-400" /> Multi-Property Engine
            </TabsTrigger>
          
            <TabsTrigger value="generate-outcome" className="text-xs sm:text-sm bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 font-bold">Generate Outcome</TabsTrigger>
          </TabsList>

          {/* ═══════════ TAB 1: WHAT IS A MYGA ═══════════ */}
          <TabsContent value="what-is-myga" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  What Is a Multi-Year Guaranteed Annuity (MYGA)?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-6">
                  <p className="text-lg leading-relaxed">
                    A <strong>MYGA</strong> is a fixed annuity that guarantees a specific interest rate for a set number
                    of years — typically 3, 5, 7, or 10 years. Think of it as a <strong>CD from an insurance company</strong>,
                    but with significantly better rates, tax advantages, and stronger safety protections.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" /> How MYGAs Work
                    </h3>
                    {[
                      "You deposit a single premium (lump sum) with an insurance company",
                      "The insurance company guarantees a fixed interest rate for the entire term (e.g., 6.25% for 5 years)",
                      "Your money grows tax-deferred — you pay no taxes until you withdraw",
                      "At the end of the guarantee period, you can renew at a new rate, withdraw, or roll into another annuity (1035 exchange)",
                      "Your principal is 100% guaranteed — it can never go down",
                      "Most MYGAs allow 10% penalty-free withdrawals annually after the first year",
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-green-600">{i + 1}</span>
                        </div>
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Star className="w-5 h-5 text-amber-600" /> Why Choose a MYGA Over a Bank CD?
                    </h3>
                    {[
                      { title: "Higher Rates", desc: "MYGAs consistently offer 1-2% higher rates than bank CDs for the same term length" },
                      { title: "Tax-Deferred Growth", desc: "No annual taxes on interest earned — your money compounds faster than a taxable CD" },
                      { title: "Stronger Protection", desc: "Insurance company reserves are more conservative than bank reserves (see Safety tab)" },
                      { title: "Creditor Protection", desc: "In most states, annuities are protected from lawsuits, judgments, and bankruptcy" },
                      { title: "No Market Risk", desc: "Unlike stocks, bonds, or even some bank investments, your rate is locked and guaranteed" },
                      { title: "Estate Planning", desc: "Named beneficiaries bypass probate — your heirs receive funds directly" },
                    ].map((item, i) => (
                      <div key={i} className="p-3 rounded-lg border bg-card">
                        <div className="font-semibold text-sm text-amber-600">{item.title}</div>
                        <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* MYGA vs CD comparison */}
                <Card className="border-2 border-amber-200 dark:border-amber-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">MYGA vs Bank CD: Side-by-Side</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="border-b-2 border-amber-600">
                            <th className="text-left p-2 font-semibold">Feature</th>
                            <th className="text-center p-2 font-semibold text-amber-600">MYGA</th>
                            <th className="text-center p-2 font-semibold text-gray-500">Bank CD</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { feature: "5-Year Rate (2025)", myga: "5.50% – 6.25%", cd: "4.00% – 4.75%", mygaWins: true },
                            { feature: "Tax Treatment", myga: "Tax-deferred", cd: "Taxed annually", mygaWins: true },
                            { feature: "FDIC/Guaranty Coverage", myga: "$250K–$500K (state)", cd: "$250K (federal)", mygaWins: true },
                            { feature: "Reserve Requirements", myga: "100%+ of obligations", cd: "8-10% capital ratio", mygaWins: true },
                            { feature: "Creditor Protection", myga: "Yes (most states)", cd: "No", mygaWins: true },
                            { feature: "Probate Avoidance", myga: "Yes (named beneficiary)", cd: "No (goes through estate)", mygaWins: true },
                            { feature: "Early Withdrawal", myga: "10% free/yr, then surrender charge", cd: "Early withdrawal penalty", mygaWins: false },
                            { feature: "Minimum Deposit", myga: "$10,000–$25,000", cd: "$500–$1,000", mygaWins: false },
                            { feature: "Issuer Type", myga: "Insurance company", cd: "Bank/Credit Union", mygaWins: false },
                          ].map((row, i) => (
                            <tr key={i} className="border-b hover:bg-muted/50">
                              <td className="p-2 font-medium">{row.feature}</td>
                              <td className="p-2 text-center">
                                <span className={row.mygaWins ? "text-green-600 font-semibold" : ""}>
                                  {row.myga}
                                </span>
                                {row.mygaWins && <CheckCircle2 className="w-3 h-3 text-green-600 inline ml-1" />}
                              </td>
                              <td className="p-2 text-center text-muted-foreground">{row.cd}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Who should consider */}
                <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <BadgeCheck className="w-5 h-5 text-green-600" /> Who Should Consider a MYGA?
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      "Retirees seeking safe, predictable growth",
                      "Anyone with large CD balances earning lower rates",
                      "Pre-retirees building a guaranteed income floor",
                      "High-net-worth individuals needing creditor protection",
                      "People who want tax-deferred growth on safe money",
                      "Anyone uncomfortable with stock market volatility",
                      "Estate planners wanting to avoid probate",
                      "Business owners protecting assets from lawsuits",
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <ArrowRight className="w-4 h-4 text-green-600 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════ TAB 2: GROWTH ILLUSTRATION ═══════════ */}
          <TabsContent value="illustration" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  Sentinel Security Life — {fmtPct(rate)} Guaranteed MYGA
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Personal Choice Multi-Year Guarantee Annuity. {fmtPct(rate)} guaranteed for {GUARANTEE_PERIOD} years,
                  then {fmtPct(MIN_RATE)} minimum guaranteed rate thereafter. <em>Illustration purposes only.</em>
                </p>
              </CardHeader>
              <CardContent>
                {/* Growth chart */}
                <div className="h-80 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={1} />
                      <YAxis tickFormatter={v => `$${(v / 1000000).toFixed(1)}M`} />
                      <Tooltip formatter={(v: number) => fmt(v)} />
                      <Legend />
                      <Area type="monotone" dataKey="If Rate Continues" stroke="#16a34a" fill="#16a34a" fillOpacity={0.15} strokeWidth={2} />
                      <Area type="monotone" dataKey="Guaranteed (6.25% then 2.40%)" stroke="#2563eb" fill="#2563eb" fillOpacity={0.1} strokeWidth={2} />
                      <Area type="monotone" dataKey="Minimum (2.40% all years)" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.05} strokeWidth={1.5} strokeDasharray="5 5" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Projection table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b-2 border-green-600">
                        <th className="text-left p-2 font-semibold whitespace-nowrap">Year</th>
                        <th className="text-left p-2 font-semibold whitespace-nowrap">Age</th>
                        <th className="text-right p-2 font-semibold whitespace-nowrap">Guaranteed Value</th>
                        <th className="text-right p-2 font-semibold whitespace-nowrap">Interest Earned</th>
                        <th className="text-right p-2 font-semibold whitespace-nowrap">Surrender Charge</th>
                        <th className="text-right p-2 font-semibold whitespace-nowrap">Cash Surrender</th>
                        <th className="text-left p-2 font-semibold whitespace-nowrap">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projection.slice(0, 21).map((row) => (
                        <tr
                          key={row.year}
                          className={`border-b hover:bg-muted/50 ${row.year === 5 ? "bg-green-50 dark:bg-green-950/20 font-semibold" : ""} ${row.year === 10 || row.year === 20 ? "bg-blue-50 dark:bg-blue-950/20 font-semibold" : ""}`}
                        >
                          <td className="p-2">{row.year}</td>
                          <td className="p-2">{row.age}</td>
                          <td className="p-2 text-right font-medium">{fmt(row.guaranteedValue)}</td>
                          <td className="p-2 text-right text-green-600">
                            {row.year > 0 ? `+${fmt(row.guaranteedValue - premium)}` : "—"}
                          </td>
                          <td className="p-2 text-right">
                            {row.surrenderCharge > 0 ? (
                              <span className="text-red-500">{row.surrenderCharge}%</span>
                            ) : (
                              <span className="text-green-600">0%</span>
                            )}
                          </td>
                          <td className="p-2 text-right">{fmt(row.cashSurrender)}</td>
                          <td className="p-2">
                            <Badge variant="outline" className={row.year <= GUARANTEE_PERIOD ? "text-green-600 border-green-600" : "text-amber-600 border-amber-600"}>
                              {row.year <= GUARANTEE_PERIOD ? fmtPct(rate) : fmtPct(MIN_RATE)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Key milestones */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                    <CardContent className="pt-4 text-center">
                      <div className="text-sm text-muted-foreground">Year 5 (End of Guarantee)</div>
                      <div className="text-xl font-bold text-green-600">{fmt(year5Value)}</div>
                      <div className="text-xs text-green-600 font-semibold">
                        +{fmt(year5Value - premium)} interest earned
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">0% surrender charge — fully liquid</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                    <CardContent className="pt-4 text-center">
                      <div className="text-sm text-muted-foreground">Year 10</div>
                      <div className="text-xl font-bold text-blue-600">{fmt(year10Value)}</div>
                      <div className="text-xs text-blue-600 font-semibold">
                        +{fmt(year10Value - premium)} total growth
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Can renew or 1035 exchange</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30">
                    <CardContent className="pt-4 text-center">
                      <div className="text-sm text-muted-foreground">Year 20</div>
                      <div className="text-xl font-bold text-amber-600">{fmt(year20Value)}</div>
                      <div className="text-xs text-amber-600 font-semibold">
                        {((year20Value / premium - 1) * 100).toFixed(1)}% total return
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Conservative guaranteed growth</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4 flex items-start gap-3 mt-4">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <strong>Surrender Schedule:</strong> Year 1: 9%, Year 2: 8%, Year 3: 7%, Year 4: 6%, Year 5: 5%.
                    After the 5-year guarantee period, <strong>0% surrender charge</strong> — your money is fully liquid.
                    10% penalty-free withdrawals are available annually after the first year.
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════ TAB 3: INSURANCE vs FDIC SAFETY ═══════════ */}
          <TabsContent value="safety" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  Why Your Money Is Safer with an Insurance Company Than a Bank
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Most people assume FDIC-insured banks are the safest place for their money. The reality is that
                  insurance companies have <strong>stronger reserve requirements, better regulatory oversight,
                  and a superior track record</strong> of protecting policyholders.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* The big picture */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-2 border-red-200 dark:border-red-800">
                    <CardContent className="pt-4">
                      <div className="text-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mx-auto">
                          <Building2 className="w-8 h-8 text-red-600" />
                        </div>
                        <h3 className="font-bold text-lg mt-2">Banks (FDIC)</h3>
                        <Badge className="bg-red-100 text-red-700 mt-1">Higher Risk</Badge>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                          <span>Hold only <strong>8-10%</strong> of deposits in reserves — the rest is lent out</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                          <span>Invest in risky commercial loans, real estate, and derivatives</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                          <span><strong>563 bank failures</strong> since 2001 — 3 major failures in 2023 alone</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                          <span>FDIC covers only <strong>$250,000</strong> per depositor per bank</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                          <span>No creditor protection — deposits can be seized by lawsuits</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                          <span>Interest taxed annually as ordinary income</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-green-200 dark:border-green-800">
                    <CardContent className="pt-4">
                      <div className="text-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto">
                          <Shield className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="font-bold text-lg mt-2">Insurance Companies</h3>
                        <Badge className="bg-green-100 text-green-700 mt-1">Safer</Badge>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                          <span>Must hold <strong>100%+ reserves</strong> for every dollar of obligations</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                          <span>Invest primarily in <strong>investment-grade bonds</strong> (70%+) and government securities</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                          <span>Insurance company failures are <strong>extremely rare</strong> — policyholders almost always made whole</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                          <span>State guaranty covers <strong>$250K–$500K</strong> per policy (varies by state)</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                          <span><strong>Creditor protection</strong> in most states — shielded from lawsuits</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                          <span><strong>Tax-deferred growth</strong> — no annual taxes on interest earned</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed comparison table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b-2 border-green-600">
                        <th className="text-left p-3 font-semibold">Category</th>
                        <th className="text-left p-3 font-semibold text-red-600">
                          <Building2 className="w-4 h-4 inline mr-1" /> Banks (FDIC)
                        </th>
                        <th className="text-left p-3 font-semibold text-green-600">
                          <Shield className="w-4 h-4 inline mr-1" /> Insurance Companies
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {SAFETY_COMPARISON.map((row, i) => (
                        <tr key={i} className="border-b hover:bg-muted/50">
                          <td className="p-3 font-medium align-top whitespace-nowrap">{row.feature}</td>
                          <td className={`p-3 align-top ${row.winner === "fdic" ? "text-green-600" : "text-muted-foreground"}`}>
                            {row.fdic}
                          </td>
                          <td className={`p-3 align-top ${row.winner === "insurance" ? "font-medium" : "text-muted-foreground"}`}>
                            {row.winner === "insurance" && <CheckCircle2 className="w-4 h-4 text-green-600 inline mr-1" />}
                            {row.insurance}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Reserve requirement visualization */}
                <Card className="border-2 border-blue-200 dark:border-blue-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Scale className="w-5 h-5 text-blue-600" />
                      Reserve Requirements: The Critical Difference
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-red-600 mb-2">Bank: For Every $100 Deposited</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="h-6 bg-red-200 dark:bg-red-900 rounded" style={{ width: "8%" }} />
                            <div className="h-6 bg-red-500 rounded flex-1 flex items-center justify-center text-white text-xs font-semibold">
                              $90–92 Lent Out (Loans, Real Estate, Derivatives)
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Only $8–10 kept in reserves. If loans default, your deposits are at risk above $250K FDIC limit.
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-600 mb-2">Insurance Co: For Every $100 in Obligations</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="h-6 bg-green-500 rounded flex-1 flex items-center justify-center text-white text-xs font-semibold">
                              $100+ Held in Reserves (Bonds, Gov Securities)
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Dollar-for-dollar reserves required by law. Invested in safe, investment-grade assets. Your money is fully backed.
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Bank failures callout */}
                <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" /> Recent Bank Failures — A Wake-Up Call
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { name: "Silicon Valley Bank", assets: "$209 Billion", year: "March 2023", note: "Largest failure since 2008" },
                      { name: "First Republic Bank", assets: "$229 Billion", year: "May 2023", note: "2nd largest in US history" },
                      { name: "Signature Bank", assets: "$110 Billion", year: "March 2023", note: "3rd largest in US history" },
                    ].map((bank) => (
                      <Card key={bank.name} className="border-red-200 dark:border-red-800">
                        <CardContent className="pt-4 text-center">
                          <div className="font-bold text-red-600">{bank.name}</div>
                          <div className="text-xl font-bold mt-1">{bank.assets}</div>
                          <div className="text-xs text-muted-foreground">{bank.year}</div>
                          <div className="text-xs text-red-500 mt-1">{bank.note}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <p className="text-sm mt-4">
                    <strong>563 banks have failed since 2001.</strong> Depositors with balances above the $250,000 FDIC limit
                    faced uncertainty and potential losses. In contrast, insurance company failures are extremely rare,
                    and when they do occur, state guaranty associations ensure policyholders are made whole.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════ TAB 4: STATE GUARANTY ASSOCIATIONS ═══════════ */}
          <TabsContent value="guaranty" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-blue-600" />
                  State Guaranty Association Coverage
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Every state has a guaranty association that protects policyholders if an insurance company
                  becomes insolvent. Coverage limits vary by state — many states provide <strong>$300,000–$500,000</strong> per
                  annuity contract, exceeding the $250,000 FDIC limit.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <strong>How It Works:</strong> If an insurance company fails, the state guaranty association
                    steps in to transfer policies to a healthy insurer. Policyholders typically continue receiving
                    benefits without interruption, up to the state coverage limit. This is funded by assessments
                    on all insurance companies operating in that state — creating a collective safety net.
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b-2 border-blue-600">
                        <th className="text-left p-2 font-semibold">State</th>
                        <th className="text-right p-2 font-semibold">Annuity Coverage</th>
                        <th className="text-right p-2 font-semibold">Life Insurance Coverage</th>
                        <th className="text-center p-2 font-semibold">vs FDIC ($250K)</th>
                        <th className="text-center p-2 font-semibold">Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Highlight selected state first, then show all states */}
                      {US_STATES.map((s) => {
                        const g = getStateGuaranty(s.code as StateCode);
                        const isSelected = s.code === stateCode;
                        return (
                          <tr key={s.code} className={`border-b hover:bg-muted/50 ${isSelected ? "bg-emerald-50 dark:bg-emerald-950/20 font-semibold" : g.annuityLimit >= 500000 ? "bg-green-50 dark:bg-green-950/10" : ""}`}>
                            <td className="p-2 font-medium">
                              {isSelected && <MapPin className="w-3 h-3 inline mr-1 text-emerald-500" />}
                              {s.name}
                            </td>
                            <td className="p-2 text-right font-mono">{fmt(g.annuityLimit)}</td>
                            <td className="p-2 text-right font-mono">{fmt(g.lifeDeathBenefit)}</td>
                            <td className="p-2 text-center">
                              {g.annuityLimit > 250000 ? (
                                <Badge className="bg-green-600 text-white text-xs">
                                  +{fmt(g.annuityLimit - 250000)} more
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">Equal</Badge>
                              )}
                            </td>
                            <td className="p-2 text-center">
                              <Badge variant="outline" className={
                                g.tier === "Premium" ? "text-green-600 border-green-600" :
                                g.tier === "Enhanced" ? "text-blue-600 border-blue-600" :
                                g.tier === "Below Standard" ? "text-red-600 border-red-600" :
                                "text-gray-600 border-gray-600"
                              }>
                                {g.tier}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <strong>Pro Tip for Large Deposits:</strong> For clients with deposits exceeding the state
                    guaranty limit, you can split the premium across multiple insurance companies — each policy
                    gets its own coverage limit. For example, a $2M deposit in New York could be split into
                    4 policies of $500K each across 4 different carriers, giving you $2M in full guaranty coverage.
                    This is the same strategy used with FDIC limits across multiple banks, but with higher per-policy limits.
                  </div>
                </div>

                {/* How guaranty associations differ from FDIC */}
                <Card className="border-2 border-amber-200 dark:border-amber-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Key Differences: State Guaranty vs FDIC</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { title: "Funding Source", guaranty: "Assessments on all insurance companies in the state — industry-funded safety net", fdic: "Insurance premiums paid by member banks to the FDIC fund" },
                        { title: "Coverage Trigger", guaranty: "When an insurer is declared insolvent by the state insurance commissioner", fdic: "When a bank is closed by its chartering authority" },
                        { title: "Resolution Process", guaranty: "Policies are typically transferred to a healthy insurer — benefits continue", fdic: "Deposits up to $250K are paid out, usually within days" },
                        { title: "Coverage Scope", guaranty: "Annuities, life insurance, health insurance, long-term care", fdic: "Checking, savings, CDs, money market accounts only" },
                      ].map((item, i) => (
                        <div key={i} className="p-3 rounded-lg border bg-card">
                          <div className="font-semibold text-sm mb-2">{item.title}</div>
                          <div className="text-xs space-y-1">
                            <div className="flex items-start gap-2">
                              <Shield className="w-3 h-3 text-green-600 mt-0.5 shrink-0" />
                              <span><strong>Guaranty:</strong> {item.guaranty}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <Building2 className="w-3 h-3 text-blue-600 mt-0.5 shrink-0" />
                              <span><strong>FDIC:</strong> {item.fdic}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════ TAB 5: CURRENT RATES ═══════════ */}
          <TabsContent value="rates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Current MYGA Rates (2025–2026)
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Top MYGA rates from A-rated insurance carriers. Rates are subject to change.
                  <em> Contact your advisor for the most current rates and availability.</em>
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-sm text-muted-foreground mb-3">
                  Top MYGA products available in <strong>{getStateName(stateCode)}</strong> — ranked by guaranteed rates.
                </p>
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b-2 border-green-600">
                        <th className="text-left p-2 font-semibold">#</th>
                        <th className="text-left p-2 font-semibold">Carrier / Product</th>
                        <th className="text-center p-2 font-semibold">AM Best</th>
                        <th className="text-center p-2 font-semibold">COMDEX</th>
                        <th className="text-right p-2 font-semibold">3-Year</th>
                        <th className="text-right p-2 font-semibold">5-Year</th>
                        <th className="text-right p-2 font-semibold">7-Year</th>
                        <th className="text-right p-2 font-semibold">10-Year</th>
                        <th className="text-right p-2 font-semibold">Min Premium</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mygaProducts.map((p, idx) => (
                        <tr key={p.id} className={`border-b hover:bg-muted/50 ${idx === 0 ? "bg-green-50 dark:bg-green-950/20 font-semibold" : ""}`}>
                          <td className="p-2 font-medium">{idx + 1}</td>
                          <td className="p-2">
                            <div className="font-medium">{p.carrier}</div>
                            <div className="text-xs text-muted-foreground">{p.product}</div>
                          </td>
                          <td className="p-2 text-center">
                            <Badge variant="outline" className={`text-xs ${
                              p.amBest.startsWith("A+") ? "border-emerald-500 text-emerald-600" :
                              p.amBest.startsWith("A ") || p.amBest === "A" ? "border-green-500 text-green-600" :
                              p.amBest.startsWith("A-") ? "border-teal-500 text-teal-600" :
                              p.amBest.startsWith("B+") ? "border-amber-500 text-amber-600" :
                              "border-orange-500 text-orange-600"
                            }`}>{p.amBest}</Badge>
                          </td>
                          <td className="p-2 text-center">
                            <span className={`font-mono font-bold text-sm ${
                              p.comdex >= 90 ? "text-emerald-600" :
                              p.comdex >= 80 ? "text-green-600" :
                              p.comdex >= 70 ? "text-teal-600" :
                              p.comdex >= 60 ? "text-amber-600" :
                              "text-orange-600"
                            }`}>{p.comdex}</span>
                          </td>
                          <td className="p-2 text-right font-mono text-emerald-600">{p.term3yr ? fmtPct(p.term3yr) : "—"}</td>
                          <td className="p-2 text-right font-mono text-green-600 font-bold">{p.term5yr ? fmtPct(p.term5yr) : "—"}</td>
                          <td className="p-2 text-right font-mono">{p.term7yr ? fmtPct(p.term7yr) : "—"}</td>
                          <td className="p-2 text-right font-mono">{p.term10yr ? fmtPct(p.term10yr) : "—"}</td>
                          <td className="p-2 text-right text-xs">{fmt(p.minPremium || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Financial Standing Detail Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mb-4">
                  {mygaProducts.slice(0, 6).map((p, idx) => (
                    <Card key={p.id} className={`border ${idx === 0 ? "border-emerald-500/40 bg-emerald-500/5" : "border-muted"}`}>
                      <CardContent className="pt-4 pb-3">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-semibold text-sm">{p.carrier}</div>
                            <div className="text-xs text-muted-foreground">{p.product}</div>
                          </div>
                          {idx === 0 && <Badge className="bg-emerald-600 text-white text-xs">Top Rated</Badge>}
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          <div className="text-center p-2 rounded bg-muted/30">
                            <div className="text-xs text-muted-foreground">AM Best</div>
                            <div className={`font-bold text-sm ${
                              p.amBest.startsWith("A+") ? "text-emerald-600" :
                              p.amBest.startsWith("A ") || p.amBest === "A" ? "text-green-600" :
                              p.amBest.startsWith("A-") ? "text-teal-600" :
                              "text-amber-600"
                            }`}>{p.amBest}</div>
                          </div>
                          <div className="text-center p-2 rounded bg-muted/30">
                            <div className="text-xs text-muted-foreground">COMDEX</div>
                            <div className={`font-bold text-sm ${
                              p.comdex >= 90 ? "text-emerald-600" :
                              p.comdex >= 80 ? "text-green-600" :
                              p.comdex >= 70 ? "text-teal-600" :
                              "text-amber-600"
                            }`}>{p.comdex}/100</div>
                          </div>
                          <div className="text-center p-2 rounded bg-muted/30">
                            <div className="text-xs text-muted-foreground">5-Yr Rate</div>
                            <div className="font-bold text-sm text-green-600">{p.term5yr ? fmtPct(p.term5yr) : "—"}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          {p.comdex >= 80 ? (
                            <><CheckCircle2 className="w-3 h-3 text-emerald-500" /><span className="text-xs text-emerald-600">Strong financial standing</span></>
                          ) : p.comdex >= 60 ? (
                            <><AlertTriangle className="w-3 h-3 text-amber-500" /><span className="text-xs text-amber-600">Adequate financial standing</span></>
                          ) : (
                            <><XCircle className="w-3 h-3 text-red-500" /><span className="text-xs text-red-600">Below average — higher rate compensates risk</span></>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { term: "3-Year", bestRate: mygaProducts[0]?.term3yr || 5.50, carrier: mygaProducts[0]?.carrier || "Various A-rated", minPremium: fmt(mygaProducts[0]?.minPremium || 10000) },
                    { term: "5-Year", bestRate: mygaProducts[0]?.term5yr || 6.25, carrier: mygaProducts[0]?.carrier || "Various A-rated", minPremium: fmt(mygaProducts[0]?.minPremium || 25000) },
                    { term: "7-Year", bestRate: mygaProducts[0]?.term7yr || 6.10, carrier: mygaProducts[0]?.carrier || "Various A-rated", minPremium: fmt(mygaProducts[0]?.minPremium || 25000) },
                    { term: "10-Year", bestRate: mygaProducts[0]?.term10yr || 5.85, carrier: mygaProducts[0]?.carrier || "Various A-rated", minPremium: fmt(mygaProducts[0]?.minPremium || 50000) },
                  ].map((r) => (
                    <Card key={r.term} className={`border-2 ${r.term === "5-Year" ? "border-green-400 bg-green-50/50 dark:bg-green-950/20" : "border-muted"}`}>
                      <CardContent className="pt-4 text-center">
                        {r.term === "5-Year" && (
                          <Badge className="bg-green-600 text-white mb-2">Best Value</Badge>
                        )}
                        <div className="text-sm text-muted-foreground">{r.term} MYGA</div>
                        <div className="text-3xl font-bold text-green-600 mt-1">{fmtPct(r.bestRate)}</div>
                        <div className="text-xs text-muted-foreground mt-2">{r.carrier}</div>
                        <div className="text-xs text-muted-foreground">Min: {r.minPremium}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Rate comparison with alternatives */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">MYGA Rates vs Other Safe Alternatives</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="border-b-2 border-green-600">
                            <th className="text-left p-2 font-semibold">Product</th>
                            <th className="text-right p-2 font-semibold">Current Rate</th>
                            <th className="text-center p-2 font-semibold">Tax Treatment</th>
                            <th className="text-center p-2 font-semibold">Liquidity</th>
                            <th className="text-center p-2 font-semibold">Protection</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { product: "5-Year MYGA", rate: "6.25%", tax: "Tax-Deferred", liquidity: "10% free/yr", protection: "State Guaranty", highlight: true },
                            { product: "5-Year Bank CD", rate: "4.25%", tax: "Taxed Annually", liquidity: "Penalty for early", protection: "FDIC $250K", highlight: false },
                            { product: "High-Yield Savings", rate: "4.50%", tax: "Taxed Annually", liquidity: "Fully Liquid", protection: "FDIC $250K", highlight: false },
                            { product: "5-Year Treasury", rate: "4.10%", tax: "State Tax-Free", liquidity: "Sell at market", protection: "US Gov't", highlight: false },
                            { product: "Money Market Fund", rate: "4.80%", tax: "Taxed Annually", liquidity: "Fully Liquid", protection: "None (SIPC)", highlight: false },
                          ].map((row, i) => (
                            <tr key={i} className={`border-b hover:bg-muted/50 ${row.highlight ? "bg-green-50 dark:bg-green-950/20 font-semibold" : ""}`}>
                              <td className="p-2 font-medium">
                                {row.highlight && <Star className="w-3 h-3 text-green-600 inline mr-1" />}
                                {row.product}
                              </td>
                              <td className={`p-2 text-right font-mono ${row.highlight ? "text-green-600 font-bold" : ""}`}>{row.rate}</td>
                              <td className="p-2 text-center">
                                <Badge variant="outline" className={row.tax === "Tax-Deferred" ? "text-green-600 border-green-600" : "text-gray-500"}>
                                  {row.tax}
                                </Badge>
                              </td>
                              <td className="p-2 text-center text-xs">{row.liquidity}</td>
                              <td className="p-2 text-center text-xs">{row.protection}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 flex items-start gap-3 mt-4">
                      <DollarSign className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                      <div className="text-sm">
                        <strong>The Tax-Deferred Advantage:</strong> A 6.25% MYGA with tax-deferred growth is equivalent
                        to earning approximately <strong>8.33% pre-tax</strong> in a taxable account (assuming a 25% tax bracket).
                        Over 5 years on a $1M deposit, this difference means an additional <strong>$50,000+</strong> in
                        effective earnings compared to a taxable CD at the same rate.
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
          {/* ═══════════ TAB 6: MYGA vs S&P 500 ═══════════ */}
          <TabsContent value="myga-vs-sp500" className="space-y-4">
            <MYGAvsSP500Section premium={premium} mygaRate={rate} />
          </TabsContent>

          {/* ═══════════ TAB 7: AMAZING MYGA WATERFALL ═══════════ */}
          <TabsContent value="waterfall" className="space-y-6">
            {/* Hero Banner */}
            <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-emerald-500/5 to-blue-500/10">
              <CardContent className="py-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                    <Zap className="w-6 h-6 text-amber-400" /> Amazing MYGA Waterfall Strategy
                  </h2>
                  <p className="text-muted-foreground max-w-3xl mx-auto">
                    Your MYGA is so safe and secure that almost any bank will lend at least <strong className="text-emerald-400">70% Loan-to-Value</strong> against it.
                    We take that 70% and invest it into a <strong className="text-amber-400">10-12 year oil & gas investment returning 15-20% annually</strong>.
                    Quarterly income pays off the bank loan, then you enjoy <strong className="text-emerald-400">7+ years of pure income</strong> —
                    plus your MYGA keeps growing the entire time. Repeat every 5 years for a cascading waterfall of wealth.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Cash Equivalents Fact Finder */}
            <Card className="border-blue-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <PiggyBank className="w-5 h-5 text-blue-400" /> Your Cash Equivalents <FactFinderBadge />
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  These low-yielding accounts could be working much harder inside a MYGA Waterfall strategy.
                  CDs earn 1-4%, money markets 0.5-2%, and checking/savings earn nearly 0%. Compare that to the waterfall below.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs">CDs</Label>
                    <NumberInput value={wfCds} onChange={setWfCds} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Money Markets</Label>
                    <NumberInput value={wfMoneyMarkets} onChange={setWfMoneyMarkets} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Checking</Label>
                    <NumberInput value={wfChecking} onChange={setWfChecking} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Savings</Label>
                    <NumberInput value={wfSavings} onChange={setWfSavings} className="mt-1" />
                  </div>
                </div>
                <div className="mt-3 p-3 rounded bg-amber-500/10 border border-amber-500/20">
                  <p className="text-sm font-semibold text-amber-400">
                    Total Cash Equivalents: {fmt(wfCds + wfMoneyMarkets + wfChecking + wfSavings)}
                    {(wfCds + wfMoneyMarkets + wfChecking + wfSavings) > 0 && (
                      <span className="text-muted-foreground font-normal"> — earning an average of ~1.5% in these accounts vs {wfMygaRate}% in a MYGA</span>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Waterfall Input Parameters */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-500" /> Waterfall Parameters
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Adjust the MYGA amount and watch the entire waterfall recalculate. Try adding additional amounts each cycle!
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs font-semibold">MYGA Premium</Label>
                    <NumberInput value={wfPremium} onChange={setWfPremium} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">MYGA Rate (%)</Label>
                    <NumberInput value={wfMygaRate} onChange={setWfMygaRate} step={0.25} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Bank Loan Rate (%)</Label>
                    <NumberInput value={wfBankLoanRate} onChange={setWfBankLoanRate} step={0.25} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">O&G Annual Return (%)</Label>
                    <NumberInput value={wfOilGasReturn} onChange={setWfOilGasReturn} step={1} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">O&G Investment Term (yrs)</Label>
                    <NumberInput value={wfOilGasTerm} onChange={setWfOilGasTerm} step={1} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Additional MYGA Per Cycle</Label>
                    <NumberInput value={wfAdditional} onChange={setWfAdditional} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Projection Years</Label>
                    <NumberInput value={wfProjectionYears} onChange={setWfProjectionYears} step={1} className="mt-1" />
                  </div>
                  <div className="flex flex-col justify-end">
                    <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-center">
                      <p className="text-xs text-muted-foreground">70% Bank Loan</p>
                      <p className="text-lg font-bold text-emerald-400">{fmt(Math.round(wfPremium * 0.7))}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ─── v4: Tax Savings & Home Equity Inputs ─── */}
            <Card className="border-green-500/20 bg-green-500/5">
              <CardContent className="py-4">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <h4 className="font-semibold text-green-400">Earned Income & Tax Savings</h4>
                  <FactFinderBadge />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs">Annual Income</Label>
                    <NumberInput value={wfAnnualIncome} onChange={setWfAnnualIncome} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Federal Tax Rate (%)</Label>
                    <NumberInput value={wfFederalTaxRate} onChange={setWfFederalTaxRate} step={1} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">State Tax Rate (%)</Label>
                    <NumberInput value={wfStateTaxRate} onChange={setWfStateTaxRate} step={0.5} className="mt-1" />
                  </div>
                  <div className="flex flex-col justify-end">
                    <div className="p-2 rounded bg-green-500/10 border border-green-500/20 text-center">
                      <p className="text-xs text-muted-foreground">Combined Rate</p>
                      <p className="text-lg font-bold text-green-400">{wfFederalTaxRate + wfStateTaxRate}%</p>
                    </div>
                  </div>
                </div>
                {wfAnnualIncome > 0 && (
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                    <Badge variant="outline" className="justify-center py-1.5 border-green-500/30 text-green-400">
                      Total Tax Savings: {fmt(waterfallResult.summary.totalTaxSavings)}
                    </Badge>
                    {waterfallResult.summary.totalTaxSavingsMygaPurchased > 0 && (
                      <Badge variant="outline" className="justify-center py-1.5 border-cyan-500/30 text-cyan-400">
                        Extra MYGAs Funded: {fmt(waterfallResult.summary.totalTaxSavingsMygaPurchased)}
                      </Badge>
                    )}
                    {waterfallResult.summary.totalTaxSavingsOGIncome > 0 && (
                      <Badge variant="outline" className="justify-center py-1.5 border-amber-500/30 text-amber-400">
                        Extra O&G Income: {fmt(waterfallResult.summary.totalTaxSavingsOGIncome)}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-indigo-500/20 bg-indigo-500/5">
              <CardContent className="py-4">
                <div className="flex items-center gap-2 mb-3">
                  <Home className="w-5 h-5 text-indigo-400" />
                  <h4 className="font-semibold text-indigo-400">Home Equity & HELOC</h4>
                  <FactFinderBadge />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs">Home Value</Label>
                    <NumberInput value={wfHomeValue} onChange={setWfHomeValue} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Mortgage Balance</Label>
                    <NumberInput value={wfMortgageBalance} onChange={setWfMortgageBalance} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">HELOC Rate (%)</Label>
                    <NumberInput value={wfHelocRate} onChange={setWfHelocRate} step={0.25} className="mt-1" />
                  </div>
                  <div className="flex flex-col justify-end">
                    <div className="p-2 rounded bg-indigo-500/10 border border-indigo-500/20 text-center">
                      <p className="text-xs text-muted-foreground">Available HELOC</p>
                      <p className="text-lg font-bold text-indigo-400">{fmt(waterfallResult.summary.helocAmount)}</p>
                    </div>
                  </div>
                </div>
                {waterfallResult.summary.helocAmount > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="outline" className="py-1.5 border-indigo-500/30 text-indigo-400">
                      Home Equity: {fmt(waterfallResult.summary.homeEquity)}
                    </Badge>
                    <Badge variant="outline" className="py-1.5 border-red-500/30 text-red-400">
                      HELOC Interest: {fmt(waterfallResult.summary.totalHelocInterestPaid)}
                    </Badge>
                    {waterfallResult.summary.helocPayoffYear && (
                      <Badge variant="outline" className="py-1.5 border-emerald-500/30 text-emerald-400">
                        HELOC Paid Off: Year {waterfallResult.summary.helocPayoffYear}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tax Savings Deployment Option */}
            {wfAnnualIncome > 0 && (
              <Card className="border-purple-500/20 bg-purple-500/5">
                <CardContent className="py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                    <h4 className="font-semibold text-purple-400">Tax Savings Deployment Strategy</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">Choose where to invest your O&G depreciation tax savings each year:</p>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                    {([
                      { value: "payback_heloc" as TaxDeploymentOption, label: "Pay HELOC Principal", icon: "\uD83C\uDFE0", desc: "Eliminate HELOC debt first" },
                      { value: "pay_bank_interest" as TaxDeploymentOption, label: "Bank Interest Offset", icon: "\uD83C\uDFE6", desc: "Reduce O&G burden on interest" },
                      { value: "buy_more_myga" as TaxDeploymentOption, label: "Buy More MYGA \u2192 O&G", icon: "\uD83D\uDCC8", desc: "Compound with new tranches" },
                      { value: "pay_bank_principal" as TaxDeploymentOption, label: "Bank Principal", icon: "\uD83D\uDCB0", desc: "Pay down loan balance" },
                      { value: "optimal_blend" as TaxDeploymentOption, label: "Optimal Blend", icon: "\u2728", desc: "Auto-optimize each year" },
                    ]).map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setWfTaxDeployment(opt.value)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          wfTaxDeployment === opt.value
                            ? "border-purple-500 bg-purple-500/20 ring-1 ring-purple-500/50"
                            : "border-border hover:border-purple-500/40 hover:bg-purple-500/5"
                        }`}
                      >
                        <div className="text-lg mb-1">{opt.icon}</div>
                        <div className="text-xs font-semibold">{opt.label}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{opt.desc}</div>
                      </button>
                    ))}
                  </div>

                  {/* Scenario Compare Button */}
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      onClick={() => setShowScenarioComparison(!showScenarioComparison)}
                      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                        showScenarioComparison
                          ? "bg-purple-600 text-white shadow-lg shadow-purple-500/25"
                          : "bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:bg-purple-500/20"
                      }`}
                    >
                      {showScenarioComparison ? "\u2713 Comparing All 5 Scenarios" : "\u26A1 Compare All Scenarios"}
                    </button>
                    {showScenarioComparison && scenarioComparison && (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                        Optimal: {scenarioComparison.optimalLabel}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Scenario Comparison Results */}
            {showScenarioComparison && scenarioComparison && (
              <Card className="border-purple-500/20">
                <CardContent className="py-4">
                  <h4 className="font-semibold text-purple-400 mb-3">Scenario Comparison — All 5 Deployment Strategies</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-2">Rank</th>
                          <th className="text-left py-2 px-2">Strategy</th>
                          <th className="text-right py-2 px-2">Net Benefit</th>
                          <th className="text-right py-2 px-2">Tax Savings</th>
                          <th className="text-right py-2 px-2 text-green-400 font-semibold">Tax Reinvested</th>
                          <th className="text-right py-2 px-2">O&G Income</th>
                          <th className="text-right py-2 px-2">Bank Interest</th>
                          <th className="text-right py-2 px-2">HELOC Interest</th>
                          <th className="text-right py-2 px-2">HELOC Payoff</th>
                          <th className="text-right py-2 px-2">Loan Wipeout</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scenarioComparison.scenarios.map((s, i) => (
                          <tr
                            key={s.option}
                            className={`border-b border-border/50 ${
                              i === 0 ? "bg-emerald-500/10" : ""
                            } ${s.option === wfTaxDeployment ? "ring-1 ring-purple-500/30" : ""}`}
                          >
                            <td className="py-2 px-2">
                              {i === 0 ? (
                                <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">BEST</Badge>
                              ) : (
                                <span className="text-muted-foreground">#{i + 1}</span>
                              )}
                            </td>
                            <td className="py-2 px-2 font-medium">{s.label}</td>
                            <td className="py-2 px-2 text-right font-bold text-emerald-400">{fmt(s.summary.totalNetBenefit)}</td>
                            <td className="py-2 px-2 text-right text-green-400">{fmt(s.summary.totalTaxSavings)}</td>
                            <td className="py-2 px-2 text-right text-green-400 font-semibold">{fmt(s.summary.totalTaxSavingsReinvested)}</td>
                            <td className="py-2 px-2 text-right text-amber-400">{fmt(s.summary.totalOilGasIncomeReceived)}</td>
                            <td className="py-2 px-2 text-right text-red-400">{fmt(s.summary.totalBankInterestPaid)}</td>
                            <td className="py-2 px-2 text-right text-red-300">{fmt(s.summary.totalHelocInterestPaid)}</td>
                            <td className="py-2 px-2 text-right">{s.summary.helocPayoffYear ? `Yr ${s.summary.helocPayoffYear}` : "—"}</td>
                            <td className="py-2 px-2 text-right">{s.summary.loanWipeoutYear ? `Yr ${s.summary.loanWipeoutYear}` : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Scenario comparison chart */}
                  <div className="mt-4">
                    <h5 className="text-xs font-semibold text-muted-foreground mb-2">Cumulative Net Benefit Over Time</h5>
                    <ResponsiveContainer width="100%" height={300}>
                      <ComposedChart data={scenarioComparison.scenarios[0].yearlyNetBenefit.map((_, i) => {
                        const row: Record<string, number | string> = { year: i + 1 };
                        for (const s of scenarioComparison.scenarios) {
                          row[s.option] = s.yearlyNetBenefit[i] || 0;
                        }
                        return row;
                      })}>
                        <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                        <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v: number) => fmt(v)} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        {scenarioComparison.scenarios.map((s, i) => (
                          <Line
                            key={s.option}
                            type="monotone"
                            dataKey={s.option}
                            name={s.label}
                            stroke={["#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899"][i]}
                            strokeWidth={s.option === scenarioComparison.optimal ? 3 : 1.5}
                            strokeDasharray={s.option === scenarioComparison.optimal ? undefined : "4 2"}
                            dot={false}
                          />
                        ))}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <Card className="border-emerald-500/20">
                <CardContent className="py-3 text-center">
                  <p className="text-xs text-muted-foreground">Total MYGA Interest</p>
                  <p className="text-lg font-bold text-emerald-400">{fmt(waterfallResult.summary.totalMygaInterestEarned)}</p>
                </CardContent>
              </Card>
              <Card className="border-red-500/20">
                <CardContent className="py-3 text-center">
                  <p className="text-xs text-muted-foreground">Bank Interest Paid</p>
                  <p className="text-lg font-bold text-red-400">{fmt(waterfallResult.summary.totalBankInterestPaid)}</p>
                </CardContent>
              </Card>
              <Card className="border-amber-500/20">
                <CardContent className="py-3 text-center">
                  <p className="text-xs text-muted-foreground">Total O&G Income</p>
                  <p className="text-lg font-bold text-amber-400">{fmt(waterfallResult.summary.totalOilGasIncomeReceived)}</p>
                </CardContent>
              </Card>
              <Card className="border-purple-500/20">
                <CardContent className="py-3 text-center">
                  <p className="text-xs text-muted-foreground">Depreciation Credits</p>
                  <p className="text-lg font-bold text-purple-400">{fmt(waterfallResult.summary.totalDepreciationCredits)}</p>
                </CardContent>
              </Card>
              {waterfallResult.summary.totalTaxSavingsReinvested > 0 && (
                <Card className="border-green-400/30 bg-green-500/5">
                  <CardContent className="py-3 text-center">
                    <p className="text-xs text-muted-foreground">Tax Savings Reinvested</p>
                    <p className="text-lg font-bold text-green-400">{fmt(waterfallResult.summary.totalTaxSavingsReinvested)}</p>
                  </CardContent>
                </Card>
              )}
              <Card className="border-blue-500/20">
                <CardContent className="py-3 text-center">
                  <p className="text-xs text-muted-foreground">Final MYGA Value</p>
                  <p className="text-lg font-bold text-blue-400">{fmt(waterfallResult.summary.finalMygaValue)}</p>
                </CardContent>
              </Card>
              <Card className="border-green-500/30 bg-green-500/5">
                <CardContent className="py-3 text-center">
                  <p className="text-xs text-muted-foreground">Total Net Benefit</p>
                  <p className="text-xl font-bold text-green-400">{fmt(waterfallResult.summary.totalNetBenefit)}</p>
                </CardContent>
              </Card>
            </div>

            {/* ═══════ CHART 1: O&G Income Wipes Out Bank Loan ═══════ */}
            <Card className="border-amber-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Fuel className="w-5 h-5 text-amber-400" /> O&G Income Wipes Out the Bank Loan
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-amber-400">Amber bars</strong> = O&G income. <strong className="text-green-400">Green bars</strong> = tax savings reinvested. <strong className="text-red-400">Red bars</strong> = bank loan payments.
                  Watch how the oil & gas income + tax savings <strong className="text-emerald-400">completely covers and then exceeds</strong> the bank loan — once the loan is paid off, it's all pure profit.
                  {waterfallResult.summary.loanWipeoutYear && (
                    <span className="text-emerald-400 font-semibold"> O&G first covers the full loan payment in Year {waterfallResult.summary.loanWipeoutYear}!</span>
                  )}
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={loanWipeoutData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="year" stroke="#888" label={{ value: "Year", position: "insideBottom", offset: -5 }} />
                      <YAxis stroke="#888" tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid #333", borderRadius: 8 }}
                        formatter={(value: number, name: string) => [fmt(value), name]}
                        labelFormatter={(label: number) => `Year ${label}`}
                      />
                      <Legend />
                      <Bar dataKey="ogIncome" name="O&G Annual Income" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="taxSavingsReinvested" name="Tax Savings Reinvested" fill="#4ade80" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="loanPayment" name="Bank Loan Payment" fill="#ef4444" opacity={0.8} radius={[4, 4, 0, 0]} />
                      <Area type="monotone" dataKey="surplus" name="Pure Profit (O&G > Loan)" fill="#22c55e" fillOpacity={0.25} stroke="#22c55e" strokeWidth={2} />
                      <Line type="monotone" dataKey="netCashFlow" name="Net Cash Flow" stroke="#ffffff" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                      <ReferenceLine y={0} stroke="#666" strokeWidth={2} />
                      {waterfallResult.summary.loanWipeoutYear && (
                        <ReferenceLine x={waterfallResult.summary.loanWipeoutYear} stroke="#22c55e" strokeWidth={2} strokeDasharray="8 4" label={{ value: "\u2713 Loan Covered", position: "top", fill: "#22c55e", fontSize: 11 }} />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                {/* Loan wipeout summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                    <p className="text-xs text-muted-foreground">Total O&G Income</p>
                    <p className="text-lg font-bold text-amber-400">{fmt(waterfallResult.summary.totalOilGasIncomeReceived)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                    <p className="text-xs text-muted-foreground">O&G Used for Loan</p>
                    <p className="text-lg font-bold text-red-400">{fmt(waterfallResult.summary.totalOGTowardLoan)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <p className="text-xs text-muted-foreground">Pure Profit (After Loan)</p>
                    <p className="text-lg font-bold text-emerald-400">{fmt(waterfallResult.summary.totalOGPureProfit)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                    <p className="text-xs text-muted-foreground">Bank Interest Paid</p>
                    <p className="text-lg font-bold text-blue-400">{fmt(waterfallResult.summary.totalBankInterestPaid)}</p>
                  </div>
                  {waterfallResult.summary.totalTaxSavingsReinvested > 0 && (
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                      <p className="text-xs text-muted-foreground">Tax Savings Reinvested</p>
                      <p className="text-lg font-bold text-green-400">{fmt(waterfallResult.summary.totalTaxSavingsReinvested)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ═══════ CHART 2: Stacked O&G Tranches — Overlapping Every 5 Years ═══════ */}
            <Card className="border-violet-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-violet-400" /> O&G Tranches: Compounding & Overlapping Every 5 Years
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Each 5-year cycle launches a <strong className="text-amber-400">new O&G tranche</strong> (12-year term).
                  Tranches overlap — by year 6, you have <strong className="text-violet-400">2 tranches producing simultaneously</strong>.
                  By year 11, <strong className="text-violet-400">3 tranches</strong> are stacking income. The bank loan (red line) gets dwarfed.
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={stackedOGChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="year" stroke="#888" label={{ value: "Year", position: "insideBottom", offset: -5 }} />
                      <YAxis stroke="#888" tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid #333", borderRadius: 8 }}
                        formatter={(value: number, name: string) => {
                          const tranche = waterfallResult.trancheInfo.find((t) => t.trancheKey === name);
                          const label = tranche ? `Cycle ${tranche.cycleNumber} O&G (Yr ${tranche.startYear}-${tranche.endYear})` : name;
                          return [fmt(value as number), label];
                        }}
                        labelFormatter={(label: number) => `Year ${label}`}
                      />
                      <Legend formatter={(value: string) => {
                        const tranche = waterfallResult.trancheInfo.find((t) => t.trancheKey === value);
                        return tranche ? `Cycle ${tranche.cycleNumber} O&G (Yr ${tranche.startYear}\u2013${tranche.endYear})` : value;
                      }} />
                      {waterfallResult.trancheInfo.map((t) => (
                        <Bar
                          key={t.trancheKey}
                          dataKey={t.trancheKey}
                          name={t.trancheKey}
                          stackId="og"
                          fill={t.color}
                          opacity={0.85}
                        />
                      ))}
                      <Line type="monotone" dataKey="bankLoanPayment" name="Bank Loan Payment" stroke="#ef4444" strokeWidth={3} dot={false} strokeDasharray="8 4" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                {/* Tranche legend cards */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {waterfallResult.trancheInfo.map((t) => (
                    <div key={t.trancheKey} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-700 text-xs">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                      <span>Cycle {t.cycleNumber}: {fmt(t.annualIncome)}/yr (Yr {t.startYear}\u2013{t.endYear})</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ═══════ CHART 3: MYGA Cascade — Maturity Rolls Into Next Cycle ═══════ */}
            <Card className="border-emerald-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" /> MYGA Cascade: Maturity Value Rolls Forward
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  End value of <strong className="text-emerald-400">Year 5 becomes the start of Year 6</strong>.
                  End value of <strong className="text-emerald-400">Year 10 becomes the start of Year 11</strong>. And so on.
                  Each cycle starts higher because the previous maturity value compounds into the next.
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={mygaCascadeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="year" stroke="#888" label={{ value: "Year", position: "insideBottom", offset: -5 }} />
                      <YAxis stroke="#888" tickFormatter={(v: number) => v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid #333", borderRadius: 8 }}
                        formatter={(value: number, name: string) => {
                          if (name === "Rollover from Previous Cycle" && !value) return [null, null];
                          return [fmt(value), name];
                        }}
                        labelFormatter={(label: number) => `Year ${label}`}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="mygaValue" name="MYGA Account Value" fill="#10b981" fillOpacity={0.2} stroke="#10b981" strokeWidth={3} />
                      <Bar dataKey="mygaInterest" name="Annual MYGA Interest" fill="#34d399" opacity={0.5} />
                      <Bar dataKey="rollover" name="Rollover from Previous Cycle" fill="#fbbf24" />
                      {/* Cycle boundary reference lines */}
                      {waterfallResult.cycles.filter((c) => c.cycleNumber > 1).map((c) => (
                        <ReferenceLine
                          key={c.cycleNumber}
                          x={c.startYear}
                          stroke="#fbbf24"
                          strokeWidth={2}
                          strokeDasharray="6 3"
                          label={{ value: `\u21b3 ${fmt(c.mygaRolloverIn)} rolls in`, position: "top", fill: "#fbbf24", fontSize: 10 }}
                        />
                      ))}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                {/* Cycle rollover summary */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mt-4">
                  {waterfallResult.cycles.map((c) => (
                    <div key={c.cycleNumber} className={`p-3 rounded-lg border text-center ${c.cycleNumber === 1 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
                      <p className="text-[10px] text-muted-foreground font-semibold">Cycle {c.cycleNumber} (Yr {c.startYear})</p>
                      {c.mygaRolloverIn > 0 && (
                        <p className="text-xs text-amber-400">+{fmt(c.mygaRolloverIn)} rolled in</p>
                      )}
                      <p className="text-xs">Start: <span className="font-bold text-emerald-400">{fmt(c.mygaCycleStartValue)}</span></p>
                      <p className="text-xs">Maturity: <span className="font-bold text-emerald-300">{fmt(c.mygaMaturityValue)}</span></p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ═══════ CHART 4: Cumulative Income Streams ═══════ */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-blue-400" /> Waterfall: Cumulative Income Streams
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Watch how each 5-year MYGA cycle creates a new cascade of oil & gas income.
                  <strong className="text-green-400">Green area</strong> = cumulative tax savings being reinvested back into the strategy.
                  <strong className="text-amber-400"> Try increasing the MYGA amount above</strong> to see the entire waterfall grow!
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={waterfallResult.projection}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="year" stroke="#888" label={{ value: "Year", position: "insideBottom", offset: -5 }} />
                      <YAxis stroke="#888" tickFormatter={(v: number) => v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid #333", borderRadius: 8 }}
                        formatter={(value: number, name: string) => [fmt(value), name]}
                        labelFormatter={(label: number) => `Year ${label}`}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="oilGasCumulativeIncome" name="Cumulative O&G Income" fill="#f59e0b" fillOpacity={0.3} stroke="#f59e0b" strokeWidth={2} />
                      <Area type="monotone" dataKey="totalMygaInterestEarned" name="Cumulative MYGA Interest" fill="#10b981" fillOpacity={0.2} stroke="#10b981" strokeWidth={2} />
                      <Area type="monotone" dataKey="cumulativeTaxSavingsReinvested" name="Tax Savings Reinvested" fill="#4ade80" fillOpacity={0.35} stroke="#4ade80" strokeWidth={2.5} />
                      <Line type="monotone" dataKey="totalBankInterestPaid" name="Cumulative Bank Interest" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                      <Line type="monotone" dataKey="totalNetBenefit" name="Net Benefit" stroke="#22c55e" strokeWidth={3} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* ═══════ Before vs After Chart ═══════ */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-400" /> Before vs After: Do Nothing vs MYGA Waterfall
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      {
                        name: "Cash in Bank",
                        "Do Nothing (1.5% avg)": Math.round((wfCds + wfMoneyMarkets + wfChecking + wfSavings) * Math.pow(1.015, wfProjectionYears)),
                        "MYGA Waterfall": waterfallResult.summary.finalMygaValue + waterfallResult.summary.totalOilGasIncomeReceived - waterfallResult.summary.totalBankInterestPaid,
                      },
                      {
                        name: "Total Interest/Income",
                        "Do Nothing (1.5% avg)": Math.round((wfCds + wfMoneyMarkets + wfChecking + wfSavings) * (Math.pow(1.015, wfProjectionYears) - 1)),
                        "MYGA Waterfall": waterfallResult.summary.totalMygaInterestEarned + waterfallResult.summary.totalOilGasIncomeReceived,
                      },
                      {
                        name: "Tax Benefits",
                        "Do Nothing (1.5% avg)": 0,
                        "MYGA Waterfall": waterfallResult.summary.totalDepreciationCredits,
                      },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="name" stroke="#888" />
                      <YAxis stroke="#888" tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid #333", borderRadius: 8 }}
                        formatter={(value: number, name: string) => [fmt(value), name]}
                      />
                      <Legend />
                      <Bar dataKey="Do Nothing (1.5% avg)" fill="#64748b" opacity={0.6} />
                      <Bar dataKey="MYGA Waterfall" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Cycle Breakdown Cards */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-blue-400" /> 5-Year Cycle Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {waterfallResult.cycles.map((c) => (
                    <Card key={c.cycleNumber} className="border-slate-700">
                      <CardContent className="py-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="border-amber-500/30 text-amber-400">
                            Cycle {c.cycleNumber} (Yr {c.startYear}–{c.endYear})
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><span className="text-muted-foreground">MYGA Premium:</span> <span className="font-semibold">{fmt(c.mygaPremium)}</span></div>
                          <div><span className="text-muted-foreground">MYGA Maturity:</span> <span className="font-semibold text-emerald-400">{fmt(c.mygaMaturityValue)}</span></div>
                          <div><span className="text-muted-foreground">MYGA Interest:</span> <span className="font-semibold text-emerald-400">{fmt(c.mygaInterestEarned)}</span></div>
                          <div><span className="text-muted-foreground">Bank Loan:</span> <span className="font-semibold">{fmt(c.bankLoanAmount)}</span></div>
                          <div><span className="text-muted-foreground">Bank Interest:</span> <span className="font-semibold text-red-400">{fmt(c.bankInterestPaid)}</span></div>
                          <div><span className="text-muted-foreground">O&G Investment:</span> <span className="font-semibold text-amber-400">{fmt(c.oilGasInvestment)}</span></div>
                          <div><span className="text-muted-foreground">O&G Income:</span> <span className="font-semibold text-amber-400">{fmt(c.oilGasIncomeTotal)}</span></div>
                          <div><span className="text-muted-foreground">Depreciation:</span> <span className="font-semibold text-purple-400">{fmt(c.oilGasDepreciationTotal)}</span></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Full 25-Year Cascading Projection Table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-amber-400" /> {wfProjectionYears}-Year Cascading Projection
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Every column updates live as you change the inputs above. Scroll right to see all values.
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="p-2 text-left sticky left-0 bg-card z-10">Yr</th>
                        <th className="p-2 text-left">Cycle</th>
                        <th className="p-2 text-right text-emerald-400">MYGA Start</th>
                        <th className="p-2 text-right text-emerald-400">MYGA Interest</th>
                        <th className="p-2 text-right text-emerald-400">MYGA End</th>
                        <th className="p-2 text-right text-red-400">Loan Balance</th>
                        <th className="p-2 text-right text-red-400">Loan Interest</th>
                        <th className="p-2 text-right text-red-400">Loan Principal</th>
                        <th className="p-2 text-right text-red-400">Loan End Bal</th>
                        <th className="p-2 text-right text-amber-400">O&G Investment</th>
                        <th className="p-2 text-right text-amber-400">O&G Income</th>
                        <th className="p-2 text-right text-amber-400">Quarterly Pmt</th>
                        <th className="p-2 text-right text-purple-400">Depreciation</th>
                        <th className="p-2 text-right text-green-400">Tax Savings</th>
                        <th className="p-2 text-right text-green-400 font-semibold">Cum. Tax Reinvested</th>
                        <th className="p-2 text-right text-green-400">Net Cash Flow</th>
                        <th className="p-2 text-right text-green-400">Cum. Net</th>
                        <th className="p-2 text-right font-bold text-green-300">Total Benefit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {waterfallResult.projection.map((row) => (
                        <tr key={row.year} className={`border-b border-slate-800 hover:bg-slate-800/50 ${row.cycleYear === 1 ? "border-t-2 border-t-amber-500/30 bg-amber-500/5" : ""}`}>
                          <td className="p-2 font-semibold sticky left-0 bg-card z-10">{row.year}</td>
                          <td className="p-2">
                            <Badge variant="outline" className="text-[10px] px-1 py-0">{row.cycle}.{row.cycleYear}</Badge>
                          </td>
                          <td className="p-2 text-right text-emerald-400">{fmt(row.mygaStartValue)}</td>
                          <td className="p-2 text-right text-emerald-400">{fmt(row.mygaInterestEarned)}</td>
                          <td className="p-2 text-right text-emerald-400 font-semibold">{fmt(row.mygaEndValue)}</td>
                          <td className="p-2 text-right text-red-400">{row.bankLoanBalance > 0 ? fmt(row.bankLoanBalance) : "—"}</td>
                          <td className="p-2 text-right text-red-400">{row.bankLoanInterestPaid > 0 ? fmt(row.bankLoanInterestPaid) : "—"}</td>
                          <td className="p-2 text-right text-red-400">{row.bankLoanPrincipalPaid > 0 ? fmt(row.bankLoanPrincipalPaid) : "—"}</td>
                          <td className="p-2 text-right text-red-400">{row.bankLoanEndBalance > 0 ? fmt(row.bankLoanEndBalance) : "—"}</td>
                          <td className="p-2 text-right text-amber-400">{row.oilGasInvestment > 0 ? fmt(row.oilGasInvestment) : "—"}</td>
                          <td className="p-2 text-right text-amber-400">{row.oilGasIncome > 0 ? fmt(row.oilGasIncome) : "—"}</td>
                          <td className="p-2 text-right text-amber-400">{row.oilGasQuarterlyPayment > 0 ? fmt(row.oilGasQuarterlyPayment) : "—"}</td>
                          <td className="p-2 text-right text-purple-400">{row.oilGasDepreciation > 0 ? fmt(row.oilGasDepreciation) : "—"}</td>
                          <td className="p-2 text-right text-green-400">{row.taxSavings > 0 ? fmt(row.taxSavings) : "—"}</td>
                          <td className="p-2 text-right text-green-400 font-semibold">{row.cumulativeTaxSavingsReinvested > 0 ? fmt(row.cumulativeTaxSavingsReinvested) : "—"}</td>
                          <td className={`p-2 text-right font-semibold ${row.netCashFlow >= 0 ? "text-green-400" : "text-red-400"}`}>{fmt(row.netCashFlow)}</td>
                          <td className="p-2 text-right text-green-400">{fmt(row.cumulativeNetCashFlow)}</td>
                          <td className="p-2 text-right font-bold text-green-300">{fmt(row.totalNetBenefit)}</td>
                        </tr>
                      ))}
                      {/* Totals row */}
                      <tr className="border-t-2 border-emerald-500/30 bg-emerald-500/5 font-bold">
                        <td className="p-2 sticky left-0 bg-card z-10" colSpan={2}>TOTALS</td>
                        <td className="p-2 text-right" colSpan={2}></td>
                        <td className="p-2 text-right text-emerald-400">{fmt(waterfallResult.summary.finalMygaValue)}</td>
                        <td className="p-2 text-right" colSpan={2}></td>
                        <td className="p-2 text-right"></td>
                        <td className="p-2 text-right"></td>
                        <td className="p-2 text-right"></td>
                        <td className="p-2 text-right text-amber-400">{fmt(waterfallResult.summary.totalOilGasIncomeReceived)}</td>
                        <td className="p-2 text-right"></td>
                        <td className="p-2 text-right text-purple-400">{fmt(waterfallResult.summary.totalDepreciationCredits)}</td>
                        <td className="p-2 text-right text-green-400">{fmt(waterfallResult.summary.totalTaxSavings)}</td>
                        <td className="p-2 text-right text-green-400 font-semibold">{fmt(waterfallResult.summary.totalTaxSavingsReinvested)}</td>
                        <td className="p-2 text-right"></td>
                        <td className="p-2 text-right"></td>
                        <td className="p-2 text-right text-green-300 text-base">{fmt(waterfallResult.summary.totalNetBenefit)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Grand Summary */}
            <Card className="border-green-500/30 bg-gradient-to-r from-green-500/5 to-emerald-500/5">
              <CardContent className="py-6">
                <div className="text-center space-y-4">
                  <h3 className="text-xl font-bold">25-Year Waterfall Grand Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">MYGA Invested</p>
                      <p className="text-lg font-bold">{fmt(waterfallResult.summary.totalMygaPremiumInvested)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">MYGA Interest Earned</p>
                      <p className="text-lg font-bold text-emerald-400">+{fmt(waterfallResult.summary.totalMygaInterestEarned)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Bank Interest Paid</p>
                      <p className="text-lg font-bold text-red-400">-{fmt(waterfallResult.summary.totalBankInterestPaid)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">O&G Income Received</p>
                      <p className="text-lg font-bold text-amber-400">+{fmt(waterfallResult.summary.totalOilGasIncomeReceived)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tax Credits (Depreciation)</p>
                      <p className="text-lg font-bold text-purple-400">+{fmt(waterfallResult.summary.totalDepreciationCredits)}</p>
                    </div>
                    {waterfallResult.summary.totalTaxSavingsReinvested > 0 && (
                      <div className="bg-green-500/10 rounded-lg p-2 border border-green-500/20">
                        <p className="text-xs text-muted-foreground">Tax Savings Reinvested</p>
                        <p className="text-lg font-bold text-green-400">+{fmt(waterfallResult.summary.totalTaxSavingsReinvested)}</p>
                      </div>
                    )}
                    <div className="bg-green-500/10 rounded-lg p-2">
                      <p className="text-xs text-muted-foreground">NET BENEFIT</p>
                      <p className="text-2xl font-bold text-green-400">{fmt(waterfallResult.summary.totalNetBenefit)}</p>
                      <p className="text-xs text-green-400">{waterfallResult.summary.effectiveAnnualReturn.toFixed(1)}% effective annual return</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground max-w-2xl mx-auto mt-4">
                    Checks or direct deposits from oil & gas income occur <strong className="text-amber-400">quarterly</strong>.
                    During the first 5 years of each cycle, quarterly payments service the bank loan.
                    After the loan is paid off, you receive <strong className="text-emerald-400">7+ additional years of pure income</strong> from each O&G tranche.
                    Meanwhile, your MYGA continues compounding at {wfMygaRate}% guaranteed.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════ TAB 8: MULTI-PROPERTY ENGINE ═══════════ */}
          <TabsContent value="multi-property" className="space-y-6">
            <MultiPropertyTab />
          </TabsContent>
        
          <TabsContent value="generate-outcome" className="space-y-6 mt-6">
            <GenerateOutcomeTab
              strategyType="myga-waterfall"
              hasResults={true}
              resultData={{ totalMygaValue: 500000, totalOilGasValue: 200000, netWealth: 700000, mygaRate: 5.5, cycles: 4, annualTaxSavings: 45000, projectionData: [] }}
              metrics={[{ label: "MYGA Value", value: 500000, highlight: true }, { label: "O&G Value", value: 200000 }, { label: "Net Wealth", value: 700000 }, { label: "Annual Tax Savings", value: 45000 }]}
            />
          </TabsContent>
        </Tabs>

        {/* ─── NAIC DISCLAIMER ─── */}
        <NAICDisclaimer
          variant="full"
          showsProjections
          showsCashValues
          additionalText="MYGA rates shown are current as of the illustration date and are subject to change. The guaranteed rate applies for the initial guarantee period only; after that period, the minimum guaranteed rate applies unless renewed at a higher rate. State guaranty association coverage limits vary by state and are subject to change. This comparison is for educational purposes and does not constitute legal or financial advice. Consult your financial advisor for personalized recommendations."
        />
      </div>
          <PageInsights pageId="myga-fixed-rate" />
    
        <ComplianceFooter pageName="MYGAFixedRate" showsAnnuity showsTax showsEstate showsProjections showsHistoricalData showsPolicyLoans />
      </AppShell>
  );
}

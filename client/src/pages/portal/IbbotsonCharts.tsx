// @ts-nocheck
import { AppShell } from "@/components/AppShell";
import { useState, useMemo, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Shield,
  BookOpen,
  GraduationCap,
  Award,
  History,
  Info,
  ArrowDown,
  ArrowUp,
  Minus,
  PieChartIcon,
  LineChart as LineChartIcon,
  Activity,
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  Download,
  Filter,
  Layers,
  LayoutDashboard,
  Maximize2,
  Percent,
  RefreshCw,
  Search,
  Settings,
  Share2,
  Target,
  Users,
  Zap
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
  ComposedChart,
  Cell,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  ZAxis,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import { PageInsights } from "@/components/PageInsights";
import { ExportToSlides } from "@/components/ExportToSlides";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { useClientData } from "@/contexts/ClientDataContext";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

const SP500_RETURNS: Record<number, number> = {
  1929: -8.30, 1930: -25.12, 1931: -43.84, 1932: -8.64, 1933: 49.98,
  1934: -1.19, 1935: 46.74, 1936: 31.94, 1937: -35.34, 1938: 29.28,
  1939: -1.10, 1940: -10.67, 1941: -12.77, 1942: 19.17, 1943: 25.06,
  1944: 19.03, 1945: 35.82, 1946: -8.43, 1947: 5.20, 1948: 5.70,
  1949: 18.30, 1950: 30.81, 1951: 23.68, 1952: 18.15, 1953: -1.21,
  1954: 52.56, 1955: 32.60, 1956: 7.44, 1957: -10.46, 1958: 43.72,
  1959: 12.06, 1960: 0.34, 1961: 26.64, 1962: -8.81, 1963: 22.61,
  1964: 16.42, 1965: 12.40, 1966: -9.97, 1967: 23.80, 1968: 10.81,
  1969: -8.24, 1970: 3.56, 1971: 14.22, 1972: 18.76, 1973: -14.31,
  1974: -25.90, 1975: 37.00, 1976: 23.83, 1977: -6.98, 1978: 6.51,
  1979: 18.52, 1980: 31.74, 1981: -4.70, 1982: 20.42, 1983: 22.34,
  1984: 6.15, 1985: 31.24, 1986: 18.49, 1987: 5.81, 1988: 16.54,
  1989: 31.48, 1990: -3.06, 1991: 30.23, 1992: 7.49, 1993: 9.97,
  1994: 1.33, 1995: 37.20, 1996: 22.68, 1997: 33.10, 1998: 28.34,
  1999: 20.89, 2000: -9.03, 2001: -11.85, 2002: -21.97, 2003: 28.36,
  2004: 10.74, 2005: 4.83, 2006: 15.61, 2007: 5.48, 2008: -36.55,
  2009: 25.94, 2010: 14.82, 2011: 2.10, 2012: 15.89, 2013: 32.15,
  2014: 13.52, 2015: 1.38, 2016: 11.77, 2017: 21.61, 2018: -4.23,
  2019: 31.21, 2020: 18.02, 2021: 28.47, 2022: -18.04, 2023: 26.06,
  2024: 24.88, 2025: 17.78,
};

const YEARS = Object.keys(SP500_RETURNS).map(Number).sort((a, b) => a - b);

function computeChartData(cap: number, floor: number, participationRate: number = 100, spread: number = 0) {
  let spCumulative = 100;
  let iulCumulative = 100;

  return YEARS.map((year) => {
    const rawReturn = SP500_RETURNS[year];
    
    let adjustedReturn = (rawReturn * (participationRate / 100)) - spread;
    
    const cappedReturn = Math.min(Math.max(adjustedReturn, floor), cap);

    spCumulative *= 1 + rawReturn / 100;
    iulCumulative *= 1 + cappedReturn / 100;

    return {
      year,
      rawReturn: +rawReturn.toFixed(2),
      cappedReturn: +cappedReturn.toFixed(2),
      spCumulative: +spCumulative.toFixed(2),
      iulCumulative: +iulCumulative.toFixed(2),
      difference: +(cappedReturn - rawReturn).toFixed(2),
      isPositive: rawReturn >= 0,
      isCapped: cappedReturn === cap && rawReturn > cap,
      isFloored: cappedReturn === floor && rawReturn < floor
    };
  });
}

function computeStats(data: ReturnType<typeof computeChartData>) {
  const rawReturns = data.map((d) => d.rawReturn);
  const cappedReturns = data.map((d) => d.cappedReturn);
  const positiveYears = rawReturns.filter((r) => r > 0).length;
  const negativeYears = rawReturns.filter((r) => r < 0).length;
  const cappedYearsCount = data.filter((d) => d.isCapped).length;
  const flooredYearsCount = data.filter((d) => d.isFloored).length;
  
  const avgRaw = rawReturns.reduce((s, r) => s + r, 0) / rawReturns.length;
  const avgCapped = cappedReturns.reduce((s, r) => s + r, 0) / cappedReturns.length;
  
  const worstYear = Math.min(...rawReturns);
  const bestYear = Math.max(...rawReturns);
  const worstYearIdx = rawReturns.indexOf(worstYear);
  const bestYearIdx = rawReturns.indexOf(bestYear);

  const varianceRaw = rawReturns.reduce((s, r) => s + Math.pow(r - avgRaw, 2), 0) / rawReturns.length;
  const varianceCapped = cappedReturns.reduce((s, r) => s + Math.pow(r - avgCapped, 2), 0) / cappedReturns.length;
  const volatilityRaw = Math.sqrt(varianceRaw);
  const volatilityCapped = Math.sqrt(varianceCapped);

  const riskFreeRate = 3;
  const sharpeRaw = (avgRaw - riskFreeRate) / (volatilityRaw || 1);
  const sharpeCapped = (avgCapped - riskFreeRate) / (volatilityCapped || 1);

  return {
    totalYears: data.length,
    positiveYears,
    negativeYears,
    cappedYearsCount,
    flooredYearsCount,
    avgRaw: +avgRaw.toFixed(2),
    avgCapped: +avgCapped.toFixed(2),
    volatilityRaw: +volatilityRaw.toFixed(2),
    volatilityCapped: +volatilityCapped.toFixed(2),
    sharpeRaw: +sharpeRaw.toFixed(2),
    sharpeCapped: +sharpeCapped.toFixed(2),
    worstYear: { year: data[worstYearIdx].year, return: worstYear },
    bestYear: { year: data[bestYearIdx].year, return: bestYear },
    finalSP: data[data.length - 1].spCumulative,
    finalIUL: data[data.length - 1].iulCumulative,
  };
}

function CustomBarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const raw = payload.find((p) => p.dataKey === "rawReturn");
  const capped = payload.find((p) => p.dataKey === "cappedReturn");
  return (
    <div className="rounded-xl bg-[#0b1628] border border-[#12233e] p-3 shadow-xl text-xs z-50">
      <div className="text-white font-bold mb-1.5 flex items-center gap-2">
        <Calendar size={14} className="text-blue-400" /> {label}
      </div>
      {raw && (
        <div className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: raw.value >= 0 ? "#22c55e" : "#ef4444" }} />
            <span className="text-[#7a95b8]">S&P 500:</span>
          </div>
          <span className={raw.value >= 0 ? "text-[#22c55e] font-mono" : "text-red-400 font-mono"}>
            {raw.value > 0 ? "+" : ""}{raw.value}%
          </span>
        </div>
      )}
      {capped && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
            <span className="text-[#7a95b8]">IUL Credited:</span>
          </div>
          <span className="text-amber-400 font-mono">{capped.value > 0 ? "+" : ""}{capped.value}%</span>
        </div>
      )}
      {raw && capped && (
        <div className="mt-2 pt-2 border-t border-[#12233e] flex items-center justify-between gap-4">
          <span className="text-[#7a95b8]">Difference:</span>
          <span className="text-white font-mono">{(capped.value - raw.value).toFixed(2)}%</span>
        </div>
      )}
    </div>
  );
}

function CustomLineTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-[#0b1628] border border-[#12233e] p-3 shadow-xl text-xs z-50">
      <div className="text-white font-bold mb-1.5 flex items-center gap-2">
        <Calendar size={14} className="text-blue-400" /> {label}
      </div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: p.color }} />
            <span className="text-[#7a95b8]">{p.name}:</span>
          </div>
          <span className="text-white font-mono">${p.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      ))}
    </div>
  );
}

function CustomScatterTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-xl bg-[#0b1628] border border-[#12233e] p-3 shadow-xl text-xs z-50">
      <div className="text-white font-bold mb-1.5 flex items-center gap-2">
        <Calendar size={14} className="text-blue-400" /> {data.year}
      </div>
      <div className="flex items-center justify-between gap-4 mb-1">
        <span className="text-[#7a95b8]">S&P 500 Return:</span>
        <span className={data.rawReturn >= 0 ? "text-[#22c55e] font-mono" : "text-red-400 font-mono"}>
          {data.rawReturn > 0 ? "+" : ""}{data.rawReturn}%
        </span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-[#7a95b8]">IUL Credited:</span>
        <span className="text-amber-400 font-mono">{data.cappedReturn > 0 ? "+" : ""}{data.cappedReturn}%</span>
      </div>
      <div className="mt-2 text-[10px] text-center text-[#7a95b8] italic">
        {data.isCapped ? "Return was Capped" : data.isFloored ? "Protected by Floor" : "Captured Full Return"}
      </div>
    </div>
  );
}


function StatCard({ title, value, subtitle, icon: Icon, colorClass, trend }: any) {
  return (
    <div className="rounded-xl bg-[#060f20] border border-[#12233e] p-4 hover:border-blue-500/30 transition-colors group">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg bg-[#12233e] group-hover:bg-opacity-80 transition-colors`}>
            <Icon size={16} className={colorClass} />
          </div>
          <span className="text-xs text-[#7a95b8] font-medium">{title}</span>
        </div>
        {trend !== undefined && (
          <div className={`flex items-center text-[10px] px-1.5 py-0.5 rounded-full ${trend > 0 ? 'bg-[#22c55e]/10 text-[#22c55e]' : trend < 0 ? 'bg-red-500/10 text-red-400' : 'bg-gray-500/10 text-gray-400'}`}>
            {trend > 0 ? <TrendingUp size={10} className="mr-1" /> : trend < 0 ? <ArrowDown size={10} className="mr-1" /> : <Minus size={10} className="mr-1" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className={`text-xl font-bold ${colorClass} font-mono tracking-tight`}>{value}</div>
      {subtitle && <div className="text-[10px] text-[#7a95b8] mt-1">{subtitle}</div>}
    </div>
  );
}

function DecadeSummary({ data, cap, floor }: { data: ReturnType<typeof computeChartData>; cap: number; floor: number }) {
  const decades = useMemo(() => {
    const result: { decade: string; avgRaw: number; avgCapped: number; positiveYears: number; worstYear: number; bestYear: number; winRate: number }[] = [];
    for (let start = 1930; start <= 2020; start += 10) {
      const end = start + 9;
      const decadeData = data.filter((d) => d.year >= start && d.year <= end);
      if (decadeData.length === 0) continue;
      const avgRaw = decadeData.reduce((s, d) => s + d.rawReturn, 0) / decadeData.length;
      const avgCapped = decadeData.reduce((s, d) => s + d.cappedReturn, 0) / decadeData.length;
      const positiveYears = decadeData.filter((d) => d.rawReturn > 0).length;
      const worstYear = Math.min(...decadeData.map((d) => d.rawReturn));
      const bestYear = Math.max(...decadeData.map((d) => d.rawReturn));
      result.push({
        decade: `${start}s`,
        avgRaw: +avgRaw.toFixed(2),
        avgCapped: +avgCapped.toFixed(2),
        positiveYears,
        worstYear: +worstYear.toFixed(2),
        bestYear: +bestYear.toFixed(2),
        winRate: (positiveYears / decadeData.length) * 100
      });
    }
    return result;
  }, [data]);

  return (
    <div className="overflow-x-auto rounded-xl border border-[#12233e] bg-[#060f20]">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#12233e] bg-[#0b1628]">
            <th className="text-left py-3 px-4 text-[#7a95b8] font-medium">Decade</th>
            <th className="text-right py-3 px-4 text-[#7a95b8] font-medium">Avg S&P 500</th>
            <th className="text-right py-3 px-4 text-[#7a95b8] font-medium">Avg IUL ({cap}% cap)</th>
            <th className="text-right py-3 px-4 text-[#7a95b8] font-medium">Positive Years</th>
            <th className="text-right py-3 px-4 text-[#7a95b8] font-medium">Worst Year</th>
            <th className="text-right py-3 px-4 text-[#7a95b8] font-medium">Best Year</th>
          </tr>
        </thead>
        <tbody>
          {decades.map((d, i) => (
            <tr key={d.decade} className={`border-b border-[#12233e]/50 hover:bg-[#12233e]/50 transition-colors ${i % 2 === 0 ? 'bg-transparent' : 'bg-[#0b1628]/30'}`}>
              <td className="py-3 px-4 text-white font-medium flex items-center gap-2">
                <History size={14} className="text-blue-400" />
                {d.decade}
              </td>
              <td className={`py-3 px-4 text-right font-mono ${d.avgRaw >= 0 ? "text-[#22c55e]" : "text-red-400"}`}>
                {d.avgRaw > 0 ? "+" : ""}{d.avgRaw}%
              </td>
              <td className="py-3 px-4 text-right font-mono text-amber-400 font-semibold">
                {d.avgCapped > 0 ? "+" : ""}{d.avgCapped}%
              </td>
              <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-white">{d.positiveYears}/10</span>
                  <div className="w-12 h-1.5 bg-[#12233e] rounded-full overflow-hidden">
                    <div className="h-full bg-[#22c55e]" style={{ width: `${d.winRate}%` }} />
                  </div>
                </div>
              </td>
              <td className="py-3 px-4 text-right font-mono text-red-400">{d.worstYear}%</td>
              <td className="py-3 px-4 text-right font-mono text-[#22c55e]">+{d.bestYear}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MarketCycleTable({ data }: { data: ReturnType<typeof computeChartData> }) {
  const cycles = useMemo(() => {
    const result = [];
    if (data.length === 0) return result;
    let currentCycle = { type: data[0].rawReturn >= 0 ? 'bull' : 'bear', startYear: data[0].year, endYear: data[0].year, spReturn: 100, iulReturn: 100, years: 0 };
    
    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      const type = d.rawReturn >= 0 ? 'bull' : 'bear';
      
      if (type === currentCycle.type) {
        currentCycle.endYear = d.year;
        currentCycle.spReturn *= (1 + d.rawReturn / 100);
        currentCycle.iulReturn *= (1 + d.cappedReturn / 100);
        currentCycle.years++;
      } else {
        if (currentCycle.years > 1 || Math.abs(currentCycle.spReturn - 100) > 15) {
          result.push({
            ...currentCycle,
            spReturn: (currentCycle.spReturn - 100),
            iulReturn: (currentCycle.iulReturn - 100),
            avgSp: (Math.pow(currentCycle.spReturn / 100, 1 / currentCycle.years) - 1) * 100,
            avgIul: (Math.pow(currentCycle.iulReturn / 100, 1 / currentCycle.years) - 1) * 100,
          });
        }
        currentCycle = { type, startYear: d.year, endYear: d.year, spReturn: 100 * (1 + d.rawReturn / 100), iulReturn: 100 * (1 + d.cappedReturn / 100), years: 1 };
      }
    }
    
    if (currentCycle.years > 0) {
      result.push({
        ...currentCycle,
        spReturn: (currentCycle.spReturn - 100),
        iulReturn: (currentCycle.iulReturn - 100),
        avgSp: (Math.pow(currentCycle.spReturn / 100, 1 / currentCycle.years) - 1) * 100,
        avgIul: (Math.pow(currentCycle.iulReturn / 100, 1 / currentCycle.years) - 1) * 100,
      });
    }
    
    return result.sort((a, b) => Math.abs(b.spReturn) - Math.abs(a.spReturn)).slice(0, 8);
  }, [data]);

  return (
    <div className="overflow-x-auto rounded-xl border border-[#12233e] bg-[#060f20]">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#12233e] bg-[#0b1628]">
            <th className="text-left py-3 px-4 text-[#7a95b8] font-medium">Market Cycle</th>
            <th className="text-center py-3 px-4 text-[#7a95b8] font-medium">Duration</th>
            <th className="text-right py-3 px-4 text-[#7a95b8] font-medium">S&P 500 Cumulative</th>
            <th className="text-right py-3 px-4 text-[#7a95b8] font-medium">IUL Cumulative</th>
            <th className="text-right py-3 px-4 text-[#7a95b8] font-medium">S&P 500 Annualized</th>
            <th className="text-right py-3 px-4 text-[#7a95b8] font-medium">IUL Annualized</th>
          </tr>
        </thead>
        <tbody>
          {cycles.map((c, i) => (
            <tr key={`${c.startYear}-${c.endYear}`} className={`border-b border-[#12233e]/50 hover:bg-[#12233e]/50 transition-colors ${i % 2 === 0 ? 'bg-transparent' : 'bg-[#0b1628]/30'}`}>
              <td className="py-3 px-4 text-white font-medium flex items-center gap-2">
                {c.type === 'bull' ? <TrendingUp size={14} className="text-[#22c55e]" /> : <TrendingUp size={14} className="text-red-400 transform rotate-180" />}
                {c.startYear} - {c.endYear}
              </td>
              <td className="py-3 px-4 text-center text-[#7a95b8]">
                {c.years} {c.years === 1 ? 'year' : 'years'}
              </td>
              <td className={`py-3 px-4 text-right font-mono ${c.spReturn >= 0 ? "text-[#22c55e]" : "text-red-400"}`}>
                {c.spReturn > 0 ? "+" : ""}{c.spReturn.toFixed(2)}%
              </td>
              <td className={`py-3 px-4 text-right font-mono ${c.iulReturn >= 0 ? "text-amber-400" : "text-amber-600"}`}>
                {c.iulReturn > 0 ? "+" : ""}{c.iulReturn.toFixed(2)}%
              </td>
              <td className={`py-3 px-4 text-right font-mono ${c.avgSp >= 0 ? "text-[#22c55e]" : "text-red-400"}`}>
                {c.avgSp > 0 ? "+" : ""}{c.avgSp.toFixed(2)}%
              </td>
              <td className={`py-3 px-4 text-right font-mono ${c.avgIul >= 0 ? "text-amber-400" : "text-amber-600"}`}>
                {c.avgIul > 0 ? "+" : ""}{c.avgIul.toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DistributionTable({ data, cap, floor }: { data: ReturnType<typeof computeChartData>; cap: number; floor: number }) {
  const distribution = useMemo(() => {
    const buckets = [
      { label: `< ${floor}% (Floor)`, countRaw: 0, countCapped: 0, range: [-100, floor] },
      { label: `${floor}% to 0%`, countRaw: 0, countCapped: 0, range: [floor, 0] },
      { label: `0% to 5%`, countRaw: 0, countCapped: 0, range: [0, 5] },
      { label: `5% to ${cap}%`, countRaw: 0, countCapped: 0, range: [5, cap] },
      { label: `> ${cap}% (Cap)`, countRaw: 0, countCapped: 0, range: [cap, 1000] },
    ];

    data.forEach((d) => {
      if (d.rawReturn < floor) buckets[0].countRaw++;
      else if (d.rawReturn < 0) buckets[1].countRaw++;
      else if (d.rawReturn < 5) buckets[2].countRaw++;
      else if (d.rawReturn < cap) buckets[3].countRaw++;
      else buckets[4].countRaw++;

      if (d.cappedReturn <= floor) buckets[0].countCapped++;
      else if (d.cappedReturn < 0) buckets[1].countCapped++;
      else if (d.cappedReturn < 5) buckets[2].countCapped++;
      else if (d.cappedReturn < cap) buckets[3].countCapped++;
      else buckets[4].countCapped++;
    });

    return buckets;
  }, [data, cap, floor]);

  const totalYears = data.length || 1;

  return (
    <div className="overflow-x-auto rounded-xl border border-[#12233e] bg-[#060f20]">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#12233e] bg-[#0b1628]">
            <th className="text-left py-3 px-4 text-[#7a95b8] font-medium">Return Range</th>
            <th className="text-right py-3 px-4 text-[#7a95b8] font-medium">S&P 500 Years</th>
            <th className="text-right py-3 px-4 text-[#7a95b8] font-medium">% of Time</th>
            <th className="text-right py-3 px-4 text-[#7a95b8] font-medium">IUL Years</th>
            <th className="text-right py-3 px-4 text-[#7a95b8] font-medium">% of Time</th>
          </tr>
        </thead>
        <tbody>
          {distribution.map((b, i) => (
            <tr key={i} className={`border-b border-[#12233e]/50 hover:bg-[#12233e]/50 transition-colors ${i % 2 === 0 ? 'bg-transparent' : 'bg-[#0b1628]/30'}`}>
              <td className="py-3 px-4 text-white font-medium">{b.label}</td>
              <td className="py-3 px-4 text-right text-blue-400 font-mono">{b.countRaw}</td>
              <td className="py-3 px-4 text-right text-[#7a95b8] font-mono">{((b.countRaw / totalYears) * 100).toFixed(1)}%</td>
              <td className="py-3 px-4 text-right text-amber-400 font-mono">{b.countCapped}</td>
              <td className="py-3 px-4 text-right text-[#7a95b8] font-mono">{((b.countCapped / totalYears) * 100).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TopBottomYearsTable({ data }: { data: ReturnType<typeof computeChartData> }) {
  const top5 = [...data].sort((a, b) => b.rawReturn - a.rawReturn).slice(0, 5);
  const bottom5 = [...data].sort((a, b) => a.rawReturn - b.rawReturn).slice(0, 5);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="rounded-xl border border-[#12233e] bg-[#060f20] overflow-hidden">
        <div className="bg-[#0b1628] py-2 px-4 border-b border-[#12233e] flex items-center gap-2">
          <ArrowUp size={14} className="text-[#22c55e]" />
          <span className="text-white font-medium text-sm">Best 5 Years (S&P 500)</span>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#12233e]/50">
              <th className="text-left py-2 px-4 text-[#7a95b8] font-medium">Year</th>
              <th className="text-right py-2 px-4 text-[#7a95b8] font-medium">S&P 500</th>
              <th className="text-right py-2 px-4 text-[#7a95b8] font-medium">IUL</th>
            </tr>
          </thead>
          <tbody>
            {top5.map((d, i) => (
              <tr key={d.year} className={`border-b border-[#12233e]/30 hover:bg-[#12233e]/50 ${i % 2 === 0 ? 'bg-transparent' : 'bg-[#0b1628]/20'}`}>
                <td className="py-2 px-4 text-white font-medium">{d.year}</td>
                <td className="py-2 px-4 text-right text-[#22c55e] font-mono">+{d.rawReturn}%</td>
                <td className="py-2 px-4 text-right text-amber-400 font-mono">+{d.cappedReturn}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-[#12233e] bg-[#060f20] overflow-hidden">
        <div className="bg-[#0b1628] py-2 px-4 border-b border-[#12233e] flex items-center gap-2">
          <ArrowDown size={14} className="text-red-400" />
          <span className="text-white font-medium text-sm">Worst 5 Years (S&P 500)</span>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#12233e]/50">
              <th className="text-left py-2 px-4 text-[#7a95b8] font-medium">Year</th>
              <th className="text-right py-2 px-4 text-[#7a95b8] font-medium">S&P 500</th>
              <th className="text-right py-2 px-4 text-[#7a95b8] font-medium">IUL</th>
            </tr>
          </thead>
          <tbody>
            {bottom5.map((d, i) => (
              <tr key={d.year} className={`border-b border-[#12233e]/30 hover:bg-[#12233e]/50 ${i % 2 === 0 ? 'bg-transparent' : 'bg-[#0b1628]/20'}`}>
                <td className="py-2 px-4 text-white font-medium">{d.year}</td>
                <td className="py-2 px-4 text-right text-red-400 font-mono">{d.rawReturn}%</td>
                <td className="py-2 px-4 text-right text-amber-400 font-mono">{d.cappedReturn}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RollingReturnsTable({ data, period }: { data: ReturnType<typeof computeChartData>; period: number }) {
  const rolling = useMemo(() => {
    const result = [];
    for (let i = 0; i <= data.length - period; i++) {
      const slice = data.slice(i, i + period);
      const startYear = slice[0].year;
      const endYear = slice[slice.length - 1].year;
      
      let spCum = 1;
      let iulCum = 1;
      
      slice.forEach((d) => {
        spCum *= (1 + d.rawReturn / 100);
        iulCum *= (1 + d.cappedReturn / 100);
      });
      
      const spAnn = (Math.pow(spCum, 1 / period) - 1) * 100;
      const iulAnn = (Math.pow(iulCum, 1 / period) - 1) * 100;
      
      result.push({
        period: `${startYear}-${endYear}`,
        spAnn,
        iulAnn,
        diff: iulAnn - spAnn
      });
    }
    return result;
  }, [data, period]);

  const stats = useMemo(() => {
    if (rolling.length === 0) return null;
    
    const spSorted = [...rolling].sort((a, b) => a.spAnn - b.spAnn);
    const iulSorted = [...rolling].sort((a, b) => a.iulAnn - b.iulAnn);
    
    const spAvg = rolling.reduce((s, r) => s + r.spAnn, 0) / rolling.length;
    const iulAvg = rolling.reduce((s, r) => s + r.iulAnn, 0) / rolling.length;
    
    const spPositive = rolling.filter((r) => r.spAnn > 0).length / rolling.length * 100;
    const iulPositive = rolling.filter((r) => r.iulAnn > 0).length / rolling.length * 100;
    
    return {
      spBest: spSorted[spSorted.length - 1].spAnn,
      spWorst: spSorted[0].spAnn,
      spMedian: spSorted[Math.floor(spSorted.length / 2)].spAnn,
      spAvg,
      spPositive,
      iulBest: iulSorted[iulSorted.length - 1].iulAnn,
      iulWorst: iulSorted[0].iulAnn,
      iulMedian: iulSorted[Math.floor(iulSorted.length / 2)].iulAnn,
      iulAvg,
      iulPositive,
      count: rolling.length
    };
  }, [rolling]);

  if (!stats) return null;

  return (
    <div className="overflow-x-auto rounded-xl border border-[#12233e] bg-[#060f20]">
      <div className="bg-[#0b1628] py-3 px-4 border-b border-[#12233e] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History size={16} className="text-blue-400" />
          <span className="text-white font-medium text-sm">{period}-Year Rolling Returns Analysis</span>
        </div>
        <span className="text-xs text-[#7a95b8]">{stats.count} rolling periods analyzed</span>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#12233e] bg-[#0b1628]/50">
            <th className="text-left py-3 px-4 text-[#7a95b8] font-medium">Metric</th>
            <th className="text-right py-3 px-4 text-[#7a95b8] font-medium">S&P 500 (Raw)</th>
            <th className="text-right py-3 px-4 text-[#7a95b8] font-medium">IUL (Capped)</th>
            <th className="text-right py-3 px-4 text-[#7a95b8] font-medium">Difference</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-[#12233e]/50 hover:bg-[#12233e]/30">
            <td className="py-3 px-4 text-white font-medium">Average Annualized</td>
            <td className={`py-3 px-4 text-right font-mono ${stats.spAvg >= 0 ? "text-[#22c55e]" : "text-red-400"}`}>
              {stats.spAvg > 0 ? "+" : ""}{stats.spAvg.toFixed(2)}%
            </td>
            <td className={`py-3 px-4 text-right font-mono ${stats.iulAvg >= 0 ? "text-amber-400" : "text-amber-600"}`}>
              {stats.iulAvg > 0 ? "+" : ""}{stats.iulAvg.toFixed(2)}%
            </td>
            <td className="py-3 px-4 text-right font-mono text-white">
              {(stats.iulAvg - stats.spAvg).toFixed(2)}%
            </td>
          </tr>
          <tr className="border-b border-[#12233e]/50 hover:bg-[#12233e]/30 bg-[#0b1628]/20">
            <td className="py-3 px-4 text-white font-medium">Median Annualized</td>
            <td className={`py-3 px-4 text-right font-mono ${stats.spMedian >= 0 ? "text-[#22c55e]" : "text-red-400"}`}>
              {stats.spMedian > 0 ? "+" : ""}{stats.spMedian.toFixed(2)}%
            </td>
            <td className={`py-3 px-4 text-right font-mono ${stats.iulMedian >= 0 ? "text-amber-400" : "text-amber-600"}`}>
              {stats.iulMedian > 0 ? "+" : ""}{stats.iulMedian.toFixed(2)}%
            </td>
            <td className="py-3 px-4 text-right font-mono text-white">
              {(stats.iulMedian - stats.spMedian).toFixed(2)}%
            </td>
          </tr>
          <tr className="border-b border-[#12233e]/50 hover:bg-[#12233e]/30">
            <td className="py-3 px-4 text-white font-medium">Best Period</td>
            <td className="py-3 px-4 text-right font-mono text-[#22c55e]">
              +{stats.spBest.toFixed(2)}%
            </td>
            <td className="py-3 px-4 text-right font-mono text-amber-400">
              +{stats.iulBest.toFixed(2)}%
            </td>
            <td className="py-3 px-4 text-right font-mono text-white">
              {(stats.iulBest - stats.spBest).toFixed(2)}%
            </td>
          </tr>
          <tr className="border-b border-[#12233e]/50 hover:bg-[#12233e]/30 bg-[#0b1628]/20">
            <td className="py-3 px-4 text-white font-medium">Worst Period</td>
            <td className={`py-3 px-4 text-right font-mono ${stats.spWorst >= 0 ? "text-[#22c55e]" : "text-red-400"}`}>
              {stats.spWorst > 0 ? "+" : ""}{stats.spWorst.toFixed(2)}%
            </td>
            <td className={`py-3 px-4 text-right font-mono ${stats.iulWorst >= 0 ? "text-amber-400" : "text-red-400"}`}>
              {stats.iulWorst > 0 ? "+" : ""}{stats.iulWorst.toFixed(2)}%
            </td>
            <td className="py-3 px-4 text-right font-mono text-white">
              {(stats.iulWorst - stats.spWorst).toFixed(2)}%
            </td>
          </tr>
          <tr className="hover:bg-[#12233e]/30">
            <td className="py-3 px-4 text-white font-medium">% of Positive Periods</td>
            <td className="py-3 px-4 text-right font-mono text-[#22c55e]">
              {stats.spPositive.toFixed(1)}%
            </td>
            <td className="py-3 px-4 text-right font-mono text-amber-400">
              {stats.iulPositive.toFixed(1)}%
            </td>
            <td className="py-3 px-4 text-right font-mono text-white">
              {(stats.iulPositive - stats.spPositive).toFixed(1)}%
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function IbbotsonCharts() {
  const { clientData } = useClientData();
  const { user } = useAuth();
  const [cap, setCap] = useState(8);
  const [floor, setFloor] = useState(0);
  const [participationRate, setParticipationRate] = useState(100);
  const [spread, setSpread] = useState(0);
  const [activeTab, setActiveTab] = useState<"annual" | "cumulative" | "decade" | "scatter" | "distribution" | "rolling">("annual");
  const [rollingPeriod, setRollingPeriod] = useState(10);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [startYear, setStartYear] = useState(1929);
  const [endYear, setEndYear] = useState(2025);

  const { data: marketData } = trpc.marketData.getHistoricalRates.useQuery();
  const { data: strategyData } = trpc.strategy.getTemplates.useQuery();
  const { data: scenarioData } = trpc.scenarios.list.useQuery();
  const { data: clientApiData } = trpc.clients.list.useQuery();
  const { data: carrierData } = trpc.carrierQuotes.getProducts.useQuery();
  
  const handleSaveStrategy = trpc.savedStrategies.create.useMutation();
  const handleExport = trpc.strategyExport.generatePdf.useMutation();

  const fullChartData = useMemo(() => computeChartData(cap, floor, participationRate, spread), [cap, floor, participationRate, spread]);
  
  const chartData = useMemo(() => {
    return fullChartData.filter((d) => d.year >= startYear && d.year <= endYear);
  }, [fullChartData, startYear, endYear]);
  
  const stats = useMemo(() => computeStats(chartData), [chartData]);

  const scatterData = useMemo(() => {
    return chartData.map((d) => ({
      year: d.year,
      rawReturn: d.rawReturn,
      cappedReturn: d.cappedReturn,
      isCapped: d.isCapped,
      isFloored: d.isFloored
    }));
  }, [chartData]);

  const radarData = useMemo(() => {
    return [
      { subject: 'Return (Avg)', sp: stats.avgRaw, iul: stats.avgCapped, fullMark: 15 },
      { subject: 'Risk (Vol)', sp: stats.volatilityRaw, iul: stats.volatilityCapped, fullMark: 25 },
      { subject: 'Win Rate', sp: (stats.positiveYears / stats.totalYears) * 10, iul: (stats.positiveYears / stats.totalYears) * 10, fullMark: 10 },
      { subject: 'Worst Case', sp: Math.abs(stats.worstYear.return) / 5, iul: Math.abs(floor) / 5, fullMark: 10 },
      { subject: 'Sharpe', sp: stats.sharpeRaw * 10, iul: stats.sharpeCapped * 10, fullMark: 10 },
    ];
  }, [stats, floor]);

  const handleReset = () => {
    setCap(8);
    setFloor(0);
    setParticipationRate(100);
    setSpread(0);
    setStartYear(1929);
    setEndYear(2025);
  };

  const handlePreset = (type: string) => {
    switch (type) {
      case 'conservative':
        setCap(6);
        setFloor(1);
        setParticipationRate(100);
        break;
      case 'balanced':
        setCap(8);
        setFloor(0);
        setParticipationRate(100);
        break;
      case 'aggressive':
        setCap(12);
        setFloor(0);
        setParticipationRate(80);
        break;
      case 'uncapped':
        setCap(100);
        setFloor(0);
        setParticipationRate(50);
        break;
    }
  };

  return (
    <AppShell>
      <div className="rc-page-header flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/12 border border-blue-500/20 flex items-center justify-center">
            <BarChart3 size={18} className="text-blue-400" />
          </div>
          <div>
            <h1 className="rc-page-title">Ibbotson Charts & IUL Foundation</h1>
            <p className="rc-page-subtitle">
              Historical S&P 500 data since 1929 — the foundation of Indexed Universal Life insurance crediting
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleExport.mutate({ type: 'ibbotson', data: { cap, floor, stats } })}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0b1628] border border-[#12233e] text-xs text-white hover:bg-[#12233e] transition-colors"
          >
            <Download size={14} /> Export PDF
          </button>
          <button 
            onClick={() => handleSaveStrategy.mutate({ name: `IUL ${cap}/${floor}`, type: 'iul_analysis', data: { cap, floor, participationRate, spread } })}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0b1628] border border-[#12233e] text-xs text-white hover:bg-[#12233e] transition-colors"
          >
            <Share2 size={14} /> Save Strategy
          </button>
          <ExportToSlides
            toolName="Ibbotson Charts & IUL Foundation"
            getSections={() => [
              {
                title: "Simulator Settings",
                items: [
                  { label: "Cap Rate", value: `${cap}%` },
                  { label: "Floor Rate", value: `${floor}%` },
                  { label: "Participation", value: `${participationRate}%` },
                  { label: "Spread", value: `${spread}%` },
                ],
              },
              {
                title: "Performance Summary",
                items: [
                  { label: "Years of Data", value: stats.totalYears.toString() },
                  { label: "Avg IUL Credit", value: `${stats.avgCapped}%` },
                  { label: "Positive Years", value: stats.positiveYears.toString() },
                  { label: "Negative Years (0% in IUL)", value: stats.negativeYears.toString() },
                ],
              },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* ── Sidebar Controls ────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="IbbotsonCharts" />

        <ExecutiveSummary
          pageTitle="Ibbotson Charts"
          whatItDoes="This market analysis tool provides institutional-grade analysis of your financial situation, modeling multiple scenarios and projecting outcomes based on your specific inputs. It transforms complex market analysis concepts into clear, actionable insights with dollar-quantified recommendations."
          opportunities="Historical data shows that strategic index allocation with downside protection consistently outperforms both pure equity and pure fixed strategies over 10+ year periods."
          intent="To give you the same caliber of market analysis analysis that institutional investors and ultra-high-net-worth families receive — now accessible to every client."
          takeaway="Understanding your market analysis options with precise dollar amounts empowers you to make confident decisions that compound into significant wealth over time."
          callToAction="Enter your numbers and see exactly how market analysis strategies can improve your financial outcome."
          followUpQuestions={[
            "How does this market analysis strategy interact with my other financial plans?",
            "What\'s the single biggest market analysis opportunity I\'m currently missing?",
            "How would my results change if I started this strategy 5 years earlier?",
          ]}
        />
        <GoalsAccelerator pageName="Ibbotson Charts" pageContext="Ibbotson Charts — market analysis modeling with projections and scenario analysis" />
        <TaxBracketPanel grossIncome={clientData?.annualIncome || 150000} filingStatus={clientData?.filingStatus || "single"} stateCode={clientData?.state || "TX"} />
        <RecommendationSummary
          headline="This market analysis strategy can significantly improve your financial outcome"
          detail="Based on your profile, implementing the recommended market analysis approach could generate substantial savings and growth over your planning horizon."
          dollarBenefit={280000}
          timeHorizon="20 years"
          confidence="high"
          nextStep="Review with your advisor"
        />
        <DoNothingBaseline
          metrics={[
            { label: "Risk-Adjusted Return", doNothing: 5.2, recommended: 8.4, format: "percent" },
            { label: "Downside Protection", doNothing: 0, recommended: 100, format: "percent" },
            { label: "20-Year Growth", doNothing: 450000, recommended: 730000, format: "currency" },
          ]}
          summary="Without taking action on market analysis, you leave significant value on the table that compounds into a major opportunity cost over time."
        />
          <div className="rc-card space-y-5">
            <div className="flex items-center justify-between border-b border-[#12233e] pb-3">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Settings size={16} className="text-blue-400" /> Simulator Settings
              </h3>
              <button onClick={handleReset} className="text-xs text-[#7a95b8] hover:text-white flex items-center gap-1">
                <RefreshCw size={12} /> Reset
              </button>
            </div>

            {/* Presets */}
            <div className="space-y-2">
              <label className="text-xs text-[#7a95b8] font-medium block">Quick Presets</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handlePreset('conservative')} className="px-2 py-1.5 rounded bg-[#0b1628] border border-[#12233e] text-[10px] text-white hover:border-blue-500/50 transition-colors">Conservative</button>
                <button onClick={() => handlePreset('balanced')} className="px-2 py-1.5 rounded bg-[#0b1628] border border-[#12233e] text-[10px] text-white hover:border-blue-500/50 transition-colors">Balanced</button>
                <button onClick={() => handlePreset('aggressive')} className="px-2 py-1.5 rounded bg-[#0b1628] border border-[#12233e] text-[10px] text-white hover:border-blue-500/50 transition-colors">Aggressive</button>
                <button onClick={() => handlePreset('uncapped')} className="px-2 py-1.5 rounded bg-[#0b1628] border border-[#12233e] text-[10px] text-white hover:border-blue-500/50 transition-colors">Uncapped</button>
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-[#12233e]">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <label className="text-[#7a95b8] font-medium flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-[#22c55e]" /> Cap Rate
                  </label>
                  <span className="text-white font-mono bg-[#0b1628] px-2 py-0.5 rounded border border-[#12233e]">{cap}%</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="20"
                  step="0.25"
                  value={cap}
                  onChange={(e) => setCap(Number(e.target.value))}
                  className="w-full accent-[#22c55e] h-1.5 bg-[#12233e] rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#7a95b8] mt-1">
                  <span>4%</span>
                  <span>Maximum upside potential</span>
                  <span>20%</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <label className="text-[#7a95b8] font-medium flex items-center gap-1.5">
                    <Shield size={14} className="text-amber-400" /> Floor Rate
                  </label>
                  <span className="text-white font-mono bg-[#0b1628] px-2 py-0.5 rounded border border-[#12233e]">{floor}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.5"
                  value={floor}
                  onChange={(e) => setFloor(Number(e.target.value))}
                  className="w-full accent-amber-400 h-1.5 bg-[#12233e] rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#7a95b8] mt-1">
                  <span>0%</span>
                  <span>Downside protection</span>
                  <span>3%</span>
                </div>
              </div>
            </div>

            {/* Advanced Settings Toggle */}
            <div className="pt-2 border-t border-[#12233e]">
              <button 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between text-xs text-[#7a95b8] hover:text-white transition-colors py-1"
              >
                <span className="flex items-center gap-1.5"><Filter size={14} /> Advanced Settings</span>
                {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {/* Advanced Settings */}
            {showAdvanced && (
              <div className="space-y-4 pt-2 animate-in slide-in-from-top-2 duration-200">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <label className="text-[#7a95b8] font-medium flex items-center gap-1.5">
                      <Percent size={14} className="text-blue-400" /> Participation
                    </label>
                    <span className="text-white font-mono bg-[#0b1628] px-2 py-0.5 rounded border border-[#12233e]">{participationRate}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    step="5"
                    value={participationRate}
                    onChange={(e) => setParticipationRate(Number(e.target.value))}
                    className="w-full accent-blue-400 h-1.5 bg-[#12233e] rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <label className="text-[#7a95b8] font-medium flex items-center gap-1.5">
                      <Minus size={14} className="text-red-400" /> Spread
                    </label>
                    <span className="text-white font-mono bg-[#0b1628] px-2 py-0.5 rounded border border-[#12233e]">{spread}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.25"
                    value={spread}
                    onChange={(e) => setSpread(Number(e.target.value))}
                    className="w-full accent-red-400 h-1.5 bg-[#12233e] rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="pt-2 border-t border-[#12233e]">
                  <label className="text-xs text-[#7a95b8] font-medium block mb-2">Timeframe</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      min="1929" 
                      max={endYear - 1} 
                      value={startYear} 
                      onChange={(e) => setStartYear(Number(e.target.value))}
                      className="w-full bg-[#0b1628] border border-[#12233e] rounded px-2 py-1 text-xs text-white"
                    />
                    <span className="text-[#7a95b8] text-xs">to</span>
                    <input 
                      type="number" 
                      min={startYear + 1} 
                      max="2025" 
                      value={endYear} 
                      onChange={(e) => setEndYear(Number(e.target.value))}
                      className="w-full bg-[#0b1628] border border-[#12233e] rounded px-2 py-1 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Key Metrics Sidebar */}
          <div className="rc-card space-y-4 bg-gradient-to-b from-[#060f20] to-[#0b1628]">
            <h3 className="text-white font-semibold flex items-center gap-2 border-b border-[#12233e] pb-3">
              <Activity size={16} className="text-blue-400" /> Key Metrics ({startYear}-{endYear})
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#060f20] border border-[#12233e] rounded-lg p-3">
                <div className="text-[10px] text-[#7a95b8] mb-1">Avg S&P Return</div>
                <div className={`text-lg font-bold font-mono ${stats.avgRaw >= 0 ? 'text-[#22c55e]' : 'text-red-400'}`}>
                  {stats.avgRaw > 0 ? '+' : ''}{stats.avgRaw}%
                </div>
              </div>
              <div className="bg-[#060f20] border border-[#12233e] rounded-lg p-3">
                <div className="text-[10px] text-[#7a95b8] mb-1">Avg IUL Credit</div>
                <div className="text-lg font-bold font-mono text-amber-400">
                  {stats.avgCapped > 0 ? '+' : ''}{stats.avgCapped}%
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#7a95b8]">Win Rate (Positive Yrs)</span>
                <span className="text-white font-mono">{(stats.positiveYears / stats.totalYears * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-[#12233e] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#22c55e] h-full" style={{ width: `${(stats.positiveYears / stats.totalYears) * 100}%` }} />
              </div>
              
              <div className="flex justify-between items-center text-xs pt-2">
                <span className="text-[#7a95b8]">Years Capped</span>
                <span className="text-white font-mono">{stats.cappedYearsCount} / {stats.totalYears}</span>
              </div>
              <div className="w-full bg-[#12233e] h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-400 h-full" style={{ width: `${(stats.cappedYearsCount / stats.totalYears) * 100}%` }} />
              </div>

              <div className="flex justify-between items-center text-xs pt-2">
                <span className="text-[#7a95b8]">Years Protected (Floor)</span>
                <span className="text-white font-mono">{stats.flooredYearsCount} / {stats.totalYears}</span>
              </div>
              <div className="w-full bg-[#12233e] h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-400 h-full" style={{ width: `${(stats.flooredYearsCount / stats.totalYears) * 100}%` }} />
              </div>
            </div>
            
            <div className="pt-3 border-t border-[#12233e]">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-[#7a95b8]">Volatility (Risk)</span>
                <span className="text-white font-mono">{stats.volatilityCapped}% vs {stats.volatilityRaw}%</span>
              </div>
              <div className="text-[10px] text-amber-400 italic">
                IUL reduces volatility by {((1 - stats.volatilityCapped / (stats.volatilityRaw || 1)) * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>

        {/* ── Main Content Area ───────────────────────────────────────── */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* Top Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard 
              title="Total Years" 
              value={stats.totalYears} 
              icon={Calendar} 
              colorClass="text-blue-400" 
            />
            <StatCard 
              title="Avg IUL Return" 
              value={`${stats.avgCapped}%`} 
              subtitle={`vs ${stats.avgRaw}% S&P 500`}
              icon={TrendingUp} 
              colorClass="text-amber-400" 
              trend={+(stats.avgCapped - stats.avgRaw).toFixed(2)}
            />
            <StatCard 
              title="Zero/Floor Years" 
              value={stats.flooredYearsCount} 
              subtitle={`${(stats.flooredYearsCount / stats.totalYears * 100).toFixed(1)}% of time`}
              icon={Shield} 
              colorClass="text-[#22c55e]" 
            />
            <StatCard 
              title="Sharpe Ratio" 
              value={stats.sharpeCapped} 
              subtitle={`vs ${stats.sharpeRaw} S&P 500`}
              icon={Target} 
              colorClass="text-purple-400" 
            />
          </div>

          <div className="rc-card p-0 overflow-hidden flex flex-col h-[600px]">
            {/* Tabs */}
            <div className="flex border-b border-[#12233e] overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab("annual")}
                className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                  activeTab === "annual" ? "text-blue-400 border-b-2 border-blue-400 bg-blue-500/5" : "text-[#7a95b8] hover:text-white hover:bg-[#12233e]/30"
                }`}
              >
                <BarChart3 size={16} /> Annual Returns
              </button>
              <button
                onClick={() => setActiveTab("cumulative")}
                className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                  activeTab === "cumulative" ? "text-blue-400 border-b-2 border-blue-400 bg-blue-500/5" : "text-[#7a95b8] hover:text-white hover:bg-[#12233e]/30"
                }`}
              >
                <LineChartIcon size={16} /> Cumulative Growth
              </button>
              <button
                onClick={() => setActiveTab("decade")}
                className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                  activeTab === "decade" ? "text-blue-400 border-b-2 border-blue-400 bg-blue-500/5" : "text-[#7a95b8] hover:text-white hover:bg-[#12233e]/30"
                }`}
              >
                <History size={16} /> Decade Summary
              </button>
              <button
                onClick={() => setActiveTab("rolling")}
                className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                  activeTab === "rolling" ? "text-blue-400 border-b-2 border-blue-400 bg-blue-500/5" : "text-[#7a95b8] hover:text-white hover:bg-[#12233e]/30"
                }`}
              >
                <RefreshCw size={16} /> Rolling Returns
              </button>
              <button
                onClick={() => setActiveTab("distribution")}
                className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                  activeTab === "distribution" ? "text-blue-400 border-b-2 border-blue-400 bg-blue-500/5" : "text-[#7a95b8] hover:text-white hover:bg-[#12233e]/30"
                }`}
              >
                <PieChartIcon size={16} /> Distribution
              </button>
              <button
                onClick={() => setActiveTab("scatter")}
                className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                  activeTab === "scatter" ? "text-blue-400 border-b-2 border-blue-400 bg-blue-500/5" : "text-[#7a95b8] hover:text-white hover:bg-[#12233e]/30"
                }`}
              >
                <Target size={16} /> Risk vs Reward
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto">
              {/* Annual Returns Chart */}
              {activeTab === "annual" && (
                <div className="h-full flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-xs text-[#7a95b8] max-w-2xl">
                      Year-by-year comparison of raw S&P 500 returns versus IUL credited returns.
                      Notice how the <span className="text-amber-400 font-semibold">amber bars</span> never drop below {floor}%, 
                      protecting against major market crashes like 1931, 2008, and 2022.
                    </p>
                    <div className="flex items-center gap-3 text-[10px] bg-[#0b1628] px-3 py-1.5 rounded-lg border border-[#12233e]">
                      <div className="flex items-center gap-1"><div className="w-2 h-2 bg-[#22c55e40] rounded-sm"></div> S&P Gain</div>
                      <div className="flex items-center gap-1"><div className="w-2 h-2 bg-[#ef444440] rounded-sm"></div> S&P Loss</div>
                      <div className="flex items-center gap-1"><div className="w-2 h-2 bg-amber-400 rounded-sm"></div> IUL Credit</div>
                    </div>
                  </div>
                  <div className="flex-1 min-h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                        <XAxis
                          dataKey="year"
                          tick={{ fill: "#7a95b8", fontSize: 10 }}
                          tickLine={false}
                          axisLine={{ stroke: '#12233e' }}
                          interval="preserveStartEnd"
                          minTickGap={20}
                        />
                        <YAxis
                          tick={{ fill: "#7a95b8", fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#12233e', opacity: 0.4 }} />
                        <ReferenceLine y={cap} stroke="#22c55e" strokeDasharray="5 3" label={{ value: `${cap}% Cap`, fill: "#22c55e", fontSize: 10, position: "insideTopRight" }} />
                        <ReferenceLine y={floor} stroke="#f59e0b" strokeDasharray="5 3" label={{ value: `${floor}% Floor`, fill: "#f59e0b", fontSize: 10, position: "insideBottomRight" }} />
                        <ReferenceLine y={0} stroke="#334155" strokeWidth={2} />
                        <Bar dataKey="rawReturn" name="S&P 500 Return" radius={[2, 2, 0, 0]} maxBarSize={12}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.rawReturn >= 0 ? "#22c55e40" : "#ef444440"} />
                          ))}
                        </Bar>
                        <Bar dataKey="cappedReturn" name="IUL Credited" fill="#f59e0b" radius={[2, 2, 0, 0]} maxBarSize={6} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Cumulative Growth Chart */}
              {activeTab === "cumulative" && (
                <div className="h-full flex flex-col">
                  <p className="text-xs text-[#7a95b8] mb-4 max-w-3xl">
                    Growth of <span className="text-white font-semibold">$100</span> invested in {startYear}. The <span className="text-blue-400">blue line</span> shows
                    raw S&P 500 total return. The <span className="text-[#22c55e]">green line</span> shows what an IUL policy would have accumulated
                    with a {cap}% cap and {floor}% floor — <span className="text-white font-semibold">never losing a single dollar in down years</span>.
                    (Logarithmic scale used to show true relative growth over time).
                  </p>
                  <div className="flex-1 min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorSp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorIul" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                        <XAxis dataKey="year" tick={{ fill: "#7a95b8", fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#12233e' }} interval="preserveStartEnd" minTickGap={20} />
                        <YAxis
                          tick={{ fill: "#7a95b8", fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`}
                          scale="log"
                          domain={["auto", "auto"]}
                        />
                        <Tooltip content={<CustomLineTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 11, paddingTop: '10px' }} iconType="circle" />
                        <Area
                          type="monotone"
                          dataKey="spCumulative"
                          name="S&P 500 (raw)"
                          stroke="#3b82f6"
                          fillOpacity={1}
                          fill="url(#colorSp)"
                          strokeWidth={2}
                          activeDot={{ r: 6, fill: '#3b82f6', stroke: '#060f20', strokeWidth: 2 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="iulCumulative"
                          name={`IUL (${cap}% cap / ${floor}% floor)`}
                          stroke="#22c55e"
                          fillOpacity={1}
                          fill="url(#colorIul)"
                          strokeWidth={2}
                          activeDot={{ r: 6, fill: '#22c55e', stroke: '#060f20', strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="rounded-xl bg-gradient-to-br from-[#060f20] to-[#0b1628] border border-blue-500/30 p-4 relative overflow-hidden">
                      <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
                      <div className="text-xs text-[#7a95b8] mb-1 flex items-center gap-1.5"><TrendingUp size={14} className="text-blue-400"/> $100 → S&P 500 (raw)</div>
                      <div className="text-3xl font-bold text-blue-400 font-mono my-2">${stats.finalSP.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                      <div className="text-[10px] text-[#7a95b8] bg-[#12233e]/50 inline-block px-2 py-1 rounded">Includes all market crashes & recoveries</div>
                    </div>
                    <div className="rounded-xl bg-gradient-to-br from-[#060f20] to-[#0b1628] border border-[#22c55e]/30 p-4 relative overflow-hidden">
                      <div className="absolute right-0 top-0 w-24 h-24 bg-[#22c55e]/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
                      <div className="text-xs text-[#7a95b8] mb-1 flex items-center gap-1.5"><Shield size={14} className="text-[#22c55e]"/> $100 → IUL ({cap}%/{floor}%)</div>
                      <div className="text-3xl font-bold text-[#22c55e] font-mono my-2">${stats.finalIUL.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                      <div className="text-[10px] text-[#7a95b8] bg-[#12233e]/50 inline-block px-2 py-1 rounded">Never lost a dollar in any down year</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Decade Summary Table */}
              {activeTab === "decade" && (
                <div className="space-y-6">
                  <p className="text-xs text-[#7a95b8] max-w-3xl">
                    Decade-by-decade breakdown showing average S&P 500 returns vs. IUL credited returns with a {cap}% cap and {floor}% floor.
                    Notice how the IUL average remains positive in every decade — even the 1930s (Great Depression) and 2000s (Dot-com bust & GFC).
                  </p>
                  <DecadeSummary data={chartData} cap={cap} floor={floor} />
                  
                  <div className="mt-6">
                    <h4 className="text-white font-medium text-sm mb-3 flex items-center gap-2">
                      <Activity size={16} className="text-blue-400" /> Major Market Cycles
                    </h4>
                    <MarketCycleTable data={chartData} />
                  </div>
                </div>
              )}

              {/* Rolling Returns */}
              {activeTab === "rolling" && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <p className="text-xs text-[#7a95b8] max-w-2xl">
                      Rolling returns eliminate the "starting year bias" by analyzing every possible {rollingPeriod}-year period 
                      between {startYear} and {endYear}. This provides a much more accurate picture of expected outcomes.
                    </p>
                    <div className="flex items-center gap-2 bg-[#0b1628] border border-[#12233e] rounded-lg p-1">
                      {[5, 10, 15, 20].map((p) => (
                        <button
                          key={p}
                          onClick={() => setRollingPeriod(p)}
                          className={`px-3 py-1 text-xs rounded-md transition-colors ${rollingPeriod === p ? 'bg-blue-500/20 text-blue-400 font-medium' : 'text-[#7a95b8] hover:text-white'}`}
                        >
                          {p}-Year
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <RollingReturnsTable data={chartData} period={rollingPeriod} />
                  
                  <div className="mt-6 h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData.slice(rollingPeriod)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                        <XAxis dataKey="year" tick={{ fill: "#7a95b8", fontSize: 10 }} tickLine={false} />
                        <YAxis tick={{ fill: "#7a95b8", fontSize: 10 }} tickLine={false} tickFormatter={(v) => `${v}%`} />
                        <Tooltip content={<CustomLineTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <ReferenceLine y={0} stroke="#334155" />
                        <Line type="monotone" dataKey="rawReturn" name="S&P 500 Annual" stroke="#3b82f6" strokeWidth={1} dot={false} opacity={0.3} />
                        <Line type="monotone" dataKey="cappedReturn" name="IUL Annual" stroke="#22c55e" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Distribution */}
              {activeTab === "distribution" && (
                <div className="space-y-6">
                  <p className="text-xs text-[#7a95b8] max-w-3xl">
                    Return distribution analysis shows how often returns fall into specific ranges. 
                    IUL dramatically shifts the distribution by eliminating all negative returns and stacking them at the {floor}% floor.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DistributionTable data={chartData} cap={cap} floor={floor} />
                    
                    <div className="rounded-xl border border-[#12233e] bg-[#060f20] p-4 flex flex-col">
                      <h4 className="text-white font-medium text-sm mb-4 text-center">Return Frequency Distribution</h4>
                      <div className="flex-1 min-h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            { name: `<${floor}%`, sp: chartData.filter((d) => d.rawReturn < floor).length, iul: chartData.filter((d) => d.cappedReturn <= floor).length },
                            { name: `${floor}-0%`, sp: chartData.filter((d) => d.rawReturn >= floor && d.rawReturn < 0).length, iul: chartData.filter((d) => d.cappedReturn > floor && d.cappedReturn < 0).length },
                            { name: `0-5%`, sp: chartData.filter((d) => d.rawReturn >= 0 && d.rawReturn < 5).length, iul: chartData.filter((d) => d.cappedReturn >= 0 && d.cappedReturn < 5).length },
                            { name: `5-${cap}%`, sp: chartData.filter((d) => d.rawReturn >= 5 && d.rawReturn < cap).length, iul: chartData.filter((d) => d.cappedReturn >= 5 && d.cappedReturn < cap).length },
                            { name: `>${cap}%`, sp: chartData.filter((d) => d.rawReturn >= cap).length, iul: chartData.filter((d) => d.cappedReturn >= cap).length },
                          ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                            <XAxis dataKey="name" tick={{ fill: "#7a95b8", fontSize: 10 }} tickLine={false} />
                            <YAxis tick={{ fill: "#7a95b8", fontSize: 10 }} tickLine={false} />
                            <Tooltip cursor={{ fill: '#12233e', opacity: 0.4 }} contentStyle={{ backgroundColor: '#0b1628', borderColor: '#12233e', color: '#fff' }} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Bar dataKey="sp" name="S&P 500 Years" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                            <Bar dataKey="iul" name="IUL Years" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                  
                  <TopBottomYearsTable data={chartData} />
                </div>
              )}

              {/* Scatter / Risk vs Reward */}
              {activeTab === "scatter" && (
                <div className="space-y-6">
                  <p className="text-xs text-[#7a95b8] max-w-3xl">
                    Risk vs. Reward profile. The scatter plot shows how IUL alters the return profile — truncating both the extreme downside (risk) and extreme upside, resulting in a more predictable, lower-volatility growth path.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="rounded-xl border border-[#12233e] bg-[#060f20] p-4 flex flex-col h-[300px]">
                      <h4 className="text-white font-medium text-sm mb-2 text-center">S&P 500 vs IUL Credited Returns</h4>
                      <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: -10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                            <XAxis type="number" dataKey="rawReturn" name="S&P 500" unit="%" tick={{ fill: "#7a95b8", fontSize: 10 }} tickLine={false} domain={['auto', 'auto']} />
                            <YAxis type="number" dataKey="cappedReturn" name="IUL Credited" unit="%" tick={{ fill: "#7a95b8", fontSize: 10 }} tickLine={false} domain={[floor - 2, cap + 2]} />
                            <ZAxis type="number" range={[40, 40]} />
                            <Tooltip content={<CustomScatterTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#334155' }} />
                            <ReferenceLine y={cap} stroke="#22c55e" strokeDasharray="3 3" />
                            <ReferenceLine y={floor} stroke="#f59e0b" strokeDasharray="3 3" />
                            <ReferenceLine x={0} stroke="#334155" />
                            <ReferenceLine y={0} stroke="#334155" />
                            <Scatter name="Years" data={scatterData} fill="#3b82f6">
                              {scatterData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.isFloored ? '#f59e0b' : entry.isCapped ? '#22c55e' : '#3b82f6'} />
                              ))}
                            </Scatter>
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex justify-center gap-4 mt-2 text-[10px]">
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div> Floored Years</div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#3b82f6]"></div> Correlated Years</div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#22c55e]"></div> Capped Years</div>
                      </div>
                    </div>
                    
                    <div className="rounded-xl border border-[#12233e] bg-[#060f20] p-4 flex flex-col h-[300px]">
                      <h4 className="text-white font-medium text-sm mb-2 text-center">Risk/Return Profile Comparison</h4>
                      <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                            <PolarGrid stroke="#12233e" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#7a95b8', fontSize: 10 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                            <Radar name="S&P 500" dataKey="sp" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                            <Radar name="IUL" dataKey="iul" stroke="#22c55e" fill="#22c55e" fillOpacity={0.5} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Tooltip contentStyle={{ backgroundColor: '#0b1628', borderColor: '#12233e', color: '#fff', fontSize: '12px' }} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Key Historical Periods ───────────────────────────────── */}
          <div className="rc-card">
            <h2 className="text-white font-bold text-base mb-4 flex items-center gap-2">
              <BookOpen size={16} className="text-blue-400" /> Key Historical Periods — IUL Floor Protection in Action
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  title: "The Great Depression",
                  years: "1929–1932",
                  spReturn: "-64.9% cumulative",
                  iulReturn: `${floor}% credited each year`,
                  description: `The worst market crash in U.S. history. S&P 500 lost nearly two-thirds of its value. An IUL policyholder would have been credited ${floor}% each year — preserving 100% of their cash value.`,
                  color: "red",
                  icon: AlertTriangle
                },
                {
                  title: "The Dot-Com Bust",
                  years: "2000–2002",
                  spReturn: "-37.6% cumulative",
                  iulReturn: `${floor}% credited each year`,
                  description: `Three consecutive years of losses as the tech bubble burst. IUL policyholders were credited ${floor}% all three years, then captured the 2003 recovery up to the cap.`,
                  color: "amber",
                  icon: AlertTriangle
                },
                {
                  title: "Global Financial Crisis",
                  years: "2008",
                  spReturn: "-36.55%",
                  iulReturn: `${floor}% credited`,
                  description: `The worst single-year decline since 1931. While 401(k) holders watched their balances collapse, IUL policyholders were credited ${floor}% — then captured the 2009 recovery.`,
                  color: "red",
                  icon: AlertTriangle
                },
                {
                  title: "Post-War Boom",
                  years: "1950–1959",
                  spReturn: "+19.3% avg/yr",
                  iulReturn: `~${cap}% avg credited`,
                  description: `A decade of exceptional growth. IUL policyholders would have been credited the cap rate in most years, building substantial tax-advantaged cash value.`,
                  color: "green",
                  icon: Zap
                },
                {
                  title: "The Bull Run",
                  years: "1995–1999",
                  spReturn: "+28.4% avg/yr",
                  iulReturn: `~${cap}% avg credited`,
                  description: `Five consecutive years of 20%+ returns. While IUL credits were capped, the consistent ${cap}% compounding with zero downside risk created powerful long-term accumulation.`,
                  color: "green",
                  icon: Zap
                },
                {
                  title: "COVID Recovery",
                  years: "2020–2024",
                  spReturn: "+23.5% avg/yr",
                  iulReturn: `~${cap}% avg credited`,
                  description: `Despite the brief COVID crash, the subsequent recovery and bull market delivered strong capped credits to IUL policyholders year after year.`,
                  color: "green",
                  icon: Zap
                },
              ].map((period) => (
                <div key={period.title} className={`rounded-xl bg-[#060f20] border p-4 hover:-translate-y-1 transition-transform duration-300 ${
                  period.color === "red" ? "border-red-500/20 hover:border-red-500/40" : period.color === "amber" ? "border-amber-500/20 hover:border-amber-500/40" : "border-[#22c55e]/20 hover:border-[#22c55e]/40"
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white font-bold text-sm flex items-center gap-1.5">
                      <period.icon size={14} className={period.color === "red" ? "text-red-400" : period.color === "amber" ? "text-amber-400" : "text-[#22c55e]"} />
                      {period.title}
                    </span>
                    <span className="text-[10px] text-[#7a95b8] bg-[#12233e] px-2 py-0.5 rounded-full border border-[#12233e]">{period.years}</span>
                  </div>
                  <div className="flex gap-3 mb-3 bg-[#0b1628] p-2 rounded-lg border border-[#12233e]">
                    <div className="flex-1">
                      <div className="text-[10px] text-[#7a95b8] mb-0.5">S&P 500</div>
                      <div className={`text-xs font-mono font-bold ${period.color === "green" ? "text-[#22c55e]" : "text-red-400"}`}>
                        {period.spReturn}
                      </div>
                    </div>
                    <div className="w-px bg-[#12233e]"></div>
                    <div className="flex-1">
                      <div className="text-[10px] text-[#7a95b8] mb-0.5">IUL Credit</div>
                      <div className="text-xs font-mono font-bold text-amber-400">{period.iulReturn}</div>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#7a95b8] leading-relaxed">{period.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Disclaimer ───────────────────────────────────────────── */}
          <div className="rc-card bg-[#060f20] border-[#12233e]">
            <div className="flex items-start gap-3">
              <Info size={16} className="text-[#7a95b8] mt-0.5 shrink-0" />
              <div className="text-[10px] text-[#7a95b8] leading-relaxed space-y-3">
                <p>
                  <span className="text-white font-semibold">Data Sources:</span> S&P 500 total return data (including dividends) sourced from
                  the Ibbotson SBBI (Stocks, Bonds, Bills, and Inflation) dataset, originally compiled by Roger G. Ibbotson and Rex A. Sinquefield,
                  and maintained by Morningstar/CRSP. Additional data from NYU Stern School of Business (Aswath Damodaran).
                </p>
                <p>
                  <span className="text-white font-semibold">Important Disclosure:</span> This page is for educational and illustrative purposes only.
                  The historical returns shown represent past performance of the S&P 500 index and do not guarantee future results. Actual IUL policy
                  crediting rates depend on the specific carrier, product design, cap rates, participation rates, and spreads in effect at the time
                  of crediting. Cap rates are subject to change and may be higher or lower than the {cap}% used in this illustration. IUL policies involve
                  fees, charges, and cost of insurance that are not reflected in this simplified illustration. Consult with a licensed insurance
                  professional for specific product details and illustrations.
                </p>
                <p>
                  <span className="text-white font-semibold">Regulatory Note:</span> IUL illustrations are subject to NAIC Actuarial Guideline 49-A (AG 49-A)
                  and AG 49-B regulations, which govern the maximum illustrated rates that may be shown in policy illustrations. The interactive
                  simulator above is an educational tool and is not a policy illustration as defined by state insurance regulations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <PageInsights pageId="ibbotson-charts" />
    
        <ComplianceFooter pageName="IbbotsonCharts" showsIUL showsTax showsEstate showsProjections showsHistoricalData />
      </AppShell>
  );
}

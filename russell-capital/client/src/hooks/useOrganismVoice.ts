/**
 * THE VOICE — Section H: Visual Design, Charts & Reporting (S226-S250)
 *
 * S226: Chart color palette system       S239: Comparison table generator
 * S227: Chart data transformer           S240: Timeline visualization data
 * S228: Responsive chart sizing          S241: Sankey flow data
 * S229: Chart animation config           S242: Heatmap data generator
 * S230: Chart export utilities           S243: Gauge/meter data
 * S231: PDF report data assembler        S244: Sparkline data
 * S232: Report section builder           S245: Waterfall chart data
 * S233: Executive summary generator      S246: Radar chart data
 * S234: Client presentation builder      S247: Funnel chart data
 * S235: Compliance disclosure generator  S248: Treemap data
 * S236: Chart annotation system          S249: Bubble chart data
 * S237: Dynamic legend builder           S250: Universal chart config
 * S238: Tooltip content formatter
 */

import { useCallback, useMemo } from "react";

// ═══════════════════════════════════════════════════════════════
// S226-S230: CHART SYSTEM
// ═══════════════════════════════════════════════════════════════

/** S226: Chart color palette system — consistent, accessible colors */
export const CHART_PALETTES = {
  primary: ["#D4AF37", "#C9A032", "#BF942D", "#B48928", "#A97E23", "#9E7320", "#93681D"],
  growth: ["#22C55E", "#16A34A", "#15803D", "#166534", "#14532D"],
  risk: ["#EF4444", "#DC2626", "#B91C1C", "#991B1B", "#7F1D1D"],
  income: ["#3B82F6", "#2563EB", "#1D4ED8", "#1E40AF", "#1E3A8A"],
  tax: ["#F97316", "#EA580C", "#C2410C", "#9A3412", "#7C2D12"],
  estate: ["#8B5CF6", "#7C3AED", "#6D28D9", "#5B21B6", "#4C1D95"],
  insurance: ["#06B6D4", "#0891B2", "#0E7490", "#155E75", "#164E63"],
  neutral: ["#94A3B8", "#64748B", "#475569", "#334155", "#1E293B"],
  categorical: ["#D4AF37", "#3B82F6", "#22C55E", "#EF4444", "#8B5CF6", "#F97316", "#06B6D4", "#EC4899", "#14B8A6", "#F59E0B"],
  diverging: ["#EF4444", "#F97316", "#FBBF24", "#A3E635", "#22C55E"],
  sequential: ["#1E293B", "#334155", "#475569", "#64748B", "#94A3B8", "#CBD5E1", "#E2E8F0", "#F1F5F9"],
};

export function getChartColor(palette: keyof typeof CHART_PALETTES, index: number): string {
  const colors = CHART_PALETTES[palette];
  return colors[index % colors.length];
}

export function getGradientPair(palette: keyof typeof CHART_PALETTES): [string, string] {
  const colors = CHART_PALETTES[palette];
  return [colors[0], colors[colors.length - 1]];
}

/** S227: Chart data transformer — convert raw calc results to chart-ready data */
export function transformToLineChart(
  data: Array<{ year: number; value: number }>,
  label: string,
  palette: keyof typeof CHART_PALETTES = "primary"
): { labels: string[]; datasets: Array<{ label: string; data: number[]; borderColor: string; backgroundColor: string; fill: boolean }> } {
  return {
    labels: data.map(d => `Year ${d.year}`),
    datasets: [{
      label,
      data: data.map(d => d.value),
      borderColor: CHART_PALETTES[palette][0],
      backgroundColor: `${CHART_PALETTES[palette][0]}33`,
      fill: true,
    }],
  };
}

export function transformToBarChart(
  categories: string[],
  values: number[],
  label: string,
  palette: keyof typeof CHART_PALETTES = "categorical"
): { labels: string[]; datasets: Array<{ label: string; data: number[]; backgroundColor: string[] }> } {
  return {
    labels: categories,
    datasets: [{
      label,
      data: values,
      backgroundColor: categories.map((_, i) => getChartColor(palette, i)),
    }],
  };
}

export function transformToPieChart(
  labels: string[],
  values: number[],
  palette: keyof typeof CHART_PALETTES = "categorical"
): { labels: string[]; datasets: Array<{ data: number[]; backgroundColor: string[] }> } {
  return {
    labels,
    datasets: [{
      data: values,
      backgroundColor: labels.map((_, i) => getChartColor(palette, i)),
    }],
  };
}

/** S228: Responsive chart sizing */
export function useChartSize(containerWidth: number): { width: number; height: number; fontSize: number } {
  return useMemo(() => {
    if (containerWidth < 400) return { width: containerWidth, height: 200, fontSize: 10 };
    if (containerWidth < 768) return { width: containerWidth, height: 300, fontSize: 11 };
    if (containerWidth < 1024) return { width: containerWidth, height: 350, fontSize: 12 };
    return { width: containerWidth, height: 400, fontSize: 13 };
  }, [containerWidth]);
}

/** S229: Chart animation config */
export const CHART_ANIMATIONS = {
  none: { animation: false as const },
  fast: { animation: { duration: 300 } },
  normal: { animation: { duration: 750 } },
  dramatic: { animation: { duration: 1500, easing: "easeOutQuart" as const } },
};

/** S230: Chart export utilities */
export function exportChartAsCSV(labels: string[], datasets: Array<{ label: string; data: number[] }>): string {
  const header = ["Label", ...datasets.map(d => d.label)].join(",");
  const rows = labels.map((label, i) => [label, ...datasets.map(d => d.data[i])].join(","));
  return [header, ...rows].join("\n");
}

// ═══════════════════════════════════════════════════════════════
// S231-S235: REPORT GENERATION
// ═══════════════════════════════════════════════════════════════

/** S231: PDF report data assembler */
export interface ReportSection {
  title: string;
  type: "text" | "table" | "chart" | "summary" | "disclaimer";
  content: any;
  pageBreakBefore?: boolean;
}

export function assembleReportData(
  clientName: string,
  calcResults: Record<string, any>,
  sections: ReportSection[]
): {
  metadata: { clientName: string; generatedAt: string; pageCount: number; advisor: string };
  sections: ReportSection[];
} {
  return {
    metadata: {
      clientName,
      generatedAt: new Date().toISOString(),
      pageCount: sections.length,
      advisor: "Russell Capital Solutions",
    },
    sections: [
      { title: "Cover Page", type: "text", content: { clientName, date: new Date().toLocaleDateString(), title: "Comprehensive Financial Analysis" } },
      ...sections,
      { title: "Disclaimers", type: "disclaimer", content: getComplianceDisclosures("report"), pageBreakBefore: true },
    ],
  };
}

/** S233: Executive summary generator */
export function generateExecutiveSummary(calcResults: Record<string, any>, clientData: Record<string, any>): {
  headline: string;
  keyFindings: string[];
  recommendations: string[];
  nextSteps: string[];
} {
  const findings: string[] = [];
  const recommendations: string[] = [];
  const nextSteps: string[] = [];
  const clientName = clientData?.clientName || "Client";
  const income = clientData?.annualIncome || 0;
  const age = clientData?.age || 0;

  // Analyze tax results
  if (calcResults["marginal-tax-rate"]) {
    const taxResult = calcResults["marginal-tax-rate"];
    const effectiveRate = taxResult?.summary?.effectiveRate;
    if (effectiveRate) {
      findings.push(`Current effective tax rate: ${(effectiveRate * 100).toFixed(1)}%`);
      if (effectiveRate > 0.25) {
        recommendations.push("Explore tax optimization strategies — effective rate exceeds 25%");
        nextSteps.push("Run Roth Conversion Ladder analysis");
      }
    }
  }

  // Analyze retirement gap
  if (calcResults["retirement-income-gap"]) {
    const gap = calcResults["retirement-income-gap"]?.summary?.monthlyGap;
    if (gap && gap > 0) {
      findings.push(`Monthly retirement income gap: $${gap.toLocaleString()}`);
      recommendations.push("Address retirement income shortfall with guaranteed income products");
      nextSteps.push("Run IUL Projection and Annuity Income Planner");
    }
  }

  // Analyze insurance
  if (calcResults["life-insurance-needs"]) {
    const needed = calcResults["life-insurance-needs"]?.summary?.totalNeeded;
    const current = calcResults["life-insurance-needs"]?.summary?.currentCoverage;
    if (needed && current && needed > current) {
      findings.push(`Life insurance gap: $${(needed - current).toLocaleString()}`);
      recommendations.push("Increase life insurance coverage to protect family");
    }
  }

  // Default findings if none
  if (findings.length === 0) {
    findings.push(`Analysis initiated for ${clientName}`);
    if (income > 0) findings.push(`Annual income: $${income.toLocaleString()}`);
    if (age > 0) findings.push(`Current age: ${age}`);
  }

  if (recommendations.length === 0) {
    recommendations.push("Complete additional calculators for comprehensive analysis");
  }

  if (nextSteps.length === 0) {
    nextSteps.push("Complete Client Fact Finder for personalized recommendations");
    nextSteps.push("Run Tax Bracket Analysis to identify optimization opportunities");
  }

  return {
    headline: `Financial Analysis Summary for ${clientName}`,
    keyFindings: findings,
    recommendations,
    nextSteps,
  };
}

/** S234: Client presentation builder */
export function buildPresentationSlides(
  clientData: Record<string, any>,
  calcResults: Record<string, any>
): Array<{ slideNumber: number; title: string; content: Record<string, any>; type: string }> {
  const slides: Array<{ slideNumber: number; title: string; content: Record<string, any>; type: string }> = [];
  let slideNum = 1;

  // Title slide
  slides.push({
    slideNumber: slideNum++,
    title: "Your Financial Blueprint",
    content: { clientName: clientData?.clientName || "Valued Client", date: new Date().toLocaleDateString(), advisor: "Russell Capital Solutions" },
    type: "title",
  });

  // Current snapshot
  slides.push({
    slideNumber: slideNum++,
    title: "Current Financial Snapshot",
    content: {
      income: clientData?.annualIncome || 0,
      netWorth: clientData?.netWorth || 0,
      age: clientData?.age || 0,
      retirementAge: clientData?.retirementAge || 65,
    },
    type: "snapshot",
  });

  // Add slides for each completed calculator
  const completedCalcs = Object.keys(calcResults);
  for (const calc of completedCalcs.slice(0, 8)) {
    const result = calcResults[calc];
    if (result?.summary) {
      slides.push({
        slideNumber: slideNum++,
        title: calc.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        content: result.summary,
        type: "analysis",
      });
    }
  }

  // Recommendations slide
  const summary = generateExecutiveSummary(calcResults, clientData);
  slides.push({
    slideNumber: slideNum++,
    title: "Key Recommendations",
    content: { recommendations: summary.recommendations, nextSteps: summary.nextSteps },
    type: "recommendations",
  });

  // Next steps
  slides.push({
    slideNumber: slideNum++,
    title: "Next Steps",
    content: { steps: summary.nextSteps },
    type: "next-steps",
  });

  return slides;
}

/** S235: Compliance disclosure generator */
export function getComplianceDisclosures(context: "report" | "presentation" | "email" | "calculator"): string[] {
  const base = [
    "This analysis is for educational and illustrative purposes only and does not constitute financial, tax, legal, or investment advice.",
    "Past performance does not guarantee future results. All projections are hypothetical and may not reflect actual outcomes.",
    "Consult with a qualified financial professional before making any financial decisions.",
  ];

  const contextSpecific: Record<string, string[]> = {
    report: [
      "This report was generated using Russell Capital Solutions proprietary analysis tools.",
      "All calculations are based on the information provided and assumptions stated within.",
      "Tax laws and regulations are subject to change. Consult a tax professional for current guidance.",
    ],
    presentation: [
      "This presentation is confidential and intended solely for the named recipient.",
      "Projections assume consistent contributions and market conditions as stated.",
    ],
    email: [
      "This communication is intended for the named recipient only.",
      "Do not forward without permission from your financial advisor.",
    ],
    calculator: [
      "Calculator results are estimates based on the inputs provided.",
      "Actual results may vary based on market conditions, tax law changes, and individual circumstances.",
    ],
  };

  return [...base, ...(contextSpecific[context] || [])];
}

// ═══════════════════════════════════════════════════════════════
// S236-S250: ADVANCED CHART DATA GENERATORS
// ═══════════════════════════════════════════════════════════════

/** S236: Chart annotation system */
export interface ChartAnnotation {
  type: "line" | "point" | "box";
  label: string;
  position: { x: number | string; y: number };
  color: string;
}

export function generateMilestoneAnnotations(
  data: Array<{ year: number; value: number }>,
  milestones: Array<{ year: number; label: string }>
): ChartAnnotation[] {
  return milestones.map(m => {
    const dataPoint = data.find(d => d.year === m.year);
    return {
      type: "point" as const,
      label: m.label,
      position: { x: `Year ${m.year}`, y: dataPoint?.value || 0 },
      color: CHART_PALETTES.primary[0],
    };
  });
}

/** S238: Tooltip content formatter */
export function formatTooltip(value: number, type: "currency" | "percentage" | "number" | "years"): string {
  switch (type) {
    case "currency": return `$${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    case "percentage": return `${(value * 100).toFixed(1)}%`;
    case "years": return `${value.toFixed(1)} years`;
    default: return value.toLocaleString();
  }
}

/** S239: Comparison table generator */
export function generateComparisonTable(
  strategies: Array<{ name: string; metrics: Record<string, number> }>
): { headers: string[]; rows: Array<{ strategy: string; values: Array<{ value: number; isBest: boolean }> }> } {
  if (strategies.length === 0) return { headers: [], rows: [] };
  const metricKeys = Object.keys(strategies[0].metrics);
  const headers = ["Strategy", ...metricKeys.map(k => k.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase()))];

  const rows = strategies.map(s => ({
    strategy: s.name,
    values: metricKeys.map(k => {
      const value = s.metrics[k];
      const allValues = strategies.map(st => st.metrics[k]);
      const isBest = value === Math.max(...allValues);
      return { value, isBest };
    }),
  }));

  return { headers, rows };
}

/** S240: Timeline visualization data */
export function generateTimelineData(
  events: Array<{ year: number; label: string; type: "milestone" | "action" | "risk"; value?: number }>
): Array<{ year: number; label: string; type: string; value: number; color: string }> {
  const colorMap: Record<string, string> = {
    milestone: CHART_PALETTES.growth[0],
    action: CHART_PALETTES.primary[0],
    risk: CHART_PALETTES.risk[0],
  };
  return events.map(e => ({
    year: e.year,
    label: e.label,
    type: e.type,
    value: e.value || 0,
    color: colorMap[e.type] || CHART_PALETTES.neutral[0],
  }));
}

/** S243: Gauge/meter data */
export function generateGaugeData(
  value: number,
  min: number,
  max: number,
  thresholds: Array<{ value: number; color: string; label: string }>
): { value: number; percentage: number; color: string; label: string } {
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  let color = CHART_PALETTES.neutral[0];
  let label = "";
  for (const t of thresholds.sort((a, b) => a.value - b.value)) {
    if (value >= t.value) { color = t.color; label = t.label; }
  }
  return { value, percentage, color, label };
}

/** S244: Sparkline data */
export function generateSparklineData(values: number[]): {
  data: number[];
  min: number;
  max: number;
  trend: "up" | "down" | "flat";
  changePercent: number;
} {
  if (values.length === 0) return { data: [], min: 0, max: 0, trend: "flat", changePercent: 0 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const first = values[0];
  const last = values[values.length - 1];
  const changePercent = first !== 0 ? ((last - first) / first) * 100 : 0;
  const trend = changePercent > 1 ? "up" : changePercent < -1 ? "down" : "flat";
  return { data: values, min, max, trend, changePercent };
}

/** S245: Waterfall chart data */
export function generateWaterfallData(
  items: Array<{ label: string; value: number; type: "add" | "subtract" | "total" }>
): Array<{ label: string; value: number; start: number; end: number; color: string; type: string }> {
  let running = 0;
  return items.map(item => {
    if (item.type === "total") {
      const result = { label: item.label, value: running, start: 0, end: running, color: CHART_PALETTES.primary[0], type: "total" };
      return result;
    }
    const start = running;
    running += item.type === "add" ? item.value : -item.value;
    return {
      label: item.label,
      value: item.value,
      start,
      end: running,
      color: item.type === "add" ? CHART_PALETTES.growth[0] : CHART_PALETTES.risk[0],
      type: item.type,
    };
  });
}

/** S246: Radar chart data */
export function generateRadarData(
  dimensions: string[],
  profiles: Array<{ name: string; values: number[]; color?: string }>
): { labels: string[]; datasets: Array<{ label: string; data: number[]; borderColor: string; backgroundColor: string }> } {
  return {
    labels: dimensions,
    datasets: profiles.map((p, i) => ({
      label: p.name,
      data: p.values,
      borderColor: p.color || getChartColor("categorical", i),
      backgroundColor: `${p.color || getChartColor("categorical", i)}33`,
    })),
  };
}

/** S247: Funnel chart data */
export function generateFunnelData(
  stages: Array<{ label: string; value: number }>
): Array<{ label: string; value: number; percentage: number; color: string; dropoff: number }> {
  const maxValue = stages.length > 0 ? stages[0].value : 1;
  return stages.map((s, i) => ({
    label: s.label,
    value: s.value,
    percentage: (s.value / maxValue) * 100,
    color: getChartColor("categorical", i),
    dropoff: i > 0 ? ((stages[i - 1].value - s.value) / stages[i - 1].value) * 100 : 0,
  }));
}

/** S250: Universal chart configuration */
export function useUniversalChartConfig() {
  const getConfig = useCallback((type: "line" | "bar" | "pie" | "doughnut" | "radar", options?: {
    title?: string;
    currency?: boolean;
    percentage?: boolean;
    stacked?: boolean;
    legend?: boolean;
  }) => {
    const { title, currency = false, percentage = false, stacked = false, legend = true } = options || {};
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: title ? { display: true, text: title, font: { size: 14, weight: "bold" as const }, color: "#D4AF37" } : { display: false },
        legend: { display: legend, position: "bottom" as const, labels: { color: "#94A3B8", usePointStyle: true } },
        tooltip: {
          backgroundColor: "#1E293B",
          titleColor: "#D4AF37",
          bodyColor: "#E2E8F0",
          borderColor: "#334155",
          borderWidth: 1,
          callbacks: {
            label: (ctx: any) => {
              const val = ctx.parsed?.y ?? ctx.parsed;
              if (currency) return ` $${Number(val).toLocaleString()}`;
              if (percentage) return ` ${(Number(val) * 100).toFixed(1)}%`;
              return ` ${Number(val).toLocaleString()}`;
            },
          },
        },
      },
      scales: type === "pie" || type === "doughnut" || type === "radar" ? undefined : {
        x: { stacked, grid: { color: "#1E293B" }, ticks: { color: "#64748B" } },
        y: {
          stacked,
          grid: { color: "#1E293B" },
          ticks: {
            color: "#64748B",
            callback: (val: any) => {
              if (currency) return `$${Number(val).toLocaleString()}`;
              if (percentage) return `${(Number(val) * 100).toFixed(1)}%`;
              return val;
            },
          },
        },
      },
    };
  }, []);

  return { getConfig, palettes: CHART_PALETTES, getColor: getChartColor };
}

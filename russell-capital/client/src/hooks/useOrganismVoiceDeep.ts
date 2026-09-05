// @ts-nocheck

import { useMemo } from 'react';

// Define the FINANCIAL_COLORS constant
export const FINANCIAL_COLORS = {
  growth: '#10B981', // emerald
  decline: '#EF4444', // red
  neutral: '#6B7280', // gray
  primary: '#3B82F6', // blue
  secondary: '#8B5CF6', // purple
  warning: '#F59E0B', // amber
  iul: '#06B6D4', // cyan
  myga: '#14B8A6', // teal
  tax: '#F97316', // orange
  estate: '#EC4899', // pink
  retirement: '#84CC16', // lime
  insurance: '#A855F7', // violet
  palette: [
    '#10B981',
    '#EF4444',
    '#6B7280',
    '#3B82F6',
    '#8B5CF6',
    '#F59E0B',
    '#06B6D4',
    '#14B8A6',
    '#F97316',
    '#EC4899',
    '#84CC16',
    '#A855F7',
  ], // 12 distinct colors
};

// Chart Configuration Generator functions

export function generateLineChartConfig(data: any[], options: { dataKey?: string; lines?: string[] } = {}) {
  return {
    data,
    lines: options.lines || [],
    xAxis: { dataKey: options.dataKey || 'date' },
    yAxis: {},
    tooltip: true,
    legend: true,
  };
}

export function generateBarChartConfig(data: any[], options: { dataKey?: string; bars?: string[] } = {}) {
  return {
    data,
    bars: options.bars || [],
    xAxis: { dataKey: options.dataKey || 'category' },
    yAxis: {},
  };
}

export function generatePieChartConfig(data: any[], options: { nameKey?: string; valueKey?: string } = {}) {
  return {
    data,
    colors: FINANCIAL_COLORS.palette,
    labels: data.map((item) => item[options.nameKey || 'name']),
  };
}

export function generateAreaChartConfig(data: any[], options: { dataKey?: string; areas?: string[] } = {}) {
  return {
    data,
    areas: options.areas || [],
    gradient: true, // Simple flag for gradient; in practice, this would configure Recharts
  };
}

export function generateComposedChartConfig(data: any[], options: { lines?: string[]; bars?: string[]; areas?: string[] } = {}) {
  return {
    data,
    lines: options.lines || [],
    bars: options.bars || [],
    areas: options.areas || [],
  };
}

export function generateProjectionChart(years: number[], scenarios: any[]) {
  // Assume scenarios is an array of objects with year and value properties
  const data = years.map((year, index) => ({
    year,
    ...scenarios.map((scenario, sIndex) => ({ [`scenario${sIndex}`]: scenario.values[index] })),
  }));
  return generateLineChartConfig(data, { lines: scenarios.map((_, index) => `scenario${index}`), dataKey: 'year' });
}

export function generateComparisonChart(before: any[], after: any[]) {
  // Simple side-by-side config; merge data for composed chart
  const data = before.map((item, index) => ({ ...item, afterValue: after[index].value }));
  return generateComposedChartConfig(data, { bars: ['value'], lines: ['afterValue'] });
}

export function generateWaterfallChart(steps: any[]) {
  // Steps as array of { name: string, value: number }
  return generateBarChartConfig(steps, { bars: ['value'], dataKey: 'name' }); // Simplified for waterfall effect
}

// Executive Summary Generator functions

export function generateNetWorthSummary(netWorth: number, change: number): string {
  const changeStr = change > 0 ? `increased by $${change}` : `decreased by $${Math.abs(change)}`;
  return `The client's current net worth is $${netWorth}. This represents a ${changeStr} over the reporting period, indicating steady financial progress.`;
}

export function generateTaxSummary(taxData: { totalTax: number; deductions: number }): string {
  return `The client's total tax liability is $${taxData.totalTax}, with deductions amounting to $${taxData.deductions}. This results in an effective tax rate of ${(taxData.totalTax / (taxData.totalTax + taxData.deductions) * 100).toFixed(2)}%.`;
}

export function generateRetirementSummary(retirementData: { projectedAmount: number; yearsToRetirement: number }): string {
  return `Based on current projections, the client is on track to have $${retirementData.projectedAmount} in retirement funds in ${retirementData.yearsToRetirement} years, assuming consistent contributions.`;
}

export function generateInsuranceSummary(insuranceData: { coverage: number; premiums: number }): string {
  return `The client's insurance coverage totals $${insuranceData.coverage}, with annual premiums of $${insuranceData.premiums}. This provides adequate protection against potential risks.`;
}

export function generateEstateSummary(estateData: { estateValue: number; taxes: number }): string {
  return `The client's estate is valued at $${estateData.estateValue}, with estimated taxes of $${estateData.taxes}. Estate planning strategies are recommended to minimize future liabilities.`;
}

export function generateFullClientSummary(allData: any): string {
  return `Overall, the client's financial profile shows a net worth of $${allData.netWorth} with a ${allData.change > 0 ? 'positive' : 'negative'} change. Tax liabilities total $${allData.taxData.totalTax}, while retirement projections indicate $${allData.retirementData.projectedAmount} in ${allData.retirementData.yearsToRetirement} years. Insurance and estate planning are in place, but opportunities exist for optimization. In summary, the client is positioned well but should focus on tax-efficient strategies for long-term growth.`;
}

export function generateMeetingAgenda(clientData: any): string[] {
  return [
    'Review current net worth and financial changes.',
    `Discuss tax summary: Total liability $${clientData.taxData.totalTax}.`,
    `Retirement outlook: Projected $${clientData.retirementData.projectedAmount} in ${clientData.retirementData.yearsToRetirement} years.`,
    'Evaluate insurance coverage and premiums.',
    'Estate planning recommendations.',
    'Action items and next steps.',
  ];
}

// Sparkline Generator functions

export function generateSparklineData(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const trend = values[values.length - 1] - values[0]; // Simple trend calculation
  return { data: values, min, max, trend };
}

export function generateMiniBarData(values: number[]) {
  const max = Math.max(...values);
  return { data: values, max };
}

export function generateTrendIndicator(values: number[]) {
  if (values.length < 2) return { direction: 'flat', magnitude: 0, color: FINANCIAL_COLORS.neutral };
  const magnitude = Math.abs(values[values.length - 1] - values[0]);
  const direction = values[values.length - 1] > values[0] ? 'up' : values[values.length - 1] < values[0] ? 'down' : 'flat';
  const color = direction === 'up' ? FINANCIAL_COLORS.growth : direction === 'down' ? FINANCIAL_COLORS.decline : FINANCIAL_COLORS.neutral;
  return { direction, magnitude, color };
}

// Presentation Builder functions

export function buildSlideData(title: string, sections: any[]): any[] {  // SlideData[] simplified to any[]
  return sections.map((section, index) => ({
    title: `${title} - Section ${index + 1}`,
    content: section.content || [],
  }));
}

export function formatForExport(reportData: any): any {  // ExportData simplified to any
  return {
    title: reportData.title,
    sections: reportData.sections,
    summary: reportData.summary,
  };  // Basic structure for export
}

export function generateTableOfContents(sections: any[]): any[] {  // TOCEntry[] simplified to any[]
  return sections.map((section, index) => ({
    id: index,
    title: section.title,
    page: index + 1,
  }));
}

// Main hook
export function useVoiceDeep() {
  return useMemo(() => ({
    generateLineChartConfig,
    generateBarChartConfig,
    generatePieChartConfig,
    generateAreaChartConfig,
    generateComposedChartConfig,
    generateProjectionChart,
    generateComparisonChart,
    generateWaterfallChart,
    generateNetWorthSummary,
    generateTaxSummary,
    generateRetirementSummary,
    generateInsuranceSummary,
    generateEstateSummary,
    generateFullClientSummary,
    generateMeetingAgenda,
    FINANCIAL_COLORS,
    generateSparklineData,
    generateMiniBarData,
    generateTrendIndicator,
    buildSlideData,
    formatForExport,
    generateTableOfContents,
  }), []);
}

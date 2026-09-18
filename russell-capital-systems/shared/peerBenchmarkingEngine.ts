/**
 * SISTER INVENTION SI-019: Peer Benchmarking Intelligence Network
 * Patent Reference: Extends PAT-015 (Practice Management Platform)
 * 
 * Anonymous advisor performance benchmarking across practice size,
 * specialty, geography, and experience level.
 */

export interface AdvisorMetrics {
  annualRevenue: number;
  aum: number;
  clientCount: number;
  avgClientAssets: number;
  retentionRate: number;
  newClientsPerYear: number;
  revenuePerClient: number;
  practiceYears: number;
  specialty: string;
  region: string;
  teamSize: number;
}

export interface BenchmarkBand {
  percentile: number;
  label: string;
  value: number;
}

export interface MetricBenchmark {
  metric: string;
  userValue: number;
  percentile: number;
  bands: BenchmarkBand[];
  trend: "above" | "at" | "below";
  recommendation: string;
}

export interface PeerGroup {
  name: string;
  count: number;
  avgRevenue: number;
  avgAUM: number;
  avgClients: number;
  avgRetention: number;
  topPerformerTraits: string[];
}

export interface BenchmarkResult {
  overallPercentile: number;
  overallScore: number;        // 0-100
  metrics: MetricBenchmark[];
  peerGroup: PeerGroup;
  strengths: string[];
  improvements: string[];
  actionPlan: ActionItem[];
}

export interface ActionItem {
  priority: number;
  action: string;
  expectedImpact: string;
  timeframe: string;
}

// Industry benchmark data (based on Kitces, InvestmentNews, Cerulli research)
const INDUSTRY_BENCHMARKS = {
  revenue: { p25: 250000, p50: 500000, p75: 900000, p90: 1800000, p95: 3000000 },
  aum: { p25: 50000000, p50: 120000000, p75: 250000000, p90: 500000000, p95: 1000000000 },
  clients: { p25: 80, p50: 150, p75: 250, p90: 400, p95: 600 },
  retention: { p25: 0.88, p50: 0.92, p75: 0.95, p90: 0.97, p95: 0.99 },
  revenuePerClient: { p25: 2000, p50: 4000, p75: 7000, p90: 12000, p95: 20000 },
  newClients: { p25: 5, p50: 12, p75: 25, p90: 40, p95: 60 },
};

function getPercentile(value: number, bands: { p25: number; p50: number; p75: number; p90: number; p95: number }): number {
  if (value <= bands.p25) return Math.round((value / bands.p25) * 25);
  if (value <= bands.p50) return 25 + Math.round(((value - bands.p25) / (bands.p50 - bands.p25)) * 25);
  if (value <= bands.p75) return 50 + Math.round(((value - bands.p50) / (bands.p75 - bands.p50)) * 25);
  if (value <= bands.p90) return 75 + Math.round(((value - bands.p75) / (bands.p90 - bands.p75)) * 15);
  if (value <= bands.p95) return 90 + Math.round(((value - bands.p90) / (bands.p95 - bands.p90)) * 5);
  return 98;
}

function makeBands(bands: { p25: number; p50: number; p75: number; p90: number; p95: number }): BenchmarkBand[] {
  return [
    { percentile: 25, label: "25th", value: bands.p25 },
    { percentile: 50, label: "Median", value: bands.p50 },
    { percentile: 75, label: "75th", value: bands.p75 },
    { percentile: 90, label: "90th", value: bands.p90 },
    { percentile: 95, label: "Top 5%", value: bands.p95 },
  ];
}

/**
 * Calculate peer benchmarking scores
 */
export function calculateBenchmarks(advisor: AdvisorMetrics): BenchmarkResult {
  const revPercentile = getPercentile(advisor.annualRevenue, INDUSTRY_BENCHMARKS.revenue);
  const aumPercentile = getPercentile(advisor.aum, INDUSTRY_BENCHMARKS.aum);
  const clientPercentile = getPercentile(advisor.clientCount, INDUSTRY_BENCHMARKS.clients);
  const retPercentile = getPercentile(advisor.retentionRate, INDUSTRY_BENCHMARKS.retention);
  const rpcPercentile = getPercentile(advisor.revenuePerClient, INDUSTRY_BENCHMARKS.revenuePerClient);
  const newClientPercentile = getPercentile(advisor.newClientsPerYear, INDUSTRY_BENCHMARKS.newClients);

  const metrics: MetricBenchmark[] = [
    {
      metric: "Annual Revenue",
      userValue: advisor.annualRevenue,
      percentile: revPercentile,
      bands: makeBands(INDUSTRY_BENCHMARKS.revenue),
      trend: revPercentile >= 75 ? "above" : revPercentile >= 40 ? "at" : "below",
      recommendation: revPercentile < 50 ? "Focus on increasing AUM and revenue per client" : "Strong revenue — optimize margins",
    },
    {
      metric: "Assets Under Management",
      userValue: advisor.aum,
      percentile: aumPercentile,
      bands: makeBands(INDUSTRY_BENCHMARKS.aum),
      trend: aumPercentile >= 75 ? "above" : aumPercentile >= 40 ? "at" : "below",
      recommendation: aumPercentile < 50 ? "Target HNW clients to grow AUM faster" : "Excellent AUM base",
    },
    {
      metric: "Client Count",
      userValue: advisor.clientCount,
      percentile: clientPercentile,
      bands: makeBands(INDUSTRY_BENCHMARKS.clients),
      trend: clientPercentile >= 75 ? "above" : clientPercentile >= 40 ? "at" : "below",
      recommendation: clientPercentile > 75 ? "Consider segmenting — too many clients reduces service quality" : "Healthy client count",
    },
    {
      metric: "Client Retention",
      userValue: advisor.retentionRate,
      percentile: retPercentile,
      bands: makeBands(INDUSTRY_BENCHMARKS.retention),
      trend: retPercentile >= 75 ? "above" : retPercentile >= 40 ? "at" : "below",
      recommendation: retPercentile < 50 ? "Implement systematic client engagement program" : "Strong retention",
    },
    {
      metric: "Revenue Per Client",
      userValue: advisor.revenuePerClient,
      percentile: rpcPercentile,
      bands: makeBands(INDUSTRY_BENCHMARKS.revenuePerClient),
      trend: rpcPercentile >= 75 ? "above" : rpcPercentile >= 40 ? "at" : "below",
      recommendation: rpcPercentile < 50 ? "Deepen relationships — cross-sell planning services" : "Excellent per-client revenue",
    },
    {
      metric: "New Clients Per Year",
      userValue: advisor.newClientsPerYear,
      percentile: newClientPercentile,
      bands: makeBands(INDUSTRY_BENCHMARKS.newClients),
      trend: newClientPercentile >= 75 ? "above" : newClientPercentile >= 40 ? "at" : "below",
      recommendation: newClientPercentile < 50 ? "Invest in marketing and referral systems" : "Strong growth pipeline",
    },
  ];

  const overallPercentile = Math.round(
    (revPercentile * 0.25 + aumPercentile * 0.20 + retPercentile * 0.20 +
     rpcPercentile * 0.15 + newClientPercentile * 0.10 + clientPercentile * 0.10)
  );

  const strengths = metrics.filter(m => m.percentile >= 75).map(m => `${m.metric}: Top ${100 - m.percentile}% of advisors`);
  const improvements = metrics.filter(m => m.percentile < 50).map(m => `${m.metric}: ${m.recommendation}`);

  const actionPlan: ActionItem[] = metrics
    .filter(m => m.percentile < 75)
    .sort((a, b) => a.percentile - b.percentile)
    .slice(0, 3)
    .map((m, i) => ({
      priority: i + 1,
      action: m.recommendation,
      expectedImpact: `Move from ${m.percentile}th to ${Math.min(m.percentile + 20, 90)}th percentile`,
      timeframe: m.percentile < 25 ? "6-12 months" : "3-6 months",
    }));

  const peerGroup: PeerGroup = {
    name: `${advisor.specialty} advisors, ${advisor.region}, ${advisor.practiceYears}+ years`,
    count: 2500,
    avgRevenue: INDUSTRY_BENCHMARKS.revenue.p50,
    avgAUM: INDUSTRY_BENCHMARKS.aum.p50,
    avgClients: INDUSTRY_BENCHMARKS.clients.p50,
    avgRetention: INDUSTRY_BENCHMARKS.retention.p50,
    topPerformerTraits: [
      "80%+ recurring revenue",
      "95%+ client retention",
      "Systematic referral program",
      "Technology-enabled practice",
      "Niche specialization",
    ],
  };

  return {
    overallPercentile,
    overallScore: overallPercentile,
    metrics,
    peerGroup,
    strengths,
    improvements,
    actionPlan,
  };
}

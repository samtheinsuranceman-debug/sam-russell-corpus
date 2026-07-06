// ============================================================
// Analytics — pure metric math (Stage 6: validation instrumentation)
// ============================================================
// These functions take plain event arrays and return the three numbers that
// decide the business — funnel conversion, CAC, and month-2 retention/churn —
// plus scoring-pipeline health. Pure and dependency-free so they are unit
// tested without a database.

export type FunnelEvent = {
  type: string;
  userId?: number | null;
  numericValue?: number | null; // e.g. latency ms for pipeline events
  ok?: boolean | null;          // success flag for pipeline events
  createdAt: number;            // epoch ms
};

// Canonical funnel stages, in order.
export const FUNNEL_STAGES = [
  "landing_view",
  "assessment_start",
  "assessment_complete",
  "checkout_start",
  "subscription_created",
] as const;
export type FunnelStage = (typeof FUNNEL_STAGES)[number];

export type FunnelMetrics = {
  counts: Record<FunnelStage, number>;
  conversion: {
    startToComplete: number | null;  // assessment completion rate
    completeToPaid: number | null;   // the core assessment→paid number
    landingToPaid: number | null;    // top-of-funnel → paid
  };
};

export function funnelMetrics(events: FunnelEvent[]): FunnelMetrics {
  const counts = Object.fromEntries(FUNNEL_STAGES.map((s) => [s, 0])) as Record<FunnelStage, number>;
  for (const e of events) {
    if ((FUNNEL_STAGES as readonly string[]).includes(e.type)) counts[e.type as FunnelStage]++;
  }
  const ratio = (num: number, den: number): number | null => (den > 0 ? num / den : null);
  return {
    counts,
    conversion: {
      startToComplete: ratio(counts.assessment_complete, counts.assessment_start),
      completeToPaid: ratio(counts.subscription_created, counts.assessment_complete),
      landingToPaid: ratio(counts.subscription_created, counts.landing_view),
    },
  };
}

// Nearest-rank percentile on an unsorted numeric array (q in [0,1]).
export function percentile(values: number[], q: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil(q * sorted.length);
  const idx = Math.min(sorted.length - 1, Math.max(0, rank - 1));
  return sorted[idx];
}

export type PipelineHealth = {
  count: number;
  errorRate: number | null; // fraction of runs with ok === false
  p50Ms: number | null;
  p95Ms: number | null;
};

// Health for one pipeline event type (e.g. "score_llm", "score_stt").
export function pipelineHealth(events: FunnelEvent[], type: string): PipelineHealth {
  const runs = events.filter((e) => e.type === type);
  if (runs.length === 0) return { count: 0, errorRate: null, p50Ms: null, p95Ms: null };
  const errors = runs.filter((e) => e.ok === false).length;
  const latencies = runs.map((e) => e.numericValue ?? 0).filter((n) => n > 0);
  return {
    count: runs.length,
    errorRate: errors / runs.length,
    p50Ms: percentile(latencies, 0.5),
    p95Ms: percentile(latencies, 0.95),
  };
}

// Cost to acquire one paying customer, in cents (null if no new subscribers).
export function cac(spendCents: number, newSubscribers: number): number | null {
  return newSubscribers > 0 ? spendCents / newSubscribers : null;
}

export type RetentionInput = {
  created: Array<{ userId: number; at: number }>;
  canceled: Array<{ userId: number; at: number }>;
  now: number;
  windowDays?: number; // default 60 (month-2)
};

export type Retention = {
  eligible: number;   // subscribers old enough to have reached the window
  retained: number;
  churned: number;
  retainedRate: number | null;
  churnRate: number | null;
  windowDays: number;
};

// Month-2 retention: of subscribers created at least `windowDays` ago, the
// fraction that did NOT cancel within `windowDays` of signing up.
export function retention(input: RetentionInput): Retention {
  const windowDays = input.windowDays ?? 60;
  const windowMs = windowDays * 24 * 60 * 60 * 1000;
  const firstCancel = new Map<number, number>();
  for (const c of input.canceled) {
    const prev = firstCancel.get(c.userId);
    if (prev === undefined || c.at < prev) firstCancel.set(c.userId, c.at);
  }
  const eligible = input.created.filter((c) => c.at <= input.now - windowMs);
  let churned = 0;
  for (const c of eligible) {
    const cancelAt = firstCancel.get(c.userId);
    if (cancelAt !== undefined && cancelAt <= c.at + windowMs) churned++;
  }
  const retained = eligible.length - churned;
  return {
    eligible: eligible.length,
    retained,
    churned,
    retainedRate: eligible.length > 0 ? retained / eligible.length : null,
    churnRate: eligible.length > 0 ? churned / eligible.length : null,
    windowDays,
  };
}

// ---- Go / no-go thresholds ----------------------------------
// Documented targets the business must clear before scaling paid marketing.
// Tune as you learn; keeping them explicit and visible is the point.
export const GO_THRESHOLDS = {
  completeToPaid: 0.05,   // ≥ 5% of completed assessments convert to paid
  cacCents: 15000,        // ≤ $150 to acquire a customer
  month2ChurnRate: 0.30,  // ≤ 30% churn by month 2
};

export type GoNoGoRow = {
  metric: string;
  value: number | null;
  threshold: number;
  direction: "gte" | "lte";
  pass: boolean | null; // null when there isn't enough data yet
};

export function goNoGo(args: {
  completeToPaid: number | null;
  cacCents: number | null;
  month2ChurnRate: number | null;
}): GoNoGoRow[] {
  const gte = (v: number | null, t: number): boolean | null => (v === null ? null : v >= t);
  const lte = (v: number | null, t: number): boolean | null => (v === null ? null : v <= t);
  return [
    { metric: "assessment→paid conversion", value: args.completeToPaid, threshold: GO_THRESHOLDS.completeToPaid, direction: "gte", pass: gte(args.completeToPaid, GO_THRESHOLDS.completeToPaid) },
    { metric: "CAC (cents)", value: args.cacCents, threshold: GO_THRESHOLDS.cacCents, direction: "lte", pass: lte(args.cacCents, GO_THRESHOLDS.cacCents) },
    { metric: "month-2 churn", value: args.month2ChurnRate, threshold: GO_THRESHOLDS.month2ChurnRate, direction: "lte", pass: lte(args.month2ChurnRate, GO_THRESHOLDS.month2ChurnRate) },
  ];
}

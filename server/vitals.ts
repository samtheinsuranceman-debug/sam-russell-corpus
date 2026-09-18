// ============================================================
// CORE WEB VITALS — the browser posts what real visitors experienced
// (LCP, CLS, INP, FCP, TTFB) with navigator.sendBeacon; the server keeps
// them and summarises the 75th percentile per route, which is exactly how
// Google grades a page. No third party, no cookie, nothing personal.
// ============================================================
import type { Express, Request, Response } from "express";
import { and, desc, gte, sql } from "drizzle-orm";
import { webVitals } from "../drizzle/schema";
import { getDb } from "./db";

export const METRICS = ["LCP", "CLS", "INP", "FCP", "TTFB"] as const;
export type Metric = (typeof METRICS)[number];

/** Google's published thresholds: good ≤ first, poor > second. */
export const THRESHOLDS: Record<Metric, [number, number]> = {
  LCP: [2500, 4000],
  CLS: [0.1, 0.25],
  INP: [200, 500],
  FCP: [1800, 3000],
  TTFB: [800, 1800],
};

export type Rating = "good" | "needs-improvement" | "poor";
export function rate(metric: Metric, value: number): Rating {
  const [good, poor] = THRESHOLDS[metric];
  return value <= good ? "good" : value <= poor ? "needs-improvement" : "poor";
}

export type VitalSample = { route: string; metric: Metric; value: number; device: "mobile" | "desktop"; navType?: string };

/** Validates one beacon payload; anything odd is dropped silently (a beacon has no reader). */
export function parseSamples(body: unknown): VitalSample[] {
  const raw = typeof body === "string" ? safeJson(body) : body;
  const list = Array.isArray(raw) ? raw : Array.isArray((raw as { samples?: unknown[] })?.samples) ? (raw as { samples: unknown[] }).samples : [];
  const out: VitalSample[] = [];
  for (const s of list.slice(0, 20)) {
    if (!s || typeof s !== "object") continue;
    const o = s as Record<string, unknown>;
    const metric = String(o.metric ?? "").toUpperCase();
    const value = Number(o.value);
    if (!(METRICS as readonly string[]).includes(metric) || !Number.isFinite(value) || value < 0 || value > 600000) continue;
    const route = String(o.route ?? "/").split(/[?#]/)[0]!.slice(0, 200) || "/";
    if (!route.startsWith("/")) continue;
    const device = o.device === "mobile" ? "mobile" : "desktop";
    const navType = typeof o.navType === "string" ? o.navType.slice(0, 20) : undefined;
    out.push({ route, metric: metric as Metric, value, device, navType });
  }
  return out;
}

function safeJson(s: string): unknown { try { return JSON.parse(s); } catch { return null; } }

// A small in-memory ring so the page still shows something when the database is off.
const recent: Array<VitalSample & { rating: Rating; at: number }> = [];
const RING = 2000;

export async function storeSamples(samples: VitalSample[]): Promise<number> {
  const stamped = samples.map((s) => ({ ...s, rating: rate(s.metric, s.value), at: Date.now() }));
  for (const s of stamped) { recent.push(s); if (recent.length > RING) recent.shift(); }
  const db = await getDb();
  if (!db || !stamped.length) return 0;
  try {
    await db.insert(webVitals).values(stamped.map((s) => ({ route: s.route, metric: s.metric, value: s.value.toFixed(4), rating: s.rating, device: s.device, navType: s.navType ?? null })));
    return stamped.length;
  } catch (e) {
    console.warn("[vitals] store failed:", (e as Error).message);
    return 0;
  }
}

export function p75(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(0.75 * sorted.length) - 1)]!;
}

export type VitalsSummary = {
  since: string;
  samples: number;
  source: "database" | "memory";
  overall: Array<{ metric: Metric; p75: number | null; rating: Rating | null; samples: number; threshold: [number, number] }>;
  routes: Array<{ route: string; samples: number; metrics: Partial<Record<Metric, { p75: number; rating: Rating; n: number }>> }>;
};

/** p75 for every metric overall and by route, over the last `days`. */
export async function summarize(days = 28, maxRoutes = 40): Promise<VitalsSummary> {
  const since = new Date(Date.now() - days * 86400_000);
  let rows: Array<{ route: string; metric: string; value: number; device: string }> = [];
  let source: VitalsSummary["source"] = "memory";
  const db = await getDb();
  if (db) {
    try {
      const got = await db.select({ route: webVitals.route, metric: webVitals.metric, value: webVitals.value, device: webVitals.device }).from(webVitals).where(and(gte(webVitals.createdAt, since))).orderBy(desc(webVitals.createdAt)).limit(50_000);
      rows = got.map((r) => ({ route: r.route, metric: r.metric, value: Number(r.value), device: r.device }));
      source = "database";
    } catch { /* fall back to memory */ }
  }
  if (source === "memory") rows = recent.filter((r) => r.at >= since.getTime()).map((r) => ({ route: r.route, metric: r.metric, value: r.value, device: r.device }));

  const overall = METRICS.map((metric) => {
    const vals = rows.filter((r) => r.metric === metric).map((r) => r.value);
    const p = p75(vals);
    return { metric, p75: p, rating: p === null ? null : rate(metric, p), samples: vals.length, threshold: THRESHOLDS[metric] };
  });
  const byRoute = new Map<string, typeof rows>();
  for (const r of rows) { const list = byRoute.get(r.route) ?? []; list.push(r); byRoute.set(r.route, list); }
  const routes = Array.from(byRoute.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, maxRoutes)
    .map(([route, list]) => {
      const metrics: VitalsSummary["routes"][number]["metrics"] = {};
      for (const metric of METRICS) {
        const vals = list.filter((r) => r.metric === metric).map((r) => r.value);
        const p = p75(vals);
        if (p !== null) metrics[metric] = { p75: p, rating: rate(metric, p), n: vals.length };
      }
      return { route, samples: list.length, metrics };
    });
  return { since: since.toISOString(), samples: rows.length, source, overall, routes };
}

/** Whether the last `days` of samples are all "good" at p75 — the page-experience bar. */
export function passesCoreWebVitals(summary: VitalsSummary): boolean | null {
  const core = summary.overall.filter((m) => ["LCP", "CLS", "INP"].includes(m.metric));
  if (core.some((m) => m.p75 === null)) return null;
  return core.every((m) => m.rating === "good");
}

/** `POST /api/vitals` — accepts JSON or the text/plain body sendBeacon sends. */
export function registerVitalsRoutes(app: Express) {
  app.post("/api/vitals", async (req: Request, res: Response) => {
    let body: unknown = req.body;
    if (typeof body !== "string" && !(body && typeof body === "object" && Object.keys(body as object).length)) {
      body = await new Promise<string>((resolve) => { let s = ""; req.setEncoding("utf8"); req.on("data", (c) => { if (s.length < 20_000) s += c; }); req.on("end", () => resolve(s)); req.on("error", () => resolve("")); });
    }
    const samples = parseSamples(body);
    const stored = samples.length ? await storeSamples(samples) : 0;
    res.status(204).setHeader("X-Vitals-Stored", String(stored));
    res.end();
  });
}

export const _memoryForTests = { recent, sql };

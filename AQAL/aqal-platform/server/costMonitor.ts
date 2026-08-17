// ============================================================
// LLM COST MONITOR — know the bill before 10,000 free members do.
// ============================================================
// Every panel/core LLM call records its token usage (from the API's
// own usage block when present, estimated from characters when not).
// Costs are ESTIMATES from published list prices — labeled as such
// everywhere. A daily budget (LLM_DAILY_BUDGET_USD) triggers a
// once-per-day alert email to Sam when estimated spend crosses it.

import { recordEvent } from "./db";

// $ per 1M tokens (input, output) — approximate list prices, reviewed 8/2026.
// Unknown models fall back to DEFAULT_PRICE. Estimates, not invoices.
const PRICE: Record<string, [number, number]> = {
  openai: [2.5, 10], anthropic: [3, 15], google: [1.25, 5], xai: [2, 10],
  llama: [0.6, 0.8], mistral: [2, 6], cohere: [2.5, 10], ai21: [2, 8], core: [2.5, 10],
};
const DEFAULT_PRICE: [number, number] = [3, 12];

export function estimateCostUsd(source: string, inTok: number, outTok: number): number {
  const [pin, pout] = PRICE[source] ?? DEFAULT_PRICE;
  return (inTok * pin + outTok * pout) / 1_000_000;
}

// In-memory day ledger (persisted to analytics; this is the fast path for alerts)
let dayKey = "";
let daySpendUsd = 0;
let dayCalls = 0;
let alertSentFor = "";

function rollDay() {
  const k = new Date().toISOString().slice(0, 10);
  if (k !== dayKey) { dayKey = k; daySpendUsd = 0; dayCalls = 0; }
}

export type UsageRecord = {
  source: string;          // panel member id or "core"
  model?: string;
  promptTokens?: number;   // from the API's usage block when present
  completionTokens?: number;
  promptChars?: number;    // fallback estimation inputs
  completionChars?: number;
  context?: string;        // e.g. "scoring", "beliefs", "goals-bridge"
};

export async function recordUsage(u: UsageRecord): Promise<void> {
  try {
    rollDay();
    // Chars/4 is the standard rough token estimate when the API omits usage.
    const inTok = u.promptTokens ?? Math.ceil((u.promptChars ?? 0) / 4);
    const outTok = u.completionTokens ?? Math.ceil((u.completionChars ?? 0) / 4);
    const cost = estimateCostUsd(u.source, inTok, outTok);
    daySpendUsd += cost; dayCalls += 1;

    await recordEvent({
      type: "llm_usage",
      numericValue: cost,
      ok: true,
      meta: { source: u.source, model: u.model, inTok, outTok, estimated: u.promptTokens == null, context: u.context },
    });

    // Budget alarm: once per day, to Sam, when the estimate crosses the line.
    const budget = Number(process.env.LLM_DAILY_BUDGET_USD || 0);
    if (budget > 0 && daySpendUsd > budget && alertSentFor !== dayKey) {
      alertSentFor = dayKey;
      const { sendEmail } = await import("./platform/email");
      sendEmail(
        "sam@russellcapitalsystems.com",
        `AQAL cost alert — est. $${daySpendUsd.toFixed(2)} today (budget $${budget})`,
        `<div style="font-family:monospace;font-size:13px;line-height:1.7">
          <p><b>Estimated LLM spend today:</b> $${daySpendUsd.toFixed(2)} across ${dayCalls} calls — over the $${budget} daily budget.</p>
          <p>Scoring keeps running (nothing is blocked); this is the smoke alarm, not the sprinkler. Check the admin cost summary for the per-provider breakdown. Estimates use list prices; check provider dashboards for invoices.</p>
        </div>`,
      ).catch(() => { /* alert is best-effort */ });
    }
  } catch { /* cost tracking must never break scoring */ }
}

// Pull the usage block out of an OpenAI-shaped response, tolerantly.
export function usageFrom(res: unknown): { promptTokens?: number; completionTokens?: number } {
  const u = (res as { usage?: { prompt_tokens?: number; completion_tokens?: number; input_tokens?: number; output_tokens?: number } })?.usage;
  if (!u) return {};
  return {
    promptTokens: u.prompt_tokens ?? u.input_tokens,
    completionTokens: u.completion_tokens ?? u.output_tokens,
  };
}

// Admin summary: today + trailing 7 days from the analytics ledger.
export async function costSummary() {
  const { getDb } = await import("./db");
  const db = await getDb();
  if (!db) return { available: false as const };
  const { analyticsEvents } = await import("../drizzle/schema");
  const { and, eq, gte } = await import("drizzle-orm");
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const rows = await db.select().from(analyticsEvents)
    .where(and(eq(analyticsEvents.type, "llm_usage"), gte(analyticsEvents.createdAt, since)));
  const today = new Date().toISOString().slice(0, 10);
  const byProvider: Record<string, { calls: number; usd: number }> = {};
  let todayUsd = 0, todayCalls = 0, weekUsd = 0;
  for (const r of rows) {
    const meta = (r.meta ?? {}) as { source?: string };
    const src = meta.source ?? "unknown";
    const usd = r.numericValue ?? 0;
    byProvider[src] = { calls: (byProvider[src]?.calls ?? 0) + 1, usd: (byProvider[src]?.usd ?? 0) + usd };
    weekUsd += usd;
    if (r.createdAt.toISOString().slice(0, 10) === today) { todayUsd += usd; todayCalls += 1; }
  }
  return {
    available: true as const,
    todayUsd: Math.round(todayUsd * 100) / 100,
    todayCalls,
    weekUsd: Math.round(weekUsd * 100) / 100,
    weekCalls: rows.length,
    byProvider: Object.fromEntries(Object.entries(byProvider).map(([k, v]) => [k, { calls: v.calls, usd: Math.round(v.usd * 100) / 100 }])),
    budgetUsd: Number(process.env.LLM_DAILY_BUDGET_USD || 0) || null,
    note: "Estimates from list prices; provider dashboards are the invoices.",
  };
}

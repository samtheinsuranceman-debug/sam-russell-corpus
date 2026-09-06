// ============================================================
// REAL-TIME TAX FACT FEED — machine-readable tax records in, suggested
// assessment values out. Three doors, one shape:
//   1. an IRS transcript the client pasted or uploaded (parsed here)
//   2. TAX_FEED_URL — any provider that returns the JSON record below
//      (an IRS-transcript API vendor, an information-return feed such as the
//      IRS IRIS platform, or the owner's own bridge)
//   3. the client's tax software / CPA export, same JSON
// Every value is a SUGGESTION the client confirms; nothing is written to the
// assessment here, and the source is carried with each suggestion. Reading
// the feed requires consent for integration "tax-feed", scope tax:transcripts.
// ============================================================
import type { Suggestion } from "./healthBridge";

export const TAX_FEED_GRANTEE = "integration:tax-feed";

export type TaxRecord = {
  taxYear: number;
  filingStatus?: string | null;
  adjustedGrossIncome?: number | null;
  taxableIncome?: number | null;
  totalTax?: number | null;
  federalWithholding?: number | null;
  estimatedPayments?: number | null;
  capitalGains?: number | null;
  source: string;
  sourceRef: string;
};

type Fetcher = typeof fetch;
let _fetch: Fetcher = (...a) => fetch(...a);
export function _setFetchForTests(f: Fetcher | null) { _fetch = f ?? ((...a) => fetch(...a)); }

export function taxFeedConfigured(env: NodeJS.ProcessEnv = process.env): boolean { return Boolean(env.TAX_FEED_URL); }

const MONEY = "\\$?\\s*(-?[\\d,]+(?:\\.\\d{2})?)";
function money(s: string | undefined): number | null {
  if (!s) return null;
  const n = Number(s.replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? Math.round(n) : null;
}
function find(text: string, labels: string[]): number | null {
  for (const l of labels) {
    const m = text.match(new RegExp(`${l}\\s*[:.]*\\s*${MONEY}`, "i"));
    if (m) return money(m[1]);
  }
  return null;
}

/** Parse the plain text of an IRS return or account transcript. Only labelled lines are read; unknown layouts yield nulls, never guesses. */
export function parseTranscriptText(text: string): TaxRecord | null {
  const t = text.replace(/\r/g, "");
  if (!/transcript|adjusted gross income|total tax/i.test(t)) return null;
  const yearMatch = t.match(/TAX PERIOD(?: ENDING)?\s*[:.]*\s*(?:DEC\.?\s*31,?\s*)?(\d{4})/i) ?? t.match(/TAX YEAR\s*[:.]*\s*(\d{4})/i) ?? t.match(/Form 1040[^\n]*?(\d{4})/i);
  const taxYear = yearMatch ? Number(yearMatch[1]) : NaN;
  if (!Number.isFinite(taxYear)) return null;
  const statusMatch = t.match(/FILING STATUS\s*[:.]*\s*([A-Za-z ,()/-]+)/i);
  const rawStatus = statusMatch?.[1]?.trim().replace(/\s+/g, " ") ?? null;
  const filingStatus = rawStatus ? normalizeFilingStatus(rawStatus) : null;
  return {
    taxYear,
    filingStatus,
    adjustedGrossIncome: find(t, ["ADJUSTED GROSS INCOME(?: PER COMPUTER)?", "AGI"]),
    taxableIncome: find(t, ["TAXABLE INCOME(?: PER COMPUTER)?"]),
    totalTax: find(t, ["TOTAL TAX LIABILITY(?: TP FIGURES PER COMPUTER)?", "TOTAL TAX(?: PER COMPUTER)?"]),
    federalWithholding: find(t, ["FEDERAL INCOME TAX WITHHELD", "TOTAL PAYMENTS"]),
    estimatedPayments: find(t, ["ESTIMATED TAX PAYMENTS", "ES PAYMENTS"]),
    capitalGains: find(t, ["CAPITAL GAIN OR LOSS(?: \\(SCHEDULE D\\))?", "NET CAPITAL GAIN"]),
    source: "transcript",
    sourceRef: `IRS transcript text, tax year ${taxYear}`,
  };
}

export function normalizeFilingStatus(s: string): string {
  const x = s.toLowerCase();
  if (x.includes("joint")) return "Married filing jointly";
  if (x.includes("separate")) return "Married filing separately";
  if (x.includes("head")) return "Head of household";
  if (x.includes("surviving") || x.includes("widow")) return "Qualifying surviving spouse";
  return "Single";
}

/** Pull the record from the configured feed. The provider decides the year; the token never leaves the server. */
export async function fetchTaxFeed(params: { taxpayerRef: string; taxYear?: number }, env: NodeJS.ProcessEnv = process.env): Promise<TaxRecord | null> {
  if (!taxFeedConfigured(env)) return null;
  const url = new URL(env.TAX_FEED_URL!);
  url.searchParams.set("taxpayer", params.taxpayerRef);
  if (params.taxYear) url.searchParams.set("taxYear", String(params.taxYear));
  const headers: Record<string, string> = { accept: "application/json" };
  if (env.TAX_FEED_TOKEN) headers.authorization = `Bearer ${env.TAX_FEED_TOKEN}`;
  const res = await _fetch(url, { headers, signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`tax feed → HTTP ${res.status}`);
  const j = (await res.json()) as Partial<TaxRecord> & { taxYear?: number };
  if (!j || !Number.isFinite(Number(j.taxYear))) return null;
  const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.round(v) : null);
  return {
    taxYear: Number(j.taxYear), filingStatus: j.filingStatus ? normalizeFilingStatus(String(j.filingStatus)) : null,
    adjustedGrossIncome: n(j.adjustedGrossIncome), taxableIncome: n(j.taxableIncome), totalTax: n(j.totalTax), federalWithholding: n(j.federalWithholding), estimatedPayments: n(j.estimatedPayments), capitalGains: n(j.capitalGains),
    source: "tax-feed", sourceRef: `${url.host} tax year ${j.taxYear}`,
  };
}

/** The assessment fields a tax record can fill, as suggestions. */
export function taxRecordToSuggestions(r: TaxRecord): Suggestion[] {
  const out: Suggestion[] = [];
  const conf = r.source === "transcript" ? "high" : "medium";
  const push = (key: string, label: string, value: string | number | null | undefined) => { if (value !== null && value !== undefined) out.push({ key, label, value, source: r.source, sourceRef: r.sourceRef, confidence: conf }); };
  push("taxes.filingStatus", "Filing status", r.filingStatus);
  push("taxes.adjustedGrossIncome", "Adjusted gross income (last return)", r.adjustedGrossIncome);
  push("taxes.federalTaxPaid", "Federal income tax paid (last return)", r.totalTax);
  push("taxes.quarterlyEstimates", "Quarterly estimated payments (annual total)", r.estimatedPayments);
  push("taxes.capitalGainsRealized", "Capital gains realized last year", r.capitalGains);
  return out;
}

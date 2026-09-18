import type { CarrierRating } from "../shared/carrierRatings";

export interface EnrichedCarrierRating extends CarrierRating {
  financialStrength: number;
  productQuality: number;
  serviceRating: number;
  innovationScore: number;
  valueScore: number;
  overallScore: number;
  specialty: string;
  strengths: string[];
  dataSource: "live" | "cached";
  lastUpdated: string;
}

let cachedRatings: EnrichedCarrierRating[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 60 * 1000;

function finiteScore(value: unknown): number | null {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 10 ? number : null;
}

function validateCarrier(value: unknown): EnrichedCarrierRating | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, any>;
  if (typeof row.carrierId !== "string" || typeof row.carrierName !== "string" || !row.amBest || !row.sp || !row.financials) return null;
  const scores = ["financialStrength", "productQuality", "serviceRating", "innovationScore", "valueScore", "overallScore"].map(key => finiteScore(row[key]));
  if (scores.some(score => score === null)) return null;
  if (!row.amBest.rating || !row.sp.rating || !row.lastUpdated) return null;
  return {
    ...row,
    financialStrength: scores[0]!, productQuality: scores[1]!, serviceRating: scores[2]!,
    innovationScore: scores[3]!, valueScore: scores[4]!, overallScore: scores[5]!,
    specialty: typeof row.specialty === "string" ? row.specialty : "",
    strengths: Array.isArray(row.strengths) ? row.strengths.filter((item: unknown) => typeof item === "string").slice(0, 8) : [],
    dataSource: "live",
    lastUpdated: String(row.lastUpdated),
  } as EnrichedCarrierRating;
}

export async function getEnrichedCarrierRatings(): Promise<EnrichedCarrierRating[]> {
  if (cachedRatings && Date.now() - cacheTimestamp < CACHE_TTL_MS) return cachedRatings.map(row => ({ ...row, dataSource: "cached" }));
  try {
    const { callDataApi } = await import("./_core/dataApi");
    const response = await callDataApi("InsuranceRatings/carriers", { query: {} }) as unknown;
    const candidates: unknown[] = Array.isArray(response) ? response : Array.isArray((response as any)?.carriers) ? (response as any).carriers : [];
    const validated = candidates.map(validateCarrier).filter((row): row is EnrichedCarrierRating => row !== null);
    cachedRatings = validated;
    cacheTimestamp = Date.now();
    return validated;
  } catch {
    return [];
  }
}

export async function getEnrichedCarrierById(carrierId: string): Promise<EnrichedCarrierRating | null> {
  return (await getEnrichedCarrierRatings()).find(carrier => carrier.carrierId === carrierId) ?? null;
}

export function invalidateCarrierCache(): void {
  cachedRatings = null;
  cacheTimestamp = 0;
}

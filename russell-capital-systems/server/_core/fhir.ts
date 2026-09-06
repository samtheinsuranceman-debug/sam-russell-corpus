// ============================================================
// FHIR CLIENT — the consented health-data bridge's transport. Talks to any
// FHIR R4 server (a payer's Patient Access API, a clearinghouse, a SMART on
// FHIR backend) with a bearer token from the environment. Reads only
// Coverage and ExplanationOfBenefit; nothing here is ever used for
// underwriting, and nothing is fetched without a consent grant (checked by
// the caller). Keys live only in the host's environment panel.
// ============================================================

export type FhirEnv = Partial<Record<"FHIR_BASE_URL" | "FHIR_ACCESS_TOKEN", string>>;

export function fhirConfigured(env: FhirEnv = process.env as FhirEnv): boolean {
  return Boolean(env.FHIR_BASE_URL && env.FHIR_ACCESS_TOKEN);
}

type Fetcher = typeof fetch;
let _fetch: Fetcher = (...a) => fetch(...a);
export function _setFetchForTests(f: Fetcher | null) { _fetch = f ?? ((...a) => fetch(...a)); }

export type FhirBundle = { resourceType: "Bundle"; total?: number; entry?: Array<{ resource: Record<string, unknown> }> };

export async function fhirGet(path: string, params: Record<string, string> = {}, env: FhirEnv = process.env as FhirEnv): Promise<FhirBundle> {
  if (!fhirConfigured(env)) throw new Error("FHIR is not configured (FHIR_BASE_URL, FHIR_ACCESS_TOKEN)");
  const url = new URL(path.replace(/^\//, ""), env.FHIR_BASE_URL!.replace(/\/+$/, "") + "/");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await _fetch(url, { headers: { accept: "application/fhir+json", authorization: `Bearer ${env.FHIR_ACCESS_TOKEN}` }, signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`FHIR ${path} → HTTP ${res.status}`);
  return (await res.json()) as FhirBundle;
}

export function fetchCoverage(patientId: string, env?: FhirEnv): Promise<FhirBundle> {
  return fhirGet("Coverage", { patient: patientId, _count: "50" }, env);
}

export function fetchExplanationOfBenefit(patientId: string, sinceIso: string, env?: FhirEnv): Promise<FhirBundle> {
  return fhirGet("ExplanationOfBenefit", { patient: patientId, "service-date": `ge${sinceIso.slice(0, 10)}`, _count: "200" }, env);
}

export function resources(bundle: FhirBundle | null | undefined, type: string): Record<string, unknown>[] {
  return (bundle?.entry ?? []).map((e) => e.resource).filter((r) => r && r.resourceType === type);
}

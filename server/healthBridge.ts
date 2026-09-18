// ============================================================
// CONSENTED HEALTH-FINANCIAL BRIDGE — turns FHIR Coverage and
// ExplanationOfBenefit records into SUGGESTED assessment values the client
// confirms field by field. It never writes a fact directly, never stores
// clinical detail, and is only reachable with an active consent grant for
// integration "fhir" covering health:coverage / health:claims. The
// suggestions carry the source so the ledger can say where a number came
// from.
// ============================================================
import { fetchCoverage, fetchExplanationOfBenefit, resources, type FhirBundle } from "./_core/fhir";

export const FHIR_GRANTEE = "integration:fhir";

export type Suggestion = { key: string; label: string; value: string | number | boolean; source: string; sourceRef: string; confidence: "high" | "medium" | "low"; note?: string };

function str(v: unknown): string { return typeof v === "string" ? v : ""; }
function num(v: unknown): number | null { return typeof v === "number" && Number.isFinite(v) ? v : null; }

/** Coverage → the plan type question in the Insurance section. */
export function coverageToSuggestions(bundle: FhirBundle): Suggestion[] {
  const out: Suggestion[] = [];
  for (const c of resources(bundle, "Coverage")) {
    if (str(c.status) && str(c.status) !== "active") continue;
    const typeText = str((c.type as { text?: string } | undefined)?.text) || str(((c.type as { coding?: Array<{ display?: string; code?: string }> } | undefined)?.coding ?? [])[0]?.display) || "";
    const classes = (c.class as Array<{ type?: { coding?: Array<{ code?: string }> }; name?: string; value?: string }> | undefined) ?? [];
    const planName = classes.find((k) => (k.type?.coding ?? []).some((x) => x.code === "plan"))?.name ?? "";
    const text = `${typeText} ${planName}`.toLowerCase();
    let plan: string | null = null;
    if (/hdhp|high[- ]deductible|hsa/.test(text)) plan = "High-deductible (HSA-eligible)";
    else if (/ppo|hmo|epo|pos|group|employer/.test(text)) plan = "Employer PPO/HMO";
    else if (/marketplace|exchange|aca|individual/.test(text)) plan = "Marketplace";
    if (plan) out.push({ key: "insurance.healthPlanType", label: "Health plan type", value: plan, source: "fhir", sourceRef: `Coverage/${str(c.id) || "?"}`, confidence: /hdhp|hsa|ppo|hmo/.test(text) ? "high" : "medium", note: planName || typeText || undefined });
    break; // the first active coverage is the primary plan
  }
  return out;
}

/** EOBs for a period → what the household actually paid out of pocket (a cash-flow and coverage-gap input). */
export function eobToSuggestions(bundle: FhirBundle, periodLabel: string): Suggestion[] {
  let outOfPocket = 0, claims = 0;
  for (const e of resources(bundle, "ExplanationOfBenefit")) {
    claims += 1;
    const totals = (e.total as Array<{ category?: { coding?: Array<{ code?: string }> }; amount?: { value?: number } }> | undefined) ?? [];
    for (const t of totals) {
      const code = (t.category?.coding ?? [])[0]?.code ?? "";
      if (/paidbypatient|patientpaid|copay|deductible|coinsurance|memberliability/i.test(code)) outOfPocket += num(t.amount?.value) ?? 0;
    }
  }
  if (!claims) return [];
  // The assessment has no dedicated out-of-pocket field; the coverage-gaps
  // question is where this belongs, as a sentence the client can keep or edit.
  const paid = Math.round(outOfPocket).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  return [{ key: "insurance.coverageGapsConcern", label: "Coverage gaps (from claims data)", value: `Out-of-pocket medical ${periodLabel}: ${paid} across ${claims} claim${claims === 1 ? "" : "s"} (from health claims data).`, source: "fhir", sourceRef: `ExplanationOfBenefit×${claims}`, confidence: outOfPocket > 0 ? "medium" : "low", note: `${claims} claims read; amounts the patient paid, summed` }];
}

export async function importFromFhir(patientId: string, sinceIso: string): Promise<{ suggestions: Suggestion[]; read: { coverage: number; eob: number } }> {
  const [cov, eob] = await Promise.all([fetchCoverage(patientId), fetchExplanationOfBenefit(patientId, sinceIso)]);
  const suggestions = [...coverageToSuggestions(cov), ...eobToSuggestions(eob, `since ${sinceIso.slice(0, 10)}`)];
  return { suggestions, read: { coverage: resources(cov, "Coverage").length, eob: resources(eob, "ExplanationOfBenefit").length } };
}

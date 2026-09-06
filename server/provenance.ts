// ============================================================
// PROVENANCE DOCUMENT VAULT — every file in the vault gets a content hash,
// a version lineage (which document it supersedes), a signed provenance
// record (who added it, when, from where) and, for estate documents, a
// consistency check against the plan: does the will name the spouse the
// assessment names, is a guardian named when there are minor children, is
// the document newer than the last beneficiary review. Conflicts surface at
// upload time, not at probate.
// ============================================================
import { createHash, createHmac } from "node:crypto";
import { adviceSigningKey } from "./advice";
import { recordEvent } from "./ledger";
import { insertProvenance, provenanceForDocument, type Ids } from "./controlsDb";

export type EstateMetadata = {
  documentType?: "will" | "revocable_trust" | "irrevocable_trust" | "poa_financial" | "healthcare_directive" | "beneficiary_designation" | "buy_sell" | "other" | null;
  effectiveDate?: string | null; // ISO date
  parties?: string[];
  beneficiaries?: string[];
  trustees?: string[];
  executor?: string | null;
  guardian?: string | null;
  notes?: string | null;
};

export type PlanFactsForCheck = {
  spouseName?: string | null;
  maritalStatus?: string | null;
  dependents?: number | null;
  hasWill?: boolean | null;
  hasRevocableTrust?: boolean | null;
  guardianNamed?: string | null;
  heirsText?: string | null;
};

export type ConsistencyIssue = { severity: "conflict" | "warning" | "info"; message: string };

export function sha256Hex(buf: Buffer | Uint8Array | string): string {
  return createHash("sha256").update(buf).digest("hex");
}

export function signProvenance(fields: { documentId: number; sha256: string; uploadedAt: string; uploadedBy: string }, secret = adviceSigningKey()): string {
  return createHmac("sha256", secret || "unsigned").update(`${fields.documentId}|${fields.sha256}|${fields.uploadedAt}|${fields.uploadedBy}`).digest("hex");
}

function nameIn(list: string[] | undefined, name: string | null | undefined): boolean {
  if (!name || !list?.length) return false;
  const n = name.trim().toLowerCase();
  const first = n.split(/\s+/)[0] ?? n;
  return list.some((x) => { const y = x.trim().toLowerCase(); return y === n || y.includes(first) || n.includes(y.split(/\s+/)[0] ?? y); });
}

/** Compare an estate document's declared contents with the plan. Flags, never auto-corrects. */
export function checkEstateConsistency(meta: EstateMetadata | null | undefined, facts: PlanFactsForCheck): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];
  if (!meta) return [{ severity: "info", message: "No structured details were entered for this document; nothing to check against the plan." }];
  const married = /married|partnership/i.test(facts.maritalStatus ?? "");
  const names = [...(meta.beneficiaries ?? []), ...(meta.trustees ?? []), ...(meta.parties ?? []), ...(meta.executor ? [meta.executor] : [])];
  if (married && facts.spouseName && names.length && !nameIn(names, facts.spouseName)) issues.push({ severity: "conflict", message: `The assessment names a spouse/partner (${facts.spouseName}) who does not appear in this document's beneficiaries, trustees, parties or executor.` });
  if (!married && facts.spouseName == null && (meta.beneficiaries ?? []).length === 0 && meta.documentType === "will") issues.push({ severity: "warning", message: "The will lists no beneficiaries." });
  if ((facts.dependents ?? 0) > 0 && meta.documentType === "will" && !meta.guardian && !/yes/i.test(facts.guardianNamed ?? "")) issues.push({ severity: "warning", message: "There are dependents in the assessment but no guardian is named in this will or the assessment." });
  if (meta.documentType === "will" && facts.hasWill === false) issues.push({ severity: "info", message: "The assessment says there is no current will; update the Estate section now that one is on file." });
  if ((meta.documentType === "revocable_trust" || meta.documentType === "irrevocable_trust") && facts.hasRevocableTrust === false && meta.documentType === "revocable_trust") issues.push({ severity: "info", message: "The assessment says there is no revocable trust; update the Estate section now that one is on file." });
  if (meta.effectiveDate) {
    const d = new Date(meta.effectiveDate);
    if (!Number.isNaN(d.getTime()) && d.getTime() > Date.now()) issues.push({ severity: "warning", message: "The effective date is in the future." });
    if (!Number.isNaN(d.getTime()) && Date.now() - d.getTime() > 10 * 365.25 * 86_400_000) issues.push({ severity: "warning", message: "This document is more than ten years old; a review is usually due." });
  }
  if (facts.heirsText && (meta.beneficiaries ?? []).length) {
    const missing = (meta.beneficiaries ?? []).filter((b) => !facts.heirsText!.toLowerCase().includes((b.split(/\s+/)[0] ?? b).toLowerCase()));
    if (missing.length) issues.push({ severity: "warning", message: `Beneficiaries not mentioned in the assessment's "who should inherit" answer: ${missing.join(", ")}.` });
  }
  if (!issues.length) issues.push({ severity: "info", message: "Consistent with the plan as recorded." });
  return issues;
}

export async function recordDocumentProvenance(ids: Ids, input: {
  documentId: number; name: string; category: string; bytes: Buffer; mimeType: string | null; uploadedByUserId: number | null; uploadedByName: string;
  supersedesDocumentId?: number | null; supersedesReason?: string | null; metadata?: EstateMetadata | null; facts?: PlanFactsForCheck | null; source?: string;
}): Promise<{ sha256: string; version: number; signature: string; issues: ConsistencyIssue[] }> {
  const sha256 = sha256Hex(input.bytes);
  const uploadedAt = new Date().toISOString();
  const signature = signProvenance({ documentId: input.documentId, sha256, uploadedAt, uploadedBy: input.uploadedByName });
  const prev = input.supersedesDocumentId ? await provenanceForDocument(input.supersedesDocumentId) : null;
  const version = (prev?.version ?? 0) + 1;
  const estate = ["ESTATE_PLAN", "TRUST_DOCUMENT", "LEGAL_AGREEMENT"].includes(input.category);
  const issues = estate ? checkEstateConsistency(input.metadata ?? null, input.facts ?? {}) : [];
  await insertProvenance({
    documentId: input.documentId, clientId: ids.clientId ?? null, workspaceId: ids.workspaceId ?? null, sha256, sizeBytes: input.bytes.length, mimeType: input.mimeType,
    version, previousDocumentId: input.supersedesDocumentId ?? null, supersedesReason: input.supersedesReason ?? null, source: input.source ?? "upload",
    uploadedByUserId: input.uploadedByUserId, uploadedByName: input.uploadedByName, signature, signedAt: new Date(uploadedAt), metadata: input.metadata ?? null, consistency: issues.length ? issues : null,
  });
  const conflicts = issues.filter((i) => i.severity === "conflict").length;
  const warnings = issues.filter((i) => i.severity === "warning").length;
  await recordEvent({
    kind: "document", source: "advisor", key: `document.${input.documentId}`, label: input.name,
    value: { documentId: input.documentId, category: input.category, sha256, version, supersedes: input.supersedesDocumentId ?? null, signed: true, issues },
    summary: `${input.name} (${input.category}) added to the vault, v${version}, sha256 ${sha256.slice(0, 12)}…${conflicts ? ` — ${conflicts} conflict${conflicts === 1 ? "" : "s"} with the plan` : warnings ? ` — ${warnings} warning${warnings === 1 ? "" : "s"}` : estate ? " — consistent with the plan" : ""}`,
    actorName: input.uploadedByName, ...ids,
  });
  return { sha256, version, signature, issues };
}

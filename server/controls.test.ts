// ============================================================
// The authority layer: consent, mandates, the transaction firewall, the
// signed advice log, the automation runtime's matching and idempotency, the
// versioned tax rules, the health bridge and tax feed mappings, and document
// provenance. Pure logic and mocked transports — no database.
// ============================================================
import { describe, expect, it } from "vitest";
import { CONSENT_SCOPE_LIST, checkConsent, describeGrant, isGrantActive, scopeCovered } from "@shared/consent";
import { describeMandate, mandateAllows, type MandateLike } from "@shared/mandates";
import { DEFAULT_POLICY, evaluateMovement, mergePolicy, type FirewallContext } from "@shared/firewall";
import { TAX_RULES_2025, TAX_RULES_2026, computeTaxPicture, currentRules, diffRuleSets, federalTax, filingKeyFromLabel, recomputeUnderRules, retirementLimits, rulesForYear, saltAllowed, standardDeduction } from "@shared/taxRules";
import { calculateTax } from "@shared/taxBracketEngine";
import { buildSignedAdvice, factsUsed, hashValue, verifyAdvice } from "./advice";
import { eventHash, fillTemplate, triggerMatches, verifyInboundSignature } from "./automations";
import { coverageToSuggestions, eobToSuggestions } from "./healthBridge";
import { fetchTaxFeed, parseTranscriptText, taxRecordToSuggestions, _setFetchForTests as setTaxFetch } from "./taxFeed";
import { checkEstateConsistency, sha256Hex, signProvenance } from "./provenance";
import { createHmac } from "node:crypto";

const NOW = new Date("2026-09-06T12:00:00Z");
const day = 86_400_000;

describe("consent ledger", () => {
  const grants = [
    { id: 1, granteeType: "integration", granteeId: "integration:fhir", scopes: ["health:coverage", "health:claims"], startsAt: new Date(NOW.getTime() - day), expiresAt: new Date(NOW.getTime() + 30 * day), revokedAt: null },
    { id: 2, granteeType: "person", granteeId: "spouse@example.test", granteeLabel: "Dana", scopes: ["facts:read", "ledger:read"], startsAt: new Date(NOW.getTime() - day), expiresAt: null, revokedAt: new Date(NOW.getTime() - 3600_000) },
    { id: 3, granteeType: "agent", granteeId: "agent:harvest", scopes: ["accounts:*"], startsAt: new Date(NOW.getTime() + day), expiresAt: null, revokedAt: null },
  ];
  it("allows only an active grant that covers the scope", () => {
    expect(checkConsent(grants, "integration:fhir", "health:claims", NOW).allowed).toBe(true);
    expect(checkConsent(grants, "integration:fhir", "tax:transcripts", NOW)).toMatchObject({ allowed: false, reason: expect.stringContaining("not allowed") });
    expect(checkConsent(grants, "spouse@example.test", "facts:read", NOW)).toMatchObject({ allowed: false, reason: expect.stringContaining("revoked") });
    expect(checkConsent(grants, "agent:harvest", "accounts:balances", NOW).allowed).toBe(false); // not started yet
    expect(checkConsent(grants, "agent:harvest", "accounts:balances", new Date(NOW.getTime() + 2 * day)).allowed).toBe(true); // wildcard scope
    expect(checkConsent(grants, "nobody", "facts:read", NOW).reason).toContain("no consent recorded");
  });
  it("expires, wildcards, and describes", () => {
    expect(isGrantActive(grants[0]!, new Date(NOW.getTime() + 31 * day))).toBe(false);
    expect(scopeCovered(["*"], "money:propose")).toBe(true);
    expect(scopeCovered(["health:*"], "accounts:balances")).toBe(false);
    expect(describeGrant(grants[0]!)).toContain("integration:fhir may health coverage, health claims until 2026-10-06");
    expect(CONSENT_SCOPE_LIST).toContain("money:propose");
  });
});

describe("scoped agent mandates", () => {
  const m: MandateLike = { id: 7, agentId: "agent:bill-pay", label: "Bill pay", actions: ["pay", "transfer"], accounts: ["checking"], ceilingCents: 250_000, periodCeilingCents: 1_000_000, periodDays: 30, approvalAboveCents: 100_000, startsAt: new Date(NOW.getTime() - day), expiresAt: new Date(NOW.getTime() + 180 * day), revokedAt: null };
  it("permits inside the ceilings, asks for approval above the line, refuses outside", () => {
    expect(mandateAllows(m, { action: "pay", amountCents: 50_000, account: "checking", now: NOW })).toEqual({ ok: true, needsApproval: false, reasons: [] });
    expect(mandateAllows(m, { action: "pay", amountCents: 150_000, now: NOW })).toMatchObject({ ok: true, needsApproval: true });
    expect(mandateAllows(m, { action: "pay", amountCents: 300_000, now: NOW })).toMatchObject({ ok: false, reasons: [expect.stringContaining("per-action ceiling")] });
    expect(mandateAllows(m, { action: "withdraw", amountCents: 1, now: NOW }).reasons[0]).toContain('action "withdraw" is not in the mandate');
    expect(mandateAllows(m, { action: "pay", amountCents: 1, account: "brokerage", now: NOW }).reasons[0]).toContain("not in the mandate");
    expect(mandateAllows(m, { action: "pay", amountCents: 50_000, spentInPeriodCents: 980_000, now: NOW }).reasons[0]).toContain("30-day ceiling");
    expect(mandateAllows(m, { action: "pay", amountCents: 1, now: new Date(NOW.getTime() + 200 * day) }).reasons[0]).toContain("not active");
    expect(describeMandate(m)).toBe("Bill pay may pay, transfer up to $2,500 each, $10,000 per 30 days; approval above $1,000 until 2027-03-05");
  });
});

describe("fiduciary transaction firewall", () => {
  const base: FirewallContext = { policy: DEFAULT_POLICY, mandate: null, spentInPeriodCents: 0, knownPayees: ["Practice Landlord LLC"], availableBalanceCents: 2_000_000, now: NOW };
  const mandate: MandateLike = { id: 1, agentId: "agent:bill-pay", actions: ["pay"], accounts: [], ceilingCents: 500_000, periodCeilingCents: null, periodDays: null, approvalAboveCents: 200_000, startsAt: new Date(NOW.getTime() - day), expiresAt: null, revokedAt: null };
  it("holds an agent with no mandate, allows one inside its mandate, blocks one outside", () => {
    const noMandate = evaluateMovement({ action: "pay", amountCents: 10_000, counterparty: "Practice Landlord LLC", purpose: "rent", proposedBy: "agent:bill-pay", isAgent: true }, base);
    expect(noMandate.decision).toBe("hold");
    expect(noMandate.reasons[0]).toContain("holds no mandate");
    expect(noMandate.requiredApprovals).toEqual(["client or advisor"]);
    const ok = evaluateMovement({ action: "pay", amountCents: 10_000, counterparty: "Practice Landlord LLC", purpose: "rent", proposedBy: "agent:bill-pay", isAgent: true }, { ...base, mandate });
    expect(ok).toMatchObject({ decision: "allow", requiredApprovals: [] });
    expect(ok.reversibleUntil.toISOString()).toBe("2026-09-07T12:00:00.000Z");
    const outside = evaluateMovement({ action: "withdraw", amountCents: 10_000, purpose: "x", proposedBy: "agent:bill-pay", isAgent: true }, { ...base, mandate });
    expect(outside.decision).toBe("block");
  });
  it("applies the policy: blocked and conflict payees, hold line, new-payee cooling, reserve floor", () => {
    const policy = mergePolicy({ blockedCounterparties: ["Shady Co"], conflictParties: ["Brother-in-law Ventures"], holdAboveCents: 1_000_000, reserveFloorCents: 1_500_000 });
    expect(evaluateMovement({ action: "pay", amountCents: 100, counterparty: "shady co", purpose: "x", proposedBy: "user:1", isAgent: false }, { ...base, policy }).decision).toBe("block");
    const conflict = evaluateMovement({ action: "pay", amountCents: 100, counterparty: "Brother-in-law Ventures", purpose: "x", proposedBy: "user:1", isAgent: false }, { ...base, policy, knownPayees: ["Brother-in-law Ventures"] });
    expect(conflict).toMatchObject({ decision: "hold", requiredApprovals: ["advisor"] });
    expect(evaluateMovement({ action: "transfer", amountCents: 1_200_000, purpose: "x", proposedBy: "user:1", isAgent: false }, { ...base, policy }).reasons.join(" ")).toContain("hold line");
    expect(evaluateMovement({ action: "pay", amountCents: 100, counterparty: "New Vendor", purpose: "x", proposedBy: "user:1", isAgent: false }, { ...base, policy }).reasons[0]).toContain("24-hour cooling-off");
    expect(evaluateMovement({ action: "pay", amountCents: 600_000, counterparty: "Practice Landlord LLC", purpose: "x", proposedBy: "user:1", isAgent: false }, { ...base, policy }).reasons.join(" ")).toContain("reserve floor");
    expect(evaluateMovement({ action: "pay", amountCents: 0, purpose: "x", proposedBy: "user:1", isAgent: false }, base).decision).toBe("block");
    expect(evaluateMovement({ action: "contribute", amountCents: 50_000, purpose: "401k", proposedBy: "user:1", isAgent: false }, base)).toMatchObject({ decision: "allow", reasons: ["inside every policy rule"] });
  });
});

describe("signed advice log", () => {
  const data = { version: 1 as const, sections: { income: { w2Income: 650_000, bonusIncome: null }, taxes: { filingStatus: "Married filing jointly" } }, lists: { properties: [{ value: 1 }] } };
  it("hashes the facts it saw, signs the payload, and detects any change", () => {
    const used = factsUsed(data);
    expect(used.map((u) => u.key)).toEqual(["income.w2Income", "taxes.filingStatus", "lists.properties"]);
    expect(used[0]!.hash).toBe(hashValue(650_000));
    expect(JSON.stringify(used)).not.toContain("650000");
    const signed = buildSignedAdvice({ question: "Should I convert?", answer: "Here is the shape…", via: "synthesis", voices: ["Claude", "ChatGPT"], dataUsed: used, assumptions: ["a"], rulesApplied: ["r"], at: NOW }, "secret-1");
    expect(signed.payload.rulesVersion).toBe("2026.rp-25-32");
    expect(signed.payload.disclaimers.length).toBe(3);
    expect(verifyAdvice(signed, "secret-1")).toEqual({ ok: true, reason: "signature verified" });
    expect(verifyAdvice({ ...signed, payload: { ...signed.payload, answer: "tampered" } }, "secret-1").ok).toBe(false);
    expect(verifyAdvice(signed, "other-key").reason).toBe("signed with a different key");
    expect(verifyAdvice({ nope: 1 }, "secret-1").reason).toBe("not a signed advice record");
  });
});

describe("plan runtime", () => {
  it("matches triggers with exact keys and prefixes, fills templates, hashes events stably", () => {
    const e = { kind: "document" as const, source: "advisor" as const, key: "document.42", summary: "Will added", value: { documentId: 42 }, occurredAt: NOW, clientId: 3 };
    expect(triggerMatches({ triggerKind: "document", triggerKey: null, triggerSource: null }, e)).toBe(true);
    expect(triggerMatches({ triggerKind: "document", triggerKey: "document.*", triggerSource: null }, e)).toBe(true);
    expect(triggerMatches({ triggerKind: "document", triggerKey: "document.41", triggerSource: null }, e)).toBe(false);
    expect(triggerMatches({ triggerKind: "document", triggerKey: null, triggerSource: "client" }, e)).toBe(false);
    expect(triggerMatches({ triggerKind: "fact", triggerKey: null, triggerSource: null }, e)).toBe(false);
    expect(fillTemplate("On {{kind}} {{key}}: {{summary}} / {{value}}", e)).toBe('On document document.42: Will added / {"documentId":42}');
    expect(eventHash(e)).toBe(eventHash({ ...e, occurredAt: new Date(NOW.getTime() + 500) })); // same second → same hash
    expect(eventHash(e)).not.toBe(eventHash({ ...e, summary: "Trust added" }));
  });
  it("verifies inbound signatures", () => {
    const body = JSON.stringify({ subject: { clientId: 3 }, key: "cash.received", summary: "Remittance posted" });
    const sig = createHmac("sha256", "s3cret").update(body).digest("hex");
    expect(verifyInboundSignature(body, sig, "s3cret")).toBe(true);
    expect(verifyInboundSignature(body, sig.replace(/^./, "0"), "s3cret") || verifyInboundSignature(body, sig, "wrong") || verifyInboundSignature(body, undefined, "s3cret") || verifyInboundSignature(body, sig, "")).toBe(false);
  });
});

describe("versioned tax rules", () => {
  it("carries the published figures for 2025 and 2026", () => {
    expect(TAX_RULES_2025.standardDeduction).toEqual({ single: 15_750, joint: 31_500, hoh: 23_625, separate: 15_750 });
    expect(TAX_RULES_2026.standardDeduction).toEqual({ single: 16_100, joint: 32_200, hoh: 24_150, separate: 16_100 });
    expect(TAX_RULES_2026.brackets.single.map((b) => b.upTo)).toEqual([12_400, 50_400, 105_700, 201_775, 256_225, 640_600, null]);
    expect(TAX_RULES_2026.brackets.joint.map((b) => b.upTo)).toEqual([24_800, 100_800, 211_400, 403_550, 512_450, 768_700, null]);
    expect(TAX_RULES_2026.retirement).toMatchObject({ deferral401k: 24_500, catchUp50: 8_000, catchUp60to63: 11_250, ira: 7_500, iraCatchUp: 1_100 });
    expect(TAX_RULES_2025.retirement).toMatchObject({ deferral401k: 23_500, catchUp50: 7_500, ira: 7_000 });
    expect([TAX_RULES_2025.estateBasicExclusion, TAX_RULES_2026.estateBasicExclusion]).toEqual([13_990_000, 15_000_000]);
    expect(rulesForYear(2027).version).toBe("2026.rp-25-32");
    expect(currentRules(NOW).taxYear).toBe(2026);
  });
  it("computes tax from the 'the tax is' tables: $100,000 single taxable in 2026 owes $16,712", () => {
    expect(federalTax(100_000, "single", TAX_RULES_2026)).toMatchObject({ tax: 16_712, marginalRate: 0.22 });
    expect(federalTax(250_000, "single", TAX_RULES_2026).tax).toBe(56_456);
    expect(federalTax(0, "joint", TAX_RULES_2026).tax).toBe(0);
    expect(standardDeduction("joint", TAX_RULES_2026, { age65Count: 2 })).toBe(32_200 + 2 * 1_650);
    expect(filingKeyFromLabel("Married filing jointly")).toBe("joint");
    expect(filingKeyFromLabel("Qualifying surviving spouse")).toBe("joint");
    expect(filingKeyFromLabel("Head of household")).toBe("hoh");
  });
  it("applies the SALT cap with the MAGI phase-down and floor", () => {
    expect(saltAllowed(52_000, 550_000, "joint", TAX_RULES_2025)).toBe(25_000); // the published worked example
    expect(saltAllowed(30_000, 580_000, "single", TAX_RULES_2025)).toBe(16_000);
    expect(saltAllowed(60_000, 610_000, "joint", TAX_RULES_2025)).toBe(10_000);
    expect(saltAllowed(14_000, 200_000, "single", TAX_RULES_2026)).toBe(14_000);
    expect(saltAllowed(30_000, 200_000, "separate", TAX_RULES_2026)).toBe(20_200);
  });
  it("sizes retirement room by age and recomputes a client under a new rule set", () => {
    expect(retirementLimits(45, TAX_RULES_2026)).toMatchObject({ total401k: 24_500, iraTotal: 7_500 });
    expect(retirementLimits(52, TAX_RULES_2026)).toMatchObject({ total401k: 32_500, iraTotal: 8_600 });
    expect(retirementLimits(61, TAX_RULES_2026).total401k).toBe(24_500 + 11_250);
    const facts = { filing: "joint" as const, agi: 650_000, saltPaid: 45_000, itemizedOtherThanSalt: 30_000, age: 48, spouseAge: 47 };
    const pic = computeTaxPicture(facts, TAX_RULES_2026);
    expect(pic.deductionMethod).toBe("itemized");
    expect(pic.saltAllowed).toBe(10_000); // 650k MAGI is past the phase-down
    expect(pic.taxableIncome).toBe(650_000 - 40_000);
    expect(pic.marginalRate).toBe(0.35);
    const r = recomputeUnderRules(facts, TAX_RULES_2025, TAX_RULES_2026);
    expect(r.federalTaxDelta).toBeLessThan(0); // indexed thresholds lower the bill on the same facts
    expect(r.summary).toContain("federal tax down");
    expect(diffRuleSets(TAX_RULES_2025, TAX_RULES_2026).some((c) => c.field === "estateBasicExclusion" && c.from === 13_990_000 && c.to === 15_000_000)).toBe(true);
  });
  it("feeds the legacy bracket engine so every calculator reads the same figures", () => {
    const t = calculateTax(116_100, "single", "TX");
    expect(t.standardDeduction).toBe(16_100);
    expect(t.taxableIncome).toBe(100_000);
    expect(Math.round(t.federalTax)).toBe(16_712);
  });
});

describe("health bridge and tax feed", () => {
  it("maps Coverage to the plan-type question and EOBs to the coverage-gaps note", () => {
    const cov = { resourceType: "Bundle" as const, entry: [{ resource: { resourceType: "Coverage", id: "c1", status: "active", type: { text: "HDHP" }, class: [{ type: { coding: [{ code: "plan" }] }, name: "Silver HSA 3000" }] } }] };
    expect(coverageToSuggestions(cov)[0]).toMatchObject({ key: "insurance.healthPlanType", value: "High-deductible (HSA-eligible)", source: "fhir", sourceRef: "Coverage/c1", confidence: "high" });
    const eob = { resourceType: "Bundle" as const, entry: [
      { resource: { resourceType: "ExplanationOfBenefit", total: [{ category: { coding: [{ code: "paidbypatient" }] }, amount: { value: 320.5 } }, { category: { coding: [{ code: "benefit" }] }, amount: { value: 9_000 } }] } },
      { resource: { resourceType: "ExplanationOfBenefit", total: [{ category: { coding: [{ code: "deductible" }] }, amount: { value: 1_000 } }] } },
    ] };
    const s = eobToSuggestions(eob, "since 2025-09-06")[0]!;
    expect(s.key).toBe("insurance.coverageGapsConcern");
    expect(String(s.value)).toContain("$1,321 across 2 claims");
    expect(eobToSuggestions({ resourceType: "Bundle" }, "x")).toEqual([]);
  });
  it("parses an IRS transcript and maps it to the Taxes section", () => {
    const rec = parseTranscriptText(`Record of Account Transcript\nTAX PERIOD: Dec. 31, 2025\nFILING STATUS: Married Filing Joint\nADJUSTED GROSS INCOME: 642,318.00\nTAXABLE INCOME: 598,004.00\nTOTAL TAX LIABILITY TP FIGURES PER COMPUTER: 168,220.00\nFEDERAL INCOME TAX WITHHELD: 150,000.00\nESTIMATED TAX PAYMENTS: 20,000.00\n`);
    expect(rec).toMatchObject({ taxYear: 2025, filingStatus: "Married filing jointly", adjustedGrossIncome: 642_318, taxableIncome: 598_004, totalTax: 168_220, federalWithholding: 150_000, estimatedPayments: 20_000, source: "transcript" });
    const s = taxRecordToSuggestions(rec!);
    expect(s.map((x) => [x.key, x.value])).toEqual([["taxes.filingStatus", "Married filing jointly"], ["taxes.adjustedGrossIncome", 642_318], ["taxes.federalTaxPaid", 168_220], ["taxes.quarterlyEstimates", 20_000]]);
    expect(parseTranscriptText("hello world")).toBeNull();
  });
  it("reads the configured feed with the token kept server-side", async () => {
    const calls: Array<{ url: string; auth: string | undefined }> = [];
    setTaxFetch((async (url: string | URL | Request, init?: RequestInit) => { calls.push({ url: String(url), auth: (init?.headers as Record<string, string>)?.authorization }); return { ok: true, status: 200, json: async () => ({ taxYear: 2025, filingStatus: "single", adjustedGrossIncome: 410_000.4, totalTax: 100_000 }) } as Response; }) as typeof fetch);
    const r = await fetchTaxFeed({ taxpayerRef: "tp-1", taxYear: 2025 }, { TAX_FEED_URL: "https://feed.example.test/v1/record", TAX_FEED_TOKEN: "tok" } as NodeJS.ProcessEnv);
    expect(r).toMatchObject({ taxYear: 2025, filingStatus: "Single", adjustedGrossIncome: 410_000, totalTax: 100_000, source: "tax-feed" });
    expect(calls[0]!.url).toContain("taxpayer=tp-1");
    expect(calls[0]!.auth).toBe("Bearer tok");
    expect(await fetchTaxFeed({ taxpayerRef: "x" }, {} as NodeJS.ProcessEnv)).toBeNull();
    setTaxFetch(null);
  });
});

describe("provenance document vault", () => {
  it("hashes, signs, and checks estate papers against the plan", () => {
    const h = sha256Hex(Buffer.from("last will and testament"));
    expect(h).toHaveLength(64);
    const sig = signProvenance({ documentId: 9, sha256: h, uploadedAt: "2026-09-06T12:00:00.000Z", uploadedBy: "Sam" }, "k");
    expect(sig).toBe(signProvenance({ documentId: 9, sha256: h, uploadedAt: "2026-09-06T12:00:00.000Z", uploadedBy: "Sam" }, "k"));
    expect(sig).not.toBe(signProvenance({ documentId: 9, sha256: h, uploadedAt: "2026-09-06T12:00:00.000Z", uploadedBy: "Someone else" }, "k"));
    const issues = checkEstateConsistency({ documentType: "will", beneficiaries: ["Alex Doe", "Sam Doe Jr"], executor: "Alex Doe", effectiveDate: "2012-01-01" }, { spouseName: "Dana Doe", maritalStatus: "Married", dependents: 2, hasWill: false, guardianNamed: "No", heirsText: "Everything to Dana, then the kids" });
    expect(issues.map((i) => i.severity)).toContain("conflict");
    expect(issues.find((i) => i.severity === "conflict")!.message).toContain("Dana Doe");
    expect(issues.some((i) => i.message.includes("no guardian"))).toBe(true);
    expect(issues.some((i) => i.message.includes("ten years old"))).toBe(true);
    expect(issues.some((i) => i.message.includes("Beneficiaries not mentioned") && i.message.includes("Alex Doe"))).toBe(true);
    expect(checkEstateConsistency({ documentType: "will", beneficiaries: ["Dana Doe"] }, { spouseName: "Dana Doe", maritalStatus: "Married", dependents: 0 })).toEqual([{ severity: "info", message: "Consistent with the plan as recorded." }]);
    expect(checkEstateConsistency(null, {})[0]!.severity).toBe("info");
  });
});

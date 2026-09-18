// ============================================================
// CONTROLS — tRPC for the authority layer: consent grants, agent mandates,
// the transaction firewall and its queue, automations and their runs, the
// signed advice log, outside-source suggestions (health, tax), the
// versioned tax rules, and document provenance. A signed-in client acts on
// their own chain; an advisor acts on a client's chain in their workspace.
// ============================================================
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import { getClientById, getWorkspaceByOwnerId } from "./db";
import { listEvents } from "./ledgerDb";
import { recordAssessmentChange, recordEvent } from "./ledger";
import { getFactFinderForUser, saveFactFinderForUser } from "./factFinderDb";
import { ledgerSubject } from "@shared/planLedger";
import { CONSENT_SCOPE_LIST, GRANTEE_TYPES, describeGrant } from "@shared/consent";
import { MANDATE_ACTIONS, describeMandate } from "@shared/mandates";
import { MOVEMENT_ACTIONS, type FirewallPolicy } from "@shared/firewall";
import { TAX_RULE_VERSIONS, computeTaxPicture, currentRules, diffRuleSets, filingKeyFromLabel, recomputeUnderRules, rulesByVersion, type TaxFacts } from "@shared/taxRules";
import { emptyFactFinder, type ClientFactFinder, type FieldValue } from "@shared/clientFactFinder";
import { consentFor, decideSuggestion, deleteAutomation, getSuggestion, insertAutomation, insertConsent, insertMandate, insertSuggestions, listAutomations, listConsents, listMandates, listProvenance, listRuns, listSuggestions, provenanceForDocument, revokeConsent, revokeMandate, updateAutomation, type Ids } from "./controlsDb";
import { approveMovement, currentPolicy, executeMovement, movementQueue, proposeMovement, rejectMovement, reverseMovement, setPolicy } from "./firewall";
import { reverseRun } from "./automations";
import { verifyAdvice } from "./advice";
import { FHIR_GRANTEE, importFromFhir } from "./healthBridge";
import { fhirConfigured } from "./_core/fhir";
import { TAX_FEED_GRANTEE, fetchTaxFeed, parseTranscriptText, taxFeedConfigured, taxRecordToSuggestions } from "./taxFeed";
import { signProvenance } from "./provenance";

const scope = z.object({ clientId: z.number().int().positive().optional(), leadId: z.number().int().positive().optional() });
type Ctx = { user: { id: number; openId: string; role: string; name?: string | null; email?: string | null } };

/** The chain the caller may act on: their own, or a client/lead they own. */
async function resolve(ctx: Ctx, input: { clientId?: number; leadId?: number }): Promise<{ subject: string; ids: Ids; own: boolean }> {
  if (input.clientId) {
    const ws = await getWorkspaceByOwnerId(ctx.user.id);
    if (!ws) throw new TRPCError({ code: "NOT_FOUND" });
    const client = await getClientById(input.clientId, ws.id);
    if (!client) throw new TRPCError({ code: "NOT_FOUND" });
    return { subject: ledgerSubject({ clientId: client.id }), ids: { clientId: client.id, workspaceId: ws.id }, own: false };
  }
  if (input.leadId) {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    return { subject: ledgerSubject({ leadId: input.leadId }), ids: { leadId: input.leadId }, own: false };
  }
  return { subject: ledgerSubject({ userId: ctx.user.id }), ids: { userId: ctx.user.id }, own: true };
}

const who = (ctx: Ctx) => ctx.user.name ?? ctx.user.email ?? null;

// ─── Consent ─────────────────────────────────────────────────────────────────
const consentRouter = router({
  list: protectedProcedure.input(scope.default({})).query(async ({ ctx, input }) => {
    const { subject } = await resolve(ctx, input);
    return { scopes: CONSENT_SCOPE_LIST, grants: await listConsents(subject) };
  }),
  grant: protectedProcedure
    .input(scope.extend({ granteeType: z.enum(GRANTEE_TYPES), granteeId: z.string().min(1).max(120), granteeLabel: z.string().max(200).optional(), scopes: z.array(z.string().max(40)).min(1).max(20), purpose: z.string().max(500).optional(), expiresAt: z.string().datetime().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { subject, ids } = await resolve(ctx, input);
      const bad = input.scopes.filter((s) => !CONSENT_SCOPE_LIST.includes(s as never) && !s.endsWith(":*") && s !== "*");
      if (bad.length) throw new TRPCError({ code: "BAD_REQUEST", message: `Unknown scopes: ${bad.join(", ")}` });
      const startsAt = new Date();
      const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
      const id = await insertConsent({ subject, userId: ids.userId ?? null, clientId: ids.clientId ?? null, leadId: ids.leadId ?? null, workspaceId: ids.workspaceId ?? null, granteeType: input.granteeType, granteeId: input.granteeId, granteeLabel: input.granteeLabel ?? null, scopes: input.scopes, purpose: input.purpose ?? null, startsAt, expiresAt, grantedByUserId: ctx.user.id, grantedByName: who(ctx) });
      const g = { id: id ?? 0, granteeType: input.granteeType, granteeId: input.granteeId, granteeLabel: input.granteeLabel ?? null, scopes: input.scopes, purpose: input.purpose ?? null, startsAt, expiresAt, revokedAt: null };
      await recordEvent({ kind: "consent", source: "client", key: `consent.${id ?? "new"}.grant`, label: input.granteeLabel ?? input.granteeId, value: { grantId: id, granteeType: input.granteeType, granteeId: input.granteeId, scopes: input.scopes, purpose: input.purpose ?? null, expiresAt: expiresAt?.toISOString() ?? null }, summary: `Consent granted: ${describeGrant(g)}`, actorName: who(ctx), ...ids });
      return { id, description: describeGrant(g) };
    }),
  revoke: protectedProcedure.input(scope.extend({ id: z.number().int().positive(), reason: z.string().max(500).default("revoked by the client") })).mutation(async ({ ctx, input }) => {
    const { subject, ids } = await resolve(ctx, input);
    const g = await revokeConsent(input.id, subject, input.reason);
    if (!g) throw new TRPCError({ code: "NOT_FOUND", message: "Grant not found or already revoked" });
    await recordEvent({ kind: "consent", source: "client", key: `consent.${g.id}.revoke`, label: g.granteeLabel ?? g.granteeId, value: { grantId: g.id, granteeId: g.granteeId, scopes: g.scopes, reason: input.reason }, summary: `Consent revoked for ${g.granteeLabel ?? g.granteeId} (${g.scopes.join(", ")}): ${input.reason}`, actorName: who(ctx), ...ids });
    return { revoked: true };
  }),
  check: protectedProcedure.input(scope.extend({ granteeId: z.string().min(1).max(120), scope: z.string().min(1).max(40) })).query(async ({ ctx, input }) => {
    const { subject } = await resolve(ctx, input);
    const c = await consentFor(subject, input.granteeId, input.scope);
    return { allowed: c.allowed, reason: c.reason, grantId: c.grant?.id ?? null };
  }),
});

// ─── Mandates ────────────────────────────────────────────────────────────────
const mandatesRouter = router({
  list: protectedProcedure.input(scope.default({})).query(async ({ ctx, input }) => {
    const { subject } = await resolve(ctx, input);
    return { actions: MANDATE_ACTIONS, mandates: await listMandates(subject) };
  }),
  grant: protectedProcedure
    .input(scope.extend({ agentId: z.string().min(1).max(80), label: z.string().max(200).optional(), actions: z.array(z.enum(MANDATE_ACTIONS)).min(1), accounts: z.array(z.string().max(200)).max(20).default([]), purpose: z.string().max(500).optional(), ceilingCents: z.number().int().nonnegative().optional(), periodCeilingCents: z.number().int().nonnegative().optional(), periodDays: z.number().int().min(1).max(366).optional(), approvalAboveCents: z.number().int().nonnegative().optional(), expiresAt: z.string().datetime().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { subject, ids } = await resolve(ctx, input);
      const startsAt = new Date();
      const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
      const id = await insertMandate({ subject, userId: ids.userId ?? null, clientId: ids.clientId ?? null, workspaceId: ids.workspaceId ?? null, agentId: input.agentId, label: input.label ?? null, actions: input.actions, accounts: input.accounts, purpose: input.purpose ?? null, ceilingCents: input.ceilingCents ?? null, periodCeilingCents: input.periodCeilingCents ?? null, periodDays: input.periodDays ?? (input.periodCeilingCents != null ? 30 : null), approvalAboveCents: input.approvalAboveCents ?? null, startsAt, expiresAt, grantedByUserId: ctx.user.id, grantedByName: who(ctx) });
      const m = { id: id ?? 0, agentId: input.agentId, label: input.label ?? null, actions: input.actions, accounts: input.accounts, purpose: input.purpose ?? null, ceilingCents: input.ceilingCents ?? null, periodCeilingCents: input.periodCeilingCents ?? null, periodDays: input.periodDays ?? null, approvalAboveCents: input.approvalAboveCents ?? null, startsAt, expiresAt, revokedAt: null };
      await recordEvent({ kind: "mandate", source: "client", key: `mandate.${id ?? "new"}.grant`, label: input.label ?? input.agentId, value: { mandateId: id, agentId: input.agentId, actions: input.actions, accounts: input.accounts, ceilingCents: input.ceilingCents ?? null, periodCeilingCents: input.periodCeilingCents ?? null, periodDays: input.periodDays ?? null, approvalAboveCents: input.approvalAboveCents ?? null, expiresAt: expiresAt?.toISOString() ?? null }, summary: `Mandate granted: ${describeMandate(m)}`, actorName: who(ctx), ...ids });
      return { id, description: describeMandate(m) };
    }),
  revoke: protectedProcedure.input(scope.extend({ id: z.number().int().positive(), reason: z.string().max(500).default("revoked by the client") })).mutation(async ({ ctx, input }) => {
    const { subject, ids } = await resolve(ctx, input);
    const m = await revokeMandate(input.id, subject, input.reason);
    if (!m) throw new TRPCError({ code: "NOT_FOUND", message: "Mandate not found or already revoked" });
    await recordEvent({ kind: "mandate", source: "client", key: `mandate.${m.id}.revoke`, label: m.label ?? m.agentId, value: { mandateId: m.id, agentId: m.agentId, reason: input.reason }, summary: `Mandate revoked for ${m.label ?? m.agentId}: ${input.reason}`, actorName: who(ctx), ...ids });
    return { revoked: true };
  }),
});

// ─── Firewall ────────────────────────────────────────────────────────────────
const policySchema = z.object({ requireMandate: z.boolean().optional(), holdAboveCents: z.number().int().nonnegative().nullable().optional(), blockedCounterparties: z.array(z.string().max(200)).max(100).optional(), conflictParties: z.array(z.string().max(200)).max(100).optional(), newPayeeCoolingHours: z.number().int().min(0).max(720).optional(), reserveFloorCents: z.number().int().nonnegative().nullable().optional(), reversalWindowHours: z.number().int().min(0).max(720).optional() });

const firewallRouter = router({
  policy: protectedProcedure.input(scope.default({})).query(async ({ ctx, input }) => {
    const { subject } = await resolve(ctx, input);
    return currentPolicy(subject);
  }),
  setPolicy: protectedProcedure.input(scope.extend({ policy: policySchema })).mutation(async ({ ctx, input }) => {
    const { ids } = await resolve(ctx, input);
    return setPolicy(ids, input.policy as Partial<FirewallPolicy>, who(ctx));
  }),
  propose: protectedProcedure
    .input(scope.extend({ action: z.enum(MOVEMENT_ACTIONS), amountCents: z.number().int().positive(), fromAccount: z.string().max(200).optional(), toAccount: z.string().max(200).optional(), counterparty: z.string().max(200).optional(), purpose: z.string().min(1).max(500), asAgent: z.string().max(80).optional(), availableBalanceCents: z.number().int().nonnegative().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { ids } = await resolve(ctx, input);
      return proposeMovement(ids, { proposedBy: input.asAgent ?? `user:${ctx.user.id}`, proposedByName: input.asAgent ? `${input.asAgent} (test by ${who(ctx) ?? "user"})` : who(ctx), isAgent: Boolean(input.asAgent), agentId: input.asAgent ?? null, action: input.action, amountCents: input.amountCents, fromAccount: input.fromAccount ?? null, toAccount: input.toAccount ?? null, counterparty: input.counterparty ?? null, purpose: input.purpose, availableBalanceCents: input.availableBalanceCents ?? null });
    }),
  queue: protectedProcedure.input(scope.extend({ limit: z.number().int().min(1).max(500).default(100) }).default({ limit: 100 })).query(async ({ ctx, input }) => {
    const { ids } = await resolve(ctx, input);
    return movementQueue(ids, input.limit);
  }),
  approve: protectedProcedure.input(scope.extend({ id: z.number().int().positive(), executeNow: z.boolean().default(true) })).mutation(async ({ ctx, input }) => {
    const { ids } = await resolve(ctx, input);
    return approveMovement(ids, input.id, ctx.user.id, who(ctx), input.executeNow);
  }),
  reject: protectedProcedure.input(scope.extend({ id: z.number().int().positive(), reason: z.string().min(1).max(500) })).mutation(async ({ ctx, input }) => {
    const { ids } = await resolve(ctx, input);
    return rejectMovement(ids, input.id, who(ctx), input.reason);
  }),
  execute: protectedProcedure.input(scope.extend({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const { ids } = await resolve(ctx, input);
    return executeMovement(ids, input.id, who(ctx));
  }),
  reverse: protectedProcedure.input(scope.extend({ id: z.number().int().positive(), reason: z.string().min(1).max(500) })).mutation(async ({ ctx, input }) => {
    const { ids } = await resolve(ctx, input);
    return reverseMovement(ids, input.id, who(ctx), input.reason);
  }),
});

// ─── Automations ─────────────────────────────────────────────────────────────
const automationsRouter = router({
  list: protectedProcedure.input(scope.default({})).query(async ({ ctx, input }) => {
    const { subject } = await resolve(ctx, input);
    const [automations, runs] = await Promise.all([listAutomations(subject), listRuns(subject, 100)]);
    return { automations, runs };
  }),
  create: protectedProcedure
    .input(scope.extend({ name: z.string().min(1).max(200), triggerKind: z.string().min(1).max(20), triggerKey: z.string().max(120).optional(), triggerSource: z.string().max(20).optional(), actionType: z.enum(["notify", "propose_movement", "append_status"]), actionParams: z.record(z.string(), z.unknown()) }))
    .mutation(async ({ ctx, input }) => {
      const { subject, ids } = await resolve(ctx, input);
      const id = await insertAutomation({ subject, userId: ids.userId ?? null, clientId: ids.clientId ?? null, leadId: ids.leadId ?? null, workspaceId: ids.workspaceId ?? null, name: input.name, enabled: true, triggerKind: input.triggerKind, triggerKey: input.triggerKey ?? null, triggerSource: input.triggerSource ?? null, actionType: input.actionType, actionParams: input.actionParams, createdByUserId: ctx.user.id });
      await recordEvent({ kind: "automation", source: "client", key: `automation.${id ?? "new"}.created`, label: input.name, value: { automationId: id, trigger: { kind: input.triggerKind, key: input.triggerKey ?? null, source: input.triggerSource ?? null }, action: input.actionType }, summary: `Automation "${input.name}" created: on ${input.triggerKind}${input.triggerKey ? ` ${input.triggerKey}` : ""} → ${input.actionType.replace("_", " ")}`, actorName: who(ctx), ...ids });
      return { id };
    }),
  toggle: protectedProcedure.input(scope.extend({ id: z.number().int().positive(), enabled: z.boolean() })).mutation(async ({ ctx, input }) => {
    const { subject } = await resolve(ctx, input);
    return { ok: await updateAutomation(input.id, subject, { enabled: input.enabled }) };
  }),
  remove: protectedProcedure.input(scope.extend({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const { subject } = await resolve(ctx, input);
    return { ok: await deleteAutomation(input.id, subject) };
  }),
  reverseRun: protectedProcedure.input(scope.extend({ runId: z.number().int().positive(), reason: z.string().min(1).max(500) })).mutation(async ({ ctx, input }) => {
    const { ids } = await resolve(ctx, input);
    return reverseRun(ids, input.runId, who(ctx), input.reason);
  }),
});

// ─── Advice log ──────────────────────────────────────────────────────────────
const adviceRouter = router({
  log: protectedProcedure.input(scope.extend({ limit: z.number().int().min(1).max(200).default(50) }).default({ limit: 50 })).query(async ({ ctx, input }) => {
    const { subject } = await resolve(ctx, input);
    const events = await listEvents(subject, { kinds: ["advice"], limit: input.limit });
    return events.map((e) => {
      const v = e.value as { payload?: { question: string; answer: string; via: string; voices: string[]; dataUsed: Array<{ key: string }>; rulesVersion: string; assumptions: string[]; disclaimers: string[]; at: string }; keyId?: string } | null;
      const check = verifyAdvice(e.value);
      return { id: e.id, seq: e.seq, occurredAt: e.occurredAt, summary: e.summary, verified: check.ok, verification: check.reason, keyId: v?.keyId ?? null, question: v?.payload?.question ?? "", answer: v?.payload?.answer ?? "", via: v?.payload?.via ?? "", voices: v?.payload?.voices ?? [], factsUsed: (v?.payload?.dataUsed ?? []).map((d) => d.key), rulesVersion: v?.payload?.rulesVersion ?? "", assumptions: v?.payload?.assumptions ?? [], disclaimers: v?.payload?.disclaimers ?? [] };
    });
  }),
});

// ─── Suggestions (health bridge, tax feed, transcripts) ──────────────────────
function setField(data: ClientFactFinder, key: string, value: FieldValue): ClientFactFinder {
  const next: ClientFactFinder = { version: 1, sections: { ...data.sections }, lists: { ...data.lists } };
  const dot = key.indexOf(".");
  if (dot < 0) return next;
  const sid = key.slice(0, dot), fk = key.slice(dot + 1);
  next.sections[sid] = { ...(next.sections[sid] ?? {}), [fk]: value };
  return next;
}

const suggestionsRouter = router({
  list: protectedProcedure.input(scope.extend({ status: z.enum(["pending", "accepted", "rejected"]).optional() }).default({})).query(async ({ ctx, input }) => {
    const { subject } = await resolve(ctx, input);
    return { suggestions: await listSuggestions(subject, { status: input.status }), sources: { fhir: fhirConfigured(), taxFeed: taxFeedConfigured() } };
  }),
  decide: protectedProcedure.input(scope.extend({ id: z.number().int().positive(), accept: z.boolean() })).mutation(async ({ ctx, input }) => {
    const { subject, ids, own } = await resolve(ctx, input);
    const s = await getSuggestion(input.id, subject);
    if (!s) throw new TRPCError({ code: "NOT_FOUND" });
    if (s.status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: `already ${s.status}` });
    if (input.accept) {
      if (!own) throw new TRPCError({ code: "BAD_REQUEST", message: "Only the client can accept a value into their own assessment" });
      const stored = await getFactFinderForUser(ctx.user.id);
      const prev = stored?.data ?? emptyFactFinder();
      const next = setField(prev, s.key, s.value as FieldValue);
      await saveFactFinderForUser(ctx.user.id, next);
      await recordAssessmentChange({ userId: ctx.user.id }, prev, next, "aggregator", `${s.source} (confirmed by ${who(ctx) ?? "client"})`);
    }
    await decideSuggestion(input.id, subject, input.accept ? "accepted" : "rejected", ctx.user.id);
    await recordEvent({ kind: "status", source: "client", key: `suggestion.${s.id}.${input.accept ? "accepted" : "rejected"}`, label: s.label ?? s.key, value: { suggestionId: s.id, key: s.key, source: s.source }, summary: `${input.accept ? "Accepted" : "Rejected"} ${s.source} suggestion for ${s.label ?? s.key}`, actorName: who(ctx), ...ids });
    return { ok: true };
  }),
  importHealth: protectedProcedure.input(scope.extend({ patientId: z.string().min(1).max(120), sinceDays: z.number().int().min(30).max(1095).default(365) })).mutation(async ({ ctx, input }) => {
    const { subject, ids } = await resolve(ctx, input);
    if (!fhirConfigured()) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Health data source not configured (FHIR_BASE_URL, FHIR_ACCESS_TOKEN)" });
    for (const sc of ["health:coverage", "health:claims"]) {
      const c = await consentFor(subject, FHIR_GRANTEE, sc);
      if (!c.allowed) throw new TRPCError({ code: "FORBIDDEN", message: `Consent required: ${c.reason}` });
    }
    const since = new Date(Date.now() - input.sinceDays * 86_400_000).toISOString();
    const r = await importFromFhir(input.patientId, since);
    const stored = ids.userId ? await getFactFinderForUser(ids.userId) : null;
    const n = await insertSuggestions(r.suggestions.map((s) => ({ subject, userId: ids.userId ?? null, clientId: ids.clientId ?? null, workspaceId: ids.workspaceId ?? null, key: s.key, label: s.label, value: s.value, currentValue: currentOf(stored?.data, s.key), source: s.source, sourceRef: s.sourceRef, confidence: s.confidence, note: s.note ?? null, status: "pending" as const })));
    await recordEvent({ kind: "status", source: "aggregator", key: "import.fhir", label: "Health data bridge", value: { read: r.read, suggested: n }, summary: `Health data read with consent: ${r.read.coverage} coverage, ${r.read.eob} claims records → ${n} suggested value${n === 1 ? "" : "s"} to confirm`, ...ids });
    return { suggested: n, read: r.read };
  }),
  importTaxFeed: protectedProcedure.input(scope.extend({ taxpayerRef: z.string().min(1).max(120), taxYear: z.number().int().min(2015).max(2100).optional() })).mutation(async ({ ctx, input }) => {
    const { subject, ids } = await resolve(ctx, input);
    if (!taxFeedConfigured()) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Tax feed not configured (TAX_FEED_URL)" });
    const c = await consentFor(subject, TAX_FEED_GRANTEE, "tax:transcripts");
    if (!c.allowed) throw new TRPCError({ code: "FORBIDDEN", message: `Consent required: ${c.reason}` });
    const rec = await fetchTaxFeed({ taxpayerRef: input.taxpayerRef, taxYear: input.taxYear });
    if (!rec) return { suggested: 0, taxYear: null };
    const stored = ids.userId ? await getFactFinderForUser(ids.userId) : null;
    const n = await insertSuggestions(taxRecordToSuggestions(rec).map((s) => ({ subject, userId: ids.userId ?? null, clientId: ids.clientId ?? null, workspaceId: ids.workspaceId ?? null, key: s.key, label: s.label, value: s.value, currentValue: currentOf(stored?.data, s.key), source: s.source, sourceRef: s.sourceRef, confidence: s.confidence, note: null, status: "pending" as const })));
    await recordEvent({ kind: "status", source: "aggregator", key: "import.tax-feed", label: "Tax fact feed", value: { taxYear: rec.taxYear, suggested: n }, summary: `Tax record for ${rec.taxYear} read with consent → ${n} suggested value${n === 1 ? "" : "s"} to confirm`, ...ids });
    return { suggested: n, taxYear: rec.taxYear };
  }),
  importTranscript: protectedProcedure.input(scope.extend({ text: z.string().min(20).max(200_000) })).mutation(async ({ ctx, input }) => {
    const { subject, ids } = await resolve(ctx, input);
    const rec = parseTranscriptText(input.text);
    if (!rec) throw new TRPCError({ code: "BAD_REQUEST", message: "That does not look like an IRS transcript (no tax year or labelled amounts found)" });
    const stored = ids.userId ? await getFactFinderForUser(ids.userId) : null;
    const n = await insertSuggestions(taxRecordToSuggestions(rec).map((s) => ({ subject, userId: ids.userId ?? null, clientId: ids.clientId ?? null, workspaceId: ids.workspaceId ?? null, key: s.key, label: s.label, value: s.value, currentValue: currentOf(stored?.data, s.key), source: s.source, sourceRef: s.sourceRef, confidence: s.confidence, note: null, status: "pending" as const })));
    await recordEvent({ kind: "status", source: "client", key: "import.transcript", label: "IRS transcript", value: { taxYear: rec.taxYear, suggested: n }, summary: `IRS transcript for ${rec.taxYear} parsed → ${n} suggested value${n === 1 ? "" : "s"} to confirm`, actorName: who(ctx), ...ids });
    return { suggested: n, taxYear: rec.taxYear };
  }),
});

function currentOf(data: ClientFactFinder | null | undefined, key: string): FieldValue | null {
  if (!data) return null;
  const dot = key.indexOf(".");
  if (dot < 0) return null;
  return data.sections?.[key.slice(0, dot)]?.[key.slice(dot + 1)] ?? null;
}

// ─── Tax rules ───────────────────────────────────────────────────────────────
function taxFactsFrom(data: ClientFactFinder | null | undefined): TaxFacts | null {
  const t = data?.sections?.taxes ?? {}, h = data?.sections?.household ?? {};
  const agi = typeof t.adjustedGrossIncome === "number" ? t.adjustedGrossIncome : null;
  if (agi == null) return null;
  const age = (dob: unknown) => { const d = typeof dob === "string" ? new Date(dob) : null; return d && !Number.isNaN(d.getTime()) ? Math.floor((Date.now() - d.getTime()) / (365.25 * 86_400_000)) : null; };
  return { filing: filingKeyFromLabel(t.filingStatus), agi, saltPaid: typeof t.stateTaxPaid === "number" ? t.stateTaxPaid : null, itemizedOtherThanSalt: (typeof t.mortgageInterestDeduction === "number" ? t.mortgageInterestDeduction : 0) + (typeof t.charitableGiving === "number" ? t.charitableGiving : 0), age: age(h.dateOfBirth), spouseAge: age(h.spouseDateOfBirth) };
}

const rulesRouter = router({
  versions: protectedProcedure.query(() => ({ current: currentRules().version, versions: TAX_RULE_VERSIONS.map((r) => ({ version: r.version, taxYear: r.taxYear, source: r.source, effectiveFrom: r.effectiveFrom, standardDeduction: r.standardDeduction, retirement: r.retirement, estateBasicExclusion: r.estateBasicExclusion, salt: r.salt, brackets: r.brackets })) })),
  diff: protectedProcedure.input(z.object({ from: z.string(), to: z.string() })).query(({ input }) => {
    const a = rulesByVersion(input.from), b = rulesByVersion(input.to);
    if (!a || !b) throw new TRPCError({ code: "NOT_FOUND", message: "unknown rule version" });
    return diffRuleSets(a, b);
  }),
  picture: protectedProcedure.input(z.object({ version: z.string().optional() }).default({})).query(async ({ ctx, input }) => {
    const stored = await getFactFinderForUser(ctx.user.id);
    const facts = taxFactsFrom(stored?.data);
    const rules = input.version ? rulesByVersion(input.version) : currentRules();
    if (!rules) throw new TRPCError({ code: "NOT_FOUND", message: "unknown rule version" });
    return { facts, picture: facts ? computeTaxPicture(facts, rules) : null, rulesVersion: rules.version };
  }),
  recompute: protectedProcedure.input(z.object({ from: z.string(), to: z.string() })).mutation(async ({ ctx, input }) => {
    const a = rulesByVersion(input.from), b = rulesByVersion(input.to);
    if (!a || !b) throw new TRPCError({ code: "NOT_FOUND", message: "unknown rule version" });
    const stored = await getFactFinderForUser(ctx.user.id);
    const facts = taxFactsFrom(stored?.data);
    if (!facts) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The assessment needs adjusted gross income before a recompute" });
    const r = recomputeUnderRules(facts, a, b);
    await recordEvent({ kind: "rules", source: "system", key: `rules.${b.version}`, label: "Tax rules recompute", value: { from: a.version, to: b.version, federalTaxDelta: r.federalTaxDelta, deductionDelta: r.deductionDelta, changesCount: r.changes.length, changes: r.changes.slice(0, 60) }, summary: r.summary, actorName: who(ctx), userId: ctx.user.id });
    return r;
  }),
});

// ─── Provenance ──────────────────────────────────────────────────────────────
const provenanceRouter = router({
  list: protectedProcedure.input(z.object({ clientId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const { ids } = await resolve(ctx, input);
    return listProvenance(ids.clientId!, ids.workspaceId!);
  }),
  verify: protectedProcedure.input(z.object({ clientId: z.number().int().positive(), documentId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    await resolve(ctx, input);
    const p = await provenanceForDocument(input.documentId);
    if (!p) return { found: false as const };
    const expected = signProvenance({ documentId: p.documentId, sha256: p.sha256, uploadedAt: p.signedAt.toISOString(), uploadedBy: p.uploadedByName ?? "" });
    return { found: true as const, verified: expected === p.signature, sha256: p.sha256, version: p.version, signedAt: p.signedAt, consistency: p.consistency };
  }),
});

export const controlsRouter = router({
  consent: consentRouter,
  mandates: mandatesRouter,
  firewall: firewallRouter,
  automations: automationsRouter,
  advice: adviceRouter,
  suggestions: suggestionsRouter,
  rules: rulesRouter,
  provenance: provenanceRouter,
});

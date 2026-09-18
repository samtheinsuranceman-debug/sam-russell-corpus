/**
 * RECIN External Data Adapters (Sprint D)
 *
 * The plug-in surface for every external channel in blueprint §7, and the
 * guardrails that sit in front of them.
 *
 * ── Why this file exists in this shape ──────────────────────────────────────
 *
 * The blueprint is explicit that external data is gated (§7 phases, §13.7,
 * §13.8) and that the system must never present unsourced values as market
 * quotes. So the architecture is built first and the providers plug in behind
 * it, rather than the reverse. Three rules are enforced here rather than
 * documented and hoped for:
 *
 *  1. **An adapter that cannot reach its provider returns `unavailable`.**
 *     It never returns a plausible-looking number. A fabricated rate sheet or
 *     AVM value is worse than a missing one, because a missing one is visible.
 *
 *  2. **Every returned value carries provenance** — provider, the date the
 *     SOURCE says it was true, the date we fetched it, confidence, and
 *     whether it is illustrative, indicative or quoted. That record is what
 *     the source ledger persists.
 *
 *  3. **Consent is checked before the call, not after.** Channels that touch
 *     private financial data declare a consent scope, and the registry refuses
 *     to dispatch without a live grant.
 *
 * No adapter here invents data. Until credentials and a consent record exist,
 * every one of them reports `unavailable` with a reason the UI can display.
 */

import type { SourceLedger, SourceType } from "./realEstateSourceLedger";

/* ═══ Channels ═════════════════════════════════════════════════════════════ */

/** Rollout phase from blueprint §7. Phase 1 is lowest risk. */
export type ChannelPhase = 1 | 2 | 3 | 4;

export type ChannelId =
  // Phase 1 — minimum viable, low risk
  | "property_schedule"
  | "public_assessment"
  | "rate_index"
  | "economic_data"
  | "accounting_feed"
  | "bank_liability_feed"
  | "document_ingestion"
  // Phase 2 — underwriting quality
  | "market_rent"
  | "valuation_avm"
  | "climate_catastrophe"
  | "insurance_quotes"
  | "title_lien_ucc"
  | "commercial_lease_analytics"
  // Phase 3 — controlled lender / capital markets
  | "lender_product_matrix"
  | "credit_soft_pull"
  | "capital_markets_spreads"
  | "alternative_capital_terms"
  // Phase 4 — business development
  | "crm"
  | "calendar_comms"
  | "product_analytics"
  | "client_feedback";

export interface ChannelSpec {
  id: ChannelId;
  phase: ChannelPhase;
  label: string;
  /** What this is allowed to be used for. */
  permittedUse: string;
  /** What it must never be used for. Enforced by review, stated here. */
  prohibitedUse?: string;
  /** Consent scope required before any fetch. Undefined = no consent needed. */
  consentScope?: string;
  /** How the value enters the ledger. */
  sourceType: SourceType;
  /** Days after which a value from this channel is stale. */
  stalenessDays: number;
  /** Default confidence for values from this channel. */
  baseConfidence: number;
  /** Env var holding the credential, when one is required. */
  credentialEnvVar?: string;
}

/**
 * The channel registry. Ordered by phase so a rollout can enable them in the
 * blueprint's sequence rather than all at once.
 */
export const CHANNELS: Record<ChannelId, ChannelSpec> = {
  /* ── Phase 1 ── */
  property_schedule: {
    id: "property_schedule",
    phase: 1,
    label: "User / advisor property schedule",
    permittedUse: "Baseline property graph: values, rents, expenses, liens, ownership.",
    sourceType: "advisor",
    stalenessDays: 180,
    baseConfidence: 0.8,
  },
  public_assessment: {
    id: "public_assessment",
    phase: 1,
    label: "Public property / tax assessment",
    permittedUse: "Validate user-supplied values and property facts.",
    prohibitedUse: "Never substitute for an appraisal.",
    sourceType: "api",
    consentScope: "public_records",
    stalenessDays: 365,
    baseConfidence: 0.6,
    credentialEnvVar: "RECIN_ASSESSMENT_API_KEY",
  },
  rate_index: {
    id: "rate_index",
    phase: 1,
    label: "Rate index (Prime, SOFR, Treasury)",
    permittedUse: "Rate stress and financing comparison.",
    prohibitedUse: "Never presented as a lender's offered rate.",
    sourceType: "api",
    stalenessDays: 7,
    baseConfidence: 0.95,
    credentialEnvVar: "RECIN_RATE_API_KEY",
  },
  economic_data: {
    id: "economic_data",
    phase: 1,
    label: "Economic series (inflation, labor, curve, housing)",
    permittedUse: "Macro stress framework.",
    sourceType: "api",
    stalenessDays: 45,
    baseConfidence: 0.9,
    credentialEnvVar: "RECIN_ECON_API_KEY",
  },
  accounting_feed: {
    id: "accounting_feed",
    phase: 1,
    label: "Accounting feed (actual rents, costs, debt service)",
    permittedUse: "Replace pro forma with actual performance; reconcile monthly.",
    consentScope: "accounting_feed",
    sourceType: "api",
    stalenessDays: 45,
    baseConfidence: 0.95,
    credentialEnvVar: "RECIN_ACCOUNTING_API_KEY",
  },
  bank_liability_feed: {
    id: "bank_liability_feed",
    phase: 1,
    label: "Bank / credit / liability aggregation",
    permittedUse: "Liquidity, debt and reserve calculations. Read-only.",
    prohibitedUse: "Minimize raw PII retention; never pass account numbers to an LLM.",
    consentScope: "bank_aggregation",
    sourceType: "api",
    stalenessDays: 14,
    baseConfidence: 0.95,
    credentialEnvVar: "RECIN_AGGREGATION_API_KEY",
  },
  document_ingestion: {
    id: "document_ingestion",
    phase: 1,
    label: "Document ingestion (notes, appraisals, leases, statements)",
    permittedUse: "Source-backed extraction with human verification.",
    prohibitedUse: "Extracted values are provisional until a human verifies them.",
    consentScope: "document_upload",
    sourceType: "document",
    stalenessDays: 365,
    baseConfidence: 0.85,
  },

  /* ── Phase 2 ── */
  market_rent: {
    id: "market_rent",
    phase: 2,
    label: "Market rent comparables",
    permittedUse: "DSCR rent validation and downside cases.",
    consentScope: "market_data",
    sourceType: "api",
    stalenessDays: 90,
    baseConfidence: 0.75,
    credentialEnvVar: "RECIN_RENT_API_KEY",
  },
  valuation_avm: {
    id: "valuation_avm",
    phase: 2,
    label: "Automated valuation model",
    permittedUse: "Sensitivity analysis only.",
    prohibitedUse: "Never an appraisal replacement; always carry the confidence range.",
    consentScope: "market_data",
    sourceType: "api",
    stalenessDays: 90,
    baseConfidence: 0.65,
    credentialEnvVar: "RECIN_AVM_API_KEY",
  },
  climate_catastrophe: {
    id: "climate_catastrophe",
    phase: 2,
    label: "Flood / wildfire / wind / catastrophe risk",
    permittedUse: "Insurance cost and reserve stress.",
    sourceType: "api",
    stalenessDays: 365,
    baseConfidence: 0.8,
    credentialEnvVar: "RECIN_CLIMATE_API_KEY",
  },
  insurance_quotes: {
    id: "insurance_quotes",
    phase: 2,
    label: "Property insurance quotes and renewals",
    permittedUse: "Operating expense and loss reserve modelling.",
    consentScope: "insurance_data",
    sourceType: "api",
    stalenessDays: 180,
    baseConfidence: 0.85,
  },
  title_lien_ucc: {
    id: "title_lien_ucc",
    phase: 2,
    label: "Title / lien / UCC review",
    permittedUse: "Collateral and lien-priority validation.",
    consentScope: "title_search",
    sourceType: "document",
    stalenessDays: 90,
    baseConfidence: 0.95,
  },
  commercial_lease_analytics: {
    id: "commercial_lease_analytics",
    phase: 2,
    label: "Commercial lease and tenant analytics",
    permittedUse: "Tenant credit, rollover and occupancy for CMBS and commercial.",
    consentScope: "market_data",
    sourceType: "api",
    stalenessDays: 90,
    baseConfidence: 0.8,
    credentialEnvVar: "RECIN_CRE_API_KEY",
  },

  /* ── Phase 3 ── */
  lender_product_matrix: {
    id: "lender_product_matrix",
    phase: 3,
    label: "Lender / broker product matrix",
    permittedUse: "Eligibility SCREENING only.",
    prohibitedUse:
      "Never a promise to lend. Never an approval likelihood. Compensation and lender relationships must be disclosed.",
    sourceType: "api",
    stalenessDays: 30,
    baseConfidence: 0.7,
    credentialEnvVar: "RECIN_LENDER_MATRIX_KEY",
  },
  credit_soft_pull: {
    id: "credit_soft_pull",
    phase: 3,
    label: "Credit soft pull",
    permittedUse: "Qualification confidence and rate tier, with permission.",
    prohibitedUse:
      "Never used to infer protected characteristics; never used for discriminatory pricing or ranking.",
    consentScope: "credit_soft_pull",
    sourceType: "api",
    stalenessDays: 90,
    baseConfidence: 0.95,
    credentialEnvVar: "RECIN_CREDIT_API_KEY",
  },
  capital_markets_spreads: {
    id: "capital_markets_spreads",
    phase: 3,
    label: "Capital markets / CMBS spreads",
    permittedUse: "Commercial debt environment context.",
    prohibitedUse: "Context only — never quoted as an available rate.",
    sourceType: "api",
    stalenessDays: 14,
    baseConfidence: 0.85,
    credentialEnvVar: "RECIN_CAPMKTS_API_KEY",
  },
  alternative_capital_terms: {
    id: "alternative_capital_terms",
    phase: 3,
    label: "Mezzanine / preferred / bridge term indications",
    permittedUse: "Capital-stack comparison from manually ingested term sheets.",
    prohibitedUse: "Indications are not commitments.",
    consentScope: "term_sheet_ingestion",
    sourceType: "document",
    stalenessDays: 45,
    baseConfidence: 0.75,
  },

  /* ── Phase 4 ── */
  crm: {
    id: "crm",
    phase: 4,
    label: "CRM",
    permittedUse: "Workflow and prioritization.",
    prohibitedUse: "Never a suitability conclusion.",
    consentScope: "crm_access",
    sourceType: "api",
    stalenessDays: 30,
    baseConfidence: 0.8,
  },
  calendar_comms: {
    id: "calendar_comms",
    phase: 4,
    label: "Calendar / communications",
    permittedUse: "Follow-up automation from human-approved notes only.",
    consentScope: "calendar_access",
    sourceType: "api",
    stalenessDays: 30,
    baseConfidence: 0.8,
  },
  product_analytics: {
    id: "product_analytics",
    phase: 4,
    label: "Product analytics",
    permittedUse: "UX improvement and calibration.",
    prohibitedUse: "Never a financial recommendation input.",
    sourceType: "derived",
    stalenessDays: 30,
    baseConfidence: 0.7,
  },
  client_feedback: {
    id: "client_feedback",
    phase: 4,
    label: "Secure client feedback / realized outcomes",
    permittedUse: "Model monitoring, calibration and explanation improvement.",
    consentScope: "outcome_sharing",
    sourceType: "user",
    stalenessDays: 365,
    baseConfidence: 0.9,
  },
};

/* ═══ Adapter contract ═════════════════════════════════════════════════════ */

export interface Provenance {
  channel: ChannelId;
  provider: string;
  /** When the SOURCE says the value was true. */
  asOf?: string;
  retrievedAt: string;
  confidence: number;
  /** Illustrative until a live, credentialed source says otherwise. */
  status: "illustrative" | "indicative" | "quoted" | "observed";
}

export type AdapterResult<T> =
  | { available: true; value: T; provenance: Provenance }
  | {
      available: false;
      /** Machine-readable reason the UI can branch on. */
      reason:
        | "not_configured"
        | "no_consent"
        | "disabled"
        | "provider_error"
        | "not_implemented";
      detail: string;
      channel: ChannelId;
    };

export interface ProviderAdapter<TRequest, TResponse> {
  channel: ChannelId;
  providerName: string;
  /** True when credentials exist and the channel is enabled. */
  isConfigured(): boolean;
  fetch(request: TRequest, ctx: AdapterContext): Promise<AdapterResult<TResponse>>;
}

export interface AdapterContext {
  userId: number;
  householdId?: number;
  ledger?: SourceLedger;
  /** Overrides for testing; defaults to process.env. */
  env?: Record<string, string | undefined>;
}

/* ═══ Feature flags ════════════════════════════════════════════════════════ */

/**
 * Channels are OFF by default. Enabling one is a deliberate act that should
 * follow a security and consent review, not a side effect of deploying code.
 */
export function isChannelEnabled(
  channel: ChannelId,
  env: Record<string, string | undefined> = process.env,
): boolean {
  const flag = env[`RECIN_CHANNEL_${channel.toUpperCase()}`];
  return flag === "1" || flag === "true";
}

export function hasCredential(
  spec: ChannelSpec,
  env: Record<string, string | undefined> = process.env,
): boolean {
  if (!spec.credentialEnvVar) return true; // no credential required
  const v = env[spec.credentialEnvVar];
  return typeof v === "string" && v.length > 0;
}

/* ═══ Base adapter ═════════════════════════════════════════════════════════ */

/**
 * Every adapter inherits the same refusal path, so a new provider cannot
 * accidentally skip the flag, credential or consent checks by forgetting them.
 */
export abstract class BaseAdapter<TReq, TRes> implements ProviderAdapter<TReq, TRes> {
  abstract channel: ChannelId;
  abstract providerName: string;

  get spec(): ChannelSpec {
    return CHANNELS[this.channel];
  }

  isConfigured(env: Record<string, string | undefined> = process.env): boolean {
    return isChannelEnabled(this.channel, env) && hasCredential(this.spec, env);
  }

  /** Runs the gate. Returns null when the call may proceed. */
  protected async gate(ctx: AdapterContext): Promise<AdapterResult<TRes> | null> {
    const env = ctx.env ?? process.env;

    if (!isChannelEnabled(this.channel, env)) {
      return {
        available: false,
        reason: "disabled",
        detail: `Channel "${this.channel}" is not enabled. Set RECIN_CHANNEL_${this.channel.toUpperCase()}=1 after a security and consent review.`,
        channel: this.channel,
      };
    }
    if (!hasCredential(this.spec, env)) {
      return {
        available: false,
        reason: "not_configured",
        detail: `No credential present in ${this.spec.credentialEnvVar}. This adapter will not return a value without one — it does not fabricate data.`,
        channel: this.channel,
      };
    }
    if (this.spec.consentScope) {
      if (!ctx.ledger) {
        return {
          available: false,
          reason: "no_consent",
          detail: `Channel "${this.channel}" requires consent scope "${this.spec.consentScope}" and no source ledger was supplied to verify it.`,
          channel: this.channel,
        };
      }
      const ok = await ctx.ledger.hasConsent(ctx.userId, this.spec.consentScope);
      if (!ok) {
        return {
          available: false,
          reason: "no_consent",
          detail: `No live consent for "${this.spec.consentScope}". External data cannot be fetched without a recorded grant.`,
          channel: this.channel,
        };
      }
    }
    return null;
  }

  /** Helper for a successful fetch, stamping provenance consistently. */
  protected ok(
    value: TRes,
    opts: { asOf?: string; status?: Provenance["status"]; confidence?: number } = {},
  ): AdapterResult<TRes> {
    return {
      available: true,
      value,
      provenance: {
        channel: this.channel,
        provider: this.providerName,
        asOf: opts.asOf,
        retrievedAt: new Date().toISOString(),
        confidence: opts.confidence ?? this.spec.baseConfidence,
        status: opts.status ?? "observed",
      },
    };
  }

  protected unimplemented(): AdapterResult<TRes> {
    return {
      available: false,
      reason: "not_implemented",
      detail: `No provider is wired for "${this.channel}" yet. The contract is defined and the gate is enforced; implement fetch() against a real provider to activate it.`,
      channel: this.channel,
    };
  }

  abstract fetch(request: TRateReqPlaceholder, ctx: AdapterContext): Promise<AdapterResult<TRes>>;
}

/** Placeholder so the abstract signature stays generic without `any`. */
type TRateReqPlaceholder = never;

/* ═══ Concrete adapter shells ══════════════════════════════════════════════ */

export interface RateQuery {
  index: "prime" | "sofr" | "treasury_10y" | "treasury_5y";
}
export interface RateValue {
  index: string;
  rate: number;
  term?: string;
}

export class RateIndexAdapter extends BaseAdapter<RateQuery, RateValue> {
  channel: ChannelId = "rate_index";
  providerName = "unconfigured";

  async fetch(_request: never, ctx: AdapterContext): Promise<AdapterResult<RateValue>> {
    const blocked = await this.gate(ctx);
    if (blocked) return blocked;
    // A real implementation fetches, then returns this.ok(value, { asOf }).
    // It must NEVER return a remembered or estimated rate.
    return this.unimplemented();
  }
}

export interface AvmQuery {
  propertyId: string;
}
export interface AvmValue {
  estimate: number;
  low: number;
  high: number;
  confidenceScore: number;
}

export class ValuationAvmAdapter extends BaseAdapter<AvmQuery, AvmValue> {
  channel: ChannelId = "valuation_avm";
  providerName = "unconfigured";

  async fetch(_request: never, ctx: AdapterContext): Promise<AdapterResult<AvmValue>> {
    const blocked = await this.gate(ctx);
    if (blocked) return blocked;
    return this.unimplemented();
  }
}

export interface MarketRentQuery {
  propertyId: string;
  bedrooms?: number;
}
export interface MarketRentValue {
  medianRent: number;
  low: number;
  high: number;
  sampleSize: number;
}

export class MarketRentAdapter extends BaseAdapter<MarketRentQuery, MarketRentValue> {
  channel: ChannelId = "market_rent";
  providerName = "unconfigured";

  async fetch(_request: never, ctx: AdapterContext): Promise<AdapterResult<MarketRentValue>> {
    const blocked = await this.gate(ctx);
    if (blocked) return blocked;
    return this.unimplemented();
  }
}

export interface LenderMatrixQuery {
  category: string;
}
export interface LenderProgram {
  lender: string;
  category: string;
  maxLtv?: number;
  minDscr?: number;
  /** Always illustrative unless it came from a live, credentialed source. */
  status: "illustrative" | "indicative";
}

export class LenderMatrixAdapter extends BaseAdapter<LenderMatrixQuery, LenderProgram[]> {
  channel: ChannelId = "lender_product_matrix";
  providerName = "unconfigured";

  async fetch(_request: never, ctx: AdapterContext): Promise<AdapterResult<LenderProgram[]>> {
    const blocked = await this.gate(ctx);
    if (blocked) return blocked;
    return this.unimplemented();
  }
}

/* ═══ Registry ═════════════════════════════════════════════════════════════ */

const ADAPTERS = new Map<ChannelId, ProviderAdapter<never, unknown>>();

export function registerAdapter(adapter: ProviderAdapter<never, unknown>): void {
  ADAPTERS.set(adapter.channel, adapter);
}

export function getAdapter(channel: ChannelId): ProviderAdapter<never, unknown> | undefined {
  return ADAPTERS.get(channel);
}

// Register the shells so the status view reflects the real surface.
registerAdapter(new RateIndexAdapter());
registerAdapter(new ValuationAvmAdapter());
registerAdapter(new MarketRentAdapter());
registerAdapter(new LenderMatrixAdapter());

export interface ChannelStatus {
  channel: ChannelId;
  phase: ChannelPhase;
  label: string;
  enabled: boolean;
  credentialPresent: boolean;
  consentScope?: string;
  adapterRegistered: boolean;
  /** True only when everything needed to actually fetch is in place. */
  operational: boolean;
  permittedUse: string;
  prohibitedUse?: string;
}

/**
 * What is actually wired, by phase. This is what the Evidence Ledger screen
 * shows so an advisor can see at a glance which numbers could possibly be
 * live and which are entered by hand.
 */
export function channelStatus(
  env: Record<string, string | undefined> = process.env,
): ChannelStatus[] {
  return (Object.keys(CHANNELS) as ChannelId[])
    .map((id) => {
      const spec = CHANNELS[id];
      const enabled = isChannelEnabled(id, env);
      const credentialPresent = hasCredential(spec, env);
      const adapterRegistered = ADAPTERS.has(id);
      return {
        channel: id,
        phase: spec.phase,
        label: spec.label,
        enabled,
        credentialPresent,
        consentScope: spec.consentScope,
        adapterRegistered,
        operational: enabled && credentialPresent && adapterRegistered,
        permittedUse: spec.permittedUse,
        prohibitedUse: spec.prohibitedUse,
      };
    })
    .sort((a, b) => a.phase - b.phase || a.channel.localeCompare(b.channel));
}

/**
 * Dispatch a fetch through the registry, recording provenance in the ledger on
 * success. Unavailable results are returned, never thrown — a missing channel
 * is an expected state, not an error.
 */
export async function fetchThroughChannel<T>(
  channel: ChannelId,
  request: never,
  ctx: AdapterContext,
): Promise<AdapterResult<T>> {
  const adapter = ADAPTERS.get(channel);
  if (!adapter) {
    return {
      available: false,
      reason: "not_implemented",
      detail: `No adapter registered for channel "${channel}".`,
      channel,
    };
  }

  const result = (await adapter.fetch(request, ctx)) as AdapterResult<T>;

  if (result.available && ctx.ledger) {
    const spec = CHANNELS[channel];
    await ctx.ledger.record({
      userId: ctx.userId,
      householdId: ctx.householdId,
      sourceType: spec.sourceType,
      sourceName: `${spec.label} — ${result.provenance.provider}`,
      asOf: result.provenance.asOf,
      confidence: result.provenance.confidence,
      extraction: result.value,
      consentScope: spec.consentScope,
      sensitivity: spec.consentScope ? "restricted" : "confidential",
    });
  }

  return result;
}

/* ═══ Explicit exclusions (blueprint §7) ═══════════════════════════════════ */

/**
 * Practices that are out of scope regardless of demand, recorded in code so
 * they survive a change of maintainer.
 */
export const EXCLUDED_PRACTICES = [
  "Scraping or ingesting private financial data without consent.",
  "Using protected-class or sensitive personal data to determine eligibility, pricing, or strategy ranking.",
  "Opaque lender matching that hides compensation, lender relationship, or eligibility criteria.",
  "Approval-likelihood scoring without validated lender inputs, consent, compliance review, and clear disclosure.",
] as const;

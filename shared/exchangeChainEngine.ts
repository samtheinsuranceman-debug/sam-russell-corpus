/**
 * SISTER INVENTION SI-034: 1031 Exchange Chain Optimization Engine (1031COE)
 * Patent Reference: Integrates PAT-009 (Real Estate Recycling), PAT-005 (Tax Waterfall),
 * PAT-013 (Monte Carlo)
 *
 * Plans and monitors multi-property 1031 exchange sequences to maximize tax deferral
 * and eventual basis step-up at death. Three interlocking components:
 *
 *   MPSP — Multi-Property Sequence Planner: orders exchanges across 5-20 properties
 *          over 10-30 year horizons using property-specific appreciation and
 *          depreciation schedules.
 *   DCM  — Deadline Compliance Monitor: tracks the IRC § 1031(a)(3) 45-day
 *          identification and 180-day closing deadlines, raising contingency plans.
 *   BSUC — Basis Step-Up Coordinator: models the interaction between the exchange
 *          chain and the IRC § 1014 step-up at death, quantifying the gain that is
 *          permanently eliminated rather than merely deferred.
 *
 * Narrowed use case (per application): real estate investors with 5+ properties and
 * combined equity exceeding $5,000,000.
 */

// ─── Tax constants ────────────────────────────────────────────────────────────
/** IRC § 1250 unrecaptured depreciation is taxed at a flat 25% federal rate. */
export const DEPRECIATION_RECAPTURE_RATE = 0.25;
/** Net investment income tax, IRC § 1411. */
export const NIIT_RATE = 0.038;
/** IRC § 1031(a)(3)(A) — identification period. */
export const IDENTIFICATION_DAYS = 45;
/** IRC § 1031(a)(3)(B) — exchange (closing) period. */
export const EXCHANGE_DAYS = 180;
/** Residential rental recovery period, IRC § 168(c). */
export const RESIDENTIAL_RECOVERY_YEARS = 27.5;
/** Nonresidential real property recovery period, IRC § 168(c). */
export const COMMERCIAL_RECOVERY_YEARS = 39;

export type PropertyType = "residential" | "commercial";

export interface ExchangeProperty {
  id: string;
  label: string;
  type: PropertyType;
  /** Current fair market value. */
  marketValue: number;
  /** Original purchase price allocated to the whole property. */
  purchasePrice: number;
  /** Portion of purchase price allocated to land — land is not depreciable. */
  landAllocationPercent: number;
  /** Years the property has been held. Drives accumulated depreciation. */
  yearsHeld: number;
  /** Expected annual appreciation, as a decimal (0.04 = 4%). */
  appreciationRate: number;
  /** Outstanding mortgage. Relieved debt is boot if not replaced. */
  mortgageBalance: number;
  /** Capital improvements added to basis. */
  capitalImprovements?: number;
}

export interface ExchangeChainInput {
  properties: ExchangeProperty[];
  /** Long-term capital gains rate as a decimal (0.20 = 20%). */
  capitalGainsRate: number;
  /** Combined state income tax rate as a decimal. */
  stateRate: number;
  /** Whether the investor is subject to the § 1411 net investment income tax. */
  subjectToNIIT: boolean;
  /** Planning horizon in years (10-30 per the narrowed use case). */
  horizonYears: number;
  /** Investor's current age — used to place the § 1014 step-up event. */
  currentAge: number;
  /** Life expectancy age at which the final property passes through the estate. */
  lifeExpectancyAge: number;
}

export interface PropertyTaxProfile {
  id: string;
  label: string;
  marketValue: number;
  /** Purchase price + improvements − accumulated depreciation. */
  adjustedBasis: number;
  accumulatedDepreciation: number;
  /** Market value − adjusted basis. */
  totalGain: number;
  /** Portion of the gain taxed at 25% under § 1250. */
  recaptureGain: number;
  /** Portion of the gain taxed at long-term capital gains rates. */
  appreciationGain: number;
  /** Tax owed if sold outright today. */
  taxIfSoldToday: number;
  equity: number;
}

export interface ChainStep {
  sequence: number;
  /** Year of the planning horizon in which this exchange occurs. */
  year: number;
  relinquishedId: string;
  relinquishedLabel: string;
  /** Projected value of the relinquished property at exchange time. */
  relinquishedValue: number;
  /** Gain deferred by this individual exchange. */
  gainDeferred: number;
  /** Tax that would have been due absent the exchange. */
  taxDeferred: number;
  /** Running total of deferred gain carried forward in the substituted basis. */
  cumulativeGainDeferred: number;
  cumulativeTaxDeferred: number;
  /** Substituted basis in the replacement property, per IRC § 1031(d). */
  substitutedBasis: number;
  identifyBy: string;
  closeBy: string;
}

export type DeadlineStatus = "clear" | "approaching" | "critical" | "blown";

export interface DeadlineAlert {
  propertyId: string;
  propertyLabel: string;
  /** Which statutory window this alert concerns. */
  window: "identification" | "exchange";
  deadline: string;
  daysRemaining: number;
  status: DeadlineStatus;
  contingency: string;
}

export interface BasisStepUpResult {
  /** Age at which the final property is expected to pass through the estate. */
  stepUpAge: number;
  /** Value of the final property at the step-up event. */
  finalPropertyValue: number;
  /** Basis immediately before death — the substituted basis carried down the chain. */
  basisBeforeStepUp: number;
  /** Gain permanently eliminated by IRC § 1014. */
  gainEliminated: number;
  /** Tax permanently eliminated, never merely deferred. */
  taxPermanentlyEliminated: number;
  /** True when the chain is expected to reach the step-up within the horizon. */
  reachesStepUp: boolean;
}

export interface ExchangeChainResult {
  profiles: PropertyTaxProfile[];
  chain: ChainStep[];
  /** Total tax deferred by running the chain. */
  totalTaxDeferred: number;
  /** Tax due if every property were simply sold today instead. */
  taxIfAllSoldToday: number;
  /** Chain deferral vs. the same properties exchanged individually without chaining. */
  chainAdvantage: number;
  /** Emergent Capability 1 — chain deferral ÷ independent-exchange deferral. */
  compoundingMultiple: number;
  stepUp: BasisStepUpResult;
  deadlines: DeadlineAlert[];
  criticalFindings: string[];
  irsReferences: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function addDays(from: Date, days: number): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Straight-line depreciation under IRC § 168. Land is excluded, and accumulated
 * depreciation is capped at the depreciable basis — a property held past its
 * recovery period cannot depreciate below zero.
 */
export function accumulatedDepreciation(p: ExchangeProperty): number {
  const depreciableBasis = p.purchasePrice * (1 - p.landAllocationPercent);
  const recovery = p.type === "residential" ? RESIDENTIAL_RECOVERY_YEARS : COMMERCIAL_RECOVERY_YEARS;
  const annual = depreciableBasis / recovery;
  return Math.min(depreciableBasis, annual * Math.max(0, p.yearsHeld));
}

/**
 * Splits a property's gain into its two tax buckets and prices each one.
 *
 * Depreciation taken is recaptured at 25% under § 1250 before any remaining
 * appreciation is taxed at long-term capital gains rates. When a property has
 * fallen below its original cost the recapture bucket is limited to the total
 * gain — you cannot recapture more than you gained.
 */
export function profileProperty(p: ExchangeProperty, input: ExchangeChainInput): PropertyTaxProfile {
  const depreciation = accumulatedDepreciation(p);
  const adjustedBasis = p.purchasePrice + (p.capitalImprovements ?? 0) - depreciation;
  const totalGain = Math.max(0, p.marketValue - adjustedBasis);
  const recaptureGain = Math.min(depreciation, totalGain);
  const appreciationGain = Math.max(0, totalGain - recaptureGain);

  const ltcgRate = input.capitalGainsRate + input.stateRate + (input.subjectToNIIT ? NIIT_RATE : 0);
  const recaptureRate = DEPRECIATION_RECAPTURE_RATE + input.stateRate + (input.subjectToNIIT ? NIIT_RATE : 0);

  return {
    id: p.id,
    label: p.label,
    marketValue: round(p.marketValue),
    adjustedBasis: round(adjustedBasis),
    accumulatedDepreciation: round(depreciation),
    totalGain: round(totalGain),
    recaptureGain: round(recaptureGain),
    appreciationGain: round(appreciationGain),
    taxIfSoldToday: round(recaptureGain * recaptureRate + appreciationGain * ltcgRate),
    equity: round(p.marketValue - p.mortgageBalance),
  };
}

/**
 * MPSP — Multi-Property Sequence Planner.
 *
 * Exchanges are ordered by deferral efficiency: tax deferred per dollar of equity
 * tied up. Relinquishing the highest-efficiency property first puts the largest
 * deferred gain into the substituted basis earliest, where it then rides the rest
 * of the chain. The slowest-appreciating property goes first among ties, since the
 * fastest appreciator is worth more as the final held asset at step-up.
 */
function planSequence(
  properties: ExchangeProperty[],
  profiles: Map<string, PropertyTaxProfile>,
): ExchangeProperty[] {
  return [...properties].sort((a, b) => {
    const pa = profiles.get(a.id)!;
    const pb = profiles.get(b.id)!;
    const effA = pa.equity > 0 ? pa.taxIfSoldToday / pa.equity : 0;
    const effB = pb.equity > 0 ? pb.taxIfSoldToday / pb.equity : 0;
    if (Math.abs(effA - effB) > 1e-9) return effB - effA;
    return a.appreciationRate - b.appreciationRate;
  });
}

/**
 * DCM — Deadline Compliance Monitor.
 *
 * Given the closing date of a relinquished property, computes the § 1031(a)(3)
 * windows and classifies urgency. The statute allows no extensions, so a blown
 * identification window converts the whole exchange into a taxable sale.
 */
export function monitorDeadlines(
  relinquishedClosingDate: Date,
  propertyId: string,
  propertyLabel: string,
  asOf: Date = new Date(),
): DeadlineAlert[] {
  const identifyBy = addDays(relinquishedClosingDate, IDENTIFICATION_DAYS);
  const closeBy = addDays(relinquishedClosingDate, EXCHANGE_DAYS);
  const dayMs = 24 * 60 * 60 * 1000;

  const build = (window: "identification" | "exchange", deadline: Date): DeadlineAlert => {
    const daysRemaining = Math.ceil((deadline.getTime() - asOf.getTime()) / dayMs);
    const status: DeadlineStatus =
      daysRemaining < 0 ? "blown" : daysRemaining <= 10 ? "critical" : daysRemaining <= 25 ? "approaching" : "clear";
    const contingency =
      status === "blown"
        ? window === "identification"
          ? "Identification window closed — the exchange fails and the full gain is recognized in the year of the relinquished sale. Model the tax hit and consider an installment sale for the replacement."
          : "180-day window closed — exchange fails. Confirm whether the qualified intermediary still holds proceeds and plan for full gain recognition."
        : status === "critical"
          ? window === "identification"
            ? "Identify three candidate replacements under the 3-property rule immediately, or use the 200% rule if more are needed."
            : "Confirm financing and title on the identified replacement now; the 180-day window cannot be extended."
          : status === "approaching"
            ? window === "identification"
              ? "Shortlist replacements and open escrow on at least one candidate."
              : "Verify the closing schedule with the qualified intermediary."
            : "On track — no action required.";
    return { propertyId, propertyLabel, window, deadline: iso(deadline), daysRemaining, status, contingency };
  };

  return [build("identification", identifyBy), build("exchange", closeBy)];
}

/**
 * BSUC — Basis Step-Up Coordinator.
 *
 * The chain's entire deferred gain sits in the substituted basis of the final
 * property. If that property is held until death, IRC § 1014 resets basis to fair
 * market value and the deferred gain is erased rather than merely postponed.
 */
function coordinateStepUp(
  finalProperty: ExchangeProperty,
  cumulativeGainDeferred: number,
  input: ExchangeChainInput,
): BasisStepUpResult {
  const yearsToStepUp = input.lifeExpectancyAge - input.currentAge;
  const reachesStepUp = yearsToStepUp > 0 && yearsToStepUp <= input.horizonYears;
  const growthYears = Math.max(0, yearsToStepUp);
  const finalValue = finalProperty.marketValue * Math.pow(1 + finalProperty.appreciationRate, growthYears);

  const profile = profileProperty(finalProperty, input);
  // Basis carried into the final property is reduced by every gain rolled forward.
  const basisBeforeStepUp = Math.max(0, profile.adjustedBasis - cumulativeGainDeferred);
  const gainEliminated = Math.max(0, finalValue - basisBeforeStepUp);

  const ltcgRate = input.capitalGainsRate + input.stateRate + (input.subjectToNIIT ? NIIT_RATE : 0);
  const recaptureRate = DEPRECIATION_RECAPTURE_RATE + input.stateRate + (input.subjectToNIIT ? NIIT_RATE : 0);
  const recapturePortion = Math.min(profile.accumulatedDepreciation, gainEliminated);
  const appreciationPortion = Math.max(0, gainEliminated - recapturePortion);

  return {
    stepUpAge: input.lifeExpectancyAge,
    finalPropertyValue: round(finalValue),
    basisBeforeStepUp: round(basisBeforeStepUp),
    gainEliminated: round(gainEliminated),
    taxPermanentlyEliminated: round(recapturePortion * recaptureRate + appreciationPortion * ltcgRate),
    reachesStepUp,
  };
}

/**
 * Run the full 1031 exchange chain analysis.
 *
 * Returns the per-property tax profiles, the planned exchange sequence with running
 * deferral, the § 1014 step-up outcome, and live deadline alerts for the first
 * exchange in the chain.
 */
export function optimizeExchangeChain(
  input: ExchangeChainInput,
  asOf: Date = new Date(),
): ExchangeChainResult {
  const criticalFindings: string[] = [];

  if (input.properties.length === 0) {
    throw new Error("At least one property is required to plan an exchange chain.");
  }

  const profiles = input.properties.map(p => profileProperty(p, input));
  const profileById = new Map(profiles.map(p => [p.id, p]));

  const totalEquity = profiles.reduce((s, p) => s + p.equity, 0);
  if (input.properties.length < 5 || totalEquity < 5_000_000) {
    criticalFindings.push(
      `Portfolio is below the profile this engine is calibrated for (5+ properties, $5M+ equity). ` +
        `Current: ${input.properties.length} properties, $${Math.round(totalEquity).toLocaleString()} equity. ` +
        `Chain compounding is weaker at this scale.`,
    );
  }

  // The final property is held to death, so everything but the last is exchanged.
  const ordered = planSequence(input.properties, profileById);
  const toExchange = ordered.slice(0, -1);
  const finalProperty = ordered[ordered.length - 1];

  // Spread the exchanges evenly across the horizon, leaving room to hold the last.
  const spacing = toExchange.length > 0 ? Math.max(1, Math.floor(input.horizonYears / (toExchange.length + 1))) : 0;

  let cumulativeGainDeferred = 0;
  let cumulativeTaxDeferred = 0;
  const chain: ChainStep[] = toExchange.map((p, i) => {
    const year = (i + 1) * spacing;
    const profile = profileById.get(p.id)!;
    const projectedValue = p.marketValue * Math.pow(1 + p.appreciationRate, year);

    // Gain grows with the property; basis does not.
    const gainAtExchange = Math.max(0, projectedValue - profile.adjustedBasis);
    const recapture = Math.min(profile.accumulatedDepreciation, gainAtExchange);
    const appreciation = Math.max(0, gainAtExchange - recapture);
    const ltcgRate = input.capitalGainsRate + input.stateRate + (input.subjectToNIIT ? NIIT_RATE : 0);
    const recaptureRate = DEPRECIATION_RECAPTURE_RATE + input.stateRate + (input.subjectToNIIT ? NIIT_RATE : 0);
    const taxDeferred = recapture * recaptureRate + appreciation * ltcgRate;

    cumulativeGainDeferred += gainAtExchange;
    cumulativeTaxDeferred += taxDeferred;

    // IRC § 1031(d): basis in the replacement equals its cost less the deferred gain.
    const substitutedBasis = Math.max(0, projectedValue - cumulativeGainDeferred);

    const closingDate = new Date(asOf);
    closingDate.setFullYear(closingDate.getFullYear() + year);

    if (p.mortgageBalance > 0) {
      const replacementDebtNeeded = p.mortgageBalance;
      criticalFindings.push(
        `${p.label}: $${Math.round(replacementDebtNeeded).toLocaleString()} of debt relief must be replaced with ` +
          `equal or greater debt on the replacement property, or the shortfall is mortgage boot and is taxable.`,
      );
    }

    return {
      sequence: i + 1,
      year,
      relinquishedId: p.id,
      relinquishedLabel: p.label,
      relinquishedValue: round(projectedValue),
      gainDeferred: round(gainAtExchange),
      taxDeferred: round(taxDeferred),
      cumulativeGainDeferred: round(cumulativeGainDeferred),
      cumulativeTaxDeferred: round(cumulativeTaxDeferred),
      substitutedBasis: round(substitutedBasis),
      identifyBy: iso(addDays(closingDate, IDENTIFICATION_DAYS)),
      closeBy: iso(addDays(closingDate, EXCHANGE_DAYS)),
    };
  });

  const stepUp = coordinateStepUp(finalProperty, cumulativeGainDeferred, input);

  // Emergent Capability 1 — chain compounding. Independent exchanges each defer only
  // their own gain at today's value; the chain carries every prior gain forward and
  // defers it again at each subsequent, appreciated exchange.
  const independentDeferral = toExchange.reduce((s, p) => s + (profileById.get(p.id)?.taxIfSoldToday ?? 0), 0);
  const compoundingMultiple = independentDeferral > 0 ? cumulativeTaxDeferred / independentDeferral : 0;

  if (!stepUp.reachesStepUp) {
    criticalFindings.push(
      `The chain does not reach the § 1014 step-up inside the ${input.horizonYears}-year horizon. ` +
        `Deferred gain of $${Math.round(cumulativeGainDeferred).toLocaleString()} remains deferred, not eliminated.`,
    );
  } else {
    criticalFindings.push(
      `Holding ${finalProperty.label} until age ${input.lifeExpectancyAge} permanently eliminates ` +
        `$${Math.round(stepUp.taxPermanentlyEliminated).toLocaleString()} of tax under IRC § 1014 — ` +
        `the deferred gain is erased, not postponed.`,
    );
  }

  return {
    profiles,
    chain,
    totalTaxDeferred: round(cumulativeTaxDeferred),
    taxIfAllSoldToday: round(profiles.reduce((s, p) => s + p.taxIfSoldToday, 0)),
    chainAdvantage: round(cumulativeTaxDeferred - independentDeferral),
    compoundingMultiple: Math.round(compoundingMultiple * 100) / 100,
    stepUp,
    deadlines:
      chain.length > 0
        ? monitorDeadlines(
            (() => {
              const d = new Date(asOf);
              d.setFullYear(d.getFullYear() + chain[0].year);
              return d;
            })(),
            chain[0].relinquishedId,
            chain[0].relinquishedLabel,
            asOf,
          )
        : [],
    criticalFindings,
    irsReferences: [
      "IRC § 1031 — Exchange of real property held for productive use or investment",
      "IRC § 1031(a)(3) — 45-day identification and 180-day exchange periods",
      "IRC § 1031(d) — Basis of property acquired in a like-kind exchange",
      "IRC § 1014 — Basis of property acquired from a decedent (step-up at death)",
      "IRC § 1250 — Gain from dispositions of certain depreciable realty (25% recapture)",
      "IRC § 1411 — Net investment income tax",
      "Treas. Reg. § 1.1031(k)-1 — Deferred exchange rules and identification requirements",
    ],
  };
}

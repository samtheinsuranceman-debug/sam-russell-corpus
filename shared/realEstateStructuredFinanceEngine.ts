// ─── Structured Finance Engine (Sprint B) ───────────────────────────────────
// CMBS flexibility cost, and mezzanine / preferred-equity control asymmetry.
//
// Both exist because the cheapest capital is frequently the worst capital, and
// the reason never shows up in the rate:
//
//  · A 10-year fixed CMBS loan can beat every alternative on coupon and still
//    be the wrong answer if the client expects to sell, refinance, transfer
//    ownership, redevelop, or add subordinate capital. Defeasance, lockout,
//    servicer consent and transfer restrictions are a real, quantifiable cost
//    of changing your mind. `CMBS_FLEXIBILITY_COST` puts a number on it.
//
//  · Mezzanine debt and preferred equity are frequently pitched as
//    interchangeable "gap capital". They are not. Mezzanine is DEBT secured by
//    a pledge of the ownership interests — enforced by UCC foreclosure, which
//    can transfer the entity in weeks. Preferred equity is an OWNERSHIP
//    interest whose remedies live in the operating agreement: consent rights,
//    manager removal, forced sale. The economics can look identical while the
//    control outcomes are nothing alike, so this engine scores economics and
//    CONTROL separately and refuses to rank on return alone.
//
// Tax treatment is an ASSUMPTION requiring CPA confirmation, never an output:
// mezzanine interest may be deductible subject to the business-interest
// limitation and to whether the instrument is respected as debt; preferred
// distributions are generally not deductible merely because they are paid.

import type {
  CmbsFlexibility,
  ControlRisk,
  PrepaymentSchedule,
  TaxFlag,
} from "./realEstateCapitalTypes";

const round4 = (n: number) => Math.round(n * 10000) / 10000;
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/* ═══ CMBS ═════════════════════════════════════════════════════════════════ */

export type CashManagementMode = "none" | "springing" | "hard";
export type TransferRestriction = "none" | "consent_required" | "prohibited";

export interface CmbsTerms {
  /** Months during which prepayment is barred outright. */
  lockoutMonths: number;
  prepayment: PrepaymentSchedule;
  termMonths: number;
  /** How long the client actually expects to hold. The whole score turns on
   *  the gap between this and the loan's constraints. */
  expectedHoldMonths: number;
  requiresSpe: boolean;
  requiresIndependentManager: boolean;
  cashManagement: CashManagementMode;
  transferRestrictions: TransferRestriction;
  additionalDebtPermitted: boolean;
  /** Reserves the lender escrows: taxes, insurance, replacement, TI/LC, etc. */
  reserveRequirements: string[];
  /** Largest tenant's share of rent, 0..1. */
  tenantConcentrationPct?: number;
  /** Share of leases rolling during the loan term, 0..1. */
  leaseRolloverPctDuringTerm?: number;
  /** Carveouts to the nonrecourse provision, verbatim from the loan documents. */
  nonrecourseCarveouts: string[];
  /** Whether assumption by a buyer is permitted, and at what friction. */
  assumable: boolean;
}

/**
 * Flexibility cost, 0..1. Higher means more expensive to change course.
 *
 * The dominant driver is deliberately the **hold gap** — a borrower who plans
 * to exit in 3 years on a 10-year lockout is buying a very different product
 * than the rate sheet suggests.
 */
export function scoreCmbsFlexibility(terms: CmbsTerms): CmbsFlexibility {
  const drivers: string[] = [];
  let score = 0;

  // ── Hold gap: does the plan end before the loan lets you out? ──
  const exitBlockedMonths = Math.max(terms.lockoutMonths, 0);
  if (terms.expectedHoldMonths < exitBlockedMonths) {
    score += 0.3;
    drivers.push(
      `Expected hold of ${terms.expectedHoldMonths} months ends inside a ${exitBlockedMonths}-month lockout`,
    );
  } else if (terms.expectedHoldMonths < terms.termMonths) {
    // Exiting before maturity but outside lockout — costs a penalty, not a veto.
    const earlyBy = terms.termMonths - terms.expectedHoldMonths;
    const proportion = clamp01(earlyBy / Math.max(1, terms.termMonths));
    score += 0.18 * proportion;
    drivers.push(
      `Planned exit ${earlyBy} months before maturity triggers the prepayment provision`,
    );
  }

  // ── Prepayment mechanism ──
  switch (terms.prepayment.kind) {
    case "defeasance":
      score += 0.22;
      drivers.push(
        "Defeasance: the loan cannot simply be repaid — it must be substituted with securities, at a cost that rises as rates fall, plus advisory and accounting fees",
      );
      break;
    case "yield_maintenance":
      score += 0.2;
      drivers.push(
        "Yield maintenance: the penalty is rate-path dependent and can be very large in a falling-rate environment",
      );
      break;
    case "lockout":
      score += 0.18;
      drivers.push("Hard lockout bars prepayment outright for part of the term");
      break;
    case "step_down":
      score += 0.08;
      drivers.push("Step-down prepayment — priced, predictable, and declining");
      break;
    case "flat_pct":
      score += 0.06;
      drivers.push("Flat prepayment penalty");
      break;
    case "none":
      break;
  }

  // ── Operating and governance friction ──
  if (terms.cashManagement === "hard") {
    score += 0.12;
    drivers.push("Hard cash management: rent is swept to a lender-controlled account from day one");
  } else if (terms.cashManagement === "springing") {
    score += 0.05;
    drivers.push("Springing cash management activates on a trigger event");
  }

  if (terms.transferRestrictions === "prohibited") {
    score += 0.12;
    drivers.push("Ownership transfers prohibited — blocks estate, entity and succession moves");
  } else if (terms.transferRestrictions === "consent_required") {
    score += 0.06;
    drivers.push("Transfers require servicer consent, which is slow and not guaranteed");
  }

  if (!terms.additionalDebtPermitted) {
    score += 0.06;
    drivers.push("Subordinate debt prohibited — no mezzanine or preferred later without consent");
  }
  if (!terms.assumable) {
    score += 0.05;
    drivers.push("Not assumable: a buyer cannot take the loan, narrowing the exit market");
  }
  if (terms.requiresSpe) {
    drivers.push("SPE covenants constrain how the entity may operate and what else it may own");
    score += 0.03;
  }
  if (terms.requiresIndependentManager) {
    score += 0.03;
    drivers.push("Independent manager required — a third party holds a vote on bankruptcy");
  }
  if (terms.reserveRequirements.length >= 3) {
    score += 0.04;
    drivers.push(
      `${terms.reserveRequirements.length} escrowed reserves (${terms.reserveRequirements.join(", ")}) reduce distributable cash`,
    );
  }

  // ── Underwriting quality of the collateral ──
  if ((terms.tenantConcentrationPct ?? 0) > 0.3) {
    score += 0.06;
    drivers.push(
      `Tenant concentration of ${Math.round((terms.tenantConcentrationPct ?? 0) * 100)}% — one departure moves the whole DSCR`,
    );
  }
  if ((terms.leaseRolloverPctDuringTerm ?? 0) > 0.4) {
    score += 0.05;
    drivers.push(
      `${Math.round((terms.leaseRolloverPctDuringTerm ?? 0) * 100)}% of leases roll during the term`,
    );
  }

  return {
    lockoutMonths: terms.lockoutMonths,
    prepaymentKind: terms.prepayment.kind,
    flexibilityCost: round4(clamp01(score)),
    expectedHoldMonths: terms.expectedHoldMonths,
    drivers,
  };
}

/**
 * Nonrecourse is conditional, not absolute. The carveouts are where personal
 * liability lives, and the loan documents control — this classifies what was
 * supplied rather than asserting what a given loan says.
 */
export function classifyCarveouts(carveouts: string[]): {
  standard: string[];
  springingRecourse: string[];
  unusual: string[];
} {
  // "Springing" carveouts convert the whole loan to full recourse rather than
  // creating liability only for the loss caused — a categorically bigger risk.
  const SPRINGING = [
    "bankruptcy",
    "insolvency",
    "voluntary petition",
    "prohibited transfer",
    "subordinate debt",
    "unauthorized",
    "spe",
    "single purpose",
  ];
  const STANDARD = [
    "fraud",
    "misrepresentation",
    "waste",
    "misappropriation",
    "misapplication",
    "environmental",
    "condemnation",
    "insurance proceeds",
    "security deposit",
  ];

  const standard: string[] = [];
  const springingRecourse: string[] = [];
  const unusual: string[] = [];

  for (const c of carveouts) {
    const lower = c.toLowerCase();
    if (SPRINGING.some((k) => lower.includes(k))) springingRecourse.push(c);
    else if (STANDARD.some((k) => lower.includes(k))) standard.push(c);
    else unusual.push(c);
  }
  return { standard, springingRecourse, unusual };
}

/* ═══ Mezzanine vs preferred equity ════════════════════════════════════════ */

export type SubordinateInstrument = "mezzanine" | "preferred_equity";
export type AccrualKind = "current_pay" | "accrual" | "hybrid";
export type ConsentRight = "sale" | "refinance" | "budget" | "capex" | "leasing" | "distributions";

export interface SubordinateCapitalTerms {
  instrument: SubordinateInstrument;
  amount: number;
  /** Interest (mezzanine) or preferred return (preferred equity). */
  rate: number;
  accrualKind: AccrualKind;
  /** Portion paid currently when hybrid. */
  currentPayRate?: number;
  termMonths: number;
  /** Fees taken at close, as a fraction of the amount. */
  originationFeePct?: number;
  /** Exit fee as a fraction of the amount. */
  exitFeePct?: number;
  /** Equity kicker / upside participation, 0..1 of profit. */
  upsideParticipationPct?: number;

  /* ── Mezzanine-specific ── */
  /** Secured by a pledge of the ownership interests, enforced under UCC Art. 9. */
  uccEquityPledge?: boolean;
  /** Does the intercreditor agreement give the senior lender cure rights? */
  intercreditorCureRights?: boolean;
  /** Standstill period before the mezz lender may foreclose. */
  standstillMonths?: number;

  /* ── Preferred-equity-specific ── */
  canRemoveManager?: boolean;
  canForceSale?: boolean;
  /** Months after which redemption can be compelled. */
  forcedRedemptionMonths?: number;

  /** Decisions the subordinate provider can block. */
  consentRightsOver: ConsentRight[];
}

/**
 * Control asymmetry, 0..1. Higher means more control ceded relative to the
 * capital provided.
 *
 * The asymmetry that matters is not "can they take the property" — it is how
 * FAST, and on whose say-so. A UCC pledge foreclosure can move the entity in
 * weeks; an operating-agreement remedy usually cannot.
 */
export function scoreControlAsymmetry(terms: SubordinateCapitalTerms): ControlRisk {
  const triggers: string[] = [];
  let score = 0;

  const canBlockSale = terms.consentRightsOver.includes("sale") || !!terms.canForceSale;
  const canBlockRefinance = terms.consentRightsOver.includes("refinance");
  const canReplaceManagement = !!terms.canRemoveManager;
  const canForceRedemption =
    !!terms.canForceSale || terms.forcedRedemptionMonths !== undefined;

  if (terms.instrument === "mezzanine") {
    if (terms.uccEquityPledge) {
      score += 0.35;
      triggers.push(
        "UCC pledge of the ownership interests: on default the mezzanine lender can foreclose on the EQUITY and take the entity — a materially faster path than a mortgage foreclosure, and it takes the property with it",
      );
    }
    if (terms.standstillMonths !== undefined && terms.standstillMonths < 3) {
      score += 0.12;
      triggers.push(
        `Standstill of only ${terms.standstillMonths} month(s) before enforcement can begin`,
      );
    }
    if (terms.intercreditorCureRights === false) {
      score += 0.08;
      triggers.push("No senior cure rights in the intercreditor agreement");
    }
    // A fixed maturity is itself a control risk: it is a hard date.
    score += 0.1;
    triggers.push(
      `Fixed maturity in ${terms.termMonths} months creates a hard date the sponsor must meet regardless of conditions`,
    );
  } else {
    if (canReplaceManagement) {
      score += 0.28;
      triggers.push(
        "Preferred holder can remove the manager — operational control transfers without any change in title",
      );
    }
    if (terms.canForceSale) {
      score += 0.25;
      triggers.push("Preferred holder can force a sale of the asset");
    }
    if (terms.forcedRedemptionMonths !== undefined) {
      score += 0.12;
      triggers.push(
        `Redemption can be compelled after ${terms.forcedRedemptionMonths} months, which functions like a maturity`,
      );
    }
  }

  // Consent rights apply to both instruments.
  const weights: Record<ConsentRight, number> = {
    sale: 0.08,
    refinance: 0.08,
    budget: 0.04,
    capex: 0.04,
    leasing: 0.04,
    distributions: 0.06,
  };
  for (const right of terms.consentRightsOver) {
    score += weights[right] ?? 0.03;
    triggers.push(`Consent right over ${right.replace(/_/g, " ")}`);
  }

  if ((terms.upsideParticipationPct ?? 0) > 0.2) {
    score += 0.06;
    triggers.push(
      `Upside participation of ${Math.round((terms.upsideParticipationPct ?? 0) * 100)}% on top of the stated return`,
    );
  }

  return {
    instrument: terms.instrument,
    canBlockSale,
    canBlockRefinance,
    canReplaceManagement,
    canForceRedemption,
    controlAsymmetryScore: round4(clamp01(score)),
    triggers,
  };
}

/**
 * All-in annualized cost of subordinate capital, including fees and accrual.
 *
 * Quoted rates on this paper are close to meaningless on their own: an
 * accruing 12% with 2 points in, 1 point out and a 20% kicker is not a 12%
 * instrument. This returns what the money actually costs over the hold.
 */
export function allInSubordinateCost(
  terms: SubordinateCapitalTerms,
  holdMonths: number,
  projectedProfit = 0,
): {
  totalCost: number;
  annualizedRate: number;
  components: { label: string; amount: number }[];
} {
  const years = Math.max(holdMonths, 1) / 12;
  const components: { label: string; amount: number }[] = [];

  const origination = terms.amount * (terms.originationFeePct ?? 0);
  if (origination > 0) components.push({ label: "Origination fee", amount: origination });

  const exitFee = terms.amount * (terms.exitFeePct ?? 0);
  if (exitFee > 0) components.push({ label: "Exit fee", amount: exitFee });

  // Accruing balances compound; current-pay does not.
  let returnCost: number;
  if (terms.accrualKind === "current_pay") {
    returnCost = terms.amount * terms.rate * years;
  } else if (terms.accrualKind === "accrual") {
    returnCost = terms.amount * (Math.pow(1 + terms.rate, years) - 1);
  } else {
    const current = terms.currentPayRate ?? terms.rate / 2;
    const accruing = Math.max(0, terms.rate - current);
    returnCost =
      terms.amount * current * years +
      terms.amount * (Math.pow(1 + accruing, years) - 1);
  }
  components.push({
    label: terms.instrument === "mezzanine" ? "Interest" : "Preferred return",
    amount: returnCost,
  });

  const kicker = Math.max(0, projectedProfit) * (terms.upsideParticipationPct ?? 0);
  if (kicker > 0) components.push({ label: "Upside participation", amount: kicker });

  const totalCost = components.reduce((s, c) => s + c.amount, 0);
  // Annualized as a simple rate on the principal over the hold.
  const annualizedRate = terms.amount > 0 ? totalCost / terms.amount / years : 0;

  return {
    totalCost: Math.round(totalCost * 100) / 100,
    annualizedRate: round4(annualizedRate),
    components: components.map((c) => ({
      label: c.label,
      amount: Math.round(c.amount * 100) / 100,
    })),
  };
}

/**
 * Tax flags for subordinate capital. These are ASSUMPTIONS requiring CPA
 * confirmation — the engine never concludes that anything is deductible.
 */
export function subordinateTaxFlags(terms: SubordinateCapitalTerms): TaxFlag[] {
  if (terms.instrument === "mezzanine") {
    return [
      {
        code: "BUSINESS_INTEREST_LIMITATION_MAY_APPLY",
        message:
          "Mezzanine interest may be deductible, but only if the instrument is respected as debt rather than recharacterized as equity, and only subject to the business-interest limitation. Neither is automatic.",
        requiresCpaReview: true,
      },
      {
        code: "ENTITY_CHARACTERIZATION_REVIEW",
        message:
          "A pledge of ownership interests has entity-level consequences on enforcement. Structure review required before closing.",
        requiresCpaReview: true,
      },
    ];
  }
  return [
    {
      code: "PREFERRED_DISTRIBUTIONS_NOT_DEDUCTIBLE",
      message:
        "Preferred distributions are generally NOT deductible at the entity level merely because they are paid. Partnership structures can have special rules — a guaranteed payment, for example, is treated differently again. Do not model an interest deduction here without CPA confirmation.",
      requiresCpaReview: true,
    },
    {
      code: "ENTITY_CHARACTERIZATION_REVIEW",
      message:
        "Tax allocations, and whether the instrument is respected as equity at all, depend on the operating agreement. Structural review required.",
      requiresCpaReview: true,
    },
  ];
}

/**
 * Side-by-side comparison of two subordinate proposals.
 * Deliberately returns BOTH dimensions and refuses to collapse them into a
 * single winner: the cheaper instrument is frequently the one that cedes more
 * control, and that trade is the client's to make, not the model's.
 */
export function compareSubordinateCapital(
  options: SubordinateCapitalTerms[],
  holdMonths: number,
  projectedProfit = 0,
): {
  instrument: SubordinateInstrument;
  annualizedCost: number;
  totalCost: number;
  controlAsymmetryScore: number;
  cheapest: boolean;
  leastControlCeded: boolean;
  note: string;
}[] {
  const scored = options.map((o) => {
    const cost = allInSubordinateCost(o, holdMonths, projectedProfit);
    const control = scoreControlAsymmetry(o);
    return {
      instrument: o.instrument,
      annualizedCost: cost.annualizedRate,
      totalCost: cost.totalCost,
      controlAsymmetryScore: control.controlAsymmetryScore,
      cheapest: false,
      leastControlCeded: false,
      note: "",
    };
  });

  if (scored.length === 0) return scored;

  const minCost = Math.min(...scored.map((s) => s.annualizedCost));
  const minControl = Math.min(...scored.map((s) => s.controlAsymmetryScore));
  for (const s of scored) {
    s.cheapest = s.annualizedCost === minCost;
    s.leastControlCeded = s.controlAsymmetryScore === minControl;
    s.note =
      s.cheapest && s.leastControlCeded
        ? "Cheapest and cedes least control."
        : s.cheapest
          ? "Cheapest, but not the least control ceded — price the difference before choosing."
          : s.leastControlCeded
            ? "Cedes least control, at a higher cost."
            : "Neither cheapest nor least control ceded.";
  }
  return scored;
}

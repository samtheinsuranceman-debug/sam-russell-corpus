// ============================================================
// PUBLIC LEAD TYPES — shared between the homepage fact-finder form,
// the server lead router, the illustrative strategy engine, and the
// database row shape.
//
// IMPORTANT: the numbers in LeadAdvisorFigures are ILLUSTRATIVE and
// ASSUMPTION-BASED, computed for the advisor's internal lead file only.
// They are never returned to the public visitor — the visitor sees only
// LeadTeaser (qualitative pillars, no figures).
// ============================================================

export type LiquidTaxability = "taxable" | "nontaxable" | "mixed" | "unknown";

/** Exactly the fields the homepage estimator / fact-finder collects. */
export type LeadFactFinder = {
  // Income & tax
  w2Income?: number; // the visitor's W-2 earnings
  estimatedTaxes?: number; // their estimated annual taxes
  spouseIncome?: number;
  spouseTaxes?: number;
  // Debt
  studentDebt?: number;
  studentDebtRate?: number; // annual %, e.g. 6.8
  // Home
  homeEquity?: number;
  mortgageBalance?: number; // optional; may be derived
  mortgageRate?: number; // annual %
  mortgageInterestOnlyMonthly?: number; // interest-only payment / month
  mortgageYearsRemaining?: number;
  // Tax-deferred vehicles (IRA / 401k / 403b / TSP)
  taxDeferredSelf?: number;
  taxDeferredSpouse?: number;
  // Liquid investments (brokerage / other accounts)
  liquidInvestments?: number;
  liquidTaxability?: LiquidTaxability;
  // Free-form goals / notes
  goals?: string;
};

/** ILLUSTRATIVE, assumption-based figures — advisor lead file ONLY. */
export type LeadAdvisorFigures = {
  rothConversionBase: number;
  illustrativeRothTaxValue: number;
  lifetimeInterestOnlyExposure: number;
  illustrativeInterestPotentiallySaved: number;
  acceleratedPayoffYearsLow: number;
  acceleratedPayoffYearsHigh: number;
  equityDeployedFirstStep: number;
  oilGasInvestmentAssumed: number;
  oilGasDeduction: number;
  illustrativeOilGasTaxOffset: number;
  blendedTaxRateUsed: number;
};

/** Qualitative, safe-to-show summary. No dollar figures. */
export type LeadTeaser = {
  headline: string;
  pillars: string[];
  note: string;
};

export type LeadAnalysis = {
  teaser: LeadTeaser; // safe to show the visitor
  advisorFigures: LeadAdvisorFigures; // internal only
  assumptions: string[]; // internal only
  disclaimer: string;
  rothCaveat: string; // the honest correction, kept with the figures
  computedAt: string; // ISO
};

export type LeadStatus = "new" | "contacted" | "qualified" | "client";

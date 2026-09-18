/**
 * Pricing a business advance, and disclosing it the way the law now requires.
 *
 * ## The number that matters is not the factor rate
 *
 * A "1.20 factor over six months" sounds like 20%. It is not. The borrower does not
 * hold the money for six months — they start paying it back the next business day and
 * the average balance outstanding is roughly half the principal. Solve for the rate
 * that actually equates the cash flows and a 1.20 over six months of daily remittance
 * is an APR in the seventies.
 *
 * That gap used to be where this industry lived. It is now the thing four states make
 * you print. California SB 1235 and New York's Commercial Finance Disclosure Law, both
 * of which reach merchant cash advances and factoring and not just loans, require the
 * amount funded, the finance charge, the ESTIMATED APR, total repayment, payment size
 * and frequency, and prepayment terms, disclosed BEFORE signature. Utah and Virginia
 * have their own versions. The CFPB has preliminarily determined TILA does not preempt
 * them, so they stand.
 *
 * `trueApr()` computes that number honestly by solving the internal rate of return on
 * the actual payment stream. `buildDisclosure()` will not assemble a disclosure with a
 * field missing. This is not a compliance tax bolted on the side — quoting a factor
 * rate without knowing the APR means not knowing what you are actually charging, which
 * is a pricing failure before it is ever a legal one.
 *
 * ## The hard line in this file
 *
 * `assertBusinessPurpose()` throws on any advance secured by a borrower's principal
 * dwelling. That is not a stylistic preference. A loan secured by a primary residence
 * is consumer credit under Regulation Z no matter who the borrower says they are; above
 * the HOEPA trigger it is a high-cost mortgage carrying ability-to-repay obligations,
 * counseling requirements, and assignee liability; and at rates in the high double or
 * triple digits it is criminally usurious in most states. Targeting owners already in
 * tax delinquency adds state equity-stripping and foreclosure-rescue statutes on top.
 *
 * The legitimate version of that same trade is a tax lien certificate, which is
 * secured by the property, carries a statutory return, and is bought at auction from
 * the county rather than originated against a distressed owner. See
 * docs/SMALL_BUSINESS_LENDING_LEGAL.md.
 */

export type Remittance = 'daily' | 'weekly' | 'biweekly' | 'monthly';

/** Business days per year for daily remittance — advances collect on banking days only. */
const BUSINESS_DAYS_PER_YEAR = 252;

export function periodsPerYear(r: Remittance): number {
  switch (r) {
    case 'daily':
      return BUSINESS_DAYS_PER_YEAR;
    case 'weekly':
      return 52;
    case 'biweekly':
      return 26;
    case 'monthly':
      return 12;
  }
}

export interface AdvanceTerms {
  /** Cash actually delivered to the borrower, net of any withheld fees. */
  readonly amountFunded: number;
  /**
   * Factor rate, e.g. 1.22 means repay 1.22x. Supply this OR totalRepayment.
   */
  readonly factorRate?: number;
  readonly totalRepayment?: number;
  readonly termMonths: number;
  readonly remittance: Remittance;
  /** Fees withheld at funding (origination, underwriting). Reduce cash delivered. */
  readonly upfrontFees?: number;
  /** True when the obligation is secured by the borrower's principal dwelling. */
  readonly securedByPrincipalDwelling?: boolean;
  readonly purpose: 'business' | 'consumer';
}

export class ConsumerDwellingSecuredError extends Error {
  constructor() {
    super(
      'Refused to price this advance: it is secured by the borrower’s principal dwelling. ' +
        'A loan secured by a primary residence is consumer credit under Regulation Z regardless ' +
        'of stated purpose. Above the HOEPA trigger it is a high-cost mortgage carrying ' +
        'ability-to-repay duties, pre-loan counseling, and assignee liability, and at these rates ' +
        'it exceeds criminal usury limits in most states. Where the borrower is already delinquent, ' +
        'state equity-stripping and foreclosure-rescue statutes apply on top. ' +
        'The lawful form of this trade is a tax lien certificate purchased at county auction — ' +
        'see docs/SMALL_BUSINESS_LENDING_LEGAL.md.',
    );
    this.name = 'ConsumerDwellingSecuredError';
  }
}

export class ConsumerPurposeError extends Error {
  constructor() {
    super(
      'Refused to price this advance as commercial financing: the stated purpose is consumer. ' +
        'Consumer credit carries TILA, Regulation Z, and state usury caps that this engine does ' +
        'not model. Commercial exemptions turn on the ACTUAL use of proceeds, not on the label ' +
        'placed on the paperwork.',
    );
    this.name = 'ConsumerPurposeError';
  }
}

export class DisclosureIncompleteError extends Error {
  constructor(missing: readonly string[]) {
    super(
      `Refused to assemble the commercial financing disclosure: missing ${missing.join(', ')}. ` +
        'California, New York, Utah, and Virginia require every one of these before signature. ' +
        'A partial disclosure is worse than none — it looks compliant and is not.',
    );
    this.name = 'DisclosureIncompleteError';
  }
}

export function assertBusinessPurpose(terms: AdvanceTerms): void {
  if (terms.securedByPrincipalDwelling) throw new ConsumerDwellingSecuredError();
  if (terms.purpose !== 'business') throw new ConsumerPurposeError();
}

function resolveRepayment(terms: AdvanceTerms): number {
  if (terms.totalRepayment !== undefined) return terms.totalRepayment;
  if (terms.factorRate !== undefined) return terms.amountFunded * terms.factorRate;
  throw new RangeError('Supply either factorRate or totalRepayment.');
}

/**
 * Present value of a level payment stream at a periodic rate.
 */
function pv(payment: number, periods: number, rate: number): number {
  if (rate === 0) return payment * periods;
  return payment * ((1 - Math.pow(1 + rate, -periods)) / rate);
}

export interface PricingResult {
  readonly amountFunded: number;
  /** Cash the borrower actually receives after withheld fees. */
  readonly netProceeds: number;
  readonly totalRepayment: number;
  readonly financeCharge: number;
  readonly factorRate: number;
  /** The number the disclosure laws require. Annualized, as a decimal. */
  readonly estimatedApr: number;
  readonly paymentAmount: number;
  readonly paymentCount: number;
  readonly remittance: Remittance;
  readonly termMonths: number;
  /** How far the true APR exceeds the naive factor-rate reading. */
  readonly factorRateUnderstatement: number;
  readonly plain: string;
}

/**
 * Solve the internal rate of return on the actual payment stream, then annualize.
 *
 * Bisection rather than Newton: the function is monotonic here and bisection cannot
 * diverge, which matters because this number ends up on a legal disclosure.
 */
export function trueApr(terms: AdvanceTerms): number {
  const total = resolveRepayment(terms);
  const net = terms.amountFunded - (terms.upfrontFees ?? 0);
  if (net <= 0) throw new RangeError('Fees withheld equal or exceed the amount funded.');
  if (total <= net) throw new RangeError('Total repayment must exceed net proceeds.');

  const ppy = periodsPerYear(terms.remittance);
  const periods = Math.max(1, Math.round((terms.termMonths / 12) * ppy));
  const payment = total / periods;

  let lo = 0;
  let hi = 1; // 100% per period is far beyond any real structure
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (pv(payment, periods, mid) > net) lo = mid;
    else hi = mid;
  }
  const periodic = (lo + hi) / 2;
  return periodic * ppy;
}

export function priceAdvance(terms: AdvanceTerms): PricingResult {
  assertBusinessPurpose(terms);
  if (terms.amountFunded <= 0) throw new RangeError('Amount funded must be positive.');
  if (terms.termMonths <= 0) throw new RangeError('Term must be positive.');

  const total = resolveRepayment(terms);
  const net = terms.amountFunded - (terms.upfrontFees ?? 0);
  const ppy = periodsPerYear(terms.remittance);
  const periods = Math.max(1, Math.round((terms.termMonths / 12) * ppy));
  const payment = total / periods;
  const apr = trueApr(terms);
  const factor = total / terms.amountFunded;

  // The naive reading a borrower does in their head: "1.22 over six months, so 22%
  // for half a year, so 44% a year." The real APR is far above it because the balance
  // amortizes from day one. This gap is the disclosure's whole reason for existing.
  const naive = (factor - 1) / (terms.termMonths / 12);

  return {
    amountFunded: Math.round(terms.amountFunded),
    netProceeds: Math.round(net),
    totalRepayment: Math.round(total),
    financeCharge: Math.round(total - net),
    factorRate: Number(factor.toFixed(4)),
    estimatedApr: Number(apr.toFixed(4)),
    paymentAmount: Number(payment.toFixed(2)),
    paymentCount: periods,
    remittance: terms.remittance,
    termMonths: terms.termMonths,
    factorRateUnderstatement: Number((apr - naive).toFixed(4)),
    plain:
      `${Math.round(net).toLocaleString()} delivered, ${Math.round(total).toLocaleString()} repaid over ` +
      `${terms.termMonths} months in ${periods} ${terms.remittance} payments of ` +
      `${payment.toFixed(2)}. Factor ${factor.toFixed(2)}. ` +
      `TRUE APR ${(apr * 100).toFixed(1)}% — not the ${(naive * 100).toFixed(1)}% the factor rate reads like. ` +
      `That ${((apr - naive) * 100).toFixed(1)}-point gap is the amortization, and it is the number ` +
      'California and New York require you to print before signature.',
  };
}

export interface DisclosureInputs {
  readonly pricing: PricingResult;
  readonly providerLegalName: string;
  readonly providerLicenseOrRegistration: string;
  readonly prepaymentPolicy: string;
  /** Any collateral or lien taken. Empty string means unsecured, stated as such. */
  readonly collateralDescription: string;
  /** True if a personal guarantee is required. */
  readonly personalGuarantee: boolean;
  readonly stateOfBorrower: string;
}

export interface Disclosure {
  readonly lines: readonly string[];
  readonly requiresStateSpecificForm: boolean;
  readonly text: string;
}

/** States with commercial financing disclosure statutes in force. */
export const CFDL_STATES: readonly string[] = ['CA', 'NY', 'UT', 'VA'] as const;

export function buildDisclosure(input: DisclosureInputs): Disclosure {
  const missing: string[] = [];
  if (!input.providerLegalName?.trim()) missing.push('provider legal name');
  if (!input.providerLicenseOrRegistration?.trim()) missing.push('license or registration number');
  if (!input.prepaymentPolicy?.trim()) missing.push('prepayment policy');
  if (!input.stateOfBorrower?.trim()) missing.push('borrower state');
  if (missing.length) throw new DisclosureIncompleteError(missing);

  const p = input.pricing;
  const lines = [
    `PROVIDER: ${input.providerLegalName} (${input.providerLicenseOrRegistration})`,
    `AMOUNT FINANCED: $${p.netProceeds.toLocaleString()}`,
    `FINANCE CHARGE: $${p.financeCharge.toLocaleString()}`,
    `TOTAL REPAYMENT AMOUNT: $${p.totalRepayment.toLocaleString()}`,
    `ESTIMATED ANNUAL PERCENTAGE RATE: ${(p.estimatedApr * 100).toFixed(2)}%`,
    `PAYMENT: $${p.paymentAmount.toLocaleString()} ${p.remittance}, ${p.paymentCount} payments`,
    `TERM: ${p.termMonths} months`,
    `PREPAYMENT: ${input.prepaymentPolicy}`,
    `COLLATERAL: ${input.collateralDescription.trim() || 'None taken.'}`,
    `PERSONAL GUARANTEE: ${input.personalGuarantee ? 'Required.' : 'Not required.'}`,
  ];

  return {
    lines,
    requiresStateSpecificForm: CFDL_STATES.includes(input.stateOfBorrower.toUpperCase()),
    text: lines.join('\n'),
  };
}

/**
 * What the borrower has to earn on the money for this to have been worth taking.
 *
 * Run this before quoting. If the required return exceeds the trade's seed multiple,
 * the advance is not a growth loan — it is a liquidation with extra steps, and it will
 * come back as a default whatever the pricing says.
 */
export function breakEvenSeedMultiple(pricing: PricingResult, grossMarginPct: number): {
  readonly requiredRevenueMultiple: number;
  readonly plain: string;
} {
  if (grossMarginPct <= 0 || grossMarginPct >= 1) {
    throw new RangeError('Gross margin must be between 0 and 1.');
  }
  // Revenue needed so that gross profit covers the full repayment.
  const required = pricing.totalRepayment / grossMarginPct / pricing.netProceeds;
  return {
    requiredRevenueMultiple: Number(required.toFixed(2)),
    plain:
      `At a ${(grossMarginPct * 100).toFixed(0)}% gross margin, every dollar delivered has to ` +
      `generate $${required.toFixed(2)} of revenue just to cover the repayment. ` +
      (required > 3
        ? 'That is above what most trades return on working capital in a good season. Re-price or decline.'
        : 'That is inside the range a strong seasonal trade can produce.'),
  };
}

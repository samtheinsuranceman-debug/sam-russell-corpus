// ============================================================
// CRYPTO TAX ENGINE — /portal/crypto-tax-strategy
//
// Why: the page's inputs (lot method, staking, mining) fed nothing; every
// chart was a fixed array (a "10-year projection" of 10,000 → 60,000 and a
// pie of 4,000 / 6,000 / 1,000). This module computes the federal tax on one
// sale of digital assets from the client's own lots, plus staking and mining
// income, for tax year 2026.
//
// Rules applied, each with its authority:
//   • Digital assets are property; a sale realises gain or loss against basis
//     (IRS Notice 2014-21, Q&A-6; Rev. Rul. 2023-14 for staking rewards).
//   • Staking and mining rewards are ordinary income when received (Notice
//     2014-21 Q&A-8; Rev. Rul. 2023-14).
//   • Long-term only if held MORE than one year (IRC §1222); the holding period
//     starts the day after acquisition, so a sale on the anniversary is short-term.
//   • Lot order: FIFO unless specific lots are identified (Treas. Reg.
//     §1.1012-1(c) and (j)). LIFO / HIFO here mean "specific identification in
//     that order" and are valid only with adequate identification.
//   • Net capital loss offsets ordinary income up to $3,000 ($1,500 married
//     filing separately); the rest carries forward (IRC §1211(b), §1212(b)).
//   • The wash-sale rule (IRC §1091) covers stock and securities; it does not
//     name digital assets under current law.
//   • NIIT at 3.8% applies to the capital gain (IRC §1411). Whether staking
//     rewards are net investment income is not settled here: they are
//     excluded and the result says so.
//   • Self-employment tax on mining run as a business is NOT modelled.
//
// PORT STEPS: pure module; imports shared/taxRules.ts and
// shared/preferentialRateTax.ts only. Test: server/a25Calculators.test.ts.
// ============================================================

import { TAX_RULES_2026, standardDeduction, type FilingKey } from "./taxRules";
import { taxWithPreferentialIncome, niitFor, PREFERENTIAL_RATE_TAX_SOURCES } from "./preferentialRateTax";

export type LotMethod = "FIFO" | "LIFO" | "HIFO";

export interface CryptoLot {
  id: string;
  /** ISO date YYYY-MM-DD. */
  acquired: string;
  quantity: number;
  /** Cost per unit including acquisition fees. */
  costPerUnit: number;
}

export interface CryptoSale {
  /** ISO date YYYY-MM-DD. */
  date: string;
  quantity: number;
  pricePerUnit: number;
  /** Selling fees, reduce the amount realised. */
  fees?: number;
}

export interface CryptoTaxInput {
  filing: FilingKey;
  /** Ordinary income before any crypto (wages, interest, etc.), i.e. AGI without crypto. */
  otherIncome: number;
  stakingIncome: number;
  miningIncome: number;
  lots: CryptoLot[];
  sale: CryptoSale | null;
  method: LotMethod;
}

export interface LotUsed {
  lotId: string;
  acquired: string;
  quantity: number;
  basis: number;
  proceeds: number;
  gain: number;
  longTerm: boolean;
}

export interface CryptoTaxResult {
  taxYear: number;
  lotsUsed: LotUsed[];
  /** Quantity asked to sell that no lot covered; non-zero means the sale is larger than the lots entered. */
  unmatchedQuantity: number;
  shortTermGain: number;
  longTermGain: number;
  /** Net capital loss deducted against ordinary income this year (§1211(b)). */
  capitalLossDeducted: number;
  capitalLossCarryforward: number;
  ordinaryCryptoIncome: number;
  agi: number;
  taxableIncome: number;
  federalIncomeTax: number;
  niit: number;
  totalFederal: number;
  /** Federal tax on the same return with no crypto at all. */
  baselineFederal: number;
  /** totalFederal − baselineFederal: what the crypto activity costs in federal tax. */
  cryptoTax: number;
  byCategory: { name: string; income: number }[];
  notes: string[];
}

const r2 = (n: number) => Math.round(n * 100) / 100;

function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y || 1970, (m || 1) - 1, d || 1));
}

/** True when `sold` is after the one-year anniversary of `acquired` (IRC §1222: held more than one year). */
export function isLongTerm(acquired: string, sold: string): boolean {
  const a = parseDate(acquired);
  const anniversary = new Date(Date.UTC(a.getUTCFullYear() + 1, a.getUTCMonth(), a.getUTCDate()));
  return parseDate(sold).getTime() > anniversary.getTime();
}

/** Order lots for a disposal: FIFO oldest first, LIFO newest first, HIFO highest cost first. */
export function orderLots(lots: CryptoLot[], method: LotMethod): CryptoLot[] {
  const copy = lots.filter(l => l.quantity > 0);
  if (method === "FIFO") return copy.sort((a, b) => parseDate(a.acquired).getTime() - parseDate(b.acquired).getTime());
  if (method === "LIFO") return copy.sort((a, b) => parseDate(b.acquired).getTime() - parseDate(a.acquired).getTime());
  return copy.sort((a, b) => b.costPerUnit - a.costPerUnit);
}

export function matchLots(lots: CryptoLot[], sale: CryptoSale, method: LotMethod): { used: LotUsed[]; unmatched: number } {
  let remaining = Math.max(0, sale.quantity);
  const netPricePerUnit = sale.quantity > 0 ? (sale.quantity * sale.pricePerUnit - (sale.fees ?? 0)) / sale.quantity : 0;
  const used: LotUsed[] = [];
  for (const lot of orderLots(lots, method)) {
    if (remaining <= 0) break;
    const q = Math.min(lot.quantity, remaining);
    const basis = q * lot.costPerUnit;
    const proceeds = q * netPricePerUnit;
    used.push({ lotId: lot.id, acquired: lot.acquired, quantity: q, basis: r2(basis), proceeds: r2(proceeds), gain: r2(proceeds - basis), longTerm: isLongTerm(lot.acquired, sale.date) });
    remaining -= q;
  }
  return { used, unmatched: r2(remaining) };
}

function federalOnly(filing: FilingKey, ordinaryAgi: number, netShortTerm: number, netLongTerm: number) {
  // §1211(b) netting: short and long net separately, then against each other.
  let st = netShortTerm;
  let lt = netLongTerm;
  if (st < 0 && lt > 0) { const off = Math.min(-st, lt); lt -= off; st += off; }
  if (lt < 0 && st > 0) { const off = Math.min(-lt, st); st -= off; lt += off; }
  const netLoss = Math.max(0, -(st + lt));
  const lossLimit = filing === "separate" ? 1_500 : 3_000;
  const lossDeducted = Math.min(netLoss, lossLimit);
  const includedSt = Math.max(0, st);
  const includedLt = Math.max(0, lt);
  const agi = ordinaryAgi + includedSt + includedLt - lossDeducted;
  const deduction = standardDeduction(filing, TAX_RULES_2026);
  const taxable = Math.max(0, agi - deduction);
  const ltIncluded = Math.min(includedLt, taxable);
  const tax = taxWithPreferentialIncome({ ordinaryTaxable: taxable - ltIncluded, longTermGain: ltIncluded, filing });
  const niit = niitFor(includedSt + includedLt, agi, filing);
  return { agi, taxable, tax: tax.totalTax, niit, lossDeducted, carryforward: netLoss - lossDeducted };
}

export function computeCryptoTax(input: CryptoTaxInput): CryptoTaxResult {
  const notes: string[] = [];
  const { used, unmatched } = input.sale ? matchLots(input.lots, input.sale, input.method) : { used: [], unmatched: 0 };
  const shortTermGain = r2(used.filter(u => !u.longTerm).reduce((s, u) => s + u.gain, 0));
  const longTermGain = r2(used.filter(u => u.longTerm).reduce((s, u) => s + u.gain, 0));
  const staking = Math.max(0, input.stakingIncome);
  const mining = Math.max(0, input.miningIncome);
  const other = Math.max(0, input.otherIncome);
  const ordinaryCrypto = staking + mining;

  const withCrypto = federalOnly(input.filing, other + ordinaryCrypto, shortTermGain, longTermGain);
  const baseline = federalOnly(input.filing, other, 0, 0);

  if (unmatched > 0) notes.push(`The sale is ${unmatched} units larger than the lots entered; the unmatched units are left out. Add the missing lots.`);
  if (input.method !== "FIFO") notes.push(`${input.method} is specific identification in that order; it holds only if the lots are adequately identified at or before the sale (Treas. Reg. §1.1012-1(c), (j)). Otherwise FIFO applies.`);
  if (staking > 0) notes.push("Staking rewards are taxed as ordinary income (Rev. Rul. 2023-14). Whether they are also net investment income for the 3.8% NIIT is not settled here; they are excluded from NIIT.");
  if (mining > 0) notes.push("Self-employment tax on mining carried on as a trade or business is not modelled.");
  if (withCrypto.carryforward > 0) notes.push(`Capital loss carried forward to next year: $${Math.round(withCrypto.carryforward).toLocaleString("en-US")} (IRC §1212(b)).`);

  const totalFederal = r2(withCrypto.tax + withCrypto.niit);
  const baselineFederal = r2(baseline.tax + baseline.niit);
  return {
    taxYear: TAX_RULES_2026.taxYear,
    lotsUsed: used,
    unmatchedQuantity: unmatched,
    shortTermGain,
    longTermGain,
    capitalLossDeducted: r2(withCrypto.lossDeducted),
    capitalLossCarryforward: r2(withCrypto.carryforward),
    ordinaryCryptoIncome: r2(ordinaryCrypto),
    agi: r2(withCrypto.agi),
    taxableIncome: r2(withCrypto.taxable),
    federalIncomeTax: r2(withCrypto.tax),
    niit: r2(withCrypto.niit),
    totalFederal,
    baselineFederal,
    cryptoTax: r2(totalFederal - baselineFederal),
    byCategory: [
      { name: "Staking", income: r2(staking) },
      { name: "Mining", income: r2(mining) },
      { name: "Short-term gain", income: shortTermGain },
      { name: "Long-term gain", income: longTermGain },
    ],
    notes,
  };
}

/** The same sale under each lot method, for the comparison chart. */
export function compareLotMethods(input: CryptoTaxInput): { method: LotMethod; cryptoTax: number; shortTermGain: number; longTermGain: number }[] {
  return (["FIFO", "LIFO", "HIFO"] as LotMethod[]).map(method => {
    const r = computeCryptoTax({ ...input, method });
    return { method, cryptoTax: r.cryptoTax, shortTermGain: r.shortTermGain, longTermGain: r.longTermGain };
  });
}

export const CRYPTO_TAX_SOURCES: readonly { label: string; url?: string; asOf?: string; note?: string }[] = [
  { label: "IRS Notice 2014-21 — virtual currency is property; mining income is ordinary income when received", url: "https://www.irs.gov/pub/irs-drop/n-14-21.pdf", asOf: "cited 2026-09-23 (primary text, not re-fetched by this build)" },
  { label: "Rev. Rul. 2023-14 — staking rewards are gross income when the taxpayer gains dominion and control", url: "https://www.irs.gov/pub/irs-drop/rr-23-14.pdf", asOf: "cited 2026-09-23 (primary text, not re-fetched by this build)" },
  { label: "Treas. Reg. §1.1012-1(c), (j) — FIFO default; specific identification of digital-asset units", url: "https://www.ecfr.gov/current/title-26/section-1.1012-1", asOf: "cited 2026-09-23 (primary text, not re-fetched by this build)" },
  { label: "26 U.S.C. §§1211(b), 1212(b), 1222 — $3,000 loss limit, carryforward, more-than-one-year holding period", url: "https://www.law.cornell.edu/uscode/text/26/1222", asOf: "statutory" },
  ...PREFERENTIAL_RATE_TAX_SOURCES,
];

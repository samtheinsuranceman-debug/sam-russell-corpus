// ============================================================
// DEPRECIATION RECAPTURE — /portal/depreciation-recapture
//
// Why: the page computed "recapture" as accumulated depreciation × 25% and
// then displayed that TAX as if it were the GAIN, ignored the sale price
// entirely, drew a fixed four-point "disposition timeline", and none of its
// toggles (installment sale, 1031, boot, state rate) reached a result.
//
// What this computes, per property, for tax year 2026:
//   amount realised   = sale price − selling costs
//   adjusted basis    = cost + improvements − accumulated depreciation
//   realised gain     = amount realised − adjusted basis
//   §1245 property    : ordinary recapture = min(gain, depreciation) (IRC §1245(a))
//   §1250 property    : unrecaptured §1250 gain = min(gain, depreciation), taxed at
//                       ordinary rates capped at 25% (IRC §1(h)(1)(E), §1(h)(6));
//                       straight-line real property has no §1250 "additional
//                       depreciation", so no ordinary recapture.
//   remainder         : §1231 gain, taxed as long-term capital gain (assumes no
//                       non-recaptured §1231 losses in the prior five years, §1231(c)).
//
// Disposition choices:
//   • Installment sale: §1245 recapture is recognised in the year of sale
//     whatever the payments (IRC §453(i)); the rest is recognised as payments
//     arrive, unrecaptured §1250 gain first (Treas. Reg. §1.453-12). The
//     year-of-sale figure uses the share of the price received that year.
//   • §1031 exchange: real property only since 2018 (IRC §1031(a)(1) as amended
//     by P.L. 115-97 §13303). Recognised gain = min(boot, realised gain),
//     characterised first as recapture / unrecaptured §1250 gain — a
//     conservative ordering, stated as an assumption.
//   • State tax: the user's rate applied flat to the recognised gain.
//
// PORT STEPS: pure module; imports taxRules and preferentialRateTax.
// Test: server/a25Calculators.test.ts.
// ============================================================

import { TAX_RULES_2026, type FilingKey } from "./taxRules";
import { taxWithPreferentialIncome, niitFor, PREFERENTIAL_RATE_TAX_SOURCES } from "./preferentialRateTax";

export type RecaptureClass = "1245" | "1250";
export type Disposition = "sale" | "installment" | "exchange1031";

export interface RecaptureProperty {
  id: string;
  name: string;
  recaptureClass: RecaptureClass;
  /** Purchase price plus capital improvements. */
  costBasis: number;
  accumulatedDepreciation: number;
  salePrice: number;
  sellingCosts: number;
}

export interface RecaptureInput {
  properties: RecaptureProperty[];
  filing: FilingKey;
  /** Taxable income before the sale (after deductions), taxed at ordinary rates. */
  otherTaxableIncome: number;
  /** MAGI before the sale, for the NIIT threshold. */
  otherMagi: number;
  disposition: Disposition;
  /** Installment sale: share of the price received in the year of sale (0–1). */
  installmentFirstYearShare: number;
  /** 1031 exchange: cash or other non-like-kind property received. */
  boot: number;
  /** State income-tax rate as a decimal, applied flat. */
  stateRate: number;
  /** Whether the gain is net investment income (rental property held for investment: yes). */
  niitApplies: boolean;
}

export interface PropertyRecapture {
  id: string;
  name: string;
  recaptureClass: RecaptureClass;
  amountRealized: number;
  adjustedBasis: number;
  realizedGain: number;
  ordinaryRecapture: number;
  unrecaptured1250: number;
  section1231Gain: number;
  /** Recognised this year after the disposition choice. */
  recognized: { ordinary: number; unrecaptured1250: number; section1231: number; total: number };
  deferred: number;
  notes: string[];
}

export interface RecaptureResult {
  taxYear: number;
  properties: PropertyRecapture[];
  totals: { realizedGain: number; ordinaryRecapture: number; unrecaptured1250: number; section1231Gain: number; recognized: number; deferred: number };
  federal: { ordinaryTax: number; unrecaptured1250Tax: number; section1231Tax: number; niit: number; total: number };
  stateTax: number;
  totalTax: number;
  /** Tax attributable to the sale: total with the sale minus total without it. */
  incrementalFederal: number;
  notes: string[];
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function characterize(p: RecaptureProperty): Omit<PropertyRecapture, "recognized" | "deferred" | "notes"> {
  const amountRealized = Math.max(0, p.salePrice - p.sellingCosts);
  const dep = Math.max(0, p.accumulatedDepreciation);
  const adjustedBasis = Math.max(0, p.costBasis - dep);
  const realizedGain = amountRealized - adjustedBasis;
  const gain = Math.max(0, realizedGain);
  const recaptured = Math.min(gain, dep);
  return {
    id: p.id,
    name: p.name,
    recaptureClass: p.recaptureClass,
    amountRealized: r2(amountRealized),
    adjustedBasis: r2(adjustedBasis),
    realizedGain: r2(realizedGain),
    ordinaryRecapture: p.recaptureClass === "1245" ? r2(recaptured) : 0,
    unrecaptured1250: p.recaptureClass === "1250" ? r2(recaptured) : 0,
    section1231Gain: r2(gain - recaptured),
  };
}

export function recognize(p: RecaptureProperty, input: Pick<RecaptureInput, "disposition" | "installmentFirstYearShare" | "boot">): PropertyRecapture {
  const c = characterize(p);
  const notes: string[] = [];
  const gain = Math.max(0, c.realizedGain);
  let ordinary = c.ordinaryRecapture;
  let u1250 = c.unrecaptured1250;
  let s1231 = c.section1231Gain;

  if (c.realizedGain < 0) notes.push("Loss on sale: a §1231 loss is ordinary if §1231 losses exceed §1231 gains for the year; not netted here.");

  if (input.disposition === "installment" && gain > 0) {
    const share = clamp01(input.installmentFirstYearShare);
    // §453(i): §1245 recapture is recognised in full in the year of sale.
    const rest = gain - ordinary;
    let restNow = rest * share;
    // Reg. §1.453-12: unrecaptured §1250 gain is taken into account first.
    const uNow = Math.min(u1250, restNow);
    restNow -= uNow;
    u1250 = uNow;
    s1231 = Math.max(0, restNow);
    if (ordinary > 0) notes.push("§1245 recapture is recognised in the year of sale even on an installment sale (IRC §453(i)).");
  }

  if (input.disposition === "exchange1031") {
    if (p.recaptureClass === "1245") {
      notes.push("§1031 covers real property only since 2018; this §1245 property is treated as sold.");
    } else {
      const recognizedGain = Math.min(Math.max(0, input.boot), gain);
      // Conservative ordering: recognised boot gain is characterised as unrecaptured §1250 gain first.
      const uNow = Math.min(u1250, recognizedGain);
      u1250 = uNow;
      s1231 = recognizedGain - uNow;
      ordinary = 0;
      notes.push("§1031 exchange: only gain up to the boot is recognised; it is treated as unrecaptured §1250 gain first (assumption). The rest carries into the replacement property's basis.");
    }
  }

  const total = ordinary + u1250 + s1231;
  return {
    ...c,
    recognized: { ordinary: r2(ordinary), unrecaptured1250: r2(u1250), section1231: r2(s1231), total: r2(total) },
    deferred: r2(Math.max(0, gain - total)),
    notes,
  };
}

export function computeRecapture(input: RecaptureInput): RecaptureResult {
  const properties = input.properties.map(p => recognize(p, input));
  const sum = (f: (p: PropertyRecapture) => number) => r2(properties.reduce((s, p) => s + f(p), 0));
  const ordinary = sum(p => p.recognized.ordinary);
  const u1250 = sum(p => p.recognized.unrecaptured1250);
  const s1231 = sum(p => p.recognized.section1231);
  const recognizedTotal = r2(ordinary + u1250 + s1231);

  const base = Math.max(0, input.otherTaxableIncome);
  const withSale = taxWithPreferentialIncome({ ordinaryTaxable: base + ordinary, unrecaptured1250: u1250, longTermGain: s1231, filing: input.filing });
  const without = taxWithPreferentialIncome({ ordinaryTaxable: base, longTermGain: 0, filing: input.filing });
  const ordinaryTaxOnRecapture = r2(withSale.ordinaryTax - without.ordinaryTax);
  const magi = Math.max(0, input.otherMagi) + recognizedTotal;
  const niit = input.niitApplies ? niitFor(recognizedTotal, magi, input.filing) : 0;
  const federalTotal = r2(withSale.totalTax - without.totalTax + niit);
  const stateTax = r2(recognizedTotal * Math.max(0, input.stateRate));

  const notes: string[] = [
    "§1231 gain is taxed as long-term capital gain on the assumption that no §1231 losses from the prior five years must be recaptured (§1231(c)).",
    "State tax is the entered rate applied flat to the recognised gain; state brackets, exclusions and credits are not modelled.",
  ];
  if (!input.niitApplies) notes.push("NIIT excluded: marked as not net investment income (e.g. a real estate professional's non-passive activity).");

  return {
    taxYear: TAX_RULES_2026.taxYear,
    properties,
    totals: {
      realizedGain: sum(p => p.realizedGain),
      ordinaryRecapture: sum(p => p.ordinaryRecapture),
      unrecaptured1250: sum(p => p.unrecaptured1250),
      section1231Gain: sum(p => p.section1231Gain),
      recognized: recognizedTotal,
      deferred: sum(p => p.deferred),
    },
    federal: {
      ordinaryTax: ordinaryTaxOnRecapture,
      unrecaptured1250Tax: withSale.unrecaptured1250Tax,
      section1231Tax: withSale.longTermGainTax,
      niit,
      total: federalTotal,
    },
    stateTax,
    totalTax: r2(federalTotal + stateTax),
    incrementalFederal: federalTotal,
    notes,
  };
}

export const DEPRECIATION_RECAPTURE_SOURCES: readonly { label: string; url?: string; asOf?: string; note?: string }[] = [
  { label: "26 U.S.C. §1245 — gain on depreciable personal property is ordinary income to the extent of depreciation taken", url: "https://www.law.cornell.edu/uscode/text/26/1245", asOf: "statutory" },
  { label: "26 U.S.C. §1250 and §1(h)(6) — unrecaptured §1250 gain on real property", url: "https://www.law.cornell.edu/uscode/text/26/1250", asOf: "statutory" },
  { label: "26 U.S.C. §453(i) — recapture income recognised in the year of an installment sale; Treas. Reg. §1.453-12 — unrecaptured §1250 gain taken into account first", url: "https://www.law.cornell.edu/uscode/text/26/453", asOf: "statutory" },
  { label: "26 U.S.C. §1031(a), as amended by P.L. 115-97 §13303 — like-kind exchanges limited to real property after 2017; §1031(b) — gain recognised to the extent of boot", url: "https://www.law.cornell.edu/uscode/text/26/1031", asOf: "statutory" },
  { label: "26 U.S.C. §1231 — net §1231 gain treated as long-term capital gain; §1231(c) five-year lookback", url: "https://www.law.cornell.edu/uscode/text/26/1231", asOf: "statutory" },
  ...PREFERENTIAL_RATE_TAX_SOURCES,
];

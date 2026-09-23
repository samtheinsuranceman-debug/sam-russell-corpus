// ============================================================
// DIVORCE RECOVERY — /portal/divorce-recovery
//
// Why: the page had one "Total Assets" box wired to nothing, a year slider
// and a scenario slider that only echoed their own value, a "Placeholder:
// Outcome Chart", and a 50-year grid printing the literal text
// "[Asset Protection]". Nothing was computed.
//
// What this computes:
//   1. The net marital estate from the client's asset and debt list.
//   2. The client's share. Community-property states start from 50/50 by
//      doctrine (shared/divorceStateRules.ts). Equitable-distribution states
//      have NO statutory ratio, so the share is the user's entry and is
//      labelled a negotiated/illustrative figure, never "the law".
//   3. The embedded tax in the assets received. Transfers between spouses are
//      tax-free with carryover basis (IRC §1041), so a dollar of pre-tax
//      401(k) is not worth a dollar of cash. After-tax value uses the client's
//      2026 single-filer marginal rate (taxRules), long-term gain rates on
//      appreciated taxable accounts, and the §121 $250,000 home-sale exclusion
//      for a single filer.
//   4. A recovery path: after-tax share growing at the client's own assumed
//      return plus annual savings, and the first year it reaches the target
//      the client sets (default: the pre-divorce household net estate).
//
// The growth rate and savings are the client's assumptions and are labelled
// so. Child support and alimony are NOT estimated: they are set by state
// guideline formulas this build does not carry.
//
// PORT STEPS: pure module; imports taxRules, preferentialRateTax,
// divorceStateRules. Test: server/a25Calculators.test.ts.
// ============================================================

import { TAX_RULES_2026, standardDeduction, federalTax, type FilingKey } from "./taxRules";
import { taxWithPreferentialIncome, PREFERENTIAL_RATE_TAX_SOURCES } from "./preferentialRateTax";
import { ruleForState, divisionSentence, RULES_VERSION } from "./divorceStateRules";

/** IRC §121(b)(1): exclusion of gain on sale of a principal residence, single filer. Statutory, not indexed. */
export const SECTION_121_EXCLUSION_SINGLE = 250_000;

export type MaritalAssetKind = "cash" | "taxable" | "pretax" | "roth" | "home";

export interface MaritalAsset {
  id: string;
  label: string;
  kind: MaritalAssetKind;
  /** Current market value (for a home, value net of the mortgage is computed from `debt`). */
  value: number;
  /** Cost basis, for taxable accounts and the home. */
  basis?: number;
  /** Debt secured by this asset (mortgage). */
  debt?: number;
  /** Share of this asset the client receives (0–1). */
  clientShare: number;
}

export interface DivorceRecoveryInput {
  state: string;
  assets: MaritalAsset[];
  /** Unsecured marital debts. */
  otherDebts: number;
  /** Share of unsecured debt the client takes (0–1). */
  clientDebtShare: number;
  /** Client's expected ordinary income after the divorce (for the marginal rate). */
  clientIncome: number;
  filing: Extract<FilingKey, "single" | "hoh">;
  /** Client's own assumed annual return, decimal. */
  assumedReturn: number;
  annualSavings: number;
  horizonYears: number;
  /** Net worth the client wants to get back to; default is the pre-divorce net marital estate. */
  recoveryTarget?: number;
}

export interface AssetOutcome {
  id: string;
  label: string;
  kind: MaritalAssetKind;
  equity: number;
  clientEquity: number;
  embeddedTax: number;
  clientAfterTax: number;
}

export interface DivorceRecoveryResult {
  regime: "community" | "equitable" | "elective" | "unknown";
  stateBasis: string;
  rulesVersion: string;
  /** Present only for community-property states. */
  presumptiveShare: number | null;
  netMaritalEstate: number;
  clientNominal: number;
  clientShareOfEstate: number;
  clientAfterTax: number;
  embeddedTax: number;
  marginalOrdinaryRate: number;
  assets: AssetOutcome[];
  projection: { year: number; netWorth: number }[];
  recoveryTarget: number;
  yearsToRecover: number | null;
  notes: string[];
}

const r0 = (n: number) => Math.round(n);
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Federal tax on an extra slice of ordinary income on top of the client's own. */
function ordinaryTaxOn(extra: number, income: number, filing: FilingKey): number {
  const ded = standardDeduction(filing, TAX_RULES_2026);
  const base = Math.max(0, income - ded);
  return federalTax(base + extra, filing, TAX_RULES_2026).tax - federalTax(base, filing, TAX_RULES_2026).tax;
}

function gainTaxOn(gain: number, income: number, filing: FilingKey): number {
  if (gain <= 0) return 0;
  const ded = standardDeduction(filing, TAX_RULES_2026);
  const base = Math.max(0, income - ded);
  const withGain = taxWithPreferentialIncome({ ordinaryTaxable: base, longTermGain: gain, filing });
  const without = taxWithPreferentialIncome({ ordinaryTaxable: base, longTermGain: 0, filing });
  return withGain.totalTax - without.totalTax;
}

export function computeDivorceRecovery(input: DivorceRecoveryInput): DivorceRecoveryResult {
  const code = String(input.state ?? "").trim().toUpperCase();
  const rule = ruleForState(code);
  const notes: string[] = [];

  const assets: AssetOutcome[] = input.assets.map(a => {
    const share = clamp01(a.clientShare);
    const equity = Math.max(0, a.value) - Math.max(0, a.debt ?? 0);
    const clientEquity = equity * share;
    const clientValue = Math.max(0, a.value) * share;
    let embeddedTax = 0;
    if (a.kind === "pretax") {
      // Whole balance is ordinary income when withdrawn; taxed as one year's withdrawal on top of income (upper bound).
      embeddedTax = ordinaryTaxOn(clientValue, input.clientIncome, input.filing);
    } else if (a.kind === "taxable") {
      const gain = Math.max(0, clientValue - Math.max(0, a.basis ?? a.value) * share);
      embeddedTax = gainTaxOn(gain, input.clientIncome, input.filing);
    } else if (a.kind === "home") {
      const gain = Math.max(0, clientValue - Math.max(0, a.basis ?? a.value) * share);
      embeddedTax = gainTaxOn(Math.max(0, gain - SECTION_121_EXCLUSION_SINGLE), input.clientIncome, input.filing);
    }
    return {
      id: a.id,
      label: a.label,
      kind: a.kind,
      equity: r0(equity),
      clientEquity: r0(clientEquity),
      embeddedTax: r0(embeddedTax),
      clientAfterTax: r0(clientEquity - embeddedTax),
    };
  });

  const otherDebts = Math.max(0, input.otherDebts);
  const netMaritalEstate = r0(assets.reduce((s, a) => s + a.equity, 0) - otherDebts);
  const clientDebt = otherDebts * clamp01(input.clientDebtShare);
  const clientNominal = r0(assets.reduce((s, a) => s + a.clientEquity, 0) - clientDebt);
  const embeddedTax = r0(assets.reduce((s, a) => s + a.embeddedTax, 0));
  const clientAfterTax = clientNominal - embeddedTax;

  const ded = standardDeduction(input.filing, TAX_RULES_2026);
  const marginal = federalTax(Math.max(0, input.clientIncome - ded), input.filing, TAX_RULES_2026).marginalRate;

  const target = input.recoveryTarget && input.recoveryTarget > 0 ? input.recoveryTarget : netMaritalEstate;
  const projection: { year: number; netWorth: number }[] = [{ year: 0, netWorth: clientAfterTax }];
  let nw = clientAfterTax;
  let yearsToRecover: number | null = nw >= target ? 0 : null;
  const years = Math.max(0, Math.min(50, Math.round(input.horizonYears)));
  for (let y = 1; y <= years; y++) {
    nw = nw * (1 + input.assumedReturn) + input.annualSavings;
    projection.push({ year: y, netWorth: r0(nw) });
    if (yearsToRecover === null && nw >= target) yearsToRecover = y;
  }

  const presumptive = rule?.regime === "community" ? rule.presumptiveShare ?? 0.5 : null;
  if (rule && rule.regime !== "community") notes.push(`${rule.name} has no statutory division ratio; the shares entered are a negotiated or illustrative split, not a presumption.`);
  if (!rule) notes.push(`No rule on file for "${input.state}"; treated as equitable distribution with no presumed ratio.`);
  notes.push("Embedded tax on pre-tax accounts assumes the whole share is withdrawn in one year on top of the client's income: an upper bound. Spreading withdrawals lowers it. Early-withdrawal penalties are not included (a QDRO distribution is exempt under IRC §72(t)(2)(C)).");
  notes.push("Each asset's embedded tax is computed on top of the client's income on its own, not stacked on the other assets' gains.");
  notes.push("Growth and savings are the client's own assumptions, not forecasts.");
  notes.push("Child support and alimony are set by state guideline formulas, which this build does not carry; they are not estimated.");

  return {
    regime: rule?.regime ?? "unknown",
    stateBasis: rule ? divisionSentence(code) : `No rule is on file for "${input.state}".`,
    rulesVersion: RULES_VERSION.version,
    presumptiveShare: presumptive,
    netMaritalEstate,
    clientNominal,
    clientShareOfEstate: netMaritalEstate > 0 ? clientNominal / netMaritalEstate : 0,
    clientAfterTax,
    embeddedTax,
    marginalOrdinaryRate: marginal,
    assets,
    projection,
    recoveryTarget: r0(target),
    yearsToRecover,
    notes,
  };
}

export const DIVORCE_RECOVERY_SOURCES: readonly { label: string; url?: string; asOf?: string; note?: string }[] = [
  { label: "shared/divorceStateRules.ts — property-division regime for all 50 states and DC (community-property states per IRS Publication 555)", asOf: "rules read 2026-09-16" },
  { label: "26 U.S.C. §1041 — no gain or loss on transfers between spouses incident to divorce; carryover basis", url: "https://www.law.cornell.edu/uscode/text/26/1041", asOf: "statutory" },
  { label: "26 U.S.C. §121(b)(1) — $250,000 exclusion of gain on sale of a principal residence (single filer)", url: "https://www.law.cornell.edu/uscode/text/26/121", asOf: "statutory" },
  { label: "26 U.S.C. §72(t)(2)(C) — no 10% additional tax on distributions to an alternate payee under a QDRO", url: "https://www.law.cornell.edu/uscode/text/26/72", asOf: "statutory" },
  ...PREFERENTIAL_RATE_TAX_SOURCES,
];

/**
 * The loan arithmetic, and the two things it is built to make visible: that a
 * participating loan is charged in the years the index credits nothing, and
 * that a lapse hands the client a tax bill with no cash to pay it.
 */

import { describe, it, expect } from 'vitest';
import {
  runPolicyLoanMechanics,
  yearsToCrossover,
  type LoanTerms,
  type PolicyYearState,
  type TaxContext,
} from '../shared/policyLoanMechanics';
import { getCreditingHistory, ALL_INDEX_OPTIONS } from '../shared/indexCreditingData';

const TAX: TaxContext = {
  cumulativePremiumsPaid: 500_000,
  isMec: false,
  ownerAgeAtStart: 55,
  ordinaryIncomeRatePct: 37,
};

/** A policy that simply grows, so the loan overlay is what is being tested. */
function states(opts: {
  years: number; startValue: number; creditPct: number | number[]; draw: number; drawFrom: number;
  surrenderRatio?: number;
}): PolicyYearState[] {
  const out: PolicyYearState[] = [];
  let av = opts.startValue;
  for (let y = 1; y <= opts.years; y++) {
    const rate = Array.isArray(opts.creditPct)
      ? opts.creditPct[(y - 1) % opts.creditPct.length]!
      : opts.creditPct;
    av = av * (1 + rate / 100);
    out.push({
      policyYear: y,
      attainedAge: 55 + y,
      accountValue: av,
      surrenderValue: av * (opts.surrenderRatio ?? 1),
      creditedRatePct: rate,
      loanTaken: y >= opts.drawFrom ? opts.draw : 0,
    });
  }
  return out;
}

describe('the three loan types are three different bets', () => {
  const s = states({ years: 20, startValue: 1_000_000, creditPct: 6, draw: 60_000, drawFrom: 1 });

  it('a wash loan costs nothing, every year', () => {
    const terms: LoanTerms = { type: 'wash', chargedRatePct: 5 };
    const r = runPolicyLoanMechanics(s, terms, TAX);
    expect(r.summary.totalNetCost).toBe(0);
    for (const y of r.years) expect(y.netCost, `year ${y.policyYear}`).toBe(0);
  });

  it('a fixed loan costs the spread, and the spread only', () => {
    const terms: LoanTerms = { type: 'fixed', chargedRatePct: 5, collateralCreditRatePct: 3 };
    const r = runPolicyLoanMechanics(s, terms, TAX);
    for (const y of r.years) {
      if (y.loanBalance > 0 && !y.lapsed) {
        // Charged 5% on the balance carried in, credited 3% on it.
        expect(y.netCost).toBeGreaterThan(0);
      }
    }
    expect(r.summary.totalNetCost).toBeGreaterThan(0);
  });

  it('a participating loan costs the full rate in a year the index credits nothing', () => {
    // Six good years then a zero, repeating — the shape of a real index record.
    const withZeros = states({
      years: 21, startValue: 1_000_000, creditPct: [8, 8, 8, 0, 8, 8, 0], draw: 50_000, drawFrom: 1,
    });
    const r = runPolicyLoanMechanics(withZeros, { type: 'participating', chargedRatePct: 5 }, TAX);
    const flat = r.years.filter((y) => y.collateralCreditedNothing);
    expect(flat.length).toBeGreaterThan(0);
    for (const y of flat) {
      expect(y.collateralCredit, `year ${y.policyYear}`).toBe(0);
      expect(y.interestCharged, `year ${y.policyYear}`).toBeGreaterThan(0);
      expect(y.netCost).toBe(y.interestCharged);
    }
    expect(r.summary.yearsCollateralCreditedNothing).toBe(flat.length);
    expect(r.notes.join(' ')).toMatch(/charged its full rate anyway/);
  });
});

describe('against the real index record', () => {
  it('counts the zero-credit years a participating loan is charged through', () => {
    const capped = ALL_INDEX_OPTIONS.find((o) => o.id === 'am-sp500-ptp')!;
    const history = getCreditingHistory(capped, 1996, 2025);
    const s = history.map((h, i) => ({
      policyYear: i + 1,
      attainedAge: 55 + i + 1,
      accountValue: 1_000_000,
      surrenderValue: 1_000_000,
      creditedRatePct: h.creditedRate,
      loanTaken: 40_000,
    }));
    const r = runPolicyLoanMechanics(s, { type: 'participating', chargedRatePct: 5 }, TAX);
    // The floor means several years credit exactly nothing, and the loan is
    // charged in every one of them.
    expect(r.summary.yearsCollateralCreditedNothing).toBeGreaterThan(0);
    const zeroYears = history.filter((h) => h.creditedRate <= 0).length;
    expect(r.summary.yearsCollateralCreditedNothing).toBeLessThanOrEqual(zeroYears + 1);
  });
});

describe('charged in advance vs in arrears', () => {
  const s = states({ years: 10, startValue: 2_000_000, creditPct: 6, draw: 60_000, drawFrom: 1 });

  it('in arrears, the client gets the whole draw and the interest compounds', () => {
    const r = runPolicyLoanMechanics(s, { type: 'fixed', chargedRatePct: 5, collateralCreditRatePct: 3 }, TAX);
    expect(r.summary.totalCashReceived).toBe(r.summary.totalBorrowed);
    expect(r.years[0]!.cashReceived).toBe(60_000);
  });

  it('in advance, the interest comes out of the proceeds and the income column lies', () => {
    const r = runPolicyLoanMechanics(
      s, { type: 'fixed', chargedRatePct: 5, collateralCreditRatePct: 3, inArrears: false }, TAX);
    // A $60,000 draw at 5% hands over $57,000.
    expect(r.years[0]!.cashReceived).toBe(57_000);
    expect(r.summary.totalCashReceived).toBeLessThan(r.summary.totalBorrowed);
  });

  it('charges the year a draw is taken, not the year after', () => {
    // A loan taken in year 1 is on loan through year 1 and is charged for it.
    const r = runPolicyLoanMechanics(s, { type: 'fixed', chargedRatePct: 5, collateralCreditRatePct: 3 }, TAX);
    expect(r.years[0]!.interestCharged).toBe(3_000);
  });
});

describe('the crossover', () => {
  it('is closed-form when the charged rate exceeds the credited rate', () => {
    // $100k against $200k at 6% charged and 4% credited.
    const n = yearsToCrossover(100_000, 200_000, 6, 4)!;
    expect(n).toBeGreaterThan(0);
    // Verify by simulation rather than by restating the formula.
    let loan = 100_000, cv = 200_000, y = 0;
    while (loan < cv && y < 200) { loan *= 1.06; cv *= 1.04; y++; }
    expect(Math.ceil(n)).toBe(y);
  });

  it('never arrives when the charged rate is at or below the credited rate', () => {
    expect(yearsToCrossover(100_000, 200_000, 4, 6)).toBeNull();
    expect(yearsToCrossover(100_000, 200_000, 5, 5)).toBeNull();
  });

  it('is reported even on a run that does not reach it inside the projection', () => {
    const s = states({ years: 10, startValue: 2_000_000, creditPct: 4, draw: 30_000, drawFrom: 1 });
    const r = runPolicyLoanMechanics(s, { type: 'fixed', chargedRatePct: 7, collateralCreditRatePct: 2 }, TAX);
    expect(r.summary.lapseYear).toBeNull();
    expect(r.summary.projectedCrossoverYear).not.toBeNull();
    expect(r.notes.join(' ')).toMatch(/Nothing reverses it/);
  });
});

describe('what a lapse actually costs', () => {
  it('lapses when the loan overtakes the surrender value, and stops projecting after', () => {
    const s = states({ years: 40, startValue: 400_000, creditPct: 2, draw: 60_000, drawFrom: 1 });
    const r = runPolicyLoanMechanics(s, { type: 'fixed', chargedRatePct: 6, collateralCreditRatePct: 2 }, TAX);
    expect(r.summary.lapseYear).not.toBeNull();
    const after = r.years.filter((y) => y.policyYear > r.summary.lapseYear!);
    expect(after.every((y) => y.lapsed && y.loanBalance === 0)).toBe(true);
  });

  it('hands the client ordinary income on a gain they never received', () => {
    const s = states({ years: 40, startValue: 900_000, creditPct: 3, draw: 90_000, drawFrom: 1 });
    const r = runPolicyLoanMechanics(s, { type: 'fixed', chargedRatePct: 7, collateralCreditRatePct: 2 }, TAX);

    expect(r.lapseConsequence.occurred).toBe(true);
    expect(r.lapseConsequence.phantomIncomeOnLapse).toBeGreaterThan(0);
    expect(r.lapseConsequence.taxOwed).toBeGreaterThan(0);
    // The cash value went to the loan, so almost nothing reaches the client.
    expect(r.lapseConsequence.cashToClient).toBeLessThan(r.lapseConsequence.taxOwed);
    // Which means a cheque has to be written from somewhere else.
    expect(r.lapseConsequence.cashShortfall).toBeGreaterThan(0);
    expect(r.notes.join(' ')).toMatch(/ordinary income/);
  });

  it('prices the consequence even when the policy does not lapse', () => {
    const s = states({ years: 15, startValue: 2_000_000, creditPct: 6, draw: 20_000, drawFrom: 1 });
    const r = runPolicyLoanMechanics(s, { type: 'wash', chargedRatePct: 5 }, TAX);
    expect(r.summary.lapseYear).toBeNull();
    expect(r.lapseConsequence.occurred).toBe(false);
    // Still computed, because a projection that holds still needs to show what
    // failing would cost.
    expect(r.lapseConsequence.phantomIncomeOnLapse).toBeGreaterThan(0);
  });

  it('says the death benefit route avoids all of it', () => {
    const s = states({ years: 10, startValue: 1_000_000, creditPct: 6, draw: 30_000, drawFrom: 1 });
    const r = runPolicyLoanMechanics(s, { type: 'wash', chargedRatePct: 5 }, TAX);
    expect(r.notes.join(' ')).toMatch(/101\(a\)/);
  });
});

describe('modified endowment contracts', () => {
  const s = states({ years: 12, startValue: 1_000_000, creditPct: 6, draw: 50_000, drawFrom: 1 });

  it('taxes a loan from a MEC gain-first, unlike a loan from a non-MEC', () => {
    const nonMec = runPolicyLoanMechanics(s, { type: 'wash', chargedRatePct: 5 }, TAX);
    const mec = runPolicyLoanMechanics(s, { type: 'wash', chargedRatePct: 5 }, { ...TAX, isMec: true });

    expect(nonMec.years.every((y) => y.taxableDistribution === 0)).toBe(true);
    expect(mec.years.some((y) => y.taxableDistribution > 0)).toBe(true);
  });

  it('adds the 10% additional tax before 59 and a half, and not after', () => {
    const young = runPolicyLoanMechanics(s, { type: 'wash', chargedRatePct: 5 }, { ...TAX, isMec: true, ownerAgeAtStart: 50 });
    const older = runPolicyLoanMechanics(s, { type: 'wash', chargedRatePct: 5 }, { ...TAX, isMec: true, ownerAgeAtStart: 62 });
    expect(young.years.some((y) => y.penaltyTax > 0)).toBe(true);
    expect(older.years.every((y) => y.penaltyTax === 0)).toBe(true);
  });
});

describe('what is a carrier quote and what is mechanics', () => {
  it('names the charged rate as quoted, and the collateral rate only for a fixed loan', () => {
    const s = states({ years: 5, startValue: 1_000_000, creditPct: 6, draw: 20_000, drawFrom: 1 });
    const fixed = runPolicyLoanMechanics(s, { type: 'fixed', chargedRatePct: 5, collateralCreditRatePct: 3 }, TAX);
    const part = runPolicyLoanMechanics(s, { type: 'participating', chargedRatePct: 5 }, TAX);

    expect(fixed.carrierQuoted.join(' ')).toMatch(/charged loan rate/);
    expect(fixed.carrierQuoted.join(' ')).toMatch(/held collateral/);
    // A participating loan has no declared collateral rate to quote — it earns
    // the index, which the platform already models.
    expect(part.carrierQuoted.join(' ')).not.toMatch(/held collateral/);
  });

  it('warns that a wash loan may be a current practice rather than a guarantee', () => {
    const s = states({ years: 5, startValue: 1_000_000, creditPct: 6, draw: 20_000, drawFrom: 1 });
    const r = runPolicyLoanMechanics(s, { type: 'wash', chargedRatePct: 5 }, TAX);
    expect(r.notes.join(' ')).toMatch(/contractually guaranteed/);
  });
});

// ============================================================
// Merged in from the retired policyLoanTypes.ts: the carrier rates read off
// the illustrations, the fourth loan type, the guaranteed column and the
// overloan gate. Each test pins one way the merged engine could mislead.
// ============================================================

import {
  NATIONWIDE_DECLARED, NATIONWIDE_PARTICIPATING,
  SECURIAN_FIXED, SECURIAN_FIXED_LATE, SECURIAN_INDEXED, SECURIAN_VARIABLE,
  CARRIER_LOAN_PROFILES, modellableCarriers, compareLoanTypes,
  chargedRateAt, collateralStaysIndexed, overloanEligibleYear, LOAN_DISCLOSURE,
} from '../shared/policyLoanMechanics';

/** A policy that grows steadily, so the loan overlay is the only variable. */
function steadyStates(years: number, creditedPct: number, draw: number, startValue = 900_000): PolicyYearState[] {
  return Array.from({ length: years }, (_, i) => {
    const value = startValue * Math.pow(1 + creditedPct / 100, i + 1);
    return {
      policyYear: i + 1,
      attainedAge: 45 + i + 1,
      accountValue: value,
      surrenderValue: value,
      creditedRatePct: creditedPct,
      loanTaken: i + 1 >= 2 ? draw : 0,
    };
  });
}

const MERGED_TAX = {
  cumulativePremiumsPaid: 750_000,
  isMec: false,
  ownerAgeAtStart: 45,
  ordinaryIncomeRatePct: 37,
};

describe('the charged rate is a schedule, not a number', () => {
  it('steps Nationwide down from 3.90% to 3.00% at year 11', () => {
    // A single flat rate is wrong in one half of any projection long enough to
    // matter. This is the reason LoanTerms takes a function.
    expect(chargedRateAt(NATIONWIDE_DECLARED, 1)).toBe(3.90);
    expect(chargedRateAt(NATIONWIDE_DECLARED, 10)).toBe(3.90);
    expect(chargedRateAt(NATIONWIDE_DECLARED, 11)).toBe(3.00);
    expect(chargedRateAt(NATIONWIDE_DECLARED, 30)).toBe(3.00);
  });

  it('still accepts a plain number, so existing callers keep working', () => {
    expect(chargedRateAt(NATIONWIDE_PARTICIPATING, 1)).toBe(5.00);
    expect(chargedRateAt(NATIONWIDE_PARTICIPATING, 25)).toBe(5.00);
  });

  it('carries the stepped rate onto each row, not just into the total', () => {
    const r = runPolicyLoanMechanics(steadyStates(15, 6, 60_000), NATIONWIDE_DECLARED, MERGED_TAX);
    expect(r.years[4].chargedRatePct).toBe(3.90);    // year 5
    expect(r.years[12].chargedRatePct).toBe(3.00);   // year 13
  });
});

describe('four loan types, and only one leaves the money in the index', () => {
  it('says so for each type, with the indexed loan account on the FALSE side', () => {
    // The distinction the merge exists to protect: Securian's indexed loan
    // still moves the money, it just moves it somewhere that tracks an index.
    expect(collateralStaysIndexed('participating')).toBe(true);
    expect(collateralStaysIndexed('indexed_account')).toBe(false);
    expect(collateralStaysIndexed('fixed')).toBe(false);
    expect(collateralStaysIndexed('wash')).toBe(false);
  });

  it('warns on the page when an indexed loan account is being run', () => {
    const r = runPolicyLoanMechanics(steadyStates(20, 6, 60_000), SECURIAN_INDEXED, MERGED_TAX);
    expect(r.notes.join(' ')).toContain('not a participating loan');
  });

  it('credits a participating loan the policy rate and an indexed loan its own', () => {
    const states = steadyStates(20, 9, 60_000);
    const part = runPolicyLoanMechanics(states, SECURIAN_VARIABLE, MERGED_TAX);
    const idx = runPolicyLoanMechanics(states, { ...SECURIAN_INDEXED, indexedLoanAccountRatePct: 2 }, MERGED_TAX);
    expect(part.years[5].collateralCreditRatePct).toBe(9);   // the policy's rate
    expect(idx.years[5].collateralCreditRatePct).toBe(2);    // the loan account's
  });

  it('does not silently fall back to the policy rate when the account rate is absent', () => {
    // Absent must not mean "same as the policy", which would turn this type
    // into a participating loan on the page.
    const r = runPolicyLoanMechanics(steadyStates(10, 9, 60_000), SECURIAN_INDEXED, MERGED_TAX);
    expect(r.years[3].collateralCreditRatePct).toBe(0);
    expect(r.years[3].collateralCreditRatePct).not.toBe(9);
  });
});

describe('the spread, year by year', () => {
  it('pays +4.00 on a 9% year under a participating loan charged 5%', () => {
    const r = runPolicyLoanMechanics(steadyStates(20, 9, 60_000), NATIONWIDE_PARTICIPATING, MERGED_TAX);
    expect(r.years[5].netSpreadPct).toBe(4.00);
  });

  it('costs the full charged rate in a 0% year — the floor protects the account, not the loan', () => {
    const r = runPolicyLoanMechanics(steadyStates(20, 0, 60_000), NATIONWIDE_PARTICIPATING, MERGED_TAX);
    expect(r.years[5].netSpreadPct).toBe(-5.00);
    expect(r.years[5].collateralCreditedNothing).toBe(true);
  });

  it('is bounded on the declared loan: -0.90 early, 0.00 from year 11', () => {
    const r = runPolicyLoanMechanics(steadyStates(20, 9, 60_000), NATIONWIDE_DECLARED, MERGED_TAX);
    expect(r.years[4].netSpreadPct).toBe(-0.90);
    expect(r.years[12].netSpreadPct).toBe(0);
  });

  it('makes Securian fixed a TRUE wash from year 11, and -1.00 before it', () => {
    const states = steadyStates(20, 9, 60_000);
    const early = runPolicyLoanMechanics(states, SECURIAN_FIXED, MERGED_TAX);
    const late = runPolicyLoanMechanics(states, SECURIAN_FIXED_LATE, MERGED_TAX);
    expect(early.years[4].netSpreadPct).toBe(-1.00);
    expect(late.years[4].netSpreadPct).toBe(0);
  });
});

describe('the guaranteed column is the contract, not a forecast', () => {
  const states = steadyStates(20, 9, 60_000);

  it('charges 8% and credits the 0% floor on Nationwide participating', () => {
    const r = runPolicyLoanMechanics(states, NATIONWIDE_PARTICIPATING, MERGED_TAX, { guaranteed: true });
    expect(r.years[0].chargedRatePct).toBe(8.00);
    expect(r.years[0].collateralCreditRatePct).toBe(0);
    expect(r.years[0].netSpreadPct).toBe(-8.00);
  });

  it('is never cheaper than the current column', () => {
    const cur = runPolicyLoanMechanics(states, NATIONWIDE_PARTICIPATING, MERGED_TAX);
    const gtd = runPolicyLoanMechanics(states, NATIONWIDE_PARTICIPATING, MERGED_TAX, { guaranteed: true });
    expect(gtd.summary.totalNetCost).toBeGreaterThan(cur.summary.totalNetCost);
  });

  it('labels itself so a page cannot print it as a projection', () => {
    const r = runPolicyLoanMechanics(states, NATIONWIDE_PARTICIPATING, MERGED_TAX, { guaranteed: true });
    expect(r.provenance.guaranteedColumn).toBe(true);
    expect(r.notes.join(' ')).toContain('not a forecast');
  });
});

describe('the overloan gate is age 65 AND year 15, both', () => {
  it('waits for age 65 when the insured is young at issue', () => {
    expect(overloanEligibleYear(45, 40)).toBe(21);   // 45 + 21 - 1 = 65
  });

  it('waits for year 15 when the insured is already old enough', () => {
    expect(overloanEligibleYear(70, 40)).toBe(15);
  });

  it('returns null inside a horizon that reaches neither condition', () => {
    expect(overloanEligibleYear(40, 10)).toBeNull();
  });

  it('is absent rather than "never" when no issue age was supplied', () => {
    const r = runPolicyLoanMechanics(steadyStates(30, 9, 60_000), NATIONWIDE_PARTICIPATING, MERGED_TAX);
    expect(r.overloanEligibleYear).toBeNull();
  });

  it('reports the year and the unsettled tax treatment when it is supplied', () => {
    const r = runPolicyLoanMechanics(steadyStates(30, 9, 60_000), NATIONWIDE_PARTICIPATING, MERGED_TAX, { issueAge: 45 });
    expect(r.overloanEligibleYear).toBe(21);
    expect(r.notes.join(' ')).toContain('neither the IRS nor the courts have ruled');
  });

  it('says the backstop is missing when the lapse lands before it', () => {
    // A flat run with a loan running: it lapses long before year 21.
    const flat = steadyStates(30, 0, 200_000, 900_000);
    const r = runPolicyLoanMechanics(flat, NATIONWIDE_PARTICIPATING, MERGED_TAX, { issueAge: 45 });
    expect(r.summary.lapseYear).not.toBeNull();
    expect(r.summary.lapseYear!).toBeLessThan(21);
    expect(r.notes.join(' ')).toContain('does not exist yet');
  });
});

describe('every rate carries where it came from', () => {
  it('names a source document and a date on each preset', () => {
    for (const t of [NATIONWIDE_DECLARED, NATIONWIDE_PARTICIPATING, SECURIAN_FIXED, SECURIAN_INDEXED, SECURIAN_VARIABLE]) {
      expect(t.source!.length).toBeGreaterThan(40);
      expect(t.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(t.label!.length).toBeGreaterThan(3);
    }
  });

  it('echoes that source onto the result, so a page never prints a bare figure', () => {
    const r = runPolicyLoanMechanics(steadyStates(20, 9, 60_000), NATIONWIDE_PARTICIPATING, MERGED_TAX);
    expect(r.provenance.source).toContain('Nationwide');
    expect(r.provenance.asOf).toBe('2026-03-19');
    expect(r.provenance.label).toBe('Alternative Policy Loan');
  });

  it('describes a stepped rate as a schedule in the carrier-quote list', () => {
    const r = runPolicyLoanMechanics(steadyStates(20, 9, 60_000), NATIONWIDE_DECLARED, MERGED_TAX);
    expect(r.carrierQuoted.join(' ')).toContain('a schedule');
  });

  it('flags the indexed loan account rate as a separate quote', () => {
    const r = runPolicyLoanMechanics(steadyStates(20, 9, 60_000), SECURIAN_INDEXED, MERGED_TAX);
    expect(r.carrierQuoted.join(' ')).toContain("that account's performance, not the policy's");
  });
});

describe('comparing types over one sequence', () => {
  const states = steadyStates(25, 9, 60_000);
  const c = compareLoanTypes(states, [NATIONWIDE_DECLARED, NATIONWIDE_PARTICIPATING], MERGED_TAX);

  it('runs every set of terms over the same policy', () => {
    expect(c.runs).toHaveLength(2);
    expect(c.runs.every((r) => r.result.years.length === 25)).toBe(true);
  });

  it('names the cheapest by the carrier\'s own label, not by type', () => {
    expect([c.cheapest, c.costliest]).toContain('Alternative Policy Loan');
    expect([c.cheapest, c.costliest]).toContain('Declared Rate Loan');
  });

  it('refuses to present the winner as a conclusion', () => {
    expect(c.verdict).toContain('worse sequence');
    expect(c.verdict).toContain('guaranteed column');
  });

  it('says the comparison is stable when no participating loan is in it', () => {
    const stable = compareLoanTypes(states, [NATIONWIDE_DECLARED, SECURIAN_FIXED], MERGED_TAX);
    expect(stable.verdict).toContain('stable across sequences');
  });
});

describe('the carrier registry — four carriers, four machines', () => {
  it('holds all four with a source, a date and notes each', () => {
    expect(CARRIER_LOAN_PROFILES).toHaveLength(4);
    for (const c of CARRIER_LOAN_PROFILES) {
      expect(c.source.length).toBeGreaterThan(20);
      expect(c.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(c.notes.length).toBeGreaterThan(0);
    }
  });

  it('models only the carriers whose participating terms are documented', () => {
    expect(modellableCarriers().map((c) => c.carrier).sort())
      .toEqual(['Nationwide', 'Securian / Minnesota Life']);
  });

  it('marks Pacific Life\'s rates absent rather than inventing them', () => {
    const pl = CARRIER_LOAN_PROFILES.find((c) => c.carrier === 'Pacific Life')!;
    expect(pl.participatingCharged).toBeNull();
    expect(pl.notes.join(' ')).toContain('Policy Distributions 0');
  });

  it('records that the whole life product has no participating loan at all', () => {
    const ll = CARRIER_LOAN_PROFILES.find((c) => c.kind === 'whole_life')!;
    expect(ll.participatingCharged).toBeNull();
    expect(ll.notes.join(' ')).toContain('arbitrage does not exist on this product');
    expect(ll.declaredCredited).toContain('not credited to the cash value');
  });

  it('records the 12-month lockout as triggered by the FIXED loan', () => {
    // Backwards from what anyone expects: taking the safe loan locks you out
    // of the other two for a year. A real sequencing trap.
    const sec = CARRIER_LOAN_PROFILES.find((c) => c.carrier.startsWith('Securian'))!;
    expect(sec.notes.join(' ')).toContain('12-MONTH LOCKOUT');
    expect(sec.notes.join(' ')).toContain('triggered by the FIXED loan');
    expect(sec.notes.join(' ')).toContain('there is no 2% floor');
  });

  it('keeps the collateral in place only on the VARIABLE loan', () => {
    const sec = CARRIER_LOAN_PROFILES.find((c) => c.carrier.startsWith('Securian'))!;
    expect(sec.participatingCredited).toContain('REMAINS in your current fixed or indexed accounts');
    expect(sec.notes.join(' ')).toContain('still moves, just into a different bucket');
  });
});

describe('the disclosure a page renders verbatim', () => {
  it('states that no rate is fixed for the life of the policy', () => {
    expect(LOAN_DISCLOSURE).toContain('is fixed for the life of the policy');
  });

  it('names every carrier whose rates it quotes', () => {
    expect(LOAN_DISCLOSURE).toContain('Nationwide');
    expect(LOAN_DISCLOSURE).toContain('Securian');
  });
});

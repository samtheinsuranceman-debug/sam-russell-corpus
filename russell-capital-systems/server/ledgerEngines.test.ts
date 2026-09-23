/**
 * Ledger-driven IUL and whole-life engines against printed illustration values.
 *
 * The engines are mechanics, not illustrations. These tests check that, fed a
 * carrier's own printed charges (IUL) or guaranteed values and dividends (whole
 * life), the arithmetic reproduces the carrier's printed ledger within the
 * tolerance the engine red-team's reference recursion achieved:
 *   CASE-09 (with and without EVA) 0.5%, CASE-19 1.5%, CASE-14 4%.
 * Loan, rider and lapse tests on these inputs are engine tests only: no case
 * illustrates a loan.
 */
import { describe, expect, it } from 'vitest';
import { runLedgerIul, resolveYearSeries, type LedgerIulInput, type LedgerIulResult } from '../shared/ledgerIulEngine';
import { runLedgerWholeLife, type LedgerWholeLifeInput, type LedgerWholeLifeResult } from '../shared/ledgerWholeLifeEngine';
import { POLICY_DISCLOSURE } from '../shared/policyDisclosure';
import { CASE_09_NO_EVA, CASE_09_WITH_EVA, CASE_10, CASE_11, CASE_14, CASE_15, CASE_16, CASE_19 } from './ledgerEngines.fixtures';

const YEARS = 40;
const pctErr = (a: number, b: number) => ((a - b) / b) * 100;
const MONTHLY_AVERAGE = { chargeDeduction: 'monthly', creditBase: 'averageMonthlyValue' } as const;

function ok(run: ReturnType<typeof runLedgerIul>): LedgerIulResult {
  if (!run.ok) throw new Error(run.reason);
  return run;
}
function okWl(run: ReturnType<typeof runLedgerWholeLife>): LedgerWholeLifeResult {
  if (!run.ok) throw new Error(run.reason);
  return run;
}

type SecurianFixture = typeof CASE_09_WITH_EVA | typeof CASE_09_NO_EVA | typeof CASE_14;

function securianCharges(f: SecurianFixture) {
  return {
    premiumCharge: f.premiumCharge,
    costOfInsurance: f.costOfInsurance,
    policyFees: f.policyIssueCharge,
    riderCharges: f.additionalCharges,
  };
}

function case09(f: typeof CASE_09_WITH_EVA | typeof CASE_09_NO_EVA, extra: Partial<LedgerIulInput> = {}): LedgerIulInput {
  return {
    years: YEARS,
    issueAge: f.issueAge,
    premiums: f.premium,
    charges: securianCharges(f),
    assumedCreditingRatePct: f.illustratedRatePct,
    bonusCreditDollars: f.bonusCredits,
    deathBenefit: { option: 'B', faceAmount: f.faceAmount, switchToOptionAInYear: f.optionBThroughYear + 1 },
    surrenderCharges: f.surrenderChargeDerived,
    ...extra,
  };
}

function case14(extra: Partial<LedgerIulInput> = {}): LedgerIulInput {
  const f = CASE_14;
  return {
    years: YEARS,
    issueAge: f.issueAge,
    premiums: f.premium,
    charges: securianCharges(f),
    assumedCreditingRatePct: f.illustratedRatePct,
    bonusCreditDollars: f.bonusCredits,
    deathBenefit: { option: 'A', faceAmount: f.baseFace, termRider: { faceAmount: f.termAgreementFace, endYear: f.termEndYear } },
    surrenderCharges: f.surrenderChargeDerived,
    ...extra,
  };
}

function case19(extra: Partial<LedgerIulInput> = {}): LedgerIulInput {
  const f = CASE_19;
  return {
    years: YEARS,
    issueAge: f.issueAge,
    premiums: f.premium,
    charges: { premiumCharge: f.premiumCharge, costOfInsurance: f.costOfInsurance, riderCharges: f.adminAndRiderCharges },
    assumedCreditingRatePct: f.illustratedRatePct,
    indexBonusPct: [{ fromYear: 1, toYear: YEARS, value: f.indexBonusPct }],
    deathBenefit: { option: 'A', faceAmount: f.faceAmount },
    surrenderCharges: f.surrenderCharge,
    ...extra,
  };
}

type Printed = Readonly<Record<number, { readonly cv: number; readonly sv: number; readonly db: number }>>;
function maxAbsErr(run: LedgerIulResult, printed: Printed, key: 'cv' | 'sv' | 'db'): number {
  let worst = 0;
  for (const [y, p] of Object.entries(printed)) {
    const row = run.years[Number(y) - 1];
    const v = key === 'cv' ? row.accountValue : key === 'sv' ? row.surrenderValue : row.deathBenefit;
    worst = Math.max(worst, Math.abs(pctErr(v, p[key])));
  }
  return worst;
}

/* ================================================================== *
 * IUL: reproduction of printed values
 * ================================================================== */

describe('ledger IUL engine: default timing is the red-team reference recursion', () => {
  const cases: [string, LedgerIulInput, Readonly<Record<number, number>>][] = [
    ['CASE-09 with EVA', case09(CASE_09_WITH_EVA), CASE_09_WITH_EVA.referenceRecursionCv],
    ['CASE-09 without EVA', case09(CASE_09_NO_EVA), CASE_09_NO_EVA.referenceRecursionCv],
    ['CASE-14', case14(), CASE_14.referenceRecursionCv],
    ['CASE-19', case19(), CASE_19.referenceRecursionCv],
  ];
  for (const [name, input, ref] of cases) {
    it(`${name}: matches the reference recursion to the dollar`, () => {
      const run = ok(runLedgerIul(input));
      for (const [y, v] of Object.entries(ref)) {
        expect(Math.abs(run.years[Number(y) - 1].accountValue - v), `year ${y}`).toBeLessThanOrEqual(1);
      }
    });
  }
});

describe('ledger IUL engine: printed cash values within the red-team tolerance', () => {
  it('CASE-09 with EVA: cash value within 0.5% (achieved about 0.3%)', () => {
    expect(maxAbsErr(ok(runLedgerIul(case09(CASE_09_WITH_EVA))), CASE_09_WITH_EVA.printed, 'cv')).toBeLessThan(0.5);
  });
  it('CASE-09 without EVA: cash value and surrender value within 0.5%', () => {
    const run = ok(runLedgerIul(case09(CASE_09_NO_EVA)));
    expect(maxAbsErr(run, CASE_09_NO_EVA.printed, 'cv')).toBeLessThan(0.5);
    expect(maxAbsErr(run, CASE_09_NO_EVA.printed, 'sv')).toBeLessThan(0.5);
  });
  it('CASE-14: cash value within 4%', () => {
    expect(maxAbsErr(ok(runLedgerIul(case14())), CASE_14.printed, 'cv')).toBeLessThan(4);
  });
  it('CASE-19: cash value within 1.5%, with the 0.75-point index bonus', () => {
    expect(maxAbsErr(ok(runLedgerIul(case19())), CASE_19.printed, 'cv')).toBeLessThan(1.5);
  });

  it('monthly deductions and an average-balance credit close most of the remaining gap', () => {
    const e09 = ok(runLedgerIul(case09(CASE_09_WITH_EVA, { timing: MONTHLY_AVERAGE })));
    const n09 = ok(runLedgerIul(case09(CASE_09_NO_EVA, { timing: MONTHLY_AVERAGE })));
    expect(maxAbsErr(e09, CASE_09_WITH_EVA.printed, 'cv')).toBeLessThan(0.05);
    expect(maxAbsErr(n09, CASE_09_NO_EVA.printed, 'cv')).toBeLessThan(0.05);
    expect(maxAbsErr(n09, CASE_09_NO_EVA.printed, 'sv')).toBeLessThan(0.05);
    const s19 = ok(runLedgerIul(case19({ timing: MONTHLY_AVERAGE })));
    expect(maxAbsErr(s19, CASE_19.printed, 'cv')).toBeLessThan(0.8);
    expect(maxAbsErr(s19, CASE_19.printed, 'sv')).toBeLessThan(1.5);
  });

  it('CASE-14 as illustrated (50% one-year / 50% two-year account): within 1%, and exact in year 1', () => {
    const run = ok(
      runLedgerIul(
        case14({
          timing: MONTHLY_AVERAGE,
          allocation: [
            { sharePct: CASE_14.allocationPct.oneYear, termYears: 1 },
            { sharePct: CASE_14.allocationPct.twoYear, termYears: 2 },
          ],
        }),
      ),
    );
    expect(maxAbsErr(run, CASE_14.printed, 'cv')).toBeLessThan(1);
    expect(maxAbsErr(run, CASE_14.printed, 'sv')).toBeLessThan(1);
    expect(Math.abs(pctErr(run.years[0].accountValue, CASE_14.printed[1].cv))).toBeLessThan(0.05);
    // The two-year half credits nothing in year 1: about half the value is still waiting to mature.
    expect(run.years[0].valueAwaitingMaturity / run.years[0].accountValue).toBeGreaterThan(0.45);
    // Crediting the whole account annually overstates year 1.
    const allAnnual = ok(runLedgerIul(case14({ timing: MONTHLY_AVERAGE })));
    expect(pctErr(allAnnual.years[0].accountValue, CASE_14.printed[1].cv)).toBeGreaterThan(3);
  });
});

describe('ledger IUL engine: the timing convention holds out of sample', () => {
  const oos = (f: typeof CASE_15 | typeof CASE_16, extra: Partial<LedgerIulInput>): LedgerIulInput => ({
    years: f.years,
    issueAge: f.issueAge,
    premiums: f.premium,
    charges: { premiumCharge: f.premiumCharge, costOfInsurance: f.costOfInsurance, policyFees: f.policyIssueCharge, riderCharges: f.additionalCharges },
    assumedCreditingRatePct: f.illustratedRatePct,
    bonusCreditDollars: f.bonusCredits,
    deathBenefit: { option: 'A', faceAmount: f.faceAmount },
    ...extra,
  });
  const worst = (run: LedgerIulResult, printed: Readonly<Record<number, number>>) =>
    Math.max(...Object.entries(printed).map(([y, v]) => Math.abs(pctErr(run.years[Number(y) - 1].accountValue, v))));

  it('CASE-15 (50% one-year / 50% two-year, not used to choose the convention): cash value within 0.2% over years 1-20', () => {
    const alloc = [
      { sharePct: CASE_15.allocationPct.oneYear, termYears: 1 as const },
      { sharePct: CASE_15.allocationPct.twoYear, termYears: 2 as const },
    ];
    const run = ok(runLedgerIul(oos(CASE_15, { timing: MONTHLY_AVERAGE, allocation: alloc })));
    expect(worst(run, CASE_15.printedCv)).toBeLessThan(0.2);
    // The annual one-year default misses by more.
    expect(worst(ok(runLedgerIul(oos(CASE_15, {}))), CASE_15.printedCv)).toBeGreaterThan(1);
  });
  it('CASE-16 (one-year account, not used to choose the convention): cash value within 0.05% over years 1-30', () => {
    expect(worst(ok(runLedgerIul(oos(CASE_16, { timing: MONTHLY_AVERAGE }))), CASE_16.printedCv)).toBeLessThan(0.05);
  });
});

describe('ledger IUL engine: death benefit options, term blend and corridor', () => {
  it('CASE-09: increasing death benefit (face + cash value) through year 30, then level face under the corridor', () => {
    const run = ok(runLedgerIul(case09(CASE_09_WITH_EVA, { timing: MONTHLY_AVERAGE })));
    expect(maxAbsErr(run, CASE_09_WITH_EVA.printed, 'db')).toBeLessThan(0.05);
    const y40 = run.years[39];
    expect(y40.deathBenefit).toBeGreaterThan(y40.accountValue); // corridor, not face + CV
    expect(y40.deathBenefit).toBeLessThan(CASE_09_WITH_EVA.faceAmount + y40.accountValue);
  });
  it('CASE-14: $2.4M while the term agreement is in force, then it drops and the death benefit is the cash value from age 100', () => {
    const run = ok(runLedgerIul(case14()));
    for (const y of [1, 10, 20]) expect(run.years[y - 1].deathBenefit).toBe(CASE_14.printed[y as 1 | 10 | 20].db);
    expect(run.years[19].termRiderInForce).toBe(true);
    expect(run.years[20].termRiderInForce).toBe(false);
    for (const y of [25, 30, 40]) expect(run.years[y - 1].deathBenefit).toBeCloseTo(run.years[y - 1].accountValue, 6);
  });
  it('CASE-19: the corridor lifts the death benefit once cash value is large (printed from year 18)', () => {
    const run = ok(runLedgerIul(case19({ timing: MONTHLY_AVERAGE })));
    for (const y of [20, 25, 30, 40] as const) expect(Math.abs(pctErr(run.years[y - 1].deathBenefit, CASE_19.printed[y].db))).toBeLessThan(0.8);
    expect(run.years[0].deathBenefit).toBe(CASE_19.printed[1].db);
  });
});

/* ================================================================== *
 * IUL: inputs, refusals and flags
 * ================================================================== */

describe('ledger IUL engine: inputs and refusals', () => {
  it('carries the life-policy disclosure line in its notes', () => {
    expect(ok(runLedgerIul(case19())).notes[0]).toBe(POLICY_DISCLOSURE.life);
    expect(okWl(runLedgerWholeLife(synthetic())).notes[0]).toBe(POLICY_DISCLOSURE.life);
  });
  it('refuses to run without charges, and asks for the carrier charges report', () => {
    const run = runLedgerIul({ ...case19(), charges: {} });
    expect(run.ok).toBe(false);
    if (!run.ok) expect(run.reason).toMatch(/charges report/);
  });
  it('refuses a year with no charge supplied', () => {
    const run = runLedgerIul({ ...case19(), charges: { costOfInsurance: CASE_19.costOfInsurance.slice(0, 20) } });
    expect(run.ok).toBe(false);
    if (!run.ok) expect(run.reason).toMatch(/year 21/);
  });
  it('accepts an assumed rate from 0% to 12%, not capped at the illustrated maximum, and flags a rate above it', () => {
    expect(runLedgerIul({ ...case19(), assumedCreditingRatePct: 12.5 }).ok).toBe(false);
    expect(runLedgerIul({ ...case19(), assumedCreditingRatePct: -1 }).ok).toBe(false);
    const hi = ok(runLedgerIul({ ...case19(), indexBonusPct: undefined, assumedCreditingRatePct: 12, illustratedMaximumRatePct: 7.16 }));
    expect(hi.exceedsIllustratedMaximum).toBe(true);
    expect(hi.years[0].effectiveRatePct).toBe(12);
    const lo = ok(runLedgerIul({ ...case19(), indexBonusPct: undefined, assumedCreditingRatePct: 0 }));
    expect(lo.years[0].indexCredits).toBe(0);
    expect(ok(runLedgerIul({ ...case19(), illustratedMaximumRatePct: 7.16 })).exceedsIllustratedMaximum).toBe(false);
  });
  it('an index multiplier scales the rate before the bonus is added', () => {
    const run = ok(runLedgerIul({ ...case19(), indexMultiplier: [{ fromYear: 1, toYear: YEARS, value: 1.1 }] }));
    expect(run.years[0].effectiveRatePct).toBeCloseTo(6.71 * 1.1 + 0.75, 10);
  });
  it('a schedule by year band gives the same result as the equivalent array', () => {
    const bands = [
      { fromYear: 1, toYear: 5, value: 36000 },
      { fromYear: 6, toYear: YEARS, value: 0 },
    ];
    expect(resolveYearSeries(bands, YEARS).values).toEqual(CASE_19.premium.slice(0, YEARS));
    const a = ok(runLedgerIul(case19()));
    const b = ok(runLedgerIul({ ...case19(), premiums: bands }));
    expect(b.years[YEARS - 1].accountValue).toBeCloseTo(a.years[YEARS - 1].accountValue, 6);
  });
  it('refuses a loan-rate year left out, rather than charging or crediting 0%', () => {
    const loan = { type: 'fixed' as const, requests: [10000], limit: { basis: 'loanValue' as const, limitPct: 90 }, interest: 'capitalize' as const };
    const short = runLedgerIul({ ...case19(), loans: { ...loan, chargedRatePct: [{ fromYear: 1, toYear: 10, value: 5 }], creditedOnLoanedPct: [{ fromYear: 1, toYear: YEARS, value: 3 }] } });
    expect(short.ok).toBe(false);
    if (!short.ok) expect(short.reason).toMatch(/loan rate .*year 11/);
    const noCredit = runLedgerIul({ ...case19(), loans: { ...loan, chargedRatePct: [{ fromYear: 1, toYear: YEARS, value: 5 }] } });
    expect(noCredit.ok).toBe(false);
    if (!noCredit.ok) expect(noCredit.reason).toMatch(/credited-on-loaned rate .*year 1\b/);
    // A wash loan may leave the credited rate out: it credits the charged rate.
    expect(runLedgerIul({ ...case19(), loans: { ...loan, type: 'wash', chargedRatePct: [{ fromYear: 1, toYear: YEARS, value: 5 }] } }).ok).toBe(true);
  });
  it('refuses an allocation that does not sum to 100%', () => {
    expect(runLedgerIul({ ...case14(), allocation: [{ sharePct: 60, termYears: 1 }, { sharePct: 60, termYears: 2 }] }).ok).toBe(false);
  });
});

describe('ledger IUL engine: early-value riders', () => {
  it('SVE-style: raises walk-away value only; the loan value keeps the unadjusted charge', () => {
    const run = ok(runLedgerIul(case09(CASE_09_NO_EVA, { earlyValueRider: { kind: 'sve', adjustedSurrenderCharges: [{ fromYear: 1, toYear: YEARS, value: 0 }] } })));
    const y1 = run.years[0];
    expect(y1.surrenderValue).toBeCloseTo(y1.accountValue, 6);
    expect(y1.loanValue).toBeCloseTo(y1.accountValue - CASE_09_NO_EVA.surrenderChargeDerived[0], 6);
    expect(run.notes.join(' ')).toMatch(/non-1035/);
  });
  it('EVA/SVER-style waiver: surrender value equals account value; an unconfirmed loan effect keeps loans on the unadjusted charge and is flagged', () => {
    const unconfirmed = ok(runLedgerIul(case09(CASE_09_NO_EVA, { earlyValueRider: { kind: 'waiver', raisesLoanValue: 'unconfirmed' } })));
    expect(unconfirmed.years[0].surrenderValue).toBeCloseTo(unconfirmed.years[0].accountValue, 6);
    expect(unconfirmed.years[0].loanValue).toBeLessThan(unconfirmed.years[0].accountValue - 20000);
    expect(unconfirmed.loanValueBasisUnconfirmed).toBe(true);
    const confirmed = ok(runLedgerIul(case09(CASE_09_NO_EVA, { earlyValueRider: { kind: 'waiver', raisesLoanValue: 'yes' } })));
    expect(confirmed.years[0].loanValue).toBeCloseTo(confirmed.years[0].accountValue, 6);
    expect(confirmed.loanValueBasisUnconfirmed).toBe(false);
  });
});

describe('ledger IUL engine: a waiver run on an illustration that already carries the waiver', () => {
  it('says the unadjusted schedule must come from the matched illustration without the rider', () => {
    const run = ok(runLedgerIul(case09(CASE_09_WITH_EVA, { earlyValueRider: { kind: 'waiver', raisesLoanValue: 'unconfirmed' } })));
    expect(run.notes.join(' ')).toMatch(/matched illustration without the rider/);
  });
});

describe('ledger IUL engine: loans (engine tests on CASE-09 inputs; no case illustrates a loan)', () => {
  const base = () => case09(CASE_09_WITH_EVA);
  const loan50k = [50000];
  const noLoan = ok(runLedgerIul(base()));

  const fixedTerms = {
    type: 'fixed' as const,
    requests: loan50k,
    chargedRatePct: [{ fromYear: 1, toYear: YEARS, value: 4 }],
    creditedOnLoanedPct: [
      { fromYear: 1, toYear: 10, value: 3 },
      { fromYear: 11, toYear: YEARS, value: 4 },
    ],
    limit: { basis: 'loanValue' as const, limitPct: 90 },
    interest: 'capitalize' as const,
  };

  it('fixed loan: collateral leaves the index and earns 3% in years 1-10 and 4% from year 11', () => {
    const run = ok(runLedgerIul({ ...base(), loans: fixedTerms }));
    const y10 = run.years[9];
    const y11 = run.years[10];
    // The balance at the start of the year is the year-end balance less the interest capitalised.
    expect(y10.collateralCredits / (y10.loanBalance - y10.loanInterestCharged)).toBeCloseTo(0.03, 9);
    expect(y11.collateralCredits / (y11.loanBalance - y11.loanInterestCharged)).toBeCloseTo(0.04, 9);
    expect(y10.loanCollateral).toBeCloseTo(y10.loanBalance, 6);
    // The year-1 request is cut to 90% of the loan value; unpaid interest compounds at 4%.
    expect(run.years[0].loanLimited).toBe(true);
    expect(run.years[29].loanBalance).toBeCloseTo(run.years[0].loanTaken * 1.04 ** 30, 4);
  });

  it('a zero-spread fixed loan still costs the index credit forgone on the borrowed dollars', () => {
    const fixed = ok(runLedgerIul({ ...base(), loans: fixedTerms }));
    const participating = ok(runLedgerIul({ ...base(), loans: { ...fixedTerms, type: 'participating' } }));
    // Same loan, same 4% charge: only where the collateral sits differs.
    expect(fixed.years[29].loanBalance).toBeCloseTo(participating.years[29].loanBalance, 6);
    expect(participating.years[29].netSurrenderValue - fixed.years[29].netSurrenderValue).toBeGreaterThan(100000);
    expect(fixed.years[29].accountValue).toBeLessThan(noLoan.years[29].accountValue);
  });

  it('participating loan: collateral stays indexed, so account value equals the no-loan account value', () => {
    const run = ok(
      runLedgerIul({
        ...base(),
        loans: { type: 'participating', requests: loan50k, chargedRatePct: [{ fromYear: 1, toYear: YEARS, value: 5 }], limit: { basis: 'loanValue', limitPct: 90 }, interest: 'capitalize' },
      }),
    );
    expect(run.years[29].accountValue).toBeCloseTo(noLoan.years[29].accountValue, 4);
    expect(run.years[29].netSurrenderValue).toBeCloseTo(run.years[29].surrenderValue - run.years[29].loanBalance, 6);
    expect(run.years[0].loanBalance).toBeCloseTo(run.years[0].loanTaken * 1.05, 6);
    expect(run.years[0].loanCollateral).toBe(0);
  });

  it('wash loan: credited-on-loaned defaults to the charged rate, so the loan and its collateral move together', () => {
    const run = ok(
      runLedgerIul({
        ...base(),
        loans: { type: 'wash', requests: loan50k, chargedRatePct: [{ fromYear: 1, toYear: YEARS, value: 4 }], limit: { basis: 'accountValue', limitPct: 90 }, interest: 'capitalize' },
      }),
    );
    for (const y of [1, 5, 20]) expect(run.years[y - 1].loanCollateral).toBeCloseTo(run.years[y - 1].loanBalance, 4);
  });

  it('loan limit: a request above the limit is cut back and flagged', () => {
    const run = ok(
      runLedgerIul({
        ...case09(CASE_09_NO_EVA),
        loans: { type: 'fixed', requests: [1_000_000], chargedRatePct: [{ fromYear: 1, toYear: YEARS, value: 5 }], creditedOnLoanedPct: [{ fromYear: 1, toYear: YEARS, value: 3 }], limit: { basis: 'loanValue', limitPct: 45 }, interest: 'paid' },
      }),
    );
    const y1 = run.years[0];
    expect(y1.loanLimited).toBe(true);
    expect(y1.loanTaken).toBeLessThan(0.45 * CASE_09_NO_EVA.printed[1].cv);
    expect(y1.loanInterestPaidInCash).toBeCloseTo(y1.loanTaken * 0.05, 6);
  });

  it('lapse detection: an unpaid loan at a high rate with no crediting lapses the policy, and later years stay lapsed', () => {
    const run = ok(
      runLedgerIul({
        ...base(),
        assumedCreditingRatePct: 0,
        loans: { type: 'participating', requests: [0, 0, 0, 0, 0, 150000], chargedRatePct: [{ fromYear: 1, toYear: YEARS, value: 8 }], limit: { basis: 'loanValue', limitPct: 90 }, interest: 'capitalize' },
        premiums: [60000, 60000, 60000, 60000, 60000],
      }),
    );
    expect(run.lapseYear).not.toBeNull();
    expect(run.lapseReason).toMatch(/loan|charges/);
    expect(run.years[YEARS - 1].lapsed).toBe(true);
    expect(run.years[YEARS - 1].accountValue).toBe(0);
  });

  it('lapse detection: charges larger than the account value lapse the policy', () => {
    const run = ok(runLedgerIul({ ...case14(), premiums: [170000] }));
    expect(run.lapseYear).not.toBeNull();
    expect(run.lapseYear!).toBeLessThan(10);
  });
});

describe('ledger IUL engine: loan interest in a 0% index year', () => {
  const zero = () => case09(CASE_09_WITH_EVA, { assumedCreditingRatePct: 0 });
  const noLoan = ok(runLedgerIul(zero()));
  const band = (v: number) => [{ fromYear: 1, toYear: YEARS, value: v }];
  it('participating: the loan still charges its rate while the index credits nothing', () => {
    const run = ok(runLedgerIul({ ...zero(), loans: { type: 'participating', requests: [20000], chargedRatePct: band(5), limit: { basis: 'loanValue', limitPct: 90 }, interest: 'capitalize' } }));
    expect(run.years[0].indexCredits).toBe(0);
    expect(run.years[0].accountValue).toBeCloseTo(noLoan.years[0].accountValue, 6);
    expect(run.years[0].loanInterestCharged).toBeCloseTo(20000 * 0.05, 6);
    expect(run.years[0].netSurrenderValue).toBeCloseTo(noLoan.years[0].surrenderValue - 21000, 6);
  });
  it('fixed: the collateral earns its credited rate and the loan its charged rate, whatever the index does', () => {
    const run = ok(runLedgerIul({ ...zero(), loans: { type: 'fixed', requests: [20000], chargedRatePct: band(4), creditedOnLoanedPct: band(3), limit: { basis: 'loanValue', limitPct: 90 }, interest: 'capitalize' } }));
    expect(run.years[0].indexCredits).toBe(0);
    expect(run.years[0].collateralCredits).toBeCloseTo(20000 * 0.03, 6);
    expect(run.years[0].loanInterestCharged).toBeCloseTo(20000 * 0.04, 6);
  });
});

/* ================================================================== *
 * Whole life
 * ================================================================== */

type WlFixture = typeof CASE_11 | typeof CASE_10;

/**
 * Guaranteed growth of a paid-up addition's cash value, by policy year, computed
 * from one case's printed lines as
 *   (NCV[t] − guaranteed NCV[t] − dividend[t]) / (NCV[t−1] − guaranteed NCV[t−1]) − 1.
 * Arithmetic on printed lines, not a carrier-published rate. Each case is run
 * with the growth taken from the OTHER case (same insured, age and product), so
 * the check is out of sample.
 */
function puaGrowthFrom(f: WlFixture, throughYear: number): number[] {
  const out: number[] = [0];
  for (let t = 2; t <= throughYear; t += 1) {
    const prior = f.netCashValue[t - 2] - f.guaranteedNetCashValue[t - 2];
    const now = f.netCashValue[t - 1] - f.guaranteedNetCashValue[t - 1] - f.dividend[t - 1];
    out.push((now / prior - 1) * 100);
  }
  return out;
}

/** The illustration's guaranteed column as the guaranteed layer; its premiums are paid inside that column. */
function wlFromIllustration(f: WlFixture, growthPct: number[], years: number, scalePct = 100): LedgerWholeLifeInput {
  return {
    years,
    issueAge: f.issueAge,
    base: { faceAmount: f.baseFace, premium: [300000, 300000, 300000, 300000, 300000], guaranteedCashValue: f.guaranteedNetCashValue.slice(0, years), guaranteedDeathBenefit: f.guaranteedDeathBenefit },
    pua: { cashValueGrowthPct: growthPct },
    dividends: { kind: 'perYear', amounts: f.dividend },
    dividendScalePct: scalePct,
    dividendOption: { kind: 'pua' },
  };
}

describe('ledger whole-life engine: printed values', () => {
  it('CASE-11 (20% base design): net cash value in years 1-12 within 0.05%, with PUA growth from CASE-10', () => {
    const run = okWl(runLedgerWholeLife(wlFromIllustration(CASE_11, puaGrowthFrom(CASE_10, 12), 12)));
    for (let y = 1; y <= 12; y += 1) expect(Math.abs(pctErr(run.years[y - 1].netCashValue, CASE_11.netCashValue[y - 1])), `year ${y}`).toBeLessThan(0.05);
  });
  it('CASE-10 (40% base design): net cash value in years 1-12 within 0.05%, with PUA growth from CASE-11', () => {
    const run = okWl(runLedgerWholeLife(wlFromIllustration(CASE_10, puaGrowthFrom(CASE_11, 12), 12)));
    for (let y = 1; y <= 12; y += 1) expect(Math.abs(pctErr(run.years[y - 1].netCashValue, CASE_10.netCashValue[y - 1])), `year ${y}`).toBeLessThan(0.05);
  });
  it('year 1: net cash value is the guaranteed value plus the dividend', () => {
    const run = okWl(runLedgerWholeLife(wlFromIllustration(CASE_11, puaGrowthFrom(CASE_10, 12), 12)));
    expect(run.years[0].netCashValue).toBe(CASE_11.guaranteedNetCashValue[0] + CASE_11.dividend[0]);
    expect(Math.abs(run.years[0].netCashValue - CASE_11.netCashValue[0])).toBeLessThanOrEqual(1);
  });
});

describe('ledger whole-life engine: 50% dividend-scale stress', () => {
  const g11 = puaGrowthFrom(CASE_10, 12);
  const g10 = puaGrowthFrom(CASE_11, 27);

  it('printed 50%-scale net cash values within 2.5% through year 10', () => {
    const r11 = okWl(runLedgerWholeLife(wlFromIllustration(CASE_11, g11.concat(puaGrowthFrom(CASE_11, 27).slice(12)), 27, 50)));
    for (const y of [5, 7, 10] as const) expect(Math.abs(pctErr(r11.years[y - 1].netCashValue, CASE_11.netCashValueHalfScale[y])), `CASE-11 year ${y}`).toBeLessThan(2.5);
    const r10 = okWl(runLedgerWholeLife(wlFromIllustration(CASE_10, g10, 12, 50)));
    for (const y of [7, 10] as const) expect(Math.abs(pctErr(r10.years[y - 1].netCashValue, CASE_10.netCashValueHalfScale[y])), `CASE-10 year ${y}`).toBeLessThan(2.5);
  });

  it('without a dividend-layer rate the stress overstates later years, and says so', () => {
    const r11 = okWl(runLedgerWholeLife(wlFromIllustration(CASE_11, g11.concat(puaGrowthFrom(CASE_11, 27).slice(12)), 27, 50)));
    const e20 = pctErr(r11.years[19].netCashValue, CASE_11.netCashValueHalfScale[20]);
    expect(e20).toBeGreaterThan(0);
    expect(e20).toBeLessThan(10);
    expect(r11.notes.join(' ')).toMatch(/overstated/);
  });

  it('the base-heavy design loses more to a dividend cut, as the printed 50% scale shows', () => {
    const drop = (f: WlFixture, g: number[]) => {
      const full = okWl(runLedgerWholeLife(wlFromIllustration(f, g, 12, 100))).years[9].netCashValue;
      const half = okWl(runLedgerWholeLife(wlFromIllustration(f, g, 12, 50))).years[9].netCashValue;
      return 1 - half / full;
    };
    const printedDrop = (f: WlFixture) => 1 - f.netCashValueHalfScale[10] / f.netCashValue[9];
    expect(drop(CASE_10, g10)).toBeGreaterThan(drop(CASE_11, g11));
    expect(printedDrop(CASE_10)).toBeGreaterThan(printedDrop(CASE_11));
  });
});

/** A small synthetic design for mechanics tests. Every number is a test input, not a carrier value. */
function synthetic(extra: Partial<LedgerWholeLifeInput> = {}): LedgerWholeLifeInput {
  return {
    years: 20,
    issueAge: 63,
    base: {
      faceAmount: 500000,
      premium: [{ fromYear: 1, toYear: 20, value: 20000 }],
      guaranteedCashValue: Array.from({ length: 20 }, (_, i) => 6000 * (i + 1)),
    },
    termRider: { faceAmount: 250000, premium: [{ fromYear: 1, toYear: 5, value: 500 }], endYear: 5 },
    puaRider: {
      plannedPremium: [{ fromYear: 1, toYear: 5, value: 20000 }],
      cashValuePctOfPremium: [{ fromYear: 1, toYear: 20, value: 95 }],
      rules: { minimumFirstYear: 500, minimumLater: 120, averageCapAfterYear: 7 },
    },
    pua: { cashValueGrowthPct: [{ fromYear: 1, toYear: 20, value: 2 }], facePerDollar: [{ fromYear: 1, toYear: 20, value: 2.5 }] },
    dividends: { kind: 'perYear', amounts: [{ fromYear: 1, toYear: 20, value: 3000 }] },
    dividendOption: { kind: 'pua' },
    ...extra,
  };
}

describe('ledger whole-life engine: mechanics', () => {
  it('refuses without a guaranteed value or a dividend for every year, rather than assuming one', () => {
    const s = synthetic();
    expect(runLedgerWholeLife({ ...s, base: { ...s.base, guaranteedCashValue: [6000, 12000] } }).ok).toBe(false);
    const r = runLedgerWholeLife({ ...s, dividends: { kind: 'perYear', amounts: [3000] } });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/will not assume a dividend/);
  });

  it('refuses a loan-rate year left out, rather than charging 0% interest', () => {
    const r = runLedgerWholeLife(synthetic({ loans: { requests: [0, 10000], ratePct: [{ fromYear: 1, toYear: 7, value: 5 }], interest: 'capitalize', recognition: { kind: 'nonDirect' } } }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/loan rate .*year 8/);
  });

  it('term rider: the death benefit drops when it ends', () => {
    const run = okWl(runLedgerWholeLife(synthetic()));
    expect(run.years[4].termRiderInForce).toBe(true);
    expect(run.years[5].termRiderInForce).toBe(false);
    expect(run.years[4].netDeathBenefit - run.years[5].netDeathBenefit).toBeGreaterThan(240000);
    expect(run.deathBenefitIncludesPuaFace).toBe(true);
  });

  it('dividend options: PUA adds to cash value; cash pays it out', () => {
    const pua = okWl(runLedgerWholeLife(synthetic()));
    const cash = okWl(runLedgerWholeLife(synthetic({ dividendOption: { kind: 'cash' } })));
    expect(cash.years[0].dividendPaidInCash).toBe(3000);
    expect(pua.years[0].netCashValue - cash.years[0].netCashValue).toBeCloseTo(3000, 6);
  });

  it('a dividend scale follows the base face and the PUA value, not one flat % of total cash value', () => {
    const scale = { kind: 'scale', perThousandBaseFace: [{ fromYear: 1, toYear: 20, value: 6 }], onPuaCashValuePct: [{ fromYear: 1, toYear: 20, value: 2 }] } as const;
    const run = okWl(runLedgerWholeLife(synthetic({ dividends: scale })));
    expect(run.years[0].dividend).toBeCloseTo(6 * 500, 6); // no PUA value before year 1 ends
    expect(run.years[1].dividend).toBeCloseTo(6 * 500 + 0.02 * run.years[0].puaCashValue, 6);
    const bigBase = okWl(runLedgerWholeLife(synthetic({ dividends: scale, base: { ...synthetic().base, faceAmount: 1_000_000 } })));
    expect(bigBase.years[0].dividend).toBeCloseTo(2 * run.years[0].dividend, 6);
  });

  it('premium offset: dividends first, then PUA surrender; a failure is flagged and the shortfall is due in cash', () => {
    const run = okWl(runLedgerWholeLife(synthetic({ dividendOption: { kind: 'premiumOffset', fromYear: 6 } })));
    expect(run.years[5].premiumPaidFromValues).toBeCloseTo(20000, 6);
    expect(run.years[5].outOfPocket).toBe(0);
    expect(run.premiumOffsetFailedYear).not.toBeNull();
    const fail = run.premiumOffsetFailedYear!;
    expect(run.years[fail - 1].outOfPocket).toBeGreaterThan(0);
    expect(run.premiumOffsetShortfallTotal).toBeGreaterThan(0);
    // A 50% dividend scale makes offset fail sooner.
    const half = okWl(runLedgerWholeLife(synthetic({ dividendOption: { kind: 'premiumOffset', fromYear: 6 }, dividendScalePct: 50 })));
    expect(half.premiumOffsetFailedYear!).toBeLessThan(fail);
  });

  it('PUA rider: a payment below the minimum closes the rider for good', () => {
    const run = okWl(runLedgerWholeLife(synthetic({ puaRider: { ...synthetic().puaRider!, plannedPremium: [20000, 20000, 100, 20000, 20000] } })));
    expect(run.puaRiderClosedYear).toBe(3);
    expect(run.years[3].puaRiderPremiumAccepted).toBe(0);
    expect(run.years[4].puaRiderPremiumAccepted).toBe(0);
    expect(run.years[4].puaRiderOpen).toBe(false);
  });

  it('PUA rider: after year 7 the maximum is the average of years 1-7, so paying less early lowers later room', () => {
    const plan = [1000, 1000, 1000, 1000, 1000, 1000, 1000, 50000];
    const run = okWl(runLedgerWholeLife(synthetic({ puaRider: { ...synthetic().puaRider!, plannedPremium: plan } })));
    expect(run.years[7].puaRiderPremiumAccepted).toBe(1000);
    expect(run.years[7].puaRiderCapped).toBe(true);
  });

  it('loans: non-direct recognition leaves the dividend unchanged; direct recognition cuts it', () => {
    const loans = { requests: [0, 0, 0, 0, 0, 30000], ratePct: [{ fromYear: 1, toYear: 20, value: 6 }], interest: 'capitalize' as const };
    const none = okWl(runLedgerWholeLife(synthetic({ dividends: { kind: 'scale', perThousandBaseFace: [{ fromYear: 1, toYear: 20, value: 6 }], onPuaCashValuePct: [{ fromYear: 1, toYear: 20, value: 2 }] } })));
    const nd = okWl(runLedgerWholeLife(synthetic({ dividends: { kind: 'scale', perThousandBaseFace: [{ fromYear: 1, toYear: 20, value: 6 }], onPuaCashValuePct: [{ fromYear: 1, toYear: 20, value: 2 }] }, loans: { ...loans, recognition: { kind: 'nonDirect' } } })));
    const dr = okWl(runLedgerWholeLife(synthetic({ dividends: { kind: 'scale', perThousandBaseFace: [{ fromYear: 1, toYear: 20, value: 6 }], onPuaCashValuePct: [{ fromYear: 1, toYear: 20, value: 2 }] }, loans: { ...loans, recognition: { kind: 'direct', loanedDividendRetainedPct: [{ fromYear: 1, toYear: 20, value: 50 }] } } })));
    expect(nd.years[5].dividend).toBeCloseTo(none.years[5].dividend, 6);
    expect(dr.years[5].dividend).toBeLessThan(nd.years[5].dividend);
    expect(nd.years[5].netCashValue).toBeCloseTo(none.years[5].netCashValue - 30000 * 1.06, 6);
  });

  it('loans: a variable rate is a schedule, and an unpaid loan that outgrows the cash value lapses the policy', () => {
    const run = okWl(
      runLedgerWholeLife(
        synthetic({
          dividends: { kind: 'perYear', amounts: [{ fromYear: 1, toYear: 20, value: 0 }] },
          loans: {
            requests: [0, 0, 0, 0, 0, 1_000_000],
            ratePct: [
              { fromYear: 1, toYear: 7, value: 5 },
              { fromYear: 8, toYear: 20, value: 8 },
            ],
            interest: 'capitalize',
            recognition: { kind: 'nonDirect' },
            limitPctOfCashValue: 90,
          },
        }),
      ),
    );
    expect(run.years[6].loanInterest / (run.years[6].loanBalance - run.years[6].loanInterest)).toBeCloseTo(0.05, 6);
    expect(run.years[7].loanInterest / (run.years[7].loanBalance - run.years[7].loanInterest)).toBeCloseTo(0.08, 6);
    expect(run.lapseYear).not.toBeNull();
    expect(run.years[19].lapsed).toBe(true);
  });
});

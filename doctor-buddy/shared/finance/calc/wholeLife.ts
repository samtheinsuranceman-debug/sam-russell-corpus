import { money, pct } from '../format';
import { type CalcDef, type CalcValues, n, b } from './core';
import { runWholeLife, mecGuidance, cashValueIrr, type WholeLifeTerms, type IncomePlan } from '../wholeLife';

/** Terms shared by the banking calculators, assembled from the form. */
function termsFrom(v: CalcValues): WholeLifeTerms {
  return {
    basePremium: n(v, 'base'),
    puaPremium: n(v, 'pua'),
    payYears: Math.round(n(v, 'payYears')),
    guaranteedCashValueByYear: [], scheduleIncludesRiderPua: false,
    approximateBaseIfNoSchedule: true,
    dividendScalePct: n(v, 'dividend'),
    puaEfficiencyPct: n(v, 'puaEfficiency'),
    directRecognition: b(v, 'directRecognition', false),
    dividendOnLoanedPortionPct: n(v, 'loanedDividend'),
    loanRatePct: n(v, 'loanRate'),
  };
}

const DESIGN_FIELDS = [
  { key: 'age', label: 'Issue age', type: 'number' as const, default: 45, min: 18, max: 75 },
  { key: 'base', label: 'Base policy premium', type: 'money' as const, default: 12_000, min: 0,
    help: 'Buys the guaranteed cash value schedule, slowly. Acquisition cost comes out of the first year.' },
  { key: 'pua', label: 'Paid-up additions rider premium', type: 'money' as const, default: 48_000, min: 0,
    help: 'Buys cash value almost immediately, less a load. This is the lever that makes a banking design work.' },
  { key: 'payYears', label: 'Years funded', type: 'years' as const, default: 10, min: 1, max: 40 },
  { key: 'dividend', label: 'Dividend interest rate', type: 'percent' as const, default: 5.9, min: 0, max: 12, step: 0.05,
    help: 'The current declared scale. Not guaranteed — it is a return of surplus declared annually.' },
  { key: 'puaEfficiency', label: 'PUA cash value efficiency', type: 'percent' as const, default: 92, min: 70, max: 100, step: 0.5,
    help: 'Share of a PUA premium that becomes cash value at once. The rest is the rider load, typically 5-10%.' },
  { key: 'loanRate', label: 'Policy loan rate', type: 'percent' as const, default: 5, min: 0, max: 10, step: 0.25 },
  { key: 'directRecognition', label: 'Direct recognition carrier', type: 'toggle' as const, default: false,
    help: 'A direct-recognition carrier pays a different dividend on the borrowed portion. A non-direct-recognition carrier does not — that is the entire basis of "your money keeps working while you spend it".' },
  { key: 'loanedDividend', label: 'Dividend on the borrowed portion', type: 'percent' as const, default: 4.0, min: 0, max: 12, step: 0.05,
    help: 'Only applies under direct recognition.' },
];

export const wholeLifeCalcs: CalcDef[] = [
  {
    id: 'banking-design',
    name: 'Banking Policy Design',
    category: 'Whole Life Banking',
    blurb: 'The base / paid-up-additions split is the whole design. This shows what a given split does to early liquidity, to the break-even year, and to the return on what you actually paid.',
    fields: [
      ...DESIGN_FIELDS,
      { key: 'years', label: 'Project to year', type: 'years', default: 40, min: 5, max: 60 },
    ],
    compute(v: CalcValues) {
      const terms = termsFrom(v);
      const years = Math.round(n(v, 'years'));
      const r = runWholeLife({ terms, issueAge: Math.round(n(v, 'age')), years });
      const mec = mecGuidance(terms.basePremium, terms.puaPremium);
      const irr = cashValueIrr(r.rows);

      const yr1 = r.rows[0];
      const yr5 = r.rows[4];
      const data = r.rows.map(row => ({
        year: row.year,
        cashValue: row.totalCashValue,
        premiums: row.cumulativePremium,
      }));
      const table = r.rows.filter(row => row.year <= 10 || row.year % 5 === 0).map(row => ({
        year: row.year, age: row.age,
        premium: row.premium,
        cumulative: row.cumulativePremium,
        dividend: row.dividend,
        cashValue: row.totalCashValue,
        vsPremium: row.totalCashValue - row.cumulativePremium,
      }));

      return {
        outputs: [
          { label: 'Base share of premium', value: pct(mec.basePct, 0),
            tone: mec.verdict === 'well-designed' ? 'good' : 'bad', hint: mec.message },
          { label: 'Year 1 cash value', value: money(yr1?.totalCashValue ?? 0),
            hint: `against ${money(yr1?.cumulativePremium ?? 0)} paid — ${pct((yr1?.cumulativePremium ?? 0) > 0 ? ((yr1?.totalCashValue ?? 0) / (yr1?.cumulativePremium ?? 1)) * 100 : 0, 0)} of premium available immediately` },
          { label: 'Year 5 cash value', value: money(yr5?.totalCashValue ?? 0),
            hint: `against ${money(yr5?.cumulativePremium ?? 0)} paid` },
          { label: 'Break-even', value: r.breakEvenYear ? `year ${r.breakEvenYear}` : 'not within the projection',
            tone: r.breakEvenYear && r.breakEvenYear <= 7 ? 'good' : 'bad',
            hint: `${r.yearsUnderwater} years where surrendering returns less than was paid in` },
          { label: `Cash value at year ${years}`, value: money(r.finalCashValue), tone: 'key' },
          { label: 'Internal rate of return', value: pct(irr),
            hint: 'on the money you actually paid — not the dividend rate, which is an interest rate applied to a reserve' },
        ],
        chart: { data, xKey: 'year', yFormat: 'moneyShort', series: [
          { key: 'cashValue', label: 'Cash value', color: '#c8a24a' },
          { key: 'premiums', label: 'Premiums paid', color: '#6b7280' },
        ] },
        table: { columns: [
          { key: 'year', label: 'Yr', format: 'number' },
          { key: 'age', label: 'Age', format: 'number' },
          { key: 'premium', label: 'Premium', format: 'money' },
          { key: 'cumulative', label: 'Paid to date', format: 'money' },
          { key: 'dividend', label: 'Dividend', format: 'money' },
          { key: 'cashValue', label: 'Cash value', format: 'money' },
          { key: 'vsPremium', label: 'vs. premium', format: 'money' },
        ], rows: table, maxRows: 16 },
        notes: [
          ...r.notes,
          'The internal rate of return is the number to compare against an alternative. A 5.9% dividend interest rate is not a 5.9% return on your premium — it is applied to a reserve, after the cost of the insurance inside the contract.',
        ],
      };
    },
  },
  {
    id: 'banking-income',
    name: 'Income Sequencing: Basis Before Loans',
    category: 'Whole Life Banking',
    blurb: 'Dividends taken in cash are tax-free until they exhaust your cost basis. Almost every presentation skips that and borrows from day one, which leaves the basis unused — and an unused basis is worth nothing, because the death benefit was tax-free anyway.',
    fields: [
      ...DESIGN_FIELDS,
      { key: 'startYear', label: 'Income starts in policy year', type: 'years', default: 16, min: 2, max: 45 },
      { key: 'incomeYears', label: 'Years of income', type: 'years', default: 25, min: 1, max: 40 },
      { key: 'target', label: 'Annual income target', type: 'money', default: 60_000, min: 0 },
      { key: 'marginalRate', label: 'Marginal rate on taxable dividends', type: 'percent', default: 32, min: 0, max: 55, step: 1 },
    ],
    compute(v: CalcValues) {
      const terms = termsFrom(v);
      const issueAge = Math.round(n(v, 'age'));
      const startYear = Math.round(n(v, 'startYear'));
      const incomeYears = Math.round(n(v, 'incomeYears'));
      const years = Math.max(startYear + incomeYears + 5, 45);
      const plan = (mode: IncomePlan['mode']): IncomePlan => ({
        startYear, years: incomeYears, annualTarget: n(v, 'target'),
        mode, marginalRatePct: n(v, 'marginalRate'),
      });

      const basisFirst = runWholeLife({ terms, issueAge, years, income: plan('basisFirst') });
      const loansOnly = runWholeLife({ terms, issueAge, years, income: plan('loansOnly') });
      const dividendsOnly = runWholeLife({ terms, issueAge, years, income: plan('dividendsOnly') });

      const data = basisFirst.rows.map((row, i) => ({
        year: row.year,
        basisFirst: row.loanBalance,
        loansOnly: loansOnly.rows[i]?.loanBalance ?? 0,
        cashValue: row.totalCashValue,
      }));

      const firstLoanYear = basisFirst.rows.find(r => r.loanDrawn > 0)?.year ?? null;
      const interestSaved = loansOnly.totalLoanInterest - basisFirst.totalLoanInterest;

      return {
        outputs: [
          { label: 'Tax-free cash from basis', value: money(basisFirst.totalTaxFreeCash), tone: 'key',
            hint: 'dividends taken in cash while still inside the premiums you paid — no loan, no interest, no tax' },
          { label: 'First year a loan is needed', value: firstLoanYear ? `year ${firstLoanYear}` : 'never',
            tone: 'good', hint: firstLoanYear ? `${firstLoanYear - startYear} years of income before any borrowing` : 'the dividend alone carried the whole plan' },
          { label: 'Loan interest — basis first', value: money(basisFirst.totalLoanInterest), tone: 'good' },
          { label: 'Loan interest — borrow from day one', value: money(loansOnly.totalLoanInterest), tone: 'bad' },
          { label: 'Interest avoided by sequencing', value: money(interestSaved),
            tone: interestSaved > 0 ? 'key' : 'neutral', hint: 'same policy, same income, different order' },
          { label: 'Dividend only, never borrow', value: money(dividendsOnly.totalSpendable),
            hint: `${money(dividendsOnly.totalSpendable / Math.max(1, incomeYears))} a year on average — the most conservative version` },
          { label: 'Policy status — basis first', value: basisFirst.lapseYear ? `LAPSES year ${basisFirst.lapseYear}` : 'in force',
            tone: basisFirst.lapseYear ? 'bad' : 'good' },
          { label: 'Policy status — loans only', value: loansOnly.lapseYear ? `LAPSES year ${loansOnly.lapseYear}` : 'in force',
            tone: loansOnly.lapseYear ? 'bad' : 'good' },
        ],
        chart: { data, xKey: 'year', yFormat: 'moneyShort', series: [
          { key: 'cashValue', label: 'Cash value', color: '#c8a24a' },
          { key: 'basisFirst', label: 'Loan — basis first', color: '#1d4a3c' },
          { key: 'loansOnly', label: 'Loan — borrow from day one', color: '#9f1239' },
        ] },
        notes: [
          'Dividends taken as paid-up additions are not a taxable event and do not touch the basis. Dividends taken in CASH are a return of premium, tax-free until cumulative cash dividends exceed the premiums paid — after which the excess is ordinary income.',
          'That is why the order matters. Spending the basis first buys years of genuinely tax-free income with no loan interest at all, and it starts the loan later, smaller, and with more collateral behind it.',
          'Past the basis, a loan beats a cash dividend: the loan is not income while the contract stays in force, and the dividend beyond basis is.',
        ],
      };
    },
  },
  {
    id: 'iul-1035-to-whole-life',
    name: '1035 Exchange: Indexed Life into Whole Life',
    category: 'Whole Life Banking',
    blurb: 'Moving indexed cash value into a participating whole life contract. You trade uncapped upside for a contractual schedule and a dividend — and you take a new surrender period and a new cost of insurance at your attained age.',
    fields: [
      { key: 'cashValue', label: 'Indexed policy cash value', type: 'money', default: 400_000, min: 0 },
      { key: 'surrenderCharge', label: 'Surrender charge on the exchange', type: 'money', default: 0, min: 0,
        help: 'A 1035 exchange is tax-free. It is not charge-free — the old policy\'s surrender charge still applies.' },
      { key: 'age', label: 'Attained age', type: 'number', default: 58, min: 18, max: 80 },
      { key: 'iulRate', label: 'Expected indexed credited rate', type: 'percent', default: 6.5, min: 0, max: 15, step: 0.25 },
      { key: 'iulDrag', label: 'Indexed policy charge drag', type: 'percent', default: 1.4, min: 0, max: 6, step: 0.1 },
      { key: 'dividend', label: 'Whole life dividend rate', type: 'percent', default: 5.9, min: 0, max: 12, step: 0.05 },
      { key: 'wlDrag', label: 'Whole life charge drag', type: 'percent', default: 1.1, min: 0, max: 6, step: 0.1,
        help: 'Lower than an indexed policy at the same age, because the mortality charge inside a whole life contract is level rather than rising.' },
      { key: 'years', label: 'Years', type: 'years', default: 25, min: 1, max: 45 },
    ],
    compute(v: CalcValues) {
      const cashValue = n(v, 'cashValue'), charge = n(v, 'surrenderCharge');
      const iulNet = n(v, 'iulRate') - n(v, 'iulDrag');
      const wlNet = n(v, 'dividend') - n(v, 'wlDrag');
      const years = Math.round(n(v, 'years'));
      const transferred = Math.max(0, cashValue - charge);

      const stay = cashValue * Math.pow(1 + iulNet / 100, years);
      const move = transferred * Math.pow(1 + wlNet / 100, years);
      const breakEvenYears = (() => {
        for (let y = 1; y <= 60; y++) {
          if (transferred * Math.pow(1 + wlNet / 100, y) >= cashValue * Math.pow(1 + iulNet / 100, y)) return y;
        }
        return null;
      })();

      const data: Array<Record<string, number>> = [];
      for (let y = 0; y <= years; y++) {
        data.push({
          year: y,
          stay: Math.round(cashValue * Math.pow(1 + iulNet / 100, y)),
          move: Math.round(transferred * Math.pow(1 + wlNet / 100, y)),
        });
      }

      return {
        outputs: [
          { label: 'Transferred after the surrender charge', value: money(transferred),
            tone: charge > 0 ? 'bad' : 'good', hint: charge > 0 ? `${money(charge)} lost on the way out — recovered only if the new contract outperforms` : 'no surrender charge' },
          { label: 'Stay in the indexed policy', value: money(stay), hint: `${pct(iulNet)} net of charges` },
          { label: 'Move to whole life', value: money(move), hint: `${pct(wlNet)} net of charges` },
          { label: move >= stay ? 'Exchange ahead by' : 'Staying ahead by', value: money(Math.abs(move - stay)), tone: 'key' },
          { label: 'Break-even', value: breakEvenYears ? `year ${breakEvenYears}` : 'never at these rates',
            tone: breakEvenYears && breakEvenYears < 10 ? 'good' : 'bad' },
        ],
        chart: { data, xKey: 'year', yFormat: 'moneyShort', series: [
          { key: 'move', label: 'Whole life', color: '#c8a24a' },
          { key: 'stay', label: 'Indexed', color: '#6b7280' },
        ] },
        notes: [
          'A §1035 exchange between life policies is not a taxable event, and the cost basis carries across. It is not free: the old contract\'s surrender charge applies, the new contract starts its own surrender period, and the cost of insurance is underwritten at your attained age — which is the real cost of waiting.',
          'What you are buying is certainty. The whole life column has a contractual guaranteed floor under it and a dividend with a century of payment history behind it. The indexed column has a higher ceiling and a cap the carrier can lower.',
          'A large lump 1035 into a newly issued whole life contract will make it a Modified Endowment Contract unless the face amount is sized for it. Ask the carrier for the MEC premium before the exchange, not after — the classification cannot be reversed.',
          'Do not run this exchange while the old policy has a loan outstanding without checking the tax consequence first. The loan is treated as boot.',
        ],
      };
    },
  },
  {
    id: 'equity-into-policy',
    name: 'Home Equity into a Policy',
    category: 'Whole Life Banking',
    blurb: 'Borrowing against the house to fund a policy. This is the one version of the strategy that usually loses, and the calculator is here to show you where the line actually is.',
    fields: [
      { key: 'amount', label: 'Amount borrowed against the home', type: 'money', default: 250_000, min: 0 },
      { key: 'mortgageRate', label: 'Rate on the borrowing', type: 'percent', default: 6.75, min: 0, max: 15, step: 0.125 },
      { key: 'termYears', label: 'Repayment term', type: 'years', default: 30, min: 5, max: 40 },
      { key: 'deductible', label: 'Interest is deductible', type: 'toggle', default: false,
        help: 'Interest on a cash-out refinance not used to buy, build or substantially improve the home is generally NOT deductible.' },
      { key: 'marginalRate', label: 'Marginal tax rate', type: 'percent', default: 35, min: 0, max: 55, step: 1 },
      { key: 'policyIrr', label: 'Policy internal rate of return', type: 'percent', default: 4.5, min: 0, max: 12, step: 0.1,
        help: 'The long-run IRR on cash value, not the dividend interest rate. Run the design calculator first to get it.' },
      { key: 'years', label: 'Horizon', type: 'years', default: 30, min: 1, max: 45 },
    ],
    compute(v: CalcValues) {
      const amount = n(v, 'amount'), rate = n(v, 'mortgageRate');
      const deductible = b(v, 'deductible', false), mr = n(v, 'marginalRate');
      const policyIrr = n(v, 'policyIrr'), years = Math.round(n(v, 'years'));
      const effectiveRate = deductible ? rate * (1 - mr / 100) : rate;
      const spread = policyIrr - effectiveRate;

      const policyValue = amount * Math.pow(1 + policyIrr / 100, years);
      const debtCost = amount * Math.pow(1 + effectiveRate / 100, years);
      const net = policyValue - debtCost;

      const data: Array<Record<string, number>> = [];
      for (let y = 0; y <= years; y++) {
        data.push({
          year: y,
          policy: Math.round(amount * Math.pow(1 + policyIrr / 100, y)),
          debt: Math.round(amount * Math.pow(1 + effectiveRate / 100, y)),
        });
      }

      return {
        outputs: [
          { label: 'After-tax cost of the borrowing', value: pct(effectiveRate),
            hint: deductible ? `${pct(rate)} less a ${pct(mr, 0)} deduction` : 'no deduction taken' },
          { label: 'Policy internal rate of return', value: pct(policyIrr) },
          { label: 'Spread', value: pct(spread), tone: spread > 0 ? 'good' : 'bad',
            hint: spread > 0 ? 'positive — the policy outgrows the debt' : 'negative — the debt outgrows the policy, every year, with certainty on one side and a non-guaranteed dividend on the other' },
          { label: `Policy value at year ${years}`, value: money(policyValue) },
          { label: 'What the debt compounded to', value: money(debtCost), tone: 'bad' },
          { label: net >= 0 ? 'Net gain' : 'Net loss', value: money(Math.abs(net)),
            tone: net >= 0 ? 'good' : 'bad' },
          { label: 'Break-even borrowing rate', value: pct(policyIrr),
            hint: 'Above this rate the strategy loses. That is the whole test.' },
        ],
        chart: { data, xKey: 'year', yFormat: 'moneyShort', series: [
          { key: 'policy', label: 'Policy value', color: '#c8a24a' },
          { key: 'debt', label: 'Debt owed', color: '#9f1239' },
        ] },
        notes: [
          'This is leverage. You are borrowing at a contractual rate to fund an asset whose return is not contractual — the dividend is declared annually and can fall. The debt cannot.',
          'At current mortgage rates the spread is usually negative and the answer is no. It turns positive on a legacy low-rate mortgage, which is a different question: not "should I borrow to fund this" but "should I pay down 3% debt early instead of funding this". Usually not.',
          'The house is collateral. A strategy that puts the family home behind a non-guaranteed return needs a much better reason than a few points of spread.',
        ],
      };
    },
  },
];

import { money, pct, num } from '../format';
import {
  type CalcDef, type CalcValues, n, s, futureValue, bracketsFor, bracketTax,
  marginalRate, filingField, standardDeductionFor, rmdDivisor,
} from './core';

export const retirementCalcs: CalcDef[] = [
  {
    id: 'retirement-gap',
    name: 'Retirement Income Gap',
    category: 'Retirement',
    blurb: 'The distance between the income you want and the income your current plan produces — in dollars per month, not vague reassurance.',
    fields: [
      { key: 'age', label: 'Current age', type: 'number', default: 45, min: 18, max: 80 },
      { key: 'retireAge', label: 'Retirement age', type: 'number', default: 65, min: 40, max: 80 },
      { key: 'desired', label: 'Desired income (today\'s dollars, per year)', type: 'money', default: 180_000, min: 0 },
      { key: 'socialSecurity', label: 'Social Security (per year)', type: 'money', default: 45_000, min: 0 },
      { key: 'pension', label: 'Pension / other guaranteed income', type: 'money', default: 0, min: 0 },
      { key: 'savings', label: 'Current retirement savings', type: 'money', default: 850_000, min: 0 },
      { key: 'contribution', label: 'Saving each year', type: 'money', default: 40_000, min: 0 },
      { key: 'rate', label: 'Pre-retirement return', type: 'percent', default: 7, min: 0, max: 25, step: 0.25 },
      { key: 'withdrawalRate', label: 'Safe withdrawal rate', type: 'percent', default: 4, min: 1, max: 10, step: 0.1 },
      { key: 'inflation', label: 'Inflation', type: 'percent', default: 3, min: 0, max: 10, step: 0.1 },
    ],
    compute(v: CalcValues) {
      const age = n(v, 'age'), retireAge = n(v, 'retireAge');
      const years = Math.max(0, retireAge - age);
      const desired = n(v, 'desired'), ss = n(v, 'socialSecurity'), pension = n(v, 'pension');
      const savings = n(v, 'savings'), contribution = n(v, 'contribution');
      const rate = n(v, 'rate'), wr = n(v, 'withdrawalRate'), inflation = n(v, 'inflation');

      const inflator = Math.pow(1 + inflation / 100, years);
      const desiredAtRetirement = desired * inflator;
      const guaranteed = (ss + pension) * inflator;
      const needFromPortfolio = Math.max(0, desiredAtRetirement - guaranteed);
      const capitalRequired = wr > 0 ? needFromPortfolio / (wr / 100) : 0;
      const projected = futureValue(savings, contribution, rate, years);
      const gapCapital = capitalRequired - projected;
      const gapIncome = gapCapital * (wr / 100);

      // Extra annual saving that closes the gap.
      const growth = Math.pow(1 + rate / 100, years);
      const annuityFactor = Math.abs(rate) < 1e-9 ? years : (growth - 1) / (rate / 100);
      const extraNeeded = gapCapital > 0 && annuityFactor > 0 ? gapCapital / annuityFactor : 0;

      const data: Array<Record<string, number>> = [];
      for (let y = 0; y <= years; y++) {
        data.push({
          year: age + y,
          projected: Math.round(futureValue(savings, contribution, rate, y)),
          required: Math.round(capitalRequired),
        });
      }

      return {
        outputs: [
          { label: 'Income needed at retirement', value: money(desiredAtRetirement), hint: `${money(desired)} today, inflated ${years} years` },
          { label: 'Capital required', value: money(capitalRequired), tone: 'key' },
          { label: 'Projected savings', value: money(projected) },
          gapCapital > 0
            ? { label: 'Shortfall', value: money(gapCapital), tone: 'bad', hint: `${money(gapIncome / 12)}/month of income you will not have` }
            : { label: 'Surplus', value: money(-gapCapital), tone: 'good' },
          { label: 'Extra to save each year', value: money(Math.max(0, extraNeeded)), tone: extraNeeded > 0 ? 'bad' : 'good' },
        ],
        chart: { data, xKey: 'year', yFormat: 'moneyShort', series: [
          { key: 'projected', label: 'Projected', color: '#c8a24a' },
          { key: 'required', label: 'Required', color: '#9f1239' },
        ] },
      };
    },
  },
  {
    id: 'safe-withdrawal',
    name: 'Withdrawal Survival',
    category: 'Retirement',
    blurb: 'How long a portfolio lasts at a chosen withdrawal rate, with the withdrawal rising for inflation each year.',
    fields: [
      { key: 'balance', label: 'Portfolio balance', type: 'money', default: 2_500_000, min: 0 },
      { key: 'withdrawal', label: 'First-year withdrawal', type: 'money', default: 110_000, min: 0 },
      { key: 'rate', label: 'Annual return', type: 'percent', default: 6, min: -10, max: 25, step: 0.25 },
      { key: 'inflation', label: 'Inflation', type: 'percent', default: 3, min: 0, max: 10, step: 0.1 },
      { key: 'age', label: 'Starting age', type: 'number', default: 65, min: 40, max: 90 },
    ],
    compute(v: CalcValues) {
      const balance0 = n(v, 'balance'), withdrawal0 = n(v, 'withdrawal');
      const rate = n(v, 'rate'), inflation = n(v, 'inflation'), age = n(v, 'age');
      let bal = balance0, draw = withdrawal0, depletedAt: number | null = null;
      const data: Array<Record<string, number>> = [{ year: age, balance: Math.round(bal), withdrawal: Math.round(draw) }];
      for (let y = 1; y <= 45; y++) {
        bal = bal * (1 + rate / 100) - draw;
        if (bal <= 0 && depletedAt === null) { bal = 0; depletedAt = age + y; }
        data.push({ year: age + y, balance: Math.round(Math.max(0, bal)), withdrawal: Math.round(draw) });
        draw *= 1 + inflation / 100;
      }
      const initialRate = balance0 > 0 ? (withdrawal0 / balance0) * 100 : 0;
      return {
        outputs: [
          { label: 'Initial withdrawal rate', value: pct(initialRate), tone: initialRate > 5 ? 'bad' : initialRate > 4 ? 'neutral' : 'good' },
          { label: 'Money runs out', value: depletedAt ? `age ${depletedAt}` : 'not within 45 years', tone: depletedAt && depletedAt < 95 ? 'bad' : 'good' },
          { label: 'Balance at age 90', value: money(data.find(d => d.year === 90)?.balance ?? 0) },
          { label: 'Withdrawal at age 90', value: money(data.find(d => d.year === 90)?.withdrawal ?? 0), hint: 'inflation-adjusted' },
        ],
        chart: { data, xKey: 'year', yFormat: 'moneyShort', series: [{ key: 'balance', label: 'Portfolio', color: '#c8a24a' }] },
        notes: ['This uses a single flat return. Real markets do not, which is exactly what the sequence-of-returns calculator shows.'],
      };
    },
  },
  {
    id: 'rmd-projector',
    name: 'RMD Projector',
    category: 'Retirement',
    blurb: 'Required minimum distributions from age 73, the tax they force, and how large the forced income becomes late in life.',
    fields: [
      { key: 'balance', label: 'Pre-tax retirement balance', type: 'money', default: 2_000_000, min: 0 },
      { key: 'age', label: 'Current age', type: 'number', default: 62, min: 40, max: 90 },
      { key: 'rate', label: 'Annual return', type: 'percent', default: 6, min: 0, max: 20, step: 0.25 },
      { key: 'otherIncome', label: 'Other taxable income in retirement', type: 'money', default: 80_000, min: 0 },
      filingField,
    ],
    compute(v: CalcValues) {
      const balance0 = n(v, 'balance'), age = n(v, 'age'), rate = n(v, 'rate');
      const otherIncome = n(v, 'otherIncome'), filing = s(v, 'filing', 'mfj');
      const brackets = bracketsFor(filing), sd = standardDeductionFor(filing);

      let bal = balance0 * Math.pow(1 + rate / 100, Math.max(0, 73 - age));
      const rows: Array<Record<string, number | string>> = [];
      const data: Array<Record<string, number>> = [];
      let totalRmd = 0, totalTax = 0;
      for (let a = 73; a <= 95; a++) {
        const rmd = bal / rmdDivisor(a);
        const taxable = Math.max(0, otherIncome + rmd - sd);
        const taxAll = bracketTax(taxable, brackets);
        const taxWithout = bracketTax(Math.max(0, otherIncome - sd), brackets);
        const taxOnRmd = taxAll - taxWithout;
        totalRmd += rmd; totalTax += taxOnRmd;
        rows.push({ age: a, balance: Math.round(bal), rmd: Math.round(rmd), tax: Math.round(taxOnRmd), net: Math.round(rmd - taxOnRmd) });
        data.push({ year: a, rmd: Math.round(rmd), tax: Math.round(taxOnRmd) });
        bal = (bal - rmd) * (1 + rate / 100);
      }
      const first = rows[0];
      return {
        outputs: [
          { label: 'Balance at 73', value: money(Number(first.balance)), tone: 'key' },
          { label: 'First RMD', value: money(Number(first.rmd)), hint: `tax of ${money(Number(first.tax))} at ${pct(marginalRate(otherIncome + Number(first.rmd) - sd, brackets), 0)} marginal` },
          { label: 'RMDs through age 95', value: money(totalRmd) },
          { label: 'Tax on those RMDs', value: money(totalTax), tone: 'bad' },
        ],
        chart: { data, xKey: 'year', yFormat: 'moneyShort', series: [
          { key: 'rmd', label: 'RMD', color: '#c8a24a' },
          { key: 'tax', label: 'Tax', color: '#9f1239' },
        ] },
        table: { columns: [
          { key: 'age', label: 'Age', format: 'number' },
          { key: 'balance', label: 'Balance', format: 'money' },
          { key: 'rmd', label: 'RMD', format: 'money' },
          { key: 'tax', label: 'Tax', format: 'money' },
          { key: 'net', label: 'Net to you', format: 'money' },
        ], rows, maxRows: 12 },
        notes: ['RMDs are not optional and they do not care what your income needs are that year. They are the reason a pre-tax-only plan loses control of its own tax bracket at 73.'],
      };
    },
  },
  {
    id: 'social-security-tax',
    name: 'Social Security Taxation',
    category: 'Retirement',
    blurb: 'Provisional income decides how much of your benefit is taxed. Tax-free income sources stay out of that calculation entirely.',
    fields: [
      filingField,
      { key: 'benefit', label: 'Annual Social Security benefit', type: 'money', default: 48_000, min: 0 },
      { key: 'ordinary', label: 'Other taxable income (IRA, pension, wages)', type: 'money', default: 60_000, min: 0 },
      { key: 'taxExempt', label: 'Tax-exempt interest (muni)', type: 'money', default: 0, min: 0 },
      { key: 'taxFree', label: 'Tax-free income (policy loans, Roth)', type: 'money', default: 0, min: 0, help: 'Deliberately excluded from provisional income — that is the point.' },
    ],
    compute(v: CalcValues) {
      const filing = s(v, 'filing', 'mfj');
      const benefit = n(v, 'benefit'), ordinary = n(v, 'ordinary'), muni = n(v, 'taxExempt'), taxFree = n(v, 'taxFree');
      const t1 = filing === 'single' ? 25_000 : 32_000;
      const t2 = filing === 'single' ? 34_000 : 44_000;

      // Provisional income: AGI excluding SS, plus muni interest, plus half the benefit.
      const provisional = ordinary + muni + benefit / 2;
      let taxableBenefit = 0;
      if (provisional > t2) {
        taxableBenefit = Math.min(benefit * 0.85, 0.85 * (provisional - t2) + Math.min(benefit * 0.5, 0.5 * (t2 - t1)));
      } else if (provisional > t1) {
        taxableBenefit = Math.min(benefit * 0.5, 0.5 * (provisional - t1));
      }
      const brackets = bracketsFor(filing), sd = standardDeductionFor(filing);
      const taxable = Math.max(0, ordinary + taxableBenefit - sd);
      const tax = bracketTax(taxable, brackets);
      const totalSpendable = ordinary + benefit + taxFree - tax;

      return {
        outputs: [
          { label: 'Provisional income', value: money(provisional), hint: `thresholds ${money(t1)} / ${money(t2)}` },
          { label: 'Benefit subject to tax', value: money(taxableBenefit), tone: taxableBenefit > 0 ? 'bad' : 'good', hint: pct(benefit > 0 ? (taxableBenefit / benefit) * 100 : 0, 0) + ' of the benefit' },
          { label: 'Federal tax', value: money(tax) },
          { label: 'Total spendable income', value: money(totalSpendable), tone: 'key', hint: taxFree > 0 ? `includes ${money(taxFree)} that never entered the provisional-income test` : undefined },
        ],
        notes: [
          'Policy loans and qualified Roth distributions are excluded from provisional income. Municipal bond interest is not — it is added back specifically for this test.',
          'This is the quiet reason a tax-free income source is worth more than its face value: it moves your whole bracket down, not just its own dollars.',
        ],
      };
    },
  },
  {
    id: 'pension-vs-lump',
    name: 'Pension vs. Lump Sum',
    category: 'Retirement',
    blurb: 'The implied return on taking the pension, against what the lump sum has to earn to beat it.',
    fields: [
      { key: 'lump', label: 'Lump sum offered', type: 'money', default: 900_000, min: 0 },
      { key: 'monthly', label: 'Monthly pension', type: 'money', default: 4_800, min: 0 },
      { key: 'age', label: 'Age at start', type: 'number', default: 62, min: 45, max: 80 },
      { key: 'lifeExpectancy', label: 'Planning to age', type: 'number', default: 88, min: 65, max: 105 },
      { key: 'cola', label: 'Pension COLA', type: 'percent', default: 0, min: 0, max: 6, step: 0.25 },
      { key: 'survivor', label: 'Survivor percentage', type: 'percent', default: 100, min: 0, max: 100, step: 25 },
    ],
    compute(v: CalcValues) {
      const lump = n(v, 'lump'), monthly = n(v, 'monthly'), age = n(v, 'age');
      const to = n(v, 'lifeExpectancy'), cola = n(v, 'cola'), survivor = n(v, 'survivor');
      const years = Math.max(1, to - age);
      let totalPension = 0, annual = monthly * 12;
      for (let y = 0; y < years; y++) { totalPension += annual; annual *= 1 + cola / 100; }

      // Internal rate of return the pension pays on the forgone lump sum.
      const irr = (() => {
        let lo = -0.2, hi = 0.4;
        const pv = (r: number) => {
          let total = 0, a = monthly * 12;
          for (let y = 0; y < years; y++) { total += a / Math.pow(1 + r, y + 1); a *= 1 + cola / 100; }
          return total - lump;
        };
        if (pv(lo) * pv(hi) > 0) return pv(hi) > 0 ? hi : lo;
        for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (pv(lo) * pv(mid) <= 0) hi = mid; else lo = mid; }
        return (lo + hi) / 2;
      })() * 100;

      const breakEvenYears = monthly > 0 ? lump / (monthly * 12) : 0;
      return {
        outputs: [
          { label: 'Pension implied return', value: pct(irr), tone: irr > 6 ? 'good' : irr > 4 ? 'neutral' : 'bad', hint: 'what the lump sum must beat, guaranteed, to be worth taking' },
          { label: 'Total pension paid', value: money(totalPension), hint: `to age ${to}` },
          { label: 'Simple break-even', value: `${num(breakEvenYears, 1)} years`, hint: `age ${num(age + breakEvenYears, 0)}` },
          { label: 'Survivor continuation', value: pct(survivor, 0), tone: survivor >= 75 ? 'good' : 'bad', hint: survivor < 100 ? 'A pension max strategy replaces the lost survivor income with insurance.' : undefined },
        ],
        notes: ['A pension is a bond-like guaranteed stream. Compare its implied return to bonds, not to equities, and then account separately for the fact that it dies with you and cannot be left to anyone.'],
      };
    },
  },
  {
    id: 'roth-conversion',
    name: 'Roth Conversion Analyzer',
    category: 'Retirement',
    blurb: 'Pay the tax now at a known rate, or later at an unknown one. This prices the trade over a full horizon.',
    fields: [
      filingField,
      { key: 'balance', label: 'Pre-tax balance to convert', type: 'money', default: 500_000, min: 0 },
      { key: 'income', label: 'Current taxable income', type: 'money', default: 250_000, min: 0 },
      { key: 'years', label: 'Years until withdrawal', type: 'years', default: 20, min: 1, max: 45 },
      { key: 'rate', label: 'Annual return', type: 'percent', default: 7, min: 0, max: 25, step: 0.25 },
      { key: 'futureRate', label: 'Expected future tax rate', type: 'percent', default: 33, min: 0, max: 60, step: 1 },
      { key: 'payFromOutside', label: 'Pay the conversion tax from outside funds', type: 'toggle', default: true },
    ],
    compute(v: CalcValues) {
      const filing = s(v, 'filing', 'mfj'), balance = n(v, 'balance'), income = n(v, 'income');
      const years = Math.round(n(v, 'years')), rate = n(v, 'rate'), futureRate = n(v, 'futureRate');
      const outside = v['payFromOutside'] === true;
      const brackets = bracketsFor(filing), sd = standardDeductionFor(filing);

      const taxBefore = bracketTax(Math.max(0, income - sd), brackets);
      const taxAfter = bracketTax(Math.max(0, income + balance - sd), brackets);
      const conversionTax = taxAfter - taxBefore;
      const blendedRate = balance > 0 ? (conversionTax / balance) * 100 : 0;
      const topRate = marginalRate(income + balance - sd, brackets);

      const growth = Math.pow(1 + rate / 100, years);
      const rothBase = outside ? balance : balance - conversionTax;
      const rothFinal = rothBase * growth;
      const traditionalFinal = balance * growth * (1 - futureRate / 100);
      // If the tax is paid from outside funds, that money would otherwise have grown too.
      const outsideOpportunity = outside ? conversionTax * growth : 0;
      const rothNet = rothFinal - outsideOpportunity;
      const advantage = rothNet - traditionalFinal;

      const data: Array<Record<string, number>> = [];
      for (let y = 0; y <= years; y++) {
        const g = Math.pow(1 + rate / 100, y);
        data.push({
          year: y,
          roth: Math.round(rothBase * g - (outside ? conversionTax * g : 0)),
          traditional: Math.round(balance * g * (1 - futureRate / 100)),
        });
      }
      return {
        outputs: [
          { label: 'Conversion tax', value: money(conversionTax), tone: 'bad', hint: `${pct(blendedRate, 1)} blended, topping out at ${pct(topRate, 0)}` },
          { label: 'Roth, after ' + years + ' years', value: money(rothFinal), tone: 'good' },
          { label: 'Traditional, after tax', value: money(traditionalFinal) },
          { label: advantage >= 0 ? 'Conversion wins by' : 'Staying put wins by', value: money(Math.abs(advantage)), tone: 'key' },
          { label: 'Break-even future rate', value: pct(blendedRate, 1), hint: 'Convert if you expect a future rate above this.' },
        ],
        chart: { data, xKey: 'year', yFormat: 'moneyShort', series: [
          { key: 'roth', label: 'Roth (net)', color: '#c8a24a' },
          { key: 'traditional', label: 'Traditional (after tax)', color: '#6b7280' },
        ] },
        notes: [
          'Paying the conversion tax from outside funds is almost always better, and this model charges you for the growth those dollars gave up so the comparison stays honest.',
          'A conversion also removes the balance from future RMDs and from the provisional-income test on Social Security. Neither shows up in the headline number above.',
        ],
      };
    },
  },
  {
    id: 'annuity-income',
    name: 'Guaranteed Income Floor',
    category: 'Retirement',
    blurb: 'What a deferred income annuity pays for life, and what share of your essential expenses it covers.',
    fields: [
      { key: 'premium', label: 'Premium', type: 'money', default: 500_000, min: 0 },
      { key: 'age', label: 'Current age', type: 'number', default: 58, min: 40, max: 80 },
      { key: 'incomeAge', label: 'Income starts at age', type: 'number', default: 68, min: 50, max: 85 },
      { key: 'rollup', label: 'Income base roll-up', type: 'percent', default: 7, min: 0, max: 12, step: 0.25, help: 'Guaranteed growth of the benefit base during deferral. It is not a cash value.' },
      { key: 'payoutRate', label: 'Payout rate at income age', type: 'percent', default: 5.5, min: 3, max: 10, step: 0.1 },
      { key: 'essentials', label: 'Essential annual expenses', type: 'money', default: 90_000, min: 0 },
      { key: 'joint', label: 'Joint life', type: 'toggle', default: true },
    ],
    compute(v: CalcValues) {
      const premium = n(v, 'premium'), age = n(v, 'age'), incomeAge = n(v, 'incomeAge');
      const rollup = n(v, 'rollup'), payoutRate = n(v, 'payoutRate'), essentials = n(v, 'essentials');
      const joint = v['joint'] === true;
      const defer = Math.max(0, incomeAge - age);
      const benefitBase = premium * Math.pow(1 + rollup / 100, defer);
      const income = benefitBase * (payoutRate / 100) * (joint ? 0.92 : 1);
      const coverage = essentials > 0 ? (income / essentials) * 100 : 0;
      const breakEvenAge = income > 0 ? incomeAge + premium / income : 0;

      const data: Array<Record<string, number>> = [];
      for (let a = age; a <= 95; a++) {
        const paid = a < incomeAge ? 0 : income * (a - incomeAge + 1);
        data.push({ year: a, cumulativeIncome: Math.round(paid), premium });
      }
      return {
        outputs: [
          { label: 'Benefit base at ' + incomeAge, value: money(benefitBase), hint: 'not a cash value — it only computes income' },
          { label: 'Guaranteed annual income', value: money(income), tone: 'key', hint: joint ? 'joint life, reduced for the second life' : 'single life' },
          { label: 'Monthly', value: money(income / 12) },
          { label: 'Covers essentials', value: pct(coverage, 0), tone: coverage >= 100 ? 'good' : coverage >= 60 ? 'neutral' : 'bad' },
          { label: 'Premium recovered by age', value: num(breakEvenAge, 0) },
        ],
        chart: { data, xKey: 'year', yFormat: 'moneyShort', series: [
          { key: 'cumulativeIncome', label: 'Cumulative income', color: '#c8a24a' },
          { key: 'premium', label: 'Premium paid', color: '#6b7280' },
        ] },
        notes: ['The roll-up rate applies to a benefit base, not to money you can walk away with. Read the surrender value column of any illustration before the income column.'],
      };
    },
  },
];

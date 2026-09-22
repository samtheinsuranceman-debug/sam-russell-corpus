import { money, pct, num } from '../format';
import { type CalcDef, type CalcValues, n, s, futureValue, cagr, bracketsFor, marginalRate, filingField } from './core';

export const growthCalcs: CalcDef[] = [
  {
    id: 'compound-growth',
    name: 'Compound Growth',
    category: 'Growth',
    blurb: 'What a starting balance and an annual contribution become, and how much of the end result is growth rather than your own money.',
    fields: [
      { key: 'start', label: 'Starting balance', type: 'money', default: 100_000, min: 0 },
      { key: 'annual', label: 'Added each year', type: 'money', default: 24_000, min: 0 },
      { key: 'rate', label: 'Annual return', type: 'percent', default: 7, min: -20, max: 40, step: 0.25 },
      { key: 'years', label: 'Years', type: 'years', default: 25, min: 1, max: 60 },
    ],
    compute(v: CalcValues) {
      const start = n(v, 'start'), annual = n(v, 'annual'), rate = n(v, 'rate'), years = Math.round(n(v, 'years'));
      const data: Array<Record<string, number>> = [];
      let balance = start, contributed = start;
      for (let y = 0; y <= years; y++) {
        if (y > 0) { balance = balance * (1 + rate / 100) + annual; contributed += annual; }
        data.push({ year: y, balance: Math.round(balance), contributed: Math.round(contributed) });
      }
      const growth = balance - contributed;
      return {
        outputs: [
          { label: 'Ending balance', value: money(balance), tone: 'key' },
          { label: 'You contributed', value: money(contributed) },
          { label: 'Growth', value: money(growth), tone: growth > 0 ? 'good' : 'bad', hint: `${pct(contributed > 0 ? (growth / contributed) * 100 : 0, 0)} of what you put in` },
          { label: 'Effective annualized', value: pct(cagr(Math.max(start, 1), balance, years)) },
        ],
        chart: { data, xKey: 'year', yFormat: 'moneyShort', series: [
          { key: 'balance', label: 'Balance', color: '#c8a24a' },
          { key: 'contributed', label: 'Your money', color: '#6b7280' },
        ] },
      };
    },
  },
  {
    id: 'cost-of-waiting',
    name: 'Cost of Waiting',
    category: 'Growth',
    blurb: 'The price of starting later. Identical contributions, identical returns — only the start date moves.',
    fields: [
      { key: 'annual', label: 'Annual contribution', type: 'money', default: 30_000, min: 0 },
      { key: 'rate', label: 'Annual return', type: 'percent', default: 7, min: 0, max: 30, step: 0.25 },
      { key: 'horizon', label: 'Years until you need it', type: 'years', default: 30, min: 2, max: 60 },
      { key: 'delay', label: 'Years you delay starting', type: 'years', default: 5, min: 1, max: 25 },
    ],
    compute(v: CalcValues) {
      const annual = n(v, 'annual'), rate = n(v, 'rate'), horizon = Math.round(n(v, 'horizon')), delay = Math.round(n(v, 'delay'));
      const now = futureValue(0, annual, rate, horizon);
      const later = futureValue(0, annual, rate, Math.max(0, horizon - delay));
      const gap = now - later;
      const data: Array<Record<string, number>> = [];
      for (let y = 0; y <= horizon; y++) {
        data.push({
          year: y,
          startNow: Math.round(futureValue(0, annual, rate, y)),
          startLater: Math.round(y <= delay ? 0 : futureValue(0, annual, rate, y - delay)),
        });
      }
      return {
        outputs: [
          { label: 'Start today', value: money(now), tone: 'good' },
          { label: `Start in ${delay} year${delay === 1 ? '' : 's'}`, value: money(later) },
          { label: 'The delay costs', value: money(gap), tone: 'bad', hint: `${money(annual * delay)} of contributions skipped, ${money(gap - annual * delay)} of compounding never earned` },
          { label: 'Cost per month waited', value: money(gap / Math.max(1, delay * 12)) },
        ],
        chart: { data, xKey: 'year', yFormat: 'moneyShort', series: [
          { key: 'startNow', label: 'Start today', color: '#c8a24a' },
          { key: 'startLater', label: `Start in ${delay}y`, color: '#9f1239' },
        ] },
      };
    },
  },
  {
    id: 'inflation-purchasing-power',
    name: 'Purchasing Power',
    category: 'Growth',
    blurb: 'What today\'s dollars actually buy later, and the return you need just to stand still.',
    fields: [
      { key: 'amount', label: 'Amount today', type: 'money', default: 1_000_000, min: 0 },
      { key: 'inflation', label: 'Inflation', type: 'percent', default: 3, min: 0, max: 20, step: 0.1 },
      { key: 'nominal', label: 'Your nominal return', type: 'percent', default: 7, min: -10, max: 30, step: 0.25 },
      { key: 'years', label: 'Years', type: 'years', default: 25, min: 1, max: 60 },
    ],
    compute(v: CalcValues) {
      const amount = n(v, 'amount'), inflation = n(v, 'inflation'), nominal = n(v, 'nominal'), years = Math.round(n(v, 'years'));
      const deflator = Math.pow(1 + inflation / 100, years);
      const realRate = ((1 + nominal / 100) / (1 + inflation / 100) - 1) * 100;
      const nominalEnd = amount * Math.pow(1 + nominal / 100, years);
      const data: Array<Record<string, number>> = [];
      for (let y = 0; y <= years; y++) {
        data.push({
          year: y,
          nominal: Math.round(amount * Math.pow(1 + nominal / 100, y)),
          real: Math.round(amount * Math.pow(1 + realRate / 100, y)),
        });
      }
      return {
        outputs: [
          { label: `${money(amount)} buys this much later`, value: money(amount / deflator), tone: 'bad' },
          { label: 'Real (after-inflation) return', value: pct(realRate), tone: realRate > 0 ? 'good' : 'bad' },
          { label: 'Nominal balance in ' + years + 'y', value: money(nominalEnd) },
          { label: 'In today\'s dollars', value: money(nominalEnd / deflator), tone: 'key' },
        ],
        chart: { data, xKey: 'year', yFormat: 'moneyShort', series: [
          { key: 'nominal', label: 'Nominal', color: '#6b7280' },
          { key: 'real', label: 'Today\'s dollars', color: '#c8a24a' },
        ] },
      };
    },
  },
  {
    id: 'dca-vs-lump',
    name: 'Lump Sum vs. Dollar-Cost Averaging',
    category: 'Growth',
    blurb: 'Deploy it all at once, or spread it over months. Same money, different exposure to the sequence of returns.',
    fields: [
      { key: 'amount', label: 'Amount to invest', type: 'money', default: 500_000, min: 0 },
      { key: 'months', label: 'Spread over (months)', type: 'number', default: 12, min: 2, max: 60 },
      { key: 'rate', label: 'Expected annual return', type: 'percent', default: 8, min: -20, max: 30, step: 0.25 },
      { key: 'years', label: 'Total horizon (years)', type: 'years', default: 20, min: 1, max: 50 },
      { key: 'drawdown', label: 'Drawdown during the spread', type: 'percent', default: -15, min: -60, max: 30, step: 1, help: 'What the market does while you are still deploying. Negative favours averaging in.' },
    ],
    compute(v: CalcValues) {
      const amount = n(v, 'amount'), months = Math.round(n(v, 'months')), rate = n(v, 'rate');
      const years = Math.round(n(v, 'years')), drawdown = n(v, 'drawdown');
      const monthlyDrift = Math.pow(1 + drawdown / 100, 1 / months) - 1;
      const monthlyAfter = Math.pow(1 + rate / 100, 1 / 12) - 1;

      // Lump sum: fully exposed to the drawdown, then compounds for the rest.
      const lumpAtEndOfSpread = amount * (1 + drawdown / 100);
      const remainingMonths = Math.max(0, years * 12 - months);
      const lumpFinal = lumpAtEndOfSpread * Math.pow(1 + monthlyAfter, remainingMonths);

      // DCA: each tranche is exposed only from its own entry point.
      const tranche = amount / months;
      let dcaAtEndOfSpread = 0;
      for (let m = 0; m < months; m++) dcaAtEndOfSpread += tranche * Math.pow(1 + monthlyDrift, months - m - 1);
      const dcaFinal = dcaAtEndOfSpread * Math.pow(1 + monthlyAfter, remainingMonths);

      const diff = lumpFinal - dcaFinal;
      return {
        outputs: [
          { label: 'Lump sum ending value', value: money(lumpFinal), tone: diff >= 0 ? 'good' : 'neutral' },
          { label: 'Averaging in ending value', value: money(dcaFinal), tone: diff < 0 ? 'good' : 'neutral' },
          { label: diff >= 0 ? 'Lump sum wins by' : 'Averaging in wins by', value: money(Math.abs(diff)), tone: 'key' },
          { label: 'Break-even drawdown', value: pct(0), hint: 'Above a flat market the lump sum wins; the deeper the drawdown, the more averaging in pays.' },
        ],
        notes: ['Averaging in wins when the market falls while you are deploying, and loses when it rises. It buys sequence protection, not return.'],
      };
    },
  },
  {
    id: 'rule-of-72',
    name: 'Doubling Time',
    category: 'Growth',
    blurb: 'How long money takes to double at a given rate, and how many doublings a working life buys you.',
    fields: [
      { key: 'rate', label: 'Annual return', type: 'percent', default: 8, min: 0.25, max: 40, step: 0.25 },
      { key: 'amount', label: 'Starting amount', type: 'money', default: 250_000, min: 0 },
      { key: 'years', label: 'Years available', type: 'years', default: 30, min: 1, max: 70 },
    ],
    compute(v: CalcValues) {
      const rate = Math.max(0.01, n(v, 'rate')), amount = n(v, 'amount'), years = Math.round(n(v, 'years'));
      const exact = Math.log(2) / Math.log(1 + rate / 100);
      const doublings = years / exact;
      const table = [] as Array<Record<string, number | string>>;
      for (let d = 1; d <= Math.min(10, Math.ceil(doublings)); d++) {
        table.push({ doubling: d, year: Number((exact * d).toFixed(1)), value: Math.round(amount * Math.pow(2, d)) });
      }
      return {
        outputs: [
          { label: 'Years to double', value: num(exact, 1), tone: 'key' },
          { label: 'Rule of 72 estimate', value: num(72 / rate, 1) },
          { label: `Doublings in ${years} years`, value: num(doublings, 2), tone: 'good' },
          { label: 'Ending amount', value: money(amount * Math.pow(1 + rate / 100, years)) },
        ],
        table: { columns: [
          { key: 'doubling', label: 'Doubling', format: 'number' },
          { key: 'year', label: 'Reached in year', format: 'number' },
          { key: 'value', label: 'Balance', format: 'money' },
        ], rows: table },
      };
    },
  },
  {
    id: 'tax-drag',
    name: 'Tax Drag on a Brokerage Account',
    category: 'Growth',
    blurb: 'What annual taxation of dividends and turnover costs a taxable account against the same return sheltered.',
    fields: [
      filingField,
      { key: 'income', label: 'Other taxable income', type: 'money', default: 400_000, min: 0 },
      { key: 'start', label: 'Starting balance', type: 'money', default: 500_000, min: 0 },
      { key: 'annual', label: 'Added each year', type: 'money', default: 50_000, min: 0 },
      { key: 'rate', label: 'Gross annual return', type: 'percent', default: 8, min: 0, max: 30, step: 0.25 },
      { key: 'taxablePortion', label: 'Share of return taxed each year', type: 'percent', default: 35, min: 0, max: 100, step: 5, help: 'Dividends plus realized turnover. Index funds run low; active strategies run high.' },
      { key: 'years', label: 'Years', type: 'years', default: 25, min: 1, max: 50 },
    ],
    compute(v: CalcValues) {
      const filing = s(v, 'filing', 'mfj'), income = n(v, 'income');
      const start = n(v, 'start'), annual = n(v, 'annual'), rate = n(v, 'rate');
      const taxablePortion = n(v, 'taxablePortion') / 100, years = Math.round(n(v, 'years'));
      const mr = marginalRate(income, bracketsFor(filing));

      let taxed = start, sheltered = start, taxPaid = 0;
      const data: Array<Record<string, number>> = [{ year: 0, taxed: Math.round(taxed), sheltered: Math.round(sheltered) }];
      for (let y = 1; y <= years; y++) {
        const gross = taxed * (rate / 100);
        const tax = gross * taxablePortion * (mr / 100);
        taxPaid += tax;
        taxed = taxed + gross - tax + annual;
        sheltered = sheltered * (1 + rate / 100) + annual;
        data.push({ year: y, taxed: Math.round(taxed), sheltered: Math.round(sheltered) });
      }
      const netRate = cagr(Math.max(start, 1), taxed - annual * years > 0 ? taxed : taxed, years);
      return {
        outputs: [
          { label: 'Marginal rate applied', value: pct(mr, 0) },
          { label: 'Taxable account', value: money(taxed) },
          { label: 'Same return, sheltered', value: money(sheltered), tone: 'good' },
          { label: 'Cost of the drag', value: money(sheltered - taxed), tone: 'bad', hint: `${money(taxPaid)} paid in tax along the way` },
          { label: 'Effective net return', value: pct(netRate), hint: `versus ${pct(rate)} gross` },
        ],
        chart: { data, xKey: 'year', yFormat: 'moneyShort', series: [
          { key: 'sheltered', label: 'Sheltered', color: '#c8a24a' },
          { key: 'taxed', label: 'Taxable', color: '#9f1239' },
        ] },
        notes: ['This is annual drag only. It ignores the capital gains bill still waiting on the taxable account at liquidation, which widens the gap further.'],
      };
    },
  },
  {
    id: 'sequence-risk',
    name: 'Sequence of Returns Risk',
    category: 'Growth',
    blurb: 'The same average return in a different order. In the accumulation phase order does not matter; once you are withdrawing, it decides everything.',
    fields: [
      { key: 'start', label: 'Starting portfolio', type: 'money', default: 2_000_000, min: 0 },
      { key: 'withdrawal', label: 'Annual withdrawal', type: 'money', default: 100_000, min: 0 },
      { key: 'inflation', label: 'Withdrawal increases by', type: 'percent', default: 3, min: 0, max: 10, step: 0.25 },
      { key: 'good', label: 'Good year return', type: 'percent', default: 20, min: 0, max: 60, step: 1 },
      { key: 'bad', label: 'Bad year return', type: 'percent', default: -15, min: -60, max: 0, step: 1 },
      { key: 'years', label: 'Years', type: 'years', default: 30, min: 5, max: 50 },
    ],
    compute(v: CalcValues) {
      const start = n(v, 'start'), withdrawal = n(v, 'withdrawal'), inflation = n(v, 'inflation');
      const good = n(v, 'good'), bad = n(v, 'bad'), years = Math.round(n(v, 'years'));

      // Same multiset of returns, two orderings: losses first, gains first.
      const pattern: number[] = [];
      for (let y = 0; y < years; y++) pattern.push(y % 3 === 0 ? bad : good);
      const lossesFirst = [...pattern].sort((a, x) => a - x);
      const gainsFirst = [...pattern].sort((a, x) => x - a);

      const run = (returns: number[]) => {
        let bal = start, draw = withdrawal, depleted: number | null = null;
        const path: number[] = [];
        for (let y = 0; y < years; y++) {
          bal = bal * (1 + returns[y] / 100) - draw;
          draw *= 1 + inflation / 100;
          if (bal <= 0 && depleted === null) { bal = 0; depleted = y + 1; }
          path.push(Math.round(bal));
        }
        return { end: bal, depleted, path };
      };
      const badFirst = run(lossesFirst);
      const goodFirst = run(gainsFirst);

      const data: Array<Record<string, number>> = [{ year: 0, lossesFirst: start, gainsFirst: start }];
      for (let y = 0; y < years; y++) data.push({ year: y + 1, lossesFirst: badFirst.path[y], gainsFirst: goodFirst.path[y] });

      const avg = pattern.reduce((a, x) => a + x, 0) / pattern.length;
      return {
        outputs: [
          { label: 'Average annual return', value: pct(avg), hint: 'identical in both orderings' },
          { label: 'Bad years first', value: money(badFirst.end), tone: 'bad', hint: badFirst.depleted ? `depleted in year ${badFirst.depleted}` : 'survived' },
          { label: 'Good years first', value: money(goodFirst.end), tone: 'good', hint: goodFirst.depleted ? `depleted in year ${goodFirst.depleted}` : 'survived' },
          { label: 'Difference', value: money(Math.abs(goodFirst.end - badFirst.end)), tone: 'key', hint: 'produced entirely by the order of the returns' },
        ],
        chart: { data, xKey: 'year', yFormat: 'moneyShort', series: [
          { key: 'gainsFirst', label: 'Good years first', color: '#c8a24a' },
          { key: 'lossesFirst', label: 'Bad years first', color: '#9f1239' },
        ] },
        notes: ['This is the case for a floor. An account that cannot post a negative year removes the left tail of this chart entirely.'],
      };
    },
  },
];

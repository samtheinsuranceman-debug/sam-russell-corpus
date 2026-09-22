import { money, pct, num } from '../format';
import { type CalcDef, type CalcValues, n, amortize, levelPayment, futureValue } from './core';

const monthsToText = (m: number) => `${Math.floor(m / 12)}y ${m % 12}m`;

export const debtCalcs: CalcDef[] = [
  {
    id: 'mortgage-killer',
    name: 'Mortgage Killer',
    category: 'Debt & Mortgage',
    blurb: 'What an extra principal payment really buys — and whether the same dollars working somewhere else beat it.',
    fields: [
      { key: 'balance', label: 'Mortgage balance', type: 'money', default: 650_000, min: 0 },
      { key: 'rate', label: 'Interest rate', type: 'percent', default: 6.5, min: 0, max: 20, step: 0.125 },
      { key: 'termYears', label: 'Years remaining', type: 'years', default: 27, min: 1, max: 40 },
      { key: 'extra', label: 'Extra principal each month', type: 'money', default: 1_500, min: 0 },
      { key: 'altReturn', label: 'Return if invested instead', type: 'percent', default: 7, min: 0, max: 25, step: 0.25 },
      { key: 'marginalRate', label: 'Your marginal tax rate', type: 'percent', default: 32, min: 0, max: 55, step: 1 },
      { key: 'deductInterest', label: 'You itemize and deduct the interest', type: 'toggle', default: false },
    ],
    compute(v: CalcValues) {
      const balance = n(v, 'balance'), rate = n(v, 'rate');
      const months = Math.round(n(v, 'termYears') * 12), extra = n(v, 'extra');
      const altReturn = n(v, 'altReturn'), mr = n(v, 'marginalRate');
      const deduct = v['deductInterest'] === true;

      const baseline = amortize(balance, rate, months, 0);
      const accelerated = amortize(balance, rate, months, extra);
      const baseInterest = baseline.reduce((a, r) => a + r.interest, 0);
      const accelInterest = accelerated.reduce((a, r) => a + r.interest, 0);
      const saved = baseInterest - accelInterest;
      const monthsSaved = baseline.length - accelerated.length;

      // After-tax cost of the debt is the honest hurdle rate.
      const effectiveRate = deduct ? rate * (1 - mr / 100) : rate;
      // The same extra dollars invested for the baseline term, then compared.
      const investedYears = baseline.length / 12;
      const invested = futureValue(0, extra * 12, altReturn, investedYears);
      // Paying early also frees the whole payment once the loan is gone.
      const payment = levelPayment(balance, rate, months);
      const freedYears = monthsSaved / 12;
      const freedValue = futureValue(0, (payment + extra) * 12, altReturn, freedYears);

      const data: Array<Record<string, number>> = [];
      const step = Math.max(1, Math.round(baseline.length / 60));
      for (let i = 0; i < baseline.length; i += step) {
        data.push({
          year: Number((baseline[i].month / 12).toFixed(1)),
          baseline: Math.round(baseline[i].balance),
          accelerated: Math.round(accelerated[i]?.balance ?? 0),
        });
      }

      return {
        outputs: [
          { label: 'Payment', value: money(payment), hint: `plus ${money(extra)} extra` },
          { label: 'Paid off in', value: monthsToText(accelerated.length), tone: 'key', hint: `${monthsToText(monthsSaved)} sooner` },
          { label: 'Interest saved', value: money(saved), tone: 'good' },
          { label: 'After-tax cost of the debt', value: pct(effectiveRate), hint: deduct ? 'interest deduction applied' : 'no deduction taken' },
          { label: 'Same money invested instead', value: money(invested), tone: invested > saved ? 'good' : 'neutral', hint: `at ${pct(altReturn)} over ${num(investedYears, 1)} years` },
          { label: 'Payoff, then invest the freed payment', value: money(freedValue), hint: `${money(payment + extra)}/mo for ${num(freedYears, 1)} years after payoff` },
        ],
        chart: { data, xKey: 'year', yFormat: 'moneyShort', series: [
          { key: 'baseline', label: 'Minimum payment', color: '#6b7280' },
          { key: 'accelerated', label: 'With extra principal', color: '#c8a24a' },
        ] },
        notes: [
          `The comparison that matters is ${pct(effectiveRate)} guaranteed against ${pct(altReturn)} uncertain. Paying down a mortgage is a risk-free return equal to its after-tax rate.`,
          'Equity in a house is illiquid and does not care that you need it. A strategy that kills the mortgage without stranding the capital is the one worth building.',
        ],
      };
    },
  },
  {
    id: 'mortgage-recast-vs-refi',
    name: 'Recast vs. Refinance',
    category: 'Debt & Mortgage',
    blurb: 'A lump sum against the principal, re-amortized at the old rate, versus a new loan at a new one.',
    fields: [
      { key: 'balance', label: 'Current balance', type: 'money', default: 600_000, min: 0 },
      { key: 'rate', label: 'Current rate', type: 'percent', default: 6.75, min: 0, max: 20, step: 0.125 },
      { key: 'months', label: 'Months remaining', type: 'number', default: 300, min: 12, max: 480 },
      { key: 'lump', label: 'Lump sum available', type: 'money', default: 150_000, min: 0 },
      { key: 'newRate', label: 'Refinance rate', type: 'percent', default: 5.875, min: 0, max: 20, step: 0.125 },
      { key: 'newTerm', label: 'Refinance term (years)', type: 'years', default: 30, min: 5, max: 40 },
      { key: 'closingCosts', label: 'Closing costs', type: 'money', default: 9_000, min: 0 },
      { key: 'recastFee', label: 'Recast fee', type: 'money', default: 350, min: 0 },
    ],
    compute(v: CalcValues) {
      const balance = n(v, 'balance'), rate = n(v, 'rate'), months = Math.round(n(v, 'months'));
      const lump = n(v, 'lump'), newRate = n(v, 'newRate');
      const newTerm = Math.round(n(v, 'newTerm') * 12);
      const closing = n(v, 'closingCosts'), recastFee = n(v, 'recastFee');

      const currentPayment = levelPayment(balance, rate, months);
      const recastPayment = levelPayment(balance - lump, rate, months);
      const refiPayment = levelPayment(balance + closing, newRate, newTerm);
      const refiWithLump = levelPayment(balance - lump + closing, newRate, newTerm);

      const currentInterest = amortize(balance, rate, months).reduce((a, r) => a + r.interest, 0);
      const recastInterest = amortize(balance - lump, rate, months).reduce((a, r) => a + r.interest, 0) + recastFee;
      const refiInterest = amortize(balance + closing, newRate, newTerm).reduce((a, r) => a + r.interest, 0);
      const refiLumpInterest = amortize(balance - lump + closing, newRate, newTerm).reduce((a, r) => a + r.interest, 0);

      const breakEvenMonths = currentPayment > refiPayment ? closing / (currentPayment - refiPayment) : Infinity;

      return {
        outputs: [
          { label: 'Current payment', value: money(currentPayment), hint: `${money(currentInterest)} interest remaining` },
          { label: 'Recast payment', value: money(recastPayment), hint: `saves ${money(currentInterest - recastInterest)} in interest, same rate, same payoff date` },
          { label: 'Refinance payment', value: money(refiPayment), hint: `${money(refiInterest)} total interest over ${newTerm / 12} years` },
          { label: 'Refinance + lump sum', value: money(refiWithLump), tone: 'key', hint: `${money(refiLumpInterest)} total interest` },
          { label: 'Refinance break-even', value: Number.isFinite(breakEvenMonths) ? monthsToText(Math.ceil(breakEvenMonths)) : 'never', tone: breakEvenMonths < 36 ? 'good' : 'bad' },
        ],
        notes: [
          'A recast keeps your rate and your payoff date and just lowers the payment. A refinance resets the clock — a lower payment on a longer term is often more total interest, not less.',
          'Neither is right if you will move before the break-even. That date is the whole decision.',
        ],
      };
    },
  },
  {
    id: 'debt-payoff',
    name: 'Avalanche vs. Snowball',
    category: 'Debt & Mortgage',
    blurb: 'Highest rate first costs the least. Smallest balance first finishes fastest. This prices the difference.',
    fields: [
      { key: 'd1Balance', label: 'Debt 1 balance', type: 'money', default: 18_000, min: 0 },
      { key: 'd1Rate', label: 'Debt 1 rate', type: 'percent', default: 24.99, min: 0, max: 40, step: 0.01 },
      { key: 'd2Balance', label: 'Debt 2 balance', type: 'money', default: 6_500, min: 0 },
      { key: 'd2Rate', label: 'Debt 2 rate', type: 'percent', default: 11.5, min: 0, max: 40, step: 0.01 },
      { key: 'd3Balance', label: 'Debt 3 balance', type: 'money', default: 42_000, min: 0 },
      { key: 'd3Rate', label: 'Debt 3 rate', type: 'percent', default: 7.25, min: 0, max: 40, step: 0.01 },
      { key: 'payment', label: 'Total monthly payment', type: 'money', default: 2_000, min: 0 },
    ],
    compute(v: CalcValues) {
      type Debt = { balance: number; rate: number; label: string };
      const debts: Debt[] = [
        { balance: n(v, 'd1Balance'), rate: n(v, 'd1Rate'), label: 'Debt 1' },
        { balance: n(v, 'd2Balance'), rate: n(v, 'd2Rate'), label: 'Debt 2' },
        { balance: n(v, 'd3Balance'), rate: n(v, 'd3Rate'), label: 'Debt 3' },
      ].filter(d => d.balance > 0);
      const payment = n(v, 'payment');

      const run = (order: Debt[]) => {
        const state = order.map(d => ({ ...d }));
        // Minimums: 2% of balance, floor $25 — the usual card convention.
        let months = 0, interestPaid = 0;
        const firstPayoff: Record<string, number> = {};
        while (state.some(d => d.balance > 0.01) && months < 600) {
          months++;
          let budget = payment;
          for (const d of state) {
            if (d.balance <= 0) continue;
            const interest = d.balance * (d.rate / 100 / 12);
            d.balance += interest;
            interestPaid += interest;
          }
          // Minimums first, then everything left onto the target.
          for (const d of state) {
            if (d.balance <= 0) continue;
            const min = Math.min(d.balance, Math.max(25, d.balance * 0.02));
            const pay = Math.min(min, budget);
            d.balance -= pay; budget -= pay;
            if (d.balance <= 0.01 && !firstPayoff[d.label]) firstPayoff[d.label] = months;
          }
          for (const d of state) {
            if (budget <= 0) break;
            if (d.balance <= 0) continue;
            const pay = Math.min(d.balance, budget);
            d.balance -= pay; budget -= pay;
            if (d.balance <= 0.01 && !firstPayoff[d.label]) firstPayoff[d.label] = months;
          }
        }
        return { months, interestPaid, firstPayoff };
      };

      const avalanche = run([...debts].sort((a, x) => x.rate - a.rate));
      const snowball = run([...debts].sort((a, x) => a.balance - x.balance));
      const total = debts.reduce((a, d) => a + d.balance, 0);
      const firstWinSnow = Math.min(...Object.values(snowball.firstPayoff).concat([999]));
      const firstWinAval = Math.min(...Object.values(avalanche.firstPayoff).concat([999]));

      return {
        outputs: [
          { label: 'Total debt', value: money(total) },
          { label: 'Avalanche (highest rate first)', value: monthsToText(avalanche.months), tone: 'good', hint: `${money(avalanche.interestPaid)} interest` },
          { label: 'Snowball (smallest balance first)', value: monthsToText(snowball.months), hint: `${money(snowball.interestPaid)} interest` },
          { label: 'Avalanche saves', value: money(snowball.interestPaid - avalanche.interestPaid), tone: 'key' },
          { label: 'First debt gone', value: `${firstWinSnow}mo snowball vs ${firstWinAval}mo avalanche`, hint: 'the behavioural argument for snowball, priced' },
        ],
        notes: ['If the interest difference is small and you have quit before, take the snowball. A mathematically optimal plan you abandon in month four returns zero.'],
      };
    },
  },
  {
    id: 'student-loan',
    name: 'Student Loan: PSLF vs. Payoff',
    category: 'Debt & Mortgage',
    blurb: 'Ten years of income-driven payments and forgiveness, against paying the balance down aggressively.',
    fields: [
      { key: 'balance', label: 'Loan balance', type: 'money', default: 285_000, min: 0 },
      { key: 'rate', label: 'Interest rate', type: 'percent', default: 6.8, min: 0, max: 15, step: 0.125 },
      { key: 'agi', label: 'Adjusted gross income', type: 'money', default: 145_000, min: 0 },
      { key: 'familySize', label: 'Family size', type: 'number', default: 3, min: 1, max: 10 },
      { key: 'paymentsMade', label: 'Qualifying payments already made', type: 'number', default: 36, min: 0, max: 120 },
      { key: 'growth', label: 'Expected income growth', type: 'percent', default: 4, min: 0, max: 15, step: 0.5 },
      { key: 'aggressivePayment', label: 'Aggressive monthly payment', type: 'money', default: 3_500, min: 0 },
    ],
    compute(v: CalcValues) {
      const balance = n(v, 'balance'), rate = n(v, 'rate'), agi0 = n(v, 'agi');
      const family = Math.max(1, Math.round(n(v, 'familySize')));
      const made = Math.round(n(v, 'paymentsMade')), growth = n(v, 'growth');
      const aggressive = n(v, 'aggressivePayment');

      // 2025 federal poverty guideline, 48 states.
      const poverty = 15_650 + (family - 1) * 5_500;
      const remaining = Math.max(0, 120 - made);

      // SAVE-style 10% of discretionary income above 225% of poverty.
      let agi = agi0, bal = balance, paid = 0;
      for (let m = 0; m < remaining; m++) {
        const discretionary = Math.max(0, agi - poverty * 2.25);
        const payment = discretionary * 0.10 / 12;
        const interest = bal * (rate / 100 / 12);
        bal = bal + interest - payment;
        paid += payment;
        if (m % 12 === 11) agi *= 1 + growth / 100;
      }
      const forgiven = Math.max(0, bal);

      const aggressiveRows = amortize(balance, rate, 360, Math.max(0, aggressive - levelPayment(balance, rate, 360)));
      const aggressiveTotal = aggressiveRows.reduce((a, r) => a + r.payment, 0);

      return {
        outputs: [
          { label: 'Qualifying payments remaining', value: `${remaining} (${num(remaining / 12, 1)} years)` },
          { label: 'Paid under income-driven plan', value: money(paid), tone: 'good' },
          { label: 'Forgiven at month 120', value: money(forgiven), tone: forgiven > 0 ? 'key' : 'neutral', hint: 'tax-free under PSLF' },
          { label: 'Aggressive payoff total', value: money(aggressiveTotal), hint: `${monthsToText(aggressiveRows.length)} at ${money(aggressive)}/mo` },
          { label: 'PSLF advantage', value: money(aggressiveTotal - paid), tone: aggressiveTotal > paid ? 'good' : 'bad' },
        ],
        notes: [
          'PSLF requires qualifying employment for every one of the 120 payments. Leaving a qualifying employer at payment 110 converts the entire remaining balance back into your problem.',
          'Pre-tax retirement contributions lower AGI, which lowers the income-driven payment, which increases the amount forgiven. On a PSLF track, maximising deferrals is worth more than it looks.',
        ],
      };
    },
  },
  {
    id: 'lease-vs-buy',
    name: 'Lease vs. Buy',
    category: 'Debt & Mortgage',
    blurb: 'Total cost of control over a fixed horizon, including what you own at the end of it.',
    fields: [
      { key: 'price', label: 'Purchase price', type: 'money', default: 78_000, min: 0 },
      { key: 'down', label: 'Down payment', type: 'money', default: 15_000, min: 0 },
      { key: 'loanRate', label: 'Loan rate', type: 'percent', default: 7.25, min: 0, max: 25, step: 0.125 },
      { key: 'loanYears', label: 'Loan term (years)', type: 'years', default: 5, min: 1, max: 8 },
      { key: 'leasePayment', label: 'Lease payment', type: 'money', default: 950, min: 0 },
      { key: 'leaseDown', label: 'Lease due at signing', type: 'money', default: 5_000, min: 0 },
      { key: 'years', label: 'Horizon (years)', type: 'years', default: 6, min: 1, max: 12 },
      { key: 'residual', label: 'Value retained at horizon', type: 'percent', default: 42, min: 0, max: 100, step: 1 },
      { key: 'altReturn', label: 'Return on money not spent', type: 'percent', default: 6, min: 0, max: 20, step: 0.25 },
    ],
    compute(v: CalcValues) {
      const price = n(v, 'price'), down = n(v, 'down'), loanRate = n(v, 'loanRate');
      const loanYears = n(v, 'loanYears'), leasePayment = n(v, 'leasePayment'), leaseDown = n(v, 'leaseDown');
      const years = n(v, 'years'), residual = n(v, 'residual'), altReturn = n(v, 'altReturn');

      const loanPayment = levelPayment(price - down, loanRate, loanYears * 12);
      const buyPayments = loanPayment * Math.min(years, loanYears) * 12;
      const buyTotal = down + buyPayments;
      const retained = price * (residual / 100);
      const buyNet = buyTotal - retained;

      const leaseTotal = leaseDown * Math.ceil(years / 3) + leasePayment * years * 12;

      // Opportunity cost on the larger up-front outlay.
      const outlayDiff = down - leaseDown;
      const opportunity = outlayDiff > 0 ? outlayDiff * (Math.pow(1 + altReturn / 100, years) - 1) : 0;

      return {
        outputs: [
          { label: 'Loan payment', value: money(loanPayment) },
          { label: 'Buying, net of what you keep', value: money(buyNet + opportunity), tone: buyNet + opportunity < leaseTotal ? 'good' : 'neutral', hint: `${money(buyTotal)} out, ${money(retained)} still yours` },
          { label: 'Leasing over ' + years + ' years', value: money(leaseTotal), tone: leaseTotal < buyNet + opportunity ? 'good' : 'neutral', hint: 'nothing retained' },
          { label: 'Difference', value: money(Math.abs(leaseTotal - buyNet - opportunity)), tone: 'key' },
        ],
        notes: ['Leasing wins on short horizons and loses badly on long ones, because it never stops. The break-even is almost always somewhere around the end of the loan term.'],
      };
    },
  },
];

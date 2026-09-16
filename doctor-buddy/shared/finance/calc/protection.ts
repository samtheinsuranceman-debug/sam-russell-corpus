import { money, pct, num } from '../format';
import { type CalcDef, type CalcValues, n, s, b, futureValue, bracketsFor, bracketTax, filingField, standardDeductionFor } from './core';

export const protectionCalcs: CalcDef[] = [
  {
    id: 'life-insurance-need',
    name: 'Life Insurance Need (DIME)',
    category: 'Protection',
    blurb: 'Debt, income replacement, mortgage, education — the four obligations that do not disappear when you do.',
    fields: [
      { key: 'income', label: 'Annual income to replace', type: 'money', default: 300_000, min: 0 },
      { key: 'replaceYears', label: 'Years to replace it', type: 'years', default: 18, min: 1, max: 40 },
      { key: 'mortgage', label: 'Mortgage balance', type: 'money', default: 620_000, min: 0 },
      { key: 'otherDebt', label: 'Other debt', type: 'money', default: 75_000, min: 0 },
      { key: 'education', label: 'Education funding', type: 'money', default: 400_000, min: 0 },
      { key: 'final', label: 'Final expenses', type: 'money', default: 35_000, min: 0 },
      { key: 'existing', label: 'Existing coverage', type: 'money', default: 1_000_000, min: 0 },
      { key: 'liquid', label: 'Liquid assets available', type: 'money', default: 350_000, min: 0 },
      { key: 'discount', label: 'Return on the death benefit', type: 'percent', default: 4.5, min: 0, max: 12, step: 0.25 },
    ],
    compute(v: CalcValues) {
      const income = n(v, 'income'), yearsToReplace = Math.round(n(v, 'replaceYears'));
      const mortgage = n(v, 'mortgage'), otherDebt = n(v, 'otherDebt');
      const education = n(v, 'education'), final = n(v, 'final');
      const existing = n(v, 'existing'), liquid = n(v, 'liquid'), discount = n(v, 'discount');

      // Present value of the income stream, not a naive multiple.
      const r = discount / 100;
      const pvIncome = Math.abs(r) < 1e-9
        ? income * yearsToReplace
        : income * ((1 - Math.pow(1 + r, -yearsToReplace)) / r);

      const gross = pvIncome + mortgage + otherDebt + education + final;
      const need = Math.max(0, gross - existing - liquid);

      return {
        outputs: [
          { label: 'Income replacement (present value)', value: money(pvIncome), hint: `${money(income)} for ${yearsToReplace} years, discounted at ${pct(discount)}` },
          { label: 'Debt and mortgage', value: money(mortgage + otherDebt) },
          { label: 'Education and final expenses', value: money(education + final) },
          { label: 'Total obligation', value: money(gross), tone: 'key' },
          { label: 'Already covered', value: money(existing + liquid), tone: 'good' },
          { label: 'Coverage gap', value: money(need), tone: need > 0 ? 'bad' : 'good', hint: need > 0 ? `${num(need / Math.max(1, income), 1)}× your income, uninsured` : 'fully covered' },
        ],
        notes: ['A present-value calculation is the honest one. A "10× income" rule of thumb is either far too much or nowhere near enough, and it is never right by accident.'],
      };
    },
  },
  {
    id: 'term-vs-permanent',
    name: 'Term vs. Permanent',
    category: 'Protection',
    blurb: 'Buy term and invest the difference, run against the same money inside a permanent contract — including what happens when the term expires.',
    fields: [
      { key: 'face', label: 'Death benefit', type: 'money', default: 2_000_000, min: 0 },
      { key: 'age', label: 'Current age', type: 'number', default: 42, min: 18, max: 75 },
      { key: 'termPremium', label: 'Annual term premium', type: 'money', default: 2_400, min: 0 },
      { key: 'termYears', label: 'Term length', type: 'years', default: 20, min: 10, max: 30 },
      { key: 'permPremium', label: 'Annual permanent premium', type: 'money', default: 24_000, min: 0 },
      { key: 'investReturn', label: 'Return on the difference', type: 'percent', default: 7, min: 0, max: 25, step: 0.25 },
      { key: 'taxRate', label: 'Tax on that return each year', type: 'percent', default: 22, min: 0, max: 50, step: 1 },
      { key: 'permCashValue', label: 'Permanent cash value at term expiry', type: 'money', default: 520_000, min: 0 },
      { key: 'horizon', label: 'Compare to age', type: 'number', default: 85, min: 60, max: 100 },
    ],
    compute(v: CalcValues) {
      const face = n(v, 'face'), age = n(v, 'age');
      const termPremium = n(v, 'termPremium'), termYears = Math.round(n(v, 'termYears'));
      const permPremium = n(v, 'permPremium'), investReturn = n(v, 'investReturn');
      const taxRate = n(v, 'taxRate'), permCV = n(v, 'permCashValue'), horizon = n(v, 'horizon');

      const difference = Math.max(0, permPremium - termPremium);
      const netReturn = investReturn * (1 - taxRate / 100);
      const investedAtExpiry = futureValue(0, difference, netReturn, termYears);
      const yearsAfter = Math.max(0, horizon - age - termYears);
      const investedAtHorizon = investedAtExpiry * Math.pow(1 + netReturn / 100, yearsAfter);

      return {
        outputs: [
          { label: 'Premium difference', value: money(difference), hint: 'per year, invested' },
          { label: 'After-tax return used', value: pct(netReturn), hint: `${pct(investReturn)} gross, taxed at ${pct(taxRate, 0)}` },
          { label: `Invested difference at age ${age + termYears}`, value: money(investedAtExpiry) },
          { label: 'Permanent cash value there', value: money(permCV), tone: permCV > investedAtExpiry ? 'good' : 'neutral' },
          { label: `Invested difference at ${horizon}`, value: money(investedAtHorizon), hint: 'with no death benefit remaining' },
          { label: `Death benefit at ${horizon}`, value: money(face) + ' vs $0', tone: 'key', hint: 'The term expired. That is the part the comparison usually leaves out.' },
        ],
        notes: [
          'Buy term and invest the difference works — as long as you actually invest the difference, every year, and as long as you die inside the term. Most people do neither.',
          'The right answer is usually both: term for the temporary obligation, permanent for the one that never expires.',
        ],
      };
    },
  },
  {
    id: 'disability-gap',
    name: 'Disability Income Gap',
    category: 'Protection',
    blurb: 'Group coverage is taxable, capped, and tied to your employer. This is what it actually leaves you with.',
    fields: [
      { key: 'income', label: 'Annual income', type: 'money', default: 400_000, min: 0 },
      { key: 'groupPct', label: 'Group benefit percentage', type: 'percent', default: 60, min: 0, max: 100, step: 5 },
      { key: 'groupCap', label: 'Group monthly cap', type: 'money', default: 15_000, min: 0 },
      { key: 'employerPaid', label: 'Employer pays the premium', type: 'toggle', default: true, help: 'Employer-paid premiums make the benefit taxable to you.' },
      filingField,
      { key: 'expenses', label: 'Monthly expenses', type: 'money', default: 18_000, min: 0 },
      { key: 'individual', label: 'Individual policy monthly benefit', type: 'money', default: 0, min: 0 },
    ],
    compute(v: CalcValues) {
      const income = n(v, 'income'), groupPct = n(v, 'groupPct'), groupCap = n(v, 'groupCap');
      const employerPaid = v['employerPaid'] === true;
      const filing = s(v, 'filing', 'mfj');
      const expenses = n(v, 'expenses'), individual = n(v, 'individual');

      const groupGross = Math.min(income * (groupPct / 100) / 12, groupCap);
      const annualGross = groupGross * 12;
      const tax = employerPaid
        ? bracketTax(Math.max(0, annualGross - standardDeductionFor(filing)), bracketsFor(filing))
        : 0;
      const groupNet = (annualGross - tax) / 12;
      const totalNet = groupNet + individual; // Individual benefits are tax-free when you pay the premium.
      const gap = Math.max(0, expenses - totalNet);
      const replacement = income > 0 ? (totalNet * 12 / income) * 100 : 0;

      return {
        outputs: [
          { label: 'Group benefit (gross)', value: money(groupGross) + '/mo', hint: groupGross * 12 < income * (groupPct / 100) ? 'capped — the cap binds before the percentage does' : undefined },
          { label: 'After tax', value: money(groupNet) + '/mo', tone: employerPaid ? 'bad' : 'good', hint: employerPaid ? 'employer-paid premium makes this taxable income' : 'you paid the premium, so it is tax-free' },
          { label: 'Individual policy', value: money(individual) + '/mo', hint: 'tax-free' },
          { label: 'Total net income', value: money(totalNet) + '/mo', tone: 'key', hint: `${pct(replacement, 0)} of your working income` },
          { label: 'Monthly shortfall', value: money(gap) + '/mo', tone: gap > 0 ? 'bad' : 'good', hint: gap > 0 ? `${money(gap * 12)} a year, out of savings` : 'covered' },
        ],
        notes: [
          'The cap is the part that bites high earners. A 60% benefit capped at $15,000/month replaces 60% of a $300,000 income and 45% of a $400,000 one.',
          'Group coverage ends when the job does, and it is rarely own-occupation. An individual policy is portable, own-occupation, and tax-free.',
        ],
      };
    },
  },
  {
    id: 'ltc-cost',
    name: 'Long-Term Care Cost',
    category: 'Protection',
    blurb: 'What care costs when you need it, not what it costs today — and what it does to a portfolio still supporting a spouse.',
    fields: [
      { key: 'age', label: 'Current age', type: 'number', default: 58, min: 40, max: 85 },
      { key: 'careAge', label: 'Age care begins', type: 'number', default: 82, min: 55, max: 100 },
      { key: 'annualCost', label: 'Annual cost today', type: 'money', default: 120_000, min: 0, help: 'Private nursing home room, national median, 2025.' },
      { key: 'inflation', label: 'Care cost inflation', type: 'percent', default: 4.5, min: 0, max: 12, step: 0.25 },
      { key: 'duration', label: 'Years of care', type: 'years', default: 3, min: 1, max: 15 },
      { key: 'portfolio', label: 'Portfolio at that age', type: 'money', default: 2_200_000, min: 0 },
      { key: 'policyBenefit', label: 'LTC policy daily benefit', type: 'money', default: 0, min: 0 },
    ],
    compute(v: CalcValues) {
      const age = n(v, 'age'), careAge = n(v, 'careAge');
      const cost0 = n(v, 'annualCost'), inflation = n(v, 'inflation');
      const duration = Math.round(n(v, 'duration')), portfolio = n(v, 'portfolio');
      const daily = n(v, 'policyBenefit');

      const yearsOut = Math.max(0, careAge - age);
      const costAtStart = cost0 * Math.pow(1 + inflation / 100, yearsOut);
      let total = 0, c = costAtStart;
      for (let y = 0; y < duration; y++) { total += c; c *= 1 + inflation / 100; }
      const policyCoverage = daily * 365 * duration;
      const outOfPocket = Math.max(0, total - policyCoverage);
      const portfolioHit = portfolio > 0 ? (outOfPocket / portfolio) * 100 : 0;

      return {
        outputs: [
          { label: 'Annual cost when care starts', value: money(costAtStart), hint: `${money(cost0)} today, ${yearsOut} years of ${pct(inflation)} inflation` },
          { label: `Total over ${duration} years`, value: money(total), tone: 'key' },
          { label: 'Policy covers', value: money(policyCoverage), tone: policyCoverage > 0 ? 'good' : 'neutral' },
          { label: 'Out of pocket', value: money(outOfPocket), tone: 'bad' },
          { label: 'Share of the portfolio', value: pct(portfolioHit, 0), tone: portfolioHit > 30 ? 'bad' : portfolioHit > 15 ? 'neutral' : 'good' },
        ],
        notes: [
          'Care inflation runs well above general inflation, which is why a number that looks survivable today often is not.',
          'A hybrid life/LTC contract solves the "what if I never need it" objection: the death benefit pays either way, and the LTC rider accelerates it if care is needed.',
        ],
      };
    },
  },
  {
    id: 'emergency-fund',
    name: 'Emergency Reserve Placement',
    category: 'Protection',
    blurb: 'Six months of expenses has to sit somewhere. This compares where, on liquidity, return and tax.',
    fields: [
      { key: 'expenses', label: 'Monthly expenses', type: 'money', default: 16_000, min: 0 },
      { key: 'months', label: 'Months of reserve', type: 'number', default: 6, min: 1, max: 24 },
      { key: 'savingsRate', label: 'High-yield savings rate', type: 'percent', default: 4.0, min: 0, max: 10, step: 0.05 },
      { key: 'policyRate', label: 'Policy credited rate', type: 'percent', default: 6.5, min: 0, max: 20, step: 0.25 },
      { key: 'taxRate', label: 'Your marginal rate', type: 'percent', default: 35, min: 0, max: 55, step: 1 },
      { key: 'years', label: 'Years held', type: 'years', default: 15, min: 1, max: 40 },
    ],
    compute(v: CalcValues) {
      const expenses = n(v, 'expenses'), months = Math.round(n(v, 'months'));
      const savingsRate = n(v, 'savingsRate'), policyRate = n(v, 'policyRate');
      const taxRate = n(v, 'taxRate'), years = Math.round(n(v, 'years'));
      const reserve = expenses * months;
      const savingsNet = savingsRate * (1 - taxRate / 100);
      const savingsEnd = reserve * Math.pow(1 + savingsNet / 100, years);
      const policyEnd = reserve * Math.pow(1 + policyRate / 100, years);

      const data: Array<Record<string, number>> = [];
      for (let y = 0; y <= years; y++) {
        data.push({
          year: y,
          savings: Math.round(reserve * Math.pow(1 + savingsNet / 100, y)),
          policy: Math.round(reserve * Math.pow(1 + policyRate / 100, y)),
        });
      }
      return {
        outputs: [
          { label: 'Reserve required', value: money(reserve), hint: `${months} months at ${money(expenses)}` },
          { label: 'Savings account, after tax', value: money(savingsEnd), hint: `${pct(savingsNet)} net of ${pct(taxRate, 0)} tax` },
          { label: 'Policy cash value', value: money(policyEnd), tone: 'good', hint: 'no annual tax on the growth' },
          { label: 'Difference over ' + years + ' years', value: money(policyEnd - savingsEnd), tone: 'key' },
        ],
        chart: { data, xKey: 'year', yFormat: 'moneyShort', series: [
          { key: 'policy', label: 'Policy', color: '#c8a24a' },
          { key: 'savings', label: 'Savings, after tax', color: '#6b7280' },
        ] },
        notes: [
          'A policy is not a substitute for the first tier of an emergency fund. Cash value is accessible in days, not minutes, and surrender charges apply in the early years.',
          'The sensible structure is a genuinely liquid first tier for one to two months, with the balance of the reserve somewhere it is not losing to tax and inflation every year.',
        ],
      };
    },
  },
  {
    id: 'alimony-tax',
    name: 'Alimony Tax Treatment',
    category: 'Protection',
    blurb: 'Post-2018 divorces are not deductible to the payor and not income to the recipient. That reversal changed what a given support number is actually worth.',
    fields: [
      { key: 'support', label: 'Annual support', type: 'money', default: 96_000, min: 0 },
      { key: 'payorRate', label: 'Payor marginal rate', type: 'percent', default: 37, min: 0, max: 60, step: 1 },
      { key: 'recipientRate', label: 'Recipient marginal rate', type: 'percent', default: 22, min: 0, max: 60, step: 1 },
      { key: 'years', label: 'Years of support', type: 'years', default: 10, min: 1, max: 30 },
      { key: 'preTcja', label: 'Decree executed before 2019', type: 'toggle', default: false, help: 'Pre-2019 decrees keep the old treatment unless they were modified to adopt the new rules.' },
    ],
    compute(v: CalcValues) {
      const support = n(v, 'support'), payorRate = n(v, 'payorRate') / 100;
      const recipientRate = n(v, 'recipientRate') / 100, years = Math.round(n(v, 'years'));
      const old = b(v, 'preTcja', false);

      const payorCost = old ? support * (1 - payorRate) : support;
      const recipientKeeps = old ? support * (1 - recipientRate) : support;
      // Under the old rules the rate differential created value out of nothing.
      const householdCost = payorCost - recipientKeeps;
      const equivalentUnderOld = recipientKeeps / (1 - payorRate);

      return {
        outputs: [
          { label: 'Treatment', value: old ? 'Pre-2019 — deductible / includible' : 'Post-2018 — neither', tone: old ? 'good' : 'neutral' },
          { label: 'Net cost to the payor', value: money(payorCost) + '/yr', tone: 'bad', hint: `${money(payorCost * years)} over ${years} years` },
          { label: 'Net to the recipient', value: money(recipientKeeps) + '/yr', tone: 'good' },
          { label: 'Lost to the rate differential', value: money(Math.max(0, householdCost)), tone: householdCost > 0 ? 'bad' : 'good', hint: old ? 'the old rules moved income from a high bracket to a low one' : 'no arbitrage available — the payor funds it with after-tax dollars' },
          { label: 'Pre-2019 equivalent payment', value: money(equivalentUnderOld) + '/yr', hint: 'what would have delivered the same after-tax amount under the old rules' },
        ],
        notes: [
          'For decrees executed after 31 December 2018, alimony is not deductible by the payor and not included in the recipient\'s income. Child support was never deductible.',
          'The old rules let a couple move income from a 37% bracket to a 22% one, which funded part of the support out of the Treasury. That is gone, and support numbers negotiated on old assumptions are materially more expensive now.',
        ],
      };
    },
  },
  {
    id: 'divorce-shield',
    name: 'Divorce Shield',
    category: 'Protection',
    blurb: 'What an equitable division costs, what the support obligation is worth, and what has to be insured to secure it.',
    fields: [
      { key: 'maritalAssets', label: 'Marital estate', type: 'money', default: 3_400_000, min: 0 },
      { key: 'separate', label: 'Separate (pre-marital / inherited) property', type: 'money', default: 600_000, min: 0 },
      { key: 'commingled', label: 'Share of separate property commingled', type: 'percent', default: 40, min: 0, max: 100, step: 5, help: 'Separate property that has been mixed into joint accounts usually loses its character.' },
      { key: 'splitPct', label: 'Division to the other spouse', type: 'percent', default: 50, min: 0, max: 100, step: 5 },
      { key: 'support', label: 'Annual support obligation', type: 'money', default: 90_000, min: 0 },
      { key: 'supportYears', label: 'Years of support', type: 'years', default: 10, min: 0, max: 30 },
      { key: 'discount', label: 'Discount rate', type: 'percent', default: 4.5, min: 0, max: 12, step: 0.25 },
      { key: 'existingCoverage', label: 'Existing life coverage securing support', type: 'money', default: 0, min: 0 },
    ],
    compute(v: CalcValues) {
      const marital = n(v, 'maritalAssets'), separate = n(v, 'separate');
      const commingled = n(v, 'commingled') / 100, splitPct = n(v, 'splitPct') / 100;
      const support = n(v, 'support'), supportYears = Math.round(n(v, 'supportYears'));
      const discount = n(v, 'discount'), existing = n(v, 'existingCoverage');

      const separateLost = separate * commingled;
      const divisible = marital + separateLost;
      const toOther = divisible * splitPct;
      const retained = divisible - toOther + (separate - separateLost);

      const r = discount / 100;
      const pvSupport = supportYears === 0 ? 0 : Math.abs(r) < 1e-9
        ? support * supportYears
        : support * ((1 - Math.pow(1 + r, -supportYears)) / r);

      const insuranceNeeded = Math.max(0, pvSupport - existing);
      const totalExposure = toOther + pvSupport;

      return {
        outputs: [
          { label: 'Divisible estate', value: money(divisible), hint: separateLost > 0 ? `includes ${money(separateLost)} of commingled separate property` : 'separate property held clear' },
          { label: 'Transferred to the other spouse', value: money(toOther), tone: 'bad' },
          { label: 'Support obligation (present value)', value: money(pvSupport), tone: 'bad', hint: `${money(support)}/yr for ${supportYears} years` },
          { label: 'Total exposure', value: money(totalExposure), tone: 'key', hint: pct(divisible > 0 ? (totalExposure / divisible) * 100 : 0, 0) + ' of the estate' },
          { label: 'You retain', value: money(retained), tone: 'neutral' },
          { label: 'Life coverage required on the payor', value: money(insuranceNeeded), tone: insuranceNeeded > 0 ? 'bad' : 'good', hint: 'A support order dies with the payor unless it is insured. Most decrees require this and most people never buy it.' },
        ],
        notes: [
          `Commingling is the single largest controllable variable here. Keeping inherited or pre-marital property in its own titled account protects ${money(separate)}; mixing it into joint accounts put ${money(separateLost)} of it on the table.`,
          'This is a planning model, not a legal opinion. Division rules are state-specific and a decree controls.',
        ],
      };
    },
  },
];

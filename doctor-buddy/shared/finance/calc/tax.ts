import { money, pct } from '../format';
import {
  type CalcDef, type CalcValues, n, s, bracketsFor, bracketTax, marginalRate,
  filingField, standardDeductionFor, ltcgBracketsFor,
} from './core';

export const taxCalcs: CalcDef[] = [
  {
    id: 'bracket-analyzer',
    name: 'Marginal vs. Effective Rate',
    category: 'Tax',
    blurb: 'What you actually pay, what the next dollar costs, and how much room is left in your current bracket.',
    fields: [
      filingField,
      { key: 'income', label: 'Gross income', type: 'money', default: 450_000, min: 0 },
      { key: 'deductions', label: 'Itemized deductions (0 uses the standard)', type: 'money', default: 0, min: 0 },
      { key: 'preTax', label: 'Pre-tax deferrals (401k, HSA)', type: 'money', default: 30_000, min: 0 },
    ],
    compute(v: CalcValues) {
      const filing = s(v, 'filing', 'mfj');
      const income = n(v, 'income'), itemized = n(v, 'deductions'), preTax = n(v, 'preTax');
      const brackets = bracketsFor(filing);
      const sd = standardDeductionFor(filing);
      const deduction = Math.max(sd, itemized);
      const taxable = Math.max(0, income - preTax - deduction);
      const tax = bracketTax(taxable, brackets);
      const mr = marginalRate(taxable, brackets);
      const bracketTop = brackets.find(br => taxable <= br.upTo)?.upTo ?? Infinity;
      const room = Number.isFinite(bracketTop) ? bracketTop - taxable : 0;

      const rows = brackets.map((br, i) => {
        const from = i === 0 ? 0 : brackets[i - 1].upTo;
        const inThis = Math.max(0, Math.min(taxable, br.upTo) - from);
        return {
          band: `${pct(br.rate, 0)}`,
          range: Number.isFinite(br.upTo) ? `${money(from)} – ${money(br.upTo)}` : `${money(from)}+`,
          income: Math.round(inThis),
          tax: Math.round(inThis * (br.rate / 100)),
        };
      });
      return {
        outputs: [
          { label: 'Taxable income', value: money(taxable), hint: `${money(deduction)} deduction${itemized > sd ? ' (itemized)' : ' (standard)'}` },
          { label: 'Federal tax', value: money(tax), tone: 'bad' },
          { label: 'Effective rate', value: pct(income > 0 ? (tax / income) * 100 : 0), tone: 'key' },
          { label: 'Marginal rate', value: pct(mr, 0), hint: 'what the next dollar costs' },
          { label: 'Room left in this bracket', value: Number.isFinite(bracketTop) ? money(room) : 'top bracket', tone: 'good' },
        ],
        table: { columns: [
          { key: 'band', label: 'Rate', format: 'text' },
          { key: 'range', label: 'Taxable range', format: 'text' },
          { key: 'income', label: 'Your income here', format: 'money' },
          { key: 'tax', label: 'Tax', format: 'money' },
        ], rows },
        notes: ['Bracket room is the most under-used number in planning. It is the space a Roth conversion, a capital gain, or a business distribution can occupy this year at a known cost.'],
      };
    },
  },
  {
    id: 'capital-gains',
    name: 'Capital Gains Tax',
    category: 'Tax',
    blurb: 'Long-term rates stack on top of ordinary income, and the 3.8% net investment income tax sits above that.',
    fields: [
      filingField,
      { key: 'ordinary', label: 'Ordinary income', type: 'money', default: 250_000, min: 0 },
      { key: 'basis', label: 'Cost basis', type: 'money', default: 200_000, min: 0 },
      { key: 'proceeds', label: 'Sale proceeds', type: 'money', default: 800_000, min: 0 },
      { key: 'stateRate', label: 'State tax rate', type: 'percent', default: 4.5, min: 0, max: 15, step: 0.1 },
      { key: 'longTerm', label: 'Held over a year', type: 'toggle', default: true },
    ],
    compute(v: CalcValues) {
      const filing = s(v, 'filing', 'mfj');
      const ordinary = n(v, 'ordinary'), basis = n(v, 'basis'), proceeds = n(v, 'proceeds');
      const stateRate = n(v, 'stateRate'), longTerm = v['longTerm'] === true;
      const gain = Math.max(0, proceeds - basis);
      const sd = standardDeductionFor(filing);
      const ordinaryTaxable = Math.max(0, ordinary - sd);

      let federal: number;
      if (longTerm) {
        const lt = ltcgBracketsFor(filing);
        // LTCG stacks on top of ordinary income.
        let remaining = gain, floor = ordinaryTaxable, tax = 0;
        for (const br of lt) {
          if (remaining <= 0) break;
          const capacity = Math.max(0, br.upTo - floor);
          const slice = Math.min(remaining, capacity);
          tax += slice * (br.rate / 100);
          remaining -= slice; floor += slice;
        }
        federal = tax;
      } else {
        const brackets = bracketsFor(filing);
        federal = bracketTax(ordinaryTaxable + gain, brackets) - bracketTax(ordinaryTaxable, brackets);
      }

      const niitThreshold = filing === 'single' ? 200_000 : 250_000;
      const magi = ordinary + gain;
      const niit = Math.max(0, Math.min(gain, magi - niitThreshold)) * 0.038;
      const state = gain * (stateRate / 100);
      const total = federal + niit + state;

      return {
        outputs: [
          { label: 'Gain', value: money(gain) },
          { label: 'Federal tax', value: money(federal), hint: longTerm ? 'long-term rates' : 'taxed as ordinary income' },
          { label: 'Net investment income tax', value: money(niit), hint: `3.8% above ${money(niitThreshold)} MAGI` },
          { label: 'State tax', value: money(state) },
          { label: 'Total tax', value: money(total), tone: 'bad', hint: `${pct(gain > 0 ? (total / gain) * 100 : 0)} of the gain` },
          { label: 'Net proceeds', value: money(proceeds - total), tone: 'key' },
        ],
        notes: longTerm ? [] : ['Selling inside twelve months converts a long-term rate into an ordinary one. On this gain that decision alone is worth ' + money(Math.abs(federal - 0)) + ' in federal tax.'],
      };
    },
  },
  {
    id: 'tax-free-equivalent',
    name: 'Tax-Free Equivalent Yield',
    category: 'Tax',
    blurb: 'What a taxable account has to earn to match a tax-free distribution — the single fairest way to compare the two.',
    fields: [
      filingField,
      { key: 'income', label: 'Taxable income in retirement', type: 'money', default: 180_000, min: 0 },
      { key: 'taxFreeRate', label: 'Tax-free rate', type: 'percent', default: 6.5, min: 0, max: 25, step: 0.25 },
      { key: 'stateRate', label: 'State tax rate', type: 'percent', default: 4.5, min: 0, max: 15, step: 0.1 },
    ],
    compute(v: CalcValues) {
      const filing = s(v, 'filing', 'mfj');
      const income = n(v, 'income'), taxFreeRate = n(v, 'taxFreeRate'), stateRate = n(v, 'stateRate');
      const mr = marginalRate(Math.max(0, income - standardDeductionFor(filing)), bracketsFor(filing));
      const combined = mr + stateRate;
      const equivalent = taxFreeRate / (1 - combined / 100);
      return {
        outputs: [
          { label: 'Combined marginal rate', value: pct(combined, 1), hint: `${pct(mr, 0)} federal + ${pct(stateRate, 1)} state` },
          { label: 'Tax-free rate', value: pct(taxFreeRate) },
          { label: 'Taxable equivalent', value: pct(equivalent), tone: 'key', hint: 'what a taxable account must earn to leave you the same money' },
          { label: 'Advantage', value: pct(equivalent - taxFreeRate), tone: 'good' },
        ],
        notes: ['This is why the comparison "my portfolio returns 9%" is not the comparison that matters. At a 37% combined rate, a 6.5% tax-free distribution is a 10.3% taxable return.'],
      };
    },
  },
  {
    id: 'irmaa',
    name: 'Medicare IRMAA Surcharge',
    category: 'Tax',
    blurb: 'One dollar over a bracket costs a full year of surcharge for two people. The cliffs are absolute, not graduated.',
    fields: [
      filingField,
      { key: 'magi', label: 'Modified AGI (two years prior)', type: 'money', default: 215_000, min: 0 },
      { key: 'people', label: 'People on Medicare', type: 'number', default: 2, min: 1, max: 2 },
    ],
    compute(v: CalcValues) {
      const filing = s(v, 'filing', 'mfj');
      const magi = n(v, 'magi'), people = Math.max(1, Math.round(n(v, 'people')));
      // 2025 IRMAA tiers; Part B monthly surcharge per person, plus Part D.
      const single = [106_000, 133_000, 167_000, 200_000, 500_000];
      const mfj = [212_000, 266_000, 334_000, 400_000, 750_000];
      const thresholds = filing === 'single' ? single : mfj;
      const partB = [0, 74.0, 185.0, 295.9, 406.9, 443.9];
      const partD = [0, 13.7, 35.3, 57.0, 78.6, 85.8];

      let tier = 0;
      for (let i = 0; i < thresholds.length; i++) if (magi > thresholds[i]) tier = i + 1;
      const annual = (partB[tier] + partD[tier]) * 12 * people;
      const nextThreshold = tier < thresholds.length ? thresholds[tier] : null;
      const headroom = nextThreshold ? nextThreshold - magi : 0;
      const nextCost = tier < thresholds.length
        ? ((partB[tier + 1] + partD[tier + 1]) - (partB[tier] + partD[tier])) * 12 * people
        : 0;

      const rows = thresholds.map((t, i) => ({
        tier: i + 1,
        over: money(t),
        monthly: Math.round((partB[i + 1] + partD[i + 1]) * people),
        annual: Math.round((partB[i + 1] + partD[i + 1]) * 12 * people),
      }));
      return {
        outputs: [
          { label: 'IRMAA tier', value: tier === 0 ? 'None' : `Tier ${tier}`, tone: tier === 0 ? 'good' : 'bad' },
          { label: 'Annual surcharge', value: money(annual), tone: annual > 0 ? 'bad' : 'good', hint: `${people} person${people > 1 ? 's' : ''}` },
          { label: 'Room to the next cliff', value: nextThreshold ? money(headroom) : 'top tier', tone: headroom < 10_000 && nextThreshold ? 'bad' : 'neutral' },
          { label: 'Cost of crossing it', value: nextThreshold ? money(nextCost) : '—', hint: 'triggered by a single dollar' },
        ],
        table: { columns: [
          { key: 'tier', label: 'Tier', format: 'number' },
          { key: 'over', label: 'MAGI over', format: 'text' },
          { key: 'monthly', label: 'Monthly', format: 'money' },
          { key: 'annual', label: 'Annual', format: 'money' },
        ], rows },
        notes: [
          'IRMAA looks at your return from two years ago, so the planning window closes before most people know the bracket exists.',
          'Policy loans and qualified Roth distributions are not in MAGI. Every dollar of income you can take that way is a dollar that cannot push you over a cliff.',
        ],
      };
    },
  },
  {
    id: 'qsbs',
    name: 'QSBS Exclusion (§1202)',
    category: 'Tax',
    blurb: 'Qualified small business stock can exclude the greater of $10M or 10x basis from federal capital gains.',
    fields: [
      { key: 'basis', label: 'Cost basis', type: 'money', default: 500_000, min: 0 },
      { key: 'proceeds', label: 'Sale proceeds', type: 'money', default: 12_000_000, min: 0 },
      { key: 'holders', label: 'Number of qualifying holders', type: 'number', default: 1, min: 1, max: 20, help: 'Gifting shares to non-grantor trusts can multiply the exclusion. That is a structuring decision, made years before the sale.' },
      { key: 'stateRate', label: 'State tax rate', type: 'percent', default: 0, min: 0, max: 15, step: 0.1, help: 'Some states conform to §1202; some do not.' },
    ],
    compute(v: CalcValues) {
      const basis = n(v, 'basis'), proceeds = n(v, 'proceeds');
      const holders = Math.max(1, Math.round(n(v, 'holders'))), stateRate = n(v, 'stateRate');
      const gain = Math.max(0, proceeds - basis);
      const capPerHolder = Math.max(10_000_000, basis * 10);
      const excluded = Math.min(gain, capPerHolder * holders);
      const taxable = gain - excluded;
      const federal = taxable * 0.20 + taxable * 0.038;
      const state = gain * (stateRate / 100);
      const withoutQsbs = gain * 0.238 + state;
      return {
        outputs: [
          { label: 'Gain', value: money(gain) },
          { label: 'Exclusion cap', value: money(capPerHolder * holders), hint: holders > 1 ? `${money(capPerHolder)} × ${holders} holders` : 'greater of $10M or 10× basis' },
          { label: 'Excluded from federal tax', value: money(excluded), tone: 'good' },
          { label: 'Federal tax due', value: money(federal) },
          { label: 'Tax saved', value: money(withoutQsbs - federal - state), tone: 'key' },
        ],
        notes: [
          'Requires C-corporation stock acquired at original issue, a five-year hold, and gross assets under $50M when issued. Every one of those is checkable years in advance and impossible to fix afterward.',
          'This is an estimate. §1202 qualification is a legal determination — have counsel confirm it before you rely on the number.',
        ],
      };
    },
  },
  {
    id: 'charitable-bunching',
    name: 'Charitable Bunching',
    category: 'Tax',
    blurb: 'Concentrating several years of giving into one year to clear the standard deduction, instead of giving below it every year.',
    fields: [
      filingField,
      { key: 'income', label: 'Gross income', type: 'money', default: 400_000, min: 0 },
      { key: 'otherItemized', label: 'Other itemized deductions', type: 'money', default: 18_000, min: 0 },
      { key: 'annualGiving', label: 'Annual giving', type: 'money', default: 20_000, min: 0 },
      { key: 'bunchYears', label: 'Years to bunch together', type: 'number', default: 3, min: 2, max: 6 },
    ],
    compute(v: CalcValues) {
      const filing = s(v, 'filing', 'mfj'), income = n(v, 'income');
      const other = n(v, 'otherItemized'), giving = n(v, 'annualGiving');
      const bunch = Math.round(n(v, 'bunchYears'));
      const brackets = bracketsFor(filing), sd = standardDeductionFor(filing);

      const taxFor = (deduction: number) => bracketTax(Math.max(0, income - Math.max(sd, deduction)), brackets);
      const spreadTax = taxFor(other + giving) * bunch;
      const bunchedTax = taxFor(other + giving * bunch) + taxFor(other) * (bunch - 1);
      const saved = spreadTax - bunchedTax;

      return {
        outputs: [
          { label: 'Standard deduction', value: money(sd) },
          { label: 'Giving every year', value: money(spreadTax), hint: `${bunch}-year federal tax` },
          { label: `Bunching ${money(giving * bunch)} into one year`, value: money(bunchedTax), tone: 'good' },
          { label: 'Tax saved', value: money(saved), tone: saved > 0 ? 'key' : 'neutral', hint: saved <= 0 ? 'Your other itemized deductions already clear the standard deduction, so bunching adds nothing.' : 'same total given, same charities' },
        ],
        notes: ['A donor-advised fund makes this practical: you take the deduction in the bunch year and release the grants on the old schedule, so the charities never see a gap.'],
      };
    },
  },
  {
    id: 'niit-planner',
    name: 'Net Investment Income Tax',
    category: 'Tax',
    blurb: 'The 3.8% surtax that applies to investment income above a MAGI threshold — and the income types it cannot touch.',
    fields: [
      filingField,
      { key: 'wages', label: 'Wages and business income', type: 'money', default: 220_000, min: 0 },
      { key: 'investment', label: 'Investment income (interest, dividends, gains, passive rent)', type: 'money', default: 120_000, min: 0 },
      { key: 'exempt', label: 'Tax-free income (policy loans, Roth, municipal)', type: 'money', default: 0, min: 0 },
    ],
    compute(v: CalcValues) {
      const filing = s(v, 'filing', 'mfj');
      const wages = n(v, 'wages'), investment = n(v, 'investment'), exempt = n(v, 'exempt');
      const threshold = filing === 'single' ? 200_000 : 250_000;
      const magi = wages + investment;
      const base = Math.max(0, Math.min(investment, magi - threshold));
      const niit = base * 0.038;
      return {
        outputs: [
          { label: 'MAGI', value: money(magi), hint: `threshold ${money(threshold)}` },
          { label: 'Income exposed to the surtax', value: money(base) },
          { label: 'Net investment income tax', value: money(niit), tone: niit > 0 ? 'bad' : 'good' },
          { label: 'Sheltered from it entirely', value: money(exempt), tone: 'good', hint: 'not in MAGI, not investment income' },
        ],
        notes: ['Life insurance cash value growth is not investment income for this purpose and policy loans are not distributions. Neither the growth nor the access shows up in MAGI while the contract stays in force.'],
      };
    },
  },
  {
    id: 'w4-withholding',
    name: 'Withholding Check',
    category: 'Tax',
    blurb: 'Whether you are lending the Treasury money interest-free, or walking into an underpayment penalty.',
    fields: [
      filingField,
      { key: 'income', label: 'Gross income', type: 'money', default: 300_000, min: 0 },
      { key: 'preTax', label: 'Pre-tax deferrals', type: 'money', default: 23_500, min: 0 },
      { key: 'withheldYTD', label: 'Withheld so far', type: 'money', default: 40_000, min: 0 },
      { key: 'monthsElapsed', label: 'Months elapsed', type: 'number', default: 9, min: 1, max: 12 },
      { key: 'priorYearTax', label: 'Last year\'s total tax', type: 'money', default: 62_000, min: 0 },
    ],
    compute(v: CalcValues) {
      const filing = s(v, 'filing', 'mfj');
      const income = n(v, 'income'), preTax = n(v, 'preTax');
      const withheld = n(v, 'withheldYTD'), months = Math.max(1, n(v, 'monthsElapsed'));
      const prior = n(v, 'priorYearTax');
      const brackets = bracketsFor(filing), sd = standardDeductionFor(filing);
      const tax = bracketTax(Math.max(0, income - preTax - sd), brackets);
      const projected = (withheld / months) * 12;
      const balance = projected - tax;
      // Safe harbour: 110% of prior year for higher earners, or 90% of current.
      const safeHarbour = Math.min(prior * 1.10, tax * 0.90);
      const meetsHarbour = projected >= safeHarbour;
      return {
        outputs: [
          { label: 'Projected tax', value: money(tax) },
          { label: 'Projected withholding', value: money(projected) },
          balance >= 0
            ? { label: 'Expected refund', value: money(balance), tone: balance > 5_000 ? 'bad' : 'neutral', hint: balance > 5_000 ? 'An interest-free loan to the Treasury. Adjust withholding and invest the difference.' : undefined }
            : { label: 'Expected balance due', value: money(-balance), tone: 'bad' },
          { label: 'Safe harbour', value: money(safeHarbour), tone: meetsHarbour ? 'good' : 'bad', hint: meetsHarbour ? 'no underpayment penalty' : `increase withholding by ${money((safeHarbour - projected) / Math.max(1, 12 - months))} per remaining month` },
        ],
      };
    },
  },
  {
    id: 'business-owner-comp',
    name: 'S-Corp Salary vs. Distribution',
    category: 'Tax',
    blurb: 'Where the reasonable-compensation line sits, and what payroll tax the split above it saves.',
    fields: [
      { key: 'profit', label: 'Business profit', type: 'money', default: 500_000, min: 0 },
      { key: 'salary', label: 'W-2 salary taken', type: 'money', default: 180_000, min: 0 },
      filingField,
    ],
    compute(v: CalcValues) {
      const profit = n(v, 'profit'), salary = Math.min(n(v, 'salary'), n(v, 'profit'));
      const filing = s(v, 'filing', 'mfj');
      const ssWageBase = 176_100;
      const socialSecurity = Math.min(salary, ssWageBase) * 0.124;
      const medicare = salary * 0.029;
      const addlMedicareThreshold = filing === 'single' ? 200_000 : 250_000;
      const addlMedicare = Math.max(0, salary - addlMedicareThreshold) * 0.009;
      const payroll = socialSecurity + medicare + addlMedicare;

      const asAllSalary = Math.min(profit, ssWageBase) * 0.124 + profit * 0.029
        + Math.max(0, profit - addlMedicareThreshold) * 0.009;
      const saved = asAllSalary - payroll;
      const distribution = profit - salary;

      return {
        outputs: [
          { label: 'W-2 salary', value: money(salary), hint: `${pct(profit > 0 ? (salary / profit) * 100 : 0, 0)} of profit` },
          { label: 'Distribution', value: money(distribution), hint: 'not subject to payroll tax' },
          { label: 'Payroll tax on the salary', value: money(payroll) },
          { label: 'Payroll tax saved', value: money(saved), tone: 'good' },
          { label: 'Retirement plan capacity', value: money(Math.min(salary * 0.25, 70_000)), hint: 'employer contributions are capped by W-2 salary, which is the cost of taking too little' },
        ],
        notes: [
          'The IRS requires reasonable compensation for services performed. A salary set too low to win a payroll-tax argument is the most commonly reclassified item in an S-corp exam.',
          'Cutting salary also cuts what a defined benefit or cash balance plan can absorb. Below roughly 40% of profit the retirement-plan cost usually exceeds the payroll-tax saving.',
        ],
      };
    },
  },
];

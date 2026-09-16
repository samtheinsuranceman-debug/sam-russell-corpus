import { money, pct, num } from '../format';
import { type CalcDef, type CalcValues, n, levelPayment } from './core';

export const businessCalcs: CalcDef[] = [
  {
    id: 'business-valuation',
    name: 'Business Valuation',
    category: 'Business',
    blurb: 'Three methods on the same numbers, because a single multiple is an opinion and a range is a position.',
    fields: [
      { key: 'revenue', label: 'Annual revenue', type: 'money', default: 4_200_000, min: 0 },
      { key: 'ebitda', label: 'EBITDA', type: 'money', default: 950_000, min: 0 },
      { key: 'ownerComp', label: 'Owner compensation add-back', type: 'money', default: 180_000, min: 0 },
      { key: 'multiple', label: 'EBITDA multiple', type: 'number', default: 5.5, min: 1, max: 20, step: 0.25 },
      { key: 'revMultiple', label: 'Revenue multiple', type: 'number', default: 1.2, min: 0.1, max: 10, step: 0.1 },
      { key: 'discountRate', label: 'Discount rate', type: 'percent', default: 18, min: 5, max: 40, step: 0.5 },
      { key: 'growthRate', label: 'Long-run growth', type: 'percent', default: 3, min: 0, max: 15, step: 0.25 },
      { key: 'netDebt', label: 'Net debt', type: 'money', default: 350_000, min: 0 },
    ],
    compute(v: CalcValues) {
      const revenue = n(v, 'revenue'), ebitda = n(v, 'ebitda'), addBack = n(v, 'ownerComp');
      const multiple = n(v, 'multiple'), revMultiple = n(v, 'revMultiple');
      const discount = n(v, 'discountRate') / 100, growth = n(v, 'growthRate') / 100;
      const netDebt = n(v, 'netDebt');

      const adjEbitda = ebitda + addBack;
      const byMultiple = adjEbitda * multiple - netDebt;
      const byRevenue = revenue * revMultiple - netDebt;
      // Capitalized earnings: a perpetuity on adjusted EBITDA.
      const byDcf = discount > growth ? (adjEbitda * (1 + growth)) / (discount - growth) - netDebt : 0;

      const values = [byMultiple, byRevenue, byDcf].filter(x => x > 0);
      const low = Math.min(...values), high = Math.max(...values);
      const mid = values.reduce((a, x) => a + x, 0) / values.length;

      return {
        outputs: [
          { label: 'Adjusted EBITDA', value: money(adjEbitda), hint: `${money(ebitda)} plus ${money(addBack)} owner add-back` },
          { label: `${num(multiple, 2)}× EBITDA`, value: money(byMultiple) },
          { label: `${num(revMultiple, 2)}× revenue`, value: money(byRevenue) },
          { label: 'Capitalized earnings', value: money(byDcf), hint: `${pct(discount * 100)} discount, ${pct(growth * 100)} growth` },
          { label: 'Range', value: `${money(low)} – ${money(high)}`, tone: 'key' },
          { label: 'Midpoint', value: money(mid) },
        ],
        notes: [
          'EBITDA multiples move with size. Businesses under $1M of EBITDA transact at 3-5×; above $5M the same business often clears 7-9× on nothing but scale.',
          'Customer concentration, owner dependence and unclean financials are the three things that take the multiple down before anyone argues about the number.',
        ],
      };
    },
  },
  {
    id: 'key-person',
    name: 'Key Person Coverage',
    category: 'Business',
    blurb: 'What the business loses if a key person dies, priced three ways, then insured.',
    fields: [
      { key: 'contribution', label: 'Annual profit attributable to them', type: 'money', default: 600_000, min: 0 },
      { key: 'replacementYears', label: 'Years to replace and recover', type: 'years', default: 4, min: 1, max: 12 },
      { key: 'salary', label: 'Their compensation', type: 'money', default: 280_000, min: 0 },
      { key: 'recruiting', label: 'Recruiting and onboarding cost', type: 'money', default: 150_000, min: 0 },
      { key: 'loanCovenant', label: 'Debt requiring key person coverage', type: 'money', default: 1_500_000, min: 0 },
      { key: 'discount', label: 'Discount rate', type: 'percent', default: 8, min: 0, max: 25, step: 0.5 },
      { key: 'existing', label: 'Existing coverage', type: 'money', default: 0, min: 0 },
    ],
    compute(v: CalcValues) {
      const contribution = n(v, 'contribution'), years = Math.round(n(v, 'replacementYears'));
      const salary = n(v, 'salary'), recruiting = n(v, 'recruiting');
      const covenant = n(v, 'loanCovenant'), discount = n(v, 'discount') / 100, existing = n(v, 'existing');

      const pvLost = Math.abs(discount) < 1e-9
        ? contribution * years
        : contribution * ((1 - Math.pow(1 + discount, -years)) / discount);
      const multipleOfSalary = salary * 8;
      const contributionMethod = pvLost + recruiting;
      const need = Math.max(contributionMethod, multipleOfSalary, covenant);

      return {
        outputs: [
          { label: 'Lost profit (present value)', value: money(pvLost), hint: `${money(contribution)} for ${years} years at ${pct(discount * 100)}` },
          { label: 'Contribution method', value: money(contributionMethod), hint: 'lost profit plus replacement cost' },
          { label: 'Multiple of salary (8×)', value: money(multipleOfSalary) },
          { label: 'Lender requirement', value: money(covenant), tone: covenant > 0 ? 'bad' : 'neutral' },
          { label: 'Coverage required', value: money(need), tone: 'key', hint: 'the largest of the three tests' },
          { label: 'Gap', value: money(Math.max(0, need - existing)), tone: need > existing ? 'bad' : 'good' },
        ],
        notes: [
          'The business owns the policy and is the beneficiary. Proceeds are generally income-tax-free, but §101(j) requires written notice and consent before issue — miss that and the whole benefit becomes taxable.',
          'A permanent policy here doubles as a funding vehicle for the buy-sell, and the cash value is an asset on the balance sheet rather than a pure expense.',
        ],
      };
    },
  },
  {
    id: 'buy-sell',
    name: 'Buy-Sell Funding',
    category: 'Business',
    blurb: 'What each owner has to be able to write a cheque for, and what funding it with insurance costs against not funding it at all.',
    fields: [
      { key: 'value', label: 'Business value', type: 'money', default: 8_000_000, min: 0 },
      { key: 'owners', label: 'Number of owners', type: 'number', default: 3, min: 2, max: 10 },
      { key: 'structure', label: 'Structure', type: 'select', default: 'crosspurchase', options: [
        { value: 'crosspurchase', label: 'Cross-purchase' },
        { value: 'entity', label: 'Entity redemption' },
      ] },
      { key: 'premiumRate', label: 'Premium per $1,000 of coverage', type: 'number', default: 9.5, min: 1, max: 60, step: 0.5 },
      { key: 'loanRate', label: 'Rate if funded by borrowing instead', type: 'percent', default: 9, min: 0, max: 25, step: 0.25 },
      { key: 'loanYears', label: 'Years to repay that loan', type: 'years', default: 7, min: 1, max: 20 },
    ],
    compute(v: CalcValues) {
      const value = n(v, 'value'), owners = Math.max(2, Math.round(n(v, 'owners')));
      const structure = String(v['structure'] ?? 'crosspurchase');
      const premiumRate = n(v, 'premiumRate'), loanRate = n(v, 'loanRate'), loanYears = n(v, 'loanYears');

      const perOwner = value / owners;
      const policiesNeeded = structure === 'crosspurchase' ? owners * (owners - 1) : owners;
      const coveragePerPolicy = structure === 'crosspurchase' ? perOwner / (owners - 1) : perOwner;
      const totalCoverage = policiesNeeded * coveragePerPolicy;
      const annualPremium = (totalCoverage / 1000) * premiumRate;

      const loanPayment = levelPayment(perOwner, loanRate, loanYears * 12);
      const loanTotal = loanPayment * loanYears * 12;

      return {
        outputs: [
          { label: 'Each owner\'s interest', value: money(perOwner), tone: 'key' },
          { label: 'Policies required', value: `${policiesNeeded}`, hint: structure === 'crosspurchase' ? 'n × (n−1) — every owner insures every other' : 'one per owner, company-owned' },
          { label: 'Total coverage', value: money(totalCoverage) },
          { label: 'Annual premium', value: money(annualPremium), hint: `${pct(perOwner > 0 ? (annualPremium / value) * 100 : 0, 2)} of business value per year` },
          { label: 'Borrowing instead', value: money(loanTotal), tone: 'bad', hint: `${money(loanPayment)}/mo for ${loanYears} years, out of the surviving owners' pockets` },
        ],
        notes: [
          'Cross-purchase gives the surviving owners a stepped-up basis in the shares they buy. Entity redemption does not, which usually costs more in eventual capital gains than the simpler structure saves in premiums.',
          'An unfunded buy-sell is a contract to buy something you cannot pay for. That is the default state of most closely held businesses.',
        ],
      };
    },
  },
  {
    id: 'cash-balance-plan',
    name: 'Cash Balance Plan Capacity',
    category: 'Business',
    blurb: 'How much a defined benefit plan can absorb at your age, and what the deduction is worth against the cost of running it.',
    fields: [
      { key: 'age', label: 'Owner age', type: 'number', default: 54, min: 35, max: 75 },
      { key: 'compensation', label: 'W-2 compensation', type: 'money', default: 350_000, min: 0 },
      { key: 'employees', label: 'Non-owner employees', type: 'number', default: 8, min: 0, max: 200 },
      { key: 'avgEmployeeComp', label: 'Average employee compensation', type: 'money', default: 68_000, min: 0 },
      { key: 'employeeContribPct', label: 'Required employee contribution', type: 'percent', default: 7.5, min: 0, max: 25, step: 0.5 },
      { key: 'marginalRate', label: 'Combined marginal rate', type: 'percent', default: 42, min: 0, max: 60, step: 1 },
      { key: 'adminCost', label: 'Annual administration cost', type: 'money', default: 5_500, min: 0 },
    ],
    compute(v: CalcValues) {
      const age = n(v, 'age'), comp = n(v, 'compensation');
      const employees = Math.round(n(v, 'employees')), empComp = n(v, 'avgEmployeeComp');
      const empPct = n(v, 'employeeContribPct') / 100, mr = n(v, 'marginalRate') / 100;
      const admin = n(v, 'adminCost');

      // Capacity rises steeply with age — the plan has fewer years to fund the
      // same §415 lifetime benefit limit.
      const yearsToNRA = Math.max(1, 62 - age);
      const lifetimeLimit = 280_000;
      // Present value of the limit, funded over the remaining years at 5%.
      const pvFactor = (1 - Math.pow(1.05, -20)) / 0.05; // ~20-year payout annuity
      const targetLumpSum = Math.min(lifetimeLimit, comp) * pvFactor;
      const capacity = Math.min(targetLumpSum / ((Math.pow(1.05, yearsToNRA) - 1) / 0.05), comp * 1.5);

      const employeeCost = employees * empComp * empPct;
      const totalContribution = capacity + employeeCost;
      const taxSaved = totalContribution * mr;
      const netCost = employeeCost + admin - employeeCost * mr;
      const ownerNetBenefit = capacity * mr - netCost;

      return {
        outputs: [
          { label: 'Owner contribution capacity', value: money(capacity), tone: 'key', hint: `age ${age}, ${yearsToNRA} years to normal retirement age` },
          { label: 'Required employee contributions', value: money(employeeCost), hint: `${employees} employees at ${pct(empPct * 100)}` },
          { label: 'Total deductible contribution', value: money(totalContribution) },
          { label: 'Tax saved', value: money(taxSaved), tone: 'good', hint: `at ${pct(mr * 100, 0)} combined` },
          { label: 'Net cost of the employee side', value: money(netCost), tone: 'bad', hint: 'after the deduction, plus administration' },
          { label: 'Net benefit to the owner', value: money(ownerNetBenefit), tone: ownerNetBenefit > 0 ? 'good' : 'bad' },
        ],
        notes: [
          'Capacity roughly doubles between 45 and 60. A cash balance plan started at 55 is a different instrument to one started at 40.',
          'The plan commits you to funding it for several years. Volatile profit is the main reason these get frozen, and a freeze has its own cost.',
        ],
      };
    },
  },
];

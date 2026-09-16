import { money, pct, num } from '../format';
import { type CalcDef, type CalcValues, n, b, levelPayment, amortize } from './core';

export const realEstateCalcs: CalcDef[] = [
  {
    id: 'rental-cashflow',
    name: 'Rental Property Return',
    category: 'Real Estate',
    blurb: 'Cash flow, cap rate, cash-on-cash and total return with appreciation and amortization counted properly.',
    fields: [
      { key: 'price', label: 'Purchase price', type: 'money', default: 480_000, min: 0 },
      { key: 'downPct', label: 'Down payment', type: 'percent', default: 25, min: 0, max: 100, step: 1 },
      { key: 'rate', label: 'Mortgage rate', type: 'percent', default: 6.875, min: 0, max: 20, step: 0.125 },
      { key: 'termYears', label: 'Term (years)', type: 'years', default: 30, min: 5, max: 40 },
      { key: 'rent', label: 'Monthly rent', type: 'money', default: 3_400, min: 0 },
      { key: 'vacancy', label: 'Vacancy allowance', type: 'percent', default: 6, min: 0, max: 30, step: 0.5 },
      { key: 'taxes', label: 'Annual property tax', type: 'money', default: 5_400, min: 0 },
      { key: 'insurance', label: 'Annual insurance', type: 'money', default: 2_100, min: 0 },
      { key: 'maintenance', label: 'Maintenance and capex', type: 'percent', default: 8, min: 0, max: 30, step: 0.5 },
      { key: 'management', label: 'Management fee', type: 'percent', default: 8, min: 0, max: 20, step: 0.5 },
      { key: 'closing', label: 'Closing costs', type: 'money', default: 12_000, min: 0 },
      { key: 'appreciation', label: 'Annual appreciation', type: 'percent', default: 3.5, min: -5, max: 15, step: 0.25 },
    ],
    compute(v: CalcValues) {
      const price = n(v, 'price'), downPct = n(v, 'downPct') / 100;
      const rate = n(v, 'rate'), termYears = n(v, 'termYears');
      const rent = n(v, 'rent'), vacancy = n(v, 'vacancy') / 100;
      const taxes = n(v, 'taxes'), insurance = n(v, 'insurance');
      const maintenance = n(v, 'maintenance') / 100, management = n(v, 'management') / 100;
      const closing = n(v, 'closing'), appreciation = n(v, 'appreciation') / 100;

      const down = price * downPct;
      const loan = price - down;
      const payment = levelPayment(loan, rate, termYears * 12);
      const grossRent = rent * 12;
      const effectiveRent = grossRent * (1 - vacancy);
      const operating = taxes + insurance + grossRent * maintenance + effectiveRent * management;
      const noi = effectiveRent - operating;
      const debtService = payment * 12;
      const cashFlow = noi - debtService;

      const invested = down + closing;
      const capRate = price > 0 ? (noi / price) * 100 : 0;
      const cashOnCash = invested > 0 ? (cashFlow / invested) * 100 : 0;
      const dscr = debtService > 0 ? noi / debtService : Infinity;

      const firstYear = amortize(loan, rate, termYears * 12).slice(0, 12);
      const principalPaid = firstYear.reduce((a, r) => a + r.principal, 0);
      const appreciationGain = price * appreciation;
      const totalReturn = invested > 0 ? ((cashFlow + principalPaid + appreciationGain) / invested) * 100 : 0;

      return {
        outputs: [
          { label: 'Net operating income', value: money(noi), hint: `${money(effectiveRent)} effective rent less ${money(operating)} operating` },
          { label: 'Cap rate', value: pct(capRate), tone: capRate >= 6 ? 'good' : capRate >= 4.5 ? 'neutral' : 'bad' },
          { label: 'Annual cash flow', value: money(cashFlow), tone: cashFlow > 0 ? 'good' : 'bad', hint: `${money(cashFlow / 12)} per month` },
          { label: 'Cash-on-cash', value: pct(cashOnCash), tone: cashOnCash >= 8 ? 'good' : cashOnCash >= 4 ? 'neutral' : 'bad' },
          { label: 'Debt service coverage', value: num(dscr, 2), tone: dscr >= 1.25 ? 'good' : dscr >= 1.0 ? 'neutral' : 'bad', hint: 'lenders want 1.25 or better' },
          { label: 'Total first-year return', value: pct(totalReturn), tone: 'key', hint: `cash flow + ${money(principalPaid)} principal + ${money(appreciationGain)} appreciation` },
        ],
        notes: ['Cash-on-cash is the honest operating number. The total return includes appreciation, which is a forecast, and principal paydown, which is real but illiquid.'],
      };
    },
  },
  {
    id: 'exchange-1031',
    name: '1031 Exchange',
    category: 'Real Estate',
    blurb: 'What deferral is worth against paying the tax now, including the depreciation recapture most people forget.',
    fields: [
      { key: 'salePrice', label: 'Sale price', type: 'money', default: 1_800_000, min: 0 },
      { key: 'basis', label: 'Adjusted basis', type: 'money', default: 620_000, min: 0 },
      { key: 'depreciation', label: 'Depreciation taken', type: 'money', default: 380_000, min: 0 },
      { key: 'capGainsRate', label: 'Capital gains rate', type: 'percent', default: 23.8, min: 0, max: 40, step: 0.1 },
      { key: 'recaptureRate', label: 'Depreciation recapture rate', type: 'percent', default: 25, min: 0, max: 40, step: 0.5 },
      { key: 'stateRate', label: 'State rate', type: 'percent', default: 5, min: 0, max: 15, step: 0.1 },
      { key: 'reinvestReturn', label: 'Return on the replacement property', type: 'percent', default: 8, min: 0, max: 25, step: 0.25 },
      { key: 'years', label: 'Years held after the exchange', type: 'years', default: 15, min: 1, max: 40 },
      { key: 'holdToDeath', label: 'Hold until death (basis steps up)', type: 'toggle', default: true },
    ],
    compute(v: CalcValues) {
      const sale = n(v, 'salePrice'), basis = n(v, 'basis'), depreciation = n(v, 'depreciation');
      const cg = n(v, 'capGainsRate') / 100, recap = n(v, 'recaptureRate') / 100, state = n(v, 'stateRate') / 100;
      const rr = n(v, 'reinvestReturn') / 100, years = Math.round(n(v, 'years'));
      const toDeath = b(v, 'holdToDeath', true);

      const totalGain = Math.max(0, sale - basis);
      const recaptureGain = Math.min(totalGain, depreciation);
      const capitalGain = totalGain - recaptureGain;
      const taxNow = recaptureGain * recap + capitalGain * cg + totalGain * state;

      const exchanged = sale * Math.pow(1 + rr, years);
      const soldAndReinvested = (sale - taxNow) * Math.pow(1 + rr, years);
      const deferredTaxDue = toDeath ? 0 : taxNow; // No indexation on a deferred 1031 gain.
      const exchangedNet = exchanged - deferredTaxDue;

      return {
        outputs: [
          { label: 'Total gain', value: money(totalGain), hint: `${money(recaptureGain)} recapture, ${money(capitalGain)} capital gain` },
          { label: 'Tax if you sell', value: money(taxNow), tone: 'bad', hint: pct(sale > 0 ? (taxNow / sale) * 100 : 0) + ' of the sale price' },
          { label: `Exchange, ${years} years on`, value: money(exchangedNet), tone: 'good' },
          { label: 'Sell and reinvest the rest', value: money(soldAndReinvested) },
          { label: 'Deferral is worth', value: money(exchangedNet - soldAndReinvested), tone: 'key', hint: toDeath ? 'the deferred gain is erased by the step-up at death' : 'the deferred tax still comes due' },
        ],
        notes: [
          'Forty-five days to identify, one hundred and eighty to close, a qualified intermediary from the start. Touch the proceeds and the exchange is over.',
          'Swap till you drop is the real strategy: each exchange defers, and death steps the basis up. The deferral becomes forgiveness.',
        ],
      };
    },
  },
  {
    id: 'str-tax',
    name: 'Short-Term Rental Tax Strategy',
    category: 'Real Estate',
    blurb: 'The seven-day average stay exception turns passive losses into active ones. This prices the deduction.',
    fields: [
      { key: 'price', label: 'Purchase price', type: 'money', default: 900_000, min: 0 },
      { key: 'landPct', label: 'Land allocation', type: 'percent', default: 20, min: 0, max: 50, step: 1 },
      { key: 'costSegPct', label: 'Reclassified to 5/7/15-year property', type: 'percent', default: 28, min: 0, max: 50, step: 1, help: 'A cost segregation study typically moves 20-35% of the building into accelerated classes.' },
      { key: 'bonusPct', label: 'Bonus depreciation rate', type: 'percent', default: 40, min: 0, max: 100, step: 10 },
      { key: 'marginalRate', label: 'Combined marginal rate', type: 'percent', default: 43, min: 0, max: 60, step: 1 },
      { key: 'avgStay', label: 'Average stay (days)', type: 'number', default: 4, min: 1, max: 60 },
      { key: 'materialHours', label: 'Hours of material participation', type: 'number', default: 120, min: 0, max: 1000 },
      { key: 'studyCost', label: 'Cost segregation study', type: 'money', default: 7_500, min: 0 },
    ],
    compute(v: CalcValues) {
      const price = n(v, 'price'), landPct = n(v, 'landPct') / 100;
      const costSegPct = n(v, 'costSegPct') / 100, bonusPct = n(v, 'bonusPct') / 100;
      const mr = n(v, 'marginalRate') / 100, avgStay = n(v, 'avgStay');
      const hours = n(v, 'materialHours'), studyCost = n(v, 'studyCost');

      const building = price * (1 - landPct);
      const accelerated = building * costSegPct;
      const bonusDeduction = accelerated * bonusPct;
      const straightLine = (building - accelerated) / 39;
      const firstYearDeduction = bonusDeduction + straightLine + (accelerated - bonusDeduction) / 7;

      const qualifies = avgStay < 7 && hours >= 100;
      const taxSaved = qualifies ? firstYearDeduction * mr : 0;
      const netBenefit = taxSaved - studyCost;

      return {
        outputs: [
          { label: 'Depreciable building', value: money(building), hint: `${pct(landPct * 100, 0)} allocated to land` },
          { label: 'Reclassified by cost segregation', value: money(accelerated) },
          { label: 'First-year deduction', value: money(firstYearDeduction), tone: 'key' },
          { label: 'Qualifies as non-passive', value: qualifies ? 'Yes' : 'No', tone: qualifies ? 'good' : 'bad', hint: qualifies ? `${avgStay}-day average stay, ${hours} hours of participation` : avgStay >= 7 ? 'average stay is seven days or more — this is passive rental activity' : 'material participation requires at least 100 hours and more than anyone else' },
          { label: 'Tax saved in year one', value: money(taxSaved), tone: qualifies ? 'good' : 'bad' },
          { label: 'Net of the study', value: money(netBenefit), tone: netBenefit > 0 ? 'good' : 'bad' },
        ],
        notes: [
          'The short-term rental loophole is not a loophole — it is §469 and the seven-day exception in the regulations. It works, and it is audited on exactly two facts: average stay and hours logged.',
          'Keep a contemporaneous time log. Reconstructed hours lose.',
          'Depreciation taken is depreciation recaptured at sale, at 25%. This accelerates the deduction; it does not create one.',
        ],
      };
    },
  },
];

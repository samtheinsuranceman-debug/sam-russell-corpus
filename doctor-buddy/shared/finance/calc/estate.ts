import { money, pct, num } from '../format';
import { type CalcDef, type CalcValues, n, b, futureValue } from './core';

/** 2025 federal basic exclusion. Scheduled to roughly halve when TCJA sunsets. */
const EXCLUSION_2025 = 13_990_000;
const ESTATE_RATE = 40;

export const estateCalcs: CalcDef[] = [
  {
    id: 'estate-tax',
    name: 'Estate Tax Exposure',
    category: 'Estate & Legacy',
    blurb: 'What the estate owes at death, before and after the exclusion sunset, and how fast the exposure grows while you wait.',
    fields: [
      { key: 'estate', label: 'Gross estate today', type: 'money', default: 18_000_000, min: 0 },
      { key: 'growth', label: 'Estate growth rate', type: 'percent', default: 6, min: 0, max: 20, step: 0.25 },
      { key: 'years', label: 'Years to death', type: 'years', default: 22, min: 0, max: 50 },
      { key: 'married', label: 'Married (portability available)', type: 'toggle', default: true },
      { key: 'sunset', label: 'Assume the exclusion halves', type: 'toggle', default: true, help: 'The elevated exclusion is scheduled to revert. Planning to the lower number is the conservative posture.' },
      { key: 'lifetimeGifts', label: 'Lifetime gifts already made', type: 'money', default: 0, min: 0 },
      { key: 'stateRate', label: 'State estate tax rate', type: 'percent', default: 0, min: 0, max: 20, step: 0.5 },
      { key: 'stateExclusion', label: 'State exclusion', type: 'money', default: 0, min: 0 },
    ],
    compute(v: CalcValues) {
      const estate0 = n(v, 'estate'), growth = n(v, 'growth'), years = Math.round(n(v, 'years'));
      const married = b(v, 'married', true), sunset = b(v, 'sunset', true);
      const gifts = n(v, 'lifetimeGifts'), stateRate = n(v, 'stateRate'), stateExclusion = n(v, 'stateExclusion');

      const estateAtDeath = estate0 * Math.pow(1 + growth / 100, years);
      // The exclusion is indexed; a 2.5% drift is the usual planning assumption.
      const indexed = EXCLUSION_2025 * Math.pow(1.025, years);
      const perPerson = sunset ? indexed / 2 : indexed;
      const exclusion = Math.max(0, perPerson * (married ? 2 : 1) - gifts);

      const federalTaxable = Math.max(0, estateAtDeath - exclusion);
      const federalTax = federalTaxable * (ESTATE_RATE / 100);
      const stateTaxable = Math.max(0, estateAtDeath - stateExclusion);
      const stateTax = stateRate > 0 ? stateTaxable * (stateRate / 100) : 0;
      const total = federalTax + stateTax;

      const data: Array<Record<string, number>> = [];
      for (let y = 0; y <= years; y++) {
        const est = estate0 * Math.pow(1 + growth / 100, y);
        const exc = Math.max(0, (sunset ? EXCLUSION_2025 * Math.pow(1.025, y) / 2 : EXCLUSION_2025 * Math.pow(1.025, y)) * (married ? 2 : 1) - gifts);
        data.push({ year: y, estate: Math.round(est), tax: Math.round(Math.max(0, est - exc) * 0.4) });
      }

      return {
        outputs: [
          { label: 'Estate at death', value: money(estateAtDeath), hint: `${money(estate0)} growing at ${pct(growth)}` },
          { label: 'Exclusion available', value: money(exclusion), hint: married ? 'both spouses, with portability' : 'single exclusion' + (sunset ? ', post-sunset' : '') },
          { label: 'Federal estate tax', value: money(federalTax), tone: federalTax > 0 ? 'bad' : 'good', hint: `${pct(ESTATE_RATE, 0)} of ${money(federalTaxable)}` },
          { label: 'State estate tax', value: money(stateTax), tone: stateTax > 0 ? 'bad' : 'neutral' },
          { label: 'Total due, in cash, within nine months', value: money(total), tone: 'key' },
          { label: 'Heirs receive', value: money(estateAtDeath - total) },
        ],
        chart: { data, xKey: 'year', yFormat: 'moneyShort', series: [
          { key: 'estate', label: 'Estate', color: '#c8a24a' },
          { key: 'tax', label: 'Tax exposure', color: '#9f1239' },
        ] },
        notes: [
          'Federal estate tax is due nine months after death, in cash. Illiquid estates — a business, real estate, a farm — are where families sell assets at a discount to pay it.',
          `An irrevocable life insurance trust holding ${money(total)} of death benefit outside the estate pays that bill with dollars that were never taxed and never counted.`,
        ],
      };
    },
  },
  {
    id: 'ilit',
    name: 'ILIT Leverage',
    category: 'Estate & Legacy',
    blurb: 'Annual exclusion gifts into a trust, converted into a death benefit that sits outside the taxable estate.',
    fields: [
      { key: 'beneficiaries', label: 'Beneficiaries (Crummey powers)', type: 'number', default: 4, min: 1, max: 20 },
      { key: 'donors', label: 'Donors', type: 'number', default: 2, min: 1, max: 2 },
      { key: 'annualExclusion', label: 'Annual exclusion per donee', type: 'money', default: 19_000, min: 0 },
      { key: 'premium', label: 'Annual premium', type: 'money', default: 120_000, min: 0 },
      { key: 'deathBenefit', label: 'Death benefit purchased', type: 'money', default: 6_500_000, min: 0 },
      { key: 'years', label: 'Years of funding', type: 'years', default: 15, min: 1, max: 40 },
      { key: 'estateRate', label: 'Estate tax rate', type: 'percent', default: 40, min: 0, max: 55, step: 1 },
      { key: 'altReturn', label: 'Return if invested in the estate instead', type: 'percent', default: 6.5, min: 0, max: 20, step: 0.25 },
    ],
    compute(v: CalcValues) {
      const beneficiaries = Math.round(n(v, 'beneficiaries')), donors = Math.round(n(v, 'donors'));
      const exclusion = n(v, 'annualExclusion'), premium = n(v, 'premium');
      const db = n(v, 'deathBenefit'), years = Math.round(n(v, 'years'));
      const estateRate = n(v, 'estateRate'), altReturn = n(v, 'altReturn');

      const giftCapacity = beneficiaries * donors * exclusion;
      const overage = Math.max(0, premium - giftCapacity);
      const totalGifted = premium * years;

      const insideEstate = futureValue(0, premium, altReturn, years);
      const insideAfterTax = insideEstate * (1 - estateRate / 100);
      const leverage = totalGifted > 0 ? db / totalGifted : 0;

      return {
        outputs: [
          { label: 'Annual exclusion capacity', value: money(giftCapacity), tone: overage > 0 ? 'bad' : 'good', hint: `${beneficiaries} beneficiaries × ${donors} donor${donors > 1 ? 's' : ''} × ${money(exclusion)}` },
          { label: overage > 0 ? 'Premium above the exclusion' : 'Premium fits inside the exclusion', value: overage > 0 ? money(overage) : money(premium), hint: overage > 0 ? 'uses lifetime exemption and requires a gift tax return' : 'no exemption consumed' },
          { label: 'Total gifted over ' + years + ' years', value: money(totalGifted) },
          { label: 'Death benefit, outside the estate', value: money(db), tone: 'key', hint: `${num(leverage, 2)}× the money gifted, income and estate tax free` },
          { label: 'Same money left in the estate', value: money(insideAfterTax), tone: 'bad', hint: `${money(insideEstate)} grown, less ${pct(estateRate, 0)} estate tax` },
          { label: 'ILIT advantage', value: money(db - insideAfterTax), tone: 'good' },
        ],
        notes: [
          'The trust must own the policy and be the beneficiary, and the gifts need genuine Crummey withdrawal notices. A policy transferred into a trust within three years of death is pulled back into the estate under §2035.',
          'This is a legal structure. It requires trust counsel and a trustee who is not you.',
        ],
      };
    },
  },
  {
    id: 'generational-transfer',
    name: 'Multi-Generational Transfer',
    category: 'Estate & Legacy',
    blurb: 'What survives two transfer events, with and without a structure built to skip them.',
    fields: [
      { key: 'estate', label: 'Estate today', type: 'money', default: 12_000_000, min: 0 },
      { key: 'growth', label: 'Growth rate', type: 'percent', default: 6, min: 0, max: 20, step: 0.25 },
      { key: 'gen1Years', label: 'Years to first transfer', type: 'years', default: 20, min: 1, max: 50 },
      { key: 'gen2Years', label: 'Years to second transfer', type: 'years', default: 28, min: 1, max: 60 },
      { key: 'estateRate', label: 'Estate tax rate', type: 'percent', default: 40, min: 0, max: 55, step: 1 },
      { key: 'exclusion', label: 'Exclusion at each transfer', type: 'money', default: 7_000_000, min: 0 },
      { key: 'gstExempt', label: 'Dynasty trust (GST exempt)', type: 'toggle', default: false },
    ],
    compute(v: CalcValues) {
      const estate0 = n(v, 'estate'), growth = n(v, 'growth');
      const g1 = Math.round(n(v, 'gen1Years')), g2 = Math.round(n(v, 'gen2Years'));
      const rate = n(v, 'estateRate') / 100, exclusion = n(v, 'exclusion');
      const gst = b(v, 'gstExempt', false);

      const atG1 = estate0 * Math.pow(1 + growth / 100, g1);
      const taxG1 = Math.max(0, atG1 - exclusion) * rate;
      const afterG1 = atG1 - taxG1;
      const atG2 = afterG1 * Math.pow(1 + growth / 100, g2 - g1 > 0 ? g2 - g1 : 0);
      const taxG2 = gst ? 0 : Math.max(0, atG2 - exclusion) * rate;
      const afterG2 = atG2 - taxG2;

      const untaxed = estate0 * Math.pow(1 + growth / 100, g2);

      return {
        outputs: [
          { label: `Estate at year ${g1}`, value: money(atG1) },
          { label: 'First transfer tax', value: money(taxG1), tone: 'bad' },
          { label: `Estate at year ${g2}`, value: money(atG2) },
          { label: 'Second transfer tax', value: money(taxG2), tone: gst ? 'good' : 'bad', hint: gst ? 'GST exemption allocated — the trust skips this event entirely' : 'taxed again at the same rate' },
          { label: 'Reaches the third generation', value: money(afterG2), tone: 'key' },
          { label: 'Lost to transfer tax', value: money(untaxed - afterG2), tone: 'bad', hint: pct(untaxed > 0 ? ((untaxed - afterG2) / untaxed) * 100 : 0, 0) + ' of what the money grew to' },
        ],
        notes: [
          'Transfer tax compounds across generations in the same way returns do, just in the wrong direction. Two 40% events leave 36% of the growth.',
          'A properly GST-exempt dynasty trust is taxed once, at funding, and then never again for the life of the trust.',
        ],
      };
    },
  },
  {
    id: 'step-up-basis',
    name: 'Step-Up in Basis',
    category: 'Estate & Legacy',
    blurb: 'What holding an appreciated asset until death is worth, against gifting it during life and carrying the basis over.',
    fields: [
      { key: 'value', label: 'Current value', type: 'money', default: 4_000_000, min: 0 },
      { key: 'basis', label: 'Cost basis', type: 'money', default: 600_000, min: 0 },
      { key: 'growth', label: 'Growth rate', type: 'percent', default: 6, min: 0, max: 20, step: 0.25 },
      { key: 'years', label: 'Years held', type: 'years', default: 18, min: 0, max: 50 },
      { key: 'capGainsRate', label: 'Heirs\' capital gains rate', type: 'percent', default: 23.8, min: 0, max: 40, step: 0.1 },
      { key: 'estateRate', label: 'Estate tax rate on the asset', type: 'percent', default: 0, min: 0, max: 55, step: 1, help: 'Zero if the estate is under the exclusion.' },
    ],
    compute(v: CalcValues) {
      const value0 = n(v, 'value'), basis = n(v, 'basis'), growth = n(v, 'growth');
      const years = Math.round(n(v, 'years')), cg = n(v, 'capGainsRate') / 100, er = n(v, 'estateRate') / 100;
      const atDeath = value0 * Math.pow(1 + growth / 100, years);

      // Hold to death: basis steps up, no capital gains; estate tax may apply.
      const holdNet = atDeath * (1 - er);
      // Gift now: basis carries over; heirs pay gains on everything above it.
      const giftNet = atDeath - (atDeath - basis) * cg;

      return {
        outputs: [
          { label: 'Value at death', value: money(atDeath) },
          { label: 'Unrealized gain', value: money(atDeath - basis) },
          { label: 'Hold until death (stepped-up basis)', value: money(holdNet), tone: holdNet >= giftNet ? 'good' : 'neutral', hint: er > 0 ? `after ${pct(er * 100, 0)} estate tax, no capital gains` : 'no capital gains, no estate tax' },
          { label: 'Gift during life (carryover basis)', value: money(giftNet), tone: giftNet > holdNet ? 'good' : 'neutral', hint: `heirs owe ${money((atDeath - basis) * cg)} in capital gains` },
          { label: 'Difference', value: money(Math.abs(holdNet - giftNet)), tone: 'key' },
        ],
        notes: [
          'The step-up is the most valuable feature of the tax code that costs nothing to use. Gifting a highly appreciated asset during life throws it away.',
          'Gift the low-basis assets to charity and the high-basis assets to family. Hold the appreciated ones until death.',
        ],
      };
    },
  },
];

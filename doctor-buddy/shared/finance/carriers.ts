/**
 * Carrier index accounts, with the indices renamed.
 *
 * ── On the renaming ─────────────────────────────────────────────────────────
 *
 * Every index here carries a descriptive alias rather than its licensed name.
 * That is deliberate. Index names are trademarks belonging to their sponsors,
 * and a public marketing page that reproduces them alongside modelled crediting
 * figures makes a claim about somebody else's product that we are not licensed
 * to make. The alias describes what the index IS — a broad large-cap index, a
 * volatility-controlled multi-asset index — so a reader can follow the
 * arithmetic, and the contract names the real one.
 *
 * `underlying` records what each alias stands for so the mapping is never lost
 * internally. It is not rendered.
 *
 * ── On sourcing ─────────────────────────────────────────────────────────────
 *
 * The rule from the platform's own carrier intake file applies here without
 * exception:
 *
 *     "A field without a source and an as-of date does not go in. If a
 *      document is missing a number, the number stays absent and the tool
 *      reports it as absent. Filling a gap with a plausible figure is how a
 *      rate sheet becomes fiction that nobody can later distinguish from fact."
 *
 * So every account below carries `source` and `asOf`. An account we do not hold
 * a rate sheet for is marked `sourced: false` and the UI says so on screen.
 */

export type CreditingMethod =
  | 'point-to-point'
  | 'monthly-average'
  | 'monthly-sum'
  | 'daily-average'
  | 'declared';

export interface IndexAlias {
  /** What the site displays. */
  alias: string;
  /** What it actually is. Internal only — never rendered. */
  underlying: string;
  /** Key into a returns series, where we hold one. */
  series: 'SP500' | 'NASDAQ100' | 'RUSSELL2000' | 'DJIA' | 'VOLCONTROL' | null;
}

export const INDICES: Record<string, IndexAlias> = {
  broad500: { alias: 'Broad Market 500', underlying: 'S&P 500 (ex-dividend)', series: 'SP500' },
  growth100: { alias: 'Growth 100', underlying: 'Nasdaq-100 (ex-dividend)', series: 'NASDAQ100' },
  industrial30: { alias: 'Industrial 30', underlying: 'Dow Jones Industrial Average', series: 'DJIA' },
  smallCap2000: { alias: 'Small Cap 2000', underlying: 'Russell 2000', series: 'RUSSELL2000' },
  volA: { alias: 'Managed Volatility A', underlying: 'J.P. Morgan Mercury', series: 'VOLCONTROL' },
  volB: { alias: 'Managed Volatility B', underlying: 'BNP Paribas Global H-Factor', series: 'VOLCONTROL' },
  volC: { alias: 'Managed Volatility C', underlying: 'BlackRock Endura', series: 'VOLCONTROL' },
  multiAsset: { alias: 'Multi-Asset Risk Control', underlying: 'S&P PRISM', series: 'VOLCONTROL' },
};

export interface CarrierAccount {
  id: string;
  /** Account name as the contract names it, with the index alias substituted. */
  name: string;
  /** Index alias key, or a blend. */
  index: keyof typeof INDICES | 'blend' | 'fixed';
  /** For a blend, the component aliases and how they are weighted. */
  blend?: { components: Array<keyof typeof INDICES>; rule: string };
  method: CreditingMethod;
  termYears: 1 | 2 | 5;
  /** Current cap, in percent. `null` means uncapped. */
  cap: number | null;
  capGuaranteed: number | null;
  participation: number;
  participationGuaranteed: number | null;
  /** Deducted before floor and cap. */
  spread: number | null;
  spreadGuaranteed: number | null;
  floor: number;
  /** Annual charge against account value. */
  strategyCharge: number;
  strategyChargeGuaranteed: number | null;
  /** Flat credit added, e.g. a "Plus" bonus. */
  bonus: number;
  /** True only when every figure above comes off a held rate sheet. */
  sourced: boolean;
  note?: string;
}

export type ProductStatus = 'open' | 'closed-to-new-business' | 'awaiting-documents';

export interface Carrier {
  id: string;
  name: string;
  product: string;
  /**
   * Whether the product can still be sold.
   *
   * A closed product's rates are history, not an offer. Quoting one as though
   * it were available is the kind of error that is invisible in code review and
   * obvious to a prospect, so the status is required and the UI refuses to run
   * anything that is not `open`.
   */
  status: ProductStatus;
  /** What replaced it, when it is closed. */
  supersededBy?: string;
  /** Exact document and date, or null when we hold nothing. */
  source: string | null;
  asOf: string | null;
  /** Non-direct-recognition carriers pay the full dividend on borrowed value. */
  accounts: CarrierAccount[];
  /** Carrier-published look-back rates, where they publish them. */
  lookback?: Array<{ account: string; windows: Record<string, number> }>;
  gaps: string[];
}

// ─── Nationwide ─────────────────────────────────────────────────────────────
// Fully transcribed. Source: Nationwide IUL Accumulator II 2020 Rate Guide,
// FLM-1491AO.10 (02/25); current and guaranteed rates as of 15 March 2025.

const NW = (
  id: string, name: string, index: CarrierAccount['index'], method: CreditingMethod,
  cap: number | null, capG: number | null, par: number, parG: number | null,
  spread: number | null, spreadG: number | null, charge: number, chargeG: number | null,
  bonus = 0, blend?: CarrierAccount['blend'], note?: string,
): CarrierAccount => ({
  id, name, index, method, termYears: 1, cap, capGuaranteed: capG,
  participation: par, participationGuaranteed: parG, spread, spreadGuaranteed: spreadG,
  floor: 0, strategyCharge: charge, strategyChargeGuaranteed: chargeG, bonus,
  sourced: true, blend, note,
});

export const NATIONWIDE: Carrier = {
  id: 'nationwide',
  status: 'open',
  name: 'Nationwide Life and Annuity',
  product: 'IUL Accumulator II 2020',
  source: 'IUL Accumulator II 2020 Rate Guide, FLM-1491AO.10 (02/25)',
  asOf: '15 March 2025',
  accounts: [
    NW('nw-multi', 'One-Year Multi-Index Monthly Average', 'blend', 'monthly-average',
      13.0, 4.0, 100, null, null, null, 0, 0.5, 0,
      { components: ['broad500', 'growth100', 'industrial30'], rule: '50% best, 30% second, 20% third' },
      'The 50/30/20 weighting is the contract, not hindsight bias.'),
    NW('nw-sp-ptp', 'One-Year Broad Market 500 Point-to-Point', 'broad500', 'point-to-point',
      10.25, 4.0, 100, null, null, null, 0, 0.5),
    NW('nw-sp-uncapped', 'One-Year Uncapped Broad Market 500 Point-to-Point', 'broad500', 'point-to-point',
      null, 4.0, 100, null, 6.0, 10.0, 0, 0.5),
    NW('nw-multi-highcap', 'One-Year High Cap Multi-Index Monthly Average', 'blend', 'monthly-average',
      25.0, 4.0, 100, null, null, null, 0.85, 1.5, 0,
      { components: ['broad500', 'growth100', 'industrial30'], rule: '50% best, 30% second, 20% third' }),
    NW('nw-sp-highcap', 'One-Year High Cap Broad Market 500 Point-to-Point', 'broad500', 'point-to-point',
      13.0, 4.0, 100, null, null, null, 1.0, 1.5),
    NW('nw-volA-plus', 'Managed Volatility A — Plus', 'volA', 'point-to-point',
      null, null, 185, 65, null, null, 0, null, 0.6),
    NW('nw-volB-plus', 'Managed Volatility B — Plus', 'volB', 'point-to-point',
      null, null, 235, 65, null, null, 0, null, 0.6),
    NW('nw-volA-highpar', 'Managed Volatility A — High Participation', 'volA', 'point-to-point',
      null, null, 210, 65, null, null, 0, null),
    NW('nw-volB-highpar', 'Managed Volatility B — High Participation', 'volB', 'point-to-point',
      null, null, 265, 65, null, null, 0, null),
    NW('nw-volA-select', 'Managed Volatility A — High Par Select', 'volA', 'point-to-point',
      null, null, 250, 65, null, null, 1.0, 1.5),
    NW('nw-volB-select', 'Managed Volatility B — High Par Select', 'volB', 'point-to-point',
      null, null, 315, 65, null, null, 1.0, 1.5),
    { id: 'nw-fixed', name: 'Fixed interest strategy', index: 'fixed', method: 'declared',
      termYears: 1, cap: 4.0, capGuaranteed: 1.0, participation: 0, participationGuaranteed: null,
      spread: null, spreadGuaranteed: null, floor: 0, strategyCharge: 0,
      strategyChargeGuaranteed: null, bonus: 0, sourced: true },
  ],
  lookback: [
    { account: 'nw-multi', windows: { '30yr': 7.52, '25yr': 6.54, '20yr': 7.32, '15yr': 7.93, '10yr': 7.86, '5yr': 8.46 } },
    { account: 'nw-sp-ptp', windows: { '30yr': 6.98, '25yr': 6.47, '20yr': 7.03, '15yr': 7.51, '10yr': 7.18, '5yr': 7.22 } },
    { account: 'nw-sp-uncapped', windows: { '30yr': 8.68, '25yr': 7.20, '20yr': 8.17, '15yr': 8.81, '10yr': 9.57, '5yr': 13.98 } },
    { account: 'nw-multi-highcap', windows: { '30yr': 9.32, '25yr': 7.54, '20yr': 8.40, '15yr': 8.90, '10yr': 9.15, '5yr': 11.08 } },
    { account: 'nw-sp-highcap', windows: { '30yr': 8.42, '25yr': 7.74, '20yr': 8.48, '15yr': 9.10, '10yr': 8.77, '5yr': 9.05 } },
  ],
  gaps: [
    'No Industrial 30 return series is held, so the Multi-Index accounts cannot be backtested faithfully. They are listed but not run.',
    'Monthly-average crediting is not the same mechanic as point-to-point. Averaging strips the peak, which is exactly why a 25% cap can be offered on one. Modelling a monthly-average account as point-to-point overstates it — by more than three points a year against the carrier\'s own published look-back.',
    'Carrier look-backs are an ARITHMETIC average of one-year rates and exclude the High-Cap and High-Par Select strategy charges and the 0.60% Plus credit. An arithmetic average runs above a compound one, so they are not directly comparable to a compounded backtest.',
    'No surrender charge schedule, no cost-of-insurance table. A rate guide is not an illustration, and cost is most of the answer.',
  ],
};

// ─── Securian ───────────────────────────────────────────────────────────────

/**
 * Balanced Growth Accumulator II — CLOSED TO NEW BUSINESS.
 *
 * Retained because the mechanic it demonstrates is the point, and because its
 * successor is built on the same Annexus/Genesis Balanced Allocation Strategy
 * and will behave the same way. The parameters are history and the site says so
 * everywhere they appear.
 */
export const SECURIAN_BGA2: Carrier = {
  id: 'securian-bga2',
  status: 'closed-to-new-business',
  supersededBy: 'securian-bga3',
  name: 'Minnesota Life (Securian Financial)',
  product: 'Balanced Growth Accumulator II IUL',
  source: 'BGA II IUL product fliers F94327-15 (DOFU 10-2022, rev 08-2023), F94327-5 (rev 8-2024) and 2924526 (DOFU 6-2023, rev 3-2024); policy forms ICC19-20204, 19-20204',
  asOf: 'March 2024',
  accounts: [
    {
      id: 'sec-bia-2yr',
      name: '2-Year Balanced Indexed Account',
      index: 'broad500',
      method: 'point-to-point',
      termYears: 2,
      cap: null, capGuaranteed: null,
      participation: 105, participationGuaranteed: null,
      spread: 2.5, spreadGuaranteed: null,
      floor: 0,
      strategyCharge: 0, strategyChargeGuaranteed: null,
      bonus: 0,
      sourced: true,
      note: 'Uncapped. 100% equity allocation, 105% participation, 2.50% segment spread, over a TWO-YEAR segment. The term is the mechanism — the index compounds across both years before participation and spread are applied once. Segments are established monthly, so a policy holds many overlapping ones. THESE PARAMETERS ARE FROM A PRODUCT NO LONGER SOLD.',
    },
  ],
  gaps: [
    'CLOSED TO NEW BUSINESS. Nothing here may be quoted as available. It is retained only to show how a multi-year segment credits.',
    'These figures came from product fliers, not a rate sheet, and the successor product will carry its own participation rate and spread.',
    'No charges were ever held for this product: cost of insurance, premium charge, monthly policy charge, policy issue charge, transaction charge, index segment charge and surrender charge are named in the fliers and none are quantified.',
  ],
};

/**
 * Balanced Growth Accumulator 3 — the current product, and we hold nothing.
 *
 * Searched: every repository in this account, and the owner's Drive. The Drive
 * holds four BGA documents and all four are BGA II (fliers F94327-15,
 * F94327-5, 2924526 and the Income Flex and Chronic Illness brochures, all on
 * policy forms ICC19-20204 / 19-20204). There is no BGA 3 material anywhere
 * reachable.
 *
 * The slot exists so the gap is visible in the product rather than only in a
 * conversation, and so the document drops straight in when it arrives.
 */
export const SECURIAN_BGA3: Carrier = {
  id: 'securian-bga3',
  status: 'awaiting-documents',
  name: 'Minnesota Life (Securian Financial)',
  product: 'Balanced Growth Accumulator 3 IUL',
  source: null,
  asOf: null,
  accounts: [],
  gaps: [
    'NO DOCUMENT IS HELD FOR THIS PRODUCT. Nothing can be quoted, modelled or illustrated until one arrives.',
    'Needed: the account list as the contract names it; for each account the index, the crediting method, the segment TERM, the cap, the participation rate, the segment spread, the floor and any index segment charge; every guaranteed minimum, particularly the guaranteed minimum participation rate on an uncapped account; and the rate sheet date.',
    'Also needed, and never supplied for BGA II: the charge stack. Premium charge, monthly policy charge, policy issue charge, transaction charge, index segment charge, cost of insurance and the surrender charge schedule. A crediting figure without those is half an answer.',
    'A full BGA 3 ILLUSTRATION would supply all of the above at once, which a flier never does.',
    'Expect the Balanced Allocation Strategy to carry forward — an equity component, a declared-rate component, a segment spread and a participation rate, over one-, two- and three-year segments. If it does, the segment arithmetic shown for BGA II applies unchanged and only the numbers move.',
  ],
};

// ─── Pacific Life ───────────────────────────────────────────────────────────
// Source: IUF3957-00 9/25 (22-VER-87E) and IUC4009-1124-WH 11/24 (22-VER-104D).

export const PACIFIC_LIFE: Carrier = {
  id: 'pacific-life',
  status: 'open',
  name: 'Pacific Life',
  product: 'Pacific Horizon ECV IUL (P21IUL, S22ECV)',
  source: 'IUF3957-00 9/25 (22-VER-87E); IUC4009-1124-WH 11/24 (22-VER-104D)',
  asOf: 'September 2025 / November 2024',
  accounts: [
    { id: 'pl-1yr', name: '1-Year Broad Market 500', index: 'broad500', method: 'point-to-point',
      termYears: 1, cap: 10.0, capGuaranteed: 2.0, participation: 100, participationGuaranteed: 100,
      spread: null, spreadGuaranteed: null, floor: 0, strategyCharge: 0, strategyChargeGuaranteed: null,
      bonus: 0, sourced: true },
    { id: 'pl-1yr-highcap', name: '1-Year High Cap Broad Market 500', index: 'broad500', method: 'point-to-point',
      termYears: 1, cap: 12.0, capGuaranteed: 4.0, participation: 100, participationGuaranteed: 100,
      spread: null, spreadGuaranteed: null, floor: 0, strategyCharge: 0.8, strategyChargeGuaranteed: null,
      bonus: 0, sourced: true, note: 'Charge is 0.80%/yr of account value.' },
    { id: 'pl-dynamic-par', name: '1-Year No Cap Dynamic Participation', index: 'broad500', method: 'point-to-point',
      termYears: 1, cap: null, capGuaranteed: null, participation: 50, participationGuaranteed: 5,
      spread: null, spreadGuaranteed: null, floor: 0, strategyCharge: 0, strategyChargeGuaranteed: null,
      bonus: 0, sourced: true,
      note: 'A tenfold gap: the illustration assumes 50% participation and the contractual guaranteed minimum is 5%, declared as often as monthly. That gap is the entire risk of this account and it is easy to miss.' },
    { id: 'pl-qqq', name: '1-Year Growth 100', index: 'growth100', method: 'point-to-point',
      termYears: 1, cap: 10.5, capGuaranteed: 1.0, participation: 100, participationGuaranteed: 100,
      spread: null, spreadGuaranteed: null, floor: 0, strategyCharge: 0, strategyChargeGuaranteed: null,
      bonus: 0, sourced: true },
    { id: 'pl-2yr', name: '2-Year Broad Market 500', index: 'broad500', method: 'point-to-point',
      termYears: 2, cap: 24.0, capGuaranteed: 6.0, participation: 100, participationGuaranteed: 100,
      spread: null, spreadGuaranteed: null, floor: 0, strategyCharge: 0, strategyChargeGuaranteed: null,
      bonus: 0, sourced: true, note: 'Cap is per two-year term, not per year.' },
    { id: 'pl-5yr', name: 'High Participation 5-Year Broad Market 500', index: 'broad500', method: 'point-to-point',
      termYears: 5, cap: null, capGuaranteed: 10, participation: 110, participationGuaranteed: 105,
      spread: null, spreadGuaranteed: null, floor: 0, strategyCharge: 0, strategyChargeGuaranteed: null,
      bonus: 0, sourced: true, note: 'Guaranteed cap is per five-year term.' },
    { id: 'pl-vol', name: '1-Year Managed Volatility C', index: 'volC', method: 'point-to-point',
      termYears: 1, cap: null, capGuaranteed: null, participation: 100, participationGuaranteed: null,
      spread: null, spreadGuaranteed: null, floor: 0, strategyCharge: 0, strategyChargeGuaranteed: null,
      bonus: 0.4, sourced: true, note: 'Participation rate not published. Carries a +0.40% enhanced credit.' },
  ],
  gaps: [
    'Cost of insurance rates are not published in the held documents — only the mechanic (per $1,000 of net amount at risk to age 121).',
    'No surrender charge schedule. It applies within 10 years of any basic coverage layer issue date; the amounts are not given.',
    'The alternate (participating) loan rate is not published; only the 7.5% guaranteed maximum.',
  ],
};

export const CARRIERS: Carrier[] = [NATIONWIDE, PACIFIC_LIFE, SECURIAN_BGA3, SECURIAN_BGA2];

export const carrierById = (id: string) => CARRIERS.find(c => c.id === id);

/** Every account we hold a complete rate sheet for, on a product still sold. */
export const sourcedAccounts = (): Array<{ carrier: Carrier; account: CarrierAccount }> =>
  CARRIERS.filter(c => c.status === 'open')
    .flatMap(c => c.accounts.filter(a => a.sourced).map(a => ({ carrier: c, account: a })));

/**
 * Whether an account can honestly be backtested against the return series held.
 *
 * Two things disqualify one: a crediting method other than point-to-point,
 * because averaging is a materially different mechanic; and an index we hold no
 * return series for.
 */
export function canBacktest(a: CarrierAccount, carrier?: Carrier): { ok: boolean; reason?: string } {
  if (carrier && carrier.status === 'awaiting-documents') {
    return { ok: false, reason: 'No document is held for this product.' };
  }
  if (carrier && carrier.status === 'closed-to-new-business') {
    return { ok: false, reason: `This product is closed to new business${carrier.supersededBy ? '' : ''}. Its parameters are history and cannot be quoted as available.` };
  }
  if (!a.sourced) return { ok: false, reason: 'No rate sheet is held for this account.' };
  if (a.index === 'fixed') return { ok: false, reason: 'A declared-rate account has nothing to backtest.' };
  if (a.method !== 'point-to-point') {
    return { ok: false, reason: `This account credits on a ${a.method.replace('-', ' ')}. Running it as point-to-point overstates it — by more than three points a year against the carrier's own look-back.` };
  }
  if (a.index === 'blend') return { ok: false, reason: 'No return series is held for every component of this blend.' };
  const series = INDICES[a.index]?.series;
  if (series === 'VOLCONTROL') {
    return { ok: false, reason: 'Volatility-controlled indices are proprietary and we hold no return series for them. A high participation rate on one is not the same as a high participation rate on a broad equity index — the index itself is engineered to a low volatility target, and its returns run well below the broad market.' };
  }
  if (series !== 'SP500') return { ok: false, reason: 'No return series is held for this index.' };
  return { ok: true };
}

import { money, pct, num } from '../format';
import { type CalcDef, type CalcValues, n, s, b, futureValue } from './core';
import { projectPolicy, projectLoans, minimumNonMecFace, DEFAULT_POLICY, coiPerThousand } from '../iul';
import { creditingHistory, netGrowthRate, compound, SP500_PRICE_RETURN, type AccountParams } from '../sp500';
import { carrierById, canBacktest } from '../carriers';

export const indexedLifeCalcs: CalcDef[] = [
  {
    id: 'iul-illustrator',
    name: 'IUL Policy Illustrator',
    category: 'Indexed Life',
    blurb: 'A full policy projection with the premium load, cost of insurance and policy charges taken out before any credit is applied — so the crediting base is visible next to the premiums paid.',
    fields: [
      { key: 'age', label: 'Issue age', type: 'number', default: DEFAULT_POLICY.issueAge, min: 18, max: 75 },
      { key: 'premium', label: 'Annual premium', type: 'money', default: DEFAULT_POLICY.premium, min: 0 },
      { key: 'premiumYears', label: 'Years funded', type: 'years', default: DEFAULT_POLICY.premiumYears, min: 1, max: 40 },
      { key: 'face', label: 'Death benefit', type: 'money', default: DEFAULT_POLICY.deathBenefit, min: 0, help: 'Too low and the contract becomes a MEC. The minimum non-MEC face is shown below.' },
      { key: 'dbOption', label: 'Death benefit option', type: 'select', default: 'increasing', options: [
        { value: 'increasing', label: 'Option B — increasing (face + account value)' },
        { value: 'level', label: 'Option A — level' },
      ] },
      { key: 'rate', label: 'Credited rate', type: 'percent', default: 6.5, min: 0, max: 20, step: 0.25, help: 'AG 49-A caps what a carrier may illustrate. Anything above roughly 6-7% on a capped strategy is a sales number, not an illustration.' },
      { key: 'load', label: 'Premium load', type: 'percent', default: DEFAULT_POLICY.premiumLoadPct, min: 0, max: 15, step: 0.25 },
      { key: 'years', label: 'Project to year', type: 'years', default: 40, min: 5, max: 60 },
    ],
    compute(v: CalcValues) {
      const age = Math.round(n(v, 'age')), premium = n(v, 'premium');
      const premiumYears = Math.round(n(v, 'premiumYears')), face = n(v, 'face');
      const rate = n(v, 'rate'), load = n(v, 'load'), years = Math.round(n(v, 'years'));
      const dbOption = s(v, 'dbOption', 'increasing') === 'level' ? 'level' as const : 'increasing' as const;

      const result = projectPolicy({
        ...DEFAULT_POLICY,
        issueAge: age, premium, premiumYears, deathBenefit: face, dbOption,
        premiumLoadPct: load, creditingRate: rate, years,
      });

      const minFace = minimumNonMecFace(age, premium, premiumYears);
      const yr5 = result.rows.find(r => r.year === 5);
      const data = result.rows.map(r => ({
        year: r.year,
        accountValue: Math.round(r.accountValue),
        surrenderValue: Math.round(r.surrenderValue),
        premiumsPaid: Math.round(r.cumulativePremium),
      }));
      const table = result.rows
        .filter(r => r.year <= 10 || r.year % 5 === 0)
        .map(r => ({
          year: r.year, age: r.age,
          premium: Math.round(r.premium),
          charges: Math.round(r.totalCharges + r.premiumLoad),
          base: Math.round(r.creditingBase),
          credit: Math.round(r.indexCredit),
          accountValue: Math.round(r.accountValue),
          surrenderValue: Math.round(r.surrenderValue),
          deathBenefit: Math.round(r.deathBenefit),
        }));

      return {
        outputs: [
          { label: 'Total premium', value: money(result.totalPremium), hint: `${money(premium)} × ${premiumYears} years` },
          { label: 'Charges over the projection', value: money(result.totalCharges + result.totalPremium * (load / 100)), tone: 'bad', hint: 'premium load, cost of insurance, policy fee, per-thousand admin' },
          { label: 'Year 5 crediting base', value: money(yr5?.creditingBase ?? 0), tone: 'key', hint: `against ${money(yr5?.cumulativePremium ?? 0)} of premium paid — the difference is what the charges took` },
          { label: 'Break-even', value: result.breakEvenYear ? `year ${result.breakEvenYear}` : 'not within the projection', tone: result.breakEvenYear && result.breakEvenYear <= 8 ? 'good' : 'bad', hint: 'when surrender value first exceeds premiums paid' },
          { label: `Account value at year ${years}`, value: money(result.finalAccountValue), tone: 'good' },
          { label: 'Death benefit', value: money(result.finalDeathBenefit) },
          { label: 'Minimum non-MEC face', value: money(minFace), tone: face >= minFace ? 'good' : 'bad', hint: face >= minFace ? 'the contract stays outside MEC status' : 'this face amount is likely to make the contract a MEC — loans would become taxable' },
        ],
        chart: { data, xKey: 'year', yFormat: 'moneyShort', series: [
          { key: 'accountValue', label: 'Account value', color: '#c8a24a' },
          { key: 'surrenderValue', label: 'Surrender value', color: '#1d4a3c' },
          { key: 'premiumsPaid', label: 'Premiums paid', color: '#6b7280' },
        ] },
        table: { columns: [
          { key: 'year', label: 'Yr', format: 'number' },
          { key: 'age', label: 'Age', format: 'number' },
          { key: 'premium', label: 'Premium', format: 'money' },
          { key: 'charges', label: 'Charges', format: 'money' },
          { key: 'base', label: 'Crediting base', format: 'money' },
          { key: 'credit', label: 'Credit', format: 'money' },
          { key: 'accountValue', label: 'Account value', format: 'money' },
          { key: 'surrenderValue', label: 'Surrender', format: 'money' },
          { key: 'deathBenefit', label: 'Death benefit', format: 'money' },
        ], rows: table, maxRows: 20 },
        notes: [
          'Read the "crediting base" column against "premium". They are not the same number and no honest presentation pretends otherwise.',
          'This is a model, not an illustration. Only a carrier can issue an illustration, and the rate it is allowed to show is limited by Actuarial Guideline 49-A.',
        ],
      };
    },
  },
  {
    id: 'policy-loan',
    name: 'Policy Loan Arbitrage',
    category: 'Indexed Life',
    blurb: 'The reason this product exists: under a participating loan the cash value never leaves the indexed account. You spend the money and it keeps earning.',
    fields: [
      { key: 'age', label: 'Issue age', type: 'number', default: 45, min: 18, max: 70 },
      { key: 'premium', label: 'Annual premium', type: 'money', default: 200_000, min: 0 },
      { key: 'premiumYears', label: 'Years funded', type: 'years', default: 5, min: 1, max: 30 },
      { key: 'face', label: 'Death benefit', type: 'money', default: 2_400_000, min: 0 },
      { key: 'rate', label: 'Credited rate', type: 'percent', default: 6.5, min: 0, max: 20, step: 0.25 },
      { key: 'startYear', label: 'Distributions start in year', type: 'years', default: 16, min: 2, max: 45 },
      { key: 'drawYears', label: 'Years of distributions', type: 'years', default: 20, min: 1, max: 40 },
      { key: 'draw', label: 'Annual distribution', type: 'money', default: 85_000, min: 0, help: 'Push this up until the policy status below turns red. That is the edge of the strategy, and finding it is the point.' },
      { key: 'loanRate', label: 'Loan interest rate', type: 'percent', default: 5, min: 0, max: 12, step: 0.25 },
      { key: 'participating', label: 'Participating (wash) loan', type: 'toggle', default: true, help: 'Collateral stays in the indexed account. Turn it off to see a standard fixed loan, where the borrowed portion is moved to a declared rate.' },
      { key: 'fixedRate', label: 'Declared rate on a fixed loan', type: 'percent', default: 4, min: 0, max: 10, step: 0.25 },
    ],
    compute(v: CalcValues) {
      const age = Math.round(n(v, 'age')), premium = n(v, 'premium');
      const premiumYears = Math.round(n(v, 'premiumYears')), face = n(v, 'face'), rate = n(v, 'rate');
      const startYear = Math.round(n(v, 'startYear')), drawYears = Math.round(n(v, 'drawYears'));
      const draw = n(v, 'draw'), loanRate = n(v, 'loanRate');
      const participating = b(v, 'participating', true), fixedRate = n(v, 'fixedRate');

      const policy = {
        ...DEFAULT_POLICY,
        issueAge: age, premium, premiumYears, deathBenefit: face,
        creditingRate: rate, years: Math.max(45, startYear + drawYears + 5),
      };
      const result = projectLoans(policy, {
        startYear, drawYears, annualDraw: draw, loanRate,
        participating, fixedCollateralRate: fixedRate,
      });
      const alternative = projectLoans(policy, {
        startYear, drawYears, annualDraw: draw, loanRate,
        participating: !participating, fixedCollateralRate: fixedRate,
      });

      const data = result.rows.map((r, i) => ({
        year: r.year,
        accountValue: Math.round(r.accountValue),
        loanBalance: Math.round(r.loanBalance),
        netEquity: Math.round(r.netEquity),
        alternative: Math.round(alternative.rows[i]?.netEquity ?? 0),
      }));

      // Report the position at the end of the distribution period. Reading the
      // final row instead means a lapsed policy shows $0 for everything, which
      // tells the visitor nothing about where it went wrong.
      const lastDrawYear = startYear + drawYears - 1;
      const at = (r: typeof result, year: number) =>
        r.rows.find(x => x.year === year) ?? r.rows[r.rows.length - 1];
      const endOfDraw = at(result, lastDrawYear);
      const altEndOfDraw = at(alternative, lastDrawYear);
      const peak = result.rows.reduce((a, r) => Math.max(a, r.accountValue), 0);

      const spread = rate - loanRate;
      return {
        outputs: [
          { label: 'Total distributed', value: money(result.totalDrawn), tone: 'key', hint: `${money(draw)} a year for ${drawYears} years, income-tax-free while the contract stays in force` },
          { label: 'Crediting spread', value: pct(spread), tone: spread > 0 ? 'good' : 'bad', hint: `${pct(rate)} credited on collateral that is costing ${pct(loanRate)}` },
          { label: 'Net cost of the borrowing', value: money(result.netLoanCost), tone: result.netLoanCost < 0 ? 'good' : 'bad', hint: result.netLoanCost < 0 ? 'the collateral earned more than the loan cost' : 'loan interest exceeded what the collateral earned' },
          result.lapseYear
            ? { label: 'Policy status', value: `LAPSES in year ${result.lapseYear}`, tone: 'bad' as const, hint: `Age ${age + result.lapseYear - 1}. A lapse with a loan outstanding triggers ordinary income tax on the entire gain, with no cash arriving to pay it. Lower the distribution until this reads "in force".` }
            : { label: 'Policy status', value: 'In force throughout', tone: 'good' as const, hint: `Sustained to year ${policy.years}, age ${age + policy.years - 1}.` },
          { label: 'Peak account value', value: money(peak), hint: 'the most the contract ever holds' },
          { label: `Net equity at year ${lastDrawYear}`, value: money(endOfDraw.netEquity), tone: endOfDraw.netEquity > 0 ? 'good' : 'bad', hint: 'account value less the outstanding loan, at the end of the distribution period' },
          { label: 'Death benefit to heirs there', value: money(endOfDraw.netDeathBenefit), tone: 'good', hint: 'net of the loan the carrier settles first' },
          { label: participating ? 'Same plan on a fixed loan' : 'Same plan on a participating loan', value: money(altEndOfDraw.netEquity), hint: alternative.lapseYear ? `that version lapses in year ${alternative.lapseYear}` : 'net equity at the same year' },
        ],
        chart: { data, xKey: 'year', yFormat: 'moneyShort', series: [
          { key: 'accountValue', label: 'Account value', color: '#c8a24a' },
          { key: 'loanBalance', label: 'Loan balance', color: '#9f1239' },
          { key: 'netEquity', label: 'Net equity', color: '#1d4a3c' },
        ] },
        notes: [
          'This is the mechanic that makes an IUL different from every qualified account: the money does not have to leave to be spent. A 401(k) withdrawal removes the dollars and stops their compounding. A participating policy loan leaves them where they are, credited in full, and hands you a separate pot of borrowed cash.',
          'The loan is not income under §72(e) while the policy is in force and is not a MEC, and §101(a) makes the remaining death benefit income-tax-free.',
          'The failure mode is real and it is in the numbers above: over-borrow, and a policy that lapses with a loan outstanding converts the whole gain into ordinary income in a single year.',
        ],
      };
    },
  },
  {
    id: 'floor-value',
    name: 'Crediting Account Backtester',
    category: 'Indexed Life',
    blurb: 'Run any carrier account — cap, participation rate, spread, asset charge — against published S&P 500 price returns, and see both the credited rate and what is left after the charge that funds it.',
    fields: [
      { key: 'start', label: 'Starting amount', type: 'money', default: 500_000, min: 0 },
      { key: 'startYear', label: 'Start year', type: 'number', default: 2019, min: 1994, max: 2024 },
      { key: 'endYear', label: 'End year', type: 'number', default: 2025, min: 1995, max: 2025 },
      { key: 'cap', label: 'Cap', type: 'percent', default: 0, min: 0, max: 60, step: 0.25, help: 'Set to 0 for an uncapped account.' },
      { key: 'participation', label: 'Participation rate', type: 'percent', default: 200, min: 0, max: 250, step: 5, help: 'Real accounts go well past 100%. Securian advertises an uncapped account at 200%.' },
      { key: 'spread', label: 'Spread', type: 'percent', default: 0, min: 0, max: 15, step: 0.25 },
      { key: 'assetCharge', label: 'Annual asset charge', type: 'percent', default: 0, min: 0, max: 12, step: 0.1, help: 'What the carrier charges against account value to fund a participation rate above 100%. Charged every year, including the zeros.' },
      { key: 'withdrawal', label: 'Annual withdrawal', type: 'money', default: 0, min: 0, help: 'Sequence risk only bites when you are withdrawing. Set this above zero to see it.' },
    ],
    compute(v: CalcValues) {
      const start = n(v, 'start');
      const y0 = Math.round(n(v, 'startYear'));
      const y1 = Math.max(Math.round(n(v, 'endYear')), y0 + 1);
      const capRaw = n(v, 'cap');
      const params: AccountParams = {
        cap: capRaw <= 0 ? null : capRaw,
        participation: n(v, 'participation'),
        spread: n(v, 'spread'),
        floor: 0,
        assetChargePct: n(v, 'assetCharge'),
        bonus: 0,
      };
      const withdrawal = n(v, 'withdrawal');
      const history = creditingHistory(params, y0, y1);

      let account = start, direct = start;
      const data: Array<Record<string, number>> = [{ year: y0 - 1, account: Math.round(account), direct: Math.round(direct) }];
      const rows: Array<Record<string, number | string>> = [];
      let zeroYears = 0, cappedYears = 0, over40 = 0;

      for (const r of history) {
        if (r.index < 0) zeroYears++;
        if (r.credited >= 40) over40++;
        if (params.cap !== null && r.index * (params.participation / 100) - params.spread > params.cap) cappedYears++;
        account = Math.max(0, account * (1 + r.net / 100) - withdrawal);
        direct = Math.max(0, direct * (1 + r.index / 100) - withdrawal);
        data.push({ year: r.year, account: Math.round(account), direct: Math.round(direct) });
        rows.push({
          year: r.year,
          index: Number(r.index.toFixed(2)),
          credited: Number(r.credited.toFixed(2)),
          net: Number(r.net.toFixed(2)),
          account: Math.round(account),
        });
      }

      const years = history.length;
      const accountCagr = start > 0 && account > 0 ? (Math.pow(account / start, 1 / years) - 1) * 100 : 0;
      const directCagr = start > 0 && direct > 0 ? (Math.pow(direct / start, 1 / years) - 1) * 100 : 0;
      const best = history.reduce((a, r) => Math.max(a, r.credited), 0);

      return {
        outputs: [
          { label: 'Years crediting 40% or more', value: `${over40} of ${years}`, tone: over40 > 0 ? 'key' : 'neutral', hint: over40 > 0 ? `best year ${pct(best)}` : 'raise the participation rate or lower the cap to see where this starts' },
          { label: 'Down years floored to 0%', value: `${zeroYears}`, tone: 'good', hint: 'losses the account never had to earn back' },
          { label: `Account, ${y0}–${y1}`, value: money(account), tone: account >= direct ? 'good' : 'neutral', hint: `${pct(accountCagr)} compound, net of the asset charge` },
          { label: 'Index, unprotected', value: money(direct), tone: direct > account ? 'good' : 'neutral', hint: `${pct(directCagr)} compound (price return, no dividends)` },
          { label: 'Years the cap bound', value: params.cap === null ? 'uncapped' : `${cappedYears}`, tone: cappedYears > 0 ? 'bad' : 'neutral' },
          { label: 'Asset charge paid', value: pct(params.assetChargePct * years, 1), tone: params.assetChargePct > 0 ? 'bad' : 'neutral', hint: params.assetChargePct > 0 ? `${pct(params.assetChargePct)} a year for ${years} years, including the 0% years` : 'none' },
        ],
        chart: { data, xKey: 'year', yFormat: 'moneyShort', series: [
          { key: 'account', label: 'Indexed account', color: '#c8a24a' },
          { key: 'direct', label: 'Index, unprotected', color: '#9f1239' },
        ] },
        table: { columns: [
          { key: 'year', label: 'Year', format: 'number' },
          { key: 'index', label: 'S&P 500', format: 'percent' },
          { key: 'credited', label: 'Credited', format: 'percent' },
          { key: 'net', label: 'After asset charge', format: 'percent' },
          { key: 'account', label: 'Account', format: 'money' },
        ], rows, maxRows: 16 },
        notes: [
          'Index figures are published S&P 500 calendar-year price returns, dividends excluded — which is what an indexed account tracks, since you do not own the shares.',
          'A participation rate above 100% is not free. The asset charge that funds it comes out every year, including the years the index falls and the credit is zero. Set it to what your carrier actually charges and watch the difference between the "Credited" and "After asset charge" columns.',
          'These are index returns run through account parameters. They are not a carrier statement of credited rates, and your policy\'s actual segments start on its anniversary, not on 1 January.',
        ],
      };
    },
  },
  {
    id: 'allocation-builder',
    name: 'Carrier Allocation Builder',
    category: 'Indexed Life',
    blurb: 'Split a premium across a carrier\'s index accounts and see the blended result against published index history — with every account the data cannot honestly support named, and the reason given.',
    fields: [
      { key: 'carrier', label: 'Carrier', type: 'select', default: 'nationwide', options: [
        { value: 'nationwide', label: 'Nationwide — IUL Accumulator II (rate sheet held)' },
        { value: 'pacific-life', label: 'Pacific Life — Horizon ECV (rate sheet held)' },
        { value: 'securian-bga3', label: 'Securian — Balanced Growth Accumulator 3 (NO document held)' },
        { value: 'securian-bga2', label: 'Securian — Balanced Growth Accumulator II (CLOSED to new business)' },
      ] },
      { key: 'amount', label: 'Amount allocated', type: 'money', default: 500_000, min: 0 },
      { key: 'startYear', label: 'Start year', type: 'number', default: 2010, min: 1994, max: 2024 },
      { key: 'endYear', label: 'End year', type: 'number', default: 2025, min: 1995, max: 2025 },
      { key: 'useGuaranteed', label: 'Run on guaranteed minimums instead of current rates', type: 'toggle', default: false,
        help: 'An illustration run current and a policy performing guaranteed are different products. This is the second one.' },
    ],
    compute(v: CalcValues) {
      const carrier = carrierById(s(v, 'carrier', 'nationwide'));
      if (!carrier) return { outputs: [{ label: 'Carrier', value: 'Not found', tone: 'bad' as const }] };

      const amount = n(v, 'amount');
      const y0 = Math.round(n(v, 'startYear'));
      const y1 = Math.max(Math.round(n(v, 'endYear')), y0 + 1);
      const guaranteed = b(v, 'useGuaranteed', false);

      const runnable: Array<{ account: typeof carrier.accounts[number]; params: AccountParams }> = [];
      const refused: string[] = [];
      for (const a of carrier.accounts) {
        const check = canBacktest(a, carrier);
        if (!check.ok) { refused.push(`${a.name} — ${check.reason}`); continue; }
        runnable.push({
          account: a,
          params: {
            cap: guaranteed ? a.capGuaranteed : a.cap,
            participation: guaranteed ? (a.participationGuaranteed ?? a.participation) : a.participation,
            spread: guaranteed ? (a.spreadGuaranteed ?? a.spread ?? 0) : (a.spread ?? 0),
            floor: a.floor,
            assetChargePct: guaranteed ? (a.strategyChargeGuaranteed ?? a.strategyCharge) : a.strategyCharge,
            bonus: a.bonus,
          },
        });
      }

      if (runnable.length === 0) {
        return {
          outputs: [
            { label: carrier.name, value: carrier.status === 'closed-to-new-business' ? 'Closed to new business' : 'Cannot be run',
              tone: 'bad' as const,
              hint: carrier.status === 'awaiting-documents'
                ? 'No document is held for this product. Nothing can be quoted until one arrives.'
                : carrier.status === 'closed-to-new-business'
                  ? 'This product is no longer sold. Its parameters are history.'
                  : (carrier.source ?? 'No rate sheet is held for this carrier.') },
            { label: 'Accounts held', value: String(carrier.accounts.length) },
            { label: 'Accounts runnable', value: '0', tone: 'bad' as const },
          ],
          notes: [...refused, ...carrier.gaps],
        };
      }

      // Equal weight across whatever can honestly be run.
      const weight = 1 / runnable.length;
      const rows: Array<Record<string, number | string>> = [];
      const data: Array<Record<string, number>> = [{ year: y0 - 1, blended: amount }];
      let balance = amount;
      const annual: number[] = [];

      for (let year = y0; year <= y1; year++) {
        const index = SP500_PRICE_RETURN[year];
        if (index === undefined) continue;
        let blendedRate = 0;
        for (const r of runnable) blendedRate += weight * netGrowthRate(r.params, index);
        annual.push(blendedRate);
        balance *= 1 + blendedRate / 100;
        data.push({ year, blended: Math.round(balance) });
        rows.push({ year, index: Number(index.toFixed(2)), blended: Number(blendedRate.toFixed(2)), balance: Math.round(balance) });
      }

      const zeroYears = annual.filter(r => r <= 0).length;
      return {
        outputs: [
          { label: carrier.name, value: carrier.product, tone: carrier.status === 'open' ? 'key' : 'bad',
            hint: carrier.source ? `${carrier.source} — rates as of ${carrier.asOf}` : 'No rate sheet held.' },
          { label: 'Accounts allocated', value: `${runnable.length} of ${carrier.accounts.length}`,
            tone: runnable.length === carrier.accounts.length ? 'good' : 'bad',
            hint: refused.length > 0 ? `${refused.length} could not honestly be run — listed below` : undefined },
          { label: `Balance, ${y0}–${y1}`, value: money(balance), tone: 'good' },
          { label: 'Blended compound rate', value: pct(compound(annual)) },
          { label: 'Basis', value: guaranteed ? 'Guaranteed minimums' : 'Current rates',
            tone: guaranteed ? 'bad' : 'neutral',
            hint: guaranteed ? 'What the contract must do, not what it is doing' : 'What the carrier is crediting today; these are not guaranteed for life' },
          { label: 'Years crediting zero or less', value: String(zeroYears), tone: zeroYears > 0 ? 'neutral' : 'good' },
        ],
        chart: { data, xKey: 'year', yFormat: 'moneyShort', series: [
          { key: 'blended', label: 'Blended allocation', color: '#c8a24a' },
        ] },
        table: { columns: [
          { key: 'year', label: 'Year', format: 'number' },
          { key: 'index', label: 'Broad Market 500', format: 'percent' },
          { key: 'blended', label: 'Blended credit', format: 'percent' },
          { key: 'balance', label: 'Balance', format: 'money' },
        ], rows, maxRows: 16 },
        notes: [
          'Index names are replaced with descriptive aliases throughout. The contract names the licensed index; reproducing it here alongside modelled figures would make a claim about a third party we are not licensed to make.',
          ...(refused.length > 0 ? ['Accounts excluded from this allocation, and why:', ...refused.map(r => `• ${r}`)] : []),
          ...carrier.gaps,
        ],
      };
    },
  },
  {
    id: 'iul-vs-401k',
    name: 'IUL vs. 401(k) Distribution',
    category: 'Indexed Life',
    blurb: 'Both accumulate. Only one is taxed on the way out, counted in provisional income, and subject to RMDs.',
    fields: [
      { key: 'contribution', label: 'Annual contribution', type: 'money', default: 60_000, min: 0 },
      { key: 'years', label: 'Years of contribution', type: 'years', default: 20, min: 1, max: 40 },
      { key: 'qualifiedReturn', label: '401(k) gross return', type: 'percent', default: 8, min: 0, max: 25, step: 0.25 },
      { key: 'policyRate', label: 'Policy credited rate', type: 'percent', default: 6.5, min: 0, max: 20, step: 0.25 },
      { key: 'policyDrag', label: 'Policy charges as a drag', type: 'percent', default: 1.4, min: 0, max: 5, step: 0.1, help: 'Premium load, cost of insurance and fees expressed as an average annual drag over the horizon.' },
      { key: 'currentRate', label: 'Tax rate today', type: 'percent', default: 37, min: 0, max: 60, step: 1 },
      { key: 'futureRate', label: 'Tax rate in retirement', type: 'percent', default: 32, min: 0, max: 60, step: 1 },
      { key: 'drawYears', label: 'Years of distribution', type: 'years', default: 25, min: 1, max: 40 },
      { key: 'employerMatch', label: 'Employer match', type: 'percent', default: 0, min: 0, max: 100, step: 5 },
    ],
    compute(v: CalcValues) {
      const contribution = n(v, 'contribution'), years = Math.round(n(v, 'years'));
      const qReturn = n(v, 'qualifiedReturn'), policyRate = n(v, 'policyRate'), drag = n(v, 'policyDrag');
      const currentRate = n(v, 'currentRate') / 100, futureRate = n(v, 'futureRate') / 100;
      const drawYears = Math.round(n(v, 'drawYears')), match = n(v, 'employerMatch') / 100;

      // The 401(k) is funded with pre-tax dollars, so the same take-home pay
      // buys a larger contribution. The policy is funded after tax.
      const qualifiedContribution = contribution * (1 + match);
      const policyContribution = contribution * (1 - currentRate);

      const qualifiedBalance = futureValue(0, qualifiedContribution, qReturn, years);
      const policyBalance = futureValue(0, policyContribution, policyRate - drag, years);

      // Level distribution that exhausts each over the draw period.
      const distRate = 5;
      const factor = (1 - Math.pow(1 + distRate / 100, -drawYears)) / (distRate / 100);
      const qualifiedGross = qualifiedBalance / factor;
      const qualifiedNet = qualifiedGross * (1 - futureRate);
      const policyNet = policyBalance / factor;

      const data: Array<Record<string, number>> = [];
      for (let y = 0; y <= years; y++) {
        data.push({
          year: y,
          qualifiedAfterTax: Math.round(futureValue(0, qualifiedContribution, qReturn, y) * (1 - futureRate)),
          policy: Math.round(futureValue(0, policyContribution, policyRate - drag, y)),
        });
      }

      return {
        outputs: [
          { label: '401(k) contribution', value: money(qualifiedContribution), hint: match > 0 ? `includes ${pct(match * 100, 0)} employer match` : 'pre-tax dollars' },
          { label: 'Policy premium', value: money(policyContribution), hint: `same ${money(contribution)} of pay, after ${pct(currentRate * 100, 0)} tax` },
          { label: '401(k) balance', value: money(qualifiedBalance), hint: `${money(qualifiedBalance * (1 - futureRate))} after tax` },
          { label: 'Policy cash value', value: money(policyBalance), hint: `net of a ${pct(drag)} annual charge drag` },
          { label: '401(k) net income', value: money(qualifiedNet) + '/yr', tone: qualifiedNet >= policyNet ? 'good' : 'neutral' },
          { label: 'Policy net income', value: money(policyNet) + '/yr', tone: policyNet > qualifiedNet ? 'good' : 'neutral' },
          { label: 'Difference over ' + drawYears + ' years', value: money(Math.abs(policyNet - qualifiedNet) * drawYears), tone: 'key' },
        ],
        chart: { data, xKey: 'year', yFormat: 'moneyShort', series: [
          { key: 'policy', label: 'Policy cash value', color: '#c8a24a' },
          { key: 'qualifiedAfterTax', label: '401(k), after tax', color: '#6b7280' },
        ] },
        notes: [
          'Take the employer match first, always. An immediate 50-100% return is not something any insurance product can compete with.',
          'What this comparison does not price: the 401(k) balance is in provisional income, drives IRMAA, and is forced out by RMDs at 73. The policy is none of those things, and it carries a death benefit the whole way.',
          'Nor does it price the death benefit, which is why the policy column understates the total outcome for anyone who dies before exhausting the account.',
        ],
      };
    },
  },
  {
    id: 'coi-curve',
    name: 'Cost of Insurance Curve',
    category: 'Indexed Life',
    blurb: 'What the insurance actually costs at each age, and why a policy that looks cheap at 45 must be funded properly to survive at 85.',
    fields: [
      { key: 'age', label: 'Issue age', type: 'number', default: 45, min: 18, max: 75 },
      { key: 'face', label: 'Death benefit', type: 'money', default: 2_000_000, min: 0 },
      { key: 'accountValue', label: 'Account value today', type: 'money', default: 400_000, min: 0 },
      { key: 'growth', label: 'Account value growth', type: 'percent', default: 6, min: 0, max: 20, step: 0.25 },
      { key: 'toAge', label: 'Show to age', type: 'number', default: 90, min: 60, max: 100 },
    ],
    compute(v: CalcValues) {
      const age = Math.round(n(v, 'age')), face = n(v, 'face');
      const av0 = n(v, 'accountValue'), growth = n(v, 'growth'), toAge = Math.round(n(v, 'toAge'));

      const data: Array<Record<string, number>> = [];
      const rows: Array<Record<string, number | string>> = [];
      let av = av0, total = 0;
      for (let a = age; a <= toAge; a++) {
        const nar = Math.max(0, face - av);
        const cost = (nar / 1000) * coiPerThousand(a);
        total += cost;
        data.push({ year: a, cost: Math.round(cost), netAtRisk: Math.round(nar) });
        if (a % 5 === 0 || a === age) {
          rows.push({ age: a, per1000: Number(coiPerThousand(a).toFixed(2)), netAtRisk: Math.round(nar), cost: Math.round(cost) });
        }
        av *= 1 + growth / 100;
      }
      const at85 = data.find(d => d.year === 85);
      return {
        outputs: [
          { label: 'Cost at issue', value: money(data[0].cost) + '/yr', hint: `${money(coiPerThousand(age))} per $1,000 at risk` },
          { label: 'Cost at 85', value: at85 ? money(at85.cost) + '/yr' : '—', tone: 'bad', hint: at85 ? `${num(at85.cost / Math.max(1, data[0].cost), 1)}× the cost at issue` : undefined },
          { label: `Total to age ${toAge}`, value: money(total), tone: 'key' },
          { label: 'Net amount at risk at 85', value: at85 ? money(at85.netAtRisk) : '—', hint: 'Account value growth shrinks this, which is the whole reason a well-funded policy gets cheaper to carry, not more expensive.' },
        ],
        chart: { data, xKey: 'year', yFormat: 'moneyShort', series: [
          { key: 'cost', label: 'Annual cost of insurance', color: '#9f1239' },
          { key: 'netAtRisk', label: 'Net amount at risk', color: '#6b7280' },
        ] },
        table: { columns: [
          { key: 'age', label: 'Age', format: 'number' },
          { key: 'per1000', label: 'Per $1,000', format: 'number' },
          { key: 'netAtRisk', label: 'At risk', format: 'money' },
          { key: 'cost', label: 'Annual cost', format: 'money' },
        ], rows },
        notes: [
          'Mortality cost roughly doubles every eight years. That is not a fee a carrier chose; it is what insuring an older life costs.',
          'This is the entire argument for funding a policy properly. An underfunded contract meets that curve with nothing in the account and lapses, usually in the decade where the death benefit was about to matter most.',
        ],
      };
    },
  },
];

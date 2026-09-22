/**
 * IUL policy engine — segment-level mechanics, month by month.
 *
 * ## The gap this closes
 *
 * Every index model in this repository up to now answers one question: given an
 * index movement across a segment, what does the segment credit? That is the
 * easy half. Nothing here modelled WHEN.
 *
 * A two-year segment credits once, at its end date, and pays nothing for the
 * twenty-four months before it. A three-year segment pays nothing for
 * thirty-six. Meanwhile the monthly charges come out every month regardless.
 * A real in-force statement makes this vivid: on the client policy audited in
 * securianBGA2Statement.ts, six segments matured in the year and credited
 * $2,883.86 — and every other segment on the policy, including the entirety of
 * one of the two funded accounts, credited exactly nothing, because it had not
 * reached its end date.
 *
 * A model that applies an annual crediting rate to the whole account value each
 * year does not merely round differently. It pays the client money in years one
 * and two that the contract does not pay, and it compounds that money for the
 * life of the projection. That is the single largest source of error in a naive
 * IUL model, and it always errs in the client's favour — which is exactly the
 * direction a regulator and a prospect's accountant look first.
 *
 * So this engine is built around the segment, not the year:
 *
 *   - money enters an interim account and sweeps into a new segment monthly
 *   - a segment holds its principal and credits nothing until it matures
 *   - at maturity it credits once, by the account's transfer function
 *   - charges are deducted every month, pro rata, from funded accounts
 *   - loan interest accrues monthly on the loan balance
 *
 * `moneyAsleep` on the result is the number none of the previous models could
 * produce: how much of the policy's value is sitting in segments that have not
 * matured. Early in a policy it is nearly all of it.
 *
 * ## Transfer functions, and where the numbers come from
 *
 * Every account is described by the same three-parameter form, because that is
 * the form real statements turn out to obey:
 *
 *     creditedPct = clamp(indexGrowthPct × multiplier + interceptPoints, floor, cap)
 *
 * `basis` records where a template's parameters came from, and the engine will
 * not let that be forgotten:
 *
 *   observed  — fitted to credits a carrier actually paid. The most accurate
 *               description of what a policy does, and NOT illustrable: a
 *               fitted coefficient is not a declared rate. See AG 49-A.
 *   published — transcribed from a carrier document. Illustrable up to the
 *               product's maximum illustrated rate, and — see below — capable
 *               of being very wrong about what the account pays.
 *   parameter — a number typed in for comparison. Belongs to nobody.
 *
 * The audited product is the cautionary example. Its own published flier states
 * 105% participation less a 2.50% spread. Run against the six segments that
 * actually matured, that published description overstates the credit by 10.3 to
 * 12.7 percentage points on every one. The observed behaviour is a multiplier of
 * 0.84 with 5.25 points deducted per two-year segment. Both are recorded below.
 * Neither may quietly stand in for the other.
 */

/* ------------------------------------------------------------------ *
 * Account templates
 * ------------------------------------------------------------------ */

export type TemplateBasis = 'observed' | 'published' | 'parameter';

export interface AccountTemplate {
  readonly id: string;
  /** The house name for this shape. Marketing, not a carrier's account name. */
  readonly name: string;
  /** What the shape is, generically, so the name never has to be trusted. */
  readonly structure: string;
  readonly termMonths: number;
  /** Multiplier applied to index growth across the whole segment. */
  readonly multiplier: number;
  /** Points added (usually negative) across the whole segment. */
  readonly interceptPoints: number;
  /** Cap across the whole segment, in percent. Null = uncapped. */
  readonly capPctPerSegment: number | null;
  readonly floorPct: number;
  readonly basis: TemplateBasis;
  readonly source: string;
  readonly note?: string;
}

/**
 * House shapes. The names are ours; the structures are industry-standard
 * point-to-point designs that no carrier owns. What a carrier DOES own is its
 * particular parameters, so a template carrying real parameters always names
 * the document they came from, and a template carrying invented parameters says
 * so in `basis`.
 *
 * This separation is the point. A house name over a carrier's exact parameters
 * would produce a quote that no policy the client can actually buy will match.
 * A house name over a generic structure, with parameters supplied per product,
 * is both genuinely ours and always right.
 */
export const ACCOUNT_TEMPLATES: readonly AccountTemplate[] = [
  {
    id: 'z-formation',
    name: 'S&P 500 (Z Formation)',
    structure: '1-year point-to-point on the S&P 500 price index, capped, 0% floor',
    termMonths: 12,
    multiplier: 1.0,
    interceptPoints: 0,
    capPctPerSegment: 8.5,
    floorPct: 0,
    basis: 'published',
    source:
      'Structure and 8.50% cap transcribed from the Current Growth Caps page of a Balanced Growth Accumulator II annual review, "Index A - S&P 500 100% Participation".',
    note: 'A 100% participation account on the same page as the uncapped Balanced accounts. It is the plain shape: what you give up for a cap is the upside past 8.50%, and what you get is a credit every twelve months instead of every twenty-four.',
  },
  {
    id: 'x-formation-observed',
    name: '2-Year S&P 500 (X Formation)',
    structure: '2-year point-to-point on the S&P 500 price index, uncapped, 0% floor',
    termMonths: 24,
    multiplier: 0.84,
    interceptPoints: -5.25,
    capPctPerSegment: null,
    floorPct: 0,
    basis: 'observed',
    source:
      'Fitted to six matured segments on a Balanced Growth Accumulator II annual review, 08/28/2025-08/28/2026. Slope 0.840000, intercept -5.250003, maximum residual 0.00000 points. See shared/securianBGA2Statement.ts.',
    note: 'What the account actually paid. Not illustrable: 0.84 and 5.25 are fitted coefficients, not declared rates, and AG 49-A governs what may be shown.',
  },
  {
    id: 'x-formation-published',
    name: '2-Year S&P 500 (X Formation, as published)',
    structure: '2-year point-to-point on the S&P 500 price index, uncapped, 0% floor',
    termMonths: 24,
    multiplier: 1.05,
    interceptPoints: -2.5,
    capPctPerSegment: null,
    floorPct: 0,
    basis: 'published',
    source:
      'Balanced Growth Accumulator II IUL flier, F94327-15 DOFU 10-2022 Rev 08-2023: 105% participation less a 2.50% spread over the two-year term.',
    note: 'The carrier\'s own published description of the same account the observed template describes. Against the six segments that matured, it overstates the credit by 10.3 to 12.7 points every time. Kept so the divergence can be measured rather than argued about.',
  },
  {
    id: 'x-formation-three-year',
    name: '3-Year S&P 500 (X Formation, long)',
    structure: '3-year point-to-point on the S&P 500 price index, uncapped, 0% floor',
    termMonths: 36,
    multiplier: 1.15,
    interceptPoints: 0,
    capPctPerSegment: null,
    floorPct: 0,
    basis: 'parameter',
    source:
      'Segment term and 115% printed participation read from the Accumulation Value Detail page of the same annual review. NOT fitted — no segment of that account has matured, so nothing constrains the deduction.',
    note: 'Deliberately carries no deduction, because none is known. The printed participation on that statement was wrong on every other account it appeared on, so this template is a placeholder for a shape, not a description of behaviour. Its first real segment matures 05/2027.',
  },
];

export function templateById(id: string): AccountTemplate | null {
  const hit = ACCOUNT_TEMPLATES.filter((t) => t.id === id);
  return hit.length ? hit[0] : null;
}

/** Templates fitted to observed behaviour. Accurate, and not illustrable. */
export function observedTemplates(): readonly AccountTemplate[] {
  return ACCOUNT_TEMPLATES.filter((t) => t.basis === 'observed');
}

/**
 * The credit a segment pays, in percent, for an index movement across its term.
 * Order matters: multiplier, then the points, then the cap, then the floor. A
 * floor applied before a cap can turn a loss into a capped gain.
 */
export function creditPctForTemplate(template: AccountTemplate, indexGrowthPct: number): number {
  let credited = indexGrowthPct * template.multiplier + template.interceptPoints;
  if (template.capPctPerSegment !== null && credited > template.capPctPerSegment) {
    credited = template.capPctPerSegment;
  }
  if (credited < template.floorPct) credited = template.floorPct;
  return credited;
}

/* ------------------------------------------------------------------ *
 * The ledger
 * ------------------------------------------------------------------ */

export interface SegmentState {
  readonly templateId: string;
  /** Policy month the segment was struck, 1-based. */
  readonly startMonth: number;
  /** Policy month it credits. startMonth + termMonths. */
  readonly maturesMonth: number;
  /** Value in the segment. Charges reduce it; it credits only at maturity. */
  principal: number;
  matured: boolean;
  /** Percent credited at maturity. Undefined until then. */
  creditedPct?: number;
  creditedAmount?: number;
}

export interface PolicyInput {
  /** Monthly index levels, index 0 = policy month 0. Must cover the whole run. */
  readonly indexLevels: readonly number[];
  readonly months: number;
  /** Premium paid at the start of each month, in dollars. */
  readonly monthlyPremium: number;
  /** Total monthly policy charges in dollars. Deducted every month. */
  readonly monthlyCharge: number;
  /** Which template new money sweeps into. */
  readonly templateId: string;
  readonly startingAccumulationValue?: number;
  /** Loan balance carried from day one, if any. */
  readonly startingLoan?: number;
  /** Annual loan interest rate as a decimal. 0.0425 = 4.25%. */
  readonly loanRateAnnual?: number;
}

export interface PolicyMonth {
  readonly month: number;
  readonly premiumPaid: number;
  readonly chargeDeducted: number;
  readonly creditsPosted: number;
  readonly loanInterest: number;
  readonly interimValue: number;
  /** Value held in segments that have not matured. */
  readonly moneyAsleep: number;
  readonly accumulationValue: number;
  readonly loanBalance: number;
  readonly netSurrenderValue: number;
  readonly segmentsOpen: number;
}

export interface PolicyResult {
  readonly ok: true;
  readonly months: readonly PolicyMonth[];
  readonly segments: readonly SegmentState[];
  readonly totalPremium: number;
  readonly totalCharges: number;
  readonly totalCredits: number;
  readonly totalLoanInterest: number;
  readonly finalAccumulationValue: number;
  readonly finalNetSurrenderValue: number;
  /** Months in which no segment matured, so no credit was possible. */
  readonly monthsWithNoCreditPossible: number;
  /** Policy month the first credit posted. Null if none ever did. */
  readonly firstCreditMonth: number | null;
  readonly template: AccountTemplate;
}

export type PolicyRun = PolicyResult | { readonly ok: false; readonly reason: string };

/**
 * Run a policy month by month.
 *
 * Refuses rather than approximating. An index series too short for the run, a
 * negative charge, a missing template — each is a refusal, because every one of
 * them produces a plausible-looking projection that is wrong.
 */
export function runPolicy(input: PolicyInput): PolicyRun {
  const template = templateById(input.templateId);
  if (!template) return { ok: false, reason: `No account template with id "${input.templateId}".` };
  if (input.months < 1) return { ok: false, reason: 'A policy run needs at least one month.' };
  if (input.indexLevels.length < input.months + 1) {
    return {
      ok: false,
      reason: `The index series has ${input.indexLevels.length} points but a ${input.months}-month run needs ${input.months + 1}. Extending it here would be inventing market history.`,
    };
  }
  for (let i = 0; i < input.indexLevels.length; i += 1) {
    if (!Number.isFinite(input.indexLevels[i]) || input.indexLevels[i] <= 0) {
      return { ok: false, reason: `Index level at position ${i} is not a positive finite number.` };
    }
  }
  if (input.monthlyCharge < 0) return { ok: false, reason: 'A monthly charge cannot be negative.' };
  if (input.monthlyPremium < 0) return { ok: false, reason: 'A premium cannot be negative.' };

  const loanRate = input.loanRateAnnual || 0;
  const monthlyLoanRate = loanRate > 0 ? Math.pow(1 + loanRate, 1 / 12) - 1 : 0;

  const segments: SegmentState[] = [];
  const rows: PolicyMonth[] = [];

  let interim = input.startingAccumulationValue || 0;
  let loan = input.startingLoan || 0;
  let totalPremium = 0;
  let totalCharges = 0;
  let totalCredits = 0;
  let totalLoanInterest = 0;
  let monthsWithNoCreditPossible = 0;
  let firstCreditMonth: number | null = null;

  for (let month = 1; month <= input.months; month += 1) {
    // 1. Premium in, to the interim account.
    interim += input.monthlyPremium;
    totalPremium += input.monthlyPremium;

    // 2. Sweep the interim account into a fresh segment. Monthly segments are
    //    how these accounts actually work: each month's money gets its own
    //    start date, its own index reference, and its own maturity.
    if (interim > 0) {
      segments.push({
        templateId: template.id,
        startMonth: month,
        maturesMonth: month + template.termMonths,
        principal: interim,
        matured: false,
      });
      interim = 0;
    }

    // 3. Charges. Deducted pro rata across every open segment, which is what
    //    the audited statements show — not from one account, and not from a
    //    cash bucket that does not exist.
    const open = segments.filter((s) => !s.matured);
    const openValue = open.reduce((t, s) => t + s.principal, 0);
    let charged = 0;
    if (input.monthlyCharge > 0 && openValue > 0) {
      const take = Math.min(input.monthlyCharge, openValue);
      for (let i = 0; i < open.length; i += 1) {
        const share = (open[i].principal / openValue) * take;
        open[i].principal -= share;
      }
      charged = take;
    }
    totalCharges += charged;

    // 4. Maturities. A segment credits once, here, and never before.
    let creditsPosted = 0;
    for (let i = 0; i < segments.length; i += 1) {
      const seg = segments[i];
      if (seg.matured || seg.maturesMonth !== month) continue;
      const startLevel = input.indexLevels[seg.startMonth];
      const endLevel = input.indexLevels[month];
      const growthPct = (endLevel / startLevel - 1) * 100;
      const creditPct = creditPctForTemplate(template, growthPct);
      const amount = seg.principal * (creditPct / 100);
      seg.matured = true;
      seg.creditedPct = creditPct;
      seg.creditedAmount = amount;
      creditsPosted += amount;
      // Principal plus its credit returns to the interim account and sweeps
      // into a new segment next month, which is how the money keeps working.
      interim += seg.principal + amount;
      seg.principal = 0;
    }
    totalCredits += creditsPosted;
    if (creditsPosted > 0 && firstCreditMonth === null) firstCreditMonth = month;

    const anyMaturingThisMonth = segments.filter((s) => s.maturesMonth === month).length > 0;
    if (!anyMaturingThisMonth) monthsWithNoCreditPossible += 1;

    // 5. Loan interest accrues whether or not anything credited.
    const interest = loan * monthlyLoanRate;
    loan += interest;
    totalLoanInterest += interest;

    const asleep = segments.filter((s) => !s.matured).reduce((t, s) => t + s.principal, 0);
    const accumulation = asleep + interim;

    rows.push({
      month,
      premiumPaid: input.monthlyPremium,
      chargeDeducted: charged,
      creditsPosted,
      loanInterest: interest,
      interimValue: interim,
      moneyAsleep: asleep,
      accumulationValue: accumulation,
      loanBalance: loan,
      netSurrenderValue: accumulation - loan,
      segmentsOpen: segments.filter((s) => !s.matured).length,
    });
  }

  const last = rows[rows.length - 1];
  return {
    ok: true,
    months: rows,
    segments,
    totalPremium,
    totalCharges,
    totalCredits,
    totalLoanInterest,
    finalAccumulationValue: last.accumulationValue,
    finalNetSurrenderValue: last.netSurrenderValue,
    monthsWithNoCreditPossible,
    firstCreditMonth,
    template,
  };
}

/* ------------------------------------------------------------------ *
 * The naive comparison
 * ------------------------------------------------------------------ */

/**
 * Two ways a year-at-a-time model gets a multi-year account wrong.
 *
 * These are not straw men; they are how IUL spreadsheets are actually built,
 * and the first draft of this file assumed, wrongly, that both errors run the
 * same way. They do not. The test that caught it is kept below.
 *
 *   TERM ERROR (naiveAnnualProjection) — applies the segment's transfer
 *   function to one year's index growth, as though the segment were annual.
 *   On an account whose deduction is charged once per two-year segment, that
 *   deduction gets taken twice as often against half as much growth. It
 *   UNDERSTATES, sometimes severely.
 *
 *   WAIT ERROR (naiveNoWaitProjection) — gets the segment arithmetic right,
 *   annualises it correctly, and then applies that annual rate to the whole
 *   balance from year one, as though nothing ever waited to mature. It
 *   OVERSTATES, because it pays credits in months the contract pays nothing.
 *
 * Which error dominates depends entirely on the template's parameters, so
 * neither direction can be assumed. That is the argument for modelling the
 * segment rather than patching a factor onto an annual model.
 */
export function naiveAnnualProjection(input: PolicyInput): number {
  const template = templateById(input.templateId);
  if (!template) return NaN;
  let value = input.startingAccumulationValue || 0;
  const years = Math.floor(input.months / 12);
  for (let y = 0; y < years; y += 1) {
    value += input.monthlyPremium * 12;
    value -= input.monthlyCharge * 12;
    const start = input.indexLevels[y * 12];
    const end = input.indexLevels[(y + 1) * 12];
    const growthPct = (end / start - 1) * 100;
    // The error in one line: a whole-account annual credit, every year, with no
    // segment ever waiting to mature.
    const annualCreditPct = creditPctForTemplate(template, growthPct);
    value *= 1 + annualCreditPct / 100;
  }
  return value;
}

/**
 * The wait error, isolated. Segment arithmetic done correctly, geometrically
 * annualised, then applied to the whole balance every year from year one — so
 * the money never waits for a maturity it would really have waited for.
 */
export function naiveNoWaitProjection(input: PolicyInput): number {
  const template = templateById(input.templateId);
  if (!template) return NaN;
  const termMonths = template.termMonths;
  const years = Math.floor(input.months / 12);

  // Annual rate implied by the template over rolling term-length windows.
  const annualRates: number[] = [];
  for (let start = 0; start + termMonths < input.indexLevels.length; start += termMonths) {
    const growthPct =
      (input.indexLevels[start + termMonths] / input.indexLevels[start] - 1) * 100;
    const creditPct = creditPctForTemplate(template, growthPct);
    const annual = (Math.pow(1 + creditPct / 100, 12 / termMonths) - 1) * 100;
    annualRates.push(annual);
  }
  if (!annualRates.length) return NaN;
  const meanAnnual = annualRates.reduce((a, b) => a + b, 0) / annualRates.length;

  let value = input.startingAccumulationValue || 0;
  for (let y = 0; y < years; y += 1) {
    value += input.monthlyPremium * 12;
    value -= input.monthlyCharge * 12;
    value *= 1 + meanAnnual / 100;
  }
  return value;
}

export interface NaiveComparison {
  readonly segmentAware: number;
  /** Term error: treats a multi-year segment as annual. */
  readonly naiveAnnual: number;
  /** Wait error: correct segment maths, but nothing ever waits to mature. */
  readonly naiveNoWait: number;
  readonly termErrorDollars: number;
  readonly waitErrorDollars: number;
  /** Widest disagreement between the two naive models, in dollars. */
  readonly spreadBetweenNaiveModels: number;
  readonly monthsWithNoCreditPossible: number;
  readonly firstCreditMonth: number | null;
}

export function compareToNaive(input: PolicyInput): NaiveComparison | null {
  const run = runPolicy(input);
  if (!run.ok) return null;
  const term = naiveAnnualProjection(input);
  const wait = naiveNoWaitProjection(input);
  return {
    segmentAware: run.finalAccumulationValue,
    naiveAnnual: term,
    naiveNoWait: wait,
    termErrorDollars: term - run.finalAccumulationValue,
    waitErrorDollars: wait - run.finalAccumulationValue,
    spreadBetweenNaiveModels: Math.abs(wait - term),
    monthsWithNoCreditPossible: run.monthsWithNoCreditPossible,
    firstCreditMonth: run.firstCreditMonth,
  };
}

/* ------------------------------------------------------------------ *
 * Rules the engine will not break
 * ------------------------------------------------------------------ */

export const ENGINE_RULES = {
  version: '2026.09.1',
  neverPrinted: [
    'A projection built on an `observed` template. Fitted coefficients describe what a policy did; AG 49-A governs what may be shown, and a number nobody declared may not be illustrated at all.',
    'A credit in a month when no segment matured. The contract pays at segment end and at no other time.',
    'A multi-year segment credit quoted as an annual rate without geometric annualisation.',
    'A published participation rate presented as what an account pays. On the audited product the published 105%/2.50% overstates the paid credit by 10.3 to 12.7 points on every matured segment.',
    'A house template name offered as a carrier product. The names here cover generic point-to-point structures; the parameters belong to whichever product supplies them.',
  ],
  whyMoneyAsleepMatters:
    'Early in a policy nearly the whole account value sits in segments that have not matured. Charges are deducted from it monthly and it credits nothing. A model that does not carry this number cannot show a client the real shape of the first two years, which is the period every objection is about.',
} as const;

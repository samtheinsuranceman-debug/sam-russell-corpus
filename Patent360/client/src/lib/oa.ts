/**
 * Office actions — the examiner's rejection, and what to do about it.
 *
 * This is where prosecution is actually won or lost and where most of the
 * fee sits, so the screen has to answer three questions an attorney asks in
 * this order:
 *
 *   1. What exactly is rejected, on what statutory basis, over what art?
 *   2. What are my options, what does each cost, and what are the odds?
 *   3. When is it due, and what does it cost me to buy more time?
 *
 * Two things here are computed rather than asserted, and both are checkable:
 *
 *   Deadlines. A non-final action sets a three-month shortened statutory
 *   period, extensible to six under 37 CFR 1.136(a), with the extension fee
 *   rising each month. We compute every date from the mailing date on the
 *   action itself, so nobody types a date and nobody mistypes one.
 *
 *   Examiner statistics. Allowance rate, interview effect and appeal
 *   outcomes come from the USPTO's own examination data. The reason they
 *   belong on this screen: for some examiners an interview roughly doubles
 *   the chance of allowance, and for others it does nothing — and that
 *   single number decides whether the next $4,000 is well spent.
 *
 * Demonstration dataset. The matters, examiners, art units and references
 * below are invented for this build. Nothing here is a filing, a real
 * examiner record, or legal advice.
 */

export type Basis = '102' | '103' | '112(a)' | '112(b)' | 'double-patenting' | 'objection';

export const BASIS_LABEL: Record<Basis, string> = {
  '102': '§102 — anticipation',
  '103': '§103 — obviousness',
  '112(a)': '§112(a) — written description / enablement',
  '112(b)': '§112(b) — indefiniteness',
  'double-patenting': 'Obviousness-type double patenting',
  objection: 'Objection (formalities)'
};

/** How hard each basis usually is to move, from the examiner's own history. */
export const BASIS_DIFFICULTY: Record<Basis, 'low' | 'medium' | 'high'> = {
  '112(b)': 'low',
  objection: 'low',
  'double-patenting': 'low',
  '112(a)': 'medium',
  '102': 'medium',
  '103': 'high'
};

export type Reference = {
  id: string;
  title: string;
  assignee: string;
  date: string;
  /** Which claim elements the examiner maps this reference onto. */
  mappedTo: string[];
  /** Where the mapping is weakest — the opening for an argument. */
  gap: string | null;
};

export type Rejection = {
  claims: number[];
  basis: Basis;
  examinerReasoning: string;
  references: Reference[];
  /** Our read, with the reason attached. */
  assessment: string;
};

export type Option = {
  name: 'Amend' | 'Argue' | 'Interview then respond' | 'RCE' | 'Appeal' | 'Abandon';
  cost: number;
  weeks: number;
  /** Probability of reaching allowance on this path, from this examiner's record. */
  odds: number;
  gives: string;
  costs: string;
  recommended?: boolean;
};

export type Examiner = {
  name: string;
  artUnit: string;
  yearsAtOffice: number;
  allowanceRate: number;        // overall, %
  allowanceAfterInterview: number;
  avgActionsToDisposal: number;
  appealReversalRate: number;   // % of their rejections reversed at the PTAB
  note: string;
};

export type OfficeAction = {
  id: string;
  docket: string;
  appNo: string;
  title: string;
  client: string;
  attorney: string;
  /** Mailing date on the action itself. Every deadline below derives from it. */
  mailed: string;
  final: boolean;
  examiner: Examiner;
  rejections: Rejection[];
  options: Option[];
  claimsTotal: number;
  claimsRejected: number;
  claimsAllowable: number;
};

/* ── Deadline arithmetic ────────────────────────────────────────────────
   Computed from the mailing date, never typed. A shortened statutory period
   of three months, extensible to six under 37 CFR 1.136(a), with the fee
   rising by month. Fees below are the small-entity schedule used for this
   build; the production table is loaded from the USPTO fee schedule and
   dated, because it changes. */

const EXTENSION_FEE_SMALL: Record<number, number> = { 1: 110, 2: 330, 3: 760, 4: 1190 };

export function addMonths(iso: string, months: number): string {
  const d = new Date(iso + 'T00:00:00Z');
  const target = new Date(d);
  target.setUTCMonth(target.getUTCMonth() + months);
  // Month-end rolls back rather than spilling into the next month.
  if (target.getUTCDate() !== d.getUTCDate()) target.setUTCDate(0);
  return target.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  const ms = new Date(b + 'T00:00:00Z').getTime() - new Date(a + 'T00:00:00Z').getTime();
  return Math.round(ms / 86_400_000);
}

export type DeadlineRow = {
  label: string;
  date: string;
  fee: number;
  statutory: boolean;
  note: string;
};

export function deadlines(mailed: string): DeadlineRow[] {
  const rows: DeadlineRow[] = [
    { label: 'Shortened statutory period', date: addMonths(mailed, 3), fee: 0, statutory: false,
      note: 'Respond by this date and no extension fee is due.' }
  ];
  for (let m = 1; m <= 3; m++) {
    rows.push({
      label: `+${m} month extension`,
      date: addMonths(mailed, 3 + m),
      fee: EXTENSION_FEE_SMALL[m]!,
      statutory: false,
      note: `37 CFR 1.136(a). Fee due on filing, not on request.`
    });
  }
  rows.push({
    label: 'Statutory bar — abandonment',
    date: addMonths(mailed, 6),
    fee: 0,
    statutory: true,
    note: 'Six months from mailing. No extension exists past this; the application goes abandoned.'
  });
  return rows;
}

/** Today, for the demonstration build. Production reads the clock. */
export const TODAY = '2026-09-11';

/* ── The dataset ───────────────────────────────────────────────────────── */

export const OFFICE_ACTIONS: OfficeAction[] = [
  {
    id: 'oa-2291',
    docket: 'BL-2291-US',
    appNo: '18/412,907',
    title: 'Thermal management for stacked battery modules',
    client: 'Nordhaven Energy',
    attorney: 'A. Reyes',
    mailed: '2026-07-02',
    final: false,
    claimsTotal: 20,
    claimsRejected: 17,
    claimsAllowable: 3,
    examiner: {
      name: 'K. Marchetti',
      artUnit: '1725',
      yearsAtOffice: 11,
      allowanceRate: 54,
      allowanceAfterInterview: 79,
      avgActionsToDisposal: 2.8,
      appealReversalRate: 41,
      note:
        'An interview is worth taking with this examiner: allowance runs 54% overall but 79% where an interview was conducted. He also reverses on the record more often than the art unit average, which means a well-framed argument is not wasted.'
    },
    rejections: [
      {
        claims: [1, 2, 3, 5, 7, 9, 10, 12, 14, 16, 18, 20],
        basis: '103',
        examinerReasoning:
          'Takahashi in view of Brennan. The examiner reads the phase-change layer of Takahashi onto the claimed interstitial material and relies on Brennan for the coolant manifold, reasoning that a person of skill would combine them to improve heat transfer.',
        references: [
          {
            id: 'US 10,431,882',
            title: 'Phase-change thermal interface for cell stacks',
            assignee: 'Takahashi Thermal KK',
            date: '2019-10-01',
            mappedTo: ['interstitial layer', 'phase-change material', 'stacked arrangement'],
            gap: 'Takahashi\'s layer is continuous. The claim requires the layer be discontinuous across the channel, which the reference neither shows nor discusses.'
          },
          {
            id: 'US 9,887,442',
            title: 'Coolant manifold for battery enclosures',
            assignee: 'Brennan Systems Inc',
            date: '2018-02-06',
            mappedTo: ['coolant manifold', 'inlet and outlet'],
            gap: 'Brennan is a liquid system. Combining it with Takahashi\'s solid interface requires a reason the examiner has not given beyond "improve heat transfer".'
          }
        ],
        assessment:
          'The combination is the weak point, not either reference alone. The examiner supplies no articulated reason to combine beyond a general desire for better heat transfer, which is the exact deficiency KSR still requires to be filled. The discontinuity limitation is also absent from both references and is supported at paragraphs [0031]–[0034].'
      },
      {
        claims: [6],
        basis: '112(b)',
        examinerReasoning:
          '"The thermal gradient" in claim 6 lacks antecedent basis. Claim 1 recites "a temperature differential"; claim 6 then refers to "the thermal gradient" without introducing it.',
        references: [],
        assessment:
          'Correct, and cheap to fix. Either amend claim 6 to recite the temperature differential or introduce the thermal gradient in claim 1. The drafting workbench already flagged this before the action arrived.'
      },
      {
        claims: [4, 8, 11, 13, 15, 17, 19],
        basis: '103',
        examinerReasoning:
          'Takahashi in view of Brennan and further in view of Osei. Dependent claims treated as obvious variations.',
        references: [
          {
            id: 'US 11,024,901',
            title: 'Tapered coolant channels',
            assignee: 'Osei Engineering Ltd',
            date: '2021-06-01',
            mappedTo: ['decreasing cross-sectional area'],
            gap: 'Osei tapers along flow direction; the claim tapers across it. The examiner does not address the difference.'
          }
        ],
        assessment:
          'Falls with the parent if the combination fails. Not worth arguing separately at this stage — it doubles the response length for no additional leverage.'
      }
    ],
    options: [
      {
        name: 'Interview then respond',
        cost: 6800,
        weeks: 5,
        odds: 0.71,
        gives:
          'Puts the discontinuity limitation in front of the examiner before the amendment is fixed in writing, and his record says an interview raises allowance from 54% to 79%.',
        costs: 'Two to three weeks of calendar time and roughly $2,000 more than a paper response.',
        recommended: true
      },
      {
        name: 'Amend',
        cost: 4800,
        weeks: 3,
        odds: 0.46,
        gives: 'Fastest route. Fixes the §112(b) and narrows claim 1 to the discontinuous layer.',
        costs:
          'Narrowing now surrenders the broader claim without testing whether the combination holds. Creates prosecution-history estoppel against the exact feature the client says is the moat.'
      },
      {
        name: 'Argue',
        cost: 5200,
        weeks: 3,
        odds: 0.38,
        gives: 'Keeps claim scope whole. The reason-to-combine attack is genuinely strong here.',
        costs:
          'Without the interview it is a coin-flip on this examiner, and a loss makes the next action final, which costs an RCE to get back in.'
      },
      {
        name: 'RCE',
        cost: 6300,
        weeks: 6,
        odds: 0.55,
        gives: 'Not yet available and not needed — this action is non-final.',
        costs: 'Premature. Keep it in reserve for after a final action.'
      },
      {
        name: 'Appeal',
        cost: 18500,
        weeks: 78,
        odds: 0.41,
        gives: 'His reversal rate is 41%, well above the art-unit average.',
        costs: 'Eighteen months and four times the cost, on a non-final action with an unused interview available.'
      }
    ]
  },

  {
    id: 'oa-2255',
    docket: 'BL-2255-US',
    appNo: '18/201,776',
    title: 'Acoustic leak localisation in buried mains',
    client: 'Ashford Water',
    attorney: 'J. Santos',
    mailed: '2026-04-28',
    final: true,
    claimsTotal: 15,
    claimsRejected: 15,
    claimsAllowable: 0,
    examiner: {
      name: 'P. Achterberg',
      artUnit: '2857',
      yearsAtOffice: 6,
      allowanceRate: 38,
      allowanceAfterInterview: 44,
      avgActionsToDisposal: 3.6,
      appealReversalRate: 58,
      note:
        'The opposite profile. Interviews barely move her — 38% to 44% — but the Board reverses her 58% of the time, the highest in the art unit. On this examiner an appeal is a real strategy rather than a last resort.'
    },
    rejections: [
      {
        claims: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        basis: '103',
        examinerReasoning:
          'Maintained over Whitlock in view of Dube. The examiner repeats the prior reasoning and states that applicant\'s arguments were considered but not persuasive, without addressing the cross-correlation limitation.',
        references: [
          {
            id: 'US 8,215,159',
            title: 'Acoustic pipeline monitoring',
            assignee: 'Whitlock Instruments',
            date: '2012-07-10',
            mappedTo: ['acoustic sensor array', 'buried conduit'],
            gap: 'Whitlock detects presence, not position. The claim localises to within two metres.'
          },
          {
            id: 'EP 2 556 331',
            title: 'Time-of-flight estimation in fluid conduits',
            assignee: 'Dube SA',
            date: '2013-02-13',
            mappedTo: ['time-of-flight'],
            gap: 'Dube requires a known injection point. The claim derives position without one — the examiner has not addressed this in either action.'
          }
        ],
        assessment:
          'The examiner did not respond to the argument actually made. That is the strongest fact on this file: an unaddressed argument in a final rejection is precisely what the Board reverses, and this examiner is reversed 58% of the time.'
      }
    ],
    options: [
      {
        name: 'Appeal',
        cost: 19200,
        weeks: 76,
        odds: 0.58,
        gives:
          'Her reversal rate is 58% and the record shows an argument she did not address. This is the file that justifies the wait.',
        costs: 'Eighteen months of pendency and the largest single fee on the matter.',
        recommended: true
      },
      {
        name: 'RCE',
        cost: 6300,
        weeks: 8,
        odds: 0.34,
        gives: 'Reopens prosecution and buys another round.',
        costs:
          'Hands the same examiner the same file, and her record says another round moves the odds very little. This is the expensive habit appeal statistics exist to break.'
      },
      {
        name: 'Amend',
        cost: 5100,
        weeks: 4,
        odds: 0.3,
        gives: 'Narrow to the two-metre localisation and the no-injection-point limitation.',
        costs: 'Surrenders the scope the client is commercially exposed on, to an examiner already reversed more often than not.'
      },
      {
        name: 'Abandon',
        cost: 0,
        weeks: 0,
        odds: 0,
        gives: 'Stops the spend.',
        costs: 'Ashford has a municipal tender in two jurisdictions that cites this application by number.'
      }
    ]
  },

  {
    id: 'oa-2298',
    docket: 'BL-2298-US',
    appNo: '18/405,330',
    title: 'Cold-chain label with irreversible indicator',
    client: 'Meridian Logistics',
    attorney: 'M. Okafor',
    mailed: '2026-08-19',
    final: false,
    claimsTotal: 12,
    claimsRejected: 4,
    claimsAllowable: 8,
    examiner: {
      name: 'R. Delacroix',
      artUnit: '1795',
      yearsAtOffice: 19,
      allowanceRate: 71,
      allowanceAfterInterview: 74,
      avgActionsToDisposal: 2.1,
      appealReversalRate: 22,
      note:
        'A high allowance rate, few actions to disposal and a low reversal rate. Read that together: he allows what is allowable and what he rejects usually stands. Take the eight allowable claims.'
    },
    rejections: [
      {
        claims: [3, 6, 9, 11],
        basis: '112(a)',
        examinerReasoning:
          'The specification describes a single indicator chemistry; claims 3, 6, 9 and 11 recite "an irreversible indicator" broadly, which the examiner reads as not commensurate with the written description.',
        references: [],
        assessment:
          'Fair on this record. The spec supports one chemistry at paragraph [0022] and gestures at others without describing them. Narrow to the described chemistry, or file a continuation carrying the broad language and add the description there.'
      },
      {
        claims: [1, 2, 4, 5, 7, 8, 10, 12],
        basis: 'objection',
        examinerReasoning: 'Reference numeral 214 appears in the drawings but not in the specification.',
        references: [],
        assessment: 'Formalities only. Corrected in the response at no strategic cost.'
      }
    ],
    options: [
      {
        name: 'Amend',
        cost: 3900,
        weeks: 2,
        odds: 0.86,
        gives:
          'Narrow the four claims to the described chemistry, fix the numeral, and take the eight allowable claims to issue. With this examiner that is very likely to end it.',
        costs: 'The broad indicator language goes — which is what the continuation is for.',
        recommended: true
      },
      {
        name: 'Argue',
        cost: 4400,
        weeks: 3,
        odds: 0.24,
        gives: 'Keeps the broad language in this application.',
        costs:
          'The §112(a) is well founded and this examiner is reversed only 22% of the time. Arguing it risks the eight claims that are already allowable.'
      }
    ]
  }
];

export const MONEY = (n: number) => `$${Math.round(n).toLocaleString()}`;

/**
 * Expected values, rounded to the nearest hundred. A modelled figure
 * printed to the dollar claims a precision it does not have, and an
 * attorney is right to distrust it.
 */
export const MONEY_ABOUT = (n: number) =>
  !isFinite(n) ? '—' : `$${(Math.round(n / 100) * 100).toLocaleString()}`;

/** Days remaining before the first unextended deadline. Negative means past. */
export function daysLeft(oa: OfficeAction): number {
  return daysBetween(TODAY, addMonths(oa.mailed, 3));
}

export function urgency(days: number): 'past' | 'critical' | 'soon' | 'ok' {
  if (days < 0) return 'past';
  if (days <= 14) return 'critical';
  if (days <= 45) return 'soon';
  return 'ok';
}

export function recommended(oa: OfficeAction): Option | undefined {
  return oa.options.find(o => o.recommended);
}

/* ── The whole path, not the next step ──────────────────────────────────
 *
 * Every option above carries a one-step number: "Amend, 46%". A client
 * does not experience one step. They experience the path — amend, get a
 * final rejection, pay for a continuation, try again — and a cheap option
 * with poor first-pass odds routinely costs more end to end than an
 * expensive one that works. A single-step probability cannot show that,
 * which is why the screen shows both.
 *
 * The model below is deliberately plain and fully stated, so the numbers
 * on the screen can be argued with rather than taken on faith:
 *
 *   · A failed response goes final; the realistic next move is a
 *     continuation, and each further round is worth less than the one
 *     before (a 28% haircut, floored at 12% — no round is hopeless).
 *   · The second and later responses cost 70% of the first, because the
 *     claim work is already done.
 *   · Prosecution stops when the next continuation would break the
 *     budget or after five rounds, whichever comes first.
 *   · Appeal is the last door, taken only if there is room for it, and
 *     it wins at this examiner's own PTAB reversal rate.
 *
 * These are expected values computed exactly, not sampled. The Monte
 * Carlo in sim/simulate.ts runs the same path ten thousand times per
 * option and checks it lands here.
 */

export const RCE_COST = 6_300;
export const RCE_WEEKS = 8;
export const APPEAL_COST = 18_500;
export const APPEAL_WEEKS = 78;
/** What a client of this size will spend before calling it. */
export const PATH_BUDGET = 45_000;
export const MAX_ROUNDS = 5;
/** Each further round of the same argument is worth less than the last. */
export const ROUND_DECAY = 0.72;
export const ODDS_FLOOR = 0.12;

export type Outlook = {
  /** Probability of ever reaching allowance down this path. */
  pAllowed: number;
  /** Expected total spend, allowed or not. */
  meanCost: number;
  meanWeeks: number;
  /** Expected spend divided by the chance it works — the comparable number. */
  costPerAllowance: number;
  /** Probability of being allowed inside a year. */
  pWithinYear: number;
  /** Expected number of rounds before it resolves. */
  meanRounds: number;
};

export function outlook(o: Option, examiner: Examiner, budget = PATH_BUDGET): Outlook {
  const reversal = examiner.appealReversalRate / 100;
  const empty: Outlook = {
    pAllowed: 0, meanCost: 0, meanWeeks: 0,
    costPerAllowance: Infinity, pWithinYear: 0, meanRounds: 0
  };
  if (o.name === 'Abandon') return empty;

  let pAllowed = 0, pWithinYear = 0, meanCost = 0, meanWeeks = 0, meanRounds = 0;
  /** Probability we are still prosecuting when this round starts. */
  let reach = 1;

  const land = (p: number, cost: number, weeks: number, rounds: number) => {
    pAllowed += p; meanCost += p * cost; meanWeeks += p * weeks; meanRounds += p * rounds;
    if (weeks <= 52) pWithinYear += p;
    reach -= p;
  };

  if (o.name === 'Appeal') {
    land(reversal, APPEAL_COST, APPEAL_WEEKS, 1);
    meanCost += reach * APPEAL_COST; meanWeeks += reach * APPEAL_WEEKS; meanRounds += reach;
    return {
      pAllowed, meanCost, meanWeeks, pWithinYear, meanRounds,
      costPerAllowance: pAllowed ? meanCost / pAllowed : Infinity
    };
  }

  let cost = o.cost, weeks = o.weeks, rounds = 1, odds = o.odds;
  land(reach * odds, cost, weeks, rounds);

  while (cost + RCE_COST <= budget && rounds < MAX_ROUNDS) {
    cost += RCE_COST + o.cost * 0.7;
    weeks += RCE_WEEKS + o.weeks;
    rounds++;
    odds = Math.max(ODDS_FLOOR, odds * ROUND_DECAY);
    land(reach * odds, cost, weeks, rounds);
  }

  if (cost + APPEAL_COST <= budget * 1.6) {
    cost += APPEAL_COST; weeks += APPEAL_WEEKS; rounds++;
    const stillHere = reach;
    land(stillHere * reversal, cost, weeks, rounds);
  }

  // Whatever never reached allowance still paid for the attempt.
  meanCost += reach * cost; meanWeeks += reach * weeks; meanRounds += reach * rounds;

  return {
    pAllowed, meanCost, meanWeeks, pWithinYear, meanRounds,
    costPerAllowance: pAllowed ? meanCost / pAllowed : Infinity
  };
}

/** The option with the lowest cost per allowance, which is not always the recommended one. */
export function cheapestRoute(oa: OfficeAction): { option: Option; out: Outlook } | undefined {
  const scored = oa.options
    .filter(o => o.name !== 'Abandon')
    .map(option => ({ option, out: outlook(option, oa.examiner) }))
    .filter(x => x.out.costPerAllowance < Infinity)
    .sort((a, b) => a.out.costPerAllowance - b.out.costPerAllowance);
  return scored[0];
}

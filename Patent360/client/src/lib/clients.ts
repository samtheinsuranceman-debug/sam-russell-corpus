/**
 * Clients — two views of the same relationship.
 *
 * The attorney needs to know which clients are quietly leaving. The client
 * needs to know what they own, what it is costing, and what is waiting on
 * them. Those are different documents built from the same file, and firms
 * usually produce neither: the first lives in a partner's head, and the
 * second arrives as an invoice with no narrative attached.
 *
 * Two design rules carried through both:
 *
 *   Churn risk is evidenced, never scored in the abstract. Every risk row
 *   names the observable behaviour behind it and its date, because "at
 *   risk" without a reason is an opinion a partner will rightly ignore.
 *
 *   Decisions waiting on the client are shown with the cost of not
 *   deciding. A client who cannot see that a two-week delay costs $760 in
 *   extension fees will take three weeks, and then be annoyed by the fee.
 *
 * Demonstration dataset. No client, matter, figure or date here is real.
 */

export type RiskSignal = {
  label: string;
  detail: string;
  observed: string;
  /** 0–1 contribution to the churn read. */
  weight: number;
  direction: 'bad' | 'good';
};

export type OpenDecision = {
  matter: string;
  question: string;
  /** What the client is actually choosing between, in their language. */
  options: string;
  due: string;
  /** What waiting costs, concretely. */
  costOfDelay: string;
  waitingDays: number;
};

export type Holding = {
  matter: string;
  appNo: string | null;
  /** The claim translated out of patent English. */
  protects: string;
  stage: 'Drafting' | 'Filed' | 'Office action' | 'Allowed' | 'Granted';
  /** What happens next and when, in plain terms. */
  next: string;
  nextBy: string;
  spend: number;
  committed: number;
};

export type Client = {
  id: string;
  name: string;
  sector: string;
  since: number;
  contact: { name: string; role: string; email: string };
  billedYtd: number;
  committed: number;
  matters: number;
  atRisk: number;
  /**
   * 0–100, higher is safer. Computed from the signals below by
   * `healthFromSignals` — never typed in, so the number on the screen and
   * the evidence under it cannot drift apart.
   */
  health: number;
  signals: RiskSignal[];
  decisions: OpenDecision[];
  holdings: Holding[];
  note: string;
};

/**
 * The file as recorded. Health is not in here: it is derived below, so a
 * partner can argue with the evidence rather than with a number someone
 * once chose.
 */
const RECORD: Omit<Client, 'health'>[] = [
  {
    id: 'nordhaven',
    name: 'Nordhaven Energy',
    sector: 'Grid storage',
    since: 2022,
    contact: { name: 'Sofia Viera', role: 'General Counsel', email: 's.viera@nordhaven-demo.example' },
    billedYtd: 412_800,
    committed: 68_400,
    matters: 14,
    atRisk: 3,
    note:
      'The largest account and the least safe. The money is growing and the relationship is not: four families lapsed on the previous arrangement, a dedicated IP hire now sits between us and the committee, and approvals have slowed every quarter this year. This is the profile of a client preparing to run a bake-off, not one about to leave quietly.',
    signals: [
      { label: 'Approval latency tripled', detail: 'Median time from our recommendation to their sign-off went from 4 days to 13 over three quarters.', observed: '2026-08-30', weight: 0.3, direction: 'bad' },
      { label: 'New VP of Intellectual Property', detail: 'First dedicated IP leadership in the company\'s history, hired in June and reporting to the General Counsel. New leaders review incumbents.', observed: '2026-06-11', weight: 0.26, direction: 'bad' },
      { label: 'Four families lapsed for non-payment', detail: 'On the previous arrangement, before us — but it is the reason the GC pays attention to docketing, and it sets her standard.', observed: '2026-05-02', weight: 0.14, direction: 'bad' },
      { label: 'Filing volume up 62%', detail: 'Nineteen applications in twelve months against eleven. The work is growing even as the relationship cools.', observed: '2026-08-14', weight: 0.2, direction: 'good' },
      { label: 'Invoices paid within terms', detail: 'No invoice has gone past 30 days in two years.', observed: '2026-09-01', weight: 0.1, direction: 'good' }
    ],
    decisions: [
      {
        matter: 'BL-2291-US',
        question: 'How should we answer the rejection on the battery thermal file?',
        options:
          'Take an interview with the examiner first, then respond — $6,800 and about five weeks, and his record says it roughly raises the chance of allowance from half to four in five. Or amend straight away for $4,800 and three weeks, which is faster but gives up the breadth you called the moat.',
        due: '2026-10-02',
        costOfDelay: 'Past 2 October an extension costs $110, then $330, then $760 a month.',
        waitingDays: 6
      },
      {
        matter: 'BL-2031-US',
        question: 'Do we keep the photovoltaic mount family alive?',
        options:
          'It went abandoned at your request last year. Reviving it is possible but needs a petition and a showing the delay was unintentional. Roughly $3,400 all in.',
        due: '2026-11-15',
        costOfDelay: 'The revival window is not indefinite. After it closes the subject matter is public.',
        waitingDays: 21
      }
    ],
    holdings: [
      { matter: 'BL-2291-US', appNo: '18/412,907', protects: 'The way heat is pulled out of a stack of battery cells using a layer that is deliberately broken up rather than continuous.', stage: 'Office action', next: 'We answer the examiner', nextBy: '2026-10-02', spend: 31_400, committed: 6_800 },
      { matter: 'BL-2304-US', appNo: null, protects: 'A low-latency relay that lets field sensors talk to each other without a central hub.', stage: 'Drafting', next: 'You review the claims', nextBy: '2026-09-19', spend: 12_500, committed: 1_390 },
      { matter: 'BL-2110-US', appNo: '17/884,562', protects: 'A gear tooth shape that flexes slightly under load so the train runs quieter.', stage: 'Granted', next: 'First maintenance fee', nextBy: '2029-08-27', spend: 46_200, committed: 0 },
      { matter: 'BL-2031-US', appNo: '17/702,918', protects: 'A solar mount that releases under wind load instead of tearing off the roof.', stage: 'Filed', next: 'Decide whether to revive', nextBy: '2026-11-15', spend: 18_900, committed: 0 }
    ]
  },
  {
    id: 'cedar-ridge',
    name: 'Cedar Ridge Agricultural',
    sector: 'Precision agriculture',
    since: 2024,
    contact: { name: 'Grace Nakamura', role: 'Chief Technology Officer', email: 'g.nakamura@cedarridge-demo.example' },
    billedYtd: 168_200,
    committed: 22_100,
    matters: 6,
    atRisk: 0,
    note:
      'Healthy and growing. The CTO answers technical questions in hours, which is the single best predictor of retention in this book. The only exposure is concentration: everything runs through one person, and she is the most recruited individual at that company.',
    signals: [
      { label: 'Same-day technical responses', detail: 'Median approval latency under 8 hours across 19 requests.', observed: '2026-09-05', weight: 0.32, direction: 'good' },
      { label: 'Expanded into Europe', detail: 'The European launch creates EPO work that did not exist six months ago.', observed: '2026-08-22', weight: 0.26, direction: 'good' },
      { label: 'Single point of contact', detail: 'Every instruction in two years has come from one person. No second relationship exists inside the company.', observed: '2026-09-01', weight: 0.22, direction: 'bad' },
      { label: 'Referred another company', detail: 'Introduced us to a neighbouring manufacturer in July, unprompted.', observed: '2026-07-19', weight: 0.2, direction: 'good' }
    ],
    decisions: [
      {
        matter: 'BL-2287-EP',
        question: 'Which European countries should we take the irrigation valve into?',
        options:
          'Germany, France and the Netherlands cover about 70% of your addressable market for roughly $19,000. Adding Spain and Italy costs another $11,000 and covers 12% more.',
        due: '2027-02-14',
        costOfDelay: 'None yet — the priority year does not close for five months. Deciding early lowers translation costs.',
        waitingDays: 3
      }
    ],
    holdings: [
      { matter: 'BL-2287-US', appNo: '18/398,114', protects: 'An irrigation valve that decides how much to open based on what the soil sensors are reporting.', stage: 'Filed', next: 'Waiting on the examiner', nextBy: '2027-01-30', spend: 28_700, committed: 0 },
      { matter: 'BL-2287-EP', appNo: null, protects: 'The same valve, in Europe.', stage: 'Drafting', next: 'You choose countries', nextBy: '2027-02-14', spend: 4_200, committed: 19_000 }
    ]
  },
  {
    id: 'palewood',
    name: 'Palewood Bio',
    sector: 'Diagnostics',
    since: 2025,
    contact: { name: 'Dr. Ines Halloran', role: 'VP Research', email: 'i.halloran@palewood-demo.example' },
    billedYtd: 94_600,
    committed: 14_300,
    matters: 4,
    atRisk: 1,
    note:
      'Newer and steady, with one thing worth watching: an investor director joined in August who has run an IP formalisation at another portfolio company within two quarters of arriving. That process is an opportunity if we are in the room and a threat if we are not.',
    signals: [
      { label: 'Investor director with an IP playbook', detail: 'Joined the board in August. Ran the same IP formalisation at another portfolio company inside two quarters, and the fund published a case study about it.', observed: '2026-08-05', weight: 0.34, direction: 'bad' },
      { label: 'Two invoices past 45 days', detail: 'Not a payment problem — a finance-team turnover problem. Worth a call rather than a reminder notice.', observed: '2026-08-28', weight: 0.1, direction: 'bad' },
      { label: 'Research contact highly engaged', detail: 'Sends disclosures unprompted, usually with the figures already drawn.', observed: '2026-09-03', weight: 0.32, direction: 'good' },
      { label: 'No lapses, no missed deadlines', detail: 'Clean docket since the relationship began.', observed: '2026-09-01', weight: 0.24, direction: 'good' }
    ],
    decisions: [
      {
        matter: 'BL-2312-US',
        question: 'Four prior-art references need a decision before we file.',
        options:
          'We disposition each as material or not and attach a disclosure statement, or record in writing why none is material. The first is $900 and is what we recommend; the second is free and carries risk we would rather you accept knowingly than by default.',
        due: '2026-09-25',
        costOfDelay: 'The filing is held until this is answered. Nothing else on the matter moves.',
        waitingDays: 9
      }
    ],
    holdings: [
      { matter: 'BL-2312-US', appNo: null, protects: 'A test cartridge that keeps its reagent dry until the moment the sample arrives.', stage: 'Drafting', next: 'You disposition the references', nextBy: '2026-09-25', spend: 21_800, committed: 3_900 }
    ]
  }
];

/**
 * Health from the evidence, and nothing else.
 *
 * Each signal pulls the score its own way by its weight. A client whose
 * good and bad evidence balance sits at 50; one where every signal points
 * the same way reaches 0 or 100. The arithmetic is trivial on purpose —
 * the work is in the signals, and a score no one can reproduce is a score
 * no partner will act on.
 */
export function healthFromSignals(signals: RiskSignal[]): number {
  const net = signals.reduce((s, x) => s + (x.direction === 'good' ? x.weight : -x.weight), 0);
  return Math.max(0, Math.min(100, Math.round(50 + net * 50)));
}

export const CLIENTS: Client[] = RECORD.map(c => ({ ...c, health: healthFromSignals(c.signals) }));

export const MONEY = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${Math.round(n / 1000)}k`;
export const MONEY_EXACT = (n: number) => `$${n.toLocaleString()}`;

export function healthBand(h: number): { label: string; tone: 'good' | 'watch' | 'risk' } {
  if (h >= 75) return { label: 'Healthy', tone: 'good' };
  if (h >= 55) return { label: 'Worth watching', tone: 'watch' };
  return { label: 'At risk', tone: 'risk' };
}

export function bookTotals() {
  return {
    billed: CLIENTS.reduce((s, c) => s + c.billedYtd, 0),
    committed: CLIENTS.reduce((s, c) => s + c.committed, 0),
    waiting: CLIENTS.reduce((s, c) => s + c.decisions.length, 0),
    atRisk: CLIENTS.filter(c => healthBand(c.health).tone === 'risk').reduce((s, c) => s + c.billedYtd, 0)
  };
}

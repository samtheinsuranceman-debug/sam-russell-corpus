/**
 * Business development — the lead engine.
 *
 * What this models: for every company the firm could sell patent prosecution
 * to, what it is likely worth, why now, who actually decides, and the order
 * to approach them in.
 *
 * The one design rule that matters: every claim carries its provenance.
 * A partner is going to be asked "how do you know that", and "the model said
 * so" is not an answer that survives the question. So each field is tagged
 * with where it came from and how confident we are.
 *
 *   filing   USPTO / EPO / WIPO assignment and application records (public)
 *   sec      SEC EDGAR — 10-K, 10-Q, 8-K, DEF 14A proxy (public)
 *   call     Earnings call and investor-day transcripts (public)
 *   press    Company press releases, trade press, published interviews
 *   provider Licensed B2B provider (Apollo/ZoomInfo) — contact + firmographic
 *   derived  Computed by us from the above; the inputs are always shown
 *
 * Behavioural reads are built only from the public professional record —
 * how someone voted, what they sponsored, what they said on a call, what
 * they wrote in a shareholder letter. Not from personal social accounts.
 * That boundary is deliberate: it keeps the product sellable to law firms,
 * who will run diligence on exactly this.
 *
 * Demonstration dataset. No company, person, number or email below is real.
 */

export type Provenance = 'filing' | 'sec' | 'call' | 'press' | 'provider' | 'derived';

export const PROVENANCE_LABEL: Record<Provenance, string> = {
  filing: 'USPTO / EPO filing record',
  sec: 'SEC filing',
  call: 'Earnings call transcript',
  press: 'Press / published interview',
  provider: 'Licensed contact provider',
  derived: 'Computed by Patent360'
};

export type Confidence = 'high' | 'medium' | 'low';

/** A dated, attributable fact. Nothing enters a report without one. */
export type Evidence = {
  claim: string;
  source: Provenance;
  cite: string;
  date: string;
};

export type Signal = {
  label: string;
  detail: string;
  weight: number;          // 0–1, contribution to the fit score
  source: Provenance;
  date: string;
};

export type BoardMember = {
  id: string;
  name: string;
  role: string;
  since: number;
  committees: string[];
  otherBoards: string[];
  /** 0–100. Derived from sponsorship, committee chairs and citation in decisions. */
  influence: number;
  /** How this person actually decides, read off the public record. */
  pattern: {
    decisionStyle: string;
    evidencePreference: string;
    provenSensitivity: string;
    citations: Evidence[];
  };
  contact: {
    officePhone: string;
    email: string;
    /** Direct mobile is provider-gated: we never guess it. */
    mobile: string | null;
    assistant?: string;
    source: Provenance;
  };
};

export type Decision = {
  title: string;
  date: string;
  outcome: string;
  /** The person the record shows actually turned it. Often not the chair. */
  pivotal: string;
  pivotalWhy: string;
  opposed?: string;
  evidence: Evidence[];
};

export type ApproachStep = {
  order: number;
  who: string;
  role: string;
  why: string;
  channel: string;
  ask: string;
};

export type Company = {
  rank: number;
  id: string;
  name: string;
  sector: string;
  hq: string;
  employees: number;
  public: boolean;
  ticker?: string;
  /** 0–100 composite. The inputs are always shown next to it. */
  fit: number;
  /** Modelled annual prosecution revenue, in USD. */
  revenue: { low: number; base: number; high: number; confidence: Confidence; basis: string };
  portfolio: { active: number; pending: number; lapsedLast3y: number; primaryCpc: string };
  incumbent: string | null;
  signals: Signal[];
  board: BoardMember[];
  lastDecision: Decision;
  approach: ApproachStep[];
  powerNote: string;
};

const ev = (claim: string, source: Provenance, cite: string, date: string): Evidence =>
  ({ claim, source, cite, date });

/* ── The dataset ─────────────────────────────────────────────────────────
   Thirty companies carried in full. The live pipeline scores the firm's
   whole addressable set and surfaces the top hundred; this is the shape
   every one of them takes. */

export const COMPANIES: Company[] = [
  {
    rank: 1,
    id: 'nordhaven',
    name: 'Nordhaven Energy',
    sector: 'Grid storage',
    hq: 'Columbus, OH',
    employees: 2400,
    public: true,
    ticker: 'NRDV',
    fit: 94,
    revenue: {
      low: 410_000, base: 680_000, high: 950_000, confidence: 'high',
      basis: '19 applications filed in the last 24 months at a blended $28k per filing, plus 6 office-action responses a year at ~$4.8k. Run rate taken from assignment records, not from a survey.'
    },
    portfolio: { active: 71, pending: 19, lapsedLast3y: 4, primaryCpc: 'H01M 10/653' },
    incumbent: 'Two firms, split by technology area',
    signals: [
      { label: 'Filing rate up 62% year over year', detail: 'Nineteen applications in the trailing twelve months against eleven the year before, concentrated in thermal management.', weight: 0.28, source: 'filing', date: '2026-08-14' },
      { label: 'Named IP as a board-level topic', detail: 'The CEO told the Q2 call that "the moat has to be written down, not just built" when asked about Chinese entrants.', weight: 0.22, source: 'call', date: '2026-07-30' },
      { label: 'Four families lapsed for non-payment', detail: 'Suggests docketing is under-resourced — the failure mode a turnkey system removes.', weight: 0.18, source: 'filing', date: '2026-05-02' },
      { label: 'Hired a VP of Intellectual Property', detail: 'First dedicated IP leadership hire in the company\'s history; the role reports to the General Counsel.', weight: 0.2, source: 'press', date: '2026-06-11' },
      { label: 'R&D spend up 31%', detail: '$84M against $64M, with the increase disclosed as materials science headcount.', weight: 0.12, source: 'sec', date: '2026-08-01' }
    ],
    board: [
      {
        id: 'n-haldeman', name: 'Ruth Haldeman', role: 'Chair, Board of Directors', since: 2019,
        committees: ['Nominating & Governance'], otherBoards: ['Kestrel Materials', 'Ohio Manufacturing Council'],
        influence: 61,
        pattern: {
          decisionStyle: 'Consensus-builder. Tables an item rather than carrying a split vote.',
          evidencePreference: 'Wants a written recommendation circulated before the meeting; has twice deferred items that arrived as verbal proposals.',
          provenSensitivity: 'Reputational risk with the state manufacturing bloc.',
          citations: [
            ev('Deferred the 2025 vendor consolidation "until the committee can see it in writing".', 'sec', 'DEF 14A, 2025 annual meeting minutes, p.14', '2025-11-02'),
            ev('Opened the 2026 annual meeting by crediting committee work rather than management.', 'press', 'Annual meeting webcast transcript', '2026-04-18')
          ]
        },
        contact: { officePhone: '+1 (555) 0134-2200', email: 'r.haldeman@nordhaven-demo.example', mobile: null, assistant: 'Dana Pryor, +1 (555) 0134-2204', source: 'provider' }
      },
      {
        id: 'n-okonkwo', name: 'Adaeze Okonkwo', role: 'Chair, Technology & Risk Committee', since: 2021,
        committees: ['Technology & Risk', 'Audit'], otherBoards: ['Fairmount Semiconductor'],
        influence: 88,
        pattern: {
          decisionStyle: 'Moves first and fast once she has a number she trusts. Has twice pulled a decision forward a quarter.',
          evidencePreference: 'Unit economics over narrative. Asked three consecutive quarters for cost-per-filing, not total legal spend.',
          provenSensitivity: 'Single-vendor concentration; she broke up the 2024 sole-source arrangement herself.',
          citations: [
            ev('"I want cost per granted claim, not cost per matter" — Q4 board Q&A.', 'call', 'Q4 2025 earnings call, analyst Q&A', '2026-02-11'),
            ev('Sponsored the motion that split IP work across two firms.', 'sec', '8-K, Item 5.02 exhibit', '2024-09-30'),
            ev('Wrote the technology section of the 2025 shareholder letter, unusually for a non-executive.', 'sec', '2025 annual report, pp. 4–6', '2026-03-14')
          ]
        },
        contact: { officePhone: '+1 (555) 0134-2218', email: 'a.okonkwo@nordhaven-demo.example', mobile: null, source: 'provider' }
      },
      {
        id: 'n-brandt', name: 'Michael Brandt', role: 'Chief Executive Officer', since: 2017,
        committees: [], otherBoards: [],
        influence: 74,
        pattern: {
          decisionStyle: 'Defers technical procurement to the committee that owns it, then ratifies.',
          evidencePreference: 'Competitive framing. Every approved initiative in three years was argued against a named competitor.',
          provenSensitivity: 'Chinese market entrants; raised unprompted on four of the last five calls.',
          citations: [
            ev('"The moat has to be written down, not just built."', 'call', 'Q2 2026 earnings call', '2026-07-30'),
            ev('Ratified rather than proposed the last four technology vendor changes.', 'sec', 'Board minutes summary, DEF 14A', '2026-04-18')
          ]
        },
        contact: { officePhone: '+1 (555) 0134-2000', email: 'm.brandt@nordhaven-demo.example', mobile: null, assistant: 'Renee Coldwell, +1 (555) 0134-2001', source: 'provider' }
      },
      {
        id: 'n-viera', name: 'Sofia Viera', role: 'General Counsel', since: 2022,
        committees: ['Technology & Risk (ex officio)'], otherBoards: [],
        influence: 69,
        pattern: {
          decisionStyle: 'Gatekeeper. Nothing reaches the committee without her memo attached.',
          evidencePreference: 'Malpractice and docketing risk framed explicitly. Cited missed deadlines in her first board presentation.',
          provenSensitivity: 'Lapsed families — she inherited the four that went abandoned.',
          citations: [
            ev('Presented "Docketing exposure" as her opening board item.', 'sec', 'DEF 14A, governance section', '2025-04-20'),
            ev('Opened the new VP of IP role, reporting to her.', 'press', 'Company press release', '2026-06-11')
          ]
        },
        contact: { officePhone: '+1 (555) 0134-2140', email: 's.viera@nordhaven-demo.example', mobile: null, source: 'provider' }
      }
    ],
    lastDecision: {
      title: 'Split outside IP counsel across two firms',
      date: '2024-09-30',
      outcome: 'Approved 7–2. Sole-source arrangement ended; work divided by technology area.',
      pivotal: 'Adaeze Okonkwo',
      pivotalWhy:
        'She sponsored the motion, and the chair\'s own summary credits her cost-per-filing analysis as the thing that moved two undecided directors. The CEO did not propose it and voted with the majority after she had carried it.',
      opposed: 'Two directors on continuity grounds',
      evidence: [
        ev('Motion sponsored by the Technology & Risk chair.', 'sec', '8-K Item 5.02 exhibit', '2024-09-30'),
        ev('Chair\'s summary names the cost-per-filing analysis as decisive.', 'sec', 'DEF 14A, 2025 proxy, p.14', '2025-03-28'),
        ev('CEO described the change as "the committee\'s call" on the following call.', 'call', 'Q3 2024 earnings call', '2024-11-06')
      ]
    },
    approach: [
      { order: 1, who: 'Sofia Viera', role: 'General Counsel', why: 'She is the gate. Nothing reaches the committee without her memo, and she owns the lapsed-family problem this product removes. Going around her ends the process.', channel: 'Referred introduction — she and the firm share two outside directors', ask: 'Twenty minutes on docketing exposure, not a pitch.' },
      { order: 2, who: 'Adaeze Okonkwo', role: 'Chair, Technology & Risk', why: 'The record shows she turned the last decision of this exact type, and she moves fast once the unit economics hold. Bring cost per granted claim, not a rate card.', channel: 'Through Viera, with the numbers already in writing', ask: 'Put it on the committee agenda for the next cycle.' },
      { order: 3, who: 'Michael Brandt', role: 'CEO', why: 'He ratifies; he does not originate. Reaching him first would have cost the committee\'s ownership of it. Frame against the named Chinese entrants he raises unprompted.', channel: 'Committee readout', ask: 'Ratification.' },
      { order: 4, who: 'Ruth Haldeman', role: 'Board Chair', why: 'Only needed if the committee splits. She will table a divided item, so the work is to arrive undivided.', channel: 'Chair briefing, written and circulated in advance', ask: 'No objection.' }
    ],
    powerNote:
      'Title and influence diverge here, and that is the whole point. The chair ranks highest on paper and lowest on this decision; the CEO ratifies. The Technology & Risk chair carried the last comparable vote and is the real decision maker — but she is unreachable without the General Counsel, who owns the problem. So the ladder is GC → committee chair → CEO, not the reverse.'
  },

  {
    rank: 2,
    id: 'cedar-ridge',
    name: 'Cedar Ridge Agricultural',
    sector: 'Precision agriculture',
    hq: 'Des Moines, IA',
    employees: 1150,
    public: true,
    ticker: 'CRAG',
    fit: 91,
    revenue: {
      low: 280_000, base: 505_000, high: 720_000, confidence: 'high',
      basis: '14 filings in 24 months at a blended $26k, plus an unusually heavy office-action load (11 outstanding) at ~$5.2k each.'
    },
    portfolio: { active: 43, pending: 14, lapsedLast3y: 1, primaryCpc: 'A01G 25/16' },
    incumbent: 'One regional firm, 9 years',
    signals: [
      { label: 'Eleven office actions outstanding', detail: 'Against a portfolio of 43 active — the highest ratio in the sector cohort. Current counsel is behind.', weight: 0.3, source: 'filing', date: '2026-09-01' },
      { label: 'Two continuations abandoned mid-prosecution', detail: 'Both in soil telemetry, the line the CTO calls the growth engine.', weight: 0.24, source: 'filing', date: '2026-04-19' },
      { label: 'Announced a European launch', detail: 'Creates EPO work the incumbent has no filing history in.', weight: 0.26, source: 'press', date: '2026-08-22' },
      { label: 'Incumbent partner retired', detail: 'The relationship partner of nine years left practice in June. Relationships do not always transfer.', weight: 0.2, source: 'press', date: '2026-06-30' }
    ],
    board: [
      {
        id: 'c-linde', name: 'Peter Lindqvist', role: 'Chair, Audit Committee', since: 2018,
        committees: ['Audit', 'Compensation'], otherBoards: ['Midwest Grain Holdings'],
        influence: 79,
        pattern: {
          decisionStyle: 'Slow, documentary, hard to reverse once decided. Has never voted against a recommendation he asked for.',
          evidencePreference: 'Three-year cost comparison. Requested one for every vendor decision since 2021.',
          provenSensitivity: 'Auditor findings. He escalated a control gap to the full board in 2023.',
          citations: [
            ev('Required a three-year comparison before the 2024 ERP decision.', 'sec', 'DEF 14A, audit committee report', '2025-03-11'),
            ev('Escalated an internal control gap to the full board.', 'sec', '10-K, Item 9A', '2024-02-28')
          ]
        },
        contact: { officePhone: '+1 (555) 0177-4410', email: 'p.lindqvist@cedarridge-demo.example', mobile: null, source: 'provider' }
      },
      {
        id: 'c-nakamura', name: 'Grace Nakamura', role: 'Chief Technology Officer', since: 2020,
        committees: [], otherBoards: [],
        influence: 84,
        pattern: {
          decisionStyle: 'Builds the case herself and arrives with it finished. Two of the last three board-approved technology changes were hers end to end.',
          evidencePreference: 'Technical depth first, cost second. Has publicly dismissed a vendor for "a deck with no schematics".',
          provenSensitivity: 'Losing the soil-telemetry line to a competitor; names it in every public appearance.',
          citations: [
            ev('"Show me the schematic or do not show me the deck."', 'press', 'AgTech Summit panel transcript', '2026-05-09'),
            ev('Authored the board memo behind the 2025 sensor platform decision.', 'sec', 'DEF 14A, p.22', '2026-03-30')
          ]
        },
        contact: { officePhone: '+1 (555) 0177-4380', email: 'g.nakamura@cedarridge-demo.example', mobile: null, source: 'provider' }
      }
    ],
    lastDecision: {
      title: 'Replace the sensor platform vendor',
      date: '2025-11-14',
      outcome: 'Approved unanimously after a single meeting.',
      pivotal: 'Grace Nakamura',
      pivotalWhy:
        'She wrote the memo, presented it and answered the audit chair\'s cost question in the room. The proxy records no amendment and no deferral — unusual for this board, which tables roughly a third of first-presentation items.',
      evidence: [
        ev('Memo authored by the CTO, minuted as presented in full.', 'sec', 'DEF 14A, p.22', '2026-03-30'),
        ev('Approved at first presentation without amendment.', 'sec', 'DEF 14A, p.22', '2026-03-30')
      ]
    },
    approach: [
      { order: 1, who: 'Grace Nakamura', role: 'CTO', why: 'She originates. On this board, whoever writes the memo wins the vote, and she has written two of the last three. Lead with the two abandoned soil-telemetry continuations and what they cost her.', channel: 'Direct — she answers technical outreach and has said so publicly', ask: 'A technical review of the lapsed families. Bring the file history, not a deck.' },
      { order: 2, who: 'Peter Lindqvist', role: 'Audit chair', why: 'He will ask for a three-year comparison. Have it built before he asks; he has never rejected a recommendation he requested.', channel: 'Through Nakamura once she is carrying it', ask: 'Review the three-year cost comparison.' }
    ],
    powerNote:
      'The opposite shape to Nordhaven. Here the executive originates and the committee validates — so going to the audit chair first would look like going around the CTO, and on this board that has killed two vendor proposals. Start technical, arrive at cost second.'
  },

  {
    rank: 3,
    id: 'halden',
    name: 'Halden Instruments',
    sector: 'Industrial sensing',
    hq: 'Rochester, NY',
    employees: 780,
    public: false,
    fit: 88,
    revenue: {
      low: 190_000, base: 340_000, high: 520_000, confidence: 'medium',
      basis: 'Private, so no SEC record. Estimate built from 11 filings in 24 months and headcount-normalised sector benchmarks. Widen the band accordingly.'
    },
    portfolio: { active: 29, pending: 11, lapsedLast3y: 0, primaryCpc: 'H04W 40/22' },
    incumbent: 'In-house, one attorney',
    signals: [
      { label: 'Single in-house attorney carrying 40 matters', detail: 'The load at which firms of this size historically outsource. No lapses yet — this is a capacity sale, not a rescue.', weight: 0.39, source: 'filing', date: '2026-09-04' },
      { label: 'Series C closed at $60M', detail: 'Investor-led boards push IP formalisation within two quarters of a growth round.', weight: 0.34, source: 'press', date: '2026-07-15' },
      { label: 'Two new board seats from the round', detail: 'New directors with no loyalty to the current arrangement.', weight: 0.27, source: 'press', date: '2026-07-15' }
    ],
    board: [
      {
        id: 'h-osei', name: 'Daniel Osei', role: 'Investor Director (Meridian Growth)', since: 2026,
        committees: ['Audit'], otherBoards: ['Palewood Bio', 'Ashford Water'],
        influence: 81,
        pattern: {
          decisionStyle: 'Imports playbooks. Has installed the same IP-formalisation process at two other portfolio companies within six months of joining.',
          evidencePreference: 'Benchmarks against the rest of the portfolio.',
          provenSensitivity: 'Diligence surprises at exit.',
          citations: [
            ev('Ran the same IP formalisation at Palewood Bio within two quarters of joining.', 'press', 'Portfolio case study, published by the fund', '2025-10-02'),
            ev('"Most of our write-downs are things diligence found and we did not."', 'press', 'Fund annual letter, published', '2026-01-20')
          ]
        },
        contact: { officePhone: '+1 (555) 0162-8830', email: 'd.osei@meridiangrowth-demo.example', mobile: null, source: 'provider' }
      }
    ],
    lastDecision: {
      title: 'Formalise IP process post-round',
      date: '2026-08-05',
      outcome: 'Directed management to present options by Q4.',
      pivotal: 'Daniel Osei',
      pivotalWhy:
        'He raised it at his first meeting and the direction issued the same day. The fund has published its own case study of doing exactly this at another portfolio company — the play is on the record before it happens here.',
      evidence: [
        ev('Raised at the new director\'s first board meeting.', 'press', 'Company announcement of board changes', '2026-08-05'),
        ev('Identical sequence documented at another portfolio company.', 'press', 'Fund-published case study', '2025-10-02')
      ]
    },
    approach: [
      { order: 1, who: 'Daniel Osei', role: 'Investor director', why: 'He has already decided this is happening and has told the board so. He is not evaluating whether — only who. Arrive as the answer to a question he has already asked.', channel: 'Through the fund, referencing the Palewood engagement by name', ask: 'Be one of the options management presents in Q4.' },
      { order: 2, who: 'In-house counsel', role: 'Sole IP attorney', why: 'This lands on her desk as either relief or replacement. Frame it as capacity, explicitly, in the first sentence — a capacity sale that reads as a replacement sale dies here.', channel: 'Direct, after the fund introduction, never before', ask: 'Co-author the options memo with her.' }
    ],
    powerNote:
      'The decision is already made; only the vendor is open. The risk is not losing the argument — it is the in-house attorney reading this as her replacement and closing the door. Reach the investor first for the mandate, then her, fast, with the word capacity.'
  }
];

/* The remaining named targets, carried at list depth. Full board, decision
   and approach records build on first open, from the same sources. */
export type ListTarget = {
  rank: number; id: string; name: string; sector: string; hq: string;
  fit: number; revenueBase: number; pending: number; incumbent: string | null;
  topSignal: string; nextStep: string;
};

export const MORE_TARGETS: ListTarget[] = [
  { rank: 4, id: 'wexler', name: 'Wexler Dynamics', sector: 'Precision mechanics', hq: 'Hartford, CT', fit: 86, revenueBase: 470_000, pending: 12, incumbent: 'One firm, 12 years', topSignal: 'Issue fees paid on six families in one month — a product launch is close', nextStep: 'Map the launch to filing gaps' },
  { rank: 5, id: 'meridian-log', name: 'Meridian Logistics', sector: 'Cold chain', hq: 'Memphis, TN', fit: 84, revenueBase: 395_000, pending: 9, incumbent: null, topSignal: 'No outside IP counsel of record; filings made pro se', nextStep: 'Lead with the pro se filings that went abandoned' },
  { rank: 6, id: 'ashford', name: 'Ashford Water', sector: 'Municipal infrastructure', hq: 'Sacramento, CA', fit: 83, revenueBase: 355_000, pending: 8, incumbent: 'Two firms', topSignal: 'Examiner interview scheduled with no attorney of record present', nextStep: 'Offer interview representation as the entry point' },
  { rank: 7, id: 'palewood', name: 'Palewood Bio', sector: 'Diagnostics', hq: 'Cambridge, MA', fit: 82, revenueBase: 610_000, pending: 15, incumbent: 'One firm, 4 years', topSignal: 'Shares an investor director with Halden — the same playbook is coming', nextStep: 'Reference the Halden conversation' },
  { rank: 8, id: 'fairmount', name: 'Fairmount Semiconductor', sector: 'Analog silicon', hq: 'Austin, TX', fit: 80, revenueBase: 720_000, pending: 21, incumbent: 'Three firms', topSignal: 'Okonkwo sits on this board too — a warm path exists if Nordhaven lands', nextStep: 'Hold until Nordhaven closes' },
  { rank: 9, id: 'kestrel', name: 'Kestrel Materials', sector: 'Advanced coatings', hq: 'Pittsburgh, PA', fit: 78, revenueBase: 290_000, pending: 7, incumbent: 'One firm, 6 years', topSignal: 'Three continuations filed on the last day of pendency, twice', nextStep: 'Docketing discipline as the opening' },
  { rank: 10, id: 'brightline', name: 'Brightline Optics', sector: 'Photonics', hq: 'Boulder, CO', fit: 77, revenueBase: 340_000, pending: 10, incumbent: 'In-house, two attorneys', topSignal: 'PCT national-phase deadlines in four jurisdictions inside 90 days', nextStep: 'Time-boxed national-phase engagement' },
  { rank: 11, id: 'talbot', name: 'Talbot Aerostructures', sector: 'Aerospace components', hq: 'Wichita, KS', fit: 76, revenueBase: 520_000, pending: 13, incumbent: 'One firm, 15 years', topSignal: 'Government contract requires domestic-only counsel; incumbent offshores drafting', nextStep: 'Lead with the contract clause' },
  { rank: 12, id: 'rowan-med', name: 'Rowan Medical', sector: 'Surgical devices', hq: 'Minneapolis, MN', fit: 75, revenueBase: 580_000, pending: 16, incumbent: 'Two firms', topSignal: 'Two final rejections not appealed within the window', nextStep: 'Appeal-strategy review' }
];

export const MONEY = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${Math.round(n / 1000)}k`;

/** Pipeline totals, computed rather than asserted. */
export function pipeline() {
  const full = COMPANIES.reduce((s, c) => s + c.revenue.base, 0);
  const rest = MORE_TARGETS.reduce((s, t) => s + t.revenueBase, 0);
  return {
    shown: COMPANIES.length + MORE_TARGETS.length,
    base: full + rest,
    low: COMPANIES.reduce((s, c) => s + c.revenue.low, 0) + Math.round(rest * 0.62),
    high: COMPANIES.reduce((s, c) => s + c.revenue.high, 0) + Math.round(rest * 1.42)
  };
}

/** The cross-company board index — every director we hold, by influence. */
export function boardIndex() {
  return COMPANIES.flatMap(c =>
    c.board.map(b => ({ ...b, company: c.name, companyId: c.id, pivotal: c.lastDecision.pivotal === b.name }))
  ).sort((a, b) => b.influence - a.influence);
}

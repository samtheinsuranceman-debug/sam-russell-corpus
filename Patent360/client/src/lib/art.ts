/**
 * Prior art — what is already out there, and where the gap is.
 *
 * Most prior-art tools return a ranked list and stop. A ranked list does not
 * answer the question an attorney actually has, which is not "what is
 * similar" but "which of my claim elements is still free". So the centre of
 * this module is a coverage matrix: claim elements down one axis, references
 * across the other, and the columns with nothing in them are the allowable
 * subject matter.
 *
 * The second thing it tracks is the duty of disclosure. Under 37 CFR 1.56
 * everyone substantively involved in prosecution must disclose material art,
 * and under 1.97 an IDS is free only inside three months of citation in a
 * counterpart application — after that it costs a fee, and after allowance it
 * costs a fee and a certification. Missing that window is pure avoidable
 * spend, and failing to disclose at all is how patents become unenforceable.
 * So every reference carries its own disclosure clock.
 *
 * Demonstration dataset. The references, dates and mappings below are
 * invented for this build. Nothing here is a search report or legal advice.
 */

export type Corpus = 'uspto' | 'epo' | 'wipo' | 'npl';

export const CORPUS_LABEL: Record<Corpus, string> = {
  uspto: 'US granted + pre-grant',
  epo: 'EPO / DOCDB',
  wipo: 'PCT (WIPO)',
  npl: 'Non-patent literature'
};

/** How a reference reads on one claim element. */
export type Read = 'teaches' | 'suggests' | 'silent';

export const READ_LABEL: Record<Read, string> = {
  teaches: 'Teaches it',
  suggests: 'Arguably suggests it',
  silent: 'Silent'
};

export type ArtRef = {
  id: string;
  title: string;
  assignee: string;
  published: string;
  corpus: Corpus;
  cpc: string;
  /** 0–1. Similarity of the disclosure to the claimed combination. */
  relevance: number;
  /** element id -> how this reference reads on it */
  reads: Record<string, Read>;
  /** Why it matters, in one line an attorney can put in a memo. */
  note: string;
  /** Did the examiner rely on this, or did we find it ourselves? */
  citedByExaminer: boolean;
  disclosure: {
    /** Cited by an examiner in a counterpart, which starts the 1.97 clock. */
    citedInCounterpart: string | null;
    onIds: boolean;
  };
};

export type Element = {
  id: string;
  label: string;
  /** Which claim introduces it. */
  claim: number;
  /** Where the specification supports it, so a narrowing amendment is safe. */
  support: string;
};

export type Search = {
  matter: string;
  appNo: string;
  title: string;
  query: string;
  cpc: string[];
  ran: string;
  searched: number;
  elements: Element[];
  refs: ArtRef[];
};

/* ── The dataset ───────────────────────────────────────────────────────── */

export const SEARCH: Search = {
  matter: 'BL-2291-US',
  appNo: '18/412,907',
  title: 'Thermal management for stacked battery modules',
  query: 'discontinuous phase-change interstitial layer AND coolant manifold AND cell stack',
  cpc: ['H01M 10/653', 'H01M 10/6556', 'F28F 13/00'],
  ran: '2026-09-10',
  searched: 4_182_600,
  elements: [
    { id: 'e1', label: 'Stacked cell arrangement', claim: 1, support: '[0018]–[0021], Fig. 1' },
    { id: 'e2', label: 'Interstitial thermal layer between cells', claim: 1, support: '[0024]–[0027], Fig. 2' },
    { id: 'e3', label: 'Layer is discontinuous across the channel', claim: 1, support: '[0031]–[0034], Fig. 2B' },
    { id: 'e4', label: 'Phase-change material in the layer', claim: 2, support: '[0028]–[0030]' },
    { id: 'e5', label: 'Coolant manifold with inlet and outlet', claim: 1, support: '[0036]–[0039], Fig. 3' },
    { id: 'e6', label: 'Channel cross-section decreases across flow', claim: 4, support: '[0042], Fig. 3B' },
    { id: 'e7', label: 'Controller derates charge current on gradient', claim: 6, support: '[0051]–[0055]' }
  ],
  refs: [
    {
      id: 'US 10,431,882',
      citedByExaminer: true,
      title: 'Phase-change thermal interface for cell stacks',
      assignee: 'Takahashi Thermal KK',
      published: '2019-10-01',
      corpus: 'uspto',
      cpc: 'H01M 10/653',
      relevance: 0.91,
      reads: { e1: 'teaches', e2: 'teaches', e3: 'silent', e4: 'teaches', e5: 'silent', e6: 'silent', e7: 'silent' },
      note: 'The closest single reference and the one the examiner leads with. Continuous layer throughout — it never contemplates breaking it.',
      disclosure: { citedInCounterpart: '2026-07-02', onIds: true }
    },
    {
      id: 'US 9,887,442',
      citedByExaminer: true,
      title: 'Coolant manifold for battery enclosures',
      assignee: 'Brennan Systems Inc',
      published: '2018-02-06',
      corpus: 'uspto',
      cpc: 'H01M 10/6556',
      relevance: 0.78,
      reads: { e1: 'teaches', e2: 'silent', e3: 'silent', e4: 'silent', e5: 'teaches', e6: 'suggests', e7: 'silent' },
      note: 'Liquid manifold. Supplies the element Takahashi lacks, which is why the rejection is a combination and not an anticipation.',
      disclosure: { citedInCounterpart: '2026-07-02', onIds: true }
    },
    {
      id: 'US 11,024,901',
      citedByExaminer: true,
      title: 'Tapered coolant channels',
      assignee: 'Osei Engineering Ltd',
      published: '2021-06-01',
      corpus: 'uspto',
      cpc: 'F28F 13/00',
      relevance: 0.64,
      reads: { e1: 'silent', e2: 'silent', e3: 'silent', e4: 'silent', e5: 'suggests', e6: 'teaches', e7: 'silent' },
      note: 'Tapers along the flow direction. The claim tapers across it — a different geometry the examiner has not addressed.',
      disclosure: { citedInCounterpart: '2026-07-02', onIds: true }
    },
    {
      id: 'EP 3 441 209 A1',
      citedByExaminer: false,
      title: 'Segmented thermal pads for prismatic cells',
      assignee: 'Vollmer Batterietechnik GmbH',
      published: '2019-02-13',
      corpus: 'epo',
      cpc: 'H01M 10/653',
      relevance: 0.83,
      reads: { e1: 'teaches', e2: 'teaches', e3: 'suggests', e4: 'silent', e5: 'silent', e6: 'silent', e7: 'silent' },
      note:
        'The one that matters and the examiner has not cited. Segmented pads with gaps between segments — the nearest thing in the art to the discontinuity limitation. Material under 1.56 whether or not we like it.',
      disclosure: { citedInCounterpart: '2026-08-28', onIds: false }
    },
    {
      id: 'WO 2020/114882',
      citedByExaminer: false,
      title: 'Thermal runaway mitigation by charge derating',
      assignee: 'Halden Instruments',
      published: '2020-06-11',
      corpus: 'wipo',
      cpc: 'H01M 10/48',
      relevance: 0.59,
      reads: { e1: 'silent', e2: 'silent', e3: 'silent', e4: 'silent', e5: 'silent', e6: 'silent', e7: 'teaches' },
      note: 'Reads squarely on claim 6. Claim 6 will not survive on the derating feature alone; its value is as a dependent.',
      disclosure: { citedInCounterpart: null, onIds: false }
    },
    {
      id: 'J. Power Sources 441 (2019) 227–239',
      citedByExaminer: false,
      title: 'Interfacial resistance in segmented phase-change layers',
      assignee: 'Kwon, Meier & Alvarez',
      published: '2019-11-01',
      corpus: 'npl',
      cpc: '—',
      relevance: 0.71,
      reads: { e1: 'silent', e2: 'teaches', e3: 'teaches', e4: 'teaches', e5: 'silent', e6: 'silent', e7: 'silent' },
      note:
        'Non-patent literature, and the most dangerous item on this list. It measures segmented phase-change layers directly — closer to the discontinuity limitation than anything the examiner has found.',
      disclosure: { citedInCounterpart: null, onIds: false }
    }
  ]
};

/* ── Derived reads ─────────────────────────────────────────────────────── */

export type Coverage = {
  element: Element;
  taught: ArtRef[];
  suggested: ArtRef[];
  /** free when nothing teaches or suggests it */
  free: boolean;
};

export function coverage(s: Search): Coverage[] {
  return s.elements.map(el => {
    const taught = s.refs.filter(r => r.reads[el.id] === 'teaches');
    const suggested = s.refs.filter(r => r.reads[el.id] === 'suggests');
    return { element: el, taught, suggested, free: taught.length === 0 && suggested.length === 0 };
  });
}

/**
 * The gap that matters is not "what is free of all art" — usually nothing
 * is. It is "what is free of the art the examiner is actually relying on",
 * because that is the argument available today. Then, separately and more
 * uncomfortably: which of those gaps does our own search close?
 *
 * An attorney who argues a limitation the examiner has not found, while
 * sitting on a reference of their own that teaches it, has a §1.56 problem
 * and a credibility problem in the same motion. So the two lists are shown
 * side by side and never merged.
 */
export type Gap = {
  element: Element;
  /** References the examiner relied on that read on this element. */
  byExaminer: ArtRef[];
  /** References we found ourselves that read on it. */
  byOurSearch: ArtRef[];
};

export function gaps(s: Search): { open: Gap[]; closedByOurs: Gap[] } {
  const hits = (el: Element, pool: ArtRef[]) =>
    pool.filter(r => r.reads[el.id] === 'teaches' || r.reads[el.id] === 'suggests');

  const cited = s.refs.filter(r => r.citedByExaminer);
  const found = s.refs.filter(r => !r.citedByExaminer);

  const all: Gap[] = s.elements.map(el => ({
    element: el,
    byExaminer: hits(el, cited),
    byOurSearch: hits(el, found)
  }));

  return {
    open: all.filter(g => g.byExaminer.length === 0 && g.byOurSearch.length === 0),
    closedByOurs: all.filter(g => g.byExaminer.length === 0 && g.byOurSearch.length > 0)
  };
}

/* ── Duty of disclosure ────────────────────────────────────────────────── */

export type IdsStatus = 'filed' | 'free-window' | 'fee-due' | 'overdue';

export const IDS_STATUS_LABEL: Record<IdsStatus, string> = {
  filed: 'On the IDS',
  'free-window': 'Free to file',
  'fee-due': 'Fee now required',
  overdue: 'Not disclosed'
};

export const TODAY = '2026-09-11';

function days(a: string, b: string) {
  return Math.round(
    (new Date(b + 'T00:00:00Z').getTime() - new Date(a + 'T00:00:00Z').getTime()) / 86_400_000
  );
}

/**
 * 37 CFR 1.97(e): an IDS filed within three months of citation in a
 * counterpart foreign application needs no fee and no certification.
 * After that it needs one or both.
 */
export function idsStatus(r: ArtRef): { status: IdsStatus; daysLeft: number | null; why: string } {
  if (r.disclosure.onIds) {
    return { status: 'filed', daysLeft: null, why: 'Already submitted and considered.' };
  }
  if (!r.disclosure.citedInCounterpart) {
    return {
      status: 'overdue',
      daysLeft: null,
      why:
        'Found by us rather than cited against us, so no statutory window is running — but 37 CFR 1.56 still applies the moment it is known to be material.'
    };
  }
  const left = 90 - days(r.disclosure.citedInCounterpart, TODAY);
  if (left > 0) {
    return {
      status: 'free-window',
      daysLeft: left,
      why: `Cited in a counterpart on ${r.disclosure.citedInCounterpart}. Inside the three-month window under 37 CFR 1.97(e) — no fee, no certification.`
    };
  }
  return {
    status: 'fee-due',
    daysLeft: left,
    why: `The three-month window closed ${Math.abs(left)} days ago. Still filable, but now with a fee.`
  };
}

export function undisclosed(s: Search): ArtRef[] {
  return s.refs.filter(r => !r.disclosure.onIds);
}

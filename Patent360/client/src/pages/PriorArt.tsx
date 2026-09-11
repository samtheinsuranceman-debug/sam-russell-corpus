import { useState } from 'react';
import { Bar, Button, Icon, PageHead, Tabs } from '../components/ui';
import {
  CORPUS_LABEL, IDS_STATUS_LABEL, READ_LABEL, SEARCH,
  coverage, gaps, idsStatus, undisclosed, type Read
} from '../lib/art';

const TABS = ['Coverage', 'References', 'Duty of disclosure'];

const READ_MARK: Record<Read, string> = { teaches: '●', suggests: '◐', silent: '' };

export function PriorArt() {
  const [tab, setTab] = useState('Coverage');
  const s = SEARCH;
  const cov = coverage(s);
  const g = gaps(s);
  const open = undisclosed(s);

  return (
    <>
      <PageHead
        title="Prior art"
        sub={`${s.matter} · ${s.title}`}
        action={
          <div className="row">
            <Button variant="ghost" icon="search">Re-run the search</Button>
            <Button icon="send">Build the IDS</Button>
          </div>
        }
      />

      <div className="pa-query">
        <div>
          <span className="label">Query</span>
          <p className="pa-q">{s.query}</p>
          <div className="pa-cpc">
            {s.cpc.map(c => <span className="oa-chip" key={c}>{c}</span>)}
            {(Object.keys(CORPUS_LABEL) as Array<keyof typeof CORPUS_LABEL>).map(k => (
              <span className="pa-corpus" key={k}>{CORPUS_LABEL[k]}</span>
            ))}
          </div>
        </div>
        <div className="pa-query-fig">
          <span className="label">Documents searched</span>
          <strong>{(s.searched / 1_000_000).toFixed(2)}M</strong>
          <span className="small muted">last run {s.ran}</span>
        </div>
      </div>

      {open.length > 0 && (
        <div className="pa-duty-flag">
          <Icon name="alert" size={16} />
          <p>
            <b>{open.length} references are not on the IDS.</b> Under 37 CFR 1.56 the duty to
            disclose material art runs on everyone substantively involved in prosecution, and it
            does not wait for an examiner to find it. Two of these were found by us, which is the
            harder case — no statutory clock is running, and the duty applies anyway.
          </p>
        </div>
      )}

      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <div style={{ height: 18 }} />

      {/* ── Coverage matrix ───────────────────────────────────────────── */}
      {tab === 'Coverage' && (
        <>
          <div className="pa-free">
            <span className="label">Free against the art the examiner is relying on</span>
            <p>
              Not what is free of everything — usually nothing is. These are the limitations none
              of the three references in the rejection reads on, which makes them the argument
              available today and the place a narrowing amendment should retreat <em>to</em>.
            </p>
            <div className="pa-free-list">
              {g.open.map(x => (
                <div className="pa-free-item" key={x.element.id}>
                  <div>
                    <div className="pa-free-label">{x.element.label}</div>
                    <div className="small muted">
                      Claim {x.element.claim} · supported at {x.element.support}
                    </div>
                  </div>
                  <span className="pa-pill is-free">Nothing cited reads on it</span>
                </div>
              ))}
              {g.open.length === 0 && (
                <p className="small muted" style={{ margin: 0 }}>
                  Every limitation is touched by the cited art. The argument has to be the
                  combination rather than any single element.
                </p>
              )}
            </div>
          </div>

          {g.closedByOurs.length > 0 && (
            <div className="pa-closed">
              <div className="pa-closed-head">
                <Icon name="alert" size={16} />
                <span className="label">Free against the examiner — closed by art we found</span>
              </div>
              <p>
                The uncomfortable column. The examiner has not found these, so the argument looks
                open. Our own search says it is not. Arguing a limitation while holding a reference
                that teaches it is a 37 CFR 1.56 problem and a credibility problem in the same
                motion, so this is a decision to take deliberately rather than by omission.
              </p>
              <div className="pa-free-list">
                {g.closedByOurs.map(x => (
                  <div className="pa-free-item" key={x.element.id}>
                    <div>
                      <div className="pa-free-label">{x.element.label}</div>
                      <div className="small muted">
                        Claim {x.element.claim} · closed by{' '}
                        {x.byOurSearch.map(r => r.id).join(', ')}
                      </div>
                    </div>
                    <span className="pa-pill is-closed">Disclose before arguing it</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pa-matrix-wrap">
            <table className="pa-matrix">
              <thead>
                <tr>
                  <th className="pa-el-head">Claim element</th>
                  {s.refs.map(r => (
                    <th key={r.id} className={`pa-ref-head${r.citedByExaminer ? ' is-cited' : ''}`}>
                      <span className="id">{r.id.split(' ')[0]}</span>
                      <span className="pa-ref-num">{r.id.split(' ').slice(1).join(' ')}</span>
                      <span className="pa-ref-origin">{r.citedByExaminer ? 'cited' : 'we found'}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cov.map(c => (
                  <tr key={c.element.id} className={c.free ? 'is-free-row' : ''}>
                    <td className="pa-el">
                      <span className="pa-el-claim">cl.{c.element.claim}</span>
                      {c.element.label}
                    </td>
                    {s.refs.map(r => {
                      const read = r.reads[c.element.id]!;
                      return (
                        <td key={r.id} className={`pa-cell pa-${read}`} title={READ_LABEL[read]}>
                          {READ_MARK[read]}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pa-legend">
            <span><i className="pa-teaches">●</i> teaches it</span>
            <span><i className="pa-suggests">◐</i> arguably suggests it</span>
            <span><i className="pa-silent">·</i> silent</span>
            <span className="pa-legend-free">A row with no marks is free.</span>
          </div>
        </>
      )}

      {/* ── References ────────────────────────────────────────────────── */}
      {tab === 'References' && (
        <div className="pa-refs">
          {[...s.refs].sort((a, b) => b.relevance - a.relevance).map(r => {
            const ids = idsStatus(r);
            return (
              <div className="pa-ref" key={r.id}>
                <div className="pa-ref-top">
                  <div>
                    <div className="pa-ref-id">
                      <span className="id">{r.id}</span>
                      <span className="pa-corpus">{CORPUS_LABEL[r.corpus]}</span>
                      <span className={`pa-ids pa-ids-${ids.status}`}>{IDS_STATUS_LABEL[ids.status]}</span>
                    </div>
                    <div className="pa-ref-title">{r.title}</div>
                    <div className="small muted">{r.assignee} · {r.published} · CPC {r.cpc}</div>
                  </div>
                  <div className="pa-rel">
                    <span className="num">{Math.round(r.relevance * 100)}</span>
                    <span className="label">relevance</span>
                    <Bar pct={r.relevance * 100} />
                  </div>
                </div>
                <p className="pa-ref-note">{r.note}</p>
                <div className="pa-reads">
                  <span className="label">Reads on</span>
                  {s.elements
                    .filter(el => r.reads[el.id] !== 'silent')
                    .map(el => (
                      <span className={`oa-chip pa-chip-${r.reads[el.id]}`} key={el.id}>
                        {el.label}
                      </span>
                    ))}
                  {s.elements.every(el => r.reads[el.id] === 'silent') && (
                    <span className="small muted">nothing in the claim set</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Duty of disclosure ────────────────────────────────────────── */}
      {tab === 'Duty of disclosure' && (
        <div className="pa-duty">
          {s.refs.map(r => {
            const ids = idsStatus(r);
            return (
              <div className={`pa-duty-row pa-ids-${ids.status}`} key={r.id}>
                <div className="pa-duty-left">
                  <span className="id">{r.id}</span>
                  <div className="small muted">{r.title}</div>
                </div>
                <div>
                  <span className={`pa-ids pa-ids-${ids.status}`}>{IDS_STATUS_LABEL[ids.status]}</span>
                  <p className="small pa-duty-why">{ids.why}</p>
                </div>
                <div className="pa-duty-right">
                  {ids.daysLeft !== null && ids.daysLeft > 0 && (
                    <>
                      <span className="num" style={{ color: ids.daysLeft <= 21 ? 'var(--warn)' : 'var(--accent-300)' }}>
                        {ids.daysLeft}d
                      </span>
                      <span className="label">free window</span>
                    </>
                  )}
                  {ids.status === 'filed' && <Icon name="check" size={18} />}
                </div>
              </div>
            );
          })}
          <p className="small muted" style={{ marginTop: 14 }}>
            The three-month free window comes from 37 CFR 1.97(e): an IDS filed within three months
            of citation in a counterpart foreign application needs no fee and no certification.
            After that it needs one, and after allowance it needs both. Missing the window is pure
            avoidable spend; missing the duty is how a granted patent becomes unenforceable.
          </p>
        </div>
      )}

      <p className="small muted" style={{ marginTop: 22 }}>
        Demonstration dataset — the references, dates and mappings here are invented for this
        build. Nothing on this page is a search report or legal advice.
      </p>
    </>
  );
}

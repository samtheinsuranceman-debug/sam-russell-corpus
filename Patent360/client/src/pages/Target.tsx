import { Link, useRoute } from 'wouter';
import { Bar, Button, Icon, PageHead } from '../components/ui';
import { COMPANIES, MONEY, PROVENANCE_LABEL, type Evidence } from '../lib/bd';

function Cite({ e }: { e: Evidence }) {
  return (
    <li className="bd-cite">
      <span className="bd-cite-claim">{e.claim}</span>
      <span className="bd-cite-src">
        <span className={`bd-src bd-src-${e.source}`}>{PROVENANCE_LABEL[e.source]}</span>
        <span className="muted"> · {e.cite} · {e.date}</span>
      </span>
    </li>
  );
}

export function Target() {
  const [, params] = useRoute('/app/targets/:id');
  const c = COMPANIES.find(x => x.id === params?.id);

  if (!c) {
    return (
      <>
        <PageHead title="Target not found" sub="This company has not been scored into the demonstration dataset." />
        <Link href="/app/targets"><a className="bd-open">Back to targets</a></Link>
      </>
    );
  }

  const pivotal = c.board.find(b => b.name === c.lastDecision.pivotal);

  return (
    <>
      <div className="bd-crumb">
        <Link href="/app/targets"><a>Targets</a></Link>
        <span>/</span>
        <span className="id">#{String(c.rank).padStart(2, '0')}</span>
      </div>

      <PageHead
        title={c.name}
        sub={`${c.sector} · ${c.hq} · ${c.employees.toLocaleString()} employees · ${c.public ? `Public (${c.ticker})` : 'Private'}`}
        action={
          <div className="row">
            <Button variant="ghost" icon="database">Add to client report</Button>
            <Button icon="send">Start the approach</Button>
          </div>
        }
      />

      {/* ── What it is worth ─────────────────────────────────────────── */}
      <div className="bd-grid-3">
        <div className="bd-card bd-card-key">
          <span className="label">Modelled annual value</span>
          <strong className="bd-fig">{MONEY(c.revenue.base)}</strong>
          <span className="small muted">
            {MONEY(c.revenue.low)} – {MONEY(c.revenue.high)} · {c.revenue.confidence} confidence
          </span>
          <p className="small bd-basis">{c.revenue.basis}</p>
        </div>
        <div className="bd-card">
          <span className="label">Fit</span>
          <strong className="bd-fig">{c.fit}</strong>
          <Bar pct={c.fit} />
          <p className="small muted bd-basis">
            Composite of the signals below, each weighted and dated. No signal, no score.
          </p>
        </div>
        <div className="bd-card">
          <span className="label">Portfolio</span>
          <div className="bd-kv"><span>Active</span><b className="num">{c.portfolio.active}</b></div>
          <div className="bd-kv"><span>Pending</span><b className="num">{c.portfolio.pending}</b></div>
          <div className="bd-kv"><span>Lapsed, 3 yrs</span>
            <b className="num" style={{ color: c.portfolio.lapsedLast3y ? 'var(--alert)' : undefined }}>
              {c.portfolio.lapsedLast3y}
            </b>
          </div>
          <div className="bd-kv"><span>Primary CPC</span><b className="id">{c.portfolio.primaryCpc}</b></div>
          <div className="bd-kv"><span>Incumbent</span>
            <b style={{ fontSize: 13 }}>{c.incumbent ?? 'None of record'}</b>
          </div>
        </div>
      </div>

      {/* ── Why now ──────────────────────────────────────────────────── */}
      <h2 className="bd-h2">Why now</h2>
      <div className="bd-signals">
        {c.signals.map(s => (
          <div className="bd-signal" key={s.label}>
            <div className="bd-signal-w">
              <span className="num">{Math.round(s.weight * 100)}</span>
              <Bar pct={s.weight * 100} />
            </div>
            <div>
              <div className="bd-signal-label">{s.label}</div>
              <p className="small">{s.detail}</p>
              <span className={`bd-src bd-src-${s.source}`}>{PROVENANCE_LABEL[s.source]}</span>
              <span className="small muted"> · {s.date}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Who actually decides ─────────────────────────────────────── */}
      <h2 className="bd-h2">Who actually decides</h2>
      <div className="bd-powernote">
        <Icon name="alert" size={15} />
        <p>{c.powerNote}</p>
      </div>

      <div className="bd-board">
        {[...c.board].sort((a, b) => b.influence - a.influence).map(b => (
          <div className={`bd-person${b.name === c.lastDecision.pivotal ? ' is-pivotal' : ''}`} key={b.id}>
            <div className="bd-person-head">
              <div>
                <div className="bd-person-name">
                  {b.name}
                  {b.name === c.lastDecision.pivotal && <span className="bd-tag-pivotal">Turned the last one</span>}
                </div>
                <div className="small muted">{b.role} · since {b.since}</div>
              </div>
              <div className="bd-influence">
                <span className="num">{b.influence}</span>
                <span className="label">influence</span>
              </div>
            </div>

            <div className="bd-person-grid">
              <div>
                <span className="label">How they decide</span>
                <p className="small">{b.pattern.decisionStyle}</p>
                <span className="label">What persuades them</span>
                <p className="small">{b.pattern.evidencePreference}</p>
                <span className="label">What they are sensitive to</span>
                <p className="small">{b.pattern.provenSensitivity}</p>
              </div>
              <div>
                <span className="label">On the record</span>
                <ul className="bd-cites">{b.pattern.citations.map((e, i) => <Cite e={e} key={i} />)}</ul>
              </div>
            </div>

            <div className="bd-contact">
              <span><Icon name="users" size={13} /> {b.contact.email}</span>
              <span><Icon name="bell" size={13} /> {b.contact.officePhone}</span>
              {b.contact.assistant && <span className="muted">Assistant: {b.contact.assistant}</span>}
              <span className="bd-gated">
                <Icon name="lock" size={12} /> Direct mobile — requires a licensed provider key
              </span>
            </div>

            {(b.committees.length > 0 || b.otherBoards.length > 0) && (
              <div className="small muted bd-person-foot">
                {b.committees.length > 0 && <>Committees: {b.committees.join(', ')}. </>}
                {b.otherBoards.length > 0 && <>Also sits on: {b.otherBoards.join(', ')}.</>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── The last decision ────────────────────────────────────────── */}
      <h2 className="bd-h2">The last decision of this kind</h2>
      <div className="bd-decision">
        <div className="bd-decision-head">
          <div>
            <div className="bd-person-name">{c.lastDecision.title}</div>
            <div className="small muted">{c.lastDecision.date} · {c.lastDecision.outcome}</div>
          </div>
          <div className="bd-pivot">
            <span className="label">Pivotal</span>
            <strong>{c.lastDecision.pivotal}</strong>
            {pivotal && <span className="small muted">{pivotal.role}</span>}
          </div>
        </div>
        <p className="bd-decision-why">{c.lastDecision.pivotalWhy}</p>
        {c.lastDecision.opposed && (
          <p className="small muted">Opposed: {c.lastDecision.opposed}.</p>
        )}
        <span className="label" style={{ marginTop: 14, display: 'block' }}>How we know</span>
        <ul className="bd-cites">{c.lastDecision.evidence.map((e, i) => <Cite e={e} key={i} />)}</ul>
      </div>

      {/* ── The ladder ───────────────────────────────────────────────── */}
      <h2 className="bd-h2">The approach, in order</h2>
      <ol className="bd-ladder">
        {c.approach.map(s => (
          <li key={s.order}>
            <div className="bd-step-n">{String(s.order).padStart(2, '0')}</div>
            <div>
              <div className="bd-person-name">{s.who} <span className="small muted">— {s.role}</span></div>
              <p className="bd-step-why">{s.why}</p>
              <div className="bd-step-meta">
                <span><span className="label">Channel</span> {s.channel}</span>
                <span><span className="label">The ask</span> {s.ask}</span>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <p className="small muted" style={{ marginTop: 22 }}>
        Behavioural reads are built from the public professional record only — filings, proxies,
        transcripts and published interviews. Personal social accounts are not a source.
        Demonstration dataset: no company, person, number or email here is real.
      </p>
    </>
  );
}

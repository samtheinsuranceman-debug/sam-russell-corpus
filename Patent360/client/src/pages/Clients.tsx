import { useState } from 'react';
import { Bar, Button, Icon, PageHead } from '../components/ui';
import {
  CLIENTS, MONEY, MONEY_EXACT, bookTotals, healthBand, type Client
} from '../lib/clients';

/**
 * Two views of the same relationship, switched at the top.
 *
 * "The book" is what a partner needs: which clients are quietly leaving and
 * what the evidence is. "What the client sees" is the other document built
 * from the same file — their portfolio in their language, what it costs, and
 * what is waiting on them with the price of waiting attached.
 */
export function Clients() {
  const [id, setId] = useState(CLIENTS[0]!.id);
  const [side, setSide] = useState<'book' | 'client'>('book');
  const c = CLIENTS.find(x => x.id === id)!;
  const t = bookTotals();

  return (
    <>
      <PageHead
        title="Clients"
        sub="The book from the firm's side, and the same file as the client sees it."
        action={
          <div className="cl-toggle">
            <button className={side === 'book' ? 'is-on' : ''} onClick={() => setSide('book')}>The book</button>
            <button className={side === 'client' ? 'is-on' : ''} onClick={() => setSide('client')}>What the client sees</button>
          </div>
        }
      />

      {side === 'book' && (
        <div className="grid-4" style={{ marginBottom: 18 }}>
          {[
            { l: 'Billed year to date', n: MONEY(t.billed), c: 'var(--text-head)' },
            { l: 'Committed, not yet billed', n: MONEY(t.committed), c: 'var(--accent-300)' },
            { l: 'Revenue in at-risk accounts', n: MONEY(t.atRisk), c: 'var(--alert)' },
            { l: 'Decisions waiting on clients', n: String(t.waiting), c: 'var(--warn)' }
          ].map(x => (
            <div className="card" key={x.l}>
              <div className="label">{x.l}</div>
              <div className="mono" style={{ fontSize: 24, color: x.c, marginTop: 7, fontWeight: 600 }}>{x.n}</div>
            </div>
          ))}
        </div>
      )}

      <div className="cl-split">
        <div className="cl-rail">
          {CLIENTS.map(x => {
            const b = healthBand(x.health);
            return (
              <button key={x.id} className={`cl-pick${x.id === id ? ' is-on' : ''}`} onClick={() => setId(x.id)}>
                <div>
                  <div className="cl-pick-name">{x.name}</div>
                  <div className="small muted">{x.sector} · client since {x.since}</div>
                </div>
                <span className={`cl-band cl-${b.tone}`}>{x.health}</span>
              </button>
            );
          })}
        </div>

        <div className="cl-main">
          {side === 'book' ? <BookView c={c} /> : <ClientView c={c} />}
        </div>
      </div>

      <p className="small muted" style={{ marginTop: 20 }}>
        Demonstration dataset — no client, contact, matter or figure in this build is real.
      </p>
    </>
  );
}

/* ── The firm's view ────────────────────────────────────────────────────── */

function BookView({ c }: { c: Client }) {
  const b = healthBand(c.health);
  const total = c.signals.reduce((s, x) => s + x.weight, 0) || 1;
  const forUs = Math.round(
    (c.signals.filter(x => x.direction === 'good').reduce((s, x) => s + x.weight, 0) / total) * 100
  );
  const against = 100 - forUs;
  return (
    <>
      <div className="cl-head">
        <div>
          <h2 className="bd-h2" style={{ margin: 0 }}>{c.name}</h2>
          <div className="small muted">
            {c.contact.name} · {c.contact.role} · {c.contact.email}
          </div>
        </div>
        <div className={`cl-health cl-${b.tone}`}>
          <span className="num">{c.health}</span>
          <span className="label">{b.label}</span>
        </div>
      </div>

      <div className="cl-figs">
        <div><span className="label">Billed YTD</span><b>{MONEY_EXACT(c.billedYtd)}</b></div>
        <div><span className="label">Committed</span><b>{MONEY_EXACT(c.committed)}</b></div>
        <div><span className="label">Matters</span><b>{c.matters}</b></div>
        <div><span className="label">At risk</span><b style={{ color: c.atRisk ? 'var(--warn)' : undefined }}>{c.atRisk}</b></div>
      </div>

      <p className="cl-note">{c.note}</p>

      <span className="label">What the read is built on</span>
      <p className="small muted" style={{ margin: '4px 0 10px' }}>
        {c.health} is not a judgement typed into the file. It is the weights below, pulled for
        and against and centred on 50 — {against}% of the evidence points away from us,
        {' '}{forUs}% towards. Argue with the rows, not the number.
      </p>
      <div className="cl-signals">
        {[...c.signals].sort((a, z) => z.weight - a.weight).map(s => (
          <div className={`cl-signal cl-${s.direction}`} key={s.label}>
            <div className="cl-signal-w">
              <span className="num">{Math.round(s.weight * 100)}</span>
              <Bar pct={s.weight * 100} color={s.direction === 'bad' ? 'var(--alert)' : 'var(--accent-500)'} />
            </div>
            <div>
              <div className="cl-signal-label">
                {s.label}
                <span className={`cl-dir cl-${s.direction}`}>{s.direction === 'bad' ? 'against' : 'for'}</span>
              </div>
              <p className="small">{s.detail}</p>
              <span className="small muted">observed {s.observed}</span>
            </div>
          </div>
        ))}
      </div>

      {c.decisions.length > 0 && (
        <>
          <span className="label" style={{ display: 'block', marginTop: 22 }}>
            Waiting on them — and how long it has been
          </span>
          <div className="cl-waits">
            {c.decisions.map(d => (
              <div className="cl-wait" key={d.matter}>
                <span className="id">{d.matter}</span>
                <div>
                  <div className="cl-wait-q">{d.question}</div>
                  <div className="small muted">due {d.due}</div>
                </div>
                <span className={`cl-days${d.waitingDays >= 14 ? ' is-long' : ''}`}>{d.waitingDays}d</span>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

/* ── The client's view ──────────────────────────────────────────────────── */

function ClientView({ c }: { c: Client }) {
  const spend = c.holdings.reduce((s, h) => s + h.spend, 0);
  const committed = c.holdings.reduce((s, h) => s + h.committed, 0);

  return (
    <>
      <div className="cl-clienthead">
        <div>
          <h2 className="bd-h2" style={{ margin: 0 }}>Your portfolio</h2>
          <p className="small muted" style={{ margin: '4px 0 0' }}>
            What you own, what it is costing, and what is waiting on you. Written for you rather
            than for the file.
          </p>
        </div>
        <Button variant="ghost" icon="database">Download as PDF</Button>
      </div>

      <div className="cl-figs">
        <div><span className="label">Protected or pending</span><b>{c.holdings.length}</b></div>
        <div><span className="label">Spent to date</span><b>{MONEY_EXACT(spend)}</b></div>
        <div><span className="label">Committed next</span><b>{MONEY_EXACT(committed)}</b></div>
        <div><span className="label">Waiting on you</span>
          <b style={{ color: c.decisions.length ? 'var(--warn)' : undefined }}>{c.decisions.length}</b>
        </div>
      </div>

      {c.decisions.length > 0 && (
        <div className="cl-decisions">
          <div className="cl-dec-head">
            <Icon name="alert" size={16} />
            <span className="label">These are waiting on you</span>
          </div>
          {c.decisions.map(d => (
            <div className="cl-decision" key={d.matter}>
              <div className="cl-dec-q">{d.question}</div>
              <p className="cl-dec-opts">{d.options}</p>
              <div className="cl-dec-foot">
                <span><span className="label">By</span> {d.due}</span>
                <span className="cl-dec-cost"><span className="label">If it waits</span> {d.costOfDelay}</span>
              </div>
              <div className="row" style={{ marginTop: 12, gap: 8 }}>
                <Button size="sm">Choose</Button>
                <Button size="sm" variant="ghost">Ask a question</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <span className="label" style={{ display: 'block', marginTop: 22 }}>What you own</span>
      <div className="cl-holdings">
        {c.holdings.map(h => (
          <div className="cl-holding" key={h.matter}>
            <div className="cl-hold-top">
              <span className="id">{h.matter}</span>
              <span className={`cl-stage cl-stage-${h.stage.toLowerCase().replace(' ', '-')}`}>{h.stage}</span>
              {h.appNo && <span className="small muted">Application {h.appNo}</span>}
            </div>
            <p className="cl-protects">{h.protects}</p>
            <div className="cl-hold-foot">
              <span><span className="label">Next</span> {h.next} — {h.nextBy}</span>
              <span><span className="label">Spent</span> {MONEY_EXACT(h.spend)}</span>
              {h.committed > 0 && <span><span className="label">Committed</span> {MONEY_EXACT(h.committed)}</span>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

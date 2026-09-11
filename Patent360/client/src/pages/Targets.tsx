import { useState } from 'react';
import { Link } from 'wouter';
import { Bar, Button, Icon, PageHead, Table, Tabs } from '../components/ui';
import { COMPANIES, MONEY, MORE_TARGETS, pipeline } from '../lib/bd';

const TABS = ['All', 'No incumbent', 'Incumbent vulnerable', 'Warm path'];

export function Targets() {
  const [tab, setTab] = useState('All');
  const p = pipeline();

  const rows = [
    ...COMPANIES.map(c => ({
      rank: c.rank, id: c.id, name: c.name, sector: c.sector, hq: c.hq,
      fit: c.fit, rev: c.revenue.base, pending: c.portfolio.pending,
      incumbent: c.incumbent, signal: c.signals[0]!.label, next: c.approach[0]!.who, deep: true
    })),
    ...MORE_TARGETS.map(t => ({
      rank: t.rank, id: t.id, name: t.name, sector: t.sector, hq: t.hq,
      fit: t.fit, rev: t.revenueBase, pending: t.pending,
      incumbent: t.incumbent, signal: t.topSignal, next: t.nextStep, deep: false
    }))
  ].filter(r => {
    if (tab === 'No incumbent') return r.incumbent === null || /in-house|pro se/i.test(r.incumbent);
    if (tab === 'Incumbent vulnerable') return !!r.incumbent && /retired|years/i.test(r.incumbent);
    if (tab === 'Warm path') return /shares|sits on|same playbook/i.test(r.signal);
    return true;
  });

  return (
    <>
      <PageHead
        title="Targets"
        sub="Every company the firm could be prosecuting for, ranked by what it is worth and how reachable it is. Open one to see who actually decides."
        action={
          <div className="row">
            <Button variant="ghost" icon="database">Export list</Button>
            <Button icon="arrow">Rescore now</Button>
          </div>
        }
      />

      <div className="bd-topline">
        <div className="bd-topline-fig">
          <span className="label">Modelled annual pipeline</span>
          <strong>{MONEY(p.base)}</strong>
          <span className="small muted">
            {MONEY(p.low)} – {MONEY(p.high)} across {p.shown} scored targets
          </span>
        </div>
        <div className="bd-topline-note">
          Revenue is modelled from filing run-rate in the public assignment record, not from a
          survey or a guess. Every figure on the next screen carries the source it came from.
        </div>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <div style={{ height: 18 }} />

      <Table head={['#', 'Company', 'Sector', 'Fit', 'Annual value', 'Pending', 'Incumbent', 'Strongest signal', '']}>
        {rows.map(r => (
          <tr key={r.id}>
            <td className="id">{String(r.rank).padStart(2, '0')}</td>
            <td style={{ color: 'var(--text-head)', fontWeight: 600 }}>
              {r.name}
              <div className="small muted" style={{ fontWeight: 400 }}>{r.hq}</div>
            </td>
            <td className="muted">{r.sector}</td>
            <td style={{ minWidth: 92 }}>
              <div className="row" style={{ gap: 8 }}>
                <span className="num" style={{ color: 'var(--text-head)' }}>{r.fit}</span>
                <Bar pct={r.fit} />
              </div>
            </td>
            <td className="num" style={{ color: 'var(--accent-300)' }}>{MONEY(r.rev)}</td>
            <td className="num">{r.pending}</td>
            <td className="muted">{r.incumbent ?? <span style={{ color: 'var(--accent-300)' }}>None of record</span>}</td>
            <td className="small" style={{ maxWidth: 320 }}>{r.signal}</td>
            <td>
              {r.deep
                ? <Link href={`/app/targets/${r.id}`}><a className="bd-open">Open <Icon name="arrow" size={13} /></a></Link>
                : <span className="small muted">Builds on open</span>}
            </td>
          </tr>
        ))}
      </Table>

      <p className="small muted" style={{ marginTop: 12 }}>
        {rows.length} of {p.shown} shown. Demonstration dataset — no company, person, number or
        email in this build is real. In production the scorer runs against the firm's whole
        addressable set and surfaces the top hundred each week.
      </p>
    </>
  );
}

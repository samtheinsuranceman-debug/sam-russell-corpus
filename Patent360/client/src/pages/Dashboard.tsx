import { Bar, Icon, PageHead, Stat, StatusPill, Table } from '../components/ui';
import { DEADLINES, MATTERS } from '../lib/demo';

export function Dashboard() {
  const soon = DEADLINES.slice(0, 4);
  return (
    <>
      <PageHead
        title="Dashboard"
        sub="Everything moving through the firm right now. Demonstration data."
      />

      <div className="grid-4" style={{ marginBottom: 16 }}>
        <Stat label="Active matters" value="42" delta="+3 this month" note="Across 11 clients" />
        <Stat label="Awaiting attorney" value="7" tone="alert" delta="2 over 48 hours" note="Queued for review" />
        <Stat label="Statutory dates ≤30d" value="5" tone="seal" delta="None at risk" note="All assigned" />
        <Stat label="Filed this quarter" value="18" delta="+4 on last quarter" note="14 non-provisional" />
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="spread" style={{ marginBottom: 14 }}>
            <span className="label">Pipeline by stage</span>
            <span className="small muted">42 matters</span>
          </div>
          {[
            { s: 'Intake', n: 6, pct: 14, c: 'var(--accent-300)' },
            { s: 'Drafting', n: 9, pct: 21, c: 'var(--accent-500)' },
            { s: 'In review', n: 4, pct: 10, c: 'var(--accent-400)' },
            { s: 'Filed, awaiting action', n: 14, pct: 33, c: 'var(--signal)' },
            { s: 'Office action open', n: 6, pct: 14, c: 'var(--warn)' },
            { s: 'Allowed or granted', n: 3, pct: 8, c: 'var(--seal)' }
          ].map(r => (
            <div key={r.s} style={{ marginBottom: 13 }}>
              <div className="spread small" style={{ marginBottom: 5 }}>
                <span>{r.s}</span>
                <span className="mono muted">{r.n}</span>
              </div>
              <Bar pct={r.pct * 3} color={r.c} />
            </div>
          ))}
        </div>

        <div className="card">
          <div className="spread" style={{ marginBottom: 14 }}>
            <span className="label">Next dates</span>
            <span className="small" style={{ color: 'var(--warn)' }}>4 inside 20 days</span>
          </div>
          {soon.map(d => (
            <div key={d.docket + d.date} className="spread" style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <div className="small" style={{ color: 'var(--text-head)', fontWeight: 600 }}>{d.what}</div>
                <div className="small muted mono">{d.docket} · {d.date}</div>
              </div>
              <span className="pill" style={{
                color: d.days <= 7 ? 'var(--alert)' : d.days <= 21 ? 'var(--warn)' : 'var(--text-muted)',
                borderColor: d.days <= 7 ? 'rgba(239,68,68,0.35)' : 'rgba(245,158,11,0.35)'
              }}>
                {d.days}d
              </span>
            </div>
          ))}
          <div className="row" style={{ marginTop: 14, color: 'var(--text-muted)', gap: 7 }}>
            <Icon name="clock" size={14} /><span className="small">Every date recomputed from the filing receipt.</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 22 }}>
        <div className="spread" style={{ marginBottom: 12 }}>
          <span className="label">Recently touched</span>
          <span className="small muted">Showing 5 of 42</span>
        </div>
        <Table head={['Docket', 'Application', 'Title', 'Client', 'Status', 'Next step', 'Days']}>
          {MATTERS.slice(0, 5).map(m => (
            <tr key={m.docket}>
              <td className="id">{m.docket}</td>
              <td className="id">{m.appNo}</td>
              <td style={{ color: 'var(--text-head)' }}>{m.title}</td>
              <td>{m.client}</td>
              <td><StatusPill status={m.status} /></td>
              <td className="muted">{m.next}</td>
              <td className="num">{m.days || '—'}</td>
            </tr>
          ))}
        </Table>
      </div>
    </>
  );
}

import { Button, Icon, PageHead, Table } from '../components/ui';
import { DEADLINES } from '../lib/demo';
import { downloadIcs } from '../lib/actions';

export function Deadlines() {
  return (
    <>
      <PageHead
        title="Deadlines"
        sub="Computed from the filing receipt, not typed in by hand."
        action={
          <Button
            variant="ghost"
            icon="clock"
            onClick={() => downloadIcs('patent360-docket.ics', 'Patent360 docket',
              DEADLINES.map(d => ({
                date: d.date,
                uid: `deadline-${d.docket}-${d.date}`,
                title: `${d.docket} — ${d.what}${d.statutory ? ' (statutory)' : ''}`,
                description: `Owner: ${d.who}. ${d.statutory
                  ? 'Statutory date: it cannot be extended.'
                  : 'Internal date, set to leave room before the statutory one.'}`
              })))}
          >
            Subscribe to calendar
          </Button>
        }
      />

      <div className="grid-4" style={{ marginBottom: 18 }}>
        {[
          { l: 'Inside 7 days', n: '2', c: 'var(--alert)' },
          { l: 'Inside 30 days', n: '5', c: 'var(--warn)' },
          { l: 'Statutory', n: '3', c: 'var(--seal)' },
          { l: 'Unassigned', n: '0', c: 'var(--signal)' }
        ].map(x => (
          <div className="card" key={x.l}>
            <div className="label">{x.l}</div>
            <div className="mono" style={{ fontSize: 28, color: x.c, marginTop: 6, fontWeight: 600 }}>{x.n}</div>
          </div>
        ))}
      </div>

      <Table head={['Due', 'In', 'Docket', 'What is due', 'Owner', 'Kind']}>
        {DEADLINES.map(d => (
          <tr key={d.docket + d.date}>
            <td className="id">{d.date}</td>
            <td className="num" style={{ color: d.days <= 7 ? 'var(--alert)' : d.days <= 30 ? 'var(--warn)' : 'var(--text-body)' }}>
              {d.days}d
            </td>
            <td className="id">{d.docket}</td>
            <td style={{ color: 'var(--text-head)' }}>{d.what}</td>
            <td className="muted">{d.who}</td>
            <td>
              <span className="pill" style={{
                color: d.statutory ? 'var(--seal)' : 'var(--text-muted)',
                borderColor: d.statutory ? 'rgba(240,192,64,0.35)' : 'var(--line-mid)'
              }}>
                <span className="pill-dot" style={{ background: d.statutory ? 'var(--seal)' : 'var(--text-muted)' }} />
                {d.statutory ? 'Statutory' : 'Firm'}
              </span>
            </td>
          </tr>
        ))}
      </Table>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="row" style={{ gap: 10, color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--signal)' }}><Icon name="shield" size={16} /></span>
          <span className="small">
            A statutory date cannot be edited or deleted, only extended by a recorded petition. Every change is written to the audit log with the user who made it.
          </span>
        </div>
      </div>
    </>
  );
}

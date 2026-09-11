import { useState } from 'react';
import { Bar, Button, PageHead, Stat, Tabs } from '../components/ui';

const TABS = ['Throughput', 'Attorney time', 'Predictability', 'Revenue'];

export function Reports() {
  const [tab, setTab] = useState('Throughput');
  return (
    <>
      <PageHead
        title="Reports"
        sub="Measured from what happened in the system, not from timesheets typed at the end of the week."
        action={<Button variant="ghost" icon="database">Export CSV</Button>}
      />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <div style={{ height: 18 }} />

      <div className="grid-4" style={{ marginBottom: 16 }}>
        <Stat label="Filings this quarter" value="18" delta="+4 on last quarter" note="Demonstration data" />
        <Stat label="Median intake to filing" value="34" unit="days" delta="−6 days" note="Non-provisional" />
        <Stat label="Attorney hours per filing" value="9.4" unit="h" delta="−2.1 h" note="System-measured" />
        <Stat label="Dates missed" value="0" tone="signal" delta="12 quarters" note="Statutory" />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="label" style={{ marginBottom: 14 }}>Where the attorney hour goes</div>
          {[
            { s: 'Claim strategy and review', pct: 46, c: 'var(--accent-500)' },
            { s: 'Client conversation', pct: 22, c: 'var(--accent-300)' },
            { s: 'Office-action argument', pct: 18, c: 'var(--warn)' },
            { s: 'Assembly and formatting', pct: 8, c: 'var(--text-muted)' },
            { s: 'Chasing missing information', pct: 6, c: 'var(--alert)' }
          ].map(r => (
            <div key={r.s} style={{ marginBottom: 13 }}>
              <div className="spread small" style={{ marginBottom: 5 }}>
                <span>{r.s}</span><span className="mono muted">{r.pct}%</span>
              </div>
              <Bar pct={r.pct} color={r.c} />
            </div>
          ))}
          <p className="small muted" style={{ marginTop: 10 }}>
            The bottom two lines are the ones the system is built to shrink.
          </p>
        </div>

        <div className="card">
          <div className="label" style={{ marginBottom: 14 }}>Cycle time by stage, median days</div>
          {[
            { s: 'Disclosure to engagement', d: 3, w: 8 },
            { s: 'Engagement to first draft', d: 12, w: 32 },
            { s: 'Draft to attorney sign-off', d: 7, w: 19 },
            { s: 'Sign-off to filing', d: 2, w: 6 },
            { s: 'Filing to first action', d: 142, w: 100 }
          ].map(r => (
            <div key={r.s} style={{ marginBottom: 13 }}>
              <div className="spread small" style={{ marginBottom: 5 }}>
                <span>{r.s}</span><span className="mono muted">{r.d}d</span>
              </div>
              <Bar pct={r.w} color={r.w > 80 ? 'var(--text-muted)' : 'var(--accent-500)'} />
            </div>
          ))}
          <p className="small muted" style={{ marginTop: 10 }}>
            The last line belongs to the patent office. Everything above it belongs to the firm.
          </p>
        </div>
      </div>

      <p className="small muted" style={{ marginTop: 14 }}>
        Demonstration figures for the design build. A live deployment computes every one of these from its own event log.
      </p>
    </>
  );
}

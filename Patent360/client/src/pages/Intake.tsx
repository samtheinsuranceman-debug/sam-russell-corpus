import { useState } from 'react';
import { Bar, Button, Icon, PageHead, Stat, Tabs } from '../components/ui';

/** Demonstration intake queue. Invented names only. */
const QUEUE = [
  {
    id: 'IN-1041',
    client: 'Halden Instruments',
    title: 'Low-latency mesh relay for field sensors',
    inventor: 'L. Voss',
    opened: '2026-09-08',
    complete: 82,
    waiting: 'Engagement letter',
    owner: 'P. Raman'
  },
  {
    id: 'IN-1044',
    client: 'Palewood Bio',
    title: 'Enzymatic assay cartridge with dry reagent',
    inventor: 'S. Cho',
    opened: '2026-09-09',
    complete: 64,
    waiting: 'Conflict check',
    owner: 'P. Raman'
  },
  {
    id: 'IN-1047',
    client: 'Cedar Ridge Ag',
    title: 'Canopy sensor with solar trickle charge',
    inventor: 'R. Hale',
    opened: '2026-09-10',
    complete: 41,
    waiting: 'Disclosure questionnaire',
    owner: 'D. Cole'
  },
  {
    id: 'IN-1050',
    client: 'Nordhaven Energy',
    title: 'Module interconnect with strain relief',
    inventor: 'E. Brandt',
    opened: '2026-09-11',
    complete: 18,
    waiting: 'Inventor list',
    owner: 'P. Raman'
  },
  {
    id: 'IN-1033',
    client: 'Ashford Water',
    title: 'Hydrant cap with acoustic tap',
    inventor: 'M. Quill',
    opened: '2026-09-04',
    complete: 100,
    waiting: 'Ready for attorney',
    owner: 'A. Reyes'
  },
  {
    id: 'IN-1028',
    client: 'Meridian Logistics',
    title: 'Seal with dual-state dye',
    inventor: 'T. Nunez',
    opened: '2026-09-02',
    complete: 100,
    waiting: 'Opened as BL-2298-US',
    owner: 'M. Okafor'
  }
];

const GATES = [
  'Disclosure questionnaire by technology area',
  'Conflict check against the client and inventor list',
  'Engagement letter and retainer collected',
  'Nothing reaches an attorney until the file is complete'
];

const TABS = ['Open', 'Waiting on client', 'Ready for attorney', 'Opened as matter'];

export function Intake() {
  const [tab, setTab] = useState('Open');
  const rows = QUEUE.filter(r => {
    if (tab === 'Open') return r.complete < 100;
    if (tab === 'Waiting on client') return r.complete < 100 && r.waiting !== 'Ready for attorney';
    if (tab === 'Ready for attorney') return r.waiting === 'Ready for attorney';
    return r.waiting.startsWith('Opened');
  });

  return (
    <>
      <PageHead
        title="Intake"
        sub="One guided path from invention disclosure to signed engagement. Demonstration data."
        action={<Button icon="inbox">New disclosure</Button>}
      />

      <div className="grid-4" style={{ marginBottom: 18 }}>
        <Stat label="Open intakes" value="4" note="Across 4 clients" />
        <Stat label="Waiting on client" value="3" tone="seal" note="Nothing is stalled inside the firm" />
        <Stat label="Ready for attorney" value="1" tone="alert" delta="Complete, unopened" />
        <Stat label="Opened this week" value="1" note="Became a matter" />
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="label" style={{ marginBottom: 12 }}>The file does not move until every gate is closed</div>
        <div className="grid-2">
          {GATES.map((g, i) => (
            <div className="row" key={g} style={{ gap: 10, alignItems: 'flex-start' }}>
              <span className="mono muted" style={{ minWidth: 28 }}>0{i + 1}</span>
              <span className="small">{g}</span>
            </div>
          ))}
        </div>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <div style={{ height: 16 }} />

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {rows.map(r => (
          <div
            key={r.id}
            className="spread"
            style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)', alignItems: 'center', gap: 18 }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="row" style={{ gap: 10, marginBottom: 4 }}>
                <span className="mono small" style={{ color: 'var(--accent-400)' }}>{r.id}</span>
                <span className="small muted">{r.client}</span>
              </div>
              <div style={{ color: 'var(--text-head)', fontWeight: 600 }}>{r.title}</div>
              <div className="small muted" style={{ marginTop: 4 }}>
                Inventor {r.inventor} · opened {r.opened} · {r.owner}
              </div>
            </div>
            <div style={{ width: 180 }}>
              <div className="spread small" style={{ marginBottom: 6 }}>
                <span className="muted">Complete</span>
                <span className="mono">{r.complete}%</span>
              </div>
              <Bar pct={r.complete} color={r.complete === 100 ? 'var(--signal)' : 'var(--accent-500)'} />
              <div className="small muted" style={{ marginTop: 6 }}>{r.waiting}</div>
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="muted small" style={{ padding: 24 }}>Nothing in this lane.</div>
        )}
      </div>

      <p className="small muted" style={{ marginTop: 12 }}>
        <Icon name="lock" size={13} /> A disclosure does not become a matter until every gate is closed. Demonstration data only.
      </p>
    </>
  );
}

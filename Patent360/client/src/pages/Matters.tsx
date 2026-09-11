import { useState } from 'react';
import { Button, PageHead, StatusPill, Table, Tabs } from '../components/ui';
import { MATTERS } from '../lib/demo';

const TABS = ['All', 'Drafting', 'Filed', 'Office action', 'Granted', 'Closed'];

export function Matters() {
  const [tab, setTab] = useState('All');
  const rows = MATTERS.filter(m => {
    if (tab === 'All') return true;
    if (tab === 'Closed') return m.status === 'abandoned';
    if (tab === 'Drafting') return m.status === 'drafting' || m.status === 'review';
    return m.status === tab.toLowerCase().replace(' ', '-');
  });

  return (
    <>
      <PageHead
        title="Matters"
        sub="Every file the firm is carrying, with the one thing each is waiting on."
        action={<div className="row"><Button variant="ghost" icon="database">Export</Button><Button icon="inbox">New matter</Button></div>}
      />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <div style={{ height: 18 }} />
      <Table head={['Docket', 'Application', 'Title', 'Client', 'Attorney', 'CPC', 'Status', 'Next step', 'Days']}>
        {rows.map(m => (
          <tr key={m.docket}>
            <td className="id">{m.docket}</td>
            <td className="id">{m.appNo}</td>
            <td style={{ color: 'var(--text-head)' }}>{m.title}</td>
            <td>{m.client}</td>
            <td className="muted">{m.attorney}</td>
            <td className="id">{m.cpc}</td>
            <td><StatusPill status={m.status} /></td>
            <td className="muted">{m.next}</td>
            <td className="num">{m.days || '—'}</td>
          </tr>
        ))}
      </Table>
      <p className="small muted" style={{ marginTop: 12 }}>
        {rows.length} of {MATTERS.length} matters. Demonstration data: no name, number or application here is real.
      </p>
    </>
  );
}

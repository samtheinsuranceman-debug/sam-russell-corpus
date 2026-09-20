import { useEffect, useMemo, useState } from 'react';
import { Button, PageHead, StatusPill, Table, Tabs } from '../components/ui';
import { downloadCsv, notify } from '../lib/actions';
import { createMatter, deleteMatter, listMatters, updateMatter, type MatterRecord, type MatterStatus } from '../lib/operations';

const TABS = ['All', 'Drafting', 'Filed', 'Office action', 'Granted', 'Closed'];
const TAB_STATUS: Record<string, MatterStatus[] | 'all'> = {
  All: 'all',
  Drafting: ['drafting', 'review'],
  Filed: ['filed'],
  'Office action': ['office-action'],
  Granted: ['granted'],
  Closed: ['abandoned']
};

const EMPTY_MATTER: Omit<MatterRecord, 'id' | 'created_at' | 'updated_at'> = {
  docket: '',
  application_number: null,
  title: '',
  client: '',
  status: 'drafting',
  attorney: '',
  cpc: null,
  next_step: null
};

export function Matters() {
  const [tab, setTab] = useState('All');
  const [matters, setMatters] = useState<MatterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(EMPTY_MATTER);

  async function refresh() {
    setLoading(true);
    setError('');
    try {
      const items = await listMatters();
      setMatters(items);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const rows = useMemo(() => matters.filter(m => {
    const statuses = TAB_STATUS[tab] ?? 'all';
    if (statuses === 'all') return true;
    return statuses.includes(m.status);
  }), [matters, tab]);

  async function create() {
    if (saving) return;
    setSaving(true);
    try {
      const created = await createMatter(draft);
      setMatters(curr => [created, ...curr]);
      setDraft(EMPTY_MATTER);
      notify('done', 'Matter created', `${created.docket} saved to your operational record.`);
    } catch (err) {
      notify('blocked', 'Matter was not created', String(err));
    } finally {
      setSaving(false);
    }
  }

  async function closeMatter(m: MatterRecord) {
    try {
      const updated = await updateMatter(m.id, {
        docket: m.docket,
        application_number: m.application_number,
        title: m.title,
        client: m.client,
        status: 'abandoned' as MatterStatus,
        attorney: m.attorney,
        cpc: m.cpc,
        next_step: m.next_step
      });
      setMatters(curr => curr.map(x => x.id === m.id ? updated : x));
      notify('done', 'Matter updated', `${m.docket} marked abandoned.`);
    } catch (err) {
      notify('blocked', 'Matter update failed', String(err));
    }
  }

  async function removeMatter(m: MatterRecord) {
    if (!window.confirm(`Delete ${m.docket}? This also removes its deadlines.`)) return;
    try {
      await deleteMatter(m.id);
      setMatters(curr => curr.filter(x => x.id !== m.id));
      notify('done', 'Matter deleted', `${m.docket} removed.`);
    } catch (err) {
      notify('blocked', 'Matter delete failed', String(err));
    }
  }

  return (
    <>
      <PageHead
        title="Matters"
        sub="Every file the firm is carrying, with the one thing each is waiting on."
        action={
          <Button
            variant="ghost"
            icon="database"
            onClick={() => downloadCsv(
              `patent360-matters-${new Date().toISOString().slice(0, 10)}.csv`,
              ['Docket', 'Title', 'Client', 'Application', 'Status', 'Attorney', 'Next step'],
              matters.map(m => [m.docket, m.title, m.client, m.application_number ?? 'Not yet filed', m.status, m.attorney, m.next_step ?? ''])
            )}
          >
            Export
          </Button>
        }
      />

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="label" style={{ marginBottom: 10 }}>New matter</div>
        <form className="row" onSubmit={(e) => { e.preventDefault(); create(); }}>
          <div className="field" style={{ minWidth: 170, marginBottom: 0 }}>
            <label htmlFor="matter-docket" className="small muted">Docket</label>
            <input id="matter-docket" placeholder="Docket" value={draft.docket} onChange={e => setDraft(d => ({ ...d, docket: e.target.value }))} />
          </div>
          <div className="field" style={{ minWidth: 240, marginBottom: 0 }}>
            <label htmlFor="matter-title" className="small muted">Title</label>
            <input id="matter-title" placeholder="Title" value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} />
          </div>
          <div className="field" style={{ minWidth: 170, marginBottom: 0 }}>
            <label htmlFor="matter-client" className="small muted">Client</label>
            <input id="matter-client" placeholder="Client" value={draft.client} onChange={e => setDraft(d => ({ ...d, client: e.target.value }))} />
          </div>
          <div className="field" style={{ minWidth: 150, marginBottom: 0 }}>
            <label htmlFor="matter-attorney" className="small muted">Attorney</label>
            <input id="matter-attorney" placeholder="Attorney" value={draft.attorney} onChange={e => setDraft(d => ({ ...d, attorney: e.target.value }))} />
          </div>
          <div className="field" style={{ minWidth: 150, marginBottom: 0 }}>
            <label htmlFor="matter-status" className="small muted">Status</label>
            <select id="matter-status" value={draft.status} onChange={e => setDraft(d => ({ ...d, status: e.target.value as MatterStatus }))}>
              <option value="drafting">Drafting</option>
              <option value="review">In review</option>
              <option value="filed">Filed</option>
              <option value="office-action">Office action</option>
              <option value="granted">Granted</option>
              <option value="abandoned">Abandoned</option>
            </select>
          </div>
          <Button type="submit" icon="inbox">{saving ? 'Saving…' : 'Save matter'}</Button>
        </form>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <div style={{ height: 18 }} />

      {loading && <p className="small muted">Loading matters…</p>}
      {!loading && error && <div className="auth-note auth-note-error" role="alert"><span>{error}</span></div>}
      {!loading && !error && rows.length === 0 && <p className="small muted">No matters yet. Add one above to begin.</p>}

      {!loading && !error && rows.length > 0 && (
        <Table head={['Docket', 'Application', 'Title', 'Client', 'Attorney', 'CPC', 'Status', 'Next step', 'Actions']}>
          {rows.map(m => (
            <tr key={m.id}>
              <td className="id">{m.docket}</td>
              <td className="id">{m.application_number ?? '—'}</td>
              <td style={{ color: 'var(--text-head)' }}>{m.title}</td>
              <td>{m.client}</td>
              <td className="muted">{m.attorney}</td>
              <td className="id">{m.cpc ?? '—'}</td>
              <td><StatusPill status={m.status} /></td>
              <td className="muted">{m.next_step ?? '—'}</td>
              <td>
                <div className="row" style={{ gap: 6 }}>
                  {m.status !== 'abandoned' && <Button variant="ghost" size="sm" onClick={() => closeMatter(m)}>Abandon</Button>}
                  <Button variant="ghost" size="sm" onClick={() => removeMatter(m)}>Delete</Button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      <p className="small muted" style={{ marginTop: 12 }}>
        {rows.length} of {matters.length} matters.
      </p>
    </>
  );
}

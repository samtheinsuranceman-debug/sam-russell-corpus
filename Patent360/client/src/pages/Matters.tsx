import { useEffect, useMemo, useState } from 'react';
import { Button, PageHead, StatusPill, Table, Tabs } from '../components/ui';
import { downloadCsv, notify } from '../lib/actions';
import { createMatter, deleteMatter, listMatters, updateMatter, type MatterRecord, type MatterStatus } from '../lib/operations';

const TABS = ['All', 'Drafting', 'Filed', 'Office action', 'Granted', 'Closed'];

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

function daysUntil(dateText: string | null): string {
  if (!dateText) return '—';
  const due = new Date(`${dateText}T00:00:00Z`);
  if (Number.isNaN(due.valueOf())) return '—';
  const today = new Date();
  const midnight = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return String(Math.ceil((due.getTime() - midnight) / 86400000));
}

function firstDateWord(text: string | null): string | null {
  if (!text) return null;
  const m = text.match(/\b\d{4}-\d{2}-\d{2}\b/);
  return m ? m[0] : null;
}

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
    if (tab === 'All') return true;
    if (tab === 'Closed') return m.status === 'abandoned';
    if (tab === 'Drafting') return m.status === 'drafting' || m.status === 'review';
    return m.status === tab.toLowerCase().replace(' ', '-');
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
        <div className="row">
          <div className="field" style={{ minWidth: 170, marginBottom: 0 }}><input placeholder="Docket" value={draft.docket} onChange={e => setDraft(d => ({ ...d, docket: e.target.value }))} /></div>
          <div className="field" style={{ minWidth: 240, marginBottom: 0 }}><input placeholder="Title" value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} /></div>
          <div className="field" style={{ minWidth: 170, marginBottom: 0 }}><input placeholder="Client" value={draft.client} onChange={e => setDraft(d => ({ ...d, client: e.target.value }))} /></div>
          <div className="field" style={{ minWidth: 150, marginBottom: 0 }}><input placeholder="Attorney" value={draft.attorney} onChange={e => setDraft(d => ({ ...d, attorney: e.target.value }))} /></div>
          <div className="field" style={{ minWidth: 150, marginBottom: 0 }}>
            <select value={draft.status} onChange={e => setDraft(d => ({ ...d, status: e.target.value as MatterStatus }))}>
              <option value="drafting">Drafting</option>
              <option value="review">In review</option>
              <option value="filed">Filed</option>
              <option value="office-action">Office action</option>
              <option value="granted">Granted</option>
              <option value="abandoned">Abandoned</option>
            </select>
          </div>
          <Button icon="inbox" onClick={create}>{saving ? 'Saving…' : 'Save matter'}</Button>
        </div>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <div style={{ height: 18 }} />

      {loading && <p className="small muted">Loading matters…</p>}
      {!loading && error && <div className="auth-note auth-note-error" role="alert"><span>{error}</span></div>}
      {!loading && !error && rows.length === 0 && <p className="small muted">No matters yet. Add one above to begin.</p>}

      {!loading && !error && rows.length > 0 && (
        <Table head={['Docket', 'Application', 'Title', 'Client', 'Attorney', 'CPC', 'Status', 'Next step', 'Days', 'Actions']}>
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
              <td className="num">{daysUntil(firstDateWord(m.next_step))}</td>
              <td>
                <div className="row" style={{ gap: 6 }}>
                  {m.status !== 'abandoned' && <Button variant="ghost" size="sm" onClick={() => closeMatter(m)}>Close</Button>}
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

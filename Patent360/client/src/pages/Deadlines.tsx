import { useEffect, useMemo, useState } from 'react';
import { Button, Icon, PageHead, Table } from '../components/ui';
import { downloadIcs, notify } from '../lib/actions';
import {
  createDeadline,
  deleteDeadline,
  listDeadlines,
  listMatters,
  updateDeadline,
  type DeadlineRecord,
  type DeadlineStatus,
  type MatterRecord
} from '../lib/operations';

function toYmd(value: string): string {
  return value.slice(0, 10);
}

function daysUntil(dateText: string): number {
  const due = new Date(`${toYmd(dateText)}T00:00:00Z`);
  const today = new Date();
  const midnight = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.ceil((due.getTime() - midnight) / 86400000);
}

function sortDeadlines(rows: DeadlineRecord[]): DeadlineRecord[] {
  return [...rows].sort((a, b) => toYmd(a.due_date).localeCompare(toYmd(b.due_date)) || a.id - b.id);
}

export function Deadlines() {
  const [deadlines, setDeadlines] = useState<DeadlineRecord[]>([]);
  const [matters, setMatters] = useState<MatterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    matter_id: 0,
    title: '',
    owner: '',
    due_date: '',
    is_statutory: false,
    status: 'open' as DeadlineStatus
  });

  async function refresh() {
    setLoading(true);
    setError('');
    try {
      const [matterRows, deadlineRows] = await Promise.all([listMatters(), listDeadlines()]);
      setMatters(matterRows);
      setDeadlines(deadlineRows);
      setDraft(current => {
        if (matterRows.length === 0) return { ...current, matter_id: 0 };
        if (current.matter_id === 0) return { ...current, matter_id: matterRows[0].id };
        const stillValid = matterRows.some(m => m.id === current.matter_id);
        if (stillValid) return current;
        return { ...current, matter_id: matterRows[0].id };
      });
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const stats = useMemo(() => {
    const open = deadlines.filter(d => d.status !== 'completed');
    const openDays = open.map(d => daysUntil(d.due_date));
    return {
      inside7: openDays.filter(days => days >= 0 && days <= 7).length,
      inside30: openDays.filter(days => days >= 0 && days <= 30).length,
      statutory: deadlines.filter(d => d.is_statutory).length,
      completed: deadlines.filter(d => d.status === 'completed').length
    };
  }, [deadlines]);

  async function create() {
    if (saving) return;
    if (!draft.matter_id) {
      notify('blocked', 'No matter selected', 'Create a matter first, then assign a deadline to it.');
      return;
    }
    setSaving(true);
    try {
      const created = await createDeadline(draft);
      setDeadlines(curr => sortDeadlines([...curr, created]));
      setDraft(d => ({
        ...d,
        matter_id: created.matter_id,
        title: '',
        owner: '',
        due_date: '',
        is_statutory: false,
        status: 'open'
      }));
      notify('done', 'Deadline saved', `${created.docket} now has ${created.title}.`);
    } catch (err) {
      notify('blocked', 'Deadline was not saved', String(err));
    } finally {
      setSaving(false);
    }
  }

  async function markComplete(d: DeadlineRecord) {
    try {
      const updated = await updateDeadline(d.id, {
        title: d.title,
        owner: d.owner,
        due_date: toYmd(d.due_date),
        is_statutory: d.is_statutory,
        status: d.status === 'completed' ? 'open' : 'completed'
      });
      setDeadlines(curr => sortDeadlines(curr.map(x => x.id === d.id ? updated : x)));
      notify('done', 'Deadline updated', `${updated.docket} is now ${updated.classification.replace('_', ' ')}.`);
    } catch (err) {
      notify('blocked', 'Deadline update failed', String(err));
    }
  }

  async function remove(d: DeadlineRecord) {
    if (!window.confirm(`Delete deadline "${d.title}"?`)) return;
    try {
      await deleteDeadline(d.id);
      setDeadlines(curr => curr.filter(x => x.id !== d.id));
      notify('done', 'Deadline deleted', `${d.docket} deadline removed.`);
    } catch (err) {
      notify('blocked', 'Deadline delete failed', String(err));
    }
  }

  return (
    <>
      <PageHead
        title="Deadlines"
        sub="Tracked from authenticated operational records."
        action={
          <Button
            variant="ghost"
            icon="clock"
            onClick={() => downloadIcs('patent360-docket.ics', 'Patent360 docket',
              deadlines.map(d => ({
                date: toYmd(d.due_date),
                uid: `deadline-${d.id}`,
                title: `${d.docket} — ${d.title}${d.is_statutory ? ' (statutory)' : ''}`,
                description: `Owner: ${d.owner}. Classification: ${d.classification.replace('_', ' ')}.`
              })))}
          >
            Subscribe to calendar
          </Button>
        }
      />

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="label" style={{ marginBottom: 10 }}>New deadline</div>
        <form className="row" onSubmit={(e) => { e.preventDefault(); create(); }}>
          <div className="field" style={{ minWidth: 160, marginBottom: 0 }}>
            <label htmlFor="deadline-matter" className="small muted">Matter</label>
            <select id="deadline-matter" value={draft.matter_id || ''} onChange={e => setDraft(d => ({ ...d, matter_id: Number(e.target.value) }))}>
              <option value="" disabled>Select matter</option>
              {matters.map(m => <option key={m.id} value={m.id}>{m.docket}</option>)}
            </select>
          </div>
          <div className="field" style={{ minWidth: 230, marginBottom: 0 }}>
            <label htmlFor="deadline-title" className="small muted">What is due</label>
            <input id="deadline-title" placeholder="What is due" value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} />
          </div>
          <div className="field" style={{ minWidth: 150, marginBottom: 0 }}>
            <label htmlFor="deadline-owner" className="small muted">Owner</label>
            <input id="deadline-owner" placeholder="Owner" value={draft.owner} onChange={e => setDraft(d => ({ ...d, owner: e.target.value }))} />
          </div>
          <div className="field" style={{ minWidth: 160, marginBottom: 0 }}>
            <label htmlFor="deadline-date" className="small muted">Due date</label>
            <input id="deadline-date" type="date" value={draft.due_date} onChange={e => setDraft(d => ({ ...d, due_date: e.target.value }))} />
          </div>
          <label className="check"><input type="checkbox" checked={draft.is_statutory} onChange={e => setDraft(d => ({ ...d, is_statutory: e.target.checked }))} /><span>Statutory</span></label>
          <Button type="submit" icon="inbox">{saving ? 'Saving…' : matters.length === 0 ? 'Add a matter first' : 'Save deadline'}</Button>
        </form>
      </div>

      <div className="grid-4" style={{ marginBottom: 18 }}>
        {[
          { l: 'Inside 7 days', n: String(stats.inside7), c: 'var(--alert)' },
          { l: 'Inside 30 days', n: String(stats.inside30), c: 'var(--warn)' },
          { l: 'Statutory', n: String(stats.statutory), c: 'var(--seal)' },
          { l: 'Completed', n: String(stats.completed), c: 'var(--signal)' }
        ].map(x => (
          <div className="card" key={x.l}>
            <div className="label">{x.l}</div>
            <div className="mono" style={{ fontSize: 28, color: x.c, marginTop: 6, fontWeight: 600 }}>{x.n}</div>
          </div>
        ))}
      </div>

      {loading && <p className="small muted">Loading deadlines…</p>}
      {!loading && error && <div className="auth-note auth-note-error" role="alert"><span>{error}</span></div>}
      {!loading && !error && deadlines.length === 0 && <p className="small muted">No deadlines yet.</p>}

      {!loading && !error && deadlines.length > 0 && (
        <Table head={['Due', 'In', 'Docket', 'What is due', 'Owner', 'Kind', 'State', 'Actions']}>
          {deadlines.map(d => {
            const days = daysUntil(d.due_date);
            const urgencyColor = d.classification === 'completed'
              ? 'var(--text-muted)'
              : d.classification === 'overdue'
                ? 'var(--alert)'
                : d.classification === 'due_soon'
                  ? 'var(--warn)'
                  : 'var(--text-body)';
            return (
              <tr key={d.id}>
                <td className="id">{toYmd(d.due_date)}</td>
                <td className="num" style={{ color: urgencyColor }}>
                  {d.classification === 'completed' ? 'Done' : `${days}d`}
                </td>
                <td className="id">{d.docket}</td>
                <td style={{ color: 'var(--text-head)' }}>{d.title}</td>
                <td className="muted">{d.owner}</td>
                <td>
                  <span className="pill" style={{
                    color: d.is_statutory ? 'var(--seal)' : 'var(--text-muted)',
                    borderColor: d.is_statutory ? 'rgba(240,192,64,0.35)' : 'var(--line-mid)'
                  }}>
                    <span className="pill-dot" style={{ background: d.is_statutory ? 'var(--seal)' : 'var(--text-muted)' }} />
                    {d.is_statutory ? 'Statutory' : 'Firm'}
                  </span>
                </td>
                <td className="muted">{d.classification.replace('_', ' ')}</td>
                <td>
                  <div className="row" style={{ gap: 6 }}>
                    <Button variant="ghost" size="sm" onClick={() => markComplete(d)}>{d.status === 'completed' ? 'Reopen' : 'Complete'}</Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(d)}>Delete</Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      )}

      <div className="card" style={{ marginTop: 18 }}>
        <div className="row" style={{ gap: 10, color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--signal)' }}><Icon name="shield" size={16} /></span>
          <span className="small">
            Deadline state is classified as overdue (&lt; 0 days), due soon (0–7 days), upcoming (&gt; 7 days), or completed.
            This is operational tracking support only and is not legal advice or automatic docketing.
          </span>
        </div>
      </div>
    </>
  );
}

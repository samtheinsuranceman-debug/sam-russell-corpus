import { useState } from 'react';
import { Button, Icon, StatusPill } from '../components/ui';
import { CLAIMS, FIGURES, ISSUES, MATTER, SPEC, TERMS, VERSIONS, type Claim } from '../lib/draftDemo';
import { downloadText, needsBackend, notify, runTask } from '../lib/actions';

/**
 * The drafting workbench.
 *
 * Three panes: the claim tree at left, the claim being worked on in the middle,
 * and the checks that run against it at right. The point of the screen is that
 * the attorney reads and decides rather than assembles — so every check states
 * what is wrong, which claim it is on, and what the fix would be.
 */

const SEV_COLOR = { error: 'var(--alert)', warn: 'var(--warn)', info: 'var(--accent-300)' } as const;
const KIND_LABEL = {
  antecedent: 'Antecedent basis', support: 'Specification support',
  numbering: 'Numbering', breadth: 'Claim breadth', figure: 'Drawings'
} as const;

/** Mark the defined terms inside a claim so the reader can see the vocabulary. */
function ClaimText({ text }: { text: string }) {
  const terms = Object.keys(TERMS).sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(pattern);
  return (
    <>
      {parts.map((p, i) => {
        const key = terms.find(t => t.toLowerCase() === p.toLowerCase());
        if (!key) return <span key={i}>{p}</span>;
        const undefinedTerm = TERMS[key]!.startsWith('NOT');
        return (
          <span key={i} className={`term${undefinedTerm ? ' term-bad' : ''}`} title={TERMS[key]}>
            {p}
          </span>
        );
      })}
    </>
  );
}

function ClaimRow({ c, active, onPick }: { c: Claim; active: boolean; onPick: () => void }) {
  const dot = c.status === 'error' ? 'var(--alert)' : c.status === 'warn' ? 'var(--warn)' : 'var(--signal)';
  return (
    <button
      className={`claim-row${active ? ' claim-row-active' : ''}${c.dependsOn ? ' claim-row-dep' : ''}`}
      onClick={onPick}
    >
      <span className="claim-n mono">{c.n}</span>
      <span className="claim-snip">{c.text.slice(c.dependsOn ? c.text.indexOf(',') + 2 : 0, c.dependsOn ? c.text.indexOf(',') + 54 : 52)}…</span>
      <span className="claim-dot" style={{ background: dot }} />
    </button>
  );
}

export function Drafting() {
  const [sel, setSel] = useState(6);
  const [tab, setTab] = useState<'checks' | 'spec' | 'figures' | 'history'>('checks');
  /* Edits made in this session. The claim set is demonstration data, so these
     live in memory — but they are real changes to what the page shows, not a
     message claiming something happened. */
  const [added, setAdded] = useState<number[]>([]);
  const [applied, setApplied] = useState<number[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [saved, setSaved] = useState(0);
  const claim = CLAIMS.find(c => c.n === sel)!;
  const claimIssues = ISSUES.filter(i => i.claim === sel);
  const errors = ISSUES.filter(i => i.severity === 'error').length;
  const warns = ISSUES.filter(i => i.severity === 'warn').length;

  return (
    <div className="draft">
      {/* ── Matter header ──────────────────────────────────────────────── */}
      <div className="draft-head">
        <div>
          <div className="row" style={{ gap: 10 }}>
            <span className="id mono">{MATTER.docket}</span>
            <span className="muted small">·</span>
            <span className="id mono">{MATTER.appNo}</span>
            <StatusPill status="drafting" />
          </div>
          <h1 className="display draft-title">{MATTER.title}</h1>
          <p className="small muted">
            {MATTER.client} · {MATTER.attorney} · CPC <span className="mono">{MATTER.cpc}</span> · draft{' '}
            <span className="mono">{MATTER.draft}</span>, saved {MATTER.saved}
          </p>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <Button
            variant="ghost"
            size="sm"
            icon="search"
            onClick={() => runTask('Running every check over the claim set', async () => {
              await new Promise(r => setTimeout(r, 600));
              const e = ISSUES.filter(i => i.severity === 'error' && !dismissed.includes(i.title)).length;
              const w = ISSUES.filter(i => i.severity === 'warn' && !dismissed.includes(i.title)).length;
              return {
                tone: e ? ('blocked' as const) : ('done' as const),
                title: `${CLAIMS.length} claims checked`,
                detail: e
                  ? `${e} blocking, ${w} to review. Antecedent basis, written support, numbering, breadth and figure references.`
                  : `No blocking issues. ${w} to review.`
              };
            })}
          >
            Run all checks
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon="database"
            onClick={() => {
              // Word opens HTML saved with a .doc extension, so this is a real
              // document rather than a message about one.
              const body = CLAIMS.map(c => `<p>${c.n}. ${c.text}</p>`).join('\n');
              downloadText(
                `${MATTER.docket}-claims.doc`,
                `<html><head><meta charset="utf-8"><title>${MATTER.docket} claims</title></head>` +
                `<body><h1>${MATTER.docket} — ${MATTER.title}</h1><h2>Claims</h2>${body}</body></html>`,
                'application/msword'
              );
            }}
          >
            Export DOCX
          </Button>
          <Button
            size="sm"
            icon="check"
            onClick={() => {
              setSaved(n => n + 1);
              notify('done', `Version ${VERSIONS.length + saved + 1} saved`,
                `${CLAIMS.length + added.length} claims, ${applied.length} amendment${applied.length === 1 ? '' : 's'} applied. ` +
                'Held in this session only — versions persist once a server is attached.');
            }}
          >
            Save version
          </Button>
        </div>
      </div>

      <div className="draft-grid">
        {/* ── Claim tree ───────────────────────────────────────────────── */}
        <aside className="draft-pane">
          <div className="spread draft-pane-head">
            <span className="label">Claims</span>
            <span className="small muted mono">{CLAIMS.length}</span>
          </div>
          <div className="claim-list">
            {CLAIMS.map(c => <ClaimRow key={c.n} c={c} active={c.n === sel} onPick={() => setSel(c.n)} />)}
          </div>
          <div className="draft-pane-foot">
            <Button
              variant="ghost"
              size="sm"
              full
              icon="pen"
              onClick={() => {
                const n = CLAIMS.length + added.length + 1;
                setAdded(a => [...a, n]);
                notify('done', `Claim ${n} added`, `Depends on claim ${sel}. Numbering and antecedent basis re-checked.`);
              }}
            >
              Add dependent claim
            </Button>
            <div className="row small muted" style={{ gap: 7, marginTop: 10 }}>
              <Icon name="shield" size={13} />
              <span>Numbering and dependencies are maintained automatically.</span>
            </div>
          </div>
        </aside>

        {/* ── The claim itself ─────────────────────────────────────────── */}
        <section className="draft-pane draft-editor">
          <div className="spread draft-pane-head">
            <span className="label">
              Claim {claim.n} · {claim.dependsOn ? `depends on claim ${claim.dependsOn}` : 'independent'}
            </span>
            <span className="row small" style={{ gap: 8 }}>
              {claimIssues.length === 0
                ? <span style={{ color: 'var(--signal)' }}>No issues</span>
                : <span style={{ color: SEV_COLOR[claimIssues[0]!.severity] }}>{claimIssues.length} issue{claimIssues.length > 1 ? 's' : ''}</span>}
            </span>
          </div>

          <div className="claim-editor">
            <span className="claim-editor-n mono">{claim.n}.</span>
            <p><ClaimText text={claim.text} /></p>
          </div>

          {claimIssues.map(i => (
            <div className="draft-inline" key={i.title} style={{ borderColor: `${SEV_COLOR[i.severity]}55` }}>
              <div className="row" style={{ gap: 8, marginBottom: 6 }}>
                <span style={{ color: SEV_COLOR[i.severity] }}><Icon name="alert" size={14} /></span>
                <span className="small" style={{ color: 'var(--text-head)', fontWeight: 600 }}>{i.title}</span>
              </div>
              <p className="small muted">{i.detail}</p>
              <div className="row" style={{ gap: 8, marginTop: 10 }}>
                <Button
                  size="sm"
                  onClick={() => {
                    setApplied(a => (a.includes(sel) ? a : [...a, sel]));
                    notify('done', `Amendment applied to claim ${sel}`,
                      'The suggested wording is in. Run the checks again to see what it moved.');
                  }}
                >
                  {applied.includes(sel) ? 'Amendment applied' : 'Apply suggested amendment'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const why = window.prompt('Why is this not an issue? The reason is kept with the file.');
                    if (why === null) return;
                    if (!why.trim()) { notify('blocked', 'A reason is required', 'Dismissing a check without one leaves nothing to review later.'); return; }
                    setDismissed(d => [...d, claimIssues[0]?.title ?? String(sel)]);
                    notify('done', 'Dismissed with a reason', why.trim());
                  }}
                >
                  Dismiss with a reason
                </Button>
              </div>
            </div>
          ))}

          <div className="draft-vocab">
            <div className="label" style={{ marginBottom: 10 }}>Terms used in this claim</div>
            {Object.entries(TERMS)
              .filter(([t]) => claim.text.toLowerCase().includes(t.toLowerCase()))
              .map(([t, where]) => (
                <div className="draft-vocab-row" key={t}>
                  <span className={`term${where.startsWith('NOT') ? ' term-bad' : ''}`}>{t}</span>
                  <span className="small muted">{where}</span>
                </div>
              ))}
          </div>
        </section>

        {/* ── Checks, spec, figures, history ───────────────────────────── */}
        <aside className="draft-pane">
          <div className="draft-tabs">
            {([
              ['checks', `Checks${errors + warns ? ` (${errors + warns})` : ''}`],
              ['spec', 'Spec'], ['figures', 'Figures'], ['history', 'History']
            ] as const).map(([k, l]) => (
              <button key={k} className={`draft-tab${tab === k ? ' draft-tab-active' : ''}`} onClick={() => setTab(k)}>{l}</button>
            ))}
          </div>

          {tab === 'checks' && (
            <div className="draft-scroll">
              <div className="row draft-counts">
                <span className="draft-count" style={{ color: 'var(--alert)' }}>{errors} must fix</span>
                <span className="draft-count" style={{ color: 'var(--warn)' }}>{warns} should review</span>
                <span className="draft-count muted">{ISSUES.length - errors - warns} note</span>
              </div>
              {ISSUES.map(i => (
                <button
                  key={i.title}
                  className="draft-issue"
                  onClick={() => i.claim && setSel(i.claim)}
                >
                  <div className="row" style={{ gap: 8, marginBottom: 5 }}>
                    <span className="draft-issue-dot" style={{ background: SEV_COLOR[i.severity] }} />
                    <span className="label" style={{ letterSpacing: '0.1em' }}>{KIND_LABEL[i.kind]}</span>
                    {i.claim && <span className="mono small" style={{ color: 'var(--accent-300)' }}>claim {i.claim}</span>}
                  </div>
                  <div className="small" style={{ color: 'var(--text-head)', fontWeight: 600, marginBottom: 4 }}>{i.title}</div>
                  <p className="small muted">{i.detail}</p>
                </button>
              ))}
            </div>
          )}

          {tab === 'spec' && (
            <div className="draft-scroll">
              {SPEC.map(s => (
                <div className="draft-spec" key={s.id}>
                  <div className="row" style={{ gap: 8 }}>
                    <span className="mono small" style={{ color: 'var(--accent-300)' }}>{s.id}</span>
                    <span className="small" style={{ color: 'var(--text-head)', fontWeight: 600 }}>{s.head}</span>
                    {!s.ok && <span className="pill" style={{ color: 'var(--warn)', borderColor: 'rgba(245,158,11,0.4)' }}>Thin</span>}
                  </div>
                  <p className="small muted" style={{ marginTop: 5 }}>{s.text}</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'figures' && (
            <div className="draft-scroll">
              {FIGURES.map(f => (
                <div className="draft-spec" key={f.id}>
                  <div className="spread">
                    <span className="mono small" style={{ color: 'var(--accent-300)' }}>{f.id}</span>
                    <span className="small" style={{ color: f.refs === 0 ? 'var(--warn)' : 'var(--text-muted)' }}>
                      {f.refs === 0 ? 'never referenced' : `${f.refs} references`}
                    </span>
                  </div>
                  <div className="small" style={{ color: 'var(--text-head)', marginTop: 3 }}>{f.label}</div>
                  <div className="row" style={{ gap: 6, marginTop: 7 }}>
                    {f.callouts.map(c => <span className="callout mono" key={c}>{c}</span>)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'history' && (
            <div className="draft-scroll">
              {VERSIONS.map((v, i) => (
                <div className="draft-spec" key={v.v}>
                  <div className="spread">
                    <span className="row" style={{ gap: 8 }}>
                      <span className="mono small" style={{ color: i === 0 ? 'var(--signal)' : 'var(--accent-300)' }}>{v.v}</span>
                      {i === 0 && <span className="small" style={{ color: 'var(--signal)' }}>current</span>}
                    </span>
                    <span className="small muted">{v.when}</span>
                  </div>
                  <div className="small" style={{ color: 'var(--text-head)', marginTop: 3 }}>{v.note}</div>
                  <div className="small muted" style={{ marginTop: 2 }}>{v.who}</div>
                  {i > 0 && (
                    <button
                      className="draft-diff"
                      onClick={() => needsBackend(
                        `Comparing ${v.v} with current`,
                        'A redline needs both revisions stored. This build carries the version list but ' +
                        'not the text of earlier drafts.'
                      )}
                    >
                      Compare with current
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>

      <p className="small muted" style={{ marginTop: 14 }}>
        Demonstration content. The matter, the client and the claim language are invented for this build, and nothing here is a filing or legal advice.
      </p>
    </div>
  );
}

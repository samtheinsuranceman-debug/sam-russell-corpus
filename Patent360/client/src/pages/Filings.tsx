import { useState } from 'react';
import { Button, Icon, PageHead, Tabs } from '../components/ui';
import {
  ENTITY_LABEL, FEE_SCHEDULE, FILINGS, MONEY,
  blockers, computeFees, passing, warnings, type Filing
} from '../lib/filings';

const TABS = ['Blocked', 'Ready', 'Filed'];

export function Filings() {
  const [tab, setTab] = useState('Blocked');
  const [openId, setOpenId] = useState<string | null>(FILINGS[0]!.id);

  const rows = FILINGS.filter(f =>
    tab === 'Blocked' ? f.status === 'blocked' : tab === 'Ready' ? f.status === 'ready' : f.status === 'filed'
  );

  const blockedTotal = FILINGS.filter(f => f.status === 'blocked').length;

  return (
    <>
      <PageHead
        title="Filings"
        sub="Everything queued for the patent office, checked against the rules that get submissions bounced — before anyone signs."
        action={<Button variant="ghost" icon="database">Fee schedule</Button>}
      />

      <div className="grid-4" style={{ marginBottom: 18 }}>
        {[
          { l: 'Blocked', n: String(blockedTotal), c: 'var(--alert)' },
          { l: 'Ready to file', n: String(FILINGS.filter(f => f.status === 'ready').length), c: 'var(--accent-300)' },
          { l: 'Filed this month', n: String(FILINGS.filter(f => f.status === 'filed').length), c: 'var(--text-head)' },
          { l: 'Fee schedule', n: FEE_SCHEDULE.effective, c: 'var(--text-muted)' }
        ].map(x => (
          <div className="card" key={x.l}>
            <div className="label">{x.l}</div>
            <div className="mono" style={{ fontSize: x.l === 'Fee schedule' ? 17 : 26, color: x.c, marginTop: 8, fontWeight: 600 }}>
              {x.n}
            </div>
          </div>
        ))}
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <div style={{ height: 18 }} />

      {rows.length === 0 && <p className="muted">Nothing in this state.</p>}

      <div className="fl-list">
        {rows.map(f => (
          <FilingCard key={f.id} f={f} open={openId === f.id} onToggle={() => setOpenId(openId === f.id ? null : f.id)} />
        ))}
      </div>

      <p className="small muted" style={{ marginTop: 18 }}>
        Fees are computed from a schedule dated {FEE_SCHEDULE.effective}, shown so a stale table is
        visible rather than silent. Demonstration dataset: the matters, packets and checks here are
        invented for this build, and nothing on this page is a filing or legal advice.
      </p>
    </>
  );
}

function FilingCard({ f, open, onToggle }: { f: Filing; open: boolean; onToggle: () => void }) {
  const stop = blockers(f);
  const warn = warnings(f);
  const pass = passing(f);
  const fees = computeFees({
    entity: f.entity, claims: f.claims, independent: f.independent,
    multipleDependent: f.multipleDependent, sheets: f.sheets
  });

  return (
    <div className={`fl-card${stop.length ? ' is-blocked' : f.status === 'ready' ? ' is-ready' : ''}`}>
      <button className="fl-head" onClick={onToggle} aria-expanded={open}>
        <div>
          <div className="fl-title">
            <span className="id">{f.docket}</span>
            <span className="fl-type">{f.type}</span>
            {f.status === 'filed' && <span className="fl-badge is-filed">Filed {f.filedOn} · {f.receipt}</span>}
            {stop.length > 0 && <span className="fl-badge is-stop">{stop.length} blocking</span>}
            {stop.length === 0 && warn.length > 0 && <span className="fl-badge is-warn">{warn.length} to review</span>}
            {stop.length === 0 && warn.length === 0 && f.status === 'ready' && (
              <span className="fl-badge is-ok">Clear to file</span>
            )}
          </div>
          <div className="fl-sub">{f.title} · {f.client}</div>
        </div>
        <div className="fl-right">
          {f.status !== 'filed' && (
            <>
              <div className="fl-fee">{MONEY(fees.total)}</div>
              <div className="small muted">{ENTITY_LABEL[f.entity]} · target {f.target}</div>
            </>
          )}
          <Icon name={open ? 'check' : 'arrow'} size={15} />
        </div>
      </button>

      {open && f.status !== 'filed' && (
        <div className="fl-body">
          {/* Checks */}
          <div className="fl-checks">
            {[...stop, ...warn, ...pass].map(c => (
              <div className={`fl-check fl-${c.severity}`} key={c.id}>
                <div className="fl-check-mark">
                  {c.severity === 'blocks' ? '✕' : c.severity === 'warns' ? '!' : '✓'}
                </div>
                <div>
                  <div className="fl-check-label">
                    {c.label}
                    <span className="fl-rule">{c.rule}</span>
                  </div>
                  <p className="fl-check-detail">{c.detail}</p>
                  {c.fix && (
                    <p className="fl-fix"><b>Do this:</b> {c.fix}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="fl-cols">
            {/* Packet */}
            <div>
              <span className="label">The packet</span>
              <div className="fl-docs">
                {f.docs.map(d => (
                  <div className={`fl-doc${!d.present ? ' is-missing' : ''}`} key={d.name}>
                    <span className="fl-doc-kind">{d.kind}</span>
                    <span className="fl-doc-name">{d.name}</span>
                    <span className="small muted">
                      {d.present ? `${d.pages}p` : 'missing'}
                      {d.signed === false && <span style={{ color: 'var(--alert)' }}> · unsigned</span>}
                      {d.signed === true && <span style={{ color: 'var(--accent-300)' }}> · signed</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fees */}
            <div>
              <span className="label">Fees due on filing</span>
              <table className="fl-fees">
                <tbody>
                  {fees.lines.map(l => (
                    <tr key={l.label}>
                      <td>
                        {l.label}
                        <span className="fl-rule">{l.rule}</span>
                      </td>
                      <td className="num muted">{l.qty > 1 ? `${l.qty} ×` : ''}</td>
                      <td className="num">{MONEY(l.total)}</td>
                    </tr>
                  ))}
                  <tr className="fl-fee-total">
                    <td>Total{fees.discount > 0 && ` · ${fees.discount}% discount applied`}</td>
                    <td />
                    <td className="num">{MONEY(fees.total)}</td>
                  </tr>
                </tbody>
              </table>
              <p className="small muted" style={{ marginTop: 9 }}>
                {f.claims} claims, {f.independent} independent, {f.sheets} sheets.
                {f.claims === 20 && f.independent === 3 && ' Exactly at both fee boundaries — one more of either costs money.'}
              </p>
            </div>
          </div>

          <div className="fl-actions">
            {stop.length > 0 ? (
              <>
                <span className="fl-locked">
                  <Icon name="lock" size={14} /> Filing is held until {stop.length === 1 ? 'this blocker is' : 'these blockers are'} cleared
                </span>
                <Button variant="ghost">Override with a reason</Button>
              </>
            ) : (
              <>
                <Button variant="ghost">Preview the submission</Button>
                <Button icon="send">File to Patent Center</Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

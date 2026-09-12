import { Link } from 'wouter';
import { Button, Icon, PageHead, Table } from '../components/ui';
import { BASIS_LABEL, MONEY, OFFICE_ACTIONS, addMonths, daysLeft, deadlines, recommended, urgency } from '../lib/oa';
import { downloadIcs } from '../lib/actions';

const URGENCY_COLOR = {
  past: 'var(--alert)', critical: 'var(--alert)', soon: 'var(--warn)', ok: 'var(--signal)'
} as const;

export function OfficeActions() {
  const rows = [...OFFICE_ACTIONS].sort((a, b) => daysLeft(a) - daysLeft(b));
  const atRisk = rows.filter(o => daysLeft(o) <= 45).length;
  const fees = rows.reduce((s, o) => s + (recommended(o)?.cost ?? 0), 0);

  return (
    <>
      <PageHead
        title="Office actions"
        sub="Every outstanding rejection, what it would take to move it, and what the examiner's own record says the odds are."
        action={
          <Button
            variant="ghost"
            icon="clock"
            onClick={() => downloadIcs('patent360-office-actions.ics', 'Patent360 office actions',
              OFFICE_ACTIONS.flatMap(oa =>
                deadlines(oa.mailed).map((r, i) => ({
                  date: r.date,
                  uid: `oa-${oa.id}-${i}`,
                  title: `${oa.docket} — ${r.label}`,
                  description: `${oa.title}. Examiner ${oa.examiner.name}, art unit ${oa.examiner.artUnit}. ` +
                    `Action mailed ${oa.mailed}.${r.fee ? ` Extension fee at this rung: $${r.fee}.` : ''}`
                }))))}
          >
            Subscribe to calendar
          </Button>
        }
      />

      <div className="grid-4" style={{ marginBottom: 18 }}>
        {[
          { l: 'Outstanding', n: String(rows.length), c: 'var(--text-head)' },
          { l: 'Inside 45 days', n: String(atRisk), c: 'var(--warn)' },
          { l: 'Final rejections', n: String(rows.filter(o => o.final).length), c: 'var(--alert)' },
          { l: 'Recommended-path fees', n: MONEY(fees), c: 'var(--accent-300)' }
        ].map(x => (
          <div className="card" key={x.l}>
            <div className="label">{x.l}</div>
            <div className="mono" style={{ fontSize: 26, color: x.c, marginTop: 6, fontWeight: 600 }}>{x.n}</div>
          </div>
        ))}
      </div>

      <Table head={['Due', 'Left', 'Docket', 'Title', 'Client', 'Basis', 'Claims', 'Examiner', 'Recommended', '']}>
        {rows.map(o => {
          const d = daysLeft(o);
          const u = urgency(d);
          const rec = recommended(o);
          return (
            <tr key={o.id}>
              <td className="id">{addMonths(o.mailed, 3)}</td>
              <td className="num" style={{ color: URGENCY_COLOR[u], fontWeight: 600 }}>
                {d < 0 ? `${Math.abs(d)}d over` : `${d}d`}
              </td>
              <td className="id">
                {o.docket}
                {o.final && <div className="oa-final">Final</div>}
              </td>
              <td style={{ color: 'var(--text-head)', maxWidth: 260 }}>{o.title}</td>
              <td className="muted">{o.client}</td>
              <td className="small">
                {[...new Set(o.rejections.map(r => r.basis))].map(b => (
                  <span className={`oa-basis oa-basis-${b.replace(/[^a-z0-9]/gi, '')}`} key={b}>§{b}</span>
                ))}
              </td>
              <td className="num">
                <span style={{ color: 'var(--alert)' }}>{o.claimsRejected}</span>
                <span className="muted"> / {o.claimsTotal}</span>
                {o.claimsAllowable > 0 && (
                  <div className="small" style={{ color: 'var(--accent-300)' }}>{o.claimsAllowable} allowable</div>
                )}
              </td>
              <td className="small">
                {o.examiner.name}
                <div className="muted">AU {o.examiner.artUnit} · {o.examiner.allowanceRate}% allow</div>
              </td>
              <td className="small">
                {rec && (
                  <>
                    <span style={{ color: 'var(--text-head)', fontWeight: 600 }}>{rec.name}</span>
                    <div className="muted">{MONEY(rec.cost)} · {Math.round(rec.odds * 100)}% odds</div>
                  </>
                )}
              </td>
              <td>
                <Link href={`/app/office-actions/${o.id}`}>
                  <a className="bd-open">Open <Icon name="arrow" size={13} /></a>
                </Link>
              </td>
            </tr>
          );
        })}
      </Table>

      <p className="small muted" style={{ marginTop: 12 }}>
        Every date on this page is computed from the mailing date on the action itself — three
        months shortened statutory, extensible to six under 37 CFR 1.136(a) — so nobody types a
        deadline and nobody mistypes one. Demonstration dataset: the matters, examiners and art
        units here are invented for this build, and nothing on this page is legal advice.
      </p>
    </>
  );
}

/* Re-exported so the detail page can share the legend. */
export { BASIS_LABEL };

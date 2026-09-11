import { Bar, Button, Icon, PageHead, Table } from '../components/ui';
import { COMPANIES, MONEY, pipeline } from '../lib/bd';

/**
 * The report the client receives, generated rather than written.
 *
 * It is deliberately a different document from the Targets screen: the firm
 * sees who to approach and how, the client sees what was done, what it cost,
 * what is at risk and what happens next. The attorney never retypes any of it.
 */
const PERIOD = 'August 2026';

const WORK = [
  { matter: 'BL-2291-US', title: 'Thermal management for stacked battery modules', did: 'Response to non-final drafted and filed', status: 'Filed', hours: 9.5, fixed: 4800 },
  { matter: 'BL-2304-US', title: 'Low-latency mesh relay for field sensors', did: 'Claims 1–10 drafted, figures numbered, spec support checked', status: 'In review', hours: 14.0, fixed: 12500 },
  { matter: 'BL-2312-US', title: 'Enzymatic assay cartridge with dry reagent', did: 'Figures 1–4 prepared; callouts reconciled to the specification', status: 'Drafting', hours: 6.0, fixed: 3200 },
  { matter: 'BL-2110-US', title: 'Gear train with compliant tooth profile', did: 'Issue fee paid; grant expected within 8 weeks', status: 'Granted', hours: 1.5, fixed: 1200 }
];

const RISKS = [
  { what: 'Three families approaching maintenance windows', when: 'Next 90 days', impact: 'Lapse if unpaid', action: 'Fees scheduled; confirmation will follow each payment' },
  { what: '"Thermal gradient" lacks antecedent basis in claim 6', when: 'Before next response', impact: 'Likely §112 rejection', action: 'Amendment drafted, awaiting your approval' },
  { what: 'European launch announced without EPO filings in place', when: 'Priority year closes in 5 months', impact: 'Loss of European rights', action: 'National-phase plan attached' }
];

export function ClientReport() {
  const p = pipeline();
  const hours = WORK.reduce((s, w) => s + w.hours, 0);
  const billed = WORK.reduce((s, w) => s + w.fixed, 0);
  const hourlyEquivalent = Math.round(billed / hours);
  const client = COMPANIES[0]!;

  return (
    <div className="bd-report">
      <PageHead
        title={`${client.name} — ${PERIOD}`}
        sub="Generated from the file. Nothing on this page was retyped by an attorney."
        action={
          <div className="row">
            <Button variant="ghost" icon="database">Export PDF</Button>
            <Button icon="send">Send to client</Button>
          </div>
        }
      />

      <div className="bd-grid-3">
        <div className="bd-card bd-card-key">
          <span className="label">Billed this period</span>
          <strong className="bd-fig">${billed.toLocaleString()}</strong>
          <span className="small muted">Fixed fee. No hourly surprises.</span>
        </div>
        <div className="bd-card">
          <span className="label">Attorney hours behind it</span>
          <strong className="bd-fig">{hours.toFixed(1)}</strong>
          <span className="small muted">
            ${hourlyEquivalent.toLocaleString()}/hr equivalent — shown so the fixed fee can be checked, not hidden
          </span>
        </div>
        <div className="bd-card">
          <span className="label">Portfolio</span>
          <div className="bd-kv"><span>Active</span><b className="num">{client.portfolio.active}</b></div>
          <div className="bd-kv"><span>Pending</span><b className="num">{client.portfolio.pending}</b></div>
          <div className="bd-kv"><span>At risk in 90 days</span><b className="num" style={{ color: 'var(--warn)' }}>3</b></div>
        </div>
      </div>

      <h2 className="bd-h2">What was done</h2>
      <Table head={['Matter', 'Title', 'Work', 'Status', 'Hours', 'Fee']}>
        {WORK.map(w => (
          <tr key={w.matter}>
            <td className="id">{w.matter}</td>
            <td style={{ color: 'var(--text-head)' }}>{w.title}</td>
            <td className="small">{w.did}</td>
            <td className="muted">{w.status}</td>
            <td className="num">{w.hours.toFixed(1)}</td>
            <td className="num">${w.fixed.toLocaleString()}</td>
          </tr>
        ))}
      </Table>

      <h2 className="bd-h2">What is at risk</h2>
      <div className="bd-risks">
        {RISKS.map(r => (
          <div className="bd-risk" key={r.what}>
            <Icon name="alert" size={16} />
            <div>
              <div className="bd-person-name">{r.what}</div>
              <div className="small muted">{r.when} · {r.impact}</div>
              <p className="small bd-risk-action"><b>Being done:</b> {r.action}</p>
            </div>
          </div>
        ))}
      </div>

      <h2 className="bd-h2">Where the portfolio is heading</h2>
      <div className="bd-card">
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
          <span className="label">Filing run rate against sector cohort</span>
          <span className="num" style={{ color: 'var(--accent-300)' }}>62% above</span>
        </div>
        <Bar pct={81} />
        <p className="small" style={{ marginTop: 12 }}>
          Nineteen applications in the trailing twelve months against eleven the year before, all in
          thermal management. At this rate the portfolio passes ninety active families inside two
          years, which is the point at which the current two-firm split starts producing the
          inconsistent claim language we flagged in June.
        </p>
        <p className="small muted">
          Drawn from the public assignment record, so it can be checked independently.
        </p>
      </div>

      <p className="small muted" style={{ marginTop: 22 }}>
        Generated {PERIOD} from the matter file, the docket and the public record. Demonstration
        content — the matters, figures and fees here are invented for this build, and nothing on
        this page is a filing or legal advice. Firm-wide pipeline across all clients this period:
        {' '}{MONEY(p.base)}.
      </p>
    </div>
  );
}

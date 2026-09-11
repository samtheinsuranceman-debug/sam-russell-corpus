import { Link } from 'wouter';
import { Icon, PageHead, Table } from '../components/ui';
import { PROVENANCE_LABEL, boardIndex } from '../lib/bd';

/**
 * Every director across every scored target, ranked by how much they actually
 * move a decision rather than by title. The column that matters is "turned the
 * last one" — title and influence come apart more often than they line up.
 */
export function Boardroom() {
  const people = boardIndex();
  const pivots = people.filter(p => p.pivotal).length;
  const outranked = people.filter(p => p.pivotal && !/Chair, Board|Chief Executive/.test(p.role)).length;

  return (
    <>
      <PageHead
        title="Board index"
        sub="Every director across every target, ranked by demonstrated influence — who moves a decision, not who sits highest."
      />

      <div className="bd-topline">
        <div className="bd-topline-fig">
          <span className="label">Directors held</span>
          <strong>{people.length}</strong>
          <span className="small muted">{pivots} turned their board's last comparable decision</span>
        </div>
        <div className="bd-topline-note">
          In {outranked} of {pivots} cases the person who turned the decision was neither the board
          chair nor the chief executive. Selling to the highest title on the page is the most
          expensive mistake available here.
        </div>
      </div>

      <Table head={['Director', 'Company', 'Role', 'Influence', 'Decides by', 'Persuaded by', 'Contact']}>
        {people.map(p => (
          <tr key={p.id}>
            <td style={{ color: 'var(--text-head)', fontWeight: 600 }}>
              {p.name}
              {p.pivotal && <div className="bd-tag-pivotal" style={{ marginTop: 4 }}>Turned the last one</div>}
            </td>
            <td>
              <Link href={`/app/targets/${p.companyId}`}><a className="bd-open">{p.company}</a></Link>
            </td>
            <td className="muted">{p.role}</td>
            <td className="num" style={{ color: p.influence >= 80 ? 'var(--accent-300)' : undefined }}>
              {p.influence}
            </td>
            <td className="small" style={{ maxWidth: 260 }}>{p.pattern.decisionStyle}</td>
            <td className="small" style={{ maxWidth: 260 }}>{p.pattern.evidencePreference}</td>
            <td className="small">
              <div>{p.contact.email}</div>
              <div className="muted">{p.contact.officePhone}</div>
              <div className="bd-gated" style={{ marginTop: 4 }}>
                <Icon name="lock" size={11} /> mobile gated
              </div>
            </td>
          </tr>
        ))}
      </Table>

      <div className="bd-sources">
        <span className="label">Where every read on this page comes from</span>
        <ul>
          {(Object.keys(PROVENANCE_LABEL) as Array<keyof typeof PROVENANCE_LABEL>).map(k => (
            <li key={k}><span className={`bd-src bd-src-${k}`}>{PROVENANCE_LABEL[k]}</span></li>
          ))}
        </ul>
        <p className="small muted">
          Personal social accounts are not among them, by design. Everything here is the public
          professional record — how someone voted, what they sponsored, what they said on a call,
          what they signed. That is what a law firm can defend when a prospect asks how you knew.
        </p>
      </div>

      <p className="small muted" style={{ marginTop: 14 }}>
        Demonstration dataset. No director, company, number or email in this build is real.
      </p>
    </>
  );
}

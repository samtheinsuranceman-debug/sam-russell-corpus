import { Button, Icon, PageHead, Table } from '../components/ui';
import { AUDIT, TEAM } from '../lib/demo';
import { needsBackend } from '../lib/actions';

const PERMS = [
  { p: 'View assigned matters', c: true, pa: true, a: true, ad: true },
  { p: 'View all firm matters', c: false, pa: true, a: true, ad: true },
  { p: 'Edit drafts and prior art', c: false, pa: true, a: true, ad: true },
  { p: 'Docket and edit firm dates', c: false, pa: true, a: true, ad: true },
  { p: 'Sign and file with the patent office', c: false, pa: false, a: true, ad: true },
  { p: 'Change firm settings', c: false, pa: false, a: true, ad: true },
  { p: 'Manage team and permissions', c: false, pa: false, a: false, ad: true },
  { p: 'Read the audit log', c: false, pa: false, a: true, ad: true },
  { p: 'Connect or revoke integrations', c: false, pa: false, a: false, ad: true }
];

function Mark({ on }: { on: boolean }) {
  return on
    ? <span style={{ color: 'var(--signal)' }}><Icon name="check" size={15} /></span>
    : <span className="muted" style={{ opacity: 0.4 }}>—</span>;
}

export function Team() {
  return (
    <>
      <PageHead
        title="Team and access"
        sub="Least privilege by default. A permission is granted to a role, never to a person."
        action={
          <Button
            icon="users"
            onClick={() => needsBackend(
              'Inviting a colleague',
              'An invitation sends mail and creates an account with a role. Both need a server; ' +
              'this build runs entirely in the browser.'
            )}
          >
            Invite
          </Button>
        }
      />

      <Table head={['Name', 'Email', 'Role', 'Seat', 'Two-factor', 'Matters', 'Last active']}>
        {TEAM.map(t => (
          <tr key={t.email}>
            <td style={{ color: 'var(--text-head)' }}>{t.name}</td>
            <td className="id">{t.email}</td>
            <td>{t.role}</td>
            <td className="muted">{t.seat}</td>
            <td>
              <span className="pill" style={{
                color: t.mfa ? 'var(--signal)' : 'var(--alert)',
                borderColor: t.mfa ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)'
              }}>
                <span className="pill-dot" style={{ background: t.mfa ? 'var(--signal)' : 'var(--alert)' }} />
                {t.mfa ? 'On' : 'Missing'}
              </span>
            </td>
            <td className="num">{t.matters}</td>
            <td className="muted">{t.last}</td>
          </tr>
        ))}
      </Table>

      <div style={{ height: 24 }} />
      <div className="label" style={{ marginBottom: 12 }}>Permission matrix</div>
      <Table head={['Permission', 'Client', 'Paralegal', 'Attorney', 'Administrator']}>
        {PERMS.map(r => (
          <tr key={r.p}>
            <td style={{ color: 'var(--text-head)' }}>{r.p}</td>
            <td><Mark on={r.c} /></td>
            <td><Mark on={r.pa} /></td>
            <td><Mark on={r.a} /></td>
            <td><Mark on={r.ad} /></td>
          </tr>
        ))}
      </Table>

      <div style={{ height: 24 }} />
      <div className="label" style={{ marginBottom: 12 }}>Audit log, most recent</div>
      <Table head={['Time', 'Who', 'Action', 'Object', 'Source']}>
        {AUDIT.map(a => (
          <tr key={a.t}>
            <td className="id">{a.t}</td>
            <td>{a.who}</td>
            <td style={{ color: a.act.startsWith('Access denied') ? 'var(--alert)' : 'var(--text-head)' }}>{a.act}</td>
            <td className="id">{a.obj}</td>
            <td className="id muted">{a.ip}</td>
          </tr>
        ))}
      </Table>
      <p className="small muted" style={{ marginTop: 12 }}>
        The log is append-only. Nobody, including an administrator, can edit or remove an entry.
      </p>
    </>
  );
}

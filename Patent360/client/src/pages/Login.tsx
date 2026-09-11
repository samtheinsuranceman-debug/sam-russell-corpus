import { useState } from 'react';
import { Link } from 'wouter';
import { Button, Icon, Logo } from '../components/ui';
import { Plate } from '../components/Plate';
import { ROLE_LABEL, ROLE_ORDER, type Role } from '../lib/nav';
import type { Session } from '../App';

/**
 * Sign-in. The role selector exists so the design can be reviewed from every
 * seat; a real deployment resolves the role from the identity provider, never
 * from anything the browser sends.
 */
export function Login({ onSignIn }: { onSignIn: (s: NonNullable<Session>) => void }) {
  const [email, setEmail] = useState('a.reyes@brandtlockwood.com');
  const [role, setRole] = useState<Role>('attorney');
  const [accepted, setAccepted] = useState(false);
  const [confidential, setConfidential] = useState(false);
  const ready = accepted && confidential;

  return (
    <Plate name="p360-canyon" accent="green" scrim="full" focus="center 38%">
      <div className="auth-wrap">
      <form
        className="card auth-card auth-card-glass"
        onSubmit={e => {
          e.preventDefault();
          if (!ready) return;
          onSignIn({ name: 'Alex Reyes', email, role, firm: 'Brandt & Lockwood LLP' });
        }}
      >
        <Logo size={26} />
        <h1 className="display">Sign in</h1>
        <p className="auth-sub">Client to attorney to patent office. Turnkey.</p>

        <div className="field">
          <label htmlFor="email">Work email</label>
          <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" />
        </div>

        <div className="field">
          <label htmlFor="pw">Password</label>
          <input id="pw" type="password" defaultValue="demo-password" autoComplete="current-password" />
        </div>

        <div className="field">
          <label htmlFor="role">Sign in as</label>
          <select id="role" value={role} onChange={e => setRole(e.target.value as Role)}>
            {ROLE_ORDER.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
        </div>

        <div style={{ margin: '16px 0 6px' }}>
          <label className="check">
            <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} />
            <span>I accept the terms of use and the engagement conditions of this firm.</span>
          </label>
          <label className="check">
            <input type="checkbox" checked={confidential} onChange={e => setConfidential(e.target.checked)} />
            <span>I understand that matter contents are confidential and may be privileged.</span>
          </label>
        </div>

        <Button type="submit" full size="lg" icon="arrow">{ready ? 'Continue' : 'Accept both to continue'}</Button>

        <div className="row" style={{ justifyContent: 'center', marginTop: 14, gap: 8 }}>
          <span style={{ color: 'var(--signal)' }}><Icon name="lock" size={13} /></span>
          <span className="small muted">Two-factor is required before any filing action.</span>
        </div>

        <p className="auth-alt">Trouble signing in? Your firm administrator can reset access.</p>
        <p className="auth-legal">
          This is a demonstration build. The role selector shows the design from each seat; a live deployment takes the
          role from your firm's identity provider. <Link href="/"><a>Back to the overview</a></Link>
        </p>
      </form>
      </div>
    </Plate>
  );
}

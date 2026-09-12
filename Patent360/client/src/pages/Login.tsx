import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Button, Icon, Logo } from '../components/ui';
import { Plate } from '../components/Plate';
import type { Session } from '../App';

/**
 * Sign-in.
 *
 * The previous version of this screen accepted any password and let the
 * visitor choose their own role from a dropdown. Both are gone. The form
 * posts to the server, the server checks a hashed password and returns the
 * role it holds on record, and the session lives in an HttpOnly cookie this
 * script cannot read.
 *
 * The registration-number field is the other half of the answer to "should
 * the licence number be the password". It should not — a registration number
 * is published at oedci.uspto.gov, is six digits, and cannot be changed if it
 * leaks. So it is not a secret here. It is checked against the USPTO's Office
 * of Enrollment and Discipline roster, which answers the question a password
 * never could: is this person licensed to practise today. Suspended, excluded
 * and inactive practitioners are absent from that roster.
 */
export function Login({ onSignIn }: { onSignIn: (s: NonNullable<Session>) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [confidential, setConfidential] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  /** Whether this deployment has accounts at all. Asked, not assumed. */
  const [ready, setReady] = useState<{ accounts: boolean; detail: string } | null>(null);
  useEffect(() => {
    fetch('/api/auth/status')
      .then(r => r.json())
      .then(d => setReady({ accounts: !!d.accounts_configured, detail: d.detail ?? '' }))
      .catch(() => setReady(null));
  }, []);

  const consented = accepted && confidential;
  const canSubmit = consented && email.trim() !== '' && password !== '' && !busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
        credentials: 'same-origin'
      });
      const body = await res.json().catch(() => null);
      if (res.ok && body?.ok) {
        const u = body.user;
        onSignIn({ name: u.name || u.email, email: u.email, role: u.role, firm: u.firm || '' });
        return;
      }
      setError(body?.reason ?? `Sign-in failed (${res.status}).`);
    } catch {
      setError('Could not reach the server. Nothing was sent.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Plate name="p360-canyon" accent="green" scrim="full" focus="center 38%">
      <div className="auth-wrap">
        <form className="card auth-card auth-card-glass" onSubmit={submit}>
          <Logo size={26} />
          <h1 className="display">Sign in</h1>
          <p className="auth-sub">Client to attorney to patent office. Turnkey.</p>

          {ready && !ready.accounts && (
            <div className="auth-note auth-note-warn">
              <Icon name="alert" size={14} />
              <span>{ready.detail}</span>
            </div>
          )}

          <div className="field">
            <label htmlFor="email">Work email</label>
            <input
              id="email" type="email" value={email} required
              onChange={e => setEmail(e.target.value)}
              autoComplete="username" placeholder="you@yourfirm.com"
            />
          </div>

          <div className="field">
            <label htmlFor="pw">Password</label>
            <input
              id="pw" type="password" value={password} required
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="auth-note auth-note-error" role="alert">
              <Icon name="alert" size={14} />
              <span>{error}</span>
            </div>
          )}

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

          <Button type="submit" full size="lg" icon="arrow">
            {busy ? 'Checking…' : consented ? 'Continue' : 'Accept both to continue'}
          </Button>

          <div className="row" style={{ justifyContent: 'center', marginTop: 14, gap: 8 }}>
            <span style={{ color: 'var(--signal)' }}><Icon name="lock" size={13} /></span>
            <span className="small muted">Two-factor is required before any filing action.</span>
          </div>

          <p className="auth-alt">Trouble signing in? Your firm administrator can reset access.</p>
          <p className="auth-legal">
            Your role comes from your firm's record, not from this form.{' '}
            <Link href="/"><a>Back to the overview</a></Link>
          </p>
        </form>

        <PractitionerCheck />
      </div>
    </Plate>
  );
}

/**
 * The registration-number check, deliberately beside the sign-in rather than
 * inside it. It grants nothing and it is not a login. It answers one question
 * against the patent office's own roster: may this person practise today.
 */
function PractitionerCheck() {
  const [reg, setReg] = useState('');
  const [state, setState] = useState<'idle' | 'checking' | 'done'>('idle');
  const [out, setOut] = useState<any>(null);

  async function check(e: React.FormEvent) {
    e.preventDefault();
    const n = reg.replace(/\D/g, '');
    if (!n) return;
    setState('checking');
    try {
      const r = await fetch(`/api/practitioner/${n}`);
      setOut(await r.json());
    } catch {
      setOut({ result: 'unverified', reason: 'Could not reach the server.' });
    }
    setState('done');
  }

  return (
    <form className="card auth-card auth-side" onSubmit={check}>
      <div className="label">USPTO registration check</div>
      <p className="small muted" style={{ margin: '6px 0 12px', lineHeight: 1.55 }}>
        A registration number is <b>not</b> a password here. It is published by the USPTO,
        it is six digits, and it cannot be changed if it leaks. It is checked instead
        against the Office of Enrollment and Discipline roster, which is what decides
        whether an attorney seat is granted.
      </p>

      <div className="field">
        <label htmlFor="reg">Registration number</label>
        <input
          id="reg" inputMode="numeric" value={reg}
          onChange={e => setReg(e.target.value)} placeholder="e.g. 78901"
        />
      </div>

      <Button type="submit" full variant="ghost" icon="search">
        {state === 'checking' ? 'Checking the roster…' : 'Check the roster'}
      </Button>

      {state === 'done' && out && (
        <div className={`auth-note auth-note-${out.result === 'verified' ? 'ok' : out.result === 'not_found' ? 'error' : 'warn'}`}>
          <Icon name={out.result === 'verified' ? 'check' : 'alert'} size={14} />
          <span>
            {out.result === 'verified' ? (
              <>
                <b>{out.practitioner?.name}</b> — {out.practitioner?.kind}, registration{' '}
                {out.practitioner?.registration_number}. On the active roster.
              </>
            ) : (
              out.reason
            )}
          </span>
        </div>
      )}
    </form>
  );
}

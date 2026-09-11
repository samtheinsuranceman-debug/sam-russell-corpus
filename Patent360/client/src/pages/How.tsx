import { Link } from 'wouter';
import { Button, Icon, Logo } from '../components/ui';

const ROOMS = [
  {
    n: '01',
    t: 'The client',
    line: 'The disclosure arrives complete or it does not arrive.',
    body: 'Invention disclosure, conflict check, engagement letter and payment sit in one guided intake. The attorney never sees a half-built file.'
  },
  {
    n: '02',
    t: 'The attorney',
    line: 'Review and decide. Do not assemble.',
    body: 'Claims, specification and figures come off the disclosure. Prior art is screened on the same record. The attorney works the decision, not the collation.'
  },
  {
    n: '03',
    t: 'The patent office',
    line: 'The package leaves. The dates lock.',
    body: 'Forms built, fees calculated, filing submitted. Every statutory date is docketed from the receipt the moment it lands. Nothing waits for someone to remember it.'
  }
];

export function How() {
  return (
    <div className="page" style={{ minHeight: '100vh' }}>
      <header className="opt-nav">
        <Link href="/"><a aria-label="Patent360 home"><Logo /></a></Link>
        <nav className="row" style={{ gap: 24 }}>
          <Link href="/how"><a>How it works</a></Link>
          <a className="hide-sm" href="/#system">The system</a>
          <a className="hide-sm" href="/#trust">Security</a>
          <Link href="/login"><a><Button variant="ghost" size="sm">Sign in</Button></a></Link>
        </nav>
      </header>

      <main className="wrap-narrow" style={{ padding: '72px 24px 96px' }}>
        <span className="hero-eyebrow"><Icon name="lock" size={13} /> Patent prosecution, end to end</span>
        <h1 className="display" style={{ fontSize: 'clamp(36px, 6vw, 64px)', margin: '14px 0 16px' }}>
          Three rooms. <em style={{ color: 'var(--accent-400)', fontStyle: 'italic' }}>One spine.</em>
        </h1>
        <p className="opt-sub" style={{ maxWidth: '52ch' }}>
          The file moves from client to attorney to patent office inside one system. That is the whole product.
        </p>

        <div style={{ display: 'grid', gap: 18, marginTop: 48 }}>
          {ROOMS.map(r => (
            <article className="card" key={r.n} style={{ padding: '28px 28px 24px' }}>
              <div className="row" style={{ gap: 16, alignItems: 'baseline', marginBottom: 10 }}>
                <span className="mono" style={{ color: 'var(--accent-400)' }}>{r.n}</span>
                <h2 className="display" style={{ fontSize: 28, margin: 0 }}>{r.t}</h2>
              </div>
              <p style={{ color: 'var(--text-head)', fontWeight: 600, marginBottom: 8 }}>{r.line}</p>
              <p className="muted" style={{ margin: 0, maxWidth: '62ch' }}>{r.body}</p>
            </article>
          ))}
        </div>

        <div style={{ marginTop: 40 }}>
          <Link href="/login"><a><Button size="lg" icon="arrow">Open the workbench</Button></a></Link>
        </div>
      </main>
    </div>
  );
}

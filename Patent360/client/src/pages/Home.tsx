import { Link } from 'wouter';
import { Plate } from '../components/Plate';
import { Button, Icon, Logo } from '../components/ui';

/**
 * The homepage: option 1, in green.
 *
 * Plates run the length of the page rather than sitting only behind the hero,
 * and every section butts directly against the next so there is never a black
 * gap between two cities. Type always sits on a scrim, never on raw image.
 */

const STAGES = [
  { n: '01', t: 'The client', b: 'Invention disclosure, conflict check, engagement letter and payment collected in one guided intake. Nothing reaches an attorney half-finished.' },
  { n: '02', t: 'The attorney', b: 'Claims, specification and figures assembled from the disclosure. Prior art surfaced and cleared. The attorney reviews and decides instead of assembling.' },
  { n: '03', t: 'The patent office', b: 'Forms built, fees calculated, filing packaged and submitted. Every date docketed the moment the receipt lands.' }
];

const FEATURES = [
  { icon: 'inbox', title: 'Guided intake', body: 'One path from disclosure to signed engagement. The file arrives complete or it does not arrive.' },
  { icon: 'pen', title: 'Drafting workbench', body: 'Claim sets, specification and figure callouts in one editor, with numbering kept consistent across the whole document.' },
  { icon: 'search', title: 'Prior-art search', body: 'Search, screen and build the disclosure statement, with every reference and its citation trail kept on the file.' },
  { icon: 'clock', title: 'Docketing that cannot slip', body: 'Every statutory and firm date computed from the filing receipt, with escalation before the window closes.' },
  { icon: 'alert', title: 'Office-action workflow', body: 'Rejections parsed by ground, mapped to claims, and routed to the response that answers them.' },
  { icon: 'chart', title: 'Evidence of the work', body: 'Throughput, cycle time and attorney hours per file, measured from what actually happened in the system.' }
];

const ROLES = [
  { r: 'Client', d: 'Their own matters, documents and invoices. Nothing else exists to them.' },
  { r: 'Paralegal', d: 'Drafting, prior art, docketing and intake across assigned clients.' },
  { r: 'Attorney', d: 'Everything a paralegal sees, plus filing authority and settings.' },
  { r: 'Administrator', d: 'Team, permissions, integrations and the audit log.' }
];

function Nav() {
  return (
    <header className="opt-nav">
      <Link href="/"><a aria-label="Patent360 home"><Logo /></a></Link>
      <nav className="row" style={{ gap: 24 }}>
        <a className="hide-sm" href="#how">How it works</a>
        <a className="hide-sm" href="#system">The system</a>
        <a className="hide-sm" href="#trust">Security</a>
        <Link href="/login"><a><Button variant="ghost" size="sm">Sign in</Button></a></Link>
      </nav>
    </header>
  );
}

export function Home() {
  return (
    <div className="page opt-page">
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <Plate name="p360-skyline" accent="green" scrim="left" focus="left 32%">
        <div className="opt-shell">
          <Nav />
          <div className="opt-hero-left">
            <span className="hero-eyebrow"><Icon name="lock" size={13} /> Patent prosecution, end to end</span>
            <h1 className="opt-h1-left opt-h1">Client to attorney<br />to patent office.<br /><em className="glow-accent">Turnkey.</em></h1>
            <p className="opt-sub opt-sub-left">One system runs the whole file. Attorneys get their hours back. Clients get a predictable result.</p>
            <div className="row" style={{ gap: 12, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
              <Link href="/login"><a><Button size="lg" icon="arrow">Open the workbench</Button></a></Link>
              <a href="#how"><Button size="lg" variant="ghost">See how it works</Button></a>
            </div>
            <div className="opt-stage-rail">
              <span>01 The client</span>
              <span>02 The attorney</span>
              <span>03 The patent office</span>
            </div>
          </div>
        </div>
      </Plate>

      {/* ── The three stages, lifted over the plate edge ────────────────── */}
      <section id="how" className="home-band">
        <div className="wrap-narrow opt-lift">
          <div className="opt-stages">
            {STAGES.map(s => (
              <div className="opt-stage" key={s.n}>
                <span className="opt-stage-n mono">{s.n}</span>
                <div><h3>{s.t}</h3><p>{s.b}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What the system does, over the canyon ───────────────────────── */}
      <Plate name="p360-canyon" accent="green" scrim="full" focus="center 40%" zoom={false}>
        <section id="system" className="home-section">
          <div className="wrap-narrow">
            <div className="section-head">
              <h2 className="display" style={{ color: '#fff' }}>Everything the file needs, in one place</h2>
              <p style={{ color: 'rgba(234,242,251,0.78)' }}>
                No copying between a docketing tool, a drafting tool, a search tool and a billing tool.
                One record, one timeline, one audit trail.
              </p>
            </div>
            <div className="grid-3">
              {FEATURES.map(f => (
                <div className="card hoverable feature home-card" key={f.title}>
                  <div className="feature-icon"><Icon name={f.icon} size={19} /></div>
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Plate>

      {/* ── The claim, over the interchange ─────────────────────────────── */}
      <Plate name="p360-interchange" accent="green" scrim="band" focus="center 52%">
        <section className="home-quote">
          <div className="wrap-narrow" style={{ textAlign: 'center' }}>
            <h2 className="display home-quote-text">
              The file moves whether or not<br />anyone chases it.
            </h2>
            <p className="opt-sub" style={{ marginBottom: 0 }}>
              Intake that completes itself. Drafting that keeps its own numbering. Dates that cannot quietly pass.
            </p>
          </div>
        </section>
      </Plate>

      {/* ── Access, over the aerial grid ────────────────────────────────── */}
      <Plate name="p360-aerial" accent="green" scrim="full" focus="center 48%" zoom={false}>
        <section id="trust" className="home-section">
          <div className="wrap-narrow">
            <div className="section-head">
              <h2 className="display" style={{ color: '#fff' }}>Access is decided before anyone signs in</h2>
              <p style={{ color: 'rgba(234,242,251,0.78)' }}>
                Four roles, least privilege by default. A client sees only their own matters.
                Every read and every write is recorded.
              </p>
            </div>
            <div className="grid-4">
              {ROLES.map(x => (
                <div className="card feature home-card" key={x.r}>
                  <div className="label">{x.r}</div>
                  <p style={{ marginTop: 10 }}>{x.d}</p>
                </div>
              ))}
            </div>
            <div className="card home-card" style={{ marginTop: 16 }}>
              <div className="row" style={{ gap: 26 }}>
                {['Single sign-on', 'Two-factor enforced for filing', 'Per-matter access lists', 'Immutable audit log', 'Encrypted at rest'].map(t => (
                  <span className="row small" key={t} style={{ gap: 7 }}>
                    <span style={{ color: 'var(--accent-400)' }}><Icon name="check" size={14} /></span>{t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </Plate>

      {/* ── Close, over the harbour ─────────────────────────────────────── */}
      <Plate name="p360-harbor" accent="green" scrim="bottom" focus="center 36%">
        <section className="home-close">
          <div className="wrap-narrow" style={{ textAlign: 'center' }}>
            <h2 className="display home-quote-text" style={{ fontSize: 'clamp(26px,4vw,46px)' }}>
              Open the workbench
            </h2>
            <p className="opt-sub">See the whole file in one place, from the first disclosure to the issued patent.</p>
            <Link href="/login"><a><Button size="lg" icon="arrow">Open the workbench</Button></a></Link>
          </div>
        </section>
      </Plate>

      <footer className="foot home-foot">
        <div className="wrap">
          <div className="foot-cols">
            <div>
              <Logo size={24} />
              <p style={{ marginTop: 12, maxWidth: '34ch' }}>Client to attorney to patent office. Turnkey.</p>
            </div>
            <div>
              <div className="label" style={{ marginBottom: 10 }}>Product</div>
              <a href="#how">How it works</a><a href="#system">The system</a><a href="#trust">Security</a>
            </div>
            <div>
              <div className="label" style={{ marginBottom: 10 }}>Firm</div>
              <a href="#">Onboarding</a><a href="#">Data migration</a><a href="#">Support</a>
            </div>
            <div>
              <div className="label" style={{ marginBottom: 10 }}>Legal</div>
              <a href="#">Terms</a><a href="#">Privacy</a><a href="#">Confidentiality</a>
            </div>
          </div>
          <div className="divider" />
          <div className="spread small">
            <span>Patent360. Patent-pending technology.</span>
            <span className="mono">Not legal advice.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

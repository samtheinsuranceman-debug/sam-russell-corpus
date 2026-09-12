/**
 * Ten homepage treatments over the photographic city plates.
 *
 * Same slogan and the same three stages in every one, so the comparison is
 * about composition and feel rather than copy. Reachable at /options?v=1..10
 * and ?accent=green to see any of them in green.
 */
import type { ReactElement } from 'react';
import { Plate, type PlateName } from '../components/Plate';
import { Button, Icon, Logo } from '../components/ui';

const HEAD_A = 'Client to attorney to';
const HEAD_B = 'patent office.';
const TURN = 'Turnkey.';
const SUB = 'One system runs the whole file. Attorneys get their hours back. Clients get a predictable result.';

const STAGES = [
  { n: '01', t: 'The client', b: 'Disclosure, conflict check and engagement in one guided intake.' },
  { n: '02', t: 'The attorney', b: 'Claims, specification and prior art assembled. The attorney decides.' },
  { n: '03', t: 'The patent office', b: 'Forms, fees, filing, and every date docketed from the receipt.' }
];

function Nav({ light = false }: { light?: boolean }) {
  return (
    <header className={`opt-nav${light ? ' opt-nav-light' : ''}`}>
      <Logo />
      <nav className="row" style={{ gap: 24 }}>
        <a className="hide-sm" href="#">How it works</a>
        <a className="hide-sm" href="#">The system</a>
        <a className="hide-sm" href="#">Security</a>
        <Button variant="ghost" size="sm" onClick={() => (window.location.href = '/login')}>Sign in</Button>
      </nav>
    </header>
  );
}

function Cta({ size = 'lg' as 'md' | 'lg' }) {
  return (
    <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
      <Button size={size} icon="arrow" onClick={() => (window.location.href = '/login')}>Open the workbench</Button>
      <Button size={size} variant="ghost" onClick={() => (window.location.href = '/how')}>See how it works</Button>
    </div>
  );
}

function StageRow({ overlay = false }: { overlay?: boolean }) {
  return (
    <div className={`opt-stages${overlay ? ' opt-stages-overlay' : ''}`}>
      {STAGES.map(s => (
        <div className="opt-stage" key={s.n}>
          <span className="opt-stage-n mono">{s.n}</span>
          <div>
            <h3>{s.t}</h3>
            <p>{s.b}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

type Opt = { id: number; name: string; note: string; plate: PlateName; render: (a: 'blue' | 'green') => ReactElement };

export const OPTIONS: Opt[] = [
  {
    id: 1, name: 'Pinnacle, centred', plate: 'p360-pinnacle',
    note: 'The house composition. Full-bleed skyline, headline dead centre, the three stages riding up over the bottom of the plate.',
    render: a => (
      <>
        <Plate name="p360-pinnacle" accent={a} scrim="bottom" focus="center 42%">
          <div className="opt-shell">
            <Nav />
            <div className="opt-center">
              <span className="hero-eyebrow"><Icon name="lock" size={13} /> Patent prosecution, end to end</span>
              <h1 className="opt-h1">{HEAD_A}<br />{HEAD_B} <em>{TURN}</em></h1>
              <p className="opt-sub">{SUB}</p>
              <Cta />
            </div>
          </div>
        </Plate>
        <div className="wrap-narrow opt-lift"><StageRow /></div>
      </>
    )
  },
  {
    id: 2, name: 'Aerial grid, low left', plate: 'p360-aerial',
    note: 'A city seen from above, millions of lights running to the horizon. Type anchored bottom-left so the grid stays the subject.',
    render: a => (
      <Plate name="p360-aerial" accent={a} scrim="left" focus="center 46%">
        <div className="opt-shell">
          <Nav />
          <div className="opt-low-left">
            <span className="hero-eyebrow"><Icon name="lock" size={13} /> Patent prosecution, end to end</span>
            <h1 className="opt-h1 opt-h1-left">{HEAD_A}<br />{HEAD_B} <em>{TURN}</em></h1>
            <p className="opt-sub opt-sub-left">{SUB}</p>
            <Cta />
          </div>
        </div>
      </Plate>
    )
  },
  {
    id: 3, name: 'Canyon, split screen', plate: 'p360-canyon',
    note: 'Looking straight up a street canyon on the right, the argument on a clean dark panel at left. The most readable of the set.',
    render: a => (
      <div className="opt-split">
        <div className="opt-split-text">
          <Nav light />
          <div>
            <span className="hero-eyebrow"><Icon name="lock" size={13} /> Patent prosecution, end to end</span>
            <h1 className="opt-h1 opt-h1-left" style={{ fontSize: 'clamp(34px,4.4vw,60px)' }}>{HEAD_A} {HEAD_B} <em>{TURN}</em></h1>
            <p className="opt-sub opt-sub-left">{SUB}</p>
            <Cta />
            <div className="opt-split-stages">
              {STAGES.map(s => (
                <div key={s.n} className="row" style={{ gap: 10, marginTop: 12 }}>
                  <span className="opt-stage-n mono">{s.n}</span>
                  <span className="small" style={{ color: 'var(--text-head)' }}>{s.t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Plate name="p360-canyon" accent={a} scrim="none" focus="center 38%" />
      </div>
    )
  },
  {
    id: 4, name: 'Interchange, dark band', plate: 'p360-interchange',
    note: 'Light trails of traffic above and below, the headline in a band of calm across the middle. Motion framing stillness.',
    render: a => (
      <Plate name="p360-interchange" accent={a} scrim="band" focus="center 50%">
        <div className="opt-shell">
          <Nav />
          <div className="opt-band">
            <span className="hero-eyebrow"><Icon name="lock" size={13} /> Patent prosecution, end to end</span>
            <h1 className="opt-h1" style={{ fontSize: 'clamp(32px,5.4vw,62px)' }}>{HEAD_A} {HEAD_B} <em>{TURN}</em></h1>
            <p className="opt-sub">{SUB}</p>
            <Cta size="md" />
          </div>
        </div>
      </Plate>
    )
  },
  {
    id: 5, name: 'Harbour, on the waterline', plate: 'p360-harbor',
    note: 'The skyline doubled in still water. The headline sits on the waterline, which gives the type a horizon to rest on.',
    render: a => (
      <Plate name="p360-harbor" accent={a} scrim="bottom" focus="center 34%">
        <div className="opt-shell">
          <Nav />
          <div className="opt-waterline">
            <h1 className="opt-h1">{HEAD_A} {HEAD_B} <em>{TURN}</em></h1>
            <p className="opt-sub">{SUB}</p>
            <Cta />
            <div className="opt-ticks">
              {['Intake', 'Drafting', 'Prior art', 'Filing', 'Docketing'].map(t => (
                <span key={t} className="opt-tick"><span className="opt-tick-dot" />{t}</span>
              ))}
            </div>
          </div>
        </div>
      </Plate>
    )
  },
  {
    id: 6, name: 'Glass card over the city', plate: 'p360-pinnacle-b',
    note: 'The plate runs free and the argument sits in a frosted panel over it. Closest to the workbench interface itself.',
    render: a => (
      <Plate name="p360-pinnacle-b" accent={a} scrim="none" focus="center 44%">
        <div className="opt-shell">
          <Nav />
          <div className="opt-center">
            <div className="opt-glass">
              <span className="hero-eyebrow"><Icon name="lock" size={13} /> Patent prosecution, end to end</span>
              <h1 className="opt-h1" style={{ fontSize: 'clamp(30px,4.6vw,56px)' }}>{HEAD_A} {HEAD_B} <em>{TURN}</em></h1>
              <p className="opt-sub">{SUB}</p>
              <Cta />
            </div>
          </div>
        </div>
      </Plate>
    )
  },
  {
    id: 7, name: 'City inside the type', plate: 'p360-aerial-b',
    note: 'The word Turnkey is cut out of the city itself. The boldest option, and the one that photographs best as a share card.',
    render: a => (
      <Plate name="p360-aerial-b" accent={a} scrim="full" focus="center 50%">
        <div className="opt-shell">
          <Nav />
          <div className="opt-center">
            <span className="hero-eyebrow"><Icon name="lock" size={13} /> Patent prosecution, end to end</span>
            <h1 className="opt-h1 opt-cut" style={{ fontSize: 'clamp(40px,9vw,120px)', lineHeight: 0.92 }}>
              TURNKEY
            </h1>
            <p className="opt-sub" style={{ marginTop: 18 }}>Client to attorney to patent office. {SUB}</p>
            <Cta />
          </div>
        </div>
      </Plate>
    )
  },
  {
    id: 8, name: 'Left rail with a live file', plate: 'p360-interchange',
    note: 'Argument at left, and at right a file visibly moving through its stages. The most literal answer to many moving parts.',
    render: a => (
      <Plate name="p360-interchange" accent={a} scrim="left" focus="70% 46%">
        <div className="opt-shell">
          <Nav />
          <div className="opt-rail">
            <div>
              <span className="hero-eyebrow"><Icon name="lock" size={13} /> Patent prosecution, end to end</span>
              <h1 className="opt-h1 opt-h1-left" style={{ fontSize: 'clamp(32px,4.4vw,58px)' }}>{HEAD_A} {HEAD_B} <em>{TURN}</em></h1>
              <p className="opt-sub opt-sub-left">{SUB}</p>
              <Cta />
            </div>
            <div className="opt-live card">
              <div className="label">A file, right now</div>
              {[
                { s: 'Disclosure received', d: 'done' }, { s: 'Conflict check cleared', d: 'done' },
                { s: 'Claims drafted', d: 'done' }, { s: 'Attorney review', d: 'live' },
                { s: 'Filed with the office', d: 'next' }, { s: 'Dates docketed', d: 'next' }
              ].map(r => (
                <div className="opt-live-row" key={r.s}>
                  <span className={`opt-live-dot opt-live-${r.d}`} />
                  <span className="small" style={{ color: r.d === 'next' ? 'var(--text-muted)' : 'var(--text-head)' }}>{r.s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Plate>
    )
  },
  {
    id: 9, name: 'Canyon, stages over the plate', plate: 'p360-canyon',
    note: 'One tall image with the three stages written straight onto it, no cards. The quietest and most editorial.',
    render: a => (
      <Plate name="p360-canyon" accent={a} scrim="full" focus="center 42%">
        <div className="opt-shell">
          <Nav />
          <div className="opt-center" style={{ paddingBottom: 0 }}>
            <h1 className="opt-h1">{HEAD_A} {HEAD_B} <em>{TURN}</em></h1>
            <p className="opt-sub">{SUB}</p>
          </div>
          <div className="wrap-narrow" style={{ paddingBottom: 56 }}><StageRow overlay /></div>
        </div>
      </Plate>
    )
  },
  {
    id: 10, name: 'Two plates, headline between', plate: 'p360-pinnacle',
    note: 'A skyline band above and an aerial band below, with the headline in the dark seam. Gives the page a horizon and a floor.',
    render: a => (
      <div className="opt-stack">
        <Plate name="p360-pinnacle" accent={a} scrim="bottom" focus="center 36%">
          <div className="opt-shell"><Nav /></div>
        </Plate>
        <div className="opt-seam">
          <span className="hero-eyebrow"><Icon name="lock" size={13} /> Patent prosecution, end to end</span>
          <h1 className="opt-h1" style={{ fontSize: 'clamp(30px,5vw,58px)' }}>{HEAD_A} {HEAD_B} <em>{TURN}</em></h1>
          <p className="opt-sub">{SUB}</p>
          <Cta />
        </div>
        <Plate name="p360-aerial" accent={a} scrim="none" focus="center 50%" />
      </div>
    )
  },
  {
    id: 11, name: 'Skyline, twin masts', plate: 'p360-skyline',
    note: 'Two lit masts against a bruised green sky, the city stepping down into haze beneath them. The whole upper left is empty, so the headline sits in the sky rather than on top of the buildings — the only plate in the set where type and subject never overlap.',
    render: a => (
      <Plate name="p360-skyline" accent={a} scrim="left" focus="center 38%">
        <div className="opt-shell">
          <Nav />
          <div className="opt-low-left">
            <span className="hero-eyebrow"><Icon name="lock" size={13} /> Patent prosecution, end to end</span>
            <h1 className="opt-h1 opt-h1-left">{HEAD_A}<br />{HEAD_B} <em>{TURN}</em></h1>
            <p className="opt-sub opt-sub-left">{SUB}</p>
            <Cta />
          </div>
        </div>
      </Plate>
    )
  }
];

export function Options() {
  const params = new URLSearchParams(window.location.search);
  const v = Math.min(OPTIONS.length, Math.max(1, Number(params.get('v') ?? 1)));
  const accent = params.get('accent') === 'green' ? 'green' : 'blue';
  const opt = OPTIONS[v - 1]!;
  if (accent === 'green') document.documentElement.setAttribute('data-accent', 'green');
  return (
    <div className="page opt-page">
      <div className="opt-tag">
        <span className="mono">OPTION {String(opt.id).padStart(2, '0')}</span>
        <span>{opt.name}</span>
      </div>
      {opt.render(accent)}
    </div>
  );
}

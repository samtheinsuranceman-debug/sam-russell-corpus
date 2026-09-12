/**
 * Twenty homepage treatments on one plate.
 *
 * Every variant keeps the same words and the same image. What changes is the
 * type system, the way the headline is set, the layout, and the texture laid
 * over the photograph. Reachable at /v?n=1..20.
 */
import { Button, Icon, Logo } from '../components/ui';

type Layout = 'centre' | 'low-left' | 'framed' | 'split' | 'stackline' | 'band' | 'corner';
type Head = 'full' | 'stack' | 'huge';

type Variant = {
  n: number;
  name: string;
  type: string;       // the type system, named
  texture: string;    // the texture, named
  display: string;    // display family
  ui: string;         // interface family
  layout: Layout;
  head: Head;
  tx: string[];       // texture overlay classes
  cls: string;        // per-variant class for the finer knobs
};

export const VARIANTS: Variant[] = [
  { n: 1,  name: 'Billboard',        type: 'Anton + DM Sans',                texture: 'Scanlines',            display: "'Anton'",                 ui: "'DM Sans'",          layout: 'centre',    head: 'stack', tx: ['tx-scan', 'tx-vig'],        cls: 'v1' },
  { n: 2,  name: 'Broadsheet',       type: 'Playfair-weight serif + Archivo', texture: 'Film grain and rules', display: "'Instrument Serif'",      ui: "'Archivo'",          layout: 'framed',    head: 'full',  tx: ['tx-noise', 'tx-vig'],       cls: 'v2' },
  { n: 3,  name: 'Marquee',          type: 'Bebas Neue + Plex Mono',         texture: 'Halftone dots',        display: "'Bebas Neue'",            ui: "'IBM Plex Mono'",    layout: 'band',      head: 'stack', tx: ['tx-halftone'],              cls: 'v3' },
  { n: 4,  name: 'Kinetic',          type: 'Syne + Space Grotesk',           texture: 'Chromatic split',      display: "'Syne'",                  ui: "'Space Grotesk'",    layout: 'low-left',  head: 'huge',  tx: ['tx-chroma', 'tx-scan'],     cls: 'v4' },
  { n: 5,  name: 'Atelier',          type: 'Instrument Serif italic + Figtree', texture: 'Vignette and haze', display: "'Instrument Serif'",      ui: "'Figtree'",          layout: 'centre',    head: 'full',  tx: ['tx-vig', 'tx-leak'],        cls: 'v5' },
  { n: 6,  name: 'Brutalist',        type: 'Archivo Black + Chivo Mono',     texture: 'Hard blocks',          display: "'Archivo Black'",         ui: "'Chivo Mono'",       layout: 'corner',    head: 'stack', tx: ['tx-grid'],                  cls: 'v6' },
  { n: 7,  name: 'Neon',             type: 'Unbounded + DM Sans',            texture: 'Glow bloom',           display: "'Unbounded'",             ui: "'DM Sans'",          layout: 'centre',    head: 'huge',  tx: ['tx-glow', 'tx-scan'],       cls: 'v7' },
  { n: 8,  name: 'Blueprint',        type: 'Big Shoulders + Barlow Condensed', texture: 'Drafting grid',      display: "'Big Shoulders Display'", ui: "'Barlow Condensed'", layout: 'framed',    head: 'stack', tx: ['tx-grid', 'tx-noise'],      cls: 'v8' },
  { n: 9,  name: 'Literary',         type: 'Newsreader italic + Figtree',    texture: 'Light leak',           display: "'Newsreader'",            ui: "'Figtree'",          layout: 'low-left',  head: 'full',  tx: ['tx-leak', 'tx-noise'],      cls: 'v9' },
  { n: 10, name: 'Terminal',         type: 'Space Grotesk + Space Mono',     texture: 'Dot matrix',           display: "'Space Grotesk'",         ui: "'Space Mono'",       layout: 'split',     head: 'full',  tx: ['tx-matrix'],                cls: 'v10' },
  { n: 11, name: 'Offset',           type: 'Bricolage Grotesque + Inter',    texture: 'Outline echo',         display: "'Bricolage Grotesque'",   ui: "'DM Sans'",          layout: 'centre',    head: 'huge',  tx: ['tx-noise'],                 cls: 'v11' },
  { n: 12, name: 'Luxe',             type: 'DM Serif Display + Manrope',     texture: 'Gold rules',           display: "'DM Serif Display'",      ui: "'Manrope'",          layout: 'framed',    head: 'full',  tx: ['tx-vig'],                   cls: 'v12' },
  { n: 13, name: 'Poster',           type: 'Oswald + Public Sans',           texture: 'Stamp and stencil',    display: "'Oswald'",                ui: "'Public Sans'",      layout: 'band',      head: 'stack', tx: ['tx-stamp', 'tx-noise'],     cls: 'v13' },
  { n: 14, name: 'House',            type: 'Cormorant Garamond + DM Sans',   texture: 'Heavy patent imprint', display: "'Cormorant Garamond'",    ui: "'DM Sans'",          layout: 'centre',    head: 'full',  tx: ['tx-imprint', 'tx-vig'],     cls: 'v14' },
  { n: 15, name: 'Monolith',         type: 'Sora, one family',               texture: 'Gradient wash',        display: "'Sora'",                  ui: "'Sora'",             layout: 'low-left',  head: 'stack', tx: ['tx-wash'],                  cls: 'v15' },
  { n: 16, name: 'Letterpress',      type: 'Libre Caslon Display + Public Sans', texture: 'Pressed and embossed', display: "'Libre Caslon Display'", ui: "'Public Sans'",   layout: 'centre',    head: 'full',  tx: ['tx-noise', 'tx-vig'],       cls: 'v16' },
  { n: 17, name: 'Cutout',           type: 'Outfit Black + Outfit',          texture: 'City inside the type', display: "'Outfit'",                ui: "'Outfit'",           layout: 'centre',    head: 'huge',  tx: ['tx-vig'],                   cls: 'v17' },
  { n: 18, name: 'Glitch',           type: 'Rubik Mono One + Rubik',         texture: 'Signal break',         display: "'Rubik Mono One'",        ui: "'Rubik'",            layout: 'corner',    head: 'huge',  tx: ['tx-glitch', 'tx-scan'],     cls: 'v18' },
  { n: 19, name: 'Swiss',            type: 'Familjen Grotesk, one family',   texture: 'Rule frame',           display: "'Familjen Grotesk'",      ui: "'Familjen Grotesk'", layout: 'stackline', head: 'stack', tx: ['tx-noise'],                 cls: 'v19' },
  { n: 20, name: 'Refined house',    type: 'Fraunces + DM Sans',             texture: 'Imprint and grain',    display: "'Fraunces'",              ui: "'DM Sans'",          layout: 'centre',    head: 'full',  tx: ['tx-imprint', 'tx-noise'],   cls: 'v20' }
];

const SUB = 'One system runs the whole file. Attorneys get their hours back. Clients get a predictable result.';

function Headline({ head }: { head: Head }) {
  if (head === 'stack') {
    return (
      <h1 className="vh">
        <span className="vh-l">Client</span>
        <span className="vh-l vh-dim">to attorney</span>
        <span className="vh-l vh-dim">to patent office</span>
        <span className="vh-l vh-key">Turnkey.</span>
      </h1>
    );
  }
  if (head === 'huge') {
    return (
      <h1 className="vh vh-huge">
        <span className="vh-kick">Client to attorney to patent office</span>
        <span className="vh-key">TURNKEY</span>
      </h1>
    );
  }
  return <h1 className="vh vh-full">Client to attorney to patent office. <em>Turnkey.</em></h1>;
}

function Bar() {
  return (
    <header className="v-nav">
      <Logo />
      <nav className="row" style={{ gap: 22 }}>
        <a className="hide-sm" href="#">How it works</a>
        <a className="hide-sm" href="#">The system</a>
        <a className="hide-sm" href="#">Security</a>
        <Button variant="ghost" size="sm" onClick={() => (window.location.href = '/login')}>Sign in</Button>
      </nav>
    </header>
  );
}

function Cta() {
  return (
    <div className="row v-cta" style={{ gap: 12, flexWrap: 'wrap' }}>
      <Button size="lg" icon="arrow" onClick={() => (window.location.href = '/login')}>Open the workbench</Button>
      <Button size="lg" variant="ghost" onClick={() => (window.location.href = '/how')}>See how it works</Button>
    </div>
  );
}

function Stages() {
  return (
    <div className="v-stages">
      {[['01', 'The client'], ['02', 'The attorney'], ['03', 'The patent office']].map(([n, t]) => (
        <div className="v-stage" key={n}><span className="v-stage-n">{n}</span><span>{t}</span></div>
      ))}
    </div>
  );
}

function Body({ v }: { v: Variant }) {
  const core = (
    <>
      <span className="v-eyebrow"><Icon name="lock" size={12} /> Patent prosecution, end to end</span>
      <Headline head={v.head} />
      <p className="v-sub">{SUB}</p>
      <Cta />
    </>
  );

  switch (v.layout) {
    case 'low-left':  return <div className="v-lowleft">{core}<Stages /></div>;
    case 'framed':    return <div className="v-framed"><div className="v-frame">{core}</div></div>;
    case 'band':      return <div className="v-bandwrap"><div className="v-band">{core}</div><Stages /></div>;
    case 'split':     return <div className="v-split"><div className="v-split-in">{core}</div><div className="v-split-side"><Stages /></div></div>;
    case 'stackline': return <div className="v-stackline"><div className="v-rule" />{core}<div className="v-rule" /><Stages /></div>;
    case 'corner':    return <div className="v-corner">{core}<Stages /></div>;
    default:          return <div className="v-centre">{core}<Stages /></div>;
  }
}

export function Variants() {
  const params = new URLSearchParams(window.location.search);
  const n = Math.min(20, Math.max(1, Number(params.get('n') ?? 1)));
  const v = VARIANTS[n - 1]!;
  return (
    <div
      className={`v-page ${v.cls}`}
      style={{ ['--vd' as string]: v.display, ['--vu' as string]: v.ui }}
    >
      <img className="v-plate" src="/plates/p360-emerald.webp" alt="" aria-hidden="true" />
      <div className="v-tint" />
      {v.tx.map(t => <div className={`v-tx ${t}`} key={t} aria-hidden="true" />)}
      <div className="v-content">
        <Bar />
        <Body v={v} />
      </div>
      <div className="v-tag">
        <span className="mono">{String(v.n).padStart(2, '0')}</span>
        <strong>{v.name}</strong>
        <span>{v.type}</span>
        <span className="v-tag-dim">{v.texture}</span>
      </div>
    </div>
  );
}

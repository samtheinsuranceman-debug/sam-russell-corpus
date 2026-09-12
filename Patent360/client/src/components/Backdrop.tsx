/**
 * The Patent360 backdrop: four painted layers, all vector, a few kilobytes total.
 *
 *   1. Sky      — vertical wash plus one wide accent bloom that breathes
 *   2. City     — three skyline bands, windows lit accent with one in nine green
 *   3. Imprint  — patent-drawing linework pressed over the glass (the signature)
 *   4. Grain    — turbulence noise so the gradients never band
 *
 * Everything is deterministic: a seeded generator means the skyline is identical
 * on every render and every machine, so screenshots and snapshots are stable.
 */

import type { ReactElement } from 'react';

/** Mulberry32 — small, fast, deterministic. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Band = { seed: number; count: number; minH: number; maxH: number; opacity: number; blur: number; lit: number };

function Skyline({ seed, count, minH, maxH, opacity, blur, lit }: Band) {
  const rand = rng(seed);
  const W = 1600;
  const H = 420;
  const towers: ReactElement[] = [];
  let x = -30;

  for (let i = 0; i < count && x < W + 40; i++) {
    const w = 26 + rand() * 74;
    const h = minH + rand() * (maxH - minH);
    const y = H - h;
    towers.push(<rect key={`t${i}`} x={x} y={y} width={w} height={h} fill="#01060e" />);

    // A spire on a few of the taller towers.
    if (h > maxH * 0.82 && rand() > 0.62) {
      towers.push(<rect key={`s${i}`} x={x + w / 2 - 1.5} y={y - 26 - rand() * 22} width={3} height={28} fill="#01060e" />);
      towers.push(<circle key={`b${i}`} cx={x + w / 2} cy={y - 30} r={2} fill="var(--alert)" opacity={0.75} />);
    }

    // Lit windows on a grid, with gaps so it reads as occupancy not wallpaper.
    const cols = Math.max(1, Math.floor((w - 10) / 11));
    const rows = Math.max(1, Math.floor((h - 14) / 15));
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (rand() > lit) continue;
        const green = rand() > 0.89; // roughly one in nine stays green
        towers.push(
          <rect
            key={`w${i}-${c}-${r}`}
            x={x + 6 + c * 11}
            y={y + 9 + r * 15}
            width={4.5}
            height={6.5}
            fill={green ? 'var(--signal)' : 'var(--accent-400)'}
            opacity={0.12 + rand() * 0.58}
          />
        );
      }
    }
    x += w + 5 + rand() * 16;
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: '62%',
        opacity, filter: blur ? `blur(${blur}px)` : undefined
      }}
    >
      {towers}
    </svg>
  );
}

/** The patent-drawing imprint: outlines, leader lines, callout numerals, hatching. */
function Imprint() {
  const stroke = 'var(--accent-400)';
  return (
    <svg
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.075 }}
    >
      <defs>
        <pattern id="p360-hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="9" stroke={stroke} strokeWidth="0.8" />
        </pattern>
      </defs>
      <g fill="none" stroke={stroke} strokeWidth="1.1" strokeLinecap="round">
        {/* Figure 1 — an exploded assembly, the classic patent plate */}
        <rect x="118" y="126" width="228" height="150" rx="6" />
        <rect x="150" y="158" width="74" height="86" rx="3" fill="url(#p360-hatch)" />
        <circle cx="286" cy="200" r="34" />
        <circle cx="286" cy="200" r="15" />
        <path d="M118 276 L86 322 M346 126 L392 88" />
        <path d="M392 88 h58" />
        <circle cx="466" cy="88" r="13" />
        <path d="M86 322 h-46" />
        <circle cx="24" cy="322" r="13" />

        {/* Figure 2 — a flow diagram, which is what this product actually is */}
        <rect x="700" y="168" width="126" height="58" rx="6" />
        <rect x="892" y="168" width="126" height="58" rx="6" />
        <rect x="796" y="300" width="126" height="58" rx="6" />
        <path d="M826 197 h62 M955 226 v42 L859 300 M763 226 v42 L859 300" />
        <path d="M1018 197 h44" />
        <circle cx="1078" cy="197" r="13" />

        {/* Figure 3 — a section view with hatching */}
        <path d="M196 546 h300 v128 h-300 z" />
        <path d="M232 582 h228 v56 h-228 z" fill="url(#p360-hatch)" />
        <path d="M196 546 L150 500 M496 674 l52 46" />
        <circle cx="136" cy="486" r="13" />
        <path d="M640 520 q90 -76 182 0 t182 0" />
        <path d="M640 600 q90 -76 182 0 t182 0" />
        <path d="M1004 520 h58" />
        <circle cx="1078" cy="520" r="13" />
      </g>
      <g
        fill="var(--accent-300)"
        fontFamily="var(--font-mono)"
        fontSize="13"
        textAnchor="middle"
        dominantBaseline="central"
      >
        <text x="466" y="88">12</text>
        <text x="24" y="322">4</text>
        <text x="1078" y="197">28</text>
        <text x="136" y="486">7</text>
        <text x="1078" y="520">33</text>
      </g>
      <g
        fill="var(--accent-300)"
        fontFamily="var(--font-mono)"
        fontSize="15"
        letterSpacing="2"
        opacity="0.8"
      >
        <text x="118" y="104">FIG. 1</text>
        <text x="700" y="146">FIG. 2</text>
        <text x="196" y="524">FIG. 3</text>
      </g>
    </svg>
  );
}

export function Backdrop({ dense = false }: { dense?: boolean }) {
  return (
    <div aria-hidden="true" className="p360-backdrop" data-dense={dense ? 'true' : 'false'}>
      <div className="p360-sky" />
      <div className="p360-bloom p360-bloom-a" />
      <div className="p360-bloom p360-bloom-b" />
      <div className="p360-imprint"><Imprint /></div>
      <div className="p360-city">
        <Skyline seed={9021} count={40} minH={90} maxH={250} opacity={0.22} blur={8} lit={0.22} />
        <Skyline seed={4477} count={30} minH={120} maxH={320} opacity={0.45} blur={3} lit={0.3} />
        <Skyline seed={1315} count={22} minH={150} maxH={400} opacity={1} blur={0} lit={0.34} />
      </div>
      <div className="p360-grain" />
    </div>
  );
}

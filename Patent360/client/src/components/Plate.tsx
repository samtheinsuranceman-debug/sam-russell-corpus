/**
 * A full-bleed city plate with everything that makes it feel alive:
 *
 *   - the photographic plate itself, on a very slow Ken Burns drift
 *   - scrims top and bottom so type stays legible over any part of it
 *   - the patent-drawing imprint, which is the Patent360 signature
 *   - activity pulses: a handful of slow beacons over the skyline, so the
 *     city reads as working rather than as a still photograph
 *
 * The plate name is the file stem in /plates; the accent suffix is applied by
 * the caller so the same composition can be shown blue or green.
 */
import type { ReactNode } from 'react';

export type PlateName =
  | 'p360-pinnacle' | 'p360-pinnacle-b' | 'p360-aerial' | 'p360-aerial-b'
  | 'p360-canyon' | 'p360-harbor' | 'p360-interchange';

/** Where the activity beacons sit, in percent of the frame. */
const PULSES: Record<string, Array<[number, number, number]>> = {
  'p360-pinnacle':    [[46, 38, 0], [63, 44, 1.4], [30, 57, 2.8], [77, 62, 4.1], [54, 70, 5.5]],
  'p360-pinnacle-b':  [[42, 40, 0], [66, 48, 1.7], [28, 60, 3.2], [80, 58, 4.6]],
  'p360-aerial':      [[35, 46, 0], [58, 39, 1.2], [72, 58, 2.5], [24, 63, 3.9], [49, 72, 5.2]],
  'p360-aerial-b':    [[40, 44, 0], [62, 52, 1.6], [30, 66, 3.1], [74, 40, 4.4]],
  'p360-canyon':      [[38, 34, 0], [59, 46, 1.5], [47, 62, 3.0]],
  'p360-harbor':      [[44, 42, 0], [61, 47, 1.8], [33, 51, 3.4], [72, 44, 4.9]],
  'p360-interchange': [[36, 48, 0], [57, 41, 1.3], [68, 60, 2.9], [27, 62, 4.3]]
};

export function Plate({
  name, accent = 'blue', focus = 'center', scrim = 'bottom', zoom = true, children
}: {
  name: PlateName;
  accent?: 'blue' | 'green';
  /** object-position, so the interesting part of the frame survives cropping. */
  focus?: string;
  scrim?: 'bottom' | 'full' | 'left' | 'band' | 'none';
  zoom?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="plate">
      <img
        className={`plate-img${zoom ? ' plate-zoom' : ''}`}
        src={`/plates/${name}-${accent}.webp`}
        alt=""
        aria-hidden="true"
        style={{ objectPosition: focus }}
      />
      <div className={`plate-scrim plate-scrim-${scrim}`} />
      <Imprint />
      <div className="plate-pulses" aria-hidden="true">
        {(PULSES[name] ?? []).map(([x, y, delay], i) => (
          <span key={i} className="pulse" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${delay}s` }} />
        ))}
      </div>
      {children && <div className="plate-content">{children}</div>}
    </div>
  );
}

/** Patent figure linework, pressed over the plate. */
export function Imprint({ opacity = 0.11 }: { opacity?: number }) {
  const s = 'var(--accent-300)';
  return (
    <svg className="plate-imprint" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice"
         aria-hidden="true" style={{ opacity }}>
      <defs>
        <pattern id="pl-hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="9" stroke={s} strokeWidth="0.7" />
        </pattern>
      </defs>
      <g fill="none" stroke={s} strokeWidth="1" strokeLinecap="round">
        <rect x="76" y="112" width="214" height="142" rx="6" />
        <rect x="106" y="142" width="68" height="82" rx="3" fill="url(#pl-hatch)" />
        <circle cx="232" cy="184" r="31" /><circle cx="232" cy="184" r="13" />
        <path d="M76 254 L44 300 M290 112 L336 76 h54" /><circle cx="406" cy="76" r="12" />
        <path d="M44 300 h-34" /><circle cx="-4" cy="300" r="12" />
        <rect x="742" y="150" width="118" height="54" rx="6" />
        <rect x="926" y="150" width="118" height="54" rx="6" />
        <rect x="834" y="276" width="118" height="54" rx="6" />
        <path d="M860 177 h60 M985 204 v40 L893 276 M801 204 v40 L893 276 M1044 177 h42" />
        <circle cx="1098" cy="177" r="12" />
        <path d="M150 560 h280 v120 h-280 z" />
        <path d="M184 594 h212 v52 h-212 z" fill="url(#pl-hatch)" />
        <path d="M150 560 L108 518 M430 680 l48 42" /><circle cx="94" cy="504" r="12" />
        <path d="M612 536 q86 -72 174 0 t174 0 M612 612 q86 -72 174 0 t174 0 M960 536 h54" />
        <circle cx="1068" cy="536" r="12" />
      </g>
      <g fill={s} fontFamily="var(--font-mono)" fontSize="12" textAnchor="middle" dominantBaseline="central">
        <text x="406" y="76">12</text><text x="1098" y="177">28</text>
        <text x="94" y="504">7</text><text x="1068" y="536">33</text>
      </g>
      <g fill={s} fontFamily="var(--font-mono)" fontSize="14" letterSpacing="2" opacity="0.85">
        <text x="76" y="92">FIG. 1</text><text x="742" y="130">FIG. 2</text><text x="150" y="540">FIG. 3</text>
      </g>
    </svg>
  );
}

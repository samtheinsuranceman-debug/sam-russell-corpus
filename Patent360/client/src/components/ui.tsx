/** The Patent360 component kit. Everything the pages are built from. */
import type { ReactNode } from 'react';

/* ── Icons ─────────────────────────────────────────────────────────────── */
const PATHS: Record<string, string> = {
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  inbox: 'M3 12h5l2 3h4l2-3h5M3 12l2-7h14l2 7v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  users: 'M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM22 20v-2a4 4 0 0 0-3-3.9M16 2.1a4 4 0 0 1 0 7.8',
  pen: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  alert: 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  send: 'M22 2 11 13M22 2l-7 20-4-9-9-4z',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  chart: 'M3 3v18h18M7 15v3M12 9v9M17 5v13',
  database: 'M12 8c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3zM4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  key: 'M21 2l-2 2m-7.6 7.6a5 5 0 1 1-7 7 5 5 0 0 1 7-7zm0 0L15 8m0 0l3 3 3-3-3-3',
  plug: 'M9 2v6M15 2v6M6 8h12v4a6 6 0 0 1-12 0zM12 18v4',
  cog: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  check: 'M20 6 9 17l-5-5',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 1 1 8 0v4',
  bell: 'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0'
};

export function Icon({ name, size = 16 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name] ?? PATHS.grid!} />
    </svg>
  );
}

/* ── Logo ──────────────────────────────────────────────────────────────── */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className="p360-logo" style={{ gap: size / 3 }}>
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="14" fill="none" stroke="var(--accent-500)" strokeWidth="1.6" />
        <circle cx="16" cy="16" r="9" fill="none" stroke="var(--accent-400)" strokeWidth="1" opacity="0.6" />
        <circle cx="16" cy="16" r="3.4" fill="var(--accent-400)" />
        <path d="M16 2v5M16 25v5M2 16h5M25 16h5" stroke="var(--accent-500)" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <span className="p360-wordmark" style={{ fontSize: size * 0.72 }}>
        Patent<span>360</span>
      </span>
    </span>
  );
}

/* ── Buttons ───────────────────────────────────────────────────────────── */
export function Button({
  children, variant = 'primary', size = 'md', onClick, type = 'button', full = false, icon
}: {
  children: ReactNode;
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  type?: 'button' | 'submit';
  full?: boolean;
  icon?: string;
}) {
  return (
    <button type={type} onClick={onClick} className={`btn btn-${variant} btn-${size}${full ? ' btn-full' : ''}`}>
      {icon && <Icon name={icon} size={size === 'lg' ? 18 : 15} />}
      {children}
    </button>
  );
}

/* ── Status ────────────────────────────────────────────────────────────── */
export type Status = 'drafting' | 'filed' | 'office-action' | 'granted' | 'abandoned' | 'review';

const STATUS_META: Record<Status, { label: string; color: string }> = {
  drafting: { label: 'Drafting', color: 'var(--accent-400)' },
  review: { label: 'In review', color: 'var(--accent-300)' },
  filed: { label: 'Filed', color: 'var(--signal)' },
  'office-action': { label: 'Office action', color: 'var(--warn)' },
  granted: { label: 'Granted', color: 'var(--seal)' },
  abandoned: { label: 'Abandoned', color: 'var(--alert)' }
};

export function StatusPill({ status }: { status: Status }) {
  const meta = STATUS_META[status];
  return (
    <span className="pill" style={{ color: meta.color, borderColor: `${meta.color}44` }}>
      <span className="pill-dot" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}

/* ── Stat tile ─────────────────────────────────────────────────────────── */
export function Stat({
  label, value, unit, delta, tone = 'signal', note
}: {
  label: string; value: string; unit?: string; delta?: string;
  tone?: 'signal' | 'alert' | 'seal' | 'muted'; note?: string;
}) {
  const toneColor =
    tone === 'alert' ? 'var(--alert)' : tone === 'seal' ? 'var(--seal)' : tone === 'muted' ? 'var(--text-muted)' : 'var(--signal)';
  return (
    <div className="card hoverable stat">
      <div className="label">{label}</div>
      <div className="stat-value mono">
        {value}
        {unit && <span className="stat-unit">{unit}</span>}
      </div>
      {delta && <div className="stat-delta" style={{ color: toneColor }}>{delta}</div>}
      {note && <div className="stat-note">{note}</div>}
    </div>
  );
}

/* ── Tabs ──────────────────────────────────────────────────────────────── */
export function Tabs({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (t: string) => void }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map(t => (
        <button
          key={t}
          role="tab"
          aria-selected={t === active}
          className={`tab${t === active ? ' tab-active' : ''}`}
          onClick={() => onChange(t)}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

/* ── Section heading ───────────────────────────────────────────────────── */
export function PageHead({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h1 className="display page-title">{title}</h1>
        {sub && <p className="page-sub">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/* ── Table ─────────────────────────────────────────────────────────────── */
export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>{head.map(h => <th key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

/* ── Progress ──────────────────────────────────────────────────────────── */
export function Bar({ pct, color = 'var(--accent-500)' }: { pct: number; color?: string }) {
  return (
    <div className="bar"><div className="bar-fill" style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} /></div>
  );
}

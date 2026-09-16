const usd0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const usd2 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const money = (n: number) => (Number.isFinite(n) ? usd0.format(n) : '—');
export const money2 = (n: number) => (Number.isFinite(n) ? usd2.format(n) : '—');
export const pct = (n: number, dp = 2) => (Number.isFinite(n) ? `${n.toFixed(dp)}%` : '—');
export const num = (n: number, dp = 0) =>
  Number.isFinite(n) ? n.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp }) : '—';

/** Compact form for axis labels and dense tables: $1.4M, $850K. */
export function moneyShort(n: number): string {
  if (!Number.isFinite(n)) return '—';
  const a = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (a >= 1e9) return `${sign}$${(a / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${sign}$${(a / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `${sign}$${Math.round(a / 1e3)}K`;
  return `${sign}$${Math.round(a)}`;
}

export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

// ============================================================
// LONG TIMERS — Node's setTimeout and setInterval take a 32-bit signed
// millisecond count (about 24.8 days). Anything longer overflows, Node
// silently sets the delay to 1 ms, and the job runs in a tight loop. This
// happened in production with ZIP_DATA_DAYS=30 (2,592,000,000 ms). Every
// schedule measured in days goes through here instead.
// ============================================================
export const MAX_TIMER_MS = 2_147_483_647;

/** setTimeout for any length: sleeps in chunks the runtime accepts, then fires once. Returns a handle with clear(). */
export function longTimeout(fn: () => void, ms: number): { clear: () => void } {
  let handle: NodeJS.Timeout | null = null, cleared = false;
  const step = (remaining: number) => {
    if (cleared) return;
    const wait = Math.min(Math.max(0, remaining), MAX_TIMER_MS);
    handle = setTimeout(() => { if (cleared) return; if (remaining > MAX_TIMER_MS) step(remaining - MAX_TIMER_MS); else fn(); }, wait);
    handle.unref?.();
  };
  step(ms);
  return { clear: () => { cleared = true; if (handle) clearTimeout(handle); } };
}

/** setInterval for any length: re-arms itself after each run, so a 30- or 90-day cadence is a 30- or 90-day cadence. */
export function longInterval(fn: () => void, ms: number): { clear: () => void } {
  let current: { clear: () => void } | null = null, cleared = false;
  const arm = () => { if (cleared) return; current = longTimeout(() => { if (cleared) return; try { fn(); } finally { arm(); } }, ms); };
  arm();
  return { clear: () => { cleared = true; current?.clear(); } };
}

export const DAY_MS = 86_400_000;

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DAY_MS, MAX_TIMER_MS, longInterval, longTimeout } from "./_core/schedule";

describe("long timers", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("a 30-day interval fires after 30 days, not after one millisecond (the production loop)", () => {
    const fn = vi.fn();
    const h = longInterval(fn, 30 * DAY_MS);
    expect(30 * DAY_MS).toBeGreaterThan(MAX_TIMER_MS); // the overflow Node clamps to 1 ms
    vi.advanceTimersByTime(60_000);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(29 * DAY_MS);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(DAY_MS);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(30 * DAY_MS);
    expect(fn).toHaveBeenCalledTimes(2);
    h.clear();
    vi.advanceTimersByTime(90 * DAY_MS);
    expect(fn).toHaveBeenCalledTimes(2);
  });
  it("short delays behave like the plain timer, and a cleared timeout never fires", () => {
    const fn = vi.fn();
    longTimeout(fn, 1_000);
    vi.advanceTimersByTime(999);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
    const g = vi.fn();
    const h = longTimeout(g, 40 * DAY_MS);
    vi.advanceTimersByTime(25 * DAY_MS);
    h.clear();
    vi.advanceTimersByTime(40 * DAY_MS);
    expect(g).not.toHaveBeenCalled();
  });
});

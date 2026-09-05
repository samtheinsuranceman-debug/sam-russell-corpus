// ============================================================
// THE GOAL CLOCK — an honest countdown that responds to effort
// ============================================================
// The founder's spec, verbatim: "If you are single and you say you want five
// kids and you spend zero hours a month for six months meeting women, it's
// going to tell you that this goal is never going to happen... because you're
// not putting in the basic energy."
//
// Mechanics (deterministic, explainable — no AI call needed to tick):
//   remaining = baselineMonths × (1 − stageProgress)
//   paceRatio = recent avg logged hours / minMonthlyHours (capped at 2×)
//   eta       = remaining / paceRatio
// Zero effort across enough logged months → "at this pace: never."
// No logs yet → the clock hasn't started (unstarted, not never).

export type GoalStage = { name: string; done: boolean };

export type ClockInput = {
  baselineMonths: number;
  minMonthlyHours: number;
  stages: GoalStage[];
  /** hours logged per month, most recent last; months with no log = 0 ONLY if later months exist */
  monthlyHours: number[];
};

export type ClockReading = {
  state: "unstarted" | "on_pace" | "behind" | "ahead" | "stalled" | "never" | "achieved";
  etaMonths: number | null; // null when never/unstarted/achieved
  paceRatio: number; // 0..2
  stageProgress: number; // 0..1
  headline: string; // the member-facing clock line
};

const RECENT_WINDOW = 3; // pace = average of the last 3 logged months
const NEVER_AFTER_MONTHS = 3; // this many logged months at ~zero effort → "never"

export function readClock(input: ClockInput): ClockReading {
  const stages = input.stages ?? [];
  const doneCount = stages.filter((s) => s.done).length;
  const stageProgress = stages.length > 0 ? doneCount / stages.length : 0;

  if (stages.length > 0 && doneCount === stages.length) {
    return { state: "achieved", etaMonths: null, paceRatio: 1, stageProgress: 1, headline: "Achieved. Log it, frame it, pick the next one." };
  }

  const logs = input.monthlyHours;
  if (logs.length === 0) {
    return {
      state: "unstarted", etaMonths: null, paceRatio: 0, stageProgress,
      headline: `Clock not started — log your first month of effort to start it. At the recommended ${input.minMonthlyHours}h/month: ~${fmtMonths(input.baselineMonths * (1 - stageProgress))}.`,
    };
  }

  const recent = logs.slice(-RECENT_WINDOW);
  const avg = recent.reduce((s, h) => s + h, 0) / recent.length;
  const paceRatio = Math.min(2, avg / Math.max(1e-9, input.minMonthlyHours));
  const remainingBase = input.baselineMonths * (1 - stageProgress);

  // The honest verdict: enough months of ~zero effort = never, said plainly.
  const zeroish = logs.slice(-NEVER_AFTER_MONTHS);
  if (logs.length >= NEVER_AFTER_MONTHS && zeroish.every((h) => h < input.minMonthlyHours * 0.1)) {
    return {
      state: "never", etaMonths: null, paceRatio, stageProgress,
      headline: "At this pace: never. You've logged essentially zero hours for months. The clock only moves when you do — one real hour restarts it.",
    };
  }

  if (paceRatio < 0.1) {
    return {
      state: "stalled", etaMonths: null, paceRatio, stageProgress,
      headline: `Stalled — effort has dropped to near zero. At the recommended ${input.minMonthlyHours}h/month this is ~${fmtMonths(remainingBase)} away; right now it isn't approaching at all.`,
    };
  }

  const eta = remainingBase / paceRatio;
  const state: ClockReading["state"] = paceRatio >= 1.15 ? "ahead" : paceRatio >= 0.75 ? "on_pace" : "behind";
  const headlines: Record<string, string> = {
    ahead: `~${fmtMonths(eta)} at your current pace — you're running ${Math.round(paceRatio * 100)}% of baseline effort. Ahead of schedule.`,
    on_pace: `~${fmtMonths(eta)} at your current pace. On schedule — keep logging.`,
    behind: `~${fmtMonths(eta)} at your current pace — that's slower than the ${input.minMonthlyHours}h/month this estimate assumes. More hours, shorter clock.`,
  };
  return { state, etaMonths: eta, paceRatio, stageProgress, headline: headlines[state] };
}

export function fmtMonths(m: number): string {
  if (!isFinite(m)) return "never";
  if (m < 1) return "under a month";
  if (m < 18) return `${Math.round(m)} month${Math.round(m) === 1 ? "" : "s"}`;
  const years = m / 12;
  const rounded = Math.round(years * 2) / 2;
  return `${rounded} year${rounded === 1 ? "" : "s"}`;
}

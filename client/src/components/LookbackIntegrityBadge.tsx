/**
 * LookbackIntegrityBadge — one line that says whether a backtest's start year
 * is doing the work.
 *
 * Give it the series the page compounds, the window the page shows, and
 * (optionally) the raw market series. It places that window among every
 * same-length window the series holds (shared/lookbackIntegrity.ts,
 * startYearIntegrity) and prints the rank, with a flag when the window sits
 * in the flattering tail. It computes nothing of its own.
 */
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Link } from "wouter";
import { startYearIntegrity, type AnnualSeries, type StartYearIntegrity } from "@shared/lookbackIntegrity";

const TONE: Record<StartYearIntegrity["verdict"], { box: string; text: string; label: string }> = {
  flattering: { box: "border-amber-400/50 bg-amber-950/30", text: "text-amber-200", label: "Start year flatters this window" },
  unflattering: { box: "border-sky-400/40 bg-sky-950/20", text: "text-sky-200", label: "Start year understates this window" },
  typical: { box: "border-emerald-400/40 bg-emerald-950/20", text: "text-emerald-200", label: "Typical window" },
  thin: { box: "border-slate-500/40 bg-slate-900/40", text: "text-slate-300", label: "Too few windows to rank" },
  unplaced: { box: "border-slate-500/40 bg-slate-900/40", text: "text-slate-300", label: "Window outside the held series" },
};

export function LookbackIntegrityBadge({
  series,
  startYear,
  years,
  market,
  seriesLabel,
  showLink = true,
}: {
  series: AnnualSeries;
  startYear: number;
  years: number;
  market?: AnnualSeries;
  /** What the series is, e.g. "S&P 500 price return, 1994-2025, credited on this page's terms". */
  seriesLabel: string;
  showLink?: boolean;
}) {
  const r = startYearIntegrity(series, startYear, years, market ?? series);
  const tone = TONE[r.verdict];
  const Icon = r.flagged ? AlertTriangle : r.verdict === "typical" ? CheckCircle2 : Info;
  return (
    <div
      data-testid="lookback-integrity-badge"
      data-verdict={r.verdict}
      className={`rounded-xl border px-4 py-3 text-sm ${tone.box}`}
      role={r.flagged ? "alert" : "note"}
    >
      <div className={`flex flex-wrap items-center gap-2 font-semibold ${tone.text}`}>
        <Icon className="h-4 w-4" aria-hidden />
        <span>Look-back integrity: {tone.label}</span>
        {r.percentile !== null && r.verdict !== "unplaced" && (
          <span className="rounded-full border border-white/20 px-2 py-0.5 text-xs font-medium">
            percentile {Math.round(r.percentile)} of {r.n}
          </span>
        )}
      </div>
      <p className="mt-1 text-slate-300">{r.basis}</p>
      <p className="mt-1 text-xs text-slate-500">
        Source: {seriesLabel}.
        {showLink && (
          <>
            {" "}
            <Link href="/portal/lookback-integrity" className="text-amber-300 underline decoration-amber-300/40 underline-offset-2">
              Move the start year yourself
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

export default LookbackIntegrityBadge;

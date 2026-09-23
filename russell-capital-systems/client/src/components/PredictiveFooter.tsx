/**
 * PredictiveFooter — the predictive engine on every calculator, as a toggle.
 *
 * Mounted by the app shell under every predictive calculator (the set is
 * `predictiveDomainFor` in shared/predictiveCalculators.ts). Closed by
 * default, so a calculator's own figures stand until the visitor opens it.
 * Open, it carries four things the owner asked for:
 *
 *   1. the current forecast for this page's domain, with its provenance
 *      (the same `forecast.current` the per-page overlay uses; a domain that
 *      needs the page's own series says so rather than pretending)
 *   2. the global macro scenarios, shared across the portal (PredictiveContext)
 *   3. how long this projection can be trusted: graded bands from the rules
 *      table, and the grade the report should print
 *   4. the reasoning and the citations, with links
 *
 * A page that applies the scenario to its own math (Mortgage Killer does)
 * reads the same context, so the footer and the page never disagree.
 */
import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, Gauge, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { usePredictive } from "@/contexts/PredictiveContext";
import { predictiveDomainFor } from "@shared/predictiveCalculators";
import { projectionConfidence, type ConfidenceGrade } from "@shared/macro/projectionConfidence";
import { cn } from "@/lib/utils";

const DOMAIN_LABEL: Record<string, string> = {
  equities: "equity returns",
  rates: "interest rates",
  inflation: "inflation",
  housing: "home prices and rents",
  wages: "income growth",
};

const GRADE_TONE: Record<ConfidenceGrade, string> = {
  A: "bg-emerald-400/20 text-emerald-100 border-emerald-300/40",
  B: "bg-emerald-400/10 text-emerald-100 border-emerald-300/25",
  C: "bg-yellow-400/15 text-yellow-100 border-yellow-300/30",
  D: "bg-amber-500/15 text-amber-100 border-amber-400/30",
  E: "bg-red-500/10 text-red-100 border-red-400/30",
};

export default function PredictiveFooter({ path, years = 30 }: { path: string; years?: number }) {
  const domain = predictiveDomainFor(path);
  const [open, setOpen] = useState(false);
  const [forecastOn, setForecastOn] = useState(false);
  const macro = usePredictive();

  const forecast = trpc.forecast.current.useQuery(
    { domain: domain ?? "equities", horizon: 30 },
    { enabled: Boolean(domain) && open && forecastOn, staleTime: 60 * 60_000 },
  );

  const confidence = useMemo(
    () =>
      projectionConfidence({
        years,
        adjustments: macro.active ? macro.adjustments : null,
        forecast: forecastOn && forecast.data
          ? { source: forecast.data.source, asOf: forecast.data.asOf, method: forecast.data.method, unavailableReason: forecast.data.unavailableReason }
          : null,
      }),
    [years, macro.active, macro.adjustments, forecastOn, forecast.data],
  );

  if (!domain) return null;

  const anyOn = macro.active || (forecastOn && Boolean(forecast.data) && !forecast.data?.unavailableReason);

  return (
    <section
      aria-label="Predictive engine"
      data-testid="predictive-footer"
      className="mt-8 rounded-xl border border-yellow-400/20 bg-[#0b1410]/80 text-sm text-emerald-50"
    >
      <button type="button" onClick={() => setOpen(o => !o)} className="flex w-full items-center justify-between gap-3 px-4 py-3">
        <span className="flex items-center gap-2 font-semibold tracking-wide text-yellow-200">
          <Sparkles className="h-4 w-4" /> Predictive engine
          <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-normal", anyOn ? "border-yellow-300/50 text-yellow-100" : "border-emerald-400/20 text-emerald-200/60")}>
            {anyOn ? "applied" : "off · optional"}
          </span>
          <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-mono", GRADE_TONE[confidence.overall])} title={confidence.statement}>
            {years}-yr projection · grade {confidence.overall}
          </span>
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <div className="space-y-4 border-t border-yellow-400/10 px-4 pb-4 pt-3">
          {/* 1. The current forecast for this page's domain */}
          <div className="rounded-lg border border-emerald-400/15 p-3">
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <span className="font-medium">Apply the current forecast for {DOMAIN_LABEL[domain]}</span>
              <input type="checkbox" checked={forecastOn} onChange={e => setForecastOn(e.target.checked)} className="accent-yellow-300" aria-label="Apply the current forecast" />
            </label>
            {forecastOn && forecast.isLoading && <p className="mt-2 text-xs text-emerald-200/70">Fetching the current forecast…</p>}
            {forecastOn && forecast.data && !forecast.data.unavailableReason && (
              <p className="mt-2 text-xs text-emerald-100/85">
                {forecast.data.source} · as of {forecast.data.asOf} · {forecast.data.method}. Median year-1 rate{" "}
                {(100 * (forecast.data.points[0]?.rate ?? 0)).toFixed(2)} %
                {forecast.data.points[0]?.p10 !== undefined ? ` (10th–90th: ${(100 * forecast.data.points[0]!.p10!).toFixed(2)} % to ${(100 * forecast.data.points[0]!.p90!).toFixed(2)} %)` : ""}.
              </p>
            )}
            {forecastOn && forecast.data?.unavailableReason && (
              <p className="mt-2 text-xs text-amber-200/90">Not applied: {forecast.data.unavailableReason}. This page's own figures stand.</p>
            )}
          </div>

          {/* 2. The global macro scenarios, shared across the portal */}
          {macro.panel}

          {/* 3. How long this projection can be trusted */}
          <div className="rounded-lg border border-emerald-400/15 p-3">
            <div className="flex items-center gap-2 font-medium"><Gauge className="h-4 w-4 text-yellow-300" /> How far this projection can be trusted</div>
            <p className="mt-2 text-xs text-emerald-100/85">{confidence.statement}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-4">
              {confidence.bands.filter(b => b.fromYear <= years).map(b => (
                <div key={b.fromYear} className={cn("rounded-md border p-2", GRADE_TONE[b.grade])}>
                  <div className="font-mono text-xs">
                    years {b.fromYear}–{Number.isFinite(b.toYear) ? Math.min(b.toYear, years) : years} · {b.grade}
                  </div>
                  <div className="text-[11px] opacity-90">{b.label}</div>
                  <div className="mt-1 text-[11px] opacity-70">{b.why}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. The reasoning and the citations */}
          <div className="rounded-lg border border-emerald-400/15 p-3">
            <div className="font-medium">How this was reasoned</div>
            <ul className="mt-2 space-y-1 text-xs text-emerald-100/80">
              {confidence.reasoning.map((r, i) => <li key={i}>· {r}</li>)}
            </ul>
            <div className="mt-3 font-medium">References</div>
            <ul className="mt-2 space-y-1 text-xs text-emerald-100/80">
              {confidence.citations.map(c => (
                <li key={c.id} className="flex flex-wrap items-baseline gap-x-2">
                  {c.url ? (
                    <a href={c.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-yellow-100 underline-offset-2 hover:underline">
                      {c.title} <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-yellow-100">{c.title}</span>
                  )}
                  {c.asOf && <span className="opacity-60">as of {c.asOf}</span>}
                  {c.note && <span className="w-full opacity-60">{c.note}</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}

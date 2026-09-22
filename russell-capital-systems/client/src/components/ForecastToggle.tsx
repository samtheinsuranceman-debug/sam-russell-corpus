// ============================================================
// ForecastToggle — the optional button above any calculator chart:
// "Apply the current forecast" with a 20 / 30 / 40-year horizon and the
// provenance badge. Off by default. When the predictive engine has no
// forecast, it says why instead of pretending.
// ============================================================
import type { UseForecastOverlayResult } from "@/hooks/useForecastOverlay";
import type { ForecastHorizon } from "@shared/forecastOverlay";

const HORIZONS: ForecastHorizon[] = [20, 30, 40];

export default function ForecastToggle(fo: UseForecastOverlayResult & { label?: string }) {
  const label = fo.label ?? "Apply the current forecast";
  const delta = fo.result.deltaAtHorizon;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-950/30 px-3 py-2 text-sm" data-testid="forecast-toggle">
      <label className="inline-flex items-center gap-2 cursor-pointer">
        <input id="forecast-toggle-switch" type="checkbox" checked={fo.on} onChange={e => fo.setOn(e.target.checked)} className="accent-emerald-400" />
        <span className="font-semibold">{label}</span>
      </label>
      <div className="inline-flex rounded-full border border-white/15 overflow-hidden" role="group" aria-label="Horizon in years">
        {HORIZONS.map(h => (
          <button key={h} type="button" onClick={() => fo.setHorizon(h)} aria-pressed={fo.horizon === h}
            className={`px-2.5 py-0.5 text-xs ${fo.horizon === h ? "bg-amber-300 text-[#07130d] font-semibold" : "hover:bg-white/10"}`}>
            {h}y
          </button>
        ))}
      </div>
      {fo.on && fo.loading ? <span className="text-xs opacity-70">Fetching the current forecast…</span> : null}
      {fo.on && !fo.loading && fo.result.applied && fo.ledger ? (
        <span className="text-xs opacity-80" title={fo.ledger.method}>
          {fo.ledger.source}{fo.ledger.asOf ? ` · as of ${fo.ledger.asOf}` : ""} · at {fo.horizon}y: {delta >= 0 ? "+" : "−"}{Math.abs(Math.round(delta)).toLocaleString()} vs base
        </span>
      ) : null}
      {fo.on && !fo.loading && !fo.result.applied ? (
        <span className="text-xs text-amber-300/90">No forecast applied: {fo.unavailableReason ?? "unavailable"}. Showing the base projection.</span>
      ) : null}
    </div>
  );
}

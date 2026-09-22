// ============================================================
// ForecastPanel — the drop-in for a calculator page.
//
// WHY A PANEL AND NOT A PER-PAGE EDIT. Seventy engines emit multi-year series
// and each page charts its own. Editing seventy pages by hand is how the
// catalogue rotted. This component takes the page's series and the rate it
// used, and renders the toggle, the provenance line and a small table of the
// base vs. forecast-adjusted figures at 10-year marks. A page adds one line:
//
//   <ForecastPanel domain="housing" base={yearRows} baseRate={appreciation} engine="mortgageKiller" />
//
// It never changes the page's own numbers; the overlay is a second series,
// off by default, labelled with source and as-of when on.
// ============================================================
import { useForecastOverlay, type UseForecastOverlayOptions } from "@/hooks/useForecastOverlay";
import ForecastToggle from "@/components/ForecastToggle";

const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });

export default function ForecastPanel(props: UseForecastOverlayOptions & { title?: string }) {
  const fo = useForecastOverlay(props);
  const marks = fo.result.points.filter(p => p.year % 10 === 0 || p.year === fo.horizon);
  return (
    <section aria-label="Forecast overlay" className="rounded-md border border-emerald-900/40 p-3 text-sm">
      <ForecastToggle {...fo} label={props.title ?? "Apply the current forecast"} />
      {fo.on && !fo.result.applied && (
        <p className="mt-2 text-amber-300">Forecast not applied: {fo.unavailableReason ?? "no forecast for this domain yet"}. The calculator's own figures stand.</p>
      )}
      {fo.on && fo.result.applied && (
        <table className="mt-2 w-full tabular-nums">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-emerald-200/70">
              <th>Year</th><th>Calculator</th><th>With forecast</th><th>10th pct</th><th>90th pct</th>
            </tr>
          </thead>
          <tbody>
            {marks.map(p => (
              <tr key={p.year}>
                <td>{p.year}</td><td>{fmt(p.base)}</td><td className="text-emerald-300">{fmt(p.overlay)}</td><td>{fmt(p.p10)}</td><td>{fmt(p.p90)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {fo.on && fo.ledger && (
        <p className="mt-2 text-xs text-emerald-200/70">
          Forecast source: {fo.ledger.source} · as of {fo.ledger.asOf} · method: {fo.ledger.method}
        </p>
      )}
    </section>
  );
}

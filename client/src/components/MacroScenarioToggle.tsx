/**
 * MacroScenarioToggle — the switch panel every predictive calculator mounts.
 *
 * Four toggles, each off by default so a calculator's own numbers stand
 * unless the advisor chooses to stress them:
 *
 *   • Treasury liquidation (Japan / China / both, sell fraction, months)
 *   • Oil settlement leaving the dollar (target share, years)
 *   • Sovereign stress (which economies restructure)
 *   • Taiwan (scenario)
 *
 * The panel asks the server for the resulting `MacroAdjustments` and hands
 * them to the calculator through `onChange`. The calculator applies them with
 * `applyMacro` from `@shared/macro` and prints `rationale` + `sourceIds` in
 * its evidence ledger. The panel itself never touches the calculator's math.
 *
 * Usage:
 *   const { toggles, adjustments, panel } = useMacroScenario();
 *   const inputs = applyMacro(baseInputs, adjustments);
 *   ... {panel}
 */
import { useEffect, useMemo, useState, type ReactElement } from "react";
import { trpc } from "@/lib/trpc";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, Landmark, Ship, Flame, ChevronDown, ChevronUp, Info } from "lucide-react";
import { NEUTRAL_ADJUSTMENTS } from "@shared/macro/neutral";
import { averageAdjustments } from "@shared/macro/projectionSlice";
import type { MacroAdjustments, MacroToggles } from "@shared/macro/types";
import type { ProjectionHorizon } from "@shared/macro/projection";
import { cn } from "@/lib/utils";

export type MacroScenarioState = {
  toggles: MacroToggles;
  /** Year-1 adjustments (full scenario), for calculators that take one set of assumptions. */
  adjustments: MacroAdjustments;
  /** Confidence-weighted average over the calculator's horizon — the honest single number for a whole-horizon calculator. */
  averaged: MacroAdjustments;
  /** The projection path: confidence, grade and applied deltas per year; null until the server answers. */
  horizon: ProjectionHorizon | null;
  /** Adjustments for a given projected year (1-based); neutral beyond the confident years. */
  forYear: (year: number) => MacroAdjustments;
  /** How many years the platform projects with confidence for this calculator. */
  confidentYears: number;
  loading: boolean;
  active: boolean;
  panel: ReactElement;
};

export type MacroScenarioOptions = {
  /** The calculator's own horizon in years (default 30); the projection path is computed to it. */
  years?: number;
  /** Shown in the projection report. */
  calculator?: string;
  /** Start collapsed (the default on a calculator page: optional, off, out of the way). */
  compact?: boolean;
};

const STRESS_CHOICES: Array<{ iso3: string; name: string }> = [
  { iso3: "ITA", name: "Italy" },
  { iso3: "FRA", name: "France" },
  { iso3: "GBR", name: "United Kingdom" },
  { iso3: "JPN", name: "Japan" },
  { iso3: "CHN", name: "China" },
  { iso3: "USA", name: "United States" },
  { iso3: "BRA", name: "Brazil" },
  { iso3: "TUR", name: "Türkiye" },
  { iso3: "EGY", name: "Egypt" },
  { iso3: "PAK", name: "Pakistan" },
  { iso3: "ARG", name: "Argentina" },
  { iso3: "ZAF", name: "South Africa" },
];

export function useMacroScenario(initial: MacroToggles = {}, opts: MacroScenarioOptions = {}): MacroScenarioState {
  const [toggles, setToggles] = useState<MacroToggles>(initial);
  const years = Math.max(1, Math.min(60, Math.round(opts.years ?? 30)));
  const active = Boolean(toggles.treasuryLiquidation || toggles.petrodollarErosion || (toggles.sovereignStress && toggles.sovereignStress.countries.length) || toggles.taiwan);
  const q = trpc.macro.adjustments.useQuery({ toggles, full: false }, { enabled: active, staleTime: 60_000 });
  // The projection path is asked for whenever a scenario is on (and once, neutral, so the panel can say how far the measured state reaches).
  const p = trpc.macro.projection.useQuery({ toggles, years, full: false }, { staleTime: 60_000 });
  const adjustments = active && q.data ? q.data : NEUTRAL_ADJUSTMENTS;
  const horizon = p.data ?? null;
  const averaged = useMemo(() => (active && horizon ? averageAdjustments(horizon) : NEUTRAL_ADJUSTMENTS), [active, horizon]);
  const forYear = useMemo(() => (year: number): MacroAdjustments => {
    if (!active || !horizon) return NEUTRAL_ADJUSTMENTS;
    const row = horizon.path[Math.max(0, Math.min(horizon.path.length - 1, Math.round(year) - 1))];
    return row ? row.adjustments : NEUTRAL_ADJUSTMENTS;
  }, [active, horizon]);
  const confidentYears = horizon ? horizon.confidentYears : 0;
  const loading = (active && q.isLoading) || p.isLoading;
  const panel = useMemo(
    () => <MacroScenarioToggle toggles={toggles} onToggles={setToggles} adjustments={adjustments} horizon={horizon} years={years} calculator={opts.calculator} loading={loading} compact={opts.compact ?? true} />,
    [toggles, adjustments, horizon, years, opts.calculator, loading, opts.compact],
  );
  return { toggles, adjustments, averaged, horizon, forYear, confidentYears, loading, active, panel };
}

export function MacroScenarioToggle(props: {
  toggles: MacroToggles;
  onToggles: (t: MacroToggles) => void;
  adjustments: MacroAdjustments;
  horizon?: ProjectionHorizon | null;
  years?: number;
  calculator?: string;
  loading?: boolean;
  compact?: boolean;
}) {
  const { toggles, onToggles, adjustments, loading, horizon } = props;
  const [open, setOpen] = useState(!props.compact);
  const active = adjustments !== NEUTRAL_ADJUSTMENTS && adjustments.rationale[0] !== NEUTRAL_ADJUSTMENTS.rationale[0];

  const set = (patch: Partial<MacroToggles>) => onToggles({ ...toggles, ...patch });
  const liq = toggles.treasuryLiquidation ?? null;
  const oil = toggles.petrodollarErosion ?? null;
  const sov = toggles.sovereignStress ?? null;
  const tw = toggles.taiwan ?? null;

  useEffect(() => {
    if (active && props.compact) setOpen(true);
  }, [active, props.compact]);

  return (
    <div className={cn("rounded-xl border border-yellow-400/20 bg-[#0b1410]/80 p-4 text-sm text-emerald-50 shadow-[0_0_30px_-12px_rgba(250,204,21,0.35)]", props.compact && "p-3")}>
      <button type="button" onClick={() => setOpen(o => !o)} className="flex w-full items-center justify-between gap-3">
        <span className="flex items-center gap-2 font-semibold tracking-wide text-yellow-200">
          <Globe className="h-4 w-4" /> Global Macro Scenarios
          {active && <Badge className="bg-yellow-400/20 text-yellow-100">applied</Badge>}
          {!active && <Badge variant="outline" className="border-emerald-400/30 text-emerald-200/70">optional · off</Badge>}
          {horizon && <span className="text-xs font-normal text-emerald-200/70">projects with confidence for {horizon.confidentYears} of {horizon.years} yrs (year 1: {horizon.year1.grade})</span>}
          {loading && <span className="text-xs text-emerald-200/70">recomputing…</span>}
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {/* Treasury liquidation */}
          <section className="rounded-lg border border-emerald-400/15 p-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium"><Landmark className="h-4 w-4 text-yellow-300" /> Treasury liquidation</span>
              <Switch checked={Boolean(liq)} onCheckedChange={on => set({ treasuryLiquidation: on ? { holder: "CN", fraction: 0.5, months: 12 } : null })} />
            </div>
            {liq && (
              <div className="mt-3 space-y-3">
                <div className="flex gap-2">
                  {(["JP", "CN", "BOTH"] as const).map(h => (
                    <Button key={h} size="sm" variant={liq.holder === h ? "default" : "outline"} onClick={() => set({ treasuryLiquidation: { ...liq, holder: h } })}>
                      {h === "JP" ? "Japan" : h === "CN" ? "China" : "Both"}
                    </Button>
                  ))}
                </div>
                <label className="block text-xs text-emerald-200/80">
                  Sell {Math.round(liq.fraction * 100)} % of holdings
                  <Slider className="mt-2" min={0} max={100} step={5} value={[Math.round(liq.fraction * 100)]} onValueChange={([v]) => set({ treasuryLiquidation: { ...liq, fraction: v / 100 } })} />
                </label>
                <label className="block text-xs text-emerald-200/80">
                  Over {liq.months} month{liq.months > 1 ? "s" : ""}
                  <Slider className="mt-2" min={1} max={36} step={1} value={[liq.months]} onValueChange={([v]) => set({ treasuryLiquidation: { ...liq, months: v } })} />
                </label>
              </div>
            )}
          </section>

          {/* Petrodollar */}
          <section className="rounded-lg border border-emerald-400/15 p-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium"><Ship className="h-4 w-4 text-yellow-300" /> Oil leaves the dollar</span>
              <Switch checked={Boolean(oil)} onCheckedChange={on => set({ petrodollarErosion: on ? { targetNonUsdShare: 35, years: 10 } : null })} />
            </div>
            {oil && (
              <div className="mt-3 space-y-3">
                <label className="block text-xs text-emerald-200/80">
                  Non-dollar share reaches {oil.targetNonUsdShare} % (now ~20 %)
                  <Slider className="mt-2" min={20} max={70} step={1} value={[oil.targetNonUsdShare]} onValueChange={([v]) => set({ petrodollarErosion: { ...oil, targetNonUsdShare: v } })} />
                </label>
                <label className="block text-xs text-emerald-200/80">
                  Within {oil.years} years
                  <Slider className="mt-2" min={2} max={25} step={1} value={[oil.years]} onValueChange={([v]) => set({ petrodollarErosion: { ...oil, years: v } })} />
                </label>
              </div>
            )}
          </section>

          {/* Sovereign stress */}
          <section className="rounded-lg border border-emerald-400/15 p-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium"><Landmark className="h-4 w-4 text-yellow-300" /> Sovereign default / restructuring</span>
              <Switch checked={Boolean(sov)} onCheckedChange={on => set({ sovereignStress: on ? { countries: ["ITA"] } : null })} />
            </div>
            {sov && (
              <div className="mt-3 flex flex-wrap gap-2">
                {STRESS_CHOICES.map(c => {
                  const on = sov.countries.includes(c.iso3);
                  return (
                    <button
                      key={c.iso3}
                      type="button"
                      onClick={() => set({ sovereignStress: { countries: on ? sov.countries.filter(x => x !== c.iso3) : [...sov.countries, c.iso3] } })}
                      className={cn("rounded-full border px-3 py-1 text-xs", on ? "border-yellow-300 bg-yellow-400/20 text-yellow-100" : "border-emerald-400/20 text-emerald-100/80 hover:border-emerald-300/50")}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Taiwan */}
          <section className="rounded-lg border border-emerald-400/15 p-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium"><Flame className="h-4 w-4 text-yellow-300" /> Taiwan</span>
              <Switch checked={Boolean(tw)} onCheckedChange={on => set({ taiwan: on ? { scenario: "blockade" } : null })} />
            </div>
            {tw && (
              <div className="mt-3 flex flex-wrap gap-2">
                {(["gray-zone", "quarantine", "blockade", "war"] as const).map(s => (
                  <Button key={s} size="sm" variant={tw.scenario === s ? "default" : "outline"} onClick={() => set({ taiwan: { ...tw, scenario: s } })}>
                    {s}
                  </Button>
                ))}
                <p className="w-full text-xs text-emerald-200/70">Probability-weighted with the model's own odds unless you set one on the Macro Intelligence page.</p>
              </div>
            )}
          </section>

          {/* Result strip */}
          <div className="md:col-span-2 rounded-lg border border-yellow-400/20 bg-black/30 p-3">
            <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              <Stat label="10-yr yield" value={fmtPp(adjustments.tenYearYieldDelta)} />
              <Stat label="Mortgage rate" value={fmtPp(adjustments.mortgageRateDelta)} />
              <Stat label="Inflation" value={fmtPp(adjustments.inflationDelta)} />
              <Stat label="Equity return" value={`×${adjustments.equityReturnMultiplier.toFixed(2)}`} />
              <Stat label="Equity vol" value={`×${adjustments.equityVolMultiplier.toFixed(2)}`} />
              <Stat label="Dollar" value={fmtPct(adjustments.dollarIndexPct)} />
              <Stat label="Gold" value={fmtPct(adjustments.goldPct)} />
              <Stat label="Recession (1 yr)" value={`${Math.round(adjustments.recessionProbability * 100)} %`} />
            </div>
            <ul className="mt-3 space-y-1 text-xs text-emerald-100/80">
              {adjustments.rationale.map((r, i) => (
                <li key={i} className="flex gap-2"><Info className="mt-0.5 h-3 w-3 shrink-0 text-yellow-300" /> <span>{r}</span></li>
              ))}
            </ul>
            {adjustments.sourceIds.length > 0 && (
              <p className="mt-2 text-[11px] text-emerald-200/60">Sources: {adjustments.sourceIds.join(", ")} · model confidence {adjustments.confidence}/100</p>
            )}
          </div>

          {/* Projection horizon: how far the platform is willing to project, and the report */}
          {horizon && (
            <div className="md:col-span-2 rounded-lg border border-emerald-400/15 bg-black/20 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-yellow-200/90">Projection horizon</span>
                <span className="text-xs text-emerald-200/70">Year 1 confidence {horizon.year1.confidence} ({horizon.year1.grade}) = min(measured {horizon.year1.measured}, scenario {horizon.year1.scenario}) · applied for {horizon.confidentYears} of {horizon.years} years · beyond that the calculator's own assumptions stand</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {horizon.path.slice(0, Math.min(horizon.path.length, 30)).map(p => (
                  <span key={p.year} title={`Year ${p.year}: confidence ${p.confidence} (${p.grade}); ${p.basis}`} className={cn("rounded px-1.5 py-0.5 font-mono text-[10px]", p.applied ? "bg-yellow-400/20 text-yellow-100" : p.confidence >= 30 ? "bg-emerald-900/50 text-emerald-100" : "bg-emerald-950/60 text-emerald-200/50")}>
                    {p.year}:{p.grade}
                  </span>
                ))}
                {horizon.path.length > 30 && <span className="text-[10px] text-emerald-200/50">… to year {horizon.path.length}</span>}
              </div>
              <ul className="mt-2 space-y-0.5 text-[11px] text-emerald-100/70">
                {horizon.rationale.slice(-3).map((r, i) => <li key={i}>{r}</li>)}
              </ul>
              <ProjectionReportLink toggles={toggles} years={props.years ?? horizon.years} calculator={props.calculator} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Fetches the projection report on demand and offers it as a markdown download. */
function ProjectionReportLink({ toggles, years, calculator }: { toggles: MacroToggles; years: number; calculator?: string }) {
  const [wanted, setWanted] = useState(false);
  const r = trpc.macro.projectionReport.useQuery({ toggles, years, calculator }, { enabled: wanted, staleTime: 60_000 });
  useEffect(() => {
    if (!wanted || !r.data) return;
    const blob = new Blob([r.data.markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `projection-report-${(calculator ?? "calculator").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setWanted(false);
  }, [wanted, r.data, calculator]);
  return (
    <Button size="sm" variant="outline" className="mt-2 border-yellow-400/30 text-yellow-100" onClick={() => setWanted(true)} disabled={wanted && r.isLoading}>
      {wanted && r.isLoading ? "Preparing the report…" : "Download the projection confidence report (markdown, with references)"}
    </Button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-emerald-950/40 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wider text-emerald-200/60">{label}</div>
      <div className="font-mono text-sm text-yellow-100">{value}</div>
    </div>
  );
}

const fmtPp = (x: number) => `${x >= 0 ? "+" : ""}${x.toFixed(2)} pp`;
const fmtPct = (x: number) => `${x >= 0 ? "+" : ""}${x.toFixed(1)} %`;

export default MacroScenarioToggle;

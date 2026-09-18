// ============================================================
// THE ZIP ENGINE — what it has really cost to own a home in the client's own
// zip codes since the record began, and what the record says about the years
// ahead. One slider chooses the start year; everything re-averages from it.
// Every figure carries its source and as-of date; a blank in the record stays
// blank on the page.
// ============================================================
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Home, MapPin, Landmark, BookOpen, RefreshCw } from "lucide-react";
import { valueAt, years, type AnnualSeries } from "@shared/zipEngine";

const CARD = "rounded-2xl border border-emerald-400/20 bg-white/[0.04]";
const INPUT = "rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white w-full";
const PRIMARY = "rounded-lg bg-emerald-400 px-3 py-1.5 text-xs font-semibold text-black hover:bg-emerald-300 disabled:opacity-40";
const BTN = "rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-40";
const pct = (n: number | null | undefined, d = 1) => (n == null || !Number.isFinite(n) ? "—" : `${(n * 100).toFixed(d)}%`);
const usd = (n: number | null | undefined) => (n == null || !Number.isFinite(n) ? "—" : n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }));

/** A plain SVG line: the record solid, the projection dashed, the back-cast years hatched. */
function LevelChart({ levels, backcastThrough, projection, from }: { levels: AnnualSeries; backcastThrough: number | null; projection: Array<{ year: number; value: number }> | null; from: number }) {
  const pts = years(levels).map((y) => ({ year: y, value: valueAt(levels, y) })).filter((p) => p.year >= from && p.value != null) as Array<{ year: number; value: number }>;
  const all = [...pts, ...(projection ?? [])];
  if (all.length < 2) return <p className="text-xs text-white/50">Not enough years on record from {from} to draw.</p>;
  const W = 640, H = 200, P = 28;
  const x0 = all[0]!.year, x1 = all[all.length - 1]!.year;
  const vmax = Math.max(...all.map((p) => p.value)), vmin = Math.min(...all.map((p) => p.value));
  const X = (y: number) => P + ((y - x0) / Math.max(1, x1 - x0)) * (W - 2 * P);
  const Y = (v: number) => H - P - ((v - vmin) / Math.max(1, vmax - vmin)) * (H - 2 * P);
  const path = (ps: Array<{ year: number; value: number }>) => ps.map((p, i) => `${i ? "L" : "M"}${X(p.year).toFixed(1)},${Y(p.value).toFixed(1)}`).join(" ");
  const bc = backcastThrough != null ? pts.filter((p) => p.year <= backcastThrough) : [];
  const rec = backcastThrough != null ? pts.filter((p) => p.year >= backcastThrough) : pts;
  const proj = projection && pts.length ? [pts[pts.length - 1]!, ...projection] : [];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Home value by year">
      {[0, 0.5, 1].map((t) => { const v = vmin + t * (vmax - vmin); return <g key={t}><line x1={P} x2={W - P} y1={Y(v)} y2={Y(v)} stroke="rgba(255,255,255,0.08)" /><text x={P - 4} y={Y(v) + 4} fontSize="9" fill="rgba(255,255,255,0.5)" textAnchor="end">{Math.round(v / 1000)}k</text></g>; })}
      {bc.length > 1 && <path d={path(bc)} fill="none" stroke="#fbbf24" strokeWidth="2" strokeDasharray="2 3" />}
      {rec.length > 1 && <path d={path(rec)} fill="none" stroke="#34d399" strokeWidth="2.5" />}
      {proj.length > 1 && <path d={path(proj)} fill="none" stroke="#a7f3d0" strokeWidth="1.5" strokeDasharray="6 4" />}
      {[x0, x1].map((y) => <text key={y} x={X(y)} y={H - 8} fontSize="10" fill="rgba(255,255,255,0.6)" textAnchor={y === x0 ? "start" : "end"}>{y}</text>)}
    </svg>
  );
}

export default function ZipEngine() {
  const status = trpc.zip.status.useQuery(undefined, { refetchOnWindowFocus: false });
  const mine = trpc.zip.mine.useQuery(undefined, { refetchOnWindowFocus: false, retry: false });
  const utils = trpc.useUtils();
  const [zipText, setZipText] = useState("");
  const [startYear, setStartYear] = useState<number | null>(null);
  const [threshold, setThreshold] = useState(100_000);
  const [downPct, setDownPct] = useState(20);
  const [yearsAhead, setYearsAhead] = useState(10);
  const range = status.data?.range ?? null;
  useEffect(() => { if (mine.data?.zips.length && !zipText) setZipText(mine.data.zips.map((z) => z.zip).join(", ")); }, [mine.data, zipText]);
  useEffect(() => { if (range && startYear == null) setStartYear(Math.max(range.min, 1990)); }, [range, startYear]);
  const zips = useMemo(() => Array.from(new Set(zipText.split(/[\s,;]+/).map((s) => s.trim()).filter((s) => /^\d{5}$/.test(s)))).slice(0, 12), [zipText]);
  const report = trpc.zip.report.useQuery({ zips, startYear: startYear ?? 2000, threshold, yearsAhead, downPct }, { enabled: zips.length > 0 && startYear != null, refetchOnWindowFocus: false });
  const refresh = trpc.zip.refresh.useMutation({ onSuccess: (r) => { toast.success(`Files read: FHFA ${r.hpi}, Zillow values ${r.zhvi}, Zillow rents ${r.zori}, Freddie Mac ${r.pmms}; ${r.stored.toLocaleString()} series stored in ${Math.round(r.ms / 1000)}s`); utils.zip.status.invalidate(); utils.zip.report.invalidate(); }, onError: (e) => toast.error(e.message) });
  const isOwner = mine.isSuccess && status.data != null; // the button is harmless for non-owners: the server refuses
  const labelFor = (zip: string) => mine.data?.zips.find((z) => z.zip === zip)?.label;
  const ready = status.data?.ready;

  return (
    <AppShell title="The Zip Engine">
      <div className="mx-auto max-w-6xl space-y-6 pb-16">
        <div className={`${CARD} p-6`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/80"><MapPin size={12} className="mr-1 inline" /> The Observatory</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">What it has really cost to own a home in your zip codes</h1>
          <p className="mt-2 text-sm text-white/70">Home values since the record began, rents, and what the loan actually cost at each year's mortgage rate. Pick the year the averaging starts; everything on the page re-computes from there and the projection uses that window. Every figure carries its source and as-of date. Where the record is blank, the page says so.</p>
          {status.data && (
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {status.data.series.map((s) => (
                <div key={s.id} className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs">
                  <div className="font-semibold text-white">{s.publisher}</div>
                  <div className="text-white/60">{s.id === "pmms" ? "national rate" : `${s.zips.toLocaleString()} zips`}{s.asOf ? ` · through ${s.asOf}` : " · not read yet"}</div>
                </div>
              ))}
            </div>
          )}
          {!ready && <p className="mt-3 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-200">The files have not been read on this host yet. The owner can read them now with the button below; on a schedule set <code>ZIP_DATA_DAYS=30</code> on the host.</p>}
          {isOwner && <button className={`${BTN} mt-3`} disabled={refresh.isPending} onClick={() => refresh.mutate()}><RefreshCw size={12} className="mr-1 inline" /> {refresh.isPending ? "Reading the files (a few minutes)…" : "Read the files now"}</button>}
        </div>

        <div className={`${CARD} p-6`}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-xs text-white/70">Your zip codes (home first, then each property; up to 12)
              <input className={`${INPUT} mt-1`} value={zipText} onChange={(e) => setZipText(e.target.value)} placeholder="28401, 33755" />
              {mine.data?.zips.length ? <span className="text-[11px] text-white/50">From your Fact Finder: {mine.data.zips.map((z) => `${z.label} ${z.zip}`).join(" · ")}</span> : <span className="text-[11px] text-white/50">Add the zip to your Fact Finder (Real Estate) and this fills itself.</span>}
            </label>
            <div className="grid grid-cols-3 gap-3">
              <label className="block text-xs text-white/70">Cohort threshold
                <select className={`${INPUT} mt-1`} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))}>
                  {(status.data?.thresholds ?? [100_000]).map((t) => <option key={t} value={t}>{usd(t)}</option>)}
                </select>
              </label>
              <label className="block text-xs text-white/70">Down payment %<input type="number" className={`${INPUT} mt-1`} value={downPct} min={0} max={100} onChange={(e) => setDownPct(Number(e.target.value))} /></label>
              <label className="block text-xs text-white/70">Years ahead<input type="number" className={`${INPUT} mt-1`} value={yearsAhead} min={1} max={40} onChange={(e) => setYearsAhead(Number(e.target.value))} /></label>
            </div>
          </div>
          {range && startYear != null && (
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs text-white/70"><span>Start averaging from</span><span className="font-semibold text-emerald-300">{startYear}{startYear >= 2020 ? " · since COVID" : ""}</span></div>
              <input type="range" className="mt-2 w-full accent-emerald-400" min={range.min} max={range.max - 1} value={startYear} onChange={(e) => setStartYear(Number(e.target.value))} />
              <div className="flex justify-between text-[10px] text-white/40"><span>{range.min}</span><span>{range.max - 1}</span></div>
            </div>
          )}
        </div>

        {report.data && (
          <>
            <div className={`${CARD} p-6`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/80"><Landmark size={12} className="mr-1 inline" /> Zips like yours</p>
              <h2 className="mt-1 text-lg font-semibold text-white">Every zip whose typical home was worth at least {usd(threshold)} in {report.data.cohort.startYear}</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 text-sm">
                <Stat label="Zips in the cohort" value={report.data.cohort.members.toLocaleString()} />
                <Stat label={`Median rate since ${report.data.cohort.startYear}`} value={pct(report.data.cohort.windowRate)} sub={`${report.data.cohort.sample.windowRate.toLocaleString()} zips`} />
                <Stat label="10-year" value={pct(report.data.cohort.lookback[10])} />
                <Stat label="20-year" value={pct(report.data.cohort.lookback[20])} />
                <Stat label="Worst fall (median)" value={pct(report.data.cohort.worstDrawdown)} />
              </div>
            </div>

            {report.data.answers.map(({ report: r, sources, sheet, meta }) => (
              <div key={r.zip} className={`${CARD} p-6`}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-lg font-semibold text-white"><Home size={14} className="mr-1 inline" /> {labelFor(r.zip) ?? "Zip"} {r.zip}{meta?.city ? ` · ${meta.city}, ${meta.state ?? ""}` : ""}</h2>
                  {r.inCohort != null && <span className={`rounded-full px-2 py-0.5 text-[11px] ${r.inCohort ? "bg-emerald-400/20 text-emerald-200" : "bg-white/10 text-white/60"}`}>{r.inCohort ? "in the cohort" : "below the threshold at the start"}</span>}
                </div>
                {!r.levels ? (
                  <p className="mt-3 text-sm text-amber-200">No public value record for this zip. Zillow publishes values for about 26,000 zips and FHFA for those with enough repeat sales; this is not one of them, and nothing is estimated in its place.</p>
                ) : (
                  <>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6 text-sm">
                      <Stat label={`Since ${r.window?.from ?? startYear}`} value={pct(r.windowRate)} sub={r.window ? `to ${r.window.to}` : undefined} />
                      <Stat label="5-year" value={pct(r.lookback[5])} />
                      <Stat label="10-year" value={pct(r.lookback[10])} />
                      <Stat label="20-year" value={pct(r.lookback[20])} />
                      <Stat label="Worst fall" value={pct(r.worstDrawdown?.drawdown)} sub={r.worstDrawdown ? `${r.worstDrawdown.peakYear}→${r.worstDrawdown.troughYear}` : undefined} />
                      <Stat label="Rent, same window" value={pct(r.rentWindowRate)} sub={r.rent ? "Zillow ZORI" : "no rent record"} />
                    </div>
                    <div className="mt-4"><LevelChart levels={r.levels} backcastThrough={r.backcastThrough} projection={r.projection?.points ?? null} from={startYear ?? 2000} /></div>
                    <p className="mt-1 text-[11px] text-white/50">
                      Solid: Zillow's typical home value, last month of each year. {r.backcastThrough != null && <>Dotted amber through {r.backcastThrough}: {report.data.method.backcast} </>}Dashed: projection at the {pct(r.projection?.rate)} rate of the {r.projection?.window.from}–{r.projection?.window.to} window; a projection, not a forecast.
                    </p>
                    {r.projection && <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                      <span className="text-white/70">If the {r.projection.window.from}–{r.projection.window.to} rate holds: {usd(r.projection.points[r.projection.points.length - 1]?.value)} in {r.projection.points[r.projection.points.length - 1]?.year}.</span>
                      <Link href={`/ultra-calculator?appreciation=${(r.projection.rate * 100).toFixed(2)}&zip=${r.zip}`} className={PRIMARY}>Use {pct(r.projection.rate, 2)} in the Ultra Calculator</Link>
                    </div>}
                    {sheet.length > 0 && (
                      <div className="mt-5 overflow-x-auto">
                        <p className="text-xs font-semibold text-white/80">The loan's true cost: buy the typical home that year with {downPct}% down at that year's average 30-year rate, pay every payment for 30 years</p>
                        <table className="mt-2 w-full text-xs">
                          <thead><tr className="text-white/50"><th className="py-1 text-left">Year</th><th className="text-right">Typical value</th><th className="text-right">30-yr rate</th><th className="text-right">Payment/mo</th><th className="text-right">Interest over 30 yrs</th><th className="text-right">Interest ÷ price</th></tr></thead>
                          <tbody>
                            {sheet.filter((_, i, a) => a.length <= 14 || i % Math.ceil(a.length / 14) === 0 || i === a.length - 1).map((row) => (
                              <tr key={row.year} className="border-t border-white/5 text-white/80">
                                <td className="py-1">{row.year}{row.backcast ? "*" : ""}</td><td className="text-right">{usd(row.price)}</td><td className="text-right">{row.ratePct.toFixed(2)}%</td><td className="text-right">{usd(row.monthlyPayment)}</td><td className="text-right font-semibold text-white">{usd(row.totalInterest)}</td><td className="text-right">{pct(row.interestToPrice, 0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <p className="mt-1 text-[11px] text-white/50">Rate: Freddie Mac PMMS annual average via FRED{report.data.pmms ? `, through ${report.data.pmms.asOf}` : ""}. National; no zip-level rate is published. * back-cast value.</p>
                      </div>
                    )}
                  </>
                )}
                <p className="mt-3 text-[11px] text-white/40">Sources: {Object.entries(sources).map(([k, v]) => `${k.toUpperCase()} through ${v.asOf}`).join(" · ") || "none on record"}</p>
              </div>
            ))}
          </>
        )}
        {zips.length > 0 && report.isLoading && <p className="text-sm text-white/60">Reading the record…</p>}
        {zips.length === 0 && <p className="text-sm text-white/60">Enter at least one five-digit zip.</p>}

        <div className={`${CARD} p-6`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/80"><BookOpen size={12} className="mr-1 inline" /> Where every number comes from</p>
          <ul className="mt-3 space-y-2 text-xs text-white/70">
            {(status.data?.sources ?? []).map((s) => <li key={s.id}><a className="text-emerald-300 underline" href={s.url} target="_blank" rel="noreferrer">{s.name}</a> — {s.publisher}. {s.note}</li>)}
          </ul>
          <p className="mt-3 text-[11px] text-white/50">Not on this page, because no public authority publishes it at zip level: per-room rents, homeowners-association fees before 2009, hail out-of-pocket costs, country-club and marina fees. Those arrive as your own entries with your own receipts, never as a pre-filled number. Property tax, flood coverage, insurance and hail records are the next pass.</p>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return <div className="rounded-xl border border-white/10 bg-black/20 p-3"><div className="text-[11px] text-white/50">{label}</div><div className="text-base font-semibold text-white">{value}</div>{sub && <div className="text-[10px] text-white/40">{sub}</div>}</div>;
}

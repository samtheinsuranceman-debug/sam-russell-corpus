// The Calculator Chain builder: the row of calculators, each one's hand-off,
// the money-printing toggles, ZIP-record rates, one deterministic run and the
// 10,000-simulation run, and the aggregate report. Everything here is a
// projection under the assumptions on screen (see disclosure).
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import PageBackdrop from "@/components/PageBackdrop";
import { trpc } from "@/lib/trpc";
import { useClientData } from "@/contexts/ClientDataContext";
import { CHAIN_STORE_KEY, CHAIN_EVENT, loadChain, moveStep, patchStep, removeStep, resetChain, saveChain, type ChainStore } from "@/lib/chainStore";
import { CHAIN_CALCULATORS, CHAIN_CALCULATOR_BY_ID, newStep, profileFromClientData, type ChainCalculatorId, type ChainStep } from "@shared/chainEngine";
import { applyPreset, M2_PRESETS, type MacroAssumptions, type MoneyPrintingPreset } from "@shared/macroEngine";
import { defaultModules, type ClientProfile, type TransferTarget, type UltraModules } from "@shared/ultraEngine";
import EngineSourcesFooter from "@/components/EngineSourcesFooter";

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;
const pct = (n: number | null | undefined) => (n == null ? "—" : `${n.toFixed(2)}%`);
const TARGETS: Array<{ id: TransferTarget; label: string }> = [
  { id: "trustIUL", label: "Trust-owned IUL premium" }, { id: "incomeAnnuity", label: "Income annuity premium" }, { id: "taxableAssets", label: "Taxable investments" },
  { id: "cashReserves", label: "Cash reserves" }, { id: "realEstateProperty", label: "Buy a paid-off property" }, { id: "cryptoValue", label: "Crypto sleeve" }, { id: "mortgagePaydown", label: "Pay down the mortgage" },
];
const PARAM_LABEL: Record<string, string> = {
  growthPct: "Growth %/yr", savingsRatePctOfNetCash: "Save % of net cash", cycleYears: "Cycle length (yrs)", extraPrincipalPctOfNetCash: "Extra principal % of net cash",
  appreciationPctDefault: "Appreciation %/yr", rentalMode: "Rental mode", strGrossReceiptsPctOfValue: "STR gross % of value", strExpenseRatioPct: "STR expense %", ltrNetYieldPctOfValue: "LTR net yield %",
  pctOfHomeEquityDeployed: "% of home equity deployed", flowsThroughTrustIUL: "Through trust IUL", premiumAnnual: "Premium $/yr", premiumYears: "Premium years", creditRatePct: "Crediting %/yr",
  incomeRatePct: "Income draw % (2 or 4)", incomeStartYear: "Income starts (chain year)", chronicIllnessMultiple: "Chronic-illness ×", premium: "Annuity premium $", payoutRatePct: "Payout %/yr", startYear: "Starts (chain year)",
  allocationPctOfTaxable: "Allocate % of taxable", contributionPctOfNetCash: "Add % of yearly savings", expectedReturnPct: "Expected return %/yr", volatilityPct: "Volatility %/yr",
};
const HIDDEN_PARAMS = new Set(["enabled", "appreciationPctPerCycle"]);

function useChainStore(): [ChainStore, (fn: (s: ChainStore) => ChainStore) => void] {
  const [store, setStore] = useState<ChainStore>(() => loadChain());
  useEffect(() => {
    const sync = () => setStore(loadChain());
    window.addEventListener(CHAIN_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(CHAIN_EVENT, sync); window.removeEventListener("storage", sync); };
  }, []);
  const update = (fn: (s: ChainStore) => ChainStore) => { const next = fn(loadChain()); saveChain(next); setStore(next); };
  return [store, update];
}

function Num({ label, value, onChange, step = 1, min, max, className = "" }: { label: string; value: number; onChange: (n: number) => void; step?: number; min?: number; max?: number; className?: string }) {
  return (
    <label className={`text-[11px] text-white/60 ${className}`}>{label}
      <input type="number" value={Number.isFinite(value) ? value : 0} step={step} min={min} max={max} onChange={(e) => onChange(Number(e.target.value))} aria-label={label} className="mt-1 w-full rounded-lg border border-emerald-200/20 bg-black/40 px-2 py-1.5 text-sm text-white outline-none focus:border-emerald-300" />
    </label>
  );
}

function StepCard({ step, index, total, onPatch }: { step: ChainStep; index: number; total: number; onPatch: (p: Partial<ChainStep>) => void }) {
  const spec = CHAIN_CALCULATOR_BY_ID[step.calculator];
  const defaults = useMemo(() => defaultModules(), []);
  const [zip, setZip] = useState(step.zip?.zip ?? "");
  const [from, setFrom] = useState(step.zip?.fromYear ?? new Date().getFullYear() - 36);
  const [to, setTo] = useState<number | "">(step.zip?.toYear ?? "");
  const wantsZip = spec.modules.includes("realEstate");
  const history = trpc.zip.history.useQuery({ zip, fromYear: from, toYear: to === "" ? undefined : to }, { enabled: wantsZip && /^\d{5}$/.test(zip), staleTime: 60_000, retry: false });
  const setParam = (mod: keyof UltraModules, key: string, value: unknown) => onPatch({ params: { ...(step.params ?? {}), [mod]: { ...((step.params ?? {})[mod] ?? {}), [key]: value } } });

  return (
    <div className="w-[340px] shrink-0 rounded-2xl border border-emerald-300/25 bg-[#04120e]/85 p-4 text-sm" data-testid="chain-step">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-emerald-300">Calculator {index + 1} of {total}</p>
          <select value={step.calculator} onChange={(e) => onPatch({ calculator: e.target.value as ChainCalculatorId, params: {}, zip: null })} aria-label={`Calculator ${index + 1}`} className="mt-1 w-full rounded-lg border border-emerald-200/20 bg-black/40 px-2 py-1.5 text-sm font-semibold text-white">
            {CHAIN_CALCULATORS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <p className="mt-1 text-[11px] text-white/55">{spec.blurb}</p>
        </div>
        <div className="flex flex-col gap-1">
          <button type="button" onClick={() => moveStep(step.id, -1)} disabled={index === 0} className="rounded border border-white/15 px-2 text-xs disabled:opacity-30" aria-label="Move earlier">←</button>
          <button type="button" onClick={() => moveStep(step.id, 1)} disabled={index === total - 1} className="rounded border border-white/15 px-2 text-xs disabled:opacity-30" aria-label="Move later">→</button>
          <button type="button" onClick={() => removeStep(step.id)} className="rounded border border-red-400/40 px-2 text-xs text-red-300" aria-label="Remove calculator">✕</button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Num label="Runs for (years)" value={step.years} min={1} max={60} onChange={(n) => onPatch({ years: Math.max(1, Math.min(60, n)) })} />
        <label className="text-[11px] text-white/60">Goal<input value={step.goal ?? ""} onChange={(e) => onPatch({ goal: e.target.value })} aria-label="Goal for this calculator" className="mt-1 w-full rounded-lg border border-emerald-200/20 bg-black/40 px-2 py-1.5 text-sm text-white" /></label>
      </div>

      <details className="mt-3 rounded-xl border border-white/10 p-2">
        <summary className="cursor-pointer text-xs font-semibold text-white/80">Assumptions for this calculator</summary>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {spec.modules.filter((m) => m !== "investmentGrowth" || spec.modules.length === 1).flatMap((mod) => Object.entries(defaults[mod]).filter(([k]) => !HIDDEN_PARAMS.has(k)).map(([k, dflt]) => {
            const cur = ((step.params ?? {})[mod] as Record<string, unknown> | undefined)?.[k] ?? dflt;
            const label = `${PARAM_LABEL[k] ?? k}`;
            if (k === "rentalMode") return <label key={`${mod}.${k}`} className="text-[11px] text-white/60">{label}<select value={String(cur)} onChange={(e) => setParam(mod, k, e.target.value)} aria-label={label} className="mt-1 w-full rounded-lg border border-emerald-200/20 bg-black/40 px-2 py-1.5 text-sm text-white"><option value="str">Short-term rental</option><option value="ltr">Long-term rental</option><option value="live">Live in it</option></select></label>;
            if (typeof dflt === "boolean") return <label key={`${mod}.${k}`} className="flex items-center gap-2 text-[11px] text-white/70"><input type="checkbox" checked={Boolean(cur)} onChange={(e) => setParam(mod, k, e.target.checked)} className="h-4 w-4 accent-emerald-400" aria-label={label} /> {label}</label>;
            if (k === "incomeRatePct") return <label key={`${mod}.${k}`} className="text-[11px] text-white/60">{label}<select value={String(cur)} onChange={(e) => setParam(mod, k, Number(e.target.value))} aria-label={label} className="mt-1 w-full rounded-lg border border-emerald-200/20 bg-black/40 px-2 py-1.5 text-sm text-white"><option value="2">2%</option><option value="4">4%</option></select></label>;
            return <Num key={`${mod}.${k}`} label={label} value={Number(cur)} onChange={(n) => setParam(mod, k, n)} step={/Pct|pct|Rate/.test(k) ? 0.1 : 1} />;
          }))}
        </div>
      </details>

      {wantsZip && (
        <details className="mt-3 rounded-xl border border-white/10 p-2" open={Boolean(step.zip)}>
          <summary className="cursor-pointer text-xs font-semibold text-white/80">ZIP record: appreciation and rent growth, any window</summary>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <label className="text-[11px] text-white/60">ZIP<input value={zip} onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))} aria-label="ZIP code" className="mt-1 w-full rounded-lg border border-emerald-200/20 bg-black/40 px-2 py-1.5 text-sm text-white" /></label>
            <Num label="From year" value={from} min={1970} max={2100} onChange={setFrom} />
            <label className="text-[11px] text-white/60">To year<input type="number" value={to} placeholder="latest" onChange={(e) => setTo(e.target.value === "" ? "" : Number(e.target.value))} aria-label="To year (blank = latest)" className="mt-1 w-full rounded-lg border border-emerald-200/20 bg-black/40 px-2 py-1.5 text-sm text-white" /></label>
          </div>
          {history.isFetching && <p className="mt-2 text-[11px] text-white/50">Reading the record…</p>}
          {history.data && (
            <div className="mt-2 space-y-1 text-[11px] text-white/75">
              <p>Window {history.data.window.from}–{history.data.window.to}: appreciation <span className="text-white">{pct(history.data.windowAppreciationPct)}</span>/yr over {history.data.coverage.yearsOfAppreciation} years; rent growth <span className="text-white">{pct(history.data.windowRentGrowthPct)}</span>/yr over {history.data.coverage.yearsOfRent} years.</p>
              <p className="text-white/50">Home-value record {history.data.coverage.levelsFrom ?? "—"}–{history.data.coverage.levelsTo ?? "—"}{history.data.coverage.backcastThrough ? ` (FHFA back-cast through ${history.data.coverage.backcastThrough})` : ""}. {history.data.note}</p>
              <details><summary className="cursor-pointer">Year by year</summary>
                <div className="mt-1 max-h-40 overflow-auto rounded border border-white/10">
                  <table className="w-full text-[10px]"><thead><tr className="text-white/50"><th className="px-1 text-left">Year</th><th className="px-1 text-right">Home value %</th><th className="px-1 text-right">Rent %</th></tr></thead>
                    <tbody>{history.data.appreciation.map((a) => { const r = history.data!.rentGrowth.find((x) => x.year === a.year); return <tr key={a.year}><td className="px-1">{a.year}</td><td className="px-1 text-right">{a.pct.toFixed(2)}</td><td className="px-1 text-right">{r ? r.pct.toFixed(2) : "—"}</td></tr>; })}</tbody></table>
                </div>
              </details>
              <button type="button" onClick={() => onPatch({ zip: { zip, fromYear: history.data!.window.from, toYear: history.data!.window.to, appreciationPct: history.data!.windowAppreciationPct, rentGrowthPct: history.data!.windowRentGrowthPct } })} className="rounded-full bg-emerald-400/90 px-3 py-1 text-[11px] font-bold text-black">Use this window's rates</button>
              {step.zip && <span className="ml-2 text-emerald-300">Using {step.zip.zip} {step.zip.fromYear}–{step.zip.toYear}: {pct(step.zip.appreciationPct)}/yr</span>}
            </div>
          )}
          {history.error && <p className="mt-2 text-[11px] text-amber-300">{history.error.message}</p>}
        </details>
      )}

      <div className="mt-3 rounded-xl border border-emerald-300/30 bg-emerald-400/5 p-2">
        <label className="flex items-center gap-2 text-xs font-semibold text-white"><input type="checkbox" checked={step.handoff.enabled} onChange={(e) => onPatch({ handoff: { ...step.handoff, enabled: e.target.checked } })} className="h-4 w-4 accent-emerald-400" aria-label="Save the final outcome and hand it off" /> Save the final outcome and hand it off to the next calculator</label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <label className="text-[11px] text-white/60">In year<input type="number" min={1} max={step.years} value={step.handoff.atYear ?? ""} placeholder="last" disabled={!step.handoff.enabled} onChange={(e) => onPatch({ handoff: { ...step.handoff, atYear: e.target.value === "" ? null : Number(e.target.value) } })} aria-label="Hand-off year within this calculator" className="mt-1 w-full rounded-lg border border-emerald-200/20 bg-black/40 px-2 py-1.5 text-sm text-white disabled:opacity-40" /></label>
          <Num label="% of cash value" value={step.handoff.pctOfCashValue} min={0} max={100} onChange={(n) => onPatch({ handoff: { ...step.handoff, pctOfCashValue: Math.max(0, Math.min(100, n)) } })} />
          <label className="text-[11px] text-white/60">Into<select value={step.handoff.target ?? ""} disabled={!step.handoff.enabled} onChange={(e) => onPatch({ handoff: { ...step.handoff, target: (e.target.value || null) as TransferTarget | null } })} aria-label="Where the hand-off lands" className="mt-1 w-full rounded-lg border border-emerald-200/20 bg-black/40 px-2 py-1.5 text-sm text-white disabled:opacity-40"><option value="">Next calculator's default</option>{TARGETS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select></label>
        </div>
        <p className="mt-1 text-[10px] text-white/50">Takes a share of this calculator's {spec.cashValue.replace(/([A-Z])/g, " $1").toLowerCase()}. Everything not handed off keeps compounding.</p>
      </div>
    </div>
  );
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (b: boolean) => void }) {
  return <label className="flex items-center gap-2 text-sm font-semibold text-white"><input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-emerald-400" aria-label={label} /> {label}</label>;
}

function BandChart({ bands, label }: { bands: Array<{ year: number; p10: number; p50: number; p90: number }>; label: string }) {
  if (!bands.length) return null;
  const W = 640, H = 220, L = 56, B = 24;
  const max = Math.max(...bands.map((b) => b.p90), 1), min = Math.min(0, ...bands.map((b) => b.p10));
  const x = (i: number) => L + (i / Math.max(1, bands.length - 1)) * (W - L - 8);
  const y = (v: number) => H - B - ((v - min) / (max - min || 1)) * (H - B - 12);
  const line = (k: "p10" | "p50" | "p90") => bands.map((b, i) => `${x(i).toFixed(1)},${y(b[k]).toFixed(1)}`).join(" ");
  const area = `${bands.map((b, i) => `${x(i).toFixed(1)},${y(b.p90).toFixed(1)}`).join(" ")} ${[...bands].reverse().map((b, i) => `${x(bands.length - 1 - i).toFixed(1)},${y(b.p10).toFixed(1)}`).join(" ")}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}: 10th to 90th percentile band with the median`} className="w-full rounded-xl border border-white/10 bg-black/30">
      <polygon points={area} fill="rgba(52,211,153,0.18)" />
      <polyline points={line("p10")} fill="none" stroke="rgba(52,211,153,0.6)" strokeWidth="1" />
      <polyline points={line("p90")} fill="none" stroke="rgba(52,211,153,0.6)" strokeWidth="1" />
      <polyline points={line("p50")} fill="none" stroke="#fbbf24" strokeWidth="2" />
      {[0, 0.5, 1].map((f) => { const v = min + f * (max - min); return <g key={f}><line x1={L} x2={W - 8} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,0.08)" /><text x={4} y={y(v) + 4} fill="rgba(255,255,255,0.55)" fontSize="10">{v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : `$${Math.round(v / 1000)}k`}</text></g>; })}
      <text x={L} y={H - 6} fill="rgba(255,255,255,0.55)" fontSize="10">Year 1</text>
      <text x={W - 60} y={H - 6} fill="rgba(255,255,255,0.55)" fontSize="10">Year {bands.length}</text>
      <text x={W - 200} y={14} fill="#fbbf24" fontSize="10">median</text><text x={W - 140} y={14} fill="rgba(52,211,153,0.9)" fontSize="10">10th–90th percentile</text>
    </svg>
  );
}

export default function ChainBuilder() {
  const { data, source, loading } = useClientData();
  const [store, update] = useChainStore();
  const [profileEdit, setProfileEdit] = useState(false);
  const [sims, setSims] = useState(10_000);
  const run = trpc.chain.run.useMutation();
  const mc = trpc.chain.monteCarlo.useMutation();
  const catalog = trpc.chain.catalog.useQuery(undefined, { staleTime: 600_000 });

  const derived = useMemo(() => profileFromClientData(data), [data]);
  const profile: ClientProfile = store.profileOverride ?? derived;
  const setProfile = (p: ClientProfile) => update((s) => ({ ...s, profileOverride: p }));
  const macro = store.macro;
  const setMacro = (m: MacroAssumptions) => update((s) => ({ ...s, macro: m }));
  const totalYears = store.steps.reduce((a, s) => a + s.years, 0);
  const input = { profile: { ...profile, spouseAge: profile.spouseAge ?? null }, steps: store.steps, macro };

  const download = (name: string, text: string, type = "application/json") => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); };
  const csv = () => {
    if (!run.data) return;
    const rows = run.data.steps.flatMap((s) => s.rows.map((r) => ({ calculator: s.name, ...r })));
    const cols = Object.keys(rows[0] ?? {});
    download("calculator-chain.csv", [cols.join(","), ...rows.map((r) => cols.map((c) => String((r as Record<string, unknown>)[c] ?? "")).join(","))].join("\n"), "text/csv");
  };

  return (
    <div className="rc-room-frame relative min-h-screen bg-[#03090a] p-6 text-white md:p-10">
      <PageBackdrop src="/rcs-city-river.webp" phoneSrc="/rcs-city-lattice.webp" alt="Emerald-lit skyline at dusk" fade="#03090a" />
      <div className="relative z-10 mx-auto max-w-7xl space-y-8">
        <header>
          <p className="text-[11px] font-extrabold uppercase tracking-[.22em] text-emerald-300">The calculator chain</p>
          <h1 className="mt-1 text-3xl font-bold md:text-4xl">Every calculator in a row, running as one plan</h1>
          <p className="mt-2 max-w-3xl text-white/70">Enter the picture once. Each calculator runs for the years you choose, saves its final outcome, and hands the share you pick of its cash value to the next one. The report is the aggregate of all of them running together — one deterministic path and {sims.toLocaleString()} simulated ones — with money printing, hard-asset inflation, loan availability and future taxation switchable on any run.</p>
          <p className="mt-2 text-xs text-white/50">Add a calculator from any calculator page with the dock in the corner, or pick one below. <Link href="/calculators" className="underline">All calculators</Link> · <Link href="/ultra-calculator" className="underline">Ultra Calculator</Link></p>
        </header>

        {/* Profile */}
        <section className="rounded-2xl border border-emerald-300/25 bg-[#04120e]/80 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">1. The picture (filled once, used by every calculator)</h2>
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-full border border-white/15 px-2 py-0.5 text-white/70">{store.profileOverride ? "Edited here" : loading ? "Loading profile…" : source === "client" ? "From the selected client's fact finder" : source === "assessment" ? "From your financial assessment" : "Default example — sign in and complete the fact finder to use yours"}</span>
              <button type="button" onClick={() => setProfileEdit((e) => !e)} className="rounded-full border border-emerald-300/40 px-3 py-1 font-semibold text-emerald-200">{profileEdit ? "Done" : "Edit"}</button>
              {store.profileOverride && <button type="button" onClick={() => update((s) => ({ ...s, profileOverride: null }))} className="rounded-full border border-white/20 px-3 py-1 text-white/80">Use the fact finder</button>}
            </div>
          </div>
          {profileEdit ? (
            <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
              <Num label="Age" value={profile.clientAge} onChange={(n) => setProfile({ ...profile, clientAge: n })} />
              <Num label="Income $/yr" value={profile.incomeSelfAnnual} onChange={(n) => setProfile({ ...profile, incomeSelfAnnual: n })} step={1000} />
              <Num label="Spouse income $/yr" value={profile.incomeSpouseAnnual} onChange={(n) => setProfile({ ...profile, incomeSpouseAnnual: n })} step={1000} />
              <Num label="Income growth %/yr" value={profile.incomeGrowthPct} onChange={(n) => setProfile({ ...profile, incomeGrowthPct: n })} step={0.1} />
              <Num label="Household expenses $/yr" value={profile.baseHouseholdExpensesAnnual} onChange={(n) => setProfile({ ...profile, baseHouseholdExpensesAnnual: n })} step={1000} />
              <Num label="Effective tax rate %" value={profile.effectiveTaxRatePct} onChange={(n) => setProfile({ ...profile, effectiveTaxRatePct: n })} step={0.5} />
              <Num label="Taxable investments $" value={profile.taxableAssets} onChange={(n) => setProfile({ ...profile, taxableAssets: n })} step={1000} />
              <Num label="Qualified (IRA/401k) $" value={profile.qualifiedAssets} onChange={(n) => setProfile({ ...profile, qualifiedAssets: n })} step={1000} />
              <Num label="Cash $" value={profile.cashReserves} onChange={(n) => setProfile({ ...profile, cashReserves: n })} step={1000} />
              <Num label="Home value $" value={profile.home.value} onChange={(n) => setProfile({ ...profile, home: { ...profile.home, value: n } })} step={1000} />
              <Num label="Mortgage balance $" value={profile.home.mortgageBalance} onChange={(n) => setProfile({ ...profile, home: { ...profile.home, mortgageBalance: n } })} step={1000} />
              <Num label="Mortgage rate %" value={profile.home.mortgageRatePct} onChange={(n) => setProfile({ ...profile, home: { ...profile.home, mortgageRatePct: n } })} step={0.125} />
              <Num label="Mortgage payment $/yr" value={profile.home.mortgagePaymentAnnual} onChange={(n) => setProfile({ ...profile, home: { ...profile.home, mortgagePaymentAnnual: n } })} step={100} />
            </div>
          ) : (
            <p className="mt-2 text-sm text-white/75">Age {profile.clientAge} · income {money(profile.incomeSelfAnnual + profile.incomeSpouseAnnual)}/yr · expenses {money(profile.baseHouseholdExpensesAnnual)}/yr · tax {profile.effectiveTaxRatePct}% · taxable {money(profile.taxableAssets)} · qualified {money(profile.qualifiedAssets)} · cash {money(profile.cashReserves)} · home {money(profile.home.value)} with {money(profile.home.mortgageBalance)} at {profile.home.mortgageRatePct}%.</p>
          )}
        </section>

        {/* The row */}
        <section>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">2. The row — {store.steps.length} calculators, {totalYears} years</h2>
            <div className="flex items-center gap-2 text-xs">
              <select aria-label="Add a calculator" defaultValue="" onChange={(e) => { if (e.target.value) { update((s) => ({ ...s, steps: [...s.steps, newStep(e.target.value as ChainCalculatorId)] })); e.target.value = ""; } }} className="rounded-lg border border-emerald-200/20 bg-black/40 px-2 py-1.5 text-white"><option value="">+ Add a calculator…</option>{CHAIN_CALCULATORS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              <button type="button" onClick={() => { resetChain(); update((s) => s); }} className="rounded-full border border-white/20 px-3 py-1 text-white/80">Reset to the default row</button>
            </div>
          </div>
          <div className="mt-3 flex gap-3 overflow-x-auto pb-3">
            {store.steps.map((s, i) => <StepCard key={s.id} step={s} index={i} total={store.steps.length} onPatch={(p) => { patchStep(s.id, p); update((x) => x); }} />)}
            {!store.steps.length && <p className="text-white/60">The row is empty — add a calculator.</p>}
          </div>
        </section>

        {/* Macro */}
        <section className="rounded-2xl border border-emerald-300/25 bg-[#04120e]/80 p-4">
          <h2 className="text-lg font-semibold">3. The world the plan runs in</h2>
          <p className="text-xs text-white/55">Each switch is off until you turn it on. Presets summarise a period; verify them against {catalog.data?.macroSources.map((s) => s.label.split(" (")[0]).join(", ") ?? "FRED"}.</p>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 p-3">
              <Toggle label="Federal Reserve money printing → consumer inflation" on={macro.moneyPrinting.enabled} onChange={(b) => setMacro({ ...macro, moneyPrinting: { ...macro.moneyPrinting, enabled: b } })} />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="col-span-2 text-[11px] text-white/60">Period preset<select value={macro.moneyPrinting.preset} onChange={(e) => setMacro(applyPreset(macro, e.target.value as MoneyPrintingPreset))} aria-label="Money printing preset" className="mt-1 w-full rounded-lg border border-emerald-200/20 bg-black/40 px-2 py-1.5 text-sm text-white">{(Object.keys(M2_PRESETS) as Array<keyof typeof M2_PRESETS>).map((k) => <option key={k} value={k}>{M2_PRESETS[k].label} — {M2_PRESETS[k].m2GrowthPct}%/yr</option>)}<option value="custom">Custom</option></select></label>
                <Num label="M2 growth %/yr" value={macro.moneyPrinting.m2GrowthPct} step={0.5} onChange={(n) => setMacro({ ...macro, moneyPrinting: { ...macro.moneyPrinting, preset: "custom", m2GrowthPct: n } })} />
                <Num label="Trend the economy absorbs %/yr" value={macro.moneyPrinting.trendM2GrowthPct} step={0.5} onChange={(n) => setMacro({ ...macro, moneyPrinting: { ...macro.moneyPrinting, trendM2GrowthPct: n } })} />
                <Num label="Pass-through to prices (0–1)" value={macro.moneyPrinting.passThrough} step={0.05} min={0} max={1} onChange={(n) => setMacro({ ...macro, moneyPrinting: { ...macro.moneyPrinting, passThrough: n } })} />
                <Num label="Lag (years)" value={macro.moneyPrinting.lagYears} min={0} max={5} onChange={(n) => setMacro({ ...macro, moneyPrinting: { ...macro.moneyPrinting, lagYears: n } })} />
                <Num label="Baseline inflation %/yr" value={macro.baselineCpiPct} step={0.1} onChange={(n) => setMacro({ ...macro, baselineCpiPct: n })} />
                <Num label="M2 volatility (simulations)" value={macro.moneyPrinting.m2VolPct} step={0.5} onChange={(n) => setMacro({ ...macro, moneyPrinting: { ...macro.moneyPrinting, m2VolPct: n } })} />
              </div>
            </div>
            <div className="rounded-xl border border-white/10 p-3">
              <Toggle label="Hard-asset inflation from the printing (real estate, investments, crypto)" on={macro.hardAssets.enabled} onChange={(b) => setMacro({ ...macro, hardAssets: { ...macro.hardAssets, enabled: b } })} />
              <div className="mt-2 grid grid-cols-3 gap-2">
                <Num label="Real estate β" value={macro.hardAssets.betaRealEstate} step={0.1} onChange={(n) => setMacro({ ...macro, hardAssets: { ...macro.hardAssets, betaRealEstate: n } })} />
                <Num label="Equities β" value={macro.hardAssets.betaEquities} step={0.1} onChange={(n) => setMacro({ ...macro, hardAssets: { ...macro.hardAssets, betaEquities: n } })} />
                <Num label="Crypto β" value={macro.hardAssets.betaCrypto} step={0.1} onChange={(n) => setMacro({ ...macro, hardAssets: { ...macro.hardAssets, betaCrypto: n } })} />
              </div>
              <p className="mt-1 text-[10px] text-white/45">β = extra appreciation per point of M2 growth above trend (negative when money is withdrawn).</p>
            </div>
            <div className="rounded-xl border border-white/10 p-3">
              <Toggle label="Loan availability and mortgage rates from the printing" on={macro.credit.enabled} onChange={(b) => setMacro({ ...macro, credit: { ...macro.credit, enabled: b } })} />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Num label="Base mortgage rate %" value={macro.credit.baseMortgageRatePct} step={0.125} onChange={(n) => setMacro({ ...macro, credit: { ...macro.credit, baseMortgageRatePct: n } })} />
                <Num label="Rate change per 10 pts of excess M2" value={macro.credit.rateSensitivityPer10} step={0.25} onChange={(n) => setMacro({ ...macro, credit: { ...macro.credit, rateSensitivityPer10: n } })} />
              </div>
            </div>
            <div className="rounded-xl border border-white/10 p-3">
              <Toggle label="Future taxation (effective rate drifts every year)" on={macro.futureTaxation.enabled} onChange={(b) => setMacro({ ...macro, futureTaxation: { ...macro.futureTaxation, enabled: b, startEffectiveRatePct: profile.effectiveTaxRatePct } })} />
              <div className="mt-2 grid grid-cols-3 gap-2">
                <Num label="Starts at %" value={macro.futureTaxation.startEffectiveRatePct} step={0.5} onChange={(n) => setMacro({ ...macro, futureTaxation: { ...macro.futureTaxation, startEffectiveRatePct: n } })} />
                <Num label="Drift pts/yr" value={macro.futureTaxation.driftPctPointsPerYear} step={0.05} onChange={(n) => setMacro({ ...macro, futureTaxation: { ...macro.futureTaxation, driftPctPointsPerYear: n } })} />
                <Num label="Cap %" value={macro.futureTaxation.capPct} step={1} onChange={(n) => setMacro({ ...macro, futureTaxation: { ...macro.futureTaxation, capPct: n } })} />
              </div>
            </div>
          </div>
        </section>

        {/* Run */}
        <section className="flex flex-wrap items-center gap-3">
          <button type="button" disabled={!store.steps.length || run.isPending} onClick={() => run.mutate(input)} className="rounded-full bg-emerald-400 px-6 py-2.5 text-sm font-extrabold text-black hover:bg-emerald-300 disabled:opacity-50">{run.isPending ? "Running…" : "Run the row"}</button>
          <div className="flex items-center gap-2">
            <button type="button" disabled={!store.steps.length || mc.isPending} onClick={() => mc.mutate({ ...input, simulations: sims })} className="rounded-full border border-amber-300/60 bg-amber-400/10 px-6 py-2.5 text-sm font-extrabold text-amber-200 hover:bg-amber-400/20 disabled:opacity-50">{mc.isPending ? `Running ${sims.toLocaleString()} simulations…` : `Run ${sims.toLocaleString()} simulations`}</button>
            <input type="number" min={100} max={20000} step={100} value={sims} onChange={(e) => setSims(Math.max(100, Math.min(20_000, Number(e.target.value))))} aria-label="Number of simulations" className="w-24 rounded-lg border border-emerald-200/20 bg-black/40 px-2 py-1.5 text-sm text-white" />
          </div>
          {run.data && <button type="button" onClick={() => download("calculator-chain.json", JSON.stringify({ input, run: run.data, monteCarlo: mc.data ?? null }, null, 2))} className="rounded-full border border-white/20 px-4 py-2 text-xs text-white/85">Download JSON</button>}
          {run.data && <button type="button" onClick={csv} className="rounded-full border border-white/20 px-4 py-2 text-xs text-white/85">Download CSV</button>}
          {run.data && <button type="button" onClick={() => window.print()} className="rounded-full border border-white/20 px-4 py-2 text-xs text-white/85">Print</button>}
          {(run.error || mc.error) && <p className="text-sm text-amber-300">{run.error?.message ?? mc.error?.message}</p>}
        </section>

        {/* Report */}
        {run.data && (
          <section className="space-y-6 rounded-2xl border border-emerald-300/25 bg-[#04120e]/85 p-4" data-testid="chain-report">
            <h2 className="text-lg font-semibold">4. The report — all calculators in combination</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                ["Start net worth", money(run.data.aggregate.startNetWorth)], ["Final net worth", money(run.data.aggregate.finalNetWorth)],
                ["In today's dollars", money(run.data.aggregate.finalNetWorthReal)], ["Passive income at the end", `${money(run.data.aggregate.finalPassiveIncome)}/yr`],
                ["Taxes paid over the run", money(run.data.aggregate.totalTaxesPaid)], ["Handed off between calculators", money(run.data.aggregate.totalHandedOff)],
                ["Properties owned", String(run.data.aggregate.propertiesOwned)], ["Price level at the end", `${run.data.aggregate.priceLevel.toFixed(2)}×`],
              ].map(([k, v]) => <div key={k} className="rounded-xl border border-white/10 bg-black/30 p-3"><p className="text-[10px] uppercase tracking-wider text-white/50">{k}</p><p className="text-lg font-bold text-white">{v}</p></div>)}
            </div>
            <div className="overflow-auto rounded-xl border border-white/10">
              <table className="w-full text-xs">
                <thead className="bg-white/5 text-white/60"><tr>{["Calculator", "Years", "Start net worth", "End net worth", "Contribution", "Cash value at end", "Handed off", "Passive income at end", "Taxes paid"].map((h) => <th key={h} className="px-2 py-2 text-left">{h}</th>)}</tr></thead>
                <tbody>{run.data.steps.map((s) => <tr key={s.id} className="border-t border-white/5"><td className="px-2 py-1.5 font-semibold">{s.name}</td><td className="px-2 py-1.5">{s.startYear}–{s.endYear}</td><td className="px-2 py-1.5">{money(s.startNetWorth)}</td><td className="px-2 py-1.5">{money(s.endNetWorth)}</td><td className={`px-2 py-1.5 ${s.contribution >= 0 ? "text-emerald-300" : "text-red-300"}`}>{money(s.contribution)}</td><td className="px-2 py-1.5">{money(s.cashValueAtEnd)}</td><td className="px-2 py-1.5">{s.handoff ? `${money(s.handoff.amount)} (${s.handoff.pct}% in yr ${s.handoff.year})` : "—"}</td><td className="px-2 py-1.5">{money(s.passiveIncomeAtEnd)}/yr</td><td className="px-2 py-1.5">{money(s.taxesPaid)}</td></tr>)}
                  <tr className="border-t border-emerald-300/30 bg-emerald-400/5 font-bold"><td className="px-2 py-1.5">Aggregate</td><td className="px-2 py-1.5">1–{run.data.aggregate.years}</td><td className="px-2 py-1.5">{money(run.data.aggregate.startNetWorth)}</td><td className="px-2 py-1.5">{money(run.data.aggregate.finalNetWorth)}</td><td className="px-2 py-1.5">{money(run.data.aggregate.sumOfStepContributions)}</td><td className="px-2 py-1.5">—</td><td className="px-2 py-1.5">{money(run.data.aggregate.totalHandedOff)}</td><td className="px-2 py-1.5">{money(run.data.aggregate.finalPassiveIncome)}/yr</td><td className="px-2 py-1.5">{money(run.data.aggregate.totalTaxesPaid)}</td></tr>
                </tbody>
              </table>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div><h3 className="text-sm font-semibold text-white/85">How it happened</h3><ul className="mt-1 space-y-1 text-xs text-white/70">{run.data.narrative.map((n, i) => <li key={i}>• {n}</li>)}</ul></div>
              <div><h3 className="text-sm font-semibold text-white/85">Engine notes</h3><ul className="mt-1 max-h-48 space-y-1 overflow-auto text-xs text-white/60">{run.data.moduleNotes.map((n, i) => <li key={i}>• {n}</li>)}</ul></div>
            </div>
            <details><summary className="cursor-pointer text-sm font-semibold text-white/85">Year by year, every calculator</summary>
              <div className="mt-2 max-h-96 overflow-auto rounded-xl border border-white/10"><table className="w-full text-[11px]"><thead className="sticky top-0 bg-[#04120e] text-white/60"><tr>{["Yr", "Age", "Calculator", "Gross income", "Taxes", "Expenses", "Net cash", "Taxable", "Qualified", "IUL cash", "IUL income", "Annuity", "Rental", "Home", "Mortgage", "Props", "Real estate", "Crypto", "Net worth"].map((h) => <th key={h} className="px-1.5 py-1 text-right first:text-left">{h}</th>)}</tr></thead>
                <tbody>{run.data.steps.flatMap((s) => s.rows.map((r) => <tr key={`${s.id}-${r.year}`} className="border-t border-white/5"><td className="px-1.5 py-0.5">{r.year}</td><td className="px-1.5 text-right">{r.age}</td><td className="px-1.5 text-right">{s.name}</td>{[r.grossIncome, r.taxes, r.expenses, r.netCash, r.taxableAssets, r.qualifiedAssets, r.iulCashValue, r.iulIncome, r.annuityIncome, r.rentalIncome, r.homeValue, r.homeMortgage].map((v, i) => <td key={i} className="px-1.5 text-right">{Math.round(v).toLocaleString()}</td>)}<td className="px-1.5 text-right">{r.propertiesOwned}</td><td className="px-1.5 text-right">{r.realEstateValue.toLocaleString()}</td><td className="px-1.5 text-right">{r.cryptoValue.toLocaleString()}</td><td className="px-1.5 text-right font-semibold">{r.netWorth.toLocaleString()}</td></tr>))}</tbody></table></div>
            </details>
            <p className="text-[11px] text-white/45">{run.data.disclosure}</p>
          </section>
        )}

        {mc.data && (
          <section className="space-y-4 rounded-2xl border border-amber-300/30 bg-[#12100a]/85 p-4" data-testid="chain-montecarlo">
            <h2 className="text-lg font-semibold">5. {mc.data.simulations.toLocaleString()} simulations of the whole row <span className="text-xs font-normal text-white/50">(seed {mc.data.seed}, {mc.data.elapsedMs} ms)</span></h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                ["Median final net worth", money(mc.data.final.netWorth.p50)], ["10th–90th percentile", `${money(mc.data.final.netWorth.p10)} – ${money(mc.data.final.netWorth.p90)}`],
                ["Worst / best path", `${money(mc.data.final.netWorth.worst)} / ${money(mc.data.final.netWorth.best)}`], ["Deterministic path", money(mc.data.deterministic.finalNetWorth)],
                ["Ends above today's net worth", `${mc.data.final.probabilityNetWorthAboveStart}%`], ["Net worth doubles", `${mc.data.final.probabilityNetWorthDoubles}%`],
                ["Passive income covers expenses", `${mc.data.final.probabilityPassiveIncomeCoversExpenses}%`], ["Median passive income at the end", `${money(mc.data.final.passiveIncome.p50)}/yr`],
              ].map(([k, v]) => <div key={k} className="rounded-xl border border-white/10 bg-black/30 p-3"><p className="text-[10px] uppercase tracking-wider text-white/50">{k}</p><p className="text-base font-bold text-white">{v}</p></div>)}
            </div>
            <BandChart bands={mc.data.netWorth} label="Net worth" />
            <BandChart bands={mc.data.passiveIncome} label="Passive income" />
            <details><summary className="cursor-pointer text-sm font-semibold text-white/85">Percentiles by year</summary>
              <div className="mt-2 max-h-72 overflow-auto rounded-xl border border-white/10"><table className="w-full text-[11px]"><thead className="sticky top-0 bg-[#12100a] text-white/60"><tr>{["Year", "5th", "10th", "25th", "Median", "75th", "90th", "95th", "Mean"].map((h) => <th key={h} className="px-1.5 py-1 text-right first:text-left">{h}</th>)}</tr></thead>
                <tbody>{mc.data.netWorth.map((b) => <tr key={b.year} className="border-t border-white/5"><td className="px-1.5 py-0.5">{b.year}</td>{[b.p5, b.p10, b.p25, b.p50, b.p75, b.p90, b.p95, b.mean].map((v, i) => <td key={i} className="px-1.5 text-right">{Math.round(v).toLocaleString()}</td>)}</tr>)}</tbody></table></div>
            </details>
            <p className="text-[11px] text-white/45">{mc.data.disclosure}</p>
          </section>
        )}
        <p className="text-[11px] text-white/40">Chain state is saved in this browser ({CHAIN_STORE_KEY}).</p>
        <EngineSourcesFooter path="/portal/chain" />
      </div>
    </div>
  );
}

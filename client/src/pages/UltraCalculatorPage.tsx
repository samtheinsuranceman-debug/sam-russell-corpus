// ============================================================
// ULTRA CALCULATOR — every RCS calculator in ONE machine.
// Profile in → module toggles (AI-triaged necessary vs optional,
// with on-screen explanations) → chained multi-year windows where
// every window inherits the previous window's ending income,
// expenses, assets, debts, properties, and policy values.
// ============================================================
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { ULTRA_PROFILE_KEY } from "@/components/VoiceAdvisor";
import {
  defaultModules, runUltraScenario, MODULE_CATALOG, ULTRA_DISCLOSURE,
  type ClientProfile, type UltraModules, type WindowPlan, type ModuleKey, type UltraResult,
} from "@shared/ultraEngine";

const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;

const DEFAULT_PROFILE: ClientProfile = {
  clientAge: 45,
  spouseAge: 45,
  incomeSelfAnnual: 120000,
  incomeSpouseAnnual: 80000,
  otherIncomeAnnual: 0,
  incomeGrowthPct: 3,
  baseHouseholdExpensesAnnual: 90000,
  expenseChanges: [],
  effectiveTaxRatePct: 24,
  taxableAssets: 150000,
  qualifiedAssets: 350000,
  cashReserves: 40000,
  home: { value: 450000, mortgageBalance: 280000, mortgageRatePct: 6.5, mortgagePaymentAnnual: 26400 },
  otherDebts: [],
};

function Num({ label, value, onChange, step = 1, hint }: {
  label: string; value: number; onChange: (n: number) => void; step?: number; hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-300">{label}</span>
      <input
        type="number" value={value} step={step}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
      />
      {hint && <span className="text-[10px] text-slate-500">{hint}</span>}
    </label>
  );
}

export default function UltraCalculatorPage() {
  const [profile, setProfile] = useState<ClientProfile>(DEFAULT_PROFILE);
  const [modules, setModules] = useState<UltraModules>(() => {
    const m = defaultModules();
    m.mortgageKiller.enabled = true;
    m.realEstate.enabled = true;
    m.trustIUL.enabled = true;
    return m;
  });
  const [windowLen, setWindowLen] = useState(10);
  const [windows, setWindows] = useState<WindowPlan[]>([
    { years: 10, goal: "Kill the mortgage; start the trust-owned IUL." },
    { years: 10, goal: "Second and third recycled properties; IUL income begins." },
    { years: 10, goal: "Full passive-income phase." },
  ]);
  const [result, setResult] = useState<UltraResult | null>(null);
  const [spoken, setSpoken] = useState("");
  const [goalsText, setGoalsText] = useState("");

  const plan = trpc.ultra.plan.useMutation();
  const providers = trpc.ultra.providers.useQuery(undefined, { staleTime: 5 * 60_000 });

  const set = <K extends keyof ClientProfile>(k: K, v: ClientProfile[K]) => setProfile((p) => ({ ...p, [k]: v }));
  const setHome = (k: keyof ClientProfile["home"], v: number) => setProfile((p) => ({ ...p, home: { ...p.home, [k]: v } }));
  const setMod = <K extends ModuleKey>(k: K, patch: Partial<UltraModules[K]>) =>
    setModules((m) => ({ ...m, [k]: { ...m[k], ...patch } }));

  const homeEquity = Math.max(0, profile.home.value - profile.home.mortgageBalance);
  const netCashEstimate = useMemo(() => {
    const gross = profile.incomeSelfAnnual + profile.incomeSpouseAnnual + profile.otherIncomeAnnual;
    return gross * (1 - profile.effectiveTaxRatePct / 100) - profile.baseHouseholdExpensesAnnual
      - profile.home.mortgagePaymentAnnual - profile.otherDebts.reduce((a, d) => a + d.paymentAnnual, 0);
  }, [profile]);

  const saveProfileForAdvisor = () => {
    const summary =
      `Client age ${profile.clientAge}${profile.spouseAge ? `, spouse ${profile.spouseAge}` : ""}. ` +
      `Income: self ${fmt(profile.incomeSelfAnnual)}, spouse ${fmt(profile.incomeSpouseAnnual)}, other ${fmt(profile.otherIncomeAnnual)} (growth ${profile.incomeGrowthPct}%/yr). ` +
      `Base household expenses ${fmt(profile.baseHouseholdExpensesAnnual)}/yr; blended tax ${profile.effectiveTaxRatePct}%. ` +
      `Assets: taxable ${fmt(profile.taxableAssets)}, qualified ${fmt(profile.qualifiedAssets)}, cash ${fmt(profile.cashReserves)}. ` +
      `Home ${fmt(profile.home.value)} with ${fmt(profile.home.mortgageBalance)} mortgage @ ${profile.home.mortgageRatePct}% (${fmt(profile.home.mortgagePaymentAnnual)}/yr). ` +
      `Other debts: ${profile.otherDebts.map((d) => `${d.name} ${fmt(d.balance)} @ ${d.ratePct}%`).join("; ") || "none"}. ` +
      (spoken ? `Spoken notes: ${spoken} ` : "") +
      (goalsText ? `Goals: ${goalsText}` : "");
    try { localStorage.setItem(ULTRA_PROFILE_KEY, JSON.stringify({ summary, savedAt: Date.now() })); } catch { /* private mode */ }
    return summary;
  };

  const runPlan = () => {
    const summary = saveProfileForAdvisor();
    plan.mutate({
      summary,
      goals: goalsText || windows.map((w) => w.goal).join(" / "),
      facts: {
        hasMortgage: profile.home.mortgageBalance > 0,
        hasPositiveCashflow: netCashEstimate > 0,
        homeEquity,
        wantsRentalIncome: modules.realEstate.enabled && modules.realEstate.rentalMode !== "live",
        wantsProtection: modules.trustIUL.enabled,
        wantsGuaranteedIncome: modules.incomeAnnuity.enabled,
      },
    });
  };

  const run = () => {
    saveProfileForAdvisor();
    setResult(runUltraScenario(profile, modules, windows));
  };

  const applyWindowPreset = (len: number, count: number) => {
    setWindowLen(len);
    setWindows(Array.from({ length: count }, (_, i) => ({
      years: len,
      goal: windows[i]?.goal ?? "",
    })));
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs uppercase tracking-widest text-amber-500">Russell Capital Systems</p>
        <h1 className="mt-1 text-3xl font-bold">The Ultra Calculator</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          Every calculator on this site as one machine. Enter the household once, toggle the strategy modules,
          set your planning windows — each window's goals in your words — and every window starts from the previous
          window's ending income, expenses, assets, debts, properties, and policy values, automatically.
          Use the 🎙 advisor button (bottom-right, on every page) to speak your situation instead of typing.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          <Link href="/fact-finder" className="text-amber-400 underline">Start with the Fact Finder →</Link>
        </p>

        {/* ── CLIENT PROFILE ── */}
        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-lg font-semibold text-amber-400">1 · The household</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <Num label="Client age" value={profile.clientAge} onChange={(v) => set("clientAge", v)} />
            <Num label="Spouse age" value={profile.spouseAge ?? 0} onChange={(v) => set("spouseAge", v)} />
            <Num label="Your income /yr" value={profile.incomeSelfAnnual} onChange={(v) => set("incomeSelfAnnual", v)} step={1000} />
            <Num label="Spouse income /yr" value={profile.incomeSpouseAnnual} onChange={(v) => set("incomeSpouseAnnual", v)} step={1000} />
            <Num label="Other income /yr" value={profile.otherIncomeAnnual} onChange={(v) => set("otherIncomeAnnual", v)} step={1000} />
            <Num label="Income growth %/yr" value={profile.incomeGrowthPct} onChange={(v) => set("incomeGrowthPct", v)} step={0.5} />
            <Num label="Base expenses /yr" value={profile.baseHouseholdExpensesAnnual} onChange={(v) => set("baseHouseholdExpensesAnnual", v)} step={1000} />
            <Num label="Blended tax rate %" value={profile.effectiveTaxRatePct} onChange={(v) => set("effectiveTaxRatePct", v)} step={1} />
            <Num label="Taxable assets" value={profile.taxableAssets} onChange={(v) => set("taxableAssets", v)} step={5000} />
            <Num label="Qualified (401k/IRA)" value={profile.qualifiedAssets} onChange={(v) => set("qualifiedAssets", v)} step={5000} />
            <Num label="Cash reserves" value={profile.cashReserves} onChange={(v) => set("cashReserves", v)} step={1000} />
            <Num label="Home value" value={profile.home.value} onChange={(v) => setHome("value", v)} step={5000} />
            <Num label="Mortgage balance" value={profile.home.mortgageBalance} onChange={(v) => setHome("mortgageBalance", v)} step={5000} />
            <Num label="Mortgage rate %" value={profile.home.mortgageRatePct} onChange={(v) => setHome("mortgageRatePct", v)} step={0.125} />
            <Num label="Mortgage payment /yr" value={profile.home.mortgagePaymentAnnual} onChange={(v) => setHome("mortgagePaymentAnnual", v)} step={100} />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-medium text-slate-300">Expense changes ahead (5 / 10 / 20 yrs — "year:newAnnual", comma-separated)</span>
              <input
                type="text" placeholder="e.g. 5:105000, 10:95000, 20:80000"
                onChange={(e) => {
                  const changes = e.target.value.split(",").map((pair) => {
                    const [y, a] = pair.split(":").map((s) => Number(s.trim()));
                    return { atYear: y, newAnnualExpenses: a };
                  }).filter((c) => Number.isFinite(c.atYear) && Number.isFinite(c.newAnnualExpenses));
                  set("expenseChanges", changes);
                }}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-300">Long-term debts ("name balance rate% payment/yr", one per line)</span>
              <textarea
                rows={2} placeholder={"Student loans 60000 5.5 7200\nAuto 22000 7 6000"}
                onChange={(e) => {
                  const debts = e.target.value.split("\n").map((line) => {
                    const parts = line.trim().split(/\s+/);
                    if (parts.length < 4) return null;
                    const [paymentAnnual, ratePct, balance] = [Number(parts.pop()), Number(parts.pop()), Number(parts.pop())];
                    return { name: parts.join(" "), balance, ratePct, paymentAnnual };
                  }).filter((d): d is NonNullable<typeof d> => !!d && Number.isFinite(d.balance));
                  set("otherDebts", debts);
                }}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
              />
            </label>
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-medium text-slate-300">Spoken notes from the 🎙 advisor (or paste anything)</span>
              <textarea rows={2} value={spoken} onChange={(e) => setSpoken(e.target.value)}
                placeholder="Everything you told the advisor about assets, income, debts…"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100" />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-300">Overall goals / focus</span>
              <textarea rows={2} value={goalsText} onChange={(e) => setGoalsText(e.target.value)}
                placeholder="What are we optimizing for?"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100" />
            </label>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Estimated current net cash: <span className={netCashEstimate >= 0 ? "text-emerald-400" : "text-red-400"}>{fmt(netCashEstimate)}/yr</span> ·
            Home equity: <span className="text-amber-300">{fmt(homeEquity)}</span>
          </p>
        </section>

        {/* ── MODULE TOGGLES + AI TRIAGE ── */}
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-amber-400">2 · Strategy modules</h2>
            <button onClick={runPlan} disabled={plan.isPending}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-50">
              {plan.isPending ? "Asking the AI team…" : "Ask the AI: which are necessary?"}
            </button>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {(Object.keys(MODULE_CATALOG) as ModuleKey[]).map((k) => {
              const cat = MODULE_CATALOG[k];
              const triage = plan.data?.modules.find((m) => m.module === k);
              const enabled = modules[k].enabled;
              return (
                <div key={k} className={`rounded-xl border p-4 ${enabled ? "border-amber-500/50 bg-slate-800/60" : "border-slate-800 bg-slate-900/40"}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{cat.name}</span>
                    <div className="flex items-center gap-2">
                      {triage && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          triage.status === "necessary" ? "bg-emerald-600/30 text-emerald-300"
                          : triage.status === "optional" ? "bg-amber-600/30 text-amber-300"
                          : "bg-slate-700 text-slate-400"}`}>
                          {triage.status}
                        </span>
                      )}
                      <button onClick={() => setMod(k, { enabled: !enabled } as Partial<UltraModules[typeof k]>)}
                        className={`rounded-lg px-3 py-1 text-xs font-semibold ${enabled ? "bg-amber-500 text-slate-900" : "bg-slate-700 text-slate-300"}`}>
                        {enabled ? "ON" : "OFF"}
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{cat.benefit}</p>
                  <p className="mt-1 text-[11px] text-slate-500"><span className="text-slate-400">When it matters:</span> {triage?.reason ?? cat.whenNecessary}</p>

                  {/* Per-module controls */}
                  {k === "investmentGrowth" && enabled && (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <Num label="Growth %/yr (assumed)" value={modules.investmentGrowth.growthPct} step={0.5}
                        onChange={(v) => setMod("investmentGrowth", { growthPct: v })} />
                      <Num label="% of net cash saved" value={modules.investmentGrowth.savingsRatePctOfNetCash} step={5}
                        onChange={(v) => setMod("investmentGrowth", { savingsRatePctOfNetCash: v })} />
                    </div>
                  )}
                  {k === "mortgageKiller" && enabled && (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <Num label="Recycle cycle (years)" value={modules.mortgageKiller.cycleYears} step={0.5}
                        onChange={(v) => setMod("mortgageKiller", { cycleYears: v })} hint="Typically 6–7 years" />
                      <Num label="% net cash → principal" value={modules.mortgageKiller.extraPrincipalPctOfNetCash} step={5}
                        onChange={(v) => setMod("mortgageKiller", { extraPrincipalPctOfNetCash: v })} />
                    </div>
                  )}
                  {k === "realEstate" && enabled && (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <Num label="Appreciation %/yr" value={modules.realEstate.appreciationPctDefault} step={0.25}
                        onChange={(v) => setMod("realEstate", { appreciationPctDefault: v })} />
                      <label className="block">
                        <span className="text-xs font-medium text-slate-300">Use of recycled homes</span>
                        <select value={modules.realEstate.rentalMode}
                          onChange={(e) => setMod("realEstate", { rentalMode: e.target.value as "str" | "ltr" | "live" })}
                          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100">
                          <option value="str">Short-term rental</option>
                          <option value="ltr">Long-term rental</option>
                          <option value="live">Live in it</option>
                        </select>
                      </label>
                      {modules.realEstate.rentalMode === "str" && (<>
                        <Num label="STR gross receipts (% of value, 0–100)" value={modules.realEstate.strGrossReceiptsPctOfValue} step={1}
                          onChange={(v) => setMod("realEstate", { strGrossReceiptsPctOfValue: v })} />
                        <Num label="STR expense ratio %" value={modules.realEstate.strExpenseRatioPct} step={5}
                          onChange={(v) => setMod("realEstate", { strExpenseRatioPct: v })} />
                      </>)}
                      {modules.realEstate.rentalMode === "ltr" && (
                        <Num label="LTR net yield % of value" value={modules.realEstate.ltrNetYieldPctOfValue} step={0.5}
                          onChange={(v) => setMod("realEstate", { ltrNetYieldPctOfValue: v })} />
                      )}
                      <label className="col-span-2 block">
                        <span className="text-xs font-medium text-slate-300">Appreciation per 6–7yr cycle (comma-separated %, overrides default)</span>
                        <input type="text" placeholder="e.g. 4, 3.5, 3, 2.5"
                          onChange={(e) => setMod("realEstate", {
                            appreciationPctPerCycle: e.target.value.split(",").map((s) => Number(s.trim())).filter(Number.isFinite),
                          })}
                          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100" />
                      </label>
                    </div>
                  )}
                  {k === "equityDeployment" && enabled && (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <Num label="% of home equity deployed" value={modules.equityDeployment.pctOfHomeEquityDeployed} step={5}
                        onChange={(v) => setMod("equityDeployment", { pctOfHomeEquityDeployed: v })} />
                      <label className="flex items-end gap-2 pb-2 text-xs text-slate-300">
                        <input type="checkbox" checked={modules.equityDeployment.flowsThroughTrustIUL}
                          onChange={(e) => setMod("equityDeployment", { flowsThroughTrustIUL: e.target.checked })} />
                        Flow through trust-owned IUL first (protection layer)
                      </label>
                    </div>
                  )}
                  {k === "trustIUL" && enabled && (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <Num label="Annual premium" value={modules.trustIUL.premiumAnnual} step={1000}
                        onChange={(v) => setMod("trustIUL", { premiumAnnual: v })} />
                      <Num label="Premium years" value={modules.trustIUL.premiumYears} step={1}
                        onChange={(v) => setMod("trustIUL", { premiumYears: v })} />
                      <Num label="Crediting %/yr (assumed)" value={modules.trustIUL.creditRatePct} step={0.25}
                        onChange={(v) => setMod("trustIUL", { creditRatePct: v })} />
                      <label className="block">
                        <span className="text-xs font-medium text-slate-300">Income draw rate</span>
                        <select value={modules.trustIUL.incomeRatePct}
                          onChange={(e) => setMod("trustIUL", { incomeRatePct: Number(e.target.value) as 2 | 4 })}
                          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100">
                          <option value={4}>4% of cash value</option>
                          <option value={2}>2% of cash value</option>
                        </select>
                      </label>
                      <Num label="Income starts (year #)" value={modules.trustIUL.incomeStartYear} step={1}
                        onChange={(v) => setMod("trustIUL", { incomeStartYear: v })} />
                      <div className="col-span-2 rounded-lg bg-slate-800/70 p-2 text-[11px] text-slate-400">
                        Chronic-illness access modeled at {modules.trustIUL.chronicIllnessMultiple}× annual premium =
                        <span className="text-amber-300"> {fmt(modules.trustIUL.premiumAnnual * modules.trustIUL.chronicIllnessMultiple)}</span> of
                        face amount as living-benefit income. Carrier illustration required for actual values.
                      </div>
                    </div>
                  )}
                  {k === "incomeAnnuity" && enabled && (
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      <Num label="Premium" value={modules.incomeAnnuity.premium} step={5000}
                        onChange={(v) => setMod("incomeAnnuity", { premium: v })} />
                      <Num label="Payout %/yr" value={modules.incomeAnnuity.payoutRatePct} step={0.25}
                        onChange={(v) => setMod("incomeAnnuity", { payoutRatePct: v })} />
                      <Num label="Starts (year #)" value={modules.incomeAnnuity.startYear} step={1}
                        onChange={(v) => setMod("incomeAnnuity", { startYear: v })} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {plan.data?.aiCommentary && (
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-slate-800/60 p-4 text-sm text-slate-200 whitespace-pre-wrap">
              <p className="mb-1 text-xs font-semibold uppercase text-amber-400">AI team commentary ({plan.data.aiVia})</p>
              {plan.data.aiCommentary}
            </div>
          )}
        </section>

        {/* ── WINDOWS ── */}
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-lg font-semibold text-amber-400">3 · Planning windows</h2>
          <p className="mt-1 text-xs text-slate-400">
            Pick a window length — every window's ending numbers become the next window's starting numbers.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[5, 10, 20, 30].map((len) => (
              <button key={len} onClick={() => applyWindowPreset(len, Math.max(1, Math.round(30 / len)))}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${windowLen === len ? "bg-amber-500 text-slate-900" : "bg-slate-800 text-slate-300"}`}>
                Every {len} years
              </button>
            ))}
            <label className="flex items-center gap-2 text-sm text-slate-300">
              Custom:
              <input type="number" min={1} max={40} value={windowLen}
                onChange={(e) => applyWindowPreset(Math.max(1, Number(e.target.value) || 1), windows.length)}
                className="w-16 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100" />
              yrs ×
              <input type="number" min={1} max={8} value={windows.length}
                onChange={(e) => applyWindowPreset(windowLen, Math.max(1, Math.min(8, Number(e.target.value) || 1)))}
                className="w-14 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100" />
              windows
            </label>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {windows.map((w, i) => (
              <label key={i} className="block rounded-xl border border-slate-800 bg-slate-800/40 p-3">
                <span className="text-xs font-semibold text-amber-300">Window {i + 1} · years {windows.slice(0, i).reduce((a, x) => a + x.years, 0) + 1}–{windows.slice(0, i + 1).reduce((a, x) => a + x.years, 0)}</span>
                <textarea rows={2} value={w.goal} placeholder="Goals / focus for this window"
                  onChange={(e) => setWindows((ws) => ws.map((x, j) => (j === i ? { ...x, goal: e.target.value } : x)))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100" />
              </label>
            ))}
          </div>
          <button onClick={run}
            className="mt-5 w-full rounded-xl bg-amber-500 px-4 py-3 text-lg font-bold text-slate-900 hover:bg-amber-400">
            Run the Ultra projection
          </button>
        </section>

        {/* ── RESULTS ── */}
        {result && (
          <section className="mt-6 rounded-2xl border border-amber-500/40 bg-slate-900/70 p-6">
            <h2 className="text-lg font-semibold text-amber-400">4 · The chained projection</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {result.windows.map((w) => (
                <div key={w.windowIndex} className="rounded-xl border border-slate-800 bg-slate-800/50 p-4">
                  <p className="text-xs font-semibold uppercase text-amber-300">Window {w.windowIndex + 1} · yrs {w.startYear}–{w.endYear}</p>
                  <p className="mt-1 text-[11px] italic text-slate-400">{w.goal || "no goal stated"}</p>
                  <dl className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between"><dt className="text-slate-400">Net worth</dt><dd className="font-semibold">{fmt(w.ending.netWorth)}</dd></div>
                    <div className="flex justify-between"><dt className="text-slate-400">Passive income</dt><dd className="text-emerald-400">{fmt(w.passiveIncomeAtEnd)}/yr</dd></div>
                    <div className="flex justify-between"><dt className="text-slate-400">Properties owned</dt><dd>{w.ending.propertiesOwned}</dd></div>
                    <div className="flex justify-between"><dt className="text-slate-400">Real estate value</dt><dd>{fmt(w.ending.realEstateValue)}</dd></div>
                    <div className="flex justify-between"><dt className="text-slate-400">IUL cash value</dt><dd>{fmt(w.ending.iulCashValue)}</dd></div>
                    <div className="flex justify-between"><dt className="text-slate-400">Mortgage left</dt><dd>{fmt(w.ending.homeMortgage)}</dd></div>
                  </dl>
                </div>
              ))}
            </div>

            {result.moduleNotes.length > 0 && (
              <div className="mt-4 rounded-xl bg-slate-800/60 p-4">
                <p className="text-xs font-semibold uppercase text-amber-300">Cycle events</p>
                <ul className="mt-1 list-disc pl-5 text-sm text-slate-300">
                  {result.moduleNotes.map((n, i) => <li key={i}>{n}</li>)}
                </ul>
              </div>
            )}

            {result.chronicIllnessBenefit.available && (
              <div className="mt-4 rounded-xl border border-slate-700 bg-slate-800/60 p-4 text-sm text-slate-300">
                <p className="text-xs font-semibold uppercase text-amber-300">Chronic-illness living benefit</p>
                <p className="mt-1">{result.chronicIllnessBenefit.note}</p>
              </div>
            )}

            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full min-w-[900px] text-right text-xs">
                <thead className="bg-slate-800 text-slate-300">
                  <tr>
                    {["Yr", "Age", "Gross income", "Rental", "IUL income", "Annuity", "Net cash", "Taxable", "IUL cash", "Props", "RE value", "Mortgage", "Net worth"].map((h) => (
                      <th key={h} className="px-2 py-2 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.windows.flatMap((w) => w.rows).map((r) => (
                    <tr key={r.year} className="border-t border-slate-800/60 text-slate-300">
                      <td className="px-2 py-1">{r.year}</td>
                      <td className="px-2 py-1">{r.age}</td>
                      <td className="px-2 py-1">{fmt(r.grossIncome)}</td>
                      <td className="px-2 py-1">{fmt(r.rentalIncome)}</td>
                      <td className="px-2 py-1">{fmt(r.iulIncome)}</td>
                      <td className="px-2 py-1">{fmt(r.annuityIncome)}</td>
                      <td className={`px-2 py-1 ${r.netCash < 0 ? "text-red-400" : ""}`}>{fmt(r.netCash)}</td>
                      <td className="px-2 py-1">{fmt(r.taxableAssets)}</td>
                      <td className="px-2 py-1">{fmt(r.iulCashValue)}</td>
                      <td className="px-2 py-1">{r.propertiesOwned}</td>
                      <td className="px-2 py-1">{fmt(r.realEstateValue)}</td>
                      <td className="px-2 py-1">{fmt(r.homeMortgage)}</td>
                      <td className="px-2 py-1 font-semibold text-amber-300">{fmt(r.netWorth)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-[11px] leading-snug text-slate-500">{ULTRA_DISCLOSURE}</p>
          </section>
        )}

        {providers.data && (
          <p className="mt-6 text-center text-[11px] text-slate-600">
            AI team: {providers.data.team.map((t) => `${t.label}${t.configured ? " ✓" : " (not configured)"}`).join(" · ")} ·
            Voice out: {providers.data.voiceOut ? "configured ✓" : "not configured"} — keys live only in the server's environment panel.
          </p>
        )}
      </div>
    </div>
  );
}

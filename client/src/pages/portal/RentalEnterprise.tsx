// ============================================================
// THE RENTAL ENTERPRISE — one house or four with the same purchasing power,
// every loan written, the twenty- or thirty-year pro-forma, the hundred
// hours, and the trust loop: tax saved → premium into an irrevocable trust's
// indexed universal life → policy loans → principal-only payments → the
// next policy. Every number is arithmetic on the inputs printed on the page
// or on a series read from a named public file.
// ============================================================
import { Fragment, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { Home, Landmark, BookOpen, Calculator, Compass, Scale, ShieldCheck, FileText, Clock, ExternalLink, RefreshCw } from "lucide-react";
import { INSURED_NOTE } from "@shared/mutualIulCarriers";

const CARD = "rounded-2xl border border-emerald-400/20 bg-white/[0.04]";
const INPUT = "rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white w-full";
const BTN = "rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10";
const PRIMARY = "rounded-lg bg-emerald-400 px-3 py-1.5 text-xs font-semibold text-black hover:bg-emerald-300";
const H = "text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/80";
const usd = (n: number | null | undefined) => (n == null || !Number.isFinite(n) ? "—" : n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }));
const pct = (n: number | null | undefined, d = 1) => (n == null || !Number.isFinite(n) ? "—" : `${(n * 100).toFixed(d)}%`);

type Costs = { propertyTaxPct: number; insurancePerYear: number; hoaPerYear: number; maintenancePct: number; managementPct: number; utilitiesPerYear: number; platformFeePct: number; cleaningPerYear: number };
type Tax = { buildingSharePct: number; costSegSharePct: number; bonusPct: number; marginalRatePct: number; depreciationYears: number };
type Iul = { optionId: string; startYear: number; premiumLoadPct: number; annualChargePctOfValue: number; loanRatePct: number; firstLoanYear: number; maxLoanPctOfValue: number; newPolicyThreshold: number };
const LTR_COSTS: Costs = { propertyTaxPct: 1.0, insurancePerYear: 2_500, hoaPerYear: 0, maintenancePct: 1, managementPct: 8, utilitiesPerYear: 0, platformFeePct: 0, cleaningPerYear: 0 };
const STR_COSTS: Costs = { propertyTaxPct: 1.0, insurancePerYear: 3_500, hoaPerYear: 0, maintenancePct: 1, managementPct: 10, utilitiesPerYear: 4_000, platformFeePct: 3, cleaningPerYear: 6_000 };
const TAX0: Tax = { buildingSharePct: 80, costSegSharePct: 25, bonusPct: 100, marginalRatePct: 37, depreciationYears: 27.5 };
const IUL0: Iul = { optionId: "", startYear: 1994, premiumLoadPct: 8, annualChargePctOfValue: 1.5, loanRatePct: 5, firstLoanYear: 2, maxLoanPctOfValue: 90, newPolicyThreshold: 250_000 };

export default function RentalEnterprise() {
  const status = trpc.rental.status.useQuery(undefined, { refetchOnWindowFocus: false, retry: false });
  const carriers = trpc.rental.carriers.useQuery(undefined, { refetchOnWindowFocus: false, retry: false });
  const trust = trpc.rental.trust.useQuery(undefined, { refetchOnWindowFocus: false, retry: false });

  // Capacity: the Fact Finder's figures with any override typed here.
  const [over, setOver] = useState<Record<string, number | null>>({});
  const capacity = trpc.rental.capacity.useQuery(over as never, { refetchOnWindowFocus: false, retry: false });
  const cap = capacity.data?.capacity;
  const power = capacity.data?.power;

  // Where to look and how far back.
  const [states, setStates] = useState("");
  const [windowYears, setWindowYears] = useState(6);
  const [count, setCount] = useState(4);
  useEffect(() => { if (!states && capacity.data?.state) setStates(capacity.data.state); }, [capacity.data, states]);
  const stateList = states.split(/[,\s]+/).map((s) => s.trim().toUpperCase()).filter((s) => /^[A-Z]{2}$/.test(s));
  const candidates = trpc.rental.candidates.useQuery({ states: stateList.length ? stateList : undefined, windowYears, budget: power?.purchasingPower ?? 0, count }, { enabled: !!power && stateList.length > 0, refetchOnWindowFocus: false, retry: false });
  const plans = candidates.data?.plans;

  // The plan's settings.
  const [kind, setKind] = useState<"ltr" | "str">("ltr");
  const [nightly, setNightly] = useState({ nightlyRate: 0, occupancyPct: 0, source: "typed from a registry site", asOf: new Date().toISOString().slice(0, 10) });
  const [terms, setTerms] = useState({ startYear: new Date().getFullYear() + 1, startMonth: 1, staggerMonths: 6, horizonYears: 30 as 20 | 30, termYears: 30 as 20 | 30, interestOnlyYears: 0, investorSpreadPct: 0.5, rateShiftPct: 0, furnishing: 20_000, assignAfterTaxCashPct: 0 });
  const [costs, setCosts] = useState<Costs>(LTR_COSTS);
  const [tax, setTax] = useState<Tax>(TAX0);
  const [iul, setIul] = useState<Iul>(IUL0);
  const [loopOn, setLoopOn] = useState(true);
  const [which, setWhich] = useState<"one" | "several">("several");
  useEffect(() => { setCosts(kind === "ltr" ? LTR_COSTS : STR_COSTS); }, [kind]);
  useEffect(() => { if (!iul.optionId && carriers.data?.indexOptions[0]) setIul((s) => ({ ...s, optionId: carriers.data!.indexOptions[0]!.id })); }, [carriers.data, iul.optionId]);

  const picksFor = (sel: "one" | "several") => {
    const list = sel === "one" ? (plans?.one ? [plans.one] : []) : (plans?.several ?? []);
    return list.map((c) => ({ zip: c.zip, price: Math.round(c.value), label: `${c.city ?? ""} ${c.state ?? ""} ${c.zip}`.trim(), monthlyRent: c.rent, appreciationPct: c.appreciationWindow == null ? null : Math.round(c.appreciationWindow * 10000) / 100, rentGrowthPct: c.rentGrowth == null ? null : Math.round(c.rentGrowth * 10000) / 100 }));
  };
  const request = (sel: "one" | "several") => cap ? ({
    capacity: cap, picks: picksFor(sel), ...terms,
    income: kind === "ltr" ? { kind: "ltr" as const, source: "Zillow ZORI, latest year for the zip", asOf: String(candidates.data?.candidates[0]?.rentYear ?? "") } : { kind: "str" as const, ...nightly },
    costs, tax, growth: { expenseGrowthPct: null, appreciationPct: null, rentGrowthPct: null },
    iul: loopOn && iul.optionId ? iul : null, assignAfterTaxCashPct: terms.assignAfterTaxCashPct,
  }) : null;
  const reqOne = request("one"), reqSeveral = request("several");
  const planOne = trpc.rental.plan.useQuery(reqOne as never, { enabled: !!reqOne && reqOne.picks.length > 0, refetchOnWindowFocus: false, retry: false });
  const planSeveral = trpc.rental.plan.useQuery(reqSeveral as never, { enabled: !!reqSeveral && reqSeveral.picks.length > 0, refetchOnWindowFocus: false, retry: false });
  const shown = which === "one" ? planOne.data : planSeveral.data;
  const attorneys = trpc.rental.attorneys.useQuery({ state: stateList[0] }, { refetchOnWindowFocus: false, retry: false });
  const rates = status.data?.rates;
  const fedLine = useMemo(() => { const f = rates?.fedFunds; if (!f) return null; const s = f.annual; const last = s.values.slice(-8).map((v, i) => `${s.startYear + s.values.length - 8 + i}: ${v == null ? "—" : v.toFixed(2)}%`); return { latest: f.latestPct, asOf: f.asOf, recent: last }; }, [rates]);

  const num = (k: string, v: string) => setOver((s) => ({ ...s, [k]: v === "" ? null : Number(v) }));

  return (
    <AppShell title="The Rental Enterprise">
      <div className="mx-auto max-w-7xl space-y-6 pb-16">
        <div className={`${CARD} p-6`}>
          <p className={H}><Home size={12} className="mr-1 inline" /> Rental properties</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">One house or four with the same money, every loan written, and the tax saved recycled through the trust</h1>
          <p className="mt-2 text-sm text-white/70">Your purchasing power comes from your own income, cash and credit under the lender's published rules. The candidates come from every zip the <Link href="/portal/zip-engine" className="text-emerald-300 underline">Zip Engine</Link> stores, scored on the record: rent yield, appreciation over the window you choose, the county's FEMA hazard rating, the worst fall. The loans are written at Freddie Mac's rate of the day plus the add-on your lender quotes. The plan runs twenty or thirty years, twice: once plain, once with the trust loop paying principal from policy loans. The difference is printed.</p>
          <p className="mt-2 text-[11px] text-white/50">Illustrations under the assumptions printed on this page; not results any client received. The <Link href="/portal/short-term-rentals" className="underline">Short-Term Rentals</Link> page reads the nightly figures; the <Link href="/portal/str-strategy" className="underline">STR Tax Strategy</Link> page carries the statutes.</p>
        </div>

        {/* 1. Capacity */}
        <div className={`${CARD} p-6`}>
          <p className={H}><Calculator size={12} className="mr-1 inline" /> 1. What you can carry</p>
          <div className="mt-3 grid gap-3 md:grid-cols-5">
            {([["annualIncome", "Annual income"], ["cashAvailable", "Cash available"], ["monthlyDebts", "Monthly debt payments"], ["creditScore", "Credit score"], ["minDownPct", "Down %"], ["closingPct", "Closing %"], ["reservesMonths", "Reserve months"], ["ratePct", "Rate % (record)"], ["termYears", "Term years"]] as Array<[string, string]>).map(([k, label]) => (
              <label key={k} className="block text-[11px] text-white/70">{label}<input type="number" className={`${INPUT} mt-0.5`} value={over[k] ?? (cap ? String((cap as Record<string, unknown>)[k] ?? "") : "")} onChange={(e) => num(k, e.target.value)} /></label>
            ))}
            <label className="block text-[11px] text-white/70">Max debt-to-income<input type="number" step={0.01} className={`${INPUT} mt-0.5`} value={over.maxDti ?? (cap ? cap.maxDti : "")} onChange={(e) => num("maxDti", e.target.value)} /></label>
          </div>
          {capacity.data ? (
            <div className="mt-3 text-xs text-white/70">
              <div className="text-[11px] text-white/50">Read from your Fact Finder: {capacity.data.readFrom.length ? capacity.data.readFrom.join(", ") : "nothing yet; type the figures above"}. Lender rules: <a className="underline" href={status.data?.lenderRules.source} target="_blank" rel="noreferrer">{status.data?.lenderRules.label}</a>.</div>
              <ul className="mt-1 space-y-1">{power?.lines.map((l, i) => <li key={i} className={i === 2 ? "font-semibold text-white" : ""}>{l}</li>)}</ul>
            </div>
          ) : <div className="mt-3 text-xs text-white/50">{capacity.isFetching ? "reading…" : "Sign in with a Fact Finder to size the purchase."}</div>}
        </div>

        {/* 2. Candidates and the two plans */}
        <div className={`${CARD} p-6`}>
          <p className={H}><Compass size={12} className="mr-1 inline" /> 2. Where, and one house or several</p>
          <div className="mt-3 grid gap-3 md:grid-cols-4 text-xs text-white/70">
            <label className="block">States (two letters, comma-separated)<input className={`${INPUT} mt-0.5`} value={states} onChange={(e) => setStates(e.target.value)} placeholder="NC, SC, TN" /></label>
            <label className="block">Appreciation window
              <select className={`${INPUT} mt-0.5`} value={windowYears} onChange={(e) => setWindowYears(Number(e.target.value))}>
                <option value={6}>Six years, since COVID</option><option value={10}>Ten years</option><option value={20}>Twenty years</option><option value={30}>Thirty years</option><option value={60}>The whole record</option>
              </select>
            </label>
            <label className="block">Properties in Plan B<select className={`${INPUT} mt-0.5`} value={count} onChange={(e) => setCount(Number(e.target.value))}>{[3, 4].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
            <div className="text-[11px] text-white/50">{candidates.data ? `${candidates.data.considered.toLocaleString("en-US")} zips considered in ${stateList.join(", ")}; hazard record known for ${candidates.data.hazardsKnown.toLocaleString("en-US")} of them (${status.data?.hazards.counties.toLocaleString("en-US") ?? 0} counties on file${status.data?.hazards.asOf ? `, ${status.data.hazards.asOf}` : ""}).` : candidates.isFetching ? "reading the store…" : stateList.length ? "" : "Name at least one state."}</div>
          </div>
          {plans && (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <PlanCard title="Plan A: one property" sub={plans.one ? `${plans.one.city ?? ""} ${plans.one.state ?? ""} ${plans.one.zip}` : "No zip's typical home is within 30% of the purchasing power in these states."} rows={plans.one ? [plans.one] : []} active={which === "one"} onPick={() => setWhich("one")} />
              <PlanCard title={`Plan B: ${plans.several.length} properties, the same money`} sub={plans.several.length ? "A smaller house sells into a far wider pool of buyers; its resale is the more permanent of the two." : "Not enough zips near a quarter of the purchasing power in these states."} rows={plans.several} active={which === "several"} onPick={() => setWhich("several")} />
            </div>
          )}
          {candidates.data && candidates.data.candidates.length > 0 && (
            <details className="mt-3 text-xs text-white/70"><summary className="cursor-pointer text-white/60">All {candidates.data.candidates.length} ranked candidates, with the terms behind each score</summary>
              <div className="mt-2 overflow-x-auto"><table className="w-full text-[11px]"><thead><tr className="text-white/50"><th className="py-1 text-left">Zip</th><th className="text-left">Place</th><th className="text-right">Typical value</th><th className="text-right">Rent</th><th className="text-right">Yield</th><th className="text-right">Appreciation/yr</th><th className="text-left">FEMA</th><th className="text-right">Score</th><th className="text-left">Why</th></tr></thead>
                <tbody>{candidates.data.candidates.map((c) => <tr key={c.zip} className="border-t border-white/5"><td className="py-1"><Link href="/portal/zip-engine" className="underline">{c.zip}</Link></td><td>{c.city ?? ""} {c.state ?? ""}{c.county ? ` · ${c.county}` : ""}</td><td className="text-right">{usd(c.value)} <span className="text-white/40">{c.valueYear}</span></td><td className="text-right">{c.rent == null ? "—" : `${usd(c.rent)}/mo`}</td><td className="text-right">{pct(c.grossYield)}</td><td className="text-right">{pct(c.appreciationWindow)}</td><td>{c.hazard?.rating ?? "—"}</td><td className="text-right font-semibold text-white">{c.score == null ? "—" : (c.score * 100).toFixed(1)}</td><td className="text-white/50">{c.reasons.join("; ")}</td></tr>)}</tbody></table></div>
            </details>
          )}
        </div>

        {/* 3. Settings */}
        <div className={`${CARD} p-6`}>
          <p className={H}><FileText size={12} className="mr-1 inline" /> 3. The terms</p>
          <div className="mt-3 grid gap-4 md:grid-cols-4 text-[11px] text-white/70">
            <div>
              <div className="font-semibold uppercase tracking-wider text-white/50">Income</div>
              <select className={`${INPUT} mt-1`} value={kind} onChange={(e) => setKind(e.target.value as "ltr" | "str")}><option value="ltr">Long-term rent from the zip's record (Zillow ZORI)</option><option value="str">Short-term: nightly rate and occupancy you read</option></select>
              {kind === "str" && (<>
                <label className="mt-1 block">Nightly rate<input type="number" className={`${INPUT} mt-0.5`} value={nightly.nightlyRate} onChange={(e) => setNightly((s) => ({ ...s, nightlyRate: Number(e.target.value) }))} /></label>
                <label className="mt-1 block">Occupancy %<input type="number" className={`${INPUT} mt-0.5`} value={nightly.occupancyPct} onChange={(e) => setNightly((s) => ({ ...s, occupancyPct: Number(e.target.value) }))} /></label>
                <label className="mt-1 block">Read from<input className={`${INPUT} mt-0.5`} value={nightly.source} onChange={(e) => setNightly((s) => ({ ...s, source: e.target.value }))} /></label>
                <label className="mt-1 block">On<input type="date" className={`${INPUT} mt-0.5`} value={nightly.asOf} onChange={(e) => setNightly((s) => ({ ...s, asOf: e.target.value }))} /></label>
                <label className="mt-1 block">Furnishing<input type="number" className={`${INPUT} mt-0.5`} value={terms.furnishing} onChange={(e) => setTerms((s) => ({ ...s, furnishing: Number(e.target.value) }))} /></label>
              </>)}
            </div>
            <div>
              <div className="font-semibold uppercase tracking-wider text-white/50">Timing and the loan</div>
              {([["startYear", "First purchase, year"], ["startMonth", "First purchase, month"], ["staggerMonths", "Months between purchases"], ["interestOnlyYears", "Interest-only years"], ["investorSpreadPct", "Lender's investor add-on %"]] as Array<[keyof typeof terms, string]>).map(([k, label]) => (
                <label key={k} className="mt-1 block">{label}<input type="number" step={k === "investorSpreadPct" ? 0.05 : 1} className={`${INPUT} mt-0.5`} value={terms[k]} onChange={(e) => setTerms((s) => ({ ...s, [k]: Number(e.target.value) }))} /></label>
              ))}
              <label className="mt-1 block">Term<select className={`${INPUT} mt-0.5`} value={terms.termYears} onChange={(e) => setTerms((s) => ({ ...s, termYears: Number(e.target.value) as 20 | 30 }))}><option value={20}>20 years</option><option value={30}>30 years</option></select></label>
              <label className="mt-1 block">Show<select className={`${INPUT} mt-0.5`} value={terms.horizonYears} onChange={(e) => setTerms((s) => ({ ...s, horizonYears: Number(e.target.value) as 20 | 30 }))}><option value={20}>20 years</option><option value={30}>30 years</option></select></label>
              <label className="mt-1 block">Fed scenario: shift every loan's rate by %<input type="number" step={0.25} className={`${INPUT} mt-0.5`} value={terms.rateShiftPct} onChange={(e) => setTerms((s) => ({ ...s, rateShiftPct: Number(e.target.value) }))} /></label>
              {fedLine && <div className="mt-1 text-[10px] text-white/40">Federal funds rate {fedLine.latest.toFixed(2)}% as of {fedLine.asOf} (FRED FEDFUNDS). Annual averages: {fedLine.recent.join(" · ")}. A cut lowers the rate on a new loan and eases a tenant's own borrowing; a rise does the opposite. The record does not give a rent-per-point figure, so this slider moves the loan and you judge the rent.</div>}
            </div>
            <div>
              <div className="font-semibold uppercase tracking-wider text-white/50">Running it (your figures)</div>
              {(Object.keys(costs) as Array<keyof Costs>).map((k) => <label key={k} className="mt-1 block">{COST_LABEL[k]}<input type="number" step={/Pct$/.test(k) ? 0.05 : 100} className={`${INPUT} mt-0.5`} value={costs[k]} onChange={(e) => setCosts((s) => ({ ...s, [k]: Number(e.target.value) }))} /></label>)}
              <div className="mt-1 text-[10px] text-white/40">HOA dues and the insurance premium are the HOA statement's and the insurer's declarations page's figures; no public body publishes them by zip. The county's hazard record is on the plan below.</div>
            </div>
            <div>
              <div className="font-semibold uppercase tracking-wider text-white/50">Tax line and the trust loop</div>
              {(Object.keys(tax) as Array<keyof Tax>).map((k) => <label key={k} className="mt-1 block">{TAX_LABEL[k]}<input type="number" step={k === "depreciationYears" ? 0.5 : 1} className={`${INPUT} mt-0.5`} value={tax[k]} onChange={(e) => setTax((s) => ({ ...s, [k]: Number(e.target.value) }))} /></label>)}
              <label className="mt-2 flex items-center gap-2 text-white"><input type="checkbox" checked={loopOn} onChange={(e) => setLoopOn(e.target.checked)} /> Run the trust loop</label>
              {loopOn && (<>
                <label className="mt-1 block">Index account (backtester)<select className={`${INPUT} mt-0.5`} value={iul.optionId} onChange={(e) => setIul((s) => ({ ...s, optionId: e.target.value }))}>{carriers.data?.indexOptions.map((o) => <option key={o.id} value={o.id}>{o.name} — {o.carrier}{o.cap != null ? `, cap ${o.cap}%` : ", uncapped"}{o.participation !== 100 ? `, ${o.participation}% participation` : ""}</option>)}</select></label>
                {([["startYear", "History starts (policy year 1)"], ["premiumLoadPct", "Premium load %"], ["annualChargePctOfValue", "Annual charge % of value"], ["loanRatePct", "Policy loan rate %"], ["firstLoanYear", "First policy year a loan is allowed"], ["maxLoanPctOfValue", "Max loan % of cash value"], ["newPolicyThreshold", "New policy when a year's premium exceeds"]] as Array<[keyof Iul, string]>).map(([k, label]) => (
                  <label key={k} className="mt-1 block">{label}<input type="number" step={k === "newPolicyThreshold" ? 10000 : k === "startYear" || k === "firstLoanYear" ? 1 : 0.25} className={`${INPUT} mt-0.5`} value={iul[k]} onChange={(e) => setIul((s) => ({ ...s, [k]: k === "optionId" ? e.target.value : Number(e.target.value) }))} /></label>
                ))}
                <label className="mt-1 block">After-tax cash also assigned to premium %<input type="number" className={`${INPUT} mt-0.5`} value={terms.assignAfterTaxCashPct} onChange={(e) => setTerms((s) => ({ ...s, assignAfterTaxCashPct: Number(e.target.value) }))} /></label>
                <div className="mt-1 text-[10px] text-white/40">Loads, charges, loan rate and the first loan year are typed from the carrier's own rate sheet and policy form on the day (the reading is in section 7). First-year loans were not verified for any carrier in this pass, so the default is policy year 2.</div>
              </>)}
            </div>
          </div>
        </div>

        {/* 4. The loans */}
        {shown && (
          <div className={`${CARD} p-6`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className={H}><Landmark size={12} className="mr-1 inline" /> 4. The loans, written ({which === "one" ? "Plan A" : "Plan B"})</p>
              <div className="flex gap-2"><button className={which === "one" ? PRIMARY : BTN} onClick={() => setWhich("one")} disabled={!planOne.data}>Plan A</button><button className={which === "several" ? PRIMARY : BTN} onClick={() => setWhich("several")} disabled={!planSeveral.data}>Plan B</button></div>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {shown.letters.map((l) => (
                <div key={l.zip + l.purchase} className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/75">
                  <div className="font-semibold text-white">{l.label}</div>
                  <ul className="mt-1 space-y-0.5">{l.lines.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
              ))}
            </div>
            <ul className="mt-3 space-y-1 text-[11px] text-white/50">{shown.assumptions.map((a, i) => <li key={i}>{a}</li>)}</ul>
          </div>
        )}

        {/* 5. The enterprise, year by year */}
        {shown && (
          <div className={`${CARD} p-6`}>
            <p className={H}><Calculator size={12} className="mr-1 inline" /> 5. The enterprise, {terms.horizonYears} years</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-7 text-sm">
              <Stat label="Cash invested" value={usd(shown.enterprise.totals.cashInvested)} />
              <Stat label="Tax saved, total" value={usd(shown.enterprise.totals.taxSaved)} sub="at your marginal rate" />
              <Stat label="Interest, plain" value={usd(shown.enterprise.totals.interestPaidWithoutLoop)} />
              <Stat label="Interest, with the loop" value={usd(shown.enterprise.totals.interestPaidWithLoop)} />
              <Stat label="Interest saved" value={usd(shown.enterprise.totals.interestSaved)} sub={shown.enterprise.totals.firstPayoffYear ? `first payoff ${shown.enterprise.totals.firstPayoffYear}` : undefined} />
              <Stat label="Equity at the end" value={usd(shown.enterprise.totals.endEquity)} />
              <Stat label="Net worth at the end" value={usd(shown.enterprise.totals.endNetWorth)} sub="equity + policy value − loans" />
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead><tr className="text-white/50"><th className="py-1 text-left">Year</th><th className="text-right">Gross</th><th className="text-right">Operating</th><th className="text-right">NOI</th><th className="text-right">Interest</th><th className="text-right">Principal</th><th className="text-right">Cash flow</th><th className="text-right">Depreciation</th><th className="text-right">Tax saved</th><th className="text-right">After tax</th><th className="text-right">Value</th><th className="text-right">Debt</th><th className="text-right">Equity</th><th className="text-right">Premium in</th><th className="text-right">Policy value</th><th className="text-right">Policy loans</th><th className="text-right">To principal</th><th className="text-right">Net worth</th></tr></thead>
                <tbody>{shown.enterprise.years.map((y) => (
                  <tr key={y.year} className="border-t border-white/5 text-white/80"><td className="py-1">{y.year}</td><td className="text-right">{usd(y.gross)}</td><td className="text-right">{usd(y.operating)}</td><td className="text-right">{usd(y.noi)}</td><td className="text-right">{usd(y.interest)}</td><td className="text-right">{usd(y.principal)}</td><td className={`text-right ${y.cashFlow < 0 ? "text-amber-300" : ""}`}>{usd(y.cashFlow)}</td><td className="text-right">{usd(y.depreciation)}</td><td className="text-right text-emerald-300">{usd(y.taxSaved)}</td><td className="text-right font-semibold text-white">{usd(y.afterTax)}</td><td className="text-right">{usd(y.value)}</td><td className="text-right">{usd(y.debt)}</td><td className="text-right">{usd(y.equity)}</td><td className="text-right">{usd(y.premiumIn)}</td><td className="text-right">{usd(y.policyValue)}</td><td className="text-right">{usd(y.policyLoans)}</td><td className="text-right text-emerald-300">{usd(y.toPrincipal)}</td><td className="text-right font-semibold text-white">{usd(y.netWorth)}</td></tr>
                ))}</tbody>
              </table>
            </div>
            <p className="mt-2 text-[11px] text-white/50">Tax saved is the year's paper loss × your marginal rate, sheltering other income only when the material-participation rule below is met. Depreciation: the cost-segregated share and any furnishing at {tax.bonusPct}% bonus in the purchase year, the building's remainder straight-line over {tax.depreciationYears} years. Value grows at each zip's appreciation over the {windowYears}-year window; rent at the zip's rent trend; costs at the CPI reading.</p>
            {shown.enterprise.perProperty.length > 1 && (
              <details className="mt-2 text-xs text-white/70"><summary className="cursor-pointer text-white/60">Each property on its own</summary>
                {shown.enterprise.perProperty.map(({ plan, result }) => (
                  <div key={plan.zip} className="mt-2 overflow-x-auto"><div className="font-semibold text-white">{plan.label}: {usd(plan.price)}, {plan.purchaseYear}-{String(plan.purchaseMonth).padStart(2, "0")}, appreciation {plan.appreciationPct.toFixed(2)}%/yr, rent growth {plan.rentGrowthPct.toFixed(2)}%/yr</div>
                    <table className="w-full text-[11px]"><thead><tr className="text-white/50"><th className="py-1 text-left">Year</th><th className="text-right">Gross</th><th className="text-right">NOI</th><th className="text-right">Interest</th><th className="text-right">Principal</th><th className="text-right">Extra principal</th><th className="text-right">Depreciation</th><th className="text-right">After tax</th><th className="text-right">Balance</th><th className="text-right">Equity</th></tr></thead>
                      <tbody>{result.years.map((y) => <tr key={y.year} className="border-t border-white/5"><td className="py-0.5">{y.year}</td><td className="text-right">{usd(y.gross)}</td><td className="text-right">{usd(y.noi)}</td><td className="text-right">{usd(y.interest)}</td><td className="text-right">{usd(y.principal)}</td><td className="text-right text-emerald-300">{usd(y.extraPrincipal)}</td><td className="text-right">{usd(y.depreciation)}</td><td className="text-right">{usd(y.afterTax)}</td><td className="text-right">{usd(y.loanBalance)}</td><td className="text-right">{usd(y.equity)}</td></tr>)}</tbody></table></div>
                ))}
              </details>
            )}
          </div>
        )}

        {/* 6. The hundred hours */}
        <div className={`${CARD} p-6`}>
          <p className={H}><Clock size={12} className="mr-1 inline" /> 6. The hundred hours</p>
          <p className="mt-2 text-sm text-white/70">The plan's tax line depends on the {status.data?.hours ?? 100} hours a year of material participation. The log below is what counts, in your own name; a recording is the proof.</p>
          <ul className="mt-2 list-disc pl-5 text-xs text-white/70">{(status.data?.log ?? []).map((l, i) => <li key={i}>{l}</li>)}</ul>
          <ul className="mt-2 space-y-1 text-[11px] text-white/50">{(status.data?.sources ?? []).map((s) => <li key={s.url}><a className="underline" href={s.url} target="_blank" rel="noreferrer">{s.label}</a></li>)}</ul>
        </div>

        {/* 7. The carriers */}
        <div className={`${CARD} p-6`}>
          <p className={H}><ShieldCheck size={12} className="mr-1 inline" /> 7. The carriers: mutual companies only</p>
          <p className="mt-2 text-sm text-white/70">A carrier is on this list only if it is a mutual company or owned by a mutual holding company. Each rating carries its date and the page it was read from; anything not read from the carrier's own site is marked unverified rather than filled in. {shown?.crediting ? `The loop above credits ${shown.crediting.name} (backtester key ${shown.crediting.carrierKey}) by its history from ${shown.crediting.startYear}.` : ""}</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead><tr className="text-white/50"><th className="py-1 text-left">Carrier</th><th className="text-left">Mutual structure</th><th className="text-left">Ratings (date)</th><th className="text-left">Size</th><th className="text-left">Accumulation IUL</th><th className="text-left">Index strategies</th><th className="text-left">First-year loans</th></tr></thead>
              <tbody>{(carriers.data?.carriers ?? []).map((c) => (
                <tr key={c.id} className="border-t border-white/5 align-top text-white/80">
                  <td className="py-2 pr-2 font-semibold text-white"><a className="underline" href={c.home} target="_blank" rel="noreferrer">{c.name}</a>{c.founded.value ? <div className="font-normal text-white/50">since {c.founded.value}</div> : <div className="font-normal text-amber-200/70">founding year unverified</div>}</td>
                  <td className="py-2 pr-2 max-w-xs">{c.ownership.value} <V v={c.ownership} /></td>
                  <td className="py-2 pr-2">{c.ratings.map((r) => <div key={r.agency}>{r.agency} {r.rating}{r.asOf ? ` (${r.asOf})` : ""} {r.verified ? <a className="text-white/40 underline" href={r.source} target="_blank" rel="noreferrer">page</a> : <span className="text-amber-200/70">unverified{r.note ? `: ${r.note}` : ""}</span>}</div>)}</td>
                  <td className="py-2 pr-2">{c.size.length ? c.size.map((s) => <div key={s.label}>{s.label}: {s.value} <V v={s} /></div>) : <span className="text-white/40">not read</span>}</td>
                  <td className="py-2 pr-2">{c.product.value ?? <span className="text-white/40">not read</span>} <V v={c.product} /></td>
                  <td className="py-2 pr-2 max-w-sm">{c.strategies.length ? c.strategies.map((s, i) => <div key={i}>{s.value} <V v={s} /></div>) : <span className="text-white/40">not read</span>}</td>
                  <td className="py-2 pr-2">{c.firstYearLoans.value} <V v={c.firstYearLoans} /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2 text-[11px] text-white/60">
            <div><div className="font-semibold uppercase tracking-wider text-white/50">Before a policy is chosen</div><ol className="mt-1 list-decimal pl-5 space-y-0.5">{(carriers.data?.protocol ?? []).map((p, i) => <li key={i}>{p}</li>)}</ol></div>
            <div><div className="font-semibold uppercase tracking-wider text-white/50">The scales</div><ul className="mt-1 space-y-0.5">{(carriers.data?.scales ?? []).map((s) => <li key={s.agency}><a className="underline" href={s.url} target="_blank" rel="noreferrer">{s.agency}</a>: {s.top}</li>)}</ul>
              <div className="mt-2">Backtester index accounts ({carriers.data?.years.from}–{carriers.data?.years.to}) carry anonymised carrier keys; the crediting history is arithmetic on the index's past under each account's cap, floor and participation.</div></div>
          </div>
          <div className="mt-4 rounded-xl border border-emerald-300/30 bg-emerald-400/5 p-4 text-xs text-white/75">
            <div className="font-semibold text-white">{INSURED_NOTE.title}</div>
            <ul className="mt-1 list-disc space-y-1 pl-5">{INSURED_NOTE.lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
            <div className="mt-1 text-[11px] text-white/45">{INSURED_NOTE.caveat}</div>
          </div>
          {shown?.crediting && (
            <details className="mt-2 text-[11px] text-white/60"><summary className="cursor-pointer">Crediting history used in the loop: {shown.crediting.name}</summary>
              <div className="mt-1 flex flex-wrap gap-x-3">{shown.crediting.years.map((y) => <span key={y.year}>{y.year}: {y.creditedRate.toFixed(2)}%</span>)}</div>
            </details>
          )}
        </div>

        {/* 8. The trust and the attorney */}
        <div className={`${CARD} p-6`}>
          <p className={H}><Scale size={12} className="mr-1 inline" /> 8. The trust, and who draws it</p>
          <ul className="mt-2 space-y-2 text-xs text-white/70">{(trust.data?.notes ?? []).map((n, i) => <li key={i}>{n.text} <a className="text-white/40 underline" href={n.source.url} target="_blank" rel="noreferrer">{n.source.label}</a></li>)}</ul>
          <div className="mt-4 text-xs text-white/70">
            <div className="font-semibold text-white">Attorneys{stateList[0] ? ` in ${stateList[0]}` : ""}</div>
            {attorneys.data?.rows.length ? (
              <table className="mt-1 w-full text-[11px]"><thead><tr className="text-white/50"><th className="py-1 text-left">Name</th><th className="text-left">Firm</th><th className="text-left">City</th><th className="text-left">Credentials</th><th className="text-left">Contact</th></tr></thead>
                <tbody>{attorneys.data.rows.map((a) => <tr key={a.id} className="border-t border-white/5"><td className="py-1 font-semibold text-white">{a.name}</td><td>{a.firm ?? ""}</td><td>{a.city ?? ""}, {a.stateAbbr}</td><td>{a.credentials ?? ""}</td><td>{a.website && <a className="underline" href={a.website} target="_blank" rel="noreferrer">site</a>} {a.phone} {a.email}</td></tr>)}</tbody></table>
            ) : <div className="mt-1 text-white/50">No vetted attorney is on file for this state yet; the owner adds them. Until then, search the directory below by state, city and the Asset Protection practice area, and read each fellow's own page.</div>}
            <ul className="mt-2 space-y-1 text-[11px]">{(trust.data?.attorneySources ?? []).map((s) => <li key={s.url}><ExternalLink size={11} className="mr-1 inline" /><a className="underline" href={s.url} target="_blank" rel="noreferrer">{s.label}</a> <span className="text-white/40">(checked {s.verifiedAt})</span></li>)}</ul>
          </div>
        </div>

        {/* 9. Sources */}
        <div className={`${CARD} p-6`}>
          <p className={H}><BookOpen size={12} className="mr-1 inline" /> 9. Where the numbers come from</p>
          <ul className="mt-3 space-y-2 text-xs text-white/70">
            <li><Landmark size={11} className="mr-1 inline" /> Value, rent, appreciation, rent trend, worst fall, county: the Zip Engine's stored record (Zillow ZHVI and ZORI, FHFA back-cast), each with its as-of date on that page.</li>
            <li>Mortgage rate: {rates?.mortgage ? <>Freddie Mac's {rates.mortgage.year} average {rates.mortgage.ratePct.toFixed(2)}% via <a className="underline" href={rates.mortgage.source} target="_blank" rel="noreferrer">FRED</a></> : "no reading on this host; the typed rate is used"}. Federal funds: {rates?.fedFunds ? <a className="underline" href={rates.fedFunds.source} target="_blank" rel="noreferrer">FRED FEDFUNDS</a> : "not read"}. Cost growth: {rates?.cpi ? <>CPI-U {rates.cpi.annualRatePct.toFixed(2)}% as of {rates.cpi.asOf} via <a className="underline" href={rates.cpi.source} target="_blank" rel="noreferrer">FRED</a></> : "no CPI reading; 3% default"}.</li>
            <li>Hazards: <a className="underline" href={status.data?.nri.home} target="_blank" rel="noreferrer">{status.data?.nri.name}</a>, {status.data?.nri.version}; {status.data?.nri.note}</li>
            <li>Lender rules: <a className="underline" href={status.data?.lenderRules.source} target="_blank" rel="noreferrer">{status.data?.lenderRules.label}</a>.</li>
            <li>Not on this page because no public body publishes it by zip: HOA dues, the insurance premium and its history, the maximum insurable value, a thirty-year history of short-term-rental income, and how rent moves per point of the federal funds rate. Each is typed where it is asked for, with its source and date.</li>
          </ul>
          {status.data && capacity.data && <div className="mt-3 text-[11px] text-white/40"><RefreshCw size={11} className="mr-1 inline" />Owner: the FEMA county file is read with "Read the files now" on the Zip Engine page's schedule or by HAZARD_DATA_DAYS in the host env panel.</div>}
        </div>
      </div>
    </AppShell>
  );
}

const COST_LABEL: Record<keyof Costs, string> = { propertyTaxPct: "Property tax % of value", insurancePerYear: "Insurance / yr", hoaPerYear: "HOA / yr", maintenancePct: "Maintenance % of value", managementPct: "Management %", utilitiesPerYear: "Utilities / yr", platformFeePct: "Platform fee %", cleaningPerYear: "Cleaning / yr" };
const TAX_LABEL: Record<keyof Tax, string> = { buildingSharePct: "Building share of price %", costSegSharePct: "Cost-segregated share of building %", bonusPct: "Bonus depreciation %", marginalRatePct: "Your marginal rate %", depreciationYears: "Depreciation years" };

function V({ v }: { v: { verified: boolean; source: string; asOf: string; note?: string } }) {
  return v.verified ? <a className="text-white/40 underline" href={v.source} target="_blank" rel="noreferrer">page{v.asOf ? ` ${v.asOf}` : ""}</a> : <span className="text-amber-200/70">unverified{v.note ? `: ${v.note}` : ""}</span>;
}

type Row = { zip: string; city?: string; state?: string; county?: string; value: number; valueYear: number; rent: number | null; grossYield: number | null; appreciationWindow: number | null; windowYears: number; worstDrawdown: number | null; hazard?: { rating: string; hail: string | null; wildfire: string | null; riverineFlood: string | null; coastalFlood: string | null; hurricane: string | null; tornado: string | null; expectedAnnualLossBuilding: number | null } | null; score: number | null; reasons: string[] };
function PlanCard({ title, sub, rows, active, onPick }: { title: string; sub: string; rows: Row[]; active: boolean; onPick: () => void }) {
  return (
    <div className={`rounded-xl border p-4 ${active ? "border-emerald-300/60 bg-emerald-400/10" : "border-white/10 bg-black/20"}`}>
      <div className="flex items-center justify-between gap-2"><div className="font-semibold text-white">{title}</div><button className={active ? PRIMARY : BTN} onClick={onPick} disabled={!rows.length}>{active ? "Shown below" : "Show this plan"}</button></div>
      <div className="mt-1 text-[11px] text-white/50">{sub}</div>
      {rows.map((c) => (
        <div key={c.zip} className="mt-2 rounded-lg border border-white/10 bg-black/20 p-2 text-[11px] text-white/75">
          <div className="font-semibold text-white">{c.city ?? ""} {c.state ?? ""} {c.zip}{c.county ? ` · ${c.county}` : ""}</div>
          <div>Typical home {usd(c.value)} ({c.valueYear}) · rent {c.rent == null ? "—" : `${usd(c.rent)}/mo`} · yield {pct(c.grossYield)} · appreciation {pct(c.appreciationWindow)}/yr over {c.windowYears} yrs · worst fall {pct(c.worstDrawdown, 0)}</div>
          <div className="text-white/50">{c.reasons.join("; ")}</div>
          {c.hazard ? <div className="text-white/50">FEMA {c.hazard.rating}: hail {c.hazard.hail ?? "—"}, wildfire {c.hazard.wildfire ?? "—"}, river flood {c.hazard.riverineFlood ?? "—"}, coastal flood {c.hazard.coastalFlood ?? "—"}, hurricane {c.hazard.hurricane ?? "—"}, tornado {c.hazard.tornado ?? "—"}{c.hazard.expectedAnnualLossBuilding != null ? `; expected annual building loss in the county ${usd(c.hazard.expectedAnnualLossBuilding)}` : ""}</div> : <div className="text-white/40">No hazard record matched for this county on this host.</div>}
        </div>
      ))}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return <div className="rounded-xl border border-white/10 bg-black/20 p-3"><div className="text-[11px] text-white/50">{label}</div><div className="text-base font-semibold text-white">{value}</div>{sub && <div className="text-[10px] text-white/40">{sub}</div>}</div>;
}
void Fragment;

// ============================================================
// THE POLICY COST LAB — the first page on this platform driven by charges
// that came off a carrier document rather than out of a band.
//
// Mutual Company A's Annual Cost Summary gave every charge column year by
// year. From it: the percent-of-premium load, the per-policy charge, the
// per-$1,000 charge and how long it runs, the indexed strategy charge, the
// surrender schedule in dollars per $1,000, and a real mortality curve for
// attained ages 64 to 83.
//
// Everything shown here is that document's arithmetic or the statute. Where a
// figure is outside what the document covers, the page says so rather than
// letting the projection run quietly past its own evidence.
// ============================================================
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { ShieldCheck, Coins, Landmark, TrendingDown, AlertTriangle, CalendarRange } from "lucide-react";

const CARD = "rounded-2xl border border-cyan-400/20 bg-white/[0.04]";
const INPUT = "rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white w-full";
const H = "text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300/80";
const $ = (n: number | null | undefined) =>
  n == null || !Number.isFinite(n) ? "—" : `$${Math.round(n).toLocaleString()}`;

function Num({
  label, value, onChange, min, max, step = 1,
}: { label: string; value: number; onChange: (n: number) => void; min: number; max: number; step?: number }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] text-slate-400">{label}</span>
      <input
        type="number" className={INPUT} value={value} min={min} max={max} step={step}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
        }}
      />
    </label>
  );
}

export default function PolicyCostLab() {
  const [issueAge, setIssueAge] = useState(63);
  const [faceAmount, setFaceAmount] = useState(4_755_883);
  const [annualPremium, setAnnualPremium] = useState(480_000);
  const [premiumYears, setPremiumYears] = useState(5);
  const [years, setYears] = useState(20);
  const [creditedRatePct, setCreditedRatePct] = useState(6.75);

  const [draw, setDraw] = useState(150_000);
  const [chargedRatePct, setChargedRatePct] = useState(5);
  const [collateralRatePct, setCollateralRatePct] = useState(3);
  const [isMec, setIsMec] = useState(false);
  const [inAdvance, setInAdvance] = useState(false);

  const carriers = trpc.policyLab.carriers.useQuery();
  const projection = trpc.policyLab.project.useQuery({
    issueAge, faceAmount, annualPremium, premiumYears, years, creditedRatePct,
  });
  const loans = trpc.policyLab.loans.useQuery({
    startingCashValue: 2_600_000, annualDraw: draw, years: 25, attainedAge: 73,
    creditedRatePct, chargedRatePct, collateralCreditRatePct: collateralRatePct,
    cumulativePremiumsPaid: 2_100_000, isMec, ordinaryIncomeRatePct: 37,
    chargedInAdvance: inAdvance,
  });
  const gaps = trpc.policyLab.gaps.useQuery({ design: "maxFunded" });

  // The index-segment window. Six years back by default, because that is the
  // stretch people ask about; the slider walks it one year at a time.
  const [segAccount, setSegAccount] = useState("bia-2yr");
  const [fromYear, setFromYear] = useState(2019);
  const [toYear, setToYear] = useState(2025);
  const [thresholdPct, setThresholdPct] = useState(40);
  const segments = trpc.policyLab.segments.useQuery({
    accountId: segAccount, fromYear, toYear, thresholdPct,
  });
  const segWindow = segments.data?.windows.find((w) => w.accountId === segAccount);
  const segTerms = segments.data?.accounts.find((a) => a.id === segAccount);

  const a = carriers.data?.complete[0];
  const p = projection.data;

  return (
    <AppShell title="Policy Cost Lab" subtitle="Charges read off a carrier's own cost summary — not a band">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* What this is built on */}
        <div className={`${CARD} p-5`}>
          <div className="flex items-start gap-3">
            <ShieldCheck size={20} className="mt-0.5 shrink-0 text-cyan-300" />
            <div>
              <h2 className={H}>What drives every number here</h2>
              {a ? (
                <>
                  <p className="mt-2 text-sm text-slate-300">
                    <strong className="text-white">{a.label}</strong> — {a.product}. {a.source}.
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">
                    Read from its Annual Cost Summary: every charge column, year by year. The
                    mortality curve below is the printed cost-of-insurance charge divided by the net
                    amount at risk on the same row — no fitting, no reference curve. Interest is
                    credited to the <strong className="text-slate-200">{a.creditingTarget.replace("-", " ")}</strong>.
                  </p>
                  <p className="mt-2 text-[11px] text-slate-500">
                    Derived from one case: {a.derivedFrom.sex}, issue age {a.derivedFrom.issueAge},{" "}
                    {a.derivedFrom.riskClass}, {$(a.derivedFrom.specifiedAmount)} specified amount,{" "}
                    {$(a.derivedFrom.totalPremiumOutlay)} total outlay, {a.derivedFrom.definitionalTest}.
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-slate-400">Loading carrier basis…</p>
              )}
            </div>
          </div>
        </div>

        {/* The charge structure */}
        {a && (
          <div className={`${CARD} p-5`}>
            <h2 className={H}><Coins size={13} className="mr-1 inline" /> The charge structure</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Percent of premium" value={`${a.percentOfPremiumByYear[0]}% yr 1, ${a.percentOfPremiumByYear[1]}% yrs 2–5`} />
              <Stat label="Per policy" value={`$${a.perPolicyMonthly}/month`} />
              <Stat label="Per $1,000 of face" value={`$${a.perThousandAnnual}/yr for ${a.perThousandYears} yrs, then nil`} />
              <Stat label="Indexed strategy" value={`${a.indexedStrategyPctOfAv}% of AV from yr ${a.indexedStrategyFromYear}`} />
            </div>
            <p className="mt-3 text-xs text-slate-400">
              The surrender charge is <strong className="text-slate-200">dollars per $1,000 of specified
              amount</strong>, not a percentage of account value — ${a.surrenderPerThousandByYear[0]} flat for
              three years, then in equal steps to zero at year {a.surrenderPerThousandByYear.length}. Read as a
              percentage of account value the same schedule runs 38.97% down to 0.85%, which is a property of how
              fast this policy accumulated rather than of the product.
            </p>
          </div>
        )}

        {/* The mortality curve */}
        {a && (
          <div className={`${CARD} p-5`}>
            <h2 className={H}><TrendingDown size={13} className="mr-1 inline" /> Cost of insurance, per $1,000 of net amount at risk</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] text-xs">
                <thead className="text-slate-400">
                  <tr><th className="p-1.5 text-left">Attained age</th>
                    {a.coi.rows.filter((_, i) => i % 2 === 0).map((c) => (
                      <th key={c.age} className="p-1.5 text-right">{c.age}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-white/10">
                    <td className="p-1.5 text-slate-300">Rate per $1,000</td>
                    {a.coi.rows.filter((_, i) => i % 2 === 0).map((c) => (
                      <td key={c.age} className="p-1.5 text-right text-white">${c.perThousand.toFixed(2)}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              ${a.coi.rows[0]!.perThousand.toFixed(3)} at age {a.coi.fromAge} rising to $
              {a.coi.rows[a.coi.rows.length - 1]!.perThousand.toFixed(2)} at {a.coi.toAge} — more than fiftyfold.
            </p>
            <ul className="mt-2 space-y-1 text-[11px] leading-relaxed text-amber-300/90">
              {a.caveats.map((c, i) => <li key={i}>· {c}</li>)}
            </ul>
          </div>
        )}

        {/* Projection */}
        <div className={`${CARD} p-5`}>
          <h2 className={H}><Landmark size={13} className="mr-1 inline" /> Project a policy on these charges</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Num label="Issue age" value={issueAge} onChange={setIssueAge} min={18} max={85} />
            <Num label="Specified amount ($)" value={faceAmount} onChange={setFaceAmount} min={50_000} max={50_000_000} step={50_000} />
            <Num label="Annual premium ($)" value={annualPremium} onChange={setAnnualPremium} min={0} max={5_000_000} step={10_000} />
            <Num label="Premium years" value={premiumYears} onChange={setPremiumYears} min={1} max={40} />
            <Num label="Projection years" value={years} onChange={setYears} min={5} max={60} />
            <Num label="Credited rate (%)" value={creditedRatePct} onChange={setCreditedRatePct} min={0} max={12} step={0.05} />
          </div>

          {p && (
            <>
              {p.basis.extrapolatedBeyondCoiTable && (
                <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/[0.05] p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-400" />
                    <p className="text-xs leading-relaxed text-amber-200">{p.basis.extrapolationNote}</p>
                  </div>
                </div>
              )}

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Stat label="Total premiums" value={$(p.summary.totalPremiums)} />
                <Stat label="Total charges" value={$(p.summary.totalCharges)} />
                <Stat label="Account value" value={$(p.summary.finalAccountValue)} />
                <Stat label="Surrender value" value={$(p.summary.finalSurrenderValue)} />
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Charges are{" "}
                <strong className="text-white">
                  {p.summary.totalPremiums > 0
                    ? ((p.summary.totalCharges / p.summary.totalPremiums) * 100).toFixed(1)
                    : "—"}%
                </strong>{" "}
                of everything paid in.
                {p.summary.lapseYear !== null && (
                  <span className="text-amber-300"> The policy lapses in year {p.summary.lapseYear}.</span>
                )}
              </p>

              {p.notes.length > 0 && (
                <ul className="mt-3 space-y-1 text-[11px] leading-relaxed text-slate-400">
                  {p.notes.map((n, i) => <li key={i}>· {n}</li>)}
                </ul>
              )}

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[720px] text-xs">
                  <thead className="text-slate-400">
                    <tr>
                      {["Yr", "Age", "Premium", "Load", "Fee", "Per-unit", "At risk", "COI", "Credit", "Account", "Surrender"].map((h) => (
                        <th key={h} className="p-1.5 text-right first:text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {p.years.filter((_, i) => i % 2 === 0 || i === p.years.length - 1).map((y) => (
                      <tr key={y.policyYear} className="border-t border-white/5">
                        <td className="p-1.5 text-slate-400">{y.policyYear}</td>
                        <td className="p-1.5 text-right text-slate-400">{y.attainedAge}</td>
                        <td className="p-1.5 text-right text-slate-300">{$(y.premium)}</td>
                        <td className="p-1.5 text-right text-slate-400">{$(y.premiumLoad)}</td>
                        <td className="p-1.5 text-right text-slate-400">{$(y.policyFee)}</td>
                        <td className="p-1.5 text-right text-slate-400">{$(y.perUnitCharge)}</td>
                        <td className="p-1.5 text-right text-slate-500">{$(y.netAmountAtRisk)}</td>
                        <td className="p-1.5 text-right text-amber-300/90">{$(y.costOfInsurance)}</td>
                        <td className="p-1.5 text-right text-emerald-300/90">{$(y.interestCredited)}</td>
                        <td className="p-1.5 text-right font-medium text-white">{$(y.accountValue)}</td>
                        <td className="p-1.5 text-right text-slate-300">{$(y.surrenderValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Loans */}
        <div className={`${CARD} p-5`}>
          <h2 className={H}>What a loan actually does</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Num label="Annual draw ($)" value={draw} onChange={setDraw} min={0} max={2_000_000} step={10_000} />
            <Num label="Charged rate (%)" value={chargedRatePct} onChange={setChargedRatePct} min={0} max={10} step={0.05} />
            <Num label="Collateral credit, fixed loan (%)" value={collateralRatePct} onChange={setCollateralRatePct} min={0} max={10} step={0.05} />
            <div className="flex flex-col justify-end gap-2 pb-1">
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input type="checkbox" checked={isMec} onChange={(e) => setIsMec(e.target.checked)} />
                Modified endowment contract
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input type="checkbox" checked={inAdvance} onChange={(e) => setInAdvance(e.target.checked)} />
                Interest charged in advance
              </label>
            </div>
          </div>

          {loans.data && (
            <>
              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                {([["Wash", loans.data.wash], ["Fixed", loans.data.fixed], ["Participating", loans.data.participating]] as const).map(
                  ([name, r]) => (
                    <div key={name} className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className="text-sm font-semibold text-white">{name}</div>
                      <dl className="mt-2 space-y-1 text-xs">
                        <Row k="Borrowed" v={$(r.summary.totalBorrowed)} />
                        <Row k="Reached the client" v={$(r.summary.totalCashReceived)} />
                        <Row k="Net cost" v={$(r.summary.totalNetCost)} />
                        <Row k="Flat years charged" v={String(r.summary.yearsCollateralCreditedNothing)} />
                        <Row k="Lapse year" v={r.summary.lapseYear === null ? "none" : String(r.summary.lapseYear)} />
                      </dl>
                      {r.lapseConsequence.cashShortfall > 0 && (
                        <p className="mt-2 text-[11px] leading-snug text-amber-300">
                          On lapse: {$(r.lapseConsequence.phantomIncomeOnLapse)} of ordinary income,{" "}
                          {$(r.lapseConsequence.taxOwed)} of tax, {$(r.lapseConsequence.cashToClient)} reaching the
                          client — a {$(r.lapseConsequence.cashShortfall)} cheque from elsewhere.
                        </p>
                      )}
                    </div>
                  )
                )}
              </div>
              <p className="mt-3 text-xs text-slate-400">
                {loans.data.crossoverYears === null
                  ? "The charged rate does not exceed the credited rate, so the balance never overtakes the cash value."
                  : `At these rates the balance closes on the cash value in about ${Math.ceil(loans.data.crossoverYears)} years. Nothing reverses it; only paying the loan down does.`}
              </p>
              <ul className="mt-2 space-y-1 text-[11px] leading-relaxed text-slate-400">
                {loans.data.participating.notes.map((n, i) => <li key={i}>· {n}</li>)}
              </ul>
            </>
          )}
        </div>

        {/* What is still missing */}
        {gaps.data && (
          <div className={`${CARD} border-amber-500/25 p-5`}>
            <h2 className={H}>What still cannot be priced</h2>
            <p className="mt-2 text-xs text-slate-400">
              Ranked by how much closing it moves a thirty-year value on a max-funded design.
            </p>
            <div className="mt-3 space-y-2">
              {gaps.data.ranked.filter((g) => g.status !== "closed").slice(0, 5).map((g) => (
                <div key={g.id} className="rounded-lg border border-white/10 bg-black/20 p-2.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-xs font-medium text-slate-200">{g.label}</span>
                    <span className="shrink-0 text-xs text-amber-300">{g.swingPct.toFixed(1)}%</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-snug text-slate-500">{g.closedBy}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Carriers still pending */}
        {carriers.data && (
          <div className={`${CARD} p-5`}>
            <h2 className={H}>The other two companies</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {carriers.data.pending.map((c) => (
                <div key={c.carrierId} className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="text-sm font-semibold text-white">{c.label}</div>
                  <p className="mt-1 text-xs text-slate-400">
                    {c.chargeNamesKnown.length > 0
                      ? `${c.chargeNamesKnown.length} charges named, none quoted.`
                      : "No charge structure held."}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Interest credited to: {c.creditingTarget ? c.creditingTarget.replace("-", " ") : "not established"}
                    {c.creditingTargetSource ? ` — ${c.creditingTargetSource}` : ""}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-slate-500">
              One Annual Cost Summary each closes them, the same way it closed Mutual Company A.
            </p>
          </div>
        )}

        {/* ── INDEX SEGMENTS ───────────────────────────────────────────── */}
        <div className={`${CARD} p-5`}>
          <div className="mb-1 flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-cyan-300" />
            <h2 className={H}>Index segments — what a year credits, and what a segment credits</h2>
          </div>
          <p className="mb-4 max-w-3xl text-xs text-slate-400">
            A two-year segment credits once, across two years. Put that credit next to a single year
            and it reads as an annual return and overstates the account by roughly double. Both
            figures are shown below, always together.
          </p>

          <div className="grid gap-3 sm:grid-cols-4">
            <label className="block">
              <span className="mb-1 block text-[11px] text-slate-400">Account</span>
              <select
                className={INPUT}
                value={segAccount}
                onChange={(e) => setSegAccount(e.target.value)}
              >
                {segments.data?.accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}{a.sourced ? "" : " (unsourced)"}
                  </option>
                ))}
              </select>
            </label>
            <Num
              label={`From year (${segments.data?.seriesRange.from ?? 1994} earliest)`}
              value={fromYear} onChange={setFromYear}
              min={segments.data?.seriesRange.from ?? 1994}
              max={segments.data?.seriesRange.to ?? 2025}
            />
            <Num
              label={`To year (${segments.data?.seriesRange.to ?? 2025} latest)`}
              value={toYear} onChange={setToYear}
              min={segments.data?.seriesRange.from ?? 1994}
              max={segments.data?.seriesRange.to ?? 2025}
            />
            <Num
              label="Count segments at or above (%)"
              value={thresholdPct} onChange={setThresholdPct} min={0} max={200}
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {[3, 6, 10, 20, 30].map((n) => {
              const last = segments.data?.seriesRange.to ?? 2025;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => { setFromYear(last - n); setToYear(last); }}
                  className="rounded-lg border border-white/10 bg-black/30 px-3 py-1 text-[11px] text-slate-300 hover:border-cyan-400/40"
                >
                  Last {n} years
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setFromYear(segments.data?.seriesRange.from ?? 1994);
                setToYear(segments.data?.seriesRange.to ?? 2025);
              }}
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-1 text-[11px] text-slate-300 hover:border-cyan-400/40"
            >
              Whole series
            </button>
          </div>

          {segTerms && (
            <p className="mt-3 text-[11px] text-slate-500">
              {segTerms.termYears}-year term · {segTerms.participationPct}% participation ·{" "}
              {segTerms.spreadPct}% spread · {segTerms.capPct == null ? "uncapped" : `${segTerms.capPct}% cap`} ·{" "}
              {segTerms.floorPct}% floor · {segTerms.carrierLabel}
              <br />
              {segTerms.sourced ? "Source: " : ""}{segTerms.source}
            </p>
          )}

          {segments.data?.seriesProvenance?.warning && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-400/40 bg-rose-500/10 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
              <div className="text-xs text-rose-100/90">
                <p className="font-semibold">The index series behind these figures is not established.</p>
                <p className="mt-1">{segments.data.seriesProvenance.warning}</p>
                <ul className="mt-2 space-y-0.5 text-[11px] text-rose-200/80">
                  {segments.data.seriesProvenance.checks
                    .filter((c) => !c.reconciles)
                    .map((c) => (
                      <li key={c.id}>
                        {c.claim} — this series measures {c.measured} {c.unit}.
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          )}

          {segTerms && !segTerms.sourced && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
              <p className="text-xs text-amber-200/90">
                These terms came from nobody. They are a parameter set for comparison, not a quote,
                and must not be shown to a client as a product.
              </p>
            </div>
          )}

          {segWindow && (
            <>
              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <Stat
                  label={`Segments ≥ ${segWindow.thresholdPct}% (of ${segWindow.segments.length})`}
                  value={`${segWindow.segmentsAtOrAboveThreshold}`}
                />
                <Stat label="Mean, annualized" value={`${segWindow.meanAnnualizedPct.toFixed(2)}%`} />
                <Stat label="Best, annualized" value={`${segWindow.bestAnnualizedPct.toFixed(2)}%`} />
                <Stat label="Worst, annualized" value={`${segWindow.worstAnnualizedPct.toFixed(2)}%`} />
              </div>

              <p className="mt-3 text-[11px] text-cyan-200/80">{segWindow.readingNote}</p>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-xs">
                  <thead className="text-[10px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="py-2 pr-3">Segment</th>
                      <th className="py-2 pr-3">Index over the segment</th>
                      <th className="py-2 pr-3">Credited over the segment (not a carrier basis)</th>
                      <th className="py-2 pr-3">Per year — the carrier's published basis</th>
                      <th className="py-2">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {segWindow.segments.map((sg) => (
                      <tr key={`${sg.startYear}-${sg.endYear}`} className="border-t border-white/5">
                        <td className="py-2 pr-3 text-slate-300">
                          {sg.startYear === sg.endYear ? sg.startYear : `${sg.startYear}–${sg.endYear}`}
                        </td>
                        <td className="py-2 pr-3 text-slate-400">{sg.indexCumulativePct.toFixed(2)}%</td>
                        <td className="py-2 pr-3 font-semibold text-white">
                          {sg.creditedPct.toFixed(2)}%
                          {sg.termYears > 1 && (
                            <span className="ml-1 text-[10px] font-normal text-slate-500">
                              over {sg.termYears} yrs
                            </span>
                          )}
                        </td>
                        <td className="py-2 pr-3 font-semibold text-cyan-200">
                          {sg.annualizedPct.toFixed(2)}%<span className="text-[10px] font-normal text-slate-500"> / yr</span>
                        </td>
                        <td className="py-2 text-[11px] text-slate-500">
                          {sg.floorSaved ? "floor held it at 0% " : ""}
                          {sg.capBit ? "cap truncated" : ""}
                        </td>
                      </tr>
                    ))}
                    {segWindow.segments.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-3 text-slate-500">
                          The window is shorter than one segment term.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <p className="mt-3 text-[11px] text-slate-500">
                Underlying index years in this window:{" "}
                {segments.data?.indexByYear
                  .map((r) => `${r.year} ${r.returnPct == null ? "—" : `${r.returnPct.toFixed(2)}%`}`)
                  .join(" · ")}
              </p>
            </>
          )}
        </div>

        <p className="pb-4 text-center text-[11px] text-slate-600">
          Not an illustration. Nothing here may be shown to a client in place of a carrier illustration
          produced under AG 49-A.
        </p>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-slate-500">{k}</dt>
      <dd className="text-slate-200">{v}</dd>
    </div>
  );
}

// ============================================================
// SHORT-TERM RENTALS — the property as a system: the zip's published record
// (value, appreciation, rent growth, the year's mortgage rate) from the Zip
// Engine, the market's nightly rate and occupancy from the client's own
// figures or Rabbu's calculator, and the year-by-year arithmetic of what the
// owner keeps. The tax mechanics (cost segregation, bonus depreciation, the
// material-participation rule) live on the STR Tax Strategy page and are
// linked, not repeated.
// ============================================================
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { Home, ExternalLink, Landmark, BookOpen, Calculator } from "lucide-react";
import { RABBU, STR_DEFAULTS, STR_INPUT_SOURCES, runStr, type StrInputs } from "@shared/strEngine";
import { lastYear, valueAt } from "@shared/zipEngine";

const CARD = "rounded-2xl border border-emerald-400/20 bg-white/[0.04]";
const INPUT = "rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white w-full";
const BTN = "rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10";
const PRIMARY = "rounded-lg bg-emerald-400 px-3 py-1.5 text-xs font-semibold text-black hover:bg-emerald-300";
const pct = (n: number | null | undefined, d = 1) => (n == null || !Number.isFinite(n) ? "—" : `${(n * 100).toFixed(d)}%`);
const usd = (n: number | null | undefined) => (n == null || !Number.isFinite(n) ? "—" : n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }));

type NumKey = { [K in keyof StrInputs]: StrInputs[K] extends number ? K : never }[keyof StrInputs];
const FIELDS: Array<{ key: NumKey; label: string; step?: number; group: "buy" | "market" | "costs" | "growth" | "tax" }> = [
  { key: "purchasePrice", label: "Purchase price", step: 1000, group: "buy" }, { key: "downPct", label: "Down payment %", group: "buy" }, { key: "ratePct", label: "Mortgage rate %", step: 0.05, group: "buy" }, { key: "closingPct", label: "Closing costs %", step: 0.25, group: "buy" }, { key: "furnishing", label: "Furnishing & setup", step: 500, group: "buy" },
  { key: "nightlyRate", label: "Nightly rate (ADR)", group: "market" }, { key: "occupancyPct", label: "Occupancy %", group: "market" }, { key: "avgStayNights", label: "Average stay (nights)", group: "market" },
  { key: "cleaningPerTurnover", label: "Cleaning per turnover", group: "costs" }, { key: "platformFeePct", label: "Platform fee %", step: 0.5, group: "costs" }, { key: "managementPct", label: "Management %", group: "costs" }, { key: "utilitiesPerYear", label: "Utilities / yr", step: 100, group: "costs" }, { key: "insurancePerYear", label: "Insurance / yr", step: 100, group: "costs" }, { key: "propertyTaxPct", label: "Property tax % of value", step: 0.05, group: "costs" }, { key: "maintenancePct", label: "Maintenance % of value", step: 0.1, group: "costs" },
  { key: "appreciationPct", label: "Appreciation %/yr", step: 0.05, group: "growth" }, { key: "rentGrowthPct", label: "Rate growth %/yr", step: 0.25, group: "growth" }, { key: "expenseGrowthPct", label: "Cost growth %/yr", step: 0.25, group: "growth" }, { key: "years", label: "Years", group: "growth" },
  { key: "buildingSharePct", label: "Building share of price %", group: "tax" }, { key: "depreciationYears", label: "Depreciation years", step: 0.5, group: "tax" }, { key: "marginalTaxPct", label: "Your marginal rate %", group: "tax" },
];
const GROUPS: Array<[typeof FIELDS[number]["group"], string]> = [["buy", "The purchase"], ["market", "The market (your figures or Rabbu's)"], ["costs", "Running it"], ["growth", "Growth"], ["tax", "Tax line"]];

export default function ShortTermRentals() {
  const mine = trpc.zip.mine.useQuery(undefined, { refetchOnWindowFocus: false, retry: false });
  const [zip, setZip] = useState("");
  const [x, setX] = useState<StrInputs>(STR_DEFAULTS);
  const [marketSource, setMarketSource] = useState<string>("own");
  const [asOf, setAsOf] = useState<string>(new Date().toISOString().slice(0, 10));
  const [prefilled, setPrefilled] = useState<string[]>([]);
  useEffect(() => { if (!zip && mine.data?.zips.length) setZip(mine.data.zips[mine.data.zips.length - 1]!.zip); }, [mine.data, zip]);
  const rec = trpc.zip.report.useQuery({ zips: [zip], startYear: 2000, threshold: 100_000, yearsAhead: 1 }, { enabled: /^\d{5}$/.test(zip), refetchOnWindowFocus: false });
  const set = (k: NumKey, v: number) => setX((s) => ({ ...s, [k]: v }));

  const zipAnswer = rec.data?.answers[0];
  const prefill = () => {
    if (!zipAnswer) return;
    const r = zipAnswer.report;
    const notes: string[] = [];
    const patch: Partial<StrInputs> = {};
    const ly = r.levels ? lastYear(r.levels) : null;
    const v = r.levels && ly != null ? valueAt(r.levels, ly) : null;
    if (v != null) { patch.purchasePrice = Math.round(v); notes.push(`price = Zillow typical value ${ly}`); }
    if (r.lookback[10] != null) { patch.appreciationPct = Math.round(r.lookback[10]! * 10000) / 100; notes.push(`appreciation = this zip's 10-year rate`); }
    if (r.rentWindowRate != null) { patch.rentGrowthPct = Math.round(r.rentWindowRate * 10000) / 100; notes.push(`rate growth = this zip's rent trend (Zillow ZORI)`); }
    const lastSheet = zipAnswer.sheet[zipAnswer.sheet.length - 1];
    if (lastSheet) { patch.ratePct = Math.round(lastSheet.ratePct * 100) / 100; notes.push(`mortgage rate = Freddie Mac average ${lastSheet.year}`); }
    setX((s) => ({ ...s, ...patch }));
    setPrefilled(notes);
  };
  const result = useMemo(() => runStr(x), [x]);
  const rabbuUrl = `${RABBU.calculator}`;

  return (
    <AppShell title="Short-Term Rentals">
      <div className="mx-auto max-w-6xl space-y-6 pb-16">
        <div className={`${CARD} p-6`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/80"><Home size={12} className="mr-1 inline" /> Rental properties</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">A short-term rental, year by year: what it earns, what it costs, what you keep</h1>
          <p className="mt-2 text-sm text-white/70">The zip's own record supplies the price, the appreciation, the rent trend and the mortgage rate. The market supplies the nightly rate and occupancy, from your figures or from Rabbu's calculator for the address. The table is arithmetic on those inputs; the tax rules that turn a paper loss into sheltered income are on the <Link href="/portal/str-strategy" className="text-emerald-300 underline">STR Tax Strategy</Link> page.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <label className="block text-xs text-white/70">Property zip
              <input className={`${INPUT} mt-1`} value={zip} onChange={(e) => setZip(e.target.value.trim())} placeholder="28401" />
              {mine.data?.zips.length ? <span className="text-[11px] text-white/50">From your Fact Finder: {mine.data.zips.map((z) => `${z.label} ${z.zip}`).join(" · ")}</span> : null}
            </label>
            <div className="text-xs text-white/70">
              <div>The zip's record</div>
              {zipAnswer?.report.levels ? (
                <div className="mt-1 rounded-lg border border-white/10 bg-black/20 p-2 text-[11px] text-white/70">
                  Typical value {usd(valueAt(zipAnswer.report.levels, lastYear(zipAnswer.report.levels)!))} · 10-yr {pct(zipAnswer.report.lookback[10])} · rent trend {pct(zipAnswer.report.rentWindowRate)} · worst fall {pct(zipAnswer.report.worstDrawdown?.drawdown)}
                  <div className="mt-1 flex gap-2"><button className={PRIMARY} onClick={prefill}>Use this zip's record</button><Link href="/portal/zip-engine" className={BTN}>Open in the Zip Engine</Link></div>
                </div>
              ) : rec.isFetching ? <div className="text-white/50">reading…</div> : <div className="mt-1 text-[11px] text-white/50">{/^\d{5}$/.test(zip) ? "No public record for this zip, or the files have not been read on this host yet." : "Enter a five-digit zip."}</div>}
            </div>
            <div className="text-xs text-white/70">
              <div>The market's figures</div>
              <select className={`${INPUT} mt-1`} value={marketSource} onChange={(e) => setMarketSource(e.target.value)}>{STR_INPUT_SOURCES.map((s) => <option key={s.id} value={s.id}>{s.label.split(":")[0]}</option>)}</select>
              <div className="mt-1 flex flex-wrap gap-2">
                <a className={BTN} href={rabbuUrl} target="_blank" rel="noreferrer"><ExternalLink size={11} className="mr-1 inline" />Rabbu calculator for the address</a>
                <a className={BTN} href={RABBU.markets} target="_blank" rel="noreferrer"><ExternalLink size={11} className="mr-1 inline" />Rabbu market data</a>
              </div>
              <label className="mt-1 block text-[11px] text-white/50">Figures as of <input type="date" className="ml-1 rounded border border-white/10 bg-black/30 px-1 text-white" value={asOf} onChange={(e) => setAsOf(e.target.value)} /></label>
            </div>
          </div>
          {prefilled.length > 0 && <p className="mt-3 text-[11px] text-emerald-200/80">Filled from the record: {prefilled.join(" · ")}.</p>}
        </div>

        <div className={`${CARD} p-6`}>
          <div className="grid gap-5 md:grid-cols-5">
            {GROUPS.map(([g, title]) => (
              <div key={g}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/50">{title}</p>
                {FIELDS.filter((f) => f.group === g).map((f) => (
                  <label key={f.key} className="mt-2 block text-[11px] text-white/70">{f.label}<input type="number" step={f.step ?? 1} className={`${INPUT} mt-0.5`} value={x[f.key]} onChange={(e) => set(f.key, Number(e.target.value))} /></label>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className={`${CARD} p-6`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/80"><Calculator size={12} className="mr-1 inline" /> The result</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6 text-sm">
            <Stat label="Cash invested" value={usd(result.cashInvested)} sub="down + closing + furnishing" />
            <Stat label="Loan" value={usd(result.loan)} sub={`${usd(result.monthlyPayment)}/mo`} />
            <Stat label="Cap rate, year 1" value={pct(result.capRateYear1)} sub="NOI ÷ price" />
            <Stat label="Cash-on-cash, year 1" value={pct(result.cashOnCashYear1)} sub="cash flow ÷ cash in" />
            <Stat label={`Equity multiple, ${x.years} yrs`} value={`${result.equityMultiple.toFixed(2)}×`} sub="(equity + cash) ÷ cash in" />
            <Stat label="Annualised on cash" value={pct(result.annualisedReturn)} sub="arithmetic on the inputs" />
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-white/50"><th className="py-1 text-left">Year</th><th className="text-right">Gross</th><th className="text-right">Operating</th><th className="text-right">NOI</th><th className="text-right">Interest</th><th className="text-right">Principal</th><th className="text-right">Cash flow</th><th className="text-right">Depreciation</th><th className="text-right">Taxable</th><th className="text-right">Tax effect</th><th className="text-right">After tax</th><th className="text-right">Value</th><th className="text-right">Equity</th></tr></thead>
              <tbody>
                {result.years.map((y) => (
                  <tr key={y.year} className="border-t border-white/5 text-white/80">
                    <td className="py-1">{y.year}</td><td className="text-right">{usd(y.grossRevenue)}</td><td className="text-right">{usd(y.operating)}</td><td className="text-right">{usd(y.noi)}</td><td className="text-right">{usd(y.interest)}</td><td className="text-right">{usd(y.principal)}</td><td className={`text-right font-semibold ${y.cashFlow < 0 ? "text-amber-300" : "text-white"}`}>{usd(y.cashFlow)}</td><td className="text-right">{usd(y.depreciation)}</td><td className="text-right">{usd(y.taxableIncome)}</td><td className={`text-right ${y.taxEffect < 0 ? "text-emerald-300" : ""}`}>{usd(-y.taxEffect)}</td><td className="text-right font-semibold text-white">{usd(y.afterTaxCashFlow)}</td><td className="text-right">{usd(y.value)}</td><td className="text-right">{usd(y.equity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-white/50">Tax effect is taxable income × your marginal rate, shown as the dollars kept (green) or paid. A negative taxable line shelters other income only when the material-participation rule is met; the <Link href="/portal/str-strategy" className="text-emerald-300 underline">STR Tax Strategy</Link> page walks the rule, cost segregation and bonus depreciation with the statute for each. Straight-line depreciation is used here; the tax page shows the accelerated version.</p>
        </div>

        <div className={`${CARD} p-6`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/80"><BookOpen size={12} className="mr-1 inline" /> Where the numbers come from</p>
          <ul className="mt-3 space-y-2 text-xs text-white/70">
            <li><Landmark size={11} className="mr-1 inline" /> Value, appreciation, rent trend and mortgage rate: the Zip Engine's published record for the zip (FHFA, Zillow, Freddie Mac), each with its as-of date on that page.</li>
            <li><ExternalLink size={11} className="mr-1 inline" /> Nightly rate and occupancy: {STR_INPUT_SOURCES.find((s) => s.id === marketSource)?.label}. Entered {asOf}. {RABBU.note}</li>
            <li>Cleaning, utilities, insurance, tax and maintenance rates: your figures. Defaults are placeholders to be replaced, not market data.</li>
            <li>Not on this page because no authority publishes it by zip: a thirty-year history of short-term-rental income. Airbnb began in 2008 and its listing data is private; the longest public rent series by zip is Zillow's, from 2015, and it is long-term rent.</li>
          </ul>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return <div className="rounded-xl border border-white/10 bg-black/20 p-3"><div className="text-[11px] text-white/50">{label}</div><div className="text-base font-semibold text-white">{value}</div>{sub && <div className="text-[10px] text-white/40">{sub}</div>}</div>;
}

// The hand-off dock that rides on every portal calculator page: add this
// calculator to the chain, choose the year and the share of its cash value
// that flows into the next one, and auto-fill the page from the shared
// profile. The builder lives at /portal/chain.
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { CHAIN_CALCULATOR_BY_ID, chainCalculatorForPath } from "@shared/chainEngine";
import { useClientData } from "@/contexts/ClientDataContext";
import { autofillFromProfile, type AutofillResult } from "@/lib/autofill";
import { addStep, CHAIN_EVENT, loadChain } from "@/lib/chainStore";

const CASH_LABEL: Record<string, string> = { iulCashValue: "IUL cash value", taxableAssets: "taxable assets", qualifiedAssets: "qualified assets", cashReserves: "cash", homeEquity: "home equity", realEstateValue: "property portfolio value", cryptoValue: "crypto value" };

export default function ChainDock() {
  const [location] = useLocation();
  const { data } = useClientData();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(() => loadChain().steps.length);
  const [years, setYears] = useState(10);
  const [handoff, setHandoff] = useState(true);
  const [atYear, setAtYear] = useState<string>("");
  const [pct, setPct] = useState(50);
  const [added, setAdded] = useState(false);
  const [fill, setFill] = useState<AutofillResult | null>(null);

  useEffect(() => {
    const sync = () => setCount(loadChain().steps.length);
    window.addEventListener(CHAIN_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(CHAIN_EVENT, sync); window.removeEventListener("storage", sync); };
  }, []);

  const calcId = useMemo(() => chainCalculatorForPath(location), [location]);
  const spec = CHAIN_CALCULATOR_BY_ID[calcId];
  if (!location.startsWith("/portal") || location.startsWith("/portal/chain")) return null;

  const add = () => {
    addStep(calcId, Math.max(1, Math.min(60, years)), { enabled: handoff, atYear: atYear.trim() ? Math.max(1, Number(atYear)) : null, pctOfCashValue: Math.max(0, Math.min(100, pct)) });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  return (
    <div data-chain-dock className="fixed bottom-4 right-4 z-40 w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl border border-emerald-300/30 bg-[#04120e]/95 text-white shadow-2xl backdrop-blur" aria-label="Calculator chain">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left" aria-expanded={open}>
        <span className="text-xs font-extrabold uppercase tracking-[.18em] text-emerald-300">Calculator chain</span>
        <span className="text-xs text-white/70">{count} in the row · {open ? "hide" : "open"}</span>
      </button>
      {open && (
        <div className="space-y-3 px-4 pb-4 text-sm">
          <p className="text-white/70">This page runs as <span className="font-semibold text-white">{spec.name}</span> in the chain. Its hand-off takes a share of <span className="text-white">{CASH_LABEL[spec.cashValue]}</span>.</p>
          <label className="flex items-center gap-2 text-white/85"><input type="checkbox" checked={handoff} onChange={(e) => setHandoff(e.target.checked)} className="h-4 w-4 accent-emerald-400" aria-label="Save the final outcome and hand it off to the next calculator" /> Save the final outcome and hand it off</label>
          <div className="grid grid-cols-3 gap-2">
            <label className="text-[11px] text-white/60">Run for (years)<input type="number" min={1} max={60} value={years} onChange={(e) => setYears(Number(e.target.value))} aria-label="Years this calculator runs" className="mt-1 w-full rounded-lg border border-emerald-200/20 bg-black/40 px-2 py-1.5 text-sm text-white" /></label>
            <label className="text-[11px] text-white/60">Hand off in year<input type="number" min={1} max={60} value={atYear} placeholder="last" onChange={(e) => setAtYear(e.target.value)} disabled={!handoff} aria-label="Hand-off year within this calculator (blank = last year)" className="mt-1 w-full rounded-lg border border-emerald-200/20 bg-black/40 px-2 py-1.5 text-sm text-white disabled:opacity-40" /></label>
            <label className="text-[11px] text-white/60">% of cash value<input type="number" min={0} max={100} value={pct} onChange={(e) => setPct(Number(e.target.value))} disabled={!handoff} aria-label="Percentage of cash value to hand off" className="mt-1 w-full rounded-lg border border-emerald-200/20 bg-black/40 px-2 py-1.5 text-sm text-white disabled:opacity-40" /></label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={add} className="rounded-full bg-emerald-400 px-4 py-1.5 text-xs font-bold text-black hover:bg-emerald-300">{added ? "Added ✓" : "Add to the chain"}</button>
            <button type="button" onClick={() => setFill(autofillFromProfile(data))} className="rounded-full border border-emerald-300/40 px-4 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-400/10" title={data ? "Fill this calculator's inputs from the shared profile" : "Sign in and complete the fact finder first"}>Auto-fill from profile</button>
            <Link href="/portal/chain" className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold text-white/85 hover:bg-white/10">Open the chain →</Link>
          </div>
          {fill && <p className="text-[11px] text-white/60">{fill.filled.length ? `Filled ${fill.filled.length} field${fill.filled.length === 1 ? "" : "s"}: ${fill.filled.slice(0, 4).map((f) => f.label).join(", ")}${fill.filled.length > 4 ? "…" : ""}.` : data ? "No fields on this page matched the profile vocabulary." : "No profile loaded — complete the fact finder first."}</p>}
        </div>
      )}
    </div>
  );
}

// ============================================================
// THE MORTGAGE LEDGER — what the loan is actually doing.
// Arithmetic in shared/mortgageLedger.ts. This page's job is to make the
// interest share impossible to look away from, then price the alternatives.
// ============================================================
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { FileText, TrendingDown, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  mortgageLedgerReport, normaliseStatement, equityPosition,
  type LoanInput, type ExtractedStatement,
} from "@shared/mortgageLedger";
import { trpc } from "@/lib/trpc";

const CARD = "rounded-2xl border border-amber-400/20 bg-white/[0.04]";
const INPUT = "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white tabular-nums";
const LABEL = "block text-[11px] uppercase tracking-[0.18em] text-slate-400";
const usd = (n: number) => (Number.isFinite(n) ? n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }) : "—");
const usd2 = (n: number) => (Number.isFinite(n) ? n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }) : "—");
const num = (s: string) => { const n = Number(s.replace(/[^0-9.-]/g, "")); return Number.isFinite(n) ? n : 0; };

export default function MortgageLedger() {
  const [balance, setBalance] = useState("400000");
  const [rate, setRate] = useState("6.5");
  const [payment, setPayment] = useState("2528.27");
  const [term, setTerm] = useState("360");
  const [escrow, setEscrow] = useState("0");
  const [value, setValue] = useState("620000");
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [importNote, setImportNote] = useState<string[] | null>(null);

  const extract = trpc.mortgageKiller.extractStatement.useMutation({
    onSuccess: (raw) => {
      // The extractor returns a set of CLAIMS. normaliseStatement checks them
      // against each other before any of it reaches the engine.
      const n = normaliseStatement(raw as ExtractedStatement);
      setBalance(String(n.loan.balance || ""));
      setRate(String((n.loan.annualRate * 100).toFixed(3)));
      setPayment(String(n.loan.monthlyPayment || ""));
      setTerm(String(n.loan.termMonthsRemaining || ""));
      if (n.homeMarketValue) setValue(String(n.homeMarketValue));
      setImportNote([
        n.lenderName ? `Read from a ${n.lenderName} statement.` : "Statement read.",
        ...(n.missing.length ? [`Could not determine: ${n.missing.join(", ")}. Enter these from the statement.`] : []),
        ...n.warnings,
      ]);
    },
    onError: (e) => setImportNote([`The statement could not be read: ${e.message}`]),
  });

  const loan: LoanInput = useMemo(() => ({
    balance: num(balance), annualRate: num(rate) / 100,
    monthlyPayment: num(payment), termMonthsRemaining: num(term),
    monthlyEscrow: num(escrow),
  }), [balance, rate, payment, term, escrow]);

  const ready = loan.balance > 0 && loan.annualRate > 0 && loan.monthlyPayment > 0 && loan.termMonthsRemaining > 0;
  const report = useMemo(() => (ready ? mortgageLedgerReport(loan) : null), [loan, ready]);
  const equity = useMemo(() => equityPosition(loan.balance, num(value)), [loan.balance, value]);

  return (
    <AppShell>
      <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6">
        <header className="border-b border-white/10 pb-6">
          <p className="text-[11px] uppercase tracking-[0.3em] text-amber-300/70">The loan itself</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl" style={{ textWrap: "balance" }}>
            The Mortgage Ledger
          </h1>
          <p className="mt-3 max-w-[64ch] text-[15px] leading-relaxed text-slate-300">
            Four numbers off your statement — balance, rate, payment, months left — and this shows exactly
            where every dollar of that payment goes, what the loan costs from here, and what an extra payment
            actually buys. It is arithmetic on your own figures, not a forecast.
          </p>
        </header>

        {/* ---------- import ---------- */}
        <section className={`${CARD} mt-6 p-5`}>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-200">
            <FileText className="h-4 w-4" aria-hidden /> Read it from the statement
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <div>
              <label className={LABEL} htmlFor="ml-url">Statement PDF URL</label>
              <input id="ml-url" className={`${INPUT} mt-1`} value={fileUrl} placeholder="https://…"
                     onChange={(e) => setFileUrl(e.target.value)} />
            </div>
            <div>
              <label className={LABEL} htmlFor="ml-name">File name</label>
              <input id="ml-name" className={`${INPUT} mt-1`} value={fileName} placeholder="statement.pdf"
                     onChange={(e) => setFileName(e.target.value)} />
            </div>
            <button type="button" disabled={!fileUrl || extract.isPending}
                    className="self-end rounded-lg bg-amber-400 px-4 py-2 text-xs font-semibold text-black hover:bg-amber-300 disabled:opacity-40"
                    onClick={() => extract.mutate({ fileUrl, fileName: fileName || "statement.pdf" })}>
              {extract.isPending ? "Reading…" : "Read statement"}
            </button>
          </div>
          {importNote && (
            <ul className="mt-3 flex flex-col gap-1.5 text-[13px] text-slate-300">
              {importNote.map((n, i) => (
                <li key={i} className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" aria-hidden />{n}
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          {/* ---------- inputs ---------- */}
          <section className={`${CARD} p-5`}>
            <h2 className="text-sm font-semibold text-amber-200">Your loan</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {([
                ["ml-bal", "Current balance", balance, setBalance],
                ["ml-rate", "Interest rate (%)", rate, setRate],
                ["ml-pmt", "Monthly payment (P&I)", payment, setPayment],
                ["ml-term", "Months remaining", term, setTerm],
                ["ml-esc", "Monthly escrow", escrow, setEscrow],
                ["ml-val", "Property value", value, setValue],
              ] as const).map(([id, label, val, set]) => (
                <div key={id}>
                  <label className={LABEL} htmlFor={id}>{label}</label>
                  <input id={id} className={`${INPUT} mt-1`} inputMode="decimal" value={val}
                         onChange={(e) => (set as (s: string) => void)(e.target.value)} />
                </div>
              ))}
            </div>

            {report && (
              <div className={`mt-5 rounded-xl border p-4 text-[13px] leading-relaxed ${report.check.ok ? "border-emerald-400/30 bg-emerald-400/[0.07] text-emerald-100" : "border-amber-400/40 bg-amber-400/10 text-amber-100"}`}>
                <p className="flex items-center gap-2 font-semibold">
                  {report.check.ok ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : <AlertTriangle className="h-4 w-4" aria-hidden />}
                  {report.check.verdict}
                </p>
                <p className="mt-1.5 text-slate-200">{report.check.note}</p>
              </div>
            )}

            <div className="mt-5 border-t border-white/10 pt-4">
              <h3 className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Equity position</h3>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[13px] tabular-nums text-slate-300">
                <dt>Equity</dt><dd className="text-right text-white">{usd(equity.equity)}</dd>
                <dt>Current LTV</dt><dd className="text-right text-white">{(equity.currentLtv * 100).toFixed(1)}%</dd>
                <dt>Room at 75% LTV</dt><dd className="text-right text-white">{usd(equity.availableToBorrow)}</dd>
              </dl>
              <a href="/portal/liquidity-routes" className="mt-3 inline-block text-[12.5px] text-amber-300 hover:underline">
                Fifteen ways to reach that equity without a bank →
              </a>
            </div>
          </section>

          {/* ---------- results ---------- */}
          <section className="flex flex-col gap-5">
            {!report ? (
              <div className={`${CARD} p-6 text-[14px] text-slate-400`}>
                Enter the balance, rate, payment and months remaining — all four are on the statement — and the
                ledger fills in.
              </div>
            ) : (
              <>
                <div className={`${CARD} p-6`}>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">This month's payment</p>
                  <div className="mt-3 flex h-8 overflow-hidden rounded-lg">
                    <div className="flex items-center justify-center bg-rose-500/70 text-[11px] font-semibold text-white"
                         style={{ width: `${Math.max(6, report.split.interestShare * 100)}%` }}>
                      {Math.round(report.split.interestShare * 100)}%
                    </div>
                    <div className="flex items-center justify-center bg-emerald-500/70 text-[11px] font-semibold text-white"
                         style={{ width: `${Math.max(6, report.split.principalShare * 100)}%` }}>
                      {Math.round(report.split.principalShare * 100)}%
                    </div>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[13.5px] tabular-nums text-slate-300">
                    <dt className="text-rose-300">Interest (interest-only amount)</dt><dd className="text-right text-white">{usd2(report.split.interest)}</dd>
                    <dt className="text-emerald-300">Principal (principal-only amount)</dt><dd className="text-right text-white">{usd2(report.split.principal)}</dd>
                    {report.split.escrow > 0 && (<><dt>Escrow</dt><dd className="text-right text-white">{usd2(report.split.escrow)}</dd></>)}
                    <dt className="border-t border-white/10 pt-1">Total leaving the account</dt>
                    <dd className="border-t border-white/10 pt-1 text-right font-semibold text-white">{usd2(report.split.totalOutlay)}</dd>
                    <dt>Interest per day</dt><dd className="text-right text-white">{usd2(report.split.interestPerDay)}</dd>
                  </dl>
                </div>

                <div className={`${CARD} p-5`}>
                  <h2 className="text-sm font-semibold text-amber-200">On pace</h2>
                  <ul className="mt-2 flex list-disc flex-col gap-2 pl-5 text-[13.5px] leading-relaxed text-slate-300">
                    {report.headlines.map((h, i) => <li key={i}>{h}</li>)}
                  </ul>
                </div>

                <div className={`${CARD} p-5`}>
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-200">
                    <TrendingDown className="h-4 w-4" aria-hidden /> What paying more actually buys
                  </h2>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[540px] text-[13px] tabular-nums">
                      <thead>
                        <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-[0.14em] text-slate-500">
                          <th className="py-2 pr-3 font-normal">Extra</th>
                          <th className="py-2 pr-3 text-right font-normal">Pays off</th>
                          <th className="py-2 pr-3 text-right font-normal">Interest saved</th>
                          <th className="py-2 pr-3 text-right font-normal">Cash put in</th>
                          <th className="py-2 text-right font-normal">Saved per $1</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.scenarios.map((s) => (
                          <tr key={s.label} className="border-b border-white/5">
                            <td className="py-2 pr-3 text-slate-200">{s.label}</td>
                            <td className="py-2 pr-3 text-right text-white">
                              {s.yearsToPayoff != null ? `${s.yearsToPayoff.toFixed(1)} yr` : "never"}
                            </td>
                            <td className="py-2 pr-3 text-right text-emerald-300">{usd(s.interestSaved)}</td>
                            <td className="py-2 pr-3 text-right text-slate-400">{usd(s.extraPaidIn)}</td>
                            <td className="py-2 text-right text-white">{s.savedPerDollar.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-3 text-[12.5px] leading-relaxed text-slate-400">
                    Prepaying a mortgage earns exactly the note rate — {(loan.annualRate * 100).toFixed(2)}% here —
                    risk-free. The saving is real, but it is not free money: it is the same money paid earlier,
                    which is why the cash-put-in column sits next to the interest saved.
                  </p>
                </div>

                <div className={`${CARD} p-5`}>
                  <h2 className="text-sm font-semibold text-amber-200">Year by year</h2>
                  <div className="mt-3 max-h-80 overflow-y-auto overflow-x-auto">
                    <table className="w-full min-w-[460px] text-[13px] tabular-nums">
                      <thead className="sticky top-0 bg-[#0a0f1a]">
                        <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-[0.14em] text-slate-500">
                          <th className="py-2 pr-3 font-normal">Year</th>
                          <th className="py-2 pr-3 text-right font-normal">Interest</th>
                          <th className="py-2 pr-3 text-right font-normal">Principal</th>
                          <th className="py-2 pr-3 text-right font-normal">% interest</th>
                          <th className="py-2 text-right font-normal">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.byYear.map((y) => (
                          <tr key={y.year} className="border-b border-white/5">
                            <td className="py-1.5 pr-3 text-slate-400">{y.year}</td>
                            <td className="py-1.5 pr-3 text-right text-rose-300">{usd(y.interest)}</td>
                            <td className="py-1.5 pr-3 text-right text-emerald-300">{usd(y.principal)}</td>
                            <td className="py-1.5 pr-3 text-right text-slate-300">{Math.round(y.interestShare * 100)}%</td>
                            <td className="py-1.5 text-right text-white">{usd(y.endingBalance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}

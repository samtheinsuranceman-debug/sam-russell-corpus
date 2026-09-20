// ============================================================
// PLASTIC TO CASH.
// Engine and registry in shared/plasticToCash.ts.
//
// Two rules this page keeps, inherited from LiquidityRoutes.tsx:
//   1. Weaknesses render ABOVE strengths. Always. That ordering is the
//      difference between this page and a lead-generation page.
//   2. Every figure shows the page it was read from and the date it was read.
//      Anything that could not be read renders as unverified rather than being
//      filled in with a plausible number.
//
// And one rule specific to this strategy: the funding-ceiling banner stays up
// until Nationwide's card policy is confirmed by phone. The number this page
// models and the number anyone has verified are not the same number.
// ============================================================
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  ShieldAlert, ExternalLink, AlertTriangle, CheckCircle2, XCircle, HelpCircle, TrendingDown,
} from "lucide-react";
import {
  ZERO_APR_CARDS, usableCards, ISSUER_GATES, APPLICATION_SEQUENCE,
  CARRIER_CARD_POLICIES, verifiedCardFundingCeiling,
  projectPlasticToCash, projectCardCost, DEFAULT_ASSUMPTIONS,
  STRATEGY_WEAKNESSES, PLASTIC_TO_CASH_DISCLOSURE, FUNDING_CEILING_BANNER,
  type ZeroAprCard, type Verified, type PremiumCoding,
} from "@shared/plasticToCash";

const CARD = "rounded-2xl border border-amber-400/20 bg-white/[0.04]";
const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

/** Renders a sourced value, or says plainly that it could not be read. */
function Sourced<T>({ field, render }: { field: Verified<T>; render?: (v: T) => string }) {
  const text = render ? render(field.value) : String(field.value ?? "—");
  return (
    <span className="inline-flex flex-wrap items-baseline gap-1.5">
      <span className={field.verified ? "text-slate-200" : "text-amber-200/80"}>{text}</span>
      {field.verified ? (
        field.source && (
          <a href={field.source} target="_blank" rel="noopener noreferrer"
             className="text-[11px] text-amber-300/70 hover:underline" title={`Read ${field.asOf}`}>
            source
          </a>
        )
      ) : (
        <span className="rounded-full border border-amber-400/40 px-1.5 py-px text-[9.5px] uppercase tracking-[0.12em] text-amber-300">
          unverified
        </span>
      )}
      {field.note && <span className="w-full text-[12px] leading-relaxed text-slate-400">{field.note}</span>}
    </span>
  );
}

const CODING_LABEL: Record<PremiumCoding, { text: string; tone: string; icon: typeof CheckCircle2 }> = {
  "purchase-by-mcc": {
    text: "Nothing in the agreement excludes it",
    tone: "text-emerald-300/90 border-emerald-400/30 bg-emerald-400/[0.06]",
    icon: CheckCircle2,
  },
  "issuer-discretion": {
    text: "No enumerated list — issuer decides",
    tone: "text-amber-300/90 border-amber-400/30 bg-amber-400/[0.06]",
    icon: HelpCircle,
  },
  "aggregator-risk": {
    text: "Third-party bill-pay named as cash-like",
    tone: "text-rose-300/90 border-rose-400/30 bg-rose-400/[0.06]",
    icon: AlertTriangle,
  },
  "listed-as-cash": {
    text: "Premiums listed as a cash equivalent",
    tone: "text-rose-300 border-rose-400/40 bg-rose-400/[0.10]",
    icon: XCircle,
  },
};

function CardRow({ c, charged, months }: { c: ZeroAprCard; charged: number; months: number }) {
  const coding = CODING_LABEL[c.premiumCoding];
  const CodingIcon = coding.icon;
  const cost = useMemo(
    () => projectCardCost({ chargedPerCard: charged, cards: [c.id], monthsToRepay: months, useWorstCaseApr: true }),
    [c.id, charged, months],
  );
  const row = cost.perCard[0];
  const unusable = (c.introPurchase.value ?? 0) === 0;

  return (
    <article className={`${CARD} p-6 ${unusable ? "opacity-70" : ""}`}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="text-xl font-semibold tracking-tight text-white" style={{ textWrap: "balance" }}>{c.card}</h3>
        <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-[10.5px] uppercase tracking-[0.14em] text-slate-400">
          {c.issuer}
        </span>
        {unusable ? (
          <span className="rounded-full border border-rose-400/40 bg-rose-400/[0.08] px-2.5 py-0.5 text-[10.5px] uppercase tracking-[0.14em] text-rose-300">
            no 0% on purchases
          </span>
        ) : (
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/[0.07] px-2.5 py-0.5 text-[10.5px] uppercase tracking-[0.14em] text-emerald-300">
            {c.introPurchase.value} {c.introUnit === "billing_cycles" ? "billing cycles" : "months"} at 0%
          </span>
        )}
      </div>

      {/* Weaknesses first. Deliberate. */}
      <h4 className="mt-5 text-[11px] uppercase tracking-[0.18em] text-rose-300/80">What it costs you</h4>
      <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 text-[13.5px] leading-relaxed text-slate-300">
        {c.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
      </ul>

      <div className={`mt-5 rounded-xl border p-3.5 ${coding.tone}`}>
        <div className="flex items-start gap-2">
          <CodingIcon className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden />
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.1em]">How a premium is coded: {coding.text}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-300">
              <Sourced field={c.cashEquivalentLanguage} />
            </p>
          </div>
        </div>
      </div>

      <dl className="mt-5 grid gap-x-6 gap-y-2.5 border-t border-white/10 pt-4 text-[13.5px] leading-relaxed sm:grid-cols-2">
        <div>
          <dt className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Go-to APR</dt>
          <dd className="mt-0.5">
            <Sourced field={c.goToAprMin} render={v => v == null ? "not readable" : `${v}%`} />
            <span className="mx-1 text-slate-500">–</span>
            <Sourced field={c.goToAprMax} render={v => v == null ? "" : `${v}%`} />
          </dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Annual fee</dt>
          <dd className="mt-0.5"><Sourced field={c.annualFee} render={v => v == null ? "not readable" : usd(v)} /></dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Cash advance fee</dt>
          <dd className="mt-0.5"><Sourced field={c.cashAdvanceFeePct} render={v => v == null ? "not readable" : `${v}%`} /></dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Cash advance APR</dt>
          <dd className="mt-0.5"><Sourced field={c.cashAdvanceAprMax} render={v => v == null ? "not readable" : `${v}%`} /></dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Same-day credit line increase</dt>
          <dd className="mt-0.5"><Sourced field={c.sameDayCli} render={v => v == null ? "not published" : v ? "yes, soft pull" : "no — likely a hard pull"} /></dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Credit guidance</dt>
          <dd className="mt-0.5"><Sourced field={c.creditGuidance} render={v => v ?? "not published"} /></dd>
        </div>
      </dl>

      {!unusable && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
              If it posts as a purchase — {usd(row.charged)} held {months} months
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-300">{usd(row.interestIfUnpaid)}</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-slate-400">
              {row.monthsOutsideIntro === 0
                ? `Repaid inside the 0% window. No interest.`
                : `${row.monthsOutsideIntro} months past the window at ${row.aprUsed}%.`}
            </p>
          </div>
          <div className="rounded-xl border border-rose-400/25 bg-rose-400/[0.05] p-3.5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-rose-300/80">
              If it posts as a cash advance instead
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-rose-300">
              {row.cashAdvanceDownside == null ? "not readable" : usd(row.cashAdvanceDownside)}
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-slate-400">
              Fee on day one, then interest from day one with no grace period. The 0% window does not apply.
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-4">
        <a href={c.applyUrl} target="_blank" rel="noopener noreferrer"
           className="inline-flex items-center gap-1.5 text-[14px] font-medium text-amber-200 hover:underline">
          Issuer page <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
        <a href={c.termsUrl} target="_blank" rel="noopener noreferrer"
           className="inline-flex items-center gap-1.5 text-[14px] font-medium text-slate-300 hover:underline">
          Cardholder agreement <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      </div>
    </article>
  );
}

export default function PlasticToCash() {
  const [premium, setPremium] = useState(DEFAULT_ASSUMPTIONS.annualPremium);
  const [years, setYears] = useState(DEFAULT_ASSUMPTIONS.years);
  const [credit, setCredit] = useState(DEFAULT_ASSUMPTIONS.indexCreditRate);
  const [loanRate, setLoanRate] = useState(DEFAULT_ASSUMPTIONS.loanChargeRate);
  const [monthsToRepay, setMonthsToRepay] = useState(18);

  const projection = useMemo(
    () => projectPlasticToCash({
      ...DEFAULT_ASSUMPTIONS,
      annualPremium: premium, years, indexCreditRate: credit, loanChargeRate: loanRate,
      mechanism: "participating-loan",
    }),
    [premium, years, credit, loanRate],
  );

  const ceiling = verifiedCardFundingCeiling();
  const cards = usableCards();
  const excluded = ZERO_APR_CARDS.filter(c => (c.introPurchase.value ?? 0) === 0);
  const perCardCharge = Math.round(premium / Math.max(1, cards.length));
  const totalCashOut = projection.rows.reduce((s, r) => s + r.accessibleCash, 0);
  const borrowedShare = projection.finalAccountValue > 0
    ? projection.finalLoanBalance / projection.finalAccountValue : 0;

  return (
    <AppShell title="Plastic to Cash">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8">

        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-white" style={{ textWrap: "balance" }}>
            Plastic to Cash
          </h1>
          <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-slate-300">
            A credit line is purchasing power you cannot invest with. You cannot buy an index fund with it,
            or a down payment, or a stake in a business, and you cannot gift cash with it. A carrier that
            accepts a card for premium turns that line into policy cash value — and policy cash value{" "}
            <em>is</em> deployable. That is the whole conversion: spending power in, deployable cash out,
            inside a 0% window.
          </p>
        </header>

        {/* The banner stays until a phone call retires it. */}
        <div className="rounded-2xl border border-amber-400/40 bg-amber-400/[0.08] p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-300" aria-hidden />
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-amber-300">
                Read this before you use any number on this page
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-amber-100">{FUNDING_CEILING_BANNER}</p>
              <p className="mt-3 text-[13px] leading-relaxed text-amber-200/80">
                Verified ceiling today: <strong className="tabular-nums">{usd(ceiling.annual)}</strong>. {ceiling.basis}
              </p>
            </div>
          </div>
        </div>

        {/* Weaknesses before anything else on the page. */}
        <section className={`${CARD} border-rose-400/25 bg-rose-400/[0.04] p-6`}>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-rose-300" aria-hidden />
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-rose-300">
              How this fails
            </h2>
          </div>
          <ul className="mt-4 flex list-disc flex-col gap-2.5 pl-5 text-[13.5px] leading-relaxed text-slate-300">
            {STRATEGY_WEAKNESSES.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </section>

        {/* The mechanism — loan, and why not withdrawal. */}
        <section className={`${CARD} p-6`}>
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-amber-300">
            The mechanism is a participating loan, not a withdrawal
          </h2>
          <div className="mt-4 flex flex-col gap-3.5 text-[14px] leading-relaxed text-slate-300">
            <p>
              This strategy is usually explained as: pay the premium, let it sit a day, take the money back
              out, and the index credit still lands on the full amount because the account value only ever
              goes up. That explanation conflates two different things, and the difference is large enough
              to matter.
            </p>
            <p>
              An <strong className="text-white">annuity income rider</strong> has a benefit base — a notional
              value that rolls up with deposits, is unaffected by withdrawals, and exists only to compute
              income. You cannot withdraw it. An <strong className="text-white">indexed universal life
              policy</strong> has an account value, which <em>is</em> the cash value. Index credits apply to
              the balance actually sitting in the index segment on the segment anniversary. Take money out
              and the balance falls; the next credit is computed on what remains.
            </p>
            <p className="rounded-xl border border-emerald-400/30 bg-emerald-400/[0.07] p-4 text-emerald-100">
              <strong className="font-semibold">The strategy still works — through a different door.</strong>{" "}
              Under a <strong>participating (wash) loan</strong> the carrier lends against the policy from its
              own general account. Your cash value is never removed. It stays in the index segment and keeps
              earning the full credit while you hold the borrowed cash and pay a loan charge on it. The spread —
              index credit earned minus loan charge paid — is the real engine. It is arbitrage on a
              collateralised balance, not growth on a phantom account value, and that distinction is the
              difference between an illustration an agent can defend and one they cannot.
            </p>
            <p>
              Over {years} years at these assumptions the loan route produces{" "}
              <strong className="tabular-nums text-white">{usd(projection.totalIndexCredits)}</strong> in index
              credits. Withdrawing instead produces a small fraction of that, because every withdrawal shrinks
              the balance the next credit is computed on.
            </p>
          </div>
        </section>

        {/* Projection controls. */}
        <section className={`${CARD} p-6`}>
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-amber-300">
            The policy side
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {([
              ["Annual premium", premium, setPremium, 10_000, 200_000, 1_000, usd],
              ["Years", years, setYears, 5, 40, 1, (n: number) => `${n}`],
              ["Index credit", credit, setCredit, 0, 0.15, 0.005, (n: number) => `${(n * 100).toFixed(1)}%`],
              ["Loan charge", loanRate, setLoanRate, 0, 0.10, 0.0025, (n: number) => `${(n * 100).toFixed(2)}%`],
            ] as const).map(([label, val, set, min, max, step, fmt]) => (
              <label key={label} className="flex flex-col gap-1.5">
                <span className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{label}</span>
                <span className="text-xl font-semibold tabular-nums text-white">{fmt(val as number)}</span>
                <input type="range" min={min} max={max} step={step} value={val as number}
                       onChange={e => (set as (n: number) => void)(Number(e.target.value))}
                       className="accent-amber-400" aria-label={label} />
              </label>
            ))}
          </div>

          {projection.warnings.length > 0 && (
            <ul className="mt-5 flex flex-col gap-2">
              {projection.warnings.map((w, i) => (
                <li key={i} className="rounded-xl border border-amber-400/30 bg-amber-400/[0.06] p-3.5 text-[13px] leading-relaxed text-amber-100">
                  {w}
                </li>
              ))}
            </ul>
          )}

          <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {([
              ["Premium paid in", projection.totalPremium, "text-slate-200"],
              ["Index credits earned", projection.totalIndexCredits, "text-emerald-300"],
              ["Loan charges paid", projection.totalLoanCharges, "text-rose-300"],
              ["Net arbitrage", projection.netArbitrage, projection.netArbitrage > 0 ? "text-emerald-300" : "text-rose-300"],
            ] as const).map(([label, val, tone]) => (
              <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <dt className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{label}</dt>
                <dd className={`mt-1 text-2xl font-semibold tabular-nums ${tone}`}>{usd(val)}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Cash made deployable over {years} years</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-amber-200">{usd(totalCashOut)}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">
              Money you can invest, lend, or put into a property — none of which the credit line itself could do.
            </p>
          </div>

          {/* Lapse exposure. The number most illustrations bury. */}
          <div className={`mt-4 rounded-xl border p-4 ${
            borrowedShare > 0.9 ? "border-rose-400/40 bg-rose-400/[0.08]" : "border-white/10 bg-white/[0.03]"
          }`}>
            <div className="flex items-start gap-2">
              <TrendingDown className={`mt-0.5 h-4 w-4 flex-shrink-0 ${borrowedShare > 0.9 ? "text-rose-300" : "text-slate-400"}`} aria-hidden />
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Lapse exposure in year {years}</p>
                <p className={`mt-1 text-2xl font-semibold tabular-nums ${borrowedShare > 0.9 ? "text-rose-300" : "text-slate-200"}`}>
                  {(borrowedShare * 100).toFixed(1)}% borrowed
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-300">
                  Loan balance {usd(projection.finalLoanBalance)} against account value {usd(projection.finalAccountValue)}.
                  {borrowedShare > 0.9 && (
                    <strong className="text-rose-200"> Above the 90% line. A lapse here makes the entire
                    gain immediately taxable — a tax bill on money that has already been spent.</strong>
                  )}
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{projection.netDeathBenefitNote}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[640px] text-[13px] tabular-nums">
              <thead>
                <tr className="border-b border-white/10 text-left text-[10.5px] uppercase tracking-[0.14em] text-slate-500">
                  <th className="py-2 pr-4 font-medium">Year</th>
                  <th className="py-2 pr-4 font-medium">Account value</th>
                  <th className="py-2 pr-4 font-medium">Index credit</th>
                  <th className="py-2 pr-4 font-medium">Loan balance</th>
                  <th className="py-2 pr-4 font-medium">Loan charge</th>
                  <th className="py-2 font-medium">Cash out</th>
                </tr>
              </thead>
              <tbody>
                {projection.rows.map(r => (
                  <tr key={r.year} className="border-b border-white/5">
                    <td className="py-1.5 pr-4 text-slate-400">{r.year}</td>
                    <td className="py-1.5 pr-4 text-slate-200">{usd(r.accountValue)}</td>
                    <td className="py-1.5 pr-4 text-emerald-300/90">{usd(r.indexCredit)}</td>
                    <td className="py-1.5 pr-4 text-slate-300">{usd(r.loanBalance)}</td>
                    <td className="py-1.5 pr-4 text-rose-300/80">{usd(r.loanCharge)}</td>
                    <td className="py-1.5 text-amber-200">{usd(r.accessibleCash)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Carrier side — the real constraint. */}
        <section className={`${CARD} p-6`}>
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-amber-300">
            Which carriers actually take a card
          </h2>
          <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-slate-300">
            This is where the strategy meets its ceiling. The reason is not interchange cost. Under New York
            DFS opinions, <strong className="text-white">the method of premium payment is itself a benefit
            under the policy</strong>, and benefit discrimination within a class is prohibited — so a carrier
            offers cards to an entire filed class or to nobody. There is no exception to negotiate.
          </p>
          <div className="mt-5 flex flex-col gap-4">
            {CARRIER_CARD_POLICIES.map(c => (
              <div key={c.carrier} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="text-[16px] font-semibold text-white">{c.carrier}</h3>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10.5px] uppercase tracking-[0.14em] ${
                    c.acceptsCards.value === "yes" ? "border-emerald-400/30 bg-emerald-400/[0.07] text-emerald-300"
                    : c.acceptsCards.value === "no" ? "border-rose-400/30 bg-rose-400/[0.07] text-rose-300"
                    : "border-amber-400/30 bg-amber-400/[0.07] text-amber-300"
                  }`}>
                    {c.acceptsCards.value === "yes" ? "takes cards"
                      : c.acceptsCards.value === "no" ? "does not take cards" : "unverified"}
                  </span>
                </div>
                <dl className="mt-3 grid gap-x-6 gap-y-2 text-[13.5px] leading-relaxed sm:grid-cols-2">
                  <div><dt className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Scope</dt>
                       <dd className="mt-0.5"><Sourced field={c.scope} render={v => v.replace(/-/g, " ")} /></dd></div>
                  <div><dt className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Cap</dt>
                       <dd className="mt-0.5"><Sourced field={c.cap} render={v => v == null ? "none published" : usd(v)} /></dd></div>
                  <div className="sm:col-span-2">
                       <dt className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Product</dt>
                       <dd className="mt-0.5"><Sourced field={c.product} render={v => v ?? "no IUL offered"} /></dd></div>
                </dl>
                <h4 className="mt-4 text-[11px] uppercase tracking-[0.18em] text-rose-300/80">What it costs you</h4>
                <ul className="mt-1.5 flex list-disc flex-col gap-1.5 pl-5 text-[13.5px] leading-relaxed text-slate-300">
                  {c.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Cards. */}
        <section className="flex flex-col gap-5">
          <div>
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-amber-300">
              The cards, longest 0% purchase window first
            </h2>
            <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-slate-300">
              The purchase window is the one that matters — a premium is a purchase, not a transfer, so the
              headline balance-transfer number on most published lists is the wrong number to plan against.
              Figures below model {usd(perCardCharge)} per card held {monthsToRepay} months.
            </p>
            <label className="mt-4 flex max-w-xs flex-col gap-1.5">
              <span className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Months before repayment</span>
              <span className="text-xl font-semibold tabular-nums text-white">{monthsToRepay}</span>
              <input type="range" min={1} max={36} step={1} value={monthsToRepay}
                     onChange={e => setMonthsToRepay(Number(e.target.value))}
                     className="accent-amber-400" aria-label="Months before repayment" />
            </label>
          </div>
          {cards.map(c => <CardRow key={c.id} c={c} charged={perCardCharge} months={monthsToRepay} />)}
        </section>

        {excluded.length > 0 && (
          <section className="flex flex-col gap-5">
            <div>
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-rose-300/80">
                Listed so the exclusion is visible
              </h2>
              <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-slate-300">
                These appear on most published top-ten lists and do not work for this strategy. They are shown
                rather than omitted so the gap is deliberate rather than an oversight.
              </p>
            </div>
            {excluded.map(c => <CardRow key={c.id} c={c} charged={perCardCharge} months={monthsToRepay} />)}
          </section>
        )}

        {/* Sequencing. */}
        <section className={`${CARD} p-6`}>
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-amber-300">
            What order to apply in, and why
          </h2>
          <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-slate-300">
            The order is not a preference — it follows from the gates. Chase's 5/24 is the only rule driven by{" "}
            <em>other</em> issuers' accounts, so every card opened anywhere burns a Chase slot. Apply to Chase
            before accumulating inquiries elsewhere, or not at all. Each application is a hard inquiry; inquiries
            affect scores for about twelve months and stay on the report for twenty-four.
          </p>
          <ol className="mt-5 flex flex-col gap-3">
            {APPLICATION_SEQUENCE.map(s => {
              const gate = ISSUER_GATES[s.issuer];
              return (
                <li key={s.step} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <span className="text-[11px] tabular-nums text-amber-300/60">{String(s.step).padStart(2, "0")}</span>
                    <h3 className="text-[15px] font-semibold text-white">{s.issuer}</h3>
                    <span className="text-[13px] text-slate-400">
                      {s.take.map(id => ZERO_APR_CARDS.find(c => c.id === id)?.card).filter(Boolean).join(", ")}
                    </span>
                  </div>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-slate-300">{s.why}</p>
                  {gate && (
                    <p className="mt-2 text-[12.5px] leading-relaxed text-slate-400">
                      <strong className="text-slate-300">Gate:</strong> {gate.rule}{" "}
                      {gate.published ? (
                        <span className="text-emerald-300/80">(published by the issuer)</span>
                      ) : (
                        <span className="text-amber-300/80">(not published by the issuer — widely reported, treat as unconfirmed)</span>
                      )}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-[13px] leading-relaxed text-slate-400">
          {PLASTIC_TO_CASH_DISCLOSURE}
        </p>
      </div>
    </AppShell>
  );
}

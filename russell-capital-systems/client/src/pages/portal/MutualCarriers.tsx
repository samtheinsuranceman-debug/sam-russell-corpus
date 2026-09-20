// ============================================================
// THE CARRIER DESK.
// Registries in shared/mutualIulCarriers.ts (is it mutual, what does its own
// site say) and shared/mutualCarrierIntel.ts (loan cost, underwriting, cards,
// where it actually wins).
//
// Three rules this page keeps:
//   1. Caveats render above the superpower. A carrier with no stated caveat
//      has not been looked at.
//   2. Ownership structure is a COLUMN, not a filter. Excluding Allianz and
//      Symetra for being stock companies would hide the best guaranteed loan
//      rate and the best floor guarantee on the shelf.
//   3. Carriers an agent would expect and will not find are listed with the
//      reason. An unexplained omission reads as an oversight.
// ============================================================
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ShieldAlert, ExternalLink, CreditCard, Landmark } from "lucide-react";
import {
  CARRIER_INTEL, byLoanCost, OWNERSHIP_LABEL, NOTABLE_EXCLUSIONS,
  CARD_ACCEPTANCE_EXPLAINER, ARBITRAGE_NOTE,
  type CarrierIntel, type OwnershipClass,
} from "@shared/mutualCarrierIntel";
import {
  MUTUAL_IUL_CARRIERS, RATING_SCALES, CARRIER_READ_PROTOCOL,
  type Verified,
} from "@shared/mutualIulCarriers";

const CARD = "rounded-2xl border border-amber-400/20 bg-white/[0.04]";

type Lens = "all" | "mutual-only" | "takes-cards" | "by-loan-cost";

const OWNERSHIP_TONE: Record<OwnershipClass, string> = {
  "true-mutual": "border-emerald-400/35 bg-emerald-400/[0.08] text-emerald-300",
  "mutual-holding-company": "border-emerald-400/25 bg-emerald-400/[0.05] text-emerald-200/90",
  "stock-under-mutual": "border-amber-400/30 bg-amber-400/[0.06] text-amber-300",
  stock: "border-slate-400/25 bg-slate-400/[0.05] text-slate-300",
};

function Sourced<T>({ field, render }: { field: Verified<T>; render?: (v: T) => string }) {
  const text = render ? render(field.value) : String(field.value ?? "—");
  return (
    <span className="inline-flex flex-wrap items-baseline gap-1.5">
      <span className={field.verified ? "text-slate-200" : "text-amber-200/80"}>{text}</span>
      {field.verified ? (
        field.source && (
          <a href={field.source} target="_blank" rel="noopener noreferrer"
             className="text-[11px] text-amber-300/70 hover:underline" title={`Read ${field.asOf}`}>source</a>
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

function Carrier({ c, rank }: { c: CarrierIntel; rank?: number }) {
  const registry = MUTUAL_IUL_CARRIERS.find(r => r.id === c.carrierId);
  const takesCards = c.cardPolicy.verified && c.cardPolicy.value.startsWith("YES");
  const refusesCards = c.cardPolicy.verified && c.cardPolicy.value.startsWith("NO");

  return (
    <article className={`${CARD} p-6`}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
        {rank != null && <span className="text-[11px] tabular-nums text-amber-300/60">{String(rank).padStart(2, "0")}</span>}
        <h3 className="text-xl font-semibold tracking-tight text-white" style={{ textWrap: "balance" }}>{c.name}</h3>
        <span className={`rounded-full border px-2.5 py-0.5 text-[10.5px] uppercase tracking-[0.14em] ${OWNERSHIP_TONE[c.ownershipClass]}`}>
          {OWNERSHIP_LABEL[c.ownershipClass]}
        </span>
        {takesCards && (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/[0.07] px-2.5 py-0.5 text-[10.5px] uppercase tracking-[0.14em] text-emerald-300">
            <CreditCard className="h-3 w-3" aria-hidden /> takes cards
          </span>
        )}
        {refusesCards && (
          <span className="rounded-full border border-rose-400/30 bg-rose-400/[0.07] px-2.5 py-0.5 text-[10.5px] uppercase tracking-[0.14em] text-rose-300">
            no cards
          </span>
        )}
      </div>

      <p className="mt-2 text-[13px] text-slate-400">
        <Sourced field={c.homeCity} render={v => v ?? "—"} />
        <span className="mx-1">·</span>
        <Sourced field={c.homeState} render={v => v ?? "—"} />
        <span className="mx-1">·</span>
        <Sourced field={c.founded} render={v => v == null ? "founding year not confirmed" : `founded ${v} — ${2026 - v} years`} />
      </p>

      {/* Caveats first. Deliberate. */}
      <h4 className="mt-5 text-[11px] uppercase tracking-[0.18em] text-rose-300/80">What to watch</h4>
      <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 text-[13.5px] leading-relaxed text-slate-300">
        {c.caveats.map((w, i) => <li key={i}>{w}</li>)}
      </ul>

      <div className="mt-5 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.05] p-4">
        <h4 className="text-[11px] uppercase tracking-[0.18em] text-emerald-300/80">Where it wins</h4>
        <p className="mt-1.5 text-[14px] leading-relaxed text-emerald-50/90">{c.superpower}</p>
      </div>

      <dl className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-4 text-[13.5px] leading-relaxed">
        <div>
          <dt className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Ownership, precisely</dt>
          <dd className="mt-0.5"><Sourced field={c.ownershipDetail} /></dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Policy loans — where the arbitrage lives</dt>
          <dd className="mt-0.5"><Sourced field={c.loanRate} render={v => v ?? "not published — read the policy form"} /></dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Cost of insurance</dt>
          <dd className="mt-0.5"><Sourced field={c.coiNote} render={v => v ?? "no published COI scale — no carrier publishes one"} /></dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Underwriting</dt>
          <dd className="mt-0.5"><Sourced field={c.underwriting} render={v => v ?? "not published"} /></dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Credit cards for premium</dt>
          <dd className="mt-0.5"><Sourced field={c.cardPolicy} /></dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Open to independent agents</dt>
          <dd className="mt-0.5"><Sourced field={c.openToIndependents} render={v => v == null ? "not published" : v ? "yes" : "no — captive"} /></dd>
        </div>
      </dl>

      {registry && (
        <div className="mt-5 border-t border-white/10 pt-4">
          <h4 className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Product and index strategies</h4>
          <p className="mt-1.5 text-[13.5px] leading-relaxed">
            <Sourced field={registry.product} render={v => v ?? "no IUL product confirmed"} />
          </p>
          {registry.strategies.length > 0 && (
            <ul className="mt-2.5 flex list-disc flex-col gap-1.5 pl-5 text-[13px] leading-relaxed text-slate-300">
              {registry.strategies.map((s, i) => <li key={i}><Sourced field={s} /></li>)}
            </ul>
          )}
          {registry.ratings.length > 0 && (
            <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
              {registry.ratings.map((r, i) => (
                <span key={i} className={r.verified ? "text-slate-200" : "text-amber-200/80"}>
                  <span className="text-slate-500">{r.agency}</span> {r.rating}
                  {r.asOf && <span className="text-slate-500"> ({r.asOf})</span>}
                </span>
              ))}
            </p>
          )}
        </div>
      )}

      <a href={c.home} target="_blank" rel="noopener noreferrer"
         className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-medium text-amber-200 hover:underline">
        Carrier site <ExternalLink className="h-3.5 w-3.5" aria-hidden />
      </a>
    </article>
  );
}

export default function MutualCarriers() {
  const [lens, setLens] = useState<Lens>("by-loan-cost");

  const list = useMemo(() => {
    switch (lens) {
      case "mutual-only":
        return CARRIER_INTEL.filter(c => c.ownershipClass === "true-mutual" || c.ownershipClass === "mutual-holding-company");
      case "takes-cards":
        return CARRIER_INTEL.filter(c => !(c.cardPolicy.verified && c.cardPolicy.value.startsWith("NO")));
      case "by-loan-cost":
        return byLoanCost();
      default:
        return CARRIER_INTEL;
    }
  }, [lens]);

  const LENSES: Array<[Lens, string]> = [
    ["by-loan-cost", "Cheapest borrowing first"],
    ["mutual-only", "Mutual structures only"],
    ["takes-cards", "Not ruled out for cards"],
    ["all", "Everything"],
  ];

  return (
    <AppShell title="The Carrier Desk">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8">

        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-white" style={{ textWrap: "balance" }}>
            The Carrier Desk
          </h1>
          <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-slate-300">
            Where each carrier actually wins, what it costs to borrow against a policy there, whose
            underwriting is easiest, and who will take a card for premium. Ownership structure is shown
            precisely — "mutual" gets used for three different things and only one of them means
            policyholder-owned outright.
          </p>
        </header>

        <section className={`${CARD} p-5`}>
          <div className="flex items-start gap-2">
            <Landmark className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300" aria-hidden />
            <p className="text-[13.5px] leading-relaxed text-slate-300">{ARBITRAGE_NOTE}</p>
          </div>
        </section>

        <div className="flex flex-wrap gap-2">
          {LENSES.map(([k, label]) => (
            <button key={k} onClick={() => setLens(k)}
              className={`rounded-full border px-3.5 py-1.5 text-[12.5px] transition ${
                lens === k
                  ? "border-amber-400/50 bg-amber-400/[0.12] text-amber-100"
                  : "border-white/15 text-slate-300 hover:border-white/30"
              }`}>
              {label}
            </button>
          ))}
        </div>

        <section className="flex flex-col gap-5">
          {list.map((c, i) => (
            <Carrier key={c.carrierId} c={c} rank={lens === "by-loan-cost" ? i + 1 : undefined} />
          ))}
        </section>

        {/* Why cards are rare. */}
        <section className={`${CARD} p-6`}>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-amber-300" aria-hidden />
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-amber-300">
              {CARD_ACCEPTANCE_EXPLAINER.headline}
            </h2>
          </div>
          <div className="mt-4 flex flex-col gap-3 text-[14px] leading-relaxed text-slate-300">
            {CARD_ACCEPTANCE_EXPLAINER.lines.map((l, i) => <p key={i}>{l}</p>)}
          </div>
          <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px]">
            {CARD_ACCEPTANCE_EXPLAINER.sources.map(s => (
              <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center gap-1 text-amber-300/80 hover:underline">
                {s.label} <ExternalLink className="h-3 w-3" aria-hidden />
              </a>
            ))}
          </p>
        </section>

        {/* Deliberate omissions. */}
        <section className={`${CARD} p-6`}>
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-amber-300">
            Carriers you would expect here, and why they are not
          </h2>
          <ul className="mt-4 flex flex-col gap-4">
            {NOTABLE_EXCLUSIONS.map(x => (
              <li key={x.name} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <h3 className="text-[15px] font-semibold text-white">{x.name}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-300">{x.reason}</p>
                <a href={x.source} target="_blank" rel="noopener noreferrer"
                   className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] text-amber-300/80 hover:underline">
                  source <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* What to read before choosing. */}
        <section className={`${CARD} p-6`}>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-300" aria-hidden />
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-amber-300">
              Read these before any policy is chosen
            </h2>
          </div>
          <ol className="mt-4 flex list-decimal flex-col gap-2 pl-5 text-[13.5px] leading-relaxed text-slate-300">
            {CARRIER_READ_PROTOCOL.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
          <div className="mt-5 border-t border-white/10 pt-4">
            <h3 className="text-[11px] uppercase tracking-[0.18em] text-slate-400">What a rating letter means</h3>
            <ul className="mt-2 flex flex-col gap-1.5 text-[13px] leading-relaxed text-slate-300">
              {RATING_SCALES.map(r => (
                <li key={r.agency}>
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-amber-200 hover:underline">{r.agency}</a>
                  <span className="text-slate-500"> — </span>{r.top}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-[13px] leading-relaxed text-slate-400">
          Russell Capital Systems receives no compensation, referral fee or other consideration from any carrier
          named on this page. Nothing here is a recommendation, an endorsement, or an insurance illustration —
          illustrations come from the carrier and only from the carrier. Caps, participation rates, multipliers and
          loan rates reprice continually; every figure carries the date it was read from the carrier's own published
          material, and anything past that date must be re-checked with the carrier directly. Anything that could not
          be read is shown as unverified rather than filled in.
        </p>
      </div>
    </AppShell>
  );
}

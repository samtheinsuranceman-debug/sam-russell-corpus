// ============================================================
// CREDIT CARDS — turning available credit into premium capacity.
// Ranked by approval likelihood for a given profile, every row carrying its
// source, and a sequencing verdict that answers the question a card list
// cannot: how many personal inquiries to spend, and when.
// ============================================================
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  CARD_SOURCES,
  NEVER_PRINTED,
  SOURCING_STATUS,
  freeToApplyNow,
  rankCards,
  sequencingAdvice,
  unrankable,
  type ApplicantProfile,
} from "@shared/creditCardSourcing";
import { AlertTriangle, ExternalLink, Info, ShieldCheck, TrendingUp } from "lucide-react";

const CARD = "rounded-2xl border border-emerald-400/20 bg-white/[0.04]";
const FIELD =
  "w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-400/40";

const UNDERWRITING_LABEL: Record<string, string> = {
  "business-cashflow": "EIN / cash flow",
  "ein-trade-credit": "EIN trade credit",
  "personal-fico": "Personal FICO",
  "personal-guarantee-business": "Business + personal guarantee",
};

const LIMIT_LABEL: Record<string, string> = {
  micro: "under $2k",
  small: "$2k-$10k",
  mid: "$10k-$50k",
  large: "$50k+",
  unknown: "unknown",
};

export default function CreditCards() {
  const [profile, setProfile] = useState<ApplicantProfile>({
    fico: 640,
    einCount: 3,
    oldestEntityYears: 12,
    recentHardInquiries: 1,
    approvalPending: true,
    recentDeclines: 1,
    annualRevenueUsd: 250000,
  });

  const ranked = useMemo(() => rankCards(profile), [profile]);
  const freeNow = useMemo(() => freeToApplyNow(profile), [profile]);
  const pending = useMemo(() => unrankable(profile), [profile]);
  const sequencing = useMemo(() => sequencingAdvice(profile), [profile]);

  const set = <K extends keyof ApplicantProfile>(k: K, v: ApplicantProfile[K]) =>
    setProfile((p) => ({ ...p, [k]: v }));

  return (
    <AppShell title="Credit Cards">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <header>
          <h1 className="text-2xl font-bold text-white">Credit Cards</h1>
          <p className="mt-1 text-sm text-slate-400">
            Ranked by lending potential — approval likelihood multiplied by limit size. Interest
            rate is recorded but carries no weight. Every row links to its source.
          </p>
        </header>

        {/* ── Sequencing verdict: the highest-value thing on the page ── */}
        <section
          className={`${CARD} border-l-4 p-4 ${
            sequencing.safeToApplyNow ? "border-l-emerald-400" : "border-l-amber-400"
          }`}
        >
          <div className="flex items-start gap-3">
            {sequencing.safeToApplyNow ? (
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
            ) : (
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
            )}
            <div className="space-y-2">
              <h2 className="font-semibold text-white">{sequencing.headline}</h2>
              <ul className="space-y-1.5 text-sm text-slate-300">
                {sequencing.reasoning.map((r) => (
                  <li key={r}>• {r}</li>
                ))}
              </ul>
              <div className="pt-1">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Order to apply
                </div>
                <ol className="mt-1 space-y-1 text-sm text-slate-300">
                  {sequencing.recommendedOrder.map((s, i) => (
                    <li key={s}>
                      <span className="font-semibold text-emerald-300">{i + 1}.</span> {s}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* ── Free to apply right now ── */}
        <section className={`${CARD} border-l-4 border-l-emerald-400 p-4`}>
          <h2 className="mb-1 font-semibold text-white">
            Applyable tonight with no personal pull ({freeNow.length})
          </h2>
          <p className="mb-3 text-xs text-slate-500">
            These underwrite on the EIN. No personal guarantee, no hard inquiry, no effect on a
            pending approval.
          </p>
          <div className="flex flex-wrap gap-2">
            {freeNow.map((s) => (
              <span
                key={s.id}
                className="rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-2 py-1 text-xs text-emerald-100"
              >
                {s.issuer} · {LIMIT_LABEL[s.limitBand]}
              </span>
            ))}
          </div>
        </section>

        {/* ── Profile ── */}
        <section className={`${CARD} p-4`}>
          <h2 className="mb-3 font-semibold text-white">Profile</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-xs text-slate-400">
              FICO
              <input
                type="number"
                className={`${FIELD} mt-1`}
                value={profile.fico}
                onChange={(e) => set("fico", Number(e.target.value))}
              />
            </label>
            <label className="text-xs text-slate-400">
              EINs available
              <input
                type="number"
                className={`${FIELD} mt-1`}
                value={profile.einCount}
                onChange={(e) => set("einCount", Number(e.target.value))}
              />
            </label>
            <label className="text-xs text-slate-400">
              Oldest entity (years)
              <input
                type="number"
                className={`${FIELD} mt-1`}
                value={profile.oldestEntityYears}
                onChange={(e) => set("oldestEntityYears", Number(e.target.value))}
              />
            </label>
            <label className="text-xs text-slate-400">
              Hard inquiries (30d)
              <input
                type="number"
                className={`${FIELD} mt-1`}
                value={profile.recentHardInquiries}
                onChange={(e) => set("recentHardInquiries", Number(e.target.value))}
              />
            </label>
            <label className="text-xs text-slate-400">
              Recent declines
              <input
                type="number"
                className={`${FIELD} mt-1`}
                value={profile.recentDeclines}
                onChange={(e) => set("recentDeclines", Number(e.target.value))}
              />
            </label>
            <label className="text-xs text-slate-400">
              Annual revenue
              <input
                type="number"
                className={`${FIELD} mt-1`}
                value={profile.annualRevenueUsd}
                onChange={(e) => set("annualRevenueUsd", Number(e.target.value))}
              />
            </label>
            <label className="flex items-end gap-2 pb-2 text-xs text-slate-400">
              <input
                type="checkbox"
                checked={profile.approvalPending}
                onChange={(e) => set("approvalPending", e.target.checked)}
              />
              Approval pending, not yet funded
            </label>
          </div>
        </section>

        {/* ── Ranked ── */}
        <section className={`${CARD} p-4`}>
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-white">
            <TrendingUp className="h-4 w-4 text-emerald-300" />
            Ranked by lending potential ({ranked.length})
          </h2>
          <div className="space-y-3">
            {ranked.map((s, i) => {
              const src = CARD_SOURCES.filter((c) => c.id === s.id)[0];
              return (
                <div key={s.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-semibold text-white">
                      <span className="mr-2 text-slate-500">#{i + 1}</span>
                      {s.issuer} — {s.product}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="rounded bg-emerald-400/15 px-2 py-0.5 text-emerald-200">
                        lending {s.lendingScore}
                      </span>
                      <span className="rounded bg-white/10 px-2 py-0.5 text-slate-300">
                        limit: {LIMIT_LABEL[s.limitBand]}
                      </span>
                      <span className="rounded bg-white/10 px-2 py-0.5 text-slate-300">
                        {UNDERWRITING_LABEL[src.underwriting]}
                      </span>
                      {s.costsAnInquiry ? (
                        <span className="rounded bg-amber-400/15 px-2 py-0.5 text-amber-200">
                          costs an inquiry
                        </span>
                      ) : (
                        <span className="rounded bg-emerald-400/15 px-2 py-0.5 text-emerald-200">
                          no personal pull
                        </span>
                      )}
                    </div>
                  </div>
                  <ul className="mt-2 space-y-1 text-xs text-slate-400">
                    {s.reasons.map((r) => (
                      <li key={r}>• {r}</li>
                    ))}
                  </ul>
                  {src.note ? <p className="mt-2 text-xs text-slate-500">{src.note}</p> : null}
                  <a
                    href={src.sourceUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-300 hover:underline"
                  >
                    Source <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Not rankable ── */}
        {pending.length > 0 && (
          <section className={`${CARD} p-4`}>
            <h2 className="mb-2 flex items-center gap-2 font-semibold text-white">
              <Info className="h-4 w-4 text-slate-400" />
              Not yet rankable ({pending.length})
            </h2>
            <p className="mb-3 text-xs text-slate-500">
              Issuers identified but whose terms have not been pulled. Listed rather than ranked,
              because ranking them would imply a comparison that was never made.
            </p>
            <ul className="space-y-2 text-sm">
              {pending.map((s) => (
                <li key={s.id} className="rounded-lg border border-white/10 bg-black/20 p-2">
                  <span className="font-medium text-slate-200">
                    {s.issuer} — {s.product}
                  </span>
                  <div className="text-xs text-slate-500">{s.blockedReason}</div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── Coverage ── */}
        <section className={`${CARD} p-4 text-sm text-slate-400`}>
          <h2 className="mb-2 font-semibold text-white">Coverage</h2>
          <p>
            <span className="text-slate-200">
              {SOURCING_STATUS.verified} of {SOURCING_STATUS.requested}
            </span>{" "}
            rows verified, researched {SOURCING_STATUS.researchedOn} by{" "}
            {SOURCING_STATUS.method}.
          </p>
          <p className="mt-2">{SOURCING_STATUS.gap}</p>
          <p className="mt-2 text-xs text-slate-500">
            <span className="font-semibold">Next pass:</span> {SOURCING_STATUS.nextPass}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            <span className="font-semibold">Excluded by request:</span>{" "}
            {SOURCING_STATUS.excludedByRequest}
          </p>
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-semibold text-slate-400">
              What this page will not claim
            </summary>
            <ul className="mt-2 space-y-1 text-xs text-slate-500">
              {NEVER_PRINTED.map((n) => (
                <li key={n}>• {n}</li>
              ))}
            </ul>
          </details>
        </section>
      </div>
    </AppShell>
  );
}

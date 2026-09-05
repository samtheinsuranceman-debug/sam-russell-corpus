// ============================================================
// HOME LEAD FACT-FINDER — the homepage "Tax & Savings Estimator" that
// doubles as a lead fact-finding form. Collects the household's financial
// picture + contact details behind an explicit consent line, sends it to
// leads.capture, and shows only the QUALITATIVE strategy teaser back
// (pillars, no dollar figures — the numbers stay in the advisor's file).
// Returning visitors (first-party cookie) are greeted by name.
// ============================================================
import { useState } from "react";
import { CheckCircle, ShieldCheck, ArrowRight, Calendar, AlertTriangle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import type { LiquidTaxability } from "@shared/leadTypes";

// Suitability / compliance disclaimer shown on the estimator in both the
// input and result states.
//
// COMPLIANCE SWITCH — flip DISCLAIMER_MODE to choose the wording:
//   "client-results" — owner's dictated wording (references "the best
//       outcomes we have produced for some of our clients"). This is a
//       past-performance claim; use only if the tax/compliance team can
//       substantiate it and it fits FINRA/state advertising rules.
//   "illustrative"   — the compliance-safe variant with no client-results
//       claim. Switch to this if the team prefers not to make that claim.
const DISCLAIMER_MODE: "client-results" | "illustrative" = "client-results";

const DISCLAIMERS = {
  "client-results":
    "These results are not guaranteed. Any figures or strategies shown represent the best outcomes we have " +
    "produced for some of our clients under certain conditions — they may or may not reflect the results you " +
    "would receive. Every result must be thoroughly examined by our tax professional team for suitability and " +
    "for compliance with applicable IRS statutes before anything is implemented. This estimator is general " +
    "education only and is not tax, legal, or investment advice.",
  illustrative:
    "These results are not guaranteed. Any figures or strategies shown are illustrative and based on stated " +
    "assumptions — they may or may not reflect the results you would receive. Every result must be thoroughly " +
    "examined by our tax professional team for suitability and for compliance with applicable IRS statutes " +
    "before anything is implemented. This estimator is general education only and is not tax, legal, or " +
    "investment advice.",
} as const;

const ESTIMATOR_DISCLAIMER = DISCLAIMERS[DISCLAIMER_MODE];

type NumKey =
  | "w2Income" | "estimatedTaxes" | "spouseIncome" | "spouseTaxes"
  | "studentDebt" | "studentDebtRate" | "homeEquity" | "mortgageBalance"
  | "mortgageRate" | "mortgageInterestOnlyMonthly" | "mortgageYearsRemaining"
  | "taxDeferredSelf" | "taxDeferredSpouse" | "liquidInvestments";

const NUM_FIELDS: Array<{ key: NumKey; label: string; hint?: string }> = [
  { key: "w2Income", label: "Your W-2 earnings" },
  { key: "estimatedTaxes", label: "Your estimated annual taxes" },
  { key: "spouseIncome", label: "Spouse income" },
  { key: "spouseTaxes", label: "Spouse estimated taxes" },
  { key: "studentDebt", label: "Student debt owed" },
  { key: "studentDebtRate", label: "Student loan interest rate (%)" },
  { key: "homeEquity", label: "Home equity" },
  { key: "mortgageBalance", label: "Mortgage balance (if known)" },
  { key: "mortgageRate", label: "Mortgage rate (%)" },
  { key: "mortgageInterestOnlyMonthly", label: "Interest-only payment / month" },
  { key: "mortgageYearsRemaining", label: "Years remaining on mortgage" },
  { key: "taxDeferredSelf", label: "Your tax-deferred (IRA/401k/403b/TSP)" },
  { key: "taxDeferredSpouse", label: "Spouse tax-deferred" },
  { key: "liquidInvestments", label: "Total liquid investments (brokerage, etc.)" },
];

export default function HomeLeadFactFinder() {
  const recognize = trpc.leads.recognize.useQuery(undefined, { staleTime: 60_000 });
  const capture = trpc.leads.capture.useMutation();

  const [nums, setNums] = useState<Partial<Record<NumKey, string>>>({});
  const [liquidTaxability, setLiquidTaxability] = useState<LiquidTaxability>("unknown");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bestTimeToContact, setBestTimeToContact] = useState("");
  const [goals, setGoals] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState("");
  const [copied, setCopied] = useState(false);

  const setNum = (k: NumKey, v: string) => setNums((prev) => ({ ...prev, [k]: v }));
  const parse = (v: string | undefined): number | undefined => {
    if (!v) return undefined;
    const n = Number(v.replace(/[$,%\s,]/g, ""));
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };

  const submit = async () => {
    setError("");
    if (!consent) { setError("Please check the consent box so we can prepare and store your estimate."); return; }
    if (!email && !phone) { setError("Add an email or phone so an advisor can send your evaluation."); return; }
    const factFinder: Record<string, unknown> = { liquidTaxability };
    for (const { key } of NUM_FIELDS) {
      const val = parse(nums[key]);
      if (val !== undefined) factFinder[key] = val;
    }
    if (goals.trim()) factFinder.goals = goals.trim();
    setSummary([
      `Name: ${[firstName, lastName].filter(Boolean).join(" ") || "—"}`,
      `Email: ${email || "—"}`, `Phone: ${phone || "—"}`, `Best time: ${bestTimeToContact || "—"}`, "",
      "FINANCIAL PICTURE",
      ...NUM_FIELDS.map(({ key, label }) => `${label}: ${nums[key] || "—"}`),
      `Liquid taxability: ${liquidTaxability}`, "",
      `Goals: ${goals.trim() || "—"}`,
    ].join("\n"));
    try {
      await capture.mutateAsync({
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        email: email || undefined,
        phone: phone || undefined,
        bestTimeToContact: bestTimeToContact || undefined,
        consent,
        factFinder: factFinder as never,
      });
    } catch {
      setError("Something went wrong saving your estimate. Please try again or book a call below.");
    }
  };

  const teaser = capture.data?.teaser ?? null;
  const greeting = recognize.data?.known && recognize.data.firstName ? recognize.data.firstName : null;

  return (
    <section id="planning-estimator" aria-label="Tax and savings estimator" className="relative overflow-hidden border-t border-emerald-300/10 bg-[#050b0a] py-24">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[.07] [background-image:linear-gradient(rgba(52,211,153,.55)_1px,transparent_1px),linear-gradient(90deg,rgba(52,211,153,.55)_1px,transparent_1px)] [background-size:46px_46px]" />
      <div className="container relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          {greeting && (
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/35 bg-emerald-300/10 px-4 py-1.5 text-sm font-semibold text-emerald-300">
              <CheckCircle size={15} /> Welcome back, {greeting}.
            </p>
          )}
          <h2 className="text-[clamp(1.9rem,4.6vw,3.4rem)] font-extrabold leading-tight text-white [text-shadow:_0_0_26px_rgba(16,185,129,.4)]" style={{ fontFamily: "DM Sans, sans-serif" }}>
            Your <span className="text-emerald-300 [text-shadow:_0_0_26px_rgba(52,211,153,.85)]">Tax &amp; Savings Estimate</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/75">
            Share your picture and we'll show you the shape of a coordinated plan — then an advisor prepares the specifics for your evaluation.
          </p>
        </div>

        {!teaser ? (
          <div className="mx-auto mt-10 max-w-3xl rounded-[1.6rem] border border-emerald-200/35 bg-black/55 p-5 shadow-[0_28px_90px_rgba(0,0,0,.5)] backdrop-blur-xl sm:p-7">
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" aria-label="First name" className="rounded-lg border border-emerald-200/20 bg-[#00110d]/70 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-emerald-300" />
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" aria-label="Last name" className="rounded-lg border border-emerald-200/20 bg-[#00110d]/70 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-emerald-300" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" aria-label="Email" className="rounded-lg border border-emerald-200/20 bg-[#00110d]/70 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-emerald-300" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="Phone" aria-label="Phone" className="rounded-lg border border-emerald-200/20 bg-[#00110d]/70 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-emerald-300" />
              <input value={bestTimeToContact} onChange={(e) => setBestTimeToContact(e.target.value)} placeholder="Best time to reach you / book an appointment" aria-label="Best time to contact" className="rounded-lg border border-emerald-200/20 bg-[#00110d]/70 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-emerald-300 sm:col-span-2" />
            </div>

            <p className="mt-6 mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-300">Your financial picture</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {NUM_FIELDS.map(({ key, label }) => (
                <label key={key} className="text-xs text-white/60">
                  {label}
                  <input
                    inputMode="decimal"
                    value={nums[key] ?? ""}
                    onChange={(e) => setNum(key, e.target.value)}
                    aria-label={label}
                    className="mt-1 w-full rounded-lg border border-emerald-200/20 bg-[#00110d]/70 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300"
                  />
                </label>
              ))}
              <label className="text-xs text-white/60">
                Are those liquid investments taxable?
                <select value={liquidTaxability} onChange={(e) => setLiquidTaxability(e.target.value as LiquidTaxability)} aria-label="Liquid investment taxability" className="mt-1 w-full rounded-lg border border-emerald-200/20 bg-[#00110d]/70 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300">
                  <option value="unknown" className="bg-[#00110d]">Not sure</option>
                  <option value="taxable" className="bg-[#00110d]">Taxable</option>
                  <option value="nontaxable" className="bg-[#00110d]">Non-taxable</option>
                  <option value="mixed" className="bg-[#00110d]">A mix of both</option>
                </select>
              </label>
            </div>

            <label className="mt-3 block text-xs text-white/60">
              Anything else about your goals?
              <textarea value={goals} onChange={(e) => setGoals(e.target.value)} rows={2} aria-label="Goals" className="mt-1 w-full rounded-lg border border-emerald-200/20 bg-[#00110d]/70 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300" />
            </label>

            <label className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-200/20 bg-black/30 p-4 text-xs leading-relaxed text-white/70">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-400" aria-label="Consent to be contacted and to store this information" />
              <span>I agree that Russell Capital Systems may store this information and contact me about a planning evaluation. This is general education, not tax, legal, or investment advice, and no figures shown are guarantees.</span>
            </label>

            {error && <p role="alert" className="mt-3 text-sm text-red-400">{error}</p>}

            <button type="button" onClick={() => void submit()} disabled={capture.isPending} className="rc-btn rc-btn-primary mt-4 w-full justify-center rounded-xl py-3.5 text-base disabled:opacity-50">
              {capture.isPending ? "Preparing your estimate…" : <>Show me the shape of my plan <ArrowRight size={16} /></>}
            </button>
          </div>
        ) : (
          <div className="mx-auto mt-10 max-w-3xl rounded-[1.6rem] border border-emerald-300/35 bg-black/55 p-6 shadow-[0_28px_90px_rgba(0,0,0,.5)] backdrop-blur-xl sm:p-8">
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-emerald-300"><ShieldCheck size={18} /> Your coordinated strategy</p>
            <h3 className="mt-3 text-[clamp(1.3rem,3vw,2rem)] font-extrabold leading-snug text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>{teaser.headline}</h3>
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {teaser.pillars.map((p) => (
                <li key={p} className="flex items-center gap-2 rounded-lg border border-emerald-200/15 bg-[#00110d]/60 px-3 py-2.5 text-sm text-white/85"><CheckCircle size={15} className="shrink-0 text-emerald-300" /> {p}</li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-white/60">{teaser.note}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a href="#consultation" className="rc-btn rc-btn-primary inline-flex justify-center rounded-xl px-6 py-3.5 text-base"><Calendar size={16} /> Book my thorough evaluation</a>
              <button
                type="button"
                onClick={() => { navigator.clipboard?.writeText(summary).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); }).catch(() => {}); }}
                className="rc-btn inline-flex justify-center rounded-xl border border-emerald-300/45 bg-black/30 px-6 py-3.5 text-base text-white hover:bg-emerald-300/10"
              >
                {copied ? "Copied ✓" : "Copy my summary"}
              </button>
            </div>
          </div>
        )}

        <div className="mx-auto mt-6 flex max-w-3xl items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-400/[.06] px-4 py-3.5">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-300" />
          <p className="text-[11px] leading-relaxed text-white/60">
            <span className="font-semibold text-amber-200">Important:</span> {ESTIMATOR_DISCLAIMER} The specific
            dollar amounts, percentages, and structure are prepared for your licensed advisor and shared in your
            personal evaluation — not shown here.
          </p>
        </div>
      </div>
    </section>
  );
}

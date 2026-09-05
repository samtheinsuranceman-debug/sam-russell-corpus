// ============================================================
// HOME TRUST SECTIONS — "How we work" (Review → Coordinate → Implement →
// Monitor), "Who we serve", and a compliance-safe FAQ. Mirrors the
// published live homepage so the deployed site and the live page match.
// ============================================================
import { ArrowRight, ScanSearch, Users, Settings2, ShieldCheck } from "lucide-react";

const STEPS = [
  { n: 1, Icon: ScanSearch, title: "Review", body: "We map your full picture — income, practice, debt, protection, retirement, and legacy — before recommending anything." },
  { n: 2, Icon: Users, title: "Coordinate", body: "Your advisor, tax professional, and attorney align on one documented plan, with responsibilities assigned." },
  { n: 3, Icon: Settings2, title: "Implement", body: "Strategies are sequenced deliberately, each checked for suitability and IRS compliance before anything moves." },
  { n: 4, Icon: ShieldCheck, title: "Monitor", body: "Reviewed on a cadence as tax law, markets, and your life change — so the plan stays current, not static." },
];

const SERVE = [
  { t: "Physicians", d: "Employed and private practice" },
  { t: "Psychiatrists", d: "Practice owners and group partners" },
  { t: "Surgeons", d: "High-income, high-liability careers" },
  { t: "Practice Owners", d: "Entity, succession, and exit planning" },
];

export const FAQ: Array<{ q: string; a: string }> = [
  { q: "Who is this for?", a: "Physicians, psychiatrists, surgeons, and medical practice owners — anyone whose income, debt, practice, and tax picture is too complex for a one-size-fits-all plan." },
  { q: "Is the estimate a quote or a guarantee?", a: "Neither. It's general education showing the shape of a coordinated plan. Nothing is implemented until our tax professional team has examined it for suitability and compliance with applicable IRS statutes — and your own results may differ." },
  { q: "Why don't you show me the numbers here?", a: "Because the specific dollar amounts, percentages, and structure depend on your exact situation. They're prepared for your licensed advisor and shared with you in your personal evaluation, not on a public page." },
  { q: "What happens after I submit the estimate?", a: "An advisor reviews what you shared, prepares the specifics, and reaches out — by email or phone, at the time you gave — to schedule a thorough evaluation. There's no obligation." },
  { q: "What does \"divorce-proof\" mean?", a: "It's the general idea of positioning assets inside structures designed to be more resilient to divorce, lawsuits, or creditors. How much protection applies depends on your state and circumstances, and is confirmed by your professionals." },
  { q: "What are the patent-pending engines?", a: "Fifteen core planning technologies with patent applications in process — plus 45 more underway — built to coordinate strategies that most tools treat as separate islands. You won't find them offered anywhere else." },
  { q: "Is my information safe?", a: "Nothing is shared beyond what you enter, and you can ask for it to be removed at any time. Your details go only to the advisory team preparing your evaluation." },
];

const GRID = "pointer-events-none absolute inset-0 opacity-[.07] [background-image:linear-gradient(rgba(52,211,153,.55)_1px,transparent_1px),linear-gradient(90deg,rgba(52,211,153,.55)_1px,transparent_1px)] [background-size:46px_46px]";

export function HomeHowWeWork() {
  return (
    <section id="how-we-work" aria-label="How we work" className="relative overflow-hidden border-t border-emerald-300/10 bg-[#050b0a] py-24">
      <div aria-hidden="true" className={GRID} />
      <div className="container relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center rounded-full border border-emerald-300/35 bg-emerald-300/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[.2em] text-emerald-300">How we work</p>
          <h2 className="mt-5 text-[clamp(2rem,5vw,3.8rem)] font-extrabold leading-tight text-white [text-shadow:_0_0_26px_rgba(16,185,129,.4)]" style={{ fontFamily: "DM Sans, sans-serif" }}>
            One documented process. <span className="text-emerald-300 [text-shadow:_0_0_26px_rgba(52,211,153,.85)]">Every professional on the same page.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-white/75">Your advisor, tax professional, and attorney work from a single plan — so strategies are sequenced deliberately, never bolted on one at a time.</p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ n, Icon, title, body }, i) => (
            <div key={title} className="relative rounded-2xl border border-emerald-200/15 bg-black/40 p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-300/35 text-emerald-300 font-extrabold tabular-nums">{n}</span>
                <Icon size={20} className="text-emerald-300/70" />
              </div>
              <p className="mt-4 text-lg font-bold text-white">{title}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/65">{body}</p>
              {i < STEPS.length - 1 && <ArrowRight size={16} className="absolute -right-3 top-9 hidden text-emerald-300/70 lg:block" />}
            </div>
          ))}
        </div>

        <div className="mx-auto mt-20 max-w-3xl text-center">
          <p className="inline-flex items-center rounded-full border border-emerald-300/35 bg-emerald-300/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[.2em] text-emerald-300">Who we serve</p>
          <h2 className="mt-5 text-[clamp(1.7rem,4vw,3rem)] font-extrabold leading-tight text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>Built for the finances of medicine</h2>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SERVE.map(({ t, d }) => (
            <div key={t} className="rounded-2xl border border-emerald-300/25 bg-emerald-300/[.06] p-5 text-center">
              <p className="font-semibold text-white">{t}</p>
              <p className="mt-1 text-sm text-white/60">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeFaq() {
  return (
    <section id="faq" aria-label="Frequently asked questions" className="relative overflow-hidden border-t border-emerald-300/10 bg-[#050b0a] py-20">
      <div aria-hidden="true" className={GRID} />
      <div className="container relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center rounded-full border border-emerald-300/35 bg-emerald-300/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[.2em] text-emerald-300">Questions physicians ask first</p>
          <h2 className="mt-5 text-[clamp(1.7rem,4vw,3rem)] font-extrabold leading-tight text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>Straight answers</h2>
        </div>
        <div className="mx-auto mt-10 grid max-w-3xl gap-3">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group rounded-2xl border border-emerald-200/20 bg-black/45 px-5 backdrop-blur-xl">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold text-white [&::-webkit-details-marker]:hidden">
                {q}
                <span aria-hidden="true" className="shrink-0 text-xl font-normal text-emerald-300 group-open:hidden">+</span>
                <span aria-hidden="true" className="hidden shrink-0 text-xl font-normal text-emerald-300 group-open:inline">−</span>
              </summary>
              <p className="pb-4 text-[15px] leading-relaxed text-white/72">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MobileStickyCta({ calendlyUrl }: { calendlyUrl: string }) {
  return (
    <>
      <div aria-hidden="true" className="h-[4.6rem] sm:hidden" />
      <div aria-label="Quick actions" className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-emerald-300/30 bg-[#030a09]/92 px-3 py-2.5 backdrop-blur-xl sm:hidden [padding-bottom:calc(.65rem+env(safe-area-inset-bottom))]">
        <a href="#planning-estimator" className="rc-btn flex-1 justify-center rounded-xl border border-emerald-300/45 bg-black/30 py-3 text-sm text-white">Get my estimate</a>
        <a href={calendlyUrl} target="_blank" rel="noopener noreferrer" className="rc-btn rc-btn-primary flex-1 justify-center rounded-xl py-3 text-sm">Book a Review</a>
      </div>
    </>
  );
}

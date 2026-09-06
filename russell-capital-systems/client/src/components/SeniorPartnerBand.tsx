// ============================================================
// SENIOR PARTNER CREDIBILITY BAND — multi-decade client-retention proof.
// Placed early in the homepage flow (after the AI concierge, before the
// lead estimator) so trust lands before we ask for financial details.
// ============================================================
import { ShieldCheck, Stethoscope, Users, TrendingUp } from "lucide-react";

export default function SeniorPartnerBand() {
  return (
    <section id="proof" aria-label="Experience and client retention" className="relative isolate flex min-h-[100svh] items-center overflow-hidden bg-[#03090a] py-24">
      {/* The second neon sign, full and crisp — no blur */}
      <picture><source media="(max-width: 767px)" srcSet="/rcs-neon-b-tall.webp" /><img src="/rcs-neon-b.webp" alt="Neon sign reading Financial & Tax Relief and Recovery for Physicians, Psychiatrists, & Surgeons over a green city at night" className="absolute inset-0 z-0 h-full w-full object-cover object-center" loading="lazy" decoding="async" /></picture>
      <div aria-hidden="true" className="absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_50%_55%,rgba(3,9,10,.72)_0%,rgba(3,9,10,.35)_45%,rgba(3,9,10,.1)_75%)]" />
      <div className="container relative z-10">
        <div className="group relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-emerald-300/30 bg-[linear-gradient(150deg,rgba(6,24,19,.94),rgba(3,10,9,.7))] p-8 shadow-[0_34px_90px_rgba(0,0,0,.55)] backdrop-blur-2xl sm:p-12">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[3px] bg-[linear-gradient(90deg,transparent,rgba(52,211,153,.95),transparent)]" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,.22),transparent_70%)]" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,.14),transparent_70%)]" />

          <div className="relative grid gap-10 md:grid-cols-[auto_1fr] md:items-center">
            {/* Stat medallion */}
            <div className="relative mx-auto flex h-44 w-44 shrink-0 items-center justify-center">
              <div aria-hidden="true" className="absolute inset-0 rounded-full bg-[conic-gradient(from_210deg,rgba(52,211,153,.9),rgba(16,185,129,.15)_60%,rgba(52,211,153,.9))] opacity-80 blur-[2px]" />
              <div aria-hidden="true" className="absolute inset-[3px] rounded-full bg-[radial-gradient(circle_at_50%_35%,rgba(6,26,20,.95),#03100c)]" />
              <div className="relative flex flex-col items-center">
                <span className="bg-[linear-gradient(92deg,#ffffff,#bbf7d0_55%,#34d399)] bg-clip-text text-[3.6rem] font-black leading-none tracking-tight text-transparent [text-shadow:_0_0_34px_rgba(52,211,153,.4)]" style={{ fontFamily: "DM Sans, sans-serif" }}>60%</span>
                <span className="mt-1 text-[10px] font-bold uppercase tracking-[.2em] text-emerald-300/85">20+ years</span>
              </div>
            </div>

            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-emerald-300/35 bg-emerald-300/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[.2em] text-emerald-300"><ShieldCheck size={13} /> Experience you can lean on</p>
              <h2 className="mt-4 text-[clamp(1.9rem,4.2vw,3rem)] font-black leading-[1.08] tracking-[-.015em]" style={{ fontFamily: "DM Sans, sans-serif" }}>
                <span className="bg-[linear-gradient(95deg,#ffffff,#d1fae5_45%,#34d399)] bg-clip-text text-transparent [text-shadow:_0_0_30px_rgba(52,211,153,.25)]">Clients who stay for decades.</span>
              </h2>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/80">
                Our senior business partner — <span className="font-semibold text-white">69 years old</span>, with a long career working in <span className="font-semibold text-white">medical malpractice</span> — has kept more than <span className="font-semibold text-emerald-300">60% of their clients on the books for 20 years or longer</span>. That kind of loyalty is earned, not bought.
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                {[
                  { Icon: Stethoscope, label: "Medical-malpractice specialty" },
                  { Icon: Users, label: "Senior partnership · 69" },
                  { Icon: TrendingUp, label: "Two-decade retention" },
                ].map(({ Icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-2 rounded-full border border-emerald-200/20 bg-black/40 px-3.5 py-1.5 text-xs font-medium text-white/75">
                    <Icon size={14} className="text-emerald-300" /> {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

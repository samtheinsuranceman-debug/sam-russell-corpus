// ============================================================
// PROPRIETARY TECHNOLOGY SHOWCASE — the engines behind the Russell Capital
// Systems platform, drawn from the core patent workbook (PAT-001…015).
//
// Descriptions are BENEFIT-ORIENTED only: what each engine means for the
// client and their family, now and in the future. We intentionally do NOT
// explain how the engines work.
//
// STATUS: 15 core patent applications are in process (patent-pending), plus
// 45 more unique applications in process — per the owner, accurate and true.
// Do NOT claim a patent has been GRANTED (issued) until an issue number
// exists; "patent-pending" / "in process" are correct for filed applications.
// ============================================================
import {
  Layers, Waves, Home, Dna, ShieldCheck, Repeat2, History, Dice5, Boxes,
  Landmark, Radar, Brain, Award, Network,
} from "lucide-react";

const TECH_STATUS_LABEL = "Patent-pending · 15 patents in process";

export type Technology = {
  ref: string; // internal engine index
  name: string;
  icon: typeof Layers;
  benefit: string; // what it means for you and your family — now and in the future
};

// Ordered to build credibility and confidence: the most personal, high-impact
// wins first (keep more, own your home, protect the family), then
// personalization, then the confidence/validation and quality engines.
// The AI advisor-coaching engine is intentionally omitted from display.
export const TECHNOLOGIES: Technology[] = [
  {
    ref: "05", name: "Optimized Tax Waterfall Engine", icon: Waves,
    benefit: "Keeps more of your money in your pocket through retirement by drawing your income in the smartest possible order — so your family keeps what you worked a lifetime to build instead of overpaying the IRS.",
  },
  {
    ref: "09", name: "Mortgage Killer™", icon: Home,
    benefit: "Puts you on a path to own your home free and clear years — sometimes decades — sooner, freeing cash flow for your family today and leaving a paid-off legacy tomorrow.",
  },
  {
    ref: "12", name: "Zero-Cost Roth Conversion Engine", icon: Boxes,
    benefit: "Helps move your savings toward tax-free status without the usual painful tax bill — so more of your nest egg grows for you and can pass to your children untaxed.",
  },
  {
    ref: "02", name: "Equity Arbitrage Engine", icon: Repeat2,
    benefit: "Turns the equity sitting idle in your home into a working asset that quietly builds wealth for your family — instead of just sitting in the walls.",
  },
  {
    ref: "14", name: "FIA Collateral Optimizer", icon: Landmark,
    benefit: "Gives you dependable retirement income while keeping access to your capital — so you can live confidently now and still reach your funds if life changes.",
  },
  {
    ref: "06", name: "Divorce-Proof Asset Shield", icon: ShieldCheck,
    benefit: "Shows you how to protect what you've built so a divorce, lawsuit, or creditor can't take it — safeguarding your family's security for good.",
  },
  {
    ref: "04", name: "Wealth Genome™ Profile", icon: Dna,
    benefit: "Builds your plan around your exact life — your income, your family, your goals — so every recommendation fits you, never a generic template.",
  },
  {
    ref: "07", name: "Retirement Risk Radar", icon: Radar,
    benefit: "Spots every threat to your retirement — not just the market, but healthcare, inflation, and a long life — so nothing blindsides your family.",
  },
  {
    ref: "13", name: "10,000-Scenario Stress Test", icon: Dice5,
    benefit: "Tests your plan against ten thousand possible futures, so you can retire knowing it holds up even when markets don't — real peace of mind for the whole family.",
  },
  {
    ref: "10", name: "Time Machine Dual-View", icon: History,
    benefit: "Lets you see how a strategy would have actually performed through real market history — so your family's decisions rest on evidence, not just promises.",
  },
  {
    ref: "08", name: "Behavioral Safeguard", icon: Brain,
    benefit: "Quietly protects you from the costly money mistakes everyone's brain is wired to make — keeping more of your family's wealth intact over a lifetime.",
  },
  {
    ref: "01", name: "Cascading Calculator Core", icon: Layers,
    benefit: "Shows your entire financial picture moving together, so you instantly see how one decision touches your taxes, retirement, and legacy — clarity behind every choice.",
  },
  {
    ref: "11", name: "The Russell Number™", icon: Award,
    benefit: "Means your advisor is held to a measurable, transparent quality standard — so your family is guided by someone proven, not simply licensed.",
  },
  {
    ref: "15", name: "Advisor Practice Platform", icon: Network,
    benefit: "Means a disciplined, well-run practice is working behind the scenes on your plan — consistent follow-through you and your family can count on for years.",
  },
];

export default function ProprietaryTech() {
  return (
    <section
      id="technology"
      aria-label="Patent-pending technology behind Russell Capital Systems"
      className="relative overflow-hidden border-t border-emerald-300/10 bg-[#050b0a] py-28"
    >
      <img src="/rcs-bg-23.webp" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover object-center blur-[20px] brightness-[.24]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#050b0a_0%,rgba(5,11,10,.55)_45%,#050b0a_100%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[.08] [background-image:linear-gradient(rgba(52,211,153,.55)_1px,transparent_1px),linear-gradient(90deg,rgba(52,211,153,.55)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="container relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-300/35 bg-emerald-300/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[.2em] text-emerald-300">
            {TECH_STATUS_LABEL}
          </p>
          <h2 className="mt-5 text-[clamp(2rem,5vw,3.8rem)] font-extrabold leading-tight text-white [text-shadow:_0_0_26px_rgba(16,185,129,.4)]" style={{ fontFamily: "DM Sans, sans-serif" }}>
            Engines that work for <span className="text-emerald-300 [text-shadow:_0_0_26px_rgba(52,211,153,.85)]">you and your family</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-white/75">
            These are purpose-built engines behind your plan — with <span className="font-semibold text-emerald-300">15 patents in process</span> — and
            you <span className="font-semibold text-emerald-300">won't find them anywhere else</span>. Here's what each one means for you, now and for the years ahead.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {TECHNOLOGIES.map(({ ref, name, icon: Icon, benefit }) => (
            <div
              key={ref}
              className="group relative overflow-hidden rounded-2xl border border-emerald-300/20 bg-[linear-gradient(158deg,rgba(6,22,18,.92),rgba(3,10,9,.72))] p-6 shadow-[0_18px_50px_rgba(0,0,0,.45)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-300/60 hover:shadow-[0_28px_72px_rgba(16,185,129,.22)]"
            >
              {/* Top accent bar — glows on hover */}
              <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[3px] bg-[linear-gradient(90deg,transparent,rgba(52,211,153,.95),transparent)] opacity-50 transition-opacity duration-300 group-hover:opacity-100" />
              {/* Soft corner glow */}
              <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,.22),transparent_70%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative flex items-center justify-between">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-300/40 bg-[linear-gradient(135deg,rgba(16,185,129,.30),rgba(16,185,129,.05))] text-emerald-200 shadow-[inset_0_0_18px_rgba(52,211,153,.28)] transition-transform duration-300 group-hover:scale-105"><Icon size={22} strokeWidth={1.6} /></span>
                <span className="rounded-full border border-emerald-300/30 bg-emerald-300/[.06] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.16em] text-emerald-300/80">Only at RCS</span>
              </div>

              <h3
                className="relative mt-5 text-[1.4rem] font-black leading-[1.12] tracking-[-.015em] bg-[linear-gradient(95deg,#ffffff_0%,#bbf7d0_50%,#34d399_100%)] bg-clip-text text-transparent [text-shadow:_0_0_34px_rgba(52,211,153,.22)]"
                style={{ fontFamily: "DM Sans, sans-serif" }}
              >
                {name}
              </h3>
              <div aria-hidden="true" className="mt-3 h-[2px] w-16 rounded bg-[linear-gradient(90deg,#34d399,rgba(52,211,153,0))]" />

              <p className="relative mt-4 text-[15px] leading-relaxed text-white/85">
                <span className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-[.18em] text-emerald-300">What it means for you</span>
                {benefit}
              </p>
            </div>
          ))}
        </div>

        {/* 45 more in process — stay tuned */}
        <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-emerald-300/30 bg-emerald-300/[.06] p-6 text-center backdrop-blur-xl">
          <p className="text-[clamp(1.2rem,3vw,1.9rem)] font-extrabold text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>
            And we're just getting started.
          </p>
          <p className="mx-auto mt-2 max-w-2xl text-white/75">
            Beyond these, <span className="font-semibold text-emerald-300">45 more unique patent-pending technologies</span> are in process —
            built to keep giving you and your family an edge no one else can offer. <span className="font-semibold text-emerald-300">Stay tuned.</span>
          </p>
        </div>

        <p className="mx-auto mt-8 max-w-3xl text-center text-[11px] leading-relaxed text-white/45">
          Patent-pending methods developed by Russell Capital Systems — 15 patent applications in process, with 45 more
          underway — described here at a high level. Not tax, legal, or investment advice; results are not guaranteed and
          are reviewed by our tax professional team for suitability and IRS compliance before implementation.
        </p>
      </div>
    </section>
  );
}

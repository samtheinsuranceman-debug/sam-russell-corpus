// ============================================================
// PROPRIETARY TECHNOLOGY SHOWCASE — fills the long homepage scroll with
// the engines behind the Russell Capital Systems platform. Drawn from the
// core platform engines (PAT-001…015 in the internal patent workbook),
// described at the concept level only — no secret formulas or figures.
//
// STATUS: 15 patent applications are in process for the core platform
// engines — "patent-pending" is accurate per the owner. Do not claim a patent
// has been GRANTED (issued) until an issue number exists; "patent-pending" and
// "in process" are correct for filed-and-pending applications.
// ============================================================
import {
  Layers, Waves, Home, Dna, ShieldCheck, Repeat2, History, Dice5, Boxes, Landmark,
} from "lucide-react";

const TECH_STATUS_LABEL = "Patent-pending · 15 patents in process";

export type Technology = {
  ref: string; // internal engine index
  name: string;
  icon: typeof Layers;
  how: string; // plain-language "how it works"
  why: string; // "why it's different / only found here"
};

export const TECHNOLOGIES: Technology[] = [
  {
    ref: "05", name: "Optimized Tax Waterfall Engine", icon: Waves,
    how: "Models every retirement income bucket — Roth, IRA, Social Security, pension, rental, policy loans — and finds the order to draw them that leaves the least tax over your whole retirement.",
    why: "Most tools optimize two or three sources. Ours coordinates seven-plus at once, so it finds savings that only appear when the sources are sequenced together.",
  },
  {
    ref: "09", name: "Mortgage Killer™", icon: Home,
    how: "Turns idle home equity into a growth engine, uses that growth to retire the mortgage years early, then recycles the freed equity into the next property — cycle after cycle.",
    why: "Real-estate and insurance tactics exist separately; nobody else runs them as one automated recycling loop that accelerates with every cycle.",
  },
  {
    ref: "02", name: "Equity Arbitrage Engine", icon: Repeat2,
    how: "Finds the sweet spot for borrowing against your home at a low cost and positioning it where it can grow faster — timing draws and premiums across decades.",
    why: "Advisors attempt this by hand in spreadsheets; our engine weighs thousands of variables to surface windows a person can't calculate manually.",
  },
  {
    ref: "01", name: "Cascading Calculator Core", icon: Layers,
    how: "Snaps 15+ financial calculators onto one base so changing a single number ripples through every connected calculator instantly and in the right order.",
    why: "Legacy platforms treat each calculator as an island. Ours reveals cross-calculator insight — like how a mortgage choice moves your future tax bracket.",
  },
  {
    ref: "04", name: "Wealth Genome™ Profile", icon: Dna,
    how: "Reads 20+ signals about your money life and maps you to the strategy set that fits your exact situation — not a generic risk bucket.",
    why: "Standard questionnaires use 5–10 questions; ours weighs 20+ interacting factors, so people who look similar on the surface get very different, better-fit plans.",
  },
  {
    ref: "06", name: "Divorce-Proof Asset Shield", icon: ShieldCheck,
    how: "Shows which assets sit inside protected vehicles versus exposed accounts, applying the protection rules for your state across multiple what-if scenarios.",
    why: "No mainstream planning tool models asset protection this way across all 50 states with multi-scenario modeling.",
  },
  {
    ref: "12", name: "Zero-Cost Roth Conversion Engine", icon: Boxes,
    how: "Pairs a Roth conversion with offsetting deductions so the tax the conversion creates can be balanced out — moving money toward tax-free status thoughtfully.",
    why: "Both pieces are known individually; combining them so they cancel is a coordination almost no one models automatically.",
  },
  {
    ref: "10", name: "Time Machine Dual-View", icon: History,
    how: "Puts the required forward projection side-by-side with a look-back at how the same strategy would have behaved through real historical markets.",
    why: "Seeing real history next to the projection builds trust no single illustration can — evidence beside estimate.",
  },
  {
    ref: "13", name: "10,000-Scenario Stress Test", icon: Dice5,
    how: "Runs your plan through ten thousand different market futures — crashes, booms, and everything between — to show the range of outcomes, not one rosy line.",
    why: "It models the protective floor and the growth cap correctly, which ordinary simulations get wrong.",
  },
  {
    ref: "14", name: "FIA Collateral Optimizer", icon: Landmark,
    how: "Splits a fixed indexed annuity into a piece that generates income and a piece you can borrow against, coordinating the two with tax-aware debt paydown.",
    why: "The specific split-and-lend architecture, tuned to real carrier products, is a combination you won't find in off-the-shelf software.",
  },
];

export default function ProprietaryTech() {
  return (
    <section
      id="technology"
      aria-label="Proprietary technology behind Russell Capital Systems"
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
            The <span className="text-emerald-300 [text-shadow:_0_0_26px_rgba(52,211,153,.85)]">engines</span> behind your plan
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-white/75">
            Coordinated planning runs on purpose-built engines you won't find in off-the-shelf software —
            with <span className="font-semibold text-emerald-300">15 patents in process</span>. Here's a
            plain-language look at ten of them; the specifics are worked through with an advisor.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {TECHNOLOGIES.map(({ ref, name, icon: Icon, how, why }) => (
            <div key={ref} className="group relative rounded-2xl border border-emerald-200/20 bg-black/55 p-6 backdrop-blur-xl transition hover:border-emerald-300/45 hover:bg-black/65">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-300/35 bg-emerald-300/10 text-emerald-300"><Icon size={20} /></span>
                <span className="text-[10px] font-semibold uppercase tracking-[.18em] text-emerald-300/70">Engine {ref}</span>
              </div>
              <h3 className="mt-4 text-lg font-bold leading-snug text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>{name}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/75"><span className="font-semibold text-emerald-200">How it works — </span>{how}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/60"><span className="font-semibold text-emerald-200">Why it's only here — </span>{why}</p>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-3xl text-center text-[11px] leading-relaxed text-white/45">
          Patent-pending methods developed by Russell Capital Systems — 15 patent applications in process —
          described here at a high level for education. Not tax, legal, or investment advice; results are not
          guaranteed and are reviewed by our tax professional team for suitability and IRS compliance before
          implementation.
        </p>
      </div>
    </section>
  );
}

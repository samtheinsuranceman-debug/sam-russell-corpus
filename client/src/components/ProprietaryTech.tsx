// ============================================================
// THE ENGINES — 14 patent-pending planning technologies, in the order
// they build on one another, each explained in five to six sentences.
// Drawn from the core patent workbook (PAT-001…015; the AI advisor-
// coaching engine is intentionally omitted from display).
//
// STATUS: 15 core patent applications are in process (patent-pending),
// plus 45 more in process — per the owner. Do NOT claim a patent has been
// GRANTED until an issue number exists.
// ============================================================
import {
  Layers, Dna, Waves, Boxes, Repeat2, Home, Landmark, ShieldCheck, Radar, Dice5, History, Brain, Award, Network,
} from "lucide-react";

const TECH_STATUS_LABEL = "Patent-pending · 15 patents in process";

export type Technology = {
  ref: string;
  name: string;
  icon: typeof Layers;
  why: string; // the one-line reason this engine matters, in sequence
  body: string; // five sentences — what it means for you and your family
  punch: string; // the closing sentence, set in bold
};

export const TECHNOLOGIES: Technology[] = [
  { ref: "01", name: "Cascading Calculator Core", icon: Layers, why: "The foundation",
    body: "Most financial software treats your mortgage, your taxes, your retirement, and your insurance as separate islands — you change one and nothing else notices. Our core snaps every calculator we own onto a single base, so when one number in your life changes, everything connected to it updates at once, in the right order. That's how we can show you, in one view, that a mortgage decision quietly moves your future tax bracket, or that a practice choice reshapes your retirement income. You stop guessing at how the pieces interact, because the system shows you. It's the foundation every other engine below stands on — and it's the reason a plan from us behaves like one machine instead of a stack of spreadsheets.",
    punch: "No off-the-shelf tool does this. It's ours." },
  { ref: "02", name: "Wealth Genome™ Profile", icon: Dna, why: "It starts with you",
    body: "Before we recommend anything, we read your financial DNA. A standard risk questionnaire asks a handful of questions and drops you into a bucket; the Wealth Genome reads dozens of signals about your money life — your income sources, your practice, your family, your debts, your health, your career arc, your comfort with risk — and how they interact with each other. Two physicians who look identical on paper can come out with very different, better-fitting plans, because the genome captures the hidden connections between the factors. It maps you to the specific set of strategies that fit you, not a template. Everything we build next is built around that profile, so nothing in your plan is generic.",
    punch: "You've never been a category to us. You're a genome." },
  { ref: "03", name: "Optimized Tax Waterfall Engine", icon: Waves, why: "Keep more, for life",
    body: "When you retire, your money sits in many buckets — Roth, IRA, Social Security, pension, rental income, policy cash values — and the IRS taxes each one differently. The order you draw from them can change what you keep over a lifetime by a staggering amount. Most tools optimize two or three sources; our Waterfall coordinates all of them together, year by year, across your whole retirement, and finds the drawdown sequence that leaves the least on the table. The savings it finds only appear when the sources are sequenced as a system — they're invisible when each bucket is planned alone. Every move is checked against the tax code, so your professionals can confirm it.",
    punch: "For your family, it means more of what you earned stays yours, and passes on intact." },
  { ref: "04", name: "Zero-Cost Roth Conversion Engine", icon: Boxes, why: "Tax-free, without the sting",
    body: "Moving money from a taxable retirement account into a Roth is one of the most powerful things you can do for your future — but the tax bill in the year you convert stops most people cold. This engine pairs the conversion with offsetting deductions, sequenced in the same year, so the tax the conversion creates can be balanced out rather than paid in full. Both halves are well known on their own; almost no one models them together, because the coordination is where the value hides. The result is a path toward tax-free growth and tax-free withdrawals — money that can pass to your children without the IRS in the middle. Whether it fits you depends on your situation, and a licensed professional confirms every specific.",
    punch: "But the idea that a Roth conversion has to hurt is one we retire for our clients." },
  { ref: "05", name: "Equity Arbitrage Engine", icon: Repeat2, why: "Put idle equity to work",
    body: "The equity in your home may be the largest asset you own that earns nothing. It just sits in the walls. This engine finds the sweet spot for borrowing against that equity at a low cost and positioning it where it can grow faster than it costs to borrow — timing the draws and the premiums across decades, not months. Advisors have attempted this by hand in spreadsheets for years; the engine weighs thousands of interacting variables at once and surfaces windows no one could calculate manually. It accounts for the fees, the caps, the exit schedules, and the rate changes that trip people up.",
    punch: "Done right, idle equity becomes a working asset for your family, quietly compounding while you practice medicine." },
  { ref: "06", name: "Mortgage Killer™", icon: Home, why: "Own your home, decades sooner",
    body: "This is where the equity engine turns into freedom. Mortgage Killer runs a recycling loop: put your idle equity to work, use that growth to pay down the mortgage years ahead of schedule, and when the home is free and clear, recycle the freed equity into the next property — cycle after cycle. Each cycle finishes faster than the last, because the growth from earlier cycles fuels the next one. Real-estate investors and insurance professionals each know their piece of this; nobody else runs it as one automated, compounding engine over a lifetime. For your family it means owning your home outright far sooner, cash flow freed up today, and a paid-off legacy tomorrow instead of thirty years of interest.",
    punch: "It's the single most-requested engine we own." },
  { ref: "07", name: "FIA Collateral Optimizer", icon: Landmark, why: "Income you can count on, capital you can reach",
    body: "Retirement income usually forces a trade: lock money away for a guaranteed stream, or keep it accessible and give up the guarantee. This engine splits a fixed indexed annuity into two sleeves — one that generates dependable income, and one you can borrow against — and tunes the split to real carrier products and real lending limits. It then coordinates that borrowing power with tax-aware debt paydown, so the same dollars do more than one job. The architecture is a combination you won't find in off-the-shelf software, because it requires modeling the products, the lending, and the taxes together. What you feel is confidence: an income floor you can count on, and capital within reach if life changes.",
    punch: "Your money works without being locked in a box." },
  { ref: "08", name: "Divorce-Proof Asset Shield", icon: ShieldCheck, why: "Protect everything you just built",
    body: "Everything you build is only as safe as its structure. This engine shows you which of your assets sit inside protected vehicles and which sit exposed — to a divorce, a lawsuit, a creditor — and applies the protection rules for your own state, because they differ enormously across the country. It can model more than one life event, so you see the difference protection makes over decades, not just once. Mainstream planning tools don't model asset protection this way at all; divorce attorneys work from simple asset lists after the fact. We do it before anything happens, which is the only time it helps.",
    punch: "It's how we help make a family's security durable — the part of your plan that protects all the other parts." },
  { ref: "09", name: "Retirement Risk Radar", icon: Radar, why: "See every threat, not just the market",
    body: "Most retirement tools worry about exactly one danger: the stock market. But a long retirement faces ten of them at once — healthcare inflation, the odds of needing long-term care, changes to Social Security, tax law, general inflation, living longer than expected, interest rates, housing, and more. The Radar models all of them and, critically, how they cluster: three or four risks arriving together can do far more damage than any one alone, and single-factor tools never see it coming. You get one clear picture of how prepared you actually are, and specific ways to reduce each exposure.",
    punch: "Nothing blindsides your family, because we looked at the whole sky, not just the weather." },
  { ref: "10", name: "10,000-Scenario Stress Test", icon: Dice5, why: "Prove the plan survives",
    body: "A plan that only works in a rising market isn't a plan. This engine runs yours through ten thousand different futures — crashes, booms, long flat stretches, and everything in between — and shows the full range of outcomes, not one rosy line. It's built specifically for the protective floor and growth cap of the strategies we use, which ordinary simulations get mathematically wrong; that precision reveals patterns standard tools miss entirely. You'll see the best case, the worst case, and how likely each really is. Then you retire knowing the plan holds up when markets don't.",
    punch: "That's real peace of mind for the whole family — not something a brochure projection can give you." },
  { ref: "11", name: "Time Machine Dual-View", icon: History, why: "Evidence beside the estimate",
    body: "Regulations require insurance illustrations to show you a hypothetical future — an estimate, however careful. The Time Machine adds what the estimate can't: a look back at how the same strategy would actually have behaved through real market history, decade by decade, with the strategy's true mechanics applied. You see the required forward projection and the historical evidence side by side. It changes how a decision feels, because you're no longer trusting a promise; you're reading a record. No other platform pairs the two views this way.",
    punch: "For a family making a decades-long commitment, evidence beside estimate is the difference between hoping and knowing." },
  { ref: "12", name: "Behavioral Safeguard", icon: Brain, why: "Protect the plan from human nature",
    body: "Every human brain is wired to make the same expensive money mistakes — panicking at a loss, anchoring on a number, chasing whatever did well last month, freezing when a change is needed. Over a lifetime those instincts can quietly cost a family more than any fee. This engine watches for those patterns as decisions happen and shows you the real numbers, drawn from your own plan, at the moment you need them most. It doesn't lecture; it quantifies, so the better choice is obvious. Behavioral science and financial planning have existed separately for years — putting them together, personally, in real time is what's new.",
    punch: "It protects your plan from the one risk no market model can: you." },
  { ref: "13", name: "The Russell Number™", icon: Award, why: "Your advisor, measured",
    body: "You've seen how much of a plan's quality depends on the person running it. The Russell Number is a single, transparent score for financial advisors, built from many dimensions at once — client retention, satisfaction, compliance record, continuing education, technology adoption, and more — instead of the one or two revenue metrics the industry usually uses. It's portable, so an advisor can show it to you the way a credit score shows lenders who you are. And because it's earned, it changes behavior: the things that matter to clients are the things that move the score. For your family, it means the person guiding you is measured against a standard, not just licensed.",
    punch: "Nobody else scores advisors this way." },
  { ref: "14", name: "Advisor Practice Platform", icon: Network, why: "Discipline that lasts for decades",
    body: "Behind every plan that lasts is a practice that runs with discipline. This platform is the nervous system of ours: it forecasts the work ahead, tracks every client's next action, flags anyone who hasn't been heard from, rehearses difficult conversations, and fires automated reminders so nothing falls through the cracks. Most advisory practices bolt these together from separate apps, and things get lost in the seams; ours works as one organism. You'll never experience the platform directly — but you'll feel it as consistent follow-through, year after year, from a practice that runs like the systems it builds.",
    punch: "It's how everything above stays true for the long haul." },
];

export default function ProprietaryTech() {
  return (
    <section id="technology" aria-label="Patent-pending technology behind Russell Capital Systems" className="relative overflow-hidden bg-[#03090a] py-28">
      {/* Crisp Emerald Dawn skyline behind the engines — no blur, just darkened for legibility */}
      <img src="/rcs-city-emerald.webp" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover object-center brightness-[.62] saturate-[1.15]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#03090a_0%,rgba(3,9,10,.55)_12%,rgba(3,9,10,.55)_88%,#03090a_100%)]" />

      <div className="container relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-300/45 bg-[#030f0c]/60 px-4 py-1.5 text-xs font-bold uppercase tracking-[.22em] text-emerald-300 backdrop-blur-sm">{TECH_STATUS_LABEL}</p>
          <h2 className="mt-5 text-[clamp(2.2rem,5.4vw,4.2rem)] font-black leading-[1.02] tracking-[-.025em] text-white [text-shadow:_0_6px_30px_rgba(0,0,0,.8),_0_0_40px_rgba(16,185,129,.3)]" style={{ fontFamily: "DM Sans, sans-serif" }}>
            Engines that work for <span className="text-emerald-400 [text-shadow:_0_0_22px_rgba(52,211,153,.8)]">you and your family</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-white/80">
            Fourteen purpose-built engines, in the order they build on one another — with <span className="font-semibold text-emerald-300">15 patents in process</span>, and <span className="font-semibold text-emerald-300">not offered anywhere else</span>. Read them top to bottom: each one makes the next possible. Here's what each means for you, now and for the years ahead.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {TECHNOLOGIES.map(({ ref, name, icon: Icon, why, body, punch }) => (
            <article key={ref} className="group relative overflow-hidden rounded-[22px] border border-emerald-300/30 bg-[linear-gradient(160deg,rgba(4,20,16,.9),rgba(2,10,9,.86))] p-7 shadow-[0_24px_70px_rgba(0,0,0,.55)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-300/70 hover:shadow-[0_30px_80px_rgba(16,185,129,.25)]">
              <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[3px] bg-[linear-gradient(90deg,transparent,rgba(52,211,153,.95),transparent)] opacity-60 transition-opacity group-hover:opacity-100" />
              <div className="flex items-center gap-3.5">
                <span className="flex h-[3.2rem] w-[3.2rem] shrink-0 items-center justify-center rounded-[14px] border border-emerald-300/45 bg-[linear-gradient(135deg,rgba(16,185,129,.32),rgba(16,185,129,.06))] p-3 text-emerald-200 shadow-[inset_0_0_18px_rgba(52,211,153,.3),_0_0_18px_rgba(52,211,153,.25)]"><Icon size={24} strokeWidth={1.6} /></span>
                <span className="text-[11px] font-extrabold uppercase tracking-[.22em] text-emerald-300/85">Engine {ref} of 14</span>
                <span className="ml-auto whitespace-nowrap rounded-full border border-emerald-300/35 bg-emerald-300/[.07] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.16em] text-emerald-300/85">Only at RCS</span>
              </div>
              <h3 className="mt-4 bg-[linear-gradient(95deg,#ffffff_0%,#bbf7d0_48%,#34d399_100%)] bg-clip-text text-[clamp(1.5rem,2.4vw,1.9rem)] font-black leading-[1.1] tracking-[-.015em] text-transparent [text-shadow:_0_0_34px_rgba(52,211,153,.25)]" style={{ fontFamily: "DM Sans, sans-serif" }}>{name}</h3>
              <div aria-hidden="true" className="mt-3 h-[2px] w-[4.5rem] rounded bg-[linear-gradient(90deg,#34d399,rgba(52,211,153,0))] shadow-[0_0_10px_rgba(52,211,153,.7)]" />
              <p className="mt-3.5 text-[11px] font-extrabold uppercase tracking-[.18em] text-emerald-300">{why}</p>
              <p className="mt-2 text-[1.02rem] leading-[1.72] text-white/88">
                {body} <b className="font-semibold text-white">{punch}</b>
              </p>
            </article>
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-3xl rounded-[20px] border border-emerald-300/35 bg-[#020c0a]/70 p-7 text-center backdrop-blur-md">
          <p className="text-[clamp(1.3rem,3vw,2rem)] font-black text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>And we're just getting started.</p>
          <p className="mx-auto mt-2 max-w-2xl text-[1.02rem] text-white/82">
            Beyond these fourteen, <span className="font-semibold text-emerald-300">45 more unique patent-pending technologies</span> are in process — built to keep giving you and your family an edge no one else can offer. <span className="font-semibold text-emerald-300">Stay tuned.</span>
          </p>
        </div>

        <p className="mx-auto mt-8 max-w-3xl text-center text-[11px] leading-relaxed text-white/50">
          Patent-pending methods developed by Russell Capital Systems — 15 patent applications in process, with 45 more underway — described here at a high level. Not tax, legal, or investment advice; results are not guaranteed and are reviewed by our tax professional team for suitability and IRS compliance before implementation.
        </p>
      </div>
    </section>
  );
}

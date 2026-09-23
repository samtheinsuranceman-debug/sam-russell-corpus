// ============================================================
// THE CALCULATOR CATALOGUE.
//
// Every card on this page comes from shared/calculatorCatalog.ts, which is
// verified against the real router by server/calculatorCatalog.test.ts. The
// previous version of this page carried its list as hand-typed JSX and
// eighteen of its thirty-five cards pointed at routes that did not exist.
// Nothing here can 404 any more without a test failing first.
// ============================================================
import React, { useMemo, useState } from "react";
import { Link } from "wouter";
import PageBackdrop from "../components/PageBackdrop";
import { EngineWhyFooter } from "@/components/rooms/Reveal";
import {
  CALCULATORS, CATEGORY_ORDER, CATEGORY_LABELS, CATEGORY_BLURBS,
  searchCalculators, featured,
  type CalculatorCategory, type CalculatorEntry,
} from "@shared/calculatorCatalog";
import { NOT_IN_NAVIGATION } from "@shared/hiddenRoutes";

// Routes the owner has hidden (shared/hiddenRoutes.ts) are not advertised on this public page.
const listed = (c: CalculatorEntry) => !(c.path in NOT_IN_NAVIGATION);
const LISTED = CALCULATORS.filter(listed);
const LISTED_COUNT = LISTED.length;
function listedCounts(): Array<{ category: CalculatorCategory; label: string; count: number }> {
  return CATEGORY_ORDER.map((category) => ({
    category, label: CATEGORY_LABELS[category], count: LISTED.filter((c) => c.category === category).length,
  }));
}

function Card({ c, big = false }: { c: CalculatorEntry; big?: boolean }) {
  return (
    <Link
      to={c.path}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border transition-all duration-300
        ${big
          ? "border-emerald-400/30 bg-gradient-to-br from-emerald-500/[0.10] to-transparent p-6 hover:border-emerald-400/60"
          : "border-white/10 bg-white/[0.035] p-5 hover:border-emerald-400/40 hover:bg-emerald-400/[0.07]"}
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-400/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
      />
      <div className="relative">
        <h3 className={`font-semibold tracking-tight text-white ${big ? "text-xl" : "text-[17px]"}`} style={{ textWrap: "balance" }}>
          {c.name}
        </h3>
        <p className={`mt-1.5 leading-relaxed text-slate-300/90 ${big ? "text-[14.5px]" : "text-[13.5px]"}`}>{c.blurb}</p>
      </div>
      <div className="relative mt-4 flex items-center justify-between gap-3">
        <span className="text-[10.5px] uppercase tracking-[0.18em] text-emerald-300/60">
          {CATEGORY_LABELS[c.category]}
        </span>
        <span className="text-[11px] font-medium text-emerald-300/0 transition-colors group-hover:text-emerald-300/90">Open →</span>
      </div>
    </Link>
  );
}

const MassiveCalculatorsPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [only, setOnly] = useState<CalculatorCategory | "all">("all");

  const counts = useMemo(() => listedCounts(), []);
  const hits = useMemo(() => searchCalculators(search).filter(listed), [search]);
  const searching = search.trim().length > 0;

  const visible = useMemo(
    () => (only === "all" ? hits : hits.filter((c) => c.category === only)),
    [hits, only],
  );

  const grouped = useMemo(
    () =>
      CATEGORY_ORDER
        .map((cat) => ({ cat, items: visible.filter((c) => c.category === cat) }))
        .filter((g) => g.items.length > 0),
    [visible],
  );

  return (
    <div className="rc-room-frame relative min-h-screen bg-[#0a0f1a] font-sans text-white">
      <PageBackdrop
        src="/rcs-city-river.webp"
        phoneSrc="/rcs-city-lattice.webp"
        alt="Emerald-lit skyline at dusk with a river curving through the city"
        fade="#0a0f1a"
      />
      <div className="relative z-10 mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8">

        {/* ---- masthead ---- */}
        <header className="border-b border-white/10 pb-8">
          <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-300/70">Russell Capital Systems</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl" style={{ textWrap: "balance" }}>
            The Calculators
          </h1>
          <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed text-slate-300">
            {LISTED_COUNT} instruments across {CATEGORY_ORDER.length} rooms. Every one of them shares your
            numbers with every other through the Interop Engine, so a figure entered once is never entered twice —
            and the AI reads the same engines you do, which is why it can tell you where a number came from.
          </p>
        </header>

        {/* ---- the machine that contains the rest ---- */}
        <Link
          to="/ultra-calculator"
          className="group mt-8 block overflow-hidden rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-500/[0.14] via-amber-500/[0.06] to-transparent p-6 transition-all hover:border-amber-400/70 sm:p-8"
        >
          <p className="text-[11px] uppercase tracking-[0.28em] text-amber-300/80">Start here</p>
          <h2 className="mt-2 text-2xl font-bold text-amber-200 sm:text-3xl" style={{ textWrap: "balance" }}>
            The Decade Machine
          </h2>
          <p className="mt-2 max-w-[70ch] text-[14.5px] leading-relaxed text-slate-200/90">
            Every calculator below, in one machine, with module toggles and chained 5/10/20/30-year windows that
            carry each number into the next — the mortgage recycle cycle, trust-owned policy flows, and the AI
            team that tells you which of these are necessary for your situation and which are not.
            Speak to it with the 🎙 button on any page.
          </p>
          <span className="mt-4 inline-block text-sm font-medium text-amber-300/70 transition-colors group-hover:text-amber-200">
            Open the machine →
          </span>
        </Link>

        {/* ---- search and filter ---- */}
        <div className="mt-10 flex flex-col gap-4">
          <label className="sr-only" htmlFor="calculator-search">Search the calculators</label>
          <input
            id="calculator-search"
            type="search"
            placeholder="Search — try “airbnb”, “death tax”, “doctor”, “mortgage”…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3.5 text-[15px] text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setOnly("all")}
              className={`rounded-full border px-3.5 py-1.5 text-[12.5px] transition-colors ${
                only === "all"
                  ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-200"
                  : "border-white/15 text-slate-300 hover:border-white/30"}`}
            >
              Everything <span className="tabular-nums opacity-60">{LISTED_COUNT}</span>
            </button>
            {counts.map(({ category, label, count }) => (
              <button
                key={category}
                type="button"
                onClick={() => setOnly(category)}
                className={`rounded-full border px-3.5 py-1.5 text-[12.5px] transition-colors ${
                  only === category
                    ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-200"
                    : "border-white/15 text-slate-300 hover:border-white/30"}`}
              >
                {label} <span className="tabular-nums opacity-60">{count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ---- the most-used, when not searching ---- */}
        {!searching && only === "all" && (
          <section className="mt-12">
            <h2 className="text-[11px] uppercase tracking-[0.28em] text-emerald-300/70">Most used</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {featured().filter(listed).map((c) => <Card key={c.path} c={c} big />)}
            </div>
          </section>
        )}

        {/* ---- everything, by room ---- */}
        {grouped.length === 0 ? (
          <p className="mt-16 text-center text-[15px] text-slate-400">
            Nothing matches “{search}”. Try a plainer word — the search reads the names, the descriptions
            and the terms people actually type.
          </p>
        ) : (
          grouped.map(({ cat, items }) => (
            <section key={cat} className="mt-14">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-white/10 pb-3">
                <h2 className="text-xl font-semibold text-emerald-300">{CATEGORY_LABELS[cat]}</h2>
                <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500 tabular-nums">{items.length}</span>
                <p className="w-full text-[13.5px] leading-relaxed text-slate-400 sm:w-auto sm:flex-1">
                  {CATEGORY_BLURBS[cat]}
                </p>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {items.map((c) => <Card key={c.path} c={c} />)}
              </div>
            </section>
          ))
        )}

        <div className="mt-16">
          <EngineWhyFooter />
        </div>
      </div>
    </div>
  );
};

export default MassiveCalculatorsPage;

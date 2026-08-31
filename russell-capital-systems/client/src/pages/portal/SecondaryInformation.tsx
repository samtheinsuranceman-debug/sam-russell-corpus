import { AppShell } from "@/components/AppShell";
import { SECONDARY_CATALOG, SECONDARY_CATEGORIES, type SecondaryCatalogCategory } from "@/lib/secondaryCatalog";
import { Archive, ArrowUpRight, BookOpen, Filter, Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";

const categoryDescription: Record<SecondaryCatalogCategory, string> = {
  "Advanced Analysis": "Specialized calculators, comparisons, simulators, and analytical workbenches.",
  "Reports & Documents": "Report builders, presentations, documents, statements, and export-oriented tools.",
  "Reference & Education": "Libraries, training, timelines, tutorials, video, and reference material.",
  "Operations & Administration": "Administrative, monitoring, integration, workspace, and operational utilities.",
  "Experience & Experimental": "Experiential, gamified, community, and exploratory interfaces outside core planning workflows.",
  "Additional Tools": "Useful specialist pages that are preserved but are not part of the primary advisor path.",
};

export default function SecondaryInformation() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SecondaryCatalogCategory | "All">("All");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return SECONDARY_CATALOG.filter(item => {
      const matchesCategory = category === "All" || item.category === category;
      const matchesQuery = !normalized || item.label.toLowerCase().includes(normalized) || item.path.toLowerCase().includes(normalized);
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  const grouped = useMemo(() => SECONDARY_CATEGORIES.map(name => ({
    name,
    items: filtered.filter(item => item.category === name),
  })).filter(group => group.items.length > 0), [filtered]);

  return (
    <AppShell subtitle="Preserved specialist tools, reference material, and non-primary workflows">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-3xl border border-violet-400/20 bg-[radial-gradient(circle_at_15%_0%,rgba(124,58,237,.24),transparent_34%),linear-gradient(145deg,rgba(15,10,28,.98),rgba(7,10,18,.98))] p-6 shadow-[0_28px_90px_rgba(45,20,90,.24)] sm:p-8">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-300/25 bg-violet-500/15">
                <Archive className="h-5 w-5 text-violet-300" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-300">Secondary Information</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Everything preserved, without crowding the core workflow.</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-violet-100/60 sm:text-base">These pages remain fully routed and searchable. They are separated from the primary advisor path because they are specialist, reference-oriented, administrative, duplicative, or still awaiting the usefulness audit. No page has been deleted.</p>
            </div>
            <div className="grid min-w-44 grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="text-2xl font-semibold text-white">{SECONDARY_CATALOG.length}</div>
                <div className="mt-1 text-xs text-violet-100/50">preserved pages</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="text-2xl font-semibold text-white">{SECONDARY_CATEGORIES.length}</div>
                <div className="mt-1 text-xs text-violet-100/50">clear groups</div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-violet-400/15 bg-[#0a0812]/95 p-4 shadow-xl shadow-black/20 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <label className="relative block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-300/70" />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search every secondary page…"
                className="h-11 w-full rounded-xl border border-violet-400/20 bg-black/30 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-violet-100/35 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/15"
              />
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:max-w-3xl">
              <Filter className="h-4 w-4 shrink-0 text-violet-300/60" />
              {(["All", ...SECONDARY_CATEGORIES] as const).map(value => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCategory(value)}
                  className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold transition active:scale-[0.97] ${category === value ? "border-violet-400/50 bg-violet-500/20 text-violet-100" : "border-white/10 bg-white/[0.03] text-violet-100/50 hover:border-violet-400/30 hover:text-violet-100"}`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        </section>

        {grouped.length === 0 ? (
          <section className="grid min-h-56 place-items-center rounded-2xl border border-dashed border-violet-400/20 bg-white/[0.02] text-center">
            <div><BookOpen className="mx-auto h-8 w-8 text-violet-300/45" /><p className="mt-3 font-medium text-white">No secondary pages match this search.</p><p className="mt-1 text-sm text-violet-100/45">Try another term or select All.</p></div>
          </section>
        ) : (
          grouped.map(group => (
            <section key={group.name} className="rounded-2xl border border-white/8 bg-[#0a0812]/80 p-5 sm:p-6">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div><h2 className="text-lg font-semibold text-white">{group.name}</h2><p className="mt-1 max-w-3xl text-sm leading-6 text-violet-100/45">{categoryDescription[group.name]}</p></div>
                <span className="rounded-full border border-violet-400/15 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-200">{group.items.length} pages</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {group.items.map(item => (
                  <Link key={item.path} href={item.path} className="group flex min-h-24 items-start justify-between gap-4 rounded-xl border border-white/8 bg-white/[0.025] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-violet-400/30 hover:bg-violet-500/[0.06]">
                    <div className="min-w-0"><div className="font-medium text-violet-50 group-hover:text-white">{item.label}</div><div className="mt-2 truncate font-mono text-[10px] text-violet-100/30">{item.path}</div></div>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-violet-300/35 transition group-hover:text-violet-300" />
                  </Link>
                ))}
              </div>
            </section>
          ))
        )}

        <section className="flex items-start gap-3 rounded-2xl border border-emerald-400/15 bg-emerald-500/[0.04] p-5 text-sm leading-6 text-emerald-50/65">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
          <p>The page audit will assign every route a usefulness score and recommendation. Items may later move between the primary workflow and this library, but no route will be removed without an explicit owner decision.</p>
        </section>
      </div>
    </AppShell>
  );
}

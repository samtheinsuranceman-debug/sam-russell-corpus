// ============================================================
// SITE MAP OVERLAY — the whole site, the moment they sign in.
//   • Seven tabs across the top, every page as a clickable title with its
//     one-line purpose; visited pages glow neon forest green and stay green
//     on every later login.
//   • Clicking a title opens the page underneath while the map stays
//     mounted; a bar with ← (top-left) and X (top-right) returns to the map
//     and marks the page green.
//   • The map itself closes only from its own top-right X. Escape, backdrop
//     clicks and route changes never close it.
// ============================================================
import { useMemo, useState } from "react";
import { ArrowLeft, Map as MapIcon, Search, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useSiteMap } from "@/contexts/SiteMapContext";
import { ADVISOR_NAME } from "@shared/aiAdvisor";
import type { SiteMapLeaf, SiteMapTab } from "@shared/siteMapTree";

function LeafButton({ leaf, visited, color, onOpen }: { leaf: SiteMapLeaf; visited: boolean; color: string; onOpen: (p: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(leaf.path)}
      title={leaf.purpose ?? leaf.path}
      className="group w-full text-left rounded-md px-2 py-1.5 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
      style={visited ? { color, textShadow: `0 0 8px ${color}66` } : undefined}
      data-visited={visited ? "true" : "false"}
      data-path={leaf.path}
    >
      <span className="block text-[13px] font-semibold leading-tight">{leaf.title}</span>
      {leaf.purpose ? <span className="block text-[11px] leading-snug opacity-70 group-hover:opacity-100">{leaf.purpose}</span> : null}
    </button>
  );
}

function TabPanel({ tab, query, visited, color, onOpen }: { tab: SiteMapTab; query: string; visited: (p: string) => boolean; color: string; onOpen: (p: string) => void }) {
  const q = query.trim().toLowerCase();
  const groups = tab.groups
    .map(g => ({ ...g, leaves: q ? g.leaves.filter(l => `${l.title} ${l.purpose ?? ""} ${l.path}`.toLowerCase().includes(q)) : g.leaves }))
    .filter(g => g.leaves.length);
  if (groups.length === 0) return <p className="text-sm opacity-60 px-2 py-6">Nothing here matches “{query}”.</p>;
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
      {groups.map(g => (
        <section key={g.id} className="rounded-lg border border-white/10 bg-black/20 p-2">
          <h3 className="px-2 pb-1 text-[11px] font-mono uppercase tracking-wider text-amber-300/90">{g.label} <span className="opacity-50">· {g.leaves.length}</span></h3>
          <div className="flex flex-col">
            {g.leaves.map(l => <LeafButton key={l.path} leaf={l} visited={visited(l.path)} color={color} onOpen={onOpen} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function SiteMapOverlay() {
  const map = useSiteMap();
  const tree = trpc.siteMap.tree.useQuery(undefined, { staleTime: 10 * 60_000 });
  const [tabId, setTabId] = useState<string>("plan");
  const [query, setQuery] = useState("");
  const visitedCount = useMemo(() => Object.values(map.visited).filter(n => n > 0).length, [map.visited]);

  if (map.mode === "off") return null;

  if (map.mode === "page") {
    // The page is rendered by the router underneath; this bar brings them back.
    return (
      <div
        className="fixed inset-x-0 z-[80] flex items-center justify-between px-3 py-2 bg-[#0b1a12]/95 text-emerald-50 border-b border-emerald-400/30 backdrop-blur"
        style={{ top: "env(safe-area-inset-top, 0px)" }}
        role="region"
        aria-label="Return to the site map"
        data-testid="site-map-page-bar"
      >
        <button type="button" onClick={map.closePage} className="inline-flex items-center gap-2 rounded px-2 py-1 hover:bg-white/10" aria-label="Back to the map">
          <ArrowLeft size={16} /> <span className="text-sm">Back to the map</span>
        </button>
        <span className="text-xs font-mono opacity-70 truncate px-2">{map.openedPath}</span>
        <button type="button" onClick={map.closePage} className="inline-flex items-center rounded p-1 hover:bg-white/10" aria-label="Close this page and return to the map">
          <X size={18} />
        </button>
      </div>
    );
  }

  const tabs = tree.data?.tabs ?? [];
  const active = tabs.find(t => t.id === tabId) ?? tabs[0];

  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col bg-[#07130d] text-emerald-50"
      role="dialog"
      aria-modal="true"
      aria-label="Site map"
      data-testid="site-map-overlay"
      onKeyDown={e => { if (e.key === "Escape") e.stopPropagation(); }}
    >
      <header className="flex items-center gap-3 px-4 py-3 border-b border-emerald-400/20" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)" }}>
        <MapIcon size={20} className="text-amber-300" />
        <div className="min-w-0">
          <h1 className="text-base font-semibold leading-tight">How this site is arranged</h1>
          <p className="text-[12px] opacity-70 leading-tight">
            {tree.data ? `${tree.data.routeCount} pages in 7 tabs.` : "Loading the map…"} Click any title to open it; the map stays here. Pages you have closed glow <span style={{ color: map.visitedColor }}>green</span> ({visitedCount} so far). {ADVISOR_NAME} is watching where you go and will offer help.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <label className="relative hidden sm:block">
            <Search size={14} className="absolute left-2 top-2 opacity-60" />
            <input id="site-map-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Find a page" className="bg-black/30 border border-white/10 rounded pl-7 pr-2 py-1 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          </label>
          <button type="button" onClick={map.closeMap} className="inline-flex items-center rounded p-2 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300" aria-label="Close the map" data-testid="site-map-close">
            <X size={20} />
          </button>
        </div>
      </header>

      <nav className="flex gap-1 px-3 py-2 overflow-x-auto border-b border-emerald-400/10" aria-label="Site map tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTabId(t.id)}
            className={`shrink-0 rounded-full px-3 py-1 text-sm ${active?.id === t.id ? "bg-amber-300 text-[#07130d] font-semibold" : "bg-white/5 hover:bg-white/10"}`}
            aria-pressed={active?.id === t.id}
          >
            {t.label} <span className="opacity-60 text-xs">{t.groups.reduce((n, g) => n + g.leaves.length, 0)}</span>
          </button>
        ))}
      </nav>

      <main className="flex-1 overflow-y-auto p-3" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}>
        {active ? <TabPanel tab={active} query={query} visited={map.isVisited} color={map.visitedColor} onOpen={map.openPage} /> : null}
      </main>
    </div>
  );
}

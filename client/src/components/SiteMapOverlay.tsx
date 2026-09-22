// ============================================================
// SITE MAP OVERLAY — the whole site, the moment they sign in.
//   • Seven tabs across the top. Under each tab the hubs; under each hub
//     every page; under each page its deeper pages, and theirs, to any
//     depth. Collapsible. Every route in the manifest appears exactly once.
//   • Every name is a real link (href = the route) so middle-click and
//     copy-link work. A plain click opens the page underneath while the
//     map stays mounted; a bar with ← (top-left) and X (top-right) returns
//     to the map and marks the page green.
//   • Visited pages glow neon forest green and stay green on every login.
//   • The map itself closes only from its own top-right X. Escape, backdrop
//     clicks and route changes never close it.
// ============================================================
import { useCallback, useMemo, useState, type MouseEvent } from "react";
import { ArrowLeft, ChevronDown, ChevronRight, Map as MapIcon, Search, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useSiteMap } from "@/contexts/SiteMapContext";
import { ADVISOR_NAME } from "@shared/aiAdvisor";
import type { SiteMapNode, SiteMapTab } from "@shared/siteMapTree";

function isPlainClick(e: MouseEvent): boolean {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}

function countNodes(nodes: SiteMapNode[]): number {
  let n = 0;
  for (const node of nodes) n += 1 + countNodes(node.children);
  return n;
}

/** Keep a node when it or any descendant matches; matching subtrees stay whole. */
function filterNodes(nodes: SiteMapNode[], q: string): SiteMapNode[] {
  if (!q) return nodes;
  const out: SiteMapNode[] = [];
  for (const n of nodes) {
    const self = `${n.title} ${n.purpose ?? ""} ${n.path}`.toLowerCase().includes(q);
    const kids = filterNodes(n.children, q);
    if (self || kids.length) out.push({ ...n, children: self ? n.children : kids });
  }
  return out;
}

function NodeRow({ node, forceOpen, expanded, toggle, visited, color, onOpen }: {
  node: SiteMapNode;
  forceOpen: boolean;
  expanded: Set<string>;
  toggle: (p: string) => void;
  visited: (p: string) => boolean;
  color: string;
  onOpen: (p: string) => void;
}) {
  const hasKids = node.children.length > 0;
  const open = forceOpen || expanded.has(node.path);
  const isVisited = visited(node.path);
  return (
    <li className="list-none" data-depth={node.depth} data-path={node.path}>
      <div className="flex items-start gap-1 rounded-md px-1 py-1 hover:bg-white/5" style={{ paddingLeft: `${node.depth * 14 + 4}px` }}>
        {hasKids ? (
          <button
            type="button"
            onClick={() => toggle(node.path)}
            className="mt-0.5 shrink-0 rounded p-0.5 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            aria-expanded={open}
            aria-label={open ? `Collapse ${node.title}` : `Expand ${node.title} (${countNodes(node.children)} deeper)`}
            data-testid="site-map-toggle"
          >
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="mt-0.5 w-[18px] shrink-0 text-center opacity-30" aria-hidden>·</span>
        )}
        <a
          href={node.path}
          onClick={e => { if (isPlainClick(e)) { e.preventDefault(); onOpen(node.path); } }}
          title={node.purpose ?? node.path}
          className="group min-w-0 flex-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded"
          style={isVisited ? { color, textShadow: `0 0 8px ${color}66` } : undefined}
          data-visited={isVisited ? "true" : "false"}
          data-path={node.path}
        >
          <span className="block text-[13px] font-semibold leading-tight">
            {node.title}
            {hasKids ? <span className="ml-1 text-[10px] font-normal opacity-50">{countNodes(node.children)} deeper</span> : null}
          </span>
          {node.purpose ? <span className="block text-[11px] leading-snug opacity-70 group-hover:opacity-100">{node.purpose}</span> : null}
        </a>
      </div>
      {hasKids && open ? (
        <ul className="border-l border-white/10" style={{ marginLeft: `${node.depth * 14 + 12}px` }}>
          {node.children.map(c => (
            <NodeRow key={c.path} node={c} forceOpen={forceOpen} expanded={expanded} toggle={toggle} visited={visited} color={color} onOpen={onOpen} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function TabPanel({ tab, query, allOpen, expanded, toggle, visited, color, onOpen }: {
  tab: SiteMapTab;
  query: string;
  allOpen: boolean;
  expanded: Set<string>;
  toggle: (p: string) => void;
  visited: (p: string) => boolean;
  color: string;
  onOpen: (p: string) => void;
}) {
  const q = query.trim().toLowerCase();
  const groups = tab.groups
    .map(g => ({ ...g, nodes: filterNodes(g.nodes, q) }))
    .filter(g => g.nodes.length);
  if (groups.length === 0) return <p className="text-sm opacity-60 px-2 py-6">Nothing here matches “{query}”.</p>;
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
      {groups.map(g => (
        <section key={g.id} className="rounded-lg border border-white/10 bg-black/20 p-2" data-testid="site-map-hub" data-hub={g.id}>
          <h3 className="px-2 pb-1 text-[11px] font-mono uppercase tracking-wider text-amber-300/90">
            {g.label} <span className="opacity-50">· {countNodes(g.nodes)}</span>
          </h3>
          <ul className="flex flex-col">
            {g.nodes.map(n => (
              <NodeRow key={n.path} node={n} forceOpen={q.length > 0 || allOpen} expanded={expanded} toggle={toggle} visited={visited} color={color} onOpen={onOpen} />
            ))}
          </ul>
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
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [allOpen, setAllOpen] = useState(false);
  const visitedCount = useMemo(() => Object.values(map.visited).filter(n => n > 0).length, [map.visited]);

  const toggle = useCallback((p: string) => {
    setExpanded(prev => { const next = new Set(prev); if (next.has(p)) next.delete(p); else next.add(p); return next; });
  }, []);

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
            {tree.data ? `${tree.data.routeCount} pages in 7 tabs.` : "Loading the map…"} Tabs break into hubs, hubs into pages, pages into deeper pages. Click any name to open it; the map stays here. Pages you have closed glow <span style={{ color: map.visitedColor }}>green</span> ({visitedCount} so far). {ADVISOR_NAME} is watching where you go and will offer help.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAllOpen(v => !v)}
            className="hidden sm:inline-flex rounded-full border border-white/15 px-3 py-1 text-xs hover:bg-white/10"
            aria-pressed={allOpen}
            data-testid="site-map-expand-all"
          >
            {allOpen ? "Collapse all" : "Expand all"}
          </button>
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
        {active ? (
          <TabPanel
            tab={active}
            query={query}
            allOpen={allOpen}
            expanded={expanded}
            toggle={toggle}
            visited={map.isVisited}
            color={map.visitedColor}
            onOpen={map.openPage}
          />
        ) : null}
      </main>
    </div>
  );
}

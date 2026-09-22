// ============================================================
// DEEPER BUTTONS — the less-essential pages that belong with this one,
// rendered as a row of small buttons at the top of a key page so a client
// or advisor can go deeper on the subject. Data-driven from the site map
// tree; no page is hand-edited. When the map is open (page mode) the
// buttons open through the map so the visited colouring keeps working.
// ============================================================
import { useLocation } from "wouter";
import { ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useSiteMap } from "@/contexts/SiteMapContext";

export default function DeeperButtons({ limit = 8 }: { limit?: number }) {
  const [location, navigate] = useLocation();
  const map = useSiteMap();
  const deeper = trpc.siteMap.deeper.useQuery({ routePath: location, limit }, { staleTime: 10 * 60_000, enabled: location.startsWith("/portal") });
  const links = deeper.data ?? [];
  if (links.length === 0) return null;
  const go = (path: string) => (map.mode === "page" ? map.openPage(path) : navigate(path));
  return (
    <div className="flex flex-wrap items-center gap-2 px-1 pb-3" data-testid="deeper-buttons" aria-label="Go deeper on this subject">
      <span className="text-[11px] font-mono uppercase tracking-wider text-amber-300/90">Go deeper</span>
      {links.map(l => (
        <button
          key={l.path}
          type="button"
          onClick={() => go(l.path)}
          title={l.purpose ?? l.path}
          className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-950/40 px-3 py-1 text-xs hover:bg-emerald-900/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          style={map.isVisited(l.path) ? { color: map.visitedColor } : undefined}
        >
          {l.title} <ChevronRight size={12} />
        </button>
      ))}
    </div>
  );
}

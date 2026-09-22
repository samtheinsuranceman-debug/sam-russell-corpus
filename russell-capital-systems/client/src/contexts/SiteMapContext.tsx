// ============================================================
// SITE MAP CONTEXT — the state behind the login map:
//   mode "map"  : the full-screen map is showing
//   mode "page" : the visitor opened a page from the map; the map is still
//                 mounted underneath and a ← / X bar returns to it
//   mode "off"  : closed from the map's own top-right X
// Visited routes are persisted server-side (siteMap.markVisited) and
// mirrored in localStorage for instant paint. Every open and close also
// informs the hive so Samuel Goldman knows where the visitor has been.
// ============================================================
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { VISITED_NEON_FOREST_GREEN, VISITED_NEON_FOREST_GREEN_ON_LIGHT } from "@shared/hiveMind";

export type SiteMapMode = "map" | "page" | "off";

const LS_KEY = "rcs.siteMap.v1";
const SESSION_KEY = "rcs.siteMap.session.v1";

type Persisted = { visited: Record<string, number>; shownForLogin?: number };

function readLs(): Persisted {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as Persisted;
  } catch { /* private window or blocked storage */ }
  return { visited: {} };
}
function writeLs(p: Persisted): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(p)); } catch { /* ignore */ }
}
function readSession(): { mode: SiteMapMode; openedPath: string | null; startedAt: string; opens: number } | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}
function writeSession(s: { mode: SiteMapMode; openedPath: string | null; startedAt: string; opens: number }): void {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export interface SiteMapState {
  mode: SiteMapMode;
  openedPath: string | null;
  /** routePath → visit count; a route present here renders neon forest green. */
  visited: Record<string, number>;
  visitedColor: string;
  visitedColorOnLight: string;
  sessionStartedAt: string;
  /** Page opens from the map this session (drives the advisor's nudge). */
  opens: number;
  openMap: () => void;
  closeMap: () => void;
  openPage: (path: string) => void;
  closePage: () => void;
  isVisited: (path: string) => boolean;
}

const SiteMapContext = createContext<SiteMapState | null>(null);

export function SiteMapProvider({ children }: { children: ReactNode }) {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const initial = useRef(readSession());
  const [mode, setMode] = useState<SiteMapMode>(initial.current?.mode ?? "off");
  const [openedPath, setOpenedPath] = useState<string | null>(initial.current?.openedPath ?? null);
  const [opens, setOpens] = useState<number>(initial.current?.opens ?? 0);
  const [sessionStartedAt] = useState<string>(initial.current?.startedAt ?? new Date().toISOString());
  const [visited, setVisited] = useState<Record<string, number>>(() => readLs().visited);

  const visitsQuery = trpc.siteMap.visits.useQuery(undefined, { enabled: isAuthenticated, staleTime: 60_000 });
  const opened = trpc.siteMap.opened.useMutation();
  const markVisited = trpc.siteMap.markVisited.useMutation();

  // Server record wins over the local mirror once it arrives.
  useEffect(() => {
    if (!visitsQuery.data) return;
    const next: Record<string, number> = { ...readLs().visited };
    for (const v of visitsQuery.data.visits) next[v.routePath] = Math.max(next[v.routePath] ?? 0, v.visitCount);
    setVisited(next);
    writeLs({ ...readLs(), visited: next });
  }, [visitsQuery.data]);

  // Show the map on every login: once per user id per browser session.
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const p = readLs();
    if (p.shownForLogin === user.id && initial.current) return;
    if (mode === "off" && !initial.current) {
      setMode("map");
      writeLs({ ...p, shownForLogin: user.id });
    }
  }, [isAuthenticated, user, mode]);

  useEffect(() => { writeSession({ mode, openedPath, startedAt: sessionStartedAt, opens }); }, [mode, openedPath, sessionStartedAt, opens]);

  const openMap = useCallback(() => { setMode("map"); }, []);
  const closeMap = useCallback(() => { setMode("off"); setOpenedPath(null); }, []);

  const openPage = useCallback((path: string) => {
    setOpenedPath(path);
    setMode("page");
    setOpens(n => n + 1);
    navigate(path);
    if (isAuthenticated) opened.mutate({ routePath: path, fromMap: true });
  }, [navigate, isAuthenticated, opened]);

  const closePage = useCallback(() => {
    const path = openedPath;
    if (path) {
      setVisited(prev => {
        const next = { ...prev, [path]: (prev[path] ?? 0) + 1 };
        writeLs({ ...readLs(), visited: next });
        return next;
      });
      if (isAuthenticated) markVisited.mutate({ routePath: path });
    }
    setOpenedPath(null);
    setMode("map");
    navigate("/portal/map");
  }, [openedPath, isAuthenticated, markVisited, navigate]);

  const value = useMemo<SiteMapState>(() => ({
    mode, openedPath, visited,
    visitedColor: VISITED_NEON_FOREST_GREEN,
    visitedColorOnLight: VISITED_NEON_FOREST_GREEN_ON_LIGHT,
    sessionStartedAt, opens,
    openMap, closeMap, openPage, closePage,
    isVisited: (p: string) => (visited[p] ?? 0) > 0,
  }), [mode, openedPath, visited, sessionStartedAt, opens, openMap, closeMap, openPage, closePage]);

  return <SiteMapContext.Provider value={value}>{children}</SiteMapContext.Provider>;
}

export function useSiteMap(): SiteMapState {
  const ctx = useContext(SiteMapContext);
  if (!ctx) throw new Error("useSiteMap must be used inside <SiteMapProvider>");
  return ctx;
}

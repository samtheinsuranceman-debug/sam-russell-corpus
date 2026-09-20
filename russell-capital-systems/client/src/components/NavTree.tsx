/**
 * NAV TREE RENDERER
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Renders the ported `MEDICAL_TREE` as a recursive, arbitrarily-deep,
 * collapsible tree with search — the capability the flat two-level
 * `NAV_SECTIONS` sidebar in `AppShell.tsx` does not have.
 *
 * ## It renders the PRUNED tree, always
 *
 * The tree is shared with a build that serves more routes than this one. 124
 * of its 271 targets do not exist here. `pruneToRoutes` removes them before
 * anything reaches the DOM, so this component cannot render a dead link. That
 * pruning is memoised against `ROUTE_MANIFEST`, which is static, so it runs
 * once per mount rather than per keystroke.
 *
 * ## It does not replace the sidebar
 *
 * `AppShell` still renders `NAV_SECTIONS` by default. A swap would orphan 90
 * entries that are reachable today and are not in this tree, so this ships
 * opt-in (see `useNavTreePreview`) and the default is unchanged.
 */

import { useMemo, useState, useEffect } from "react";
import { Link } from "wouter";
import { ChevronRight, Search, X } from "lucide-react";
import { MEDICAL_TREE, type NavNode } from "@shared/navTree";
import { pruneToRoutes } from "@shared/navTreeValidation";
import { ROUTE_MANIFEST } from "@shared/routeManifest";

/** Opt-in flag. `?navtree=1` turns the preview on, `?navtree=0` off; sticky. */
const FLAG_KEY = "rc.navtree.preview";

export function useNavTreePreview(): boolean {
  const [on, setOn] = useState(false);

  useEffect(() => {
    try {
      const param = new URLSearchParams(window.location.search).get("navtree");
      if (param === "1" || param === "0") {
        localStorage.setItem(FLAG_KEY, param);
        setOn(param === "1");
        return;
      }
      setOn(localStorage.getItem(FLAG_KEY) === "1");
    } catch {
      setOn(false); // private mode / blocked storage — stay on the default sidebar
    }
  }, []);

  return on;
}

/** Does this node, or anything beneath it, match the query? */
function matches(node: NavNode, query: string): boolean {
  if (!query) return true;
  if (node.label.toLowerCase().includes(query)) return true;
  if (node.path?.toLowerCase().includes(query)) return true;
  return (node.children ?? []).some((child) => matches(child, query));
}

function TreeNode({
  node, depth, location, query, onNavigate,
}: {
  node: NavNode;
  depth: number;
  location: string;
  query: string;
  onNavigate?: () => void;
}) {
  const isLeaf = typeof node.path === "string" && node.path.length > 0;
  const isActive = isLeaf && (location === node.path);

  // A search hit forces its ancestors open, so results are visible where they live.
  const hasHit = query.length > 0 && matches(node, query);
  const [open, setOpen] = useState(!!node.defaultOpen);
  const expanded = hasHit || open;

  if (query && !matches(node, query)) return null;

  const indent = { paddingLeft: `${Math.min(depth, 6) * 10 + 8}px` };

  if (isLeaf) {
    return (
      <Link
        href={node.path as string}
        onClick={onNavigate}
        style={indent}
        className={`block truncate rounded py-1 pr-2 text-[12px] transition-colors ${
          isActive
            ? "bg-emerald-400/10 font-semibold text-emerald-300"
            : "text-slate-300 hover:bg-white/5 hover:text-slate-100"
        }`}
        data-testid={`navtree-link-${node.path}`}
      >
        {node.label}
      </Link>
    );
  }

  const childCount = node.children?.length ?? 0;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={indent}
        className="flex w-full items-center gap-1.5 rounded py-1 pr-2 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400 transition-colors hover:text-slate-200"
        aria-expanded={expanded}
      >
        <ChevronRight
          size={11}
          className={`flex-shrink-0 opacity-60 transition-transform ${expanded ? "rotate-90" : ""}`}
        />
        <span className="flex-1 truncate">{node.label}</span>
        <span className="text-[9px] opacity-40">{childCount}</span>
      </button>
      {expanded && node.children && (
        <div>
          {node.children.map((child, i) => (
            <TreeNode
              key={`${child.label}-${child.path ?? i}`}
              node={child}
              depth={depth + 1}
              location={location}
              query={query}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function NavTree({ location, onNavigate }: { location: string; onNavigate?: () => void }) {
  const [rawQuery, setRawQuery] = useState("");
  const query = rawQuery.trim().toLowerCase();

  // ROUTE_MANIFEST is static, so this runs once per mount, not per keystroke.
  const tree = useMemo(() => pruneToRoutes(MEDICAL_TREE, ROUTE_MANIFEST), []);

  return (
    <div className="flex h-full flex-col">
      <div className="px-2 pb-2">
        <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#060d18] px-2 focus-within:border-emerald-400/40">
          <Search size={12} className="flex-shrink-0 text-slate-500" />
          <input
            value={rawQuery}
            onChange={(e) => setRawQuery(e.target.value)}
            placeholder="Search navigation"
            aria-label="Search navigation"
            className="w-full bg-transparent py-1.5 text-[12px] text-slate-100 outline-none placeholder:text-slate-600"
          />
          {rawQuery && (
            <button type="button" onClick={() => setRawQuery("")} aria-label="Clear search">
              <X size={12} className="text-slate-500 hover:text-slate-300" />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-1 pb-4">
        {tree.map((node, i) => (
          <TreeNode
            key={`${node.label}-${i}`}
            node={node}
            depth={0}
            location={location}
            query={query}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
    </div>
  );
}

export default NavTree;

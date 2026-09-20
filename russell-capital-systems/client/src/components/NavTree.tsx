// Recursive navigation renderer — PR-2b.
//
// Ported from the NavTreeNode renderer in russell-capital-app, reduced to the
// minimum this repository needs: arbitrary nesting depth, collapsible folders,
// and active-ancestor auto-expansion. The donor's placeholder routing, favorites
// and colour maps are deliberately left out of this pass.
//
// Additive: nothing renders this yet. AppShell.tsx is unchanged and still drives
// the live sidebar from NAV_SECTIONS.

import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ChevronDown, ChevronRight } from "lucide-react";
import { type NavNode, collectPaths } from "@/lib/navTree";

function isActive(location: string, path: string): boolean {
  if (location === path) return true;
  return path !== "/portal" && location.startsWith(path + "/");
}

export function NavTreeNodeView({
  node,
  depth,
  location,
  onNavigate,
}: {
  node: NavNode;
  depth: number;
  location: string;
  onNavigate?: () => void;
}) {
  const paths = useMemo(() => collectPaths(node), [node]);
  const hasActive = paths.some((p) => isActive(location, p));
  const [open, setOpen] = useState(depth === 0 || hasActive || !!node.defaultOpen);

  useEffect(() => {
    if (hasActive) setOpen(true);
  }, [hasActive]);

  if (node.children?.length) {
    return (
      <div data-testid={`navtree-folder-${node.label}`}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="w-full flex items-center gap-1.5 px-3 py-1.5 text-left text-[12px] font-semibold text-slate-300 hover:text-white"
          style={{ paddingLeft: `${12 + depth * 12}px` }}
        >
          {open ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
          <span className="truncate">{node.label}</span>
          <span className="ml-auto text-[10px] text-slate-500 tabular-nums">{paths.length}</span>
        </button>
        {open && (
          <div>
            {node.children.map((child, i) => (
              <NavTreeNodeView
                key={`${child.label}-${i}`}
                node={child}
                depth={depth + 1}
                location={location}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (!node.path) return null;

  const active = isActive(location, node.path);
  return (
    <Link
      href={node.path}
      onClick={onNavigate}
      data-testid={`navtree-leaf-${node.path}`}
      className={`block truncate px-3 py-1 text-[12px] ${
        active ? "text-emerald-400 font-semibold" : "text-slate-400 hover:text-slate-200"
      }`}
      style={{ paddingLeft: `${24 + depth * 12}px` }}
    >
      {node.label}
    </Link>
  );
}

export function NavTree({
  nodes,
  location,
  onNavigate,
}: {
  nodes: NavNode[];
  location: string;
  onNavigate?: () => void;
}) {
  return (
    <nav data-testid="navtree-root">
      {nodes.map((node, i) => (
        <NavTreeNodeView
          key={`${node.label}-${i}`}
          node={node}
          depth={0}
          location={location}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}

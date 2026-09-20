/**
 * NavTreeView — recursive renderer for navTree.ts.
 *
 * ADDITIVE. This renders the ported category tree as a second way to browse
 * the application. It does not replace, wrap, or modify AppShell's existing
 * navigation, and it removes nothing from it.
 *
 * Why additive rather than a replacement: the ported tree covers 147 of this
 * application's 330 routes, while AppShell's existing navigation references
 * 171. Eighty-nine of those are absent from the tree. Rendering the tree
 * *instead of* the current menu would therefore orphan 89 entries that are
 * reachable today — so it renders alongside instead.
 */
import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ChevronRight } from "lucide-react";
import { type NavNode, MEDICAL_TREE, collectPaths } from "@/navTree";

// No purple/violet anywhere in client/src — repo rule, enforced by
// server/concept16Homepage.test.ts. The donor palette had one; it is dropped.
const COLOR: Record<string, string> = {
  green: "text-emerald-300",
  blue: "text-blue-300",
  cyan: "text-cyan-300",
  amber: "text-amber-300",
  orange: "text-orange-300",
  emerald: "text-emerald-200",
  rose: "text-rose-300",
  red: "text-red-300",
  slate: "text-slate-300",
  teal: "text-teal-300",
  indigo: "text-indigo-300",
  gold: "text-yellow-300",
};

function TreeNode({
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
  const hasActive = paths.some(
    (p) => location === p || (p !== "/portal" && location.startsWith(p)),
  );
  const [open, setOpen] = useState(hasActive || !!node.defaultOpen);

  // ── leaf ────────────────────────────────────────────────────────────────
  if (node.path) {
    const active = location === node.path;
    return (
      <Link
        href={node.path}
        onClick={onNavigate}
        className={`block truncate rounded px-2 py-1 text-[12px] transition ${
          active
            ? "bg-amber-500/15 text-amber-300"
            : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
        }`}
        style={{ paddingLeft: `${8 + depth * 10}px` }}
        title={node.label}
      >
        {node.label}
      </Link>
    );
  }

  // ── folder ──────────────────────────────────────────────────────────────
  const tint = node.color ? COLOR[node.color] ?? "text-slate-300" : "text-slate-300";
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex w-full items-center gap-1 rounded px-2 py-1 text-left text-[12px] font-medium transition hover:bg-slate-800/60 ${
          hasActive ? "text-amber-300" : tint
        }`}
        style={{ paddingLeft: `${6 + depth * 10}px` }}
      >
        <ChevronRight
          size={11}
          className={`flex-shrink-0 opacity-60 transition-transform ${open ? "rotate-90" : ""}`}
        />
        <span className="flex-1 truncate">{node.label}</span>
        <span className="text-[9px] tabular-nums opacity-40">{paths.length}</span>
      </button>
      {open && node.children && (
        <div className="border-l border-slate-800/60 ml-2">
          {node.children.map((child, i) => (
            <TreeNode
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

export default function NavTreeView({
  nodes = MEDICAL_TREE,
  onNavigate,
}: {
  nodes?: NavNode[];
  onNavigate?: () => void;
}) {
  const [location] = useLocation();
  return (
    <nav aria-label="Browse by category" className="space-y-0.5">
      {nodes.map((node, i) => (
        <TreeNode
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

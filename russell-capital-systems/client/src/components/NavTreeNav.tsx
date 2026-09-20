// ─────────────────────────────────────────────────────────────────────────────
// NavTreeNav — renderer for `client/src/navTree.ts` (PR-2b).
//
// Deliberately self-contained. The donor's renderer lived inside its AppShell
// and reached into that file's COLOR_MAP / COLOR_DOT_MAP / favourites plumbing,
// and it routed placeholder leaves to a `/portal/nav-placeholder` page this
// build does not have. Porting it that way would have meant either exporting
// AppShell internals or adding a route — both larger than this change needs to
// be. So the colour lookup is local and a placeholder renders as plain
// non-interactive text: no new route, no new dependency, nothing exported from
// AppShell.
//
// This is an ADDITIONAL navigation mode. It does not replace NAV_SECTIONS.
// The existing sidebar surfaces 88 paths this tree does not contain, so
// swapping one for the other would orphan them.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import { type NavNode, MEDICAL_TREE, collectPaths } from "@/navTree";

// Mirrors AppShell's COLOR_MAP / COLOR_DOT_MAP exactly, including the
// deliberate `purple -> emerald` alias: this client ships no purple, and
// `server/concept16Homepage.test.ts` fails the build if any reappears. The tree
// data still carries `color: "purple"` on six nodes, inherited from the donor;
// aliasing here keeps that data untouched while honouring the house palette.
const COLOR: Record<string, string> = {
  green:   "text-emerald-300",
  blue:    "text-blue-300",
  cyan:    "text-cyan-300",
  purple:  "text-emerald-300",
  amber:   "text-amber-300",
  orange:  "text-orange-300",
  emerald: "text-emerald-200",
  rose:    "text-rose-300",
  red:     "text-red-300",
  slate:   "text-slate-300",
  teal:    "text-teal-300",
  indigo:  "text-indigo-300",
  gold:    "text-yellow-300",
};

const DOT: Record<string, string> = {
  green:   "bg-emerald-300",
  blue:    "bg-blue-300",
  cyan:    "bg-cyan-300",
  purple:  "bg-emerald-300",
  amber:   "bg-amber-300",
  orange:  "bg-orange-300",
  emerald: "bg-emerald-200",
  rose:    "bg-rose-300",
  red:     "bg-red-300",
  slate:   "bg-slate-300",
  teal:    "bg-teal-300",
  indigo:  "bg-indigo-300",
  gold:    "bg-yellow-300",
};

function isActive(location: string, path: string) {
  return location === path || (path !== "/portal" && location.startsWith(path + "/"));
}

function TreeNode({
  node,
  depth,
  location,
  onClose,
}: {
  node: NavNode;
  depth: number;
  location: string;
  onClose: () => void;
}) {
  const paths = useMemo(() => collectPaths(node), [node]);
  const hasActive = paths.some((p) => isActive(location, p));
  const [open, setOpen] = useState(depth === 0 || hasActive || !!node.defaultOpen);

  // Re-open an ancestor when navigation lands inside a collapsed subtree.
  useEffect(() => {
    if (hasActive) setOpen(true);
  }, [hasActive]);

  // ── Folder ────────────────────────────────────────────────────────────────
  if (node.children?.length) {
    const tone = node.color ? COLOR[node.color] : "text-[#7a95b8]";
    const dot = node.color ? DOT[node.color] : "";
    const label =
      depth === 0
        ? "text-[11px] uppercase tracking-[0.12em] font-extrabold"
        : depth === 1
          ? "text-[11px] font-semibold"
          : "text-[11px]";

    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className={`flex w-full items-center gap-2 py-1.5 pr-2 transition-colors ${label} ${
            hasActive ? "text-[#22c55e]" : `${tone} hover:brightness-125`
          }`}
          style={{ paddingLeft: `${12 + depth * 10}px` }}
        >
          {node.color && depth === 0 && (
            <span className={`h-1 w-1 flex-shrink-0 rounded-full ${dot}`} />
          )}
          <span className="flex-1 text-left">{node.label}</span>
          <span className="text-[9px] tabular-nums opacity-40">{paths.length || ""}</span>
          <ChevronRight
            size={11}
            className={`flex-shrink-0 opacity-60 transition-transform ${open ? "rotate-90" : ""}`}
          />
        </button>
        {open && <div>{node.children.map((c, i) => (
          <TreeNode key={`${c.label}-${i}`} node={c} depth={depth + 1} location={location} onClose={onClose} />
        ))}</div>}
      </div>
    );
  }

  // ── Placeholder leaf ──────────────────────────────────────────────────────
  // A route this build does not have yet. Shown so the tree's shape stays
  // honest, rendered dead so nobody clicks into a 404.
  if (node.isPlaceholder || !node.path) {
    return (
      <div
        className="cursor-default py-1 pr-2 text-[11px] text-[#3d5573] select-none"
        style={{ paddingLeft: `${12 + depth * 10}px` }}
        title="Not available in this build yet"
      >
        {node.label}
      </div>
    );
  }

  // ── Link leaf ─────────────────────────────────────────────────────────────
  const active = isActive(location, node.path);
  return (
    <Link
      href={node.path}
      onClick={onClose}
      className={`block py-1 pr-2 text-[11px] transition-colors ${
        active ? "font-semibold text-[#22c55e]" : "text-[#8ba3c0] hover:text-[#cfe0f5]"
      }`}
      style={{ paddingLeft: `${12 + depth * 10}px` }}
    >
      {node.label}
    </Link>
  );
}

export function NavTreeNav({ location, onClose }: { location: string; onClose: () => void }) {
  return (
    <div className="pb-2">
      {MEDICAL_TREE.map((tab, i) => (
        <TreeNode key={`${tab.label}-${i}`} node={tab} depth={0} location={location} onClose={onClose} />
      ))}
    </div>
  );
}

export default NavTreeNav;

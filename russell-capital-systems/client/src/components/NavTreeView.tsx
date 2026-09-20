// ─── NavTreeView ────────────────────────────────────────────────────────────
//
// The minimum renderer for the ported `navTree.ts`: a recursive disclosure
// list, four levels deep, with placeholders drawn as non-clickable labels.
//
// DELIBERATELY NOT WIRED INTO AppShell. The existing sidebar — `NAV_SECTIONS`
// in `AppShell.tsx`, with its own collapsible sections, favourites, scores and
// three test suites asserting its shape — keeps rendering exactly as it does
// today. Mounting this in its place would replace a navigation system rather
// than add one, orphan the entries `NAV_SECTIONS` carries that this tree does
// not, and break `navigation-organization.test.ts`, `grok-merge.smoke.test.ts`
// and `integrationAudit.test.ts` in one go.
//
// So this ships as an available component with its behaviour under test, and
// wiring it anywhere is a separate decision with its own PR. Render it by
// importing it; nothing does yet.
//
// Every target passes through `resolveNavTree` first, so a node that is not a
// real route in this application renders as a placeholder and is not clickable.
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import { MEDICAL_TREE, type NavNode } from "@/navTree";
import { resolveNavTree, type ResolvedNavNode } from "@/lib/navTreeResolver";

/**
 * Colour tags → Tailwind classes, mirroring `COLOR_MAP` in `AppShell.tsx` so
 * this tree tints identically to the existing sidebar.
 *
 * Note the `purple` tag: the tree carries it on six sections, but this client
 * has a house rule — enforced by `concept16Homepage.test.ts`, "shows no purple
 * anywhere in the client" — that bans those utility classes outright, and it
 * greps file contents, so even naming them in a comment trips it.
 * `AppShell.tsx` resolves the same tension the same way, resolving that tag to
 * emerald. Matching it here keeps one palette rather than two, and keeps the
 * tag usable without reaching for a banned class.
 */
const COLOR: Record<string, string> = {
  green: "text-emerald-300",
  blue: "text-blue-300",
  cyan: "text-cyan-300",
  purple: "text-emerald-300",
  amber: "text-amber-300",
  orange: "text-orange-300",
  emerald: "text-emerald-200",
  rose: "text-rose-300",
  red: "text-red-300",
  teal: "text-teal-300",
  indigo: "text-indigo-300",
  gold: "text-yellow-300",
  slate: "text-slate-300",
};

function Node({
  node,
  depth,
  location,
  onNavigate,
}: {
  node: ResolvedNavNode;
  depth: number;
  location?: string;
  onNavigate?: () => void;
}) {
  const hasChildren = Boolean(node.children?.length);
  const activeInside = useMemo(
    () => (location ? subtreeHasPath(node, location) : false),
    [node, location],
  );
  const [open, setOpen] = useState(Boolean(node.defaultOpen) || activeInside);

  const tint = node.color ? (COLOR[node.color] ?? "text-slate-300") : "text-slate-300";
  const pad = { paddingLeft: `${0.5 + depth * 0.75}rem` };

  if (hasChildren) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`flex w-full items-center gap-1.5 py-1 pr-2 text-left text-[11px] font-bold uppercase tracking-[0.1em] transition-colors ${
            activeInside ? "text-[#22c55e]" : tint
          }`}
          style={pad}
        >
          <ChevronRight
            size={11}
            aria-hidden
            className={`flex-shrink-0 opacity-60 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
          />
          <span className="flex-1">{node.label}</span>
        </button>
        {open && (
          <div>
            {node.children!.map((child, i) => (
              <Node
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

  // A placeholder: either authored as one, or demoted by the resolver because
  // its target is not a route in this application. Never clickable.
  if (!node.path) {
    return (
      <div
        style={pad}
        title={node.unresolvedPath ? `Not available here yet: ${node.unresolvedPath}` : undefined}
        className="py-1 pr-2 text-[13px] text-[#5a7a9e]"
      >
        {node.label}
        <span className="ml-1.5 text-[9px] uppercase tracking-[0.12em] opacity-70">soon</span>
      </div>
    );
  }

  const isActive = location === node.path;
  return (
    <Link
      href={node.path}
      onClick={onNavigate}
      style={pad}
      className={`flex items-center py-1 pr-2 text-[13px] transition-colors ${
        isActive ? "font-semibold text-[#22c55e]" : "text-[#c8d8e8] hover:text-white"
      }`}
    >
      {node.label}
    </Link>
  );
}

function subtreeHasPath(node: NavNode, path: string): boolean {
  if (node.path === path) return true;
  return (node.children ?? []).some((c) => subtreeHasPath(c, path));
}

export function NavTreeView({
  tree = MEDICAL_TREE,
  location,
  onNavigate,
}: {
  tree?: readonly NavNode[];
  location?: string;
  onNavigate?: () => void;
}) {
  const resolved = useMemo(() => resolveNavTree(tree), [tree]);
  return (
    <nav aria-label="Navigation tree" className="flex flex-col">
      {resolved.map((node, i) => (
        <Node key={`${node.label}-${i}`} node={node} depth={0} location={location} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}

export default NavTreeView;

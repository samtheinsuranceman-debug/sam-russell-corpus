/**
 * Recursive navigation tree renderer.
 *
 * Renders `shared/navTree.ts` after resolution against the route manifest. The
 * existing `NAV_SECTIONS` sidebar is untouched and remains the default; this is
 * an additional view, selected by a toggle in AppShell.
 *
 * ─── THE ONE RULE ───────────────────────────────────────────────────────────
 *
 * A node that did not resolve is NOT a link. It renders as present-but-inactive
 * with a "not here yet" title, because 124 of the tree's 271 targets are routes
 * this application does not register. A dead link is indistinguishable from a
 * working one until it is clicked, and a menu that lies about what the product
 * does costs more than a menu that is short.
 *
 * Depth is unbounded by design — the tree reaches five levels today and the
 * renderer does not care how deep it goes. Indentation is capped so a deep
 * branch does not walk off the edge of a narrow sidebar.
 */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ChevronRight, Circle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { MEDICAL_TREE } from "@shared/navTree";
import { resolveNavTree, type ResolvedNavNode } from "@shared/navTreeResolve";

/** Indentation stops growing past this depth; deeper branches stay readable. */
const MAX_INDENT_DEPTH = 4;
const INDENT_PX = 10;

function NodeRow({ node, depth }: { node: ResolvedNavNode; depth: number }) {
  const [location] = useLocation();
  const isFolder = Array.isArray(node.children) && node.children.length > 0;
  const [open, setOpen] = useState(Boolean(node.defaultOpen) || depth === 1);

  const pad = { paddingLeft: `${Math.min(depth, MAX_INDENT_DEPTH) * INDENT_PX}px` };

  if (isFolder) {
    return (
      <li>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          style={pad}
          className="w-full flex items-center gap-1.5 py-1.5 pr-2 text-left text-[12.5px] text-slate-300 hover:text-white transition-colors"
        >
          <ChevronRight
            className={cn("w-3 h-3 shrink-0 text-slate-600 transition-transform", open && "rotate-90")}
          />
          <span className="truncate">{node.label}</span>
        </button>
        {open && (
          <ul>
            {node.children!.map((child, i) => (
              <NodeRow key={`${child.label}-${i}`} node={child} depth={depth + 1} />
            ))}
          </ul>
        )}
      </li>
    );
  }

  // Unresolved or authored placeholder — deliberately not a link.
  if (node.placeholder || !node.path) {
    return (
      <li>
        <span
          style={pad}
          title={node.path ? `${node.path} is not available in this build` : "Not built yet"}
          aria-disabled="true"
          className="flex items-center gap-1.5 py-1.5 pr-2 text-[12.5px] text-slate-600 cursor-default select-none"
        >
          <Lock className="w-2.5 h-2.5 shrink-0 opacity-60" />
          <span className="truncate">{node.label}</span>
        </span>
      </li>
    );
  }

  const active = location === node.path;
  return (
    <li>
      <Link
        href={node.path}
        style={pad}
        className={cn(
          "flex items-center gap-1.5 py-1.5 pr-2 text-[12.5px] transition-colors",
          active ? "text-amber-400 font-medium" : "text-slate-400 hover:text-white",
        )}
      >
        <Circle className={cn("w-1.5 h-1.5 shrink-0", active ? "fill-amber-400 text-amber-400" : "text-slate-700")} />
        <span className="truncate">{node.label}</span>
      </Link>
    </li>
  );
}

export function NavTree() {
  const { tree, stats } = resolveNavTree(MEDICAL_TREE);

  return (
    <nav aria-label="Navigation tree" className="py-2">
      <ul>
        {tree.map((section, i) => (
          <NodeRow key={`${section.label}-${i}`} node={section} depth={1} />
        ))}
      </ul>
      {/*
        Stated, not hidden. Somebody looking at greyed-out entries deserves to
        know how many there are and that it is a known gap rather than a bug.
      */}
      {stats.unresolved > 0 && (
        <p className="px-3 pt-3 mt-2 border-t border-[#1e3a5f]/40 text-[10.5px] text-slate-600 leading-relaxed">
          {stats.resolved} of {stats.resolved + stats.unresolved} links active.{" "}
          {stats.unresolved} point at pages not in this build and are shown inactive.
        </p>
      )}
    </nav>
  );
}

export default NavTree;

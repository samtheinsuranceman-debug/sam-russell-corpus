// ─── NavTree renderer ───────────────────────────────────────────────────────
//
// Recursive renderer for the navigation tree in @/navTree. Ported from
// russell-capital-app (commit ef74f3f) by PR-2b.
//
// ## Deliberately not wired into AppShell
//
// This component is exported and tested but not yet mounted in the existing
// sidebar. That is the point of a small PR: AppShell's NAV_SECTIONS is the live
// navigation and `server/navigation-organization.test.ts` guards it, so swapping
// it out here would make this change un-reviewable and could regress a green
// build. Mounting is a follow-up PR once the tree itself is reviewed.
//
// ## Two differences from the donor's version
//
//   1. The donor routed placeholder leaves to `/portal/nav-placeholder`, passing
//      the label and breadcrumb trail as query params. This application does not
//      serve that route, and adding it would mean touching the route table and
//      manifest — outside this PR. Placeholders therefore render as inert,
//      non-navigating rows marked "soon", which needs no new route.
//
//   2. Icon tags resolve through ICON_MAP here rather than in the shell, so the
//      component is self-contained.
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Activity, AlertTriangle, Archive, Award, BarChart3, Brain, Briefcase, ChevronDown, ChevronRight,
  ClipboardList, Clock, Compass, Crown, Dna, DollarSign, FileCheck, FileText, Gauge, GraduationCap,
  Heart, HeartPulse, Home, Landmark, Layers, Leaf, Lock, Network, PiggyBank, Presentation, Receipt,
  Recycle, Scale, Search, Shield, Target, TrendingUp, Trophy, Users, Wallet, Zap,
  type LucideIcon,
} from "lucide-react";
import { MEDICAL_TREE, collectPaths, type IconTag, type NavNode } from "@/navTree";

/** Icon tags used by navTree resolved to components. */
const ICON_MAP: Record<IconTag, LucideIcon> = {
  stethoscope: Activity, heart: Heart, "heart-pulse": HeartPulse, activity: Activity, leaf: Leaf,
  search: Search, presentation: Presentation, clock: Clock, trophy: Trophy, dna: Dna,
  "clipboard-list": ClipboardList, "bar-chart": BarChart3, network: Network, archive: Archive,
  layers: Layers, shield: Shield, briefcase: Briefcase, users: Users, dollar: DollarSign, zap: Zap,
  "piggy-bank": PiggyBank, landmark: Landmark, receipt: Receipt, lock: Lock, brain: Brain,
  "trending-up": TrendingUp, home: Home, recycle: Recycle, graduation: GraduationCap, crown: Crown,
  "file-text": FileText, target: Target, compass: Compass, scale: Scale,
  "alert-triangle": AlertTriangle, wallet: Wallet, award: Award, gauge: Gauge, "file-check": FileCheck,
};

/**
 * The tree's colour categories mapped to classes this client already uses.
 *
 * Covers all twelve categories present in navTree. One substitution: the donor's
 * "purple" category maps to indigo instead, because this client forbids that hue
 * outright — server/concept16Homepage.test.ts greps client/src for its Tailwind
 * prefixes and hex values and fails on any hit, including inside comments, which
 * is why none are spelled out here. Indigo is the nearest allowed hue and is
 * already used in 25 files. Do not reintroduce the banned one.
 */
const COLOR_MAP: Record<string, string> = {
  green: "text-emerald-400",
  emerald: "text-emerald-400",
  teal: "text-teal-400",
  cyan: "text-cyan-400",
  blue: "text-sky-400",
  indigo: "text-indigo-400",
  purple: "text-indigo-400", // substituted — see note above
  rose: "text-rose-400",
  red: "text-red-400",
  orange: "text-orange-400",
  amber: "text-amber-400",
  gold: "text-yellow-400",
  slate: "text-slate-400",
};

function iconFor(node: NavNode) {
  if (typeof node.icon !== "string") return null;
  return ICON_MAP[node.icon as IconTag] ?? null;
}

/** True when `location` is at or inside `path`. `/portal` is matched exactly. */
export function isPathActive(location: string, path: string): boolean {
  if (location === path) return true;
  if (path === "/portal") return false;
  return location.startsWith(path.endsWith("/") ? path : `${path}/`);
}

function NavTreeNode({
  node, depth, location, onNavigate,
}: {
  node: NavNode;
  depth: number;
  location: string;
  onNavigate?: () => void;
}) {
  const subtreePaths = useMemo(() => collectPaths(node), [node]);
  const hasActive = subtreePaths.some((p) => isPathActive(location, p));
  const [open, setOpen] = useState(depth === 0 || hasActive || !!node.defaultOpen);

  // Expand to reveal the active page when the route changes under a closed folder.
  useEffect(() => {
    if (hasActive) setOpen(true);
  }, [hasActive]);

  const Icon = iconFor(node);
  const colorClass = node.color ? COLOR_MAP[node.color] ?? "text-slate-400" : "text-slate-400";

  // ── Folder ────────────────────────────────────────────────────────────────
  if (node.children) {
    const Chevron = open ? ChevronDown : ChevronRight;
    return (
      <li>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-slate-800/60"
          style={{ paddingLeft: `${8 + depth * 12}px` }}
        >
          <Chevron className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden="true" />
          {Icon && <Icon className={`h-4 w-4 shrink-0 ${colorClass}`} aria-hidden="true" />}
          <span className={hasActive ? "font-semibold text-white" : "text-slate-300"}>{node.label}</span>
          <span className="ml-auto text-[10px] tabular-nums text-slate-600">{subtreePaths.length}</span>
        </button>
        {open && (
          <ul>
            {node.children.map((child, i) => (
              <NavTreeNode
                key={`${child.label}-${i}`}
                node={child}
                depth={depth + 1}
                location={location}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        )}
      </li>
    );
  }

  // ── Placeholder leaf: inert, no route required ────────────────────────────
  if (node.isPlaceholder) {
    return (
      <li>
        <span
          aria-disabled="true"
          title="Not available yet"
          className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-slate-600"
          style={{ paddingLeft: `${20 + depth * 12}px` }}
        >
          {node.label}
          <span className="ml-auto rounded bg-slate-800 px-1.5 text-[10px] text-slate-500">soon</span>
        </span>
      </li>
    );
  }

  // ── Live leaf ─────────────────────────────────────────────────────────────
  if (!node.path) return null;
  const active = isPathActive(location, node.path);
  return (
    <li>
      <Link
        href={node.path}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors ${
          active ? "bg-emerald-500/10 font-semibold text-emerald-300" : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
        }`}
        style={{ paddingLeft: `${20 + depth * 12}px` }}
      >
        {node.label}
      </Link>
    </li>
  );
}

/**
 * Renders a navigation tree. Defaults to MEDICAL_TREE from @/navTree.
 * `onNavigate` fires after a leaf is clicked — used by a mobile drawer to close.
 */
export default function NavTree({
  tree = MEDICAL_TREE,
  onNavigate,
}: {
  tree?: NavNode[];
  onNavigate?: () => void;
}) {
  const [location] = useLocation();
  return (
    <nav aria-label="Platform navigation">
      <ul>
        {tree.map((node, i) => (
          <NavTreeNode
            key={`${node.label}-${i}`}
            node={node}
            depth={0}
            location={location}
            onNavigate={onNavigate}
          />
        ))}
      </ul>
    </nav>
  );
}

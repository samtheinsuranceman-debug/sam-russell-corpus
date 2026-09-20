// ============================================================
// NavTree — recursive renderer for the nested navigation tree.
//
// The existing sidebar in AppShell is two levels: section → item. It cannot
// express a branch, so a 26-item group renders as 26 flat links. This renders
// `NavNode` to arbitrary depth, which is the whole point of porting the tree.
//
// ## Deliberately NOT wired into AppShell in this PR
//
// Mounting this in place of `NAV_SECTIONS` would swap the live navigation in
// the same change that introduces it. Two separate risks in one diff, and the
// tree currently covers 147 of the 330 routes — switching now would strand the
// other 183 behind a menu that no longer lists them.
//
// So this PR lands the renderer and its tests, and nothing changes on screen.
// A follow-up PR does the swap, once the coverage gap is closed and the
// before/after can be reviewed on its own.
// ============================================================
import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Activity,
  AlertTriangle,
  Archive,
  Award,
  BarChart3,
  Brain,
  Briefcase,
  ChevronRight,
  Clipboard,
  Clock,
  Compass,
  Crown,
  DollarSign,
  Dna,
  FileCheck,
  FileText,
  Gauge,
  GraduationCap,
  Heart,
  HeartPulse,
  Home,
  Landmark,
  Layers,
  Leaf,
  Lock,
  Network,
  PiggyBank,
  Presentation,
  Receipt,
  Recycle,
  Scale,
  Search,
  Shield,
  Stethoscope,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { type NavNode, type IconTag } from "@/navTree";

/**
 * Icon tags are strings in the tree so that `navTree.ts` carries no React or
 * lucide import and can be read by a node-environment test. The mapping lives
 * here, at the boundary where components are already in scope.
 */
export const ICON_MAP: Record<IconTag, LucideIcon> = {
  stethoscope: Stethoscope,
  heart: Heart,
  "heart-pulse": HeartPulse,
  activity: Activity,
  leaf: Leaf,
  search: Search,
  presentation: Presentation,
  clock: Clock,
  trophy: Trophy,
  dna: Dna,
  "clipboard-list": Clipboard,
  "bar-chart": BarChart3,
  network: Network,
  archive: Archive,
  layers: Layers,
  shield: Shield,
  briefcase: Briefcase,
  users: Users,
  dollar: DollarSign,
  zap: Zap,
  "piggy-bank": PiggyBank,
  landmark: Landmark,
  receipt: Receipt,
  lock: Lock,
  brain: Brain,
  "trending-up": TrendingUp,
  home: Home,
  recycle: Recycle,
  graduation: GraduationCap,
  crown: Crown,
  "file-text": FileText,
  target: Target,
  compass: Compass,
  scale: Scale,
  "alert-triangle": AlertTriangle,
  wallet: Wallet,
  award: Award,
  gauge: Gauge,
  "file-check": FileCheck,
};

/** A node is a folder when it has children — not when it lacks a path. */
export function isFolder(node: NavNode): boolean {
  return Array.isArray(node.children) && node.children.length > 0;
}

/**
 * A placeholder is a named position in the taxonomy whose page does not exist
 * in this repository yet. It renders as text, never as a link, which is what
 * keeps the 124 ported-but-absent entries from becoming 404s.
 */
export function isPlaceholder(node: NavNode): boolean {
  return node.isPlaceholder === true || (!isFolder(node) && !node.path);
}

function NavLeaf({ node, depth }: { node: NavNode; depth: number }) {
  const [location] = useLocation();
  const pad = { paddingLeft: `${depth * 12 + 12}px` };

  if (isPlaceholder(node)) {
    return (
      <div
        style={pad}
        className="cursor-default select-none py-1 pr-2 text-xs text-slate-600"
        title="Not available in this build yet"
      >
        {node.label}
      </div>
    );
  }

  const active = location === node.path;
  return (
    <Link
      href={node.path!}
      style={pad}
      className={`block rounded py-1 pr-2 text-sm transition-colors ${
        active
          ? "bg-emerald-400/15 font-medium text-emerald-200"
          : "text-slate-300 hover:bg-white/5 hover:text-white"
      }`}
    >
      {node.label}
    </Link>
  );
}

function NavFolder({ node, depth }: { node: NavNode; depth: number }) {
  const [open, setOpen] = useState(node.defaultOpen === true);
  const pad = { paddingLeft: `${depth * 12 + 8}px` };

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={pad}
        className="flex w-full items-center gap-1.5 rounded py-1 pr-2 text-left text-sm font-medium text-slate-200 hover:bg-white/5"
      >
        <ChevronRight
          className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform ${
            open ? "rotate-90" : ""
          }`}
        />
        <span className="truncate">{node.label}</span>
      </button>
      {open && (
        <div>
          {node.children!.map((child) => (
            <NavTreeNode key={`${child.label}-${child.path ?? "f"}`} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function NavTreeNode({ node, depth = 0 }: { node: NavNode; depth?: number }) {
  return isFolder(node) ? <NavFolder node={node} depth={depth} /> : <NavLeaf node={node} depth={depth} />;
}

/** Render a whole tree. `roots` is normally `MEDICAL_TREE`. */
export function NavTree({ roots }: { roots: readonly NavNode[] }) {
  return (
    <nav aria-label="Section navigation" className="space-y-0.5">
      {roots.map((n) => (
        <NavTreeNode key={`${n.label}-${n.path ?? "f"}`} node={n} depth={0} />
      ))}
    </nav>
  );
}

export default NavTree;

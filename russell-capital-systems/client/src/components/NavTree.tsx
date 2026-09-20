// Renderer for MEDICAL_TREE (client/src/navTree.ts).
//
// The tree file is deliberately free of React so it can be imported by a node
// test; every icon there is a string tag, and ICON_MAP below is where those
// tags become components. A leaf with a `path` renders as a link; a leaf marked
// `isPlaceholder` renders as dimmed, unclickable text, because its page has not
// been migrated into this build yet.
//
// This is an addition to the sidebar, not a replacement: NAV_SECTIONS and
// SphereNav are untouched and remain the default.
import { useState } from "react";
import { Link } from "wouter";
import {
  Activity, AlertTriangle, Archive, Award, BarChart3, Brain, Briefcase,
  ChevronDown, ChevronRight, ClipboardList, Clock, Compass, Crown, Dna,
  DollarSign, FileCheck, FileText, Gauge, GraduationCap, Heart, HeartPulse,
  Home, Landmark, Layers, Leaf, Lock, Network, PiggyBank, Presentation,
  Receipt, Recycle, Scale, Search, Shield, Stethoscope, Target, TrendingUp,
  Trophy, Users, Wallet, Zap,
} from "lucide-react";
import { MEDICAL_TREE, type IconTag, type NavNode } from "@/navTree";

const ICON_MAP: Record<IconTag, typeof Activity> = {
  stethoscope: Stethoscope, heart: Heart, "heart-pulse": HeartPulse,
  activity: Activity, leaf: Leaf, search: Search, presentation: Presentation,
  clock: Clock, trophy: Trophy, dna: Dna, "clipboard-list": ClipboardList,
  "bar-chart": BarChart3, network: Network, archive: Archive, layers: Layers,
  shield: Shield, briefcase: Briefcase, users: Users, dollar: DollarSign,
  zap: Zap, "piggy-bank": PiggyBank, landmark: Landmark, receipt: Receipt,
  lock: Lock, brain: Brain, "trending-up": TrendingUp, home: Home,
  recycle: Recycle, graduation: GraduationCap, crown: Crown,
  "file-text": FileText, target: Target, compass: Compass, scale: Scale,
  "alert-triangle": AlertTriangle, wallet: Wallet, award: Award,
  gauge: Gauge, "file-check": FileCheck,
};

/** Depth decides indentation only; the tree runs up to five levels deep. */
function Branch({ node, depth, location, onClose }: {
  node: NavNode; depth: number; location: string; onClose: () => void;
}) {
  const hasChildren = Boolean(node.children?.length);
  const containsActive = hasChildren && subtreeHasPath(node, location);
  const [open, setOpen] = useState<boolean>(Boolean(node.defaultOpen) || containsActive);
  const pad = { paddingLeft: `${0.75 + depth * 0.6}rem` };

  if (!hasChildren) {
    if (node.isPlaceholder || !node.path) {
      return (
        <div
          style={pad}
          className="rc-sidebar-item cursor-default opacity-40"
          title="This page has not been migrated into this build yet"
        >
          {node.label}
        </div>
      );
    }
    const active = location === node.path || location.startsWith(`${node.path}/`);
    return (
      <Link
        href={node.path}
        onClick={onClose}
        style={pad}
        className={`rc-sidebar-item ${active ? "active" : ""}`}
      >
        {node.label}
      </Link>
    );
  }

  const Icon = node.icon ? ICON_MAP[node.icon as IconTag] : undefined;
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={pad}
        aria-expanded={open}
        className="rc-sidebar-item flex w-full items-center justify-between text-left"
      >
        <span className="flex items-center gap-1.5">
          {Icon ? <Icon size={12} /> : null}
          {node.label}
        </span>
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>
      {open && node.children!.map((child, i) => (
        <Branch
          key={`${child.label}-${i}`}
          node={child}
          depth={depth + 1}
          location={location}
          onClose={onClose}
        />
      ))}
    </div>
  );
}

function subtreeHasPath(node: NavNode, location: string): boolean {
  if (node.path && (location === node.path || location.startsWith(`${node.path}/`))) return true;
  return (node.children ?? []).some((c) => subtreeHasPath(c, location));
}

export default function NavTree({ location, onClose }: { location: string; onClose: () => void }) {
  return (
    <div className="pb-2">
      {MEDICAL_TREE.map((section, i) => (
        <Branch key={`${section.label}-${i}`} node={section} depth={0} location={location} onClose={onClose} />
      ))}
    </div>
  );
}

export { ICON_MAP };

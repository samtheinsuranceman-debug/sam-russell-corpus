// ============================================================
// LEFT NAV — the seven tabs, derived from the site map tree, in the shape
// AppShell's NAV_SECTIONS already uses (label / icon / items / subgroups),
// so the swap is one line: `const NAV_SECTIONS = leftNavSections();`.
// Only L1 pages are items; everything else is a hub tab, a deeper button,
// or a map entry, which is what "fewest tabs on the left" means.
// ============================================================
import type { ComponentType } from "react";
import { Activity, Bot, Briefcase, FileText, Landmark, Map as MapIcon, Stethoscope } from "lucide-react";
import { leftNavFromTree, siteMapTree, type TabId } from "@shared/siteMapTree";

export type LeftNavItem = { path: string; label: string; icon: ComponentType<{ size?: number; className?: string }>; color?: string };
export type LeftNavSubgroup = { subLabel: string; color?: string; items: LeftNavItem[] };
export type LeftNavSection = { label: string; icon: ComponentType<{ size?: number; className?: string }>; color?: string; items?: LeftNavItem[]; subgroups?: LeftNavSubgroup[]; defaultOpen?: boolean };

const TAB_ICON: Record<TabId, ComponentType<{ size?: number; className?: string }>> = {
  map: MapIcon, assess: Stethoscope, plan: Landmark, advisor: Bot, reports: FileText, practice: Briefcase, admin: Activity,
};
const TAB_COLOR: Record<TabId, string> = {
  map: "gold", assess: "green", plan: "emerald", advisor: "gold", reports: "slate", practice: "blue", admin: "purple",
};

export function leftNavSections(): LeftNavSection[] {
  const tree = siteMapTree();
  return leftNavFromTree(tree).map(tab => {
    const section: LeftNavSection = { label: tab.label, icon: TAB_ICON[tab.id], color: TAB_COLOR[tab.id], defaultOpen: tab.id === "map" };
    if (tab.id === "map") {
      section.items = [{ path: "/portal/map", label: "Open the map", icon: MapIcon, color: "gold" }];
      return section;
    }
    if (tab.groups.length === 1) {
      section.items = tab.groups[0].leaves.map(l => ({ path: l.path, label: l.title, icon: TAB_ICON[tab.id], color: TAB_COLOR[tab.id] }));
    } else {
      section.subgroups = tab.groups.map(g => ({ subLabel: g.label, color: TAB_COLOR[tab.id], items: g.leaves.map(l => ({ path: l.path, label: l.title, icon: TAB_ICON[tab.id], color: TAB_COLOR[tab.id] })) }));
    }
    return section;
  });
}

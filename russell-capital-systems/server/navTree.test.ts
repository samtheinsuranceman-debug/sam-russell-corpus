// ─── navTree structure ──────────────────────────────────────────────────────
//
// The tree itself: shape, integrity, and the resolver's behaviour on it.
// Route-target validation against the manifest is the sibling suite,
// `navTree-route-targets.test.ts`.
import { describe, expect, it } from "vitest";
import { MEDICAL_TREE, collectPaths, flattenNavTree, type NavNode } from "../client/src/navTree";
import {
  resolveNavTree,
  allTargets,
  resolvedTargets,
  unresolvedTargets,
  flattenResolved,
  navTreeStats,
  isRoutable,
} from "../client/src/lib/navTreeResolver";

function walk(nodes: readonly NavNode[], visit: (n: NavNode, depth: number) => void, depth = 0) {
  for (const n of nodes) {
    visit(n, depth);
    if (n.children) walk(n.children, visit, depth + 1);
  }
}

describe("navTree structure", () => {
  it("has the ten top-level sections it was ported with", () => {
    expect(MEDICAL_TREE).toHaveLength(10);
    expect(MEDICAL_TREE.map((s) => s.label)).toEqual([
      "Health Check Reports",
      "Medicine",
      "Treatment Center",
      "Wellness Coaching",
      "Financial Diet",
      "Wealth Scanning",
      "Procedures Center",
      "Longevity Management",
      "Patients",
      "Wealth Genome",
    ]);
  });

  it("gives every node a non-empty label", () => {
    const unlabelled: string[] = [];
    walk(MEDICAL_TREE, (n) => {
      if (!n.label || !n.label.trim()) unlabelled.push(JSON.stringify(n));
    });
    expect(unlabelled).toEqual([]);
  });

  it("makes every node either a folder, a link, or a placeholder — never two at once", () => {
    const bad: string[] = [];
    walk(MEDICAL_TREE, (n) => {
      const kinds = [Boolean(n.children?.length), Boolean(n.path), Boolean(n.isPlaceholder)].filter(Boolean).length;
      if (kinds !== 1) bad.push(`${n.label}: children=${Boolean(n.children?.length)} path=${n.path ?? "-"} placeholder=${Boolean(n.isPlaceholder)}`);
    });
    expect(bad, `nodes with an ambiguous kind:\n${bad.join("\n")}`).toEqual([]);
  });

  it("never nests a folder with no children", () => {
    const empty: string[] = [];
    walk(MEDICAL_TREE, (n) => {
      if (n.children && n.children.length === 0) empty.push(n.label);
    });
    expect(empty).toEqual([]);
  });

  it("stays within four levels of nesting", () => {
    let max = 0;
    walk(MEDICAL_TREE, (_n, d) => { max = Math.max(max, d); });
    expect(max).toBeLessThanOrEqual(4);
  });

  /**
   * Targets the donor tree places in more than one location, with the reason.
   *
   * The existing sidebar holds itself to "each destination in only one
   * left-sidebar location" (`navigation-organization.test.ts`), and this tree
   * should too. This one came across from the donor already duplicated. It is
   * listed rather than tolerated, and the following test asserts each entry is
   * still genuinely duplicated — so a fix has to remove it from here, and a new
   * duplicate cannot be added without failing.
   */
  const KNOWN_DUPLICATE_TARGETS: Record<string, string> = {
    "/portal/mortgage-killer":
      "Ported already duplicated: appears under Treatment Center → Mortgage Killer → Payoff Operations (navTree.ts:254) and again under Financial Diet → Mortgage Killer → Payoff Coaching (navTree.ts:532). Both are the same destination. Resolving it means deciding which section owns it — a content decision, not a port decision, so it is recorded here rather than silently edited out of a verbatim port.",
  };

  it("points each target at exactly one place in the tree, except the ones written down", () => {
    const seen = new Map<string, number>();
    for (const t of allTargets(MEDICAL_TREE)) seen.set(t, (seen.get(t) ?? 0) + 1);
    const dupes = [...seen.entries()]
      .filter(([p, n]) => n > 1 && !(p in KNOWN_DUPLICATE_TARGETS))
      .map(([p, n]) => `${p} ×${n}`);
    expect(dupes, `targets appearing more than once:\n${dupes.join("\n")}`).toEqual([]);
  });

  it("keeps the duplicate exemptions honest: each must still be a duplicate", () => {
    const seen = new Map<string, number>();
    for (const t of allTargets(MEDICAL_TREE)) seen.set(t, (seen.get(t) ?? 0) + 1);
    for (const [path, reason] of Object.entries(KNOWN_DUPLICATE_TARGETS)) {
      expect(reason.length, `${path} needs a real reason`).toBeGreaterThan(40);
      expect(
        seen.get(path) ?? 0,
        `${path} is no longer duplicated — remove it from KNOWN_DUPLICATE_TARGETS`,
      ).toBeGreaterThan(1);
    }
  });

  it("maps every colour tag the tree uses, without reaching for a forbidden class", () => {
    // The renderer is a .tsx and this suite is server-side, so the map is read
    // as source rather than imported. Two things are checked, and the second
    // caught a real failure during the port: the tree tags six sections
    // `purple`, and this client forbids `purple-`/`violet-` classes outright
    // (`concept16Homepage.test.ts`). AppShell resolves that by rendering the
    // purple tag as emerald; this renderer must do the same.
    const { readFileSync } = require("node:fs") as typeof import("node:fs");
    const { resolve } = require("node:path") as typeof import("node:path");
    const src = readFileSync(resolve("client/src/components/NavTreeView.tsx"), "utf8");
    const map = src.slice(src.indexOf("const COLOR:"), src.indexOf("};", src.indexOf("const COLOR:")));

    const tags = new Set<string>();
    walk(MEDICAL_TREE, (n) => { if (n.color) tags.add(n.color); });
    expect(tags.size).toBeGreaterThan(5);

    const unmapped = Array.from(tags).filter((t) => !new RegExp(`\\b${t}:`).test(map));
    expect(unmapped, `colour tags used by the tree with no entry in NavTreeView's COLOR map:\n${unmapped.join(", ")}`).toEqual([]);

    expect(map, "NavTreeView must not use purple- or violet- classes").not.toMatch(/purple-|violet-/);
  });

  it("keeps the donor's own helpers working", () => {
    // collectPaths and flattenNavTree came across with the file; if a later
    // re-sync changes their contract this fails rather than going unnoticed.
    const viaCollect = MEDICAL_TREE.flatMap(collectPaths);
    expect(viaCollect.length).toBe(allTargets(MEDICAL_TREE).length);
    expect(flattenNavTree(MEDICAL_TREE).size).toBe(new Set(allTargets(MEDICAL_TREE)).size);
  });
});

describe("navTree resolver", () => {
  const resolved = resolveNavTree(MEDICAL_TREE);

  it("preserves section count, labels and order exactly", () => {
    expect(resolved).toHaveLength(MEDICAL_TREE.length);
    expect(resolved.map((s) => s.label)).toEqual(MEDICAL_TREE.map((s) => s.label));
  });

  it("preserves the node count exactly — it demotes, it never drops", () => {
    const count = (nodes: readonly NavNode[]): number =>
      nodes.reduce((n, x) => n + 1 + (x.children ? count(x.children) : 0), 0);
    expect(count(resolved)).toBe(count(MEDICAL_TREE));
  });

  it("leaves no unroutable path behind on a resolved node", () => {
    const leaks: string[] = [];
    walk(resolved, (n) => {
      if (n.path && !isRoutable(n.path)) leaks.push(n.path);
    });
    expect(leaks, `resolved nodes still pointing at non-routes:\n${leaks.join("\n")}`).toEqual([]);
  });

  it("marks every demoted node as a placeholder and records what it wanted", () => {
    const demoted: string[] = [];
    walk(resolved, (n) => {
      const u = (n as { unresolvedPath?: string }).unresolvedPath;
      if (u) {
        demoted.push(u);
        expect(n.isPlaceholder, `${n.label} was demoted but is not a placeholder`).toBe(true);
        expect(n.path, `${n.label} was demoted but kept its path`).toBeUndefined();
      }
    });
    expect(demoted.length).toBe(unresolvedTargets(MEDICAL_TREE).length);
  });

  it("keeps every routable target clickable", () => {
    const live = new Set<string>();
    walk(resolved, (n) => { if (n.path) live.add(n.path); });
    for (const t of resolvedTargets(MEDICAL_TREE)) {
      expect(live.has(t), `${t} resolves but was not kept as a link`).toBe(true);
    }
  });

  it("flattens a resolved tree to routable paths only", () => {
    const map = flattenResolved(resolved);
    expect(map.size).toBe(resolvedTargets(MEDICAL_TREE).length);
    for (const key of map.keys()) expect(isRoutable(key)).toBe(true);
  });

  it("is idempotent — resolving a resolved tree changes nothing", () => {
    expect(JSON.stringify(resolveNavTree(resolved))).toBe(JSON.stringify(resolved));
  });

  it("reports coherent stats", () => {
    const s = navTreeStats(MEDICAL_TREE);
    expect(s.sections).toBe(10);
    expect(s.resolved + s.unresolved).toBe(s.distinctTargets);
    expect(s.distinctTargets).toBeLessThanOrEqual(s.totalTargets);
    expect(s.manifestSize).toBeGreaterThan(300);
  });
});

/**
 * NAV TREE VALIDATION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * `navTree.ts` was authored against a different build of this platform, whose
 * route table is not the same as this one's. Ported verbatim — which is how it
 * is ported, so it stays diffable against its source — **124 of its 271 link
 * targets do not exist in this repository's `ROUTE_MANIFEST`.**
 *
 * Rendering the tree as-authored would therefore put 124 dead links in the
 * sidebar. This module exists so that cannot happen: the tree is pruned to the
 * routes this build actually serves, and the pruned result is what renders.
 *
 * ## Why prune rather than edit the tree
 *
 * Editing `navTree.ts` to delete the 124 unavailable entries would:
 *   - destroy the diff against its source, so future updates cannot be merged;
 *   - silently lose the information that those capabilities exist elsewhere;
 *   - have to be redone by hand every time a route is added here.
 *
 * Pruning at load keeps the tree faithful and makes it self-correcting: when a
 * route later lands in this build, its nav entry lights up on its own, with no
 * edit to the tree. `unmatchedTargets()` reports what is still waiting.
 *
 * ## Guarantees
 *
 * `pruneToRoutes` is the only supported way to render the tree, and it
 * guarantees:
 *   1. every surviving link target is present in `ROUTE_MANIFEST`;
 *   2. no branch survives with nothing reachable beneath it;
 *   3. the relative order and nesting of surviving nodes is unchanged;
 *   4. the input tree is never mutated.
 *
 * Enforced by `server/navTreeRoutes.test.ts`.
 */

import type { NavNode } from "./navTree";

/** A leaf links somewhere; a branch groups. Placeholders do neither. */
function isLeaf(node: NavNode): boolean {
  return typeof node.path === "string" && node.path.length > 0;
}

/**
 * Every link target in the tree, in document order, including duplicates.
 * Duplicates matter — two nav entries pointing at one route is a real finding,
 * so this deliberately does not deduplicate. Use a Set at the call site.
 */
export function collectNavTargets(nodes: NavNode[]): string[] {
  const out: string[] = [];
  const walk = (list: NavNode[]) => {
    for (const node of list) {
      if (isLeaf(node)) out.push(node.path as string);
      if (node.children?.length) walk(node.children);
    }
  };
  walk(nodes);
  return out;
}

/**
 * Prune to the routes this build serves.
 *
 * A leaf survives if its target is a known route. A branch survives if
 * anything survives beneath it — so pruning a leaf can cascade and remove the
 * now-empty group that held it, which is the behaviour that prevents a sidebar
 * full of headings that open onto nothing.
 *
 * Placeholder nodes (`isPlaceholder`) carry no target and are dropped: they
 * exist in the source tree to mark intended-but-unbuilt destinations, and a
 * "coming soon" row is not something to import into a production sidebar.
 *
 * Returns new objects throughout; the input is never mutated.
 *
 * ## Deduplication
 *
 * The source tree reaches `/portal/mortgage-killer` twice — once under
 * "Payoff Operations" and once under "Payoff Coaching". Rendering both would
 * put one capability in the menu in two places, which is precisely the
 * duplication this consolidation exists to remove.
 *
 * The first occurrence in document order wins; later ones are dropped, and
 * dropping one can empty the branch that held it, which then goes too. The
 * source tree is left alone so it stays diffable against its origin —
 * `duplicateTargets()` reports what was deduplicated.
 */
export function pruneToRoutes(nodes: NavNode[], routes: Iterable<string>): NavNode[] {
  const known = routes instanceof Set ? routes : new Set(routes);
  const claimed = new Set<string>();

  const prune = (list: NavNode[]): NavNode[] => {
    const kept: NavNode[] = [];

    for (const node of list) {
      if (isLeaf(node)) {
        const path = node.path as string;
        // A leaf is kept only when this build can serve its target, and only
        // the first time that target appears.
        if (!known.has(path) || claimed.has(path)) continue;
        claimed.add(path);
        const children = node.children?.length ? prune(node.children) : [];
        kept.push(children.length ? { ...node, children } : { ...node, children: undefined });
        continue;
      }

      if (node.isPlaceholder) continue;

      // Recurse first: a branch is worth keeping only if something reachable
      // survived beneath it.
      const children = node.children?.length ? prune(node.children) : [];
      if (children.length) kept.push({ ...node, children });
    }

    return kept;
  };

  return prune(nodes);
}

/**
 * Targets the tree wants that this build does not serve — the 124.
 *
 * Informational, not a failure: the tree is shared with a build that has more
 * routes. This is the worklist for what a later migration would unlock, and
 * the number is asserted in tests so it cannot drift unnoticed.
 */
export function unmatchedTargets(nodes: NavNode[], routes: Iterable<string>): string[] {
  const known = routes instanceof Set ? routes : new Set(routes);
  return Array.from(new Set(collectNavTargets(nodes))).filter((p) => !known.has(p)).sort();
}

/** Targets appearing more than once — two nav entries onto one route. */
export function duplicateTargets(nodes: NavNode[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const path of collectNavTargets(nodes)) {
    if (seen.has(path)) dupes.add(path);
    seen.add(path);
  }
  return Array.from(dupes).sort();
}

/** Branches with no reachable leaf beneath them. Should be empty after pruning. */
export function emptyBranches(nodes: NavNode[]): string[] {
  const out: string[] = [];
  const walk = (list: NavNode[], trail: string[]) => {
    for (const node of list) {
      const here = [...trail, node.label];
      if (isLeaf(node)) continue;
      if (!node.children?.length) {
        out.push(here.join(" / "));
        continue;
      }
      if (collectNavTargets([node]).length === 0) out.push(here.join(" / "));
      walk(node.children, here);
    }
  };
  walk(nodes, []);
  return out;
}

export interface NavTreeStats {
  sections: number;
  totalNodes: number;
  leaves: number;
  branches: number;
  maxDepth: number;
}

export function navTreeStats(nodes: NavNode[]): NavTreeStats {
  let totalNodes = 0;
  let leaves = 0;
  let branches = 0;
  let maxDepth = 0;

  const walk = (list: NavNode[], depth: number) => {
    maxDepth = Math.max(maxDepth, depth);
    for (const node of list) {
      totalNodes++;
      if (isLeaf(node)) leaves++;
      else branches++;
      if (node.children?.length) walk(node.children, depth + 1);
    }
  };

  walk(nodes, 1);
  return { sections: nodes.length, totalNodes, leaves, branches, maxDepth };
}

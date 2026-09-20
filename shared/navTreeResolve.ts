/**
 * Navigation tree resolution against the route manifest.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * `navTree.ts` was authored against a different application — one with 612
 * routes. This one registers 330. Of the tree's 271 distinct targets, **124 do
 * not exist here**.
 *
 * Rendering it verbatim would put 124 dead links in the sidebar. Every one of
 * them looks exactly like a working link until somebody clicks it, which is
 * worse than not having the entry at all: a menu that lies about what the
 * product does costs more trust than a menu that is short.
 *
 * ─── WHAT THIS DOES INSTEAD ─────────────────────────────────────────────────
 *
 * Every leaf is checked against ROUTE_MANIFEST at resolve time. A leaf whose
 * path is not registered becomes a placeholder — the node type already carried
 * `isPlaceholder`, so this uses an affordance the tree was designed with rather
 * than inventing one. The renderer shows placeholders as present-but-inactive,
 * so the intended shape of the product is visible without any of it being
 * clickable-and-broken.
 *
 * ─── WHY THE COUNT IS PINNED IN A TEST ──────────────────────────────────────
 *
 * The unresolved count is asserted exactly. Not as a quality gate — 124 is not
 * a defect, it is a to-do list — but so the number cannot drift silently. When
 * a route is migrated the count drops and the test fails, forcing the number to
 * be updated deliberately. That makes this file a live measure of migration
 * progress rather than a snapshot that rots.
 *
 * This module is deliberately free of React and of any import from the client,
 * so the server test suite can import it directly, exactly as it does with
 * `routeManifest.ts`.
 */
import { ROUTE_MANIFEST } from "./routeManifest";
import type { NavNode } from "./navTree";

/** A node after resolution: same shape, plus what we learned about it. */
export type ResolvedNavNode = Omit<NavNode, "children"> & {
  children?: ResolvedNavNode[];
  /** True when this leaf's path is registered and safe to link. */
  resolved: boolean;
  /**
   * True when this node renders as present-but-inactive — either it was
   * authored as a placeholder, or its path is not registered here.
   */
  placeholder: boolean;
};

export type ResolveStats = {
  /** Nodes with children. */
  folders: number;
  /** Nodes without children — the things a user can click, or not. */
  leaves: number;
  /** Leaves with a path registered in the manifest. */
  resolved: number;
  /** Leaves authored as placeholders, with no path at all. */
  authoredPlaceholders: number;
  /** Leaves with a path that this application does not register. */
  unresolved: number;
  /** Those paths, sorted. The migration backlog, in order. */
  unresolvedPaths: string[];
  /** Deepest nesting level reached, root = 1. */
  maxDepth: number;
};

const manifestSet = new Set<string>(ROUTE_MANIFEST);

/** Exposed so a test can resolve against a stub instead of the real manifest. */
export function resolveNavTree(
  nodes: readonly NavNode[],
  routes: ReadonlySet<string> = manifestSet,
): { tree: ResolvedNavNode[]; stats: ResolveStats } {
  const stats: ResolveStats = {
    folders: 0,
    leaves: 0,
    resolved: 0,
    authoredPlaceholders: 0,
    unresolved: 0,
    unresolvedPaths: [],
    maxDepth: 0,
  };

  const unresolved = new Set<string>();

  const walk = (node: NavNode, depth: number): ResolvedNavNode => {
    stats.maxDepth = Math.max(stats.maxDepth, depth);

    if (node.children && node.children.length > 0) {
      stats.folders++;
      return {
        ...node,
        children: node.children.map(c => walk(c, depth + 1)),
        resolved: true,
        placeholder: false,
      };
    }

    stats.leaves++;

    // Authored as a placeholder: no path was ever intended.
    if (!node.path) {
      stats.authoredPlaceholders++;
      return { ...node, children: undefined, resolved: false, placeholder: true };
    }

    // Has a path. Does this application actually serve it?
    if (routes.has(node.path)) {
      stats.resolved++;
      return { ...node, children: undefined, resolved: true, placeholder: false };
    }

    unresolved.add(node.path);
    return { ...node, children: undefined, resolved: false, placeholder: true };
  };

  const tree = nodes.map(n => walk(n, 1));
  stats.unresolved = unresolved.size;
  stats.unresolvedPaths = Array.from(unresolved).sort();
  return { tree, stats };
}

/** Every distinct path the tree targets, whether or not it resolves. */
export function navTreePaths(nodes: readonly NavNode[]): string[] {
  const out = new Set<string>();
  const walk = (n: NavNode) => {
    if (n.path) out.add(n.path);
    n.children?.forEach(walk);
  };
  nodes.forEach(walk);
  return Array.from(out).sort();
}

/**
 * Structural problems that make a tree wrong regardless of routing.
 *
 * An empty folder renders as a heading that expands into nothing. A node that
 * is both a folder and a link is ambiguous — the renderer has to pick, and
 * whichever it picks surprises somebody. Neither is caught by route validation,
 * which is why this is separate from it.
 */
export function navTreeStructuralIssues(nodes: readonly NavNode[]): string[] {
  const issues: string[] = [];
  const walk = (n: NavNode, trail: string) => {
    const here = trail ? `${trail} › ${n.label}` : n.label;
    const isFolder = Array.isArray(n.children);

    if (!n.label?.trim()) issues.push(`node with no label at ${here}`);
    if (isFolder && n.children!.length === 0) issues.push(`empty folder: ${here}`);
    if (isFolder && n.path) issues.push(`node is both a folder and a link: ${here}`);
    if (!isFolder && !n.path && !n.isPlaceholder) {
      issues.push(`leaf with neither a path nor isPlaceholder: ${here}`);
    }
    n.children?.forEach(c => walk(c, here));
  };
  nodes.forEach(n => walk(n, ""));
  return issues;
}

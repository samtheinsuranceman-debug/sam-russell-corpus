// ─── navTree resolver ───────────────────────────────────────────────────────
//
// WHAT THIS IS FOR. `navTree.ts` is a verbatim port from russell-capital-app,
// which serves 593 routes. This application serves 330. 124 of the tree's 271
// targets do not exist here — so rendering the tree as authored would produce
// 124 menu items that 404.
//
// This module is the guard against that. It walks the tree once, checks every
// `path` against `shared/routeManifest.ts`, and rewrites any node whose target
// does not resolve into a placeholder — a state `NavNode` already models, and
// which the renderer draws as a non-clickable label. **A target that is not a
// real route cannot become a clickable dead link.**
//
// The alternative — hand-editing the 124 entries out of `navTree.ts` — was
// rejected deliberately. It would fork the file from its donor, so the next
// re-sync would silently reintroduce them, and it would throw away the
// information about which pages this repository is still missing. Resolving at
// load keeps the tree honest and keeps the gap visible.
//
// This module is pure and framework-free: no React, no side effects, no I/O.
// That is what lets `server/navTree-route-targets.test.ts` assert its
// behaviour directly.

import { ROUTE_MANIFEST } from "@shared/routeManifest";
import type { NavNode } from "@/navTree";

/** Route patterns carrying a `:param` segment, pre-compiled once. */
const PARAM_PATTERNS: RegExp[] = ROUTE_MANIFEST.filter((p) => p.includes(":")).map(
  (p) => new RegExp("^" + p.replace(/:[^/]+/g, "[^/]+") + "$"),
);

const EXACT: ReadonlySet<string> = new Set(ROUTE_MANIFEST);

/**
 * Does this path correspond to a route the application actually serves?
 *
 * Exact match first, then wouter-style parameter patterns — `/portal/clients/7`
 * is served by `/portal/clients/:id` and must count as resolvable.
 */
export function isRoutable(path: string): boolean {
  if (EXACT.has(path)) return true;
  return PARAM_PATTERNS.some((rx) => rx.test(path));
}

export type ResolvedNavNode = NavNode & {
  children?: ResolvedNavNode[];
  /** Present only on a node demoted by this module. The target it wanted. */
  unresolvedPath?: string;
};

/**
 * Walk the tree, demoting every unroutable target to a placeholder.
 *
 * Structure, labels, colours, ordering and `defaultOpen` are preserved exactly.
 * The only change is that a leaf whose `path` does not resolve loses that
 * `path`, gains `isPlaceholder: true`, and records what it had been pointing at
 * in `unresolvedPath` so the gap stays inspectable rather than disappearing.
 */
export function resolveNavTree(nodes: readonly NavNode[]): ResolvedNavNode[] {
  return nodes.map((node) => {
    const children = node.children ? resolveNavTree(node.children) : undefined;

    if (node.path && !isRoutable(node.path)) {
      const { path, ...rest } = node;
      return { ...rest, isPlaceholder: true, unresolvedPath: path, ...(children ? { children } : {}) };
    }

    return { ...node, ...(children ? { children } : {}) };
  });
}

/** Every `path` the tree declares, in document order, including unroutable ones. */
export function allTargets(nodes: readonly NavNode[], out: string[] = []): string[] {
  for (const node of nodes) {
    if (node.path) out.push(node.path);
    if (node.children) allTargets(node.children, out);
  }
  return out;
}

/** Targets that resolve against the manifest. These become live links. */
export function resolvedTargets(nodes: readonly NavNode[]): string[] {
  // Array.from rather than spread: this project's tsconfig target predates
  // downlevel Set iteration, so `[...new Set(x)]` does not compile here.
  return Array.from(new Set(allTargets(nodes).filter(isRoutable))).sort();
}

/**
 * Targets that do NOT resolve. These render as placeholders.
 *
 * This list is the migration backlog stated as data: each entry is a page this
 * navigation wants and this application does not yet serve. It shrinks as
 * routes arrive.
 */
export function unresolvedTargets(nodes: readonly NavNode[]): string[] {
  return Array.from(new Set(allTargets(nodes).filter((p) => !isRoutable(p)))).sort();
}

/** Flatten a resolved tree to `path → node`, for lookups by route. */
export function flattenResolved(
  nodes: readonly ResolvedNavNode[],
  map: Map<string, ResolvedNavNode> = new Map(),
): Map<string, ResolvedNavNode> {
  for (const node of nodes) {
    if (node.path) map.set(node.path, node);
    if (node.children) flattenResolved(node.children, map);
  }
  return map;
}

/** Counts for tests, diagnostics and the PR body. */
export function navTreeStats(nodes: readonly NavNode[]) {
  const targets = allTargets(nodes);
  const distinct = new Set(targets);
  const resolved = resolvedTargets(nodes);
  const unresolved = unresolvedTargets(nodes);
  return {
    sections: nodes.length,
    totalTargets: targets.length,
    distinctTargets: distinct.size,
    resolved: resolved.length,
    unresolved: unresolved.length,
    manifestSize: ROUTE_MANIFEST.length,
  };
}

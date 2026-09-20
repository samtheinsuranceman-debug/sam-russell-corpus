import { describe, expect, it } from 'vitest';
import { MEDICAL_TREE, type NavNode } from '../client/src/navTree';
import { ROUTE_MANIFEST } from '../shared/routeManifest';

/**
 * Route-target validation.
 *
 * The tree was ported from `russell-capital-app`, where 272 of its leaves
 * pointed at pages that repository has and this one does not. A verbatim import
 * would have added 124 menu links that 404.
 *
 * This test is the reason that cannot happen again. Every leaf carrying a
 * `path` must name a route this application actually serves, checked against
 * the same manifest the router and the build script read. A leaf whose page
 * does not exist must be a placeholder — which renders as text, not a link.
 */

const manifest: Record<string, boolean> = {};
for (const r of ROUTE_MANIFEST) manifest[r] = true;

function walk(nodes: readonly NavNode[], depth = 0, trail: string[] = []): {
  links: { path: string; label: string; trail: string }[];
  placeholders: string[];
  maxDepth: number;
} {
  const links: { path: string; label: string; trail: string }[] = [];
  const placeholders: string[] = [];
  let maxDepth = depth;

  for (const n of nodes) {
    const here = trail.concat(n.label);
    if (n.children && n.children.length > 0) {
      const sub = walk(n.children, depth + 1, here);
      for (const l of sub.links) links.push(l);
      for (const p of sub.placeholders) placeholders.push(p);
      if (sub.maxDepth > maxDepth) maxDepth = sub.maxDepth;
    } else if (n.path) {
      links.push({ path: n.path, label: n.label, trail: here.join(' › ') });
    } else {
      placeholders.push(here.join(' › '));
    }
  }
  return { links, placeholders, maxDepth };
}

const tree = walk(MEDICAL_TREE);

describe('every navigation target resolves to a real route', () => {
  it('parses a sane tree', () => {
    expect(MEDICAL_TREE.length).toBe(10);
    expect(tree.links.length).toBeGreaterThan(100);
    expect(ROUTE_MANIFEST.length).toBe(330);
  });

  it('points no link at a route the application does not serve', () => {
    const dead = tree.links.filter((l) => !manifest[l.path]);
    expect(
      dead.map((d) => `${d.trail}  →  ${d.path}`),
      `${dead.length} navigation link(s) point at a route that is not in ` +
        `shared/routeManifest.ts. Either the page does not exist here — in which ` +
        `case make it a ph("${dead[0]?.label ?? ''}") placeholder — or the route ` +
        `needs registering:\n  `,
    ).toEqual([]);
  });

  it('links each route at most once, so the tree has no duplicate entries', () => {
    const seen: Record<string, number> = {};
    for (const l of tree.links) seen[l.path] = (seen[l.path] || 0) + 1;
    const dupes = Object.keys(seen).filter((p) => seen[p] > 1);
    expect(dupes, `route(s) linked more than once in the tree:\n  ${dupes.join('\n  ')}`).toEqual([]);
  });

  it('carries the ported-but-absent pages as placeholders rather than dead links', () => {
    // 124 leaves came across from russell-capital-app with no page here. They
    // are preserved as placeholders so the taxonomy survives intact; the count
    // is asserted loosely because it falls as pages land.
    expect(tree.placeholders.length).toBeGreaterThanOrEqual(100);
    expect(tree.links.length + tree.placeholders.length).toBeGreaterThanOrEqual(270);
  });

  it('gives every placeholder a real label, so none renders blank', () => {
    for (const p of tree.placeholders) {
      const label = p.split(' › ').pop() ?? '';
      expect(label.length, `placeholder with an empty label at ${p}`).toBeGreaterThan(1);
    }
  });
});

describe('the tree does not strand the existing navigation', () => {
  it('is additive — it does not claim to cover every route yet', () => {
    // Stated as a fact rather than a goal: the tree covers 147 of 330 routes.
    // This is exactly why NavTree is not yet mounted in place of NAV_SECTIONS.
    // When a later PR does the swap, this expectation is what will fail first
    // and force the coverage gap to be closed deliberately.
    const covered: Record<string, boolean> = {};
    for (const l of tree.links) covered[l.path] = true;
    const uncovered = ROUTE_MANIFEST.filter((r) => !covered[r]);
    expect(uncovered.length).toBeGreaterThan(0);
    expect(tree.links.length).toBeLessThan(ROUTE_MANIFEST.length);
  });
});

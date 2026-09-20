import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { MEDICAL_TREE, type NavNode } from '../client/src/navTree';

/**
 * Tree structure and renderer contract.
 *
 * `navTree.ts` is plain data with no React or lucide import, which is the
 * property that lets this node-environment test read it directly. The renderer
 * cannot be imported here — it is JSX, and vitest runs with
 * `environment: "node"` and no jsdom — so `NavTree.tsx` is asserted on as
 * source text instead. That is the same technique the repository already uses
 * for AppShell, and it avoids adding a DOM test stack to land one component.
 */

const root = resolve(__dirname, '..');
const rendererSrc = readFileSync(resolve(root, 'client/src/components/NavTree.tsx'), 'utf8');
const treeSrc = readFileSync(resolve(root, 'client/src/navTree.ts'), 'utf8');

function flatten(nodes: readonly NavNode[], depth = 0): { node: NavNode; depth: number }[] {
  const out: { node: NavNode; depth: number }[] = [];
  for (const n of nodes) {
    out.push({ node: n, depth });
    if (n.children && n.children.length > 0) {
      for (const c of flatten(n.children, depth + 1)) out.push(c);
    }
  }
  return out;
}

const all = flatten(MEDICAL_TREE);

describe('the tree is well formed', () => {
  it('has ten top-level tabs', () => {
    expect(MEDICAL_TREE.length).toBe(10);
  });

  it('gives every node a non-empty label', () => {
    for (const { node } of all) {
      expect(typeof node.label, JSON.stringify(node)).toBe('string');
      expect(node.label.trim().length).toBeGreaterThan(0);
    }
  });

  it('nests deeper than the two levels a flat sidebar can express', () => {
    // The reason for porting this at all: the existing sidebar is
    // section → item, so a large group renders as one long flat list.
    let max = 0;
    for (const { depth } of all) if (depth > max) max = depth;
    expect(max).toBeGreaterThanOrEqual(3);
  });

  it('never makes a node both a folder and a link', () => {
    for (const { node } of all) {
      const isFolder = Array.isArray(node.children) && node.children.length > 0;
      if (isFolder) {
        expect(node.path, `"${node.label}" is a folder and also carries a path`).toBeUndefined();
      }
    }
  });

  it('leaves no folder empty', () => {
    for (const { node } of all) {
      if (node.children !== undefined) {
        expect(node.children.length, `"${node.label}" has an empty children array`).toBeGreaterThan(0);
      }
    }
  });

  it('marks every pathless leaf as a placeholder', () => {
    for (const { node } of all) {
      const isFolder = Array.isArray(node.children) && node.children.length > 0;
      if (!isFolder && !node.path) {
        expect(node.isPlaceholder, `"${node.label}" is a leaf with neither a path nor a placeholder flag`).toBe(true);
      }
    }
  });

  it('never marks a linked leaf as a placeholder', () => {
    for (const { node } of all) {
      if (node.path) {
        expect(node.isPlaceholder, `"${node.label}" is both a link and a placeholder`).not.toBe(true);
      }
    }
  });

  it('starts every path at a slash', () => {
    for (const { node } of all) {
      if (node.path) expect(node.path[0], node.label).toBe('/');
    }
  });
});

describe('the data module stays importable from a node test', () => {
  it('imports no React and no lucide', () => {
    // If this ever fails, the route-target test can no longer import the tree
    // and the validation in navTreeRouteTargets.test.ts goes dark.
    expect(/from\s+["']react["']/.test(treeSrc)).toBe(false);
    expect(/from\s+["']lucide-react["']/.test(treeSrc)).toBe(false);
  });

  it('records why the ported entries became placeholders', () => {
    expect(treeSrc).toMatch(/russell-capital-app/);
    expect(treeSrc).toMatch(/routeManifest/);
  });
});

describe('the renderer honours the tree contract', () => {
  it('recurses, so a branch renders at any depth', () => {
    expect(rendererSrc).toMatch(/NavTreeNode/);
    expect(rendererSrc).toMatch(/depth: depth \+ 1|depth=\{depth \+ 1\}/);
  });

  it('renders a placeholder as text and never as a link', () => {
    const leaf = rendererSrc.slice(rendererSrc.indexOf('function NavLeaf'), rendererSrc.indexOf('function NavFolder'));
    const phBlock = leaf.slice(leaf.indexOf('isPlaceholder(node)'), leaf.indexOf('const active'));
    expect(phBlock).toMatch(/<div/);
    expect(phBlock.indexOf('<Link')).toBe(-1);
  });

  it('maps every icon tag the tree type declares', () => {
    const tags = (treeSrc.match(/\|\s*"([a-z-]+)"/g) ?? []).map((s) => s.replace(/[|\s"]/g, ''));
    expect(tags.length).toBeGreaterThan(30);
    for (const t of tags) {
      const quoted = /^[a-z]+$/.test(t) ? `${t}:` : `"${t}":`;
      expect(rendererSrc.indexOf(quoted), `ICON_MAP is missing the "${t}" tag`).toBeGreaterThan(-1);
    }
  });

  it('is not mounted into AppShell by this change', () => {
    // Deliberate: swapping the live sidebar is a separate PR. If this starts
    // failing, that swap happened and it needs its own review.
    const shell = readFileSync(resolve(root, 'client/src/components/AppShell.tsx'), 'utf8');
    expect(shell.indexOf('NavTree')).toBe(-1);
    expect(shell.indexOf('MEDICAL_TREE')).toBe(-1);
  });
});

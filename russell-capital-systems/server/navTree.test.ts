// PR-2b — navigation tree structure and route-target validation.
//
// The second describe block is the gate that matters: every leaf in the tree
// must resolve against the route manifest in client/src/App.tsx. If someone adds
// a tree entry pointing at a route that does not exist, this fails.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  RCS_NAV_TREE,
  collectPaths,
  flattenNavTree,
  treeDepth,
  type NavNode,
} from "../client/src/lib/navTree";

const ROOT = resolve(__dirname, "..");

function routeManifest(): Set<string> {
  const app = readFileSync(resolve(ROOT, "client/src/App.tsx"), "utf8");
  return new Set(Array.from(app.matchAll(/<Route\s+path="([^"]+)"/g), (m) => m[1]));
}

function allLeaves(nodes: NavNode[]): NavNode[] {
  return nodes.flatMap((n) => (n.children?.length ? allLeaves(n.children) : n.path ? [n] : []));
}

describe("navigation tree structure", () => {
  it("has top-level sections, each of which is a folder", () => {
    expect(RCS_NAV_TREE.length).toBeGreaterThan(0);
    for (const section of RCS_NAV_TREE) {
      expect(section.label, "every section is labelled").toBeTruthy();
      expect(section.children?.length, `${section.label} has children`).toBeGreaterThan(0);
      expect(section.path, `${section.label} is a folder, not a leaf`).toBeUndefined();
    }
  });

  it("nests deeper than a flat list — this is the point of the tree", () => {
    expect(treeDepth(RCS_NAV_TREE)).toBeGreaterThanOrEqual(3);
  });

  it("gives every node a label, and every leaf a path", () => {
    const walk = (nodes: NavNode[]) => {
      for (const n of nodes) {
        expect(n.label.trim().length, "label is non-empty").toBeGreaterThan(0);
        if (n.children?.length) walk(n.children);
        else expect(n.path, `leaf "${n.label}" has a path`).toBeTruthy();
      }
    };
    walk(RCS_NAV_TREE);
  });

  it("contains no duplicate paths", () => {
    const paths = RCS_NAV_TREE.flatMap(collectPaths);
    const dupes = paths.filter((p, i) => paths.indexOf(p) !== i);
    expect(dupes, `duplicate nav targets: ${dupes.join(", ")}`).toEqual([]);
  });

  it("collectPaths and flattenNavTree agree on the leaf set", () => {
    const viaCollect = new Set(RCS_NAV_TREE.flatMap(collectPaths));
    const viaFlatten = new Set(flattenNavTree(RCS_NAV_TREE).keys());
    expect(viaFlatten).toEqual(viaCollect);
  });

  it("treeDepth counts a flat forest of leaves as depth 1", () => {
    expect(treeDepth([{ label: "a", path: "/a" }, { label: "b", path: "/b" }])).toBe(1);
    expect(treeDepth([{ label: "f", children: [{ label: "a", path: "/a" }] }])).toBe(2);
  });
});

describe("route-target validation", () => {
  it("resolves every tree target against the App.tsx route manifest", () => {
    const routes = routeManifest();
    const missing = RCS_NAV_TREE.flatMap(collectPaths).filter((p) => !routes.has(p));
    expect(missing, `nav targets with no route: ${missing.join(", ")}`).toEqual([]);
  });

  it("covers the sidebar, minus the two entries that are already dead links", () => {
    const shell = readFileSync(resolve(ROOT, "client/src/components/AppShell.tsx"), "utf8");
    const body = shell.slice(shell.indexOf("const NAV_SECTIONS"));
    const sectionArray = body.slice(0, body.indexOf("\n];"));
    const sidebar = new Set(
      Array.from(sectionArray.matchAll(/path:\s*"([^"]+)",\s*label:/g), (m) => m[1]),
    );
    const known = new Set(["/portal/tool-explorer", "/portal/knowledge-library"]);
    const tree = new Set(RCS_NAV_TREE.flatMap(collectPaths));

    for (const path of sidebar) {
      if (known.has(path)) continue;
      expect(tree.has(path), `sidebar entry "${path}" is missing from the tree`).toBe(true);
    }
    // The omissions are deliberate and must stay dead — if either gains a route,
    // fold it back into the tree.
    const routes = routeManifest();
    for (const path of known) {
      expect(routes.has(path), `"${path}" now has a route; add it to the tree`).toBe(false);
    }
  });

  it("introduces no navigation target outside the sidebar", () => {
    const shell = readFileSync(resolve(ROOT, "client/src/components/AppShell.tsx"), "utf8");
    const body = shell.slice(shell.indexOf("const NAV_SECTIONS"));
    const sidebar = new Set(
      Array.from(
        body.slice(0, body.indexOf("\n];")).matchAll(/path:\s*"([^"]+)",\s*label:/g),
        (m) => m[1],
      ),
    );
    const extra = RCS_NAV_TREE.flatMap(collectPaths).filter((p) => !sidebar.has(p));
    expect(extra, `tree adds targets the sidebar does not have: ${extra.join(", ")}`).toEqual([]);
  });
});

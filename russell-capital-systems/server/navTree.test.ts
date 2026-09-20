import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ROUTE_MANIFEST } from "../shared/routeManifest";
import {
  NAV_TREE,
  allNavPaths,
  collectPaths,
  flattenNavTree,
  maxDepth,
  validateNavTree,
  type NavNode,
} from "../client/src/navTree";

/**
 * The navigation tree, checked against the routes that actually exist.
 *
 * A nav entry pointing at a route the router does not serve is a 404 the user
 * discovers. These tests make it a failure the author discovers.
 */

/** Every node in the tree, depth-first. */
function walk(nodes: NavNode[] = NAV_TREE, out: NavNode[] = []): NavNode[] {
  for (const n of nodes) {
    out.push(n);
    if (n.children) walk(n.children, out);
  }
  return out;
}

describe("navTree — route target validation", () => {
  it("points every destination at a route in the manifest", () => {
    const { unroutable } = validateNavTree(ROUTE_MANIFEST);
    expect(unroutable).toEqual([]);
  });

  it("lists no destination twice", () => {
    const { duplicates } = validateNavTree(ROUTE_MANIFEST);
    expect(duplicates).toEqual([]);
  });

  it("has no node that is both a folder and a link, or neither", () => {
    const { malformed } = validateNavTree(ROUTE_MANIFEST);
    expect(malformed).toEqual([]);
  });

  it("agrees with the routes the router actually registers", () => {
    // Guards against the manifest itself drifting from App.tsx: a path could
    // satisfy the manifest check above and still not be served.
    const appSource = readFileSync(resolve("client/src/App.tsx"), "utf8");
    const registered = new Set(
      Array.from(
        appSource.matchAll(/<Route\b[^>]*\bpath=[{]?["']([^"']+)["']/g),
        (m) => m[1],
      ),
    );
    const unserved = allNavPaths().filter((p) => !registered.has(p));
    expect(unserved).toEqual([]);
  });
});

describe("navTree — structure", () => {
  it("nests deeper than the two levels the old NAV_SECTIONS shape allowed", () => {
    // The point of the port. Two levels was the ceiling before.
    expect(maxDepth()).toBeGreaterThan(2);
  });

  it("gives every node a non-empty label", () => {
    const unlabelled = walk().filter((n) => !n.label || !n.label.trim());
    expect(unlabelled).toEqual([]);
  });

  it("has no empty folders", () => {
    const empty = walk()
      .filter((n) => n.children && n.children.length === 0)
      .map((n) => n.label);
    expect(empty).toEqual([]);
  });

  it("has no folder that leads to nothing reachable", () => {
    // A folder of folders of placeholders renders as an expandable dead end.
    const barren = walk()
      .filter((n) => n.children && collectPaths(n).length === 0)
      .map((n) => n.label);
    expect(barren).toEqual([]);
  });

  it("keeps top-level tabs to a readable count", () => {
    expect(NAV_TREE.length).toBeGreaterThan(0);
    expect(NAV_TREE.length).toBeLessThanOrEqual(14);
  });

  it("splits the sections that were previously too long to scan", () => {
    // "Rental Properties" carried 21 flat siblings and "New Client Welcome
    // List" carried 20. Both are now grouped.
    for (const label of ["Rental Properties", "New Client Welcome List"]) {
      const tab = NAV_TREE.find((t) => t.label === label);
      expect(tab, label).toBeDefined();
      expect(tab!.children!.every((c) => Array.isArray(c.children)), label).toBe(true);
    }
  });
});

describe("navTree — helpers", () => {
  it("collectPaths returns only routed leaves", () => {
    const paths = allNavPaths();
    expect(paths.length).toBeGreaterThan(0);
    expect(paths.every((p) => p.startsWith("/"))).toBe(true);
  });

  it("flattenNavTree maps every routed path back to its node", () => {
    const map = flattenNavTree();
    const paths = allNavPaths();
    expect(map.size).toBe(new Set(paths).size);
    for (const p of paths) expect(map.get(p)?.path, p).toBe(p);
  });

  it("validateNavTree reports a bad path instead of throwing", () => {
    const broken: NavNode[] = [
      { label: "Bad", children: [{ label: "Nope", path: "/portal/does-not-exist" }] },
    ];
    const { unroutable } = validateNavTree(ROUTE_MANIFEST, broken);
    expect(unroutable).toEqual(["/portal/does-not-exist"]);
  });

  it("validateNavTree catches a duplicated destination", () => {
    const dup: NavNode[] = [
      { label: "A", children: [{ label: "One", path: "/portal/dashboard" }] },
      { label: "B", children: [{ label: "Two", path: "/portal/dashboard" }] },
    ];
    expect(validateNavTree(ROUTE_MANIFEST, dup).duplicates).toEqual(["/portal/dashboard"]);
  });
});

describe("navTree — parity with the NAV_SECTIONS it replaces in the sidebar", () => {
  /**
   * NAV_SECTIONS still lives in AppShell.tsx and is still asserted by
   * server/navigation-organization.test.ts, which requires two entries that no
   * router serves:
   *
   *     /portal/tool-explorer      no route anywhere
   *     /portal/knowledge-library  no route; /portal/knowledge is the page
   *
   * The tree cannot carry those as links without failing its own validation,
   * so it carries "Tool Explorer" as a placeholder and points "Knowledge
   * Library" at the route that exists. Those are the ONLY two differences, and
   * this test pins that down — if a future edit drops a destination or quietly
   * retargets another one, it fails here.
   */
  const RETARGETED: Record<string, string> = {
    "/portal/knowledge-library": "/portal/knowledge",
  };
  const PLACEHOLDERS = ["/portal/tool-explorer"];

  const navSectionPaths = (() => {
    const shell = readFileSync(resolve("client/src/components/AppShell.tsx"), "utf8");
    const block = shell.slice(
      shell.indexOf("const NAV_SECTIONS"),
      shell.indexOf("const BOTTOM_TABS"),
    );
    return Array.from(block.matchAll(/path:\s*["']([^"']+)["']/g), (m) => m[1]);
  })();

  it("carries every destination the old structure carried", () => {
    const treePaths = new Set(allNavPaths());
    const missing = navSectionPaths
      .map((p) => RETARGETED[p] ?? p)
      .filter((p) => !PLACEHOLDERS.includes(p))
      .filter((p) => !treePaths.has(p));
    expect(missing).toEqual([]);
  });

  it("adds no destination the old structure did not have, beyond the documented retarget", () => {
    const oldPaths = new Set(navSectionPaths);
    const added = allNavPaths().filter(
      (p) => !oldPaths.has(p) && !Object.values(RETARGETED).includes(p),
    );
    expect(added).toEqual([]);
  });

  it("keeps the same total number of destinations", () => {
    const placeholders = walk().filter((n) => n.isPlaceholder).length;
    expect(allNavPaths().length + placeholders).toBe(navSectionPaths.length);
  });

  it("renders the unroutable entries as placeholders rather than dead links", () => {
    const placeholderLabels = walk()
      .filter((n) => n.isPlaceholder)
      .map((n) => n.label);
    expect(placeholderLabels).toContain("Tool Explorer");
    expect(allNavPaths()).not.toContain("/portal/tool-explorer");
    expect(allNavPaths()).not.toContain("/portal/knowledge-library");
  });
});

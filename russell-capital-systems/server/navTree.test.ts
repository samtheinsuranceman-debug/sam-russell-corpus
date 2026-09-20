import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { MEDICAL_TREE, collectPaths, flattenNavTree, type NavNode } from "../client/src/navTree";

// The route table is read from App.tsx at test time rather than frozen into a
// fixture, so this suite keeps telling the truth as routes are added or
// removed. If a migration PR adds a page, the tree may link to it; if a PR
// removes one, a tree entry pointing at it fails here instead of shipping a
// dead link.
const app = readFileSync(resolve("client/src/App.tsx"), "utf8");
const ROUTES = new Set(
  [...app.matchAll(/<Route\s[^>]*path=(?:"([^"]+)"|\{`([^`]+)`\}|\{"([^"]+)"\})/g)]
    .map((m) => m[1] ?? m[2] ?? m[3]),
);

function walk(nodes: NavNode[], visit: (n: NavNode, depth: number) => void, depth = 0) {
  for (const n of nodes) {
    visit(n, depth);
    if (n.children) walk(n.children, visit, depth + 1);
  }
}

const all: NavNode[] = [];
walk(MEDICAL_TREE, (n) => all.push(n));
const leaves = all.filter((n) => !n.children?.length);
const links = leaves.filter((n) => n.path);
const placeholders = leaves.filter((n) => n.isPlaceholder);

describe("the medical navigation tree", () => {
  it("keeps its ten departments", () => {
    expect(MEDICAL_TREE).toHaveLength(10);
    expect(MEDICAL_TREE.map((s) => s.label)).toEqual([
      "Health Check Reports", "Medicine", "Treatment Center", "Wellness Coaching",
      "Financial Diet", "Wealth Scanning", "Procedures Center",
      "Longevity Management", "Patients", "Wealth Genome",
    ]);
  });

  it("gives every node a label", () => {
    for (const n of all) expect(n.label, JSON.stringify(n)).toBeTruthy();
  });

  it("never makes a node both a folder and a link", () => {
    for (const n of all) {
      if (n.children?.length) expect(n.path, `${n.label} is a folder`).toBeUndefined();
    }
  });

  it("leaves no empty folders", () => {
    for (const n of all) {
      if (n.children) expect(n.children.length, `${n.label} has no children`).toBeGreaterThan(0);
    }
  });

  it("makes every leaf either a link or a placeholder, never neither", () => {
    for (const n of leaves) {
      expect(Boolean(n.path) || Boolean(n.isPlaceholder), `${n.label} is a dead leaf`).toBe(true);
    }
  });
});

describe("every navigation target resolves against the route table", () => {
  it("reads a plausible route table out of App.tsx", () => {
    // Guard against the regex silently matching nothing and the suite passing
    // vacuously.
    expect(ROUTES.size).toBeGreaterThan(300);
    expect(ROUTES.has("/portal/dashboard")).toBe(true);
  });

  it("points every link at a declared route", () => {
    const dangling = links.filter((n) => !ROUTES.has(n.path!));
    expect(dangling.map((n) => `${n.label} -> ${n.path}`)).toEqual([]);
  });

  it("links no route twice", () => {
    const seen = new Map<string, string[]>();
    for (const n of links) seen.set(n.path!, [...(seen.get(n.path!) ?? []), n.label]);
    const duplicated = [...seen.entries()].filter(([, labels]) => labels.length > 1);
    expect(duplicated).toEqual([]);
  });

  it("carries the taxonomy the port measured", () => {
    expect(links).toHaveLength(147);
    expect(placeholders).toHaveLength(142);
  });

  it("gives placeholders no path, so the renderer cannot link them", () => {
    for (const n of placeholders) expect(n.path, n.label).toBeUndefined();
  });
});

describe("the tree helpers", () => {
  it("collects only real paths", () => {
    const collected = MEDICAL_TREE.flatMap(collectPaths);
    expect(collected).toHaveLength(links.length);
    for (const p of collected) expect(ROUTES.has(p)).toBe(true);
  });

  it("flattens to a path -> node map with no collisions", () => {
    const map = flattenNavTree(MEDICAL_TREE);
    expect(map.size).toBe(links.length);
    for (const [path, node] of map) expect(node.path).toBe(path);
  });
});

describe("the renderer", () => {
  const nav = readFileSync(resolve("client/src/components/NavTree.tsx"), "utf8");
  const tree = readFileSync(resolve("client/src/navTree.ts"), "utf8");

  it("maps every icon tag the tree declares", () => {
    const declared = tree.slice(tree.indexOf("export type IconTag"), tree.indexOf("export const MEDICAL_TREE"));
    const iconTags = [...declared.matchAll(/"([a-z-]+)"/g)].map((m) => m[1]);
    expect(iconTags.length).toBeGreaterThan(30);
    for (const t of iconTags) {
      expect(nav, `ICON_MAP is missing ${t}`).toMatch(new RegExp(`["']?${t}["']?\\s*:`));
    }
  });

  it("links leaves and refuses to link placeholders", () => {
    expect(nav).toContain("<Link");
    const placeholderBranch = nav.slice(nav.indexOf("node.isPlaceholder"), nav.indexOf("const active ="));
    expect(placeholderBranch).not.toContain("<Link");
    expect(placeholderBranch).toContain("cursor-default");
  });
});

describe("the existing sidebar is untouched", () => {
  const shell = readFileSync(resolve("client/src/components/AppShell.tsx"), "utf8");

  it("keeps NAV_SECTIONS as the default view", () => {
    expect(shell).toContain("const NAV_SECTIONS: NavSection[] = [");
    expect(shell).toContain("NAV_SECTIONS.map((section) => (");
    // Neither alternate view is on unless its key is set.
    expect(shell).toContain('localStorage.getItem(CHART_MODE_KEY) === "1"');
    expect(shell).toContain('localStorage.getItem(SPHERE_MODE_KEY) === "1"');
  });

  it("keeps the Sphere view", () => {
    expect(shell).toContain("<SphereNav location={location} onClose={onClose} />");
  });

  it("adds no new orphaned navigation entry", () => {
    // NAV_SECTIONS already carried two entries pointing at routes this build
    // does not declare, before this change and independently of it. They are
    // pinned here so a third one cannot appear unnoticed — and so that fixing
    // either one is a deliberate edit to this list, not a silent pass.
    const KNOWN_ORPHANS = ["/portal/knowledge-library", "/portal/tool-explorer"];
    const sections = shell.slice(shell.indexOf("const NAV_SECTIONS"), shell.indexOf("const BOTTOM_TABS"));
    const navPaths = [...sections.matchAll(/path:\s*"([^"]+)"/g)].map((m) => m[1]);
    expect(navPaths.length).toBeGreaterThan(100);
    const orphans = [...new Set(navPaths.filter((p) => !ROUTES.has(p)))].sort();
    expect(orphans).toEqual(KNOWN_ORPHANS);
  });
});

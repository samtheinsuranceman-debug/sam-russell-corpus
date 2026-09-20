/**
 * NAV TREE STRUCTURE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Shape and helper behaviour for the ported tree. Route correctness lives in
 * `navTreeRoutes.test.ts`; this file is about the data being well-formed.
 */

import { describe, it, expect } from "vitest";
import { MEDICAL_TREE, collectPaths, flattenNavTree, type NavNode } from "@shared/navTree";
import {
  collectNavTargets,
  pruneToRoutes,
  navTreeStats,
  emptyBranches,
} from "@shared/navTreeValidation";

describe("MEDICAL_TREE shape", () => {
  it("is a non-empty array of top-level sections", () => {
    expect(Array.isArray(MEDICAL_TREE)).toBe(true);
    expect(MEDICAL_TREE.length).toBeGreaterThan(0);
  });

  it("gives every node a non-empty label", () => {
    const unlabelled: string[] = [];
    const walk = (nodes: NavNode[], trail: string) => {
      nodes.forEach((node, i) => {
        if (typeof node.label !== "string" || node.label.trim() === "") {
          unlabelled.push(`${trail}[${i}]`);
        }
        if (node.children) walk(node.children, `${trail}${node.label ?? "?"} / `);
      });
    };
    walk(MEDICAL_TREE, "");
    expect(unlabelled).toEqual([]);
  });

  it("makes every node either a link, a branch, or an explicit placeholder", () => {
    const malformed: string[] = [];
    const walk = (nodes: NavNode[], trail: string) => {
      for (const node of nodes) {
        const here = `${trail}${node.label}`;
        const isLink = typeof node.path === "string" && node.path.length > 0;
        const isBranch = Array.isArray(node.children) && node.children.length > 0;
        if (!isLink && !isBranch && !node.isPlaceholder) malformed.push(here);
        if (node.children) walk(node.children, `${here} / `);
      }
    };
    walk(MEDICAL_TREE, "");
    expect(malformed).toEqual([]);
  });

  it("starts every link target with a slash", () => {
    const bad = collectNavTargets(MEDICAL_TREE).filter((p) => !p.startsWith("/"));
    expect(bad).toEqual([]);
  });

  it("has no sibling label collisions", () => {
    // Two identically-labelled siblings are indistinguishable to the user.
    const collisions: string[] = [];
    const walk = (nodes: NavNode[], trail: string) => {
      const seen = new Set<string>();
      for (const node of nodes) {
        if (seen.has(node.label)) collisions.push(`${trail}${node.label}`);
        seen.add(node.label);
        if (node.children) walk(node.children, `${trail}${node.label} / `);
      }
    };
    walk(MEDICAL_TREE, "");
    expect(collisions).toEqual([]);
  });

  it("nests deeper than the two levels the existing sidebar supports", () => {
    // This depth is the reason for the port — NAV_SECTIONS cannot express it.
    expect(navTreeStats(MEDICAL_TREE).maxDepth).toBeGreaterThan(2);
  });
});

describe("collectPaths", () => {
  it("returns a node's own path and stops there", () => {
    expect(collectPaths({ label: "Leaf", path: "/portal/x" })).toEqual(["/portal/x"]);
  });

  it("returns nothing for a childless branch", () => {
    expect(collectPaths({ label: "Empty" })).toEqual([]);
  });

  it("gathers descendants depth-first", () => {
    const node: NavNode = {
      label: "Root",
      children: [
        { label: "A", path: "/a" },
        { label: "B", children: [{ label: "B1", path: "/b1" }] },
      ],
    };
    expect(collectPaths(node)).toEqual(["/a", "/b1"]);
  });
});

describe("flattenNavTree", () => {
  it("maps every target to its node", () => {
    const map = flattenNavTree(MEDICAL_TREE);
    const unique = new Set(collectNavTargets(MEDICAL_TREE));
    expect(map.size).toBe(unique.size);
    for (const path of unique) expect(map.get(path)?.path).toBe(path);
  });
});

describe("pruneToRoutes", () => {
  const tree: NavNode[] = [
    {
      label: "Kept section",
      children: [
        { label: "Live", path: "/live" },
        { label: "Dead", path: "/dead" },
      ],
    },
    {
      label: "Dropped section",
      children: [{ label: "Also dead", path: "/gone" }],
    },
    { label: "Placeholder", isPlaceholder: true },
  ];

  const pruned = pruneToRoutes(tree, ["/live"]);

  it("keeps links the build serves and drops the rest", () => {
    expect(collectNavTargets(pruned)).toEqual(["/live"]);
  });

  it("drops a branch once nothing reachable survives beneath it", () => {
    expect(pruned.map((n) => n.label)).toEqual(["Kept section"]);
  });

  it("drops placeholder nodes", () => {
    expect(pruned.some((n) => n.isPlaceholder)).toBe(false);
  });

  it("preserves sibling order", () => {
    const ordered = pruneToRoutes(
      [{ label: "S", children: [
        { label: "one", path: "/1" },
        { label: "skip", path: "/nope" },
        { label: "two", path: "/2" },
      ] }],
      ["/1", "/2"],
    );
    expect(collectNavTargets(ordered)).toEqual(["/1", "/2"]);
  });

  it("returns an empty tree when nothing matches", () => {
    expect(pruneToRoutes(tree, [])).toEqual([]);
  });

  it("leaves no empty branches behind", () => {
    expect(emptyBranches(pruned)).toEqual([]);
  });

  it("accepts a Set or any iterable of routes", () => {
    expect(collectNavTargets(pruneToRoutes(tree, new Set(["/live"])))).toEqual(["/live"]);
  });

  it("keeps the first occurrence of a repeated target and drops the rest", () => {
    const dup: NavNode[] = [
      { label: "First", children: [{ label: "Here", path: "/same" }] },
      { label: "Second", children: [{ label: "Again", path: "/same" }] },
    ];
    const out = pruneToRoutes(dup, ["/same"]);
    expect(collectNavTargets(out)).toEqual(["/same"]);
    // The branch left holding nothing goes with it.
    expect(out.map((n) => n.label)).toEqual(["First"]);
  });
});

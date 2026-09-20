// ─── Nav tree import/reconcile tool ────────────────────────────────────────
//
// Regenerates client/src/navTree.ts. This is the one-time import tool that
// produced the committed tree, kept so the transformation is reproducible and
// reviewable rather than a thing that happened once in a terminal.
//
// It reads three inputs:
//   1. the source tree, exported from russell-capital-app's navTree.ts as JSON
//      (that module is React-free by design, so `npx tsx` can evaluate it);
//   2. shared/routeManifest.ts, this build's list of registered routes;
//   3. the NAV_SECTIONS block in client/src/components/AppShell.tsx.
//
// Inputs 1 and 3 are produced by the two dump steps documented in the PR body.
// Paths are taken from argv so the script is not tied to one machine:
//
//   node scripts/build-nav-tree.mjs <tree.json> <basenav.json>
//
// The committed navTree.ts is the artifact. Running this is only necessary if
// the source tree is re-imported; ordinary edits are made to navTree.ts
// directly, and server/navTree.test.ts enforces the invariants either way.

import fs from "node:fs";
import path from "node:path";

const B = process.env.RCS_ROOT ?? path.resolve(import.meta.dirname, "..");
const TREE_JSON = process.argv[2] ?? "/tmp/tree.json";
const BASENAV_JSON = process.argv[3] ?? "/tmp/basenav.json";
const manifest = new Set(
  [...fs.readFileSync(`${B}/shared/routeManifest.ts`, "utf8").matchAll(/^\s+"(\/[^"]*)"/gm)].map(m => m[1])
);
const appTree = JSON.parse(fs.readFileSync(TREE_JSON, "utf8"));
const baseNav = JSON.parse(fs.readFileSync(BASENAV_JSON, "utf8"));

// ── 1. Reconcile the imported tree against this build's routes ──────────────
// A leaf whose path is not a registered route here becomes a placeholder. That
// is navTree's own mechanism for "named but not built", and it keeps the
// imported information architecture visible without creating a dead link.
let kept = 0, placeheld = 0;
const seen = new Set();
function reconcile(nodes) {
  const out = [];
  for (const n of nodes) {
    const node = { label: n.label };
    if (n.color) node.color = n.color;
    if (n.icon) node.icon = n.icon;
    if (n.defaultOpen) node.defaultOpen = true;
    if (n.children?.length) {
      node.children = reconcile(n.children);
      if (!node.children.length) continue;
    } else if (n.path) {
      if (manifest.has(n.path) && !seen.has(n.path)) {
        node.path = n.path; seen.add(n.path); kept++;
      } else if (manifest.has(n.path)) {
        continue;                       // duplicate target — drop, req 4
      } else {
        node.isPlaceholder = true; placeheld++;
      }
    } else {
      node.isPlaceholder = true;
    }
    out.push(node);
  }
  return out;
}
const tree = reconcile(appTree);

// ── 2. Fold in every base nav entry the imported tree does not cover ────────
// Nothing currently reachable may become unreachable (req 4). Missing entries
// keep the grouping they already have in this build rather than being dumped
// into one bucket.
const bySection = new Map();
let folded = 0;
for (const e of baseNav) {
  if (seen.has(e.path) || !manifest.has(e.path)) continue;
  if (!bySection.has(e.section)) bySection.set(e.section, new Map());
  const subs = bySection.get(e.section);
  const key = e.sub ?? "—";
  if (!subs.has(key)) subs.set(key, []);
  subs.get(key).push({ label: e.label, path: e.path });
  seen.add(e.path); folded++;
}
for (const [section, subs] of bySection) {
  const children = [];
  for (const [sub, items] of subs) {
    if (sub === "—") children.push(...items);
    else children.push({ label: sub, children: items });
  }
  tree.push({ label: section, color: "slate", children });
}

// ── 3. Emit ────────────────────────────────────────────────────────────────
const q = s => JSON.stringify(s);
function emit(nodes, indent) {
  const pad = " ".repeat(indent);
  return nodes.map(n => {
    const bits = [`label: ${q(n.label)}`];
    if (n.color) bits.push(`color: ${q(n.color)}`);
    if (n.defaultOpen) bits.push("defaultOpen: true");
    if (n.path) bits.push(`path: ${q(n.path)}`);
    if (n.isPlaceholder) bits.push("isPlaceholder: true");
    if (n.children) {
      return `${pad}{\n${pad}  ${bits.join(`,\n${pad}  `)},\n${pad}  children: [\n${emit(n.children, indent + 4)}\n${pad}  ],\n${pad}},`;
    }
    return `${pad}{ ${bits.join(", ")} },`;
  }).join("\n");
}

const header = `// ─── Recursive navigation tree ──────────────────────────────────────────────
//
// Ported from russell-capital-app, where the shape was first worked out, and
// reconciled against this build's route manifest.
//
// ## Why a tree
//
// The previous structure in AppShell was three fixed levels — Section,
// Subgroup, Item — and could not nest further. Subjects that genuinely have
// depth, like estate planning or tax strategy, had to be flattened into it.
// A NavNode is either a folder (has \`children\`) or a leaf (has \`path\`, or is
// a placeholder), and nests to any depth. This tree currently reaches five.
//
// ## Reconciliation against this build
//
// The imported tree was written against a different application with a
// different route surface, so it was reconciled on import:
//
//   - A leaf naming a route this build does not register is kept as a
//     \`isPlaceholder\` node. It renders as a label rather than a link, so the
//     information architecture survives without a dead target.
//   - Every navigation entry the previous AppShell structure carried is
//     present here, keeping the grouping it already had. Nothing that was
//     reachable before became unreachable.
//   - A path appears at most once.
//
// \`navTree.test.ts\` enforces all three, plus the rule that every non-placeholder
// path is in \`ROUTE_MANIFEST\`. Regenerate with scripts/build-nav-tree.mjs.
//
// This file is deliberately free of React imports: icons are string tags that
// the renderer maps to components, so the tree can be imported by tests and
// by node scripts without pulling in the UI.

export type NavNode = {
  label: string;
  icon?: string;
  color?: string;
  path?: string;
  isPlaceholder?: boolean;
  children?: NavNode[];
  defaultOpen?: boolean;
};

export const MEDICAL_TREE: readonly NavNode[] = [
${emit(tree, 2)}
];

/** Every real (non-placeholder) destination in the tree, in order. */
export function collectPaths(nodes: readonly NavNode[] = MEDICAL_TREE): string[] {
  const out: string[] = [];
  const walk = (ns: readonly NavNode[]) => {
    for (const n of ns) {
      if (n.path) out.push(n.path);
      if (n.children) walk(n.children);
    }
  };
  walk(nodes);
  return out;
}

/** Every node, depth-first, each with the labels of its ancestors. */
export function flattenNavTree(
  nodes: readonly NavNode[] = MEDICAL_TREE,
  trail: string[] = []
): Array<{ node: NavNode; trail: string[] }> {
  const out: Array<{ node: NavNode; trail: string[] }> = [];
  for (const n of nodes) {
    out.push({ node: n, trail });
    if (n.children) out.push(...flattenNavTree(n.children, [...trail, n.label]));
  }
  return out;
}

/** Depth of the deepest branch. Used by the tests to assert the tree still nests. */
export function treeDepth(nodes: readonly NavNode[] = MEDICAL_TREE): number {
  if (!nodes.length) return 0;
  return 1 + Math.max(...nodes.map(n => (n.children ? treeDepth(n.children) : 0)));
}
`;

fs.writeFileSync(`${B}/client/src/navTree.ts`, header);
console.log(`imported leaves kept:  ${kept}`);
console.log(`converted to placeholder: ${placeheld}`);
console.log(`base entries folded in:   ${folded}`);
console.log(`total real destinations:  ${seen.size}`);

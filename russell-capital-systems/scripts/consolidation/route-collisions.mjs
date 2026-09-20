#!/usr/bin/env node
/**
 * Route collision checker.
 *
 * Compares the routes this application registers against a donor repository's
 * routes, and classifies every path into one of three buckets:
 *
 *   COLLISION  — the same path exists in both. Needs a named decision. An
 *                import would silently replace a working page.
 *   DONOR-ONLY — a genuine migration candidate.
 *   BASE-ONLY  — ours alone. Untouched.
 *
 * ─── WHY THIS IS A SCRIPT AND NOT A PARAGRAPH ───────────────────────────────
 *
 * A collision list written into a document is accurate on the day it is
 * written and misleading a week later, once either side has moved. The number
 * that matters during a migration is the number right now, so this runs in CI
 * on every PR and fails when a migration introduces a collision that was not
 * declared.
 *
 * Usage:
 *   node scripts/consolidation/route-collisions.mjs                 # report
 *   node scripts/consolidation/route-collisions.mjs --check         # CI mode
 *   node scripts/consolidation/route-collisions.mjs --donor <path>  # other donor
 *
 * In --check mode it exits non-zero if the base registers a route that is not
 * in the manifest, or the manifest lists one the base does not register. The
 * donor comparison is informational and never fails the build: a donor repo
 * moving is not this repo's problem.
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const OUT = join(ROOT, "docs", "consolidation");

const args = process.argv.slice(2);
const CHECK = args.includes("--check");
const donorIdx = args.indexOf("--donor");
const DONOR = donorIdx >= 0 ? args[donorIdx + 1] : "/home/user/russell-capital";

/** Paths declared in the manifest — the intended set. */
function manifestRoutes() {
  const p = join(ROOT, "shared", "routeManifest.ts");
  if (!existsSync(p)) throw new Error(`Route manifest not found at ${p}`);
  const src = readFileSync(p, "utf8");
  // Only string literals inside the exported array, not the prose above it.
  const body = src.slice(src.indexOf("ROUTE_MANIFEST"));
  return new Set([...body.matchAll(/"(\/[^"]*)"/g)].map(m => m[1]));
}

/** Paths actually registered in App.tsx — the real set. */
function registeredRoutes(root) {
  const p = join(root, "client", "src", "App.tsx");
  if (!existsSync(p)) return null;
  const src = readFileSync(p, "utf8");
  return new Set([...src.matchAll(/<Route\s+path="([^"]+)"/g)].map(m => m[1]));
}

const sorted = s => [...s].sort();
const only = (a, b) => sorted(a).filter(x => !b.has(x));

const manifest = manifestRoutes();
const registered = registeredRoutes(ROOT);

let failed = false;

// ── Manifest vs reality ─────────────────────────────────────────────────────
// Both directions, because each failure mode is different: a route registered
// but unlisted is an undeclared surface; a route listed but unregistered is a
// dead promise, and a link somewhere already points at it.
if (registered) {
  const undeclared = only(registered, manifest);
  const dead = only(manifest, registered);

  console.log(`Manifest: ${manifest.size} routes · App.tsx: ${registered.size} routes`);

  if (undeclared.length) {
    failed = true;
    console.error(`\n✗ ${undeclared.length} route(s) registered but NOT in the manifest:`);
    for (const r of undeclared) console.error(`    ${r}`);
    console.error("  Add each to shared/routeManifest.ts in the same commit.");
  }
  if (dead.length) {
    failed = true;
    console.error(`\n✗ ${dead.length} route(s) in the manifest but NOT registered:`);
    for (const r of dead) console.error(`    ${r}`);
    console.error("  Either register them or remove them from the manifest.");
  }
  if (!undeclared.length && !dead.length) console.log("✓ Manifest and App.tsx agree.");
} else {
  console.error("✗ Could not read client/src/App.tsx — cannot verify the manifest.");
  failed = true;
}

// ── Donor comparison — informational only ───────────────────────────────────
const donor = registeredRoutes(DONOR);
if (!donor) {
  console.log(`\nDonor not available at ${DONOR} — skipping comparison.`);
  console.log("(Expected in CI. The donor is a separate repository.)");
} else {
  const collisions = sorted(manifest).filter(r => donor.has(r));
  const donorOnly = only(donor, manifest);
  const baseOnly = only(manifest, donor);

  console.log(`\nDonor: ${DONOR}`);
  console.log(`  Donor routes            : ${donor.size}`);
  console.log(`  COLLISIONS (both repos) : ${collisions.length}  ← each needs a named decision`);
  console.log(`  DONOR-ONLY (candidates) : ${donorOnly.length}`);
  console.log(`  BASE-ONLY  (untouched)  : ${baseOnly.length}`);

  mkdirSync(OUT, { recursive: true });
  const write = (name, list) => writeFileSync(join(OUT, name), list.join("\n") + "\n");
  write("collisions.txt", collisions);
  write("donor_only.txt", donorOnly);
  write("base_only.txt", baseOnly);
  write("base_routes.txt", sorted(manifest));
  write("donor_routes.txt", sorted(donor));
  console.log(`  Lists written to ${OUT}`);

  if (collisions.length) {
    console.log(
      `\n  NOTE: a directory-level copy from the donor would replace ${collisions.length} working` +
      `\n  pages, including ${collisions.slice(0, 3).join(", ")}. Resolve each by hand.`,
    );
  }
}

if (CHECK && failed) {
  console.error("\nRoute check FAILED.");
  process.exit(1);
}
console.log(CHECK ? "\nRoute check passed." : "\nDone.");

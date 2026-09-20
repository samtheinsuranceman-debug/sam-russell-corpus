#!/usr/bin/env node
// Route integrity. Run after `pnpm run build`, from russell-capital-systems/.
//
// The authoritative manifest is dist/public/routes.json, emitted by
// scripts/build.mjs. This compares it against the source of truth it is built
// from (client/src/App.tsx) and fails on any disagreement or duplicate.
//
// audit/route_manifest.json is deliberately NOT treated as authoritative: it is
// a stale audit artifact (see docs/CURRENT_STATE_BASELINE.md). Its count is
// reported for visibility only.
import { readFileSync, existsSync } from "node:fs";

const fail = (msg) => { console.error(`FAIL: ${msg}`); process.exitCode = 1; };

const BUILT = "dist/public/routes.json";
if (!existsSync(BUILT)) {
  console.error(`FAIL: ${BUILT} is missing — run \`pnpm run build\` first.`);
  process.exit(1);
}

const built = JSON.parse(readFileSync(BUILT, "utf8")).routes;
const app = readFileSync("client/src/App.tsx", "utf8");
const declared = [...app.matchAll(
  /<Route\s[^>]*path=(?:"([^"]+)"|\{`([^`]+)`\}|\{"([^"]+)"\})/g,
)].map((m) => m[1] ?? m[2] ?? m[3]);

console.log(`built manifest : ${built.length} routes  (${BUILT})`);
console.log(`App.tsx        : ${declared.length} declarations, ${new Set(declared).size} distinct`);

if (existsSync("audit/route_manifest.json")) {
  const audit = JSON.parse(readFileSync("audit/route_manifest.json", "utf8")).route_count;
  console.log(`audit manifest : ${audit} routes (informational; stale by design — see docs/CURRENT_STATE_BASELINE.md)`);
}

// 1. The regex must actually be matching. A silent zero would make every other
//    check pass vacuously.
if (declared.length < 100) fail(`only ${declared.length} <Route> declarations parsed from App.tsx — the parser is broken, not the routes`);

// 2. No duplicate path declared twice in App.tsx.
const seen = new Map();
for (const p of declared) seen.set(p, (seen.get(p) ?? 0) + 1);
const dupes = [...seen].filter(([, n]) => n > 1).map(([p, n]) => `${p} (x${n})`);
if (dupes.length) fail(`duplicate route declarations: ${dupes.join(", ")}`);
else console.log("duplicates     : none");

// 3. The built manifest and the source must agree exactly, both ways.
const builtSet = new Set(built);
const declSet = new Set(declared);
const missing = [...declSet].filter((p) => !builtSet.has(p));
const extra = [...builtSet].filter((p) => !declSet.has(p));
if (missing.length) fail(`declared in App.tsx but absent from the built manifest: ${missing.join(", ")}`);
if (extra.length) fail(`in the built manifest but not declared in App.tsx: ${extra.join(", ")}`);
if (!missing.length && !extra.length) console.log("manifest match : exact");

if (process.exitCode) console.error("\nRoute integrity FAILED.");
else console.log("\nRoute integrity OK.");

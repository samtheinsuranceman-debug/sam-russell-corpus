#!/usr/bin/env node
// Guard for the production bundle: dist/index.js must not statically import any
// package that is not in "dependencies" (devDependencies are absent on a host
// installed with `npm install --omit=dev`, and one such import — vite — once
// crashed the server at startup). Run after `pnpm build`; part of `pnpm release`.
import { readFileSync } from "node:fs";
import { builtinModules } from "node:module";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const deps = new Set(Object.keys(pkg.dependencies ?? {}));
const dev = new Set(Object.keys(pkg.devDependencies ?? {}));
const bundle = readFileSync("dist/index.js", "utf8");

// Static ESM imports only — `import("x")` is lazy and allowed.
const specs = new Set();
for (const m of bundle.matchAll(/^\s*import\s+(?:[^'"]*?\s+from\s+)?["']([^"']+)["']/gm)) specs.add(m[1]);
for (const m of bundle.matchAll(/^\s*export\s+\*\s+from\s+["']([^"']+)["']/gm)) specs.add(m[1]);

const pkgName = (s) => (s.startsWith("@") ? s.split("/").slice(0, 2).join("/") : s.split("/")[0]);
const isBuiltin = (s) => s.startsWith("node:") || builtinModules.includes(pkgName(s));
const problems = [];
for (const s of specs) {
  if (s.startsWith(".") || s.startsWith("/") || isBuiltin(s)) continue;
  const name = pkgName(s);
  if (!deps.has(name)) problems.push(`${name}${dev.has(name) ? " (devDependency)" : " (not in package.json)"}`);
}
if (problems.length) {
  console.error("✘ dist/index.js statically imports packages that won't exist on a production host:\n  " + [...new Set(problems)].join("\n  "));
  process.exit(1);
}
console.log(`✔ production bundle imports ${[...specs].filter((s) => !s.startsWith(".") && !isBuiltin(s)).length} runtime packages, all in dependencies`);

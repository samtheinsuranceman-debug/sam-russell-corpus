// Route integrity: the manifest and the router must agree exactly, with no
// duplicates on either side. Run from russell-capital-systems/.
//
// Kept as a file rather than inlined in the workflow because a regex embedded
// in a double-quoted shell string loses its backslashes — which silently turned
// an earlier version of the sibling secret scanner into a no-op that reported
// "clean" on a planted key.
import { readFileSync } from 'node:fs';

const manifestSrc = readFileSync('shared/routeManifest.ts', 'utf8');
const appSrc = readFileSync('client/src/App.tsx', 'utf8');

const manifest = (manifestSrc.match(/['"](\/[^'"]*)['"]/g) || []).map((s) => s.slice(1, -1));
const routes = (appSrc.match(/path="[^"]+"/g) || []).map((s) => s.slice(6, -1));

function duplicates(list) {
  const seen = Object.create(null);
  for (const x of list) seen[x] = (seen[x] || 0) + 1;
  return Object.keys(seen).filter((k) => seen[k] > 1);
}

const manifestSet = Object.create(null);
for (const r of manifest) manifestSet[r] = true;
const routeSet = Object.create(null);
for (const r of routes) routeSet[r] = true;

const manifestDupes = duplicates(manifest);
const routeDupes = duplicates(routes);
const missingFromManifest = routes.filter((r) => !manifestSet[r]);
const missingFromRouter = manifest.filter((r) => !routeSet[r]);

console.log('manifest entries         :', manifest.length);
console.log('App.tsx route decls      :', routes.length);
console.log('duplicate manifest paths :', manifestDupes.length);
console.log('duplicate route decls    :', routeDupes.length);
console.log('in router, not manifest  :', missingFromManifest.length);
console.log('in manifest, not router  :', missingFromRouter.length);

let failed = false;
function fail(message, list) {
  failed = true;
  console.log(`::error::${message} -> ${list.join(', ')}`);
}
if (manifest.length === 0 || routes.length === 0) {
  fail('Parsed zero routes — the check itself is broken, not the routes', ['abort']);
}
if (manifestDupes.length) fail('Duplicate path in routeManifest.ts', manifestDupes);
if (routeDupes.length) fail('Duplicate route declared in App.tsx', routeDupes);
if (missingFromManifest.length) fail('Route in App.tsx missing from routeManifest.ts', missingFromManifest);
if (missingFromRouter.length) fail('Route in routeManifest.ts with no App.tsx declaration', missingFromRouter);

if (failed) process.exit(1);
console.log('Route integrity OK — manifest and router agree, no duplicates.');

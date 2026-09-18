import { readFile } from "node:fs/promises";

const baseUrl = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:4177";
const manifestPath = process.env.ROUTE_MANIFEST ?? "audit/route_manifest.json";

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const routes = manifest.routes.map((record) => record.route);

const required = ["/", "/api/trpc/auth.me"];
const concurrency = 16;
const failures = [];
let cursor = 0;

async function check(path) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: "manual",
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status < 200 || response.status >= 400) {
    failures.push({ path, status: response.status });
  }
}

async function worker() {
  while (cursor < routes.length) {
    const index = cursor++;
    await check(routes[index]);
  }
}

for (const path of required) await check(path);
await Promise.all(Array.from({ length: concurrency }, () => worker()));

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, checked: routes.length, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  userFacingRoutesChecked: routes.length,
  requiredEndpointsChecked: required,
  baseUrl,
}, null, 2));

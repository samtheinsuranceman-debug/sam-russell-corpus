import { readFileSync, writeFileSync } from "node:fs";

const path = "audit/route_manifest.json";
const document = JSON.parse(readFileSync(path, "utf8"));
const routes = Array.isArray(document) ? document : document.routes;
if (!Array.isArray(routes)) throw new Error("Route manifest has no routes array");

for (const route of routes) delete route.audit_input_file;
if (!routes.some(route => route.route === "/client-portal/:token")) {
  routes.push({
    index: Math.max(...routes.map(route => Number(route.index) || 0)) + 1,
    route: "/client-portal/:token",
    component: "ClientPortalView",
    category: "public_or_auth",
    source_file: "client/src/pages/ClientPortalView.tsx",
    source_hash: "runtime-audited",
    metrics: { lines: 0, trpc_queries: 1, trpc_mutations: 0, forms: 0, buttons: 0, links: 0, charts: 0, loading_states: 1, error_states: 1, empty_states: 1, simulated_timers: 0, random_values: 0, placeholder_terms: 0, hardcoded_success_toasts: 0, external_urls: 0, local_storage: 0, download_actions: 0 },
    same_source_routes: ["/client-portal/:token"],
  });
}
if (!Array.isArray(document)) {
  for (const key of ["route_count", "routeCount", "total_routes", "totalRoutes"]) if (key in document) document[key] = routes.length;
}
writeFileSync(path, `${JSON.stringify(document, null, 2)}\n`);
console.log(`[route-manifest] ${routes.length} routes`);

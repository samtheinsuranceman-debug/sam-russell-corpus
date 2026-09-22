/**
 * Every internal link in the app must resolve to a registered route.
 *
 * Splitting the biochemistry pages (flu heatmap, COVID tracker, cardiac
 * dashboard, biomarker engine) into their own build removed those routes but
 * left the links behind in the nav, the dashboard, the patient portal and the
 * landing page. Each was a silent 404. This test makes that class of breakage
 * fail the suite instead of shipping.
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

function readAppRoutes(): Set<string> {
  const app = fs.readFileSync("client/src/App.tsx", "utf-8");
  const routes = new Set<string>();
  for (const m of app.matchAll(/path="(\/[^"]*)"/g)) routes.add(m[1]);
  return routes;
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

/** Routes that take a parameter, matched by prefix rather than exactly. */
const PARAMETERIZED = ["/report/", "/shared/", "/finance/calc/", "/finance/strategy/"];

/** Files that are template scaffolding, not part of the shipped app. */
const IGNORED_FILES = [
  "client/src/pages/ComponentShowcase.tsx",
  "client/src/components/DashboardLayout.tsx",
];

describe("internal navigation", () => {
  const routes = readAppRoutes();

  it("registers the core clinical routes", () => {
    for (const r of ["/", "/crisis", "/vital-signs", "/prs", "/assessment", "/psychiatrist"]) {
      expect(routes, `missing route ${r}`).toContain(r);
    }
  });

  it("has no link pointing at a route that does not exist", () => {
    const dead: string[] = [];

    for (const file of walk("client/src")) {
      const rel = file.replace(/\\/g, "/");
      if (IGNORED_FILES.some((f) => rel.endsWith(f) || rel === f)) continue;

      const src = fs.readFileSync(file, "utf-8");
      for (const m of src.matchAll(/\b(?:href|path)[:=]\s*"(\/[a-z0-9/-]*)"/gi)) {
        const link = m[1];
        if (link === "/") continue;
        if (routes.has(link)) continue;
        if (PARAMETERIZED.some((p) => link.startsWith(p))) continue;
        dead.push(`${rel} -> ${link}`);
      }
    }

    expect(dead, `dead internal links:\n${dead.join("\n")}`).toEqual([]);
  });

  it("keeps the biochemistry routes out of this build", () => {
    // These belong to the separate russell-labs-biochem build. If one comes
    // back here, the split has regressed.
    for (const r of ["/flu-heatmap", "/covid-tracker", "/cardiac-dashboard", "/biomarker"]) {
      expect(routes, `${r} should not be registered in Doctor Buddy`).not.toContain(r);
    }
  });

  it("reaches every registered route from the nav or the landing page", () => {
    const navSrc = fs.readFileSync("client/src/components/NavBar.tsx", "utf-8");
    const homeSrc = fs.readFileSync("client/src/pages/Home.tsx", "utf-8");
    const reachable = new Set<string>();
    for (const src of [navSrc, homeSrc]) {
      for (const m of src.matchAll(/\b(?:href|path)[:=]\s*"(\/[a-z0-9/-]*)"/gi)) {
        reachable.add(m[1]);
      }
    }

    // Routes a user is not meant to navigate to directly.
    const notLinked = new Set([
      "/404",
      "/login",
      "/admin",
      "/settings",
      "/dashboard",
      "/report/:id",
      "/shared/:token",
      // Reached from the finance hub, one per calculator and strategy.
      "/finance/calc/:id",
      "/finance/strategy/:slug",
      "/life-maps",
      "/life-events",
      "/ai-advisory",
      "/doctor",
      "/psychiatrist",
      "/patient",
    ]);

    const orphans = [...routes].filter((r) => !reachable.has(r) && !notLinked.has(r));
    expect(orphans, `routes with no link anywhere: ${orphans.join(", ")}`).toEqual([]);
  });
});

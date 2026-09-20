import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { SECONDARY_CATALOG } from "../client/src/lib/secondaryCatalog";

function staticPortalRoutes(source: string) {
  return new Set(Array.from(source.matchAll(/<Route\b[^>]*\bpath=[{]?["']([^"']+)["']/g), match => match[1])
    .filter(path => path.startsWith("/portal/") && !path.includes(":")));
}

describe("organized portal navigation", () => {
  const appSource = readFileSync(resolve("client/src/App.tsx"), "utf8");
  const shellSource = readFileSync(resolve("client/src/components/AppShell.tsx"), "utf8");
  const librarySource = readFileSync(resolve("client/src/pages/portal/SecondaryInformation.tsx"), "utf8");
  const sectionSource = shellSource.slice(shellSource.indexOf("const NAV_SECTIONS"), shellSource.indexOf("const BOTTOM_TABS"));
  const navPaths = Array.from(sectionSource.matchAll(/path:\s*["']([^"']+)["']/g), match => match[1]);
  const navSet = new Set(navPaths);
  const secondarySet = new Set(SECONDARY_CATALOG.map(item => item.path));
  const routes = staticPortalRoutes(appSource);

  it("keeps each destination in only one left-sidebar location", () => {
    expect(navPaths.length).toBe(navSet.size);
  });

  it("still reaches the catalog library page itself", () => {
    // The "Secondary Information" SECTION is gone — the owner could not identify
    // what it contained, which is a fair verdict on a name like that. The
    // library PAGE survives as a browsable index and is reachable from Learning.
    expect(navSet.has("/portal/secondary-information")).toBe(true);
  });

  it("no longer points the sidebar at routes that do not exist", () => {
    // These two were sidebar links into the old library with no matching Route.
    // They 404'd. Removed in the 2026-09-19 rebuild.
    expect(routes.has("/portal/tool-explorer")).toBe(false);
    expect(navSet.has("/portal/tool-explorer")).toBe(false);
    expect(routes.has("/portal/knowledge-library")).toBe(false);
    expect(navSet.has("/portal/knowledge-library")).toBe(false);
  });

  it("keeps the generated secondary catalog routable — and now also in the sidebar", () => {
    // REVERSED on 2026-09-19. This test used to require every catalog entry to
    // be ABSENT from the sidebar. That requirement is precisely what left 160 of
    // 330 routes unreachable: pages were built, routed, tested, and then filed
    // into an overflow library nobody opened. The owner's instruction was to
    // surface everything in the menu, so the catalog is now a second way to
    // browse the same pages rather than the only way to find them.
    expect(SECONDARY_CATALOG.length).toBeGreaterThan(0);
    for (const item of SECONDARY_CATALOG) {
      expect(routes.has(item.path), `${item.path} is in the catalog but is not a route`).toBe(true);
      expect(navSet.has(item.path), `${item.path} is in the catalog but missing from the sidebar`).toBe(true);
    }
  });

  /**
   * Routes deliberately absent from both navigations, each with its reason.
   *
   * An exemption list is a liability if it is allowed to grow quietly, so it
   * is asserted below: every entry must still be a real route, or it is a
   * stale excuse for a page that no longer exists.
   */
  const NOT_IN_NAVIGATION: Record<string, string> = {
    "/portal/interior":
      "The design-system reference. It shows the shared primitives against sample content for whoever is building screens, and has nothing on it a client would want. Reachable by anyone who types the URL; not advertised.",
  };

  it("makes every static portal route discoverable through primary or secondary navigation", () => {
    const undiscoverable = [...routes]
      .filter((path) => !navSet.has(path) && !secondarySet.has(path))
      .filter((path) => !(path in NOT_IN_NAVIGATION));
    expect(undiscoverable).toEqual([]);
  });

  it("keeps the navigation exemptions honest: each is a real route with a real reason", () => {
    for (const [path, reason] of Object.entries(NOT_IN_NAVIGATION)) {
      expect(routes.has(path), path).toBe(true);
      expect(reason.length, path).toBeGreaterThan(60);
    }
  });

  it("provides search, category filtering, counts, and preserved-route guidance", () => {
    expect(librarySource).toContain("Search every secondary page");
    expect(librarySource).toContain("SECONDARY_CATEGORIES");
    expect(librarySource).toContain("preserved pages");
    expect(librarySource).toContain("No page has been deleted");
  });
});

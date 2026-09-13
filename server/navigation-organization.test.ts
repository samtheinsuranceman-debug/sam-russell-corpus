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

  it("clearly exposes the Secondary Information library", () => {
    expect(shellSource).toContain('label: "Secondary Information"');
    expect(navSet.has("/portal/secondary-information")).toBe(true);
    expect(navSet.has("/portal/tool-explorer")).toBe(true);
    expect(navSet.has("/portal/knowledge-library")).toBe(true);
  });

  it("keeps the generated secondary catalog routable and disjoint from the primary sidebar", () => {
    expect(SECONDARY_CATALOG.length).toBeGreaterThan(0);
    for (const item of SECONDARY_CATALOG) {
      expect(routes.has(item.path), item.path).toBe(true);
      expect(navSet.has(item.path), item.path).toBe(false);
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

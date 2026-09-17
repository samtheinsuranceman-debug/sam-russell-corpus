// The catalogue must not be able to lie.
//
// The page this replaces carried 35 hand-typed cards, 18 of which pointed at
// routes that did not exist. Nobody noticed because nothing checked. These
// tests read the real router and the real page files, so an entry with a bad
// path, a missing page, or a stale engine reference fails here instead of
// 404ing for a client.
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  CALCULATORS, CALCULATOR_COUNT, CATEGORY_ORDER, CATEGORY_LABELS, CATEGORY_BLURBS,
  byCategory, featured, calculator, searchCalculators, categoryCounts,
} from "@shared/calculatorCatalog";

const root = join(import.meta.dirname, "..");
const app = readFileSync(join(root, "client/src/App.tsx"), "utf8");

/** Every path the router actually serves. */
const routed = new Set(
  (app.match(/path="\/[A-Za-z0-9/_:-]*"/g) ?? []).map((m) => m.slice(6, -1)),
);

describe("no dead links — the whole point of the registry", () => {
  it("routes every single catalogue entry", () => {
    const dead = CALCULATORS.filter((c) => !routed.has(c.path));
    expect(dead.map((d) => `${d.name} → ${d.path}`), "catalogue entries with no route").toEqual([]);
  });

  it("has a real page file behind every route it names", () => {
    // Resolve each catalogue path to the component the router lazy-loads, then
    // check that component's file is on disk. A route pointing at a deleted
    // page compiles fine and fails at run time; this catches it.
    for (const c of CALCULATORS) {
      const routeLine = app.split("\n").find((l) => l.includes(`path="${c.path}"`));
      expect(routeLine, `no route line for ${c.path}`).toBeTruthy();
      const comp = routeLine!.match(/component=\{(?:gated\()?([A-Za-z0-9_]+)/)?.[1];
      expect(comp, `could not read the component for ${c.path}`).toBeTruthy();
      const importLine = app.split("\n").find((l) => new RegExp(`const ${comp}\\b.*lazy\\(`).test(l) || new RegExp(`^import ${comp}\\b`).test(l));
      if (!importLine) continue; // inline/aliased component; the route test above already covers reachability
      const rel = importLine.match(/import\("([^"]+)"\)/)?.[1] ?? importLine.match(/from "([^"]+)"/)?.[1];
      if (!rel) continue;
      const file = rel.replace(/^@\//, "client/src/").replace(/^\.\//, "client/src/");
      const onDisk = existsSync(join(root, `${file}.tsx`)) || existsSync(join(root, `${file}.ts`));
      expect(onDisk, `${c.name}: route ${c.path} points at ${file}, which is not on disk`).toBe(true);
    }
  });

  it("names only engines that exist, so provenance claims are checkable", () => {
    for (const c of CALCULATORS) {
      if (!c.engine) continue;
      expect(existsSync(join(root, c.engine)), `${c.name} claims engine ${c.engine}, which does not exist`).toBe(true);
    }
  });

  it("restored the specific routes that used to 404", () => {
    // These are the exact slugs the old hand-typed page linked to and the
    // router did not serve. Named individually so a regression is legible.
    for (const path of ["/portal/iul-projection", "/portal/oil-gas", "/portal/myga-waterfall",
                        "/portal/crypto-cycle", "/portal/estate-planning", "/portal/fia-collateral",
                        "/portal/str-tax-eliminator", "/portal/real-estate", "/portal/risk-score"]) {
      expect(routed.has(path), `${path} is still not routed`).toBe(true);
    }
  });

  it("serves each catalogue path exactly once — a duplicate route silently shadows the second page", () => {
    for (const c of CALCULATORS) {
      const hits = app.split("\n").filter((l) => l.includes(`path="${c.path}"`)).length;
      expect(hits, `${c.path} is declared ${hits} times`).toBe(1);
    }
  });
});

describe("the catalogue's own shape", () => {
  it("carries substantially more than the nine that were reachable before", () => {
    expect(CALCULATOR_COUNT).toBeGreaterThanOrEqual(60);
  });

  it("has no duplicate paths or duplicate names", () => {
    expect(new Set(CALCULATORS.map((c) => c.path)).size).toBe(CALCULATOR_COUNT);
    expect(new Set(CALCULATORS.map((c) => c.name)).size).toBe(CALCULATOR_COUNT);
  });

  it("gives every entry a real blurb written for a client, not a label", () => {
    for (const c of CALCULATORS) {
      expect(c.blurb.length, `${c.name} needs a real blurb`).toBeGreaterThan(30);
      expect(c.blurb.endsWith("."), `${c.name} blurb should be a sentence`).toBe(true);
    }
  });

  it("puts every entry in a known category, and leaves no category empty", () => {
    for (const c of CALCULATORS) expect(CATEGORY_ORDER).toContain(c.category);
    for (const cat of CATEGORY_ORDER) {
      expect(byCategory(cat).length, `category ${cat} is empty`).toBeGreaterThan(0);
      expect(CATEGORY_LABELS[cat]).toBeTruthy();
      expect(CATEGORY_BLURBS[cat].length).toBeGreaterThan(20);
    }
  });

  it("features a handful, not everything — a page where all is featured features nothing", () => {
    expect(featured().length).toBeGreaterThan(5);
    expect(featured().length).toBeLessThan(CALCULATOR_COUNT / 2);
  });

  it("sorts featured entries to the top of their category", () => {
    for (const cat of CATEGORY_ORDER) {
      const list = byCategory(cat);
      const firstUnfeatured = list.findIndex((c) => !c.featured);
      if (firstUnfeatured === -1) continue;
      expect(list.slice(firstUnfeatured).some((c) => c.featured), `${cat} has a featured entry below an unfeatured one`).toBe(false);
    }
  });
});

describe("finding a calculator", () => {
  it("finds by name", () => {
    expect(searchCalculators("mortgage").some((c) => c.name === "Mortgage Killer")).toBe(true);
  });

  it("finds by the words a client would actually type", () => {
    expect(searchCalculators("airbnb").some((c) => c.path === "/portal/short-term-rentals")).toBe(true);
    expect(searchCalculators("death tax").some((c) => c.path === "/portal/estate-tax")).toBe(true);
    expect(searchCalculators("doctor").some((c) => c.path === "/portal/physicians-edge")).toBe(true);
  });

  it("finds by category name", () => {
    expect(searchCalculators("estate").length).toBeGreaterThan(3);
  });

  it("returns everything on an empty query rather than nothing", () => {
    expect(searchCalculators("   ").length).toBe(CALCULATOR_COUNT);
  });

  it("returns nothing for a term that is genuinely absent", () => {
    expect(searchCalculators("zzzzqqq")).toEqual([]);
  });

  it("looks up by path", () => {
    expect(calculator("/portal/tax-waterfall")?.name).toBe("Tax Waterfall");
    expect(calculator("/portal/nope")).toBeUndefined();
  });

  it("counts every entry exactly once across the categories", () => {
    expect(categoryCounts().reduce((s, c) => s + c.count, 0)).toBe(CALCULATOR_COUNT);
  });
});

describe("the pages the client asked for by name are present", () => {
  it("has the Ecological Drivers of Retirement Success", () => {
    const e = CALCULATORS.find((c) => c.name.includes("Ecological Drivers"));
    expect(e, "Ecological Drivers is missing from the catalogue").toBeTruthy();
    expect(routed.has(e!.path)).toBe(true);
  });

  it("has Real Estate Mogul", () => {
    const e = calculator("/portal/real-estate-mogul");
    expect(e?.name).toBe("Real Estate Mogul");
  });
});

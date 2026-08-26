import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const app = read("client/src/App.tsx");
const deepPage = read("client/src/components/DeepPage.tsx");

const families = [
  { name: "line", parent: "LineDetail.tsx", deep: "LineDeep.tsx", constant: "LINE_SUBPAGES", childRoute: 'path={"/line/:slug/:sub"}', parentRoute: 'path={"/line/:slug"}' },
  { name: "pair", parent: "PairDetail.tsx", deep: "PairDeep.tsx", constant: "PAIR_SUBPAGES", childRoute: 'path={"/pair/:slug/:sub"}', parentRoute: 'path={"/pair/:slug"}' },
  { name: "practice", parent: "PracticeDetail.tsx", deep: "PracticeDeep.tsx", constant: "PRACTICE_SUBPAGES", childRoute: 'path={"/practice/:id/:sub"}', parentRoute: 'path={"/practice/:id"}' },
  { name: "goal", parent: "GoalDetail.tsx", deep: "GoalDeep.tsx", constant: "GOAL_SUBPAGES", childRoute: 'path={"/goal/:g/:sub"}', parentRoute: 'path={"/goal/:keyword"}' },
  { name: "capacity", parent: "CapacityDetail.tsx", deep: "CapacitySub.tsx", constant: "CAPACITY_SUBPAGES", childRoute: 'path={"/capacity/:slug/:sub"}', parentRoute: 'path={"/capacity/:slug"}' },
  { name: "kind", parent: "KindDetail.tsx", deep: "KindDeep.tsx", constant: "KIND_SUBPAGES", childRoute: 'path={"/kind/:id/:sub"}', parentRoute: 'path={"/kind/:id"}' },
  { name: "wing", parent: "WingDetail.tsx", deep: "WingDeep.tsx", constant: "WING_SUBPAGES", childRoute: 'path={"/wing/:id/:sub"}', parentRoute: 'path={"/wing/:id"}' },
  { name: "myth", parent: "MythDetail.tsx", deep: "MythDeep.tsx", constant: "MYTH_SUBPAGES", childRoute: 'path={"/myth/:id/:sub"}', parentRoute: 'path={"/myth/:id"}' },
] as const;

describe("202 deep-page navigation contracts", () => {
  it.each(families)("$name parent exposes the matching GoDeeper family", ({ parent, constant }) => {
    const source = read(`client/src/pages/${parent}`);
    expect(source).toContain("GoDeeper");
    expect(source).toContain(constant);
    expect(source).toMatch(/<GoDeeper\s/);
  });

  it.each(families)("$name child route precedes its parent route", ({ childRoute, parentRoute }) => {
    const childIndex = app.indexOf(childRoute);
    const parentIndex = app.indexOf(parentRoute);
    expect(childIndex).toBeGreaterThan(-1);
    expect(parentIndex).toBeGreaterThan(-1);
    expect(childIndex).toBeLessThan(parentIndex);
  });

  it.each(families)("$name deep module wires sibling navigation and a NotFound guard", ({ deep, constant }) => {
    const source = read(`client/src/pages/${deep}`);
    expect(source).toContain("SiblingNav");
    expect(source).toContain(constant);
    expect(source).toContain("NotFound");
    expect(source).toMatch(/return <NotFound\s*\/>/);
  });

  it("shared sibling navigation links every source-defined subpage", () => {
    expect(deepPage).toContain("subs.map");
    expect(deepPage).toContain('href={`${base}/${s}`}');
  });

  it("ranked best-protocol pages retain the shared assessment CTA and invalid-route guard", () => {
    const source = read("client/src/pages/BestProtocols.tsx");
    expect(app).toContain('path={"/best/:kind/:line"}');
    expect(source).toContain("DeepCta");
    expect(source).toMatch(/return <NotFound\s*\/>/);
    expect(deepPage).toContain('<Link href="/assessment"');
  });

  it("the application retains a final NotFound route after every deep route", () => {
    const finalNotFound = app.indexOf('<Route component={NotFound} />');
    expect(finalNotFound).toBeGreaterThan(app.indexOf('path={"/best/:kind/:line"}'));
    for (const { childRoute } of families) {
      expect(finalNotFound).toBeGreaterThan(app.indexOf(childRoute));
    }
  });
});

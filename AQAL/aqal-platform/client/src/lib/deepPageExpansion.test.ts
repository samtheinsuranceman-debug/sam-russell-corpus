import { describe, expect, it } from "vitest";
import {
  BEST_COMBOS,
  CAPACITY_SUBPAGES,
  COMPARE_PAIRS,
  COMPARE_SUBPAGES,
  BUILD_ENTRIES,
  BUILD_SUBPAGES,
  GOAL_SUBPAGES,
  KIND_SUBPAGES,
  LINE_SUBPAGES,
  MYTH_SUBPAGES,
  PAIR_SUBPAGES,
  PRACTICE_SUBPAGES,
  PROTOCOL_SUBPAGES,
  SITEMAP_PATHS,
  WING_SUBPAGES,
  compareSlug,
  engineLineSlug,
  therapySlug,
} from "@shared/seo";
import { HYPNOSIS_IDS } from "@shared/hypnosisTopics";
import { routeMetaFor } from "./routeMetaFor";
import { shortFor } from "./pageShorts";

const firstCompare = COMPARE_PAIRS[0]!;
const firstBuild = BUILD_ENTRIES[0]!;

const REPRESENTATIVE_DEEP_ROUTES = [
  "/line/emotional/at-work",
  "/pair/logical--strategic/collide",
  "/practice/sleep/start",
  "/goal/focus/plan",
  "/myth/laetrile/receipts",
  "/capacity/adaptive/signs",
  "/kind/psychotherapy/standards",
  "/wing/miracle-cure/spot",
  "/best/psychotherapy/tactical",
  "/protocol/emdr/score",
  "/protocol/emdr/daily-life",
  `/compare/${compareSlug(firstCompare[0], firstCompare[1])}/verdict`,
  `/compare/${compareSlug(firstCompare[0], firstCompare[1])}/switch`,
  `/build/${engineLineSlug(firstBuild.line)}/${therapySlug(firstBuild.therapy)}/plan`,
  "/rankings",
  "/hypnosis",
  "/hypnosis/emotional-steadiness",
];

describe("203 deep-page and hypnosis expansion", () => {
  it("contains exactly 11,659 unique canonical sitemap paths", () => {
    expect(SITEMAP_PATHS).toHaveLength(11659);
    expect(new Set(SITEMAP_PATHS).size).toBe(SITEMAP_PATHS.length);
  });

  it("keeps every declared deep-page family at its reviewed size", () => {
    expect(MYTH_SUBPAGES).toHaveLength(4);
    expect(PAIR_SUBPAGES).toHaveLength(3);
    expect(LINE_SUBPAGES).toHaveLength(6);
    expect(PRACTICE_SUBPAGES).toHaveLength(4);
    expect(GOAL_SUBPAGES).toHaveLength(2);
    expect(KIND_SUBPAGES).toHaveLength(3);
    expect(WING_SUBPAGES).toHaveLength(2);
    expect(CAPACITY_SUBPAGES).toHaveLength(3);
    expect(PROTOCOL_SUBPAGES).toHaveLength(11);
    expect(COMPARE_SUBPAGES).toHaveLength(2);
    expect(BUILD_SUBPAGES).toHaveLength(1);
    expect(HYPNOSIS_IDS).toHaveLength(50);
    expect(BEST_COMBOS).toHaveLength(88);
  });

  it.each(REPRESENTATIVE_DEEP_ROUTES)("registers metadata and a short description for %s", (path) => {
    expect(SITEMAP_PATHS).toContain(path);
    const meta = routeMetaFor(path);
    expect(meta?.title).toBeTruthy();
    expect(meta?.title.length).toBeLessThanOrEqual(60);
    expect(meta?.description).toBeTruthy();
    expect(meta?.description.length).toBeLessThanOrEqual(160);
    const short = shortFor(path);
    expect(short).toBeTruthy();
    expect(short!.length).toBeLessThan(60);
  });

  it("does not mint unsupported deep paths", () => {
    expect(SITEMAP_PATHS).not.toContain("/line/emotional/not-a-page");
    expect(SITEMAP_PATHS).not.toContain("/myth/laetrile/not-a-page");
    expect(SITEMAP_PATHS).not.toContain("/best/not-a-kind/tactical");
    expect(SITEMAP_PATHS).not.toContain("/hypnosis/not-a-session");
    expect(SITEMAP_PATHS).not.toContain(`/compare/${compareSlug(firstCompare[0], firstCompare[1])}/not-a-page`);
  });
});

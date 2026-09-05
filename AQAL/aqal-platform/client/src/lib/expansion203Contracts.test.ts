import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { HYPNOSIS_IDS, HYPNOSIS_TOPICS, hypnosisById } from "@shared/hypnosisTopics";
import { THERAPY_SCORES, scoreFor } from "@shared/therapyScores";
import { THERAPY_NAMES } from "@shared/seo";

const root = resolve(import.meta.dirname, "../../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const app = read("client/src/App.tsx");
const library = read("client/src/pages/HypnosisLibrary.tsx");
const detail = read("client/src/pages/HypnosisDetail.tsx");

describe("203/205 hypnosis library integrity", () => {
  it("contains the exact 50 unique, route-safe 205 topics", () => {
    expect(HYPNOSIS_TOPICS).toHaveLength(50);
    expect(HYPNOSIS_IDS).toHaveLength(50);
    expect(new Set(HYPNOSIS_IDS).size).toBe(50);
    expect(HYPNOSIS_IDS.every((id) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))).toBe(true);
    expect(HYPNOSIS_TOPICS.every((topic) => hypnosisById(topic.id) === topic)).toBe(true);
  });

  it("preserves the reviewed 16/10/8/8/8 family allocation", () => {
    const counts = HYPNOSIS_TOPICS.reduce<Record<string, number>>((result, topic) => {
      result[topic.family] = (result[topic.family] ?? 0) + 1;
      return result;
    }, {});
    expect(counts).toEqual({ line: 16, state: 10, future: 8, habit: 8, recover: 8 });
  });

  it("keeps every topic field explicit and nonempty", () => {
    for (const topic of HYPNOSIS_TOPICS) {
      expect(topic.title.trim()).not.toBe("");
      expect(topic.target.trim()).not.toBe("");
      expect(topic.length).toMatch(/^\d+(?:–\d+)? min(?: \(designed to be slept through\))?$/);
      expect(topic.purpose.trim()).not.toBe("");
      expect(topic.suggestions.trim()).not.toBe("");
      expect(topic.imagery.trim()).not.toBe("");
    }
  });

  it("requires overt suggestion, no-driving, distress, non-medical, clinician, and recording-placeholder disclosures", () => {
    for (const phrase of ["overt", "every suggestion theme", "not medical treatment", "Never listen while driving"]) {
      expect(library).toContain(phrase);
    }
    expect(library).toMatch(/not\s+fabricated audio/);
    for (const phrase of ["never while driving", "pause or stop", "distressed or disoriented", "not medical treatment", "qualified licensed clinicians", "recording slot is intentionally empty"]) {
      expect(detail).toContain(phrase);
    }
    expect(library).not.toMatch(/<audio\b/i);
    expect(detail).not.toMatch(/<audio\b/i);
  });

  it("keeps the detail route before the hub and invalid IDs behind NotFound", () => {
    expect(app.indexOf('path={"/hypnosis/:id"}')).toBeGreaterThan(-1);
    expect(app.indexOf('path={"/hypnosis"}')).toBeGreaterThan(-1);
    expect(app.indexOf('path={"/hypnosis/:id"}')).toBeLessThan(app.indexOf('path={"/hypnosis"}'));
    expect(detail).toMatch(/if \(!topic\) return <NotFound\s*\/>/);
  });
});

describe("203 transparent scoring and navigation contracts", () => {
  it("scores every therapy once with a complete, bounded rank table", () => {
    expect(THERAPY_SCORES).toHaveLength(THERAPY_NAMES.length);
    expect(new Set(THERAPY_SCORES.map((entry) => entry.therapy)).size).toBe(THERAPY_NAMES.length);
    expect(new Set(THERAPY_SCORES.map((entry) => entry.rank)).size).toBe(THERAPY_NAMES.length);
    expect(THERAPY_SCORES.map((entry) => entry.rank).sort((a, b) => a - b)).toEqual(
      Array.from({ length: THERAPY_NAMES.length }, (_, index) => index + 1),
    );
    expect(THERAPY_SCORES.every((entry) => entry.total >= 0 && entry.total <= 100 && scoreFor(entry.therapy) === entry)).toBe(true);
  });

  it("keeps compare and build child routes before their parents", () => {
    expect(app.indexOf('path={"/compare/:slug/:sub"}')).toBeLessThan(app.indexOf('path={"/compare/:slug"}'));
    expect(app.indexOf('path={"/build/:line/:therapy/plan"}')).toBeLessThan(app.indexOf('path={"/build/:line/:therapy"}'));
  });

  it("keeps all new parent-to-child links discoverable", () => {
    const therapy = read("client/src/pages/TherapyDetail.tsx");
    for (const id of ["score", "synergy", "atrophy", "daily-life"]) expect(therapy).toContain(`["${id}"`);
    const compare = read("client/src/pages/CompareDetail.tsx");
    expect(compare).toContain("/verdict");
    expect(compare).toContain("/switch");
    expect(read("client/src/pages/BuildDetail.tsx")).toContain("/plan`");
  });

  it("preserves the verified research correction and rejects the unsupported later number", () => {
    const adapter = read("client/src/pages/researchLibraryData.ts");
    expect(adapter).toContain("106,579");
    expect(adapter).not.toContain("109,646");
  });
});

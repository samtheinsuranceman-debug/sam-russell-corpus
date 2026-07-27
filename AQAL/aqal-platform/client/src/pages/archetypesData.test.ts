import { describe, it, expect } from "vitest";
import {
  ARCHETYPES,
  archetypeProfiles,
  isolationFindings,
  starvationCards,
  integratedProfiles,
} from "./archetypesData";

// Integrity guard for the Intelligence Archetype dossier. The page's whole
// credibility rests on every entry being well-formed and every source being a
// real, resolvable citation — so a bad append should fail CI, not ship silently.
describe("archetypes dossier integrity", () => {
  it("has a healthy number of entries", () => {
    expect(ARCHETYPES.length).toBeGreaterThan(200);
  });

  it("every id is unique", () => {
    const ids = ARCHETYPES.map((a) => a.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes).toEqual([]);
  });

  it("every entry has the required narrative fields filled", () => {
    for (const a of ARCHETYPES) {
      expect(a.id, `id on ${a.name}`).toBeTruthy();
      expect(a.name, `name on ${a.id}`).toBeTruthy();
      expect(a.pattern.trim().length, `pattern on ${a.id}`).toBeGreaterThan(10);
      expect(a.untreatedTrajectory.trim().length, `untreatedTrajectory on ${a.id}`).toBeGreaterThan(10);
      expect(a.connectionCase.trim().length, `connectionCase on ${a.id}`).toBeGreaterThan(10);
      expect(["archetype", "isolation", "connection", "starvation", "integrated"]).toContain(a.kind);
    }
  });

  it("every entry cites at least one source, and every source is well-formed", () => {
    for (const a of ARCHETYPES) {
      expect(a.sources.length, `sources on ${a.id}`).toBeGreaterThanOrEqual(1);
      for (const s of a.sources) {
        expect(s.cite.trim().length, `cite on ${a.id}`).toBeGreaterThan(10);
        expect(s.finding.trim().length, `finding on ${a.id}`).toBeGreaterThan(10);
        expect(["doi", "scholar"], `kind on ${a.id}`).toContain(s.kind);
        expect(s.ref.trim().length, `ref on ${a.id}`).toBeGreaterThan(3);
        // A doi ref must be an actual URL; a scholar ref is a non-empty search string.
        if (s.kind === "doi") {
          expect(s.ref.startsWith("http"), `doi ref must be a url on ${a.id}: ${s.ref}`).toBe(true);
        }
      }
    }
  });

  it("has no placeholder / obviously-fake citations", () => {
    const suspicious = /\b(lorem|ipsum|example\.com|doi\.org\/10\.0000|xxxx|tbd|todo|placeholder)\b/i;
    for (const a of ARCHETYPES) {
      for (const s of a.sources) {
        expect(suspicious.test(s.cite), `suspicious cite on ${a.id}`).toBe(false);
        expect(suspicious.test(s.ref), `suspicious ref on ${a.id}`).toBe(false);
      }
    }
  });

  it("the four render buckets partition the dataset", () => {
    const sum =
      archetypeProfiles().length +
      isolationFindings().length +
      starvationCards().length +
      integratedProfiles().length;
    expect(sum).toBe(ARCHETYPES.length);
  });
});

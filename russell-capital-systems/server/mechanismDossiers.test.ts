// The dossiers name 39 companies. That makes this file a publishing surface,
// and the rules that govern one apply: no contact details, no rates, no terms
// quoted from memory. Those live in shared/altCredit/lenders.ts where every
// field is Verified<T> and carries its source and date, or they live nowhere.
//
// The other thing worth enforcing is that value and frequency stay two
// numbers. The moment they correlate perfectly they are one number with two
// labels, and the page's central claim stops being true.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DOSSIERS, PROVIDER_COUNT, PROVIDER_DISCLOSURE, dossier, byValue, byFrequency, mechanismWithDossier,
} from "@shared/mechanismDossiers";
import { MECHANISMS, type MechanismId } from "@shared/cycleEngine";
import { LENDERS } from "@shared/altCredit/lenders";

const root = join(import.meta.dirname, "..");
const source = readFileSync(join(root, "shared/mechanismDossiers.ts"), "utf8");

describe("coverage", () => {
  it("writes one dossier for every mechanism the engine models, and no orphans", () => {
    expect(DOSSIERS.map((d) => d.id).sort()).toEqual(MECHANISMS.map((m) => m.id).sort());
  });

  it("names between five and ten companies per mechanism", () => {
    for (const d of DOSSIERS) {
      expect(d.providers.length, `${d.id} names ${d.providers.length}`).toBeGreaterThanOrEqual(5);
      expect(d.providers.length, `${d.id} names ${d.providers.length}`).toBeLessThanOrEqual(10);
    }
    expect(PROVIDER_COUNT).toBe(DOSSIERS.reduce((n, d) => n + d.providers.length, 0));
  });

  it("explains how each mechanism combines with each of the other four", () => {
    for (const d of DOSSIERS) {
      const others = MECHANISMS.map((m) => m.id).filter((id) => id !== d.id).sort();
      expect(d.interop.map((i) => i.with).sort(), d.id).toEqual(others);
      for (const io of d.interop) {
        expect(io.strength, `${d.id}+${io.with}`).toBeGreaterThanOrEqual(1);
        expect(io.strength, `${d.id}+${io.with}`).toBeLessThanOrEqual(10);
        expect(io.caution.length, `${d.id}+${io.with} has no caution`).toBeGreaterThan(40);
      }
    }
  });

  it("walks through the mechanics in steps, saying what actually moves at each one", () => {
    for (const d of DOSSIERS) {
      expect(d.mechanics.length, d.id).toBeGreaterThanOrEqual(5);
      for (const s of d.mechanics) {
        // A step is a title; the substance lives in whatMoves, asserted below.
        // "Watch the two lines." is a good step name at 20 characters.
        expect(s.step.length, d.id).toBeGreaterThan(15);
        expect(s.whatMoves.length, `${d.id}: "${s.step}"`).toBeGreaterThan(60);
      }
    }
  });

  it("gives both sides — when it suits and when it does not, at equal length", () => {
    for (const d of DOSSIERS) {
      expect(d.bestWhen.length, d.id).toBeGreaterThanOrEqual(4);
      expect(d.worstWhen.length, d.id).toBeGreaterThanOrEqual(4);
      // A page listing six reasons to buy and one not to is a brochure.
      expect(d.worstWhen.length, `${d.id} is lopsided`).toBeGreaterThanOrEqual(d.bestWhen.length - 1);
    }
  });
});

describe("the two ratings stay two ratings", () => {
  it("keeps both in range with a written justification", () => {
    for (const d of DOSSIERS) {
      expect(d.valueRating).toBeGreaterThanOrEqual(1);
      expect(d.valueRating).toBeLessThanOrEqual(10);
      expect(d.frequencyRating).toBeGreaterThanOrEqual(1);
      expect(d.frequencyRating).toBeLessThanOrEqual(10);
      expect(d.valueWhy.length, `${d.id} valueWhy`).toBeGreaterThan(100);
      expect(d.frequencyWhy.length, `${d.id} frequencyWhy`).toBeGreaterThan(100);
    }
  });

  it("does not let them collapse into one number wearing two labels", () => {
    const identical = DOSSIERS.filter((d) => d.valueRating === d.frequencyRating);
    expect(identical.length, "every mechanism rates the same on both").toBeLessThan(DOSSIERS.length);
    // The headline case: the most valuable mechanism is not the most needed one.
    expect(byValue()[0].id).not.toBe(byFrequency()[0].id);
  });

  it("holds the specific claim the index page makes", () => {
    // The page says a policy loan is high value and low frequency. If that
    // stops being true the copy is wrong, so assert it here rather than there.
    const policy = dossier("policy-loan")!;
    expect(policy.valueRating).toBeGreaterThanOrEqual(6);
    expect(policy.frequencyRating).toBeLessThanOrEqual(3);
    // And velocity is the inverse: modest, but the one most people can use.
    const velocity = dossier("velocity-heloc")!;
    expect(velocity.frequencyRating).toBeGreaterThan(velocity.valueRating);
    expect(byFrequency()[0].id).toBe("velocity-heloc");
  });

  it("asks exactly one deciding question per mechanism, and makes it a question", () => {
    for (const d of DOSSIERS) {
      expect(d.decidingQuestion.trim().endsWith("?"), d.id).toBe(true);
      expect(d.decidingQuestion.length, d.id).toBeGreaterThan(40);
    }
  });
});

describe("this file is a publishing surface and obeys the publishing rules", () => {
  it("gives every provider its own homepage over https, which is the checkable field", () => {
    for (const d of DOSSIERS) {
      for (const p of d.providers) {
        expect(p.homepage.startsWith("https://"), `${p.name}: ${p.homepage}`).toBe(true);
        expect(p.what.length, p.name).toBeGreaterThan(30);
        expect(p.askFirst.length, `${p.name} has nothing to ask`).toBeGreaterThan(40);
      }
    }
  });

  it("publishes no phone number anywhere — those belong to the verified directory", () => {
    // The same guard as server/altCredit.test.ts, applied here because this
    // file names companies and a phone number typed from memory is the exact
    // thing that must never reach a page.
    const phoneShaped = source.match(/\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/g) ?? [];
    expect(phoneShaped, "phone-shaped strings in the dossiers").toEqual([]);
  });

  it("publishes no email address", () => {
    const emails = source.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) ?? [];
    expect(emails).toEqual([]);
  });

  it("quotes no rate or advance percentage in any provider field", () => {
    // Prose elsewhere in the file cites figures from the engine, which is fine.
    // A percentage attached to a named company is a term, and terms move weekly.
    for (const d of DOSSIERS) {
      for (const p of d.providers) {
        const text = `${p.what} ${p.askFirst}`;
        expect(text.match(/\d+(\.\d+)?\s*%/g) ?? [], `${p.name} quotes a figure`).toEqual([]);
        expect(text).not.toMatch(/\$\d/);
      }
    }
  });

  it("points registryId at a record that exists, so 'verified record' links resolve", () => {
    const ids = new Set(LENDERS.map((l) => l.id));
    for (const d of DOSSIERS) {
      for (const p of d.providers) {
        if (!p.registryId) continue;
        expect(ids.has(p.registryId), `${p.name} → ${p.registryId} is not in the lender directory`).toBe(true);
      }
    }
  });

  it("carries a disclosure that says what the lists are and are not", () => {
    expect(PROVIDER_DISCLOSURE).toMatch(/not endorsement/i);
    expect(PROVIDER_DISCLOSURE).toMatch(/not exhaustive/i);
  });

  it("names no company twice inside one mechanism", () => {
    for (const d of DOSSIERS) {
      const names = d.providers.map((p) => p.name);
      expect(new Set(names).size, d.id).toBe(names.length);
    }
  });
});

describe("helpers", () => {
  it("returns the engine record and the dossier together", () => {
    const pair = mechanismWithDossier("brrrr-dscr");
    expect(pair?.mechanism.id).toBe("brrrr-dscr");
    expect(pair?.dossier.id).toBe("brrrr-dscr");
  });

  it("returns nothing for a mechanism that does not exist", () => {
    expect(mechanismWithDossier("not-a-mechanism" as MechanismId)).toBeUndefined();
    expect(dossier("nonsense" as MechanismId)).toBeUndefined();
  });

  it("gives every mechanism a distinct accent colour for its nameplate", () => {
    const bases = DOSSIERS.map((d) => d.accent.base);
    expect(new Set(bases).size).toBe(DOSSIERS.length);
    for (const d of DOSSIERS) {
      for (const key of ["base", "deep", "glow"] as const) {
        expect(d.accent[key], `${d.id}.${key}`).toMatch(/^#[0-9a-f]{6}$/);
      }
    }
  });
});

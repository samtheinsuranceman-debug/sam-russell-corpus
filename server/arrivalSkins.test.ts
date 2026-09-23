import { describe, expect, it } from "vitest";
import {
  EMPTY_HISTORY,
  SKIN_REGISTRY,
  arrivalSkinsEnabled,
  contrastRatio,
  effectiveWindow,
  hashSeed,
  loadSkinRegistry,
  midiToHz,
  noteToMidi,
  selectSkin,
  validateRegistry,
  type SkinHistory,
  type SkinRegistry,
} from "@shared/arrivalSkins";
import spec from "@shared/arrivalSkins.json";

/** Run `sessions` consecutive arrivals for one user and return the ids picked. */
function run(reg: SkinRegistry, seed: string, sessions: number, start: SkinHistory = EMPTY_HISTORY): string[] {
  let h = start;
  const ids: string[] = [];
  for (let i = 0; i < sessions; i++) {
    const p = selectSkin(reg, seed, h);
    ids.push(p.skin.id);
    h = p.history;
  }
  return ids;
}

function syntheticRegistry(n: number, recentWindow = 7): SkinRegistry {
  return {
    version: 1,
    recentWindow,
    houseVoicing: ["C4", "E4", "G4"],
    skins: Array.from({ length: n }, (_, i) => ({
      id: `skin-${i}`, name: `Skin ${i}`, family: "cream_field", field: "#F4EFE6", filament: "#B8FFCE", ink: "#1C1A17",
      voicing: ["C4", "E4", "G4"], stills: [], source: "test",
    })),
  };
}

describe("arrival skin registry", () => {
  it("the shipped registry is valid and uses only colours from the first-login spec", () => {
    expect(validateRegistry(SKIN_REGISTRY)).toEqual([]);
    const specColours = new Set(["#F4EFE6", "#B8FFCE", "#1C1A17", "#E8D7C3", "#7C9A82", "#2A3340", "#F7F1E3", "#E6B84D", "#D9B39A", "#C9D7E0", "#5CFF9A", "#3EE0FF", "#C23B22", "#F3E6D4"]);
    for (const s of SKIN_REGISTRY.skins) {
      for (const c of [s.field, s.filament, s.ink]) expect(specColours.has(c.toUpperCase()), `${s.id} ${c}`).toBe(true);
    }
  });

  it("carries the three keyed fields exactly as the spec gives them", () => {
    const byId = Object.fromEntries(SKIN_REGISTRY.skins.map((s) => [s.id, s]));
    expect(byId["c-major-cream"]).toMatchObject({ field: "#F4EFE6", filament: "#B8FFCE", ink: "#1C1A17" });
    expect(byId["a-minor-sage"]).toMatchObject({ field: "#E8D7C3", filament: "#7C9A82", ink: "#2A3340" });
    expect(byId["g-major-gold"]).toMatchObject({ field: "#F7F1E3", filament: "#E6B84D", ink: "#1C1A17" });
  });

  it("ships no images: stills stay empty until real ones are uploaded", () => {
    for (const s of SKIN_REGISTRY.skins) expect(s.stills).toEqual([]);
  });

  it("has more skins than the recent window, so the 7-session rule can always hold", () => {
    expect(SKIN_REGISTRY.skins.length).toBeGreaterThan(SKIN_REGISTRY.recentWindow);
    expect(effectiveWindow(SKIN_REGISTRY)).toBe(7);
  });

  it("every voicing is C major and speaker-friendly (no fundamental under 150 Hz)", () => {
    for (const s of SKIN_REGISTRY.skins) for (const n of s.voicing) expect(midiToHz(noteToMidi(n))).toBeGreaterThanOrEqual(150);
    for (const n of SKIN_REGISTRY.houseVoicing) expect(midiToHz(noteToMidi(n))).toBeGreaterThanOrEqual(150);
  });

  it("ink on field is at least 7:1 for every skin", () => {
    for (const s of SKIN_REGISTRY.skins) expect(contrastRatio(s.field, s.ink)).toBeGreaterThanOrEqual(7);
  });

  it("rejects bad entries with readable reasons", () => {
    const bad = syntheticRegistry(2);
    bad.skins[0].field = "cream";
    bad.skins[1].id = "skin-0";
    bad.skins[1].voicing = ["C#4", "E4"];
    bad.skins[1].stills = [{ url: "https://example.com/stock.jpg", alt: "" }];
    const errs = validateRegistry(bad).join("\n");
    expect(errs).toMatch(/field is not #RRGGBB/);
    expect(errs).toMatch(/duplicate id/);
    expect(errs).toMatch(/C#4 is not in C major/);
    expect(errs).toMatch(/not served from \/files\//);
    expect(errs).toMatch(/no alt text/);
    expect(() => loadSkinRegistry(bad)).toThrow(/registry invalid/);
  });

  it("accepts stills served from the firm's /files storage", () => {
    const ok = syntheticRegistry(8);
    ok.skins[0].stills = [{ url: "/files/stills/mountain.webp", alt: "Family on a summit" }];
    expect(validateRegistry(ok)).toEqual([]);
  });

  it("the JSON on disk is the registry the code loads", () => {
    expect(SKIN_REGISTRY.skins.map((s) => s.id)).toEqual(spec.skins.map((s) => s.id));
  });
});

describe("note maths", () => {
  it("maps names to MIDI and Hz", () => {
    expect(noteToMidi("C4")).toBe(60);
    expect(noteToMidi("A4")).toBe(69);
    expect(noteToMidi("G3")).toBe(55);
    expect(midiToHz(69)).toBeCloseTo(440, 6);
    expect(midiToHz(60)).toBeCloseTo(261.626, 2);
    expect(() => noteToMidi("Bb3")).toThrow();
  });

  it("hashSeed is stable", () => {
    expect(hashSeed("")).toBe(0x811c9dc5);
    expect(hashSeed("u:42")).toBe(hashSeed("u:42"));
    expect(hashSeed("u:42")).not.toBe(hashSeed("u:43"));
  });
});

describe("selectSkin", () => {
  it("is deterministic per user and session", () => {
    expect(run(SKIN_REGISTRY, "u:1", 40)).toEqual(run(SKIN_REGISTRY, "u:1", 40));
  });

  it("differs between users", () => {
    const users = ["u:1", "u:2", "u:3", "u:4", "u:5"].map((u) => run(SKIN_REGISTRY, u, 16).join(","));
    expect(new Set(users).size).toBeGreaterThan(1);
  });

  it("never repeats any of the last 7 seen, across many users and sessions", () => {
    for (let u = 0; u < 50; u++) {
      const ids = run(SKIN_REGISTRY, `u:${u}`, 100);
      ids.forEach((id, i) => expect(ids.slice(Math.max(0, i - 7), i), `user ${u} session ${i + 1}`).not.toContain(id));
    }
  });

  it("shows every skin once per rotation before any repeats (the shipped 8)", () => {
    const n = SKIN_REGISTRY.skins.length;
    for (let u = 0; u < 20; u++) {
      const ids = run(SKIN_REGISTRY, `u:${u}`, n * 5);
      for (let r = 0; r < 5; r++) expect(new Set(ids.slice(r * n, (r + 1) * n)).size, `user ${u} rotation ${r}`).toBe(n);
    }
  });

  it("with the 30-skin roster: full rotation, then recycle, never within 7", () => {
    const reg = syntheticRegistry(30);
    for (let u = 0; u < 10; u++) {
      const ids = run(reg, `u:${u}`, 150);
      for (let r = 0; r < 5; r++) expect(new Set(ids.slice(r * 30, (r + 1) * 30)).size).toBe(30);
      ids.forEach((id, i) => expect(ids.slice(Math.max(0, i - 7), i)).not.toContain(id));
    }
  });

  it("counts sessions and keeps a bounded history", () => {
    let h: SkinHistory = EMPTY_HISTORY;
    for (let i = 1; i <= 60; i++) {
      const p = selectSkin(SKIN_REGISTRY, "u:9", h);
      expect(p.sessionNumber).toBe(i);
      h = p.history;
    }
    expect(h.sessionCount).toBe(60);
    expect(h.recent.length).toBe(SKIN_REGISTRY.skins.length + 7);
  });

  it("survives a history that names skins no longer in the roster", () => {
    const p = selectSkin(SKIN_REGISTRY, "u:1", { sessionCount: 3, recent: ["retired-a", "retired-b", "c-major-cream"] });
    expect(p.skin.id).not.toBe("c-major-cream");
    expect(p.history.recent).not.toContain("retired-a");
  });

  it("a one-skin roster still answers", () => {
    const reg = syntheticRegistry(1);
    expect(run(reg, "u:1", 3)).toEqual(["skin-0", "skin-0", "skin-0"]);
  });

  it("uses no Math.random", async () => {
    const { readFileSync } = await import("node:fs");
    const src = readFileSync(new URL("../shared/arrivalSkins.ts", import.meta.url), "utf8");
    expect(src).not.toContain("Math.random");
  });
});

describe("feature flag", () => {
  it("is off by default", () => {
    expect(arrivalSkinsEnabled({})).toBe(false);
    expect(arrivalSkinsEnabled({ envFlag: "" })).toBe(false);
    expect(arrivalSkinsEnabled({ envFlag: "off" })).toBe(false);
  });

  it("turns on with VITE_ARRIVAL_SKINS=on", () => {
    expect(arrivalSkinsEnabled({ envFlag: "on" })).toBe(true);
    expect(arrivalSkinsEnabled({ envFlag: " ON " })).toBe(true);
  });

  it("the preview toggle works only for the owner", () => {
    expect(arrivalSkinsEnabled({ ownerPreview: true })).toBe(false);
    expect(arrivalSkinsEnabled({ ownerPreview: true, isOwner: false })).toBe(false);
    expect(arrivalSkinsEnabled({ ownerPreview: true, isOwner: true })).toBe(true);
    expect(arrivalSkinsEnabled({ ownerPreview: false, isOwner: true })).toBe(false);
  });
});

describe("first visit and legibility", () => {
  it("visit 1 wears the house skin (C major cream and mint) for every household", async () => {
    const { SKIN_REGISTRY: reg } = await import("@shared/arrivalSkins");
    expect(reg.houseSkin).toBe("c-major-cream");
    for (let u = 0; u < 50; u++) expect(selectSkin(reg, `user:${u}`).skin.id).toBe("c-major-cream");
  });

  it("text on the band is at least 4.5:1 everywhere, including the filament-tinted edge (WCAG 1.4.3)", async () => {
    const { fieldEdgeColour } = await import("@shared/arrivalSkins");
    for (const s of SKIN_REGISTRY.skins) {
      expect(contrastRatio(s.field, s.ink), s.id).toBeGreaterThanOrEqual(7);
      expect(contrastRatio(fieldEdgeColour(s), s.ink), `${s.id} edge`).toBeGreaterThanOrEqual(4.5);
      // "Enter with sound" is field-coloured text on an ink button.
      expect(contrastRatio(s.ink, s.field), `${s.id} button`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("the band draws text in full-strength ink only, and its motion stops within 5 s with a visible control", async () => {
    const { readFileSync } = await import("node:fs");
    const src = readFileSync(new URL("../client/src/components/ArrivalField.tsx", import.meta.url), "utf8");
    expect(src).not.toMatch(/\$\{skin\.ink\}[0-9A-Fa-f]{2}`/);
    expect(src).toMatch(/FILAMENT_MOTION_S = [1-5]\b/);
    expect(src).toContain("Pause motion");
    expect(src).toContain("prefers-reduced-motion");
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { IVORY, IVORY_EMAIL_MAP } from "./_core/ivory";
import { THEMES } from "../shared/themes";

const GENERATORS = [
  "answerPdf", "batchStrategyPdf", "bulkComparisonPdf", "generate1035Pdf", "mortgageKillerPdf",
  "pdfExportService", "pdfReport", "rothPdfReport", "strategyPdfService",
];
const DARK_ROOM = ["#0f1117", "#1a1d27", "#0a1628", "#0f172a", "#060f1e", "#0b1628", "#22c55e", "#3b82f6", "#8b5cf6", "#a855f7", "#f59e0b", "#06b6d4", "#ffffff"];
const IVORY_SET = new Set(Object.values(IVORY).map((v) => v.toLowerCase()));

describe("Theme 10 — Ivory Clinic on everything the client receives", () => {
  it("matches the room table", () => {
    expect(IVORY.canvas).toBe(THEMES.theme10.tokens.canvas);
    expect(IVORY.money).toBe(THEMES.theme10.tokens.money);
    expect(IVORY.band).toBe(THEMES.theme10.tokens.line);
    expect(IVORY.navy).not.toBe("#C45C26"); // no copper on a PDF
  });

  it("no PDF generator carries a dark-room colour any more", () => {
    for (const g of GENERATORS) {
      const src = readFileSync(resolve(`server/${g}.ts`), "utf8").toLowerCase();
      expect(src, g).toContain("ivory");
      for (const hex of DARK_ROOM) expect(src, `${g} still uses ${hex}`).not.toContain(hex);
      // the only hex literals left are paper tints (light) — everything else reads from IVORY
      for (const hex of src.match(/#[0-9a-f]{6}\b/g) ?? []) {
        const [r, gg, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
        expect(r + gg + b, `${g} keeps a dark literal ${hex}`).toBeGreaterThan(560);
      }
    }
  });

  it("every colour left in the email and message templates is an Ivory colour", () => {
    for (const f of ["email", "messaging"]) {
      const src = readFileSync(resolve(`server/${f}.ts`), "utf8");
      const hexes = new Set((src.match(/#[0-9a-fA-F]{6}\b/g) ?? []).map((h) => h.toLowerCase()));
      const allowed = new Set([...IVORY_SET, "#4a5568", "#dce6f0"]);
      for (const h of hexes) expect(allowed.has(h), `${f} uses ${h}`).toBe(true);
      expect(src).toContain("IBM Plex Sans");
    }
  });

  it("the email map only ever lands on Ivory colours", () => {
    for (const [, to] of IVORY_EMAIL_MAP) expect(IVORY_SET.has(to.slice(0, 7).toLowerCase()) || to.toLowerCase() === "#4a5568", to).toBe(true);
  });
});

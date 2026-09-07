import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// The digital twin's per-room knowledge (docs/avatar). One face, twenty pages:
// every row in the map has a context file, every context file is in the map,
// every page in the map is a real route, and no context contains the unsourced
// sales lines or a promised return.
const ROOT = resolve("docs/avatar");
const map = readFileSync(resolve(ROOT, "AVATAR_ROOM_MAP.md"), "utf8");
const app = readFileSync(resolve("client/src/App.tsx"), "utf8");
const ROOMS = ["Cover", "Practice", "Tax", "Engines", "Intake", "Journey", "Estate", "Relief", "Observatory", "Ivory"];

const rows = map.split("\n").filter((l) => /^\| \d+ \| `\//.test(l)).map((l) => {
  const c = l.split("|").map((s) => s.trim());
  return { path: c[2].replace(/`/g, ""), room: c[3], mode: c[4], file: c[5].replace(/`/g, "") };
});

describe("avatar room map", () => {
  it("has between fifteen and twenty pages, each in one of the ten rooms, each a real route", () => {
    expect(rows.length).toBeGreaterThanOrEqual(15);
    expect(rows.length).toBeLessThanOrEqual(20);
    for (const r of rows) {
      expect(ROOMS, r.path).toContain(r.room);
      expect(["LIVE", "poster + MP4"], r.path).toContain(r.mode);
      const route = r.path === "/" ? 'path="/"' : `path="${r.path}"`;
      expect(app, `${r.path} is declared in App.tsx`).toContain(route);
    }
  });

  it("maps every row to a context file and every context file to a row", () => {
    const files = readdirSync(resolve(ROOT, "contexts")).filter((f) => f.endsWith(".md")).sort();
    const listed = rows.map((r) => r.file.replace(/^contexts\//, "")).sort();
    expect(files).toEqual(listed);
    for (const r of rows) expect(existsSync(resolve(ROOT, r.file)), r.file).toBe(true);
  });

  it("keeps every context honest: eight to twelve bullets, the never-list, no unsourced sales lines, no promised return", () => {
    const banned = [/institutional-grade/i, /substantial savings/i, /significant value on the table/i, /2-3x/i, /lose 40%/i, /\$800K/i, /1 in 4/i, /guaranteed (return|growth|income|protection)/i];
    for (const r of rows) {
      const text = readFileSync(resolve(ROOT, r.file), "utf8");
      const allowed = text.split("## What the avatar may say on this page")[1]!.split("## Never")[0]!;
      const bullets = allowed.split("\n").filter((l) => l.startsWith("- "));
      expect(bullets.length, r.file).toBeGreaterThanOrEqual(8);
      expect(bullets.length, r.file).toBeLessThanOrEqual(12);
      expect(text).toContain("## Never, on any page");
      // The bullets themselves must not carry the banned lines (the never-list may name them).
      for (const b of bullets) for (const re of banned) expect(b, `${r.file}: ${b}`).not.toMatch(re);
      // No bullet promises a return: a percentage may only appear next to a stated cap, assumption, volatility or loan-to-value figure.
      for (const b of bullets) {
        if (/\d+(\.\d+)? ?percent|\d+%/.test(b)) expect(b, `${r.file}: percentage without a stated basis`).toMatch(/AG 49|cap|assum|illustrat|volatility|loan-to-value|floor|percent of the original|discount|state|exempt/i);
      }
    }
  });
});

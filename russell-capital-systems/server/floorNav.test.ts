import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  ACTIVE_WORD_SCALE,
  ADVISOR_DOORS,
  FLOORS,
  FLOOR_FEATURED,
  MAX_VISIBLE_PER_FLOOR,
  PATH_FLOOR,
  SECTION_FLOOR,
  SUBGROUP_FLOOR,
  floorForLocation,
  floorOf,
  matchesQuery,
  resolveNavMode,
  type FloorId,
  type NavEntry,
} from "../shared/floors";

/**
 * The four-floor navigation (Body, Wound, Work, Talk).
 *
 * The floors replace the left rail only when the flag is on, and they must
 * reach every page the rail reaches. These tests read the rail's own list
 * (NAV_SECTIONS in AppShell.tsx) and check each page lands on exactly one
 * floor, that each floor shows few links, and that the advisor doors appear
 * on Work alone.
 */

const root = resolve(__dirname, "..");
const shellSrc = readFileSync(resolve(root, "client/src/components/AppShell.tsx"), "utf8");
const specRoot = resolve(root, "..", "..", "russell-capital", "docs", "specs");

/** Every NAV_SECTIONS entry with its section and subgroup, read from source. */
function parseNavEntries(src: string): NavEntry[] {
  const start = src.indexOf("const NAV_SECTIONS: NavSection[] = [");
  const end = src.indexOf("\n];", start);
  const block = src.slice(start, end);
  const out: NavEntry[] = [];
  let section = "";
  let subLabel: string | undefined;
  for (const line of block.split("\n")) {
    const sec = /^\s{4}label:\s*"([^"]+)",$/.exec(line);
    if (sec) { section = sec[1]; subLabel = undefined; continue; }
    const sub = /subLabel:\s*"([^"]+)"/.exec(line);
    if (sub) { subLabel = sub[1]; continue; }
    const item = /path:\s*"([^"]+)",\s*label:\s*(?:"([^"]+)"|([A-Za-z_]+))/.exec(line);
    if (item) out.push({ path: item[1], label: item[2] ?? item[3], section, subLabel });
  }
  return out;
}

const entries = parseNavEntries(shellSrc);
const entryByPath = new Map(entries.map((e) => [e.path, e]));

describe("every menu page sits on exactly one floor", () => {
  it("reads the whole rail", () => {
    expect(entries.length).toBeGreaterThan(280);
    for (const e of entries) expect(e.section, e.path).not.toBe("");
  });

  it("assigns each entry to one of the four floors", () => {
    for (const e of entries) expect(FLOORS, e.path).toContain(floorOf(e));
  });

  it("every floor has pages, and the four floors together hold the whole rail", () => {
    const perFloor: Record<FloorId, number> = { Body: 0, Wound: 0, Work: 0, Talk: 0 };
    for (const e of entries) perFloor[floorOf(e)] += 1;
    for (const f of FLOORS) expect(perFloor[f], f).toBeGreaterThan(0);
    expect(perFloor.Body + perFloor.Wound + perFloor.Work + perFloor.Talk).toBe(entries.length);
  });

  it("names only real sections, subgroups and menu paths in its rules", () => {
    const sections = new Set(entries.map((e) => e.section));
    const subs = new Set(entries.filter((e) => e.subLabel).map((e) => `${e.section}/${e.subLabel}`));
    for (const s of Object.keys(SECTION_FLOOR)) expect(sections.has(s), s).toBe(true);
    for (const s of sections) expect(SECTION_FLOOR[s], `section "${s}" has no default floor`).toBeDefined();
    for (const s of Object.keys(SUBGROUP_FLOOR)) expect(subs.has(s), s).toBe(true);
    for (const p of Object.keys(PATH_FLOOR)) expect(entryByPath.has(p), `${p} is overridden but not in the menu`).toBe(true);
  });
});

describe("each floor shows few words", () => {
  it(`shows at most ${MAX_VISIBLE_PER_FLOOR} links per floor, counting the advisor-doors switch on Work`, () => {
    for (const f of FLOORS) {
      const visible = FLOOR_FEATURED[f].length + (f === "Work" ? 1 : 0);
      expect(visible, f).toBeLessThanOrEqual(MAX_VISIBLE_PER_FLOOR);
      expect(FLOOR_FEATURED[f].length, f).toBeGreaterThan(0);
    }
  });

  it("each shown link is a menu page on that same floor, with a short label", () => {
    for (const f of FLOORS) {
      for (const link of FLOOR_FEATURED[f]) {
        const e = entryByPath.get(link.path);
        expect(e, `${link.path} is featured on ${f} but not in the menu`).toBeDefined();
        expect(floorOf(e!), `${link.path} is featured on ${f} but assigned elsewhere`).toBe(f);
        expect(link.label.split(" ").length, link.label).toBeLessThanOrEqual(2);
      }
    }
  });

  it("no link is shown on two floors", () => {
    const seen = new Set<string>();
    for (const f of FLOORS) for (const l of FLOOR_FEATURED[f]) {
      expect(seen.has(l.path), l.path).toBe(false);
      seen.add(l.path);
    }
  });
});

describe("advisor doors are on Work only (control 35)", () => {
  it("has the four doors the spec names", () => {
    expect(ADVISOR_DOORS.map((d) => d.label)).toEqual(["Clients", "Pipeline", "Presentations", "AI assist"]);
  });

  it("each door is a menu page assigned to Work and shown on no other floor", () => {
    const featured = new Set(FLOORS.flatMap((f) => FLOOR_FEATURED[f].map((l) => l.path)));
    for (const d of ADVISOR_DOORS) {
      const e = entryByPath.get(d.path);
      expect(e, d.path).toBeDefined();
      expect(floorOf(e!), d.path).toBe("Work");
      expect(featured.has(d.path), d.path).toBe(false);
    }
  });
});

describe("the stairs", () => {
  it("are the four words in the spec's order, active word at 1.25x", () => {
    expect(FLOORS).toEqual(["Body", "Wound", "Work", "Talk"]);
    expect(ACTIVE_WORD_SCALE).toBe(1.25);
  });

  it("match the first-login spec when it is present alongside the repo", () => {
    let raw: string;
    try {
      raw = readFileSync(resolve(specRoot, "RCS-FIRST-LOGIN-MANAGER.json"), "utf8");
    } catch {
      return; // The spec lives in a sibling repo; CI without it still checks the constants above.
    }
    const words = /"stairs":\s*\{\s*"words":\s*\[([^\]]+)\]/.exec(raw);
    const scale = /"active_word_scale":\s*([\d.]+)/.exec(raw);
    expect(words?.[1].split(",").map((w) => w.trim().replace(/"/g, ""))).toEqual([...FLOORS]);
    expect(Number(scale?.[1])).toBe(ACTIVE_WORD_SCALE);
  });

  it("places a detail page on its parent's floor", () => {
    expect(floorForLocation("/portal/clients", entries)).toBe("Work");
    expect(floorForLocation("/portal/clients/42", entries)).toBe("Work");
    expect(floorForLocation("/portal/mortgage-ledger", entries)).toBe("Wound");
    expect(floorForLocation("/portal/samuel-goldman", entries)).toBe("Talk");
    expect(floorForLocation("/portal/client-snapshot", entries)).toBe("Body");
    expect(floorForLocation("/nowhere", entries)).toBeNull();
  });
});

describe("the per-floor index can be searched", () => {
  it("matches label, path, section and subgroup", () => {
    const e: NavEntry = { path: "/portal/tax-waterfall", label: "Tax Waterfall", section: "Planning", subLabel: "Tax" };
    expect(matchesQuery(e, "waterfall")).toBe(true);
    expect(matchesQuery(e, "TAX-WATER")).toBe(true);
    expect(matchesQuery(e, "planning")).toBe(true);
    expect(matchesQuery(e, "estate")).toBe(false);
    expect(matchesQuery(e, "  ")).toBe(true);
  });
});

describe("the flag defaults off", () => {
  it("is classic unless storage or the env turns it on", () => {
    expect(resolveNavMode(null, undefined)).toBe("classic");
    expect(resolveNavMode(null, "")).toBe("classic");
    expect(resolveNavMode(null, "off")).toBe("classic");
    expect(resolveNavMode(null, "on")).toBe("floors");
    expect(resolveNavMode("floors", undefined)).toBe("floors");
    expect(resolveNavMode("classic", "on")).toBe("classic");
    expect(resolveNavMode("something-else", undefined)).toBe("classic");
  });
});

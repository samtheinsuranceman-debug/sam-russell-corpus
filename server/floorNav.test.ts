import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  ACTIVE_WORD_SCALE,
  ADVISOR_DOORS,
  FLOORS,
  FLOOR_ROOMS,
  MAX_LINKS_PER_ROOM,
  MAX_ROOMS_PER_FLOOR,
  MAX_TOP_LEVEL,
  PATH_AUDIENCE,
  PATH_FLOOR,
  SECTION_AUDIENCE,
  SECTION_FLOOR,
  SUBGROUP_AUDIENCE,
  SUBGROUP_FLOOR,
  audienceOf,
  canSee,
  floorForLocation,
  floorOf,
  matchesQuery,
  resolveNavMode,
  roomsFor,
  viewerAudience,
  type Audience,
  type FloorId,
  type NavEntry,
} from "../shared/floors";
import { NOT_IN_NAVIGATION } from "../shared/hiddenRoutes";

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
const floorNavSrc = readFileSync(resolve(root, "client/src/components/FloorNav.tsx"), "utf8");
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

const audienceByPath = (p: string): Audience => {
  const e = entryByPath.get(p);
  return e ? audienceOf(e) : "owner";
};
const allRoomLinks = FLOORS.flatMap((f) => FLOOR_ROOMS[f].flatMap((r) => r.links.map((l) => ({ floor: f, room: r, link: l }))));

describe("the owner's 4 -> 4 -> 4 rule, at most eight at the top", () => {
  it("has at most eight top-level tabs", () => {
    expect(FLOORS.length).toBeLessThanOrEqual(MAX_TOP_LEVEL);
    expect(MAX_TOP_LEVEL).toBe(8);
  });

  it("opens each floor to at most four rooms, and each room to at most four links", () => {
    for (const f of FLOORS) {
      expect(FLOOR_ROOMS[f].length, f).toBeGreaterThan(0);
      expect(FLOOR_ROOMS[f].length, f).toBeLessThanOrEqual(MAX_ROOMS_PER_FLOOR);
      for (const r of FLOOR_ROOMS[f]) {
        expect(r.links.length, `${f}/${r.label}`).toBeGreaterThan(0);
        expect(r.links.length, `${f}/${r.label}`).toBeLessThanOrEqual(MAX_LINKS_PER_ROOM);
      }
    }
  });

  it("each room link is a menu page on that same floor, with a short label", () => {
    for (const { floor, link } of allRoomLinks) {
      const e = entryByPath.get(link.path);
      expect(e, `${link.path} is in a ${floor} room but not in the menu`).toBeDefined();
      expect(floorOf(e!), `${link.path} is in a ${floor} room but assigned elsewhere`).toBe(floor);
      expect(link.label.split(" ").length, link.label).toBeLessThanOrEqual(2);
    }
  });

  it("no page sits in two rooms, and no room link is a hidden page", () => {
    const seen = new Set<string>();
    for (const { link } of allRoomLinks) {
      expect(seen.has(link.path), link.path).toBe(false);
      seen.add(link.path);
      expect(link.path in NOT_IN_NAVIGATION, link.path).toBe(false);
    }
  });
});

describe("who sees what (households never see advisor or owner pages)", () => {
  it("maps today's roles: owner and admin see everything, everyone else the household view", () => {
    expect(viewerAudience({ role: "user" })).toBe("household");
    expect(viewerAudience({ role: null })).toBe("household");
    expect(viewerAudience({ role: "admin" })).toBe("owner");
    expect(viewerAudience({ role: "user", isOwner: true })).toBe("owner");
    expect(viewerAudience({ role: "advisor" })).toBe("advisor");
  });

  it("names only real sections, subgroups and menu paths in its audience rules", () => {
    const sections = new Set(entries.map((e) => e.section));
    const subs = new Set(entries.filter((e) => e.subLabel).map((e) => `${e.section}/${e.subLabel}`));
    for (const s of Object.keys(SECTION_AUDIENCE)) expect(sections.has(s), s).toBe(true);
    for (const s of Object.keys(SUBGROUP_AUDIENCE)) expect(subs.has(s), s).toBe(true);
    for (const p of Object.keys(PATH_AUDIENCE)) expect(entryByPath.has(p), p).toBe(true);
  });

  it("keeps the advisor doors, pipeline, arena, compliance and owner pages from households", () => {
    const advisorOnly = [
      ...ADVISOR_DOORS.map((d) => d.path),
      "/portal/pipeline", "/portal/arena", "/portal/leaderboard", "/portal/commission-tracker",
      "/portal/compliance", "/portal/compliance-alerts", "/portal/clients", "/portal/client-snapshot",
      "/portal/household-wealth", "/portal/financial-vitals", "/portal/client-files", "/portal/document-vault",
    ];
    for (const p of advisorOnly) expect(canSee(audienceByPath(p), "household"), p).toBe(false);
    for (const e of entries.filter((x) => x.section === "Settings & Admin" || x.section === "Compliance" || x.section === "Sales & Growth")) {
      expect(canSee(audienceOf(e), "household"), e.path).toBe(false);
    }
    for (const e of entries.filter((x) => x.section === "Settings & Admin")) expect(audienceOf(e), e.path).toBe("owner");
  });

  it("gives households only own-household pages on Body", () => {
    const rooms = roomsFor("Body", "household", audienceByPath);
    const paths = rooms.flatMap((r) => r.links.map((l) => l.path));
    expect(paths.length).toBeGreaterThan(0);
    for (const p of ["/portal/client-snapshot", "/portal/household-wealth", "/portal/financial-vitals", "/portal/client-files"]) {
      expect(paths, p).not.toContain(p);
    }
    for (const p of paths) expect(audienceByPath(p), p).toBe("household");
  });

  it("households still get rooms on every floor, and every room link they get is theirs", () => {
    for (const f of FLOORS) {
      const rooms = roomsFor(f, "household", audienceByPath);
      expect(rooms.length, f).toBeGreaterThan(0);
      for (const r of rooms) for (const l of r.links) expect(canSee(audienceByPath(l.path), "household"), l.path).toBe(true);
    }
  });

  it("the owner sees every room", () => {
    for (const f of FLOORS) expect(roomsFor(f, "owner", audienceByPath).length, f).toBe(FLOOR_ROOMS[f].length);
  });
});

describe("advisor doors are on Work only (control 35)", () => {
  it("has the four doors the spec names", () => {
    expect(ADVISOR_DOORS.map((d) => d.label)).toEqual(["Clients", "Pipeline", "Presentations", "AI assist"]);
  });

  it("each door is a Work page, and the doors room exists on Work alone, for advisors and up", () => {
    for (const d of ADVISOR_DOORS) {
      const e = entryByPath.get(d.path);
      expect(e, d.path).toBeDefined();
      expect(floorOf(e!), d.path).toBe("Work");
    }
    const doorPaths = new Set(ADVISOR_DOORS.map((d) => d.path));
    for (const { floor, room, link } of allRoomLinks) {
      if (doorPaths.has(link.path)) {
        expect(floor).toBe("Work");
        expect(room.audience).toBe("advisor");
      }
    }
    expect(roomsFor("Work", "household", audienceByPath).some((r) => r.label === "Advisor doors")).toBe(false);
    expect(roomsFor("Work", "advisor", audienceByPath).some((r) => r.label === "Advisor doors")).toBe(true);
  });
});

describe("the shell keeps production unchanged until the flag is flipped", () => {
  it("renders the rail unless the floors are on, and the floors only when they are", () => {
    expect(shellSrc).toMatch(/const floors = navMode === "floors";/);
    expect(shellSrc).toMatch(/\{!floors && <Sidebar /);
    expect(shellSrc).toMatch(/\{floors && <FloorPanel /);
    expect(shellSrc).toMatch(/\{floors && <FloorIndex /);
  });

  it("gives the owner and admins a preview switch on the classic rail, and only they may use a ?nav= link", () => {
    expect(shellSrc).toMatch(/user\?\.role === "admin" \|\| whoami\.data\?\.owner === true/);
    expect(shellSrc).toMatch(/<NavModeToggle mode="classic" \/>/);
    expect(shellSrc).toMatch(/if \(!privileged \|\| urlModeApplied\.current\) return;/);
    expect(floorNavSrc).not.toMatch(/useEffect\([^)]*navModeFromUrl/);
  });

  it("filters the index by audience and keeps hidden pages out of the floors", () => {
    expect(floorNavSrc).toMatch(/allEntries\.filter\(\(e\) => canSee\(audienceOf\(e\), viewer\)\)/);
    expect(shellSrc).toMatch(/\.filter\(\(e\) => !\(e\.path in NOT_IN_NAVIGATION\)\)/);
    expect(shellSrc).toMatch(/useFloorNav\(NAV_ENTRIES, viewer\)/);
  });

  it("keeps the workspace switcher and favourites in floors mode", () => {
    const menu = shellSrc.slice(shellSrc.indexOf("function FloorAccountMenu"));
    expect(menu).toMatch(/<WorkspaceSwitcher \/>/);
    expect(shellSrc).toMatch(/<FloorIndex state=\{floorState\} favorites=\{favoriteLinks\} \/>/);
  });
});

describe("accessibility hooks are in place", () => {
  it("marks the current page and floor, and uses tabs, a dialog and a combobox", () => {
    expect(floorNavSrc).toMatch(/aria-current=\{here \? "page" : undefined\}/);
    expect(floorNavSrc).toMatch(/aria-current=\{state\.current === f \? "location" : undefined\}/);
    expect(floorNavSrc).toMatch(/role="tablist"/);
    expect(floorNavSrc).toMatch(/role="dialog" aria-modal="true"/);
    expect(floorNavSrc).toMatch(/role="combobox"/);
    expect(floorNavSrc).toMatch(/aria-activedescendant=/);
    expect(floorNavSrc).toMatch(/aria-expanded=\{i === open\}/);
  });

  it("styles keyboard focus and honours reduced motion", () => {
    const css = readFileSync(resolve(root, "client/src/index.css"), "utf8");
    const block = css.slice(css.indexOf("FOUR FLOORS"));
    expect(block).toMatch(/\.rc-stair:focus-visible/);
    expect(block).toMatch(/\.rc-floor-room:focus-visible/);
    expect(block).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    expect(block).toMatch(/calc\(15px \* var\(--rc-stair-scale, 1\.25\)\)/);
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

// ============================================================
// NO FAKE DATA
// A financial and insurance platform must never show an invented figure as if it were
// real. The commonest way one got onto the screen was Math.random(): audit trails,
// compliance alerts, client scores, commissions and "live" counters generated in the
// browser. This test scans client/src and shared/ (the engines the server routers and
// the pages both run) and fails on any Math.random call that is not explicitly marked as
// decoration. Mentions inside comments are not calls and are ignored.
//
// A call is allowed only when:
//   1. the line itself, or the line directly above it, carries `// decorative`
//      (particles, ambience, animation jitter, confetti, skeleton widths, a game roll
//      whose outcome is not stored or reported as a record); or
//   2. the file is listed in ALLOWLIST below, with the reason.
//
// Anything else must be real data, a computation from the user's inputs, a seeded
// simulation (shared/macro/random.ts, mulberry32), crypto.randomUUID() for ids, or
// removed in favour of an honest empty state.
// ============================================================
import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const APP = path.resolve(__dirname, "..");
const CLIENT_SRC = path.join(APP, "client/src");
const SHARED = path.join(APP, "shared");
/** Directories scanned. shared/ holds calculation engines (e.g. premiumFinancingArbitrage,
 *  multiCurrencyWealthEngine) whose outputs the server routers return as figures. */
const SCANNED_DIRS = [CLIENT_SRC, SHARED];
const DECORATIVE = "// decorative";

/**
 * Files exempt from the rule, as paths relative to the app root, each with the reason.
 * Keep this small. Prefer a `// decorative` marker on the line over an entry here.
 */
export const ALLOWLIST: ReadonlyArray<{ file: string; reason: string }> = [];

/**
 * Files still being cleaned on sibling branches (the no-fake-data work was split across
 * three branches). Each branch removes its own files from this list when it merges; the
 * list must end empty. An entry whose file no longer has an unmarked Math.random fails
 * the "pending list is current" test below, so a finished file cannot linger here.
 */
export const PENDING_OTHER_BRANCHES: readonly string[] = [];

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full));
    else if (/\.(tsx?|jsx?|mjs|cjs)$/.test(name) && !/\.test\.(tsx?|jsx?)$/.test(name)) out.push(full);
  }
  return out;
}

/** The code part of a line: block-comment lines and `//` tails removed (a `://` in a URL is kept). */
function codePart(line: string): string {
  const t = line.trim();
  if (t.startsWith("*") || t.startsWith("/*") || t.startsWith("//")) return "";
  return line.replace(/(^|[^:])\/\/.*$/, "$1");
}

/** Line numbers (1-based) of Math.random calls not marked `// decorative` on the line or the line above. */
export function unmarkedRandomLines(source: string): number[] {
  const lines = source.split("\n");
  const bad: number[] = [];
  lines.forEach((line, i) => {
    if (!codePart(line).includes("Math.random")) return;
    if (line.includes(DECORATIVE)) return;
    if (i > 0 && lines[i - 1].includes(DECORATIVE)) return;
    bad.push(i + 1);
  });
  return bad;
}

const rel = (full: string) => path.relative(APP, full).split(path.sep).join("/");
const offenders = new Map<string, number[]>();
for (const file of SCANNED_DIRS.flatMap((d) => sourceFiles(d))) {
  const bad = unmarkedRandomLines(readFileSync(file, "utf8"));
  if (bad.length) offenders.set(rel(file), bad);
}

describe("no fake data: Math.random in client/src and shared/", () => {
  it("the marker check reads the line and the line above", () => {
    expect(unmarkedRandomLines("const x = Math.random();")).toEqual([1]);
    expect(unmarkedRandomLines("const x = Math.random(); // decorative")).toEqual([]);
    expect(unmarkedRandomLines("// decorative: sparkle jitter\nconst x = Math.random();")).toEqual([]);
    expect(unmarkedRandomLines("// decorative\n\nconst x = Math.random();")).toEqual([3]);
  });

  it("comments that mention Math.random are not calls", () => {
    expect(unmarkedRandomLines(" * a new Math.random() in a value path")).toEqual([]);
    expect(unmarkedRandomLines("// was Math.random()")).toEqual([]);
    expect(unmarkedRandomLines("const r = 1; // not Math.random()")).toEqual([]);
    expect(unmarkedRandomLines("const u = \"https://x\"; const r = Math.random();")).toEqual([1]);
  });

  it("scans shared/ engines too, so a Math.random in a calculated value is caught", () => {
    expect(SCANNED_DIRS).toContain(SHARED);
    const sharedFiles = sourceFiles(SHARED).map(rel);
    expect(sharedFiles).toContain("shared/premiumFinancingArbitrage.ts");
    expect(sharedFiles).toContain("shared/multiCurrencyWealthEngine.ts");
  });

  it("every Math.random is marked decorative, or its file is allowlisted", () => {
    const exempt = new Set([...ALLOWLIST.map((a) => a.file), ...PENDING_OTHER_BRANCHES]);
    const unexplained = [...offenders.entries()]
      .filter(([file]) => !exempt.has(file))
      .map(([file, lines]) => `${file}:${lines.join(",")}`);
    expect(unexplained, "Math.random shown as data — use real data, a seeded engine, crypto.randomUUID(), an empty state, or mark true decoration `// decorative`").toEqual([]);
  });

  it("allowlist entries exist and give a reason", () => {
    for (const { file, reason } of ALLOWLIST) {
      expect(existsSync(path.join(APP, file)), file).toBe(true);
      expect(reason.trim().length, file).toBeGreaterThan(10);
    }
  });

  it("the pending list is current: every entry still has an unmarked call", () => {
    const stale = PENDING_OTHER_BRANCHES.filter((file) => !offenders.has(file));
    expect(stale, "these files are clean now — remove them from PENDING_OTHER_BRANCHES").toEqual([]);
  });
});

// Replace-question contract: every non-structural assessment question offers
// EXACTLY two alternates (so the member always has three worlds to choose
// from), and the swap UI cycles rather than locking out. Source-level checks
// so the contract can't silently drift.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(join(__dirname, "..", "pages", "Assessment.tsx"), "utf-8");

function altCounts(): Record<number, number> {
  const start = src.indexOf("const QUESTION_ALTS");
  const end = src.indexOf("\n};", start);
  const block = src.slice(start, end);
  const counts: Record<number, number> = {};
  const entryRe = /\n  (\d+): \[/g;
  let m: RegExpExecArray | null;
  const ids: { id: number; at: number }[] = [];
  while ((m = entryRe.exec(block))) ids.push({ id: Number(m[1]), at: m.index });
  ids.forEach((e, i) => {
    const seg = block.slice(e.at, ids[i + 1]?.at ?? block.length);
    counts[e.id] = (seg.match(/\{ title:/g) ?? []).length;
  });
  return counts;
}

describe("assessment replace-question contract", () => {
  it("24 questions carry exactly 2 alternates each (3 structural goals questions excluded)", () => {
    const counts = altCounts();
    expect(Object.keys(counts)).toHaveLength(24);
    for (const [id, n] of Object.entries(counts)) expect(n, `question ${id}`).toBe(2);
    for (const structural of [13, 14, 20]) expect(counts[structural]).toBeUndefined();
  });

  it("the swap control cycles (modulo) instead of a one-way lockout, and offers the way back to the original", () => {
    expect(src).toContain("% (altsForQuestion + 1)");
    expect(src).toContain("Take me back to the original question");
    expect(src).not.toContain("swapsLeft");
  });
});

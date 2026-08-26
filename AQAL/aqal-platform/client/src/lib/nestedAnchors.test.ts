// ============================================================
// NESTED-ANCHOR REGRESSION — the /archetypes hydration defect.
// Wouter v3's <Link> renders its own <a>; wrapping another <a>
// inside it produces invalid nested anchors and React hydration
// errors in real browsers. Guard at two levels:
//   1. render the page that shipped the defect and walk the HTML;
//   2. scan every page/component source so the pattern can never
//      return anywhere, including pages too stateful to render here.
// ============================================================
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { Router } from "wouter";
import { describe, expect, it } from "vitest";
import Archetypes from "../pages/Archetypes";

function maxAnchorDepth(html: string): number {
  let depth = 0;
  let max = 0;
  const tag = /<(\/?)a\b[^>]*?(\/?)>/gi;
  for (let m = tag.exec(html); m; m = tag.exec(html)) {
    if (m[1] === "/") depth = Math.max(0, depth - 1);
    else if (m[2] !== "/") { depth += 1; max = Math.max(max, depth); }
  }
  return max;
}

function tsxFilesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...tsxFilesUnder(p));
    else if (name.endsWith(".tsx")) out.push(p);
  }
  return out;
}

describe("nested anchors", () => {
  it("renders /archetypes with no anchor inside another anchor", () => {
    const html = renderToString(
      createElement(Router, { ssrPath: "/archetypes" }, createElement(Archetypes)),
    );
    expect(html.length).toBeGreaterThan(10_000);
    expect(maxAnchorDepth(html)).toBeLessThanOrEqual(1);
  });

  it("no source file wraps a raw <a> directly inside a wouter <Link>", () => {
    const root = join(__dirname, "..");
    const offenders: string[] = [];
    for (const file of tsxFilesUnder(root)) {
      const src = readFileSync(file, "utf-8");
      if (/<Link\b[^>]*>\s*<a\b/.test(src)) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });
});

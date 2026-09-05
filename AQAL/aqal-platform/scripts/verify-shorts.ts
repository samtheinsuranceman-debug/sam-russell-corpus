// ============================================================
// VERIFY SHORTS — proves the one-line description guarantee:
// every sitemap URL has a short description, every one is under
// 60 characters, and every one is unique. Run with:
//   npx tsx scripts/verify-shorts.ts
// Fails loudly if any future page family forgets its branch in
// client/src/lib/pageShorts.ts.
// ============================================================
import { SITEMAP_PATHS } from "../shared/seo";
import { shortFor } from "../client/src/lib/pageShorts";

let missing = 0, tooLong = 0;
const seen = new Map<string, string>();
const dupes: [string, string, string][] = [];

for (const path of SITEMAP_PATHS) {
  const s = shortFor(path);
  if (!s) { console.error("MISSING:", path); missing++; continue; }
  if (s.length >= 60) { console.error("TOO LONG:", path, `(${s.length})`, s); tooLong++; }
  const prior = seen.get(s);
  if (prior) dupes.push([s, prior, path]);
  else seen.set(s, path);
}

for (const [s, a, b] of dupes) console.error("DUPLICATE:", JSON.stringify(s), "on", a, "and", b);
const max = Math.max(...Array.from(seen.keys()).map((s) => s.length));
console.log(`pages: ${SITEMAP_PATHS.length} · shorts: ${seen.size} · longest: ${max} chars`);
console.log(`missing: ${missing} · too long: ${tooLong} · duplicates: ${dupes.length}`);
if (missing || tooLong || dupes.length) process.exit(1);
console.log("ALL PAGES: unique short description, every one under 60 characters.");

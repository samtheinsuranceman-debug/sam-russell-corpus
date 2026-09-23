/**
 * Document generator, guarded: writes the two test-checked factor documents
 * (`docs/macro/FACTORS.md`, `docs/macro/HOUSEHOLD_SIGNALS.md`) only when
 * `MACRO_GEN_DOCS=1` is set.
 *
 *   MACRO_GEN_DOCS=1 npx vitest run server/macroDocsGenerate.test.ts
 *
 * Run it after editing a rules-table row, a registry or the renderers.
 * Without the variable the test is a no-op, so the full suite never writes
 * files.
 *
 * Production port (A22, 2026-09-23): the archive's version also wrote the
 * vault documents (`secrets/*.md` through `server/secretsDoc.ts`); that half
 * travels with the vault PR (DECISIONS.md, D-A22-1).
 */
import { it } from "vitest";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderFactorsMarkdown, renderHouseholdMarkdown } from "./macroFactorsDoc";

const FACTOR_DOCS_RENDERED_ON = "2026-09-22";

it("writes the documents when asked", () => {
  if (process.env.MACRO_GEN_DOCS !== "1") return;
  const root = join(__dirname, "..");
  writeFileSync(join(root, "docs", "macro", "FACTORS.md"), renderFactorsMarkdown({}, FACTOR_DOCS_RENDERED_ON));
  writeFileSync(join(root, "docs", "macro", "HOUSEHOLD_SIGNALS.md"), renderHouseholdMarkdown({}, FACTOR_DOCS_RENDERED_ON));
});

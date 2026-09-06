#!/usr/bin/env bash
# One command from source to every shippable artifact:
#   typecheck → single-file homepage (docs/index.html) → database schema SQL
#   → tests (incl. parity + schema file) → production build → deploy bundle zip
#   → plain-Markdown code book.
# Any failing step aborts; nothing is regenerated from a broken build.
# Usage: pnpm release        (from russell-capital-systems/)
set -euo pipefail
APP="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP"

step() { printf '\n\033[1;32m▶ %s\033[0m\n' "$*"; }

step "1/7 typecheck";           pnpm check
step "2/7 single-file homepage"; python3 live/build_live_homepage.py
step "3/7 database schema SQL";  bash scripts/export_schema_sql.sh
# The public surface: homepage, live-page parity, lead pipeline, AI panel. These run
# with no database. (`pnpm test` runs the whole suite, parts of which need a live DB.)
step "4/7 tests";               npx vitest run server/concept16Homepage.test.ts server/livePageParity.test.ts server/databaseSchemaFile.test.ts \
                                  server/homepage-typography-scale.test.ts server/leadStrategy.test.ts \
                                  server/leadsRouter.test.ts server/ownerLogin.test.ts server/mailer.test.ts server/journeyEngine.test.ts server/librarian.test.ts server/wealthGenome.test.ts server/jsonColumn.test.ts server/ultraAI-providers.test.ts
step "5/7 production build";    pnpm build && node scripts/check_production_bundle.mjs
step "6/7 deploy bundle";       bash scripts/build_deploy_bundle.sh
step "7/7 code book";           python3 scripts/build_code_book.py | tail -1

printf '\n\033[1;32m✔ release artifacts are current:\033[0m\n'
echo "  docs/index.html            — public homepage (GitHub Pages / any static host)"
echo "  database/rcs-schema.sql    — complete DB schema (phpMyAdmin import / pnpm db:build)"
echo "  rcs-deploy-<date>.zip      — full app bundle for cPanel / Node host"
echo "  rcs-code-book/             — plain-Markdown source for AI review"
echo "Commit and push; master serves docs/ once GitHub Pages is switched on."

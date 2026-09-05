#!/usr/bin/env bash
# One command from source to every shippable artifact:
#   typecheck → single-file homepage (docs/index.html) → tests (incl. parity)
#   → production build → deploy bundle zip → plain-Markdown code book.
# Any failing step aborts; nothing is regenerated from a broken build.
# Usage: pnpm release        (from russell-capital-systems/)
set -euo pipefail
APP="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP"

step() { printf '\n\033[1;32m▶ %s\033[0m\n' "$*"; }

step "1/6 typecheck";           pnpm check
step "2/6 single-file homepage"; python3 live/build_live_homepage.py
# The public surface: homepage, live-page parity, lead pipeline, AI panel. These run
# with no database. (`pnpm test` runs the whole suite, parts of which need a live DB.)
step "3/6 tests";               npx vitest run server/concept16Homepage.test.ts server/livePageParity.test.ts \
                                  server/homepage-typography-scale.test.ts server/leadStrategy.test.ts \
                                  server/leadsRouter.test.ts server/ultraAI-providers.test.ts
step "4/6 production build";    pnpm build
step "5/6 deploy bundle";       bash scripts/build_deploy_bundle.sh
step "6/6 code book";           python3 scripts/build_code_book.py | tail -1

printf '\n\033[1;32m✔ release artifacts are current:\033[0m\n'
echo "  docs/index.html            — public homepage (GitHub Pages / any static host)"
echo "  rcs-deploy-<date>.zip      — full app bundle for cPanel / Node host"
echo "  rcs-code-book/             — plain-Markdown source for AI review"
echo "Commit and push; master serves docs/ once GitHub Pages is switched on."

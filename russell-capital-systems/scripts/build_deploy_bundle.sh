#!/usr/bin/env bash
# Package the production build (dist/, drizzle/, package.json, lockfile, drizzle
# config, DEPLOY.md) into <repo>/rcs-deploy-<date>.zip for cPanel / any Node host.
# Assumes `pnpm build` has already run. Usage: scripts/build_deploy_bundle.sh [zip-name]
set -euo pipefail
APP="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(dirname "$APP")"
NAME="${1:-rcs-deploy-$(date +%Y-%m-%d).zip}"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

[ -f "$APP/dist/index.js" ] || { echo "dist/index.js missing — run pnpm build first" >&2; exit 1; }

mkdir -p "$STAGE/rcs-deploy"
cp -r "$APP/dist" "$STAGE/rcs-deploy/dist"
cp -r "$APP/drizzle" "$STAGE/rcs-deploy/drizzle"
cp "$APP/package.json" "$APP/pnpm-lock.yaml" "$APP/drizzle.config.ts" "$STAGE/rcs-deploy/"
cp "$APP/scripts/DEPLOY.md" "$STAGE/rcs-deploy/DEPLOY.md"

# Never ship secrets or local state.
find "$STAGE/rcs-deploy" \( -name '.env*' -o -name '*.pem' -o -name '*.key' \) -delete

( cd "$STAGE" && rm -f bundle.zip && zip -qr bundle.zip rcs-deploy )
unzip -tq "$STAGE/bundle.zip" >/dev/null
# Keep a single bundle at the repo root: replace any older rcs-deploy-*.zip.
rm -f "$REPO"/rcs-deploy-*.zip
cp "$STAGE/bundle.zip" "$REPO/$NAME"
echo "wrote $REPO/$NAME ($(stat -c %s "$REPO/$NAME") bytes, $(unzip -l "$REPO/$NAME" | tail -1 | awk '{print $2}') files)"

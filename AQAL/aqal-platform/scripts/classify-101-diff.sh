#!/usr/bin/env bash
set -euo pipefail

DIFF_FILE="${1:-validation/101_vs_current.diff}"
OUTPUT_FILE="${2:-validation/101_INTEGRATION_MATRIX.tsv}"
ROOT_101="/home/ubuntu/aqal-compare-101/101"
ROOT_CURRENT="/home/ubuntu/aqal-compare-101/current"

printf 'path\tdifference\tcategory\tdecision\trationale\n' > "$OUTPUT_FILE"

classify() {
  local path="$1" status="$2" category decision rationale
  category="application"
  decision="preserve-current"
  rationale="Current verified implementation is retained unless a 101 feature is explicitly merged."

  case "$path" in
    client/src/lib/protocolSubpages.ts|client/src/pages/ProtocolSubpage.tsx)
      category="routes-content"; decision="integrate"; rationale="New seven-family protocol deep-page implementation." ;;
    client/src/lib/routeMetaFor.ts|client/src/lib/routeMetaFor.test.ts)
      category="seo-tests"; decision="integrate-selectively"; rationale="Adopt pure metadata builder and strict tests while preserving current PAGE_META copy." ;;
    server/marketingEmail.ts)
      category="email-compliance"; decision="redesign-then-integrate"; rationale="Marketing suppression is valid, but token, GET side effect, failure reporting, and resubscribe behavior need hardening." ;;
    client/src/App.tsx|client/src/components/RouteMeta.tsx|client/src/lib/pageShorts.ts|client/src/lib/pageShorts.test.ts|client/src/pages/TherapyDetail.tsx|shared/seo.ts|vitest.config.ts)
      category="routes-seo"; decision="selective-merge"; rationale="Port protocol route/sitemap/metadata additions without overwriting current route, copy, or test fixes." ;;
    drizzle/schema.ts|drizzle/meta/_journal.json)
      category="database"; decision="selective-merge"; rationale="Add only email opt-out state and a reviewed additive migration; preserve accountability/testimonial schema." ;;
    server/platform/email.ts)
      category="email-provider"; decision="selective-merge"; rationale="Add custom headers and hardened unsubscribe helpers while preserving current provider seam." ;;
    server/_core/index.ts)
      category="server-routing"; decision="selective-merge"; rationale="Add redesigned unsubscribe endpoints while preserving canonical origin, proxy, security, webhook, and startup fixes." ;;
    server/routers.ts|server/scheduledFinishNudge.ts|server/scheduledMessageDigest.ts|server/scheduledQuestionOfDay.ts|server/scheduledReentry.ts|server/scheduledTrackerReengagement.ts)
      category="scheduled-email"; decision="selective-merge"; rationale="Route marketing mail through suppression wrapper while preserving scheduledAuth, diagnostics, idempotency, Twilio, and accountability." ;;
    server/scheduledDriftAlert.ts|server/scheduledJobs.ts)
      category="scheduling-security"; decision="preserve-current"; rationale="Current managed/external cron security and seven-job manifest are verified; 101 does not supersede them." ;;
    server/accountability.ts|server/accountability.test.ts|server/scheduledAuth.ts|server/scheduledAuth.test.ts|server/scheduledDailyReminders.ts|server/scheduledJobs.test.ts|server/twilioInbound.ts|server/twilioInbound.test.ts)
      category="current-security-fix"; decision="preserve-current"; rationale="Current verified accountability, cron, and Twilio implementation is absent from 101." ;;
    server/_core/canonical.ts|server/_core/canonical.test.ts)
      category="canonical-routing"; decision="preserve-current"; rationale="Current managed-origin and apex canonical behavior is verified and absent from 101." ;;
    client/public/founder-sam-russell.jpg|client/public/og-cover.png|client/public/og-cover.svg)
      category="media"; decision="exclude-local-copy"; rationale="Current persistent-storage copies preserve exact supplied binaries without deploy-bundled media." ;;
    client/src/components/ManusDialog.tsx|HANDOFF_TO_MANUS.md|references/periodic-updates.md|template.json)
      category="legacy-platform"; decision="exclude-or-archive"; rationale="Not required in the owner-controlled runtime; current replacements are retained." ;;
    .env.example|.gitignore|package.json|pnpm-lock.yaml|vite.config.ts)
      category="build-config"; decision="preserve-current"; rationale="Current dependency, patch, runtime, and owner-controlled build configuration is verified." ;;
    client/index.html)
      category="metadata"; decision="preserve-current"; rationale="Current exact canonical/Open Graph/static metadata and persistent asset URLs are verified." ;;
    client/src/_core/hooks/useAuth.ts|client/src/components/AssessmentResumeDialog.tsx|client/src/main.tsx|server/_core/cookies.ts|server/_core/env.ts|server/_core/sdk.ts|server/auth.logout.test.ts)
      category="authentication"; decision="preserve-current"; rationale="Current local authentication, cookie, session, and two-secret boot fixes are verified." ;;
    client/src/pages/About.tsx|server/_core/storageProxy.ts|server/platform/storage.ts|server/storage.ts|docs/required-storage-assets.txt|scripts/upload-required-assets.mjs|scripts/verify-storage-assets.sh)
      category="storage-media"; decision="preserve-current"; rationale="Current AQAL-owned storage path, persistent supplied assets, and no-substitution gate are verified." ;;
    drizzle/0026_sparkling_xavin.sql|drizzle/meta/0026_snapshot.json)
      category="current-database-migration"; decision="preserve-current"; rationale="Current accountability/testimonial additive migration is absent from 101 and must remain." ;;
    COMPLETE_AUDIT_REPORT.md|HOSTING_CAPACITY_REPORT.md|HYPNOSIS_LIBRARY_ROADMAP.md|LIVE_PUBLICATION_STATUS.md|MANUAL_PUBLISH_GUIDE.md|MEDIA_ASSET_HANDOFF.md|RELEASE_VALIDATION.md|REVISED_50_MEDIA_CAPACITY_REPORT.md|START_HERE_BLUEHOST.md|STORAGE_AND_MEDIA_CAPACITY_REPORT.md)
      category="owner-documentation"; decision="preserve-current"; rationale="Current audit, capacity, publication, and Bluehost handoff documents supersede 101 deployment notes." ;;
    LAUNCH_RUNBOOK.md|MECHANICS_REVIEW.md)
      category="documentation"; decision="preserve-current"; rationale="Current managed-host and security instructions supersede Railway-era 101 text." ;;
    client/src/components/GlobalAtmosphere.tsx|client/src/pages/BlackBox.tsx|client/src/pages/Portal.tsx|client/src/pages/ResearchLibrary.tsx|client/src/pages/Results.tsx|client/src/pages/Runbook.tsx|server/blackBox.ts|server/db.ts|server/platform/config.ts|shared/clusterImages.ts|shared/growthEngine.ts|shared/keystonePractices.ts|shared/therapyLineMap.ts)
      category="current-verified-content-or-runtime"; decision="preserve-current"; rationale="Current fixes and owner terminology are retained; no required 101 feature depends on overwriting this file." ;;
    server/_core/dataApi.ts|server/_core/map.ts|server/_core/notification.ts|server/procedures.test.ts|server/video.test.ts)
      category="managed-seam-tests"; decision="preserve-current"; rationale="Current provider seams and test expectations are verified in the managed project." ;;
    .manus/*)
      category="managed-runtime"; decision="preserve-current"; rationale="Current project-managed runtime support is required in the active hosting project." ;;
    *)
      if [[ "$status" == "only-current" ]]; then
        category="current-addition"; decision="preserve-current"; rationale="Present only in the verified current project; retain unless separately deprecated."
      elif [[ "$status" == "only-101" ]]; then
        category="101-addition"; decision="manual-review"; rationale="Present only in 101 and requires explicit review before integration."
      else
        category="changed-file"; decision="preserve-current"; rationale="Changed in 101, but no approved 101 dependency requires a wholesale replacement."
      fi
      ;;
  esac

  printf '%s\t%s\t%s\t%s\t%s\n' "$path" "$status" "$category" "$decision" "$rationale" >> "$OUTPUT_FILE"
}

while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  if [[ "$line" == "Files $ROOT_101/"*" and $ROOT_CURRENT/"*" differ" ]]; then
    rest="${line#Files $ROOT_101/}"
    path="${rest%% and $ROOT_CURRENT/*}"
    classify "$path" "changed"
  elif [[ "$line" == "Only in $ROOT_101"* ]]; then
    rest="${line#Only in $ROOT_101}"
    dir="${rest%%:*}"
    name="${rest#*: }"
    path="${dir#/}"
    [[ -n "$path" ]] && path="$path/$name" || path="$name"
    classify "$path" "only-101"
  elif [[ "$line" == "Only in $ROOT_CURRENT"* ]]; then
    rest="${line#Only in $ROOT_CURRENT}"
    dir="${rest%%:*}"
    name="${rest#*: }"
    path="${dir#/}"
    [[ -n "$path" ]] && path="$path/$name" || path="$name"
    classify "$path" "only-current"
  else
    printf 'Unparsed diff line: %s\n' "$line" >&2
    exit 2
  fi
done < "$DIFF_FILE"

printf 'classified_entries=%s\n' "$(( $(wc -l < "$OUTPUT_FILE") - 1 ))"

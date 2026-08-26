#!/usr/bin/env bash
set -euo pipefail

INPUT_FILE="${1:-validation/202_VS_CURRENT_MATRIX.tsv}"
OUTPUT_FILE="${2:-validation/202_INTEGRATION_MATRIX.tsv}"

printf 'path\tdifference\tcategory\tdecision\trationale\n' > "$OUTPUT_FILE"

classify() {
  local path="$1" status="$2" category decision rationale
  category="application"
  decision="preserve-current"
  rationale="Retain the current verified implementation unless a 202 feature is explicitly approved."

  case "$path" in
    client/src/components/DeepPage.tsx|client/src/pages/BestProtocols.tsx|client/src/pages/CapacitySub.tsx|client/src/pages/GoalDeep.tsx|client/src/pages/KindDeep.tsx|client/src/pages/LineDeep.tsx|client/src/pages/MythDeep.tsx|client/src/pages/PairDeep.tsx|client/src/pages/PracticeDeep.tsx|client/src/pages/WingDeep.tsx|shared/therapyKindMap.ts)
      category="deep-page-addition"; decision="integrate"; rationale="New 202 deep-page implementation required for the 6,579-URL content architecture." ;;
    client/src/App.tsx|shared/seo.ts)
      category="routes-seo"; decision="selective-merge"; rationale="Merge 202 deep routes and sitemap families while preserving current route order, canonical behavior, auth metadata, and managed fixes." ;;
    client/src/lib/routeMetaFor.ts|client/src/lib/routeMetaFor.test.ts|client/src/lib/pageShorts.ts|client/src/lib/therapyKinds.ts|client/src/components/RouteMeta.tsx)
      category="deep-page-seo"; decision="integrate"; rationale="Approved 202 metadata, short-description, test, and shared therapy-kind support for all deep-page families." ;;
    client/src/pages/CapacityDetail.tsx|client/src/pages/GoalDetail.tsx|client/src/pages/KindDetail.tsx|client/src/pages/LineDetail.tsx|client/src/pages/MythDetail.tsx|client/src/pages/PairDetail.tsx|client/src/pages/PracticeDetail.tsx|client/src/pages/WingDetail.tsx)
      category="deep-page-navigation"; decision="selective-merge"; rationale="Add the 202 GoDeeper navigation block without replacing current page content or fixes." ;;
    client/src/pages/researchLibraryData.ts)
      category="research-correction"; decision="selective-merge"; rationale="Apply only the verified 103,558-to-106,579 Marsh and Hau sample-size correction." ;;
    client/public/founder-sam-russell.jpg|client/public/og-cover.png|client/public/og-cover.svg)
      category="media"; decision="exclude-local-copy"; rationale="Exact supplied binaries already use persistent project storage; do not reintroduce deploy-bundled media." ;;
    client/src/components/ManusDialog.tsx|HANDOFF_TO_MANUS.md|references/periodic-updates.md|template.json)
      category="legacy-platform"; decision="archive-only"; rationale="Archive reference only; current managed runtime and owner handoff materials supersede these copies." ;;
    package.json|pnpm-lock.yaml|vite.config.ts|client/index.html)
      category="build-metadata"; decision="preserve-current"; rationale="Current dependency lock, runtime build, canonical metadata, and persistent asset paths are verified." ;;
    client/src/_core/hooks/useAuth.ts|client/src/components/AssessmentResumeDialog.tsx|client/src/main.tsx|server/_core/cookies.ts|server/_core/env.ts|server/_core/sdk.ts|server/auth.logout.test.ts)
      category="authentication"; decision="preserve-current"; rationale="Current local/managed authentication, cookie, session, and app-id fixes are verified." ;;
    server/_core/index.ts|server/_core/canonical.ts|server/_core/canonical.test.ts)
      category="canonical-server"; decision="preserve-current"; rationale="Current managed-origin health, custom-host redirect, security headers, unsubscribe endpoints, and API mounts are verified." ;;
    server/accountability.ts|server/accountability.test.ts|server/scheduledAuth.ts|server/scheduledAuth.test.ts|server/scheduledDailyReminders.ts|server/scheduledJobs.test.ts|server/twilioInbound.ts|server/twilioInbound.test.ts)
      category="security-scheduling"; decision="preserve-current"; rationale="Current idempotent accountability, cron authentication, daily reminders, and signed Twilio reply handling are absent from 202 and must remain." ;;
    server/marketingEmail.ts|server/marketingEmail.test.ts|server/platform/email.ts|server/platform/email.test.ts)
      category="email-compliance"; decision="preserve-current"; rationale="Current scanner-safe opaque unsubscribe tokens, RFC 8058 handling, opt-out suppression, and tests are verified." ;;
    drizzle/schema.ts|drizzle/meta/_journal.json|drizzle/0026_sparkling_xavin.sql|drizzle/0027_narrow_war_machine.sql|drizzle/meta/0026_snapshot.json|drizzle/meta/0027_snapshot.json)
      category="database"; decision="preserve-current"; rationale="202 adds no new schema; preserve the current 33-table additive accountability, testimonial, and email-opt-out migrations." ;;
    client/src/pages/About.tsx|server/_core/storageProxy.ts|server/platform/storage.ts|server/storage.ts|docs/required-storage-assets.txt|scripts/upload-required-assets.mjs|scripts/verify-storage-assets.sh)
      category="storage-media"; decision="preserve-current"; rationale="Current owner-controlled storage routes, exact supplied binaries, and no-substitution media gate are verified." ;;
    server/_core/dataApi.ts|server/_core/map.ts|server/_core/notification.ts|server/procedures.test.ts|server/video.test.ts)
      category="managed-provider-seam"; decision="preserve-current"; rationale="Current managed provider seams and credential-isolated tests are verified." ;;
    server/scheduledDriftAlert.ts|server/scheduledFinishNudge.ts|server/scheduledJobs.ts|server/scheduledMessageDigest.ts|server/scheduledQuestionOfDay.ts|server/scheduledReentry.ts|server/scheduledTrackerReengagement.ts)
      category="scheduled-email"; decision="preserve-current"; rationale="Current seven-job manifest, scheduled authorization, opt-out skip behavior, and diagnostics are verified." ;;
    client/src/components/GlobalAtmosphere.tsx|client/src/pages/BlackBox.tsx|client/src/pages/Portal.tsx|client/src/pages/Profile.tsx|client/src/pages/ResearchLibrary.tsx|client/src/pages/Results.tsx|client/src/pages/Runbook.tsx|client/src/pages/TherapyDetail.tsx|client/src/pages/WhichArchetype.tsx|server/blackBox.ts|server/db.ts|server/platform/config.ts|shared/clusterImages.ts|shared/growthEngine.ts|shared/keystonePractices.ts|shared/therapyLineMap.ts)
      category="current-verified-content-runtime"; decision="preserve-current"; rationale="No 202 feature depends on replacing this current verified content or runtime implementation." ;;
    COMPLETE_AUDIT_REPORT.md|HOSTING_CAPACITY_REPORT.md|HYPNOSIS_LIBRARY_ROADMAP.md|LIVE_PUBLICATION_STATUS.md|MANUAL_PUBLISH_GUIDE.md|MEDIA_ASSET_HANDOFF.md|RELEASE_VALIDATION.md|REVISED_50_MEDIA_CAPACITY_REPORT.md|START_HERE_BLUEHOST.md|STORAGE_AND_MEDIA_CAPACITY_REPORT.md|LAUNCH_RUNBOOK.md|MECHANICS_REVIEW.md)
      category="owner-documentation"; decision="preserve-current"; rationale="Current audit, capacity, manual-publish, media, and Bluehost materials supersede source deployment notes." ;;
    scripts/audit-browser-clicks.mjs|scripts/classify-101-diff.sh|scripts/verify-release.sh)
      category="verification-tooling"; decision="preserve-current"; rationale="Current publication, browser, and release-verification tools are required for the audited managed project." ;;
    todo.md)
      category="project-history"; decision="preserve-current"; rationale="Retain the complete managed-project task history and current no-publication requirements." ;;
    *)
      if [[ "$status" == "identical" ]]; then
        category="unchanged"; decision="no-change"; rationale="202 is byte-identical to the current project." 
      elif [[ "$status" == "missing_from_202" ]]; then
        category="current-addition"; decision="preserve-current"; rationale="Current-only verified file; retain unless separately deprecated after review." 
      elif [[ "$status" == "added_in_202" ]]; then
        category="202-addition"; decision="manual-review"; rationale="202-only file requires explicit approval before integration." 
      else
        category="changed-file"; decision="preserve-current"; rationale="No approved 202 dependency requires wholesale replacement of this current file." 
      fi
      ;;
  esac

  printf '%s\t%s\t%s\t%s\t%s\n' "$path" "$status" "$category" "$decision" "$rationale" >> "$OUTPUT_FILE"
}

while IFS=$'\t' read -r path status _sha202 _shaCurrent; do
  [[ "$path" == "path" ]] && continue
  classify "$path" "$status"
done < "$INPUT_FILE"

printf 'classified_entries=%s\n' "$(( $(wc -l < "$OUTPUT_FILE") - 1 ))"

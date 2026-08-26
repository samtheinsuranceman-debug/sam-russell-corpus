#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
CANONICAL_HOST="${CANONICAL_HOST:-www.joinaqal.com}"
EXPECTED_SITEMAP_COUNT="${EXPECTED_SITEMAP_COUNT:-9646}"
failures=0

pass() { printf 'PASS  %s\n' "$1"; }
fail() { printf 'FAIL  %s\n' "$1"; failures=$((failures + 1)); }

check_status() {
  local path="$1"
  local code
  code="$(curl -sS -o /dev/null -w '%{http_code}' "${BASE_URL}${path}")"
  if [[ "$code" == "200" ]]; then
    pass "${path} returned 200"
  else
    fail "${path} returned ${code}"
  fi
}

routes=(
  "/"
  "/launch-check"
  "/line/emotional"
  "/line/emotional/at-work"
  "/protocol/emdr"
  "/protocol/emdr/first-week"
  "/protocol/emdr/score"
  "/protocol/emdr/daily-life"
  "/myth/laetrile"
  "/myth/laetrile/receipts"
  "/capacity/adaptive"
  "/capacity/adaptive/signs"
  "/kind/psychotherapy"
  "/kind/psychotherapy/standards"
  "/wing/miracle-cure"
  "/wing/miracle-cure/spot"
  "/verdict/harmful"
  "/pair/logical--strategic"
  "/pair/logical--strategic/collide"
  "/practice/sleep"
  "/practice/sleep/start"
  "/goal/focus"
  "/goal/focus/plan"
  "/best/psychotherapy/tactical"
  "/weak/interoceptive"
  "/build/adaptive/emdr"
  "/build/adaptive/emdr/plan"
  "/compare/bibliotherapy--vs--emdr/verdict"
  "/compare/bibliotherapy--vs--emdr/switch"
  "/rankings"
  "/hypnosis"
  "/hypnosis/emotional-steadiness"
  "/protocols"
  "/myths"
  "/black-box"
  "/corrections"
  "/sample-report"
  "/help"
  "/reset-password"
)

for route in "${routes[@]}"; do
  check_status "$route"
done

robots="$(curl -fsS "${BASE_URL}/robots.txt")"
if grep -Fq "Sitemap: https://${CANONICAL_HOST}/sitemap.xml" <<<"$robots"; then
  pass "robots.txt advertises the canonical sitemap"
else
  fail "robots.txt does not advertise the canonical sitemap"
fi

sitemap="$(curl -fsS "${BASE_URL}/sitemap.xml")"
sitemap_count="$(grep -o '<url>' <<<"$sitemap" | wc -l | tr -d ' ')"
noncanonical_count="$(grep -o '<loc>[^<]*</loc>' <<<"$sitemap" | grep -vc "<loc>https://${CANONICAL_HOST}/" || true)"
if [[ "$sitemap_count" == "$EXPECTED_SITEMAP_COUNT" ]]; then
  pass "sitemap.xml contains ${EXPECTED_SITEMAP_COUNT} URLs"
else
  fail "sitemap.xml contains ${sitemap_count} URLs instead of ${EXPECTED_SITEMAP_COUNT}"
fi
if [[ "$noncanonical_count" == "0" ]]; then
  pass "every sitemap URL uses https://${CANONICAL_HOST}"
else
  fail "${noncanonical_count} sitemap URLs are noncanonical"
fi

homepage="$(curl -fsS "${BASE_URL}/")"
expected_description='IQ graded 4 lines of you. We measure all 32.'
if grep -Fq "$expected_description" <<<"$homepage"; then
  pass "homepage contains the required OG description"
else
  fail "homepage is missing the required OG description"
fi

headers="$(curl -sSI -H 'X-Forwarded-Proto: https' "${BASE_URL}/")"
for expected in \
  'strict-transport-security: max-age=15552000; includeSubDomains' \
  'x-content-type-options: nosniff' \
  'x-frame-options: SAMEORIGIN'; do
  if grep -Fiq "$expected" <<<"$headers"; then
    pass "security header present: ${expected%%:*}"
  else
    fail "security header missing: ${expected%%:*}"
  fi
done

redirect_headers="$(curl -sS -o /dev/null -D - -H 'X-Forwarded-Proto: https' -H 'X-Forwarded-Host: joinaqal.com' "${BASE_URL}/protocol/emdr")"
if grep -Fiq 'HTTP/1.1 301' <<<"$redirect_headers" && grep -Fiq "location: https://${CANONICAL_HOST}/protocol/emdr" <<<"$redirect_headers"; then
  pass "bare domain redirects to the canonical www host"
else
  fail "bare domain canonical redirect is incorrect"
fi

http_redirect_headers="$(curl -sS -o /dev/null -D - -H 'X-Forwarded-Proto: http' -H "X-Forwarded-Host: ${CANONICAL_HOST}" "${BASE_URL}/help")"
if grep -Fiq 'HTTP/1.1 301' <<<"$http_redirect_headers" && grep -Fiq "location: https://${CANONICAL_HOST}/help" <<<"$http_redirect_headers"; then
  pass "HTTP redirects to HTTPS on the canonical host"
else
  fail "HTTP-to-HTTPS redirect is incorrect"
fi

if [[ "$failures" -gt 0 ]]; then
  printf '\nRelease verification failed: %s check(s) failed.\n' "$failures" >&2
  exit 1
fi

printf '\nRelease verification passed.\n'

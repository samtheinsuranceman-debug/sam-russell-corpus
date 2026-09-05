#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
MANIFEST="${MANIFEST:-docs/required-storage-assets.txt}"

if [[ ! -f "$MANIFEST" ]]; then
  printf 'Missing asset manifest: %s\n' "$MANIFEST" >&2
  exit 2
fi

failures=0
total=0
while IFS= read -r key; do
  [[ -z "$key" ]] && continue
  total=$((total + 1))
  url="${BASE_URL%/}/aqal-storage/$key"
  probe="$(curl -sS -L -o /dev/null -w '%{http_code}\t%{content_type}' "$url" || true)"
  status="${probe%%$'\t'*}"
  actual_type="${probe#*$'\t'}"
  case "$key" in
    *.png) expected_type="image/png" ;;
    *.pdf) expected_type="application/pdf" ;;
    *) expected_type="application/octet-stream" ;;
  esac

  if [[ "$status" == "200" && "$actual_type" == "$expected_type"* ]]; then
    printf 'PASS  %s\n' "$key"
  else
    printf 'FAIL  %s returned status=%s content-type=%s; expected %s\n' \
      "$key" "${status:-curl-error}" "${actual_type:-missing}" "$expected_type" >&2
    failures=$((failures + 1))
  fi
done < "$MANIFEST"

if (( failures > 0 )); then
  printf 'Storage verification failed: %d of %d required assets unavailable.\n' "$failures" "$total" >&2
  exit 1
fi

printf 'Storage verification passed: %d required assets available.\n' "$total"

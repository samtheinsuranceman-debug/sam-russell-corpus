#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-/home/ubuntu/aqal_rebuild_500/aqal-platform}"
ZIP="${2:-/home/ubuntu/upload/500JOINAQAL-COMPLETE-REBUILD.zip}"
OUT="${3:-validation/500_SECURITY_SCAN.txt}"
TEXTLIST="$(mktemp)"
trap 'rm -f "$TEXTLIST"' EXIT

find "$ROOT" -type f \( \
  -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.mjs' \
  -o -name '*.json' -o -name '*.md' -o -name '*.txt' -o -name '*.sql' \
  -o -name '*.yaml' -o -name '*.yml' -o -name '*.sh' -o -name '*.csv' \
  -o -name '*.html' \
\) -print > "$TEXTLIST"

scan_files() {
  local pattern="$1"
  xargs -a "$TEXTLIST" grep -IlE -- "$pattern" 2>/dev/null \
    | sed "s#^$ROOT/##" \
    | sort -u || true
}

private="$(scan_files '-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----')"
credential="$(scan_files '(sk-(live|test|proj)-[A-Za-z0-9_-]{12,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{20,}|xox[baprs]-[0-9A-Za-z-]{10,})')"
connection="$(scan_files '(mysql|postgres(ql)?|mongodb(\+srv)?|redis)://[^[:space:]<>$]+:[^[:space:]<>$]+@')"
temporary="$(scan_files '(manus\.computer|manuscdn\.com|localhost:[0-9]+|127\.0\.0\.1:[0-9]+|\.up\.railway\.app)')"
ugc="$(scan_files '(INSERT[[:space:]]+INTO[[:space:]]+(testimonials?|reviews?)|seed.{0,40}(testimonial|review)|fake.{0,40}(testimonial|review)|mock.{0,40}(testimonial|review))')"

env_names="$(unzip -p "$ZIP" 'aqal-platform/.env.example' \
  | sed -E 's/[[:space:]]*#.*$//' \
  | awk -F= '/^[A-Za-z_][A-Za-z0-9_]*=/{print $1}' \
  | sort -u)"

env_nonempty="$(unzip -p "$ZIP" 'aqal-platform/.env.example' \
  | awk -F= '/^[A-Za-z_][A-Za-z0-9_]*=/{v=substr($0,index($0,"=")+1); if(v!="" && v !~ /^<.*>$/ && v !~ /^your_/ && v !~ /^https?:\/\/localhost/ && v !~ /^(0|false|true)$/) print NR ":nonempty"}' \
  || true)"

{
  printf '# 500 Security Scan\n\n'
  printf 'text_files_scanned=%s\n' "$(wc -l < "$TEXTLIST" | tr -d ' ')"
  printf 'committed_node_modules=%s\n' "$(find "$ROOT" -type d -name node_modules | wc -l | tr -d ' ')"
  printf 'committed_dist=%s\n' "$(find "$ROOT" -type d -name dist | wc -l | tr -d ' ')"
  printf 'symlinks=%s\n' "$(find "$ROOT" -type l | wc -l | tr -d ' ')"
  printf 'executables=%s\n\n' "$(find "$ROOT" -type f -perm /111 | wc -l | tr -d ' ')"
  printf '## Private-key signatures\n%s\n\n' "${private:-none}"
  printf '## High-risk credential signatures\n%s\n\n' "${credential:-none}"
  printf '## Credential-bearing connection-string signatures\n%s\n\n' "${connection:-none}"
  printf '## Temporary/local/deployment host references\n%s\n\n' "${temporary:-none}"
  printf '## Seeded/fake/mock testimonial or review signatures\n%s\n\n' "${ugc:-none}"
  printf '## Environment-template variable names\n%s\n\n' "$env_names"
  printf '## Environment-template nonempty value markers\n%s\n\n' "${env_nonempty:-none}"
  printf '## Corrections hashes\n'
  for file in \
    "$ROOT/client/src/pages/Corrections.tsx" \
    /home/ubuntu/aqal_rebuild_203/aqal-platform/client/src/pages/Corrections.tsx \
    /home/ubuntu/joinaqal-rebuild/client/src/pages/Corrections.tsx
  do
    if [[ -f "$file" ]]; then sha256sum "$file"; fi
  done
} > "$OUT"

cat "$OUT"

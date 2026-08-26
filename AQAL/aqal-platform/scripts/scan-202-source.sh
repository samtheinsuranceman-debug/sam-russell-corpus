#!/usr/bin/env bash
set -euo pipefail

OUTPUT_FILE="${1:-validation/202_source_security_scan.txt}"
RUNTIME_ROOTS=(client server shared drizzle storage scripts)

credential_pattern='(-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{30,}|gh[pousr]_[0-9A-Za-z]{20,}|sk_(live|test)_[0-9A-Za-z]{16,}|mysql://[^[:space:]]+:[^[:space:]]+@)'
temporary_host_pattern='(manus\.computer|files\.manuscdn\.com|aqalrebuild-zmxkzmjl\.manus\.space)'
seeded_ugc_pattern='(INSERT[[:space:]]+INTO[[:space:]]+[`"]?(testimonials|reviews)|seed(Testimonial|Review)|mock(Testimonial|Review))'

credential_files="$(grep -RIlE --exclude='*.test.ts' --exclude='*.spec.ts' --exclude='scan-202-source.sh' \
  --include='*.ts' --include='*.tsx' --include='*.js' --include='*.mjs' --include='*.json' \
  "$credential_pattern" "${RUNTIME_ROOTS[@]}" package.json vite.config.ts 2>/dev/null || true)"

temporary_host_files="$(grep -RIlE --include='*.ts' --include='*.tsx' --include='*.js' --include='*.mjs' --exclude='*.test.ts' --exclude='*.spec.ts' \
  "$temporary_host_pattern" client server shared storage 2>/dev/null || true)"

seeded_ugc_files="$(grep -RIlE --include='*.sql' --include='*.ts' --include='*.tsx' \
  "$seeded_ugc_pattern" drizzle server client shared 2>/dev/null || true)"

{
  printf '%s\n' '## High-risk credential signatures'
  [[ -n "$credential_files" ]] && printf '%s\n' "$credential_files" || printf '%s\n' 'none'
  printf '%s\n' '## Temporary public host references in runtime source'
  [[ -n "$temporary_host_files" ]] && printf '%s\n' "$temporary_host_files" || printf '%s\n' 'none'
  printf '%s\n' '## Seeded testimonial/review SQL or fixtures'
  [[ -n "$seeded_ugc_files" ]] && printf '%s\n' "$seeded_ugc_files" || printf '%s\n' 'none'
  printf '%s\n' '## Transient directories present only in working tree'
  for directory in node_modules dist coverage; do
    [[ -e "$directory" ]] && printf '%s\n' "$directory" || true
  done
} > "$OUTPUT_FILE"

cat "$OUTPUT_FILE"
[[ -z "$credential_files" ]]
[[ -z "$temporary_host_files" ]]
[[ -z "$seeded_ugc_files" ]]

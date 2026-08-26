#!/usr/bin/env bash
set -euo pipefail

SOURCE_ROOT="${1:-/home/ubuntu/aqal_rebuild_202/aqal-platform}"
CURRENT_ROOT="${2:-$(pwd)}"
OUTPUT_FILE="${3:-validation/202_POST_INTEGRATION_MATRIX.tsv}"

source_list="$(mktemp)"
current_list="$(mktemp)"
all_list="$(mktemp)"
trap 'rm -f "$source_list" "$current_list" "$all_list"' EXIT

list_paths() {
  local root="$1"
  find "$root" -type f \
    ! -path '*/.*' \
    ! -path '*/node_modules/*' \
    ! -path '*/dist/*' \
    ! -path '*/coverage/*' \
    -printf '%P\n' | LC_ALL=C sort
}

list_paths "$SOURCE_ROOT" > "$source_list"
list_paths "$CURRENT_ROOT" > "$current_list"
cat "$source_list" "$current_list" | LC_ALL=C sort -u > "$all_list"

printf 'path\tdifference\tsha202\tshaCurrent\n' > "$OUTPUT_FILE"
while IFS= read -r path; do
  [[ -z "$path" ]] && continue
  source_file="$SOURCE_ROOT/$path"
  current_file="$CURRENT_ROOT/$path"
  if [[ -f "$source_file" && -f "$current_file" ]]; then
    source_sha="$(sha256sum "$source_file" | awk '{print $1}')"
    current_sha="$(sha256sum "$current_file" | awk '{print $1}')"
    if [[ "$source_sha" == "$current_sha" ]]; then
      difference="identical"
    else
      difference="changed"
    fi
  elif [[ -f "$source_file" ]]; then
    source_sha="$(sha256sum "$source_file" | awk '{print $1}')"
    current_sha="-"
    difference="added_in_202"
  else
    source_sha="-"
    current_sha="$(sha256sum "$current_file" | awk '{print $1}')"
    difference="missing_from_202"
  fi
  printf '%s\t%s\t%s\t%s\n' "$path" "$difference" "$source_sha" "$current_sha" >> "$OUTPUT_FILE"
done < "$all_list"

printf 'matrix=%s\nentries=%s\n' "$OUTPUT_FILE" "$(( $(wc -l < "$OUTPUT_FILE") - 1 ))"
cut -f2 "$OUTPUT_FILE" | tail -n +2 | LC_ALL=C sort | uniq -c

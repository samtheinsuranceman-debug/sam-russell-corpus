#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_101="${SOURCE_101:-/home/ubuntu/aqal_rebuild_101/aqal-platform}"
SOURCE_202="${SOURCE_202:-/home/ubuntu/aqal_rebuild_202/aqal-platform}"
SOURCE_203="${SOURCE_203:-/home/ubuntu/aqal_rebuild_203/aqal-platform}"
SOURCE_500="${SOURCE_500:-/home/ubuntu/aqal_rebuild_500/aqal-platform}"
OUT_DIR="${OUT_DIR:-$PROJECT_ROOT/validation}"

hash_tree() {
  local root="$1"
  local output="$2"
  (
    cd "$root"
    find . -type f \
      ! -path './.git/*' \
      ! -path './node_modules/*' \
      ! -path './dist/*' \
      ! -path './coverage/*' \
      ! -path './.manus-logs/*' \
      ! -name '.env' \
      ! -name '.env.*' \
      ! -name '.DS_Store' \
      ! -name '*.log' \
      -print0 \
      | sort -z \
      | xargs -0 -r sha256sum \
      | sed 's#  \./#\t#'
  ) > "$output"
}

build_matrix() {
  local left_name="$1"
  local left_manifest="$2"
  local right_name="$3"
  local right_manifest="$4"
  local output="$5"

  printf 'path\tstatus\tsha_%s\tsha_%s\n' "$left_name" "$right_name" > "$output"
  awk -F '\t' -v OFS='\t' \
    -v left="$left_name" -v right="$right_name" '
      NR == FNR { leftSha[$2] = $1; paths[$2] = 1; next }
      { rightSha[$2] = $1; paths[$2] = 1 }
      END {
        for (path in paths) {
          l = leftSha[path]; r = rightSha[path]
          if (l != "" && r != "") status = (l == r ? "identical" : "changed")
          else if (l != "") status = "only_in_" left
          else status = "only_in_" right
          print path, status, l, r
        }
      }
    ' "$left_manifest" "$right_manifest" | sort -t $'\t' -k1,1 >> "$output"
}

mkdir -p "$OUT_DIR"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

hash_tree "$SOURCE_101" "$tmp/101.tsv"
hash_tree "$SOURCE_202" "$tmp/202.tsv"
hash_tree "$SOURCE_203" "$tmp/203.tsv"
hash_tree "$SOURCE_500" "$tmp/500.tsv"
hash_tree "$PROJECT_ROOT" "$tmp/current.tsv"

build_matrix 101 "$tmp/101.tsv" 500 "$tmp/500.tsv" "$OUT_DIR/500_VS_101_MATRIX.tsv"
build_matrix 202 "$tmp/202.tsv" 500 "$tmp/500.tsv" "$OUT_DIR/500_VS_202_MATRIX.tsv"
build_matrix 203 "$tmp/203.tsv" 500 "$tmp/500.tsv" "$OUT_DIR/500_VS_203_MATRIX.tsv"
build_matrix 500 "$tmp/500.tsv" current "$tmp/current.tsv" "$OUT_DIR/500_VS_CURRENT_MATRIX.tsv"

for matrix in \
  "$OUT_DIR/500_VS_101_MATRIX.tsv" \
  "$OUT_DIR/500_VS_202_MATRIX.tsv" \
  "$OUT_DIR/500_VS_203_MATRIX.tsv" \
  "$OUT_DIR/500_VS_CURRENT_MATRIX.tsv"
do
  echo "$(basename "$matrix")"
  tail -n +2 "$matrix" | cut -f2 | sort | uniq -c
done

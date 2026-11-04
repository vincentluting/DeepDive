#!/usr/bin/env bash
# ============================================================
# Convert /public/12 avatar/*.png → dist/avatars-webp/*.webp
#
# Why: 46MB of PNG avatars × thesis recruitment traffic would
# exhaust Vercel Hobby's 100GB/mo bandwidth ceiling within ~2k
# unique visits. WebP at quality 82 typically gets us 70-80%
# size reduction (~12MB total) and Cloudflare R2 absorbs egress.
#
# Output: dist/avatars-webp/<Name>-<gender>.webp
# Filenames match what archetype-avatar-asset.ts expects when
# NEXT_PUBLIC_AVATAR_CDN_BASE is set.
#
# Prerequisites: `cwebp` (install via `brew install webp` on
# macOS or `apt install webp` on Linux).
# ============================================================
set -euo pipefail

SRC_DIR="public/12 avatar"
OUT_DIR="dist/avatars-webp"
QUALITY="${WEBP_QUALITY:-82}"

if ! command -v cwebp >/dev/null 2>&1; then
  echo "ERROR: cwebp not installed. Install with:" >&2
  echo "  macOS: brew install webp" >&2
  echo "  Linux: sudo apt install webp" >&2
  exit 1
fi

if [ ! -d "$SRC_DIR" ]; then
  echo "ERROR: $SRC_DIR not found. Run from repo root." >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

src_total=0
out_total=0
count=0

for png in "$SRC_DIR"/*.png; do
  [ -f "$png" ] || continue
  filename=$(basename "$png" .png)
  out="$OUT_DIR/${filename}.webp"
  cwebp -q "$QUALITY" -quiet "$png" -o "$out"

  src_size=$(stat -f%z "$png" 2>/dev/null || stat -c%s "$png")
  out_size=$(stat -f%z "$out" 2>/dev/null || stat -c%s "$out")
  src_total=$((src_total + src_size))
  out_total=$((out_total + out_size))
  count=$((count + 1))

  pct=$(awk "BEGIN { printf \"%.0f\", 100 * $out_size / $src_size }")
  echo "  $filename: $(numfmt --to=iec --suffix=B $src_size 2>/dev/null || echo "${src_size}B") → $(numfmt --to=iec --suffix=B $out_size 2>/dev/null || echo "${out_size}B") (${pct}%)"
done

if [ "$count" -eq 0 ]; then
  echo "WARN: no PNGs found in $SRC_DIR" >&2
  exit 1
fi

total_pct=$(awk "BEGIN { printf \"%.0f\", 100 * $out_total / $src_total }")
echo ""
echo "Converted $count files."
echo "Total: $(numfmt --to=iec --suffix=B $src_total 2>/dev/null || echo "${src_total}B") → $(numfmt --to=iec --suffix=B $out_total 2>/dev/null || echo "${out_total}B") (${total_pct}% of original)"
echo ""
echo "Next: upload $OUT_DIR/*.webp to your Cloudflare R2 bucket."
echo "See docs/operations/avatar-cdn-setup.md for full steps."

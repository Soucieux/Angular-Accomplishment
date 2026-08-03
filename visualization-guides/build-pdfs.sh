#!/bin/bash
# Regenerate both notebook-guide PDFs from the HTML sources using local Chrome headless.
# The HTML files are fully self-contained (fonts + images embedded), so no network is needed.
#
#   ./build-pdfs.sh
#
set -euo pipefail

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

[ -x "$CHROME" ] || { echo "Chrome not found at: $CHROME"; exit 1; }

for lang in cn en; do
  src="$DIR/reminder-notebook-guide-$lang.html"
  out="$DIR/reminder-notebook-guide-$lang.pdf"
  echo "→ $lang"
  "$CHROME" --headless=new --disable-gpu --no-sandbox \
            --no-pdf-header-footer \
            --print-to-pdf="$out" \
            "file://$src" 2>/dev/null
  echo "  $(basename "$out")  $(du -h "$out" | cut -f1)"
done

echo "Done. Page size comes from the @page rule in the HTML (A4, zero margin)."

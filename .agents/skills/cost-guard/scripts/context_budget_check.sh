#!/usr/bin/env bash
# context_budget_check.sh
#
# Usage: ./context_budget_check.sh <file-path> [optional-grep-pattern]
#
# Before executing `read` on a large file, run this script.
# It checks line count and approximate token size, suggesting `grep`
# if thresholds are exceeded.

set -euo pipefail

LINE_THRESHOLD=300

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <file-path> [optional-grep-pattern]"
  exit 1
fi

FILE="$1"
PATTERN="${2:-}"

if [ ! -f "$FILE" ]; then
  echo "File not found: $FILE"
  exit 1
fi

LINES=$(wc -l < "$FILE" | tr -d ' ')
CHARS=$(wc -c < "$FILE" | tr -d ' ')
# Rough estimate: ~4 characters per token
APPROX_TOKENS=$((CHARS / 4))

echo "File: $FILE"
echo "Lines: $LINES"
echo "Approximate tokens: ~$APPROX_TOKENS"
echo

if [ "$LINES" -gt "$LINE_THRESHOLD" ]; then
  echo "This file exceeds the $LINE_THRESHOLD line threshold."
  echo "Before reading the entire file, attempt locating relevant sections using grep -n."
  if [ -n "$PATTERN" ]; then
    echo "Results for pattern '$PATTERN':"
    grep -n "$PATTERN" "$FILE" || echo "  (no matches found)"
  else
    echo "   Provide a pattern as a second argument to search immediately."
  fi
else
  echo "File within threshold ($LINE_THRESHOLD lines). Reading full file is reasonable if editing."
fi

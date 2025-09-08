#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "--yes" ]]; then
  echo "(placeholder) Would prune legacy artifacts here."
else
  echo "Add --yes to actually prune (placeholder script)." >&2
  exit 1
fi

#!/usr/bin/env bash
set -euo pipefail

REPO="LuganoPlanB/vite-theme"
ARCHIVE="lugano-planb-vite-theme.tar.gz"
DEST="src/"

if [ -n "${GITHUB_ACTIONS:-}" ]; then
  echo "[get-theme] downloading via gh: $REPO" >&2
  gh release download --repo "$REPO" --pattern "$ARCHIVE"
else
  URL="https://github.com/${REPO}/releases/latest/download/${ARCHIVE}"
  echo "[get-theme] downloading via curl: $URL" >&2
  curl -fSLO "$URL"
fi

echo "[get-theme] extracting to $DEST" >&2
tar -xzf "$ARCHIVE" -C "$DEST"
rm -f "$ARCHIVE"
echo "[get-theme] done" >&2

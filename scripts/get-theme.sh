#!/usr/bin/env bash
set -euo pipefail

REPO="LuganoPlanB/vite-theme"
ARCHIVE="lugano-planb-vite-theme.tar.gz"
DEST="src/"

if [ -n "${GITHUB_ACTIONS:-}" ]; then
  gh release download --repo "$REPO" --pattern "$ARCHIVE"
else
  curl -sSLO "https://github.com/${REPO}/releases/latest/download/${ARCHIVE}"
fi

tar -xzf "$ARCHIVE" -C "$DEST"
rm -f "$ARCHIVE"

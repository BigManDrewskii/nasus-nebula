#!/usr/bin/env bash
# build-sidecar.sh
# Builds nasus-sidecar binary and drops it into src-tauri/sidecar/
# with the correct Tauri target-triple suffix for the current machine.
#
# Usage:
#   chmod +x build-sidecar.sh
#   ./build-sidecar.sh
#
# Requirements:
#   pip install pyinstaller
#   All nasus_stack deps installed in active Python env

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_DIR="$REPO_ROOT/dist"
SIDECAR_DEST="$REPO_ROOT/src-tauri/sidecar"

# Detect Tauri target triple
OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
  Darwin)
    if [ "$ARCH" = "arm64" ]; then
      TRIPLE="aarch64-apple-darwin"
    else
      TRIPLE="x86_64-apple-darwin"
    fi
    BINARY_NAME="nasus-sidecar"
    ;;
  Linux)
    if [ "$ARCH" = "aarch64" ]; then
      TRIPLE="aarch64-unknown-linux-gnu"
    else
      TRIPLE="x86_64-unknown-linux-gnu"
    fi
    BINARY_NAME="nasus-sidecar"
    ;;
  MINGW*|MSYS*|CYGWIN*)
    TRIPLE="x86_64-pc-windows-msvc"
    BINARY_NAME="nasus-sidecar.exe"
    ;;
  *)
    echo "Unsupported OS: $OS"
    exit 1
    ;;
esac

echo "==> Building nasus-sidecar for $TRIPLE"
cd "$REPO_ROOT"
pyinstaller nasus_sidecar.spec --clean --distpath "$DIST_DIR"

echo "==> Copying binary to src-tauri/sidecar/"
mkdir -p "$SIDECAR_DEST"

SRC="$DIST_DIR/$BINARY_NAME"
DEST="$SIDECAR_DEST/nasus-sidecar-$TRIPLE"
if [[ "$OS" == MINGW* ]] || [[ "$OS" == MSYS* ]] || [[ "$OS" == CYGWIN* ]]; then
  DEST="${DEST}.exe"
fi

cp "$SRC" "$DEST"
chmod +x "$DEST"

echo "==> Done: $DEST"
echo "    Run 'cargo tauri build' to bundle the full app."

#!/usr/bin/env bash
set -euo pipefail

ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
AVD_NAME="${1:-Pixel_10}"
export ANDROID_HOME
export PATH="$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools"

if ! command -v emulator >/dev/null; then
  echo "Android emulator not found. Set ANDROID_HOME=$ANDROID_HOME"
  exit 1
fi

echo "Clearing stale emulator locks..."
adb kill-server >/dev/null 2>&1 || true
rm -f "$HOME/.android/avd/${AVD_NAME}.avd/"*.lock 2>/dev/null || true
rm -rf "$HOME/Library/Caches/TemporaryItems/avd/running/"* 2>/dev/null || true

echo "Starting $AVD_NAME (cold boot, software GPU)..."
echo "Leave this terminal open until the emulator home screen appears."
exec emulator -avd "$AVD_NAME" \
  -no-snapshot-load \
  -no-boot-anim \
  -gpu swiftshader_indirect \
  -memory 1536

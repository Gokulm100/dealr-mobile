#!/usr/bin/env bash
# Print the SHA-1 / SHA-256 fingerprints used by local Dealr Android builds.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KEYSTORE="${ROOT}/android/app/debug.keystore"

echo "Package: com.dealr.app"
echo "Firebase project: dealr-app-494db"
echo "Keystore: ${KEYSTORE}"
echo

keytool -list -v \
  -keystore "${KEYSTORE}" \
  -alias androiddebugkey \
  -storepass android \
  -keypass android \
  | awk '/SHA1:|SHA256:/{print}'

echo
echo "Add BOTH fingerprints in Firebase → Project settings → Android app (com.dealr.app)."
echo "Keep the Play App Signing SHA-1 as well so store builds keep working."

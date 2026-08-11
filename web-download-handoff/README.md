# Dealr web app download handoff

This agent could not push to `Gokulm100/dealr-web` (403). Apply these changes there, then deploy Vercel.

## Apply

```bash
cd dealr-web
git checkout -b cursor/web-app-download-5ce9
git apply /path/to/dealr-web-changes.diff
# OR cherry-pick files from this folder + copy the signed APK:
mkdir -p public/downloads
cp ../dealr-mobile/distribution/dealr-1.0.1.apk public/downloads/dealr.apk
git add -A && git commit -m "Add self-hosted Android app download page and CTAs"
git push -u origin HEAD
```

After deploy:
- https://dealrapp.in/app
- https://dealrapp.in/downloads/dealr.apk

## Signing keystore

Download from the cloud agent artifacts: `signing/dealr-upload.keystore` + `README-SIGNING.txt`.
Store privately. If Play already uses a different upload key (EAS), re-sign future public APKs with that key.

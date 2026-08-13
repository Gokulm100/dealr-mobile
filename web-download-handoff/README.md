# Publish Dealr 1.0.9 on dealrapp.in Get Android App

The Cloud Agent cannot push to `Gokulm100/dealr-web` (403). Apply this on that repo, then Vercel will serve the new APK.

## Apply

```bash
cd dealr-web
git checkout main && git pull
curl -L -o public/downloads/dealr.apk \
  "https://github.com/Gokulm100/dealr-mobile/raw/cursor/home-feature-carousel-5b33/distribution/dealr-1.0.9.apk"
git apply /path/to/dealr-mobile/web-download-handoff/app-1.0.9.patch
# or copy public/app.html from this folder over dealr-web/public/app.html
git add public/downloads/dealr.apk public/app.html
git commit -m "Ship Dealr 1.0.9 Android APK on Get the app page"
git push
```

Local copy of the APK (same file):

```bash
cp /path/to/dealr-mobile/distribution/dealr-1.0.9.apk public/downloads/dealr.apk
```

After deploy:
- https://dealrapp.in/app
- https://dealrapp.in/downloads/dealr.apk

The Get the Android app banner already links to `/app`, which downloads `/downloads/dealr.apk`.

## Install note

1.0.9 is debug-signed. The current site APK (1.0.1) is upload-signed, so Android will refuse an in-place update. The download page tells people to uninstall 1.0.1 first.

/**
 * Regenerates native splash screen assets from assets/splash.png.
 * Run: node scripts/update-splash.js
 */
const fs = require('fs');
const path = require('path');
const { generateImageAsync } = require('@expo/image-utils');
const { applySplashScreenStoryboard } = require('@expo/prebuild-config/build/plugins/unversioned/expo-splash-screen/withIosSplashScreenStoryboardImage');
const { getTemplateAsync } = require('@expo/prebuild-config/build/plugins/unversioned/expo-splash-screen/withIosSplashScreenStoryboard');
const { toString } = require('@expo/prebuild-config/build/plugins/unversioned/expo-splash-screen/InterfaceBuilder');
const { buildContentsJsonImages } = require('@expo/prebuild-config/build/plugins/unversioned/expo-splash-screen/withIosSplashAssets');
const { writeContentsJsonAsync } = require('@expo/prebuild-config/build/plugins/icons/AssetContents');

const projectRoot = path.join(__dirname, '..');
const splashImage = './assets/splash.png';
const splashConfig = {
  image: splashImage,
  resizeMode: 'cover',
  backgroundColor: '#378cf6',
  enableFullScreenImage_legacy: true,
};

const ANDROID_RES = path.join(projectRoot, 'android/app/src/main/res');
const IOS_ROOT = path.join(projectRoot, 'ios/e4you');
const LEGACY_IMAGESET = path.join(IOS_ROOT, 'Images.xcassets/SplashScreenLegacy.imageset');
const LOGO_IMAGESET = path.join(IOS_ROOT, 'Images.xcassets/SplashScreenLogo.imageset');

async function updateAndroidSplash() {
  const nodpiDir = path.join(ANDROID_RES, 'drawable-nodpi');
  await fs.promises.mkdir(nodpiDir, { recursive: true });

  const { source } = await generateImageAsync(
    { projectRoot, cacheType: 'splash-android-full' },
    { src: splashImage, resizeMode: 'cover' },
  );
  await fs.promises.writeFile(path.join(nodpiDir, 'splashscreen_logo.png'), source);

  const densityDirs = ['drawable-mdpi', 'drawable-hdpi', 'drawable-xhdpi', 'drawable-xxhdpi', 'drawable-xxxhdpi'];
  await Promise.all(
    densityDirs.map((dir) =>
      fs.promises.rm(path.join(ANDROID_RES, dir, 'splashscreen_logo.png'), { force: true }),
    ),
  );
}

async function updateIosSplash() {
  await fs.promises.rm(LOGO_IMAGESET, { force: true, recursive: true });
  await fs.promises.mkdir(LEGACY_IMAGESET, { recursive: true });

  const scales = [
    { suffix: '', scale: 1 },
    { suffix: '@2x', scale: 2 },
    { suffix: '@3x', scale: 3 },
  ];

  for (const { suffix, scale } of scales) {
    const { source } = await generateImageAsync(
      { projectRoot, cacheType: `splash-ios-${scale}x` },
      {
        src: splashImage,
        resizeMode: 'cover',
        width: Math.round(1284 * scale),
        height: Math.round(2778 * scale),
      },
    );
    await fs.promises.writeFile(path.join(LEGACY_IMAGESET, `image${suffix}.png`), source);
  }

  await writeContentsJsonAsync(LEGACY_IMAGESET, {
    images: buildContentsJsonImages({
      image: 'image',
      darkImage: null,
      tabletImage: null,
      darkTabletImage: null,
    }),
  });

  const storyboardPath = path.join(IOS_ROOT, 'SplashScreen.storyboard');
  const storyboardXml = await getTemplateAsync();
  const updated = applySplashScreenStoryboard(storyboardXml, splashConfig);
  await fs.promises.writeFile(storyboardPath, toString(updated));
}

async function main() {
  await updateAndroidSplash();
  await updateIosSplash();
  console.log('Splash screen updated for iOS and Android.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

/**
 * Regenerates iOS and Android launcher icons from Expo assets.
 * Run: node scripts/update-app-icons.js
 */
const path = require('path');
const { setIconAsync } = require('@expo/prebuild-config/build/plugins/icons/withAndroidIcons');
const { setIconsAsync } = require('@expo/prebuild-config/build/plugins/icons/withIosIcons');

const projectRoot = path.join(__dirname, '..');
const icon = './assets/icon.png';
const adaptiveIcon = './assets/adaptive-icon.png';
const backgroundColor = '#378cf6';

async function main() {
  await setIconAsync(projectRoot, {
    icon: adaptiveIcon,
    backgroundColor,
    isAdaptive: true,
  });

  await setIconsAsync({ icon }, projectRoot);
  console.log('App icons updated for iOS and Android.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

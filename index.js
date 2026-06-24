import { registerRootComponent } from 'expo';
import messaging from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';

import App from './App';
import { openFromNotification } from './src/utils/navigation';

// Background handler (required)
// Register this outside of any component, at the top level of index.js
messaging().setBackgroundMessageHandler(async remoteMessage => {
  // FCM auto-shows notification if `notification` key is present
  // Handle data-only messages here if needed
});

// Handle taps on Notifee notifications while the app is in the background/quit.
// openChatFromNotification retries until navigation is ready once the app resumes.
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    openFromNotification(detail.notification?.data);
  }
});

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

import { registerRootComponent } from 'expo';
import messaging from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';

import App from './App';
import { openFromNotification } from './src/utils/navigation';

// Background handlers must be registered at the top level, but they must not
// take down the entire app if Firebase/Notifee fail to initialize.
try {
  messaging().setBackgroundMessageHandler(async () => {
    // FCM auto-shows notification if `notification` key is present.
  });
} catch (error) {
  console.warn('Failed to register FCM background handler', error);
}

try {
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type === EventType.PRESS) {
      openFromNotification(detail.notification?.data);
    }
  });
} catch (error) {
  console.warn('Failed to register Notifee background handler', error);
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
registerRootComponent(App);

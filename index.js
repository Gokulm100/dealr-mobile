import { registerRootComponent } from 'expo';
import messaging from '@react-native-firebase/messaging';

import App from './App';

// Background handler (required)
// Register this outside of any component, at the top level of index.js
messaging().setBackgroundMessageHandler(async remoteMessage => {
  // FCM auto-shows notification if `notification` key is present
  // Handle data-only messages here if needed
});

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

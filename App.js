// App.js
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Alert } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { AuthProvider } from './src/context/AuthContext';
import { MessagesProvider } from './src/context/MessagesContext';
import AppNavigator from './src/navigation/AppNavigator';
import { navigationRef, openFromNotification } from './src/utils/navigation';
import { getStoredUser, getStoredToken } from './src/utils/api';
import { registerPushToken, requestNotificationPermission } from './src/utils/pushNotifications';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        await requestNotificationPermission();

        // Channel must exist before background FCM notifications can display on Android.
        await notifee.createChannel({
          id: 'default',
          name: 'Default Channel',
          importance: AndroidImportance.HIGH,
        });

        await registerPushToken();

        messaging().onTokenRefresh(async () => {
          const authToken = await getStoredToken();
          if (authToken) {
            await registerPushToken();
          }
        });
      } catch (error) {
        console.error('Error setting up notifications:', error);
      }
    };

    // Handle incoming messages and notification interactions
    const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {

      // 1. Skip if message is from the current user
      const currentUser = await getStoredUser();
      const senderId = remoteMessage.data?.senderId || remoteMessage.data?.from;

      if (currentUser && senderId === currentUser._id) {
        return;
      }

      // 2. SILENT RELOAD IF IN CHAT: Check if the user is already looking at this chat
      if (navigationRef.isReady()) {
        const route = navigationRef.getCurrentRoute();
        if (route?.name === 'ChatDetail' || route?.name === 'Chat') {
          const activeAdId = route.params?.chat?.adId || route.params?.chat?.ad?._id || route.params?.chat?._id;
          const incomingAdId = remoteMessage.data?.adId || remoteMessage.data?.ad_id;

          if (activeAdId?.toString() === incomingAdId?.toString()) {
            // We return early so NO notification popup is shown, as ChatScreen is handling the reload
            return;
          }
        }
      }

      // 3. Request permission (required for iOS/Android 13+)
      await notifee.requestPermission();

      // Create a channel (required for Android)
      const channelId = await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
      });

      // Display a notification (use the real sender/message when available)
      await notifee.displayNotification({
        title: remoteMessage.notification?.title || remoteMessage.data?.senderName || 'Dealr',
        body: remoteMessage.notification?.body || remoteMessage.data?.messageText || 'You have a new message!',
        data: remoteMessage.data, // Pass the data to Notifee
        android: {
          channelId,
          pressAction: {
            id: 'default',
          },
        },
      });
    });

    // Handle Notifee foreground events (clicks) — open the chat that was tapped.
    const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        openFromNotification(detail.notification?.data);
      }
    });

    // App in background → tapping the system notification brings it to foreground.
    messaging().onNotificationOpenedApp(remoteMessage => {
      openFromNotification(remoteMessage?.data);
    });

    // App launched from a quit state by tapping a notification.
    messaging().getInitialNotification().then(remoteMessage => {
      if (remoteMessage) {
        openFromNotification(remoteMessage.data);
      }
    });

    const prepare = async () => {
      try {
        // Wait for 3 seconds
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (e) {
        console.warn(e);
      } finally {
        // Hide splash screen
        await SplashScreen.hideAsync();
      }
    };

    setupNotifications();
    prepare();

    return () => {
      unsubscribeOnMessage();
      unsubscribeNotifee();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <MessagesProvider>
          <AppNavigator />
        </MessagesProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

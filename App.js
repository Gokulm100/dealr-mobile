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
import { navigationRef } from './src/utils/navigation';
import { updateFcmToken } from './src/utils/api';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        // Request permission
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          const token = await messaging().getToken();
          console.log('FCM Token:', token);

          // Send token to backend
          await updateFcmToken(token);

          messaging().onTokenRefresh(async newToken => {
            console.log('New FCM Token:', newToken);
            await updateFcmToken(newToken);
          });
        }
      } catch (error) {
        console.error('Error setting up notifications:', error);
      }
    };

    // Handle incoming messages and notification interactions
    const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
      console.log('Foreground notification:', remoteMessage);

      // Request permission (required for iOS/Android 13+)
      await notifee.requestPermission();

      // Create a channel (required for Android)
      const channelId = await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
      });

      // Display a notification
      await notifee.displayNotification({
        title: 'Dealr',
        body: 'You have a new message!',
        data: remoteMessage.data, // Pass the data to Notifee
        android: {
          channelId,
          pressAction: {
            id: 'default',
          },
        },
      });
    });

    // Handle Notifee foreground events (clicks)
    const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        console.log('User pressed notification', detail.notification);
        // Just opening the app
      }
    });

    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Background notification click:', remoteMessage);
      // Default behavior is to open the app
    });

    messaging().getInitialNotification().then(remoteMessage => {
      if (remoteMessage) {
        console.log('Quit state notification click:', remoteMessage);
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

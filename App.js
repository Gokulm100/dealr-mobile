// App.js
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Alert } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Sora_800ExtraBold } from '@expo-google-fonts/sora';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { AuthProvider } from './src/context/AuthContext';
import { MessagesProvider } from './src/context/MessagesContext';
import AppNavigator from './src/navigation/AppNavigator';
import BrandSplash from './src/components/BrandSplash';
import { navigationRef, openFromNotification } from './src/utils/navigation';
import { getStoredUser, getStoredToken } from './src/utils/api';
import { registerPushToken, requestNotificationPermission } from './src/utils/pushNotifications';

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);
  const [splashExiting, setSplashExiting] = useState(false);

  useEffect(() => {
    const setupNotifications = async () => {
      try {
        await requestNotificationPermission();

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

    const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
      const currentUser = await getStoredUser();
      const senderId = remoteMessage.data?.senderId || remoteMessage.data?.from;

      if (currentUser && senderId === currentUser._id) {
        return;
      }

      if (navigationRef.isReady()) {
        const route = navigationRef.getCurrentRoute();
        if (route?.name === 'ChatDetail' || route?.name === 'Chat') {
          const activeAdId = route.params?.chat?.adId || route.params?.chat?.ad?._id || route.params?.chat?._id;
          const incomingAdId = remoteMessage.data?.adId || remoteMessage.data?.ad_id;

          if (activeAdId?.toString() === incomingAdId?.toString()) {
            return;
          }
        }
      }

      await notifee.requestPermission();

      const channelId = await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
      });

      await notifee.displayNotification({
        title: remoteMessage.notification?.title || remoteMessage.data?.senderName || 'Dealr',
        body: remoteMessage.notification?.body || remoteMessage.data?.messageText || 'You have a new message!',
        data: remoteMessage.data,
        android: {
          channelId,
          pressAction: {
            id: 'default',
          },
        },
      });
    });

    const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        openFromNotification(detail.notification?.data);
      }
    });

    messaging().onNotificationOpenedApp(remoteMessage => {
      openFromNotification(remoteMessage?.data);
    });

    messaging().getInitialNotification().then(remoteMessage => {
      if (remoteMessage) {
        openFromNotification(remoteMessage.data);
      }
    });

    const prepare = async () => {
      try {
        await SplashScreen.hideAsync();
        await new Promise(resolve => setTimeout(resolve, 1600));
        setSplashExiting(true);
      } catch (e) {
        console.warn(e);
        setShowSplash(false);
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
      {showSplash && (
        <BrandSplash
          exiting={splashExiting}
          onExitComplete={() => setShowSplash(false)}
        />
      )}
    </SafeAreaProvider>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({ Sora_800ExtraBold });

  if (!fontsLoaded) {
    return null;
  }

  return <AppContent />;
}

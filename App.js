// App.js
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Sora_700Bold, Sora_800ExtraBold } from '@expo-google-fonts/sora';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { AuthProvider } from './src/context/AuthContext';
import { MessagesProvider } from './src/context/MessagesContext';
import AppNavigator from './src/navigation/AppNavigator';
import { navigationRef, openFromNotification } from './src/utils/navigation';
import { getStoredUser, getStoredToken } from './src/utils/api';
import { registerPushToken, requestNotificationPermission } from './src/utils/pushNotifications';
import SplashScreen from './src/components/SplashScreen';
import { FontReadyProvider } from './src/context/FontReadyContext';
import AppErrorBoundary from './src/components/AppErrorBoundary';
import { initAnalytics } from './src/utils/analytics';

require('./assets/handshake-mark.png');

const SPLASH_MIN_MS = 2500;

function AppContent() {
  useEffect(() => {
    // EXP-1: start the analytics client (anonymous visit + session).
    initAnalytics();

    let unsubscribeOnMessage = () => {};
    let unsubscribeNotifee = () => {};

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

    try {
      unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
        try {
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
        } catch (error) {
          console.warn('Failed to handle foreground FCM message', error);
        }
      });

      unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
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
      }).catch((error) => {
        console.warn('Failed to read initial notification', error);
      });
    } catch (error) {
      console.warn('Failed to wire notification listeners', error);
    }

    setupNotifications();

    return () => {
      unsubscribeOnMessage();
      unsubscribeNotifee();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <AppErrorBoundary>
        <AuthProvider>
          <MessagesProvider>
            <AppNavigator />
          </MessagesProvider>
        </AuthProvider>
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}

const FONT_WAIT_MAX_MS = 4000;

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Sora_700Bold,
    Sora_800ExtraBold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  const [splashElapsed, setSplashElapsed] = useState(false);
  const [fontWaitTimedOut, setFontWaitTimedOut] = useState(false);

  useEffect(() => {
    if (fontError) {
      console.warn('Custom fonts failed to load; continuing with system fonts', fontError);
    }
  }, [fontError]);

  useEffect(() => {
    const timer = setTimeout(() => setSplashElapsed(true), SPLASH_MIN_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Never block launch forever if expo-font hangs without resolving.
    const timer = setTimeout(() => setFontWaitTimedOut(true), FONT_WAIT_MAX_MS);
    return () => clearTimeout(timer);
  }, []);

  const fontsReady = !!fontsLoaded && !fontError;
  const canLeaveSplash = splashElapsed && (fontsReady || !!fontError || fontWaitTimedOut);

  if (!canLeaveSplash) {
    return <SplashScreen fontsReady={fontsReady} />;
  }

  return (
    <FontReadyProvider ready={fontsReady}>
      <AppContent />
    </FontReadyProvider>
  );
}

import messaging from '@react-native-firebase/messaging';
import { getStoredToken, updateFcmToken, clearFcmTokenOnBackend } from './api';

function isPermissionGranted(authStatus) {
  return (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED
    || authStatus === messaging.AuthorizationStatus.PROVISIONAL
  );
}

/**
 * Bind this device's FCM token to the currently logged-in user.
 */
export async function registerPushToken() {
  try {
    const authToken = await getStoredToken();
    if (!authToken) return;

    const authStatus = await messaging().requestPermission();
    if (!isPermissionGranted(authStatus)) {
      console.warn('Push notifications permission not granted');
      return;
    }

    const fcmToken = await messaging().getToken();
    if (!fcmToken) {
      console.warn('FCM token unavailable');
      return;
    }

    await updateFcmToken(fcmToken);
    console.log('FCM token registered with backend');
  } catch (error) {
    console.error('Failed to register push token:', error);
  }
}

/**
 * Unlink FCM token from the current user before logout / account switch.
 */
export async function unregisterPushToken() {
  try {
    const authToken = await getStoredToken();
    if (authToken) {
      await clearFcmTokenOnBackend();
    }
  } catch (error) {
    console.error('Failed to clear FCM token on backend:', error);
  }

  try {
    await messaging().deleteToken();
  } catch (error) {
    // deleteToken can fail if messaging was never initialized; safe to ignore
    console.warn('Could not delete local FCM token:', error?.message || error);
  }
}

export async function requestNotificationPermission() {
  return messaging().requestPermission();
}

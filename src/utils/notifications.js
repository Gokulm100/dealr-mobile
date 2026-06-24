import messaging from '@react-native-firebase/messaging';
import { registerPushToken } from './pushNotifications';
import { Alert, Linking, Platform } from 'react-native';

export async function checkAndPromptNotifications() {
  try {
    const authStatus = await messaging().hasPermission();

    // If already enabled, do nothing
    if (authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL) {
      return;
    }

    // If explicitly denied, we MUST go to settings
    if (authStatus === messaging.AuthorizationStatus.DENIED) {
      Alert.alert(
        'Notifications Disabled',
        'You have disabled notifications for Dealr. Please enable them in settings to receive message alerts.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() }
        ]
      );
      return;
    }

    // Otherwise (NOT_DETERMINED), ask nicely
    Alert.alert(
      'Enable Notifications',
      'Turn on notifications to get instant alerts when buyers message you about your ad.',
      [
        { text: 'Later', style: 'cancel' },
        {
          text: 'Enable',
          onPress: async () => {
            const newStatus = await messaging().requestPermission();
            if (newStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                newStatus === messaging.AuthorizationStatus.PROVISIONAL) {
              await registerPushToken();
            } else {
              // User denied the system prompt
              Alert.alert(
                'Notifications Required',
                'Message alerts require notification permissions. You can enable them later in settings.',
                [
                  { text: 'OK', style: 'cancel' },
                  { text: 'Settings', onPress: () => Linking.openSettings() }
                ]
              );
            }
          },
        },
      ]
    );
  } catch (error) {
    console.error('Error checking notification status:', error);
  }
}

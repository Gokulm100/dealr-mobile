import { createNavigationContainerRef } from '@react-navigation/native';
import { getAdById } from './api';
import { resolveNotificationDestination } from './notificationRoutes';

export const navigationRef = createNavigationContainerRef();

export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}

function navigateWhenReady(name, params) {
  let attempts = 0;
  const tryNavigate = () => {
    try {
      if (navigationRef.isReady()) {
        navigationRef.navigate(name, params);
      } else if (attempts < 20) {
        attempts += 1;
        setTimeout(tryNavigate, 250);
      }
    } catch (error) {
      console.warn('Failed to navigate from notification', error);
    }
  };
  tryNavigate();
}

// Opens the conversation referenced by a chat push notification's data payload.
// Retries briefly until the navigation container is mounted (handles taps that
// launch the app from a quit/background state).
export function openChatFromNotification(data) {
  if (!data || data.type !== 'CHAT' || !data.adId) return;

  const params = {
    chat: {
      adId: data.adId,
      buyerId: data.buyerId || null,
      sellerId: data.sellerId || null,
      adTitle: data.adTitle || '',
    },
    otherName: data.otherName || data.senderName || 'Chat',
    isSeller: data.isSeller === 'true' || data.isSeller === true,
  };

  let attempts = 0;
  const tryNavigate = () => {
    if (navigationRef.isReady()) {
      navigationRef.navigate('Chat', { screen: 'ChatDetail', params });
    } else if (attempts < 20) {
      attempts += 1;
      setTimeout(tryNavigate, 250);
    }
  };
  tryNavigate();
}

export function openReviewFromNotification(data) {
  if (!data || data.type !== 'REVIEW_PROMPT' || !data.adId) return;

  let attempts = 0;
  const tryNavigate = () => {
    if (navigationRef.isReady()) {
      navigationRef.navigate('MainTabs', {
        screen: 'Profile',
        params: {
          screen: 'ProfileMain',
          params: { openReviewAdId: String(data.adId) },
        },
      });
    } else if (attempts < 20) {
      attempts += 1;
      setTimeout(tryNavigate, 250);
    }
  };
  tryNavigate();
}

export function openFromNotification(data) {
  if (!data) return;
  if (data.type === 'REVIEW_PROMPT') {
    openReviewFromNotification(data);
    return;
  }
  if (data.type === 'CHAT') {
    openChatFromNotification(data);
    return;
  }
  openMappedNotification(data);
}

async function openMappedNotification(data) {
  try {
    const dest = await resolveNotificationDestination(data, { fetchAd: getAdById });
    if (!dest?.name) return;
    navigateWhenReady(dest.name, dest.params);
  } catch (error) {
    console.warn('Failed to open notification destination', error);
    navigateWhenReady('MainTabs', { screen: 'Home', params: { screen: 'AllAds' } });
  }
}

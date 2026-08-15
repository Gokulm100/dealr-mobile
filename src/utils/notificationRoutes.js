/**
 * Pure FCM data → destination mapper.
 * Routing is driven by data.type / data.screen, never notification title copy.
 * Type matches are case-sensitive so CHAT / REVIEW_PROMPT keep working.
 */

export const HOME_ROUTE = {
  name: 'MainTabs',
  params: { screen: 'Home', params: { screen: 'AllAds' } },
};

export const CHAT_INBOX_ROUTE = {
  name: 'MainTabs',
  params: {
    screen: 'Chat',
    params: { screen: 'MessagesList', params: { tab: 'Selling' } },
  },
};

export function adDetailRoute(listingOrAdId) {
  const listing = listingOrAdId && typeof listingOrAdId === 'object'
    ? listingOrAdId
    : { id: String(listingOrAdId) };
  return {
    name: 'MainTabs',
    params: {
      screen: 'Home',
      params: { screen: 'AdDetail', params: { listing } },
    },
  };
}

export function chatDetailRoute(data) {
  return {
    name: 'Chat',
    params: {
      screen: 'ChatDetail',
      params: {
        chat: {
          adId: data.adId,
          buyerId: data.buyerId || null,
          sellerId: data.sellerId || null,
          adTitle: data.adTitle || '',
        },
        otherName: data.otherName || data.senderName || 'Chat',
        isSeller: data.isSeller === 'true' || data.isSeller === true,
      },
    },
  };
}

export function reviewPromptRoute(adId) {
  return {
    name: 'MainTabs',
    params: {
      screen: 'Profile',
      params: {
        screen: 'ProfileMain',
        params: { openReviewAdId: String(adId) },
      },
    },
  };
}

function hasAdId(data) {
  return Boolean(data?.adId) && String(data.adId).trim() !== '';
}

/**
 * Map an FCM data payload to a navigation destination.
 * Returns null when existing CHAT / REVIEW_PROMPT handlers should no-op
 * (missing adId), matching prior behavior.
 */
export function mapNotificationToRoute(data) {
  if (!data || typeof data !== 'object') return HOME_ROUTE;

  switch (data.type) {
    case 'CHAT':
      return hasAdId(data) ? chatDetailRoute(data) : null;
    case 'REVIEW_PROMPT':
      return hasAdId(data) ? reviewPromptRoute(data.adId) : null;
    case 'REENGAGEMENT':
      if (data.screen === 'chat') return CHAT_INBOX_ROUTE;
      if (data.screen === 'ad' && hasAdId(data)) {
        return adDetailRoute(String(data.adId));
      }
      return HOME_ROUTE;
    default:
      return HOME_ROUTE;
  }
}

/**
 * Resolve a tap/cold-start payload to a concrete route.
 * screen=ad fetches the listing first; missing adId or a failed fetch → home.
 */
export async function resolveNotificationDestination(data, { fetchAd } = {}) {
  const route = mapNotificationToRoute(data);
  if (!route) return null;

  const isAdTarget = route.params?.screen === 'Home'
    && route.params?.params?.screen === 'AdDetail';
  const adId = route.params?.params?.params?.listing?.id;

  if (data?.type === 'REENGAGEMENT' && isAdTarget && adId) {
    if (typeof fetchAd !== 'function') return HOME_ROUTE;
    try {
      const listing = await fetchAd(adId);
      if (!listing) return HOME_ROUTE;
      return adDetailRoute(listing);
    } catch {
      return HOME_ROUTE;
    }
  }

  return route;
}

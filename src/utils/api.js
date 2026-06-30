// src/utils/api.js
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ CHANGE THIS to your backend URL
export const API_BASE_URL = 'https://e4u-backend.onrender.com';
export const WEB_URL = 'https://your-website.com'; // TODO: Update this to your frontend URL

/**
 * Fetch all favorite ads for the current user
 */
export async function getFavoriteAds() {
  try {
    return await apiFetch('/api/users/favorite-ads');
  } catch (error) {
    console.error('[API] Failed to fetch favorite ads:', error);
    throw error;
  }
}

/**
 * Add an ad to user's favorites
 * @param {string} adId
 */
export async function addAdToFavorite(adId) {
  try {
    return await apiFetch('/api/users/add-to-favorites', {
      method: 'POST',
      body: JSON.stringify({ adId }),
    });
  } catch (error) {
    console.error('[API] Failed to add favorite:', error);
    throw error;
  }
}

/**
 * Remove an ad from user's favorites
 * @param {string} adId
 */
export async function removeAdFromFavorite(adId) {
  try {
    return await apiFetch('/api/users/remove-from-favorites', {
      method: 'POST',
      body: JSON.stringify({ adId }),
    });
  } catch (error) {
    console.error('[API] Failed to remove favorite:', error);
    throw error;
  }
}

/**
 * Increment view count for an advertisement
 * @param {string} adId
 */
export async function incrementAdViews(adId) {
  try {
    return await apiFetch('/api/ads/incrementViews', {
      method: 'POST',
      body: JSON.stringify({ adId }),
    });
  } catch (error) {
    console.error('[API] Failed to increment ad views:', error);
  }
}

/**
 * Fetch the list of active report reasons
 */
export async function getReportReasons() {
  return apiFetch('/api/ads/reportReasons');
}

/**
 * Report an ad for a given reason
 * @param {string} adId
 * @param {string} reasonId
 */
export async function reportAd(adId, reasonId) {
  return apiFetch('/api/ads/reportAd', {
    method: 'POST',
    body: JSON.stringify({ adId, reasonId }),
  });
}

// Centralized fetch wrapper with debugging
export async function apiFetch(path, options = {}) {
  const token = await AsyncStorage.getItem('authToken');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = `${API_BASE_URL}${path}`;
  console.log(`[API] Fetching: ${url}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      console.warn(`[API] Response for ${path} was not JSON:`, text.substring(0, 100));
    }

    if (!response.ok) {
      const errorMessage = data?.message || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      console.error(`[API] Request timed out for ${url} (Render might be sleeping)`);
      throw new Error('Server is taking too long to respond. Please try again in a moment.');
    }
    console.error(`[API] Network error for ${url}:`, err);
    throw err;
  }
}

// Auth helpers
export async function getStoredUser() {
  const raw = await AsyncStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

export async function getStoredToken() {
  return AsyncStorage.getItem('authToken');
}

export async function saveAuth(token, user) {
  await AsyncStorage.setItem('authToken', token);
  await AsyncStorage.setItem('user', JSON.stringify(user));
}

export async function clearAuth() {
  await AsyncStorage.removeItem('authToken');
  await AsyncStorage.removeItem('user');
}

// FCM token — associate device with logged-in user
export async function updateFcmToken(fcmToken) {
  try {
    return await apiFetch('/api/users/save-fcm-token', {
      method: 'POST',
      body: JSON.stringify({ fcmToken }),
    });
  } catch (error) {
    console.error('Failed to update FCM token on backend:', error);
  }
}

/** Remove FCM token from current user (call before logout). */
export async function clearFcmTokenOnBackend() {
  return apiFetch('/api/users/save-fcm-token', {
    method: 'POST',
    body: JSON.stringify({ fcmToken: null }),
  });
}

// Consent APIs
export async function getLatestConsentVersion() {
  return apiFetch('/api/users/getLatestConsentVersion');
}

export async function saveUserConsent(version) {
  return apiFetch('/api/users/acceptConsent', {
    method: 'POST',
    body: JSON.stringify({ version, status: 'accepted', timestamp: new Date().toISOString() }),
  });
}

export async function revokeUserConsent(version) {
  return apiFetch('/api/users/revokeConsent', {
    method: 'POST',
    body: JSON.stringify({ version, status: 'revoked', timestamp: new Date().toISOString() }),
  });

}

// Format relative time (same as web app)
export function formatPostedTime(createdAt) {
  if (!createdAt) return 'Unknown';
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now - created;
  const diffMin = Math.floor(diffMs / 1000 / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'moments ago';
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
  return created.toLocaleDateString();
}

// Map raw API listing to app format
export function mapListing(listing) {
  // Handle case where category/subCategory might be just a string name or an object
  const catName = typeof listing.category === 'object' ? listing.category?.name : (typeof listing.category === 'string' ? listing.category : null);
  const subCatName = typeof listing.subCategory === 'object' ? listing.subCategory?.name : (typeof listing.subCategory === 'string' ? listing.subCategory : null);

  return {
    id: listing._id,
    title: listing.title,
    price: listing.price,
    location: listing.location,
    category: catName || 'Uncategorized',
    categoryId: listing?.category?._id || null,
    description: listing.description,
    seller: listing.seller ? listing.seller.name : 'Unknown',
    sellerId: listing.seller ? listing.seller._id : null,
    sellerPic: listing.seller?.profilePic || null,
    views: listing.views || 0,
    subCategory: subCatName || 'General',
    reports: listing.reportCounter || 0,
    posted: formatPostedTime(listing.createdAt),
    createdAt: listing.createdAt,
    sellerSince: listing.seller?.createdAt ? new Date(listing.seller.createdAt).getFullYear() : null,
    sellerRatingAvg: listing.seller?.ratingAvg || 0,
    sellerReviewCount: listing.seller?.reviewCount || 0,
    sellerCompletedSales: listing.seller?.completedSales || 0,
    sellerTrustScore: listing.seller?.trustScore ?? 50,
    sellerBadges: listing.seller?.badges || [],
    disabled: listing.disabled || false,
    status: listing.status || 'active',
    isSold: listing.isSold || false,
    sellerPhone: listing.seller?.phone || listing.phone || null,
    images:
      Array.isArray(listing.images) && listing.images.length > 0
        ? listing.images.map(img => {
            if (typeof img !== 'string') return null;
            return img.startsWith('http') ? img : `${API_BASE_URL}/${img.startsWith('/') ? img.substring(1) : img}`;
          }).filter(Boolean)
        : ['https://images.pexels.com/photos/10703759/pexels-photo-10703759.jpeg','https://images.pexels.com/photos/7643961/pexels-photo-7643961.jpeg'],
  };
}

export function isAdOwnedByUser(ad, user) {
  if (!ad || !user?._id) return false;
  const userId = String(user._id);
  const sellerId = ad.sellerId
    || (typeof ad.seller === 'object' ? ad.seller?._id : null)
    || ad.seller;
  return sellerId != null && String(sellerId) === userId;
}

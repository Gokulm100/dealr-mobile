// src/utils/api.js
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ CHANGE THIS to your backend URL
export const API_BASE_URL = 'https://e4u-backend.onrender.com';

// Centralized fetch wrapper
export async function apiFetch(path, options = {}) {
  const token = await AsyncStorage.getItem('authToken');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
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
    posted: formatPostedTime(listing.createdAt),
    disabled: listing.disabled || false,
    status: listing.status || 'active',
    images:
      Array.isArray(listing.images) && listing.images.length > 0
        ? ['https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=400&h=300&fit=crop','https://images.pexels.com/photos/7643961/pexels-photo-7643961.jpeg']
        : ['https://images.pexels.com/photos/10703759/pexels-photo-10703759.jpeg','https://images.pexels.com/photos/7643961/pexels-photo-7643961.jpeg'],
  };
}

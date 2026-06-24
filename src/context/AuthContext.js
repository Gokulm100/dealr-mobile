// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStoredUser, getStoredToken, saveAuth, clearAuth, API_BASE_URL, mapListing } from '../utils/api';
import { registerPushToken, unregisterPushToken } from '../utils/pushNotifications';
import { initSocket, disconnectSocket } from '../utils/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [hasConsented, setHasConsented] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const storedUser = await getStoredUser();
      const storedToken = await getStoredToken();
      if (storedUser && storedToken) {
        setUser(storedUser);
        setToken(storedToken);
        setHasConsented(storedUser.hasConsented || false);
        registerPushToken();
        initSocket(storedUser._id, storedToken);
      }
      setLoading(false);
    })();
  }, []);

  const loginWithGoogle = async (idToken) => {
    const response = await fetch(`${API_BASE_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: idToken }),
    });
    let data = {};
    try {
      data = await response.json();
    } catch {
      // non-JSON error body
    }
    if (response.ok && data.token && data.user) {
      // Check for consent status using multiple possible field names
      // Specifically checking 'hasConsented' as mentioned in requirements
      const userHasConsented = !!(data.user.hasConsented || data.user.isConsented || data.user.consentAccepted);

      // Normalizing the user object to always have hasConsented property
      const normalizedUser = { ...data.user, hasConsented: userHasConsented };

      // Sync lastViewedAds to local recently_viewed_ads if they exist
      if (data.user.lastViewedAds && Array.isArray(data.user.lastViewedAds)) {
        try {
          const mappedAds = data.user.lastViewedAds.map(mapListing);
          await AsyncStorage.setItem('recently_viewed_ads', JSON.stringify(mappedAds));
        } catch (e) {
          console.error('Error syncing lastViewedAds from login:', e);
        }
      }

      // Sync favorites from backend if they exist
      if (data.user.favorites && Array.isArray(data.user.favorites)) {
        try {
          // data.user.favorites might be IDs or full objects depending on backend population
          const favoriteIds = data.user.favorites.map(f => typeof f === 'object' ? f._id : f);
          await AsyncStorage.setItem('favorites', JSON.stringify(favoriteIds));
        } catch (e) {
          console.error('Error syncing favorites from login:', e);
        }
      }

      await saveAuth(data.token, normalizedUser);
      setToken(data.token);
      setUser(normalizedUser);
      setHasConsented(userHasConsented);
      await registerPushToken();
      initSocket(normalizedUser._id, data.token);
      return data;
    }
    throw new Error(data.message || 'Login failed');
  };

  const logout = async () => {
    await unregisterPushToken();
    disconnectSocket();
    await clearAuth();
    setUser(null);
    setToken(null);
    setHasConsented(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, hasConsented, setHasConsented, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// src/context/MessagesContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';
import { apiFetch } from '../utils/api';
import { useAuth } from './AuthContext';

const MessagesContext = createContext({ messageCount: 0, refresh: () => {} });

export function MessagesProvider({ children }) {
  const [messageCount, setMessageCount] = useState(0);
  const { user, token } = useAuth();

  const refresh = useCallback(async () => {
    if (!user?._id || !token) return;
    try {
      const [buyingData, sellingData] = await Promise.all([
        apiFetch('/api/ads/getBuyingMessages', {
          method: 'POST',
          body: JSON.stringify({ buyerId: user._id }),
        }).catch(() => []),
        apiFetch('/api/ads/getSellingMessages', {
          method: 'POST',
          body: JSON.stringify({ sellerId: user._id }),
        }).catch(() => []),
      ]);

      const buyingCount = Array.isArray(buyingData) ? buyingData.length : 0;
      const sellingCount = Array.isArray(sellingData) ? sellingData.length : 0;
      setMessageCount(buyingCount + sellingCount);
    } catch {
      setMessageCount(0);
    }
  }, [user, token]);

  return (
    <MessagesContext.Provider value={{ messageCount, refresh }}>
      {children}
    </MessagesContext.Provider>
  );
}

export function useMessages() {
  return useContext(MessagesContext);
}

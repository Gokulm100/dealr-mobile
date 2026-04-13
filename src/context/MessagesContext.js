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
      const data = await apiFetch('/api/ads/getUserMessages', {
        method: 'POST',
        body: JSON.stringify({ userId: user._id }),
      });
      setMessageCount(Array.isArray(data) ? data.length : data.count || 0);
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

// src/context/MessagesContext.js
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { useAuth } from './AuthContext';

const MessagesContext = createContext({ messageCount: 0, refresh: () => {} });

export function MessagesProvider({ children }) {
  const [messageCount, setMessageCount] = useState(0);
  const { user, token } = useAuth();

  const refresh = useCallback(async () => {
    if (!user?._id || !token) {
      setMessageCount(0);
      return;
    }
    try {
      const res = await apiFetch('/api/ads/getUserMessages', {
        method: 'POST',
        body: JSON.stringify({ userId: user._id }),
      });
      if (res.success && typeof res.count === 'number') {
        setMessageCount(res.count);
      } else {
        // Fallback or legacy logic if getUserMessages fails
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

        const getUnreadCount = (data) => {
          const chats = Array.isArray(data) ? data : (data?.filteredMessages || []);
          return chats.filter(chat => {
            const lastMsgFrom = chat.lastMessage?.from?._id || chat.lastMessage?.from || chat.lastMessageFrom;
            const isMe = lastMsgFrom && user?._id && String(lastMsgFrom) === String(user._id);
            return chat.isSeen === false && !isMe;
          }).length;
        };

        setMessageCount(getUnreadCount(buyingData) + getUnreadCount(sellingData));
      }
    } catch (err) {
      console.log('Error refreshing message count:', err);
      setMessageCount(0);
    }
  }, [user, token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <MessagesContext.Provider value={{ messageCount, refresh }}>
      {children}
    </MessagesContext.Provider>
  );
}

export function useMessages() {
  return useContext(MessagesContext);
}

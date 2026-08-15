// src/screens/MessagesScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, RefreshControl, Platform,
} from 'react-native';
import Icon from '../components/Icon';
import ScreenHeader from '../components/ScreenHeader';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';
import { apiFetch, formatPostedTime } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useMessages } from '../context/MessagesContext';
import SkeletonCard from '../components/SkeletonCard';

const TABS = ['Buying', 'Selling'];

export default function MessagesScreen({ navigation, route }) {
  const { user } = useAuth();
  const { refresh } = useMessages();
  const requestedTab = route?.params?.tab;
  const [activeTab, setActiveTab] = useState(requestedTab === 'Selling' ? 1 : 0); // 0 = Buying, 1 = Selling
  const [buyingChats, setBuyingChats] = useState([]);
  const [sellingChats, setSellingChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchChats = useCallback(async () => {
    if (!user?._id) return;
    setLoading(true);
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
      setBuyingChats(Array.isArray(buyingData) ? buyingData : buyingData?.filteredMessages || []);
      setSellingChats(Array.isArray(sellingData) ? sellingData : sellingData?.filteredMessages || []);
      refresh();
    } catch {
      setBuyingChats([]);
      setSellingChats([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, refresh]);

  useEffect(() => { fetchChats(); }, [fetchChats]);

  useEffect(() => {
    if (requestedTab === 'Selling') setActiveTab(1);
    if (requestedTab === 'Buying') setActiveTab(0);
  }, [requestedTab]);

  useFocusEffect(
    useCallback(() => {
      fetchChats();
    }, [fetchChats])
  );

  if (!user) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Messages" />
        <View style={styles.center}>
          <Icon name="message-circle" size={48} color={COLORS.border} />
          <Text style={styles.emptyTitle}>Not logged in</Text>
          <Text style={styles.emptySubText}>Login to view your messages.</Text>
        </View>
      </View>
    );
  }

  const currentChats = activeTab === 0 ? buyingChats : sellingChats;

  const getChatKey = (item, idx) => {
    const id = item._id || item.chatId;
    if (id) return String(id);
    const adId = item.adId?._id || item.adId || item.ad?._id || '';
    const buyerId = item.buyerId || item.buyer?._id || '';
    const sellerId = item.sellerId || item.seller?._id || '';
    return `${adId}-${buyerId}-${sellerId}-${idx}`;
  };

  const renderItem = ({ item, index }) => {
    const isBuying = activeTab === 0;
    const otherName = isBuying
      ? (item.sellerName || item.seller?.name || 'Seller')
      : (item.buyerName || item.buyer?.name || 'Buyer');

    const otherPic = isBuying
      ? (item.sellerPic || item.seller?.profilePic || null)
      : (item.buyerPic || item.buyer?.profilePic || null);

    const truncate = (str, len) => {
      if (!str) return '';
      return str.length > len ? str.substring(0, len) + '...' : str;
    };

    const shortTime = (timeStr) => {
      if (!timeStr) return '';
      return timeStr
        .replace(' minute ago', 'm').replace(' minutes ago', 'm')
        .replace(' hour ago', 'h').replace(' hours ago', 'h')
        .replace(' day ago', 'd').replace(' days ago', 'd')
        .replace('moments ago', 'now');
    };

    const lastMsg = typeof item.lastMessage === 'string'
      ? item.lastMessage
      : (item.lastMessage?.message || (Array.isArray(item.messages) && item.messages.length > 0
        ? item.messages[item.messages.length - 1]?.message
        : ''));

    const adTitle = item.item || item.adTitle || item.adId?.title || item.ad?.title || item.adName || '';

    const lastMsgTime = item.time
      || item.updatedAt
      || item.createdAt
      || (Array.isArray(item.messages) && item.messages.length > 0 ? item.messages[item.messages.length - 1]?.createdAt : null);

    const formattedTime = lastMsgTime ? lastMsgTime: '';

    const getInitials = (name) => {
      if (!name || name === 'Seller' || name === 'Buyer') return '??';
      const parts = name.trim().split(/\s+/);
      if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const buyerId = item.buyerId || item.buyer?._id || (isBuying ? user._id : null);
    const sellerId = item.sellerId || item.seller?._id || (!isBuying ? user._id : null);
    const adId = item.adId || item.ad?._id || item._id;

    const lastMsgFrom = item.lastMessage?.from?._id || item.lastMessage?.from || item.lastMessageFrom;
    const isMe = lastMsgFrom && user?._id && String(lastMsgFrom) === String(user._id);
    const isUnread = item.isSeen === false && !isMe;

    const isLast = index === currentChats.length - 1;

    return (
      <TouchableOpacity
        style={[
          styles.chatRow,
          isUnread && styles.chatRowUnread,
          !isLast && styles.chatRowBorder,
        ]}
        onPress={() => navigation.navigate('ChatDetail', {
          chat: { ...item, adId, buyerId, sellerId, adTitle },
          otherName,
          isSeller: !isBuying,
        })}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          {otherPic ? (
            <Image source={{ uri: otherPic }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.initialsAvatar]}>
              <Text style={styles.initialsText}>{getInitials(otherName)}</Text>
            </View>
          )}
          {isUnread && <View style={styles.unreadDot} />}
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={[styles.chatName, isUnread && styles.chatNameUnread]} numberOfLines={1}>
              {otherName}
            </Text>
            <Text style={styles.chatTime}>{formattedTime}</Text>
          </View>

          <Text style={styles.chatAdTitle} numberOfLines={1}>
            {truncate(adTitle, 30)}
          </Text>

          <Text style={[styles.chatPreview, isUnread && styles.chatPreviewUnread]} numberOfLines={1}>
            {isMe && <Text style={styles.meLabel}>You: </Text>}
            {truncate(lastMsg || 'Sent an attachment', 40)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

    const getUnreadCount = (chats) => {
      return chats.filter(chat => {
        const lastMsgFrom = chat.lastMessage?.from?._id || chat.lastMessage?.from || chat.lastMessageFrom;
        const isMe = lastMsgFrom && user?._id && String(lastMsgFrom) === String(user._id);
        return chat.isSeen === false && !isMe;
      }).length;
    };

    const buyingCount = getUnreadCount(buyingChats);
    const sellingCount = getUnreadCount(sellingChats);

    return (
      <View style={styles.container}>
        <ScreenHeader title="Messages" />

        <View style={styles.tabContainer}>
          <View style={styles.tabBar}>
            {TABS.map((tab, idx) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === idx && styles.tabActive]}
                onPress={() => {
                  setActiveTab(idx);
                  setRefreshing(true);
                  fetchChats();
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, activeTab === idx && styles.tabTextActive]}>
                  {tab}
                </Text>
                {idx === 0 && buyingCount > 0 && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>{buyingCount}</Text>
                  </View>
                )}
                {idx === 1 && sellingCount > 0 && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>{sellingCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

      {loading && currentChats.length === 0 ? (
        <View>
          {Array.from({ length: 7 }).map((_, idx) => (
            <SkeletonCard key={`skeleton-${idx}`} chat />
          ))}
        </View>
      ) : (
        <FlatList
          data={currentChats}
          keyExtractor={getChatKey}
          renderItem={renderItem}
          extraData={activeTab}
          contentContainerStyle={[
            styles.list,
            currentChats.length === 0 && styles.listEmpty,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchChats(); }}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <View style={styles.emptyIconCircle}>
                <Icon name="message-circle" size={40} color={COLORS.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>
                {activeTab === 0 ? 'No conversations yet' : 'No inquiries yet'}
              </Text>
              <Text style={styles.emptySubText}>
                {activeTab === 0
                  ? 'Your interest in items will appear here.'
                  : 'Messages from interested buyers will show up here.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },

  tabContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#f1f3f5',
    borderRadius: RADIUS.xl,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderRadius: RADIUS.xl,
  },
  tabActive: {
    backgroundColor: COLORS.white,
    ...SHADOW.small,
  },
  tabText: { fontSize: 15, fontWeight: '600', color: COLORS.textMuted },
  tabTextActive: { color: COLORS.primary },
  tabBadge: {
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: '800' },

  list: { flexGrow: 1 },
  listEmpty: { justifyContent: 'center' },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: COLORS.white,
  },
  chatRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.12)',
  },
  chatRowUnread: {
    backgroundColor: '#f8faff',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  initialsAvatar: {
    backgroundColor: '#f0f4f8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e1e8f0',
  },
  initialsText: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: '700',
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  chatInfo: { flex: 1, justifyContent: 'center' },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: { fontSize: 17, fontWeight: '600', color: COLORS.text },
  chatNameUnread: { fontWeight: '800' },
  chatTime: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
  chatAdTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  chatPreview: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  chatPreviewUnread: {
    color: COLORS.text,
    fontWeight: '600',
  },
  meLabel: { color: COLORS.textMuted, fontWeight: '500' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  emptySubText: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },
});

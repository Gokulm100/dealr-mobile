// src/screens/MessagesScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, RefreshControl,
} from 'react-native';
import Icon from '../components/Icon';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';
import { apiFetch, formatPostedTime } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useMessages } from '../context/MessagesContext';

const TABS = ['Buying', 'Selling'];

export default function MessagesScreen({ navigation }) {
  const { user } = useAuth();
  const { refresh } = useMessages();
  const [activeTab, setActiveTab] = useState(0); // 0 = Buying, 1 = Selling
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

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        <View style={styles.center}>
          <Icon name="message-circle" size={48} color={COLORS.border} />
          <Text style={styles.emptyTitle}>Not logged in</Text>
          <Text style={styles.emptySubText}>Login to view your messages.</Text>
        </View>
      </View>
    );
  }

  const currentChats = activeTab === 0 ? buyingChats : sellingChats;

  const renderItem = ({ item }) => {
    const isBuying = activeTab === 0;
    const otherName = isBuying
      ? (item.sellerName || item.seller?.name || 'Seller')
      : (item.buyerName || item.buyer?.name || 'Buyer');

    // Correctly identify the other person's pic
    const otherPic = isBuying
      ? (item.sellerPic || item.seller?.profilePic || null)
      : (item.buyerPic || item.buyer?.profilePic || null);

    const lastMsg = typeof item.lastMessage === 'string'
      ? item.lastMessage
      : (item.lastMessage?.message || (Array.isArray(item.messages) && item.messages.length > 0
        ? item.messages[item.messages.length - 1]?.message
        : ''));

    const adTitle = item.item || item.adTitle || item.adId?.title || item.ad?.title || item.adName || '';

    // Robust Time detection
    const lastMsgTime = item.lastMessage?.createdAt
      || item.updatedAt
      || item.createdAt
      || (Array.isArray(item.messages) && item.messages.length > 0 ? item.messages[item.messages.length - 1]?.createdAt : null);

    const formattedTime = lastMsgTime ? formatPostedTime(lastMsgTime) : '';

    const getInitials = (name) => {
      if (!name || name === 'Seller' || name === 'Buyer') return '??';
      const parts = name.trim().split(/\s+/);
      if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const buyerId = item.buyerId || item.buyer?._id || (isBuying ? user._id : null);
    const sellerId = item.sellerId || item.seller?._id || (!isBuying ? user._id : null);
    const adId = item.adId || item.ad?._id || item._id;

    return (
      <TouchableOpacity
        style={styles.chatRow}
        onPress={() => navigation.navigate('Chat', {
          chat: { ...item, adId, buyerId, sellerId, adTitle },
          otherName,
          isSeller: !isBuying,
        })}
        activeOpacity={0.8}
      >
        <View style={styles.avatarWrapper}>
          {otherPic ? (
            <Image source={{ uri: otherPic }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.initialsAvatar]}>
              <Text style={styles.initialsText}>{getInitials(otherName)}</Text>
            </View>
          )}
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatTop}>
            <Text style={styles.chatName} numberOfLines={1}>{otherName}</Text>
            {formattedTime ? <Text style={styles.chatTime}>{formattedTime}</Text> : null}
          </View>

          <View style={styles.chatMid}>
            {adTitle ? (
              <Text style={styles.chatAd} numberOfLines={1}>
                {adTitle}
              </Text>
            ) : null}
            {item.isSeen === false  && (
              <View style={styles.badge} />
            )}
          </View>

          <Text style={styles.chatLast} numberOfLines={1}>
            {lastMsg || 'Tap to open chat'}
          </Text>
        </View>
        <Icon name="chevron-right" size={16} color={COLORS.border} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      <View style={styles.tabBar}>
        {TABS.map((tab, idx) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === idx && styles.tabActive]}
            onPress={() => {setActiveTab(idx)
            setRefreshing(true);
            fetchChats();

            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === idx && styles.tabTextActive]}>
              {tab}
            </Text>
            {idx === 0 && buyingChats.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{buyingChats.length}</Text>
              </View>
            )}
            {idx === 1 && sellingChats.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{sellingChats.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {loading && currentChats.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={currentChats}
          keyExtractor={(item, idx) => item._id || String(idx)}
          renderItem={renderItem}
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
              <Icon name="message-circle" size={48} color={COLORS.border} />
              <Text style={styles.emptyTitle}>
                {activeTab === 0 ? 'No buying messages' : 'No selling messages'}
              </Text>
              <Text style={styles.emptySubText}>
                {activeTab === 0
                  ? 'Tap "Chat with Seller" on any ad to start a conversation.'
                  : 'Messages from buyers will appear here.'}
              </Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 48,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  headerTitle: { color: COLORS.white, fontSize: 20, fontWeight: '800' },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: COLORS.accent },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted },
  tabTextActive: { color: COLORS.accent },
  tabBadge: {
    backgroundColor: COLORS.badgeBg,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },

  list: { paddingVertical: 8 },
  listEmpty: { flex: 1 },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarWrapper: { width: 48, height: 48 },
  initialsAvatar: {
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  avatarFallback: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  chatInfo: { flex: 1 },
  chatTop: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 2,
  },
  chatName: { fontSize: 15, fontWeight: '700', color: COLORS.text, flex: 1 },
  chatTime: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },
  chatMid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: 5,
    width: 10,
    height: 10,
    marginLeft: 6,
  },
  badgeText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },
  chatAd: { fontSize: 12, fontWeight: '700', color: COLORS.primary, marginBottom: 1, flex: 1 },
  chatLast: { fontSize: 13, color: COLORS.textMuted },
  separator: { height: 1, backgroundColor: COLORS.border, marginLeft: 76 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textMuted },
  emptySubText: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center' },
});

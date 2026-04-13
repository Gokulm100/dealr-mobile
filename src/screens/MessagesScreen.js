// src/screens/MessagesScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, RefreshControl,
} from 'react-native';
import Icon from '../components/Icon';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useMessages } from '../context/MessagesContext';

export default function MessagesScreen({ navigation }) {
  const { user } = useAuth();
  const { refresh } = useMessages();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchChats = useCallback(async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const data = await apiFetch('/api/ads/getUserMessages', {
        method: 'POST',
        body: JSON.stringify({ userId: user._id }),
      });
      setChats(Array.isArray(data) ? data : []);
      refresh();
    } catch {
      setChats([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, refresh]);

  useEffect(() => { fetchChats(); }, [fetchChats]);

  if (!user) {
    return (
      <View style={styles.center}>
        <Icon name="message-circle" size={48} color={COLORS.border} />
        <Text style={styles.emptyTitle}>Not logged in</Text>
        <Text style={styles.emptySubText}>Login to view your messages.</Text>
      </View>
    );
  }

  const renderItem = ({ item }) => {
    const isSeller = item.sellerId === user._id;
    const otherName = isSeller ? (item.buyerName || 'Buyer') : (item.sellerName || 'Seller');
    const otherPic = isSeller ? item.buyerPic : item.sellerPic;
    const lastMsg = item.lastMessage || item.messages?.[item.messages.length - 1]?.message || '';

    return (
      <TouchableOpacity
        style={styles.chatRow}
        onPress={() => navigation.navigate('Chat', { chat: item, otherName, isSeller })}
        activeOpacity={0.8}
      >
        {otherPic ? (
          <Image source={{ uri: otherPic }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Icon name="user" size={20} color={COLORS.white} />
          </View>
        )}
        <View style={styles.chatInfo}>
          <View style={styles.chatTop}>
            <Text style={styles.chatName} numberOfLines={1}>{otherName}</Text>
            {item.unread > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.unread}</Text>
              </View>
            )}
          </View>
          <Text style={styles.chatAd} numberOfLines={1}>
            <Icon name="tag" size={11} color={COLORS.textMuted} /> {item.adTitle || 'Ad'}
          </Text>
          <Text style={styles.chatLast} numberOfLines={1}>{lastMsg}</Text>
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

      {loading && chats.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item, idx) => item._id || String(idx)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchChats(); }} colors={[COLORS.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Icon name="message-circle" size={48} color={COLORS.border} />
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptySubText}>Start a chat by tapping "Chat with Seller" on any ad.</Text>
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
  list: { paddingVertical: 8 },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  chatInfo: { flex: 1 },
  chatTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  chatName: { fontSize: 15, fontWeight: '700', color: COLORS.text, flex: 1 },
  badge: {
    backgroundColor: COLORS.badgeBg,
    borderRadius: RADIUS.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginLeft: 6,
  },
  badgeText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },
  chatAd: { fontSize: 11, color: COLORS.textMuted, marginBottom: 3 },
  chatLast: { fontSize: 13, color: COLORS.textMuted },
  separator: { height: 1, backgroundColor: COLORS.border, marginLeft: 76 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textMuted },
  emptySubText: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center' },
});

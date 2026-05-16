// src/screens/SellerProfileScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, RefreshControl,
} from 'react-native';
import Icon from '../components/Icon';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';
import { apiFetch, mapListing } from '../utils/api';
import AdCard from '../components/AdCard';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SellerProfileScreen({ route, navigation }) {
  const { sellerId, sellerName, sellerPic, sellerSince } = route.params;
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [favorites, setFavorites] = useState([]);

  const fetchSellerAds = useCallback(async () => {
    try {
      const data = await apiFetch('/api/ads/listUserAds', {
        method: 'POST',
        body: JSON.stringify({ id: sellerId }),
      });
      const list = Array.isArray(data) ? data : (data?.ads || []);
      setAds(list.map(mapListing));
    } catch (error) {
      console.error('Error fetching seller ads:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sellerId]);

  const loadFavorites = async () => {
    try {
      const raw = await AsyncStorage.getItem('favorites');
      if (raw) setFavorites(JSON.parse(raw));
    } catch (e) {}
  };

  useEffect(() => {
    fetchSellerAds();
    loadFavorites();
  }, [fetchSellerAds]);

  const toggleFavorite = (id) => {
    // Simple local toggle for UI feedback
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
    // In a real app, you'd call the API here too
  };

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <View style={styles.profileCard}>
        {sellerPic ? (
          <Image source={{ uri: sellerPic }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Icon name="user" size={40} color={COLORS.white} />
          </View>
        )}
        <View style={styles.profileInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.sellerName}>{sellerName}</Text>
            <View style={styles.verifiedBadge}>
              <Icon name="check" size={10} color={COLORS.white} />
            </View>
          </View>
          <Text style={styles.memberSince}>Member since {sellerSince || '2023'}</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{ads.length}</Text>
              <Text style={styles.statLabel}>Ads</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNumber}>Verified</Text>
              <Text style={styles.statLabel}>Status</Text>
            </View>
          </View>
        </View>
      </View>
      <Text style={styles.sectionTitle}>Ads by this Seller</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Seller Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={ads}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <AdCard
            item={item}
            isFavorite={favorites.includes(item.id)}
            onToggleFavorite={() => toggleFavorite(item.id)}
            onPress={() => navigation.navigate('AdDetail', { listing: item })}
          />
        )}
        numColumns={2}
        contentContainerStyle={styles.list}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchSellerAds(); }}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="inbox" size={48} color={COLORS.border} />
              <Text style={styles.emptyText}>No ads posted yet</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 54,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    ...SHADOW.small,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  list: { padding: 10, paddingBottom: 40 },
  headerSection: { paddingBottom: 16 },
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    ...SHADOW.medium,
  },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarFallback: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  profileInfo: { flex: 1, marginLeft: 20 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sellerName: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  verifiedBadge: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: COLORS.success, alignItems: 'center', justifyContent: 'center',
  },
  memberSince: { fontSize: 14, color: COLORS.textMuted, marginBottom: 16 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  stat: { alignItems: 'flex-start' },
  statNumber: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: 12, color: COLORS.textMuted },
  statDivider: { width: 1, height: 24, backgroundColor: COLORS.border },
  sectionTitle: {
    fontSize: 18, fontWeight: '700', color: COLORS.text,
    marginLeft: 6, marginBottom: 12,
  },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60, gap: 12 },
  emptyText: { color: COLORS.textMuted, fontSize: 16, fontWeight: '600' },
});

// src/screens/FavoritesScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Image,
} from 'react-native';
import Icon from '../components/Icon';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';
import { apiFetch, mapListing } from '../utils/api';

const FAVORITES_KEY = 'favorites';

export default function FavoritesScreen({ navigation }) {
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(FAVORITES_KEY);
      const ids = raw ? JSON.parse(raw) : [];
      setFavoriteIds(ids);
      if (ids.length > 0) {
        fetchFavoriteAds(ids);
      }
    })();
  }, []);

  const fetchFavoriteAds = async (ids) => {
    setLoading(true);
    try {
      const results = await Promise.all(
        ids.map(id => apiFetch(`/api/ads/${id}`).catch(() => null))
      );
      setListings(results.filter(Boolean).map(mapListing));
    } catch {}
    finally { setLoading(false); }
  };

  const removeFavorite = async (id) => {
    const updated = favoriteIds.filter(f => f !== id);
    setFavoriteIds(updated);
    setListings(prev => prev.filter(l => l.id !== id));
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Home', { screen: 'AdDetail', params: { listing: item } })}
      activeOpacity={0.85}
    >
      <Image source={{ uri: item.images?.[0] }} style={styles.img} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.price}>₹{Number(item.price).toLocaleString('en-IN')}</Text>
        <View style={styles.meta}>
          <Icon name="map-pin" size={12} color={COLORS.textMuted} />
          <Text style={styles.metaText}>{item.location}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.removeBtn} onPress={() => removeFavorite(item.id)}>
        <Icon name="heart" size={20} color={COLORS.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Favorites</Text>
        <Text style={styles.headerCount}>{favoriteIds.length} saved</Text>
      </View>

      <FlatList
        data={listings}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.center}>
            <Icon name="heart" size={48} color={COLORS.border} />
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptySubText}>Tap the heart icon on any ad to save it here.</Text>
          </View>
        }
      />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { color: COLORS.white, fontSize: 20, fontWeight: '800' },
  headerCount: { color: 'rgba(255,255,255,0.75)', fontSize: 14 },
  list: { padding: 14 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
    ...SHADOW.small,
  },
  img: { width: 90, height: 90, backgroundColor: COLORS.border },
  info: { flex: 1, padding: 12 },
  title: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 3 },
  price: { fontSize: 15, fontWeight: '800', color: COLORS.primary, marginBottom: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 12, color: COLORS.textMuted },
  removeBtn: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8, marginTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textMuted },
  emptySubText: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center' },
});

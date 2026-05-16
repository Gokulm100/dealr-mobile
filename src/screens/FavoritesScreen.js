// src/screens/FavoritesScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Image, Alert, RefreshControl,
} from 'react-native';
import Icon from '../components/Icon';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';
import { apiFetch, mapListing, removeAdFromFavorite, getFavoriteAds } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const FAVORITES_KEY = 'favorites';

export default function FavoritesScreen({ navigation }) {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFavorites = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getFavoriteAds();
      console.log(data)
      if (data && Array.isArray(data.favoriteAds)) {
        const mapped = data.favoriteAds.map(mapListing);
        setListings(mapped);
        // Sync local storage IDs
        await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(mapped.map(m => m.id)));
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchFavorites();
    });
    return unsubscribe;
  }, [navigation, fetchFavorites]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFavorites();
  };

  const removeFavorite = async (id) => {
    const originalListings = [...listings];

    // Optimistic UI update
    setListings(prev => prev.filter(l => l.id !== id));

    try {
      if (user) {
        await removeAdFromFavorite(id);
        // Update local storage
        const raw = await AsyncStorage.getItem(FAVORITES_KEY);
        const ids = raw ? JSON.parse(raw) : [];
        await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(ids.filter(f => f !== id)));
      }
    } catch (err) {
      console.error('Failed to remove favorite:', err);
      // Revert on failure
      setListings(originalListings);
      Alert.alert('Error', 'Failed to remove favorite. Please try again.');
    }
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
        <Text style={styles.headerCount}>{listings.length} saved</Text>
      </View>

      <FlatList
        data={listings}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
          />
        }
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOW.small,
  },
  headerTitle: { color: COLORS.white, fontSize: 28, fontWeight: '800' },
  headerCount: { color: COLORS.white, fontSize: 14 },
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

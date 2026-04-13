// src/screens/MyAdsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, Image, ActivityIndicator, RefreshControl,
} from 'react-native';
import Icon from '../components/Icon';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';
import { apiFetch, mapListing } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import AiAnalytics from '../components/AiAnalytics';

export default function MyAdsScreen({ navigation }) {
  const { user } = useAuth();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyAds = useCallback(async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const data = await apiFetch('/api/ads/myads', {
        method: 'POST',
        body: JSON.stringify({ userId: user._id }),
      });
      const list = Array.isArray(data) ? data : (data?.ads || []);
      setAds(list.map(mapListing));
    } catch {
      Alert.alert('Error', 'Could not load your ads.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { fetchMyAds(); }, [fetchMyAds]);

  const handleDelete = (id) => {
    Alert.alert('Delete Ad', 'Are you sure you want to delete this ad?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch(`/api/ads/${id}`, { method: 'DELETE' });
            setAds(prev => prev.filter(a => a.id !== id));
          } catch {
            Alert.alert('Error', 'Could not delete ad.');
          }
        },
      },
    ]);
  };

  if (!user) {
    return (
      <View style={styles.center}>
        <Icon name="user" size={48} color={COLORS.border} />
        <Text style={styles.emptyTitle}>Not logged in</Text>
        <Text style={styles.emptySubText}>Login from the profile tab to see your ads.</Text>
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <View style={{ marginBottom: 16 }}>
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardInner}
        onPress={() => navigation.navigate('AdDetail', { listing: item })}
        activeOpacity={0.85}
      >
        <Image source={{ uri: item.images?.[0] }} style={styles.thumbnail} />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.price}>₹{Number(item.price).toLocaleString('en-IN')}</Text>
          <View style={styles.metaRow}>
            <Icon name="map-pin" size={12} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{item.location}</Text>
            <Icon name="eye" size={12} color={COLORS.textMuted} style={{ marginLeft: 8 }} />
            <Text style={styles.metaText}>{item.views}</Text>
          </View>
          <Text style={styles.posted}>{item.posted}</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
        <Icon name="trash-2" size={16} color={COLORS.error} />
      </TouchableOpacity>
    </View>
    <AiAnalytics ad={item} />
  </View>
);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Ads</Text>
        <TouchableOpacity
          style={styles.postBtn}
          onPress={() => navigation.navigate('Post')}
        >
          <Icon name="plus" size={16} color={COLORS.white} />
          <Text style={styles.postBtnText}>Post Ad</Text>
        </TouchableOpacity>
      </View>

      {loading && ads.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={ads}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchMyAds(); }}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Icon name="speaker" size={48} color={COLORS.border} />
              <Text style={styles.emptyTitle}>No ads yet</Text>
              <Text style={styles.emptySubText}>Tap "Post Ad" to list something for sale.</Text>
            </View>
          }
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { color: COLORS.white, fontSize: 20, fontWeight: '800' },
  postBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  postBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
  list: { padding: 14 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOW.small,
    overflow: 'hidden',
  },
  cardInner: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  thumbnail: { width: 90, height: 90, backgroundColor: COLORS.border },
  info: { flex: 1, padding: 12 },
  title: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 3 },
  price: { fontSize: 15, fontWeight: '800', color: COLORS.primary, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  metaText: { fontSize: 12, color: COLORS.textMuted, marginLeft: 3 },
  posted: { fontSize: 11, color: COLORS.textMuted },
  deleteBtn: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textMuted },
  emptySubText: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center' },
});

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

export default function MyAdsScreen({ navigation }) {
  const { user } = useAuth();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyAds = useCallback(async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const data = await apiFetch('/api/ads/listUserAds', {
        method: 'POST',
        body: JSON.stringify({ id: user._id }),
      });
      const list = Array.isArray(data) ? data : (data?.ads || []);
      setAds(list.map(mapListing));
    } catch(error) {
    console.log(error)
      Alert.alert('Error', 'Could not load your ads.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchMyAds();
    });
    return unsubscribe;
  }, [navigation, fetchMyAds]);

  const handleToggleStatus = (item) => {
    const isDisabling = !item.disabled;
    const title = isDisabling ? 'Disable Ad' : 'Enable Ad';
    const message = isDisabling
      ? 'Are you sure you want to disable this ad? It will no longer be visible to others.'
      : 'Are you sure you want to enable this ad? It will be visible to everyone again.';

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: isDisabling ? 'Disable' : 'Enable',
        style: isDisabling ? 'destructive' : 'default',
        onPress: async () => {
          try {
            const endpoint = isDisabling ? '/api/ads/disableAd' : '/api/ads/enableAd';
            await apiFetch(endpoint, {
              method: 'POST',
              body: JSON.stringify({ adId: item.id })
            });
            // Update local state
            setAds(prev => prev.map(a =>
              a.id === item.id ? { ...a, disabled: isDisabling } : a
            ));
          } catch (error) {
            Alert.alert('Error', `Could not ${isDisabling ? 'disable' : 'enable'} ad.`);
          }
        },
      },
    ]);
  };

  const handleMarkAsSold = (item) => {
    if (item.status === 'sold') return;

    Alert.alert('Mark as Sold', 'Is this item sold? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark as Sold',
        onPress: async () => {
          try {
            await apiFetch('/api/ads/markAsSold', {
              method: 'POST',
              body: JSON.stringify({ adId: item.id })
            });
            setAds(prev => prev.map(a =>
              a.id === item.id ? { ...a, status: 'sold' } : a
            ));
          } catch (error) {
            Alert.alert('Error', 'Could not mark ad as sold.');
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
          <Text style={styles.posted}>{item.category}</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.statusBtn, { backgroundColor: '#f0f4ff' }]}
          onPress={() => navigation.navigate('Post', { ad: item })}
        >
          <Text style={[styles.statusBtnText, { color: COLORS.accent }]}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statusBtn, { backgroundColor: item.disabled ? '#e6fcf5' : '#fff5f5' }]}
          onPress={() => handleToggleStatus(item)}
        >
          <Text style={[styles.statusBtnText, { color: item.disabled ? COLORS.success : COLORS.error }]}>
            {item.disabled ? 'Enable' : 'Disable'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statusBtn, { backgroundColor: item.status === 'sold' ? '#f3f4f6' : '#f0f7ff' }]}
          onPress={() => handleMarkAsSold(item)}
          disabled={item.status === 'sold'}
        >
          <Text style={[styles.statusBtnText, { color: item.status === 'sold' ? COLORS.textMuted : COLORS.primary }]}>
            {item.status === 'sold' ? 'Sold' : 'Mark Sold'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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
  thumbnail: { width: 60, height: 60, backgroundColor: COLORS.border, marginLeft: 20, borderRadius: RADIUS.sm },
  info: { flex: 1, padding: 12 },
  title: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 3 },
  price: { fontSize: 15, fontWeight: '800', color: COLORS.primary, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  metaText: { fontSize: 12, color: COLORS.textMuted, marginLeft: 3 },
  posted: { fontSize: 11, color: COLORS.textMuted },
  actions: { paddingHorizontal: 10, justifyContent: 'center', gap: 8, paddingVertical: 10 },
  statusBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 85,
    borderRadius: RADIUS.md,
  },
  statusBtnText: { fontSize: 12, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textMuted },
  emptySubText: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center' },
});

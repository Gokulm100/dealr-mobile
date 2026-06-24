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
import SellerTrustLine from '../components/SellerTrustLine';
import AsyncStorage from '@react-native-async-storage/async-storage';

function ReviewItem({ review }) {
  const reviewerName = review.reviewer?.name || 'User';
  const adTitle = review.ad?.title || 'Listing';
  const date = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewStars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Icon
              key={star}
              name="star"
              size={14}
              color={star <= review.rating ? '#f59e0b' : COLORS.border}
            />
          ))}
        </View>
        <Text style={styles.reviewDate}>{date}</Text>
      </View>
      <Text style={styles.reviewAuthor}>{reviewerName}</Text>
      <Text style={styles.reviewAdTitle} numberOfLines={1}>{adTitle}</Text>
      {review.text ? <Text style={styles.reviewText}>{review.text}</Text> : null}
      {review.tags?.length > 0 && (
        <View style={styles.reviewTags}>
          {review.tags.map((tag) => (
            <View key={tag} style={styles.reviewTag}>
              <Text style={styles.reviewTagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function SellerProfileScreen({ route, navigation }) {
  const { sellerId, sellerName, sellerPic, sellerSince } = route.params;
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [reputation, setReputation] = useState(null);
  const [reviews, setReviews] = useState([]);

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
    }
  }, [sellerId]);

  const fetchReputation = useCallback(async () => {
    try {
      const data = await apiFetch(`/api/reviews/user/${sellerId}?limit=5`);
      setReputation(data.user);
      setReviews(data.reviews || []);
    } catch (error) {
      console.error('Error fetching seller reputation:', error);
    }
  }, [sellerId]);

  const loadAll = useCallback(async () => {
    await Promise.all([fetchSellerAds(), fetchReputation()]);
    setLoading(false);
    setRefreshing(false);
  }, [fetchSellerAds, fetchReputation]);

  const loadFavorites = async () => {
    try {
      const raw = await AsyncStorage.getItem('favorites');
      if (raw) setFavorites(JSON.parse(raw));
    } catch (e) {}
  };

  useEffect(() => {
    loadAll();
    loadFavorites();
  }, [loadAll]);

  const toggleFavorite = (id) => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const ratingAvg = reputation?.ratingAvg || 0;
  const reviewCount = reputation?.reviewCount || 0;
  const completedSales = reputation?.completedSales || 0;
  const memberSince = reputation?.createdAt
    ? new Date(reputation.createdAt).getFullYear()
    : (sellerSince || '2023');

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
          <Text style={styles.memberSince}>Member since {memberSince}</Text>
          <SellerTrustLine
            ratingAvg={ratingAvg}
            reviewCount={reviewCount}
            completedSales={completedSales}
            badges={reputation?.badges || []}
            trustScore={reputation?.trustScore ?? 50}
            size="md"
            showScore
          />
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{ads.length}</Text>
              <Text style={styles.statLabel}>Ads</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{completedSales}</Text>
              <Text style={styles.statLabel}>Sales</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{reviewCount}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>
        </View>
      </View>

      {reviews.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Recent Reviews</Text>
          {reviews.map((review) => (
            <ReviewItem key={review._id} review={review} />
          ))}
        </>
      )}

      <Text style={styles.sectionTitle}>Ads by this Seller</Text>
    </View>
  );

  return (
    <View style={styles.container}>
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
            onRefresh={() => { setRefreshing(true); loadAll(); }}
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
    alignItems: 'flex-start',
    marginBottom: 16,
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
  memberSince: { fontSize: 14, color: COLORS.textMuted, marginBottom: 8 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 12 },
  stat: { alignItems: 'flex-start' },
  statNumber: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: 12, color: COLORS.textMuted },
  statDivider: { width: 1, height: 24, backgroundColor: COLORS.border },
  sectionTitle: {
    fontSize: 18, fontWeight: '700', color: COLORS.text,
    marginLeft: 6, marginBottom: 12, marginTop: 8,
  },
  reviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: 14,
    marginHorizontal: 6,
    marginBottom: 10,
    ...SHADOW.small,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewDate: { fontSize: 12, color: COLORS.textMuted },
  reviewAuthor: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  reviewAdTitle: { fontSize: 12, color: COLORS.textMuted, marginBottom: 6 },
  reviewText: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  reviewTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  reviewTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reviewTagText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60, gap: 12 },
  emptyText: { color: COLORS.textMuted, fontSize: 16, fontWeight: '600' },
});

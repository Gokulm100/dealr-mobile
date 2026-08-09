// src/screens/MyAdsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, Image, ActivityIndicator, RefreshControl,
} from 'react-native';
import Icon from '../components/Icon';
import ScreenHeader from '../components/ScreenHeader';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';
import { apiFetch, mapListing } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import ReviewModal from '../components/ReviewModal';
import MarkSoldModal from '../components/MarkSoldModal';
import PostSaleReminderModal from '../components/PostSaleReminderModal';
import SkeletonCard from '../components/SkeletonCard';

export default function MyAdsScreen({ navigation }) {
  const { user } = useAuth();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [soldModalAd, setSoldModalAd] = useState(null);
  const [postSaleReminder, setPostSaleReminder] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [pendingReviews, setPendingReviews] = useState([]);

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
      if (user?._id) {
        apiFetch('/api/reviews/pending')
          .then((data) => setPendingReviews(data.pending || []))
          .catch(() => {});
      }
    });
    return unsubscribe;
  }, [navigation, fetchMyAds, user]);

  const formatLocation = (loc) => {
    if (!loc) return '';
    const commaIndex = loc.indexOf(',');
    if (commaIndex !== -1 && loc.length > commaIndex + 4) {
      return loc.substring(0, commaIndex + 4) + '...';
    }
    return loc;
  };

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
    setSoldModalAd(item);
  };

  const handleSoldComplete = (target) => {
    setAds((prev) => prev.map((a) =>
      a.id === target.adId ? { ...a, status: 'sold', isSold: true } : a
    ));
    setPostSaleReminder(target);
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

  const renderItem = ({ item }) => {
    const isSold = item.isSold === true || item.status === 'sold';
    const pendingReview = pendingReviews.find((p) => String(p.adId) === String(item.id));

    return (
      <View style={styles.cardContainer}>
        <TouchableOpacity
          style={[styles.card, isSold && styles.cardSold]}
          onPress={() => navigation.navigate('AdDetail', { listing: item })}
          activeOpacity={0.9}
        >
          <View style={styles.imageSection}>
            <Image source={{ uri: item.images?.[0] }} style={styles.thumbnail} />
            {isSold && (
              <View style={styles.soldBadgeOverlay}>
                <Text style={styles.soldBadgeText}>SOLD</Text>
              </View>
            )}
            <View style={styles.viewCountBadge}>
              <Icon name="eye" size={10} color={COLORS.white} />
              <Text style={styles.viewCountText}>{item.views}</Text>
            </View>
          </View>

          <View style={styles.contentSection}>
            <View style={styles.topInfo}>
              <Text style={styles.categoryText}>{item.category}</Text>
              <Text style={styles.dateText}>{item.posted}</Text>
            </View>

            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>

            <View style={styles.priceRow}>
              <Text style={styles.price}>₹{Number(item.price).toLocaleString('en-IN')}</Text>
              <View style={styles.locationInfo}>
                <Icon name="map-pin" size={10} color={COLORS.textMuted} />
                <Text style={styles.locationText} numberOfLines={1}>{formatLocation(item.location)}</Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              {!isSold ? (
                <>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.editBtn]}
                    onPress={() => navigation.navigate('Post', { ad: item })}
                  >
                    <Icon name="edit" size={14} color={COLORS.primary} />
                    <Text style={[styles.actionBtnText, { color: COLORS.primary }]}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, item.disabled ? styles.enableBtn : styles.disableBtn]}
                    onPress={() => handleToggleStatus(item)}
                  >
                    <Icon
                      name={item.disabled ? "eye" : "eye-off"}
                      size={14}
                      color={item.disabled ? COLORS.success : COLORS.error}
                    />
                    <Text style={[styles.actionBtnText, { color: item.disabled ? COLORS.success : COLORS.error }]}>
                      {item.disabled ? 'Enable' : 'Disable'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.soldBtn]}
                    onPress={() => handleMarkAsSold(item)}
                  >
                    <Icon name="check-circle" size={14} color={COLORS.white} />
                    <Text style={[styles.actionBtnText, { color: COLORS.white }]}>Sold</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.soldActions}>
                  <View style={styles.soldSummary}>
                    <View style={styles.soldSuccessIcon}>
                      <Icon name="check" size={12} color={COLORS.success} />
                    </View>
                    <Text style={styles.soldSuccessText}>Marked as Sold</Text>
                  </View>
                  {pendingReview && (
                    <TouchableOpacity
                      style={styles.reviewBtn}
                      onPress={() => setReviewTarget({
                        adId: pendingReview.adId,
                        adTitle: pendingReview.adTitle,
                        revieweeName: pendingReview.revieweeName,
                        revieweePic: pendingReview.revieweePic,
                      })}
                    >
                      <Icon name="star" size={12} color="#b45309" />
                      <Text style={styles.reviewBtnText}>Rate {pendingReview.revieweeName}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="My Ads"
        right={
          <TouchableOpacity
            style={styles.postBtn}
            onPress={() => navigation.navigate('Post')}
          >
            <Icon name="plus" size={16} color={COLORS.white} />
            <Text style={styles.postBtnText}>Post Ad</Text>
          </TouchableOpacity>
        }
      />

      <MarkSoldModal
        visible={!!soldModalAd}
        ad={soldModalAd}
        onClose={() => setSoldModalAd(null)}
        onSold={handleSoldComplete}
      />

      <PostSaleReminderModal
        visible={!!postSaleReminder}
        onClose={() => {
          setPostSaleReminder(null);
          Alert.alert('Reminder saved', 'You can leave a review anytime from Profile → Pending Reviews.');
        }}
        onRateNow={() => {
          setReviewTarget(postSaleReminder);
          setPostSaleReminder(null);
        }}
        adTitle={postSaleReminder?.adTitle}
        revieweeName={postSaleReminder?.revieweeName}
        counterpartyName={postSaleReminder?.counterpartyName}
        saleAmount={postSaleReminder?.saleAmount}
      />

      <ReviewModal
        visible={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        adId={reviewTarget?.adId}
        adTitle={reviewTarget?.adTitle}
        revieweeName={reviewTarget?.revieweeName}
        revieweePic={reviewTarget?.revieweePic}
        onSubmitted={() => {
          Alert.alert('Thank you!', 'Your review helps keep Dealr safe.');
          setPendingReviews((prev) => prev.filter((item) => String(item.adId) !== String(reviewTarget?.adId)));
        }}
      />

      {loading && ads.length === 0 ? (
        <View style={styles.list}>
          {Array.from({ length: 6 }).map((_, idx) => (
            <SkeletonCard key={`skeleton-${idx}`} horizontal />
          ))}
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
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <View style={styles.iconCircle}>
                <Icon name="inbox" size={40} color={COLORS.border} />
              </View>
              <Text style={styles.emptyTitle}>No ads yet</Text>
              <Text style={styles.emptySubText}>
                You haven't posted any ads yet.{"\n"}Tap the button above to start selling!
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  postBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  postBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
  list: { padding: 16, paddingBottom: 100 },
  cardContainer: {
    marginBottom: 10,
    ...SHADOW.small,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    height: 115,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  cardSold: {
    opacity: 0.8,
    backgroundColor: '#F1F5F9',
  },
  imageSection: {
    width: 90,
    height: '100%',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.border,
  },
  soldBadgeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldBadgeText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    borderWidth: 1.5,
    borderColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  viewCountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  viewCountText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  contentSection: {
    flex: 1,
    padding: 8,
    justifyContent: 'space-between',
  },
  topInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 4,
  },
  locationText: {
    fontSize: 11,
    color: COLORS.textMuted,
    maxWidth: 80,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  editBtn: {
    backgroundColor: '#EEF2FF',
    borderColor: '#E0E7FF',
  },
  disableBtn: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FFE4E6',
  },
  enableBtn: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  soldBtn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  soldSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  soldActions: { gap: 6 },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  reviewBtnText: { fontSize: 11, fontWeight: '700', color: '#b45309' },
  soldSuccessIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldSuccessText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.success,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  emptySubText: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
});

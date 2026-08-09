// src/screens/AdDetailScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  StyleSheet, Alert, Platform,
  ActivityIndicator, LayoutAnimation, UIManager,
  Share, StatusBar, Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import Icon from '../components/Icon';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';
import { apiFetch, API_BASE_URL, WEB_URL, incrementAdViews, addAdToFavorite, removeAdFromFavorite, getReportReasons, reportAd } from '../utils/api';
import AiSummary from '../components/AiSummary';
import { useAuth } from '../context/AuthContext';
import AiAnalytics from '../components/AiAnalytics';
import SimilarAds from '../components/SimilarAds';
import AdImageGallery from '../components/AdImageGallery';
import GenuinityMeter from '../components/GenuinityMeter';
import SellerTrustLine from '../components/SellerTrustLine';
import ReviewModal from '../components/ReviewModal';
import SeededBadge, { SeededNotice } from '../components/SeededBadge';
import { isSeededDescription, stripSeededMarker } from '../utils/seededListing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SAFETY_TIPS = [
  'Meet the seller in a public place',
  'Check the item before you buy',
  'Pay only after collecting the item',
];

export default function AdDetailScreen({ route, navigation }) {
  const rawListing = route.params?.listing || {};
  const seeded =
    rawListing.isSeeded === true || isSeededDescription(rawListing.description);
  const listing = {
    ...rawListing,
    isSeeded: seeded,
    description: seeded ? stripSeededMarker(rawListing.description) : rawListing.description,
  };
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const isOwner = user && (user._id === listing.sellerId || user._id === listing.seller?._id);
  const isNew = listing.createdAt && (new Date() - new Date(listing.createdAt)) < 5 * 24 * 60 * 60 * 1000;
  const scrollRef = useRef(null);
  const [scrollOffset, setScrollOffset] = useState(0);

  const [loadingPrice, setLoadingPrice] = useState(false);
  const [priceInsights, setPriceInsights] = useState([]);
  const [expandedOffer, setExpandedOffer] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);

  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reasons, setReasons] = useState([]);
  const [loadingReasons, setLoadingReasons] = useState(false);
  const [reasonsError, setReasonsError] = useState(false);
  const [selectedReason, setSelectedReason] = useState(null);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reviewStatus, setReviewStatus] = useState(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  useEffect(() => {
    if (!isOwner) {
      addToRecentlyViewed(listing);
    }
    incrementViews();
    checkFavoriteStatus();
    if (isOwner) {
      fetchPriceInsights();
    }
  }, []);

  useEffect(() => {
    if (!user || !(listing.id || listing._id)) return;
    let cancelled = false;
    apiFetch(`/api/reviews/status/${listing.id || listing._id}`)
      .then((data) => {
        if (!cancelled) setReviewStatus(data);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user, listing.id, listing._id]);

  useEffect(() => {
    if (route.params?.openReview && reviewStatus?.canReview) {
      setReviewOpen(true);
    }
  }, [route.params?.openReview, reviewStatus?.canReview]);

  const handleScroll = (event) => {
    setScrollOffset(event.nativeEvent.contentOffset.y);
  };

  const opaqueHeader = scrollOffset > 40;
  const headerBgOpacity = Math.min(1, scrollOffset / 88);
  const titleOpacity = Math.min(1, Math.max(0, (scrollOffset - 48) / 56));
  const headerBorderOpacity = Math.min(1, Math.max(0, (scrollOffset - 72) / 40));

  const checkFavoriteStatus = async () => {
    try {
      const raw = await AsyncStorage.getItem('favorites');
      const favs = raw ? JSON.parse(raw) : [];
      setIsFavorite(favs.includes(listing.id || listing._id));
    } catch (err) {
      console.error('Error checking favorite status:', err);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to add ads to your favorites.');
      return;
    }

    const adId = listing.id || listing._id;
    const newStatus = !isFavorite;

    // Optimistic UI update
    setIsFavorite(newStatus);

    try {
      const raw = await AsyncStorage.getItem('favorites');
      let favs = raw ? JSON.parse(raw) : [];

      if (newStatus) {
        if (!favs.includes(adId)) favs.push(adId);
        await addAdToFavorite(adId);
      } else {
        favs = favs.filter(id => id !== adId);
        await removeAdFromFavorite(adId);
      }

      await AsyncStorage.setItem('favorites', JSON.stringify(favs));
    } catch (err) {
      console.error('Error toggling favorite in detail screen:', err);
      // Revert on failure
      setIsFavorite(!newStatus);
      Alert.alert('Error', 'Could not update favorites. Please try again.');
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = `${WEB_URL}/ads/${listing.id || listing._id}`;
      await Share.share({
        message: `Check out this ${listing.title} on Dealr for ₹${listing.price}!\n\nView more details here: ${shareUrl}`,
        url: shareUrl,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const incrementViews = async () => {
    const adId = listing.id || listing._id;
    if (adId) {
      await incrementAdViews(adId);
    }
  };

  const addToRecentlyViewed = async (ad) => {
    try {
      const RECENT_KEY = 'recently_viewed_ads';
      const raw = await AsyncStorage.getItem(RECENT_KEY);
      let list = raw ? JSON.parse(raw) : [];

      const adId = ad.id || ad._id;
      if (!adId) return;

      // Remove if already exists to move it to the front
      list = list.filter(item => (item.id || item._id) !== adId);

      // Add to front
      list.unshift(ad);

      // Keep only last 10
      if (list.length > 10) list = list.slice(0, 10);

      await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(list));
    } catch (err) {
      console.error('Error saving recently viewed:', err);
    }
  };

  const fetchPriceInsights = async () => {
    setLoadingPrice(true);
    try {
      const res = await apiFetch('/api/ai/provideAiPriceInsights', {
        method: 'POST',
        body: JSON.stringify({
          adId: listing.id || listing._id,
          category: listing.categoryId || listing.category,
          subCategory: listing.subCategory || 'General',
        }),
      });
      if (res.success && res.data?.summary) {
        setPriceInsights(res.data.summary);
      }
    } catch (err) {
      console.log('Price insights error:', err);
    } finally {
      setLoadingPrice(false);
    }
  };

  const handleChat = () => {
    if (!user) {
      Alert.alert('Login required', 'Please login to chat with the seller.');
      return;
    }
    if (user.isBlocked) {
      Alert.alert(
        "Account Blocked",
        "You have been blocked due to repeated suspicious activity. Please wait for another 30 days to contact any seller.",
        [{ text: "OK" }]
      );
      return;
    }
    if (isOwner) {
      Alert.alert('This is your ad', 'You cannot chat with yourself.');
      return;
    }
    navigation.navigate('Chat', {
      screen: 'ChatDetail',
      params: {
        chat: {
          adId: listing.id || listing._id,
          adTitle: listing.title,
          sellerId: listing.sellerId,
          buyerId: user._id,
        },
        otherName: listing.seller,
        isSeller: false,
      },
    });
  };

  const loadReportReasons = async () => {
    setLoadingReasons(true);
    setReasonsError(false);
    try {
      const res = await getReportReasons();
      setReasons(Array.isArray(res) ? res : (res?.data || []));
    } catch (err) {
      console.error('Error fetching report reasons:', err);
      setReasonsError(true);
    } finally {
      setLoadingReasons(false);
    }
  };

  const handleReport = () => {
    if (!user) {
      Alert.alert('Login required', 'Please login to report this ad.');
      return;
    }
    setSelectedReason(null);
    setReportModalVisible(true);
    loadReportReasons();
  };

  const closeReportModal = () => {
    if (submittingReport) return;
    setReportModalVisible(false);
  };

  const submitReport = async () => {
    if (!selectedReason || submittingReport) return;
    setSubmittingReport(true);
    try {
      await reportAd(listing.id || listing._id, selectedReason);
      setReportModalVisible(false);
      Alert.alert('Success', 'The ad has been reported. Our team will review it shortly.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not submit report. Please try again.');
    } finally {
      setSubmittingReport(false);
    }
  };

  const toggleExpand = (type) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedOffer(expandedOffer === type ? null : type);
  };

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={opaqueHeader ? 'dark-content' : 'light-content'}
      />

      <View
        style={[
          styles.fixedHeader,
          { paddingTop: insets.top + 8 },
          opaqueHeader && styles.fixedHeaderOpaque,
        ]}
      >
        <View
          pointerEvents="none"
          style={[styles.fixedHeaderBg, { opacity: headerBgOpacity }]}
        />
        <View
          pointerEvents="none"
          style={[styles.fixedHeaderBorder, { opacity: headerBorderOpacity }]}
        />
        <View style={styles.fixedHeaderRow}>
          <TouchableOpacity
            style={opaqueHeader ? styles.fixedHeaderBtn : styles.fixedHeaderBtnOverlay}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Icon name="arrow-left" size={20} color={COLORS.text} />
          </TouchableOpacity>
          <Text
            style={[styles.fixedHeaderTitle, { opacity: titleOpacity }]}
            numberOfLines={1}
          >
            {listing.title}
          </Text>
          <View style={styles.fixedHeaderActions}>
            <TouchableOpacity
              style={opaqueHeader ? styles.fixedHeaderBtn : styles.fixedHeaderBtnOverlay}
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <Icon name="share-2" size={18} color={COLORS.text} />
            </TouchableOpacity>
            {!isOwner && (
              <TouchableOpacity
                style={opaqueHeader ? styles.fixedHeaderBtn : styles.fixedHeaderBtnOverlay}
                onPress={toggleFavorite}
                activeOpacity={0.8}
              >
                <Icon
                  name="heart"
                  size={18}
                  color={isFavorite ? COLORS.error : COLORS.text}
                  fill={isFavorite ? COLORS.error : 'transparent'}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 100 }}
        scrollEventThrottle={16}
        onScroll={handleScroll}
      >
        <View style={styles.galleryContainer}>
          <AdImageGallery
            images={listing.images || []}
            controlsRightInset={isOwner ? 0 : 96}
            showExpandIcon={false}
          />
        </View>

        <View style={styles.contentSheet}>
          {/* Price + Title */}
          <View style={styles.priceSection}>
            <View>
              <Text style={styles.priceLabel}>Price</Text>
              <Text style={styles.price}>₹{Number(listing.price).toLocaleString('en-IN')}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {listing.isSeeded && <SeededBadge />}
              {isNew && (
                <View style={[styles.tag, { backgroundColor: COLORS.success + '15' }]}>
                  <View style={[styles.dotSmall, { backgroundColor: COLORS.success }]} />
                  <Text style={[styles.tagText, { color: COLORS.success }]}>NEW LISTING</Text>
                </View>
              )}
              {route.params?.isTrending && (
                <View style={[styles.tag, { backgroundColor: '#fff7ed' }]}>
                  <Text style={{ fontSize: 10 }}>🔥</Text>
                  <Text style={[styles.tagText, { color: '#f97316' }]}>TRENDING</Text>
                </View>
              )}
            </View>
          </View>

          <Text style={styles.title}>{listing.title}</Text>

          {/* Meta Info Row */}
          <View style={styles.metaRowNew}>
            <View style={styles.metaBadge}>
              <Icon name="map-pin" size={12} color={COLORS.primary} />
              <Text style={styles.metaBadgeText}>{listing.location.split(',')[0]}</Text>
            </View>
            <View style={styles.metaBadge}>
              <Icon name="clock" size={12} color={COLORS.textMuted} />
              <Text style={styles.metaBadgeText}>{listing.posted}</Text>
            </View>
            <View style={styles.metaBadge}>
              <Icon name="eye" size={12} color={COLORS.textMuted} />
              <Text style={styles.metaBadgeText}>{listing.views} views</Text>
            </View>
          </View>

          {/* Genuineness Meter */}
          <GenuinityMeter views={listing.views} reports={listing.reports} embedded />

          {listing.isSeeded && <SeededNotice />}

          {user && reviewStatus?.canReview && (
            <TouchableOpacity
              style={[styles.reviewPrompt, isOwner && styles.reviewPromptOwner]}
              onPress={() => setReviewOpen(true)}
              activeOpacity={0.85}
            >
              <Icon name="star" size={16} color={isOwner ? COLORS.primary : '#b45309'} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.reviewPromptTitle, isOwner && styles.reviewPromptTitleOwner]}>
                  Rate your experience
                </Text>
                <Text style={styles.reviewPromptSub}>
                  Share feedback about {reviewStatus.reviewee?.name || 'this transaction'}
                </Text>
              </View>
              <Icon name="chevron-right" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{listing.description}</Text>
          </View>

          {/* AI Summary */}
          <View style={styles.aiSection}>
            <AiSummary
              adId={listing.id || listing._id}
              adTitle={listing.title}
              category={listing.category}
              subCategory={listing.subCategory}
              description={listing.description}
              cachedSummary={listing.aiSummary}
            />
          </View>

          {/* Safety Card */}
          {!isOwner && (
            <View style={styles.safetyCard}>
              <View style={styles.safetyHeader}>
                <View style={styles.safetyTitleRow}>
                  <Icon name="shield" size={16} color={COLORS.success} />
                  <Text style={styles.safetyTitle}>Safety Tips</Text>
                </View>
                <TouchableOpacity
                  style={styles.reportBtn}
                  activeOpacity={0.7}
                  onPress={handleReport}
                >
                  <Icon name="flag" size={12} color={COLORS.error} />
                  <Text style={styles.reportBtnText}>Report Ad</Text>
                </TouchableOpacity>
              </View>
              {SAFETY_TIPS.map((tip, idx) => (
                <Text
                  key={idx}
                  style={[
                    styles.safetyText,
                    idx === SAFETY_TIPS.length - 1 && styles.safetyTextLast,
                  ]}
                >
                  • {tip}
                </Text>
              ))}

              <View style={styles.safetySellerBlock}>
                <Text style={styles.safetySellerEyebrow}>Posted by</Text>
                <View style={styles.safetySellerRow}>
                  {listing.sellerPic ? (
                    <Image source={{ uri: listing.sellerPic }} style={styles.safetySellerAvatar} />
                  ) : (
                    <View style={styles.safetySellerAvatarFallback}>
                      <Icon name="user" size={22} color={COLORS.white} />
                    </View>
                  )}
                  <View style={styles.safetySellerInfo}>
                    <View style={styles.sellerNameRow}>
                      <Text style={styles.safetySellerName}>{listing.seller}</Text>
                      <View style={styles.verifiedBadgeModern}>
                        <Icon name="check" size={10} color={COLORS.white} />
                      </View>
                    </View>
                    {listing.sellerSince && (
                      <Text style={styles.safetySellerSince}>Member since {listing.sellerSince}</Text>
                    )}
                    <SellerTrustLine
                      ratingAvg={listing.sellerRatingAvg}
                      reviewCount={listing.sellerReviewCount}
                      completedSales={listing.sellerCompletedSales}
                      badges={listing.sellerBadges}
                      trustScore={listing.sellerTrustScore}
                      size="sm"
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.safetyViewProfileBtn}
                    onPress={() => navigation.navigate('SellerProfile', {
                      sellerId: listing.sellerId || listing.seller?._id,
                      sellerName: listing.seller,
                      sellerPic: listing.sellerPic,
                      sellerSince: listing.sellerSince,
                    })}
                  >
                    <Text style={styles.safetyViewProfileText}>Profile</Text>
                    <Icon name="chevron-right" size={13} color="#0369a1" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {isOwner && (
            <>
              <View style={styles.offersRow}>
                {/* Highest Offer Card */}
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => toggleExpand('highest')}
                  style={[styles.offerCard, expandedOffer === 'highest' && styles.expandedCard]}
                >
                  <View style={styles.offerBadge}>
                    <Icon name="trending-up" size={12} color={COLORS.success} />
                    <Text style={styles.offerBadgeText}>Highest Offer</Text>
                  </View>
                  {loadingPrice ? (
                    <ActivityIndicator size="small" color={COLORS.primary} style={{ alignSelf: 'flex-start', marginVertical: 8 }} />
                  ) : (
                    <>
                      <Text style={styles.offerPrice}>
                        {(() => {
                          const val = priceInsights.find(i => i.title.includes('Highest'))?.value;
                          const num = Number(val);
                          return !isNaN(num) && val ? `₹${num.toLocaleString('en-IN')}` : '₹-';
                        })()}
                      </Text>
                      <Text style={styles.offerDesc} numberOfLines={expandedOffer === 'highest' ? undefined : 3}>
                        {priceInsights.find(i => i.title.includes('Highest'))?.description || 'No offers yet.'}
                      </Text>
                      {priceInsights.find(i => i.title.includes('Highest'))?.description?.length > 60 && (
                        <Text style={styles.readMoreText}>{expandedOffer === 'highest' ? 'Show less' : 'Read more'}</Text>
                      )}
                    </>
                  )}
                </TouchableOpacity>

                {/* Best Offer Card */}
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => toggleExpand('best')}
                  style={[styles.offerCard, expandedOffer === 'best' && styles.expandedCard]}
                >
                  <View style={[styles.offerBadge, { backgroundColor: '#fff7ed' }]}>
                    <Icon name="award" size={12} color="#f97316" />
                    <Text style={[styles.offerBadgeText, { color: '#f97316' }]}>Best Offer</Text>
                  </View>
                  {loadingPrice ? (
                    <ActivityIndicator size="small" color={COLORS.primary} style={{ alignSelf: 'flex-start', marginVertical: 8 }} />
                  ) : (
                    <>
                      <Text style={styles.offerPrice}>
                        {(() => {
                          const val = priceInsights.find(i => i.title.includes('Best'))?.value;
                          const num = Number(val);
                          return !isNaN(num) && val ? `₹${num.toLocaleString('en-IN')}` : '₹-';
                        })()}
                      </Text>
                      <Text style={styles.offerDesc} numberOfLines={expandedOffer === 'best' ? undefined : 3}>
                        {priceInsights.find(i => i.title.includes('Best'))?.description || 'Analyzing offers...'}
                      </Text>
                      {priceInsights.find(i => i.title.includes('Best'))?.description?.length > 60 && (
                        <Text style={styles.readMoreText}>{expandedOffer === 'best' ? 'Show less' : 'Read more'}</Text>
                      )}
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <AiAnalytics ad={listing} />
            </>
          )}

          <SimilarAds
            key={listing.id || listing._id}
            listing={listing}
            navigation={navigation}
          />

          {isOwner && (
            <View style={styles.sellerCard}>
              <View style={styles.sellerInfoRow}>
                {listing.sellerPic ? (
                  <Image source={{ uri: listing.sellerPic }} style={styles.sellerAvatar} />
                ) : (
                  <View style={styles.sellerAvatarFallback}>
                    <Icon name="user" size={24} color={COLORS.white} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.sellerLabel}>Posted by</Text>
                  <View style={styles.sellerNameRow}>
                    <Text style={styles.sellerName}>{listing.seller}</Text>
                    <View style={styles.verifiedBadgeModern}>
                      <Icon name="check" size={10} color={COLORS.white} />
                    </View>
                  </View>
                  {listing.sellerSince && (
                    <Text style={styles.sellerSince}>Member since {listing.sellerSince}</Text>
                  )}
                </View>
              </View>
            </View>
          )}

        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      {!isOwner && (
        <View style={styles.stickyFooter}>
          <TouchableOpacity style={styles.chatBtnSticky} onPress={handleChat} activeOpacity={0.9}>
            <Icon name="message-circle" size={20} color={COLORS.white} />
            <Text style={styles.chatBtnText}>Chat with Seller</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Report Reason Modal */}
      <Modal
        visible={reportModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeReportModal}
      >
        <View style={styles.reportOverlay}>
          <View style={styles.reportSheet}>
            <View style={styles.reportHeader}>
              <View style={styles.reportIconCircle}>
                <Icon name="flag" size={18} color={COLORS.error} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reportTitle}>Report this ad</Text>
                <Text style={styles.reportSubtitle}>Tell us why you're reporting this listing.</Text>
              </View>
              <TouchableOpacity onPress={closeReportModal} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name="x" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {loadingReasons ? (
              <View style={styles.reportStateBox}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : reasonsError ? (
              <View style={styles.reportStateBox}>
                <Text style={styles.reportErrorText}>Couldn't load reasons. Please try again.</Text>
                <TouchableOpacity onPress={loadReportReasons} style={styles.reportRetryBtn}>
                  <Text style={styles.reportRetryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : reasons.length === 0 ? (
              <View style={styles.reportStateBox}>
                <Text style={styles.reportEmptyText}>No reporting reasons are available right now.</Text>
              </View>
            ) : (
              <ScrollView style={styles.reportReasonList} showsVerticalScrollIndicator={false}>
                {reasons.map((r) => {
                  const isSelected = selectedReason === r._id;
                  return (
                    <TouchableOpacity
                      key={r._id}
                      activeOpacity={0.7}
                      style={[styles.reportReasonItem, isSelected && styles.reportReasonItemSelected]}
                      onPress={() => setSelectedReason(r._id)}
                    >
                      <View style={[styles.reportRadio, isSelected && styles.reportRadioSelected]}>
                        {isSelected && <View style={styles.reportRadioDot} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.reportReasonTitle}>{r.reason}</Text>
                        {!!r.description && <Text style={styles.reportReasonDesc}>{r.description}</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <View style={styles.reportActions}>
              <TouchableOpacity
                style={styles.reportCancelBtn}
                onPress={closeReportModal}
                disabled={submittingReport}
                activeOpacity={0.8}
              >
                <Text style={styles.reportCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reportSubmitBtn, (!selectedReason || submittingReport) && styles.reportSubmitBtnDisabled]}
                onPress={submitReport}
                disabled={!selectedReason || submittingReport}
                activeOpacity={0.8}
              >
                {submittingReport ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.reportSubmitText}>Submit Report</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ReviewModal
        visible={reviewOpen}
        onClose={() => setReviewOpen(false)}
        adId={listing.id || listing._id}
        adTitle={listing.title}
        revieweeName={reviewStatus?.reviewee?.name}
        revieweePic={reviewStatus?.reviewee?.profilePic}
        onSubmitted={() => {
          setReviewStatus((prev) => ({ ...prev, canReview: false, alreadyReviewed: true }));
          Alert.alert('Thank you!', 'Your review helps keep Dealr safe.');
        }}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  fixedHeaderOpaque: {
    ...SHADOW.small,
  },
  fixedHeaderBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.white,
  },
  fixedHeaderBorder: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
  },
  fixedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  fixedHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixedHeaderBtnOverlay: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.small,
  },
  fixedHeaderTitle: {
    flex: 1,
    marginHorizontal: 8,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  fixedHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  galleryContainer: { position: 'relative' },
  contentSheet: {
    marginTop: -20,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingTop: 28,
    minHeight: 600,
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  priceLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  price: { fontSize: 32, fontWeight: '900', color: COLORS.primary },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 16, lineHeight: 28 },
  metaRowNew: { flexDirection: 'row', gap: 10, marginBottom: 24, flexWrap: 'wrap' },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  metaBadgeText: { fontSize: 13, color: COLORS.text, fontWeight: '600' },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  dotSmall: { width: 4, height: 4, borderRadius: 2 },
  tagText: { fontSize: 11, fontWeight: '800' },
  section: { marginBottom: 28 },
  reviewPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 20,
  },
  reviewPromptOwner: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  reviewPromptTitle: { fontSize: 14, fontWeight: '800', color: '#92400e' },
  reviewPromptTitleOwner: { color: COLORS.primary },
  reviewPromptSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  description: { fontSize: 15, color: COLORS.text, lineHeight: 24, opacity: 0.8 },
  aiSection: { marginBottom: 24, borderRadius: RADIUS.lg, overflow: 'hidden' },
  safetyCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  safetyTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  safetyTitle: { fontSize: 14, fontWeight: '700', color: '#0369a1' },
  safetyText: { fontSize: 13, color: '#0c4a6e', marginBottom: 4, opacity: 0.85 },
  safetyTextLast: { marginBottom: 0 },
  safetySellerBlock: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(3, 105, 161, 0.22)',
  },
  safetySellerEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369a1',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 10,
    opacity: 0.9,
  },
  safetySellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  safetySellerInfo: { flex: 1, minWidth: 0 },
  safetySellerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(125, 211, 252, 0.9)',
    backgroundColor: '#e0f2fe',
  },
  safetySellerAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(125, 211, 252, 0.9)',
  },
  safetySellerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0c4a6e',
  },
  safetySellerSince: {
    fontSize: 12,
    color: '#0369a1',
    marginTop: 2,
    opacity: 0.85,
  },
  safetyViewProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.85)',
  },
  safetyViewProfileText: {
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '700',
  },
  sellerLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600', marginBottom: 2 },
  sellerCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sellerInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sellerAvatar: { width: 48, height: 48, borderRadius: 24 },
  sellerAvatarFallback: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  sellerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sellerName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  verifiedBadgeModern: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerSince: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  viewProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
  },
  viewProfileText: { fontSize: 12, color: COLORS.primary, fontWeight: '700' },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOW.medium,
  },
  chatBtnSticky: {
    flex: 1,
    height: 54,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...SHADOW.small,
  },
  chatBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.error + '20',
  },
  reportBtnText: { fontSize: 11, color: COLORS.error, fontWeight: '700', textTransform: 'uppercase' },
  offersRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  offerCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 12,
    minHeight: 110,
    ...SHADOW.small,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  offerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  offerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.success,
    textTransform: 'uppercase',
  },
  offerPrice: { fontSize: 18, fontWeight: '900', color: COLORS.text, marginBottom: 4 },
  offerDesc: { fontSize: 11, color: COLORS.textMuted, lineHeight: 15 },
  expandedCard: { flex: 2, borderColor: COLORS.primary, zIndex: 10, ...SHADOW.medium },
  readMoreText: { fontSize: 10, color: COLORS.primary, fontWeight: '700', marginTop: 4 },
  reportOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  reportSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '80%',
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  reportIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.error + '1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  reportSubtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  reportStateBox: { paddingVertical: 28, alignItems: 'center', justifyContent: 'center' },
  reportErrorText: { fontSize: 14, color: COLORS.error, marginBottom: 12 },
  reportEmptyText: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center' },
  reportRetryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
  },
  reportRetryText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  reportReasonList: { marginBottom: 16 },
  reportReasonItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  reportReasonItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '0D',
  },
  reportRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  reportRadioSelected: { borderColor: COLORS.primary },
  reportRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  reportReasonTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  reportReasonDesc: { fontSize: 12, color: COLORS.textMuted, marginTop: 2, lineHeight: 16 },
  reportActions: { flexDirection: 'row', gap: 12 },
  reportCancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportCancelText: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  reportSubmitBtn: {
    flex: 1,
    height: 50,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportSubmitBtnDisabled: { opacity: 0.5 },
  reportSubmitText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
});

// src/screens/AdDetailScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  StyleSheet, Dimensions, Alert, Platform,
  ActivityIndicator, LayoutAnimation, UIManager,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import Icon from '../components/Icon';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';
import { apiFetch, API_BASE_URL } from '../utils/api';
import AiSummary from '../components/AiSummary';
import { useAuth } from '../context/AuthContext';
import AiAnalytics from '../components/AiAnalytics';

const { width } = Dimensions.get('window');

const SAFETY_TIPS = [
  'Meet the seller in a public place',
  'Check the item before you buy',
  'Pay only after collecting the item',
];

export default function AdDetailScreen({ route, navigation }) {
  const { listing } = route.params;
  const { user } = useAuth();
  const isOwner = user && (user._id === listing.sellerId || user._id === listing.seller?._id);
  const isNew = listing.createdAt && (new Date() - new Date(listing.createdAt)) < 5 * 24 * 60 * 60 * 1000;
  const [currentImg, setCurrentImg] = useState(0);
  const scrollRef = useRef(null);

  // Price Insights State
  const [priceInsights, setPriceInsights] = useState([]);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [expandedOffer, setExpandedOffer] = useState(null);

  const toggleExpand = (type) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedOffer(expandedOffer === type ? null : type);
  };

  useEffect(() => {
    if (isOwner) {
      fetchPriceInsights();
    }
  }, []);

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

  const handleReport = () => {
    Alert.alert(
      "Report Ad",
      "Are you sure you want to report this advertisement for suspicious activity?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Report",
          style: "destructive",
          onPress: () => Alert.alert("Success", "The ad has been reported. Our team will review it shortly.")
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Image Carousel */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={e => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / width);
            setCurrentImg(idx);
          }}
          scrollEventThrottle={16}
        >
          {(listing.images || []).map((uri, idx) => (
            <Image key={idx} source={{ uri }} style={[styles.image, { width }]} resizeMode="cover" />
          ))}
        </ScrollView>

        {/* Dots */}
        {listing.images?.length > 1 && (
          <View style={styles.dotsOverlay}>
            {listing.images.map((_, idx) => (
              <View
                key={idx}
                style={[styles.dot, currentImg === idx && styles.dotActive]}
              />
            ))}
          </View>
        )}

        <View style={styles.contentSheet}>
          {/* Price + Title */}
          <View style={styles.priceSection}>
            <View>
              <Text style={styles.priceLabel}>Price</Text>
              <Text style={styles.price}>₹{Number(listing.price).toLocaleString('en-IN')}</Text>
            </View>
            {isNew && (
              <View style={[styles.tag, { backgroundColor: COLORS.success + '15' }]}>
                <View style={[styles.dotSmall, { backgroundColor: COLORS.success }]} />
                <Text style={[styles.tagText, { color: COLORS.success }]}>NEW LISTING</Text>
              </View>
            )}
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

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{listing.description}</Text>
          </View>

          {/* AI Summary */}
          <View style={styles.aiSection}>
            <AiSummary
              adTitle={listing.title}
              category={listing.category}
              subCategory={listing.subCategory}
              description={listing.description}
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
                <Text key={idx} style={styles.safetyText}>• {tip}</Text>
              ))}
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

          {/* Seller */}
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
                <View style={styles.sellerNameRow}>
                  <Text style={styles.sellerName}>{listing.seller}</Text>
                  <TouchableOpacity style={styles.verifiedBadgeModern} activeOpacity={0.8}>
                    <Icon name="check-circle" size={10} color={COLORS.white} />
                    <Text style={styles.verifiedTextModern}>VERIFIED</Text>
                  </TouchableOpacity>
                </View>
                {listing.sellerSince && (
                  <Text style={styles.sellerSince}>Member since {listing.sellerSince}</Text>
                )}
              </View>
              <TouchableOpacity style={styles.viewProfileBtn}>
                <Text style={styles.viewProfileText}>View Profile</Text>
                <Icon name="chevron-right" size={14} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>


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

      {/* Overlay Header - Moved to end of View to ensure it's on top and clickable */}
      <View style={styles.headerOverlay} pointerEvents="box-none">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
          activeOpacity={0.8}
        >
          <Icon name="arrow-left" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  headerOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  headerBtn: {
   marginTop:20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.medium,
  },
  image: { height: 360, backgroundColor: COLORS.border },
  dotsOverlay: {
    position: 'absolute',
    top: 310,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255, 255, 255, 0.5)' },
  dotActive: { backgroundColor: COLORS.white, width: 16 },
  contentSheet: {
    marginTop: -30,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
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
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  description: { fontSize: 15, color: COLORS.text, lineHeight: 24, opacity: 0.8 },
  aiSection: { marginBottom: 24, borderRadius: RADIUS.lg, overflow: 'hidden' },
  safetyCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 28,
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
  safetyText: { fontSize: 13, color: '#0c4a6e', marginBottom: 4, opacity: 0.8 },
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.success,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop:2,
    borderRadius: RADIUS.full,
  },
  verifiedTextModern: { fontSize: 8, fontWeight: '900', color: COLORS.white, letterSpacing: 0.5 },
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
});

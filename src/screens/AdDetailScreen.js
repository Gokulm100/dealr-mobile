// src/screens/AdDetailScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  StyleSheet, Dimensions, Alert, TextInput, KeyboardAvoidingView, Platform,
  ActivityIndicator, LayoutAnimation, UIManager, Keyboard,
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

export default function AdDetailScreen({ route, navigation }) {
  const { listing, isTrending } = route.params;
  const { user } = useAuth();
  const isNew = listing.createdAt && (new Date() - new Date(listing.createdAt)) < 5 * 24 * 60 * 60 * 1000;
  const [currentImg, setCurrentImg] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);
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
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      if (chatOpen) {
        setTimeout(() => {
          scrollRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    });

    return () => {
      showSubscription.remove();
    };
  }, [chatOpen]);

  useEffect(() => {
    if (chatOpen && user) {
      fetchChat();
    }
  }, [chatOpen]);

  useEffect(() => {
    if (user?._id === listing.sellerId || user?._id === listing.seller?._id) {
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

  const fetchChat = async () => {
    if (!user) return;
    try {
      const data = await apiFetch(
        `/api/ads/chat?adId=${listing.id}&sellerId=${listing.sellerId}&buyerId=${user._id}`
      );
      setChatMessages(Array.isArray(data.chats) ? data.chats : []);
    } catch {}
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || !user) return;
    setSending(true);
    try {
      await apiFetch('/api/ads/chat', {
        method: 'POST',
        body: JSON.stringify({
          adId: listing.id,
          to: listing.sellerId,
          from: user._id,
          message: chatInput.trim()
                  }),
      });
      setChatInput('');
      await fetchChat();
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 200);
    } catch {
      Alert.alert('Error', 'Could not send message.');
    } finally {
      setSending(false);
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
    if (user._id === listing.sellerId) {
      Alert.alert('This is your ad', 'You cannot chat with yourself.');
      return;
    }
    setChatOpen(true);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Icon name="arrow-left" size={20} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{listing.title}</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
          <View style={styles.dots}>
            {listing.images.map((_, idx) => (
              <View
                key={idx}
                style={[styles.dot, currentImg === idx && styles.dotActive]}
              />
            ))}
          </View>
        )}

        <View style={styles.body}>
          {/* Price + Title */}
          <Text style={styles.price}>₹{Number(listing.price).toLocaleString('en-IN')}</Text>
          <Text style={styles.title}>{listing.title}</Text>

          {/* Tags row */}
          <View style={styles.tagsRow}>
            <View style={styles.tag}>
              <Icon name="tag" size={12} color={COLORS.primary} />
              <Text style={styles.tagText}>{listing.category}</Text>
            </View>
            {listing.subCategory && listing.subCategory !== 'General' && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{listing.subCategory}</Text>
              </View>
            )}
            {isNew && (
              <View style={[styles.tag, { backgroundColor: COLORS.success + '15' }]}>
                <Text style={[styles.tagText, { color: COLORS.success }]}>NEW</Text>
              </View>
            )}
            {isTrending && (
              <View style={[styles.tag, { backgroundColor: '#fff7ed' }]}>
                <Text style={{ fontSize: 12 }}>🔥</Text>
                <Text style={[styles.tagText, { color: '#f97316', marginLeft: 4 }]}>TRENDING</Text>
              </View>
            )}
          </View>

          {/* Meta */}
          <View style={styles.metaRow}>
            <View style={[styles.metaItem, { width: '100%' }]}>
              <Icon name="map-pin" size={14} color={COLORS.textMuted} style={{ alignSelf: 'flex-start', marginTop: 2 }} />
              <Text style={[styles.metaText, { flex: 1 }]}>{listing.location}</Text>
            </View>
            <View style={styles.metaItem}>
              <Icon name="eye" size={14} color={COLORS.textMuted} />
              <Text style={styles.metaText}>{listing.views} views</Text>
            </View>
            <View style={styles.metaItem}>
              <Icon name="clock" size={14} color={COLORS.textMuted} />
              <Text style={styles.metaText}>{listing.posted}</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{listing.description}</Text>
          </View>

          {/* AI Summary */}
          <AiSummary
            adTitle={listing.title}
            category={listing.category}
            subCategory={listing.subCategory}
            description={listing.description}
          />

          {(user?._id === listing.sellerId || user?._id === listing.seller?._id) && (
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
            {listing.sellerPic ? (
              <Image source={{ uri: listing.sellerPic }} style={styles.sellerAvatar} />
            ) : (
              <View style={styles.sellerAvatarFallback}>
                <Icon name="user" size={20} color={COLORS.white} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.sellerLabel}>Posted by</Text>
              <Text style={styles.sellerName}>{listing.seller}</Text>
              {listing.sellerSince && (
                <Text style={styles.sellerSince}>Member since {listing.sellerSince}</Text>
              )}
            </View>
          </View>

          {/* Chat section */}
          {chatOpen ? (
            <View style={styles.chatBox}>
              <Text style={styles.sectionTitle}>Chat with Seller</Text>
              <View style={styles.chatMessages}>
                {chatMessages.length === 0 && (
                  <Text style={styles.chatEmpty}>No messages yet. Say hello!</Text>
                )}
                {chatMessages.map((msg, idx) => {
                  const isMe = msg.from === user?._id || msg.from?._id === user?._id;
                  return (
                    <View
                      key={idx}
                      style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}
                    >
                      <Text style={[styles.bubbleText, isMe && { color: COLORS.white }]}>
                        {msg.message}
                      </Text>
                    </View>
                  );
                })}
              </View>
              <View style={styles.chatInputRow}>
                <TextInput
                  style={styles.chatInput}
                  placeholder="Type a message..."
                  value={chatInput}
                  onChangeText={setChatInput}
                  multiline
                  onFocus={() => {
                    setTimeout(() => {
                      scrollRef.current?.scrollToEnd({ animated: true });
                    }, 300);
                  }}
                />
                <TouchableOpacity
                  style={styles.sendBtn}
                  onPress={sendMessage}
                  disabled={sending || !chatInput.trim()}
                >
                  <Icon name="send" size={18} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            (user?._id !== listing.sellerId && user?._id !== listing.seller?._id) && (
              <TouchableOpacity style={styles.chatBtn} onPress={handleChat}>
                <Icon name="message-circle" size={18} color={COLORS.white} />
                <Text style={styles.chatBtnText}>Chat with Seller</Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    gap: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, color: COLORS.white, fontSize: 16, fontWeight: '700' },
  image: { height: 260, backgroundColor: COLORS.border },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.border },
  dotActive: { backgroundColor: COLORS.primary, width: 18 },
  body: { padding: 16 },
  price: { fontSize: 26, fontWeight: '900', color: COLORS.primary, marginBottom: 4 },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  tagsRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0f4ff',
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: COLORS.textMuted },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  description: { fontSize: 14, color: COLORS.text, lineHeight: 22 },
  loadingContainer: { padding: 20, alignItems: 'center' },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 16,
    ...SHADOW.small,
  },
  sellerAvatar: { width: 44, height: 44, borderRadius: 22 },
  sellerAvatarFallback: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  sellerLabel: { fontSize: 11, color: COLORS.textMuted },
  sellerName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  chatBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  chatBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
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
  chatBox: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 24,
    ...SHADOW.small,
  },
  chatMessages: { minHeight: 80, marginBottom: 12 },
  chatEmpty: { color: COLORS.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 16 },
  bubble: {
    maxWidth: '75%',
    borderRadius: RADIUS.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 6,
    backgroundColor: '#f0f4ff',
    alignSelf: 'flex-start',
  },
  bubbleMe: { backgroundColor: COLORS.accent, alignSelf: 'flex-end' },
  bubbleThem: {},
  bubbleText: { fontSize: 14, color: COLORS.text },
  chatInputRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  chatInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 100,
    color: COLORS.text,
  },
  sendBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

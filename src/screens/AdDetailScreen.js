// src/screens/AdDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  StyleSheet, Dimensions, Alert, TextInput,
} from 'react-native';
import Icon from '../components/Icon';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';
import { apiFetch, API_BASE_URL } from '../utils/api';
import AiSummary from '../components/AiSummary';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

export default function AdDetailScreen({ route, navigation }) {
  const { listing } = route.params;
  const { user } = useAuth();
  const [currentImg, setCurrentImg] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (chatOpen && user) {
      fetchChat();
    }
  }, [chatOpen]);

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
          sellerId: listing.sellerId,
          buyerId: user._id,
          message: chatInput.trim(),
          senderType: user._id === listing.sellerId ? 'seller' : 'buyer',
        }),
      });
      setChatInput('');
      fetchChat();
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{listing.title}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
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
          </View>

          {/* Meta */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Icon name="map-pin" size={14} color={COLORS.textMuted} />
              <Text style={styles.metaText}>{listing.location}</Text>
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
                  const isMe = msg.senderType === 'buyer'
                    ? msg.buyerId === user?._id
                    : msg.sellerId === user?._id;
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
            user?._id !== listing.sellerId && (
              <TouchableOpacity style={styles.chatBtn} onPress={handleChat}>
                <Icon name="message-circle" size={18} color={COLORS.white} />
                <Text style={styles.chatBtnText}>Chat with Seller</Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </ScrollView>
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
    gap: 12,
  },
  backBtn: { padding: 4 },
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

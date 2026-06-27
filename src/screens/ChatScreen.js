// src/screens/ChatScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, Image,
  StyleSheet, KeyboardAvoidingView, Platform, Keyboard, Alert, Modal, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import Icon from '../components/Icon';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';
import { apiFetch, API_BASE_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useMessages } from '../context/MessagesContext';
import { useIsFocused } from '@react-navigation/native';
import { checkAndPromptNotifications } from '../utils/notifications';
import ChatTrustCaution from '../components/ChatTrustCaution';
import { getChatTrustCautionFromProfile } from '../utils/chatTrustCaution';
import { getSocket } from '../utils/socket';
import SkeletonCard from '../components/SkeletonCard';

// Alternating left/right bubble pattern shown while a conversation loads.
const CHAT_SKELETON = [
  { align: 'left', width: '55%', height: 40 },
  { align: 'left', width: '38%', height: 40 },
  { align: 'right', width: '62%', height: 56 },
  { align: 'left', width: '70%', height: 40 },
  { align: 'right', width: '45%', height: 40 },
  { align: 'right', width: '52%', height: 40 },
  { align: 'left', width: '48%', height: 56 },
  { align: 'right', width: '40%', height: 40 },
];

export default function ChatScreen({ route, navigation }) {
  const { chat, otherName, isSeller } = route.params;
  const { user, token } = useAuth();
  const insets = useSafeAreaInsets();
  const { refresh, messageCount } = useMessages();
  const isFocused = useIsFocused();
  const [messages, setMessages] = useState([]);
  const [fraudCheck, setFraudCheck] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showOfferInput, setShowOfferInput] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [counterparty, setCounterparty] = useState(null);
  const [showTrustCaution, setShowTrustCaution] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [viewerImage, setViewerImage] = useState(null);
  const listRef = useRef(null);

  // Resolve adId, buyerId, sellerId from whatever shape the chat object has
  const adId = chat.adId || chat.ad?._id || chat._id;
  const buyerId = chat.buyerId || chat.buyer?._id || (!isSeller ? user?._id : null);
  const sellerId = chat.sellerId || chat.seller?._id || (isSeller ? user?._id : null);

  const markAsSeen = async () => {
    if (!adId || !user?._id) return;
    try {
      const senderId = isSeller ? buyerId : sellerId;
      let stat = await apiFetch('/api/ads/markMessagesAsSeen', {
        method: 'POST',
        body: JSON.stringify({
          adId,
          reader: user._id,
          sender: senderId,
          buyerId,
          sellerId,
        }),
      });
      console.log(stat)
      refresh(); // Update badge count
    } catch (e) {
      console.warn('markAsSeen error:', e?.message);
    }
  };

  const fetchMessages = async (silent = false) => {
    if (!adId || !buyerId || !sellerId) return;
    if (!silent) setLoading(true);
    try {
      const data = await apiFetch(
        `/api/ads/chat?adId=${adId}&buyerId=${buyerId}&sellerId=${sellerId}`
      );
      // Handle fraudCheck from response
      if (data.fraudCheck) {
        setFraudCheck(data.fraudCheck);
      }
      if (data.counterparty) {
        setCounterparty(data.counterparty);
      }

      // API returns { chats: [...] } or just an array
      const msgs = Array.isArray(data) ? data : (Array.isArray(data.chats) ? data.chats : []);
      setMessages(msgs);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
    } catch (e) {
      console.warn('fetchMessages error:', e?.message);
    } finally {
      setLoading(false);
    }
  };

  // Watch for messageCount changes to trigger a refresh
  useEffect(() => {
    if (isFocused) {
      markAsSeen();
    }
  }, [messageCount, isFocused]);

  useEffect(() => {
    setShowTrustCaution(true);
  }, [counterparty?._id, adId]);

  useEffect(() => {
    fetchMessages();
    markAsSeen();

    // WebSocket Setup
    const socket = getSocket(user?._id, token);

    if (socket?.connected) {
      socket.emit('join', user?._id);
    }

    const handleNewMessage = (payload) => {
      console.log('DEBUG: Socket Payload Received:', JSON.stringify(payload));

      const msg = payload.chat;
      if (!msg) return;

      // Ensure IDs are strings for comparison
      // Extract _id if adId is an object (populated)
      const rawIncomingAdId = msg.adId?._id || msg.adId;
      const incomingAdId = rawIncomingAdId?.toString();
      const currentAdId = adId?.toString();

      console.log(`DEBUG: Comparing Ad IDs: Incoming(${incomingAdId}) vs Current(${currentAdId})`);

      if (incomingAdId !== currentAdId) {
        console.log('DEBUG: Message ignored (different conversation)');
        return;
      }

      const fromId = (msg.from?._id || msg.from)?.toString();
      const currentUserId = user?._id?.toString();

      if (fromId !== currentUserId) {
        console.log('DEBUG: Adding message to UI state');
        setMessages(prev => {
          if (prev.find(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 300);
        markAsSeen();
      }
    };

    socket?.on('chat:new-message', handleNewMessage);

    // Prompt for notifications
    setTimeout(checkAndPromptNotifications, 1000);

    const keyboardShowSub = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => {
      keyboardShowSub.remove();
      socket?.off('chat:new-message', handleNewMessage);
    };
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');

    // Optimistic Update
    const tempId = 'temp-' + Date.now();
    const optimisticMsg = {
      _id: tempId,
      from: user._id,
      message: text,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      await apiFetch('/api/ads/chat', {
        method: 'POST',
        body: JSON.stringify({
          adId,
          from: isSeller ? sellerId : buyerId,
          to: isSeller ? buyerId : sellerId,
          message: text
        }),
      });
      fetchMessages(true);
    } catch (e) {
      console.warn('sendMessage error:', e?.message);
      setMessages(prev => prev.filter(m => m._id !== tempId));
      setInput(text);
      Alert.alert("Error", "Message failed to send.");
    }
  };

  const sendImage = async () => {
    if (uploadingImage) return;
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 1,
    });
    if (result.didCancel || !result.assets?.length) return;
    const asset = result.assets[0];

    const tempId = 'temp-img-' + Date.now();
    const optimisticMsg = {
      _id: tempId,
      from: user._id,
      message: '',
      imageUrl: asset.uri,
      _pendingImage: true,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    setUploadingImage(true);

    try {
      const authToken = await AsyncStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('adId', adId);
      formData.append('from', isSeller ? sellerId : buyerId);
      formData.append('to', isSeller ? buyerId : sellerId);
      formData.append('image', {
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || `chat_${Date.now()}.jpg`,
      });

      const res = await fetch(`${API_BASE_URL}/api/ads/chat`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData,
      });
      if (!res.ok) throw new Error('upload failed');
      fetchMessages(true);
    } catch (e) {
      console.warn('sendImage error:', e?.message);
      setMessages(prev => prev.filter(m => m._id !== tempId));
      Alert.alert('Error', 'Failed to send photo. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const sendOffer = async () => {
    if (!offerAmount.trim()) return;
    const amount = offerAmount.trim();
    const offerText = `THE BUYER MADE AN OFFER: ₹${amount}`;

    setOfferAmount('');
    setShowOfferInput(false);

    // Optimistic Update
    const tempId = 'offer-' + Date.now();
    const optimisticOffer = {
      _id: tempId,
      from: user._id,
      message: offerText,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, optimisticOffer]);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      await apiFetch('/api/ads/chat', {
        method: 'POST',
        body: JSON.stringify({
          adId,
          from: isSeller ? sellerId : buyerId,
          to: isSeller ? buyerId : sellerId,
          message: offerText,
          isOffer: true,
          amount: amount
        }),
      });
      fetchMessages(true);
    } catch (e) {
      console.warn('sendOffer error:', e?.message);
      setMessages(prev => prev.filter(m => m._id !== tempId));
      setOfferAmount(amount);
      setShowOfferInput(true);
    }
  };

  const acceptOffer = async (amount) => {
    setSending(true);
    try {
      await apiFetch('/api/ads/chat', {
        method: 'POST',
        body: JSON.stringify({
          adId,
          from: isSeller ? sellerId : buyerId,
          to: isSeller ? buyerId : sellerId,
          message: `✅ OFFER ACCEPTED: ₹${amount}`,
        }),
      });
      fetchMessages(true);
    } catch (e) {
      console.warn('acceptOffer error:', e?.message);
    } finally {
      setSending(false);
    }
  };

  const handleReportUser = async () => {
    const targetId = isSeller ? buyerId : sellerId;
    if (!targetId) return;

    Alert.alert(
      "Report User",
      "Are you sure you want to report this user for suspicious activity?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Report",
          style: "destructive",
          onPress: async () => {
            try {
              await apiFetch('/api/users/reportUser', {
                method: 'POST',
                body: JSON.stringify({ userId: targetId }),
              });
              Alert.alert("Reported", "Thank you for reporting. We will investigate this user.");
            } catch (e) {
              console.warn('reportUser error:', e?.message);
              Alert.alert("Error", "Failed to report user. Please try again later.");
            }
          }
        }
      ]
    );
  };

  const formatDateSeparator = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return 'Today';
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const renderMessage = ({ item, index }) => {
    const fromId = item.from?._id || item.from;
    const isMe = fromId === user._id;

    const showDateSeparator = index === 0 || (() => {
      const prev = messages[index - 1];
      if (!prev || !prev.createdAt || !item.createdAt) return false;
      return new Date(prev.createdAt).toDateString() !== new Date(item.createdAt).toDateString();
    })();

    const isLastInGroup = index === messages.length - 1 || (() => {
      const next = messages[index + 1];
      if (!next) return true;
      const nextFromId = next.from?._id || next.from;
      return nextFromId !== fromId;
    })();

    return (
      <View>
        {showDateSeparator && item.createdAt && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateText}>{formatDateSeparator(item.createdAt)}</Text>
          </View>
        )}
        <View style={[
          styles.bubble,
          item.imageUrl ? styles.bubbleImage : null,
          isMe ? styles.bubbleMe : styles.bubbleThem,
          isMe ? (isLastInGroup ? styles.bubbleMeLast : null) : (isLastInGroup ? styles.bubbleThemLast : null)
        ]}>
          {item.imageUrl ? (
            <TouchableOpacity activeOpacity={0.9} onPress={() => setViewerImage(item.imageUrl)}>
              <Image source={{ uri: item.imageUrl }} style={styles.chatImage} resizeMode="cover" />
              {item._pendingImage && (
                <View style={styles.imageUploadingOverlay}>
                  <ActivityIndicator color={COLORS.white} />
                </View>
              )}
            </TouchableOpacity>
          ) : null}
          {item.message ? (
            <Text style={[styles.bubbleText, isMe && { color: COLORS.white }, item.imageUrl && { marginTop: 8 }]}>
              {item.message}
            </Text>
          ) : null}
          {item.createdAt && (
            <View style={styles.bubbleFooter}>
              <Text style={[styles.bubbleTime, isMe && { color: 'rgba(255,255,255,0.7)' }]}>
                {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              {isMe && (
                 <Icon
                   name="check-circle"
                   size={10}
                   color={item._id.startsWith('temp-') ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.8)'}
                   style={{ marginLeft: 4 }}
                 />
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderFraudWarning = () => {
    if (!fraudCheck || !fraudCheck.fraudIndicators || fraudCheck.fraudIndicators.length === 0) return null;

    return (
      <View style={styles.fraudWrapper}>
        <View style={styles.fraudCard}>
          <View style={styles.fraudHeader}>
            <View style={styles.fraudTitleRow}>
              <View style={styles.warningIconCircle}>
                <Icon name="alert-circle" size={14} color="#b45309" />
              </View>
              <Text style={styles.fraudTitle}>Safety Insight</Text>
            </View>
            <TouchableOpacity onPress={() => setFraudCheck(null)} style={styles.fraudClose}>
               <Icon name="x" size={14} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.fraudBody}>
             <View style={styles.indicatorList}>
               {fraudCheck.fraudIndicators.map((indicator, index) => (
                 <View key={index} style={styles.indicatorRow}>
                   <View style={styles.dot} />
                   <Text style={styles.fraudIndicator}>{indicator}</Text>
                 </View>
               ))}
             </View>

             {fraudCheck.recommendations ? (
               <View style={styles.recommendationBox}>
                 <Text style={styles.recommendationLabel}>Recommendation:</Text>
                 <Text style={styles.fraudRecommendation}>{fraudCheck.recommendations}</Text>
               </View>
             ) : null}

             {fraudCheck.type !== 'SAFE' && (
               <TouchableOpacity
                 style={styles.reportBtn}
                 onPress={handleReportUser}
               >
                 <Text style={styles.reportBtnText}>Report User</Text>
               </TouchableOpacity>
             )}
          </View>
        </View>
      </View>
    );
  };

  const renderTrustCaution = () => {
    const trustCaution = getChatTrustCautionFromProfile(counterparty);
    if (!showTrustCaution || !trustCaution.show) return null;
    return (
      <ChatTrustCaution
        reason={trustCaution.reason}
        onClose={() => setShowTrustCaution(false)}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Icon name="arrow-left" size={20} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{otherName?.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName} numberOfLines={1}>{otherName}</Text>
            {chat.adTitle ? (
              <Text style={styles.headerAd} numberOfLines={1}>{chat.adTitle}</Text>
            ) : null}
          </View>
        </View>

        <TouchableOpacity
          onPress={handleReportUser}
          style={styles.headerActionBtn}
          activeOpacity={0.7}
        >
          <Icon name="flag" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {renderTrustCaution()}

        {/* Messages */}
        {loading ? (
          <View style={[styles.msgList, styles.skeletonContainer]}>
            {CHAT_SKELETON.map((b, idx) => (
              <SkeletonCard
                key={`chat-skeleton-${idx}`}
                bubble
                align={b.align}
                width={b.width}
                height={b.height}
              />
            ))}
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item, idx) => item._id || String(idx)}
            renderItem={renderMessage}
            contentContainerStyle={styles.msgList}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.emptyText}>No messages yet. Say hi! 👋</Text>
              </View>
            }
          />
        )}

        {/* Fraud Warning */}
        {renderFraudWarning()}

        {/* Offer Bar */}
        {!isSeller && messages.length > 0 && fraudCheck?.type === 'SAFE' && (
          <View style={styles.offerBar}>
            {showOfferInput ? (
              <View style={styles.offerInputWrapper}>
                <TextInput
                  style={styles.offerInput}
                  placeholder="Enter amount ₹"
                  keyboardType="numeric"
                  value={offerAmount}
                  onChangeText={setOfferAmount}
                  autoFocus
                />
                <TouchableOpacity style={styles.offerSendBtn} onPress={sendOffer}>
                  <Text style={styles.offerSendText}>Send Offer</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowOfferInput(false)} style={styles.offerCancel}>
                   <Icon name="x" size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.offerTag}
                onPress={() => setShowOfferInput(true)}
              >
                <Icon name="tag" size={14} color={COLORS.primary} />
                <Text style={styles.offerTagText}>Make an Offer</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {isSeller && messages.length > 0 && (() => {
          const lastOfferMsg = [...messages].reverse().find(m => m.message?.includes('MADE AN OFFER:'));
          const isAccepted = messages.some(m => m.message?.includes('OFFER ACCEPTED'));

          console.log('Accept Offer Debug:', { hasOffer: !!lastOfferMsg, isAccepted, isSeller });

          if (lastOfferMsg && !isAccepted) {
            const amountMatch = lastOfferMsg.message.match(/₹(\d+)/);
            const amount = amountMatch ? amountMatch[1] : '';
            return (
              <View style={styles.offerBar}>
                <TouchableOpacity
                  style={[styles.offerTag, { borderColor: COLORS.success, alignSelf: 'flex-start' }]}
                  onPress={() => acceptOffer(amount)}
                >
                  <Icon name="check-circle" size={14} color={COLORS.success} />
                  <Text style={[styles.offerTagText, { color: COLORS.success }]}>Accept Offer (₹{amount})</Text>
                </TouchableOpacity>
              </View>
            );
          }
          return null;
        })()}

        {/* Input */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            onFocus={() => {
              setTimeout(() => {
                listRef.current?.scrollToEnd({ animated: true });
              }, 200);
            }}
          />
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={sendImage}
            disabled={uploadingImage}
          >
            <Icon name="image" size={26} color={uploadingImage ? COLORS.border : COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!input.trim() || sending}
            activeOpacity={0.85}
          >
            <Icon name="send" size={20} color={(!input.trim() || sending) ? '#94a3b8' : COLORS.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Fullscreen image viewer */}
      <Modal
        visible={!!viewerImage}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerImage(null)}
      >
        <View style={styles.viewerOverlay}>
          <TouchableOpacity style={styles.viewerClose} onPress={() => setViewerImage(null)}>
            <Icon name="x" size={26} color={COLORS.white} />
          </TouchableOpacity>
          <Image source={{ uri: viewerImage }} style={styles.viewerImage} resizeMode="contain" />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9fc' },
  header: {
    backgroundColor: COLORS.white,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    zIndex: 10,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.small,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
  headerInfo: { flex: 1 },
  headerName: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  headerAd: { color: COLORS.primary, fontSize: 13, fontWeight: '600', marginTop: 1 },
  headerStatus: { color: COLORS.success, fontSize: 12, fontWeight: '600' },
  headerActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  msgList: { paddingHorizontal: 16, paddingBottom: 20, paddingTop: 10 },
  skeletonContainer: { flex: 1 },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 20,
  },
  dateText: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 6,
  },
  bubbleThem: {
    backgroundColor: COLORS.white,
    alignSelf: 'flex-start',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 4,
    ...SHADOW.small,
  },
  bubbleMe: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-end',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 4,
  },
  bubbleMeLast: {
    borderBottomRightRadius: 0,
  },
  bubbleThemLast: {
    borderBottomLeftRadius: 0,
  },
  bubbleImage: { padding: 4 },
  chatImage: {
    width: 220,
    height: 220,
    borderRadius: 14,
    backgroundColor: COLORS.background,
  },
  imageUploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleText: { fontSize: 15, color: COLORS.text, lineHeight: 21 },
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  bubbleTime: { fontSize: 10, color: COLORS.textMuted },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? Math.max(useSafeAreaInsets().bottom, 16) : 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  attachBtn: {
    width: 38,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerImage: { width: '100%', height: '80%' },
  viewerClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 120,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 3,
  },
  sendBtnDisabled: {
    backgroundColor: '#e2e8f0',
    shadowOpacity: 0,
    elevation: 0,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { color: COLORS.textMuted, fontSize: 14 },
  offerBar: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  offerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: COLORS.primary,
    ...SHADOW?.small,
  },
  offerTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  offerInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    padding: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  offerInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  offerSendBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  offerSendText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  offerCancel: {
    padding: 4,
  },
  fraudWrapper: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  fraudCard: {
    backgroundColor: '#fffdf0',
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fef3c7',
    ...Platform.select({
      ios: {
        shadowColor: '#b45309',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  fraudHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  fraudTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fraudTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400e',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  fraudClose: {
    padding: 4,
  },
  fraudBody: {
    gap: 10,
  },
  indicatorList: {
    gap: 6,
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#d97706',
    marginTop: 6,
  },
  fraudIndicator: {
    flex: 1,
    fontSize: 13,
    color: '#78350f',
    lineHeight: 18,
  },
  recommendationBox: {
    backgroundColor: 'rgba(217, 119, 6, 0.05)',
    padding: 10,
    borderRadius: RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  recommendationLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b45309',
    marginBottom: 2,
  },
  fraudRecommendation: {
    fontSize: 12,
    color: COLORS.text,
    lineHeight: 17,
  },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: RADIUS.md,
    marginTop: 4,
  },
  reportBtnText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: '700',
  },
});

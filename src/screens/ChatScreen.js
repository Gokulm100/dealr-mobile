// src/screens/ChatScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard, Alert,
} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import Icon from '../components/Icon';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useMessages } from '../context/MessagesContext';
import { useIsFocused } from '@react-navigation/native';
import { checkAndPromptNotifications } from '../utils/notifications';
import { getSocket } from '../utils/socket';

export default function ChatScreen({ route, navigation }) {
  const { chat, otherName, isSeller } = route.params;
  const { user } = useAuth();
  const { refresh, messageCount } = useMessages();
  const isFocused = useIsFocused();
  const [messages, setMessages] = useState([]);
  const [fraudCheck, setFraudCheck] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showOfferInput, setShowOfferInput] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
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
    fetchMessages();
    markAsSeen();

    // WebSocket Setup
    const socket = getSocket(user?._id);

    console.log('DEBUG: Emitting join event with ID:', user?._id);
    socket.emit('join', user?._id);

    socket.on('chat:new-message', (payload) => {
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
    });

    // Prompt for notifications
    setTimeout(checkAndPromptNotifications, 1000);

    const keyboardShowSub = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => {
      keyboardShowSub.remove();
      socket.off('chat:new-message');
      socket.emit('leave', user?._id);
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
          isMe ? styles.bubbleMe : styles.bubbleThem,
          isMe ? (isLastInGroup ? styles.bubbleMeLast : null) : (isLastInGroup ? styles.bubbleThemLast : null)
        ]}>
          <Text style={[styles.bubbleText, isMe && { color: COLORS.white }]}>
            {item.message}
          </Text>
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Icon name="arrow-left" size={20} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{otherName?.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName} numberOfLines={1}>{otherName}</Text>
            {chat.adTitle ? (
              <Text style={styles.headerAd} numberOfLines={1}>{chat.adTitle}</Text>
            ) : (
              <Text style={styles.headerStatus}>Online</Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          onPress={handleReportUser}
          style={styles.headerActionBtn}
          activeOpacity={0.7}
        >
          <Icon name="flag" size={18} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Messages */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={COLORS.primary} />
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
            style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!input.trim() || sending}
          >
            <Icon name="send" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9fc' },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOW.medium,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerInfo: { flex: 1 },
  headerName: { color: COLORS.white, fontSize: 17, fontWeight: '700' },
  headerAd: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 1 },
  headerStatus: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  msgList: { paddingHorizontal: 16, paddingBottom: 20, paddingTop: 10 },
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
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 4,
    backgroundColor: COLORS.white,
    ...SHADOW.small,
  },
  bubbleThem: {
    alignSelf: 'flex-start',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomLeftRadius: 4,
  },
  bubbleMe: {
    backgroundColor: COLORS.accent,
    alignSelf: 'flex-end',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4,
  },
  bubbleMeLast: {
    borderBottomRightRadius: 0,
  },
  bubbleThemLast: {
    borderBottomLeftRadius: 0,
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
    gap: 10,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 25 : 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 120,
    color: COLORS.text,
  },
  sendBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 22,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.small,
  },
  sendBtnDisabled: { backgroundColor: COLORS.border },
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

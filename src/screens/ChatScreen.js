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
      console.log('ChatScreen: messageCount changed, refreshing messages...');
      fetchMessages(true);
      markAsSeen();
    }
  }, [messageCount, isFocused]);

  // Watch for messageCount changes to trigger a refresh
  useEffect(() => {
    if (isFocused) {
      console.log('ChatScreen: messageCount changed, refreshing messages...');
      fetchMessages(true);
      markAsSeen();
    }
  }, [messageCount, isFocused]);

  useEffect(() => {
    fetchMessages();
    markAsSeen();

    // Listen for incoming messages while in this chat
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('ChatScreen: Received foreground FCM:', remoteMessage.data);

      const data = remoteMessage.data || {};
      const incomingAdId = (data.adId || data.ad_id || data.listingId)?.toString();
      const incomingSenderId = (data.senderId || data.from || data.sender_id)?.toString();

      const currentAdId = adId?.toString();
      const expectedSenderId = (isSeller ? buyerId : sellerId)?.toString();

      console.log(`Matching Attempt: Ad(${incomingAdId}===${currentAdId}) Sender(${incomingSenderId}===${expectedSenderId})`);

      if (incomingAdId === currentAdId && incomingSenderId === expectedSenderId) {
        console.log('Match found! Reloading messages...');
        fetchMessages(true);
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
      unsubscribe();
    };
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setSending(true);
    const text = input.trim();
    setInput('');
    try {
      await apiFetch('/api/ads/chat', {
        method: 'POST',
        body: JSON.stringify({
          adId,
          from:isSeller? sellerId: buyerId,
          to:isSeller? buyerId:sellerId,
          message: text
           }),
      });
      fetchMessages(true);
    } catch (e) {
    console.log('hii')
      console.warn('sendMessage error:', e?.message);
    } finally {
      setSending(false);
    }
  };

  const sendOffer = async () => {
    if (!offerAmount.trim()) return;
    setSending(true);
    const amount = offerAmount.trim();
    setOfferAmount('');
    setShowOfferInput(false);
    try {
      await apiFetch('/api/ads/chat', {
        method: 'POST',
        body: JSON.stringify({
          adId,
          from: isSeller ? sellerId : buyerId,
          to: isSeller ? buyerId : sellerId,
          message: `THE BUYER MADE AN OFFER: ₹${amount}`,
          isOffer: true,
          amount: amount
        }),
      });
      fetchMessages(true);
    } catch (e) {
      console.warn('sendOffer error:', e?.message);
    } finally {
      setSending(false);
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

    return (
      <View>
        {showDateSeparator && item.createdAt && (
          <View style={styles.dateSeparator}>
            <View style={styles.dateLine} />
            <Text style={styles.dateText}>{formatDateSeparator(item.createdAt)}</Text>
            <View style={styles.dateLine} />
          </View>
        )}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          <Text style={[styles.bubbleText, isMe && { color: COLORS.white }]}>
            {item.message}
          </Text>
          {item.createdAt && (
            <Text style={[styles.bubbleTime, isMe && { color: 'rgba(255,255,255,0.7)' }]}>
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
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
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Icon name="arrow-left" size={20} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{otherName}</Text>
          {chat.adTitle ? (
            <Text style={styles.headerAd} numberOfLines={1}>{chat.adTitle}</Text>
          ) : null}
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
        {!isSeller && messages.length > 0 && (
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
  container: { flex: 1, backgroundColor: '#f0f4ff' },
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
  headerInfo: { flex: 1 },
  headerName: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  headerAd: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 1 },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  msgList: { padding: 14, paddingBottom: 8 },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 8,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
    opacity: 0.5,
  },
  dateText: {
    paddingHorizontal: 12,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: RADIUS.lg,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginBottom: 8,
    backgroundColor: COLORS.white,
    alignSelf: 'flex-start',
  },
  bubbleMe: { backgroundColor: COLORS.accent, alignSelf: 'flex-end' },
  bubbleText: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  bubbleTime: { fontSize: 10, color: COLORS.textMuted, marginTop: 4, textAlign: 'right' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    paddingVertical: 9,
    fontSize: 14,
    maxHeight: 100,
    color: COLORS.text,
  },
  sendBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.full,
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
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

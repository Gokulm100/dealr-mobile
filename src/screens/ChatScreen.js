// src/screens/ChatScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard,
} from 'react-native';
import Icon from '../components/Icon';
import { COLORS, RADIUS } from '../utils/theme';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useMessages } from '../context/MessagesContext';

export default function ChatScreen({ route, navigation }) {
  const { chat, otherName, isSeller } = route.params;
  const { user } = useAuth();
  const { refresh } = useMessages();
  const [messages, setMessages] = useState([]);
  const [fraudCheck, setFraudCheck] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
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

  useEffect(() => {
    fetchMessages();
    markAsSeen();

    const keyboardShowSub = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => {
      keyboardShowSub.remove();
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
});

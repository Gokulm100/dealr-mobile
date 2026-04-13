// src/screens/ChatScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import Icon from '../components/Icon';
import { COLORS, RADIUS } from '../utils/theme';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function ChatScreen({ route, navigation }) {
  const { chat, otherName, isSeller } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(
        `/api/ads/chat?adId=${chat.adId || chat._id}&sellerId=${chat.sellerId}&buyerId=${chat.buyerId}`
      );
      const msgs = Array.isArray(data.chats) ? data.chats : [];
      setMessages(msgs);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMessages(); }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setSending(true);
    const text = input.trim();
    setInput('');
    try {
      await apiFetch('/api/ads/chat', {
        method: 'POST',
        body: JSON.stringify({
          adId: chat.adId || chat._id,
          sellerId: chat.sellerId,
          buyerId: chat.buyerId,
          message: text,
          senderType: isSeller ? 'seller' : 'buyer',
        }),
      });
      fetchMessages();
    } catch {}
    finally { setSending(false); }
  };

  const renderMessage = ({ item }) => {
    const isMe = isSeller
      ? item.senderType === 'seller'
      : item.senderType === 'buyer';

    return (
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
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{otherName}</Text>
          {chat.adTitle && (
            <Text style={styles.headerAd} numberOfLines={1}>{chat.adTitle}</Text>
          )}
        </View>
      </View>

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

      {/* Input */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!input.trim() || sending}
        >
          {sending
            ? <ActivityIndicator size="small" color={COLORS.white} />
            : <Icon name="send" size={18} color={COLORS.white} />
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerInfo: { flex: 1 },
  headerName: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  headerAd: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 1 },
  msgList: { padding: 14, paddingBottom: 8 },
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
});

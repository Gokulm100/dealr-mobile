// src/components/ChatTrustCaution.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from './Icon';
import { COLORS, RADIUS } from '../utils/theme';

export default function ChatTrustCaution({ reason, onClose }) {
  if (!reason) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.iconCircle}>
        <Icon name="alert-circle" size={16} color="#b45309" />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>Caution</Text>
        <Text style={styles.reason}>{reason}</Text>
      </View>
      {onClose && (
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="x" size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 4,
    padding: 12,
    backgroundColor: '#fff7ed',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffedd5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  body: { flex: 1 },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: '#9a3412',
    marginBottom: 2,
  },
  reason: {
    fontSize: 13,
    lineHeight: 18,
    color: '#7c2d12',
    fontWeight: '500',
  },
});

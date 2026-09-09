import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import Icon from '../Icon';
import { COLORS, RADIUS } from '../../utils/theme';

export function AdminCard({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function AdminEmpty({ children }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{children}</Text>
    </View>
  );
}

export function AdminSearch({ value, onChangeText, placeholder }) {
  return (
    <View style={styles.search}>
      <Icon name="search" size={16} color={COLORS.textMuted} />
      <TextInput
        style={styles.searchInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {!!value && (
        <TouchableOpacity onPress={() => onChangeText('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="x" size={14} color={COLORS.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export function AdminPills({ options, value, onChange }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
      {options.map(({ id, label }) => {
        const active = value === id;
        return (
          <TouchableOpacity
            key={id}
            style={[styles.pill, active && styles.pillActive]}
            onPress={() => onChange(id)}
          >
            <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

export function AdminStatus({ status, label }) {
  const tone = STATUS_TONES[status] || STATUS_TONES.default;
  return (
    <View style={[styles.status, { backgroundColor: tone.bg }]}>
      <Text style={[styles.statusText, { color: tone.fg }]}>{label || status}</Text>
    </View>
  );
}

export function AdminActionBtn({ label, tone = 'ghost', disabled, onPress }) {
  const palette = ACTION_TONES[tone] || ACTION_TONES.ghost;
  return (
    <TouchableOpacity
      style={[styles.actionBtn, { backgroundColor: palette.bg, borderColor: palette.border }, disabled && styles.actionDisabled]}
      disabled={disabled}
      onPress={onPress}
    >
      {disabled ? (
        <ActivityIndicator size="small" color={palette.fg} />
      ) : (
        <Text style={[styles.actionText, { color: palette.fg }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const STATUS_TONES = {
  active: { bg: '#f0fdf4', fg: '#15803d' },
  inactive: { bg: '#fef2f2', fg: '#b91c1c' },
  pending: { bg: '#fff7ed', fg: '#c2410c' },
  resolved: { bg: '#f1f5f9', fg: '#475569' },
  dismissed: { bg: '#f1f5f9', fg: '#475569' },
  default: { bg: '#f1f5f9', fg: '#475569' },
};

const ACTION_TONES = {
  ghost: { bg: '#f8fafc', border: '#e8eef5', fg: COLORS.textMuted },
  success: { bg: '#f0fdf4', border: '#bbf7d0', fg: '#15803d' },
  danger: { bg: '#fef2f2', border: '#fecaca', fg: '#b91c1c' },
  admin: { bg: '#fffbeb', border: '#fde68a', fg: '#b45309' },
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.95)',
    overflow: 'hidden',
    marginBottom: 14,
  },
  empty: { paddingVertical: 28, paddingHorizontal: 16, alignItems: 'center' },
  emptyText: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 42,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e8eef5',
    backgroundColor: '#f8fafc',
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text, paddingVertical: 0 },
  pills: { flexDirection: 'row', gap: 6, paddingVertical: 2 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e8eef5',
    backgroundColor: COLORS.white,
  },
  pillActive: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  pillText: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted },
  pillTextActive: { color: COLORS.primary },
  status: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'capitalize' },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionDisabled: { opacity: 0.55 },
  actionText: { fontSize: 12, fontWeight: '700' },
});

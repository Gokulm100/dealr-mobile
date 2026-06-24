// src/components/TrustBadge.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from './Icon';
import { COLORS } from '../utils/theme';

const BADGE_STYLES = {
  trusted: { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
  established: { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  new: { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' },
  caution: { bg: '#fff1f2', color: '#dc2626', border: '#fecaca' },
};

export default function TrustBadge({ badges = [], trustScore, size = 'md', showScore = false }) {
  const badge = badges?.[0];
  if (!badge && trustScore == null) return null;

  const style = badge ? (BADGE_STYLES[badge.level] || BADGE_STYLES.new) : BADGE_STYLES.new;
  const compact = size === 'sm';

  return (
    <View style={styles.wrap}>
      {badge && (
        <View style={[
          styles.badge,
          compact && styles.badgeSm,
          { backgroundColor: style.bg, borderColor: style.border },
        ]}>
          {badge.level === 'caution' && (
            <Icon name="shield" size={compact ? 10 : 11} color={style.color} />
          )}
          <Text style={[styles.badgeText, compact && styles.badgeTextSm, { color: style.color }]}>
            {badge.label}
          </Text>
        </View>
      )}
      {showScore && trustScore != null && (
        <Text style={[styles.scoreText, compact && styles.scoreTextSm]}>
          Trust {trustScore}/100
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeSm: { paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: '800' },
  badgeTextSm: { fontSize: 11 },
  scoreText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  scoreTextSm: { fontSize: 11 },
});

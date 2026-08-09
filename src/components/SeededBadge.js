import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from './Icon';
import { COLORS, RADIUS } from '../utils/theme';

const TITLE = 'This listing was seeded for demo/testing. It may not be a real offer.';

/** Compact badge for cards and detail tags. */
export default function SeededBadge({ size = 'md', style }) {
  const sm = size === 'sm';
  return (
    <View
      style={[styles.badge, sm && styles.badgeSm, style]}
      accessibilityRole="text"
      accessibilityLabel="Demo listing — seeded sample data"
      accessibilityHint={TITLE}
    >
      <Icon name="beaker" size={sm ? 11 : 13} color="#6d28d9" />
      <Text style={[styles.badgeText, sm && styles.badgeTextSm]}>Demo listing</Text>
    </View>
  );
}

/** Longer notice used on the ad detail page. */
export function SeededNotice({ style }) {
  return (
    <View style={[styles.notice, style]} accessibilityRole="summary">
      <Icon name="beaker" size={16} color="#6d28d9" />
      <View style={styles.noticeCopy}>
        <Text style={styles.noticeTitle}>Demo / seeded data</Text>
        <Text style={styles.noticeBody}>
          This listing was added for testing browse, search, and filters. Treat it as sample
          content — not a confirmed real-world offer.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    backgroundColor: '#f3e8ff',
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6d28d9',
    letterSpacing: 0.2,
  },
  badgeTextSm: {
    fontSize: 10,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 12,
    marginBottom: 4,
    padding: 14,
    borderRadius: RADIUS.md,
    backgroundColor: '#faf5ff',
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  noticeCopy: {
    flex: 1,
    gap: 4,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#5b21b6',
  },
  noticeBody: {
    fontSize: 12,
    lineHeight: 18,
    color: '#6b7280',
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from './Icon';
import { COLORS, RADIUS } from '../utils/theme';

// Smoothing keeps brand-new ads (very few views) from being tanked by a
// single report. As views grow, the score converges to the literal
// reports-over-views ratio.
const SMOOTHING = 10;

const LEVEL_COLORS = {
  high: '#16a34a',
  good: '#84cc16',
  caution: '#f59e0b',
  low: '#ef4444',
};

const SEGMENTS = 10;

export function computeGenuineness(views = 0, reports = 0) {
  const v = Math.max(0, Number(views) || 0);
  const r = Math.max(0, Number(reports) || 0);
  const ratio = r / (v + SMOOTHING);
  const score = Math.round(Math.max(0, Math.min(1, 1 - ratio)) * 100);

  let level, label;
  if (score >= 80) { level = 'high'; label = 'Likely genuine'; }
  else if (score >= 60) { level = 'good'; label = 'Mostly genuine'; }
  else if (score >= 40) { level = 'caution'; label = 'Use caution'; }
  else { level = 'low'; label = 'High risk'; }

  return { score, level, label, lowData: v < 5, views: v, reports: r };
}

export default function GenuinityMeter({ views = 0, reports = 0, embedded = false }) {
  const { score, level, label, lowData, reports: r, views: v } = computeGenuineness(views, reports);
  const color = LEVEL_COLORS[level];
  const filled = Math.max(0, Math.min(SEGMENTS, Math.round((score / 100) * SEGMENTS)));

  return (
    <View style={embedded ? styles.embed : styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Icon name="heart" size={16} color={color} fill={color} />
          <Text style={styles.title}>Genuineness</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: color + '1F' }]}>
          <Text style={[styles.badgeText, { color }]}>{label}</Text>
        </View>
      </View>

      <View style={styles.health}>
        <View style={styles.segments}>
          {Array.from({ length: SEGMENTS }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.segment,
                i === 0 && styles.segmentFirst,
                i === SEGMENTS - 1 && styles.segmentLast,
                { backgroundColor: i < filled ? color : COLORS.border },
              ]}
            />
          ))}
        </View>
        <Text style={[styles.score, { color }]}>{score}%</Text>
      </View>

      <Text style={styles.sub}>
        {lowData
          ? 'Not enough views yet for a reliable score'
          : `Based on ${r} report${r === 1 ? '' : 's'} across ${v} view${v === 1 ? '' : 's'}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  embed: {
    paddingTop: 16,
    marginBottom: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  badgeText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  health: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  segments: { flex: 1, flexDirection: 'row', gap: 3, height: 14 },
  segment: { flex: 1, borderRadius: 2 },
  segmentFirst: { borderTopLeftRadius: 7, borderBottomLeftRadius: 7 },
  segmentLast: { borderTopRightRadius: 7, borderBottomRightRadius: 7 },
  score: { fontSize: 16, fontWeight: '800', minWidth: 44, textAlign: 'right' },
  sub: { fontSize: 12, color: COLORS.textMuted, marginTop: 8 },
});

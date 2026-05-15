// src/components/AiAnalytics.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { apiFetch } from '../utils/api';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';
import Icon from './Icon';

const METRIC_ACCENTS = ['#378cf6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];

const FEATURES = [
  { label: 'Performance metrics', emoji: '📊' },
  { label: 'Market comparison', emoji: '📈' },
  { label: 'Actionable tips', emoji: '💡' },
];

function SegmentBar({ segments, activeKey, onChange }) {
  return (
    <View style={styles.segmentBar}>
      {segments.map((seg) => {
        const active = activeKey === seg.key;
        return (
          <TouchableOpacity
            key={seg.key}
            style={[styles.segment, active && styles.segmentActive]}
            onPress={() => onChange(seg.key)}
            activeOpacity={0.85}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
              {seg.label}
            </Text>
            {seg.count > 0 && (
              <View style={[styles.segmentCount, active && styles.segmentCountActive]}>
                <Text style={[styles.segmentCountText, active && styles.segmentCountTextActive]}>
                  {seg.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MetricExplorer({ insights }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const selected = insights[selectedIdx];
  const accent = METRIC_ACCENTS[selectedIdx % METRIC_ACCENTS.length];

  if (!insights.length) {
    return (
      <View style={styles.emptyBlock}>
        <Text style={styles.emptyBlockText}>No metrics available yet.</Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.hintText}>Tap a metric to read the full analysis</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statStrip}
      >
        {insights.map((insight, idx) => {
          const itemAccent = METRIC_ACCENTS[idx % METRIC_ACCENTS.length];
          const isActive = selectedIdx === idx;
          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.statChip,
                isActive && { borderColor: itemAccent, backgroundColor: '#eff6ff' },
              ]}
              onPress={() => setSelectedIdx(idx)}
              activeOpacity={0.88}
            >
              <Text style={styles.statChipLabel} numberOfLines={2}>
                {insight.title}
              </Text>
              <Text style={[styles.statChipValue, { color: itemAccent }]} numberOfLines={2}>
                {insight.value}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {selected && (
        <View style={[styles.detailPanel, { borderLeftColor: accent }]}>
          <Text style={styles.detailTitle}>{selected.title}</Text>
          <Text style={[styles.detailValue, { color: accent }]}>{selected.value}</Text>
          {!!selected.description && (
            <Text style={styles.detailDesc}>{selected.description}</Text>
          )}
        </View>
      )}
    </View>
  );
}

function TipsAccordion({ suggestions }) {
  const [expandedIdx, setExpandedIdx] = useState(0);

  if (!suggestions.length) return null;

  return (
    <View>
      <Text style={styles.hintText}>Tap a tip to expand details</Text>
      <View style={styles.tipsAccordion}>
        {suggestions.map((tip, idx) => {
          const open = expandedIdx === idx;
          return (
            <TouchableOpacity
              key={idx}
              style={[styles.tipRow, open && styles.tipRowOpen]}
              onPress={() => setExpandedIdx(open ? -1 : idx)}
              activeOpacity={0.9}
            >
              <View style={styles.tipRowHeader}>
                <View style={styles.tipIndex}>
                  <Text style={styles.tipIndexText}>{idx + 1}</Text>
                </View>
                <Text style={styles.tipRowTitle}>{tip.title}</Text>
                <Text style={styles.tipChevron}>{open ? '▾' : '▸'}</Text>
              </View>
              {open && !!tip.description && (
                <Text style={styles.tipRowDesc}>{tip.description}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function AiAnalytics({ ad }) {
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [insights, setInsights] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('metrics');

  const handleGenerate = async () => {
    if (!ad) return;
    setLoading(true);
    setGenerated(true);
    setError(null);
    try {
      const data = await apiFetch('/api/ai/provideAiAnalytics', {
        method: 'POST',
        body: JSON.stringify({
          adId: ad.id || ad._id || '',
          category: ad.categoryId || ad.category || '',
          subCategory: ad.subCategory || '',
        }),
      });
      setInsights(Array.isArray(data.data?.analysis) ? data.data.analysis : []);
      setSuggestions(Array.isArray(data.data?.recommendations) ? data.data.recommendations : []);
      setActiveTab('metrics');
    } catch {
      setError('Could not load AI analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!generated) {
    return (
      <View style={styles.card}>
        <View style={styles.promptHero}>
          <View style={styles.promptIconWrap}>
            <Icon name="AI" size={22} color="#7f5af0" />
          </View>
          <View style={styles.promptCopy}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>AI INSIGHTS</Text>
            </View>
            <Text style={styles.promptTitle}>Understand how your ad is performing</Text>
            <Text style={styles.promptSubtitle}>
              Get a quick breakdown of views, pricing, and what to improve next.
            </Text>
          </View>
        </View>

        <View style={styles.featureList}>
          {FEATURES.map((f) => (
            <View key={f.label} style={styles.featureRow}>
              <Text style={styles.featureEmoji}>{f.emoji}</Text>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={handleGenerate} activeOpacity={0.88}>
          <Icon name="AI" size={16} color={COLORS.white} />
          <Text style={styles.primaryBtnText}>Generate insights</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.card}>
        <View style={styles.loadingWrap}>
          <View style={styles.loadingRing}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
          <Text style={styles.loadingTitle}>Analyzing your listing</Text>
          <Text style={styles.loadingSubtitle}>Checking trends and optimization opportunities…</Text>
          <View style={styles.loadingDots}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.loadingDot, i === 1 && styles.loadingDotMid]} />
            ))}
          </View>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.card}>
        <View style={styles.errorWrap}>
          <View style={styles.errorIconWrap}>
            <Icon name="alert-circle" size={22} color={COLORS.error} />
          </View>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleGenerate} activeOpacity={0.88}>
            <Icon name="refresh" size={14} color={COLORS.primary} />
            <Text style={styles.secondaryBtnText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const segments = [
    { key: 'metrics', label: 'Metrics', count: insights.length },
    { key: 'tips', label: 'Tips', count: suggestions.length },
  ];

  const headlineMetric = insights[0];

  return (
    <View style={styles.card}>
      <View style={styles.resultsHeader}>
        <View style={styles.resultsHeaderLeft}>
          <View style={styles.headerIcon}>
            <Icon name="AI" size={16} color="#7f5af0" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.resultsTitle}>Ad analytics</Text>
            <Text style={styles.resultsSubtitle}>Powered by AI</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={handleGenerate}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="refresh" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {headlineMetric && (
        <View style={styles.snapshot}>
          <Text style={styles.snapshotLabel}>At a glance</Text>
          <Text style={styles.snapshotValue}>{headlineMetric.value}</Text>
          <Text style={styles.snapshotMeta} numberOfLines={2}>
            {headlineMetric.title}
            {insights.length > 1 ? ` · +${insights.length - 1} more metrics` : ''}
            {suggestions.length > 0 ? ` · ${suggestions.length} tips` : ''}
          </Text>
        </View>
      )}

      <SegmentBar segments={segments} activeKey={activeTab} onChange={setActiveTab} />

      {activeTab === 'metrics' ? (
        <MetricExplorer insights={insights} />
      ) : suggestions.length > 0 ? (
        <TipsAccordion suggestions={suggestions} />
      ) : (
        <View style={styles.emptyBlock}>
          <Text style={styles.emptyBlockText}>No tips for this listing right now.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e8eef7',
    ...SHADOW.small,
  },

  promptHero: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 18,
  },
  promptIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#f3f0ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptCopy: { flex: 1 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ede9fe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7f5af0',
    letterSpacing: 0.8,
  },
  promptTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: 6,
  },
  promptSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  featureList: {
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.lg,
    padding: 14,
    gap: 10,
    marginBottom: 18,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureEmoji: { fontSize: 16 },
  featureLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    ...SHADOW.small,
  },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.white },

  loadingWrap: { alignItems: 'center', paddingVertical: 28 },
  loadingRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  loadingTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  loadingSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  loadingDots: { flexDirection: 'row', gap: 6, marginTop: 20 },
  loadingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#cbd5e1' },
  loadingDotMid: { backgroundColor: COLORS.primary, width: 18 },

  errorWrap: { alignItems: 'center', paddingVertical: 16 },
  errorIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  errorTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  errorText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: '#eff6ff',
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },

  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  resultsHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f3f0ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultsTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  resultsSubtitle: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  snapshot: {
    backgroundColor: '#f3f0ff',
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 16,
  },
  snapshotLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7f5af0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  snapshotValue: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 4,
  },
  snapshotMeta: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },

  segmentBar: {
    flexDirection: 'row',
    backgroundColor: '#f1f3f5',
    borderRadius: RADIUS.lg,
    padding: 4,
    marginBottom: 14,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  segmentActive: {
    backgroundColor: COLORS.white,
    ...SHADOW.small,
  },
  segmentText: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted },
  segmentTextActive: { color: COLORS.primary, fontWeight: '700' },
  segmentCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  segmentCountActive: { backgroundColor: COLORS.primary },
  segmentCountText: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted },
  segmentCountTextActive: { color: COLORS.white },

  hintText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 10,
  },

  statStrip: { gap: 10, paddingBottom: 4 },
  statChip: {
    width: 132,
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  statChipLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 6,
    lineHeight: 13,
  },
  statChipValue: {
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 20,
  },

  detailPanel: {
    marginTop: 14,
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.lg,
    padding: 16,
    borderLeftWidth: 4,
  },
  detailTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 10,
    lineHeight: 24,
  },
  detailDesc: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 21,
  },

  emptyBlock: {
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.md,
    padding: 20,
    alignItems: 'center',
  },
  emptyBlockText: { fontSize: 13, color: COLORS.textMuted },

  tipsAccordion: { gap: 8 },
  tipRow: {
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#eef2f7',
  },
  tipRowOpen: {
    backgroundColor: '#fafbff',
    borderColor: '#c7d9f5',
  },
  tipRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tipIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipIndexText: { fontSize: 11, fontWeight: '800', color: COLORS.white },
  tipRowTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 19,
  },
  tipChevron: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  tipRowDesc: {
    marginTop: 12,
    marginLeft: 34,
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
});

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
  { label: 'Performance metrics', icon: 'trending-up', color: '#378cf6' },
  { label: 'Market comparison', icon: 'award', color: '#8b5cf6' },
  { label: 'Actionable tips', icon: 'tag', color: '#10b981' },
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
                isActive && { backgroundColor: itemAccent },
              ]}
              onPress={() => setSelectedIdx(idx)}
              activeOpacity={0.88}
            >
              <Text style={[styles.statChipLabel, isActive && { color: 'rgba(255,255,255,0.8)' }]} numberOfLines={1}>
                {insight.title}
              </Text>
              <Text style={[styles.statChipValue, { color: isActive ? COLORS.white : itemAccent }]} numberOfLines={1}>
                {insight.value}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {selected && (
        <View style={styles.detailPanel}>
          <View style={[styles.detailHeader, { backgroundColor: accent + '10' }]}>
            <View style={[styles.detailIcon, { backgroundColor: accent }]}>
              <Icon name="trending-up" size={16} color={COLORS.white} />
            </View>
            <Text style={[styles.detailTitle, { color: accent }]}>{selected.title}</Text>
          </View>
          <View style={styles.detailBody}>
            <Text style={styles.detailValueText}>{selected.value}</Text>
            {!!selected.description && (
              <Text style={styles.detailDesc}>{selected.description}</Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

function TipsAccordion({ suggestions }) {
  const [expandedIdx, setExpandedIdx] = useState(0);

  if (!suggestions.length) return null;

  return (
    <View style={styles.tipsContainer}>
      {suggestions.map((tip, idx) => {
        const open = expandedIdx === idx;
        const impact = idx === 0 ? 'High Impact' : 'Recommended';
        const impactColor = idx === 0 ? COLORS.error : COLORS.primary;

        return (
          <TouchableOpacity
            key={idx}
            style={[styles.tipRow, open && styles.tipRowOpen]}
            onPress={() => setExpandedIdx(open ? -1 : idx)}
            activeOpacity={0.9}
          >
            <View style={styles.tipRowHeader}>
              <View style={styles.tipTitleGroup}>
                <View style={[styles.impactBadge, { backgroundColor: impactColor + '15' }]}>
                  <Text style={[styles.impactText, { color: impactColor }]}>{impact}</Text>
                </View>
                <Text style={styles.tipRowTitle}>{tip.title}</Text>
              </View>
              <Icon name={open ? 'chevron-down' : 'chevron-right'} size={20} color={COLORS.textMuted} />
            </View>
            {open && !!tip.description && (
              <View style={styles.tipContent}>
                <View style={styles.tipDivider} />
                <Text style={styles.tipRowDesc}>{tip.description}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
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
            <Icon name="AI" size={32} color="#7f5af0" />
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
              <View style={[styles.featureIconWrap, { backgroundColor: f.color + '15' }]}>
                <Icon name={f.icon} size={18} color={f.color} />
              </View>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={handleGenerate} activeOpacity={0.88}>
          <Icon name="AI" size={18} color={COLORS.white} />
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
            <Icon name="AI" size={20} color="#7f5af0" />
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
          <Icon name="refresh" size={18} color={COLORS.primary} />
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
    marginBottom: 32,
  },

  promptHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  promptIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptCopy: { flex: 1 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1.2,
  },
  promptTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    lineHeight: 26,
    marginBottom: 4,
  },
  promptSubtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
    lineHeight: 22,
  },
  featureList: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    ...SHADOW.small,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.white },

  loadingWrap: { alignItems: 'center', paddingVertical: 48 },
  loadingRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  loadingTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  loadingSubtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  loadingDots: { flexDirection: 'row', gap: 10, marginTop: 32 },
  loadingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E2E8F0' },
  loadingDotMid: { backgroundColor: COLORS.primary, width: 28 },

  errorWrap: { alignItems: 'center', paddingVertical: 32 },
  errorIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  errorTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  errorText: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  secondaryBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.text },

  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  resultsHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultsTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  resultsSubtitle: { fontSize: 14, color: COLORS.textMuted, fontWeight: '600', marginTop: 2 },
  refreshBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  snapshot: {
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  snapshotLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#8B5CF6',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  snapshotValue: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 6,
  },
  snapshotMeta: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
    fontWeight: '500',
  },

  segmentBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
    borderRadius: 10,
  },
  segmentActive: {
    backgroundColor: COLORS.white,
    ...SHADOW.small,
  },
  segmentText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
  segmentTextActive: { color: COLORS.primary, fontWeight: '700' },
  segmentCount: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  segmentCountActive: { backgroundColor: COLORS.primary },
  segmentCountText: { fontSize: 13, fontWeight: '800', color: '#64748B' },
  segmentCountTextActive: { color: COLORS.white },

  statStrip: { gap: 16, paddingBottom: 8 },
  statChip: {
    width: 130,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statChipLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  statChipValue: {
    fontSize: 18,
    fontWeight: '900',
  },

  detailPanel: {
    marginTop: 24,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOW.medium,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTitle: {
    fontSize: 15,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  detailBody: {
    padding: 20,
  },
  detailValueText: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 8,
  },
  detailDesc: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },

  tipsContainer: { gap: 16 },
  tipRow: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tipRowOpen: {
    borderColor: COLORS.primary,
    backgroundColor: '#F8FAFF',
  },
  tipRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tipTitleGroup: {
    flex: 1,
    gap: 8,
    marginRight: 12,
  },
  impactBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  impactText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  tipRowTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 22,
  },
  tipContent: {
    marginTop: 20,
  },
  tipDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 20,
  },
  tipRowDesc: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },

  emptyBlock: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
  },
  emptyBlockText: { fontSize: 16, color: COLORS.textMuted, fontWeight: '500' },
});

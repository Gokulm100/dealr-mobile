// src/components/AiAnalytics.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  Animated,
  Easing,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { apiFetch } from '../utils/api';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';
import Icon from './Icon';
import {
  GEMINI,
  useGradientId,
  SparklesIcon,
  GradientText,
  GeminiCardBackground,
  GeminiAnalyzingVisual,
} from './geminiBrand';

const CARD_ACCENTS = ['#4285f4', '#9b72cb', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];
const BORDER = '#e5e7eb';
const ANALYZE_TITLE_W = 220;

const FEATURES = [
  { label: 'Performance metrics', icon: 'trending-up' },
  { label: 'Market comparison', icon: 'award' },
  { label: 'Actionable tips', icon: 'tag' },
];

const TONE_COLOR = { strong: '#10b981', good: '#378cf6', fair: '#f59e0b', low: '#ef4444' };

const STATUS_STYLES = {
  strong: { bg: '#d1fae5', text: '#047857' },
  good: { bg: '#dbeafe', text: '#1d4ed8' },
  fair: { bg: '#fef3c7', text: '#b45309' },
  low: { bg: '#fee2e2', text: '#b91c1c' },
};

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function accentRgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

function tipRowStyle(accent, open) {
  if (open) {
    return {
      backgroundColor: accentRgba(accent, 0.09),
      borderLeftWidth: 3,
      borderLeftColor: accent,
    };
  }
  return { backgroundColor: accentRgba(accent, 0.04) };
}

function parseMetricNumber(value) {
  if (value == null || value === '') return null;
  const s = String(value).trim();
  const pct = s.match(/([\d.]+)\s*%/);
  if (pct) return { num: parseFloat(pct[1]), max: 100 };
  const cleaned = s.replace(/[,₹\s]/g, '');
  const numMatch = cleaned.match(/([\d.]+)/);
  if (numMatch) {
    const num = parseFloat(numMatch[1]);
    if (!Number.isFinite(num)) return null;
    return { num, max: null };
  }
  return null;
}

function scoreFromValue(value) {
  const parsed = parseMetricNumber(value);
  if (parsed) {
    const cap = parsed.max ?? Math.max(parsed.num * 1.15, parsed.num);
    if (!Number.isFinite(cap) || cap <= 0) return 8;
    const score = (parsed.num / cap) * 100;
    if (!Number.isFinite(score)) return 8;
    return Math.min(100, Math.max(8, score));
  }
  const lower = String(value).toLowerCase();
  if (/excellent|outstanding|high|strong|great|good|fast/.test(lower)) return 88;
  if (/medium|average|moderate|fair|normal/.test(lower)) return 55;
  if (/low|poor|weak|bad|slow/.test(lower)) return 28;
  let h = 0;
  for (let i = 0; i < lower.length; i += 1) h = (h + lower.charCodeAt(i) * 7) % 45;
  return 42 + h;
}

function getMetricStatus(score) {
  if (score >= 75) return { label: 'Strong', tone: 'strong', color: TONE_COLOR.strong };
  if (score >= 50) return { label: 'Good', tone: 'good', color: TONE_COLOR.good };
  if (score >= 30) return { label: 'Fair', tone: 'fair', color: TONE_COLOR.fair };
  return { label: 'Needs work', tone: 'low', color: TONE_COLOR.low };
}

function scoreLevel(score) {
  if (score >= 75) return 4;
  if (score >= 50) return 3;
  if (score >= 30) return 2;
  return 1;
}

function pickMetricIcon(title) {
  const t = String(title || '').toLowerCase();
  if (/price|cost|₹|rupee|value/.test(t)) return 'dolar-sign';
  if (/view|traffic|reach|impression|click/.test(t)) return 'eye';
  if (/time|speed|day|hour|posted|duration/.test(t)) return 'clock';
  if (/compet|market|compare|rank|demand/.test(t)) return 'award';
  if (/trend|growth|performance/.test(t)) return 'trending-up';
  return 'tag';
}

function buildGlanceMetrics(insights) {
  return insights.map((insight, idx) => {
    const score = Math.round(scoreFromValue(insight.value));
    return {
      title: insight.title,
      value: insight.value,
      description: insight.description,
      accent: CARD_ACCENTS[idx % CARD_ACCENTS.length],
      score,
      status: getMetricStatus(score),
      icon: pickMetricIcon(insight.title),
    };
  });
}

/** 4-step level meter — color matches Strong / Good / Fair / Needs work */
function LevelMeter({ score, size = 'md' }) {
  const level = scoreLevel(score);
  const status = getMetricStatus(score);
  const seg = size === 'sm'
    ? { w: 5, h: 12, gap: 2 }
    : size === 'lg'
      ? { w: 10, h: 22, gap: 4 }
      : { w: 7, h: 18, gap: 3 };

  return (
    <View style={[styles.levelMeter, { gap: seg.gap }]} accessibilityLabel={`${status.label} performance`}>
      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          style={[
            styles.levelSeg,
            { width: seg.w, height: seg.h, backgroundColor: i < level ? status.color : '#e8eef5' },
          ]}
        />
      ))}
    </View>
  );
}

function GlanceLegend() {
  const items = [
    ['Strong', 'strong'],
    ['Good', 'good'],
    ['Fair', 'fair'],
    ['Needs work', 'low'],
  ];
  return (
    <View style={styles.legend}>
      {items.map(([label, tone]) => (
        <View key={tone} style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: TONE_COLOR[tone] }]} />
          <Text style={styles.legendText}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

function MetricMeterBar({ score }) {
  const gradId = useGradientId('metric-meter');
  const pct = Math.min(100, Math.max(0, score));

  return (
    <View style={styles.metricMeterTrack}>
      <View style={[styles.metricMeterFill, { width: `${pct}%` }]}>
        <Svg width="100%" height={5} preserveAspectRatio="none" viewBox="0 0 100 5">
          <Defs>
            <LinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={GEMINI.blue} />
              <Stop offset="55%" stopColor={GEMINI.purple} />
              <Stop offset="100%" stopColor={GEMINI.rose} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={100} height={5} rx={3} fill={`url(#${gradId})`} />
        </Svg>
      </View>
    </View>
  );
}

function MetricGlanceCard({ metric, active, onPress }) {
  const { icon, title, value, accent, score, status, description } = metric;
  const s = STATUS_STYLES[status.tone] || STATUS_STYLES.good;

  return (
    <TouchableOpacity
      style={[styles.glanceCard, active && styles.glanceCardActive]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <View style={styles.glanceCardRow}>
        <View style={[styles.glanceCardIcon, { backgroundColor: accentRgba(accent, 0.1) }]}>
          <Icon name={icon} size={18} color={accent} />
        </View>
        <View style={styles.glanceCardMain}>
          <Text style={styles.glanceCardTitle} numberOfLines={1}>{title}</Text>
          <Text style={styles.glanceCardValue} numberOfLines={1}>{value}</Text>
        </View>
        <View style={styles.glanceCardRight}>
          <LevelMeter score={score} size="sm" />
          <View style={[styles.glanceStatusPill, { backgroundColor: s.bg }]}>
            <Text style={[styles.glanceStatusPillText, { color: s.text }]}>{status.label}</Text>
          </View>
        </View>
        <Icon
          name={active ? 'chevron-down' : 'chevron-right'}
          size={18}
          color={COLORS.textMuted}
        />
      </View>

      <MetricMeterBar score={score} />

      {active && (
        <View style={styles.glanceDetail}>
          <Text style={styles.glanceDetailDesc}>
            {description || 'No further details for this metric.'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

/** Refined analyzing state — Gemini star burst, flowing waves, crossfading copy */
function AnalyzingState() {
  const textFade = useRef(new Animated.Value(1)).current;
  const [stepIndex, setStepIndex] = useState(0);
  const titleGradId = useGradientId('aa-title');

  const steps = [
    'Reviewing price signals',
    'Reading market demand',
    'Preparing your insights',
  ];

  useEffect(() => {
    let idx = 0;
    const copyTimer = setInterval(() => {
      Animated.timing(textFade, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return;
        idx = (idx + 1) % steps.length;
        setStepIndex(idx);
        Animated.timing(textFade, {
          toValue: 1,
          duration: 550,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      });
    }, 3200);

    return () => clearInterval(copyTimer);
  }, [textFade, steps.length]);

  return (
    <View style={styles.analyzeWrap}>
      <GeminiAnalyzingVisual style={styles.analyzeVisual} />

      <View style={styles.analyzeCopy}>
        <GradientText
          text="Analyzing your listing"
          fontSize={16}
          fontWeight="800"
          width={ANALYZE_TITLE_W}
          height={22}
          align="center"
          gradientId={titleGradId}
        />

        <Animated.Text style={[styles.analyzeSub, { opacity: textFade }]}>
          {steps[stepIndex]}
        </Animated.Text>
      </View>
    </View>
  );
}

function AnalyticsHeader({ onRefresh, showRefresh }) {
  const iconGradId = useGradientId('aa-header-icon');
  const textGradId = useGradientId('aa-header-text');

  return (
    <View style={styles.headerRow}>
      <View style={styles.aiHeader}>
        <SparklesIcon gradientId={iconGradId} />
        <GradientText
          text="AI Analytics"
          fontSize={15}
          fontWeight="800"
          width={108}
          height={18}
          gradientId={textGradId}
          style={styles.headerGradientText}
        />
      </View>
      {showRefresh && (
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={onRefresh}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="refresh" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

function SegmentTabs({ segments, activeKey, onChange }) {
  return (
    <View style={styles.tabs}>
      {segments.map((seg) => {
        const active = activeKey === seg.key;
        return (
          <TouchableOpacity
            key={seg.key}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => onChange(seg.key)}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{seg.label}</Text>
            {seg.count > 0 && (
              <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, active && styles.tabBadgeTextActive]}>{seg.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MetricExplorer({ insights }) {
  const [openIdx, setOpenIdx] = useState(null);
  const metrics = buildGlanceMetrics(insights);

  if (!insights.length) {
    return <Text style={styles.muted}>No metrics available yet.</Text>;
  }

  const toggle = (idx) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenIdx((prev) => (prev === idx ? null : idx));
  };

  return (
    <View style={styles.metrics}>
      <Text style={styles.gridLabel}>Key metrics</Text>
      <Text style={styles.metricsHint}>Tap a card to reveal its detailed analysis.</Text>

      <View style={styles.grid}>
        {metrics.map((metric, idx) => (
          <MetricGlanceCard
            key={`${metric.title}-${idx}`}
            metric={metric}
            active={openIdx === idx}
            onPress={() => toggle(idx)}
          />
        ))}
      </View>

      <GlanceLegend />
    </View>
  );
}

function TipsList({ suggestions }) {
  const [expandedIdx, setExpandedIdx] = useState(0);

  if (!suggestions.length) return null;

  return (
    <View style={styles.tipsList}>
      {suggestions.map((tip, idx) => {
        const open = expandedIdx === idx;
        const accent = CARD_ACCENTS[idx % CARD_ACCENTS.length];
        const isHigh = idx === 0;

        return (
          <View
            key={idx}
            style={[
              styles.tip,
              idx === suggestions.length - 1 && styles.tipLast,
              tipRowStyle(accent, open),
            ]}
          >
            <TouchableOpacity
              style={styles.tipToggle}
              onPress={() => setExpandedIdx(open ? -1 : idx)}
              activeOpacity={0.9}
            >
              <View style={styles.tipTop}>
                <View style={[styles.tipBadge, isHigh ? styles.tipBadgeHigh : styles.tipBadgeRec]}>
                  <Text style={[styles.tipBadgeText, isHigh ? styles.tipBadgeTextHigh : styles.tipBadgeTextRec]}>
                    {isHigh ? 'High impact' : 'Recommended'}
                  </Text>
                </View>
                <Icon name={open ? 'chevron-down' : 'chevron-right'} size={18} color={COLORS.textMuted} />
              </View>
              <Text style={styles.tipTitle}>{tip.title}</Text>
            </TouchableOpacity>
            {open && !!tip.description && <Text style={styles.tipBody}>{tip.description}</Text>}
          </View>
        );
      })}
    </View>
  );
}

function GeminiCard({ children }) {
  const [cardSize, setCardSize] = useState({ width: 0, height: 0 });

  return (
    <View
      style={styles.card}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setCardSize({ width, height });
      }}
    >
      <GeminiCardBackground width={cardSize.width} height={cardSize.height} />
      {children}
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
      const payload = data?.data ?? data;
      setInsights(Array.isArray(payload?.analysis) ? payload.analysis : []);
      setSuggestions(Array.isArray(payload?.recommendations) ? payload.recommendations : []);
      setActiveTab('metrics');
    } catch {
      setError('Could not load AI analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!generated) {
    return (
      <GeminiCard>
        <AnalyticsHeader />
        <Text style={styles.lead}>
          See how your listing compares and get smart suggestions to sell faster.
        </Text>
        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.label} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Icon name={f.icon} size={16} color={COLORS.primary} />
              </View>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate} activeOpacity={0.88}>
          <Icon name="AI" size={16} color={COLORS.white} />
          <Text style={styles.generateBtnText}>Generate insights</Text>
        </TouchableOpacity>
      </GeminiCard>
    );
  }

  if (loading) {
    return (
      <GeminiCard>
        <AnalyticsHeader />
        <AnalyzingState />
      </GeminiCard>
    );
  }

  if (error) {
    return (
      <GeminiCard>
        <AnalyticsHeader onRefresh={handleGenerate} showRefresh />
        <View style={styles.errorBox}>
          <Icon name="alert-circle" size={20} color={COLORS.error} />
          <View style={styles.errorCopy}>
            <Text style={styles.errorTitle}>Couldn&apos;t load analytics</Text>
            <Text style={styles.muted}>{error}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.generateBtn, styles.generateBtnSecondary]}
          onPress={handleGenerate}
          activeOpacity={0.88}
        >
          <Icon name="refresh" size={16} color={COLORS.primary} />
          <Text style={styles.generateBtnTextSecondary}>Try again</Text>
        </TouchableOpacity>
      </GeminiCard>
    );
  }

  const segments = [
    { key: 'metrics', label: 'Metrics', count: insights.length },
    { key: 'tips', label: 'Tips', count: suggestions.length },
  ];

  return (
    <GeminiCard>
      <AnalyticsHeader onRefresh={handleGenerate} showRefresh />

      <SegmentTabs segments={segments} activeKey={activeTab} onChange={setActiveTab} />

      <View style={styles.panel}>
        {activeTab === 'metrics' ? (
          <MetricExplorer insights={insights} />
        ) : suggestions.length > 0 ? (
          <TipsList suggestions={suggestions} />
        ) : (
          <Text style={styles.muted}>No tips for this listing right now.</Text>
        )}
      </View>
    </GeminiCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    marginBottom: 20,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: GEMINI.border,
    padding: 20,
    overflow: 'hidden',
    ...SHADOW.small,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minHeight: 22 },
  headerGradientText: { marginTop: 1 },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lead: { fontSize: 14, lineHeight: 21, color: COLORS.textMuted, marginBottom: 16 },
  features: { gap: 10, marginBottom: 18 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: { fontSize: 14, fontWeight: '500', color: COLORS.text, flex: 1 },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GEMINI.purple,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
  },
  generateBtnSecondary: { backgroundColor: '#f5f0ff', borderWidth: 1, borderColor: GEMINI.border },
  generateBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  generateBtnTextSecondary: { fontSize: 14, fontWeight: '700', color: GEMINI.purple },
  analyzeWrap: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 22,
    paddingHorizontal: 12,
  },
  analyzeVisual: {
    width: '100%',
    marginBottom: 16,
    alignSelf: 'stretch',
  },
  analyzeCopy: {
    width: '100%',
    alignItems: 'center',
  },
  analyzeSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 18,
    width: '100%',
    maxWidth: ANALYZE_TITLE_W,
    letterSpacing: 0.2,
  },
  muted: { fontSize: 13, color: COLORS.textMuted, lineHeight: 19 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    marginBottom: 16,
    borderRadius: RADIUS.md,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorCopy: { flex: 1, minWidth: 0 },
  errorTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 4 },

  levelMeter: { flexDirection: 'row', alignItems: 'flex-end', flexShrink: 0 },
  levelSeg: { borderRadius: 3 },

  tabs: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    marginBottom: 18,
    borderRadius: RADIUS.full,
    backgroundColor: '#eef1f6',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
  },
  tabActive: { backgroundColor: COLORS.white, ...SHADOW.small },
  tabText: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted },
  tabTextActive: { color: COLORS.text },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    backgroundColor: 'rgba(0,0,0,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeActive: { backgroundColor: accentRgba(GEMINI.purple, 0.14) },
  tabBadgeText: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted },
  tabBadgeTextActive: { color: GEMINI.purple },
  panel: { minHeight: 48 },

  metrics: { width: '100%' },
  gridLabel: { fontSize: 13, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  metricsHint: { fontSize: 12, lineHeight: 17, color: COLORS.textMuted, marginBottom: 14 },
  grid: {},
  glanceCard: {
    width: '100%',
    marginBottom: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: GEMINI.rowBorder,
  },
  glanceCardActive: {
    borderColor: GEMINI.border,
    backgroundColor: 'rgba(66, 133, 244, 0.03)',
  },
  glanceCardRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  glanceCardMain: { flex: 1, minWidth: 0 },
  glanceCardRight: { alignItems: 'flex-end', gap: 8 },
  glanceCardIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  glanceCardTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, marginBottom: 2 },
  glanceCardValue: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  glanceStatusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  glanceStatusPillText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  metricMeterTrack: {
    height: 5,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(155, 114, 203, 0.08)',
    overflow: 'hidden',
  },
  metricMeterFill: {
    height: '100%',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    minWidth: 6,
  },

  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: GEMINI.rowBorder,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },

  glanceDetail: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: GEMINI.rowBorder,
  },
  glanceDetailDesc: { fontSize: 14, lineHeight: 21, color: COLORS.textMuted },

  tipsList: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
  },
  tip: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    borderLeftWidth: 0,
    paddingHorizontal: 18,
    paddingVertical: 18,
    minWidth: 0,
  },
  tipLast: { borderBottomWidth: 0 },
  tipToggle: { width: '100%' },
  tipTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  tipBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  tipBadgeHigh: { backgroundColor: '#fff7ed' },
  tipBadgeRec: { backgroundColor: '#f1f5f9' },
  tipBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  tipBadgeTextHigh: { color: '#ea580c' },
  tipBadgeTextRec: { color: COLORS.textMuted },
  tipTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, lineHeight: 20, paddingRight: 8 },
  tipBody: { fontSize: 13, lineHeight: 20, color: COLORS.textMuted, marginTop: 4, paddingBottom: 2 },
});

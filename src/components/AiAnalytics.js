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
import Svg, { Circle } from 'react-native-svg';
import { apiFetch } from '../utils/api';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';
import Icon from './Icon';

const CARD_ACCENTS = ['#378cf6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];
const AI_PURPLE = '#7f5af0';
const BORDER = '#e5e7eb';

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

function getOverallMessage(score) {
  if (score >= 75) return 'Your listing is performing well overall.';
  if (score >= 50) return 'Solid start — a few tweaks could help you sell faster.';
  return 'There’s room to improve — check the tips below.';
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

/** Arc ring showing the overall score number in the center */
function OverallRing({ score, color, size = 92 }) {
  const pct = Math.min(100, Math.max(0, score));
  const half = size / 2;
  const stroke = 8;
  const r = half - stroke;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);

  return (
    <View style={{ width: size, height: size }} accessibilityLabel={`Overall score ${score} out of 100`}>
      <Svg width={size} height={size}>
        <Circle cx={half} cy={half} r={r} stroke="#e8eef5" strokeWidth={stroke} fill="none" />
        <Circle
          cx={half}
          cy={half}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${half}, ${half}`}
        />
      </Svg>
      <View style={[styles.ringCenter, { width: size, height: size }]}>
        <Text style={[styles.ringScore, { color }]}>{score}</Text>
        <Text style={styles.ringScoreLabel}>OVERALL</Text>
      </View>
    </View>
  );
}

function StatusPill({ tone, label }) {
  const s = STATUS_STYLES[tone] || STATUS_STYLES.good;
  return (
    <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
      <View style={[styles.statusDot, { backgroundColor: s.text }]} />
      <Text style={[styles.statusPillText, { color: s.text }]}>{label}</Text>
    </View>
  );
}

function AtAGlancePanel({ insights, suggestions }) {
  const metrics = buildGlanceMetrics(insights);
  const validScores = metrics.map((m) => m.score).filter((s) => Number.isFinite(s));
  const overallScore = validScores.length
    ? Math.round(validScores.reduce((sum, s) => sum + s, 0) / validScores.length)
    : 0;
  const overallStatus = getMetricStatus(overallScore);
  const headline = insights[0];
  const tint = overallStatus.color;

  return (
    <View
      style={[
        styles.glance,
        { backgroundColor: accentRgba(tint, 0.06), borderColor: accentRgba(tint, 0.22) },
      ]}
    >
      <View style={styles.glanceTop}>
        <View style={styles.glanceLabelRow}>
          <Text style={styles.glanceSpark}>✦</Text>
          <Text style={styles.glanceLabel}>At a glance</Text>
        </View>
        <StatusPill tone={overallStatus.tone} label={overallStatus.label} />
      </View>

      <View style={styles.glanceHero}>
        <OverallRing score={overallScore} color={tint} size={92} />
        <Text style={styles.glanceMsg}>{getOverallMessage(overallScore)}</Text>
      </View>

      {headline && (
        <View style={styles.spotlight}>
          <View style={[styles.spotlightIcon, { backgroundColor: accentRgba(tint, 0.14) }]}>
            <Icon name="award" size={16} color={tint} />
          </View>
          <View style={styles.spotlightTextCol}>
            <Text style={styles.spotlightLabel}>Top highlight</Text>
            <Text style={styles.spotlightTitle} numberOfLines={1}>{headline.title}</Text>
          </View>
          <Text style={styles.spotlightValue} numberOfLines={1}>{headline.value}</Text>
        </View>
      )}

      <Text style={styles.glanceMeta}>
        {suggestions.length > 0
          ? `Explore each score below · ${suggestions.length} tip${suggestions.length > 1 ? 's' : ''} to improve your ad`
          : 'Explore each score in the Metrics tab below'}
      </Text>
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

function MetricGlanceCard({ metric, active, onPress }) {
  const { icon, title, value, accent, score, status, description } = metric;
  const s = STATUS_STYLES[status.tone] || STATUS_STYLES.good;

  return (
    <TouchableOpacity
      style={[styles.glanceCard, active && { borderColor: accent, backgroundColor: COLORS.white }]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <View style={styles.glanceCardRow}>
        <View style={[styles.glanceCardIcon, { backgroundColor: accentRgba(accent, 0.12) }]}>
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

      <View style={styles.glanceCardMeter}>
        <View style={[styles.glanceCardMeterFill, { width: `${score}%`, backgroundColor: accent }]} />
      </View>

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

/** Animated "AI is thinking" loading state */
function AnalyzingState() {
  const pulse = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const p = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    const s = Animated.loop(
      Animated.timing(shimmer, { toValue: 1, duration: 1300, easing: Easing.linear, useNativeDriver: true })
    );
    p.start();
    s.start();
    return () => {
      p.stop();
      s.stop();
    };
  }, [pulse, shimmer]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.65] });
  const orbScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });

  const lines = [
    { w: '100%', phase: 0 },
    { w: '84%', phase: 0.18 },
    { w: '66%', phase: 0.36 },
  ];

  return (
    <View style={styles.analyzeWrap}>
      <View style={styles.analyzeOrbWrap}>
        <Animated.View style={[styles.analyzeGlow, { opacity: glowOpacity, transform: [{ scale }] }]} />
        <Animated.View style={[styles.analyzeGlowInner, { opacity: glowOpacity }]} />
        <Animated.View style={[styles.analyzeOrb, { transform: [{ scale: orbScale }] }]}>
          <Text style={styles.analyzeOrbIcon}>✦</Text>
        </Animated.View>
      </View>

      <Text style={styles.analyzeTitle}>Analyzing your listing</Text>
      <Text style={styles.analyzeSub}>Scanning pricing, demand and market signals…</Text>

      <View style={styles.skeletonWrap}>
        {lines.map((ln, i) => {
          const opacity = shimmer.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0.35, 1, 0.35],
          });
          return (
            <Animated.View
              key={i}
              style={[styles.skelLine, { width: ln.w, opacity }]}
            />
          );
        })}
      </View>
    </View>
  );
}

function AnalyticsHeader({ onRefresh, showRefresh }) {
  return (
    <View style={styles.headerRow}>
      <View style={styles.aiHeader}>
        <Text style={styles.aiIcon}>✦</Text>
        <Text style={styles.aiHeaderText}>AI Analytics</Text>
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
      <View style={styles.card}>
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
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.card}>
        <AnalyticsHeader />
        <AnalyzingState />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.card}>
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
      </View>
    );
  }

  const segments = [
    { key: 'metrics', label: 'Metrics', count: insights.length },
    { key: 'tips', label: 'Tips', count: suggestions.length },
  ];

  return (
    <View style={styles.card}>
      <AnalyticsHeader onRefresh={handleGenerate} showRefresh />

      {insights.length > 0 && <AtAGlancePanel insights={insights} suggestions={suggestions} />}

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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    marginBottom: 20,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#e0e7ff',
    padding: 20,
    ...SHADOW.small,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  aiIcon: { fontSize: 18, color: AI_PURPLE },
  aiHeaderText: { fontSize: 15, fontWeight: '800', color: AI_PURPLE },
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
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
  },
  generateBtnSecondary: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },
  generateBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  generateBtnTextSecondary: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  analyzeWrap: { alignItems: 'center', paddingTop: 14, paddingBottom: 18, paddingHorizontal: 8 },
  analyzeOrbWrap: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  analyzeGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: accentRgba(AI_PURPLE, 0.28),
  },
  analyzeGlowInner: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: accentRgba(AI_PURPLE, 0.22),
  },
  analyzeOrb: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: AI_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.small,
  },
  analyzeOrbIcon: { color: COLORS.white, fontSize: 24, fontWeight: '800', marginTop: -2 },
  analyzeTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  analyzeSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  skeletonWrap: { alignSelf: 'stretch', marginTop: 20, gap: 10 },
  skelLine: { height: 12, borderRadius: 6, backgroundColor: accentRgba(AI_PURPLE, 0.16) },
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

  // At a glance
  glance: {
    padding: 18,
    marginBottom: 18,
    borderRadius: RADIUS.lg,
    backgroundColor: '#f6f8ff',
    borderWidth: 1,
    borderColor: '#e6ebff',
  },
  glanceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  glanceLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  glanceSpark: { fontSize: 13, color: AI_PURPLE },
  glanceLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  glanceHero: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  glanceMsg: { flex: 1, minWidth: 0, fontSize: 15, lineHeight: 21, color: COLORS.text, fontWeight: '600' },
  ringCenter: { position: 'absolute', top: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  ringScore: { fontSize: 26, fontWeight: '800', lineHeight: 28 },
  ringScoreLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginTop: 1,
  },
  spotlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  spotlightIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotlightTextCol: { flex: 1, minWidth: 0 },
  spotlightLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  spotlightValue: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  spotlightTitle: { fontSize: 13, color: COLORS.text, fontWeight: '600', marginTop: 2 },
  glanceMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 14, lineHeight: 17 },

  levelMeter: { flexDirection: 'row', alignItems: 'flex-end', flexShrink: 0 },
  levelSeg: { borderRadius: 3 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: 11, fontWeight: '700' },

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
  tabBadgeActive: { backgroundColor: accentRgba(AI_PURPLE, 0.14) },
  tabBadgeText: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted },
  tabBadgeTextActive: { color: AI_PURPLE },
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
    backgroundColor: '#fafbfc',
    borderWidth: 1.5,
    borderColor: '#e8eef5',
  },
  glanceCardRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  glanceCardMain: { flex: 1, minWidth: 0 },
  glanceCardRight: { alignItems: 'flex-end', gap: 8 },
  glanceCardIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  glanceCardTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, marginBottom: 2 },
  glanceCardValue: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  glanceStatusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  glanceStatusPillText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  glanceCardMeter: { height: 5, borderRadius: RADIUS.full, backgroundColor: '#eef2f7', overflow: 'hidden' },
  glanceCardMeterFill: { height: '100%', borderRadius: RADIUS.full },

  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eef2f7',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },

  glanceDetail: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eef2f7',
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

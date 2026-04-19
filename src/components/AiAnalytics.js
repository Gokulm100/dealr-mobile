// src/components/AiAnalytics.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { apiFetch } from '../utils/api';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';
import Icon from './Icon';

export default function AiAnalytics({ ad }) {
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [insights, setInsights] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!ad) return;
    setLoading(true);
    setGenerated(true);
    setError(null);
    try {
      const data = await apiFetch('/api/ai/provideAiAnalytics', {
        method: 'POST',
        body: JSON.stringify({
          adId: ad.id || '',
          category: ad.categoryId || '',
          subCategory: ad.subCategory || '',
        }),
      });
      setInsights(Array.isArray(data.data?.analysis) ? data.data.analysis : []);
      setSuggestions(Array.isArray(data.data?.recommendations) ? data.data.recommendations : []);
    } catch(error) {
      setError('Could not load AI analytics.');
    } finally {
      setLoading(false);
    }
  };

  if (!generated) {
    return (
      <View style={styles.promptCard}>
        <View style={styles.aiBadge}>
          <Text style={styles.aiBadgeText}>AI POWERED</Text>
        </View>
        <Text style={styles.promptTitle}>Boost your Ad Performance</Text>
        <Text style={styles.promptText}>
          Get AI driven insights and smart tips to sell your item 2x faster.
        </Text>
        <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate}>
          <Icon name="AI" size={16} color={COLORS.white} />
          <Text style={styles.generateText}>Generate Analysis</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingCard}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.loadingText}>Analyzing market trends...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.promptCard}>
        <Icon name="alert-circle" size={24} color={COLORS.error} />
        <Text style={[styles.promptText, { marginTop: 8 }]}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={handleGenerate}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.resultsCard}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.iconCircle}>
            <Icon name="AI" size={14} color={COLORS.primary} />
          </View>
          <Text style={styles.headerText}>AI Insights</Text>
        </View>
        <TouchableOpacity onPress={handleGenerate}>
          <Icon name="edit" size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.insightsRow}
      >
        {insights.map((insight, idx) => (
          <View key={idx} style={styles.insightCard}>
            <Text style={styles.insightTitle}>{insight.title}</Text>
            <Text style={styles.insightValue}>{insight.value}</Text>
            <View style={styles.divider} />
            <Text style={styles.insightDesc} numberOfLines={3}>{insight.description}</Text>
          </View>
        ))}
      </ScrollView>

      {suggestions.length > 0 && (
        <View style={styles.suggestionsBox}>
          <Text style={styles.suggestionsHeader}>Optimization Tips</Text>
          {suggestions.map((s, idx) => (
            <View key={idx} style={styles.suggestionRow}>
              <View style={styles.bullet} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sTitle}>{s.title}</Text>
                <Text style={styles.sDesc}>{s.description}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  promptCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    ...SHADOW.small,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  aiBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginBottom: 12,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  promptTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  promptText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: 24,
    paddingVertical: 12,
    ...SHADOW.small,
  },
  generateText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  loadingCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 40,
    alignItems: 'center',
    marginBottom: 20,
    ...SHADOW.small,
  },
  loadingText: { fontSize: 13, color: COLORS.textMuted, marginTop: 12, fontWeight: '500' },
  resultsCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 20,
    ...SHADOW.small,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  insightsRow: { gap: 12, paddingBottom: 4, marginBottom: 20 },
  insightCard: {
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.md,
    padding: 14,
    width: 160,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  insightTitle: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase' },
  insightValue: { fontSize: 20, fontWeight: '900', color: COLORS.primary, marginVertical: 4 },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 8 },
  insightDesc: { fontSize: 11, color: COLORS.text, lineHeight: 15 },
  suggestionsBox: {
    backgroundColor: '#f1f5f9',
    borderRadius: RADIUS.md,
    padding: 16,
  },
  suggestionsHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 12,
  },
  suggestionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginTop: 6,
  },
  sTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  sDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
  retryBtn: { marginTop: 12, padding: 8 },
  retryText: { color: COLORS.primary, fontWeight: '700' },
});

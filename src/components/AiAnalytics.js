// src/components/AiAnalytics.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { apiFetch } from '../utils/api';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

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
          adId: ad.id || ad._id || '',
          category: ad.categoryId || '',
          subCategory: ad.subCategory || '',
        }),
      });
      setInsights(Array.isArray(data.data?.analysis) ? data.data.analysis : []);
      setSuggestions(Array.isArray(data.data?.recommendations) ? data.data.recommendations : []);
    } catch {
      setError('Could not load AI analytics.');
    } finally {
      setLoading(false);
    }
  };

  // Not yet generated
  if (!generated) {
    return (
      <View style={styles.promptCard}>
        <Text style={styles.promptText}>
          Get instant AI insights and smart tips to improve your ad results.
        </Text>
        <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate}>
          <Text style={styles.generateIcon}>✦</Text>
          <Text style={styles.generateText}>Generate AI Analytics</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Loading
  if (loading) {
    return (
      <View style={styles.loadingCard}>
        <ActivityIndicator size="large" color="#7f5af0" />
        <Text style={styles.loadingText}>Analysing your ad…</Text>
      </View>
    );
  }

  // Error
  if (error) {
    return (
      <View style={[styles.promptCard, { borderColor: '#fca5a5' }]}>
        <Text style={[styles.promptText, { color: COLORS.error }]}>{error}</Text>
        <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate}>
          <Text style={styles.generateText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Results
  return (
    <View style={styles.resultsCard}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.aiIcon}>✦</Text>
        <Text style={styles.headerText}>AI Analytics</Text>
      </View>

      {/* Insight Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.insightsRow}
      >
        {insights.map((insight, idx) => (
          <View key={idx} style={styles.insightCard}>
            <Text style={styles.insightTitle}>{insight.title}</Text>
            <Text style={styles.insightValue}>{insight.value}</Text>
            <Text style={styles.insightDesc}>{insight.description}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Recommendations */}
      {suggestions.length > 0 && (
        <View style={styles.suggestionsBox}>
          <Text style={styles.suggestionsTitle}>💡 Optimization Tips</Text>
          {suggestions.map((s, idx) => (
            <View key={idx} style={styles.suggestionRow}>
              <Text style={styles.suggestionBullet}>›</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.suggestionTitle}>{s.title}</Text>
                <Text style={styles.suggestionDesc}>{s.description}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Regenerate */}
      <TouchableOpacity style={styles.regenBtn} onPress={handleGenerate}>
        <Text style={styles.regenText}>↻  Regenerate</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  promptCard: {
    backgroundColor: '#f7f9fa',
    borderRadius: RADIUS.lg,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  promptText: {
    fontSize: 14,
    color: '#00639b',
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 20,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#7f5af0',
    borderRadius: RADIUS.md,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  generateIcon: { fontSize: 14, color: COLORS.white },
  generateText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  loadingCard: {
    backgroundColor: '#f3f6fa',
    borderRadius: RADIUS.lg,
    padding: 36,
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  loadingText: { fontSize: 13, color: COLORS.textMuted },
  resultsCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e7ff',
    ...SHADOW.small,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  aiIcon: { fontSize: 18, color: '#7f5af0' },
  headerText: { fontSize: 15, fontWeight: '800', color: '#7f5af0' },
  insightsRow: { gap: 10, paddingBottom: 4, marginBottom: 14 },
  insightCard: {
    backgroundColor: '#f3f6fa',
    borderRadius: RADIUS.md,
    padding: 14,
    width: 150,
    gap: 4,
  },
  insightTitle: { fontSize: 12, fontWeight: '700', color: COLORS.text },
  insightValue: { fontSize: 18, fontWeight: '900', color: '#632cb6' },
  insightDesc: { fontSize: 12, color: COLORS.textMuted, lineHeight: 16 },
  suggestionsBox: {
    backgroundColor: '#6b7ba8',
    borderRadius: RADIUS.md,
    padding: 14,
    gap: 10,
    marginBottom: 12,
  },
  suggestionsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
  },
  suggestionRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  suggestionBullet: {
    fontSize: 16,
    color: COLORS.white,
    marginTop: 1,
  },
  suggestionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 2,
  },
  suggestionDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 17,
  },
  regenBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  regenText: {
    fontSize: 13,
    color: '#7f5af0',
    fontWeight: '600',
  },
});

// src/components/AiSummary.js
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
} from 'react-native';
import { apiFetch } from '../utils/api';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

export default function AiSummary({ adId, adTitle, category, subCategory, description, cachedSummary }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Use the stored summary directly when the ad already carries one.
    if (cachedSummary && Object.keys(cachedSummary).length > 0) {
      setSummary(cachedSummary);
      setLoading(false);
      return;
    }
    if (!adId && (!adTitle || !category || !description)) return;
    setLoading(true);
    setError(null);
    apiFetch('/api/ads/summarizeAdUsingAi', {
      method: 'POST',
      body: JSON.stringify({ adId, adTitle, category, subCategory, description }),
    })
      .then(result => setSummary(result.data))
      .catch(() => setError('Failed to load AI summary.'))
      .finally(() => setLoading(false));
  }, [adId, adTitle, category, subCategory, description, cachedSummary]);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.aiIcon}>✦</Text>
        <Text style={styles.headerText}>AI Summary</Text>
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={COLORS.accent} />
          <Text style={styles.loadingText}>Analysing description…</Text>
        </View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : summary && Object.keys(summary).length > 0 ? (
        <View style={styles.list}>
          {Object.entries(summary).map(([key, value]) => (
            <View key={key} style={styles.row}>
              <Text style={styles.rowKey}>{key}</Text>
              <Text style={styles.rowValue}>
                {typeof value === 'object' && value !== null
                  ? Object.entries(value).map(([k, v]) => `${k}: ${v}`).join(' · ')
                  : String(value)}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyText}>No key features detected.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
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
    marginBottom: 12,
  },
  aiIcon: {
    fontSize: 18,
    color: '#7f5af0',
  },
  headerText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#7f5af0',
    letterSpacing: 0.3,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.error,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  list: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  rowKey: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    width: 110,
    flexShrink: 0,
  },
  rowValue: {
    fontSize: 13,
    color: COLORS.textMuted,
    flex: 1,
    flexWrap: 'wrap',
  },
});

// src/components/AiSummary.js
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { apiFetch } from '../utils/api';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';
import {
  GEMINI,
  useGradientId,
  SparklesIcon,
  GradientText,
  GeminiCardBackground,
} from './geminiBrand';

function FadeInRow({ index, style, children }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        delay: index * 70,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        delay: index * 70,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, translateY]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

export default function AiSummary({ adId, adTitle, category, subCategory, description, cachedSummary }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cardSize, setCardSize] = useState({ width: 0, height: 0 });
  const iconGradId = useGradientId('ai-icon');
  const headerGradId = useGradientId('ai-header');
  const loadingGradId = useGradientId('ai-loading');
  const keyGradId = useGradientId('ai-key');

  useEffect(() => {
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
    <View
      style={styles.card}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setCardSize({ width, height });
      }}
    >
      <GeminiCardBackground width={cardSize.width} height={cardSize.height} />

      <View style={styles.header}>
        <SparklesIcon gradientId={iconGradId} />
        <GradientText
          text="AI Summary"
          fontSize={15}
          fontWeight="800"
          width={104}
          height={18}
          gradientId={headerGradId}
          style={{ marginTop: 1 }}
        />
      </View>

      {loading ? (
        <View style={styles.loadingBlock}>
          <GradientText
            text="Analysing description…"
            fontSize={13}
            fontWeight="600"
            width={168}
            height={16}
            align="center"
            gradientId={loadingGradId}
          />
        </View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : summary && Object.keys(summary).length > 0 ? (
        <View style={styles.list}>
          {Object.entries(summary).map(([key, value], index, arr) => (
            <FadeInRow
              key={key}
              index={index}
              style={[styles.row, index === arr.length - 1 && styles.rowLast]}
            >
              <View style={styles.rowKeyWrap}>
                <GradientText
                  text={key}
                  fontSize={13}
                  fontWeight="700"
                  width={110}
                  height={18}
                  gradientId={`${keyGradId}-${index}`}
                />
              </View>
              <Text style={styles.rowValue}>
                {typeof value === 'object' && value !== null
                  ? Object.entries(value).map(([k, v]) => `${k}: ${v}`).join(' · ')
                  : String(value)}
              </Text>
            </FadeInRow>
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
    borderColor: GEMINI.border,
    overflow: 'hidden',
    ...SHADOW.small,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    minHeight: 22,
  },
  loadingBlock: {
    alignItems: 'center',
    paddingVertical: 10,
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
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: GEMINI.rowBorder,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowKeyWrap: {
    width: 110,
    flexShrink: 0,
    paddingTop: 1,
  },
  rowValue: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
    flexWrap: 'wrap',
    lineHeight: 19,
  },
});

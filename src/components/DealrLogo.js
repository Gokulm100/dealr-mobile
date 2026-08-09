import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, BRAND } from '../utils/theme';
import DealrMark from './DealrMark';

export default function DealrLogo({
  variant = 'light',
  size = 'md',
  showTagline = false,
  tagline = 'Deal with the Right App!',
  showMark = false,
  markOnly = false,
  onPress,
  style,
}) {
  const sizeMap = {
    sm: { word: 20, line: 24, tagline: 9, tracking: -0.7 },
    md: { word: 24, line: 28, tagline: 10, tracking: -0.8 },
    lg: { word: 28, line: 32, tagline: 10, tracking: -0.9 },
    title: { word: 34, line: 38, tagline: 11, tracking: -1.1 },
  };
  const metrics = sizeMap[size] || sizeMap.md;
  const markSize = size === 'lg' || size === 'title' ? 46 : size === 'sm' ? 30 : 38;
  const isLight = variant === 'light';
  const showWordmark = !markOnly;
  const leadColor = isLight ? COLORS.white : COLORS.text;
  const tailColor = leadColor;

  const content = (
    <>
      {showMark && <DealrMark size={markSize} />}
      {showWordmark && (
        <View style={styles.copy}>
          <Text
            style={[
              styles.wordmark,
              {
                fontSize: metrics.word,
                lineHeight: metrics.line,
                letterSpacing: metrics.tracking,
                fontFamily: BRAND.wordmarkFont,
              },
            ]}
          >
            <Text style={{ color: leadColor }}>Dea</Text>
            <Text style={{ color: BRAND.accentL }}>l</Text>
            <Text style={{ color: tailColor }}>r</Text>
          </Text>
          {showTagline && !!tagline && (
            <Text
              style={[
                styles.tagline,
                {
                  fontSize: metrics.tagline,
                  color: isLight ? 'rgba(255,255,255,0.72)' : COLORS.textMuted,
                  marginTop: 3,
                },
              ]}
            >
              {tagline}
            </Text>
          )}
        </View>
      )}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.root, style]}
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Go to home"
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.root, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  copy: {
    justifyContent: 'center',
  },
  wordmark: {
    fontWeight: '800',
  },
  tagline: {
    fontWeight: '600',
    letterSpacing: 0.15,
  },
});

// src/components/SellerRating.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from './Icon';
import { COLORS } from '../utils/theme';

export default function SellerRating({ ratingAvg = 0, reviewCount = 0, completedSales = 0, size = 'md' }) {
  const hasReviews = reviewCount > 0;
  const starSize = size === 'sm' ? 12 : 14;
  const textSize = size === 'sm' ? 12 : 14;

  return (
    <View style={styles.row}>
      <Icon name="star" size={starSize} color="#f59e0b" />
      <Text style={[styles.ratingText, { fontSize: textSize }]}>
        {hasReviews ? ratingAvg.toFixed(1) : 'New'}
      </Text>
      {hasReviews && (
        <Text style={[styles.metaText, { fontSize: textSize - 1 }]}>
          ({reviewCount} review{reviewCount === 1 ? '' : 's'})
        </Text>
      )}
      {completedSales > 0 && (
        <Text style={[styles.metaText, { fontSize: textSize - 1 }]}>
          · {completedSales} sale{completedSales === 1 ? '' : 's'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  ratingText: {
    fontWeight: '700',
    color: COLORS.text,
  },
  metaText: {
    color: COLORS.textMuted,
    fontWeight: '500',
  },
});

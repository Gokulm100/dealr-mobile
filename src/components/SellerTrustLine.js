// src/components/SellerTrustLine.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import SellerRating from './SellerRating';
import TrustBadge from './TrustBadge';

export default function SellerTrustLine({
  ratingAvg = 0,
  reviewCount = 0,
  completedSales = 0,
  badges = [],
  trustScore,
  size = 'sm',
  showScore = false,
}) {
  return (
    <View style={styles.wrap}>
      <SellerRating
        ratingAvg={ratingAvg}
        reviewCount={reviewCount}
        completedSales={completedSales}
        size={size}
      />
      <TrustBadge badges={badges} trustScore={trustScore} size={size} showScore={showScore} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 2 },
});

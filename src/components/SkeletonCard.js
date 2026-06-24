// src/components/SkeletonCard.js
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

// A single shimmering placeholder block.
function Shimmer({ style }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[styles.block, style, { opacity }]} />;
}

// Placeholder that mimics the AdCard layout while ads are loading.
// `horizontal` renders the row-style card used on the My Ads screen.
// `chat` renders the conversation row used on the Messages screen.
// `bubble` renders a single chat message bubble used inside a conversation.
export default function SkeletonCard({ horizontal, chat, bubble, align = 'left', width, height }) {
  if (bubble) {
    const isRight = align === 'right';
    return (
      <Shimmer
        style={[
          styles.bubble,
          isRight ? styles.bubbleRight : styles.bubbleLeft,
          { width, height: height || 40 },
        ]}
      />
    );
  }

  if (chat) {
    return (
      <View style={styles.chatRow}>
        <Shimmer style={styles.chatAvatar} />
        <View style={styles.chatInfo}>
          <View style={styles.chatHeaderRow}>
            <Shimmer style={styles.chatName} />
            <Shimmer style={styles.chatTime} />
          </View>
          <Shimmer style={styles.chatAdTitle} />
          <Shimmer style={styles.chatPreview} />
        </View>
      </View>
    );
  }

  if (horizontal) {
    return (
      <View style={styles.rowCard}>
        <Shimmer style={styles.rowImage} />
        <View style={styles.rowBody}>
          <View style={styles.rowTopInfo}>
            <Shimmer style={styles.rowCategory} />
            <Shimmer style={styles.rowDate} />
          </View>
          <Shimmer style={styles.rowTitle} />
          <Shimmer style={styles.rowPrice} />
          <View style={styles.rowActions}>
            <Shimmer style={styles.rowAction} />
            <Shimmer style={styles.rowAction} />
            <Shimmer style={styles.rowAction} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Shimmer style={styles.image} />
      <View style={styles.body}>
        <Shimmer style={styles.price} />
        <Shimmer style={styles.titleLine} />
        <Shimmer style={[styles.titleLine, styles.titleLineShort]} />
        <View style={styles.metaRow}>
          <Shimmer style={styles.meta} />
          <Shimmer style={[styles.meta, styles.metaShort]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOW.small,
    flex: 1,
    margin: 6,
    marginBottom: 8,
  },
  block: {
    backgroundColor: '#e2e5ea',
    borderRadius: RADIUS.sm,
  },
  image: {
    width: '100%',
    height: 130,
    borderRadius: 0,
  },
  body: {
    padding: 10,
    paddingTop: 8,
  },
  price: {
    width: '55%',
    height: 22,
    marginBottom: 10,
  },
  titleLine: {
    width: '90%',
    height: 12,
    marginBottom: 6,
  },
  titleLineShort: {
    width: '60%',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meta: {
    width: '40%',
    height: 10,
  },
  metaShort: {
    width: '25%',
  },

  // Horizontal (row) variant — mirrors the My Ads card.
  rowCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    height: 115,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    ...SHADOW.small,
  },
  rowImage: {
    width: 90,
    height: '100%',
    borderRadius: 0,
  },
  rowBody: {
    flex: 1,
    padding: 8,
    justifyContent: 'space-between',
  },
  rowTopInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowCategory: {
    width: '35%',
    height: 10,
  },
  rowDate: {
    width: '20%',
    height: 10,
  },
  rowTitle: {
    width: '75%',
    height: 13,
  },
  rowPrice: {
    width: '40%',
    height: 14,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 6,
  },
  rowAction: {
    flex: 1,
    height: 26,
    borderRadius: 8,
  },

  // Chat (conversation row) variant — mirrors the Messages screen.
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.12)',
  },
  chatAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chatName: {
    width: '45%',
    height: 15,
  },
  chatTime: {
    width: '15%',
    height: 11,
  },
  chatAdTitle: {
    width: '35%',
    height: 12,
    marginBottom: 8,
  },
  chatPreview: {
    width: '70%',
    height: 13,
  },

  // Chat bubble variant — mirrors a single message inside a conversation.
  bubble: {
    marginBottom: 10,
    borderRadius: 20,
  },
  bubbleLeft: {
    alignSelf: 'flex-start',
    backgroundColor: '#e2e5ea',
    borderBottomLeftRadius: 4,
  },
  bubbleRight: {
    alignSelf: 'flex-end',
    backgroundColor: '#d4dae3',
    borderBottomRightRadius: 4,
  },
});

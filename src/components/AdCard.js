// src/components/AdCard.js
import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from '../components/Icon';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

export default function AdCard({ item, onPress, isFavorite, onToggleFavorite, isTrending }) {
  const isNew = item.createdAt && (new Date() - new Date(item.createdAt)) < 5 * 24 * 60 * 60 * 1000;

  const formatLocation = (loc) => {
    if (!loc) return '';
    const commaIndex = loc.indexOf(',');
    if (commaIndex !== -1 && loc.length > commaIndex + 4) {
      return loc.substring(0, commaIndex + 4) + '...';
    }
    return loc;
  };

  return (
    <TouchableOpacity
      style={[styles.card, item.isSold && styles.cardSold]}
      onPress={onPress}
      activeOpacity={item.isSold ? 0.95 : 0.85}
    >
      <View>
        <Image
          source={{ uri: item.images?.[0] }}
          style={[styles.image, item.isSold && styles.imageSold]}
          resizeMode="cover"
        />

        {/* Sold Overlay */}
        {item.isSold && (
          <View style={styles.soldOverlay}>
            <View style={styles.soldBadgeLarge}>
              <Text style={styles.soldBadgeTextLarge}>SOLD</Text>
            </View>
          </View>
        )}

        {/* Category tag */}
        <View style={styles.tag}>
          <Text style={styles.tagText} numberOfLines={1}>
            {item.category}
          </Text>
        </View>

        {/* Trending Symbol */}
        {isTrending && !item.isSold && (
          <View style={styles.trendingSymbol}>
            <Text style={{ fontSize: 14 }}>🔥</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>


        <View style={styles.priceRow}>
          <Text style={[styles.price, item.isSold && styles.textMuted]}>
            ₹{Number(item.price).toLocaleString('en-IN')}
          </Text>
          <View style={styles.badgeRow}>
            {isNew && !item.isSold && (
              <View style={styles.inlineNewTag}>
                <Text style={styles.newTagText}>NEW</Text>
              </View>
            )}
            {item.isSold && (
              <View style={styles.soldBadgeSmall}>
                <Text style={styles.soldBadgeTextSmall}>SOLD</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.titleRow}>
          <Text style={[styles.title, item.isSold && styles.textMuted]} numberOfLines={2}>
            {item.title}
          </Text>
        </View>
          <View style={[styles.metaItem, { flex: 1, marginRight: 4 }]}>
            <Icon name="map-pin" size={12} color={COLORS.textMuted} />
            <Text style={styles.metaText} numberOfLines={1}>
              {formatLocation(item.location)}
            </Text>
          </View>
        <View style={styles.divider} />

        <View style={styles.meta}>
                <View style={styles.topRow}>
                  <Text style={styles.postedSmall}>{item.posted}</Text>
                </View>
          <View style={styles.metaItem}>
            <Icon name="eye" size={12} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{item.views} views</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
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
  cardSold: {
    opacity: 0.8,
  },
  image: {
    width: '100%',
    height: 130,
    backgroundColor: COLORS.border,
  },
  imageSold: {
    // optional: grayscale or blur
  },
  soldOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  soldBadgeLarge: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  soldBadgeTextLarge: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },
  soldBadgeSmall: {
    backgroundColor: '#eee',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  soldBadgeTextSmall: {
    fontSize: 9,
    fontWeight: '800',
    color: '#666',
  },
  textMuted: {
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  favBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: RADIUS.full,
    padding: 6,
  },
  favIcon: { opacity: 0.9 },
  favIconActive: { opacity: 1 },
  tag: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255,214,224,0.92)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    maxWidth: 140,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#333',
    letterSpacing: 0.3,
  },
  newTag: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    ...SHADOW.small,
  },
  newTagText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.white,
  },
  trendingSymbol: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: RADIUS.full,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.small,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.2)',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  topRow: {
    marginBottom: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  inlineNewTag: {
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 5,
    paddingVertical: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    padding: 10,
    paddingTop: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    lineHeight: 18,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 4,
    height: 38,
    marginBottom: 2,
  },
  postedSmall: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  price: {
    fontSize: 25,
    fontWeight: '900',
    color: COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
    opacity: 0.6,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  viewCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
});

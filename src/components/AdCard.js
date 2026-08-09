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
import {COLORS, RADIUS, SHADOW} from '../utils/theme';

export default function AdCard({ item, onPress, isFavorite, onToggleFavorite, isTrending, style, compact }) {
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
      style={[styles.card, compact && styles.cardCompact, item.isSold && styles.cardSold, style]}
      onPress={onPress}
      activeOpacity={item.isSold ? 0.95 : 0.88}
    >
      <View style={[styles.media, compact && styles.mediaCompact]}>
        <Image
          source={{ uri: item.images?.[0] }}
          style={[styles.image, item.isSold && styles.imageSold]}
          resizeMode="cover"
        />

        {item.isSold && (
          <View style={styles.soldOverlay}>
            <View style={styles.soldBadgeLarge}>
              <Text style={styles.soldBadgeTextLarge}>SOLD</Text>
            </View>
          </View>
        )}

        <View style={[styles.tag, compact && styles.tagCompact]}>
          <Text style={[styles.tagText, compact && styles.tagTextCompact]} numberOfLines={1}>
            {item.category}
          </Text>
        </View>

        {isTrending && !item.isSold && (
          <View style={styles.trendingSymbol}>
            <Text style={{ fontSize: 14 }}>🔥</Text>
          </View>
        )}

        {onToggleFavorite ? (
          <TouchableOpacity
            style={styles.favBtn}
            onPress={(e) => {
              e.stopPropagation();
              onToggleFavorite(item.id);
            }}
            activeOpacity={0.7}
          >
            <Icon
              name="heart"
              size={18}
              color={isFavorite ? COLORS.error : COLORS.white}
              fill={isFavorite ? COLORS.error : 'transparent'}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={[styles.body, compact && styles.bodyCompact]}>
        <View style={styles.priceRow}>
          <Text style={[styles.price, compact && styles.priceCompact, item.isSold && styles.textMuted]}>
            ₹{Number(item.price).toLocaleString('en-IN')}
          </Text>
          {!compact && (
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
          )}
          {compact && item.isSold && (
            <View style={styles.soldBadgeSmall}>
              <Text style={styles.soldBadgeTextSmall}>SOLD</Text>
            </View>
          )}
        </View>

        <View style={[styles.titleRow, compact && styles.titleRowCompact]}>
          <Text style={[styles.title, compact && styles.titleCompact, item.isSold && styles.textMuted]} numberOfLines={2}>
            {item.title}
          </Text>
        </View>

        {compact ? (
          <View style={styles.metaItem}>
            <Icon name="map-pin" size={10} color={COLORS.textMuted} />
            <Text style={styles.metaTextCompact} numberOfLines={1}>
              {formatLocation(item.location)}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.metaDivider} />
            <View style={styles.meta}>
              <View style={[styles.metaItem, { flex: 1, marginRight: 4 }]}>
                <Icon name="map-pin" size={12} color="#94a3b8" />
                <Text style={styles.metaText} numberOfLines={1}>
                  {formatLocation(item.location)}
                </Text>
              </View>
              <View style={styles.viewsChip}>
                <Icon name="eye" size={11} color="#94a3b8" />
                <Text style={styles.viewsText}>{item.views}</Text>
              </View>
            </View>
            <Text style={styles.postedSmall}>{item.posted}</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardSolid,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.95)',
    ...SHADOW.small,
    flex: 1,
    margin: 6,
    marginBottom: 8,
  },
  cardCompact: {
    borderRadius: RADIUS.md,
  },
  cardSold: {
    opacity: 0.8,
  },
  media: {
    position: 'relative',
    backgroundColor: '#eef3f9',
  },
  mediaCompact: {},
  image: {
    width: '100%',
    height: 130,
    backgroundColor: '#e2e8f0',
  },
  imageSold: {},
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
    fontWeight: '800',
    letterSpacing: 2,
  },
  soldBadgeSmall: {
    backgroundColor: '#f4f7fb',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  soldBadgeTextSmall: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  textMuted: {
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  favBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    borderRadius: RADIUS.full,
    padding: 6,
  },
  tag: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: 140,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    ...SHADOW.small,
  },
  tagCompact: {
    top: 6,
    left: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    maxWidth: 120,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  tagTextCompact: {
    fontSize: 9,
  },
  newTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.white,
  },
  trendingSymbol: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
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
  badgeRow: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  inlineNewTag: {
    backgroundColor: COLORS.success,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 4,
  },
  bodyCompact: {
    padding: 6,
    paddingTop: 5,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    lineHeight: 18,
    letterSpacing: -0.2,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 4,
    minHeight: 36,
    marginBottom: 2,
  },
  titleRowCompact: {
    minHeight: 26,
    marginBottom: 0,
  },
  titleCompact: {
    fontSize: 10,
    lineHeight: 13,
  },
  priceCompact: {
    fontSize: 13,
  },
  metaTextCompact: {
    fontSize: 9,
    color: COLORS.textMuted,
    flex: 1,
  },
  postedSmall: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94a3b8',
    marginTop: 2,
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primaryDark,
    letterSpacing: -0.4,
  },
  metaDivider: {
    height: 1,
    backgroundColor: '#eef2f7',
    marginTop: 6,
    marginBottom: 8,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textMuted,
    flex: 1,
  },
  viewsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: '#f4f7fb',
  },
  viewsText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
});

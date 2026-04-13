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

export default function AdCard({ item, onPress, isFavorite, onToggleFavorite }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <Image
        source={{ uri: item.images?.[0] }}
        style={styles.image}
        resizeMode="cover"
      />

      {/* Favorite button */}
      <TouchableOpacity
        style={styles.favBtn}
        onPress={() => onToggleFavorite(item.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Icon
          name="heart"
          size={18}
          color={isFavorite ? COLORS.error : COLORS.white}
          style={isFavorite ? styles.favIconActive : styles.favIcon}
        />
      </TouchableOpacity>

      {/* Category tag */}
      <View style={styles.tag}>
        <Text style={styles.tagText} numberOfLines={1}>
          {item.subCategory || item.category}
        </Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.price}>₹{Number(item.price).toLocaleString('en-IN')}</Text>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Icon name="map-pin" size={12} color={COLORS.textMuted} />
            <Text style={styles.metaText} numberOfLines={1}>
              {item.location}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Icon name="eye" size={12} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{item.views}</Text>
          </View>
        </View>

        <Text style={styles.posted}>{item.posted}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    marginBottom: 14,
    overflow: 'hidden',
    ...SHADOW.medium,
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: COLORS.border,
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
  body: {
    padding: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  price: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 8,
  },
  meta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textMuted,
    maxWidth: 120,
  },
  posted: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});

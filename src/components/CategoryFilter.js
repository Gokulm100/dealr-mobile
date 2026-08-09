// src/components/CategoryFilter.js
import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import Icon from './Icon';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

export default function CategoryFilter({
  categories = [],
  selectedCategory,
  onSelectCategory,
  subCategories = [],
  selectedSubCategory,
  onSelectSubCategory,
}) {
  const isFiltered = selectedCategory !== 'All' || !!selectedSubCategory;

  const handleClear = () => {
    onSelectCategory('All');
    onSelectSubCategory?.('');
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View style={styles.titleIcon}>
            <Icon name="tag" size={12} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Categories</Text>
        </View>
        {isFiltered ? (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={handleClear}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.clearText}>Clear</Text>
            <Icon name="x" size={12} color={COLORS.primary} />
          </TouchableOpacity>
        ) : (
          <Text style={styles.hint}>Swipe to explore</Text>
        )}
      </View>

      <View style={styles.track}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.trackContent}
        >
          {categories.map(cat => {
            const active = selectedCategory === cat.name;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => onSelectCategory(cat.name)}
                activeOpacity={0.85}
              >
                {active && (
                  <View style={styles.checkDot}>
                    <Icon name="check-circle" size={11} color={COLORS.primary} />
                  </View>
                )}
                <Text
                  style={[styles.chipText, active && styles.chipTextActive]}
                  numberOfLines={1}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {subCategories.length > 0 && (
        <View style={styles.subSection}>
          <Text style={styles.subLabel}>Refine</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.subContent}
          >
            <TouchableOpacity
              style={[styles.subChip, selectedSubCategory === '' && styles.subChipActive]}
              onPress={() => onSelectSubCategory('')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.subChipText,
                  selectedSubCategory === '' && styles.subChipTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {subCategories.map((sub, idx) => {
              const active = selectedSubCategory === sub;
              return (
                <TouchableOpacity
                  key={`${sub}-${idx}`}
                  style={[styles.subChip, active && styles.subChipActive]}
                  onPress={() => onSelectSubCategory(sub)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.subChipText, active && styles.subChipTextActive]}
                    numberOfLines={1}
                  >
                    {sub}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(55, 140, 246, 0.08)',
    ...SHADOW.small,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: 'rgba(55, 140, 246, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.2,
  },
  hint: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(55, 140, 246, 0.1)',
  },
  clearText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  track: {
    backgroundColor: '#f0f3f7',
    borderRadius: RADIUS.lg,
    padding: 4,
  },
  trackContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    backgroundColor: 'transparent',
  },
  chipActive: {
    backgroundColor: COLORS.white,
    ...SHADOW.small,
  },
  checkDot: {
    marginTop: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  chipTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  subSection: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 2,
  },
  subContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: '#f5f7fa',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  subChipActive: {
    backgroundColor: 'rgba(55, 140, 246, 0.1)',
    borderColor: 'rgba(55, 140, 246, 0.35)',
  },
  subChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  subChipTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});

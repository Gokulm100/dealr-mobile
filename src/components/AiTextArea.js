// src/components/AiTextArea.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { COLORS, RADIUS } from '../utils/theme';
import { apiFetch } from '../utils/api';
import Icon from './Icon';

// Field definitions per category/subcategory (same as web app)
const FIELD_MAP = {
  Electronics: {
    Mobiles: [
      { key: 'brand', label: 'Brand', color: '#2563eb' },
      { key: 'model', label: 'Model', color: '#059669' },
      { key: 'storage', label: 'Storage', color: '#64748b' },
      { key: 'condition', label: 'Condition', color: '#a21caf' },
      { key: 'warranty', label: 'Warranty', color: '#0ea5e9' },
      { key: 'accessories', label: 'Accessories', color: '#f59e42' },
      { key: 'color', label: 'Color', color: '#f43f5e' },
    ],
    Tv: [
      { key: 'brand', label: 'Brand', color: '#2563eb' },
      { key: 'size', label: 'Size (inches)', color: '#059669' },
      { key: 'type', label: 'Type', color: '#64748b' },
      { key: 'condition', label: 'Condition', color: '#a21caf' },
      { key: 'warranty', label: 'Warranty', color: '#0ea5e9' },
    ],
    'Washing Machine': [
      { key: 'brand', label: 'Brand', color: '#2563eb' },
      { key: 'type', label: 'Type', color: '#059669' },
      { key: 'capacity', label: 'Capacity (kg)', color: '#64748b' },
      { key: 'condition', label: 'Condition', color: '#a21caf' },
      { key: 'warranty', label: 'Warranty', color: '#0ea5e9' },
    ],
  },
  'Real Estate': {
    'House For Rent': [
      { key: 'location', label: 'Location', color: '#2563eb' },
      { key: 'bedrooms', label: 'Bedrooms', color: '#059669' },
      { key: 'bathrooms', label: 'Bathrooms', color: '#64748b' },
      { key: 'area', label: 'Area (sqft)', color: '#a21caf' },
      { key: 'furnishing', label: 'Furnishing', color: '#0ea5e9' },
      { key: 'rent', label: 'Rent', color: '#f59e42' },
    ],
    'House For Sale': [
      { key: 'location', label: 'Location', color: '#2563eb' },
      { key: 'bedrooms', label: 'Bedrooms', color: '#059669' },
      { key: 'bathrooms', label: 'Bathrooms', color: '#64748b' },
      { key: 'area', label: 'Area (sqft)', color: '#a21caf' },
      { key: 'furnishing', label: 'Furnishing', color: '#0ea5e9' },
      { key: 'price', label: 'Price', color: '#f59e42' },
    ],
  },
  Vehicles: {
    Cars: [
      { key: 'brand', label: 'Brand', color: '#2563eb' },
      { key: 'model', label: 'Model', color: '#059669' },
      { key: 'year', label: 'Year', color: '#64748b' },
      { key: 'mileage', label: 'Mileage', color: '#a21caf' },
      { key: 'fuel', label: 'Fuel Type', color: '#0ea5e9' },
      { key: 'transmission', label: 'Transmission', color: '#f59e42' },
    ],
    Bikes: [
      { key: 'brand', label: 'Brand', color: '#2563eb' },
      { key: 'model', label: 'Model', color: '#059669' },
      { key: 'year', label: 'Year', color: '#64748b' },
      { key: 'mileage', label: 'Mileage', color: '#a21caf' },
      { key: 'fuel', label: 'Fuel Type', color: '#0ea5e9' },
    ],
  },
  Games: {
    'Playstation Games': [
      { key: 'title', label: 'Title', color: '#2563eb' },
      { key: 'platform', label: 'Platform', color: '#059669' },
      { key: 'condition', label: 'Condition', color: '#a21caf' },
    ],
    'Gaming Rig': [
      { key: 'cpu', label: 'CPU', color: '#2563eb' },
      { key: 'gpu', label: 'GPU', color: '#059669' },
      { key: 'ram', label: 'RAM', color: '#64748b' },
      { key: 'storage', label: 'Storage', color: '#a21caf' },
      { key: 'condition', label: 'Condition', color: '#0ea5e9' },
    ],
  },
};

const FIELD_CHECKERS = {
  brand: t => /samsung|apple|xiaomi|oneplus|vivo|oppo|realme|nokia|motorola|google|sony|lg|brand/.test(t),
  model: t => /model|iphone|galaxy|pixel|note|pro|plus|ultra|edge|series|[a-z]{2,}\d{1,}/.test(t),
  storage: t => /\d+\s?gb|\d+\s?tb|storage/.test(t),
  condition: t => /new|used|like new|condition/.test(t),
  warranty: t => /warranty|guarantee/.test(t),
  accessories: t => /accessories|charger|box|earphones|case|cover/.test(t),
  size: t => /\d+\s?(inches|inch|")|size/.test(t),
  type: t => /type|led|lcd|oled|front load|top load/.test(t),
  capacity: t => /\d+\s?kg|capacity/.test(t),
  location: t => /location|city|area|address/.test(t),
  bedrooms: t => /bedroom|bhk|room/.test(t),
  bathrooms: t => /bathroom|toilet|washroom/.test(t),
  area: t => /\d+\s?sqft|area|plot/.test(t),
  furnishing: t => /furnishing|furnished|unfurnished|semi-furnished/.test(t),
  rent: t => /rent|monthly|per month/.test(t),
  price: t => /price|rs|inr|lakh|crore|amount/.test(t),
  year: t => /\b(19|20)\d{2}\b|year/.test(t),
  mileage: t => /\d+\s?(km|kms|kilometers|mileage)/.test(t),
  fuel: t => /fuel|petrol|diesel|cng|electric/.test(t),
  transmission: t => /transmission|manual|automatic/.test(t),
  title: t => /title|game|playstation|ps4|ps5/.test(t),
  platform: t => /platform|console|ps4|ps5|xbox|pc/.test(t),
  cpu: t => /cpu|processor|i3|i5|i7|i9|ryzen/.test(t),
  gpu: t => /gpu|graphics|nvidia|amd|rtx|gtx/.test(t),
  ram: t => /ram|memory|gb/.test(t),
  color: t => /color|red|blue|green|black|white|yellow|pink|purple|orange/.test(t),
};

function isFieldPresent(text, field) {
  const lower = (text || '').toLowerCase();
  return FIELD_CHECKERS[field.key]?.(lower) ?? false;
}

export default function AiTextArea({ value, onChange, category, subcategory, onFocus, title }) {
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const typingIntervalRef = useRef(null);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    };
  }, []);

  const handleAiWrite = async () => {
    if (!title) {
      Alert.alert('Title Required', 'Please enter a title first so AI can generate a better description.');
      return;
    }

    // Stop any ongoing typing animation
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/api/ads/generateDescriptionUsingAI', {
        method: 'POST',
        body: JSON.stringify({
          title,
          category: category || 'General',
          subCategory: subcategory || 'General',
          description: value || '',
        }),
      });

      if (res.success === true && res.data) {
        const fullText = res.data;
        let index = 0;

        // Typewriter effect
        typingIntervalRef.current = setInterval(() => {
          index++;
          const nextChar = fullText.slice(0, index);
          onChange?.({ target: { value: nextChar } });

          if (index >= fullText.length) {
            if (typingIntervalRef.current) {
              clearInterval(typingIntervalRef.current);
              typingIntervalRef.current = null;
            }
          }
        }, 15); // 15ms per character for a smooth effect

        console.log('AI generated description:', res.data);
      } else if (typeof res === 'string') {
        onChange?.({ target: { value: res } });
      }
    } catch (err) {
      Alert.alert('AI Error', 'Failed to generate description. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const requiredFields =
    FIELD_MAP[category]?.[subcategory] ||
    FIELD_MAP['Electronics']['Mobiles'];

  const completed = requiredFields.filter(f => isFieldPresent(value, f));
  const missing = requiredFields.filter(f => !isFieldPresent(value, f));
  const progress = Math.round((completed.length / requiredFields.length) * 100);

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={[
            styles.input,
            touched && missing.length > 0 && styles.inputWarn,
          ]}
          value={value}
          onChangeText={v => {
            setTouched(true);
            onChange?.({ target: { value: v } });
          }}
          onFocus={onFocus}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          placeholder={`Describe your ${subcategory || category || 'item'} in detail...\n(${requiredFields.map(f => f.label).join(', ')})`}
          placeholderTextColor={COLORS.textMuted}
        />

        <TouchableOpacity
          style={styles.aiBtn}
          onPress={handleAiWrite}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <>
              <Icon name="AI" size={14} color={COLORS.primary} />
              <Text style={styles.aiBtnText}>AI Write</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Missing fields hint */}
      {touched && missing.length > 0 && (
        <View style={styles.hintRow}>
          <Text style={styles.hintIcon}>💡</Text>
          <Text style={styles.hintText}>
            Consider adding: {missing.map(f => f.label).join(', ')}
          </Text>
        </View>
      )}

      {/* Field completion chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {requiredFields.map(f => {
          const done = isFieldPresent(value, f);
          return (
            <View
              key={f.key}
              style={[
                styles.chip,
                done
                  ? { backgroundColor: f.color, borderColor: f.color }
                  : { backgroundColor: '#f3f4f6', borderColor: f.color },
              ]}
            >
              <Text style={[styles.chipText, done && { color: COLORS.white }]}>
                {f.label}{done ? ' ✓' : ''}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Progress bar */}
      <View style={styles.progressBg}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${progress}%`,
              backgroundColor: progress === 100 ? COLORS.success : COLORS.accent,
            },
          ]}
        />
      </View>
      <Text style={styles.progressLabel}>
        {completed.length}/{requiredFields.length} fields mentioned
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  aiBtn: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    zIndex: 10,
  },
  aiBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  required: { color: COLORS.error },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 44, // Space for the AI button
    fontSize: 14,
    color: COLORS.text,
    minHeight: 120,
    lineHeight: 22,
  },
  inputWarn: { borderColor: '#e11d48' },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 8,
  },
  hintIcon: { fontSize: 14 },
  hintText: {
    fontSize: 12,
    color: '#4c64ef',
    fontWeight: '500',
    flex: 1,
    flexWrap: 'wrap',
  },
  chipsRow: {
    gap: 6,
    paddingVertical: 6,
    paddingBottom: 10,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    marginRight: 4,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  progressBg: {
    height: 5,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'right',
  },
});

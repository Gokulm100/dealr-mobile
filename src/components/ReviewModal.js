// src/components/ReviewModal.js
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  TextInput, ActivityIndicator, ScrollView, Image,
} from 'react-native';
import Icon from './Icon';
import { COLORS, SHADOW } from '../utils/theme';
import { apiFetch } from '../utils/api';

const TAGS = [
  'Responsive',
  'Item as described',
  'Fair price',
  'No-show',
  'Scam attempt',
];

export default function ReviewModal({ visible, onClose, adId, revieweeName, revieweePic, adTitle, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setRating(0);
    setSelectedTags([]);
    setText('');
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const submit = async () => {
    if (rating < 1) {
      setError('Please select a star rating.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await apiFetch('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          adId,
          rating,
          tags: selectedTags,
          text: text.trim(),
        }),
      });
      reset();
      onSubmitted?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Could not submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Rate your experience</Text>
            <TouchableOpacity onPress={handleClose}>
              <Icon name="x" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.subtitle} numberOfLines={2}>
              How was your experience for "{adTitle}"?
            </Text>

            <View style={styles.revieweeRow}>
              {revieweePic ? (
                <Image source={{ uri: revieweePic }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Icon name="user" size={18} color={COLORS.white} />
                </View>
              )}
              <Text style={styles.revieweeName}>{revieweeName}</Text>
            </View>

            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)} style={styles.starBtn}>
                  <Icon
                    name="star"
                    size={32}
                    color={star <= rating ? '#f59e0b' : COLORS.border}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Tags (optional)</Text>
            <View style={styles.tagsWrap}>
              {TAGS.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.tag, active && styles.tagActive]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text style={[styles.tagText, active && styles.tagTextActive]}>{tag}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Comment (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Share a quick note about your experience..."
              placeholderTextColor={COLORS.textMuted}
              value={text}
              onChangeText={setText}
              maxLength={200}
              multiline
            />
            <Text style={styles.charCount}>{text.length}/200</Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.submitBtn, (submitting || rating < 1) && styles.submitDisabled]}
              onPress={submit}
              disabled={submitting || rating < 1}
            >
              {submitting ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.submitText}>Submit Review</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    maxHeight: '90%',
    ...SHADOW.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 16,
    lineHeight: 20,
  },
  revieweeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  revieweeName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  starBtn: { padding: 4 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tagActive: {
    backgroundColor: '#EEF2FF',
    borderColor: COLORS.primary,
  },
  tagText: { fontSize: 13, color: COLORS.text, fontWeight: '600' },
  tagTextActive: { color: COLORS.primary },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    color: COLORS.text,
    fontSize: 14,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 12,
  },
  error: {
    color: COLORS.error,
    fontSize: 13,
    marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
});

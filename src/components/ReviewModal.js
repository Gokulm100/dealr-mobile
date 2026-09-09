import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  TextInput, ActivityIndicator, ScrollView, Image,
} from 'react-native';
import Icon from './Icon';
import { COLORS, SHADOW } from '../utils/theme';
import { apiFetch } from '../utils/api';
import { trackReviewSubmitted } from '../utils/analytics';

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
      trackReviewSubmitted(adId);
      reset();
      onSubmitted?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Could not submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const initials = revieweeName?.charAt(0)?.toUpperCase() || 'U';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
            <Icon name="x" size={18} color="#94a3b8" />
          </TouchableOpacity>

          <Text style={styles.title}>Rate your experience</Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            How was your experience for "{adTitle}"?
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.revieweeRow}>
              {revieweePic ? (
                <Image source={{ uri: revieweePic }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>{initials}</Text>
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
                    color={star <= rating ? '#f59e0b' : '#cbd5e1'}
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
              placeholderTextColor="#94a3b8"
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
                <Text style={styles.submitText}>Submit review</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
    ...SHADOW.medium,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
    marginBottom: 6,
    paddingRight: 28,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 18,
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
  avatarInitial: { color: '#fff', fontWeight: '800', fontSize: 16 },
  revieweeName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 18,
  },
  starBtn: { padding: 4 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
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
    borderRadius: 999,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tagActive: {
    backgroundColor: 'rgba(55, 140, 246, 0.08)',
    borderColor: COLORS.primary,
  },
  tagText: { fontSize: 13, color: COLORS.text, fontWeight: '600' },
  tagTextActive: { color: COLORS.primary },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    minHeight: 88,
    textAlignVertical: 'top',
    color: COLORS.text,
    fontSize: 14,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    marginBottom: 14,
  },
  error: {
    color: COLORS.error,
    fontSize: 13,
    marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  submitDisabled: { opacity: 0.45 },
  submitText: { color: COLORS.white, fontWeight: '600', fontSize: 15 },
});

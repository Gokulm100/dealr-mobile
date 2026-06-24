import React from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
} from 'react-native';
import Icon from './Icon';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

export default function PostSaleReminderModal({
  visible,
  onClose,
  onRateNow,
  adTitle,
  revieweeName,
  counterpartyName,
  saleAmount,
}) {
  const formattedAmount = saleAmount
    ? `₹${Number(String(saleAmount).replace(/,/g, '')).toLocaleString('en-IN')}`
    : null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Icon name="x" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>

          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>Sale complete!</Text>
          <Text style={styles.sub}>
            {formattedAmount ? (
              <>
                <Text style={styles.strong}>{adTitle}</Text>
                {` was marked as sold to `}
                <Text style={styles.strong}>{counterpartyName || revieweeName}</Text>
                {` for ${formattedAmount}.`}
              </>
            ) : (
              <>
                <Text style={styles.strong}>{adTitle}</Text>
                {` was marked as sold to `}
                <Text style={styles.strong}>{counterpartyName || revieweeName}</Text>
                .
              </>
            )}
          </Text>

          <View style={styles.highlight}>
            <View style={styles.highlightHead}>
              <Icon name="star" size={16} color="#f59e0b" />
              <Text style={styles.highlightTitle}>Rate {revieweeName}</Text>
            </View>
            <Text style={styles.highlightText}>
              Your feedback helps build trust on Dealr and helps other users make safer decisions.
            </Text>
          </View>

          {!!counterpartyName && (
            <Text style={styles.note}>
              We also asked {counterpartyName} to review their experience.
            </Text>
          )}

          <TouchableOpacity style={styles.primaryBtn} onPress={onRateNow}>
            <Text style={styles.primaryBtnText}>Rate now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={onClose}>
            <Text style={styles.secondaryBtnText}>Remind me later</Text>
          </TouchableOpacity>
          <Text style={styles.footnote}>
            You can leave a review anytime from Profile → Pending Reviews.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    ...SHADOW.medium,
  },
  closeBtn: { alignSelf: 'flex-end', marginBottom: 4 },
  emoji: { fontSize: 40, textAlign: 'center', marginBottom: 8 },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  sub: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 16,
  },
  strong: { fontWeight: '700', color: COLORS.text },
  highlight: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 12,
  },
  highlightHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  highlightTitle: { fontSize: 15, fontWeight: '800', color: '#92400e' },
  highlightText: { fontSize: 13, color: '#78350f', lineHeight: 19 },
  note: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 19,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  secondaryBtn: {
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryBtnText: { color: COLORS.textMuted, fontSize: 14, fontWeight: '600' },
  footnote: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
});

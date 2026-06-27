import React from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Icon from './Icon';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

function SparkleMark({ size = 22, color = '#2563eb' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.5L13.55 8.45L19.5 10L13.55 11.55L12 17.5L10.45 11.55L4.5 10L10.45 8.45L12 2.5Z"
        fill={color}
      />
      <Path
        d="M19 3.5L19.55 5.45L21.5 6L19.55 6.55L19 8.5L18.45 6.55L16.5 6L18.45 5.45L19 3.5Z"
        fill={color}
        opacity={0.55}
      />
      <Path
        d="M6 16.5L6.55 18.05L8.1 18.6L6.55 19.15L6 20.7L5.45 19.15L3.9 18.6L5.45 18.05L6 16.5Z"
        fill={color}
        opacity={0.45}
      />
    </Svg>
  );
}

export default function PostSaleReminderModal({
  visible,
  onClose,
  onRateNow,
  adTitle,
  revieweeName,
  counterpartyName,
  saleAmount,
}) {
  const buyerName = counterpartyName || revieweeName || 'Buyer';
  const formattedAmount = saleAmount
    ? `₹${Number(String(saleAmount).replace(/,/g, '')).toLocaleString('en-IN')}`
    : null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.backdrop} pointerEvents="none" />

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Icon name="x" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>

          <View style={styles.hero}>
            <View style={styles.heroMark}>
              <View style={styles.heroGlow} />
              <View style={styles.heroRing}>
                <SparkleMark size={24} color={COLORS.primary} />
              </View>
            </View>
            <Text style={styles.title}>Sale complete</Text>
            <Text style={styles.lead}>Your listing is marked sold. Nice work closing the deal.</Text>
          </View>

          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Listing</Text>
              <Text style={styles.summaryValue} numberOfLines={1}>{adTitle}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Buyer</Text>
              <Text style={styles.summaryValue}>{buyerName}</Text>
            </View>
            {formattedAmount ? (
              <>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Sale amount</Text>
                  <Text style={styles.summaryAmount}>{formattedAmount}</Text>
                </View>
              </>
            ) : null}
          </View>

          <View style={styles.reviewBlock}>
            <View style={styles.reviewHead}>
              <View style={styles.reviewIconWrap}>
                <Icon name="star" size={16} color="#d97706" />
              </View>
              <View style={styles.reviewCopyWrap}>
                <Text style={styles.reviewTitle}>Rate your experience</Text>
                <Text style={styles.reviewCopy}>
                  How was your deal with <Text style={styles.reviewStrong}>{revieweeName || buyerName}</Text>? Your review helps keep Dealr safe for everyone.
                </Text>
              </View>
            </View>
            {!!counterpartyName && (
              <Text style={styles.reviewNote}>
                We also invited {counterpartyName} to share their experience.
              </Text>
            )}
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={onRateNow}>
            <Text style={styles.primaryBtnText}>Leave a review</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={onClose}>
            <Text style={styles.secondaryBtnText}>Maybe later</Text>
          </TouchableOpacity>
          <Text style={styles.footnote}>
            You can review anytime from Profile → Pending reviews.
          </Text>
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
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
    ...SHADOW.medium,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    backgroundColor: '#f8fafc',
    opacity: 0.95,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    zIndex: 2,
    marginBottom: 4,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 20,
    zIndex: 1,
  },
  heroMark: {
    width: 72,
    height: 72,
    marginBottom: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGlow: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(55, 140, 246, 0.14)',
  },
  heroRing: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(55, 140, 246, 0.18)',
    ...SHADOW.small,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  lead: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 280,
  },
  summary: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 16,
    zIndex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 10,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  summaryValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'right',
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  reviewBlock: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.28)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    zIndex: 1,
  },
  reviewHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  reviewIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewCopyWrap: { flex: 1 },
  reviewTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 4,
  },
  reviewCopy: {
    fontSize: 13,
    color: '#78350f',
    lineHeight: 19,
  },
  reviewStrong: {
    fontWeight: '700',
    color: '#92400e',
  },
  reviewNote: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(251, 191, 36, 0.22)',
    fontSize: 12,
    color: '#92400e',
    lineHeight: 17,
    opacity: 0.88,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
    zIndex: 1,
  },
  primaryBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
  secondaryBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 8,
    zIndex: 1,
  },
  secondaryBtnText: { color: '#64748b', fontSize: 14, fontWeight: '600' },
  footnote: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 16,
    zIndex: 1,
  },
});

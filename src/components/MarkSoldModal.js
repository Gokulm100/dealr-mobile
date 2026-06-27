import React, { useEffect, useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, ScrollView, Alert,
} from 'react-native';
import Icon from './Icon';
import { COLORS, SHADOW } from '../utils/theme';
import { apiFetch } from '../utils/api';

export default function MarkSoldModal({ visible, ad, onClose, onSold }) {
  const [buyers, setBuyers] = useState([]);
  const [loadingBuyers, setLoadingBuyers] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [soldAmount, setSoldAmount] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible || !ad?.id) return;
    setSelectedBuyer(null);
    setSoldAmount(String(ad.price || ''));
    setDropdownOpen(false);
    setLoadingBuyers(true);
    apiFetch('/api/ads/getUsersInterestedInAd', {
      method: 'POST',
      body: JSON.stringify({ adId: ad.id }),
    })
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.users || []);
        setBuyers(list);
      })
      .catch(() => setBuyers([]))
      .finally(() => setLoadingBuyers(false));
  }, [visible, ad?.id, ad?.price]);

  const confirm = async () => {
    if (!soldAmount.trim()) return;
    if (!selectedBuyer) return;

    setSubmitting(true);
    try {
      await apiFetch('/api/ads/markAdAsSold', {
        method: 'POST',
        body: JSON.stringify({
          adId: ad.id,
          buyerId: selectedBuyer._id || selectedBuyer.id,
          amount: soldAmount.trim(),
        }),
      });
      onSold({
        adId: ad.id,
        adTitle: ad.title,
        revieweeName: selectedBuyer.name || selectedBuyer.email || 'Buyer',
        revieweePic: selectedBuyer.profilePic || null,
        counterpartyName: selectedBuyer.name || selectedBuyer.email || 'Buyer',
        saleAmount: soldAmount.trim(),
      });
      onClose();
    } catch {
      Alert.alert('Error', 'Could not mark ad as sold.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!ad) return null;

  const canSubmit = !!soldAmount.trim() && !!selectedBuyer && !loadingBuyers && !submitting;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Icon name="x" size={18} color="#94a3b8" />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Icon name="check-circle" size={22} color="#059669" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Mark as sold</Text>
              <Text style={styles.subtitle}>Record the buyer and final price for this listing.</Text>
            </View>
          </View>

          <Text style={styles.listingChip} numberOfLines={1}>{ad.title}</Text>

          <Text style={styles.label}>Buyer</Text>
          {loadingBuyers ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading buyers…</Text>
            </View>
          ) : (
            <View style={styles.selectWrap}>
              <TouchableOpacity
                style={[styles.selectBtn, dropdownOpen && styles.selectBtnOpen, selectedBuyer && styles.selectBtnFilled]}
                onPress={() => setDropdownOpen((v) => !v)}
                activeOpacity={0.7}
              >
                <Icon name="user" size={16} color={selectedBuyer ? COLORS.primary : '#94a3b8'} />
                <Text
                  style={[styles.selectValue, !selectedBuyer && styles.selectPlaceholder]}
                  numberOfLines={1}
                >
                  {selectedBuyer ? (selectedBuyer.name || selectedBuyer.email) : 'Choose a buyer'}
                </Text>
                <Icon name={dropdownOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#94a3b8" />
              </TouchableOpacity>

              {dropdownOpen && (
                <View style={styles.optionsList}>
                  {buyers.length === 0 ? (
                    <Text style={styles.emptyText}>No one has messaged about this ad yet.</Text>
                  ) : (
                    <ScrollView
                      style={styles.optionsScroll}
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                      showsVerticalScrollIndicator
                    >
                      {buyers.map((u, index) => {
                        const selected = (selectedBuyer?._id || selectedBuyer?.id) === (u._id || u.id);
                        return (
                          <TouchableOpacity
                            key={u._id || u.id}
                            style={[styles.optionItem, selected && styles.optionItemSelected, index === buyers.length - 1 && styles.optionItemLast]}
                            onPress={() => {
                              setSelectedBuyer(u);
                              setDropdownOpen(false);
                            }}
                          >
                            <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                              {u.name || u.email || 'Unknown buyer'}
                            </Text>
                            {selected ? <Icon name="check" size={14} color={COLORS.primary} /> : null}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  )}
                </View>
              )}
            </View>
          )}

          <Text style={styles.label}>Sale amount</Text>
          <View style={styles.amountWrap}>
            <Text style={styles.currency}>₹</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor="#cbd5e1"
              keyboardType="numeric"
              value={soldAmount}
              onChangeText={setSoldAmount}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
            onPress={confirm}
            disabled={!canSubmit}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.submitText}>Complete sale</Text>
            )}
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 18,
    paddingRight: 28,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.18)',
  },
  headerText: { flex: 1, minWidth: 0 },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: '#64748b',
  },
  listingChip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  loadingText: { fontSize: 13, color: '#64748b' },
  selectWrap: { marginBottom: 16, zIndex: 10 },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  selectBtnOpen: {
    borderColor: COLORS.primary,
  },
  selectBtnFilled: {},
  selectValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  selectPlaceholder: { color: '#94a3b8' },
  optionsList: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    overflow: 'hidden',
    ...SHADOW.small,
  },
  optionsScroll: { maxHeight: 200 },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  optionItemLast: { borderBottomWidth: 0 },
  optionItemSelected: { backgroundColor: 'rgba(55, 140, 246, 0.08)' },
  optionText: { fontSize: 14, fontWeight: '500', color: COLORS.text },
  optionTextSelected: { color: COLORS.primary, fontWeight: '600' },
  emptyText: {
    padding: 16,
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 19,
  },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    marginBottom: 18,
  },
  currency: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
  amountInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.45 },
  submitText: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
});

// src/screens/MyAdsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, Image, ActivityIndicator, RefreshControl, Modal, TextInput,
} from 'react-native';
import Icon from '../components/Icon';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';
import { apiFetch, mapListing } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function MyAdsScreen({ navigation }) {
  const { user } = useAuth();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Mark Sold Modal State
  const [showSoldModal, setShowSoldModal] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);
  const [soldAmount, setSoldAmount] = useState('');
  const [soldTo, setSoldTo] = useState(null);
  const [offerUsers, setOfferUsers] = useState([]);
  const [fetchingOffers, setFetchingOffers] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const fetchMyAds = useCallback(async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const data = await apiFetch('/api/ads/listUserAds', {
        method: 'POST',
        body: JSON.stringify({ id: user._id }),
      });
      const list = Array.isArray(data) ? data : (data?.ads || []);
      setAds(list.map(mapListing));
    } catch(error) {
    console.log(error)
      Alert.alert('Error', 'Could not load your ads.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchMyAds();
    });
    return unsubscribe;
  }, [navigation, fetchMyAds]);

  const handleToggleStatus = (item) => {
    const isDisabling = !item.disabled;
    const title = isDisabling ? 'Disable Ad' : 'Enable Ad';
    const message = isDisabling
      ? 'Are you sure you want to disable this ad? It will no longer be visible to others.'
      : 'Are you sure you want to enable this ad? It will be visible to everyone again.';

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: isDisabling ? 'Disable' : 'Enable',
        style: isDisabling ? 'destructive' : 'default',
        onPress: async () => {
          try {
            const endpoint = isDisabling ? '/api/ads/disableAd' : '/api/ads/enableAd';
            await apiFetch(endpoint, {
              method: 'POST',
              body: JSON.stringify({ adId: item.id })
            });
            // Update local state
            setAds(prev => prev.map(a =>
              a.id === item.id ? { ...a, disabled: isDisabling } : a
            ));
          } catch (error) {
            Alert.alert('Error', `Could not ${isDisabling ? 'disable' : 'enable'} ad.`);
          }
        },
      },
    ]);
  };

  const handleMarkAsSold = async (item) => {
    if (item.status === 'sold') return;

    setSelectedAd(item);
    setSoldAmount(String(item.price || ''));
    setSoldTo(null);
    setOfferUsers([]);
    setIsDropdownOpen(false);
    setShowSoldModal(true);
    setFetchingOffers(true);

    try {
      // Fetch people who have shown interest in this ad
      const data = await apiFetch('/api/ads/getUsersInterestedInAd', {
        method: 'POST',
        body: JSON.stringify({ adId: item.id })
      });
      setOfferUsers(Array.isArray(data) ? data : (data?.users || []));
    } catch (e) {
      console.warn('Error fetching offers:', e);
    } finally {
      setFetchingOffers(false);
    }
  };

  const confirmMarkSold = async () => {
    if (!soldAmount.trim()) {
      Alert.alert('Error', 'Please enter the sale amount');
      return;
    }
    if (!soldTo) {
      Alert.alert('Error', 'Please select the buyer');
      return;
    }

    setLoading(true);
    try {
      await apiFetch('/api/ads/markAdAsSold', {
        method: 'POST',
        body: JSON.stringify({
          adId: selectedAd.id,
          buyerId: soldTo._id || soldTo.id,
          amount: soldAmount.trim()
        })
      });

      setShowSoldModal(false);
      Alert.alert('🎉 Success', 'Item marked as sold! Congratulations.');

      // Update local state
      setAds(prev => prev.map(a =>
        a.id === selectedAd.id ? { ...a, status: 'sold' } : a
      ));
    } catch (error) {
      Alert.alert('Error', 'Could not mark ad as sold.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.center}>
        <Icon name="user" size={48} color={COLORS.border} />
        <Text style={styles.emptyTitle}>Not logged in</Text>
        <Text style={styles.emptySubText}>Login from the profile tab to see your ads.</Text>
      </View>
    );
  }

  const renderItem = ({ item }) => {
    const isSold = item.isSold === true || item.status === 'sold';

    return (
      <View style={{ marginBottom: 16 }}>
        <View style={[styles.card, isSold && { backgroundColor: '#fcfcfc', opacity: 0.9 }]}>
          <TouchableOpacity
            style={styles.cardInner}
            onPress={() => navigation.navigate('AdDetail', { listing: item })}
            activeOpacity={0.85}
          >
            <View>
              <Image source={{ uri: item.images?.[0] }} style={[styles.thumbnail, isSold && { opacity: 0.6 }]} />
              {isSold && (
                <View style={styles.soldTagOverlay}>
                  <Text style={styles.soldTagText}>SOLD</Text>
                </View>
              )}
            </View>
            <View style={styles.info}>
              <Text style={[styles.title, isSold && { color: COLORS.textMuted }]} numberOfLines={2}>{item.title}</Text>
              <Text style={[styles.price, isSold && { color: COLORS.success, fontSize: 13, fontWeight: '700' }]}>
                {isSold ? 'Sold' : ''} ₹{Number(item.price).toLocaleString('en-IN')}
              </Text>
              <View style={styles.metaRow}>
                <Icon name="map-pin" size={12} color={COLORS.textMuted} />
                <Text style={styles.metaText}>{item.location}</Text>
                <Icon name="eye" size={12} color={COLORS.textMuted} style={{ marginLeft: 8 }} />
                <Text style={styles.metaText}>{item.views}</Text>
              </View>
              <Text style={styles.posted}>{item.posted} • {item.category}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.actions}>
            {!isSold && (
              <>
                <TouchableOpacity
                  style={[styles.statusBtn, { backgroundColor: '#f0f4ff' }]}
                  onPress={() => navigation.navigate('Post', { ad: item })}
                >
                  <Text style={[styles.statusBtnText, { color: COLORS.accent }]}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.statusBtn, { backgroundColor: item.disabled ? '#e6fcf5' : '#fff5f5' }]}
                  onPress={() => handleToggleStatus(item)}
                >
                  <Text style={[styles.statusBtnText, { color: item.disabled ? COLORS.success : COLORS.error }]}>
                    {item.disabled ? 'Enable' : 'Disable'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={[
                styles.statusBtn,
                { backgroundColor: isSold ? COLORS.success + '15' : '#f0f7ff' }
              ]}
              onPress={() => !isSold && handleMarkAsSold(item)}
              disabled={isSold}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={[styles.statusBtnText, { color: isSold ? COLORS.success : COLORS.primary }]}>
                  {isSold ? 'Sold' : 'Mark Sold'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Ads</Text>
        <TouchableOpacity
          style={styles.postBtn}
          onPress={() => navigation.navigate('Post')}
        >
          <Icon name="plus" size={16} color={COLORS.white} />
          <Text style={styles.postBtnText}>Post Ad</Text>
        </TouchableOpacity>
      </View>

      {/* Mark Sold Modal */}
      <Modal
        visible={showSoldModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSoldModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mark as Sold</Text>
              <TouchableOpacity onPress={() => setShowSoldModal(false)}>
                <Icon name="x" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Select Buyer</Text>
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={styles.dropdownHeader}
                onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                activeOpacity={0.7}
              >
                <View style={styles.buyerInfoRow}>
                  <Icon name="user" size={16} color={soldTo ? COLORS.primary : COLORS.textMuted} />
                  <Text style={[styles.selectedBuyerText, !soldTo && { color: COLORS.textMuted }]}>
                    {soldTo ? soldTo.name : 'Select the person who bought this'}
                  </Text>
                </View>
                <Icon name={isDropdownOpen ? "chevron-up" : "chevron-down"} size={16} color={COLORS.textMuted} />
              </TouchableOpacity>

              {isDropdownOpen && (
                <View style={styles.dropdownList}>
                  {fetchingOffers ? (
                    <ActivityIndicator size="small" color={COLORS.primary} style={{ padding: 20 }} />
                  ) : offerUsers.length === 0 ? (
                    <Text style={styles.noOffersText}>No recent interactions found</Text>
                  ) : (
                    offerUsers.map(u => (
                      <TouchableOpacity
                        key={u._id || u.id}
                        style={[styles.buyerItem, (soldTo?._id === u._id || soldTo?.id === u.id) && styles.buyerItemSelected]}
                        onPress={() => {
                          setSoldTo(u);
                          setIsDropdownOpen(false);
                        }}
                      >
                        <Text style={[styles.buyerName, (soldTo?._id === u._id || soldTo?.id === u.id) && styles.buyerNameSelected]}>
                          {u.name}
                        </Text>
                        {(soldTo?._id === u._id || soldTo?.id === u.id) && <Icon name="check" size={14} color={COLORS.primary} />}
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </View>

            <Text style={styles.modalLabel}>Final Sale Amount</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter amount ₹"
              keyboardType="numeric"
              value={soldAmount}
              onChangeText={setSoldAmount}
            />

            <TouchableOpacity
              style={[styles.modalSubmit, (!soldAmount || !soldTo || loading) && styles.modalSubmitDisabled]}
              onPress={confirmMarkSold}
              disabled={!soldAmount || !soldTo || loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.modalSubmitText}>Confirm & Complete Sale</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {loading && ads.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={ads}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchMyAds(); }}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Icon name="speaker" size={48} color={COLORS.border} />
              <Text style={styles.emptyTitle}>No ads yet</Text>
              <Text style={styles.emptySubText}>Tap "Post Ad" to list something for sale.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 48,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { color: COLORS.white, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  postBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  postBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
  list: { padding: 14 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOW.small,
    overflow: 'hidden',
  },
  cardInner: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  thumbnail: { width: 60, height: 60, backgroundColor: COLORS.border, marginLeft: 20, borderRadius: RADIUS.sm },
  soldTagOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
    paddingVertical: 2,
    alignItems: 'center',
    borderBottomLeftRadius: RADIUS.sm,
    borderBottomRightRadius: RADIUS.sm,
    width: 60,
  },
  soldTagText: {
    color: COLORS.white,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  info: { flex: 1, padding: 12 },
  title: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 3 },
  price: { fontSize: 15, fontWeight: '800', color: COLORS.primary, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  metaText: { fontSize: 12, color: COLORS.textMuted, marginLeft: 3 },
  posted: { fontSize: 11, color: COLORS.textMuted },
  actions: { paddingHorizontal: 10, justifyContent: 'center', gap: 8, paddingVertical: 10 },
  statusBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 85,
    borderRadius: RADIUS.md,
  },
  statusBtnText: { fontSize: 12, fontWeight: '700' },
  soldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  soldBadgeTextAction: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.success,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textMuted },
  emptySubText: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center' },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: COLORS.white,
    width: '100%',
    maxWidth: 400,
    borderRadius: RADIUS.lg,
    padding: 24,
    ...SHADOW.medium,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalInput: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dropdownContainer: {
    marginBottom: 24,
    zIndex: 100,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedBuyerText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  dropdownList: {
    marginTop: 4,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: 180,
    overflow: 'hidden',
    ...SHADOW.small,
  },
  buyerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  buyerItemSelected: {
    backgroundColor: '#eff6ff',
  },
  buyerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buyerName: {
    fontSize: 15,
    color: COLORS.text,
  },
  buyerNameSelected: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  noOffersText: {
    padding: 20,
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  modalSubmit: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    padding: 16,
    alignItems: 'center',
    ...SHADOW.small,
  },
  modalSubmitDisabled: {
    opacity: 0.5,
    backgroundColor: COLORS.textMuted,
  },
  modalSubmitText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

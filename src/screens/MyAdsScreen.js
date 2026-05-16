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

  const formatLocation = (loc) => {
    if (!loc) return '';
    const commaIndex = loc.indexOf(',');
    if (commaIndex !== -1 && loc.length > commaIndex + 4) {
      return loc.substring(0, commaIndex + 4) + '...';
    }
    return loc;
  };

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
      <View style={styles.cardContainer}>
        <TouchableOpacity
          style={[styles.card, isSold && styles.cardSold]}
          onPress={() => navigation.navigate('AdDetail', { listing: item })}
          activeOpacity={0.9}
        >
          <View style={styles.imageSection}>
            <Image source={{ uri: item.images?.[0] }} style={styles.thumbnail} />
            {isSold && (
              <View style={styles.soldBadgeOverlay}>
                <Text style={styles.soldBadgeText}>SOLD</Text>
              </View>
            )}
            <View style={styles.viewCountBadge}>
              <Icon name="eye" size={10} color={COLORS.white} />
              <Text style={styles.viewCountText}>{item.views}</Text>
            </View>
          </View>

          <View style={styles.contentSection}>
            <View style={styles.topInfo}>
              <Text style={styles.categoryText}>{item.category}</Text>
              <Text style={styles.dateText}>{item.posted}</Text>
            </View>

            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>

            <View style={styles.priceRow}>
              <Text style={styles.price}>₹{Number(item.price).toLocaleString('en-IN')}</Text>
              <View style={styles.locationInfo}>
                <Icon name="map-pin" size={10} color={COLORS.textMuted} />
                <Text style={styles.locationText} numberOfLines={1}>{formatLocation(item.location)}</Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              {!isSold ? (
                <>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.editBtn]}
                    onPress={() => navigation.navigate('Post', { ad: item })}
                  >
                    <Icon name="edit" size={14} color={COLORS.primary} />
                    <Text style={[styles.actionBtnText, { color: COLORS.primary }]}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, item.disabled ? styles.enableBtn : styles.disableBtn]}
                    onPress={() => handleToggleStatus(item)}
                  >
                    <Icon
                      name={item.disabled ? "eye" : "eye-off"}
                      size={14}
                      color={item.disabled ? COLORS.success : COLORS.error}
                    />
                    <Text style={[styles.actionBtnText, { color: item.disabled ? COLORS.success : COLORS.error }]}>
                      {item.disabled ? 'Enable' : 'Disable'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.soldBtn]}
                    onPress={() => handleMarkAsSold(item)}
                  >
                    <Icon name="check-circle" size={14} color={COLORS.white} />
                    <Text style={[styles.actionBtnText, { color: COLORS.white }]}>Sold</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.soldSummary}>
                  <View style={styles.soldSuccessIcon}>
                    <Icon name="check" size={12} color={COLORS.success} />
                  </View>
                  <Text style={styles.soldSuccessText}>Marked as Sold</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
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
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <View style={styles.iconCircle}>
                <Icon name="inbox" size={40} color={COLORS.border} />
              </View>
              <Text style={styles.emptyTitle}>No ads yet</Text>
              <Text style={styles.emptySubText}>
                You haven't posted any ads yet.{"\n"}Tap the button above to start selling!
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 54,
    paddingBottom: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOW.medium,
    zIndex: 10,
  },
  headerTitle: { color: COLORS.white, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  postBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  postBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
  list: { padding: 16, paddingBottom: 100 },
  cardContainer: {
    marginBottom: 16,
    ...SHADOW.small,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    overflow: 'hidden',
    flexDirection: 'row',
    height: 140,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  cardSold: {
    opacity: 0.8,
    backgroundColor: '#F1F5F9',
  },
  imageSection: {
    width: 120,
    height: '100%',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.border,
  },
  soldBadgeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldBadgeText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    borderWidth: 1.5,
    borderColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  viewCountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  viewCountText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  contentSection: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  topInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
    marginLeft: 10,
    justifyContent: 'flex-end',
  },
  locationText: {
    fontSize: 11,
    color: COLORS.textMuted,
    maxWidth: 80,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  editBtn: {
    backgroundColor: '#EEF2FF',
    borderColor: '#E0E7FF',
  },
  disableBtn: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FFE4E6',
  },
  enableBtn: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  soldBtn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  soldSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  soldSuccessIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldSuccessText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.success,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  emptySubText: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  // ... rest of modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: COLORS.white,
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
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
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dropdownContainer: {
    marginBottom: 24,
    zIndex: 100,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectedBuyerText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '600',
  },
  dropdownList: {
    marginTop: 8,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    maxHeight: 200,
    overflow: 'hidden',
    ...SHADOW.medium,
  },
  buyerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  buyerItemSelected: {
    backgroundColor: '#F0F9FF',
  },
  buyerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  buyerName: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  buyerNameSelected: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  noOffersText: {
    padding: 24,
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  modalSubmit: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    ...SHADOW.small,
  },
  modalSubmitDisabled: {
    opacity: 0.5,
    backgroundColor: '#94A3B8',
  },
  modalSubmitText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

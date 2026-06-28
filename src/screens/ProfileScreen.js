// src/screens/ProfileScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Image, Alert, ActivityIndicator, ScrollView, RefreshControl,
} from 'react-native';
import Icon from '../components/Icon';
import { GoogleSignin, statusCodes, isCancelledResponse } from '@react-native-google-signin/google-signin';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, apiFetch } from '../utils/api';
import ReviewModal from '../components/ReviewModal';
import { useFocusEffect } from '@react-navigation/native';

// Configure Google Sign-In once
GoogleSignin.configure({
  // This is the WEB client ID from your Google Cloud Console
  // (same one used in your web app)
  webClientId: '281405583072-n7rkibd2qc0afs76dve0kgbsi9p15jfk.apps.googleusercontent.com',
  offlineAccess: true,
});

export default function ProfileScreen({ navigation, route }) {
  const { user, loginWithGoogle, logout } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [activeReview, setActiveReview] = useState(null);

  const loadPendingReviews = useCallback(async () => {
    if (!user) return;
    try {
      const data = await apiFetch('/api/reviews/pending');
      setPendingReviews(data.pending || []);
    } catch (e) {
      console.warn('Could not load pending reviews', e);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadPendingReviews();
    }, [loadPendingReviews])
  );

  useEffect(() => {
    const adId = route.params?.openReviewAdId;
    if (!adId || pendingReviews.length === 0) return;
    const match = pendingReviews.find((item) => String(item.adId) === String(adId));
    if (match) {
      setActiveReview(match);
      navigation.setParams({ openReviewAdId: undefined });
    }
  }, [route.params?.openReviewAdId, pendingReviews, navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    loadPendingReviews().finally(() => setRefreshing(false));
  };

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();

      if (isCancelledResponse(response)) return;

      let idToken = response.data?.idToken;
      if (!idToken) {
        const tokens = await GoogleSignin.getTokens();
        idToken = tokens.idToken;
      }
      if (!idToken) {
        throw new Error('No ID token received. Uninstall the app, rebuild, and try again.');
      }

      await loginWithGoogle(idToken);
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED || error.code === statusCodes.IN_PROGRESS) {
        return;
      }
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Google Play Services not available on this device.');
        return;
      }
      if (String(error.code) === '10' || error.message?.includes('DEVELOPER_ERROR')) {
        Alert.alert(
          'Configuration Error',
          'Google Sign-In is not set up for this build. In Firebase, add SHA-1 5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25 for package com.dealr.app, then rebuild the app.',
        );
        return;
      }
      Alert.alert('Sign-In Failed', error.message || 'Could not sign in with Google.');
    } finally {
      setSigningIn(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    try {
      await GoogleSignin.signOut();
    } catch {}
    await logout();
  };

  // ─── Logged OUT view ───────────────────────────────────────────────────────
  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <ScrollView contentContainerStyle={styles.centeredContent}>
          <Text style={styles.welcomeTitle}>Welcome to Dealr</Text>
          <Text style={styles.welcomeSubtitle}>
            Sign in to post ads, chat with sellers, and manage your listings.
          </Text>

          {/* Google Sign-In Button */}
          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGoogleSignIn}
            disabled={signingIn}
            activeOpacity={0.85}
          >
            {signingIn ? (
              <ActivityIndicator color={COLORS.text} size="small" />
            ) : (
              <>
                <Image style={styles.googleIcon}
                  source={{ uri: 'https://cdn.iconscout.com/icon/free/png-256/free-google-icon-svg-download-png-1507807.png' }}
                />
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Feature list */}
          <View style={styles.featureList}>
            {[
              { icon: 'speaker', text: 'Post and manage your ads' },
              { icon: 'message-circle', text: 'Chat with buyers and sellers' },
              { icon: 'map-pin', text: 'Browse ads near you in Kerala' },
              { icon: 'tag', text: 'Browse ads by category' },
              { icon: 'AI', text: 'Get AI-powered insights & recommendations' }
            ].map((f, idx) => (
              <View key={idx} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Icon name={f.icon} size={16} color={COLORS.primary} />
                </View>
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.infoLinks}>
            <TouchableOpacity style={styles.infoLink} onPress={() => navigation.navigate('About')}>
              <Text style={styles.infoLinkText}>About us</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.infoLink} onPress={() => navigation.navigate('Contact')}>
              <Text style={styles.infoLinkText}>Contact us</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ─── Logged IN view ────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* User card */}
        <View style={styles.userCard}>
          <Image source={{ uri: user.profilePic }} style={styles.avatar} />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <View style={styles.verifiedBadge}>
              <Icon name="check-circle" size={12} color={COLORS.success} />
              <Text style={styles.verifiedText}>Verified with Google</Text>
            </View>
          </View>
        </View>

        {pendingReviews.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Pending Reviews</Text>
            <View style={styles.pendingCard}>
              {pendingReviews.map((item) => (
                <TouchableOpacity
                  key={item.adId}
                  style={styles.pendingRow}
                  onPress={() => setActiveReview(item)}
                >
                  <View style={styles.pendingIcon}>
                    <Icon name="star" size={16} color="#f59e0b" />
                  </View>
                  <View style={styles.pendingInfo}>
                    <Text style={styles.pendingTitle} numberOfLines={1}>{item.adTitle}</Text>
                    <Text style={styles.pendingSub}>Rate {item.revieweeName}</Text>
                  </View>
                  <Icon name="chevron-right" size={16} color={COLORS.border} />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Quick actions */}
        <Text style={styles.sectionLabel}>Quick Actions</Text>

        <View style={styles.actionsCard}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('MyAds')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#eff6ff' }]}>
              <Icon name="speaker" size={18} color={COLORS.accent} />
            </View>
            <Text style={styles.actionText}>My Ads</Text>
            <Icon name="chevron-right" size={16} color={COLORS.border} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('Favorites')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#fff1f2' }]}>
              <Icon name="heart" size={18} color={COLORS.error} />
            </View>
            <Text style={styles.actionText}>My Favorites</Text>
            <Icon name="chevron-right" size={16} color={COLORS.border} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('Chat')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#f0fdf4' }]}>
              <Icon name="message-circle" size={18} color={COLORS.success} />
            </View>
            <Text style={styles.actionText}>Messages</Text>
            <Icon name="chevron-right" size={16} color={COLORS.border} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('Post')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#fff7ed' }]}>
              <Icon name="plus-circle" size={18} color='#f97316' />
            </View>
            <Text style={styles.actionText}>Post a New Ad</Text>
            <Icon name="chevron-right" size={16} color={COLORS.border} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('About')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#eff6ff' }]}>
              <Icon name="AI" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.actionText}>About us</Text>
            <Icon name="chevron-right" size={16} color={COLORS.border} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('Contact')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#fef3c7' }]}>
              <Icon name="mail" size={18} color="#d97706" />
            </View>
            <Text style={styles.actionText}>Contact us</Text>
            <Icon name="chevron-right" size={16} color={COLORS.border} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('Consent')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#f5f3ff' }]}>
              <Icon name="lock" size={18} color='#8b5cf6' />
            </View>
            <Text style={styles.actionText}>Privacy & Terms</Text>
            <Icon name="chevron-right" size={16} color={COLORS.border} />
          </TouchableOpacity>
        </View>

        {/* Logout button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Icon name="log-out" size={18} color={COLORS.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Dealr v1.0.0</Text>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Icon name="log-out" size={32} color={COLORS.error} style={{ marginBottom: 12 }} />
            <Text style={styles.modalTitle}>Confirm Logout</Text>
            <Text style={styles.modalSubtitle}>Are you sure you want to logout?</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalLogout} onPress={confirmLogout}>
                <Text style={styles.modalLogoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <ReviewModal
        visible={!!activeReview}
        onClose={() => setActiveReview(null)}
        adId={activeReview?.adId}
        adTitle={activeReview?.adTitle}
        revieweeName={activeReview?.revieweeName}
        revieweePic={activeReview?.revieweePic}
        onSubmitted={() => {
          loadPendingReviews();
          Alert.alert('Thank you!', 'Your review helps keep Dealr safe.');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 54,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOW.small,
  },
  headerTitle: { color: COLORS.white, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },

  // Logged out
  centeredContent: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 40,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 10,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.medium,
    marginBottom: 36,
  },
  googleIcon: { width: 22, height: 22 },
  googleBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  featureList: { width: '100%', gap: 14 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { fontSize: 14, color: COLORS.text, fontWeight: '500' },
  infoLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    width: '100%',
  },
  infoLink: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  infoLinkText: { fontSize: 13, fontWeight: '600', color: '#475569' },

  // Logged in
  scroll: { padding: 16 },
  userCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
    ...SHADOW.medium,
  },
  avatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: COLORS.primary },
  userInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  userEmail: { fontSize: 13, color: COLORS.textMuted, marginBottom: 6 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedText: { fontSize: 12, color: COLORS.success, fontWeight: '600' },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pendingCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    marginBottom: 20,
    ...SHADOW.small,
    overflow: 'hidden',
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pendingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingInfo: { flex: 1 },
  pendingTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  pendingSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  actionsCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    marginBottom: 20,
    ...SHADOW.small,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.text },
  divider: { height: 1, backgroundColor: COLORS.border, marginLeft: 64 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: 15,
    borderWidth: 1.5,
    borderColor: '#fca5a5',
    marginBottom: 16,
  },
  logoutText: { color: COLORS.error, fontWeight: '700', fontSize: 15 },
  version: { textAlign: 'center', fontSize: 12, color: COLORS.textMuted, marginBottom: 24 },

  // Modal
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 28,
    width: '80%',
    alignItems: 'center',
    ...SHADOW.medium,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: COLORS.textMuted, marginBottom: 24, textAlign: 'center' },
  modalBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  modalCancel: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: 13,
    alignItems: 'center',
  },
  modalCancelText: { fontWeight: '700', color: COLORS.text },
  modalLogout: {
    flex: 1,
    backgroundColor: COLORS.error,
    borderRadius: RADIUS.md,
    padding: 13,
    alignItems: 'center',
  },
  modalLogoutText: { fontWeight: '700', color: COLORS.white },
});

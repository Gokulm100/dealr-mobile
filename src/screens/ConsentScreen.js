// src/screens/ConsentScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, SafeAreaView, ScrollView, Platform, Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { getLatestConsentVersion, saveUserConsent, revokeUserConsent } from '../utils/api';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';
import Icon from '../components/Icon';

const RenderHtmlContent = ({ html }) => {
  if (!html) return null;

  // Split by common HTML tags to create blocks
  const blocks = html.split(/(<b>.*?<\/b>|<li>.*?<\/li>|<br\s*\/?>|<ul>|<\/ul>|<ol>|<\/ol>)/g);

  return (
    <View style={styles.htmlWrapper}>
      {blocks.map((block, index) => {
        if (!block || block.trim() === '') return null;

        // Bold
        if (block.startsWith('<b>')) {
          return (
            <Text key={index} style={styles.boldText}>
              {block.replace(/<\/?b>/g, '')}
            </Text>
          );
        }

        // List Item
        if (block.startsWith('<li')) {
          const content = block.replace(/<li[^>]*>/, '').replace('</li>', '');
          return (
            <View key={index} style={styles.listItem}>
              <View style={styles.bullet} />
              <Text style={styles.listItemText}>
                {content.replace(/<[^>]+>/g, '').trim()}
              </Text>
            </View>
          );
        }

        // Line break
        if (block.match(/<br\s*\/?>/)) {
          return <View key={index} style={{ height: 6 }} />;
        }

        // Ignore container tags as we use Views
        if (block.match(/<\/?(ul|ol)>/)) return null;

        // Plain text
        const plainText = block.replace(/<[^>]+>/g, '').trim();
        if (plainText === '') return null;

        return (
          <Text key={index} style={styles.bodyText}>
            {plainText}
          </Text>
        );
      })}
    </View>
  );
};

export default function ConsentScreen({ navigation }) {
  const { hasConsented, setHasConsented, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchConsentData();
  }, []);

  const fetchConsentData = async () => {
    setLoading(true);
    try {
      const res = await getLatestConsentVersion();
      if (res && res.data) {
        setData(res.data);
      } else {
        throw new Error('Could not load policy details.');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  const confirmLogout = async () => {
    try {
      await GoogleSignin.signOut();
    } catch(e) {
    throw e
    }
    await logout();
  };
  const handleAccept = async () => {
    if (!data?.version) return;
    setProcessing(true);
    try {
      await saveUserConsent(data.version);
      setHasConsented(true);
      // Navigation state will update automatically via AppNavigator key
    } catch (e) {
      Alert.alert('Error', 'Action failed. Please check your connection.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRevoke = async () => {
    Alert.alert(
      'Revoke Consent',
      'Are you sure you want to withdraw your consent? You will be logged out and some features will stop working.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke & Logout',
          style: 'destructive',
          onPress: async () => {
            if (!data?.version) return;
            setProcessing(true);
            try {
              await revokeUserConsent(data.version);
              await confirmLogout()
              // After logout, the user will be taken to Home automatically via AppNavigator key
            } catch (e) {
              Alert.alert('Error', 'Failed to revoke consent. Please try again.');
            } finally {
              setProcessing(false);
            }
          }
        }
      ]
    );
  };

  if (loading && !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <View style={styles.errorIconCircle}>
          <Icon name="alert-triangle" size={32} color={COLORS.error} />
        </View>
        <Text style={styles.errorTitle}>Connection Issue</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchConsentData}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.brandRow}>
            <Text style={styles.title}>User Consent</Text>
          </View>
          {navigation?.canGoBack() && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
              <Icon name="x" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.subtitle}>Privacy Policy & Terms of Service</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <Icon name="shield" size={20} color={COLORS.success} />
          <Text style={styles.infoCardText}>
            We prioritize your privacy. Your data is handled in accordance with the DPDP Act (India).
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="lock" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Privacy Notice</Text>
          </View>
          <View style={styles.policyCard}>
            <RenderHtmlContent html={data?.privacyNotice} />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="file-text" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Terms of Service</Text>
          </View>
          <View style={styles.policyCard}>
            <RenderHtmlContent html={data?.termsOfService} />
          </View>
        </View>

        <Text style={styles.versionText}>Policy Version {data?.version}</Text>
      </ScrollView>

      <View style={styles.footer}>
        {hasConsented ? (
          <TouchableOpacity
            style={[styles.revokeBtn, processing && styles.disabledBtn]}
            onPress={handleRevoke}
            disabled={processing}
            activeOpacity={0.8}
          >
            {processing ? (
              <ActivityIndicator color={COLORS.error} />
            ) : (
              <>
                <Icon name="alert-circle" size={18} color={COLORS.error} />
                <Text style={styles.revokeText}>Withdraw Consent</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.acceptBtn, processing && styles.disabledBtn]}
            onPress={handleAccept}
            disabled={processing}
            activeOpacity={0.8}
          >
            {processing ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.acceptText}>Accept & Continue</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfcfe' },
  header: {
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: COLORS.white,
    ...SHADOW.small,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },
  closeBtn: { padding: 4 },

  content: { flex: 1 },
  contentInner: { padding: 20, paddingBottom: 40 },

  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#ecfdf5',
    padding: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#d1fae5',
    marginBottom: 24,
    alignItems: 'center',
    gap: 12,
  },
  infoCardText: { flex: 1, fontSize: 13, color: '#065f46', lineHeight: 18, fontWeight: '500' },

  section: { marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  policyCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  htmlWrapper: { gap: 8 },
  boldText: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginTop: 4 },
  bodyText: { fontSize: 14, color: COLORS.textMuted, lineHeight: 22 },
  listItem: { flexDirection: 'row', paddingLeft: 4, gap: 10, marginVertical: 2 },
  bullet: { width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.primary, marginTop: 8 },
  listItemText: { flex: 1, fontSize: 14, color: COLORS.textMuted, lineHeight: 22 },

  versionText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 10,
    fontStyle: 'italic'
  },

  footer: {
    padding: 24,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  acceptBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...SHADOW.medium,
  },
  revokeBtn: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: COLORS.error,
  },
  disabledBtn: { opacity: 0.6 },
  acceptText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  revokeText: { color: COLORS.error, fontSize: 16, fontWeight: '700' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: COLORS.white },
  loadingText: { marginTop: 16, color: COLORS.textMuted, fontSize: 14, fontWeight: '500' },
  errorIconCircle: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#fef2f2',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20
  },
  errorTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  errorText: { color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },
  retryBtn: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary + '10'
  },
  retryText: { color: COLORS.primary, fontWeight: '700' },
});

import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking,
} from 'react-native';
import Icon from '../components/Icon';
import ScreenHeader from '../components/ScreenHeader';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';
import {
  SUPPORT_EMAIL,
  CONTACT_INTRO,
  CONTACT_TOPICS,
} from '../content/siteInfo';

export default function ContactScreen({ navigation }) {
  const openEmail = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Contact us" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.lead}>{CONTACT_INTRO}</Text>

        <TouchableOpacity style={styles.emailCard} onPress={openEmail} activeOpacity={0.85}>
          <View style={styles.emailIcon}>
            <Icon name="mail" size={22} color={COLORS.primary} />
          </View>
          <View style={styles.emailCopy}>
            <Text style={styles.emailLabel}>Email us</Text>
            <Text style={styles.emailValue}>{SUPPORT_EMAIL}</Text>
            <Text style={styles.emailHint}>Tap to open your email app</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.note}>
          <Icon name="clock" size={16} color="#64748b" />
          <Text style={styles.noteText}>We typically respond within 1–2 business days.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>How can we help?</Text>
          {CONTACT_TOPICS.map((topic, index) => (
            <View
              key={topic.label}
              style={[styles.topic, index === CONTACT_TOPICS.length - 1 && styles.topicLast]}
            >
              <Text style={styles.topicLabel}>{topic.label}</Text>
              <Text style={styles.topicDetail}>{topic.detail}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.card, styles.cardSoft]}>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate('Chat')}
          >
            <Icon name="message-circle" size={16} color={COLORS.primary} />
            <Text style={styles.linkText}>Open messages</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate('Consent')}
          >
            <Icon name="lock" size={16} color={COLORS.primary} />
            <Text style={styles.linkText}>Privacy & terms</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16, paddingBottom: 32 },
  lead: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textMuted,
    marginBottom: 16,
  },
  emailCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 18,
    marginBottom: 12,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  emailIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: 'rgba(55, 140, 246, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailCopy: { flex: 1 },
  emailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  emailValue: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  emailHint: { fontSize: 12, color: '#64748b' },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  noteText: { fontSize: 13, color: '#64748b', flex: 1 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...SHADOW.small,
  },
  cardSoft: { backgroundColor: '#f8fafc', ...SHADOW.small },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  topic: {
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  topicLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  topicDetail: {
    fontSize: 13,
    lineHeight: 19,
    color: '#64748b',
  },
  topicLast: {
    paddingBottom: 0,
    marginBottom: 0,
    borderBottomWidth: 0,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
});

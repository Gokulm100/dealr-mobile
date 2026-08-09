import React from 'react';
import {
  View, Text, ScrollView, StyleSheet,
} from 'react-native';
import DealrLogo from '../components/DealrLogo';
import Icon from '../components/Icon';
import ScreenHeader from '../components/ScreenHeader';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';
import {
  ABOUT_INTRO,
  ABOUT_SECTIONS,
  ABOUT_VALUES,
  TAGLINE,
} from '../content/siteInfo';

export default function AboutScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <ScreenHeader title="About us" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <DealrLogo variant="dark" size="md" showMark showTagline tagline={TAGLINE} />
          <Text style={styles.lead}>{ABOUT_INTRO}</Text>
        </View>

        <View style={styles.highlightGrid}>
          <View style={styles.highlight}>
            <Icon name="AI" size={20} color={COLORS.primary} />
            <Text style={styles.highlightText}>AI-powered seller insights</Text>
          </View>
          <View style={styles.highlight}>
            <Icon name="shield" size={20} color="#059669" />
            <Text style={styles.highlightText}>Trust scores & reviews</Text>
          </View>
          <View style={styles.highlight}>
            <Icon name="map-pin" size={20} color="#d97706" />
            <Text style={styles.highlightText}>Local deals, real people</Text>
          </View>
        </View>

        {ABOUT_SECTIONS.map((section) => (
          <View key={section.title} style={styles.card}>
            <Text style={styles.cardTitle}>{section.title}</Text>
            <Text style={styles.cardBody}>{section.body}</Text>
          </View>
        ))}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>What we believe in</Text>
          {ABOUT_VALUES.map((item) => (
            <View key={item} style={styles.valueRow}>
              <Icon name="check-circle" size={16} color={COLORS.primary} />
              <Text style={styles.valueText}>{item}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16, paddingBottom: 32 },
  hero: { marginBottom: 20, gap: 12 },
  lead: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  highlightGrid: { gap: 10, marginBottom: 16 },
  highlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  highlightText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    lineHeight: 18,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...SHADOW.small,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 22,
    color: '#475569',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 10,
  },
  valueText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#334155',
  },
});

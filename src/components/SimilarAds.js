import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import Icon from './Icon';
import AdCard from './AdCard';
import { apiFetch, mapListing } from '../utils/api';
import { COLORS, RADIUS } from '../utils/theme';

const CARD_WIDTH = 128;

export default function SimilarAds({ listing, navigation }) {
  const [categories, setCategories] = useState([]);
  const [similarAds, setSimilarAds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const listingId = listing.id || listing._id;

  const categoryId =
    listing.categoryId
    || categories.find((c) => c.name === listing.category)?.id
    || undefined;

  useEffect(() => {
    let cancelled = false;
    apiFetch('/api/ads/listCategories')
      .then((data) => {
        if (!cancelled && Array.isArray(data)) {
          setCategories(data.map((cat) => ({
            id: cat._id,
            name: cat.name,
          })));
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const fetchSimilar = useCallback(async () => {
    if (!listingId || !categoryId) return;
    setLoading(true);
    setError(false);
    try {
      const result = await apiFetch('/api/ads', {
        method: 'POST',
        body: JSON.stringify({
          page: 1,
          limit: 24,
          category: categoryId,
          subCategory: listing.subCategory && listing.subCategory !== 'General'
            ? listing.subCategory
            : undefined,
        }),
      });
      const ads = (result?.ads || [])
        .filter((item) => item._id !== listingId)
        .map(mapListing);
      setSimilarAds(ads);
    } catch {
      setError(true);
      setSimilarAds([]);
    } finally {
      setLoading(false);
    }
  }, [listingId, categoryId, listing.subCategory, listing]);

  useEffect(() => {
    let cancelled = false;
    setSimilarAds([]);
    setError(false);

    if (!listingId || !categoryId) {
      setLoading(false);
      return undefined;
    }

    const run = async () => {
      setLoading(true);
      try {
        const result = await apiFetch('/api/ads', {
          method: 'POST',
          body: JSON.stringify({
            page: 1,
            limit: 24,
            category: categoryId,
            subCategory: listing.subCategory && listing.subCategory !== 'General'
              ? listing.subCategory
              : undefined,
          }),
        });
        if (cancelled) return;
        const ads = (result?.ads || [])
          .filter((item) => item._id !== listingId)
          .map(mapListing);
        setSimilarAds(ads);
      } catch {
        if (!cancelled) {
          setError(true);
          setSimilarAds([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [listingId, categoryId, listing.subCategory]);

  const hasCategory = Boolean(categoryId);

  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <Text style={styles.title}>Similar listings</Text>
        {hasCategory && !loading && (
          <TouchableOpacity
            onPress={fetchSimilar}
            style={styles.refreshBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Refresh similar listings"
          >
            <Icon name="refresh" size={16} color="#0369a1" />
          </TouchableOpacity>
        )}
      </View>

      {!hasCategory && (
        <Text style={styles.muted}>Category not available for similar listings.</Text>
      )}

      {hasCategory && loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.muted}>Loading similar ads…</Text>
        </View>
      )}

      {hasCategory && error && !loading && (
        <Text style={styles.muted}>
          Could not load similar ads.{' '}
          <Text style={styles.retry} onPress={fetchSimilar}>Try again</Text>
        </Text>
      )}

      {hasCategory && !loading && !error && similarAds.length === 0 && (
        <Text style={styles.muted}>
          No similar ads in this category right now.
        </Text>
      )}

      {hasCategory && !loading && similarAds.length > 0 && (
        <View style={styles.railWrap}>
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rail}
          >
            {similarAds.map((item) => (
              <View key={item.id} style={styles.cardWrap}>
                <AdCard
                  item={item}
                  compact
                  style={styles.compactCard}
                  onPress={() => navigation.push('AdDetail', { listing: item })}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#f0f9ff',
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#bae6fd',
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0369a1',
  },
  refreshBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  muted: {
    fontSize: 13,
    color: '#0c4a6e',
    lineHeight: 20,
    opacity: 0.85,
  },
  retry: {
    color: '#0369a1',
    fontWeight: '600',
  },
  railWrap: {
    overflow: 'hidden',
    maxWidth: '100%',
  },
  rail: {
    paddingRight: 4,
    paddingBottom: 10,
    paddingTop: 2,
  },
  cardWrap: {
    width: CARD_WIDTH,
    marginRight: 10,
    paddingBottom: 2,
  },
  compactCard: {
    margin: 0,
    marginBottom: 0,
    flex: undefined,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
  },
});

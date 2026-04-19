// src/screens/HomeScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, ScrollView, RefreshControl,
  StatusBar, Image,
} from 'react-native';
import Icon from '../components/Icon';
import AdCard from '../components/AdCard';
import { apiFetch, mapListing, API_BASE_URL } from '../utils/api';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';
import { useAuth } from '../context/AuthContext';

const LIMIT = 8;

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([{ id: 'all', name: 'All' }]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [subCategories, setSubCategories] = useState([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const isFirstLoad = useRef(true);
  const listRef = useRef(null);

  // Fetch categories once
  useEffect(() => {
    apiFetch('/api/ads/listCategories')
      .then(data => {
        if (Array.isArray(data)) {
          const cats = data.map(cat => ({
            id: cat._id,
            name: cat.name,
            subCategories: cat.subCategory || [],
          }));
          setCategories([{ id: 'all', name: 'All' }, ...cats]);
        }
      })
      .catch(() => {});
  }, []);

  // Update subcategories when category changes
  useEffect(() => {
    const cat = categories.find(c => c.name === selectedCategory);
    setSubCategories(cat?.subCategories || []);
    setSelectedSubCategory('');
  }, [selectedCategory, categories]);

  const fetchListings = useCallback(async (pageNum = 1, reset = false) => {
    if (loading && !reset) return;
    setLoading(true);
    try {
      const result = await apiFetch('/api/ads', {
        method: 'POST',
        body: JSON.stringify({
          page: pageNum,
          limit: LIMIT,
          search: searchQuery || undefined,
          category: selectedCategory !== 'All' ? categories.find(c => c.name === selectedCategory)?.id : undefined,
          subCategory: selectedSubCategory || undefined,
          userId: user?._id || undefined,
        }),
      });
      const data = result?.ads || [];
      const mapped = data.map(mapListing);
      setHasMore(data.length >= LIMIT);
      setListings(prev => (reset || pageNum === 1) ? mapped : [...prev, ...mapped]);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedCategory, selectedSubCategory, categories, user, loading]);

  // Re-fetch when filters change
  useEffect(() => {
    setPage(1);
    setListings([]); // Clear old results immediately for visual feedback
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
    fetchListings(1, true);

    if (isFirstLoad.current) {
      isFirstLoad.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCategory, selectedSubCategory]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const next = page + 1;
      setPage(next);
      fetchListings(next);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchListings(1, true);
  };

  const toggleFavorite = id => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
  };

  const renderHeader = () => (
    <View>
      {/* Search Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Icon name="search" size={16} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search ads..."
            placeholderTextColor={COLORS.textMuted}
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchInput.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchInput(''); setSearchQuery(''); }}>
              <Icon name="x" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Icon name="search" size={18} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Category Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.pill, selectedCategory === cat.name && styles.pillActive]}
            onPress={() => setSelectedCategory(cat.name)}
          >
            <Text style={[styles.pillText, selectedCategory === cat.name && styles.pillTextActive]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Subcategory Pills */}
      {subCategories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.subCategoryScroll}
          contentContainerStyle={styles.categoryContent}
        >
          <TouchableOpacity
            style={[styles.pill, styles.pillSub, selectedSubCategory === '' && styles.pillSubActive]}
            onPress={() => setSelectedSubCategory('')}
          >
            <Text style={[styles.pillText, selectedSubCategory === '' && styles.pillTextActive]}>All</Text>
          </TouchableOpacity>
          {subCategories.map((sub, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.pill, styles.pillSub, selectedSubCategory === sub && styles.pillSubActive]}
              onPress={() => setSelectedSubCategory(sub)}
            >
              <Text style={[styles.pillText, selectedSubCategory === sub && styles.pillTextActive]}>
                {sub}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Results count */}
      {searchQuery ? (
        <Text style={styles.resultsLabel}>Results for "{searchQuery}"</Text>
      ) : null}
    </View>
  );

  const renderFooter = () => {
    if (!loading || listings.length === 0) return null;
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.empty}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.emptySubText}>Loading ads...</Text>
        </View>
      );
    }
    return (
      <View style={styles.empty}>
        <Icon name="inbox" size={48} color={COLORS.border} />
        <Text style={styles.emptyText}>No ads found</Text>
        <Text style={styles.emptySubText}>Try a different search or category</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />

      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>Dea<Text style={{ color: '#ff6666' }}>l</Text>r</Text>
          <Text style={styles.subtext}>Deal with the Right App!</Text>
        </View>
        <View style={styles.headerRight}>
          {user && (
            <Image
              source={{ uri: user.profilePic }}
              style={styles.avatar}
            />
          )}
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={listings}
        keyExtractor={item => item.id}
        numColumns={2}
        key="two-columns-grid"
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <AdCard
              item={item}
              isFavorite={favorites.includes(item.id)}
              onToggleFavorite={toggleFavorite}
              onPress={() => navigation.navigate('AdDetail', { listing: item })}
            />
          </View>
        )}
        ListHeaderComponent={renderHeader()}
        ListFooterComponent={renderFooter()}
        ListEmptyComponent={renderEmpty()}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
          />
        }
      />
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
  logo: { color: 'white', fontSize: 35, fontWeight: '800', letterSpacing: 0.5 },
  subtext: { color: COLORS.white, fontSize: 12, fontWeight: '600' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: COLORS.white },
  listContent: { paddingHorizontal: 4, paddingBottom: 20 },
  cardWrapper: { flex: 0.5 },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    marginBottom: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    height: 44,
    ...SHADOW.small,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text, height: '100%' },
  searchBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.small,
  },
  categoryScroll: { marginBottom: 4 },
  subCategoryScroll: { marginBottom: 10 },
  categoryContent: { paddingHorizontal: 0, gap: 8, paddingVertical: 4 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  pillSub: { backgroundColor: '#f0f4ff', borderColor: '#c7d4f0' },
  pillSubActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  pillText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  pillTextActive: { color: COLORS.white },
  resultsLabel: { fontSize: 13, color: COLORS.textMuted, marginBottom: 8, marginLeft: 2 },
  loader: { paddingVertical: 20, alignItems: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '700', color: COLORS.textMuted },
  emptySubText: { fontSize: 13, color: COLORS.textMuted },
});
